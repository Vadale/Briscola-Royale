'use strict';

/* ============================================================
   BRISCOLA ROYALE — gennarino.js
   Mascotte "Gennarino 'O Gallo": render del widget, bubble
   di dialogo con effetto typewriter, reazioni a eventi di
   gioco, idle loop con frasi casuali.

   Dipendenze (defensive — funziona anche se non ancora carichi):
     - window.SPRITES.gennarino(emotion, size) -> stringa SVG
     - window.STRINGS.it.gennarino           -> array frasi base

   API pubblica:
     Gennarino.render(emotion, size)   -> string HTML
     Gennarino.inject(id, emotion, size)
     Gennarino.bubble(text, emotion?)
     Gennarino.react(event, customText?)
     Gennarino.say(event)              -> alias di react(event)
     Gennarino.dance()
     Gennarino.startIdle()
     Gennarino.stopIdle()

   Sicurezza:
     - nessun eval, nessun fetch/XHR
     - testo bubble inserito SOLO con textContent (no innerHTML)
     - SVG sprite: innerHTML solo per stringhe generate da SPRITES
   ============================================================ */

// ---------- Whitelist emozioni (deve combaciare con sprites.js) ----------
const _EMOTIONS_WHITELIST = [
  'idle', 'happy', 'sad', 'angry', 'shocked',
  'thinking', 'money', 'winking', 'dancing', 'sleeping'
];

// ---------- Frasi generiche extra (oltre a STRINGS.it.gennarino) ----------
const GENNARINO_LINES = [
  "Guagliò, m'arraccumann': nun te scurda' 'a coppa!",
  "'A vita è 'na partita 'e briscola: chi tene 'o tre vence.",
  "Aspè aspè, ca mò te faccio sentì io che è 'na mano bbona!",
  "Eh, 'sta carta è meglio 'e 'na pizza fritta!",
  "Guarda ccà, guarda llà... 'na sciorta accussì nun s'è mai vista!",
  "Mannaggi' 'a miseria, ce penzo ij!",
  "Statte zitto e tira 'sta carta, ca mò se vere!",
  "Hê visto? T'avev' 'itto ca era 'na mano d'oro!",
  "Vatt' a piglia' 'nu cafè, ca 'a partita è longa.",
  "Uagliò, mò te faccio fa' 'a faccia 'e cera!",
  "'O sai che t'aggia ric'? Stamm' a fa' bell'!",
  "Madonna 'e Pumpei, fammella scuppià 'sta combo!",
  "Statte cuieto, ca 'a partita s'arrevota a favore nuosto!",
  "Ué Gennarì, e che faie? Te miette pure a chiagnere?",
  "Pazziammo o facimm' overamente? Tira 'na carta tosta!",
  "Sant'Antonio mio, fammella vincere 'sta mano!",
  "Eh, m'aggio scurdato 'o giurnale 'ncopp 'a putrona...",
  "'O Munaciello stanotte ha riso assaie, segno bbuono.",
  "Vir' 'sta cresta? Comme 'a tengo bbona oggi!",
  "Statt' attiento ca ce sta 'o boss arret' 'a port'!",
];

