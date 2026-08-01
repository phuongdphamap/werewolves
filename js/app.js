(() => {
"use strict";

/* ==========================================================================
   ROLES.  n1 = position in the first-night roll call.  every = recurring wake
   order on later nights.  Roles with no n1 action are still called on night one
   so the moderator learns who they are.
========================================================================== */
const ROLES = [
 {id:'villager',name:'Simple Villager',vi:'Dân làng',team:'village',set:'Base',max:24,
  d:'No power. Never wakes. Assigned automatically to whoever is left after the roll call.', dVi:'Kh\u00f4ng c\u00f3 ph\u00e9p. Kh\u00f4ng bao gi\u1edd th\u1ee9c. T\u1ef1 \u0111\u1ed9ng chia cho nh\u1eefng ai c\u00f2n l\u1ea1i sau khi \u0111i\u1ec3m danh.'},
 {id:'thief',name:'Thief',vi:'Ăn trộm',team:'village',set:'Base',max:1,n1:10,
  d:'Two extra cards are dealt. On the first night he may swap his card for one of them. If both spares are Werewolves he must take one.', dVi:'Chia d\u01b0 hai l\u00e1. \u0110\u00eam \u0111\u1ea7u ti\u00ean anh ta c\u00f3 th\u1ec3 \u0111\u1ed5i l\u00e1 c\u1ee7a m\u00ecnh l\u1ea5y m\u1ed9t trong hai. N\u1ebfu c\u1ea3 hai l\u00e1 d\u01b0 \u0111\u1ec1u l\u00e0 Ma S\u00f3i th\u00ec b\u1eaft bu\u1ed9c ph\u1ea3i l\u1ea5y m\u1ed9t.',
  say:'Thief, wake up. Here are the two spare cards. Take one, or keep your own.',
  sayVi:'Ăn trộm thức dậy. Đây là hai lá bài còn lại. Đổi một lá, hoặc giữ lá của mình.',special:'thief'},
 {id:'cupid',name:'Cupid',vi:'Thần Tình Yêu',team:'village',set:'Base',max:1,n1:20,
  d:'On the first night, designates two Lovers. If one dies the other dies of grief. A mixed pair wins alone together.', dVi:'\u0110\u00eam \u0111\u1ea7u ti\u00ean, ch\u1ec9 \u0111\u1ecbnh hai ng\u01b0\u1eddi th\u00e0nh C\u1eb7p \u0110\u00f4i. M\u1ed9t ng\u01b0\u1eddi ch\u1ebft th\u00ec ng\u01b0\u1eddi kia ch\u1ebft theo v\u00ec \u0111au bu\u1ed3n. C\u1eb7p kh\u00e1c phe th\u1eafng ri\u00eang v\u1edbi nhau.',
  say:'Cupid, wake up and point to the two people you are joining in love.',
  sayVi:'Thần Tình Yêu thức dậy và chỉ vào hai người mà bạn muốn nối tình yêu.',pick:2},
 {id:'judge',name:'Stuttering Judge',vi:'Quan Toà Nói Lắp',team:'village',set:'Characters',max:1,n1:24,
  d:'Once per game, by a secret sign agreed with the moderator, he forces a second vote the same day.', dVi:'M\u1ed9t l\u1ea7n m\u1ed7i v\u00e1n, b\u1eb1ng m\u1ed9t d\u1ea5u hi\u1ec7u b\u00ed m\u1eadt \u0111\u00e3 h\u1eb9n v\u1edbi qu\u1ea3n tr\u00f2, anh ta \u00e9p c\u1ea3 l\u00e0ng b\u1ecf phi\u1ebfu l\u1ea1i trong c\u00f9ng ng\u00e0y.',
  say:'Stuttering Judge, wake up and show me the sign you will use to demand a second vote.',
  sayVi:'Quan Toà Nói Lắp thức dậy và ra dấu hiệu bí mật để yêu cầu vòng bầu thứ hai.'},
 {id:'wolfhound',name:'The Wolf Hound',vi:'Sói Chó',team:'village',set:'Characters',max:1,n1:30,
  d:'On the first night, secretly chooses to be a Villager or a Werewolf for the whole game.', dVi:'\u0110\u00eam \u0111\u1ea7u ti\u00ean, b\u00ed m\u1eadt ch\u1ecdn l\u00e0m D\u00e2n l\u00e0ng hay Ma S\u00f3i cho c\u1ea3 v\u00e1n.',
  say:'Wolf Hound, wake up. Choose your side now: villager, or werewolf.',
  sayVi:'Sói Chó thức dậy. Chọn phe của mình ngay bây giờ: dân làng, hay ma sói.',special:'hound'},
 {id:'wildchild',name:'The Wild Child',vi:'Đứa Trẻ Hoang',team:'village',set:'Characters',max:1,n1:34,
  d:'Chooses a model on the first night. If the model ever dies, he becomes a werewolf.', dVi:'\u0110\u00eam \u0111\u1ea7u ti\u00ean ch\u1ecdn m\u1ed9t h\u00ecnh m\u1eabu. N\u1ebfu h\u00ecnh m\u1eabu ch\u1ebft, c\u1eadu ta ho\u00e1 th\u00e0nh ma s\u00f3i.',
  say:'Wild Child, wake up and choose the player who will be your model.',
  sayVi:'Đứa Trẻ Hoang thức dậy và chọn một người làm hình mẫu của mình.',pick:1,special:'model'},
 {id:'sisters',name:'The Two Sisters',vi:'Hai Chị Em',team:'village',set:'Characters',min:2,max:2,exact:2,n1:40,every:42,
  d:'Wake together to learn each other, and may wake briefly each night to confer in silence.', dVi:'Th\u1ee9c c\u00f9ng nhau \u0111\u1ec3 nh\u1eadn m\u1eb7t, v\u00e0 m\u1ed7i \u0111\u00eam c\u00f3 th\u1ec3 th\u1ee9c m\u1ed9t ch\u00fat \u0111\u1ec3 b\u00e0n b\u1ea1c trong im l\u1eb7ng.',
  say:'Two Sisters, wake up and look at one another.',
  sayVi:'Hai Chị Em thức dậy và nhìn mặt nhau.'},
 {id:'brothers',name:'The Three Brothers',vi:'Ba Anh Em',team:'village',set:'Characters',min:3,max:3,exact:3,n1:44,every:46,
  d:'Wake together to learn each other, and may wake briefly each night to confer in silence.', dVi:'Th\u1ee9c c\u00f9ng nhau \u0111\u1ec3 nh\u1eadn m\u1eb7t, v\u00e0 m\u1ed7i \u0111\u00eam c\u00f3 th\u1ec3 th\u1ee9c m\u1ed9t ch\u00fat \u0111\u1ec3 b\u00e0n b\u1ea1c trong im l\u1eb7ng.',
  say:'Three Brothers, wake up and look at one another.',
  sayVi:'Ba Anh Em thức dậy và nhìn mặt nhau.'},
 {id:'guard',name:'Bodyguard',vi:'Bảo Vệ',team:'village',set:'Base',only:'vn',max:1,n1:47,every:47,
  d:'Each night protects one player. If the werewolves attack that player, nobody dies. He may not protect the same person on two nights in a row. Standard in Vietnamese play; not in the original Miller’s Hollow box.', dVi:'M\u1ed7i \u0111\u00eam che ch\u1edf m\u1ed9t ng\u01b0\u1eddi. N\u1ebfu ma s\u00f3i t\u1ea5n c\u00f4ng ng\u01b0\u1eddi \u0111\u00f3 th\u00ec kh\u00f4ng ai ch\u1ebft. Kh\u00f4ng \u0111\u01b0\u1ee3c che c\u00f9ng m\u1ed9t ng\u01b0\u1eddi hai \u0111\u00eam li\u1ec1n. Chu\u1ea9n trong l\u1ed1i ch\u01a1i Vi\u1ec7t Nam; h\u1ed9p g\u1ed1c Miller\u2019s Hollow kh\u00f4ng c\u00f3 l\u00e1 n\u00e0y.',
  say:'Bodyguard, wake up and choose one person to shield tonight.',
  sayVi:'Bảo Vệ thức dậy và chọn một người để che chở đêm nay.',pick:1,special:'guard'},
 {id:'littlegirl',name:'Little Girl',vi:'Bé Gái',team:'village',set:'Base',max:1,n1:48,
  d:'May peek through her fingers while the werewolves are awake, at her own risk.', dVi:'C\u00f3 th\u1ec3 h\u00e9 m\u1eaft nh\u00ecn tr\u1ed9m qua k\u1ebd tay khi ma s\u00f3i \u0111ang th\u1ee9c, v\u00e0 t\u1ef1 ch\u1ecbu r\u1ee7i ro.',
  say:'Little Girl, show yourself to me only, then close your eyes.',
  sayVi:'Bé Gái cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'fox',name:'The Fox',vi:'Cáo',team:'village',set:'Characters',max:1,n1:50,every:50,
  d:'Each night sniffs a player and their two living neighbours. If no werewolf is among them, he loses his power.', dVi:'M\u1ed7i \u0111\u00eam ng\u1eedi m\u1ed9t ng\u01b0\u1eddi c\u00f9ng hai ng\u01b0\u1eddi s\u1ed1ng b\u00ean c\u1ea1nh. N\u1ebfu trong ba ng\u01b0\u1eddi kh\u00f4ng c\u00f3 s\u00f3i, anh ta m\u1ea5t ph\u00e9p.',
  say:'Fox, wake up. Point to a player and I will tell you whether a werewolf hides among them and their neighbours.',
  sayVi:'Cáo thức dậy. Chỉ vào một người, tôi sẽ cho biết trong ba người đó có sói hay không.',pick:1,special:'fox'},
 {id:'actor',name:'The Actor',vi:'Diễn Viên',team:'village',set:'Characters',max:1,n1:52,every:52,
  d:'Three character cards are placed face up. Each night he may use one of them, once each.', dVi:'Ba l\u00e1 nh\u00e2n v\u1eadt \u0111\u01b0\u1ee3c l\u1eadt ng\u1eeda. M\u1ed7i \u0111\u00eam anh ta c\u00f3 th\u1ec3 d\u00f9ng m\u1ed9t l\u00e1, m\u1ed7i l\u00e1 m\u1ed9t l\u1ea7n.',
  say:'Actor, wake up. Choose which of your three characters you play tonight.',
  sayVi:'Diễn Viên thức dậy. Chọn nhân vật bạn sẽ dùng đêm nay.'},
 {id:'seer',name:'Seer',vi:'Tiên Tri',team:'village',set:'Base',max:1,n1:55,every:55,
  d:'Each night, looks at one player. In the original rules she sees the exact card; in Vietnamese play she learns only whether they are on the werewolf side.', dVi:'M\u1ed7i \u0111\u00eam soi m\u1ed9t ng\u01b0\u1eddi. Theo lu\u1eadt g\u1ed1c c\u00f4 th\u1ea5y \u0111\u00fang l\u00e1 b\u00e0i; theo l\u1ed1i Vi\u1ec7t Nam c\u00f4 ch\u1ec9 bi\u1ebft ng\u01b0\u1eddi \u0111\u00f3 c\u00f3 thu\u1ed9c phe s\u00f3i hay kh\u00f4ng.',
  say:'Seer, wake up. Point to the player whose true nature you wish to see.',
  sayVi:'Tiên Tri thức dậy. Chỉ vào người mà bạn muốn soi.',pick:1},
 {id:'wolf',name:'Werewolf',vi:'Ma Sói',team:'wolf',set:'Base',max:8,n1:60,every:60,
  d:'Wakes each night with the pack and agrees on one victim.', dVi:'M\u1ed7i \u0111\u00eam th\u1ee9c c\u00f9ng b\u1ea7y v\u00e0 th\u1ed1ng nh\u1ea5t m\u1ed9t n\u1ea1n nh\u00e2n.',
  say:'Werewolves, wake up. Recognise each other, and choose your victim.',
  sayVi:'Ma Sói thức dậy. Nhìn nhau nhận đồng đội, và chọn nạn nhân đêm nay.',pick:1},
 {id:'whitewolf',name:'White Werewolf',vi:'Sói Trắng',team:'wolf',set:'Characters',max:1,n1:65,every:65,alt:true,
  d:'Wakes with the pack, then again every second night to devour a werewolf. Wins alone.', dVi:'Th\u1ee9c c\u00f9ng b\u1ea7y, r\u1ed3i c\u1ee9 c\u00e1ch m\u1ed9t \u0111\u00eam l\u1ea1i th\u1ee9c th\u00eam \u0111\u1ec3 \u0103n m\u1ed9t con s\u00f3i. Th\u1eafng m\u1ed9t m\u00ecnh.',
  say:'White Werewolf, wake up. You may devour one of your own. Point, or shake your head.',
  sayVi:'Sói Trắng thức dậy. Bạn có thể ăn một con sói. Hãy chỉ, hoặc lắc đầu.',pick:1},
 {id:'witch',name:'Witch',vi:'Phù Thuỷ',team:'village',set:'Base',max:1,n1:70,every:70,
  d:'One healing potion and one poison, each usable once in the whole game.', dVi:'M\u1ed9t thu\u1ed1c c\u1ee9u v\u00e0 m\u1ed9t thu\u1ed1c \u0111\u1ed9c, m\u1ed7i lo\u1ea1i d\u00f9ng \u0111\u01b0\u1ee3c \u0111\u00fang m\u1ed9t l\u1ea7n c\u1ea3 v\u00e1n.',
  say:'Witch, wake up. This is the victim. Will you save them? Will you poison anyone?',
  sayVi:'Phù Thuỷ thức dậy. Đây là nạn nhân đêm nay. Bạn có cứu không? Có dùng thuốc độc không?',special:'witch'},
 {id:'piper',name:'The Pied Piper',vi:'Người Thổi Sáo',team:'solo',set:'Characters',max:1,n1:80,every:80,
  d:'Charms two players each night. Wins alone the moment every other living player is charmed.', dVi:'M\u1ed7i \u0111\u00eam m\u00ea ho\u1eb7c hai ng\u01b0\u1eddi. Th\u1eafng m\u1ed9t m\u00ecnh ngay khi m\u1ecdi ng\u01b0\u1eddi c\u00f2n s\u1ed1ng \u0111\u1ec1u \u0111\u00e3 b\u1ecb m\u00ea.',
  say:'Pied Piper, wake up and charm two players.',
  sayVi:'Người Thổi Sáo thức dậy và mê hoặc hai người.',pick:2,special:'charm'},
 {id:'hunter',name:'Hunter',vi:'Thợ Săn',team:'village',set:'Base',max:1,n1:82,
  d:'When he dies he must immediately shoot one living player — the shot is compulsory, not a choice. Vietnamese play denies him the shot if the Witch poisoned him; Miller’s Hollow lets him fire whatever killed him.', dVi:'Khi ch\u1ebft anh ta ph\u1ea3i b\u1eafn ngay m\u1ed9t ng\u01b0\u1eddi c\u00f2n s\u1ed1ng \u2014 ph\u00e1t s\u00fang l\u00e0 b\u1eaft bu\u1ed9c, kh\u00f4ng ph\u1ea3i l\u1ef1a ch\u1ecdn. L\u1ed1i Vi\u1ec7t Nam kh\u00f4ng cho b\u1eafn n\u1ebfu b\u1ecb Ph\u00f9 Thu\u1ef7 \u0111\u1ea7u \u0111\u1ed9c; Miller\u2019s Hollow cho b\u1eafn d\u00f9 ch\u1ebft v\u00ec l\u00fd do g\u00ec.',
  say:'Hunter, show yourself to me only, then close your eyes.',
  sayVi:'Thợ Săn cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'elder',name:'The Elder',vi:'Trưởng Lão',team:'village',set:'Characters',max:1,n1:84,
  d:'Survives the first werewolf attack. If the village kills him — the vote, the Witch’s poison or the Hunter’s shot — every villager loses their power. A werewolf kill does not cost the village anything.', dVi:'S\u1ed1ng s\u00f3t qua l\u1ea7n t\u1ea5n c\u00f4ng \u0111\u1ea7u ti\u00ean c\u1ee7a ma s\u00f3i. N\u1ebfu d\u00e2n l\u00e0ng gi\u1ebft \u00f4ng \u2014 b\u1eb1ng phi\u1ebfu b\u1ea7u, thu\u1ed1c \u0111\u1ed9c c\u1ee7a Ph\u00f9 Thu\u1ef7 hay ph\u00e1t s\u00fang c\u1ee7a Th\u1ee3 S\u0103n \u2014 to\u00e0n b\u1ed9 ph\u00e9p c\u1ee7a d\u00e2n l\u00e0ng m\u1ea5t s\u1ea1ch. S\u00f3i gi\u1ebft th\u00ec l\u00e0ng kh\u00f4ng m\u1ea5t g\u00ec.',
  say:'Elder, show yourself to me only, then close your eyes.',
  sayVi:'Trưởng Lão cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'knight',name:'Knight with the Rusty Sword',vi:'Hiệp Sĩ Kiếm Rỉ',team:'village',set:'Characters',max:1,n1:86,
  d:'When the werewolves kill him, the first werewolf clockwise from him dies of infection the next night.', dVi:'Khi ma s\u00f3i gi\u1ebft anh ta, con s\u00f3i \u0111\u1ea7u ti\u00ean theo chi\u1ec1u kim \u0111\u1ed3ng h\u1ed3 s\u1ebd ch\u1ebft v\u00ec nhi\u1ec5m r\u1ec9 s\u00e9t v\u00e0o \u0111\u00eam sau.',
  say:'Knight, show yourself to me only, then close your eyes.',
  sayVi:'Hiệp Sĩ Kiếm Rỉ cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'beartamer',name:'Bear Tamer',vi:'Người Dạy Gấu',team:'village',set:'Characters',max:1,n1:88,
  d:'Each dawn the moderator growls if either living neighbour is a werewolf.', dVi:'M\u1ed7i s\u00e1ng qu\u1ea3n tr\u00f2 g\u1ea7m l\u00ean n\u1ebfu m\u1ed9t trong hai ng\u01b0\u1eddi s\u1ed1ng b\u00ean c\u1ea1nh l\u00e0 ma s\u00f3i.',
  say:'Bear Tamer, show yourself to me only, then close your eyes.',
  sayVi:'Người Dạy Gấu cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'angel',name:'The Angel',vi:'Thiên Thần',team:'solo',set:'Characters',max:1,n1:90,
  d:'Wins immediately and alone if eliminated on the first day\u2019s vote, or taken on the first night.', dVi:'Th\u1eafng ngay l\u1eadp t\u1ee9c v\u00e0 m\u1ed9t m\u00ecnh n\u1ebfu b\u1ecb lo\u1ea1i b\u1eb1ng phi\u1ebfu b\u1ea7u ng\u00e0y \u0111\u1ea7u ti\u00ean, ho\u1eb7c b\u1ecb \u0103n \u0111\u00eam \u0111\u1ea7u ti\u00ean.',
  say:'Angel, show yourself to me only, then close your eyes.',
  sayVi:'Thiên Thần cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'idiot',name:'Village Idiot',vi:'Thằng Ngốc',team:'village',set:'Characters',max:1,n1:92,
  d:'If voted out he is revealed and spared, but loses the right to vote forever.', dVi:'N\u1ebfu b\u1ecb b\u1ecf phi\u1ebfu treo c\u1ed5 th\u00ec \u0111\u01b0\u1ee3c l\u1eadt b\u00e0i v\u00e0 tha m\u1ea1ng, nh\u01b0ng m\u1ea5t quy\u1ec1n b\u1ecf phi\u1ebfu v\u0129nh vi\u1ec5n.',
  say:'Village Idiot, show yourself to me only, then close your eyes.',
  sayVi:'Thằng Ngốc cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'scapegoat',name:'Scapegoat',vi:'Vật Tế Thần',team:'village',set:'Characters',max:1,n1:94,
  d:'If the village vote ties, he dies instead \u2014 and as he goes he decides who may vote tomorrow.', dVi:'N\u1ebfu phi\u1ebfu c\u1ee7a l\u00e0ng ho\u00e0, anh ta ch\u1ebft thay \u2014 v\u00e0 l\u00fac ch\u1ebft anh ta quy\u1ebft \u0111\u1ecbnh ai \u0111\u01b0\u1ee3c b\u1ecf phi\u1ebfu ng\u00e0y mai.',
  say:'Scapegoat, show yourself to me only, then close your eyes.',
  sayVi:'Vật Tế Thần cho tôi thấy mặt, rồi nhắm mắt lại.'},
 {id:'servant',name:'Devoted Servant',vi:'Người Hầu Trung Thành',team:'village',set:'Characters',max:1,n1:96,
  d:'At the moment somebody is eliminated \u2014 before their card is turned up, if your table turns them \u2014 she may show her own and take their role instead.', dVi:'Ngay l\u00fac m\u1ed9t ng\u01b0\u1eddi b\u1ecb lo\u1ea1i \u2014 tr\u01b0\u1edbc khi l\u1eadt b\u00e0i c\u1ee7a h\u1ecd, n\u1ebfu b\u00e0n b\u1ea1n c\u00f3 l\u1eadt \u2014 c\u00f4 c\u00f3 th\u1ec3 l\u1eadt b\u00e0i m\u00ecnh ra v\u00e0 nh\u1eadn l\u1ea5y vai c\u1ee7a ng\u01b0\u1eddi \u0111\u00f3.',
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
/* ==========================================================================
   INTERFACE LANGUAGE.  Separate from the ruleset, which it used to ride on: G.rules
   === 'vn' meant both "Vietnamese call order" and "Vietnamese labels", so a table that
   wanted the Miller's Hollow rules got an English interface as a side effect of a
   decision about the rules. They are two different questions and now have two switches.

   Every label that reads "Xáo bộ mới · Shuffle" says everything twice, and a moderator
   only ever reads one side of the middot. One language, chosen once. Both survive only
   where the second language IS the content: the read-aloud line, and role names, which a
   table argues about in both.
========================================================================== */
const vnUI = () => prefs.lang !== 'en';
const T = (vi, en) => vnUI() ? vi : en;
/* A role's name in the interface language. This was an inline ruleset test in nine
   places, which is what made choosing Miller's Hollow rename every card in the app. */
const rName = r => T(r.vi, r.name);
/* A role's description, which the night call puts under the heading and the deck list puts
   in the row. English-only until now, so a Vietnamese moderator read an English paragraph
   on every single night step. Falls back to the English rather than to nothing, so a role
   added without a dVi still says something. */
const rDesc = r => T(r.dVi || r.d, r.d);
/* Which physical box a card came from, in the interface language. */
const provLabel = set => vnUI()
  ? (set === 'Characters' ? 'Mở rộng' : 'Cơ bản')
  : (set === 'Characters' ? 'Expansion' : 'Base');
/* One monochrome glyph per role, tinted by the team it is on. The tint is the reason
   rows no longer carry a separate coloured dot: the icon and the dot were saying the
   same thing twice, six pixels apart. teamOf() rather than r.team for a player, so a
   turned Wild Child or a Wolf Hound that chose the pack shows the side it is actually on. */
const icSvg = (id, team) => '<svg class="ic tm-' + (team || 'none') + '" viewBox="0 0 24 24" ' +
  'aria-hidden="true"><use href="#i-' + String(id).replace(/^__/, 'x-') + '"/></svg>';
const icOf  = id => (R[id] || id === '__lovers') ? icSvg(id, R[id] && R[id].team) : '';
const pIcon = p => p.role ? icSvg(p.role, teamOf(p)) : '<span class="ic none"><i>?</i></span>';
// The Vietnamese public order differs from the French original in one place:
// the Seer is called AFTER the pack, and she learns only wolf-or-not.
// Everything else in the quoted order matches: Ăn trộm, Cupid, Cặp đôi,
// Bảo vệ, Ma Sói, Tiên tri, Phù thuỷ.
/* The Vietnamese order's principle is that the information roles are called after
   the pack. That applies to the Fox exactly as it does to the Seer: both are asleep
   while the wolves choose, and wolf membership cannot change mid-night (the Hound
   picks at 30, and every death resolves at dawn), so moving them is neutral for the
   players and means the moderator already knows the pack when they must answer. */
/* The ruleset NAME is a proper noun and stays as it is; the gloss beside it is a label,
   and it was Vietnamese in both directions — an English interface still read
   "Miller’s Hollow (bản gốc)". A function, not a string: T() has to be
   evaluated when the label is drawn, not when this table is built. */
const RULESETS = { vn:{ label:() => 'Ma S\u00f3i Vi\u1ec7t Nam', over:{ fox:61, seer:62 } },
                   mh:{ label:() => T('Miller\u2019s Hollow (b\u1ea3n g\u1ed1c)',
                                      'Miller\u2019s Hollow (original)'), over:{} } };
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
/* Which language the read-aloud card shows underneath. A view preference, not game
   state, so it stays out of G and out of the save. */
let altLang = false;
const undoStack = [];
function blank(){
  return { players:[], counts:{}, night:0, day:0, phase:'players', log:[],
    steps:[], si:0, n:{}, dawn:[], pending:{},
    witchHeal:true, witchPoison:true, foxPower:true, elderLife:true,
    powersLost:false, judgeUsed:false, houndSide:null, sheriffDone:false,
    infectNext:null, over:null, scapegoatVoters:null, scapegoatDay:null, assignTo:null, knewDeal:false, rules:'vn', lastGuard:null,
    selfHeal:null, hunterPoison:null, hunterElder:null, showCards:null, hunterNight:null,
    elderRevenge:null, voteMajority:null, nightShotTaken:false, resume:'night', votes:{}, sheriffVote:null, showAllRoles:false, scope:'chars',
    dawnWhy:[], dawnSure:true, dawnEdit:false, elderAbsorbed:false };
}
G = blank();
/* Eighty snapshots of a twenty-player game with a full chronicle is a live buffer of a
   few megabytes, held on a phone that has been awake in someone's hand for an hour. The
   count alone did not bound it, because the thing being counted grows all game. */
const UNDO_MAX = 80, UNDO_BYTES = 1.5 * 1024 * 1024;
let undoBytes = 0;
function snap(){
  const s = JSON.stringify(G);
  undoStack.push(s); undoBytes += s.length;
  while (undoStack.length > UNDO_MAX || (undoBytes > UNDO_BYTES && undoStack.length > 1))
    undoBytes -= undoStack.shift().length;
}
function clearUndo(){ undoStack.length = 0; undoBytes = 0; }

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
    // A save written before names were sanitised would put a payload straight back
    // into the DOM on resume, so they are cleaned on the way out of storage too.
    for (const p of box.g.players) p.name = safeName(p.name);
    if (Date.now() - box.at > 12 * 3600 * 1000) return null;   // yesterday's game is not a resume
    return box;
  } catch (e){ return null; }
}
function dropSaved(){ try { localStorage.removeItem(SAVE_KEY); } catch (e){} }

/* ==========================================================================
   HOW MANY GAMES THIS DEVICE HAS FINISHED.  The teaching layer is the best writing in
   the app and there is far too much of it in a running game: a Seer step whose card is
   unknown carried a sub-heading, a target note, a ruleset note, an alert and a
   four-bullet masking card. All of it earned its place the first time somebody
   moderated. By the third game it is scenery, and the moderator scrolls past it while
   nine people wait — but nothing was counting, so it stayed at full volume forever.

   The collapsibles were the right instinct and they only solve it once: expOpen
   remembers what you opened, and nothing remembered that you no longer need any of it.
   Its own key, because experience outlives any single game and must survive the save
   being cleared at the end of one.
========================================================================== */
const GAMES_KEY = 'mh.games';
let gamesPlayed = 0;
try { gamesPlayed = parseInt(localStorage.getItem(GAMES_KEY), 10) || 0; } catch (e){}
function countGame(){
  gamesPlayed++;
  try { localStorage.setItem(GAMES_KEY, String(gamesPlayed)); } catch (e){}
}

/* DEVICE PREFERENCES, not game state. Both of these started in G, which is what a new
   game replaces \u2014 so "Same table, new game" forgot them, and the moderator most likely
   to fold the tips away is the experienced one, who starts the most games. The asymmetry
   gave it away: gamesPlayed, the automatic guess, was given its own key precisely so it
   would outlive a game; the two controls that OVERRULE that guess were left in the object
   that gets thrown away.

   They also have no business in the undo buffer or the save file. Switching language is
   not a move Undo should reverse. */
const PREF_KEY = 'mh.prefs';
const prefs = { lang: (/^vi\b/i.test(navigator.language || '') ? 'vi' : 'en'), tips: null };
try {
  const raw = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
  if (raw.lang === 'vi' || raw.lang === 'en') prefs.lang = raw.lang;
  if (raw.tips === true || raw.tips === false) prefs.tips = raw.tips;
} catch (e){ /* storage unavailable; the browser default stands */ }
function setPref(k, v){
  prefs[k] = v;
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e){}
}
/* Nothing is ever deleted \u2014 it stops being the default. Two games, because the first one
   teaches the flow and the second confirms it. null now means "not yet chosen on this
   device" rather than "not yet chosen in this game". */
const teaching = () => prefs.tips == null ? gamesPlayed < 2 : prefs.tips;
function undo(){
  if (!undoStack.length) return;
  const s = undoStack.pop(); undoBytes -= s.length;
  G = JSON.parse(s); render();
}

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
/* "Every villager loses their power" means EVERY power, not only the ones that wake at
   night. G.powersLost used to gate the night call list and nothing else, so after the
   village killed the Elder the Hunter still fired, the Idiot still walked away from the
   vote, the Scapegoat still died in place of a tie, the Bear Tamer still growled, the
   Knight's rust still spread and the Judge could still demand a second vote — six powers
   the village had just been stripped of, all of them triggered somewhere other than a
   night step. Read teamOf, not the card, so a Wild Child who has already turned keeps
   what being a wolf gives him.
   The Sheriff's badge is deliberately NOT covered: it is a title the village votes on,
   not a card, and it survives everything else too. */
const powerGone = p => !!(G.powersLost && p && teamOf(p) === 'village');
// The app must never infer a role it has not been told. Anything it computes
// from cards has to check this first, or it will answer confidently and wrongly.
// The badge is a title, not a card. Miller’s Hollow weights it at a flat double;
// Vietnamese and 狼人杀 tables usually use 1.5 so it cannot outvote two people alone.
const SHERIFF_WEIGHT = () => G.rules === 'vn' ? '1.5 votes' : '2 votes';

/* Three points tables argue about. null means "follow the published rule"; true or false
   is a deliberate house ruling that survives switching ruleset. */
const witchMaySaveSelf   = () => G.selfHeal     == null ? G.rules !== 'vn' : G.selfHeal;
const hunterFiresPoisoned = () => G.hunterPoison == null ? G.rules !== 'vn' : G.hunterPoison;
/* Does the Hunter still shoot once the village has killed the Elder and taken every
   villager power with it? Unlike the two above, this is NOT a split between the
   traditions — no ruleset I can find addresses the interaction, so the default is the
   same under both. It is here because the two cards read past each other: the Elder's
   revenge cancels the villagers' powers and names no exception, while the Hunter's own
   card says he fires "if he is killed by any reason", which sounds absolute. Default is
   no shot — the shot is a power, and the power is gone. */
const hunterFiresPowerless = () => G.hunterElder == null ? false : G.hunterElder;
/* Does the Elder's death cost the village its powers AT ALL? Both rulesets print that it
   does, so the default is yes under each. It is settable because the revenge is the
   harshest rule in the box \u2014 one mis-aimed vote and seven cards stop working for the rest
   of the game \u2014 and plenty of tables simply do not play it.

   This sits ABOVE the Hunter question rather than beside it. Asked at a table: "is there
   an option where the Hunter can shoot after the Elder dies, but the rest of the villagers
   keep their skills?" There was not: hunterElder exempts the Hunter alone and leaves the
   other six stripped. Turning this off is the answer to that question, and it makes the
   Hunter row moot \u2014 which the panel now says out loud rather than leaving two settings
   that look independent and are not. */
const elderStripsPowers = () => G.elderRevenge == null ? true : G.elderRevenge;
/* Does a name have to clear HALF the voting weight to be hanged, or is the most votes
   enough? Both rulebooks say the most votes: "the player with the most fingers pointing
   at them is convicted", with a re-vote on a tie and nobody hanged if it stays tied.
   Vietnamese play is the same \u2014 ng\u01b0\u1eddi nhi\u1ec1u phi\u1ebfu nh\u1ea5t b\u1ecb treo.

   This app required an absolute majority, which is not a rule either box prints, and it
   is not a harmless stricter reading: on eight voters a decisive 4/3/1 split offered the
   moderator no way to hang anybody, and the bar asked for a fifth vote that did not
   exist. The bigger the table the more the votes spread, so it got worse as it mattered
   more. Default is now the printed rule; a table that really does demand a majority can
   still ask for one. */
const voteNeedsMajority = () => G.voteMajority == null ? false : G.voteMajority;
/* Is a dead player's card turned face up? Miller’s Hollow reveals every elimination,
   night or day, with no exception — which is why the Devoted Servant's window is defined
   as "before an eliminated player's card is revealed". Vietnamese tables commonly do not
   (không lật bài), because hidden cards make the deduction harder.
   The app used to say nothing either way, at any death, while shipping a Servant whose
   card presupposed a reveal step that never happened. */
const cardsShownOnDeath = () => G.showCards == null ? G.rules !== 'vn' : G.showCards;
/* A Hunter eaten in the night: is the shot taken publicly at dawn, or privately while the
   table still has its eyes shut? Public is the published flow and the default under both
   rulesets \u2014 no ruleset describes the private variant, so this must not claim one.
   It exists because the shot is the one power that cannot be hidden: a dead player points
   and somebody drops, which tells the table who he was whatever the card rule says. A
   table that keeps cards face down can take the target in the night and announce both
   deaths together at dawn, explaining neither. Reachable only for a NIGHT death \u2014 a
   Hunter voted out fires in daylight, and nothing hides that. */
const hunterShootsInTheNight = () => G.hunterNight == null ? false : G.hunterNight;
/* What to tell the moderator at the moment a death becomes public. The Idiot is the one
   card that overrides the setting: being shown is HOW the village learns to spare him, so
   a table that hides every other card still has to turn his. */
function revealNote(dead){
  const idiot = (dead || []).filter(p => p && p.role === 'idiot' && p.revealed);
  const show = cardsShownOnDeath();
  const parts = [];
  if (show) parts.push(T('<b>L\u1eadt b\u00e0i c\u1ee7a h\u1ecd l\u00ean</b> cho c\u1ea3 b\u00e0n th\u1ea5y h\u1ecd l\u00e0 ai.', '<b>Turn their card face up</b> so the table sees who they were.'));
  else parts.push(T('<b>\u0110\u1ec3 b\u00e0i \u00fap.</b> Ch\u1ec9 \u0111\u1ecdc t\u00ean \u2014 b\u00e0n n\u00e0y kh\u00f4ng l\u1eadt b\u00e0i.', '<b>Leave their card face down.</b> Announce the name only — this table does not reveal.'));
  if (idiot.length) parts.push((show ? '' : T('Tr\u1eeb ','Except ')) + idiot.map(p => p.name).join(', ') +
    T(': Th\u1eb1ng Ng\u1ed1c lu\u00f4n ph\u1ea3i l\u1eadt, kh\u00f4ng th\u00ec d\u00e2n l\u00e0ng kh\u00f4ng c\u00f3 l\u00fd do \u0111\u1ec3 tha.', ': the Village Idiot must be shown either way, or the village has no reason to spare him.'));
  return parts.join(' ');
}
const fmtN = n => (Math.round(n * 100) / 100).toString();

/* The two UI controls use the same monochrome sprite as the roles. This replaced a
   Nerd Font probe with a Unicode fallback: the font is almost never installed, so in
   practice it drew an emoji shuffle glyph — which, once the role emoji were gone, was
   the only saturated object left on the screen. */
const icon = k => '<svg class="uic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ui-' + k + '"/></svg>';
// Who actually holds a vote today, and what the whole table is worth.
function votePower(p){ return p.sheriff ? (G.rules === 'vn' ? 1.5 : 2) : 1; }
/* "As he dies he decides who may vote tomorrow." One day. The list used to be cleared
   only by the "Everyone may vote" button on the screen that set it, so a tie on day 2
   silenced the same people for the rest of the game — and because eligibleVoters feeds
   totalPower, which sets the threshold, every later vote was measured against the wrong
   arithmetic. Scoped by the day it governs, the same shape as G.lastGuard. */
const scapegoatBinds = () => !!(G.scapegoatVoters && G.scapegoatDay === G.day);
function eligibleVoters(){
  let list = alive().filter(p => !p.voteless);
  if (scapegoatBinds()) list = list.filter(p => G.scapegoatVoters.includes(p.id));
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
    case 'wolf':      return T('B\u1ea7y kh\u00f4ng \u0103n \u0111\u1ed3ng lo\u1ea1i, n\u00ean nh\u1eefng con s\u00f3i \u0111\u00e3 bi\u1ebft kh\u00f4ng n\u1eb1m trong danh s\u00e1ch.', 'The pack cannot devour one of its own, so known werewolves are not listed.');
    case 'whitewolf': return T('S\u00f3i Tr\u1eafng ch\u1ec9 \u0103n \u0111\u1ed3ng lo\u1ea1i, n\u00ean ch\u1ec9 li\u1ec7t k\u00ea ma s\u00f3i.', 'He devours only his own kind, so only werewolves are listed.');
    case 'seer':      return T('Ti\u00ean Tri \u0111\u00e3 bi\u1ebft l\u00e1 c\u1ee7a m\u00ecnh, n\u00ean kh\u00f4ng c\u00f3 t\u00ean.', 'She already knows her own card, so she is not listed.');
    case 'piper':     return T('Ng\u01b0\u1eddi Th\u1ed5i S\u00e1o th\u1eafng khi m\u1ecdi ng\u01b0\u1eddi kh\u00e1c b\u1ecb m\u00ea, n\u00ean kh\u00f4ng c\u00f3 t\u00ean.', 'He wins when every other living player is charmed, so he is not listed.');
    case 'wildchild': return T('Kh\u00f4ng th\u1ec3 t\u1ef1 l\u1ea5y m\u00ecnh l\u00e0m h\u00ecnh m\u1eabu.', 'He cannot be his own model.');
    case 'guard':     return T('C\u00f3 th\u1ec3 t\u1ef1 che ch\u1edf, nh\u01b0ng kh\u00f4ng \u0111\u01b0\u1ee3c che c\u00f9ng m\u1ed9t ng\u01b0\u1eddi hai \u0111\u00eam li\u1ec1n.', 'He may shield himself, but never the same person twice running.');
    default:          return '';
  }
}
/* What the app was asked and could not answer. computeDawn reads it to decide whether it
   may call the night certain, so anything that walks past a step without recording here
   produces a dawn the app has no standing to be sure about.

   Two kinds, because they fail differently: an ACTION not taken tonight ('the Witch did
   nothing'), and a CARD nobody would answer for, which is a hole in what the app knows
   rather than a thing that did not happen. */
