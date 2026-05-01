# BRISCOLA ROYALE — Project Context (Claude Code)

## Cos'è Briscola Royale

Un **deckbuilder roguelike stile Balatro** con carte napoletane, estetica pixel art 16-bit cafona, mascotte "Gennarino 'O Gallo", e vibe da bisca italiana anni '90.

**Stack**: HTML + CSS + JavaScript vanilla. Zero dipendenze. Zero build step. Gira aprendo `game/index.html` con doppio click.

**Documento di riferimento completo**: `/Users/alessandrovadala/Desktop/creatività/BRIEF.md`
**Piano operativo**: `/Users/alessandrovadala/Desktop/creatività/TODO.md`

---

## Struttura repository

```
creatività/
├── CLAUDE.md          ← questo file
├── BRIEF.md           ← spec completo del progetto
├── TODO.md            ← piano operativo con checkbox
├── game/              ← tutto il codice sorgente
│   ├── index.html     ← UI completa (6 schermate)
│   ├── style.css      ← pixel art styling + palette + layout
│   ├── data.js        ← dati statici (carte, joker, boss, smorfia, ecc.)
│   ├── cards.js       ← rendering SVG carte + calcolo punteggi
│   ├── game.js        ← game loop principale (briscola roguelike)
│   ├── shop.js        ← logica negozio + lootbox
│   ├── bonus.js       ← slot machine + tombola
│   ├── audio.js       ← Web Audio API (SFX + BGM)
│   ├── gennarino.js   ← mascotte (sprite SVG + frasi + animazioni)
│   ├── zodiac.js      ← selezione segno + previsioni + bonus
│   └── app.js         ← bootstrap, state machine schermate, save/load
└── docs/              ← knowledge base e documentazione tecnica
```

---

## Regole tecniche FONDAMENTALI

### ❌ NON fare mai
- Caricare immagini/font/script da CDN o URL esterni (tutto inline/SVG/data-URI)
- Usare `setInterval` per animazioni → usa `requestAnimationFrame`
- Hard-code magic numbers → sempre nell'oggetto `BALANCE` in `data.js`
- Mutare lo state da ovunque → solo tramite funzioni dedicate su `STATE`
- Calcoli punteggio sparsi → unica funzione `calculateScore()` in `cards.js`
- Bloccare l'input con animazioni → sempre Skip animazione disponibile

### ✅ Fare invece
- `image-rendering: pixelated` su tutto (pixel art nitida)
- Feedback visivo per ogni azione utente (click = animazione)
- Suoni sintetizzati con Web Audio API (niente file audio)
- Testi UI in italiano; flavor/dialetto nei testi di colore
- Mobile-first nel layout

---

## Stack audio
Tutto generato via Web Audio API. Entry point: funzione `beep(freq, dur, type, vol)`.
Non usare file MP3/WAV/OGG.

## Palette colori
```css
--verde-feltro: #1a8a3e;
--oro: #f4c430;
--rosso: #e63946;
--viola-neon: #c77dff;
--azzurro: #2196f3;
--nero: #1a0a14;
--bianco-panna: #fff8e7;
```

## Font (caricati inline nel CSS o da Google Fonts in index.html)
- Titoli: `Bungee` o `Press Start 2P`
- UI numerica: `VT323`
- UI testi: `Press Start 2P`

---

## Agent Pipeline

Il ciclo obbligatorio per ogni feature o file completato:
```
coder → reviewer → fix loop (max 3) → security-tester → doc-write → tone-reviewer
```

Per feature di gameplay e monetizzazione, aggiungi gli agenti specializzati PRIMA del coder:
```
gameplay-designer → coder → reviewer → fix → security-tester → doc-write
monetization      → coder → reviewer → fix → security-tester → doc-write
```

- **Non saltare mai il reviewer**
- **Non saltare mai il security-tester** (anche se è frontend puro)
- Quando completi un modulo → `/doc-write` per aggiornare `docs/`
- Quando scrivi testi UI, frasi Gennarino, dialoghi boss, previsioni → `/tone-reviewer`

### Agenti specializzati disponibili

| Agente | Skill file | Quando usarlo |
|--------|-----------|---------------|
| `/gameplay-designer` | `.claude/skills/gameplay-designer/SKILL.md` | Gameplay loop, joker, boss, bilanciamento, juice |
| `/monetization` | `.claude/skills/monetization/SKILL.md` | Shop premium, lootbox, battle pass, economia ducati |

### Documenti di spec (fonte di verità)

| Doc | Argomento |
|-----|-----------|
| `docs/gameplay-loop.md` | Loop, scoring, difficoltà, build archetypes |
| `docs/monetization.md` | Economia ducati, lootbox, skin, battle pass |
| `docs/fase1-skeleton.md` | API DOM, STATE schema, contratti moduli |
| `docs/changelog.md` | Log sessioni |

---

## Comandi utili

```bash
# Aprire il gioco nel browser
open /Users/alessandrovadala/Desktop/creatività/game/index.html

# Verificare struttura file
ls -la /Users/alessandrovadala/Desktop/creatività/game/

# Watch dei file (se vuoi live reload manuale)
# Non necessario: basta ricaricare il browser
```

---

## Fasi di sviluppo (vedi TODO.md per dettagli)

| Fase | Cosa | Priorità |
|------|------|----------|
| 0 | Setup struttura | FATTO |
| 1 | Skeleton HTML + CSS + app.js | MAX |
| 2 | Data layer (data.js) | ALTA |
| 3 | Cards rendering (cards.js) | ALTA |
| 4 | Mascotte Gennarino | MEDIA |
| 5 | Game loop (game.js) | MAX |
| 6 | Shop (shop.js) | ALTA |
| 7 | Bonus minigames (bonus.js) | MEDIA |
| 8 | Zodiac + previsioni (zodiac.js) | MEDIA |
| 9 | Audio (audio.js) | MEDIA |
| 10 | Microtransazioni fake | BASSA |
| 11 | Polish & juice | BASSA |
| 12 | Easter eggs | BASSA |
| 13 | Testing & edge cases | ALTA |

---

## Save state schema (localStorage key: `briscola_royale_v1`)

```js
{
  meta: {
    coins, unlockedJokers, totalRuns, victories, bestScore,
    zodiac: 'leone',
    predictionsRead: ['gen001'],
    lang: 'it'
  },
  currentRun: {
    ante, blind, deck, jokers, score, hands, discards
  } | null,
  settings: { sound: true, musicVolume: 0.5, sfxVolume: 0.8 }
}
```

---

## Principio guida

> *"È come se tuo nonno meridionale avesse fatto un videogioco dopo 3 caffè e mezzo bicchiere di amaro, mentre commentava una partita di carte e ti leggeva l'oroscopo del giornale."*

**Il giocatore deve sorridere entro 10 secondi dall'avvio.**