// ---------- Frasi contestuali per evento ----------
const _LINES_EXTRA = {
  card_play: [
    "Eh, mo' se vere chi tene 'a mano!",
    "Tira tira, ca 'a coppa è ttoja!",
    "'Sta carta sape 'e vittoria, sient' a mme!",
    "Guagliò, calate 'a carta cu' 'a faccia tosta!",
    "Comme 'na lama, accussì cala!",
  ],
  card_select: [
    "Mh... famme penza' 'nu secondo.",
    "Chella o chell'ata? Aspè ca rifletto...",
    "Statte accuorto, nun te 'mbruglia'.",
    "Pensa buono guagliò, nun te sbaglia'.",
    "Strategia, strategia! Comme 'o generale!",
  ],
  high_score: [
    "MAMMA D' 'O CARMENE, CHE PUNTI!",
    "Ricco sfunnato, te staie facenno!",
    "'O numero d' 'a Smorfia te sta vicino!",
    "Madonna mia, m'aggio 'ngullato 'o cuore p' 'a felicità!",
    "Jackpot guagliò! Tien' 'a mano d'oro!",
  ],
  low_score: [
    "Embeh? Tutto ccà? Mannaggi'!",
    "'Sta mano fa schifo pure a 'o cane mio.",
    "Uagliò, ce vò 'na mossa, ce vò!",
    "Mannaggi' 'a marina, statte cchiù attiento!",
    "Pure 'o muort' faceva meglio 'e te mò!",
  ],
  win: [
    "EVVIVA! Avimm' vinciuto, paisà!",
    "T' 'o ricevo io, sì 'nu fenomeno!",
    "Mò 'o festeggiamm' cu' 'na sfogliatella!",
    "Vittoria! Gennarino è urgoglioso 'e te!",
    "Bravo guagliò, fai onore a Napule!",
  ],
  lose: [
    "Mannaggi'... ce vulev' 'na carta 'e cchiù.",
    "Aieri sera 'o Munaciello m'ha lasciato sulo...",
    "Eh va bbuò, 'a prossima vorta vincimm' nuie.",
    "Uagliò... 'sta vota è iuta storta storta.",
    "Sciagura! Nun ce credo manco ij...",
  ],
  boss_enter: [
    "Statte accuorto: chillu llà è 'nu mariuolo overo!",
    "'O boss è arrivato! Tira fuori 'e palle!",
    "Uagliò, mò se fa overamente sul serio!",
    "Mannaggia, 'o capoclan vò 'a partita...",
    "Stringi 'e diente, ca chist' è guaio grosso!",
  ],
  jackpot: [
    "JACKPOOOT! Madonna santissima!",
    "ME STO FACENNO 'A CASA NOVA!",
    "TRIPLO ORO! Aggio scuppiato 'o cervello!",
    "GUAGLIO', RICCO STAIE DIVENTANNO!",
    "M'AGGIO ARRICCHITO! M'AGGIO ARRICCHITO!",
  ],
  shop_open: [
    "Don Carmine te sta aspettann', cu 'na sciorta 'e cose!",
    "'A robba bbona costa, ricuordatello!",
    "Spendi cu giudizio, ca 'e ducati so' suriùsi.",
    "Vire si trovi 'na cosa toj 'mmiezo a sti scaffali.",
    "Uagliò, 'na mano 'e jolly nun fa male a nisciuno!",
  ],
  joker_buy: [
    "Bona scelta! Chistu jolly è 'nu fenomeno!",
    "Te sì pigliato 'a meglia 'e tutta 'a piazza!",
    "Bravo, mò 'a partita cagna culore!",
    "Don Carmine te vò bbene, t' 'ha rato 'o juste prezzo!",
    "Cu sta carta, manco 'o diavolo te ferma!",
  ],
  tarot_use: [
    "'O destino se cagna cu 'sta carta!",
    "Aspe' ca 'e stelle se mettono d'accordo...",
    "'A maga m'ha 'itto: chista è 'a mossa giusta!",
    "Mhm... 'e tarocchi parlano chiaro chiaro.",
    "Carta 'e cartiglia, miracolo 'e Sanguglia!",
  ],
  tombola: [
    "TOMBOLAAAAAA! Nonna, ce simm' arricchiti!",
    "'O 90! 'A paura overa!",
    "'O 25! Natale 'mmiezz' 'o cazz!",
    "Madonna! 'O numero giusto è asciuto!",
    "Cinquina! E che ce sta 'mmiezz', 'a tombola sana!",
  ],
  // ===== Fase 11 — microcopy momenti chiave =====
  onPlay: [
    "Ué, 'a mano è fatta!",
    "'O professore ha parlato!",
    "Chest'è 'na mossa 'e Maradona!",
    "Tac! L'aggio calata buona!",
    "Vir' 'o capolavoro, guagliò!",
  ],
  onWin: [
    "MAMMA MIA CHE TURNO!",
    "Gennarino nun perde maje!",
    "Sei nu fenomeno, guagliò!",
    "'Sta partita t' 'a sì arrubbata!",
    "Avimmo vinciuto a culpi 'e genio!",
  ],
  onLose: [
    "Madonna, nun ci credo...",
    "Ma comme è possibile?!",
    "'O destino è 'na lenza...",
    "Mannaggi' 'a marina, m'è fernuta 'a sciorta!",
    "Pure San Gennaro s'è giratu 'a faccia...",
  ],
  onJoker: [
    "Chest'è oro colato!",
    "Nun 'o dare a nisciuno!",
    "Il Mazzetto del destino!",
    "Cu chistu jolly, manco 'o diavolo te ferma!",
    "Don Carmine t'ha trattato cu' 'e guanti!",
  ],
  onCombo: [
    "NAPOLETANA! 'O miracolo!",
    "SCOPA REALE! Gesù!",
    "Tris di carichi — hai il tocco di San Gennaro!",
    "COMBO 'E MUOLLECONE! Aggio sturduto!",
    "Maronn' 'e Pumpei, che cumbinazione!",
  ],
  // ===== Fase 12 — Easter eggs =====
  mastroProf: [
    "CHEST'E 'NU MIRACOLO!",
    "IL MAESTRO HA PARLATO!",
    "PROFESSORE DI VITA!",
    "MASTRO PROFESSORE OVERAMENTE!",
    "Te l'aggio 'itto: tu si' nu genio!",
  ],
  pizza: [
    "Mò 'e carte sanno 'e mozzarella e basilico!",
    "Margherita, marinara, briscola fritta!",
    "'Sta mano è cchiu' bbona 'e 'na pizza a portafoglio!",
  ],
  fantozzi: [
    "La corazzata Potemkin... 'na cagata pazzesca!",
    "Ragionier Fantozzi, comm' a vuje guagliò!",
    "92 minuti di applausi per chella mano!",
  ],
  baggio: [
    "'O rigore 'e Baggio... 'a luna se l'è pigliato.",
    "USA '94, lacrime 'ncoppe 'a maglia.",
    "Codino 'e core spezzato...",
  ],
  totti: [
    "JE SO' PAZZO! 'O capitano!",
    "Er Pupone te benedice, paisà!",
    "Semos tutti contenti, guagliò!",
  ],
  maancheno: [
    "MA. ANCHE. NO.",
    "'O popolo italiano ha parlato.",
    "Annulla tutto e fatte 'nu caffè.",
  ],
  allegria: [
    "ALLEGRIAAA! Mike Bongiorno overamente!",
    "Lascia o raddoppia, guagliò?",
    "Concorrente, sta' attiento!",
  ],
};

