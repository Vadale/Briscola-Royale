# 📋 TODO — BRISCOLA ROYALE

> **Leggi sempre prima `BRIEF.md`** per il contesto completo del progetto.
> Questo file è il piano operativo concreto. Aggiorna le checkbox man mano che completi.

---

## 🎯 OBIETTIVO IMMEDIATO

Costruire un **MVP giocabile end-to-end** prima di fare polish.
**Filosofia**: meglio brutto e completo che bellissimo a metà.

---

## 🚧 FASE 0 — Setup
- [ ] Verificare che la cartella `/Users/alessandrovadala/Desktop/creatività/` contenga: `BRIEF.md`, `TODO.md`, `index.html` (vuoto)
- [ ] Decidere struttura file finale (proposta: index.html + 6 file JS modulari + style.css)

---

## 🚧 FASE 1 — Skeleton (priorità MAX)
Obiettivo: aprire index.html e vedere già "qualcosa", anche se non gioca.

- [ ] **`index.html`** — 6 schermate in sezioni con `display:none` switchabili:
  - `screen-zodiac` (selezione segno, prima volta)
  - `screen-menu` (menu principale con logo + Gennarino)
  - `screen-game` (HUD + mano + play zone)
  - `screen-shop` (negozio tra round)
  - `screen-slot` (slot machine bonus)
  - `screen-tombola` (tombola bonus)
  - `screen-end` (game over con previsione)

- [ ] **`style.css`** — base styling:
  - Reset + box-sizing
  - Variabili CSS palette (vedi BRIEF sezione "Palette VIVACE")
  - Font: VT323 + Press Start 2P + Bungee da Google Fonts
  - Body con texture feltro verde
  - `.screen` toggle con `.active`
  - Scanlines CRT overlay
  - Vignette
  - `image-rendering: pixelated` globale
  - Bottoni stile arcade (border ottone, ombre marcate)

- [ ] **`app.js`** — bootstrap + router:
  - `STATE` globale (vedi schema in BRIEF)
  - `loadState()` / `saveState()` localStorage
  - `switchScreen(id)` con animazione fade
  - Init: se nuovo utente → zodiac, altrimenti → menu
  - Helpers: `t(key)` per localizzazione, `toast(msg)`, `popup(content)`

---

## 🚧 FASE 2 — Data layer
Obiettivo: avere TUTTI i dati pronti, senza ancora gameplay completo.

- [ ] **`data.js`** — definizioni statiche:
  - `DECK_NAPOLI` — 40 carte (4 semi × 10 valori, no 8/9/10 numerici, vanno fante/cavallo/re)
  - `BOSSES` — array di 18 boss (vedi tabella BRIEF) con id, nome, regola, dialoghi
  - `JOKERS` — array di 25+ joker con id, name, rarity, cost, trigger, effect
  - `TAROTS` — 10 tarocchi consumabili
  - `SMORFIA` — mappa { numero: significato } (almeno 30 voci)
  - `SLOT_SYMBOLS` — simboli + rate vincita
  - `PREDICTIONS` — { generic, ariete, toro, ... gemini, victory } arrays di stringhe
  - `ZODIAC_BONUSES` — mappa { segno: bonusFunction }
  - `BALANCE` — tutti i numeri (target ante, costi, drop rate, ecc.)
  - `STRINGS` — oggetto i18n (almeno chiavi italiane, struttura pronta per altre lingue)

---

## 🚧 FASE 3 — Cards rendering
Obiettivo: mostrare le carte napoletane disegnate.

- [ ] **`cards.js`**:
  - `renderCard(card, size)` → SVG inline pixel art
  - Disegno per ogni seme (Bastoni/Coppe/Denari/Spade) con simbolo stilizzato
  - Disegno per figure (Fante/Cavallo/Re) come pixel art a `<rect>` SVG
  - Carta retro (back design) con logo Gennarino al centro
  - Animazioni: flip, hover, selected, played, discarded
  - `calculateScore(playedCards, jokers, modifiers)` — funzione PURA testabile
    - Identifica combinazione (Coppia, Tris, Napoletana, ecc.)
    - Calcola chips base + chips per carta + bonus combo
    - Applica jokers in ordine corretto (passive → on_card_scored → on_hand_played)
    - Restituisce `{chips, mult, total, breakdown}` per UI

