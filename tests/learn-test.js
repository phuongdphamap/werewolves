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
// autoFillForced names the card it deduced, and that name now follows the interface
// language rather than the ruleset
globalThis.vnUI = () => G.lang !== 'en';
globalThis.T = (vi, en) => vnUI() ? vi : en;
globalThis.rName = r => T(r.vi, r.name);

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
eval(grab('autoFillForced').replace('function autoFillForced', 'globalThis.autoFillForced = function'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

// counts is the deck; roles is what has been recorded so far, one entry per seat
const board = (counts, roles, rules, lang) => {
  globalThis.G = { counts, rules: rules || 'vn', lang: lang || 'vi', log: [],
    players: roles.map((role, i) => ({ id: i + 1, name: 'P' + (i + 1), role, alive: true })) };
  globalThis.logged = [];
};

console.log('THE LAST CARD IS FILLED IN');
t('one seat left takes the one card left', () => {
  board({ wolf:1, seer:1, villager:1 }, ['wolf','seer',null]);
  const r = autoFillForced();
  if (!r) return 'nothing was filled in';
  return G.players[2].role === 'villager' ? true : 'got ' + G.players[2].role;
});
t('it picks a power card, not just the villagers', () => {
  board({ wolf:1, seer:1, villager:1 }, ['wolf',null,'villager']);
  autoFillForced();
  return G.players[1].role === 'seer' ? true : 'got ' + G.players[1].role;
});
t('it respects a duplicated card that still has a slot free', () => {
  board({ wolf:3, seer:1 }, ['wolf','wolf','seer',null]);
  autoFillForced();
  return G.players[3].role === 'wolf' ? true : 'got ' + G.players[3].role;
});
t('it says what it deduced, so the moderator is not surprised', () => {
  board({ wolf:1, villager:1 }, ['wolf',null]);
  autoFillForced();
  return logged.length === 1 && /P2/.test(logged[0]) ? true : 'log was ' + JSON.stringify(logged);
});
t('the deduced name follows the interface language', () => {
  board({ wolf:1, guard:1 }, ['wolf',null], 'vn', 'vi');
  autoFillForced();
  const vi = logged[0];
  board({ wolf:1, guard:1 }, ['wolf',null], 'vn', 'en');
  autoFillForced();
  return (/B\u1ea3o V\u1ec7/.test(vi) && /Bodyguard/.test(logged[0])) ? true : vi + ' | ' + logged[0];
});
/* ...and NOT the ruleset. Choosing Miller\u2019s Hollow used to rename every card in the
   app, because one flag meant both "which call order" and "which language". */
t('and does not change when only the ruleset does', () => {
  board({ wolf:1, guard:1 }, ['wolf',null], 'vn', 'vi');
  autoFillForced();
  const a = logged[0];
  board({ wolf:1, guard:1 }, ['wolf',null], 'mh', 'vi');
  autoFillForced();
  return a === logged[0] ? true : 'the ruleset still renames the card: ' + a + ' | ' + logged[0];
});

/* Going once round a table of fifteen, the last four are almost always plain Villagers.
   Tapping the same card four times while fifteen people wait is four chances to mis-tap
   for no information, so a run of identical cards is filled in one go. */
console.log('\nA RUN OF IDENTICAL CARDS IS FILLED IN ONE GO');
t('four seats and four Villagers left fills all four', () => {
  board({ wolf:2, seer:1, villager:4 }, ['wolf','wolf','seer',null,null,null,null]);
  const r = autoFillForced();
  const filled = G.players.slice(3).map(p => p.role);
  return (r && filled.every(x => x === 'villager'))
    ? true : 'got ' + JSON.stringify(filled);
});
t('so does a run of werewolves', () => {
  board({ seer:1, villager:1, wolf:3 }, ['seer','villager',null,null,null]);
  autoFillForced();
  return G.players.slice(2).every(p => p.role === 'wolf')
    ? true : JSON.stringify(G.players.map(p => p.role));
});
/* The pair and the trio are the cases where this matters most: they are always the same
   card as each other, so the tail of a deal is frequently exactly them. */
t('the Two Sisters fill together', () => {
  board({ wolf:1, seer:1, sisters:2 }, ['wolf','seer',null,null]);
  autoFillForced();
  return G.players.slice(2).every(p => p.role === 'sisters')
    ? true : JSON.stringify(G.players.map(p => p.role));
});
t('and so do the Three Brothers', () => {
  board({ wolf:1, brothers:3 }, ['wolf',null,null,null]);
  autoFillForced();
  return G.players.slice(1).every(p => p.role === 'brothers')
    ? true : JSON.stringify(G.players.map(p => p.role));
});
t('the log says it filled several, not one', () => {
  board({ wolf:1, villager:3 }, ['wolf',null,null,null]);
  autoFillForced();
  return /3/.test(logged[0] || '') && !/last card/.test(logged[0] || '')
    ? true : 'log was ' + JSON.stringify(logged);
});

console.log('\nIT STAYS QUIET WHEN THE ANSWER IS NOT FORCED');
/* The gate is that the remaining cards are all ALIKE — not that there is only one seat.
   Two seats needing two different cards is still a question only the table can answer. */
t('two seats needing different cards is left alone', () => {
  board({ wolf:1, seer:1, villager:1, guard:1 }, ['wolf','seer',null,null]);
  const r = autoFillForced();
  return (r === null && unassigned().length === 2) ? true : 'it guessed at ' + JSON.stringify(
    G.players.map(p => p.role));
});
t('and so is a run of identical cards that does not balance the seats', () => {
  // three seats, only two Villagers unplaced: the deck has stopped describing the table
  board({ wolf:1, villager:2 }, ['wolf',null,null,null]);
  const r = autoFillForced();
  return (r === null && unassigned().length === 3)
    ? true : 'it filled from a deck that does not add up';
});
/* The imbalance has to be refused in BOTH directions. More cards than seats is just as
   broken as fewer, and hands somebody a card the table does not have — a `<` here instead
   of `!==` reads as cautious and is not. */
t('...and refuses just as firmly when the cards outnumber the seats', () => {
  board({ wolf:1, villager:3 }, ['wolf',null]);        // one seat, three Villagers unplaced
  const r = autoFillForced();
  return (r === null && G.players[1].role === null)
    ? true : 'it filled a seat from an over-counted deck: ' + G.players[1].role;
});
t('an empty board deduces nothing, with no seats to fill', () => {
  board({ wolf:1, seer:1 }, ['wolf','seer']);
  return autoFillForced() === null ? true : 'it invented an assignment';
});
t('a fully recorded table is untouched', () => {
  board({ wolf:1, seer:1 }, ['wolf','seer']);
  return autoFillForced() === null ? true : 'it invented an assignment';
});
t('no card left means no assignment, even with a seat open', () => {
  // a malformed deck: counts are already exhausted, so there is nothing to deduce
  board({ wolf:1 }, ['wolf', null]);
  const r = autoFillForced();
  return (r === null && G.players[1].role === null) ? true : 'assigned ' + G.players[1].role;
});
t('it never assigns a card that is not in the deck', () => {
  board({ wolf:1, villager:1 }, ['wolf',null]);
  autoFillForced();
  return G.counts[G.players[1].role] ? true : G.players[1].role + ' is not in this deck';
});
t('it never exceeds a card count', () => {
  board({ wolf:2, seer:1 }, ['wolf','wolf',null]);
  autoFillForced();
  return withRole('wolf').length <= G.counts.wolf ? true : 'a third wolf appeared';
});

// The Roster is used mid-game, where the deck no longer describes the table: the
// Thief swaps for one of the two spare cards, which were never counted. Deducing
// from a stale deck would hand out a card that has left the game.
console.log('\nIT REFUSES TO DEDUCE FROM A DECK THAT NO LONGER MATCHES');
t('a Thief who swapped for an off-deck card blocks the deduction', () => {
  // deck had a Thief; he took the spare Fox, which was never in G.counts
  board({ thief:1, wolf:1, seer:1, villager:1 }, ['fox','wolf','seer',null]);
  const r = autoFillForced();
  return (r === null && G.players[3].role === null)
    ? true : 'it assigned ' + G.players[3].role + ', a card no longer in play';
});
t('a swap leaves the deck out of balance, which is what blocks it', () => {
  // The safety used to rest on "a drifted deck never shows exactly one free slot", which
  // stopped being the guard when a run of identical cards became fillable. What blocks it
  // now is the balance check: a Thief who took a spare frees his own slot and fills no
  // counted one, so the unplaced cards outnumber the unassigned seats.
  board({ thief:1, wolf:1, seer:1, villager:1 }, ['fox','wolf','seer',null]);
  const short = [];
  for (const k in G.counts) for (let i = withRole(k).length; i < G.counts[k]; i++) short.push(k);
  return short.length === 2 ? true : 'expected 2 free slots, got ' + JSON.stringify(short);
});
t('a swap for a card that IS in the deck also stays ambiguous', () => {
  // he took the spare Werewolf; wolf is now over-filled and thief unaccounted for
  board({ thief:1, wolf:2, seer:1 }, ['wolf','wolf','wolf',null]);
  return autoFillForced() === null ? true : 'deduced from an over-filled deck';
});
t('an over-filled card blocks the deduction', () => {
  board({ wolf:1, seer:1, villager:1 }, ['wolf','wolf',null]);
  return autoFillForced() === null ? true : 'it deduced from an impossible board';
});
t('a clean mid-game board still deduces', () => {
  board({ wolf:1, seer:1, guard:1 }, ['wolf','seer',null]);
  const r = autoFillForced();
  return (r && G.players[2].role === 'guard') ? true : 'got ' + G.players[2].role;
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
