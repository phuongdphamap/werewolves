// Two changes under test:
//   1. the vote count can be typed, not only stepped. With 17 players, eleven taps
//      on + is not a counting method.
//   2. the first heading in the role list was flush against the alert above it,
//      because I had zeroed its top margin with a :first-child exception.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const rule = re => { const m = src.match(re); return m ? m[0].replace(/\s+/g,' ') : ''; };

console.log('THE FIRST HEADING BREATHES LIKE THE REST');
t('every heading in the list gets the same top margin', () =>
  /\.roles > \.grp\{margin:var\(--s5\) 0 0\}/.test(src) ? true : rule(/\.roles > \.grp\{[^}]*\}/));
t('the first heading is neither zeroed nor left short', () =>
  !/\.roles > \.grp:first-child\{margin-top:0\}/.test(src) &&
  /\.roles > \.grp:first-child\{margin-top:calc\(var\(--s5\) \+ var\(--s3\)\)\}/.test(src)
    ? true : 'it must carry the flex gap it does not receive');
t('the heading still adds no bottom margin, so the flex gap is the only spacing', () => {
  const r = rule(/\.roles > \.grp\{[^}]*\}/);
  return /margin:var\(--s5\) 0 0\}/.test(r) ? true : r;
});

console.log('\nTHE COUNT CAN BE TYPED');
t('each vote row carries a text input', () =>
  /box\.type = 'text'; box\.inputMode = 'numeric'/.test(src) ? true : 'no input in the row');
t('it asks for a numeric keypad on a phone', () =>
  /inputMode = 'numeric'/.test(src) ? true : 'would open a full keyboard');
t('it is labelled for screen readers', () =>
  /setAttribute\('aria-label', 'votes for ' \+ p\.name\)/.test(src) ? true : 'unlabelled input');
t('focusing selects the value so it can be overwritten', () =>
  /box\.onfocus = \(\) => box\.select\(\)/.test(src) ? true : 'no select on focus');
t('Enter commits rather than submitting anything', () =>
  /if \(e\.key === 'Enter'\)\{ e\.preventDefault\(\); box\.blur\(\); \}/.test(src)
    ? true : 'Enter is not handled');
t('the steppers still work alongside it', () =>
  /minus\.onclick = \(\) => \{ holdOrder\(\); setVote\(p, tallyOf\(p\) - 1\); \}/.test(src) &&
  /plus\.onclick = \(\) => \{ holdOrder\(\); setVote\(p, tallyOf\(p\) \+ 1\); \}/.test(src)
    ? true : 'a stepper lost its handler');
/* Promotion used to be held back only while a text box had focus — but the steppers are
   what people actually use to count a vote, and tapping + focuses nothing. So the moment
   a trailing candidate took the lead their row jumped to the top and the + under the
   moderator's thumb became somebody else's +, mid-count, out loud. */
console.log('\nROWS DO NOT MOVE UNDER THE THUMB');
// just the vote list: the deck screen has steppers too, and they reorder nothing
const VOTEROWS = src.slice(src.indexOf("list.id = 'dyVotes'"), src.indexOf("const verdict = el"));
t('every control that touches the list freezes the order first', () => {
  const handlers = [...VOTEROWS.matchAll(/(?:minus|plus|bg)\.onclick = [^;]*;/g)].map(m => m[0]);
  if (handlers.length < 3) return 'only found ' + handlers.length + ' list controls';
  const bare = handlers.filter(h => !/holdOrder\(\)/.test(h));
  return bare.length === 0 ? true : 'reorders under the finger: ' + bare.join(' // ');
});
t('a focused text box still freezes it too', () =>
  /document\.activeElement === c\.box/.test(src) ? true : 'typing would lose the caret again');