---

## 🚧 FASE 4 — Mascotte Gennarino
Obiettivo: Gennarino vivo nel gioco.

- [ ] **`gennarino.js`** (nuovo file):
  - 10 sprite SVG inline come template stringhe
  - `renderGennarino(emotion, size)` ritorna SVG
  - Animazioni: dancing (4 frame), winking, breathing idle
  - `gennarinoBubble(text, emotion)` mostra fumetto con frase
  - 30+ frasi random in `GENNARINO_LINES`
  - Outfit: maglia azzurra Napoli + numero 10 + scritta "MARADONA" (no loghi reali)
  - Catenona d'oro + cornetto + occhiali a goccia

---

## 🚧 FASE 5 — Game loop
Obiettivo: si gioca davvero una mano di Briscola Royale.

- [ ] **`game.js`**:
  - `startRun()` — nuova partita: shuffle deck, reset state, ante 1
  - `startBlind(type)` — small/big/boss, set target, deal mano
  - `dealHand()` — pesca 5 carte (o quante richieste)
  - `selectCard(index)` — toggle selezione carta in mano
  - `playSelected()` — calcola score, animazione chips/mult, aggiunge a punteggio
  - `discardSelected()` — scarta carte, pesca rimpiazzo
  - `endBlind()` — vittoria/sconfitta, calcola money guadagnato
  - `applyBossRule(bossId)` — modifica state secondo regola boss
  - `showBossIntro(boss)` — popup con ritratto + dialogo
  - HUD update: ante, score, target, hands, discards, money, briscola seme
  - Joker bar: render joker attivi, click per dettagli

---

## 🚧 FASE 6 — Shop
Obiettivo: spesa tra blinds.

- [ ] **`shop.js`**:
  - `openShop()` — genera 3 joker random (rispettando rarity drop) + 2 tarocchi + 1 pacchetto
  - `buyItem(itemId)` — sottrae money, aggiunge a inventario, rimuove dallo shop
  - `rerollShop()` — costo crescente, rigenera offerte
  - `openPack(packId)` — animazione apertura, rivela contenuto carte
  - `useTarot(tarotId)` — applica effetto al deck/mano
  - Bottone "Avanti" → torna a game per round successivo

---

## 🚧 FASE 7 — Bonus minigames
Obiettivo: distrazioni ludiche che danno premi.

- [ ] **`bonus.js`**:
  - **Slot machine**:
    - 3 reel con simboli che scorrono (CSS animation)
    - Click "TIRA" → costo 10💰 → spin random → check combinazioni
    - Vincite con animazione juicy (luci che lampeggiano, schermo che trema su jackpot)
    - Suoni dedicati (vedi BRIEF audio)
  - **Tombola**:
    - Cartella 3×3 con numeri smorfia random
    - Bottone "Estrai" → numero random + significato Smorfia
    - Marca numeri estratti che matchano cartella
    - Premio per riga/colonna/diagonale completata
    - Gennarino fa il banditore con frasi tipo "QUARANTASETTE! 'O MUORTO!"

---

## 🚧 FASE 8 — Sistema zodiacale + previsioni
Obiettivo: pre-game scelta segno + post-loss profezia.

- [ ] **`zodiac.js`** (può stare in app.js se preferisci):
  - Schermata selezione segno (12 icone griglia 4×3 SVG pixel art)
  - Salva in `STATE.meta.zodiac`
  - Applica bonus passivo a inizio run
  - `showPrediction(zodiac, isVictory)` → popup Mago Astrologo
    - SVG del Mago in pixel art (vecchio barbuto, cappello a stelle)
    - Effetto typewriter sul testo
    - Pesca da PREDICTIONS rispettando segno + variante vittoria/sconfitta
    - Bottone "Accetto il mio destino"

---

## 🚧 FASE 9 — Audio
Obiettivo: il gioco fa rumore (ed è bello).

