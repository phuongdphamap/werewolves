// The Bodyguard is standard in Vietnamese play but is not in the original
// Millers Hollow box. It was marked set:'Base' so the Classic scope kept it,
// which meant both the suggested deck and the shuffle dealt it under the French
// ruleset. Cards now declare which ruleset owns them, and the generators obey.
const fs = require('fs');
const src = fs.readFileSync('../index.html','utf8');

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
globalThis.G = { rules:'vn', counts:{} };
eval(src.match(/const RULESETS = \{[\s\S]*?\};/)[0].replace('const RULESETS','globalThis.RULESETS'));
eval(src.match(/const REC_BASE = \[[^\]]*\];/)[0].replace('const REC_BASE','globalThis.REC_BASE'));
eval(src.match(/const REC_CHAR = \[[\s\S]*?\];/)[0].replace('const REC_CHAR','globalThis.REC_CHAR'));
eval(src.match(/function recWolves\(n\)\{[^}]*\}/)[0].replace('function recWolves','globalThis.recWolves = function'));
eval(src.match(/const SHUF = \{[\s\S]*?\n\}\n/)[0].replace('const SHUF','globalThis.SHUF'));
eval(src.match(/const EXCL = .*/)[0].replace('const EXCL','globalThis.EXCL'));
eval(src.match(/function shuffleDeck\(n, chars\)\{[\s\S]*?\n\}/)[0].replace('function shuffleDeck','globalThis.shuffleDeck = function'));
eval(src.match(/function recommend\(n, chars\)\{[\s\S]*?\n\}/)[0].replace('function recommend','globalThis.recommend = function'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

const owned = ROLES.filter(r => r.only);

console.log('CARDS DECLARE WHICH RULESET OWNS THEM');
t('at least one card is ruleset-specific', () =>
  owned.length > 0 ? true : 'no card carries `only`');
t('the Bodyguard is marked Vietnamese-only', () =>
  R.guard.only === 'vn' ? true : 'guard.only = ' + R.guard.only);
t('every `only` value names a real ruleset', () => {
  const bad = owned.filter(r => !RULESETS[r.only]);
  return bad.length === 0 ? true : bad.map(r => r.id + ':' + r.only).join(', ');
});
t('its description already warned the reader', () =>
  /not in the original Millers Hollow box/.test(R.guard.d) ? true : 'no warning in the text');

console.log('\nTHE SUGGESTED DECK OBEYS THE RULESET');
for (const chars of [false, true]){
  const scope = chars ? 'Characters' : 'Classic';
  t('Millers Hollow + ' + scope + ' never suggests a Vietnamese-only card', () => {
    G.rules = 'mh';
    for (let n = 6; n <= 24; n++){
      const c = recommend(n, chars);
      const leak = Object.keys(c).filter(k => R[k].only && R[k].only !== 'mh');
      if (leak.length) return n + 'p leaked ' + leak.join(', ');
    }
    return true;
  });
}
t('Vietnamese play still gets its Bodyguard', () => {
  G.rules = 'vn';
  for (let n = 8; n <= 20; n++) if (!recommend(n, false).guard) return n + 'p lost the Bodyguard';
  return true;
});

console.log('\nTHE SHUFFLE OBEYS THE RULESET');
t('Millers Hollow never shuffles in a Vietnamese-only card', () => {
  G.rules = 'mh';
  for (let n = 6; n <= 24; n++)
    for (const chars of [false, true])
      for (let i = 0; i < 300; i++){
        const c = shuffleDeck(n, chars);
        const leak = Object.keys(c).filter(k => R[k].only && R[k].only !== 'mh');
        if (leak.length) return n + 'p ' + (chars ? 'Characters' : 'Classic') + ' leaked ' + leak.join(', ');
      }
  return true;
});
t('and its decks still fill the table exactly', () => {
  G.rules = 'mh';
  for (let n = 6; n <= 24; n++)
    for (const chars of [false, true])
      for (let i = 0; i < 200; i++){
        const c = shuffleDeck(n, chars);
        const tot = Object.values(c).reduce((a,b) => a+b, 0);
        if (tot !== n) return n + 'p produced ' + tot + ' cards';
      }
  return true;
});
t('the Vietnamese shuffle still seeds the Bodyguard from 8 players', () => {
  G.rules = 'vn';
  for (let n = 8; n <= 20; n++)
    for (let i = 0; i < 200; i++) if (!shuffleDeck(n, true).guard) return n + 'p missed it';
  return true;
});
t('wolf counts stay correct under the French ruleset', () => {
  G.rules = 'mh';
  for (let n = 6; n <= 24; n++)
    for (let i = 0; i < 200; i++){
      const c = shuffleDeck(n, true);
      const w = Object.keys(c).filter(k => R[k].team === 'wolf').reduce((a,k) => a+c[k], 0);
      if (w !== recWolves(n)) return n + 'p had ' + w + ' wolves, wanted ' + recWolves(n);
    }
  return true;
});

console.log('\nA MANUAL CHOICE IS ALLOWED BUT FLAGGED');
t('the deck check warns rather than silently forbidding', () =>
  /is not in the ' \+ RULESETS\[G\.rules\]\.label \+/.test(src)
    ? true : 'no warning in checks()');
t('the role list dims a card the ruleset does not own', () =>
  /\.r\.off\{opacity/.test(src) && /off \? ' off' : ''/.test(src)
    ? true : 'no visual marker');
t('and labels it in place', () =>
  /not in this box/.test(src) ? true : 'no label');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
