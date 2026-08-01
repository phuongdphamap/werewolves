// The placeholder, the Add button and the primary action button must read as one
// family. They previously had three different weights and two different sizes.
// These tests pin them to a single shared spec so they cannot drift apart again.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const rule = re => { const m = src.match(re); return m ? m[0].replace(/\s+/g,' ') : ''; };

const PLACEHOLDER = rule(/input\[type=text\]::placeholder\{[^}]*\}/);
const FIELD       = rule(/  input\[type=text\]\{[^}]*\}/);
const BTN         = rule(/\n  \.btn\{[^}]*\}/);
const ADD         = rule(/\.row\.tall \.btn\{[^}]*\}/);

console.log('ONE SHARED SPEC');
t('the control tokens are declared once', () =>
  /--ctl-size:var\(--t-body\); --ctl-weight:600; --ctl-track:[.\d]+em;/.test(src)
    ? true : 'tokens missing or changed shape');
/* Family and tracking are still shared by every control — that is the voice. SIZE now
   splits, and only because a browser forces it: a focusable input below 16px makes iOS
   zoom the page and never zoom back. The buttons keep --ctl-size; the fields take
   --t-field. One divergence, one reason, both named. */
for (const [what, css] of [['the field', FIELD], ['the placeholder', PLACEHOLDER], ['.btn', BTN]]){
  t(what + ' takes its tracking from the token', () =>
    /letter-spacing:var\(--ctl-track\)/.test(css) ? true : css || 'rule missing');
  t(what + ' uses the UI family', () =>
    /font-family:var\(--ui\)/.test(css) ? true : css || 'rule missing');
}
t('the buttons take their size from the control token', () =>
  /font-size:var\(--ctl-size\)/.test(BTN) ? true : BTN || 'rule missing');
for (const [what, css] of [['the field', FIELD], ['the placeholder', PLACEHOLDER]]){
  t(what + ' takes its size from the field token, which iOS dictates', () =>
    /font-size:var\(--t-field\)/.test(css) ? true : css || 'rule missing');
}
t('no hard-coded control font-size survives', () => {
  const bad = [FIELD, PLACEHOLDER, BTN, ADD].filter(c => /font-size:\d/.test(c));
  return bad.length === 0 ? true : bad.join(' | ');
});

console.log('\nWEIGHT DIFFERS BY EXACTLY ONE STEP');
t('buttons use the token weight (600)', () =>
  /font-weight:var\(--ctl-weight\)/.test(BTN) ? true : BTN);
t('the placeholder is one step lighter (500), so it still reads as empty', () =>
  /font-weight:500/.test(PLACEHOLDER) ? true : PLACEHOLDER);
t('opacity is forced to 1 so the weight is what is seen, not a faded 400', () =>
  /opacity:1/.test(PLACEHOLDER) ? true : 'browser default opacity would wash it out');

console.log('\nADD CANNOT DRIFT FROM THE PRIMARY BUTTON');
t('Add is a plain .btn, not the small variant', () =>
  /<button type="button" class="btn" id="bAdd">/.test(src)
    ? true : 'still carries .sm, which would resize it independently');
t('the Add rule only adjusts layout, never typography', () =>
  !/font-(size|weight|family)/.test(ADD) ? true : ADD);
t('Add still matches the field height', () =>
  /\.row\.tall\{align-items:stretch\}/.test(src) ? true : 'not stretching');
t('the stretch rule is declared exactly once', () => {
  const c = src.split('.row.tall{align-items:stretch}').length - 1;
  return c === 1 ? true : c + ' copies';
});

console.log('\nPOLISH');
t('the repeated Remove action recedes until wanted', () =>
  /\.ico\.quiet\{border-color:transparent/.test(src) ? true : 'quiet variant missing');
t('Remove still reveals itself on hover and keyboard focus', () =>
  /\.ico\.quiet:hover,\.ico\.quiet:focus-visible/.test(src) ? true : 'no focus-visible, unusable by keyboard');
t('the seat list uses the quiet variant', () =>
  /el\('button','ico quiet', T\(/.test(src) ? true : 'still loud');
t('"werewolfs" is gone', () =>
  !/werewolf' \+ \(rec/.test(src) && !/werewolfs/.test(src) ? true : 'bad plural remains');
t('both plural sites agree', () => {
  const n = (src.match(/'werewolves' : 'werewolf'/g) || []).length;
  return n === 2 ? true : n + ' sites use the correct form';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
