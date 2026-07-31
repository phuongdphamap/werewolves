// What one tap costs. The night call felt slow in Firefox, and it was five things
// stacked on the same click path: a full serialise, a full rebuild, a forced layout, a
// property write that woke the observer that forced the layout, and all of it under a
// live backdrop blur over a region the rebuild had just dirtied.
//
// bar-test holds the blur gone and the measurement guarded. This suite covers the rest:
// whether the tap is acknowledged at all, and what is rebuilt or re-ramped when it is.
const fs = require('fs');
const html = fs.readFileSync('../index.html','utf8');
const css  = fs.readFileSync('../css/app.css','utf8');
const js   = fs.readFileSync('../js/app.js','utf8');
const src  = [html, css, js].join('\n');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };
const rule = re => { const m = css.match(re); return m ? m[0].replace(/\s+/g,' ') : ''; };
function grab(name){
  const i = js.indexOf('function ' + name + '(');
  if (i < 0) return '';
  let d = 0, k = js.indexOf('{', i);
  while (k < js.length){
    if (js[k] === '{') d++;
    else if (js[k] === '}'){ d--; if (!d) return js.slice(i, k+1); }
    k++;
  }
  return '';
}

/* .chip is how every night target, every role assignment and every house rule is chosen —
   the most-tapped control in the app — and it had only :hover, which a phone never fires.
   .btn, .stp button and .ico all had :active. So on a phone nothing acknowledged the touch
   until the rebuild finished, which is the wait being complained about. */
console.log('THE TAP IS ACKNOWLEDGED BEFORE ANYTHING ELSE HAPPENS');
const CHIP = rule(/\.chip\{[^}]*\}/);
t('the chip has a pressed state', () =>
  /\.chip:not\(\.dead\):active\{/.test(css.replace(/\s+/g,''))
    ? true : 'a phone gets no feedback until the re-render lands');
t('a disabled chip is excluded from it', () =>
  /:not\(\.dead\):active/.test(css) ? true : 'an unavailable target would light up when pressed');
t('it does not wait on the 300ms tap delay', () =>
  /touch-action:manipulation/.test(CHIP) ? true : CHIP || 'rule missing');
t('every other interactive control still has one too', () => {
  const missing = ['.btn', '.stp button', '.ico', '.chip']
    .filter(sel => !new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '[^{]*:active') .test(css));
  return missing.length === 0 ? true : 'no pressed state: ' + missing.join(', ');
});
/* The transition on .chip had never run once. innerHTML='' destroys the node the
   transition would animate, and the replacement mounts already carrying .sel, so there
   was no state change to interpolate — the selection has always appeared instantly, or
   late, never smoothly. Marking the tapped node is what finally gives it something. */
t('the transition it declares has something to animate', () => {
  const c = grab('chip');
  return /classList\.toggle\('sel'\)/.test(c) && /transition:[^}]*background/.test(CHIP)
    ? true : 'the 150ms transition is still dead code: ' + c;
});
t('and marking it does not swallow the real handler', () => {
  const c = grab('chip');
  return /classList\.toggle\('sel'\); o\.on\(\)/.test(c)
    ? true : 'the optimistic mark replaced the behaviour instead of preceding it';
});
t('a chip with no handler is not made to look tappable', () => {
  const c = grab('chip');
  return /if \(!o\.dead && o\.on\)/.test(c) ? true : 'a display-only chip would toggle on tap';
});

t('the visible path leaves nothing pending behind it', () => {
  // both schedulers are armed on every call; the frame callback cancels the timer rather
  // than leaving it to wake and find the work done
  const fn = (js.match(/function measureBar\(\)\{[\s\S]*?\n\}/) || [''])[0];
  return /clearTimeout\(backstop\)/.test(fn)
    ? true : 'every render leaves a stray timer, which reads as a leak to the next person';
});

/* render() calls ambience() unconditionally, so with sound on every night-call tap issued
   a fresh linearRampToValueAtTime over 1.1 seconds — during a burst of tapping the rain
   never reached its target level. Audible, not merely wasteful, and the entire point of
   the rain is that it should be unremarkable. */
console.log('\nTHE RAIN IS NOT RESTARTED ON EVERY TAP');
const AMB = grab('ambience');
t('a request that matches the current state does nothing', () =>
  /if \(want === amWant\) return;/.test(AMB) ? true : 'every tap re-ramps the gain: ' + AMB);
t('the check happens before the ramp, not after it', () => {
  const iWant = AMB.indexOf('want === amWant'), iRamp = AMB.indexOf('linearRampToValueAtTime');
  return (iWant > 0 && iWant < iRamp) ? true : 'the guard is downstream of the thing it guards';
});
t('the request is normalised, or truthy and true would not compare equal', () =>
  /want = !!want;/.test(AMB) ? true : 'ambience(soundOn && G.phase === "night") passes a mixed type');
