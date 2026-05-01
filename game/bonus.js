'use strict';
/* ============================================================
   BRISCOLA ROYALE — bonus.js
   Slot machine (3 reel) e Tombola del Munaciello (3×3).
   - Stato modulo in _slot/_tombola (non globali).
   - Tutti i numeri da BALANCE / costanti locali.
   - Nessun setInterval — solo setTimeout + requestAnimationFrame.
   - Testi dinamici sempre tramite _escape().
   ============================================================ */

// ============================================================
// HELPERS
// ============================================================

function _esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _bToast(msg, type) { try { toast(msg, type || 'info'); } catch (e) {} }

function _bBeep(freq, dur, type, vol) {
  if (window.SN_Audio && typeof SN_Audio.beep === 'function') {
    try { SN_Audio.beep(freq, dur, type, vol); } catch (e) {}
  }
}

function _bGennarino(event, text) {
  if (window.Gennarino) {
    try { Gennarino.react(event); } catch (e) {}
    if (text && typeof Gennarino.say === 'function') {
      try { Gennarino.say(text); } catch (e) {}
    }
  }
}

function _fisherYates(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _shakeScreen(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('shake-strong');
  setTimeout(() => { if (el) el.classList.remove('shake-strong'); }, 700);
}

// ============================================================
// FEATURE C — Slot works without active run
// Helper: durante una run usa run.money, fuori run usa STATE.meta.coins.
// Replicano il pattern di _mgGetDucats / _mgAddDucats / _mgSpendDucats di app.js
// (bonus.js carica prima di app.js, quindi non possiamo riusarli direttamente).
// ============================================================
function _slotGetMoney() {
  const run = STATE.currentRun;
  if (run && Number.isFinite(run.money)) return run.money;
  return Number.isFinite(STATE.meta.coins) ? STATE.meta.coins : 0;
}

function _slotAddMoney(n) {
  if (!Number.isFinite(n)) return;
  const run = STATE.currentRun;
  if (run) {
    if (!Number.isFinite(run.money)) run.money = 0;
    run.money = Math.max(0, Math.min(999999999, run.money + n));
    if (typeof window.updateHUD === 'function') {
      try { window.updateHUD(); } catch (e) {}
    }
  } else {
    if (!Number.isFinite(STATE.meta.coins)) STATE.meta.coins = 0;
    STATE.meta.coins = Math.max(0, Math.min(999999999, STATE.meta.coins + n));
    const el = document.getElementById('meta-coins-display');
    if (el) el.textContent = STATE.meta.coins;
  }
  if (typeof saveState === 'function') saveState();
}

function _slotSpendMoney(n) {
  if (!Number.isFinite(n) || n < 0) return false;
  if (_slotGetMoney() < n) return false;
  _slotAddMoney(-n);
  return true;
}

// ============================================================
// SLOT — STATO
// ============================================================

let _slot = {
  spinning: false,
  playsThisVisit: 0,
  // Timer IDs per poter annullare lo spin se l'utente esce durante l'animazione
  _reelTimers: [],
  _resolveTimer: null,
};

// Emoji display per ogni simbolo (sicuri: no HTML chars)
const _SLOT_EMOJI = {
  cherry:  '🍒',
  lemon:   '🍋',
  bell:    '🔔',
  coin:    '🪙',
  seven:   '7️⃣',
  star:    '⭐',
  diamond: '💎',
};

// Sequenza stop reel: staggered per creare suspense
const _REEL_STOP_MS = [700, 1100, 1500];

// ============================================================
// SLOT — LOGIC
// ============================================================

function _weightedSlotSymbol() {
  if (!Array.isArray(SLOT_SYMBOLS) || SLOT_SYMBOLS.length === 0) return null;
  const total = SLOT_SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
  let r = Math.random() * total;
  for (const sym of SLOT_SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

function _doSlotSpin() {
  if (_slot.spinning) return;

  // Valida SLOT_SYMBOLS prima di addebitare soldi
  if (!Array.isArray(SLOT_SYMBOLS) || SLOT_SYMBOLS.length === 0) {
    _bToast('Slot non disponibile al momento.', 'error');
    return;
  }

  const maxPlays = BALANCE.slotMaxPerShopVisit || 3;
  if (_slot.playsThisVisit >= maxPlays) {
    _bToast('Hai già giocato abbastanza, guagliò!', 'error');
    _bGennarino('angry');
    return;
  }

  // Feature C — usa run.money se in run, altrimenti STATE.meta.coins
  const cost = BALANCE.slotCost || 10;
  const balance = _slotGetMoney();
  if (balance < cost) {
    _bToast(`Ti mancano ${cost - balance}💰!`, 'error');
    _bGennarino('sad');
    return;
  }

  if (!_slotSpendMoney(cost)) {
    _bToast('Errore nel pagamento.', 'error');
    return;
  }
  _slot.playsThisVisit += 1;
  _slot.spinning = true;

  _updateSlotCredit();

  const spinBtn = document.getElementById('btn-slot-spin');
  if (spinBtn) spinBtn.disabled = true;

  const display = document.getElementById('slot-display');
  if (display) display.textContent = 'GIRA... GIRA... GIRA...';

  // Calcola risultato in anticipo (deterministico, non importa quando lo vediamo)
  const result = [_weightedSlotSymbol(), _weightedSlotSymbol(), _weightedSlotSymbol()];
  _bBeep(200, 0.05, 'sawtooth', 0.3);
  _animateReels(result, () => _resolveSlot(result));
}

function _animateReels(result, onDone) {
  const ids = ['reel-1', 'reel-2', 'reel-3'];
  _slot._reelTimers = [];
  _slot._resolveTimer = null;

  // Avvia spinning su tutti e 3
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('reel-spinning');
  });

  // Ferma ogni reel con staggering; conserva timer IDs per poter cancellare
  result.forEach((sym, i) => {
    const t = setTimeout(() => {
      const el = document.getElementById(ids[i]);
      if (el) {
        el.classList.remove('reel-spinning');
        el.textContent = _SLOT_EMOJI[sym.id] || sym.label;
        _bBeep(80 + i * 25, 0.06, 'square', 0.2);
      }
      if (i === result.length - 1 && _slot.spinning) {
        _slot._resolveTimer = setTimeout(onDone, 250);
      }
    }, _REEL_STOP_MS[i]);
    _slot._reelTimers.push(t);
  });
}

function _cancelSlotAnimations() {
  _slot._reelTimers.forEach(t => clearTimeout(t));
  _slot._reelTimers = [];
  if (_slot._resolveTimer) { clearTimeout(_slot._resolveTimer); _slot._resolveTimer = null; }
  ['reel-1', 'reel-2', 'reel-3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('reel-spinning');
  });
  _slot.spinning = false;
}

