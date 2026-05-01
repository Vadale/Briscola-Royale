'use strict';

/* zodiac.js — Mago Astrologo, predizioni e arricchimento UI selezione segno.
   Caricato con defer DOPO data.js/audio.js/gennarino.js e PRIMA di game.js/app.js.
   API esposta: window.Zodiac.showPrediction(zodiac, isVictory)
*/

(function () {

  // Whitelist segni: ogni input dal DOM (data-sign) viene filtrato qui.
  const ZODIAC_ALLOWED = ['ariete','toro','gemelli','cancro','leone','vergine','bilancia','scorpione','sagittario','capricorno','acquario','pesci'];

  // Simboli unicode zodiacali — chiavi locked alla whitelist.
  const ZODIAC_SYMBOLS = {
    ariete: '♈', toro: '♉', gemelli: '♊', cancro: '♋',
    leone: '♌', vergine: '♍', bilancia: '♎', scorpione: '♏',
    sagittario: '♐', capricorno: '♑', acquario: '♒', pesci: '♓'
  };

  const ZODIAC_LABELS = {
    ariete: 'ARIETE', toro: 'TORO', gemelli: 'GEMELLI', cancro: 'CANCRO',
    leone: 'LEONE', vergine: 'VERGINE', bilancia: 'BILANCIA', scorpione: 'SCORPIONE',
    sagittario: 'SAGITTARIO', capricorno: 'CAPRICORNO', acquario: 'ACQUARIO', pesci: 'PESCI'
  };

  // Tempistiche
  const TYPE_SPEED_MS = 28;          // ms per carattere
  const TYPE_PUNCT_EXTRA_MS = 120;   // pausa extra su ., !, ?
  const END_SCREEN_DELAY_MS = 1800;  // attesa post-vittoria/sconfitta prima del popup

  // ----------------------- helpers -----------------------

  // Sanifica QUALSIASI stringa che finisce in innerHTML.
  // PERCHÉ: anche se i dati di PREDICTIONS sono trusted, passano comunque da qui
  // per difesa in profondità contro futuri cambi del data layer.
  function _escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _validSign(sign) {
    return typeof sign === 'string' && ZODIAC_ALLOWED.indexOf(sign) !== -1 ? sign : null;
  }

  function _pickRandom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _getBonusDesc(sign) {
    const bonuses = (typeof window !== 'undefined' && window.ZODIAC_BONUSES) || (typeof ZODIAC_BONUSES !== 'undefined' ? ZODIAC_BONUSES : null);
    if (!bonuses || !Object.prototype.hasOwnProperty.call(bonuses, sign)) return '';
    const lang = window.STATE && STATE.meta && STATE.meta.lang;
    if (lang === 'en' && bonuses[sign].descEn) return bonuses[sign].descEn;
    return bonuses[sign].desc || '';
  }

  function _getZodiacLabel(sign) {
    if (typeof window.t === 'function') {
      const translated = window.t('zodiac.sign.' + sign);
      if (translated && translated !== 'zodiac.sign.' + sign) return translated.toUpperCase();
    }
    return ZODIAC_LABELS[sign] || (sign || '').toUpperCase();
  }

  function _getPredictionText(sign, isVictory) {
    const preds = (typeof window !== 'undefined' && window.PREDICTIONS) || (typeof PREDICTIONS !== 'undefined' ? PREDICTIONS : null);
    if (!preds) return '...le stelle tacciono.';
    let pool = [];
    if (isVictory) {
      // BRIEF: vittoria → solo pool victory, non sign-specific
      pool = Object.prototype.hasOwnProperty.call(preds, 'victory') && Array.isArray(preds.victory) ? preds.victory.slice() : [];
    } else {
      if (sign && Object.prototype.hasOwnProperty.call(preds, sign) && Array.isArray(preds[sign])) pool = pool.concat(preds[sign]);
      if (Object.prototype.hasOwnProperty.call(preds, 'generic') && Array.isArray(preds.generic)) pool = pool.concat(preds.generic);
    }
    return _pickRandom(pool) || '...le stelle tacciono.';
  }

  function _getString(key, fallback) {
    if (typeof window.t === 'function') return window.t(key) || fallback;
    if (typeof STRINGS !== 'undefined' && STRINGS && STRINGS.it && STRINGS.it[key] != null) return STRINGS.it[key];
    return fallback;
  }

  // ----------------------- SVG mago -----------------------

  function _magoSVG() {
    return [
      '<svg viewBox="0 0 64 80" width="80" height="100" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">',
        // cappello a punta
        '<polygon points="32,2 18,28 46,28" fill="#6a1b9a"/>',
        '<polygon points="32,8 24,26 40,26" fill="#8e24aa"/>',
        '<text x="28" y="22" font-size="8" fill="#f4c430">★</text>',
        '<text x="34" y="16" font-size="6" fill="#f4c430">✦</text>',
        // tesa cappello
        '<rect x="14" y="28" width="36" height="3" fill="#4a148c"/>',
        // testa
        '<rect x="22" y="31" width="20" height="14" fill="#f5deb3"/>',
        // occhi
        '<rect x="26" y="36" width="3" height="3" fill="#1a0a14"/>',
        '<rect x="35" y="36" width="3" height="3" fill="#1a0a14"/>',
        '<rect x="27" y="36" width="1" height="1" fill="#fff8e7"/>',
        '<rect x="36" y="36" width="1" height="1" fill="#fff8e7"/>',
        // sopracciglia cespugliose
        '<rect x="25" y="34" width="5" height="1" fill="#fff8e7"/>',
        '<rect x="34" y="34" width="5" height="1" fill="#fff8e7"/>',
        // naso
        '<rect x="31" y="39" width="2" height="3" fill="#d2a679"/>',
        // barba lunga bianca
        '<polygon points="22,42 42,42 46,68 18,68" fill="#fff8e7"/>',
        '<rect x="29" y="43" width="6" height="2" fill="#e63946"/>',
        // veste viola
        '<polygon points="14,68 50,68 54,80 10,80" fill="#6a1b9a"/>',
        '<text x="20" y="76" font-size="6" fill="#f4c430">✦</text>',
        '<text x="38" y="76" font-size="6" fill="#f4c430">★</text>',
      '</svg>'
    ].join('');
  }

  // ----------------------- typewriter -----------------------

  function _typewriter(el, fullText, onDone) {
    if (!el) { if (onDone) onDone(); return; }
    el.textContent = '';
    let i = 0;
    const len = fullText.length;
    function step() {
      if (i >= len) { if (onDone) onDone(); return; }
      const ch = fullText.charAt(i);
      el.textContent += ch;
      i++;
      const extra = (ch === '.' || ch === '!' || ch === '?') ? TYPE_PUNCT_EXTRA_MS : 0;
      setTimeout(step, TYPE_SPEED_MS + extra);
    }
    setTimeout(step, TYPE_SPEED_MS);
  }

  // ----------------------- popup mago -----------------------

  function showPrediction(zodiac, isVictory) {
    const sign = _validSign(zodiac);
    if (!sign) return Promise.resolve(null);
    if (typeof window.popup !== 'function') return Promise.resolve(null);

    const title = _getString('predictionTitle', "🔮 'O MAGO HA PARLATO 🔮");
    const acceptLbl = _getString('predictionAccept', 'ACCETTO IL MIO DESTINO');
    const label = _getZodiacLabel(sign);
    const text = _getPredictionText(sign, !!isVictory);

    const html = [
      '<div class="mago-popup">',
        '<div class="mago-stars">★ ✦ ☆ ✦ ★ ✦ ☆ ✦ ★</div>',
        '<h2 class="mago-title">', _escape(title), '</h2>',
        '<div class="mago-portrait">', _magoSVG(), '</div>',
        '<p class="mago-intro"><em>' + _escape(_getString('zodiac.starsWatch', 'Le stelle guardano')) + ' ' + _escape(label) + '...</em></p>',
        '<div class="mago-text-box">',
          '<p class="mago-text" id="mago-prediction-text"></p>',
        '</div>',
        '<button class="btn-arcade btn-mago-accept" data-popup-close="accept" disabled id="btn-mago-accept">',
          _escape(acceptLbl),
        '</button>',
      '</div>'
    ].join('');

    const promise = window.popup(html);

    // requestAnimationFrame garantisce che il browser abbia applicato layout e visibilità
    // prima di avviare il typewriter (popup() è sincrono ma il box deve essere visibile).
    requestAnimationFrame(() => {
      const textEl = document.getElementById('mago-prediction-text');
      const btn = document.getElementById('btn-mago-accept');
      _typewriter(textEl, text, () => {
        if (btn) btn.disabled = false;
      });
    });

    return promise;
  }

  // ----------------------- enhancement selezione segno -----------------------

  function _renderZodiacDetail(sign) {
    const detail = document.getElementById('zodiac-detail');
    if (!detail) return;
    const safeSign = _validSign(sign);
    if (!safeSign) { detail.textContent = ''; return; }
    const symbol = ZODIAC_SYMBOLS[safeSign] || '★';
    const label = _getZodiacLabel(safeSign);
    const desc = _getBonusDesc(safeSign);
    detail.innerHTML = [
      '<div class="zodiac-detail-card">',
        '<span class="zodiac-symbol z-color-', _escape(safeSign), '">', _escape(symbol), '</span>',
        '<h3 class="zodiac-detail-name">', _escape(label), '</h3>',
        '<p class="zodiac-detail-desc">', _escape(desc), '</p>',
      '</div>'
    ].join('');
  }

  function _wireZodiacIcons() {
    const icons = document.querySelectorAll('.zodiac-icon');
    icons.forEach(btn => {
      btn.addEventListener('click', () => {
        const sign = _validSign(btn.dataset && btn.dataset.sign);
        if (sign) _renderZodiacDetail(sign);
      });
    });
  }

  // ----------------------- observer schermata fine -----------------------

  function _installEndScreenObserver() {
    const endScreen = document.getElementById('screen-end');
    if (!endScreen || typeof MutationObserver === 'undefined') return;

    // Baseline false: non triggera al boot anche se screen-end fosse marcata active nel markup.
    let lastActive = false;
    const obs = new MutationObserver(() => {
      const nowActive = endScreen.classList.contains('active');
      if (nowActive && !lastActive) {
        // aspetto che le animazioni di game.js settino _lastRun
        setTimeout(() => {
          const STATE = window.STATE || null;
          const last = STATE && STATE._lastRun ? STATE._lastRun : null;
          const sign = _validSign(STATE && STATE.meta && STATE.meta.zodiac);
          if (!sign || !last) return;
          showPrediction(sign, !!last.victory);
        }, END_SCREEN_DELAY_MS);
      }
      lastActive = nowActive;
    });
    obs.observe(endScreen, { attributes: true, attributeFilter: ['class'] });
  }

  // ----------------------- init -----------------------

  function _zodiacInit() {
    _wireZodiacIcons();
    _installEndScreenObserver();
  }

  document.addEventListener('DOMContentLoaded', _zodiacInit);

  window.Zodiac = { showPrediction: showPrediction };

})();
