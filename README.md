# Daraja Uz — Telegram Mini App

Bilim darajasini aniqlovchi test platformasi: umumiy fanlar, CEFR va IELTS.

## Loyiha tuzilishi

```
daraja-uz/
├── index.html          # Asosiy sahifa (barcha ekranlar shu yerda)
├── style.css           # Qizil-oq dizayn
├── app.js              # Test mantiqi, progress saqlash, natijalar
├── data/
│   ├── subjects.json   # 12 ta fan ro'yxati
│   └── questions/
│       └── matematika.json   # Namuna savollar (10 ta) — qolgan 11 ta fan uchun xuddi shu formatda fayl qo'shiladi
└── README.md
```

## 1-qadam: GitHub Pages orqali joylashtirish

1. Ushbu papkani GitHub repositoriyasiga yuklang.
2. Repo → Settings → Pages → Source: `main` branch, root papka.
3. Bir necha daqiqadan so'ng sizga link beriladi: `https://<username>.github.io/<repo-nomi>/`

## 2-qadam: BotFather orqali Web App sozlash

1. Telegram'da @BotFather bilan yangi bot yarating: `/newbot`
2. Bot yaratilgach: `/mybots` → botingizni tanlang → **Bot Settings** → **Menu Button** → **Configure Menu Button**
3. Web App URL sifatida GitHub Pages linkingizni kiriting (1-qadamdagi link).
4. Endi foydalanuvchilar bot bilan chatda "Menu" tugmasini bosganda mini app ochiladi.

## Qo'shimcha savollar bazasini to'ldirish

Har bir fan uchun `data/questions/<fan-id>.json` faylini `matematika.json` formatida qo'shing. Fan id'lari `subjects.json`da ko'rsatilgan (masalan: `tarix`, `kimyo`, `ingliz-tili` va h.k.). Har bir fanda kamida 10 ta savol bo'lishi kerak.

CEFR va IELTS bo'limlari uchun (`cefr-listening`, `cefr-reading`, `cefr-writing`, `cefr-speaking`, `ielts-listening`, `ielts-reading`, `ielts-writing`) xuddi shu formatda `data/questions/` papkasiga fayllar qo'shiladi. Listening bo'limlari uchun audio fayllar alohida `data/audio/` papkasida saqlanadi va savol JSON'ida audio yo'li ko'rsatiladi.

## Muhim: keyingi bosqichda backend kerak bo'ladi

Quyidagi ikkita funksiya uchun **backend server** (masalan, Node.js yoki Python) va Anthropic/boshqa AI API kaliti kerak bo'ladi — bular faqat frontend bilan amalga oshmaydi:

1. **IELTS Speaking baholash** — foydalanuvchi ovoz yozadi (`app.js`da tayyor), audio backendga yuboriladi, u yerda transkripsiya qilinib AI orqali baholanadi, natija (band ball) frontendga qaytariladi.
2. **Writing baholash** — foydalanuvchi matn yozadi, backend AI orqali baholab, band ball qaytaradi.

Hozirgi holatda bu ikkala bo'lim uchun frontend interfeys tayyor, lekin baholash logikasi backend ulanishini kutmoqda.

## Progress saqlash

Ilova Telegram'ning **CloudStorage** API'sidan foydalanadi — foydalanuvchi appni yopib qayta ochganda testi qolgan joyidan davom etadi. Brauzerda test qilganda (Telegram tashqarisida) `localStorage` orqali ishlaydi.