function _resolveSlot(result) {
  _slot.spinning = false;
  const run = STATE.currentRun;
  const display = document.getElementById('slot-display');

  const allSame = result[0].id === result[1].id && result[1].id === result[2].id;
  const winKey  = allSame ? `${result[0].id}3` : null;

  if (winKey === 'diamond3') {
    // JACKPOT
    const prize = BALANCE.slotPayouts.diamond3 || 1000;
    _slotAddMoney(prize);
    if (display) display.textContent = `JACKPOT! +${prize}💰!!!`;
    _flashBulbs();
    _shakeScreen('screen-slot');
    _bBeep(880, 0.6, 'sawtooth', 0.6);
    _bGennarino('jackpot', "MARONN' MIA! JACKPOT! CHE FORTUNA 'E CIUCCIO!");
    _bToast(`JACKPOT! +${prize}💰! Incredibile!`, 'success');

  } else if (winKey === 'star3') {
    // Lootbox gratis: solo se in run (lo shop e' run-bound).
    // Fuori run: fallback cash 30💰 sui meta-coins.
    if (display) display.textContent = '3× STELLE! LOOTBOX GRATIS!';
    _bBeep(660, 0.2, 'triangle', 0.4);
    _bGennarino('win', "Tre stelle! È un segno del cielo!");
    _bToast('3× STELLA! Lootbox Iniziato gratis!', 'success');
    if (run && window.Shop && typeof Shop.openLootbox === 'function') {
      // Torna allo shop PRIMA di aprire la lootbox
      if (window.switchScreen) switchScreen('screen-shop');
      setTimeout(() => Shop.openLootbox('iniziato'), 300);
    } else {
      // Fallback cash (no run, oppure Shop non disponibile)
      const fb = 30;
      _slotAddMoney(fb);
      _bToast(`+${fb}💰 (lootbox non disponibile)`, 'info');
      _updateSlotCredit();
      _renderSlotUI();
    }
    return; // UI update gestito dallo shop (o dal fallback sopra)

  } else if (winKey && BALANCE.slotPayouts[winKey] !== undefined) {
    const prize = BALANCE.slotPayouts[winKey];
    _slotAddMoney(prize);
    if (display) display.textContent = `3× ${result[0].label.toUpperCase()}! +${prize}💰!`;
    _bBeep(350 + Math.min(prize * 2, 600), 0.15, 'triangle', 0.4);
    if (prize >= 60) {
      _bGennarino('win', "Tre ugual'! Te si' beccato 'a vincita bella!");
    } else {
      _bGennarino('win', "Bravo! Un pochino t'è andata bene!");
    }
    _bToast(`Hai vinto ${prize}💰!`, 'success');

  } else {
    const losePhrases = [
      "E dai! 'A prossima volta!",
      "Che sfiga nera!",
      "Mamma mia, nun va bbuono niente...",
      "Tenace come 'o vento! Riprova!",
    ];
    if (display) display.textContent = 'Niente... Riprova, amico!';
    _bBeep(80, 0.1, 'sawtooth', 0.2);
    _bGennarino('sad', losePhrases[Math.floor(Math.random() * losePhrases.length)]);
  }

  _updateSlotCredit();
  _renderSlotUI();
}

