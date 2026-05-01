# BRISCOLA ROYALE — Gameplay Loop Design

> Documento di riferimento per l'agente `/gameplay-designer`.
> Aggiornare ogni volta che si modifica il bilanciamento o la struttura del loop.

---

## Il Loop Fondamentale (Dopamine Engine)

Il gioco deve produrre una scarica di dopamina ogni **15-30 secondi**. Tre livelli di loop:

```
MICRO (10-30s): Seleziona carte → Gioca mano → Numeri esplodono → Punteggio sale
MESO  (3-5min): Vinci blind → Negozio → Scegli joker → Costruisci build
MACRO (20-40min): Run completa (Ante 1-8) → Vittoria/Sconfitta → Rigioca
```

**La regola d'oro**: il giocatore deve sempre avere davanti a sé UNA decisione interessante. Mai aspettare. Mai essere perso.

---

## Scoring Formula

```
score = (chips_base + Σ chip_per_carta + bonus_combo) × mult_totale

chips_base:     valore fisso della combinazione rilevata
chip_per_carta: ogni carta giocata aggiunge i suoi chip individuali
mult_totale:    parte da 1, moltiplicato dai joker e dalla combo
```

### Chip per carta (valori napoletani)
| Carta | Chip |
|-------|------|
| Asso (1) | 11 |
| Tre (3) | 10 |
| Re | 4 |
| Cavallo | 3 |
| Fante | 2 |
| 7, 6, 5, 4, 2 | 0 |

### Combinazioni e moltiplicatori
| Combinazione | Chip bonus | Mult |
|-------------|-----------|------|
| Carta singola | 0 | ×1 |
| Coppia | +10 | ×2 |
| Tris | +20 | ×3 |
| Poker | +30 | ×7 |
| Napoletana (A+2+3 stesso seme) | +50 | ×8 |
| Carico (3 figure stesso seme) | +25 | ×4 |
| Primiera (1 carta per ogni seme) | +40 | ×5 |
| Scopa (5 stesso seme) | +60 | ×10 |
| Settebello (7 di Denari) | +50 bonus flat | — |
| Briscola di seme | +5 per carta del seme briscola | — |

