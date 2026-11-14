/**
 * Пересборка sitemap.xml по каноническим URL и mtime файлов.
 * node scripts/rebuild-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'https://alkodastavka.vercel.app';

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'admin', 'scripts', 'content', 'telegram', 'lib']);
const EXCLUDE_FILES = /^(yandex_[a-f0-9]+|google[a-f0-9]+.*|tmp-.*)\.html$/i;

const PRIORITY = [
  { test: (u) => u === `${BASE}/`, p: '1.0', cf: 'weekly' },
  { test: (u) => u.endsWith('/catalog.html'), p: '0.95', cf: 'daily' },
  { test: (u) => u.includes('/product/'), p: '0.7', cf: 'weekly' },
  { test: (u) => u.includes('/kategoria/'), p: '0.85', cf: 'weekly' },
  { test: (u) => u.includes('/metro/') || u.includes('/raion/'), p: '0.75', cf: 'monthly' },
  { test: (u) => u.includes('/povod/') || u.includes('/vopros/'), p: '0.8', cf: 'monthly' },
];

function priorityFor(url) {
  for (const row of PRIORITY) {
    if (row.test(url)) return { priority: row.p, changefreq: row.cf };
  }
  return { priority: '0.8', changefreq: 'monthly' };
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (EXCLUDE_DIRS.has(name)) continue;
      walk(fp, acc);
    } else if (/\.html$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

function fileToUrl(fp) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  if (rel === 'index.html') return `${BASE}/`;
  if (rel.endsWith('/index.html')) return `${BASE}/${rel.replace(/index\.html$/, '')}`;
  return `${BASE}/${rel}`;
}

function isNoindex(html) {
  return /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);
}

function canonicalFrom(html, fallback) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return m ? m[1].trim() : fallback;
}

const SKIP_PATHS = new Set([
  `${BASE}/dostavka.html`,
  `${BASE}/delivery/`,
  `${BASE}/city-moskva.html`,
]);

const urls = new Map();

for (const fp of walk(ROOT)) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  const baseName = path.basename(fp);
  if (EXCLUDE_FILES.test(baseName) || rel.startsWith('content/')) continue;

  const html = fs.readFileSync(fp, 'utf8');
  if (isNoindex(html)) continue;

  const fallback = fileToUrl(fp);
  const loc = canonicalFrom(html, fallback);
  if (!loc.startsWith(BASE)) continue;
  if (SKIP_PATHS.has(loc)) continue;

  const mtime = fs.statSync(fp).mtime.toISOString().slice(0, 10);
  const { priority, changefreq } = priorityFor(loc);
  urls.set(loc, { loc, lastmod: mtime, changefreq, priority });
}

const sorted = [...urls.values()].sort((a, b) => a.loc.localeCompare(b.loc));

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const u of sorted) {
  xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
}
xml += '</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`rebuild-sitemap: ${sorted.length} URLs (products: ${sorted.filter((u) => u.loc.includes('/product/')).length})`);