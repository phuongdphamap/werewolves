// I got this wrong twice, so it is now checked by arithmetic rather than by eye.
//
// A heading's separation from whatever precedes it is its own margin-top PLUS the
// list's flex gap — except the first child, which has no preceding item and so
// receives no gap. My first attempt zeroed the first heading (28px worse), my
// second removed the zeroing (still 14px short). It must carry the gap itself.
//
// These tests read the real token values out of the stylesheet and compare the
// computed separations, so any future change to --s3 or --s5 is caught.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

// resolve the spacing scale straight from :root
const TOK = {};
for (const m of src.matchAll(/--s(\d):(\d+)px/g)) TOK['s' + m[1]] = +m[2];

const varPx = name => TOK[name.replace('--','')];
function tokenOf(re, group){
  const m = src.match(re);
  return m ? varPx('s' + m[group]) : null;
}
const GAP        = tokenOf(/\.roles\{[^}]*gap:var\(--s(\d)\)/, 1);
const HEAD_TOP   = tokenOf(/\.roles > \.grp\{margin:var\(--s(\d)\) 0 0\}/, 1);
const firstMatch = src.match(/\.roles > \.grp:first-child\{margin-top:calc\(var\(--s(\d)\) \+ var\(--s(\d)\)\)\}/);
const FIRST_TOP  = firstMatch ? varPx('s' + firstMatch[1]) + varPx('s' + firstMatch[2]) : null;

console.log('THE SPACING SCALE RESOLVES');
t('the token scale was found', () =>
  Object.keys(TOK).length >= 6 ? true : 'only ' + Object.keys(TOK).join(','));
t('the list declares a flex gap', () => GAP != null ? true : 'no gap on .roles');
t('headings declare a top margin', () => HEAD_TOP != null ? true : 'no margin on .roles > .grp');
t('the first heading declares a compensating margin', () =>
  FIRST_TOP != null ? true : 'no first-child rule, so it will be short by the gap');

console.log('\nEVERY HEADING SITS THE SAME DISTANCE FROM WHAT PRECEDES IT');
const later = GAP + HEAD_TOP;
t('a later heading is separated by gap + margin (' + GAP + ' + ' + HEAD_TOP + ' = ' + later + 'px)', () =>
  later === 42 ? true : later + 'px');
t('the first heading matches it exactly (' + FIRST_TOP + 'px)', () =>
  FIRST_TOP === later ? true : FIRST_TOP + 'px vs ' + later + 'px');
t('the compensation equals the gap, not an arbitrary number', () =>
  FIRST_TOP - HEAD_TOP === GAP ? true
    : 'compensating by ' + (FIRST_TOP - HEAD_TOP) + 'px for a ' + GAP + 'px gap');

console.log('\nNEITHER OF MY EARLIER MISTAKES CAN COME BACK');
t('the first heading is not zeroed', () =>
  !/\.roles > \.grp:first-child\{margin-top:0\}/.test(src)
    ? true : 'zeroed again \u2014 it would sit flush against the alert');
t('and it is not simply left to inherit', () =>
  /\.roles > \.grp:first-child\{/.test(src)
    ? true : 'no first-child rule, so it is short by the flex gap');
t('the heading adds no bottom margin, so the gap is the only spacing below it', () => {
  const r = (src.match(/\.roles > \.grp\{[^}]*\}/) || [''])[0];
  return /margin:var\(--s\d\) 0 0\}/.test(r) ? true : r;
});
t('nothing between the heading and the list adds a margin', () => {
  // The colour legend used to sit here and needed margin:0. It is gone; if anything
  // is ever put back in that slot it must not reintroduce the gap.
  const r = (src.match(/\.legend\{[^}]*\}/) || [''])[0];
  return r === '' ? true : 'the legend rule is back: ' + r;
});

console.log('\nNOTHING ABOVE THE LIST ADDS A HIDDEN GAP');
t('#advice is a stack, so its alert has no bottom margin', () =>
  /<div class="stack" id="advice">/.test(src) && /\.stack > \*\{margin-bottom:0\}/.test(src)
    ? true : 'the alert margin would add to the first heading');
t('#lRoles is not also a stack, which would double its spacing', () => {
  const tag = (src.match(/<div[^>]*id="lRoles"[^>]*>/) || [''])[0];
  return !/\bstack\b/.test(tag) ? true : 'marked as a stack as well: ' + tag;
});
t('the stack-to-stack rule cannot reach the role list', () => {
  const tag = (src.match(/<div[^>]*id="lRoles"[^>]*>/) || [''])[0];
  return (/\bstack\b/.test(tag) === false) ? true
    : '.stack + .stack would add another ' + varPx('s4') + 'px above the first heading';
});

console.log('\nTHE HEADINGS THEMSELVES ARE ALL THERE');
/* Each of the three is a T() pair now. Both halves have to survive: dropping the
   Vietnamese would silently make the app English-only for the moderators it was
   written for, and dropping the English would strand the other choice. */
/* The Vietnamese half is spelled with \uXXXX escapes in the source, so rather than
   matching the words this checks the SHAPE: the English half must sit as the second
   argument of a T() call, which is only true if a first argument exists. */
for (const en of ['In your deck', 'Base game', 'Characters expansion']){
  t('"' + en + '" is still emitted', () =>
    src.includes(en) ? true : 'heading text missing');
  t('...and it is one half of a pair, not the only language', () => {
    const i = src.indexOf("'" + en);
    if (i < 0) return 'not found as a literal';
    // it must be a second argument: a comma right before it, and a T( opening the call.
    // Scanned as a window rather than one regex because the first argument can contain
    // parentheses -- totalCards() -- which any [^)]* pattern stops dead on.
    const before = src.slice(Math.max(0, i - 200), i);
    return /,\s*$/.test(before) && before.includes('T(')
      ? true : '"' + en + '" is not the second half of a T() pair, so this heading is English-only';
  });
}

/* The Roster is the one heading that does not get its margin from the h2 rule: it sits in a
   flex row with the sound, haptic and close buttons, so it carries margin:0 and the ROW
   spaces it. That is fine until the row picks a different token, which it did -- --s4 --
   and the header read as a different kind of heading from every page header in the app. */
console.log('\nTHE ROSTER HEADER KEEPS THE PAGE RHYTHM');
const H2_BOTTOM = tokenOf(/h2\{[^}]*margin:var\(--s\d\) 0 var\(--s(\d)\)/, 1);
t('the h2 rule still states the gap every page header uses', () =>
  H2_BOTTOM != null ? true : 'no bottom margin on h2, so there is nothing to match');
t('the Roster header row spends the same token the h2 gives up', () => {
  const row = (src.match(/<div class="row" style="margin-bottom:var\(--s(\d)\)"><h2[^>]*id="rosTtl"/) || [])[1];
  if (row == null) return 'the Roster header row no longer declares its own bottom margin';
  return varPx('s' + row) === H2_BOTTOM
    ? true : 'row spends ' + varPx('s' + row) + 'px where every page header spends ' + H2_BOTTOM;
});
t('and it still zeroes the h2 margin, or the row would space it twice', () =>
  /<h2 style="flex:1;margin:0" id="rosTtl">/.test(src)
    ? true : 'the h2 margin is back and adds to the row margin');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
