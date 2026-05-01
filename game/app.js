'use strict';

const STORAGE_KEY = 'briscola_royale_v1';
const SAVE_DEBOUNCE_MS = 500;

const STATE = {
  meta: {
    coins: 0,
    unlockedJokers: [],
    totalRuns: 0,
    victories: 0,
    bestScore: 0,
    zodiac: null,
    predictionsRead: [],
    lang: 'it',
    // Feature A — Daily Seed: ultimo seed Daily completato con vittoria.
    // Numero YYYYMMDD oppure null se non e' mai stato vinto un Daily.
    dailyDate: null
  },
  currentRun: null,
  settings: {
    sound: true,
    musicVolume: 0.4,
    sfxVolume: 0.8
  }
};

const KONAMI = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
let _konamiBuffer = [];

// ===== Fase 12 — Easter eggs: word buffer (separato dal Konami) =====
let _wordBuffer = '';
let _wordTimer = null;

// Frasi in dialetto strettissimo (modalità Konami)
const DIALETTO_STRETTO_LINES = [
  "UAGLIOOOOO! 'A MUORT' 'E MIE' PATRN!",
  "'NN CE STA' NIENT', GUE'!",
  "ADDUMMISCITE! 'MBRUVUGLIAMMEN!",
  "OH MA' CHE STA SUCCEREN', PAISA'?!",
  "STATT' ZITT' E TIRA STA CARTA, NEH!",
  "MANNAGG' 'A MISERIA, M'ARRACCUMANN'!",
  "ASCIULIATIM' STU CAFE', GUAGLIO'!",
  "'A SCIORTA T'HA APPARATO 'A FACCIA, OVERAMENT'!",
];

// Click counter sul logo del menu (debug mode)
let _logoClicks = 0;
let _logoClickTimer = null;

function deepMerge(target, source) {
  for (const key in source) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = target[key] && typeof target[key] === 'object' ? target[key] : {};
      deepMerge(target[key], source[key]);
    } else if (target[key] === undefined) {
      target[key] = source[key];
    }
  }
  return target;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // merge salvato dentro STATE conservando i default per chiavi nuove
      if (parsed.meta) Object.assign(STATE.meta, parsed.meta);
      if (parsed.settings) Object.assign(STATE.settings, parsed.settings);
      if (parsed.currentRun !== undefined) STATE.currentRun = parsed.currentRun;
      // Sanitize: whitelist/type-check dopo merge da localStorage
      const ZODIAC_ALLOWED = ['ariete','toro','gemelli','cancro','leone','vergine','bilancia','scorpione','sagittario','capricorno','acquario','pesci'];
      if (typeof STATE.meta.zodiac !== 'string' || !ZODIAC_ALLOWED.includes(STATE.meta.zodiac)) STATE.meta.zodiac = null;
      if (typeof STATE.meta.coins !== 'number' || !Number.isFinite(STATE.meta.coins) || STATE.meta.coins < 0) STATE.meta.coins = 0;
      else STATE.meta.coins = Math.min(STATE.meta.coins, 999999999);
      if (typeof STATE.meta.totalRuns !== 'number' || !Number.isFinite(STATE.meta.totalRuns)) STATE.meta.totalRuns = 0;
      if (typeof STATE.meta.victories !== 'number' || !Number.isFinite(STATE.meta.victories)) STATE.meta.victories = 0;
      if (typeof STATE.meta.bestScore !== 'number' || !Number.isFinite(STATE.meta.bestScore)) STATE.meta.bestScore = 0;
      // Feature A — Daily Seed completato (YYYYMMDD intero) o null
      if (STATE.meta.dailyDate != null && (typeof STATE.meta.dailyDate !== 'number' || !Number.isFinite(STATE.meta.dailyDate))) STATE.meta.dailyDate = null;
      if (!Array.isArray(STATE.meta.unlockedJokers)) STATE.meta.unlockedJokers = [];
      if (!Array.isArray(STATE.meta.predictionsRead)) STATE.meta.predictionsRead = [];
      if (!Array.isArray(STATE.meta.seenJokers)) STATE.meta.seenJokers = [];
      else {
        // dedup + filter solo string non vuote (max 200 entry per safety)
        const dedup = [];
        for (let i = 0; i < STATE.meta.seenJokers.length && dedup.length < 200; i++) {
          const v = STATE.meta.seenJokers[i];
          if (typeof v === 'string' && v.length > 0 && v.length < 64 && dedup.indexOf(v) === -1) dedup.push(v);
        }
        STATE.meta.seenJokers = dedup;
      }
      if (!['it','en'].includes(STATE.meta.lang)) STATE.meta.lang = 'it';
      // Sanitize easter egg flags: _konamiCount è intero ≥ 0; pizzaMode è sempre false al caricamento (cosmético)
      STATE.meta._konamiCount = Math.max(0, (parseInt(STATE.meta._konamiCount, 10) || 0));
      STATE.meta.pizzaMode = false; // si reimposta solo in-session digitando PIZZA
      STATE.meta.tutorialDone = STATE.meta.tutorialDone === true; // coerce a boolean
      // assicura difetti per chiavi mancanti dopo update versione
      deepMerge(STATE.meta, { unlockedJokers: [], predictionsRead: [], lang: 'it' });
    }
  } catch (err) {
    console.warn('[STATE] load failed, reset', err);
  }
}

let _saveTimer = null;
function saveState() {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        meta: STATE.meta,
        currentRun: STATE.currentRun,
        settings: STATE.settings
      }));
    } catch (err) {
      console.warn('[STATE] save failed', err);
    }
  }, SAVE_DEBOUNCE_MS);
}

function switchScreen(id) {
  // Accetta sia 'screen-menu' che 'menu' (alias breve) per comodità.
  if (typeof id === 'string' && !id.startsWith('screen-')) {
    const aliased = 'screen-' + id;
    if (document.getElementById(aliased)) id = aliased;
  }
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  try { if (typeof applyLang === 'function') applyLang(); } catch(e) {}
  // refresh display globali
  const coinsDisp = document.getElementById('meta-coins-display');
  if (coinsDisp) coinsDisp.textContent = STATE.meta.coins;
  const zodiacDisp = document.getElementById('meta-zodiac-display');
  if (zodiacDisp) zodiacDisp.textContent = STATE.meta.zodiac ? STATE.meta.zodiac.toUpperCase() : '--';
  // Popola la schermata impostazioni quando viene aperta
  if (id === 'screen-settings' && typeof populateSettings === 'function') {
    try { populateSettings(); } catch (e) {}
  }
  if (id === 'screen-minigames') {
    // Feature C — il jackpot ora funziona sempre (in run usa run.money, fuori usa meta.coins)
    const mgj = document.getElementById('mg-jackpot');
    if (mgj) {
      mgj.style.opacity = '';
      mgj.title = '';
    }
  }
  saveState();
  if (window.SN_Audio && typeof SN_Audio.playBgm === 'function') {
    try {
      const _bgmByScreen = {
        'screen-menu':    'bgm_menu',
        'screen-zodiac':  'bgm_menu',
        'screen-shop':    'bgm_shop',
        'screen-slot':    'bgm_slot',
        'screen-tombola': 'bgm_shop',
      };
      if (_bgmByScreen[id]) SN_Audio.playBgm(_bgmByScreen[id]);
      else if (id === 'screen-end' && window.SN_Audio.stopBgm) SN_Audio.stopBgm();
    } catch (e) {}
  }
  window.scrollTo(0, 0);
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  container.appendChild(el);
  // l'animazione floatUp termina a ~2.9s; rimuovo dopo
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
}

// NOTA: popup() accetta solo HTML controllato dallo sviluppatore, MAI dati utente (no XSS guard).
function popup(html) {
  return new Promise(resolve => {
    const overlay = document.getElementById('popup-overlay');
    const box = document.getElementById('popup-box');
    if (!overlay || !box) { resolve(null); return; }
    box.innerHTML = html;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    const closeHandler = (ev) => {
      // chiusura: click fuori dal box, click su [data-popup-close], Escape
      if (ev.type === 'click' && ev.target !== overlay && !ev.target.closest('[data-popup-close]')) return;
      if (ev.type === 'keydown' && ev.key !== 'Escape') return;
      overlay.removeEventListener('click', closeHandler);
      document.removeEventListener('keydown', closeHandler);
      const value = ev.target && ev.target.dataset ? ev.target.dataset.popupClose : null;
      closePopup();
      resolve(value || true);
    };
    overlay.addEventListener('click', closeHandler);
    document.addEventListener('keydown', closeHandler);
  });
}

