// Offline cache for the CA Foundation checklist.
// Bump the version whenever cached app files change.
const CACHE = "ca-checklist-v6";
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

// Stop Android browsers from treating ordinary app text as selectable text.
// Keep form controls selectable so users can still edit and copy their input.
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
#date-strip { touch-action: pan-y; }
#date-strip.swipe-next .date-button { animation: date-strip-next .22s ease-out both; }
#date-strip.swipe-previous .date-button { animation: date-strip-previous .22s ease-out both; }
@keyframes date-strip-next { from { opacity: .45; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
@keyframes date-strip-previous { from { opacity: .45; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }
@media (prefers-reduced-motion: reduce) {
  #date-strip.swipe-next .date-button, #date-strip.swipe-previous .date-button { animation: none; }
}
</style>`;

const DATE_STRIP_SCRIPT = `<script>
(function () {
  var strip = document.getElementById("date-strip");
  var dateInput = document.getElementById("calendar-date");
  if (!strip || !dateInput) return;

  var startX = 0;
  var startY = 0;
  var suppressClickUntil = 0;

  function shiftWeek(amount) {
    var date = new Date((dateInput.value || new Date().toISOString().slice(0, 10)) + "T12:00:00");
    date.setDate(date.getDate() + amount);
    var value = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    var direction = amount > 0 ? "swipe-next" : "swipe-previous";
    strip.classList.remove("swipe-next", "swipe-previous");
    dateInput.value = value;
    dateInput.dispatchEvent(new Event("change", { bubbles: true }));
    requestAnimationFrame(function () {
      strip.classList.add(direction);
      setTimeout(function () { strip.classList.remove(direction); }, 260);
    });
    suppressClickUntil = performance.now() + 350;
  }

  strip.addEventListener("touchstart", function (event) {
    if (!event.touches || event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  }, { passive: true });

  strip.addEventListener("touchend", function (event) {
    if (!event.changedTouches || event.changedTouches.length !== 1) return;
    var deltaX = event.changedTouches[0].clientX - startX;
    var deltaY = event.changedTouches[0].clientY - startY;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    shiftWeek(deltaX < 0 ? 7 : -7);
  }, { passive: true });

  strip.addEventListener("click", function (event) {
    if (performance.now() > suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickUntil = 0;
  }, true);
})();
</script>`;

async function addSelectionProtection(response, requestUrl) {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  const html = await response.text();
  const isTimeblocks = new URL(requestUrl).pathname.endsWith("/timeblocks.html");
  const styles = SELECTION_STYLE + (isTimeblocks ? DATE_STRIP_STYLE : "");
  let updatedHtml = html.includes("</head>")
    ? html.replace("</head>", `${styles}</head>`)
    : `${styles}${html}`;
  if (isTimeblocks && updatedHtml.includes("</body>")) {
    updatedHtml = updatedHtml.replace("</body>", `${DATE_STRIP_SCRIPT}</body>`);
  }
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
          const updated = await addSelectionProtection(res, req.url);
          await cache.put(req, updated.clone());
          return updated;
        }
        return res;
      } catch (error) {
        const url = new URL(req.url);
        const cached = await cache.match(req) || await cache.match(url.pathname.replace(url.pathname,"")) || await cache.match(url.pathname);
        if (cached) return cached;
        throw error;
      }
    })());
  }
});
