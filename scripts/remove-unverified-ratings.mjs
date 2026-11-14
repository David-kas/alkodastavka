/**
 * Удаляет неподтверждённую разметку AggregateRating / aggregateRating.
 * node scripts/remove-unverified-ratings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(fp, acc);
    } else if (/\.(html|js|mjs)$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

function stripFromJsonLd(html) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, (block, jsonText) => {
    try {
      const data = JSON.parse(jsonText);
      const scrub = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          node.forEach(scrub);
          return;
        }
        if (node.aggregateRating !== undefined) delete node.aggregateRating;
        if (node.AggregateRating !== undefined) delete node.AggregateRating;
        for (const v of Object.values(node)) scrub(v);
      };
      scrub(data);
      const pretty = jsonText.trimStart().startsWith('{') && jsonText.includes('\n');
      const out = pretty ? JSON.stringify(data, null, 4) : JSON.stringify(data);
      return `<script type="application/ld+json">\n${out}\n    </script>`;
    } catch {
      return block;
    }
  });
}

let changed = 0;
let removedBlocks = 0;

for (const fp of walk(ROOT)) {
  if (fp.includes('remove-unverified-ratings')) continue;
  const raw = fs.readFileSync(fp, 'utf8');
  const beforeCount = (raw.match(/aggregateRating|AggregateRating/gi) || []).length;
  if (!beforeCount) continue;

  let next = stripFromJsonLd(raw);

  const afterCount = (next.match(/aggregateRating|AggregateRating/gi) || []).length;
  removedBlocks += beforeCount - afterCount;

  if (next !== raw) {
    fs.writeFileSync(fp, next, 'utf8');
    changed++;
  }
}

console.log(`remove-unverified-ratings: ${changed} files, ~${removedBlocks} rating blocks removed`);