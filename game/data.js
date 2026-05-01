'use strict';
// =====================================================================
// BRISCOLA ROYALE — DATA LAYER
// Ogni numero, carta, joker, boss, smorfia, slot, previsione, stringa.
// Niente DOM, niente fetch, niente import: solo dati esposti su window.
// =====================================================================

// ============ BALANCE ============
// Tutti i magic numbers del gioco. Se devi tarare il bilanciamento,
// è qui che metti le mani — mai inline nel resto del codice.
const BALANCE = {
  // Target score per ante [small, big, boss]
  anteTargets: [
    [300, 450, 600],         // ante 1
    [600, 900, 1200],        // ante 2
    [1200, 1800, 2400],      // ante 3
    [2500, 3750, 5000],      // ante 4
    [5000, 7500, 10000],     // ante 5
    [10000, 15000, 20000],   // ante 6
    [20000, 30000, 40000],   // ante 7
    [40000, 60000, 80000],   // ante 8 — finale
  ],
  handsPerBlind: 4,
  discardsPerBlind: 3,
  handSize: 5,
  startHandSize: 3,         // carte dealt all'inizio di ogni blind
  maxHandSize: 7,           // massimo carte in mano contemporaneamente
  freeDrawsPerBlind: 4,     // pescate gratuite per blind (oltre le iniziali)
  paidDrawCost: 1,          // costo in ducati per pescata extra
  paidDrawMaxPerBlind: 6,   // max pescate a pagamento per blind
  maxJokerSlots: 5,

  // Fase 11 — Polish & Juice
  particleThreshold: 1000,  // soglia punteggio singola mano per attivare particelle dorate
  finalAnte: 8,             // ante finale (vittoria run dopo aver battuto il boss di questo ante)

  // Endless mode — oltre l'Ante 8 il run continua con target *= endlessMultiplier
  // per ogni ante extra. Il boss di Ante 8 da' la prima "vittoria" (badge + stats),
  // poi il giocatore puo' continuare a oltranza finche' non perde o abbandona.
  endlessMultiplier: 1.25,

  // Daily Seed: se true, il menu offre la modalita' Daily (seed YYYYMMDD).
  dailySeedEnabled: true,

  // Chip per carta (valori napoletani)
  cardChips: { 1: 11, 3: 10, re: 4, cavallo: 3, fante: 2, 7: 0, 6: 0, 5: 0, 4: 0, 2: 0 },

  // Combinazioni: [chipsBonus, multBase]
  combos: {
    single:          [0,   1],
    coppia:          [5,   1],   // era [10,2] — NERF: coppia è fallback, non strategia
    tris:            [30,  4],   // era [20,3] — buff
    poker:           [40,  8],   // era [30,7] — buff
    napoletana:      [65,  9],   // era [50,8] — buff: A+2+3 stesso seme
    carico:          [35,  5],   // era [25,4] — buff: 3 figure stesso seme
    primiera:        [55,  7],   // era [40,5] — buff: 1 carta per ogni seme
    scopa:           [80, 12],   // era [60,10] — buff: 5 carte stesso seme
    bazzica:         [45,  5],   // era [35,4] — buff: 5+6+7
    briscola_reale:  [15,  2],   // era [30,3] — NERF: non incentivare lazy 2-card
    calabresella:    [55,  7],   // era [45,5] — buff: Re+Cav+Asso semi diversi
    sette_e_mezzo:   [15,  2],   // era [40,4] — NERF: 2-card ≤ 7.5 deve essere fallback
    napola_mista:    [55,  7],   // era [45,6] — buff: A+2+3 semi diversi
  },
  settebelloBonus: 50,  // bonus flat per il 7 di Denari
  briscolaPerCard: 5,   // +5 chips per ogni carta del seme briscola

  // Moltiplicatori target boss — separati da BALANCE per non hardcodarli in game.js
  // 'double_target' per boss normali: +50% (×1.5). Per il boss finale Ante 8: ×2.
  // Usare bossTargetMult[rule] in game.js per gestire entrambi i casi.
  bossHalfTargetMult:   1.5,   // per i boss 'double_target' non finali (+50%)
  bossFinalTargetMult:  2.0,   // solo per munaciello_oro (boss Ante 8, target ×2)

  // Contratto per game.js → calculateScore:
  // handsPlayedThisRound deve essere il numero di mani GIÀ GIOCATE nel round
  // PRIMA di giocare quella corrente (0 per la prima mano, 1 per la seconda, ecc.).
  // Il joker 'caffe_forte' dipende da questo: controlla === 0 per la prima mano.

  // -------------------------------------------------------
  // ECONOMIA PER BLIND
  // -------------------------------------------------------
  // AUDIT MONETIZATION (v1 — 2026-05-01):
  // Simulazione run completa (8 ante × 3 blind = 24 blind):
  //   Guadagno base totale: 8 × (3+4+5) = 96💰
  //   Bonus mani/scarti (media giocatore): ~30💰
  //   Interesse accumulato: ~15-20💰
  //   TOTALE GREZZO STIMATO: ~145-150💰 per run senza spendere
  //
  // Target BRIEF:
  //   Giocatore frugale → deve finire con 50-80💰 (sink shop ~65-95💰 su 150)
  //   Giocatore ottimizzatore → deve finire con 0-10💰 (sink shop ~140-150💰)
  //
  // Con i prezzi attuali e 2 acquisti per shop visita (16 visite/run):
  //   Spend medio: 2 × 6💰 × 16 = ~192💰 — ECCEDE il budget frugale, OK.
  //   Il frugale non compra ogni visita → bilancia correttamente.
  blindMoney:       [3, 4, 5],  // small, big, boss
  handSavedBonus:   1,
  discardSavedBonus: 1,
  // Reward immediato per carta scartata (compensa la "fatica" dello scarto).
  // Tieni basso (1💰/carta): non deve diventare farm strategy.
  discardRewardPerCard: 1,
  // Interesse: +1 ducato ogni interestPer ducati in tasca, max interestMax.
  // Con interestPer=5 e interestMax=5: serve 25 ducati in tasca per il bonus max.
  // NON alzare interestMax sopra 5: creerebbe snowball economy sbilanciata.
  // Capricorno zodiac raddoppia questo bonus (max 10💰) — deliberato come edge case.
  interestMax:      5,
  interestPer:      5,

  // -------------------------------------------------------
  // PREZZI NEGOZIO
  // -------------------------------------------------------
  // Budget tipico per shop visita: 6-12💰 (guadagno 2 blind precedenti).
  // Costo "shop standard completo" (1 common + 1 uncommon + 1 tarocco + 1 reroll):
  //   4 + 6 + 3 + 5 = 18💰 — possibile ma richiede risparmio dal blind precedente.
  // NON alzare common oltre 5💰 — rompe il loop early game (Ante 1-2).
  jokerCost:  { common: 4, uncommon: 6, rare: 8, legendary: 20 },
  tarotCost:  3,
  packCost:   { small: 4, medium: 6, large: 8 },
  // Reroll: raddoppia a ogni reroll nello stesso shop (5 → 10 → 20 → 40...).
  // 2 reroll = 15💰 totale — ragionevole. 3° reroll = 20💰 — scoraggiato volutamente.
  // Oltre il 3° reroll Gennarino commenta "Basta! Mo' stai esagerando!"
  rerollBase:        5,
  // [AUDIT] maxRerollsPerShop: cap documentato. shop.js deve mostrare warning oltre questo.
  maxRerollsPerShop: 4,

  // [AUDIT] slot visibili per visita shop — erano magic numbers non in BALANCE
  shopJokersVisible:  3,  // joker slot visibili per visita negozio
  shopTarotsVisible:  2,  // tarocchi visibili per visita negozio
  shopPacksVisible:   1,  // pacchetti carte visibili per visita negozio

  // -------------------------------------------------------
  // LOOTBOX — TIER E DROP RATES
  // -------------------------------------------------------
  // AUDIT ROI (valore joker come proxy per il valore atteso monetario):
  //   Iniziato (50💰, 3 carte): EV monetario ~13💰 → ROI 27%  — sink ✓
  //   Adepto   (120💰, 5 carte): EV monetario ~26💰 → ROI 21% — sink ✓
  //   Maestro  (300💰, 10 carte): EV monetario ~62💰 → ROI 21% — sink ✓
  //   Il ROI negativo è CORRETTO: l'utente paga per l'animazione e l'emozione.
  //
  // VERIFICA SOMME: ogni tier deve sommare esattamente a 1.0
  //   Iniziato: 0.80+0.18+0.02+0.00 = 1.00 ✓
  //   Adepto:   0.60+0.30+0.09+0.01 = 1.00 ✓
  //   Maestro:  0.40+0.40+0.15+0.05 = 1.00 ✓
  lootbox: {
    iniziato: { cost: 50,  cards: 3,  common: 0.80, uncommon: 0.18, rare: 0.02, legendary: 0    },
    adepto:   { cost: 120, cards: 5,  common: 0.60, uncommon: 0.30, rare: 0.09, legendary: 0.01 },
    maestro:  { cost: 300, cards: 10, common: 0.40, uncommon: 0.40, rare: 0.15, legendary: 0.05 },
  },

  // PITY TIMER — [AUDIT FIX CRITICO]
  // PROBLEMA ORIGINALE: pity legendary a 50 aperture Maestro = 50 × 300💰 = 15.000💰
  //   Irraggiungibile: un giocatore frugale fa ~150💰/run → 100 run per triggerare.
  //   ANTI-PROMISE: le promesse non mantenute rompono la fiducia del giocatore.
  //
  // FIX: il contatore pity è CROSS-TIER (conta aperture di QUALUNQUE tier).
  //   Con 50 aperture miste (es. 30 Iniziato + 10 Adepto + 10 Maestro):
  //   costo totale ~= 30×50 + 10×120 + 10×300 = 1.500+1.200+3.000 = 5.700💰
  //   Ancora alto, ma raggiungibile su 5-6 run (e si riceve nel frattempo joker rare dal pity).
  //
  // Il flag pityCounterShared deve essere letto da shop.js per incrementare correttamente.
  pityRare:           20,    // garanzia rare+ dopo N aperture TOTALI (qualunque tier) senza rare
  pityLegendary:      50,    // garanzia legendary dopo N aperture TOTALI senza legendary
  pityCounterShared:  true,  // [AUDIT] contatore condiviso tra tier — shop.js legge questo flag

  // -------------------------------------------------------
  // DROP RATES JOKER NEL NEGOZIO
  // -------------------------------------------------------
  // Somma: 0.70+0.22+0.07+0.01 = 1.00 ✓
  // Con bonus Scorpione zodiac: rare sale a 0.09, le altre si riducono proporzionalmente.
  // Gestire in game.js/shop.js — NON modificare questa tabella per il bonus zodiac.
  jokerDropRates: { common: 0.70, uncommon: 0.22, rare: 0.07, legendary: 0.01 },

  // -------------------------------------------------------
  // SLOT MACHINE
  // -------------------------------------------------------
  // AUDIT RTP (pesi: cherry=30, lemon=25, bell=20, coin=15, seven=6, star=3, diamond=1 — totale 100):
  // PROBLEMA ORIGINALE — RTP dei payouts vecchi era ~7% su 10💰 investiti.
  //   Troppo punitivo: i giocatori smettono di usare la slot e il sink non funziona.
  //   Confronto: slot arcade divertenti = 30-60% RTP.
  //
  // FIX — Payouts rivisti per RTP target ~18%:
  //   cherry3:  5→20:  EV 0.54 (prob 2.70% × 20)
  //   lemon3:  10→30:  EV 0.47 (prob 1.56% × 30)
  //   bell3:   25→60:  EV 0.48 (prob 0.80% × 60)
  //   coin3:   50→80:  EV 0.27 (prob 0.34% × 80)
  //   seven3: 200→300: EV 0.065 (prob 0.022% × 300)
  //   star3: lootbox iniziato gratis (~50💰 valore percepito)
  //   diamond3: 1000 (invariato — il JACKPOT deve essere glorioso)
  //   RTP NUOVO: ~1.83💰 su 10💰 investiti = ~18% — più divertente, mantiene la tensione.
  //
  // NOTA: RTP 100% non è desiderabile — rimuoverebbe la tensione del gioco.
  // 18% è il punto dolce per mini-game arcade non-predatory.
  slotCost: 10,
  slotPayouts: {
    cherry3:  20,    // [AUDIT FIX] era 5 — troppo basso, nessuno festeggiava
    lemon3:   30,    // [AUDIT FIX] era 10
    bell3:    60,    // [AUDIT FIX] era 25
    coin3:    80,    // [AUDIT FIX] era 50
    seven3:   300,   // [AUDIT FIX] era 200 — allineato con "200💰+ è una cifra seria"
    star3:    0,     // lootbox Iniziato gratis (gestito in bonus.js — NON cash)
    diamond3: 1000,  // JACKPOT — invariato, è il momento WOW
  },
  // [AUDIT] massimo slot per visita shop — previene grinding compulsivo
  slotMaxPerShopVisit: 3,

  // -------------------------------------------------------
  // BATTLE PASS — XP STRUCTURE
  // -------------------------------------------------------
  // [AUDIT] Mancava completamente dal BALANCE. Aggiunto.
  // Simulazione completamento:
  //   Run media = 24 blind × 1xp + 8 boss blind × 1xp bonus + 1xp vittoria = ~33xp
  //   30 livelli × 3xp = 90xp → ~3 run per completare (circa 3 ore di gioco)
  //   Accettabile per demo senza pressione temporale.
  battlePassLevels:        30,   // livelli totali del pass
  battlePassXpPerBlind:     1,   // XP per blind qualunque vinto
  battlePassXpPerBossBlind: 2,   // XP per boss blind vinto (incluso il base)
  battlePassXpPerAnte4Plus: 2,   // XP bonus per ogni ante ≥ 4 completato
  battlePassXpVictoryRun:   5,   // XP bonus vittoria run completa (tutte le 8 ante)
  battlePassXpPerLevel:     3,   // XP necessaria per ogni livello (costante, semplice)

  // -------------------------------------------------------
  // PACCHETTI PREMIUM FAKE (meta-shop)
  // -------------------------------------------------------
  // [AUDIT] Mancava dal BALANCE. Aggiunto per shop.js / meta-shop UI.
  // REGOLA FONDAMENTALE: DEMO MODE sempre attivo. Nessuna transazione reale.
  // Quando il giocatore clicca "Compra" → animazione checkout cafona → assegna gratis.
  // Visualizzare SEMPRE il banner "DEMO MODE" sopra i prezzi.
  premiumPacks: {
    tabacchi: {
      fakePrice: '€1,99', label: 'Pacchetto Tabacchi',
      ducati: 100,
      lootboxes: [{ tier: 'iniziato', qty: 1 }],
    },
    cassaforte: {
      fakePrice: '€4,99', label: 'Cassaforte d\'Oro',
      ducati: 500,
      lootboxes: [{ tier: 'adepto', qty: 3 }],
    },
    jackpot: {
      fakePrice: '€9,99', label: 'Jackpot Pack',
      ducati: 1500,
      lootboxes: [{ tier: 'maestro', qty: 10 }],
      bonusLegendaryJoker: true,  // 1 joker legendary garantito
    },
    battlePass: {
      fakePrice: '€14,99', label: 'Battle Pass Pulcinella',
      battlePassUnlock: true,
      skinPacks: ['napoletana_classica', 'dark_mode'],
      gennarinoSkins: ['pulcinella', 'barista'],
      durationDays: 30,
    },
  },

  // Boss finale dell'ante 8 (sempre lo stesso)
  finalBossId: 'munaciello_oro',
};

