# BRISCOLA ROYALE — Monetization Design

> Documento di riferimento per l'agente `/monetization`.
> Tutto in DEMO MODE per la v1. Nessuna transazione reale.
> **Ultima revisione: audit completo 2026-05-01**

---

## Filosofia di Monetizzazione

**Regola fondamentale**: la v1 è **free, single-player, senza pagamenti reali**. Le microtransazioni esistono per:
1. Validare il loop economico (gli utenti cliccano "Compra"?)
2. Creare screenshot marketing (la UI cafona diventa meme)
3. Costruire la struttura per la v2 reale
4. Non mettere MAI in difficoltà il giocatore: DEMO MODE assegna gratis ciò che "comprerebbero"

**Principi non negoziabili (audit confermati):**
- Drop rates SEMPRE visibili in UI prima dell'acquisto
- Pity counter SEMPRE visibile nell'UI lootbox ("Mancano X aperture alla garanzia")
- Nessun testo di pressione temporale ("Solo per oggi!", countdown artificiali)
- I joker da lootbox NON sono più forti di quelli nel negozio in-game
- Il DEMO MODE banner deve essere prominente — nessun utente deve pensare di spendere soldi veri

---

## Valuta di Gioco: Ducati 💰

Unica valuta in-game. Si guadagna giocando, si spende nel negozio tra i blind.

### Fonti di ducati
| Fonte | Importo |
|-------|---------|
| Vincere Small Blind | 3💰 base |
| Vincere Big Blind | 4💰 base |
| Vincere Boss Blind | 5💰 base |
| Mano non usata | +1💰 per mano |
| Scarto non usato | +1💰 per scarto |
| Interesse (ogni 5💰 in tasca, max +5💰) | +1-5💰 |
| Slot machine — piccola vincita | 20-80💰 |
| Tombola — riga/colonna | 10-30💰 |
| DEMO MODE — "acquisto" fake | varia |

### Usi dei ducati
- Negozio tra blind (joker, tarocchi, pacchetti)
- Slot machine (10💰 a partita, max 3 per shop visita)
- Tombola (gratuita, ma premia ducati)
- Lootbox (50/120/300💰)

---

## Economia Ducati — Simulazione Verificata

### Entrate run completa (8 ante × 3 blind = 24 blind)

| Fonte | Importo stimato |
|-------|----------------|
| Guadagno base (3+4+5) × 8 ante | 96💰 |
| Bonus mani salvate (~1/blind) | ~24💰 |
| Bonus scarti salvati (~1/blind) | ~24💰 |
| Interesse accumulato | ~15-20💰 |
| **TOTALE GREZZO** | **~155-165💰** |

### Verifica target BRIEF
- **Giocatore frugale** (non compra quasi nulla): finisce con ~80-100💰
  → Sink consigliato: 2-3 acquisti per run = ~50-80💰 spesi
  → Lootbox Iniziato disponibili a fine run: 1-2 aperture
- **Giocatore ottimizzatore** (compra ogni shop visita): finisce con 0-20💰
  → Deve fare scelte difficili (joker raro vs 2 common vs reroll)
  → Tensione economica è il cuore del loop

### Budget per shop visita
Ogni shop visita avviene dopo un blind (guadagno ~6-8💰). Prezzi attuali:
- Joker common: 4💰 → acquistabile ogni visita
- Joker uncommon: 6💰 → con risparmio dal blind precedente
- Tarocco: 3💰 → quasi sempre affordabile
- Primo reroll: 5💰 → ragionevole (secondo = 10💰, terzo = 20💰)

**Tensione di design corretta**: il giocatore può comprare 1 cosa per visita "facilmente",
2 cose con sacrificio, 3 cose solo se ha risparmiato. Questa è la tensione voluta.

### Sistema interesse
Con 25💰 in tasca → +5💰 bonus per ogni blind (massimo).
Il Capricorno zodiac raddoppia questo a +10💰/blind — deliberato come vantaggio di segno.
**Non superare 5💰 di interestMax** (senza zodiac): creerebbe snowball economy sbilanciata.

