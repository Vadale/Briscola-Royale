'use strict';

// ============================================================
// FASE 14 — TUTORIAL INTERATTIVO
// ============================================================
// IIFE che espone window.Tutorial { start, isActive, skip }.
// - Inietta una partita demo nello STATE (NON salvata su localStorage)
// - Mostra overlay con spotlight + tooltip su 13 step
// - Al termine ripristina lo STATE.currentRun reale e (se finish) chiama startRun()
// - Auto-skip se STATE.meta.tutorialDone === true (gestito dal chiamante)
// ============================================================
(function () {
  'use strict';

  // ============================================================
  // STATO TUTORIAL (chiusura privata)
  // ============================================================
  let _active = false;
  let _step = 0;
  let _overlayEl = null;
  let _tooltipEl = null;
  let _demoRun = null; // snapshot del run reale salvato mentre tutorial è attivo
  let _resizeHandler = null;
  let _steps = []; // popolato in _setup() via _buildSteps()

  const TOTAL_STEPS = 13;

  // ============================================================
  // i18n SHIM — fallback se window.t non e' ancora pronto
  // ============================================================
  function _t(key) {
    return (typeof window.t === 'function') ? window.t(key) : String(key);
  }

  // ============================================================
  // BUILD STEPS — ricostruito ogni volta che il tutorial parte,
  // cosi' i testi seguono la lingua corrente (STATE.meta.lang).
  // ============================================================
  function _buildSteps() {
    return [
      { target: '#screen-game',                                         title: _t('tut.step0.title'),  text: _t('tut.step0.text'),  position: 'center' },
      { target: '#hud',                                                 title: _t('tut.step1.title'),  text: _t('tut.step1.text'),  position: 'bottom' },
      { target: '#deck-area, .deck-area, #btn-draw-card',               title: _t('tut.step2.title'),  text: _t('tut.step2.text'),  position: 'right'  },
      { target: '#cards-hand, .hand-area',                              title: _t('tut.step3.title'),  text: _t('tut.step3.text'),  position: 'top'    },
      { target: '#cards-hand, .hand-area',                              title: _t('tut.step4.title'),  text: _t('tut.step4.text'),  position: 'top'    },
      { target: '#round-info, #hand-type-display, #chips-mult-display', title: _t('tut.step5.title'),  text: _t('tut.step5.text'),  position: 'bottom' },
      { target: '#hud-briscola, #hud-round',                            title: _t('tut.step6.title'),  text: _t('tut.step6.text'),  position: 'bottom' },
      { target: '#btn-play',                                            title: _t('tut.step7.title'),  text: _t('tut.step7.text'),  position: 'top'    },
      { target: '#btn-discard',                                         title: _t('tut.step8.title'),  text: _t('tut.step8.text'),  position: 'top'    },
      { target: '#btn-combo-help',                                      title: _t('tut.step9.title'),  text: _t('tut.step9.text'),  position: 'top'    },
      { target: '#joker-bar, .joker-bar',                               title: _t('tut.step10.title'), text: _t('tut.step10.text'), position: 'left'   },
      { target: '.hud-score, #hud-target',                              title: _t('tut.step11.title'), text: _t('tut.step11.text'), position: 'bottom' },
      { target: null,                                                   title: _t('tut.step12.title'), text: _t('tut.step12.text'), position: 'center' },
    ];
  }

  // ============================================================
  // PARTITA DEMO — mano fissa, stessa ogni volta.
  // Tutti i campi sono coerenti con lo schema STATE.currentRun usato
  // da game.js (updateHUD, renderGameScreen, _sanitizeRun).
  // ============================================================
  const DEMO_RUN = {
    ante: 1,
    blind: 'small',
    blindIndex: 0,
    bossId: null,
    bossRule: null,
    targetScore: 300,
    runScore: 0,
    blindScore: 120,
    handsLeft: 3,
    discardsLeft: 2,
    handSize: 5,
    hand: [
      { id: 'denari-1',   seme: 'denari',  valore: 1,    chips: 11 },
      { id: 'spade-7',    seme: 'spade',   valore: 7,    chips: 10 },
      { id: 'coppe-3',    seme: 'coppe',   valore: 3,    chips: 10 },
      { id: 'spade-2',    seme: 'spade',   valore: 2,    chips: 10 },
      { id: 'bastoni-re', seme: 'bastoni', valore: 're', chips: 10 },
    ],
    deck: [],
    discarded: [],
    played: [],
    selectedIndices: [],
    jokers: [],
    consumables: [],
    money: 10,
    handsPlayedThisRound: 0,
    discardedThisRound: 0,
    roundChipsBonus: 0,
    roundMultBonus: 0,
    jokerState: {},
    usedBosses: [],
    briscolaSeme: 'denari',
    bossMinCards: 0,
    handsPlayedTotal: 0,
    moneySpent: 0,
    jokersBought: 0,
    playerCards: [],
    maxJokerSlots: 5,
    drawsLeft: 99,
    paidDrawsUsed: 0,
    consecutiveLossesAnte1: 0,
  };

  // ============================================================
  // UTILITY: trova il primo elemento che matcha una lista CSV di selettori
  // ============================================================
  function _findEl(selectorList) {
    if (!selectorList) return null;
    const parts = String(selectorList).split(',').map(s => s.trim()).filter(Boolean);
    for (const sel of parts) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch (e) { /* selettore non valido, skip */ }
    }
    return null;
  }

  // ============================================================
  // ESCAPE — XSS guard belt-and-suspenders.
  // Tutti i testi STEPS sono developer-hardcoded ma sanifichiamo lo stesso
  // prima di inserirli in innerHTML.
  // ============================================================
  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================================================
  // RENDERING
  // ============================================================
  function _buildOverlay() {
    const ov = document.createElement('div');
    ov.id = 'tutorial-overlay';
    ov.setAttribute('aria-label', 'Tutorial');
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');

    const tooltip = document.createElement('div');
    tooltip.id = 'tutorial-tooltip';
    tooltip.innerHTML = ''; // riempito in _renderStep
    ov.appendChild(tooltip);

    document.body.appendChild(ov);
    _overlayEl = ov;
    _tooltipEl = tooltip;
  }

  function _renderStep(stepIdx) {
    const step = _steps[stepIdx];
    if (!step || !_tooltipEl) return;

    // 1. Spotlight: muovi il ritaglio sull'elemento target
    const targetEl = _findEl(step.target);
    _updateSpotlight(targetEl);

    // 2. Tooltip content
    const isLast = (stepIdx === TOTAL_STEPS - 1);
    const isFirst = (stepIdx === 0);

    _tooltipEl.innerHTML =
      '<div class="tut-title">' + _esc(step.title) + '</div>' +
      '<div class="tut-text">' + _esc(step.text) + '</div>' +
      '<div class="tut-buttons">' +
        (!isFirst ? '<button type="button" class="btn-arcade btn-small tut-prev" id="tut-btn-prev">' + _esc(_t('tut.prev')) + '</button>' : '') +
        (isLast
          ? '<button type="button" class="btn-arcade tut-finish" id="tut-btn-finish">' + _esc(_t('tut.finish')) + '</button>'
          : '<button type="button" class="btn-arcade btn-small tut-next" id="tut-btn-next">' + _esc(_t('tut.next')) + '</button>'
        ) +
        '<button type="button" class="btn-arcade btn-small tut-skip" id="tut-btn-skip">' + _esc(_t('tut.skip')) + '</button>' +
      '</div>' +
      '<div class="tut-progress">' + (stepIdx + 1) + ' / ' + TOTAL_STEPS + '</div>';

    // 3. Posiziona il tooltip accanto all'elemento (o al centro)
    _positionTooltip(targetEl, step.position);

    // 4. Wiring bottoni (sincrono — gli ID sono freschi)
    const prevBtn = document.getElementById('tut-btn-prev');
    const nextBtn = document.getElementById('tut-btn-next');
    const finBtn  = document.getElementById('tut-btn-finish');
    const skipBtn = document.getElementById('tut-btn-skip');
    if (prevBtn) prevBtn.addEventListener('click', _prevStep);
    if (nextBtn) nextBtn.addEventListener('click', _nextStep);
    if (finBtn)  finBtn.addEventListener('click',  _finish);
    if (skipBtn) skipBtn.addEventListener('click', _skip);
  }

  function _updateSpotlight(el) {
    if (!_overlayEl) return;
    if (!el) {
      // Nessun elemento: rimuovi spotlight (overlay scuro pieno)
      _overlayEl.style.setProperty('--spot-top',    '50%');
      _overlayEl.style.setProperty('--spot-left',   '50%');
      _overlayEl.style.setProperty('--spot-width',  '0px');
      _overlayEl.style.setProperty('--spot-height', '0px');
      _overlayEl.classList.add('no-spotlight');
      return;
    }
    _overlayEl.classList.remove('no-spotlight');
    const r = el.getBoundingClientRect();
    const PAD = 8;
    _overlayEl.style.setProperty('--spot-top',    (r.top    - PAD) + 'px');
    _overlayEl.style.setProperty('--spot-left',   (r.left   - PAD) + 'px');
    _overlayEl.style.setProperty('--spot-width',  (r.width  + PAD * 2) + 'px');
    _overlayEl.style.setProperty('--spot-height', (r.height + PAD * 2) + 'px');
  }

  function _positionTooltip(el, position) {
    if (!_tooltipEl) return;
    const MARGIN = 16;
    // Reset posizionamento precedente
    _tooltipEl.style.top = '';
    _tooltipEl.style.left = '';
    _tooltipEl.style.right = '';
    _tooltipEl.style.bottom = '';
    _tooltipEl.style.transform = '';

    if (!el || position === 'center') {
      _tooltipEl.style.top = '50%';
      _tooltipEl.style.left = '50%';
      _tooltipEl.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const r = el.getBoundingClientRect();
    const tw = _tooltipEl.offsetWidth  || 280;
    const th = _tooltipEl.offsetHeight || 160;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top, left;
    switch (position) {
      case 'bottom':
        top  = r.bottom + MARGIN;
        left = r.left + r.width / 2 - tw / 2;
        break;
      case 'top':
        top  = r.top - th - MARGIN;
        left = r.left + r.width / 2 - tw / 2;
        break;
      case 'right':
        top  = r.top + r.height / 2 - th / 2;
        left = r.right + MARGIN;
        break;
      case 'left':
        top  = r.top + r.height / 2 - th / 2;
        left = r.left - tw - MARGIN;
        break;
      default:
        top  = r.bottom + MARGIN;
        left = r.left + r.width / 2 - tw / 2;
    }
    // Clamp ai bordi schermo
    left = Math.max(MARGIN, Math.min(vw - tw - MARGIN, left));
    top  = Math.max(MARGIN, Math.min(vh - th - MARGIN, top));

    _tooltipEl.style.top  = top  + 'px';
    _tooltipEl.style.left = left + 'px';
  }

  // ============================================================
  // NAVIGAZIONE
  // ============================================================
  function _nextStep() {
    if (!_active) return;
    if (_step < TOTAL_STEPS - 1) {
      _step++;
      _renderStep(_step);
    }
  }

  function _prevStep() {
    if (!_active) return;
    if (_step > 0) {
      _step--;
      _renderStep(_step);
    }
  }

  function _finish() {
    if (!_active) return;
    // teardown PRIMA di saveState: ripristina il run reale in STATE.currentRun
    // così il salvataggio debounced conterrà il run reale, non la partita demo
    _teardown();
    if (window.STATE && STATE.meta) STATE.meta.tutorialDone = true;
    if (typeof window.saveState === 'function') {
      try { window.saveState(); } catch (e) {}
    }
    // Avvia partita vera
    if (typeof window.startRun === 'function') {
      try { window.startRun(); } catch (e) {}
    } else if (typeof window.switchScreen === 'function') {
      window.switchScreen('screen-menu');
    }
  }

  function _skip() {
    if (!_active) return;
    // teardown PRIMA di saveState: stesso motivo di _finish
    _teardown();
    if (window.STATE && STATE.meta) STATE.meta.tutorialDone = true;
    if (typeof window.saveState === 'function') {
      try { window.saveState(); } catch (e) {}
    }
    // Torna al menu senza avviare un run
    if (typeof window.switchScreen === 'function') {
      window.switchScreen('screen-menu');
    }
  }

  // ============================================================
  // SETUP / TEARDOWN
  // ============================================================
  function _setup() {
    // 0. Costruisci gli step nella lingua corrente (ricostruiti ad ogni start)
    _steps = _buildSteps();

    // 1. Salva il run reale (se esiste) — verrà ripristinato in teardown
    _demoRun = (window.STATE && 'currentRun' in STATE) ? STATE.currentRun : null;

    // 2. Inietta la partita demo (deep clone — NON viene salvata su localStorage
    //    perché il teardown ripristina il run reale prima di qualsiasi save).
    const demo = JSON.parse(JSON.stringify(DEMO_RUN));
    if (typeof window.JOKERS !== 'undefined' && Array.isArray(window.JOKERS) && window.JOKERS.length > 0) {
      // Aggiungiamo solo il primo joker statico per mostrare la joker-bar piena
      demo.jokers = [JSON.parse(JSON.stringify(window.JOKERS[0]))];
    }
    if (window.STATE) STATE.currentRun = demo;

    // 3. Mostra la schermata di gioco con i dati demo.
    // NON chiamare switchScreen() perché chiamerebbe saveState() con il run demo in STATE.
    // Togliamo/aggiungiamo la classe .active direttamente, senza effetti collaterali.
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    var gameScreen = document.getElementById('screen-game');
    if (gameScreen) gameScreen.classList.add('active');
    if (typeof window.renderGameScreen === 'function') {
      try { window.renderGameScreen(); } catch (e) {}
    }
    if (typeof window.updateHUD === 'function') {
      try { window.updateHUD(); } catch (e) {}
    }

    // 4. Overlay
    _buildOverlay();
    _step = 0;
    _active = true;
    _renderStep(0);

    // 5. Listeners (keyboard + resize per riposizionare lo spotlight)
    document.addEventListener('keydown', _onKey);
    _resizeHandler = function () {
      if (_active) _renderStep(_step);
    };
    window.addEventListener('resize', _resizeHandler);
  }

  function _teardown() {
    _active = false;
    document.removeEventListener('keydown', _onKey);
    if (_resizeHandler) {
      window.removeEventListener('resize', _resizeHandler);
      _resizeHandler = null;
    }

    // Rimuovi overlay
    if (_overlayEl && _overlayEl.parentNode) {
      _overlayEl.parentNode.removeChild(_overlayEl);
    }
    _overlayEl = null;
    _tooltipEl = null;

    // Ripristina il run reale (NON salviamo il run demo su localStorage)
    if (window.STATE) STATE.currentRun = _demoRun;
    _demoRun = null;
  }

  function _onKey(ev) {
    if (!_active) return;
    if (ev.key === 'ArrowRight' || ev.key === 'Enter') { ev.preventDefault(); _nextStep(); return; }
    if (ev.key === 'ArrowLeft')                         { ev.preventDefault(); _prevStep(); return; }
    if (ev.key === 'Escape')                            { ev.preventDefault(); _skip();     return; }
  }

  // ============================================================
  // API PUBBLICA
  // ============================================================
  window.Tutorial = {
    start: function () {
      if (_active) return;
      _setup();
    },
    isActive: function () { return _active; },
    skip: function () { if (_active) _skip(); },
  };
})();
