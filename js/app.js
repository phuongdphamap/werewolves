(() => {
"use strict";

/* ==========================================================================
   ROLES.  n1 = position in the first-night roll call.  every = recurring wake
   order on later nights.  Roles with no n1 action are still called on night one
   so the moderator learns who they are.
========================================================================== */
const ROLES = [
 {id:'villager',ic:'🌾',name:'Simple Villager',vi:'Dân làng',team:'village',set:'Base',max:24,
  d:'No power. Never wakes. Assigned automatically to whoever is left after the roll call.'},
 {id:'thief',ic:'🃏',name:'Thief',vi:'Ăn trộm',team:'village',set:'Base',max:1,n1:10,
  d:'Two extra cards are dealt. On the first night he may swap his card for one of them. If both spares are Werewolves he must take one.',
  say:'Thief, wake up. Here are the two spare cards. Take one, or keep your own.',
  sayVi:'Ăn trộm thức dậy. Đây là hai lá bài còn lại. Đổi một lá, hoặc giữ lá của mình.',special:'thief'},
 {id:'cupid',ic:'💘',name:'Cupid',vi:'Thần Tình Yêu',team:'village',set:'Base',max:1,n1:20,
  d:'On the first night, designates two Lovers. If one dies the other dies of grief. A mixed pair wins alone together.',
  say:'Cupid, wake up and point to the two people you are joining in love.',
  sayVi:'Thần Tình Yêu thức dậy và chỉ vào hai người mà bạn muốn nối tình yêu.',pick:2},
 {id:'judge',ic:'⚖️',name:'Stuttering Judge',vi:'Quan Toà Nói Lắp',team:'village',set:'Characters',max:1,n1:24,
  d:'Once per game, by a secret sign agreed with the moderator, he forces a second vote the same day.',
  say:'Stuttering Judge, wake up and show me the sign you will use to demand a second vote.',
  sayVi:'Quan Toà Nói Lắp thức dậy và ra dấu hiệu bí mật để yêu cầu vòng bầu thứ hai.'},
 {id:'wolfhound',ic:'🐕',name:'The Wolf Hound',vi:'Sói Chó',team:'village',set:'Characters',max:1,n1:30,
  d:'On the first night, secretly chooses to be a Villager or a Werewolf for the whole game.',
  say:'Wolf Hound, wake up. Choose your side now: villager, or werewolf.',
  sayVi:'Sói Chó thức dậy. Chọn phe của mình ngay bây giờ: dân làng, hay ma sói.',special:'hound'},
 {id:'wildchild',ic:'🐾',name:'The Wild Child',vi:'Đứa Trẻ Hoang',team:'village',set:'Characters',max:1,n1:34,
  d:'Chooses a model on the first night. If the model ever dies, he becomes a werewolf.',
  say:'Wild Child, wake up and choose the player who will be your model.',
  sayVi:'Đứa Trẻ Hoang thức dậy và chọn một người làm hình mẫu của mình.',pick:1,special:'model'},
 {id:'sisters',ic:'👭',name:'The Two Sisters',vi:'Hai Chị Em',team:'village',set:'Characters',min:2,max:2,exact:2,n1:40,every:42,
  d:'Wake together to learn each other, and may wake briefly each night to confer in silence.',
  say:'Two Sisters, wake up and look at one another.',
  sayVi:'Hai Chị Em thức dậy và nhìn mặt nhau.'},
 {id:'brothers',ic:'👬',name:'The Three Brothers',vi:'Ba Anh Em',team:'village',set:'Characters',min:3,max:3,exact:3,n1:44,every:46,
  d:'Wake together to learn each other, and may wake briefly each night to confer in silence.',
  say:'Three Brothers, wake up and look at one another.',
  sayVi:'Ba Anh Em thức dậy và nhìn mặt nhau.'},
 {id:'guard',ic:'🛡️',name:'Bodyguard',vi:'Bảo Vệ',team:'village',set:'Base',only:'vn',max:1,n1:47,every:47,
  d:'Each night protects one player. If the werewolves attack that player, nobody dies. He may not protect the same person on two nights in a row. Standard in Vietnamese play; not in the original Miller’s Hollow box.',
  say:'Bodyguard, wake up and choose one person to shield tonight.',
  sayVi:'Bảo Vệ thức dậy và chọn một người để che chở đêm nay.',pick:1,special:'guard'},
 {id:'littlegirl',ic:'👀',name:'Little Girl',vi:'Bé Gái',team:'village',set:'Base',max:1,n1:48,
  d:'May peek through her fingers while the werewolves are awake, at her own risk.',
  say:'Little Girl, show yourself to me only, then close your eyes.',
  sayVi:'Bé Gái cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'fox',ic:'🦊',name:'The Fox',vi:'Cáo',team:'village',set:'Characters',max:1,n1:50,every:50,
  d:'Each night sniffs a player and their two living neighbours. If no werewolf is among them, he loses his power.',
  say:'Fox, wake up. Point to a player and I will tell you whether a werewolf hides among them and their neighbours.',
  sayVi:'Cáo thức dậy. Chỉ vào một người, tôi sẽ cho biết trong ba người đó có sói hay không.',pick:1,special:'fox'},
 {id:'actor',ic:'🎭',name:'The Actor',vi:'Diễn Viên',team:'village',set:'Characters',max:1,n1:52,every:52,
  d:'Three character cards are placed face up. Each night he may use one of them, once each.',
  say:'Actor, wake up. Choose which of your three characters you play tonight.',
  sayVi:'Diễn Viên thức dậy. Chọn nhân vật bạn sẽ dùng đêm nay.'},
 {id:'seer',ic:'🔮',name:'Seer',vi:'Tiên Tri',team:'village',set:'Base',max:1,n1:55,every:55,
  d:'Each night, looks at one player. In the original rules she sees the exact card; in Vietnamese play she learns only whether they are on the werewolf side.',
  say:'Seer, wake up. Point to the player whose true nature you wish to see.',
  sayVi:'Tiên Tri thức dậy. Chỉ vào người mà bạn muốn soi.',pick:1},
 {id:'wolf',ic:'🐺',name:'Werewolf',vi:'Ma Sói',team:'wolf',set:'Base',max:8,n1:60,every:60,
  d:'Wakes each night with the pack and agrees on one victim.',
  say:'Werewolves, wake up. Recognise each other, and choose your victim.',
  sayVi:'Ma Sói thức dậy. Nhìn nhau nhận đồng đội, và chọn nạn nhân đêm nay.',pick:1},
 {id:'whitewolf',ic:'❄️',name:'White Werewolf',vi:'Sói Trắng',team:'wolf',set:'Characters',max:1,n1:65,every:65,alt:true,
  d:'Wakes with the pack, then again every second night to devour a werewolf. Wins alone.',
  say:'White Werewolf, wake up. You may devour one of your own. Point, or shake your head.',
  sayVi:'Sói Trắng thức dậy. Bạn có thể ăn một con sói. Hãy chỉ, hoặc lắc đầu.',pick:1},
 {id:'witch',ic:'🧪',name:'Witch',vi:'Phù Thuỷ',team:'village',set:'Base',max:1,n1:70,every:70,
  d:'One healing potion and one poison, each usable once in the whole game.',
  say:'Witch, wake up. This is the victim. Will you save them? Will you poison anyone?',
  sayVi:'Phù Thuỷ thức dậy. Đây là nạn nhân đêm nay. Bạn có cứu không? Có dùng thuốc độc không?',special:'witch'},
 {id:'piper',ic:'🎵',name:'The Pied Piper',vi:'Người Thổi Sáo',team:'solo',set:'Characters',max:1,n1:80,every:80,
  d:'Charms two players each night. Wins alone the moment every other living player is charmed.',
  say:'Pied Piper, wake up and charm two players.',
  sayVi:'Người Thổi Sáo thức dậy và mê hoặc hai người.',pick:2,special:'charm'},
 {id:'hunter',ic:'🏹',name:'Hunter',vi:'Thợ Săn',team:'village',set:'Base',max:1,n1:82,
  d:'When he dies he must immediately shoot one living player — the shot is compulsory, not a choice. Vietnamese play denies him the shot if the Witch poisoned him; Miller’s Hollow lets him fire whatever killed him.',
  say:'Hunter, show yourself to me only, then close your eyes.',
  sayVi:'Thợ Săn cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'elder',ic:'⏳',name:'The Elder',vi:'Trưởng Lão',team:'village',set:'Characters',max:1,n1:84,
  d:'Survives the first werewolf attack. If the village eliminates him, every villager loses their power.',
  say:'Elder, show yourself to me only, then close your eyes.',
  sayVi:'Trưởng Lão cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'knight',ic:'🗡️',name:'Knight with the Rusty Sword',vi:'Hiệp Sĩ Kiếm Rỉ',team:'village',set:'Characters',max:1,n1:86,
  d:'When the werewolves kill him, the first werewolf clockwise from him dies of infection the next night.',
  say:'Knight, show yourself to me only, then close your eyes.',
  sayVi:'Hiệp Sĩ Kiếm Rỉ cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'beartamer',ic:'🐻',name:'Bear Tamer',vi:'Người Dạy Gấu',team:'village',set:'Characters',max:1,n1:88,
  d:'Each dawn the moderator growls if either living neighbour is a werewolf.',
  say:'Bear Tamer, show yourself to me only, then close your eyes.',
  sayVi:'Người Dạy Gấu cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'angel',ic:'😇',name:'The Angel',vi:'Thiên Thần',team:'solo',set:'Characters',max:1,n1:90,
  d:'Wins immediately and alone if eliminated on the first day\u2019s vote, or taken on the first night.',
  say:'Angel, show yourself to me only, then close your eyes.',
  sayVi:'Thiên Thần cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'idiot',ic:'🤪',name:'Village Idiot',vi:'Thằng Ngốc',team:'village',set:'Characters',max:1,n1:92,
  d:'If voted out he is revealed and spared, but loses the right to vote forever.',
  say:'Village Idiot, show yourself to me only, then close your eyes.',
  sayVi:'Thằng Ngốc cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'scapegoat',ic:'🐐',name:'Scapegoat',vi:'Vật Tế Thần',team:'village',set:'Characters',max:1,n1:94,
  d:'If the village vote ties, he dies instead \u2014 and as he goes he decides who may vote tomorrow.',
  say:'Scapegoat, show yourself to me only, then close your eyes.',
  sayVi:'Vật Tế Thần cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'servant',ic:'🧹',name:'Devoted Servant',vi:'Người Hầu Trung Thành',team:'village',set:'Characters',max:1,n1:96,
  d:'Before an eliminated player\u2019s card is revealed, she may show her own and take their role instead.',
  say:'Devoted Servant, show yourself to me only, then close your eyes.',
  sayVi:'Người Hầu Trung Thành cho tôi thấy mặt, rồi nhắm mắt lại.'},
];
const R = {}; ROLES.forEach(r => R[r.id] = r);
const TEAM_NAME = { village:'Village', wolf:'Werewolves', solo:'Alone' };
// One icon per role. It appears on a player the moment you learn their card, so
// the roster reads at a glance: who is the Bảo Vệ, who is the Tiên Tri, who is a Sói.
// One icon per role, read straight off the role table so there is a single
// source of truth. It follows the CARD: assign a role and the icon appears,
// correct a role and the icon changes with it.
const icOf  = id => (R[id] && R[id].ic) || '';
const pIcon = p => p.role ? icOf(p.role) : '<i>?</i>';
// The Vietnamese public order differs from the French original in one place:
// the Seer is called AFTER the pack, and she learns only wolf-or-not.
// Everything else in the quoted order matches: Ăn trộm, Cupid, Cặp đôi,
// Bảo vệ, Ma Sói, Tiên tri, Phù thuỷ.
/* The Vietnamese order's principle is that the information roles are called after
   the pack. That applies to the Fox exactly as it does to the Seer: both are asleep
   while the wolves choose, and wolf membership cannot change mid-night (the Hound
   picks at 30, and every death resolves at dawn), so moving them is neutral for the
   players and means the moderator already knows the pack when they must answer. */
const RULESETS = { vn:{ label:'Ma Sói Việt Nam', over:{ fox:61, seer:62 } },
                  mh:{ label:'Miller’s Hollow (bản gốc)', over:{} } };
const over = id => RULESETS[G && G.rules ? G.rules : 'vn'].over[id];
const n1Of    = r => over(r.id) != null ? over(r.id) : r.n1;
const everyOf = r => r.every == null ? null : (over(r.id) != null ? over(r.id) : r.every);
const ord = () => ROLES.slice().filter(r => n1Of(r) != null).sort((a,b) => n1Of(a) - n1Of(b));

/* recommended decks by table size */
const REC_BASE = ['seer','witch','guard','hunter','cupid','littlegirl','thief'];
// Expansion cards are pulled forward, otherwise a small table never reaches one
// before the villager floor stops the list, and this preset becomes a copy of Classic.
const REC_CHAR = ['seer','witch','guard','elder','fox','hunter','beartamer','cupid',
                  'knight','littlegirl','idiot','judge','scapegoat','sisters','wildchild'];
function recWolves(n){ return n < 8 ? 1 : n <= 11 ? 2 : n <= 15 ? 3 : n <= 18 ? 4 : n <= 22 ? 5 : 6; }
/* Weighted pool for a shuffled deck: [weight, smallest table it may appear at].
   Commonplace cards are heavy, oddities are light and only turn up at big tables. */
const SHUF = {
  witch:[6,6], guard:[6,7], hunter:[5,7], cupid:[4,8], littlegirl:[4,8], thief:[2,9],
  elder:[4,8], fox:[3,9], beartamer:[3,9], wolfhound:[2,9], knight:[3,10], idiot:[3,10],
  wildchild:[2,10], judge:[2,11], scapegoat:[2,11], sisters:[2,11], angel:[1,11],
  whitewolf:[1,11], servant:[1,12], piper:[1,12], actor:[1,13], brothers:[1,14],
};
// at most one card from each of these groups, or the game turns into soup
const EXCL = [['piper','angel','whitewolf'], ['sisters','brothers']];

function shuffleDeck(n, chars){
  const c = { wolf: recWolves(n), seer: 1 };        // a deck with no Seer is not a game
  if (G.rules === 'vn' && n >= 8) c.guard = 1;      // Bảo Vệ is core in Vietnamese play
  let used = Object.values(c).reduce((a,b) => a+b, 0);
  // vary how special-heavy the deck is, so two shuffles never feel the same
  const minV = Math.max(2, Math.round(n * 0.24));
  const maxV = Math.max(minV, Math.round(n * 0.40));
  const keepV = minV + Math.floor(Math.random() * (maxV - minV + 1));

  const bag = [];
  for (const id in SHUF){
    if (c[id]) continue;
    if (!chars && R[id].set !== 'Base') continue;   // Classic draws from the base box only
    if (R[id].only && R[id].only !== G.rules) continue;   // e.g. no Bodyguard under Miller’s Hollow
    const [w, min] = SHUF[id];
    if (n < min) continue;
    for (let k = 0; k < w; k++) bag.push(id);
  }
  const drop = id => { for (let k = bag.length-1; k >= 0; k--) if (bag[k] === id) bag.splice(k,1); };
  let guard = 0;
  while (bag.length && guard++ < 500){
    const id = bag[(Math.random()*bag.length)|0];
    drop(id);
    // The bag only decides the order cards are offered. This roll decides whether
    // one actually turns up, so weight means frequency: common cards most games,
    // oddities now and then.
    if (Math.random() > SHUF[id][0] / 7) continue;
    if (id === 'whitewolf'){
      // The White Werewolf IS a werewolf. He takes a seat in the pack rather than
      // enlarging it, or the deck ends up with one wolf more than the table wants.
      if ((c.wolf || 0) <= 1) continue;
      c.wolf--; c[id] = 1;                          // total wolves unchanged
      for (const g of EXCL) if (g.includes(id)) g.forEach(drop);
      continue;
    }
    const add = R[id].exact || 1;
    if (used + add + keepV > n) continue;           // would not leave enough villagers
    c[id] = add; used += add;
    for (const g of EXCL) if (g.includes(id)) g.forEach(drop);
  }
  if (n - used > 0) c.villager = n - used;
  return c;
}

function recommend(n, chars){
  const c = { wolf: recWolves(n) };
  let used = c.wolf;
  const floor = Math.max(2, Math.round(n * 0.28));
  for (const id of (chars ? REC_CHAR : REC_BASE)){
    if (R[id].only && R[id].only !== G.rules) continue;  // a card the chosen ruleset does not have
    const add = R[id].exact || 1;
    if (used + add + floor > n) continue;
    c[id] = add; used += add;
  }
  if (n - used > 0) c.villager = n - used;
  return c;
}

/* ========================== state ========================== */
let G = null;
const undoStack = [];
function blank(){
  return { players:[], counts:{}, night:0, day:0, phase:'players', log:[],
    steps:[], si:0, n:{}, dawn:[], pending:{},
    witchHeal:true, witchPoison:true, foxPower:true, elderLife:true,
    powersLost:false, judgeUsed:false, houndSide:null, sheriffDone:false,
    infectNext:null, over:null, scapegoatVoters:null, assignTo:null, knewDeal:false, rules:'vn', lastGuard:null,
    selfHeal:null, hunterPoison:null, resume:'night', votes:{}, sheriffVote:null, showAllRoles:false, scope:'chars', dawnWhy:[], dawnSure:true, dawnEdit:false };
}
G = blank();
function snap(){ undoStack.push(JSON.stringify(G)); if (undoStack.length > 80) undoStack.shift(); }

/* A phone locks, the tab is evicted, the browser reloads — and a game in progress
   would be gone with fifteen people waiting. The whole state is small and already
   JSON-serialisable for Undo, so it is cheap to keep a copy. Guarded because some
   embedded viewers deny storage access, and losing recovery is far better than
   throwing on load. */
const SAVE_KEY = 'mh.game.v1';
let saveTimer = null;
function saveSoon(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!G || G.phase === 'players' || G.phase === 'end') localStorage.removeItem(SAVE_KEY);
      else localStorage.setItem(SAVE_KEY, JSON.stringify({ at: Date.now(), g: G }));
    } catch (e){ /* storage unavailable; carry on without recovery */ }
  }, 400);
}
function loadSaved(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const box = JSON.parse(raw);
    if (!box || !box.g || !box.g.players || !box.g.players.length) return null;
    if (Date.now() - box.at > 12 * 3600 * 1000) return null;   // yesterday's game is not a resume
    return box;
  } catch (e){ return null; }
}
function dropSaved(){ try { localStorage.removeItem(SAVE_KEY); } catch (e){} }
function undo(){ if (!undoStack.length) return; G = JSON.parse(undoStack.pop()); render(); }

