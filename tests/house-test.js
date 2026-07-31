// Two rules the traditions genuinely disagree on were hard-coded per ruleset:
//   · may the Witch spend her cure on herself
//   · does the Hunter still fire when the Witch poisons him
// Tables argue about both, so each is now a setting: follow the ruleset, or overrule
// it deliberately. These tests pin the defaults, the overrides, and the fact that an
// override survives switching ruleset.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
eval(src.match(/const witchMaySaveSelf[\s\S]*?hunterPoison;/)[0]
  .replace('const witchMaySaveSelf','globalThis.witchMaySaveSelf')
  .replace('const hunterFiresPoisoned','globalThis.hunterFiresPoisoned'));
const logs = [];
globalThis.log = t => logs.push(t);
globalThis.buzz = () => {};      // haptics are covered by haptic-test.js
/* eval, deliberately and throughout these suites: the point is to run the SHIPPED
   function, lifted out of ../js/app.js, so a test cannot pass against a copy that has
   drifted. The only input is this repo's own source. */
// The rule reads a cause CODE now, and registerDeaths renders the label from it
eval(src.match(/const CAUSE = \{[\s\S]*?\n\};/)[0].replace('const CAUSE','globalThis.CAUSE'));
eval(src.match(/const causeLabel = [^;]*;/)[0].replace('const causeLabel','globalThis.causeLabel'));
eval(src.match(/function teamOf\(p\)\{[\s\S]*?\n\}/)[0].replace('function teamOf','globalThis.teamOf = function'));
eval(src.match(/const powerGone = [^;]*;/)[0].replace('const powerGone','globalThis.powerGone'));
eval(src.match(/function hunterWouldFire\(p, cause\)\{[\s\S]*?\n\}/)[0]
  .replace('function hunterWouldFire','globalThis.hunterWouldFire = function'));
