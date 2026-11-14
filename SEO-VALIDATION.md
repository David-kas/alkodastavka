# SEO-VALIDATION — проверка после обновления

Дата прогона: **14.11.2025** (локально, `node scripts/yandex-seo-validate.mjs` + `node scripts/site-audit.mjs`).

## Результаты автоматических проверок

| Проверка | Результат |
|----------|-----------|
| HTML-файлов проверено | **464** |
| URL в `sitemap.xml` | **450** |
| Товарных URL в sitemap | **138** |
| JSON-LD синтаксис | **419** OK, **0** ошибок |
| AggregateRating в проекте | **0** |
| Canonical на чужом домене | **0** |
| Дубли `<title>` (точные) | **0** |
| Битые локальные ссылки (эвристика) | **0** |
| `site-audit.mjs` | **✓** критических проблем нет (каталог 147 HTML-карточек = 147 JSON) |

### Canonical без тега (ожидаемо, не в sitemap)

- `content/home-seo-story.html` — фрагмент
- `google53d0d0c99f9b7a6e.html`, `google53d0d0c99f9b7a6e (8).html` — верификация
- `tmp-vodka.html` — черновик

### Sitemap

- `lastmod` берётся из **mtime** файлов (больше не единая `2026-07-01`)
- Исключены: `admin`, служебные верификации (логика `rebuild-sitemap.mjs`), страницы с `noindex`

### Редиректы (конфигурация)

| Источник | Назначение | Статус |
|----------|------------|--------|
| Legacy-хосты | `alkodastavka.vercel.app` | Настроено в middleware + vercel |
| `city-moskva.html` | `/` | 301 |
| `dostavka.html` | `/delivery/` | 301 |
| `vodka.html` и др. категории | `/kategoria/*/` | 301 |
| Inkerman product 128 | product 20 | 301 |

**Проверка на проде после деплоя обязательна** (циклы 403 больше не должны воспроизводиться).

### UI / функциональность

- Не затронуты: корзина, `catalog.html`, API Telegram (при env на Vercel)
- Добавлен только `onerror` на изображениях — при наличии `/photo/*` поведение прежнее

### Что проверить вручную / в Вебмастере

- [ ] HTTP-код главной для YandexBot и desktop Chrome — 200
- [ ] Карта сайта в Вебмастере — 450 URL
- [ ] Нет исключённых из-за 403 важных URL
- [ ] Валидатор микроразметки Яндекса
- [ ] Core Web Vitals (полевые) после снятия 403
- [ ] Ротация Telegram token

Полный JSON-отчёт: `.seo-validation-report.json`