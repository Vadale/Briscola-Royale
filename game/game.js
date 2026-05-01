'use strict';
/* ============================================================
   BRISCOLA ROYALE — game.js
   Game loop principale: run lifecycle, blind, mani, scarti, boss.
   - Stato in STATE.currentRun (mai variabili globali per dati di run).
   - Rendering separato dalla logica: solo render*() e updateHUD()
     toccano il DOM.
   - Tutti i numeri da BALANCE. Niente magic numbers.
   ============================================================ */

// i18n helpers per joker/mazzetti — usano nameEn/descriptionEn quando lang='en'
function _jName(obj) {
  const lang = window.STATE && STATE.meta && STATE.meta.lang;
  if (lang === 'en' && obj && obj.nameEn) return obj.nameEn;
  return (obj && obj.name) || '';
}
function _jDesc(obj) {
  const lang = window.STATE && STATE.meta && STATE.meta.lang;
  if (lang === 'en' && obj && obj.descriptionEn) return obj.descriptionEn;
  return (obj && obj.description) || '';
}

const SEMI_LIST = ['bastoni', 'coppe', 'denari', 'spade'];
const BOSS_RULES_RANDOM_POOL = [
  'no_discard', 'half_denari', 'less_hands', 'no_figure_bonus',
  'change_briscola', 'half_chips', 'only_numbers', 'less_hand_size',
  'pay_per_hand', 'min_3_cards', 'swap_hand_discard', 'no_asso_chips',
  'invert_combo_mult', 'pay_per_draw', 'no_new_combos', 'steal_draws'
];
// Boss finale: top-3 più dure (vedi gameplay-loop.md)
const FINAL_BOSS_EXTRA_RULES = ['less_hands', 'half_chips', 'no_discard'];

// Skip animazione corrente (riferimento condiviso tra animateScore e listener globale)
let _skipAnim = false;

// ============================================================
// PRNG — Daily Seed support (Feature A)
// ============================================================
// _rng e' usato per TUTTE le scelte di gameplay deterministiche
// (shuffle mazzo, pick boss, regole random, ecc.). Le animazioni
// e gli effetti visivi continuano a usare Math.random direttamente.
let _rng = Math.random;

function _initRng(seed) {
  if (seed != null && Number.isFinite(seed) && typeof mulberry32 === 'function') {
    _rng = mulberry32(seed | 0);
  } else {
    _rng = Math.random;
  }
}

// Seed deterministico per il Daily Run: YYYYMMDD come intero.
// Stesso giorno → stesso seed → stessa run per tutti.
function _getDailyRunSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ============================================================
// FASE 11 — POLISH & JUICE: floating score, shake, particles, confetti
// ============================================================

// Palette per confetti — usa le CSS vars (palette napoletana cafona)
const _CONFETTI_COLORS = [
  '#f4c430', // oro
  '#e63946', // rosso
  '#c77dff', // viola neon
  '#2196f3', // azzurro
  '#ff6ec7', // rosa
  '#5cd672', // verde chiaro
  '#fff8e7', // bianco panna
];

/**
 * Mostra un'etichetta "+N" che vola verso l'alto e svanisce.
 * Posizionamento: coordinate fornite, oppure centro della .play-zone (#cards-played),
 * oppure centro schermo come ultimo fallback.
 */
function showFloatingScore(value, x, y) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return;
  let cx = x, cy = y;
  if (typeof cx !== 'number' || typeof cy !== 'number') {
    const zone = document.getElementById('cards-played') || document.querySelector('.play-zone');
    if (zone) {
      const r = zone.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    } else {
      cx = window.innerWidth / 2;
      cy = window.innerHeight / 2;
    }
  }
  const el = document.createElement('div');
  el.className = 'floating-score';
  el.textContent = '+' + Math.floor(value).toLocaleString('it-IT');
  el.style.left = cx + 'px';
  el.style.top  = cy + 'px';
  document.body.appendChild(el);
  // Trigger animation al frame successivo
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { el.classList.add('float-active'); });
  });
  // Auto-rimozione
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
}

/**
 * Screen shake: 'light' o 'strong'.
 * Forza il reflow per permettere il re-trigger dell'animazione CSS.
 */
function shakeScreen(intensity) {
  const lvl = (intensity === 'strong') ? 'strong' : 'light';
  const el = document.getElementById('screen-game');
  if (!el) return;
  el.classList.remove('shake-light', 'shake-strong');
  // force reflow per re-trigger
  void el.offsetWidth;
  el.classList.add('shake-' + lvl);
  const dur = (lvl === 'strong') ? 500 : 300;
  setTimeout(() => {
    el.classList.remove('shake-light', 'shake-strong');
  }, dur);
}

/**
 * Spawn particelle dorate sulla play zone. count default 12.
 * Ogni particella vola in una direzione random (raggio 40-120px).
 */
function showGoldParticles(count) {
  const n = Math.max(1, Math.min(40, count | 0 || 12));
  const zone = document.getElementById('cards-played') || document.getElementById('screen-game');
  if (!zone) return;
  // posiziona usando coordinate relative al zone (zone deve essere position:relative o assoluto)
  const zoneStyle = window.getComputedStyle(zone);
  if (zoneStyle.position === 'static') zone.style.position = 'relative';
  const w = zone.clientWidth || 320;
  const h = zone.clientHeight || 90;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'gold-particle';
    // posizione iniziale random nel zone
    const sx = Math.random() * w;
    const sy = Math.random() * h;
    // direzione random
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 80;
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius - 20; // bias verso l'alto
    p.style.left = sx + 'px';
    p.style.top  = sy + 'px';
    p.style.setProperty('--px', dx + 'px');
    p.style.setProperty('--py', dy + 'px');
    // leggera variabilità di dimensione
    const sz = 6 + Math.floor(Math.random() * 3);
    p.style.width  = sz + 'px';
    p.style.height = sz + 'px';
    zone.appendChild(p);
    setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 1300);
  }
}

/**
 * Mostra confetti pixel dispersi su tutto lo schermo.
 * Si auto-rimuovono dopo ~2.5s.
 */
function showConfetti(count) {
  const n = Math.max(1, Math.min(120, count | 0 || 30));
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-pixel';
    const color = _CONFETTI_COLORS[Math.floor(Math.random() * _CONFETTI_COLORS.length)];
    c.style.background = color;
    c.style.left = (Math.random() * 100) + 'vw';
    c.style.top  = (-20 - Math.random() * 80) + 'px';
    // rotazione finale random
    c.style.setProperty('--cr', (180 + Math.random() * 540) + 'deg');
    // durata leggermente variabile per effetto naturale
    const dur = 1.6 + Math.random() * 1.0;
    c.style.animationDuration = dur.toFixed(2) + 's';
    // delay variabile
    c.style.animationDelay = (Math.random() * 0.4).toFixed(2) + 's';
    // dimensione variabile (4-10px)
    const sz = 4 + Math.floor(Math.random() * 7);
    c.style.width  = sz + 'px';
    c.style.height = sz + 'px';
    document.body.appendChild(c);
    setTimeout(() => { if (c.parentNode) c.parentNode.removeChild(c); }, (dur + 0.6) * 1000);
  }
}

// Esposizione globale (utile per debug e per altri moduli)
window.showFloatingScore = showFloatingScore;
window.shakeScreen       = shakeScreen;
window.showGoldParticles = showGoldParticles;
window.showConfetti      = showConfetti;

