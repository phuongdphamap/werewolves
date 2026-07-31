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
t('two adjacent stacks are spaced from each other', () =>
  /\.stack:not\(:empty\) \+ \.stack:not\(:empty\)\{margin-top:var\(--s4\)\}/.test(src)
    ? true : 'recBox would sit flush against advice');
t('an empty container adds no stray gap', () =>
  /:not\(:empty\)/.test(src) ? true : 'an empty #advice would still push the page down');

console.log('\nEVERY CONTAINER THE APP WRITES INTO IS A STACK');
// find every element the code appends children to, then check its markup
const targets = new Set();
for (const m of js.matchAll(/\$\('(\w+)'\)/g)) targets.add(m[1]);
const written = [...targets].filter(id =>
  new RegExp("(const \\w+ = )?\\$\\('" + id + "'\\)(\\.innerHTML = ''|\\.appendChild)").test(js) ||
  new RegExp("\\b\\w+ = \\$\\('" + id + "'\\);[\\s\\S]{0,80}\\.appendChild").test(js));
t('at least eight write targets were discovered', () =>
  written.length >= 8 ? true : 'only found ' + written.join(', '));
const notStack = [];
for (const id of written){
  const tag = (src.match(new RegExp('<div[^>]*id="' + id + '"[^>]*>')) || [''])[0];
  if (!tag) continue;                                    // built in JS, not static markup
  const isStack = /class="[^"]*\bstack\b/.test(tag);
  const isOther = /class="[^"]*\b(roles|ros|deal|log|chips)\b/.test(tag);  // has its own gap
  if (!isStack && !isOther) notStack.push(id + ' -> ' + tag);
}
t('none of them is missing its spacing mechanism', () =>
  notStack.length === 0 ? true : notStack.join(' | '));

console.log('\nTHE EIGHT KNOWN STACKS');
for (const id of ['recBox','advice','nBody','dwBody','dyBody','lrBody','rosBody','dealAlt']){
  t(id + ' is marked', () =>
    new RegExp('<div class="stack" id="' + id + '">').test(src) ? true : 'not a stack');
}

console.log('\nCONTAINERS WITH THEIR OWN GAP ARE LEFT ALONE');
for (const [cls, id, how] of [['roles','lRoles','gap'], ['deal','dealList','gap'],
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
  const r = (src.match(/\.exp\{[^}]*\}/) || [''])[0].replace(/\s+/g,' ');
  return /margin-bottom:var\(--s3\)/.test(r) ? true : r || 'rule missing';
});
t('inside a stack that margin is zeroed, so it is 20px not 34px', () =>
  /\.stack > \*\{margin-bottom:0\}/.test(src) ? true : 'would compound');

/* A collapsible's body holds one of two things: prose, which it spaces itself, or a
   component that arrives with its own spacing tokens — the house-rules panel. The prose
   rule was written as a bare descendant, `.expBody p`, which is a class PLUS a type and
   therefore outranks `.note` (a class alone). So every note inside every collapsible lost
   its top margin and sat flush against whatever was above it, while the identical
   grp/chips/note pattern in a plain .card kept its 10px. Reported as "why is the content
   paragraph tight with the header above". */
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
