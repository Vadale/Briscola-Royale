'use strict';
/* ============================================================
   BRISCOLA ROYALE — cards.js
   Modulo rendering carte e calcolo punteggi.
   - Funzioni di RENDERING: ritornano stringhe HTML/SVG da inserire nel DOM.
   - Funzioni di SCORING: PURE — nessun accesso al DOM, nessun side-effect
     su oggetti esterni se non l'oggetto ctx interno costruito da calculateScore.
   - Nessun import/export, vanilla JS, esposizione globale via window.Cards.
   ============================================================ */

// ================================================================
// ===== RENDERING ================================================
// ================================================================

/**
 * Ritorna stringa HTML per una singola carta.
 * @param {Object} card - { id, seme, valore, chips }
 * @param {Object} opts - { selected, size, index, faceDown }
 */
function renderCard(card, opts = {}) {
  const { selected = false, size = 'md', index = null, faceDown = false } = opts;

  const svg = faceDown
    ? SPRITES.cardBack({ size })
    : SPRITES.card(card.seme, card.valore, { selected, size });

  const dataAttrs = index !== null ? `data-index="${index}"` : '';
  const selClass = selected ? ' card-selected' : '';

  return `<div class="card-wrapper${selClass}" ${dataAttrs}
               data-id="${card.id}" data-seme="${card.seme}" data-valore="${card.valore}">
    ${svg}
    ${selected ? '<div class="card-select-indicator">✓</div>' : ''}
  </div>`;
}

/**
 * Ritorna stringa HTML per il dorso di una carta.
 */
function renderCardBack(opts = {}) {
  return `<div class="card-wrapper card-back">
    ${SPRITES.cardBack(opts)}
  </div>`;
}

/**
 * Ritorna HTML per la mano del giocatore.
 * @param {Array} cards - oggetti carta
 * @param {Set}   selectedIndices - Set di indici selezionati
 */
function renderHand(cards, selectedIndices = new Set()) {
  if (!cards || cards.length === 0) {
    return '<div class="hand-empty">Nessuna carta in mano</div>';
  }
  const cardsHtml = cards.map((card, i) =>
    renderCard(card, { selected: selectedIndices.has(i), size: 'md', index: i })
  ).join('');
  return `<div class="hand-cards">${cardsHtml}</div>`;
}

/**
 * Ritorna HTML per l'area delle carte giocate (sopra la mano, piccole, non cliccabili).
 */
function renderPlayedArea(cards) {
  if (!cards || cards.length === 0) return '<div class="played-empty"></div>';
  const cardsHtml = cards.map(c => renderCard(c, { size: 'sm' })).join('');
  return `<div class="played-cards">${cardsHtml}</div>`;
}

// ================================================================
// ===== SCORING (funzioni PURE — nessun accesso al DOM) ==========
// ================================================================

/**
 * Rileva la combinazione giocata.
 * Ordine di priorità (dalla più rara/specifica alla più generica):
 *   scopa > napoletana > napola_mista > briscola_reale > calabresella > carico
 *   > primiera > poker > bazzica > sette_e_mezzo > tris > coppia > single
 * @param {Array} playedCards
 * @param {Object} [semeCtx] - { briscolaSeme: string } opzionale per briscola_reale
 * @returns {string} nome combo
 */
