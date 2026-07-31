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
  src.match(/const CAUSE = \{[\s\S]*?\n\};/)[0].replace('const CAUSE','globalThis.CAUSE'),
  src.match(/const causeLabel = [^;]*;/)[0].replace('const causeLabel','globalThis.causeLabel'),
  src.match(/const villageKilled = [^;]*;/)[0].replace('const villageKilled','globalThis.villageKilled'),
  grab('teamOf').replace('function teamOf','globalThis.teamOf = function'),
  grab('neighbours').replace('function neighbours','globalThis.neighbours = function'),
  grab('clockwiseWolfFrom').replace('function clockwiseWolfFrom','globalThis.clockwiseWolfFrom = function'),
  grab('buildNight').replace('function buildNight','globalThis.buildNight = function'),
  grab('kill').replace('function kill','globalThis.kill = function'),
  grab('noteSkip').replace('function noteSkip','globalThis.noteSkip = function'),
  grab('thiefTakes').replace('function thiefTakes','globalThis.thiefTakes = function'),
  'globalThis.withRole = id => G.players.filter(p => p.role === id);',
  src.match(/function unplacedWolfCards\(\)\{[\s\S]*?\n\}/)[0].replace('function unplacedWolfCards','globalThis.unplacedWolfCards = function'),
  src.match(/function wolfSideKnown\(\)\{[\s\S]*?\n\}/)[0].replace('function wolfSideKnown','globalThis.wolfSideKnown = function'),
  grab('checkWin').replace('function checkWin','globalThis.checkWin = function'),
  grab('computeDawn').replace('function computeDawn','globalThis.computeDawn = function'),
  // applyDawn is the commit step, and the split between "work out the night" and "commit
  // it" is itself under test now, so the real function has to be here. Only the things
  // that touch the DOM or the phase machine are stubbed.
  'globalThis.snap = () => {}; globalThis.registerDeaths = () => {};',
  'globalThis.proceed = () => {}; globalThis.finish = w => w; globalThis.render = () => {};',
  grab('applyDawn').replace('function applyDawn','globalThis.applyDawn = function'),
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
    houndSide:null, infectNext:null, over:null, rules:'vn', lastGuard:null,
    elderAbsorbed:false, votes:{}, sheriffVote:null, resume:'night' };
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
/* This used to assert the opposite — that an unidentified card is dropped from night 2 —
   which is what the app did, for the whole rest of the game rather than for one night. A
   Bodyguard who was asleep during his own roll call never shielded anybody again, the
   Witch kept both potions to the end, and dawn still called every one of those nights
   fully resolved. The card is in play, so the step exists; what the app does not know is
   who holds it, so it asks. */
t('a card in the deck that nobody answered for is still called', () => {
  mk(['seer','wolf','wolf','villager']);
  G.counts.guard = 1;                              // in the deck but never identified
  G.night = 2; buildNight();
  return names().includes('Bodyguard') ? true
    : 'dropped for the rest of the game: ' + names().join(' | ');
});
t('and it is called as an identification, not as an action', () => {
  mk(['seer','wolf','wolf','villager']);
  G.counts.guard = 1;
  G.night = 2; buildNight();
  const s = G.steps.find(x => x.role === 'guard');
  return (s && s.roll === true && !s.hush) ? true
    : 'the step would ask him to shield somebody nobody has identified: ' + JSON.stringify(s);
});
t('a partly identified pair is asked about, not assumed complete', () => {
  // one Sister named, one never answered: the app knows the pair is short
  mk(['sisters','sisters','wolf','wolf','villager']);
  G.players[1].role = null;
  G.night = 2; buildNight();
  const s = G.steps.find(x => x.role === 'sisters');
  return (s && s.roll === true) ? true : JSON.stringify(s);
});
t('once every copy is identified it becomes an ordinary call again', () => {
  mk(['sisters','sisters','wolf','wolf','villager']);
  G.night = 2; buildNight();
  const s = G.steps.find(x => x.role === 'sisters');
  return (s && !s.roll && !s.hush) ? true : JSON.stringify(s);
});
/* Dropping a call is audible. If the Seer dies and the night gets one step shorter, the
   table hears it and narrows the rest by elimination — so a dead card is still called,
   marked hush so only the moderator's screen knows nobody wakes. */