// ============================================================
// FASE 13 — SANITIZE RUN (recovery save/load mid-game con schema vecchio)
// ============================================================
// Garantisce con valori di default le proprietà critiche del run.
// Necessario quando STATE.currentRun viene caricato da localStorage e proprietà
// nuove (playerCards, maxJokerSlots, ecc.) non esistono nel save vecchio.
// Idempotente: chiamarla più volte è sicuro.
function _sanitizeRun(run) {
  if (!run) return run;
  if (!Array.isArray(run.playerCards) || run.playerCards.length === 0)
    run.playerCards = DECK_NAPOLI.map(c => ({ ...c }));
  if (!Number.isFinite(run.handSize) || run.handSize < 1) run.handSize = BALANCE.handSize;
  if (!Number.isFinite(run.handsLeft) || run.handsLeft < 0) run.handsLeft = BALANCE.handsPerBlind;
  if (!Number.isFinite(run.discardsLeft) || run.discardsLeft < 0) run.discardsLeft = BALANCE.discardsPerBlind;
  if (!Number.isFinite(run.maxJokerSlots) || run.maxJokerSlots < 1) run.maxJokerSlots = BALANCE.maxJokerSlots;
  if (!Array.isArray(run.jokers)) run.jokers = [];
  // Ricostruisce effectCode dei joker dal catalogo statico per bloccare code injection da localStorage
  if (typeof JOKERS !== 'undefined') {
    run.jokers = run.jokers.filter(j => j && typeof j.id === 'string').map(j => {
      const staticJ = JOKERS.find(s => s.id === j.id);
      if (!staticJ) return null;
      return Object.assign({}, j, { effectCode: staticJ.effectCode });
    }).filter(Boolean);
  }
  if (!Array.isArray(run.consumables)) run.consumables = [];
  // Ricostruisce effectCode dei tarocchi dal catalogo statico per bloccare code injection da localStorage
  if (typeof TAROTS !== 'undefined') {
    run.consumables = run.consumables.filter(c => c && typeof c.id === 'string').map(c => {
      const staticT = TAROTS.find(s => s.id === c.id);
      if (!staticT) return null;
      return Object.assign({}, c, { effectCode: staticT.effectCode });
    }).filter(Boolean);
  }
  if (!Array.isArray(run.hand)) run.hand = [];
  if (!Array.isArray(run.deck)) run.deck = [];
  if (!Array.isArray(run.discarded)) run.discarded = [];
  if (!Array.isArray(run.played)) run.played = [];
  if (!Array.isArray(run.selectedIndices)) run.selectedIndices = [];
  if (!Array.isArray(run.usedBosses)) run.usedBosses = [];
  if (!Number.isFinite(run.money)) run.money = 4;
  if (!Number.isFinite(run.blindScore)) run.blindScore = 0;
  if (!Number.isFinite(run.runScore)) run.runScore = 0;
  if (!Number.isFinite(run.ante) || run.ante < 1) run.ante = 1;
  if (!['small', 'big', 'boss'].includes(run.blind)) run.blind = 'small';
  if (typeof run.briscolaSeme !== 'string' || !SEMI_LIST.includes(run.briscolaSeme))
    run.briscolaSeme = 'denari';
  if (!Number.isFinite(run.bossMinCards) || run.bossMinCards < 0) run.bossMinCards = 0;
  if (!Number.isFinite(run.handsPlayedThisRound) || run.handsPlayedThisRound < 0) run.handsPlayedThisRound = 0;
  if (!Number.isFinite(run.discardedThisRound) || run.discardedThisRound < 0) run.discardedThisRound = 0;
  if (!Number.isFinite(run.roundChipsBonus)) run.roundChipsBonus = 0;
  if (!Number.isFinite(run.roundMultBonus)) run.roundMultBonus = 0;
  if (!run.jokerState || typeof run.jokerState !== 'object') run.jokerState = {};
  // Feature A — Daily Seed flags
  if (run.isDaily !== true) run.isDaily = false;
  if (run.seed != null && !Number.isFinite(run.seed)) run.seed = null;
  // Feature B — Endless mode flag
  if (run.endless !== true) run.endless = false;
  return run;
}

// ============================================================
// LIFECYCLE
// ============================================================

function startRun(seed, daily) {
  // Feature A — Daily Seed: inizializza il PRNG PRIMA di qualunque scelta random
  // (briscolaSeme iniziale, shuffle deck, pickBoss, ecc.).
  _initRng((seed != null && Number.isFinite(seed)) ? seed : null);

  const run = {
    ante: 1,
    blind: 'small',
    blindIndex: 0,
    bossId: null,
    bossRule: null,
    targetScore: 0,
    runScore: 0,
    blindScore: 0,
    handsLeft: BALANCE.handsPerBlind,
    discardsLeft: BALANCE.discardsPerBlind,
    handSize: BALANCE.handSize,
    deck: [],
    hand: [],
    played: [],
    discarded: [],
    jokers: [],
    consumables: [],
    money: 4,
    handsPlayedThisRound: 0,
    discardedThisRound: 0,
    roundChipsBonus: 0,
    roundMultBonus: 0,
    jokerState: {},
    selectedIndices: [],
    usedBosses: [],
    consecutiveLossesAnte1: STATE.currentRun ? (STATE.currentRun.consecutiveLossesAnte1 || 0) : 0,
    briscolaSeme: SEMI_LIST[Math.floor(_rng() * SEMI_LIST.length)],
    bossMinCards: 0,
    handsPlayedTotal: 0,
    moneySpent: 0,
    jokersBought: 0,
    playerCards: null,  // inizializzato dopo, include anche carte comprate dai pack
    // Feature A — Daily Seed
    isDaily: !!daily,
    seed: (seed != null && Number.isFinite(seed)) ? (seed | 0) : null,
    // Feature B — Endless mode (si attiva dopo aver battuto Ante 8)
    endless: false,
  };

  STATE.currentRun = run;
  run.playerCards = DECK_NAPOLI.map(c => ({ ...c }));

  // Bonus zodiac: applicato dopo aver creato currentRun
  const zodiac = STATE.meta && STATE.meta.zodiac;
  if (zodiac && ZODIAC_BONUSES[zodiac] && typeof ZODIAC_BONUSES[zodiac].apply === 'function') {
    try { ZODIAC_BONUSES[zodiac].apply(STATE); } catch (e) { console.warn('[zodiac apply]', e.message); }
  }

  STATE.meta.totalRuns = (STATE.meta.totalRuns || 0) + 1;
  saveState();

  switchScreen('screen-game');
  startBlind('small');
}

function startBlind(blindType) {
  const run = STATE.currentRun;
  if (!run) { console.warn('[startBlind] nessun run attivo'); return; }

  // FASE 13 — sanitize dei campi del run (es. save/load mid-game con schema vecchio)
  _sanitizeRun(run);

  // Feature A — Daily Seed: se la run e' un daily caricato da localStorage,
  // garantisci che il PRNG sia inizializzato. NB: non e' deterministico
  // rispetto alla mossa singola dopo reload (le scelte random fatte prima
  // del reload non sono replicabili), ma le decisioni FUTURE saranno
  // deterministiche se l'utente non ricarica.
  if (run.isDaily && run.seed != null && Number.isFinite(run.seed)) {
    if (_rng === Math.random) _initRng(run.seed | 0);
  }

  run.blind = blindType;
  run.blindIndex = blindType === 'small' ? 0 : (blindType === 'big' ? 1 : 2);
  run.blindScore = 0;
  run.handsLeft = BALANCE.handsPerBlind;
  run.discardsLeft = BALANCE.discardsPerBlind;
  run.handSize = BALANCE.handSize;
  run.handsPlayedThisRound = 0;
  run.discardedThisRound = 0;
  run.roundChipsBonus = 0;
  run.roundMultBonus = 0;
  run.bossMinCards = 0;
  run.bossId = null;
  run.bossRule = null;
  run.played = [];
  run.discarded = [];
  run.selectedIndices = [];
  run.hand = [];
  // Pesca interattiva: inizializza drawsLeft/paidDrawsUsed PRIMA di applyBossRule
  // così steal_draws può dimezzare il valore correttamente.
  run.drawsLeft = BALANCE.freeDrawsPerBlind;
  run.paidDrawsUsed = 0;

  // Zodiac flags ad ogni round
  if (run.zodiacFlag_ariete && run.blindIndex === 0) run.handsLeft += 1;
  if (run.zodiacFlag_cancro) run.discardsLeft += 1;

  // Boss
  let boss = null;
  if (blindType === 'boss') {
    boss = pickBoss();
    if (boss) {
      run.bossId = boss.id;
      run.bossRule = boss.rule;
      applyBossRule(boss);
    }
  }

  // Target score
  const targetIdx = run.blindIndex;
  const baseTarget = BALANCE.anteTargets[Math.min(run.ante - 1, BALANCE.anteTargets.length - 1)][targetIdx];
  let target = baseTarget;
  if (boss && boss.rule === 'double_target') {
    const mult = (boss.id === BALANCE.finalBossId) ? BALANCE.bossFinalTargetMult : BALANCE.bossHalfTargetMult;
    target = Math.floor(baseTarget * mult);
  }
  if (run.zodiacFlag_bilancia && run.ante === 1) target = Math.floor(target * 0.95);
  // Feature B — Endless mode: per ogni ante oltre il finale, applica il moltiplicatore
  // (ante 9 → ×1.25, ante 10 → ×1.5625, ecc.). NON applicato durante l'ante 8 stesso.
  const _finalAnte = (BALANCE && Number.isFinite(BALANCE.finalAnte)) ? BALANCE.finalAnte : 8;
  if (run.endless && run.ante > _finalAnte) {
    const excess = run.ante - _finalAnte;
    const endlessMult = (BALANCE && Number.isFinite(BALANCE.endlessMultiplier)) ? BALANCE.endlessMultiplier : 1.25;
    target = Math.floor(target * Math.pow(endlessMult, excess));
  }
  run.targetScore = target;

  // Mazzo: ri-shuffle ad ogni nuovo blind (usa playerCards se presente)
  run.deck = Cards.shuffleDeck([...(run.playerCards || DECK_NAPOLI.map(c => ({ ...c })))], _rng);
  // NOTA Vergine: NON ordiniamo più il deck (creava bug "tutte stesso seme").
  // L'ordinamento per seme è applicato a run.hand in dealHand/drawFromDeck.

  // Joker on_round_start
  const rsJokers = run.jokers.filter(j => j.trigger === 'on_round_start');
  rsJokers.forEach(j => {
    const ctx = {
      chips: 0, mult: 1,
      roundChipsBonus: run.roundChipsBonus,
      roundMultBonus: run.roundMultBonus,
      money: run.money,
      ante: run.ante,
      jokerState: run.jokerState,
      jokerIds: run.jokers.map(jj => jj.id),
      jokerCount: run.jokers.length,
      random: _rng,
    };
    Cards.applyJokerEffect(j, ctx, 'on_round_start');
    run.roundChipsBonus = ctx.roundChipsBonus || 0;
    run.roundMultBonus = ctx.roundMultBonus || 0;
    run.money = ctx.money;
  });

  // Reset diavolo all'inizio del boss blind (regola joker)
  if (blindType === 'boss' && run.jokerState.diavolo !== undefined) {
    run.jokerState.diavolo = 0;
  }

  // Deal iniziale: usa BALANCE.startHandSize (non handSize).
  // Gemelli zodiac: pesca 1 carta extra all'inizio del round.
  const initialDeal = (BALANCE.startHandSize || 3) + (run.zodiacFlag_gemelli ? 1 : 0);
  run._oneTimeExtraDraw = 0; // legacy flag — non più usato per il deal iniziale
  for (let i = 0; i < initialDeal; i++) {
    if (run.deck.length === 0) break;
    run.hand.push(run.deck.shift());
  }
  // Vergine: ordina la mano per seme dopo il deal iniziale
  if (run.zodiacFlag_vergine) {
    run.hand.sort((a, b) => SEMI_LIST.indexOf(a.seme) - SEMI_LIST.indexOf(b.seme));
  }
  renderGameScreen();
  updateHUD();

  if (boss) showBossIntro(boss);

  // Avvia BGM appropriata per il blind type
  if (window.SN_Audio && typeof SN_Audio.playBgm === 'function') {
    try {
      SN_Audio.playBgm(blindType === 'boss' ? 'bgm_game_boss' : 'bgm_game_normal');
    } catch (e) {}
  }

  saveState();
}

