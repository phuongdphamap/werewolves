<!--
Keep it short. Fill the sections that apply and delete the ones that don't.
A one-line PR with a good title is fine for a typo fix.
-->

## Summary

<!-- What changed, and why. Two or three bullets. Lead with the answer. -->

-

## Related issue

<!-- "Closes #12" links and auto-closes it. Write "none" if there isn't one. -->

Closes #

## Type of change

- [ ] Fix — something was broken at the table
- [ ] Feature — new role, new phase, new moderator affordance
- [ ] Refactor — no behaviour change
- [ ] Chore / CI / docs

## Screenshots

<!--
Required for anything visual. Drag images straight into this box.
Show a phone-width viewport, not a desktop window — that's where it's used.
-->

| Before | After |
|---|---|
|  |  |

## How to test

<!-- Steps someone else can follow. "Open it and look" is not a test plan. -->

1.

## Checklist

Always:

- [ ] Tested at phone width in portrait, the way a moderator actually holds it
- [ ] Vietnamese diacritics render in one font — no per-glyph fallback on `ả ệ ườ`
- [ ] No new external requests; the app stays a single self-contained `index.html`
- [ ] All paths stay relative — the site is served from the `/werewolves/` subpath

If `index.html`, `sw.js`, the manifest, or the icons changed:

- [ ] Added a `release:major` / `release:minor` / `release:patch` label — the release
      workflow bumps `VERSION` in `sw.js` for you. Without a label there's no release
      and no bump, so existing users keep the cached build forever
- [ ] Loaded once online, then killed the network and relaunched: app still opens

If game state, the phase machine, or roles changed:

- [ ] A mid-game reload still offers Resume and restores the same night and deck
- [ ] Old saves under the current `SAVE_KEY` either still load or are cleanly
      discarded — a stale save must never half-restore into a broken board
- [ ] Finishing a game clears the save

## Deploy notes

<!--
Anything that isn't just "merge it". Manual step, risk to in-flight games,
something to watch on the Pages run. Delete this section if there's nothing.
-->

None.