// ---------- Mappa eventi -> emozione ----------
const _EV_EMOTION = {
  card_play: 'happy',
  card_select: 'thinking',
  high_score: 'money',
  low_score: 'sad',
  win: 'happy',
  lose: 'sad',
  boss_enter: 'angry',
  jackpot: 'shocked',
  shop_open: 'money',
  joker_buy: 'happy',
  tarot_use: 'thinking',
  tombola: 'shocked',
  idle: 'idle',
  dancing: 'dancing',
  // Fase 11
  onPlay: 'happy',
  onWin: 'happy',
  onLose: 'sad',
  onJoker: 'money',
  onCombo: 'shocked',
  // Fase 12 easter eggs
  mastroProf: 'shocked',
  pizza: 'happy',
  fantozzi: 'sad',
  baggio: 'sad',
  totti: 'money',
  maancheno: 'angry',
  allegria: 'happy',
};

// ---------- Stato modulo ----------
let _bubbleTimer = null;   // setTimeout per il typewriter (un solo char alla volta)
let _bubbleHide  = null;   // setTimeout per nascondere la bubble
let _idleTimer = null;     // setTimeout ricorsivo per l'idle loop
let _danceTimer   = null;  // setTimeout per revert post-dance

// ---------- Helpers privati ----------
function _safeEmotion(emotion) {
  if (!emotion || typeof emotion !== 'string') return 'idle';
  if (!_EMOTIONS_WHITELIST.includes(emotion)) return 'idle';
  return emotion;
}

function _animClassFor(emotion) {
  if (emotion === 'dancing') return 'anim-dance';
  if (emotion === 'shocked' || emotion === 'angry') return 'anim-shake';
  if (emotion === 'happy') return 'anim-bounce';
  return 'anim-breathe';
}

function _getSpriteSvg(emotion, size) {
  if (window.SPRITES && typeof window.SPRITES.gennarino === 'function') {
    try {
      return window.SPRITES.gennarino(emotion, size);
    } catch (e) {
      console.warn('[Gennarino] sprite render failed', e);
      return '';
    }
  }
  return '';
}

function _allGenericLines() {
  const base = (window.STRINGS && window.STRINGS.it && Array.isArray(window.STRINGS.it.gennarino))
    ? window.STRINGS.it.gennarino
    : [];
  return base.concat(GENNARINO_LINES);
}

function _pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function _findActiveWidget() {
  // priorità: widget dentro lo .screen attivo
  const inActive = document.querySelector('.screen.active .gennarino-widget');
  if (inActive) return inActive;
  // fallback: primo widget in pagina
  return document.querySelector('.gennarino-widget');
}

function _updateSprite(widget, emotion) {
  if (!widget) return;
  const safe = _safeEmotion(emotion);
  widget.setAttribute('data-emotion', safe);
  const spriteDiv = widget.querySelector('.gennarino-sprite');
  if (!spriteDiv) return;
  const animClass = _animClassFor(safe);
  // Rimuovi le classi anim prima di aggiungere la nuova per forzare replay
  spriteDiv.classList.remove('anim-breathe', 'anim-bounce', 'anim-shake', 'anim-dance');
  void spriteDiv.offsetWidth; // forza reflow per triggerare nuovamente l'animazione
  spriteDiv.classList.add(animClass);
  // SVG generato internamente da SPRITES (trusted): innerHTML è ok qui
  spriteDiv.innerHTML = _getSpriteSvg(safe, spriteDiv.dataset.size ? parseInt(spriteDiv.dataset.size, 10) : 64);
}

