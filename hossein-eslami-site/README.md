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

## اضافه کردن اثر جدید
هر اثر یک فایل Markdown است در `src/content/works/`. برای اثر جدید:

1. یک پوشه برای عکس‌ها بسازید: `src/assets/works/<slug>/` (مثلاً `src/assets/works/new-play/`) و عکس‌ها را داخلش بگذارید. JPG با ضلع بلند حدود ۱۸۰۰ پیکسل کافی است؛ سایت خودش AVIF و WebP در اندازه‌های مختلف می‌سازد.
2. یکی از فایل‌های موجود (مثلاً `the-proposal.md`) را کپی کنید و اسمش را `new-play.md` بگذارید. اسم فایل آدرس صفحه می‌شود: `/works/new-play/`.
3. بالای فایل (بین دو خط `---`) را پر کنید:

| فیلد | توضیح |
|---|---|
| `title`, `year`, `venue`, `city` | عنوان، سال، سالن، شهر |
| `order` | ترتیب نمایش (۱ = اول، به ترتیب اهمیت) |
| `roles` | نقش‌های شما، مثل `["Director", "Scene Designer"]` |
| `category` | یک یا چند مورد از: `theatre`، `video-mapping`، `dramaturgy`، `scenography` (فیلترهای صفحه‌ی Works) |
| `author`, `duration` | نویسنده، مدت اجرا |
| `summary` | یک جمله‌ی کوتاه (در متادیتا و اشتراک‌گذاری استفاده می‌شود) |
| `credits` | فهرست عوامل: `- { role: "Lighting", name: "..." }` |
| `cover` | عکس اصلی: `src` (مسیر نسبی مثل `"../../assets/works/new-play/01.jpg"`) و `alt` (توضیح انگلیسی عکس) |
| `gallery` | عکس‌هایی که به ترتیب در صفحه‌ی اثر نمایش داده می‌شوند (`caption` اختیاری) |
| `archive` | عکس‌های بیشتر برای بخش Contact sheet (کوچک، با نمایش بزرگ هنگام کلیک) |
| `video_url` | لینک YouTube یا Vimeo؛ ویدئو فقط وقتی بازدیدکننده روی Play بزند بارگذاری می‌شود |
| `brochure_pdf` | مسیر بروشور، مثلاً `"/downloads/new-play.pdf"` (فایل را در `public/downloads/` بگذارید) |
| `press` | نقدها: `- { source: "...", title: "...", date: "...", url: "...", quote: "..." }` |

4. زیر خط دوم `---` متن اثر را بنویسید. `## Director's Note` یک تیتر فرعی می‌سازد.

## عوض کردن عکس
فایل جدید را در همان پوشه‌ی `src/assets/works/<slug>/` بگذارید و مسیر و `alt` آن را در فایل Markdown اثر عوض کنید. عکس پرتره: `src/assets/portrait.jpg` (با همین اسم جایگزین کنید).

## عوض کردن رزومه و پورتفولیوی PDF
فایل‌ها در `public/downloads/` هستند. فایل جدید را **با همان اسم** جایگزین کنید:
`Mohammad-Hossein-Eslami-CV.pdf` و `Mohammad-Hossein-Eslami-Portfolio.pdf`.
توضیح زیر دکمه‌ها (تعداد صفحه و...) در `src/consts.ts` است.

## نوشته‌ها (Writing)
هر نوشته یک فایل در `src/content/writing/`. برای فعال شدن دکمه‌ی دانلود، PDF را در `public/downloads/` بگذارید و مسیرش را در فیلد `pdf` بنویسید.

## جاهای خالی ([PLACEHOLDER])
هر جا اطلاعات نبود، یک عبارت داخل کروشه گذاشته شده، مثل `[DURATION]` یا `[CREDITS]`. در حال حاضر `SHOW_PLACEHOLDERS = true` در `src/consts.ts` است، پس این جاها با کادر نقطه‌چین نارنجی روی سایت دیده می‌شوند تا بتوانید پرشان کنید.
**قبل از انتشار عمومی** آن را `false` کنید؛ جاهای خالی خودکار از سایت حذف می‌شوند.
برچسب‌های `[DRAFT TRANSLATION – needs review]` هم فقط در همین حالت دیده می‌شوند (فیلد `draft_translation` در فایل اثر).

## انتشار روی Netlify
1. در Netlify: **Add new site → Import an existing project** و همین مخزن گیت‌هاب را انتخاب کنید.
2. **Base directory** را `hossein-eslami-site` بگذارید. بقیه‌ی تنظیمات از `netlify.toml` خوانده می‌شود (Build command: `npm run build`، Publish directory: `dist`).
3. بعد از اولین انتشار، آدرس نهایی سایت را در `src/consts.ts` (متغیر `SITE_URL`) و در `public/robots.txt` بنویسید و دوباره push کنید تا sitemap و Open Graph آدرس درست داشته باشند.

## نکته‌های فنی
- صفحه‌ی اول: لایه‌ی تاریک «پروژکتور» در `src/components/Projector.astro`. محتوا همیشه در صفحه هست و این لایه فقط بصری است. با تنظیم «کاهش حرکت» سیستم‌عامل، یا بعد از یک بار روشن شدن در همان بازدید، نمایش داده نمی‌شود.
- رنگ‌ها و فونت‌ها: `src/styles/global.css` (بالای فایل).
- بخش اسکرول‌تلینگ صفحه‌ی اول (The Programme): آرایه‌ی `steps` در `src/pages/index.astro`.
