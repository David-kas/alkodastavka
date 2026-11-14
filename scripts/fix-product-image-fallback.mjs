/**
 * onerror → placeholder для отсутствующих /photo/*.jpg (3, 95, 114 и др.)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FALLBACK = '/images/placeholder-strong.svg';
const ONERROR = ` onerror="this.onerror=null;this.src='${FALLBACK}'"`;

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    if (fs.statSync(fp).isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(fp, acc);
    } else if (/\.html$/i.test(name)) acc.push(fp);
  }
  return acc;
}

let n = 0;
for (const fp of walk(ROOT)) {
  let html = fs.readFileSync(fp, 'utf8');
  if (!html.includes('/photo/') || html.includes(FALLBACK)) continue;
  const next = html.replace(/(<img[^>]*src="\/photo\/[^"]+")(?![^>]*onerror)/gi, `$1${ONERROR}`);
  if (next !== html) {
    fs.writeFileSync(fp, next, 'utf8');
    n++;
  }
}
console.log(`fix-product-image-fallback: ${n} files`);