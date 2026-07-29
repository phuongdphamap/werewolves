// The bottom bar had two problems: buttons sized to their text so the row was
// left half empty, and the backdrop started fully transparent so role rows and
// the legend showed through behind them. These tests pin both fixes.
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

console.log('\nTHE BACKDROP ACTUALLY COVERS WHAT IS BEHIND IT');
const BAR = rule(/\.bar\{[^}]*\}/);
t('the gradient reaches near-opaque, not just .95 at 30%', () =>
  /rgba\(10,8,16,\.9\d\)/.test(BAR) ? true : BAR);
t('it is opaque well above the buttons', () => {
  const stops = [...BAR.matchAll(/rgba\(10,8,16,([.\d]+)\)\s+(\d+)%/g)]
    .map(m => ({ a:parseFloat(m[1]), at:+m[2] }));
  const mid = stops.find(s => s.at <= 40 && s.at > 0);
  return (mid && mid.a >= 0.6) ? true
    : 'at ' + (mid ? mid.at + '% opacity is only ' + mid.a : 'no early stop') ;
});
t('a blur is applied where supported, with the webkit prefix', () =>
  /-webkit-backdrop-filter:blur/.test(BAR) && /[^-]backdrop-filter:blur/.test(BAR)
    ? true : BAR);
t('the bar starts higher so there is a clean band to sit on', () =>
  /padding:var\(--s6\) var\(--pad\) var\(--s4\)/.test(BAR) ? true : BAR);

console.log('\nNOTHING IS HIDDEN OR OVERFLOWS');
t('page content clears the taller bar', () => {
  const wrap = rule(/\.wrap\{[^}]*\}/);
  const pb = (wrap.match(/padding:0 var\(--pad\) (\d+)px/) || [])[1];
  // bar = 38 top + ~54 button + 20 bottom = ~112px
  return (pb && +pb >= 130) ? true : 'bottom padding is ' + pb + 'px, bar is ~112px tall';
});
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