function detectCombo(playedCards, semeCtx) {
  if (!playedCards || playedCards.length === 0) return 'single';
  const n = playedCards.length;
  const values = playedCards.map(c => c.valore);
  const semi = playedCards.map(c => c.seme);
  const uniqueValues = new Set(values);
  const uniqueSemi = new Set(semi);
  const figure = ['fante', 'cavallo', 're'];

  // Scopa: 5 carte stesso seme
  if (n === 5 && uniqueSemi.size === 1) return 'scopa';

  // Napoletana pura: A+2+3 stesso seme
  if (n === 3 && values.includes(1) && values.includes(2) && values.includes(3) && uniqueSemi.size === 1) return 'napoletana';

  // Napola mista: A+2+3 semi DIVERSI (≥2 semi diversi)
  if (n === 3 && values.includes(1) && values.includes(2) && values.includes(3) && uniqueSemi.size > 1) return 'napola_mista';

  // Briscola Reale: Asso + 1 carta dello stesso seme briscola (richiede semeCtx)
  if (n === 2 && semeCtx && semeCtx.briscolaSeme) {
    const bs = semeCtx.briscolaSeme;
    const allBriscola = playedCards.every(c => c.seme === bs);
    const hasAsso = values.includes(1);
    if (allBriscola && hasAsso) return 'briscola_reale';
  }

  // Calabresella: Re+Cavallo+Asso di semi diversi
  if (n === 3 && values.includes('re') && values.includes('cavallo') && values.includes(1) && uniqueSemi.size === 3) return 'calabresella';

  // Carico: 3 figure stesso seme
  if (n === 3 && values.every(v => figure.includes(v)) && uniqueSemi.size === 1) return 'carico';

  // Primiera: 1 carta per ogni seme (4 semi diversi)
  if (n === 4 && uniqueSemi.size === 4) return 'primiera';

  // Poker: 4 stesso valore
  if (n === 4 && uniqueValues.size === 1) return 'poker';

  // Bazzica: 5+6+7 qualsiasi seme
  if (n === 3) {
    const sorted = values.filter(v => typeof v === 'number').slice().sort((a,b)=>a-b);
    if (sorted.length === 3 && sorted[0] === 5 && sorted[1] === 6 && sorted[2] === 7) return 'bazzica';
  }

  // Sette e Mezzo: 2 carte il cui valore totale napoletano è ≤ 7.5
  if (n === 2) {
    const semVal = v => v === 7 ? 0.5 : figure.includes(v) ? 0.5 : (typeof v === 'number' ? v : 0);
    const tot = playedCards.reduce((s, c) => s + semVal(c.valore), 0);
    if (tot <= 7.5 && tot > 0) return 'sette_e_mezzo';
  }

  // Tris: 3 stesso valore
  if (n === 3 && uniqueValues.size === 1) return 'tris';

  // Coppia: 2 stesso valore
  if (n === 2 && uniqueValues.size === 1) return 'coppia';

  return 'single';
}

/**
 * Calcola il punteggio finale di una mano giocata.
 * FUNZIONE PURA: nessun accesso al DOM, nessuna mutation sugli input.
 *
 * Ordine di applicazione joker:
 *   1) trigger 'passive'         — all'inizio
 *   2) trigger 'on_card_scored'  — per ogni carta giocata, da sx a dx
 *   3) trigger 'on_hand_played'  — al termine
 *
 * @param {Array}  playedCards  - carte giocate [{id, seme, valore, chips}]
 * @param {Array}  jokers       - joker attivi [{id, trigger, effectCode, jokerState}]
 * @param {Object} modifiers    - { ante, briscolaSeme, handsPlayedThisRound,
 *                                  discardedThisRound, jokerCount, turnCount,
 *                                  money, jokerState, random }
 * @returns {Object} { chips, mult, total, combo, breakdown[] }
 */
