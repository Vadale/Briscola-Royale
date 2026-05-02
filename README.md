# 🃏 Briscola Royale

> *"It's as if your southern Italian grandfather made a video game after 3 espressos and half a glass of amaro, while commenting on a card game and reading you the horoscope from the newspaper."*

A **roguelike deckbuilder** inspired by Balatro, built with Neapolitan playing cards, trashy 16-bit pixel art, mascot "Gennarino 'O Gallo", and the vibe of an Italian gambling den circa the '90s.

**Zero dependencies. Zero build step. Open `game/index.html` and play.**

---

## How to Play

1. Open `game/index.html` in your browser (Chrome, Firefox, Safari — all work)
2. Choose your zodiac sign
3. Pick **RANDOM** (seed-generated run) or **DAILY** (same seed for all players, once per day)
4. Beat the bosses, collect Jolly, reach the end — or keep going in **ENDLESS MODE** after Ante 8

### Game Loop

- Each round you have a **point target** to beat
- Play up to 4 cards to form combinations (Pair, Three-of-a-Kind, Poker, Straight…)
- **Jolly** modify scoring in wild and creative ways
- Buy upgrades at the shop between rounds
- Progressively harder bosses every 3 rounds

### Mini-games (SVAGO hub)

| Mini-game | Mechanic |
|-----------|----------|
| **Tabacchi** | Hold to smoke a whole cigarette (+10 ducats) |
| **Cassaforte d'Oro** | 5 crowbar clicks to crack it open (+100 ducats) |
| **Jackpot** | Classic slot machine with Neapolitan symbols |
| **Pachinko** | Canvas physics — launch the ball through the pegs |

---

## Main Features

- **Briscola roguelike** — 40-card Neapolitan deck, suits (Cups, Coins, Clubs, Swords), random trump suit per run
- **28+ Jolly** with unique and stackable effects
- **Tarots** — special cards that modify the deck or jolly
- **Bosses** with special abilities (block discards, change trump suit, etc.)
- **Zodiac signs** — 12 passive bonuses, one per sign
- **Predictions** — The Wizard reads your horoscope at the start of each run
- **Collection** — track all Jolly seen and unlocked
- **Daily Seed** — same seed for all players on a given day
- **Endless Mode** — targets × 1.25 for every ante after 8
- **Slot Machine + Tombola + Pachinko** — mini-games with real ducats
- **Bilingual** — Italian and English with live toggle
- **Fully synthesized audio** — Web Audio API, zero MP3 files
- **Animated mascot** — Gennarino 'O Gallo comments on your every move
- **Mobile-friendly** — responsive layout for phone and tablet
- **Easter eggs** — Konami code, Stretto Dialect mode, and other secrets

---

## Tech Stack

```
HTML5 + CSS3 + Vanilla JavaScript
Zero dependencies — zero npm — zero build step
Works by double-clicking index.html
```

### File Structure

```
game/
├── index.html      ← complete UI (7 screens)
├── style.css       ← pixel art styling + palette + responsive
├── data.js         ← static data (cards, jokers, bosses, smorfia, i18n STRINGS)
├── cards.js        ← SVG card rendering + calculateScore()
├── game.js         ← main game loop (briscola roguelike)
├── shop.js         ← shop logic + lootbox
├── bonus.js        ← slot machine + tombola
├── audio.js        ← Web Audio API (SFX + synthesized BGM)
├── gennarino.js    ← mascot (SVG sprite + phrases + animations)
├── zodiac.js       ← sign selection + predictions + bonuses
├── tutorial.js     ← interactive tutorial
├── sprites.js      ← inline SVG sprite sheet
└── app.js          ← bootstrap, screen state machine, save/load
```

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--verde-feltro` | `#1a8a3e` | Table felt background |
| `--oro` | `#f4c430` | Accents, coins |
| `--rosso` | `#e63946` | Danger, clubs |
| `--viola-neon` | `#c77dff` | Premium jolly |
| `--azzurro` | `#2196f3` | Info, blue accents |
| `--nero` | `#1a0a14` | Background |
| `--bianco-panna` | `#fff8e7` | Text |

---

## Save State

Saved in `localStorage` under key `briscola_royale_v1`:

```js
{
  meta: {
    coins,           // total ducats
    unlockedJokers,  // unlocked jolly
    totalRuns,       // total runs played
    victories,       // wins
    bestScore,       // best score
    zodiac,          // chosen zodiac sign
    seenJokers,      // jolly ever seen (collection)
    lang,            // 'it' | 'en'
    dailyDate,       // timestamp of last daily win
  },
  currentRun: {
    ante, blind, deck, jokers, score, hands, discards,
    money, seed, isDaily, endless
  } | null,
  settings: { sound, musicVolume, sfxVolume }
}
```

---

## Cheats & Secrets

- **Konami code** (↑↑↓↓←→←→BA): unlocks special mode
- **M key**: mute/unmute audio
- **Double-click the logo**: Easter egg
- ...more to discover

---

## Technical Documentation

In the `docs/` folder:

| File | Content |
|------|---------|
| `gameplay-loop.md` | Game loop, scoring, difficulty, build archetypes |
| `monetization.md` | Ducat economy, lootbox, mini-games |
| `fase1-skeleton.md` | DOM API, STATE schema, module contracts |
| `fase2-data.md` | Data structures, JOKERS, BOSSES, TAROTS |
| `changelog.md` | Full development log session by session |

---

## Built With

Claude Code (Anthropic) — all development sessions documented in `docs/changelog.md`
