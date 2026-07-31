// Two changes under test:
//   1. the vote count can be typed, not only stepped. With 17 players, eleven taps
//      on + is not a counting method.
//   2. the first heading in the role list was flush against the alert above it,
//      because I had zeroed its top margin with a :first-child exception.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const rule = re => { const m = src.match(re); return m ? m[0].replace(/\s+/g,' ') : ''; };

console.log('THE FIRST HEADING BREATHES LIKE THE REST');
t('every heading in the list gets the same top margin', () =>
  /\.roles > \.grp\{margin:var\(--s5\) 0 0\}/.test(src) ? true : rule(/\.roles > \.grp\{[^}]*\}/));
t('the first heading is neither zeroed nor left short', () =>
  !/\.roles > \.grp:first-child\{margin-top:0\}/.test(src) &&
  /\.roles > \.grp:first-child\{margin-top:calc\(var\(--s5\) \+ var\(--s3\)\)\}/.test(src)
    ? true : 'it must carry the flex gap it does not receive');
t('the heading still adds no bottom margin, so the flex gap is the only spacing', () => {
  const r = rule(/\.roles > \.grp\{[^}]*\}/);
  return /margin:var\(--s5\) 0 0\}/.test(r) ? true : r;
});

console.log('\nTHE COUNT CAN BE TYPED');
t('each vote row carries a text input', () =>
  /box\.type = 'text'; box\.inputMode = 'numeric'/.test(src) ? true : 'no input in the row');
t('it asks for a numeric keypad on a phone', () =>
  /inputMode = 'numeric'/.test(src) ? true : 'would open a full keyboard');
t('it is labelled for screen readers', () =>
  /setAttribute\('aria-label', 'votes for ' \+ p\.name\)/.test(src) ? true : 'unlabelled input');
t('focusing selects the value so it can be overwritten', () =>
  /box\.onfocus = \(\) => box\.select\(\)/.test(src) ? true : 'no select on focus');
t('Enter commits rather than submitting anything', () =>
  /if \(e\.key === 'Enter'\)\{ e\.preventDefault\(\); box\.blur\(\); \}/.test(src)
    ? true : 'Enter is not handled');
t('the steppers still work alongside it', () =>
  /minus\.onclick = \(\) => setVote\(p, tallyOf\(p\) - 1\)/.test(src) &&
  /plus\.onclick = \(\) => setVote\(p, tallyOf\(p\) \+ 1\)/.test(src)
    ? true : 'a stepper lost its handler');
t('the input is styled, not left as a stretched field', () => {
  const r = rule(/\.stp input\[type=text\]\{[^}]*\}/);
  return (/flex:0 0 auto/.test(r) && /width:50px/.test(r) && /text-align:center/.test(r))
    ? true : r || 'rule missing';
});

console.log('\nBAD INPUT CANNOT GET IN');
// mirror of the shipped clamp
const clampTyped = (raw, voters) => {
  const digits = String(raw).replace(/[^0-9]/g, '').slice(0, 3);
  return Math.max(0, Math.min(voters, digits === '' ? 0 : parseInt(digits, 10)));
};
t('letters are ignored', () => clampTyped('a5b', 17) === 5 ? true : clampTyped('a5b', 17));
t('an empty box means zero', () => clampTyped('', 17) === 0 ? true : clampTyped('', 17));
t('a minus sign cannot make it negative', () => clampTyped('-3', 17) === 3 ? true : clampTyped('-3', 17));
t('more votes than voters is refused', () => clampTyped('99', 17) === 17 ? true : clampTyped('99', 17));
t('a long paste is truncated, not parsed as millions', () =>
  clampTyped('123456', 17) === 17 ? true : clampTyped('123456', 17));
t('a decimal point is dropped rather than rounding oddly', () =>
  clampTyped('2.9', 17) === 17 ? true : clampTyped('2.9', 17));   // "29" -> clamped to 17
t('the clamp is applied in the shipped code, not just in this test', () =>
  /Math\.min\(voters\.length, digits === '' \? 0 : parseInt\(digits, 10\)\)/.test(src)
    ? true : 'no clamp against the electorate');
t('the stepper is clamped the same way', () =>
  /Math\.min\(voters\.length, Math\.round\(v\) \|\| 0\)/.test(src) ? true : 'stepper unclamped');

console.log('\nTYPING DOES NOT DESTROY THE BOX');
t('rows are built once and only the numbers refresh', () => {
  // Pins the split, not the exact field list — refresh() may need more handles on a
  // row over time, and a keystroke rebuilding the row is the thing to catch.
  const push = (src.match(/cells\.push\(\{[^}]*\}\)/) || [''])[0];
  if (!/function refresh\(\)\{/.test(src)) return 'no refresh(), so a keystroke rebuilds the row';
  const need = ['p','power','minus','plus','box'].filter(k => !new RegExp('\\b' + k + '\\b').test(push));
  return need.length === 0 ? true : 'refresh has no handle on: ' + need.join(', ');
});
t('the box being edited is left alone by refresh', () =>
  /if \(document\.activeElement !== c\.box\) c\.box\.value/.test(src)
    ? true : 'refresh would overwrite the caret position');
t('typing never triggers a full re-render', () => {
  const m = src.match(/box\.oninput = \(\) => \{[\s\S]*?\};/);
  return (m && !/\brender\(\)/.test(m[0])) ? true : 'oninput calls render(), which rebuilds the input';
});
t('the sheriff badge also refreshes rather than re-rendering', () => {
  const m = src.match(/bg\.onclick = \(\) => \{[^}]*\};/);
  return (m && /refresh\(\)/.test(m[0]) && !/\brender\(\)/.test(m[0]))
    ? true : (m ? m[0] : 'badge handler missing');
});
t('the double-vote warning hides instead of being appended twice', () =>
  /twice\.style\.display = cast > TP \? '' : 'none'/.test(src)
    ? true : 'warning is re-appended on every refresh');

console.log('\nTHE VERDICT STILL DRIVES THE BUTTONS');
t('the bar is rebuilt by refresh, so it follows the tally', () => {
  const m = src.match(/function refresh\(\)\{[\s\S]*?\n  \}/);
  return (m && /bar\(opts\)/.test(m[0])) ? true : 'bar is outside refresh and would go stale';
});
t('Hang only appears when a single name clears half', () =>
  /if \(passing\) opts\.push\(\{ t:'Hang '/.test(src) ? true : 'Hang is not gated on passing');
t('clearing the tally does not end the day by accident', () => {
  const m = src.match(/opts\.push\(\{ t: best > 0 \? 'Clear the tally'[\s\S]*?\} \}\);/);
  return (m && /if \(best > 0\)\{ G\.votes = \{\}; G\.sheriffVote = null; refresh\(\); return; \}/.test(m[0]))
    ? true : 'clearing might fall through to proceed()';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
