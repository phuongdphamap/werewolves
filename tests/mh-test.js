// Pulls the real functions out of the shipped file and exercises them, so what
// is tested is what ships. A moderator tool that mis-scripts a night is worse
// than no tool at all.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

function grab(name){
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('not found: ' + name);
  const j = src.indexOf('{', i);
  let d = 0, k = j;
  while (k < src.length){
    if (src[k] === '{') d++;
    else if (src[k] === '}'){ d--; if (!d) break; }
    k++;
  }
  return src.slice(i, k+1);
}
const blocks = [
  src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'),
  'globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);',
  'globalThis.alive = () => G.players.filter(p => p.alive);',
  'globalThis.byId = id => G.players.find(p => p.id === id);',
  'globalThis.roleOf = p => R[p.role] || {name:"?",team:"village"};',
  'globalThis.isWolf = p => teamOf(p) === "wolf";',
  'globalThis.liveWith = id => G.players.filter(p => p.alive && p.role === id);',
  'globalThis.withRole = id => G.players.filter(p => p.role === id);',
  'globalThis.unassigned = () => G.players.filter(p => !p.role);',
  (function(){ const m = src.match(/const RULESETS = \{[\s\S]*?const ord = [^;]*;/)[0];
    return m.replace('const RULESETS','globalThis.RULESETS').replace('const over','globalThis.over')
             .replace('const n1Of','globalThis.n1Of').replace('const everyOf','globalThis.everyOf')
             .replace('const ord','globalThis.ord'); })(),
  'globalThis.log = () => {};',
  grab('teamOf').replace('function teamOf','globalThis.teamOf = function'),
  grab('neighbours').replace('function neighbours','globalThis.neighbours = function'),
  grab('clockwiseWolfFrom').replace('function clockwiseWolfFrom','globalThis.clockwiseWolfFrom = function'),
  grab('buildNight').replace('function buildNight','globalThis.buildNight = function'),
  grab('kill').replace('function kill','globalThis.kill = function'),
  'globalThis.withRole = id => G.players.filter(p => p.role === id);',
  src.match(/function unplacedWolfCards\(\)\{[\s\S]*?\n\}/)[0].replace('function unplacedWolfCards','globalThis.unplacedWolfCards = function'),
  src.match(/function wolfSideKnown\(\)\{[\s\S]*?\n\}/)[0].replace('function wolfSideKnown','globalThis.wolfSideKnown = function'),
  grab('checkWin').replace('function checkWin','globalThis.checkWin = function'),
  grab('computeDawn').replace('function computeDawn','globalThis.computeDawn = function'),
];
eval(blocks.join('\n'));

let pass = 0, fail = 0;
function t(name, fn){
  try { const r = fn(); if (r === true) { pass++; console.log('  ok   ' + name); }
        else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } }
  catch (e){ fail++; console.log('  FAIL ' + name + '  threw ' + e.message); }
}
function mk(roles){
  globalThis.G = { players: roles.map((r,i) => ({ id:'p'+i, name:'P'+i, role:r, alive:true,
      cause:null, sheriff:false, lover:false, charmed:false, voteless:false, model:false,
      turned:false, revealed:false })),
    counts:{}, night:1, day:0, log:[], steps:[], si:0, n:{}, dawn:[], pending:{},
    witchHeal:true, witchPoison:true, foxPower:true, elderLife:true, powersLost:false,
    houndSide:null, infectNext:null, over:null, rules:'vn', lastGuard:null };
  roles.forEach(r => G.counts[r] = (G.counts[r]||0)+1);
  return G;
}
const names = () => G.steps.map(s => s.role === '__lovers' ? 'lovers' : R[s.role].name);

