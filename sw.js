/* Miller’s Hollow — Moderator: offline support.
 *
 * A moderator runs this at a table, often in a cellar or a garden with no signal.
 * The app must open and keep working with the network gone entirely.
 *
 * Strategy:
 *   · navigation  -> cache first, revalidate in the background. The app opens
 *                    instantly and offline; a new version is picked up next launch.
 *   · same-origin -> stale-while-revalidate, same reasoning.
 *
 * There is no font branch any more, and no cross-origin branch at all: both faces are
 * served from ./fonts and precached with everything else. They used to come from Google
 * on a render-blocking stylesheet, which meant a first-ever launch with no signal waited
 * on a request that could not succeed.
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
/* The fonts are byte-identical across releases, so they live in their own cache, which
   activate keeps. A release changes VERSION and therefore SHELL, and every shell file is
   refetched on the next launch — 148 KB of unchanged font would ride along for nothing.
   v2 because v1 held Google's copies, and this bump is what deletes them. */
const FONTS   = 'mh-fonts-v2';
const FONT_FILES = [
  './fonts/bevietnampro-400-latin.woff2',
  './fonts/bevietnampro-400-vietnamese.woff2',
  './fonts/bevietnampro-500-latin.woff2',
  './fonts/bevietnampro-500-vietnamese.woff2',
  './fonts/bevietnampro-600-latin.woff2',
  './fonts/bevietnampro-600-vietnamese.woff2',
  './fonts/bevietnampro-700-latin.woff2',
  './fonts/bevietnampro-700-vietnamese.woff2',
  './fonts/lora-latin.woff2',
  './fonts/lora-vietnamese.woff2',
];

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
    const shell = await caches.open(SHELL), fonts = await caches.open(FONTS);
    // addAll fails the whole install if any single file 404s, which would leave
    // the app with no offline support at all. Add them individually instead —
    // but say which one failed, or a mistyped path is invisible forever.
    const put = (c, u) => c.add(u).catch(err => console.warn('[sw] precache failed:', u, err.message));
    // The fonts go straight into the cache the fetch handler serves them from, so a
    // first-ever launch with no signal still has them.
    await Promise.all([...PRECACHE.map(u => put(shell, u)),
                       ...FONT_FILES.map(u => put(fonts, u))]);
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

const isFont = url => /\.woff2$/.test(url.pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Fonts: cache first, forever, and out of the versioned cache. A release replaces the
  // shell; these files do not change, so re-downloading them would be pure waste.
  if (isFont(url)){
    e.respondWith((async () => {
      const c = await caches.open(FONTS);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      } catch (err){
        return Response.error();
      }
    })());
    return;
  }

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
