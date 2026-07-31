// The app draws edge to edge on purpose — viewport-fit=cover, and a translucent status
// bar — and had no safe-area inset anywhere, so on any notched iPhone installed to the
// Home Screen the primary action buttons sat under the home indicator, in the strip the
// system reserves for its own swipe. Two deliberate opt-ins and no corresponding inset.
//
// Alongside it: three controls under the 44px minimum, all of them among the most-tapped,
// and no haptic channel at all in an app whose premise is not looking at the screen.
const fs = require('fs');
const css  = fs.readFileSync('../css/app.css', 'utf8');
const js   = fs.readFileSync('../js/app.js', 'utf8');
const html = fs.readFileSync('../index.html', 'utf8');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const rule = re => (css.match(re) || [''])[0].replace(/\s+/g, ' ');

console.log('THE APP OPTS INTO THE UNSAFE AREA, SO IT MUST INSET');
t('it still draws edge to edge — otherwise none of this is needed', () =>
  /viewport-fit=cover/.test(html) ? true : 'cover is gone, so these tests are measuring nothing');
t('and the status bar is still drawn over the page', () =>
  /apple-mobile-web-app-status-bar-style" content="black-translucent/.test(html)
    ? true : 'the translucent bar is gone, so the top inset guards nothing');
/* Every element that touches a screen edge. The bar is the one that was actually broken,
   but the others reach the same edges and would break the same way. */
for (const [what, re, side] of [
  ['the action bar',   /\n  \.bar\{[^}]*\}/,   'bottom'],
  ['the header',       /\n  header\{[^}]*\}/,  'top'],
  ['the reveal modal', /\n  \.modal\{[^}]*\}/, 'both'],
  ['the resume veil',  /\n  \.veil\{[^}]*\}/,  'both'],
]){
  t(what + ' insets its ' + side, () => {
    const r = rule(re);
    if (!r) return 'rule missing';
    const want = side === 'both' ? ['top','bottom'] : [side];
    const missing = want.filter(s => !new RegExp('env\\(safe-area-inset-' + s + '\\)').test(r));
    return missing.length === 0 ? true : 'no ' + missing.join('/') + ' inset: ' + r;
  });
}
t('the inset is added to the padding, never replacing it', () => {
  // env() alone collapses the padding to 0 on a device with no notch
  const bars = rule(/\n  \.bar\{[^}]*\}/);
  return /calc\(var\(--s4\) \+ env\(safe-area-inset-bottom\)\)/.test(bars)
    ? true : 'the bar loses its own padding on a phone with no inset: ' + bars;
});
t('the bar clearance is still measured, so it follows the new height', () => {
  const m = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /offsetHeight/.test(m) && /--barh/.test(m)
    ? true : 'the column would reserve the old height under a taller bar';
});

console.log('\nNOTHING TAPPABLE IS UNDER 44px');
t('the vote stepper is 44, not 36', () => {
  const r = rule(/\.stp button\{[^}]*\}/);
  return /width:44px;height:44px/.test(r) ? true : r;
});
t('and the box between them matches, so the row is level', () => {
  const r = rule(/\.stp input\[type=text\]\{[^}]*\}/);
  return /height:44px/.test(r) ? true : r;
});
t('the row did not grow to pay for it', () => {
  // .p is 52px tall already, so a 44px control fits without changing anything
  const p = rule(/\n  \.p\{[^}]*\}/);
  const h = parseFloat((p.match(/min-height:(\d+)px/) || [])[1]);
  return h >= 44 ? true : 'the player row is ' + h + 'px, so 44px controls stretch it';
});
t('.ico clears 44 — Undo is one of these', () => {
  const r = rule(/\n  \.ico\{[^}]*\}/);
  return /min-height:44px/.test(r) && /align-items:center/.test(r)
    ? true : 'the app’s safety net is still the smallest control on the screen: ' + r;
});
t('.altBtn gets its 44 without moving the underline off the word', () => {
  const r = rule(/\.altBtn::after\{[^}]*\}/);
  if (!/height:44px/.test(r)) return 'no extended hit area: ' + r;
  return /position:absolute/.test(r)
    ? true : 'padding would push the border away from the text it underlines';
});
t('the chip floor is still there', () =>
  /\.chip\{[^}]*min-height:44px/.test(css.replace(/\s+/g, ' '))
    ? true : 'the most-tapped control lost its floor');

