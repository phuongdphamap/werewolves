// Two problems that turned out to be one.
//
// Every label was bilingual — "Xáo bộ mới · Shuffle", "Trong bộ · in your deck · 8 of 9
// cards · thứ tự gọi" — so the interface said everything twice and a moderator only ever
// read one side of the middot. And the switch that chose between them was G.rules, which
// also chooses the night call order: picking the Miller's Hollow RULES silently renamed
// every card in the app, because one flag was answering two unrelated questions.
//
// Separately: the teaching layer. Genuinely good writing, and far too much of it in a
// running game, with nothing keeping track of whether the moderator still needed it.
const fs = require('fs');
const js   = fs.readFileSync('../js/app.js', 'utf8');
const html = fs.readFileSync('../index.html', 'utf8');
const src  = [html, js].join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

console.log('LANGUAGE IS NOT THE RULESET');
t('there is a language flag of its own', () =>
  /lang: \(\/\^vi\\b\/i\.test\(navigator\.language \|\| ''\) \? 'vi' : 'en'\)/.test(js)
    ? true : 'no G.lang, or it does not default from the browser');
t('it lives in the game state, so a table keeps it across a reload', () => {
  const b = (js.match(/function blank\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /lang:/.test(b) ? true : 'G.lang is not in blank(), so a resume loses it';
});
t('one helper decides every label', () =>
  /const T = \(vi, en\) => vnUI\(\) \? vi : en;/.test(js) ? true : 'no T() helper');
t('and it reads the language, never the ruleset', () => {
  const v = (js.match(/const vnUI = [^;]*;/) || [''])[0];
  return /G\.lang !== 'en'/.test(v) && !/G\.rules/.test(v)
    ? true : 'the interface language is still decided by the rules: ' + v;
});
t('a missing G.lang falls back to Vietnamese, so an old save is not switched', () => {
  const v = (js.match(/const vnUI = [^;]*;/) || [''])[0];
  // !== 'en' rather than === 'vi': a save written before this existed has no lang at all
  return /!== 'en'/.test(v) ? true : 'a pre-existing game would flip to English on resume: ' + v;
});
t('role names go through one accessor', () =>
  /const rName = r => T\(r\.vi, r\.name\);/.test(js) ? true : 'no rName()');
/* Comments quote the old pattern to explain why it went, and a source scan cannot tell
   that from a live call site. Stripped, so the check is about code. */
const code = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
t('no card is named by testing the ruleset any more', () => {
  const bad = [...code.matchAll(/G\.rules ?=== ?'vn' \? [\w.[\]]*\.vi/g)].map(m => m[0]);
  return bad.length === 0
    ? true : bad.length + ' site(s) still rename cards with the ruleset: ' + bad.join(' // ');
});
t('which box a card came from follows the language too', () => {
  const p = (js.match(/const provLabel = [\s\S]*?;\n/) || [''])[0];
  return /vnUI\(\)/.test(p) && !/G\.rules/.test(p) ? true : p;
});
t('the language is choosable, and before the labels it governs', () => {
  const r = (js.match(/function rRoles\(\)\{[\s\S]*?\n\}\n/) || [''])[0];
  const iLang = r.indexOf("G.lang = k"), iRules = r.indexOf("G.rules = k");
  return iLang > -1 && iRules > -1 && iLang < iRules
    ? true : 'no language chooser, or it sits below the ruleset chooser';
});

console.log('\nTHE MIDDOT LABELS ARE GONE');
/* A label of the form 'Vietnamese · English' is the shape being removed. Bullets, name
   joins and counts also use a middot, so this looks only at the paired-label form: a
   string literal with a middot AND letters from both alphabets around it. */
t('no UI string still carries a Vietnamese/English pair', () => {
  const lits = [...code.matchAll(/'([^'\n]*\\u00b7[^'\n]*)'/g)].map(m => m[1]);
  // Vietnamese, either as a literal diacritic or as the \uXXXX escape the file often uses
  const viIn = s => /[À-ỹ]/.test(s) || /\\u(1e[0-9a-f]{2}|01[0-9a-f]{2}|0[03][0-9a-f]{2})/i.test(s);
  const paired = lits.filter(s => {
    const [a, b] = s.split('\\u00b7');
    if (!a || !b) return false;
    // the shape being removed is Vietnamese on one side, English on the OTHER. A middot
    // between two Vietnamese words is one label ("Chưa hỏi · bỏ qua"), not a translation.
    return a.trim().length > 3 && b.trim().length > 3 &&
           viIn(a) && !viIn(b) && /[a-z]{3}/i.test(b);
  });
  return paired.length === 0 ? true : 'still doubled: ' + paired.join(' // ');
});
t('the read-aloud line keeps both — there the second language IS the content', () => {
  const n = (js.match(/function rNight\(\)\{[\s\S]*?\n\}\nfunction applyStep/) || [''])[0];
  return /const second  = \(vn && info\.sayVi\) \? info\.say : info\.sayVi;/.test(n) &&
         /class="alt'/.test(n)
    ? true : 'the one place that should stay bilingual stopped being so';
});
t('...and it is the language, not the ruleset, that decides which leads', () => {
  const n = (js.match(/function rNight\(\)\{[\s\S]*?\n\}\nfunction applyStep/) || [''])[0];
  return /const vn = vnUI\(\);/.test(n)
    ? true : 'a Vietnamese moderator on the Miller’s Hollow rules gets an English line first';
});
t('role names stay bilingual in the deck list, a table argues about both', () => {
  const r = (js.match(/function roleRow\(r, chosen\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /rName\(r\)/.test(r) && /T\(r\.name, r\.vi\)/.test(r)
    ? true : 'the deck list lost one of the two names: ' + r;
});

console.log('\nHEADINGS AND BUTTONS FOLLOW IT TOO');
/* The four setup headings were static markup with no id, so nothing could address them:
   a Vietnamese interface still opened on "Who is at the table?" in 21px serif, which is
   the largest text on the screen. The bar labels were the same. Both are the most visible
   text in the app, so leaving them behind made the language switch look broken. */
for (const [id, what] of [['pTtl','the seats heading'], ['rTtl','the deck heading'],
                          ['dTtl','the deal heading'], ['lTtl','the collect heading'],
                          ['rosTtl','the roster heading']]){
  t(what + ' is addressable and set from T()', () => {
    if (!new RegExp('id="' + id + '"').test(html)) return 'no id in the markup';
    return new RegExp("\\$\\('" + id + "'\\)\\.textContent = T\\(").test(js)
      ? true : 'the element exists but nothing sets its words';
  });
}
t('no heading is left hard-coded in the markup', () => {
  const bad = [...html.matchAll(/<h2(?![^>]*\bid=)[^>]*>([^<]+)<\/h2>/g)].map(m => m[1].trim());
  return bad.length === 0 ? true : 'un-addressable heading(s): ' + bad.join(', ');
});
t('and no .sub is either', () => {
  const bad = [...html.matchAll(/<p class="sub"(?![^>]*\bid=)[^>]*>([^<]+)<\/p>/g)].map(m => m[1].trim());
  return bad.length === 0 ? true : 'un-addressable sub(s): ' + bad.join(' // ');
});
t('every bar button label is a T() pair, not a bare string', () => {
  const bare = [...code.matchAll(/\{ t:'([^']+)'/g)].map(m => m[1]);
  return bare.length === 0
    ? true : bare.length + ' untranslated bar label(s): ' + bare.join(' // ');
});

console.log('\nTHE TEACHING LAYER RETIRES ITSELF');
t('the device counts games it has finished', () =>
  /const GAMES_KEY = 'mh\.games';/.test(js) && /function countGame\(\)\{/.test(js)
    ? true : 'nothing is counting, so the tips stay at full volume forever');
t('it is a separate key, so ending a game does not erase the experience', () => {
  const save = (js.match(/const SAVE_KEY = '[^']*';/) || [''])[0];
  return !/mh\.games/.test(save) && /localStorage\.setItem\(GAMES_KEY/.test(js)
    ? true : 'the counter shares the key the save clears';
});
t('a finished game increments it exactly once', () => {
  const f = (js.match(/function finish\(w\)\{[\s\S]*?\n\}/) || [''])[0];
  const calls = (js.match(/countGame\(\)/g) || []).length;
  return /countGame\(\);/.test(f) && calls === 2
    ? true : 'counted in ' + (calls - 1) + ' place(s) other than the definition';
});
t('storage being unavailable cannot break start-up', () =>
  /try \{ gamesPlayed = parseInt\(localStorage\.getItem\(GAMES_KEY\), 10\) \|\| 0; \} catch \(e\)\{\}/.test(js)
    ? true : 'an embedded viewer that denies storage would throw before the first render');
t('the predicate is three-state, like a house rule', () => {
  const p = (js.match(/const teaching = [^;]*;/) || [''])[0];
  return /G\.tips == null \? gamesPlayed < \d+ : G\.tips/.test(p)
    ? true : 'no override, so the guess about the moderator cannot be corrected: ' + p;
});
t('a collapsible opens itself while the device is still learning', () => {
  const c = (js.match(/function collapsible\(key, title, body\)\{[\s\S]*?\n\}/) || [''])[0];
  return /teaching\(\) && !expShut\.has\(key\)/.test(c)
    ? true : 'the first game no longer shows the guidance in full';
});
t('but an explicit close still wins', () => {
  const c = (js.match(/function collapsible\(key, title, body\)\{[\s\S]*?\n\}/) || [''])[0];
  return /expShut\.add\(key\)/.test(c) && /expShut\.delete\(key\)/.test(c)
    ? true : 'closing one would reopen it on the next render';
});
t('teaching prose is gathered per screen, not per paragraph', () =>
  /const tip = html => \{ tipBuf\.push\(html\); \};/.test(js) && /function flushTips\(target, key\)\{/.test(js)
    ? true : 'no gathering, so each tip is its own 50px row to scroll past');
t('an unflushed tip is dropped rather than shown on the next screen', () => {
  const r = (js.match(/function render\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /tipBuf = \[\];/.test(r)
    ? true : 'a tip pushed before an early return would leak into the following screen';
});
t('every screen that pushes a tip also flushes one', () => {
  // rNight has several early returns; each branch that tips must emit before it leaves
  const pushes = (js.match(/\n\s+tip\(/g) || []).length;
  const flushes = (js.match(/flushTips\(/g) || []).length - 1;   // minus the definition
  return pushes > 0 && flushes >= 3
    ? true : pushes + ' tip site(s) but only ' + flushes + ' flush(es)';
});
t('the moderator can bring it back, or keep it away', () => {
  const u = (js.match(/function tipsUI\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /G\.tips = val/.test(u) && /\[null,/.test(u) && /\[true,/.test(u) && /\[false,/.test(u)
    ? true : 'no three-state control: ' + u;
});
t('and it says how many games it has counted, so the state is explicable', () => {
  const u = (js.match(/function tipsUI\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /gamesPlayed/.test(u) ? true : 'the moderator cannot tell why the tips vanished';
});

console.log('\nTHE STALE TIP IS FIXED');
/* The masking tip told the moderator to turn on night sounds "in the header". The sound
   control was moved into the Roster sheet, and nobody re-reads a tip they have learned to
   scroll past — which is the second cost of a teaching layer this voluminous. */
t('the sound control is in the Roster', () =>
  /<button type="button" class="ico" id="bSound"/.test(html) &&
  /id="mRoster"[\s\S]*id="bSound"/.test(html)
    ? true : 'bSound is not inside the roster modal any more, so check the tip again');
t('and the tip says so', () =>
  /night sounds<\/b> in the Roster/.test(js)
    ? true : 'the tip still points at an affordance that moved');
t('no instruction anywhere still points at the header', () =>
  !/night sounds<\/b> in the header/.test(js) ? true : 'the stale wording is back');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