function noteSkip(id, kind){
  if (!id || id === '__lovers') return;
  const key = kind === 'card' ? 'noCard' : 'skipped';
  G.n[key] = G.n[key] || [];
  if (!G.n[key].includes(id)) G.n[key].push(id);
}
/* Every Skip in the app goes through here. Four of the five used to advance G.si on
   their own — the roll call, the Witch, the Wolf Hound and the Thief — so skipping the
   Bodyguard left the gap list empty and dawn called itself certain. */
function skipStep(kind){
  const s = G.steps[G.si];
  snap();
  if (s) noteSkip(s.role, kind);
  G.si++;
  render();
}
// Does this card do anything on the first night beyond identifying itself?
// If the deal was collected up front, the identification-only cards need no call.
const acts1 = r => !!(r.pick || r.special || r.every || r.id === 'judge');
const liveWith = id => G.players.filter(p => p.alive && p.role === id);
const withRole = id => G.players.filter(p => p.role === id);
const unassigned = () => G.players.filter(p => !p.role);
/* The chronicle's left column. Written at the moment the entry is, like the entry itself
   — see the note on log() below. */
function label(){
  if (G.phase === 'night' || G.phase === 'dawn') return T('\u0110\u00eam ', 'Night ') + G.night;
  if (G.phase === 'day' || G.phase === 'hunter' || G.phase === 'sheriff' || G.phase === 'scapegoat')
    return T('Ng\u00e0y ', 'Day ') + G.day;
  return T('Chu\u1ea9n b\u1ecb', 'Setup');
}
/* An entry is rendered to a string HERE, in the language in force when it happened, and
   never re-rendered. That is safe because the language chooser lives on the deck screen
   and is unreachable once the first night starts: a game cannot change language midway,
   so a chronicle cannot end up half in each. A resumed save from a game played in the
   other language keeps its own words, which is what a record should do. */
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
/* Names reach the DOM through string concatenation in about seventy places, so they
   are made inert here, where they enter, rather than escaped at every use — one
   missed call site would still be a hole. Angle brackets are the only characters
   that can open a tag, and no name is ever placed inside an attribute. */
const safeName = s => (s || '').replace(/[<>]/g, '').trim().replace(/\s+/g, ' ');

function addPlayer(name){
  name = safeName(name);
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
  const plural = (n, vi, one, many) => T(vi, n > 1 ? many : one);
  if (seats < 6) out.push(['warn', T(
    'Miller\u2019s Hollow c\u1ea7n \u00edt nh\u1ea5t 6 ng\u01b0\u1eddi. T\u1eeb 8 tr\u1edf l\u00ean ch\u01a1i hay h\u01a1n nhi\u1ec1u.',
    'Miller\u2019s Hollow needs at least 6 players. Eight or more plays much better.')]);
  if (cards !== seats) out.push(['no', cards < seats
    ? T('Thi\u1ebfu ' + (seats-cards) + ' l\u00e1 n\u1eefa m\u1edbi \u0111\u1ee7 cho m\u1ecdi ch\u1ed7 ng\u1ed3i.',
        (seats-cards) + ' more card' + (seats-cards>1?'s':'') + ' needed to cover every seat.')
    : T('Th\u1eeba ' + (cards-seats) + ' l\u00e1 so v\u1edbi b\u00e0n n\u00e0y.',
        (cards-seats) + ' card' + (cards-seats>1?'s':'') + ' too many for this table.')]);
  const w = wolfCards(), rec = recWolves(seats);
  if (cards === seats && w === 0) out.push(['no', T(
    'B\u1ed9 b\u00e0i kh\u00f4ng c\u00f3 con ma s\u00f3i n\u00e0o.','There are no werewolves in the deck.')]);
  else if (cards === seats && seats >= 6 && w !== rec)
    out.push(['warn', T(
      'B\u00e0n ' + seats + ' ng\u01b0\u1eddi th\u00ec ' + rec + ' s\u00f3i l\u00e0 c\u00e2n b\u1eb1ng th\u01b0\u1eddng th\u1ea5y. B\u1ea1n \u0111ang \u0111\u1ec3 ' + w + '.',
      'With ' + seats + ' players, ' + rec + ' ' + (rec > 1 ? 'werewolves' : 'werewolf') +
      ' is the usual balance. You have ' + w + '.')]);
  for (const id in G.counts) if (R[id].only && R[id].only !== G.rules)
    out.push(['warn', T(
      R[id].vi + ' (' + R[id].name + ') kh\u00f4ng c\u00f3 trong h\u1ed9p ' + RULESETS[G.rules].label() +
        '. Gi\u1eef l\u1ea1i n\u1ebfu b\u00e0n b\u1ea1n ch\u01a1i th\u1ebf \u2014 b\u1ed9 \u0111\u1ec1 xu\u1ea5t v\u00e0 x\u00e1o b\u00e0i s\u1ebd b\u1ecf n\u00f3 ra.',
      R[id].name + ' (' + R[id].vi + ') is not in the ' + RULESETS[G.rules].label() +
        ' box. Keep it if your table plays that way \u2014 the suggested deck and the shuffle leave it out.')]);
  if (G.counts.thief) out.push(['warn', T(
    '\u0102n tr\u1ed9m c\u1ea7n hai l\u00e1 d\u01b0 ngo\u00e0i s\u1ed1 ng\u01b0\u1eddi ch\u01a1i. L\u1ea5y ch\u00fang ra kh\u1ecfi h\u1ed9p v\u00e0 \u0111\u1ec3 ri\u00eang.',
    'The Thief needs two extra cards beyond the number of players. Pull them from the box and keep them aside.')]);
  if (G.counts.cupid && seats < 4) out.push(['no', T(
    'Th\u1ea7n T\u00ecnh Y\u00eau c\u1ea7n \u00edt nh\u1ea5t 4 ng\u01b0\u1eddi.','Cupid needs at least 4 players.')]);
  if (G.counts.whitewolf && !G.counts.wolf) out.push(['warn', T(
    'S\u00f3i Tr\u1eafng kh\u00f4ng c\u00f3 b\u1ea7y n\u00e0o \u0111\u1ec3 \u0111i s\u0103n c\u00f9ng.','The White Werewolf has no pack to hunt with.')]);
  if (G.counts.sisters && G.counts.sisters !== 2) out.push(['no', T(
    'Hai Ch\u1ecb Em ph\u1ea3i \u0111\u00fang hai l\u00e1.','The Two Sisters must be exactly two.')]);
  if (G.counts.brothers && G.counts.brothers !== 3) out.push(['no', T(
    'Ba Anh Em ph\u1ea3i \u0111\u00fang ba l\u00e1.','The Three Brothers must be exactly three.')]);
  if (cards === seats && !out.some(o => o[0]==='no'))
    out.push(['ok', T('B\u1ed9 b\u00e0i \u0111\u00e3 s\u1eb5n s\u00e0ng: ' + cards + ' l\u00e1 cho ' + seats + ' ng\u01b0\u1eddi.',
      'Deck is ready: ' + cards + ' cards for ' + seats + ' players.')]);
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
      if (!G.counts[r.id]) continue;                        // not in this deck at all
      if (r.alt && G.night % 2 !== 0) continue;
      /* Powers lost is public — the Elder's death is announced — but the NUMBER of calls
         that vanish with them is not. Dropping every village card at once tells the table
         how many powered village cards the deck held, which is the same inference the hush
         four lines below exists to deny. These two rules sat in one loop reaching opposite
         conclusions from the same premise. Hushed, so the night keeps its shape. */
      if (G.powersLost && r.team === 'village'){
        steps.push({ role:r.id, hush:'powerless' });
        continue;
      }
      /* The step exists because the CARD is in play, not because the app happens to know
         who holds it. This used to be built from the identified holders, so a card nobody
         answered for at the roll call was dropped from every night that followed — not
         skipped for one night, gone for the whole game, with dawn still reporting itself
         certain. Setting it later from the Roster did not help either, because no later
         screen rebuilt the script. An unidentified card gets the same identification
         panel night one uses, which turns a silent omission into a question. */
      if (withRole(r.id).length < G.counts[r.id]){
        steps.push({ role:r.id, roll:true });
        continue;
      }
      /* A card that was in play and can no longer act is still CALLED. Dropping the step
         shortens the night in a way the whole table can hear: miss the Seer and everyone
         knows the Seer is dead, then narrows the rest by elimination. The moderator reads
         the same line and waits the same beat — only this screen knows nobody wakes. */
      const spent = (r.id === 'witch' && !G.witchHeal && !G.witchPoison) ||
                    (r.id === 'fox' && !G.foxPower);
      const hush = !liveWith(r.id).length ? 'dead' : spent ? 'spent' : null;
      steps.push(hush ? { role:r.id, hush } : { role:r.id });
    }
    steps.sort((a,b) => everyOf(R[a.role]) - everyOf(R[b.role]));
  }
  G.steps = steps; G.si = 0; G.n = {};
}
/* The Thief is the one move that changes which cards are AT THE TABLE mid-game: his own
   goes back to the spares and one of the two spares comes in. G.counts has to follow, and
   it did not — which used to be merely untidy (the Roster listed the Thief as unplaced
   forever) and became a real bug the moment buildNight started reading G.counts as the
   record of what is in play. A Thief who took a spare Fox was then never called again,
   because no Fox was ever in the deck: the same disappearance the deck-driven night was
   written to end, re-entering through the one path that moves a card without saying so. */
function thiefTakes(th, r){
  if (G.counts.thief) G.counts.thief--;
  if (!G.counts.thief) delete G.counts.thief;
  G.counts[r.id] = (G.counts[r.id] || 0) + 1;
  th.role = r.id;
    log(T('\u0102n tr\u1ed9m \u0111\u00e3 th\u00e0nh ' + rName(r) + '. L\u00e1 \u0111\u00f3 gi\u1edd \u1edf trong v\u00e1n, c\u00f2n \u0102n tr\u1ed9m th\u00ec kh\u00f4ng.',
      'The Thief became ' + r.name + '. That card is in play now, and the Thief is not.'));
}
function stepInfo(s){
  if (s.role === '__lovers') return { name:'The Lovers', vi:'Cặp Đôi',  id:'__lovers',
    d:'The two Lovers learn who they are.',
    dVi:'Hai ng\u01b0\u1eddi trong C\u1eb7p \u0110\u00f4i bi\u1ebft nhau l\u00e0 ai.',
    say:'Lovers, wake up and look at one another. You now win or lose together.',
    sayVi:'Cặp Đôi thức dậy và nhìn mặt nhau. Từ giờ hai người thắng hoặc chết cùng nhau.' };
  return R[s.role];
}

/* ========================== resolution ========================== */
/* Every death carries a CODE, and the sentence the moderator reads is derived from it.
   Two rules used to be decided by matching the display string instead — the Elder's
   consequence against a list of English phrases, and the poisoned Hunter against
   /poison/. One copy edit, or translating a cause, would have switched either rule off
   with nothing failing.

   village: the village itself did the killing. That is what costs the villagers their
   powers when the Elder is the one who dies. A werewolf kill does not: surviving one
   attack is the whole point of the card, and a second one is an ordinary death. */
const CAUSE = {
  wolves: { label:'werewolves',          vi:'ma s\u00f3i' },
  white:  { label:'the White Werewolf',  vi:'S\u00f3i Tr\u1eafng' },
  rust:   { label:'the Knight\u2019s rust',  vi:'ki\u1ebfm r\u1ec9 c\u1ee7a Hi\u1ec7p S\u0129' },
  grief:  { label:'grief',               vi:'\u0111au bu\u1ed3n' },
  night:  { label:'the night',           vi:'\u0111\u00eam' },
  vote:   { label:'the village vote',    vi:'phi\u1ebfu c\u1ee7a d\u00e2n l\u00e0ng', village:true },
  tie:    { label:'the tie',             vi:'phi\u1ebfu ho\u00e0',            village:true },
  poison: { label:'the Witch\u2019s poison', vi:'thu\u1ed1c \u0111\u1ed9c c\u1ee7a Ph\u00f9 Thu\u1ef7', village:true },
  shot:   { label:'the Hunter\u2019s shot',  vi:'ph\u00e1t s\u00fang c\u1ee7a Th\u1ee3 S\u0103n', village:true },
};
// A game saved before causes carried codes holds the display string itself, and those
// players are already dead, so the string is all it was ever going to be used for.
const causeLabel = c => (CAUSE[c] && T(CAUSE[c].vi, CAUSE[c].label)) || c || T('ch\u1ebft','dead');
const villageKilled = c => !!(CAUSE[c] && CAUSE[c].village);

