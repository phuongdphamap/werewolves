// The icon layer: one monochrome sprite, tinted by team, no emoji and no font
// dependency. It replaced full-colour platform emoji plus a Nerd Font probe that in
// practice fell back to an emoji anyway.
// The .ic assertion is here because I deleted that rule once while removing "dead"
// CSS and a grep-based check passed regardless.
const fs = require('fs');
const html = fs.readFileSync('../index.html', 'utf8');
const js   = fs.readFileSync('../js/app.js', 'utf8');
const src  = [html, fs.readFileSync('../css/app.css','utf8'), js].join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

const symbols = new Set([...html.matchAll(/<symbol id="i-([a-z-]+)"/g)].map(m => m[1]));
const roleIds = [...js.matchAll(/\{id:'([a-z_]+)'/g)].map(m => m[1]);

console.log('EVERY ROLE HAS A GLYPH');
t('the sprite covers all 25 roles', () => {
  const missing = roleIds.filter(id => !symbols.has(id));
  return missing.length === 0 ? true : 'no symbol for: ' + missing.join(', ');
});
t('the lovers step has one too', () =>
  symbols.has('x-lovers') ? true : 'the pair step would render an empty box');
t('the two UI controls come from the same sprite', () => {
  const missing = ['ui-shuffle','ui-music'].filter(k => !symbols.has(k));
  return missing.length === 0 ? true : 'missing: ' + missing.join(', ');
});
t('no symbol is referenced that does not exist', () => {
  const refs = new Set([...src.matchAll(/href="#i-([a-z-]+)"/g)].map(m => m[1]));
  const dangling = [...refs].filter(r => !symbols.has(r) && !/'/.test(r));
  return dangling.length === 0 ? true : 'dangling <use>: ' + dangling.join(', ');
});

console.log('\nMONOCHROME, TINTED BY TEAM');
t('glyphs inherit colour rather than carrying their own', () =>
  /svg\.ic\{[^}]*stroke:currentColor/.test(src) ? true : 'icons would not take the team tint');
t('a tint exists for every team', () => {
  const missing = ['village','wolf','solo'].filter(x => !new RegExp('\\.ic\\.tm-' + x + '\\{').test(src));
  return missing.length === 0 ? true : 'no tint for: ' + missing.join(', ');
});
t('a player icon uses their current side, not the card default', () =>
  /pIcon = p => p\.role \? icSvg\(p\.role, teamOf\(p\)\)/.test(js)
    ? true : 'a turned Wild Child would show the wrong side');
t('the icon absorbed the team dot', () =>
  !/class="dot t-/.test(js) ? true : 'a dot still repeats what the icon already says');

console.log('\nNO EMOJI, NO FONT DEPENDENCY');
t('no emoji survive in the app source', () => {
  const found = (js + html).match(/[\u{1F300}-\u{1FAFF}]/gu);
  return !found ? true : 'still present: ' + [...new Set(found)].join(' ');
});
t('the Nerd Font probe and its fallbacks are gone', () =>
  !/Symbols Nerd Font|const NF =|const FB =/.test(src)
    ? true : 'the font probe is back, and it fell back to an emoji');

console.log('\nCSS THAT MAKES THEM VISIBLE');
t('the .ic rule exists (it was deleted once)', () =>
  /\.ic\{width:22px/.test(src) ? true : '.ic rule missing again');
t('the unknown-card placeholder is styled', () =>
  /\.ic i\{font-style:normal/.test(src) ? true : '.ic i rule missing');
t('control glyphs are styled too', () =>
  /svg\.uic\{/.test(src) ? true : '.uic rule missing, so shuffle and sound draw at full size');

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
  /--ctl-size:var\(--t-body\)/.test(src) && /body\{[^}]*font-size:var\(--t-body\)/.test(src)
    ? true : 'token and body size disagree');
t('the button stretches to the field height', () =>
  /\.row\.tall\{align-items:stretch\}/.test(src) ? true : 'not stretching');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