function _updateSlotCredit() {
  const el = document.getElementById('slot-credit');
  if (el) el.textContent = _slotGetMoney();
}

function _flashBulbs() {
  const bulbs = document.querySelectorAll('#screen-slot .bulb');
  bulbs.forEach(b => b.classList.add('bulb-flash'));
  setTimeout(() => {
    bulbs.forEach(b => b.classList.remove('bulb-flash'));
  }, 2500);
}

function _renderSlotUI() {
  const maxPlays = BALANCE.slotMaxPerShopVisit || 3;
  const cost = BALANCE.slotCost || 10;
  const spinBtn = document.getElementById('btn-slot-spin');
  const display = document.getElementById('slot-display');

  if (_slot.playsThisVisit >= maxPlays) {
    if (spinBtn) spinBtn.disabled = true;
    if (display) display.textContent = 'BASTA GIRÀ! TORNA DOMANI!';
  } else {
    const canPlay = _slotGetMoney() >= cost && !_slot.spinning;
    if (spinBtn) spinBtn.disabled = !canPlay;
    if (!canPlay && !_slot.spinning && display) {
      display.textContent = 'DUCATI INSUFFICIENTI!';
    }
  }
}

// ============================================================
// SLOT — OPEN / WIRE
// ============================================================

function slotOpen() {
  // Feature C — la slot funziona sia in run (run.money) che dal hub minigiochi (meta.coins).
  // playsThisVisit viene resettato da bonusResetVisit() (apertura shop) e da slotOpen() qui
  // SOLO se non siamo in una run (sessione hub minigiochi: limite per apertura).
  if (!STATE.currentRun) {
    _slot.playsThisVisit = 0;
  }
  _slot.spinning = false;

  _wireSlot();

  // Reset reel display
  ['reel-1', 'reel-2', 'reel-3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('reel-spinning'); el.textContent = '🍒'; }
  });
  const display = document.getElementById('slot-display');
  if (display) display.textContent = `TIRA PER ${BALANCE.slotCost || 10}💰`;

  const costLabel = document.getElementById('slot-cost-label');
  if (costLabel) costLabel.textContent = `COSTO: ${BALANCE.slotCost || 10} 💰`;

  _updateSlotCredit();
  _renderSlotUI();

  if (window.switchScreen) switchScreen('screen-slot');
  _bGennarino('idle', "Benvenuto nella slot! Portafortuna in mano e tira!");
}

