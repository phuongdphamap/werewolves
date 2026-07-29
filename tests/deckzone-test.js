// Two changes under test:
//   1. a chosen card lifts out of the catalogue into a "in your deck" zone, so the
//      deck is readable at a glance rather than scattered through 25 rows
//   2. every control answers the pointer and the keyboard
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const rule = re => { const m = src.match(re); return m ? m[0].replace(/\s+/g,' ') : ''; };

// mirror of the shipped partition
const rank = { wolf:0, village:1, solo:2 };
const byTeam = (a,b) => rank[a.team] - rank[b.team];
function partition(counts){
  return { inDeck: ROLES.filter(r => counts[r.id]).sort(byTeam),
           spare:  ROLES.filter(r => !counts[r.id]) };
}

console.log('THE DECK ZONE PARTITIONS CLEANLY');
t('every card appears exactly once across the zones', () => {
  const counts = { wolf:2, seer:1, witch:1, guard:1, villager:3 };
  const { inDeck, spare } = partition(counts);
  const all = [...inDeck, ...spare].map(r => r.id);
  if (all.length !== ROLES.length) return all.length + ' rows for ' + ROLES.length + ' cards';
  return new Set(all).size === ROLES.length ? true : 'a card is listed twice';
});
t('a chosen card is only in the deck zone', () => {
  const { inDeck, spare } = partition({ wolf:2, seer:1 });
  return (inDeck.some(r => r.id === 'seer') && !spare.some(r => r.id === 'seer'))
    ? true : 'the Seer is still down in the catalogue';
});
t('setting a count to zero returns the card to the catalogue', () => {
  const a = partition({ wolf:2, fox:1 });
  const b = partition({ wolf:2 });
  return (a.inDeck.some(r => r.id === 'fox') && b.spare.some(r => r.id === 'fox'))
    ? true : 'the Fox did not go back';
});
t('an empty deck leaves every card in the catalogue', () => {
  const { inDeck, spare } = partition({});
  return (inDeck.length === 0 && spare.length === ROLES.length) ? true
    : inDeck.length + ' / ' + spare.length;
});
t('wolves sort to the top of the deck zone', () => {
  const { inDeck } = partition({ seer:1, villager:2, wolf:2, piper:1 });
  return inDeck[0].team === 'wolf' ? true : inDeck.map(r => r.team).join(',');
});
t('solo roles sort to the bottom', () => {
  const { inDeck } = partition({ seer:1, wolf:2, piper:1 });
  return inDeck[inDeck.length-1].team === 'solo' ? true : inDeck.map(r => r.team).join(',');
});
t('the deck zone mixes both boxes, so it still needs the colour legend', () => {
  const { inDeck } = partition({ wolf:2, seer:1, fox:1 });
  const sets = new Set(inDeck.map(r => r.set));
  return sets.size === 2 ? true : 'only ' + [...sets].join(',');
});

console.log('\nTHE SCREEN REFLECTS THAT');
t('the legend is emitted once, above the zone', () => {
  const c = (src.match(/class="legend"|'legend'/g) || []).length;
  return c === 1 ? true : c + ' legends';
});
t('the zone heading counts against the table size', () =>
  /in your deck[^']*' \+\s*totalCards\(\) \+ ' of ' \+ n/.test(src)
    ? true : 'heading does not show progress');
t('an empty deck shows a prompt, not a bare heading', () =>
  /Chưa chọn lá nào\. Bấm <b>\+<\/b>/.test(src) ? true : 'no empty-state message');
t('a source section with nothing left is skipped entirely', () =>
  /if \(!list\.length\) continue;\s*\/\/ every card from this box is in the deck/.test(src)
    ? true : 'an empty heading would still render');
t('rows in the deck zone are visually promoted', () =>
  /\.r\.picked\{background:var\(--surf2\)/.test(src) ? true : 'no .picked style');
t('and the promotion is driven by the zone, not by the count', () =>
  /roleRow\(r, true\)/.test(src) && /chosen \? ' picked' : ''/.test(src)
    ? true : 'picked not passed from the zone');

console.log('\nCONTROLS ANSWER THE POINTER');
for (const [what, sel] of [['the filled button', /\.btn:hover:not\(:disabled\)\{[^}]*\}/],
                           ['the outlined button', /\.btn\.sec:hover:not\(:disabled\)\{[^}]*\}/],
                           ['the +/\u2212 stepper', /\.stp button:hover:not\(:disabled\)\{[^}]*\}/]]){
  t(what + ' has a hover state', () => rule(sel) ? true : 'no hover rule');
}
for (const [what, sel] of [['the filled button', /\.btn:active:not\(:disabled\)\{[^}]*\}/],
                           ['the outlined button', /\.btn\.sec:active:not\(:disabled\)\{[^}]*\}/],
                           ['the stepper', /\.stp button:active:not\(:disabled\)\{[^}]*\}/]]){
  t(what + ' has a pressed state', () => rule(sel) ? true : 'no active rule');
}
t('hover never fires on a disabled control', () => {
  const hovers = src.match(/\.(btn|stp button)[^{]*:hover[^{]*\{/g) || [];
  const bad = hovers.filter(s => !/:not\(:disabled\)/.test(s));
  return bad.length === 0 ? true : bad.join(' ');
});
t('both buttons are reachable by keyboard', () =>
  /\.btn:focus-visible\{outline/.test(src) && /\.stp button:focus-visible\{outline/.test(src)
    ? true : 'no focus-visible outline');
t('the changes are eased, not instant', () =>
  /\.btn\{transition:/.test(src) && /\.stp button\{transition:/.test(src)
    ? true : 'no transition');
t('the outlined button does not inherit the fill brightness trick', () =>
  /\.btn\.sec:hover:not\(:disabled\)\{[^}]*filter:none/.test(src)
    ? true : 'brightness on a transparent background does nothing visible');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
