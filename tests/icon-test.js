// Checks the icon layer: the requested Nerd Font code points are exactly right,
// every glyph has a fallback, and the CSS that makes them render is present.
// This exists because I deleted the .ic rule once while removing "dead" CSS and
// my grep-based check passed anyway.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

eval(src.match(/const NF = \{[^}]*\};/)[0].replace('const NF','globalThis.NF'));
eval(src.match(/const FB = \{[^}]*\};/)[0].replace('const FB','globalThis.FB'));

console.log('THE REQUESTED CODE POINTS');
t('shuffle is U+F074', () =>
  NF.shuffle.codePointAt(0) === 0xF074 ? true : 'U+' + NF.shuffle.codePointAt(0).toString(16));
t('shuffle is a single BMP code unit', () =>
  NF.shuffle.length === 1 ? true : NF.shuffle.length + ' units');
t('music decodes the surrogate pair to U+F0AD4', () =>
  NF.music.codePointAt(0) === 0xF0AD4 ? true : 'U+' + NF.music.codePointAt(0).toString(16));
t('music is a valid surrogate pair', () =>
  (NF.music.length === 2 && [...NF.music].length === 1) ? true
    : NF.music.length + ' units, ' + [...NF.music].length + ' code points');
t('both sit in a Private Use Area', () => {
  const pua = cp => (cp >= 0xE000 && cp <= 0xF8FF) || (cp >= 0xF0000 && cp <= 0xFFFFD);
  return (pua(NF.shuffle.codePointAt(0)) && pua(NF.music.codePointAt(0))) ? true : 'not PUA';
});

console.log('\nFALLBACKS');
t('every Nerd glyph has a fallback', () => {
  const missing = Object.keys(NF).filter(k => !FB[k]);
  return missing.length === 0 ? true : 'no fallback for ' + missing.join(', ');
});
t('no fallback is itself private-use', () => {
  for (const k in FB){
    const cp = FB[k].codePointAt(0);
    if ((cp >= 0xE000 && cp <= 0xF8FF) || cp >= 0xF0000) return k + ' fallback is PUA too';
  }
  return true;
});
t('detection compares a styled measurement against a plain one', () =>
  /c\.font = '32px monospace'[\s\S]*?Symbols Nerd Font[\s\S]*?Math\.abs\(styled - plain\)/.test(src)
    ? true : 'detection logic not found');
t('detection cannot throw the app down', () =>
  /catch \(e\)\{ return false; \}/.test(src) ? true : 'no try/catch guard');

console.log('\nCSS THAT MAKES THEM VISIBLE');
t('the .nf rule declares Nerd Font families', () =>
  /\.nf\{font-family:"Symbols Nerd Font Mono"/.test(src) ? true : '.nf rule missing');
t('the .ic rule exists (it was deleted once)', () =>
  /\.ic\{width:22px/.test(src) ? true : '.ic rule missing again');
t('the unknown-card placeholder is styled', () =>
  /\.ic i\{font-style:normal/.test(src) ? true : '.ic i rule missing');
t('every class used in markup has a rule', () => {
  const used = new Set([...src.matchAll(/class="(ic|nf)"/g)].map(m => m[1]));
  for (const c of used) if (!new RegExp('\\.' + c + '\\{').test(src)) return '.' + c + ' used but unstyled';
  return true;
});

console.log('\nTHE ADD BUTTON MATCHES ITS FIELD');
t('the field draws its font from the shared control tokens', () =>
  /input\[type=text\]\{[^}]*font-size:var\(--ctl-size\)/.test(src)
    ? true : 'field no longer uses the token');
t('the button inherits its font from .btn rather than restating it', () => {
  const m = src.match(/\.row\.tall \.btn\{[^}]*\}/);
  if (!m) return 'rule missing';
  if (/font-(size|family|weight)/.test(m[0])) return 'restates typography, so it can drift: ' + m[0];
  return /\.btn\{[^}]*font-size:var\(--ctl-size\)/.test(src) ? true : '.btn lost the token';
});
t('the token matches the body size, so nothing looks out of scale', () =>
  /--ctl-size:15\.5px/.test(src) && /body\{[^}]*font-size:15\.5px/.test(src)
    ? true : 'token and body size disagree');
t('the button stretches to the field height', () =>
  /\.row\.tall\{align-items:stretch\}/.test(src) ? true : 'not stretching');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
