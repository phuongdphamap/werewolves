// The app is deployed as a static file, so the deployment layer is the manifest,
// the service worker and crash recovery. Each has a failure mode that only shows up
// in the field, so they are checked here.
const fs = require('fs');
const D = '../';
const src = ['index.html','css/app.css','js/app.js'].map(f => fs.readFileSync(D + f,'utf8')).join('\n');
const sw  = fs.readFileSync(D + 'sw.js','utf8');
const man = JSON.parse(fs.readFileSync(D + 'manifest.webmanifest','utf8'));

let pass = 0, fail = 0;
const t = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'threw ' + e.message; }
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); } };

console.log('IT CAN BE INSTALLED');
t('the manifest is linked', () => /<link rel="manifest" href="\.\/manifest\.webmanifest">/.test(src) ? true : 'not linked');
t('it declares a name and a short name', () =>
  (man.name && man.short_name && man.short_name.length <= 12) ? true : 'short_name too long for a home screen');
t('it opens without browser chrome', () => man.display === 'standalone' ? true : man.display);
t('start_url and scope are relative, so any subpath works', () =>
  (man.start_url === './' && man.scope === './') ? true : man.start_url + ' / ' + man.scope);
t('the theme colour matches the app background', () =>
  man.theme_color === '#0C0A12' && /content="#0C0A12"/.test(src) ? true : 'theme colour disagrees with the page');
t('a maskable icon is supplied, or Android will letterbox it', () =>
  man.icons.some(i => i.purpose === 'maskable') ? true : 'no maskable icon');
t('every icon file the manifest names actually exists', () => {
  const missing = man.icons.map(i => i.src.replace('./','')).filter(f => !fs.existsSync(D + f));
  return missing.length === 0 ? true : 'missing: ' + missing.join(', ');
});
t('iOS gets its own touch icon and standalone hints', () =>
  /apple-touch-icon/.test(src) && /apple-mobile-web-app-capable/.test(src)
    ? true : 'iOS would use a screenshot and show browser chrome');
t('the language is declared for a Vietnamese-first app', () =>
  man.lang === 'vi' ? true : 'lang=' + man.lang);

console.log('\nIT WORKS WITH NO SIGNAL');
t('a worker is registered', () => /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/.test(src) ? true : 'not registered');
t('registration failure cannot break the app', () =>
  /register\('\.\/sw\.js'\)\.catch\(\(\) => \{\}\)/.test(src) ? true : 'an unsupported browser would throw');
t('the cache name carries a version', () => /const VERSION = '[^']+'/.test(sw) ? true : 'no version, updates would never land');
t('old caches are deleted on activate', () =>
  /caches\.keys\(\)/.test(sw) && /caches\.delete\(k\)/.test(sw) ? true : 'storage would grow forever');
t('one missing file cannot abandon the whole precache', () =>
  /c\.add\(u\)\.catch\(\(\) => \{\}\)/.test(sw)
    ? true : 'addAll would fail the install and leave no offline support at all');
t('the shell is served cache-first, so it opens offline and instantly', () =>
  /const hit = await c\.match\(req, \{ ignoreSearch: true \}\)/.test(sw) && /if \(hit\)\{ network; return hit; \}/.test(sw)
    ? true : 'not cache-first');
