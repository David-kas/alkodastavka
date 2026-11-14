/**
 * Добавляет canonical там, где его нет (кроме yandex-верификации).
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
      if (name === 'node_modules' || name === '.git') continue;
      walk(fp, acc);
    } else if (/\.html$/i.test(name)) acc.push(fp);
  }
  return acc;
}

function urlFor(fp) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  if (rel === 'index.html') return `${BASE}/`;
  if (rel.endsWith('/index.html')) return `${BASE}/${rel.replace(/index\.html$/, '')}`;
  return `${BASE}/${rel}`;
}

let n = 0;
for (const fp of walk(ROOT)) {
  if (/^yandex_[a-f0-9]+\.html$/i.test(path.basename(fp))) continue;
  let html = fs.readFileSync(fp, 'utf8');
  if (/<link\s+rel=["']canonical["']/i.test(html)) continue;
  const href = urlFor(fp);
  const tag = `    <link rel="canonical" href="${href}">`;
  const viewportEnd = html.match(/<meta name="viewport"[^>]*>/i);
  if (viewportEnd) {
    const idx = html.indexOf(viewportEnd[0]) + viewportEnd[0].length;
    html = html.slice(0, idx) + '\n' + tag + html.slice(idx);
  } else if (/<head>/i.test(html)) {
    html = html.replace(/<head>/i, `<head>\n${tag}`);
  } else continue;
  fs.writeFileSync(fp, html, 'utf8');
  n++;
  console.log('canonical:', path.relative(ROOT, fp));
}
console.log(`fix-missing-canonical: ${n} files`);