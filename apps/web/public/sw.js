// HelpSathi Service Worker for Web Push Notifications
self.addEventListener("push", function (event) {
  if (!event.data) return;

  const promiseChain = clients.matchAll({
    type: "window",
    includeUncontrolled: true
  }).then((windowClients) => {
    // If there is ANY open HelpSathi tab, the frontend websocket will handle the notification.
    // This prevents duplicate notifications (SW push + in-app websocket OS notification)
    // and correctly suppresses notifications when the user is actively viewing a chat.
    if (windowClients.length > 0) {
      return;
    }

    try {
      const data = event.data.json();
      const title = data.title || "HelpSathi Notification";
      const options = {
        body: data.body || "You have a new update.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: data.tag || "helpsathi-notification",
        data: {
          url: data.url || "/dashboard",
        },
        vibrate: [200, 100, 200],
      };

      return self.registration.showNotification(title, options);
    } catch (err) {
      console.error("Error handling push event:", err);
    }
  });

  event.waitUntil(promiseChain);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && "focus" in client) {
          return client.focus().then((focusedClient) => {
            if ("navigate" in focusedClient) {
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
