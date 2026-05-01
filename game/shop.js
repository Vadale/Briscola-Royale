'use strict';
/* ============================================================
   BRISCOLA ROYALE — shop.js
   Negozio tra blind: joker, tarocchi, pacchetti, reroll, lootbox.
   Meta-shop premium fake (DEMO MODE) e Battle Pass XP.
   - Stato modulo non globale (chiuso in _shop).
   - Tutti i numeri letti da BALANCE.
   - Nessun setInterval per animazioni: solo rAF / setTimeout puntuali.
   - Tutti i testi dinamici passano per _escape().
   ============================================================ */

// i18n helpers per joker/mazzetti/tarocchi
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

// ============================================================
// STATO MODULO
// ============================================================
let _shop = {
  jokers: [],   // { joker, price, sold, free }
  tarots: [],   // { tarot, price, sold }
  packs: [],    // { type, price, sold }
  rerollCount: 0,
  slotPlaysThisVisit: 0,
  upsellShownThisSession: false,
};

// Bottoni / delegazione: wirati una volta sola
let _shopWired = false;

// Contatore incrementale per ID carta univoci
let _idCounter = 0;

// Costanti UI ricavate da BALANCE per non duplicare magic numbers
const LOOTBOX_TIERS = ['iniziato', 'adepto', 'maestro'];
const LOOTBOX_LABELS = {
  iniziato: { name: 'Iniziato', emoji: '📦' },
  adepto:   { name: 'Adepto',   emoji: '📦' },
  maestro:  { name: 'Maestro',  emoji: '📦' },
};
const RARITY_BORDER = {
  common:    '#9e9e9e',
  uncommon:  '#4caf50',
  rare:      '#2196f3',
  legendary: '#f4c430',
};

// Soglie disponibilità lootbox in shop (evitano di mostrare bottoni inutilizzabili)
const LOOTBOX_VISIBILITY_THRESHOLDS = {
  iniziato: 0,
  adepto: 80,
  maestro: 200,
};

// Ricompense Battle Pass per livello (estratte da monetization.md, solo ducati per ora).
// Indice = livello raggiunto. 0 = nessuna ricompensa diretta (è il livello base).
const BATTLE_PASS_REWARDS = {
  1: { ducati: 20 }, 3: { ducati: 20 }, 5: { ducati: 20 },
  9: { ducati: 50 }, 14: { ducati: 50 }, 15: { ducati: 50 },
  21: { ducati: 20 }, 22: { ducati: 20 }, 23: { ducati: 20 }, 24: { ducati: 20 }, 25: { ducati: 20 },
  29: { ducati: 100 },
  30: { ducati: 200 },
};

const PACK_LABEL = { small: 'Piccolo', medium: 'Medio', large: 'Grande' };
const PACK_CARDS_QTY = { small: 2, medium: 3, large: 4 };

// ============================================================
// HELPERS
// ============================================================

function _escape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _ensurePity() {
  if (!STATE.meta.lootboxPity || typeof STATE.meta.lootboxPity !== 'object') {
    STATE.meta.lootboxPity = { sinceRare: 0, sinceLegendary: 0 };
  }
  if (typeof STATE.meta.lootboxPity.sinceRare !== 'number') STATE.meta.lootboxPity.sinceRare = 0;
  if (typeof STATE.meta.lootboxPity.sinceLegendary !== 'number') STATE.meta.lootboxPity.sinceLegendary = 0;
}

function _ensureBattlePass() {
  if (typeof STATE.meta.battlePassLevel !== 'number' || !Number.isFinite(STATE.meta.battlePassLevel)) {
    STATE.meta.battlePassLevel = 0;
  }
  if (typeof STATE.meta.battlePassXp !== 'number' || !Number.isFinite(STATE.meta.battlePassXp)) {
    STATE.meta.battlePassXp = 0;
  }
}

function _rerollCost() {
  // Reroll: rerollBase × 2^n (raddoppia ogni reroll)
  return BALANCE.rerollBase * Math.pow(2, _shop.rerollCount);
}

function _rarityColor(rarity) {
  return RARITY_BORDER[rarity] || RARITY_BORDER.common;
}

function _toast(msg, type) { try { toast(msg, type || 'info'); } catch (e) {} }

function _gennarino(reaction) {
  if (window.Gennarino && typeof Gennarino.react === 'function') {
    try { Gennarino.react(reaction); } catch (e) {}
  }
}

function _beep(freq, dur, type, vol) {
  if (window.SN_Audio && typeof SN_Audio.beep === 'function') {
    try { SN_Audio.beep(freq, dur, type, vol); } catch (e) {}
  }
}

// ============================================================
// GENERAZIONE OFFERTE SHOP
// ============================================================