- [ ] **`audio.js`** (nuovo file):
  - `initAudio()` — crea AudioContext, lazy init dopo prima interazione
  - `beep(freq, dur, type, vol)` — building block
  - `playMelody(notes)` — sequenza
  - `playChord(freqs, dur)` — accordo
  - 30+ funzioni SFX dedicate (vedi BRIEF lista completa):
    - `sfxCardSelect()`, `sfxCardPlay()`, `sfxCoinGet()`, `sfxJackpot()`, ecc.
  - **Music tracks** come `MusicTrack` class con loop:
    - `bgmMenu`, `bgmGame`, `bgmBoss`, `bgmShop`, `bgmSlot`, `bgmVictory`
  - Volume sliders (BGM separato da SFX)
  - Mute toggle (tasto M + bottone)
  - "Ducking" automatico durante popup importanti

---

## 🚧 FASE 10 — Microtransazioni fake + lootbox
Obiettivo: meta-economia (anche se demo).

- [ ] In `shop.js` o nuovo `meta-shop.js`:
  - Schermata "Negozio Premium" dal menu principale
  - 4 pacchetti reali (Tabacchi €1.99, Cassaforte €4.99, Jackpot €9.99, Battle Pass €14.99)
  - UI checkout finto cafone (carta credito che si inserisce, "elaborazione...")
  - In modalità demo: bottone "Compra" → assegna currency gratis con messaggio "DEMO MODE — nella versione finale spenderesti soldi veri!"
  - Lootbox 3 tier (Iniziato 50💰, Adepto 120💰, Maestro 300💰)
  - Animazione apertura: pacchetto trema, esplosione luce, carte volano fuori una a una

---

## 🚧 FASE 11 — Polish & juice
Obiettivo: il gioco DIVERTE già a guardarlo.

- [ ] **Animazioni juicy**:
  - Chips che si accumulano con effetto "+10!" che vola via
  - Numeri grandi che esplodono e tremano (CSS animation)
  - Carte che ondeggiano leggermente (idle animation)
  - Screen shake sul jackpot
  - Particelle dorate quando vinci una mano grossa
  - Confetti pixel art alla vittoria run
- [ ] **Texture/dettagli**:
  - Sfondo bisca con elementi (posaceneri, tazzina, lampadina, ecc.)
  - Bordi ottone graffiati sui pannelli
  - Ombre marcate su tutto
- [ ] **Microcopy in dialetto** ovunque (Gennarino, NPC, frasi flavor)
- [ ] **Toast/popup** stilizzati (no alert browser)

---

## 🚧 FASE 12 — Easter eggs
- [ ] Konami code → modalità "Dialetto Stretto"
- [ ] Konami code 2× → modalità "Matrimonio" (musica esagerata)
- [ ] Click 10× sul logo menu → debug mode
- [ ] Combo perfetta → animazione "MASTRO PROFESSORE!"
- [ ] Codice "PIZZA" → carte diventano pizze

---

## 🚧 FASE 13 — Testing + edge cases
- [ ] Mazzo finito durante round → reshuffle scarti
- [ ] Joker contraddittori → ordine documentato
- [ ] Save/load mid-game → ricostruzione stato corretta
- [ ] Mobile responsive (portrait + landscape)
- [ ] Browser test: Chrome, Safari, Firefox
- [ ] Test 5 amici (vedi metriche BRIEF)

---

## 🚧 FASE 14 — Tutorial interattivo
Obiettivo: il giocatore capisce le meccaniche senza leggere un manuale.

**Stile**: tutorial overlay moderno — evidenzia l'elemento UI interessato, oscura il resto,
spiega con un fumetto/tooltip. Avanza step-by-step con click o freccia "AVANTI".

**File da creare:**
- `tutorial.js` — logica e contenuto del tutorial (IIFE, espone `window.Tutorial`)

**Flusso:**
1. Bottone "COME SI GIOCA?" nel menu principale → lancia tutorial
2. Si apre la schermata di gioco con una partita demo pre-configurata (mano fissa,
   joker/mazzetti fissati, briscola fissata) così ogni step mostra sempre la stessa situazione
