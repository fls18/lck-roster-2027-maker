/* 오프라인 실행용 서비스 워커. 파일을 고쳐 다시 올릴 때는 VERSION 값을 바꿔 주세요. */
const VERSION = 'stove-2027-v2';
const ASSETS = [
  './', './index.html', './css/style.css', './js/data.js', './js/app.js',
  './manifest.webmanifest', './fonts/PretendardVariable.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 네트워크 우선 → 실패하면 캐시 (데이터 수정이 바로 반영되도록)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