function _weightedJokerDrop(excludeIds) {
  // Scorpione zodiac: rare +2%, redistribuisci proporzionalmente.
  const run = STATE.currentRun;
  const base = BALANCE.jokerDropRates;
  let rates;
  if (run && run.zodiacFlag_scorpione) {
    const bonus = 0.02;
    const others = base.common + base.uncommon + base.legendary;
    const scale = others > 0 ? (others - bonus) / others : 1;
    rates = {
      common:    base.common * scale,
      uncommon:  base.uncommon * scale,
      rare:      base.rare + bonus,
      legendary: base.legendary * scale,
    };
  } else {
    rates = base;
  }

  const r = Math.random();
  let chosenRarity;
  if (r < rates.legendary) chosenRarity = 'legendary';
  else if (r < rates.legendary + rates.rare) chosenRarity = 'rare';
  else if (r < rates.legendary + rates.rare + rates.uncommon) chosenRarity = 'uncommon';
  else chosenRarity = 'common';

  // Scala alla rarità inferiore se esaurita
  const order = ['legendary', 'rare', 'uncommon', 'common'];
  let idx = order.indexOf(chosenRarity);
  for (; idx < order.length; idx++) {
    const pool = JOKERS.filter(j => j.rarity === order[idx] && !excludeIds.has(j.id));
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  // Fallback: qualunque joker non escluso
  const all = JOKERS.filter(j => !excludeIds.has(j.id));
  return all.length > 0 ? all[Math.floor(Math.random() * all.length)] : JOKERS[0];
}

function generateShopItems() {
  const run = STATE.currentRun;
  if (!run) return;

  _shop.jokers = [];
  _shop.tarots = [];
  _shop.packs = [];

  // ---- JOKERS ----
  const owned = new Set(run.jokers.map(j => j.id));
  // Tarocco "forza": prossimo joker gratis
  const hasForzaConsumable = (run.consumables || []).some(c => c && c.id === 'forza');
  let nextFreeApplied = false;

  for (let i = 0; i < BALANCE.shopJokersVisible; i++) {
    const joker = _weightedJokerDrop(owned);
    if (!joker) break;
    owned.add(joker.id);
    let price = BALANCE.jokerCost[joker.rarity] || BALANCE.jokerCost.common;
    let free = false;
    if (hasForzaConsumable && !nextFreeApplied && i === 0) {
      price = 0;
      free = true;
      nextFreeApplied = true;
    }
    _shop.jokers.push({ joker, price, sold: false, free });
  }

  // Track seen jokers per la collezione (offerti nello shop)
  if (window.STATE && window.STATE.meta) {
    const seen = STATE.meta.seenJokers = Array.isArray(STATE.meta.seenJokers) ? STATE.meta.seenJokers : [];
    _shop.jokers.forEach(it => {
      const j = it && it.joker;
      if (j && typeof j.id === 'string' && j.id.length > 0 && j.id.length < 64 && seen.indexOf(j.id) === -1 && seen.length < 200) {
        seen.push(j.id);
      }
    });
  }

  // ---- TAROTS ----
  const tarotCost = BALANCE.tarotCost - (run.zodiacFlag_pesci ? 1 : 0);
  const tarotPool = TAROTS.slice();
  for (let i = 0; i < BALANCE.shopTarotsVisible && tarotPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * tarotPool.length);
    const tarot = tarotPool.splice(idx, 1)[0];
    _shop.tarots.push({ tarot, price: Math.max(0, tarotCost), sold: false });
  }

  // ---- PACKS ----
  const packTypes = ['small', 'medium', 'large'];
  for (let i = 0; i < BALANCE.shopPacksVisible; i++) {
    const type = packTypes[Math.floor(Math.random() * packTypes.length)];
    const price = BALANCE.packCost[type];
    _shop.packs.push({ type, price, sold: false });
  }
}

// ============================================================
// RENDERING
// ============================================================

function _renderJokerCardSprite(joker) {
  const staticDef = JOKERS.find(j => j.id === joker.id) || joker;
  const bg = (staticDef.art && staticDef.art.bg) || '#3a1a3e';
  const icon = (staticDef.art && staticDef.art.icon) || staticDef.emoji || '?';
  if (window.SPRITES && typeof SPRITES.jokerCard === 'function') {
    return SPRITES.jokerCard(joker.rarity, icon, bg);
  }
  // Fallback puro: NIENTE bg interpolato in style — usa colore hardcoded sicuro.
  return `<div class="joker-fallback">${_escape(icon)}</div>`;
}

