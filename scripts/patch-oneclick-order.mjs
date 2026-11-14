/**
 * Обновляет модалку «Заказ 1 клик» и переключает кнопки на её открытие.
 * Запуск: node scripts/patch-oneclick-order.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ONECLICK_MODAL_HTML } from './oneclick-modal-html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === '_import-images') continue;
      walk(fp, acc);
    } else if (/\.html$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

function stripFloatingMessengers(html) {
  return html.replace(/\s*<div class="floating-messengers">[\s\S]*?<\/div>\s*/g, '\n');
}

function ensureModal(html) {
  const scriptTag = '<script src="/script.js"';
  const scriptIdx = html.indexOf(scriptTag);
  const modalStart = html.indexOf('<div id="oneclick-backdrop"');

  // Если старая модалка уже есть — полностью заменяем её новой версией.
  // Она находится непосредственно перед подключением script.js.
  if (modalStart !== -1 && scriptIdx !== -1 && modalStart < scriptIdx) {
    return html.slice(0, modalStart) + ONECLICK_MODAL_HTML + '\n' + html.slice(scriptIdx);
  }

  if (modalStart !== -1) return html;
  if (scriptIdx !== -1) {
    return html.slice(0, scriptIdx) + ONECLICK_MODAL_HTML + '\n' + html.slice(scriptIdx);
  }
  return html.replace('</body>', ONECLICK_MODAL_HTML + '\n</body>');
}

function patchTriggers(html) {
  let out = html;

  out = out.replace(
    /<a href="\/contacts\.html" class="([^"]*btn-header-1click[^"]*)"([^>]*)>Заказ 1 клик<\/a>/g,
    '<button type="button" class="$1 js-oneclick-open"$2>Заказ 1 клик</button>',
  );

  out = out.replace(
    /<a href="\/contacts\.html" class="([^"]*nav-mp-btn--form[^"]*)"([^>]*)>Заказать за 1 клик<\/a>/g,
    '<button type="button" class="$1 js-oneclick-open"$2>Заказать за 1 клик</button>',
  );

  out = out.replace(
    /<a href="\/contacts\.html" class="([^"]*sticky-cta-form[^"]*)"([^>]*)>Заявка<\/a>/g,
    '<button type="button" class="$1 js-oneclick-open"$2>Заявка</button>',
  );

  out = out.replace(
    /<a href="\/contacts\.html" class="btn btn-large btn-outline"([^>]*)>Оставить заявку<\/a>/g,
    '<button type="button" class="btn btn-large btn-outline js-oneclick-open"$1>Оставить заявку</button>',
  );

  return out;
}

let changed = 0;
for (const fp of walk(ROOT)) {
  let html = fs.readFileSync(fp, 'utf8');
  const next = patchTriggers(ensureModal(stripFloatingMessengers(html)));
  if (next !== html) {
    fs.writeFileSync(fp, next, 'utf8');
    changed++;
  }
}

console.log(`patch-oneclick-order: updated ${changed} html files`);