function _wireSlot() {
  const spinBtn = document.getElementById('btn-slot-spin');
  if (spinBtn && !spinBtn.dataset.bonusWired) {
    spinBtn.dataset.bonusWired = '1';
    spinBtn.addEventListener('click', _doSlotSpin);
  }

  const exitBtn = document.getElementById('btn-slot-exit');
  if (exitBtn && !exitBtn.dataset.bonusWired) {
    exitBtn.dataset.bonusWired = '1';
    exitBtn.addEventListener('click', () => {
      // Annulla animazioni pendenti e resetta spinning prima di uscire
      _cancelSlotAnimations();
      // Se la slot è stata aperta dall'hub mini-giochi, torna lì.
      const from = window._slotFrom;
      window._slotFrom = null;
      if (window.switchScreen) {
        switchScreen(from === 'minigames' ? 'screen-minigames' : 'screen-shop');
      }
    });
  }
}

// ============================================================
// TOMBOLA — STATO
// ============================================================

let _tombola = {
  card: [],         // 9 numeri sulla cartella (indici 0-8)
  bag: [],          // numeri ancora da estrarre (tutti e 90, poi rimossi)
  extracted: [],    // estratti finora (ordine cronologico)
  marked: new Set(), // numeri della cartella già estratti
  awarded: { ambo: false, terna: false, tombola: false },
  playedThisVisit: false,  // tombola giocata una volta per visita shop
  extractCount: 0,
};

// Premi per traguardo
const _TOMBOLA_PRIZES = {
  ambo:    { ducati: 5,   label: 'AMBO!' },
  terna:   { ducati: 20,  label: 'TERNA!' },
  tombola: { ducati: 60,  label: 'TOMBOLA!' },
};

// Frasi del banditore per i numeri della smorfia
const _BANDITORE_INTRO = [
  "NUMERO",
  "ESCE",
  "ATTENZIOOOONE",
  "TENETE I CARTONI",
  "ECCOLO QUI",
  "'E MMANE 'NCOPP'",
];

// ============================================================
// TOMBOLA — LOGIC
// ============================================================

function _initTombola() {
  const all = Array.from({ length: 90 }, (_, i) => i + 1);
  _tombola.card     = _fisherYates(all).slice(0, 9);
  _tombola.bag      = _fisherYates(all); // sacchetto completo separato dalla cartella
  _tombola.extracted = [];
  _tombola.marked   = new Set();
  _tombola.awarded  = { ambo: false, terna: false, tombola: false };
  _tombola.extractCount = 0;
}

function _doTombolaExtract() {
  const MAX_EXTRACTIONS = 9;
  if (_tombola.bag.length === 0) {
    _bToast('Sacchetto vuoto!', 'info');
    return;
  }
  if (_tombola.awarded.tombola) {
    _bToast('Hai già vinto la tombola!', 'success');
    return;
  }
  if (_tombola.extractCount >= MAX_EXTRACTIONS) {
    _bToast('Massimo 9 estrazioni per round!', 'info');
    return;
  }
  _tombola.extractCount++;

  const run = STATE.currentRun;
  if (run && !Number.isFinite(run.money)) run.money = 0;

  const num = _tombola.bag.pop();
  _tombola.extracted.push(num);

  const onCard = _tombola.card.includes(num);
  if (onCard) {
    _tombola.marked.add(num);
    _bBeep(600, 0.1, 'triangle', 0.3);
  } else {
    _bBeep(200 + (num % 10) * 20, 0.05, 'square', 0.2);
  }

  // Annuncio Smorfia
  const smorfia = (typeof SMORFIA !== 'undefined' && SMORFIA[num]) || '';
  const intro = _BANDITORE_INTRO[Math.floor(Math.random() * _BANDITORE_INTRO.length)];
  const cry = smorfia
    ? `${intro}: ${num}! ${smorfia.toUpperCase()}!`
    : `${intro}: ${num}!`;
  _bGennarino('idle', cry);

  _renderTombolaCard();
  _renderExtracted();
  _checkPrizes();
  _renderTombolaStatus();
}

