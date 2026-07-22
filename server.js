const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');
const katex = require('katex');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: path.join(__dirname, '.uploads') });

if (!fs.existsSync(path.join(__dirname, '.uploads')))
  fs.mkdirSync(path.join(__dirname, '.uploads'), { recursive: true });

app.use(express.static(path.join(__dirname, 'public')));

const RTL_LANGS = ['fa', 'ar', 'he', 'ur', 'ps', 'sd', 'yi', 'dv'];
const validSizes = ['A3', 'A4', 'A5', 'LETTER', 'LEGAL', 'TABLOID'];

const themes = {
  light: {
    bg: '#ffffff', text: '#1a1a1a', textSecondary: '#64748b',
    heading1: '#0a0a0a', heading2: '#111827', heading3: '#1f2937', heading4: '#374151',
    border: '#e5e7eb', link: '#2563eb',
    codeBg: '#f3f4f6', codeColor: '#dc2626', preBg: '#1f2937', preColor: '#e5e7eb',
    blockquoteBg: 'linear-gradient(135deg, #f0f5ff 0%, #fafcff 100%)',
    blockquoteColor: '#1e40af', blockquoteBorder: '#3b82f6',
    tableBorder: '#d1d5db', tableHeadBg: '#f3f4f6', tableStripe: '#f9fafb',
    hrColor: '#e5e7eb', shadow: 'rgba(0,0,0,0.08)',
    coverBg: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
    coverText: '#ffffff', coverAccent: '#60a5fa',
  },
  dark: {
    bg: '#0d1117', text: '#e6edf3', textSecondary: '#8b949e',
    heading1: '#f0f6fc', heading2: '#e6edf3', heading3: '#d2d8e0', heading4: '#bdc4cc',
    border: '#30363d', link: '#58a6ff',
    codeBg: '#161b22', codeColor: '#f98181', preBg: '#161b22', preColor: '#e6edf3',
    blockquoteBg: 'linear-gradient(135deg, #0d1d35 0%, #111d2e 100%)',
    blockquoteColor: '#79c0ff', blockquoteBorder: '#58a6ff',
    tableBorder: '#30363d', tableHeadBg: '#161b22', tableStripe: '#0d1117',
    hrColor: '#30363d', shadow: 'rgba(0,0,0,0.3)',
    coverBg: 'linear-gradient(135deg, #000000 0%, #0d1d35 50%, #0d1117 100%)',
    coverText: '#f0f6fc', coverAccent: '#58a6ff',
  },
  sepia: {
    bg: '#fbf7f0', text: '#3b2e1e', textSecondary: '#7d6b55',
    heading1: '#2c1f0e', heading2: '#3b2e1e', heading3: '#4a3d2d', heading4: '#5a4d3d',
    border: '#d4c5a9', link: '#8b5e3c',
    codeBg: '#f0e9db', codeColor: '#a04030', preBg: '#2c2416', preColor: '#e6dcc8',
    blockquoteBg: 'linear-gradient(135deg, #f5ede0 0%, #faf4ea 100%)',
    blockquoteColor: '#6b4e2e', blockquoteBorder: '#c4955a',
    tableBorder: '#d4c5a9', tableHeadBg: '#f0e9db', tableStripe: '#f5ede0',
    hrColor: '#d4c5a9', shadow: 'rgba(0,0,0,0.1)',
    coverBg: 'linear-gradient(135deg, #2c2416 0%, #4a3d2d 50%, #6b4e2e 100%)',
    coverText: '#fbf7f0', coverAccent: '#d4a05a',
  }
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const katexOpts = { displayMode: false, throwOnError: false, strict: false };
const katexOptsDisplay = { displayMode: true, throwOnError: false, strict: false };

function preprocessBareLatex(md) {
  md = md.replace(/\(((?:[^()]|\([^()]*\))*\\[a-zA-Z]{2,}(?:[^()]|\([^()]*\))*)\)/g, '\\($1\\)');
  md = md.replace(/\[((?:[^\[\]]|\[[^\[\]]*\])*\\[a-zA-Z]{2,}(?:[^\[\]]|\[[^\[\]]*\])*)\]/g, '\\[$1\\]');
  md = md.replace(/^\s*\[\s*$/gm, '\\[');
  md = md.replace(/^\s*\]\s*$/gm, '\\]');

  const lines = md.split('\n');
  const result = [];
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) { inCode = !inCode; result.push(line); continue; }
    if (inCode) { result.push(line); continue; }
    if (line.startsWith('\\begin{') || line.startsWith('\\end{')) {
      result.push(line); continue;
    }
    if (/^\s*\\[a-zA-Z]/.test(line) && !/^\s*\\(?:text|textbf|textit|emph|href)/.test(line)) {
      result.push('$$' + line.trim() + '$$');
    } else {
      result.push(line);
    }
  }
  return result.join('\n');
}