### Ordine di applicazione joker
1. Trigger `passive` (all'inizio del calcolo)
2. Trigger `on_card_scored` (per ogni carta, da sinistra a destra)
3. Trigger `on_hand_played` (dopo il calcolo combo)
4. Aggiornamento UI con animazione chip+mult

---

## Struttura Run

```
Ante 1 → [Small Blind] → [Big Blind] → [Boss Blind] → Negozio
Ante 2 → [Small Blind] → [Big Blind] → [Boss Blind] → Negozio
...
Ante 8 → [Small] → [Big] → [Munaciello d'Oro] → VITTORIA
```

### Target score per ante
| Ante | Small | Big | Boss |
|------|-------|-----|------|
| 1 | 300 | 450 | 600 |
| 2 | 600 | 900 | 1.200 |
| 3 | 1.200 | 1.800 | 2.400 |
| 4 | 2.500 | 3.750 | 5.000 |
| 5 | 5.000 | 7.500 | 10.000 |
| 6 | 10.000 | 15.000 | 20.000 |
| 7 | 20.000 | 30.000 | 40.000 |
| 8 | 40.000 | 60.000 | 80.000 |

### Risorse per blind
- **Mani**: 4 (modificabile da joker/boss)
- **Scarti**: 3 (modificabile da joker/boss)
- **Mano**: 5 carte (modificabile)

---

## Curva di Difficoltà

### Win rate target
| Fase | Target |
|------|--------|
| Ante 1-3 | 90% dei giocatori passa |
| Ante 4-5 | 60% |
| Ante 6-7 | 30% |
| Ante 8 Boss | 10-15% |

### Come modulare la difficoltà senza frustrare
- **Ante 1-2**: joker facili da capire (flat +chips), boss con regola semplice
- **Ante 3-4**: joker condizionali (se hai X, ottieni Y), boss che richiedono adattamento
- **Ante 5-6**: joker sinergici (combo tra joker), boss che negano strategie forti
- **Ante 7-8**: counter-play obbligatorio, build specializzata necessaria

### Safety net anti-frustrazione
- Se il giocatore perde 3 run consecutive su Ante 1 → mostrare hint "Suggerimento di Gennarino"
- Boss Ante 8 (Munaciello d'Oro) ha sempre target ×2 + UNA regola random tra le top-3 più dure (non tutte insieme)

---

## Contratto `calculateScore` → `game.js`

Questa sezione definisce i valori che `game.js` deve passare in `modifiers` a `calculateScore`.

### `handsPlayedThisRound`
**Valore atteso: numero di mani GIÀ GIOCATE prima di quella corrente.**
- Prima mano del round → `handsPlayedThisRound = 0`
- Seconda mano → `handsPlayedThisRound = 1`
- Terza mano → `handsPlayedThisRound = 2`
- Quarta mano → `handsPlayedThisRound = 3`

Il joker `caffe_forte` usa `=== 0` per rilevare la prima mano. Se game.js incrementa PRIMA di chiamare calculateScore, il joker non si attiva mai. **Incrementare DOPO la chiamata.**

### `jokerIds`
`game.js` deve aggiungere al ctx (prima di chiamare `applyJokerEffect`) il campo:
```js
ctx.jokerIds = jokers.map(j => j.id);
```
Questo permette ai joker sinergici (es. `pizza_fritta`) di verificare la presenza di altri joker senza accedere a `window`.

### Trigger fuori da `calculateScore`
Questi trigger vengono chiamati direttamente da `game.js`, NON dentro `calculateScore`:

| Trigger | Quando chiamarlo | ctx aggiuntivo |
|---------|-----------------|----------------|
| `on_discard` | Dopo che il giocatore scarta 1+ carte | `ctx.discardedCard` = ultima carta scartata |
| `on_round_start` | Prima di distribuire le carte all'inizio del round | `ctx.roundChipsBonus` (R/W), `ctx.roundMultBonus` (R/W) |

I valori `roundChipsBonus` e `roundMultBonus` devono essere aggiunti alle variabili del round e applicati al primo calcolo della mano (o a tutti, deciso dal design). Suggerimento: applicarli ad ogni mano del round come bonus flat iniziale.

### Flag `hasSattebello`
Dopo il calcolo score, `calculateScore` imposta `ctx.hasSattebello = true` se il 7 di Denari è nelle carte giocate. `game.js` può leggere `result.hasSattebello` per triggerare animazioni speciali o logica futura (joker tematici). **Nota:** questo flag è già nel breakdown come `type: 'settebello'` — verificare con `result.breakdown.some(b => b.type === 'settebello')`.

---

## Juice (Il Segreto di Balatro)

Ogni azione deve avere **feedback visivo immediato** che scala con l'intensità:

### Animazione chip counter
```
Score piccolo (< 500):   numeri +X che volano via, colore bianco
Score medio (500-5000):  numeri dorati, leggermente più grandi
Score alto (5000-20000): numeri esplosivi, effetto zoom, screen shake lieve
Score epico (> 20000):   tutto esplode, Gennarino shocked, screen shake forte
```

### Timing animazioni (NON bloccare input)
- Flip carta: 150ms CSS
- Chip counter: 800ms (può essere skippato con click)
- Transizione schermata: 300ms fade
- Boss intro: 1.5s (può essere skippata con qualsiasi tasto)

### "The Tell" — ogni joker deve avere un momento visivo
Quando un joker si attiva: il joker nella sidebar "lampeggia" (pulse 200ms), poi il numero sale. Il giocatore deve vedere QUALI joker stanno contribuendo e QUANTO.

---

## Build Archetypes (almeno 5 percorsi vincenti diversi)

Il gioco è rigiocabile se esistono build molto diverse tra loro:

1. **Build Coppia** — punta su coppie e tris, joker che moltiplicano coppie
2. **Build Napoletana** — costruisce il mazzo attorno a Asso/2/3 dello stesso seme
3. **Build Figure** — solo Re/Cavallo/Fante, chip altissimi per carta
4. **Build Scopa** — 5 carte stesso seme, moltiplicatore ×10, all-in
5. **Build Briscola Pura** — massimizza il seme briscola, +mult ogni carta briscola

Ogni build deve essere **fattibile da Ante 1** con le scelte giuste al negozio.

---

## Negozio — Design Economico

### Economia per blind
```
Vincita base:        3 ducati (small), 4 (big), 5 (boss)
Bonus mani salvate:  +1 ducato per mano non usata
Bonus scarti salvati:+1 ducato per scarto non usato
Interesse:          +1 ducato ogni 5 in tasca (max +5)
```

### Prezzi negozio
| Item | Prezzo |
|------|--------|
| Joker common | 4💰 |
| Joker uncommon | 6💰 |
| Joker rare | 8💰 |
| Joker legendary | 20💰 |
| Tarocco | 3💰 |
| Pacchetto (2 carte) | 4💰 |
| Reroll | 5💰 (raddoppia a ogni reroll) |

### Economia totale
- Senza spendere mai → ~60-80💰 all'Ante 8
- Spendendo ottimizzato → ~0-10💰 ma build forte
- Senza negozio non si vince oltre Ante 5

---

## Interazione Boss × Joker

Quando una regola boss modifica i chip o i moltiplicatori, l'ordine di applicazione è:
1. La regola boss modifica il `ctx` PRIMA che i joker vengano chiamati (joker passive → on_card_scored → on_hand_played).
2. I joker vedono il ctx già modificato dal boss e operano sopra di esso.

**Esempio**: boss `half_chips` + joker `cornicello` (+30 chips on_hand_played):
- combo napoletana base: chips = 71 (50+21)
- boss half_chips: chips = 35 (arrotondato verso il basso)
- joker cornicello: chips = 65 (35+30)
- score = 65 × 8 = 520 (invece di 568 senza boss)

**Nota**: il joker `maradona_dieci` usa `ctx.mult *= 3`. Con boss `double_target`, il target è ×2 ma i joker rimangono attivi. Questo è intenzionale: i joker devono essere la risposta ai boss, non venire neutralizzati.

### Regola `double_target` — due comportamenti
- **Boss normali** (es. `tarocco_nero`, `lupo_mannaro`): target × `BALANCE.bossHalfTargetMult` (1.5 = +50%)
- **Boss finale Ante 8** (`munaciello_oro`): target × `BALANCE.bossFinalTargetMult` (2.0 = ×2) + UNA regola random tra le top-3 più dure (`less_hands`, `half_chips`, `no_discard`)

Game.js deve distinguere: `if (boss.id === BALANCE.finalBossId)` usa `bossFinalTargetMult`, altrimenti `bossHalfTargetMult`.

### Regola `invert_combo_mult` (Befana de Roma)
I moltiplicatori della combo vengono invertiti prima del calcolo. Ordine di inversione:
```
single:     ×1  → ×10
coppia:     ×2  → ×8 (o precedente)
tris:       ×3  → ×7
poker:      ×7  → ×3
napoletana: ×8  → ×2
carico:     ×4  → ×5 (Primiera)
primiera:   ×5  → ×4 (Carico)
scopa:      ×10 → ×1
```
Strategia: con questo boss, giocare carte singole o coppie è ottimale. I joker legati alla scopa (`cuoppo_fritto` con 4+ carte) diventano controproducenti.

### Regola `no_asso_chips` (Pinocchio Bugiardo)
L'Asso non contribuisce chip individuali (chip_per_carta = 0 per valore 1). Il bonus combo della napoletana rimane intatto. Strategia: evitare Assi, puntare su tris di 3 o carico di figure.

---

## Boss Design Principles

Ogni boss deve:
1. **Annunciare la sua regola chiaramente** (popup con testo in italiano standard, poi flavor dialettale)
2. **Essere contrastabile** — il giocatore deve poter adattare la strategia
3. **Avere personalità** — 3 frasi: entrata, quando perdi mano, quando lo batti
4. **Scalare in difficoltà** — i boss degli Ante alti devono sembrare "ingiusti" al primo incontro, poi ovvi al secondo

### Checklist per ogni boss
- [ ] La regola è scritta in italiano standard
- [ ] Esiste almeno un joker/strategia che lo contrasta
- [ ] Non compare due volte nella stessa run (tranne Munaciello d'Oro all'Ante 8)
- [ ] Ha un ritratto SVG o frame dedicato

---

## Analisi Curva Difficoltà (scoring senza joker)

| Ante | Target Small | Score max 4 mani Napoletana | Score max 4 mani Scopa | Joker necessari? |
|------|-------------|----------------------------|------------------------|-----------------|
| 1 | 300 | 2.272 | 3.600 | No |
| 2 | 600 | 2.272 | 3.600 | No |
| 3 | 1.200 | 2.272 | 3.600 | Margine stretto |
| 4 | 2.500 | 2.272 | 3.600 | Sì (almeno 1) |
| 5 | 5.000 | 2.272 | 3.600 | Sì (build attiva) |
| 6 | 10.000 | — | — | Sì (sinergie) |
| 7 | 20.000 | — | — | Sì (build ottimizzata) |
| 8 | 40.000 | — | — | Sì (legendary + sinergie) |

**Note calcolo:** Napoletana: (50+11+0+10) × 8 = 568 × 4 = 2.272. Scopa best case (A+3+Re+Cav+Fante): (60+30) × 10 = 900 × 4 = 3.600.

**Ante 4** è lo spartiacque: senza joker non si arriva al target Small (2.500 > 3.600 max... no: 3.600 > 2.500). Ante 4 Small è ancora raggiungibile con Scopa pura. **Ante 5** (5.000 > 3.600) è il vero spartiacque. Il design è corretto.

---

## Metriche di Qualità Gameplay

Testa con 5 utenti e misura:

| Metrica | Target | Come misurare |
|---------|--------|---------------|
| Time to first "wow" | < 30s | Quando dicono "fico" la prima volta |
| Comprensione scoring | > 60% dopo 3 mani | "Perché hai fatto quel punteggio?" |
| Retry rate dopo sconfitta | > 50% | Cliccano RIGIOCA senza uscire |
| Run completion (almeno Ante 3) | > 70% | Arrivano al primo boss reale |
| Screenshot spontaneo | > 2 per sessione | Indicatore di "momento condivisibile" |

---

## Loop Dopaminergico — Mappa di Soddisfazione per Blind

Ogni blind dura ~3-5 minuti. Momenti di soddisfazione attesi ogni 15-30 secondi:

```
0:00 — INIZIO BLIND: distribuzione carte (animazione deal, suoni)
0:15 — Selezione prima carta: click + highlight (feedback immediato)
0:25 — Rilevazione combo: combo detector mostra "NAPOLETANA!" con effetto
0:35 — GIOCO MANO 1: chips che volano, moltiplicatore che sale (PICCO DOPAMINA)
1:00 — Eventuale scarto: carte che spariscono + nuove carte (feedback + anticipazione)
1:30 — GIOCO MANO 2: accumulo score visibile (counter animato)
2:00 — Joker lampeggia: "ha contribuito!" (micro-soddisfazione)
2:30 — GIOCO MANO 3: avvicinamento al target (barra che si riempie)
3:00 — Target raggiunto / non raggiunto: BOOM o brivido
3:10 — Recap blind: ducati guadagnati (numero che sale)
3:20 — NEGOZIO: scelta joker (micro-decisione con peso)
```

**Buchi da evitare**:
- Non mostrare mai "niente succede" per più di 10 secondi → Gennarino commenta l'inattività (idle >5s)
- La prima mano del run deve produrre UN numero grande, anche se il giocatore sbaglia combo → il Caffè Forte (×3) e il Cornicello (+30 chips) sono lì per questo

---

## Anti-Pattern Gameplay da Evitare

| ❌ Problema | ✅ Soluzione |
|------------|-------------|
| Mano forzata senza scelta | Sempre almeno 2 opzioni valide |
| Punteggio incomprensibile | Breakdown visivo chips × mult sempre visibile |
| Boss impossibile senza joker specifico | Boss contrasta UNA strategia, non tutte |
| Negozio con niente di utile | Pity timer: dopo 3 negozi con soli common → garantito uncommon |
| Animazioni che bloccano il gioco | Sempre Skip con click/spazio |
| Primo run confuso | Prima mano: Gennarino mostra combo disponibili |

---

## Roadmap Gameplay

### MVP (ora)
- Loop base: deal → select → play/discard → score → win/lose blind
- 5 boss, 10 joker, formula scoring completa
- Negozio con reroll, 3 slot joker

### v0.2
- 28 joker con sinergie
- 18 boss con dialoghi
- Tarocchi consumabili
- Animazioni juice complete

### v0.3
- Modalità Endless (scaling infinito)
- Daily seed condiviso
- Achievement system

---

## Checklist `game.js` — Feature obbligatorie (priorità decrescente)

Questa lista definisce cosa game.js DEVE implementare perché il loop sia completo. Ordinata per impatto.

### PRIORITÀ 1 — Loop base (senza questo, il gioco non gira)
- [ ] `initRound(blind, boss)` — inizializza handSize, hands, discards, applica regola boss
- [ ] `dealHand()` — pesca `BALANCE.handSize` carte dal mazzo (o meno se il mazzo finisce); se mazzo finisce → ri-shuffle delle carte scartate nel round
- [ ] `selectCard(index)` — toggle selezione, max 5 carte selezionate
- [ ] `playHand()` — chiama `calculateScore`, aggiorna runScore, decrementa `handsLeft`. Incrementa `handsPlayedThisRound` DOPO la chiamata. Chiama joker `on_hand_played` (già dentro calculateScore).
- [ ] `discardCards()` — rimuove carte selezionate dalla mano, pesca sostituti, decrementa `discardsLeft`. Chiama joker `on_discard` per ogni carta scartata. Incrementa `discardedThisRound`.
- [ ] `checkWin()` — `runScore >= targetScore` → blind vinta
- [ ] `checkLose()` — `handsLeft === 0 && runScore < targetScore` → game over
- [ ] Gestione mazzo vuoto mid-round: shuffle della pila scarti + mani usate, ricomincia a pescare

### PRIORITÀ 2 — Boss rules (ogni regola deve essere un case in initRound)
- [ ] `no_discard` — `discardsLeft = 0` (il bottone scarta è disabilitato)
- [ ] `half_denari` — in calculateScore, inject override: chip Denari ÷ 2 prima del calcolo joker
- [ ] `less_hands` — `handsLeft = BALANCE.handsPerBlind - 1`
- [ ] `no_figure_bonus` — chip figure = 0 nel ctx
- [ ] `change_briscola` — cambio seme briscola ad ogni `playHand()` call
- [ ] `half_chips` — tutti chip ÷ 2 dopo calcolo base
- [ ] `only_numbers` — figure danno 0 chip (diverso da no_figure_bonus: quest'ultimo lascia i chip base, only_numbers azzera solo le numeriche non-numeriche)
- [ ] `less_hand_size` — `handSize = BALANCE.handSize - 1`
- [ ] `random_transform` — dopo ogni `playHand()`, trasforma 1 carta random in mano in un'altra carta del mazzo
- [ ] `random_rule` — scegli 1 regola casuale all'inizio di ogni mano (tranne `random_rule` stessa e `double_target`)
- [ ] `pay_per_hand` — `money -= 10` prima di `playHand()`; se `money < 10`, la mano è bloccata
- [ ] `double_target` — `targetScore *= BALANCE.bossHalfTargetMult` (1.5) o `BALANCE.bossFinalTargetMult` (2.0) se boss finale
- [ ] `min_3_cards` — blocca `playHand()` se selezione < 3 carte
- [ ] `swap_hand_discard` — `[handsLeft, discardsLeft] = [discardsLeft, handsLeft]`
- [ ] `no_asso_chips` — chip dell'Asso = 0 nel ctx per questo blind
- [ ] `invert_combo_mult` — inverti `comboMult` prima di calculateScore (lookup table inversa)

### PRIORITÀ 3 — Economia e negozio
- [ ] Calcolo guadagno blind: `BALANCE.blindMoney[blindType] + handsNotUsed * BALANCE.handSavedBonus + discardsNotUsed * BALANCE.discardSavedBonus + interestEarned`
- [ ] Interesse: `Math.min(BALANCE.interestMax, Math.floor(money / BALANCE.interestPer))`
- [ ] Joker `on_round_start` chiamati all'inizio di ogni round
- [ ] `jokerIds = jokers.map(j => j.id)` passato nel ctx per sinergie
- [ ] Pity timer: contatore aperture negozio senza uncommon/rare → garantito al 3°/20° negozio

### PRIORITÀ 4 — Joker speciali
- [ ] Joker `diavolo`: `jokerState.diavolo` si resetta a 0 quando inizia un boss blind
- [ ] Joker `caffe_forte`: verificare che `handsPlayedThisRound === 0` sia passato correttamente (0 = prima mano, PRIMA di incrementare)
- [ ] Joker `munaciello_buono`: `money` nel ctx viene aggiornato; game.js deve sincronizzare `ctx.money` → `state.currentRun.money` dopo calculateScore
- [ ] Joker `corno_iellato` (on_discard): chiamare joker loop per ogni carta scartata, non per tutto il batch
- [ ] Joker `alba_napoletana` (on_round_start): roundChipsBonus/roundMultBonus applicati come bonus flat ad ogni mano del round

### PRIORITÀ 5 — Zodiac e safety net
- [ ] Applicare `ZODIAC_BONUSES[zodiac].apply(state)` all'inizio di ogni run
- [ ] Gestire flags zodiac (ariete: +1 mano al primo round di ogni Ante; cancro: +1 scarto per round; ecc.)
- [ ] Safety net: se 3 run consecutive perse su Ante 1 → mostra hint Gennarino
- [ ] Boss Ante 8 (munaciello_oro): target `× BALANCE.bossFinalTargetMult` + regola random tra `['less_hands', 'half_chips', 'no_discard']`

### PRIORITÀ 6 — Polish e juice
- [ ] Breakdown visivo: mostrare ogni joker che contribuisce con il delta chips/mult
- [ ] Skip animazioni: qualsiasi tasto/click skippa il counter animato
- [ ] Gennarino reazione: chiamare `Gennarino.react(emotion)` dopo ogni hand (vittoria mano, boss, jackpot, ecc.)
- [ ] Suoni: `Cards.sfx*` per ogni azione (card_select, card_play, card_discard, score_explode, coin_get)