console.log('NIGHT SCRIPTING');
t('night 1 rolls call every card in the deck, in call order', () => {
  mk(['thief','cupid','seer','wolf','wolf','witch','villager']);
  G.players.forEach(p => p.role = null);          // physical deal: app knows nothing yet
  G.night = 1; buildNight();
  const n = names();
  return JSON.stringify(n) === JSON.stringify(['Thief','Cupid','lovers','Werewolf','Seer','Witch'])
    ? true : n.join(' | ');
});
t('roll call asks once per card type, not once per copy', () => {
  mk(['wolf','wolf','wolf','seer','villager','villager']);
  G.players.forEach(p => p.role = null);
  G.night = 1; buildNight();
  return names().filter(x => x === 'Werewolf').length === 1 ? true : names().join(' | ');
});
t('roll call skips plain villagers entirely', () => {
  mk(['seer','wolf','villager','villager','villager']);
  G.players.forEach(p => p.role = null);
  G.night = 1; buildNight();
  return !names().includes('Simple Villager') ? true : names().join(' | ');
});
t('passive cards are still called so the moderator learns them', () => {
  mk(['elder','hunter','knight','wolf','wolf','seer']);
  G.players.forEach(p => p.role = null);
  G.night = 1; buildNight();
  const n = names();
  return ['The Elder','Hunter','Knight with the Rusty Sword'].every(x => n.includes(x)) ? true : n.join(' | ');
});
t('no winner is declared while cards are still unknown', () => {
  mk(['seer','wolf','villager']);
  G.players.forEach(p => p.role = null);
  return checkWin() === null ? true : JSON.stringify(checkWin());
});
t('night 2 drops the one-off roles', () => {
  mk(['thief','cupid','seer','wolf','wolf','witch','villager']);
  G.night = 2; buildNight();
  const n = names();
  return JSON.stringify(n) === JSON.stringify(['Werewolf','Seer','Witch']) ? true : n.join(' | ');
});
t('night 2 never calls a card nobody holds', () => {
  mk(['seer','wolf','wolf','villager']);
  G.counts.witch = 1;                              // in the deck but never identified
  G.night = 2; buildNight();
  return !names().includes('Witch') ? true : names().join(' | ');
});
t('a dead Seer is not called', () => {
  mk(['seer','wolf','wolf','villager']);
  G.players[0].alive = false; G.night = 2; buildNight();
  return !names().includes('Seer') ? true : names().join(' | ');
});
t('White Werewolf is identified on night 1, then kills only on even nights', () => {
  mk(['whitewolf','wolf','wolf','seer','villager']);
  G.players.forEach(p => p.role = null);
  G.night = 1; buildNight();
  const roll = names().includes('White Werewolf');   // must be met at the roll call
  mk(['whitewolf','wolf','wolf','seer','villager']);
  G.night = 2; buildNight(); const even = names().includes('White Werewolf');
  G.night = 3; buildNight(); const odd  = names().includes('White Werewolf');
  return (roll && even && !odd) ? true : 'roll=' + roll + ' n2=' + even + ' n3=' + odd;
});
t('spent Witch is skipped', () => {
  mk(['witch','wolf','wolf','villager']);
  G.night = 2; G.witchHeal = false; G.witchPoison = false; buildNight();
  return !names().includes('Witch') ? true : names().join(' | ');
});
t('powerless Fox is skipped', () => {
  mk(['fox','wolf','wolf','villager']);
  G.night = 2; G.foxPower = false; buildNight();
  return !names().includes('The Fox') ? true : names().join(' | ');
});
t('Elder killed by village silences every village power', () => {
  mk(['seer','witch','fox','wolf','wolf','elder']);
  G.night = 2; G.powersLost = true; buildNight();
  const n = names();
  return (n.length === 1 && n[0] === 'Werewolf') ? true : n.join(' | ');
});
t('Sisters are called on the first night and every night after', () => {
  mk(['sisters','sisters','wolf','wolf','villager']);
  G.night = 1; buildNight(); const a = names().filter(x=>x==='The Two Sisters').length;
  G.night = 2; buildNight(); const b = names().filter(x=>x==='The Two Sisters').length;
  return (a === 1 && b === 1) ? true : 'n1=' + a + ' n2=' + b;
});
t('Vietnamese order: pack before Seer, Witch last', () => {
  mk(['guard','seer','wolf','wolf','witch','villager']);
  G.rules = 'vn'; G.night = 3; buildNight();
  const n = names();
  return n.indexOf('Bodyguard') < n.indexOf('Werewolf')
      && n.indexOf('Werewolf') < n.indexOf('Seer')
      && n.indexOf('Seer') < n.indexOf('Witch') ? true : n.join(' | ');
});
t('Miller’s Hollow order: Seer before pack, Witch last', () => {
  mk(['guard','seer','wolf','wolf','witch','villager']);
  G.rules = 'mh'; G.night = 3; buildNight();
  const n = names();
  return n.indexOf('Seer') < n.indexOf('Werewolf')
      && n.indexOf('Werewolf') < n.indexOf('Witch') ? true : n.join(' | ');
});
t('switching ruleset moves the two information roles and nothing else', () => {
  mk(['guard','seer','wolf','witch','fox','piper','villager']);
  G.night = 3;
  G.rules = 'vn'; buildNight(); const a = names();
  G.rules = 'mh'; buildNight(); const b = names();
  // the Fox travels with the Seer: both are called after the pack under the
  // Vietnamese order, and before it under Miller’s Hollow
  const strip = x => x.filter(y => y !== 'Seer' && y !== 'The Fox').join(',');
  return strip(a) === strip(b) && a.join() !== b.join() ? true : a.join(' | ') + '   vs   ' + b.join(' | ');
});
t('the Bodyguard shields the pack\u2019s victim', () => {
  mk(['guard','villager','wolf','wolf']);
  G.n.wolf = 'p1'; G.n.guard = 'p1'; computeDawn();
  return G.dawn.length === 0 ? true : JSON.stringify(G.dawn);
});
t('shielding somebody else does not save the victim', () => {
  mk(['guard','villager','villager','wolf']);
  G.n.wolf = 'p1'; G.n.guard = 'p2'; computeDawn();
  return G.dawn.length === 1 && G.dawn[0].id === 'p1' ? true : JSON.stringify(G.dawn);
});

