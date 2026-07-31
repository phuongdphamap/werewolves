// Checks the collapsible guidance blocks: every one is built through the shared
// helper, defaults to closed, remembers its own state, and is actually styled.
// Also checks that folding the text did not orphan or duplicate any container,
// which is the failure mode when moving code between appendChild calls.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

const helper = (src.match(/function collapsible\(key, title, body\)\{[\s\S]*?\n\}/) || [''])[0];

console.log('THE HELPER');
t('collapsible() exists', () => helper.length > 0 ? true : 'not found');
t('it builds a native <details>, so it works without JS', () =>
  /createElement\('details'\)/.test(helper) ? true : 'not using details');
t('it defaults to closed', () =>
  /d\.open = expOpen\.has\(key\)/.test(helper) ? true : 'does not default to closed');
t('it remembers whether you opened it', () =>
  /addEventListener\('toggle'[\s\S]*?expOpen\.(add|delete)/.test(helper) ? true : 'no state memory');
/* Two sets now: "opened by hand" and "shut by hand". They are different states once the
   teaching layer gets a vote on the default, because only an explicit close should
   override it. Both must stay out of G, or Undo would clobber them. */
t('the state stores live outside the snapshotted game state', () => {
  const decl = /const expOpen = new Set\(\), expShut = new Set\(\);/.test(src);
  const inBlank = /exp(Open|Shut)/.test(src.match(/function blank\(\)\{[\s\S]*?\n\}/)[0]);
  return decl && !inBlank ? true : 'a collapsible store is inside G, so Undo would clobber it';
});
t('an unopened block still defaults to closed once the tips retire', () => {
  const h = src.match(/function collapsible\(key, title, body\)\{[\s\S]*?\n\}/)[0];
  return /d\.open = expOpen\.has\(key\) \|\| \(teaching\(\) && !expShut\.has\(key\)\)/.test(h)
    ? true : 'the default is no longer tied to experience';
});

console.log('\nEVERY LONG BLOCK IS FOLDED');
const keys = [...src.matchAll(/collapsible\('(\w+)'/g)].map(m => m[1]);
t('six blocks are collapsible', () =>
  keys.length === 6 ? true : keys.length + ' found: ' + keys.join(', '));
t('each has a distinct key, or they would share open state', () =>
  new Set(keys).size === keys.length ? true : 'duplicate keys: ' + keys.join(', '));
for (const [key, what] of [['deal','the deal-route explanation'],
                           ['sheriff','what the badge does'],
                           ['order','how the two rulesets differ'],
                           ['deckhow','shuffle vs suggested'],
                           ['house','the disputed house rules'],
                           ['chronicle','the older half of the chronicle']]){
  t(what + " is folded (key '" + key + "')", () =>
    keys.includes(key) ? true : 'missing');
}

t('a body may be a live node as well as markup', () =>
  /typeof body === 'string'/.test(helper) && /b\.appendChild\(body\)/.test(helper)
    ? true : 'a node body would stringify to [object HTMLDivElement]');

console.log('\nSTYLING EXISTS (a class with no rule has bitten me before)');
for (const [sel, what] of [['\\.exp\\{','the container'],
                           ['\\.exp > summary\\{','the tappable header'],
                           ['\\.exp > summary::after','the +/\u2212 affordance'],
                           ['\\.exp\\[open\\] > summary::after','the open state marker'],
                           ['\\.expBody\\{','the body text']]){
  t(what + ' is styled', () => new RegExp(sel).test(src) ? true : 'rule missing');
}
t('the native disclosure triangle is suppressed', () =>
  /::-webkit-details-marker\{display:none\}/.test(src) && /list-style:none/.test(src)
    ? true : 'default marker would show alongside ours');
t('summary meets the 44px tap target', () => {
  const m = src.match(/\.exp > summary\{[^}]*\}/)[0];
  const mh = m.match(/min-height:(\d+)px/);
  return (mh && +mh[1] >= 44) ? true : 'min-height ' + (mh ? mh[1] : 'unset');
});

console.log('\nNOTHING WAS ORPHANED BY MOVING THE TEXT');
for (const [call, n] of [['RB.appendChild(pc);',1], ['RB.appendChild(rec);',1]]){
  t(call + ' appears exactly once', () => {
    const c = src.split(call).length - 1;
    return c === n ? true : c + ' times';
  });
}
t('the essential deal instruction is still shown unfolded', () =>
  /Shuffle these <b>' \+ totalCards\(\)/.test(src) ? true : 'lost the actual instruction');
// both labels are T() pairs now, so the check is on the shape rather than the wording
t('the night order reference is still shown unfolded', () =>
  /T\('[^']*','First night:'\)/.test(src) && /chain\(one\)/.test(src)
    ? true : 'lost the order lines');
t('the current deck is still shown unfolded', () =>
  /T\('[^']*','This deck:'\)/.test(src) ? true : 'lost the deck listing');
t('and both name their cards in the interface language', () =>
  /const chain = list => list\.length \? list\.map\(rName\)/.test(src)
    ? true : 'the call-order preview is back to hard-coded Vietnamese names');
t('the Sheriff vote weight is still shown unfolded', () =>
  /Their vote is worth <b>' \+ SHERIFF_WEIGHT\(\)/.test(src) ? true : 'lost the weight');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
