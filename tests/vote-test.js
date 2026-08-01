// Verifies the two day-vote rules against the shipped code:
//   1. the most votes hangs — both rulebooks say so, and this app required an absolute
//      majority instead, which on eight voters left a decisive 4/3/1 split with no way to
//      hang anybody at all
//   2. the werewolves win the moment they equal the villagers, not only when
//      every villager is dead
//
// This suite used to MIRROR the app's condition in a local verdict() rather than run the
// app's own, and it asserted "a plurality below half does not carry" as an invariant. So
// it stayed green for the whole life of the bug: it was testing a copy of the mistake.
// verdict() now lifts the real expression out of rDay.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');
/* causeLabel() and unplacedWolfCards() speak the interface language now, so the harness
   supplies the two helpers they reach for. English, so the assertions below stay readable. */
globalThis.T = (vi, en) => en;
globalThis.rName = r => r.name;

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
globalThis.alive = () => G.players.filter(p => p.alive);
globalThis.byId  = id => G.players.find(p => p.id === id);
globalThis.unassigned = () => G.players.filter(p => !p.role);
globalThis.withRole = id => G.players.filter(p => p.role === id);
eval(src.match(/function unplacedWolfCards\(\)\{[\s\S]*?\n\}/)[0].replace('function unplacedWolfCards','globalThis.unplacedWolfCards = function'));
eval(src.match(/function wolfSideKnown\(\)\{[\s\S]*?\n\}/)[0].replace('function wolfSideKnown','globalThis.wolfSideKnown = function'));
eval(src.match(/function teamOf\(p\)\{[\s\S]*?\n\}/)[0].replace('function teamOf','globalThis.teamOf = function'));
globalThis.isWolf = p => teamOf(p) === 'wolf';
eval(src.match(/const fmtN = [^;]*;/)[0].replace('const fmtN','globalThis.fmtN'));
eval(src.match(/function votePower\(p\)\{[^}]*\}/)[0].replace('function votePower','globalThis.votePower = function'));
eval(src.match(/const scapegoatBinds = [^;]*;/)[0].replace('const scapegoatBinds','globalThis.scapegoatBinds'));
eval(src.match(/function eligibleVoters\(\)\{[\s\S]*?\n\}/)[0].replace('function eligibleVoters','globalThis.eligibleVoters = function'));
eval(src.match(/function totalPower\(\)\{[^}]*\}/)[0].replace('function totalPower','globalThis.totalPower = function'));
eval(src.match(/function checkWin\(\)\{[\s\S]*?\n\}/)[0].replace('function checkWin','globalThis.checkWin = function'));

/* eval, as in every suite here: the functions under test are lifted out of the shipped
   ../js/app.js so a test cannot pass against a copy that has drifted. This repo's own
   source is the only input. */