t('a failed AudioContext leaves the state retryable', () =>
  /catch\(e\)\{ AC = null; amWant = null;/.test(AMB)
    ? true : 'one failure would latch sound off for the whole game');
t('render still asks on every pass, so the guard is what does the work', () =>
  /ambience\(soundOn && G\.phase === 'night'\)/.test(grab('render'))
    ? true : 'the call moved out of render, which changes when the rain starts');

/* snap() stringifies the whole of G on every mutation and keeps eighty of them. The count
   alone did not bound that: G grows all game, so at a twenty-player table with a full
   chronicle the buffer is measured in megabytes on a phone that has been awake for an hour.
   Undo stays per-tap — that is what a mis-tap needs — but the buffer is bounded by bytes. */
console.log('\nTHE UNDO BUFFER IS BOUNDED BY SIZE, NOT ONLY BY COUNT');
const SNAP = grab('snap');
t('the byte cost of each snapshot is tracked', () =>
  /undoBytes \+= s\.length/.test(SNAP) ? true : SNAP);
t('the buffer is trimmed on both count and bytes', () =>
  /undoStack\.length > UNDO_MAX \|\| \(undoBytes > UNDO_BYTES/.test(SNAP) ? true : SNAP);
t('trimming keeps the accounting straight', () =>
  /undoBytes -= undoStack\.shift\(\)\.length/.test(SNAP)
    ? true : 'the counter would drift up until nothing could be pushed');
t('and so does undoing', () =>
  /undoBytes -= s\.length/.test(grab('undo'))
    ? true : 'popping without crediting the bytes back leaks the budget');
t('at least one snapshot always survives the trim', () =>
  /undoStack\.length > 1/.test(SNAP)
    ? true : 'one oversized state would empty the buffer and disable Undo entirely');
t('starting a new game resets the counter with the stack', () =>
  !/undoStack\.length = 0/.test(grab('rEnd')) && /clearUndo\(\)/.test(grab('rEnd'))
    ? true : 'the byte count would survive a game it no longer describes');
t('a mis-tap is still one Undo, not a whole phase', () => {
  // the fix for the buffer must not turn Undo into phase-granularity
  const taps = (js.match(/snap\(\);/g) || []).length;
  return taps >= 20 ? true : 'only ' + taps + ' snapshot points left; Undo now jumps phases';
});

/* openRoster() re-rendered the entire reversed log every time it opened AND every time a
   card was set inside it. The log only grows, so the roster got slower for the rest of the
   game — and the roster is what a moderator opens when they are already behind. */
console.log('\nTHE CHRONICLE IS NOT REBUILT WHOLE');
const ROS = grab('openRoster');
t('the visible chronicle is bounded', () =>
  /RECENT = \d+/.test(ROS) ? true : 'still renders every entry ever logged');
t('the rest is behind the collapsible the app already has', () =>
  /collapsible\('chronicle'/.test(ROS) ? true : 'the older entries are simply gone');
t('and they are built only if asked for', () =>
  /if \(!rest\.childElementCount\)/.test(ROS)
    ? true : 'the deferral is nominal: the rows are built whether opened or not');
t('a collapsible left open from a previous visit still fills', () =>
  /if \(more\.open\) fill\(\)/.test(ROS)
    ? true : 'reopening the roster would show an empty section, since no toggle fires');
t('the row builder is shared with the end screen, not duplicated', () => {
  const built = (js.match(/class="w">/g) || []).length;
  return built === 1 ? true : built + ' places build a log row; they will drift apart';
});

/* The two things saved on the same interaction. snap() captures G BEFORE the mutation, by
   design — that is what Undo returns to — so it is not the state to persist, and saveSoon
   cannot reuse its string. What makes the double serialise cheap is the debounce: a run of
   taps writes once, 400ms after the last one. */
console.log('\nSAVING IS DEBOUNCED RATHER THAN DEDUPLICATED');
t('the save is still debounced', () =>
  /clearTimeout\(saveTimer\)/.test(js) && /\}, 400\)/.test(js)
    ? true : 'a burst of taps would write to localStorage once per tap');
t('snap is called before the mutation, which is why its string cannot be reused', () => {
  // if this ever inverts, saveSoon could reuse the snapshot; today it would persist
  // the state as it was one tap ago
  const m = js.match(/function setCount\(id, v\)\{[\s\S]*?\n\}/)[0];
  return m.indexOf('snap();') < m.indexOf('G.counts[id] = v')
    ? true : 'snap now captures the post-mutation state; revisit reusing it for the save';
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
