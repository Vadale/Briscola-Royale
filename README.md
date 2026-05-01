# 🃏 Briscola Royale

> *"È come se tuo nonno meridionale avesse fatto un videogioco dopo 3 caffè e mezzo bicchiere di amaro, mentre commentava una partita di carte e ti leggeva l'oroscopo del giornale."*

Un **deckbuilder roguelike** ispirato a Balatro, con carte napoletane, estetica pixel art 16-bit cafona, mascotte "Gennarino 'O Gallo", e vibe da bisca italiana anni '90.

**Zero dipendenze. Zero build step. Apri `game/index.html` e gioca.**

---

## Come si gioca

1. Apri `game/index.html` nel browser (Chrome, Firefox, Safari — tutti funzionano)
2. Scegli il tuo segno zodiacale
3. Scegli tra **CASUALE** (run generata da seed random) o **DAILY** (seed uguale per tutti i giocatori, una volta al giorno)
4. Batti i boss, colleziona Jolly, arriva alla fine — o continua in **ENDLESS MODE** dopo l'Ante 8

### Loop di gioco

- Ogni round hai un **obiettivo di punti** da superare
- Gioca fino a 4 carte per formare combinazioni (Coppia, Tris, Poker, Scala…)
- I **Jolly** modificano il calcolo in modo folle e creativo
- Compra potenziamenti al negozio tra un round e l'altro
- Boss sempre più difficili ogni 3 round

### Minigiochi (hub SVAGO)

| Minigioco | Meccanica |
|-----------|-----------|
| **Tabacchi** | Tieni premuto per fumare tutta la sigaretta (+10 ducati) |
| **Cassaforte d'Oro** | 5 click col piede di porco per spaccarla (+100 ducati) |
| **Jackpot** | Slot machine classica con simboli napoletani |
| **Pachinko** | Fisica canvas — lancia la pallina tra i pioli |

---

## Features principali

- **Briscola roguelike** — mazzo napoletano 40 carte, semi (Coppe, Denari, Bastoni, Spade), valore briscola casuale per run
- **20+ Jolly** con effetti unici e stackabili
- **Tarocchi** — carte speciali che modificano il mazzo o i jolly
- **Boss** con abilità speciali (bloccano scarti, cambiano briscola, ecc.)
- **Segni zodiacali** — 12 bonus passivi, uno per segno
- **Previsioni** — il Mago ti legge l'oroscopo a inizio run
- **Collezione** — traccia tutti i Jolly visti e sbloccati
- **Daily Seed** — stesso seed per tutti i giocatori in un giorno
- **Endless Mode** — obiettivi × 1.25 per ogni ante dopo l'8
- **Slot Machine + Tombola + Pachinko** — minigiochi con ducati reali
- **Bilingue** — italiano e inglese con toggle live
- **Audio completamente sintetizzato** — Web Audio API, zero file MP3
- **Mascotte animata** — Gennarino 'O Gallo ti commenta ogni mossa
- **Mobile-friendly** — layout responsive per telefono e tablet
- **Easter eggs** — Konami code, Dialetto Stretto, e altri segreti

---

## Stack tecnico

```
HTML5 + CSS3 + JavaScript vanilla
Zero dipendenze — zero npm — zero build step
Funziona aprendo index.html con doppio click
```

### Struttura file

```
game/
├── index.html      ← UI completa (7 schermate)
├── style.css       ← pixel art styling + palette + responsive
├── data.js         ← dati statici (carte, joker, boss, smorfia, STRINGS i18n)
├── cards.js        ← rendering SVG carte + calculateScore()
├── game.js         ← game loop principale (briscola roguelike)
├── shop.js         ← logica negozio + lootbox
├── bonus.js        ← slot machine + tombola
├── audio.js        ← Web Audio API (SFX + BGM sintetizzata)
├── gennarino.js    ← mascotte (sprite SVG + frasi + animazioni)
├── zodiac.js       ← selezione segno + previsioni + bonus
├── tutorial.js     ← tutorial interattivo
├── sprites.js      ← sprite sheet SVG inline
└── app.js          ← bootstrap, state machine schermate, save/load
```

### Palette colori

| Token | Hex | Uso |
|-------|-----|-----|
| `--verde-feltro` | `#1a8a3e` | Sfondo tavolo |
| `--oro` | `#f4c430` | Accenti, monete |
| `--rosso` | `#e63946` | Pericolo, bastoni |
| `--viola-neon` | `#c77dff` | Jolly premium |
| `--azzurro` | `#2196f3` | Info, azzurro |
| `--nero` | `#1a0a14` | Background |
| `--bianco-panna` | `#fff8e7` | Testo |

---

## Save state

Salvato in `localStorage` con chiave `briscola_royale_v1`:

```js
{
  meta: {
    coins,           // ducati totali
    unlockedJokers,  // jolly sbloccati
    totalRuns,       // run totali
    victories,       // vittorie
    bestScore,       // punteggio migliore
    zodiac,          // segno zodiacale scelto
    seenJokers,      // jolly mai visti (collezione)
    lang,            // 'it' | 'en'
    dailyDate,       // timestamp dell'ultima daily vinta
  },
  currentRun: {
    ante, blind, deck, jokers, score, hands, discards,
    money, seed, isDaily, endless
  } | null,
  settings: { sound, musicVolume, sfxVolume }
}
```

---

## Trucchi e segreti

- **Konami code** (↑↑↓↓←→←→BA): sblocca modalità speciale
- **Tasto M**: mute/unmute audio
- **Doppio click sul logo**: Easter egg
- ...altri da scoprire

---

## Documentazione tecnica

Nella cartella `docs/`:

| File | Contenuto |
|------|-----------|
| `gameplay-loop.md` | Loop di gioco, scoring, difficoltà, build archetypes |
| `monetization.md` | Economia ducati, lootbox, minigiochi |
| `fase1-skeleton.md` | API DOM, STATE schema, contratti moduli |
| `fase2-data.md` | Struttura dati, JOKERS, BOSSES, TAROTS |
| `changelog.md` | Log di sviluppo completo sessione per sessione |

---

## Sviluppato con

Claude Code (Anthropic) — tutte le sessioni di sviluppo documentate in `docs/changelog.md`
