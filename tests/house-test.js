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
/* eval, deliberately and throughout these suites: the point is to run the SHIPPED
   function, lifted out of ../js/app.js, so a test cannot pass against a copy that has
   drifted. The only input is this repo's own source. */
// The rule reads a cause CODE now, and registerDeaths renders the label from it
eval(src.match(/const CAUSE = \{[\s\S]*?\n\};/)[0].replace('const CAUSE','globalThis.CAUSE'));
eval(src.match(/const causeLabel = [^;]*;/)[0].replace('const causeLabel','globalThis.causeLabel'));
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

console.log('\nTHE SETTINGS ARE REACHABLE AND EXPLAINED');
t('a House rules panel exists on the deck screen', () =>
  /collapsible\('house', 'Luật nhà/.test(src) ? true : 'no panel');
t('it offers three states per rule, not a bare on/off', () =>
  /\[null, 'Theo luật[\s\S]*?\[true, 'Có[\s\S]*?\[false, 'Không/.test(src)
    ? true : 'no follow-the-ruleset option');
t('it names both traditions so the choice is informed', () =>
  /狼人杀/.test(src) && /chết vì bất cứ lý do gì/.test(src)
    ? true : 'the reasoning is not shown');
t('it reports which setting is currently in force', () =>
  /Đang dùng: /.test(src) ? true : 'no effective-value readout');
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
