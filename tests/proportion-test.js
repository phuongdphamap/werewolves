// The eighth design review measured the RENDERED page rather than reading the stylesheet,
// and every finding was the same shape: a system declared correctly in the source and not
// obeyed on the screen. Seven left edges on one night call, three of them within five
// pixels. Six row heights, no two alike. Nine line-heights, four inside a 0.15 spread. A
// gutter landing on a fraction of a pixel at four widths out of five.
//
// None of it is visible by reading, so none of it can be held by a test that only reads
// prose. What these assertions hold instead is the SHAPE that makes the render correct:
// that the values come from named tokens, that nothing declares a bare one, and that the
// selectors which are supposed to win are built to win rather than left to source order.
const fs = require('fs');
const css = fs.readFileSync('../css/app.css', 'utf8');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const rule = re => (css.match(re) || [''])[0].replace(/\s+/g, ' ');
const TOK = {};
for (const m of css.matchAll(/--([\w-]+):\s*([0-9.]+)(px)?[;\s]/g)) TOK['--' + m[1]] = m[2];

console.log('FOUR LEADINGS, AND NOTHING DECLARES A BARE ONE');
t('the tokens are declared', () => {
  const want = ['--lh-flat', '--lh-tight', '--lh-ui', '--lh-read'];
  const missing = want.filter(k => TOK[k] == null);
  return missing.length === 0 ? true : 'missing: ' + missing.join(', ');
});
/* The same rule the type scale already carries one line up, in the axis it was not
   applied to. A bare line-height is how the app got 1.5 beside 1.55 beside 1.6 beside
   1.65 — at 13px that is four leadings inside two pixels, so no two blocks of prose on a
   screen shared a baseline. */
t('no rule declares a bare line-height', () => {
  const bare = css.match(/line-height:\s*(?!var\()[^;}]+/g);
  return !bare ? true : bare.length + ' bare: ' + [...new Set(bare)].join(' · ');
});
t('and the four values that carried the prose have collapsed into one', () => {
  const gone = ['1.5', '1.55', '1.65'].filter(v =>
    new RegExp('line-height:\\s*' + v.replace('.', '\\.')).test(css));
  return gone.length === 0 ? true : 'still declared literally: ' + gone.join(', ');
});
/* Four, and the count is the point. A fifth token is how the prose re-splits: nothing
   above forbids adding --lh-body:1.55 beside --lh-read:1.6 and using each in half the
   rules, which is the state this finding started from. Caught by mutation — every other
   assertion here passed with a fifth leading declared. */
t('there are exactly four leadings, so a fifth cannot quietly appear', () => {
  const all = [...css.matchAll(/--lh-[\w-]+:/g)].map(m => m[0]);
  return all.length === 4
    ? true : all.length + ' leadings: ' + all.join(' ');
});
t('--lh-read is the one prose leading, so the baselines agree', () => {
  const n = (css.match(/line-height:var\(--lh-read\)/g) || []).length;
  return n >= 8 ? true : 'only ' + n + ' rules use it — the prose is still split';
});

console.log('\nTHREE ROW HEIGHTS, NAMED FOR THEIR JOB');
t('the tokens are declared, and none is under the touch floor', () => {
  const want = ['--row-sm', '--row', '--row-lg'];
  const missing = want.filter(k => TOK[k] == null);
  if (missing.length) return 'missing: ' + missing.join(', ');
  const low = want.filter(k => +TOK[k] < 44);
  return low.length === 0 ? true : 'under 44: ' + low.join(', ');
});
/* Measured as painted, the app had 44, 47, 49, 51, 52, 60 and 72 — three inside a
   five-pixel band, each reached by a different route. A row that hard-codes its height is
   how a fourth value in that band gets added without anyone noticing. */