// ============ MAZZO NAPOLETANO ============
// 40 carte: 4 semi × [1..7, fante, cavallo, re].
// id deterministico così persiste in localStorage senza ambiguità.
const DECK_NAPOLI = (() => {
  const semi = ['bastoni', 'coppe', 'denari', 'spade'];
  const valori = [1, 2, 3, 4, 5, 6, 7, 'fante', 'cavallo', 're'];
  const out = [];
  for (const seme of semi) {
    for (const valore of valori) {
      out.push({
        id: `${seme}_${valore}`,
        seme,
        valore,
        chips: BALANCE.cardChips[valore],
      });
    }
  }
  return out;
})();

// ============ BOSSES ============
// 18 boss, 1-5 difficoltà. Ante 8 sempre munaciello_oro.
// rule = codice macchina (interpretato in game.js)
// ruleDesc = SEMPRE in italiano standard (gameplay critico)
// intro/onLose/onWin = dialettale (flavor)
//
// Regole implementate (da gestire in game.js):
//   no_discard         → disabilita scarti
//   half_denari        → chip Denari ÷ 2
//   less_hands         → handsPerBlind 4→3
//   no_figure_bonus    → Fante/Cavallo/Re chip = 0
//   change_briscola    → seme briscola cambia ad ogni mano
//   half_chips         → tutti chip ÷ 2
//   only_numbers       → solo carte 1..7 danno chip (figure = 0)
//   less_hand_size     → handSize 5→4
//   random_transform   → 1 carta casuale si trasforma ad ogni mano
//   random_rule        → regola casuale tra le altre, cambia ogni mano
//   pay_per_hand       → -10 ducati per mano giocata
//   double_target      → target ×1.5 (boss normali) oppure ×2 (munaciello_oro, Ante 8)
//   min_3_cards        → devi giocare almeno 3 carte per mano
//   swap_hand_discard  → handsPerBlind ↔ discardsPerBlind
//   no_asso_chips      → gli Assi danno 0 chip (aggiunto con pinocchio_bugiardo)
//   invert_combo_mult  → moltiplicatori combo invertiti: singola×10, scopa×1 (befana_roma)
const BOSSES = [
  {
    id: 'pulcinella_nero',
    name: 'Pulcinella Nero',
    rule: 'no_discard',
    ruleDesc: 'Non puoi scartare carte in questo round.',
    intro: "Ah ah ah, scarta 'sta cosa qua, guagliò!",
    onLose: "Embè? T'aggiu fregato 'a possibilità!",
    onWin: "Mannaggia... bravo guagliò, mi hai fottuto.",
    difficulty: 2,
    firstAnte: 1,
    portrait: 'pulcinella',
  },
  {
    id: 'munaciello',
    name: "'O Munaciello",
    rule: 'half_denari',
    ruleDesc: 'Le carte di Denari valgono metà dei loro chip.',
    intro: "I sordi nun se toccano, guagliò!",
    onLose: "'E denari sò mei, capit'?",
    onWin: "Te l'aggiu lasciat'... pe' stavota.",
    difficulty: 2,
    firstAnte: 1,
    portrait: 'munaciello',
  },
  {
    id: 'janara',
    name: "'A Janara",
    rule: 'less_hands',
    ruleDesc: 'Hai solo 3 mani disponibili invece di 4.',
    intro: "Ti ho fatto la fattura, bello!",
    onLose: "'A magia mia è cchiù forte 'e te.",
    onWin: "M'hai spezzat' 'o malocchio... bravo.",
    difficulty: 3,
    firstAnte: 2,
    portrait: 'janara',
  },
  {
    id: 'sangennaro_severo',
    name: 'San Gennaro Severo',
    rule: 'no_figure_bonus',
    ruleDesc: 'Le figure (Fante, Cavallo, Re) non danno chip.',
    intro: 'Il sangue non si è sciolto. Niente miracolo.',
    onLose: 'La fede tua è poca, figliolo.',
    onWin: 'Hai meritato la mia benedizione.',
    difficulty: 3,
    firstAnte: 2,
    portrait: 'sangennaro',
  },
  {
    id: 'pazzariello',
    name: "'O Pazzariello",
    rule: 'change_briscola',
    ruleDesc: 'La briscola cambia ad ogni mano giocata.',
    intro: 'Gente! Gente! Cambia tutto!',
    onLose: 'Tarantarantè, t\'aggiu fregato n\'ata vota!',
    onWin: 'M\'hai stancat\'... è pure giusto, va.',
    difficulty: 3,
    firstAnte: 2,
    portrait: 'pazzariello',
  },
  {
    id: 'pinocchio_bugiardo',
    name: 'Pinocchio Bugiardo',
    // CAMBIO: era 'half_chips' (duplicato con befana_cattiva). Nuova regola:
    // no_asso_chips — gli Assi non danno chip (l'Asso è la carta che "mente" di valere molto).
    // Più tematico e crea varietà rispetto a half_chips.
    rule: 'no_asso_chips',
    ruleDesc: "Gli Assi non danno chip in questo round. Naso lungo = niente valore.",
    intro: 'Ho un naso lunghissimo... come il tuo bluff!',
    onLose: 'Bugia! Io non ho perso! ...ho un naso lungo, eh?',
    onWin: "Mannaggia, dico la verità: m'hai battuto.",
    difficulty: 3,
    firstAnte: 3,
    portrait: 'generic',
  },
  {
    id: 'smorfia_in_persona',
    name: "'A Smorfia in Persona",
    rule: 'only_numbers',
    ruleDesc: 'Solo le carte numeriche (1-7) danno chip. Le figure danno 0.',
    intro: "47... 'o muorto si' tu!",
    onLose: '90... \'a paura te sta arrivanno!',
    onWin: 'Hai vinto. 13... \'a fortuna stava cu te.',
    difficulty: 4,
    firstAnte: 3,
    portrait: 'generic',
  },
  {
    id: 'lione_san_marco',
    name: "'O Lione di San Marco",
    rule: 'less_hand_size',
    ruleDesc: 'Tieni solo 4 carte in mano invece di 5.',
    intro: 'Rugghio io, non tu!',
    onLose: 'La Serenissima non perde mai!',
    onWin: 'Hai onorato la mia bandiera. Vai in pace.',
    difficulty: 3,
    firstAnte: 3,
    portrait: 'generic',
  },
  {
    id: 'geppetto_ubriaco',
    name: 'Mastro Geppetto Ubriaco',
    rule: 'random_transform',
    ruleDesc: 'Ad ogni mano, una carta a caso si trasforma in un\'altra.',
    intro: "Hic! Ho fatto 'na cosa strana...",
    onLose: 'Ho intagliato \'a tua sconfitta! Hic!',
    onWin: 'Madonna mia... m\'hai battuto sobrio? Bravo!',
    difficulty: 4,
    firstAnte: 4,
    portrait: 'generic',
  },
  {
    id: 'arlecchino',
    name: 'Arlecchino Multiforme',
    rule: 'random_rule',
    ruleDesc: 'Una regola random tra le altre cambia ad ogni mano giocata.',
    intro: 'Sono 100 maschere in una!',
    onLose: 'Cambio faccia, cambio gioco, cambio te!',
    onWin: 'Hai indovinato tutte le mie facce. Bravo, mate!',
    difficulty: 5,
    firstAnte: 5,
    portrait: 'generic',
  },
  {
    id: 'mammasantissima',
    name: 'Mammasantissima',
    rule: 'pay_per_hand',
    ruleDesc: 'Devi pagare 10 ducati per giocare ogni mano. Senza ducati, niente mano.',
    intro: 'Tu mi devi rispetto, picciotto.',
    onLose: 'Si paga, si paga sempre.',
    onWin: 'Hai pagato il pizzo dell\'orgoglio. Vai.',
    difficulty: 4,
    firstAnte: 5,
    portrait: 'generic',
  },
  {
    id: 'tarocco_nero',
    name: "'O Tarocco Nero",
    rule: 'double_target',
    ruleDesc: 'Il punteggio richiesto è aumentato del 50%.',
    intro: 'Le carte hanno predetto la tua sconfitta.',
    onLose: 'Era scritto nelle stelle, guagliò.',
    onWin: 'Le carte sbagliano. A volte. Bravo.',
    difficulty: 5,
    firstAnte: 5,
    portrait: 'generic',
  },
  {
    id: 'sirena_vesuvio',
    name: "Sirena d'o Vesuvio",
    rule: 'min_3_cards',
    ruleDesc: 'Devi giocare almeno 3 carte per ogni mano.',
    intro: 'Il mio canto ti incanta...',
    onLose: 'Sciogli nel mare delle mie note...',
    onWin: 'Hai resistito al mio canto. Sei un eroe.',
    difficulty: 4,
    firstAnte: 4,
    portrait: 'generic',
  },
  {
    id: 'don_chisciotte',
    name: 'Don Chisciotte di Catania',
    rule: 'swap_hand_discard',
    ruleDesc: 'Mani e scarti sono invertiti: 3 mani, 4 scarti.',
    intro: 'Carica! Per la mia Dulcinea!',
    onLose: 'I mulini sono caduti! Io ho vinto!',
    onWin: 'Cavaliere, ti riconosco la vittoria. Onore.',
    difficulty: 4,
    firstAnte: 6,
    portrait: 'generic',
  },
  {
    id: 'befana_cattiva',
    name: "'A Befana Cattiva",
    rule: 'half_chips',
    ruleDesc: 'Tutte le tue carte valgono metà chip ("solo carbone").',
    intro: 'Quest\'anno solo carbone per te!',
    onLose: 'Carbone, carbone e ancora carbone!',
    onWin: 'Va bene, ti lascio un dolcetto. Bravo.',
    difficulty: 4,
    firstAnte: 6,
    portrait: 'generic',
  },
  {
    id: 'lupo_mannaro',
    name: "'O Lupo Mannaro Lucano",
    rule: 'double_target',
    ruleDesc: 'Luna piena: il punteggio richiesto è raddoppiato.',
    intro: 'AAAUUU!',
    onLose: 'Ulula con me, prima che ti morda!',
    onWin: 'La luna è tramontata. Hai vinto, umano.',
    difficulty: 5,
    firstAnte: 7,
    portrait: 'generic',
  },
  {
    id: 'befana_roma',
    name: 'Befana de Roma',
    // CAMBIO: era 'swap_hand_discard' (duplicato con don_chisciotte). Nuova regola:
    // invert_combo_mult — i moltiplicatori delle combo si invertono: carta singola ×10,
    // scopa ×1. Crea situazioni esilaranti dove la "mossa peggiore" diventa la migliore.
    rule: 'invert_combo_mult',
    ruleDesc: 'I moltiplicatori delle combo sono invertiti: Singola ×10, Scopa ×1.',
    intro: "A regà, mo' te fregamo! Ho mischiat' tutte le carte!",
    onLose: 'Ha ha! Mejo de me solo er diavolo in persona!',
    onWin: 'Mejo de me solo Nonna Pina. Bravo, te lo meriti.',
    difficulty: 4,
    firstAnte: 6,
    portrait: 'generic',
  },
  {
    id: 'don_mimi_camorrista',
    name: "Don Mimì 'o Camorrista",
    rule: 'pay_per_draw',
    ruleDesc: 'Ogni pescata dal mazzo costa 1 ducato. Con 0 ducati non puoi pescare.',
    intro: "Tu pesca pure, guagliò. Ma ogni carta ha 'nu prezzo.",
    onLose: "Si paga, e si paga bene. Questo è Don Mimì.",
    onWin: "...Rispetto. Solo rispetto. Vattene prima che cambio idea.",
    difficulty: 4,
    firstAnte: 4,
    portrait: 'generic',
  },
  {
    id: 'concetta_vecchia',
    name: "'A Signora Concetta",
    rule: 'no_new_combos',
    ruleDesc: 'Solo Coppia, Tris e Carta Singola danno punti. Le altre combo valgono come Carta Singola.',
    intro: "Ai miei tempi si giocava semplice. Senza tutte 'ste trovate.",
    onLose: "Lo sapevo io. Le vecchie regole vincono sempre.",
    onWin: "...Ammazza. Forse hai ragione tu. Ma non dirmelo mai più.",
    difficulty: 3,
    firstAnte: 3,
    portrait: 'generic',
  },
  {
    id: 'munaciello_pescatore',
    name: "'O Munaciello Pescatore",
    rule: 'steal_draws',
    ruleDesc: 'Le tue pescate gratuite sono dimezzate in questo round (da 4 a 2).',
    intro: "Ue' guagliò, ho preso io 'ste cartelle. Non le vedi più.",
    onLose: "Il Munaciello dà, il Munaciello toglie. Oggi togliev'.",
    onWin: "Hai giocato con quello che ti ho lasciato. Bravo bravo... ladro.",
    difficulty: 4,
    firstAnte: 5,
    portrait: 'munaciello',
  },
  {
    id: 'munaciello_oro',
    name: "'O Munaciello d'Oro",
    rule: 'double_target',
    ruleDesc: 'BOSS FINALE — Il punteggio richiesto è raddoppiato e una regola casuale è attiva.',
    intro: "Guagliò, sei arrivato fin qua. Bravo. Mo' però perdi.",
    onLose: "L'oro non si tocca, l'oro non si batte!",
    onWin: "STAI ASCÌ PAZZO?! M'hai battuto pure a me, 'o re!",
    difficulty: 5,
    firstAnte: 8,
    portrait: 'munaciello',
  },
];