function renderMath(md) {
  md = md.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), katexOptsDisplay); } catch (_) { return '<div class="math-error">' + escapeHtml(expr) + '</div>'; }
  });
  md = md.replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), katexOptsDisplay); } catch (_) { return '<div class="math-error">' + escapeHtml(expr) + '</div>'; }
  });
  md = md.replace(/\$(.+?)\$/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), katexOpts); } catch (_) { return '<span class="math-error">' + escapeHtml(expr) + '</span>'; }
  });
  md = md.replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), katexOpts); } catch (_) { return '<span class="math-error">' + escapeHtml(expr) + '</span>'; }
  });
  return md;
}

function processFootnotes(md, rtl, esc, mode, markParser) {
  const defs = {};
  let processed = md.replace(/^\[\^(\w+)]:\s*(.+)$/gm, (match, id, text) => {
    defs[id] = (defs[id] || '') + text;
    return '';
  });

  let counter = 0;
  const fnMap = {};
  processed = processed.replace(/\[\^(\w+)]/g, (match, id) => {
    if (!fnMap[id]) fnMap[id] = ++counter;
    const num = fnMap[id];
    return `<sup class="fn-ref"><a href="#fn-${id}" id="fnref-${id}">${num}</a></sup>`;
  });

  let fnSection = '';
  if (Object.keys(defs).length > 0) {
    if (mode === 'page') {
      const ordered = Object.keys(defs).sort((a, b) => (fnMap[a] || 0) - (fnMap[b] || 0));
      let pageContent = processed;
      fnSection = '<section class="fn-page-footnotes">';
      fnSection += '<hr class="fn-hr">';
      fnSection += '<div class="fn-body">';
      for (const id of ordered) {
        const num = fnMap[id] || ordered.indexOf(id) + 1;
        const content = markParser.parseInline(defs[id]);
        fnSection += '<div class="fn-item" id="fn-' + id + '">';
        fnSection += '<span class="fn-num">' + num + '.</span> ';
        fnSection += '<span class="fn-text">' + content + '</span> ';
        fnSection += '<a class="fn-back" href="#fnref-' + id + '" title="' + (rtl ? 'بازگشت' : 'Back to text') + '">↩</a>';
        fnSection += '</div>';
      }
      fnSection += '</div></section>';

      const pageWrap = '<div class="fn-page">' + markParser.parse(pageContent.trim()) + fnSection + '</div>';
      return { markdown: pageWrap, footnotesHtml: '' };
    }

    fnSection = '<hr class="fn-hr"><section class="footnotes" dir="' + (rtl ? 'rtl' : 'ltr') + '">';
    fnSection += '<h4 class="fn-heading">' + (rtl ? 'پانویس‌ها' : 'Footnotes') + '</h4>';
    fnSection += '<div class="fn-body">';
    const ordered = Object.keys(defs).sort((a, b) => (fnMap[a] || 0) - (fnMap[b] || 0));
    for (const id of ordered) {
      const num = fnMap[id] || ordered.indexOf(id) + 1;
      const content = markParser.parseInline(defs[id]);
      fnSection += '<div class="fn-item" id="fn-' + id + '">';
      fnSection += '<span class="fn-num">' + num + '.</span> ';
      fnSection += '<span class="fn-text">' + content + '</span> ';
      fnSection += '<a class="fn-back" href="#fnref-' + id + '" title="' + (rtl ? 'بازگشت' : 'Back to text') + '">↩</a>';
      fnSection += '</div>';
    }
    fnSection += '</div></section>';
  }

  return { markdown: processed.trim(), footnotesHtml: fnSection };
}

