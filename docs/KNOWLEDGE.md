# Ma Sói / Miller’s Hollow Moderator — engineering notes

Everything learned building this app: the domain rules, the architecture, every bug
found and its root cause, and the test suites that pin the behaviour down.

Written to be committed beside the source. If you are picking this up cold, read
sections 1, 5 and 7 first — they contain the decisions that are expensive to
rediscover.

---

## Contents

1. [What this is, and what it deliberately is not](#1-what-this-is)
2. [The role table](#2-the-role-table)
3. [Night call order](#3-night-call-order)
4. [Vietnamese vs Miller’s Hollow: every divergence](#4-ruleset-divergences)
5. [The central design rule: never guess, and know what you actually need](#5-never-guess)
6. [Architecture](#6-architecture)
7. [Bug catalogue](#7-bug-catalogue)
8. [Test suites](#8-test-suites)
9. [Process rules that came out of the mistakes](#9-process-rules)
10. [Open questions and future work](#10-open-questions)

---

## 1. What this is

A **moderator's assistant** (Quản Trò) for in-person Ma Sói / *Les Loups-garous de
Thiercelieux*. One phone, in the moderator's hand, at a table of 6–24 people playing
with **physical cards**.

### Hard constraints

- **Plain files the browser loads directly** — `index.html`, `css/app.css`, `js/app.js`.
  No build step, no dependencies, no framework, no module system. **No network asset at
  all** — both font faces are self-hosted in `fonts/`. Every local file must be listed in
  `PRECACHE` (or `FONT_FILES`) in `sw.js` or offline breaks.
- **One device, held by one trusted person.** No player ever touches it.
- **Offline-first.** The normal environment is a garden or cellar with no signal.
- **The app never replaces the cards.** Players hold real cards; the app tracks what
  it has been told.

### Deliberate non-goals

- **No per-player screens.** Letting each player see their own role on their own
  phone needs a room code, shared state and a backend. That is a different product —
  see §10.
- **No accounts, no history, no analytics.**
- **No SSR, no routing.** One screen. See `DEPLOY.md` for why a framework would make
  this worse rather than better.

### Language

Vietnamese-first. Every role carries `vi` (name) and `sayVi` (read-aloud script).
Which language leads depends on the selected ruleset. Both display faces
(**Be Vietnam Pro**, **Lora**) were chosen because they carry the full Vietnamese
diacritic range — see bug B-07.

---

## 2. The role table

25 roles. `ROLES` array order is *authoritative for nothing* — sorting is always
explicit. Fields:

| field | meaning |
|---|---|
| `id` | stable key, used in `G.counts` and `p.role` |
| `ic` | emoji shown wherever the card appears |
| `name` / `vi` | English / Vietnamese name |
| `team` | `village` \| `wolf` \| `solo` — drives win conditions and dot colour |
| `set` | `Base` \| `Characters` — which physical box, drives the Classic/Characters scope |
| `n1` | position in the **night-one** roll call. Absent = never called |
| `every` | position on **later** nights. Absent = called on night one only |
| `exact` | card count is fixed (Sisters 2, Brothers 3) |
| `max` | maximum copies |
| `only` | ruleset that owns this card (`vn` on the Bodyguard) |
| `d` | rules description shown in the deck builder |
| `say` / `sayVi` | read-aloud script |

```
id          vi                      en                      team    set        n1  every  exact max only
villager    Dân làng                Simple Villager         village Base       -   -            24
thief       Ăn trộm                 Thief                   village Base       10  -            1
cupid       Thần Tình Yêu           Cupid                   village Base       20  -            1
judge       Quan Toà Nói Lắp        Stuttering Judge        village Characters 24  -            1
wolfhound   Sói Chó                 The Wolf Hound          village Characters 30  -            1
wildchild   Đứa Trẻ Hoang           The Wild Child          village Characters 34  -            1
sisters     Hai Chị Em              The Two Sisters         village Characters 40  42     2     2
brothers    Ba Anh Em               The Three Brothers      village Characters 44  46     3     3
guard       Bảo Vệ                  Bodyguard               village Base       47  47           1   vn
littlegirl  Bé Gái                  Little Girl             village Base       48  -            1
fox         Cáo                     The Fox                 village Characters 50  50           1
actor       Diễn Viên               The Actor               village Characters 52  52           1
seer        Tiên Tri                Seer                    village Base       55  55           1
wolf        Ma Sói                  Werewolf                wolf    Base       60  60           8
whitewolf   Sói Trắng               White Werewolf          wolf    Characters 65  65           1
witch       Phù Thuỷ                Witch                   village Base       70  70           1
piper       Người Thổi Sáo          The Pied Piper          solo    Characters 80  80           1
hunter      Thợ Săn                 Hunter                  village Base       82  -            1
elder       Trưởng Lão              The Elder               village Characters 84  -            1
knight      Hiệp Sĩ Kiếm Rỉ         Knight with Rusty Sword village Characters 86  -            1
beartamer   Người Dạy Gấu           Bear Tamer              village Characters 88  -            1
angel       Thiên Thần              The Angel               solo    Characters 90  -            1
idiot       Thằng Ngốc              Village Idiot           village Characters 92  -            1
scapegoat   Vật Tế Thần             Scapegoat               village Characters 94  -            1
servant     Người Hầu Trung Thành   Devoted Servant         village Characters 96  -            1
```

### Notes on individual cards

- **Bodyguard** is `only:'vn'`. It is standard in Vietnamese play and **not in the
  original French box**. Both deck generators skip it under `mh`; you can still add
  it by hand and get a warning. See bug B-14.
- **Werewolf** `max:8` — the practical ceiling, not a rule.
- **Wolf Hound** is `team:'village'` in the table but `teamOf()` returns `wolf` once
  `G.houndSide === 'wolf'`. Same for a **Wild Child** with `p.turned`.
- **The Sheriff / Trưởng Làng is not in this table.** It is a *title voted on by the
  village*, not a card. Any player can hold it, including a werewolf. See §4.

---

## 3. Night call order

`n1` and `every` are sparse integers, not indices. Gaps exist so a card can be
inserted without renumbering.

```js
n1Of(r)    // ruleset override, else r.n1
everyOf(r) // ruleset override, else r.every
ord()      // all roles sorted by n1Of, ruleset-aware
```

`buildNight()` produces `G.steps` — the actual script:

- **Night 1**: every card in the deck is called, in `n1Of` order. Each step does
  *identification* (tap who opened their eyes) and *action* in one screen.
- **Night 2+**: only living, identified, still-active roles with an `everyOf` value.
  The White Werewolf is called on **alternate** nights only.

Villagers are auto-assigned to whoever is left at the end of the night-one roll call.

### Sorting: two comparators, two purposes

- `byTeam` — wolves first. Used for the **picking list** in the deck builder, because
  the wolf count is the first thing you set.
- `byCall` — `n1Of` ascending, uncalled cards last. Used for the **"in your deck"**
  zone, because that zone is a preview of the night you are about to run.

Do not unify them. Bug B-19 was `byTeam` being applied to the deck zone, which hoisted
Ma Sói (position 60) to the top and destroyed the preview.

---

## 4. Ruleset divergences

`RULESETS = { vn: { over: { fox:61, seer:62 } }, mh: { over: {} } }`

The `over` map only moves call positions. Everything else below is handled in code.
**This table is the most expensive knowledge in the project.**

| # | Rule | Ma Sói Việt Nam | Miller’s Hollow | Where |
|---|---|---|---|---|
| 1 | Seer's information | wolf / not-wolf only | the **exact card** | `showSeer` |
| 2 | Seer's position | **after** the pack (62) | before it (55) | `RULESETS.over` |
| 3 | Fox's position | **after** the pack (61) | before it (50) | `RULESETS.over` |
| 4 | Bodyguard | in the base deck | **not in the box** | `only:'vn'` |
| 5 | Witch self-rescue | **not allowed** | allowed | `witchMaySaveSelf()` |
| 6 | Hunter poisoned by the Witch | **no shot** | fires anyway | `hunterFiresPoisoned()` |
| 7 | Sheriff's vote weight | **1.5** | 2 (flat double) | `SHERIFF_WEIGHT()` |
| 8 | Wolves win on parity | **yes**, wolves ≥ villagers | no, must kill all | `checkWin` |

### Why moving the Seer and the Fox is free

Both are asleep while the wolves choose, so being called before or after gives the
*player* no extra information. Wolf membership cannot change mid-night:

- The Wolf Hound picks its side at position **30**, before either.
- The Wild Child turns only when its model **dies**, and deaths resolve at **dawn**.
- The White Werewolf kills at 65, also resolving at dawn.

So moving them after the pack is informationally neutral for players and lets the app
answer from the screen instead of asking the moderator to lift a card. That reasoning
is pinned by tests in `fox-test.js`.

### The disputed rules are settable

Seven rules are genuinely argued about between tables, so they are **house rules** with
three states rather than hard-coded:

```js
G.elderRevenge  // null = follow the published rule, true, false
G.selfHeal      // null = ...
G.hunterPoison  // null = ...
G.hunterElder   // null = ...
G.showCards     // null = ...
G.voteMajority  // null = ...
G.hunterNight   // null = ...
elderStripsPowers()      // null ? true           : G.elderRevenge
witchMaySaveSelf()       // null ? rules !== 'vn' : G.selfHeal
hunterFiresPoisoned()    // null ? rules !== 'vn' : G.hunterPoison
hunterFiresPowerless()   // null ? false          : G.hunterElder
cardsShownOnDeath()      // null ? rules !== 'vn' : G.showCards
voteNeedsMajority()      // null ? false          : G.voteMajority
hunterShootsInTheNight() // null ? false          : G.hunterNight
```

Two of them exist because a table asked. **`elderRevenge`** answers "can the Hunter fire
after the Elder dies while the rest of the village keeps its powers?" — `hunterElder`
exempts the Hunter alone, so the broader question needed its own switch, and it sits above
the Hunter row because it governs it. **`voteMajority`** is the one that was not a
disagreement at all: the app simply had the rule wrong (B-72), and the setting exists so a
table used to the old behaviour can keep it.

`null` is **distinct from `false`** and must stay that way — a test asserts it. An
explicit ruling survives switching ruleset.

**The third is not a tradition split, and that distinction is load-bearing.** The first
two really do differ between Miller’s Hollow and Ma Sói Việt Nam, so their default reads
the chosen ruleset. No ruleset addresses whether the Hunter still shoots once the Elder’s
revenge has taken every villager power, so its default is the same under both. That is
why `byRule` is a property of each row rather than one shared `G.rules !== 'vn'` — the
shared version labelled the third row's default "có" under Miller’s Hollow, which is the
opposite of what it does.

The question exists because the two cards read past each other: the Elder cancels the
villagers' powers and names no exception, while the Hunter's card says he fires "if he is
killed by any reason". The app defaults to no shot — the shot is a power, and the power is
gone — and says so on the panel, with the counter-argument, so a table can overrule it
knowing what it is overruling.

### The Sheriff (Trưởng Làng / Capitaine / 警长)

Not a card. Elected by the village on day 1.

- Vote worth 1.5 (vn) or 2 (mh).
- On death — **any cause, day or night** — names a successor, or destroys the badge.
- The title is independent of the card: surviving a power loss, a reveal, a side change.
- A werewolf can be elected and usually tries to be. When a wolf-Sheriff dies it hands
  the badge to another wolf.

The most commonly forgotten rule at real tables: **a Sheriff killed at night still
passes the badge.** Handled by the interrupt queue (§6).

### The Hunter's shot is compulsory

Not optional. He *must* take a living player with him. There is a house-rule escape
labelled as such (`"House rule: he fired wide"`), which writes that fact to the
chronicle. See bug B-13.

---

## 5. Never guess

The single most important rule in the codebase:

> **The app never invents information it has not been told.** When it cannot know
> something, it says so, names what is missing, and asks.

Bug B-22 was the deepest violation of this — but in the *opposite* direction: the app
refused to answer a question it demonstrably could.

### `wolfSideKnown()` vs the retired `allKnown()`

A wolf question is **"is any of these a wolf?"**, not **"what does each of these
hold?"**. Those need different predicates.

```js
// Can I say for certain whether any given player is a wolf?
// NOT "do I know everyone's card" — only "has every card that could put someone
// on the wolf side been placed".
function wolfSideKnown(){
  for (const id of ['wolf','whitewolf'])
    if ((G.counts[id] || 0) > withRole(id).length) return false;
  if (G.counts.wolfhound){
    if (G.houndSide == null) return false;
    if (G.houndSide === 'wolf' && withRole('wolfhound').length < G.counts.wolfhound) return false;
  }
  if (G.counts.wildchild && withRole('wildchild').length < G.counts.wildchild
      && G.players.some(p => !p.alive)) return false;
  return true;
}
```

Once both Werewolf cards sit on known players, **everybody else is definitively not a
wolf, whatever they hold.** Unidentified villagers are irrelevant.

**Six sites ask a wolf question and all six use this predicate:**

1. The Fox's trio
2. The Bear Tamer's growl
3. The wolves' target list (which must exclude wolves)
4. The Knight's rust (needs the first wolf clockwise)
5. `checkWin` (needs to count the two sides)
6. The Seer's Vietnamese answer

`allKnown()` was deleted entirely. If you find yourself reaching for "is every card
known", stop and ask what you actually need.

`unplacedWolfCards()` names the missing cards in words, so the message tells the
moderator *what to go and find* rather than which players it does not recognise.

### The one case that still asks

**Miller’s Hollow + discover-during-the-night + night one.** The Fox and Seer are
called before the pack, so no wolf card is placed yet. The app names the unaccounted
cards and takes a manual YES/NO. Under `vn`, or after "collect the deal", this never
happens.

---

## 6. Architecture

### Files

```
index.html              markup and document head
css/app.css             all styling
js/app.js               roles, game logic, rendering
sw.js                   offline worker — bump VERSION on every release
manifest.webmanifest    installable PWA
icons/                  icon.svg, icon-192, icon-512, icon-mask-512
fonts/                  10 woff2 subsets, self-hosted
```

No build step: the browser loads those files directly. Anything added must also go in
`PRECACHE` in `sw.js`, or it will not be there offline.

### State

One plain object, `G`. Fully JSON-serialisable — which is what makes both Undo and
crash recovery cheap.

```
players counts night day phase log steps si n dawn pending
witchHeal witchPoison foxPower elderLife powersLost judgeUsed
houndSide sheriffDone infectNext over scapegoatVoters assignTo
knewDeal rules lastGuard selfHeal hunterPoison hunterElder resume votes
sheriffVote showAllRoles scope dawnWhy dawnSure dawnEdit
```

- `G.n` — this night's choices, cleared each night. `G.n.skipped` records skipped
  steps so `computeDawn` can be honest about gaps.
- `G.pending` — the interrupt queue (`hunterId`, `hunterCause`, `badge`).
- `undoStack` — 80 JSON snapshots. `snap()` before any mutation.
- `expOpen` — a `Set` of open collapsible keys. Deliberately **outside `G`** so Undo
  does not slam your reference panel shut.

### Phases

`players → roles → deal → night → dawn → day → end`
plus three interrupts: `hunter`, `sheriff`, `scapegoat`.

Every phase is in one dispatch table. Bug B-05 was a phase missing from it, which
crashed on Undo.

### The interrupt queue

A death can interrupt the flow, from **either** night or day:

```js
registerDeaths(chain)  // logs, and queues pending.hunterId / pending.badge
proceed()              // checkWin -> hunter -> sheriff -> G.resume ('day'|'night')
```

`G.resume` records where to return. Before this existed, the Hunter's shot and the
badge handover were only wired into the day-vote path, so a Hunter or Sheriff killed
at **night** silently lost their ability (bug B-11).

### Dawn is computed, not confirmed

`computeDawn()` resolves the night from what was recorded and produces:

- `G.dawn` — deaths, each toggleable
- `G.dawnWhy` — plain-language reasoning, shown as "How that follows"
- `G.dawnSure` / `G.dawnGaps` — whether it can be certain, and why not

The moderator reads out a **statement**, not a questionnaire. It only asks when a step
was skipped or a rule card (Elder, Knight) is unplaced. See bug B-10.

### Vote counting

The day vote requires **strictly more than half** the voting weight.

```js
votePower(p)      // 1, or 1.5 / 2 for the Sheriff
eligibleVoters()  // alive, minus voteless (revealed Idiot), minus Scapegoat exclusions
totalPower()      // sum
// threshold = totalPower() / 2, strictly greater
```

Exactly half **fails**. The Sheriff's extra weight is applied to whichever candidate
you mark with ⭐, not baked into the raw hand count.

Rows are built once; a `refresh()` closure updates only the derived numbers. Typing in
a vote box must never trigger `render()` or the input is destroyed mid-keystroke
(bug B-20).

### Legal targets

`targetPool(roleId)` — not every role may point at everyone:

| role | may target |
|---|---|
| `wolf` | non-wolves only — **the pack never eats its own** |
| `whitewolf` | werewolves only, not himself — he eats *only* his own kind |
| `seer` | not herself |
| `piper` | not himself |
| `wildchild` | not himself |
| `guard` | anyone including himself, but never the same person twice running |
| `cupid`, `fox` | anyone including themselves (the rules allow both) |

An **unknown card stays in the wolves' list**, because it cannot be ruled out — with
a warning naming the unplaced cards.

### Deck generation

```js
recommend(n, chars)     // deterministic, fixed order
shuffleDeck(n, chars)   // random but always legal
```

`shuffleDeck` guarantees: exact card count, correct wolf count, a Seer always, a
Bodyguard under `vn` from 8 players, `exact` counts respected, nothing below its
minimum table size, a villager floor varying 24–40% for variety.

**Exclusion groups** — at most one from each, or the game becomes soup:

```js
EXCL = [['piper','angel','whitewolf'], ['sisters','brothers']]
```

**The White Werewolf takes a seat in the pack rather than adding to it** — otherwise
the wolf count comes out one too high (bug B-02).

`SHUF[id] = [weight, minimumTableSize]`. Weight controls *frequency* via an acceptance
roll, not just draw order (bug B-03).

### Spacing: one structural mechanism

Any container that renders a stack of blocks carries `class="stack"`:

```css
.stack > * + *{margin-top:var(--s4)}
.stack > *{margin-bottom:0}                 /* so gaps cannot compound */
* + .stack:not(:empty){margin-top:var(--s4)}
.stack > .card,.stack > .alert,.stack > .exp{margin-bottom:0}   /* see B-71 */
```

The third rule used to pair stack with stack, which left any stack following a plain
paragraph with no gap at all (B-76). The fourth exists because `.stack > *` and `.card`
are both a single class, so the reset was losing on source order (B-71). Both were
invisible in the diff and found by measuring.

The scale governs **block rhythm**, not every pixel: a button's `11px 14px` padding and an
icon's `8px` gap are deliberately outside it. `spacing-test.js` checks the rhythm rules
specifically — a mutation that set the stack gap to `7px` passed every other suite.

There are **no id-based spacing selectors**. Three separate spacing bugs came from a
hand-maintained id list I kept forgetting to extend (B-16). `#lRoles` is deliberately
*not* a stack — it has its own flex `gap`, and marking it would double its spacing.

### Control typography: one voice

```css
--ctl-size:var(--t-body); --ctl-weight:600; --ctl-track:.005em;
```

The field, its placeholder and every button read from these. Only weight differs, by
one step (placeholder 500), so an empty field still reads as empty. `.row.tall .btn`
adjusts **layout only** — a test asserts it declares no font properties.

### Three surfaces, one job each

Six container types — `.card`, `.p`, `.r`, `.alert`, `.exp`, `.tl` — were all surface
plus a 1px line plus a radius between 10 and 14. A dawn screen stacked four boxes of
equal weight and the eye had no reason to start anywhere.

| surface | what it is for |
|---|---|
| `.group` | one rounded container, rows divided by hairlines, no per-row edge |
| `.say` | the read-aloud block. Nothing else may look like it |
| plain | text on the background — where most of what was a `.card` belongs |

`.card` survives only for a genuine panel of controls (the two on the deck screen, the
add-name row). Rows inside a group surrender their border and radius, and get the
hairline back at higher specificity — see B-65 for why that is not optional.

The **vote list is a deliberate exception** and keeps its per-row edges: each row carries
state the others do not (`.lead`, `.over`), `.p.vote.over` signals "this vote carries"
with a border a grouped row would have given up, and the rows are reordered with flex
`order`, so a `border-top` on the DOM-first child would land mid-list.

### One type scale, three radii

Nineteen sizes shipped: 9, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5,
17, 18, 21, 22, 30, 34. The half-pixel steps are the tell — three separate moments of
nudging one element, not three decisions.

```css
--t-micro:10px  --t-cap:11px  --t-small:13px  --t-body:15px
--t-lg:17px     --t-say:21px  --t-h:26px      --t-max:34px
--r-ctl:10px    --r-grp:16px  --r-full:999px
```

`scale-test.js` asserts **no rule declares a bare font-size or radius**, in the stylesheet
or as an inline style in `app.js`. One exception is enough to restart the drift.

### The tint is reserved

`.alert` is the highest-contrast object in the design and it was carrying twenty-seven
different jobs. It is now kept for what genuinely stops the moderator — `.alert.no`, and
the Bear Tamer's growl. Everything else is `.tell`: ordinary prose with a small leading
mark, and a tinted **dot only** for the `.ok` variant, so "this is fine" survives at a
glance without a whole block shouting. Twenty-four lines were demoted.

### Interface language

A **device preference**, not game state — it started in `G`, which is what a new game
replaces, so "Same table, new game" forgot it (B-69). Both it and the tips setting now live
in `mh.prefs`, beside `mh.games`, and out of the undo buffer and the save file: switching
language is not a move Undo should reverse.

```js
const PREF_KEY = 'mh.prefs';
const prefs = { lang: (/^vi\b/i.test(navigator.language || '') ? 'vi' : 'en'), tips: null };
const vnUI = () => prefs.lang !== 'en';
const T = (vi, en) => vnUI() ? vi : en;
const rName = r => T(r.vi, r.name);       // was an inline ruleset test in nine places
```

`!== 'en'` rather than `=== 'vi'`, so an unreadable or absent preference lands on the
Vietnamese-first default this app is written for. Only the two known values are accepted
back out of storage. Separate from `G.rules`, which it used to ride on (B-66).

Both languages survive only where the second one **is** the content: the read-aloud line
(one tap away) and role names in the deck list, which a table argues about in both.

**Everything on screen goes through `T()`.** That includes the rules prose — the Fox's
ruling, the Witch's potions, the dawn reasoning, the cause of every death — because one
language plus twenty untranslated blocks is worse than the bilingual noise it replaced
(B-70). `lang-test.js` walks every `.tell` and `.alert` construction and fails on any prose
literal not reached through `T()`; that scan found two blocks the hand sweep missed.

Everything a moderator reads on screen is paired: labels, headings, buttons, house-rule
notes, the four collapsible essays, and all 26 role descriptions (`dVi`, reached through
`rDesc()`, which falls back to the English so a card added without one still says
something). The role description is the one that mattered most — the night call puts it
under every heading and the deck list puts it in every row (B-74).

**Still English-only: the chronicle.** Log entries are written once, at the moment they
happen, and stored as finished strings — translating the writers would not retranslate a
game already in progress, and a record of what was said is arguably not a label at all.
It is the one surface left, and it is deliberate.

### The teaching layer retires itself

`gamesPlayed` in `localStorage['mh.games']`, its own key so ending a game does not erase
it. `teaching()` is the same tri-state shape as a house rule: `prefs.tips == null` decides
from experience (`gamesPlayed < 2`), true/false is the moderator overruling it, settable
from the Roster. `null` means "not yet chosen **on this device**" rather than "not yet
chosen in this game". While it holds, collapsibles open themselves; `expShut` records an
explicit close so the default cannot reopen it. `tip()` gathers prose per screen and
`flushTips()` emits **one** affordance rather than six.

`render()` clears `tipBuf` at the top: a screen that pushes a tip and returns early drops
it rather than handing it to the next screen.

### Bottom bar

`bar(items)` distributes width: the primary action grows, a secondary sits at its
natural width. When every option is secondary they share the row evenly, so the bar
is never left half empty. Order-independent. `wide:true` forces full width.

---

## 7. Bug catalogue

Every bug found, with its root cause. Grouped by class, because the classes repeat.

### Rules correctness

| # | Bug | Root cause |
|---|---|---|
| B-58 | A hushed call **read as a live one** | Reported from the same table, right after B-57: "I see him die but the next night the villager team still have spell." The rule was firing correctly. The SCREEN said otherwise. B-54 kept village cards in the night so the length would not leak, and put the notice in `#nBody` — which the document places *after* the read-aloud block. So the order was: role name, what the card does each night, “Tiên Tri thức dậy. Chỉ vào người mà bạn muốn soi”, and only then, small and underneath, that nobody was going to. At the speed of a real night that is a live power. The notice moved above the line, into its own `#nHush`; the heading carries a `không ai thức · nobody wakes` tag in `--wolf`; and the description is replaced instead of explaining a power that is gone. The line itself still reads out verbatim — suppressing it would re-open the leak B-54 closed. |
| B-57 | The Elder took only the powers that **wake at night** | Reported from a real table: the village hanged the Elder and the other village roles still had their spell. They did. `G.powersLost` was read in exactly one behavioural place — the night call list — so every villager power triggered anywhere else carried on working: the Hunter still fired, the Idiot still walked away from the rope, the Scapegoat still died in place of a tie, the Bear Tamer still growled, the Knight’s rust still spread, the Judge could still demand a second vote and the Little Girl could still peek. Six of the seven change who wins. One predicate, `powerGone(p)`, is now asked at every trigger, and the day alert names what is actually gone rather than saying "every villager loses their power" — the sentence that was easy to read as "the night calls stop", which is how it came to be half-implemented. Reads `teamOf`, so a turned Wild Child or a Hound who joined the pack keeps what being a wolf gives him, and the Sheriff’s badge is untouched because it is a title the village votes on, not a card. |
| B-53 | The mixed-Lovers test read an **unlearned card as a different side** | Fixing B-39 to compare the two sides re-opened the same hole one layer down: `teamOf` returns `'none'` for a card nobody identified, so a village lover beside an unidentified one compared `'village'` against `'none'`, read as mixed, and handed Cupid the win a second way. The app was not guessing — `checkWin` returns early unless `wolfSideKnown()`, and that predicate's whole argument is that once every wolf-side card is placed, anybody still unidentified is **provably not a wolf**. A local `sideOf()` resolves an unknown card to the village side, declared *below* the gate so the licence is structural. The general shape: the remaining bugs live in the gap between what is true and what the code has been told, and the fix is to name the predicate that licenses the answer. |
| B-54 | Lost powers **dropped** the call, the one place the hush rule was not applied | Four lines above the code that invented hushing, `buildNight` still did `if (G.powersLost && r.team === 'village') continue`. The comment reasoned that the loss is publicly known — true — but that is not what the night leaks. The table hears *how many calls disappeared*, and the delta counts the powered village cards the deck held. Two rules in one loop, reaching opposite conclusions from the same premise. Now a third hush kind, `powerless`, so the night keeps its length. |
| B-55 | The Thief's swap **did not reconcile `G.counts`**, and the new night reads `G.counts` | The Thief is the only move that changes which cards are at the table mid-game: his own goes back to the spares and one comes in. That was merely untidy while the night was built from live holders — the Roster listed the Thief as unplaced forever. It became a disappearing card the moment B-35 made `G.counts` the record of what is in play: a Thief who took a spare Fox was never called again, because no Fox was ever in the deck. Exactly the bug the deck-driven night was written to end, re-entering through the one path that moves a card without saying so. `thiefTakes()` now decrements the old and increments the new. **The fourth-pass review assessed this as safe by luck; it was not safe at all.** |
| B-35 | A card nobody was ever identified for was **dropped from the whole game** | `buildNight()` composed night 2+ from the known holders, so a role nobody answered for at the roll call was never scheduled again — not skipped for a night, gone. A Bodyguard asleep during his own call never shielded anybody; the Witch kept both potions to the end. And `computeDawn()` reported those nights fully resolved, because it only counts what it was told. The Skip button even promised "you can set it later from the Roster", which could not work: nothing rebuilt the script. Now built from `G.counts` — what is in play — and an unidentified card gets the identification panel night one already has. |
| B-36 | Four of the five Skip buttons never recorded the skip | `noteSkip()` exists so dawn can be honest about gaps, and it was wired to exactly one caller. The roll call, the Witch, the Wolf Hound and the Thief all advanced `G.si` on their own, so skipping the Bodyguard left `G.n.skipped` empty, `dawnSure` stayed true, and the moderator read out a death the app had no standing to be sure about. **A missing entry in a gap list looks exactly like no gap.** All of them route through one `skipStep()` now, and a structural test walks every bar item labelled Skip. Two kinds are recorded separately: an action not taken, and a card nobody would answer for. |
| B-37 | The Scapegoat silenced the village **permanently** | The rule is one day — "as he dies he decides who may vote tomorrow". `G.scapegoatVoters` was cleared in exactly one place: the "Everyone may vote" button on the screen that set it. Nothing in `toNight()`, `proceed()` or `rDay()` reset it. It compounds: `eligibleVoters()` feeds `totalPower()`, which sets the threshold, so a tie on day 2 permanently shrank the electorate and every later vote was measured against the wrong arithmetic. Now scoped by the day it governs (`G.scapegoatDay`), the same shape as `G.lastGuard`. |
| B-38 | The Elder's second life was spent by the **report**, not by the outcome | `computeDawn()` is documented as producing a read model. It also wrote `G.elderLife = false`, inside the branch composing the sentence explaining it, and `applyDawn()` takes the snapshot Undo returns to *afterwards* — so Undo restored a state where the life was already gone. Worse, the moderator can act in the gap: "something else happened — adjust" lets them decide the Elder died after all, and he died having also spent the life meant to save him. `computeDawn` now records `elderAbsorbed`; `applyDawn` spends it, after the snapshot, and only if he did not die anyway. **Compute functions that mutate are the bug class the interrupt queue was built to avoid.** |
| B-39 | Two lovers on the **same side** won as "The Lovers" | `checkWin` tested the pair before it tested the teams, so a wolf-and-wolf or villager-and-villager pair that outlasted everyone was credited to Cupid. The pair only wins *alone* when it is mixed; otherwise they win with their side. A turned Wild Child can make a matched pair mixed mid-game, which is why the test reads `teamOf`, not the card. |
| B-40 | The poisoned-Hunter rule was decided by a **regex on prose** | `/poison/.test(c.cause)` against the human-readable "the Witch's poison". One copy edit — translating causes, or saying "venom" — would have turned the rule off with nothing failing. The Elder's consequence had the same shape (a list of English phrases). Causes carry a code now and the sentence is derived from it: `CAUSE` holds the label and a `village` flag, and both rules read the code. `causeLabel()` falls back to the raw string, so a game saved before the change still renders. |
| B-41 | `G.judgeUsed` was a flag nothing could ever set | Initialised in `blank()`, read in `rDay()`, written nowhere — so the "watch for the sign" alert stood for the whole game. Exactly the "option that looks meaningful but does nothing" the process rules warn about. The moderator is the only person who sees the sign, so they record it, and it clears the tally for the second count. A test now sweeps every flag in `blank()` for the same defect. |
| B-33 | The Elder's death only stripped village powers when he was **voted** out | `powersLost` was set inside `resolveVote()`, so the Witch's poison and the Hunter's shot — both village-caused deaths — silently left every power intact. Moved into `kill()` and driven by a `VILLAGE_KILLS` list, so no death route can bypass it. A **werewolf** kill still costs the village nothing: surviving one attack is the point of the card. |
| B-34 | Skipping a dead role's night call announced the death | Night 2+ dropped any role whose holder was dead. The table hears a shorter night, infers who is gone and narrows the rest by elimination. Dead and spent cards are now still called, marked `hush` — same line, same pause, no target asked. The same condition was doing double duty as "is this card in the deck at all", and separating them mattered: removing it naively made the app call the Pied Piper in a deck with no Piper. |
| B-01 | Wolves could eat each other; the White Wolf was offered villagers | Target list was `alive()` for every role. No per-role legality. Fixed with `targetPool()`. |
| B-02 | Shuffled decks had one wolf too many | The White Werewolf is `team:'wolf'`, so adding him *increased* the pack. He must take a seat instead. |
| B-11 | A Hunter or Sheriff killed **at night** lost their ability entirely | Both interrupts were wired only into the day-vote path. Dawn went straight to `day`. Fixed with the `pending` queue and `proceed()`. |
| B-12 | The Witch was offered **herself** as a poison target | Poison list was `alive()` with no self-exclusion. |
| B-13 | The Hunter had a "shot nobody" button | The shot is **compulsory**. My UI invented a choice the rules do not offer. |
| B-14 | Miller’s Hollow decks contained the Bodyguard | I marked it `set:'Base'` (true for Vietnamese play), and the Classic scope filters on `set`. Ruleset ownership is a *different axis* — added `only`. |
| B-15 | A vote below half still eliminated someone | There was no tally at all — the moderator just tapped a name. |
| B-17 | Parity was not a win condition | `checkWin` only fired when villagers hit zero. |
| B-18 | **The game could never end** | `checkWin` bailed if *any* player was unidentified — including the **dead**. One player who died before you learned their card froze the result for the whole game. |
| B-22 | The Fox was asked a question the app could answer | Guarded with `allKnown(trio)` — "do I know all three cards" — when the question is "is any of them a wolf". With both wolf cards placed, the answer is certain. Five other sites had the same error. |
| B-23 | The Fox printed his answer **on the moderator's own screen** | Inconsistent with the Seer, and readable by anyone glancing over. Now both use `showReveal`. |

### State machine

| # | Bug | Root cause |
|---|---|---|
| B-04 | Sheriff decline looped; Idiot reveal left the day hanging | Missing terminal transitions (`sheriffDone` flag, `toNight()` call). |
| B-05 | Undo mid-interrupt crashed | Three phases were absent from the render dispatch table. |
| B-06 | Deal screen accumulated a duplicate "Skip" button on every visit | It was appended to `dealList`'s **parent**, which `rDeal()` never clears. Now lives in `#dealAlt`, which is emptied each render. |

### UI and CSS

| # | Bug | Root cause |
|---|---|---|
| B-62 | The Hunter screen never said **how** the shot happens | Asked at a table: "when does the Hunter fire, in his call to open eyes or after moderator told him die? If after, how to fire — he'll point to someone or what?" He has no `every` value, so there is no call to fire in: the shot is triggered by his death. But the screen said only *"tap whoever he points at"*, which assumes the moderator already knows they are meant to ask a dead player to point, out loud, in front of everybody, and that the Hunter chooses rather than they do. Now stated, both for the public shot and for the private one. |
| B-63 | "His card stays down" implied the Hunter could be **kept secret** | Copy I added one commit earlier. True about the card and wrong about the secret: a dead player points and somebody drops, which identifies him whatever the reveal rule says — and a Hunter voted out fires in daylight, where nothing can hide it. The screen now says so, and points at the one arrangement that does hide him: take the shot in the night. |
| B-64 | The private night shot was **offered twice** on the empty path | Found by mutation testing, not by playing: the "nobody left to hit" route out of the private screen did not set `nightShotTaken`, so `registerDeaths` would queue the same shot again at dawn. The test that should have caught it asserted the flag was set *somewhere* in the function, which passed while a mutation deleted the main one and left the escape hatch. It now requires every `if (priv)` route to mark it. |
| B-60 | The app never said whether to **open a dead player's card** | Asked at a table: "when the Hunter is bitten by werewolves or voted, when will he open the card or not?" The app was silent on the cards at every death — dawn announced a name and a cause, the vote moved straight on, and the Hunter screen went to the target list. Meanwhile the Devoted Servant shipped with a description defining her window as "before an eliminated player's card is revealed", presupposing a step that did not exist anywhere. Miller's Hollow reveals every elimination, night or day, with no exception; Vietnamese tables commonly do not. So: a fourth house rule, and the instruction stated at all three moments a death becomes public — the dawn announcement, the vote verdict (before the button, since tapping it moves the screen on), and the Hunter screen. The Village Idiot overrides the setting: being shown is HOW the village learns to spare him. |
| B-74 | The long prose ignored the language switch entirely | Reported from screenshots: an English interface serving Vietnamese essays. The `.tell` sweep in v6 covered the short blocks but not the four collapsible bodies, the ruleset gloss (`Miller’s Hollow (bản gốc)` in both directions), or **role descriptions** — which the night call puts under every heading and the deck list puts in every row, so a Vietnamese moderator read an English paragraph on every single step. The `order` explainer was the worst shape: it chose its text by *ruleset*, so the language you got depended on which rules you were playing. Content per ruleset, language per `T()` — four texts, not two. All 26 cards now carry a `dVi`, reached through one `rDesc()` accessor that falls back to the English rather than to nothing. |
| B-76 | A stack that followed prose got **no gap at all** | Reported from a screenshot: the "Which route should I take?" collapsible sat flush against the deal note. The structural rule paired stack with stack — `.stack:not(:empty) + .stack:not(:empty)` — so `#dealAlt`, whose previous sibling is a plain `<p>`, was given nothing, and its first child gets no `* + *` either. Measured at **0px** where every other gap on that screen was 20. Generalised to `* + .stack:not(:empty)`; margins collapse, so a neighbour with its own bottom margin (`.sub` at 28) still wins and nothing compounds. |
| B-75 | A collapsible body was **padded unevenly** | `14px 20px 20px`, so the prose sat visibly nearer the divider above it than the border below. Spotted in a screenshot, confirmed by measuring. The summary keeps its own 14/20 because it is a row; a body is a panel, and a panel is padded like `.card`. |
| B-73 | The vote tallies could **sum past the electorate** | Reported from a game: nine players, five votes recorded on one name and nine on another — fourteen hands from nine people, and a leader the table never produced. Each box was clamped to `voters.length` **on its own**, with nothing bounding the total. The over-count warning fired but only warned; the vote still carried on impossible arithmetic. The cap is now what is *left*: `voters.length` minus the hands already on other names. It never falls below what a name already holds, so a tally that is somehow over — a resumed save, an electorate that shrank mid-count — can still be corrected downwards instead of every box locking to zero. |
| B-72 | The day vote required an **absolute majority**, which neither rulebook prints | Asked at a table: should the most votes hang, or must it clear half? Both boxes say the most votes — *"the player with the most fingers pointing at them is convicted"* — with a re-vote on a tie and nobody hanged if it holds. Vietnamese play agrees: người nhiều phiếu nhất bị treo. The app demanded `best > TP/2`, and that is not a harmless stricter reading: on eight voters a decisive **4/3/1** split offered the moderator no Hang button at all, while the bar asked for a fifth vote that did not exist. The bigger the table the more the votes spread, so it got worse exactly as it mattered more — and it applied to every day phase of every game. Now plurality by default, with the majority available as a house rule. |
| B-68 | The haptics button shipped as an **empty bordered box on every iPhone** | Reported from a phone. Two v5 findings interacted: P4 gave `.ico` `display:inline-flex` for its 44px floor, and P3 added a button hidden with the `hidden` attribute. An author `display` beats the UA stylesheet's `[hidden]{display:none}` regardless of specificity — author origin outranks user-agent origin — so on any browser without `navigator.vibrate` the control was never hidden. And `paintHaptic` returned *before* setting the label, so what remained was a bordered box with nothing in it. Fixed with a global `[hidden]{display:none !important}`, and by labelling before hiding so a future failure is at least readable. |
| B-69 | Both moderator settings were **forgotten by the next game** | `G.lang` and `G.tips` lived in the object `blank()` replaces, so "Same table, new game" reset them: fold the tips away in your third game, start a fourth, and they are back. The asymmetry gave it away — `gamesPlayed`, the *automatic* guess, was given its own `localStorage` key precisely so it would outlive a game, while the two controls that overrule that guess were not. They are device preferences and now live in `mh.prefs`, out of the undo buffer and the save as well: switching language is not a move Undo should reverse. |
| B-70 | Twenty rules blocks were **hard-coded English** after the language switch shipped | The old bilingual design was noisy, but a Vietnamese moderator could always read *something*. Picking one language turned redundancy into a gap: the interface says it speaks Vietnamese, then hands over the Fox's ruling in English, mid-night, in front of the table. Worst on the collect-the-deal screen, where a bare `.tell` sat four lines above correctly wrapped buttons — a Vietnamese action bar under an English instruction telling the moderator what to tap. Fixed by wrapping them, and by a structural scan that walks every `.tell` / `.alert` construction looking for prose never reached through `T()`. The scan found two more I had missed by hand. |
| B-71 | `.stack`'s "children surrender their bottom margin" rule had **been losing since it was written** | Same cascade class as B-65, found while testing the fix for it. `.stack > *{margin-bottom:0}` and `.card{margin-bottom:var(--s3)}` are both a single class, so the tie falls through to source order — and `.card` is declared thirteen lines later. Every `.card`, `.alert` and `.exp` inside a stack was getting the container's gap **plus** its own. Fixed with a `.stack > .card,…` reset at (0,2,0). |
| B-65 | Grouped rows shipped with their hairlines **declared and never drawn** | The C1 surface work gave `.group` a separator (`.group > * + *`) and reset the rows inside it (`.group > .p, .group > .r, .group > .dl { border: 0 }`). Both rules were present and correct-looking in the diff. But the reset is two classes (0,2,0) and the separator is one (0,1,0), so `border:0` won wherever it applied and every grouped container rendered as one undivided block. Source order does not help: specificity is resolved first. Found by measuring `borderTopWidth` on a real row in a browser, not by reading. The fix restores the hairline at (0,3,0) with `:not(:first-child)`. |
| B-66 | The interface language was decided by the **ruleset** | `G.rules === 'vn'` chose both the night call order and every label, in nine places plus the read-aloud line. So a table that wanted the Miller's Hollow *rules* got an English *interface* as a side effect of a decision about the rules, and a Vietnamese moderator on the original order was handed English cards to read out. Two unrelated questions on one switch. Split into `G.lang`, defaulting from `navigator.language`. |
| B-67 | The masking tip pointed at an affordance that had **moved** | It told the moderator to turn on night sounds "in the header". The sound control was moved into the Roster sheet some releases earlier. This is the second cost of a teaching layer this voluminous, and the review named it: nobody re-reads a tip they have learned to scroll past, so it keeps instructing people to use something that is not there. |
| B-61 | `#nHush` shipped as an **unclassed container** | The container added for B-58 had no spacing mechanism — its single `.alert` child happened to carry a margin, so it looked right and I measured it as right. Found by fixing the spacing suite's discovery, not by looking: it now carries `.stack` like every other container the app appends into, plus `.preSay` for the block margin `.stack` makes children surrender. A second block in there would have shipped flush. |
| B-59 | A component inside a collapsible **lost its own spacing** | Reported as "why is the content paragraph tight with the header above". A collapsible body holds either prose or a component that arrives with its own spacing tokens. The prose rule was a bare descendant, `.expBody p` — a class **plus a type**, so it outranks `.note`, which is a class alone. Every note inside every collapsible therefore had its top margin flattened to 0 and sat against whatever was above it, while the identical grp/chips/note pattern in a plain `.card` kept its 10px. Scoped to `.expBody > p`: a string body's paragraphs are direct children and still get it, a node body's are grandchildren and keep their own. Measured rather than eyeballed — 0px against 10px for the same three elements. |
| B-42 | One chip tap cost **two full-page reflows under a live blur** | Five things on the same click path: `snap()` serialised all of `G`; `render()` rebuilt every chip and `bar()` the action row; `measureBar()` read `offsetHeight`, forcing layout on a document just invalidated; it wrote `--barh` onto `documentElement`, invalidating style for the whole tree and waking the `ResizeObserver` watching `.bar`, which measured again; and all of it sat under `backdrop-filter: blur(14px)` over a region the rebuild had just dirtied. Chromium hands that to the compositor; Firefox largely does not, which is where the lag was reported. The blur was acting on **four percent** of the backdrop — the plate was already `.96` opaque, and the `@supports` fallback shipped alongside it was an opaque plate, which is proof the design never needed it. Blur deleted, fallback promoted to the rule, `--barh` moved to `.wrap`, and the measurement coalesced into one deferred read. |
| B-43 | Deduplicating the measurement on its **value** still wrote twice per tap | Only visible by instrumenting `.wrap` in a browser: one render calls `measureBar()` three times — `bar()` clears the pinned note, builds the buttons, then the caller pins a new note — and those are genuinely three different heights, so a `if (h === barh) return` guard deduplicated nothing. Coalesced with a queue flag so three calls cost one. |
| B-44 | The coalesced measurement **never ran in a hidden tab** | The first fix used `requestAnimationFrame` alone. A hidden tab never runs one, and the app can do its entire first render in a hidden tab — a phone that loaded the page and was switched away from. `--barh` then stayed unwritten and clearance fell back to the CSS default of 152px, against a bar that with a wrapped label and a pinned note measures more. Backed with a `setTimeout`; whichever fires first does the work. Found by measuring, not by reading the diff — the same way B-19 was. |
| B-56 | Both schedulers were armed and neither cancelled the other | Every render left a timer that woke only to find the work already done. Harmless and cheap, but it reads as a leak. The frame callback clears the backstop, so the visible path leaves nothing pending. |
| B-45 | `.chip` — the most-tapped control in the app — had **no pressed state** | Every night target, every role assignment and every house rule is a chip, and it had only `:hover`, which a phone never fires. So nothing acknowledged the touch until the rebuild in B-42 finished. Its `transition: border-color .15s, background .15s` had also never run once: `innerHTML = ''` destroys the node the transition would animate and the replacement mounts already carrying `.sel`, so there was no state change to interpolate. Added `:active` and `touch-action: manipulation` (both land on finger-down, before any JavaScript), plus an optimistic `.sel` on the tapped node — which is what finally gives the transition something to animate. `.ico` had the same gap, found by a test that went looking for the others. |
| B-46 | The rain **restarted its 1.1-second ramp on every tap** | `render()` calls `ambience()` unconditionally, so with sound on a burst of night-call taps meant the rain never reached its target level. Audible, not merely wasteful, and the entire point of the rain is that it should be unremarkable. Now a no-op when the requested state matches the current one. |
| B-47 | The undo buffer was bounded by **count only** | 80 snapshots of a state that grows all game: at a 20-player table with a full chronicle that is megabytes held live on a phone awake for an hour. Bounded by bytes as well, oldest first, always keeping one. Undo stays per-tap — a mis-tap needs one step back, not a whole phase — which is a deliberate departure from the review's suggestion. `saveSoon` cannot reuse `snap()`'s string either: `snap()` captures `G` *before* the mutation, by design, so reusing it would persist the state as of one tap ago. A test pins that ordering so the idea is not revisited wrongly. |
| B-48 | The chronicle was rebuilt whole on **every roster touch** | `openRoster()` re-rendered the entire reversed log each time it opened *and* each time a card was set inside it. The log only grows, so the roster got slower for the rest of the game — and the roster is what a moderator opens when they are already behind. Capped at the 40 most recent with the rest behind the existing collapsible, built only when opened. |
| B-49 | Vote rows **reordered out from under the thumb tapping them** | Promotion of the leader was held back only while a text box had focus — but the steppers are what people actually use, and tapping `+` focuses nothing. So the moment a trailing candidate took the lead, their row jumped to the top and the `+` under the moderator's finger became somebody else's `+`, mid-count, out loud. The order is frozen for the whole run of taps and settles 1.2s after the last one; the bar, the highlight and the verdict still update immediately. A guard checks the list is still in the document, because the settle timer calls `bar()` and would otherwise repaint a screen that had moved on. |
| B-50 | Half was **stated in words but never drawn** | Normalising the tally bars to the whole voting weight rather than to the leader was right — they are comparable to each other and to half. But half itself was left to be imagined at the midpoint of a bar with no midpoint marked, which is the one measurement the screen exists to make. One pseudo-element, no new colour. |
| B-51 | An uncertain dawn **locked the editor open** | `rDawn` set `G.dawnEdit = true` on every render while `dawnSure` was false, so the collapse was unreachable and the announcement was read with the full adjust list and the whole add-someone chip set underneath it. Set once, in `computeDawn`. Half-fixing this was itself a bug: opening it once left no way back, because the close control only existed in the `!dawnEdit` branch — found by looking at the screen, not the diff. |
| B-52 | The reveal put **Done under the recipient's thumb** | The phone is handed over with `Hold to see it` and `Done` stacked full-width at the bottom, Done the lower of the pair — nearest where a player grips, one release away from dismissing the reveal they were just handed. Done moved above the reveal, quiet and narrow. Fixing it exposed a second, pre-existing problem: under `place-items:center` the overlay column sized to its widest child, so it re-centred as the revealed word changed width. Given a definite width. |
| B-07 | Vietnamese text rendered as a mix of fonts and sizes | **Cinzel has no Vietnamese subset** and renders lowercase as small caps, so every `ả ệ ườ` fell back per-glyph. Replaced with Be Vietnam Pro + Lora. |
| B-08 | `\u266b` rendered literally in the header | It is a **JavaScript** escape placed in **HTML markup**, where it means nothing. |
| B-09 | Role icons were unstyled and misaligned | I renamed spans `class="av"` → `class="ic"` but only in the markup, then deleted the `.av` **CSS rule** as dead code — deleting the live styling. My verification grepped the file *before* the deletion and passed. |
| B-16 | Blocks sat flush against each other, three times | Spacing was a hand-maintained list of element ids. `#recBox`, `#advice`, `#enCard` were never on it. Replaced with `.stack`. |
| B-21 | The first list heading was short of the others — **twice** | Its separation is its own margin **plus the list's flex gap**, and the first child receives no gap. Attempt 1 zeroed it (28px worse). Attempt 2 removed the zeroing (still 14px short). It must carry the gap itself: `calc(var(--s5) + var(--s3))`. |
| B-24 | Two complete icon systems coexisted in the file | An `IC` map wired to the UI, plus an `ic:` field I added and never connected. Both correct, so nothing looked wrong — a silent divergence waiting to happen. |
| B-25 | The bottom bar showed content **through** it | The gradient started fully transparent and only reached 95% at 30% height. Role rows were visible behind the buttons. |
| B-26 | The resume overlay would throw on every reload | It appended to `#app`, which does not exist in this document, and its CSS was missing entirely. |

### UX design errors

| # | Bug | Root cause |
|---|---|---|
| B-03 | The White Wolf appeared in **every** shuffled deck | He cost nothing against the villager budget, so he was auto-accepted whenever drawn. Weights only affected draw *order*, not inclusion. Added an acceptance roll. |
| B-10 | Dawn asked the moderator to confirm arithmetic the app had already done | Designed as a questionnaire instead of a report. |
| B-19 | "Classic" and "Characters" appeared broken | At ≤12 players they produced **identical decks**, because `REC_CHAR` opened with the same base cards and the villager floor stopped the list before it reached an expansion role. Nothing changed on click, so it looked dead. |
| B-20 | Counting a 17-player vote meant 11 taps per candidate | Steppers only. Added a typed input — which then must not trigger `render()`. |
| B-27 | The two deck presets looked like actions, not a setting | Restructured: Classic/Characters is a **scope**, and both Shuffle and Suggested obey it. |

### Security

| # | Bug | Root cause |
|---|---|---|
| B-28 | A player name could execute script | Names are concatenated into markup via `innerHTML` in ~70 places. Typing `<img src=x onerror=…>` as a name ran it — confirmed in a browser, not theoretical. Fixed at the **one** point names enter (`safeName`, applied in `addPlayer` and `loadSaved`) rather than at seventy output sites, because one missed site is still a hole. Low severity — one device, no server, no secrets — but real. |

### Delivery pipeline

These cost more than any rules bug, because the app was correct and simply did not reach
anyone. All three share a cause: **a mechanism was removed without understanding every
reason it existed.**

| # | Bug | Root cause |
|---|---|---|
| B-29 | `v0.2.0` tagged, published, and never deployed | The release ran on `pull_request`, so its ref was `refs/pull/16/merge`, and the `github-pages` environment only permits deploys from `main` — the environment checks the **run's ref**, not what the job checks out. A `gh workflow run static.yml --ref main` dispatch had been removed as redundant; it was also the only thing giving the deploy a `main` ref. Verification had used `workflow_dispatch`, which runs on `main`, so it could never have caught this. |
| B-30 | A version bump could ship under the old cache key | The deploy checked out the event's commit, which predates the bump. Fixed with an explicit `ref: main`, and the deploy now pins `sw.js` from the latest tag. |
| B-31 | Branch protection and the release were incompatible | Required status checks block **direct pushes**, not just merges, and GitHub Actions cannot be a bypass actor on a user-owned repo. The release pushed `chore(release)` straight to `main`. Fixed by removing the need: nothing writes to a branch, only tags are pushed, and tags are not branch-protected. |
| B-32 | Every labelled PR showed "1 workflow awaiting approval" | The first fix for B-31 had a workflow commit the version onto the PR branch. A `pull_request` run created by a `GITHUB_TOKEN` push is deliberately held for maintainer approval, so the required `test` check read "Waiting for status to be reported" and merge was blocked until the dispatched run reported. There is no setting to disable it — only a PAT, a GitHub App token, or clicking Approve. Fixed by having no workflow write to a PR branch at all: the version is injected into the artifact at deploy time from the tag. |

Method note: mutation testing with `perl -0pi -e` silently failed to match in some cases,
so a "no tests failed" result meant *the mutation never applied*, not *the code is
unreachable*. One guard was deleted on that evidence. Mutations are now applied with
`node` and assert the file actually changed.

---

## 8. Test suites

Node only, no framework. Each suite `eval`s functions **straight out of the shipped
source**, so it tests the real code rather than a copy.

```
index.html              markup and document head
css/app.css             all styling
js/app.js               roles, game logic, rendering
sw.js manifest.webmanifest
icons/                  favicon, touch icon, PWA icons
fonts/                  Be Vietnam Pro + Lora, latin & vietnamese woff2 subsets
tests/
  run-all.sh            tests/run-all.sh
  *-test.js             30 suites, no dependencies beyond node
docs/
  KNOWLEDGE.md          this file
  CONTRIBUTING.md       how to work on it
  DEPLOY.md             hosting, updates, and why not a framework
README.md  LICENSE      kept at the root: GitHub reads both from there
```

```bash
bash tests/run-all.sh
#   894 assertions across 30 suites, 0 failing
```

The suites read `../index.html`, so they test the **deployable file** — not a copy.

| suite | n | covers |
|---|---|---|
| `mh-test.js` | 42 | night scripting, seating, death cascades, victory, never-guess guards |
| `deploy-test.js` | 39 | manifest, service worker semantics, crash recovery, no-framework |
| `collapse-test.js` | 26 | collapsible blocks: default closed, state memory, styling present |
| `tally-test.js` | 26 | typed vote input, hostile input clamping, no re-render on keystroke |
| `wolfknown-test.js` | 24 | `wolfSideKnown()` across every route onto the wolf side |
| `deckzone-test.js` | 23 | deck-zone partition, hover/active/focus states |
| `type-test.js` | 23 | one typographic voice across field, placeholder and buttons |
| `reveal-test.js` | 22 | Seer and Fox share one private reveal; no answer leaks to the step |
| `house-test.js` | 20 | house-rule tri-state, defaults, overrides surviving a ruleset switch |
| `spacing-test.js` | 20 | every write target has a spacing mechanism |
| `bar-test.js` | 18 | bottom bar fills its row; backdrop opacity above the buttons |
| `fox-test.js` | 18 | Fox ordering, and *why* moving him is safe |
| `vote-test.js` | 18 | over-half threshold, weighted badge, parity precedence |
| `callorder-test.js` | 17 | deck zone matches `ord()`, the real night script |
| `heading-test.js` | 17 | heading separation computed from the CSS tokens |
| `icon-test.js` | 17 | Nerd Font code points, fallbacks, every class has a rule |
| `target-test.js` | 16 | legal target pools per role |
| `ruleset-test.js` | 14 | no ruleset-owned card leaks into the wrong ruleset |
| `scale-test.js` | 37 | one type scale, three radii, three surfaces, the alert budget |
| `lang-test.js` | 36 | interface language separate from ruleset; the teaching layer |
| `reach-test.js` | 29 | safe-area insets, 44px touch targets, the haptic channel |
| `motion-test.js` | 22 | phase and sheet motion, reduced-motion, ambient progress |
| `tips-test.js` | 14 | the teaching predicate, **executed** at 0/1/2/10 games |
| `shuffle-test.js` | — | **57,000 shuffles**, asserting every deck is legal |

**894 assertions plus 57,000 generated decks.**

### Tests worth keeping

Several exist specifically because a naive check let a bug through:

- **`spacing-test.js`** *discovers* every element the code writes into, then asserts
  each has a spacing mechanism. That is what makes it catch the *next* container.
- **`icon-test.js`** asserts **every class used in markup has a matching CSS rule** —
  would have caught B-09 immediately.
- **`heading-test.js`** reads `--s3` / `--s5` out of the stylesheet and *computes*
  both separations. I got B-21 wrong twice by eye.
- **`callorder-test.js`** compares the deck zone against `ord()` itself, so the
  preview cannot drift from the engine.
- **`collapse-test.js`** asserts containers appear **exactly once** — moving code
  between `appendChild` calls is how B-06 happened.
- **`tally-test.js`** asserts `oninput` does **not** call `render()`. That failure
  mode makes the feature unusable but looks fine in code review.
- **`scale-test.js`** *resolves the cascade* rather than checking that two rules exist.
  It computes selector specificity for every `.group`-scoped rule that touches a border,
  works out which one wins on a non-first row, and reads the width it leaves. Both rules
  being present is what B-65 looked like from the diff; only the winner matters.
- **`tips-test.js`** **runs** `teaching()` and `collapsible()` at 0, 1, 2 and 10 games
  instead of grepping for the expression. The invariant is the answer, not the source.

### Harness gotchas

- Mock players **need an `id`** — `pending.hunterId = undefined` reads as falsy and
  every shot silently "fails".
- Extract functions by **brace matching**, not regex. Escaping a signature through
  two layers of string quoting silently matches nothing.
- When a predicate changes, suites that *define their own copy* in the harness must be
  updated too, or they throw `X is not defined`.

---

## 9. Process rules

Earned the hard way. Each of these prevented or would have prevented a real bug.

1. **Assert every text substitution.** Editing with `replace()` and no assertion means
   a missed target silently does nothing, and you move on believing it worked. Two
   duplicate icon systems (B-24) accumulated exactly this way. Every patch now fails
   loudly instead.

2. **Never trust a grep taken before the edit.** B-09 verified against a stale read
   and passed while the app was broken.

3. **Verify the app before "fixing" it.** Eleven `reveal-test` failures were entirely
   my harness. Checking the app directly first stopped me editing working code.

4. **When a test goes red after an intentional change, ask which is wrong.** Several
   assertions encoded the *old* invariant — `"only the Seer moves"` before the Fox
   moved with her; `"the first heading has no gap"` before that was corrected. Update
   the assertion to the new invariant; do not delete it.

5. **A dead option is worse than no option.** `wide:true` was silently ignored by my
   first bar rewrite. An option that looks meaningful but does nothing misleads later.

6. **Prefer structure to enumeration.** Three spacing bugs came from a hand-maintained
   id list. One `.stack` class ended the class of bug.

7. **Reason about neutrality before moving a rule.** Moving the Fox is safe *because*
   wolf membership cannot change mid-night — the Hound settles at 30, deaths resolve at
   dawn. That argument is now itself under test.

8. **Watch out for the reframe.** If you find yourself deciding what a predicate
   "basically means" (`allKnown` ≈ "can I answer"), that is the signal to write down
   the actual question instead.

9. **A function documented as read-only must not write.** `computeDawn` produced the
   dawn *and* spent the Elder's life, one line inside the branch that composed the
   sentence explaining it — outside the snapshot Undo returns to, and before a
   moderator adjustment that could contradict it (B-38). Compute records the intent;
   the commit step spends it. This is the class the interrupt queue already exists for.

10. **A gap list is only honest if every path writes to it.** `noteSkip` had one caller
    out of five (B-36). A missing entry in a gap list is indistinguishable from no gap,
    so the failure is silent *and* reads as a positive assurance. Route through one
    helper and assert structurally that nothing bypasses it.

11. **A rule must never be decided by prose.** `/poison/.test(cause)` and a list of
    English phrases (B-40, B-33). Both would have switched off silently under a copy
    edit or a translation, in an app that is bilingual by design. Match on a code and
    derive the sentence from it.

12. **A temporary state needs the moment it expires, not just the moment it is set.**
    The Scapegoat's decree was cleared by one button on the screen that created it, so
    every path that did not pass through that button left it applied forever (B-37).
    Store what it applies *to* — the day, the night — and let the reader ignore a stale
    one. `G.lastGuard` already did this correctly.

13. **Measure the fix, do not read it.** A `if (h === value) return` guard looked like it
    ended a double write and ended nothing, because the three calls per render really do
    see three different heights (B-43); the replacement then never ran at all in a hidden
    tab (B-44). Both were found by instrumenting the element in a browser. Half of the
    delivery-and-paint bugs in this catalogue were invisible in the diff.

14. **Half a fix can be worse than none.** Opening the dawn editor once instead of every
    render left no way to close it, because the close control only existed in the other
    branch (B-51). Moving the reveal's Done button exposed a column that resized with its
    own content (B-52). Look at the screen after changing it.

15. **Ask which predicate licenses the answer.** Not "does this handle an unknown card"
    but "what has been established, and by what". `wolfSideKnown()` is the sharpest tool
    in the file for exactly that reason, and B-53 was a site that should have been asking
    it and was not. Where a resolution depends on a guard, declare it *below* the guard so
    the dependency cannot be moved by accident.

16. **A fix that establishes a new source of truth must sweep every writer.** B-35 made
    `G.counts` the record of what is in play. The Thief mutates a role without touching
    it, so the same disappearing-card bug walked straight back in through the one path
    nobody re-read (B-55). When you promote a field to authoritative, grep every write to
    the thing it now governs.

17. **Mutation-test the wiring, not just the helper.** The Thief tests all called
    `thiefTakes()` directly and passed with the call site removed. A test that exercises
    a function proves the function; only a test that reads the call site proves it runs.

18. **Implementing a rule is not implementing the sentence that states it.** "Every
    villager loses their power" was built as one condition in the night-call loop, which
    is only the powers that happen to wake (B-57). Enumerate what the rule actually
    reaches — here, seven cards with six different trigger points — and gate them through
    one predicate, so the eighth cannot be added without meeting it.

19. **A rule the moderator cannot see is not implemented.** B-57 and B-58 came from one
    table, one after the other, and neither was a logic error by the second report: the
    powers really were gone. What the screen showed was a role name and an instruction to
    act. When a state changes what somebody should DO with the next sentence they read,
    it belongs above that sentence, not below it.

20. **A type selector inside a component reaches further than it looks.** `.expBody p`
    is a class plus a type, so it silently outranks any single-class rule the nested
    content brings with it (B-59). Scope structural spacing with `>` when a container
    can hold both prose and components, or the component's own tokens lose a fight
    nobody knew was on.

21. **A test whose discovery is a proximity heuristic stops being a test.** The spacing
    suite found its subjects by requiring an `appendChild` within 80 characters of the
    container lookup. Adding a comment between the two silently dropped a container from
    the checked set — no failure, just less coverage (B-61). Follow the variable, not the
    character distance. Widening it immediately surfaced two containers that had never
    been checked at all, one of them mine.

22. **A mutation that leaves the identifier in place beats a test that greps for it.**
    `if (on.length) …revealNote(…)` mutated to `if (false)` still contains the string
    `revealNote`, so two tests passed against a disabled call. Assert the guard, and keep
    a blanket check that no branch is switched off with a literal.

23. **Count the routes, not the occurrences.** A test asserting `G.nightShotTaken = true`
    appears in a function passed while a mutation deleted the one that mattered, because a
    second copy in an escape hatch still matched (B-64). When several branches must all do
    something, assert the branch count and the action count together.

24. **A "how" question is a documentation bug in the UI.** Two of the last three reports
    were not wrong logic — the rule fired correctly and the screen simply never said what
    the moderator was supposed to do with it (B-58, B-62). A rule the moderator cannot
    carry out is not implemented either.

25. **Two rules can both be right and still not compose.** `.group > * + *` declares the
    hairline; `.group > .p { border: 0 }` removes the row's own edge. Both are correct in
    isolation and the diff reads as finished, but the second is two classes and the first
    is one, so the separator never drew (B-65). Whenever a fix is "declare X, then reset
    Y", the question is not whether both rules exist — it is which one wins, and CSS
    answers that with specificity before it ever looks at source order.

26. **A test that checks two rules exist is not testing the rule they make together.**
    The first version of `scale-test` asserted the separator and the reset were both
    present, and passed against the broken build. A mutation that reintroduced the exact
    shipped bug survived it. It now computes specificity and resolves the winner, which is
    the only form of the check that could have failed.

27. **One flag answering two questions will eventually answer one of them wrongly.**
    `G.rules` meant "which call order" and "which language" (B-66). Nothing was broken
    while every Vietnamese table used the Vietnamese order — the two questions happened to
    have the same answer. The bug is latent from the moment the flag is overloaded, and it
    surfaces the first time somebody wants one without the other.

28. **Teaching copy goes stale in silence.** A tip nobody re-reads cannot report that it
    is wrong, so it keeps confidently naming an affordance that moved (B-67). The volume
    is what makes it undetectable: at six essays per screen nobody proofreads, and the one
    stale line is indistinguishable from the rest. Retiring the layer after a couple of
    games is a correctness measure as much as a density one.

29. **Two findings in the same release can combine into a third.** A 44px floor needed
    `display:inline-flex`; a haptics control needed the `hidden` attribute. Each was
    correct, tested, and shipped in the same version — and together they produced an empty
    bordered box on every iPhone (B-68). Neither suite could have caught it, because
    neither was wrong. When a release changes both a component's display and how something
    is hidden, the interaction is the thing to check.

30. **Ask which lifetime a piece of state has, not just where it is convenient.** `G.lang`
    and `G.tips` went into the game object because a reload was the failure being fixed
    (B-69). A reload is rare; a new game is the common case, and it threw them away. The
    tell was already in the file: `gamesPlayed` had been given its own key for exactly this
    reason, so the automatic guess outlived a game while the manual override did not.

31. **Removing redundancy can remove a fallback.** Bilingual labels were noisy and the
    review was right to cut them — but the noise was also insurance: a moderator could
    always read one of the two. One language plus twenty untranslated blocks is worse than
    the redundancy it replaced, and worse specifically for the users the new default aims
    at (B-70). When a change makes something the *only* path, check that the path is
    complete before shipping the deletion.

32. **A cascade tie is decided by source order, and source order is not a design.** Two
    single-class rules for the same property leave the winner to whichever was written
    later — which is how the `.group` hairlines never drew (B-65) and how `.stack`'s
    margin reset had been losing since the day it was written (B-71). Both looked correct
    in the diff. If a rule exists to *override* another, give it more specificity, not a
    later line.

33. **A test that mirrors the code it tests will agree with a bug forever.** `vote-test.js`
    restated the day-vote condition in a local `verdict()` — "mirrors the app", said the
    comment — and asserted *"a plurality below half does not carry"* as an invariant. Both
    the app and the suite were wrong in the same way, so thirty suites stayed green while
    the app refused legitimate hangings (B-72). It now lifts the real expression out of
    `rDay` and throws if it cannot find it. This is the same lesson as rule 17, arriving
    somewhere new: proving a copy proves nothing.

34. **Check the rulebook before hardening a rule.** The majority threshold was not a
    misread of the code; it was invented, defended by arithmetic, given a threshold
    readout in the bar and pinned by a suite. Everything downstream was careful and the
    premise was never checked. When a rule is *this* load-bearing — every day phase of
    every game — the cheap step is reading the box.

---

## 10. Open questions and future work

### Known limitations

- **MH + discover-at-night + night one** still requires lifting a card for the Fox and
  Seer. Unavoidable without changing the published French order. Mitigated by the
  physical masking guide (rain sounds, touch several cards, walk the full circle).
- **The Actor** is tracked but its three face-up cards are not modelled individually.
- **The Devoted Servant** taking a dead player's role is recorded manually via the
  roster, not as a night step.
- **No `every` value** for Thief, Cupid, Judge, Hound, Wild Child, Hunter, Elder,
  Knight, Bear Tamer, Angel, Idiot, Scapegoat, Servant — correct (they act once or
  passively), but check this if adding a variant that wakes them again.

### Worth considering

- **Per-player role reveal.** The one feature that genuinely needs a server: room
  code, shared state, each player sees their own card on their own phone. **Start a
  new project.** This app's design assumes one trusted device; retrofitting would
  compromise every privacy decision in it.
- **Timer per day phase**, for tables that want enforced discussion limits.
- **A post-game chronicle export** — the log is already there, needs a share sheet.
- **More expansion boxes** (New Moon, Characters 2). The `set` field is ready; the
  Classic/Characters scope UI would need a third option.
- **Seat rotation between games.** Seating matters for the Bear Tamer, Fox and Knight,
  and "same table, new game" currently preserves order.

### If you add a role

1. Add to `ROLES` with `id`, `ic`, `name`, `vi`, `team`, `set`, `n1`/`every`, `max`,
   `d`, `say`, `sayVi` — and `only` if a ruleset does not have it.
2. Pick unused `n1`/`every` values in the gaps; do not renumber.
3. Add to `SHUF` with `[weight, minTableSize]` if it should appear in shuffled decks.
4. Add to `EXCL` if it conflicts with an existing card.
5. If it can join the wolf side, **extend `wolfSideKnown()`** — this is the easiest
   thing to miss and it silently corrupts the Fox, the Bear Tamer, the Knight and the
   win condition all at once.
6. If it targets players, add a case to `targetPool()` and `targetNote()`.
7. If it dies specially or interrupts the flow, extend `registerDeaths()`.
8. Run every suite. `mh-test.js` and `wolfknown-test.js` are the ones that will catch
   an incomplete integration.