// ============ JOKERS ============
// 28 jokers (almeno 25 richiesti dal BRIEF). effectCode è una STRINGA JS, non una funzione.
// Sarà eseguita in un wrapper sicuro da game.js tramite new Function('ctx', code).
//
// ctx base (tutti i trigger):
//   chips, mult, money, hand[], played[], scored[], ante, briscolaSeme,
//   jokerState{}, jokerCount, jokerIds[] (array degli id joker posseduti),
//   handsPlayedThisRound (0 = prima mano), discardedThisRound, random()
//
// ctx esteso per trigger specifici:
//   on_card_scored  → + ctx.card = {id, seme, valore, chips}
//   on_hand_played  → + ctx.combo (nome combo rilevata)
//   on_discard      → + ctx.discardedCard = {id, seme, valore, chips}
//   on_round_start  → + ctx.roundChipsBonus (R/W), ctx.roundMultBonus (R/W)
//                      ctx.played e ctx.card NON disponibili (mano non ancora distribuita)
//
// Tarocchi estendono ctx con: deck[], handSize, jokers[], maxJokerSlots,
//   nextJokerFree, requestTransform, turnCount.
//
// VIETATO in effectCode: Math.random, Date, window, document, fetch, eval, import.
// Usa ctx.random() al posto di Math.random().
const JOKERS = [
  // -------- COMMON (10) --------
  {
    id: 'cornicello',
    name: "'O Cornicello",
    emoji: '🪬',
    rarity: 'common',
    cost: 4,
    description: '+30 chips ad ogni mano giocata.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.chips += 30;',
    art: { bg: '#c1272d', icon: '🪬' },
  },
  {
    id: 'caffe_forte',
    name: "'O Caffè Forte",
    emoji: '☕',
    rarity: 'common',
    cost: 4,
    description: 'La prima mano del round dà chips ×3.',
    trigger: 'on_hand_played',
    effectCode: 'if (ctx.handsPlayedThisRound === 0) { ctx.chips *= 3; }',
    art: { bg: '#3e2723', icon: '☕' },
  },
  {
    id: 'baba',
    name: "'O Babà",
    emoji: '🍰',
    rarity: 'common',
    cost: 4,
    description: '+50 chips se la mano contiene un Re.',
    trigger: 'on_hand_played',
    effectCode: 'if (ctx.played.some(c => c.valore === "re")) { ctx.chips += 50; }',
    art: { bg: '#f4c430', icon: '🍰' },
  },
  {
    id: 'sfogliatella',
    name: "'A Sfogliatella",
    emoji: '🥐',
    rarity: 'common',
    cost: 4,
    description: '+20 chips per ogni Fante giocato.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.chips += 20 * ctx.played.filter(c => c.valore === "fante").length;',
    art: { bg: '#d4a017', icon: '🥐' },
  },
  {
    id: 'pizzaiolo',
    name: "'O Pizzaiolo",
    emoji: '🍕',
    rarity: 'common',
    cost: 4,
    description: '+15 chips per ogni carta di Coppe giocata.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.chips += 15 * ctx.played.filter(c => c.seme === "coppe").length;',
    art: { bg: '#e63946', icon: '🍕' },
  },
  {
    id: 'tarallo',
    name: "'O Tarallo",
    emoji: '🥨',
    rarity: 'common',
    cost: 4,
    description: '+1 mult ad ogni mano giocata.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.mult += 1;',
    art: { bg: '#a0522d', icon: '🥨' },
  },
  {
    id: 'limoncello',
    name: "'O Limoncello",
    emoji: '🍋',
    rarity: 'common',
    cost: 4,
    description: '+25 chips se hai giocato esattamente 2 carte.',
    trigger: 'on_hand_played',
    effectCode: 'if (ctx.played.length === 2) { ctx.chips += 25; }',
    art: { bg: '#fff200', icon: '🍋' },
  },
  {
    id: 'sigaro_toscano',
    name: "'O Sigaro Toscano",
    emoji: '🚬',
    rarity: 'common',
    cost: 4,
    description: '+10 chips per ogni carta di Bastoni giocata.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.chips += 10 * ctx.played.filter(c => c.seme === "bastoni").length;',
    art: { bg: '#5d4037', icon: '🚬' },
  },
  {
    id: 'zampogna',
    name: "'A Zampogna",
    emoji: '🎵',
    rarity: 'common',
    cost: 4,
    description: '+12 chips per ogni Cavallo giocato.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.chips += 12 * ctx.played.filter(c => c.valore === "cavallo").length;',
    art: { bg: '#7d5e2a', icon: '🎵' },
  },
  {
    id: 'amuleto_zia',
    name: "'O Amuleto d' 'a Zia",
    emoji: '🧿',
    rarity: 'common',
    cost: 4,
    description: '+1 mult se nella mano c\'è un Asso.',
    trigger: 'on_hand_played',
    effectCode: 'if (ctx.played.some(c => c.valore === 1)) { ctx.mult += 1; }',
    art: { bg: '#1976d2', icon: '🧿' },
  },

  // -------- UNCOMMON (8) --------
  {
    id: 'pesce_oro',
    name: "'O Pesce d'Oro",
    emoji: '🐟',
    rarity: 'uncommon',
    cost: 6,
    description: 'Le carte di Denari danno chips ×2.',
    trigger: 'on_card_scored',
    effectCode: 'if (ctx.card && ctx.card.seme === "denari") { ctx.chips += ctx.card.chips; }',
    art: { bg: '#f4c430', icon: '🐟' },
  },
  {
    id: 're_cafone',
    name: "'O Re Cafone",
    emoji: '👑',
    rarity: 'uncommon',
    cost: 6,
    description: 'I Re danno chips ×3.',
    trigger: 'on_card_scored',
    effectCode: 'if (ctx.card && ctx.card.valore === "re") { ctx.chips += ctx.card.chips * 2; }',
    art: { bg: '#9d4edd', icon: '👑' },
  },
  {
    id: 'smorfia_joker',
    name: "'A Smorfia",
    emoji: '🔮',
    rarity: 'uncommon',
    cost: 6,
    description: 'Le carte 5, 6, 7 danno +20 chips ognuna.',
    trigger: 'on_card_scored',
    effectCode: 'if (ctx.card && [5,6,7].includes(ctx.card.valore)) { ctx.chips += 20; }',
    art: { bg: '#6a1b9a', icon: '🔮' },
  },
  {
    id: 'sfortuna',
    name: "'A Sfortuna",
    emoji: '🖤',
    rarity: 'uncommon',
    cost: 6,
    description: '+5 mult per ogni carta scartata in questo round.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.mult += 5 * (ctx.discardedThisRound || 0);',
    art: { bg: '#0a0a0a', icon: '🖤' },
  },
  {
    id: 'munaciello_buono',
    name: "'O Munaciello Buono",
    emoji: '👻',
    rarity: 'uncommon',
    cost: 6,
    description: 'Generi +3 ducati per ogni mano giocata.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.money += 3;',
    art: { bg: '#37474f', icon: '👻' },
  },
  {
    id: 'mano_nera',
    name: "'A Mano Nera",
    emoji: '✊',
    rarity: 'uncommon',
    cost: 6,
    description: 'Le coppie danno mult ×4 invece di ×2.',
    trigger: 'on_hand_played',
    effectCode: 'if (ctx.combo === "coppia") { ctx.mult *= 2; }',
    art: { bg: '#1a0a14', icon: '✊' },
  },
  {
    id: 'sangue_napoli',
    name: "'O Sangue 'e Napule",
    emoji: '🩸',
    rarity: 'uncommon',
    cost: 6,
    description: 'Se giochi solo carte rosse (Coppe + Denari): +40 chips e +2 mult.',
    trigger: 'on_hand_played',
    effectCode: 'if (ctx.played.length > 0 && ctx.played.every(c => c.seme === "coppe" || c.seme === "denari")) { ctx.chips += 40; ctx.mult += 2; }',
    art: { bg: '#e63946', icon: '🩸' },
  },
  {
    id: 'briscola_cavalcata',
    name: "'A Briscola Cavalcata",
    emoji: '🐎',
    rarity: 'uncommon',
    cost: 6,
    description: '+8 chips per ogni carta del seme briscola giocata.',
    trigger: 'on_card_scored',
    effectCode: 'if (ctx.card && ctx.card.seme === ctx.briscolaSeme) { ctx.chips += 8; }',
    art: { bg: '#2e7d32', icon: '🐎' },
  },

  // -------- UNCOMMON aggiuntivi — trigger on_discard e on_round_start --------
  // Questi joker completano la copertura di trigger (game.js li chiama al momento giusto,
  // non dentro calculateScore). Portano il totale a 28 (il BRIEF dice "almeno 25").
  {
    id: 'corno_iellato',
    name: "'O Corno Iellato",
    emoji: '🪬',
    rarity: 'uncommon',
    cost: 6,
    description: '+3 mult ogni volta che scarti una carta.',
    // trigger on_discard: game.js chiama questo joker quando il giocatore scarta.
    // ctx esteso con ctx.discardedCard = {id, seme, valore, chips}
    trigger: 'on_discard',
    effectCode: 'ctx.mult += 3;',
    art: { bg: '#c1272d', icon: '🪬' },
  },
  {
    id: 'alba_napoletana',
    name: "'A Alba Napoletana",
    emoji: '🌅',
    rarity: 'uncommon',
    cost: 6,
    description: 'All\'inizio di ogni round: +15 chips e +1 mult di base.',
    // trigger on_round_start: game.js chiama questo joker quando inizia un nuovo round
    // (prima di distribuire le carte). ctx NON ha ctx.played qui — solo ctx.chips, ctx.mult,
    // ctx.money, ctx.ante, ctx.roundChipsBonus (R/W), ctx.roundMultBonus (R/W).
    trigger: 'on_round_start',
    effectCode: 'ctx.roundChipsBonus = (ctx.roundChipsBonus || 0) + 15; ctx.roundMultBonus = (ctx.roundMultBonus || 0) + 1;',
    art: { bg: '#f4c430', icon: '🌅' },
  },
  {
    id: 'pizza_fritta',
    name: "'A Pizza Fritta",
    emoji: '🍕',
    rarity: 'uncommon',
    cost: 6,
    description: 'Se possiedi anche \'O Pizzaiolo: i bonus Coppe si raddoppiano.',
    // Sinergia esplicita: questo joker potenzia 'pizzaiolo'. È il prototipo di sinergia
    // joker-joker. game.js deve applicarlo: se sia pizza_fritta che pizzaiolo sono presenti,
    // il bonus Coppe di pizzaiolo vale 30 chips invece di 15.
    // Implementazione: on_hand_played, controlla jokerState per flag di sinergia.
    trigger: 'on_hand_played',
    effectCode: 'const hasPizzaiolo = ctx.jokerCount > 0 && ctx.jokerIds && ctx.jokerIds.includes("pizzaiolo"); if (hasPizzaiolo) { ctx.chips += 15 * ctx.played.filter(c => c.seme === "coppe").length; }',
    art: { bg: '#e63946', icon: '🍕' },
  },

  // -------- RARE (5) --------
  {
    id: 'diavolo',
    name: "'O Diavolo",
    emoji: '😈',
    rarity: 'rare',
    cost: 8,
    description: '+1 mult ad ogni mano. Si resetta quando incontri un boss.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.jokerState.diavolo = (ctx.jokerState.diavolo || 0) + 1; ctx.mult += ctx.jokerState.diavolo;',
    art: { bg: '#c1272d', icon: '😈' },
  },
  {
    id: 'tarantella',
    name: "'A Tarantella",
    emoji: '💃',
    rarity: 'rare',
    cost: 8,
    description: 'Per ogni joker che possiedi, +0.5 mult ad ogni mano.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.mult += 0.5 * (ctx.jokerCount || 0);',
    art: { bg: '#ff6ec7', icon: '💃' },
  },
  {
    id: 'mago_alchimista',
    name: "'O Mago Alchimista",
    emoji: '🧙',
    rarity: 'rare',
    cost: 8,
    description: 'Le coppie e i tris danno +50 chips bonus extra.',
    trigger: 'on_hand_played',
    effectCode: 'if (ctx.combo === "coppia" || ctx.combo === "tris") { ctx.chips += 50; }',
    art: { bg: '#4a148c', icon: '🧙' },
  },
  {
    id: 'campana_gennaro',
    name: "'A Campana 'e San Gennaro",
    emoji: '🔔',
    rarity: 'rare',
    cost: 8,
    description: 'Se la mano contiene almeno una figura di OGNI seme: chips ×2.',
    trigger: 'on_hand_played',
    effectCode: 'const semi = new Set(ctx.played.filter(c => ["fante","cavallo","re"].includes(c.valore)).map(c => c.seme)); if (semi.size === 4) { ctx.chips *= 2; }',
    art: { bg: '#d4a017', icon: '🔔' },
  },
  {
    id: 'cuoppo_fritto',
    name: "'O Cuoppo Fritto",
    emoji: '🍤',
    rarity: 'rare',
    cost: 8,
    description: 'Se giochi 4+ carte: +80 chips e +3 mult.',
    trigger: 'on_hand_played',
    effectCode: 'if (ctx.played.length >= 4) { ctx.chips += 80; ctx.mult += 3; }',
    art: { bg: '#ff8f00', icon: '🍤' },
  },

  // -------- LEGENDARY (2) --------
  {
    id: 'maradona_dieci',
    name: "'O Diez (Maradona)",
    emoji: '⚽',
    rarity: 'legendary',
    cost: 20,
    description: 'Mult ×3 ad ogni mano. Punto d\'oro: chips +100 se giochi una Napoletana.',
    trigger: 'on_hand_played',
    effectCode: 'ctx.mult *= 3; if (ctx.combo === "napoletana") { ctx.chips += 100; }',
    art: { bg: '#0d47a1', icon: '⚽' },
  },
  {
    id: 'vesuvio_eruzione',
    name: "'O Vesuvio in Eruzione",
    emoji: '🌋',
    rarity: 'legendary',
    cost: 20,
    description: 'Ogni Asso giocato: +50 chips e +1 mult. Effetto cumulativo.',
    trigger: 'on_card_scored',
    effectCode: 'if (ctx.card && ctx.card.valore === 1) { ctx.chips += 50; ctx.mult += 1; }',
    art: { bg: '#bf360c', icon: '🌋' },
  },
];

