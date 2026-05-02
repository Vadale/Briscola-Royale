'use strict';

/* ============================================================
   BRISCOLA ROYALE — sprites.js
   Sistema grafico SVG inline.
   Pixel art definita, palette viva, atmosfera bisca cafona.
   Nessuna dipendenza esterna. Ogni funzione ritorna stringa SVG.
   ============================================================ */

const _SEMI = ['bastoni','coppe','denari','spade'];
const _VALORI = [1,2,3,4,5,6,7,'fante','cavallo','re'];
const _EMOTIONS = ['idle','happy','sad','angry','shocked','thinking','money','winking','dancing','sleeping'];
const _SYMBOLS = ['cherry','lemon','bell','coin','seven','star','diamond'];
const _RARITIES = ['common','uncommon','rare','legendary'];

// Escape caratteri speciali HTML/SVG nei valori interpolati nel markup
function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

const SPRITES = {};
window.SPRITES = SPRITES;

/* ============================================================
   PALETTE COMUNE
   ============================================================ */
SPRITES.C = {
  verde:    '#1a8a3e',
  verdeS:   '#0f3320',
  oro:      '#f4c430',
  oroS:     '#d4a017',
  ottone:   '#b8860b',
  rosso:    '#e63946',
  rossoS:   '#a3232f',
  viola:    '#c77dff',
  violaS:   '#7b2cbf',
  azzurro:  '#2196f3',
  azzurroS: '#1565c0',
  rosa:     '#ff6ec7',
  nero:     '#1a0a14',
  bianco:   '#fff8e7',
  pelle:    '#FDBCB4',
  marrone:  '#8B4513',
  marroneS: '#6B3410',
  giallo:   '#FFD700',
  capelli:  '#1a0a14',
  pantaloni:'#1a4d2e',
  grigio:   '#9e9e9e',
  grigioS:  '#616161',
  verde2:   '#4caf50'
};

/* Helper interno: dimensioni in pixel per size */
SPRITES._sz = function(size) {
  if (size === 'sm') return { w: 55,  h: 82  };
  if (size === 'lg') return { w: 100, h: 150 };
  return { w: 70, h: 105 };
};

/* Helper: label valore per ribbon */
SPRITES._valLabel = function(v) {
  const map = {
    1:'ASSO', 2:'DUE', 3:'TRE', 4:'QUATTRO',
    5:'CINQUE', 6:'SEI', 7:'SETTE',
    fante:'FANTE', cavallo:'CAVALLO', re:'RE'
  };
  return map[v] || String(v).toUpperCase();
};

/* Helper: numero corner (basso-sx) — figure usano J/C/R */
SPRITES._cornerLabel = function(v) {
  if (v === 'fante') return 'J';
  if (v === 'cavallo') return 'C';
  if (v === 're') return 'R';
  return String(v);
};

/* ============================================================
   1) CARTA NAPOLETANA
   ============================================================ */
SPRITES.card = function(seme, valore, opts) {
  opts = opts || {};
  const selected = !!opts.selected;
  const size = opts.size || 'md';
  if (!_SEMI.includes(seme)) seme = 'bastoni';
  if (!_VALORI.includes(valore)) valore = 1;
  const dim = SPRITES._sz(size);

  const C = SPRITES.C;
  const label = SPRITES._valLabel(valore);
  const corner = SPRITES._cornerLabel(valore);

  // Simboli al centro per 1-7 / figure
  let centerArt = '';
  if (typeof valore === 'number' && valore >= 1 && valore <= 7) {
    centerArt = SPRITES._cardPips(seme, valore);
  } else if (valore === 'fante') {
    centerArt = SPRITES._figFante(seme);
  } else if (valore === 'cavallo') {
    centerArt = SPRITES._figCavallo(seme);
  } else if (valore === 're') {
    centerArt = SPRITES._figRe(seme);
  }

  const filterAttr = selected
    ? ' filter="drop-shadow(0 0 6px #f4c430)"'
    : '';
  const cls = 'card-svg' + (selected ? ' selected' : '');

  // Font-size ribbon adattivo a label length
  const ribbonFs = label.length > 6 ? 7 : 9;

  // Indici angolari (numero+mini-seme) come una vera carta da gioco.
  // Top-left a x~7, y~24-32. Bottom-right ruotato 180 attorno al centro carta.
  const cornerIndex = `
    <g>
      <text x="7" y="24" text-anchor="middle" font-family="monospace"
            font-size="7" font-weight="bold" fill="${C.nero}">${corner}</text>
      ${SPRITES._miniSuit(seme, 7, 31)}
    </g>
    <g transform="rotate(180 35 52.5)">
      <text x="7" y="24" text-anchor="middle" font-family="monospace"
            font-size="7" font-weight="bold" fill="${C.nero}">${corner}</text>
      ${SPRITES._miniSuit(seme, 7, 31)}
    </g>
  `;

  return `
<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" data-seme="${seme}" data-val="${valore}"
     viewBox="0 0 70 105" width="${dim.w}" height="${dim.h}"${filterAttr}>
  <!-- bordo ottone esterno -->
  <rect x="0.5" y="0.5" width="69" height="104" rx="5" ry="5"
        fill="${C.bianco}" stroke="${C.oroS}" stroke-width="3"/>
  <rect x="2"   y="2"   width="66" height="101" rx="4" ry="4"
        fill="${C.bianco}" stroke="${C.oro}" stroke-width="1"/>
  <!-- ribbon dorato -->
  <rect x="3" y="3" width="64" height="15" rx="2" ry="2"
        fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.5"/>
  <rect x="3" y="3" width="64" height="3" fill="${C.oro}" opacity="0.7"/>
  <text x="35" y="14" text-anchor="middle"
        font-family="monospace" font-size="${ribbonFs}" font-weight="bold"
        fill="${C.bianco}" stroke="${C.nero}" stroke-width="0.4"
        letter-spacing="0.5">${label}</text>
  <!-- area centrale (y=22 a y=84) -->
  <g>${centerArt}</g>
  <!-- 4-corner index (top-left + bottom-right ruotato) -->
  ${cornerIndex}
</svg>`.trim();
};

/* mini icona seme (per angolo) — vera forma minuta del seme */
SPRITES._miniSuit = function(seme, cx, cy) {
  const C = SPRITES.C;

  if (seme === 'bastoni') {
    // bastoncino verticale con un nodo centrale
    return `
      <g>
        <rect x="${cx-1}" y="${cy-3.5}" width="2" height="7"
              fill="${C.marrone}" stroke="${C.nero}" stroke-width="0.3"/>
        <ellipse cx="${cx}" cy="${cy}" rx="1.6" ry="1.1"
                 fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.25"/>
      </g>`;
  }

  if (seme === 'coppe') {
    // mini-calice: U-shape
    return `
      <g>
        <path d="M ${cx-2} ${cy-2.5} L ${cx-2} ${cy} Q ${cx} ${cy+2} ${cx+2} ${cy} L ${cx+2} ${cy-2.5} Z"
              fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.3"/>
        <rect x="${cx-0.5}" y="${cy+1.8}" width="1" height="1.6" fill="${C.rossoS}"/>
        <rect x="${cx-1.6}" y="${cy+3}" width="3.2" height="0.9"
              fill="${C.rossoS}" stroke="${C.nero}" stroke-width="0.25"/>
      </g>`;
  }

  if (seme === 'denari') {
    // mini-moneta
    return `
      <g>
        <circle cx="${cx}" cy="${cy}" r="3"
                fill="${C.oro}" stroke="${C.oroS}" stroke-width="0.5"/>
        <circle cx="${cx}" cy="${cy}" r="1.3"
                fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.25"/>
      </g>`;
  }

  if (seme === 'spade') {
    // mini-spada: triangolo punta-su + crossguard accennato
    return `
      <g>
        <polygon points="${cx},${cy-3} ${cx-2},${cy+2} ${cx+2},${cy+2}"
                 fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.3"/>
        <rect x="${cx-2}" y="${cy+2}" width="4" height="0.9"
              fill="${C.azzurroS}" stroke="${C.nero}" stroke-width="0.25"/>
      </g>`;
  }

  // fallback
  return `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${C.nero}"/>`;
};