function kill(p, cause){
  if (!p || !p.alive) return [];
  p.alive = false; p.cause = cause;
  if (p.role === 'elder' && !G.powersLost && villageKilled(cause)){
    if (elderStripsPowers()){
      G.powersLost = true;
      log(T('D\u00e2n l\u00e0ng \u0111\u00e3 gi\u1ebft Tr\u01b0\u1edfng L\u00e3o \u2014 b\u1eb1ng ' + causeLabel(cause) + '. To\u00e0n b\u1ed9 ph\u00e9p c\u1ee7a d\u00e2n l\u00e0ng t\u1eaft ng\u1ee5m.',
        'The village killed the Elder \u2014 by ' + causeLabel(cause) + '. Every villager power is extinguished.'));
    } else {
      log(T('D\u00e2n l\u00e0ng \u0111\u00e3 gi\u1ebft Tr\u01b0\u1edfng L\u00e3o \u2014 b\u1eb1ng ' + causeLabel(cause) + '. Theo lu\u1eadt nh\u00e0, d\u00e2n l\u00e0ng v\u1eabn gi\u1eef ph\u00e9p.',
        'The village killed the Elder \u2014 by ' + causeLabel(cause) + '. By house rule the villagers keep their powers.'));
    }
  }
  const chain = [{ p, cause }];
  if (p.lover) for (const q of G.players) if (q.alive && q.lover) chain.push(...kill(q, 'grief'));
  if (p.model){
    const wc = G.players.find(x => x.role === 'wildchild' && x.alive);
    if (wc && !wc.turned){ wc.turned = true; log(T(wc.name + ' \u0111\u00e3 ho\u00e1 th\u00e0nh ma s\u00f3i \u2014 h\u00ecnh m\u1eabu c\u1ee7a c\u1eadu ta \u0111\u00e3 ch\u1ebft.',
      wc.name + ' has become a werewolf \u2014 their model is dead.')); }
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
  G.elderAbsorbed = false;

  if (G.n.wolf){
    const v = byId(G.n.wolf);
    if (v && v.alive){
      why.push(T('B\u1ea7y s\u00f3i ch\u1ecdn <b>','The pack chose <b>') + v.name + '</b>.');
      if (G.n.guard === G.n.wolf){
        why.push(T('B\u1ea3o V\u1ec7 \u0111ang che ch\u1edf ','The Bodyguard was shielding ') + v.name +
          T(' \u2014 \u0111\u00f2n t\u1ea5n c\u00f4ng th\u1ea5t b\u1ea1i.',' \u2014 the attack fails.'));
        if (G.n.witchSave) why.push(T('Ph\u00f9 Thu\u1ef7 c\u0169ng c\u1ee9u ','The Witch also drank for ') + v.name +
          T('. Hai ng\u01b0\u1eddi c\u00f9ng b\u1ea3o v\u1ec7 m\u1ed9t ng\u01b0\u1eddi \u2014 \u00e1p d\u1ee5ng lu\u1eadt nh\u00e0 n\u1ebfu b\u00e0n b\u1ea1n c\u00f3.',
            '. Both protected the same person \u2014 apply your house rule if you use one.'));
      } else if (G.n.witchSave){
        why.push(T('Ph\u00f9 Thu\u1ef7 d\u00f9ng thu\u1ed1c c\u1ee9u cho ','The Witch spent her cure on ') + v.name +
          T(' \u2014 \u0111\u00f2n t\u1ea5n c\u00f4ng th\u1ea5t b\u1ea1i.',' \u2014 the attack fails.'));
      } else if (v.role === 'elder' && G.elderLife){
        /* Recorded, not spent. This function produces a read model \u2014 deaths, reasoning,
           certainty \u2014 and applyDawn commits it after taking the snapshot Undo returns to.
           Spending the life here put it outside that snapshot, so Undo came back to a
           state where it was already gone; and a moderator who then adjusted the dawn to
           kill the Elder killed him having also spent the life meant to save him. */
        G.elderAbsorbed = true;
        why.push(T('Nh\u01b0ng ','But ') + v.name +
          T(' l\u00e0 Tr\u01b0\u1edfng L\u00e3o. M\u1ea1ng th\u1ee9 hai h\u1ee9ng \u0111\u00f2n n\u00e0y, v\u00e0 m\u1ea5t khi b\u1ea1n c\u00f4ng b\u1ed1 r\u1ea1ng s\u00e1ng.',
            ' is the Elder. His second life absorbs it, and is spent when you announce the dawn.'));
      } else {
        add(G.n.wolf, 'wolves');
      }
    }
  }
  if (G.n.witchKill){ add(G.n.witchKill, 'poison');
    why.push(T('Ph\u00f9 Thu\u1ef7 \u0111\u1ea7u \u0111\u1ed9c <b>','The Witch poisoned <b>') + nm(G.n.witchKill) + '</b>.'); }
  if (G.n.white){ add(G.n.white, 'white');
    why.push(T('S\u00f3i Tr\u1eafng \u0103n <b>','The White Werewolf devoured <b>') + nm(G.n.white) + '</b>.'); }
  if (G.infectNext){ add(G.infectNext, 'rust');
    why.push(T('Ki\u1ebfm r\u1ec9 c\u1ee7a Hi\u1ec7p S\u0129 lan t\u1edbi <b>','The Knight\u2019s rust reached <b>') + nm(G.infectNext) + '</b>.'); }

  // grief is a consequence of the rules, so name it here rather than let it surprise anyone
  for (const d of out.slice()){
    const q0 = byId(d.id);
    if (q0 && q0.lover) for (const q of G.players)
      if (q.alive && q.lover && q.id !== q0.id && !out.some(o => o.id === q.id)){
        add(q.id, 'grief');
        why.push('<b>' + q.name + '</b>' +
          T(' l\u00e0 ng\u01b0\u1eddi y\u00eau c\u1ee7a h\u1ecd v\u00e0 ch\u1ebft v\u00ec \u0111au bu\u1ed3n.',' is their Lover and dies of grief.'));
      }
  }

  // the only honest reasons to ask the moderator anything
  const gaps = [];
  const vi = id => R[id] ? rName(R[id]) : id;
  const sk = G.n.skipped || [], nc = G.n.noCard || [];
  if (G.counts.wolf && !G.n.wolf && !sk.includes('wolf') && !nc.includes('wolf'))
    gaps.push(T('b\u1ea7y s\u00f3i ch\u01b0a ch\u1ecdn n\u1ea1n nh\u00e2n','the pack never named a victim'));
  if (sk.length) gaps.push(T('\u0111\u00eam nay b\u1ecf qua: ','skipped tonight: ') + sk.map(vi).join(', '));
  // A skipped ACTION and a card nobody would answer for are different failures, and the
  // second one used to be recorded nowhere at all.
  if (nc.length) gaps.push(T('kh\u00f4ng ai nh\u1eadn ','nobody answered for ') + nc.map(vi).join(', ') +
    T(', n\u00ean l\u00e1 \u0111\u00f3 kh\u00f4ng ra tay \u0111\u01b0\u1ee3c',
      ', so ' + (nc.length > 1 ? 'those cards' : 'that card') + ' could not act'));
  const unplacedRules = ['elder','knight'].filter(id => (G.counts[id] || 0) > withRole(id).length);
  if (unplacedRules.length) gaps.push(T('l\u00e1 ','the ') +
    unplacedRules.map(vi).join(T(' v\u00e0 ',' and ')) +
    T(' ch\u01b0a bi\u1ebft ai c\u1ea7m, n\u00ean lu\u1eadt \u0111\u00f3 c\u00f3 th\u1ec3 ch\u01b0a \u00e1p d\u1ee5ng',
      ' card is not placed, so that rule may not have applied'));
  G.dawn = out; G.dawnWhy = why; G.dawnSure = gaps.length === 0; G.dawnGaps = gaps;
  // Set once, on entering dawn. rDawn used to force it true on every render while the
  // dawn was uncertain, which made the collapse unreachable.
  G.dawnEdit = gaps.length > 0;
}
/* A death can interrupt the flow: the Hunter fires, a dying Sheriff hands on the
   badge. Both can happen at night as well as by daylight, so the queue records
   them and `proceed` returns to wherever we were. */
/* Will this Hunter fire, and if not, why not? TWO callers need the same answer: the
   queueing below, once a death is committed, and the pre-dawn check that must know BEFORE
   committing anything whether a private night shot is owed. Asking it in two places is how
   two answers drift apart.

   Vietnamese play (and 狼人杀 before it) holds that poison leaves no time to aim: the
   Hunter fires when eaten or hanged, but not when poisoned. Miller’s Hollow says he fires
   whatever the cause. Matched on the cause CODE \u2014 it used to be /poison/ against the
   sentence, so renaming the potion, or translating it, would have switched the rule off
   with nothing failing. */
function hunterWouldFire(p, cause){
  if (!p || p.role !== 'hunter') return { fires:false };
  if (powerGone(p) && !hunterFiresPowerless())
    return { fires:false, why: p.name + T(
      ' l\u00e0 Th\u1ee3 S\u0103n, nh\u01b0ng d\u00e2n l\u00e0ng \u0111\u00e3 gi\u1ebft Tr\u01b0\u1edfng L\u00e3o \u2014 kh\u1ea9u s\u00fang ch\u1ebft theo m\u1ecdi ph\u00e9p kh\u00e1c c\u1ee7a d\u00e2n. Kh\u00f4ng b\u1eafn. \u0110\u1ed5i \u1edf Lu\u1eadt nh\u00e0 n\u1ebfu b\u00e0n b\u1ea1n ch\u01a1i kh\u00e1c.',
      ' was the Hunter, but the village killed the Elder \u2014 the gun is as dead as every ' +
      'other villager power. No shot. Change that under House rules if your table plays otherwise.') };
  if (!hunterFiresPoisoned() && cause === 'poison')
    return { fires:false, why: p.name + T(
      ' l\u00e0 Th\u1ee3 S\u0103n, nh\u01b0ng thu\u1ed1c \u0111\u1ed9c kh\u00f4ng cho k\u1ecbp gi\u01b0\u01a1ng s\u00fang \u2014 kh\u00f4ng b\u1eafn. \u0110\u1ed5i \u1edf Lu\u1eadt nh\u00e0 n\u1ebfu b\u00e0n b\u1ea1n ch\u01a1i kh\u00e1c.',
      ' was the Hunter, but the poison gave no time to aim \u2014 no shot. ' +
      'Change that under House rules if your table plays otherwise.') };
  return { fires:true };
}
function registerDeaths(chain){
  if (chain.length) buzz('death');
  for (const c of chain){
    log(c.p.name + T(' ch\u1ebft \u2014 ', ' died \u2014 ') +
      (c.cause === 'grief' ? T('v\u00ec \u0111au bu\u1ed3n', 'of grief') : causeLabel(c.cause)) + '.');
    // a shot already taken privately in the night is not owed a second time at dawn
    if (c.p.role === 'hunter' && !G.pending.hunterId && !G.nightShotTaken){
      const v = hunterWouldFire(c.p, c.cause);
      if (!v.fires) log(v.why);
      else { G.pending.hunterId = c.p.id; G.pending.hunterCause = c.cause; }
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
  /* The Elder's second life is spent here, with every other commit, and inside the
     snapshot Undo returns to. Only if he did not die anyway: the adjust list is still
     open right up to this button, and a life cannot both absorb the attack and fail to. */
  if (G.elderAbsorbed){
    const eld = G.players.find(p => p.role === 'elder' && p.alive);
    if (eld && !G.dawn.some(d => d.on && d.id === eld.id)){
      G.elderLife = false;
      log(T('M\u1ea1ng th\u1ee9 hai c\u1ee7a Tr\u01b0\u1edfng L\u00e3o \u0111\u00e3 h\u1ee9ng \u0111\u00f2n, v\u00e0 gi\u1edd \u0111\u00e3 m\u1ea5t.',
        'The Elder\u2019s second life absorbed the attack, and is now spent.'));
    }
    G.elderAbsorbed = false;
  }
  let knightDied = null;
  for (const d of G.dawn){
    if (!d.on) continue;
    const p = byId(d.id);
    if (!p || !p.alive) continue;
    // the rust is a villager power too, so the Elder's revenge takes it with the rest
    if (p.role === 'knight' && d.cause === 'wolves'){
      if (powerGone(p)) log(T(p.name + ' l\u00e0 Hi\u1ec7p S\u0129, nh\u01b0ng thanh ki\u1ebfm c\u00f9n theo m\u1ecdi ph\u00e9p kh\u00e1c c\u1ee7a d\u00e2n. Kh\u00f4ng c\u00f3 r\u1ec9 s\u00e9t.',
        p.name + ' was the Knight, but the sword lost its bite with every other villager power. No rust.'));
      else knightDied = p;
    }
    registerDeaths(kill(p, d.cause));
  }
  if (knightDied){
    const w = clockwiseWolfFrom(knightDied);
    if (w){ G.infectNext = w.id;
      log(T('R\u1ec9 s\u00e9t s\u1ebd l\u1ea5y ' + w.name + ' v\u00e0o \u0111\u00eam mai.', 'The rust will take ' + w.name + ' tomorrow night.')); }
    if (!wolfSideKnown()) log(T('Ch\u01b0a bi\u1ebft h\u1ebft l\u00e1 s\u00f3i ai c\u1ea7m, n\u00ean h\u00e3y \u0111\u1ed1i chi\u1ebfu m\u1ee5c ti\u00eau r\u1ec9 s\u00e9t v\u1edbi b\u00e0i th\u1eadt.',
      'Not every wolf card is placed, so confirm the rust target against the real deal.'));
  }
  if (!G.dawn.some(d => d.on)) log(T('\u0110\u00eam qua kh\u00f4ng ai ch\u1ebft.', 'Nobody died in the night.'));
  if (G.night === 1){
    const ang = G.players.find(p => p.role === 'angel' && !p.alive);
    if (ang) return finish({ who: T('Thi\u00ean Th\u1ea7n', 'The Angel'),
      why: ang.name + T(' mu\u1ed1n \u0111\u00fang \u0111i\u1ec1u n\u00e0y v\u00e0 \u0111\u1ea1t \u0111\u01b0\u1ee3c tr\u01b0\u1edbc c\u1ea3 r\u1ea1ng s\u00e1ng \u0111\u1ea7u ti\u00ean.', ' wanted exactly this and got it before the first dawn.') });
  }
  G.votes = {}; G.sheriffVote = null;
  G.resume = 'day';
  proceed();
}
function checkWin(){
  const a = alive();
  if (!a.length) return { who: T('Kh\u00f4ng ai', 'Nobody'),
    why: T('Kh\u00f4ng c\u00f2n m\u1ed9t linh h\u1ed3n n\u00e0o \u1edf Miller\u2019s Hollow.', 'Every soul in Miller’s Hollow is dead.') };
  // Counting the two sides needs only the wolf cards placed — not every villager
  // identified. Demanding the latter froze results for whole games.
  if (!wolfSideKnown()) return null;
  /* The side a player is on, as far as this function is ENTITLED to say. teamOf reports
     'none' for a card that was never learned, and comparing that against a real team
     reads as a difference nothing has established.
     Declared here, below the gate, because the gate is what licenses it: wolfSideKnown()
     means every card that could put somebody on the wolf side is placed, so anybody still
     unidentified is provably not a wolf — which on this board is the village side. Move
     this above the return and the argument stops holding. */
  const sideOf = p => teamOf(p) === 'none' ? 'village' : teamOf(p);
  /* The pair wins ALONE only when it is mixed — that is the whole of Cupid's card. Two
     villagers or two wolves who outlast everyone win with their own side, and this test
     sat above the team checks, so Cupid was credited with the pack's victory. It then
     read teamOf directly, so a village lover paired with an unlearned card compared
     'village' against 'none', looked mixed, and handed Cupid the win a second way. */
  const lovers = a.filter(p => p.lover);
  if (a.length === 2 && lovers.length === 2 && sideOf(lovers[0]) !== sideOf(lovers[1]))
    return { who: T('C\u1eb7p \u0110\u00f4i', 'The Lovers'),
      why: lovers.map(p=>p.name).join(T(' v\u00e0 ', ' and ')) +
      T(' l\u00e0 hai ng\u01b0\u1eddi cu\u1ed1i c\u00f9ng c\u00f2n s\u1ed1ng, h\u1ecd thu\u1ed9c v\u1ec1 nhau, v\u00e0 ch\u01b0a bao gi\u1edd c\u00f9ng m\u1ed9t phe.', ' are the last two alive, they belong to each other, and they were never on the same side.') };
  const piper = a.find(p => p.role === 'piper');
  if (piper && a.length > 1 && a.every(p => p.role === 'piper' || p.charmed))
    return { who: T('Ng\u01b0\u1eddi Th\u1ed5i S\u00e1o', 'The Pied Piper'),
      why: piper.name + T(' \u0111\u00e3 m\u00ea ho\u1eb7c m\u1ecdi linh h\u1ed3n c\u00f2n s\u1ed1ng.', ' has charmed every living soul.') };
  const ww = a.find(p => p.role === 'whitewolf');
  if (ww && a.length === 1) return { who: T('S\u00f3i Tr\u1eafng', 'The White Werewolf'),
    why: ww.name + T(' \u0111\u1ee9ng m\u1ed9t m\u00ecnh.', ' stands alone.') };
  const wolves = a.filter(isWolf), others = a.filter(p => !isWolf(p));
  if (!wolves.length) return { who: T('D\u00e2n l\u00e0ng', 'The Village'),
    why: T('Kh\u00f4ng c\u00f2n con ma s\u00f3i n\u00e0o th\u1edf.', 'Not one werewolf is left breathing.') };
  // Once the pack matches the village it can no longer be outvoted, so the game
  // is already decided and there is no point grinding out the last few nights.
  // Vietnamese play ends it there; Miller’s Hollow makes them finish the job.
  const parity = G.rules === 'vn' && wolves.length >= others.length;
  if (!others.length || parity){
    if (ww && wolves.length > 1) return null;      // the White Werewolf still wants to be alone
    return { who: T('Ma S\u00f3i', 'The Werewolves'), why: others.length
      ? T('B\u1ea7y s\u00f3i ' + wolves.length + ' \u0111\u1ea5u ' + others.length + '. Kh\u00f4ng ai b\u1ecf phi\u1ebfu \u00e1p \u0111\u1ea3o \u0111\u01b0\u1ee3c h\u1ecd n\u1eefa.',
          'The pack is ' + wolves.length + ' against ' + others.length + '. They can no longer be outvoted.')
      : T('Kh\u00f4ng c\u00f2n d\u00e2n l\u00e0ng n\u00e0o.', 'No villagers remain.') };
  }
  return null;
}
function finish(w){
  G.over = w; G.phase = 'end';
  log(w.who + T(' th\u1eafng. ', ' win. ') + w.why);
  countGame();                 // one more game this device does not need taught through
  buzz('death');
  render();
}

/* ==========================================================================
   Night ambience. A moderator who must read a card at the table leaks three
   things: the sound of the card, the direction of the sound, and their own
   footsteps. Low continuous rain covers all three. Generated, so there is no
   audio file to ship and it works offline.
========================================================================== */
let soundOn = false, AC = null, amGain = null, amWant = null;
function ambience(want){
  want = !!want;
  /* render() calls this on every tap, and every call issued a fresh 1.1-second ramp — so
     during a run of taps the rain never reached level. That is audible, and the whole
     point of the rain is that it should be unremarkable. */
  if (want === amWant) return;
  amWant = want;
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
    } catch(e){ AC = null; amWant = null; return; }   // so a later attempt can retry
  }
  if (!AC || !amGain) return;
  if (AC.state === 'suspended' && want) AC.resume();
  amGain.gain.linearRampToValueAtTime(want ? 0.11 : 0, AC.currentTime + (want ? 1.1 : 0.6));
}

/* ==========================================================================
   HAPTICS.  The moderator holds one phone, one-handed, in a dark room, while watching
   nine people. Half the design exists to avoid giving anything away by sound or
   movement — the rain, the masking tips, the hushed call — and every confirmation was
   delivered visually, to someone whose eyes should be on the table. This is the one
   channel the app was missing entirely rather than misusing.

   Two tiers and no more: a tick acknowledges a tap, a pattern marks a committed
   outcome. iOS Safari does not implement the Vibration API at all, so this lands on
   Android today; it degrades by doing nothing, and the control is hidden rather than
   offered dead, which is the difference between silent and dishonest.
========================================================================== */
const canBuzz = () => typeof navigator.vibrate === 'function';
let hapticOn = true;
const BUZZ = { tap:10, commit:[16,44,16], death:[30,60,30,60,30] };
function buzz(kind){
  if (!hapticOn || !canBuzz()) return;
  try { navigator.vibrate(BUZZ[kind] || BUZZ.tap); } catch (e){ /* not our problem */ }
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
  c.innerHTML = pIcon(p) + p.name +
    (o.badge ? '<span class="bd">' + o.badge + '</span>' : '');
  /* Mark the tapped node before the handler runs. The re-render destroys it, so this
     class is only ever seen while the rebuild is in flight — which is exactly the wait it
     exists to cover. It is also the only way .chip's 150ms transition has ever run: the
     replacement node mounts already carrying .sel, so there is nothing to interpolate. */
  if (!o.dead && o.on) c.onclick = () => { c.classList.toggle('sel'); buzz('tap'); o.on(); };
  return c;
}
function playerRow(p, i, onTap){
  const d = el('div', 'p' + (p.alive ? '' : ' dead'));
  d.innerHTML = (i != null ? '<span class="seat">' + (i+1) + '</span>' : '') +
    pIcon(p) +
    '<span class="nm">' + p.name + '</span>' +
    '<span class="rl">' + (p.role ? rName(R[p.role]) : T('ch\u01b0a bi\u1ebft','unknown')) + '</span>';
  const tags = [];
  if (p.sheriff) tags.push('<span class="tag s">Sheriff</span>');
  if (p.lover) tags.push('<span class="tag l">Lover</span>');
  if (p.charmed) tags.push('<span class="tag c">Charmed</span>');
  // The one state that changes what the moderator must do right now, so it keeps the
  // accent while the standing states go monochrome.
  if (p.voteless) tags.push('<span class="tag urgent">No vote</span>');
  if (p.model) tags.push('<span class="tag">Model</span>');
  if (p.turned) tags.push('<span class="tag">Turned</span>');
  if (!p.alive) tags.push('<span class="tag">' + causeLabel(p.cause) + '</span>');
  if (tags.length) d.appendChild(el('div','tags', tags.join('')));
  if (onTap){ d.style.cursor = 'pointer'; d.onclick = onTap; }
  return d;
}
/* Long guidance is worth having but not worth surrendering the screen to. These
   fold away by default and remember whether you opened them, so a moderator who
   already knows the routine never scrolls past an essay. */
const logRow = e => el('div','le','<span class="w">' + e.w + '</span><span>' + e.t + '</span>');
/* Opened by hand, and shut by hand. Two sets rather than one, because "never touched"
   and "deliberately closed" are different states once teaching() gets a vote: while the
   device is still learning the routine these open themselves, and only an explicit close
   should override that. */
const expOpen = new Set(), expShut = new Set();
function collapsible(key, title, body){
  const d = document.createElement('details');
  d.className = 'exp';
  d.open = expOpen.has(key) || (teaching() && !expShut.has(key));
  const s = document.createElement('summary');
  s.innerHTML = title;
  d.appendChild(s);
  // a body may be markup or a live node; innerHTML on a node would stringify it
  const b = el('div','expBody');
  if (typeof body === 'string') b.innerHTML = body;
  else if (body) b.appendChild(body);
  d.appendChild(b);
  d.addEventListener('toggle', () => {
    if (d.open){ expOpen.add(key); expShut.delete(key); }
    else { expOpen.delete(key); expShut.add(key); }
  });
  return d;
}
/* Teaching prose, gathered per screen and emitted as ONE affordance. Six separate
   collapsibles was already better than six essays, but it is still six 50px rows to
   scroll past, and a moderator who needs none of it wants one line rather than six.
   While teaching() holds, collapsible() opens it, so nothing is hidden from a first
   game — it just stops being the default afterwards. */
let tipBuf = [];
const tip = html => { tipBuf.push(html); };
function flushTips(target, key){
  const items = tipBuf; tipBuf = [];
  if (!items.length) return;
  target.appendChild(collapsible(key, T('Luật &amp; mẹo', 'Rules &amp; tips'),
    items.map(h => '<p>' + h + '</p>').join('')));
}

/* Buttons used to size to their text, leaving dead space at the end of the bar.
   The primary action now takes the room that is left; a secondary sits at its
   natural width beside it. When every option is secondary they share the row
   evenly, so the bar is always filled and the main action is always the widest. */
/* The bar is fixed, so the column has to reserve exactly its height or the last row
   sits under it. Its height changes with wrapped labels and the roll-call counter,
   which is why this is measured rather than a constant. */
/* The outer .bar plate, not #bar — #bar is only the button row inside it, and
   measuring that misses the plate's padding and the pinned note. */
const barEl = () => document.querySelector('.bar');
const wrapEl = () => document.querySelector('.wrap');
/* Reading offsetHeight forces a synchronous layout of a document render() has just
   invalidated, and writing the property back invalidated style for the whole tree and woke
   the ResizeObserver watching .bar, which measured again. Two forced layouts per chip tap,
   for a number that changes when a label wraps — a few times a game.

   Three things fix that. Measure after the frame has settled, so nothing is forced.
   Coalesce, because one render calls this three times: bar() clears the note, builds the
   buttons, and the caller pins a new note — genuinely three different heights, so
   deduplicating on the value alone still wrote twice. And write on .wrap, the only element
   that reads it, rather than on the root. */
let barh = null, measureQueued = false;
function measureBar(){
  if (measureQueued) return;
  measureQueued = true;
  const run = () => {
    if (!measureQueued) return;        // whichever scheduler won has already done it
    measureQueued = false;
    const b = barEl(), w = wrapEl();
    if (!b || !w) return;
    const h = b.offsetHeight;
    if (h === barh) return;
    barh = h;
    w.style.setProperty('--barh', h + 'px');
  };
  /* A frame callback when the tab is visible, so the read lands after layout has settled.
     A hidden tab never runs one, and the app can perfectly well do its first render in a
     hidden tab — a phone that loaded the page and was switched away from — which would
     leave the clearance on the CSS fallback against a bar that may be taller than it.
     So a timer backs it up. Forcing layout in a tab that is not painting costs nothing.
     The frame callback cancels the timer rather than leaving it to wake and find the work
     done, so the common path leaves nothing pending. */
  const backstop = setTimeout(run, 60);
  requestAnimationFrame(() => { clearTimeout(backstop); run(); });
}
if (typeof ResizeObserver === 'function'){
  const ro = new ResizeObserver(measureBar);
  addEventListener('DOMContentLoaded', () => { const b = barEl(); if (b) ro.observe(b); });
}
addEventListener('resize', measureBar);

/* A line pinned above the buttons, for a fact that must not scroll away — the vote
   threshold. Cleared by every bar() call, so a screen that does not set it cannot
   inherit the previous screen's note. */
function barNote(html){
  const n = $('barNote');
  if (!n) return;
  n.innerHTML = html || '';
  n.hidden = !html;
  measureBar();
}

function bar(items){
  barNote('');
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
  measureBar();
}
function render(){
  saveSoon();
  tipBuf = [];                       // an unflushed tip belongs to the screen that made it
  $('bUndo').disabled = !undoStack.length;
  ambience(soundOn && G.phase === 'night');
  /* The header carries position, not a wordmark. It used to spend the most valuable
     band on the screen on a fixed title plus a caption the h2 repeated word for word
     ("SEATS" over "Who is at the table?"). It now answers "where am I in the game",
     which is the one thing nothing else on the screen says. */
  const setup = T('Chu\u1ea9n b\u1ecb', 'Setup');
  const pos = G.over ? T('K\u1ebft th\u00fac', 'Game over') : {
    players:setup, roles:setup, deal:setup, learn:setup,
    night: G.night === 1 ? T('\u0110\u00eam \u0111\u1ea7u ti\u00ean', 'First night') : T('\u0110\u00eam ', 'Night ') + G.night,
    dawn:T('R\u1ea1ng s\u00e1ng ', 'Dawn ') + G.night, day:T('Ng\u00e0y ', 'Day ') + G.day,
    hunter:T('Ng\u00e0y ', 'Day ') + G.day, sheriff:T('Ng\u00e0y ', 'Day ') + G.day,
    scapegoat:T('Ng\u00e0y ', 'Day ') + G.day, end:T('K\u1ebft qu\u1ea3', 'Result') }[G.phase] || setup;
  const prog = G.over ? '' : {
    players:T('Ai \u0111ang ch\u01a1i', 'Who is playing'), roles:T('Ch\u1ecdn b\u1ed9 b\u00e0i', 'Building the deck'),
    deal:T('Chia b\u00e0i', 'Dealing the cards'), learn:T('Ghi l\u1ea1i b\u1ed9 b\u00e0i', 'Collecting the deal'),
    // "Roll call" is the night-one ritual of learning who holds what; later nights are
    // just the call order, so the label must not claim otherwise.
    night: (G.steps && G.steps.length)
      ? (G.night === 1 ? T('\u0110i\u1ec3m danh \u00b7 ', 'Roll call \u00b7 ') : T('G\u1ecdi \u00b7 ', 'Call \u00b7 '))
        + (G.si+1) + T(' / ', ' of ') + G.steps.length : '',
    day:T('B\u1ecf phi\u1ebfu', 'The vote'), sheriff:T('B\u1ea7u Tr\u01b0\u1edfng L\u00e0ng', 'Electing the badge'),
    hunter:T('Th\u1ee3 S\u0103n b\u1eafn', 'The Hunter fires'),
    scapegoat:T('V\u1eadt T\u1ebf Th\u1ea7n ch\u1ecdn', 'The Scapegoat chooses') }[G.phase] || '';
  $('nSayLbl').textContent = T('\u0110\u1ecdc to','Read aloud');
  $('bUndo').textContent = T('Ho\u00e0n t\u00e1c','Undo');
  $('bRoster').textContent = T('Danh s\u00e1ch','Roster');
  $('hTtl').textContent = pos;
  $('hPh').textContent = prog;
  $('hPh').hidden = !prog;
  const views = { players:rPlayers, roles:rRoles, deal:rDeal, learn:rLearn, night:rNight, dawn:rDawn,
    day:rDay, end:rEnd, hunter:renderHunter, sheriff:renderSheriff, scapegoat:renderScapegoat };
  (views[G.phase] || rPlayers)();
}

/* ---- seats ---- */
function rPlayers(){
  show('sPlayers');
  $('pTtl').textContent = T('Ai ng\u1ed3i b\u00e0n n\u00e0y?', 'Who is at the table?');
  $('pSub').textContent = T(
    'Th\u00eam t\u1eebng ng\u01b0\u1eddi theo th\u1ee9 t\u1ef1 ch\u1ed7 ng\u1ed3i, chi\u1ec1u kim \u0111\u1ed3ng h\u1ed3. Ng\u01b0\u1eddi D\u1ea1y G\u1ea5u, ' +
    'C\u00e1o v\u00e0 Hi\u1ec7p S\u0129 \u0111\u1ec1u d\u1ef1a v\u00e0o ch\u1ed7 ng\u1ed3i, n\u00ean nh\u1eadp \u0111\u00fang th\u1ee9 t\u1ef1.',
    'Add everyone in seating order, going clockwise. Seating is used by the Bear Tamer, ' +
    'the Fox and the Knight, so get the order right.');
  const n = G.players.length;
  $('pCount').innerHTML = n
    ? T('<b>' + n + '</b> ng\u01b0\u1eddi. C\u00e2n b\u1eb1ng th\u01b0\u1eddng l\u00e0 <b>' + recWolves(n) + '</b> S\u00f3i.',
        '<b>' + n + '</b> seated. The usual balance is <b>' + recWolves(n) + '</b> ' +
        (recWolves(n) > 1 ? 'werewolves' : 'werewolf') + '.')
    : T('Ch\u01b0a c\u00f3 ai. T\u1ed1i thi\u1ec3u 6 ng\u01b0\u1eddi; t\u1eeb 8 tr\u1edf l\u00ean ch\u01a1i hay nh\u1ea5t.',
        'Nobody yet. Six is the minimum; eight or more plays best.');
  const L = $('lPlayers'); L.innerHTML = '';
  G.players.forEach((p, i) => {
    const row = el('div','p');
    row.innerHTML = '<span class="seat">' + (i+1) + '</span><span class="nm">' + p.name + '</span>';
    const x = el('button','ico quiet', T('Xo\u00e1','Remove'));
    x.onclick = () => { snap(); G.players.splice(i,1); render(); };
    row.appendChild(x); L.appendChild(row);
  });
  bar([{ t: T('Ch\u1ecdn b\u1ed9 b\u00e0i \u2192','Build the deck \u2192'), off:n < 4, wide:true, on:() => { snap();
    if (!totalCards()) G.counts = recommend(n, true);
    G.phase='roles'; render(); } }]);
}

/* ---- deck ---- */
function rRoles(){
  show('sRoles');
  $('rTtl').textContent = T('X\u00e2y b\u1ed9 b\u00e0i', 'Build the deck');
  $('rSub').textContent = T(
    'Ch\u1ecdn nh\u1eefng l\u00e1 b\u1ea1n s\u1ebd th\u1eadt s\u1ef1 cho v\u00e0o b\u1ed9 x\u00e1o. B\u1eaft \u0111\u1ea7u t\u1eeb b\u1ed9 \u0111\u1ec1 xu\u1ea5t r\u1ed3i ch\u1ec9nh l\u1ea1i.',
    'Choose the cards you will physically put in the shuffle. Start from a recommendation, then adjust.');
  const n = G.players.length;
  $('tCards').textContent = totalCards();
  $('tSeats').textContent = n;
  $('tWolves').textContent = wolfCards();

  const RB = $('recBox'); RB.innerHTML = '';
  const pc = el('div','card');
  /* Language first, on the first screen with room for it. It decides how every label
     below reads, and it is not a decision about the game. */
  pc.appendChild(el('div','grp', T('Ng\u00f4n ng\u1eef', 'Language')));
  const lc = el('div','chips');
  for (const [k, lab] of [['vi','Ti\u1ebfng Vi\u1ec7t'], ['en','English']]){
    const b = el('div','chip' + (prefs.lang === k ? ' sel' : ''), lab);
    b.onclick = () => { setPref('lang', k); render(); };
    lc.appendChild(b);
  }
  pc.appendChild(lc);
  pc.appendChild(el('div','grp', T('Th\u1ee9 t\u1ef1 lu\u1eadt', 'Rules order')));
  const pr = el('div','chips');
  for (const k of ['vn','mh']){
    const b = el('div','chip' + (G.rules===k ? ' sel' : ''), RULESETS[k].label());
    b.onclick = () => { snap(); G.rules = k; render(); };
    pr.appendChild(b);
  }
  pc.appendChild(pr);
  const rec2 = ord().filter(r => everyOf(r) != null && G.counts[r.id]);
  const one  = ord().filter(r => G.counts[r.id] && r.id !== 'villager');
  const chain = list => list.length ? list.map(rName).join(' \u2192 ') : '\u2014';
  pc.appendChild(el('p','note',
    '<b>' + T('\u0110\u00eam \u0111\u1ea7u ti\u00ean:','First night:') + '</b> ' + chain(one) +
    '<br><b>' + T('C\u00e1c \u0111\u00eam sau:','Every night after:') + '</b> ' + chain(rec2)));
  RB.appendChild(pc);
  RB.appendChild(collapsible('house', T('Lu\u1eadt nh\u00e0', 'House rules'),
    houseRulesUI()));
  RB.appendChild(collapsible('order',
    T('Hai b\u1ed9 lu\u1eadt kh\u00e1c nhau \u1edf \u0111\u00e2u?', 'How do the two rulesets differ?'),
    (G.rules === 'vn'
      ? T('<p>Ti\u00ean Tri v\u00e0 C\u00e1o \u0111\u01b0\u1ee3c g\u1ecdi <b>sau</b> Ma S\u00f3i, n\u00ean app \u0111\u00e3 bi\u1ebft c\u1ea3 b\u1ea7y S\u00f3i ' +
          'v\u00e0 tr\u1ea3 l\u1eddi \u0111\u01b0\u1ee3c ngay tr\u00ean m\u00e0n h\u00ecnh.</p>' +
          '<p>B\u1ea3o V\u1ec7 c\u00f3 trong b\u1ed9 c\u01a1 b\u1ea3n. Ph\u00f9 Thu\u1ef7 kh\u00f4ng \u0111\u01b0\u1ee3c t\u1ef1 c\u1ee9u. Th\u1ee3 S\u0103n b\u1ecb thu\u1ed1c \u0111\u1ed9c ' +
          'th\u00ec kh\u00f4ng b\u1eafn \u0111\u01b0\u1ee3c. S\u00f3i b\u1eb1ng s\u1ed1 D\u00e2n l\u00e0 S\u00f3i th\u1eafng lu\u00f4n. Ph\u00f9 hi\u1ec7u Tr\u01b0\u1edfng L\u00e0ng n\u1eb7ng 1.5 phi\u1ebfu.</p>',
          '<p>The Seer and the Fox are called <b>after</b> the pack, so the app already knows ' +
          'every wolf and can answer on screen.</p>' +
          '<p>The Bodyguard is in the base box. The Witch may not save herself. A poisoned ' +
          'Hunter does not fire. Wolves equalling villagers ends it there and then. The badge ' +
          'is worth 1.5 votes.</p>')
      : T('<p>Ti\u00ean Tri v\u00e0 C\u00e1o \u0111\u01b0\u1ee3c g\u1ecdi <b>tr\u01b0\u1edbc</b> Ma S\u00f3i, v\u00e0 Ti\u00ean Tri th\u1ea5y \u0111\u00fang l\u00e1 b\u00e0i. ' +
          '\u0110\u00eam \u0111\u1ea7u ti\u00ean \u0111i\u1ec1u \u0111\u00f3 c\u00f3 th\u1ec3 b\u1eaft b\u1ea1n ph\u1ea3i xem b\u00e0i ngay t\u1ea1i b\u00e0n.</p>' +
          '<p>H\u1ed9p g\u1ed1c kh\u00f4ng c\u00f3 B\u1ea3o V\u1ec7. Ph\u00f9 Thu\u1ef7 \u0111\u01b0\u1ee3c t\u1ef1 c\u1ee9u. Th\u1ee3 S\u0103n b\u1eafn d\u00f9 ch\u1ebft v\u00ec l\u00fd do g\u00ec. ' +
          'S\u00f3i ph\u1ea3i gi\u1ebft h\u1ebft d\u00e2n m\u1edbi th\u1eafng. Ph\u00f9 hi\u1ec7u n\u1eb7ng g\u1ea5p \u0111\u00f4i.</p>',
          '<p>The Seer and the Fox are called <b>before</b> the pack, and the Seer sees the exact card. ' +
          'On the first night that can mean reading a card at the table.</p>' +
          '<p>No Bodyguard in the original box. The Witch may save herself. The Hunter fires whatever killed ' +
          'him. The wolves must finish every villager to win. The badge is worth a flat double vote.</p>'))));
  const rec = el('div','card');
  // Classic / Characters is a SCOPE, not an action. Both buttons below obey it,
  // which is why tapping the words themselves never dealt a new deck.
  rec.appendChild(el('div','grp', T('Phạm vi bài', 'Which box')));
  const chars = G.scope !== 'base';
  const sc2 = el('div','chips');
  for (const [k, lab] of [['base', T('Cơ bản','Classic')], ['chars', T('Mở rộng','Characters')]]){
    const b = el('div','chip' + ((k === 'chars') === chars ? ' sel' : ''), lab);
    b.onclick = () => { snap(); G.scope = k; render(); };
    sc2.appendChild(b);
  }
  rec.appendChild(sc2);
  const reach = chars ? Object.keys(SHUF).filter(id =>
    R[id].set === 'Characters' && n >= SHUF[id][1]).map(id => R[id].vi) : [];
  rec.appendChild(el('div','grp', T('Bộ bài cho ' + n + ' người', 'A deck for ' + n)));
  const rr = el("div","row flow");
  const bS = el('button','btn sm', icon('shuffle') + T('Xáo bộ mới','Shuffle'));
  bS.onclick = () => { snap(); G.counts = shuffleDeck(n, chars); render(); };
  const bR = el('button','btn sm sec', T('Bộ đề xuất','Suggested'));
  bR.onclick = () => { snap(); G.counts = recommend(n, chars); render(); };
  rr.append(bS, bR); rec.appendChild(rr);
  const specials = Object.keys(G.counts).filter(k => k !== 'villager' && k !== 'wolf');
  rec.appendChild(el('p','note', specials.length
    ? '<b>' + T('B\u1ed9 hi\u1ec7n t\u1ea1i:','This deck:') + '</b> ' + rName(R.wolf) + ' \u00d7' + (G.counts.wolf||0) + ', ' +
      specials.map(k => rName(R[k]) + (G.counts[k] > 1 ? ' \u00d7' + G.counts[k] : '')).join(', ') +
      (G.counts.villager ? ', ' + rName(R.villager) + ' \u00d7' + G.counts.villager : '')
    : T('Ch\u01b0a ch\u1ecdn l\u00e1 n\u00e0o.','No cards chosen yet.')));
  RB.appendChild(rec);
  RB.appendChild(collapsible('deckhow',
    T('Hai n\u00fat n\u00e0y kh\u00e1c nhau th\u1ebf n\u00e0o?', 'What is the difference between these two buttons?'),
    T('<p><b>X\u00e1o b\u1ed9 m\u1edbi</b> cho m\u1ed9t b\u1ed9 kh\u00e1c m\u1ed7i l\u1ea7n b\u1ea5m. <b>B\u1ed9 \u0111\u1ec1 xu\u1ea5t</b> lu\u00f4n cho c\u00f9ng m\u1ed9t b\u1ed9. ' +
      'C\u1ea3 hai \u0111\u1ec1u l\u1ea5y trong ph\u1ea1m vi b\u1ea1n ch\u1ecdn \u1edf tr\u00ean.</p>',
      '<p><b>Shuffle</b> deals a different deck every time you tap it. <b>Suggested</b> always gives ' +
      'the same one. Both draw from the box you chose above.</p>') +
    (chars ? (reach.length
      ? T('<p>\u1ede b\u00e0n ' + n + ' ng\u01b0\u1eddi, l\u00e1 m\u1edf r\u1ed9ng c\u00f3 th\u1ec3 ra: ' + reach.join(', ') + '.</p>',
          '<p>At a table of ' + n + ', these expansion cards can turn up: ' + reach.join(', ') + '.</p>')
      : T('<p>B\u00e0n ' + n + ' ng\u01b0\u1eddi qu\u00e1 nh\u1ecf \u0111\u1ec3 l\u00e1 m\u1edf r\u1ed9ng n\u00e0o l\u1ecdt v\u00e0o \u2014 x\u00e1o s\u1ebd ra b\u1ed9 c\u01a1 b\u1ea3n.</p>',
          '<p>A table of ' + n + ' is too small for any expansion card to reach \u2014 a shuffle will give ' +
          'a base deck.</p>'))
      : T('<p>Ch\u1ec9 l\u1ea5y l\u00e1 trong h\u1ed9p c\u01a1 b\u1ea3n.</p>',
          '<p>Only cards from the base box.</p>'))));
  const A = $('advice'); A.innerHTML = '';
  const cs = checks();
  /* Only a deck that cannot be dealt stops anyone. A warning about the usual wolf count,
     and "deck is ready", are information — they are read once and acted on or not. */
  for (const [k, t] of cs)
    A.appendChild(k === 'no' ? el('div','alert no', t)
                             : el('div','tell' + (k === 'ok' ? ' ok' : ''), t));

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

  L.appendChild(el('div','grp', T('Trong bộ \u00b7 ' + totalCards() + '/' + n + ' l\u00e1 \u00b7 thứ tự gọi',
    'In your deck \u00b7 ' + totalCards() + ' of ' + n + ' \u00b7 call order')));
  // No legend: the rows say "Cơ bản" / "Mở rộng" in words now, so a colour key would
  // be explaining a code that no longer exists.
  /* One container per section, hairlines inside it. Twenty-five rows each drawing their
     own border and radius was twenty-five boxes of equal weight down a scrolling page. */
  if (inDeck.length){
    const g = el('div','group');
    for (const r of inDeck) g.appendChild(roleRow(r, true));
    L.appendChild(g);
  } else L.appendChild(el('p','tell', T('Chưa chọn lá nào. Bấm <b>+</b> ở danh sách bên dưới, hoặc dùng <b>Xáo bộ mới</b>.',
    'No cards chosen yet. Tap <b>+</b> in the list below, or use <b>Shuffle</b>.')));

  const SETS = [['Base', T('H\u1ed9p c\u01a1 b\u1ea3n','Base game')],
                ['Characters', T('B\u1ea3n m\u1edf r\u1ed9ng','Characters expansion')]];
  for (const [setKey, setLabel] of SETS){
    const list = spare.filter(r => r.set === setKey).sort(byTeam);
    if (!list.length) continue;                 // every card from this box is in the deck
    L.appendChild(el('div','grp', T(setLabel + ' \u00b7 ' + list.length + ' còn lại',
      setLabel + ' \u00b7 ' + list.length + ' left')));
    const g = el('div','group');
    for (const r of list) g.appendChild(roleRow(r));
    L.appendChild(g);
  }
  function roleRow(r, chosen){
    const c = G.counts[r.id] || 0;
    const off = r.only && r.only !== G.rules;
    const row = el('div','r set-' + r.set + (off ? ' off' : '') + (c ? ' act' : '') +
      (chosen ? ' picked' : ''));
    const info = el('div','info',
      '<div class="rn">' + icOf(r.id) +
        rName(r) +
        '<span class="vi">' + T(r.name, r.vi) + '</span>' +
        (off ? '<span class="tag">' + T('kh\u00f4ng c\u00f3 trong h\u1ed9p','not in this box') + '</span>' : '') +
        '<span class="prov">' + provLabel(r.set) + '</span></div>' +
      '<div class="rd">' + rDesc(r) + '</div>');
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
  bar([{ t: T('Quay l\u1ea1i','Back'), sec:true, on:() => { snap(); G.phase='players'; render(); } },
       { t: T('Chia b\u00e0i \u2192','Deal the cards \u2192'), off:!ready, on:() => { snap(); G.phase='deal'; render(); } }]);
}

/* ---- physical deal ---- */
function rDeal(){
  show('sDeal');
  $('dTtl').textContent = T('Chia b\u00e0i th\u1eadt', 'Deal the real cards');
  $('dSub').textContent = T(
    'L\u1ea5y \u0111\u00fang nh\u1eefng l\u00e1 n\u00e0y ra kh\u1ecfi h\u1ed9p. X\u00e1o \u00fap v\u00e0 chia m\u1ed7i ng\u01b0\u1eddi m\u1ed9t l\u00e1. ' +
    'B\u1ea1n kh\u00f4ng \u0111\u01b0\u1ee3c bi\u1ebft ai c\u1ea7m g\u00ec \u2014 \u0111\u00eam \u0111\u1ea7u ti\u00ean s\u1ebd r\u00f5.',
    'Pull exactly these from the box. Shuffle them face down and give one to each player. ' +
    'You are not meant to know who got what \u2014 you will find out during the first night.');
  const L = $('dealList'); L.innerHTML = '';
  for (const r of ROLES){
    const c = G.counts[r.id]; if (!c) continue;
    const row = el('div','dl set-' + r.set);
    row.innerHTML = '<span class="q">' + c + '</span>' + icOf(r.id) +
      '<span class="nn">' + rName(r) + '</span>';
    L.appendChild(row);
  }
  const mh = G.rules === 'mh';
  // Only what you must do right now stays open. The reasoning folds away.
  $('dealNote').innerHTML =
    T('X\u00e1o <b>' + totalCards() + '</b> l\u00e1 n\u00e0y v\u00e0 chia \u00fap m\u1ed7i ng\u01b0\u1eddi m\u1ed9t l\u00e1 cho \u0111\u1ee7 <b>' + G.players.length + '</b> ng\u01b0\u1eddi.',
      'Shuffle these <b>' + totalCards() + '</b> cards and deal one face down to each of the <b>' +
      G.players.length + '</b> players.') +
    (G.counts.thief ? T(' \u0110\u1ec3 ri\u00eang <b>hai l\u00e1 d\u01b0</b> cho \u0102n tr\u1ed9m.',
      ' Keep the <b>two extra cards</b> for the Thief aside.') : '') +
    '<br><br>' + T('Sau \u0111\u00f3 ch\u1ecdn: ghi l\u1ea1i b\u1ed9 b\u00e0i ngay b\u00e2y gi\u1edd, hay c\u1ee9 m\u00f9 v\u00e0 t\u00ecm ra trong \u0111\u00eam.', 'Then choose whether to learn the deal now, or stay blind and find out during the night.');
  bar([{ t: T('Quay l\u1ea1i','Back'), sec:true, on:() => { snap(); G.phase='roles'; render(); } },
       { t: T('Ghi l\u1ea1i b\u1ed9 b\u00e0i \u2192','Collect the deal \u2192'), on:() => { snap(); G.phase='learn'; render(); } }]);
  // must live in a container that gets cleared, or every visit appends another
  const A = $('dealAlt'); A.innerHTML = '';
  A.appendChild(collapsible('deal',
    T('N\u00ean ch\u1ecdn c\u00e1ch n\u00e0o?', 'Which route should I take?'),
    (mh
      ? T('<p><b>B\u1ea1n \u0111ang d\u00f9ng th\u1ee9 t\u1ef1 Miller\u2019s Hollow, n\u00ean Ti\u00ean Tri th\u1ea5y \u0111\u00fang l\u00e1 b\u00e0i.</b> ' +
          'M\u1ed7i l\u1ea7n soi \u0111\u1ec1u ph\u1ea3i \u0111\u1ecdc ra m\u1ed9t l\u00e1 c\u1ee5 th\u1ec3. Ghi l\u1ea1i b\u1ed9 b\u00e0i ngay th\u00ec app hi\u1ec7n \u0111\u01b0\u1ee3c b\u1ea5t k\u1ef3 l\u00e1 n\u00e0o ' +
          'tr\u00ean m\u00e0n h\u00ecnh; b\u1ecf qua th\u00ec c\u1ea3 v\u00e1n b\u1ea1n s\u1ebd ph\u1ea3i xem b\u00e0i ngay t\u1ea1i b\u00e0n.</p>',
          '<p><b>You are on the Miller\u2019s Hollow order, so the Seer sees the exact card.</b> ' +
          'Every look needs a specific card read out. Collect the deal now and the app can show her any ' +
          'card on screen; skip it and you will be reading cards at the table all game.</p>')
      : T('<p><b>Th\u1ee9 t\u1ef1 Vi\u1ec7t Nam.</b> Ti\u00ean Tri ch\u1ec9 c\u1ea7n bi\u1ebft c\u00f3 ph\u1ea3i s\u00f3i hay kh\u00f4ng, m\u00e0 b\u1ea7y s\u00f3i \u0111\u01b0\u1ee3c g\u1ecdi ' +
          'tr\u01b0\u1edbc c\u00f4, n\u00ean t\u1eeb \u0111\u00eam nay app tr\u1ea3 l\u1eddi \u0111\u01b0\u1ee3c m\u1ecdi l\u1ea7n soi m\u00e0 kh\u00f4ng \u0111\u1ee5ng v\u00e0o b\u00e0i tr\u00ean b\u00e0n.</p>',
          '<p><b>Vietnamese order.</b> The Seer only needs to know werewolf or not, and the pack is called ' +
          'before her, so after tonight the app can answer every look on screen without touching the table.</p>')) +
    T('<p><b>Ghi l\u1ea1i b\u1ed9 b\u00e0i</b> l\u00e0 \u0111i m\u1ed9t v\u00f2ng quanh b\u00e0n, m\u1ed7i ng\u01b0\u1eddi cho b\u1ea1n xem l\u00e1 c\u1ee7a h\u1ecd. ' +
      'M\u1ea5t m\u1ed9t ph\u00fat, v\u00e0 sau \u0111\u00f3 kh\u00f4ng bao gi\u1edd ph\u1ea3i nh\u1ea5c b\u00e0i gi\u1eefa \u0111\u00eam \u2014 kh\u00f4ng ai c\u1ea3m th\u1ea5y b\u00e0i m\u00ecnh ' +
      'b\u1ecb c\u1ea7m l\u00ean r\u1ed3i \u0111o\u00e1n ra Ti\u00ean Tri v\u1eeba soi m\u00ecnh.</p>',
      '<p><b>Collect the deal</b> is one pass round the table where each player shows you their card. ' +
      'It takes a minute, and then nothing is ever lifted during the night \u2014 no player can feel their ' +
      'card being picked up and work out the Seer checked them.</p>') +
    T('<p><b>T\u00ecm ra trong \u0111\u00eam</b> th\u00ec b\u1ea1n v\u1eabn m\u00f9: g\u1ecdi t\u1eebng vai v\u00e0 b\u1ea5m v\u00e0o ng\u01b0\u1eddi m\u1edf m\u1eaft. ' +
      'B\u1eaft \u0111\u1ea7u nhanh h\u01a1n, nh\u01b0ng khi Ti\u00ean Tri ch\u1ec9 v\u00e0o m\u1ed9t l\u00e1 app ch\u01b0a t\u1eebng th\u1ea5y, b\u1ea1n ph\u1ea3i xem b\u00e0i t\u1ea1i b\u00e0n.</p>',
      '<p><b>Discover during the night</b> keeps you blind: each role is called and you tap whoever opens ' +
      'their eyes. Faster to start, but when the Seer points at a card the app has never seen, you will have ' +
      'to lift it at the table.</p>') +
    T('<p><b>M\u1eb9o cho c\u1ea3 hai c\u00e1ch:</b> khi m\u1ecdi ng\u01b0\u1eddi \u0111\u00e3 xem b\u00e0i c\u1ee7a m\u00ecnh, thu h\u1ebft b\u00e0i l\u1ea1i v\u00e0 x\u1ebfp ' +
      'theo th\u1ee9 t\u1ef1 ch\u1ed7 ng\u1ed3i tr\u00ean \u0111\u00f9i b\u1ea1n. Kh\u00f4ng ai c\u1ea7n b\u00e0i n\u1eefa, v\u00e0 kh\u00f4ng c\u00f2n g\u00ec \u1edf ch\u1ed7 n\u00e0o \u0111\u1ec3 ai \u0111\u00f3 ' +
      'c\u1ea3m th\u1ea5y b\u1ecb nh\u1ea5c l\u00ean.</p>',
      '<p><b>A tip either way:</b> once every player has looked at their own card, collect all the cards and ' +
      'keep them stacked in seat order in your lap. Nobody needs their card again, and with nothing at any ' +
      'seat there is nothing for anyone to feel being lifted.</p>')));
  const extra = el('button','btn sec wide', T('Bỏ qua — tìm ra trong đêm','Skip \u2014 find out during the night'));
  extra.onclick = () => { snap(); G.knewDeal = false; G.night=1; G.phase='night';
    buildNight(); log(T('\u0110\u00eam bu\u00f4ng xu\u1ed1ng Miller\u2019s Hollow.', 'Night falls on Miller\u2019s Hollow.'), T('\u0110\u00eam 1','Night 1')); render(); };
  A.appendChild(extra);
}

/* The disputed rules, each as three chips: follow the published rule, or overrule it one
   way or the other. Written as a node rather than a string so the chips work.
   byRule is PER ROW. The first two really are a split between the traditions, so theirs
   tracks the chosen ruleset; the third is not — no ruleset addresses it — so it must not
   claim a tradition it does not have. The single shared `G.rules !== 'vn'` would have
   labelled the third row's default "có" under Miller’s Hollow, the opposite of what it does. */
function houseRulesUI(){
  const wrap = el('div', null, '');
  const byTradition = G.rules !== 'vn';
  const rows = [
    { key:'elderRevenge', q:'Tr\u01b0\u1edfng L\u00e3o b\u1ecb d\u00e2n gi\u1ebft \u2014 d\u00e2n l\u00e0ng c\u00f3 m\u1ea5t ph\u00e9p kh\u00f4ng?',
      en:'Does killing the Elder cost the village its powers at all?',
      now:elderStripsPowers(), byRule:true,
      note:'Hai b\u1ed9 lu\u1eadt \u0111\u1ec1u in l\u00e0 <b>c\u00f3</b>: d\u00e2n gi\u1ebft Tr\u01b0\u1edfng L\u00e3o th\u00ec to\u00e0n b\u1ed9 ph\u00e9p c\u1ee7a d\u00e2n l\u00e0ng m\u1ea5t s\u1ea1ch. ' +
           '\u0110\u00e2y l\u00e0 lu\u1eadt n\u1eb7ng nh\u1ea5t trong h\u1ed9p \u2014 m\u1ed9t l\u1ea7n b\u1ecf phi\u1ebfu sai l\u00e0 b\u1ea3y l\u00e1 ng\u1eebng ho\u1ea1t \u0111\u1ed9ng c\u1ea3 v\u00e1n \u2014 ' +
           'n\u00ean nhi\u1ec1u b\u00e0n b\u1ecf h\u1eb3n. Ch\u1ecdn <b>Kh\u00f4ng</b> th\u00ec Th\u1ee3 S\u0103n v\u1eabn b\u1eafn, Th\u1eb1ng Ng\u1ed1c v\u1eabn tho\u00e1t, ' +
           'v\u00e0 c\u00e2u h\u1ecfi ngay b\u00ean d\u01b0\u1edbi kh\u00f4ng c\u00f2n \u00fd ngh\u0129a.',
      noteEn:'Both rulesets print <b>yes</b>: if the village kills the Elder, every villager ' +
             'power is extinguished. It is the harshest rule in the box \u2014 one mis-aimed vote ' +
             'and seven cards stop working for the rest of the game \u2014 so plenty of tables ' +
             'drop it. Choose <b>No</b> and the Hunter still fires, the Idiot still walks away, ' +
             'and the question directly below this one stops mattering.' },
    { key:'selfHeal', q:'Phù Thuỷ tự cứu mình?',
      en:'May the Witch use her cure on herself?',
      now:witchMaySaveSelf(), byRule:byTradition,
      note:'Miller’s Hollow cho phép. Ma Sói Việt Nam thì không.',
      noteEn:'Miller\u2019s Hollow allows it. Ma S\u00f3i Vi\u1ec7t Nam does not.' },
    { key:'hunterPoison', q:'Thợ Săn bị thuốc độc có bắn được?',
      en:'Does the Hunter still fire when the Witch poisons him?',
      now:hunterFiresPoisoned(), byRule:byTradition,
      note:'Miller’s Hollow: bắn, vì luật nói \u201cchết vì bất cứ lý do gì\u201d. Ma Sói Việt Nam theo 狼人杀: thuốc độc thì không kịp giương súng.',
      noteEn:'Miller\u2019s Hollow: he fires, because the card says \u201ckilled by any cause\u201d. ' +
             'Ma S\u00f3i Vi\u1ec7t Nam follows \u72fc\u4eba\u6740: poison leaves no time to raise the gun.' },
    { key:'hunterElder', q:'Trưởng Lão bị dân giết \u2014 Thợ Săn còn bắn được?',
      en:'Does the Hunter still fire after the village kills the Elder?',
      now:hunterFiresPowerless(), byRule:false,
      note:'Hai lá bài nói khác nhau: Trưởng Lão xoá <b>toàn bộ</b> phép của dân làng và không trừ ai, ' +
           'còn bài Thợ Săn nói bắn khi \u201cchết vì bất cứ lý do gì\u201d. Không bộ luật nào xử vụ này, ' +
           'nên mặc định là <b>không bắn</b> \u2014 phát súng là một phép, và phép đã mất. ' +
           'Bàn nào coi súng là vật chứ không phải phép thì chọn \u201cCó\u201d.',
      noteEn:'The two cards read past each other: the Elder cancels <b>every</b> villager power ' +
             'and names no exception, while the Hunter\u2019s card says he fires when \u201ckilled by ' +
             'any cause\u201d. No ruleset addresses the interaction, so the default is <b>no shot</b> ' +
             '\u2014 the shot is a power, and the power is gone. A table that treats the gun as an ' +
             'object rather than a power should choose \u201cYes\u201d.' },
    { key:'showCards', q:'Người chết có lật bài không?',
      en:'Is a dead player\u2019s card turned face up?',
      now:cardsShownOnDeath(), byRule:byTradition,
      note:'Miller’s Hollow lật <b>mọi</b> lá \u2014 chết đêm hay bị treo, không trừ ai. ' +
           'Nhiều bàn Ma Sói Việt Nam thì <b>không lật bài</b> cho khó đoán hơn. ' +
           'Riêng Thằng Ngốc luôn phải lật, vì đó là cách dân làng biết mà tha.',
      noteEn:'Miller\u2019s Hollow turns <b>every</b> card \u2014 eaten at night or hanged by day, no ' +
             'exception. Many Ma S\u00f3i Vi\u1ec7t Nam tables <b>leave them face down</b>, which makes ' +
             'the deduction harder. The Village Idiot is turned either way: being shown is how the ' +
             'village learns to spare him.' },
    { key:'voteMajority', q:'Ph\u1ea3i qu\u00e1 b\u00e1n m\u1edbi treo \u0111\u01b0\u1ee3c?',
      en:'Must a name clear half the votes to be hanged?',
      now:voteNeedsMajority(), byRule:false,
      note:'C\u1ea3 hai b\u1ed9 lu\u1eadt \u0111\u1ec1u in l\u00e0 <b>kh\u00f4ng</b>: ai <b>nhi\u1ec1u phi\u1ebfu nh\u1ea5t</b> th\u00ec b\u1ecb treo, ' +
           'ho\u00e0 th\u00ec b\u1ea7u l\u1ea1i, v\u1eabn ho\u00e0 th\u00ec kh\u00f4ng ai ch\u1ebft. \u0110\u00f2i qu\u00e1 b\u00e1n nghe c\u00f3 v\u1ebb ch\u1eb7t ch\u1ebd h\u01a1n ' +
           'nh\u01b0ng b\u00e0n c\u00e0ng \u0111\u00f4ng phi\u1ebfu c\u00e0ng t\u1ea3n: 8 ng\u01b0\u1eddi chia 4/3/1 l\u00e0 \u0111\u00e3 kh\u00f4ng treo \u0111\u01b0\u1ee3c ai, ' +
           'd\u00f9 c\u1ea3 b\u00e0n \u0111\u00e3 b\u1ecf phi\u1ebfu r\u00f5 r\u00e0ng.',
      noteEn:'Both rulebooks print <b>no</b>: the <b>most votes</b> hangs, a tie is re-voted, ' +
             'and a tie that holds hangs nobody. Requiring a majority sounds stricter but the ' +
             'bigger the table the more the votes spread \u2014 on eight voters a 4/3/1 split ' +
             'hangs nobody at all, even though the table voted decisively.' },
    { key:'hunterNight', q:'Thợ Săn bị sói ăn \u2014 bắn ngay trong đêm?',
      en:'Is a night-eaten Hunter\u2019s shot taken privately, during the night?',
      now:hunterShootsInTheNight(), byRule:false,
      note:'Mặc định là <b>không</b>: công bố người chết rồi Thợ Săn chỉ trước mặt cả bàn, ' +
           'đúng như luật in. Chọn <b>Có</b> thì lấy mục tiêu lúc mọi người còn nhắm mắt, ' +
           'rồi sáng ra đọc cả hai cái chết mà không giải thích \u2014 dành cho bàn không lật bài. ' +
           'Chỉ áp dụng khi bị ăn đêm: bị treo ban ngày thì không cách nào giấu.',
      noteEn:'The default is <b>no</b>: announce the death, then let the Hunter point in front of ' +
             'the whole table, exactly as printed. Choose <b>Yes</b> to take the target while ' +
             'everyone still has their eyes shut, then read both deaths at dawn and explain ' +
             'neither \u2014 for a table that keeps cards face down. Only applies to a night kill: ' +
             'nothing hides a hanging.' },
  ];
  for (const r of rows){
    wrap.appendChild(el('div','grp', T(r.q, r.en)));
    const c = el('div','chips');
    const opts = [[null, T('Theo luật \u00b7 ' + (r.byRule ? 'có' : 'không'),
                            'Follow the rule \u00b7 ' + (r.byRule ? 'yes' : 'no'))],
                  [true, T('Có','Yes')], [false, T('Không','No')]];
    for (const [val, lab] of opts){
      const b = el('div','chip' + ((G[r.key] ?? null) === val ? ' sel' : ''), lab);
      b.onclick = () => { snap(); G[r.key] = val; render(); };
      c.appendChild(b);
    }
    wrap.appendChild(c);
    wrap.appendChild(el('p','note', T(r.note, r.noteEn) +
      ' <b>' + T('\u0110ang d\u00f9ng: ','Now: ') +
      (r.now ? T('c\u00f3','yes') : T('kh\u00f4ng','no')) + '.</b>'));
  }
  return wrap;
}

/* When the cards still to place are ALL THE SAME, every remaining seat is forced and
   there is nothing worth asking — so fill them and say so. Going once round a table of
   fifteen, the last four are almost always plain Villagers, and tapping "Dân làng" four
   times while fifteen people wait is four chances to mis-tap for no information.

   Two conditions, and the second is what makes it sound:

     1. the unplaced cards balance the unassigned seats. If they do not, the deck has
        stopped describing the table and nothing here is deducible.
     2. every unplaced card is the same role. Then there is no other card any of those
        seats could be holding, whatever route the deck took to get here.

   This replaces a rule that required exactly one seat and exactly one card. That was
   sound but far narrower, and its stated reason — that a Thief swap always leaves two
   slots looking free, so a drifted deck could never look forced — no longer applies:
   thiefTakes() keeps G.counts in step, so the deck balances again after a swap. Condition
   1 is now what refuses a drifted deck, and it refuses it in every shape, not just the
   Thief's.

   Returns the deduced role, or null when the answer is not actually forced. */
function autoFillForced(){
  const left = unassigned();
  const short = [];
  for (const k in G.counts){
    for (let i = withRole(k).length; i < G.counts[k]; i++) short.push(k);
  }
  /* Not `<`: a deck with MORE cards left than seats does not add up either, and deducing
     from it hands somebody a card the table does not have. No `left.length` guard above
     either — an empty board gives an empty `short`, which the next line already refuses. */
  if (short.length !== left.length) return null;       // the deck does not describe the table
  if (new Set(short).size !== 1) return null;          // more than one card left: ambiguous
  const id = short[0], r = R[id];
  left.forEach(p => p.role = id);
  const names = left.map(p => p.name).join(T(', ', ', '));
  log(left.length === 1
    ? T(names + ' c\u1ea7m l\u00e1 cu\u1ed1i c\u00f9ng, ' + rName(r) + '.',
        names + ' holds the last card, the ' + rName(r) + '.')
    : T(left.length + ' ng\u01b0\u1eddi c\u00f2n l\u1ea1i \u0111\u1ec1u l\u00e0 ' + rName(r) + ': ' + names + '.',
        'The remaining ' + left.length + ' are all ' + rName(r) + ': ' + names + '.'),
    T('Chu\u1ea9n b\u1ecb','Setup'));
  return r;
}

/* ---- collect the deal ---- */
function rLearn(){
  show('sLearn');
  $('lTtl').textContent = T('Ghi l\u1ea1i b\u1ed9 b\u00e0i', 'Collect the deal');
  $('lSub').textContent = T(
    '\u0110i m\u1ed9t v\u00f2ng quanh b\u00e0n. M\u1ed7i ng\u01b0\u1eddi cho b\u1ea1n xem l\u00e1 c\u1ee7a h\u1ecd, b\u1ea1n b\u1ea5m v\u00e0o. ' +
    'Sau \u0111\u00f3 app bi\u1ebft h\u1ebft, n\u00ean kh\u00f4ng bao gi\u1edd ph\u1ea3i l\u1eadt b\u00e0i gi\u1eefa \u0111\u00eam.',
    'Go once round the table. Each player shows you their card in private and you tap it in. ' +
    'After this the app knows everything, so no card is ever lifted mid-night.');
  const B = $('lrBody'); B.innerHTML = '';
  const known = G.players.filter(p => p.role).length, total = G.players.length;
  if (G.assignTo){
    const p = byId(G.assignTo);
    B.appendChild(el('div','grp', T(p.name + ' c\u1ea7m l\u00e1 g\u00ec?', 'What card does ' + p.name + ' hold?')));
    const c = el('div','chips');
    for (const r of ROLES){
      if (!G.counts[r.id]) continue;                 // only cards in this deck
      const placed = withRole(r.id).length, full = placed >= G.counts[r.id] && p.role !== r.id;
      const b = el('div','chip' + (p.role===r.id ? ' sel' : '') + (full ? ' dead' : ''),
        '<span class="ic">' + icOf(r.id) + '</span>' + rName(r) +
        '<span class="bd">' + placed + '/' + G.counts[r.id] + '</span>');
      if (!full) b.onclick = () => { snap(); p.role = r.id; G.assignTo = null;
        autoFillForced(); render(); };
      c.appendChild(b);
    }
    B.appendChild(c);
    bar([{ t: T('Hu\u1ef7','Cancel'), sec:true, wide:true, on:() => { G.assignTo = null; render(); } }]);
    return;
  }
  B.appendChild(el('div','tell' + (known === total ? ' ok' : ''),
    T('\u0110\u00e3 ghi ' + known + '/' + total + ' l\u00e1. B\u1ea5m v\u00e0o m\u1ed9t ng\u01b0\u1eddi \u0111\u1ec3 \u0111\u1eb7t l\u00e1 c\u1ee7a h\u1ecd.',
      known + ' of ' + total + ' cards recorded. Tap a player to set their card.')));
  const ros = el('div','ros group');
  G.players.forEach((p,i) => ros.appendChild(playerRow(p, i, () => { G.assignTo = p.id; render(); })));
  B.appendChild(ros);
  bar([{ t: T('Quay l\u1ea1i','Back'), sec:true, on:() => { snap(); G.phase='deal'; render(); } },
       { t: known === total
              ? T('B\u1eaft \u0111\u1ea7u \u0111\u00eam \u0111\u1ea7u ti\u00ean \u2192','Begin the first night \u2192')
              : T('C\u00f2n ' + (total-known) + ' ng\u01b0\u1eddi ch\u01b0a ghi', (total-known) + ' still to record'),
         off: known !== total,
         on:() => { snap(); G.knewDeal = true; G.night=1; G.phase='night'; buildNight();
           log(T('B\u1ed9 b\u00e0i \u0111\u00e3 \u0111\u01b0\u1ee3c ghi tr\u01b0\u1edbc khi ch\u01a1i, n\u00ean app bi\u1ebft h\u1ebft c\u1ea3 b\u00e0n.', 'The deal was collected before play, so the table is fully known.'), T('Chu\u1ea9n b\u1ecb','Setup'));
           log(T('\u0110\u00eam bu\u00f4ng xu\u1ed1ng Miller\u2019s Hollow.', 'Night falls on Miller\u2019s Hollow.'), T('\u0110\u00eam 1','Night 1')); render(); } }]);
}

/* ---- night ---- */
function rNight(){
  show('sNight');
  if (G.si >= G.steps.length){
    if (G.night === 1) return finishRollCall();
    G.phase = 'dawn'; computeDawn();
    /* A table that takes the shot privately needs it BEFORE the announcement, so both
       deaths are read out together and neither is explained. computeDawn has produced the
       plan but committed none of it, which is exactly the window: the Hunter is still
       alive, so he can still be asked. */
    if (hunterShootsInTheNight() && !G.nightShotTaken){
      const doomed = G.dawn.filter(d => d.on).map(d => ({ d, p: byId(d.id) }));
      const h = doomed.find(x => x.p && x.p.role === 'hunter' &&
        hunterWouldFire(x.p, x.d.cause).fires);
      if (h){ G.pending.nightShot = h.p.id; G.phase = 'hunter'; }
    }
    render(); return;
  }
  const s = G.steps[G.si], info = stepInfo(s);
  const roll = !!s.roll;
  const need = s.role === '__lovers' ? 0 : (G.counts[s.role] || 0);
  const have = s.role === '__lovers' ? 0 : withRole(s.role).length;
  const identified = s.role === '__lovers' || have === need;

  /* Ambient, not captioned. The header already carries "Roll call \u00b7 4 of 9" in words;
     this is the same fact as a filled rule, which reads at a glance and costs no
     vertical space. Both said it in 10px tracked micro-type before, and neither was
     legible without stopping to read it. */
  const st = $('nStep'), fill = st.firstElementChild;
  const done = G.steps.length ? (G.si + 1) / G.steps.length : 0;
  fill.style.width = Math.round(done * 100) + '%';
  st.setAttribute('aria-valuenow', String(G.si + 1));
  st.setAttribute('aria-valuemin', '1');
  st.setAttribute('aria-valuemax', String(G.steps.length));
  const vn = vnUI();
  const tIc = info.id === '__lovers' ? icOf('__lovers') : icOf(s.role);
  $('nTitle').innerHTML = (tIc ? '<span class="hIc">' + tIc + '</span>' : '') +
    ((vn && info.vi)
    ? info.vi + ' <span class="vi">' + info.name + '</span>'
    : info.name + (info.vi ? ' <span class="vi">' + info.vi + '</span>' : ''));
  const holders = s.role === '__lovers' ? G.players.filter(p => p.lover) : liveWith(s.role);
  $('nSub').textContent = (identified && holders.length ? holders.map(p=>p.name).join(', ') + ' \u2014 ' : '') + (info.d ? rDesc(info) : '');
  const primary = (vn && info.sayVi) ? info.sayVi : info.say;
  const second  = (vn && info.sayVi) ? info.say : info.sayVi;
  $('nSayT').innerHTML = (primary || '') +
    (second ? '<span class="alt' + (altLang ? ' on' : '') + '">' + second + '</span>' : '');
  const ab = $('bAltLang');
  ab.hidden = !second;
  ab.textContent = (altLang ? 'Hide ' : 'Show ') + (vn ? 'English' : 'Tiếng Việt');
  $('nSay').style.display = primary ? '' : 'none';

  const B = $('nBody'); B.innerHTML = '';
  const H = $('nHush'); H.innerHTML = '';

  /* A hushed call: read the line, wait, move on. Nobody wakes, and nothing is asked —
     but from the table it sounds identical to a real call, which is the point.

     The notice goes ABOVE the read-aloud line, and the heading carries a tag. It used to
     land in #nBody, below the say block, so the screen read: role name, what the card
     does, "point to the player whose true nature you wish to see" — and only then, small
     and underneath, that nobody was going to. A moderator moving at the speed of a real
     night reads that as the power still working, which is how it came back as a bug. */
  if (s.hush){
    const why = {
      dead:      T('L\u00e1 n\u00e0y \u0111\u00e3 ra kh\u1ecfi v\u00e1n.', 'This card is out of the game.'),
      spent:     T('L\u00e1 n\u00e0y kh\u00f4ng c\u00f2n g\u00ec \u0111\u1ec3 d\u00f9ng.', 'This card has nothing left to spend.'),
      powerless: T('D\u00e2n l\u00e0ng \u0111\u00e3 gi\u1ebft Tr\u01b0\u1edfng L\u00e3o, n\u00ean m\u1ecdi ph\u00e9p c\u1ee7a d\u00e2n \u0111\u1ec1u m\u1ea5t.', 'The village killed the Elder, so every villager power is gone.'),
    }[s.hush] || T('L\u01b0\u1ee3t g\u1ecdi n\u00e0y s\u1ebd kh\u00f4ng c\u00f3 g\u00ec x\u1ea3y ra.', 'Nothing will happen on this call.');
    $('nTitle').innerHTML += '<span class="hushTag">' +
      T('kh\u00f4ng ai th\u1ee9c', 'nobody wakes') + '</span>';
    $('nSub').textContent = why + ' Say the line anyway, leave the same pause, then carry on.';
    H.appendChild(el('div','alert no',
      T('<b>Kh\u00f4ng ai m\u1edf m\u1eaft \u0111\u00e2u.</b> ', '<b>Nobody will open their eyes.</b> ') + why +
      T(' Nh\u1eefng g\u00ec b\u1ea1n \u0111\u1ecdc ti\u1ebfp theo kh\u00f4ng ai th\u1ef1c hi\u1ec7n \u2014 \u0111\u1ecdc cho c\u1ea3 b\u00e0n nghe, kh\u00f4ng ph\u1ea3i cho m\u1ed9t ng\u01b0\u1eddi.', ' Nothing you read next is acted on — say it for the table, not for a player.') +
      '<p class="note">' + (s.hush === 'powerless'
        ? T('Vi\u1ec7c m\u1ea5t ph\u00e9p l\u00e0 c\u00f4ng khai, nh\u01b0ng c\u00f3 bao nhi\u00eau l\u01b0\u1ee3t g\u1ecdi bi\u1ebfn m\u1ea5t th\u00ec kh\u00f4ng \u2014 \u0111\u00f3 l\u00e0 c\u00e1ch c\u1ea3 b\u00e0n \u0111o\u00e1n \u0111\u01b0\u1ee3c b\u1ed9 b\u00e0i c\u00f3 m\u1ea5y l\u00e1 d\u00e2n c\u00f3 ph\u00e9p.', 'The lost powers are public, but how many calls vanish with them is not — that would tell the table how many powered village cards the deck held.')
        : T('B\u1ecf h\u1eb3n l\u01b0\u1ee3t g\u1ecdi l\u00e0 n\u00f3i cho c\u1ea3 b\u00e0n bi\u1ebft ai \u0111\u00e3 ch\u1ebft, r\u1ed3i h\u1ecd lo\u1ea1i tr\u1eeb d\u1ea7n ra nh\u1eefng ng\u01b0\u1eddi c\u00f2n l\u1ea1i.', 'Skipping the call would tell the table who is gone, and let them narrow the rest by elimination.')) +
      '</p>'));
    bar([{ t: T('Ti\u1ebfp \u2192','Next \u2192'), wide:true, on:() => { G.si++; render(); } }]);
    return;
  }

  // step 1 of a roll-call step: learn who holds this card. On a later night this is the
  // same panel reached a different way — the card is in the deck and still unaccounted for.
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
    /* "Skip" used to read as *not now* and mean *not this game*, and the reassurance was
       a promise the app could not keep: the night script was already built without the
       card and no later screen rebuilt it. It rebuilds from the deck now, so the sentence
       is true \u2014 and the button says which kind of skip this is, because a card nobody
       admits to holding is a gap in what the app knows, not a card that did nothing. */
    B.appendChild(el('p','note', have + ' of ' + need + ' identified.'));
    tip(T('N\u1ebfu kh\u00f4ng ai nh\u1eadn th\u00ec b\u1ecf qua: r\u1ea1ng s\u00e1ng t\u00f4i s\u1ebd n\u00f3i l\u00e0 t\u00f4i kh\u00f4ng d\u00e1m ch\u1eafc, ' +
        '\u0111\u00eam mai g\u1ecdi l\u1ea1i l\u00e1 n\u00e0y, v\u00e0 n\u1ebfu b\u1ea1n bi\u1ebft tr\u01b0\u1edbc \u0111\u00f3 th\u00ec \u0111\u1eb7t t\u1eeb Danh s\u00e1ch.',
      'If nobody answers, skip: I will say at dawn that I could not be sure, call this ' +
      'card again tomorrow night, and take it from the Roster if you learn it before then.'));
    flushTips(B, 'night');
    bar([{ t: T('Kh\u00f4ng ai tr\u1ea3 l\u1eddi \u00b7 b\u1ecf qua','Nobody answered \u00b7 skip'),
           sec:true, on:() => skipStep('card') }]);
    return;
  }

  const lg = liveWith('littlegirl').filter(p => !powerGone(p));
  if (s.role === 'wolf' && lg.length)
    B.appendChild(el('div','tell', T(
      'B\u00e9 G\u00e1i (' + lg.map(p=>p.name).join(', ') + ') c\u00f3 th\u1ec3 \u0111ang h\u00e9 m\u1eaft nh\u00ecn tr\u1ed9m. \u0110\u1ec3 \u00fd c\u00f4 b\u00e9.',
      'The Little Girl (' + lg.map(p=>p.name).join(', ') + ') may be peeking. Watch her.')));

  /* --- specials --- */
  if (info.special === 'witch'){
    const v = G.n.wolf ? byId(G.n.wolf) : null;
    const gone = () => T('\u0111\u00e3 d\u00f9ng','spent'), left = () => T('c\u00f2n','available');
    B.appendChild(el('div','tell',
      '<b>' + T('N\u1ea1n nh\u00e2n \u0111\u00eam nay:','Tonight\u2019s victim:') + '</b> ' +
      (v ? v.name : T('ch\u01b0a ch\u1ecdn ai','nobody chosen yet')) +
      '<p class="note">' + T('Thu\u1ed1c c\u1ee9u ','Healing potion ') + (G.witchHeal ? left() : gone()) +
      ' \u00b7 ' + T('Thu\u1ed1c \u0111\u1ed9c ','Poison ') + (G.witchPoison ? left() : gone()) + '</p>'));
    const she = holders[0] || null;                    // the Witch herself
    const selfVictim = !!(she && v && v.id === she.id);
    if (G.witchHeal && v){
      // Self-rescue is the one place the two traditions disagree. Miller’s Hollow
      // lets her drink her own cure; Vietnamese play does not.
      const blockSelf = selfVictim && !witchMaySaveSelf();
      if (selfVictim) B.appendChild(el('div', blockSelf ? 'alert no' : 'tell', blockSelf
        ? T('N\u1ea1n nh\u00e2n ch\u00ednh l\u00e0 Ph\u00f9 Thu\u1ef7. Lu\u1eadt Vi\u1ec7t Nam kh\u00f4ng cho c\u00f4 t\u1ef1 u\u1ed1ng thu\u1ed1c c\u1ee9u \u2014 <b>kh\u00f4ng \u0111\u01b0\u1ee3c t\u1ef1 c\u1ee9u</b>.', 'The victim is the Witch herself. Vietnamese rules do not let her drink her own cure \u2014 <b>kh\u00f4ng \u0111\u01b0\u1ee3c t\u1ef1 c\u1ee9u</b>.')
        : T('N\u1ea1n nh\u00e2n ch\u00ednh l\u00e0 Ph\u00f9 Thu\u1ef7. Miller\u2019s Hollow cho ph\u00e9p c\u00f4 t\u1ef1 c\u1ee9u.', 'The victim is the Witch herself. Miller’s Hollow allows her to save herself.')));
      const b = el('button','btn sm sec', (G.n.witchSave
      ? T('\u2713 \u0110ang c\u1ee9u ', '\u2713 Saving ') : T('C\u1ee9u ', 'Save ')) + v.name);
      b.disabled = blockSelf;
      b.onclick = () => { G.n.witchSave = !G.n.witchSave; render(); };
      /* One row, so the two read as a choice rather than as one control with a tail. */
      const row = el("div","row flow");
      row.appendChild(b);
      if (blockSelf){
        const allow = el("button","btn sm sec", T('B\u00e0n n\u00e0y cho t\u1ef1 c\u1ee9u','Our table allows self-rescue'));
        allow.onclick = () => { snap(); G.selfHeal = true; render(); };
        row.appendChild(allow);
      }
      B.appendChild(row);
    }
    if (G.witchPoison){
      B.appendChild(el('div','grp', T('\u0110\u1ea7u \u0111\u1ed9c ai \u0111\u00f3 (kh\u00f4ng b\u1eaft bu\u1ed9c)','Poison someone (optional)')));
      const c = el('div','chips');
      // She is never offered to herself. No ruleset has a witch poisoning herself,
      // and leaving her in the list is one mis-tap away from a nonsense entry.
      for (const p of alive()){
        if (she && p.id === she.id) continue;
        c.appendChild(chip(p, { sel:G.n.witchKill===p.id,
          on:() => { G.n.witchKill = G.n.witchKill===p.id ? null : p.id; render(); } }));
      }
      B.appendChild(c);
      if (she) tip(T(she.name + ' kh\u00f4ng c\u00f3 trong danh s\u00e1ch \u2014 Ph\u00f9 Thu\u1ef7 kh\u00f4ng t\u1ef1 \u0111\u1ea7u \u0111\u1ed9c m\u00ecnh \u0111\u01b0\u1ee3c.',
        she.name + ' is not listed \u2014 the Witch cannot poison herself.'));
      if (G.n.witchKill && G.n.witchKill === G.n.wolf && !G.n.witchSave)
        B.appendChild(el('div','tell', T(
          '\u0110\u00f3 \u0111\u00e3 l\u00e0 n\u1ea1n nh\u00e2n c\u1ee7a b\u1ea7y s\u00f3i \u0111\u00eam nay. Thu\u1ed1c \u0111\u1ed9c s\u1ebd m\u1ea5t kh\u00f4ng.',
          'That is already the wolves\u2019 victim tonight. The poison would be spent for nothing.')));
    }
    flushTips(B, 'night');
    bar([{ t: T('B\u1ecf qua','Skip'), sec:true, on:() => skipStep() },
         { t: T('Xong \u2192','Done \u2192'), on:() => { snap();
           if (G.n.witchSave) G.witchHeal = false;
           if (G.n.witchKill) G.witchPoison = false;
           G.si++; render(); } }]);
    return;
  }
  if (info.special === 'hound'){
    B.appendChild(el('div','grp', T('H\u1ecd ch\u1ecdn phe n\u00e0o?','Which side did they choose?')));
    const c = el('div','chips');
    for (const side of ['village','wolf']){
      const b = el('div','chip' + (G.houndSide===side?' sel':''), side==='wolf' ? 'Werewolf' : 'Villager');
      b.onclick = () => { snap(); G.houndSide = side;
        log(T('S\u00f3i Ch\u00f3 \u0111\u00e3 ch\u1ecdn ' + (side==='wolf'?'b\u1ea7y s\u00f3i':'d\u00e2n l\u00e0ng') + '.', 'The Wolf Hound chose the ' + (side==='wolf'?'pack':'village') + '.')); G.si++; render(); };
      c.appendChild(b);
    }
    B.appendChild(c);
    bar([{ t: T('B\u1ecf qua','Skip'), sec:true, on:() => skipStep() }]);
    return;
  }
  if (info.special === 'thief'){
    B.appendChild(el('div','tell', T(
      'Cho anh ta xem hai l\u00e1 d\u01b0. N\u1ebfu \u0111\u1ed5i th\u00ec ch\u1ecdn l\u00e1 m\u1edbi \u1edf d\u01b0\u1edbi.',
      'Show him the two spare cards. If he swaps, set his new card below.') +
      '<p class="note">' + T('N\u1ebfu c\u1ea3 hai l\u00e1 d\u01b0 \u0111\u1ec1u l\u00e0 Ma S\u00f3i th\u00ec anh ta <b>b\u1eaft bu\u1ed9c</b> ph\u1ea3i l\u1ea5y m\u1ed9t.',
        'If both spares are Werewolves he <b>must</b> take one.') + '</p>'));
    B.appendChild(el('div','grp', T('Anh ta \u0111\u1ed5i l\u1ea5y','He swapped for')));
    const th = withRole('thief')[0];
    const c = el('div','chips');
    for (const r of ROLES){
      if (r.id === 'thief') continue;
      const b = el('div','chip', '<span class="ic">' + icOf(r.id) + '</span>' + rName(r));
      b.onclick = () => { snap(); if (th) thiefTakes(th, r); G.si++; render(); };
      c.appendChild(b);
    }
    B.appendChild(c);
    /* "He kept his card" is an ANSWER, so it is not routed through skipStep: recording
       it as a gap would make the app unsure about a night in which nothing is unknown.
       The moderator who never got round to asking him needs the other button. */
    bar([{ t: T('Ch\u01b0a h\u1ecfi \u00b7 b\u1ecf qua','Not asked \u00b7 skip'), sec:true, on:() => skipStep('card') },
         { t: T('Gi\u1eef nguy\u00ean l\u00e1 c\u1ee7a m\u00ecnh \u2192','He kept his card \u2192'), on:() => { snap(); G.si++; render(); } }]);
    return;
  }

  const pickN = info.pick || 0;
  if (!pickN){
    B.appendChild(el('div','tell', roll
      ? T('\u0110\u00e3 ghi. \u0110\u00eam nay kh\u00f4ng c\u00f2n g\u00ec ph\u1ea3i l\u00e0m \u2014 l\u00e1 n\u00e0y ra tay khi \u0111\u1ebfn l\u00fac.',
          'Noted. Nothing more to do tonight \u2014 this card acts when the moment comes.')
      : T('B\u01b0\u1edbc n\u00e0y kh\u00f4ng c\u00f3 g\u00ec \u0111\u1ec3 ghi.', 'Nothing to record for this step.')));
    bar([{ t: T('Ti\u1ebfp \u2192','Next \u2192'), wide:true, on:() => { snap(); if (info.say) log(T(T(info.vi, info.name) + ' \u0111\u00e3 \u0111\u01b0\u1ee3c g\u1ecdi.', info.name + ' was called.')); G.si++; render(); } }]);
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
  if (!pool.length) B.appendChild(el('div','alert no', T(
    '\u0110\u00eam nay kh\u00f4ng c\u00f3 ai h\u1ee3p l\u1ec7 \u0111\u1ec3 ch\u1ec9 v\u00e0o. B\u1ecf qua b\u01b0\u1edbc n\u00e0y.',
    'There is nobody they may legally point at tonight. Skip this step.')));
  const tn = targetNote(s.role);
  if (tn) B.appendChild(el('p','note', tn));
  if ((s.role === 'wolf' || s.role === 'whitewolf') && !wolfSideKnown())
    B.appendChild(el('div','tell', unplacedWolfCards() + T(
      ' ch\u01b0a bi\u1ebft ai c\u1ea7m, n\u00ean t\u00f4i kh\u00f4ng d\u00e1m ch\u1eafc danh s\u00e1ch n\u00e0y \u0111\u00e3 lo\u1ea1i h\u1ebft s\u00f3i \u2014 \u0111\u1ed1i chi\u1ebfu v\u1edbi b\u00e0i th\u1eadt.',
      ' still unaccounted for, so I cannot promise this list excludes every wolf \u2014 check it against the real deal.')));
  if (info.after) B.appendChild(el('p','note', info.after));
  if (blocked) B.appendChild(el('p','note','Cannot shield ' + byId(blocked).name + ' again \u2014 they were protected last night.'));

  if (s.role === 'seer'){
    tip(G.rules === 'vn'
      ? T('\u1ede \u0111\u00e2y Ti\u00ean Tri \u0111\u01b0\u1ee3c g\u1ecdi sau b\u1ea7y s\u00f3i, n\u00ean t\u00f4i \u0111\u00e3 bi\u1ebft h\u1ebft s\u00f3i v\u00e0 tr\u1ea3 l\u1eddi \u0111\u01b0\u1ee3c ngay tr\u00ean m\u00e0n h\u00ecnh.', 'She is called after the pack here, so I already know every wolf and can answer on screen.')
      : T('Ti\u00ean Tri \u0111\u01b0\u1ee3c g\u1ecdi tr\u01b0\u1edbc b\u1ea7y s\u00f3i l\u00e0 c\u00f3 ch\u1ee7 \u00fd \u2014 c\u00f4 ph\u1ea3i ch\u1ecdn m\u00e0 ch\u01b0a bi\u1ebft n\u1ea1n nh\u00e2n \u0111\u00eam nay. Ph\u00f9 Thu\u1ef7 \u0111\u01b0\u1ee3c g\u1ecdi cu\u1ed1i c\u00f9ng v\u00ec l\u00fd do ng\u01b0\u1ee3c l\u1ea1i.', 'She is called before the pack on purpose \u2014 she must commit without knowing tonight\u2019s victim. The Witch is called last for the opposite reason.'));
  }
  if (s.role === 'fox'){
    tip(G.rules === 'vn'
      ? T('\u1ede \u0111\u00e2y C\u00e1o \u0111\u01b0\u1ee3c g\u1ecdi sau b\u1ea7y s\u00f3i, n\u00ean t\u00f4i \u0111\u00e3 bi\u1ebft h\u1ebft s\u00f3i v\u00e0 tr\u1ea3 l\u1eddi \u0111\u01b0\u1ee3c m\u00e0 b\u1ea1n kh\u00f4ng ph\u1ea3i \u0111\u1ee5ng v\u00e0o b\u00e0i.', 'He is called after the pack here, so I already know every wolf and can answer without you touching a card.')
      : T('Miller\u2019s Hollow g\u1ecdi C\u00e1o tr\u01b0\u1edbc b\u1ea7y s\u00f3i. Anh ta ng\u1ee7 trong l\u00fac s\u00f3i ch\u1ecdn n\u00ean kh\u00f4ng thi\u1ec7t g\u00ec \u2014 nh\u01b0ng \u0111\u00eam \u0111\u1ea7u ti\u00ean t\u00f4i c\u00f3 th\u1ec3 ch\u01b0a bi\u1ebft b\u1ea7y s\u00f3i, v\u00e0 t\u00f4i s\u1ebd h\u1ecfi ch\u1ee9 kh\u00f4ng \u0111o\u00e1n.', 'Miller’s Hollow calls him before the pack. He is asleep while the wolves choose, so it costs him nothing \u2014 but on the first night I may not know the pack yet, and I will ask rather than guess.'));
  }
  // The Seer's look is how a moderator reads a card mid-night. If the app has
  // never seen that card, it asks, and remembers it from then on.
  if (s.role === 'seer' && chosen.length === 1){
    const t = byId(chosen[0]);
    const vnAnswerable = G.rules === 'vn' && wolfSideKnown();
    if (t.role || vnAnswerable){
      B.appendChild(el('div','tell ok', G.rules === 'vn'
        ? T('C\u00f4 ch\u1ec9 c\u1ea7n bi\u1ebft ng\u01b0\u1eddi \u0111\u00f3 c\u00f3 ph\u1ea3i phe s\u00f3i kh\u00f4ng, m\u00e0 t\u00f4i bi\u1ebft h\u1ebft s\u00f3i r\u1ed3i. Tr\u1ea3 l\u1eddi tr\u00ean m\u00e0n h\u00ecnh \u2014 kh\u00f4ng \u0111\u1ee5ng v\u00e0o b\u00e0i tr\u00ean b\u00e0n.', 'She only needs to know whether they are on the werewolf side, and I know every wolf. Answer on the screen \u2014 touch nothing on the table.')
        : T('T\u00f4i bi\u1ebft l\u00e1 n\u00e0y. Tr\u1ea3 l\u1eddi c\u00f4 tr\u00ean m\u00e0n h\u00ecnh \u2014 kh\u00f4ng \u0111\u1ee5ng v\u00e0o b\u00e0i, \u0111\u1ec3 kh\u00f4ng ai c\u1ea3m th\u1ea5y b\u00e0i m\u00ecnh b\u1ecb nh\u1ea5c l\u00ean.', 'I know this card. Answer her on the screen \u2014 touch nothing on the table, so nobody can feel their card being lifted.')));
      const sb = el('button','btn wide', T('Cho c\u00f4 xem c\u00e2u tr\u1ea3 l\u1eddi','Show her the answer'));
      sb.onclick = () => showSeer(t);
      B.appendChild(sb);
    } else {
      B.appendChild(el('div','tell', T(
        'T\u00f4i ch\u01b0a t\u1eebng th\u1ea5y l\u00e1 c\u1ee7a ' + t.name + ', n\u00ean b\u1ea1n ph\u1ea3i xem b\u00e0i ngay t\u1ea1i b\u00e0n.',
        'I have never seen ' + t.name + '\u2019s card, so you must read it at the table.')));
      tip(T('<b>\u0110\u1ecdc b\u00e0i m\u00e0 kh\u00f4ng \u0111\u1ec3 l\u1ed9.</b><br>' +
        '\u00b7 B\u1eadt <b>\u266b ti\u1ebfng \u0111\u00eam</b> trong Danh s\u00e1ch. M\u01b0a che ti\u1ebfng l\u1eadt b\u00e0i v\u00e0 ti\u1ebfng ch\u00e2n b\u1ea1n.<br>' +
        '\u00b7 \u0110i <b>h\u1ebft m\u1ed9t v\u00f2ng</b>, \u0111\u00eam n\u00e0o c\u0169ng v\u1eady, d\u00f9 c\u00f3 c\u1ea7n \u0111\u1ecdc g\u00ec hay kh\u00f4ng.<br>' +
        '\u00b7 Ch\u1ea1m v\u00e0o <b>ba b\u1ed1n l\u00e1</b>, kh\u00f4ng ch\u1ec9 l\u00e1 c\u1ea7n xem. Ch\u1ec9 b\u1ea1n bi\u1ebft l\u00e1 n\u00e0o m\u1edbi quan tr\u1ecdng.<br>' +
        '\u00b7 T\u1ed1t h\u01a1n n\u1eefa: <b>thu h\u1ebft b\u00e0i</b> sau l\u1ea7n l\u1eadt \u0111\u1ea7u v\u00e0 x\u1ebfp theo th\u1ee9 t\u1ef1 ch\u1ed7 ng\u1ed3i tr\u00ean \u0111\u00f9i. ' +
        'Khi \u0111\u00f3 kh\u00f4ng c\u00f2n g\u00ec \u1edf ch\u1ed7 n\u00e0o \u0111\u1ec3 nh\u1ea5c, v\u00e0 b\u1ea1n \u0111\u1ecdc \u0111\u01b0\u1ee3c b\u1ea5t k\u1ef3 l\u00e1 n\u00e0o trong im l\u1eb7ng.',
        '<b>Read it without giving it away.</b><br>' +
        '\u00b7 Turn on <b>\u266b night sounds</b> in the Roster. Rain covers the card and your footsteps.<br>' +
        '\u00b7 Walk the <b>whole circle</b>, every night, whether or not you need to read anything.<br>' +
        '\u00b7 Touch <b>three or four cards</b>, not just theirs. Only you know which one mattered.<br>' +
        '\u00b7 Better still: <b>collect all the cards</b> after the first reveal and keep them stacked in ' +
        'seat order in your lap. Then there is nothing at any seat to lift, and you can read any card in silence.'));
      B.appendChild(el('p','note','Tap what you saw and I will answer on screen from now on \u2014 you will never need to read that card again.'));
      const rc = el('div','chips');
      for (const r of ROLES){
        const b = el('div','chip', icOf(r.id) + r.name);
        b.onclick = () => { snap(); t.role = r.id;
          log(T('Ti\u00ean Tri th\u1ea5y ' + t.name + ' l\u00e0 ' + rName(r) + '.', 'The Seer saw that ' + t.name + ' is the ' + r.name + '.')); render(); };
        rc.appendChild(b);
      }
      B.appendChild(rc);
    }
  }

  let needAnswer = false;
  if (info.special === 'fox' && chosen.length === 1){
    const t = byId(chosen[0]), grp = [t, ...neighbours(t)];
    // always name the trio, so the moderator knows who is being checked
    B.appendChild(el('div','tell',
      '<b>' + T('\u0110ang ng\u1eedi:','Sniffing:') + '</b> ' + grp.map(p=>p.name).join(' \u00b7 ') +
      '<p class="note">' + T('Ng\u01b0\u1eddi anh ta ch\u1ec9, c\u1ed9ng hai ng\u01b0\u1eddi s\u1ed1ng b\u00ean c\u1ea1nh.',
        'The card he points at, plus their two living neighbours.') + '</p>'));
    // I do not need to know what these three hold — only whether any is a wolf.
    if (wolfSideKnown()){
      G.n.foxAns = grp.some(isWolf);
      B.appendChild(el('div','tell ok', T(
        'M\u1ecdi l\u00e1 s\u00f3i \u0111\u1ec1u \u0111\u00e3 c\u00f3 ch\u1ee7, n\u00ean t\u00f4i tr\u1ea3 l\u1eddi ch\u1eafc ch\u1eafn \u0111\u01b0\u1ee3c. Cho anh ta xem tr\u00ean m\u00e0n h\u00ecnh \u2014 kh\u00f4ng \u0111\u1ee5ng v\u00e0o b\u00e0i.',
        'Every wolf card is placed, so I can answer this with certainty. Show him on the screen \u2014 touch nothing on the table.')));
    } else {
      needAnswer = G.n.foxAns == null;
      B.appendChild(el('div','tell',
        T('Ch\u01b0a ch\u1eafc \u0111\u01b0\u1ee3c: <b>','I cannot be certain yet: <b>') + unplacedWolfCards() +
        T('</b> ch\u01b0a bi\u1ebft ai c\u1ea7m. B\u1ea1n t\u1ef1 xem ba l\u00e1 \u0111\u00f3 r\u1ed3i cho t\u00f4i bi\u1ebft \u2014 t\u00f4i kh\u00f4ng \u0111o\u00e1n b\u1eeba.',
          '</b> still unaccounted for. Look at those three cards yourself, then tell me what you found \u2014 I will not guess.')));
      const yn = el('div','chips');
      const y = el('div','chip' + (G.n.foxAns === true ? ' sel' : ''),
        T('Trong ba ng\u01b0\u1eddi n\u00e0y c\u00f3 s\u00f3i', 'A werewolf is among them'));
      y.onclick = () => { G.n.foxAns = true; render(); };
      const no = el('div','chip' + (G.n.foxAns === false ? ' sel' : ''),
        T('Kh\u00f4ng c\u00f3 \u2014 C\u00e1o m\u1ea5t ph\u00e9p', 'None \u2014 he loses his power'));
      no.onclick = () => { G.n.foxAns = false; render(); };
      yn.append(y, no); B.appendChild(yn);
    }
    // the same button the Seer gets, once there is an answer to give
    if (G.n.foxAns != null){
      const fb = el('button','btn wide', T('Cho anh ta xem c\u00e2u tr\u1ea3 l\u1eddi','Show him the answer'));
      fb.onclick = () => showFox(grp, G.n.foxAns);
      B.appendChild(fb);
    }
  }
  flushTips(B, 'night');
  bar([{ t: T('B\u1ecf qua','Skip'), sec:true, on:() => skipStep() },
       { t: T('X\u00e1c nh\u1eadn \u2192','Confirm \u2192'), off:chosen.length !== pickNeed || pickNeed === 0 || needAnswer,
         on:() => { snap(); applyStep(s, chosen); G.si++; render(); } }]);
}
function applyStep(s, chosen){
  const info = stepInfo(s);
  const nm = ids => ids.map(i => byId(i).name).join(' and ');
  switch (s.role){
    case 'wolf': G.n.wolf = chosen[0]; log(T('B\u1ea7y s\u00f3i ch\u1ecdn ' + byId(chosen[0]).name + '.', 'The pack chose ' + byId(chosen[0]).name + '.')); break;
    case 'whitewolf': G.n.white = chosen[0]; log(T('S\u00f3i Tr\u1eafng \u0111\u00e1nh d\u1ea5u ' + byId(chosen[0]).name + '.', 'The White Werewolf marked ' + byId(chosen[0]).name + '.')); break;
    case 'seer': log(T('Ti\u00ean Tri soi ' + byId(chosen[0]).name + '.', 'The Seer looked at ' + byId(chosen[0]).name + '.')); break;
    case 'cupid':
      G.players.forEach(p => p.lover = false);
      chosen.forEach(i => byId(i).lover = true);
      log(T('Th\u1ea7n T\u00ecnh Y\u00eau n\u1ed1i ' + nm(chosen) + '.', 'Cupid joined ' + nm(chosen) + '.')); break;
    case 'wildchild':
      G.players.forEach(p => p.model = false);
      byId(chosen[0]).model = true;
      log(T('\u0110\u1ee9a Tr\u1ebb Hoang l\u1ea5y ' + byId(chosen[0]).name + ' l\u00e0m h\u00ecnh m\u1eabu.', 'The Wild Child took ' + byId(chosen[0]).name + ' as a model.')); break;
    case 'piper':
      chosen.forEach(i => byId(i).charmed = true);
      log(T('Ng\u01b0\u1eddi Th\u1ed5i S\u00e1o m\u00ea ho\u1eb7c ' + nm(chosen) + '.', 'The Piper charmed ' + nm(chosen) + '.')); break;
    case 'guard': G.n.guard = chosen[0]; log(T('B\u1ea3o V\u1ec7 che ch\u1edf ' + byId(chosen[0]).name + '.', 'The Bodyguard shielded ' + byId(chosen[0]).name + '.')); break;
    case 'fox': {
      const t = byId(chosen[0]), grp = [t, ...neighbours(t)];
      const hit = G.n.foxAns != null ? G.n.foxAns : grp.some(isWolf);
      if (!hit) G.foxPower = false;
      log(T('C\u00e1o ng\u1eedi ' + t.name + ' \u2014 ' +
              (hit ? 'c\u00f3 s\u00f3i trong ba ng\u01b0\u1eddi' : 'kh\u00f4ng c\u00f3, v\u00e0 m\u1ea5t ph\u00e9p') + '.',
            'The Fox sniffed ' + t.name + ' \u2014 ' +
              (hit ? 'a wolf was among them' : 'nothing, and lost his power') + '.'));
      break; }
    default: if (info.say) log(T(T(info.vi, info.name) + ' \u0111\u00e3 \u0111\u01b0\u1ee3c g\u1ecdi.', info.name + ' was called.'));
  }
}
function finishRollCall(){
  snap();
  const left = unassigned(), v = G.counts.villager || 0;
  if (left.length && left.length === v){
    left.forEach(p => p.role = 'villager');
    log(T(left.length + ' ng\u01b0\u1eddi c\u00f2n l\u1ea1i l\u00e0 D\u00e2n l\u00e0ng.', 'The remaining ' + left.length + ' are Simple Villagers.'));
  } else if (left.length){
    log(T('C\u00f2n ' + left.length + ' l\u00e1 ch\u01b0a bi\u1ebft ai c\u1ea7m.', left.length + ' card' + (left.length>1?'s':'') + ' still unaccounted for.'));
  }
  G.phase = 'dawn'; computeDawn(); render();
}

/* ---- dawn ---- */
function rDawn(){
  show('sDawn');
  $('dwTitle').textContent = T('R\u1ea1ng s\u00e1ng ng\u00e0y ', 'Dawn of day ') + G.night;
  $('dwSub').textContent = T(
    'Lu\u1eadt \u0111\u00e3 quy\u1ebft xong \u0111\u00eam nay. \u0110\u1ecdc to l\u00ean, r\u1ed3i sang ban ng\u00e0y.',
    'The rules have already settled the night. Read it out, then move to the day.');
  const B = $('dwBody'); B.innerHTML = '';
  const un = unassigned();
  if (un.length) B.appendChild(el('div','tell',
    T('Ch\u01b0a bi\u1ebft: ','Still unknown: ') + un.map(p=>p.name).join(', ') +
    T('. \u0110\u1eb7t l\u00e1 c\u1ee7a h\u1ecd t\u1eeb Danh s\u00e1ch khi b\u1ea1n bi\u1ebft.', '. Set their cards from the Roster when you learn them.')));
  for (const b of liveWith('beartamer').filter(p => !powerGone(p))){
    const nb = neighbours(b);
    if (!wolfSideKnown()){
      B.appendChild(el('div','tell',
        T('Ng\u01b0\u1eddi D\u1ea1y G\u1ea5u <b>','Bear Tamer <b>') + b.name + '</b> \u2014 ' + unplacedWolfCards() +
        T(' ch\u01b0a bi\u1ebft ai c\u1ea7m, n\u00ean t\u00f4i kh\u00f4ng bi\u1ebft c\u00f3 ph\u1ea3i g\u1ea7m hay kh\u00f4ng. B\u1ea1n t\u1ef1 ki\u1ec3m tra.', ' still unaccounted for, so I cannot tell you whether to growl. Check yourself.')));
    } else {
      const growl = nb.some(isWolf);
      // the growl is one of the two or three things that genuinely stop the moderator
      B.appendChild(el('div', growl ? 'alert' : 'tell ok',
        T('Ng\u01b0\u1eddi D\u1ea1y G\u1ea5u <b>','Bear Tamer <b>') + b.name + '</b> \u2014 ' +
        T('h\u00e0ng x\u00f3m ','neighbours ') + nb.map(p=>p.name).join(' & ') + '. ' +
        (growl ? T('<b>G\u1ea6M L\u00caN.</b>','<b>GROWL.</b>') : T('Im l\u1eb7ng.','Stay silent.'))));
    }
  }
  const on = G.dawn.filter(d => d.on);
  // State the outcome. The rules already decided it; the moderator just reads it out.
  B.appendChild(el('div','grp', T('C\u00f4ng b\u1ed1','Announce')));
  const head = on.length
    ? on.map(d => byId(d.id).name).join(T(' v\u00e0 ',' and ')) +
      T(' \u0111\u00e3 ch\u1ebft.', on.length > 1 ? ' are dead.' : ' is dead.')
    : T('\u0110\u00eam qua kh\u00f4ng ai ch\u1ebft.','Nobody died in the night.');
  const say = el('div','say');
  say.innerHTML = '<div class="lbl">' + T('\u0110\u1ecdc to','Read aloud') + '</div><p>' + head + '</p>';
  B.appendChild(say);
  // What to do with the cards. Said here because this is the moment the deaths become
  // public, and the app used to leave it entirely unstated.
  if (on.length) B.appendChild(el('p','note', revealNote(on.map(d => byId(d.id)))));

  if (G.dawnWhy && G.dawnWhy.length){
    const w = el('div','why');
    w.innerHTML = '<div class="k">' + T('V\u00ec sao nh\u01b0 v\u1eady','How that follows') + '</div>' +
      G.dawnWhy.map(t => '<p>\u00b7 ' + t + '</p>').join('');
    B.appendChild(w);
  }
  if (on.length){
    const g = el('div','group');
    for (const d of on){
      const p = byId(d.id);
      const row = el('div','p');
      row.innerHTML = icSpanD(p) + '<span class="nm">' + p.name + '</span>' +
        '<span class="rl">' + causeLabel(d.cause) + '</span>';
      g.appendChild(row);
    }
    B.appendChild(g);
  }

  // computeDawn opens the editor once, on entering dawn. Setting it here fired on every
  // render, so the collapse was unreachable and the announcement was read with the whole
  // adjust list and the add-someone chip set underneath it.
  if (!G.dawnSure)
    B.appendChild(el('div','tell',
      T('\u0110\u00eam nay t\u00f4i kh\u00f4ng d\u00e1m ch\u1eafc \u2014 ','I cannot be certain tonight \u2014 ') +
      G.dawnGaps.join('; ') +
      T('. Ki\u1ec3m tra k\u1ebft qu\u1ea3 b\u00ean d\u01b0\u1edbi tr\u01b0\u1edbc khi c\u00f4ng b\u1ed1.', '. Check the outcome below before you announce it.')));

  if (!G.dawnEdit){
    const adj = el('button','btn sec sm', T('C\u00f3 chuy\u1ec7n kh\u00e1c x\u1ea3y ra \u2014 s\u1eeda','Something else happened \u2014 adjust'));
    adj.onclick = () => { G.dawnEdit = true; render(); };
    B.appendChild(adj);
  } else {
    // Opening it once was only half the fix: there was no way back, so an uncertain dawn
    // was still read out with the whole adjust list and the chip set underneath it.
    const hide = el('button','btn sec sm', T('Danh s\u00e1ch \u0111\u00fang r\u1ed3i \u2014 \u1ea9n \u0111i','The list is right \u2014 hide it'));
    hide.onclick = () => { G.dawnEdit = false; render(); };
    B.appendChild(hide);
    B.appendChild(el('div','grp', T('S\u1eeda \u2014 b\u1ea5m \u0111\u1ec3 th\u00eam ho\u1eb7c b\u1ecf','Adjust \u2014 tap to include or exclude')));
    const ag = el('div','group');
    for (const d of G.dawn){
      const p = byId(d.id);
      const row = el('div','p' + (d.on ? '' : ' dead'));
      row.innerHTML = icSpanD(p) + '<span class="nm">' + p.name + '</span>' +
        '<span class="rl">' + (d.on ? causeLabel(d.cause) : 'spared') + '</span>';
      row.style.cursor = 'pointer';
      row.onclick = () => { buzz('tap'); d.on = !d.on; render(); };
      ag.appendChild(row);
    }
    B.appendChild(ag);
    B.appendChild(el('div','grp', T('Th\u00eam ng\u01b0\u1eddi m\u00e0 lu\u1eadt kh\u00f4ng x\u1eed \u0111\u1ebfn','Add someone the rules did not cover')));
    const c = el('div','chips');
    for (const p of alive()){
      if (G.dawn.some(d => d.id === p.id)) continue;
      c.appendChild(chip(p, { on:() => { G.dawn.push({ id:p.id, cause:'night', on:true }); render(); } }));
    }
    B.appendChild(c);
  }
  if (on.some(d => byId(d.id).role === 'hunter'))
    B.appendChild(el('div','tell', T(
      'Th\u1ee3 S\u0103n n\u1eb1m trong s\u1ed1 ng\u01b0\u1eddi ch\u1ebft \u2014 anh ta b\u1eafn tr\u01b0\u1edbc khi tr\u1eddi s\u00e1ng h\u1eb3n.',
      'The Hunter is among the dead \u2014 he fires before the day begins.')));
  bar([{ t: T('C\u00f4ng b\u1ed1 r\u1ea1ng s\u00e1ng \u2192','Announce the dawn \u2192'), wide:true, on:applyDawn }]);
}
function icSpanD(p){ return pIcon(p); }

/* ---- day ---- */
function rDay(){
  // If the board is already decided \u2014 parity reached, last wolf dead \u2014 say so
  // rather than asking for a vote nobody needs.
  const settled = checkWin();
  if (settled) return finish(settled);
  show('sDay');
  $('dyTitle').textContent = T('Ng\u00e0y ','Day ') + G.day;
  const A = alive();
  $('dySub').textContent = T(
    'C\u00f2n ' + A.length + ' ng\u01b0\u1eddi s\u1ed1ng, ' + A.filter(isWolf).length + ' trong s\u1ed1 \u0111\u00f3 kh\u00f4ng nh\u01b0 v\u1ebb ngo\u00e0i.',
    A.length + ' still alive, ' + A.filter(isWolf).length + ' of them not what they seem.');
  const B = $('dyBody'); B.innerHTML = '';

  if (G.day === 1 && !G.sheriffDone){
    const vn = G.rules === 'vn';
    B.appendChild(el('div','tell','<b>' + T('B\u1ea7u Trưởng Làng','Elect the Sheriff') +
      '</b><p class="note">' + T('Phi\u1ebfu c\u1ee7a h\u1ecd n\u1eb7ng <b>','Their vote is worth <b>') +
      SHERIFF_WEIGHT() +
      T('</b>, v\u00e0 khi ch\u1ebft h\u1ecd ch\u1ec9 \u0111\u1ecbnh ng\u01b0\u1eddi k\u1ebf nhi\u1ec7m.</p>', '</b>, and on dying they name their successor.</p>')));
    B.appendChild(collapsible('sheriff',
      T('Ph\u00f9 hi\u1ec7u th\u1ef1c s\u1ef1 l\u00e0m \u0111\u01b0\u1ee3c g\u00ec', 'What the badge actually does'),
      T('<p>\u0110\u00e2y <b>kh\u00f4ng ph\u1ea3i l\u00e1 b\u00e0i</b> \u2014 \u0111\u00f3 l\u00e0 ch\u1ee9c danh do d\u00e2n l\u00e0ng b\u1ea7u, n\u00ean ai c\u0169ng c\u00f3 th\u1ec3 gi\u1eef. ' +
        'M\u1ed9t con s\u00f3i ho\u00e0n to\u00e0n c\u00f3 th\u1ec3 \u0111\u01b0\u1ee3c b\u1ea7u, v\u00e0 th\u01b0\u1eddng r\u1ea5t mu\u1ed1n \u0111\u01b0\u1ee3c b\u1ea7u.</p>',
        '<p>This is <b>not a card</b> \u2014 it is a title the village votes on, so anyone can hold it. ' +
        'A werewolf can be elected, and often tries to be.</p>') +
      '<p>\u00b7 ' + T('Phi\u1ebfu c\u1ee7a h\u1ecd n\u1eb7ng <b>','Their vote is worth <b>') + SHERIFF_WEIGHT() +
      T('</b> trong m\u1ecdi v\u00f2ng b\u1ecf phi\u1ebfu ban ng\u00e0y.<br>', '</b> in every day vote.<br>') +
      T('\u00b7 Khi h\u1ecd ch\u1ebft, d\u00f9 ch\u1ebft v\u00ec g\u00ec, h\u1ecd <b>ch\u1ec9 \u0111\u1ecbnh ng\u01b0\u1eddi k\u1ebf nhi\u1ec7m</b> tr\u01b0\u1edbc khi ch\u01a1i ti\u1ebfp ' +
        '\u2014 ho\u1eb7c hu\u1ef7 ph\u00f9 hi\u1ec7u \u0111\u1ec3 kh\u00f4ng ai gi\u1eef.<br>' +
        '\u00b7 Ch\u1ee9c danh n\u00e0y s\u1ed1ng s\u00f3t qua m\u1ecdi th\u1ee9 kh\u00e1c: m\u1ea5t ph\u00e9p, b\u1ecb l\u1eadt b\u00e0i, \u0111\u1ed5i phe.</p>',
        '\u00b7 When they die, whatever kills them, they <b>name their successor</b> before play continues ' +
        '\u2014 or destroy the badge so nobody carries it.<br>' +
        '\u00b7 The title survives everything else: losing a power, being revealed, changing side.</p>') +
      '<p>' + (vn
        ? T('B\u00e0n Vi\u1ec7t Nam th\u01b0\u1eddng \u0111\u1ec3 ph\u00f9 hi\u1ec7u n\u1eb7ng 1.5 \u0111\u1ec3 n\u00f3 kh\u00f4ng m\u1ed9t m\u00ecnh th\u1eafng \u0111\u01b0\u1ee3c hai d\u00e2n. ' +
            'Miller\u2019s Hollow d\u00f9ng g\u1ea5p \u0111\u00f4i.',
            'Vietnamese tables usually weight the badge at 1.5 so it cannot outvote two villagers on its own. ' +
            'Miller\u2019s Hollow uses a flat double.')
        : T('Miller\u2019s Hollow cho g\u1ea5p \u0111\u00f4i phi\u1ebfu. B\u00e0n Vi\u1ec7t Nam v\u00e0 \u72fc\u4eba\u6740 th\u01b0\u1eddng d\u00f9ng 1.5.',
            'Miller\u2019s Hollow gives a flat double vote. Vietnamese and \u72fc\u4eba\u6740 tables usually use 1.5 instead.')) + '</p>'));
    B.appendChild(el('div','grp', T('Ai \u0111\u01b0\u1ee3c b\u1ea7u?','Who was elected?')));
    const c = el('div','chips');
    for (const p of A) c.appendChild(chip(p, { on:() => { snap(); p.sheriff = true; G.sheriffDone = true;
      log(T(p.name + ' \u0111\u01b0\u1ee3c b\u1ea7u l\u00e0m Tr\u01b0\u1edfng L\u00e0ng.', p.name + ' was elected Sheriff.')); render(); } }));
    B.appendChild(c);
    bar([{ t: T('Ch\u01a1i kh\u00f4ng c\u1ea7n Tr\u01b0\u1edfng L\u00e0ng','Play without a Sheriff'), sec:true, wide:true, on:() => { snap(); G.sheriffDone = true;
      log(T('D\u00e2n l\u00e0ng kh\u00f4ng b\u1ea7u Tr\u01b0\u1edfng L\u00e0ng.', 'The village declined to elect a Sheriff.')); render(); } }]);
    return;
  }
  const jd = liveWith('judge').filter(p => !powerGone(p));
  if (jd.length && !G.judgeUsed){
    B.appendChild(el('div','tell', T(
      'C\u00f3 Quan To\u00e0 N\u00f3i L\u1eafp trong v\u00e1n (' + jd.map(p=>p.name).join(', ') + '). \u0110\u1ec3 \u00fd d\u1ea5u hi\u1ec7u \u2014 h\u00f4m nay anh ta c\u00f3 th\u1ec3 \u0111\u00f2i b\u1ea7u l\u1ea1i.',
      'Stuttering Judge in play (' + jd.map(p=>p.name).join(', ') + '). Watch for the sign \u2014 he may demand a second vote today.')));
    /* G.judgeUsed was written nowhere: initialised, read here, never set. So the alert
       stood for the whole game and the flag was decoration. His power is once per game,
       and the moderator is the only person who sees the sign, so they record it. */
    const jb = el('button','btn sec sm', T('Anh ta \u0111\u00e3 ra d\u1ea5u \u2014 b\u1ea7u l\u1ea1i h\u00f4m nay','He gave the sign \u2014 second vote today'));
    jb.onclick = () => { snap(); G.judgeUsed = true; G.votes = {}; G.sheriffVote = null;
      log(T('Quan To\u00e0 N\u00f3i L\u1eafp \u0111\u00f2i b\u1ea7u l\u1ea1i. S\u1ed1 phi\u1ebfu \u0111\u00e3 \u0111\u01b0\u1ee3c xo\u00e1.', 'The Stuttering Judge demanded a second vote. The tally was cleared for it.')); render(); };
    B.appendChild(jb);
  } else if (jd.length){
    B.appendChild(el('p','note','The Stuttering Judge has spent his second vote \u2014 once per game, and it is gone.'));
  }
  const sc = liveWith('scapegoat').filter(p => !powerGone(p));
  if (sc.length) B.appendChild(el('div','tell', T(
    'N\u1ebfu phi\u1ebfu ho\u00e0, V\u1eadt T\u1ebf Th\u1ea7n (' + sc.map(p=>p.name).join(', ') + ') ch\u1ebft thay v\u00e0 ch\u1ecdn ai \u0111\u01b0\u1ee3c b\u1ecf phi\u1ebfu ng\u00e0y mai.',
    'If the vote ties, the Scapegoat (' + sc.map(p=>p.name).join(', ') + ') dies instead and chooses who may vote tomorrow.')));
  if (scapegoatBinds()) B.appendChild(el('div','tell',
    T('H\u00f4m nay ch\u1ec9 nh\u1eefng ng\u01b0\u1eddi n\u00e0y \u0111\u01b0\u1ee3c b\u1ecf phi\u1ebfu: <b>','Only these may vote today: <b>') +
    G.scapegoatVoters.map(i=>byId(i).name).join(', ') + '</b><p class="note">' +
    T('V\u1eadt T\u1ebf Th\u1ea7n \u0111\u00e3 ch\u1ec9 \u0111\u1ecbnh h\u1ecd l\u00fac ch\u1ebft h\u00f4m qua. Ng\u00e0y mai c\u1ea3 l\u00e0ng l\u1ea1i \u0111\u01b0\u1ee3c n\u00f3i.', 'The Scapegoat named them as he died yesterday. Tomorrow the whole village speaks again.') + '</p>'));
  if (G.powersLost){
    // name the route, because "by the village" covers the vote, the poison and the shot
    const eld = G.players.find(p => p.role === 'elder' && !p.alive);
    /* Name what is actually gone. "Every villager loses their power" is easy to read as
       "the night calls stop", which is how the rule came to be half-implemented in the
       first place — the Hunter kept firing and the Idiot kept surviving the rope. */
    const stripped = [
      liveWith('hunter').length && !hunterFiresPowerless() &&
        T('Th\u1ee3 S\u0103n kh\u00f4ng b\u1eafn','the Hunter does not fire'),
      liveWith('idiot').length    && T('Th\u1eb1ng Ng\u1ed1c b\u1ecb treo nh\u01b0 m\u1ecdi ng\u01b0\u1eddi','the Idiot is hanged like anyone else'),
      liveWith('scapegoat').length&& T('V\u1eadt T\u1ebf Th\u1ea7n kh\u00f4ng c\u00f2n ch\u1ebft thay khi ho\u00e0','the Scapegoat no longer dies for a tie'),
      liveWith('beartamer').length&& T('Ng\u01b0\u1eddi D\u1ea1y G\u1ea5u kh\u00f4ng g\u1ea7m','the Bear Tamer does not growl'),
      liveWith('knight').length   && T('ki\u1ebfm r\u1ec9 c\u1ee7a Hi\u1ec7p S\u0129 kh\u00f4ng lan','the Knight’s rust does not spread'),
      liveWith('judge').length    && T('Quan To\u00e0 kh\u00f4ng \u0111\u00f2i \u0111\u01b0\u1ee3c v\u00f2ng b\u1ea7u th\u1ee9 hai','the Judge cannot call a second vote'),
      liveWith('littlegirl').length && T('B\u00e9 G\u00e1i kh\u00f4ng h\u00e9 m\u1eaft \u0111\u01b0\u1ee3c','the Little Girl cannot peek'),
    ].filter(Boolean);
    B.appendChild(el('div','alert no',
      T('Tr\u01b0\u1edfng L\u00e3o ch\u1ebft v\u00ec ','The Elder died by ') +
      (eld && eld.cause ? causeLabel(eld.cause) : T('d\u00e2n l\u00e0ng','the village')) +
      T('. <b>To\u00e0n b\u1ed9 ph\u00e9p c\u1ee7a d\u00e2n l\u00e0ng \u0111\u00e3 m\u1ea5t</b> \u2014 \u0111\u00eam kh\u00f4ng g\u1ecdi l\u00e1 d\u00e2n n\u00e0o', '. <b>Every villager power is gone</b> — no village card is called at night') +
      (stripped.length ? T(', v\u00e0 ',', and ') + stripped.join(', ') : '') + '.' +
      '<p class="note">' + T('Ph\u00f9 hi\u1ec7u Tr\u01b0\u1edfng L\u00e0ng l\u00e0 ch\u1ee9c danh ch\u1ee9 kh\u00f4ng ph\u1ea3i l\u00e1 b\u00e0i, n\u00ean ai \u0111ang gi\u1eef th\u00ec v\u1eabn gi\u1eef.', 'The Sheriff’s badge is a title, not a card, so whoever holds it keeps it.') + '</p>'));
  }

  const sh = A.find(p => p.sheriff);
  if (sh) B.appendChild(el('div','tell ok', '<b>' + sh.name +
    T('</b> gi\u1eef ph\u00f9 hi\u1ec7u \u2014 t\u00ednh tay c\u1ee7a h\u1ecd l\u00e0 <b>', '</b> holds the badge — count their hand as <b>') +
    SHERIFF_WEIGHT() +
    T('</b>. N\u1ebfu h\u00f4m nay h\u1ecd ch\u1ebft th\u00ec h\u1ecd ch\u1ec9 \u0111\u1ecbnh ng\u01b0\u1eddi gi\u1eef ti\u1ebfp theo.', '</b>. If they die today they name the next holder.')));
  /* A vote only bites if it clears half the voting weight. Counting that by hand
     is exactly what a moderator gets wrong, especially with a weighted badge and
     a silenced Idiot, so the app does the arithmetic. */
  const voters = eligibleVoters(), TP = totalPower(), thr = TP / 2;
  const wt = G.rules === 'vn' ? 1.5 : 2;
  G.votes = G.votes || {};
  B.appendChild(el('div','grp', T('\u0110\u1ebfm phi\u1ebfu','Count the vote')));
  // The threshold itself is pinned into the action bar by refresh(); this card keeps
  // only the things you read once, at the start.
  if (sh || scapegoatBinds())
    B.appendChild(el('div','tell',
      (sh ? '<b>' + sh.name + '</b>' +
            T(' gi\u1eef ph\u00f9 hi\u1ec7u, n\u00ean tay c\u1ee7a h\u1ecd t\u00ednh l\u00e0 ' + wt + '. B\u1ea5m ng\u00f4i sao b\u00ean c\u1ea1nh ng\u01b0\u1eddi h\u1ecd b\u1ecf phi\u1ebfu.',
              ' holds the badge, so their hand counts ' + wt + '. Tap the badge beside whoever they voted for.') : '') +
      (scapegoatBinds() ? (sh ? '<p class="note">' : '') +
            T('V\u1eadt T\u1ebf Th\u1ea7n \u0111\u00e3 b\u1ecbt mi\u1ec7ng t\u1ea5t c\u1ea3 nh\u1eefng ng\u01b0\u1eddi c\u00f2n l\u1ea1i h\u00f4m nay.',
              'The Scapegoat has silenced everyone else today.') + (sh ? '</p>' : '') : '')));

  // Rows are built once and a light refresh updates only the derived numbers, so
  // typing in a box never rebuilds it and never loses the caret.
  const cells = [];
  const list = el('div', null); list.id = 'dyVotes'; B.appendChild(list);
  for (const p of A){
    const row = el('div','p vote');
    const fill = el('span','fill');
    row.appendChild(fill);
    row.insertAdjacentHTML('beforeend', icSpanD(p) + '<span class="nm">' + p.name + '</span>' +
      (p.voteless ? '<span class="tag">no vote</span>' : ''));
    // "Carries" replaces the old grey digit: the field below is the number, and this
    // says the one thing the number could not.
    const power = el('span','carries');
    row.appendChild(power);
    if (sh){
      const bg = el('button','ico', G.sheriffVote === p.id ? '\u2b50' : '\u2606');
      bg.title = T('Tr\u01b0\u1edfng L\u00e0ng b\u1ecf phi\u1ebfu cho ng\u01b0\u1eddi n\u00e0y', 'The Sheriff voted for this player');
      bg.onclick = () => { holdOrder(); G.sheriffVote = G.sheriffVote === p.id ? null : p.id; refresh(); };
      row.appendChild(bg);
    }
    const stp = el('div','stp');
    const minus = el('button',null,'\u2212');
    minus.onclick = () => { holdOrder(); setVote(p, tallyOf(p) - 1); };
    const box = document.createElement('input');
    box.type = 'text'; box.inputMode = 'numeric'; box.autocomplete = 'off';
    box.setAttribute('aria-label', 'votes for ' + p.name);
    box.onfocus = () => box.select();
    box.oninput = () => {
      const digits = box.value.replace(/[^0-9]/g, '').slice(0, 3);
      const v = Math.max(0, Math.min(roomFor(p), digits === '' ? 0 : parseInt(digits, 10)));
      if (String(v) !== digits && digits !== '') box.value = String(v);   // refuse the impossible
      else if (digits !== box.value) box.value = digits;
      G.votes[p.id] = v;
      refresh();
    };
    box.onblur = () => { box.value = String(tallyOf(p)); };
    box.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); box.blur(); } };
    const plus = el('button',null,'+');
    plus.onclick = () => { holdOrder(); setVote(p, tallyOf(p) + 1); };
    stp.append(minus, box, plus);
    row.appendChild(stp);
    list.appendChild(row);
    cells.push({ p, power, minus, plus, box, row, fill });
  }
  const verdict = el('div','tell'); B.appendChild(verdict);
  const twice  = el('div','alert no'); B.appendChild(twice);

  function tallyOf(p){ return G.votes[p.id] || 0; }
  /* HANDS, not weight. Every eligible voter raises exactly one, so the tallies across all
     names can never sum past the electorate — and each box used to be clamped to
     voters.length on its own, with nothing bounding the total. On nine players that let a
     moderator record 5 for one name and 9 for another: fourteen hands from nine people,
     and a "winner" the table never produced. Reported from a game.

     The badge is not part of this budget: it adds weight on top of its holder's hand, not
     a second hand, and extraOf() applies it separately.

     The ceiling never falls below what is already recorded, so a tally that is somehow
     over — a resumed save, or an electorate that shrank after the count began — can still
     be corrected downwards instead of every box locking to zero. */
  function handsElsewhere(id){ return A.reduce((n, q) => n + (q.id === id ? 0 : tallyOf(q)), 0); }
  function roomFor(p){ return Math.max(voters.length - handsElsewhere(p.id), tallyOf(p)); }
  function extraOf(p){ return (G.sheriffVote === p.id && sh) ? wt - 1 : 0; }
  function setVote(p, v){
    G.votes[p.id] = Math.max(0, Math.min(roomFor(p), Math.round(v) || 0));
    refresh();
  }
  /* Counting a real vote is a fast run of taps down the list, out loud. Promotion used to
     be held back only while a text box had focus — but the steppers are what people
     actually use, and tapping + focuses nothing, so a trailing candidate taking the lead
     jumped their row to the top and the + under the moderator's thumb became somebody
     else's +. The order is frozen for the whole run of taps and settles once, shortly
     after the last one. The bar, the highlight and the verdict all update immediately;
     only the row positions wait. */
  let settle = null, wasPassing = false;
  function holdOrder(){
    buzz('tap');
    clearTimeout(settle);
    settle = setTimeout(() => { settle = null; if (list.isConnected) refresh(); }, 1200);
  }
  function refresh(){
    let lead = [], best = 0;
    for (const p of A){
      const pw = tallyOf(p) + extraOf(p);
      if (pw > best){ best = pw; lead = [p]; } else if (pw === best && pw > 0) lead.push(p);
    }
    // A box with the caret in it, or a tap within the last 1.2 seconds: either way the
    // thumb is on this list and the rows must not move under it.
    const frozen = settle !== null || cells.some(c => document.activeElement === c.box);
    for (const c of cells){
      const extra = extraOf(c.p), pw = tallyOf(c.p) + extra;
      const over = pw > thr;
      // Share of the whole voting weight, so the bars are comparable to each other
      // and to "half" \u2014 not normalised to the current leader.
      c.fill.style.width = TP > 0 ? Math.min(100, (pw / TP) * 100) + '%' : '0';
      c.row.classList.toggle('over', over);
      c.row.classList.toggle('lead', !over && pw > 0 && pw === best && lead.length === 1);
      // the star, and only the star: see the .carries comment in the stylesheet
      c.power.textContent = extra ? '\u2b50' : '';
      if (!frozen) c.row.style.order = over ? -2 : (pw > 0 && pw === best ? -1 : 0);
      c.minus.disabled = !tallyOf(c.p);
      c.plus.disabled = tallyOf(c.p) >= roomFor(c.p);
      if (document.activeElement !== c.box) c.box.value = String(tallyOf(c.p));
    }
    const cast = A.reduce((a,p) => a + tallyOf(p), 0) + (G.sheriffVote && sh ? wt - 1 : 0);
    const over = best > thr;
    /* Most votes, unique leader — unless this table has asked for a majority. No `best > 0`
       guard: the loop above only ever puts somebody in `lead` on a positive tally, so a
       single leader already implies a vote was cast. */
    const passing = lead.length === 1 && (!voteNeedsMajority() || over);
    if (passing && !wasPassing) buzz('commit');
    wasPassing = passing;
    verdict.className = 'tell' + (passing ? ' ok' : '');
    verdict.innerHTML = passing
      ? '<b>' + lead[0].name + '</b>' +
        T(' \u0111\u01b0\u1ee3c ' + fmtN(best) + '/' + fmtN(TP) + ' \u2014 nhi\u1ec1u phi\u1ebfu nh\u1ea5t' +
            (over ? ', qu\u00e1 b\u00e1n' : '') + '. Phi\u1ebfu c\u00f3 hi\u1ec7u l\u1ef1c.',
          ' has ' + fmtN(best) + ' of ' + fmtN(TP) + ' \u2014 the most' +
            (over ? ', and over half' : '') + '. The vote carries.') +
        // said before the button, not after: once it is tapped the screen has moved on
        '<p class="note">' + revealNote([lead[0]]) + '</p>'
      : lead.length > 1 && best > 0
        ? T('Ho\u00e0 ' + fmtN(best) + ' phi\u1ebfu: <b>','Tied on ' + fmtN(best) + ': <b>') +
          lead.map(x=>x.name).join(', ') +
          T('</b>. Ho\u00e0 th\u00ec ch\u01b0a ai b\u1ecb treo \u2014 b\u1ea7u l\u1ea1i gi\u1eefa nh\u1eefng ng\u01b0\u1eddi n\u00e0y.',
            '</b>. A tie hangs nobody \u2014 re-vote between them.')
        : best === 0 ? T('Ch\u01b0a ghi phi\u1ebfu n\u00e0o.', 'No votes recorded yet.')
          // only reachable when this table has asked for a majority
          : '<b>' + lead[0].name + '</b>' +
            T(' d\u1eabn v\u1edbi ' + fmtN(best) + ', nh\u01b0ng ch\u01b0a qu\u00e1 ' + fmtN(thr) +
                '. B\u00e0n n\u00e0y \u0111\u00f2i qu\u00e1 b\u00e1n, n\u00ean phi\u1ebfu ch\u01b0a c\u00f3 hi\u1ec7u l\u1ef1c.',
              ' leads on ' + fmtN(best) + ', but that is not more than ' + fmtN(thr) +
                '. This table requires a majority, so the vote fails.');
    twice.style.display = cast > TP ? '' : 'none';
    twice.innerHTML = T(
      'B\u1ea1n \u0111\u00e3 ghi ' + fmtN(cast) + ' tr\u00ean t\u1ed1i \u0111a ' + fmtN(TP) + '. C\u00f3 ng\u01b0\u1eddi b\u1ecf phi\u1ebfu hai l\u1ea7n.',
      'You have recorded ' + fmtN(cast) + ' of a possible ' + fmtN(TP) + '. Somebody has voted twice.');

    const opts = [];
    /* No name on the button. At 320 it offers 116px for the label and "Treo c\u1ed5 Nguy\u1ec5n
       V\u0103n Minh \u2192" needs 208, so .bar .in .btn's ellipsis trimmed the identity of the
       person being eliminated off the control that commits the elimination. The name is in
       the bar note directly above, full width, where it fits. */
    if (passing) opts.push({ t: T('Treo c\u1ed5 \u2192','Hang \u2192'), on:() => resolveVote(lead[0]) });
    if (sc.length && lead.length > 1) opts.push({ t: T('Ho\u00e0 \u2014 V\u1eadt T\u1ebf Th\u1ea7n ch\u1ebft thay','Tied \u2014 Scapegoat dies'), sec:true, on:() => resolveVote(sc[0], true) });
    opts.push({ t: best > 0 ? T('Xo\u00e1 phi\u1ebfu, b\u1ea7u l\u1ea1i','Clear the tally')
                            : T('Kh\u00f4ng ai b\u1ecb treo','Nobody was voted out'), sec:true, on:() => {
      if (best > 0){ G.votes = {}; G.sheriffVote = null; refresh(); return; }
      snap(); log(voteNeedsMajority()
        ? T('Phi\u1ebfu kh\u00f4ng qu\u00e1 b\u00e1n. Kh\u00f4ng ai b\u1ecb treo.', 'The vote did not clear half. Nobody was hanged.')
        : T('Kh\u00f4ng ai b\u1ecb b\u1ecf phi\u1ebfu ra. Kh\u00f4ng ai b\u1ecb treo.', 'No name was voted out. Nobody was hanged.'));
      G.votes = {}; G.sheriffVote = null; G.resume = 'night'; proceed(); } });
    bar(opts);
    // Pinned last: bar() clears the note, so this has to follow it.
    /* When a name carries, it leads the note. This is the only place the name is now said
       on the day screen \u2014 the row can no longer fit it and the button no longer holds it \u2014
       so it comes first, and the arithmetic follows it. */
    barNote((passing
        ? '<b class="hit">' + lead[0].name + '</b>' +
          T(' nhi\u1ec1u phi\u1ebfu nh\u1ea5t \u00b7 ', ' carries \u00b7 ')
        : '') +
      fmtN(cast) + T(' / <b>',' of <b>') + fmtN(TP) + T('</b> phi\u1ebfu \u00b7 ','</b> cast \u00b7 ') +
      (voteNeedsMajority()
        ? T('c\u1ea7n <b','a name needs <b') + (passing ? ' class="hit"' : '') + '>' +
          T('h\u01a1n ','more than ') + fmtN(thr) + '</b>'
        : T('nhi\u1ec1u phi\u1ebfu nh\u1ea5t l\u00e0 b\u1ecb treo \u00b7 qu\u00e1 b\u00e1n l\u00e0 <b',
            'most votes hangs \u00b7 over <b') + (over ? ' class="hit"' : '') + '>' +
          fmtN(thr) + T('</b> th\u00ec b\u1ea7u l\u1ea1i kh\u00f4ng l\u1eadt \u0111\u01b0\u1ee3c','</b> cannot be overturned')));
  }
  // A blur can change the ordering that was held back while typing.
  for (const c of cells) c.box.addEventListener('blur', () => refresh());
  refresh();
}
function resolveVote(p, tie){
  snap();
  /* Surviving the rope is the Idiot's power, so the Elder's revenge takes it too \u2014 after
     that he is hanged like anybody else. */
  if (p.role === 'idiot' && !p.revealed && !powerGone(p)){
    p.revealed = true; p.voteless = true;
    log(T(p.name + ' l\u00e0 Th\u1eb1ng Ng\u1ed1c \u2014 l\u1eadt b\u00e0i, tha m\u1ea1ng, m\u1ea5t quy\u1ec1n b\u1ecf phi\u1ebfu v\u0129nh vi\u1ec5n. V\u00f2ng b\u1ecf phi\u1ebfu coi nh\u01b0 xong.',
      p.name + ' is the Village Idiot \u2014 revealed, spared, silenced for good. The vote is spent.'));
    toNight(); return;
  }
  if (p.role === 'idiot' && !p.revealed && powerGone(p))
    log(T(p.name + ' l\u00e0 Th\u1eb1ng Ng\u1ed1c, nh\u01b0ng d\u00e2n l\u00e0ng \u0111\u00e3 gi\u1ebft Tr\u01b0\u1edfng L\u00e3o \u2014 gi\u1edd kh\u00f4ng g\u00ec c\u1ee9u \u0111\u01b0\u1ee3c anh ta.',
      p.name + ' is the Village Idiot, but the village killed the Elder \u2014 nothing saves him now.'));
  if (p.role === 'angel' && G.day === 1){
    kill(p, 'vote');
    return finish({ who: T('Thi\u00ean Th\u1ea7n', 'The Angel'),
      why: p.name + T(' mu\u1ed1n \u0111\u00fang \u0111i\u1ec1u n\u00e0y v\u00e0 \u0111\u1ea1t \u0111\u01b0\u1ee3c ngay ng\u00e0y \u0111\u1ea7u.', ' wanted exactly this and got it on day one.') });
  }
  // kill() applies the Elder's consequence now, for every village-caused death.
  if (tie){
    log(T('Phi\u1ebfu ho\u00e0. V\u1eadt T\u1ebf Th\u1ea7n ' + p.name + ' b\u1ecb hi\u1ebfn t\u1ebf.', 'The vote tied. The Scapegoat ' + p.name + ' was sacrificed.'));
    registerDeaths(kill(p, 'tie'));
    G.resume = 'night';
    G.phase = 'scapegoat'; render(); return;
  }
  registerDeaths(kill(p, 'vote'));
  G.resume = 'night';
  proceed();
}
/* Two shapes, one screen. Publicly at dawn or after a vote, which is the published flow;
   or privately before the announcement, for a table that keeps cards face down and does
   not want the shot to identify him.

   The private one commits nothing itself: it adds the target to G.dawn, which applyDawn
   is about to walk anyway, so both deaths are announced together and the moderator
   explains neither. */
