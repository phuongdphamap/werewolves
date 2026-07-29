// Every shuffle must produce a deck that would pass the app's own validation.
// Runs the shipped shuffleDeck across every table size, many times each.
const fs = require('fs');
const src = fs.readFileSync('../index.html','utf8');

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
globalThis.G = { rules:'vn' };
eval(src.match(/function recWolves\(n\)\{[^}]*\}/)[0].replace('function recWolves','globalThis.recWolves = function'));
eval(src.match(/const SHUF = \{[\s\S]*?\n\}\n/)[0].replace('const SHUF','globalThis.SHUF'));
eval(src.match(/const EXCL = .*/)[0].replace('const EXCL','globalThis.EXCL'));
eval(src.match(/function shuffleDeck\(n, chars\)\{[\s\S]*?\n\}/)[0].replace('function shuffleDeck','globalThis.shuffleDeck = function'));

const RUNS = 1500;
let problems = 0;
function check(n, c, rules){
  const tot = Object.values(c).reduce((a,b)=>a+b,0);
  const wolves = Object.keys(c).filter(k => R[k].team === 'wolf').reduce((a,k)=>a+c[k],0);
  let shown = 0;
  const say = m => { if (++shown > 3) { problems++; return; } console.log('   ' + n + 'p [' + rules + '] ' + m + '  -> ' + JSON.stringify(c)); problems++; };
  if (tot !== n) say('deck is ' + tot + ' cards for ' + n + ' seats');
  if (wolves !== recWolves(n)) say('has ' + wolves + ' wolves, expected ' + recWolves(n));
  if (!c.seer) say('no Seer');
  if ((c.villager || 0) < 2) say('only ' + (c.villager||0) + ' villagers');
  for (const k in c){
    if (c[k] > (R[k].max || 24)) say(k + ' exceeds its max');
    if (R[k].exact && c[k] !== R[k].exact) say(k + ' must be exactly ' + R[k].exact);
    if (SHUF[k] && n < SHUF[k][1]) say(k + ' appeared below its minimum table size');
  }
  for (const g of EXCL){
    const hit = g.filter(id => c[id]);
    if (hit.length > 1) say('conflicting cards together: ' + hit.join(' + '));
  }
  if (rules === 'vn' && n >= 8 && !c.guard) say('Vietnamese deck without Bảo Vệ');
}

console.log('legality of every shuffled deck\n');
for (const rules of ['vn','mh']){
  G.rules = rules;
  const chars = true;
  for (let n = 6; n <= 24; n++){
    const seen = new Set();
    for (let i = 0; i < RUNS; i++){
      const c = shuffleDeck(n, chars);
      check(n, c, rules);
      const cb = shuffleDeck(n, false);
      check(n, cb, rules + '/classic');
      for (const k in cb) if (R[k].set === 'Characters'){
        console.log('   ' + n + 'p Classic scope leaked an expansion card: ' + k); problems++; }
      seen.add(Object.keys(c).sort().map(k=>k+c[k]).join('|'));
    }
    if (rules === 'vn')
      console.log('  ' + String(n).padStart(2) + ' players: ' + String(seen.size).padStart(4) +
        ' distinct decks in ' + RUNS + ' shuffles');
  }
}
console.log('\n' + (problems ? problems + ' ILLEGAL DECKS' : 'no illegal deck in ' + (RUNS*19*2).toLocaleString() + ' shuffles'));

// what a handful of shuffles actually look like
console.log('\nfive shuffles at 12 players, Vietnamese rules:');
G.rules = 'vn';
for (let i = 0; i < 5; i++){
  const c = shuffleDeck(12, true);
  console.log('   ' + Object.keys(c).map(k => R[k].vi + (c[k]>1 ? ' \u00d7'+c[k] : '')).join(', '));
}
process.exit(problems ? 1 : 0);