const alive = () => G.players.filter(p => p.alive);
const byId = id => G.players.find(p => p.id === id);
const roleOf = p => (p.role && R[p.role]) || null;
function teamOf(p){
  if (!p.role) return 'none';
  if (p.role === 'wolfhound') return G.houndSide === 'wolf' ? 'wolf' : 'village';
  if (p.role === 'wildchild' && p.turned) return 'wolf';
  return R[p.role].team;
}
const isWolf = p => teamOf(p) === 'wolf';
// The app must never infer a role it has not been told. Anything it computes
// from cards has to check this first, or it will answer confidently and wrongly.
// The badge is a title, not a card. Miller’s Hollow weights it at a flat double;
// Vietnamese and 狼人杀 tables usually use 1.5 so it cannot outvote two people alone.
const SHERIFF_WEIGHT = () => G.rules === 'vn' ? '1.5 votes' : '2 votes';

/* Two points the traditions genuinely disagree on, and that tables argue about.
   null means "follow whichever ruleset is selected"; true or false is a deliberate
   house ruling that survives switching ruleset. */
const witchMaySaveSelf   = () => G.selfHeal     == null ? G.rules !== 'vn' : G.selfHeal;
const hunterFiresPoisoned = () => G.hunterPoison == null ? G.rules !== 'vn' : G.hunterPoison;
const fmtN = n => (Math.round(n * 100) / 100).toString();

/* Nerd Font glyphs: U+F074 for shuffle, U+F0AD4 for the music toggle. Both are
   Private Use Area, so they only draw where such a font is installed. We ask the
   canvas whether the glyph actually resolved and fall back to a plain Unicode
   symbol when it did not, rather than showing an empty box at the table. */
const NF = { shuffle:'\uf074', music:'\udb82\uded4' };
const FB = { shuffle:'\uD83D\uDD00', music:'\u266a' };
const nerd = (() => {
  try {
    const c = document.createElement('canvas').getContext('2d');
    c.font = '32px monospace';
    const plain = c.measureText(NF.shuffle).width;
    c.font = '32px "Symbols Nerd Font Mono","Symbols Nerd Font","Hack Nerd Font",' +
             '"JetBrainsMono Nerd Font","FiraCode Nerd Font","Iosevka Nerd Font",monospace';
    const styled = c.measureText(NF.shuffle).width;
    return styled > 0 && Math.abs(styled - plain) > 0.5;
  } catch (e){ return false; }
})();
const icon = k => '<span class="nf">' + (nerd ? NF[k] : FB[k]) + '</span>';
// Who actually holds a vote today, and what the whole table is worth.
function votePower(p){ return p.sheriff ? (G.rules === 'vn' ? 1.5 : 2) : 1; }
function eligibleVoters(){
  let list = alive().filter(p => !p.voteless);
  if (G.scapegoatVoters) list = list.filter(p => G.scapegoatVoters.includes(p.id));
  return list;
}
function totalPower(){ return eligibleVoters().reduce((a,p) => a + votePower(p), 0); }

/* Who a role may legally point at. The pack never devours its own kind; the
   White Werewolf devours nothing else. Several roles cannot target themselves.
   Where a card is still unknown the app cannot filter, and says so rather than
   pretending the list is complete. */
function targetPool(roleId){
  const A = alive();
  const mine = liveWith(roleId);
  const isSelf = p => mine.some(m => m.id === p.id);
  switch (roleId){
    case 'wolf':      return A.filter(p => !isWolf(p));
    case 'whitewolf': return A.filter(p => isWolf(p) && !isSelf(p));
    case 'seer':      return A.filter(p => !isSelf(p));
    case 'piper':     return A.filter(p => !isSelf(p));
    case 'wildchild': return A.filter(p => !isSelf(p));
    default:          return A;
  }
}
function targetNote(roleId){
  switch (roleId){
    case 'wolf':      return 'The pack cannot devour one of its own, so known werewolves are not listed.';
    case 'whitewolf': return 'He devours only his own kind, so only werewolves are listed.';
    case 'seer':      return 'She already knows her own card, so she is not listed.';
    case 'piper':     return 'He wins when every other living player is charmed, so he is not listed.';
    case 'wildchild': return 'He cannot be his own model.';
    case 'guard':     return 'He may shield himself, but never the same person twice running.';
    default:          return '';
  }
}
function noteSkip(id){ if (!id || id === '__lovers') return;
  G.n.skipped = G.n.skipped || []; if (!G.n.skipped.includes(id)) G.n.skipped.push(id); }
// Does this card do anything on the first night beyond identifying itself?
// If the deal was collected up front, the identification-only cards need no call.
const acts1 = r => !!(r.pick || r.special || r.every || r.id === 'judge');
const liveWith = id => G.players.filter(p => p.alive && p.role === id);
const withRole = id => G.players.filter(p => p.role === id);
const unassigned = () => G.players.filter(p => !p.role);
function label(){
  if (G.phase === 'night' || G.phase === 'dawn') return 'Night ' + G.night;
  if (G.phase === 'day' || G.phase === 'hunter' || G.phase === 'sheriff' || G.phase === 'scapegoat') return 'Day ' + G.day;
  return 'Setup';
}
function log(t, when){ G.log.push({ w: when || label(), t }); }
function neighbours(p){
  const n = G.players.length, i = G.players.findIndex(x => x.id === p.id), out = [];
  for (const dir of [-1, 1]) for (let k = 1; k < n; k++){
    const q = G.players[(i + dir*k + n*2) % n];
    if (q.alive && q.id !== p.id){ out.push(q); break; }
  }
  return out;
}
function clockwiseWolfFrom(p){
  const n = G.players.length, i = G.players.findIndex(x => x.id === p.id);
  for (let k = 1; k <= n; k++){
    const q = G.players[(i + k) % n];
    if (q.alive && isWolf(q) && q.id !== p.id) return q;
  }
  return null;
}

/* ========================== setup ========================== */
function addPlayer(name){
  name = (name || '').trim().replace(/\s+/g, ' ');
  if (!name) return;
  if (G.players.some(p => p.name.toLowerCase() === name.toLowerCase())){
    let n = 2;
    while (G.players.some(p => p.name.toLowerCase() === (name+' '+n).toLowerCase())) n++;
    name = name + ' ' + n;
  }
  snap();
  G.players.push({ id:'p'+Date.now()+Math.random().toString(36).slice(2,5), name,
    role:null, alive:true, cause:null, sheriff:false, lover:false, charmed:false,
    voteless:false, model:false, turned:false, revealed:false });
  render();
}
const totalCards = () => Object.values(G.counts).reduce((a,b)=>a+b,0);
function wolfCards(){ let n=0; for (const k in G.counts) if (R[k].team==='wolf') n += G.counts[k]; return n; }
function setCount(id, v){
  const r = R[id];
  if (r.exact && v > 0) v = r.exact;
  v = Math.max(0, Math.min(r.max || 24, v));
  snap();
  if (v === 0) delete G.counts[id]; else G.counts[id] = v;
  render();
}
function checks(){
  const seats = G.players.length, cards = totalCards(), out = [];
  if (seats < 6) out.push(['warn','Miller’s Hollow needs at least 6 players. Eight or more plays much better.']);
  if (cards !== seats) out.push(['no', cards < seats
    ? (seats-cards) + ' more card' + (seats-cards>1?'s':'') + ' needed to cover every seat.'
    : (cards-seats) + ' card' + (cards-seats>1?'s':'') + ' too many for this table.']);
  const w = wolfCards(), rec = recWolves(seats);
  if (cards === seats && w === 0) out.push(['no','There are no werewolves in the deck.']);
  else if (cards === seats && seats >= 6 && w !== rec)
    out.push(['warn','With ' + seats + ' players, ' + rec + ' ' + (rec > 1 ? 'werewolves' : 'werewolf') + ' is the usual balance. You have ' + w + '.']);
  for (const id in G.counts) if (R[id].only && R[id].only !== G.rules)
    out.push(['warn', R[id].name + ' (' + R[id].vi + ') is not in the ' + RULESETS[G.rules].label +
      ' box. Keep it if your table plays that way \u2014 the suggested deck and the shuffle leave it out.']);
  if (G.counts.thief) out.push(['warn','The Thief needs two extra cards beyond the number of players. Pull them from the box and keep them aside.']);
  if (G.counts.cupid && seats < 4) out.push(['no','Cupid needs at least 4 players.']);
  if (G.counts.whitewolf && !G.counts.wolf) out.push(['warn','The White Werewolf has no pack to hunt with.']);
  if (G.counts.sisters && G.counts.sisters !== 2) out.push(['no','The Two Sisters must be exactly two.']);
  if (G.counts.brothers && G.counts.brothers !== 3) out.push(['no','The Three Brothers must be exactly three.']);
  if (cards === seats && !out.some(o => o[0]==='no'))
    out.push(['ok','Deck is ready: ' + cards + ' cards for ' + seats + ' players.']);
  return out;
}

