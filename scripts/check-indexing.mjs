/** Fail the build when sitemap entries are missing, redirected, noindex or noncanonical. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://alkodastavka.vercel.app';
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const redirects = new Map(config.redirects.filter(r => !r.has && !r.missing).map(r => [r.source, r.destination]));
const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].replaceAll('&amp;', '&'));
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
assert(urls.includes(base + '/'), 'Homepage missing');
assert(urls.includes(base + '/catalog.html'), 'Catalog missing');
assert(urls.includes(base + '/contacts.html'), 'Contacts missing');
for (const url of urls) {
  const u = new URL(url);
  assert.equal(u.origin, base);
  assert(!u.search && !u.hash, `Noncanonical suffix: ${url}`);
  assert(!redirects.has(u.pathname), `Redirect in sitemap: ${url}`);
  const rel = decodeURIComponent(u.pathname).replace(/^\//, '') + (u.pathname.endsWith('/') ? 'index.html' : '');
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  const tags = [...html.matchAll(/<(meta|link)\b[^>]*>/gi)].map(m => Object.fromEntries([...m[0].matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map(a => [a[1].toLowerCase(), a[2]])));
  assert(!tags.some(t => /^(robots|yandex|googlebot)$/i.test(t.name || '') && /\b(noindex|none)\b/i.test(t.content || '')), `Noindex: ${url}`);
  assert.equal(tags.find(t => t.rel === 'canonical')?.href, url, `Canonical mismatch: ${url}`);
  for (const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) JSON.parse(m[1]);
}
for (const route of ['/catalog/', '/contacts/']) {
  const dest = redirects.get(route);
  assert(dest, `Missing redirect: ${route}`);
  assert(!redirects.has(dest), `Redirect chain: ${route}`);
  assert(urls.includes(base + dest), `Redirect target missing: ${route}`);
}
for (const file of ['city-kazan.html', 'city-sankt-peterburg.html']) {
  assert(!urls.includes(base + '/' + file), `Draft in sitemap: ${file}`);
  assert(/name="robots" content="noindex, follow"/.test(fs.readFileSync(path.join(root, file), 'utf8')));
}
console.log(`Indexing checks passed: ${urls.length} URLs, canonical targets and JSON-LD valid.`);