console.log('\nHAPTICS: THE ONE CHANNEL THE APP WAS MISSING');
t('there is a two-tier vocabulary, not one buzz for everything', () => {
  const v = (js.match(/const BUZZ = \{[^}]*\}/) || [''])[0];
  const kinds = [...v.matchAll(/(\w+):/g)].map(m => m[1]);
  return kinds.length >= 3 && kinds.includes('tap') && kinds.includes('commit')
    ? true : 'vocabulary is ' + kinds.join(', ');
});
t('a selection ticks, and the tick is short', () => {
  const v = (js.match(/const BUZZ = \{[^}]*\}/) || [''])[0];
  const tap = parseFloat((v.match(/tap:(\d+)/) || [])[1]);
  return tap > 0 && tap <= 20 ? true : 'the selection tick is ' + tap + 'ms';
});
t('a committed outcome is a pattern, so it is distinguishable by feel', () => {
  const v = (js.match(/const BUZZ = \{[^}]*\}/) || [''])[0];
  return /commit:\[[\d,\s]+\]/.test(v) ? true : 'commit is a single pulse like a tap: ' + v;
});
t('selecting a target buzzes', () => {
  const c = (js.match(/function chip\(p, o\)\{[\s\S]*?\n\}/) || [''])[0];
  return /buzz\('tap'\)/.test(c) ? true : 'the most common tap in the app is silent';
});
t('so does a stepper on the vote screen', () => {
  const h = (js.match(/function holdOrder\(\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /buzz\('tap'\)/.test(h) ? true : 'counting the vote gives no feedback: ' + h;
});
t('the vote carrying is a commit, and only fires on the edge', () => {
  const r = (js.match(/function refresh\(\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /if \(passing && !wasPassing\) buzz\('commit'\)/.test(r) && /wasPassing = passing/.test(r)
    ? true : 'it would pulse on every keystroke while the vote stays passing';
});
t('a death is the heaviest thing that happens', () => {
  const r = (js.match(/function registerDeaths\(chain\)\{[\s\S]*?\n\}/) || [''])[0];
  return /buzz\('death'\)/.test(r) ? true : 'a death is announced only on screen';
});
t('every buzz goes through the one gate', () => {
  // a direct call would bypass both the setting and the support check. The typeof probe
  // in canBuzz() is not an invocation, so this counts invocations only.
  const calls = [...js.matchAll(/navigator\.vibrate\(/g)].length;
  return calls === 1 ? true : calls + ' invocation(s); only buzz() may reach the API';
});
t('it is off-switchable', () => {
  const b = (js.match(/function buzz\(kind\)\{[\s\S]*?\n\}/) || [''])[0];
  return /if \(!hapticOn \|\| !canBuzz\(\)\) return;/.test(b)
    ? true : 'the setting or the support check is not consulted: ' + b;
});
t('and the control is hidden where the browser cannot vibrate, not offered dead', () => {
  const p = (js.match(/function paintHaptic\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /if \(!canBuzz\(\)\)\{ b\.hidden = true; return; \}/.test(p)
    ? true : 'iOS would show a switch that does nothing: ' + p;
});
t('a throwing vibrate cannot take the render down with it', () => {
  const b = (js.match(/function buzz\(kind\)\{[\s\S]*?\n\}/) || [''])[0];
  return /try \{/.test(b) && /catch/.test(b) ? true : 'unguarded: ' + b;
});

console.log('\nTHE VIETNAMESE SUBSETS ARE HINTED TOO');
const pre = [...html.matchAll(/<link rel="preload" href="\.\/fonts\/([\w-]+)\.woff2"/g)].map(m => m[1]);
t('four faces are preloaded, not two', () =>
  pre.length === 4 ? true : 'preloading ' + pre.length + ': ' + pre.join(', '));
t('both halves of both families', () => {
  const want = ['bevietnampro-500-latin','bevietnampro-500-vietnamese','lora-latin','lora-vietnamese'];
  const missing = want.filter(w => !pre.includes(w));
  return missing.length === 0 ? true : 'not hinted: ' + missing.join(', ');
});
t('every preloaded file is one the stylesheet actually asks for', () => {
  const orphan = pre.filter(f => !css.includes(f + '.woff2'));
  return orphan.length === 0 ? true : 'preloading a file no @font-face uses: ' + orphan.join(', ');
});
t('and one the service worker precaches, so the hint is never a second fetch', () => {
  const sw = fs.readFileSync('../sw.js', 'utf8');
  const missing = pre.filter(f => !sw.includes(f + '.woff2'));
  return missing.length === 0 ? true : 'preloaded but not precached: ' + missing.join(', ');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
