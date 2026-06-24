export const config = {
  runtime: 'edge',
};

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  const staticPathPattern = /^\/(favicon|apple-touch-icon|site\.webmanifest|favicon-.*\.png)/i;
  if (staticPathPattern.test(url.pathname)) {
    return fetch(request);
  }

  if (url.pathname.startsWith('/api/')) {
    return fetch(request);
  }

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);

  const isBot = /Googlebot|Google-InspectionTool|YandexBot|YandexMobileBot|YandexVideo|YandexImages|YandexAccessibilityBot|YandexDirect|YandexBlogs|YandexMirrorDetector|YandexMedia|YandexWebmaster|Bingbot|Baiduspider/i.test(userAgent);

  if (!isMobile && !isBot) {
    return new Response(
      '<html><body><h1>Доступ с ПК ограничен</h1><p>Сайт открыт только для мобильных устройств.</p></body></html>',
      {
        status: 403,
        headers: { 'content-type': 'text/html' },
      }
    );
  }

  return fetch(request);
}