function renderShop() {
  const run = STATE.currentRun;
  if (!run) return;

  // Coins display
  const coinsEl = document.getElementById('shop-coins-display');
  if (coinsEl) coinsEl.textContent = run.money;

  // ---- JOKERS ----
  const jokerEl = document.getElementById('shop-jokers');
  if (jokerEl) {
    const html = _shop.jokers.map((it, idx) => {
      if (it.sold) {
        return `<div class="shop-item shop-item-sold" aria-disabled="true"><div class="shop-sold-label">VENDUTO</div></div>`;
      }
      const j = it.joker;
      const unaffordable = run.money < it.price;
      const cls = ['shop-item', 'shop-item-joker'];
      if (unaffordable) cls.push('shop-item-unaffordable');
      const priceLabel = it.free
        ? `<span class="shop-price shop-price-free">GRATIS</span>`
        : `<span class="shop-price">$${it.price}</span>`;
      return `
        <div class="${cls.join(' ')}" data-shop-type="joker" data-shop-idx="${idx}" role="button" tabindex="0">
          <div class="shop-item-art">${_renderJokerCardSprite(j)}</div>
          <div class="shop-item-name">${_escape(_jName(j))}</div>
          <div class="shop-item-desc">${_escape(_jDesc(j))}</div>
          <div class="shop-item-rarity rarity-${_escape(j.rarity)}">${_escape((j.rarity || '').toUpperCase())}</div>
          ${priceLabel}
        </div>`;
    }).join('');
    jokerEl.innerHTML = html || '<div class="shop-empty">Niente jolly stavolta, guagliò.</div>';
  }

  // ---- TAROTS ----
  const tarotEl = document.getElementById('shop-tarots');
  if (tarotEl) {
    const html = _shop.tarots.map((it, idx) => {
      if (it.sold) {
        return `<div class="shop-item shop-item-sold" aria-disabled="true"><div class="shop-sold-label">VENDUTO</div></div>`;
      }
      const t = it.tarot;
      const unaffordable = run.money < it.price;
      const cls = ['shop-item', 'shop-item-tarot'];
      if (unaffordable) cls.push('shop-item-unaffordable');
      return `
        <div class="${cls.join(' ')}" data-shop-type="tarot" data-shop-idx="${idx}" role="button" tabindex="0">
          <div class="shop-item-art shop-tarot-emoji">${_escape(t.emoji || '🔮')}</div>
          <div class="shop-item-name">${_escape(_jName(t))}</div>
          <div class="shop-item-desc">${_escape(_jDesc(t))}</div>
          <span class="shop-price">$${it.price}</span>
        </div>`;
    }).join('');
    tarotEl.innerHTML = html || '<div class="shop-empty">Tarocchi finiti.</div>';
  }

  // ---- PACKS + LOOTBOX ----
  const packEl = document.getElementById('shop-packs');
  if (packEl) {
    const packsHtml = _shop.packs.map((it, idx) => {
      if (it.sold) {
        return `<div class="shop-item shop-item-sold" aria-disabled="true"><div class="shop-sold-label">APERTO</div></div>`;
      }
      const unaffordable = run.money < it.price;
      const cls = ['shop-item', 'shop-item-pack'];
      if (unaffordable) cls.push('shop-item-unaffordable');
      const cards = PACK_CARDS_QTY[it.type] || 2;
      return `
        <div class="${cls.join(' ')}" data-shop-type="pack" data-shop-idx="${idx}" role="button" tabindex="0">
          <div class="shop-item-art shop-pack-emoji">📦</div>
          <div class="shop-item-name">Pacchetto ${_escape(PACK_LABEL[it.type] || it.type)}</div>
          <div class="shop-item-desc">${cards} carte aggiunte al mazzo</div>
          <span class="shop-price">$${it.price}</span>
        </div>`;
    }).join('');

    // Lootbox section
    _ensurePity();
    const pity = STATE.meta.lootboxPity;
    const sinceRareLeft = Math.max(0, BALANCE.pityRare - pity.sinceRare);
    const sinceLegendaryLeft = Math.max(0, BALANCE.pityLegendary - pity.sinceLegendary);
    const lootHtml = LOOTBOX_TIERS
      .filter(tier => run.money >= LOOTBOX_VISIBILITY_THRESHOLDS[tier] || tier === 'iniziato')
      .map(tier => {
        const cfg = BALANCE.lootbox[tier];
        const label = LOOTBOX_LABELS[tier];
        const unaffordable = run.money < cfg.cost;
        const cls = ['shop-item', 'shop-item-lootbox', `shop-lootbox-${tier}`];
        if (unaffordable) cls.push('shop-item-unaffordable');
        const ratesTooltip = `Common: ${Math.round(cfg.common*100)}% | Uncommon: ${Math.round(cfg.uncommon*100)}% | Rare: ${Math.round(cfg.rare*100)}% | Legendary: ${Math.round(cfg.legendary*100)}%`;
        return `
          <div class="${cls.join(' ')}" data-lootbox-tier="${_escape(tier)}" role="button" tabindex="0" title="${_escape(ratesTooltip)}">
            <div class="shop-item-art shop-lootbox-emoji">${_escape(label.emoji)}</div>
            <div class="shop-item-name">Lootbox ${_escape(label.name)}</div>
            <div class="shop-item-desc">${cfg.cards} carte · vedi % al passaggio</div>
            <div class="shop-lootbox-rates">${_escape(ratesTooltip)}</div>
            <span class="shop-price">$${cfg.cost}</span>
          </div>`;
      }).join('');

    const pityHtml = `
      <div class="shop-pity">
        <span class="shop-pity-label">🎯 Garanzie:</span>
        <span class="shop-pity-line">Rare tra <strong>${sinceRareLeft}</strong> aperture</span>
        <span class="shop-pity-line">Legendary tra <strong>${sinceLegendaryLeft}</strong> aperture</span>
      </div>`;

    packEl.innerHTML = `
      <div class="shop-packs-row">${packsHtml}</div>
      <h3 class="shop-section-title shop-section-title-lootbox">LOOTBOX</h3>
      <div class="shop-lootbox-row">${lootHtml}</div>
      ${pityHtml}
    `;
  }

  // ---- REROLL BUTTON ----
  const rerollBtn = document.getElementById('btn-reroll');
  if (rerollBtn) {
    const cost = _rerollCost();
    const reachedCap = _shop.rerollCount >= BALANCE.maxRerollsPerShop;
    const broke = run.money < cost;
    if (reachedCap) {
      rerollBtn.textContent = 'BASTA RILANCI';
      rerollBtn.title = 'Limite rilanci raggiunto';
    } else {
      rerollBtn.textContent = `RILANCIA ($${cost})`;
      rerollBtn.title = broke ? 'Ducati insufficienti' : '';
    }
    rerollBtn.disabled = reachedCap || broke;
  }
}

// ============================================================
// API: Shop.open
// ============================================================

function shopOpen() {
  const run = STATE.currentRun;
  if (!run) return;

  _shop.rerollCount = 0;
  _shop.slotPlaysThisVisit = 0;

  _ensurePity();
  _ensureBattlePass();

  generateShopItems();
  _wireShop();
  renderShop();

  // Resetta contatori visita bonus (slot plays, ecc.)
  if (window.Bonus && typeof Bonus.resetVisit === 'function') Bonus.resetVisit();

  _toast('Hai vinto il Boss Blind! 🎉 Che vuoi comprare, guagliò?', 'success');
  _gennarino('shop_open');
}

// ============================================================
// API: Shop.buyItem
// ============================================================

