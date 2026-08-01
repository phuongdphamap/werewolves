// Vertical spacing kept breaking because it was hard-coded to a list of element
// ids, and I kept forgetting to extend the list — recBox and advice had no rule
// at all, so a collapsible sat flush against the alert below it.
//
// It is now structural: a container carries .stack and its children are spaced
// uniformly. These tests assert every container that gets appendChild'd is a
// stack, so a new one cannot silently ship unspaced.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');
const js  = fs.readFileSync('../js/app.js','utf8');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

console.log('THE RULE IS STRUCTURAL, NOT A LIST OF IDS');
t('spacing is driven by a class', () =>
  /\.stack > \* \+ \*\{margin-top:var\(--s4\)\}/.test(src) ? true : 'no .stack rule');
t('no id-based spacing selector survives', () =>
  !/#\w+ > \* \+ \*/.test(src) ? true : (src.match(/#\w+ > \* \+ \*/g)||[]).join(', '));
t('children give up their own bottom margin, so gaps cannot double', () =>
  /\.stack > \*\{margin-bottom:0\}/.test(src) ? true : 'margins would compound to 34px');
/* The pairing rule used to require BOTH siblings to be stacks, so #dealAlt — which
   follows a plain <p> — was given nothing, and the collapsible inside it rendered flush
   against the deal note while every other gap on that screen was 20px. Its first child
   gets no `* + *` either, so there was nothing to fall back on. Reported from a
   screenshot; measured at 0px before the fix. */
t('a stack is spaced from whatever precedes it, not only from another stack', () => {
  if (/\.stack:not\(:empty\) \+ \.stack:not\(:empty\)\{/.test(src))
    return 'the rule still pairs stack with stack, so a stack after a <p> gets nothing';
  return /\* \+ \.stack:not\(:empty\)\{margin-top:var\(--s4\)\}/.test(src)
    ? true : 'nothing gives a following stack a top margin';
});
t('and an empty one still adds no stray gap', () =>
  /\* \+ \.stack:not\(:empty\)\{/.test(src)
    ? true : 'an empty #advice would push the page down');
/* Every stack in the static markup, checked against what precedes it. The rule only helps
   if the containers it is written for actually have a preceding sibling to be spaced from. */
t('every stack in the markup either leads its section or has something to be spaced from', () => {
  const ids = [...src.matchAll(/<div class="[^"]*\bstack\b[^"]*" id="(\w+)"/g)].map(m => m[1]);
  if (ids.length < 8) return 'only found ' + ids.length + ' stacks in the markup';
  // a stack whose previous sibling is a <p> or a <div> is exactly the case that was broken
  const afterProse = ids.filter(id => {
    const i = src.indexOf('id="' + id + '"');
    const before = src.slice(Math.max(0, i - 400), i);
    return /<p[^>]*>[\s\S]*?<\/p>\s*<div[^>]*$/.test(before);
  });
  return afterProse.length > 0
    ? true : 'no stack follows prose any more; re-check whether this rule is still needed';
});
t('an empty container adds no stray gap', () =>
  /:not\(:empty\)/.test(src) ? true : 'an empty #advice would still push the page down');

/* Every $('id') has to resolve. Several headings moved out of static markup and into the
   render functions so they could follow the interface language, and `$('pTtl').textContent
   = …` throws on a typo — taking the whole screen down, not just the label. The suites
   never execute a render, so nothing else here would notice. */
/* The rhythm rules specifically — the gaps that decide how blocks sit relative to each
   other. Component padding (a button's 11px 14px, an icon's 8px gap) is deliberately NOT
   in scope: the scale governs the page, not every pixel inside a control. A mutation that
   set the stack gap to 7px sailed past every other suite. */
console.log('\nTHE BLOCK RHYTHM COMES FROM THE SPACING SCALE');
const SCALE = ['s1','s2','s3','s4','s5','s6'];
const rhythmRules = [
  ['\\.stack > \\* \\+ \\*', 'the gap between siblings in a stack'],
  ['\\* \\+ \\.stack:not\\(:empty\\)', 'the gap above a stack'],
  ['\\.roles > \\.grp', 'the gap above a role-list heading'],
  ['\\n  \\.grp', 'the group heading'],
  ['\\n  \\.card', 'a card'],
  ['\\.expBody', 'a collapsible body'],
];
for (const [sel, what] of rhythmRules){
  t(what + ' is measured in scale steps', () => {
    const r = (src.match(new RegExp(sel + '\\{[^}]*\\}')) || [''])[0];
    if (!r) return 'rule missing for ' + sel;
    const spacing = [...r.matchAll(/(?:margin|padding|gap)[a-z-]*:([^;}]+)/g)].map(m => m[1].trim());
    if (!spacing.length) return true;                       // declares no spacing at all
    const bare = spacing.filter(v => /\d+px/.test(v) && !/var\(--s\d\)/.test(v));
    return bare.length === 0
      ? true : 'off the scale: ' + bare.join(' | ') + '   in ' + r.replace(/\s+/g, ' ');
  });
}
t('and every step the rhythm uses is one that exists', () => {
  const used = new Set();
  for (const [sel] of rhythmRules){
    const r = (src.match(new RegExp(sel + '\\{[^}]*\\}')) || [''])[0];
    for (const m of r.matchAll(/var\(--(s\d)\)/g)) used.add(m[1]);
  }
  const unknown = [...used].filter(k => !SCALE.includes(k));
  return unknown.length === 0 ? true : 'undeclared step(s): ' + unknown.join(', ');
});

/* Two buttons side by side are a ROW, not two stack children. A bare .btn is inline-block,
   so a stack hands it a vertical margin that does nothing horizontally and no gap at all —
   the Witch's "Save X" rendered welded to "Our table allows self-rescue". Measured at 0px.
   Reported from a screenshot. */
console.log('\nSIDE-BY-SIDE BUTTONS ARE A ROW');
t('no two buttons are appended straight into the same stack', () => {
  /* Two .btn appended to the same container with nothing between them. An `} else {`
     inside the span means they are alternatives — the dawn screen's adjust/hide pair —
     and only one ever renders, so that is not the shape being caught. */
  const bad = [...js.matchAll(/(\w+)\.appendChild\((\w+)\);([\s\S]{0,400}?)\1\.appendChild\((\w+)\);/g)]
    .filter(m => {
      if (/\}\s*else\s*\{/.test(m[3] === undefined ? '' : m[3])) return false;
      const both = new RegExp("const " + m[2] + " = el\\('button','btn[\\s\\S]*?const " + m[4] + " = el\\('button','btn");
      return m[1] === 'B' && both.test(js);
    })
    .map(m => m[2] + ' + ' + m[4]);
  return bad.length === 0
    ? true : 'buttons sharing a stack with no row between them: ' + bad.join(', ');
});
t('the row modifier exists and only adds wrapping', () => {
  const r = (src.match(/\.row\.flow\{[^}]*\}/) || [''])[0];
  return /^\.row\.flow\{flex-wrap:wrap\}$/.test(r.replace(/\s+/g, ''))
    ? true : 'the modifier does more than wrap: ' + (r || 'rule missing');
});
t('the Witch pair uses it', () => {
  const w = (js.match(/const blockSelf = selfVictim[\s\S]*?B\.appendChild\(row\);/) || [''])[0];
  return /el\("div","row flow"\)/.test(w) && /row\.appendChild\(b\)/.test(w) && /row\.appendChild\(allow\)/.test(w)
    ? true : 'the two buttons are not in one row';
});
t('and the shuffle pair does too, rather than an inline style', () =>
  !/style\.flexWrap/.test(js) && (js.match(/el\("div","row flow"\)/g) || []).length >= 2
    ? true : 'a row still sets its wrapping from JavaScript');

/* .row.wrap was the first name tried, and it inherited flex-direction:column from .wrap —
   the app's ROOT container — which stacked the pair instead of spacing it. A modifier that
   reuses a layout class name silently takes its declarations. */
t('no component modifier collides with a top-level layout class', () => {
  // comments name the collision to explain it; the check is about selectors
  const bare = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const layout = ['wrap', 'bar', 'in', 'stack', 'group'];
  const bad = [];
  for (const name of layout){
    const re = new RegExp('\\.[a-z][\\w-]*\\.' + name + '\\b(?![\\w-])', 'g');
    for (const m of bare.match(re) || []){
      if (/^\.(stack|group)\./.test(m)) continue;      // scoping, not a modifier
      bad.push(m);
    }
  }
  return bad.length === 0
    ? true : 'modifier(s) inherit a layout class: ' + [...new Set(bad)].join(', ');
});

console.log('\nEVERY ELEMENT THE APP ADDRESSES EXISTS');
t('no $() lookup is missing from the markup', () => {
  const ids = [...new Set([...js.matchAll(/\$\('(\w+)'\)/g)].map(m => m[1]))];
  const missing = ids.filter(id => !new RegExp('id="' + id + '"').test(src));
  return missing.length === 0
    ? true : missing.length + ' would return null and throw: ' + missing.join(', ');
});
t('and enough of them are checked for this to mean something', () => {
  const n = [...new Set([...js.matchAll(/\$\('(\w+)'\)/g)].map(m => m[1]))].length;
  return n >= 50 ? true : 'only found ' + n + ' lookups, so the pattern has changed';
});

console.log('\nEVERY CONTAINER THE APP WRITES INTO IS A STACK');
/* Find every element the code appends children to, then check its markup.
   Discovery used to require the appendChild within 80 characters of the lookup, which
   made the test a proximity heuristic rather than a check: adding a comment between
   `const B = $('dyBody')` and the first append silently dropped dyBody from the list and
   stopped it being checked at all. It now follows the variable, wherever it is used. */
const targets = new Set();
for (const m of js.matchAll(/\$\('(\w+)'\)/g)) targets.add(m[1]);
const written = [...targets].filter(id => {
  // appended to directly: $('x').appendChild(...) — or cleared, which implies ownership
  if (new RegExp("\\$\\('" + id + "'\\)(\\.innerHTML = ''|\\.appendChild)").test(js)) return true;
  // or bound to a variable that is appended to somewhere
  const bound = [...js.matchAll(new RegExp("(\\w+) = \\$\\('" + id + "'\\)", 'g'))].map(m => m[1]);
  return bound.some(v => new RegExp('\\b' + v + '\\.appendChild').test(js));
});
t('at least eight write targets were discovered', () =>
  written.length >= 8 ? true : 'only found ' + written.join(', '));
const notStack = [];
for (const id of written){
  const tag = (src.match(new RegExp('<div[^>]*id="' + id + '"[^>]*>')) || [''])[0];
  if (!tag) continue;                                    // built in JS, not static markup
  const isStack = /class="[^"]*\bstack\b/.test(tag);
  // `in` is the bar's button row — .bar .in is a flex row with its own gap
  const isOther = /class="[^"]*\b(roles|ros|deal|log|chips|in)\b/.test(tag);  // has its own gap
  if (!isStack && !isOther) notStack.push(id + ' -> ' + tag);
}
t('none of them is missing its spacing mechanism', () =>
  notStack.length === 0 ? true : notStack.join(' | '));

