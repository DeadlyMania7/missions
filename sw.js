const CACHE = "gorevler-v3";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const same = url.origin === location.origin;
  if (!same && url.hostname !== "www.gstatic.com") return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    if (!same && hit) return hit; // Firebase kütüphanesi: önbellekten
    try { // Kendi dosyalarımız: önce ağ (güncellemeler hemen gelsin), olmazsa önbellek
      const res = await fetch(e.request);
      if (res && res.status === 200) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      if (hit) return hit;
      throw err;
    }
  }));
});