eval(src.match(/function registerDeaths\(chain\)\{[\s\S]*?\n\}/)[0]
  .replace('function registerDeaths','globalThis.registerDeaths = function'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

function shoots(rules, override, cause){
  globalThis.G = { rules, hunterPoison:override, selfHeal:null, pending:{} };
  logs.length = 0;
  registerDeaths([{ p:{ id:'h', name:'Thợ', role:'hunter', sheriff:false }, cause }]);
  return { fired: !!G.pending.hunterId, note: logs.find(l => l.includes('no shot')) };
}
const POISON = 'poison';   // a code now, not the sentence

console.log('THE DEFAULTS STILL FOLLOW EACH TRADITION');
t('Miller’s Hollow: he fires even when poisoned', () =>
  shoots('mh', null, POISON).fired ? true : 'suppressed under the French rules');
t('Ma Sói Việt Nam: poison denies him the shot', () =>
  !shoots('vn', null, POISON).fired ? true : 'fired under the Vietnamese rules');
t('and the log explains why, pointing at the setting', () => {
  const n = shoots('vn', null, POISON).note;
  return (n && /House rules/.test(n)) ? true : n || 'no explanation logged';
});
t('the Witch default mirrors it', () => {
  globalThis.G = { rules:'mh', selfHeal:null }; const a = witchMaySaveSelf();
  globalThis.G = { rules:'vn', selfHeal:null }; const b = witchMaySaveSelf();
  return (a === true && b === false) ? true : 'mh=' + a + ' vn=' + b;
});

console.log('\nA HOUSE RULING OVERRIDES EITHER TRADITION');
t('Vietnamese + "yes": he fires despite the poison', () =>
  shoots('vn', true, POISON).fired ? true : 'override ignored');
t('Miller’s Hollow + "no": he does not', () =>
  !shoots('mh', false, POISON).fired ? true : 'override ignored');
t('the override survives switching ruleset', () => {
  globalThis.G = { rules:'vn', hunterPoison:true, selfHeal:null };
  const a = hunterFiresPoisoned();
  G.rules = 'mh';
  const b = hunterFiresPoisoned();
  return (a && b) ? true : 'the ruling was lost on switching';
});
t('null means follow the ruleset, and is distinct from false', () => {
  globalThis.G = { rules:'mh', hunterPoison:null, selfHeal:null };
  const follow = hunterFiresPoisoned();
  G.hunterPoison = false;
  const forced = hunterFiresPoisoned();
  return (follow === true && forced === false) ? true : 'null and false behave alike';
});

console.log('\nONLY POISON IS AFFECTED');
for (const cause of ['wolves','vote','tie','grief','white','rust','shot']){
  t('"' + cause + '" always lets him fire, under both rulesets', () =>
    (shoots('vn', null, cause).fired && shoots('mh', null, cause).fired)
      ? true : 'suppressed by a non-poison cause');
}
t('a poison override does not disturb the other causes', () =>
  shoots('vn', false, 'wolves').fired ? true : 'forcing no broke a normal death');

console.log('\nEVERY DISPUTED RULE IS OFFERED');
t('the panel offers all four disputed rules', () => {
  const keys = [...src.matchAll(/\{ key:'(\w+)'/g)].map(m => m[1]);
  const want = ['selfHeal','hunterPoison','hunterElder','showCards'];
  const missing = want.filter(k => !keys.includes(k));
  return missing.length === 0 ? true : 'not offered: ' + missing.join(', ');
});

/* Asked at a table: "when the Hunter is bitten by werewolves or voted, when will he open
   the card or not?" The app said nothing about the cards at any death — while shipping a
   Devoted Servant whose own text defined her window as "before an eliminated player's card
   is revealed", presupposing a step that never existed. */
console.log('\nTHE CARD ON A DEATH');
eval(src.match(/const cardsShownOnDeath = [^;]*;/)[0].replace('const cardsShownOnDeath','globalThis.cardsShownOnDeath'));
eval(src.match(/function revealNote\(dead\)\{[\s\S]*?\n\}/)[0].replace('function revealNote','globalThis.revealNote = function'));
const reveals = (rules, override) => {
  globalThis.G = { rules, showCards:override, selfHeal:null, hunterPoison:null };
  return cardsShownOnDeath();
};
t('Miller’s Hollow turns every card face up', () =>
  reveals('mh', null) ? true : 'the published rule reveals every elimination, night or day');
t('Ma Sói Việt Nam does not', () =>
  !reveals('vn', null) ? true : 'không lật bài is the common Vietnamese practice');
t('a table can overrule either way', () =>
  (reveals('vn', true) && !reveals('mh', false)) ? true : 'the override is ignored');
t('and the ruling survives switching ruleset', () => {
  globalThis.G = { rules:'vn', showCards:true, selfHeal:null, hunterPoison:null };
  const a = cardsShownOnDeath(); G.rules = 'mh';
  return (a && cardsShownOnDeath()) ? true : 'the ruling was lost on switching';
});
t('the instruction says which way, in plain words', () => {
  reveals('mh', null);
  const up = revealNote([{ name:'An', role:'seer' }]);
  reveals('vn', null);
  const down = revealNote([{ name:'An', role:'seer' }]);
  return (/face up/.test(up) && /face down/.test(down))
    ? true : 'up=' + up + ' down=' + down;
});
t('the Village Idiot is shown even at a table that hides every other card', () => {
  reveals('vn', null);
  const note = revealNote([{ name:'Bình', role:'idiot', revealed:true }]);
  return (/Bình/.test(note) && /must be shown/.test(note))
    ? true : 'the village would have no reason to spare him: ' + note;
});
t('but an unrevealed Idiot is not called out', () => {
  reveals('vn', null);
  const note = revealNote([{ name:'Bình', role:'idiot', revealed:false }]);
  return !/must be shown/.test(note) ? true : 'named him before his power triggered';
});
t('it is said at the dawn announcement', () => {
  // the guard, not just the call: a disabled call still contains the word revealNote
  const fn = (src.match(/function rDawn\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /if \(on\.length\) B\.appendChild\(el\('p','note', revealNote\(/.test(fn)
    ? true : 'night deaths become public with nothing said, or the call is unreachable';
});
t('and at the vote, before the button that commits it', () => {
  const day = (src.match(/function rDay\(\)\{[\s\S]*?\n  \}\n\}/) || [''])[0];
  const iNote = day.indexOf('revealNote('), iHang = day.indexOf("'Hang '");
  return (iNote > -1 && iHang > -1 && iNote < iHang)
    ? true : 'said after the tap, by which time the screen has moved on';
});
t('and on the Hunter screen, which is where it was asked about', () => {
  const fn = (src.match(/function renderHunter\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /if \(hp\) B\.appendChild\(el\('div','tell', priv/.test(fn) && /revealNote\(\[hp\]\)/.test(fn)
    ? true : 'the death that most needs it says nothing, or the call is unreachable';
});
t('no branch in the app is switched off with a literal', () => {
  // a general catch: this is exactly how the two tests above used to pass while disabled
  const dead = [...src.matchAll(/if \((?:false|true)\)/g)].map(m => m[0]);
  return dead.length === 0 ? true : 'dead or forced branch: ' + dead.join(', ');
});
t('the Servant no longer presupposes a reveal that may not happen', () => {
  const d = (src.match(/id:'servant'[\s\S]*?d:'([^']*)'/) || [,''])[1];
  return /if your table turns them/.test(d)
    ? true : 'her window is still defined by a step this app may not perform: ' + d;
});
t('every rule in the panel has a live accessor', () => {
  const keys = [...src.matchAll(/\{ key:'(\w+)'/g)].map(m => m[1]);
  const dead = keys.filter(k => !new RegExp('G\\.' + k + '\\s*== null').test(src));
  return dead.length === 0 ? true : 'a chip writes a flag nothing reads: ' + dead.join(', ');
});
/* An accessor with no control is a rule the table cannot actually set. It used to be
   enough to look inside houseRulesUI, but G.tips has the same three-state shape and lives
   in the Roster instead, so the invariant is "some chip writes it", not "it appears in
   that one panel". */
t('and every accessor is settable from some panel', () => {
  const accessors = [...src.matchAll(/G\.(\w+)\s*== null \?/g)].map(m => m[1]);
  const hidden = accessors.filter(a =>
    !new RegExp('G\\.' + a + ' = val').test(src) &&
    !new RegExp("\\{ key:'" + a + "'").test(src));
  return hidden.length === 0 ? true : 'settable in code but not in the UI: ' + hidden.join(', ');
});
t('and the follow-the-default shape is shared, not reinvented per panel', () => {
  const panels = (src.match(/const opts = \[\[null, T\(/g) || []).length;
  return panels >= 2 ? true : 'only ' + panels + ' panel(s) offer a follow-the-default option';
});
t('each row labels its own default, rather than sharing one', () =>
  /byRule:byTradition/.test(src) && /byRule:false/.test(src) && /r\.byRule \? /.test(src)
    ? true : 'one shared default would mislabel any rule that is not a tradition split');

console.log('\nTHE SETTINGS ARE REACHABLE AND EXPLAINED');
// the panel title is a T() pair now, and the source spells the Vietnamese as a \uXXXX
// escape, so the pattern matches a literal backslash rather than the character it denotes
t('a House rules panel exists on the deck screen', () =>
  /collapsible\('house', T\('Lu\\u1eadt nh/.test(src) ? true : 'no panel');
t('it offers three states per rule, not a bare on/off', () =>
  /\[null, T\('Theo lu[\s\S]*?\[true, T\('C[\s\S]*?\[false, T\('Kh/.test(src)
    ? true : 'no follow-the-ruleset option');
t('it names both traditions so the choice is informed', () =>
  /狼人杀/.test(src) && /chết vì bất cứ lý do gì/.test(src)
    ? true : 'the reasoning is not shown');
t('it reports which setting is currently in force', () =>
  /T\('[^']*','Now: '\)/.test(src) && /r\.now \? T\(/.test(src)
    ? true : 'no effective-value readout');
/* The reasoning is the whole point of the panel: a table settles an argument by reading
   it. An English-only interface showing Vietnamese-only reasoning is a panel that cannot
   do its job, so every row carries both. */
t('and every rule explains itself in both languages', () => {
  const notes  = (src.match(/^      note:/gm) || []).length;
  const notesE = (src.match(/^      noteEn:/gm) || []).length;
  return notes > 0 && notes === notesE
    ? true : notes + ' note(s) but ' + notesE + ' translated';
});
t('the panel is built as a node and collapsible accepts one', () => {
  const c = src.match(/function collapsible\(key, title, body\)\{[\s\S]*?\n\}/);
  return (c && /typeof body === 'string'/.test(c[0]) && /b\.appendChild\(body\)/.test(c[0]))
    ? true : 'a node body would stringify to [object HTMLDivElement]';
});
t('no hard-coded ruleset test survives in the two rules', () =>
  !/G\.rules === 'vn' && !G\.selfHeal/.test(src) &&
  !/G\.rules === 'vn' && \/poison\//.test(src)
    ? true : 'a rule still tests the ruleset directly');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
