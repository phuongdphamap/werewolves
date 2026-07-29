// Verifies the two rules just added, against the shipped code:
//   1. a day vote only carries if it clears more than half the voting weight
//   2. the werewolves win the moment they equal the villagers, not only when
//      every villager is dead
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

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
eval(src.match(/function eligibleVoters\(\)\{[\s\S]*?\n\}/)[0].replace('function eligibleVoters','globalThis.eligibleVoters = function'));
eval(src.match(/function totalPower\(\)\{[^}]*\}/)[0].replace('function totalPower','globalThis.totalPower = function'));
eval(src.match(/function checkWin\(\)\{[\s\S]*?\n\}/)[0].replace('function checkWin','globalThis.checkWin = function'));

function table(roles, extra){
  globalThis.G = Object.assign({ rules:'vn', houndSide:null, counts:{}, votes:{}, sheriffVote:null,
    scapegoatVoters:null,
    players: roles.map((r,i) => ({ id:'p'+i, name:'P'+i, role:r, alive:true, sheriff:false,
      voteless:false, lover:false, charmed:false, turned:false })) }, extra||{});
  roles.forEach(r => G.counts[r] = (G.counts[r]||0)+1);
  return G;
}
let pass = 0, fail = 0;
const t = (name, fn) => { const r = fn();
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

// mirrors the app: a name carries only when its weight is strictly over half
function verdict(tally){
  const TP = totalPower(), thr = TP/2;
  const sh = alive().find(p => p.sheriff);
  const wt = G.rules === 'vn' ? 1.5 : 2;
  let lead = [], best = 0;
  for (const p of alive()){
    const power = (tally[p.id]||0) + (G.sheriffVote === p.id && sh ? wt-1 : 0);
    if (power > best){ best = power; lead = [p]; } else if (power === best && power > 0) lead.push(p);
  }
  return { carries: lead.length === 1 && best > thr, best, thr, TP,
           who: lead.length === 1 ? lead[0].name : null, tied: lead.length > 1 };
}

console.log('OVER HALF, OR IT DOES NOT COUNT');
t('7 voters: 4 hands carries, 3 does not', () => {
  table(['wolf','wolf','villager','villager','villager','seer','witch']);
  const a = verdict({ p2:4 }), b = verdict({ p2:3 });
  return (a.carries && !b.carries && a.thr === 3.5) ? true
    : 'thr=' + a.thr + ' four=' + a.carries + ' three=' + b.carries;
});
t('8 voters: 5 carries, 4 is exactly half and fails', () => {
  table(['wolf','wolf','villager','villager','villager','villager','seer','witch']);
  return (verdict({ p2:5 }).carries && !verdict({ p2:4 }).carries) ? true : 'half should fail';
});
t('a plurality below half does not carry', () => {
  table(['wolf','wolf','villager','villager','villager','seer','witch']);
  const v = verdict({ p2:3, p3:2, p4:1 });
  return (!v.carries && v.who === 'P2') ? true : JSON.stringify(v);
});
t('a tie never carries', () => {
  table(['wolf','wolf','villager','villager','villager','seer','witch']);
  const v = verdict({ p2:4, p3:4 });
  return (!v.carries && v.tied) ? true : JSON.stringify(v);
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
t('the badge can push a name over the line on its own', () => {
  const g = table(['wolf','wolf','villager','villager','seer']); g.players[4].sheriff = true;
  G.rules = 'vn'; G.sheriffVote = 'p2';
  const with_ = verdict({ p2:2 });          // 2 hands + 0.5 = 2.5 of 5.5 -> not over half
  const need = verdict({ p2:3 });           // 3 hands + 0.5 = 3.5 of 5.5 -> carries
  return (!with_.carries && need.carries) ? true : 'two=' + with_.best + ' three=' + need.best + ' thr=' + need.thr;
});
t('the Scapegoat\u2019s decree shrinks the electorate', () => {
  const g = table(['wolf','wolf','villager','villager','villager','seer','witch']);
  const before = totalPower();
  g.scapegoatVoters = ['p0','p1','p2'];
  return (before === 7 && totalPower() === 3) ? true : before + ' -> ' + totalPower();
});

console.log('\nPARITY ENDS IT');
t('3 wolves against 3 villagers is a wolf win under Vietnamese rules', () => {
  const g = table(['wolf','wolf','wolf','villager','seer','witch'], { rules:'vn' });
  const w = checkWin();
  return (w && w.who === 'The Werewolves') ? true : JSON.stringify(w);
});
t('the same board is not yet over under Millers Hollow', () => {
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
