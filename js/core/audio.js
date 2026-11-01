// Web Audio API pure synthesizer - zero external dependencies, zero latency
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.musicTimer = null;
    this.currentTempo = 124;
    this.step = 0;
    this.intensity = 'normal'; // 'normal' | 'boss'
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Play a simple frequency sweep with envelope
  playTone(freqStart, freqEnd, duration, type = 'sine', volume = 0.2) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freqStart), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio fallback protection
    }
  }

  // Noise burst for punch impacts and snares
  playNoise(duration = 0.1, volume = 0.25, filterFreq = 1200) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
    } catch (e) {}
  }

  // Punch SFX
  playPunch() {
    this.playTone(180, 45, 0.12, 'square', 0.2);
    this.playNoise(0.08, 0.28, 900);
  }

  // Heavy Punch / Knockdown SFX
  playHeavyHit() {
    this.playTone(150, 30, 0.2, 'sawtooth', 0.35);
    this.playNoise(0.18, 0.45, 600);
  }

  // Kick SFX
  playKick() {
    this.playTone(260, 60, 0.14, 'triangle', 0.25);
    this.playNoise(0.09, 0.22, 1400);
  }

  // Jump SFX
  playJump() {
    this.playTone(120, 320, 0.15, 'sine', 0.15);
  }

  // Special Move SFX
  playSpecial() {
    this.playTone(80, 520, 0.35, 'sawtooth', 0.3);
    this.playTone(300, 150, 0.4, 'sine', 0.2);
    this.playNoise(0.3, 0.3, 2000);
  }

  // Emerson Seismic Ground Pound & Screen Tremor SFX
  playSeismicImpact() {
    if (this.isMuted) return;
    this.init();
    // Deep earthquake bass sub-thud
    this.playTone(90, 25, 0.65, 'sawtooth', 0.55);
    this.playTone(70, 20, 0.8, 'sine', 0.65);
    this.playNoise(0.55, 0.55, 350); // Low frequency rumble
    // Electric ground crackle
    setTimeout(() => {
      this.playTone(550, 100, 0.3, 'sawtooth', 0.3);
      this.playNoise(0.25, 0.4, 2800);
    }, 80);
  }

  // AndreyBot Aerial Summon & Laser SFX
  playBotSummon() {
    if (this.isMuted) return;
    this.init();
    // High-tech radio uplink chirps
    [520, 780, 1040, 1300].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, freq * 1.15, 0.08, 'sawtooth', 0.22);
      }, i * 55);
    });
  }

  playLaserDrop() {
    if (this.isMuted) return;
    this.init();
    this.playTone(980, 240, 0.12, 'sawtooth', 0.16);
  }

  playLaserHit() {
    if (this.isMuted) return;
    this.init();
    this.playTone(380, 90, 0.14, 'square', 0.22);
    this.playNoise(0.12, 0.25, 1400);
  }

  // Nata Electric Rock Guitar Solo Riff SFX
  playGuitarRiff() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Distortion waveshaper curve for overdriven rock guitar tone
      const makeDistortionCurve = (amount = 28) => {
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
          const x = (i * 2) / n_samples - 1;
          curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
      };

      const distortion = this.ctx.createWaveShaper();
      distortion.curve = makeDistortionCurve(30);
      distortion.oversample = '4x';

      // Cabinet Lowpass filter for smooth crunchy rock amplifier tone
      const cabinetFilter = this.ctx.createBiquadFilter();
      cabinetFilter.type = 'lowpass';
      cabinetFilter.frequency.setValueAtTime(2600, now);

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      distortion.connect(cabinetFilter);
      cabinetFilter.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      // Play rock guitar solo riff:
      // Heavy opening power chords -> fast ascending metal licks -> screaming high E note with vibrato
      const soloNotes = [
        { t: 0.00, dur: 0.28, freqs: [164.8, 246.9, 329.6] }, // E power chord
        { t: 0.28, dur: 0.22, freqs: [164.8, 246.9, 329.6] }, // E power chord
        { t: 0.52, dur: 0.35, freqs: [196.0, 293.7, 392.0] }, // G power chord
        { t: 0.88, dur: 0.38, freqs: [220.0, 329.6, 440.0] }, // A power chord
        { t: 1.28, dur: 0.14, freqs: [329.6, 493.9] },        // E4 lick
        { t: 1.42, dur: 0.14, freqs: [392.0, 587.3] },        // G4 lick
        { t: 1.56, dur: 0.14, freqs: [440.0, 659.3] },        // A4 lick
        { t: 1.70, dur: 0.16, freqs: [493.9, 739.9] },        // B4 lick
        { t: 1.86, dur: 0.20, freqs: [587.3, 880.0] },        // D5 lick
        { t: 2.06, dur: 1.05, freqs: [659.3, 987.8, 1318.5], vibrato: true } // Screaming high E5
      ];

      soloNotes.forEach((step) => {
        const noteStart = now + step.t;
        const noteDur = step.dur;

        step.freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();

          osc.type = idx === 0 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, noteStart);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.015, noteStart + noteDur * 0.4);

          if (step.vibrato) {
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.setValueAtTime(6.5, noteStart);
            lfoGain.gain.setValueAtTime(freq * 0.035, noteStart);
            lfo.connect(osc.frequency);
            lfo.start(noteStart);
            lfo.stop(noteStart + noteDur);
          }

          noteGain.gain.setValueAtTime(0.2 / step.freqs.length, noteStart);
          noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);

          osc.connect(noteGain);
          noteGain.connect(distortion);

          osc.start(noteStart);
          osc.stop(noteStart + noteDur);
        });
      });
    } catch (e) {
      // Audio fallback protection
    }
  }

  // Thunderous Lightning Strike SFX
  playLightningStrike() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.playTone(880, 50, 0.2, 'sawtooth', 0.28);
      this.playTone(120, 25, 0.45, 'sine', 0.4);
      this.playNoise(0.26, 0.35, 1900);
    } catch (e) {}
  }

  // Unicão Cosmic Howl & Planet Summoning SFX
  playCosmicSummon() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // 1. Deep space energy charge (low frequency ascending sweep)
      this.playTone(60, 480, 0.75, 'sawtooth', 0.35);
      this.playTone(80, 720, 0.9, 'sine', 0.4);

      // 2. Cosmic celestial harmonics arpeggio
      const celestialPitches = [340, 520, 680, 960, 1280];
      celestialPitches.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, freq * 1.1, 0.22, 'triangle', 0.25);
        }, 120 + idx * 80);
      });

      // 3. Resonant cosmic howl (vibrato power sweep)
      setTimeout(() => {
        this.playTone(420, 260, 0.65, 'sawtooth', 0.38);
        this.playNoise(0.5, 0.28, 900);
      }, 550);
    } catch (e) {}
  }

  // Planet Cataclysm Ground Impact Explosion SFX
  playMeteorCrash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Ground-shaking sub-bass thud
      this.playTone(95, 20, 0.6, 'sine', 0.55);
      // High-energy detonation burst
      this.playTone(280, 45, 0.35, 'sawtooth', 0.45);
      // Fiery explosion noise
      this.playNoise(0.45, 0.5, 800);
    } catch (e) {}
  }

  // Chicken Heal SFX (Magic arcade recovery arpeggio)
  playChickenHeal() {
    if (this.isMuted) return;
    this.init();
    const notes = [330, 440, 554, 659, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, freq * 1.05, 0.12, 'triangle', 0.2);
      }, i * 55);
    });
  }

  // Door Opening alert SFX
  playDoorOpen() {
    if (this.isMuted) return;
    this.init();
    const notes = [220, 293, 370, 440];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, freq * 1.2, 0.2, 'square', 0.18);
      }, i * 90);
    });
  }

  // Boss Warning Siren SFX
  playBossWarning() {
    if (this.isMuted) return;
    this.init();
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(480, 240, 0.3, 'sawtooth', 0.3);
      }, i * 350);
    }
  }

  // Victory Fanfare
  playVictory() {
    if (this.isMuted) return;
    this.init();
    const victoryNotes = [
      { f: 392, d: 0.12 },
      { f: 523, d: 0.12 },
      { f: 659, d: 0.12 },
      { f: 784, d: 0.35 }
    ];
    let time = 0;
    victoryNotes.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.f, note.f, note.d, 'triangle', 0.3);
      }, time * 1000);
      time += note.d + 0.05;
    });
  }

  // Game Over SFX
  playGameOver() {
    if (this.isMuted) return;
    this.init();
    const notes = [300, 270, 240, 200, 160];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, freq * 0.9, 0.25, 'sawtooth', 0.25);
      }, i * 160);
    });
  }

  // Dynamic BGM Sequencer
  startBgm(stageNumber = 1, isBoss = false) {
    this.intensity = isBoss ? 'boss' : 'normal';
    this.currentTempo = isBoss ? 138 : 122;

    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.step = 0;
    this.tickMusic();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  setBossIntensity(isBoss) {
    this.intensity = isBoss ? 'boss' : 'normal';
    this.currentTempo = isBoss ? 138 : 122;
  }

  tickMusic() {
    if (!this.bgmPlaying) return;
    if (!this.isMuted && this.ctx) {
      const beat = this.step % 16;

      // Bassline frequencies
      let bassFreq = 65; // C2
      if (this.intensity === 'boss') {
        const bossNotes = [55, 55, 65, 55, 73, 55, 82, 73];
        bassFreq = bossNotes[beat % 8];
      } else {
        const stageNotes = [65, 65, 77, 65, 87, 87, 77, 65];
        bassFreq = stageNotes[beat % 8];
      }

      // Kick drum on 0, 4, 8, 12
      if (beat % 4 === 0) {
        this.playTone(120, 35, 0.1, 'sine', 0.28);
      }

      // Snare on beat 4, 12
      if (beat === 4 || beat === 12) {
        this.playNoise(0.09, 0.22, 1600);
      }

      // Hi-hat on every off-beat
      if (beat % 2 === 1) {
        this.playNoise(0.03, 0.08, 4500);
      }

      // Bass synth
      if (beat % 2 === 0) {
        this.playTone(bassFreq, bassFreq * 0.98, 0.15, 'sawtooth', 0.14);
      }

      // Arp accent
      if (this.intensity === 'boss' && (beat === 2 || beat === 6 || beat === 10 || beat === 14)) {
        this.playTone(bassFreq * 4, bassFreq * 4, 0.08, 'triangle', 0.1);
      }
    }

    this.step++;
    const stepDuration = (60 / this.currentTempo / 4) * 1000;
    this.musicTimer = setTimeout(() => this.tickMusic(), stepDuration);
  }
}

export const Sound = new SoundSystem();