function closePopup() {
  const overlay = document.getElementById('popup-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  const box = document.getElementById('popup-box');
  if (box) box.innerHTML = '';
}

function t(key, vars) {
  // STRINGS sarà definito in data.js (Fase 2). Fallback alla chiave per ora.
  let str = key;
  if (typeof STRINGS !== 'undefined' && STRINGS) {
    const lang = (STATE.meta && STATE.meta.lang) || 'it';
    const dict = STRINGS[lang] || STRINGS.it || {};
    if (dict[key] != null) str = dict[key];
    else if (STRINGS.it && STRINGS.it[key] != null) str = STRINGS.it[key];
  }
  if (vars && typeof vars === 'object' && typeof str === 'string') {
    Object.keys(vars).forEach(k => {
      // sostituzione semplice {key} → value (no regex su input utente)
      const val = String(vars[k]);
      str = str.split('{' + k + '}').join(val);
    });
  }
  return str;
}

function applyLang() {
  // Se data.js non è caricato, lascia il testo HTML statico invariato
  if (typeof STRINGS === 'undefined' || !STRINGS) return;
  // Aggiorna tutti gli elementi con attributo data-i18n="key" usando textContent (no XSS).
  const nodes = document.querySelectorAll('[data-i18n]');
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    const key = el.getAttribute('data-i18n');
    if (!key) continue;
    el.textContent = t(key);
  }
  // Aggiorna label del toggle lingua se presente
  const btnLang = document.getElementById('btn-lang-toggle');
  if (btnLang) {
    const lang = (STATE.meta && STATE.meta.lang) || 'it';
    btnLang.textContent = lang === 'en' ? 'EN | IT' : 'IT | EN';
  }
  // Aggiorna i bottoni mute (testo dinamico non gestito da data-i18n)
  try {
    if (typeof STATE !== 'undefined' && STATE && STATE.settings) {
      const muted = STATE.settings.sound === false;
      const muteTopBtn = document.getElementById('btn-mute');
      if (muteTopBtn) muteTopBtn.textContent = muted ? t('settings.mute') : t('settings.unmute');
      const muteSetBtn = document.getElementById('btn-settings-mute');
      if (muteSetBtn) {
        muteSetBtn.textContent = muted ? ('🔇 ' + t('settings.mute')) : ('🔊 ' + t('settings.unmute'));
      }
    }
  } catch (e) { /* ignore */ }
}

function setMute(muted) {
  STATE.settings.sound = !muted;
  const btn = document.getElementById('btn-mute');
  if (btn) {
    btn.classList.toggle('muted', muted);
    btn.textContent = muted ? t('settings.mute') : t('settings.unmute');
  }
  if (window.SN_Audio && typeof window.SN_Audio.setMuted === 'function') {
    window.SN_Audio.setMuted(muted);
  }
  saveState();
}

