# سایت Mohammad Hossein Eslami

سایت استاتیک با [Astro](https://astro.build). همه‌ی محتوا انگلیسی است.

## اجرا روی کامپیوتر خودتان
پیش‌نیاز: Node.js نسخه‌ی ۲۲ یا بالاتر.

```bash
cd hossein-eslami-site
npm install        # فقط بار اول
npm run dev        # پیش‌نمایش زنده در http://localhost:4321
npm run build      # ساخت نسخه‌ی نهایی در پوشه‌ی dist
```

## ساختار سایت
سایت یک صفحه‌ی بلند است (`src/pages/index.astro`) و بازدیدکننده فقط اسکرول می‌کند:
دیوار عکس‌ها ← مفیستو ← City Theater ← Maid to Marry ← Asgardia ← Good Person ← Mixed Sandwich ← کارهای دیگر ← About ← Writing ← CV و پورتفولیو ← Contact.
هر فصل از چند بخش ساخته شده که در همان فایل تنظیم می‌شوند:
- `<Frame>`: عکس تمام‌صفحه که متن داخلش ظاهر می‌شود. `lines` متن‌ها، `box` جای متن روی عکس در دسکتاپ (مثلاً `left:5vw;top:16svh;width:38vw`)، `focus`/`mfocus` نقطه‌ی مهم عکس در دسکتاپ و موبایل.
- `<Story>`: متن اثر (از فایل Markdown)، مشخصات، عوامل و دو عکس با شکل‌های Material (`arch`، `cookie`، `sunny`، `clover`، `pill`، `rounded`).
- `<HGallery>`: نوار افقی عکس‌ها که با اسکرول عمودی حرکت می‌کند.
رنگ هر فصل در ثابت `C` بالای همان فایل است.

## اضافه کردن اثر جدید
هر اثر یک فایل Markdown است در `src/content/works/`. اثری که فصل اختصاصی ندارد **خودکار** در بخش «Studio & earlier work» با عکس `cover` نمایش داده می‌شود؛ پس برای یک اثر جدید کافی است:

1. یک پوشه برای عکس‌ها بسازید: `src/assets/works/<slug>/` (مثلاً `src/assets/works/new-play/`) و عکس‌ها را داخلش بگذارید. JPG با ضلع بلند حدود ۱۸۰۰ پیکسل کافی است؛ سایت خودش AVIF و WebP در اندازه‌های مختلف می‌سازد.
2. یکی از فایل‌های موجود (مثلاً `the-proposal.md`) را کپی کنید و اسمش را `new-play.md` بگذارید.
3. بالای فایل (بین دو خط `---`) را پر کنید:

| فیلد | توضیح |
|---|---|
| `title`, `year`, `venue`, `city` | عنوان، سال، سالن (اختیاری)، شهر |
| `order` | ترتیب نمایش (۱ = اول، به ترتیب اهمیت) |
| `roles` | نقش‌های شما، مثل `["Director", "Scene Designer"]` |
| `category` | یک یا چند مورد از: `theatre`، `video-mapping`، `dramaturgy`، `scenography` |
| `author`, `duration` | نویسنده، مدت اجرا (اختیاری؛ اگر خالی باشد نمایش داده نمی‌شود) |
| `summary` | یک جمله‌ی کوتاه (در متادیتا و اشتراک‌گذاری استفاده می‌شود) |
| `credits` | فهرست عوامل: `- { role: "Lighting", name: "..." }` |
| `cover` | عکس اصلی: `src` (مسیر نسبی مثل `"../../assets/works/new-play/01.jpg"`) و `alt` (توضیح انگلیسی عکس) |
| `gallery` | عکس‌هایی که به ترتیب در صفحه‌ی اثر نمایش داده می‌شوند (`caption` اختیاری) |
| `archive` | عکس‌های دیگر اثر؛ برای استفاده در نوار افقی یک فصل |

4. زیر خط دوم `---` متن اثر را بنویسید. `## Director's Note` یک تیتر فرعی می‌سازد.

اگر بخواهید اثر فصل اختصاصی بگیرد، اسمش را به `FEATURED` در `src/pages/index.astro` اضافه کنید و یک `<Frame>`/`<Story>`/`<HGallery>` برایش بنویسید (از فصل‌های موجود کپی کنید).

## عوض کردن عکس
فایل جدید را در همان پوشه‌ی `src/assets/works/<slug>/` بگذارید و مسیر و `alt` آن را در فایل Markdown اثر عوض کنید. عکس پرتره: `src/assets/portrait.jpg` (با همین اسم جایگزین کنید).

## عوض کردن رزومه و پورتفولیوی PDF
فایل‌ها در `public/downloads/` هستند. فایل جدید را **با همان اسم** جایگزین کنید:
`Mohammad-Hossein-Eslami-CV.pdf` و `Mohammad-Hossein-Eslami-Portfolio.pdf`.
توضیح زیر دکمه‌ها (تعداد صفحه و...) در `src/consts.ts` است.

## نوشته‌ها (Writing)
هر نوشته یک فایل در `src/content/writing/` است و خودکار در بخش Writing می‌آید. برای فعال شدن دکمه‌ی دانلود، PDF را در `public/downloads/` بگذارید و مسیرش را در فیلد `pdf` بنویسید.

## انتشار روی Netlify
1. در Netlify: **Add new site → Import an existing project** و همین مخزن گیت‌هاب را انتخاب کنید.
2. **Base directory** را `hossein-eslami-site` بگذارید. بقیه‌ی تنظیمات از `netlify.toml` خوانده می‌شود (Build command: `npm run build`، Publish directory: `dist`).
3. آدرس سایت (برای sitemap، robots.txt و پیش‌نمایش لینک در شبکه‌های اجتماعی) خودکار از Netlify گرفته می‌شود. اگر بعداً دامنه‌ی اختصاصی وصل کردید، کافی است در Netlify آن را Primary domain کنید و یک بار دوباره Deploy بزنید.

## نکته‌های فنی
- حرکت‌ها با اسکرول کنترل می‌شوند: `src/scripts/engine.ts` برای هر بخش `data-scene` مقدار `--p` (۰ تا ۱) را می‌سازد و CSS با آن جابه‌جایی و محو شدن را تنظیم می‌کند. اسکرول نرم با کتابخانه‌ی Lenis است؛ با تنظیم «کاهش حرکت» سیستم‌عامل خاموش می‌شود.
- رنگ‌ها، فونت (Roboto Flex) و شکل‌ها: `src/styles/site.css` (بالای فایل).
- دیوار عکس‌های صفحه‌ی اول: آرایه‌ی `tiles` در `src/pages/index.astro`.
