// Service worker solo para notificaciones push (no cachea nada más — la
// app sigue funcionando 100% online, esto no es un "modo sin conexión").
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Origen Digestivo", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Origen Digestivo";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Al tocar la notificación: si ya hay una pestaña de la app abierta, la
// enfoca en vez de abrir una nueva.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    }),
  );
});