function onKonami() {
  STATE.meta.coins = Math.min((STATE.meta.coins || 0) + 777, 999999999);
  STATE.meta.cheatsUsed = true;
  STATE.meta._konamiCount = (STATE.meta._konamiCount || 0) + 1;

  // Prima volta -> dialetto stretto + popup Gennarino urlante
  if (STATE.meta._konamiCount === 1) {
    STATE.meta.dialettoStretto = true;
    toast('CHEAT ATTIVATO! +777 ducati', 'success');
    const phrase = DIALETTO_STRETTO_LINES[Math.floor(Math.random() * DIALETTO_STRETTO_LINES.length)];
    // popup() accetta HTML controllato dallo sviluppatore (no input utente)
    const safePhrase = String(phrase).replace(/[<>&"']/g, ''); // cintura di sicurezza extra
    popup(
      '<div class="dialetto-popup">' +
        '<h2>MODALITÀ DIALETTO STRETTO</h2>' +
        '<p>Gennarino sta gridando qualcosa...</p>' +
        '<p class="grido">' + safePhrase + '</p>' +
        '<p>(Da ora in poi tutto suonerà così.)</p>' +
        '<button class="btn-arcade" data-popup-close="ok">CAPISCO NIENTE!</button>' +
      '</div>'
    );
  } else if (STATE.meta._konamiCount >= 2) {
    // Seconda+ volta -> Modalità Matrimonio
    STATE.meta.dialettoStretto = true;
    STATE.meta.coins = Math.min((STATE.meta.coins || 0) + 500, 999999999);
    if (typeof window.showConfetti === 'function') {
      try { window.showConfetti(80); } catch (e) {}
    }
    toast('Evviva gli sposi! +500 ducati in busta regalo!', 'success');
    // Campanile pixel art SVG inline (rect semplici)
    const campanile =
      '<svg class="popup-svg" width="96" height="128" viewBox="0 0 24 32" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
        // base/torre
        '<rect x="6"  y="14" width="12" height="16" fill="#c8a76b"/>' +
        '<rect x="6"  y="14" width="12" height="1"  fill="#1a0a14"/>' +
        '<rect x="6"  y="29" width="12" height="1"  fill="#1a0a14"/>' +
        '<rect x="6"  y="14" width="1"  height="16" fill="#1a0a14"/>' +
        '<rect x="17" y="14" width="1"  height="16" fill="#1a0a14"/>' +
        // mattoni
        '<rect x="7"  y="18" width="10" height="1"  fill="#1a0a14" opacity="0.3"/>' +
        '<rect x="7"  y="22" width="10" height="1"  fill="#1a0a14" opacity="0.3"/>' +
        '<rect x="7"  y="26" width="10" height="1"  fill="#1a0a14" opacity="0.3"/>' +
        // arco campana
        '<rect x="9"  y="6"  width="6"  height="8"  fill="#1a0a14"/>' +
        '<rect x="10" y="7"  width="4"  height="6"  fill="#0f3320"/>' +
        // tetto
        '<rect x="4"  y="5"  width="16" height="2"  fill="#e63946"/>' +
        '<rect x="6"  y="3"  width="12" height="2"  fill="#e63946"/>' +
        '<rect x="8"  y="1"  width="8"  height="2"  fill="#e63946"/>' +
        // croce
        '<rect x="11" y="-1" width="2"  height="3"  fill="#f4c430"/>' +
        '<rect x="10" y="0"  width="4"  height="1"  fill="#f4c430"/>' +
        // campana
        '<rect x="11" y="9"  width="2"  height="2"  fill="#f4c430"/>' +
      '</svg>';
    popup(
      '<div class="matrimonio-popup">' +
        campanile +
        '<h2>MATRIMONIO DI LUSSO NAPOLETANO!</h2>' +
        '<p>"&#128276; Evviva gli sposi! &#128276;"</p>' +
        '<p>+500 ducati in busta regalo!</p>' +
        '<button class="btn-arcade" data-popup-close="ok">SALUTE E FIGLI MASCHI!</button>' +
      '</div>'
    );
  }

  saveState();
  const coinsDisp = document.getElementById('meta-coins-display');
  if (coinsDisp) coinsDisp.textContent = STATE.meta.coins;
}

// ============================================================
// FASE 12 — EASTER EGGS
// ============================================================

// MASTRO PROFESSORE overlay (chiamato da game.js dopo combo perfetta)
function showMastroProfessore() {
  // evita stacking se già presente
  if (document.querySelector('.mastro-prof-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'mastro-prof-overlay';
  const txt = document.createElement('div');
  txt.className = 'mastro-prof-text';
  txt.textContent = 'MASTRO PROFESSORE!';
  overlay.appendChild(txt);
  document.body.appendChild(overlay);

  // Reazione Gennarino
  if (window.Gennarino && typeof Gennarino.say === 'function') {
    try { Gennarino.say('mastroProf'); } catch (e) {}
  }

  // Fade out dopo 2.4s, removeChild dopo 3s
  setTimeout(() => { if (overlay.parentNode) overlay.classList.add('out'); }, 2400);
  setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 3000);
}

// Carta che vola verso la luna (Baggio)
function _flyCardToMoon(startX, startY) {
  const fly = document.createElement('div');
  fly.className = 'baggio-fly';
  fly.textContent = '⚽'; // pallone
  fly.style.left = (startX - 24) + 'px';
  fly.style.top  = (startY - 24) + 'px';
  document.body.appendChild(fly);
  setTimeout(() => { if (fly.parentNode) fly.parentNode.removeChild(fly); }, 1700);
}

// Word buffer: registra lettere singole, controlla parole chiave
function _checkWordBuffer(key) {
  if (typeof key !== 'string' || key.length !== 1) return;
  // Solo caratteri alfabetici per evitare spam
  if (!/[a-z]/.test(key)) return;
  _wordBuffer += key;
  if (_wordBuffer.length > 12) _wordBuffer = _wordBuffer.slice(-12);
  if (_wordTimer) clearTimeout(_wordTimer);
  _wordTimer = setTimeout(() => { _wordBuffer = ''; _wordTimer = null; }, 3000);

  const WORDS = {
    'pizza':    'pizza',
    'fantozzi': 'fantozzi',
    'baggio':   'baggio',
    'totti':    'totti',
    'allegria': 'allegria',
    'maancheno':'maancheno',
  };
  for (const word in WORDS) {
    if (_wordBuffer.endsWith(word)) {
      _wordBuffer = '';
      if (_wordTimer) { clearTimeout(_wordTimer); _wordTimer = null; }
      onEasterEgg(WORDS[word]);
      break;
    }
  }
}

// Dispatch easter eggs (esposto come window.onEasterEgg per debug)
function onEasterEgg(type) {
  const run = STATE.currentRun;

  switch (type) {
    case 'pizza': {
      STATE.meta.pizzaMode = true; // non persistente: non viene salvato perché è cosmetico
      const screen = document.getElementById('screen-game');
      if (screen) screen.classList.add('pizza-mode');
      toast('🍕 MODO PIZZA ATTIVATO! Le carte sanno di mozzarella!', 'success');
      if (window.Gennarino) { try { Gennarino.say('pizza'); } catch (e) {} }
      break;
    }

    case 'fantozzi': {
      // popup scherzoso con quote cult
      const html =
        '<div class="fantozzi-popup">' +
          '<h2>RAGIONIER FANTOZZI</h2>' +
          '<p class="quote">"LA CORAZZATA POTEMKIN... E\' UNA CAGATA PAZZESCA!"</p>' +
          '<p>(90% della sala si e\' alzata ad applaudire)</p>' +
          (run ? '<p>Il ragioniere ti dona una mano di ripetenza!</p>' : '<p>Megadirettore Galattico approva.</p>') +
          '<button class="btn-arcade" data-popup-close="ok">APPLAUSO!</button>' +
        '</div>';
      popup(html);
      if (run && typeof run.handsLeft === 'number') {
        run.handsLeft += 1;
        if (typeof window.updateHUD === 'function') {
          try { window.updateHUD(); } catch (e) {}
        }
        toast('Il ragionier Fantozzi ti dona una mano di ripetenza!', 'success');
      }
      if (window.Gennarino) { try { Gennarino.say('fantozzi'); } catch (e) {} }
      break;
    }

    case 'baggio': {
      // Se c'e' run con almeno 2 carte selezionate -> scarta silenziosamente
      const sel = run && Array.isArray(run.selectedIndices) ? run.selectedIndices.slice() : [];
      if (run && sel.length >= 2 && Array.isArray(run.hand)) {
        // Effetto visivo: pallone che vola
        _flyCardToMoon(window.innerWidth / 2, window.innerHeight * 0.7);
        // Scarta silenziosamente le carte selezionate (no punti, no cost)
        // Ordina inversamente per non rompere indici
        const sorted = sel.slice().sort((a, b) => b - a);
        sorted.forEach(i => {
          if (i >= 0 && i < run.hand.length) run.hand.splice(i, 1);
        });
        run.selectedIndices = [];
        if (typeof window.renderGameScreen === 'function') {
          try { window.renderGameScreen(); } catch (e) {}
        }
        if (typeof window.updateHUD === 'function') {
          try { window.updateHUD(); } catch (e) {}
        }
        toast('IL RIGORE DI BAGGIO! Vola oltre la traversa...', 'info');
      } else {
        // Nessun run / poche carte: popup nostalgico
        const palloneSvg =
          '<svg class="popup-svg" width="64" height="64" viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="5" y="3"  width="6" height="1"  fill="#1a0a14"/>' +
            '<rect x="3" y="4"  width="2" height="1"  fill="#1a0a14"/>' +
            '<rect x="11" y="4" width="2" height="1"  fill="#1a0a14"/>' +
            '<rect x="2" y="5"  width="1" height="6"  fill="#1a0a14"/>' +
            '<rect x="13" y="5" width="1" height="6"  fill="#1a0a14"/>' +
            '<rect x="3" y="11" width="2" height="1"  fill="#1a0a14"/>' +
            '<rect x="11" y="11" width="2" height="1" fill="#1a0a14"/>' +
            '<rect x="5" y="12" width="6" height="1"  fill="#1a0a14"/>' +
            '<rect x="3" y="5"  width="10" height="6" fill="#fff8e7"/>' +
            '<rect x="6" y="6"  width="4" height="1"  fill="#1a0a14"/>' +
            '<rect x="5" y="7"  width="1" height="2"  fill="#1a0a14"/>' +
            '<rect x="10" y="7" width="1" height="2"  fill="#1a0a14"/>' +
            '<rect x="6" y="9"  width="4" height="1"  fill="#1a0a14"/>' +
          '</svg>';
        popup(
          '<div class="baggio-popup">' +
            palloneSvg +
            '<h2>ROBERTO BAGGIO</h2>' +
            '<p class="quote">"USA \'94. Alcuni errori ci rendono immortali."</p>' +
            '<button class="btn-arcade" data-popup-close="ok">CODINO PER SEMPRE</button>' +
          '</div>'
        );
      }
      if (window.Gennarino) { try { Gennarino.say('baggio'); } catch (e) {} }
      break;
    }

    case 'totti': {
      toast("JE SO' PAZZO! Er Pupone ti benedice!", 'success');
      if (run && typeof run.money === 'number') {
        run.money += 100;
        if (typeof window.updateHUD === 'function') {
          try { window.updateHUD(); } catch (e) {}
        }
        toast('Gol di Totti! +100 ducati!', 'success');
      }
      popup(
        '<div class="totti-popup">' +
          '<h2>ER PUPONE</h2>' +
          '<p class="quote">"Io ho segnato, la Roma ha segnato, l\'Italia ha segnato. Semos tutti contenti."</p>' +
          '<p>Capitano per sempre.</p>' +
          '<button class="btn-arcade" data-popup-close="ok">DAJE ROMA!</button>' +
        '</div>'
      );
      if (window.Gennarino) { try { Gennarino.say('totti'); } catch (e) {} }
      break;
    }

    case 'maancheno': {
      // Annulla selezione corrente se run attivo
      if (run && Array.isArray(run.selectedIndices)) {
        run.selectedIndices = [];
        if (typeof window.renderGameScreen === 'function') {
          try { window.renderGameScreen(); } catch (e) {}
        }
        if (typeof window.updateActionButtons === 'function') {
          try { window.updateActionButtons(); } catch (e) {}
        }
      }
      toast('Il popolo italiano ha parlato.', 'info');
      popup(
        '<div class="maancheno-popup">' +
          '<div class="ma-line">MA.</div>' +
          '<div class="ma-line">ANCHE.</div>' +
          '<div class="ma-line">NO.</div>' +
          '<button class="btn-arcade" data-popup-close="ok">VABBE\'</button>' +
        '</div>'
      );
      if (window.Gennarino) { try { Gennarino.say('maancheno'); } catch (e) {} }
      break;
    }

    case 'allegria': {
      if (typeof window.showConfetti === 'function') {
        try { window.showConfetti(40); } catch (e) {}
      }
      toast('ALLEGRIA! Mike Bongiorno approva!', 'success');
      // popup con due bottoni LASCIA / RADDOPPIA
      const html =
        '<div class="allegria-popup">' +
          '<h2>LASCIA O RADDOPPIA?</h2>' +
          '<p>Concorrente, cosa fai?</p>' +
          '<div class="allegria-buttons">' +
            '<button class="btn-arcade" id="btn-allegria-lascia" type="button">LASCIA</button>' +
            '<button class="btn-arcade btn-premium" id="btn-allegria-raddoppia" type="button">RADDOPPIA</button>' +
          '</div>' +
        '</div>';
      popup(html);
      // wire bottoni dopo render (popup ha messo l'innerHTML)
      setTimeout(() => {
        const btnL = document.getElementById('btn-allegria-lascia');
        const btnR = document.getElementById('btn-allegria-raddoppia');
        if (btnL) {
          btnL.addEventListener('click', () => {
            closePopup();
            toast('Saggia decisione, concorrente!', 'info');
          });
        }
        if (btnR) {
          btnR.addEventListener('click', () => {
            closePopup();
            const c = STATE.meta.coins || 0;
            if (c > 50) {
              STATE.meta.coins = Math.floor(c / 2);
              saveState();
              const coinsDisp = document.getElementById('meta-coins-display');
              if (coinsDisp) coinsDisp.textContent = STATE.meta.coins;
              toast('Hai perso meta\'! Come si fa!', 'error');
            } else {
              toast('Non hai niente da raddoppiare, poveretto!', 'info');
            }
          });
        }
      }, 0);
      if (window.Gennarino) { try { Gennarino.say('allegria'); } catch (e) {} }
      break;
    }

    default:
      // tipo sconosciuto: silenzioso
      break;
  }
}

// Debug popup (10 click sul logo)
function _showDebugPopup() {
  const m = STATE.meta || {};
  const r = STATE.currentRun || {};
  const jokerCount = Array.isArray(r.jokers) ? r.jokers.length : 0;
  // Tabella read-only — solo testo controllato dallo sviluppatore
  const html =
    '<div class="debug-popup">' +
      '<h2>&#128295; DEBUG MODE</h2>' +
      '<table>' +
        '<tr><td class="k">coins</td><td class="v">' + (m.coins || 0) + '</td></tr>' +
        '<tr><td class="k">totalRuns</td><td class="v">' + (m.totalRuns || 0) + '</td></tr>' +
        '<tr><td class="k">victories</td><td class="v">' + (m.victories || 0) + '</td></tr>' +
        '<tr><td class="k">bestScore</td><td class="v">' + (m.bestScore || 0) + '</td></tr>' +
        '<tr><td class="k">zodiac</td><td class="v">' + (m.zodiac ? String(m.zodiac).replace(/[<>&"']/g, '') : '--') + '</td></tr>' +
        '<tr><td class="k">jokers (run)</td><td class="v">' + jokerCount + '</td></tr>' +
        '<tr><td class="k">cheatsUsed</td><td class="v">' + (m.cheatsUsed ? 'si' : 'no') + '</td></tr>' +
      '</table>' +
      '<div class="debug-buttons">' +
        '<button class="btn-arcade btn-small" id="btn-dbg-maxcoins" type="button">MAX COINS</button>' +
        '<button class="btn-arcade btn-small" id="btn-dbg-reset" type="button">RESET STATE</button>' +
        '<button class="btn-arcade btn-small" data-popup-close="ok" type="button">CHIUDI</button>' +
      '</div>' +
    '</div>';
  popup(html);
  setTimeout(() => {
    const bMax = document.getElementById('btn-dbg-maxcoins');
    const bReset = document.getElementById('btn-dbg-reset');
    if (bMax) {
      bMax.addEventListener('click', () => {
        STATE.meta.coins = 99999;
        STATE.meta.cheatsUsed = true;
        saveState();
        const coinsDisp = document.getElementById('meta-coins-display');
        if (coinsDisp) coinsDisp.textContent = STATE.meta.coins;
        toast('+ 99999 ducati, ingegnere!', 'success');
        closePopup();
      });
    }
    if (bReset) {
      bReset.addEventListener('click', () => {
        if (confirm('Sei sicuro? Cancellero\' TUTTO il salvataggio.')) {
          try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
          location.reload();
        }
      });
    }
  }, 0);
  toast('🔧 DEBUG MODE ATTIVATO, INGEGNERE!', 'info');
}

function _onLogoClick() {
  _logoClicks += 1;
  if (_logoClickTimer) clearTimeout(_logoClickTimer);
  _logoClickTimer = setTimeout(() => { _logoClicks = 0; _logoClickTimer = null; }, 5000);
  if (_logoClicks >= 10) {
    _logoClicks = 0;
    if (_logoClickTimer) { clearTimeout(_logoClickTimer); _logoClickTimer = null; }
    _showDebugPopup();
  }
}

// ============================================================
// FEATURE A — Daily Seed: prompt CASUALE / DAILY prima di startRun
// ============================================================
// Calcola il seed Daily = YYYYMMDD come intero. Stesso giorno = stesso seed
// per tutti i giocatori. Esposto anche su window per debug.
function _getDailyRunSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
window._getDailyRunSeed = _getDailyRunSeed;

// Mostra un popup con due bottoni: CASUALE (random) o DAILY (seed odierno).
// Chiama callback({ seed, daily }) con la scelta dell'utente.
function _promptRunMode(callback) {
  const today = new Date();
  const dateStr = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
  const todaySeed = _getDailyRunSeed();
  const dailyWonToday = (STATE.meta && STATE.meta.dailyDate === todaySeed);
  // Tutti i contenuti sono controllati dallo sviluppatore: nessun input utente.
  popup(
    '<div class="run-mode-popup">' +
      '<h2 class="popup-title">NUOVA PARTITA</h2>' +
      '<p style="font-size:8px;color:var(--bianco-panna);margin:8px 0">Come vuoi giocare?</p>' +
      '<button type="button" class="btn-arcade btn-big" id="btn-run-random" style="margin-bottom:8px">&#127922; ' + t('run.random') + '</button>' +
      '<button type="button" class="btn-arcade" id="btn-run-daily"' + (dailyWonToday ? ' disabled' : '') + '>&#128197; ' + t('run.daily') + ' &mdash; ' + dateStr + (dailyWonToday ? ' &check;' : '') + '</button>' +
      '<p style="font-size:7px;color:rgba(255,248,231,0.5);margin-top:8px">' +
      (dailyWonToday ? "Daily di oggi gia' vinto! Torna domani per uno nuovo." : 'Il daily usa lo stesso seed per tutti oggi') +
      '</p>' +
      '<button type="button" class="btn-arcade btn-small" data-popup-close="cancel" style="margin-top:8px">' + t('btn.cancel') + '</button>' +
    '</div>'
  );
  setTimeout(() => {
    const btnRandom = document.getElementById('btn-run-random');
    const btnDaily  = document.getElementById('btn-run-daily');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        closePopup();
        if (typeof callback === 'function') callback({ seed: null, daily: false });
      });
    }
    if (btnDaily && !btnDaily.disabled) {
      btnDaily.addEventListener('click', () => {
        closePopup();
        if (typeof callback === 'function') callback({ seed: todaySeed, daily: true });
      });
    }
  }, 50);
}

// Collega tutti i bottoni di navigazione presenti nelle schermate skeleton.
// I moduli futuri (game.js, shop.js, ecc.) aggiungeranno la logica vera;
// questi handler coprono la navigazione base finché quei file non esistono.
function wireNavigation() {

  // --- SELEZIONE ZODIACALE ---
  document.querySelectorAll('.zodiac-icon').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.zodiac-icon').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const confirmBtn = document.getElementById('btn-zodiac-confirm');
      if (confirmBtn) confirmBtn.disabled = false;
    });
  });

  const btnZodiacConfirm = document.getElementById('btn-zodiac-confirm');
  if (btnZodiacConfirm) {
    btnZodiacConfirm.addEventListener('click', () => {
      const sel = document.querySelector('.zodiac-icon.selected');
      if (!sel) return;
      STATE.meta.zodiac = sel.dataset.sign;
      saveState();
      toast('Segno scelto: ' + sel.querySelector('.z-name').textContent + '!', 'success');
      switchScreen('screen-menu');
    });
  }

  // --- MENU PRINCIPALE ---
  // Easter egg: 10 click sul logo entro 5s -> debug popup
  const logoMenu = document.getElementById('logo-menu');
  if (logoMenu) {
    logoMenu.style.cursor = 'pointer';
    logoMenu.addEventListener('click', _onLogoClick);
  }

  const btnPlay = document.getElementById('btn-menu-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      // Feature A — Daily Seed: chiedi modalita' (CASUALE / DAILY) prima di startRun
      const dailyOn = (typeof BALANCE !== 'undefined') && BALANCE && BALANCE.dailySeedEnabled === true;
      if (dailyOn && typeof _promptRunMode === 'function' && typeof startRun === 'function') {
        _promptRunMode(({ seed, daily }) => {
          startRun(seed, daily);
        });
      } else if (typeof startRun === 'function') {
        startRun();
      } else {
        switchScreen('screen-game');
      }
    });
  }

  // Fase 14 — Tutorial interattivo
  const btnHowTo = document.getElementById('btn-how-to-play');
  if (btnHowTo) {
    btnHowTo.addEventListener('click', () => {
      if (window.Tutorial && typeof Tutorial.start === 'function') Tutorial.start();
      else toast('Tutorial non disponibile', 'info');
    });
  }

  const btnPremium = document.getElementById('btn-premium');
  if (btnPremium) {
    btnPremium.addEventListener('click', () => {
      switchScreen('screen-minigames');
    });
  }

  // --- HUB MINI-GIOCHI (SVAGO) ---
  const btnMgBack = document.getElementById('btn-minigames-back');
  if (btnMgBack) {
    btnMgBack.addEventListener('click', () => switchScreen('screen-menu'));
  }

  const mgTabacchi = document.getElementById('mg-tabacchi');
  if (mgTabacchi) mgTabacchi.addEventListener('click', _openTabacchiGame);

  const mgCassaforte = document.getElementById('mg-cassaforte');
  if (mgCassaforte) mgCassaforte.addEventListener('click', _openCassaforteGame);

  const mgJackpot = document.getElementById('mg-jackpot');
  if (mgJackpot) {
    mgJackpot.addEventListener('click', () => {
      // Feature C — Jackpot funziona sia in run (usa run.money) che fuori run
      // (usa STATE.meta.coins come bilancia). Niente guard.
      window._slotFrom = 'minigames';
      if (window.Bonus && typeof Bonus.openSlot === 'function') {
        Bonus.openSlot();
      } else {
        toast('Slot non disponibile.', 'error');
      }
    });
  }

  const mgPachinko = document.getElementById('mg-pachinko');
  if (mgPachinko) mgPachinko.addEventListener('click', _openPachinkoGame);

  const btnCollection = document.getElementById('btn-collection');
  if (btnCollection) {
    btnCollection.addEventListener('click', () => {
      try { populateCollection(); } catch (e) {}
      switchScreen('screen-collection');
    });
  }
  const btnCollBack = document.getElementById('btn-coll-back');
  if (btnCollBack) {
    btnCollBack.addEventListener('click', () => switchScreen('screen-menu'));
  }

  // --- SCHERMATA DI GIOCO ---
  const btnQuitRun = document.getElementById('btn-quit-run');
  if (btnQuitRun) {
    btnQuitRun.addEventListener('click', () => {
      const overlay = document.getElementById('popup-overlay');
      const box = document.getElementById('popup-box');
      if (!overlay || !box) {
        // Fallback: nessun popup disponibile, abbandona direttamente
        STATE.currentRun = null;
        saveState();
        switchScreen('screen-menu');
        return;
      }
      box.innerHTML = `
        <p class="popup-title" style="color:var(--rosso)">⚠ ${t('btn.abandon')}?</p>
        <p style="font-size:8px;color:var(--bianco-panna);margin:8px 0">${t('abandon.confirm')}</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
          <button type="button" class="btn-arcade btn-sm" id="btn-confirm-abandon" style="background:var(--rosso)">${t('abandon.yes')}</button>
          <button type="button" class="btn-arcade btn-sm" data-popup-close="cancel">${t('btn.cancel')}</button>
        </div>
      `;
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      const btnConfirm = document.getElementById('btn-confirm-abandon');
      if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
          closePopup();
          STATE.currentRun = null;
          saveState();
          switchScreen('screen-menu');
        });
      }
      const btnCancel = box.querySelector('[data-popup-close]');
      if (btnCancel) {
        btnCancel.addEventListener('click', () => closePopup());
      }
      const _escAbandon = (ev2) => {
        if (ev2.key === 'Escape') { closePopup(); document.removeEventListener('keydown', _escAbandon); }
      };
      document.addEventListener('keydown', _escAbandon);
    });
  }

  // btn-sort-rank è wirato da game.js wireGameButtons() — nessun duplicato qui.

  // --- NEGOZIO ---
  const btnNext = document.getElementById('btn-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (typeof continueFromShop === 'function') { continueFromShop(); }
      else { switchScreen('screen-game'); }
    });
  }

  // --- SLOT MACHINE ---
  // NOTA: btn-slot-exit è wirato da bonus.js _wireSlot() che gestisce anche
  // il ritorno corretto (screen-shop oppure screen-minigames) tramite il
  // flag window._slotFrom. Non duplichiamo l'handler qui per evitare doppi switch.

  // --- TOMBOLA ---
  const btnTombolaExit = document.getElementById('btn-tombola-exit');
  if (btnTombolaExit) {
    btnTombolaExit.addEventListener('click', () => switchScreen('screen-shop'));
  }

  // --- FINE PARTITA ---
  const btnRetry = document.getElementById('btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      // Feature A — RIGIOCA presenta nuovamente il prompt CASUALE/DAILY
      const dailyOn = (typeof BALANCE !== 'undefined') && BALANCE && BALANCE.dailySeedEnabled === true;
      if (dailyOn && typeof _promptRunMode === 'function' && typeof startRun === 'function') {
        _promptRunMode(({ seed, daily }) => {
          startRun(seed, daily);
        });
      } else if (typeof startRun === 'function') {
        startRun();
      } else {
        switchScreen('screen-game');
      }
    });
  }

  const btnMenuEnd = document.getElementById('btn-menu-end');
  if (btnMenuEnd) btnMenuEnd.addEventListener('click', () => switchScreen('screen-menu'));

  // --- POPUP OVERLAY click fuori ---
  const overlay = document.getElementById('popup-overlay');
  if (overlay) {
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) closePopup();
    });
  }
}

