# 🎰 BRISCOLA ROYALE — Project Brief

## 📋 Stato attuale del progetto

**Cartella di lavoro**: `/Users/alessandrovadala/Desktop/creatività/`

**File presenti**: solo `index.html` (vuoto, da ricreare)

**Stack scelto**: HTML/CSS/JavaScript vanilla — ZERO dipendenze, ZERO build step. Tutto deve girare aprendo `index.html` con doppio click.

**Vincolo importante**: il modello viene chiamato via API con rate limit di 30.000 token/minuto. Quindi i file vanno creati a pezzi piccoli (max ~150 righe per chunk), aspettando se necessario tra un chunk e l'altro.

---

## 🎯 Visione del progetto

**Nome**: BRISCOLA ROYALE
**Tagline**: "Il roguelike di carte napoletane che non sapevi di volere"

Un **deckbuilder roguelike in stile Balatro**, ma con:
- **Carte napoletane vere** (40 carte: Bastoni, Coppe, Denari, Spade — Asso→7 + Fante, Cavallo, Re)
- **Estetica pixel art 16-bit** un po' cafona, tappeto verde feltro, neon viola/rosso, ottone, font tipo `VT323` / `Press Start 2P` / `Bungee`
- **Vibe slot-machine da bar anni '90**: luci lampeggianti, "JACKPOT", oro finto, scritte animate
- **Tradizione napoletana**: La Smorfia, il Munaciello, la Janara, San Gennaro, Pulcinella

---

## 🎮 GAMEPLAY (priorità)

### MODALITÀ PRINCIPALE — Briscola Roguelike
- Run procedurale di **8 Ante** (livelli) crescenti di difficoltà
- Ogni Ante ha **3 round**: 2 normali (Small Blind, Big Blind) + 1 **Boss Blind** con regola speciale
- Il giocatore parte con un mazzo da 40 carte napoletane
- Mano di **5 carte**, può giocare combinazioni (1-5 carte) per fare punti
- Limiti per round: **4 mani giocate**, **3 scarti**
- Deve raggiungere il **punteggio target** prima di esaurire le mani

### Scoring (combinazioni napoletane → punti base × moltiplicatore)
- **Asso solo**: 11 punti
- **Tre solo**: 10 punti
- **Re**: 4 punti
- **Cavallo**: 3 punti
- **Fante**: 2 punti
- **Numeriche (2,4,5,6,7)**: 0 punti base

**Combinazioni speciali** (×mult):
- **Coppia** (2 carte stesso valore): chips×2
- **Tris** (3 stesso valore): chips×3
- **Poker** (4 stesso valore): chips×7
- **Napoletana** (Asso+2+3 stesso seme): chips×8
- **Carico** (3 figure stesso seme): chips×4
- **Settebello** (7 di Denari): +50 chips bonus
- **Briscola di seme** (carte del seme briscola): +mult per ogni carta
- **Primiera** (1 carta per ogni seme): chips×5
- **Scopa** (5 carte stesso seme): chips×10

### Boss Blinds (almeno 10 procedurali)
1. **'O Munaciello** — Le carte di denari valgono metà
2. **'A Janara** — Hai solo 3 mani invece di 4
3. **San Gennaro** — Le figure non danno bonus
4. **Pulcinella Nero** — Non puoi scartare
5. **'O Pazzariello** — La briscola cambia ogni mano
6. **'O Lione** — Solo 4 carte in mano invece di 5
7. **'A Smorfia** — Solo carte numeriche danno punti
8. **'O Tarocco Nero** — Target +50%
9. **Sirena d'o Vesuvio** — Devi giocare almeno 3 carte per mano
10. **'O Munaciello d'Oro** — Boss finale, target raddoppiato + regola random

### Joker (almeno 25 da collezionare, stile Balatro)
Ogni Joker ha effetti procedurali. Esempi:
- **'O Cornicello** — +30 chips ad ogni mano giocata
- **'A Sfortuna** — +5 mult per ogni carta scartata in questo round
- **'O Pesce d'Oro** — Le carte di denari danno ×2 chips
- **'O Re Cafone** — Re danno chips×3
- **'A Smorfia** — Carte 7,8,9 danno +20 chips
- **'O Diavolo** — +1 mult ad ogni mano, si resetta a 0 con ogni boss
- **'O Munaciello Buono** — Generi +3 ducati per mano
- **'A Mano Nera** — Coppie danno mult×4 invece di ×2
- **'O Caffè Forte** — Prima mano del round dà chips×3
- **'O Babà** — +50 chips se la mano contiene un Re

### Economia
- **Ducati** (💰) come valuta
- Vinci ducati battendo blinds (10/15/20 base + 1 per ogni mano risparmiata + 1 per ogni scarto risparmiato)
- Spendi nel **Negozio** tra blinds: Joker (4-8💰), Carte tarocco (3💰), Pacchetti (4-8💰), Voucher upgrade (10💰)

### Carte Tarocco (consumabili)
- **Il Mago** — Trasforma 2 carte in copie di un'altra
- **L'Imperatrice** — +1 carta in mano permanente
- **La Ruota** — 25% chance di trasformare un Joker in versione Foil/Holo
- **'O Sole** — Dà +50 ducati
- **'A Luna** — Riempie tutto il mazzo di un seme

---

## 🎰 BONUS 1 — Slot Machine Cafona
Mini-gioco accessibile dal negozio (10💰):
- Slot machine 3 ruote pixel art con simboli: 🍒🍋🔔💰7️⃣⭐💎
- Vincite:
  - 3× cherry = 5💰
  - 3× lemon = 10💰
  - 3× bell = 25💰
  - 3× 💰 = 50💰
  - 3× 7 = 200💰
  - 3× ⭐ = lootbox gratis
  - 3× 💎 = JACKPOT (1000💰ed effetti speciali)
- Animazione luci che lampeggiano, scritta JACKPOT che pulsa, suoni sintetici (Web Audio API)

## 🎲 BONUS 3 — Tombola del Munaciello
Mini-gioco bonus (random tra blinds):
- Cartella 3×3 con numeri Smorfia
- Il giocatore "estrae" numeri → se completa righe/colonne/diagonali vince premi
- Ogni numero ha significato Smorfia mostrato (es. "47 'o muorto", "33 ll'anne 'e Cristo")
- Premi: ducati, joker random, carte tarocco

---

## 🛒 MICROTRANSAZIONI (FAKE/DEMO)
Schermata negozio meta (dal menu principale):
- **Pacchetto Tabacchi** — €1.99 → 100💰 + 1 lootbox
- **Cassaforte d'Oro** — €4.99 → 500💰 + 3 lootbox
- **Jackpot Pack** — €9.99 → 1500💰 + 10 lootbox + Joker leggendario
- **Battle Pass Pulcinella** — €14.99 → sblocca skin per le carte
- UI di checkout finto cafone con effetto "carta di credito che si inserisce"

## 📦 LOOTBOX
3 tipi:
- **Pacchetto Iniziato** (50💰): 3 carte, drop standard
- **Pacchetto Adepto** (120💰): 5 carte, drop migliorato
- **Pacchetto Maestro** (300💰): 10 carte, garantito 1 leggendario

Apertura animata: pacchetto che si apre, carte che escono una per una con effetto luce.

---

## 🎨 ESTETICA — DETTAGLI

### Palette colori
- Verde feltro: `#1a4d2e` / `#0f3320`
- Oro/Ottone: `#d4a017` / `#f4c430`
- Rosso napoletano: `#c1272d`
- Viola neon: `#9d4edd`
- Nero profondo: `#0a0a0a`
- Bianco panna: `#f4ede4`

### Font
- Titoli: `Bungee` o `Press Start 2P`
- UI: `VT323` (terminale retrò)
- Numeri grossi: `Press Start 2P`

### Effetti visivi
- **Scanlines CRT** overlay sull'intero schermo
- **Vignette** scura ai bordi
- **Pixel art** sulle carte (border crisp, no antialiasing)
- **Tappeto in feltro** (texture noise)
- **Bordi ottone** sui pannelli con effetto "graffiato"
- **Animazioni juicy**: chips che volano, numeri che esplodono, schermo che trema sui jackpot
- **Luci lampeggianti** sulle slot machine (CSS keyframe)
- **Cartine napoletane disegnate in CSS/SVG** (no immagini esterne)

### Carte napoletane — disegno
Ogni carta ha:
- Bordo ottone
- Sfondo color seme (Bastoni=marrone, Coppe=rosso, Denari=oro, Spade=blu)
- Simbolo del seme stilizzato grande al centro
- Numero/figura nel ribbon dorato in alto
- Per figure (Fante, Cavallo, Re): pixel art del personaggio

---

## 📁 STRUTTURA FILE PROPOSTA

```
creatività/
├── index.html        — UI completa, 5 schermate (menu, game, shop, slot, tombola, end)
├── style.css         — pixel art styling, ~800 righe
├── data.js           — definizioni carte, joker, boss, smorfia, etc.
├── cards.js          — rendering carte SVG/CSS, calcolo punteggi
├── game.js           — game loop principale (briscola roguelike)
├── shop.js           — logica negozio + lootbox
├── bonus.js          — slot machine + tombola
└── app.js            — bootstrap, navigazione schermate, save/load (localStorage)
```

---

## ✅ COSA È STATO FATTO PRIMA (e poi cancellato)

Nei tentativi precedenti avevamo creato:
1. **Dream Canvas** — generative art toy (scartato: troppo da artista, poco vendibile)
2. **Arcana Tarocchi** — collezionabile NFT-like con tarocchi cyber (scartato: troppo serio, poco "cazzaro")

