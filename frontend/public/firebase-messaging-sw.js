// Firebase Cloud Messaging Service Worker
// Midnight Monk Late-Night Food Delivery

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Dynamically receive Firebase credentials from registration query parameters
const searchParams = new URLSearchParams(self.location.search || '');
const firebaseConfig = {
  apiKey: searchParams.get('apiKey') || "mock-api-key",
  authDomain: searchParams.get('authDomain') || "midnight-monk.firebaseapp.com",
  projectId: searchParams.get('projectId') || "midnight-monk",
  storageBucket: searchParams.get('storageBucket') || "midnight-monk.appspot.com",
  messagingSenderId: searchParams.get('messagingSenderId') || "100000000000",
  appId: searchParams.get('appId') || "1:100000000000:web:mockappid"
};

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "mock-api-key") {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Midnight Monk 🌙';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Order update received',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: payload.data?.order_id ? `/track/${payload.data.order_id}` : '/orders',
        orderId: payload.data?.order_id
      }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.log('[firebase-messaging-sw.js] Graceful initialization note:', err.message);
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