// ============================================================
// SCHERMATA IMPOSTAZIONI
// ============================================================

const ZODIAC_SYMBOLS = {
  ariete: '♈', toro: '♉', gemelli: '♊', cancro: '♋',
  leone: '♌', vergine: '♍', bilancia: '♎', scorpione: '♏',
  sagittario: '♐', capricorno: '♑', acquario: '♒', pesci: '♓'
};

function _clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function _toPercent(v) {
  const n = _clamp01(Number(v));
  return Math.round(n * 100);
}

function populateCollection() {
  const grid = document.getElementById('coll-grid');
  const counter = document.getElementById('coll-counter');
  if (!grid) return;
  const seen = Array.isArray(STATE.meta.seenJokers) ? STATE.meta.seenJokers : [];
  const currentJokers = (STATE.currentRun && Array.isArray(STATE.currentRun.jokers)) ? STATE.currentRun.jokers : [];
  const owned = currentJokers.filter(Boolean).map(j => j && j.id).filter(Boolean);
  const allJokers = (typeof JOKERS !== 'undefined' && Array.isArray(JOKERS)) ? JOKERS : [];
  const lang = (STATE.meta && STATE.meta.lang) || 'it';

  grid.innerHTML = '';
  allJokers.forEach(joker => {
    if (!joker || !joker.id) return;
    const isSeen = seen.indexOf(joker.id) !== -1;
    const isOwned = owned.indexOf(joker.id) !== -1;
    const status = isOwned ? 'owned' : isSeen ? 'seen' : 'locked';
    const div = document.createElement('div');
    div.className = 'coll-card coll-' + status;
    div.setAttribute('data-filter-status', status === 'locked' ? 'locked' : 'seen');

    const iconDiv = document.createElement('div');
    iconDiv.className = 'coll-card-icon';
    const iconChar = (joker.art && joker.art.icon) ? joker.art.icon : (joker.emoji || '🃏');
    iconDiv.textContent = (isSeen || isOwned) ? iconChar : '?';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'coll-card-name';
    nameDiv.textContent = (isSeen || isOwned) ? (joker.name || joker.id) : t('coll.locked');

    const rarityDiv = document.createElement('div');
    rarityDiv.className = 'coll-card-rarity rarity-' + (joker.rarity || 'common');
    rarityDiv.textContent = String(joker.rarity || '').toUpperCase();

    div.appendChild(iconDiv);
    div.appendChild(nameDiv);
    div.appendChild(rarityDiv);

    if (isSeen || isOwned) {
      const descDiv = document.createElement('div');
      descDiv.className = 'coll-card-desc';
      descDiv.textContent = joker.description || joker.desc || '';
      div.appendChild(descDiv);
    }

    grid.appendChild(div);
  });

  const total = allJokers.length;
  const unlockedCount = seen.length;
  if (counter) {
    const suffix = (typeof STRINGS !== 'undefined' && STRINGS && STRINGS[lang] && STRINGS[lang]['coll.unlockedSuffix'])
      ? STRINGS[lang]['coll.unlockedSuffix']
      : (lang === 'en' ? 'unlocked' : 'sbloccati');
    counter.textContent = unlockedCount + ' / ' + total + ' ' + suffix;
  }

  // Filter buttons
  document.querySelectorAll('.coll-filter').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('.coll-filter').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const f = this.getAttribute('data-filter');
      document.querySelectorAll('.coll-card').forEach(card => {
        card.style.display = (f === 'all' || card.getAttribute('data-filter-status') === f) ? '' : 'none';
      });
    };
  });
}

