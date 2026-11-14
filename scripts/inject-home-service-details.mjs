import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const indexPath = resolve(root, 'index.html');
const startMarker = '        <!-- ========== БОЛЬШОЙ SEO-ТЕКСТ ========== -->';
const endMarker = '        <!-- Призыв к действию -->';

const fragments = [
  'content/home-service-base.html',
  'content/home-seo-story.html',
  'content/home-service-extra.html',
].map((file) => readFileSync(resolve(root, file), 'utf8').trim());

const normalizedFragments = fragments.map((fragment) =>
  fragment
    .split('\n')
    .map((line) => line.trim())
    .join('\n'),
);

const content = normalizedFragments
  .join('\n\n')
  .split('\n')
  .map((line) => (line ? `                    ${line}` : ''))
  .join('\n');

const block = `${startMarker}
        <section class="service-details-section" aria-labelledby="service-details-title">
            <div class="container">
                <details class="service-details">
                    <summary id="service-details-title">
                        <span>Подробнее о сервисе</span>
                        <small>Доставка, ассортимент и ответы на вопросы</small>
                    </summary>
                    <div class="service-details-content seo-block">
${content}
                    </div>
                </details>
            </div>
        </section>

`;

const html = readFileSync(indexPath, 'utf8');
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker);

if (start === -1 || end === -1 || end <= start) {
  throw new Error('Home SEO block markers were not found');
}

writeFileSync(indexPath, html.slice(0, start) + block + html.slice(end));
console.log('Updated index.html service details block');