function _showJokerSwapPopup(newItem, shopIdx, shopType) {
  const run = STATE.currentRun;
  if (!run) return;
  const newJoker = newItem.joker;

  const slotsHtml = run.jokers.map((j, i) => {
    const staticDef = window.JOKERS ? (JOKERS.find(jd => jd.id === j.id) || j) : j;
    return `<div class="joker-swap-slot">
      <div class="joker-swap-info">
        <strong>${_escape(_jName(staticDef))}</strong>
        <span class="joker-swap-rarity rarity-${_escape(j.rarity)}">${_escape((j.rarity || '').toUpperCase())}</span>
        <small>${_escape(_jDesc(staticDef))}</small>
      </div>
      <button class="btn-arcade btn-small btn-discard" data-sell-idx="${i}">VENDI</button>
    </div>`;
  }).join('');

  const html = `<div class="joker-swap-popup">
    <h3>SLOT JOLLY PIENI!</h3>
    <div class="joker-swap-new">
      <p>Nuovo jolly: <strong>${_escape(_jName(newJoker))}</strong></p>
      <p>${_escape(_jDesc(newJoker))}</p>
    </div>
    <p class="swap-hint">Vendi un jolly per fare spazio (nessun rimborso):</p>
    <p style="color:#e63946;font-size:9px;font-family:var(--font-pixel)">💸 VALORE: 0 ducati (nessun rimborso)</p>
    <div class="joker-swap-list">${slotsHtml}</div>
    <button class="btn-arcade btn-small" data-popup-close="cancel">ANNULLA</button>
  </div>`;

  if (typeof popup !== 'function') return;

  popup(html).then(() => {
    const box = document.getElementById('popup-box');
    if (box) box.removeEventListener('click', _swapHandler);
  });

  const box = document.getElementById('popup-box');
  if (!box) return;

  function _swapHandler(ev) {
    const btn = ev.target.closest('[data-sell-idx]');
    if (!btn) return;
    const sellIdx = parseInt(btn.dataset.sellIdx, 10);
    if (!Number.isInteger(sellIdx)) return;
    run.jokers.splice(sellIdx, 1);
    _toast(`Jolly venduto!`, 'info');
    if (typeof closePopup === 'function') closePopup();
    box.removeEventListener('click', _swapHandler);
    shopBuyItem(shopType, shopIdx);
  }
  box.addEventListener('click', _swapHandler);
}

function shopBuyItem(type, idx) {
  const run = STATE.currentRun;
  if (!run) return;
  if (!Number.isInteger(idx) || idx < 0) return;

  let item, price;
  if (type === 'joker')      { item = _shop.jokers[idx]; }
  else if (type === 'tarot') { item = _shop.tarots[idx]; }
  else if (type === 'pack')  { item = _shop.packs[idx]; }
  else return;

  if (!item || item.sold) return;
  price = item.price;

  if (run.money < price) {
    const diff = price - run.money;
    _toast(`Ti mancano ${diff}💰!`, 'error');
    if (!_shop.upsellShownThisSession) {
      _shop.upsellShownThisSession = true;
      setTimeout(() => {
        _toast(`Ti mancano ${diff}💰. Con il Jackpot Pack avresti 1500💰! (DEMO)`, 'info');
      }, 500);
    }
    return;
  }

  if (type === 'joker') {
    const maxSlots = run.maxJokerSlots || BALANCE.maxJokerSlots;
    if (run.jokers.length >= maxSlots) {
      _showJokerSwapPopup(item, idx, type);
      return;
    }
    const j = item.joker;
    // Aggiungi una copia minimal al run.jokers (riferimenti art letti dal catalogo statico in render)
    run.jokers.push({
      id: j.id,
      name: j.name,
      emoji: j.emoji,
      rarity: j.rarity,
      description: j.description,
      trigger: j.trigger,
      effectCode: j.effectCode,
    });
    run.money -= price;
    run.moneySpent = (run.moneySpent || 0) + price;
    run.jokersBought = (run.jokersBought || 0) + 1;
    item.sold = true;

    // Consuma flag forza se applicato
    if (item.free) {
      run.consumables = (run.consumables || []).filter(c => !c || c.id !== 'forza');
    }
    _gennarino('joker_buy');
    _beep(660, 0.08, 'square', 0.3);
  }
  else if (type === 'tarot') {
    if (!Array.isArray(run.consumables)) run.consumables = [];
    const maxConsumables = BALANCE.maxConsumables || 2;
    if (run.consumables.length >= maxConsumables) {
      _toast(`Hai già ${maxConsumables} tarocchi!`, 'error');
      return;
    }
    run.consumables.push({
      id: item.tarot.id,
      name: item.tarot.name,
      emoji: item.tarot.emoji,
      description: item.tarot.description,
      effectCode: item.tarot.effectCode,
    });
    run.money -= price;
    run.moneySpent = (run.moneySpent || 0) + price;
    item.sold = true;
    _gennarino('shop_open');
    _beep(550, 0.08, 'sine', 0.3);
  }
  else if (type === 'pack') {
    run.money -= price;
    run.moneySpent = (run.moneySpent || 0) + price;
    item.sold = true;
    _openPack(item.type);
    _beep(440, 0.1, 'triangle', 0.3);
  }

  // Update HUD del game (anche se nascosto, mantiene coerenza)
  if (window.Game && typeof Game.updateHUD === 'function') {
    try { Game.updateHUD(); } catch (e) {}
  }
  renderShop();
  saveState();
}

// ============================================================
// PACK OPENING
// ============================================================

