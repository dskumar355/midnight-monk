// Browser Push Notification Service
// Requests permission and shows native browser notifications

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showBrowserNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  const notification = new Notification(title, {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: options.tag || 'midnight-monk',
    renotify: true,
    ...options,
  });
  
  notification.onclick = () => {
    window.focus();
    if (options.url) window.location.href = options.url;
    notification.close();
  };
  
  return notification;
}

export function notifyOrderStatus(orderId, status) {
  const messages = {
    'Placed': '📋 Your order has been placed!',
    'Preparing': '🍳 Your order is being prepared!',
    'Out for Delivery': '🛵 Your order is out for delivery!',
    'Delivered': '✅ Your order has been delivered!',
  };
  
  showBrowserNotification(
    `Midnight Monk 🌙`,
    {
      body: messages[status] || `Order #${orderId.slice(-6).toUpperCase()}: ${status}`,
      tag: `order-${orderId}`,
      url: '/orders',
    }
  );
}