function populateSettings() {
  const meta = STATE.meta || {};
  const settings = STATE.settings || {};

  // Audio sliders
  const bgmSlider = document.getElementById('settings-bgm-vol');
  const bgmDisp = document.getElementById('settings-bgm-vol-display');
  const sfxSlider = document.getElementById('settings-sfx-vol');
  const sfxDisp = document.getElementById('settings-sfx-vol-display');

  const bgmPct = _toPercent(settings.musicVolume != null ? settings.musicVolume : 0.4);
  const sfxPct = _toPercent(settings.sfxVolume != null ? settings.sfxVolume : 0.8);

  if (bgmSlider) bgmSlider.value = String(bgmPct);
  if (bgmDisp) bgmDisp.textContent = String(bgmPct);
  if (sfxSlider) sfxSlider.value = String(sfxPct);
  if (sfxDisp) sfxDisp.textContent = String(sfxPct);

  // Mute button
  const muteBtn = document.getElementById('btn-settings-mute');
  if (muteBtn) {
    const isOn = settings.sound !== false;
    muteBtn.textContent = isOn ? ('🔊 ' + t('settings.unmute')) : ('🔇 ' + t('settings.mute'));
    muteBtn.classList.toggle('muted', !isOn);
  }

  // Zodiac
  const zSym = document.getElementById('settings-zodiac-symbol');
  const zName = document.getElementById('settings-zodiac-name');
  const sign = meta.zodiac;
  if (zSym) zSym.textContent = (sign && ZODIAC_SYMBOLS[sign]) ? ZODIAC_SYMBOLS[sign] : '☄';
  if (zName) zName.textContent = sign ? String(sign).toUpperCase() : '--';

  // Stats
  const totalRuns = Number.isFinite(meta.totalRuns) ? meta.totalRuns : 0;
  const victories = Number.isFinite(meta.victories) ? meta.victories : 0;
  const defeats = Math.max(0, totalRuns - victories);
  const bossDefeated = Number.isFinite(meta.bossDefeated) ? meta.bossDefeated : 0;
  const bestScore = Number.isFinite(meta.bestScore) ? meta.bestScore : 0;
  const totalDucats = Number.isFinite(meta.totalDucats) ? meta.totalDucats : 0;
  const favCombo = (typeof meta.favoriteCombo === 'string' && meta.favoriteCombo) ? meta.favoriteCombo : '—';
  const favJoker = (typeof meta.favoriteJoker === 'string' && meta.favoriteJoker) ? meta.favoriteJoker : '—';

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };
  setText('stat-total-runs', totalRuns);
  setText('stat-victories', victories);
  setText('stat-defeats', defeats);
  setText('stat-boss-defeated', bossDefeated);
  setText('stat-best-score', bestScore);
  setText('stat-total-ducats', totalDucats);
  setText('stat-favorite-combo', favCombo);
  setText('stat-favorite-joker', favJoker);
}

