// The bottom bar had three problems: buttons sized to their text so the row was left
// half empty, a backdrop that started fully transparent so role rows showed through,
// and — once that was fixed with a gradient — a fade that half-erased the last row of
// every list. It is now a flat plate with a hairline edge and measured clearance.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');
const js  = fs.readFileSync('../js/app.js','utf8');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const CSSRULES = re => src.match(re) || [];
const rule = re => { const m = src.match(re); return m ? m[0].replace(/\s+/g,' ') : ''; };

// the shipped distribution rule, lifted out so the logic itself is under test
function flexFor(item, list){
  const hasPrimary = list.some(i => !i.sec);
  return item.wide ? '1 1 100%'
    : (!hasPrimary || !item.sec) ? '1 1 auto' : '0 1 auto';
}
const grows = f => f.startsWith('1 1');

console.log('THE ROW IS ALWAYS FILLED');
t('a lone primary fills the bar', () => {
  const l = [{}];
  return grows(flexFor(l[0], l)) ? true : flexFor(l[0], l);
});
t('a lone secondary fills the bar too', () => {
  const l = [{sec:true}];
  return grows(flexFor(l[0], l)) ? true : 'a secondary-only bar would sit half empty';
});
t('secondary + primary: the primary takes the leftover room', () => {
  const l = [{sec:true}, {}];
  return (!grows(flexFor(l[0], l)) && grows(flexFor(l[1], l))) ? true
    : l.map(i => flexFor(i, l)).join(' / ');
});
t('order does not matter: primary first still grows', () => {
  const l = [{}, {sec:true}];
  return (grows(flexFor(l[0], l)) && !grows(flexFor(l[1], l))) ? true
    : l.map(i => flexFor(i, l)).join(' / ');
});
t('three secondaries share the row evenly', () => {
  const l = [{sec:true},{sec:true},{sec:true}];
  return l.every(i => grows(flexFor(i, l))) ? true : l.map(i => flexFor(i, l)).join(' / ');
});
t('primary plus two secondaries: only the primary grows', () => {
  const l = [{}, {sec:true}, {sec:true}];
  return (grows(flexFor(l[0], l)) && !grows(flexFor(l[1], l)) && !grows(flexFor(l[2], l)))
    ? true : l.map(i => flexFor(i, l)).join(' / ');
});
t('no caller option is silently ignored: wide still forces full width', () => {
  const l = [{wide:true}, {sec:true}];
  return flexFor(l[0], l) === '1 1 100%' ? true : flexFor(l[0], l);
});