function _openPack(type) {
  const run = STATE.currentRun;
  if (!run) return;
  if (!Array.isArray(DECK_NAPOLI) || DECK_NAPOLI.length === 0) return;
  const qty = PACK_CARDS_QTY[type] || 2;

  // Pesca carte da DECK_NAPOLI con duplicati permessi (mazzo deckbuilder)
  // Genera id univoco per evitare collisioni con carte esistenti.
  const newCards = [];
  for (let i = 0; i < qty; i++) {
    const tpl = DECK_NAPOLI[Math.floor(Math.random() * DECK_NAPOLI.length)];
    const uniq = `${tpl.id}_pack_${Date.now()}_${++_idCounter}_${i}`;
    newCards.push({ id: uniq, seme: tpl.seme, valore: tpl.valore, chips: tpl.chips });
  }
  // Aggiungi al mazzo (saranno mischiate al prossimo shuffle del nuovo blind)
  run.deck = (run.deck || []).concat(newCards);
  // Aggiorna playerCards — persiste tra i blind
  if (!Array.isArray(run.playerCards)) run.playerCards = DECK_NAPOLI.map(c => ({ ...c }));
  run.playerCards = run.playerCards.concat(newCards);

  // Popup di rivelazione
  const reveal = newCards.map((c, i) => {
    const strIt = (typeof STRINGS !== 'undefined' && STRINGS.it) || {};
    const semeLabel = strIt[c.seme] || c.seme;
    const valoreLabel = c.valore === 1 ? 'Asso' : (strIt[c.valore] || c.valore);
    return `<div class="pack-card-reveal" style="animation-delay:${i*200}ms">
      <div class="pack-card-front">
        <div class="pack-card-value">${_escape(valoreLabel)}</div>
        <div class="pack-card-seme">${_escape(semeLabel)}</div>
      </div>
    </div>`;
  }).join('');

  const html = `
    <div class="pack-open">
      <h3>📦 PACCHETTO ${_escape((PACK_LABEL[type] || type).toUpperCase())}</h3>
      <p class="pack-subtitle">+${qty} carte nel mazzo, fratello!</p>
      <div class="pack-cards-row">${reveal}</div>
      <button class="btn-arcade" data-popup-close="ok">PRENDI TUTTO</button>
    </div>`;
  if (typeof popup === 'function') popup(html);

  _toast(`+${qty} carte aggiunte al mazzo!`, 'success');
  _beep(880, 0.1, 'sine', 0.3);
}

// ============================================================
// API: Shop.reroll
// ============================================================

function shopReroll() {
  const run = STATE.currentRun;
  if (!run) return;

  if (_shop.rerollCount >= BALANCE.maxRerollsPerShop) {
    _toast("Basta! Mo' stai esagerando!", 'error');
    _gennarino('angry');
    return;
  }

  // Acquario zodiac: primo reroll gratis per visita
  const cost = (run.zodiacFlag_acquario && _shop.rerollCount === 0) ? 0 : _rerollCost();

  if (run.money < cost) {
    _toast('Ti mancano ducati per il reroll!', 'error');
    return;
  }

  run.money -= cost;
  run.moneySpent = (run.moneySpent || 0) + cost;
  _shop.rerollCount += 1;

  generateShopItems();
  renderShop();
  _gennarino('shop_open');
  _beep(330, 0.08, 'square', 0.3);
  saveState();
}

// ============================================================
// LOOTBOX
// ============================================================

function _rollLootbox(tier) {
  _ensurePity();
  const pity = STATE.meta.lootboxPity;
  if (pity.sinceLegendary >= BALANCE.pityLegendary) return 'legendary';
  if (pity.sinceRare >= BALANCE.pityRare) {
    return Math.random() < 0.9 ? 'rare' : 'legendary';
  }
  const rates = BALANCE.lootbox[tier];
  if (!rates) return 'common';
  const r = Math.random();
  if (r < rates.legendary) return 'legendary';
  if (r < rates.legendary + rates.rare) return 'rare';
  if (r < rates.legendary + rates.rare + rates.uncommon) return 'uncommon';
  return 'common';
}

function _pickJokerByRarity(rarity) {
  const pool = JOKERS.filter(j => j.rarity === rarity);
  if (pool.length === 0) {
    // Scala alla rarità inferiore
    const order = ['legendary', 'rare', 'uncommon', 'common'];
    const idx = order.indexOf(rarity);
    for (let i = idx + 1; i < order.length; i++) {
      const fallback = JOKERS.filter(j => j.rarity === order[i]);
      if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)];
    }
    return JOKERS[0];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function shopOpenLootbox(tier) {
  const run = STATE.currentRun;
  if (!run) return;
  const cfg = BALANCE.lootbox[tier];
  if (!cfg) return;

  if (run.money < cfg.cost) {
    _toast(`Ti mancano ${cfg.cost - run.money}💰 per la lootbox!`, 'error');
    return;
  }

  run.money -= cfg.cost;
  run.moneySpent = (run.moneySpent || 0) + cfg.cost;

  _ensurePity();
  const pity = STATE.meta.lootboxPity;

  // Pesca le carte
  const drawn = [];
  for (let i = 0; i < cfg.cards; i++) {
    const rarity = _rollLootbox(tier);
    const joker = _pickJokerByRarity(rarity);
    drawn.push({ rarity, joker });

    if (rarity === 'legendary' || rarity === 'rare') {
      pity.sinceRare = 0;
    } else {
      pity.sinceRare += 1;
    }
    if (rarity === 'legendary') pity.sinceLegendary = 0;
    else pity.sinceLegendary += 1;
  }

  saveState();
  _animateLootboxOpen(tier, drawn);
}