// ============================================================
// MINI-GIOCHI HUB (Tabacchi, Cassaforte, Pachinko)
// Jackpot riusa la slot machine esistente in bonus.js
// ============================================================

// Helpers ducati: durante una run i ducati stanno in run.money,
// fuori run usiamo STATE.meta.coins (meta-currency persistente).
function _mgGetDucats() {
  const run = STATE.currentRun;
  if (run && Number.isFinite(run.money)) return run.money;
  return Number.isFinite(STATE.meta.coins) ? STATE.meta.coins : 0;
}

function _mgAddDucats(amount) {
  if (!Number.isFinite(amount)) return;
  const run = STATE.currentRun;
  if (run) {
    if (!Number.isFinite(run.money)) run.money = 0;
    run.money = Math.max(0, Math.min(999999999, run.money + amount));
    if (typeof window.updateHUD === 'function') {
      try { window.updateHUD(); } catch (e) {}
    }
  } else {
    if (!Number.isFinite(STATE.meta.coins)) STATE.meta.coins = 0;
    STATE.meta.coins = Math.max(0, Math.min(999999999, STATE.meta.coins + amount));
    const disp = document.getElementById('meta-coins-display');
    if (disp) disp.textContent = STATE.meta.coins;
  }
  saveState();
}

function _mgSpendDucats(amount) {
  if (!Number.isFinite(amount) || amount < 0) return false;
  if (_mgGetDucats() < amount) return false;
  _mgAddDucats(-amount);
  return true;
}

function _mgSfxCoin() {
  if (window.SN_Audio && typeof SN_Audio.sfxCoinGet === 'function') {
    try { SN_Audio.sfxCoinGet(); } catch (e) {}
  }
}

function _mgSfxJackpot() {
  if (window.SN_Audio && typeof SN_Audio.sfxJackpot === 'function') {
    try { SN_Audio.sfxJackpot(); } catch (e) {}
  }
}

function _mgSfxClick() {
  if (window.SN_Audio && typeof SN_Audio.sfxCardPlay === 'function') {
    try { SN_Audio.sfxCardPlay(); } catch (e) {}
  }
}