/* ========================== night scripting ========================== */
function buildNight(){
  const steps = [];
  if (G.night === 1){
    // roll call: every card in the deck except plain villagers, in call order
    for (const r of ord()){
      if (r.id === 'villager' || !G.counts[r.id]) continue;
      if (G.knewDeal && !acts1(r)) continue;
      steps.push({ role:r.id, roll: !G.knewDeal });
      if (r.id === 'cupid') steps.push({ role:'__lovers' });
    }
  } else {
    for (const r of ord()){
      if (r.every == null) continue;
      if (!liveWith(r.id).length) continue;
      if (r.id === 'witch' && !G.witchHeal && !G.witchPoison) continue;
      if (r.id === 'fox' && !G.foxPower) continue;
      if (G.powersLost && r.team === 'village') continue;
      if (r.alt && G.night % 2 !== 0) continue;
      steps.push({ role:r.id });
    }
    steps.sort((a,b) => everyOf(R[a.role]) - everyOf(R[b.role]));
  }
  G.steps = steps; G.si = 0; G.n = {};
}
function stepInfo(s){
  if (s.role === '__lovers') return { name:'The Lovers', vi:'Cặp Đôi', ic:'💞', id:'__lovers',
    d:'The two Lovers learn who they are.',
    say:'Lovers, wake up and look at one another. You now win or lose together.',
    sayVi:'Cặp Đôi thức dậy và nhìn mặt nhau. Từ giờ hai người thắng hoặc chết cùng nhau.' };
  return R[s.role];
}

/* ========================== resolution ========================== */
function kill(p, cause){
  if (!p || !p.alive) return [];
  p.alive = false; p.cause = cause;
  const chain = [{ p, cause }];
  if (p.lover) for (const q of G.players) if (q.alive && q.lover) chain.push(...kill(q, 'grief'));
  if (p.model){
    const wc = G.players.find(x => x.role === 'wildchild' && x.alive);
    if (wc && !wc.turned){ wc.turned = true; log(wc.name + ' has become a werewolf \u2014 their model is dead.'); }
  }
  return chain;
}
/* The rules decide the night, not the moderator. This works the outcome out from
   what was recorded and keeps a plain-language trail so it can be trusted at a
   glance. It only declares itself unsure when a step really was missed. */
function computeDawn(){
  const out = [], why = [];
  const add = (id, cause) => { if (id && !out.some(o => o.id === id)) out.push({ id, cause, on:true }); };
  const nm = id => { const q = byId(id); return q ? q.name : '?'; };

  if (G.n.wolf){
    const v = byId(G.n.wolf);
    if (v && v.alive){
      why.push('The pack chose <b>' + v.name + '</b>.');
      if (G.n.guard === G.n.wolf){
        why.push('The Bodyguard was shielding ' + v.name + ' \u2014 the attack fails.');
        if (G.n.witchSave) why.push('The Witch also drank for ' + v.name + '. Both protected the same person \u2014 apply your house rule if you use one.');
      } else if (G.n.witchSave){
        why.push('The Witch spent her cure on ' + v.name + ' \u2014 the attack fails.');
      } else if (v.role === 'elder' && G.elderLife){
        G.elderLife = false;
        why.push('But ' + v.name + ' is the Elder. His second life absorbs it, and is now spent.');
      } else {
        add(G.n.wolf, 'werewolves');
      }
    }
  }
  if (G.n.witchKill){ add(G.n.witchKill, 'the Witch\u2019s poison'); why.push('The Witch poisoned <b>' + nm(G.n.witchKill) + '</b>.'); }
  if (G.n.white){ add(G.n.white, 'the White Werewolf'); why.push('The White Werewolf devoured <b>' + nm(G.n.white) + '</b>.'); }
  if (G.infectNext){ add(G.infectNext, 'the Knight\u2019s rust'); why.push('The Knight\u2019s rust reached <b>' + nm(G.infectNext) + '</b>.'); }

  // grief is a consequence of the rules, so name it here rather than let it surprise anyone
  for (const d of out.slice()){
    const q0 = byId(d.id);
    if (q0 && q0.lover) for (const q of G.players)
      if (q.alive && q.lover && q.id !== q0.id && !out.some(o => o.id === q.id)){
        add(q.id, 'grief');
        why.push('<b>' + q.name + '</b> is their Lover and dies of grief.');
      }
  }

  // the only honest reasons to ask the moderator anything
  const gaps = [];
  const sk = G.n.skipped || [];
  if (G.counts.wolf && !G.n.wolf && !sk.includes('wolf')) gaps.push('the pack never named a victim');
  if (sk.length) gaps.push('skipped tonight: ' + sk.map(id => R[id] ? R[id].vi : id).join(', '));
  const unplacedRules = ['elder','knight'].filter(id => (G.counts[id] || 0) > withRole(id).length);
  if (unplacedRules.length) gaps.push('the ' + unplacedRules.map(id => R[id].vi).join(' and ') +
    ' card is not placed, so that rule may not have applied');
  G.dawn = out; G.dawnWhy = why; G.dawnSure = gaps.length === 0; G.dawnGaps = gaps;
  G.dawnEdit = false;
}
/* A death can interrupt the flow: the Hunter fires, a dying Sheriff hands on the
   badge. Both can happen at night as well as by daylight, so the queue records
   them and `proceed` returns to wherever we were. */
function registerDeaths(chain){
  for (const c of chain){
    log(c.p.name + ' died \u2014 ' + (c.cause === 'grief' ? 'of grief' : c.cause) + '.');
    if (c.p.role === 'hunter' && !G.pending.hunterId){
      // Vietnamese play (and 狼人杀 before it) holds that poison leaves no time to
      // aim: the Hunter fires when eaten or hanged, but not when poisoned.
      // Miller’s Hollow says he fires whatever the cause.
      if (!hunterFiresPoisoned() && /poison/.test(c.cause)){
        log(c.p.name + ' was the Hunter, but the poison gave no time to aim \u2014 no shot. ' +
            'Change that under House rules if your table plays otherwise.');
      } else {
        G.pending.hunterId = c.p.id;
        G.pending.hunterCause = c.cause;
      }
    }
    if (c.p.sheriff) G.pending.badge = true;
  }
}
function proceed(){
  const w = checkWin(); if (w) return finish(w);
  if (G.pending.hunterId){ G.phase = 'hunter'; render(); return; }
  if (G.pending.badge){ G.phase = 'sheriff'; render(); return; }
  if (G.resume === 'day'){ G.phase = 'day'; G.day = G.night; render(); return; }
  toNight();
}

function applyDawn(){
  snap();
  G.lastGuard = G.n.guard || null;      // may not shield the same person twice running
  G.infectNext = null;
  let knightDied = null;
  for (const d of G.dawn){
    if (!d.on) continue;
    const p = byId(d.id);
    if (!p || !p.alive) continue;
    if (p.role === 'knight' && d.cause === 'werewolves') knightDied = p;
    registerDeaths(kill(p, d.cause));
  }
  if (knightDied){
    const w = clockwiseWolfFrom(knightDied);
    if (w){ G.infectNext = w.id; log('The rust will take ' + w.name + ' tomorrow night.'); }
    if (!wolfSideKnown()) log('Not every wolf card is placed, so confirm the rust target against the real deal.');
  }
  if (!G.dawn.some(d => d.on)) log('Nobody died in the night.');
  if (G.night === 1){
    const ang = G.players.find(p => p.role === 'angel' && !p.alive);
    if (ang) return finish({ who:'The Angel', why: ang.name + ' wanted exactly this and got it before the first dawn.' });
  }
  G.votes = {}; G.sheriffVote = null;
  G.resume = 'day';
  proceed();
}
function checkWin(){
  const a = alive();
  if (!a.length) return { who:'Nobody', why:'Every soul in Miller’s Hollow is dead.' };
  // Counting the two sides needs only the wolf cards placed — not every villager
  // identified. Demanding the latter froze results for whole games.
  if (!wolfSideKnown()) return null;
  const lovers = a.filter(p => p.lover);
  if (a.length === 2 && lovers.length === 2)
    return { who:'The Lovers', why: lovers.map(p=>p.name).join(' and ') + ' are the last two alive and they belong to each other.' };
  const piper = a.find(p => p.role === 'piper');
  if (piper && a.length > 1 && a.every(p => p.role === 'piper' || p.charmed))
    return { who:'The Pied Piper', why: piper.name + ' has charmed every living soul.' };
  const ww = a.find(p => p.role === 'whitewolf');
  if (ww && a.length === 1) return { who:'The White Werewolf', why: ww.name + ' stands alone.' };
  const wolves = a.filter(isWolf), others = a.filter(p => !isWolf(p));
  if (!wolves.length) return { who:'The Village', why:'Not one werewolf is left breathing.' };
  // Once the pack matches the village it can no longer be outvoted, so the game
  // is already decided and there is no point grinding out the last few nights.
  // Vietnamese play ends it there; Miller’s Hollow makes them finish the job.
  const parity = G.rules === 'vn' && wolves.length >= others.length;
  if (!others.length || parity){
    if (ww && wolves.length > 1) return null;      // the White Werewolf still wants to be alone
    return { who:'The Werewolves', why: others.length
      ? 'The pack is ' + wolves.length + ' against ' + others.length + '. They can no longer be outvoted.'
      : 'No villagers remain.' };
  }
  return null;
}
function finish(w){ G.over = w; G.phase = 'end'; log(w.who + ' win. ' + w.why); render(); }

/* ==========================================================================
   Night ambience. A moderator who must read a card at the table leaks three
   things: the sound of the card, the direction of the sound, and their own
   footsteps. Low continuous rain covers all three. Generated, so there is no
   audio file to ship and it works offline.
========================================================================== */
let soundOn = false, AC = null, amGain = null;
function ambience(want){
  if (want && !AC){
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const len = Math.floor(AC.sampleRate * 2.5);
      const buf = AC.createBuffer(1, len, AC.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++){                 // brown-ish noise reads as rain
        const w = Math.random()*2 - 1;
        last = (last + 0.02*w) / 1.02;
        d[i] = last * 3.2;
      }
      const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
      const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 130;
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 900; lp.Q.value = 0.4;
      amGain = AC.createGain(); amGain.gain.value = 0;
      src.connect(hp); hp.connect(lp); lp.connect(amGain); amGain.connect(AC.destination);
      const lfo = AC.createOscillator(); lfo.frequency.value = 0.07;   // slow swell, like wind
      const lg = AC.createGain(); lg.gain.value = 260;
      lfo.connect(lg); lg.connect(lp.frequency);
      src.start(); lfo.start();
    } catch(e){ AC = null; return; }
  }
  if (!AC || !amGain) return;
  if (AC.state === 'suspended' && want) AC.resume();
  amGain.gain.linearRampToValueAtTime(want ? 0.11 : 0, AC.currentTime + (want ? 1.1 : 0.6));
}