function pickBoss() {
  const run = STATE.currentRun;
  if (!run) return null;

  // Boss finale Ante 8: sempre munaciello_oro
  if (run.ante >= 8) {
    return BOSSES.find(b => b.id === BALANCE.finalBossId) || BOSSES[0];
  }

  const eligible = BOSSES.filter(b =>
    b.firstAnte <= run.ante &&
    !run.usedBosses.includes(b.id) &&
    b.id !== BALANCE.finalBossId
  );
  if (eligible.length === 0) {
    // Fallback: se nessuno disponibile, riusa uno casuale tra eligibili senza filtro usedBosses
    const fallback = BOSSES.filter(b => b.firstAnte <= run.ante && b.id !== BALANCE.finalBossId);
    return fallback.length > 0 ? fallback[Math.floor(_rng() * fallback.length)] : BOSSES[0];
  }
  return eligible[Math.floor(_rng() * eligible.length)];
}

function applyBossRule(boss) {
  const run = STATE.currentRun;
  if (!run || !boss) return;
  const rule = boss.rule;

  switch (rule) {
    case 'no_discard':
      run.discardsLeft = 0;
      break;
    case 'less_hands':
      run.handsLeft = Math.max(1, BALANCE.handsPerBlind - 1);
      break;
    case 'less_hand_size':
      run.handSize = Math.max(3, BALANCE.handSize - 1);
      break;
    case 'swap_hand_discard': {
      const tmp = run.handsLeft;
      run.handsLeft = run.discardsLeft;
      run.discardsLeft = tmp;
      break;
    }
    case 'min_3_cards':
      run.bossMinCards = 3;
      break;
    case 'steal_draws':
      // Munaciello Pescatore: dimezza le pescate gratuite (min 1).
      run.drawsLeft = Math.max(1, Math.floor((BALANCE.freeDrawsPerBlind || 4) / 2));
      break;
    case 'random_rule': {
      // Sceglie una regola casuale (escluse random_rule e double_target) e la APPLICA come bossRule
      // (verrà comunque rivalutata ad ogni mano se vogliamo — qui semplificato: rule scelta una volta).
      const pool = BOSS_RULES_RANDOM_POOL.filter(r => r !== 'random_rule');
      const chosen = pool[Math.floor(_rng() * pool.length)];
      run.bossRule = chosen;
      // Riapplica ricorsivamente solo per le regole che hanno effetto immediato
      applyBossRule({ rule: chosen });
      break;
    }
    case 'double_target': {
      // Boss finale: aggiunge anche una regola random tra le top-3 più dure.
      if (boss.id === BALANCE.finalBossId) {
        const extra = FINAL_BOSS_EXTRA_RULES[Math.floor(_rng() * FINAL_BOSS_EXTRA_RULES.length)];
        run.bossRule = extra;
        applyBossRule({ rule: extra });
      }
      // Il moltiplicatore target viene applicato in startBlind, non qui.
      break;
    }
    // Le altre (half_chips, half_denari, no_figure_bonus, only_numbers, change_briscola,
    // no_asso_chips, invert_combo_mult, random_transform, pay_per_hand) sono gestite a runtime
    // in playHand() leggendo run.bossRule.
    default:
      break;
  }
}

function showBossIntro(boss) {
  if (!boss) return;
  const html = `
    <div class="boss-intro">
      <h2 class="boss-intro-title">⚠️ BOSS BLIND ⚠️</h2>
      <h3 class="boss-intro-name">${_escape(boss.name)}</h3>
      <p class="boss-intro-rule"><strong>Regola:</strong> ${_escape(boss.ruleDesc)}</p>
      <p class="boss-intro-flavor">"${_escape(boss.intro)}"</p>
      <button class="btn-arcade" data-popup-close="ok">CAPITO, AVANTI!</button>
    </div>`;
  popup(html);
  if (window.Gennarino) Gennarino.react('shock');
}

// ============================================================
// MAZZO E DEAL
// ============================================================

function dealHand() {
  const run = STATE.currentRun;
  if (!run) return;

  const target = run.handSize + (run._oneTimeExtraDraw || 0);
  run._oneTimeExtraDraw = 0;
  const need = Math.max(0, target - run.hand.length);

  for (let i = 0; i < need; i++) {
    if (run.deck.length === 0) {
      // Reshuffle: scarti tornano nel mazzo
      if (run.discarded.length === 0) break;
      run.deck = Cards.shuffleDeck([...run.discarded], _rng);
      run.discarded = [];
      try { toast('Mazzo esaurito! Scarti rimescolati.', 'info'); } catch (e) {}
    }
    const card = run.deck.shift();
    if (card) run.hand.push(card);
  }
  // Vergine: ordina le carte in mano per seme dopo ogni pescata
  if (run.zodiacFlag_vergine) {
    run.hand.sort((a, b) => SEMI_LIST.indexOf(a.seme) - SEMI_LIST.indexOf(b.seme));
  }
  renderGameScreen();
  updateHUD();
}

// ============================================================
// PESCA INTERATTIVA
// ============================================================

