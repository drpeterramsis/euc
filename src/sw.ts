/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Precache SW assets
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event: PushEvent) => {
  console.log('[Service Worker] Push Notification Received.');
  let data = { title: 'EUC Update', body: 'A new update is available!', url: '/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'EUC Update', body: event.data.text(), url: '/' };
    }
  }

  const title = data.title || 'EUC Update';
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2',
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  // Focus existing window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(urlToOpen, self.location.origin);
            if (clientUrl.pathname === targetUrl.pathname) {
              return client.focus();
            }
          } catch {
            // ignore parsing errors
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
