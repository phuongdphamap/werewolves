// The teaching layer retires itself after a couple of games. Every other check on it is a
// source pattern; this one RUNS it, because the thing that matters is not that the
// expression is present but that it produces the right answer at 0, 1, 2 and 10 games,
// and that an explicit close still beats the default.
const fs = require('fs');
const src = fs.readFileSync('../js/app.js', 'utf8');

function grab(name){
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('not found: ' + name);
  let d = 0, k = src.indexOf('{', i);
  while (k < src.length){
    if (src[k] === '{') d++;
    else if (src[k] === '}'){ d--; if (!d) break; }
    k++;
  }
  return src.slice(i, k + 1);
}

/* Minimal DOM: collapsible() only needs createElement, a className, .open and an event
   listener. Anything more would be testing jsdom rather than the app. */
globalThis.document = {
  createElement: tag => ({
    tagName: tag, className: '', open: false, children: [],
    innerHTML: '', appendChild(c){ this.children.push(c); }, addEventListener(){},
  }),
};
globalThis.el = (t, c, h) => { const e = document.createElement(t);
  if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
globalThis.T = (vi, en) => en;
/* teaching() reads `prefs`, not G: both overrides became device preferences in v6, so a
   new game no longer forgets them. The harness supplies the store the predicate expects. */
globalThis.prefs = { tips: null };

/* eval, as in every suite here: the functions under test are lifted out of the shipped
   ../js/app.js rather than copied, so a test cannot pass against a copy that has drifted
   from what actually ships. The only input is a file in this repository — there is no
   untrusted data on this path, and the alternative (a hand-kept duplicate of the
   predicate) is what these tests exist to prevent. `document` below is a four-method
   stub, not a DOM: innerHTML is a plain property on a plain object. */
eval(src.match(/const teaching = [^;]*;/)[0].replace('const teaching', 'globalThis.teaching'));
eval('globalThis.expOpen = new Set(); globalThis.expShut = new Set();');
eval(grab('collapsible').replace('function collapsible', 'globalThis.collapsible = function'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

const reset = () => { expOpen.clear(); expShut.clear(); };
const isOpen = key => collapsible(key, 'x', '<p>y</p>').open;

console.log('IT RETIRES ON EXPERIENCE, NOT ON A TAP');
for (const [games, want] of [[0, true], [1, true], [2, false], [10, false]]){
  t(games + ' game(s) played -> teaching is ' + want, () => {
    globalThis.gamesPlayed = games; globalThis.prefs = { tips: null };
    return teaching() === want ? true : 'got ' + teaching();
  });
}
t('the boundary is two, so a second game still gets the full text', () => {
  globalThis.prefs = { tips: null };
  globalThis.gamesPlayed = 1; const a = teaching();
  globalThis.gamesPlayed = 2; const b = teaching();
  return a === true && b === false ? true : 'boundary moved: 1=' + a + ' 2=' + b;
});

console.log('\nAND THE MODERATOR CAN OVERRULE THE GUESS');
t('"always" shows it on a well-practised device', () => {
  globalThis.gamesPlayed = 50; globalThis.prefs = { tips: true };
  return teaching() === true ? true : 'the override is ignored';
});
t('"hide" retires it on a brand new one', () => {
  globalThis.gamesPlayed = 0; globalThis.prefs = { tips: false };
  return teaching() === false ? true : 'the override is ignored';
});
t('null really means "decide for me", not "off"', () => {
  globalThis.gamesPlayed = 0; globalThis.prefs = { tips: null };
  return teaching() === true ? true : 'a fresh device would be taught nothing';
});

console.log('\nWHAT A COLLAPSIBLE ACTUALLY DOES WITH THAT');
t('a first game opens an untouched block', () => {
  reset(); globalThis.gamesPlayed = 0; globalThis.prefs = { tips: null };
  return isOpen('deal') === true ? true : 'the guidance is hidden on the first game';
});
t('a practised device leaves it closed', () => {
  reset(); globalThis.gamesPlayed = 5; globalThis.prefs = { tips: null };
  return isOpen('deal') === false ? true : 'still unfolding essays for someone who knows';
});
/* The two sets exist for exactly this: "never touched" and "deliberately closed" have to
   be distinguishable, or teaching() would reopen a block on every render after the
   moderator shut it. */
t('closing one during a first game keeps it closed', () => {
  reset(); globalThis.gamesPlayed = 0; globalThis.prefs = { tips: null };
  expShut.add('deal');
  return isOpen('deal') === false ? true : 'it springs back open on the next render';
});
t('and opening one on a practised device keeps it open', () => {
  reset(); globalThis.gamesPlayed = 9; globalThis.prefs = { tips: null };
  expOpen.add('deal');
  return isOpen('deal') === true ? true : 'it snaps shut again on the next render';
});
t('the two stores do not bleed into each other', () => {
  reset(); globalThis.gamesPlayed = 0; globalThis.prefs = { tips: null };
  expShut.add('deal');
  return isOpen('order') === true && isOpen('deal') === false
    ? true : 'shutting one block silently shut the others';
});
t('turning the tips back on reopens what was never explicitly shut', () => {
  reset(); globalThis.gamesPlayed = 20; globalThis.prefs = { tips: true };
  return isOpen('order') === true ? true : '"always show" does not actually show';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
