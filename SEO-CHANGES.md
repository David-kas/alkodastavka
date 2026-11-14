# SEO-CHANGES — перечень правок

## Инфраструктура и индексация

| Файл | Изменение |
|------|-----------|
| `middleware.js` | Удалены 403 для ПК и саморедирект; 301 только с legacy-хостов |
| `vercel.json` | Убраны циклические редиректы; 301 зеркал, категорий, `city-moskva`, `dostavka`, дубля Inkerman 128→20 |
| `robots.txt` | `Disallow: /admin/`, `/api/`; `Host` без https |
| `.gitignore` | `config/telegram.json`, `api/config.local.php` |
| `api/config.local.php` | Токены через переменные окружения (секрет удалён из файла) |

## Новые npm-скрипты

| Файл | Назначение |
|------|------------|
| `scripts/rebuild-sitemap.mjs` | Sitemap по canonical + mtime |
| `scripts/remove-unverified-ratings.mjs` | Удаление AggregateRating |
| `scripts/yandex-seo-validate.mjs` | Пост-аудит → `.seo-validation-report.json` |
| `scripts/fix-missing-canonical.mjs` | Добавление canonical (служебные страницы) |
| `scripts/fix-product-image-fallback.mjs` | Fallback для битых `/photo/` |

## Контент и каталог

| Файл | Изменение |
|------|-----------|
| `products.js` | Удалён дубль id 128 (Inkerman Rosé) |
| `product/128-…html` | Удалён (301 на id 20 в vercel) |
| `shampanskoe/index.html` | Ссылки на товар 20 |
| `korporativ.html` | `style.min.css` вместо неминифицированного CSS |
| `scripts/seo-full-audit.mjs` | Без фейкового aggregateRating в JSON-LD каталога |
| `scripts/fix-site-seo.mjs` | Обновлён шаблон robots |
| `package.json` | Команды `rebuild:sitemap`, `remove:ratings`, `yandex:validate` |
| `sitemap.xml` | **Полная пересборка** (450 URL) |
| `index.html`, `catalog.html` + др. | Удалены aggregateRating; ~150 HTML — onerror для фото |

## Сгенерированные отчёты

- `SEO-AUDIT.md`
- `SEO-PLAN.md`
- `SEO-CHANGES.md`
- `SEO-VALIDATION.md`
- `.seo-validation-report.json`

## Намеренно не изменялось

- Дизайн и корзина основных шаблонов
- Массовые тексты metro/raion (кроме инфраструктуры)
- `content/home-seo-story.html` (не подключался)
- URL товаров (кроме консолидации дубля 128→20)