function drawFromDeck() {
  const run = STATE.currentRun;
  if (!run) return;
  const maxHand = BALANCE.maxHandSize || 7;
  if (run.hand.length >= maxHand) {
    toast('Mano piena! (max ' + maxHand + ' carte)', 'info');
    return;
  }

  // Mazzo esaurito: reshuffle degli scarti
  if (run.deck.length === 0) {
    if (run.discarded.length === 0) {
      toast('Mazzo e scarti esauriti!', 'error');
      return;
    }
    run.deck = Cards.shuffleDeck([...run.discarded]);
    run.discarded = [];
    try { toast('Mazzo esaurito! Scarti rimescolati.', 'info'); } catch (e) {}
  }

  const isFree = run.drawsLeft > 0;
  const isPaid = !isFree && run.paidDrawsUsed < (BALANCE.paidDrawMaxPerBlind || 6);

  if (!isFree && !isPaid) {
    toast('Niente più pescate disponibili!', 'error');
    return;
  }
  if (!isFree && run.money < BALANCE.paidDrawCost) {
    toast('Non hai abbastanza ducati per pescare!', 'error');
    return;
  }

  // Boss pay_per_draw: ogni pescata costa 1 ducato — bypass dei contatori free/paid.
  // Il limite diventa maxHandSize (7) × disponibilità ducati. Comportamento intenzionale.
  if (run.bossRule === 'pay_per_draw') {
    if (run.money < 1) { toast('Don Mimì vuole 1 ducato per questa carta!', 'error'); return; }
    run.money -= 1;
  } else if (!isFree) {
    run.money -= BALANCE.paidDrawCost;
    run.paidDrawsUsed += 1;
    toast('Pescata: -' + BALANCE.paidDrawCost + ' ducato', 'info');
  } else {
    run.drawsLeft -= 1;
  }

  const card = run.deck.shift();
  if (card) {
    run.hand.push(card);
    if (run.zodiacFlag_vergine) {
      run.hand.sort((a, b) => SEMI_LIST.indexOf(a.seme) - SEMI_LIST.indexOf(b.seme));
    }
  }
  renderHandOnly();
  updateHUD();
  renderDeckArea();
  updateActionButtons();
  if (window.SN_Audio) try { SN_Audio.sfxCardDeal && SN_Audio.sfxCardDeal(); } catch(e) {}
}

function renderDeckArea() {
  const run = STATE.currentRun;
  const deckEl = document.getElementById('deck-count');
  if (deckEl) deckEl.textContent = run ? run.deck.length : 0;
  const drawsEl = document.getElementById('draws-left');
  if (drawsEl) drawsEl.textContent = run ? (run.drawsLeft || 0) : 0;
  const deckBtn = document.getElementById('btn-draw-card');
  if (deckBtn) {
    const canDraw = run && run.hand.length < (BALANCE.maxHandSize || 7) &&
      (run.drawsLeft > 0 ||
       (run.paidDrawsUsed < (BALANCE.paidDrawMaxPerBlind || 6) && run.money >= BALANCE.paidDrawCost) ||
       run.bossRule === 'pay_per_draw');
    deckBtn.disabled = !canDraw;
    const isPaid = run && run.drawsLeft <= 0;
    deckBtn.classList.toggle('paid-draw', !!isPaid);
  }
}

// ============================================================
// SELEZIONE CARTE
// ============================================================

function selectCard(index) {
  const run = STATE.currentRun;
  if (!run) return;
  if (index < 0 || index >= run.hand.length) return;

  const sel = run.selectedIndices;
  const i = sel.indexOf(index);
  if (i >= 0) {
    sel.splice(i, 1);
  } else {
    if (sel.length >= 5) {
      toast('Massimo 5 carte!', 'info');
      return;
    }
    sel.push(index);
  }

  renderHandOnly();
  updatePreview();
  updateActionButtons();
}

function updateActionButtons() {
  const run = STATE.currentRun;
  if (!run) return;
  const playBtn = document.getElementById('btn-play');
  const discBtn = document.getElementById('btn-discard');
  const hasSel = run.selectedIndices.length > 0;
  if (playBtn) playBtn.disabled = !hasSel || run.handsLeft <= 0;
  if (discBtn) discBtn.disabled = !hasSel || run.discardsLeft <= 0;
}

function updatePreview() {
  const run = STATE.currentRun;
  if (!run) return;
  const handTypeEl = document.getElementById('hand-type-display');
  const chipsEl = document.getElementById('chips-mult-display');
  if (!run.selectedIndices.length) {
    if (handTypeEl) handTypeEl.textContent = '--';
    if (chipsEl) chipsEl.textContent = '0 × 0';
    return;
  }
  const cards = run.selectedIndices.map(i => run.hand[i]).filter(Boolean);
  const run2 = STATE.currentRun;
  const combo = Cards.detectCombo(cards, { briscolaSeme: run2 ? run2.briscolaSeme : null });
  const [comboChips, comboMult] = BALANCE.combos[combo] || [0, 1];
  let chips = comboChips;
  cards.forEach(c => { chips += BALANCE.cardChips[c.valore] || 0; });
  if (handTypeEl) handTypeEl.textContent = (t(combo) || combo).toUpperCase();
  if (chipsEl) chipsEl.textContent = `${chips} × ${comboMult}`;
}

// ============================================================
// PLAY HAND
// ============================================================

function playHand() {
  const run = STATE.currentRun;
  if (!run) return;
  if (run.handsLeft <= 0) { toast('Niente più mani!', 'error'); return; }

  const sel = run.selectedIndices.slice();
  if (sel.length === 0) { toast('Seleziona almeno 1 carta', 'info'); return; }

  if (run.bossRule === 'pay_per_hand' && run.money < 10) {
    toast('Non hai abbastanza ducati!', 'error');
    return;
  }
  if (run.bossMinCards && sel.length < run.bossMinCards) {
    toast(`Devi giocare almeno ${run.bossMinCards} carte!`, 'error');
    return;
  }

  // Estrai carte selezionate (in ordine di selezione)
  const playedCards = sel.map(i => run.hand[i]).filter(Boolean);

  // Modifiers boss
  const modifiers = {
    ante: run.ante,
    briscolaSeme: run.briscolaSeme,
    handsPlayedThisRound: run.handsPlayedThisRound,  // PRIMA dell'incremento
    discardedThisRound: run.discardedThisRound,
    jokerCount: run.jokers.length,
    jokerState: run.jokerState,
    jokerIds: run.jokers.map(j => j.id),
    money: run.money,
    random: _rng,
    roundChipsBonus: run.roundChipsBonus || 0,
    roundMultBonus: run.roundMultBonus || 0,
    // Modifiers per Mazzetti (Bicchiere d'Amaro, Pulcinella Bianco, Capodanno, Sfizio)
    handsLeft: Math.max(0, run.handsLeft - 1),  // mani rimanenti DOPO questa
    discardsLeft: run.discardsLeft,
    blindType: run.blind,
    runScore: run.runScore,
    maxDiscards: BALANCE.discardsPerBlind,
    handSize: run.hand.length,
  };

  const rule = run.bossRule;
  if (rule === 'half_chips') modifiers.halfChips = true;
  if (rule === 'half_denari') modifiers.halfDenari = true;
  if (rule === 'no_figure_bonus') modifiers.noFigureBonus = true;
  if (rule === 'only_numbers') modifiers.onlyNumbers = true;
  if (rule === 'no_asso_chips') modifiers.noAssoChips = true;
  if (rule === 'invert_combo_mult') modifiers.invertComboMult = true;
  if (rule === 'no_new_combos') modifiers.noNewCombos = true;

  // Leone zodiac: prima mano ×1.5 chips
  if (run.zodiacFlag_leone && run.handsPlayedThisRound === 0) {
    modifiers.leoneFirstHand = true;
  }

  const result = Cards.calculateScore(playedCards, run.jokers, modifiers);

  // calculateScore ora restituisce ctx.money e ctx.jokerState — sincronizza direttamente.
  // Questo copre joker come munaciello_buono (money) e diavolo (jokerState) senza doppia esecuzione.
  if (result.money !== undefined) run.money = result.money;
  if (result.jokerState !== undefined) run.jokerState = result.jokerState;

  // Aggiorna run state
  run.blindScore += result.total;
  run.runScore += result.total;
  run.handsPlayedThisRound += 1;  // DOPO la chiamata
  run.handsPlayedTotal = (run.handsPlayedTotal || 0) + 1;
  run.handsLeft -= 1;

  if (rule === 'pay_per_hand') {
    run.money = Math.max(0, run.money - 10);
  }

  // Boss change_briscola: ruota seme briscola
  if (rule === 'change_briscola') {
    const idx = SEMI_LIST.indexOf(run.briscolaSeme);
    run.briscolaSeme = SEMI_LIST[(idx + 1) % SEMI_LIST.length];
  }

  // Boss random_transform: trasforma 1 carta della mano residua in altra carta del mazzo
  if (rule === 'random_transform' && run.hand.length > 0 && run.deck.length > 0) {
    const remainingIndices = run.hand.map((_, i) => i).filter(i => !sel.includes(i));
    if (remainingIndices.length > 0) {
      const targetIdx = remainingIndices[Math.floor(_rng() * remainingIndices.length)];
      const deckIdx = Math.floor(_rng() * run.deck.length);
      const newCard = run.deck[deckIdx];
      if (newCard) {
        run.hand[targetIdx] = { ...newCard };
        run.deck.splice(deckIdx, 1); // rimuovi dal mazzo per evitare duplicati
      }
    }
  }

  // Sposta carte giocate in run.played (per visualizzazione), rimuovile da run.hand
  // Ordine inverso per non rompere indici
  const sortedSel = sel.slice().sort((a, b) => b - a);
  run.played = playedCards.slice();
  sortedSel.forEach(i => run.hand.splice(i, 1));
  run.selectedIndices = [];

  renderGameScreen();
  updateHUD();

  // Fase 11 — JUICE: floating score, shake, particelle dorate
  try {
    showFloatingScore(result.total);
  } catch (e) { /* noop */ }

  // Shake: light per ogni mano normale; strong se total > 5000 (jackpot/boss)
  try {
    if (result.total > 5000) {
      shakeScreen('strong');
    } else {
      shakeScreen('light');
    }
  } catch (e) { /* noop */ }

  // Particelle dorate per mani grosse (>= particleThreshold)
  const partThr = (BALANCE && typeof BALANCE.particleThreshold === 'number') ? BALANCE.particleThreshold : 1000;
  if (result.total >= partThr) {
    try { showGoldParticles(result.total >= 5000 ? 24 : 12); } catch (e) { /* noop */ }
  }

  animateScore(result, () => {
    // Dopo l'animazione: NON riempire automaticamente la mano.
    // Il giocatore deve cliccare sul mazzo per pescare.
    run.played = [];
    updateHUD();
    renderGameScreen();
    updateActionButtons();
    checkBlindEnd();
  });

  // Reazione Gennarino in base all'intensità
  if (window.Gennarino) {
    let reaction = 'onPlay';
    if (result.total >= 20000) reaction = 'jackpot';
    else if (result.total >= 5000) reaction = 'onCombo';
    else if (result.total >= 1000) reaction = 'onCombo';
    else reaction = 'onPlay';
    try { Gennarino.say(reaction); } catch (e) { /* noop */ }
  }

  // Fase 12 easter egg: MASTRO PROFESSORE!
  // Triggera solo su mani davvero eccezionali (mult >= 10 E total >= 5000)
  try {
    const isMastro = (typeof result.mult === 'number' && result.mult >= 10) && (result.total >= 5000);
    if (isMastro && typeof window.showMastroProfessore === 'function') {
      window.showMastroProfessore();
    }
  } catch (e) { /* noop */ }
}


