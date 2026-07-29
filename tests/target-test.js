// Verifies the legal-target rules against the shipped targetPool().
// The pack must never be offered one of its own; the White Werewolf must be
// offered nothing else; and nobody may target themselves where the rules forbid it.
const fs = require('fs');
const src = ['../index.html','../css/app.css','../js/app.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

eval(src.match(/const ROLES = \[[\s\S]*?\n\];/)[0].replace('const ROLES','globalThis.ROLES'));
globalThis.R = {}; ROLES.forEach(r => R[r.id] = r);
globalThis.alive    = () => G.players.filter(p => p.alive);
globalThis.liveWith = id => G.players.filter(p => p.alive && p.role === id);
eval(src.match(/function teamOf\(p\)\{[\s\S]*?\n\}/)[0].replace('function teamOf','globalThis.teamOf = function'));
globalThis.isWolf = p => teamOf(p) === 'wolf';
eval(src.match(/function targetPool\(roleId\)\{[\s\S]*?\n\}/)[0].replace('function targetPool','globalThis.targetPool = function'));

function table(roles, extra){
  globalThis.G = Object.assign({ rules:'vn', houndSide:null,
    players: roles.map((r,i) => ({ id:'p'+i, name:(r||'??')+i, role:r, alive:true, turned:false })) }, extra||{});
  return G;
}
let pass = 0, fail = 0;
function t(name, fn){
  const r = fn();
  if (r === true){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + '  -> ' + r); }
}
const names = pool => pool.map(p => p.name).join(', ') || '(nobody)';

console.log('THE PACK');
t('werewolves are not offered each other', () => {
  table(['wolf','wolf','villager','seer','witch']);
  const pool = targetPool('wolf');
  return pool.every(p => !isWolf(p)) ? true : names(pool);
});
t('the pack is offered every non-wolf', () => {
  table(['wolf','wolf','villager','seer','witch']);
  return targetPool('wolf').length === 3 ? true : names(targetPool('wolf'));
});
t('a Wolf Hound that joined the pack is protected too', () => {
  table(['wolf','wolfhound','villager','seer'], { houndSide:'wolf' });
  const pool = targetPool('wolf');
  return !pool.some(p => p.role === 'wolfhound') ? true : names(pool);
});
t('a Wolf Hound that stayed a villager is still edible', () => {
  table(['wolf','wolfhound','villager','seer'], { houndSide:'village' });
  return targetPool('wolf').some(p => p.role === 'wolfhound') ? true : names(targetPool('wolf'));
});
t('a turned Wild Child is protected', () => {
  const g = table(['wolf','wildchild','villager','seer']);
  g.players[1].turned = true;
  return !targetPool('wolf').some(p => p.role === 'wildchild') ? true : names(targetPool('wolf'));
});
t('an unknown card stays on the menu, since it cannot be ruled out', () => {
  table(['wolf', null, 'villager']);
  return targetPool('wolf').some(p => p.role === null) ? true : names(targetPool('wolf'));
});

console.log('\nTHE WHITE WEREWOLF');
t('he is offered only werewolves', () => {
  table(['whitewolf','wolf','wolf','villager','seer']);
  const pool = targetPool('whitewolf');
  return pool.every(isWolf) && pool.length === 2 ? true : names(pool);
});
t('he is not offered himself', () => {
  table(['whitewolf','wolf','villager']);
  return !targetPool('whitewolf').some(p => p.role === 'whitewolf') ? true : names(targetPool('whitewolf'));
});
t('with no pack left he has nobody to eat', () => {
  table(['whitewolf','villager','seer']);
  return targetPool('whitewolf').length === 0 ? true : names(targetPool('whitewolf'));
});

console.log('\nSELF-TARGETING');
t('the Seer cannot look at her own card', () => {
  table(['seer','wolf','villager']);
  return !targetPool('seer').some(p => p.role === 'seer') ? true : names(targetPool('seer'));
});
t('the Piper cannot charm himself', () => {
  table(['piper','wolf','villager']);
  return !targetPool('piper').some(p => p.role === 'piper') ? true : names(targetPool('piper'));
});
t('the Wild Child cannot be his own model', () => {
  table(['wildchild','wolf','villager']);
  return !targetPool('wildchild').some(p => p.role === 'wildchild') ? true : names(targetPool('wildchild'));
});
t('the Bodyguard MAY shield himself', () => {
  table(['guard','wolf','villager']);
  return targetPool('guard').some(p => p.role === 'guard') ? true : names(targetPool('guard'));
});
t('Cupid MAY pair himself, as the rules allow', () => {
  table(['cupid','wolf','villager']);
  return targetPool('cupid').some(p => p.role === 'cupid') ? true : names(targetPool('cupid'));
});
t('the Fox may sniff his own trio', () => {
  table(['fox','wolf','villager']);
  return targetPool('fox').some(p => p.role === 'fox') ? true : names(targetPool('fox'));
});

console.log('\nTHE DEAD');
t('no pool ever contains a dead player', () => {
  const g = table(['wolf','villager','seer','witch','guard','piper','fox','cupid','wildchild','whitewolf']);
  g.players[1].alive = false; g.players[2].alive = false;
  for (const id of ['wolf','whitewolf','seer','piper','wildchild','guard','cupid','fox'])
    if (targetPool(id).some(p => !p.alive)) return id + ' offered a corpse';
  return true;
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