/* ---------- SIMBOLI SEMI (path-based, dettagliati) ---------- */
SPRITES._suitSymbol = function(seme, cx, cy, scale) {
  scale = scale || 1;
  const C = SPRITES.C;
  const s = scale;

  if (seme === 'bastoni') {
    // Bastone tornito: corpo affusolato, 3 nodi/bulbi, venatura centrale
    const halfH = 11 * s;
    const topW = 2.2 * s;
    const midW = 3 * s;
    const botW = 2.6 * s;
    const yTop = cy - halfH;
    const yBot = cy + halfH;
    return `
      <g>
        <path d="M ${cx-topW} ${yTop}
                 C ${cx-topW-0.6*s} ${cy-halfH*0.5}, ${cx-midW} ${cy-halfH*0.2}, ${cx-midW} ${cy}
                 C ${cx-midW} ${cy+halfH*0.4}, ${cx-botW} ${cy+halfH*0.7}, ${cx-botW*0.7} ${yBot}
                 L ${cx+botW*0.7} ${yBot}
                 C ${cx+botW} ${cy+halfH*0.7}, ${cx+midW} ${cy+halfH*0.4}, ${cx+midW} ${cy}
                 C ${cx+midW} ${cy-halfH*0.2}, ${cx+topW+0.6*s} ${cy-halfH*0.5}, ${cx+topW} ${yTop}
                 Z"
              fill="${C.marrone}" stroke="${C.nero}" stroke-width="0.5"/>
        <line x1="${cx}" y1="${yTop+0.8*s}" x2="${cx}" y2="${yBot-0.8*s}"
              stroke="${C.marroneS}" stroke-width="0.4" opacity="0.7"/>
        <ellipse cx="${cx}" cy="${cy-halfH*0.55}" rx="${1.6*s}" ry="${1.1*s}"
                 fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.4"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${2*s}" ry="${1.3*s}"
                 fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.4"/>
        <ellipse cx="${cx}" cy="${cy+halfH*0.55}" rx="${1.7*s}" ry="${1.1*s}"
                 fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.4"/>
        <ellipse cx="${cx-topW*0.4}" cy="${cy-halfH*0.55}" rx="${0.5*s}" ry="${0.3*s}"
                 fill="${C.bianco}" opacity="0.5"/>
      </g>
    `;
  }

  if (seme === 'coppe') {
    // Calice: bowl Q-curva, stelo, base svasata, riflesso interno
    const bowlW = 11 * s;
    const bowlH = 8 * s;
    const yTop = cy - 8 * s;
    const stemY = yTop + bowlH;
    const baseY = stemY + 3 * s;
    const baseW = 9 * s;
    return `
      <g>
        <!-- bowl -->
        <path d="M ${cx-bowlW/2} ${yTop}
                 Q ${cx-bowlW/2 - 0.4*s} ${yTop+bowlH*0.6}, ${cx-bowlW*0.18} ${stemY}
                 L ${cx+bowlW*0.18} ${stemY}
                 Q ${cx+bowlW/2 + 0.4*s} ${yTop+bowlH*0.6}, ${cx+bowlW/2} ${yTop}
                 Z"
              fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
        <!-- bordo dorato superiore -->
        <rect x="${cx-bowlW/2}" y="${yTop}" width="${bowlW}" height="${1.2*s}"
              fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
        <!-- riflesso bowl interno -->
        <path d="M ${cx-bowlW*0.32} ${yTop+1.6*s}
                 Q ${cx-bowlW*0.42} ${yTop+bowlH*0.55}, ${cx-bowlW*0.1} ${yTop+bowlH*0.78}"
              stroke="${C.rosa}" stroke-width="${0.9*s}" fill="none" opacity="0.7" stroke-linecap="round"/>
        <!-- stelo -->
        <rect x="${cx-1*s}" y="${stemY}" width="${2*s}" height="${3*s}"
              fill="${C.rossoS}" stroke="${C.nero}" stroke-width="0.4"/>
        <!-- nodo metà stelo -->
        <ellipse cx="${cx}" cy="${stemY+1.5*s}" rx="${1.6*s}" ry="${0.7*s}"
                 fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.3"/>
        <!-- base svasata -->
        <path d="M ${cx-baseW/2} ${baseY+1.6*s}
                 Q ${cx-baseW*0.2} ${baseY-0.2*s}, ${cx-baseW*0.2} ${baseY-0.4*s}
                 L ${cx+baseW*0.2} ${baseY-0.4*s}
                 Q ${cx+baseW*0.2} ${baseY-0.2*s}, ${cx+baseW/2} ${baseY+1.6*s}
                 Z"
              fill="${C.rossoS}" stroke="${C.nero}" stroke-width="0.5"/>
      </g>
    `;
  }

  if (seme === 'denari') {
    // Moneta: cerchio esterno + ring scuro + 8 raggi + centro + highlight
    const r = 9 * s;
    const rIn = 6.2 * s;
    const rCore = 2.6 * s;
    // 8 raggi tra rIn e r
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI / 4) + Math.PI / 8;
      const x1 = cx + Math.cos(a) * (rIn + 0.2 * s);
      const y1 = cy + Math.sin(a) * (rIn + 0.2 * s);
      const x2 = cx + Math.cos(a) * (r - 0.6 * s);
      const y2 = cy + Math.sin(a) * (r - 0.6 * s);
      rays += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.oroS}" stroke-width="${0.6*s}" stroke-linecap="round"/>`;
    }
    return `
      <g>
        <circle cx="${cx}" cy="${cy}" r="${r}"
                fill="${C.oro}" stroke="${C.oroS}" stroke-width="${1.2*s}"/>
        <circle cx="${cx}" cy="${cy}" r="${rIn}"
                fill="none" stroke="${C.oroS}" stroke-width="${0.8*s}"/>
        ${rays}
        <circle cx="${cx}" cy="${cy}" r="${rCore}"
                fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.4"/>
        <circle cx="${cx}" cy="${cy}" r="${rCore*0.45}"
                fill="${C.oro}"/>
        <ellipse cx="${cx-r*0.45}" cy="${cy-r*0.45}" rx="${1.6*s}" ry="${0.9*s}"
                 fill="${C.bianco}" opacity="0.55"/>
      </g>
    `;
  }

  if (seme === 'spade') {
    // Spada: lama triangolare con fuller, crossguard con palline, grip, pommel
    const bladeH = 12 * s;
    const bladeW = 5 * s;
    const yTip = cy - 9 * s;
    const yGuard = yTip + bladeH;
    const yGripBot = yGuard + 4.5 * s;
    return `
      <g>
        <!-- lama -->
        <polygon points="${cx},${yTip} ${cx-bladeW/2},${yGuard} ${cx+bladeW/2},${yGuard}"
                 fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.5"/>
        <!-- fuller / scanalatura -->
        <line x1="${cx}" y1="${yTip+1.2*s}" x2="${cx}" y2="${yGuard-0.6*s}"
              stroke="${C.azzurroS}" stroke-width="0.5" opacity="0.85"/>
        <!-- highlight lama -->
        <line x1="${cx-0.9*s}" y1="${yTip+2*s}" x2="${cx-1.6*s}" y2="${yGuard-1.5*s}"
              stroke="${C.bianco}" stroke-width="0.4" opacity="0.55"/>
        <!-- crossguard -->
        <rect x="${cx-7*s}" y="${yGuard-0.5*s}" width="${14*s}" height="${1.8*s}"
              fill="${C.azzurroS}" stroke="${C.nero}" stroke-width="0.5"/>
        <circle cx="${cx-7*s}" cy="${yGuard+0.4*s}" r="${1*s}"
                fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
        <circle cx="${cx+7*s}" cy="${yGuard+0.4*s}" r="${1*s}"
                fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
        <!-- grip -->
        <rect x="${cx-1.4*s}" y="${yGuard+1.4*s}" width="${2.8*s}" height="${4*s}"
              fill="${C.marrone}" stroke="${C.nero}" stroke-width="0.4"/>
        <line x1="${cx-1.4*s}" y1="${yGuard+2.6*s}" x2="${cx+1.4*s}" y2="${yGuard+2.6*s}"
              stroke="${C.marroneS}" stroke-width="0.4"/>
        <line x1="${cx-1.4*s}" y1="${yGuard+4*s}" x2="${cx+1.4*s}" y2="${yGuard+4*s}"
              stroke="${C.marroneS}" stroke-width="0.4"/>
        <!-- pommel -->
        <circle cx="${cx}" cy="${yGripBot+0.6*s}" r="${1.6*s}"
                fill="${C.oro}" stroke="${C.nero}" stroke-width="0.5"/>
      </g>
    `;
  }
  return '';
};

/* ---------- DISPOSIZIONE PIPS 1..7 ---------- */
SPRITES._cardPips = function(seme, n) {
  // area centrale: x 6..64, y 22..84  (centro 35, 53)
  const cx = 35, cyTop = 32, cyMid = 53, cyBot = 74;
  const xL = 18, xR = 52;

  // posizioni per ogni numero
  const positions = {
    1: [[35, 53, 1.4]],
    2: [[35, 32, 1], [35, 74, 1]],
    3: [[35, 32, 1], [22, 70, 1], [48, 70, 1]],
    4: [[xL, cyTop, 0.9], [xR, cyTop, 0.9], [xL, cyBot, 0.9], [xR, cyBot, 0.9]],
    5: [[xL, cyTop, 0.85], [xR, cyTop, 0.85], [cx, cyMid, 1.0],
        [xL, cyBot, 0.85], [xR, cyBot, 0.85]],
    6: [[xL, cyTop, 0.8], [xR, cyTop, 0.8], [xL, cyMid, 0.8],
        [xR, cyMid, 0.8], [xL, cyBot, 0.8], [xR, cyBot, 0.8]],
    7: [[cx, 27, 0.8],
        [xL, 38, 0.8], [xR, 38, 0.8],
        [cx, 53, 0.8],
        [xL, 68, 0.8], [xR, 68, 0.8],
        [cx, 79, 0.8]]
  };

  const list = positions[n] || [];
  return list.map(([x, y, sc]) =>
    `<g>${SPRITES._suitSymbol(seme, x, y, sc)}</g>`
  ).join('');
};

/* ============================================================
   FIGURE: pixel art con rect (16 col x 28 righe area centrale)
   Origine area centrale: x=10, y=22 — pxW=3, pxH=2.2
   ============================================================ */

/* Helper: riempi una matrice di rect in scala */
SPRITES._pix = function(rows, originX, originY, pxW, pxH, palette) {
  // rows: array di stringhe; ogni char è una key in palette o ' '/'.' = vuoto
  let out = '';
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const k = row[c];
      if (k === ' ' || k === '.' || !palette[k]) continue;
      const x = originX + c * pxW;
      const y = originY + r * pxH;
      out += `<rect x="${x}" y="${y}" width="${pxW}" height="${pxH}" fill="${palette[k]}"/>`;
    }
  }
  return out;
};