function calculateScore(playedCards, jokers, modifiers) {
  // FASE 13 — Ordine joker (deterministico): on_round_start (già applicato prima del turno) -> passive -> on_card_scored (per ogni carta) -> on_hand_played. Joker contraddittori → ultimo vince.
  if (!playedCards || playedCards.length === 0) {
    return { chips: 0, mult: 1, total: 0, combo: 'single', breakdown: [] };
  }

  modifiers = modifiers || {};
  const bal = window.BALANCE;
  let combo = detectCombo(playedCards, { briscolaSeme: modifiers.briscolaSeme || null });
  const [comboChips, comboMultRaw] = bal.combos[combo] || [0, 1];

  // Boss invert_combo_mult: inverti i moltiplicatori delle combo (Befana de Roma)
  let comboMult = comboMultRaw;
  if (modifiers.invertComboMult) {
    const invertMap = { single: 10, coppia: 8, tris: 7, poker: 3, napoletana: 2, carico: 5, primiera: 4, scopa: 1,
      bazzica: 5, briscola_reale: 7, calabresella: 4, sette_e_mezzo: 5, napola_mista: 3 };
    comboMult = invertMap[combo] != null ? invertMap[combo] : comboMultRaw;
  }

  // ctx condiviso per tutti i joker — campo jokerState persistente per run
  const ctx = {
    chips: comboChips,
    mult: comboMult,
    played: playedCards,
    scored: [],
    combo,
    ante: modifiers.ante || 1,
    briscolaSeme: modifiers.briscolaSeme || null,
    handsPlayedThisRound: modifiers.handsPlayedThisRound || 0,
    discardedThisRound: modifiers.discardedThisRound || 0,
    jokerCount: jokers ? jokers.length : 0,
    jokerState: modifiers.jokerState || {},
    turnCount: modifiers.turnCount || 0,
    money: modifiers.money || 0,
    // Nuovi modifiers per Mazzetti (Bicchiere d'Amaro, Pulcinella Bianco, Capodanno, Sfizio)
    handsLeft: modifiers.handsLeft || 0,         // mani rimanenti DOPO questa
    discardsLeft: modifiers.discardsLeft || 0,
    blindType: modifiers.blindType || 'small',
    runScore: modifiers.runScore || 0,
    maxDiscards: modifiers.maxDiscards || 3,
    handSize: modifiers.handSize || 5,
    // ctx.random è iniettato qui per tarocchi e joker (determinismo)
    random: modifiers.random || Math.random,
  };

  // Boss no_new_combos: solo coppia/tris/single danno punti.
  // Le altre combo vengono forzate a "single" (mult/chips di single).
  if (modifiers.noNewCombos && !['single', 'coppia', 'tris'].includes(ctx.combo)) {
    const forcedBase = bal.combos['single'] || [0, 1];
    ctx.chips = forcedBase[0];
    ctx.mult = forcedBase[1];
    ctx.combo = 'single';
    combo = 'single';
    comboMult = forcedBase[1];
  }

  const breakdown = [];

  // FASE 1: joker PASSIVE (all'inizio, prima di tutto)
  if (jokers) {
    jokers.filter(j => j.trigger === 'passive').forEach(j => {
      const chipsBefore = ctx.chips;
      const multBefore = ctx.mult;
      applyJokerEffect(j, ctx, 'passive');
      if (ctx.chips !== chipsBefore || ctx.mult !== multBefore) {
        breakdown.push({
          type: 'joker', id: j.id, phase: 'passive',
          chips: ctx.chips - chipsBefore, mult: ctx.mult - multBefore
        });
      }
    });
  }

  // Bonus round (joker on_round_start: alba_napoletana) applicati come flat all'inizio
  if (modifiers.roundChipsBonus) ctx.chips += modifiers.roundChipsBonus;
  if (modifiers.roundMultBonus) ctx.mult += modifiers.roundMultBonus;

  // FASE 2: chip per ogni carta + joker on_card_scored
  playedCards.forEach(card => {
    let cardChips = bal.cardChips[card.valore] || 0;
    // Boss overrides per chip carta
    const isFigura = ['fante', 'cavallo', 're'].includes(card.valore);
    if (modifiers.noFigureBonus && isFigura) cardChips = 0;
    if (modifiers.onlyNumbers && isFigura) cardChips = 0;
    if (modifiers.noAssoChips && card.valore === 1) cardChips = 0;
    if (modifiers.halfDenari && card.seme === 'denari') cardChips = Math.floor(cardChips / 2);
    ctx.chips += cardChips;

    // Settebello bonus
    if (card.valore === 7 && card.seme === 'denari') {
      ctx.chips += bal.settebelloBonus;
      breakdown.push({ type: 'settebello', value: bal.settebelloBonus });
    }

    // Briscola di seme bonus
    if (ctx.briscolaSeme && card.seme === ctx.briscolaSeme) {
      ctx.chips += bal.briscolaPerCard;
      breakdown.push({ type: 'briscola', card: card.id, value: bal.briscolaPerCard });
    }

    ctx.card = card;
    ctx.scored.push(card);

    if (jokers) {
      jokers.filter(j => j.trigger === 'on_card_scored').forEach(j => {
        const chipsBefore = ctx.chips;
        const multBefore = ctx.mult;
        applyJokerEffect(j, ctx, 'on_card_scored');
        if (ctx.chips !== chipsBefore || ctx.mult !== multBefore) {
          breakdown.push({
            type: 'joker', id: j.id, card: card.id,
            chips: ctx.chips - chipsBefore, mult: ctx.mult - multBefore
          });
        }
      });
    }
  });
  delete ctx.card;

  // FASE 3: joker on_hand_played
  if (jokers) {
    jokers.filter(j => j.trigger === 'on_hand_played').forEach(j => {
      const chipsBefore = ctx.chips;
      const multBefore = ctx.mult;
      applyJokerEffect(j, ctx, 'on_hand_played');
      if (ctx.chips !== chipsBefore || ctx.mult !== multBefore) {
        breakdown.push({
          type: 'joker', id: j.id,
          chips: ctx.chips - chipsBefore, mult: ctx.mult - multBefore
        });
      }
    });
  }

  // Boss half_chips: dimezza i chip dopo tutti i calcoli
  if (modifiers.halfChips) ctx.chips = Math.floor(ctx.chips / 2);
  // Leone zodiac: prima mano del round dà chips ×1.5
  if (modifiers.leoneFirstHand) ctx.chips = Math.floor(ctx.chips * 1.5);

  // Assicura valori minimi
  ctx.chips = Math.max(0, ctx.chips);
  ctx.mult = Math.max(1, ctx.mult);
  const total = Math.floor(ctx.chips * ctx.mult);

  // Usa ctx.combo (può essere stato forzato da no_new_combos)
  const finalCombo = ctx.combo || combo;
  const finalComboBase = bal.combos[finalCombo] || [0, 1];
  breakdown.unshift({
    type: 'combo', name: finalCombo,
    chips: finalComboBase[0], mult: comboMult
  });

  return { chips: ctx.chips, mult: ctx.mult, total, combo: finalCombo, breakdown, money: ctx.money, jokerState: ctx.jokerState };
}

