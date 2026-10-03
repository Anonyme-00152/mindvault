/* MindVault service worker — push, notification clicks, light offline shell. */
const VERSION = "mv-sw-v1";
const SHELL = ["/app", "/app/notes", "/app/calendar", "/app/ask", "/app/files", "/app/export", "/app/settings", "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Static assets: cache-first. App pages: network-first with cache fallback so the
// installed app still opens offline (data itself lives in IndexedDB).
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image")) {
    event.respondWith(caches.open(VERSION).then((c) => c.match(request).then((hit) => hit || fetch(request).then((res) => (c.put(request, res.clone()), res)))));
    return;
  }
  if (request.mode === "navigate" && url.pathname.startsWith("/app")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(VERSION).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/app"))),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "MindVault", body: "", url: "/app", tag: undefined };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: "/apple-icon",
      badge: "/icon",
      data: { url: data.url },
      renotify: Boolean(data.tag),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/app", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

// Re-subscribe if the push service rotates the subscription.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((sub) => fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) }))
      .catch(() => undefined),
  );
});

// Page → SW: show a local notification (used by the in-app scheduler and the test button).
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "notify") {
    self.registration.showNotification(msg.title || "MindVault", { body: msg.body || "", tag: msg.tag, icon: "/apple-icon", badge: "/icon", data: { url: msg.url || "/app" } });
  }
});