// ------------------------------------------------------------
// MINI-GIOCO 1: TABACCHI (sigaretta da fumare tenendo premuto)
// ------------------------------------------------------------
function _openTabacchiGame() {
  // SVG sigaretta inline (pixel art). NB: la rect ember (id cig-ember)
  // si accorcia man mano che la sigaretta si "consuma".
  const cigSvg =
    '<svg id="tab-cig" width="240" height="40" viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;display:block;margin:8px auto">' +
      '<rect x="0" y="6" width="30" height="8" fill="#f4c430" rx="2"/>' +
      '<rect id="cig-body" x="30" y="5" width="80" height="10" fill="#fff8e7" rx="1"/>' +
      '<rect id="cig-ember" x="110" y="7" width="10" height="6" fill="#e63946" rx="1"/>' +
    '</svg>';

  const html =
    '<div class="mg-popup mg-tabacchi-popup">' +
      '<h2 class="mg-popup-title">' + t('mg.tabacchi.title') + '</h2>' +
      '<p class="mg-popup-sub">' + t('mg.tabacchi.sub') + '</p>' +
      cigSvg +
      '<div class="mg-burn-bar"><div class="mg-burn-fill" id="tab-burn-fill"></div></div>' +
      '<button type="button" id="tab-cig-btn" class="btn-arcade" style="touch-action:none">' + t('mg.tabacchi.btn') + '</button>' +
      '<p class="mg-status" id="tab-status">' + t('mg.tabacchi.status0') + '</p>' +
      '<button type="button" class="btn-arcade btn-small" data-popup-close="ok" style="margin-top:10px">' + t('mg.close') + '</button>' +
    '</div>';

  popup(html);

  // Stato locale: una sigaretta sola per apertura popup
  setTimeout(() => {
    const btn = document.getElementById('tab-cig-btn');
    const fill = document.getElementById('tab-burn-fill');
    const cig = document.getElementById('cig-body');
    const ember = document.getElementById('cig-ember');
    const status = document.getElementById('tab-status');
    if (!btn || !fill) return;

    const BURN_MS = 1500;
    let progress = 0; // 0 -> 1
    let lastTs = 0;
    let rafId = 0;
    let holding = false;
    let done = false;

    function tick(ts) {
      // Se il popup è stato chiuso, interrompi
      if (!document.body.contains(btn)) { rafId = 0; return; }
      if (!holding || done) { rafId = 0; return; }
      if (!lastTs) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;
      progress += dt / BURN_MS;
      if (progress > 1) progress = 1;
      // Aggiorna barra (rimanente)
      fill.style.width = ((1 - progress) * 100).toFixed(2) + '%';
      // Accorcia visivamente la sigaretta
      if (cig) {
        const newW = 80 * (1 - progress);
        cig.setAttribute('width', String(newW));
      }
      if (ember) {
        const emberX = 30 + 80 * (1 - progress);
        ember.setAttribute('x', String(emberX));
      }
      if (progress >= 1) {
        done = true;
        holding = false;
        rafId = 0;
        _mgAddDucats(10);
        _mgSfxCoin();
        try { toast(t('mg.tabacchi.toast'), 'success'); } catch (e) {}
        if (status) status.textContent = t('mg.tabacchi.statusDone');
        btn.disabled = true;
        btn.textContent = t('mg.tabacchi.btnDone');
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function startHold(ev) {
      if (done) return;
      if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
      if (holding) return;
      holding = true;
      lastTs = 0;
      if (status) status.textContent = t('mg.tabacchi.statusHold');
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function stopHold() {
      if (done) return;
      holding = false;
      lastTs = 0;
      if (status && progress < 1) status.textContent = t('mg.tabacchi.statusStop');
    }

    btn.addEventListener('pointerdown', startHold);
    btn.addEventListener('pointerup', stopHold);
    btn.addEventListener('pointerleave', stopHold);
    btn.addEventListener('pointercancel', stopHold);
  }, 0);
}

// ------------------------------------------------------------
// MINI-GIOCO 2: CASSAFORTE D'ORO (5 colpi col piede di porco)
// ------------------------------------------------------------
function _openCassaforteGame() {
  const safeSvg =
    '<svg id="safe-svg" width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;display:block;margin:10px auto">' +
      '<rect x="5" y="5" width="90" height="90" fill="#f4c430" stroke="#c8860a" stroke-width="4" rx="4"/>' +
      '<circle cx="50" cy="50" r="25" fill="#c8860a" stroke="#f4c430" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="12" fill="#f4c430"/>' +
      '<text x="50" y="56" text-anchor="middle" font-size="14" fill="#1a0a14" font-family="Arial,sans-serif">&#128274;</text>' +
    '</svg>';

  const html =
    '<div class="mg-popup mg-cassaforte-popup">' +
      '<h2 class="mg-popup-title">' + t('mg.cassaforte.title') + '</h2>' +
      '<p class="mg-popup-sub">' + t('mg.cassaforte.sub') + '</p>' +
      safeSvg +
      '<p class="mg-status" id="safe-status">' + t('mg.cassaforte.statusProgress', { n: 0 }) + '</p>' +
      '<button type="button" id="safe-crack-btn" class="btn-arcade">' + t('mg.cassaforte.btn') + '</button>' +
      '<button type="button" class="btn-arcade btn-small" data-popup-close="ok" style="margin-top:10px">' + t('mg.close') + '</button>' +
    '</div>';

  popup(html);

  setTimeout(() => {
    const btn = document.getElementById('safe-crack-btn');
    const safeEl = document.getElementById('safe-svg');
    const status = document.getElementById('safe-status');
    if (!btn || !safeEl) return;

    let clicks = 0;
    const REQUIRED = 5;
    let done = false;

    btn.addEventListener('click', () => {
      if (done) return;
      clicks += 1;
      // Rimuovi classi crack precedenti, applica nuova
      for (let i = 1; i <= 5; i++) safeEl.classList.remove('crack-' + i);
      safeEl.classList.add('crack-' + Math.min(clicks, 5));
      _mgSfxClick();
      if (clicks < REQUIRED) {
        if (status) status.textContent = t('mg.cassaforte.statusProgress', { n: clicks });
        if (typeof window.shakeScreen === 'function') {
          try { window.shakeScreen('light'); } catch (e) {}
        }
      } else {
        // Cassaforte aperta!
        done = true;
        btn.disabled = true;
        btn.textContent = t('mg.cassaforte.btnDone');
        if (status) status.textContent = t('mg.cassaforte.statusDone');
        if (typeof window.shakeScreen === 'function') {
          try { window.shakeScreen('strong'); } catch (e) {}
        }
        if (typeof window.showGoldParticles === 'function') {
          try { window.showGoldParticles(20); } catch (e) {}
        }
        _mgSfxJackpot();
        _mgAddDucats(100);
        try { toast(t('mg.cassaforte.toast'), 'success'); } catch (e) {}
      }
    });
  }, 0);
}

// ------------------------------------------------------------
// MINI-GIOCO 3: PACHINKO (pallina + pioli + slot in fondo)
// ------------------------------------------------------------
function _openPachinkoGame() {
  const COST = 5;
  if (_mgGetDucats() < COST) {
    try { toast(t('mg.pachinko.toastNoMoney', { cost: COST }), 'error'); } catch (e) {}
    return;
  }
  if (!_mgSpendDucats(COST)) {
    try { toast(t('mg.pachinko.toastError'), 'error'); } catch (e) {}
    return;
  }

  const html =
    '<div class="mg-popup mg-pachinko-popup">' +
      '<h2 class="mg-popup-title">' + t('mg.pachinko.title') + '</h2>' +
      '<p class="mg-popup-sub">' + t('mg.pachinko.sub', { cost: COST }) + '</p>' +
      '<canvas id="pachinko-canvas" width="200" height="300" style="background:#0f3320;border:3px solid var(--oro);display:block;margin:10px auto;image-rendering:pixelated"></canvas>' +
      '<p class="mg-status" id="pachinko-status">' + t('mg.pachinko.status0') + '</p>' +
      '<button type="button" class="btn-arcade btn-small" data-popup-close="ok" style="margin-top:10px">' + t('mg.close') + '</button>' +
    '</div>';

  popup(html);

  setTimeout(() => {
    const canvas = document.getElementById('pachinko-canvas');
    const status = document.getElementById('pachinko-status');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    // Costanti fisica (locali, semplici)
    const GRAVITY = 0.3;
    const BALL_RADIUS = 8;
    const PEG_RADIUS = 6;
    const DAMPING = 0.6;
    const MAX_FRAMES = 60 * 12; // safety: max 12 secondi di simulazione

    const PEGS = [
      // riga 1 (y=80): 4 pioli
      { x: 50, y: 80 }, { x: 90, y: 80 }, { x: 130, y: 80 }, { x: 170, y: 80 },
      // riga 2 (y=120): 3 pioli (offset)
      { x: 70, y: 120 }, { x: 110, y: 120 }, { x: 150, y: 120 },
      // riga 3 (y=160): 4 pioli
      { x: 50, y: 160 }, { x: 90, y: 160 }, { x: 130, y: 160 }, { x: 170, y: 160 },
      // riga 4 (y=200): 3 pioli
      { x: 70, y: 200 }, { x: 110, y: 200 }, { x: 150, y: 200 },
    ];
    const SLOTS = [
      { x: 0,   w: 50, reward: 5,  label: '5'  },
      { x: 50,  w: 50, reward: 10, label: '10' },
      { x: 100, w: 50, reward: 20, label: '20' },
      { x: 150, w: 50, reward: 50, label: '50' },
    ];
    const SLOT_Y = 270;
    const SLOT_H = 30;

    // Stato pallina
    let ball = { x: 100, y: 20, vx: 0, vy: 0 };
    let dropped = false;
    let resolved = false;
    let frames = 0;
    let rafId = 0;

    function drawScene() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // pioli (oro)
      ctx.fillStyle = '#f4c430';
      for (let i = 0; i < PEGS.length; i++) {
        const p = PEGS[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
      // slot in fondo
      for (let i = 0; i < SLOTS.length; i++) {
        const s = SLOTS[i];
        ctx.fillStyle = (s.reward >= 50) ? '#5cd672' : (s.reward >= 20) ? '#c77dff' : (s.reward >= 10) ? '#2196f3' : '#a3232f';
        ctx.fillRect(s.x, SLOT_Y, s.w, SLOT_H);
        ctx.strokeStyle = '#1a0a14';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x, SLOT_Y, s.w, SLOT_H);
        ctx.fillStyle = '#fff8e7';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(s.label, s.x + s.w / 2, SLOT_Y + 20);
      }
      // separatori verticali tra slot (piccoli pioli a y=240)
      ctx.fillStyle = '#f4c430';
      for (let i = 1; i < SLOTS.length; i++) {
        const x = SLOTS[i].x;
        ctx.beginPath();
        ctx.arc(x, 245, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // pallina
      ctx.fillStyle = '#fff8e7';
      ctx.strokeStyle = '#1a0a14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    function step() {
      if (resolved) { rafId = 0; return; }
      // Se il popup è stato chiuso, ferma la simulazione (nessun premio)
      if (!document.body.contains(canvas)) { resolved = true; rafId = 0; return; }
      frames += 1;
      if (frames > MAX_FRAMES) {
        // Safety: fallback in slot più vicina
        resolveSlot();
        return;
      }

      // Fisica
      ball.vy += GRAVITY;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Pareti laterali
      if (ball.x - BALL_RADIUS < 0) {
        ball.x = BALL_RADIUS;
        ball.vx = Math.abs(ball.vx) * DAMPING;
      } else if (ball.x + BALL_RADIUS > canvas.width) {
        ball.x = canvas.width - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx) * DAMPING;
      }

      // Collisione pioli (riflessione vettoriale)
      for (let i = 0; i < PEGS.length; i++) {
        const p = PEGS[i];
        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const distSq = dx * dx + dy * dy;
        const minDist = BALL_RADIUS + PEG_RADIUS;
        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          // Riposiziona fuori dal piolo
          ball.x = p.x + nx * minDist;
          ball.y = p.y + ny * minDist;
          // Rifletti velocità
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx = (ball.vx - 2 * dot * nx) * DAMPING;
          ball.vy = (ball.vy - 2 * dot * ny) * DAMPING;
          // Aggiungi piccolo random per evitare loop
          ball.vx += (Math.random() - 0.5) * 0.4;
        }
      }

      // Raggiunto il fondo (zona slot)?
      if (ball.y + BALL_RADIUS >= SLOT_Y + 5) {
        resolveSlot();
        return;
      }

      drawScene();
      rafId = requestAnimationFrame(step);
    }

    function resolveSlot() {
      if (resolved) return;
      resolved = true;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      // Trova slot in base alla x della pallina
      let reward = 0;
      let label = '';
      for (let i = 0; i < SLOTS.length; i++) {
        const s = SLOTS[i];
        if (ball.x >= s.x && ball.x < s.x + s.w) {
          reward = s.reward;
          label = s.label;
          break;
        }
      }
      // Fallback (in caso di edge): lo slot più vicino
      if (reward === 0) {
        let best = SLOTS[0]; let bestD = Infinity;
        for (let i = 0; i < SLOTS.length; i++) {
          const s = SLOTS[i];
          const cx = s.x + s.w / 2;
          const d = Math.abs(ball.x - cx);
          if (d < bestD) { bestD = d; best = s; }
        }
        reward = best.reward; label = best.label;
      }
      drawScene();
      _mgAddDucats(reward);
      if (reward >= 50) _mgSfxJackpot();
      else _mgSfxCoin();
      if (status) status.textContent = t('mg.pachinko.statusWin', { n: label });
      try { toast(t('mg.pachinko.toast', { n: reward }), 'success'); } catch (e) {}
      if (typeof window.showGoldParticles === 'function' && reward >= 20) {
        try { window.showGoldParticles(reward >= 50 ? 16 : 8); } catch (e) {}
      }
    }

    drawScene();

    // Click sul canvas: lancia la pallina con un piccolo bias orizzontale
    canvas.addEventListener('click', (ev) => {
      if (dropped || resolved) return;
      const rect = canvas.getBoundingClientRect();
      const cx = ev.clientX - rect.left;
      // Mappa la posizione click → bias orizzontale iniziale
      const targetX = (cx / rect.width) * canvas.width;
      const dx = targetX - ball.x;
      ball.vx = Math.max(-3, Math.min(3, dx * 0.05));
      ball.vy = 0;
      dropped = true;
      if (status) status.textContent = t('mg.pachinko.statusFly');
      if (!rafId) rafId = requestAnimationFrame(step);
    });
  }, 0);
}

function wireSettings() {
  // Apri impostazioni dal menu
  const btnOpen = document.getElementById('btn-open-settings');
  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      switchScreen('screen-settings');
    });
  }

  // Indietro
  const btnBack = document.getElementById('btn-settings-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => switchScreen('screen-menu'));
  }

  // BGM volume
  const bgmSlider = document.getElementById('settings-bgm-vol');
  const bgmDisp = document.getElementById('settings-bgm-vol-display');
  if (bgmSlider) {
    bgmSlider.addEventListener('input', () => {
      const raw = Number(bgmSlider.value);
      const pct = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
      const vol = pct / 100;
      STATE.settings.musicVolume = vol;
      if (bgmDisp) bgmDisp.textContent = String(pct);
      if (window.SN_Audio && typeof window.SN_Audio.setMusicVolume === 'function') {
        try { window.SN_Audio.setMusicVolume(vol); } catch (e) {}
      }
      saveState();
    });
  }

  // SFX volume
  const sfxSlider = document.getElementById('settings-sfx-vol');
  const sfxDisp = document.getElementById('settings-sfx-vol-display');
  if (sfxSlider) {
    sfxSlider.addEventListener('input', () => {
      const raw = Number(sfxSlider.value);
      const pct = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
      const vol = pct / 100;
      STATE.settings.sfxVolume = vol;
      if (sfxDisp) sfxDisp.textContent = String(pct);
      if (window.SN_Audio && typeof window.SN_Audio.setSfxVolume === 'function') {
        try { window.SN_Audio.setSfxVolume(vol); } catch (e) {}
      }
      saveState();
    });
  }

  // Mute toggle
  const muteBtn = document.getElementById('btn-settings-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const wasOn = STATE.settings.sound !== false;
      const nowMuted = wasOn; // se prima era ON, ora silenziamo
      setMute(nowMuted);
      muteBtn.textContent = nowMuted ? ('🔇 ' + t('settings.mute')) : ('🔊 ' + t('settings.unmute'));
      muteBtn.classList.toggle('muted', nowMuted);
    });
  }

  // Cambia segno
  const btnZodiac = document.getElementById('btn-settings-change-zodiac');
  if (btnZodiac) {
    btnZodiac.addEventListener('click', () => switchScreen('screen-zodiac'));
  }

  // Reset salvataggio
  const btnReset = document.getElementById('btn-settings-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm(t('settings.resetWarning'))) {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        location.reload();
      }
    });
  }

  // Toggle lingua IT/EN
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  if (btnLangToggle) {
    btnLangToggle.addEventListener('click', () => {
      STATE.meta.lang = STATE.meta.lang === 'en' ? 'it' : 'en';
      applyLang();
      saveState();
    });
  }
}