console.log('\nTHE EIGHT KNOWN STACKS');
for (const id of ['recBox','advice','nBody','dwBody','dyBody','lrBody','rosBody','dealAlt']){
  t(id + ' is marked', () =>
    new RegExp('<div class="stack" id="' + id + '">').test(src) ? true : 'not a stack');
}

/* .deal moved from a gapped list to a grouped container: one border round the whole
   thing, hairlines between the rows, no per-row edge. So it no longer wants a gap — it
   wants the .group separator rule instead, and having both would draw a line AND a space. */
console.log('\nA GROUPED CONTAINER DIVIDES ITS OWN ROWS');
t('#dealList is a group, so its rows give up their borders', () => {
  const tag = (src.match(/<div[^>]*id="dealList"[^>]*>/) || [''])[0];
  return /class="[^"]*\bgroup\b/.test(tag) ? true : tag || 'markup not found';
});
t('...and a group has no gap, or it would space AND divide', () =>
  !/\.deal\{[^}]*gap:var/.test(src) ? true : '.deal still adds a gap on top of the hairline');
t('the group draws the hairline between rows itself', () =>
  /\.group > \* \+ \*\{border-top:1px solid var\(--line\)\}/.test(src)
    ? true : 'a group with no separator is one undivided block');
t('and the rows inside it surrender their own edges', () =>
  /\.group > \.p,\.group > \.r,\.group > \.dl\{background:none;border:0;border-radius:0\}/.test(src)
    ? true : 'a border inside a bordered container is a double edge');
