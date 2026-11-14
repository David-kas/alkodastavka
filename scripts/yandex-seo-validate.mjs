/**
 * Пост-аудит: мета, ссылки, sitemap, JSON-LD. Пишет .seo-validation-report.json
 * node scripts/yandex-seo-validate.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'https://alkodastavka.vercel.app';

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (['node_modules', '.git', 'admin'].includes(name)) continue;
      walk(fp, acc);
    } else if (/\.html$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

const htmlFiles = walk(ROOT);
const report = {
  checkedHtml: htmlFiles.length,
  titles: new Map(),
  descriptions: new Map(),
  jsonLdOk: 0,
  jsonLdBad: 0,
  missingCanonical: [],
  canonicalOffDomain: [],
  aggregateRatingLeft: 0,
  brokenLocalLinks: new Set(),
  noindex: [],
};

const existing = new Set();
function collectExisting() {
  function w(d, prefix = '') {
    for (const name of fs.readdirSync(d)) {
      const fp = path.join(d, name);
      const st = fs.statSync(fp);
      if (st.isDirectory()) {
        if (name === 'node_modules' || name === '.git') continue;
        w(fp, `${prefix}${name}/`);
      } else {
        const rel = (prefix + name).replace(/\\/g, '/');
        existing.add('/' + rel);
        if (name === 'index.html') existing.add('/' + prefix.replace(/\/$/, ''));
      }
    }
  }
  w(ROOT);
}
collectExisting();

function normHref(h) {
  if (!h || h.startsWith('http') || h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('#')) return null;
  let p = h.split('?')[0].split('#')[0];
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

for (const fp of htmlFiles) {
  const html = fs.readFileSync(fp, 'utf8');
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  const isYandexVerify = /^yandex_[a-f0-9]+\.html$/i.test(path.basename(fp));

  const titleM = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleM ? titleM[1].trim() : '';
  if (title) {
    if (!report.titles.has(title)) report.titles.set(title, []);
    report.titles.get(title).push(rel);
  }

  const descM = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const desc = descM ? descM[1].trim() : '';
  if (desc) {
    if (!report.descriptions.has(desc)) report.descriptions.set(desc, []);
    report.descriptions.get(desc).push(rel);
  }

  if (/noindex/i.test(html)) report.noindex.push(rel);

  const canM = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canM && !isYandexVerify && rel !== 'admin/index.html') report.missingCanonical.push(rel);
  else if (canM && !canM[1].startsWith(BASE)) report.canonicalOffDomain.push({ file: rel, canonical: canM[1] });

  report.aggregateRatingLeft += (html.match(/aggregateRating|AggregateRating/gi) || []).length;

  const re = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      JSON.parse(m[1]);
      report.jsonLdOk++;
    } catch (e) {
      report.jsonLdBad++;
    }
  }

  const hrefRe = /href=["']([^"']+)["']/gi;
  while ((m = hrefRe.exec(html)) !== null) {
    const p = normHref(m[1]);
    if (!p) continue;
    const candidates = [p, p.endsWith('/') ? p.slice(0, -1) : p + '/', p + '.html'];
    if (!candidates.some((c) => existing.has(c))) {
      if (!p.includes('wa.me') && !p.includes('t.me')) report.brokenLocalLinks.add(`${rel} -> ${p}`);
    }
  }
}

const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
const duplicateTitles = [...report.titles.entries()].filter(([, files]) => files.length > 1);

const out = {
  checkedHtml: report.checkedHtml,
  sitemapUrlCount: sitemapUrls.length,
  sitemapProductUrls: sitemapUrls.filter((u) => u.includes('/product/')).length,
  jsonLdOk: report.jsonLdOk,
  jsonLdBad: report.jsonLdBad,
  missingCanonical: report.missingCanonical.length,
  missingCanonicalFiles: report.missingCanonical,
  canonicalOffDomain: report.canonicalOffDomain.length,
  aggregateRatingLeft: report.aggregateRatingLeft,
  duplicateTitleCount: duplicateTitles.length,
  duplicateTitlesSample: duplicateTitles.slice(0, 15).map(([t, f]) => ({ title: t.slice(0, 80), count: f.length })),
  brokenLocalLinks: [...report.brokenLocalLinks].slice(0, 50),
  brokenLocalLinkCount: report.brokenLocalLinks.size,
  noindexPages: report.noindex.length,
};

fs.writeFileSync(path.join(ROOT, '.seo-validation-report.json'), JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));