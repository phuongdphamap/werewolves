// Player names are typed at the table and then concatenated into markup in about
// seventy places. They are made inert where they enter the app rather than escaped at
// every use, because one missed call site would still be an injection hole.
//
// eval below is the house pattern: the real shipped helper is pulled out of
// js/app.js and run, so a test cannot pass against a drifted copy.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

const line = src.match(/const safeName = [^\n]+/);
if (!line) throw new Error('safeName is gone — names would reach the DOM unfiltered');
eval(line[0].replace('const safeName', 'globalThis.safeName'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

console.log('A NAME CANNOT OPEN A TAG');
for (const payload of [
  '<img src=x onerror=alert(1)>',
  '<script>alert(1)</script>',
  '<svg/onload=alert(1)>',
  'An<br>Binh',
  '<<>>',
]) {
  t('inert: ' + payload, () => {
    const out = safeName(payload);
    return !/[<>]/.test(out) ? true : 'angle brackets survived: ' + out;
  });
}
t('a name made only of brackets collapses to empty, so addPlayer drops it', () =>
  safeName('<>') === '' ? true : 'got ' + JSON.stringify(safeName('<>')));

console.log('\nREAL NAMES ARE LEFT ALONE');
t('Vietnamese diacritics survive untouched', () =>
  safeName('Nguyễn Văn Phúc') === 'Nguyễn Văn Phúc' ? true : safeName('Nguyễn Văn Phúc'));
t('an apostrophe survives', () =>
  safeName("O'Brien") === "O'Brien" ? true : safeName("O'Brien"));
t('an ampersand survives — it cannot open a tag on its own', () =>
  safeName('Tom & Jerry') === 'Tom & Jerry' ? true : safeName('Tom & Jerry'));
t('quotes survive, since no name is placed in an attribute', () =>
  safeName('He said "hi"') === 'He said "hi"' ? true : safeName('He said "hi"'));

console.log('\nTHE EXISTING NORMALISATION STILL HAPPENS');
t('leading and trailing space is trimmed', () =>
  safeName('  An  ') === 'An' ? true : JSON.stringify(safeName('  An  ')));
t('runs of whitespace collapse', () =>
  safeName('An\t\t  Binh') === 'An Binh' ? true : JSON.stringify(safeName('An\t\t  Binh')));
t('only the brackets go — the text between them is still the typed name', () =>
  safeName('An <b> Binh') === 'An b Binh' ? true : JSON.stringify(safeName('An <b> Binh')));
t('stripping cannot leave a double space behind', () =>
  safeName('An <> Binh') === 'An Binh' ? true : JSON.stringify(safeName('An <> Binh')));
t('null and undefined are safe', () =>
  (safeName(null) === '' && safeName(undefined) === '') ? true : 'threw or returned junk');

console.log('\nIT IS APPLIED AT EVERY ENTRY POINT');
t('addPlayer sanitises what it is given', () =>
  /function addPlayer\(name\)\{\s*name = safeName\(name\)/.test(src)
    ? true : 'addPlayer no longer routes through safeName');
t('a resumed save is sanitised too', () =>
  /box\.g\.players\) p\.name = safeName\(p\.name\)/.test(src)
    ? true : 'loadSaved would restore a pre-fix payload straight into the DOM');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
