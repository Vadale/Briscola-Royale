# Fase 2 — Data Layer (`game/data.js`)

Questo documento è il **contratto** del data layer del gioco. Ogni modulo successivo (cards.js, game.js, shop.js, ecc.) leggerà queste strutture da `window.*` e dovrà rispettarne forma e semantica.

> **Regola d'oro:** ogni magic number, ogni stringa di gameplay, ogni regola, ogni dato persistente vive in `data.js`. Mai inline nel resto del codice.

---

## 1. Costanti esposte su `window`

| Nome | Tipo | Cosa contiene |
|------|------|---------------|
| `BALANCE` | object | Tutti i magic numbers (target, chip, combo, economia, lootbox, slot) |
| `DECK_NAPOLI` | array | 40 carte napoletane con id deterministico |
| `BOSSES` | array | 18 boss con regola, dialoghi, difficoltà, ante minimo |
| `JOKERS` | array | 25 joker con `effectCode` stringa |
| `TAROTS` | array | 10 tarocchi consumabili con `effectCode` stringa |
| `SMORFIA` | object | 90 voci della Smorfia napoletana (1..90) |
| `SLOT_SYMBOLS` | array | 7 simboli slot machine con `weight` |
| `PREDICTIONS` | object | Frasi del Mago (generic + 12 segni + victory) |
| `ZODIAC_BONUSES` | object | 12 segni con `desc` + `apply(state)` |
| `STRINGS` | object | i18n base (`it`) + flavor (Gennarino, win/lose phrases) |

---

## 2. Schema dettagliato

### 2.1 `BALANCE`

```js
{
  anteTargets: [[small, big, boss], …]  // 8 array di 3 numeri
  handsPerBlind: 4,
  discardsPerBlind: 3,
  handSize: 5,
  maxJokerSlots: 5,
  cardChips: { 1:11, 3:10, re:4, cavallo:3, fante:2, 7:0, 6:0, 5:0, 4:0, 2:0 },
  combos: { single|coppia|tris|poker|napoletana|carico|primiera|scopa: [chipsBonus, multBase] },
  settebelloBonus: 50,
  briscolaPerCard: 5,
  blindMoney: [3, 4, 5],          // small, big, boss
  handSavedBonus: 1,
  discardSavedBonus: 1,
  interestMax: 5,
  interestPer: 5,
  jokerCost: { common:4, uncommon:6, rare:8, legendary:20 },
  tarotCost: 3,
  packCost: { small:4, medium:6, large:8 },
  rerollBase: 5,
  lootbox: {
    iniziato: { cost, cards, common, uncommon, rare, legendary },
    adepto:   { … },
    maestro:  { … },
  },
  pityRare: 20,
  pityLegendary: 50,
  jokerDropRates: { common:0.70, uncommon:0.22, rare:0.07, legendary:0.01 },
  slotCost: 10,
  slotPayouts: { cherry3, lemon3, bell3, coin3, seven3, star3:0, diamond3:1000 },
  finalBossId: 'munaciello_oro',
}
```

### 2.2 `DECK_NAPOLI`

Array di 40 oggetti carta:

```js
{
  id:    'bastoni_1' | 'denari_re' | …,   // deterministico, unico
  seme:  'bastoni' | 'coppe' | 'denari' | 'spade',
  valore: 1..7 | 'fante' | 'cavallo' | 're',
  chips:  number  // dal BALANCE.cardChips
}
```

### 2.3 `BOSSES` (item)

```js
{
  id:         'pulcinella_nero',          // string id macchina
  name:       'Pulcinella Nero',          // visualizzato
  rule:       'no_discard',               // codice regola (vedi §6)
  ruleDesc:   '…',                        // ITALIANO STANDARD (gameplay critico)
  intro:      "…",                        // dialettale, flavor
  onLose:     "…",                        // dialettale, quando il boss vince
  onWin:      "…",                        // dialettale, quando il giocatore vince
  difficulty: 1..5,
  firstAnte:  1..8,
  portrait:   'pulcinella' | 'munaciello' | 'janara' | 'sangennaro' | 'pazzariello' | 'generic'
}
```

### 2.4 `JOKERS` (item)