/**
 * Esegue l'effectCode di un joker in modo isolato tramite new Function.
 * `ctx` è l'unico oggetto a cui il codice ha accesso (oltre a globali std come Math).
 * Errori vengono loggati in console.warn ma NON propagati.
 */
function applyJokerEffect(joker, ctx, phase) {
  if (!joker || !joker.effectCode) return;
  try {
    // new Function crea uno scope isolato — ctx è l'unico parametro
    const fn = new Function('ctx', joker.effectCode);
    fn(ctx);
  } catch (e) {
    console.warn('[Joker] errore in', joker.id, ':', e.message);
  }
}

// ================================================================
// ===== UTILS ====================================================
// ================================================================

/**
 * Fisher-Yates shuffle. Ritorna nuovo array, NON muta l'originale.
 */
function shuffleDeck(deck, rng) {
  const d = [...deck];
  const r = (typeof rng === 'function') ? rng : Math.random;
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/**
 * Estrae n carte dall'inizio del mazzo (muta l'array passato via splice).
 * Ritorna { drawn: [], remaining: [] }.
 */
function drawCards(deck, n) {
  const drawn = deck.splice(0, n);
  return { drawn, remaining: deck };
}

// ================================================================
// ===== TEST SMOKE ===============================================
// ================================================================

// Verifica calculateScore con carte note. Eseguire da console: window._testCards()
window._testCards = function () {
  if (!window.BALANCE || !window.DECK_NAPOLI) {
    console.warn('[cards] BALANCE o DECK_NAPOLI non caricati');
    return;
  }
  const asso = DECK_NAPOLI.find(c => c.seme === 'denari' && c.valore === 1);
  const due  = DECK_NAPOLI.find(c => c.seme === 'denari' && c.valore === 2);
  const tre  = DECK_NAPOLI.find(c => c.seme === 'denari' && c.valore === 3);
  const res  = calculateScore([asso, due, tre], [], { ante: 1, briscolaSeme: 'denari' });
  // combo=napoletana [50chips, 8mult]
  // card chips: asso(11) + due(0) + tre(10) = 21
  // briscola: +5 * 3 carte di denari = 15
  // ctx.chips = 50 + 21 + 15 = 86, mult = 8 → total = 688
  console.log('[cards test] napoletana denari ->', res);
  console.assert(res.combo === 'napoletana', 'combo deve essere napoletana');
  console.assert(res.mult === 8, 'mult napoletana deve essere 8');
  console.assert(res.chips === 86, 'chips devono essere 86 (50+21+15)');
  console.assert(res.total === 688, 'total deve essere 688 (86*8)');
  console.log('[cards test] OK');
};

// ================================================================
// ===== ESPOSIZIONE GLOBALE ======================================
// ================================================================
window.Cards = {
  renderCard, renderCardBack, renderHand, renderPlayedArea,
  detectCombo, calculateScore, applyJokerEffect,
  shuffleDeck, drawCards
};

// Test edge cases (Fase 13) — eseguiti solo in debug mode (window.SN_DEBUG = true)
// oppure manualmente: window._testCardsEdge()
window._testCardsEdge = function () {
  console.assert(shuffleDeck([]).length === 0, 'shuffleDeck([]) deve essere []');

  try {
    const r0 = calculateScore([], [], {});
    console.assert(r0 && typeof r0.total === 'number', 'calculateScore([]) non deve crashare');
  } catch(e) { console.error('[cards test] calculateScore([]) ha crashato:', e); }

  // Joker contraddittori — NOTA: il codebase usa `valore`, non `value`
  try {
    const mockHalf   = { id: 'test_half',   trigger: 'on_hand_played', effectCode: 'ctx.chips = Math.floor(ctx.chips / 2);' };
    const mockDouble = { id: 'test_double', trigger: 'on_hand_played', effectCode: 'ctx.chips = ctx.chips * 2;' };
    const d3 = [{ valore: 1, seme: 'spade' }, { valore: 2, seme: 'spade' }, { valore: 3, seme: 'spade' }];
    const rC = calculateScore(d3, [mockHalf, mockDouble], {});
    console.assert(Number.isFinite(rC.total), 'joker contraddittori: total deve essere finito');
    console.log('[cards test] joker contraddittori (half→double) ->', rC.total);
  } catch(e) { console.error('[cards test] joker contraddittori ha crashato:', e); }

  const mk = (vals, seme) => vals.map(v => ({ valore: v, seme }));
  const assert = (combo, cards, msg) => console.assert(calculateScore(cards, [], {}).combo === combo, msg);

  assert('scopa',        mk([1,2,3,4,5], 'coppe'),        'scopa: 5 stesso seme');
  assert('napoletana',   mk([1,2,3], 'spade'),             'napoletana: A+2+3 stesso seme');
  assert('primiera',     [{ valore:7, seme:'denari' }, { valore:6, seme:'coppe' }, { valore:5, seme:'spade' }, { valore:4, seme:'bastoni' }], 'primiera: 4 semi diversi');
  assert('coppia',       [{ valore:7, seme:'denari' }, { valore:7, seme:'coppe' }], 'coppia: 2 stesso valore');
  assert('sette_e_mezzo',[{ valore:4, seme:'denari' }, { valore:3, seme:'coppe' }], 'sette_e_mezzo: 4+3');
  assert('single',       [{ valore:5, seme:'bastoni' }],   'single: 1 carta');

  console.log('[cards] _testCardsEdge: tutti i test passati.');
};

if (window.SN_DEBUG) window._testCardsEdge();
