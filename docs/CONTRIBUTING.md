# Contributing

## Setup

There isn't one. Clone it, open `index.html` in an editor, serve the directory:

```bash
python3 -m http.server 8000
```

Use a server rather than `file://` — the service worker needs `localhost` or HTTPS.

Do not add a build step, a bundler, or a `package.json`. The app is about 2,000 lines
split across `index.html`, `css/app.css` and `js/app.js`, loaded directly by the browser
with no tooling in between. A framework would make it bigger and slower without solving
a problem it has. `DEPLOY.md` covers the reasoning.

Anything you add to the app must also go in `PRECACHE` in `sw.js`, or it won't be there
offline.

## The one rule that bites everyone

`sw.js` serves cache-first. If you change `index.html`, `sw.js`, the manifest, or the
icons and the version doesn't change, every existing user keeps the old build forever.
You'll see your change locally in a fresh tab and assume it shipped.

**Label your PR and this is handled for you** — `bump.yml` writes `const VERSION` in
`sw.js` onto your branch as soon as the label lands. See [Releases](#releases).

You only need to edit it by hand if you deliberately merge an app change with no
release label, which should be rare.

## Releases

Releases are driven by a label on the PR. Add exactly one before merging:

| Label | Bump | Use for |
|---|---|---|
| `release:major` | `X.0.0` | A change that breaks saved games, or a rules change that would surprise a moderator mid-campaign |
| `release:minor` | `0.X.0` | A new role, a new phase, a new moderator affordance |
| `release:patch` | `0.0.X` | Fixes, copy edits, chores |

**The label does the work immediately.** `bump.yml` writes the matching version into
`sw.js` on your PR branch, as a `chore: set version vX.Y.Z` commit, and re-runs the
suites against it. So the version arrives on `main` through the PR like any other
change.

```
label the PR      bump.yml   sets sw.js on the PR branch, re-runs tests
merge the PR      release.yml  test -> release   (tag + publish; no push to main)
                                          |
                                          v  dispatches, on ref main
                               static.yml  test -> deploy
```

Each stage gates the next, so nothing is tagged and nothing reaches Pages unless the
suites pass. The suites run twice per release, once in each workflow.

**Nothing pushes to `main`.** That is deliberate, and it is what allows `main` to
require the `test` check: a release only ever tags, and tags are not branch-protected.
GitHub Actions cannot be granted a branch-protection bypass on a user-owned repository,
so the alternative would have been no protection at all.

If you re-label a PR with a different size, `bump.yml` recomputes and commits again.
Labelling twice with the same size is a no-op.

One sharp edge: two PRs labelled at the same time compute the same next version, and the
second to merge fails with `tag vX.Y.Z already exists`. Re-label that PR to move it on.

**Why a dispatch and not a direct call.** Two reasons, and the second one is easy to
miss — removing the dispatch broke the `v0.2.0` release:

1. A push made with `GITHUB_TOKEN` doesn't trigger other workflows, so a deploy would
   never start on its own. (`workflow_dispatch` is the documented exception — it always
   creates a run. That is also how `bump.yml` gets the suites to run against the commit
   it just pushed to your PR branch.)
2. The `github-pages` environment only permits deploys from `main`. On a labelled merge
   `release.yml` runs on the `pull_request` event, so its ref is `refs/pull/N/merge` and
   the environment rejects the deploy — no matter which ref the job checks out.
   `--ref main` creates a run whose ref really is `main`, which is what satisfies it.

If a release ever tags and publishes but doesn't deploy, that's the symptom: recover
with `gh workflow run static.yml`.

**No label means no release — and no deploy.** That's the right choice for docs and CI
changes, which don't alter the app. But it also means an app change merged without a
label reaches nobody: the site isn't redeployed and the cache isn't rotated. If you
change `index.html`, label the PR.

Releasing is the only automatic path to production — there is no deploy on push to
`main`, because it would publish before the version bump and send the new app out under
the old cache key. To redeploy by hand, for a broken Pages build say, `static.yml` runs
the same `test -> deploy` pair:

```bash
gh workflow run static.yml
```

The Pages steps live once, in `deploy.yml`. It has no trigger of its own, so a deploy
can only ever happen behind a test gate.

Versions start from `v0.0.0`, so the first release is whatever its label says:
`release:minor` on an untagged repo produces `v0.1.0`.

You can also cut one without a PR — **Actions → Release → Run workflow**, then pick the
bump. Useful when there's no diff to merge, such as forcing a cache refresh:

```bash
gh workflow run release.yml -f bump=patch
```

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

443 assertions across 22 suites, in about three seconds. No dependencies — they read
`index.html`, `sw.js` and the manifest as text and assert against them:

```bash
tests/run-all.sh
```

CI runs this on every PR, and both the release and the deploy gate on it — nothing is
tagged, released or published to Pages unless the suites pass. `test.yml` is a reusable
workflow that `release.yml` and `static.yml` each call as a `needs:` dependency, so
there's one definition rather than three copies.

If it reports every suite as `CRASHED`, `node` isn't on your `PATH` rather than anything
being wrong with the code.

The suites cover the deck rules, night call order, ruleset divergences, vote tallying
and the deploy metadata. They can't drive a browser, so these still need a real device:

- Run a full short game: 7 players, deal, night, dawn, vote, win condition
- Reload mid-game and confirm Resume restores the same night and the same deck
- Go offline after one online load and relaunch
- Check it at phone width in portrait — that's how it's held

The PR template lists these as checkboxes. They're conditional — skip the groups that
don't apply to your change.

`KNOWLEDGE.md` documents the domain rules and the bug catalogue behind these suites.
Worth reading before changing game logic.

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
