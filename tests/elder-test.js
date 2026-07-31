// "If the village kills the Elder, all the innocents lose their powers."
//
// This was implemented as "no village card is called at night", which is only the powers
// that happen to wake. Reported from a real table: the Elder died and the other village
// roles still had their spell. They did — six of them, every one triggered somewhere
// other than a night step, because G.powersLost was read in exactly one place.
//
// So this suite is organised by ROLE rather than by code path: for each village card
// with a power, does that power still fire after the village has killed the Elder.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

function grab(name){
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('not found: ' + name);
  let d = 0, k = src.indexOf('{', i);
  while (k < src.length){
    if (src[k] === '{') d++;
    else if (src[k] === '}'){ d--; if (!d) break; }
    k++;
  }
  return src.slice(i, k+1);
}
/* eval, as in every suite here: the functions under test are lifted out of the shipped
   ../js/app.js so a test cannot pass against a copy that has drifted. */
const blocks = [
  src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'),
  'globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);',
  'globalThis.log = t => LOG.push(t);',
  'globalThis.alive = () => G.players.filter(p => p.alive);',
  'globalThis.byId = id => G.players.find(p => p.id === id);',
  'globalThis.liveWith = id => G.players.filter(p => p.alive && p.role === id);',
  'globalThis.withRole = id => G.players.filter(p => p.role === id);',
  (function(){ const m = src.match(/const RULESETS = \{[\s\S]*?const ord = [^;]*;/)[0];
    return m.replace('const RULESETS','globalThis.RULESETS').replace('const over','globalThis.over')
             .replace('const n1Of','globalThis.n1Of').replace('const everyOf','globalThis.everyOf')
             .replace('const ord','globalThis.ord'); })(),
  grab('teamOf').replace('function teamOf','globalThis.teamOf = function'),
  'globalThis.isWolf = p => teamOf(p) === "wolf";',
  src.match(/const powerGone = [^;]*;/)[0].replace('const powerGone','globalThis.powerGone'),
  src.match(/const CAUSE = \{[\s\S]*?\n\};/)[0].replace('const CAUSE','globalThis.CAUSE'),
  src.match(/const causeLabel = [^;]*;/)[0].replace('const causeLabel','globalThis.causeLabel'),
  src.match(/const villageKilled = [^;]*;/)[0].replace('const villageKilled','globalThis.villageKilled'),
  src.match(/const witchMaySaveSelf[\s\S]*?hunterPoison;/)[0]
    .replace('const witchMaySaveSelf','globalThis.witchMaySaveSelf')
    .replace('const hunterFiresPoisoned','globalThis.hunterFiresPoisoned'),
  grab('kill').replace('function kill','globalThis.kill = function'),
  grab('registerDeaths').replace('function registerDeaths','globalThis.registerDeaths = function'),
  grab('buildNight').replace('function buildNight','globalThis.buildNight = function'),
  grab('clockwiseWolfFrom').replace('function clockwiseWolfFrom','globalThis.clockwiseWolfFrom = function'),
  grab('neighbours').replace('function neighbours','globalThis.neighbours = function'),
  // the vote resolution itself, so the Idiot is tested by running it rather than by a
  // copy of its condition — a mirrored condition passes happily with the gate deleted
  'globalThis.snap = () => {}; globalThis.render = () => {};',
  'globalThis.toNight = () => { WENT = "night"; }; globalThis.proceed = () => { WENT = "on"; };',
  'globalThis.finish = w => { WENT = w.who; return w; };',
  grab('resolveVote').replace('function resolveVote','globalThis.resolveVote = function'),
];
globalThis.LOG = [];
eval(blocks.join('\n'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

function table(roles){
  LOG.length = 0;
  globalThis.G = { players: roles.map((r,i) => ({ id:'p'+i, name:'P'+i, role:r, alive:true,
      cause:null, sheriff:false, lover:false, charmed:false, voteless:false, model:false,
      turned:false, revealed:false })),
    counts:{}, night:2, day:2, log:[], steps:[], si:0, n:{}, dawn:[], pending:{},
    witchHeal:true, witchPoison:true, foxPower:true, elderLife:false, powersLost:false,
    judgeUsed:false, houndSide:null, infectNext:null, over:null, rules:'vn', lastGuard:null };
  roles.forEach(r => G.counts[r] = (G.counts[r]||0)+1);
  return G;
}
// the village hangs the Elder, which is what triggers the whole rule
const hangTheElder = () => kill(G.players.find(p => p.role === 'elder'), 'vote');

console.log('THE TRIGGER STILL WORKS');
t('hanging the Elder sets the flag', () => {
  table(['elder','hunter','wolf','wolf']);
  hangTheElder();
  return G.powersLost === true ? true : 'the rule never fired at all';
});
t('and a werewolf kill still does not', () => {
  table(['elder','hunter','wolf','wolf']);
  kill(G.players[0], 'wolves');
  return G.powersLost === false ? true : 'surviving one attack is the point of the card';
});

/* The bug as reported: the flag was set and read in exactly one place — the night call
   list — so every power triggered anywhere else carried on working. */
console.log('\nEVERY VILLAGER POWER, NOT JUST THE ONES THAT WAKE');

t('the Hunter does not fire', () => {
  table(['elder','hunter','wolf','wolf']);
  hangTheElder();
  registerDeaths(kill(G.players[1], 'wolves'));
  return !G.pending.hunterId ? true : 'he took somebody with him after losing the power';
});
t('and the log says why, so the moderator is not guessing', () => {
  table(['elder','hunter','wolf','wolf']);
  hangTheElder();
  registerDeaths(kill(G.players[1], 'wolves'));
  return LOG.some(l => /Elder/.test(l) && /No shot/i.test(l))
    ? true : 'the shot vanished with no explanation: ' + LOG.join(' | ');
});
t('but he still fires while the Elder lives', () => {
  table(['elder','hunter','wolf','wolf']);
  registerDeaths(kill(G.players[1], 'wolves'));
  return !!G.pending.hunterId ? true : 'the gate fires when it should not';
});

t('the Knight’s rust does not spread', () => {
  table(['elder','knight','wolf','wolf']);
  hangTheElder();
  const k = G.players[1];
  // mirrors applyDawn's condition
  const spreads = k.role === 'knight' && !powerGone(k);
  return !spreads ? true : 'the sword still bit after the power was gone';
});
t('but it does while the Elder lives', () => {
  table(['elder','knight','wolf','wolf']);
  const k = G.players[1];
  return (k.role === 'knight' && !powerGone(k)) ? true : 'the gate fires when it should not';
});

t('the Idiot is hanged like anybody else', () => {
  table(['elder','idiot','wolf','wolf']);
  hangTheElder();
  resolveVote(G.players[1]);                 // the real vote resolution, not a copy of it
  return !G.players[1].alive ? true : 'he still walked away from the rope';
});
t('and the log says why', () => {
  table(['elder','idiot','wolf','wolf']);
  hangTheElder();
  resolveVote(G.players[1]);
  return LOG.some(l => /Idiot/.test(l) && /Elder/.test(l))
    ? true : 'he died with no explanation: ' + LOG.join(' | ');
});
t('but he survives it while the Elder lives', () => {
  table(['elder','idiot','wolf','wolf']);
  resolveVote(G.players[1]);
  const i = G.players[1];
  return (i.alive && i.revealed && i.voteless)
    ? true : 'alive=' + i.alive + ' revealed=' + i.revealed + ' voteless=' + i.voteless;
});
t('and an ordinary villager is hanged either way', () => {
  table(['elder','villager','wolf','wolf']);
  resolveVote(G.players[1]);
  return !G.players[1].alive ? true : 'the vote stopped working';
});

for (const [id, what] of [['scapegoat','dies in place of a tie'],
                          ['beartamer','growls at dawn'],
                          ['judge','can demand a second vote'],
                          ['littlegirl','may peek at the pack']]){
  t('the ' + R[id].name + ' no longer ' + what, () => {
    table(['elder', id, 'wolf', 'wolf']);
    hangTheElder();
    return liveWith(id).filter(p => !powerGone(p)).length === 0
      ? true : 'still listed as able to act';
  });
  t('  ...but does while the Elder lives', () => {
    table(['elder', id, 'wolf', 'wolf']);
    return liveWith(id).filter(p => !powerGone(p)).length === 1 ? true : 'gated too early';
  });
}

t('the night calls stop too, which was the half that already worked', () => {
  table(['elder','seer','witch','wolf','wolf']);
  hangTheElder();
  buildNight();
  return G.steps.filter(s => !s.hush).every(s => R[s.role].team !== 'village')
    ? true : 'a village card can still act at night';
});

console.log('\nWHAT THE RULE DOES NOT TAKE');
t('the badge survives — it is a title, not a card', () => {
  table(['elder','villager','wolf','wolf']);
  G.players[1].sheriff = true;
  hangTheElder();
  return G.players[1].sheriff === true
    ? true : 'the Sheriff lost a title the village voted on, not a power';
});
t('the pack keeps everything', () => {
  table(['elder','wolf','whitewolf','villager']);
  hangTheElder();
  return (!powerGone(G.players[1]) && !powerGone(G.players[2]))
    ? true : 'the Elder’s revenge reached the werewolves';
});
t('so does a solo card', () => {
  table(['elder','piper','wolf','wolf']);
  hangTheElder();
  return !powerGone(G.players[1]) ? true : 'the Piper is not one of the innocents';
});
t('a Wild Child who already turned keeps what being a wolf gives him', () => {
  table(['elder','wildchild','wolf','wolf']);
  G.players[1].turned = true;
  hangTheElder();
  return !powerGone(G.players[1]) ? true : 'he is on the wolf side now, not the village';
});
t('a Wolf Hound who joined the pack is not stripped either', () => {
  table(['elder','wolfhound','wolf','wolf']);
  G.houndSide = 'wolf';
  hangTheElder();
  return !powerGone(G.players[1]) ? true : 'he chose the pack, so he is not an innocent';
});
t('but one who chose the village is', () => {
  table(['elder','wolfhound','wolf','wolf']);
  G.houndSide = 'village';
  hangTheElder();
  return powerGone(G.players[1]) ? true : 'he chose the village and kept his power';
});

/* The reason the rule was half-implemented is that it was expressed as one condition in
   one loop. Anything that asks "can this villager still do their thing" must go through
   the predicate, or the next power added will quietly survive the Elder too. */
console.log('\nTHE RULE IS ASKED IN ONE PLACE');
// declarations only — the comments name the flag while explaining the rule
const CODE = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
t('powerGone is what every site reads, not the raw flag', () => {
  const reads = [...CODE.matchAll(/G\.powersLost/g)];
  /* Five legitimate ones, and no more: the predicate itself; the night-call hush, which
     asks about a CARD rather than a player and so cannot take powerGone; and the setter
     in kill(), which reads the flag to avoid logging twice and then writes it; plus the
     day alert. Any sixth is a site deciding the rule for itself, which is exactly how it
     came to be half-implemented. */
  return reads.length <= 5
    ? true : reads.length + ' raw reads of G.powersLost; a site is deciding for itself';
});
t('it reads the side a player is on, not the card they hold', () =>
  /teamOf\(p\) === 'village'/.test(src.match(/const powerGone = [^;]*;/)[0])
    ? true : 'a turned Wild Child would be stripped of being a wolf');
t('every village card with a trigger is gated somewhere', () => {
  // the seven that fire outside a night step; the night list itself is covered above
  const cards = ['hunter','knight','idiot','scapegoat','beartamer','judge','littlegirl'];
  const missing = cards.filter(id =>
    !new RegExp("liveWith\\('" + id + "'\\)[\\s\\S]{0,80}powerGone").test(CODE) &&
    !new RegExp("role === '" + id + "'[\\s\\S]{0,120}powerGone").test(CODE));
  return missing.length === 0 ? true : 'still fires after the Elder: ' + missing.join(', ');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
