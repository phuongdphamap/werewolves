/* Millers Hollow — Moderator: offline support.
 *
 * A moderator runs this at a table, often in a cellar or a garden with no signal.
 * The app must open and keep working with the network gone entirely.
 *
 * Strategy:
 *   · navigation  -> cache first, revalidate in the background. The app opens
 *                    instantly and offline; a new version is picked up next launch.
 *   · same-origin -> stale-while-revalidate, same reasoning.
 *   · fonts       -> cache first and keep forever; they never change per version.
 *
 * Bump VERSION on every release or clients will keep serving the old bundle.
 */
const VERSION = 'mh-v0.1.0';
const SHELL   = VERSION + '-shell';
const FONTS   = 'mh-fonts-v1';

// Everything needed to boot with no network at all.
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // addAll fails the whole install if any single file 404s, which would leave
    // the app with no offline support at all. Add them individually instead.
    await Promise.all(PRECACHE.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, FONTS]);
    // Cache Storage is origin-wide, and this origin serves other Pages sites too.
    for (const k of await caches.keys())
      if (k.startsWith('mh-') && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isFont = url =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fonts: cache first, forever. They are versioned by their own URLs.
  if (isFont(url)){
    e.respondWith((async () => {
      const c = await caches.open(FONTS);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      } catch (err){
        return hit || Response.error();
      }
    })());
    return;
  }

  if (url.origin !== location.origin) return;

  // The app itself, and anything beside it: serve from cache at once, refresh behind.
  e.respondWith((async () => {
    const c = await caches.open(SHELL);
    const hit = await c.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (hit){ network; return hit; }              // instant, offline-safe
    const res = await network;
    if (res) return res;
    // last resort for a navigation with an empty cache
    if (req.mode === 'navigate'){
      const shell = await c.match('./index.html') || await c.match('./');
      if (shell) return shell;
    }
    return Response.error();
  })());
});

// Lets the page ask for an immediate update rather than waiting for a relaunch.
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
