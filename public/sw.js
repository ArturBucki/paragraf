/*
 * Service worker paragrafu — tylko powiadomienia, żadnego cache'owania.
 * Cache offline dodamy dopiero, gdy będzie po co; teraz każdy zbędny plik
 * w pamięci to ryzyko, że ktoś zobaczy nieaktualną wersję apki.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const title = data.title || "paragraf";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "paragraf",
    renotify: false,
    data: { url: data.url || "/matches" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/matches";

  // Jeśli apka jest już otwarta, przenosimy w niej widok zamiast otwierać drugą kartę.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
