// Six container types wore one treatment, so nothing on a screen had rank; nineteen type
// sizes and seven radii were a set of nudges rather than a scale; and .alert — the
// highest-contrast object in the design — was carrying twenty-six different jobs, four of
// which could stack on one dawn.
//
// These are the three system rules that came out of that, and they are the kind of rule
// that decays silently: one hard-coded 13.5px, one more tinted block, one more bordered
// box, and nobody notices until the screen is soup again.
const fs = require('fs');
const css  = fs.readFileSync('../css/app.css', 'utf8');
const js   = fs.readFileSync('../js/app.js', 'utf8');
const html = fs.readFileSync('../index.html', 'utf8');
const src  = [html, css, js].join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

/* :root only, so a token cannot be "declared" by the rule that uses it */
const root = (css.match(/:root\{[\s\S]*?\n  \}/) || [''])[0];

console.log('ONE TYPE SCALE, EIGHT STEPS');
/* t-field is a step like any other, but it is the one whose VALUE is externally fixed:
   iOS Safari zooms any input rendering below 16px. It sits outside the ascending run
   below for that reason — it is chosen by a browser, not by the scale. */
const STEPS = ['t-micro','t-cap','t-small','t-body','t-lg','t-say','t-h','t-max'];
const FIELD = 't-field';
for (const name of STEPS)
  t(name + ' is declared', () =>
    new RegExp('--' + name + ':\\d').test(root) ? true : 'missing from :root');
t('the steps are whole pixels — no 13.5 beside 14', () => {
  const bad = STEPS.map(n => [n, (root.match(new RegExp('--' + n + ':([\\d.]+)px')) || [])[1]])
    .filter(([, v]) => v && !/^\d+$/.test(v));
  return bad.length === 0 ? true : 'fractional step(s): ' + bad.map(b => b.join('=')).join(', ');
});
t('the steps ascend, so "smaller" and "larger" mean something', () => {
  const v = STEPS.map(n => parseFloat((root.match(new RegExp('--' + n + ':([\\d.]+)px')) || [])[1]));
  for (let i = 1; i < v.length; i++) if (!(v[i] > v[i-1])) return v.join(' / ') + ' is not ascending';
  return true;
});
t('no rule declares a bare font-size', () => {
  // one exception would be enough to restart the drift, so there are none
  const bad = [...css.matchAll(/[^-\w]font-size:([\d.]+)px/g)].map(m => m[1]);
  return bad.length === 0 ? true : bad.length + ' hard-coded size(s): ' + bad.join(', ');
});
t('and neither does any inline style in the app', () => {
  const bad = [...js.matchAll(/font-size:([\d.]+)px/g)].map(m => m[1]);
  return bad.length === 0 ? true : 'inline size(s) in app.js: ' + bad.join(', ');
});
t('every font-size points at a step that exists', () => {
  const used = [...css.matchAll(/font-size:var\(--([\w-]+)\)/g)].map(m => m[1]);
  const unknown = [...new Set(used)].filter(n => !STEPS.includes(n) && n !== 'ctl-size' && n !== FIELD);
  return unknown.length === 0 ? true : 'not on the scale: ' + unknown.join(', ');
});
t('the control token resolves to a step rather than its own number', () =>
  /--ctl-size:var\(--t-body\)/.test(root)
    ? true : 'the controls have a private size again');
t('the read-aloud line is still the largest thing on a night screen', () => {
  const say = (css.match(/\.say p\{[^}]*\}/) || [''])[0];
  const ttl = (css.match(/#nTitle\{[^}]*\}/) || [''])[0];
  const px = r => parseFloat((root.match(
    new RegExp('--' + ((r.match(/font-size:var\(--([\w-]+)\)/) || [])[1]) + ':([\\d.]+)px')) || [])[1]);
  return px(say) > px(ttl) ? true : 'the heading is no longer yielding to the line';
});

/* The one step a browser dictates. iOS Safari zooms the page whenever it focuses an input
   below 16px and does not zoom back out on blur, so a 15px field made the vote tally slide
   sideways mid-count. This is the check that keeps it from drifting back. */
t('--t-field is declared and is at least 16px', () => {
  const v = parseFloat((root.match(/--t-field:([\d.]+)px/) || [])[1]);
  return v >= 16 ? true : 'fields render at ' + v + 'px, so iOS will zoom on focus';
});
t('every focusable field uses it', () => {
  const rules = [
    ['input[type=text]', /  input\[type=text\]\{[^}]*\}/],
    ['its placeholder',  /input\[type=text\]::placeholder\{[^}]*\}/],
    ['the tally box',    /\.stp input\[type=text\]\{[^}]*\}/],
  ];
  const bad = rules.filter(([, re]) => !/font-size:var\(--t-field\)/.test((css.match(re) || [''])[0]))
                   .map(([name]) => name);
  return bad.length === 0 ? true : 'below the zoom threshold: ' + bad.join(', ');
});
t('and nothing suppresses pinch-zoom to hide the symptom instead', () =>
  !/maximum-scale|user-scalable/.test(html)
    ? true : 'the viewport disables zoom, which fails WCAG 1.4.4 and iOS ignores anyway');

