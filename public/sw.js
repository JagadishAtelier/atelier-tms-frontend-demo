self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push event received');
  
  if (event.data) {
    try {
      // Try to parse as JSON first
      let data;
      let title = 'Notification';
      let body = 'You have a new notification';
      
      try {
        // Attempt to parse as JSON
        data = event.data.json();
        console.log('[Service Worker] Parsed push data as JSON:', data);
        
        title = data.title || 'Notification';
        body = data.body || data.message || 'You have a new notification';
        
        const options = {
          body: body,
          icon: data.icon || '/icon-192x192.png',
          badge: data.badge || '/badge-72x72.png',
          data: data.data || {},
          vibrate: [100, 50, 100],
          actions: data.actions || [],
          tag: data.tag || 'notification',
          requireInteraction: false
        };
        
        event.waitUntil(
          self.registration.showNotification(title, options)
        );
      } catch (jsonError) {
        // If JSON parsing fails, treat as plain text
        console.log('[Service Worker] Push data is not JSON, treating as plain text');
        const textData = event.data.text();
        console.log('[Service Worker] Push text data:', textData);
        
        const options = {
          body: textData,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          vibrate: [100, 50, 100],
          tag: 'notification',
          requireInteraction: false
        };
        
        event.waitUntil(
          self.registration.showNotification('New Notification', options)
        );
      }
    } catch (e) {
      console.error('[Service Worker] Error handling push event:', e);
      
      // Fallback: show a generic notification
      event.waitUntil(
        self.registration.showNotification('New Notification', {
          body: 'You have a new notification',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png'
        })
      );
    }
  } else {
    console.log('[Service Worker] Push event has no data');
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  console.log('[Service Worker] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          console.log('[Service Worker] Focusing existing window');
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        console.log('[Service Worker] Opening new window');
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

