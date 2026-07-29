/* Miller’s Hollow — Moderator: offline support.
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
 * VERSION names the cache, so it must change on every release or clients keep serving
 * the old bundle. It is not maintained here: static.yml rewrites this line from the
 * release tag inside the runner and never commits the result.
 *
 * So the value below is what local development sees — and also what you see reading this
 * file at a release tag, because the tag's tree does not contain the string that shipped.
 * The tag names the release; to reproduce the deployed file, rewrite this line to
 * 'mh-<tag>'. Committing it instead would need a workflow to push to a branch, which
 * cannot coexist with main requiring the test check — see docs/KNOWLEDGE.md B-31, B-32.
 */
const VERSION = 'mh-v0.0.0-dev';
const SHELL   = VERSION + '-shell';
const FONTS   = 'mh-fonts-v1';

// Everything needed to boot with no network at all. The PNGs are here because the
// install prompt and the home-screen icon read them from the manifest, and a moderator
// who first opens the app in a cellar has no connection to fetch them with.
const PRECACHE = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-mask-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // addAll fails the whole install if any single file 404s, which would leave
    // the app with no offline support at all. Add them individually instead —
    // but say which one failed, or a mistyped path is invisible forever.
    await Promise.all(PRECACHE.map(u =>
      c.add(u).catch(err => console.warn('[sw] precache failed:', u, err.message))));
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