t('an empty group draws nothing', () =>
  /\.group:empty\{display:none\}/.test(src)
    ? true : '#lPlayers and #dealList start empty and would show an empty box');

console.log('\nCONTAINERS WITH THEIR OWN GAP ARE LEFT ALONE');
for (const [cls, id, how] of [['roles','lRoles','gap'],
                              ['log','enLog','divider']]){
  t('#' + id + ' keeps its own ' + how + ' rather than doubling up', () => {
    const tag = (src.match(new RegExp('<div[^>]*id="' + id + '"[^>]*>')) || [''])[0];
    if (!tag) return 'markup not found';
    if (/\bstack\b/.test(tag)) return 'marked as a stack as well, spacing would double';
    if (how === 'gap')
      return new RegExp('\\.' + cls + '\\{[^}]*gap:var').test(src) ? true : 'no gap rule for .' + cls;
    // a divided list spaces its rows with padding and a rule, not a gap
    return /\.le\{[^}]*padding:var\(--s3\) 0[^}]*\}/.test(src) &&
           /\.le\{[^}]*border-bottom/.test(src)
      ? true : '.le has neither padding nor a divider';
  });
}

console.log('\nA COLLAPSIBLE SPACES ITSELF OUTSIDE A STACK TOO');
t('.exp carries a bottom margin like .card', () => {
  // anchored to the component rule, not the `.stack > .card,.stack > .alert,.stack > .exp`
  // reset, whose tail also reads as `.exp{margin-bottom:0}`
  const r = (src.match(/\n  \.exp\{[^}]*\}/) || [''])[0].replace(/\s+/g,' ');
  return /margin-bottom:var\(--s3\)/.test(r) ? true : r || 'rule missing';
});
t('inside a stack that margin is zeroed, so it is 20px not 34px', () =>
  /\.stack > \*\{margin-bottom:0\}/.test(src) ? true : 'would compound');
