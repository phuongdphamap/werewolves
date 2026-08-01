// A wolf question is "is any of these a wolf?", not "what does each of these hold?".
// I had guarded five such questions with allKnown() — every card identified — which
// meant the app asked the moderator even when it demonstrably knew the answer: with
// both Werewolf cards placed on a and b, the trio e·d·f cannot contain a wolf no
// matter what those three actually hold.
//
// The guard is now wolfSideKnown(): every card that could put somebody on the wolf
// side has been placed.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');
/* unplacedWolfCards() names cards in the interface language now — it used to hard-code
   r.vi, which put Vietnamese card names inside English sentences. The harness can switch,
   so the two naming assertions below run in both. */
globalThis.LANG = 'vi';
globalThis.T = (vi, en) => LANG === 'vi' ? vi : en;
globalThis.rName = r => T(r.vi, r.name);

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
globalThis.alive    = () => G.players.filter(p => p.alive);
globalThis.withRole = id => G.players.filter(p => p.role === id);
eval(src.match(/function teamOf\(p\)\{[\s\S]*?\n\}/)[0].replace('function teamOf','globalThis.teamOf = function'));
globalThis.isWolf = p => teamOf(p) === 'wolf';
eval(src.match(/function unplacedWolfCards\(\)\{[\s\S]*?\n\}/)[0].replace('function unplacedWolfCards','globalThis.unplacedWolfCards = function'));
eval(src.match(/function wolfSideKnown\(\)\{[\s\S]*?\n\}/)[0].replace('function wolfSideKnown','globalThis.wolfSideKnown = function'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

function board(counts, roles, extra){
  globalThis.G = Object.assign({ rules:'vn', counts, houndSide:null,
    players: roles.map((r,i) => ({ id:'p'+i, name:String.fromCharCode(97+i), role:r,
      alive:true, turned:false })) }, extra || {});
  return G;
}

console.log('THE CASE FROM THE SCREENSHOT');
t('two wolf cards, both placed: an unidentified trio is still decidable', () => {
  board({ wolf:2, seer:1, fox:1, villager:4 },
        ['wolf','wolf','seer',null,'fox',null,null]);
  return wolfSideKnown() === true ? true : 'still refuses to answer';
});
t('and the answer is no, because both wolves are elsewhere', () => {
  board({ wolf:2, seer:1, fox:1, villager:4 },
        ['wolf','wolf','seer',null,'fox',null,null]);
  const trio = [G.players[4], G.players[3], G.players[5]];
  return trio.some(isWolf) === false ? true : 'reported a wolf that is not there';
});
t('one wolf card loose: it correctly refuses', () => {
  board({ wolf:2, seer:1, fox:1, villager:4 },
        ['wolf',null,'seer',null,'fox',null,null]);
  return wolfSideKnown() === false ? true : 'answered without knowing';
});
t('and it names the missing card rather than the unknown players', () => {
  board({ wolf:2 }, ['wolf',null]);
  globalThis.LANG = 'vi';
  return unplacedWolfCards() === 'Ma Sói' ? true : unplacedWolfCards();
});
/* It hard-coded r.vi, so an English interface got a Vietnamese card name dropped into the
   middle of an English sentence. Both directions are pinned. */
t('...in whichever language the interface is speaking', () => {
  board({ wolf:2 }, ['wolf',null]);
  globalThis.LANG = 'en';
  const en = unplacedWolfCards();
  globalThis.LANG = 'vi';
  return en === 'Werewolf' ? true : 'English interface says "' + en + '"';
});
t('several missing copies are counted', () => {
  board({ wolf:3 }, ['wolf',null,null]);
  globalThis.LANG = 'vi';
  return /Ma Sói ×2/.test(unplacedWolfCards()) ? true : unplacedWolfCards();
});
t('and the fallback when nothing is named is translated too', () => {
  board({ wolf:1 }, ['wolf']);
  globalThis.LANG = 'en';
  const en = unplacedWolfCards();
  globalThis.LANG = 'vi';
  const vi = unplacedWolfCards();
  return en !== vi && /wolf card/.test(en) ? true : 'en=' + en + ' vi=' + vi;
});

console.log('\nEVERY ROUTE ONTO THE WOLF SIDE IS COVERED');
t('an unplaced White Werewolf blocks it', () => {
  board({ wolf:1, whitewolf:1 }, ['wolf',null]);
  return wolfSideKnown() === false ? true : 'a loose White Wolf was ignored';
});
t('a Wolf Hound with no side chosen blocks it', () => {
  board({ wolf:1, wolfhound:1 }, ['wolf','wolfhound'], { houndSide:null });
  return wolfSideKnown() === false ? true : 'undecided Hound was ignored';
});
t('a Hound that joined the pack must also be identified', () => {
  board({ wolf:1, wolfhound:1 }, ['wolf',null], { houndSide:'wolf' });
  return wolfSideKnown() === false ? true : 'an unidentified pack member was ignored';
});
t('a Hound that stayed a villager need not be identified', () => {
  board({ wolf:1, wolfhound:1 }, ['wolf',null], { houndSide:'village' });
  return wolfSideKnown() === true ? true : 'blocked by a card that cannot be a wolf';
});
t('an unidentified Wild Child blocks it once anyone has died', () => {
  const g = board({ wolf:1, wildchild:1 }, ['wolf',null,'villager']);
  g.players[2].alive = false;
  return wolfSideKnown() === false ? true : 'a Child that may have turned was ignored';
});
t('but not before the first death, when it cannot have turned', () => {
  board({ wolf:1, wildchild:1 }, ['wolf',null,'villager']);
  return wolfSideKnown() === true ? true : 'blocked on night one for no reason';
});
t('an identified Wild Child never blocks it', () => {
  const g = board({ wolf:1, wildchild:1 }, ['wolf','wildchild','villager']);
  g.players[2].alive = false;
  return wolfSideKnown() === true ? true : 'blocked despite knowing who the Child is';
});
t('a turned Wild Child is reported as a wolf', () => {
  const g = board({ wolf:1, wildchild:1 }, ['wolf','wildchild']);
  g.players[1].turned = true;
  return isWolf(g.players[1]) === true ? true : 'a turned Child was missed';
});
t('plain villagers never block it, however many are unidentified', () => {
  board({ wolf:2, villager:8 }, ['wolf','wolf',null,null,null,null,null,null,null,null]);
  return wolfSideKnown() === true ? true : 'unidentified villagers blocked the answer';
});

console.log('\nTHE SAME GUARD IS USED EVERYWHERE A WOLF IS ASKED ABOUT');
for (const [what, re] of [
  ['the Fox trio',            /if \(wolfSideKnown\(\)\)\{\s*\n\s*G\.n\.foxAns/],
  ['the Bear Tamer growl',    /if \(!wolfSideKnown\(\)\)\{\s*\n\s*B\.appendChild\(el\('div','tell',\s*\n?\s*T\('[^']*','Bear Tamer/],
  ['the wolves\u2019 target list', /'whitewolf'\) && !wolfSideKnown\(\)/],
  ['the Knight\u2019s rust',       /if \(!wolfSideKnown\(\)\) log\('Not every wolf card is placed/],
  ['the victory check',       /if \(!wolfSideKnown\(\)\) return null;/],
  ['the Seer\u2019s answer',       /G\.rules === 'vn' && wolfSideKnown\(\)/],
]) t(what + ' uses it', () => re.test(src) ? true : 'still using the wrong predicate');
t('the old identity predicate is gone entirely', () =>
  !/allKnown/.test(src) ? true : 'allKnown survives: ' + (src.match(/.*allKnown.*/)||[])[0]);
t('the dawn caveat names the specific cards instead', () =>
  /\['elder','knight'\]\.filter\(id => \(G\.counts\[id\] \|\| 0\) > withRole\(id\)\.length\)/.test(src)
    ? true : 'still a vague "some cards unknown"');

console.log('\nIT NO LONGER CONTRADICTS ITSELF ON SCREEN');
t('the Fox note and the Fox behaviour agree', () => {
  // the note claims every wolf is known under the Vietnamese order; the guard must
  // therefore be satisfied in exactly that situation
  const claims = /called after the pack here, so I already know every wolf/.test(src);
  const guards = /if \(wolfSideKnown\(\)\)\{/.test(src);
  return (claims && guards) ? true : 'claim ' + claims + ', guard ' + guards;
});
t('the certainty message explains why it is certain', () =>
  /Every wolf card is placed, so I can answer this with certainty/.test(src)
    ? true : 'no reason given');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
