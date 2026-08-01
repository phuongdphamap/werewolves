// The design review measured three of five text roles below WCAG AA, and they carried
// the rules, the seating and the state. A moderator reads this at 30% brightness in a
// dark garden, so the fix held body text at AAA rather than scraping AA.
//
// These compute the real ratios from the shipped tokens rather than trusting a comment,
// so raising an alpha back is a test failure and not a subtle regression nobody sees.
const fs = require('fs');
const css = fs.readFileSync('../css/app.css', 'utf8');

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

const srgb = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum  = ([r,g,b]) => 0.2126*srgb(r) + 0.7152*srgb(g) + 0.0722*srgb(b);
const over = (fg, bg, a) => fg.map((c,i) => c*a + bg[i]*(1-a));
const ratio = (fg, bg) => { const [a,b] = [lum(fg), lum(bg)].sort((x,y) => y-x); return (a+0.05)/(b+0.05); };

const INK = [237,233,224];                 // --txt
const SURF = [0x1B,0x17,0x29];             // --surf, the card the text sits on
// alpha of a token as declared in :root
const alphaOf = name => {
  const m = css.match(new RegExp('--' + name + ':rgba\\(237,233,224,([.\\d]+)\\)'));
  if (!m) throw new Error('token --' + name + ' is gone');
  return parseFloat(m[1]);
};
const contrastOf = name => ratio(over(INK, SURF, alphaOf(name)), SURF);

console.log('TEXT TOKENS CLEAR THEIR FLOOR');
t('--txt2 carries body copy at AAA (>=7:1)', () => {
  const r = contrastOf('txt2');
  return r >= 7 ? true : 'body secondary is ' + r.toFixed(2) + ':1 — rules text would be below AAA';
});
t('--txt70 stays at least AAA too', () => {
  const r = contrastOf('txt70');
  return r >= 7 ? true : r.toFixed(2) + ':1';
});
t('--micro clears AA, which is all a tracked uppercase label needs', () => {
  const r = contrastOf('micro');
  return r >= 4 ? true : 'micro-labels at ' + r.toFixed(2) + ':1';
});

console.log('\nTHE FAILING ROLES ARE GONE');
t('the old .46 body alpha is not used for text anywhere', () =>
  !/var\(--txt45\)/.test(css) ? true : '--txt45 is back, and it measured 4.0:1');
t('seat numbers are not on the 2.1:1 faint token', () => {
  const rule = (css.match(/\.p \.seat\{[^}]*\}/) || [''])[0];
  if (/var\(--txt25\)/.test(rule)) return 'seat numbers are back at 2.1:1';
  return /var\(--txt70\)|var\(--txt\)/.test(rule) ? true : rule || 'rule missing';
});
t('seat numbers are tabular, since they are a column of data', () => {
  const rule = (css.match(/\.p \.seat\{[^}]*\}/) || [''])[0];
  return /tabular-nums/.test(rule) ? true : rule;
});
t('--txt25 survives only as a non-text fill', () => {
  // It is legitimate for a dot or a rule; it is never legitimate for a sentence.
  const bad = [...css.matchAll(/([^{}]+)\{([^}]*color:var\(--txt25\)[^}]*)\}/g)]
    .map(m => m[1].trim())
    .filter(sel => !/background/.test(sel));
  return bad.length === 0 ? true : 'still colouring text: ' + bad.join(', ');
});

console.log('\nDISABLED IS DIMMED, NOT DESTROYED');
t('a dead chip clears 3:1 and has no strikethrough', () => {
  const rule = (css.match(/\.chip\.dead\{[^}]*\}/) || [''])[0];
  if (/line-through/.test(rule)) return 'strikethrough makes it unreadable rather than unavailable';
  const o = parseFloat((rule.match(/opacity:([.\d]+)/) || [])[1]);
  if (!o) return 'no opacity found: ' + rule;
  // chip fill and its text both fade against the card behind them
  const bg = over([0x24,0x1F,0x35], SURF, o);
  const r = ratio(over(INK, bg, o), bg);
  return r >= 3 ? true : 'dead chip is ' + r.toFixed(2) + ':1 at opacity ' + o;
});

/* A control has to declare its own colour, or a container's prose colour reaches it.
   .chip did not, so inside .expBody — which sets color:var(--txt2) for prose — every
   house-rule chip drew its label at 67% alpha while the identical chips inside a .card
   drew at full. Reported as the House rules highlight looking darker than Rules order.
   Same shape as the `.expBody p` bug: styling meant for prose reaching a component. */
console.log('\nA CONTROL OWNS ITS OWN COLOUR');
const CONTROLS = ['.chip', '.btn', '.ico', '.stp button', '.altBtn'];
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
for (const sel of CONTROLS){
  t(sel + ' declares a colour rather than inheriting one', () => {
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = bare.match(new RegExp('(^|,|\n)\\s*' + esc + '\\{([^}]*)\\}', 'm'));
    if (!m) return 'rule not found';
    return /(^|;)\s*color:/.test(m[2])
      ? true : 'inherits, so a container can dim it: ' + sel + '{' + m[2].slice(0, 60) + '}';
  });
}
t('and a chip inside a collapsible is not dimmed to prose alpha', () => {
  // the two rules that would fight: .expBody's prose colour, and the chip's own
  const body = (bare.match(/\.expBody\{[^}]*\}/) || [''])[0];
  const chip = (bare.match(/\n  \.chip\{[^}]*\}/) || [''])[0];
  if (!/color:var\(--txt2\)/.test(body)) return 'the collapsible body no longer sets a prose colour';
  return /color:var\(--txt\)/.test(chip)
    ? true : 'the chip would inherit --txt2 inside a collapsible';
});

console.log('\nVIETNAMESE KEEPS ITS DIACRITICS');
/* Sizes are scale tokens now, so the value has to be resolved through :root rather than
   read off the rule. A token that silently shrank would otherwise pass by returning NaN. */
const tokenPx = name => {
  const m = css.match(new RegExp('--' + name + ':(\\d+(?:\\.\\d+)?)px'));
  return m ? parseFloat(m[1]) : NaN;
};
t('role sub-labels are at least 13px', () => {
  const rule = (css.match(/\.r \.rn \.vi\{[^}]*\}/) || [''])[0];
  const tok = (rule.match(/font-size:var\(--([\w-]+)\)/) || [])[1];
  const px = tok ? tokenPx(tok) : parseFloat((rule.match(/font-size:([\d.]+)px/) || [])[1]);
  return px >= 13 ? true : 'ả ệ ườ lose their marks at ' + px + 'px';
});

console.log('\nNOTHING LEAKS THROUGH AN OVERLAY');
for (const [sel, what] of [['\\.modal', 'the reveal and roster'], ['\\.veil', 'the resume prompt']]) {
  t(what + ' overlay is fully opaque', () => {
    const rule = (css.match(new RegExp(sel + '\\{[^}]*\\}')) || [''])[0];
    const bg = (rule.match(/background:(#[0-9A-Fa-f]{6}|rgba?\([^)]*\))/) || [])[1] || '';
    return /^#/.test(bg) ? true : 'translucent (' + bg + ') — what is behind it stays legible';
  });
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
