# راهنمای سریع Markdown

**نویسنده:** تیم مستندسازی  
**تاریخ:** ۱۸ تیر ۱۴۰۵

---

## مقدمه

مارک‌داون (Markdown) یک زبان نشانه‌گذاری سبک است که توسط **John Gruber** طراحی شده. این زبان به شما اجازه می‌دهد متنی با فرمت ساده بنویسید که به راحتی به HTML تبدیل شود.

> Markdown is one of the most popular markup languages for documentation and web content writing.

---

## متن ترکیبی (Mixed Content)

The following paragraph contains mixed Persian and English text to test bidirectional rendering:

سلام! اسم من **hossein** است و من یک **developer** هستم. من هر روز با **JavaScript** و **Node.js** کد می‌نویسم.

This is an English paragraph with some Persian words like **سلام** and **خداحافظی** mixed in.

یک پاراگراف دیگر با اعداد: version 2.0 در سال 2025 منتشر شد و نسخه بعدی در ۱۴۰۶ خواهد آمد.

---

## قالب‌بندی متن

You can use **bold** or *italic* or ~~strikethrough~~ formatting. همچنین می‌توانید از `inline code` استفاده کنید.

### لیست‌ها

#### لیست ترکیبی:
1. اولین آیتم with some English text
2. دومین آیتم contains mixed content too
3. Third item with فارسی داخلش

#### لیست نامرتب:
- این یک آیتم است with English mixed in
- Another item containing متن فارسی
- مورد آخر: this is the final item

---

## کد و برنامه‌نویسی

```javascript
// تابع ترکیبی with mixed comments
function greet(name) {
  const message = `سلام ${name}! Welcome to the team.`;
  console.log(message);
  return { status: 200, data: message };
}

// فراخوانی تابع
greet("Reza"); // خروجی: سلام Reza! Welcome to the team.
```

### کد درون خطی
از دستور `npm install marked` برای نصب پکیج استفاده کنید و سپس `require('marked')` را فراخوانی کنید.

---

## جدول ترکیبی

| نام (Name) | سن (Age) | شهر (City) | Occupation      |
|------------|----------|------------|-----------------|
| علی        | ۲۸       | تهران     | مهندس نرم‌افزار |
| Sara       | 30       | New York   | Product Manager |
| رضا        | ۲۵       | اصفهان     | Full-stack Developer |
| John       | 35       | London     | DevOps Engineer |

---

## بلاک‌کوت ترکیبی

> This is an English blockquote with a mix of Persian like **سلام دنیا** inside it.

> این یک بلاک‌کوت فارسی است با ترکیبی از English words like **Hello World** در داخل آن.

---

## لینک و تصویر

- **وب‌سایت:** [Markdown Guide](https://www.markdownguide.org)
- **مستندات:** [Node.js Documentation](https://nodejs.org)
- Mixed link: [VSCode](https://code.visualstudio.com) یک ویرایشگر powerful است

---

## بخش انگلیسی

Here is an example of English text with no Persian content. JavaScript is a versatile programming language used for both frontend and backend development.

### Code Example in Python

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")
```

### English Table

| Feature          | Status | Priority |
|------------------|--------|----------|
| RTL Support      | ✅ Done| High     |
| PDF Export       | ✅ Done| High     |
| Mixed Content    | ✅ Done| High     |
| Templates        | 🔄 WIP | Medium   |

---

## فرمول‌های ریاضی (Math)

نظریه بازی‌ها از مفاهیم ریاضی مانند $s_{i}(\theta_{i})$ برای نمایش استراتژی استفاده می‌کند. یک تابع مطلوبیت معمولاً به صورت $u_{i}(s_{i}, s_{-i})$ تعریف می‌شود.

$$ \sum_{i=1}^{n} u_{i}(s_{i}, s_{-i}) = U_{total} $$

و نیز فرمول محاسبه ارزش مورد انتظار در بازی‌های بیزی:

$$ \mathbb{E}[u_{i}] = \int_{\Theta} u_{i}(s_{i}(\theta_{i}), s_{-i}(\theta_{-i})) \, dF(\theta) $$

حالت خاص: تابع لاگرانژ برای بهینه‌سازی مقید:

$$ \mathcal{L}(x, \lambda) = f(x) + \sum_{j=1}^{m} \lambda_{j} \, g_{j}(x) $$

و معادله $E = mc^{2}$ و فرمول $\alpha_{i} + \beta_{j} = \gamma^{2}$ در متن.

---

## پانویس‌ها (Footnotes)

نظریه بازی‌ها موضوعی است که به تحلیل تصمیم‌گیری راهبردی میان بازیگران وابسته به یکدیگر می‌پردازد[^1]. در بازی‌های کلاسیک مانند بازی‌های استراتژیک با اطلاعات کامل[^2]، همه بازیکنان از نوع، اهداف، هزینه‌ها و منافع یکدیگر آگاهی کامل دارند. مدل‌های دیگری از بازی‌ها هست که در آن‌ها بازیکنان دارای اطلاعات ناقص[^3] بوده و عدم قطعیت باعث می‌شود تصمیم بازیکنان و تحلیل موقعیت‌ها بر مبنای باور افراد باشد.

Here is an example of English text with a footnote reference[^4] mixed right in the middle of the sentence for testing purposes.

[^1]: استراتژی آستانه‌ای در بازی‌های بیزی // Threshold Strategy in Bayesian Games
[^2]: اطلاعات کامل // Complete Information
[^3]: اطلاعات ناقص // Incomplete Information
[^4]: This is an English footnote used for testing bidirectional footnote support in the MdConvertor tool.

---

> **نکته:** این فایل نمونه جهت تست خروجی PDF با پشتیبانی از متن‌های ترکیبی فارسی و انگلیسی و پانویس‌ها تهیه شده است.  
> **Note:** This sample file is designed to test mixed Persian and English content and footnotes in PDF output.