// ============================================================
// DISCARD
// ============================================================

function discardCards() {
  const run = STATE.currentRun;
  if (!run) return;
  if (run.discardsLeft <= 0) { toast('Niente più scarti!', 'error'); return; }

  const sel = run.selectedIndices.slice();
  if (sel.length === 0) { toast('Seleziona le carte da scartare', 'info'); return; }

  const discardedCards = sel.map(i => run.hand[i]).filter(Boolean);

  // Joker on_discard per ogni carta scartata
  const onDiscJokers = run.jokers.filter(j => j.trigger === 'on_discard');
  discardedCards.forEach(card => {
    onDiscJokers.forEach(j => {
      const ctx = {
        chips: 0, mult: 0, money: run.money,
        discardedCard: card,
        ante: run.ante,
        jokerState: run.jokerState,
        jokerIds: run.jokers.map(jj => jj.id),
        jokerCount: run.jokers.length,
        random: _rng,
      };
      Cards.applyJokerEffect(j, ctx, 'on_discard');
      run.money = ctx.money;
      run.jokerState = ctx.jokerState;
      // Bonus mult/chips sul prossimo round (accumulato in roundMultBonus se serve).
      // sfortuna usa discardedThisRound — non serve qui. corno_iellato fa ctx.mult+=3 ma è
      // un effetto immediato, lo lasciamo cadere (gestito da discardedThisRound nei joker successivi).
    });
    run.discarded.push(card);
  });

  // Rimuovi dalla mano
  const sortedSel = sel.slice().sort((a, b) => b - a);
  sortedSel.forEach(i => run.hand.splice(i, 1));

  run.discardsLeft -= 1;
  run.discardedThisRound += 1;
  run.selectedIndices = [];

  // Reward per scarto: 1 ducato per carta scartata
  const numDiscarded = discardedCards.length;
  if (numDiscarded > 0 && typeof BALANCE !== 'undefined' && Number.isFinite(BALANCE.discardRewardPerCard) && BALANCE.discardRewardPerCard > 0) {
    const reward = numDiscarded * BALANCE.discardRewardPerCard;
    run.money = (Number.isFinite(run.money) ? run.money : 0) + reward;
    if (typeof t === 'function' && typeof toast === 'function') {
      try { toast(t('toast.discardReward', { n: reward }), 'info'); } catch (e) {}
    }
    if (window.SN_Audio && typeof SN_Audio.sfxCoinGet === 'function') {
      try { SN_Audio.sfxCoinGet(); } catch (e) {}
    }
  }

  // NON pesca automaticamente: il giocatore deve cliccare sul mazzo.
  updateHUD();
  renderGameScreen();
  updateActionButtons();

  if (window.SN_Audio && SN_Audio.beep) try { SN_Audio.beep(220, 0.08, 'square', 0.3); } catch (e) {}
}

// ============================================================
// CHECK BLIND END
// ============================================================

function checkBlindEnd() {
  const run = STATE.currentRun;
  if (!run) return;

  if (run.blindScore >= run.targetScore) {
    endBlind(true);
  } else if (run.handsLeft <= 0) {
    endBlind(false);
  } else if (run.hand.length === 0 && run.deck.length === 0 && run.discarded.length === 0) {
    // Mazzo, mano e scarti esauriti senza aver raggiunto il target → sconfitta forzata
    endBlind(false);
  }
}

function endBlind(win) {
  const run = STATE.currentRun;
  if (!run) return;

  if (!win) {
    // Sconfitta
    if (run.ante === 1) run.consecutiveLossesAnte1 += 1;
    if (window.Gennarino) { try { Gennarino.say('onLose'); } catch (e) {} }
    endRun(false);
    return;
  }

  run.consecutiveLossesAnte1 = 0;

  // Fase 11 — JUICE: vittoria blind = shake forte + microcopy
  try { shakeScreen('strong'); } catch (e) {}
  if (window.Gennarino) { try { Gennarino.say('onWin'); } catch (e) {} }

  // Calcolo guadagno
  const baseReward = BALANCE.blindMoney[run.blindIndex] || 3;
  const handsBonus = run.handsLeft * BALANCE.handSavedBonus;
  const discardBonus = run.discardsLeft * BALANCE.discardSavedBonus;
  let interestBase = Math.min(BALANCE.interestMax, Math.floor(run.money / BALANCE.interestPer));
  if (run.zodiacFlag_capricorno) interestBase = Math.min(BALANCE.interestMax * 2, interestBase * 2);
  const totalEarned = baseReward + handsBonus + discardBonus + interestBase;

  // Battle Pass XP (post-blind)
  if (window.Shop && typeof Shop.grantBattlePassXp === 'function') {
    let xp = BALANCE.battlePassXpPerBlind;
    if (run.blind === 'boss') xp = BALANCE.battlePassXpPerBossBlind;
    if (run.ante >= 4 && run.blind === 'boss') xp += BALANCE.battlePassXpPerAnte4Plus;
    try { Shop.grantBattlePassXp(xp); } catch (e) {}
  }

  run.money += totalEarned;

  // Boss usato
  if (run.blind === 'boss' && run.bossId) {
    if (!run.usedBosses.includes(run.bossId)) run.usedBosses.push(run.bossId);
  }

  toast(`+$${totalEarned} ducati!`, 'success');

  // Avanzamento
  let nextBlind;
  if (run.blind === 'boss') {
    run.ante += 1;
    const finalAnte = (BALANCE && typeof BALANCE.finalAnte === 'number') ? BALANCE.finalAnte : 8;
    // Feature B — Endless: alla prima volta che superiamo l'Ante finale,
    // attiviamo endless mode (one-time) e contiamo la vittoria nelle stats.
    // Nelle volte successive (run.endless gia' attivo) continuiamo silenziosamente.
    if (run.ante > finalAnte && !run.endless) {
      run.endless = true;
      // Conta la vittoria (one-time per run)
      STATE.meta.victories = (STATE.meta.victories || 0) + 1;
      if (run.runScore > (STATE.meta.bestScore || 0)) {
        STATE.meta.bestScore = run.runScore;
      }
      // Daily: marca il seed di oggi come completato (vittoria)
      if (run.isDaily) {
        try { STATE.meta.dailyDate = _getDailyRunSeed(); } catch (e) {}
      }
      try { showConfetti(80); } catch (e) {}
      try { toast("ANTE " + finalAnte + " COMPLETATO! Modalita' ENDLESS sbloccata!", 'success'); } catch (e) {}
      if (window.SN_Audio && typeof SN_Audio.sfxJackpot === 'function') {
        try { SN_Audio.sfxJackpot(); } catch (e) {}
      }
    }
    nextBlind = 'small';
    // _pendingNextBlind PRIMA di saveState così è serializzato in localStorage
    run._pendingNextBlind = 'small';
    saveState();
    // Inizializza il negozio PRIMA del cambio schermata
    if (window.Shop && typeof Shop.open === 'function') {
      try { Shop.open(); } catch (e) {}
    }
    const bossInfo = run.bossId ? (BOSSES.find(b => b.id === run.bossId) || null) : null;
    const bossWinMsg = bossInfo ? `"${_escape(bossInfo.onWin || 'Bravo guagliò...')}"` : '';
    const rewardHtml = `<div class="blind-win-popup">
      <h2 class="win-popup-title">🏆 BOSS SCONFITTO! 🏆</h2>
      <p class="win-popup-reward">+$${totalEarned} ducati guadagnati!</p>
      ${bossWinMsg ? `<p class="win-popup-boss-quote">${bossWinMsg}</p>` : ''}
      <p class="win-popup-hint">Vai al negozio: compra Jolly, Tarocchi e Pacchetti per potenziare il mazzo!</p>
      <button class="btn-arcade btn-big" data-popup-close="shop">VAI AL NEGOZIO &raquo;</button>
    </div>`;
    popup(rewardHtml).then(() => {
      switchScreen('screen-shop');
    });
    return;
  } else {
    nextBlind = run.blind === 'small' ? 'big' : 'boss';
  }

  saveState();
  // Nessuno shop tra small e big: avvia direttamente il prossimo blind
  setTimeout(() => startBlind(nextBlind), 600);
}