function _clearBubbleTimers() {
  if (_bubbleTimer) { clearTimeout(_bubbleTimer); _bubbleTimer = null; }
  if (_bubbleHide)  { clearTimeout(_bubbleHide);  _bubbleHide  = null; }
}

// ---------- API pubblica ----------
const Gennarino = {

  render(emotion, size) {
    const safe = _safeEmotion(emotion);
    const sz = (typeof size === 'number' && size > 0) ? size : 64;
    const animClass = _animClassFor(safe);
    const svgStr = _getSpriteSvg(safe, sz);
    return (
      '<div class="gennarino-widget" data-emotion="' + safe + '">' +
        '<div class="gennarino-bubble" role="status" aria-live="polite"></div>' +
        '<div class="gennarino-sprite ' + animClass + '" data-size="' + sz + '">' + svgStr + '</div>' +
      '</div>'
    );
  },

  inject(containerId, emotion, size) {
    if (!containerId) return;
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = Gennarino.render(emotion, size);
  },

  bubble(text, emotion) {
    if (text == null) return;
    const str = String(text);
    const widget = _findActiveWidget();
    if (!widget) return;

    // aggiorna sprite se richiesta una nuova emozione
    if (emotion) _updateSprite(widget, emotion);

    const bubbleEl = widget.querySelector('.gennarino-bubble');
    if (!bubbleEl) return;

    // cancella eventuale typewriter/hide in corso
    _clearBubbleTimers();

    // Posizionamento fixed con clamp al viewport (evita overflow)
    const spriteEl = widget.querySelector('.gennarino-sprite') || widget;
    const rect = spriteEl.getBoundingClientRect();
    const bW = 200; const bH = 80; const margin = 8;
    let bLeft = rect.left + rect.width / 2 - bW / 2;
    let bTop  = rect.top - bH - 14; // preferibilmente sopra
    bLeft = Math.max(margin, Math.min(bLeft, window.innerWidth  - bW - margin));
    if (bTop < margin) bTop = rect.bottom + 10; // se esce in alto → metti sotto
    bTop = Math.min(bTop, window.innerHeight - bH - margin);
    bubbleEl.style.left = bLeft + 'px';
    bubbleEl.style.top  = bTop  + 'px';

    // reset & visibilità
    bubbleEl.textContent = '';
    bubbleEl.classList.add('active');

    // typewriter: 1 char ogni 28ms via setTimeout ricorsivo
    let i = 0;
    const step = function () {
      if (i >= str.length) {
        _bubbleTimer = null;
        // dopo 3500ms dalla fine, nascondi
        _bubbleHide = setTimeout(() => {
          bubbleEl.classList.remove('active');
          bubbleEl.textContent = '';
          _bubbleHide = null;
        }, 3500);
        return;
      }
      // textContent += è sicuro contro XSS (no parsing HTML)
      bubbleEl.textContent += str.charAt(i);
      i++;
      _bubbleTimer = setTimeout(step, 28);
    };
    step();
  },

  react(event, customText) {
    const evKey = (typeof event === 'string') ? event : 'idle';
    const emotion = _EV_EMOTION[evKey] || 'idle';
    let text;
    if (typeof customText === 'string' && customText.length > 0) {
      text = customText;
    } else {
      const evLines = _LINES_EXTRA[evKey];
      const fromEvent = _pickRandom(evLines);
      if (fromEvent) {
        text = fromEvent;
      } else {
        const fromGeneric = _pickRandom(_allGenericLines());
        text = fromGeneric || "Ué guagliò!";
      }
    }
    Gennarino.bubble(text, emotion);
  },

  say(event) {
    Gennarino.react(event);
  },

  dance() {
    const widget = _findActiveWidget();
    if (!widget) return;
    _updateSprite(widget, 'dancing');
    if (_danceTimer) { clearTimeout(_danceTimer); _danceTimer = null; }
    _danceTimer = setTimeout(() => {
      _danceTimer = null;
      if (!document.body.contains(widget)) return;
      _updateSprite(widget, 'happy');
    }, 2000);
  },

  startIdle() {
    Gennarino.stopIdle();
    function _scheduleIdle() {
      _idleTimer = setTimeout(() => {
        _idleTimer = null;
        // probabilità 0.35 di parlare
        if (Math.random() < 0.35) {
          const phrase = _pickRandom(_allGenericLines());
          if (phrase) Gennarino.bubble(phrase, 'idle');
        }
        _scheduleIdle();
      }, 9000);
    }
    _scheduleIdle();
  },

  stopIdle() {
    if (_idleTimer) {
      clearTimeout(_idleTimer);
      _idleTimer = null;
    }
  },
};

// ---------- Esposizione globale ----------
window.Gennarino = Gennarino;
window.GENNARINO_LINES = GENNARINO_LINES;
