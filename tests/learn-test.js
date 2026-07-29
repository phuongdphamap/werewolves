// Collecting the deal: once one player is unrecorded there is only one card it can
// be, so the app fills it in rather than asking. The risk in a deduction like this
// is it firing when the answer is not actually forced, so most of these tests are
// about when it must stay quiet.
// eval below is the house pattern for these suites: the real shipped function is
// pulled out of js/app.js and run, so a test can never pass against a copy that has
// drifted from what ships. Input is local source, never anything external.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
globalThis.withRole = id => G.players.filter(p => p.role === id);
globalThis.unassigned = () => G.players.filter(p => !p.role);
globalThis.logged = [];
globalThis.log = (t) => logged.push(t);

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
  return src.slice(i, k + 1);
}
eval(grab('autoFillLastCard').replace('function autoFillLastCard', 'globalThis.autoFillLastCard = function'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

// counts is the deck; roles is what has been recorded so far, one entry per seat
const board = (counts, roles, rules) => {
  globalThis.G = { counts, rules: rules || 'vn', log: [],
    players: roles.map((role, i) => ({ id: i + 1, name: 'P' + (i + 1), role, alive: true })) };
  globalThis.logged = [];
};

console.log('THE LAST CARD IS FILLED IN');
t('one seat left takes the one card left', () => {
  board({ wolf:1, seer:1, villager:1 }, ['wolf','seer',null]);
  const r = autoFillLastCard();
  if (!r) return 'nothing was filled in';
  return G.players[2].role === 'villager' ? true : 'got ' + G.players[2].role;
});
t('it picks a power card, not just the villagers', () => {
  board({ wolf:1, seer:1, villager:1 }, ['wolf',null,'villager']);
  autoFillLastCard();
  return G.players[1].role === 'seer' ? true : 'got ' + G.players[1].role;
});
t('it respects a duplicated card that still has a slot free', () => {
  board({ wolf:3, seer:1 }, ['wolf','wolf','seer',null]);
  autoFillLastCard();
  return G.players[3].role === 'wolf' ? true : 'got ' + G.players[3].role;
});
t('it says what it deduced, so the moderator is not surprised', () => {
  board({ wolf:1, villager:1 }, ['wolf',null]);
  autoFillLastCard();
  return logged.length === 1 && /P2/.test(logged[0]) ? true : 'log was ' + JSON.stringify(logged);
});
t('the deduced name follows the ruleset', () => {
  board({ wolf:1, guard:1 }, ['wolf',null], 'vn');
  autoFillLastCard();
  const vn = logged[0];
  board({ wolf:1, guard:1 }, ['wolf',null], 'mh');
  autoFillLastCard();
  return (/Bảo Vệ/.test(vn) && /Bodyguard/.test(logged[0])) ? true : vn + ' | ' + logged[0];
});

console.log('\nIT STAYS QUIET WHEN THE ANSWER IS NOT FORCED');
t('two seats left is left alone', () => {
  board({ wolf:1, seer:1, villager:2 }, ['wolf','seer',null,null]);
  const r = autoFillLastCard();
  return (r === null && unassigned().length === 2) ? true : 'it guessed at ' + JSON.stringify(
    G.players.map(p => p.role));
});
t('a fully recorded table is untouched', () => {
  board({ wolf:1, seer:1 }, ['wolf','seer']);
  return autoFillLastCard() === null ? true : 'it invented an assignment';
});
t('no card left means no assignment, even with a seat open', () => {
  // a malformed deck: counts are already exhausted, so there is nothing to deduce
  board({ wolf:1 }, ['wolf', null]);
  const r = autoFillLastCard();
  return (r === null && G.players[1].role === null) ? true : 'assigned ' + G.players[1].role;
});
t('it never assigns a card that is not in the deck', () => {
  board({ wolf:1, villager:1 }, ['wolf',null]);
  autoFillLastCard();
  return G.counts[G.players[1].role] ? true : G.players[1].role + ' is not in this deck';
});
t('it never exceeds a card count', () => {
  board({ wolf:2, seer:1 }, ['wolf','wolf',null]);
  autoFillLastCard();
  return withRole('wolf').length <= G.counts.wolf ? true : 'a third wolf appeared';
});

// The Roster is used mid-game, where the deck no longer describes the table: the
// Thief swaps for one of the two spare cards, which were never counted. Deducing
// from a stale deck would hand out a card that has left the game.
console.log('\nIT REFUSES TO DEDUCE FROM A DECK THAT NO LONGER MATCHES');
t('a Thief who swapped for an off-deck card blocks the deduction', () => {
  // deck had a Thief; he took the spare Fox, which was never in G.counts
  board({ thief:1, wolf:1, seer:1, villager:1 }, ['fox','wolf','seer',null]);
  const r = autoFillLastCard();
  return (r === null && G.players[3].role === null)
    ? true : 'it assigned ' + G.players[3].role + ', a card no longer in play';
});
t('a swap leaves two slots looking free, which is what blocks it', () => {
  // This is the invariant the safety rests on, so it is pinned down directly: a
  // Thief who took a spare frees his own slot AND fills no counted one, so a
  // drifted deck can never present the single unambiguous slot the deduction needs.
  board({ thief:1, wolf:1, seer:1, villager:1 }, ['fox','wolf','seer',null]);
  const short = [];
  for (const k in G.counts) for (let i = withRole(k).length; i < G.counts[k]; i++) short.push(k);
  return short.length === 2 ? true : 'expected 2 free slots, got ' + JSON.stringify(short);
});
t('a swap for a card that IS in the deck also stays ambiguous', () => {
  // he took the spare Werewolf; wolf is now over-filled and thief unaccounted for
  board({ thief:1, wolf:2, seer:1 }, ['wolf','wolf','wolf',null]);
  return autoFillLastCard() === null ? true : 'deduced from an over-filled deck';
});
t('an over-filled card blocks the deduction', () => {
  board({ wolf:1, seer:1, villager:1 }, ['wolf','wolf',null]);
  return autoFillLastCard() === null ? true : 'it deduced from an impossible board';
});
t('a clean mid-game board still deduces', () => {
  board({ wolf:1, seer:1, guard:1 }, ['wolf','seer',null]);
  const r = autoFillLastCard();
  return (r && G.players[2].role === 'guard') ? true : 'got ' + G.players[2].role;
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