// Funzione globale per shop.js: continua dal negozio al prossimo blind
function continueFromShop() {
  const run = STATE.currentRun;
  if (!run) { switchScreen('screen-menu'); return; }
  const _valid = ['small', 'big', 'boss'];
  const next = _valid.includes(run._pendingNextBlind) ? run._pendingNextBlind : 'small';
  run._pendingNextBlind = null;
  switchScreen('screen-game');
  startBlind(next);
}

function endRun(victory) {
  const run = STATE.currentRun;
  if (!run) {
    showEndScreen(victory);
    return;
  }

  if (victory) {
    STATE.meta.victories = (STATE.meta.victories || 0) + 1;
  }
  if (run.runScore > (STATE.meta.bestScore || 0)) {
    STATE.meta.bestScore = run.runScore;
  }

  // Salva snapshot per la end screen
  STATE._lastRun = {
    victory,
    score: run.runScore,
    ante: run.ante,
    hands: run.handsPlayedTotal || 0,
    spent: run.moneySpent || 0,
    jokersBought: run.jokersBought || 0,
    jokers: run.jokers.slice(),
  };

  STATE.currentRun = null;
  saveState();
  showEndScreen(victory);
}

function showEndScreen(victory) {
  switchScreen('screen-end');

  const last = STATE._lastRun || {};
  const titleEl = document.getElementById('end-title');
  if (titleEl) titleEl.textContent = victory ? '🎉 STAI ASCÌ PAZZO! 🎉' : "FINE D' 'A PARTITA";

  const scoreEl = document.getElementById('end-score');
  const anteEl = document.getElementById('end-ante');
  const handsEl = document.getElementById('end-hands');
  const spentEl = document.getElementById('end-spent');
  const jokersEl = document.getElementById('end-jokers');

  if (scoreEl) scoreEl.textContent = (last.score || 0).toLocaleString('it-IT');
  if (anteEl) anteEl.textContent = `${last.ante || 1}/8`;
  if (handsEl) handsEl.textContent = last.hands || 0;
  if (spentEl) spentEl.textContent = last.spent || 0;
  if (jokersEl) jokersEl.textContent = last.jokersBought || 0;

  const predEl = document.getElementById('end-prediction-text');
  if (predEl) {
    const zodiac = STATE.meta && STATE.meta.zodiac;
    const pool = victory
      ? PREDICTIONS.victory
      : (zodiac && PREDICTIONS[zodiac] ? PREDICTIONS[zodiac].concat(PREDICTIONS.generic) : PREDICTIONS.generic);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    predEl.textContent = pick;
  }

  if (window.Gennarino) {
    try {
      if (victory) { Gennarino.react('win'); Gennarino.dance(); }
      else { Gennarino.react('lose'); }
    } catch (e) {}
  }
}

// ============================================================
// HUD & RENDERING
// ============================================================

function updateHUD() {
  const run = STATE.currentRun;
  if (!run) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // Ante display: in endless mode mostra "9 ∞" invece di "9/8"
  const _finalA = (BALANCE && Number.isFinite(BALANCE.finalAnte)) ? BALANCE.finalAnte : 8;
  set('hud-ante', run.endless ? `${run.ante} ∞` : `${run.ante}/${_finalA}`);

  // Feature A & B — badges DAILY / ENDLESS
  const dailyBadge = document.getElementById('hud-daily-badge');
  if (dailyBadge) dailyBadge.style.display = run.isDaily ? 'inline-block' : 'none';
  const endlessBadge = document.getElementById('hud-endless-badge');
  if (endlessBadge) endlessBadge.style.display = run.endless ? 'inline-block' : 'none';
  const roundLabel = run.blind === 'small' ? 'SMALL' : (run.blind === 'big' ? 'BIG' : '👹 BOSS');
  set('hud-round', roundLabel);
  set('hud-score', (run.blindScore || 0).toLocaleString('it-IT'));
  set('hud-target', (run.targetScore || 0).toLocaleString('it-IT'));
  set('hud-hands', run.handsLeft);
  set('hud-discards', run.discardsLeft);
  set('hud-money', `$ ${run.money}`);
  set('deck-count', run.deck.length);

  const briscolaEl = document.getElementById('hud-briscola-seme');
  if (briscolaEl) briscolaEl.textContent = (run.briscolaSeme || '—').toUpperCase();

  const bar = document.getElementById('hud-progress-bar');
  if (bar) {
    const pct = Math.max(0, Math.min(100, Math.floor((run.blindScore / Math.max(1, run.targetScore)) * 100)));
    bar.style.width = pct + '%';
  }

  renderJokerBar();
  updateActionButtons();
  renderDeckArea();
}

function renderHandOnly() {
  const run = STATE.currentRun;
  if (!run) return;
  const handEl = document.getElementById('cards-hand');
  if (!handEl) return;
  handEl.innerHTML = Cards.renderHand(run.hand, new Set(run.selectedIndices));
}

function renderGameScreen() {
  const run = STATE.currentRun;
  if (!run) return;

  const handEl = document.getElementById('cards-hand');
  const playedEl = document.getElementById('cards-played');
  if (handEl) handEl.innerHTML = Cards.renderHand(run.hand, new Set(run.selectedIndices));
  if (playedEl) playedEl.innerHTML = Cards.renderPlayedArea(run.played);

  updatePreview();
}

function renderJokerBar() {
  const run = STATE.currentRun;
  if (!run) return;
  const slotsEl = document.getElementById('joker-slots');
  if (!slotsEl) return;

  if (run.jokers.length === 0) {
    slotsEl.innerHTML = '<div class="joker-slot-empty">' + _escape(t('game.noJokers')) + '</div>';
    return;
  }

  const html = run.jokers.map((j, idx) => {
    // Ricava art solo dal catalogo statico JOKERS (non da localStorage) per prevenire CSS injection
    const staticDef = window.JOKERS ? JOKERS.find(jd => jd.id === j.id) : null;
    const bg = (staticDef && staticDef.art && staticDef.art.bg) || '#444';
    const icon = (staticDef && staticDef.art && staticDef.art.icon) || (staticDef && staticDef.emoji) || '?';
    const sprite = (window.SPRITES && SPRITES.jokerCard)
      ? SPRITES.jokerCard(j.rarity, icon, bg)
      : `<div class="joker-fallback" style="background:${_escape(bg)}">${_escape(icon)}</div>`;
    return `<div class="joker-slot" data-joker-idx="${idx}" data-joker-id="${_escape(j.id)}">${sprite}</div>`;
  }).join('');
  slotsEl.innerHTML = html;

  // Render anche la barra dei consumabili in tandem con quella dei joker
  renderConsumableBar();
}