function _animateLootboxOpen(tier, drawn) {
  const tierLabel = LOOTBOX_LABELS[tier];
  const hasLegendary = drawn.some(d => d.rarity === 'legendary');

  // FASE 1: pacchetto che trema
  const phase1 = `
    <div class="lootbox-open phase-shake">
      <h3 class="lootbox-title">📦 LOOTBOX ${_escape(tierLabel.name.toUpperCase())}</h3>
      <div class="lootbox-package shake-anim">📦</div>
      <p class="lootbox-hint">Click per aprire!</p>
      <button class="btn-arcade lootbox-open-btn" data-popup-close="open">APRI PACCHETTO</button>
    </div>`;

  if (typeof popup !== 'function') {
    // Fallback senza popup: applica direttamente
    _grantLootboxRewards(drawn);
    return;
  }

  popup(phase1).then(() => {
    // FASE 2: rivelazione
    _beep(880, 0.15, 'triangle', 0.4);

    const cardsHtml = drawn.map((d, i) => {
      const sprite = (window.SPRITES && SPRITES.jokerCard)
        ? SPRITES.jokerCard(d.rarity, (d.joker.art && d.joker.art.icon) || d.joker.emoji || '?', (d.joker.art && d.joker.art.bg) || '#3a1a3e')
        : `<div class="joker-fallback">${_escape(d.joker.emoji || '?')}</div>`;
      const borderColor = _rarityColor(d.rarity);
      return `
        <div class="lootbox-card-reveal rarity-${_escape(d.rarity)}"
             style="animation-delay:${i*300}ms; border-color:${_escape(borderColor)}">
          <div class="lootbox-card-art">${sprite}</div>
          <div class="lootbox-card-name">${_escape(_jName(d.joker))}</div>
          <div class="lootbox-card-rarity">${_escape(d.rarity.toUpperCase())}</div>
        </div>`;
    }).join('');

    const counts = drawn.reduce((acc, d) => { acc[d.rarity] = (acc[d.rarity] || 0) + 1; return acc; }, {});
    const recap = ['legendary', 'rare', 'uncommon', 'common']
      .filter(r => counts[r])
      .map(r => `<strong>${counts[r]}</strong> ${_escape(r)}`)
      .join(' · ');

    const legendaryBanner = hasLegendary
      ? `<div class="lootbox-legendary-banner">✨ LEGGENDARIO! ✨</div>`
      : '';

    const phase2 = `
      <div class="lootbox-open phase-reveal ${hasLegendary ? 'has-legendary' : ''}">
        <h3 class="lootbox-title">HAI APERTO!</h3>
        ${legendaryBanner}
        <div class="lootbox-explosion"></div>
        <div class="lootbox-cards-row">${cardsHtml}</div>
        <p class="lootbox-recap">Hai ottenuto: ${recap}</p>
        <button class="btn-arcade" data-popup-close="take">PRENDI TUTTO</button>
      </div>`;

    popup(phase2).then(() => {
      _grantLootboxRewards(drawn);
    });

    // Effetti su legendary
    if (hasLegendary) {
      const screenEl = document.getElementById('screen-shop');
      if (screenEl) {
        screenEl.classList.add('shake-strong');
        setTimeout(() => { if (screenEl) screenEl.classList.remove('shake-strong'); }, 700);
      }
      _gennarino('jackpot');
      _beep(1200, 0.4, 'sawtooth', 0.5);
    }
  });
}

function _grantLootboxRewards(drawn) {
  const run = STATE.currentRun;
  const maxSlots = (run && run.maxJokerSlots) || BALANCE.maxJokerSlots;
  let addedToRun = 0;
  let addedToMeta = 0;

  // Traccia i jolly ricevuti nella collezione
  if (STATE.meta && drawn) {
    const seen = STATE.meta.seenJokers = Array.isArray(STATE.meta.seenJokers) ? STATE.meta.seenJokers : [];
    drawn.forEach(d => {
      const id = d && d.joker && d.joker.id;
      if (typeof id === 'string' && id.length > 0 && id.length < 64 && !seen.includes(id) && seen.length < 200) {
        seen.push(id);
      }
    });
  }

  drawn.forEach(d => {
    const j = d.joker;
    if (run && run.jokers.length < maxSlots) {
      run.jokers.push({
        id: j.id, name: j.name, emoji: j.emoji, rarity: j.rarity,
        description: j.description, trigger: j.trigger, effectCode: j.effectCode,
      });
      addedToRun++;
    } else {
      if (!Array.isArray(STATE.meta.unlockedJokers)) STATE.meta.unlockedJokers = [];
      if (!STATE.meta.unlockedJokers.includes(j.id)) {
        STATE.meta.unlockedJokers.push(j.id);
      }
      addedToMeta++;
    }
  });

  if (addedToRun > 0) _toast(`+${addedToRun} jolly aggiunti alla run!`, 'success');
  if (addedToMeta > 0) _toast(`+${addedToMeta} jolly sbloccati per il prossimo run!`, 'info');

  if (window.Game && typeof Game.updateHUD === 'function') {
    try { Game.updateHUD(); } catch (e) {}
  }
  renderShop();
  saveState();

  // Pity reminder visibile
  _ensurePity();
  const pity = STATE.meta.lootboxPity;
  const left = Math.max(0, BALANCE.pityRare - pity.sinceRare);
  if (left > 0 && left <= 5) {
    _toast(`Tra ${left} aperture hai una RARE garantita!`, 'info');
  }
}

// ============================================================
// PREMIUM SHOP (DEMO MODE)
// ============================================================

