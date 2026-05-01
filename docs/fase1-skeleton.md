# Fase 1 — Skeleton HTML + CSS + App Bootstrap

Documentazione tecnica della prima fase del progetto **BRISCOLA ROYALE**.
In questa fase è stata costruita la sola impalcatura: DOM completo, stile pixel-art arcade, runtime di base e contratto pubblico per i moduli successivi. Nessuna logica di gioco (carte, jolly, shop, audio, gennarino, zodiaco) è ancora implementata.

---

## 1. File del progetto

### `game/index.html`
Pagina singola che contiene tutte e 7 le schermate, sempre presenti nel DOM ma nascoste tramite `.screen` (display:none). La schermata attiva riceve la classe `.active`.

Struttura:
- `<body class="crt">` — abilita scanlines globali via pseudo-elemento.
- Pulsante globale `#btn-mute` (posizione fixed top-right).
- 7 sezioni `<section class="screen" id="screen-...">`.
- Overlay globali: `#toast-container`, `#popup-overlay` con dentro `#popup-box`.
- 9 tag `<script defer>` in ordine fisso (vedi sezione "Dipendenze future").

### `game/style.css`
Foglio di stile unico (~1280 righe) con tema "pixel art cafona / SNES bisca / sagra del paese".
Definisce:
- Variabili colore (palette napoletana: oro/verde/rosso/viola/rosa).
- Effetto CRT (scanlines via `::after`) + vignetta (via `::before`).
- Stili comuni per schermate, header/main/footer.
- Componenti: bottoni arcade, carte (4 semi colorati), HUD griglia, joker bar, slot machine, tombola, popup, toast.
- Animazioni globali: `screenIn`, `neonPulse`, `bulbBlink`, `toastIn`, `floatUp`, `pulse`, `shake`.
- Responsive a 2 breakpoint: `>=768px` (desktop, HUD a 6 colonne + joker bar laterale) e `<=767px` (mobile, carte 55x82, joker bar orizzontale).
- Supporto `prefers-reduced-motion`.

### `game/app.js`
Bootstrap del runtime client. Definisce `STATE` globale, persistenza su `localStorage`, navigazione fra schermate, sistema di notifiche e popup. Si auto-avvia su `DOMContentLoaded` chiamando `init()` che carica lo stato e instrada alla schermata corretta (zodiac se primo avvio, altrimenti menu).

---

## 2. Id DOM rilevanti per i moduli futuri

### Schermata zodiac (`screen-zodiac`)
- `zodiac-grid` — contenitore dei 12 bottoni `.zodiac-icon[data-sign="..."]`.
- `zodiac-detail` — area aria-live per descrizione segno selezionato.
- `btn-zodiac-confirm` — bottone conferma (parte `disabled`).

### Schermata menu (`screen-menu`)
- `btn-menu-play`, `btn-premium`, `btn-collection`, `btn-stats` — voci di menu.
- `meta-coins-display`, `meta-zodiac-display` — display globali (aggiornati anche da `switchScreen`).

### Schermata game (`screen-game`)
- HUD: `hud`, `hud-ante`, `hud-round`, `hud-score`, `hud-progress-bar`, `hud-target`, `hud-hands`, `hud-discards`, `hud-money`.
- Jolly: `joker-bar`, `joker-slots`, `consumable-bar`.
- Aree carte: `cards-played`, `cards-hand`.
- Round info: `round-info`, `hand-type-display`, `chips-mult-display`.
- Bottoni: `btn-play`, `btn-sort-rank`, `btn-discard`.
- Footer: `deck-count`, `btn-run-info`, `btn-quit-run`.

### Schermata shop (`screen-shop`)
- `shop-coins-display` — ducati visibili in shop.
- Righe: `shop-jokers`, `shop-tarots`, `shop-packs`.
- Footer: `btn-reroll`, `btn-next`.

### Schermata slot (`screen-slot`)
- Reels: `reel-1`, `reel-2`, `reel-3`.
- `slot-display`, `btn-slot-spin`, `slot-credit`, `btn-slot-exit`.

### Schermata tombola (`screen-tombola`)
- `tombola-card`, `tombola-last-numbers`, `btn-tombola-extract`, `tombola-status`, `btn-tombola-exit`.

### Schermata end (`screen-end`)
- `end-title`, `end-score`, `end-ante`, `end-hands`, `end-spent`, `end-jokers`.
- `end-prediction-box`, `end-prediction-text`.
- `btn-retry`, `btn-menu-end`.

### Globali
- `btn-mute` — toggle audio (classe `.muted`).
- `toast-container` — riempito da `toast()`.
- `popup-overlay`, `popup-box` — gestiti da `popup()` / `closePopup()`.

---

## 3. Schema STATE

Definito in `app.js`, esposto come `window.STATE`. Persistito su `localStorage` con chiave `briscola_royale_v1`.