/* Two mechanisms for one gap. .card, .alert and .exp each declare a margin-bottom that
   only ever applies OUTSIDE a stack, which is how nineteen type sizes started: a value
   that is right half the time and invisible the other half. The stack owns the gap. */
t('components inside a stack surrender their own bottom margin', () => {
  const r = (src.match(/\.stack > \.card,\.stack > \.alert,\.stack > \.exp\{[^}]*\}/) || [''])[0];
  return /margin-bottom:0/.test(r)
    ? true : 'a container gap and a component margin both apply: ' + (r || 'rule missing');
});
t('and every component the app appends is covered by that reset', () => {
  /* Only classes the app CONSTRUCTS can end up as a stack child; .tally, .barnote and the
     reveal's parts are static markup that never lives in one, so they keep their own gap
     legitimately. */
  const own = [...src.matchAll(/\n  \.(\w+)\{[^}]*margin-bottom:var\(--s\d\)[^}]*\}/g)].map(m => m[1]);
  const built = own.filter(c =>
    new RegExp("el\\('div','" + c + "\\b").test(js) || new RegExp("className = '" + c + "'").test(js));
  const reset = (src.match(/\.stack > \.card,\.stack > \.alert,\.stack > \.exp\{[^}]*\}/) || [''])[0];
  const missing = built.filter(c => !reset.includes('.' + c));
  return built.length > 0 && missing.length === 0
    ? true : 'appended into stacks but not reset: ' + (missing.join(', ') || '(found none to check)');
});
/* Why the higher-specificity reset is needed at all: `.stack > *` and `.card` are both a
   single class, so the cascade falls through to source order — and .card is declared
   later. The generic rule has been losing this fight since it was written. */