t('the freeze is a run of taps, not a single one', () =>
  /clearTimeout\(settle\)/.test(src) && /settle = setTimeout\(/.test(src)
    ? true : 'a second tap would not extend the hold, so a fast count still jumps');
t('and the rows settle on their own once the tapping stops', () => {
  const m = src.match(/settle = setTimeout\(\(\) => \{([\s\S]*?)\}, (\d+)\)/);
  if (!m) return 'no settle timer, so the order would never update again';
  return /refresh\(\)/.test(m[1]) && +m[2] >= 600 && +m[2] <= 2500
    ? true : 'settle=' + m[2] + 'ms body=' + m[1];
});
t('a settled timer cannot repaint a screen that has moved on', () =>
  // it calls bar(), so firing after the phase changed would paint the wrong bar
  /if \(list\.isConnected\) refresh\(\)/.test(src)
    ? true : 'the timer would rewrite the action bar of whatever screen is showing');
t('only the row positions wait — the bar and the verdict do not', () => {
  const body = (src.match(/for \(const c of cells\)\{[\s\S]*?\n    \}/) || [''])[0];
  const held = body.split('\n').filter(l => /if \(!frozen\)/.test(l));
  if (held.length !== 1) return held.length + ' statements are held back, expected 1';
  // the one thing the freeze may hold back is where a row sits
  const assigns = [...held[0].matchAll(/c\.(\w+)(?:\.style)?\.(\w+) =/g)].map(m => m[1] + '.' + m[2]);
  return (assigns.length === 1 && assigns[0] === 'row.order')
    ? true : 'the freeze also holds back: ' + assigns.join(', ');
});
t('the input is styled, not left as a stretched field', () => {
  const r = rule(/\.stp input\[type=text\]\{[^}]*\}/);
  return (/flex:0 0 auto/.test(r) && /width:50px/.test(r) && /text-align:center/.test(r))
    ? true : r || 'rule missing';
});

/* Normalising the bars to the whole voting weight rather than to the leader was right:
   they are comparable to each other and to half. But half was only stated in words, and
   left to be imagined at the midpoint of a bar with no midpoint marked — the one
   measurement this whole screen exists to make. */
console.log('\nHALF IS DRAWN, NOT JUST STATED');
const HALF = rule(/\.p\.vote::after\{[^}]*\}/);
t('there is a marker on every vote row', () => HALF ? true : 'no rule for the threshold line');
t('it sits at exactly half', () =>
  /left:50%/.test(HALF) ? true : HALF);
t('it is a hairline, not a band', () =>
  /width:1px/.test(HALF) ? true : HALF);
t('it introduces no new colour', () =>
  /rgba\(237,233,224,/.test(HALF)
    ? true : 'the marker invented a hue; --wolf and --vil already mean something here');
t('it cannot be tapped through', () =>
  /pointer-events:none/.test(HALF) ? true : 'it would swallow taps meant for the row');
t('the fill still measures against the whole electorate, not the leader', () =>
  /\(pw \/ TP\) \* 100/.test(src)
    ? true : 'normalising to the leader would make the 50% mark meaningless');
t('and the threshold is still pinned in words as well', () =>
  /more than[\s\S]{0,40}fmtN\(thr\)/.test(src) ? true : 'the exact number is gone from the bar note');

console.log('\nBAD INPUT CANNOT GET IN');
/* The whole clamp, lifted out of rDay instead of restated. A local mirror is what let the
   day-vote rule stay wrong for so long: the copy agreed with the mistake. */
const CLAMP = (function(){
  const m = src.match(/const digits = box\.value[^\n]*\n\s*const v = ([^;]+);/);
  if (!m) throw new Error('the typed clamp moved; this suite must follow it');
  return m[1];
})();
const clampTyped = (raw, room) => {
  const digits = String(raw).replace(/[^0-9]/g, '').slice(0, 3);
  const roomFor = () => room, p = { id:'x' };   // the clamp reads roomFor(p)
  return eval(CLAMP);
};
t('letters are ignored', () => clampTyped('a5b', 17) === 5 ? true : clampTyped('a5b', 17));
t('an empty box means zero', () => clampTyped('', 17) === 0 ? true : clampTyped('', 17));
t('a minus sign cannot make it negative', () => clampTyped('-3', 17) === 3 ? true : clampTyped('-3', 17));
t('more votes than there is room for is refused', () => clampTyped('99', 17) === 17 ? true : clampTyped('99', 17));
t('a long paste is truncated, not parsed as millions', () =>
  clampTyped('123456', 17) === 17 ? true : clampTyped('123456', 17));
t('a decimal point is dropped rather than rounding oddly', () =>
  clampTyped('2.9', 17) === 17 ? true : clampTyped('2.9', 17));   // "29" -> clamped to 17

/* Reported from a game: nine players, five votes on one name and nine on another. Each box
   was clamped to voters.length ON ITS OWN, so nothing bounded the total — fourteen hands
   from nine people, and a leader the table never produced. The budget is what is LEFT. */
console.log('\nAND THE TALLIES CANNOT SUM PAST THE ELECTORATE');
eval(src.match(/  function handsElsewhere\(id\)\{[^}]*\}/)[0]
  .replace('function handsElsewhere','globalThis.handsElsewhere = function'));