function shopOpenPremiumShop() {
  const packs = BALANCE.premiumPacks;
  if (!packs) return;

  const cardsHtml = Object.keys(packs).map(packId => {
    const p = packs[packId];
    const emoji = packId === 'tabacchi' ? '🚬'
      : packId === 'cassaforte' ? '💰'
      : packId === 'jackpot' ? '🎰'
      : packId === 'battlePass' ? '👑' : '🎁';

    let contentLines = [];
    if (p.ducati) contentLines.push(_escape(`+${p.ducati}💰`));
    if (Array.isArray(p.lootboxes)) {
      p.lootboxes.forEach(lb => contentLines.push(_escape(`${lb.qty}× lootbox ${lb.tier}`)));
    }
    if (p.bonusLegendaryJoker) contentLines.push('1 Joker LEGGENDARIO garantito');
    if (p.battlePassUnlock) contentLines.push('Battle Pass Pulcinella');
    if (Array.isArray(p.skinPacks)) contentLines.push(`Skin: ${p.skinPacks.map(_escape).join(', ')}`);
    if (Array.isArray(p.gennarinoSkins)) contentLines.push(`Gennarino: ${p.gennarinoSkins.map(_escape).join(', ')}`);
    if (p.durationDays) contentLines.push(_escape(`Durata: ${p.durationDays} giorni`));

    const contentHtml = contentLines.map(l => `<li>${l}</li>`).join('');
    return `
      <div class="premium-pack" data-premium-pack="${_escape(packId)}">
        <div class="premium-pack-emoji">${_escape(emoji)}</div>
        <h4 class="premium-pack-name">${_escape(p.label)}</h4>
        <div class="premium-pack-price">${_escape(p.fakePrice)}</div>
        <ul class="premium-pack-content">${contentHtml}</ul>
        <button class="btn-arcade premium-buy-btn" data-premium-buy="${_escape(packId)}">COMPRA (DEMO)</button>
      </div>`;
  }).join('');

  const html = `
    <div class="premium-shop">
      <div class="premium-demo-banner">⚠️ DEMO MODE — Nessuna transazione reale ⚠️</div>
      <h2 class="premium-title">NEGOZIO PREMIUM</h2>
      <p class="premium-subtitle">Tutto gratis, perché 'o capo è generoso!</p>
      <div class="premium-packs-grid">${cardsHtml}</div>
      <button class="btn-arcade btn-small" data-popup-close="close">CHIUDI</button>
    </div>`;

  const validPackIds = Object.keys(packs);

  popup(html).then(() => {
    // Pulizia automatica handler alla chiusura popup (Esc/backdrop)
    const box = document.getElementById('popup-box');
    if (box) box.removeEventListener('click', handler);
  });

  // Wira i bottoni "COMPRA" dopo il render del popup
  // Il popup() risolve solo alla chiusura — usiamo delegazione su #popup-box
  const box = document.getElementById('popup-box');
  const handler = (ev) => {
    if (!box) return;
    const btn = ev.target.closest('[data-premium-buy]');
    if (!btn) return;
    ev.stopPropagation();
    const packId = btn.dataset.premiumBuy;
    if (!validPackIds.includes(packId)) return;
    box.removeEventListener('click', handler);
    // Chiudi popup corrente prima del fakePurchase
    if (typeof closePopup === 'function') closePopup();
    _fakePurchase(packId);
  };
  if (box) box.addEventListener('click', handler);
}

function _fakePurchase(packId) {
  if (!Object.prototype.hasOwnProperty.call(BALANCE.premiumPacks, packId)) return;
  const pack = BALANCE.premiumPacks[packId];
  if (!pack) return;

  // Step 1: countdown popup
  const COUNTDOWN_MS = 1500;
  const STEPS = 3;
  const stepDur = COUNTDOWN_MS / STEPS;

  const phaseHtml = (n) => `
    <div class="checkout-fake">
      <div class="checkout-overlay"></div>
      <div class="checkout-card">💳</div>
      <h3 class="checkout-title">ELABORAZIONE...</h3>
      <div class="checkout-counter">${n}</div>
      <p class="checkout-pricetag">${_escape(pack.fakePrice)}</p>
    </div>`;

  // cancelled=true se l'utente chiude il popup prima del countdown
  let cancelled = false;
  let tickTimer = null;

  popup(phaseHtml(STEPS)).then(() => {
    // Popup chiuso (Esc o backdrop) prima che tick completi → annulla
    cancelled = true;
    if (tickTimer) clearTimeout(tickTimer);
  });

  let n = STEPS;
  function tick() {
    if (cancelled) return;
    n -= 1;
    const box = document.getElementById('popup-box');
    if (n > 0 && box) {
      box.innerHTML = phaseHtml(n);
      tickTimer = setTimeout(tick, stepDur);
    } else if (!cancelled) {
      _completePurchase(packId, pack);
    }
  }
  tickTimer = setTimeout(tick, stepDur);
}