3. Overlay scuro (rgba 0,0,0,0.75) copre tutto tranne l'elemento evidenziato
4. Spotlight circolare/rettangolare con glow oro attorno all'elemento attivo
5. Tooltip/fumetto con freccia che punta all'elemento, testo esplicativo
6. Bottone AVANTI (o click sul tooltip) per avanzare, SALTA TUTORIAL per uscire

**Step del tutorial (ordine):**
1. **Schermata gioco** — "Benvenuto! Questo è il tavolo da gioco."
2. **HUD** — Ante, Round (Small/Big/Boss), Punteggio e Obiettivo, Mani rimaste, Scarti, Ducati
3. **Mazzo** — "Clicca qui per pescare una carta. Parti con 3 carte, puoi arrivare a 7."
4. **Carta in mano** — "Queste sono le tue carte. Cliccale per selezionarle."
5. **Selezione combo** — "Quando selezioni più carte vedi la combo che formi. Cerca di fare il massimo!"
6. **Preview combo** (hand-type-display + chips-mult-display) — "Qui vedi chips × moltiplicatore. Il tuo punteggio sarà chips × mult."
7. **Briscola** — "Il seme briscola vale +5 chips per carta. Tienilo a mente!"
8. **Bottone GIOCA** — "Quando sei soddisfatto, premi GIOCA per segnare i punti."
9. **Bottone SCARTA** — "Puoi scartare carte che non ti servono. Hai un numero limitato di scarti."
10. **Combo list** — popup con mini-tabella delle combo (Coppia, Tris, Napoletana, Scopa, Bazzica ecc.)
11. **Jolly/Mazzetti** — "I Mazzetti sono le tue carte speciali. Ogni mano li vedi attivarsi con bonus."
12. **Obiettivo blind** — "Devi raggiungere il punteggio obiettivo entro le mani disponibili. Vinci il blind → vai al negozio → prossimo round!"
13. **Fine tutorial** — "Ora sai tutto! Buona fortuna, guagliò!" → bottone "INIZIA A GIOCARE"

**Dettagli tecnici:**
- Overlay: `position: fixed; inset: 0; z-index: 5000; background: rgba(0,0,0,0.75)`
- Spotlight: usa `clip-path` o `box-shadow` inset per ritagliare l'area evidenziata
- Tooltip: positioned accanto all'elemento con freccia CSS (::before triangle), sfondo giallo/panna stile arcade
- Testo: font pixel, dialetto leggero ma comprensibile (non troppo stretto — deve insegnare)
- Accessibilità: tasto ESC = salta tutorial, tasto → = avanti, tasto ← = indietro
- Save: `STATE.meta.tutorialDone = true` — se già visto, non mostrare di nuovo (ma accessibile dal menu)
- La partita demo NON deve salvare su localStorage — è read-only

---

## ❓ DECISIONI APERTE (chiedi all'utente o decidi tu)

Queste sono cose che il brief NON chiarisce al 100% — fai la scelta più sensata o chiedi:

1. **Modalità daily**: un seed unico al giorno (basato su data) o no?
2. **Cloud save?**: per ora solo localStorage. In futuro Supabase? Firebase?
3. **Multilingua al lancio**: solo italiano o italiano+inglese da subito?
4. **Numero esatto Joker MVP**: 10 (minimo per varietà) o 25 (vero deckbuilding)?
5. **Tombola come boss random** o **tombola come reward dello shop**?
6. **Vittoria endless**: c'è un limite (Ante 99) o letteralmente infinito?
7. **Nome del giocatore**: si chiede o usa "Guagliò" come default?
8. **Tutorial**: skippabile? Forzato prima volta?

---

## 📊 PROGRESS LOG

Aggiorna ad ogni sessione di lavoro:

| Data | Cosa fatto | File toccati | Note |
|------|-----------|--------------|------|
| 2025-?? | Brief + TODO scritti | BRIEF.md, TODO.md | Setup pronto |
| | | | |

---

## 🎬 OBIETTIVO FINALE

Un gioco che, **al primo sguardo**, fa pensare:
> *"Madonna mia che cos'è 'sta roba? È bellissimo e sembra una bisca! Devo provarlo!"*

E al primo click:
> *"OPLÀ! Sì, è esattamente come sembrava."*

Buon lavoro, guagliò. 🎰🃏
