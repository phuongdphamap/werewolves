// The app teleported between states, and it is played in the dark. Phases swapped by
// toggling display, lists were destroyed with innerHTML, the reveal appeared by adding a
// class — every screen change was a cut, so nothing told the moderator whether they had
// moved forward, sideways, or into something temporary they could back out of.
//
// The constraint that shapes all of this: every list is rebuilt on every render, so any
// animation on a list item would replay on every single tap. Motion here has to attach to
// things that persist — the section, the overlay — or it becomes the decoration the whole
// design is trying to avoid.
const fs = require('fs');
const css  = fs.readFileSync('../css/app.css', 'utf8');
const js   = fs.readFileSync('../js/app.js', 'utf8');
const html = fs.readFileSync('../index.html', 'utf8');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const flat = css.replace(/\s+/g, ' ');
const ms = s => /ms$/.test(s) ? parseFloat(s) : parseFloat(s) * 1000;

console.log('A PHASE CHANGE IS A MOVE, NOT A CUT');
t('entering a phase animates', () =>
  /@keyframes phaseIn\{/.test(css) && /section\.on\{animation:phaseIn/.test(flat)
    ? true : 'phases still swap instantly');
t('it moves as well as fades, so it has a direction', () => {
  const k = (css.match(/@keyframes phaseIn\{[^}]*\}[^}]*\}/) || [''])[0];
  return /translateY/.test(k) && /opacity/.test(k) ? true : 'no direction: ' + k;
});
/* This is the whole reason it does not fire on every tap: render() calls show() every
   time, and toggling a class to the value it already has is not a class change, so the
   animation restarts only when the section genuinely changes. */
t('and it fires on phase entry only, because show() re-toggles to the same value', () => {
  const s = (js.match(/function show\(id\)\{[\s\S]*?\n\}/) || [''])[0];
  return /classList\.toggle\('on', s === id\)/.test(s)
    ? true : 'show() adds and removes the class, so the animation replays on every render';
});

console.log('\nAN OVERLAY PRESENTS AS A SHEET');
t('the reveal and the roster rise into place', () =>
  /@keyframes sheetIn\{/.test(css) && /\.modal\.on\{animation:sheetIn/.test(flat)
    ? true : 'the overlay still appears as a cut');
t('the resume prompt does too', () =>
  /\.veil\.on\{display:grid;animation:sheetIn/.test(flat)
    ? true : 'the first screen a reloaded phone shows is still a cut');
/* An animation rather than a transition, deliberately: these appear from display:none,
   and a transition has no start value to run from. */
t('it is an animation, not a transition that could never run', () =>
  !/\.modal\{[^}]*transition:/.test(flat)
    ? true : 'a transition from display:none never fires');

console.log('\nPROGRESS IS AMBIENT, AND SAID ONCE');
t('the night carries a rule, not a caption', () => {
  const r = (css.match(/\.steps\{[^}]*\}/) || [''])[0];
  if (/font-size/.test(r)) return 'still typography: ' + r;
  return /height:2px/.test(r) ? true : r || 'rule missing';
});
t('it has a fill that can be driven', () =>
  /\.steps > span\{[^}]*width:0/.test(flat) ? true : 'nothing to fill');
t('the fill is animated, so a step reads as movement', () => {
  const r = (flat.match(/\.steps > span\{[^}]*\}/) || [''])[0];
  return /transition:width/.test(r) ? true : 'the bar jumps: ' + r;
});
t('the markup is a progressbar, not a decorative div', () => {
  const tag = (html.match(/<div class="steps" id="nStep"[^>]*>/) || [''])[0];
  return /role="progressbar"/.test(tag) && /aria-label/.test(tag) ? true : tag || 'element missing';
});
t('the app drives it from the step index', () => {
  return /fill\.style\.width = Math\.round\(done \* 100\) \+ '%'/.test(js) &&
         /const done = G\.steps\.length \? \(G\.si \+ 1\) \/ G\.steps\.length : 0/.test(js)
    ? true : 'the bar is not wired to the night';
});
t('a step count with no steps cannot divide by zero', () =>
  /G\.steps\.length \? /.test(js) ? true : 'an empty night would produce NaN%');
t('and it reports its position to a screen reader', () =>
  /aria-valuenow/.test(js) && /aria-valuemax/.test(js)
    ? true : 'the one fact nothing else supplies is now invisible to assistive tech');
/* It used to be said twice, in 10px tracked micro-type both times: the header's progress
   line and the step caption. The header keeps the words; the caption became the rule. */
t('the step caption is gone, so the count is not said twice', () =>
  !/' \\u00b7 step ' \+ \(G\.si\+1\) \+ ' of '/.test(js) && !/· step ' \+ \(G\.si\+1\)/.test(js)
    ? true : 'both renderings of the same count are back');
t('but the header still carries it in words', () =>
  /\(G\.si\+1\) \+ T\(' \/ ', ' of '\) \+ G\.steps\.length/.test(js)
    ? true : 'the precise count is now nowhere');

console.log('\nMOTION DEFERS TO THE READER');
t('prefers-reduced-motion is honoured', () =>
  /@media \(prefers-reduced-motion:reduce\)/.test(css) ? true : 'nothing honours it');
t('it stops animations and transitions alike', () => {
  const b = (css.match(/@media \(prefers-reduced-motion:reduce\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /animation-duration:\.01ms !important/.test(b) && /transition-duration:\.01ms !important/.test(b)
    ? true : 'only half of the moving things stop: ' + b;
});
t('and it reaches pseudo-elements, where the progress fill and the tell dot live', () => {
  const b = (css.match(/@media \(prefers-reduced-motion:reduce\)\{[\s\S]*?\n  \}/) || [''])[0];
  return /\*,\*::before,\*::after/.test(b) ? true : 'pseudo-elements keep moving: ' + b;
});

console.log('\nNOTHING MOVES THAT WOULD MOVE ON EVERY TAP');
/* Every list in the app is torn down and rebuilt by innerHTML on each render, so an
   entry animation on a row or a chip would replay on every single tap — motion that
   entertains rather than orients, which is exactly what this app cannot afford. */
t('list items and chips have no entry animation', () => {
  const bad = ['\\.chip', '\\.p', '\\.r', '\\.dl', '\\.le']
    .filter(sel => new RegExp(sel + '\\{[^}]*animation:').test(flat));
  return bad.length === 0 ? true : 'replays on every render: ' + bad.join(', ');
});
t('the teardown really is still the render model, so that constraint is real', () => {
  const n = (js.match(/innerHTML = ''/g) || []).length;
  return n >= 15 ? true : 'only ' + n + ' teardowns — if this dropped, revisit the above';
});
t('the one live transition still survives a render', () => {
  // .fill persists because refresh() updates it in place rather than rebuilding the row
  return /\.p\.vote \.fill\{[^}]*transition:width/.test(flat)
    ? true : 'the vote bar lost the only transition that ever ran';
});
t('every duration is short enough to orient rather than delay', () => {
  const durs = [...css.matchAll(/animation:\w+ ([\d.]+m?s)/g)].map(m => ms(m[1]));
  const slow = durs.filter(d => d > 320);
  return durs.length > 0 && slow.length === 0
    ? true : 'too slow for a tool used under time pressure: ' + slow.join(', ') + 'ms';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