```js
STATE = {
  meta: {
    coins: 0,                   // number, >=0, cap 999999999
    unlockedJokers: [],         // string[]  — id dei jolly sbloccati
    totalRuns: 0,               // number    — run totali iniziate
    victories: 0,               // number    — run vinte
    bestScore: 0,               // number    — punteggio massimo storico
    zodiac: null,               // 'ariete' | 'toro' | ... | 'pesci' | null
    predictionsRead: [],        // string[]  — id predizioni già viste
    lang: 'it',                 // 'it' | 'en'
    cheatsUsed: false           // bool      — settato da Konami code
  },
  currentRun: null,             // oggetto run in corso, definito in Fase 2
  settings: {
    sound: true,                // bool
    musicVolume: 0.4,           // 0..1
    sfxVolume: 0.8              // 0..1
  }
};
```

Costanti correlate:
- `STORAGE_KEY = 'briscola_royale_v1'`
- `SAVE_DEBOUNCE_MS = 500`
- `KONAMI = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a']`
- Zodiac whitelist: `['ariete','toro','gemelli','cancro','leone','vergine','bilancia','scorpione','sagittario','capricorno','acquario','pesci']`

---

## 4. API pubblica esposta su `window.*`

Funzioni e oggetti che gli altri moduli possono usare senza importare nulla.

| Nome | Firma | Descrizione |
|---|---|---|
| `STATE` | `object` | Stato globale (vedi schema). Mutabile. |
| `switchScreen(id)` | `(string) => void` | Rimuove `.active` da tutte le `.screen`, aggiunge a `#id`, aggiorna `meta-coins-display` e `meta-zodiac-display`, chiama `saveState()`, scrolla a 0. |
| `saveState()` | `() => void` | Persiste meta+currentRun+settings su localStorage. Debounced a 500 ms. |
| `loadState()` | `() => void` | Carica e valida (whitelist + type-check) lo stato salvato dentro `STATE`. |
| `toast(msg, type?)` | `(string, 'info'\|'error'\|'success'\|'warning') => void` | Notifica temporanea (~3 s). Usa `textContent` (no XSS). |
| `popup(html)` | `(string) => Promise<string\|true>` | Mostra modale con HTML developer-controlled. Risolve con `data-popup-close` cliccato, `true`, o quando si chiude con Escape / click overlay. |
| `closePopup()` | `() => void` | Forza chiusura del popup corrente. |
| `t(key)` | `(string) => string` | i18n stub. Cerca in `STRINGS[lang][key]` con fallback a `STRINGS.it` e poi alla key stessa. `STRINGS` sarà definito in `data.js`. |

API non esposte ma usate internamente: `deepMerge`, `setMute`, `onKonami`, `init`.

Hook esterno usato (opzionale): `window.SN_Audio.setMuted(bool)` — chiamato da `setMute()` se presente.

---

## 5. Pattern CSS riutilizzabili

### Variabili colore (in `:root`)
`--verde`, `--verde-scuro`, `--verde-feltro`, `--oro`, `--oro-scuro`, `--rosso`, `--rosso-scuro`, `--viola`, `--viola-scuro`, `--azzurro`, `--rosa`, `--nero`, `--bianco`, `--ottone`, `--ottone-chiaro`.

### Variabili tipografiche
`--font-pixel` (Courier New), `--font-retro` (Impact), `--font-bungee`, `--font-arcade`, `--font-display`. Niente CDN: stack di sistema.

### Classi e selettori riusabili
- `.screen` + `.screen.active` — pattern di base per qualunque schermata.
- `.screen-header / .screen-main / .screen-footer` — layout interno standard (flex column).
- `.title-neon` — titolo dorato con effetto pulse.
- `.subtitle` — sottotitolo bianco con shadow.
- `.btn-arcade` — bottone base; modificatori: `.btn-big`, `.btn-small`, `.btn-premium`, `.btn-play`, `.btn-discard`, `.btn-sort`, `.btn-reroll`, `.btn-next`.
- `.btn-text` — bottone "link" oro sottolineato.
- `.card` + `.card.selected` + suit modifiers `.suit-coppe / .suit-denari / .suit-bastoni / .suit-spade` — carta da gioco standard 70x105 (80x120 desktop, 55x82 mobile). Sotto-elementi: `.card-rank-top`, `.card-rank-bot`, `.card-suit`. Variante `.card-back` per dorso.
- `.toast` + `.toast-info/error/success/warning` — notifica.
- `.popup-overlay.open` + `.popup-box` — popup. Bottoni dentro il box devono avere `[data-popup-close]` per chiudere e ritornare il valore.
- `.shake`, `.float-up`, `.pulse` — utility class animate.
- `.tombola-cell.marked` — cella tombola contrassegnata (X rossa).

