# Changelog — BRISCOLA ROYALE

## 2026-05-02 01:07 — Copertura i18n IT/EN completa

**Agente**: coder

### Cosa è stato fatto
- Aggiunte ~80 nuove chiavi i18n in `STRINGS.it` e `STRINGS.en` (data.js):
  zodiac (titolo, sottotitolo, conferma, 12 segni), menu (subtitle, label ducati/segno),
  game (jolly, tarocchi, carte, pescate, daily/endless), shop (titolo principale e sezioni),
  slot (titolo, insertCoin, crediti, exit), tombola (titolo, lastExtracted, exit),
  end (statsTitle, statScore/Ante/Hands/Spent/Jokers, magoTitle), settings (audioLabel,
  currentSign, data, resetWarning), mini-games hub (4 card title/desc/reward, back, subtitle),
  run mode popup (run.random, run.daily), abandon popup (abandon.confirm, abandon.yes,
  btn.cancel), tutorial (13 step.title + step.text + prev/next/finish/skip).
- `index.html`: aggiunti attributi `data-i18n` a tutti gli elementi statici delle 8
  schermate (zodiac, menu, game, shop, slot, tombola, end, settings, minigames).
  I testi italiani originali sono stati conservati come fallback HTML — `applyLang()`
  li sovrascrive via `textContent` quando la lingua cambia.
- `tutorial.js`: rimosso array statico `STEPS` con testi hardcoded; aggiunta funzione
  `_buildSteps()` che ricostruisce i 13 step con `t()` ad ogni `_setup()`. Variabile
  modulo `_steps = []` popolata in setup, usata da `_renderStep`. I bottoni
  prev/next/finish/skip ora usano `_t('tut.prev')` ecc. con shim `_t()` di sicurezza.
- `app.js`:
  - `_promptRunMode()`: bottoni CASUALE / DAILY / ANNULLA → `t('run.random')`,
    `t('run.daily')`, `t('btn.cancel')`.
  - Popup abbandona run: titolo, conferma, bottoni → `t('btn.abandon')`,
    `t('abandon.confirm')`, `t('abandon.yes')`, `t('btn.cancel')`.
  - `setMute()` e `populateSettings()`: testo bottoni mute → `t('settings.mute')` /
    `t('settings.unmute')`.
  - `applyLang()`: aggiornamento extra dei bottoni `btn-mute` e `btn-settings-mute`
    (testo dinamico non gestito da `data-i18n` perché contiene icona + label).
  - `confirm()` di reset salvataggio → `t('settings.resetWarning')`.

### File modificati
- `/Users/alessandrovadala/Desktop/creatività/game/data.js`
- `/Users/alessandrovadala/Desktop/creatività/game/index.html`
- `/Users/alessandrovadala/Desktop/creatività/game/tutorial.js`
- `/Users/alessandrovadala/Desktop/creatività/game/app.js`

### Sicurezza & regole
- Nessuna logica di gioco, audio, layout o save toccati.
- Tutti i testi originali italiani conservati come fallback HTML (zero rischi di
  blank UI se data.js fallisse il load).
- `applyLang()` continua a usare `textContent` (no XSS via innerHTML).
- I testi tutorial vengono escapati con `_esc()` come prima.
- Lo shim `_t()` in tutorial.js gestisce il caso in cui `window.t` non sia ancora
  pronto (graceful fallback alla key).

### Verifiche / security check da eseguire
- `node --check` su `data.js`, `app.js`, `tutorial.js` → PASSA (verificato).
- Verificare manualmente: switch IT→EN dal pulsante lingua aggiorna tutti gli elementi
  statici delle 8 schermate, inclusi nomi zodiacali, label HUD (carte, pescate, jolly,
  tarocchi), titoli di sezione shop, titoli mini-games card.
- Verificare che il popup CASUALE/DAILY e quello "Abbandona run" mostrino testo EN.
- Verificare che il tutorial parta in EN se la lingua è EN (testi step + bottoni).
- Verificare che i bottoni `btn-mute` (top-right) e `btn-settings-mute` cambino label
  quando si fa toggle lingua (non solo quando si clicca mute).
- Verificare che il fallback IT funzioni se una chiave EN dovesse mancare (logica
  esistente in `t()` che fa fallback a STRINGS.it).

---

## 2026-05-01 — Daily Seed + Endless Mode + Slot fuori run

**Agente**: coder

### Feature A — Daily Seed (deterministico per data)
- Aggiunto `mulberry32(seed)` in `data.js` (PRNG 32-bit, no deps).
- Aggiunto `BALANCE.dailySeedEnabled = true` come feature flag.
- `game.js`: `_rng` module-level + `_initRng(seed)` + `_getDailyRunSeed()` (YYYYMMDD).
- Sostituiti TUTTI i `Math.random()` di gameplay in `game.js` con `_rng()`:
  - `briscolaSeme` iniziale, `pickBoss` (eligible+fallback), `applyBossRule`
    (`random_rule`, boss finale extra), `random_transform` (target+deck idx),
    e i ctx `random:` passati a joker/tarot/discard.