t('the generic rule alone would lose to the component', () => {
  const iGeneric = src.indexOf('.stack > *{margin-bottom:0}');
  const iCard = src.search(/\n  \.card\{/);
  const iReset = src.indexOf('.stack > .card,.stack > .alert,.stack > .exp');
  if (iGeneric < 0 || iCard < 0) return 'one of the two rules is missing';
  return iCard > iGeneric && iReset > -1
    ? true : 'the reset is gone, and .card would out-order the generic rule';
});

/* A collapsible's body holds one of two things: prose, which it spaces itself, or a
   component that arrives with its own spacing tokens — the house-rules panel. The prose
   rule was written as a bare descendant, `.expBody p`, which is a class PLUS a type and
   therefore outranks `.note` (a class alone). So every note inside every collapsible lost
   its top margin and sat flush against whatever was above it, while the identical
   grp/chips/note pattern in a plain .card kept its 10px. Reported as "why is the content
   paragraph tight with the header above". */
/* The body was padded 14 top against 20 sides and 20 bottom, so the prose sat visibly
   nearer the divider above it than the border below. Reported from a screenshot. */
console.log('\nA COLLAPSIBLE BODY IS PADDED EVENLY');
t('the body pads all four sides the same', () => {
  const r = (src.match(/\.expBody\{[^}]*\}/) || [''])[0];
  const pad = (r.match(/padding:([^;]+);/) || [,''])[1].trim();
  return pad === 'var(--s4)'
    ? true : 'padding is ' + pad + ', so the text hugs one edge';
});
t('...and it matches what a .card uses, since both are panels', () => {
  const card = (src.match(/\n  \.card\{[^}]*\}/) || [''])[0];
  const body = (src.match(/\.expBody\{[^}]*\}/) || [''])[0];
  const p = r => ((r.match(/padding:([^;}]+)/) || [,''])[1] || '').trim();
  return p(card) === p(body) ? true : 'card=' + p(card) + ' expBody=' + p(body);
});
t('the summary keeps its own row padding, which is a different job', () => {
  const r = (src.match(/\.exp > summary\{[^}]*\}/) || [''])[0];
  return /padding:var\(--s3\) var\(--s4\)/.test(r)
    ? true : 'the summary is no longer a row: ' + r;
});

console.log('\nA COMPONENT INSIDE A COLLAPSIBLE KEEPS ITS OWN SPACING');
t('the prose rule is scoped to direct children', () =>
  /\.expBody > p\{/.test(src)
    ? true : 'a bare .expBody p outranks .note and flattens it');
t('so does its last-child exception', () =>
  /\.expBody > p:last-child\{/.test(src)
    ? true : 'the unscoped version would zero a nested note’s bottom margin too');
t('no unscoped .expBody descendant selector targets a spacing property', () => {
  const bad = [...src.matchAll(/\.expBody ([a-z]+)\{([^}]*)\}/g)]
    .filter(m => /margin|padding/.test(m[2]))
    .map(m => '.expBody ' + m[1]);
  return bad.length === 0
    ? true : 'reaches into nested components and beats their class: ' + bad.join(', ');
});
t('.note still declares the top margin the panel relies on', () =>
  /\.note\{[^}]*margin:var\(--s2\) 0 0\}/.test(src)
    ? true : 'the note has no own spacing left to win with');
t('the house-rules panel is a node body, which is why it was exposed', () => {
  // a string body's <p> are direct children; this one's are grandchildren
  const c = (src.match(/function collapsible\(key, title, body\)\{[\s\S]*?\n\}/) || [''])[0];
  return /b\.appendChild\(body\)/.test(c) && /houseRulesUI\(\)/.test(src)
    ? true : 'the two body shapes are no longer distinguishable';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