```js
{
  id:          'cornicello',                                // unico
  name:        "'O Cornicello",
  emoji:       '🪬',
  rarity:      'common' | 'uncommon' | 'rare' | 'legendary',
  cost:        4 | 6 | 8 | 20,
  description: '…',                                          // user-facing
  trigger:     'on_hand_played' | 'on_card_scored',
  effectCode:  'ctx.chips += 30;',                           // STRINGA JS
  art:         { bg: '#hexcolor', icon: '🪬' }
}
```

### 2.5 `TAROTS` (item)

```js
{
  id:          'mago',
  name:        'Il Mago',
  emoji:       '🎩',
  description: '…',                       // user-facing
  effectCode:  '…'                        // STRINGA JS
}
```

### 2.6 `SLOT_SYMBOLS` (item)

```js
{ id: 'cherry', label: 'CILIEGIA', weight: 30 }
```

`weight` è proporzionale: somma irrilevante, è probabilità ponderata.

### 2.7 `PREDICTIONS`

```js
{
  generic: [12 stringhe],
  ariete | toro | gemelli | … | pesci: [2 stringhe ognuno],
  victory: [5 stringhe]
}
```

### 2.8 `ZODIAC_BONUSES`

```js
{
  ariete: {
    desc: 'descrizione italiana',
    apply: (state) => { … }       // FUNZIONE REALE, non stringa
  },
  …
}
```

> **Sicurezza:** `apply` è una funzione reale perché chiamata solo da codice trusted al run-start; mai eseguita da input utente o dati persistiti.

### 2.9 `STRINGS.it`

Chiavi UI di livello 1 (italiano standard) + array `gennarino` con 25 frasi flavor + `winPhrases` + `losePhrases` + chiavi tombola/slot/zodiaco.

---

## 3. Contratto `ctx` per `effectCode` joker

`effectCode` è una **stringa JS** eseguita da `game.js` con un wrapper sicuro:

```js
const fn = new Function('ctx', code);
fn(safeCtx);
```

`safeCtx` è un oggetto whitelistato che espone **solo** i campi sotto. **Niente DOM, niente window, niente fetch, niente eval, niente Math, niente Date.**

### 3.1 Campi disponibili sempre

| Campo | Tipo | Significato |
|-------|------|-------------|
| `ctx.chips` | number | Chips correnti (R/W) |
| `ctx.mult` | number | Mult corrente (R/W) |
| `ctx.money` | number | Ducati del giocatore (R/W) |
| `ctx.hand` | array | Carte in mano (read-only consigliato) |
| `ctx.played` | array | Carte giocate questa mano |
| `ctx.scored` | array | Carte che contribuiscono al punteggio |
| `ctx.ante` | number | Ante corrente (1..8) |
| `ctx.briscolaSeme` | string | Seme della briscola corrente |
| `ctx.jokerState` | object | Stato persistente per-joker (R/W) |
| `ctx.jokerCount` | number | Numero di joker posseduti |
| `ctx.handsPlayedThisRound` | number | Mani giocate (0 = prima mano) |
| `ctx.discardedThisRound` | number | Carte scartate in questo round |
| `ctx.random` | function | Sostituto deterministico di Math.random |

### 3.2 Campi per `trigger: 'on_card_scored'`

| Campo | Tipo | Significato |
|-------|------|-------------|
| `ctx.card` | object | Carta che sta venendo segnata: `{ id, seme, valore, chips }` |

### 3.3 Campi per `trigger: 'on_hand_played'`

| Campo | Tipo | Significato |
|-------|------|-------------|
| `ctx.combo` | string | Combinazione rilevata: `single` / `coppia` / `tris` / `poker` / `napoletana` / `carico` / `primiera` / `scopa` |

### 3.4 Vietato

- `Math.random()` → usa `ctx.random()`
- `Date.now()`, `new Date()` → usa `ctx.turnCount` o `ctx.handsPlayedThisRound`
- `window`, `document`, `globalThis`, `self`
- `localStorage`, `sessionStorage`, `indexedDB`
- `fetch`, `XMLHttpRequest`, `WebSocket`
- `eval`, `Function` constructor
- `import`, `require`

---

## 4. Contratto `ctx` per `effectCode` tarocchi

I tarocchi hanno tutti i campi base sopra, **più**:

| Campo | Tipo | Significato |
|-------|------|-------------|
| `ctx.deck` | array | Mazzo corrente (R/W) — può essere modificato |
| `ctx.handSize` | number | Dimensione mano (R/W) |
| `ctx.jokers` | array | Joker posseduti dal giocatore |
| `ctx.maxJokerSlots` | number | Slot joker max (R/W) |
| `ctx.nextJokerFree` | bool | Flag: prossimo joker gratis |
| `ctx.requestTransform` | function | `(n) => …` apre UI scelta carte da trasformare |
| `ctx.turnCount` | number | Contatore mani giocate run-wide (deterministico) |

> **Importante (id univoci):** se un tarocco crea o trasforma carte, `id` deve restare univoco. Pattern usato nei tarocchi `luna` e `giudizio`: counter locale `seen[base] = (seen[base] || 0) + 1` e suffisso `_2`, `_3`, … sui duplicati.

---

## 5. Come aggiungere un nuovo joker

Template completo:

```js
{
  id: 'nome_unico_macchina',           // snake_case, mai duplicato
  name: "'O Nome Visualizzato",         // dialettale ok
  emoji: '🎯',
  rarity: 'common',                    // common | uncommon | rare | legendary
  cost: 4,                              // deve coincidere con BALANCE.jokerCost[rarity]
  description: 'Descrizione breve in italiano (user-facing).',
  trigger: 'on_hand_played',           // o 'on_card_scored'
  effectCode: 'ctx.chips += 30;',       // STRINGA. Deve parsare con new Function('ctx', code).
  art: { bg: '#c1272d', icon: '🎯' },
}
```

**Checklist prima di mergeare:**

- [ ] `id` non collide con altri joker
- [ ] `cost` coerente con `BALANCE.jokerCost[rarity]`
- [ ] `effectCode` non usa `Math.random` (usa `ctx.random()`)
- [ ] `effectCode` non usa `Date`, `window`, `document`, `fetch`, `eval`
- [ ] `effectCode` parsa con `new Function('ctx', code)` senza errori sintattici
- [ ] Trigger correto: usa `on_card_scored` solo se hai bisogno di `ctx.card`
- [ ] `description` è user-facing in italiano standard
- [ ] Aggiornato il rapporto rarità se ti scosti da 10/8/5/2

---

## 6. Come aggiungere un nuovo boss

Template completo:

```js
{
  id: 'nome_macchina',
  name: 'Nome Visualizzato',
  rule: 'codice_regola',              // vedi codici sotto
  ruleDesc: 'Descrizione in italiano standard del vincolo.',  // gameplay critico
  intro: "Frase dialettale all'arrivo.",
  onLose: 'Frase dialettale se il boss vince.',
  onWin: 'Frase dialettale se il giocatore vince.',
  difficulty: 3,                       // 1 (facile) .. 5 (terrificante)
  firstAnte: 2,                        // ante minimo in cui può apparire
  portrait: 'generic',                 // 'pulcinella'|'munaciello'|'janara'|'sangennaro'|'pazzariello'|'generic'
}
```

**Checklist:**

- [ ] `id` univoco
- [ ] `rule` implementata (o pianificata) in `game.js`
- [ ] `ruleDesc` è in **italiano standard** (NON dialettale, è gameplay critico)
- [ ] `intro/onLose/onWin` possono essere dialettali (flavor)
- [ ] `firstAnte` ≥ 1 e ≤ 8
- [ ] `portrait` matcha un valore supportato da `SPRITES.bossFrame()`
- [ ] Se boss finale: `id === BALANCE.finalBossId` e `firstAnte === 8`

---

## 7. Lista completa dei 18 boss

