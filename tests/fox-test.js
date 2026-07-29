// The Fox has the same structural problem the Seer had: he needs to know who the
// wolves are, and under the published Miller’s Hollow order he is called before
// them. The Vietnamese order's principle is that information roles come after the
// pack, so the Fox now moves with the Seer.
//
// Moving him is safe only because wolf membership cannot change mid-night. These
// tests pin that assumption as well as the ordering itself.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
globalThis.G = { rules:'vn', counts:{}, houndSide:null };
eval(src.match(/const RULESETS = \{[\s\S]*?const ord = [^;]*;/)[0]
  .replace('const RULESETS','globalThis.RULESETS').replace('const over','globalThis.over')
  .replace('const n1Of','globalThis.n1Of').replace('const everyOf','globalThis.everyOf')
  .replace('const ord','globalThis.ord'));
globalThis.alive    = () => G.players.filter(p => p.alive);
globalThis.liveWith = id => G.players.filter(p => p.alive && p.role === id);
globalThis.allKnown = list => list.every(p => !!p.role);
eval(src.match(/function teamOf\(p\)\{[\s\S]*?\n\}/)[0].replace('function teamOf','globalThis.teamOf = function'));
globalThis.isWolf = p => teamOf(p) === 'wolf';
eval(src.match(/function neighbours\(p\)\{[\s\S]*?\n\}/)[0].replace('function neighbours','globalThis.neighbours = function'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const pos = id => { const r = ROLES.find(x => x.id === id); return n1Of(r); };

console.log('THE FOX IS ORDERED LIKE THE SEER');
t('Vietnamese: the Fox is called after the pack', () => {
  G.rules = 'vn';
  return pos('fox') > pos('wolf') ? true : 'fox ' + pos('fox') + ' vs pack ' + pos('wolf');
});
t('Vietnamese: so is the Seer', () => {
  G.rules = 'vn';
  return pos('seer') > pos('wolf') ? true : 'seer ' + pos('seer');
});
t('Vietnamese: the Witch is still last of the four', () => {
  G.rules = 'vn';
  return pos('witch') > pos('seer') && pos('witch') > pos('fox') ? true : 'witch ' + pos('witch');
});
t('Miller’s Hollow keeps its published order, Fox and Seer before the pack', () => {
  G.rules = 'mh';
  return (pos('fox') < pos('wolf') && pos('seer') < pos('wolf'))
    ? true : 'fox ' + pos('fox') + ' seer ' + pos('seer') + ' pack ' + pos('wolf');
});
t('switching ruleset moves only the Fox and the Seer', () => {
  const snap = r => { G.rules = r; return ROLES.filter(x => n1Of(x) != null)
    .sort((a,b) => n1Of(a) - n1Of(b)).map(x => x.id); };
  const a = snap('vn'), b = snap('mh');
  const strip = x => x.filter(i => i !== 'fox' && i !== 'seer').join(',');
  return (strip(a) === strip(b) && a.join() !== b.join())
    ? true : a.join(',') + '\n            ' + b.join(',');
});
t('the two never collide on the same slot', () => {
  for (const r of ['vn','mh']){ G.rules = r; if (pos('fox') === pos('seer')) return 'both at ' + pos('fox'); }
  return true;
});
t('no two called roles share a position in either ruleset', () => {
  for (const r of ['vn','mh']){
    G.rules = r;
    const p = ROLES.filter(x => n1Of(x) != null).map(x => n1Of(x));
    if (new Set(p).size !== p.length) return r + ' has a duplicate slot';
  }
  return true;
});

console.log('\nWHY MOVING HIM IS SAFE');
t('the Wolf Hound settles its side before either position', () => {
  G.rules = 'vn';
  return pos('wolfhound') < pos('wolf') ? true : 'hound at ' + pos('wolfhound');
});
t('a turned Wild Child counts as a wolf, so the trio answer stays correct', () => {
  G.players = [{id:'a',role:'fox',alive:true},{id:'b',role:'wildchild',alive:true,turned:true},
               {id:'c',role:'villager',alive:true}];
  return isWolf(G.players[1]) === true ? true : 'a turned child would be missed';
});
t('the White Werewolf is called after both, so he cannot thin the pack first', () => {
  G.rules = 'vn';
  return pos('whitewolf') > pos('fox') && pos('whitewolf') > pos('seer')
    ? true : 'whitewolf at ' + pos('whitewolf');
});

console.log('\nTHE APP STILL REFUSES TO GUESS');
t('the trio is computed once every wolf card is placed \u2014 not once every card is known', () =>
  // the old guard demanded the whole trio be identified, which made the app ask
  // even when both wolf cards demonstrably sat on other players
  /if \(wolfSideKnown\(\)\)\{/.test(src) && !/allKnown/.test(src)
    ? true : 'still using the identity predicate');
t('an unknown card in the trio hands the answer back to the moderator', () =>
  /I will not guess/.test(src) ? true : 'no manual fallback');
t('the moderator answer overrides the computed one', () =>
  /G\.n\.foxAns != null \? G\.n\.foxAns :/.test(src) ? true : 'the app would ignore you');
t('confirm stays disabled until that answer is given', () =>
  /needAnswer = G\.n\.foxAns == null/.test(src) ? true : 'could be confirmed blank');
t('an unknown card is never treated as a werewolf', () => {
  G.players = [{id:'a',role:null,alive:true},{id:'b',role:'fox',alive:true}];
  return isWolf(G.players[0]) === false ? true : 'unknown counted as wolf';
});

console.log('\nTHE REASON IS ON SCREEN');
t('the Fox step explains its position under each ruleset', () =>
  /s\.role === 'fox'/.test(src) && /called after the pack here/.test(src)
    ? true : 'no explanation on the step');
t('the Miller’s Hollow note warns a card may need reading', () =>
  /I may not know the pack yet, and I will ask rather than guess/.test(src)
    ? true : 'no warning for the French order');
t('the ruleset explainer names the Fox alongside the Seer', () =>
  /Tiên Tri và Cáo được gọi <b>sau<\/b> Ma Sói/.test(src) ? true : 'explainer still mentions only the Seer');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