function buildHtml(markdown, opts) {
  const lang = opts.lang || 'en';
  let forceRTL = null;
  if (opts.rtl) forceRTL = true;
  if (opts.ltr) forceRTL = false;
  const isRTL = forceRTL !== null ? forceRTL : RTL_LANGS.includes(lang);
  const title = opts.title || '';
  const author = opts.author || '';
  const hasCover = opts.cover === 'true' || opts.cover === true;
  const hasToc = opts.toc === 'true' || opts.toc === true;
  const pageSize = validSizes.includes((opts.pageSize || '').toUpperCase()) ? opts.pageSize.toUpperCase() : 'A4';
  const orientation = opts.orientation || 'portrait';
  const MARGIN = parseInt(opts.margin) || 20;
  const FONT_SIZE = parseFloat(opts.fontSize) || 11;
  const LINE_HEIGHT = parseFloat(opts.lineHeight) || 1.9;
  const theme = opts.theme || 'light';
  const SHOW_PAGE_NUMBERS = opts.pageNumbers === 'true' || opts.pageNumbers === true;
  const NO_GOOGLE_FONTS = opts.noGoogleFonts === 'true' || opts.noGoogleFonts === true;

  const T = themes[theme] || themes.light;
  const fontFamily = isRTL
    ? "'Vazirmatn', 'Inter', 'Tahoma', sans-serif"
    : "'Inter', 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const fnMode = opts.fnMode || 'end';
  let rawMd = renderMath(preprocessBareLatex(markdown));
  const { markdown: mdProcessed, footnotesHtml } = processFootnotes(rawMd, isRTL, escapeHtml, fnMode, marked);
  let bodyHtml;
  if (fnMode === 'page') {
    bodyHtml = mdProcessed + '\n' + footnotesHtml;
  } else {
    bodyHtml = marked.parse(mdProcessed) + '\n' + footnotesHtml;
  }

  let coverHtml = '';
  if (hasCover && (title || author)) {
    coverHtml = `
<div class="cover-page">
  <div class="cover-inner">
    <div class="cover-accent-line"></div>
    ${title ? `<h1 class="cover-title">${escapeHtml(title)}</h1>` : ''}
    ${author ? `<p class="cover-author">${escapeHtml(author)}</p>` : ''}
    <div class="cover-divider"></div>
    <p class="cover-date">${new Date().toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</div>
<div class="page-break"></div>`;
  }

  let tocHtml = '';
  if (hasToc) {
    const tocItems = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(markdown)) !== null) {
      tocItems.push({ level: match[1].length, text: match[2].trim() });
    }
    if (tocItems.length > 0) {
      let tocList = '';
      for (const item of tocItems) {
        const indent = (item.level - 1) * 1.5;
        tocList += `<div style="padding-inline-start: ${indent}em; margin-bottom: 0.3em; ${item.level <= 2 ? 'font-weight: 600;' : ''}">${escapeHtml(item.text)}</div>`;
      }
      tocHtml = `
<div class="toc-page">
  <h2 class="toc-title">${isRTL ? 'فهرست مطالب' : 'Table of Contents'}</h2>
  <div class="toc-divider"></div>
  ${tocList}
</div>
<div class="page-break"></div>`;
    }
  }

  const googleFontsImport = NO_GOOGLE_FONTS ? '' : `
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
  `;

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title || 'document')}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    ${googleFontsImport}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily}; font-size: ${FONT_SIZE}pt;
      line-height: ${LINE_HEIGHT}; color: ${T.text}; background: ${T.bg};
      padding: 0; orphans: 3; widows: 3;
    }
    .page { padding: ${MARGIN}mm; }
    .cover-page {
      display: flex; align-items: center; justify-content: center;
      height: 297mm; background: ${T.coverBg}; color: ${T.coverText};
      text-align: center; padding: 20mm;
    }
    .cover-inner { max-width: 80%; }
    .cover-accent-line {
      width: 60px; height: 4px; background: ${T.coverAccent};
      margin: 0 auto 1.5em; border-radius: 2px;
    }
    .cover-title {
      font-size: ${FONT_SIZE * 3.5}pt; font-weight: 700; color: ${T.coverText};
      border: none; margin: 0 0 0.4em; padding: 0;
      letter-spacing: 0.02em; line-height: 1.3;
    }
    .cover-author {
      font-size: ${FONT_SIZE * 1.3}pt; color: ${T.coverAccent};
      margin-bottom: 0; font-weight: 400; opacity: 0.9;
    }
    .cover-divider {
      width: 40px; height: 2px; background: ${T.coverAccent};
      margin: 1.2em auto; opacity: 0.5;
    }
    .cover-date { font-size: ${FONT_SIZE * 0.9}pt; color: ${T.coverText}; opacity: 0.6; font-weight: 300; }
    .page-break { page-break-after: always; height: 0; }
    .toc-page { padding: ${MARGIN}mm; }
    .toc-title {
      font-size: ${FONT_SIZE * 1.8}pt; color: ${T.heading1};
      border-bottom: 2px solid ${T.border}; padding-bottom: 0.3em; margin-bottom: 0.8em;
    }
    h1 {
      font-size: ${FONT_SIZE * 2.2}pt; font-weight: 700; color: ${T.heading1};
      margin-top: 1.6em; margin-bottom: 0.5em; padding-bottom: 0.25em;
      border-bottom: 2.5px solid ${T.border}; page-break-after: avoid; letter-spacing: -0.01em;
    }
    h2 {
      font-size: ${FONT_SIZE * 1.7}pt; font-weight: 700; color: ${T.heading2};
      margin-top: 1.3em; margin-bottom: 0.4em; padding-bottom: 0.2em;
      border-bottom: 1px solid ${T.border}; page-break-after: avoid;
    }
    h3 {
      font-size: ${FONT_SIZE * 1.4}pt; font-weight: 600; color: ${T.heading3};
      margin-top: 1.2em; margin-bottom: 0.3em; page-break-after: avoid;
    }
    h4, h5, h6 {
      font-size: ${FONT_SIZE * 1.15}pt; font-weight: 600; color: ${T.heading4};
      margin-top: 1em; margin-bottom: 0.3em; page-break-after: avoid;
    }
    p { margin-bottom: 0.7em; text-align: start; hyphens: auto; }
    a { color: ${T.link}; text-decoration: none; border-bottom: 1px solid transparent; }
    a:hover { border-bottom-color: ${T.link}; }
    ul, ol { margin: 0.5em 0; }
    li { margin-bottom: 0.25em; text-align: start; }
    blockquote {
      margin: 1em 0; padding: 0.8em 1em 0.8em 1.2em;
      border-inline-start: 4px solid ${T.blockquoteBorder};
      background: ${T.blockquoteBg}; border-radius: 0 6px 6px 0;
      color: ${T.blockquoteColor}; font-style: italic;
    }
    blockquote p { margin-bottom: 0; }
    code {
      font-family: 'Fira Code', 'SF Mono', 'Consolas', 'Courier New', monospace;
      font-size: 0.88em; background: ${T.codeBg}; padding: 0.15em 0.45em;
      border-radius: 4px; color: ${T.codeColor}; word-break: break-word;
    }
    pre {
      margin: 1em 0; padding: 1em 1.2em; background: ${T.preBg};
      border-radius: 8px; overflow-x: auto; direction: ltr; text-align: left;
      box-shadow: 0 1px 3px ${T.shadow}; page-break-inside: avoid; border: 1px solid ${T.border};
    }
    pre code {
      background: none; color: ${T.preColor}; padding: 0;
      font-size: 0.82em; line-height: 1.7; word-break: normal;
    }
    table {
      width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.9em;
      box-shadow: 0 1px 3px ${T.shadow}; border-radius: 8px; overflow: hidden; page-break-inside: avoid;
    }
    th, td { border: 1px solid ${T.tableBorder}; padding: 0.55em 0.75em; text-align: start; }
    th { background: ${T.tableHeadBg}; font-weight: 600; color: ${T.heading2}; }
    tr:nth-child(even) td { background: ${T.tableStripe}; }
    hr { border: none; border-top: 2px solid ${T.hrColor}; margin: 1.5em 0; }
    img {
      max-width: 100%; height: auto; border-radius: 8px;
      margin: 1em 0; box-shadow: 0 2px 8px ${T.shadow}; page-break-inside: avoid;
    }
    strong { font-weight: 700; }
    em { font-style: italic; }
    input[type="checkbox"] { transform: scale(1.0); margin-inline-end: 0.4em; }
    dt { font-weight: 600; margin-top: 0.6em; }
    dd { margin-inline-start: 1.5em; margin-bottom: 0.3em; }

    /* ===== Footnotes (end mode) ===== */
    .fn-ref { font-size: 0.75em; vertical-align: super; line-height: 1; }
    .fn-ref a { color: ${T.link}; text-decoration: none; border: none; }
    .fn-ref a:hover { text-decoration: underline; }
    hr.fn-hr { margin-top: 2em; border-top: 1px solid ${T.border}; }
    .footnotes { font-size: 0.85em; color: ${T.textSecondary}; margin-top: 1em; }
    .fn-heading { font-size: 1em; font-weight: 600; color: ${T.text}; margin-bottom: 0.5em; }
    .fn-body { display: flex; flex-direction: column; gap: 0.3em; }
    .fn-item { display: flex; align-items: baseline; gap: 0.3em; line-height: 1.6; }
    .fn-num { font-weight: 600; color: ${T.text}; min-width: 1.2em; text-align: end; }
    .fn-text { flex: 1; }
    .fn-text p { display: inline; margin: 0; }
    .fn-back { text-decoration: none; border: none; color: ${T.link}; font-size: 0.85em; opacity: 0.7; }
    .fn-back:hover { opacity: 1; }

    /* ===== Footnotes (page mode) ===== */
    .fn-page { display: flex; flex-direction: column; min-height: 100vh; break-inside: avoid; page-break-inside: avoid; padding: ${MARGIN}mm; }
    .fn-page > :last-child { margin-top: auto; }
    .fn-page-footnotes { font-size: 0.85em; color: ${T.textSecondary}; padding-top: 0.5em; }
    .fn-page-footnotes .fn-hr { margin: 0 0 0.5em; }
    .fn-page-footnotes .fn-body { gap: 0.2em; }
    .fn-page-footnotes .fn-item { font-size: 0.95em; }
    .fn-page-footnotes .fn-num { min-width: 1em; }

    @page { margin: 0; size: ${pageSize} ${orientation === 'landscape' ? 'landscape' : 'portrait'}; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  ${coverHtml}
  ${tocHtml}
  ${fnMode === 'page' ? bodyHtml : '<div class="page">' + bodyHtml + '</div>'}
  <script>
    (function() {
      var els = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, dd, dt, figcaption');
      for (var i = 0; i < els.length; i++) els[i].setAttribute('dir', 'auto');
    })();
  </script>
</body>
</html>`;
}

app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const markdown = fs.readFileSync(req.file.path, 'utf-8');
    const opts = req.body;
    const htmlContent = buildHtml(markdown, opts);

    const tmpHtml = path.join(__dirname, '.uploads', 'temp-' + Date.now() + '.html');
    const outPdf = path.join(__dirname, '.uploads', 'out-' + Date.now() + '.pdf');

    fs.writeFileSync(tmpHtml, htmlContent, 'utf-8');

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle0', timeout: 30000 });

    const showPageNumbers = opts.pageNumbers === 'true' || opts.pageNumbers === true;
    const pageSize = validSizes.includes((opts.pageSize || '').toUpperCase()) ? opts.pageSize.toUpperCase() : 'A4';
    const orientation = opts.orientation || 'portrait';

    await page.pdf({
      path: outPdf,
      format: pageSize,
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      displayHeaderFooter: showPageNumbers,
      headerTemplate: '<span></span>',
      footerTemplate: showPageNumbers
        ? '<div style="width:100%;text-align:center;font-size:8pt;font-family:sans-serif;color:#9ca3af;padding:0 20mm;"><span class="pageNumber"></span></div>'
        : '<span></span>',
      landscape: orientation === 'landscape',
    });

    await browser.close();

    try { fs.unlinkSync(tmpHtml); } catch (_) {}
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    const originalName = req.file.originalname.replace(/\.md$/i, '') + '.pdf';
    res.download(outPdf, originalName, (err) => {
      if (!err) {
        setTimeout(() => { try { fs.unlinkSync(outPdf); } catch (_) {} }, 1000);
      }
    });
  } catch (err) {
    console.error('Conversion error:', err);
    try { if (req.file) fs.unlinkSync(req.file.path); } catch (_) {}
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MdConvertor Web UI: http://localhost:${PORT}`);
});