| id | nome | rule | difficoltà | firstAnte |
|----|------|------|------------|-----------|
| `pulcinella_nero` | Pulcinella Nero | `no_discard` | 2 | 1 |
| `munaciello` | 'O Munaciello | `half_denari` | 2 | 1 |
| `janara` | 'A Janara | `less_hands` | 3 | 2 |
| `sangennaro_severo` | San Gennaro Severo | `no_figure_bonus` | 3 | 2 |
| `pazzariello` | 'O Pazzariello | `change_briscola` | 3 | 2 |
| `pinocchio_bugiardo` | Pinocchio Bugiardo | `half_chips` | 3 | 3 |
| `smorfia_in_persona` | 'A Smorfia in Persona | `only_numbers` | 4 | 3 |
| `lione_san_marco` | 'O Lione di San Marco | `less_hand_size` | 3 | 3 |
| `geppetto_ubriaco` | Mastro Geppetto Ubriaco | `random_transform` | 4 | 4 |
| `arlecchino` | Arlecchino Multiforme | `random_rule` | 5 | 5 |
| `mammasantissima` | Mammasantissima | `pay_per_hand` | 4 | 5 |
| `tarocco_nero` | 'O Tarocco Nero | `double_target` | 5 | 5 |
| `sirena_vesuvio` | Sirena d'o Vesuvio | `min_3_cards` | 4 | 4 |
| `don_chisciotte` | Don Chisciotte di Catania | `swap_hand_discard` | 4 | 6 |
| `befana_cattiva` | 'A Befana Cattiva | `half_chips` | 4 | 6 |
| `lupo_mannaro` | 'O Lupo Mannaro Lucano | `double_target` | 5 | 7 |
| `befana_roma` | Befana de Roma | `swap_hand_discard` | 4 | 6 |
| `munaciello_oro` | 'O Munaciello d'Oro (FINALE) | `double_target` | 5 | 8 |

### 7.1 Codici regola (`rule`) — da implementare in `game.js`

| codice | effetto |
|--------|---------|
| `no_discard` | Disabilita scarti per il round |
| `half_denari` | Carte di Denari valgono metà chip |
| `less_hands` | `handsPerBlind` ridotto (es. 4→3) |
| `no_figure_bonus` | Fante/Cavallo/Re danno 0 chip |
| `change_briscola` | Cambia briscola ad ogni mano giocata |
| `half_chips` | Tutti i chip dimezzati |
| `only_numbers` | Solo carte 1..7 danno chip |
| `less_hand_size` | `handSize` ridotto (5→4) |
| `random_transform` | Una carta a caso si trasforma ad ogni mano |
| `random_rule` | Sceglie una regola casuale tra le altre, cambia ogni mano |
| `pay_per_hand` | -10 ducati per ogni mano giocata |
| `double_target` | Target del round +50% (o ×2 per finale) |
| `min_3_cards` | Devi giocare almeno 3 carte |
| `swap_hand_discard` | `handsPerBlind` ↔ `discardsPerBlind` |

---

## 8. Lista completa dei 25 joker

### 8.1 Common (10) — costo 4

| id | descrizione breve | trigger |
|----|-------------------|---------|
| `cornicello` | +30 chips ogni mano | `on_hand_played` |
| `caffe_forte` | Prima mano del round chips ×3 | `on_hand_played` |
| `baba` | +50 chips se mano contiene un Re | `on_hand_played` |
| `sfogliatella` | +20 chips per Fante giocato | `on_hand_played` |
| `pizzaiolo` | +15 chips per Coppe giocata | `on_hand_played` |
| `tarallo` | +1 mult ogni mano | `on_hand_played` |
| `limoncello` | +25 chips se hai giocato esattamente 2 carte | `on_hand_played` |
| `sigaro_toscano` | +10 chips per Bastoni giocata | `on_hand_played` |
| `zampogna` | +12 chips per Cavallo giocato | `on_hand_played` |
| `amuleto_zia` | +1 mult se nella mano c'è un Asso | `on_hand_played` |

### 8.2 Uncommon (8) — costo 6

| id | descrizione breve | trigger |
|----|-------------------|---------|
| `pesce_oro` | Carte Denari chips ×2 | `on_card_scored` |
| `re_cafone` | I Re danno chips ×3 | `on_card_scored` |
| `smorfia_joker` | Carte 5/6/7 +20 chips ognuna | `on_card_scored` |
| `sfortuna` | +5 mult per ogni carta scartata nel round | `on_hand_played` |
| `munaciello_buono` | +3 ducati per ogni mano giocata | `on_hand_played` |
| `mano_nera` | Coppie mult ×4 (raddoppia il base) | `on_hand_played` |
| `sangue_napoli` | Solo carte rosse: +40 chips e +2 mult | `on_hand_played` |
| `briscola_cavalcata` | +8 chips per ogni carta del seme briscola | `on_card_scored` |

### 8.3 Rare (5) — costo 8