t('no row-like component hard-codes a height in pixels', () => {
  const rows = ['.p', '.r', '.le', '.ico', '.chip', '.btn'];
  const bad = [];
  for (const c of rows){
    const r = rule(new RegExp('\\n  \\' + c + '\\{[^}]*\\}'));
    const m = r.match(/min-height:\s*(\d+)px/);
    if (m) bad.push(c + ' = ' + m[1] + 'px');
  }
  return bad.length === 0 ? true : 'literal heights: ' + bad.join(', ');
});
t('the standard row and the control row both come from tokens', () => {
  const want = [['.p', '--row'], ['.chip', '--row-sm'], ['.ico', '--row-sm'], ['.btn', '--row']];
  const bad = want.filter(([c, tk]) =>
    !new RegExp('min-height:var\\(' + tk + '\\)').test(rule(new RegExp('\\n  \\' + c + '\\{[^}]*\\}'))));
  return bad.length === 0 ? true : 'not on its token: ' + bad.map(b => b[0]).join(', ');
});

console.log('\nTWO LEFT EDGES ON A COLUMN OF PROSE, NOT FIVE');
/* .sub, .grp, .note and .tell stack directly on one another on a night call. They used to
   begin at 25.3, 25.3, 43.3 and 43.3, with .exp at 46.3 and .say at 48.3 — four prose
   edges, three of them within five pixels, which is too small to read as an indent and
   too large to read as alignment. Two axes now: the gutter, and one container inset. */
t('.tell hangs its dot in the margin instead of insetting its text', () => {
  const r = rule(/\.tell\{[^}]*\}/);
  if (/padding-left:\s*\d/.test(r)) return 'the text is still inset: ' + r;
  const dot = rule(/\.tell::before\{[^}]*\}/);
  return /left:-\d+px/.test(dot)
    ? true : 'the dot is not hanging, so it will sit on top of the first word: ' + dot;
});
t('.say puts its text on the same axis as .exp', () => {
  const r = rule(/\n  \.say\{[^}]*\}/);
  if (/border-left:\s*3px/.test(r)) return 'the 3px border pushes the text 2px past .exp';
  return /padding:var\(--s4\)/.test(r)
    ? true : '.say no longer pads by --s4, so its text leaves the axis: ' + r;
});
t('and the accent survives as an inset bar', () => {
  const bar = rule(/\.say::before\{[^}]*\}/);
  return /position:absolute/.test(bar) && /background:var\(--moon\)/.test(bar)
    ? true : 'the read-aloud block lost its accent entirely: ' + (bar || 'missing');
});

console.log('\nTHE READ-ALOUD BLOCK IS ROUNDED LIKE THE CONTAINER IT IS');
t('.say uses the container radius, not the control one', () => {
  const r = rule(/\n  \.say\{[^}]*\}/);
  if (/border-radius:var\(--r-ctl\)/.test(r)) return 'still filed with the text inputs';
  return /border-radius:var\(--r-grp\)/.test(r) ? true : r;
});
t('the bar is clipped by that radius rather than poking out of the corner', () =>
  /\n  \.say\{[^}]*overflow:hidden/.test(css.replace(/\n(?!  \.)/g, ' '))
    ? true : 'a square 3px bar against a 16px curve is the one place this geometry fights');

console.log('\nTHE GUTTER LANDS ON A WHOLE PIXEL');
/* 6.5vw resolved to 23.4, 25.35, 26.91 and 27.95 at 360, 390, 414 and 430 — only the
   clamped floor at 320 was whole. Every left edge in the app is built off this one value,
   so all of them sat on a fractional coordinate and every vertical hairline and letter
   stem was laid across two device pixels. */
t('the fluid gutter is rounded where round() exists', () => {
  const up = css.match(/@supports \(width: round\(1px, 1px\)\)\{[^}]*\{[^}]*\}[^}]*\}/);
  return up && /--pad:clamp\(22px, round\(6\.5vw, 1px\), 34px\)/.test(up[0])
    ? true : 'no rounded gutter: ' + (up ? up[0] : 'the @supports block is missing');
});
t('and the plain clamp is still there for anything older', () => {
  const base = css.match(/\n    --pad:clamp\(22px, 6\.5vw, 34px\);/);
  return base
    ? true : 'round() is Baseline only since May 2024 — without the fallback, older iOS gets nothing';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