/* ========================== render helpers ========================== */
const $ = id => document.getElementById(id);
const el = (t, c, h) => { const e = document.createElement(t);
  if (t === 'button') e.type = 'button';
  if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
function show(id){
  ['sPlayers','sRoles','sDeal','sLearn','sNight','sDawn','sDay','sEnd']
    .forEach(s => $(s).classList.toggle('on', s === id));
}
function chip(p, o){
  o = o || {};
  const c = el('div', 'chip' + (o.sel ? ' sel' : '') + (o.dead ? ' dead' : ''));
  c.innerHTML = '<span class="ic">' + pIcon(p) + '</span>' + p.name +
    '<span class="dot t-' + teamOf(p) + '"></span>' +
    (o.badge ? '<span class="bd">' + o.badge + '</span>' : '');
  if (!o.dead && o.on) c.onclick = o.on;
  return c;
}
function playerRow(p, i, onTap){
  const d = el('div', 'p' + (p.alive ? '' : ' dead'));
  d.innerHTML = (i != null ? '<span class="seat">' + (i+1) + '</span>' : '') +
    '<span class="ic">' + pIcon(p) + '</span>' +
    '<span class="dot t-' + teamOf(p) + '"></span>' +
    '<span class="nm">' + p.name + '</span>' +
    '<span class="rl">' + (p.role ? R[p.role].name : 'unknown') + '</span>';
  const tags = [];
  if (p.sheriff) tags.push('<span class="tag s">Sheriff</span>');
  if (p.lover) tags.push('<span class="tag l">Lover</span>');
  if (p.charmed) tags.push('<span class="tag c">Charmed</span>');
  if (p.voteless) tags.push('<span class="tag">No vote</span>');
  if (p.model) tags.push('<span class="tag">Model</span>');
  if (p.turned) tags.push('<span class="tag">Turned</span>');
  if (!p.alive) tags.push('<span class="tag">' + (p.cause || 'dead') + '</span>');
  if (tags.length) d.appendChild(el('div','tags', tags.join('')));
  if (onTap){ d.style.cursor = 'pointer'; d.onclick = onTap; }
  return d;
}
/* Long guidance is worth having but not worth surrendering the screen to. These
   fold away by default and remember whether you opened them, so a moderator who
   already knows the routine never scrolls past an essay. */
const expOpen = new Set();
function collapsible(key, title, body){
  const d = document.createElement('details');
  d.className = 'exp';
  d.open = expOpen.has(key);
  const s = document.createElement('summary');
  s.innerHTML = title;
  d.appendChild(s);
  // a body may be markup or a live node; innerHTML on a node would stringify it
  const b = el('div','expBody');
  if (typeof body === 'string') b.innerHTML = body;
  else if (body) b.appendChild(body);
  d.appendChild(b);
  d.addEventListener('toggle', () => { d.open ? expOpen.add(key) : expOpen.delete(key); });
  return d;
}

/* Buttons used to size to their text, leaving dead space at the end of the bar.
   The primary action now takes the room that is left; a secondary sits at its
   natural width beside it. When every option is secondary they share the row
   evenly, so the bar is always filled and the main action is always the widest. */
function bar(items){
  const b = $('bar'); b.innerHTML = '';
  const list = items.filter(Boolean);
  const hasPrimary = list.some(it => !it.sec);
  for (const it of list){
    const btn = el('button', 'btn' + (it.sec ? ' sec' : ''), it.t);
    // `wide` is honoured rather than ignored, so no caller option is a silent no-op
    btn.style.flex = it.wide ? '1 1 100%'
      : (!hasPrimary || !it.sec) ? '1 1 auto' : '0 1 auto';
    btn.disabled = !!it.off; btn.onclick = it.on;
    b.appendChild(btn);
  }
}
function render(){
  saveSoon();
  $('bUndo').disabled = !undoStack.length;
  ambience(soundOn && G.phase === 'night');
  $('hTtl').textContent = G.over ? 'Game over' : 'Miller’s Hollow';
  $('hPh').textContent = { players:'Seats', roles:'Deck', deal:'Deal the cards', learn:'Collect the deal',
    night: G.night === 1 ? 'First night \u00b7 roll call' : 'Night ' + G.night,
    dawn:'Dawn ' + G.night, day:'Day ' + G.day, hunter:'Day ' + G.day,
    sheriff:'Day ' + G.day, scapegoat:'Day ' + G.day, end:'Result' }[G.phase] || 'Moderator';
  const views = { players:rPlayers, roles:rRoles, deal:rDeal, learn:rLearn, night:rNight, dawn:rDawn,
    day:rDay, end:rEnd, hunter:renderHunter, sheriff:renderSheriff, scapegoat:renderScapegoat };
  (views[G.phase] || rPlayers)();
}

/* ---- seats ---- */
function rPlayers(){
  show('sPlayers');
  const n = G.players.length;
  $('pCount').innerHTML = n
    ? '<b>' + n + '</b> seated. The usual balance is <b>' + recWolves(n) + '</b> ' + (recWolves(n) > 1 ? 'werewolves' : 'werewolf') + '.'
    : 'Nobody yet. Six is the minimum; eight or more plays best.';
  const L = $('lPlayers'); L.innerHTML = '';
  G.players.forEach((p, i) => {
    const row = el('div','p');
    row.innerHTML = '<span class="seat">' + (i+1) + '</span><span class="nm">' + p.name + '</span>';
    const x = el('button','ico quiet','Remove');
    x.onclick = () => { snap(); G.players.splice(i,1); render(); };
    row.appendChild(x); L.appendChild(row);
  });
  bar([{ t:'Build the deck \u2192', off:n < 4, wide:true, on:() => { snap();
    if (!totalCards()) G.counts = recommend(n, true);
    G.phase='roles'; render(); } }]);
}

/* ---- deck ---- */
function rRoles(){
  show('sRoles');
  const n = G.players.length;
  $('tCards').textContent = totalCards();
  $('tSeats').textContent = n;
  $('tWolves').textContent = wolfCards();

  const RB = $('recBox'); RB.innerHTML = '';
  const pc = el('div','card');
  pc.appendChild(el('div','grp','Thứ tự luật \u00b7 Rules order'));
  const pr = el('div','chips');
  for (const k of ['vn','mh']){
    const b = el('div','chip' + (G.rules===k ? ' sel' : ''), RULESETS[k].label);
    b.onclick = () => { snap(); G.rules = k; render(); };
    pr.appendChild(b);
  }
  pc.appendChild(pr);
  const rec2 = ord().filter(r => everyOf(r) != null && G.counts[r.id]);
  const one  = ord().filter(r => G.counts[r.id] && r.id !== 'villager');
  pc.appendChild(el('p','note',
    '<b>Đêm đầu tiên:</b> ' + (one.length ? one.map(r => r.vi).join(' \u2192 ') : '\u2014') +
    '<br><b>Các đêm sau:</b> ' + (rec2.length ? rec2.map(r => r.vi).join(' \u2192 ') : '\u2014')));
  RB.appendChild(pc);
  RB.appendChild(collapsible('house', 'Luật nhà \u00b7 house rules',
    houseRulesUI()));
  RB.appendChild(collapsible('order', 'Hai bộ luật khác nhau ở đâu?',
    (G.rules === 'vn'
      ? '<p>Tiên Tri và Cáo được gọi <b>sau</b> Ma Sói, nên app đã biết cả bầy Sói và trả lời được ngay trên màn hình.</p>' +
        '<p>Bảo Vệ có trong bộ cơ bản. Phù Thuỷ không được tự cứu. Thợ Săn bị thuốc độc thì không bắn được. ' +
        'Sói bằng số Dân là Sói thắng luôn. Phù hiệu Trưởng Làng nặng 1.5 phiếu.</p>'
      : '<p>The Seer and the Fox are called <b>before</b> the pack, and the Seer sees the exact card. ' +
        'On the first night that can mean reading a card at the table.</p>' +
        '<p>No Bodyguard in the original box. The Witch may save herself. The Hunter fires whatever killed ' +
        'him. The wolves must finish every villager to win. The badge is worth a flat double vote.</p>')));
  const rec = el('div','card');
  // Classic / Characters is a SCOPE, not an action. Both buttons below obey it,
  // which is why tapping the words themselves never dealt a new deck.
  rec.appendChild(el('div','grp','Phạm vi bài \u00b7 which box'));
  const chars = G.scope !== 'base';
  const sc2 = el('div','chips');
  for (const [k, lab] of [['base','Cơ bản \u00b7 Classic'], ['chars','Mở rộng \u00b7 Characters']]){
    const b = el('div','chip' + ((k === 'chars') === chars ? ' sel' : ''), lab);
    b.onclick = () => { snap(); G.scope = k; render(); };
    sc2.appendChild(b);
  }
  rec.appendChild(sc2);
  const reach = chars ? Object.keys(SHUF).filter(id =>
    R[id].set === 'Characters' && n >= SHUF[id][1]).map(id => R[id].vi) : [];
  rec.appendChild(el('div','grp','Bộ bài cho ' + n + ' người'));
  const rr = el('div','row'); rr.style.flexWrap = 'wrap';
  const bS = el('button','btn sm', icon('shuffle') + 'Xáo bộ mới \u00b7 Shuffle');
  bS.onclick = () => { snap(); G.counts = shuffleDeck(n, chars); render(); };
  const bR = el('button','btn sm sec','Bộ đề xuất \u00b7 Suggested');
  bR.onclick = () => { snap(); G.counts = recommend(n, chars); render(); };
  rr.append(bS, bR); rec.appendChild(rr);
  const specials = Object.keys(G.counts).filter(k => k !== 'villager' && k !== 'wolf');
  rec.appendChild(el('p','note', specials.length
    ? '<b>Bộ hiện tại:</b> ' + R.wolf.vi + ' \u00d7' + (G.counts.wolf||0) + ', ' +
      specials.map(k => (G.rules==='vn' ? R[k].vi : R[k].name) + (G.counts[k] > 1 ? ' \u00d7' + G.counts[k] : '')).join(', ') +
      (G.counts.villager ? ', ' + R.villager.vi + ' \u00d7' + G.counts.villager : '')
    : 'Chưa chọn lá nào.'));
  RB.appendChild(rec);
  RB.appendChild(collapsible('deckhow', 'Hai nút này khác nhau thế nào?',
    '<p><b>Xáo bộ mới</b> cho một bộ khác mỗi lần bấm. <b>Bộ đề xuất</b> luôn cho cùng một bộ. ' +
    'Cả hai đều lấy trong phạm vi bạn chọn ở trên.</p>' +
    (chars ? (reach.length
      ? '<p>Ở bàn ' + n + ' người, lá mở rộng có thể ra: ' + reach.join(', ') + '.</p>'
      : '<p>Bàn ' + n + ' người quá nhỏ để lá mở rộng nào lọt vào \u2014 xáo sẽ ra bộ cơ bản.</p>')
      : '<p>Chỉ lấy lá trong hộp cơ bản.</p>')));

  const A = $('advice'); A.innerHTML = '';
  const cs = checks();
  for (const [k, t] of cs) A.appendChild(el('div','alert' + (k==='ok'?' ok':k==='no'?' no':''), t));

  const L = $('lRoles'); L.innerHTML = '';
  // Two sections, always. Build them by filtering the set, never by watching for
  // a change while walking the array — ROLES is ordered by night-call order, so
  // the sets interleave and a change-watcher emits the header ten times.
  // A chosen card lifts out of the catalogue into its own zone at the top, so the
  // deck is readable at a glance instead of being scattered through 25 rows.
  const rank = { wolf:0, village:1, solo:2 };
  const byTeam = (a,b) => rank[a.team] - rank[b.team];   // a picking list: wolves first
  // The deck zone is a preview of the night, so it follows the call order for the
  // chosen ruleset. Cards that are never called (the plain Villager) sit at the end.
  const byCall = (a,b) => (n1Of(a) == null ? 9999 : n1Of(a)) - (n1Of(b) == null ? 9999 : n1Of(b));
  const inDeck = ROLES.filter(r => G.counts[r.id]).sort(byCall);
  const spare  = ROLES.filter(r => !G.counts[r.id]);

  L.appendChild(el('div','grp', 'Trong bộ \u00b7 in your deck \u00b7 ' +
    totalCards() + ' of ' + n + ' cards \u00b7 thứ tự gọi'));
  // the legend belongs directly under the heading it explains, not orphaned above it
  L.appendChild(el('div','legend',
    '<i><b style="background:rgba(111,179,166,.7)"></b>cơ bản</i>' +
    '<i><b style="background:rgba(224,169,76,.8)"></b>mở rộng</i>'));
  if (inDeck.length) for (const r of inDeck) L.appendChild(roleRow(r, true));
  else L.appendChild(el('div','card tight',
    'Chưa chọn lá nào. Bấm <b>+</b> ở danh sách bên dưới, hoặc dùng <b>Xáo bộ mới</b>.'));

  const SETS = [['Base','Base game'], ['Characters','Characters expansion']];
  for (const [setKey, setLabel] of SETS){
    const list = spare.filter(r => r.set === setKey).sort(byTeam);
    if (!list.length) continue;                 // every card from this box is in the deck
    L.appendChild(el('div','grp', setLabel + ' \u00b7 ' + list.length + ' còn lại'));
    for (const r of list) L.appendChild(roleRow(r));
  }
  function roleRow(r, chosen){
    const c = G.counts[r.id] || 0;
    const off = r.only && r.only !== G.rules;
    const row = el('div','r set-' + r.set + (off ? ' off' : '') + (c ? ' act' : '') +
      (chosen ? ' picked' : ''));
    const info = el('div','info',
      '<div class="rn"><span class="ic">' + icOf(r.id) + '</span><span class="dot t-'+r.team+'"></span>' +
        (G.rules==='vn' ? r.vi : r.name) +
        '<span class="vi">' + (G.rules==='vn' ? r.name : r.vi) + '</span>' +
        (off ? '<span class="tag">not in this box</span>' : '') + '</div>' +
      '<div class="rd">' + r.d + '</div>');
    info.onclick = () => row.classList.toggle('open');
    const stp = el('div','stp');
    const minus = el('button',null,'\u2212'); minus.disabled = !c;
    minus.onclick = () => setCount(r.id, r.exact ? 0 : c-1);
    const plus = el('button',null,'+'); plus.disabled = c >= (r.max||24);
    plus.onclick = () => setCount(r.id, r.exact ? r.exact : c+1);
    stp.append(minus, el('span','n', String(c)), plus);
    row.append(info, stp);
    return row;
  }
  const ready = totalCards() === n && wolfCards() > 0 && !cs.some(o => o[0]==='no');
  bar([{ t:'Back', sec:true, on:() => { snap(); G.phase='players'; render(); } },
       { t:'Deal the cards \u2192', off:!ready, on:() => { snap(); G.phase='deal'; render(); } }]);
}

/* ---- physical deal ---- */
function rDeal(){
  show('sDeal');
  const L = $('dealList'); L.innerHTML = '';
  for (const r of ROLES){
    const c = G.counts[r.id]; if (!c) continue;
    const row = el('div','dl set-' + r.set);
    row.innerHTML = '<span class="q">' + c + '</span><span class="ic">' + icOf(r.id) +
      '</span><span class="nn">' + (G.rules==='vn' ? r.vi + ' \u00b7 ' + r.name : r.name) + '</span>' +
      '<span class="dot t-' + r.team + '"></span>';
    L.appendChild(row);
  }
  const mh = G.rules === 'mh';
  // Only what you must do right now stays open. The reasoning folds away.
  $('dealNote').innerHTML =
    'Shuffle these <b>' + totalCards() + '</b> cards and deal one face down to each of the <b>' +
    G.players.length + '</b> players.' +
    (G.counts.thief ? ' Keep the <b>two extra cards</b> for the Thief aside.' : '') +
    '<br><br>Then choose whether to learn the deal now, or stay blind and find out during the night.';
  bar([{ t:'Back', sec:true, on:() => { snap(); G.phase='roles'; render(); } },
       { t:'Collect the deal \u2192', on:() => { snap(); G.phase='learn'; render(); } }]);
  // must live in a container that gets cleared, or every visit appends another
  const A = $('dealAlt'); A.innerHTML = '';
  A.appendChild(collapsible('deal', 'Which route should I take?',
    (mh
      ? '<p><b>You are on the Miller’s Hollow order, so the Seer sees the exact card.</b> ' +
        'Every look needs a specific card read out. Collect the deal now and the app can show her any ' +
        'card on screen; skip it and you will be reading cards at the table all game.</p>'
      : '<p><b>Vietnamese order.</b> The Seer only needs to know werewolf or not, and the pack is called ' +
        'before her, so after tonight the app can answer every look on screen without touching the table.</p>') +
    '<p><b>Collect the deal</b> is one pass round the table where each player shows you their card. ' +
    'It takes a minute, and then nothing is ever lifted during the night \u2014 no player can feel their ' +
    'card being picked up and work out the Seer checked them.</p>' +
    '<p><b>Discover during the night</b> keeps you blind: each role is called and you tap whoever opens ' +
    'their eyes. Faster to start, but when the Seer points at a card the app has never seen, you will have ' +
    'to lift it at the table.</p>' +
    '<p><b>A tip either way:</b> once every player has looked at their own card, collect all the cards and ' +
    'keep them stacked in seat order in your lap. Nobody needs their card again, and with nothing at any ' +
    'seat there is nothing for anyone to feel being lifted.</p>'));
  const extra = el('button','btn sec wide','Bỏ qua — tìm ra trong đêm · Skip');
  extra.onclick = () => { snap(); G.knewDeal = false; G.night=1; G.phase='night';
    buildNight(); log('Night falls on Miller’s Hollow.','Night 1'); render(); };
  A.appendChild(extra);
}

/* The two disputed rules, each as three chips: follow the ruleset, or overrule it
   one way or the other. Written as a node rather than a string so the chips work. */
function houseRulesUI(){
  const wrap = el('div', null, '');
  const rows = [
    { key:'selfHeal', q:'Phù Thuỷ tự cứu mình?',
      en:'May the Witch use her cure on herself?',
      now:witchMaySaveSelf(),
      note:'Miller’s Hollow cho phép. Ma Sói Việt Nam thì không.' },
    { key:'hunterPoison', q:'Thợ Săn bị thuốc độc có bắn được?',
      en:'Does the Hunter still fire when the Witch poisons him?',
      now:hunterFiresPoisoned(),
      note:'Miller’s Hollow: bắn, vì luật nói \u201cchết vì bất cứ lý do gì\u201d. Ma Sói Việt Nam theo 狼人杀: thuốc độc thì không kịp giương súng.' },
  ];
  for (const r of rows){
    wrap.appendChild(el('div','grp', r.q + ' \u00b7 ' + r.en));
    const c = el('div','chips');
    // both of these default the same way: the French rules allow, the Vietnamese do not
    const byRule = G.rules !== 'vn';
    const opts = [[null, 'Theo luật \u00b7 ' + (byRule ? 'có' : 'không')],
                  [true, 'Có \u00b7 yes'], [false, 'Không \u00b7 no']];
    for (const [val, lab] of opts){
      const b = el('div','chip' + (G[r.key] === val ? ' sel' : ''), lab);
      b.onclick = () => { snap(); G[r.key] = val; render(); };
      c.appendChild(b);
    }
    wrap.appendChild(c);
    wrap.appendChild(el('p','note', r.note + ' <b>Đang dùng: ' + (r.now ? 'có' : 'không') + '.</b>'));
  }
  return wrap;
}

/* One player left and one card left means there is nothing worth asking, and a
   moderator holding fifteen people's attention should not have to answer it.
   Returns the deduced role, or null when the answer is not actually forced.

   Requiring exactly one free slot is what makes this safe in the Roster mid-game.
   The deck stops describing the table once a card leaves it — the Thief swaps for
   one of the two spares, which were never counted — but such a swap always leaves
   at least two slots looking free, because he frees his own and fills no counted
   one. So a drifted deck can never be mistaken for a forced answer. */
function autoFillLastCard(){
  const left = unassigned();
  if (left.length !== 1) return null;
  const short = [];
  for (const k in G.counts){
    for (let i = withRole(k).length; i < G.counts[k]; i++) short.push(k);
  }
  if (short.length !== 1) return null;          // ambiguous, so leave it alone
  left[0].role = short[0];
  log(left[0].name + ' holds the last card, the ' +
    (G.rules === 'vn' ? R[short[0]].vi : R[short[0]].name) + '.', 'Setup');
  return R[short[0]];
}

/* ---- collect the deal ---- */
function rLearn(){
  show('sLearn');
  const B = $('lrBody'); B.innerHTML = '';
  const known = G.players.filter(p => p.role).length, total = G.players.length;
  if (G.assignTo){
    const p = byId(G.assignTo);
    B.appendChild(el('div','grp','What card does ' + p.name + ' hold?'));
    const c = el('div','chips');
    for (const r of ROLES){
      if (!G.counts[r.id]) continue;                 // only cards in this deck
      const placed = withRole(r.id).length, full = placed >= G.counts[r.id] && p.role !== r.id;
      const b = el('div','chip' + (p.role===r.id ? ' sel' : '') + (full ? ' dead' : ''),
        '<span class="ic">' + icOf(r.id) + '</span>' + (G.rules==='vn' ? r.vi : r.name) +
        '<span class="bd">' + placed + '/' + G.counts[r.id] + '</span>');
      if (!full) b.onclick = () => { snap(); p.role = r.id; G.assignTo = null;
        autoFillLastCard(); render(); };
      c.appendChild(b);
    }
    B.appendChild(c);
    bar([{ t:'Cancel', sec:true, wide:true, on:() => { G.assignTo = null; render(); } }]);
    return;
  }
  B.appendChild(el('div','alert' + (known === total ? ' ok' : ''),
    known + ' of ' + total + ' cards recorded. Tap a player to set their card.'));
  const ros = el('div','ros');
  G.players.forEach((p,i) => ros.appendChild(playerRow(p, i, () => { G.assignTo = p.id; render(); })));
  B.appendChild(ros);
  bar([{ t:'Back', sec:true, on:() => { snap(); G.phase='deal'; render(); } },
       { t: known === total ? 'Begin the first night \u2192' : (total-known) + ' still to record',
         off: known !== total,
         on:() => { snap(); G.knewDeal = true; G.night=1; G.phase='night'; buildNight();
           log('The deal was collected before play, so the table is fully known.','Setup');
           log('Night falls on Miller’s Hollow.','Night 1'); render(); } }]);
}

/* ---- night ---- */
function rNight(){
  show('sNight');
  if (G.si >= G.steps.length){
    if (G.night === 1) return finishRollCall();
    G.phase = 'dawn'; computeDawn(); render(); return;
  }
  const s = G.steps[G.si], info = stepInfo(s);
  const roll = !!s.roll;
  const need = s.role === '__lovers' ? 0 : (G.counts[s.role] || 0);
  const have = s.role === '__lovers' ? 0 : withRole(s.role).length;
  const identified = s.role === '__lovers' || have === need;

  $('nStep').textContent = (G.night === 1 ? 'Roll call' : 'Night ' + G.night) +
    ' \u00b7 step ' + (G.si+1) + ' of ' + G.steps.length;
  const vn = G.rules === 'vn';
  const tIc = info.id === '__lovers' ? '💘' : icOf(s.role);
  $('nTitle').innerHTML = (tIc ? '<span class="ic" style="font-size:22px;margin-right:8px">' + tIc + '</span>' : '') +
    ((vn && info.vi)
    ? info.vi + ' <span style="font-size:14px;color:var(--txt45);font-family:var(--ui);font-weight:500">' + info.name + '</span>'
    : info.name + (info.vi ? ' <span style="font-size:14px;color:var(--txt45);font-family:var(--ui);font-weight:500">' + info.vi + '</span>' : ''));
  const holders = s.role === '__lovers' ? G.players.filter(p => p.lover) : liveWith(s.role);
  $('nSub').textContent = (identified && holders.length ? holders.map(p=>p.name).join(', ') + ' \u2014 ' : '') + (info.d || '');
  const primary = (vn && info.sayVi) ? info.sayVi : info.say;
  const second  = (vn && info.sayVi) ? info.say : info.sayVi;
  $('nSayT').innerHTML = (primary || '') +
    (second ? '<span style="display:block;margin-top:8px;font-family:var(--ui);font-size:12.5px;color:var(--txt45)">' + second + '</span>' : '');
  $('nSay').style.display = primary ? '' : 'none';

  const B = $('nBody'); B.innerHTML = '';

  // step 1 of a roll-call step: learn who holds this card
  if (roll && !identified){
    B.appendChild(el('div','grp', need === 1 ? 'Who opened their eyes?' : 'Tap all ' + need));
    const pool = G.players.filter(p => p.alive && (!p.role || p.role === s.role));
    const c = el('div','chips');
    for (const p of pool) c.appendChild(chip(p, { sel:p.role === s.role, on:() => {
      snap();
      if (p.role === s.role) p.role = null;
      else if (withRole(s.role).length < need) p.role = s.role;
      render();
    }}));
    B.appendChild(c);
    B.appendChild(el('p','note', have + ' of ' + need + ' identified. If nobody answers, skip \u2014 you can set it later from the Roster.'));
    bar([{ t:'Skip', sec:true, on:() => { G.si++; render(); } }]);
    return;
  }

  const lg = liveWith('littlegirl');
  if (s.role === 'wolf' && lg.length)
    B.appendChild(el('div','alert','The Little Girl (' + lg.map(p=>p.name).join(', ') + ') may be peeking. Watch her.'));

  /* --- specials --- */
  if (info.special === 'witch'){
    const v = G.n.wolf ? byId(G.n.wolf) : null;
    B.appendChild(el('div','card','<b>Tonight\u2019s victim:</b> ' + (v ? v.name : 'nobody chosen yet') +
      '<p class="note">Healing potion ' + (G.witchHeal ? 'available' : 'spent') +
      ' \u00b7 Poison ' + (G.witchPoison ? 'available' : 'spent') + '</p>'));
    const she = holders[0] || null;                    // the Witch herself
    const selfVictim = !!(she && v && v.id === she.id);
    if (G.witchHeal && v){
      // Self-rescue is the one place the two traditions disagree. Miller’s Hollow
      // lets her drink her own cure; Vietnamese play does not.
      const blockSelf = selfVictim && !witchMaySaveSelf();
      if (selfVictim) B.appendChild(el('div','alert' + (blockSelf ? ' no' : ''), blockSelf
        ? 'The victim is the Witch herself. Vietnamese rules do not let her drink her own cure \u2014 <b>kh\u00f4ng \u0111\u01b0\u1ee3c t\u1ef1 c\u1ee9u</b>.'
        : 'The victim is the Witch herself. Miller’s Hollow allows her to save herself.'));
      const b = el('button','btn sm sec', (G.n.witchSave ? '\u2713 Saving ' : 'Save ') + v.name);
      b.disabled = blockSelf;
      b.onclick = () => { G.n.witchSave = !G.n.witchSave; render(); };
      B.appendChild(b);
      if (blockSelf){
        const allow = el('button','btn sm sec','Our table allows self-rescue');
        allow.onclick = () => { snap(); G.selfHeal = true; render(); };
        B.appendChild(allow);
      }
    }
    if (G.witchPoison){
      B.appendChild(el('div','grp','Poison someone (optional)'));
      const c = el('div','chips');
      // She is never offered to herself. No ruleset has a witch poisoning herself,
      // and leaving her in the list is one mis-tap away from a nonsense entry.
      for (const p of alive()){
        if (she && p.id === she.id) continue;
        c.appendChild(chip(p, { sel:G.n.witchKill===p.id,
          on:() => { G.n.witchKill = G.n.witchKill===p.id ? null : p.id; render(); } }));
      }
      B.appendChild(c);
      if (she) B.appendChild(el('p','note', she.name + ' is not listed \u2014 the Witch cannot poison herself.'));
      if (G.n.witchKill && G.n.witchKill === G.n.wolf && !G.n.witchSave)
        B.appendChild(el('div','alert','That is already the wolves\u2019 victim tonight. The poison would be spent for nothing.'));
    }
    bar([{ t:'Skip', sec:true, on:() => { G.si++; render(); } },
         { t:'Done \u2192', on:() => { snap();
           if (G.n.witchSave) G.witchHeal = false;
           if (G.n.witchKill) G.witchPoison = false;
           G.si++; render(); } }]);
    return;
  }
  if (info.special === 'hound'){
    B.appendChild(el('div','grp','Which side did they choose?'));
    const c = el('div','chips');
    for (const side of ['village','wolf']){
      const b = el('div','chip' + (G.houndSide===side?' sel':''), side==='wolf' ? 'Werewolf' : 'Villager');
      b.onclick = () => { snap(); G.houndSide = side;
        log('The Wolf Hound chose the ' + (side==='wolf'?'pack':'village') + '.'); G.si++; render(); };
      c.appendChild(b);
    }
    B.appendChild(c);
    bar([{ t:'Skip', sec:true, on:() => { G.si++; render(); } }]);
    return;
  }
  if (info.special === 'thief'){
    B.appendChild(el('div','card','Show him the two spare cards. If he swaps, set his new card below.' +
      '<p class="note">If both spares are Werewolves he <b>must</b> take one.</p>'));
    B.appendChild(el('div','grp','He swapped for'));
    const th = withRole('thief')[0];
    const c = el('div','chips');
    for (const r of ROLES){
      if (r.id === 'thief') continue;
      const b = el('div','chip', '<span class="ic">' + icOf(r.id) + '</span>' + (G.rules==='vn' ? r.vi : r.name));
      b.onclick = () => { snap(); if (th){ th.role = r.id; log('The Thief became ' + r.name + '.'); } G.si++; render(); };
      c.appendChild(b);
    }
    B.appendChild(c);
    bar([{ t:'He kept his card \u2192', wide:true, on:() => { snap(); G.si++; render(); } }]);
    return;
  }

  const pickN = info.pick || 0;
  if (!pickN){
    B.appendChild(el('div','card tight', roll
      ? 'Noted. Nothing more to do tonight \u2014 this card acts when the moment comes.'
      : 'Nothing to record for this step.'));
    bar([{ t:'Next \u2192', wide:true, on:() => { snap(); if (info.say) log(info.name + ' was called.'); G.si++; render(); } }]);
    return;
  }

  const pool = targetPool(s.role);
  let chosen = (G.n['sel_' + s.role] || []).filter(id => pool.some(p => p.id === id));
  const pickNeed = Math.min(pickN, pool.length);
  B.appendChild(el('div','grp', pickNeed === 0 ? 'No legal target'
    : pickNeed === 1 ? 'Choose one' : 'Choose ' + pickNeed));
  const c = el('div','chips');
  const blocked = (info.special === 'guard' && G.lastGuard) ? G.lastGuard : null;
  for (const p of pool) c.appendChild(chip(p, { dead:p.id === blocked,
    badge: p.id === blocked ? 'last night' : '', sel:chosen.includes(p.id), on:() => {
    const i = chosen.indexOf(p.id);
    if (i >= 0) chosen.splice(i,1);
    else { if (chosen.length >= pickNeed) chosen.shift(); chosen.push(p.id); }
    G.n['sel_' + s.role] = chosen; render();
  }}));
  B.appendChild(c);
  if (!pool.length) B.appendChild(el('div','alert no','There is nobody they may legally point at tonight. Skip this step.'));
  const tn = targetNote(s.role);
  if (tn) B.appendChild(el('p','note', tn));
  if ((s.role === 'wolf' || s.role === 'whitewolf') && !wolfSideKnown())
    B.appendChild(el('div','alert', unplacedWolfCards() +
      ' still unaccounted for, so I cannot promise this list excludes every wolf \u2014 check it against the real deal.'));
  if (info.after) B.appendChild(el('p','note', info.after));
  if (blocked) B.appendChild(el('p','note','Cannot shield ' + byId(blocked).name + ' again \u2014 they were protected last night.'));

  if (s.role === 'seer'){
    B.appendChild(el('p','note', G.rules === 'vn'
      ? 'She is called after the pack here, so I already know every wolf and can answer on screen.'
      : 'She is called before the pack on purpose \u2014 she must commit without knowing tonight\u2019s victim. The Witch is called last for the opposite reason.'));
  }
  if (s.role === 'fox'){
    B.appendChild(el('p','note', G.rules === 'vn'
      ? 'He is called after the pack here, so I already know every wolf and can answer without you touching a card.'
      : 'Miller’s Hollow calls him before the pack. He is asleep while the wolves choose, so it costs him nothing \u2014 but on the first night I may not know the pack yet, and I will ask rather than guess.'));
  }
  // The Seer's look is how a moderator reads a card mid-night. If the app has
  // never seen that card, it asks, and remembers it from then on.
  if (s.role === 'seer' && chosen.length === 1){
    const t = byId(chosen[0]);
    const vnAnswerable = G.rules === 'vn' && wolfSideKnown();
    if (t.role || vnAnswerable){
      B.appendChild(el('div','alert ok', G.rules === 'vn'
        ? 'She only needs to know whether they are on the werewolf side, and I know every wolf. Answer on the screen \u2014 touch nothing on the table.'
        : 'I know this card. Answer her on the screen \u2014 touch nothing on the table, so nobody can feel their card being lifted.'));
      const sb = el('button','btn wide','Show her the answer');
      sb.onclick = () => showSeer(t);
      B.appendChild(sb);
    } else {
      B.appendChild(el('div','alert','I have never seen ' + t.name + '\u2019s card, so you must read it at the table.'));
      B.appendChild(el('div','card tight','<b>Read it without giving it away</b>' +
        '<p class="note">' +
        '\u00b7 Turn on <b>\u266b night sounds</b> in the header. Rain covers the card and your footsteps.<br>' +
        '\u00b7 Walk the <b>whole circle</b>, every night, whether or not you need to read anything.<br>' +
        '\u00b7 Touch <b>three or four cards</b>, not just theirs. Only you know which one mattered.<br>' +
        '\u00b7 Better still: <b>collect all the cards</b> after the first reveal and keep them stacked in ' +
        'seat order in your lap. Then there is nothing at any seat to lift, and you can read any card in silence.' +
        '</p>'));
      B.appendChild(el('p','note','Tap what you saw and I will answer on screen from now on \u2014 you will never need to read that card again.'));
      const rc = el('div','chips');
      for (const r of ROLES){
        const b = el('div','chip','<span class="dot t-'+r.team+'"></span>' + r.name);
        b.onclick = () => { snap(); t.role = r.id;
          log('The Seer saw that ' + t.name + ' is the ' + r.name + '.'); render(); };
        rc.appendChild(b);
      }
      B.appendChild(rc);
    }
  }

  let needAnswer = false;
  if (info.special === 'fox' && chosen.length === 1){
    const t = byId(chosen[0]), grp = [t, ...neighbours(t)];
    // always name the trio, so the moderator knows who is being checked
    B.appendChild(el('div','card tight','<b>Sniffing:</b> ' + grp.map(p=>p.name).join(' \u00b7 ') +
      '<p class="note">The card he points at, plus their two living neighbours.</p>'));
    // I do not need to know what these three hold — only whether any is a wolf.
    if (wolfSideKnown()){
      G.n.foxAns = grp.some(isWolf);
      B.appendChild(el('div','alert ok','Every wolf card is placed, so I can answer this with certainty. Show him on the screen \u2014 touch nothing on the table.'));
    } else {
      needAnswer = G.n.foxAns == null;
      B.appendChild(el('div','alert','I cannot be certain yet: <b>' + unplacedWolfCards() +
        '</b> still unaccounted for. Look at those three cards yourself, then tell me what you found \u2014 I will not guess.'));
      const yn = el('div','chips');
      const y = el('div','chip' + (G.n.foxAns === true ? ' sel' : ''), 'A werewolf is among them');
      y.onclick = () => { G.n.foxAns = true; render(); };
      const no = el('div','chip' + (G.n.foxAns === false ? ' sel' : ''), 'None \u2014 he loses his power');
      no.onclick = () => { G.n.foxAns = false; render(); };
      yn.append(y, no); B.appendChild(yn);
    }
    // the same button the Seer gets, once there is an answer to give
    if (G.n.foxAns != null){
      const fb = el('button','btn wide','Show him the answer');
      fb.onclick = () => showFox(grp, G.n.foxAns);
      B.appendChild(fb);
    }
  }
  bar([{ t:'Skip', sec:true, on:() => { snap(); noteSkip(s.role); G.si++; render(); } },
       { t:'Confirm \u2192', off:chosen.length !== pickNeed || pickNeed === 0 || needAnswer,
         on:() => { snap(); applyStep(s, chosen); G.si++; render(); } }]);
}
function applyStep(s, chosen){
  const info = stepInfo(s);
  const nm = ids => ids.map(i => byId(i).name).join(' and ');
  switch (s.role){
    case 'wolf': G.n.wolf = chosen[0]; log('The pack chose ' + byId(chosen[0]).name + '.'); break;
    case 'whitewolf': G.n.white = chosen[0]; log('The White Werewolf marked ' + byId(chosen[0]).name + '.'); break;
    case 'seer': log('The Seer looked at ' + byId(chosen[0]).name + '.'); break;
    case 'cupid':
      G.players.forEach(p => p.lover = false);
      chosen.forEach(i => byId(i).lover = true);
      log('Cupid joined ' + nm(chosen) + '.'); break;
    case 'wildchild':
      G.players.forEach(p => p.model = false);
      byId(chosen[0]).model = true;
      log('The Wild Child took ' + byId(chosen[0]).name + ' as a model.'); break;
    case 'piper':
      chosen.forEach(i => byId(i).charmed = true);
      log('The Piper charmed ' + nm(chosen) + '.'); break;
    case 'guard': G.n.guard = chosen[0]; log('The Bodyguard shielded ' + byId(chosen[0]).name + '.'); break;
    case 'fox': {
      const t = byId(chosen[0]), grp = [t, ...neighbours(t)];
      const hit = G.n.foxAns != null ? G.n.foxAns : grp.some(isWolf);
      if (!hit) G.foxPower = false;
      log('The Fox sniffed ' + t.name + ' \u2014 ' + (hit ? 'a wolf was among them' : 'nothing, and lost his power') + '.');
      break; }
    default: if (info.say) log(info.name + ' was called.');
  }
}
function finishRollCall(){
  snap();
  const left = unassigned(), v = G.counts.villager || 0;
  if (left.length && left.length === v){
    left.forEach(p => p.role = 'villager');
    log('The remaining ' + left.length + ' are Simple Villagers.');
  } else if (left.length){
    log(left.length + ' card' + (left.length>1?'s':'') + ' still unaccounted for.');
  }
  G.phase = 'dawn'; computeDawn(); render();
}

/* ---- dawn ---- */
function rDawn(){
  show('sDawn');
  $('dwTitle').textContent = 'Dawn of day ' + G.night;
  const B = $('dwBody'); B.innerHTML = '';
  const un = unassigned();
  if (un.length) B.appendChild(el('div','alert','Still unknown: ' + un.map(p=>p.name).join(', ') +
    '. Set their cards from the Roster when you learn them.'));
  for (const b of liveWith('beartamer')){
    const nb = neighbours(b);
    if (!wolfSideKnown()){
      B.appendChild(el('div','alert','Bear Tamer <b>' + b.name + '</b> \u2014 ' + unplacedWolfCards() +
        ' still unaccounted for, so I cannot tell you whether to growl. Check yourself.'));
    } else {
      const growl = nb.some(isWolf);
      B.appendChild(el('div','alert' + (growl ? '' : ' ok'),
        'Bear Tamer <b>' + b.name + '</b> \u2014 neighbours ' + nb.map(p=>p.name).join(' & ') + '. ' +
        (growl ? '<b>GROWL.</b>' : 'Stay silent.')));
    }
  }
  const on = G.dawn.filter(d => d.on);
  // State the outcome. The rules already decided it; the moderator just reads it out.
  B.appendChild(el('div','grp','Announce'));
  const head = on.length
    ? on.map(d => byId(d.id).name).join(' and ') + (on.length > 1 ? ' are dead.' : ' is dead.')
    : 'Nobody died in the night.';
  const say = el('div','say');
  say.innerHTML = '<div class="lbl">Read aloud</div><p>' + head + '</p>';
  B.appendChild(say);

  if (G.dawnWhy && G.dawnWhy.length){
    const w = el('div','card tight');
    w.innerHTML = '<div style="font-size:9px;font-weight:700;letter-spacing:.16em;' +
      'text-transform:uppercase;color:var(--txt45);margin-bottom:8px">How that follows</div>' +
      G.dawnWhy.map(t => '<div style="font-size:13px;line-height:1.6;color:var(--txt70)">\u00b7 ' + t + '</div>').join('');
    B.appendChild(w);
  }
  for (const d of on){
    const p = byId(d.id);
    const row = el('div','p');
    row.innerHTML = icSpanD(p) + '<span class="nm">' + p.name + '</span>' +
      '<span class="rl">' + d.cause + '</span>';
    B.appendChild(row);
  }

  if (!G.dawnSure){
    B.appendChild(el('div','alert','I cannot be certain tonight \u2014 ' + G.dawnGaps.join('; ') +
      '. Check the outcome below before you announce it.'));
    G.dawnEdit = true;
  }

  if (!G.dawnEdit){
    const adj = el('button','btn sec sm','Something else happened \u2014 adjust');
    adj.onclick = () => { G.dawnEdit = true; render(); };
    B.appendChild(adj);
  } else {
    B.appendChild(el('div','grp','Adjust \u2014 tap to include or exclude'));
    for (const d of G.dawn){
      const p = byId(d.id);
      const row = el('div','p' + (d.on ? '' : ' dead'));
      row.innerHTML = icSpanD(p) + '<span class="nm">' + p.name + '</span>' +
        '<span class="rl">' + (d.on ? d.cause : 'spared') + '</span>';
      row.style.cursor = 'pointer';
      row.onclick = () => { d.on = !d.on; render(); };
      B.appendChild(row);
    }
    B.appendChild(el('div','grp','Add someone the rules did not cover'));
    const c = el('div','chips');
    for (const p of alive()){
      if (G.dawn.some(d => d.id === p.id)) continue;
      c.appendChild(chip(p, { on:() => { G.dawn.push({ id:p.id, cause:'the night', on:true }); render(); } }));
    }
    B.appendChild(c);
  }
  if (on.some(d => byId(d.id).role === 'hunter'))
    B.appendChild(el('div','alert','The Hunter is among the dead \u2014 he fires before the day begins.'));
  bar([{ t:'Announce the dawn \u2192', wide:true, on:applyDawn }]);
}
function icSpanD(p){ return '<span class="ic">' + pIcon(p) + '</span>' +
  '<span class="dot t-' + teamOf(p) + '"></span>'; }

/* ---- day ---- */
function rDay(){
  // If the board is already decided \u2014 parity reached, last wolf dead \u2014 say so
  // rather than asking for a vote nobody needs.
  const settled = checkWin();
  if (settled) return finish(settled);
  show('sDay');
  $('dyTitle').textContent = 'Day ' + G.day;
  const A = alive();
  $('dySub').textContent = A.length + ' still alive, ' + A.filter(isWolf).length + ' of them not what they seem.';
  const B = $('dyBody'); B.innerHTML = '';

  if (G.day === 1 && !G.sheriffDone){
    const vn = G.rules === 'vn';
    B.appendChild(el('div','card','<b>Elect the ' + (vn ? 'Trưởng Làng \u00b7 Sheriff' : 'Sheriff') +
      '</b><p class="note">Their vote is worth <b>' + SHERIFF_WEIGHT() +
      '</b>, and on dying they name their successor.</p>'));
    B.appendChild(collapsible('sheriff', 'What the badge actually does',
      '<p>This is <b>not a card</b> \u2014 it is a title the village votes on, so anyone can hold it. ' +
      'A werewolf can be elected, and often tries to be.</p>' +
      '<p>\u00b7 Their vote is worth <b>' + SHERIFF_WEIGHT() + '</b> in every day vote.<br>' +
      '\u00b7 When they die, whatever kills them, they <b>name their successor</b> before play continues ' +
      '\u2014 or destroy the badge so nobody carries it.<br>' +
      '\u00b7 The title survives everything else: losing a power, being revealed, changing side.</p>' +
      '<p>' + (vn
        ? 'Vietnamese tables usually weight the badge at 1.5 so it cannot outvote two villagers on its own. Miller’s Hollow uses a flat double.'
        : 'Miller’s Hollow gives a flat double vote. Vietnamese and 狼人杀 tables usually use 1.5 instead.') + '</p>'));
    B.appendChild(el('div','grp','Who was elected?'));
    const c = el('div','chips');
    for (const p of A) c.appendChild(chip(p, { on:() => { snap(); p.sheriff = true; G.sheriffDone = true;
      log(p.name + ' was elected Sheriff.'); render(); } }));
    B.appendChild(c);
    bar([{ t:'Play without a Sheriff', sec:true, wide:true, on:() => { snap(); G.sheriffDone = true;
      log('The village declined to elect a Sheriff.'); render(); } }]);
    return;
  }
  const jd = liveWith('judge');
  if (jd.length && !G.judgeUsed)
    B.appendChild(el('div','alert','Stuttering Judge in play (' + jd.map(p=>p.name).join(', ') + '). Watch for the sign \u2014 he may demand a second vote today.'));
  const sc = liveWith('scapegoat');
  if (sc.length) B.appendChild(el('div','alert','If the vote ties, the Scapegoat (' + sc.map(p=>p.name).join(', ') + ') dies instead and chooses who may vote tomorrow.'));
  if (G.scapegoatVoters) B.appendChild(el('div','alert','Only these may vote today: <b>' + G.scapegoatVoters.map(i=>byId(i).name).join(', ') + '</b>'));
  if (G.powersLost) B.appendChild(el('div','alert no','The Elder was killed by the village. Every villager has lost their power.'));

  const sh = A.find(p => p.sheriff);
  if (sh) B.appendChild(el('div','alert ok','<b>' + sh.name + '</b> holds the badge — count their hand as <b>' +
    SHERIFF_WEIGHT() + '</b>. If they die today they name the next holder.'));
  /* A vote only bites if it clears half the voting weight. Counting that by hand
     is exactly what a moderator gets wrong, especially with a weighted badge and
     a silenced Idiot, so the app does the arithmetic. */
  const voters = eligibleVoters(), TP = totalPower(), thr = TP / 2;
  const wt = G.rules === 'vn' ? 1.5 : 2;
  G.votes = G.votes || {};
  B.appendChild(el('div','grp','Count the vote'));
  B.appendChild(el('div','card tight',
    '<b>' + voters.length + '</b> may vote \u00b7 total weight <b>' + fmtN(TP) + '</b> \u00b7 ' +
    'a name needs <b>more than ' + fmtN(thr) + '</b>' +
    (sh ? '<p class="note">' + sh.name + ' holds the badge, so their hand counts ' + wt + '. ' +
          'Tap the badge beside whoever they voted for.</p>' : '') +
    (G.scapegoatVoters ? '<p class="note">The Scapegoat has silenced everyone else today.</p>' : '')));

  // Rows are built once and a light refresh updates only the derived numbers, so
  // typing in a box never rebuilds it and never loses the caret.
  const cells = [];
  for (const p of A){
    const row = el('div','p');
    row.innerHTML = icSpanD(p) + '<span class="nm">' + p.name + '</span>' +
      (p.voteless ? '<span class="tag">no vote</span>' : '');
    const power = el('span','rl');
    power.style.cssText = 'min-width:56px;text-align:right';
    row.appendChild(power);
    if (sh){
      const bg = el('button','ico', G.sheriffVote === p.id ? '\u2b50' : '\u2606');
      bg.title = 'The Sheriff voted for this player';
      bg.onclick = () => { G.sheriffVote = G.sheriffVote === p.id ? null : p.id; refresh(); };
      row.appendChild(bg);
    }
    const stp = el('div','stp');
    const minus = el('button',null,'\u2212');
    minus.onclick = () => setVote(p, tallyOf(p) - 1);
    const box = document.createElement('input');
    box.type = 'text'; box.inputMode = 'numeric'; box.autocomplete = 'off';
    box.setAttribute('aria-label', 'votes for ' + p.name);
    box.onfocus = () => box.select();
    box.oninput = () => {
      const digits = box.value.replace(/[^0-9]/g, '').slice(0, 3);
      const v = Math.max(0, Math.min(voters.length, digits === '' ? 0 : parseInt(digits, 10)));
      if (String(v) !== digits && digits !== '') box.value = String(v);   // refuse the impossible
      else if (digits !== box.value) box.value = digits;
      G.votes[p.id] = v;
      refresh();
    };
    box.onblur = () => { box.value = String(tallyOf(p)); };
    box.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); box.blur(); } };
    const plus = el('button',null,'+');
    plus.onclick = () => setVote(p, tallyOf(p) + 1);
    stp.append(minus, box, plus);
    row.appendChild(stp);
    B.appendChild(row);
    cells.push({ p, power, minus, plus, box });
  }
  const verdict = el('div','alert'); B.appendChild(verdict);
  const twice  = el('div','alert no'); B.appendChild(twice);

  function tallyOf(p){ return G.votes[p.id] || 0; }
  function extraOf(p){ return (G.sheriffVote === p.id && sh) ? wt - 1 : 0; }
  function setVote(p, v){
    G.votes[p.id] = Math.max(0, Math.min(voters.length, Math.round(v) || 0));
    refresh();
  }
  function refresh(){
    let lead = [], best = 0;
    for (const p of A){
      const pw = tallyOf(p) + extraOf(p);
      if (pw > best){ best = pw; lead = [p]; } else if (pw === best && pw > 0) lead.push(p);
    }
    for (const c of cells){
      const extra = extraOf(c.p), pw = tallyOf(c.p) + extra;
      c.power.textContent = fmtN(pw) + (extra ? ' \u2b50' : '');
      c.power.style.color = pw > thr ? 'var(--vil)' : 'var(--txt45)';
      c.minus.disabled = !tallyOf(c.p);
      c.plus.disabled = tallyOf(c.p) >= voters.length;
      if (document.activeElement !== c.box) c.box.value = String(tallyOf(c.p));
    }
    const cast = A.reduce((a,p) => a + tallyOf(p), 0) + (G.sheriffVote && sh ? wt - 1 : 0);
    const passing = lead.length === 1 && best > thr;
    verdict.className = 'alert' + (passing ? ' ok' : '');
    verdict.innerHTML = passing
      ? '<b>' + lead[0].name + '</b> has ' + fmtN(best) + ' of ' + fmtN(TP) + ' \u2014 over half. The vote carries.'
      : lead.length > 1 && best > 0
        ? 'Tied on ' + fmtN(best) + ': <b>' + lead.map(x=>x.name).join(', ') + '</b>. Nobody clears half.'
        : best === 0 ? 'No votes recorded yet.'
          : '<b>' + lead[0].name + '</b> leads on ' + fmtN(best) + ', but that is not more than ' +
            fmtN(thr) + '. As it stands the vote fails.';
    twice.style.display = cast > TP ? '' : 'none';
    twice.innerHTML = 'You have recorded ' + fmtN(cast) + ' of a possible ' + fmtN(TP) +
      '. Somebody has voted twice.';

    const opts = [];
    if (passing) opts.push({ t:'Hang ' + lead[0].name + ' \u2192', on:() => resolveVote(lead[0]) });
    if (sc.length && lead.length > 1) opts.push({ t:'Tied \u2014 Scapegoat dies', sec:true, on:() => resolveVote(sc[0], true) });
    opts.push({ t: best > 0 ? 'Clear the tally' : 'Nobody was voted out', sec:true, on:() => {
      if (best > 0){ G.votes = {}; G.sheriffVote = null; refresh(); return; }
      snap(); log('The vote did not clear half. Nobody was hanged.');
      G.votes = {}; G.sheriffVote = null; G.resume = 'night'; proceed(); } });
    bar(opts);
  }
  refresh();
}
function resolveVote(p, tie){
  snap();
  if (p.role === 'idiot' && !p.revealed){
    p.revealed = true; p.voteless = true;
    log(p.name + ' is the Village Idiot \u2014 revealed, spared, silenced for good. The vote is spent.');
    toNight(); return;
  }
  if (p.role === 'angel' && G.day === 1){
    kill(p, 'the village vote');
    return finish({ who:'The Angel', why: p.name + ' wanted exactly this and got it on day one.' });
  }
  if (p.role === 'elder'){ G.powersLost = true; log('The village killed the Elder. All village powers are extinguished.'); }
  if (tie){
    log('The vote tied. The Scapegoat ' + p.name + ' was sacrificed.');
    registerDeaths(kill(p, 'the tie'));
    G.resume = 'night';
    G.phase = 'scapegoat'; render(); return;
  }
  registerDeaths(kill(p, 'the village vote'));
  G.resume = 'night';
  proceed();
}
function renderHunter(){
  show('sDay');
  const hp = byId(G.pending.hunterId);
  const cause = G.pending.hunterCause || 'his death';
  $('dyTitle').textContent = 'The Hunter fires';
  $('dySub').textContent = (hp ? hp.name + ' is dead \u2014 ' + cause + '. ' : '') +
    'The shot is not optional: he must take one living player with him.';
  const B = $('dyBody'); B.innerHTML = '';
  const targets = alive();

  if (!targets.length){
    B.appendChild(el('div','card tight','There is nobody left for him to hit.'));
    bar([{ t:'Continue \u2192', wide:true, on:() => { snap(); G.pending.hunterId = null; proceed(); } }]);
    return;
  }

  B.appendChild(el('div','alert','He <b>must</b> choose somebody. The rules give him no option to spare the village \u2014 tap whoever he points at.'));
  const c = el('div','chips');
  for (const p of targets) c.appendChild(chip(p, { on:() => {
    snap(); G.pending.hunterId = null; G.pending.hunterCause = null;
    registerDeaths(kill(p, 'the Hunter\u2019s shot'));
    proceed();
  }}));
  B.appendChild(c);

  // a moderator still needs an escape hatch, but it should be labelled honestly
  const esc = el('button','btn sec sm','House rule: he fired wide and hit nobody');
  esc.onclick = () => { snap(); G.pending.hunterId = null; G.pending.hunterCause = null;
    log('By house rule the Hunter\u2019s shot hit nobody.'); proceed(); };
  B.appendChild(esc);
  bar([]);
}
function renderSheriff(){
  show('sDay');
  $('dyTitle').textContent = 'The badge passes';
  $('dySub').textContent = 'The badge does not die with them. They name whoever carries it next — or destroy it so nobody does.';
  const B = $('dyBody'); B.innerHTML = '';
  G.players.forEach(p => p.sheriff = false);
  const c = el('div','chips');
  for (const p of alive()) c.appendChild(chip(p, { on:() => {
    snap(); G.pending.badge = false; p.sheriff = true;
    log(p.name + ' takes the badge.'); proceed(); } }));
  B.appendChild(c);
  bar([{ t:'They destroyed the badge', sec:true, wide:true,
         on:() => { snap(); G.pending.badge = false;
           log('The badge was destroyed — nobody carries it now.'); proceed(); } }]);
}
function renderScapegoat(){
  show('sDay');
  $('dyTitle').textContent = 'The Scapegoat decides';
  $('dySub').textContent = 'As he dies he names who may vote tomorrow. Tap everyone who keeps their voice.';
  const B = $('dyBody'); B.innerHTML = '';
  const pick = G.pending.sg || [];
  const c = el('div','chips');
  for (const p of alive()) c.appendChild(chip(p, { sel:pick.includes(p.id), on:() => {
    const i = pick.indexOf(p.id); if (i>=0) pick.splice(i,1); else pick.push(p.id);
    G.pending.sg = pick; render(); } }));
  B.appendChild(c);
  bar([{ t:'Everyone may vote', sec:true, on:() => { snap(); G.scapegoatVoters=null; G.pending.sg=null; proceed(); } },
       { t:'Confirm \u2192', off:!pick.length, on:() => { snap(); G.scapegoatVoters=pick.slice(); G.pending.sg=null;
         log('The Scapegoat allows only ' + pick.map(i=>byId(i).name).join(', ') + ' to vote.'); proceed(); } }]);
}
function toNight(){
  const w = checkWin(); if (w) return finish(w);
  G.night++; G.phase = 'night'; buildNight();
  log('Night falls again.','Night ' + G.night);
  render();
}

