# АЛКОдоставка — статический сайт + Vercel

Сайт: **https://alkodostavka24.vercel.app**

## Деплой на Vercel (из GitHub)

1. Загрузите репозиторий на GitHub (см. ниже).
2. На [vercel.com](https://vercel.com) → **Add New Project** → импортируйте репозиторий.
3. Framework Preset: **Other** (статический сайт).
4. В **Environment Variables** добавьте:
   - `TELEGRAM_BOT_TOKEN` — токен бота от [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_CHAT_ID` — ID чата, куда приходят заявки
5. Deploy. Домен `alkodostavka24.vercel.app` привяжите в Settings → Domains.

## Форма заявки

Форма на `/contacts.html` отправляет POST на `/api/telegram`. Без переменных окружения Telegram заявки не дойдут.

## Локальная разработка

```bash
npm install -g vercel
vercel dev
```

`vercel dev` нужен для работы API `/api/telegram` локально.

## Генерация SEO-страниц

```bash
npm run generate:seo
```

Константы домена и телефона — в `scripts/generate-seo-pages.mjs`.
