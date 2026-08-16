// Döngüm PWA - Service Worker
// Çevrimdışı çalışma ve bildirim desteği

const CACHE_NAME = 'dongum-v4-live';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.jpg',
  './css/index.css',
  './css/components.css',
  './css/themes.css',
  './js/app.js',
  './js/i18n.js',
  './js/utils.js',
  './js/data.js',
  './js/cycle.js',
  './js/calendar.js',
  './js/symptoms.js',
  './js/stats.js',
  './js/notifications.js',
  './js/pin.js',
  './js/temperature.js',
  './js/medication.js',
  './js/export.js'
];

// Kurulum - dosyaları önbelleğe al ve hemen aktifleş
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Aktivasyon - eski önbellekleri hemen temizle ve kontrolü devral
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Network First (Önce Ağa Git, Güncel Dosyayı Al, Çevrimdışıysa Önbellekten Sun)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('google') || event.request.url.includes('gtag') || event.request.url.includes('analytics') || event.request.url.includes('formsubmit')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Push Bildirim Alma
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Döngüm';
  const options = {
    body: data.body || '',
    icon: './icon.jpg',
    badge: './icon.jpg',
    tag: data.tag || 'dongum-notification',
    data: data.data || {},
    vibrate: [200, 100, 200],
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Bildirime Tıklama
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.notification.data?.action || 'home';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Açık pencere varsa ona odaklan
        for (const client of clients) {
          if (client.url.includes('index.html') && 'focus' in client) {
            client.postMessage({ type: 'NAVIGATE', action });
            return client.focus();
          }
        }
        // Yoksa yeni pencere aç
        if (self.clients.openWindow) {
          return self.clients.openWindow('./index.html');
        }
      })
  );
});

// Periyodik Senkronizasyon (destekleniyorsa)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkScheduledNotifications());
  }
});

// Zamanlanmış bildirimleri kontrol et
async function checkScheduledNotifications() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length > 0) {
      // Uygulama açıksa, uygulamaya bildirim kontrolü mesajı gönder
      clients[0].postMessage({ type: 'CHECK_NOTIFICATIONS' });
    }
  } catch (err) {
    console.error('[SW] Bildirim kontrol hatası:', err);
  }
}
