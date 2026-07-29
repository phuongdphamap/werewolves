# Deploying the Ma Sói moderator

## Should this become a Next.js or Nuxt app?

**No.** Those frameworks solve problems this app does not have.

| What Next/Nuxt gives you | Does this app need it? |
|---|---|
| Server-side rendering | No — it is a private tool, not a page to be indexed |
| File-based routing | No — one screen |
| Data fetching / API routes | No — there is no server and no data to fetch |
| Auth, sessions | No |
| Code splitting | No — the whole app is 113 KB including all 25 role descriptions |
| Image optimisation | No images |

What you would *gain* by refactoring: a build pipeline, a `node_modules` directory,
and roughly 90 KB of framework runtime shipped **before** any of your own code.
The app would get bigger, slower to open, and harder to keep working offline.

**The one thing that would justify a framework and a server** is a feature this app
deliberately does not have: letting each *player* see their own role on their own
phone. That needs a room code, a socket or polling, shared state, and a backend.
If you ever want that, start a new project — do not convert this one. This app's
whole design assumes a single trusted device in the moderator's hand.

Until then: ship the file.

---

## What was added for deployment

The app was already plain files with no build step. Four gaps
mattered for real use, and all four are now closed.

**1. Installable.** `manifest.webmanifest` plus icons. On Android and desktop Chrome
you get "Install app"; on iOS, *Share → Add to Home Screen*. It opens with no browser
chrome, in portrait, with the app's own dark theme colour.

**2. Works with no signal.** `sw.js` caches the app on first visit and serves it
cache-first afterwards, refreshing in the background. A cellar with no bars is the
normal environment for this game.

**3. A reload no longer destroys a game.** This was the dangerous one. A phone locks,
the browser evicts the tab, and previously the whole night was gone with fifteen
people waiting. State is now saved on every render (debounced) and you are offered a
resume:

> **Ván đang dở** · 12 người · Night 3 · dừng 2 phút trước
> [ Tiếp tục · Resume ] [ Bỏ, chơi ván mới ]

Saves expire after 12 hours, are cleared when a game finishes, and every storage call
is wrapped in `try/catch` so an embedded viewer that forbids storage still runs.

**4. Correct mobile metadata** — theme colour, iOS standalone hints, touch icon.

---

## Deploy it

Copy these, keeping the layout — `css/`, `js/` and `icons/` are all referenced by
relative path from `index.html` and the manifest:

```
index.html
css/app.css
js/app.js
sw.js
manifest.webmanifest
icons/icon.svg
icons/icon-192.png  icons/icon-512.png  icons/icon-mask-512.png
```

`docs/`, `tests/` and `README.md` are not needed to run the app.

Everything uses relative paths, so it works from a subdirectory too.

### Cloudflare Pages or Netlify — drag and drop, no account juggling

1. Zip the directory, or drag the folder onto the dashboard.
2. Done. You get an HTTPS URL immediately.

### GitHub Pages — free and versioned

```bash
git init && git add . && git commit -m "Ma Sói moderator"
git branch -M main
git remote add origin git@github.com:YOUR_NAME/ma-soi.git
git push -u origin main
```

Then *Settings → Pages → Source: main / root*. Live at
`https://YOUR_NAME.github.io/ma-soi/` within a minute.

### Any web server

Copy the directory into the document root. There is nothing to run, nothing to
install, no port to open. It is static files.

> **HTTPS is required** for the service worker and for the install prompt. All three
> hosts above provide it automatically. `http://localhost` also works for testing.

---

## Releasing an update

Service workers cache aggressively — that is the point — so a new version needs a
new cache name. That is now automatic: put a `release:patch`, `release:minor` or
`release:major` label on the PR, and on merge the release workflow rewrites the one
line that matters in `sw.js`:

```js
const VERSION = 'mh-v1.2.0';   // written by .github/workflows/release.yml
```

Users get the new version the next time they launch the app. Without a new cache
name they keep the version they first loaded forever — which is why an app change
merged with no release label reaches nobody. `CONTRIBUTING.md` has the label table.

---

## Sharing it at a table

Once it has a URL, print or display a QR code pointing at it. Anyone who wants to
moderate installs it once and it works offline from then on. No accounts, no
sign-in, nothing to explain.

---

## Optional polish

**Self-host the fonts.** Right now Be Vietnam Pro and Lora load from Google. The
service worker caches them after the first visit, so offline works — but the *very
first* load needs a connection for correct typography. If you want true zero-network
from the start, download the two families, subset them to Vietnamese + Latin, drop
the `woff2` files beside `index.html`, replace the `<link>` with a local `@font-face`
block, and add the files to `PRECACHE` in `sw.js`. Costs roughly 150 KB and removes
the last external dependency.

**A landing page.** If you want the app discoverable by search, add a small static
`about.html` describing it and link to the app. That is still no reason to adopt a
framework.