| id | descrizione breve | trigger |
|----|-------------------|---------|
| `diavolo` | +1 mult cumulativo ogni mano (reset boss) | `on_hand_played` |
| `tarantella` | +0.5 mult per joker posseduto | `on_hand_played` |
| `mago_alchimista` | Coppie e tris +50 chips bonus | `on_hand_played` |
| `campana_gennaro` | Figura di OGNI seme: chips ×2 | `on_hand_played` |
| `cuoppo_fritto` | 4+ carte: +80 chips e +3 mult | `on_hand_played` |

### 8.4 Legendary (2) — costo 20

| id | descrizione breve | trigger |
|----|-------------------|---------|
| `maradona_dieci` | Mult ×3 ogni mano + 100 chips se Napoletana | `on_hand_played` |
| `vesuvio_eruzione` | Ogni Asso: +50 chips e +1 mult cumulativo | `on_card_scored` |

---

## 9. Note sul bilanciamento

> **Non toccare i numeri inline nel resto del codice.** Se devi tarare il gioco, modifica solo `BALANCE` in `data.js`.

### 9.1 Curve target

`BALANCE.anteTargets` segue una scala approssimativa ×2 per ante:

| Ante | small | big | boss |
|------|-------|-----|------|
| 1 | 300 | 450 | 600 |
| 2 | 600 | 900 | 1200 |
| 3 | 1200 | 1800 | 2400 |
| 4 | 2500 | 3750 | 5000 |
| 5 | 5000 | 7500 | 10000 |
| 6 | 10000 | 15000 | 20000 |
| 7 | 20000 | 30000 | 40000 |
| 8 | 40000 | 60000 | 80000 |

Rapporto small:big:boss ≈ 1 : 1.5 : 2.

### 9.2 Economia

- `blindMoney = [3, 4, 5]`: paghi più per i blind più tosti
- `interestPer = 5`, `interestMax = 5`: ogni 5 ducati in tasca = +1 a fine blind, max +5
- `rerollBase = 5`: raddoppia ad ogni reroll nello stesso shop
- `jokerCost`: rispetta la curva per rarità — modifica `BALANCE.jokerCost` E i singoli `cost` dei joker insieme

### 9.3 Lootbox e pity

- 3 tier (`iniziato 50`, `adepto 120`, `maestro 300`) con drop rate crescente
- `pityRare = 20`: dopo 20 aperture senza un rare+, garanzia rare al 21°
- `pityLegendary = 50`: dopo 50 senza legendary, garanzia legendary al 51°

### 9.4 Slot machine

- `slotCost = 10` per giro
- `slotPayouts` valori non simmetrici (cherry3=5, diamond3=1000): payout atteso < cost (è una slot, non un investimento)
- `star3 = 0` è uno special: invece dei ducati dà una lootbox gratis (gestito in `game.js`)

### 9.5 Combo

`combos[name] = [chipsBonus, multBase]`. Modificare con cautela: la napoletana (chips +50, mult ×8) e la scopa (chips +60, mult ×10) sono i combo più forti per design.

### 9.6 Quando aggiornare `BALANCE`

Aggiorna `BALANCE` (e SOLO `BALANCE`) quando:
- aggiungi un nuovo tipo di blind o ante
- modifichi i prezzi del negozio
- ribilanci le drop rate
- aggiungi/modifichi una combo o un bonus globale (settebello, briscola)

**Mai** aggiungere magic number inline in `cards.js`, `game.js`, `shop.js`. Se ti serve un nuovo numero parametrico → entra in `BALANCE`.

---

## 10. Esposizione globale

Tutto è esposto su `window` alla fine di `data.js`:

```js
window.BALANCE = BALANCE;
window.DECK_NAPOLI = DECK_NAPOLI;
window.BOSSES = BOSSES;
window.JOKERS = JOKERS;
window.TAROTS = TAROTS;
window.SMORFIA = SMORFIA;
window.SLOT_SYMBOLS = SLOT_SYMBOLS;
window.PREDICTIONS = PREDICTIONS;
window.ZODIAC_BONUSES = ZODIAC_BONUSES;
window.STRINGS = STRINGS;
```

I moduli successivi possono leggere queste globali (con `typeof X !== 'undefined'` per safety). Niente import, niente require — è il pattern del progetto.
