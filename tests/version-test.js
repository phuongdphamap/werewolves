// The app now reports which build it is serving. Cache-first delivery means a phone
// can be several releases behind, so a bug report without this is unactionable.
//
// eval below is the house pattern: the real shipped function is pulled out of
// js/app.js and run against stubs, so a test cannot pass against a drifted copy.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');
/* showVersion() speaks the interface language now. English, so the assertions below read
   as the string a moderator on an English device would see. */
globalThis.T = (vi, en) => en;

function grab(name){
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('not found: ' + name);
  const j = src.indexOf('{', i);
  let d = 0, k = j;
  while (k < src.length){
    if (src[k] === '{') d++;
    else if (src[k] === '}'){ d--; if (!d) break; }
    k++;
  }
  return src.slice(i, k + 1);
}
eval(grab('showVersion').replace('function showVersion', 'globalThis.showVersion = function'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

// Stand in for the one element the function writes to.
const out = { textContent: '' };
globalThis.$ = id => (id === 'rosVer' ? out : null);

// keys: array of cache names, or 'no-api' to remove Cache Storage, or 'reject'
const withCaches = (keys) => {
  out.textContent = '';
  if (keys === 'no-api'){ globalThis.window = {}; globalThis.caches = undefined; return; }
  globalThis.window = { caches: {} };
  globalThis.caches = { keys: () => keys === 'reject'
    ? Promise.reject(new Error('storage denied')) : Promise.resolve(keys) };
};

async function main(){
  console.log('IT REPORTS THE BUILD BEING SERVED');

  withCaches(['mh-v0.2.1-shell', 'mh-fonts-v1']);
  showVersion(); await new Promise(r => setImmediate(r));
  t('the shell cache name becomes a readable version', () =>
    out.textContent === 'Version v0.2.1' ? true : 'got ' + JSON.stringify(out.textContent));

  withCaches(['mh-fonts-v1']);
  showVersion(); await new Promise(r => setImmediate(r));
  t('the fonts cache is not mistaken for a version', () =>
    /not cached yet/.test(out.textContent) ? true : 'got ' + JSON.stringify(out.textContent));

  withCaches(['some-other-app-v9', 'workbox-precache']);
  showVersion(); await new Promise(r => setImmediate(r));
  t('another app on the origin is not mistaken for a version', () =>
    /not cached yet/.test(out.textContent) ? true : 'got ' + JSON.stringify(out.textContent));

  // Cache Storage is shared across every project on phuongdphamap.github.io, so a
  // neighbour naming its cache "<something>-shell" must not be read as our version.
  withCaches(['other-app-v3-shell', 'blog-v2-shell']);
  showVersion(); await new Promise(r => setImmediate(r));
  t('a neighbour app using a -shell cache is ignored', () =>
    /not cached yet/.test(out.textContent) ? true : 'read a neighbour as ours: ' +
      JSON.stringify(out.textContent));

  withCaches(['mh-v1.10.0-shell']);
  showVersion(); await new Promise(r => setImmediate(r));
  t('a two-digit minor survives the parse', () =>
    out.textContent === 'Version v1.10.0' ? true : 'got ' + JSON.stringify(out.textContent));

  console.log('\nIT DEGRADES INSTEAD OF THROWING');

  withCaches('no-api');
  showVersion();
  t('no Cache Storage says so rather than breaking the Roster', () =>
    /no cache storage/i.test(out.textContent) ? true : 'got ' + JSON.stringify(out.textContent));

  withCaches('reject');
  showVersion(); await new Promise(r => setImmediate(r));
  t('a denied storage read is caught', () =>
    /unknown/i.test(out.textContent) ? true : 'got ' + JSON.stringify(out.textContent));

  globalThis.$ = () => null;
  t('a missing element is a no-op, not a crash', () => {
    showVersion(); return true;
  });

  console.log('\nIT IS ACTUALLY WIRED UP');
  t('the Roster has somewhere to show it', () =>
    /id="rosVer"/.test(src) ? true : 'no #rosVer in the markup');
  t('opening the Roster refreshes it', () =>
    /showVersion\(\);[\s\S]{0,60}\$\('mRoster'\)/.test(src)
      ? true : 'openRoster does not call showVersion');

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}
main();