function renderConsumableBar() {
  const run = STATE.currentRun;
  const barEl = document.getElementById('consumable-bar');
  if (!barEl) return;
  if (!run || !Array.isArray(run.consumables) || run.consumables.length === 0) {
    barEl.innerHTML = '<div class="consumable-empty">' + _escape(t('game.noTarots')) + '</div>';
    return;
  }
  barEl.innerHTML = run.consumables.map((c, idx) => {
    const staticDef = window.TAROTS ? TAROTS.find(td => td.id === c.id) : null;
    const display = staticDef || c;
    return `
    <div class="consumable-slot" data-consumable-idx="${idx}" role="button" tabindex="0"
         title="${_escape(_jDesc(display))}">
      <div class="consumable-emoji">${_escape(c.emoji || '🔮')}</div>
      <div class="consumable-name">${_escape(_jName(display))}</div>
    </div>`;
  }).join('');
}

function useTarot(idx) {
  const run = STATE.currentRun;
  if (!run || !Array.isArray(run.consumables)) return;
  const tarot = run.consumables[idx];
  if (!tarot) return;

  // Usa effectCode dal catalogo statico, NON da localStorage (anti-injection)
  const staticTarot = (typeof TAROTS !== 'undefined') ? TAROTS.find(t => t.id === tarot.id) : null;
  if (!staticTarot || !staticTarot.effectCode) {
    toast('Tarocco non riconosciuto!', 'error');
    return;
  }

  const ctx = {
    deck: run.deck,
    hand: run.hand,
    jokers: run.jokers,
    money: run.money,
    handSize: run.handSize,
    maxJokerSlots: run.maxJokerSlots || BALANCE.maxJokerSlots,
    random: _rng,
    turnCount: run.handsPlayedTotal || 0,
    requestTransform: null,
    nextJokerFree: false,
  };

  try {
    // eslint-disable-next-line no-new-func
    (new Function('ctx', staticTarot.effectCode))(ctx);
  } catch (e) {
    console.warn('[useTarot]', e);
    toast('Errore nel tarocco!', 'error');
    return;
  }

  if (typeof ctx.money === 'number' && Number.isFinite(ctx.money)) run.money = ctx.money;
  if (typeof ctx.handSize === 'number' && Number.isFinite(ctx.handSize)) run.handSize = ctx.handSize;
  if (typeof ctx.maxJokerSlots === 'number' && Number.isFinite(ctx.maxJokerSlots)) run.maxJokerSlots = ctx.maxJokerSlots;

  run.consumables.splice(idx, 1);
  toast(`"${tarot.name}" — ${tarot.description}`, 'success');
  renderConsumableBar();
  updateHUD();
  renderGameScreen();
  saveState();
}

// ============================================================
// ANIMATE SCORE
// ============================================================

function animateScore(result, onComplete) {
  if (!result) { if (onComplete) onComplete(); return; }

  const total = result.total || 0;
  const breakdown = result.breakdown || [];
  const scoreEl = document.getElementById('hud-score');

  // Lampeggia joker che hanno contribuito
  const flashed = new Set();
  breakdown.forEach(b => {
    if (b.type === 'joker' && b.id && !flashed.has(b.id)) {
      flashed.add(b.id);
      const slot = document.querySelector(`.joker-slot[data-joker-id="${CSS.escape(b.id)}"]`);
      if (slot) {
        slot.classList.add('joker-flash');
        setTimeout(() => slot.classList.remove('joker-flash'), 600);
      }
    }
  });

  // Counter animato del blindScore con rAF
  const run = STATE.currentRun;
  if (!run || !scoreEl) { if (onComplete) onComplete(); return; }

  const startVal = run.blindScore - total;
  const endVal = run.blindScore;
  const duration = 800;
  const startTs = performance.now();
  _skipAnim = false;

  const skipHandler = () => { _skipAnim = true; };
  document.addEventListener('click', skipHandler, { once: true });
  document.addEventListener('keydown', skipHandler, { once: true });

  function frame(now) {
    if (_skipAnim) {
      scoreEl.textContent = endVal.toLocaleString('it-IT');
      cleanup();
      return;
    }
    const t = Math.min(1, (now - startTs) / duration);
    const eased = 1 - Math.pow(1 - t, 3);  // easeOutCubic
    const cur = Math.floor(startVal + (endVal - startVal) * eased);
    scoreEl.textContent = cur.toLocaleString('it-IT');
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    document.removeEventListener('click', skipHandler);
    document.removeEventListener('keydown', skipHandler);
    if (onComplete) onComplete();
  }

  requestAnimationFrame(frame);
}

// ============================================================
// HELPERS
// ============================================================

function _escape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sortHand() {
  const run = STATE.currentRun;
  if (!run) return;
  const order = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, fante: 8, cavallo: 9, re: 10 };
  // Ricostruisci selectedIndices basandoti sull'identità della carta dopo il sort
  const selectedIds = new Set(run.selectedIndices.map(i => run.hand[i] && run.hand[i].id).filter(Boolean));
  run.hand.sort((a, b) => (order[a.valore] || 0) - (order[b.valore] || 0));
  run.selectedIndices = run.hand.map((c, i) => selectedIds.has(c.id) ? i : -1).filter(i => i >= 0);
  renderHandOnly();
  updatePreview();
  updateActionButtons();
}

function showRunInfo() {
  const run = STATE.currentRun;
  if (!run) return;
  const jokerList = run.jokers.length === 0
    ? '<li>' + _escape(t('runinfo.none')) + '</li>'
    : run.jokers.map(j => {
        const staticDef = window.JOKERS ? JOKERS.find(jd => jd.id === j.id) : null;
        const displayJ = staticDef || j;
        return '<li><strong>' + _escape(_jName(displayJ)) + '</strong> — ' + _escape(_jDesc(displayJ)) + '</li>';
      }).join('');
  const html =
    '<div class="run-info">' +
      '<h3>' + _escape(t('runinfo.title')) + '</h3>' +
      '<p>' + _escape(t('runinfo.ante')) + ': <strong>' + run.ante + '/8</strong> — ' + _escape(run.blind.toUpperCase()) + '</p>' +
      '<p>' + _escape(t('runinfo.score')) + ': <strong>' + run.runScore.toLocaleString() + '</strong></p>' +
      '<p>' + _escape(t('runinfo.ducats')) + ': <strong>$' + run.money + '</strong></p>' +
      '<p>' + _escape(t('runinfo.trump')) + ': <strong>' + _escape(run.briscolaSeme) + '</strong></p>' +
      '<h4>' + _escape(t('runinfo.jokersTitle')) + ':</h4>' +
      '<ul>' + jokerList + '</ul>' +
      '<button class="btn-arcade" data-popup-close="ok">' + _escape(t('runinfo.close')) + '</button>' +
    '</div>';
  popup(html);
}

// ============================================================
// WIRING
// ============================================================