function _checkPrizes() {
  const run = STATE.currentRun;
  if (!run) return;

  // Ambo: 2+ nella stessa riga
  if (!_tombola.awarded.ambo) {
    for (let r = 0; r < 3; r++) {
      const cnt = [0, 1, 2].filter(c => _tombola.marked.has(_tombola.card[r * 3 + c])).length;
      if (cnt >= 2) {
        _tombola.awarded.ambo = true;
        _grantTombolaPrize('ambo', run);
        break;
      }
    }
  }

  // Terna: riga, colonna o diagonale completa
  if (!_tombola.awarded.terna && _tombolaHasLine()) {
    _tombola.awarded.terna = true;
    _grantTombolaPrize('terna', run);
  }

  // Tombola: tutti e 9
  if (!_tombola.awarded.tombola && _tombola.marked.size === 9) {
    _tombola.awarded.tombola = true;
    _grantTombolaPrize('tombola', run);
  }
}

function _tombolaHasLine() {
  const c = _tombola.card;
  const m = _tombola.marked;
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // righe
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonne
    [0, 4, 8], [2, 4, 6],             // diagonali
  ];
  return lines.some(line => line.every(i => m.has(c[i])));
}

function _grantTombolaPrize(type, run) {
  const prize = _TOMBOLA_PRIZES[type];
  if (!prize) return;

  run.money += prize.ducati;
  saveState();
  _bToast(`${prize.label} +${prize.ducati}💰!`, 'success');
  _bBeep(660, 0.15, 'triangle', 0.4);

  if (type === 'tombola') {
    _bGennarino('win', "TOMBOLA! Guagliò, hai fatto TOMBOLA! Sei un fenomeno assoluto!");
    _shakeScreen('screen-tombola');
    // Premio bonus: tarocco gratis
    _grantTombolaBonus(run);
  } else if (type === 'terna') {
    _bGennarino('win', "TERNA! Tutta 'na fila! Sei in forma, fratè!");
    _bBeep(880, 0.1, 'triangle', 0.35);
  } else {
    _bGennarino('idle', "AMBO! Due numeri! Un po' 'e fortuna ce sta!");
  }
}

function _grantTombolaBonus(run) {
  if (!Array.isArray(run.consumables)) run.consumables = [];
  const max = (BALANCE && BALANCE.maxConsumables) || 2;
  if (run.consumables.length >= max) return;
  if (typeof TAROTS === 'undefined' || TAROTS.length === 0) return;

  // Filtra tarots già posseduti per non duplicare
  const ownedIds = new Set(run.consumables.map(c => c && c.id));
  const pool = TAROTS.filter(t => !ownedIds.has(t.id));
  const candidates = pool.length > 0 ? pool : TAROTS;
  const tarot = candidates[Math.floor(Math.random() * candidates.length)];
  run.consumables.push({
    id: tarot.id,
    name: tarot.name,
    emoji: tarot.emoji,
    description: tarot.description,
    effectCode: tarot.effectCode,
  });
  _bToast(`BONUS: tarocco "${_esc(tarot.name)}" gratis!`, 'success');
  saveState();
}

// ============================================================
// TOMBOLA — RENDERING
// ============================================================

function _renderTombolaCard() {
  const el = document.getElementById('tombola-card');
  if (!el) return;

  // Il grid container di CSS usa grid-template-columns: repeat(3,1fr)
  // → figli diretti sono le celle, senza wrapper per riga
  el.innerHTML = _tombola.card.map(n => {
    const cls = _tombola.marked.has(n) ? 'tombola-cell marked' : 'tombola-cell';
    return `<div class="${cls}">${_esc(String(n))}</div>`;
  }).join('');
}

function _renderExtracted() {
  const el = document.getElementById('tombola-last-numbers');
  if (!el) return;

  const last = _tombola.extracted.slice(-10).reverse();
  if (last.length === 0) {
    el.innerHTML = '<span class="tombola-no-extract">Nessun numero ancora</span>';
    return;
  }
  el.innerHTML = last.map(n => {
    const isHit = _tombola.card.includes(n);
    return `<span class="num${isHit ? ' hit' : ''}">${_esc(String(n))}</span>`;
  }).join('');
}