### Classi HUD
`.hud`, `.hud-block`, `.hud-block.hud-score`, `.hud-label`, `.hud-value`, `.hud-value.hud-blu / .hud-red / .hud-gold`, `.score-big`, `.hud-progress`, `.hud-progress-bar`, `.hud-target`.

### Classi joker bar
`.joker-bar`, `.joker-bar-label`, `.joker-slots`, `.consumable-bar`.

---

## 6. Note di sicurezza applicate

- **Validazione load**: in `loadState()` ogni campo numerico è `Number.isFinite` + `>=0`; `zodiac` è whitelistato; `lang` è whitelistato a `it/en`; gli array sono verificati con `Array.isArray`.
- **Prototype pollution guard**: `deepMerge()` salta `__proto__`, `constructor`, `prototype`.
- **Cap coins**: `Math.min(coins + 777, 999999999)` nel Konami code per evitare overflow / valori assurdi.
- **No CDN esterni**: rimosso Google Fonts; font stack solo da sistema.
- **`toast()` è XSS-safe**: usa `textContent`, non `innerHTML`.
- **`popup()` accetta solo HTML developer-controlled**: documentato esplicitamente nel commento. Non passare mai input utente a `popup()` senza sanitize a monte.
- **`localStorage` stringentemente serializzato**: try/catch su parse e write. Mai dati sensibili.
- **Konami**: ricompensa solo cosmetica/economica, niente escalation. Setta solo flag `cheatsUsed`.
- **Listener Escape**: il keydown del popup viene rimosso correttamente alla chiusura per evitare leak.

---

## 7. Dipendenze dai file futuri

L'ordine di caricamento è fisso in `index.html`:
1. `data.js`
2. `cards.js`
3. `audio.js`
4. `gennarino.js`
5. `zodiac.js`
6. `game.js`
7. `shop.js`
8. `bonus.js`
9. `app.js` (ultimo: usa simboli definiti dai precedenti, ma con guard `typeof X !== 'undefined'`)

### Cosa deve esportare ciascun modulo

#### `data.js`
- `STRINGS` (object) — `{ it: { key: value, ... }, en: { ... } }`. Usato da `t()`. Senza, `t(key)` ritorna `key`.
- `ZODIACS` (object) — definizioni dei 12 segni: nome, descrizione, bonus passivi, simbolo. Usato da `zodiac.js`.
- Costanti di gioco: `ANTE_TARGETS`, `ROUND_TYPES`, `HAND_TYPES`, `SHOP_PRICES`, ecc.

#### `cards.js`
- `createDeck()` o classe `Card` — modello carta (rank, suit, valore briscola, chips base).
- Funzioni di rendering carte dentro `#cards-hand` / `#cards-played` (usando le classi `.card.suit-*`).
- Logica detection mani (briscola, scala, ecc.).

#### `audio.js`
- `window.SN_Audio` con almeno: `setMuted(bool)`, `play(name)`, `playMusic(name)`, `stopMusic()`. Già aggancato da `setMute()` in `app.js`.

#### `gennarino.js`
- Modulo "predizioni" del mago: prende eventi della run e produce stringhe da mostrare in `#end-prediction-text`. Aggiorna `STATE.meta.predictionsRead`.

#### `zodiac.js`
- Bind dei click su `.zodiac-icon[data-sign]`, mostra dettaglio in `#zodiac-detail`, abilita `#btn-zodiac-confirm`.
- Su conferma: scrive `STATE.meta.zodiac`, chiama `saveState()`, `switchScreen('screen-menu')`.
- Espone (forse) `getZodiacBonus(sign)` per `game.js`.

#### `game.js`
- Gestione completa della run: deck, mano, scarti, calcolo punteggio, transizione round.
- Riempie HUD (`#hud-*`), aree carte, bind di `#btn-play / #btn-sort-rank / #btn-discard / #btn-quit-run / #btn-run-info`.
- Mutua `STATE.currentRun`.
- Su game over: popola `#end-*`, chiama `switchScreen('screen-end')`.

#### `shop.js`
- Renderizza `#shop-jokers / #shop-tarots / #shop-packs`. Bind `#btn-reroll`, `#btn-next`.
- Mutua `STATE.meta.coins` e `STATE.currentRun.jokers`.

#### `bonus.js`
- Slot (`#screen-slot`, reels, leva) e tombola (`#screen-tombola`). Mini-giochi inter-round.

### Errori 404 attesi durante lo sviluppo
Finché i moduli non esistono, `index.html` produrrà 404 silenziosi sulle risorse `defer`. `app.js` è scritto difensivamente: `typeof STRINGS !== 'undefined'`, `typeof window.SN_Audio === 'object'`, ecc. Il gioco non si avvierà oltre la schermata zodiac/menu, ma non crasha.