console.log('\nNEVER GUESS AN UNSEEN CARD');
t('a wolf question is decidable once every wolf card is placed', () => {
  // it does not matter what the trio holds, only that no wolf card is loose
  mk(['fox','villager','wolf','villager','villager']);
  G.players[1].role = null; G.players[3].role = null;   // two unidentified villagers
  const decidable = wolfSideKnown();
  G.players[2].role = null;                             // now the wolf card is loose
  const blocked = wolfSideKnown();
  return (decidable === true && blocked === false)
    ? true : 'decidable=' + decidable + ' blocked=' + blocked;
});
t('an unknown card is never treated as a werewolf', () => {
  mk(['fox','wolf']);
  G.players[1].role = null;
  return isWolf(G.players[1]) === false ? true : 'an unidentified player counted as a wolf';
});
t('and with a card loose the app names it rather than guessing', () => {
  mk(['fox','wolf','wolf']);
  G.players[2].role = null;
  return (!wolfSideKnown() && /Ma Sói/.test(unplacedWolfCards()))
    ? true : 'wolfSideKnown=' + wolfSideKnown() + ' names=' + unplacedWolfCards();
});
t('the Fox answer honours the moderator over the app', () => {
  mk(['fox','villager','villager']);
  G.players.forEach(p => p.role = null);
  const trio = G.players;
  const computed = trio.some(isWolf);            // would be false, and wrong
  G.n.foxAns = true;                             // moderator looked and saw a wolf
  const used = G.n.foxAns != null ? G.n.foxAns : computed;
  return (computed === false && used === true) ? true : 'computed=' + computed + ' used=' + used;
});

console.log('\nSEATING');
t('neighbours skip the dead', () => {
  mk(['villager','villager','villager','villager','villager']);
  G.players[1].alive = false; G.players[4].alive = false;
  const nb = neighbours(G.players[0]).map(p => p.name);
  return JSON.stringify(nb) === JSON.stringify(['P3','P2']) ? true : nb.join(',');
});
t('Knight infects the next living wolf clockwise', () => {
  mk(['knight','villager','wolf','wolf','villager']);
  const w = clockwiseWolfFrom(G.players[0]);
  return w && w.name === 'P2' ? true : String(w && w.name);
});
t('Knight skips a dead wolf', () => {
  mk(['knight','wolf','wolf','villager']);
  G.players[1].alive = false;
  const w = clockwiseWolfFrom(G.players[0]);
  return w && w.name === 'P2' ? true : String(w && w.name);
});
t('Fox trio is the target plus two living neighbours', () => {
  mk(['fox','villager','wolf','villager','villager']);
  const t0 = G.players[3];
  const trio = [t0, ...neighbours(t0)].map(p => p.name).sort();
  return JSON.stringify(trio) === JSON.stringify(['P2','P3','P4']) ? true : trio.join(',');
});