t('but it still refreshes in the background', () =>
  /fetch\(req\)\.then\(res => \{[\s\S]*?c\.put\(req, res\.clone\(\)\)/.test(sw)
    ? true : 'users would be stuck on the first version they ever loaded');
t('fonts are cached separately and kept across versions', () =>
  /const FONTS/.test(sw) && /keep = new Set\(\[SHELL, FONTS\]\)/.test(sw)
    ? true : 'fonts would be refetched on every release');
t('a navigation with an empty cache still gets the shell', () =>
  /req\.mode === 'navigate'/.test(sw) ? true : 'a cold offline start would fail');
t('only GET is intercepted', () => /req\.method !== 'GET'/.test(sw) ? true : 'would break any future POST');
t('cross-origin requests other than fonts are left alone', () =>
  /url\.origin !== location\.origin\) return;/.test(sw) ? true : 'would cache third parties');

console.log('\nA RELOAD DOES NOT DESTROY A GAME IN PROGRESS');
t('state is persisted', () => /localStorage\.setItem\(SAVE_KEY/.test(src) ? true : 'nothing is saved');
t('every persistence call is guarded', () => {
  const calls = src.match(/localStorage\.(setItem|getItem|removeItem)/g) || [];
  const guards = src.match(/try \{[\s\S]*?localStorage[\s\S]*?catch/g) || [];
  return (calls.length > 0 && guards.length >= 3)
    ? true : calls.length + ' calls but only ' + guards.length + ' try blocks';
});
t('saving is debounced rather than run on every keystroke', () =>
  /clearTimeout\(saveTimer\)/.test(src) && /setTimeout\(/.test(src) ? true : 'would write on every render');
t('it saves from render, which is always a settled state', () =>
  /function render\(\)\{\s*\n\s*saveSoon\(\);/.test(src) ? true : 'save is not hooked to render');
t('a finished or unstarted game is not offered as a resume', () =>
  /G\.phase === 'players' \|\| G\.phase === 'end'\) localStorage\.removeItem/.test(src)
    ? true : 'would offer to resume the setup screen');
t('a stale save expires rather than resurfacing days later', () =>
  /12 \* 3600 \* 1000/.test(src) ? true : 'yesterday\u2019s game would be offered');
t('a corrupt save cannot stop the app booting', () =>
  /catch \(e\)\{ return null; \}/.test(src) ? true : 'a bad JSON blob would throw on load');
t('the prompt says what will be resumed', () =>
  /' người \\u00b7 ' \+ when/.test(src) ? true : 'no context for the decision');
t('declining clears the save, so it is not asked again', () =>
  /no\.onclick  = \(\) => \{ dropSaved\(\)/.test(src) ? true : 'would nag on every reload');

console.log('\nTHE PROMPT IS ATTACHED AND STYLED');
t('it attaches to a node that exists', () => {
  if (/getElementById\('app'\)/.test(src)) return 'appends to #app, which this document does not have';
  return /document\.body\.appendChild\(v\)/.test(src) ? true : 'no parent';
});
for (const sel of ['.veil{', '.veil.on{', '.veil .kicker{', '.veil p.dim{', '.veil .go{', '.btn.ghost{']){
  t(sel + ' is styled', () => src.includes(sel) ? true : 'rule missing');
}

console.log('\nNO BUILD STEP WAS INTRODUCED');
// The app is three local files, not one — but still no bundler, no npm, and no
// script it does not ship itself.
t('every script and stylesheet is a local relative path', () => {
  const refs = [...src.matchAll(/(?:script[^>]+src|link[^>]+href)="([^"]+)"/g)].map(m => m[1]);
  const bad = refs.filter(u => !u.startsWith('./') && !/fonts\.(googleapis|gstatic)\.com/.test(u));
  return bad.length === 0 ? true : 'non-local asset: ' + bad.join(', ');
});
t('no module system was introduced', () => {
  const js = fs.readFileSync(D + 'js/app.js', 'utf8');
  return !/\brequire\(|\bfrom ['"][^.\/]|\bexport\s/.test(js)
    ? true : 'an external module crept in';
});
t('no framework runtime was added', () => {
  // "next" appears legitimately in button labels and infectNext, so look for the
  // things a framework actually leaves behind rather than for its name
  // document.createElement is plain DOM; React's is namespaced
  const marks = [/\bReactDOM\b/, /React\.createElement/, /__NEXT_DATA__/, /\bVue\.createApp\b/,
                 /from ['"](react|vue|next|nuxt)/, /cdn\S*\/(react|vue|next|nuxt)/i];
  const hit = marks.filter(re => re.test(src));
  return hit.length === 0 ? true : 'framework artefact: ' + hit[0];
});
t('the only network dependency is the font stylesheet', () => {
  const ext = [...src.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
  const bad = ext.filter(u => !/fonts\.(googleapis|gstatic)\.com/.test(u));
  return bad.length === 0 ? true : 'also depends on ' + bad.join(', ');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