function renderHunter(){
  show('sDay');
  const priv = !!G.pending.nightShot;
  const hp = byId(priv ? G.pending.nightShot : G.pending.hunterId);
  const cause = causeLabel(G.pending.hunterCause) || T('c\u00e1i ch\u1ebft c\u1ee7a m\u00ecnh','his death');
  $('dyTitle').textContent = priv
    ? T('Th\u1ee3 S\u0103n b\u1eafn \u2014 l\u1eb7ng l\u1ebd','The Hunter fires \u2014 quietly')
    : T('Th\u1ee3 S\u0103n b\u1eafn','The Hunter fires');
  $('dySub').textContent = priv
    ? T('B\u1ea7y s\u00f3i \u0111\u00e3 \u0103n Th\u1ee3 S\u0103n \u0111\u00eam nay. Ch\u01b0a ai m\u1edf m\u1eaft, n\u00ean l\u1ea5y m\u1ee5c ti\u00eau ngay b\u00e2y gi\u1edd v\u00e0 s\u00e1ng ra \u0111\u1ecdc c\u1ea3 hai c\u00e1i ch\u1ebft c\u00f9ng l\u00fac.',
        'The pack took the Hunter tonight. Nobody has opened their eyes yet, so the shot is taken now and both deaths are read out together at dawn.')
    : (hp ? hp.name + T(' \u0111\u00e3 ch\u1ebft \u2014 ',' is dead \u2014 ') + cause + '. ' : '') +
      T('Ph\u00e1t s\u00fang kh\u00f4ng ph\u1ea3i l\u1ef1a ch\u1ecdn: anh ta ph\u1ea3i k\u00e9o theo m\u1ed9t ng\u01b0\u1eddi c\u00f2n s\u1ed1ng.',
        'The shot is not optional: he must take one living player with him.');
  const B = $('dyBody'); B.innerHTML = '';

  /* How the shot physically happens \u2014 the thing the screen never said. "Tap whoever he
     points at" assumed the moderator already knew they were meant to ask a dead player to
     point, out loud, in front of everybody. */
  if (hp) B.appendChild(el('div','tell', priv
    ? T('<b>\u0110\u00e1nh th\u1ee9c m\u1ed7i m\u00ecnh anh ta.</b> Ch\u1ea1m vai, cho anh ta ch\u1ec9 v\u00e0o m\u1ed9t ng\u01b0\u1eddi c\u00f2n s\u1ed1ng, r\u1ed3i b\u1ea3o nh\u1eafm m\u1eaft l\u1ea1i. Kh\u00f4ng n\u00f3i g\u00ec th\u00e0nh ti\u1ebfng.',
        '<b>Wake him and nobody else.</b> Touch his shoulder, let him point at one living player, then have him close his eyes again. Say nothing aloud.') +
      '<p class="note">' + T('Anh ta ch\u1ebft \u0111\u1eb1ng n\u00e0o c\u0169ng ch\u1ebft \u2014 vi\u1ec7c n\u00e0y ch\u1ec9 quy\u1ebft \u0111\u1ecbnh c\u1ea3 b\u00e0n c\u00f3 bi\u1ebft \u0111\u00f3 l\u00e0 anh ta hay kh\u00f4ng. S\u00e1ng ra b\u1ea1n \u0111\u1ecdc hai c\u00e1i ch\u1ebft v\u00e0 kh\u00f4ng gi\u1ea3i th\u00edch g\u00ec.', 'He is dead either way \u2014 this only decides whether the table learns ' +
      'it was him. At dawn you will name two deaths and explain neither.') + '</p>'
    : T('<b>N\u00f3i to l\u00ean: ','<b>Say it out loud: ') + hp.name +
      T(' l\u00e0 Th\u1ee3 S\u0103n, v\u00e0 anh ta k\u00e9o theo m\u1ed9t ng\u01b0\u1eddi.</b>', ' was the Hunter, and he takes somebody with him.</b>') +
      '<p class="note">' + revealNote([hp]) +
      T(' Anh ta ch\u1ecdn, kh\u00f4ng ph\u1ea3i b\u1ea1n \u2014 cho anh ta ch\u1ec9 v\u00e0o m\u1ed9t ng\u01b0\u1eddi c\u00f2n s\u1ed1ng tr\u01b0\u1edbc m\u1eb7t c\u1ea3 b\u00e0n, r\u1ed3i b\u1ea5m v\u00e0o ng\u01b0\u1eddi \u0111\u00f3. Anh ta \u0111\u00e3 ch\u1ebft v\u00e0 ra kh\u1ecfi v\u00e1n r\u1ed3i, n\u00ean kh\u00f4ng c\u00f2n g\u00ec ph\u1ea3i gi\u1ea5u anh ta n\u1eefa.',
        ' He chooses, not you \u2014 let him point at a living player in front of everyone, then tap that person below. He is already dead and out of the game, so there is nothing left to keep from him.') +
      (cardsShownOnDeath() ? '' :
        T(' L\u01b0u \u00fd ph\u00e1t s\u00fang t\u1ef1 n\u00f3 l\u1ed9 danh t\u00ednh anh ta d\u00f9 lu\u1eadt l\u1eadt b\u00e0i th\u1ebf n\u00e0o: m\u1ed9t ng\u01b0\u1eddi ch\u1ebft ch\u1ec9 tay v\u00e0 m\u1ed9t ng\u01b0\u1eddi n\u1eefa g\u1ee5c xu\u1ed1ng. B\u00e0n n\u00e0o mu\u1ed1n gi\u1ea5u anh ta th\u00ec l\u1ea5y m\u1ee5c ti\u00eau trong \u0111\u00eam \u2014 xem Lu\u1eadt nh\u00e0.',
          ' Note that the shot identifies him whatever the card rule says: a dead player points and somebody drops. If your table wants him hidden, take the shot in the night instead \u2014 see House rules.')) + '</p>'));

  const targets = alive().filter(p => !hp || p.id !== hp.id);

  if (!targets.length){
    B.appendChild(el('div','tell', T('Kh\u00f4ng c\u00f2n ai \u0111\u1ec3 anh ta b\u1eafn.','There is nobody left for him to hit.')));
    bar([{ t: T('Ti\u1ebfp t\u1ee5c \u2192','Continue \u2192'), wide:true, on:() => { snap();
      G.pending.hunterId = null; G.pending.nightShot = null;
      // marked taken here too, or dawn would queue the same empty shot a second time
      if (priv){ G.nightShotTaken = true; G.phase = 'dawn'; render(); } else proceed(); } }]);
    return;
  }

  B.appendChild(el('div','tell', T(
    'Anh ta <b>b\u1eaft bu\u1ed9c</b> ph\u1ea3i ch\u1ecdn m\u1ed9t ng\u01b0\u1eddi. Lu\u1eadt kh\u00f4ng cho anh ta tha cho l\u00e0ng \u2014 b\u1ea5m v\u00e0o ng\u01b0\u1eddi anh ta ch\u1ec9.',
    'He <b>must</b> choose somebody. The rules give him no option to spare the village \u2014 tap whoever he points at.')));
  const c = el('div','chips');
  for (const p of targets) c.appendChild(chip(p, { on:() => {
    snap();
    if (priv){
      /* Not killed here: it goes on the dawn list applyDawn is about to walk, so the
         grief chain, the Knight's rust and the announcement all treat it as one night. */
      G.pending.nightShot = null;
      G.nightShotTaken = true;
      if (!G.dawn.some(d => d.id === p.id)) G.dawn.push({ id:p.id, cause:'shot', on:true });
      G.dawnWhy = (G.dawnWhy || []).concat('The Hunter fired as he died. Announce both, explain neither.');
      log(T('Th\u1ee3 S\u0103n b\u1ecb \u0103n \u0111\u00eam v\u00e0 \u0111\u00e3 b\u1eafn ' + p.name + ' tr\u01b0\u1edbc khi tr\u1eddi s\u00e1ng.',
        'The Hunter was taken in the night and shot ' + p.name + ' before dawn.'));
      G.phase = 'dawn'; render(); return;
    }
    G.pending.hunterId = null; G.pending.hunterCause = null;
    registerDeaths(kill(p, 'shot'));
    proceed();
  }}));
  B.appendChild(c);

  // a moderator still needs an escape hatch, but it should be labelled honestly
  const esc = el('button','btn sec sm', T('Lu\u1eadt nh\u00e0: anh ta b\u1eafn tr\u01b0\u1ee3t, kh\u00f4ng tr\u00fang ai','House rule: he fired wide and hit nobody'));
  esc.onclick = () => { snap();
    G.pending.hunterId = null; G.pending.hunterCause = null;
    log(T('Theo lu\u1eadt nh\u00e0, ph\u00e1t s\u00fang c\u1ee7a Th\u1ee3 S\u0103n kh\u00f4ng tr\u00fang ai.', 'By house rule the Hunter\u2019s shot hit nobody.'));
    if (priv){ G.pending.nightShot = null; G.nightShotTaken = true; G.phase = 'dawn'; render(); }
    else proceed(); };
  B.appendChild(esc);
  bar([]);
}
function renderSheriff(){
  show('sDay');
  $('dyTitle').textContent = T('Ph\u00f9 hi\u1ec7u \u0111\u1ed5i ch\u1ee7','The badge passes');
  $('dySub').textContent = T(
    'Ph\u00f9 hi\u1ec7u kh\u00f4ng ch\u1ebft theo h\u1ecd. H\u1ecd ch\u1ec9 \u0111\u1ecbnh ng\u01b0\u1eddi gi\u1eef ti\u1ebfp \u2014 ho\u1eb7c hu\u1ef7 lu\u00f4n \u0111\u1ec3 kh\u00f4ng ai gi\u1eef.', 'The badge does not die with them. They name whoever carries it next — or destroy it so nobody does.');
  const B = $('dyBody'); B.innerHTML = '';
  G.players.forEach(p => p.sheriff = false);
  const c = el('div','chips');
  for (const p of alive()) c.appendChild(chip(p, { on:() => {
    snap(); G.pending.badge = false; p.sheriff = true;
    log(T(p.name + ' nh\u1eadn ph\u00f9 hi\u1ec7u.', p.name + ' takes the badge.')); proceed(); } }));
  B.appendChild(c);
  bar([{ t: T('H\u1ecd hu\u1ef7 ph\u00f9 hi\u1ec7u','They destroyed the badge'), sec:true, wide:true,
         on:() => { snap(); G.pending.badge = false;
           log(T('Ph\u00f9 hi\u1ec7u \u0111\u00e3 b\u1ecb hu\u1ef7 \u2014 gi\u1edd kh\u00f4ng ai gi\u1eef n\u1eefa.', 'The badge was destroyed \u2014 nobody carries it now.')); proceed(); } }]);
}
function renderScapegoat(){
  show('sDay');
  $('dyTitle').textContent = T('V\u1eadt T\u1ebf Th\u1ea7n quy\u1ebft \u0111\u1ecbnh','The Scapegoat decides');
  $('dySub').textContent = T(
    'L\u00fac ch\u1ebft anh ta ch\u1ec9 \u0111\u1ecbnh ai \u0111\u01b0\u1ee3c b\u1ecf phi\u1ebfu ng\u00e0y mai. B\u1ea5m v\u00e0o t\u1ea5t c\u1ea3 nh\u1eefng ng\u01b0\u1eddi gi\u1eef \u0111\u01b0\u1ee3c ti\u1ebfng n\u00f3i.', 'As he dies he names who may vote tomorrow. Tap everyone who keeps their voice.');
  const B = $('dyBody'); B.innerHTML = '';
  const pick = G.pending.sg || [];
  const c = el('div','chips');
  for (const p of alive()) c.appendChild(chip(p, { sel:pick.includes(p.id), on:() => {
    const i = pick.indexOf(p.id); if (i>=0) pick.splice(i,1); else pick.push(p.id);
    G.pending.sg = pick; render(); } }));
  B.appendChild(c);
  bar([{ t: T('C\u1ea3 l\u00e0ng \u0111\u01b0\u1ee3c b\u1ecf phi\u1ebfu','Everyone may vote'), sec:true, on:() => { snap();
         G.scapegoatVoters=null; G.scapegoatDay=null; G.pending.sg=null; proceed(); } },
       { t: T('X\u00e1c nh\u1eadn \u2192','Confirm \u2192'), off:!pick.length, on:() => { snap();
         G.scapegoatVoters=pick.slice(); G.scapegoatDay=G.day + 1; G.pending.sg=null;
         log(T('V\u1eadt T\u1ebf Th\u1ea7n ch\u1ec9 cho ' + pick.map(i=>byId(i).name).join(', ') +
               ' b\u1ecf phi\u1ebfu ng\u00e0y ' + (G.day + 1) + '. H\u00f4m sau c\u1ea3 l\u00e0ng l\u1ea1i \u0111\u01b0\u1ee3c n\u00f3i.',
               'The Scapegoat allows only ' + pick.map(i=>byId(i).name).join(', ') +
               ' to vote on day ' + (G.day + 1) + '. The day after, everyone speaks again.'));
         proceed(); } }]);
}
function toNight(){
  const w = checkWin(); if (w) return finish(w);
  G.night++; G.phase = 'night'; G.nightShotTaken = false; buildNight();
  log(T('\u0110\u00eam l\u1ea1i bu\u00f4ng xu\u1ed1ng.', 'Night falls again.'), T('\u0110\u00eam ','Night ') + G.night);
  render();
}

