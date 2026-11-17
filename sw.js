// Service worker do Diário de Peptídeos.
// App (HTML) busca a versão nova primeiro e usa o cache só sem internet.
// Bibliotecas e fontes ficam em cache. Dados do Supabase nunca passam pelo cache.
const VERSAO = 'diario-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;

  if (req.mode === 'navigate' || url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => { const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); return res; })
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(m => m || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return res;
    }))
  );
});
