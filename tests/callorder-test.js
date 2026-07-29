// Two fixes under test:
//   1. the "in your deck" zone previews the night, so it must follow call order.
//      It was sorted wolves-first, which actively destroyed that order — Ma Sói
//      sits at position 60, not first.
//   2. the colour legend was emitted before the heading it explains, leaving it
//      orphaned against the alert above with ~52px of dead space between.
const fs = require('fs');
const src = fs.readFileSync('../index.html','utf8');

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
globalThis.G = { rules:'vn' };
eval(src.match(/const RULESETS = \{[\s\S]*?const ord = [^;]*;/)[0]
  .replace('const RULESETS','globalThis.RULESETS').replace('const over','globalThis.over')
  .replace('const n1Of','globalThis.n1Of').replace('const everyOf','globalThis.everyOf')
  .replace('const ord','globalThis.ord'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

// mirror of the shipped comparator
const byCall = (a,b) => (n1Of(a) == null ? 9999 : n1Of(a)) - (n1Of(b) == null ? 9999 : n1Of(b));
const zone = counts => ROLES.filter(r => counts[r.id]).sort(byCall);
const DECK = { wolf:3, villager:3, seer:1, witch:1, guard:1, elder:1, fox:1, cupid:1 };

console.log('THE ZONE FOLLOWS THE CALL ORDER');
t('the shipped code sorts by call order, not by team', () =>
  /const inDeck = ROLES\.filter\(r => G\.counts\[r\.id\]\)\.sort\(byCall\)/.test(src)
    ? true : 'still sorting the deck zone by team');
t('rows come out in non-decreasing call position', () => {
  const d = zone(DECK).filter(r => n1Of(r) != null);
  for (let i = 1; i < d.length; i++)
    if (n1Of(d[i]) < n1Of(d[i-1])) return d[i-1].vi + ' before ' + d[i].vi;
  return true;
});
t('it matches the order the night script will actually use', () => {
  const script = ord().filter(r => DECK[r.id] && r.id !== 'villager').map(r => r.id);
  const shown  = zone(DECK).filter(r => r.id !== 'villager').map(r => r.id);
  return JSON.stringify(script) === JSON.stringify(shown)
    ? true : 'script ' + script.join(',') + '  vs  zone ' + shown.join(',');
});
t('cards that are never called sit at the end', () => {
  const d = zone(DECK);
  return d[d.length-1].id === 'villager' ? true : 'ends with ' + d[d.length-1].id;
});
t('several uncalled cards all land at the end, none in the middle', () => {
  const d = zone({ wolf:2, villager:4, seer:1 });
  const firstUncalled = d.findIndex(r => n1Of(r) == null);
  return d.slice(firstUncalled).every(r => n1Of(r) == null)
    ? true : 'an uncalled card is followed by a called one';
});
t('Ma Sói is no longer hoisted to the top', () => {
  const d = zone(DECK);
  return d[0].id !== 'wolf' ? true : 'wolves are still first';
});

console.log('\nIT TRACKS THE CHOSEN RULESET');
t('the Vietnamese order puts the pack before the Seer', () => {
  G.rules = 'vn';
  const ids = zone(DECK).map(r => r.id);
  return ids.indexOf('wolf') < ids.indexOf('seer') ? true : ids.join(',');
});
t('the Millers Hollow order puts the Seer before the pack', () => {
  G.rules = 'mh';
  const ids = zone(DECK).map(r => r.id);
  return ids.indexOf('seer') < ids.indexOf('wolf') ? true : ids.join(',');
});
t('switching ruleset moves the Fox and the Seer, and nothing else', () => {
  G.rules = 'vn'; const a = zone(DECK).map(r => r.id);
  G.rules = 'mh'; const b = zone(DECK).map(r => r.id);
  const strip = x => x.filter(i => i !== 'seer' && i !== 'fox').join(',');
  return (strip(a) === strip(b) && a.join() !== b.join())
    ? true : a.join(',') + '  vs  ' + b.join(',');
});
t('the heading says the rows are in call order', () =>
  /thứ tự gọi/.test(src) ? true : 'the sort is unexplained, so it looks arbitrary');

console.log('\nTHE PICKING LIST KEEPS ITS OWN ORDER');
t('the catalogue still sorts wolves first, for setting counts', () =>
  /spare\.filter\(r => r\.set === setKey\)\.sort\(byTeam\)/.test(src)
    ? true : 'catalogue no longer wolves-first');
t('both comparators exist and are used for different things', () =>
  /const byTeam =/.test(src) && /const byCall =/.test(src) ? true : 'a comparator is missing');

console.log('\nTHE LEGEND SITS UNDER ITS HEADING');
t('the heading is emitted before the legend', () => {
  const hi = src.indexOf("'Trong bộ \\u00b7 in your deck");
  const li = src.indexOf("class=\"legend\"") >= 0 ? src.indexOf("'legend'") : src.indexOf("'legend'");
  return (hi > 0 && li > hi) ? true : 'legend at ' + li + ' still precedes heading at ' + hi;
});
t('there is still exactly one legend', () => {
  const c = (src.match(/'legend'/g) || []).length;
  return c === 1 ? true : c + ' legends';
});
t('the legend no longer carries its own bottom margin', () => {
  const r = (src.match(/\.legend\{[^}]*\}/) || [''])[0];
  return /margin:0\}/.test(r) ? true : r;
});
t('headings inside the gapped list do not double their spacing', () => {
  const r = (src.match(/\.roles > \.grp\{[^}]*\}/) || [''])[0];
  return /margin:var\(--s5\) 0 0\}/.test(r) ? true : r || 'rule missing';
});
t('the first heading is spaced like every other one', () =>
  // it receives no flex gap, so it must carry that 14px in its own margin
  /\.roles > \.grp\{margin:var\(--s5\) 0 0\}/.test(src) &&
  /\.roles > \.grp:first-child\{margin-top:calc\(var\(--s5\) \+ var\(--s3\)\)\}/.test(src)
    ? true : 'the first heading does not compensate for the missing gap');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