/* ---- end ---- */
function rEnd(){
  show('sEnd');
  $('enTitle').textContent = G.over.who + ' win';
  $('enSub').textContent = G.over.why;
  const C = $('enCard'); C.innerHTML = '';
  C.appendChild(el('div','grp','Every card, revealed'));
  const ros = el('div','ros');
  G.players.forEach((p,i) => ros.appendChild(playerRow(p, i)));
  C.appendChild(ros);
  const L = $('enLog'); L.innerHTML = '';
  for (const e of G.log) L.appendChild(el('div','le','<span class="w">'+e.w+'</span><span>'+e.t+'</span>'));
  bar([{ t:'Same table, new game', wide:true, on:() => {
    const names = G.players.map(p => p.name), counts = G.counts;
    undoStack.length = 0; G = blank();
    names.forEach((nm,i) => G.players.push({ id:'p'+i+Math.random().toString(36).slice(2,5),
      name:nm,
      role:null, alive:true, cause:null, sheriff:false, lover:false, charmed:false,
      voteless:false, model:false, turned:false, revealed:false }));
    G.counts = counts; G.phase = 'roles'; render(); } }]);
}

/* ---- roster modal, with role correction ---- */
function openRoster(){
  const B = $('rosBody'); B.innerHTML = '';
  if (G.assignTo){
    const p = byId(G.assignTo);
    B.appendChild(el('div','grp','Set the card for ' + p.name));
    const c = el('div','chips');
    const none = el('div','chip','Unknown');
    none.onclick = () => { snap(); p.role = null; G.assignTo = null; openRoster(); };
    c.appendChild(none);
    // Only cards actually in this deck, with how many are already placed. A card
    // whose copies are all accounted for cannot be handed out again.
    for (const r of ROLES){
      const inDeck = !!G.counts[r.id];
      if (!inDeck && !G.showAllRoles) continue;
      const placed = withRole(r.id).length;
      const full = inDeck && placed >= G.counts[r.id] && p.role !== r.id;
      const b = el('div','chip' + (p.role===r.id ? ' sel' : '') + (full ? ' dead' : ''),
        '<span class="ic">' + icOf(r.id) + '</span>' + (G.rules==='vn' ? r.vi : r.name) +
        '<span class="bd">' + (inDeck ? placed + '/' + G.counts[r.id] : 'off-deck') + '</span>');
      if (!full) b.onclick = () => { snap(); p.role = r.id; G.assignTo = null;
        log(p.name + ' is the ' + r.name + '.'); autoFillLastCard(); openRoster(); };
      c.appendChild(b);
    }
    B.appendChild(c);
    // the Thief can end up holding one of the two spare cards, which are not in the deck
    const tog = el('button','btn sec sm', G.showAllRoles
      ? 'Only cards in this deck' : 'Thief took a spare \u2014 show every card');
    tog.onclick = () => { G.showAllRoles = !G.showAllRoles; openRoster(); };
    B.appendChild(tog);
  } else {
    const ros = el('div','ros');
    G.players.forEach((p,i) => ros.appendChild(playerRow(p, i,
      () => { G.assignTo = p.id; openRoster(); })));
    B.appendChild(ros);
    const need = {}; for (const k in G.counts) need[k] = G.counts[k];
    for (const p of G.players) if (p.role && need[p.role] != null) need[p.role]--;
    const missing = Object.keys(need).filter(k => need[k] > 0);
    if (missing.length) B.appendChild(el('div','alert','Cards not yet placed: ' +
      missing.map(k => R[k].name + (need[k]>1 ? ' \u00d7'+need[k] : '')).join(', ')));
  }
  const L = $('rosLog'); L.innerHTML = '';
  for (const e of [...G.log].reverse()) L.appendChild(el('div','le','<span class="w">'+e.w+'</span><span>'+e.t+'</span>'));
  $('mRoster').classList.add('on');
}
// Are all werewolf-side cards accounted for? In the Vietnamese order the pack is
// called before the Seer, so on the first night this is already true and the
// answer can be given from the screen without touching a single card.
/* Can I say for certain whether any given player is a wolf?
   That does NOT require knowing what everyone holds — only that every card which
   could put someone on the wolf side has been placed. Once both Werewolf cards sit
   on known players, everybody else is definitively not a wolf, whatever they hold. */