eval(src.match(/  function roomFor\(p\)\{[^}]*\}/)[0]
  .replace('function roomFor','globalThis.roomFor = function'));
// the shipped budget, run against a board this suite controls
function board(nVoters, tally){
  globalThis.A = Object.keys(tally).map(id => ({ id }));
  globalThis.voters = { length: nVoters };
  globalThis.tallyOf = q => tally[q.id] || 0;
  return tally;
}
t('with nine voters and five already on one name, the next is capped at four', () => {
  board(9, { a:5, b:0 });
  const r = roomFor({ id:'b' });
  return r === 4 ? true : 'room for b was ' + r + ', so 9 could still be entered';
});
t('the reported case cannot be reached at all', () => {
  board(9, { a:5, b:0 });
  const b = Math.min(roomFor({ id:'b' }), 9);
  return (5 + b) <= 9 ? true : 'still records ' + (5 + b) + ' hands from 9 people';
});
t('one name may still take every vote', () => {
  board(9, { a:0, b:0 });
  return roomFor({ id:'a' }) === 9 ? true : 'a unanimous vote became unrecordable';
});
t('a full tally leaves no room anywhere else', () => {
  board(9, { a:4, b:3, c:2 });
  return roomFor({ id:'d' }) === 0 ? true : 'room left after every hand is spent';
});
t('a name can always be raised to what is left, and no further', () => {
  board(9, { a:4, b:3, c:0 });
  return roomFor({ id:'c' }) === 2 ? true : 'room for c was ' + roomFor({ id:'c' });
});
t('editing a name counts its own votes as available again', () => {
  // otherwise lowering 5 to 4 would be blocked by the 5 it already holds
  board(9, { a:5, b:4 });
  return roomFor({ id:'a' }) === 5 ? true : 'a recorded name could not be corrected';
});
/* The case above cannot tell a correct budget from one that counts the edited name twice,
   because the tally is full and Math.max floors both at the name's own total. This one
   has room left, so the two answers differ: 3 if the name's own votes are freed, 2 if
   they are charged to it a second time. */
t('...and is not charged for them twice when there is room to grow', () => {
  board(9, { a:4, b:2, c:1 });
  const r = roomFor({ id:'c' });
  return r === 3 ? true : 'room for c was ' + r + ', so its own 1 was counted against it';
});
/* An electorate can shrink after the count begins — the Scapegoat's decree, a resumed
   save — and the budget must not then lock every box to zero. */
