# Add the 3 new works to Sanity (via the Studio at /admin)

Three works currently render from the **local fallback** (`assets/js/productions.js`)
because they aren't in Sanity yet: **Marg-e Be'adan**, **Dainosorha**, **Mokammel**.
The site shows them fine, but to make them Sanity-managed (and get Sanity-CDN images +
focal-point control like the others), add them in the Studio.

Why by hand and not an import file: the `production` schema uses `localizedString`,
`localizedBlockContent` (Portable Text per language), `portfolioImage` assets, and each
work must also be referenced from the Home page's **Productions** list. A generated
NDJSON for that can't be safely validated against your live dataset from outside, so
the Studio UI is the reliable route. The exact copy is below.

## Steps (repeat for each of the 3)

1. Open **`https://monaabbasi.netlify.app/admin`** and log in.
2. **Create → Production**. Fill the **Overview** tab:
   - **Title (EN / FA)**, **Role**, **Director**, **Venue**, **Year** — values below.
   - **Medium**: Theatre for Marg-e Be'adan; Short film for the other two.
   - **Slug**: use the key shown (matches the site's `data-work`).
3. **Story** tab → **Summary** and **Full story** (the paragraphs below). Use the FA
   column for Persian.
4. **Photos** tab → **Hero image**: upload the listed image from your repo's `images/`
   folder, set the **alt text**, and drag the **hotspot** to the face/subject (this is
   the focal point that drives the work-card crop).
5. Click **Publish**.
6. Open the **Home page** document → **Productions** list → **Add → reference** the new
   production, and drag it into the position you want. **Publish** the Home page.

(After Netlify redeploys, these will serve from `cdn.sanity.io` like the rest. Until
then the local fallback keeps them visible — nothing breaks.)

---

## Content

### 1. Marg-e Be'adan — slug `marg-beadan` — Medium: Theatre — Hero: `images/image96.png`
- **Role:** Writer & Director / نویسنده و کارگردان
- **Director:** Fateme Abbasi / فاطمه عباسی
- **Venue:** BA directing thesis production / اجرای پایان‌نامهٔ کارشناسی کارگردانی
- **Summary (EN):** My BA directing thesis — a free adaptation that fuses Dante's Divine Comedy with Jack and the Beanstalk.
- **Summary (FA):** اجرای پایان‌نامهٔ کارشناسی کارگردانی؛ برداشتی آزاد از تلفیق «کمدی الهی» دانته و «جک و لوبیای سحرآمیز».
- **Full story (EN):** I wrote my thesis play as a free adaptation that combines Dante's Divine Comedy with the tale of Jack and the Beanstalk. Two months of intensive rehearsal for our 25-minute piece led us into a melancholic, surreal atmosphere. The work had three personae trapped in limbo; in keeping with the concept, all three actors played all three roles, which created the hallucinatory feeling of purgatory.
- **Full story (FA):** با برداشتی آزاد از دو متن «کمدی الهی» دانته و داستان «جک و لوبیای سحرآمیز» و تلفیق این دو، نمایشنامهٔ پایان‌نامه‌ام را نوشتم. دو ماه تمرین فشرده برای اجرای ۲۵دقیقه‌ای، در نهایت ما را به فضایی مالیخولیایی و سورئال رساند. اثر سه پرسوناژ داشت که در برزخ گیر افتاده بودند و هر سه بازیگر، متناسب با مفهوم اثر، هر سه نقش را بازی می‌کردند و همین، فضای توهمی برزخ را می‌ساخت.

### 2. Dainosorha — slug `dainosorha` — Medium: Short film — Hero: `images/image92.jpg`
- **Role:** Short film / فیلم کوتاه
- **Director:** Sara Shahabadi / سارا شاه‌آبادی
- **Summary (EN):** A sci-fi short about a world collapsing under a zombie virus — my first fantasy/apocalyptic role.
- **Summary (FA):** فیلم کوتاهی علمی‑تخیلی دربارهٔ جهانی در آستانهٔ فروپاشی بر اثر یک ویروس زامبی؛ نخستین تجربهٔ من در ژانر فانتزی‑آخرالزمانی.
- **Full story (EN):** Dainosorha is a sci-fi short depicting a world on the brink of collapse after a zombie virus spreads. It follows a group of young people who, after a friend's birthday party, are trapped in a house and — as their food runs out — must face the outside world and its crisis. This was my first experience in the fantasy/apocalyptic genre, with particular challenges around believability and physical action. To approach the role I used given-circumstances analysis, designed the character's physical dimension, and drew on active imagination to reach a tangible sense of emergency and survival.
- **Full story (FA):** فیلم کوتاه «دایناسورها» اثری در ژانر تخیلی است که جهانی را در آستانهٔ فروپاشی بر اثر انتشار یک ویروس زامبی روایت می‌کند. داستان بر گروهی از جوانان متمرکز است که پس از جشن تولد یکی از دوستانشان در خانه‌ای گرفتار می‌شوند و با پایان‌یافتن منابع غذایی، ناچار به مواجهه با جهان بیرون و شرایط بحرانی آن می‌شوند. حضور در این پروژه نخستین تجربهٔ من در ژانر فانتزی–آخرالزمانی بود؛ با چالش‌هایی در باورپذیری موقعیت و کنش‌های بدنی.

### 3. Mokammel — slug `mokammel` — Medium: Short film — Year 2022/۱۴۰۱ — Hero: `images/image95.jpg`
- **Role:** Short film / فیلم کوتاه
- **Director:** Mojtaba Karimi / مجتبی کریمی
- **Summary (EN):** A psychological short about a blind girl, home alone, gripped by fear after a string of neighbourhood burglaries.
- **Summary (FA):** فیلم کوتاهی روان‌شناختی دربارهٔ دختری نابینا که در خانه تنها مانده و پس از چند سرقت در محله با ترسی فزاینده روبه‌رو می‌شود.
- **Full story (EN):** Mokammel is a psychological short about a blind girl who, in her working mother's absence, is left home alone and faces growing fear after several burglaries in the neighbourhood. Focusing on sensory perception and the character's inner world, it portrays an internal experience of insecurity, loneliness and confronting fear. Beyond rehearsals with the director, I used lived-experience and sensory-empathy methods: by limiting my sense of sight in everyday situations I worked to sharpen my other senses and grasp the behaviour, bodily reactions and movement rhythm of a blind person.
- **Full story (FA):** فیلم کوتاه «مکمل» روایتی روان‌شناختی از دختری نابیناست که در غیاب مادر شاغلش در خانه تنها مانده و پس از وقوع چند سرقت در محله، با ترس و اضطرابی فزاینده روبه‌رو می‌شود. افزون بر تمرین با کارگردان، برای درک عمیق‌تر کاراکتر از روش‌های مبتنی بر تجربهٔ زیسته و همذات‌پنداری حسی بهره گرفتم.

> Tip: confirm the photos are right — I picked the hero images from the unused/new
> uploads (image92 is the "birthday" poster that matches Dainosorha's plot). Swap any
> in the Studio's Photos tab if you have a better still.