/* Which wolf-side cards are still unaccounted for, in words. */
function unplacedWolfCards(){
  const out = [];
  for (const id of ['wolf','whitewolf','wolfhound','wildchild']){
    const want = G.counts[id] || 0, have = withRole(id).length;
    if (want > have) out.push(R[id].vi + (want - have > 1 ? ' \u00d7' + (want-have) : ''));
  }
  return out.length ? out.join(', ') : 'a wolf card';
}
function wolfSideKnown(){
  for (const id of ['wolf','whitewolf'])
    if ((G.counts[id] || 0) > withRole(id).length) return false;
  if (G.counts.wolfhound){
    if (G.houndSide == null) return false;                     // side not chosen yet
    // a Hound that joined the pack must be identified, or an unknown player is a wolf
    if (G.houndSide === 'wolf' && withRole('wolfhound').length < G.counts.wolfhound) return false;
  }
  // a Wild Child turns when their model dies, and an unidentified one turns invisibly.
  // Before the first death they cannot have turned, so this only bites later.
  if (G.counts.wildchild && withRole('wildchild').length < G.counts.wildchild
      && G.players.some(p => !p.alive)) return false;
  return true;
}
/* One full-screen reveal, used by every role that must be told something in
   private. The answer is never printed on the step itself — it appears only when
   the moderator deliberately turns the screen, so a glance at their phone gives
   nothing away. tone: 'wolf' | 'vil' | 'solo' | 'plain'. */
