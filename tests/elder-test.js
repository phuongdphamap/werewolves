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
  // registerDeaths now pulses the phone; this suite is about the rules, not the channel
  'globalThis.buzz = () => {};',
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
  src.match(/const hunterFiresPowerless = [^;]*;/)[0]
    .replace('const hunterFiresPowerless','globalThis.hunterFiresPowerless'),
  grab('kill').replace('function kill','globalThis.kill = function'),
  grab('hunterWouldFire').replace('function hunterWouldFire','globalThis.hunterWouldFire = function'),
  src.match(/const hunterShootsInTheNight = [^;]*;/)[0].replace('const hunterShootsInTheNight','globalThis.hunterShootsInTheNight'),
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

/* Slice exactly one role card. A lazy match to the next "\n }" runs past the card end and
   swallows the ones that follow, which made an assertion about the Hunter fail on a pick:
   belonging to some later role. */
const card = id => {
  const i = src.indexOf("{id:'" + id + "'");
  const j = src.indexOf("\n {id:'", i);
  return src.slice(i, j < 0 ? src.length : j);
};

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

/* Asked at a real table: "the Hunter is still has spell when Elder die, right?" The two
   cards read past each other — the Elder's revenge cancels every villager power and names
   no exception, while the Hunter's own card says he fires "if he is killed by any reason".
   No ruleset addresses the interaction, so this is a house rule rather than a tradition
   split, and the default is the app's reading: the shot is a power, and the power is gone. */
