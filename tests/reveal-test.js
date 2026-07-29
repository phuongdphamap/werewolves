// The Fox printed his answer inline on the step ("answer YES"), while the Seer's
// was hidden behind a turn-the-screen panel. Two problems with that: the shapes
// were inconsistent, and the Fox's answer sat on the moderator's own display where
// a glance from the table would read it.
//
// Both now use one reveal, and neither prints the answer on the step.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
// brace-match rather than regex: escaping a function signature through two layers
// of string quoting is how the previous version of this helper silently matched nothing
function fn_(name){
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return '';
  const j = src.indexOf('{', i);
  let d = 0, k = j;
  while (k < src.length){
    if (src[k] === '{') d++;
    else if (src[k] === '}'){ d--; if (!d) return src.slice(i, k+1); }
    k++;
  }
  return '';
}

const REVEAL = fn_('showReveal');
const SEER   = fn_('showSeer');
const FOX    = fn_('showFox');
const FOXSTEP = (src.match(/if \(info\.special === 'fox' && chosen\.length === 1\)\{[\s\S]*?\n  \}/) || [''])[0];
const SEERSTEP = (src.match(/if \(s\.role === 'seer' && chosen\.length === 1\)\{[\s\S]*?\n    \}\n  \}/) || [''])[0];

console.log('ONE REVEAL, TWO CALLERS');
t('a shared showReveal exists', () => REVEAL ? true : 'not found');
t('the Seer goes through it', () => /showReveal\(/.test(SEER) ? true : 'still building the panel itself');
t('the Fox goes through it', () => /showReveal\(/.test(FOX) ? true : 'not using the shared reveal');
t('neither writes to the panel elements directly any more', () => {
  const bad = [SEER, FOX].filter(f => /\$\('seerName'\)|\$\('seerTeam'\)|classList\.add\('on'\)/.test(f));
  return bad.length === 0 ? true : 'a caller bypasses showReveal';
});
t('the kicker is addressable, since two roles share the panel', () =>
  /id="revKick"/.test(src) && /\$\('revKick'\)\.textContent = kick/.test(REVEAL)
    ? true : 'the panel would still say "Seer" for the Fox');
t('the kicker names the right role', () =>
  /Turn the screen to the Seer/.test(SEER) && /Turn the screen to the Fox/.test(FOX)
    ? true : 'a role is not named');
t('both offer a Vietnamese kicker too', () =>
  /Đưa màn hình cho Tiên Tri/.test(SEER) && /Đưa màn hình cho Cáo/.test(FOX)
    ? true : 'a kicker is English-only');

console.log('\nTHE ANSWER NEVER APPEARS ON THE STEP');
t('the Fox step no longer prints YES or NO', () =>
  !/answer <b>' \+ \(hit \? 'YES' : 'NO'\)/.test(src) ? true : 'the answer is still inline');
t('the Fox step no longer states the power loss inline', () =>
  !/The Fox loses his power\.'\)\)\);/.test(FOXSTEP) ? true : 'still leaking the outcome');
t('the Seer step still does not print the card', () =>
  !/nm\.textContent/.test(SEERSTEP) ? true : 'the Seer leaks too');
t('both steps offer a button instead', () =>
  /Show him the answer/.test(FOXSTEP) && /Show her the answer/.test(SEERSTEP)
    ? true : 'a step has no reveal button');
t('the Fox button appears only once there is an answer', () =>
  /if \(G\.n\.foxAns != null\)\{[\s\S]*?Show him the answer/.test(FOXSTEP)
    ? true : 'the button would open a blank panel');

console.log('\nTHE FOX STILL TELLS YOU WHO IS BEING CHECKED');
t('the trio is named on the step', () =>
  /<b>Sniffing:<\/b>/.test(FOXSTEP) ? true : 'the moderator cannot see the group');
t('and it explains how the trio is formed', () =>
  /plus their two living neighbours/.test(FOXSTEP) ? true : 'unexplained grouping');
t('naming the trio is not the same as naming the answer', () =>
  !/CÓ SÓI|A WOLF|NO WOLF/.test(FOXSTEP) ? true : 'the verdict wording leaked into the step');

console.log('\nTHE REVEAL ITSELF READS CORRECTLY');
t('it shows the whole trio, not just the target', () =>
  /grp\.map\(p => p\.name\)\.join/.test(FOX) ? true : 'only one name shown');
t('a wolf reads hot, no wolf reads cool', () =>
  /hit \? 'wolf' : 'vil'/.test(FOX) ? true : 'no tone distinction');
t('it says the Fox loses his power when the answer is no', () =>
  /Cáo mất phép|the Fox loses his power/.test(FOX) ? true : 'consequence not shown');
t('the verdict is short enough for the 34px display line', () => {
  const words = FOX.match(/'(CÓ SÓI|KHÔNG CÓ SÓI|A WOLF|NO WOLF)'/g) || [];
  return words.length === 4 ? true : 'expected four verdict strings, found ' + words.length;
});
t('the tone map covers every case showReveal is called with', () => {
  const tones = new Set([...src.matchAll(/showReveal\([\s\S]*?'(wolf|vil|solo|plain)'\)/g)].map(m => m[1]));
  for (const x of tones) if (!new RegExp("tone === '" + x + "'").test(REVEAL) && x !== 'plain')
    return "showReveal has no branch for tone '" + x + "'";
  return true;
});

console.log('\nTHE POWER LOSS STILL FOLLOWS THE ANSWER GIVEN');
t('the recorded answer drives the power loss, not a recomputation', () =>
  /const hit = G\.n\.foxAns != null \? G\.n\.foxAns : grp\.some\(isWolf\)/.test(src)
    ? true : 'applyStep might disagree with what was shown');
t('confirm is still blocked until an unknown trio is answered', () =>
  /needAnswer = G\.n\.foxAns == null/.test(src) ? true : 'could confirm with no answer');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