let _gameButtonsWired = false;
function wireGameButtons() {
  if (_gameButtonsWired) return;
  _gameButtonsWired = true;
  const playBtn = document.getElementById('btn-play');
  if (playBtn) playBtn.addEventListener('click', () => playHand());

  const discBtn = document.getElementById('btn-discard');
  if (discBtn) discBtn.addEventListener('click', () => discardCards());

  const sortBtn = document.getElementById('btn-sort-rank');
  if (sortBtn) sortBtn.addEventListener('click', () => sortHand());

  const infoBtn = document.getElementById('btn-run-info');
  if (infoBtn) infoBtn.addEventListener('click', () => showRunInfo());

  const drawBtn = document.getElementById('btn-draw-card');
  if (drawBtn) drawBtn.addEventListener('click', () => drawFromDeck());

  // btn-quit-run è già wirato in app.js — non duplicare.
  // app.js fa: STATE.currentRun = null; switchScreen('screen-menu');
  // Per completezza intercetta anche da qui se necessario:
  // (lasciato ad app.js per non duplicare).

  // Delegazione click sulla mano
  const handEl = document.getElementById('cards-hand');
  if (handEl) {
    handEl.addEventListener('click', (ev) => {
      const wrap = ev.target.closest('.card-wrapper');
      if (!wrap) return;
      const idx = parseInt(wrap.dataset.index, 10);
      if (Number.isInteger(idx)) selectCard(idx);
    });
  }

  // Click sui joker → popup info
  const slotsEl = document.getElementById('joker-slots');
  if (slotsEl) {
    slotsEl.addEventListener('click', (ev) => {
      const slot = ev.target.closest('.joker-slot');
      if (!slot) return;
      const run = STATE.currentRun;
      if (!run) return;
      const idx = parseInt(slot.dataset.jokerIdx, 10);
      const j = run.jokers[idx];
      if (!j) return;
      const staticDefJ = window.JOKERS ? JOKERS.find(jd => jd.id === j.id) : null;
      const displayJ2 = staticDefJ || j;
      const rarityKey = 'rarity.' + (j.rarity || 'common');
      const html = `
        <div class="joker-info">
          <h3>${_escape(_jName(displayJ2))} ${_escape(j.emoji || '')}</h3>
          <p class="joker-rarity">${_escape(t(rarityKey) || (j.rarity || '').toUpperCase())}</p>
          <p>${_escape(_jDesc(displayJ2))}</p>
          <p class="joker-trigger">${_escape(t('joker.triggerLabel'))}: <em>${_escape(j.trigger)}</em></p>
          <button class="btn-arcade" data-popup-close="ok">OK</button>
        </div>`;
      popup(html);
    });
  }

  // Wiring consumable bar (tarocchi)
  const consumableBarEl = document.getElementById('consumable-bar');
  if (consumableBarEl) {
    consumableBarEl.addEventListener('click', (ev) => {
      const slot = ev.target.closest('[data-consumable-idx]');
      if (!slot) return;
      const run = STATE.currentRun;
      if (!run) return;
      const cidx = parseInt(slot.dataset.consumableIdx, 10);
      if (!Number.isInteger(cidx)) return;
      const c = run.consumables && run.consumables[cidx];
      if (!c) return;
      const staticDefT = window.TAROTS ? TAROTS.find(td => td.id === c.id) : null;
      const displayT = staticDefT || c;
      const h = `<div class="tarot-use-popup">
        <div class="tarot-use-emoji">${_escape(c.emoji || '🔮')}</div>
        <h3>${_escape(_jName(displayT))}</h3>
        <p>${_escape(_jDesc(displayT))}</p>
        <div class="tarot-popup-btns">
          <button class="btn-arcade" data-popup-close="use">${_escape(t('tarot.use'))}</button>
          <button class="btn-arcade btn-small" data-popup-close="cancel">${_escape(t('btn.cancel'))}</button>
        </div>
      </div>`;
      popup(h).then(val => { if (val === 'use') useTarot(cidx); });
    });
  }

  // Wiring bottone "COMBO?" (cheat-sheet delle combo con esempi)
  const comboHelpBtn = document.getElementById('btn-combo-help');
  if (comboHelpBtn) {
    comboHelpBtn.addEventListener('click', () => {

      // Icone SVG pixel art per i 4 semi napoletani (hardcoded, no input utente)
      const SUIT_SVG = {
        den: `<svg width="13" height="13" viewBox="0 0 13 13" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;vertical-align:middle">
          <circle cx="6" cy="6" r="5" fill="#f4c430"/>
          <circle cx="6" cy="6" r="3" fill="#c8860a"/>
          <circle cx="6" cy="6" r="1.5" fill="#f4c430"/>
        </svg>`,
        cup: `<svg width="11" height="14" viewBox="0 0 11 14" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;vertical-align:middle">
          <polygon points="1,1 10,1 8,7 3,7" fill="#e63946"/>
          <rect x="4" y="7" width="3" height="3" fill="#e63946"/>
          <rect x="2" y="10" width="7" height="2" fill="#e63946"/>
          <rect x="4" y="3" width="3" height="2" fill="#ff8a93" opacity="0.5"/>
        </svg>`,
        spa: `<svg width="12" height="14" viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;vertical-align:middle">
          <polygon points="6,0 11,6 6,10 1,6" fill="#7ecfff"/>
          <rect x="5" y="9" width="2" height="3" fill="#7ecfff"/>
          <rect x="3" y="12" width="6" height="2" fill="#7ecfff"/>
          <line x1="6" y1="1" x2="6" y2="9" stroke="#2196f3" stroke-width="1"/>
        </svg>`,
        bas: `<svg width="8" height="14" viewBox="0 0 8 14" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;vertical-align:middle">
          <rect x="3" y="2" width="2" height="10" fill="#8B5A2B"/>
          <ellipse cx="4" cy="2" rx="2.5" ry="2" fill="#8B5A2B"/>
          <ellipse cx="4" cy="7" rx="2" ry="1.5" fill="#8B5A2B"/>
          <ellipse cx="4" cy="12" rx="2.5" ry="2" fill="#8B5A2B"/>
        </svg>`,
      };

      // Renderizza una mini-carta con valore + icona seme
      // es. card('A','den') → <span class="cmini cmini-den">A + svg</span>
      const card = (val, seme) =>
        `<span class="cmini cmini-${seme}">${val}${SUIT_SVG[seme]}</span>`;

      // Esempi statici per ogni combo (mini-carte SVG hardcoded)
      const COMBO_EXAMPLES = {
        single:         { cards: [card('4','den')] },
        coppia:         { cards: [card('7','den'), card('7','cup')] },
        tris:           { cards: [card('3','den'), card('3','cup'), card('3','spa')] },
        poker:          { cards: [card('5','den'), card('5','cup'), card('5','spa'), card('5','bas')] },
        sette_e_mezzo:  { cards: [card('4','den'), card('3','cup')] },
        bazzica:        { cards: [card('5','den'), card('6','cup'), card('7','spa')] },
        briscola_reale: { cards: [card('A','den'), card('7','den')] },
        carico:         { cards: [card('F','bas'), card('C','bas'), card('R','bas')] },
        napola_mista:   { cards: [card('A','den'), card('2','cup'), card('3','spa')] },
        napoletana:     { cards: [card('A','spa'), card('2','spa'), card('3','spa')] },
        calabresella:   { cards: [card('R','den'), card('C','spa'), card('A','bas')] },
        primiera:       { cards: [card('7','den'), card('6','cup'), card('5','spa'), card('4','bas')] },
        scopa:          { cards: [card('A','den'), card('2','den'), card('3','den'), card('4','den'), card('5','den')] },
      };
      const COMBO_ORDER = [
        'single','coppia','tris','poker','sette_e_mezzo','bazzica',
        'briscola_reale','carico','napola_mista','napoletana','calabresella','primiera','scopa'
      ];
      const rows = COMBO_ORDER.map(id => {
        const vals = BALANCE.combos[id];
        if (!vals) return '';
        const [chips, mult] = vals;
        const label = t(id) || id;
        const info = COMBO_EXAMPLES[id] || { cards: ['—'] };
        return `<tr>
          <td class="combo-name">${_escape(label.toUpperCase())}</td>
          <td class="combo-ex">${info.cards.join('')}</td>
          <td class="combo-chips">+${chips}</td>
          <td class="combo-mult">×${mult}</td>
          <td class="combo-desc">${_escape(t('combo.desc.' + id) || '')}</td>
        </tr>`;
      }).join('');
      const h = `<div class="combo-help">
        <h3>${_escape(t('combo.popupTitle'))}</h3>
        <div class="combo-scroll">
          <table class="combo-table">
            <thead><tr>
              <th>${_escape(t('combo.colCombo'))}</th><th>${_escape(t('combo.colExample'))}</th><th>${_escape(t('combo.colChips'))}</th><th>${_escape(t('combo.colMult'))}</th><th>${_escape(t('combo.colHow'))}</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="combo-tip">${_escape(t('combo.tip'))}</p>
        <button class="btn-arcade" data-popup-close="ok">${_escape(t('combo.ok'))}</button>
      </div>`;
      popup(h);
    });
  }
}

// Auto-wire al caricamento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireGameButtons);
} else {
  wireGameButtons();
}

// ============================================================
// MODIFICA NECESSARIA A cards.js — non richiesta qui se già fatta
// I modifiers boss richiedono che cards.js supporti:
//   modifiers.halfChips, halfDenari, noFigureBonus, onlyNumbers,
//   noAssoChips, invertComboMult, leoneFirstHand, roundChipsBonus, roundMultBonus
// Vedi changelog per la patch a cards.js.
// ============================================================

// ============================================================
// ESPOSIZIONE GLOBALE
// ============================================================
window.Game = {
  startRun, startBlind, dealHand, selectCard, playHand,
  discardCards, endBlind, endRun, updateHUD, renderGameScreen,
  continueFromShop, sortHand, pickBoss, applyBossRule,
  drawFromDeck, renderDeckArea,
  useTarot, renderConsumableBar,
  _sanitizeRun,  // Fase 13 — esposto solo per test edge cases
};
window.startRun = startRun;
window.continueFromShop = continueFromShop;
window.sortHand = sortHand;