/* Helper: lighten/darken (versione semplice) — usato per palette runtime */
SPRITES._shade = function(hex, amt) {
  // hex es. "#aabbcc" o "#abc"
  let h = hex.replace('#','');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = Math.max(0, Math.min(255, parseInt(h.slice(0,2),16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(h.slice(2,4),16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(h.slice(4,6),16) + amt));
  const toHex = (n) => n.toString(16).padStart(2,'0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
};

/* ---------- Helper: simbolo tenuto in mano dal Fante (lato destro, piccolo) ---------- */
SPRITES._figEmblem = function(seme, cx, cy) {
  const C = SPRITES.C;
  const s = 5; // scala simbolo
  if (seme === 'bastoni') {
    // bastone verticale con nodi
    return `<rect x="${cx-1}" y="${cy-s*2}" width="2.5" height="${s*5}" fill="${C.marrone}" stroke="${C.nero}" stroke-width="0.5"/>
            <circle cx="${cx}" cy="${cy-s}" r="2.2" fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.4"/>
            <circle cx="${cx}" cy="${cy+s}" r="2.2" fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.4"/>`;
  }
  if (seme === 'coppe') {
    // calice piccolo
    return `<rect x="${cx-4}" y="${cy-s*2}" width="8" height="${s*2}" rx="1" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
            <rect x="${cx-1}" y="${cy}" width="2" height="${s}" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
            <rect x="${cx-3}" y="${cy+s}" width="6" height="1.5" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>`;
  }
  if (seme === 'denari') {
    // moneta
    return `<circle cx="${cx}" cy="${cy}" r="${s}" fill="${C.oro}" stroke="${C.oroS}" stroke-width="1.5"/>
            <circle cx="${cx}" cy="${cy}" r="${s*0.55}" fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.3"/>
            <text x="${cx}" y="${cy+1.5}" text-anchor="middle" font-size="5" font-family="monospace" font-weight="bold" fill="${C.nero}">$</text>`;
  }
  if (seme === 'spade') {
    // spadina
    return `<rect x="${cx-1}" y="${cy-s*2.5}" width="2" height="${s*3}" fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.5"/>
            <polygon points="${cx},${cy-s*2.5} ${cx-2},${cy-s*1.5} ${cx+2},${cy-s*1.5}" fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.4"/>
            <rect x="${cx-4}" y="${cy+s*0.5}" width="8" height="1.5" fill="#1565c0" stroke="${C.nero}" stroke-width="0.4"/>
            <rect x="${cx-1}" y="${cy+s*0.5}" width="2" height="${s}" fill="${C.marrone}" stroke="${C.nero}" stroke-width="0.4"/>`;
  }
  return '';
};

/* ---------- Helper: arma/insegna del Cavaliere ---------- */
SPRITES._figWeapon = function(seme) {
  const C = SPRITES.C;
  if (seme === 'bastoni') {
    // lancia = bastone lungo diagonale
    return `<line x1="48" y1="26" x2="64" y2="58" stroke="${C.marrone}" stroke-width="3" stroke-linecap="round"/>
            <circle cx="48" cy="26" r="3" fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.5"/>`;
  }
  if (seme === 'coppe') {
    // stendardo con coppa
    return `<line x1="52" y1="24" x2="52" y2="50" stroke="${C.oro}" stroke-width="2"/>
            <rect x="46" y="22" width="12" height="8" rx="1" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
            <circle cx="52" cy="26" r="2.5" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>`;
  }
  if (seme === 'denari') {
    // scudo con moneta
    return `<polygon points="52,22 60,28 60,38 52,44 44,38 44,28" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.6"/>
            <circle cx="52" cy="33" r="5" fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.4"/>
            <text x="52" y="35.5" text-anchor="middle" font-size="6" font-family="monospace" font-weight="bold" fill="${C.nero}">$</text>`;
  }
  // spade → spada lunga diagonale
  return `<line x1="48" y1="26" x2="63" y2="56" stroke="${C.azzurro}" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="48,26 46,22 52,24" fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.4"/>
          <rect x="44" y="44" width="9" height="2" fill="${C.marrone}" stroke="${C.nero}" stroke-width="0.4" transform="rotate(58 44 44)"/>`;
};

/* ---------- Helper: scettro del Re ---------- */
SPRITES._figScepter = function(seme) {
  const C = SPRITES.C;
  const x = 56, yTop = 36, yBot = 72;
  if (seme === 'bastoni') {
    // bastone nodoso
    return `<rect x="${x-1}" y="${yTop+2}" width="2.5" height="${yBot-yTop}" fill="${C.marrone}" stroke="${C.nero}" stroke-width="0.4"/>
            <circle cx="${x}" cy="${yTop+6}" r="3" fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.5"/>
            <circle cx="${x}" cy="${yTop+16}" r="2.5" fill="${C.marroneS}" stroke="${C.nero}" stroke-width="0.4"/>`;
  }
  if (seme === 'coppe') {
    // scettro con coppa in cima
    return `<rect x="${x-1}" y="${yTop+8}" width="2" height="${yBot-yTop-4}" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
            <rect x="${x-5}" y="${yTop}" width="10" height="7" rx="1" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
            <rect x="${x-2}" y="${yTop+7}" width="4" height="3" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.3"/>
            <rect x="${x-4}" y="${yTop+10}" width="8" height="1.5" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.3"/>`;
  }
  if (seme === 'denari') {
    // scettro con moneta in cima
    return `<rect x="${x-1}" y="${yTop+8}" width="2" height="${yBot-yTop-4}" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
            <circle cx="${x}" cy="${yTop+4}" r="5" fill="${C.oro}" stroke="${C.oroS}" stroke-width="1.5"/>
            <circle cx="${x}" cy="${yTop+4}" r="2.5" fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.3"/>`;
  }
  // spade → spada come scettro
  return `<rect x="${x-1}" y="${yTop+6}" width="2" height="${yBot-yTop}" fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.4"/>
          <polygon points="${x},${yTop} ${x-3},${yTop+6} ${x+3},${yTop+6}" fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.4"/>
          <rect x="${x-5}" y="${yTop+22}" width="10" height="2" fill="${C.marrone}" stroke="${C.nero}" stroke-width="0.4"/>`;
};

/* ---------- FANTE: giovanotto — colore giacca e simbolo variano per seme ---------- */
SPRITES._figFante = function(seme) {
  const C = SPRITES.C;
  // Colore giacca e berretto cambiano per seme
  const semeColor = { bastoni: C.marrone, coppe: C.rosso, denari: C.oro, spade: C.azzurro };
  const jacketCol = semeColor[seme] || C.azzurro;
  const jacketShade = SPRITES._shade(jacketCol, -40);
  const jacketHi    = SPRITES._shade(jacketCol, 35);
  const pal = {
    K: C.nero,
    P: C.pelle,
    L: SPRITES._shade(C.pelle, 18),  // highlight pelle
    D: SPRITES._shade(C.pelle, -25), // ombra pelle
    H: C.capelli,
    R: jacketCol,        // berretto = colore seme
    r: jacketShade,      // ombra berretto
    B: jacketCol,        // giacca = colore seme
    b: jacketShade,      // ombra giacca
    h: jacketHi,         // highlight giacca
    G: C.pantaloni,
    g: SPRITES._shade(C.pantaloni, -20),
    O: C.oro,
    S: C.bianco
  };
  // 28 righe x 16 col — più dettaglio: piuma sul berretto, occhi 3px, colletto, bottoni, cuffi
  const rows = [
    '      OOO       ',
    '     ROOOO      ',
    '    rRRRRRR     ',
    '   rRRRRRRRRr   ',
    '   rRRRRRRRRr   ',
    '   KrRRRRRRrK   ',
    '    LPPPPPPL    ',
    '   LPHHHHHHPL   ',
    '   LPHHHHHHPL   ',
    '   PPKLPPLKPP   ',
    '   PPDPPPPDPP   ',
    '   PPPPDDPPPP   ',
    '   PPPHHHHHPP   ',
    '   SSSSSSSSSS   ',
    '   SOSSSSSSOS   ',
    '  bBBBBBBBBBb   ',
    ' bBBhhBBBBhhBb  ',
    ' BBBhBBOBBhBBB  ',
    ' BBBBBBOBBBBBB  ',
    ' BBBBBBOBBBBBB  ',
    ' BBBBBBOBBBBBB  ',
    ' bBBBBBBBBBBBb  ',
    '  bBBBBBBBBBb   ',
    '   GGGggGGGgg   ',
    '   GGGggGGGgg   ',
    '   GGGggGGGgg   ',
    '   KKKKKKKKKK   ',
    '   KKKKKKKKKK   '
  ];
  const pixels = SPRITES._pix(rows, 10, 22, 3, 2.2, pal);
  // Simbolo del seme tenuto in mano (lato destro della figura)
  const emblem = SPRITES._figEmblem(seme, 52, 42);
  return `<g stroke="${C.nero}" stroke-width="0.3">${pixels}${emblem}</g>`;
};

/* ---------- CAVALLO: cavaliere su cavallo — mantello e arma variano per seme ---------- */
SPRITES._figCavallo = function(seme) {
  const C = SPRITES.C;
  const semeColor = { bastoni: C.marrone, coppe: C.rosso, denari: C.oro, spade: C.azzurro };
  const mantello = semeColor[seme] || C.rosso;
  const mantelloS = SPRITES._shade(mantello, -40);
  const mantelloH = SPRITES._shade(mantello, 30);
  const pal = {
    K: C.nero,
    M: C.marrone,
    N: C.marroneS,
    n: SPRITES._shade(C.marrone, -30), // ombra cavallo
    P: C.pelle,
    L: SPRITES._shade(C.pelle, 18),
    D: SPRITES._shade(C.pelle, -25),
    R: mantello,
    r: mantelloS,
    h: mantelloH,
    O: C.oro,
    G: C.giallo,
    H: C.capelli,
  };
  // 28 righe — più dettaglio elmo, plume, sella
  const rows = [
    '       OO       ',
    '      OOOO      ',
    '     OOGGOO     ',
    '     KPPPPK     ',
    '     PPLLPP     ',
    '     PDPPDP     ',
    '    PPHHHHPP    ',
    '    rRRRRRRr    ',
    '   rRRhhRRRRr   ',
    '   RRRRRRRRRR   ',
    '  rRRRRRRRRRRr  ',
    '  RRRRRRRRRRR   ',
    '  ORROORRORRO   ',
    '   M  MM  M     ',
    '   MMNMMMMNMM   ',
    '  MMMMMMMMMMMM  ',
    '  MMMMMMMMMMMM  ',
    '  MnMMMMMMMMnM  ',
    '  MnMMMMMMMMnN  ',
    '   MMMMMMMMNN   ',
    '    M    MMNN   ',
    '    M    M      ',
    '    M    M      ',
    '    M    M      ',
    '    n    n      ',
    '    n    n      ',
    '    K    K      ',
    '    K    K      '
  ];
  const pixels = SPRITES._pix(rows, 10, 22, 3, 2.2, pal);
  // Arma/insegna del cavaliere cambia per seme
  const weapon = SPRITES._figWeapon(seme);
  return `<g stroke="${C.nero}" stroke-width="0.3">${pixels}${weapon}</g>`;
};

/* ---------- RE: figura con corona — manto e scettro variano per seme ---------- */
SPRITES._figRe = function(seme) {
  const C = SPRITES.C;
  const semeColor = { bastoni: C.marrone, coppe: C.rosso, denari: C.oro, spade: C.azzurro };
  const mantoCol  = semeColor[seme] || C.rosso;
  // versione più scura per la parte bassa del manto
  const mantoS = { bastoni: C.marroneS, coppe: C.rossoS, denari: C.oroS, spade: '#1565c0' };
  const mantoScuro = mantoS[seme] || C.rossoS;
  const mantoHi    = SPRITES._shade(mantoCol, 30);
  const pal = {
    K: C.nero,
    O: C.oro,
    Y: C.giallo,
    g: SPRITES._shade(C.oro, -20),
    P: C.pelle,
    L: SPRITES._shade(C.pelle, 20), // highlight pelle
    D: SPRITES._shade(C.pelle, -25), // ombra pelle
    H: C.capelli,
    W: C.bianco,
    R: mantoCol,        // manto superiore = colore seme
    r: SPRITES._shade(mantoCol, -25), // ombra
    h: mantoHi,         // highlight manto
    M: mantoScuro,      // manto inferiore = colore seme scuro
    G: C.oroS
  };
  // 28 righe: corona + barba + manto più dettagliato
  const rows = [
    '   O  O  O  O   ',
    '   OO OO OO OO  ',
    '   OYOOYYOOYYO  ',
    '   OOOOOOOOOOO  ',
    '   gOYYOYYOYYg  ',
    '   gggggggggg   ',
    '    LPPPPPPL    ',
    '   LPHHHHHHPL   ',
    '   PPKLPPLKPP   ',
    '   PPDPPPPDPP   ',
    '   PPPHHHHPPP   ',
    '   PPHHHHHHPP   ',
    '    PHHHHHHP    ',
    '   rRRWRRWRRr   ',
    '  rRRRRRRRRRRr  ',
    ' rRRhRRRRRRhRRr ',
    ' RRRRROOORRRRR  ',
    ' RRRROYYYYORRR  ',
    ' RRRROYGYYORRR  ',
    ' RRRRROOORRRRR  ',
    ' rRRRRRRRRRRRRr ',
    ' MMMMMMMMMMMMM  ',
    ' MMMMMMMMMMMMM  ',
    ' MMMMMMMMMMMMM  ',
    '  MMMMMMMMMMM   ',
    '  MMMM   MMMM   ',
    '  KKKK   KKKK   ',
    '  KKKK   KKKK   '
  ];
  const pixels = SPRITES._pix(rows, 10, 22, 3, 2.2, pal);
  // Scettro del re: varia per seme
  const scepter = SPRITES._figScepter(seme);
  return `<g stroke="${C.nero}" stroke-width="0.3">${pixels}${scepter}</g>`;
};

/* ============================================================
   2) CARD BACK
   ============================================================ */
SPRITES.cardBack = function(opts) {
  opts = opts || {};
  const size = opts.size || 'md';
  const dim = SPRITES._sz(size);
  const C = SPRITES.C;

  // Pattern alternato: croci + diamanti in griglia regolare
  let pattern = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 7; c++) {
      const cx = 7 + c * 9;
      const cy = 22 + r * 9 + (c % 2 ? 4.5 : 0);
      const useCross = ((r + c) % 2) === 0;
      if (useCross) {
        // piccolo "+"
        pattern += `<rect x="${cx-0.4}" y="${cy-2.2}" width="0.8" height="4.4" fill="${C.oro}" opacity="0.55"/>`;
        pattern += `<rect x="${cx-2.2}" y="${cy-0.4}" width="4.4" height="0.8" fill="${C.oro}" opacity="0.55"/>`;
      } else {
        // piccolo diamante
        pattern += `<polygon points="${cx},${cy-2.4} ${cx+2.2},${cy} ${cx},${cy+2.4} ${cx-2.2},${cy}"
          fill="${C.verde}" stroke="${C.oro}" stroke-width="0.25" opacity="0.85"/>`;
        pattern += `<circle cx="${cx}" cy="${cy}" r="0.5" fill="${C.oro}"/>`;
      }
    }
  }

  // Flourishes 4 angoli — foglia 3 petali stilizzata
  const flourish = (cx, cy, rot) => `
    <g transform="rotate(${rot} ${cx} ${cy})">
      <polygon points="${cx-3},${cy} ${cx},${cy-4} ${cx+3},${cy} ${cx},${cy+1}"
               fill="${C.oro}" stroke="${C.nero}" stroke-width="0.3"/>
      <polygon points="${cx-2.5},${cy-0.5} ${cx-5.5},${cy-3} ${cx-3.5},${cy+1}"
               fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.25"/>
      <polygon points="${cx+2.5},${cy-0.5} ${cx+5.5},${cy-3} ${cx+3.5},${cy+1}"
               fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.25"/>
      <circle cx="${cx}" cy="${cy}" r="0.7" fill="${C.rosso}"/>
    </g>`;
  const corners =
    flourish(10, 24, 0) +
    flourish(60, 24, 90) +
    flourish(60, 96, 180) +
    flourish(10, 96, 270);

  return `
<svg xmlns="http://www.w3.org/2000/svg" class="card-svg card-back-svg"
     viewBox="0 0 70 105" width="${dim.w}" height="${dim.h}">
  <rect x="0.5" y="0.5" width="69" height="104" rx="5" ry="5"
        fill="${C.verdeS}" stroke="${C.oroS}" stroke-width="3"/>
  <rect x="2" y="2" width="66" height="101" rx="4" ry="4"
        fill="${C.verdeS}" stroke="${C.oro}" stroke-width="1"/>
  <!-- ribbon top -->
  <rect x="3" y="3" width="64" height="15" rx="2" ry="2"
        fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.5"/>
  <text x="35" y="14" text-anchor="middle" font-family="monospace"
        font-size="9" font-weight="bold" fill="${C.bianco}" letter-spacing="1">BISCA</text>
  <!-- pattern croci+diamanti -->
  <g>${pattern}</g>
  <!-- medaglione centrale concentrico -->
  <circle cx="35" cy="55" r="16" fill="${C.nero}" opacity="0.55"/>
  <circle cx="35" cy="55" r="14" fill="none" stroke="${C.oro}" stroke-width="0.8"/>
  <circle cx="35" cy="55" r="11" fill="none" stroke="${C.oroS}" stroke-width="0.6"/>
  <circle cx="35" cy="55" r="8"  fill="none" stroke="${C.oro}" stroke-width="0.4"/>
  <text x="35" y="59" text-anchor="middle"
        font-family="monospace" font-size="14" font-weight="bold"
        fill="${C.oro}" stroke="${C.nero}" stroke-width="0.5">BR</text>
  <!-- cornetto pixel sotto medaglione -->
  <polygon points="35,76 32,84 38,84" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
  <rect x="33.5" y="75" width="3" height="2" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.3"/>
  <rect x="34" y="78" width="0.8" height="1" fill="${C.bianco}"/>
  <rect x="35.5" y="80" width="0.8" height="1" fill="${C.bianco}"/>
  <!-- 4 corner flourishes -->
  ${corners}
</svg>`.trim();
};

/* ============================================================
   3) GENNARINO 'O GALLO
   ============================================================ */
SPRITES.gennarino = function(emotion, size) {
  if (!_EMOTIONS.includes(emotion)) emotion = 'idle';
  emotion = emotion || 'idle';
  size = size || 64;
  const C = SPRITES.C;

  // Cresta varia per emotion
  const crestaY = (emotion === 'sad') ? 4 : 1;
  const crestaTilt = (emotion === 'sad') ? -8 : 0;

  // Cresta (3 punte rosse)
  let cresta = '';
  if (emotion === 'angry') {
    // zigzag
    cresta = `
      <polygon points="22,7 26,1 30,7 34,1 38,7 42,1 46,7"
               fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.6"/>
    `;
  } else if (emotion === 'happy') {
    cresta = `
      <rect x="22" y="0" width="5" height="9" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
      <rect x="29" y="-1" width="5" height="10" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
      <rect x="36" y="0" width="5" height="9" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
      <rect x="43" y="1" width="5" height="8" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
    `;
  } else {
    const tilt = crestaTilt ? ` transform="rotate(${crestaTilt} 32 8)"` : '';
    cresta = `
      <g${tilt}>
        <rect x="22" y="${crestaY}" width="5" height="${8 - (emotion==='sad'?2:0)}" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
        <rect x="29" y="${crestaY - 1}" width="5" height="${9 - (emotion==='sad'?3:0)}" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
        <rect x="36" y="${crestaY}" width="5" height="${8 - (emotion==='sad'?2:0)}" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
        <rect x="43" y="${crestaY + 1}" width="5" height="${7 - (emotion==='sad'?2:0)}" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.5"/>
      </g>
    `;
  }

  // Testa (oval piume arancio)
  const testa = `
    <ellipse cx="32" cy="14" rx="14" ry="9"
             fill="#c8651a" stroke="${C.nero}" stroke-width="0.7"/>
    <ellipse cx="28" cy="11" rx="5" ry="2.5" fill="#e07a2a" opacity="0.6"/>
  `;

  // Occhi/occhiali secondo emotion
  let occhi = '';
  if (emotion === 'shocked') {
    occhi = `
      <circle cx="26" cy="14" r="3.5" fill="${C.bianco}" stroke="${C.nero}" stroke-width="0.6"/>
      <circle cx="38" cy="14" r="3.5" fill="${C.bianco}" stroke="${C.nero}" stroke-width="0.6"/>
      <circle cx="26" cy="14" r="1.2" fill="${C.nero}"/>
      <circle cx="38" cy="14" r="1.2" fill="${C.nero}"/>
    `;
  } else if (emotion === 'money') {
    occhi = `
      <rect x="22" y="11" width="7" height="6" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.5"/>
      <rect x="35" y="11" width="7" height="6" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.5"/>
      <text x="25.5" y="16" font-family="monospace" font-size="6" font-weight="bold" fill="${C.nero}">$</text>
      <text x="38.5" y="16" font-family="monospace" font-size="6" font-weight="bold" fill="${C.nero}">$</text>
    `;
  } else if (emotion === 'sleeping') {
    occhi = `
      <path d="M 23 14 Q 26 16 29 14" stroke="${C.nero}" stroke-width="0.8" fill="none"/>
      <path d="M 35 14 Q 38 16 41 14" stroke="${C.nero}" stroke-width="0.8" fill="none"/>
    `;
  } else if (emotion === 'winking') {
    occhi = `
      <path d="M 23 14 Q 26 16 29 14" stroke="${C.nero}" stroke-width="0.8" fill="none"/>
      <rect x="35" y="11" width="7" height="6" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.5"/>
      <rect x="37" y="13" width="3" height="2.5" fill="${C.nero}"/>
    `;
  } else {
    // Occhiali da sole dorati standard
    occhi = `
      <rect x="22" y="11" width="7" height="5" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.6"/>
      <rect x="35" y="11" width="7" height="5" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.6"/>
      <rect x="29" y="13" width="6" height="1.2" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
      <rect x="23" y="12" width="5" height="3" fill="${C.nero}"/>
      <rect x="36" y="12" width="5" height="3" fill="${C.nero}"/>
      <rect x="24" y="12.3" width="1.2" height="1" fill="${C.bianco}" opacity="0.7"/>
      <rect x="37" y="12.3" width="1.2" height="1" fill="${C.bianco}" opacity="0.7"/>
    `;
  }

  // Beak
  let beak = `<polygon points="32,17 28,20 36,20" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.5"/>`;
  if (emotion === 'happy') {
    beak = `
      <polygon points="32,17 28,19 36,19" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.5"/>
      <polygon points="28,19 36,19 32,23" fill="${C.rossoS}" stroke="${C.nero}" stroke-width="0.5"/>
    `;
  }

  // Sigaro per idle — fumo a 3 puff
  let sigaro = '';
  if (emotion === 'idle') {
    sigaro = `
      <rect x="36" y="20" width="6" height="2" fill="${C.grigioS}" stroke="${C.nero}" stroke-width="0.4"/>
      <rect x="41.5" y="20" width="0.8" height="2" fill="${C.rosso}"/>
      <circle cx="44"  cy="17" r="1.4" fill="${C.bianco}" opacity="0.85" class="smoke"/>
      <circle cx="45.5" cy="13" r="1.7" fill="${C.bianco}" opacity="0.6"  class="smoke"/>
      <circle cx="44.5" cy="9"  r="2.0" fill="${C.bianco}" opacity="0.35" class="smoke"/>
    `;
  }

  // Goccia per sad
  let goccia = '';
  if (emotion === 'sad') {
    goccia = `<polygon points="22,18 20,23 24,23" fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.4"/>`;
  }

  // Linee rabbia
  let rabbia = '';
  if (emotion === 'angry') {
    rabbia = `
      <line x1="48" y1="6" x2="52" y2="2" stroke="${C.rosso}" stroke-width="1.2"/>
      <line x1="50" y1="8" x2="54" y2="4" stroke="${C.rosso}" stroke-width="1.2"/>
      <line x1="52" y1="10" x2="56" y2="6" stroke="${C.rosso}" stroke-width="1.2"/>
    `;
  }

  // Punto interrogativo per thinking
  let thinkBubble = '';
  if (emotion === 'thinking') {
    thinkBubble = `<text x="48" y="10" font-family="monospace" font-size="10"
      font-weight="bold" fill="${C.viola}" stroke="${C.nero}" stroke-width="0.4">?</text>`;
  }

  // ZZZ per sleeping
  let zzz = '';
  if (emotion === 'sleeping') {
    zzz = `<text x="44" y="8" font-family="monospace" font-size="9"
      font-weight="bold" fill="${C.viola}" stroke="${C.nero}" stroke-width="0.3">ZZZ</text>`;
  }

  // Monete che cadono per money
  let monete = '';
  if (emotion === 'money') {
    monete = `
      <circle cx="10" cy="20" r="2" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
      <circle cx="54" cy="14" r="2" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
      <circle cx="8" cy="36" r="1.6" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
      <circle cx="56" cy="32" r="1.6" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.4"/>
    `;
  }

  // Ombra a terra
  const shadow = `<ellipse cx="32" cy="60" rx="18" ry="2.5" fill="${C.nero}" opacity="0.35"/>`;

  // Corpo: maglia azzurra Napoli con "10" giallo + ali di base ai lati
  // Inclinazione per dancing
  const tilt = (emotion === 'dancing') ? ' transform="rotate(-15 32 38)"' : '';

  const corpo = `
    <g${tilt}>
      <!-- ali laterali (idle/base) — piccoli triangoli arancio -->
      <polygon points="14,28 10,24 13,36" fill="#c8651a" stroke="${C.nero}" stroke-width="0.5"/>
      <polygon points="50,28 54,24 51,36" fill="#c8651a" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="12" y1="28" x2="12" y2="32" stroke="${C.nero}" stroke-width="0.3"/>
      <line x1="52" y1="28" x2="52" y2="32" stroke="${C.nero}" stroke-width="0.3"/>
      <!-- maglia azzurra -->
      <rect x="14" y="22" width="36" height="22" fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.7"/>
      <!-- bordino giallo collo -->
      <rect x="22" y="22" width="20" height="2" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <!-- bordini gialli maniche -->
      <rect x="14" y="22" width="3" height="3" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <rect x="47" y="22" width="3" height="3" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <!-- pancia -->
      <rect x="16" y="40" width="32" height="4" fill="${C.azzurroS}" opacity="0.5"/>
      <!-- pieghe maglia (dettaglio) -->
      <line x1="20" y1="28" x2="20" y2="40" stroke="${C.azzurroS}" stroke-width="0.4" opacity="0.7"/>
      <line x1="44" y1="28" x2="44" y2="40" stroke="${C.azzurroS}" stroke-width="0.4" opacity="0.7"/>
      <!-- catenona dorata (arco) -->
      <path d="M 18 26 Q 32 34 46 26" stroke="${C.oro}" stroke-width="2.2"
            fill="none"/>
      <path d="M 18 26 Q 32 34 46 26" stroke="${C.nero}" stroke-width="0.3"
            fill="none"/>
      <!-- cornetto al centro catena -->
      <polygon points="32,34 30,40 34,40" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.4"/>
      <!-- "10" giallo -->
      <text x="32" y="38" text-anchor="middle" font-family="monospace"
            font-size="8" font-weight="bold" fill="${C.giallo}"
            stroke="${C.nero}" stroke-width="0.4">10</text>
    </g>
  `;

  // Gambe (V per dancing) — con artigli
  let gambe = '';
  if (emotion === 'dancing') {
    gambe = `
      <line x1="28" y1="44" x2="22" y2="56" stroke="${C.giallo}" stroke-width="3"/>
      <line x1="36" y1="44" x2="42" y2="56" stroke="${C.giallo}" stroke-width="3"/>
      <line x1="28" y1="44" x2="22" y2="56" stroke="${C.nero}" stroke-width="0.4"/>
      <line x1="36" y1="44" x2="42" y2="56" stroke="${C.nero}" stroke-width="0.4"/>
      <rect x="18" y="55" width="8" height="3" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <rect x="38" y="55" width="8" height="3" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <!-- artigli -->
      <line x1="19" y1="58" x2="17" y2="60" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="22" y1="58" x2="22" y2="60" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="25" y1="58" x2="27" y2="60" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="39" y1="58" x2="37" y2="60" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="42" y1="58" x2="42" y2="60" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="45" y1="58" x2="47" y2="60" stroke="${C.nero}" stroke-width="0.5"/>
    `;
  } else {
    gambe = `
      <rect x="26" y="44" width="3.5" height="10" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <rect x="34.5" y="44" width="3.5" height="10" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <rect x="22" y="54" width="11" height="3" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <rect x="31" y="54" width="11" height="3" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.4"/>
      <line x1="22" y1="55.5" x2="33" y2="55.5" stroke="${C.nero}" stroke-width="0.3"/>
      <!-- artigli/talons piegati -->
      <line x1="23" y1="57" x2="22" y2="59.5" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="27" y1="57" x2="27" y2="59.5" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="31" y1="57" x2="32" y2="59.5" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="34" y1="57" x2="33" y2="59.5" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="38" y1="57" x2="38" y2="59.5" stroke="${C.nero}" stroke-width="0.5"/>
      <line x1="42" y1="57" x2="43" y2="59.5" stroke="${C.nero}" stroke-width="0.5"/>
    `;
  }

  // Ali alzate per happy
  let ali = '';
  if (emotion === 'happy') {
    ali = `
      <polygon points="14,24 6,16 8,28" fill="#c8651a" stroke="${C.nero}" stroke-width="0.5"/>
      <polygon points="50,24 58,16 56,28" fill="#c8651a" stroke="${C.nero}" stroke-width="0.5"/>
    `;
  }

  // Ala sul beak per thinking
  let alaThink = '';
  if (emotion === 'thinking') {
    alaThink = `<polygon points="14,30 26,22 22,32" fill="#c8651a" stroke="${C.nero}" stroke-width="0.5"/>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" class="gennarino"
     viewBox="0 0 64 64" width="${size}" height="${size}"
     data-emotion="${emotion}">
  ${shadow}
  ${cresta}
  ${rabbia}
  ${thinkBubble}
  ${zzz}
  ${monete}
  ${testa}
  ${occhi}
  ${beak}
  ${sigaro}
  ${goccia}
  ${corpo}
  ${ali}
  ${alaThink}
  ${gambe}
</svg>`.trim();
};

/* ============================================================
   4) SLOT SYMBOLS
   ============================================================ */
SPRITES.slotSymbol = function(symbol) {
  if (!_SYMBOLS.includes(symbol)) symbol = 'coin';
  const C = SPRITES.C;
  let body = '';

  if (symbol === 'cherry') {
    body = `
      <path d="M 20 12 Q 28 6 38 14" stroke="${C.verde}" stroke-width="2" fill="none"/>
      <polygon points="38,14 44,8 42,16" fill="${C.verde}" stroke="${C.nero}" stroke-width="0.5"/>
      <circle cx="20" cy="42" r="10" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.8"/>
      <circle cx="38" cy="46" r="10" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.8"/>
      <ellipse cx="17" cy="38" rx="3" ry="2" fill="#fff" opacity="0.6"/>
      <ellipse cx="35" cy="42" rx="3" ry="2" fill="#fff" opacity="0.6"/>
    `;
  } else if (symbol === 'lemon') {
    body = `
      <ellipse cx="30" cy="35" rx="18" ry="14" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.8"/>
      <ellipse cx="48" cy="22" rx="3" ry="1.5" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.5" transform="rotate(30 48 22)"/>
      <polygon points="44,16 52,14 50,22" fill="${C.verde}" stroke="${C.nero}" stroke-width="0.6"/>
      <ellipse cx="24" cy="30" rx="5" ry="3" fill="#fff" opacity="0.5"/>
    `;
  } else if (symbol === 'bell') {
    body = `
      <path d="M 14 36 Q 14 14 30 14 Q 46 14 46 36 Z" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.8"/>
      <rect x="12" y="36" width="36" height="6" fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.6"/>
      <circle cx="30" cy="48" r="4" fill="${C.nero}"/>
      <line x1="30" y1="42" x2="30" y2="46" stroke="${C.nero}" stroke-width="1.2"/>
      <ellipse cx="22" cy="22" rx="3" ry="6" fill="${C.bianco}" opacity="0.5"/>
    `;
  } else if (symbol === 'coin') {
    body = `
      <circle cx="30" cy="30" r="22" fill="${C.oro}" stroke="${C.oroS}" stroke-width="3"/>
      <circle cx="30" cy="30" r="17" fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.5"/>
      <text x="30" y="38" text-anchor="middle" font-family="monospace"
            font-size="22" font-weight="bold" fill="${C.oro}"
            stroke="${C.nero}" stroke-width="0.6">$</text>
      <ellipse cx="22" cy="20" rx="5" ry="3" fill="${C.bianco}" opacity="0.5"/>
    `;
  } else if (symbol === 'seven') {
    body = `
      <rect x="12" y="10" width="36" height="6" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.6"/>
      <polygon points="44,16 30,52 22,52 36,16" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.6"/>
      <rect x="14" y="12" width="32" height="2" fill="${C.bianco}" opacity="0.6"/>
    `;
  } else if (symbol === 'star') {
    body = `
      <polygon points="30,6 36,22 53,22 39,32 44,49 30,40 16,49 21,32 7,22 24,22"
               fill="${C.oro}" stroke="${C.nero}" stroke-width="0.8"/>
      <polygon points="30,12 33,23 44,23 35,30 38,40 30,34 22,40 25,30 16,23 27,23"
               fill="${C.oroS}" opacity="0.6"/>
    `;
  } else if (symbol === 'diamond') {
    body = `
      <polygon points="30,6 50,30 30,54 10,30"
               fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.8"/>
      <polygon points="30,10 30,30 18,30" fill="${C.bianco}" opacity="0.55"/>
      <polygon points="30,12 42,30 30,30" fill="${C.azzurroS}" opacity="0.4"/>
    `;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" class="slot-symbol"
     viewBox="0 0 60 60" width="60" height="60"
     data-symbol="${symbol}">
  ${body}
</svg>`.trim();
};

/* ============================================================
   5) JOKER CARD
   ============================================================ */
SPRITES.jokerCard = function(rarity, emoji, bgColor) {
  if (!_RARITIES.includes(rarity)) rarity = 'common';
  if (!/^#[0-9a-fA-F]{3,8}$/.test(bgColor)) bgColor = '#1a0a14';
  emoji = _esc(emoji);
  const C = SPRITES.C;
  const rar = rarity || 'common';
  const bg = bgColor || '#3a1a3e';
  const em = emoji || '🃏';

  const rarityCfg = {
    common:    { color: C.grigio,  label: 'COMUNE',     glow: '' },
    uncommon:  { color: C.verde2,  label: 'NON COMUNE', glow: '' },
    rare:      { color: C.azzurro, label: 'RARO',       glow: 'filter="drop-shadow(0 0 4px #2196f3)"' },
    legendary: { color: C.oro,     label: 'LEGGENDARIO',glow: 'filter="drop-shadow(0 0 8px #f4c430)"' }
  };
  const cfg = rarityCfg[rar] || rarityCfg.common;

  // Pattern holo per legendary
  let holo = '';
  if (rar === 'legendary') {
    holo = `
      <defs>
        <pattern id="holoPat" patternUnits="userSpaceOnUse" width="6" height="6"
                 patternTransform="rotate(45)">
          <rect width="3" height="6" fill="${C.oro}" opacity="0.18"/>
        </pattern>
      </defs>
      <rect x="3" y="3" width="64" height="99" rx="4" fill="url(#holoPat)"/>
    `;
  }

  // Angoli decorativi
  let corners = '';
  if (rar === 'rare' || rar === 'legendary') {
    const decoFill = rar === 'legendary' ? C.oro : C.azzurro;
    if (rar === 'legendary') {
      // stelline
      const star = (cx, cy) => `
        <polygon points="${cx},${cy-3} ${cx+1},${cy-1} ${cx+3},${cy-1} ${cx+1.4},${cy+0.4} ${cx+2},${cy+3} ${cx},${cy+1.6} ${cx-2},${cy+3} ${cx-1.4},${cy+0.4} ${cx-3},${cy-1} ${cx-1},${cy-1}"
                 fill="${decoFill}" stroke="${C.nero}" stroke-width="0.3"/>`;
      corners = star(8, 24) + star(62, 24) + star(8, 92) + star(62, 92);
    } else {
      const rhombus = (cx, cy) => `
        <polygon points="${cx},${cy-3} ${cx+3},${cy} ${cx},${cy+3} ${cx-3},${cy}"
                 fill="${decoFill}" stroke="${C.nero}" stroke-width="0.4"/>`;
      corners = rhombus(8, 24) + rhombus(62, 24) + rhombus(8, 92) + rhombus(62, 92);
    }
  }

  const cls = 'card-svg joker-card joker-' + rar;
  const animClass = rar === 'legendary' ? ' joker-legendary' : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" class="${cls}${animClass}"
     viewBox="0 0 70 105" width="70" height="105" ${cfg.glow}>
  <rect x="0.5" y="0.5" width="69" height="104" rx="5" ry="5"
        fill="${bg}" stroke="${cfg.color}" stroke-width="3"/>
  <rect x="2" y="2" width="66" height="101" rx="4" ry="4"
        fill="${bg}" stroke="${C.nero}" stroke-width="0.6"/>
  ${holo}
  <!-- ribbon top -->
  <rect x="3" y="3" width="64" height="14" rx="2"
        fill="${cfg.color}" stroke="${C.nero}" stroke-width="0.5"/>
  <text x="35" y="13" text-anchor="middle" font-family="monospace"
        font-size="${cfg.label.length > 6 ? 6 : 8}" font-weight="bold"
        fill="${C.nero}" letter-spacing="0.8">${cfg.label}</text>
  <!-- emoji centrale -->
  <text x="35" y="68" text-anchor="middle" font-size="32">${em}</text>
  <!-- ribbon basso decorativo -->
  <rect x="3" y="91" width="64" height="11" rx="2"
        fill="${cfg.color}" opacity="0.65" stroke="${C.nero}" stroke-width="0.4"/>
  ${corners}
</svg>`.trim();
};

/* ============================================================
   6) BOSS FRAME
   ============================================================ */
const _BOSSES = ['pulcinella','munaciello','janara','sangennaro','pazzariello'];

SPRITES.bossFrame = function(bossId, name) {
  if (!_BOSSES.includes(bossId)) bossId = 'unknown';
  name = _esc(name);
  const C = SPRITES.C;
  const nm = name || _esc(bossId) || 'BOSS';

  // Pattern croci sfondo
  let crossPat = '';
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 10; c++) {
      const cx = 10 + c * 20;
      const cy = 10 + r * 20;
      crossPat += `
        <rect x="${cx-0.5}" y="${cy-2}" width="1" height="4" fill="#2d1a2e"/>
        <rect x="${cx-2}" y="${cy-0.5}" width="4" height="1" fill="#2d1a2e"/>`;
    }
  }

  // Ritratto specifico per boss
  const portrait = SPRITES._bossPortrait(bossId);

  return `
<svg xmlns="http://www.w3.org/2000/svg" class="boss-portrait"
     viewBox="0 0 200 240" width="200" height="240" data-boss="${bossId}">
  <!-- bg -->
  <rect x="0" y="0" width="200" height="240" fill="${C.nero}"/>
  <g>${crossPat}</g>
  <!-- area ritratto -->
  <rect x="20" y="20" width="160" height="160" fill="#0a0a0a"
        stroke="${C.rosso}" stroke-width="3"
        filter="drop-shadow(0 0 8px #e63946)"/>
  <g transform="translate(20 20)">${portrait}</g>
  <!-- ribbon nome -->
  <rect x="10" y="196" width="180" height="32" rx="3"
        fill="${C.rosso}" stroke="${C.nero}" stroke-width="2"/>
  <rect x="10" y="196" width="180" height="6" fill="${C.rossoS}"/>
  <text x="100" y="218" text-anchor="middle" font-family="monospace"
        font-size="${nm.length > 14 ? 11 : 14}" font-weight="bold"
        fill="${C.bianco}" stroke="${C.nero}" stroke-width="0.5"
        letter-spacing="1">${nm}</text>
</svg>`.trim();
};

/* ---------- RITRATTI BOSS (160x160 area) ---------- */
SPRITES._bossPortrait = function(id) {
  const C = SPRITES.C;
  switch (id) {
    case 'pulcinella': return `
      <!-- cappello conico bianco -->
      <polygon points="80,10 60,60 100,60" fill="${C.bianco}" stroke="${C.nero}" stroke-width="1.5"/>
      <rect x="60" y="58" width="40" height="6" fill="${C.bianco}" stroke="${C.nero}" stroke-width="1"/>
      <!-- maschera ovale -->
      <ellipse cx="80" cy="80" rx="26" ry="30" fill="${C.bianco}" stroke="${C.nero}" stroke-width="2"/>
      <ellipse cx="80" cy="78" rx="22" ry="22" fill="#f5f5f5"/>
      <!-- naso lungo -->
      <polygon points="80,75 88,90 80,92" fill="${C.pelle}" stroke="${C.nero}" stroke-width="1"/>
      <!-- occhi -->
      <rect x="68" y="72" width="6" height="3" fill="${C.nero}"/>
      <rect x="86" y="72" width="6" height="3" fill="${C.nero}"/>
      <!-- bocca a curva -->
      <path d="M 70 96 Q 80 102 90 96" stroke="${C.nero}" stroke-width="1.5" fill="none"/>
      <!-- colletto a volant -->
      <path d="M 50 110 Q 80 130 110 110 L 110 120 Q 80 140 50 120 Z"
            fill="${C.bianco}" stroke="${C.nero}" stroke-width="1.5"/>
      <!-- vestito a righe -->
      <rect x="50" y="120" width="60" height="40" fill="${C.bianco}" stroke="${C.nero}" stroke-width="1.5"/>
      <rect x="55" y="120" width="4" height="40" fill="${C.nero}"/>
      <rect x="65" y="120" width="4" height="40" fill="${C.nero}"/>
      <rect x="75" y="120" width="4" height="40" fill="${C.nero}"/>
      <rect x="85" y="120" width="4" height="40" fill="${C.nero}"/>
      <rect x="95" y="120" width="4" height="40" fill="${C.nero}"/>
    `;

    case 'munaciello': return `
      <!-- cappello da monaco marrone -->
      <path d="M 40 60 Q 80 20 120 60 L 120 75 L 40 75 Z"
            fill="${C.marrone}" stroke="${C.nero}" stroke-width="1.5"/>
      <!-- volto piccolo tarchiato -->
      <ellipse cx="80" cy="95" rx="32" ry="22" fill="${C.pelle}" stroke="${C.nero}" stroke-width="1.5"/>
      <!-- occhi grandi verdi brillanti -->
      <circle cx="68" cy="92" r="6" fill="${C.bianco}" stroke="${C.nero}" stroke-width="1"/>
      <circle cx="92" cy="92" r="6" fill="${C.bianco}" stroke="${C.nero}" stroke-width="1"/>
      <circle cx="68" cy="92" r="3.5" fill="${C.verde}"/>
      <circle cx="92" cy="92" r="3.5" fill="${C.verde}"/>
      <circle cx="69" cy="91" r="1" fill="${C.bianco}"/>
      <circle cx="93" cy="91" r="1" fill="${C.bianco}"/>
      <!-- bocca furba -->
      <path d="M 70 105 Q 80 110 90 105" stroke="${C.nero}" stroke-width="1.5" fill="none"/>
      <!-- naso -->
      <polygon points="80,96 76,102 84,102" fill="${C.pelle}" stroke="${C.nero}" stroke-width="0.8"/>
      <!-- mantello scuro -->
      <path d="M 30 120 L 130 120 L 140 160 L 20 160 Z"
            fill="#2a1020" stroke="${C.nero}" stroke-width="1.5"/>
      <!-- monetine sparse -->
      <circle cx="40" cy="145" r="4" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.6"/>
      <circle cx="120" cy="150" r="4" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.6"/>
    `;

    case 'janara': return `
      <!-- luna crescente sopra -->
      <circle cx="130" cy="25" r="14" fill="${C.giallo}" stroke="${C.nero}" stroke-width="1"/>
      <circle cx="136" cy="22" r="13" fill="${C.nero}"/>
      <!-- silhouette: capelli lunghissimi -->
      <path d="M 50 50 Q 60 30 80 28 Q 100 30 110 50 L 130 160 L 30 160 Z"
            fill="${C.nero}" stroke="${C.nero}" stroke-width="1"/>
      <!-- volto pallido -->
      <ellipse cx="80" cy="60" rx="20" ry="24" fill="#e8d8c8" stroke="${C.nero}" stroke-width="1.2"/>
      <!-- occhi rossi -->
      <ellipse cx="72" cy="58" rx="3" ry="2" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.6"/>
      <ellipse cx="88" cy="58" rx="3" ry="2" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.6"/>
      <circle cx="72" cy="58" r="0.8" fill="${C.nero}"/>
      <circle cx="88" cy="58" r="0.8" fill="${C.nero}"/>
      <!-- bocca sottile -->
      <line x1="74" y1="74" x2="86" y2="74" stroke="${C.rossoS}" stroke-width="1.5"/>
      <!-- naso -->
      <line x1="80" y1="62" x2="80" y2="70" stroke="${C.nero}" stroke-width="0.8"/>
      <!-- capelli che scendono lungo i lati -->
      <path d="M 60 80 L 30 160" stroke="${C.nero}" stroke-width="6"/>
      <path d="M 100 80 L 130 160" stroke="${C.nero}" stroke-width="6"/>
      <path d="M 50 100 L 40 160" stroke="${C.nero}" stroke-width="4" opacity="0.8"/>
      <path d="M 110 100 L 120 160" stroke="${C.nero}" stroke-width="4" opacity="0.8"/>
    `;

    case 'sangennaro': return `
      <!-- aureola dorata -->
      <circle cx="80" cy="50" r="34" fill="none" stroke="${C.oro}" stroke-width="3"/>
      <circle cx="80" cy="50" r="38" fill="none" stroke="${C.oroS}" stroke-width="1"/>
      <!-- testa -->
      <ellipse cx="80" cy="55" rx="22" ry="26" fill="${C.pelle}" stroke="${C.nero}" stroke-width="1.5"/>
      <!-- mitra/cappello vescovile -->
      <polygon points="80,18 60,52 100,52" fill="${C.oro}" stroke="${C.nero}" stroke-width="1.5"/>
      <rect x="60" y="50" width="40" height="5" fill="${C.oroS}" stroke="${C.nero}" stroke-width="1"/>
      <rect x="78" y="22" width="4" height="28" fill="${C.rosso}"/>
      <!-- occhi -->
      <circle cx="72" cy="55" r="2" fill="${C.nero}"/>
      <circle cx="88" cy="55" r="2" fill="${C.nero}"/>
      <!-- barba -->
      <path d="M 60 70 Q 80 90 100 70 L 100 80 Q 80 100 60 80 Z"
            fill="#d8d8d8" stroke="${C.nero}" stroke-width="1"/>
      <!-- bocca -->
      <line x1="74" y1="72" x2="86" y2="72" stroke="${C.nero}" stroke-width="1"/>
      <!-- veste rossa -->
      <path d="M 30 100 L 130 100 L 140 160 L 20 160 Z"
            fill="${C.rosso}" stroke="${C.nero}" stroke-width="1.5"/>
      <rect x="76" y="100" width="8" height="60" fill="${C.oro}" stroke="${C.nero}" stroke-width="0.6"/>
      <!-- ampolla in mano -->
      <rect x="115" y="120" width="10" height="20" fill="#88ccff" stroke="${C.nero}" stroke-width="1"/>
      <rect x="116" y="128" width="8" height="11" fill="${C.rosso}"/>
      <rect x="117" y="116" width="6" height="6" fill="${C.oroS}" stroke="${C.nero}" stroke-width="0.8"/>
    `;

    case 'pazzariello': return `
      <!-- cappello enorme con piume colorate -->
      <ellipse cx="80" cy="35" rx="44" ry="15" fill="${C.nero}" stroke="${C.nero}" stroke-width="1"/>
      <rect x="60" y="35" width="40" height="20" fill="${C.nero}" stroke="${C.nero}" stroke-width="1"/>
      <!-- piume -->
      <ellipse cx="50" cy="20" rx="4" ry="14" fill="${C.rosso}" stroke="${C.nero}" stroke-width="0.8"/>
      <ellipse cx="65" cy="12" rx="4" ry="16" fill="${C.giallo}" stroke="${C.nero}" stroke-width="0.8"/>
      <ellipse cx="80" cy="8"  rx="4" ry="18" fill="${C.verde}" stroke="${C.nero}" stroke-width="0.8"/>
      <ellipse cx="95" cy="12" rx="4" ry="16" fill="${C.azzurro}" stroke="${C.nero}" stroke-width="0.8"/>
      <ellipse cx="110" cy="20" rx="4" ry="14" fill="${C.rosa}" stroke="${C.nero}" stroke-width="0.8"/>
      <!-- volto -->
      <ellipse cx="80" cy="68" rx="20" ry="22" fill="${C.pelle}" stroke="${C.nero}" stroke-width="1.5"/>
      <circle cx="73" cy="65" r="2" fill="${C.nero}"/>
      <circle cx="87" cy="65" r="2" fill="${C.nero}"/>
      <ellipse cx="80" cy="74" rx="3" ry="2" fill="${C.rossoS}"/>
      <path d="M 70 80 Q 80 88 90 80" stroke="${C.nero}" stroke-width="1.5" fill="none"/>
      <!-- baffi -->
      <path d="M 70 76 Q 76 78 80 76" stroke="${C.nero}" stroke-width="1.2" fill="none"/>
      <path d="M 90 76 Q 84 78 80 76" stroke="${C.nero}" stroke-width="1.2" fill="none"/>
      <!-- giacca multicolor a strisce -->
      <rect x="40" y="92" width="80" height="68" fill="${C.rosso}" stroke="${C.nero}" stroke-width="1.5"/>
      <rect x="50" y="92" width="10" height="68" fill="${C.giallo}"/>
      <rect x="70" y="92" width="10" height="68" fill="${C.verde}"/>
      <rect x="90" y="92" width="10" height="68" fill="${C.azzurro}"/>
      <rect x="110" y="92" width="10" height="68" fill="${C.rosa}"/>
      <!-- trombetta in mano -->
      <rect x="118" y="115" width="20" height="6" fill="${C.oro}" stroke="${C.nero}" stroke-width="1"/>
      <polygon points="138,118 148,108 148,128" fill="${C.oro}" stroke="${C.nero}" stroke-width="1"/>
    `;

    default: return `
      <!-- atmosfera nera + nebbia rossa -->
      <rect x="0" y="0" width="160" height="160" fill="#1a0a14"/>
      <ellipse cx="80" cy="140" rx="80" ry="20" fill="${C.rossoS}" opacity="0.3"/>
      <ellipse cx="80" cy="120" rx="60" ry="14" fill="${C.rosso}" opacity="0.18"/>
      <!-- silhouette incappucciata: corpo + mantello con bordi irregolari -->
      <path d="M 80 30
               Q 60 30 55 55
               L 50 80
               Q 35 100 30 160
               L 45 160
               Q 50 130 55 110
               L 55 160
               L 105 160
               L 105 110
               Q 110 130 115 160
               L 130 160
               Q 125 100 110 80
               L 105 55
               Q 100 30 80 30 Z"
            fill="#0a0506" stroke="${C.nero}" stroke-width="1.5"/>
      <!-- cappuccio (ombra interna) -->
      <path d="M 60 40 Q 80 32 100 40 Q 100 65 90 75 L 70 75 Q 60 65 60 40 Z"
            fill="${C.nero}" stroke="${C.nero}" stroke-width="1"/>
      <!-- bordi mantello irregolari -->
      <polygon points="30,160 38,150 44,160" fill="${C.nero}"/>
      <polygon points="44,160 52,148 58,160" fill="${C.nero}"/>
      <polygon points="100,160 108,148 114,160" fill="${C.nero}"/>
      <polygon points="116,160 124,150 130,160" fill="${C.nero}"/>
      <!-- volto in ombra: solo contorno fioco -->
      <ellipse cx="80" cy="62" rx="14" ry="16" fill="#160709"/>
      <!-- occhi rossi luminescenti -->
      <circle cx="74" cy="60" r="3.5" fill="${C.rosso}" filter="drop-shadow(0 0 3px #e63946)"/>
      <circle cx="86" cy="60" r="3.5" fill="${C.rosso}" filter="drop-shadow(0 0 3px #e63946)"/>
      <circle cx="74" cy="60" r="1.5" fill="${C.giallo}"/>
      <circle cx="86" cy="60" r="1.5" fill="${C.giallo}"/>
      <!-- bagliore generale rosso dietro la testa -->
      <circle cx="80" cy="60" r="22" fill="${C.rosso}" opacity="0.08"/>
      <!-- spunzoni / bordi cappuccio -->
      <polygon points="58,42 54,32 64,40" fill="${C.nero}"/>
      <polygon points="102,42 106,32 96,40" fill="${C.nero}"/>
      <!-- "?" stilizzato discreto in basso -->
      <text x="80" y="148" text-anchor="middle" font-family="monospace"
            font-size="22" font-weight="bold" fill="${C.rosso}"
            stroke="${C.nero}" stroke-width="1" opacity="0.85">?</text>
    `;
  }
};

/* ============================================================
   7) BACKGROUND BISCA (overlay opzionale)
   ============================================================ */
SPRITES.biscaBg = function() {
  const C = SPRITES.C;
  return `
<svg xmlns="http://www.w3.org/2000/svg" class="bisca-bg"
     viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice"
     width="100%" height="100%">
  <!-- lampadina che pende -->
  <line x1="200" y1="0" x2="200" y2="60" stroke="${C.nero}" stroke-width="1"/>
  <circle cx="200" cy="70" r="14" fill="${C.giallo}" stroke="${C.nero}" stroke-width="1"
          opacity="0.8"/>
  <circle cx="200" cy="70" r="22" fill="${C.giallo}" opacity="0.15"/>
  <!-- tazzina caffè in basso sx -->
  <ellipse cx="50" cy="540" rx="20" ry="6" fill="${C.nero}" opacity="0.4"/>
  <rect x="34" y="510" width="32" height="24" rx="3" fill="${C.bianco}" stroke="${C.nero}" stroke-width="1"/>
  <ellipse cx="50" cy="514" rx="14" ry="3" fill="${C.marroneS}"/>
  <path d="M 66 516 Q 76 520 66 528" stroke="${C.nero}" stroke-width="1.2" fill="none"/>
  <!-- bicchierino amaro -->
  <rect x="320" y="510" width="22" height="28" fill="${C.rossoS}" opacity="0.7"
        stroke="${C.nero}" stroke-width="1"/>
  <rect x="322" y="512" width="6" height="24" fill="${C.rosso}" opacity="0.5"/>
  <!-- insegna neon "APERTO" in alto dx -->
  <rect x="300" y="20" width="80" height="24" rx="3"
        fill="${C.nero}" stroke="${C.rosso}" stroke-width="2"/>
  <text x="340" y="37" text-anchor="middle" font-family="monospace"
        font-size="12" font-weight="bold" fill="${C.rosso}">APERTO</text>
  <!-- monete sparse -->
  <circle cx="100" cy="450" r="6" fill="${C.oro}" stroke="${C.oroS}" stroke-width="0.8" opacity="0.6"/>
  <circle cx="350" cy="430" r="5" fill="${C.oro}" stroke="${C.oroS}" stroke-width="0.8" opacity="0.6"/>
  <circle cx="270" cy="500" r="7" fill="${C.oro}" stroke="${C.oroS}" stroke-width="0.8" opacity="0.6"/>
</svg>`.trim();
};

/* ============================================================
   TEST: pannello visivo
   ============================================================ */
// Ritorna HTML completo standalone. Usare solo come documento a sé (srcdoc o file), mai via innerHTML in pagina.
SPRITES.test = function() {
  const semi = ['bastoni', 'coppe', 'denari', 'spade'];
  const valori = [1, 2, 3, 4, 5, 6, 7, 'fante', 'cavallo', 're'];
  const emotions = ['idle','happy','sad','angry','shocked','thinking','money','winking','dancing','sleeping'];
  const slots = ['cherry','lemon','bell','coin','seven','star','diamond'];
  const rarities = ['common','uncommon','rare','legendary'];
  const bosses = ['pulcinella','munaciello','janara','sangennaro','pazzariello','unknown'];

  const sezione = (titolo, contenuto) => `
    <section style="margin:24px 0; padding:16px; background:#0f3320;
      border:3px solid #f4c430; border-radius:8px;">
      <h2 style="color:#f4c430; font-family:monospace; margin-bottom:12px;
        text-shadow:1px 1px 0 #1a0a14;">${titolo}</h2>
      <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:flex-end;">
        ${contenuto}
      </div>
    </section>`;

  // Una carta per seme (asso)
  const assi = semi.map(s => SPRITES.card(s, 1)).join('');
  // Tutti i valori per uno stesso seme (denari)
  const tuttiDenari = valori.map(v => SPRITES.card('denari', v)).join('');
  // Tutti i semi con figura
  const figure = semi.map(s =>
    ['fante','cavallo','re'].map(v => SPRITES.card(s, v)).join('')
  ).join('');
  // Card back
  const backs = ['sm','md','lg'].map(sz => SPRITES.cardBack({size:sz})).join('');
  // Selected
  const selected = SPRITES.card('coppe', 're', { selected: true, size: 'lg' });

  // Gennarino tutte le emozioni
  const galli = emotions.map(e => `
    <div style="text-align:center; color:#fff8e7; font-family:monospace; font-size:11px;">
      ${SPRITES.gennarino(e, 80)}
      <div style="margin-top:4px;">${e}</div>
    </div>
  `).join('');

  // Slot symbols
  const slotsHTML = slots.map(s => `
    <div style="text-align:center; color:#fff8e7; font-family:monospace; font-size:11px;
      background:#1a0a14; padding:8px; border:2px solid #f4c430; border-radius:6px;">
      ${SPRITES.slotSymbol(s)}
      <div style="margin-top:4px;">${s}</div>
    </div>
  `).join('');

  // Joker per rarità
  const emojis = ['🃏','🪬','🔮','👑'];
  const bgs = ['#3a1a3e','#1a4d2e','#2a3a5e','#4a2a1e'];
  const jokers = rarities.map((r, i) => `
    <div style="text-align:center; color:#fff8e7; font-family:monospace; font-size:11px;">
      ${SPRITES.jokerCard(r, emojis[i], bgs[i])}
      <div style="margin-top:4px;">${r}</div>
    </div>
  `).join('');

  // Boss
  const bossNames = {
    pulcinella:'PULCINELLA NERO', munaciello:"'O MUNACIELLO",
    janara:"'A JANARA", sangennaro:'SAN GENNARO',
    pazzariello:"'O PAZZARIELLO", unknown:'??? BOSS ???'
  };
  const bossesHTML = bosses.map(b => `
    <div style="text-align:center;">${SPRITES.bossFrame(b, bossNames[b])}</div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8"/>
  <title>SPRITES TEST — Briscola Royale</title>
  <link rel="stylesheet" href="style.css"/>
  <style>
    body { background:#14702f; padding:20px; }
    h1 { color:#f4c430; font-family:monospace; text-align:center;
         text-shadow:2px 2px 0 #1a0a14, 0 0 12px #c77dff;
         font-size:32px; margin-bottom:16px; }
    h2 { font-size:16px; }
    .card-svg { margin:4px; }
  </style>
</head>
<body>
  <h1>★ SPRITES TEST — BRISCOLA ROYALE ★</h1>
  ${sezione('CARTE — Assi (uno per seme)', assi)}
  ${sezione('CARTE — Tutti i valori (Denari)', tuttiDenari)}
  ${sezione('CARTE — Figure (tutti i semi)', figure)}
  ${sezione('CARTE — Selected (Re di Coppe, large)', selected)}
  ${sezione('CARD BACK — sm / md / lg', backs)}
  ${sezione('GENNARINO — tutte le emozioni', galli)}
  ${sezione('SLOT SYMBOLS', slotsHTML)}
  ${sezione('JOKER CARDS — per rarità', jokers)}
  ${sezione('BOSS FRAMES', bossesHTML)}
</body>
</html>`.trim();
};