/* ---- end ---- */
function rEnd(){
  show('sEnd');
  $('enTitle').textContent = G.over.who + T(' th\u1eafng',' win');
  $('enSub').textContent = G.over.why;
  const C = $('enCard'); C.innerHTML = '';
  $('enChronicle').textContent = T('To\u00e0n b\u1ed9 nh\u1eadt k\u00fd', 'Full chronicle');
  C.appendChild(el('div','grp', T('L\u1eadt h\u1ebft m\u1ecdi l\u00e1','Every card, revealed')));
  const ros = el('div','ros group');
  G.players.forEach((p,i) => ros.appendChild(playerRow(p, i)));
  C.appendChild(ros);
  const L = $('enLog'); L.innerHTML = '';
  for (const e of G.log) L.appendChild(logRow(e));
  bar([{ t: T('C\u00f9ng b\u00e0n, v\u00e1n m\u1edbi','Same table, new game'), wide:true, on:() => {
    const names = G.players.map(p => p.name), counts = G.counts;
    clearUndo(); G = blank();
    names.forEach((nm,i) => G.players.push({ id:'p'+i+Math.random().toString(36).slice(2,5),
      name:nm,
      role:null, alive:true, cause:null, sheriff:false, lover:false, charmed:false,
      voteless:false, model:false, turned:false, revealed:false }));
    G.counts = counts; G.phase = 'roles'; render(); } }]);
}