// ============ MAZZETTI ============
// Mazzetti: carte speciali ispirate alla cultura napoletana, type='mazzetto' per
// distinguerli dai Joker. Stesso schema (id, name, rarity, trigger, effectCode, ...).
// Sono inclusi nel pool joker dello shop ma con identità separata.
const MAZZETTI = [
  {
    id: 'cicirinella', name: "'A Cicirinella", type: 'mazzetto',
    rarity: 'comune', trigger: 'on_hand_played',
    description: 'Se giochi una combo da 2 carte: +3 mult.',
    effectCode: 'if (ctx.played.length === 2) { ctx.mult += 3; }',
    emoji: '🐦',
    art: { bg: '#1a8a3e', icon: '🐦' },
    flavor: "Piccola, precisa, letale."
  },
  {
    id: 'scupetta', name: "'A Scupetta", type: 'mazzetto',
    rarity: 'comune', trigger: 'on_hand_played',
    description: 'Ogni scarta fatta questo round vale +8 chips.',
    effectCode: 'ctx.chips += 8 * (ctx.discardedThisRound || 0);',
    emoji: '🧹',
    art: { bg: '#5d4037', icon: '🧹' },
    flavor: "Pulisci il campo prima di sparare."
  },
  {
    id: 'piscatore', name: "'O Piscatore", type: 'mazzetto',
    rarity: 'comune', trigger: 'on_card_scored',
    description: 'Ogni carta di Spade: +6 chips.',
    effectCode: 'if (ctx.card && ctx.card.seme === "spade") { ctx.chips += 6; }',
    emoji: '🎣',
    art: { bg: '#2196f3', icon: '🎣' },
    flavor: "Taglia il mare come le spade tagliano l'aria."
  },
  {
    id: 'canestro_pane', name: "'O Canestro 'e Pane", type: 'mazzetto',
    rarity: 'comune', trigger: 'on_round_start',
    description: 'Inizio round: +1 ducato.',
    effectCode: 'ctx.money += 1;',
    emoji: '🍞',
    art: { bg: '#d4a017', icon: '🍞' },
    flavor: "Il pane non manca mai sul tavolo di chi sa giocare."
  },
  {
    id: 'tammorra', name: "'A Tammorra", type: 'mazzetto',
    rarity: 'comune', trigger: 'on_hand_played',
    description: 'Se non hai scartato in questo round: +20 chips.',
    effectCode: 'if ((ctx.discardedThisRound || 0) === 0) { ctx.chips += 20; }',
    emoji: '🥁',
    art: { bg: '#e63946', icon: '🥁' },
    flavor: "Suona forte solo quando le mani sono libere."
  },
  {
    id: 'quartino_vino', name: "'O Quartino 'e Vino", type: 'mazzetto',
    rarity: 'comune', trigger: 'on_hand_played',
    description: 'Se giochi almeno una figura: +1 mult.',
    effectCode: 'if (ctx.played.some(function(c){return ["fante","cavallo","re"].includes(c.valore);})) { ctx.mult += 1; }',
    emoji: '🍷',
    art: { bg: '#9d4edd', icon: '🍷' },
    flavor: "Vino e figure vanno a braccetto."
  },
  {
    id: 'sfizio', name: "'O Sfizio", type: 'mazzetto',
    rarity: 'comune', trigger: 'on_hand_played',
    description: 'Se giochi 5 o più carte in una mano: +15 chips.',
    effectCode: 'if (ctx.played.length >= 5) { ctx.chips += 15; }',
    emoji: '🌟',
    art: { bg: '#2e7d32', icon: '🌟' },
    flavor: "Lo sfizio si toglie solo quando si gioca tutto."
  },
  {
    id: 'bicchiere_amaro', name: "'O Bicchiere d'Amaro", type: 'mazzetto',
    rarity: 'comune', trigger: 'on_hand_played',
    description: 'Ultima mano del round: chips ×1.5.',
    effectCode: 'if ((ctx.handsLeft || 0) === 0) { ctx.chips = Math.floor(ctx.chips * 1.5); }',
    emoji: '🥃',
    art: { bg: '#8b6914', icon: '🥃' },
    flavor: "L'ultimo bicchiere è sempre il più buono."
  },
  {
    id: 'cornetto_rosso', name: "'O Cornetto Rosso", type: 'mazzetto',
    rarity: 'comune', trigger: 'passive',
    description: 'Briscola Coppe o Denari: +10 chips per mano.',
    effectCode: 'if (ctx.briscolaSeme === "coppe" || ctx.briscolaSeme === "denari") { ctx.chips += 10; }',
    emoji: '🪬',
    art: { bg: '#e63946', icon: '🪬' },
    flavor: "Il cornetto rosso porta bene solo ai semi rossi."
  },
  {
    id: 'guapparia', name: "'A Guapparia", type: 'mazzetto',
    rarity: 'raro', trigger: 'on_hand_played',
    description: 'Nuovo record personale di mano: +4 mult.',
    effectCode: 'var s=ctx.chips*(ctx.mult||1); if(s>(ctx.jokerState.guapparia_rec||0)){ctx.jokerState.guapparia_rec=s; ctx.mult+=4;}',
    emoji: '💪',
    art: { bg: '#1a0a14', icon: '💪' },
    flavor: "La guapparia vera si dimostra solo superando se stessi."
  },
  {
    id: 'pulcinella_bianco', name: "Pulcinella Bianco", type: 'mazzetto',
    rarity: 'raro', trigger: 'on_hand_played',
    description: 'Hai scarti inutilizzati: chips ×1.5.',
    effectCode: 'if ((ctx.discardsLeft || 0) > 0) { ctx.chips = Math.floor(ctx.chips * 1.5); }',
    emoji: '🎭',
    art: { bg: '#fff8e7', icon: '🎭' },
    flavor: "Il gemello buono: gioca pulito e ti premia."
  },
  {
    id: 'osteria_nobili', name: "'A Osteria d' 'e Nobili", type: 'mazzetto',
    rarity: 'raro', trigger: 'on_hand_played',
    description: 'Mano di sole figure (≥2): chips ×2 e +5 mult.',
    effectCode: 'var fig=["fante","cavallo","re"]; if(ctx.played.length>=2&&ctx.played.every(function(c){return fig.includes(c.valore);})){ctx.chips*=2;ctx.mult+=5;}',
    emoji: '🏰',
    art: { bg: '#4a148c', icon: '🏰' },
    flavor: "All'Osteria dei Nobili entrano solo chi ha la faccia giusta."
  },
  {
    id: 'smorfia_vivente', name: "'A Smorfia Vivente", type: 'mazzetto',
    rarity: 'raro', trigger: 'on_card_scored',
    description: 'Carta valore 7: +25 chips e +1 mult.',
    effectCode: 'if (ctx.card && ctx.card.valore === 7) { ctx.chips += 25; ctx.mult += 1; }',
    emoji: '📜',
    art: { bg: '#6a1b9a', icon: '📜' },
    flavor: "Il 7 è 'o settebello — e vale il doppio qui."
  },
  {
    id: 'munaciello_ladro', name: "'O Munaciello Ladro", type: 'mazzetto',
    rarity: 'raro', trigger: 'on_discard',
    description: 'Ogni carta scartata: +2 mult.',
    effectCode: 'ctx.mult += 2;',
    emoji: '👻',
    art: { bg: '#37474f', icon: '👻' },
    flavor: "Porta via ma lascia sempre qualcosa."
  },
  {
    id: 'femmeniello', name: "'O Femmeniello", type: 'mazzetto',
    rarity: 'raro', trigger: 'passive',
    description: 'Passivo: +1 mult base per ogni calcolo.',
    effectCode: 'ctx.mult += 1;',
    emoji: '🌸',
    art: { bg: '#ff6ec7', icon: '🌸' },
    flavor: "Porta fortuna a chi lo rispetta."
  },
  {
    id: 'tombola_card', name: "'A Tombola!", type: 'mazzetto',
    rarity: 'raro', trigger: 'on_hand_played',
    description: 'Primiera (4 semi diversi): +30 chips.',
    effectCode: 'var s=new Set(ctx.played.map(function(c){return c.seme;})); if(s.size===4){ctx.chips+=30;}',
    emoji: '🎰',
    art: { bg: '#f4c430', icon: '🎰' },
    flavor: "TOMBOLA! Quattro semi, una sola vincitrice."
  },
  {
    id: 'cascione', name: "'O Cascione", type: 'mazzetto',
    rarity: 'leggendario', trigger: 'on_hand_played',
    description: 'Asso + carta briscola: +2 mult per carta briscola. Napoletana o Napola: +100 chips.',
    effectCode: 'var bs=ctx.briscolaSeme; var bc=ctx.played.filter(function(c){return c.seme===bs;}); if(ctx.played.some(function(c){return c.valore===1;})&&bc.length>0){ctx.mult+=2*bc.length; if(ctx.combo==="napoletana"||ctx.combo==="napola_mista"){ctx.chips+=100;}}',
    emoji: '📦',
    art: { bg: '#f4c430', icon: '📦' },
    flavor: "Chi apre 'o cascione vince sempre."
  },
  {
    id: 'san_gennaro_buono', name: "San Gennaro Buono", type: 'mazzetto',
    rarity: 'leggendario', trigger: 'passive',
    description: 'Passivo: +2 mult. Il santo protegge sempre.',
    effectCode: 'ctx.mult += 2;',
    emoji: '⛪',
    art: { bg: '#c1272d', icon: '⛪' },
    flavor: "Il miracolo del sangue: si scioglie per chi crede."
  },
  {
    id: 'capodanno_napoletano', name: "'O Capodanno Napulitano", type: 'mazzetto',
    rarity: 'leggendario', trigger: 'on_round_start',
    description: 'Inizio Boss Blind: +5 mult × jolly/mazzetti in slot.',
    effectCode: 'if(ctx.blindType==="boss"){ctx.roundMultBonus=(ctx.roundMultBonus||0)+5*(ctx.jokerCount||0);}',
    emoji: '🎆',
    art: { bg: '#e63946', icon: '🎆' },
    flavor: "A Capodanno si butta tutto dal balcone. E si ricomincia più forti."
  },
  {
    id: 'janara_amica', name: "'A Janara Amica", type: 'mazzetto',
    rarity: 'raro', trigger: 'passive',
    description: 'Passivo: +15 chips per ogni mano.',
    effectCode: 'ctx.chips += 15;',
    emoji: '🧙‍♀️',
    art: { bg: '#4a148c', icon: '🧙‍♀️' },
    flavor: "La Janara amica porta bene invece di toglierlo."
  },
];

