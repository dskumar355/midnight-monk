// Firebase Cloud Messaging Service Worker
// Midnight Monk Late-Night Food Delivery

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Config will be initialized with fallback if environment values are default
const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "midnight-monk.firebaseapp.com",
  projectId: "midnight-monk",
  storageBucket: "midnight-monk.appspot.com",
  messagingSenderId: "100000000000",
  appId: "1:100000000000:web:mockappid"
};

try {
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
