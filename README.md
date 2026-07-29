# Ma Sói — Moderator

A Quản Trò (moderator) assistant for **Ma Sói** / *The Werewolves of Miller’s Hollow*.
It runs the night call order, resolves the dawn, counts votes, and remembers who is
what — so the person running the game can watch the table instead of a rulebook.

**Live:** https://phuongdphamap.github.io/werewolves/

Three plain files — `index.html`, `css/app.css`, `js/app.js`. No build step, no server,
no accounts, no `node_modules`.

## What it does

| Task | What the app does |
|---|---|
| Build a deck | Recommends a deck for the table size, or shuffles a weighted random one. Wolf count scales from 1 at under 8 players to 6 at 23+. |
| Call the night | Walks the roll call in order. Each role has a line to read aloud, in English and Vietnamese. |
| Resolve the dawn | Applies the attack, the Witch's flask, the Bodyguard, lovers dying of grief, the Elder's extra life, and the Wild Child turning. |
| Count the vote | Tracks votes with Sheriff weighting, plus the Scapegoat and the Stuttering Judge's second round. |
| Survive a reload | A locked phone or an evicted tab no longer ends the game. Resume is offered for 12 hours. |

25 roles from the base game and the Characters expansion. Two rulesets: **Ma Sói Việt
Nam** (default) and **Miller’s Hollow (bản gốc)** — they differ in Seer/Fox call order,
Sheriff vote weight, whether the Witch may heal herself, and whether a poisoned Hunter
still fires.

## Install it

Open the link on the phone you moderate from:

- **Android / desktop Chrome** — "Install app" in the address bar
- **iOS** — Share, then *Add to Home Screen*

It then opens full-screen in portrait, and works with the network gone entirely. That
is the normal case: this game gets played in cellars and gardens with no signal.

## Design boundary

The app assumes **one trusted device in the moderator's hand**. Every player's role is
visible on that screen, which is exactly what a moderator needs and exactly what a
player must not see.

Letting each player see their own role on their own phone is a different product — it
needs a room code, a backend, and shared state. If you want that, start a new project
rather than converting this one. See `docs/DEPLOY.md` for why the no-framework, no-build
choice is deliberate.

## Files

```
index.html              markup and document head
css/app.css             all styling
js/app.js               roles, game logic, rendering
sw.js                   service worker; offline caching
manifest.webmanifest    PWA metadata
icons/                  favicon, touch icon, PWA icons
docs/                   contributing, deployment, engineering notes
tests/                  run with tests/run-all.sh
```

Everything uses relative paths, so it also works from a subdirectory — which is how it
is served today, under `/werewolves/`.

## Run it locally

A service worker needs HTTPS or `localhost`, so open it through a server rather than as
a `file://` path:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Contributing

See `docs/CONTRIBUTING.md`. The short version: edit `index.html`, and put a `release:patch`
/ `release:minor` / `release:major` label on the PR — that's what cuts the release and
rotates the service worker cache so people actually receive the change.

## License

MIT — see `LICENSE`.

That covers this software. *The Werewolves of Miller’s Hollow* is a game by Philippe des
Pallières and Hervé Marly, published by Lui-même; Ma Sói is its Vietnamese form. This is
an unaffiliated tool for running a game you already own.
