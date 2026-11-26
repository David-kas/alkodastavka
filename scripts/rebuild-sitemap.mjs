/** Include only existing, indexable, self-canonical pages on the primary host.
 * Do not derive lastmod from filesystem mtime: deployments reset it without content changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://alkodastavka.vercel.app';
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const redirects = new Set(config.redirects.filter(r => !r.has && !r.missing).map(r => decodeURIComponent(r.source)));
const excluded = new Set(['node_modules', '.git', 'admin', 'scripts', 'content', 'telegram', 'lib', 'api']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.') || excluded.has(e.name)) return [];
    const file = path.join(dir, e.name);
    return e.isDirectory() ? walk(file) : e.name.endsWith('.html') ? [file] : [];
  });
}
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1].toLowerCase(), m[2]]));
}
const urls = new Set();
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (/^(google|yandex_|tmp-)/i.test(path.basename(file))) continue;
  const route = '/' + rel.replace(/(^|\/)index\.html$/, '$1');
  if (redirects.has(route)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => attrs(m[0]));
  if (metas.some(m => /^(robots|yandex|googlebot)$/i.test(m.name || '') && /\b(noindex|none)\b/i.test(m.content || ''))) continue;
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => attrs(m[0])).find(m => m.rel === 'canonical')?.href;
  // Missing or cross-canonical documents are never a source of sitemap entries.
  if (!canonical || canonical !== BASE + route) continue;
  urls.add(canonical);
}
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const sorted = [...urls].sort();
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + sorted.map(u => `  <url><loc>${escape(u)}</loc></url>`).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`Sitemap: ${sorted.length} canonical URLs; no synthetic lastmod dates.`);