Le decisioni chiave emerse dalla conversazione:
- ✅ Deve essere **funzionale e potenzialmente vendibile**
- ✅ Stile "**del 2026**" ma con tradizione (carte napoletane)
- ✅ Mix di **videogioco + crypto/NFT vibes + carte collezionabili**
- ✅ Stile **Balatro** (deckbuilder roguelike) ma con **carte napoletane**
- ✅ Estetica **stilosa ma cafona**, vibe **slot machine pixel art**
- ✅ **Tutti e 3 i sotto-giochi** (briscola=principale, slot=bonus1, tombola=bonus3)
- ✅ **Generazione procedurale** dei boss
- ✅ **Microtransazioni e lootbox** (anche se demo/fake)

---

## 🚀 PIANO DI ATTACCO SUGGERITO

Dato il rate limit (30k token/min), suggerisco di costruire in quest'ordine:

1. **HTML scheletro** (5 schermate, no styling)
2. **CSS base** (palette, font, scanlines, layout schermate) — 2-3 chunk
3. **data.js** (40 carte napoletane + 25 joker + 10 boss + smorfia + simboli slot)
4. **cards.js** (rendering carta come SVG inline, calcolo punteggi combinazioni)
5. **game.js** (game loop: deal mano, seleziona carte, gioca, calcola, scarta, fine round)
6. **shop.js** (negozio tra blinds, acquisti, reroll)
7. **bonus.js** (slot machine animata + tombola)
8. **app.js** (state machine schermate, save/load, init)

**Per ogni file**: scrivere a chunk di max 100-150 righe, usando `cat >> file.js << 'EOF'` per appendere. Aspettare se rate limit colpisce.

---

## 📌 NOTA FINALE

Il tono del gioco deve essere **divertente, autoironico, super italiano**. I testi UI in italiano colloquiale/napoletano:
- "Hai vinto, guagliò!"
- "Mannaggia, hai perso..."
- "JACKPOT! Ricco sfondato!"
- "Pesca 'na carta, vediamo che esce..."
- Smorfia: "47 'o muorto", "33 ll'anne 'e Cristo", "90 'a paura"

L'utente ha detto: *"Stupiscimi cazzo"* — quindi vai senza paura sul cafone, sul saturato, sul "troppo è meglio che poco". L'estetica deve essere **memorabile al primo colpo d'occhio**.

Buon lavoro! 🎰🃏

---

## 🔧 APPENDICE TECNICA — Dettagli pratici

### 🃏 Mazzo napoletano completo (40 carte)
4 semi × 10 valori:
- **Semi**: Bastoni 🟫 (marrone), Coppe 🔴 (rosso), Denari 🟡 (oro), Spade 🔵 (blu)
- **Valori**: Asso (1), 2, 3, 4, 5, 6, 7, Fante (8), Cavallo (9), Re (10)
- Note: nelle carte napoletane NON c'è il 10, salta da 7 a Fante. La gerarchia di presa nella briscola tradizionale è: Asso > 3 > Re > Cavallo > Fante > 7 > 6 > 5 > 4 > 2

### 📊 Formula scoring (tipo Balatro)
```
score = (chips_base + bonus_combinazione + bonus_carte_giocate) × mult_totale
```
- Ogni carta giocata contribuisce con i suoi `chips`
- Le combinazioni moltiplicano il `mult` (parte da 1)
- I Joker possono modificare sia `chips` che `mult` con trigger condizionali

Esempio: gioca Asso♦ + 3♦ + 2♦ (Napoletana di Denari)
- chips base: 11+10+0 = 21
- bonus combinazione "Napoletana": +50 chips
- mult: 8× (napoletana)
- Joker "'O Pesce d'Oro" (Denari ×2 chips): chips diventano 142
- score finale: 142 × 8 = **1136**