console.log('\nTHREE RADII, TIED TO WHAT THEY ROUND');
for (const name of ['r-ctl','r-grp','r-full'])
  t(name + ' is declared', () =>
    new RegExp('--' + name + ':\\d').test(root) ? true : 'missing from :root');
t('no rule declares a bare radius', () => {
  // 0 resets a row inside a group, 50% is a circle: neither is a radius decision
  const bad = [...css.matchAll(/border-radius:([\d.]+)px/g)].map(m => m[1]);
  return bad.length === 0 ? true : bad.length + ' hard-coded radi(us|i): ' + bad.join(', ');
});
t('every radius points at one of the three', () => {
  const used = [...css.matchAll(/border-radius:var\(--([\w-]+)\)/g)].map(m => m[1]);
  const unknown = [...new Set(used)].filter(n => !['r-ctl','r-grp','r-full'].includes(n));
  return unknown.length === 0 ? true : 'not one of the three: ' + unknown.join(', ');
});
t('a grouped container is rounder than a row inside it', () => {
  const g = parseFloat((root.match(/--r-grp:([\d.]+)px/) || [])[1]);
  const c = parseFloat((root.match(/--r-ctl:([\d.]+)px/) || [])[1]);
  return g > c ? true : 'the container radius no longer reads as containing anything';
});