// ============ TAROTS ============
// 10 carte tarocco consumabili. effectCode opera su ctx esteso:
// ctx.deck, ctx.hand, ctx.money, ctx.handSize, ctx.tarotsOwned, ecc.
const TAROTS = [
  {
    id: 'mago',
    name: 'Il Mago',
    emoji: '🎩',
    description: 'Trasforma 2 carte selezionate in copie di una terza carta scelta.',
    effectCode: 'ctx.requestTransform && ctx.requestTransform(2);',
  },
  {
    id: 'imperatrice',
    name: 'L\'Imperatrice',
    emoji: '👸',
    description: 'Aumenta permanentemente la dimensione della mano di +1.',
    effectCode: 'ctx.handSize += 1;',
  },
  {
    id: 'ruota',
    name: 'La Ruota',
    emoji: '☸',
    description: '25% di probabilità di rendere un Joker casuale "Foil" (chips ×1.5).',
    // FIX: usa ctx.random() invece di Math.random() — i tarocchi devono rispettare
    // il determinismo del ctx. Math.random() non è whitelistato nel ctx sandbox.
    effectCode: 'if (ctx.random() < 0.25 && ctx.jokers.length > 0) { const j = ctx.jokers[Math.floor(ctx.random()*ctx.jokers.length)]; j.foil = true; }',
  },
  {
    id: 'sole',
    name: "'O Sole",
    emoji: '☀️',
    description: 'Ricevi +50 ducati immediatamente.',
    effectCode: 'ctx.money += 50;',
  },
  {
    id: 'luna',
    name: "'A Luna",
    emoji: '🌙',
    description: 'Trasforma il 30% del mazzo in carte di un seme casuale.',
    effectCode: 'const semi = ["bastoni","coppe","denari","spade"]; const s = semi[Math.floor(ctx.random()*4)]; const n = Math.floor(ctx.deck.length * 0.3); const seen = {}; for (let i = 0; i < n; i++) { const base = s + "_" + ctx.deck[i].valore; seen[base] = (seen[base] || 0) + 1; ctx.deck[i].seme = s; ctx.deck[i].id = seen[base] > 1 ? base + "_" + seen[base] : base; }',
  },
  {
    id: 'torre',
    name: 'La Torre',
    emoji: '🗼',
    description: 'Distrugge 2 carte casuali dal mazzo. Crudele ma necessario.',
    // FIX: usa ctx.random() invece di Math.random() — stesso motivo di La Ruota.
    effectCode: 'for (let i = 0; i < 2 && ctx.deck.length > 10; i++) { const idx = Math.floor(ctx.random() * ctx.deck.length); ctx.deck.splice(idx, 1); }',
  },
  {
    id: 'stelle',
    name: 'Le Stelle',
    emoji: '⭐',
    description: 'Pesca 3 carte rare dal cosmo: aggiungi 3 Assi al mazzo.',
    effectCode: 'const semi = ["bastoni","coppe","denari","spade"]; for (let i = 0; i < 3; i++) { const s = semi[Math.floor(ctx.random()*4)]; ctx.deck.push({ id: s + "_1_extra_" + ctx.turnCount + "_" + i, seme: s, valore: 1, chips: 11 }); }',
  },
  {
    id: 'giudizio',
    name: 'Il Giudizio',
    emoji: '⚖️',
    description: 'Tutte le carte numeriche (2,4,5,6) diventano 7 per questo round.',
    effectCode: 'const count = {}; ctx.deck.forEach(c => { if ([2,4,5,6].includes(c.valore)) { c.valore = 7; c.chips = 0; const base = c.seme + "_7"; count[base] = (count[base] || 0) + 1; c.id = count[base] > 1 ? base + "_" + count[base] : base; } });',
  },
  {
    id: 'forza',
    name: 'La Forza',
    emoji: '💪',
    description: 'Il prossimo Joker comprato è gratis (costa 0 ducati).',
    effectCode: 'ctx.nextJokerFree = true;',
  },
  {
    id: 'papessa',
    name: 'La Papessa',
    emoji: '🌒',
    description: 'Aggiunge +1 slot Joker permanentemente (max 7).',
    effectCode: 'if (ctx.maxJokerSlots < 7) { ctx.maxJokerSlots += 1; }',
  },
];

// ============ SMORFIA ============
// 50+ voci. Usato dalla Tombola e da easter eggs.
const SMORFIA = {
  1: "'o paesano",
  2: "'a piccerélla",
  3: "'a jatta",
  4: "'o puorco",
  5: "'a mano",
  6: "'a guarduta 'nterra",
  7: "'o vase",
  8: "'a Maronna",
  9: "'a figliata",
  10: "'e fasule",
  11: "'e suricille",
  12: "'e surdate",
  13: "Sant'Antonio",
  14: "'o mbriaco",
  15: "'o guaglione",
  16: "'o culo",
  17: "'a disgrazia",
  18: "'o sanghe",
  19: "'a risata",
  20: "'a festa",
  21: "'a femmena annura",
  22: "'o pazzo",
  23: "'o scemo",
  24: "'e gguardie",
  25: "Natale",
  26: "Nanninella",
  27: "'o cantero",
  28: "'e zizze",
  29: "'o pate d''e ccriature",
  30: "'e ppalle d''o tenente",
  31: "'o padrone 'e casa",
  32: "'o capitone",
  33: "ll'anne 'e Cristo",
  34: "'a capa",
  35: "ll'aucielle",
  36: "'e ccastagnelle",
  37: "'o monaco",
  38: "'e mmazzate",
  39: "'a funa 'n cuollo",
  40: "'a noia",
  41: "'o curtiello",
  42: "'o ccafé",
  43: "'a femmena 'o barcone",
  44: "'e ccancelle",
  45: "'o vino bbuono",
  46: "'e denare",
  47: "'o muorto",
  48: "'o muorto che pparla",
  49: "'o piezz' 'e carne",
  50: "'o ppane",
  51: "'o ciardino",
  52: "'a mamma",
  53: "'o viecchio",
  54: "'o cappiello",
  55: "'a museca",
  56: "'a caduta",
  57: "'o scartellato",
  58: "'o paccotto",
  59: "'e ppile",
  60: "'o lamiento",
  61: "'o cacciatore",
  62: "'o muorto acciso",
  63: "'a sposa",
  64: "'a sciammeria",
  65: "'o chianto",
  66: "'e doie zetelle",
  67: "'o totaro int' 'a chitarra",
  68: "'a zuppa cotta",
  69: "sotto e ncoppa",
  70: "'o palazzo",
  71: "ll'ommo 'e merda",
  72: "'a maraviglia",
  73: "'o spitale",
  74: "'a rotta",
  75: "Pulcinella",
  76: "'a fontana",
  77: "'e diavule",
  78: "'a bella figliola",
  79: "'o mariuolo",
  80: "'a vocca",
  81: "'e sciure",
  82: "'a tavula 'mbandita",
  83: "'o maletiempo",
  84: "'a cchiesa",
  85: "ll'aneme 'o priatorio",
  86: "'a puteca",
  87: "'e perucchie",
  88: "'e ccaccavelle",
  89: "'a vecchia",
  90: "'a paura",
};

// ============ SLOT SYMBOLS ============
// Pesi relativi: somma irrilevante, è probabilità ponderata.
// Più alto il weight → più frequente.
const SLOT_SYMBOLS = [
  { id: 'cherry',  label: 'CILIEGIA', weight: 30 },
  { id: 'lemon',   label: 'LIMONE',   weight: 25 },
  { id: 'bell',    label: 'CAMPANA',  weight: 20 },
  { id: 'coin',    label: 'MONETA',   weight: 15 },
  { id: 'seven',   label: 'SETTE',    weight: 6  },
  { id: 'star',    label: 'STELLA',   weight: 3  },  // 3× = lootbox gratis
  { id: 'diamond', label: 'DIAMANTE', weight: 1  },  // 3× = JACKPOT 1000
];