### 🎯 Target Ante (curva di difficoltà)
- Ante 1: Small=300, Big=450, Boss=600
- Ante 2: Small=600, Big=900, Boss=1200
- Ante 3: Small=1200, Big=1800, Boss=2400
- Ante 4: Small=2500, Big=3750, Boss=5000
- Ante 5: Small=5000, Big=7500, Boss=10000
- Ante 6: Small=10000, Big=15000, Boss=20000
- Ante 7: Small=20000, Big=30000, Boss=40000
- Ante 8 (FINALE): Small=40000, Big=60000, Boss=80000 (Munaciello d'Oro)

### 🔢 La Smorfia napoletana (per Tombola, almeno 30)
```
1='o paesano · 2='a piccerélla · 3='a jatta · 4='o puorco
5='a mano · 6='a guarduta 'nterra · 7='o vase · 8='a Maronna
9='a figliata · 10='e fasule · 13='Sant'Antonio · 17='a disgrazia
20='a festa · 21='a femmena annura · 22='o pazzo · 25=Natale
27='o cantero · 28='e zizze · 29='o pate d''e ccriature · 33=ll'anne 'e Cristo
40='a noia · 42='o ccafé · 47='o muorto · 48='o muorto che pparla
56='a caduta · 60='o lamiento · 62='o muorto acciso · 70='o palazzo
77='e diavule · 80='a vocca · 88='e ccaccavelle · 90='a paura
```

### 🎮 State machine schermate
```
menu → game → shop → game → ... (loop) → end → menu
                ↓
        slot/tombola (bonus opzionali)
```
Ogni schermata = `<section class="screen">` con `display:none`, una sola `.active` alla volta.

### 💾 Save state (localStorage)
Chiave: `briscola_royale_v1`
```js
{
  meta: { coins, unlockedJokers, totalRuns, victories, bestScore },
  currentRun: { ante, blind, deck, jokers, score, hands, discards } | null,
  settings: { sound: true, musicVolume: 0.5 }
}
```

### 🔊 Sound effects (Web Audio API, generati al volo)
NON usare file audio esterni. Generare con oscillatori:
- **card_flip**: square wave 800Hz, 50ms
- **chip_count**: sine 1200Hz pulse, 30ms ripetuto
- **win**: arpeggio C-E-G-C ascendente
- **jackpot**: arpeggio lungo + noise burst
- **slot_reel**: triangle wave che scende di tono
- **boss_appear**: low rumble (sawtooth 80Hz + noise)

Funzione helper:
```js
function beep(freq, dur, type='square', vol=0.1) {
  const ctx = window._audio ||= new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur/1000);
}
```

### 🎨 CSS — pattern utili da riusare

**Scanlines CRT** (overlay full screen):
```css
.crt::after {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px);
}
```

**Texture feltro verde**:
```css
background:
  radial-gradient(ellipse at center, #1a4d2e, #0f3320),
  repeating-conic-gradient(rgba(0,0,0,0.04) 0deg, transparent 1deg, transparent 2deg);
```

**Bordo ottone graffiato**:
```css
border: 4px solid;
border-image: linear-gradient(135deg, #f4c430, #d4a017, #b8860b, #f4c430) 1;
box-shadow: inset 0 0 0 2px #8b6914, 0 4px 12px rgba(0,0,0,0.5);
```

**Pixel art crisp** (importante per le carte):
```css
image-rendering: pixelated;
image-rendering: crisp-edges;
font-smooth: never;
-webkit-font-smoothing: none;
```

**Bulb lampeggianti slot machine**:
```css
@keyframes bulbBlink {
  0%, 49% { background: #ffeb3b; box-shadow: 0 0 12px #ffeb3b; }
  50%, 100% { background: #c1272d; box-shadow: 0 0 8px #c1272d; }
}
.bulb { animation: bulbBlink 0.4s steps(1) infinite; }
.bulb:nth-child(2n) { animation-delay: 0.2s; }
```

**Screen shake** (jackpot):
```css
@keyframes shake {
  0%,100%{transform:translate(0,0)} 25%{transform:translate(-3px,2px)}
  50%{transform:translate(3px,-2px)} 75%{transform:translate(-2px,-3px)}
}
.shake { animation: shake 0.3s steps(4) 3; }
```

### 🃏 Disegno carta napoletana (SVG inline)
Struttura suggerita per ogni carta:
```html
<div class="napoli-card" data-seme="denari" data-val="1">
  <svg viewBox="0 0 80 120">
    <!-- bordo ottone -->
    <rect x="2" y="2" width="76" height="116" rx="4" fill="#f4ede4" stroke="#d4a017" stroke-width="2"/>
    <!-- ribbon top -->
    <rect x="6" y="6" width="68" height="14" fill="#d4a017"/>
    <text x="40" y="17" text-anchor="middle" font-family="VT323" font-size="12" fill="#0a0a0a">ASSO</text>
    <!-- simbolo seme grande -->
    <text x="40" y="75" text-anchor="middle" font-size="48" fill="#d4a017">⊛</text>
    <!-- valore agli angoli -->
    <text x="10" y="115" font-size="10" fill="#0a0a0a">1</text>
    <text x="70" y="30" font-size="10" fill="#0a0a0a" transform="rotate(180 70 30)">1</text>
  </svg>
</div>
```

Per le **figure** (Fante/Cavallo/Re): pixel art a blocchi usando `<rect>` SVG colorati come "sprite" 16×24 pixel.

### 🎲 Generazione procedurale Joker
Ogni Joker è un oggetto:
```js
{
  id: 'cornicello',
  name: "'O Cornicello",
  emoji: '🪬',
  rarity: 'common',  // common | uncommon | rare | legendary
  cost: 4,
  description: '+30 chips ad ogni mano giocata',
  trigger: 'on_hand_played',  // on_hand_played | on_card_scored | on_round_start | on_discard | passive
  effect: (ctx) => { ctx.chips += 30; },
  art: { bg: '#c1272d', icon: '🪬' }
}
```

I trigger sono richiamati nel game loop al momento giusto. `ctx` contiene `{chips, mult, hand, played, scored, money, ante}`.

### 🏆 Vittoria finale
Battendo Ante 8 Boss → schermata vittoria con:
- Stat run (ante, score totale, joker raccolti, miglior mano)
- Animazione fuochi d'artificio in pixel art
- Sblocca **modalità Endless** (scaling infinito) o **modalità Daily** (seed giornaliero)
- Bonus 500💰 per la collezione meta

### ⚠️ Edge cases da gestire
- Mazzo finito a metà round → carte già scartate tornano nel mazzo (shuffle)
- Joker con effetti contraddittori → ordine di applicazione: trigger passivi → on_card_scored (per ogni carta da sx a dx) → on_hand_played → finale
- Boss "Pulcinella Nero" + 0 mani rimaste → game over
- Salvataggio durante una mano → al reload, ricostruisci stato senza la mano corrente

### 📱 Responsive
Il gioco deve essere giocabile anche su mobile (portrait):
- HUD verticale, mano in basso
- Carte ridotte ma cliccabili (touch target min 44px)
- Slot machine occupa tutto lo schermo
- Su desktop: layout largo con joker bar laterale

### 🎁 Easter eggs (extra polish)
- Konami code → sblocca skin "Maradona" per le carte
- Click 10× sul logo menu → modalità debug con money infinito
- Combo perfetta (Napoletana + Settebello + Briscola) → animazione "MASTRO PROFESSORE!" con voice-over sintetico

---

## 📞 Promemoria per chi continua

1. **Apri sempre prima `BRIEF.md` per capire lo stato**
2. **Lavora a chunk di max ~150 righe** per rate limit
3. **Verifica con `ls -la /Users/alessandrovadala/Desktop/creatività/` cosa c'è già**
4. **Apri il risultato con `open /Users/alessandrovadala/Desktop/creatività/index.html`** per testare
5. **Non aggiungere dipendenze esterne** (no React, no librerie audio, no immagini)
6. **Tutto in italiano** nei testi UI, codice/commenti in italiano o inglese a scelta
7. **Quando il file è grande, usa `cat >> file << EOF` per appendere** invece di riscrivere
8. **Tieni traccia del progresso** aggiornando una sezione "PROGRESS" qui sotto

---

## 📈 PROGRESS LOG

- [x] Brief scritto (questo file)
- [x] index.html (vuoto, da popolare con skeleton 5 schermate)
- [ ] style.css (palette, font, layout, scanlines)
- [ ] data.js (carte, joker, boss, smorfia)
- [ ] cards.js (render SVG + scoring)
- [ ] game.js (game loop briscola)
- [ ] shop.js (negozio)
- [ ] bonus.js (slot + tombola)
- [ ] app.js (router schermate + save/load)
- [ ] Testing & polish
- [ ] Easter eggs

---

## 🧭 APPENDICE STRATEGICA — Perché certe scelte

### Perché Balatro come riferimento
Balatro ha venduto 5M+ copie in 6 mesi con un team di 1 persona. Le sue chiavi del successo:
- **Loop dopaminergico**: vedi i numeri esplodere ogni mano (il "juice")
- **Scelte significative ogni 30 secondi**: tieni o scarti? compri o risparmi?
- **Build diverse ogni run**: i Joker creano combo emergenti
- **Difficoltà giusta**: facile da imparare, brutale a livelli alti
- **Estetica memorabile**: pixel art retrò + glow viola riconoscibile a colpo d'occhio

**Briscola Royale deve replicare il loop, non il look.** Il look è 100% napoletano-cafone.

### Perché carte napoletane (non francesi)
- **Brand identity unica**: nessun competitor fa carte regionali italiane
- **Storytelling naturale**: la Smorfia, il Munaciello, le tradizioni napoletane sono già un universo narrativo
- **Mercato Italia + nostalgia diaspora**: 60M italiani + ~80M discendenti nel mondo
- **TikTok/social**: l'estetica cafona-orgogliosa funziona benissimo (vedi: "italian brainrot")
- **Differenziazione**: in un mercato saturo di deckbuilder, "il Balatro napoletano" è un hook immediato

### Perché microtransazioni FAKE (almeno all'inizio)
Versione 1.0 deve essere **single-player free**. Le microtransazioni nella demo servono a:
1. **Validare il loop monetario** (gli utenti tornano a comprare?)
2. **Materiale marketing** (screenshot del checkout cafone diventano meme)
3. **Preparare la v2.0** dove diventano vere (dopo validation)

NON inserire vera Stripe/PayPal nella v1. Solo UI. Quando l'utente clicca "Compra" → mostra animazione → assegna currency in-game gratis con messaggio "DEMO MODE".

### Pricing strategy (per quando sarà vendibile)
- **Free demo**: Ante 1-3, 5 joker, no microtransazioni
- **Full game** $9.99 una tantum (Steam/itch.io): tutto sbloccato + modalità endless + daily
- **Mobile** $4.99 (iOS/Android) o free + IAP cosmetici (skin carte, animazioni vittoria)
- **Web edition** free con ads opzionali per "extra ducati"
- **NFT/crypto** (opzionale, ma occhio): le carte rare potrebbero avere edizioni limitate on-chain. Solo se diventa virale, NON al lancio.

---

## 🎲 BILANCIAMENTO — numeri da non sbagliare

### Curve economiche
- Money guadagnato per blind: 3-7💰 base + 1×mani risparmiate + 1×scarti risparmiati + 1💰 ogni 5💰 in tasca (interest, max 5)
- Costi medi shop: Joker common 4💰, uncommon 6💰, rare 8💰, legendary 20💰
- Reroll shop: 5💰 (raddoppia ogni reroll nello stesso shop)
- Tarocco: 3💰
- Pacchetto carte: 4-8💰

**Se il giocatore non spende mai**, dovrebbe avere 50-80💰 all'Ante 8.
**Se spende ottimizzando**, dovrebbe avere 0-10💰 all'Ante 8 ma una build forte.

### Win rate target
- **Ante 1-3**: 90% dei giocatori dovrebbe passare
- **Ante 4-5**: 60% (qui inizia la curva)
- **Ante 6-7**: 30%
- **Ante 8 Boss**: 10-15% (vittoria deve sentirsi guadagnata)
- **Endless mode**: nessuno dovrebbe arrivare oltre Ante 15 senza build perfetta

### Joker rarity drop rates
- Common: 70%
- Uncommon: 22%
- Rare: 7%
- Legendary: 1%

**Pity timer**: dopo 20 shop senza un raro, il prossimo è garantito raro+.

### Dimensioni ottimali
- Mazzo iniziale: 40 carte (mazzo napoletano standard)
- Mano: 5 carte (modificabile con joker fino a 8)
- Slot Joker: 5 (modificabile fino a 7 con voucher)
- Slot Tarocchi: 2 (consumabili)

---

## 🗺️ ROADMAP suggerita post-MVP

### v0.1 (MVP — quello che stiamo costruendo)
Briscola + 5 boss + 10 joker + slot machine + tombola + shop base

### v0.2
- 25 joker totali
- 10 boss totali
- Tarocchi consumabili (10 tipi)
- Animazioni juice complete
- Audio synth completo

### v0.3
- Modalità Endless
- Modalità Daily Challenge (seed giornaliero condiviso)
- Leaderboard locale
- Achievement system (es. "Vinci con solo carte di Coppe")

### v1.0 (release)
- Modalità Sfida (preset difficili)
- 4 mazzi alternativi sbloccabili (Siciliano, Toscano, Bergamasco, Trevisano)
- Localizzazione EN/ES per export
- Steam achievements
- Settings audio/grafica

### v1.1+
- Multiplayer asincrono (1v1 stesso seed)
- Mod support (custom joker JSON)
- Mobile port nativo
- DLC stagionali (Carnevale, Natale, Pasqua → joker tematici)

---

## 🐛 ANTI-PATTERN da EVITARE

### ❌ NON fare
- **Caricamento immagini esterne** (no PNG, no GIF, no font da CDN se evitabile) → tutto inline/SVG/data-URI
- **Animazioni a 60fps con setInterval** → usa `requestAnimationFrame`
- **localStorage senza versioning** → sempre `briscola_royale_v1`, `_v2` per migrare
- **Stato globale unico mutabile ovunque** → mantieni `STATE` come single source of truth, mutalo solo da funzioni dedicate
- **Calcoli punteggio dispersi** → un'unica funzione `calculateScore(played, joker, modifiers)` testabile
- **Hard-code magic numbers** → tutti i numeri di balancing in un oggetto `BALANCE` modificabile
- **Animazioni che bloccano l'input** → l'utente deve sempre poter cliccare "Skip animazione"
- **Testi inglesi** → tutto italiano (al massimo errori ortografici voluti per cafonità)
- **Dark patterns reali** → microtransazioni demo OK, ma non manipolatorie verso bambini
- **Gameplay che richiede tutorial lungo** → max 1 schermata di intro, il resto si impara giocando

### ✅ FAI invece
- **Onboarding implicito**: prima mano forzata "tutorial" con suggerimento sopra le carte
- **Feedback visivo per ogni azione**: click = animazione, sempre
- **Numeri che salgono visibilmente**: il punteggio si accumula a step animati, non istantaneo
- **Sound on/off prominente**: alcuni utenti odiano i suoni, deve essere il primo bottone
- **Mobile-first nel layout**: se funziona su mobile, funziona ovunque

---

## 📊 METRICHE DI SUCCESSO (per validare il prototipo)

Quando il gioco è giocabile, testa con 5 amici e misura:
- **Time to first "wow"**: quanto ci mettono a dire "fico!" (target: <30s)
- **Run completion rate**: quanti finiscono almeno una run intera (target: >70%)
- **Retry rate**: quanti rigiocano dopo aver perso (target: >50%)
- **Screenshot rate**: quanti fanno screenshot da soli (target: >2 di media)
- **Comprensione regole**: quanti capiscono lo scoring senza spiegazione (target: >60% dopo 3 mani)

Se questi numeri sono OK → il loop funziona, scala in produzione.
Se non sono OK → itera sull'estetica (juice) o sulle regole (chiarezza).

---

## 🎨 RIFERIMENTI VISIVI (mood board)

Se l'IA può cercare online:
- **Balatro** (gameplay loop, juice, joker UI)
- **Pizza Tower** (estetica cafona, palette saturata)
- **Cuphead** (juice + animazioni esplosive)
- **Slot machine napoletane vintage** (sale giochi anni '90)
- **Insegne neon di pizzerie** (gradiente rosso/verde/oro)
- **Carte napoletane Modiano/Dal Negro** (stile classico da copiare)
- **Smorfia napoletana illustrata** (per icone Tombola)
- **Vasco Brondi / Liberato** vibe (italian-but-cool)

NO riferimenti puliti tipo Apple/Google: deve sembrare **fatto a mano in una sala giochi del 1995**.

---

## 💡 IDEE EXTRA (se c'è tempo, non priorità)

- **Streamer mode**: nascondi i numeri esatti, mostra solo "vinci/perdi"
- **Photo mode**: dopo una vittoria, frame estetico per condividere
- **Replay sharing**: serializza la run come stringa base64, condivisibile via URL
- **Boss rematch**: dopo aver perso, opzione di rifare lo stesso boss con +1 mano
- **Seasonal events**: a Natale tutti i Re diventano "Re Magi", a Carnevale appaiono Pulcinella ovunque
- **NPC narrator**: 'O Munaciello commenta le tue mosse con frasi cafone random
- **Codici cheat**: digiti "PIZZA" sul menu → tutte le carte diventano "Pizza Margherita" per fun
- **Concorso vero**: il giocatore con miglior score del mese vince una vera pizza (marketing!)

---

## 🏁 CHIUSURA

Questo brief è **deliberatamente sovra-specificato** per ridurre l'ambiguità. Non significa che vada implementato tutto: la IA che continua dovrebbe:

1. **Implementare prima il MVP** (briscola + 5 boss + 10 joker + slot)
2. **Far funzionare il loop** end-to-end anche se brutto
3. **Polish estetico** dopo che il gameplay funziona
4. **Bonus content** (tombola, lootbox, microtransazioni) per ultimo

**Filosofia**: meglio un gioco completo brutto che un gioco bello a metà.

E ricorda: **il giocatore deve sorridere entro 10 secondi dall'avvio.** Se non sorride, qualcosa non sta funzionando. Aggiungi più feltro, più oro, più cafonità, più napoletano. Mai meno.

🎰🃏 **Buon lavoro, guagliò!** 🃏🎰

---

## 🎭 TONO E ATMOSFERA — DEFINITIVO

### Vibe generale
Il gioco deve respirare un'aria **scanzonata, sopra le righe, esagerata**, che richiama l'estetica e la cultura dei **paesi del Sud Italia** (Napoli in primis, ma anche Sicilia, Puglia, Calabria) in chiave **canzonatoria e satirica** — mai offensiva, sempre affettuosa.

**L'effetto target**: il giocatore deve sentirsi come dentro:
- Una **sala giochi di paese** anni '90 con il barista che urla
- Una **sagra del Sud** con altoparlanti gracchianti
- Un **bar napoletano** dove tutti commentano la partita di carte ad alta voce
- Un **film di Massimo Troisi / Totò / De Filippo** in versione videogioco

### Esempi di tono nei testi UI
- "Mannaggia 'a marina, hai perso!"
- "Uagliò, mo' ti faccio vedere io!"
- "JACKPOT! Ricco sfunnato comme a 'nu re!"
- "Stai ascì pazzo? Hai vinto!"
- "Aspè aspè, mo' guardo le carte... NO! Hai sbagliato tutto!"
- "Tieni 'na mano c' 'a faceva schifo pure 'o cane mio"
- "Sant'Antonio, fammi 'a grazia!"
- "Madonna mia, che mano! ME STO INNAMORANDO!"
- "Hai chiuso 'o conto? Bravo, mo' paghi!"
- "Vaffanculo... in senso buono, eh!"

### Personaggi/voci ricorrenti (NPC narrator)
Durante il gioco, frasi random commentano le mosse:
- **'O Vecchio del Bar** (commentatore principale, voce rotta)
- **'A Signora Concetta** (vicina di casa critica)
- **'O Nipote Sapientone** (corregge sempre tutto)
- **'O Barista** (ti porta il caffè dopo ogni vittoria virtuale)

Esempi:
- *Vecchio*: "Eh, ai tempi miei sì che si giocava!"
- *Concetta*: "Ma 'sta carta perché l'hai giocata? MAMMÀ!"
- *Nipote*: "Tecnicamente avresti dovuto..."
- *Barista*: "Vuoi 'o caffè ristretto o lungo?"

### Regole di scrittura
- **Mix italiano + dialetto** (60/40), comprensibile anche a non-meridionali
- **MAIUSCOLO per enfasi** (urlato)
- **Punti esclamativi multipli** quando serve "!!!"
- **Apostrofi napoletani**: 'o (il), 'a (la), 'e (le/gli), c' (con), pe' (per)
- **Onomatopee**: "BOOOOM!", "TZAC!", "PRRR!", "OPLÀ!"
- **Mai testi noiosi**: anche "Caricamento..." diventa "Aspè 'nu mumento, sto pensanno..."

---

## 👹 BOSS — CULTURA POPOLARE ITALIANA

I boss devono essere **personaggi iconici della cultura italiana popolare/folkloristica**, ognuno con personalità, dialogo e regola unica. Non solo napoletani — pesca da tutto il Sud + maschere della Commedia dell'Arte + figure folkloristiche italiane.

### Roster boss completo (almeno 15, da estrarre proceduralmente)

| # | Boss | Origine | Regola | Frase entrata |
|---|------|---------|--------|---------------|
| 1 | **Pulcinella Nero** | Napoli, Commedia dell'Arte | Non puoi scartare carte | "Ah ah ah, scarta 'sta cosa qua!" |
| 2 | **'O Munaciello** | Folklore napoletano | Le carte di denari valgono metà | "I sordi nun se toccano, guagliò!" |
| 3 | **'A Janara** | Strega beneventana | Solo 3 mani invece di 4 | "Ti ho fatto la fattura, bello!" |
| 4 | **San Gennaro Severo** | Patrono di Napoli | Le figure non danno bonus | "Il sangue non si è sciolto. Niente miracolo." |
| 5 | **'O Pazzariello** | Banditore napoletano | La briscola cambia ogni mano | "Gente! Gente! Cambia tutto!" |
| 6 | **Pinocchio Bugiardo** | Toscana (Collodi) | Le tue mani vincenti sono dimezzate | "Ho un naso lunghissimo... come il tuo bluff!" |
| 7 | **'A Smorfia in Persona** | Tradizione napoletana | Solo carte numeriche danno punti | "47... 'o muorto si' tu!" |
| 8 | **'O Lione di San Marco** | Venezia | Solo 4 carte in mano | "Rugghio io, non tu!" |
| 9 | **Mastro Geppetto Ubriaco** | Toscana | Trasforma 1 carta a caso ogni mano | "Hic! Ho fatto 'na cosa strana..." |
| 10 | **Arlecchino Multiforme** | Bergamo, Commedia dell'Arte | Cambia regola ogni round | "Sono 100 maschere in una!" |
| 11 | **Mammasantissima** | Calabria, 'ndrangheta folk | Devi pagare 10💰 per giocare ogni mano | "Tu mi devi rispetto, picciotto." |
| 12 | **'O Tarocco Nero** | Folklore | Target +50% | "Le carte hanno predetto la tua sconfitta." |
| 13 | **Sirena d'o Vesuvio** | Napoli, mitologia | Devi giocare almeno 3 carte per mano | "Il mio canto ti incanta..." |
| 14 | **Don Chisciotte di Catania** | Sicilia (Cervantes-mix) | Vede mulini al posto delle carte | "Carica! Per la mia Dulcinea!" |
| 15 | **'A Befana Cattiva** | Tradizione italiana | Tutte le tue carte sono "carbone" (chips ÷ 2) | "Quest'anno solo carbone per te!" |
| 16 | **'O Lupo Mannaro Lucano** | Basilicata, leggenda | Solo durante luna piena (random round) raddoppia il target | "AAAUUU!" |
| 17 | **Befana de Roma** | Roma | Inverte le mani con gli scarti | "A regà, mo' te fregamo!" |
| 18 | **Munaciello d'Oro** | BOSS FINALE Ante 8 | Target ×2 + regola random + ti insulta | "Guagliò, sei arrivato fin qua. Bravo. Mo' però perdi." |

### Procedural generation boss
Ad ogni Ante, il boss viene scelto random dal pool **escludendo i già visti in questa run**. L'Ante 8 è SEMPRE Munaciello d'Oro.

### Dialoghi boss
Ogni boss ha 3 frasi:
- **Entrata** (quando appare)
- **Quando perdi un round contro di lui** ("A me 'a sai 'a verità?")
- **Quando lo batti** ("Mannaggia... bravo guagliò, mi hai fottuto.")

Mostrate in popup pixel art con ritratto del boss (SVG) + bubble di dialogo stile JRPG.

---

## ⭐ ZODIACO — Il Mago Astrologo

### All'inizio di ogni nuova partita
Schermata pre-run: **"Prima di iniziare... 'o Mago vuole sapere"**

L'utente sceglie il proprio segno zodiacale da una griglia 4×3 di icone pixel art:
♈ Ariete · ♉ Toro · ♊ Gemelli · ♋ Cancro · ♌ Leone · ♍ Vergine
♎ Bilancia · ♏ Scorpione · ♐ Sagittario · ♑ Capricorno · ♒ Acquario · ♓ Pesci

Il segno viene salvato nel `STATE` per tutta la run (e persistente in localStorage).

### Effetto del segno (gameplay leggero)
Ogni segno dà un **piccolo bonus passivo gratuito** (per dare valore alla scelta):
- **Ariete**: +1 mano al primo round di ogni Ante
- **Toro**: +20💰 di partenza
- **Gemelli**: pesca 1 carta extra all'inizio
- **Cancro**: gli scarti sono +1 per round
- **Leone**: prima mano del round dà chips×1.5
- **Vergine**: il mazzo è ordinato per seme all'inizio
- **Bilancia**: target ridotto del 5% all'Ante 1
- **Scorpione**: Joker rari +2% drop rate
- **Sagittario**: vedi una carta in più del mazzo
- **Capricorno**: interest in tasca raddoppiato
- **Acquario**: 1 reroll shop gratis
- **Pesci**: i Tarocchi costano 1💰 in meno

### 🔮 PREVISIONE TREMENDA (game over)
Quando perdi una run, prima della schermata "rigioca/menu" appare un popup:

**"🔮 'O MAGO HA PARLATO 🔮"**
*"Le stelle ti hanno guardato male oggi, [Segno]..."*

Poi una **previsione random catastrofica ma divertente**, mixando:
- evento assurdo
- conseguenza esagerata
- consiglio scaramantico ridicolo

### Database previsioni (almeno 60, mix per segno)

#### Generiche (per tutti)
- "Domani perderai le chiavi di casa proprio mentre piove. Comprati un ombrello rosso, fa portafortuna."
- "Tra 3 giorni un piccione ti caca in testa. È fortuna, dicono. Bugia, è solo cacca."
- "Hai un esame? Lascia perdere. Vai a mangiare 'na pizza, almeno quella la vinci."
- "La tua ex/o ex ti penserà oggi. Spegni il telefono. SUBITO."
- "Stasera mangerai qualcosa che ti farà stare male. Ma era buono, eh."
- "Troverai 50 centesimi per terra. Saranno gli unici soldi che vedrai questa settimana."
- "Il wifi del tuo vicino smetterà di funzionare. Sì, lo usavi tu."
- "Tua nonna ti chiamerà per chiederti se sei dimagrito. Mentile."

#### Specifiche per segno (esempi)
- **Ariete**: "La tua testa dura ti porterà a sbattere contro un muro. Letteralmente. Stai attento alle porte."
- **Toro**: "Il tuo conto in banca farà 'meno' invece di 'più'. Niente bistecca questa settimana."
- **Gemelli**: "Avrai due idee contemporanee. Saranno entrambe sbagliate."
- **Cancro**: "Piangerai guardando una pubblicità di pasta. È ok, succede."
- **Leone**: "Il tuo ego prenderà uno schiaffo. Ti farà bene. Forse."
- **Vergine**: "Troverai un capello nel tuo cibo. In un ristorante stellato."
- **Bilancia**: "Non riuscirai a decidere cosa mangiare. Finirai per non mangiare."
- **Scorpione**: "Il tuo veleno tornerà indietro. Sì, lo sai di cosa parlo."
- **Sagittario**: "Prenoterai un viaggio. Lo cancelleranno. Non rimborsano."
- **Capricorno**: "Lavorerai gratis. Lo scoprirai dopo."
- **Acquario**: "La tua idea geniale l'ha già avuta uno su TikTok. Tre anni fa."
- **Pesci**: "Sognerai qualcosa di bellissimo. Al risveglio ti dimenticherai tutto."

### Tono delle previsioni
**Esagerato, drammatico, ridicolo**. Mai veramente cattivo. Sempre con un finale comico o un "ma".

Il popup ha:
- Sfondo viola scuro con stelle pixel
- Ritratto del **Mago Astrologo** (NPC barbuto con cappello a stelle, in pixel art)
- Testo che si scrive lettera-per-lettera (effetto typewriter)
- Bottone "ACCETTO IL MIO DESTINO" per chiudere

### Bonus easter egg
Se il giocatore **vince la run** invece di perderla, il Mago dice una **previsione bellissima ma comunque assurda**:
- "Oggi troverai un parcheggio in centro. Sì, anche se è sabato pomeriggio."
- "La cassiera del supermercato ti sorriderà. Non sei tu, è il tuo segno."
- "Il caffè al bar ti uscirà con la schiumetta perfetta. Dura solo oggi però."

---

## 📌 INTEGRAZIONI con il resto del progetto

### Save state aggiornato
```js
{
  meta: {
    coins, unlockedJokers, totalRuns, victories, bestScore,
    zodiac: 'leone',  // ← NUOVO
    predictionsRead: ['gen001', 'leo003']  // per non ripeterle
  },
  ...
}
```

### Schermata zodiacale come pre-game
Aggiungere nella state machine:
```
menu → zodiac (solo prima volta o se richiesto) → game → ...
```

### Boss come modulo data
In `data.js` aggiungere:
```js
const BOSSES = [
  { id:'pulcinella', name:'Pulcinella Nero', portrait: '<svg>...</svg>',
    rule:'no_discard', ruleDesc:'Non puoi scartare',
    intro:"Ah ah ah, scarta 'sta cosa qua!",
    onLose:"A me 'a sai 'a verità?",
    onWin:"Mannaggia, mi hai fottuto." },
  // ...
];
```

### Previsioni come modulo data
```js
const PREDICTIONS = {
  generic: ["Domani perderai...", ...],
  ariete: ["La tua testa dura...", ...],
  // ...
  victory: ["Oggi troverai un parcheggio...", ...]
};

function getPrediction(zodiac, isVictory) {
  const pool = isVictory ? PREDICTIONS.victory
             : [...PREDICTIONS.generic, ...PREDICTIONS[zodiac]];
  return pool[Math.floor(Math.random() * pool.length)];
}
```

---

## 🎬 IL CARATTERE DEL GIOCO IN UNA FRASE

> *"È come se tuo nonno meridionale avesse fatto un videogioco dopo 3 caffè e mezzo bicchiere di amaro, mentre commentava una partita di carte e ti leggeva l'oroscopo del giornale."*

Se ogni decisione di design risponde "sì" a quella vibe → vai. Se no → ripensa.

---

## 🎨 STILE VISIVO — DEFINITIVO (precisazioni importanti)

### Pixel art DEFINITA
Lo stile deve essere **pixel art ma DEFINITA e nitida**, non sgranata o confusa:
- Pixel grandi e ben distinguibili (4×4 o 8×8 px scaled)
- **Outline nere nette** attorno ai personaggi/oggetti (1px nero solido)
- **Colori piatti** dentro le aree, NO gradient morbidi sui pixel
- **Anti-aliasing OFF** (`image-rendering: pixelated`)
- Forme leggibili anche piccole

### Palette VIVACE e GIOCOSA
Colori **saturi, allegri, accesi** — non cupi:
- Verde feltro acceso `#1a8a3e` (non spento)
- Oro brillante `#f4c430` (luccicante)
- Rosso pomodoro `#e63946` (vivo)
- Viola neon `#c77dff` (festoso)
- Azzurro Napoli `#2196f3` (squillante)
- Rosa caramella `#ff6ec7` (per dettagli)
- Bianco panna `#fff8e7` (caldo)
- Nero outline `#1a0a14` (profondo ma non puro)

**Regola**: ogni schermata deve avere **almeno 4 colori vivaci** in vista. Mai monocromatico, mai triste.

### Atmosfera "BISCA ITALIANA"
L'ambientazione visiva deve evocare le **bische clandestine / sale gioco di paese / circoli ricreativi italiani** dove si gioca a:
- **Burraco** (signore eleganti)
- **Tombola** (Natale in famiglia)
- **Briscola/Tressette** (uomini al bar)
- **Scopa** (chiunque, ovunque)

Elementi visivi tipici da inserire:
- 🟢 **Tappeto verde feltro** ovunque (texture rumorosa)
- 🪑 **Sedie di legno** ai lati
- 🚬 **Posaceneri** con sigaretta accesa (animata, fumo che sale)
- ☕ **Tazzina di caffè** mezza piena su un piattino
- 🍷 **Bicchiere di amaro/vino** con riflesso
- 🎰 **Cartelloni della tombola** appesi al muro
- 💡 **Lampadina nuda** che pende dal soffitto, oscilla leggermente
- 📻 **Radiolina vintage** che "trasmette" musica (icona note)
- 🚪 **Porta sul retro** con scritta "USCITA"
- 📅 **Calendario di Frate Indovino** appeso storto
- 🖼️ **Quadretto del Padre Pio** (rispettoso, non blasfemo)
- 🟥 **Insegne neon storte** "APERTO", "BAR", "GIOCHI"
- 🪙 **Monete sparse** sul tavolo
- 📜 **Lavagnetta con punteggi** scritti col gesso

Questi elementi vanno sullo sfondo del gioco, non davanti — danno **contesto e personalità** senza distrarre.

### Stile FIGO MA CAFONE
Il gioco deve essere **bello da guardare ma volutamente kitsch**:
- ✅ Bordi dorati ESAGERATI (border 6px gold)
- ✅ Effetti glitter/sparkle sui jackpot
- ✅ Cuori e stelle disegnate male a posta
- ✅ Mix font che "non dovrebbero stare insieme" (Bungee + corsivo)
- ✅ Drop shadow troppo marcate
- ✅ Gradient saturi rosa→oro→viola
- ✅ Gif stile "anni 2000 Geocities" ma in pixel art
- ❌ MAI minimalismo Apple/Google
- ❌ MAI palette monocromatiche eleganti
- ❌ MAI font sottili e raffinati

**Test**: se sembra fatto da un grafico professionista 2024 → stai sbagliando. Deve sembrare **fatto col cuore da un cugino in Photoshop nel 2003**.

---

## 🐔 LA MASCOTTE — "GENNARINO 'O GALLO"

Il gioco ha una **mascotte ufficiale inventata** che incarna l'italianità del Sud in chiave comica.

### Chi è
**GENNARINO 'O GALLO** — un gallo napoletano antropomorfo, sbruffone, sempre vestito di tutto punto in modo cafone.

### Aspetto (pixel art)
- 🐓 Gallo con cresta rossa enorme e fiera
- 👔 **Camicia bianca aperta** sul petto (anni '80 vibe)
- 🟡 **Catenona d'oro spessa** al collo con un cornetto rosso pendente 🪬
- 🕶️ **Occhiali da sole a goccia** dorati
- 👞 Scarpe lucide marroni
- 💍 Anello con pietra rossa al dito (zampa)
- 🚬 A volte ha un sigaro toscano in bocca
- 📏 Corporatura tarchiata, pancetta da bevuta di amaro
- 🎨 Colori: piume marrone-arancio + dettagli rossi e gialli sgargianti

### Personalità
- **Spaccone** ma in fondo buono
- Si vanta di vincite mai successe ("Una volta vinsi 'a Tombola con tutta 'a cartella!")
- Dà **consigli sbagliati** ma con sicurezza ("Fidate, gioca l'asso, sempre l'asso!")
- Si lamenta del caffè di altre regioni ("Sto caffè è acqua sporca, 'o vero caffè è solo a Napoli!")
- Tifa Napoli (calcio) ma se lo nomini cambia discorso
- Crede a tutte le superstizioni
- Frasi tipiche: "Embè?", "Ué ué ué!", "Madonna mia bella!", "Statte zitto!", "Fidate 'e me!"

### Ruoli nel gioco
1. **Logo del gioco**: Gennarino è nel logo principale, cartellone neon stile pizzeria
2. **Loading screen**: "Aspè 'nu mumento, sto pensanno..." con Gennarino che si gratta la cresta
3. **Tutorial guida**: prima partita lui spiega le regole con frasi tipo "Ué guagliò, mo' te spiego io!"
4. **Reazioni in-game**: appare in piccolo nell'angolo HUD con espressioni diverse:
   - 😎 Soddisfatto (vittoria mano)
   - 😱 Sbalordito (jackpot)
   - 😤 Arrabbiato (sconfitta)
   - 🤔 Pensieroso (turno utente)
   - 😴 Annoiato (idle troppo lungo)
   - 🤑 Avido (apertura lootbox)
5. **Achievement/notifiche**: "Gennarino è fiero di te!" / "Gennarino sta piangendo..."
6. **Negozio**: Gennarino è il commerciante, "Vir' che t'aggio purtato!"
7. **Slot machine**: Gennarino tira la leva con te
8. **Tombola**: Gennarino estrae i numeri urlando "QUARANTASETTE! 'O MUORTO!"
9. **Game over**: Gennarino si toglie gli occhiali e fa una faccia triste
10. **Vittoria finale Ante 8**: Gennarino balla la tarantella in pixel art

### Sprite richiesti (da fare in SVG/CSS)
Ogni sprite è ~64×64 px, pixel art:
- `gennarino_idle` (default)
- `gennarino_happy`
- `gennarino_sad`
- `gennarino_angry`
- `gennarino_shocked`
- `gennarino_thinking`
- `gennarino_dancing` (animato 4 frame)
- `gennarino_winking` (occhio che strizza)
- `gennarino_money_eyes` ($ negli occhi)
- `gennarino_sleeping` (zzz)

### Frasi di Gennarino (database)
Almeno 30 frasi random che appaiono in popup/bubble:
- "Ué guagliò, mo' ti faccio vedè io!"
- "Statte tranquillo, ce penso io!"
- "Fidate 'e zio Gennarino!"
- "Mannaggia 'a Marina, che mano!"
- "Embè? Tutto qua?"
- "Sant'Antonio mio bello!"
- "Mò te spiego comme se fa..."
- "Madonna 'e Pompei!"
- "Aieri sera ho vinto a tombola, giuro!"
- "Stamm a fa' 'a famme!"
- "'O caffè vuò?"
- "Vai tranquillo, va'!"
- "Stutate 'a luce, sto pensando!"
- "Chella è 'na carta tosta!"
- "Mamma mia che sciagura!"
- "Forza Napoli, anche se non c'entra niente!"
- "Statte zitto e gioca!"
- "Ammuoina! Ammuoina!"
- "Vincimm 'sta partita e poi se magna!"
- "'O Munaciello me sta verenno..."

### Logo del gioco con Gennarino
Schermata menu principale: **logo BRISCOLA ROYALE** con Gennarino accanto che fa l'occhiolino, una zampa appoggiata al titolo, l'altra con un mazzo di carte, sigaro in bocca, occhiali da sole. Sotto scritta neon "★ APERTO 24/7 ★" lampeggiante.

### Merchandise potenziale (per il futuro)
Gennarino è anche un **asset di brand** spendibile:
- Sticker WhatsApp/Telegram
- T-shirt con "Fidate 'e zio Gennarino!"
- NFT? (solo se progetto va virale)
- Pupazzo peluche da fiera
- Profilo Instagram del personaggio (marketing)

---

## 🎯 RIASSUNTO STILE IN UNA FRASE

> *"Pixel art definita e colorata, atmosfera da bisca italiana del Sud anni '90, mascotte gallo cafone con catenona d'oro che ti accompagna. Figo ma volutamente kitsch. Tutto deve sembrare uscito da una sala giochi di paese durante la sagra patronale, illuminata male, con la radio che gracchia e il profumo di sfincione."*

---

## 🗣️ LINGUA E LOCALIZZAZIONE

### Filosofia linguistica
Il gioco usa un **mix di dialetti del Sud Italia** (molisano, napoletano, pugliese, calabrese, siciliano) per dare colore e autenticità, MA deve restare **comprensibile a qualsiasi italiano** e **facilmente traducibile** in altre lingue.

### Regola dei 2 livelli (CRITICA)
Ogni testo nel gioco appartiene a **uno di due livelli**:

**LIVELLO 1 — TESTI FUNZIONALI** (gameplay critico)
- Tutto ciò che serve per CAPIRE COSA SUCCEDE nel gioco
- DEVE essere in **italiano standard** (o dialetto talmente leggero da essere ovvio)
- DEVE essere **traducibile 1:1** in altre lingue
- Esempi: "Gioca", "Scarta", "Punteggio", "Mano", "Mazzo", "Vittoria", "Sconfitta", "Negozio", "Carta", "Briscola", regole dei boss, descrizioni Joker, target di punteggio

**LIVELLO 2 — TESTI DI COLORE** (sapore/atmosfera)
- Frasi di Gennarino, dialoghi NPC, commenti, esclamazioni, frasi flavor
- POSSONO essere in **dialetto stretto, mix Sud, slang**
- NON devono essere capite parola per parola, basta che si **intuisca il tono**
- Vanno **tradotte in modo equivalente culturale** (non letterale) nelle altre lingue
- Esempi: "Ué guagliò!", "Mannaggia 'a Marina!", "Statte zitto e gioca!"

### Esempio pratico — dialogo boss
```
[LIVELLO 1 - sempre comprensibile]
"Boss: Pulcinella Nero"
"Regola: Non puoi scartare carte"
"Punteggio richiesto: 1200"
"Mani: 4 | Scarti: 0"

[LIVELLO 2 - colore, dialettale]
Pulcinella entra: "Ah ah ah, scarta 'sta cosa qua, guagliò!"
```

L'utente capisce TUTTO ciò che gli serve per giocare anche se non capisce la frase di Pulcinella. La frase è solo flavor.

### Mix dialettale — proporzioni suggerite
Il "dialetto" del gioco è una **lingua finta** che mescola:
- 50% **napoletano** (più riconoscibile, base)
- 20% **molisano** (radici dell'autore, parole specifiche)
- 15% **pugliese** (cadenze, esclamazioni)
- 10% **calabrese** (espressioni forti)
- 5% **siciliano** (occasionalmente)

Non è filologicamente corretto: è **un dialetto-fantasia del Sud Italia** unificato. Inteso come omaggio affettuoso, non come imitazione precisa di una zona.

### Glossario interno (per coerenza)
Parole/espressioni che ricorrono nel gioco — usate sempre uguali per non confondere:
- **Guagliò** = ragazzo (vocativo, napoletano) → tradurre come "buddy", "mate", "tío"
- **Ué** = ehi (esclamazione)
- **Mannaggia** = accidenti
- **Statte** = stai (imperativo)
- **Embè** = e allora?
- **Mo'** = adesso
- **Pe'** = per
- **'O / 'A / 'E** = il / la / le-gli
- **Comme** = come
- **Vir'** = vedi
- **Aspè** = aspetta
- **Sciagura** = disgrazia (drammatico)
- **Ammuoina** = caos, baccano
- **Pazzariello** = pazzerello
- **Munaciello** = monachello (folklore)
- **Ducato** = moneta del gioco (italiano storico, comprensibile)

### Lista PAROLE FUNZIONALI da NON dialettizzare mai
Queste parole devono essere SEMPRE in italiano standard, in tutte le UI critiche:

```
Gioca · Scarta · Mazzo · Mano · Carta · Punteggio · Punti · Bonus
Moltiplicatore · Vittoria · Sconfitta · Continua · Esci · Menu
Negozio · Acquista · Vendi · Pacchetto · Lootbox · Joker · Tarocco
Boss · Livello · Round · Ante · Briscola · Seme · Asso · Re
Cavallo · Fante · Bastoni · Coppe · Denari · Spade · Settebello
Napoletana · Tris · Coppia · Carico · Primiera · Scopa
Salva · Carica · Impostazioni · Audio · Volume · Difficoltà
Vinci · Perdi · Pareggio · Target · Obiettivo · Tempo · Turno
```

### Database localizzazione futura
Tutti i testi del gioco vanno organizzati in `data.js` come oggetti `{it, en, es, ...}`:

```js
const STRINGS = {
  ui: {
    play: { it: "Gioca", en: "Play", es: "Jugar", fr: "Jouer" },
    discard: { it: "Scarta", en: "Discard", es: "Descartar" },
    score: { it: "Punteggio", en: "Score", es: "Puntuación" },
    // ... etc
  },
  flavor: {
    gennarino_intro: {
      it: "Ué guagliò, mo' te faccio vedè io!",
      en: "Hey buddy, watch this!",
      es: "¡Eh tío, mira esto!",
      fr: "Hé, regarde ça mon pote!"
    },
    // ...
  },
  bosses: {
    pulcinella_intro: {
      it: "Ah ah ah, scarta 'sta cosa qua!",
      en: "Ha ha ha, try discarding NOW!",
      es: "¡Ja ja ja, descarta ahora si puedes!"
    }
  }
};

function t(key, lang = STATE.lang || 'it') {
  const path = key.split('.');
  let val = STRINGS;
  for (const p of path) val = val?.[p];
  return val?.[lang] || val?.it || key;
}

// Uso: t('ui.play') → "Gioca"
//      t('flavor.gennarino_intro') → "Ué guagliò..."
```

### Strategia traduzione flavor (importante!)
Le frasi flavor NON vanno tradotte letteralmente. Vanno **adattate culturalmente**:

| Italiano (originale) | Inglese (NO letterale) | Inglese (SÌ adattato) |
|---|---|---|
| "Mannaggia 'a Marina!" | "Damn the Navy!" ❌ | "Holy mackerel!" ✅ |
| "Ué guagliò!" | "Hey young man!" ❌ | "Yo dawg!" / "Mate!" ✅ |
| "Statte zitto!" | "Be quiet!" ❌ | "Pipe down!" ✅ |
| "Fidate 'e me!" | "Trust of me!" ❌ | "Trust your boy!" ✅ |
| "Madonna mia bella!" | "My beautiful Madonna!" ❌ | "Mamma mia!" / "Holy moly!" ✅ |

Per ogni lingua target, trovare **slang regionale** equivalente (Cockney per UK, Brooklyn per USA, andaluso per Spagna, marsigliese per Francia, ecc.).

### Test di comprensibilità
Per ogni testo nuovo, fare il test mentale:
1. **Un italiano del Nord che non ha mai sentito dialetto sud → capisce cosa succede nel gioco?**
   - Se è LIVELLO 1 (funzionale): SÌ, sempre
   - Se è LIVELLO 2 (flavor): basta che ne capisca il tono (felice/arrabbiato/sorpreso)

2. **Un americano che usa Google Translate → capisce le regole?**
   - SÌ per il LIVELLO 1
   - LIVELLO 2 può perdere senso (e va bene, è flavor)

3. **Si può tradurre senza riscrivere il gioco?**
   - SÌ se i testi sono in `STRINGS` con chiavi
   - NO se sono hardcoded → da rifattorizzare

### Versione lingua di default
Lancio in **italiano**, struttura pronta per:
- 🇬🇧 Inglese (espansione globale)
- 🇪🇸 Spagnolo (mercato LATAM, vibe simile al Sud Italia)
- 🇫🇷 Francese (mercato vicino)
- 🇩🇪 Tedesco (forte interesse per giochi di carte)
- 🇧🇷 Portoghese-BR (cultura simile, gioco di carte forte)

### Selettore lingua
Nel menu impostazioni, bandiera + nome lingua. Salvato in `STATE.lang` e localStorage.

### Easter egg lingua segreta
Konami code → modalità **"DIALETTO STRETTO"**: TUTTO il gioco (anche i testi funzionali) diventa in dialetto strettissimo. Per veri puristi che vogliono ridere. Disattivabile.

---

## 🎯 PRINCIPIO GUIDA LINGUISTICO

> *"Il dialetto è il sale del gioco. Ma il pane (le regole) deve essere uguale per tutti, sennò nessuno mangia."*

Tradotto in pratica:
- **Pane** (gameplay, UI critica) → italiano standard, traducibile
- **Sale** (flavor, personaggi, esclamazioni) → dialetto Sud mix, adattabile

Senza il sale è insipido. Senza il pane non si mangia.

---

## 👕 GENNARINO — DETTAGLIO COSTUME UFFICIALE

**Aggiornamento outfit della mascotte** (sostituisce/integra la descrizione precedente):

Gennarino 'O Gallo indossa la **maglietta di Maradona**:
- 🔵 **Maglia Napoli azzurra anni '86-'90** (l'iconica casacca)
- 🔢 Numero **10** sulla schiena giallo
- ✏️ Scritta "MARADONA" sopra il numero
- 🏷️ Sponsor finto sul petto (per evitare problemi legali): scritta "MAMMÀ" o "PIZZÀ" al posto di Mars/Buitoni
- 🟡 Bordini gialli su collo e maniche
- ⚽ A volte con un pallone sotto la zampa (sprite alternativo "modalità tifoso")

**Sopra la maglia**: mantiene la **catenona d'oro** col cornetto rosso (resta visibile sopra la maglietta, perché Gennarino è coatto)

**Espressioni con la maglia**:
- Quando vince: bacia lo stemma sul petto (frame animato)
- Quando perde: si tira la maglia sopra la testa stile calciatore disperato
- Quando esulta: la solleva mostrando una **canottiera bianca sotto** con scritta "FORZA SUD"

**Note legali pratiche**: NON usare loghi reali (Napoli SSC, Adidas, Coca-Cola). Tutto **disegnato a mano in pixel art**, con riferimenti chiari ma non identici. Lo stile dev'essere "evidente omaggio" non "copia".

---

## 🔊 SOUND DESIGN — DEFINITIVO

### Filosofia audio
**Stile Super Mario / Nintendo** (chiptune cristallino, riconoscibile, NON fastidioso) **+ identità culturale italiana** (campioni e melodie che evocano il Sud).

Ogni interazione DEVE avere un suono **distinguibile, breve, soddisfacente**. Il suono è parte del gameplay loop: senza, il gioco perde il 50% della sua "juice".

### Regole tecniche
- **TUTTO sintetizzato via Web Audio API** (no file audio esterni, no MP3, no WAV)
- Funzione `beep()` base (vedi appendice tecnica) come building block
- Helper `playMelody([{freq, dur, type}])` per sequenze
- Helper `playChord([freq1, freq2, freq3], dur)` per accordi
- Volume globale controllabile (slider impostazioni)
- Mute toggle prominente (M key + bottone UI)

### Library sound effects (almeno 30 SFX)

**🃏 Carte**
- `card_select` — pluck corto (square 600Hz, 40ms) — quando clicchi una carta
- `card_deselect` — pluck inverso (square 400Hz, 40ms)
- `card_deal` — sweep ascendente (sawtooth 200→800Hz, 80ms) × ripetuto per ogni carta distribuita
- `card_play` — "tonk" + chime (square 200Hz 50ms + sine 1000Hz 100ms)
- `card_discard` — "fwsh" rumore breve (noise burst, lowpass)
- `card_flip` — colpetto secco (triangle 500Hz, 30ms)

**💰 Punteggio e money**
- `chip_count` — bip ripetuto crescente per ogni chip che si somma (sine 800→1200Hz pulse)
- `mult_increase` — ding salendo (chord C-E-G ascending)
- `score_explode` — esplosione melodica (arpeggio C-E-G-C-E quick + low boom)
- `coin_get` — il classico "ding!" mario-style (square 988Hz → 1318Hz, 60ms ognuno)
- `coin_lose` — ding triste (square 800Hz → 600Hz)

**🎰 Slot machine**
- `slot_lever` — "click-clunk" meccanico (low square 80Hz + click)
- `slot_reel_spin` — wobble continuo (triangle 400Hz tremolo) loop fino a stop
- `slot_reel_stop` — "thunk" (low square 100Hz, 100ms)
- `slot_win_small` — fanfara breve 4 note ascendenti
- `slot_jackpot` — fanfara LUNGA (8 note + arpeggio + bell ringing 5×)

**🎲 Tombola**
- `tombola_extract` — drumroll (noise filtered) + pop (square 600Hz)
- `tombola_number` — voce sintetica (formant synth) "QUARANTASETTE!" — opzionale, può essere solo beep
- `tombola_line` — 3 ding ascendenti
- `tombola_full` — fanfara vittoria

**👹 Boss**
- `boss_appear` — drone basso minaccioso (sawtooth 80Hz + noise, 1s) + risata sintetica
- `boss_speak` — bip-bip stile JRPG (square 400Hz, 20ms × ogni 2 lettere)
- `boss_defeat` — esplosione + scala discendente
- `boss_win` — drone tragico (minor chord)

**🐔 Gennarino**
- `gennarino_speak` — bip caratteristico (square 700Hz, 30ms × ogni lettera)
- `gennarino_happy` — chicchirichì sintetico (3 note ascendenti rapide)
- `gennarino_sad` — wah-wah scendente (triangle 500→200Hz, 400ms)
- `gennarino_money` — "cha-ching!" registratore di cassa (chord + chime)

**🛒 UI / Shop**
- `button_click` — pop secco (square 1000Hz, 20ms)
- `button_hover` — tick lieve (sine 1200Hz, 10ms)
- `purchase` — chord positivo + ding
- `error` — buzz breve (sawtooth 150Hz, 100ms)
- `tab_switch` — sweep (square 400→600Hz, 40ms)

**⭐ Speciali**
- `level_up` — fanfara ascendente Mario-style (5 note rapide)
- `victory_run` — fanfara LUNGA stile fine livello Mario
- `defeat_run` — melodia triste (3-4 note minor key)
- `prediction_appear` — chime mistico (sine 800Hz vibrato + reverb)

### Esempi di implementazione

**Coin get (Mario style)**:
```js
function sfxCoin() {
  beep(988, 60, 'square', 0.15);
  setTimeout(() => beep(1318, 100, 'square', 0.15), 60);
}
```

**Jackpot fanfare**:
```js
function sfxJackpot() {
  const notes = [523, 659, 784, 1046, 1318, 1568, 2093]; // C E G C E G C
  notes.forEach((f, i) => setTimeout(() => beep(f, 120, 'square', 0.15), i * 100));
  // Bell ringing
  for (let i = 0; i < 5; i++) {
    setTimeout(() => beep(2093, 80, 'sine', 0.1), 800 + i * 150);
  }
}
```

**Gennarino speaking (bip per ogni lettera)**:
```js
function sfxGennarinoSpeak(text) {
  for (let i = 0; i < text.length; i++) {
    if (text[i].match(/\w/)) {
      setTimeout(() => beep(700 + (i % 3) * 50, 25, 'square', 0.08), i * 40);
    }
  }
}
```

### Suoni "italiani" iconici da inserire (in chiptune)

Piccole **citazioni musicali** che evocano cultura italiana, riconoscibili in 1 secondo:
- 📯 **"Tarantella" snippet** (5-6 note in scala napoletana minore) — quando vinci una run
- 🎺 **"Funiculì funiculà" frammento** (3 note iniziali) — quando appare un boss napoletano
- ⚽ **"Olè olè olè" (stadio)** — quando fai un combo enorme
- 🎵 **Arpeggio "O sole mio"** (prime 4 note) — apertura schermata menu
- 🍕 **Whistle "Pulcinella"** — quando appare Pulcinella come boss

**Importante**: solo le note (melodie tradizionali = pubblico dominio). NON usare versioni registrate di canzoni moderne.

---

## 🎼 COLONNA SONORA — MUSICA NEOMELODICA SYNTH

### Vibe target
**Musica neomelodica napoletana** (Gigi D'Alessio, Nino D'Angelo, Tony Colombo) **MA in versione 100% strumentale chiptune/synth**. Senza voce, senza parole. Solo melodia + bassline + percussioni elettroniche.

L'effetto che deve dare:
- 🎹 Tastiera Yamaha PSR anni '90 di matrimonio sud-italiano
- 🎹 Karaoke da bar con basi MIDI su CD masterizzato
- 🎮 Soundtrack videogioco 16-bit (SNES, Mega Drive)
- 🇮🇹 Atmosfera melodrammatica ma in chiave divertente

**NON deve diventare**:
- ❌ Triste o lamentosa
- ❌ Serissima/operistica
- ❌ Hardcore EDM
- ❌ Generica "background music" anonima

### Caratteristiche tecniche

**Strumenti sintetizzati (Web Audio API oscillatori)**:
- 🎹 **Lead melodico**: square wave con vibrato (la "voce" cantante)
- 🎶 **Counter-melody**: triangle wave (decorazioni)
- 🎵 **Bassline**: sawtooth filtrato lowpass (basso pulsante)
- 🥁 **Drum kick**: noise burst short low-pass
- 🥁 **Drum snare**: noise burst short high-pass
- 🎹 **Chord pad**: 2-3 sine wave sovrapposte (accompagnamento)
- 🔔 **Bell accent**: sine wave alta con decay rapido

**Scala musicale tipica neomelodica**:
- Tonalità **MINORE** (Re minore, Mi minore, La minore)
- Uso di **scala armonica minore** (con 7° aumentato) → effetto "drammatico napoletano"
- BPM: **90-110** (moderato, ballabile in casa)
- Time signature: **4/4** (mai dispari)
- Pattern ritmico drum: **"boom-tss-boom-boom-tss"** (kick-snare classico semplice)

### Struttura brani (8-16 bar loop)
Ogni traccia loopa senza stancare grazie a:
- **Variazioni** ogni 4 bar (cambia ottava lead, aggiunge bell, toglie drum)
- **Build-up** verso il loop point (drum fill, sweep)
- **Layer attivabili dinamicamente** (es. quando boss appare → entra synth lead extra drammatico)

### Tracce richieste (almeno 6)

1. **`bgm_menu`** — Menu principale
   - Vibe: "neomelodica orgogliosa"
   - Lead allegro stile "Chillo te vò bene", chord cantabili
   - Esempio progressione: Dm - Bb - F - C (loop)

2. **`bgm_game_normal`** — Round normali
   - Vibe: tensione contenuta, ritmo costante
   - Bassline pulsante 8th notes
   - Lead più discreto, lascia spazio agli SFX

3. **`bgm_game_boss`** — Boss blind
   - Vibe: drammatica neomelodica "tragedia"
   - Tonalità minore stretta, più bassi
   - Drum più pesante (kick raddoppiato)
   - Lead synth con vibrato esagerato

4. **`bgm_shop`** — Negozio
   - Vibe: "rilassato da bar di paese"
   - BPM più lento (80)
   - Strumenti tipo "fisarmonica synth" (sawtooth filtrato + tremolo)

5. **`bgm_slot`** — Slot machine
   - Vibe: "casinò da sagra"
   - Più festoso, drum disco da matrimonio (4-on-floor)
   - Bell accents frequenti

6. **`bgm_victory`** — Schermata vittoria run
   - Vibe: TARANTELLA SYNTH ESAGERATA
   - BPM 130, drum frenetico
   - Lead in 6/8 con tutte le note possibili
   - Si può ascoltare a loop e fa solo ridere

### Implementazione tecnica

**Sequencer semplice**:
```js
// Note in Hz (ottava 4)
const NOTES = {
  C: 261.63, D: 293.66, E: 329.63, F: 349.23,
  G: 392, A: 440, B: 493.88,
  Cs: 277.18, Ds: 311.13, Fs: 369.99, Gs: 415.30, As: 466.16
};

class MusicTrack {
  constructor(bpm, pattern) {
    this.bpm = bpm;
    this.pattern = pattern; // [[noteFreq, beats], ...]
    this.playing = false;
  }
  
  play() {
    if (this.playing) return;
    this.playing = true;
    this.loop();
  }
  
  loop() {
    if (!this.playing) return;
    const beatMs = 60000 / this.bpm / 4; // 16th notes
    let t = 0;
    for (const [freq, beats] of this.pattern) {
      if (freq) {
        setTimeout(() => beep(freq, beats * beatMs * 0.9, 'square', 0.1), t);
      }
      t += beats * beatMs;
    }
    setTimeout(() => this.loop(), t);
  }
  
  stop() { this.playing = false; }
}

// Esempio pattern menu (8 bar in Dm)
const menuLead = [
  [NOTES.D, 1], [NOTES.F, 1], [NOTES.A, 2],
  [NOTES.G, 1], [NOTES.F, 1], [NOTES.E, 2],
  // ... etc
];
```

**Layered tracks**: ogni BGM è composto da 3-4 layer attivabili:
- Layer 1: drum + bass (sempre on)
- Layer 2: chord pad (on durante gameplay)
- Layer 3: lead melody (on dopo 4 bar)
- Layer 4: bell accents (on durante combo grandi)

Questo evita che il loop annoi: nuovi elementi entrano gradualmente.

### Volume e mixing
- BGM volume default: **40%** (mai sopra)
- SFX volume default: **80%** (devono prevalere sulla musica)
- Slider separati per BGM e SFX in impostazioni
- Quando appare un popup importante (boss, jackpot): BGM si abbassa al 20% per 2 sec ("ducking")

### Toggle musica
- Bottone 🎵 sempre visibile in HUD
- Tasto **M** = mute/unmute
- Salvato in localStorage `STATE.settings.musicVolume`
- All'avvio musica parte automaticamente SOLO dopo prima interazione utente (policy autoplay browser)

### Easter egg musicale
Konami code (oltre dialetto stretto) → sblocca **"MODALITÀ MATRIMONIO"**: la BGM diventa una versione esagerata neomelodica con tutti i layer al massimo + vocalizzi "ahhh-ahhh" (sintetizzati con formant). Riproduce la sensazione del DJ del matrimonio del cugino.

---

## 🎯 PRINCIPIO AUDIO IN UNA FRASE

> *"Mario incontra Gigi D'Alessio in una sala giochi del 1995. Suoni cristallini, melodie cantabili, drammaticità napoletana ma sempre allegra. Mai noioso, mai serio, sempre riconoscibile."*

Test definitivo: se chiudi gli occhi e senti solo l'audio del gioco, devi capire **subito** che è un gioco italiano. Non generico. **Italiano del Sud, fiero e cafone.**