console.log('\nTHREE SURFACES, ONE JOB EACH');
t('.group is a single container, not a per-row treatment', () =>
  /\.group\{background:var\(--surf\);border:1px solid var\(--line\);border-radius:var\(--r-grp\)/.test(css)
    ? true : 'no grouped surface');
t('its rows are divided by a hairline', () =>
  /\.group > \* \+ \*\{border-top:1px solid var\(--line\)\}/.test(css)
    ? true : 'a group with no separators is one undivided block');
t('and they give up their own border, so edges are not doubled', () =>
  /\.group > \.p,\.group > \.r,\.group > \.dl\{background:none;border:0;border-radius:0\}/.test(css)
    ? true : 'rows still draw their own edge inside the container');

/* Both of the two rules above being PRESENT is not the invariant, and asserting only that
   is how the hairlines shipped declared-but-never-drawn: `.group > .p` is (0,2,0) and
   `.group > * + *` is (0,1,0), so `border:0` won wherever it applied and every group
   rendered as one undivided block. Source order does not help — specificity is decided
   first. A browser found it; this resolves the cascade so node can.  */
const spec = sel => {
  // enough for the selector shapes this stylesheet uses inside .group
  const classes = (sel.match(/\.[\w-]+/g) || []).length;
  const pseudo  = (sel.match(/:(?!not\()[\w-]+/g) || []).length
                + (sel.match(/:not\(:[\w-]+\)/g) || []).length;
  return classes + pseudo;             // no ids or attribute selectors in play here
};
/* Does `sel` match a row of class `cls` that is NOT the first child of a .group? */
const matchesLaterRow = (sel, cls) => {
  const s = sel.trim();
  if (s === '.group > * + *') return true;                    // any non-first child
  if (s === '.group > .' + cls) return true;                  // that row type, any position
  if (s === '.group > .' + cls + ':not(:first-child)') return true;
  return false;
};
for (const cls of ['p','r','dl']){
  t('a second .' + cls + ' in a group actually draws its hairline', () => {
    // every declaration block whose selector list touches .group. Comments are stripped
    // first: the prose above these very rules contains commas, and splitting a selector
    // list on those glued half a sentence onto the front of one selector.
    const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [...bare.matchAll(/([^{}]*\.group[^{}]*)\{([^}]*)\}/g)].map((m, i) => ({
      sels: m[1].split(',').map(x => x.trim()), body: m[2], order: i,
    }));
    let win = null;   // highest specificity, then latest in source order
    for (const r of rules){
      if (!/border(-top)?(-width)?\s*:/.test(r.body)) continue;
      for (const s of r.sels){
        if (!matchesLaterRow(s, cls)) continue;
        const sp = spec(s);
        if (!win || sp > win.sp || (sp === win.sp && r.order >= win.order))
          win = { sp, order: r.order, body: r.body, sel: s };
      }
    }
    if (!win) return 'no rule sets a border on a .' + cls + ' inside a group at all';
    /* Resolve the width the winning block actually leaves on the top edge. Reading it
       rather than pattern-matching for `border:0`, because `border-top:0px solid` is
       just as invisible and would sail past a check that only knows the shorthand. */
    let px = null;
    for (const m of win.body.matchAll(
        /border(?:-top)?(?:-width)?:\s*([\d.]+)px|border(?:-top)?(?:-width)?:\s*(0)\b/g))
      px = parseFloat(m[1] !== undefined ? m[1] : m[2]);
    if (px === null) return 'the winning rule sets no resolvable top width: ' + win.body;
    return px > 0
      ? true
      : 'the winning rule is `' + win.sel + '` (specificity ' + win.sp + '), and it leaves ' +
        px + 'px on the top edge — the separator is declared but never drawn';
  });
}
t('every list the app builds is grouped', () => {
  // the vote list is deliberately NOT -- see below
  const lists = [...js.matchAll(/el\('div','(ros|deal)([^']*)'\)/g)].map(m => m[1] + m[2]);
  const loose = lists.filter(c => !/\bgroup\b/.test(c));
  return loose.length === 0 ? true : 'ungrouped list(s): ' + loose.join(', ');
});
t('...and the two in the static markup as well', () => {
  const bad = ['lPlayers','dealList'].filter(id => {
    const tag = (html.match(new RegExp('<div[^>]*id="' + id + '"[^>]*>')) || [''])[0];
    return !/class="[^"]*\bgroup\b/.test(tag);
  });
  return bad.length === 0 ? true : 'not grouped: ' + bad.join(', ');
});
/* The vote rows are the one list that keeps its own edges, and it is not an oversight:
   each row carries state the others do not -- lead, over -- and .p.vote.over signals
   "this vote carries" with a --wolf border that a grouped row would have surrendered.
   They are also reordered with flex `order`, and a border-top on the DOM-first child
   would land in the middle of the visual list. */
t('the vote list is the documented exception, and still says why', () =>
  /\.p\.vote\.over\{border-color:var\(--wolf\)\}/.test(css) &&
  /dyVotes/.test(js) && !/list = el\('div', ?'group'/.test(js)
    ? true : 'the exception changed without its reason changing');

console.log('\nTHE TINT IS RESERVED');
/* Keep it for what genuinely stops the moderator: a rule that blocks the next action
   (.alert.no) and the Bear Tamer's growl. Everything else is .tell -- ordinary prose
   with a small leading mark. */
t('.tell exists and is plain text, not another tinted box', () => {
  const r = (css.match(/\n  \.tell\{[^}]*\}/) || [''])[0];
  return r && !/background:/.test(r) && !/border:/.test(r)
    ? true : '.tell has grown a fill or an edge: ' + r;
});
t('it carries a small leading mark', () =>
  /\.tell::before\{content:"";[^}]*border-radius:50%/.test(css)
    ? true : 'no glyph, so demoted lines have nothing to hang on');
t('only its dot is tinted when it is good news', () => {
  const r = (css.match(/\.tell\.ok::before\{[^}]*\}/) || [''])[0];
  return /background:var\(--vil\)/.test(r) && !/color:/.test(r)
    ? true : '.ok tints the whole block again: ' + r;
});
t('at most nine tinted alerts survive in the app', () => {
  // twenty-seven before; the review expected roughly two-thirds to become prose
  const n = (js.match(/'alert/g) || []).length;
  return n <= 9 ? true : n + ' tinted alerts, so the loudest object is ordinary again';
});
t('and the demoted ones really became prose', () => {
  const n = (js.match(/'tell/g) || []).length;
  return n >= 18 ? true : 'only ' + n + ' .tell lines, so the alerts went somewhere else';
});
t('every surviving alert is a .no, or the growl', () => {
  const kept = [...js.matchAll(/'alert([^']*)'/g)].map(m => m[1].trim());
  const odd = kept.filter(k => k !== 'no' && k !== '');
  if (odd.length) return 'un-reserved tint(s): alert ' + odd.join(', alert ');
  // exactly one bare 'alert' is allowed, and it has to be the growl
  const bare = kept.filter(k => k === '').length;
  if (bare !== 1) return bare + ' bare .alert uses; only the growl may be one';
  return /growl \? 'alert' : 'tell ok'/.test(js)
    ? true : 'the one bare alert is no longer the growl';
});
t('a plain .alert.ok no longer exists anywhere', () =>
  !/'alert ok'/.test(js)
    ? true : 'good news is still being delivered at interrupt volume');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
