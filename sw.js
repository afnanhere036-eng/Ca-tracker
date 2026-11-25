// Offline cache for the CA Foundation checklist.
// Bump the version whenever cached app files change.
const CACHE = "ca-checklist-v12";
const SHELL = [
  "./",
  "index.html",
  "track.html",
  "timeblocks.html",
  "create-timeblock.html",
  "errorlogs.html",
  "syllabus.html",
  "questionbanks.html",
  "settings.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png"
];

const SELECTION_STYLE = `<style>
*, *::before, *::after {
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none;
}
input, textarea, select, [contenteditable="true"], [contenteditable=""] {
  -webkit-user-select: text !important;
  user-select: text !important;
  -webkit-touch-callout: default;
}
</style>`;

const DATE_STRIP_STYLE = `<style>
#date-strip { touch-action: pan-x pan-y; }
#date-strip.swipe-next .date-button { animation: date-strip-next .22s ease-out both; }
#date-strip.swipe-previous .date-button { animation: date-strip-previous .22s ease-out both; }
@keyframes date-strip-next { from { opacity: .45; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
@keyframes date-strip-previous { from { opacity: .45; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }
@media (prefers-reduced-motion: reduce) {
  #date-strip.swipe-next .date-button, #date-strip.swipe-previous .date-button { animation: none; }
}
</style>`;

async function addAppStyles(response, requestUrl) {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  const html = await response.text();
  const isTimeblocks = new URL(requestUrl).pathname.endsWith("/timeblocks.html");
  const styles = SELECTION_STYLE + (isTimeblocks ? DATE_STRIP_STYLE : "");
  const updatedHtml = html.includes("</head")
    ? html.replace("</head>", `${styles}</head>`)
    : `${styles}${html}`;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("transfer-encoding");
  return new Response(updatedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const updated = await addAppStyles(res, req.url);
          await cache.put(req, updated.clone());
          return updated;
        }
        return res;
      } catch (error) {
        const url = new URL(req.url);
        const cached = await cache.match(req) || await cache.match(url.pathname.replace(url.pathname, "")) || await cache.match(url.pathname);
        if (cached) return cached;
        throw error;
      }
    })());
  }
});