function showReveal(kick, who, big, sub, tone){
  const nm = $('seerName'), tm = $('seerTeam');
  const col = tone === 'wolf' ? 'var(--wolf)' : tone === 'vil' ? 'var(--vil)'
            : tone === 'solo' ? 'var(--solo)' : 'var(--txt)';
  $('revKick').textContent = kick;
  $('seerWho').textContent = who;
  nm.textContent = big;
  nm.style.color = tone === 'plain' ? 'var(--txt)' : col;
  tm.textContent = sub;
  tm.style.color = col;
  $('mSeer').classList.add('on');
}
function showSeer(t){
  const vn = G.rules === 'vn';
  const kick = vn ? 'Đưa màn hình cho Tiên Tri' : 'Turn the screen to the Seer';
  if (vn){
    const w = isWolf(t);
    showReveal(kick, t.name, w ? 'LÀ SÓI' : 'KHÔNG PHẢI SÓI',
      w ? 'werewolf side' : 'not a werewolf', w ? 'wolf' : 'vil');
  } else {
    const r = R[t.role];
    showReveal(kick, t.name + ' is', r.name, TEAM_NAME[r.team],
      r.team === 'wolf' ? 'wolf' : r.team === 'solo' ? 'solo' : 'vil');
  }
}
function showFox(grp, hit){
  const vn = G.rules === 'vn';
  showReveal(
    vn ? 'Đưa màn hình cho Cáo' : 'Turn the screen to the Fox',
    grp.map(p => p.name).join('  \u00b7  '),
    hit ? (vn ? 'CÓ SÓI' : 'A WOLF') : (vn ? 'KHÔNG CÓ SÓI' : 'NO WOLF'),
    hit ? (vn ? 'trong ba người này' : 'among these three')
        : (vn ? 'Cáo mất phép từ giờ' : 'the Fox loses his power'),
    hit ? 'wolf' : 'vil');
}
$('bSeerDone').onclick = () => $('mSeer').classList.remove('on');
$('bRoster').onclick = () => { G.assignTo = null; openRoster(); };
$('bCloseR').onclick = () => { G.assignTo = null; $('mRoster').classList.remove('on'); render(); };
function paintSound(){
  $('bSound').innerHTML = icon('music') + (soundOn ? 'On' : 'Off');
  $('bSound').style.color = soundOn ? 'var(--warn)' : '';
}
$('bSound').onclick = () => {
  soundOn = !soundOn;
  paintSound();
  ambience(soundOn && G.phase === 'night');
};
paintSound();
$('bUndo').onclick = undo;
function addName(){
  const v = $('iName').value;
  $('iName').value = '';
  addPlayer(v);
  $('iName').focus();
}
$('bAdd').onclick = addName;
$('iName').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); addName(); } });