console.log('\nEVERY BAR IN THE APP LAYS OUT SENSIBLY');
const bars = [...js.matchAll(/bar\(\[([\s\S]{0,600}?)\]\);/g)].map(m => m[1])
  .map(srcBlock => [...srcBlock.matchAll(/\{\s*t:\s*[^,]+,([\s\S]*?)(?=\},?\s*(\{|$))/g)]
    .map(m => ({ sec:/sec:true/.test(m[1]), wide:/wide:true/.test(m[1]) })))
  .filter(a => a.length);
t('at least fifteen bars were found to check', () =>
  bars.length >= 15 ? true : 'only ' + bars.length);
t('no bar leaves the row unfilled', () => {
  for (const l of bars) if (!l.some(i => grows(flexFor(i, l)))) return 'a bar with no growing button';
  return true;
});
t('no bar has two competing primaries', () => {
  for (const l of bars) if (l.filter(i => !i.sec).length > 1) return 'two primaries in one bar';
  return true;
});

// The bar was a gradient fading in over ~90px, which left the last row of every list
// permanently half-erased — legible enough to notice, not to read. It is now a defined
// plate. These pin the plate, because the fog is the thing that must not come back.
console.log('\nTHE BACKDROP IS A PLATE, NOT A FOG');
const BAR = rule(/\.bar\{[^}]*\}/);
t('the fill is flat and fully opaque', () =>
  /background:#0A0810/.test(BAR) ? true : BAR);
t('no gradient — a fade is what half-erased the row above it', () =>
  !/linear-gradient/.test(BAR) ? true : 'the bar is fading again: ' + BAR);
t('it has a hairline top edge, so it reads as a surface', () =>
  /border-top:1px solid/.test(BAR) ? true : BAR);
/* The blur is gone, and these hold it gone. It sat on a full-width fixed element over a
   region every chip tap dirties, so it re-rasterised on each one — Chromium hands that to
   the compositor, Firefox largely does not, and that was the delay on the night call. It
   was also acting on four percent of the backdrop: the plate was already .96 opaque, and
   the @supports fallback that shipped alongside it was an opaque plate, which is the
   proof the design never needed it. */
// declarations only: the comments explain why the blur went, and say its name doing so
const CODE = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
t('no backdrop-filter: it re-rasterises on every tap', () =>
  !/backdrop-filter/.test(CODE) ? true : 'the blur is back on the busiest paint path');
t('and no @supports fallback, because there is nothing left to fall back from', () =>
  !/@supports not \(\(backdrop-filter/.test(CODE.replace(/\s+/g,' '))
    ? true : 'a dead fallback for a property nothing uses');
t('the plate is opaque outright, not almost-opaque', () =>
  !/background:rgba\(10,8,16/.test(BAR)
    ? true : 'translucent with no blur would show the list through it: ' + BAR);

console.log('\nNOTHING IS HIDDEN OR OVERFLOWS');
t('clearance is the measured bar height, not a constant', () => {
  const wrap = rule(/\.wrap\{[^}]*\}/);
  return /padding:0 var\(--pad\) calc\(var\(--barh/.test(wrap)
    ? true : 'a fixed clearance goes stale when a label wraps: ' + wrap;
});
t('scroll-padding matches it, so the last row is reachable', () => {
  const wrap = rule(/\.wrap\{[^}]*\}/);
  return /scroll-padding-bottom:calc\(var\(--barh/.test(wrap) ? true : wrap;
});
t('something actually measures the bar and sets --barh', () =>
  /setProperty\('--barh'/.test(js) && /offsetHeight/.test(js)
    ? true : '--barh is referenced but never written, so the fallback always wins');
t('the measurement re-runs when the bar is rebuilt', () =>
  /measureBar\(\);\s*\}/.test(js) ? true : 'bar() does not re-measure, so a taller bar overlaps');
/* Reading offsetHeight forces a synchronous layout of a document that render() has just
   invalidated. Writing the result back then invalidated style for the whole tree and woke
   the ResizeObserver watching .bar, which measured again: two forced layouts per chip tap,
   for a number that changes a few times a game. */
t('the measurement writes only when the height actually changed', () => {
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /if \(h === barh\) return;/.test(fn)
    ? true : 'every tap re-writes the property and re-enters the observer: ' + fn;
});
/* Deduplicating on the value was not enough on its own. One render calls measureBar three
   times — bar() clears the pinned note, builds the buttons, then the caller pins a new one
   — and those really are three different heights, so two writes landed per tap and the
   ResizeObserver woke for both. */
t('the measurement is coalesced, so three calls per render cost one', () => {
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /if \(measureQueued\) return;/.test(fn) ? true : 'still measures once per call: ' + fn;
});
t('and it never reads synchronously, against a document render() just dirtied', () => {
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  // the read lives in the deferred callback, and every call to it is inside a scheduler
  const deferred = (fn.match(/const run = \(\) => \{[\s\S]*?\n  \};/) || [''])[0];
  const rest = fn.replace(deferred, '');
  const calls = rest.split('\n').filter(l => /\brun\(\)/.test(l));
  const unscheduled = calls.filter(l => !/requestAnimationFrame|setTimeout/.test(l));
  return (/offsetHeight/.test(deferred) && !/offsetHeight/.test(rest)
          && calls.length > 0 && unscheduled.length === 0)
    ? true : 'offsetHeight is forced on the tap path: ' + unscheduled.join(' // ');
});
/* The fallback has to carry the same inset the bar does, or the first paint is short by
   exactly the height of the home indicator. */
t('the CSS still has a fallback for the frame before the first measurement', () => {
  const w = (src.match(/\.wrap\{[^}]*\}/) || [''])[0];
  if (!/var\(--barh, var\(--barh-guess\)\)/.test(w))
    return 'the first paint would have no clearance at all: ' + w.replace(/\s+/g,' ');
  const g = (src.match(/--barh-guess:[^;]*;/) || [''])[0];
  return /env\(safe-area-inset-bottom\)/.test(g)
    ? true : 'the guess ignores the inset the bar now carries: ' + g;
});
/* Found by measuring in a browser rather than by reading this: a hidden tab never runs a
   frame callback, and the app can do its whole first render in one — a phone that loaded
   the page and was switched away from. The clearance would then sit on the CSS fallback
   against a bar that, with a wrapped label and a pinned note, can be taller than it. */
t('a tab that never gets a frame is still measured', () => {
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /requestAnimationFrame\(/.test(fn) && /setTimeout\(run, *\d+\)/.test(fn)
    ? true : 'no fallback scheduler, so a first render in a hidden tab is never measured';
});
// The common path is the visible one, and it should leave nothing pending behind it.
t('the frame callback cancels the backstop rather than letting it wake for nothing', () => {
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /requestAnimationFrame\(\(\) => \{ clearTimeout\(backstop\); run\(\); \}\)/.test(fn)
    ? true : 'every render leaves a timer that wakes only to find the work already done';
});
t('and whichever scheduler wins, the work happens once', () => {
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /if \(!measureQueued\) return;/.test(fn)
    ? true : 'both schedulers would measure, which is the double write again';
});
t('it is written on .wrap, the only element that reads it', () => {
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return (/w\.style\.setProperty\('--barh'/.test(fn) && !/documentElement/.test(fn))
    ? true : 'writing it on the root invalidates style for the entire document: ' + fn;
});
t('and .wrap is where the variable is consumed, so the scope holds', () => {
  const wrap = rule(/\.wrap\{[^}]*\}/);
  const users = [...src.matchAll(/([.#][\w-]+)\{[^}]*var\(--barh/g)].map(m => m[1]);
  return (/var\(--barh/.test(wrap) && users.every(u => u === '.wrap'))
    ? true : '--barh is read outside .wrap, where the scoped value will not reach: ' + users.join(', ');
});
t('the row may break rather than truncate every label in it', () => {
  const r = rule(/\.bar \.in\{[^}]*\}/);
  return /flex-wrap:wrap/.test(r)
    ? true : 'at 320 two buttons need 291px of 276 and both ellipsise, the primary included';
});
t('a button alone on a wrapped line fills it', () => {
  const rules = [...CSSRULES(/\.bar \.in \.btn\{[^}]*\}/g)].join(' ');
  return /flex:1 1 auto/.test(rules)
    ? true : 'it would sit at its content width with the rest of the line empty';
});
t('but a single label too long for a whole line still truncates', () => {
  const rules = [...CSSRULES(/\.bar \.in \.btn\{[^}]*\}/g)].join(' ');
  const missing = ['min-width:0', 'white-space:nowrap', 'text-overflow:ellipsis']
    .filter(k => !rules.includes(k));
  return missing.length === 0 ? true : 'lost the last resort: ' + missing.join(', ');
});
t('and the bar height is measured, not guessed, so a wrapped row keeps its clearance', () => {
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /offsetHeight/.test(fn)
    ? true : 'a two-line bar would cover the last row of the list';
});
t('the buttons are the same height as each other', () => {
  const r = rule(/\.bar \.in\{[^}]*\}/);
  return /align-items:stretch/.test(r) ? true : r;
});
t('.btn.wide still exists for the buttons outside the bar that use it', () => {
  const used = (src.match(/'btn sec wide'|'btn wide'|class="btn wide"/g) || []).length;
  return (used === 0 || /\.btn\.wide\{width:100%\}/.test(src))
    ? true : used + ' buttons use .wide but the rule is gone';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