function _completePurchase(packId, pack) {
  // Applica contenuti
  const meta = STATE.meta;
  if (pack.ducati) {
    meta.coins = (meta.coins || 0) + pack.ducati;
    // Se c'è una run attiva, dai i ducati anche alla run
    if (STATE.currentRun) STATE.currentRun.money = (STATE.currentRun.money || 0) + pack.ducati;
  }

  // Lootboxes: aggiungi al meta inventory (struttura semplice)
  if (Array.isArray(pack.lootboxes)) {
    if (!meta.lootboxInventory || typeof meta.lootboxInventory !== 'object') {
      meta.lootboxInventory = { iniziato: 0, adepto: 0, maestro: 0 };
    }
    pack.lootboxes.forEach(lb => {
      if (LOOTBOX_TIERS.includes(lb.tier) && Number.isFinite(lb.qty)) {
        meta.lootboxInventory[lb.tier] = (meta.lootboxInventory[lb.tier] || 0) + lb.qty;
      }
    });
  }

  // Joker leggendario garantito
  if (pack.bonusLegendaryJoker) {
    const legendary = JOKERS.filter(j => j.rarity === 'legendary');
    if (legendary.length > 0) {
      const j = legendary[Math.floor(Math.random() * legendary.length)];
      if (!Array.isArray(meta.unlockedJokers)) meta.unlockedJokers = [];
      if (!meta.unlockedJokers.includes(j.id)) meta.unlockedJokers.push(j.id);
    }
  }

  // Battle Pass / skin: marca i flag (cosmetic-only)
  if (pack.battlePassUnlock) meta.battlePassUnlocked = true;
  const _validSkinId = s => typeof s === 'string' && /^[a-z0-9_-]{1,48}$/i.test(s);
  if (Array.isArray(pack.skinPacks)) {
    if (!Array.isArray(meta.unlockedCardSkins)) meta.unlockedCardSkins = [];
    pack.skinPacks.forEach(s => { if (_validSkinId(s) && !meta.unlockedCardSkins.includes(s)) meta.unlockedCardSkins.push(s); });
  }
  if (Array.isArray(pack.gennarinoSkins)) {
    if (!Array.isArray(meta.unlockedGennarinoSkins)) meta.unlockedGennarinoSkins = [];
    pack.gennarinoSkins.forEach(s => { if (_validSkinId(s) && !meta.unlockedGennarinoSkins.includes(s)) meta.unlockedGennarinoSkins.push(s); });
  }

  // Step 2: popup vittoria
  const successHtml = `
    <div class="checkout-success">
      <h3 class="checkout-success-title">🎉 DEMO MODE ATTIVATO! 🎉</h3>
      <p class="checkout-success-msg">Ti regaliamo tutto, guagliò! Nessun pagamento reale.</p>
      <p class="checkout-success-pack">${_escape(pack.label)} — ${_escape(pack.fakePrice)}</p>
      <p class="checkout-success-content">Contenuto attivato.</p>
      <button class="btn-arcade" data-popup-close="ok">FANTASTICO!</button>
    </div>`;
  if (typeof popup === 'function') popup(successHtml);

  // Reazione Gennarino con frase custom
  if (window.Gennarino) {
    try {
      Gennarino.react('jackpot');
      if (typeof Gennarino.say === 'function') {
        Gennarino.say("GRATIS? Madonna mia, so' troppo buono!");
      }
    } catch (e) {}
  }

  _beep(880, 0.3, 'sine', 0.5);
  saveState();

  // Aggiorna eventuali display meta-coins
  const coinsDisp = document.getElementById('meta-coins-display');
  if (coinsDisp) coinsDisp.textContent = STATE.meta.coins;
  if (window.Game && typeof Game.updateHUD === 'function') {
    try { Game.updateHUD(); } catch (e) {}
  }
}

// ============================================================
// BATTLE PASS
// ============================================================

function shopGrantBattlePassXp(xp) {
  if (!Number.isFinite(xp) || xp <= 0) return;
  _ensureBattlePass();

  STATE.meta.battlePassXp += xp;

  const xpPerLevel = BALANCE.battlePassXpPerLevel;
  const maxLevel = BALANCE.battlePassLevels;
  if (!Number.isFinite(xpPerLevel) || xpPerLevel <= 0) return;

  while (STATE.meta.battlePassXp >= xpPerLevel && STATE.meta.battlePassLevel < maxLevel) {
    STATE.meta.battlePassXp -= xpPerLevel;
    STATE.meta.battlePassLevel += 1;
    const lv = STATE.meta.battlePassLevel;
    _toast(`LIVELLO SU! Battle Pass Lv.${lv}`, 'success');
    _gennarino('high_score');
    _beep(990, 0.18, 'triangle', 0.4);

    // Ricompense per livello (solo ducati per ora; cosmetici tracciati come unlock)
    const reward = BATTLE_PASS_REWARDS[lv];
    if (reward && reward.ducati) {
      STATE.meta.coins = (STATE.meta.coins || 0) + reward.ducati;
      _toast(`+${reward.ducati}💰 dal Battle Pass!`, 'success');
    }
  }

  // Cap XP se a livello massimo
  if (STATE.meta.battlePassLevel >= maxLevel) {
    STATE.meta.battlePassXp = 0;
  }

  saveState();
}

// ============================================================
// WIRING (delegazione)
// ============================================================

function _wireShop() {
  if (_shopWired) return;
  _shopWired = true;

  // Reroll button
  const rerollBtn = document.getElementById('btn-reroll');
  if (rerollBtn) {
    rerollBtn.addEventListener('click', () => shopReroll());
  }

  // Click delegato su sezioni shop (joker / tarot / pack)
  const sections = ['shop-jokers', 'shop-tarots', 'shop-packs'];
  sections.forEach(secId => {
    const el = document.getElementById(secId);
    if (!el) return;
    el.addEventListener('click', (ev) => {
      // Lootbox?
      const lootEl = ev.target.closest('[data-lootbox-tier]');
      if (lootEl) {
        const tier = lootEl.dataset.lootboxTier;
        if (LOOTBOX_TIERS.includes(tier)) shopOpenLootbox(tier);
        return;
      }
      // Item normale?
      const itemEl = ev.target.closest('[data-shop-type]');
      if (!itemEl) return;
      const type = itemEl.dataset.shopType;
      const idx = parseInt(itemEl.dataset.shopIdx, 10);
      if (!Number.isInteger(idx)) return;
      shopBuyItem(type, idx);
    });

    // Tastiera (Enter/Space) per accessibilità
    el.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const lootEl = ev.target.closest('[data-lootbox-tier]');
      if (lootEl) {
        ev.preventDefault();
        const tier = lootEl.dataset.lootboxTier;
        if (LOOTBOX_TIERS.includes(tier)) shopOpenLootbox(tier);
        return;
      }
      const itemEl = ev.target.closest('[data-shop-type]');
      if (!itemEl) return;
      ev.preventDefault();
      const type = itemEl.dataset.shopType;
      const idx = parseInt(itemEl.dataset.shopIdx, 10);
      if (Number.isInteger(idx)) shopBuyItem(type, idx);
    });
  });
}

// ============================================================
// ESPOSIZIONE GLOBALE
// ============================================================
window.Shop = {
  open: shopOpen,
  buyItem: shopBuyItem,
  reroll: shopReroll,
  openLootbox: shopOpenLootbox,
  openPremiumShop: shopOpenPremiumShop,
  grantBattlePassXp: shopGrantBattlePassXp,
};