/* The teaching layer's own switch. Retiring it after two games is a guess about the
   moderator, and a guess needs an override: a table with a new Qu\u1ea3n Tr\u00f2 every week wants
   it on forever, and somebody who has read it once wants it gone tonight. Same three-chip
   shape as the house rules, and the same meaning for null. */
function tipsUI(){
  const wrap = el('div', null, '');
  wrap.appendChild(el('div','grp', T('M\u1eb9o & h\u01b0\u1edbng d\u1eabn', 'Rules & tips')));
  const c = el('div','chips');
  const opts = [[null, T('T\u1ef1 \u0111\u1ed9ng','Automatic')],
                [true, T('Lu\u00f4n hi\u1ec7n','Always show')],
                [false, T('\u1ea8n','Hide')]];
  for (const [val, lab] of opts){
    const b = el('div','chip' + (prefs.tips === val ? ' sel' : ''), lab);
    b.onclick = () => { setPref('tips', val); openRoster(); };
    c.appendChild(b);
  }
  wrap.appendChild(c);
  wrap.appendChild(el('p','note', T(
    'T\u1ef1 \u0111\u1ed9ng: hi\u1ec7n \u0111\u1ea7y \u0111\u1ee7 trong hai v\u00e1n \u0111\u1ea7u, sau \u0111\u00f3 g\u1ecdn l\u1ea1i m\u1ed9t d\u00f2ng. ' +
    'M\u00e1y n\u00e0y \u0111\u00e3 ch\u01a1i ' + gamesPlayed + ' v\u00e1n.',
    'Automatic shows everything for the first two games, then folds it into one line. ' +
    'This device has finished ' + gamesPlayed + '.') +
    ' <b>' + T('\u0110ang: ','Now: ') + (teaching() ? T('hi\u1ec7n','showing') : T('g\u1ecdn','folded')) + '.</b>'));
  return wrap;
}