/* Offer to pick up an interrupted game before anything is drawn. */
(() => {
  const box = loadSaved();
  if (!box) return;
  const g = box.g;
  const mins = Math.round((Date.now() - box.at) / 60000);
  const when = g.phase === 'night' || g.phase === 'dawn' ? 'Night ' + g.night
             : g.phase === 'day' || g.phase === 'hunter' || g.phase === 'sheriff' ||
               g.phase === 'scapegoat' ? 'Day ' + g.day : 'setup';
  const v = document.createElement('div');
  v.className = 'veil on';
  v.innerHTML = '<div class="kicker">Ván đang dở \u00b7 game in progress</div>' +
    '<h1>Tiếp tục?</h1>' +
    '<p>' + g.players.length + ' người \u00b7 ' + when +
    ' \u00b7 dừng ' + (mins < 1 ? 'vừa xong' : mins + ' phút trước') + '.</p>' +
    '<p class="dim">The app reloaded. Everything was kept \u2014 roles, deaths, the badge, ' +
    'the tally. Resume where you were, or start again.</p>';
  const go = document.createElement('div'); go.className = 'go';
  const yes = document.createElement('button'); yes.type = 'button';
  yes.className = 'btn'; yes.textContent = 'Tiếp tục \u00b7 Resume';
  const no  = document.createElement('button'); no.type = 'button';
  no.className = 'btn ghost'; no.textContent = 'Bỏ, chơi ván mới';
  yes.onclick = () => { G = g; v.remove(); render(); };
  no.onclick  = () => { dropSaved(); v.remove(); };
  go.append(yes, no); v.appendChild(go);
  document.body.appendChild(v);
})();

/* Offline support. Only registers over https or on localhost, which is where a
   service worker is permitted anyway. */
if ('serviceWorker' in navigator){
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

render();
})();