t('a dead Seer is still called, so the night sounds unchanged', () => {
  mk(['seer','wolf','wolf','villager']);
  G.players[0].alive = false; G.night = 2; buildNight();
  return names().includes('Seer') ? true : 'the missing step would announce the death';
});
t('the dead Seer’s step is hushed, not actionable', () => {
  mk(['seer','wolf','wolf','villager']);
  G.players[0].alive = false; G.night = 2; buildNight();
  const s = G.steps.find(x => x.role === 'seer');
  return s && s.hush === 'dead' ? true : JSON.stringify(s);
});
t('a card that was never in the deck is not called', () => {
  // the other half of the old check: absent cards must stay absent
  mk(['seer','wolf','wolf','villager']);
  G.night = 2; buildNight();
  const absent = ['The Pied Piper','Bodyguard','The Actor','The Two Sisters'];
  const wrong = absent.filter(n => names().includes(n));
  return wrong.length === 0 ? true : 'called a card nobody has: ' + wrong.join(', ');
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
t('a spent Witch is still called, hushed', () => {
  // she is alive, so skipping her would tell the pack both potions are gone
  mk(['witch','wolf','wolf','villager']);
  G.night = 2; G.witchHeal = false; G.witchPoison = false; buildNight();
  const s = G.steps.find(x => x.role === 'witch');
  return (s && s.hush === 'spent') ? true : JSON.stringify(s);
});
t('a Witch with one potion left is a real call, not hushed', () => {
  mk(['witch','wolf','wolf','villager']);
  G.night = 2; G.witchHeal = false; G.witchPoison = true; buildNight();
  const s = G.steps.find(x => x.role === 'witch');
  return (s && !s.hush) ? true : 'hushed a Witch who can still act: ' + JSON.stringify(s);
});
t('a powerless Fox is still called, hushed', () => {
  mk(['fox','wolf','wolf','villager']);
  G.night = 2; G.foxPower = false; buildNight();
  const s = G.steps.find(x => x.role === 'fox');
  return (s && s.hush === 'spent') ? true : JSON.stringify(s);
});
/* This used to assert that lost powers make the village calls DISAPPEAR, which is the one
   place the hush rule was not applied — four lines above the code that invented it. That
   the powers are gone is public; how many calls vanish with them is not, and the delta
   tells the table how many powered village cards the deck held. Same premise as the hush,
   opposite conclusion, same loop. */
t('Elder killed by village silences every village power', () => {
  mk(['seer','witch','fox','wolf','wolf','elder']);
  G.night = 2; G.powersLost = true; buildNight();
  const acting = G.steps.filter(s => !s.hush).map(s => R[s.role].name);
  return (acting.length === 1 && acting[0] === 'Werewolf') ? true : acting.join(' | ');
});
t('but the village cards are still called, so the night keeps its length', () => {
  mk(['seer','witch','fox','wolf','wolf','elder']);
  G.night = 2; buildNight();
  const before = G.steps.length;
  G.powersLost = true; buildNight();
  return G.steps.length === before
    ? true : 'the night went from ' + before + ' calls to ' + G.steps.length +
             ', which counts the powered village cards out loud';
});
t('and each of them says why nobody wakes', () => {
  mk(['seer','witch','fox','wolf','wolf','elder']);
  G.night = 2; G.powersLost = true; buildNight();
  const village = G.steps.filter(s => R[s.role].team === 'village');
  return (village.length === 3 && village.every(s => s.hush === 'powerless'))
    ? true : JSON.stringify(village);
});
t('a wolf-side card is never hushed for lost powers', () => {
  mk(['seer','wolf','wolf','whitewolf','elder']);
  G.night = 2; G.powersLost = true; buildNight();
  const wolves = G.steps.filter(s => R[s.role].team === 'wolf');
  return wolves.every(s => s.hush !== 'powerless')
    ? true : 'the pack lost its powers too: ' + JSON.stringify(wolves);
});

/* The consequence above was already right; the TRIGGER was not. powersLost was set at
   the vote only, so poisoning or shooting the Elder left every village power intact. */
console.log('\nTHE ELDER’S DEATH, BY EVERY ROUTE');
const elderDeadBy = cause => {
  mk(['elder','seer','wolf','wolf']);
  G.elderLife = false;                      // his one free life already spent
  kill(G.players[0], cause);
  return G.powersLost;
};
for (const cause of ['vote', 'tie', 'poison', 'shot'])
  t('“' + causeLabel(cause) + '” costs the village its powers', () =>
    elderDeadBy(cause) ? true : 'powers survived a village-caused Elder death');

t('a werewolf kill costs the village nothing', () =>
  // surviving one attack is the point of the card; a second is an ordinary death
  !elderDeadBy('wolves') ? true : 'a wolf kill wrongly stripped the village');
t('nor does the White Werewolf or the Knight’s rust', () =>
  (!elderDeadBy('white') && !elderDeadBy('rust'))
    ? true : 'a wolf-side death wrongly stripped the village');

/* The rule is decided by a CODE on the cause, not by matching the sentence. Both of the
   rules that used to read the prose — this one and the poisoned Hunter's — would have
   switched off silently the first time somebody edited the copy or translated it. */
console.log('\nA CAUSE IS A CODE, NOT A SENTENCE');
t('every cause the app passes to kill() is a declared code', () => {
  const passed = [...src.matchAll(/(?:kill|add)\([^,]+, *'([a-z]+)'/g)].map(m => m[1]);
  const unknown = [...new Set(passed)].filter(c => !CAUSE[c]);
  return unknown.length === 0 ? true : 'undeclared, so it would render raw: ' + unknown.join(', ');
});
t('every village-caused code is one the app really passes somewhere', () => {
  const passed = new Set([...src.matchAll(/(?:kill|add)\([^,]+, *'([a-z]+)'/g)].map(m => m[1]));
  const village = Object.keys(CAUSE).filter(c => CAUSE[c].village);
  const dead = village.filter(c => !passed.has(c));
  return dead.length === 0 ? true : 'these would never fire: ' + dead.join(', ');
});
t('no cause is passed as the display sentence any more', () => {
  const prose = [...src.matchAll(/(?:kill|add)\([^,]+, *'([^']*(?: [^']*)+)'/g)].map(m => m[1]);
  return prose.length === 0 ? true : 'a sentence is still being used as a cause: ' + prose.join(' / ');
});
t('the poisoned Hunter is decided on the code, not on /poison/', () => {
  const rd = grab('registerDeaths');
  return /c\.cause === 'poison'/.test(rd) && !/\/poison\/\.test/.test(rd)
    ? true : 'still matching the prose: ' + rd;
});
t('a code with no label still renders as something, for an old save', () =>
  (causeLabel('the tie') === 'the tie' && causeLabel(null) === 'dead')
    ? true : 'a pre-code save would print undefined beside a dead player');
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
  return G.dawn.length === 0 ? true : JSON.stringify(G.dawn);
});
t('Elder dies to the second attack', () => {
  mk(['elder','wolf','wolf','villager']);
  G.elderLife = false; G.n.wolf = 'p0'; computeDawn();
  return G.dawn.length === 1 && G.dawn[0].id === 'p0' ? true : JSON.stringify(G.dawn);
});
/* computeDawn is documented as producing a read model. It also spent the Elder's life —
   inside the branch that composes the sentence explaining it — and applyDawn takes the
   snapshot Undo returns to afterwards. So Undo came back to a state where the life was
   already gone, and the moderator can act in the gap: "something else happened — adjust"
   lets them decide the Elder died after all, and he died having also spent the life that
   was supposed to save him. */
console.log('\nTHE ELDER’S LIFE IS SPENT BY THE OUTCOME, NOT BY THE REPORT');
const elderAttacked = () => { mk(['elder','wolf','wolf','villager']); G.n.wolf = 'p0'; computeDawn(); };
t('working out the dawn does not spend it', () => {
  elderAttacked();
  return G.elderLife === true ? true : 'a read model wrote to the game state';
});
t('but it records that it will be spent', () => {
  elderAttacked();
  return G.elderAbsorbed === true ? true : 'the intent is not recorded, so nothing can commit it';
});
t('announcing the dawn spends it', () => {
  elderAttacked(); applyDawn();
  return (G.elderLife === false && G.elderAbsorbed === false)
    ? true : 'life=' + G.elderLife + ' intent=' + G.elderAbsorbed;
});
t('and Undo comes back to a state where he still has it', () => {
  elderAttacked();
  // snapshot exactly where applyDawn does, before it commits anything
  const before = JSON.parse(JSON.stringify(G));
  applyDawn();
  return before.elderLife === true ? true : 'Undo would restore a spent life';
});
t('adjusting the dawn to kill him after all does not also spend it', () => {
  elderAttacked();
  G.dawn.push({ id:'p0', cause:'night', on:true });   // "something else happened"
  applyDawn();
  return (!G.players[0].alive && G.elderLife === true)
    ? true : 'he died having also burnt the life that was meant to save him';
});
t('a second attack still kills him', () => {
  mk(['elder','wolf','wolf','villager']);
  G.elderLife = false; G.n.wolf = 'p0'; computeDawn();
  return (G.dawn.length === 1 && G.elderAbsorbed === false) ? true : JSON.stringify(G.dawn);
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

/* noteSkip exists so computeDawn can be honest about gaps, and it was wired to exactly
   one caller. The roll-call Skip, the Witch's, the Wolf Hound's and the Thief's all
   advanced the step on their own — so skipping the Bodyguard left the gap list empty,
   dawnSure stayed true, and the moderator read out a death the app had no standing to be
   sure about. A missing entry in a gap list looks exactly like no gap. */
/* The Thief is the only move that changes which cards are at the table mid-game, and it
   moved a role without telling G.counts. That was untidy while the night was built from
   the live holders; it became a disappearing card the moment buildNight started reading
   G.counts as the record of what is in play. */
console.log('\nTHE THIEF’S SWAP CHANGES THE DECK');
const thiefSwap = to => {
  mk(['thief','seer','wolf','wolf','villager']);
  thiefTakes(G.players[0], R[to]);
  return G;
};
t('the card he took is in the deck afterwards', () => {
  thiefSwap('fox');
  return G.counts.fox === 1 ? true : 'counts.fox=' + G.counts.fox;
});
t('and the card he put back is not', () => {
  thiefSwap('fox');
  return G.counts.thief === undefined ? true : 'counts.thief=' + G.counts.thief;
});
t('the table still holds exactly as many cards as before', () => {
  mk(['thief','seer','wolf','wolf','villager']);
  const before = Object.values(G.counts).reduce((a,b) => a+b, 0);
  thiefTakes(G.players[0], R.fox);
  const after = Object.values(G.counts).reduce((a,b) => a+b, 0);
  return before === after ? true : before + ' -> ' + after;
});
t('so the card he took is called on later nights', () => {
  // this is the whole point: the deck-driven night must see the swap
  thiefSwap('fox');
  G.night = 2; buildNight();
  return names().includes('The Fox')
    ? true : 'the Thief-as-Fox never wakes again: ' + names().join(' | ');
});
t('taking a second copy of a card already in the deck counts both', () => {
  thiefSwap('wolf');
  return G.counts.wolf === 3 ? true : 'counts.wolf=' + G.counts.wolf;
});
t('the Roster no longer reports the Thief as an unplaced card', () => {
  thiefSwap('fox');
  const need = {}; for (const k in G.counts) need[k] = G.counts[k];
  for (const p of G.players) if (p.role && need[p.role] != null) need[p.role]--;
  const missing = Object.keys(need).filter(k => need[k] > 0);
  return missing.length === 0 ? true : 'still listed as missing: ' + missing.join(', ');
});
t('a swap onto the wolf side keeps the wolf question answerable', () => {
  thiefSwap('whitewolf');
  return wolfSideKnown() ? true : 'the app can no longer say who is a wolf';
});
t('the Thief step is wired to it, not to a bare role assignment', () => {
  // the tests above exercise thiefTakes directly, so they pass even if nothing calls it
  const step = (src.match(/if \(info\.special === 'thief'\)\{[\s\S]*?\n  \}/) || [''])[0];
  return (/thiefTakes\(th, r\)/.test(step) && !/th\.role = /.test(step))
    ? true : 'the swap bypasses the helper: ' + step;
});
t('nothing else moves a card without telling the deck', () => {
  /* Every other assignment records a card the deck already counts — identifying a holder
     (r.id / s.role), clearing one (null), the forced last card (short[0], read straight
     out of G.counts), and the villager fill, which only runs when the leftover seats
     exactly equal G.counts.villager. The Thief was the one that did not. */
  const safe = /= *(?:r\.id|s\.role|null|short\[0\]|'villager')/;
  const assigns = [...src.matchAll(/\b[\w[\]]+\.role = [^;)]+/g)].map(m => m[0]);
  const unaccounted = assigns.filter(a => !safe.test(a));
  return unaccounted.length === 0
    ? true : 'a role is set by a route that may not be in G.counts: ' + unaccounted.join(' // ');
});

console.log('\nEVERY SKIP IS RECORDED');
t('every Skip button in the app reaches skipStep', () => {
  const skips = [...src.matchAll(/\{ t:'[^']*[Ss]kip[^']*'[^}]*on:([^}]*(?:\}[^}]*)??)\}/g)]
    .map(m => m[1].trim());
  if (skips.length < 5) return 'only found ' + skips.length + ' Skip buttons to check';
  const bare = skips.filter(h => !/skipStep\(/.test(h));
  return bare.length === 0 ? true
    : bare.length + ' Skip button(s) advance the step without recording it: ' + bare.join(' // ');
});
t('a skipped action is recorded as one', () => {
  mk(['guard','seer','wolf','wolf']);
  noteSkip('guard');
  return (G.n.skipped || []).includes('guard') ? true : JSON.stringify(G.n);
});
t('an unanswered card is recorded separately from a skipped action', () => {
  mk(['guard','seer','wolf','wolf']);
  noteSkip('guard', 'card');
  return ((G.n.noCard || []).includes('guard') && !(G.n.skipped || []).includes('guard'))
    ? true : JSON.stringify(G.n);
});
t('skipping the Bodyguard stops dawn calling itself certain', () => {
  mk(['guard','villager','wolf','wolf']);
  G.n.wolf = 'p1'; noteSkip('guard'); computeDawn();
  return (G.dawnSure === false && /Bảo Vệ/.test(G.dawnGaps.join(' ')))
    ? true : 'sure=' + G.dawnSure + ' gaps=' + JSON.stringify(G.dawnGaps);
});
t('so does a card nobody would answer for', () => {
  mk(['guard','villager','wolf','wolf']);
  G.n.wolf = 'p1'; noteSkip('guard', 'card'); computeDawn();
  return (G.dawnSure === false && /nobody answered/.test(G.dawnGaps.join(' ')))
    ? true : 'sure=' + G.dawnSure + ' gaps=' + JSON.stringify(G.dawnGaps);
});
t('a night with nothing skipped is still reported as certain', () => {
  mk(['guard','villager','wolf','wolf']);
  G.n.wolf = 'p1'; G.n.guard = 'p0'; computeDawn();
  return G.dawnSure === true ? true : JSON.stringify(G.dawnGaps);
});
t('an uncertain dawn opens the editor once, and does not hold it open', () => {
  mk(['guard','villager','wolf','wolf']);
  G.n.wolf = 'p1'; noteSkip('guard'); computeDawn();
  const opened = G.dawnEdit === true;
  // The only place rDawn may open it is the moderator's own button. It used to set it on
  // every render while the dawn was uncertain, so the collapse was unreachable.
  const forced = grab('rDawn').split('\n')
    .filter(l => /G\.dawnEdit = true/.test(l) && !/onclick/.test(l));
  return (opened && forced.length === 0)
    ? true : 'opened=' + opened + ' render-path writes: ' + forced.join(' // ');
});
t('and there is a control that actually closes it', () => {
  // opening it once is only half the fix if the editor has no way back
  const day = grab('rDawn');
  return /G\.dawnEdit = false; render\(\)/.test(day)
    ? true : 'the adjust list can be opened but never collapsed';
});

/* G.judgeUsed was initialised in blank(), read in rDay, and written nowhere. So the alert
   telling the moderator to watch for the sign stood for the whole game, and the flag was
   decoration — exactly the "option that looks meaningful but does nothing" the project's
   own rules warn about. */
console.log('\nNO DEAD FLAGS');
t('judgeUsed is written somewhere, not only read', () => {
  const writes = [...src.matchAll(/G\.judgeUsed = (\w+)/g)].map(m => m[1]);
  return writes.includes('true') ? true : 'still a flag nothing can ever set';
});
t('the thing that sets it is a control the moderator can reach', () => {
  const day = grab('rDay');
  const line = day.split('\n').find(l => /G\.judgeUsed = true/.test(l));
  return (line && /onclick/.test(day.slice(day.indexOf(line) - 200, day.indexOf(line) + 200)))
    ? true : 'set somewhere the moderator cannot trigger: ' + line;
});
t('and it clears the tally, because a second vote is a fresh count', () => {
  const day = grab('rDay');
  const i = day.indexOf('G.judgeUsed = true');
  return /G\.votes = \{\}/.test(day.slice(i, i + 120))
    ? true : 'the second vote would start from the first one’s numbers';
});
t('once spent, the watch-for-the-sign alert stops', () => {
  const day = grab('rDay');
  return /jd\.length && !G\.judgeUsed/.test(day)
    ? true : 'the alert does not read the flag, so setting it changes nothing';
});
t('every flag in blank() is written somewhere in the app', () => {
  const flags = [...grab('blank').matchAll(/(\w+):(?:true|false|null)/g)].map(m => m[1]);
  // the house rules are set through G[r.key], so their names live in the rows, not in a
  // literal assignment — a genuinely dynamic write, not a missing one
  const dynamic = [...src.matchAll(/\{ key:'(\w+)'/g)].map(m => m[1]);
  const dead = flags.filter(f =>
    !dynamic.includes(f) && !new RegExp('G\\.' + f + '\\s*=[^=]').test(src));
  return dead.length === 0 ? true : 'read but never written: ' + dead.join(', ');
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
t('two surviving Lovers win alone when the pair is mixed', () => {
  mk(['villager','wolf','villager','wolf']);
  G.players[0].lover = G.players[1].lover = true;    // one villager, one wolf
  G.players[2].alive = G.players[3].alive = false;
  const w = checkWin();
  return w && w.who === 'The Lovers' ? true : JSON.stringify(w);
});
/* The pair only wins ALONE when it is mixed — that is the whole of Cupid's card. This
   test sat above the team checks, so a wolf-and-wolf or villager-and-villager pair that
   outlasted everyone was credited to Cupid rather than to the side that actually won. */
t('two lovers on the wolf side win as the werewolves', () => {
  mk(['wolf','wolf','villager','villager']);
  G.players[0].lover = G.players[1].lover = true;
  G.players[2].alive = G.players[3].alive = false;
  const w = checkWin();
  return w && w.who === 'The Werewolves' ? true : JSON.stringify(w);
});
t('two lovers on the village side win as the village', () => {
  mk(['villager','seer','wolf','wolf']);
  G.players[0].lover = G.players[1].lover = true;
  G.players[2].alive = G.players[3].alive = false;
  const w = checkWin();
  return w && w.who === 'The Village' ? true : JSON.stringify(w);
});
/* Fixing the pair to test the two sides re-opened the same hole one layer down: teamOf
   reports 'none' for a card that was never learned, so a village lover beside an
   unidentified one compared 'village' against 'none' and read as mixed. The app is not
   guessing when it calls that pair matched — checkWin has already returned early unless
   wolfSideKnown(), and that predicate's whole argument is that anybody still
   unidentified is provably not a wolf. */
t('an unlearned card does not make a village pair look mixed', () => {
  mk(['villager','seer','wolf','wolf']);
  G.players[1].role = null;                          // never identified, provably not a wolf
  G.players[0].lover = G.players[1].lover = true;
  G.players[2].alive = G.players[3].alive = false;   // both wolf cards placed, both dead
  const w = checkWin();
  return w && w.who === 'The Village' ? true : JSON.stringify(w);
});
t('two unlearned cards are a matched pair, not a mixed one', () => {
  mk(['villager','seer','wolf','wolf']);
  G.players[0].role = G.players[1].role = null;
  G.players[0].lover = G.players[1].lover = true;
  G.players[2].alive = G.players[3].alive = false;
  const w = checkWin();
  return w && w.who === 'The Village' ? true : JSON.stringify(w);
});
t('an unlearned card beside a WOLF is still mixed', () => {
  // the wolf is known, the other provably is not one, so the sides really do differ
  mk(['wolf','villager','seer','wolf']);
  G.players[1].role = null;
  G.players[0].lover = G.players[1].lover = true;
  G.players[2].alive = G.players[3].alive = false;
  const w = checkWin();
  return w && w.who === 'The Lovers' ? true : JSON.stringify(w);
});
t('and none of that is decided while a wolf card is still loose', () => {
  mk(['villager','seer','wolf','wolf']);
  G.players[1].role = null; G.players[3].role = null;   // a wolf card unaccounted for
  G.players[0].lover = G.players[1].lover = true;
  G.players[2].alive = G.players[3].alive = false;
  return checkWin() === null ? true : 'judged the pair without knowing the wolf side';
});
t('the resolution is declared below the gate that licenses it', () => {
  const fn = grab('checkWin');
  return fn.indexOf('wolfSideKnown()') < fn.indexOf('const sideOf')
    ? true : 'sideOf treats an unknown card as village before that has been established';
});
t('a turned Wild Child makes a pair mixed that started matched', () => {
  // he was on the village side when Cupid joined them, and is not any more
  mk(['wildchild','villager','wolf','wolf']);
  G.players[0].lover = G.players[1].lover = true;
  G.players[2].alive = G.players[3].alive = false;
  const same = checkWin();
  G.players[0].turned = true;
  const mixed = checkWin();
  return (same && same.who === 'The Village' && mixed && mixed.who === 'The Lovers')
    ? true : JSON.stringify([same, mixed]);
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
