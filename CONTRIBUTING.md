# Contributing

## Setup

There isn't one. Clone it, open `index.html` in an editor, serve the directory:

```bash
python3 -m http.server 8000
```

Use a server rather than `file://` — the service worker needs `localhost` or HTTPS.

Do not add a build step, a bundler, or a `package.json`. The app is 2,000 lines of
self-contained HTML that opens instantly and works offline; a framework would make it
bigger and slower without solving a problem it has. `DEPLOY.md` covers the reasoning.

## The one rule that bites everyone

`sw.js` serves cache-first. If you change `index.html`, `sw.js`, the manifest, or the
icons and **don't** bump the version, every existing user keeps the old build forever:

```js
const VERSION = 'mh-2026-07-29';   // bump this
```

Nothing in CI catches it. You will see your change locally in a fresh tab and assume it
shipped.

## Where things are

All in `index.html`:

| What | Where |
|---|---|
| `ROLES` — every role, its text and call order | around line 412 |
| `RULESETS` — the vn / mh differences | around line 530 |
| `recWolves`, `recommend`, `shuffleDeck` — deck building | around line 543 |
| `blank()` — the whole game-state shape | around line 616 |
| `SAVE_KEY`, `saveSoon`, `loadSaved` — resume | around line 632 |

The state machine runs `players → sheriff → night → dawn → day → end`, with `hunter`
and `scapegoat` as interrupts. Everything lives in one `G` object that is
JSON-serialisable, which is what makes both Undo and resume cheap.

## Adding a role

Add an entry to `ROLES`:

```js
{id:'guard', ic:'🛡️', name:'Bodyguard', vi:'Bảo Vệ', team:'village', set:'Base',
 only:'vn', max:1, n1:47, every:47,
 d:'What the role does, in a sentence or two.',
 say:'The line the moderator reads aloud.',
 sayVi:'Câu thoại tiếng Việt.', pick:1, special:'guard'}
```

| Field | Meaning |
|---|---|
| `n1` | position in the first-night roll call; omit if never called |
| `every` | position on later nights; omit for first-night-only roles |
| `max` / `min` / `exact` | how many may be in a deck |
| `set` | `Base` or `Characters` |
| `only` | restrict to one ruleset, e.g. `vn` |
| `pick` | how many players the role targets |
| `special` | hook name when the role needs custom resolution logic |

Then decide whether it belongs in `REC_BASE` / `REC_CHAR` (the recommended decks), in
`SHUF` (the weighted shuffle pool, as `[weight, smallest table]`), and in `EXCL` if it
can't coexist with another role.

**Both `say` and `sayVi` are required.** The app is used bilingually and a missing
Vietnamese line is a broken role, not a nice-to-have.

## Vietnamese text

Diacritics are the recurring bug. Both faces in use — Lora and Be Vietnam Pro — carry
the full Vietnamese range. An earlier display font did not, and every `ả ệ ườ` silently
fell back to a different font per glyph, which looks like a rendering fault rather than
a font choice.

If you touch typography, check a string with stacked diacritics renders in one face.

## Testing

There is no test suite. Test by hand, at phone width in portrait — that's how it's
held. Before opening a PR:

- Run a full short game: 7 players, deal, night, dawn, vote, win condition
- Reload mid-game and confirm Resume restores the same night and the same deck
- Go offline after one online load and relaunch
- Check both rulesets if you touched anything they differ on

The PR template lists these as checkboxes. They're conditional — skip the groups that
don't apply to your change.

## Commits and PRs

Conventional Commits, lowercase subject, imperative:

```
feat: add the Fox to the shuffle pool
fix: stop the Elder surviving two poisonings
chore: bump service worker version
```

PRs fill `.github/pull_request_template.md`. Delete the sections that don't apply — a
typo fix doesn't need a test plan. Include screenshots at phone width for anything
visual.