---

## Negozio Premium (Fake Microtransazioni)

Accessibile dal menu principale. **DEMO MODE sempre attivo**.

### Contenuto pacchetti — valori giustificati per prezzo percepito

| Nome | Prezzo fake | Contenuto DEMO | Valore percepito |
|------|-------------|----------------|-----------------|
| 🚬 Pacchetto Tabacchi | €1,99 | 100💰 + 1 lootbox Iniziato | ~2 run di ducati gratis + bonus apertura |
| 💰 Cassaforte d'Oro | €4,99 | 500💰 + 3 lootbox Adepto | ~3 run di ducati + 15 carte lootbox |
| 🎰 Jackpot Pack | €9,99 | 1.500💰 + 10 lootbox Maestro + 1 Joker Leggendario | Il joker garantito è il vero selling point |
| 👑 Battle Pass Pulcinella | €14,99 | Skin + 5 skin Gennarino + 30 gg access | Valore cosmetico puro, zero pay-to-win |

**Perché il Jackpot Pack funziona**: il Joker Leggendario garantito è un oggetto che il giocatore
vuole disperatamente ma raramente ottiene. È percepito come "giusto" riceverlo a quel prezzo.
Il giocatore sa che è fake, ma il momento WOW dell'apertura è reale.

**Perché il Battle Pass funziona**: skin per Gennarino = personalizzazione della mascotte.
Il giocatore si affeziona a Gennarino → vuole vestirlo in modo speciale.

### UI checkout cafona (specifica per shop.js)
1. Click "COMPRA" → sfondo scuro overlay (dimming)
2. Animazione carta di credito CSS che scivola dentro lo schermo da destra
3. Progress bar rossa e oro: "ELABORAZIONE IN CORSO... 3... 2... 1..."
4. Effetto glitch / disturbo TV per 0.5 secondi
5. Popup verde sgargiante: "DEMO MODE ATTIVATO! Nella versione finale avresti speso €X. Per ora ti regaliamo tutto! 🎉"
6. Assegna valuta/contenuto gratis con effetti visivi (coins che piovono)
7. Gennarino appare con `money_eyes` emotion: "GRATIS? Madonna mia, so' troppo buono!"

**VIETATO**: nessun timer di scadenza, nessuna "offerta limitata", nessun confronto con amici.

---

## Lootbox System

### 3 tier di lootbox — drop rates verificati

| Lootbox | Costo | Carte | Common | Uncommon | Rare | Legendary |
|---------|-------|-------|--------|----------|------|-----------|
| 📦 Iniziato | 50💰 | 3 | 80% | 18% | 2% | 0% |
| 📦 Adepto | 120💰 | 5 | 60% | 30% | 9% | 1% |
| 📦 Maestro | 300💰 | 10 | 40% | 40% | 15% | 5% |

**VERIFICA SOMME**: ogni tier somma esattamente a 100% ✓

### ROI monetario (audit)
Usando costo joker come proxy per valore percepito (common=4, uncommon=6, rare=8, legendary=20):

| Tier | EV per carta | EV totale | ROI% |
|------|-------------|-----------|------|
| Iniziato | 4.44💰 | 13.3💰 | 27% |
| Adepto | 5.12💰 | 25.6💰 | 21% |
| Maestro | 6.20💰 | 62.0💰 | 21% |