// ============ PREDICTIONS ============
// Previsioni del Mago Astrologo. Mostrate al game over (e victory).
// Tono: esagerato, drammatico, ridicolo, finale comico.
const PREDICTIONS = {
  generic: [
    "Domani perderai le chiavi di casa proprio mentre piove. Comprati un ombrello rosso, fa portafortuna.",
    "Tra 3 giorni un piccione ti caca in testa. È fortuna, dicono. Bugia, è solo cacca.",
    "Hai un esame? Lascia perdere. Vai a mangiare 'na pizza, almeno quella la vinci.",
    "La tua ex/o ex ti penserà oggi. Spegni il telefono. SUBITO.",
    "Stasera mangerai qualcosa che ti farà stare male. Ma era buono, eh.",
    "Troverai 50 centesimi per terra. Saranno gli unici soldi che vedrai questa settimana.",
    "Il wifi del tuo vicino smetterà di funzionare. Sì, lo usavi tu.",
    "Tua nonna ti chiamerà per chiederti se sei dimagrito. Mentile.",
    "Domenica pioverà solo sopra di te. Tutti gli altri al sole.",
    "Riceverai un messaggio importante. Lo leggerai 4 ore dopo. Sarà tardi.",
    "La pasta scuocerà di un minuto preciso. Sentirai il rumore della sconfitta.",
    "Un'auto ti suonerà il clacson per niente. Tu rispondi col dito. Era tuo cugino.",
  ],
  ariete: [
    "La tua testa dura ti porterà a sbattere contro un muro. Letteralmente. Stai attento alle porte.",
    "Vorrai litigare con qualcuno. Sceglierai la persona sbagliata. Buona fortuna.",
  ],
  toro: [
    "Il tuo conto in banca farà 'meno' invece di 'più'. Niente bistecca questa settimana.",
    "Mangerai troppo a cena. Dormirai male. Sognerai un broccolo che ti insegue.",
  ],
  gemelli: [
    "Avrai due idee contemporanee. Saranno entrambe sbagliate.",
    "Cambierai opinione 7 volte in un'ora. La 7ª era quella giusta. Hai cambiato di nuovo.",
  ],
  cancro: [
    "Piangerai guardando una pubblicità di pasta. È ok, succede.",
    "Tornerai a casa di tua madre per il pranzo. Resterai 4 giorni. Si chiama autunno.",
  ],
  leone: [
    "Il tuo ego prenderà uno schiaffo. Ti farà bene. Forse.",
    "Pubblicherai una foto figa. Nessuno metterà like. Questo è il vero dolore.",
  ],
  vergine: [
    "Troverai un capello nel tuo cibo. In un ristorante stellato.",
    "Riordinerai tutto. Qualcuno sposterà UNA cosa. Diventerai un'altra persona.",
  ],
  bilancia: [
    "Non riuscirai a decidere cosa mangiare. Finirai per non mangiare.",
    "Dovrai scegliere tra due opzioni. Sceglierai una terza che non esisteva. Andrà male.",
  ],
  scorpione: [
    "Il tuo veleno tornerà indietro. Sì, lo sai di cosa parlo.",
    "Avrai una vendetta perfetta in mente. La rovinerai dimenticando il piano. Bravo.",
  ],
  sagittario: [
    "Prenoterai un viaggio. Lo cancelleranno. Non rimborsano.",
    "Vorrai partire all'avventura. Resterai a letto fino alle 14. È un'avventura interiore.",
  ],
  capricorno: [
    "Lavorerai gratis. Lo scoprirai dopo.",
    "Risparmierai per 6 mesi. Spenderai tutto in un weekend. Ti sentirai vivo.",
  ],
  acquario: [
    "La tua idea geniale l'ha già avuta uno su TikTok. Tre anni fa.",
    "Sarai 'diverso dagli altri'. Come gli altri 8 miliardi che dicono lo stesso.",
  ],
  pesci: [
    "Sognerai qualcosa di bellissimo. Al risveglio ti dimenticherai tutto.",
    "Piangerai per un film d'animazione. Davanti a tutta la famiglia. Non te ne pentirai.",
  ],
  victory: [
    "Oggi troverai un parcheggio in centro. Sì, anche se è sabato pomeriggio.",
    "La cassiera del supermercato ti sorriderà. Non sei tu, è il tuo segno.",
    "Il caffè al bar ti uscirà con la schiumetta perfetta. Dura solo oggi però.",
    "Riceverai un complimento sincero. Anche tu, una volta nella vita.",
    "Il semaforo sarà verde quando arrivi. Tutti i semafori. Vivi questo momento.",
  ],
};

// ============ ZODIAC BONUSES ============
// Funzioni REALI (non stringhe): chiamate solo dal codice trusted all'inizio della run.
const ZODIAC_BONUSES = {
  ariete: {
    desc: '+1 mano al primo round di ogni Ante.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_ariete = true; },
  },
  toro: {
    desc: '+20 ducati di partenza.',
    apply: (state) => { if (state.currentRun) state.currentRun.money = (state.currentRun.money || 0) + 20; },
  },
  gemelli: {
    desc: 'Pesca 1 carta extra all\'inizio di ogni round.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_gemelli = true; },
  },
  cancro: {
    desc: '+1 scarto per ogni round.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_cancro = true; },
  },
  leone: {
    desc: 'La prima mano del round dà chips ×1.5.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_leone = true; },
  },
  vergine: {
    desc: 'Le carte in mano vengono ordinate per seme automaticamente dopo ogni pescata.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_vergine = true; },
  },
  bilancia: {
    desc: 'Target ridotto del 5% all\'Ante 1.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_bilancia = true; },
  },
  scorpione: {
    desc: 'Drop rate Joker rari +2%.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_scorpione = true; },
  },
  sagittario: {
    desc: 'Vedi 1 carta in più del mazzo (peek).',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_sagittario = true; },
  },
  capricorno: {
    desc: 'L\'interesse in tasca è raddoppiato (max +10).',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_capricorno = true; },
  },
  acquario: {
    desc: '1 reroll shop gratis ad ogni negozio.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_acquario = true; },
  },
  pesci: {
    desc: 'I Tarocchi costano 1 ducato in meno.',
    apply: (state) => { if (state.currentRun) state.currentRun.zodiacFlag_pesci = true; },
  },
};