/* ---- roster modal, with role correction ---- */
function openRoster(){
  $('rosTtl').textContent = T('Danh s\u00e1ch', 'Roster');
  $('rosSub').textContent = T('B\u1ea5m v\u00e0o m\u1ed9t ng\u01b0\u1eddi \u0111\u1ec3 \u0111\u1eb7t ho\u1eb7c s\u1eeda l\u00e1 b\u00e0i.',
    'Tap a player to set or correct their card.');
  $('rosChronicle').textContent = T('Nh\u1eadt k\u00fd', 'Chronicle');
  const B = $('rosBody'); B.innerHTML = '';
  if (G.assignTo){
    const p = byId(G.assignTo);
    B.appendChild(el('div','grp', T('\u0110\u1eb7t l\u00e1 cho ' + p.name, 'Set the card for ' + p.name)));
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
        '<span class="ic">' + icOf(r.id) + '</span>' + rName(r) +
        '<span class="bd">' + (inDeck ? placed + '/' + G.counts[r.id] : 'off-deck') + '</span>');
      if (!full) b.onclick = () => { snap(); p.role = r.id; G.assignTo = null;
        log(T(p.name + ' l\u00e0 ' + rName(r) + '.', p.name + ' is the ' + r.name + '.'));
        autoFillForced(); openRoster(); };
      c.appendChild(b);
    }
    B.appendChild(c);
    // the Thief can end up holding one of the two spare cards, which are not in the deck
    const tog = el('button','btn sec sm', G.showAllRoles
      ? T('Ch\u1ec9 l\u00e1 trong b\u1ed9 n\u00e0y', 'Only cards in this deck')
      : T('\u0102n tr\u1ed9m l\u1ea5y l\u00e1 d\u01b0 \u2014 hi\u1ec7n m\u1ecdi l\u00e1', 'Thief took a spare \u2014 show every card'));
    tog.onclick = () => { G.showAllRoles = !G.showAllRoles; openRoster(); };
    B.appendChild(tog);
  } else {
    const ros = el('div','ros group');
    G.players.forEach((p,i) => ros.appendChild(playerRow(p, i,
      () => { G.assignTo = p.id; openRoster(); })));
    B.appendChild(ros);
    const need = {}; for (const k in G.counts) need[k] = G.counts[k];
    for (const p of G.players) if (p.role && need[p.role] != null) need[p.role]--;
    const missing = Object.keys(need).filter(k => need[k] > 0);
    if (missing.length) B.appendChild(el('div','tell',
      T('Ch\u01b0a \u0111\u1eb7t l\u00e1: ','Cards not yet placed: ') +
      missing.map(k => rName(R[k]) + (need[k]>1 ? ' \u00d7'+need[k] : '')).join(', ')));
    B.appendChild(tipsUI());
  }
  /* The chronicle only grows, and this rebuilt every line of it each time the roster
     opened AND each time a card was set inside it — so the roster got slower for the rest
     of the game, and the roster is what a moderator opens when they are already behind.
     Bounded to the recent entries; the rest are built once, and only if asked for. */
  const L = $('rosLog'); L.innerHTML = '';
  const entries = [...G.log].reverse(), RECENT = 40;
  for (const e of entries.slice(0, RECENT)) L.appendChild(logRow(e));
  if (entries.length > RECENT){
    const rest = el('div','log');
    const fill = () => { if (!rest.childElementCount)
      for (const e of entries.slice(RECENT)) rest.appendChild(logRow(e)); };
    const more = collapsible('chronicle', (entries.length - RECENT) + ' earlier entries', rest);
    more.addEventListener('toggle', () => { if (more.open) fill(); });
    if (more.open) fill();            // reopened from a previous visit, so no toggle fires
    L.appendChild(more);
  }
  // every label in this sheet is language-dependent, and the language can change mid-game
  paintSound();
  paintHaptic();
  $('bCloseR').textContent = T('\u0110\u00f3ng','Close');
  showVersion();
  $('mRoster').classList.add('on');
}

