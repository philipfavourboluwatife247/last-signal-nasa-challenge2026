// Last Signal service worker: lets the game open and play with no internet after the first visit.
// - pages: network first, fall back to the saved copy
// - built files (/_next/static, fonts, icons): saved the first time they are used, then served from the device
const VERSION = "last-signal-v5";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/logo.png", "/logo-96.png"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });

// The page tells us which files it has loaded so the very first visit is fully available offline too.
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "cache" && Array.isArray(e.data.urls)) {
    e.waitUntil(caches.open(VERSION).then((c) => Promise.all(e.data.urls.filter((u) => new URL(u, location.href).origin === location.origin).map((u) => c.add(u).catch(() => null)))));
  }
});

self.addEventListener("fetch", (e) => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put("/", copy)); return res; }).catch(() => caches.match("/")));
    return;
  }
  if (u.pathname.startsWith("/_next/static/") || u.pathname.startsWith("/icons/") || u.pathname.startsWith("/logo") || u.pathname.startsWith("/machines/") || u.pathname.startsWith("/textures/") || u.pathname === "/manifest.webmanifest") {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(r, copy)); } return res; })));
  }
});