t('an over-count can still be corrected downwards', () => {
  board(4, { a:5, b:3 });
  const r = roomFor({ id:'a' });
  return r === 5 ? true : 'room was ' + r + ', so the stale 5 could not be edited at all';
});
t('but it cannot be made worse', () => {
  board(4, { a:5, b:3 });
  return roomFor({ id:'b' }) === 3 ? true : 'b could still be increased past a spent electorate';
});
t('the budget counts hands, not the badge', () => {
  // extraOf() applies the badge separately; it is weight on a hand, not a second hand
  const fn = (src.match(/function handsElsewhere\(id\)\{[^}]*\}/) || [''])[0];
  return /tallyOf\(q\)/.test(fn) && !/extraOf|votePower|wt/.test(fn)
    ? true : 'the badge leaked into the hand budget: ' + fn;
});
t('every entry point uses the budget, not the raw electorate', () => {
  const bad = [...src.matchAll(/Math\.min\(voters\.length,/g)].length;
  return bad === 0 ? true : bad + ' clamp(s) still bound a single box to the whole electorate';
});
t('and so does the + button', () =>
  /c\.plus\.disabled = tallyOf\(c\.p\) >= roomFor\(c\.p\);/.test(src)
    ? true : '+ would step past the remaining hands');

console.log('\nTYPING DOES NOT DESTROY THE BOX');
t('rows are built once and only the numbers refresh', () => {
  // Pins the split, not the exact field list — refresh() may need more handles on a
  // row over time, and a keystroke rebuilding the row is the thing to catch.
  const push = (src.match(/cells\.push\(\{[^}]*\}\)/) || [''])[0];
  if (!/function refresh\(\)\{/.test(src)) return 'no refresh(), so a keystroke rebuilds the row';
  const need = ['p','power','minus','plus','box'].filter(k => !new RegExp('\\b' + k + '\\b').test(push));
  return need.length === 0 ? true : 'refresh has no handle on: ' + need.join(', ');
});
t('the box being edited is left alone by refresh', () =>
  /if \(document\.activeElement !== c\.box\) c\.box\.value/.test(src)
    ? true : 'refresh would overwrite the caret position');
t('typing never triggers a full re-render', () => {
  const m = src.match(/box\.oninput = \(\) => \{[\s\S]*?\};/);
  return (m && !/\brender\(\)/.test(m[0])) ? true : 'oninput calls render(), which rebuilds the input';
});
t('the sheriff badge also refreshes rather than re-rendering', () => {
  const m = src.match(/bg\.onclick = \(\) => \{[^}]*\};/);
  return (m && /refresh\(\)/.test(m[0]) && !/\brender\(\)/.test(m[0]))
    ? true : (m ? m[0] : 'badge handler missing');
});
t('the double-vote warning hides instead of being appended twice', () =>
  /twice\.style\.display = cast > TP \? '' : 'none'/.test(src)
    ? true : 'warning is re-appended on every refresh');

console.log('\nTHE VERDICT STILL DRIVES THE BUTTONS');
t('the bar is rebuilt by refresh, so it follows the tally', () => {
  const m = src.match(/function refresh\(\)\{[\s\S]*?\n  \}/);
  return (m && /bar\(opts\)/.test(m[0])) ? true : 'bar is outside refresh and would go stale';
});
// the label is a T() pair now; what is being pinned is the gate, not the wording
// the label no longer carries the name; the gate is what is being pinned
t('Hang only appears when a single name leads', () =>
  /if \(passing\) opts\.push\(\{ t: T\('[^']*','Hang \\u2192'\)/.test(src)
    ? true : 'Hang is not gated on passing');
t('clearing the tally does not end the day by accident', () => {
  const m = src.match(/opts\.push\(\{ t: best > 0 \? T\('[^']*','Clear the tally'\)[\s\S]*?\} \}\);/);
  return (m && /if \(best > 0\)\{ G\.votes = \{\}; G\.sheriffVote = null; refresh\(\); return; \}/.test(m[0]))
    ? true : 'clearing might fall through to proceed()';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
