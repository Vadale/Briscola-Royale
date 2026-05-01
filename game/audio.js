'use strict';
(function () {

  let _ctx = null;
  let _muted = false;
  let _musicVolume = 0.4;
  let _sfxVolume = 0.8;
  let _currentBgm = null;
  let _currentBgmId = null;

  function _getCtx() {
    try {
      if (!_ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        _ctx = new Ctor();
      }
      if (_ctx.state === 'suspended') {
        try { _ctx.resume(); } catch (e) {}
      }
      return _ctx;
    } catch (e) {
      return null;
    }
  }

  const _VALID_OSC_TYPES = { sine: 1, square: 1, sawtooth: 1, triangle: 1 };

  function beep(freq, dur, type, vol) {
    if (_muted || _sfxVolume <= 0) return;
    // isFinite guard per escludere Infinity/NaN che causerebbero RangeError su AudioParam
    if (!Number.isFinite(freq) || freq <= 0 || freq > 20000) return;
    if (!Number.isFinite(dur)  || dur  <= 0 || dur  > 5)    return;
    try {
      const ctx = _getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // whitelist tipo oscillatore: evita DOMException su valori non supportati
      osc.type = _VALID_OSC_TYPES[type] ? type : 'square';
      osc.frequency.value = freq;
      // cap a 0.5 come difesa in profondità contro volumi esagerati da save tamperato
      const v = Math.min(0.5, Math.max(0.0001, (vol || 0.1) * _sfxVolume));
      gain.gain.setValueAtTime(v, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur + 0.02);
    } catch (e) {}
  }

  function playMelody(notes) {
    if (_muted || !notes || !notes.length) return;
    let t = 0;
    notes.forEach(n => {
      const f = n.freq;
      const d = n.dur || 0.08;
      const ty = n.type || 'square';
      const vl = (n.vol != null) ? n.vol : 0.1;
      const delay = t * 1000;
      try {
        setTimeout(() => {
          if (_muted) return;
          if (f > 0) beep(f, d, ty, vl);
        }, delay);
      } catch (e) {}
      t += d;
    });
  }

  function playChord(freqs, dur) {
    if (_muted || !freqs || !freqs.length) return;
    freqs.forEach(f => beep(f, dur || 0.1, 'sine', 0.06));
  }

  function setMuted(muted) {
    _muted = !!muted;
    if (_muted && _currentBgm) {
      try { _currentBgm.stop(); } catch (e) {}
      _currentBgm = null;
    } else if (!_muted && _currentBgmId) {
      playBgm(_currentBgmId);
    }
  }

  function setMusicVolume(v) {
    _musicVolume = Math.max(0, Math.min(1, Number(v) || 0));
  }

  function setSfxVolume(v) {
    _sfxVolume = Math.max(0, Math.min(1, Number(v) || 0));
  }

  const N = {
    A3: 220, As3: 233.08, B3: 246.94,
    C3: 130.81, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196, Gs3: 207.65,
    A4: 440, As4: 466.16, B4: 493.88,
    C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13,
    E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392, Gs4: 415.30,
    A5: 880, As5: 932.33, B5: 987.77,
    C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25,
    E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 784, Gs5: 830.61,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760, C7: 2093,
    R: 0
  };

  class MusicTrack {
    constructor(bpm, layers) {
      this.bpm = bpm;
      this.layers = layers || [];
      this._playing = false;
      this._ids = [];
    }

    play() {
      if (this._playing) return;
      this._playing = true;
      this._tick();
    }

    _tick() {
      if (!this._playing) return;
      // Reset degli ID a inizio tick: i timer del ciclo precedente sono già scattati,
      // tenerli in array sarebbe solo memoria sprecata (leak lento su sessioni lunghe).
      this._ids = [];
      const beatMs = 60000 / this.bpm;
      let maxMs = 0;
      const self = this;

      this.layers.forEach(layer => {
        let ms = 0;
        const notes = layer.notes || [];
        const type = layer.type || 'square';
        const vol = (layer.vol != null) ? layer.vol : 0.07;
        notes.forEach(note => {
          const f = note.freq;
          const beats = note.beats || 1;
          if (f > 0) {
            const id = setTimeout(() => {
              if (!self._playing || _muted) return;
              try {
                const dur = (beats * beatMs / 1000) * 0.88;
                beep(f, dur, type, vol * _musicVolume);
              } catch (e) {}
            }, ms);
            this._ids.push(id);
          }
          ms += beats * beatMs;
        });
        if (ms > maxMs) maxMs = ms;
      });

      if (maxMs <= 0) maxMs = beatMs * 4;
      const loopId = setTimeout(() => self._tick(), maxMs);
      this._ids.push(loopId);
    }

    stop() {
      this._playing = false;
      this._ids.forEach(id => { try { clearTimeout(id); } catch (e) {} });
      this._ids = [];
    }
  }

  // ============ BGM TRACKS ============

  // bgm_menu — Re minore, Dm-Bb-F-C, neomelodica
  const _bgm_menu = new MusicTrack(96, [
    {
      type: 'sawtooth', vol: 0.07,
      notes: [
        // Bass: D-Bb-F-C ognuno per 4 beat (radici a metronomo: 4 note per misura)
        { freq: N.D3, beats: 1 }, { freq: N.D3, beats: 1 }, { freq: N.A3, beats: 1 }, { freq: N.D3, beats: 1 },
        { freq: N.As3, beats: 1 }, { freq: N.As3, beats: 1 }, { freq: N.F3, beats: 1 }, { freq: N.As3, beats: 1 },
        { freq: N.F3, beats: 1 }, { freq: N.F3, beats: 1 }, { freq: N.C4, beats: 1 }, { freq: N.F3, beats: 1 },
        { freq: N.C4, beats: 1 }, { freq: N.C4, beats: 1 }, { freq: N.G3, beats: 1 }, { freq: N.C4, beats: 1 },
      ]
    },
    {
      type: 'square', vol: 0.09,
      notes: [
        // Lead 4 bar: D F A | G F E D | F A C | B A G
        { freq: N.D4, beats: 1 }, { freq: N.F4, beats: 1 }, { freq: N.A4, beats: 2 },
        { freq: N.G4, beats: 1 }, { freq: N.F4, beats: 0.5 }, { freq: N.E4, beats: 0.5 }, { freq: N.D4, beats: 2 },
        { freq: N.F4, beats: 1 }, { freq: N.A4, beats: 1 }, { freq: N.C5, beats: 2 },
        { freq: N.B4, beats: 1 }, { freq: N.A4, beats: 1 }, { freq: N.G4, beats: 2 },
      ]
    }
  ]);

  // bgm_game_normal — tensione, Dm-Gm-Am-Dm
  const _bgm_game_normal = new MusicTrack(104, [
    {
      type: 'sawtooth', vol: 0.06,
      notes: [
        // Bass pulsante in ottavi (8 per misura)
        ...Array(8).fill({ freq: N.D3, beats: 0.5 }),
        ...Array(8).fill({ freq: N.G3, beats: 0.5 }),
        ...Array(8).fill({ freq: N.A3, beats: 0.5 }),
        ...Array(8).fill({ freq: N.D3, beats: 0.5 }),
      ]
    },
    {
      type: 'triangle', vol: 0.06,
      notes: [
        { freq: N.D4, beats: 2 }, { freq: N.F4, beats: 1 }, { freq: N.A4, beats: 1 },
        { freq: N.G4, beats: 2 }, { freq: N.As4, beats: 1 }, { freq: N.D5, beats: 1 },
        { freq: N.A4, beats: 2 }, { freq: N.C5, beats: 1 }, { freq: N.E5, beats: 1 },
        { freq: N.F4, beats: 1 }, { freq: N.E4, beats: 1 }, { freq: N.D4, beats: 2 },
      ]
    }
  ]);

  // bgm_game_boss — drammatica, Dm-Bb-Am-E (E armonico)
  const _bgm_game_boss = new MusicTrack(104, [
    {
      type: 'sawtooth', vol: 0.09,
      notes: [
        // Bass pesante: ogni quarto raddoppiato
        { freq: N.D3, beats: 1 }, { freq: N.D3, beats: 1 }, { freq: N.D3, beats: 1 }, { freq: N.A3, beats: 1 },
        { freq: N.As3, beats: 1 }, { freq: N.As3, beats: 1 }, { freq: N.As3, beats: 1 }, { freq: N.F3, beats: 1 },
        { freq: N.A3, beats: 1 }, { freq: N.A3, beats: 1 }, { freq: N.A3, beats: 1 }, { freq: N.E3, beats: 1 },
        { freq: N.E3, beats: 1 }, { freq: N.Gs3, beats: 1 }, { freq: N.B3, beats: 1 }, { freq: N.E4, beats: 1 },
      ]
    },
    {
      type: 'square', vol: 0.08,
      notes: [
        { freq: N.A4, beats: 2 }, { freq: N.F4, beats: 1 }, { freq: N.D4, beats: 1 },
        { freq: N.As4, beats: 2 }, { freq: N.D5, beats: 1 }, { freq: N.F5, beats: 1 },
        { freq: N.E5, beats: 2 }, { freq: N.C5, beats: 1 }, { freq: N.A4, beats: 1 },
        { freq: N.Gs4, beats: 1 }, { freq: N.B4, beats: 1 }, { freq: N.E5, beats: 2 },
      ]
    }
  ]);

  // bgm_shop — bar di paese, F-C-Dm-Bb
  const _bgm_shop = new MusicTrack(80, [
    {
      type: 'sine', vol: 0.07,
      notes: [
        { freq: N.F3, beats: 2 }, { freq: N.C4, beats: 2 },
        { freq: N.C3, beats: 2 }, { freq: N.G3, beats: 2 },
        { freq: N.D3, beats: 2 }, { freq: N.A3, beats: 2 },
        { freq: N.As3, beats: 2 }, { freq: N.F3, beats: 2 },
      ]
    },
    {
      type: 'sawtooth', vol: 0.05,
      notes: [
        { freq: N.A4, beats: 1 }, { freq: N.C5, beats: 1 }, { freq: N.F4, beats: 2 },
        { freq: N.G4, beats: 1 }, { freq: N.E4, beats: 1 }, { freq: N.C4, beats: 2 },
        { freq: N.F4, beats: 1 }, { freq: N.A4, beats: 1 }, { freq: N.D4, beats: 2 },
        { freq: N.D5, beats: 1 }, { freq: N.C5, beats: 1 }, { freq: N.As4, beats: 2 },
      ]
    }
  ]);

  // bgm_slot — casinò sagra, BPM 120, kick 80Hz su ogni beat
  const _bgm_slot = new MusicTrack(120, [
    {
      type: 'square', vol: 0.10,
      notes: [
        // Kick 4-on-floor: 16 beat, ognuno 80Hz breve
        ...Array(16).fill({ freq: 80, beats: 1 }),
      ]
    },
    {
      type: 'square', vol: 0.06,
      notes: [
        // Bell accents festosi
        { freq: N.C5, beats: 0.5 }, { freq: N.E5, beats: 0.5 }, { freq: N.G5, beats: 0.5 }, { freq: N.C6, beats: 0.5 },
        { freq: N.G5, beats: 0.5 }, { freq: N.E5, beats: 0.5 }, { freq: N.C5, beats: 0.5 }, { freq: N.E5, beats: 0.5 },
        { freq: N.F5, beats: 0.5 }, { freq: N.A5, beats: 0.5 }, { freq: N.C6, beats: 0.5 }, { freq: N.F6, beats: 0.5 },
        { freq: N.E5, beats: 0.5 }, { freq: N.G5, beats: 0.5 }, { freq: N.C5, beats: 1 },
      ]
    },
    {
      type: 'sawtooth', vol: 0.05,
      notes: [
        { freq: N.C3, beats: 4 },
        { freq: N.G3, beats: 4 },
        { freq: N.A3, beats: 4 },
        { freq: N.F3, beats: 4 },
      ]
    }
  ]);

  // bgm_victory — tarantella synth 6/8, BPM 130
  const _bgm_victory = new MusicTrack(130, [
    {
      type: 'sawtooth', vol: 0.08,
      notes: [
        // Bass tarantella: D-A-D pattern in eighth notes
        { freq: N.D3, beats: 0.5 }, { freq: N.A3, beats: 0.5 }, { freq: N.D4, beats: 0.5 },
        { freq: N.D3, beats: 0.5 }, { freq: N.A3, beats: 0.5 }, { freq: N.D4, beats: 0.5 },
        { freq: N.G3, beats: 0.5 }, { freq: N.D4, beats: 0.5 }, { freq: N.G4, beats: 0.5 },
        { freq: N.G3, beats: 0.5 }, { freq: N.D4, beats: 0.5 }, { freq: N.G4, beats: 0.5 },
        { freq: N.A3, beats: 0.5 }, { freq: N.E4, beats: 0.5 }, { freq: N.A4, beats: 0.5 },
        { freq: N.A3, beats: 0.5 }, { freq: N.Cs4, beats: 0.5 }, { freq: N.E4, beats: 0.5 },
        { freq: N.D3, beats: 0.5 }, { freq: N.A3, beats: 0.5 }, { freq: N.D4, beats: 0.5 },
        { freq: N.D3, beats: 0.5 }, { freq: N.A3, beats: 0.5 }, { freq: N.D4, beats: 0.5 },
      ]
    },
    {
      type: 'square', vol: 0.10,
      notes: [
        // Melodia tarantella allegra
        { freq: N.D5, beats: 0.5 }, { freq: N.E5, beats: 0.5 }, { freq: N.F5, beats: 0.5 },
        { freq: N.E5, beats: 0.5 }, { freq: N.D5, beats: 0.5 }, { freq: N.A4, beats: 0.5 },
        { freq: N.G4, beats: 0.5 }, { freq: N.A4, beats: 0.5 }, { freq: N.As4, beats: 0.5 },
        { freq: N.A4, beats: 0.5 }, { freq: N.G4, beats: 0.5 }, { freq: N.D4, beats: 0.5 },
        { freq: N.A4, beats: 0.5 }, { freq: N.Cs5, beats: 0.5 }, { freq: N.E5, beats: 0.5 },
        { freq: N.A5, beats: 0.5 }, { freq: N.E5, beats: 0.5 }, { freq: N.Cs5, beats: 0.5 },
        { freq: N.D5, beats: 0.5 }, { freq: N.F5, beats: 0.5 }, { freq: N.A5, beats: 0.5 },
        { freq: N.A5, beats: 1 }, { freq: N.D6, beats: 0.5 },
      ]
    }
  ]);

  const _BGM_TRACKS = {
    bgm_menu: _bgm_menu,
    bgm_game_normal: _bgm_game_normal,
    bgm_game_boss: _bgm_game_boss,
    bgm_shop: _bgm_shop,
    bgm_slot: _bgm_slot,
    bgm_victory: _bgm_victory,
  };

  function playBgm(trackId) {
    if (_muted) { _currentBgmId = trackId; return; }
    if (_currentBgm) {
      try { _currentBgm.stop(); } catch (e) {}
      _currentBgm = null;
    }
    const track = _BGM_TRACKS[trackId];
    if (!track) return;
    _currentBgm = track;
    _currentBgmId = trackId;
    try { track.play(); } catch (e) {}
  }

  function stopBgm() {
    if (_currentBgm) {
      try { _currentBgm.stop(); } catch (e) {}
      _currentBgm = null;
    }
    _currentBgmId = null;
  }

  // ============ SFX ============

  function sfxCardSelect()    { beep(600, 0.04, 'square', 0.12); }
  function sfxCardDeselect()  { beep(400, 0.04, 'square', 0.10); }

  function sfxCardDeal() {
    playMelody([
      { freq: 200, dur: 0.04, type: 'square', vol: 0.10 },
      { freq: 400, dur: 0.03, type: 'square', vol: 0.10 },
      { freq: 600, dur: 0.03, type: 'square', vol: 0.10 },
    ]);
  }

  function sfxCardPlay() {
    beep(200, 0.05, 'square', 0.18);
    setTimeout(() => beep(1000, 0.10, 'sine', 0.10), 30);
  }

  function sfxCardDiscard() {
    beep(300, 0.06, 'sawtooth', 0.12);
    setTimeout(() => beep(180, 0.05, 'sawtooth', 0.08), 30);
  }

  function sfxChipCount()    { beep(900, 0.025, 'sine', 0.12); }

  function sfxMultIncrease() {
    playMelody([
      { freq: 523, dur: 0.06, type: 'square', vol: 0.12 },
      { freq: 659, dur: 0.06, type: 'square', vol: 0.12 },
      { freq: 784, dur: 0.10, type: 'square', vol: 0.14 },
    ]);
  }

  function sfxScoreExplode() {
    playMelody([
      { freq: 523, dur: 0.06, type: 'square', vol: 0.12 },
      { freq: 659, dur: 0.06, type: 'square', vol: 0.12 },
      { freq: 784, dur: 0.06, type: 'square', vol: 0.13 },
      { freq: 1046, dur: 0.10, type: 'square', vol: 0.15 },
    ]);
    setTimeout(() => beep(80, 0.30, 'sawtooth', 0.20), 220);
  }

  function sfxCoinGet() {
    playMelody([
      { freq: 988, dur: 0.06, type: 'square', vol: 0.12 },
      { freq: 1319, dur: 0.10, type: 'square', vol: 0.14 },
    ]);
  }

  function sfxCoinLose() {
    playMelody([
      { freq: 800, dur: 0.08, type: 'triangle', vol: 0.12 },
      { freq: 600, dur: 0.12, type: 'triangle', vol: 0.12 },
    ]);
  }

  function sfxSlotLever()    { beep(100, 0.08, 'square', 0.20); }

  function sfxSlotReelSpin() {
    // wobble breve ripetuto
    for (let i = 0; i < 4; i++) {
      setTimeout(() => beep(380 + (i % 2) * 60, 0.05, 'triangle', 0.08), i * 40);
    }
  }

  function sfxSlotReelStop() { beep(80, 0.12, 'square', 0.25); }

  function sfxSlotWinSmall() {
    playMelody([
      { freq: 523, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 659, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 784, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 1046, dur: 0.10, type: 'square', vol: 0.15 },
    ]);
  }

  function sfxJackpot() {
    const fanfare = [523, 659, 784, 1046, 1319, 1568, 2093];
    let t = 0;
    fanfare.forEach((f, i) => {
      setTimeout(() => beep(f, 0.10, 'square', 0.14), t);
      t += 90 + i * 10;
    });
    // bell ringing 5×
    for (let i = 0; i < 5; i++) {
      setTimeout(() => beep(2093, 0.10, 'sine', 0.10), t + i * 150);
    }
  }

  function sfxTombolaExtract() {
    beep(200, 0.15, 'triangle', 0.15);
    setTimeout(() => beep(600, 0.06, 'square', 0.20), 150);
  }

  function sfxTombolaLine() {
    playMelody([
      { freq: 523, dur: 0.10, type: 'square', vol: 0.12 },
      { freq: 659, dur: 0.10, type: 'square', vol: 0.12 },
      { freq: 784, dur: 0.10, type: 'square', vol: 0.14 },
    ]);
  }

  function sfxTombolaFull() {
    playMelody([
      { freq: 523, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 659, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 784, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 1046, dur: 0.10, type: 'square', vol: 0.14 },
      { freq: 1319, dur: 0.10, type: 'square', vol: 0.14 },
      { freq: 1568, dur: 0.18, type: 'square', vol: 0.15 },
    ]);
  }

  function sfxBossAppear() {
    beep(80, 1.0, 'sawtooth', 0.20);
    setTimeout(() => beep(40, 0.5, 'square', 0.15), 500);
  }

  function sfxBossDefeat() {
    beep(100, 0.30, 'square', 0.30);
    setTimeout(() => playMelody([
      { freq: 784, dur: 0.10, type: 'square', vol: 0.14 },
      { freq: 659, dur: 0.10, type: 'square', vol: 0.14 },
      { freq: 523, dur: 0.10, type: 'square', vol: 0.14 },
      { freq: 392, dur: 0.20, type: 'square', vol: 0.16 },
    ]), 250);
  }

  function sfxBossWin() {
    beep(220, 0.50, 'sawtooth', 0.15);
    setTimeout(() => beep(185, 0.80, 'sawtooth', 0.10), 300);
  }

  function sfxGennarinoHappy() {
    playMelody([
      { freq: 880, dur: 0.05, type: 'square', vol: 0.12 },
      { freq: 1100, dur: 0.05, type: 'square', vol: 0.12 },
      { freq: 1320, dur: 0.08, type: 'square', vol: 0.14 },
    ]);
  }

  function sfxGennarinoSad() {
    playMelody([
      { freq: 500, dur: 0.15, type: 'triangle', vol: 0.12 },
      { freq: 380, dur: 0.20, type: 'triangle', vol: 0.12 },
      { freq: 250, dur: 0.30, type: 'triangle', vol: 0.12 },
    ]);
  }

  function sfxGennarinoMoney() {
    beep(1200, 0.06, 'square', 0.15);
    setTimeout(() => beep(1500, 0.10, 'sine', 0.12), 60);
    setTimeout(() => beep(800, 0.08, 'sine', 0.10), 180);
  }

  function sfxButtonClick() { beep(1000, 0.02, 'square', 0.10); }

  function sfxPurchase() {
    playChord([523, 659, 784], 0.12);
    setTimeout(() => beep(1046, 0.08, 'sine', 0.08), 80);
  }

  function sfxError()       { beep(150, 0.12, 'sawtooth', 0.15); }

  function sfxLevelUp() {
    playMelody([
      { freq: 523, dur: 0.08, type: 'square', vol: 0.13 },
      { freq: 659, dur: 0.08, type: 'square', vol: 0.13 },
      { freq: 784, dur: 0.08, type: 'square', vol: 0.13 },
      { freq: 1046, dur: 0.08, type: 'square', vol: 0.14 },
      { freq: 1319, dur: 0.08, type: 'square', vol: 0.16 },
    ]);
  }

  function sfxVictoryRun() {
    playMelody([
      { freq: 523, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 659, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 784, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 1046, dur: 0.10, type: 'square', vol: 0.14 },
      { freq: 784, dur: 0.10, type: 'square', vol: 0.13 },
      { freq: 1046, dur: 0.10, type: 'square', vol: 0.14 },
      { freq: 1319, dur: 0.10, type: 'square', vol: 0.15 },
      { freq: 1568, dur: 0.20, type: 'square', vol: 0.16 },
    ]);
    setTimeout(() => playChord([523, 784, 1046, 1319], 0.30), 900);
  }

  function sfxDefeatRun() {
    playMelody([
      { freq: 392, dur: 0.20, type: 'sine', vol: 0.12 },
      { freq: 350, dur: 0.20, type: 'sine', vol: 0.12 },
      { freq: 311, dur: 0.20, type: 'sine', vol: 0.12 },
      { freq: 261, dur: 0.40, type: 'sine', vol: 0.13 },
    ]);
  }

  function sfxPredictionAppear() {
    beep(800, 0.30, 'sine', 0.08);
    setTimeout(() => beep(1000, 0.20, 'sine', 0.06), 200);
  }

  // ============ INIT ============

  // Clampla a [0,1]; rifiuta NaN/Infinity da save tamperato (prevenire volume al massimo = danno audio)
  function _toClamped01(x, fallback) {
    const n = Number(x);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(1, n));
  }

  // Legge volume/mute da STATE se già esposto (potrebbe non esserlo: app.js carica dopo)
  (function _initFromState() {
    try {
      const s = window.STATE && window.STATE.settings;
      if (s) {
        _muted = !s.sound;
        _musicVolume = _toClamped01(s.musicVolume, 0.4);
        _sfxVolume   = _toClamped01(s.sfxVolume,   0.8);
      }
    } catch (e) {}
  })();

  // Prima interazione utente: risveglia AudioContext sospeso (policy autoplay browser).
  // Dopo resume, riavvia la BGM corrente così parte subito invece di aspettare
  // la fine del loop (che dura fino a 10s) prima di suonare.
  (function _registerFirstInteraction() {
    function _resume() {
      const needsRestart = !_ctx || (_ctx && _ctx.state === 'suspended');
      // Crea il context se non esiste ancora
      if (!_ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (Ctor) try { _ctx = new Ctor(); } catch (e) {}
      }
      const bgmIdToRestart = needsRestart ? _currentBgmId : null;
      const promise = (_ctx && _ctx.state === 'suspended')
        ? _ctx.resume()
        : Promise.resolve();
      promise.then(function() {
        if (bgmIdToRestart && !_muted) {
          if (_currentBgm) { try { _currentBgm.stop(); } catch (e) {} _currentBgm = null; }
          const track = _BGM_TRACKS[bgmIdToRestart];
          if (track) { _currentBgm = track; try { track.play(); } catch (e) {} }
        }
      }).catch(function() {});
      document.removeEventListener('pointerdown', _resume, true);
      document.removeEventListener('keydown', _resume, true);
    }
    try {
      document.addEventListener('pointerdown', _resume, true);
      document.addEventListener('keydown', _resume, true);
    } catch (e) {}
  })();

  // Tasto M gestito centralmente in app.js per evitare doppio toggle.

  // ============ EXPORT ============

  window.SN_Audio = {
    beep, playMelody, playChord,
    setMuted, setMusicVolume, setSfxVolume,
    playBgm, stopBgm,
    sfxCardSelect, sfxCardDeselect, sfxCardDeal, sfxCardPlay, sfxCardDiscard,
    sfxChipCount, sfxMultIncrease, sfxScoreExplode, sfxCoinGet, sfxCoinLose,
    sfxSlotLever, sfxSlotReelSpin, sfxSlotReelStop, sfxSlotWinSmall, sfxJackpot,
    sfxTombolaExtract, sfxTombolaLine, sfxTombolaFull,
    sfxBossAppear, sfxBossDefeat, sfxBossWin,
    sfxGennarinoHappy, sfxGennarinoSad, sfxGennarinoMoney,
    sfxButtonClick, sfxPurchase, sfxError,
    sfxLevelUp, sfxVictoryRun, sfxDefeatRun, sfxPredictionAppear,
  };

})();