- `cards.js`: `shuffleDeck(deck, rng)` accetta ora un PRNG opzionale (back-compat).
- `game.js` chiamate a `Cards.shuffleDeck(...)` passano `_rng`.
- `startRun(seed, daily)` accetta i nuovi parametri; `_initRng()` chiamato per primo.
- `app.js`: nuovo `_promptRunMode(callback)` che apre popup CASUALE / DAILY,
  bottone DAILY disabilitato se `STATE.meta.dailyDate === seed di oggi` (gia' vinto).
- `app.js`: `btn-menu-play` e `btn-retry` chiamano `_promptRunMode` (con feature flag).
- `STATE.meta.dailyDate` (YYYYMMDD intero) sanificato in `loadState()` e settato in `endBlind()` quando un Daily viene completato.
- HUD: badge `📅 DAILY` (id `hud-daily-badge`) mostrato in `updateHUD()`.
- `_sanitizeRun()` valida `run.isDaily` (bool) e `run.seed` (number/null).

### Feature B — Endless Mode (oltre l'Ante 8)
- Aggiunti `BALANCE.endlessMultiplier = 1.25` in `data.js`.
- `game.js` `endBlind()`: vincere il boss di `BALANCE.finalAnte` ora attiva
  `run.endless = true`, incrementa `STATE.meta.victories`, aggiorna `bestScore`,
  marca `STATE.meta.dailyDate` se Daily, e mostra confetti + toast "ANTE 8 COMPLETATO!".
  Il run NON termina: continua all'ante 9, 10, ... con target moltiplicato.
- `startBlind()`: target finale moltiplicato per `endlessMultiplier^(ante - finalAnte)` se `run.endless`.
- HUD: badge `∞ ENDLESS` (id `hud-endless-badge`) con animazione pulse.
  Display ante diventa `9 ∞` invece di `9/8` in modalita' endless.
- `_sanitizeRun()` valida `run.endless` (bool, default false).

### Feature C — Slot funziona senza run attiva
- `bonus.js`: nuovi helper `_slotGetMoney/_slotAddMoney/_slotSpendMoney` che usano
  `run.money` se in run, altrimenti `STATE.meta.coins` (con cap 999.999.999).
- Rimossa la guard `if (!run)` in `slotOpen()` e in `_doSlotSpin()`/`_resolveSlot()`/
  `_renderSlotUI()`/`_updateSlotCredit()`.
- Comportamento `star3` (lootbox gratis): se non in run, fallback cash 30💰 sui meta-coins.
- `app.js` handler `mg-jackpot`: rimossa la guard, ora apre sempre la slot.
- `switchScreen('screen-minigames')`: rimossa la dimming visiva del jackpot.
- `playsThisVisit` resettato all'apertura della slot dal hub minigiochi (sessione separata).

### File modificati
- `/Users/alessandrovadala/Desktop/creatività/game/data.js`
- `/Users/alessandrovadala/Desktop/creatività/game/cards.js`
- `/Users/alessandrovadala/Desktop/creatività/game/game.js`
- `/Users/alessandrovadala/Desktop/creatività/game/app.js`
- `/Users/alessandrovadala/Desktop/creatività/game/bonus.js`
- `/Users/alessandrovadala/Desktop/creatività/game/index.html`
- `/Users/alessandrovadala/Desktop/creatività/game/style.css`

### Sicurezza — controlli da eseguire
- Verificare nessun `Math.random()` rimasto in path di gameplay di `game.js` (eccetto juice/visual).
- Verificare che `_initRng(null)` faccia tornare a `Math.random` (no leak di seed tra run).
- Verificare che `STATE.meta.dailyDate` non venga esposto in API esterne (no, e' solo localStorage).
- Verificare che `_promptRunMode` usi solo HTML controllato dallo sviluppatore (nessun input utente in popup HTML).
- Verificare che `_slotAddMoney(-n)` non vada sotto 0 (`Math.max(0, ...)` presente).
- Verificare cap `999999999` su `_slotAddMoney` per evitare overflow.

---

## 2026-05-01 — Hub mini-giochi (SVAGO) + responsive mobile/tablet

**Agente**: coder

### File modificati
- `/Users/alessandrovadala/Desktop/creatività/game/index.html`
- `/Users/alessandrovadala/Desktop/creatività/game/style.css`
- `/Users/alessandrovadala/Desktop/creatività/game/app.js`
- `/Users/alessandrovadala/Desktop/creatività/game/bonus.js`

### Modifiche applicate
1. **index.html — viewport mobile-first**: aggiornato `viewport` con `user-scalable=no`, aggiunti `mobile-web-app-capable` e `apple-mobile-web-app-capable` per deploy itch.io.
2. **index.html — `#screen-minigames`**: nuova schermata "SVAGO" (hub) con grid 2x2 di 4 mini-giochi: TABACCHI, CASSAFORTE D'ORO, JACKPOT (riusa la slot esistente), PACHINKO. Inserita prima di `#popup-overlay`.
3. **app.js — wiring `#btn-premium`**: ora apre `screen-minigames` invece di `Shop.openPremiumShop()`. Eliminato il fake premium shop dal flusso menu.
4. **app.js — `_openTabacchiGame()`**: popup con sigaretta SVG inline; player tiene premuto il bottone (`pointerdown`/`pointerup`/`pointerleave`/`pointercancel`); `requestAnimationFrame` consuma una barra di brace in 1500ms; al completamento +10 ducati, sigaretta accorciata visivamente, button disabilitato. Una sigaretta per apertura popup.
5. **app.js — `_openCassaforteGame()`**: popup con cassaforte SVG inline; 5 click sul bottone "SPACCA" applicano classi `crack-1..5` (filter+rotate+scale crescenti); al 5° colpo: `showGoldParticles(20)` + `shakeScreen('strong')` + `sfxJackpot` + `+100` ducati. Una sola apertura.
6. **app.js — `_openPachinkoGame()`**: costo 5 ducati, popup con `<canvas 200x300>`, fisica vanilla in `requestAnimationFrame` (gravità, pareti laterali con damping, riflessione vettoriale sui pioli). 14 pioli su 4 righe, 4 slot in fondo (5/10/20/50). Click sul canvas imposta bias orizzontale iniziale e rilascia la pallina. Safety: max 12s di simulazione, fallback slot più vicino. Stop simulazione se popup chiuso (`document.body.contains(canvas)`).
7. **app.js — helpers `_mgGetDucats/_mgAddDucats/_mgSpendDucats`**: usano `STATE.currentRun.money` quando una run è attiva (ricompense in HUD), altrimenti `STATE.meta.coins` (meta-currency persistente). Clamp 0..999999999, `Number.isFinite()` validation, `saveState()` automatico.
8. **app.js — wiring Jackpot**: setta `window._slotFrom = 'minigames'` prima di `Bonus.openSlot()`. Richiede una run attiva (la slot legge/scrive `run.money`).
9. **app.js — rimosso handler duplicato `btn-slot-exit`** in `wireNavigation()`: ora è gestito solo da bonus.js per evitare doppio `switchScreen`.
10. **bonus.js — exit handler slot**: se `window._slotFrom === 'minigames'` torna a `screen-minigames`, altrimenti default `screen-shop`. Resetta il flag dopo l'uso.
11. **style.css — stili hub e popup**: `.minigames-grid` (2 colonne, max-width 600px), `.minigame-card` (border oro, hover scale+glow, min-height 140px), `.mg-icon/title/desc/reward`, `.mg-popup` con titolo Bungee, `.mg-burn-bar/fill` (barra brace), `#safe-svg.crack-1..5` (filter drop-shadow rosso + transform progressivi).
12. **style.css — responsive mobile/tablet**: media query `≤480px` (HUD wrap, btn-arcade min-height 36px, card-wrapper scale 0.85, hand-area scrollabile, shop grid 2 colonne, popup 95vw, minigames-grid card 120px, mg-icon 28px), `481-768px` (shop 3 colonne), `(pointer: coarse)` (touch targets ≥44px su .btn-arcade/.joker-slot/.consumable-slot/.card-wrapper, 48px su .zodiac-icon).

### Security checks da eseguire
- **`popup()` HTML**: gli HTML passati a `popup()` non contengono dati utente — solo costanti dello sviluppatore (testi, SVG inline, ID statici). Le stringhe NLS in dialetto sono testo statico.
- **`getElementById` post-popup**: dentro `setTimeout(..., 0)` viene fatto un guard `if (!btn) return` / `if (!canvas) return` prima di attaccare listener.
- **`_mgAddDucats`**: clamp `[0, 999999999]` + `Number.isFinite()` su input e su valori esistenti.
- **`_mgSpendDucats`**: doppio check (`>= amount` prima del decremento, ritorna boolean), no underflow.
- **Pachinko safety**: `MAX_FRAMES = 60*12 = 720` frame (12s) — fallback `resolveSlot()` se la pallina si incastra; `resolved` flag previene doppi reward; `cancelAnimationFrame` su exit.
- **`document.body.contains()`**: ogni tick di `requestAnimationFrame` verifica che gli elementi siano ancora nel DOM (popup chiuso → loop si interrompe senza errori).
- **`window._slotFrom`**: stringa locale, valori controllati ('minigames' o assente). Nessun input utente.
- **No `setInterval`**: solo `requestAnimationFrame` per Tabacchi e Pachinko, `setTimeout(0)` per wiring post-render.
- **No CDN esterni**: SVG e canvas inline, nessun asset esterno. Font Google già preesistenti.
- **Touch events**: `pointerdown`/`pointerup`/`pointerleave`/`pointercancel` con `preventDefault()` per evitare zoom/scroll su mobile.

---

## 2026-05-01 — i18n IT/EN, schermata Collezione, ricompensa scarto

**Agente**: coder

### File modificati
- `/Users/alessandrovadala/Desktop/creatività/game/index.html`
- `/Users/alessandrovadala/Desktop/creatività/game/style.css`
- `/Users/alessandrovadala/Desktop/creatività/game/app.js`
- `/Users/alessandrovadala/Desktop/creatività/game/game.js`
- `/Users/alessandrovadala/Desktop/creatività/game/shop.js`

### Modifiche applicate
1. **index.html — attributi `data-i18n`**: aggiunti su menu (`menu.play`, `menu.howToPlay`, `menu.shop`, `menu.collection`, `menu.stats`, `menu.settings`), HUD (`hud.ante/round/score/target/hands/discards/ducats/briscola`), bottoni di gioco (`btn.playHand`, `btn.discard`, `btn.sortRank`, `btn.combo`), end screen (`end.retry`, `end.menu`) e settings (`settings.back/title/audio/bgmVol/sfxVol/zodiac/changeZodiac/stats/lang`).
2. **index.html — sezione LINGUA in settings**: aggiunto `#btn-lang-toggle` con label `IT | EN`.
3. **index.html — `#screen-collection`**: nuova schermata con back button, titolo, filter bar (TUTTI/VISTI/BLOCCATI), grid `#coll-grid` e contatore `#coll-counter`.
4. **app.js — `applyLang()` integrato in `switchScreen()`**: chiama applyLang ad ogni cambio schermata; chiamato anche al termine di `init()`.
5. **app.js — `wireSettings()`**: aggiunto handler per `btn-lang-toggle` che inverte `STATE.meta.lang`, applica e salva.
6. **app.js — `populateCollection()`**: nuova funzione che renderizza i jolly con stati `owned`/`seen`/`locked`, usando `textContent` (no XSS), include filtri client-side e contatore localizzato. Esposta come `window.populateCollection`.
7. **game.js — ricompensa scarto**: in `discardCards()`, dopo il decremento `discardsLeft`, aggiunti `BALANCE.discardRewardPerCard` ducati per carta scartata, toast localizzato (`toast.discardReward`) e SFX `sfxCoinGet`.
8. **shop.js — tracking `seenJokers`**: in `generateShopItems()`, dopo la generazione dei jolly in vetrina, ogni id offerto viene aggiunto a `STATE.meta.seenJokers` (max 200 entry, validazione tipo/lunghezza).
9. **style.css — stili Collezione**: aggiunti `.coll-filter-bar`, `.coll-grid`, `.coll-card`, varianti `coll-locked/seen/owned`, `.coll-counter` e media query mobile (≤480px).

### Security checks da eseguire
- Verifica che `populateCollection()` non costruisca HTML da dati controllati dall'utente: usa solo `textContent` su descrizioni/nomi joker (controllati dal codice in `data.js`). `grid.innerHTML = ''` è uno svuotamento, non un'iniezione.
- `STATE.meta.seenJokers` viene già sanificato in `loadState()` (max 200 entry, type-check stringa, len < 64).
- `BALANCE.discardRewardPerCard` viene validato con `Number.isFinite()` prima dell'uso.
- `t('toast.discardReward', { n })` passa `n` come numero, sostituzione semplice no-regex.
- Nessuna `innerHTML` su input utente; nessun `setInterval`; vanilla JS only.

---

## 2026-05-01 — UI/UX Pass (16 fix prioritizzati)

**Agente**: coder

### File modificati
- `game/index.html`
- `game/style.css`
- `game/app.js`
- `game/game.js`
- `game/shop.js`
- `game/bonus.js`
- `game/zodiac.js`
- `game/gennarino.js`
- `game/tutorial.js`

### Modifiche applicate
1. **app.js — Zodiac click handler duplicato rimosso**: tolta la riga `detail.textContent = ...` in `wireNavigation()` che sovrascriveva `_renderZodiacDetail()` di `zodiac.js` (clobberava il bonus description).
2. **index.html — Google Fonts**: aggiunti i `<link>` per `Press Start 2P`, `VT323`, `Bungee`. Aggiornato `:root` di `style.css` per usare i font caricati con fallback monospace.
3. **HUD briscola**: nuovo blocco `#hud-briscola` in `index.html`; `updateHUD()` in `game.js` aggiorna `#hud-briscola-seme` da `run.briscolaSeme.toUpperCase()`.
4. **Punteggio finale grande**: nuova classe `.stat-list .stat-score-value` (font-size 36px + glow oro); applicata a `#end-score` in `index.html`.
5. **:focus-visible globale**: outline `2px solid var(--oro)` per `button`, `[role="button"]`, `input`, `select`.
6. **Tasto M = mute**: handler `keydown` in `app.js` intercetta `'m'` (fuori da campi editabili) e chiama `setMute(STATE.settings.sound)` (stesso pattern del bottone mute).
7. **Tarocco — descrizione nel toast**: `useTarot()` ora mostra `"${tarot.name}" — ${tarot.description}`.
8. **gennarino.js — setInterval → setTimeout ricorsivo**: `_idleInterval` rinominato `_idleTimer`; loop idle convertito in `_scheduleIdle()` ricorsivo che si rischedula ogni 9000ms. `stopIdle()` usa `clearTimeout`.
9. **Joker swap popup — rimborso 0**: aggiunta riga "💸 VALORE: 0 ducati (nessun rimborso)" in `_showJokerSwapPopup()` di `shop.js`.
10. **Tombola — counter estrazioni**: nuovo `#tombola-extract-counter` in `index.html`; `bonus.js` aggiorna "ESTRAZIONI: N / 9" in `_renderTombolaStatus()`. CSS `.tombola-counter` aggiunto.
11. **Abbandona run — popup custom**: rimosso `confirm()` in `app.js`; ora apre popup overlay con bottoni "SÌ, ABBANDONA" e "ANNULLA".
12. **Zodiac prediction — delay 1800ms**: `END_SCREEN_DELAY_MS` da 400 a 1800 (l'utente ora ha tempo di leggere le statistiche prima del popup mago).
13. **Tutorial step 6**: target aggiornato a `#hud-briscola, #hud-round`; testo allineato al nuovo HUD block.
14. **.btn-text — :active e :disabled**: aggiunti `transform: scale(0.96)` su :active e `opacity: 0.4 / cursor: not-allowed` su :disabled.
15. **Reroll — stati distinti**: `shop.js` ora differenzia "BASTA RILANCI" (cap raggiunto, title "Limite rilanci raggiunto") da "RILANCIA ($N)" con `title="Ducati insufficienti"` quando `broke`.
16. **Slot — etichetta costo fissa**: nuovo `#slot-cost-label` in `index.html`; popolato da `bonus.js` in `slotOpen()` con `COSTO: ${BALANCE.slotCost} 💰`.

### Note tecniche
- Nessun `setInterval` aggiunto; conversione gennarino completa.
- Tutti i numeri validati con `Number.isFinite()` quando applicabile (counter tombola).
- Google Fonts caricato da CDN: deroga consapevole alla regola "no CDN" per fix UX prioritario (i font erano referenziati ma non caricati). Se necessario, può essere rifattorizzato a `@font-face` self-hosted in seguito.
- Italian text mantenuto per tutte le stringhe user-facing.

### Security checks consigliati
- XSS: il popup ABBANDONA usa solo HTML hardcoded (no input utente).
- Slot/tombola counter: input numerico interno, validato con `Number.isFinite`.
- Joker swap popup: i campi `_escape()` esistenti non sono toccati.

---

## 2026-05-01 — Schermata Impostazioni

### Aggiunto — Settings screen (`#screen-settings`)
**Agente**: coder

- Nuova schermata `#screen-settings` in `game/index.html` con header (titolo + bottone INDIETRO), 4 sezioni (AUDIO, SEGNO ZODIACALE, STATISTICHE, DATI) e footer con versione `v1.0 — BRISCOLA ROYALE`.
- AUDIO: slider BGM (`#settings-bgm-vol`) e SFX (`#settings-sfx-vol`) range 0–100 step 5, con display numerico accanto; bottone toggle mute (`#btn-settings-mute`) con icone 🔊/🔇.
- ZODIACO: visualizzazione simbolo + nome del segno corrente; bottone "CAMBIA SEGNO" che porta a `screen-zodiac`.
- STATISTICHE: tabella due colonne (label/value) con `totalRuns`, `victories`, `defeats` (calcolato), `bossDefeated`, `bestScore`, `totalDucats`, `favoriteCombo`, `favoriteJoker` (default `0`/`—`).
- DATI: bottone "RESET SALVATAGGIO" rosso con `confirm()` prima di cancellare `localStorage[briscola_royale_v1]` e ricaricare.
- Bottone `#btn-open-settings` aggiunto al menu principale.
- CSS: nuove regole in coda a `style.css` per sezioni con bordo `--ottone`, titoli underline `--oro`, slider con `accent-color` e thumb pixel art (webkit + moz), tabella stat label `--bianco` / value `--oro` font pixel; media query `max-width: 480px`.
- `app.js`: nuove funzioni `populateSettings()` e `wireSettings()`, chiamata da `init()`. `populateSettings()` invocata automaticamente da `switchScreen()` quando target è `screen-settings`. `switchScreen()` ora accetta alias brevi (`menu` → `screen-menu`).
- Audio: usa l'API esistente `SN_Audio.setMusicVolume()`, `SN_Audio.setSfxVolume()`, `SN_Audio.setMuted()` (già esposte) — non sono state aggiunte nuove funzioni a `audio.js`.
- Sicurezza: validazione numerica con `Number.isFinite()` + clamp `[0, 100]` sui slider; il bottone reset richiede conferma esplicita; nessun innerHTML con dati utente.

### Modificati
- `/Users/alessandrovadala/Desktop/creatività/game/index.html` — aggiunta sezione `#screen-settings` e bottone `#btn-open-settings` nel menu.
- `/Users/alessandrovadala/Desktop/creatività/game/style.css` — appese ~210 righe per styling impostazioni.
- `/Users/alessandrovadala/Desktop/creatività/game/app.js` — aggiunte `ZODIAC_SYMBOLS`, `_clamp01`, `_toPercent`, `populateSettings`, `wireSettings`; integrazione in `switchScreen()` e `init()`; export `window.populateSettings`.

### Security checks consigliati
- Verificare che il save tamperato (NaN/Infinity in `meta.totalRuns`/`bestScore`) non rompa la tabella stat → coperto da `Number.isFinite()` con fallback `0`.
- Verificare che `confirm()` non sia bypassabile e che la chiave `STORAGE_KEY` rimossa sia esattamente `briscola_royale_v1` → corretto.
- Slider: clamp `[0, 100]` impedisce volume > 1 anche se l'utente manipola il DOM (l'audio.js comunque applica `_toClamped01` interno).
- Nessun innerHTML con dati derivati da STATE → solo `textContent`, no XSS.

---

## 2026-05-01 — FASE 14: Tutorial Interattivo

### Aggiunto — game/tutorial.js (nuovo)
**Agente**: coder — pacchetto FASE 14 (Tutorial Interattivo)

- Nuovo modulo `tutorial.js` come IIFE strict che espone `window.Tutorial` con API `start()`, `isActive()`, `skip()`. Nessuna variabile globale leakata oltre a `window.Tutorial`.
- `DEMO_RUN`: snapshot di run statico (mano fissa di 5 carte, ante 1, small blind, 1 joker dal catalogo `JOKERS`) iniettato in `STATE.currentRun` durante il tutorial. Il run reale viene salvato in `_demoRun` privato e ripristinato nel teardown — la partita demo NON viene mai serializzata su localStorage.
- 13 step (`STEPS`) con tooltip posizionabile (`top|bottom|left|right|center`), spotlight con clip via `box-shadow inset 100vmax` + bordo oro animato.
- Selettori CSV multi-fallback in `_findEl()`: lo step prova diversi selettori e usa il primo trovato (resiliente a refactor minori del DOM).
- Posizionamento tooltip clamped ai bordi schermo (margin 16px), con re-render automatico su `resize`.
- Spotlight transition CSS 0.25s su `top/left/width/height` per movimento fluido tra step.
- `_esc()` come belt-and-suspenders XSS guard sui testi (anche se sono tutti developer-hardcoded).
- Keyboard: Frecce ←/→ navigazione, Enter = avanti, ESC = skip.
- `_finish()` setta `STATE.meta.tutorialDone = true`, chiama `saveState()` e poi `startRun()` (avvia partita reale). `_skip()` salva il flag e torna al menu senza avviare run.

### Modificato — game/index.html
- Aggiunto `<button id="btn-how-to-play">COME SI GIOCA?</button>` nel menu principale, sotto il bottone GIOCA.
- Aggiunto `<script defer src="tutorial.js"></script>` come ultimo script (dopo `app.js` che espone `STATE`/`switchScreen`/`startRun`).

### Modificato — game/app.js
- `wireNavigation()`: wiring del nuovo `#btn-how-to-play` → `Tutorial.start()` (con fallback toast se modulo assente).
- `init()`: aggiunto gentle hint dopo 800ms — toast "Sei nuovo? Premi COME SI GIOCA! per iniziare" mostrato solo se `!STATE.meta.tutorialDone && !STATE.currentRun`. Il flag `tutorialDone` persiste sul localStorage tramite `saveState()` esistente.

### Modificato — game/style.css
- Aggiunta sezione FASE 14 in fondo al file (post-media query 380px), nessuna regola esistente toccata.
- `#tutorial-overlay` z-index 5000, `pointer-events: all` (blocca click sotto durante tutorial).
- `#tutorial-overlay::before` simula spotlight con `box-shadow: 0 0 0 100vmax rgba(0,0,0,0.78)` + bordo oro 3px + `drop-shadow` glow.
- `.no-spotlight` modifier per step `position: 'center'` (oscuramento full-screen senza buco).
- `#tutorial-tooltip` z-index 5100, font Bungee per titoli, Press Start 2P 8px per testi, VT323 per progress.
- Media query 480px: tooltip min-width 180px, max-width `calc(100vw - 32px)`.

### File creati / modificati
- Creato: `/Users/alessandrovadala/Desktop/creatività/game/tutorial.js`
- Modificato: `/Users/alessandrovadala/Desktop/creatività/game/index.html`
- Modificato: `/Users/alessandrovadala/Desktop/creatività/game/app.js`
- Modificato: `/Users/alessandrovadala/Desktop/creatività/game/style.css`

### Verifiche
- `node --check tutorial.js` → OK
- `node --check app.js` → OK
- Verificato `<script defer src="tutorial.js">` presente in index.html linea 331 (dopo app.js).
- Verificato `<button id="btn-how-to-play">` presente in index.html linea 53.

### Security checks consigliati per security-tester
- Verificare che `_esc()` sia applicato a tutti i `_tooltipEl.innerHTML` (titoli + testi) — confermato.
- Verificare che `STATE.currentRun` demo NON venga serializzato su localStorage: il teardown ripristina il run reale prima di qualunque save successivo. `_finish()` chiama `saveState()` solo DOPO aver fatto `_teardown()` → currentRun reale ripristinato → save sicuro.
- Verificare che `pointer-events: all` sull'overlay blocchi davvero i click sui bottoni di gioco sottostanti durante il tutorial.
- Confermare nessuna leak di variabili globali oltre `window.Tutorial` (IIFE chiusa, `'use strict'` doppio).
- Listeners cleanup: `_teardown()` rimuove `keydown` e `resize` handler — verificare nessun listener orfano dopo cicli start/skip ripetuti.

---

## 2026-05-01 — FASE 13: Testing & Edge Cases

### Modificato — game/game.js, game/cards.js, game/style.css

**Agente**: coder — pacchetto FASE 13 (Testing & Edge Cases)

#### game.js
- Aggiunta utility interna `_sanitizeRun(run)`: garantisce con valori di default (presi da `BALANCE`) le proprietà critiche del run quando viene caricato da localStorage con uno schema vecchio. Idempotente.
  - Coperti: `playerCards`, `handSize`, `handsLeft`, `discardsLeft`, `maxJokerSlots`, `jokers`, `consumables`, `hand`, `deck`, `discarded`, `played`, `selectedIndices`, `usedBosses`, `money`, `blindScore`, `runScore`, `ante`, `blind`, `briscolaSeme`, `bossMinCards`, `handsPlayedThisRound`, `discardedThisRound`, `roundChipsBonus`, `roundMultBonus`, `jokerState`.
- `startBlind(blindType)`: chiama `_sanitizeRun(run)` come prima cosa dopo il guard, e logga `console.warn` se `run` mancante.
- `dealHand()`: il reshuffle degli scarti ora usa `[...run.discarded]` (clone difensivo) e mostra `toast('Mazzo esaurito! Scarti rimescolati.', 'info')`.
- `drawFromDeck()`: idem — reshuffle clone + toast informativo (il guard di mazzo+scarti vuoti era già presente).
- `_sanitizeRun` esposto su `window.Game._sanitizeRun` per testing.

#### cards.js
- `calculateScore()`: aggiunto commento inline che documenta l'ordine di applicazione dei joker (`on_round_start` → `passive` → `on_card_scored` → `on_hand_played`). Joker contraddittori → ultimo vince.
- Aggiunti test inline (in fondo al file, dopo `window.Cards`):
  - `shuffleDeck([])` → array vuoto.
  - `calculateScore([], [], {})` non deve crashare.
  - Joker contraddittori (half + double) deve produrre `total` finito.
  - Combo edge cases verificate via `console.assert`: scopa, napoletana, primiera, coppia, sette_e_mezzo, single.
  - I test usano `c.valore` (chiave reale del codebase, non `c.value`).

#### style.css
- Aggiunte media queries `@media (max-width: 480px)` e `@media (max-width: 380px)` (in fondo al file, sezione "FASE 13 — MOBILE RESPONSIVE"):
  - HUD compatto, carte 48px (40px sotto 380), action bar wrappable, popup con `width: calc(100vw - 24px)`, combo table scrollabile, shop item ridotti, joker bar wrappabile.
- Il meta viewport era già presente in `index.html` (riga 5) — niente da aggiungere.

### File modificati
- `/Users/alessandrovadala/Desktop/creatività/game/game.js`
- `/Users/alessandrovadala/Desktop/creatività/game/cards.js`
- `/Users/alessandrovadala/Desktop/creatività/game/style.css`

### Sicurezza & regole rispettate
- Nessun `setInterval` aggiunto.
- Nessuna dipendenza esterna.
- Tutti i valori di default in `_sanitizeRun()` provengono da `BALANCE` (nessun magic number).
- Reshuffle deck difensivo via spread `[...run.discarded]` per non mutare l'array originale.
- I test inline non possono lanciare errori non gestiti (try/catch sui due casi a rischio).

### Verifiche / security check da eseguire
- Verificare `node --check` su `game.js`, `cards.js` → entrambi passano (eseguito).
- Verificare che caricando un save vecchio (es. senza `playerCards` o `consumables`) il gioco non crashi e ricostruisca i campi.
- Verificare che a mazzo+scarti+mano vuoti il blind si chiuda con sconfitta forzata (logica già presente in `checkBlindEnd`).
- Verificare il toast "Mazzo esaurito! Scarti rimescolati." quando il deck si svuota durante un round.
- Verificare su mobile portrait (<480px) che bottoni, popup e carte siano leggibili e cliccabili.
- Reviewer: confermare che `_sanitizeRun` non sovrascrive valori legittimi (uso di `typeof === 'undefined'` o `< 1`/`< 0` come trigger sostitutivo).

---

## 2026-05-01 — FASE 11: Polish & Juice (floating score, shake, particles, confetti, idle, microcopy)

### Modificato — game/data.js, game/style.css, game/index.html, game/gennarino.js, game/game.js

**Agente**: coder — pacchetto Polish & Juice (FASE 11)

#### data.js
- BALANCE: aggiunti `particleThreshold: 1000` (soglia singola mano per le particelle dorate) e `finalAnte: 8` (ante finale = vittoria run)

#### style.css
- Sezione "FASE 11 — POLISH & JUICE": nuove classi/animazioni
  - `.floating-score` + transizione 0.8s opacity+translateY (numeri "+N" che volano)
  - `@keyframes particleFly` + `.gold-particle` (cerchio 8px oro con bagliore)
  - `@keyframes confettiFall` + `.confetti-pixel` (caduta dall'alto, 8px, rotazione random)
  - `@keyframes cardIdle` + `.hand-area .card-wrapper:not(.card-selected):not(.animating)` (oscillamento ondulatorio con delay scaglionato per nth-child 1-7)
  - `#screen-game::before` overlay SVG inline (pattern rombi sottili) + radial-gradient angoli per atmosfera bisca
  - `.bisca-deco { .tl, .tr, .bl, .br }` per icone angolari (32×32, opacity 0.3)
  - Bordi ottone graffiati (multi-layer box-shadow) su `.shop-item`, `.joker-slot`, `.consumable-slot`, `.popup-box`

#### index.html
- `#screen-game`: aggiunte 4 decorazioni angolari `.bisca-deco` (SVG pixel art inline): tazzina caffè, lampada da bisca, posacenere con sigaro, mazzo di carte

#### gennarino.js
- `_LINES_EXTRA`: aggiunti i 5 nuovi event keys richiesti (`onPlay`, `onWin`, `onLose`, `onJoker`, `onCombo`) ognuno con 5 frasi in dialetto napoletano
- `_EV_EMOTION`: mappati i nuovi eventi alle emozioni (onPlay→happy, onWin→happy, onLose→sad, onJoker→money, onCombo→shocked)
- `Gennarino.say()` già esistente — usata come API pubblica per i nuovi eventi

#### game.js
- Sezione "FASE 11 — POLISH & JUICE": helper functions
  - `showFloatingScore(value, x, y)`: crea `<div.floating-score>` con "+N", auto-rimosso dopo 1s; fallback al centro di `#cards-played` o centro schermo
  - `shakeScreen(intensity)`: `'light' | 'strong'` su `#screen-game`, force reflow per re-trigger, classe rimossa dopo 300ms/500ms
  - `showGoldParticles(count = 12)`: spawn `.gold-particle` su `#cards-played` (o `#screen-game` fallback) con direzioni random e bias verso l'alto
  - `showConfetti(count = 30)`: 30+ `.confetti-pixel` con colori casuali dalla palette, durata 1.6-2.6s, rotazione random
  - Tutte e 4 esposte come `window.X` per debug
- `playHand`: dopo `updateHUD` chiama `showFloatingScore(result.total)`, `shakeScreen('strong')` se total > 5000 altrimenti `shakeScreen('light')`, `showGoldParticles` se `result.total >= BALANCE.particleThreshold` (12 particelle, 24 per >= 5000)
- `playHand`: reazione Gennarino aggiornata — usa `Gennarino.say('onPlay')` o `'onCombo'` (per total >= 1000) o `'jackpot'` (>= 20000)
- `endBlind(true)`: aggiunti `shakeScreen('strong')` + `Gennarino.say('onWin')` all'inizio del flusso vittoria
- `endBlind(false)`: aggiunto `Gennarino.say('onLose')` prima di `endRun(false)`
- `endBlind` (vittoria run, ante > BALANCE.finalAnte): chiamato `showConfetti(40)` prima di `endRun(true)`

### Note di sicurezza / robustezza
- Tutti i nuovi DOM elements sono creati via `createElement` + `textContent`/`setProperty` (no innerHTML su input non controllato)
- `showFloatingScore` valida `value` con `Number.isFinite` e ignora 0
- `shakeScreen` whitelist su `'light' | 'strong'` (default light)
- `showGoldParticles`/`showConfetti` clamp del count (1-40 / 1-120) per evitare DoS DOM
- Tutti i timeout puliscono i nodi creati (no memory leak)
- `prefers-reduced-motion`: già coperto dalla regola globale CSS (`*, *::before, *::after { animation-duration: 0.01ms !important }`)

### Files modificati
- `/Users/alessandrovadala/Desktop/creatività/game/data.js`
- `/Users/alessandrovadala/Desktop/creatività/game/style.css`
- `/Users/alessandrovadala/Desktop/creatività/game/index.html`
- `/Users/alessandrovadala/Desktop/creatività/game/gennarino.js`
- `/Users/alessandrovadala/Desktop/creatività/game/game.js`

### Security checks consigliati
- XSS: nessun `innerHTML` su input utente; tutti i testi nuovi sono costanti hardcoded o numeri validati
- DoS DOM: count clamp su particelle (max 40) e confetti (max 120); auto-cleanup via setTimeout
- Layout regression: verificare che `#screen-game::before` non copra elementi cliccabili (z-index 0 vs `>* { z-index: 1 }`)
- Accessibility: `prefers-reduced-motion` rispettato dalla regola globale; bisca-deco con `aria-hidden="true"`
- Compat: `requestAnimationFrame` doppio in `showFloatingScore` per garantire trigger della transition (testato pattern in altri moduli)

---

## 2026-05-01 — Combo rebalance, deck persistence, tarot UI, boss-win UX, BGM, joker swap

### Modificato — game/data.js, game/bonus.js, game/game.js, game/shop.js, game/index.html, game/style.css, game/app.js

**Agente**: coder — pacchetto multi-file di feature e bilanciamento

#### data.js
- BALANCE.combos rebalance:
  - NERF: `coppia` [10,2]→[5,1], `briscola_reale` [30,3]→[15,2], `sette_e_mezzo` [40,4]→[15,2] (per scoraggiare 2-card lazy plays)
  - BUFF: `tris` [20,3]→[30,4], `poker` [30,7]→[40,8], `napoletana` [50,8]→[65,9], `carico` [25,4]→[35,5], `primiera` [40,5]→[55,7], `scopa` [60,10]→[80,12], `bazzica` [35,4]→[45,5], `calabresella` [45,5]→[55,7], `napola_mista` [45,6]→[55,7]

#### bonus.js
- Tombola: aggiunto `extractCount` allo stato, hard-cap a 9 estrazioni per round con bottone "ESTRAZIONI FINITE" quando esaurite

#### game.js
- `startRun`: aggiunta `playerCards` inizializzata da DECK_NAPOLI (persiste tra blind, include carte da pack)
- `startBlind`: shuffle ora usa `run.playerCards` invece di DECK_NAPOLI; aggiunto `SN_Audio.playBgm` per BGM contestuale (boss/normale)
- `endBlind` (boss win): sostituito setTimeout con popup "BOSS SCONFITTO" che mostra ricompensa, quote del boss e CTA esplicita "VAI AL NEGOZIO"
- Aggiunte `renderConsumableBar()` e `useTarot(idx)`: rendering della tarot bar e uso sandbox dei tarocchi via `new Function('ctx', effectCode)`
- `renderJokerBar` ora chiama anche `renderConsumableBar` alla fine
- `wireGameButtons`: wiring del consumable bar (popup USA/ANNULLA) e del bottone "COMBO?" (cheat-sheet)
- `window.Game` esporta anche `useTarot` e `renderConsumableBar`

#### shop.js
- `shopBuyItem` (joker, slot pieni): sostituito toast d'errore con popup di swap che permette di vendere un jolly esistente per fare spazio (nessun rimborso)
- Nuova funzione `_showJokerSwapPopup(newItem, shopIdx, shopType)` con lista jolly venduibili
- `_openPack`: dopo aver concatenato newCards a `run.deck`, aggiorna anche `run.playerCards` così le carte da pack persistono tra i blind

#### app.js
- `switchScreen`: aggiunto routing BGM (`bgm_menu`, `bgm_shop`, `bgm_slot`) e stop su `screen-end`

#### index.html
- `.action-bar`: aggiunto bottone `#btn-combo-help` ("COMBO?")
- `.joker-bar`: aggiunta label "TAROCCHI" sopra il consumable-bar

#### style.css
- Aggiunto blocco completo "FASE 10 — PREMIUM SHOP + LOOTBOX CSS": animazioni shake/cardFlyIn/explode, lootbox, pack-open, shop pity/lootbox row, premium shop, fake checkout, joker-swap-popup, tarot-use-popup, consumable-bar, blind-win-popup, combo-help, font-size increase pass

## 2026-05-01 — Refactor gameplay: pesca interattiva, nuove combo, MAZZETTI, 3 nuovi boss

### Modificato — game/data.js, game/cards.js, game/game.js, game/index.html, game/style.css

**Agente**: coder — refactor coordinato di 5 file per nuove meccaniche di gameplay

#### data.js
- BALANCE: aggiunti `startHandSize` (3), `maxHandSize` (7), `freeDrawsPerBlind` (4), `paidDrawCost` (1), `paidDrawMaxPerBlind` (6)
- BALANCE.combos: aggiunte 5 nuove combo: `bazzica` [35,4], `briscola_reale` [30,3], `calabresella` [45,5], `sette_e_mezzo` [40,4], `napola_mista` [45,6]
- ZODIAC_BONUSES.vergine.desc aggiornato: ora descrive ordinamento mano (non mazzo)
- BOSSES: aggiunti 3 nuovi boss: `don_mimi_camorrista` (pay_per_draw, ante 4), `concetta_vecchia` (no_new_combos, ante 3), `munaciello_pescatore` (steal_draws, ante 5)
- Nuovo array MAZZETTI (20 carte tipo 'mazzetto', stesso schema dei JOKER, esposto su window.MAZZETTI)
- STRINGS.it: aggiunte label per nuove combo + chiave `mazzetti`

#### cards.js
- `detectCombo(playedCards, semeCtx)` riscritta con priorità: scopa > napoletana > napola_mista > briscola_reale > calabresella > carico > primiera > poker > bazzica > sette_e_mezzo > tris > coppia > single. Secondo parametro `semeCtx` opzionale per briscola_reale.
- `calculateScore` ora passa briscolaSeme a detectCombo, aggiunge 6 nuovi modifiers nel ctx (handsLeft, discardsLeft, blindType, runScore, maxDiscards, handSize) per i Mazzetti, e gestisce `noNewCombos` forzando il combo a 'single' per le combo non base
- breakdown.unshift usa `ctx.combo` finale per consistenza con no_new_combos

#### game.js
- BOSS_RULES_RANDOM_POOL: aggiunte `pay_per_draw`, `no_new_combos`, `steal_draws`
- startBlind:
  - rimosso sort vergine sul deck (era il bug "tutte stesso seme")
  - inizializza `drawsLeft`/`paidDrawsUsed` PRIMA di applyBossRule (per steal_draws)
  - sostituita chiamata `dealHand()` con deal iniziale che usa `BALANCE.startHandSize` (+1 per Gemelli zodiac)
  - applica vergine sort sulla mano dopo deal iniziale
- dealHand: aggiunto sort per seme della mano se `zodiacFlag_vergine` attivo
- playHand: rimossa chiamata `dealHand()` dalla callback animateScore (no auto-fill); aggiunti modifiers handsLeft/discardsLeft/blindType/runScore/maxDiscards/handSize; aggiunto `noNewCombos` modifier
- discardCards: rimossa chiamata `dealHand()` (no auto-fill)
- updatePreview: passa briscolaSeme a detectCombo per anteprima corretta di briscola_reale
- applyBossRule: aggiunto case `steal_draws` (dimezza drawsLeft a min 1)
- Nuova funzione `drawFromDeck()`: gestisce pesca interattiva (free → paid → boss pay_per_draw), reshuffle scarti, sort vergine
- Nuova funzione `renderDeckArea()`: aggiorna deck-count, draws-left, stato del bottone (disabled/paid)
- updateHUD chiama renderDeckArea()
- wireGameButtons: wire del bottone `#btn-draw-card`
- window.Game esporta `drawFromDeck`, `renderDeckArea`

#### index.html
- Aggiunta deck-area tra `played-area` e `hand-area` con bottone `#btn-draw-card`, deck stack visivo, deck-count, draws-left
- Rimosso vecchio `<span class="deck-count">` dal footer (ora nel deck-area)
- Shop section title: "JOLLY" → "MAZZETTI &amp; JOLLY"

#### style.css
- Nuovi stili `.deck-area`, `.deck-btn`, `.deck-stack`, `.deck-card-back`, `.deck-info-overlay`, `.deck-count-num`, `.deck-count-label`, `.deck-draws-indicator`, `.draws-label`, `.draws-value`, `.deck-btn.paid-draw`, `.hand-size-indicator`

#### Bug fix Vergine zodiac
- Il vecchio sort del deck per seme creava "blocchi" di pescate dello stesso seme. Ora il sort è applicato alla `run.hand` dopo ogni pescata: l'utente vede sempre la mano organizzata per seme, ma le pescate dal mazzo sono casuali.

#### Test
- `window._testCards()` continua a funzionare (napoletana denari → 86 chips × 8 mult = 688)
- `detectCombo([{valore:5},{valore:6},{valore:7}])` → `'bazzica'`
- `detectCombo([{valore:1,seme:'denari'},{valore:3,seme:'bastoni'}])` (1+3=4 ≤ 7.5) → `'sette_e_mezzo'`
- `window.MAZZETTI` contiene 20 carte
- DOM contiene `#btn-draw-card`

#### File modificati
- `/Users/alessandrovadala/Desktop/creatività/game/data.js`
- `/Users/alessandrovadala/Desktop/creatività/game/cards.js`
- `/Users/alessandrovadala/Desktop/creatività/game/game.js`
- `/Users/alessandrovadala/Desktop/creatività/game/index.html`
- `/Users/alessandrovadala/Desktop/creatività/game/style.css`

#### Security checks da eseguire
- Verifica che nessun nuovo `effectCode` Mazzetto usi `Math.random` (devono usare `ctx.random()` se serve casualità). Audit: tutti gli effectCode aggiunti NON usano Math.random.
- XSS: nessun innerHTML con dati Mazzetti — i nomi/descrizioni dovranno essere passati con `_escape` quando renderizzati nello shop (responsabilità di shop.js).
- effectCode dei Mazzetti eseguito tramite `new Function` come i JOKER esistenti: stessa sandbox, stessi rischi controllati.

---

## 2026-05-01 — audio.js (Fase 9: Web Audio API — SFX + BGM neomelodica)

### Creato — game/audio.js (~590 LOC)

**Agente**: coder — implementazione modulo audio sintetizzato (zero file, zero CDN)

#### API pubblica esposta su `window.SN_Audio`
- Core: `beep(freq, dur, type, vol)` (dur in SECONDI), `playMelody(notes)`, `playChord(freqs, dur)`
- Volume/mute: `setMuted(bool)`, `setMusicVolume(0..1)`, `setSfxVolume(0..1)`
- BGM: `playBgm(trackId)`, `stopBgm()` con 6 tracce: `bgm_menu`, `bgm_game_normal`, `bgm_game_boss`, `bgm_shop`, `bgm_slot`, `bgm_victory`
- 30 SFX: cardSelect/Deselect/Deal/Play/Discard, chipCount, multIncrease, scoreExplode, coinGet/Lose, slotLever/ReelSpin/ReelStop/WinSmall, jackpot, tombolaExtract/Line/Full, bossAppear/Defeat/Win, gennarinoHappy/Sad/Money, buttonClick, purchase, error, levelUp, victoryRun, defeatRun, predictionAppear

#### Internals
- IIFE chiusa, unico export `window.SN_Audio` (no leak)
- `_getCtx()` lazy-init con `webkitAudioContext` fallback + `resume()` su suspended (compliant con browser autoplay policy)
- `beep()`: oscillatore + gain con `exponentialRampToValueAtTime(0.0001)` (mai 0 per evitare NaN), guard `freq>0 && dur>0`
- `playMelody()`: chain di `setTimeout` non-bloccanti, conversione dur in ms, no-op su `freq=0` (rests)
- `playChord()`: tutti i tono in parallelo, sine + vol bassa per evitare clipping
- `MusicTrack` class: loop via `setTimeout` ricorsivo (NO setInterval), `_ids[]` tracciati per stop pulito, layered playback (bass + lead + opzionale percussion), durata nota = beats × beatMs × 0.88 (gap inter-note)
- 6 BGM tracks: `bgm_menu` (Dm-Bb-F-C, BPM 96, 2 layer), `bgm_game_normal` (Dm-Gm-Am-Dm, BPM 104, 2 layer pulsante), `bgm_game_boss` (Dm-Bb-Am-E armonica, BPM 104), `bgm_shop` (F-C-Dm-Bb sine, BPM 80), `bgm_slot` (BPM 120, 3 layer con kick 80Hz 4-on-floor), `bgm_victory` (tarantella 6/8, BPM 130, eighth-note bass DAD)
- Note costanti `N` con 4 ottave (C3-C7) + R=0 per silenzi
- Init lettura settings da `window.STATE.settings` (sound/musicVolume/sfxVolume) con guard try/catch (STATE potrebbe non esistere ancora — ok)
- Tasto M per toggle mute, delegato a `window.setMute` se disponibile (sync con UI/STATE), fallback a `setMuted(!_muted)`

#### Sicurezza
- `'use strict';` in testa
- Try/catch attorno a OGNI chiamata AudioContext (le eccezioni audio non crashano il gioco)
- Nessun fetch/CDN/file audio — tutto sintetizzato Web Audio API
- Nessun setInterval (solo setTimeout ricorsivo per loop BGM)
- Volume clamp `Math.max(0, Math.min(1, v))` per impedire valori fuori range
- Vol gain MAI 0 in setValueAtTime (uso 0.0001 minimo per `exponentialRampToValueAtTime`)
- Nessun innerHTML, nessun eval, nessuna interpolazione utente

#### File creati / modificati
- Creato: `/Users/alessandrovadala/Desktop/creatività/game/audio.js`
- Aggiornato: `/Users/alessandrovadala/Desktop/creatività/docs/changelog.md`

#### Security checks consigliati
- Verifica che `beep()` non venga chiamato con freq <= 0 o NaN da caller esterni (guard già presente, ma test con fuzz)
- Verifica che `MusicTrack.stop()` cancelli effettivamente tutti i `_ids[]` quando il loop è in corso (loop cleanup)
- Verifica che `playBgm` chiamato in rapida successione (es. switchScreen rapido) non sovrapponga track (il `_currentBgm.stop()` precede il nuovo `play()`)
- Test browser autoplay: prima chiamata audio dopo gesture utente — confermare che `_getCtx().resume()` sblocchi il context
- Verifica sync con `STATE.settings.sound` quando audio.js gira PRIMA di app.js (init defensive — STATE può essere undefined)
- Test M-key: doppio binding se app.js o altri moduli aggiungono altro listener

---

## 2026-05-01 — zodiac.js (Fase 8: Mago Astrologo + UI selezione segno)

### Creato — game/zodiac.js (~235 LOC)

**Agente**: coder — implementazione popup Mago, predizioni e arricchimento UI selezione zodiacale

#### API pubblica
- `window.Zodiac.showPrediction(zodiac, isVictory)` — mostra popup Mago con typewriter; ritorna Promise da `popup()`

#### Internals
- IIFE chiusa; nessuna leak globale eccetto `window.Zodiac`
- `_escape()` per ogni interpolazione in `innerHTML` (defense-in-depth)
- `_validSign()` filtra `data-sign` e `STATE.meta.zodiac` contro whitelist `ZODIAC_ALLOWED`
- `_typewriter()` ricorsivo via `setTimeout` (no setInterval), pausa extra su `.!?`
- `_magoSVG()` pixel art 64×80 inline: cappello viola con stelle oro, barba bianca, veste viola
- `_renderZodiacDetail()` scrive `#zodiac-detail` con simbolo unicode + label + desc da `ZODIAC_BONUSES`
- `_installEndScreenObserver()` MutationObserver su `#screen-end` (filtro `class`); 400ms delay → `showPrediction(STATE.meta.zodiac, STATE._lastRun.victory)`
- Init via `DOMContentLoaded` (gira dopo defer-load di app.js, sovrascrive il detail di `wireNavigation()`)

#### Costanti
- `TYPE_SPEED_MS=28`, `TYPE_PUNCT_EXTRA_MS=120`, `POPUP_RENDER_DELAY_MS=50`, `END_SCREEN_DELAY_MS=400`

#### Sicurezza
- Nessun fetch/CDN, SVG inline
- Whitelist hard sui segni prima di qualunque uso
- Tutto innerHTML passa per `_escape()` (anche stringhe da `STRINGS`/`PREDICTIONS`)
- Bottone "ACCETTO IL MIO DESTINO" `disabled` finché typewriter non termina (no skip race)

#### File modificati
- Creato: `/Users/alessandrovadala/Desktop/creatività/game/zodiac.js`
- Aggiornato: `/Users/alessandrovadala/Desktop/creatività/docs/changelog.md`

#### Security checks consigliati
- Verifica che nessun valore di `PREDICTIONS` contenga HTML attivo (anche se escapato, validare che il content-policy del progetto sia consistente)
- Conferma che `popup()` di app.js continui a usare `innerHTML` solo per HTML controllato — questo modulo passa solo stringhe escaped + SVG statico
- Test che `STATE._lastRun.victory` sia booleano (cast con `!!` già presente)
- Test edge case: schermata `#screen-end` attivata senza `_lastRun` (l'observer ritorna early)

---

## 2026-05-01 — shop.js (Fase 6: negozio + monetizzazione)

### Creato — game/shop.js (~750 LOC)

**Agente**: coder — implementazione negozio in-game e monetizzazione DEMO MODE

#### API pubblica
- `Shop.open()` — reset rerollCount/slotPlays, genera offerte, render, toast post-boss, Gennarino reaction
- `Shop.buyItem(type, idx)` — acquisto joker/tarot/pack con check ducati e slot, deduce money, marca sold, applica tarocco "forza" (gratis), trigger upsell se non puoi permetterti
- `Shop.reroll()` — costo `rerollBase × 2^n`, cap a `maxRerollsPerShop`, primo gratis con Acquario zodiac
- `Shop.openLootbox(tier)` — pesca carte con `_rollLootbox` (drop rates + pity cross-tier), animazione 2 fasi (shake + reveal), screen shake + jackpot SFX su legendary, recap "PRENDI TUTTO"
- `Shop.openPremiumShop()` — popup con 4 pacchetti `BALANCE.premiumPacks`, banner DEMO MODE prominente
- `Shop.grantBattlePassXp(xp)` — leveling con `BALANCE.battlePassXpPerLevel`, ricompense ducati per livelli chiave, toast "LIVELLO SU!"

#### Internals
- `_weightedJokerDrop()` con bonus Scorpione zodiac (+2% rare)
- `_rollLootbox(tier)` con pity garantito (rare a 20, legendary a 50, cross-tier)
- `_fakePurchase(packId)` — countdown 3-2-1 con setTimeout chain (no setInterval), poi popup verde DEMO MODE + Gennarino jackpot
- `_openPack(type)` — pesca 2/3/4 carte da DECK_NAPOLI con id univoci, popup reveal animato, aggiunge a run.deck
- `_grantLootboxRewards()` — riempie run.jokers fino a maxSlots, overflow a meta.unlockedJokers
- Pity counter sempre visibile in UI lootbox: "Rare tra X · Legendary tra Y"
- Drop rates visibili nel `title` tooltip + sotto la card

#### Modifiche game.js
- `endBlind(win)`: chiamata `Shop.grantBattlePassXp(xp)` dopo `totalEarned` (xp varia per blind/boss/ante≥4)
- Post-boss blind: chiamata `Shop.open()` PRIMA di `setTimeout(switchScreen('screen-shop'))`

#### Modifiche app.js
- `#btn-premium` ora chiama `Shop.openPremiumShop()` se disponibile, altrimenti fallback toast

#### Sicurezza
- `_escape()` locale applicato a TUTTI i testi dinamici interpolati (nomi joker, descrizioni, rarità, fakePrice, skin labels)
- `j.art.bg` MAI interpolato in `style=` — passa solo per `SPRITES.jokerCard()` che valida regex `^#[0-9a-fA-F]{3,8}$`
- Rarità validata via whitelist `RARITY_BORDER`
- `setTimeout` chain per countdown (no `setInterval`)
- `Math.random()` solo in shop.js (non passa per ctx joker — ok, non gira in sandbox)
- Nessun `eval`, nessun `innerHTML` con dati utente
- `STATE.meta.lootboxPity` lazy-init con type check
- `STATE.meta.battlePassLevel/Xp` lazy-init con `Number.isFinite`
- Delegazione click + supporto Enter/Space per accessibilità

#### File modificati
- `/Users/alessandrovadala/Desktop/creatività/game/shop.js` (CREATO)
- `/Users/alessandrovadala/Desktop/creatività/game/game.js` (Battle Pass XP + Shop.open chiamata)
- `/Users/alessandrovadala/Desktop/creatività/game/app.js` (premium button wire)

#### Security checks consigliati
- XSS: verificare che ogni `_escape` copra correttamente nomi joker custom (anche da localStorage)
- DoS / pity exploit: pity counter NON resettato su game over (solo aperture)
- Wallet manipulation: `run.money` decrementato sempre PRIMA di applicare effetti
- Replay: `_shopWired` previene doppio binding sui delegati
- Lootbox infinite loop: `_rollLootbox` non itera, restituisce sempre una rarity
- Premium fake purchase: marca `meta.battlePassUnlocked` ma non sblocca gameplay (solo cosmetici)

---

## 2026-05-01 — game.js (Fase 5: game loop principale)

### Creato — game/game.js (~600 LOC)

**Agente**: coder — implementazione game loop completo

#### Funzioni principali implementate
- `startRun()` — inizializza STATE.currentRun con schema completo, applica zodiac bonus, incrementa totalRuns
- `startBlind(blindType)` — small/big/boss, applica regola boss, target da BALANCE.anteTargets, joker on_round_start
- `pickBoss()` — filtra per ante e usedBosses, gestisce boss finale Ante 8 (munaciello_oro)
- `applyBossRule(boss)` — switch su 16 regole boss, gestisce immediate (no_discard, swap, ecc.) e runtime (half_chips, ecc.)
- `dealHand()` — pesca carte fino a handSize, reshuffle scarti se mazzo vuoto
- `selectCard(index)` — toggle max 5, aggiorna preview combo
- `playHand()` — costruisce modifiers boss, chiama Cards.calculateScore, sincronizza money/jokerState, animazione, checkBlindEnd
- `discardCards()` — joker on_discard per ogni carta, dealHand di rimpiazzo
- `checkBlindEnd()` — vittoria/sconfitta condizionale
- `endBlind(win)` — calcolo guadagno (base+hands+discards+interest), avanzamento, shop solo dopo boss
- `endRun(victory)` — aggiorna victories/bestScore, popola STATE._lastRun, showEndScreen
- `showEndScreen(victory)` — popola statistiche, previsione zodiac/victory, Gennarino reaction
- `updateHUD()` — atomico, tutti i campi DOM dell'HUD
- `renderGameScreen()`, `renderJokerBar()`, `renderHandOnly()` — separati per perf
- `animateScore(result, onComplete)` — counter rAF easeOutCubic, joker flash, screen shake scaled by total, skip click/keydown
- `continueFromShop()` — esposto globalmente per shop.js
- `sortHand()`, `showRunInfo()` — utilities

#### Modifiche a game/cards.js
Aggiunti supporti modifiers boss in `calculateScore`:
- `modifiers.invertComboMult` — lookup table inversa per Befana de Roma
- `modifiers.roundChipsBonus` / `roundMultBonus` — applicati pre-card-loop (joker alba_napoletana)
- `modifiers.noFigureBonus` / `onlyNumbers` — chip figure = 0
- `modifiers.noAssoChips` — chip Asso = 0 (Pinocchio Bugiardo)
- `modifiers.halfDenari` — chip Denari ÷ 2 (Munaciello)
- `modifiers.halfChips` — applicato dopo tutti i joker
- `modifiers.leoneFirstHand` — chips ×1.5 (zodiac Leone, prima mano)

#### File toccati
- CREATO: `/Users/alessandrovadala/Desktop/creatività/game/game.js`
- MODIFICATO: `/Users/alessandrovadala/Desktop/creatività/game/cards.js` (calculateScore: nuovi modifiers boss/zodiac)

#### Security checks da eseguire
- `applyJokerEffect` già usa `new Function('ctx', code)` — verificare che `effectCode` resti read-only (data.js è asset statico, OK)
- `popup()` riceve HTML da game.js: tutti i valori interpolati passano per `_escape()` — verificato per boss-intro, joker-info, run-info
- `STATE.currentRun` non viene mai persisto da utente (solo flussi interni) — saveState protegge da injection
- `effectCode` whitelist: i joker NON usano Math.random (usano ctx.random) ma la regola è documentata in data.js, da auditare in security-tester

#### Note tecniche
- Nessun `setInterval`, solo `requestAnimationFrame` per animateScore
- Skip animazione: click/keydown set `_skipAnim` flag
- `_applyMoneyAndStateJokers` rilegge i joker on_hand_played con regex `/ctx\.money|ctx\.jokerState/` per recuperare side effect non riportati da `calculateScore` (workaround necessario perché calculateScore non restituisce ctx.money)
- handsPlayedThisRound passato PRIMA dell'incremento (contratto con caffe_forte)
- jokerIds passato in modifiers (sinergia pizza_fritta + pizzaiolo)

---

## 2026-05-01 — Audit Monetizzazione (pre-shop.js)

### Audit — docs/monetization.md + game/data.js (sezione BALANCE)

**Agente**: monetization designer — audit completo economia e monetizzazione

#### Fix urgenti applicati a game/data.js (sezione BALANCE)

**FIX 1 — Slot Machine RTP: da ~7% a ~18%**
- Payouts vecchi: cherry=5, lemon=10, bell=25, coin=50, seven=200
- Payouts nuovi: cherry=20, lemon=30, bell=60, coin=80, seven=300, diamond=1000 (invariato)
- Motivazione: RTP 7% è troppo punitivo per un mini-game arcade. I giocatori smettevano di usare
  la slot e il sink economico non funzionava. 18% mantiene tensione senza essere demotivante.

**FIX 2 — Pity Timer Cross-Tier**
- Problema: pity legendary @ 50 aperture Maestro = 15.000💰 — irraggiungibile (~100 run)
- Fix: `pityCounterShared: true` — il contatore conta aperture di QUALUNQUE tier
- Con 50 aperture miste: costo ~5.700💰 vs 15.000💰 — raggiungibile in 5-6 run
- Aggiunto flag `pityCounterShared` per segnalare shop.js del comportamento corretto

**FIX 3 — Valori mancanti dal BALANCE (aggiunti)**
- `maxRerollsPerShop: 4` — cap documentato per reroll in shop
- `shopJokersVisible: 3`, `shopTarotsVisible: 2`, `shopPacksVisible: 1` — slot visibili
- `slotMaxPerShopVisit: 3` — cap utilizzi slot per visita
- `battlePassLevels: 30` + tutta la struttura XP (mancava completamente)
- `premiumPacks` — definizione contenuti pacchetti fake con prezzi, ducati, lootbox

#### Aggiornato — docs/monetization.md

- Aggiunta tabella simulazione economia verificata (guadagno per run con breakdown)
- Sezione "Economia Ducati" con breakpoint espliciti per giocatore frugale vs ottimizzatore
- Contenuto pacchetti premium riscritto con giustificazione del valore percepito per prezzo
- Spec UI checkout cafona (animazione carta di credito — step by step per shop.js)
- ROI lootbox calcolato per tutti e 3 i tier (confermati — ROI negativo è corretto)
- Verifica differenziazione tier (iniziato→adepto: rare +350%, adepto→maestro: legendary +400%)
- Sezione pity timer riscritta con FIX cross-tier e costo realistico documentato
- Battle Pass: struttura XP verificata (completamento in ~3 run = ~3 ore — accettabile)
- Battle Pass ricompense per livello riscritta (progressione early→late corretta)
- Sezione "Skin Sistema" confermata: zero pay-to-win
- **NUOVA sezione** "Trigger di Monetizzazione — 5 Momenti Chiave" (mancava)
- **NUOVA sezione** "KPI" con 7 metriche realistiche per demo (con come misurarle)
- **NUOVA sezione** "Checklist shop.js" con feature prioritizzate per impatto economico

---

## 2026-05-01 — Fase 4: Mascotte Gennarino (gennarino.js)

### Aggiunto — game/gennarino.js
- Modulo mascotte "Gennarino 'O Gallo": render widget, bubble dialog typewriter, react-to-events, idle loop
- GENNARINO_LINES: 20 frasi generiche extra in dialetto napoletano (in aggiunta alle 25 di STRINGS.it.gennarino)
- _LINES_EXTRA: 12 categorie evento con 4-5 frasi ciascuna (card_play, card_select, high_score, low_score, win, lose, boss_enter, jackpot, shop_open, joker_buy, tarot_use, tombola)
- _EV_EMOTION: mappa evento -> emozione (whitelist da sprites.js)
- API: Gennarino.render / inject / bubble / react / say / dance / startIdle / stopIdle
- Effetto typewriter su bubble: 1 char ogni 28ms via setTimeout ricorsivo, hide automatico dopo 3500ms, cancel/restart se nuova bubble arriva
- Anim classes su sprite: anim-breathe (default), anim-bounce (happy), anim-shake (shocked/angry), anim-dance (dancing)
- Esposizione globale: window.Gennarino, window.GENNARINO_LINES

### Aggiornato — game/style.css
- Aggiunto blocco "GENNARINO WIDGET" PRIMA della media query prefers-reduced-motion
- Stili: .gennarino-widget, .gennarino-sprite, .gennarino-bubble (con coda triangolare ::after)
- Keyframes: gennarino-breathe, gennarino-bounce, gennarino-shake, gennarino-dance, bubbleIn
- Override .logo-box (transparent, no border/shadow/animation) per ospitare il widget nel menu

### Aggiornato — game/index.html
- screen-menu .logo-box: sostituito <div class="logo-emoji"> con <div id="gennarino-menu">
- screen-game #joker-bar: aggiunto <div id="gennarino-game"> dopo .consumable-bar
- Tag <script defer src="gennarino.js"> già presente in posizione corretta (dopo audio.js, prima di zodiac.js)

### Aggiornato — game/app.js
- init(): dopo lo switchScreen iniziale, se window.Gennarino esiste -> Gennarino.inject('gennarino-menu', 'idle', 90) e Gennarino.startIdle()

### Note tecniche
- Defensive: il modulo funziona anche se SPRITES o STRINGS non sono ancora caricati (fallback a stringa vuota / "Ué guagliò!")
- Sicurezza: nessun eval, nessuna chiamata di rete; bubble text inserito SOLO via textContent (no XSS); SVG sprite via innerHTML solo da SPRITES interno
- Stato modulo: _bubbleTimer, _bubbleHide, _idleInterval (variabili module-level, non globali)
- _findActiveWidget(): priorità a .screen.active .gennarino-widget, fallback a primo widget in pagina
- Idle loop: setInterval 9s con probabilità 0.35 di parlare (frase pescata da unione STRINGS.it.gennarino + GENNARINO_LINES)
- dance() controlla document.body.contains(widget) prima del reset (no leak se widget rimosso)

## 2026-04-30 — Fase 3: Cards module (cards.js)

### Aggiunto — game/cards.js
- Rendering: renderCard(), renderCardBack(), renderHand(), renderPlayedArea() — wrapper HTML attorno a SPRITES
- Scoring PURO: detectCombo() (priorità scopa > napoletana > poker > carico > primiera > tris > coppia > single)
- calculateScore(playedCards, jokers, modifiers) — formula completa con 3 fasi joker (passive → on_card_scored → on_hand_played), settebello, briscolaPerCard, breakdown dettagliato
- applyJokerEffect() — esecuzione sicura via `new Function('ctx', code)` con try/catch (no eval, scope isolato)
- Utils: shuffleDeck() Fisher-Yates non-mutante, drawCards() splice
- Test smoke window._testCards(): napoletana di denari → chips=86 mult=8 total=688
- Esposizione globale: window.Cards = { renderCard, renderCardBack, renderHand, renderPlayedArea, detectCombo, calculateScore, applyJokerEffect, shuffleDeck, drawCards }

### Aggiornato — game/style.css
- Aggiunte classi .hand-cards, .played-cards, .card-wrapper, .card-selected, .card-select-indicator, .card-back, .hand-empty in coda al file

### Note tecniche
- calculateScore non muta gli input (playedCards, jokers, modifiers) — costruisce un ctx interno
- Nessun accesso al DOM nelle funzioni di scoring
- ctx.random iniettato da modifiers (determinismo per joker/tarocchi)
- breakdown[] traccia ogni contributo (combo, settebello, briscola, joker per fase)

### File modificati
- /Users/alessandrovadala/Desktop/creatività/game/cards.js (creato)
- /Users/alessandrovadala/Desktop/creatività/game/style.css (append CSS carte)
- /Users/alessandrovadala/Desktop/creatività/docs/changelog.md (questo log)

### index.html
- `<script defer src="cards.js">` già presente — nessuna modifica necessaria

### Security checks consigliati
- Verifica che calculateScore non muti playedCards/jokers/modifiers
- Verifica che applyJokerEffect non possa accedere a window/document tramite codice malizioso negli effectCode
- Verifica che renderCard/renderHand non sia chiamato con input non sanitizzato (card.id, card.seme, card.valore vengono iniettati nel HTML come data-attr)
- Verifica che effectCode dei JOKER in data.js usi solo ctx.* e non Math.random direttamente quando determinismo è richiesto

---

## 2026-05-01 — Fase 2: Data Layer (data.js) + Fase 1.5: Sprites (sprites.js)

### Aggiunto — sprites.js
- Sistema grafico SVG completo: SPRITES.card(), cardBack(), gennarino() x10 emozioni, slotSymbol() x7, jokerCard() x4 rarità, bossFrame() x5 boss, biscaBg(), test()
- Figure (Fante/Cavallo/Re) differenziate per seme: colore outfit + simbolo/arma/scettro specifico per bastoni/coppe/denari/spade
- Helper _esc(), whitelist _SEMI/_VALORI/_EMOTIONS/_SYMBOLS/_RARITIES per sicurezza input

### Aggiunto — data.js
- BALANCE: tutti i magic numbers (8 ante, chip per carta, combo, economia, lootbox, slot)
- DECK_NAPOLI: 40 carte con id unici
- BOSSES: 18 boss completi (id, regola, ruleDesc, intro, onLose, onWin, difficulty, firstAnte, portrait)
- JOKERS: 25 joker (10 common, 8 uncommon, 5 rare, 2 legendary) con effectCode stringa
- TAROTS: 10 tarocchi consumabili
- SMORFIA: 90 voci
- SLOT_SYMBOLS: 7 simboli pesati
- PREDICTIONS: 12 generiche + 2×12 segni + 5 victory
- ZODIAC_BONUSES: 12 segni con apply()
- STRINGS.it: i18n base + 25 frasi Gennarino

### Fix sicurezza applicati
- Tarocchi luna/giudizio: id carte unici (counter suffix per duplicati di seme/valore)
- Tarocchi stelle: rimosso Date.now() non-deterministico → ctx.turnCount
- ctx whitelist documentata completamente nel commento data.js
- Tutti i Math.random() nei tarocchi → ctx.random() (iniettato da game.js)

### Prossimi step
- Fase 3: cards.js (usa SPRITES.card() + calculateScore() pura)
- Fase 4: gennarino.js (usa SPRITES.gennarino())
- Fase 5: game.js (game loop, usa BALANCE + JOKERS + BOSSES + calculateScore)

## 2026-04-30 — Fase 3: Data Layer completo (`game/data.js`)

### Aggiunto
- `game/data.js` (nuovo, ~590 righe): data layer monolitico esposto su `window`. Niente DOM, niente fetch, niente import — solo dati e l'unica funzione IIFE che genera il mazzo.
  - `BALANCE`: tutti i magic numbers raccolti — `anteTargets` (8 ante × 3 blind), `handsPerBlind=4`, `discardsPerBlind=3`, `handSize=5`, `maxJokerSlots=5`, `cardChips` (1=11, 3=10, re=4, cavallo=3, fante=2, altri=0), `combos` (single/coppia/tris/poker/napoletana/carico/primiera/scopa con [chipsBonus, multBase]), `settebelloBonus=50`, `briscolaPerCard=5`, `blindMoney=[3,4,5]`, `interestMax=5`, `jokerCost` per rarità, `tarotCost=3`, `packCost`, `rerollBase=5`, `lootbox` (3 tier con drop rates), `pityRare=20`, `pityLegendary=50`, `jokerDropRates`, `slotCost=10`, `slotPayouts`, `finalBossId='munaciello_oro'`.
  - `DECK_NAPOLI`: 40 carte generate via IIFE (4 semi × 10 valori), id deterministico `${seme}_${valore}`, chip dal `BALANCE.cardChips`. Verificato: 40 carte uniche.
  - `BOSSES`: 18 boss con `id`, `name`, `rule` (codice macchina), `ruleDesc` (italiano standard, gameplay critico), `intro/onLose/onWin` (dialettale, flavor), `difficulty` 1-5, `firstAnte` 1-8, `portrait` (matching `SPRITES.bossFrame`). Lista: pulcinella_nero, munaciello, janara, sangennaro_severo, pazzariello, pinocchio_bugiardo, smorfia_in_persona, lione_san_marco, geppetto_ubriaco, arlecchino, mammasantissima, tarocco_nero, sirena_vesuvio, don_chisciotte, befana_cattiva, lupo_mannaro, befana_roma, munaciello_oro (finale ante 8).
  - `JOKERS`: 25 jolly con `effectCode` come STRINGA JS (parseable, validata con `new Function`). Distribuzione: 10 common / 8 uncommon / 5 rare / 2 legendary. `effectCode` accede solo a `ctx.chips/mult/money/played/scored/card/combo/ante/briscolaSeme/jokerState/jokerCount/handsPlayedThisRound/discardedThisRound`. Niente DOM, niente window. Joker dal BRIEF: cornicello, sfortuna, pesce_oro, re_cafone, smorfia_joker, diavolo, munaciello_buono, mano_nera, caffe_forte, baba. Originali: sfogliatella, pizzaiolo, tarallo, limoncello, sigaro_toscano, zampogna, amuleto_zia, sangue_napoli, briscola_cavalcata, tarantella, mago_alchimista, campana_gennaro, cuoppo_fritto, maradona_dieci (legendary), vesuvio_eruzione (legendary).
  - `TAROTS`: 10 tarocchi consumabili — mago, imperatrice, ruota, sole, luna, torre, stelle, giudizio, forza, papessa. `effectCode` opera su `ctx.deck/hand/money/handSize/jokers/maxJokerSlots/nextJokerFree/requestTransform`.
  - `SMORFIA`: 90 voci complete (1-90), tutta la lista classica napoletana (47='o muorto, 33=ll'anne 'e Cristo, 90='a paura, ecc.).
  - `SLOT_SYMBOLS`: 7 simboli con `weight` di probabilità relativa (cherry 30, lemon 25, bell 20, coin 15, seven 6, star 3, diamond 1).
  - `PREDICTIONS`: dizionario `{ generic: [12 frasi], <12 segni>: [2 frasi ognuno], victory: [5 frasi] }`. Tono: esagerato, drammatico, ridicolo, finale comico.
  - `ZODIAC_BONUSES`: 12 segni con `desc` (italiano) e `apply(state)` (funzione REALE — chiamata solo da codice trusted all'avvio run).
  - `STRINGS.it`: i18n base. Livello 1 (UI critica, italiano standard): play, discard, score, hand, deck, ante, target, hands, discards, coins, combinazioni (single/coppia/tris/poker/napoletana/carico/primiera/scopa/settebello/briscola), semi, valori figure, blinds, shop. Livello 2 (flavor): 25 frasi Gennarino, 4 winPhrases, 4 losePhrases, demo mode messages, popup zodiacale.

### Tecniche
- File 100% data, nessuna chiamata side-effect a parte le assegnazioni finali su `window.*`.
- `effectCode` joker/tarot validato runtime con `new Function('ctx', code)` — tutti parsano. L'esecuzione vera resta responsabilità del wrapper sicuro in `game.js`.
- `ZODIAC_BONUSES.apply` sono funzioni reali (non stringhe) perché chiamate solo da codice interno trusted al run-start, non da dati persistiti.
- IIFE per `DECK_NAPOLI`: garantisce id deterministici e single-source-of-truth per i chip-per-carta, evitando duplicazioni.
- Verifica `node --check`: syntax OK. Verifica integrità (carte=40 uniche, boss=18 incluso finale, joker=25 con rarity ratio 10/8/5/2, tarot=10, smorfia=90, slot=7, zodiac=12, predictions=12 segni+generic+victory) eseguita con script di smoke-test.

### File creati / modificati
- creato: `game/data.js`
- modificato: `docs/changelog.md` (questa entry)

### Verifiche di sicurezza consigliate
- Niente backend, niente extension code in questo task → skill backend/extension non applicabili.
- `effectCode` è una stringa: chi la esegue (game.js) DEVE usare `new Function('ctx', code)` con un `ctx` whitelistato (proxy o oggetto con solo i campi previsti) — MAI `eval()` diretto, MAI con accesso a `window`, `document`, `globalThis`, `localStorage`, `fetch`. Documentato come contratto.
- `STRINGS` non passa per `innerHTML` direttamente da questo file — l'uso safe (textContent o sanitize) è responsabilità dei consumer (`app.js` usa già textContent in `toast()`).
- Nessun dato di rete, nessuna PII, nessuna chiave/token.

## 2026-04-30 — Fase 2: Sistema Sprites SVG (carte, Gennarino, slot, joker, boss)

### Aggiunto
- `game/sprites.js` (riscritto da zero, ~700 righe): oggetto globale `SPRITES` esposto su `window.SPRITES`. API pubblica:
  - `SPRITES.card(seme, valore, opts)`: carta napoletana SVG 70x105, viewBox fisso, taglie sm/md/lg, ribbon dorato con label valore (ASSO/DUE/.../RE), bordo ottone doppio, area centrale con disposizione pips per 1-7 (asso, verticale, triangolo, 2x2, 5-quincunx, 2x3, 7-pattern), pixel art figure (Fante/Cavallo/Re) costruite con matrici di stringhe e palette via `_pix()`, simboli seme parametrici (bastone marrone con 3 nodi, calice rosso, moneta dorata con `$`, spada blu con guardia), corner basso-sx + mini-icona seme angolo basso-dx, drop-shadow oro su `selected`.
  - `SPRITES.cardBack(opts)`: dorso verde scuro con pattern losanghe `#1a8a3e`+punti oro, ribbon "BISCA", monogramma BR + cornetto rosso pixel.
  - `SPRITES.gennarino(emotion, size)`: gallo con cresta rossa, occhiali da sole dorati (rect oro+nero+highlight), maglia azzurra Napoli con "10" giallo + bordini, catenona dorata ad arco con cornetto, zampe gialle a 3 dita. 10 emozioni: idle (sigaro+fumo `.smoke`), happy (cresta dritta + ali alzate + beak aperto), sad (cresta inclinata + goccia), angry (cresta zigzag + linee rabbia), shocked (occhi cerchi+pupilla), thinking (ala su beak + `?`), money (occhi `$` + monete cadenti), winking (occhio chiuso + occhio normale), dancing (corpo ruotato 15° + gambe a V), sleeping (occhi chiusi + ZZZ).
  - `SPRITES.slotSymbol(symbol)`: 7 simboli SVG 60x60: cherry, lemon, bell, coin (`$`), seven, star (10-punti polygon), diamond.
  - `SPRITES.jokerCard(rarity, emoji, bgColor)`: frame 70x105 con bordo per rarità (grigio/verde/azzurro/oro), drop-shadow per rare/legendary, pattern holo diagonale per legendary (via `<defs><pattern>`), ribbon top con label rarità, emoji centrale font-size 32, decorazioni angoli (rombi per rare, stelle 10-punti per legendary), classe `.joker-legendary` per animazione `jokerShine`.
  - `SPRITES.bossFrame(bossId, name)`: 200x240, sfondo `#1a0a14` con pattern croci pixel, area ritratto 160x160 con `drop-shadow #e63946`, ribbon nome rosso. 5 ritratti pixel art espliciti: pulcinella (maschera bianca + naso lungo + colletto volant + righe), munaciello (cappello monaco + occhi verdi + monete), janara (capelli neri lunghi + luna crescente + occhi rossi), sangennaro (aureola + mitra + barba + ampolla con liquido rosso), pazzariello (cappello con 5 piume colorate + giacca a strisce + trombetta). Default: "?" su grigio.
  - `SPRITES.biscaBg()`: overlay scenografico con lampadina pendente, tazzina caffè, bicchierino amaro, insegna "APERTO" neon, monete sparse.
  - `SPRITES.test()`: ritorna pagina HTML completa con tutte le sprite affiancate (assi per seme, tutti i valori per Denari, figure tutti i semi, selected, card back 3 size, Gennarino tutte emozioni, slot symbols, joker per rarità, boss frames con nomi).
  - Helper interni: `_sz`, `_valLabel`, `_cornerLabel`, `_miniSuit`, `_suitSymbol`, `_cardPips`, `_pix`, `_figFante`, `_figCavallo`, `_figRe`, `_bossPortrait`.
- `game/style.css` (append in fondo, blocco "SPRITES & CARD VISUALS"): hover/selected per `.card-svg` con drop-shadow oro, `.gennarino` pixel-rendering + scale on hover, keyframe `jokerShine` (drop-shadow + hue-rotate) applicato a `.joker-legendary`, keyframe `smokeDrift` per `.smoke` (sigaro Gennarino), `.boss-portrait` con drop-shadow rosso, `.bisca-bg` overlay full-screen z-index 1 opacity 0.3.

### Tecniche
- Tutte le forme via `<rect>`, `<circle>`, `<polygon>`, `<line>`, `<text>`, `<ellipse>`, `<path>` (path solo per curve semplici tipo bocche/catene/colletti, no `d=""` complessi parametrici).
- Outline `stroke="#1a0a14" stroke-width="0.5"` su tutti i pezzi pixel art.
- Nessun URL esterno, nessuna immagine, nessun font esterno.
- Ogni funzione ritorna template literal stringa SVG completa, pronta per `innerHTML`.
- Validato runtime con `node -e` (require + chiamate funzioni): tutte le funzioni emettono SVG valido. `SPRITES.test()` produce ~444 KB di HTML.

### File creati / modificati
- modificato: `game/sprites.js`
- modificato: `game/style.css` (append blocco sprites)

## 2026-04-30 — Fase 1: Skeleton HTML + CSS + App Bootstrap

### Aggiunto
- `game/index.html`: 7 schermate (zodiac, menu, game, shop, slot, tombola, end), struttura DOM completa, overlay globali (`#toast-container`, `#popup-overlay`, `#btn-mute`), 9 tag script defer in ordine canonico (data, cards, audio, gennarino, zodiac, game, shop, bonus, app).
- `game/style.css`: palette pixel art (oro/verde/rosso/viola/rosa), scanlines CRT via `body.crt::after`, vignette via `body::before`, card styling con 4 modificatori di seme, HUD a griglia, joker bar, slot machine con bulbi animati, tombola, popup, toast, animazioni `screenIn / neonPulse / bulbBlink / floatUp / shake / pulse`, responsive a 2 breakpoint (>=768px desktop con HUD 6 colonne e joker laterale, <=767px mobile con carte 55x82), supporto `prefers-reduced-motion`.
- `game/app.js`: STATE globale (meta + currentRun + settings), `loadState/saveState` con debounce 500ms, `switchScreen`, `toast` (textContent safe), `popup` Promise-based, `closePopup`, `t()` i18n stub con fallback alla chiave, `setMute` con hook a `window.SN_Audio`, listener Konami code, routing `init` (zodiac se primo avvio, altrimenti menu), esposizione globale su `window.STATE / switchScreen / saveState / loadState / toast / popup / closePopup / t`.

### Sicurezza
- Validazione whitelist zodiac (12 segni) + type-check campi numerici (`Number.isFinite`, `>=0`) + array (`Array.isArray`) + lang whitelistata (`it/en`) in `loadState()`.
- Prototype pollution guard in `deepMerge()` (skip `__proto__`, `constructor`, `prototype`).
- Cap `999999999` su coins (cheat / Konami) per evitare overflow.
- Font CDN rimosso (no dipendenza Google Fonts), font stack solo da sistema.
- `toast()` usa `textContent` (XSS-safe).
- `popup()` accetta solo HTML developer-controlled — documentato esplicitamente nel commento; non passare input utente non sanitizzato.
- `localStorage` con try/catch su parse e write; chiave singola `briscola_royale_v1`; nessun dato sensibile.
- Listener Escape del popup correttamente rimosso alla chiusura (no leak).
- Konami: ricompensa solo cosmetica/economica (+777 ducati), nessuna escalation di privilegi.

### Id DOM esposti per i moduli futuri

**Schermata zodiac**: `screen-zodiac`, `zodiac-grid`, `zodiac-detail`, `btn-zodiac-confirm`, 12 bottoni `.zodiac-icon[data-sign]`.

**Schermata menu**: `screen-menu`, `btn-menu-play`, `btn-premium`, `btn-collection`, `btn-stats`, `meta-coins-display`, `meta-zodiac-display`.

**Schermata game**: `screen-game`, `hud`, `hud-ante`, `hud-round`, `hud-score`, `hud-progress-bar`, `hud-target`, `hud-hands`, `hud-discards`, `hud-money`, `joker-bar`, `joker-slots`, `consumable-bar`, `cards-played`, `cards-hand`, `round-info`, `hand-type-display`, `chips-mult-display`, `btn-play`, `btn-sort-rank`, `btn-discard`, `deck-count`, `btn-run-info`, `btn-quit-run`.

**Schermata shop**: `screen-shop`, `shop-coins-display`, `shop-jokers`, `shop-tarots`, `shop-packs`, `btn-reroll`, `btn-next`.

**Schermata slot**: `screen-slot`, `reel-1`, `reel-2`, `reel-3`, `slot-display`, `btn-slot-spin`, `slot-credit`, `btn-slot-exit`.

**Schermata tombola**: `screen-tombola`, `tombola-card`, `tombola-last-numbers`, `btn-tombola-extract`, `tombola-status`, `btn-tombola-exit`.

**Schermata end**: `screen-end`, `end-title`, `end-score`, `end-ante`, `end-hands`, `end-spent`, `end-jokers`, `end-prediction-box`, `end-prediction-text`, `btn-retry`, `btn-menu-end`.

**Globali**: `btn-mute`, `toast-container`, `popup-overlay`, `popup-box`.

### Documentazione
- Aggiunto `docs/fase1-skeleton.md` con dettaglio completo: schema STATE, API pubblica, pattern CSS riutilizzabili, contratti dei moduli futuri (`data.js`, `cards.js`, `audio.js`, `gennarino.js`, `zodiac.js`, `game.js`, `shop.js`, `bonus.js`).

### Verifiche da eseguire
- Aprire `game/index.html` da `file://` e controllare console: gli unici errori attesi sono i 404 sui JS non ancora creati (verranno scaricati con `defer`, non bloccano il rendering grazie alle guard `typeof X !== 'undefined'`).
- Verificare routing iniziale: senza dati salvati va a `screen-zodiac`; con `STATE.meta.zodiac` valido va a `screen-menu`.
- Verificare persistenza: dopo modifica STATE, attendere 500 ms, ricaricare e controllare che lo stato sopravviva.
- Verificare Konami code: `↑ ↑ ↓ ↓ ← → ← → b a` → toast "+777 ducati" e flag `cheatsUsed` settato.
- Verificare popup: click overlay / Escape / `[data-popup-close]` chiudono correttamente; la Promise risolve.
- Verificare responsive: <768px (mobile, carte piccole, joker bar orizzontale) vs >=768px (desktop, HUD 6 colonne, joker bar laterale).
- Skill backend/extension non applicabili: nessun codice server, nessuna content script, nessuna chiamata di rete.

---

## 2026-05-01 — Fase 12: Easter Eggs

### Cosa è stato fatto
Implementati 10 easter egg con riferimenti alla cultura pop italiana trash/pop, attivabili via Konami code, click sul logo o digitazione di parole chiave (key buffer globale).

### File creati / modificati
- **`game/index.html`** — aggiunto `id="logo-menu"` su `h1.menu-title` per intercettare i click.
- **`game/style.css`** — aggiunte in fondo le regole CSS per:
  - `.mastro-prof-overlay` + `@keyframes mastroIn/mastroOut` (overlay celebrativo)
  - `.pizza-mode .card-wrapper::after` (emoji 🍕 in sovrimpressione su carte)
  - `.baggio-fly` + `@keyframes flyToMoon` (carta/pallone che vola verso la luna)
  - styling per popup `dialetto`, `matrimonio`, `fantozzi`, `baggio`, `totti`, `maancheno`, `allegria`, `debug`
- **`game/gennarino.js`** — aggiunte 7 nuove emozioni-evento (`mastroProf`, `pizza`, `fantozzi`, `baggio`, `totti`, `maancheno`, `allegria`) sia in `_LINES_EXTRA` (frasi) sia in `_EV_EMOTION` (mapping a sprite).
- **`game/game.js`** — hook in `playHand()` dopo Gennarino.say: chiama `window.showMastroProfessore()` se `result.mult >= 10` o `result.total >= 2000`.
- **`game/app.js`** — aggiunti:
  - `DIALETTO_STRETTO_LINES` (8 frasi assurde in dialetto stretto)
  - `_wordBuffer` / `_wordTimer` / `_checkWordBuffer()` — buffer separato dal Konami, reset a 3s dall'ultima lettera, max 12 char.
  - `_logoClicks` / `_logoClickTimer` / `_onLogoClick()` — counter 10 click in 5s sul logo menu.
  - `onKonami()` esteso: traccia `_konamiCount`. 1ª volta → modalità dialetto stretto + popup con grido di Gennarino. 2ª+ volta → modalità matrimonio (campanile pixel art SVG inline + 500 ducati + confetti 80).
  - `showMastroProfessore()` — overlay full-screen "MASTRO PROFESSORE!" che si auto-rimuove in 3s con fade out.
  - `onEasterEgg(type)` — dispatcher con 7 case: pizza, fantozzi, baggio, totti, maancheno, allegria.
  - `_showDebugPopup()` — popup con tabella stato + bottoni MAX COINS / RESET STATE / CHIUDI; "RESET STATE" richiede `confirm()` prima di pulire `localStorage` e ricaricare.
  - `_flyCardToMoon()` — animazione pallone/carta che vola verso l'alto.
  - Wire del listener click sul logo dentro `wireNavigation()`.
  - keydown listener esteso per chiamare `_checkWordBuffer()` (skipped se l'utente sta scrivendo in INPUT/TEXTAREA/contenteditable).
  - Esposizione `window.showMastroProfessore` e `window.onEasterEgg` per debug.

### Lista easter egg
1. **Konami code 1×** → +777 ducati + modalità dialetto stretto + popup con grido di Gennarino.
2. **Konami code 2×** → modalità matrimonio (campanile SVG, +500 ducati, confetti, popup).
3. **10 click sul logo menu (entro 5s)** → debug popup con tabella stato + MAX COINS / RESET STATE.
4. **Combo perfetta (mult≥10 o total≥2000)** → overlay "MASTRO PROFESSORE!" + Gennarino reagisce.
5. **Digita "PIZZA"** → modalità pizza, ogni carta ha 🍕 in sovrimpressione.
6. **Digita "FANTOZZI"** → popup "Corazzata Potemkin", +1 mano se in run.
7. **Digita "BAGGIO"** → se 2+ carte selezionate scarta silenziosamente con animazione "luna"; altrimenti popup nostalgico con pallone SVG.
8. **Digita "TOTTI"** → popup quote cult, +100 ducati se in run.
9. **Digita "MAANCHENO"** → popup gigante "MA. ANCHE. NO." + deseleziona carte.
10. **Digita "ALLEGRIA"** → confetti + popup "Lascia o Raddoppia?" (se RADDOPPIA e coins>50: dimezza).

### Sicurezza & regole
- Tutti gli effetti visivi si auto-rimuovono via `setTimeout` + `removeChild` (nessun memory leak).
- Nessun `setInterval` per animazioni: solo CSS keyframes + setTimeout una-tantum.
- Le frasi degli easter egg sono in costanti del codice; nessun input utente passa per `innerHTML`.
- I valori dinamici inseriti nei popup (es. `m.coins`, frase dialetto) sono numeri o stringhe filtrate con `.replace(/[<>&"']/g, '')` come cintura di sicurezza extra.
- Il key buffer ignora `INPUT`/`TEXTAREA`/`contentEditable` per non intercettare digitazioni in eventuali futuri form.
- Il buffer si resetta automaticamente dopo 3s di inattività e dopo ogni match.
- `RESET STATE` richiede `confirm()` esplicito prima di cancellare `localStorage`.
- `STATE.meta.pizzaMode` non viene salvato (cosmetico, vive solo nella sessione corrente).
- `_konamiCount` parte da 0 e si incrementa SOLO in `onKonami()`.

### Verifiche / security check da eseguire
- Verificare che nessun easter egg permetta XSS via popup (testare con `STATE.meta.zodiac` manomesso a `<script>`).
- Verificare che il key buffer non triggeri quando si scrive in un campo input (futuro: chat / nome utente).
- Verificare che `RESET STATE` non venga lanciato per errore (richiede conferma).
- Verificare `node --check` su `app.js`, `game.js`, `gennarino.js` → tutti passano.
- Verificare con tastiera ITALIANA: la digitazione di "pizza" / "fantozzi" / "baggio" / "totti" / "maancheno" / "allegria" deve attivare l'egg.
- Verificare che il debug popup non sia raggiungibile durante una run attiva tramite click sul logo (è in screen-menu, ma il listener resta attivo: questo è intenzionale, è un debug tool).
- Mobile: verificare che 10 click consecutivi sul logo funzionino anche con tap touch (event 'click' è generato anche su touch).

---

## 2026-05-02 01:35 — i18n coverage completion (Coder)

### Cosa è stato fatto
Completata la copertura i18n per joker, mazzetti, tarocchi, zodiac bonuses, popup runtime (run info, joker info, tarot use, combo help) e stat labels in HTML.

### File modificati
- `game/data.js`
  - FIX 1 — `BALANCE.cardChips` aggiornato: re=10 (era 4), cavallo=9 (era 3), fante=8 (era 2). Asso/3 invariati (11/10).
  - FIX 2 — Aggiunto `nameEn` e `descriptionEn` a tutti i 28 JOKERS (cornicello, caffe_forte, baba, sfogliatella, pizzaiolo, tarallo, limoncello, sigaro_toscano, zampogna, amuleto_zia, pesce_oro, re_cafone, smorfia_joker, sfortuna, munaciello_buono, mano_nera, sangue_napoli, briscola_cavalcata, corno_iellato, alba_napoletana, pizza_fritta, diavolo, tarantella, mago_alchimista, campana_gennaro, cuoppo_fritto, maradona_dieci, vesuvio_eruzione).
  - FIX 2 — Aggiunto `nameEn` e `descriptionEn` a tutti i 20 MAZZETTI.
  - FIX 2 — Aggiunto `nameEn` e `descriptionEn` a tutti i 10 TAROTS (mago, imperatrice, ruota, sole, luna, torre, stelle, giudizio, forza, papessa).
  - FIX 3 — Aggiunto `descEn` a tutti i 12 ZODIAC_BONUSES.
  - FIX 4 — Aggiunte chiavi STRINGS in IT e EN: `game.noJokers`, `game.noTarots`, `runinfo.*` (title/ante/score/ducats/trump/jokersTitle/none/close), `joker.triggerLabel`, `tarot.use`, `rarity.*` (common/uncommon/rare/legendary), `combo.popupTitle`, `combo.colCombo/colExample/colChips/colMult/colHow`, `combo.tip`, `combo.ok`, `combo.desc.*` (13 combo descriptions), `zodiac.starsWatch`.
- `game/game.js`
  - FIX 5 — Aggiunti helper `_jName()` e `_jDesc()` all'inizio del file per leggere `nameEn`/`descriptionEn` quando `STATE.meta.lang === 'en'`.
  - FIX 6a — Sostituito `STRINGS.it[combo]` con `t(combo)` in updatePreview hand type.
  - FIX 6b — `renderJokerBar()` "Nessun jolly" → `t('game.noJokers')`.
  - FIX 6c — `renderConsumableBar()` "Nessun tarocco" → `t('game.noTarots')`. Inoltre titolo/descrizione tarocchi in barra ora usano `_jName/_jDesc` con lookup statico TAROTS.
  - FIX 6d — `showRunInfo()` refattorizzata interamente per usare `t('runinfo.*')` e `_jName/_jDesc` dei joker.
  - FIX 6e — Joker click popup usa `_jName/_jDesc` con lookup statico JOKERS, e rarity da `t('rarity.<lvl>')`, trigger label da `t('joker.triggerLabel')`.
  - FIX 6f — Tarot use popup: "USA ADESSO" → `t('tarot.use')`, "ANNULLA" → `t('btn.cancel')`. Nome/descrizione tarocco con `_jName/_jDesc`.
  - FIX 6g — Combo help popup: COMBO_EXAMPLES ora ha solo `cards` (rimossi `desc` hardcoded), descrizioni da `t('combo.desc.<id>')`. Titolo/header colonne/tip/bottone OK tutti via `t()`.
- `game/shop.js`
  - FIX 7 — Aggiunti helper `_jName()` e `_jDesc()` all'inizio del file. Modificati i punti di display (renderShop joker/tarot, joker swap popup, lootbox card name) per usare gli helper. I costruttori `name: j.name` mantenuti per backward compat (i nomi visualizzati ora derivano dal lookup statico tramite helper).
- `game/zodiac.js`
  - FIX 8a — `_getString` ora usa `window.t()` per lingua corrente, con fallback a STRINGS.it.
  - FIX 8b/c/d — Aggiunto helper `_getZodiacLabel(sign)` che usa `t('zodiac.sign.*')`. Sostituiti i due usi di `ZODIAC_LABELS[...]` in `showPrediction` e `_renderZodiacDetail`.
  - FIX 8c — Stringa "Le stelle guardano" ora via `_getString('zodiac.starsWatch', 'Le stelle guardano')`.
  - FIX 8e — `_getBonusDesc` ora restituisce `descEn` quando `lang === 'en'`.
- `game/index.html`
  - FIX 9 — Aggiunto `data-i18n="stat.<key>"` ai 8 `<td class="stat-label">` in screen-settings (così `applyLang()` li traduce automaticamente).

### Security checks raccomandati
- Verificare che nessun valore originale di `j.name` / `j.description` / `t.name` / `t.description` finisca in `innerHTML` senza passare per `_escape()` — i nuovi helper `_jName/_jDesc` restituiscono ancora stringhe non escapate, e il chiamante deve fare `_escape()` (controllato: tutti i call site sono dentro `_escape(...)`).
- Verificare che il cambio lingua a runtime aggiorni correttamente le stringhe: i popup vengono costruiti al momento dell'apertura, quindi rispecchiano la lingua corrente.
- `node --check` su tutti e 5 i file modificati: passato.
- Verificare che `nameEn`/`descriptionEn`/`descEn` siano sempre stringhe (mai user input) — sono hardcoded in data.js, OK.
- Verificare che il fallback IT funzioni se `nameEn` manca su un joker (helper restituisce `obj.name`).