// ============ STRINGS (i18n base — italiano) ============
// Livello 1 = funzionale (italiano standard, traducibile).
// Livello 2 = flavor (Gennarino, frasi dialettali).
const STRINGS = {
  it: {
    // ---- UI critica ----
    play: 'Gioca',
    discard: 'Scarta',
    score: 'Punteggio',
    hand: 'Mano',
    deck: 'Mazzo',
    card: 'Carta',
    victory: 'Vittoria',
    defeat: 'Sconfitta',
    shop: 'Negozio',
    buy: 'Acquista',
    sell: 'Vendi',
    reroll: 'Rilancia',
    ante: 'Ante',
    round: 'Round',
    joker: 'Jolly',
    target: 'Obiettivo',
    hands: 'Mani',
    discards: 'Scarti',
    coins: 'Ducati',
    quit: 'Abbandona',
    continue: 'Continua',
    nextRound: 'Prossimo Round',
    skip: 'Salta',
    confirm: 'Conferma',
    cancel: 'Annulla',
    settings: 'Impostazioni',
    audio: 'Audio',
    volume: 'Volume',
    sound: 'Suono',
    music: 'Musica',
    save: 'Salva',
    load: 'Carica',
    menu: 'Menu',
    newRun: 'Nuova Run',

    // ---- Combinazioni ----
    single: 'Carta Singola',
    coppia: 'Coppia',
    tris: 'Tris',
    poker: 'Poker',
    napoletana: 'Napoletana',
    carico: 'Carico',
    primiera: 'Primiera',
    scopa: 'Scopa',
    settebello: 'Settebello',
    briscola: 'Briscola',
    bazzica:        'BAZZICA',
    briscola_reale: 'BRISCOLA REALE',
    calabresella:   'CALABRESELLA',
    sette_e_mezzo:  'SETTE E MEZZO',
    napola_mista:   'NAPOLA',
    mazzetti: 'MAZZETTI',

    // ---- Semi ----
    bastoni: 'Bastoni',
    coppe: 'Coppe',
    denari: 'Denari',
    spade: 'Spade',

    // ---- Valori ----
    asso: 'Asso',
    fante: 'Fante',
    cavallo: 'Cavallo',
    re: 'Re',

    // ---- HUD blind ----
    smallBlind: "'O Cieco Piccolo",
    bigBlind: "'O Cieco Grande",
    bossBlind: "'O Boss",
    blindReward: 'Ricompensa',

    // ---- Negozio ----
    shopTitle: "'O Negozio 'e Don Carmine",
    shopSubtitle: "Spendi sti ducati ca te bruciano 'ncopp' 'a sacca",
    rerollCost: 'Costo rilancio',
    pack: 'Pacchetto',
    tarot: 'Tarocco',
    lootbox: 'Lootbox',

    // ---- DEMO MODE ----
    demoMode: "DEMO MODE — E chi paga? Magari un giorno... 😜",
    demoUnlocked: "DEMO MODE! Prendete tutto, guagliò, è offerta della casa!",

    // ---- Toast / errors ----
    notEnoughCoins: 'Non hai abbastanza ducati!',
    jokerFull: 'Hai già 5 jolly, guagliò!',
    handEmpty: 'Selezione vuota!',
    cantDiscard: 'Non puoi scartare in questo round!',
    cantPlay: 'Non puoi giocare ora!',
    invalidCombo: 'Combinazione non valida.',
    saveOk: 'Partita salvata!',
    loadOk: 'Partita caricata.',

    // ---- Stati ----
    loading: "Aspè 'nu mumento, sto pensanno...",
    gameOver: "Mannaggia 'a marina, hai perso!",
    victory_msg: 'STAI ASCÌ PAZZO? HAI VINTO!',
    bossDefeated: 'Mannaggia... bravo guagliò, mi hai fottuto.',

    // ---- Zodiaco ----
    zodiacTitle: '🔮 Prima di iniziare... \'o Mago vuole sapere',
    zodiacSubtitle: 'Scegli il tuo segno. Ti darà una mano. Forse.',
    predictionTitle: "🔮 'O MAGO HA PARLATO 🔮",
    predictionAccept: 'ACCETTO IL MIO DESTINO',

    // ---- Tombola ----
    tombolaTitle: 'Tombola del Munaciello',
    tombolaExtract: 'Estrai',
    tombolaLine: 'Riga!',
    tombolaColumn: 'Colonna!',
    tombolaFull: 'TOMBOLA!',

    // ---- Slot ----
    slotTitle: 'Slot Machine',
    slotPlay: 'TIRA LA LEVA',
    jackpot: 'JACKPOT!',

    // ---- Gennarino flavor (livello 2) ----
    gennarino: [
      "Ué guagliò, mo' te faccio vedè io!",
      "Statte tranquillo, ce penso io!",
      "Fidate 'e zio Gennarino!",
      "Mannaggia 'a Marina, che mano!",
      "Embè? Tutto qua?",
      "Sant'Antonio mio bello!",
      "Mò te spiego comme se fa...",
      "Madonna 'e Pompei!",
      "Aieri sera ho vinto a tombola, giuro!",
      "Stamm a fa' 'a famme!",
      "'O caffè vuò?",
      "Vai tranquillo, va'!",
      "Stutate 'a luce, sto pensando!",
      "Chella è 'na carta tosta!",
      "Mamma mia che sciagura!",
      "Forza Napoli, anche se non c'entra niente!",
      "Statte zitto e gioca!",
      "Ammuoina! Ammuoina!",
      "Vincimm 'sta partita e poi se magna!",
      "'O Munaciello me sta verenno...",
      "Madonna mia bella, che combo!",
      "Tene 'na mano c' 'a faceva schifo pure 'o cane mio!",
      "Vir' che t'aggio purtato oggi!",
      "Ué ué ué, calma e gesso!",
      "Statte buono, statte!",
    ],

    // ---- Frasi vittoria/sconfitta extra ----
    winPhrases: [
      'JACKPOT! Ricco sfunnato comme a \'nu re!',
      'Madonna mia, che mano! ME STO INNAMORANDO!',
      'Bravo guagliò, fai onore al cognome!',
      'Hai chiuso \'o conto? Bravo, mo\' paghi!',
    ],
    losePhrases: [
      'Mannaggia \'a marina, hai perso!',
      'Eh guagliò... sciagura!',
      'Te l\'avevo detto io di scartare \'a coppa!',
      'Tieni \'na mano c\' \'a faceva schifo pure \'o cane mio.',
    ],

    // ---- UI keys i18n (chiavi puntate, separate dalle key flat sopra) ----
    // Menu
    'menu.play': 'GIOCA',
    'menu.howToPlay': 'COME SI GIOCA?',
    'menu.shop': 'NEGOZIO PREMIUM',
    'menu.minigames': 'MINIGIOCHI',
    'menu.collection': 'COLLEZIONE',
    'menu.settings': '⚙ IMPOSTAZIONI',
    // HUD
    'hud.ante': 'ANTE',
    'hud.round': 'ROUND',
    'hud.score': 'PUNTI',
    'hud.target': 'OBIETTIVO',
    'hud.hands': 'MANI',
    'hud.discards': 'SCARTI',
    'hud.ducats': 'DUCATI',
    'hud.briscola': 'BRISCOLA',
    // Game buttons
    'btn.playHand': 'GIOCA',
    'btn.discard': 'SCARTA',
    'btn.sortRank': 'ORDINA',
    'btn.sortSuit': 'ORDINA SEME',
    'btn.combo': 'COMBO?',
    'btn.infoRun': 'INFO RUN',
    'btn.abandon': 'ABBANDONA',
    // Shop
    'shop.title': 'NEGOZIO',
    'shop.reroll': 'RILANCIA',
    'shop.next': 'AVANTI »',
    // End
    'end.victory': '🏆 HAI VINTO!',
    'end.defeat': '💀 HAI PERSO',
    'end.retry': 'RIGIOCA',
    'end.menu': 'MENU',
    // Settings
    'settings.title': '⚙ IMPOSTAZIONI',
    'settings.audio': 'AUDIO',
    'settings.bgmVol': 'MUSICA',
    'settings.sfxVol': 'EFFETTI',
    'settings.mute': 'MUTO',
    'settings.unmute': 'SUONO',
    'settings.zodiac': 'SEGNO ZODIACALE',
    'settings.changeZodiac': 'CAMBIA SEGNO',
    'settings.stats': 'STATISTICHE',
    'settings.reset': 'RESET SALVATAGGIO',
    'settings.back': '« INDIETRO',
    'settings.lang': 'LINGUA',
    // Stats
    'stat.played': 'Partite giocate',
    'stat.wins': 'Vittorie',
    'stat.losses': 'Sconfitte',
    'stat.bosses': 'Boss battuti',
    'stat.bestScore': 'Punteggio migliore',
    'stat.ducats': 'Ducati totali',
    'stat.favCombo': 'Combo preferita',
    'stat.favJoker': 'Jolly preferito',
    // Collection
    'coll.title': 'COLLEZIONE',
    'coll.locked': 'BLOCCATO',
    'coll.seen': 'VISTO',
    'coll.all': 'TUTTI',
    'coll.filterSeen': 'VISTI',
    'coll.filterLocked': 'BLOCCATI',
    'coll.unlockedSuffix': 'sbloccati',
    // Toasts
    'toast.noDiscards': 'Niente più scarti!',
    'toast.notEnoughDucats': 'Non hai abbastanza ducati!',
    'toast.discardReward': '+{n} ducati per lo scarto',

    // Minigiochi
    'mg.close': 'CHIUDI',
    'mg.tabacchi.title': 'TABACCHI',
    'mg.tabacchi.sub': "Tieni premuto pe' fumare 'a sigaretta. +10💰",
    'mg.tabacchi.btn': 'TIENI PREMUTO',
    'mg.tabacchi.status0': 'Pacchetto pieno. Forza, accendila!',
    'mg.tabacchi.statusHold': "Sta fumando... non mollare!",
    'mg.tabacchi.statusStop': 'Continua a tenere premuto!',
    'mg.tabacchi.statusDone': 'PACCHETTO VUOTO. Buona giornata!',
    'mg.tabacchi.btnDone': 'PACCHETTO VUOTO',
    'mg.tabacchi.toast': '+10 ducati! Tira boccate gustose!',
    'mg.cassaforte.title': "CASSAFORTE D'ORO",
    'mg.cassaforte.sub': "Cinque colpi 'e piede 'e puorco e 'a spacchi! +100💰",
    'mg.cassaforte.btn': '🔨 SPACCA!',
    'mg.cassaforte.statusProgress': 'COLPI: {n} / 5',
    'mg.cassaforte.statusDone': '+100 DUCATI! 💰💰💰',
    'mg.cassaforte.btnDone': 'APERTA!',
    'mg.cassaforte.toast': '+100 ducati! Cassaforte spaccata!',
    'mg.pachinko.title': 'PACHINKO',
    'mg.pachinko.sub': "Clicca pe' aimmare 'a pallina. Costo: {cost}💰",
    'mg.pachinko.status0': 'Clicca sul tabellone per lanciare la pallina!',
    'mg.pachinko.statusFly': 'Vai pallina, vai!',
    'mg.pachinko.statusWin': 'HAI VINTO {n} DUCATI!',
    'mg.pachinko.toast': '+{n} ducati dal pachinko!',
    'mg.pachinko.toastNoMoney': 'Servono {cost} ducati per giocare al pachinko!',
    'mg.pachinko.toastError': 'Errore nel pagamento.',

    // Zodiac screen
    'zodiac.title': "SCEGLI O' SEGNO TUJO",
    'zodiac.subtitle': "'O destino tuo sta scritto 'ncielo",
    'zodiac.confirm': 'CONFERMA SEGNO',
    'zodiac.sign.ariete': 'Ariete',
    'zodiac.sign.toro': 'Toro',
    'zodiac.sign.gemelli': 'Gemelli',
    'zodiac.sign.cancro': 'Cancro',
    'zodiac.sign.leone': 'Leone',
    'zodiac.sign.vergine': 'Vergine',
    'zodiac.sign.bilancia': 'Bilancia',
    'zodiac.sign.scorpione': 'Scorpione',
    'zodiac.sign.sagittario': 'Sagittario',
    'zodiac.sign.capricorno': 'Capricorno',
    'zodiac.sign.acquario': 'Acquario',
    'zodiac.sign.pesci': 'Pesci',
    // Menu
    'menu.subtitle': "Tieni 'a mano? Allora vienitenne!",
    'menu.ducatsLabel': 'DUCATI',
    'menu.signLabel': 'SEGNO',
    // Game HUD / labels
    'game.jokers': 'JOLLY',
    'game.tarots': 'TAROCCHI',
    'game.cards': 'carte',
    'game.draws': 'PESCATE',
    'game.daily': '📅 DAILY',
    'game.endless': '∞ ENDLESS',
    // Shop
    'shop.mainTitle': "'O Negozio 'e Don Carmine",
    'shop.mainSubtitle': "Spendi sti ducati ca te bruciano 'ncopp' 'a sacca",
    'shop.ducatsLabel': 'DUCATI',
    'shop.sectionJokers': 'MAZZETTI & JOLLY',
    'shop.sectionTarots': 'TAROCCHI',
    'shop.sectionPacks': 'PACCHETTI',
    // Slot
    'slot.title': "SLOT D' 'O DESTINO",
    'slot.subtitle': "Vire si 'a fortuna te vasa",
    'slot.insertCoin': "INSERISCI 'NU DUCATO",
    'slot.creditsLabel': 'CREDITI',
    'slot.exit': 'ESCI',
    // Tombola
    'tombola.title': "TOMBOLA D' 'A NONNA",
    'tombola.subtitle': "Novanta numeri, 'na speranza",
    'tombola.lastExtracted': 'ULTIMI ESTRATTI',
    'tombola.exit': 'ESCI',
    // End screen
    'end.statsTitle': "STATISTICHE D' 'A RUN",
    'end.statScore': 'Punteggio finale',
    'end.statAnte': 'Ante raggiunto',
    'end.statHands': 'Mani giocate',
    'end.statSpent': 'Ducati spesi',
    'end.statJokers': 'Jolly comprati',
    'end.magoTitle': "'O MAGO TE DICE...",
    // Settings extras
    'settings.audioLabel': 'Audio',
    'settings.currentSign': 'Segno corrente',
    'settings.data': 'DATI',
    'settings.resetWarning': "Attenzione: cancellerà tutti i progressi, ducati, jolly e statistiche.",
    // Mini-games hub
    'mg.hub.title': 'SVAGO',
    'mg.hub.subtitle': "Quattro juochi 'e bisca pe' fa' passa' 'o tiempo",
    'mg.hub.back': '« INDIETRO',
    'mg.tabacchi.cardTitle': 'TABACCHI',
    'mg.tabacchi.cardDesc': 'Fumati tutto il pacchetto',
    'mg.tabacchi.cardReward': '+10 💰',
    'mg.cassaforte.cardTitle': "CASSAFORTE D'ORO",
    'mg.cassaforte.cardDesc': 'Spaccala col piede di porco',
    'mg.cassaforte.cardReward': '+100 💰',
    'mg.jackpot.cardTitle': 'JACKPOT',
    'mg.jackpot.cardDesc': 'Slot machine — tenta la fortuna',
    'mg.jackpot.cardReward': 'variabile',
    'mg.pachinko.cardTitle': 'PACHINKO',
    'mg.pachinko.cardDesc': 'Spara la pallina e fai punti',
    'mg.pachinko.cardReward': '5–50 💰',
    // Run mode popup
    'run.random': 'CASUALE',
    'run.daily': 'DAILY',
    // Abandon popup
    'abandon.confirm': 'Sei sicuro di voler abbandonare la run?',
    'abandon.yes': 'SÌ, ABBANDONA',
    'btn.cancel': 'ANNULLA',
    // Tutorial
    'tut.step0.title': 'BENVENUTO!',
    'tut.step0.text': 'Questo è il tavolo da gioco di Briscola Royale. Ti spiego tutto in 13 passi. Dai, è facile!',
    'tut.step1.title': "L'HUD",
    'tut.step1.text': "Qui vedi tutto: Ante (difficoltà), Round (Small/Big/Boss), il tuo Punteggio e l'Obiettivo da raggiungere, le Mani rimaste, gli Scarti e i tuoi Ducati.",
    'tut.step2.title': 'IL MAZZO',
    'tut.step2.text': 'Queste sono le carte che puoi ancora pescare. Il mazzo si rimescola da solo quando finisce!',
    'tut.step3.title': 'LA TUA MANO',
    'tut.step3.text': 'Queste sono le tue carte. Cliccale per selezionarle. Puoi selezionarne fino a 5 alla volta.',
    'tut.step4.title': 'LE COMBO',
    'tut.step4.text': 'Quando selezioni più carte, vedi subito che combo formi. Scegli le carte giuste per fare la combo più forte!',
    'tut.step5.title': 'CHIPS × MOLTIPLICATORE',
    'tut.step5.text': 'Qui vedi la preview: CHIPS × MULT. Il tuo punteggio finale sarà esattamente chips moltiplicato per mult. Più è grande, meglio è!',
    'tut.step6.title': 'IL SEME BRISCOLA',
    'tut.step6.text': 'Ogni round ha un seme briscola, indicato qui in HUD. Ogni carta di quel seme vale +5 chips extra. Tienilo sempre a mente!',
    'tut.step7.title': 'BOTTONE GIOCA',
    'tut.step7.text': 'Quando sei soddisfatto delle carte selezionate, premi GIOCA per segnare i punti. Scegli bene!',
    'tut.step8.title': 'BOTTONE SCARTA',
    'tut.step8.text': 'Se le carte non ti convincono, scartale e pescane di nuove. Ma attenzione: gli scarti sono limitati!',
    'tut.step9.title': 'LISTA COMBO',
    'tut.step9.text': 'Premi COMBO? per vedere tutte le combinazioni possibili con esempi. Tienila a mente per costruire la strategia giusta!',
    'tut.step10.title': 'I MAZZETTI (JOLLY)',
    'tut.step10.text': "I Mazzetti sono le tue carte speciali! Ogni mano li vedi attivarsi con bonus automatici. Comprane di nuovi nel negozio tra un round e l'altro.",
    'tut.step11.title': "L'OBIETTIVO",
    'tut.step11.text': 'Devi raggiungere il punteggio obiettivo entro le mani disponibili. Vinci il blind → vai al negozio → round successivo. Semplice, no?',
    'tut.step12.title': 'SEI PRONTO!',
    'tut.step12.text': 'Ora sai tutto quello che ti serve, guagliò! Buona fortuna — e ricorda: Gennarino ci crede in te!',
    'tut.prev': '◀ INDIETRO',
    'tut.next': 'AVANTI ▶',
    'tut.finish': 'INIZIA A GIOCARE!',
    'tut.skip': 'SALTA TUTORIAL',
  },

  // ============================================================
  // ENGLISH (i18n)
  // ============================================================
  en: {
    // Menu
    'menu.play': 'PLAY',
    'menu.howToPlay': 'HOW TO PLAY',
    'menu.shop': 'PREMIUM SHOP',
    'menu.minigames': 'MINI-GAMES',
    'menu.collection': 'COLLECTION',
    'menu.settings': '⚙ SETTINGS',
    // HUD
    'hud.ante': 'ANTE',
    'hud.round': 'ROUND',
    'hud.score': 'SCORE',
    'hud.target': 'TARGET',
    'hud.hands': 'HANDS',
    'hud.discards': 'DISCARDS',
    'hud.ducats': 'DUCATS',
    'hud.briscola': 'TRUMP',
    // Game buttons
    'btn.playHand': 'PLAY',
    'btn.discard': 'DISCARD',
    'btn.sortRank': 'SORT',
    'btn.sortSuit': 'SORT SUIT',
    'btn.combo': 'COMBOS?',
    'btn.infoRun': 'RUN INFO',
    'btn.abandon': 'QUIT',
    // Shop
    'shop.title': 'SHOP',
    'shop.reroll': 'REROLL',
    'shop.next': 'NEXT »',
    // End
    'end.victory': '🏆 YOU WIN!',
    'end.defeat': '💀 YOU LOSE',
    'end.retry': 'PLAY AGAIN',
    'end.menu': 'MENU',
    // Settings
    'settings.title': '⚙ SETTINGS',
    'settings.audio': 'AUDIO',
    'settings.bgmVol': 'MUSIC',
    'settings.sfxVol': 'SFX',
    'settings.mute': 'MUTE',
    'settings.unmute': 'SOUND',
    'settings.zodiac': 'ZODIAC SIGN',
    'settings.changeZodiac': 'CHANGE SIGN',
    'settings.stats': 'STATISTICS',
    'settings.reset': 'RESET SAVE',
    'settings.back': '« BACK',
    'settings.lang': 'LANGUAGE',
    // Stats
    'stat.played': 'Games played',
    'stat.wins': 'Victories',
    'stat.losses': 'Defeats',
    'stat.bosses': 'Bosses beaten',
    'stat.bestScore': 'Best score',
    'stat.ducats': 'Total ducats',
    'stat.favCombo': 'Fav. combo',
    'stat.favJoker': 'Fav. joker',
    // Collection
    'coll.title': 'COLLECTION',
    'coll.locked': 'LOCKED',
    'coll.seen': 'SEEN',
    'coll.all': 'ALL',
    'coll.filterSeen': 'SEEN',
    'coll.filterLocked': 'LOCKED',
    'coll.unlockedSuffix': 'unlocked',
    // Toasts
    'toast.noDiscards': 'No more discards!',
    'toast.notEnoughDucats': 'Not enough ducats!',
    'toast.discardReward': '+{n} ducats for discarding',

    // Mini-games
    'mg.close': 'CLOSE',
    'mg.tabacchi.title': 'TOBACCO SHOP',
    'mg.tabacchi.sub': "Hold down to smoke the cigarette. +10💰",
    'mg.tabacchi.btn': 'HOLD DOWN',
    'mg.tabacchi.status0': "Full pack. Come on, light it up!",
    'mg.tabacchi.statusHold': "Smoking... don't let go!",
    'mg.tabacchi.statusStop': 'Keep holding!',
    'mg.tabacchi.statusDone': 'PACK EMPTY. Enjoy your day!',
    'mg.tabacchi.btnDone': 'PACK EMPTY',
    'mg.tabacchi.toast': '+10 ducats! What a smoke!',
    'mg.cassaforte.title': 'GOLDEN SAFE',
    'mg.cassaforte.sub': "Five hits with the crowbar and it's yours! +100💰",
    'mg.cassaforte.btn': '🔨 CRACK IT!',
    'mg.cassaforte.statusProgress': 'HITS: {n} / 5',
    'mg.cassaforte.statusDone': '+100 DUCATS! 💰💰💰',
    'mg.cassaforte.btnDone': 'OPENED!',
    'mg.cassaforte.toast': '+100 ducats! Safe cracked open!',
    'mg.pachinko.title': 'PACHINKO',
    'mg.pachinko.sub': "Click to aim the ball. Cost: {cost}💰",
    'mg.pachinko.status0': 'Click the board to drop the ball!',
    'mg.pachinko.statusFly': 'Go ball, go!',
    'mg.pachinko.statusWin': 'YOU WON {n} DUCATS!',
    'mg.pachinko.toast': '+{n} ducats from pachinko!',
    'mg.pachinko.toastNoMoney': 'Need {cost} ducats to play pachinko!',
    'mg.pachinko.toastError': 'Payment error.',

    // Zodiac screen
    'zodiac.title': 'CHOOSE YOUR SIGN',
    'zodiac.subtitle': 'Your destiny is written in the stars',
    'zodiac.confirm': 'CONFIRM SIGN',
    'zodiac.sign.ariete': 'Aries',
    'zodiac.sign.toro': 'Taurus',
    'zodiac.sign.gemelli': 'Gemini',
    'zodiac.sign.cancro': 'Cancer',
    'zodiac.sign.leone': 'Leo',
    'zodiac.sign.vergine': 'Virgo',
    'zodiac.sign.bilancia': 'Libra',
    'zodiac.sign.scorpione': 'Scorpio',
    'zodiac.sign.sagittario': 'Sagittarius',
    'zodiac.sign.capricorno': 'Capricorn',
    'zodiac.sign.acquario': 'Aquarius',
    'zodiac.sign.pesci': 'Pisces',
    // Menu
    'menu.subtitle': 'Got a hand? Then come on in!',
    'menu.ducatsLabel': 'DUCATS',
    'menu.signLabel': 'SIGN',
    // Game HUD / labels
    'game.jokers': 'JOKERS',
    'game.tarots': 'TAROTS',
    'game.cards': 'cards',
    'game.draws': 'DRAWS',
    'game.daily': '📅 DAILY',
    'game.endless': '∞ ENDLESS',
    // Shop
    'shop.mainTitle': "Don Carmine's Shop",
    'shop.mainSubtitle': "Spend those ducats burning a hole in your pocket",
    'shop.ducatsLabel': 'DUCATS',
    'shop.sectionJokers': 'JOKERS & DECKS',
    'shop.sectionTarots': 'TAROTS',
    'shop.sectionPacks': 'PACKS',
    // Slot
    'slot.title': 'SLOT OF DESTINY',
    'slot.subtitle': 'See if Lady Luck kisses you',
    'slot.insertCoin': 'INSERT A DUCAT',
    'slot.creditsLabel': 'CREDITS',
    'slot.exit': 'EXIT',
    // Tombola
    'tombola.title': "GRANDMA'S TOMBOLA",
    'tombola.subtitle': 'Ninety numbers, one hope',
    'tombola.lastExtracted': 'LAST DRAWN',
    'tombola.exit': 'EXIT',
    // End screen
    'end.statsTitle': 'RUN STATISTICS',
    'end.statScore': 'Final score',
    'end.statAnte': 'Ante reached',
    'end.statHands': 'Hands played',
    'end.statSpent': 'Ducats spent',
    'end.statJokers': 'Jokers bought',
    'end.magoTitle': 'THE WIZARD SAYS...',
    // Settings extras
    'settings.audioLabel': 'Audio',
    'settings.currentSign': 'Current sign',
    'settings.data': 'DATA',
    'settings.resetWarning': 'Warning: this will erase all progress, ducats, jokers and statistics.',
    // Mini-games hub
    'mg.hub.title': 'RECREATION',
    'mg.hub.subtitle': 'Four gambling games to pass the time',
    'mg.hub.back': '« BACK',
    'mg.tabacchi.cardTitle': 'TOBACCO SHOP',
    'mg.tabacchi.cardDesc': 'Smoke the whole pack',
    'mg.tabacchi.cardReward': '+10 💰',
    'mg.cassaforte.cardTitle': 'GOLDEN SAFE',
    'mg.cassaforte.cardDesc': 'Crack it with the crowbar',
    'mg.cassaforte.cardReward': '+100 💰',
    'mg.jackpot.cardTitle': 'JACKPOT',
    'mg.jackpot.cardDesc': 'Slot machine — try your luck',
    'mg.jackpot.cardReward': 'variable',
    'mg.pachinko.cardTitle': 'PACHINKO',
    'mg.pachinko.cardDesc': 'Drop the ball and score',
    'mg.pachinko.cardReward': '5–50 💰',
    // Run mode popup
    'run.random': 'RANDOM',
    'run.daily': 'DAILY',
    // Abandon popup
    'abandon.confirm': 'Are you sure you want to quit the run?',
    'abandon.yes': 'YES, QUIT',
    'btn.cancel': 'CANCEL',
    // Tutorial
    'tut.step0.title': 'WELCOME!',
    'tut.step0.text': "This is the Briscola Royale game table. I'll walk you through it in 13 steps. Easy!",
    'tut.step1.title': 'THE HUD',
    'tut.step1.text': 'Here you see everything: Ante (difficulty), Round (Small/Big/Boss), your Score and the Target to reach, Hands remaining, Discards and your Ducats.',
    'tut.step2.title': 'THE DECK',
    'tut.step2.text': 'These are the cards you can still draw. The deck reshuffles automatically when empty!',
    'tut.step3.title': 'YOUR HAND',
    'tut.step3.text': 'These are your cards. Click them to select. You can select up to 5 at a time.',
    'tut.step4.title': 'COMBOS',
    'tut.step4.text': 'When you select multiple cards, you instantly see what combo they form. Pick the right cards for the strongest combo!',
    'tut.step5.title': 'CHIPS × MULTIPLIER',
    'tut.step5.text': 'Here you see the preview: CHIPS × MULT. Your final score is exactly chips times mult. Bigger is better!',
    'tut.step6.title': 'THE TRUMP SUIT',
    'tut.step6.text': 'Each round has a trump suit shown in the HUD. Every card of that suit adds +5 chips. Keep it in mind!',
    'tut.step7.title': 'PLAY BUTTON',
    'tut.step7.text': 'When you are happy with your selected cards, press PLAY to score the points. Choose wisely!',
    'tut.step8.title': 'DISCARD BUTTON',
    'tut.step8.text': "If the cards don't convince you, discard them and draw new ones. Watch out: discards are limited!",
    'tut.step9.title': 'COMBO LIST',
    'tut.step9.text': 'Press COMBOS? to see all possible combinations with examples. Keep it in mind to build the right strategy!',
    'tut.step10.title': 'JOKERS (DECKS)',
    'tut.step10.text': 'Jokers are your special cards! Each hand you see them activate with automatic bonuses. Buy new ones in the shop between rounds.',
    'tut.step11.title': 'THE TARGET',
    'tut.step11.text': 'You must reach the target score within the available hands. Win the blind → go to shop → next round. Simple, right?',
    'tut.step12.title': "YOU'RE READY!",
    'tut.step12.text': "Now you know everything you need! Good luck — and remember: Gennarino believes in you!",
    'tut.prev': '◀ BACK',
    'tut.next': 'NEXT ▶',
    'tut.finish': 'START PLAYING!',
    'tut.skip': 'SKIP TUTORIAL',
  },
};

// ============ PRNG DETERMINISTICO (Mulberry32) ============
// Usato per il Daily Seed: stesso seed → stessa sequenza di bosses, shop, joker offerts.
// 32-bit, no dipendenze esterne. Restituisce una funzione () => float in [0,1).
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
window.mulberry32 = mulberry32;

// ============ ESPOSIZIONE GLOBALE ============
window.BALANCE = BALANCE;
window.DECK_NAPOLI = DECK_NAPOLI;
window.BOSSES = BOSSES;
window.JOKERS = JOKERS;
window.MAZZETTI = MAZZETTI;
window.TAROTS = TAROTS;
window.SMORFIA = SMORFIA;
window.SLOT_SYMBOLS = SLOT_SYMBOLS;
window.PREDICTIONS = PREDICTIONS;
window.ZODIAC_BONUSES = ZODIAC_BONUSES;
window.STRINGS = STRINGS;