function table(roles, extra){
  globalThis.G = Object.assign({ rules:'vn', houndSide:null, counts:{}, votes:{}, sheriffVote:null,
    scapegoatVoters:null, scapegoatDay:null, day:1,
    players: roles.map((r,i) => ({ id:'p'+i, name:'P'+i, role:r, alive:true, sheriff:false,
      voteless:false, lover:false, charmed:false, turned:false })) }, extra||{});
  roles.forEach(r => G.counts[r] = (G.counts[r]||0)+1);
  return G;
}
let pass = 0, fail = 0;
const t = (name, fn) => { const r = fn();
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

/* The real gate, lifted out of rDay rather than restated here. If the shipped expression
   changes, this changes with it — which is the whole point: the previous local copy
   happily agreed with a rule the game does not have. */
eval(src.match(/const voteNeedsMajority = [^;]*;/)[0]
  .replace('const voteNeedsMajority','globalThis.voteNeedsMajority'));
const GATE = (function(){
  // the comment between the two may be a line or a block comment; neither is the point
  const m = src.match(/const over = best > thr;[\s\S]*?const passing = ([^;]+);/);
  if (!m) throw new Error('the passing expression moved; this suite must follow it');
  return m[1];
})();
function verdict(tally){
  const TP = totalPower(), thr = TP/2;
  const sh = alive().find(p => p.sheriff);
  const wt = G.rules === 'vn' ? 1.5 : 2;
  let lead = [], best = 0;
  for (const p of alive()){
    const power = (tally[p.id]||0) + (G.sheriffVote === p.id && sh ? wt-1 : 0);
    if (power > best){ best = power; lead = [p]; } else if (power === best && power > 0) lead.push(p);
  }
  const over = best > thr;
  const carries = eval(GATE);          // the shipped expression, evaluated on this tally
  return { carries, best, thr, TP, over,
           who: lead.length === 1 ? lead[0].name : null, tied: lead.length > 1 };
}

/* Measured at 320px in a frame: the row that had crossed half gave its name column exactly
   ZERO pixels. .stp took 142 at flex:0 0 auto, the "carries" tag 54 at nowrap, the seat 22
   and three gaps 30 — the whole 246px content box before the name was considered, and .nm
   is the only child that can shrink. The row announced that somebody was about to be
   hanged and did not say who.

   A player's name is the one string this app cannot paraphrase or truncate: saying it out
   loud correctly is the whole product. So it is never the element that yields. */
console.log('A NAME IS NEVER WHAT GETS SACRIFICED');
const CSS = fs.readFileSync('../css/app.css', 'utf8');
const APP = fs.readFileSync('../js/app.js', 'utf8');
t('the winning row no longer spends 54px on a word', () => {
  const line = (APP.match(/c\.power\.textContent = [^;]*;/) || [''])[0];
  return !/'carries'/.test(line)
    ? true : 'the tag is back and the name pays for it: ' + line;
});
t('what is left in that slot is the Sheriff star, which nothing else shows', () => {
  const line = (APP.match(/c\.power\.textContent = [^;]*;/) || [''])[0];
  return /extra \? '\\u2b50' : ''/.test(line) ? true : 'the star was dropped too: ' + line;
});
/* Dropping the tag bought the name 62px of the 128 it needs at 320. The rest has to come
   from somewhere the row can actually give, and the stepper cannot: it is two 44px touch
   targets and a field, all of it the minimum. So the name takes a second line rather than
   an ellipsis. */
t('the name in a vote row wraps rather than ellipsising', () => {
  const rule = (CSS.match(/\.p\.vote \.nm\{[^}]*\}/) || [''])[0];
  if (!rule) return 'no .p.vote .nm rule: the row falls back to .p .nm, which ellipsises';
  const missing = [
    ['white-space:normal',  /white-space:normal/],
    ['overflow:visible',    /overflow:visible/],
    ['text-overflow:clip',  /text-overflow:clip/],
  ].filter(([, re]) => !re.test(rule)).map(([w]) => w);
  return missing.length === 0 ? true : '.p .nm still wins on: ' + missing.join(', ');
});
t('and a name with no space in it still cannot overflow the row', () =>
  /\.p\.vote \.nm\{[^}]*overflow-wrap:anywhere/.test(CSS)
    ? true : 'one long token would push the stepper off the screen');

t('and the slot collapses when it holds nothing', () =>
  /\.p\.vote \.carries:empty\{display:none\}/.test(CSS)
    ? true : 'an empty flex child still costs a gap either side');
/* Removing the word must not remove the FACT. It is still carried three ways on the row,
   and stated in words in the bar note, which is full width and has room. */