function _renderTombolaStatus() {
  const el = document.getElementById('tombola-status');
  if (el) {
    const a = _tombola.awarded;
    const parts = [];
    if (a.tombola)      parts.push('TOMBOLA ✓');
    else if (a.terna)  { parts.push('TERNA ✓');  parts.push('TOMBOLA?'); }
    else if (a.ambo)   { parts.push('AMBO ✓'); parts.push('TERNA?'); parts.push('TOMBOLA?'); }
    else               { parts.push('AMBO?'); parts.push('TERNA?'); parts.push('TOMBOLA?'); }
    el.textContent = parts.join(' · ');
  }

  const btn = document.getElementById('btn-tombola-extract');
  if (btn) {
    const done = _tombola.awarded.tombola || _tombola.bag.length === 0 || _tombola.extractCount >= 9;
    btn.disabled = done;
    if (_tombola.bag.length === 0)    btn.textContent = 'SACCHETTO VUOTO';
    else if (_tombola.awarded.tombola) btn.textContent = 'HAI VINTO TUTTO!';
    else if (_tombola.extractCount >= 9) btn.textContent = 'ESTRAZIONI FINITE';
    else                               btn.textContent = 'ESTRAI NUMERO';
  }

  const counterEl = document.getElementById('tombola-extract-counter');
  if (counterEl) {
    const n = Number.isFinite(_tombola.extractCount) ? _tombola.extractCount : 0;
    counterEl.textContent = `ESTRAZIONI: ${n} / 9`;
  }
}

// ============================================================
// TOMBOLA — OPEN / WIRE
// ============================================================

function tombolaOpen() {
  const run = STATE.currentRun;
  if (!run) { _bToast('Nessuna run in corso!', 'error'); return; }
  if (_tombola.playedThisVisit) {
    _bToast('Puoi giocare alla tombola solo una volta per visita!', 'info');
    return;
  }
  _tombola.playedThisVisit = true;

  _initTombola();
  _wireTombola();
  _renderTombolaCard();
  _renderExtracted();
  _renderTombolaStatus();

  if (window.switchScreen) switchScreen('screen-tombola');
  _bGennarino('idle', "Oooh! È arrivata 'a tombola! Silenzio, ca estraggo io!");
}

function _wireTombola() {
  const extractBtn = document.getElementById('btn-tombola-extract');
  if (extractBtn && !extractBtn.dataset.bonusWired) {
    extractBtn.dataset.bonusWired = '1';
    extractBtn.addEventListener('click', _doTombolaExtract);
  }

  const exitBtn = document.getElementById('btn-tombola-exit');
  if (exitBtn && !exitBtn.dataset.bonusWired) {
    exitBtn.dataset.bonusWired = '1';
    exitBtn.addEventListener('click', () => {
      if (window.switchScreen) switchScreen('screen-shop');
    });
  }
}

// ============================================================
// INIEZIONE PULSANTI BONUS NEL FOOTER SHOP
// ============================================================

function _injectShopBonusButtons() {
  if (document.getElementById('btn-open-slot')) return; // già iniettati

  const footer = document.querySelector('#screen-shop .screen-footer');
  if (!footer) return;

  const slotBtn = document.createElement('button');
  slotBtn.type = 'button';
  slotBtn.id = 'btn-open-slot';
  slotBtn.className = 'btn-arcade btn-bonus';
  slotBtn.textContent = '🎰 SLOT';
  slotBtn.addEventListener('click', slotOpen);

  const tombolaBtn = document.createElement('button');
  tombolaBtn.type = 'button';
  tombolaBtn.id = 'btn-open-tombola';
  tombolaBtn.className = 'btn-arcade btn-bonus';
  tombolaBtn.textContent = '🎲 TOMBOLA';
  tombolaBtn.addEventListener('click', tombolaOpen);

  // Inserisci prima del bottone AVANTI (se esiste), altrimenti in fondo
  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) {
    footer.insertBefore(tombolaBtn, nextBtn);
    footer.insertBefore(slotBtn, tombolaBtn);
  } else {
    footer.appendChild(slotBtn);
    footer.appendChild(tombolaBtn);
  }
}

// ============================================================
// INIT
// ============================================================

function bonusInit() {
  _injectShopBonusButtons();
}

// Chiamato da Shop.open() all'inizio di ogni visita al negozio.
// Resetta i contatori di visita per slot e tombola.
function bonusResetVisit() {
  _slot.playsThisVisit = 0;
  _tombola.playedThisVisit = false;
}

// ============================================================
// ESPOSIZIONE GLOBALE
// ============================================================
window.Bonus = {
  init:         bonusInit,
  resetVisit:   bonusResetVisit,
  openSlot:     slotOpen,
  openTombola:  tombolaOpen,
};