/* Which build is this? Cache-first serving means a phone can sit several releases
   behind, so "it's broken" is unactionable without it. Read from the live cache name
   rather than a constant: that reports what is actually being served, and there is no
   second value for a release to keep in step. */
function showVersion(){
  const out = $('rosVer');
  if (!out) return;
  if (!('caches' in window)){ out.textContent = 'Version unknown — no cache storage.'; return; }
  caches.keys().then(keys => {
    const shell = keys.find(k => /^mh-v.*-shell$/.test(k));
    out.textContent = shell
      ? T('Phi\u00ean b\u1ea3n ', 'Version ') + shell.replace(/^mh-/, '').replace(/-shell$/, '')
      : T('Ch\u01b0a bi\u1ebft phi\u00ean b\u1ea3n \u2014 ch\u01b0a l\u01b0u cache, n\u00ean \u0111\u00e2y l\u00e0 b\u1ea3n m\u1edbi nh\u1ea5t.', 'Version unknown — not cached yet, so this is the newest build.');
  }).catch(() => { out.textContent = 'Version unknown.'; });
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
    if (want > have) out.push(rName(R[id]) + (want - have > 1 ? ' \u00d7' + (want-have) : ''));
  }
  return out.length ? out.join(', ') : T('m\u1ed9t l\u00e1 s\u00f3i','a wolf card');
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
  holdShow(false);            // never open already-revealed
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
/* Press-and-hold, so the answer is visible only while the recipient is holding the
   phone. Release hides it — including release outside the button, and any interruption
   the browser reports, so it cannot be left showing on a phone that is handed back. */
// A declaration, not a const: showReveal is defined above this point and would sit in
// the temporal dead zone if anything ever revealed during start-up.
function holdShow(on){
  const s = $('revSecret');
  if (!s) return;
  s.classList.toggle('on', on);
  s.setAttribute('aria-hidden', on ? 'false' : 'true');
  $('bReveal').textContent = on
    ? T('Th\u1ea3 ra \u0111\u1ec3 \u1ea9n', 'Release to hide') : T('Gi\u1eef \u0111\u1ec3 xem', 'Hold to see it');
};
{
  const b = $('bReveal');
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); holdShow(true); });
  for (const ev of ['pointerup','pointercancel','pointerleave','lostpointercapture'])
    b.addEventListener(ev, () => holdShow(false));
  // keyboard: hold space or enter
  b.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); holdShow(true); } });
  b.addEventListener('keyup', () => holdShow(false));
  b.addEventListener('blur', () => holdShow(false));
}
$('bAltLang').onclick = () => { altLang = !altLang; render(); };
/* Handing the phone BACK is as much a moment as handing it over, and it was the only half
   of the exchange with no feedback. .going runs the exit for its duration and then comes
   off with .on, so nothing is left displayed if the animation never fires \u2014 a hidden tab,
   or prefers-reduced-motion collapsing it to 0.01ms. */
function closeSheet(id, after){
  const m = $(id);
  if (!m.classList.contains('on')) return;
  m.classList.add('going');
  const done = () => {
    clearTimeout(backstop);
    m.classList.remove('going', 'on');
    if (after) after();
  };
  const backstop = setTimeout(done, 260);
  m.addEventListener('animationend', done, { once: true });
}
$('bSeerDone').onclick = () => { holdShow(false); closeSheet('mSeer'); };
$('bRoster').onclick = () => { G.assignTo = null; openRoster(); };
$('bCloseR').onclick = () => { G.assignTo = null; closeSheet('mRoster', render); };
function paintSound(){
  $('bSound').innerHTML = icon('music') + (soundOn ? T('B\u1eadt','On') : T('T\u1eaft','Off'));
  // --moon is "this control is on" everywhere else in the app; amber used to mean
  // that here and "expansion card" elsewhere, which is the hue collision in full.
  $('bSound').classList.toggle('on', soundOn);
}
$('bSound').onclick = () => {
  soundOn = !soundOn;
  paintSound();
  ambience(soundOn && G.phase === 'night');
};
paintSound();
/* Hidden entirely where the browser has no vibrator — iOS Safari does not implement the
   Vibration API — rather than offered as a switch that does nothing. Degrading silently
   is the ask; a dead toggle would be degrading dishonestly. */
function paintHaptic(){
  const b = $('bHaptic');
  // Labelled before it is hidden, deliberately. The first version returned early and left
  // the text unset, so the moment the hidden attribute lost to .ico's display, what
  // shipped was an empty bordered box rather than a wrong-but-readable button.
  b.textContent = hapticOn ? T('Rung', 'Buzz') : T('Rung t\u1eaft', 'No buzz');
  b.classList.toggle('on', hapticOn);
  b.hidden = !canBuzz();
}
$('bHaptic').onclick = () => { hapticOn = !hapticOn; paintHaptic(); buzz('tap'); };
paintHaptic();
$('bUndo').onclick = undo;
function addName(){
  const v = $('iName').value;
  $('iName').value = '';
  addPlayer(v);
  $('iName').focus();
}
$('bAdd').onclick = addName;
$('iName').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); addName(); } });

/* Offer to pick up an interrupted game before anything is drawn.
   This screen speaks the SAVED game's language, not the fresh default from the browser:
   the moderator who was mid-game already chose one, and this is the first thing they see
   on a phone that reloaded itself. T() reads the live G, which at this point is still
   blank, so the choice has to be read off the box being offered. */
(() => {
  const box = loadSaved();
  if (!box) return;
  const g = box.g;
  const V = T;                    // language is a device preference now, not the game's
  const mins = Math.round((Date.now() - box.at) / 60000);
  const when = g.phase === 'night' || g.phase === 'dawn' ? V('\u0110\u00eam ', 'Night ') + g.night
             : g.phase === 'day' || g.phase === 'hunter' || g.phase === 'sheriff' ||
               g.phase === 'scapegoat' ? V('Ng\u00e0y ', 'Day ') + g.day : V('chu\u1ea9n b\u1ecb', 'setup');
  const ago = mins < 1 ? V('v\u1eeba xong', 'just now')
            : V(mins + ' ph\u00fat tr\u01b0\u1edbc', mins + ' min ago');
  const v = document.createElement('div');
  v.className = 'veil on';
  v.innerHTML = '<div class="kicker">' + V('V\u00e1n \u0111ang d\u1edf','Game in progress') + '</div>' +
    '<h1>' + V('Ti\u1ebfp t\u1ee5c?','Resume?') + '</h1>' +
    '<p>' + g.players.length + V(' ng\u01b0\u1eddi', ' players') + ' \u00b7 ' + when +
    ' \u00b7 ' + ago + '.</p>' +
    '<p class="dim">' + V(
      'App v\u1eeba t\u1ea3i l\u1ea1i. M\u1ecdi th\u1ee9 v\u1eabn c\u00f2n \u2014 vai, ng\u01b0\u1eddi ch\u1ebft, ph\u00f9 hi\u1ec7u, ' +
      's\u1ed1 phi\u1ebfu. Ti\u1ebfp t\u1ee5c ch\u1ed7 c\u0169, ho\u1eb7c ch\u01a1i l\u1ea1i t\u1eeb \u0111\u1ea7u.',
      'The app reloaded. Everything was kept \u2014 roles, deaths, the badge, the tally. ' +
      'Resume where you were, or start again.') + '</p>';
  const go = document.createElement('div'); go.className = 'go';
  const yes = document.createElement('button'); yes.type = 'button';
  yes.className = 'btn'; yes.textContent = V('Ti\u1ebfp t\u1ee5c','Resume');
  const no  = document.createElement('button'); no.type = 'button';
  no.className = 'btn ghost'; no.textContent = V('B\u1ecf, ch\u01a1i v\u00e1n m\u1edbi','Discard, new game');
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