Il ROI negativo è **corretto e intenzionale**: si paga l'emozione e la speranza, non il valore matematico.
Il valore percepito (l'animazione, la sorpresa) vale molto di più del ROI monetario.

### Differenziazione tier — è abbastanza?
- Iniziato → Adepto: probability rare sale da 2% a 9% (+350%), legendary da 0% a 1%. **Differenza percepita: ALTA** ✓
- Adepto → Maestro: probability rare sale da 9% a 15% (+67%), legendary da 1% a 5% (+400%). **Differenza percepita: ALTA** ✓
La progressione dei tier è ben differenziata.

### Animazione apertura (specifica per shop.js)
1. Pacchetto SVG al centro schermo — trema leggermente (CSS shake 0.5s)
2. Click → esplosione di luce (radial-gradient che si espande, opacity 0→1→0, 0.8s)
3. Carte che volano fuori una per una con flip animation (delay 0.3s tra carte)
4. Ogni carta: mostra rarità con colore bordo (grigio/verde/blu/oro scintillante)
5. Joker Legendary: screen shake + jackpot SFX + Gennarino `shocked` + testo "LEGGENDARIO!" pulsante
6. Recap finale: "Hai ottenuto: X Common, Y Uncommon, Z Rari"
7. Questa è la schermata più visivamente spettacolare del gioco — investire qui in juice

### Pity Timer — [FIX CRITICO]

**PROBLEMA rilevato in audit**: pity legendary a 50 aperture Maestro richiedeva 50 × 300💰 = 15.000💰.
Con ~155💰/run, ci vorrebbero ~97 run per triggerare. Una promessa non mantenibile = danno alla fiducia.

**FIX applicato**: il contatore pity è **cross-tier** (conta TUTTE le aperture di qualunque tier).
- Dopo 20 aperture totali senza rare → **prossima apertura garantisce rare+**
- Dopo 50 aperture totali senza legendary → **prossima apertura garantisce legendary**

Costo realistico per pity legendary (mix tipico):
- 50 aperture miste ≈ 30 Iniziato + 15 Adepto + 5 Maestro = 1.500+1.800+1.500 = 4.800💰
- Raggiungibile in 30-35 run (20-25 ore). Accettabile per un gioco di progressione.

**Il pity counter è VISIBILE in UI**: "Prossima rare garantita tra X aperture" — principio "cafone ma onesto".

Il contatore è salvato in `STATE.meta.lootboxPity = { sinceRare: 0, sinceLegendary: 0 }`.
`BALANCE.pityCounterShared = true` indica a shop.js che il contatore è condiviso tra tier.

---

## Battle Pass Pulcinella

Struttura di progressione a **30 livelli** (durata simulata, no scadenza vera in demo).

### XP per azione (da BALANCE)
| Azione | XP |
|--------|----|
| Vincere un blind qualunque | +1 XP |
| Vincere un boss blind | +2 XP (include il base) |
| Completare un'Ante ≥ 4 | +2 XP bonus |
| Vittoria run completa (8 ante) | +5 XP bonus |

**XP per livello**: 3 XP (costante, semplice da capire)

**Simulazione completamento**:
- Run media = 24 blind × 1xp + 8 boss blind × 1xp + 1xp vittoria = ~33xp
- 30 livelli × 3xp = 90xp → circa 3 run per completare (~3 ore)
- Accettabile: non richiede grind eccessivo, ma nemmeno finisce in 1 run

### Ricompense per livello
| Livelli | Ricompensa | Note |
|---------|-----------|------|
| 1, 3, 5 | 20💰 per livello | Feedback immediato early |
| 6-8 | Skin carte (bordo colorato) | Primo cambio estetico |
| 9-10 | 50💰 + 1 lootbox Adepto | Ricompensa sostanziosa |
| 11-13 | Skin Gennarino: Pulcinella | Mascotte che cambia look |
| 14-15 | 50💰 | Breathing room |
| 16-18 | Joker esclusivo Battle Pass | Cosmetically unique, bilanciato = rare normale |
| 19-20 | Skin carte Dark Mode | Cambio estetico significativo |
| 21-25 | 20💰 per livello + lootbox | Mantenere momentum |
| 26-28 | Skin Boss Pulcinella speciale | Momenti WOW visivo sui boss |
| 29 | 100💰 | Penultimo step — spinta finale |
| 30 | Skin "Oro Puro" + Gennarino "San Gennaro" + 200💰 | GRAN FINALE degno |

**Principio**: le prime ricompense sono frequenti e visibili. Le ultime sono rare e spettacolari.

### Free vs Premium track
**Tutto il Battle Pass è sbloccabile senza acquistare in DEMO MODE**.
Nella v2 reale, la track free darebbe ducati e lootbox, la track premium aggiungerebbe skin esclusive.
**MAI** mettere joker o potenziamenti gameplay dietro paywall — solo cosmetici.

### UI Battle Pass
- Track orizzontale con icone ricompense (scorribile)
- Indicatore "Livello X / 30" prominente
- Progress bar XP colorata (verde-oro)
- Animazione "LIVELLO SU!" con sound effect fanfara
- Lucchetto per livelli non ancora raggiunti (non opaco — si vede cosa aspetta)
- Gennarino `happy` appare a ogni livello conquistato

---

## Skin Sistema

### Principio fondamentale
**Le skin sono ESCLUSIVAMENTE cosmetiche.** Zero vantaggio gameplay.
Il giocatore con skin default e quello con skin "Oro Puro" hanno esattamente le stesse probabilità di vincita.

### Skin Carte
| Skin | Sblocco | Descrizione |
|------|---------|-------------|
| Default | Sempre disponibile | Ottone + bianco panna classico |
| Napoletana Classica | Battle Pass lv.8 | Bordo rosso, sfondo giallo caldo |
| Dark Mode | Battle Pass lv.19 | Bordo viola, sfondo antracite |
| Oro Puro | Battle Pass lv.30 / Jackpot Pack | Bordo doppio dorato con brillantini |
| Pizza | Easter egg (Konami code) | Le carte diventano pizze margherita |

### Skin Gennarino
| Skin | Sblocco | Descrizione |
|------|---------|-------------|
| Default (Maradona) | Sempre | Maglia Napoli anni '86 + catenona |
| Pulcinella | Battle Pass lv.13 | Maschera bianca + cappello conico |
| San Gennaro | Vittoria run completa | Aureola + vestito rosso |
| Barista | Battle Pass lv.28 | Grembiule, tazzina in mano |
| Tifoso | Easter egg (10 run completate) | Sciarpa Napoli + pallone |

---

## Trigger di Monetizzazione nell'UI — 5 Momenti Chiave

Questi sono i punti nel flow dove il giocatore è più incline a interagire con la monetizzazione.
**Tutti devono essere presenti nell'implementazione di shop.js / app.js.**

### 1. Post-vittoria boss blind (Momento di Euforia)
Appena sconfitto un boss → HUD mostra "+5💰 + BONUS BOSS" → toast:
"Hai ancora [N]💰. Vuoi aprire una lootbox? 📦"
**Perché funziona**: il giocatore è euforico, ha appena guadagnato, si sente invincibile.

### 2. Game Over (Momento di Rabbia/Voglia di Rivincita)
Prima della schermata "Riprova?" → mostra:
"Con questi 500💰 del Cassaforte potresti comprarti subito 3 joker per la prossima run."
Banner DEMO MODE ben visibile. Gennarino con emozione `sad`.
**Perché funziona**: il giocatore vuole riprendersi, è emotivamente disponibile a spendere.

### 3. Fine Run vittoriosa (Momento di Celebrazione)
Schermata vittoria → dopo la fanfara → mostra ducati accumulati + lootbox apribili:
"Hai [X]💰. Potresti aprire [Y] lootbox Iniziato prima della prossima run."
Link diretto al meta-shop.
**Perché funziona**: il giocatore vuole festeggiare il successo con qualcosa di tangibile.

### 4. Shop negozio in-game (Momento di Scelta Difficile)
Quando il giocatore vede un joker raro che non può permettersi:
Toast discreto: "Ti mancano [N]💰. Con il Jackpot Pack avresti [1500💰]."
MAX 1 volta per sessione — ripetuto = irritante.
**Perché funziona**: il desiderio specifico (quel joker) motiva meglio di una pubblicità generica.

### 5. Primo raggiungimento soglia pity (Momento di Anticipazione)
Quando `sinceRare >= 15` (5 aperture dal pity): toast nell'UI lootbox:
"Tra 5 aperture hai una rare GARANTITA! Stai costruendo la fortuna!"
**Perché funziona**: il sunk cost + l'anticipazione della garanzia motivano a continuare.

---

## KPI di Monetizzazione (target demo v1)

| Metrica | Target | Come misurare | Segnale di successo |
|---------|--------|--------------|---------------------|
| Click su "Compra" (anche fake) | > 40% utenti | localStorage click count | Il loop è convincente |
| Apertura lootbox per run | > 1.5 | count aperture / runs | I ducati vengono spesi |
| Ritorno al meta-shop | > 30% | screen visit count | UI cattura attenzione |
| Screenshot del checkout | > 10% | (survey) | Diventa meme condivisibile |
| Completamento Battle Pass (demo) | > 20% | battlepPassLevel / 30 | Track è motivante |
| Slot giocate per sessione | 2-5 | slot plays / session | Mini-game engagement |
| Tasso "riprova dopo game over" | > 60% | continues / game overs | Loop emotivo funziona |

**NOTA**: questi KPI vanno misurati con strumenti leggeri (localStorage counters) — no analytics esterne.

---

## Roadmap Monetizzazione

### v1.0 (ora — demo)
- Checkout fake con animazione carta di credito
- Lootbox aperte con ducati in-game
- Battle Pass simulato (progresso locale)
- Drop rates sempre visibili
- Pity counter visibile
- Meta-shop accessibile dal menu principale

### v2.0 (dopo validation)
- Stripe integration reale
- IAP mobile (iOS/Android)
- Leaderboard + skin esclusive torneo
- Rimozione DEMO MODE banner
- Analytics reali (con consenso esplicito)

### v3.0 (se virale)
- NFT edizioni limitate joker leggendari (solo se richiesto dalla community)
- Marketplace peer-to-peer skin
- Abbonamento mensile "Club del Munaciello"

---

## Checklist shop.js — Feature Prioritarie

Ordinate per impatto sull'economia e sulla user experience:

### Priorità 1 — Fondamentale (senza questo non c'è economia)
- [ ] Generazione shop per visita (usa `BALANCE.shopJokersVisible`, `shopTarotsVisible`, `shopPacksVisible`)
- [ ] Acquisto joker con deducts ducati + animazione "acquistato"
- [ ] Acquisto tarocco con deducts ducati
- [ ] Reroll shop con costo crescente (`rerollBase × 2^n`) — cap display a `maxRerollsPerShop`
- [ ] Calcolo e distribuzione ricompensa post-blind (ducati base + mani/scarti salvati + interesse)
- [ ] Toast "non abbastanza ducati" quando il giocatore non può comprare
- [ ] Display ducati correnti sempre visibile nell'HUD

### Priorità 2 — Core monetization
- [ ] Apertura lootbox (tutti e 3 i tier) con animazione completa
- [ ] Pity counter cross-tier: incrementa `STATE.meta.lootboxPity` a ogni apertura
- [ ] Pity counter visibile ("Prossima rare garantita tra X aperture")
- [ ] Drop rates visibili prima dell'acquisto (tasto "?" sul pacchetto)
- [ ] Meta-shop con 4 pacchetti premium fake
- [ ] Checkout animation (carta di credito, loading, DEMO MODE popup)
- [ ] DEMO MODE banner prominente nella schermata meta-shop

### Priorità 3 — Engagement e retention
- [ ] Battle Pass track UI (30 livelli, progress bar, ricompense)
- [ ] Battle Pass XP assegnata correttamente post-blind (da `BALANCE.battlePassXp*`)
- [ ] Animazione "LIVELLO SU!" con Gennarino `happy`
- [ ] Slot machine (10💰 costo, payouts da `BALANCE.slotPayouts`, max 3 per visita)
- [ ] Tombola mini-game (trigger random post-blind)

### Priorità 4 — Polish e trigger monetizzazione
- [ ] Toast "vuoi aprire una lootbox?" post boss blind
- [ ] Trigger "ti mancano N ducati per quel joker" nel negozio (max 1/sessione)
- [ ] Skin selector per carte e Gennarino (se sbloccate)
- [ ] Animazione apertura lootbox con Gennarino `shocked` su legendary