console.log('\nTHE HUNTER AFTER THE ELDER IS A HOUSE RULE');
const hunterShoots = () => {
  table(['elder','hunter','wolf','wolf']);
  hangTheElder();
  registerDeaths(kill(G.players[1], 'wolves'));
  return !!G.pending.hunterId;
};
t('the default is no shot, under both rulesets', () => {
  const vn = (table(['elder','hunter','wolf','wolf']), G.rules = 'vn', hunterShoots());
  table(['elder','hunter','wolf','wolf']); G.rules = 'mh';
  hangTheElder(); registerDeaths(kill(G.players[1], 'wolves'));
  const mh = !!G.pending.hunterId;
  return (!vn && !mh) ? true : 'vn=' + vn + ' mh=' + mh;
});
t('a table that says yes gets the shot back', () => {
  table(['elder','hunter','wolf','wolf']);
  G.hunterElder = true;
  hangTheElder();
  registerDeaths(kill(G.players[1], 'wolves'));
  return !!G.pending.hunterId ? true : 'the override was ignored';
});
t('and saying no explicitly behaves like the default', () => {
  table(['elder','hunter','wolf','wolf']);
  G.hunterElder = false;
  hangTheElder();
  registerDeaths(kill(G.players[1], 'wolves'));
  return !G.pending.hunterId ? true : 'he fired';
});
t('null means follow the published rule, and is distinct from true', () => {
  table(['elder','hunter','wolf','wolf']); G.hunterElder = null;
  const follow = hunterFiresPowerless();
  G.hunterElder = true;
  return (follow === false && hunterFiresPowerless() === true)
    ? true : 'null and true behave alike';
});
t('the ruling survives switching ruleset, like the other two', () => {
  table(['elder','hunter','wolf','wolf']);
  G.hunterElder = true; G.rules = 'vn';
  const a = hunterFiresPowerless();
  G.rules = 'mh';
  return (a && hunterFiresPowerless()) ? true : 'the ruling was lost on switching';
});
t('it does not claim a tradition it has not got', () => {
  // the other two label their default from the ruleset; this one must not, or Miller's
  // Hollow would advertise "có" for a rule whose default is no shot under both
  const ui = grab('houseRulesUI');
  return (/byRule:false/.test(ui) && /r\.byRule \? /.test(ui) && !/const byRule = G\.rules/.test(ui))
    ? true : 'the shared ruleset default is still labelling this row: ' + ui.slice(0, 300);
});
t('overruling it also stops the day screen claiming the gun is gone', () => {
  const day = grab('rDay');
  return /the Hunter does not fire/.test(day) && /!hunterFiresPowerless\(\)[^\n]*the Hunter does not fire/.test(day)
    ? true : 'the alert would contradict the house rule the table just set';
});
t('the other powers are unaffected by this ruling', () => {
  table(['elder','idiot','beartamer','wolf','wolf']);
  G.hunterElder = true;                      // the Hunter keeps his gun...
  hangTheElder();
  return (powerGone(G.players[1]) && powerGone(G.players[2]))
    ? true : '...and the Idiot and Bear Tamer wrongly kept theirs too';
});
t('and it changes nothing while the Elder lives', () => {
  table(['elder','hunter','wolf','wolf']);
  G.hunterElder = false;                     // the strictest setting
  registerDeaths(kill(G.players[1], 'wolves'));
  return !!G.pending.hunterId ? true : 'the ruling suppressed a shot it does not govern';
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

/* Reported twice from the same table, the second time as "the next night the villager team
   still have spell". The rule was firing; the SCREEN said otherwise. A hushed call put its
   notice in #nBody, which the document places after the read-aloud block, so the order was:
   role name, what the card does, "point to the player whose true nature you wish to see",
   and only then, small and underneath, that nobody was going to. At the speed of a real
   night that reads as a live power. */
console.log('\nA HUSHED CALL DOES NOT READ AS A LIVE ONE');
t('the notice comes before the line to be read out', () => {
  const iHush = src.indexOf('id="nHush"'), iSay = src.indexOf('id="nSay"');
  return (iHush > -1 && iHush < iSay)
    ? true : 'the moderator reads "choose someone" before learning nobody will';
});
t('the notice is rendered into that container, not below the line', () => {
  const branch = (src.match(/if \(s\.hush\)\{[\s\S]*?\n  \}/) || [''])[0];
  return (/H\.appendChild/.test(branch) && !/B\.appendChild/.test(branch))
    ? true : 'still appending the notice under the say block: ' + branch.slice(0, 200);
});
t('the heading itself is marked, so the state is visible at a glance', () => {
  const branch = (src.match(/if \(s\.hush\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /hushTag/.test(branch) ? true : 'the role name reads exactly like a live call';
});
t('and the marker is styled, or it renders as bare text', () =>
  /\.hushTag\{/.test(src) ? true : 'no rule for .hushTag');
t('the description is replaced, not left describing a power that is gone', () => {
  const branch = (src.match(/if \(s\.hush\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /\$\('nSub'\)\.textContent = why/.test(branch)
    ? true : 'the sub line still explains what the card does each night';
});
t('the container is cleared on a real call, so nothing carries over', () => {
  const fn = grab('rNight');
  return /H\.innerHTML = ''/.test(fn)
    ? true : 'a live call would inherit the previous step’s hush notice';
});
t('the line itself is still read aloud, which is the whole point', () => {
  const branch = (src.match(/if \(s\.hush\)\{[\s\S]*?\n  \}/) || [''])[0];
  // suppressing it would shorten the night audibly, which is the leak being closed
  return !/nSay.*display.*none|nSayT.*= *''/.test(branch)
    ? true : 'the read-aloud line was suppressed, which re-opens the leak';
});

/* Asked at a table: "when does the Hunter fire, in his call to open eyes or after moderator
   told him die? If after, how to fire — he'll point to someone or what?" He has no
   recurring call at all, so the shot is triggered by his death; and the answer to "how" was
   nowhere on the screen. A table that keeps cards face down can also take it privately in
   the night, because the shot is the one power that identifies its holder by happening. */
console.log('\nTHE SHOT IS TRIGGERED BY DEATH, NOT BY A CALL');
t('the Hunter has no recurring night call to fire in', () => {
  const c = card('hunter');
  return !/every:/.test(c)
    ? true : 'he wakes again, so the shot could be mistaken for a night action';
});
t('his night-one line only identifies him', () => {
  const c = card('hunter');
  return /show yourself to me only/.test(c) && !/pick:/.test(c)
    ? true : 'his roll-call step asks him to do something';
});
t('the queue is what fires it, from registerDeaths', () => {
  const rd = (src.match(/function registerDeaths\(chain\)\{[\s\S]*?\n\}/) || [''])[0];
  return /G\.pending\.hunterId = c\.p\.id/.test(rd) ? true : 'nothing queues the shot';
});
t('one predicate decides whether he fires, for both callers', () => {
  // registerDeaths and the pre-dawn night check must not answer this differently
  const uses = (src.match(/hunterWouldFire\(/g) || []).length;
  return uses >= 3 ? true : 'only ' + uses + ' references; the answer can drift';
});

console.log('\nA PRIVATE NIGHT SHOT IS A HOUSE RULE');
t('the default is public, under both rulesets', () => {
  globalThis.G = { hunterNight:null, rules:'vn' };
  const vn = hunterShootsInTheNight();
  G.rules = 'mh';
  return (!vn && !hunterShootsInTheNight())
    ? true : 'a variant no ruleset describes became a default';
});
t('a table can turn it on, and the ruling survives switching ruleset', () => {
  globalThis.G = { hunterNight:true, rules:'vn' };
  const a = hunterShootsInTheNight(); G.rules = 'mh';
  return (a && hunterShootsInTheNight()) ? true : 'the ruling was lost';
});
t('it is only reachable before the dawn announcement', () => {
  const fn = (src.match(/if \(G\.si >= G\.steps\.length\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /hunterShootsInTheNight\(\) && !G\.nightShotTaken/.test(fn) && /computeDawn\(\)/.test(fn)
    ? true : 'the private shot is not wired into the end of the night: ' + fn;
});
t('it decides from the dawn plan, before anything is committed', () => {
  const fn = (src.match(/if \(G\.si >= G\.steps\.length\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /G\.dawn\.filter\(d => d\.on\)/.test(fn) && /hunterWouldFire\(/.test(fn)
    ? true : 'it does not read the plan, so it cannot know a shot is owed';
});
t('the target joins the dawn list rather than being killed early', () => {
  const fn = (src.match(/function renderHunter\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /G\.dawn\.push\(\{ id:p\.id, cause:'shot', on:true \}\)/.test(fn)
    ? true : 'killing it early would split one night into two announcements';
});
t('and the shot is marked taken, so dawn does not ask again', () => {
  const fn = (src.match(/function renderHunter\(\)\{[\s\S]*?\n\}/) || [''])[0];
  const rd = (src.match(/function registerDeaths\(chain\)\{[\s\S]*?\n\}/) || [''])[0];
  /* EVERY private route out of this screen must mark it, not just the one that picks a
     target: chose somebody, fired wide, and nobody left to hit. Asserting the string
     appeared once let a mutation delete the main one and pass on the escape hatch. */
  const routes = (fn.match(/if \(priv\)/g) || []).length;
  const marks  = (fn.match(/G\.nightShotTaken = true/g) || []).length;
  return (marks >= routes && marks >= 3 && /!G\.nightShotTaken/.test(rd))
    ? true : marks + ' of ' + routes + ' private routes mark the shot taken';
});
t('the flag is cleared when the next night starts', () => {
  const fn = (src.match(/function toNight\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /G\.nightShotTaken = false/.test(fn)
    ? true : 'one private shot would suppress every later one';
});
t('a Hunter voted out is never routed to the private path', () => {
  // it is decided at the end of the NIGHT; the vote path cannot reach it
  const rv = (src.match(/function resolveVote\(p, tie\)\{[\s\S]*?\n\}/) || [''])[0];
  return !/nightShot/.test(rv) ? true : 'a daylight hanging cannot be hidden';
});

console.log('\nTHE SCREEN EXPLAINS HOW HE ACTUALLY FIRES');
t('it says to ask him out loud, and that he chooses', () => {
  const fn = (src.match(/function renderHunter\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /Say it out loud/.test(fn) && /He chooses, not you/.test(fn)
    ? true : 'the moderator is still told only to "tap whoever he points at"';
});
t('the private variant says to wake him and nobody else', () => {
  const fn = (src.match(/function renderHunter\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /Wake him and nobody else/.test(fn) ? true : 'no procedure for the quiet shot';
});
t('and it admits the public shot identifies him whatever the card rule says', () => {
  const fn = (src.match(/function renderHunter\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /the shot identifies him whatever the card rule says/.test(fn)
    ? true : '"his card stays down" would still read as "he stays secret"';
});
t('he is not offered as his own target', () => {
  const fn = (src.match(/function renderHunter\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /alive\(\)\.filter\(p => !hp \|\| p\.id !== hp\.id\)/.test(fn)
    ? true : 'a dying Hunter could be tapped as his own victim';
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
    !new RegExp("role === '" + id + "'[\\s\\S]{0,120}powerGone").test(CODE) &&
    // the Hunter's gate moved into hunterWouldFire, shared with the pre-dawn night check
    !new RegExp("role !== '" + id + "'[\\s\\S]{0,160}powerGone").test(CODE));
  return missing.length === 0 ? true : 'still fires after the Elder: ' + missing.join(', ');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
