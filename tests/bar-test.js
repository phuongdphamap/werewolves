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
t('the fill is flat and near-opaque', () =>
  /background:rgba\(10,8,16,\.9\d\)/.test(BAR) ? true : BAR);
t('no gradient — a fade is what half-erased the row above it', () =>
  !/linear-gradient/.test(BAR) ? true : 'the bar is fading again: ' + BAR);
t('it has a hairline top edge, so it reads as a surface', () =>
  /border-top:1px solid/.test(BAR) ? true : BAR);
t('a blur is applied where supported, with the webkit prefix', () =>
  /-webkit-backdrop-filter:blur/.test(BAR) && /[^-]backdrop-filter:blur/.test(BAR)
    ? true : BAR);
t('there is an opaque fallback where backdrop-filter is unsupported', () =>
  /@supports not \(\(backdrop-filter[\s\S]*?\.bar\{background:#0A0810\}/.test(
    src.replace(/\s+/g,' ')) ? true : 'a translucent bar with no blur would show content through');

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
t('a long label truncates instead of breaking the row', () => {
  const r = rule(/\.bar \.in \.btn\{[^}]*\}/);
  return (/min-width:0/.test(r) && /white-space:nowrap/.test(r) && /text-overflow:ellipsis/.test(r))
    ? true : r || 'rule missing';
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