function init() {
  loadState();

  // Sincronizza volumi audio con le impostazioni salvate (audio.js carica prima di STATE)
  if (window.SN_Audio) {
    try {
      SN_Audio.setMusicVolume(STATE.settings.musicVolume);
      SN_Audio.setSfxVolume(STATE.settings.sfxVolume);
    } catch (e) {}
  }

  // mute button stato iniziale
  setMute(!STATE.settings.sound);
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) muteBtn.addEventListener('click', () => setMute(STATE.settings.sound));

  // konami listener + word buffer (Fase 12 easter eggs)
  document.addEventListener('keydown', (ev) => {
    // Ignora input quando l'utente sta scrivendo in un campo editabile
    const tag = ev.target && ev.target.tagName;
    const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (ev.target && ev.target.isContentEditable);

    const k = (ev.key || '').toLowerCase();

    if (k === 'm' && !isEditable && !ev.repeat) {
      setMute(STATE.settings.sound);
      // non return: il buffer word/konami deve ricevere 'm' ugualmente
    }

    _konamiBuffer.push(k);
    if (_konamiBuffer.length > KONAMI.length) _konamiBuffer.shift();
    if (_konamiBuffer.length === KONAMI.length && _konamiBuffer.every((kk, i) => kk === KONAMI[i])) {
      _konamiBuffer = [];
      onKonami();
    }

    if (!isEditable) {
      _checkWordBuffer(k);
    }
  });

  // Suono globale su tutti i .btn-arcade (capture phase per intercettare prima
  // di qualsiasi stopPropagation nei moduli)
  document.addEventListener('click', function(ev) {
    const btn = ev.target && ev.target.closest('.btn-arcade');
    if (!btn) return;
    if (window.SN_Audio && typeof SN_Audio.sfxButtonClick === 'function') {
      try { SN_Audio.sfxButtonClick(); } catch (e) {}
    }
  }, true);

  wireNavigation();
  wireSettings();

  // routing iniziale
  if (!STATE.meta.zodiac) {
    switchScreen('screen-zodiac');
  } else {
    switchScreen('screen-menu');
  }

  // Inizializza Gennarino nel menu e nel game (game.js può sovrascrivere)
  if (window.Gennarino) {
    Gennarino.inject('gennarino-menu', 'idle', 90);
    Gennarino.inject('gennarino-game', 'idle', 60);
    Gennarino.startIdle();
  }

  // Inizializza Bonus (inietta bottoni slot/tombola nel footer dello shop)
  if (window.Bonus && typeof Bonus.init === 'function') Bonus.init();

  // Fase 14 — gentle hint per giocatori nuovi (solo se su screen-menu)
  if (!STATE.meta.tutorialDone && !STATE.currentRun) {
    setTimeout(() => {
      const menuActive = document.getElementById('screen-menu');
      if (!STATE.meta.tutorialDone && !STATE.currentRun && menuActive && menuActive.classList.contains('active')) {
        toast('Sei nuovo? Premi COME SI GIOCA! per iniziare', 'info');
      }
    }, 800);
  }

  // Applica traduzioni iniziali (data-i18n)
  try { applyLang(); } catch (e) {}
}

// esposizione globale per gli altri moduli
window.STATE = STATE;
window.switchScreen = switchScreen;
window.saveState = saveState;
window.loadState = loadState;
window.toast = toast;
window.popup = popup;
window.closePopup = closePopup;
window.t = t;
// Fase 12 — Easter eggs (esposizione per game.js e debug)
window.showMastroProfessore = showMastroProfessore;
window.onEasterEgg = onEasterEgg;
window.populateSettings = populateSettings;
window.populateCollection = populateCollection;
window.applyLang = applyLang;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
