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

**Label your PR and this is handled for you** — the deploy writes `const VERSION` from
the release tag. Never edit it by hand. See [Releases](#releases).

The failure mode is merging an app change with **no** release label: no tag, so no
deploy, so the cache never rotates and nobody receives it.

## Releases

Releases are driven by a label on the PR. Add exactly one before merging:

| Label | Bump | Use for |
|---|---|---|
| `release:major` | `X.0.0` | A change that breaks saved games, or a rules change that would surprise a moderator mid-campaign |
| `release:minor` | `0.X.0` | A new role, a new phase, a new moderator affordance |
| `release:patch` | `0.0.X` | Fixes, copy edits, chores |

Three workflows, one job each. The suites are a composite action, `.github/actions/
run-tests`, run as steps inside whichever job needs them:

```
on your PR      test.yml    [test]    checkout -> suites
                                      the "test" context main's protection requires

on merge        release.yml [release]  checkout main -> suites -> tag -> publish
                                                          |
                                                          v dispatches, skip_tests=true
                static.yml  [deploy]   checkout main -> write version -> Pages

by hand         static.yml  [deploy]   checkout main -> suites -> write version -> Pages
```

The suites gate by being earlier steps in the same job: if they fail, nothing after them
runs. That is why there are no separate `test` jobs any more — a reusable workflow would
mean a second runner, ~10s of extra startup, and a duplicate `test / test` entry in the
checks list for no added safety.

**One suite run per release, down from four.** Two triggers were removed and one skip
added:

- `test.yml` has no `push: main` trigger. A squash merge tests the same tree the PR
  already tested, and that run used to start in the same second as the release's own.
- `release.yml` and `static.yml` no longer call a reusable workflow, so there are no
  nested `test / test` jobs.
- The release dispatches the deploy with `skip_tests=true`, because it ran the suites
  against that exact tree moments earlier and pushes nothing but a tag.

A **hand** dispatch of `static.yml` does run them, and that is not merely cautious: the
required check is not strict, so if B is tested, then A merges, then B merges, `main` can
end up a tree no PR ever tested. The release's own run covers that on the release path;
the deploy's covers it on the manual one. Skipping is opt-in and visible in the Actions
tab.

**Nothing writes to a branch.** No workflow pushes to `main`, and none pushes to your PR
branch either. Two things depend on that:

- `main` can require the `test` check. Required checks block direct pushes, not just
  merges, and GitHub Actions cannot be granted a branch-protection bypass on a
  user-owned repository — so a release that pushed to `main` could not coexist with
  protection at all.
- No "1 workflow awaiting approval" banner. A `pull_request` run created by a
  `GITHUB_TOKEN` push is deliberately held for maintainer approval, so a bot committing
  to your branch would stall every labelled PR for ~30 seconds. Nothing commits to your
  branch, so it never happens.

### Do not maintain VERSION by hand

`sw.js` carries `mh-v0.0.0-dev` in the repo. That is a placeholder, not a mistake:
`static.yml` rewrites it from the release tag inside the runner before uploading, and
never commits the result. Locally the Roster shows `Version v0.0.0-dev`.

**A release tag does not contain the version it shipped.** Reading
`sw.js` at `v0.2.8` shows `mh-v0.0.0-dev`, because the tag was cut from `main` and the
real string is injected afterwards, in the runner. The tag *names* the release; its tree
is the source with one line still to be filled in. To reproduce exactly what was
deployed:

```bash
git checkout v0.2.8
sed -i "s|^const VERSION = '.*';|const VERSION = 'mh-v0.2.8';|" sw.js
```

That is the price of nothing writing to a branch. Committing the version instead needs a
workflow to push, which either breaks `main`'s required check or brings back the approval
banner — B-31 and B-32 in `KNOWLEDGE.md`. If the trade ever stops being worth it, the fix
is to attach the built artifact to the GitHub release so the bytes are recorded there.

**Why a dispatch and not a direct call.** Two reasons, and the second one is easy to
miss — removing the dispatch broke the `v0.2.0` release:

1. A push made with `GITHUB_TOKEN` doesn't trigger other workflows, so a deploy would
   never start on its own. `workflow_dispatch` is the documented exception — it always
   creates a run.
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

The Pages steps live once, in `static.yml`, behind the suites in the same job.

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

Both are **self-hosted** in `fonts/`, as latin and vietnamese `woff2` subsets — 148 KB
across ten files, all precached. They used to load from Google on a render-blocking
stylesheet, which is the last thing you want between a moderator in a cellar and a first
paint. If you add a weight, add both subsets, the `@font-face` pair in `css/app.css`, and
the files to `FONT_FILES` in `sw.js`; a test checks every face the stylesheet asks for is
one the worker caches.

If you touch typography, check a string with stacked diacritics renders in one face.

## Testing

672 assertions across 25 suites, in about three seconds. No dependencies — they read
`index.html`, `sw.js` and the manifest as text and assert against them:

```bash
tests/run-all.sh
```

CI runs this on every PR, and both the release and the deploy run it before doing
anything — nothing is tagged, released or published to Pages unless the suites pass. The
steps live once, in the `.github/actions/run-tests` composite action, so all three
workflows share one definition of how to run them.

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