t('the row still says it carries, without words', () => {
  const need = [
    ['a red border', /\.p\.vote\.over\{border-color:var\(--wolf\)\}/],
    ['a red name',   /\.p\.vote\.over \.nm\{color:var\(--wolf\)\}/],
    ['a fill',       /\.p\.vote\.over \.fill\{[^}]*var\(--wolf\)/],
  ].filter(([, re]) => !re.test(CSS)).map(([what]) => what);
  return need.length === 0 ? true : 'lost: ' + need.join(', ');
});
t('and the bar note names who carries, in words', () => {
  const r = (APP.match(/function refresh\(\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /'<b class="hit">' \+ lead\[0\]\.name/.test(r)
    ? true : 'nothing states in words which name carries';
});
/* The day's primary action used to read "Hang {name} \u2192". At 320 the button offers 116px
   for its label and the Vietnamese form of a three-part name needs 208, so .bar .in .btn's
   ellipsis trimmed the identity of the person being eliminated off the control that
   commits the elimination. */
t('the confirm button carries no name to truncate', () => {
  const line = (APP.match(/if \(passing\) opts\.push\(\{ t: [^\n]*/) || [''])[0];
  return !/lead\[0\]\.name/.test(line)
    ? true : 'the name is back on a button that ellipsises: ' + line;
});
t('the bar can still ellipsise, since a long label must not break the row', () =>
  /\.bar \.in \.btn\{[^}]*text-overflow:ellipsis\}/.test(CSS)
    ? true : 'a long label would now wrap the button row instead');

console.log('THE MOST VOTES HANGS');
const SEVEN = ['wolf','wolf','villager','villager','villager','seer','witch'];
const EIGHT = ['wolf','wolf','villager','villager','villager','villager','seer','witch'];
t('7 voters: 4 hands carries, and so does 3 when it leads', () => {
  table(SEVEN);
  const a = verdict({ p2:4 }), b = verdict({ p2:3, p3:2, p4:1 });
  return (a.carries && b.carries && a.thr === 3.5) ? true
    : 'thr=' + a.thr + ' four=' + a.carries + ' three-leading=' + b.carries;
});
/* The case that started this: eight voters, every vote cast, one clear leader on four \u2014
   and the app offered no way to hang anybody, while the bar asked for a fifth vote that
   did not exist. */
t('8 voters: a decisive 4/3/1 hangs the leader', () => {
  table(EIGHT);
  const v = verdict({ p2:4, p3:3, p4:1 });
  return (v.carries && v.who === 'P2' && !v.over) ? true : JSON.stringify(v);
});
t('exactly half still carries, because half is not the bar any more', () => {
  table(EIGHT);
  const v = verdict({ p2:4, p3:2, p4:2 });
  return v.carries ? true : JSON.stringify(v);
});
t('a single vote carries if nothing else is cast', () => {
  table(SEVEN);
  return verdict({ p2:1 }).carries ? true : 'one vote and a clear leader should hang';
});
t('no votes at all hangs nobody', () => {
  table(SEVEN);
  const v = verdict({});
  return (!v.carries && v.best === 0) ? true : JSON.stringify(v);
});
/* The gate carries no `best > 0` clause, because it cannot need one: a name only enters
   `lead` on a positive tally, so a single leader already means a vote was cast. That is a
   property of the tally loop, not of the gate, so it is pinned where it lives. */
t('a leader can only exist on a positive tally, which is why the gate needs no zero check', () => {
  const loop = src.match(/for \(const p of A\)\{\n\s*const pw = tallyOf\(p\) \+ extraOf\(p\);[\s\S]*?\n    \}/);
  if (!loop) return 'the tally loop moved; re-check the gate';
  const seeds = /if \(pw > best\)\{ best = pw; lead = \[p\]; \} else if \(pw === best && pw > 0\) lead\.push\(p\)/;
  const gate = src.match(/const passing = ([^;]+);/)[1];
  return seeds.test(loop[0]) && !/best > 0/.test(gate)
    ? true : 'either the loop can seed a zero leader, or the gate re-added a dead check';
});
t('a tie never carries, whatever the count', () => {
  table(SEVEN);
  return (!verdict({ p2:4, p3:4 }).carries && !verdict({ p2:1, p3:1 }).carries)
    ? true : 'a tie hangs nobody until it is re-voted';
});

/* A table that really does demand a majority can still ask for one. Default off, because
   neither rulebook prints it. */
console.log('\nAND A TABLE MAY STILL DEMAND A MAJORITY');
t('the printed rule is the default', () => {
  table(SEVEN); G.voteMajority = null;
  return voteNeedsMajority() === false ? true : 'the app defaults to a rule neither box prints';
});
t('turning it on restores the stricter bar', () => {
  table(EIGHT); G.voteMajority = true;
  const v = verdict({ p2:4, p3:3, p4:1 });
  return !v.carries ? true : 'the override is ignored';
});
t('...and a real majority still carries under it', () => {
  table(EIGHT); G.voteMajority = true;
  return verdict({ p2:5, p3:2, p4:1 }).carries ? true : 'nothing can carry at all';
});
t('turning it explicitly off is the same as the default', () => {
  table(EIGHT); G.voteMajority = false;
  return verdict({ p2:4, p3:3, p4:1 }).carries ? true : 'false and null disagree';
});
t('the silenced Idiot lowers the bar', () => {
  const g = table(['wolf','wolf','villager','idiot','villager','seer','witch']);
  const before = totalPower();
  g.players[3].voteless = true;
  const after = totalPower();
  return (before === 7 && after === 6) ? true : before + ' -> ' + after;
});
t('the badge is worth 1.5 in Vietnamese play, 2 in French', () => {
  const g = table(['wolf','villager','villager','seer']); g.players[1].sheriff = true;
  G.rules = 'vn'; const a = totalPower();
  G.rules = 'mh'; const b = totalPower();
  return (a === 4.5 && b === 5) ? true : 'vn=' + a + ' mh=' + b;
});
/* What the badge is FOR, once the bar is a plurality: it settles a contest the hands
   alone would leave tied. The half-point is exactly enough to do that and nothing more. */
t('the badge breaks a tie the hands alone could not', () => {
  const g = table(['wolf','wolf','villager','villager','seer']); g.players[4].sheriff = true;
  G.rules = 'vn';
  G.sheriffVote = null;  const level = verdict({ p2:2, p3:2 });
  G.sheriffVote = 'p2';  const tipped = verdict({ p2:2, p3:2 });
  return (!level.carries && level.tied && tipped.carries && tipped.who === 'P2')
    ? true : 'level=' + JSON.stringify(level) + ' tipped=' + JSON.stringify(tipped);
});
t('and under a majority house rule it can still push a name over half', () => {
  const g = table(['wolf','wolf','villager','villager','seer']); g.players[4].sheriff = true;
  G.rules = 'vn'; G.voteMajority = true; G.sheriffVote = 'p2';
  const short = verdict({ p2:2 });   // 2 + 0.5 = 2.5 of 5.5 -> under half
  const over  = verdict({ p2:3 });   // 3 + 0.5 = 3.5 of 5.5 -> over
  return (!short.carries && over.carries)
    ? true : 'two=' + short.best + ' three=' + over.best + ' thr=' + over.thr;
});
/* "As he dies he decides who may vote tomorrow." One day. The list used to be cleared
   only by the "Everyone may vote" button on the screen that set it, so a tie on day 2
   silenced the same people for every remaining day \u2014 and because the electorate sets the
   threshold, every later vote was then measured against the wrong number. */
t('the Scapegoat\u2019s decree shrinks the electorate on the day it governs', () => {
  const g = table(['wolf','wolf','villager','villager','villager','seer','witch']);
  const before = totalPower();
  g.day = 3; g.scapegoatVoters = ['p0','p1','p2']; g.scapegoatDay = 3;
  return (before === 7 && totalPower() === 3) ? true : before + ' -> ' + totalPower();
});
t('and it is spent the day after, without anybody clearing it', () => {
  const g = table(['wolf','wolf','villager','villager','villager','seer','witch']);
  g.day = 3; g.scapegoatVoters = ['p0','p1','p2']; g.scapegoatDay = 3;
  const during = totalPower();
  g.day = 4;                                  // nothing else changes; the day moves on
  return (during === 3 && totalPower() === 7)
    ? true : 'day 3 = ' + during + ', day 4 = ' + totalPower() + ' (the village stayed silenced)';
});
t('it does not bite early either', () => {
  const g = table(['wolf','wolf','villager','villager','villager','seer','witch']);
  g.day = 2; g.scapegoatVoters = ['p0','p1','p2']; g.scapegoatDay = 3;
  return totalPower() === 7 ? true : 'silenced them a day before he died';
});
t('a decree with no day attached is ignored, not applied forever', () => {
  // a game saved before the day was recorded: everyone speaks, which is the safe read
  const g = table(['wolf','wolf','villager','seer']);
  g.day = 1; g.scapegoatVoters = ['p0']; g.scapegoatDay = null;
  return totalPower() === 4 ? true : 'an old save would silence the table permanently';
});
t('the day screen reads the same rule, not the raw list', () => {
  const day = (src.match(/function rDay\(\)\{[\s\S]*?\n  const cells = \[\];/) || [''])[0];
  const raw = day.split('\n').filter(l => /G\.scapegoatVoters/.test(l) && !/scapegoatBinds/.test(l)
    && !/\.map\(i=>byId\(i\)\.name\)/.test(l));
  return raw.length === 0 ? true : 'a stale decree would still be announced: ' + raw.join(' // ');
});

console.log('\nPARITY ENDS IT');
t('3 wolves against 3 villagers is a wolf win under Vietnamese rules', () => {
  const g = table(['wolf','wolf','wolf','villager','seer','witch'], { rules:'vn' });
  const w = checkWin();
  return (w && w.who === 'The Werewolves') ? true : JSON.stringify(w);
});
t('the same board is not yet over under Miller’s Hollow', () => {
  table(['wolf','wolf','wolf','villager','seer','witch'], { rules:'mh' });
  return checkWin() === null ? true : JSON.stringify(checkWin());
});
t('2 wolves against 3 villagers continues either way', () => {
  table(['wolf','wolf','villager','seer','witch'], { rules:'vn' });
  const a = checkWin();
  G.rules = 'mh'; const b = checkWin();
  return (a === null && b === null) ? true : JSON.stringify([a,b]);
});
t('wolves outnumbering villagers ends it too', () => {
  const g = table(['wolf','wolf','wolf','villager','seer'], { rules:'vn' });
  g.players[4].alive = false;               // 3 wolves, 1 villager
  const w = checkWin();
  return (w && w.who === 'The Werewolves') ? true : JSON.stringify(w);
});
t('the village still wins the moment the last wolf dies', () => {
  const g = table(['wolf','villager','seer','witch'], { rules:'vn' });
  g.players[0].alive = false;
  const w = checkWin();
  return (w && w.who === 'The Village') ? true : JSON.stringify(w);
});
t('parity does not steal the White Werewolf\u2019s solo win', () => {
  table(['whitewolf','wolf','villager','seer'], { rules:'vn' });
  return checkWin() === null ? true : JSON.stringify(checkWin());
});
t('the Lovers still take precedence over parity', () => {
  const g = table(['wolf','villager','villager','seer'], { rules:'vn' });
  g.players[0].lover = true; g.players[1].lover = true;
  g.players[2].alive = false; g.players[3].alive = false;
  const w = checkWin();
  return (w && w.who === 'The Lovers') ? true : JSON.stringify(w);
});
t('the Piper still takes precedence over parity', () => {
  const g = table(['piper','wolf','villager'], { rules:'vn' });
  g.players[1].charmed = true; g.players[2].charmed = true;
  const w = checkWin();
  return (w && w.who === 'The Pied Piper') ? true : JSON.stringify(w);
});

t('a DEAD player with an unknown card no longer freezes the result', () => {
  const g = table(['wolf','villager','seer'], { rules:'vn' });
  g.players[2].role = null; g.players[2].alive = false;   // died before we learned the card
  const w = checkWin();                                   // 1 wolf vs 1 villager -> parity
  return (w && w.who === 'The Werewolves') ? true
    : 'still blocked: ' + JSON.stringify(w);
});
t('a LIVING player with an unknown card still defers the result', () => {
  const g = table(['wolf','villager','seer'], { rules:'vn' });
  g.players[2].role = null;                               // alive and unidentified
  return checkWin() === null ? true : 'judged too early: ' + JSON.stringify(checkWin());
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