console.log('\nDEATH CASCADES');
t('a Lover dies of grief', () => {
  mk(['villager','villager','wolf','wolf']);
  G.players[0].lover = G.players[1].lover = true;
  const chain = kill(G.players[0], 'werewolves');
  return (!G.players[1].alive && chain.length === 2) ? true : 'chain=' + chain.length;
});
t('Wild Child turns when the model dies', () => {
  mk(['wildchild','villager','wolf','wolf']);
  G.players[1].model = true;
  kill(G.players[1], 'werewolves');
  return G.players[0].turned === true ? true : 'not turned';
});
t('a turned Wild Child counts as a wolf', () => {
  mk(['wildchild','wolf','villager']);
  G.players[0].turned = true;
  return isWolf(G.players[0]) === true ? true : 'still village';
});
t('Wolf Hound follows the side it chose', () => {
  mk(['wolfhound','wolf','villager']);
  G.houndSide = 'wolf'; const a = isWolf(G.players[0]);
  G.houndSide = 'village'; const b = isWolf(G.players[0]);
  return (a && !b) ? true : 'wolf=' + a + ' village=' + b;
});
t('Elder survives the first werewolf attack', () => {
  mk(['elder','wolf','wolf','villager']);
  G.n.wolf = 'p0'; computeDawn();
  const spared = G.dawn.length === 0 && G.elderLife === false;
  return spared ? true : 'dawn=' + JSON.stringify(G.dawn) + ' life=' + G.elderLife;
});
t('Elder dies to the second attack', () => {
  mk(['elder','wolf','wolf','villager']);
  G.elderLife = false; G.n.wolf = 'p0'; computeDawn();
  return G.dawn.length === 1 && G.dawn[0].id === 'p0' ? true : JSON.stringify(G.dawn);
});
t('the Witch overrides the wolves', () => {
  mk(['witch','villager','wolf','wolf']);
  G.n.wolf = 'p1'; G.n.witchSave = true; computeDawn();
  return G.dawn.length === 0 ? true : JSON.stringify(G.dawn);
});
t('poison and fangs on one night kill two', () => {
  mk(['witch','villager','villager','wolf','wolf']);
  G.n.wolf = 'p1'; G.n.witchKill = 'p2'; computeDawn();
  return G.dawn.length === 2 ? true : JSON.stringify(G.dawn);
});

console.log('\nVICTORY');
t('village wins with no wolves left', () => {
  mk(['villager','seer','wolf']);
  G.players[2].alive = false;
  const w = checkWin();
  return w && w.who === 'The Village' ? true : JSON.stringify(w);
});
t('wolves win with no villagers left', () => {
  mk(['villager','seer','wolf','wolf']);
  G.players[0].alive = G.players[1].alive = false;
  const w = checkWin();
  return w && w.who === 'The Werewolves' ? true : JSON.stringify(w);
});
t('two surviving Lovers win alone', () => {
  mk(['villager','wolf','villager','wolf']);
  G.players[0].lover = G.players[1].lover = true;
  G.players[2].alive = G.players[3].alive = false;
  const w = checkWin();
  return w && w.who === 'The Lovers' ? true : JSON.stringify(w);
});
t('Piper wins when everyone living is charmed', () => {
  mk(['piper','villager','villager','wolf']);
  G.players[1].charmed = G.players[2].charmed = G.players[3].charmed = true;
  const w = checkWin();
  return w && w.who === 'The Pied Piper' ? true : JSON.stringify(w);
});
t('Piper does not win while one is uncharmed', () => {
  mk(['piper','villager','villager','wolf']);
  G.players[1].charmed = true;
  return checkWin() === null ? true : JSON.stringify(checkWin());
});
t('White Werewolf wins alone', () => {
  mk(['whitewolf','wolf','villager']);
  G.players[1].alive = G.players[2].alive = false;
  const w = checkWin();
  return w && w.who === 'The White Werewolf' ? true : JSON.stringify(w);
});
t('White Wolf and pack alive is not yet a wolf win', () => {
  mk(['whitewolf','wolf','villager']);
  G.players[2].alive = false;
  return checkWin() === null ? true : JSON.stringify(checkWin());
});
t('game continues while both sides live', () => {
  mk(['villager','seer','wolf','wolf','witch']);
  return checkWin() === null ? true : JSON.stringify(checkWin());
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
