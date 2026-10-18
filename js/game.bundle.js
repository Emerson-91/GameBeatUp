(() => {
  // js/core/camera.js
  var Camera = class {
    constructor(viewportWidth = 960, viewportHeight = 540) {
      this.x = 0;
      this.y = 0;
      this.width = viewportWidth;
      this.height = viewportHeight;
      this.minX = 0;
      this.maxX = 3200;
      this.isLocked = false;
      this.target = null;
      this.shakeIntensity = 0;
      this.shakeDuration = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
    setLimits(minX, maxX) {
      this.minX = minX;
      this.maxX = maxX - this.width;
      if (this.maxX < this.minX) this.maxX = this.minX;
    }
    follow(entity) {
      this.target = entity;
    }
    shake(intensity = 6, duration = 0.25) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
    }
    update(dt) {
      if (this.target) {
        const desiredX = this.target.x - this.width * 0.35;
        if (!this.isLocked) {
          if (desiredX > this.x) {
            this.x += (desiredX - this.x) * 0.12;
          }
        }
        if (this.x < this.minX) this.x = this.minX;
        if (this.x > this.maxX) this.x = this.maxX;
      }
      if (this.shakeDuration > 0) {
        this.shakeDuration -= dt;
        const decay = Math.max(0, this.shakeDuration / 0.25);
        this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
        this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
        if (this.shakeDuration <= 0) {
          this.shakeOffsetX = 0;
          this.shakeOffsetY = 0;
        }
      }
    }
    // Convert world coordinates to screen coordinates
    toScreenX(worldX) {
      return Math.floor(worldX - this.x + this.shakeOffsetX);
    }
    toScreenY(worldY) {
      return Math.floor(worldY + this.shakeOffsetY);
    }
  };

  // js/core/input.js
  var InputHandler = class {
    constructor() {
      this.keys = {
        up: false,
        down: false,
        left: false,
        right: false,
        punch: false,
        kick: false,
        jump: false,
        special: false,
        confirm: false,
        pause: false
      };
      this.justPressed = {
        up: false,
        down: false,
        left: false,
        right: false,
        punch: false,
        kick: false,
        jump: false,
        special: false,
        confirm: false,
        pause: false
      };
      this.setupKeyboard();
      this.setupTouchControls();
    }
    setupKeyboard() {
      window.addEventListener("keydown", (e) => {
        this.handleKey(e, true);
      });
      window.addEventListener("keyup", (e) => {
        this.handleKey(e, false);
      });
    }
    handleKey(e, isDown) {
      const code = e.code || "";
      const key = (e.key || "").toLowerCase();
      const preventKeys = [
        "keyw",
        "keys",
        "keya",
        "keyd",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "space"
      ];
      if (preventKeys.includes(code.toLowerCase()) || ["w", "s", "a", "d", " "].includes(key)) {
        if (e.target && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
          e.preventDefault();
        }
      }
      const setAction = (act, active) => {
        if (active) {
          if (!this.keys[act]) this.justPressed[act] = true;
          this.keys[act] = true;
        } else {
          this.keys[act] = false;
        }
      };
      if (code === "KeyW" || code === "ArrowUp" || key === "w" || key === "arrowup") {
        setAction("up", isDown);
      }
      if (code === "KeyS" || code === "ArrowDown" || key === "s" || key === "arrowdown") {
        setAction("down", isDown);
      }
      if (code === "KeyA" || code === "ArrowLeft" || key === "a" || key === "arrowleft") {
        setAction("left", isDown);
      }
      if (code === "KeyD" || code === "ArrowRight" || key === "d" || key === "arrowright") {
        setAction("right", isDown);
      }
      if (code === "KeyJ" || code === "KeyZ" || key === "j" || key === "z") {
        setAction("punch", isDown);
      }
      if (code === "KeyK" || code === "KeyX" || key === "k" || key === "x") {
        setAction("kick", isDown);
      }
      if (code === "Space" || key === " ") {
        setAction("jump", isDown);
      }
      if (code === "KeyL" || code === "KeyC" || key === "l" || key === "c") {
        setAction("special", isDown);
      }
      if (code === "Enter" || key === "enter") {
        setAction("confirm", isDown);
      }
      if (code === "KeyP" || code === "Escape" || key === "p" || key === "escape") {
        setAction("pause", isDown);
      }
    }
    setupTouchControls() {
      const bindAll = () => {
        const bindBtn = (id, keyName) => {
          const btn = document.getElementById(id);
          if (!btn) return;
          const start = (e) => {
            e.preventDefault();
            if (!this.keys[keyName]) this.justPressed[keyName] = true;
            this.keys[keyName] = true;
            btn.classList.add("active");
          };
          const end = (e) => {
            e.preventDefault();
            this.keys[keyName] = false;
            btn.classList.remove("active");
          };
          btn.addEventListener("touchstart", start, { passive: false });
          btn.addEventListener("touchend", end, { passive: false });
          btn.addEventListener("mousedown", start);
          btn.addEventListener("mouseup", end);
          btn.addEventListener("mouseleave", end);
        };
        bindBtn("btn-up", "up");
        bindBtn("btn-down", "down");
        bindBtn("btn-left", "left");
        bindBtn("btn-right", "right");
        bindBtn("btn-punch", "punch");
        bindBtn("btn-kick", "kick");
        bindBtn("btn-jump", "jump");
        bindBtn("btn-special", "special");
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindAll);
      } else {
        bindAll();
      }
    }
    // Clear single-frame presses at end of update
    clearJustPressed() {
      for (const k in this.justPressed) {
        this.justPressed[k] = false;
      }
    }
    // Helper check
    isActionPressed(action) {
      return this.justPressed[action];
    }
  };
  var Input = new InputHandler();

  // js/core/audio.js
  var SoundSystem = class {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.bgmPlaying = false;
      this.musicTimer = null;
      this.currentTempo = 124;
      this.step = 0;
      this.intensity = "normal";
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    toggleMute() {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }
    // Play a simple frequency sweep with envelope
    playTone(freqStart, freqEnd, duration, type = "sine", volume = 0.2) {
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
        gain.gain.exponentialRampToValueAtTime(1e-3, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
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
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(filterFreq, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + duration);
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        whiteNoise.start(now);
      } catch (e) {
      }
    }
    // Punch SFX
    playPunch() {
      this.playTone(180, 45, 0.12, "square", 0.2);
      this.playNoise(0.08, 0.28, 900);
    }
    // Heavy Punch / Knockdown SFX
    playHeavyHit() {
      this.playTone(150, 30, 0.2, "sawtooth", 0.35);
      this.playNoise(0.18, 0.45, 600);
    }
    // Kick SFX
    playKick() {
      this.playTone(260, 60, 0.14, "triangle", 0.25);
      this.playNoise(0.09, 0.22, 1400);
    }
    // Jump SFX
    playJump() {
      this.playTone(120, 320, 0.15, "sine", 0.15);
    }
    // Special Move SFX
    playSpecial() {
      this.playTone(80, 520, 0.35, "sawtooth", 0.3);
      this.playTone(300, 150, 0.4, "sine", 0.2);
      this.playNoise(0.3, 0.3, 2e3);
    }
    // Chicken Heal SFX (Magic arcade recovery arpeggio)
    playChickenHeal() {
      if (this.isMuted) return;
      this.init();
      const notes = [330, 440, 554, 659, 880];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, freq * 1.05, 0.12, "triangle", 0.2);
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
          this.playTone(freq, freq * 1.2, 0.2, "square", 0.18);
        }, i * 90);
      });
    }
    // Boss Warning Siren SFX
    playBossWarning() {
      if (this.isMuted) return;
      this.init();
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.playTone(480, 240, 0.3, "sawtooth", 0.3);
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
          this.playTone(note.f, note.f, note.d, "triangle", 0.3);
        }, time * 1e3);
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
          this.playTone(freq, freq * 0.9, 0.25, "sawtooth", 0.25);
        }, i * 160);
      });
    }
    // Dynamic BGM Sequencer
    startBgm(stageNumber = 1, isBoss = false) {
      this.intensity = isBoss ? "boss" : "normal";
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
      this.intensity = isBoss ? "boss" : "normal";
      this.currentTempo = isBoss ? 138 : 122;
    }
    tickMusic() {
      if (!this.bgmPlaying) return;
      if (!this.isMuted && this.ctx) {
        const beat = this.step % 16;
        let bassFreq = 65;
        if (this.intensity === "boss") {
          const bossNotes = [55, 55, 65, 55, 73, 55, 82, 73];
          bassFreq = bossNotes[beat % 8];
        } else {
          const stageNotes = [65, 65, 77, 65, 87, 87, 77, 65];
          bassFreq = stageNotes[beat % 8];
        }
        if (beat % 4 === 0) {
          this.playTone(120, 35, 0.1, "sine", 0.28);
        }
        if (beat === 4 || beat === 12) {
          this.playNoise(0.09, 0.22, 1600);
        }
        if (beat % 2 === 1) {
          this.playNoise(0.03, 0.08, 4500);
        }
        if (beat % 2 === 0) {
          this.playTone(bassFreq, bassFreq * 0.98, 0.15, "sawtooth", 0.14);
        }
        if (this.intensity === "boss" && (beat === 2 || beat === 6 || beat === 10 || beat === 14)) {
          this.playTone(bassFreq * 4, bassFreq * 4, 0.08, "triangle", 0.1);
        }
      }
      this.step++;
      const stepDuration = 60 / this.currentTempo / 4 * 1e3;
      this.musicTimer = setTimeout(() => this.tickMusic(), stepDuration);
    }
  };
  var Sound = new SoundSystem();

  // js/data/metaData.js
  var SPRITE_META = {
    "dog": {
      "idle": {
        "w": 160,
        "h": 300,
        "ax": 0.4487,
        "src": "assets/images/sprites/characters/dog_idle.png"
      },
      "idle2": {
        "w": 160,
        "h": 300,
        "ax": 0.4487,
        "src": "assets/images/sprites/characters/dog_idle2.png"
      },
      "punch": {
        "w": 231,
        "h": 300,
        "ax": 0.3457,
        "src": "assets/images/sprites/characters/dog_punch.png"
      },
      "kick": {
        "w": 344,
        "h": 300,
        "ax": 0.503,
        "src": "assets/images/sprites/characters/dog_kick.png"
      },
      "special": {
        "w": 693,
        "h": 365,
        "ax": 0.1512,
        "src": "assets/images/sprites/characters/dog_special.png"
      },
      "crouch": {
        "w": 161,
        "h": 231,
        "ax": 0.4089,
        "src": "assets/images/sprites/characters/dog_crouch.png"
      },
      "jump": {
        "w": 158,
        "h": 276,
        "ax": 0.4855,
        "src": "assets/images/sprites/characters/dog_jump.png"
      },
      "fall": {
        "w": 340,
        "h": 242,
        "ax": 0.5,
        "src": "assets/images/sprites/characters/dog_fall.png"
      },
      "fly": {
        "w": 158,
        "h": 276,
        "ax": 0.4855,
        "src": "assets/images/sprites/characters/dog_fly.png"
      },
      "walk1": {
        "w": 205,
        "h": 297,
        "ax": 0.4723,
        "src": "assets/images/sprites/characters/dog_walk1.png"
      },
      "walk2": {
        "w": 160,
        "h": 315,
        "ax": 0.4489,
        "src": "assets/images/sprites/characters/dog_walk2.png"
      },
      "back1": {
        "w": 202,
        "h": 302,
        "ax": 0.5205,
        "src": "assets/images/sprites/characters/dog_back1.png"
      },
      "back2": {
        "w": 155,
        "h": 310,
        "ax": 0.5429,
        "src": "assets/images/sprites/characters/dog_back2.png"
      },
      "knockdown": {
        "w": 340,
        "h": 242,
        "ax": 0.5,
        "src": "assets/images/sprites/characters/dog_knockdown.png"
      },
      "victory1": {
        "w": 155,
        "h": 316,
        "ax": 0.4713,
        "src": "assets/images/sprites/characters/dog_victory1.png"
      },
      "victory2": {
        "w": 146,
        "h": 300,
        "ax": 0.5399,
        "src": "assets/images/sprites/characters/dog_victory2.png"
      },
      "victory3": {
        "w": 146,
        "h": 335,
        "ax": 0.497,
        "src": "assets/images/sprites/characters/dog_victory3.png"
      },
      "victory4": {
        "w": 173,
        "h": 284,
        "ax": 0.4201,
        "src": "assets/images/sprites/characters/dog_victory4.png"
      },
      "victory5": {
        "w": 209,
        "h": 338,
        "ax": 0.4722,
        "src": "assets/images/sprites/characters/dog_victory5.png"
      },
      "victory": {
        "w": 209,
        "h": 338,
        "ax": 0.4722,
        "src": "assets/images/sprites/characters/dog_victory.png"
      },
      "punch1": {
        "w": 231,
        "h": 300,
        "ax": 0.3457,
        "src": "assets/images/sprites/characters/dog_punch.png"
      },
      "punch2": {
        "w": 344,
        "h": 300,
        "ax": 0.503,
        "src": "assets/images/sprites/characters/dog_kick.png"
      },
      "punch3": {
        "w": 693,
        "h": 365,
        "ax": 0.1512,
        "src": "assets/images/sprites/characters/dog_special.png"
      },
      "kick1": {
        "w": 344,
        "h": 300,
        "ax": 0.503,
        "src": "assets/images/sprites/characters/dog_kick.png"
      },
      "kick2": {
        "w": 158,
        "h": 276,
        "ax": 0.4855,
        "src": "assets/images/sprites/characters/dog_jump.png"
      },
      "kick3": {
        "w": 158,
        "h": 276,
        "ax": 0.4855,
        "src": "assets/images/sprites/characters/dog_fly.png"
      }
    },
    "emerson": {
      "idle": {
        "w": 176,
        "h": 300,
        "ax": 0.4554,
        "src": "assets/images/sprites/characters/emerson_idle.png"
      },
      "idle2": {
        "w": 176,
        "h": 300,
        "ax": 0.4554,
        "src": "assets/images/sprites/characters/emerson_idle2.png"
      },
      "punch": {
        "w": 253,
        "h": 300,
        "ax": 0.356,
        "src": "assets/images/sprites/characters/emerson_punch1.png"
      },
      "kick": {
        "w": 266,
        "h": 300,
        "ax": 0.331,
        "src": "assets/images/sprites/characters/emerson_kick1.png"
      },
      "special": {
        "w": 464,
        "h": 307,
        "ax": 0.1652,
        "src": "assets/images/sprites/characters/emerson_special.png"
      },
      "crouch": {
        "w": 169,
        "h": 209,
        "ax": 0.4211,
        "src": "assets/images/sprites/characters/emerson_crouch.png"
      },
      "jump": {
        "w": 174,
        "h": 276,
        "ax": 0.4529,
        "src": "assets/images/sprites/characters/emerson_jump.png"
      },
      "fall": {
        "w": 373,
        "h": 149,
        "ax": 0.5,
        "src": "assets/images/sprites/characters/emerson_fall.png"
      },
      "fly": {
        "w": 174,
        "h": 276,
        "ax": 0.4529,
        "src": "assets/images/sprites/characters/emerson_fly.png"
      },
      "walk1": {
        "w": 193,
        "h": 295,
        "ax": 0.5033,
        "src": "assets/images/sprites/characters/emerson_walk1.png"
      },
      "walk2": {
        "w": 176,
        "h": 307,
        "ax": 0.4553,
        "src": "assets/images/sprites/characters/emerson_walk2.png"
      },
      "back1": {
        "w": 189,
        "h": 298,
        "ax": 0.5568,
        "src": "assets/images/sprites/characters/emerson_back1.png"
      },
      "back2": {
        "w": 178,
        "h": 310,
        "ax": 0.5519,
        "src": "assets/images/sprites/characters/emerson_back2.png"
      },
      "knockdown": {
        "w": 325,
        "h": 297,
        "ax": 0.5,
        "src": "assets/images/sprites/characters/emerson_knockdown.png"
      },
      "victory1": {
        "w": 155,
        "h": 301,
        "ax": 0.4074,
        "src": "assets/images/sprites/characters/emerson_victory1.png"
      },
      "victory2": {
        "w": 185,
        "h": 295,
        "ax": 0.4867,
        "src": "assets/images/sprites/characters/emerson_victory2.png"
      },
      "victory3": {
        "w": 224,
        "h": 393,
        "ax": 0.5055,
        "src": "assets/images/sprites/characters/emerson_victory3.png"
      },
      "victory4": {
        "w": 233,
        "h": 487,
        "ax": 0.5123,
        "src": "assets/images/sprites/characters/emerson_victory4.png"
      },
      "punch1": {
        "w": 253,
        "h": 300,
        "ax": 0.356,
        "src": "assets/images/sprites/characters/emerson_punch1.png"
      },
      "punch2": {
        "w": 294,
        "h": 300,
        "ax": 0.388,
        "src": "assets/images/sprites/characters/emerson_punch2.png"
      },
      "punch3": {
        "w": 444,
        "h": 300,
        "ax": 0.347,
        "src": "assets/images/sprites/characters/emerson_punch3.png"
      },
      "kick1": {
        "w": 266,
        "h": 300,
        "ax": 0.331,
        "src": "assets/images/sprites/characters/emerson_kick1.png"
      },
      "kick2": {
        "w": 317,
        "h": 300,
        "ax": 0.319,
        "src": "assets/images/sprites/characters/emerson_kick2.png"
      },
      "kick3": {
        "w": 355,
        "h": 300,
        "ax": 0.251,
        "src": "assets/images/sprites/characters/emerson_kick3.png"
      }
    },
    "alligator": {
      "idle": {
        "w": 192,
        "h": 300,
        "ax": 0.4136,
        "src": "assets/images/sprites/boss1/alligator_idle.png"
      },
      "idle2": {
        "w": 192,
        "h": 300,
        "ax": 0.4136,
        "src": "assets/images/sprites/boss1/alligator_idle2.png"
      },
      "punch": {
        "w": 344,
        "h": 295,
        "ax": 0.3816,
        "src": "assets/images/sprites/boss1/alligator_punch.png"
      },
      "kick": {
        "w": 280,
        "h": 301,
        "ax": 0.2708,
        "src": "assets/images/sprites/boss1/alligator_kick.png"
      },
      "special": {
        "w": 522,
        "h": 250,
        "ax": 0.277,
        "src": "assets/images/sprites/boss1/alligator_special.png"
      },
      "crouch": {
        "w": 205,
        "h": 215,
        "ax": 0.438,
        "src": "assets/images/sprites/boss1/alligator_crouch.png"
      },
      "jump": {
        "w": 238,
        "h": 290,
        "ax": 0.4959,
        "src": "assets/images/sprites/boss1/alligator_jump.png"
      },
      "fall": {
        "w": 316,
        "h": 267,
        "ax": 0.4985,
        "src": "assets/images/sprites/boss1/alligator_fall.png"
      },
      "fly": {
        "w": 178,
        "h": 316,
        "ax": 0.4329,
        "src": "assets/images/sprites/boss1/alligator_fly.png"
      },
      "walk1": {
        "w": 234,
        "h": 288,
        "ax": 0.4634,
        "src": "assets/images/sprites/boss1/alligator_walk1.png"
      },
      "walk2": {
        "w": 180,
        "h": 316,
        "ax": 0.3746,
        "src": "assets/images/sprites/boss1/alligator_walk2.png"
      },
      "back1": {
        "w": 231,
        "h": 292,
        "ax": 0.51,
        "src": "assets/images/sprites/boss1/alligator_back1.png"
      },
      "back2": {
        "w": 181,
        "h": 317,
        "ax": 0.4851,
        "src": "assets/images/sprites/boss1/alligator_back2.png"
      },
      "knockdown": {
        "w": 357,
        "h": 107,
        "ax": 0.4986,
        "src": "assets/images/sprites/boss1/alligator_knockdown.png"
      },
      "victory": {
        "w": 363,
        "h": 392,
        "ax": 0.4786,
        "src": "assets/images/sprites/boss1/alligator_victory.png"
      }
    },
    "capybara": {
      "idle": {
        "w": 213,
        "h": 300,
        "ax": 0.4391,
        "src": "assets/images/sprites/boss3/capybara_idle.png"
      },
      "idle2": {
        "w": 213,
        "h": 300,
        "ax": 0.4391,
        "src": "assets/images/sprites/boss3/capybara_idle2.png"
      },
      "punch": {
        "w": 289,
        "h": 298,
        "ax": 0.3649,
        "src": "assets/images/sprites/boss3/capybara_punch.png"
      },
      "kick": {
        "w": 253,
        "h": 300,
        "ax": 0.2982,
        "src": "assets/images/sprites/boss3/capybara_kick.png"
      },
      "special": {
        "w": 363,
        "h": 278,
        "ax": 0.557,
        "src": "assets/images/sprites/boss3/capybara_special.png"
      },
      "crouch": {
        "w": 209,
        "h": 249,
        "ax": 0.4105,
        "src": "assets/images/sprites/boss3/capybara_crouch.png"
      },
      "jump": {
        "w": 178,
        "h": 331,
        "ax": 0.4288,
        "src": "assets/images/sprites/boss3/capybara_jump.png"
      },
      "fall": {
        "w": 258,
        "h": 212,
        "ax": 0.4982,
        "src": "assets/images/sprites/boss3/capybara_fall.png"
      },
      "fly": {
        "w": 178,
        "h": 331,
        "ax": 0.4288,
        "src": "assets/images/sprites/boss3/capybara_fly.png"
      },
      "walk1": {
        "w": 249,
        "h": 290,
        "ax": 0.492,
        "src": "assets/images/sprites/boss3/capybara_walk1.png"
      },
      "walk2": {
        "w": 185,
        "h": 318,
        "ax": 0.3541,
        "src": "assets/images/sprites/boss3/capybara_walk2.png"
      },
      "back1": {
        "w": 245,
        "h": 294,
        "ax": 0.537,
        "src": "assets/images/sprites/boss3/capybara_back1.png"
      },
      "back2": {
        "w": 186,
        "h": 316,
        "ax": 0.4547,
        "src": "assets/images/sprites/boss3/capybara_back2.png"
      },
      "knockdown": {
        "w": 318,
        "h": 168,
        "ax": 0.4986,
        "src": "assets/images/sprites/boss3/capybara_knockdown.png"
      },
      "special1": {
        "w": 303,
        "h": 242,
        "ax": 0.497,
        "src": "assets/images/sprites/boss3/capybara_special1.png"
      },
      "special2": {
        "w": 363,
        "h": 278,
        "ax": 0.557,
        "src": "assets/images/sprites/boss3/capybara_special2.png"
      },
      "victory1": {
        "w": 219,
        "h": 300,
        "ax": 0.4163,
        "src": "assets/images/sprites/boss3/capybara_victory1.png"
      },
      "victory2": {
        "w": 235,
        "h": 300,
        "ax": 0.4848,
        "src": "assets/images/sprites/boss3/capybara_victory2.png"
      },
      "victory3": {
        "w": 199,
        "h": 300,
        "ax": 0.5404,
        "src": "assets/images/sprites/boss3/capybara_victory3.png"
      },
      "victory4": {
        "w": 187,
        "h": 288,
        "ax": 0.5024,
        "src": "assets/images/sprites/boss3/capybara_victory4.png"
      },
      "victory5": {
        "w": 235,
        "h": 276,
        "ax": 0.5095,
        "src": "assets/images/sprites/boss3/capybara_victory5.png"
      }
    },
    "owl": {
      "idle": {
        "w": 183,
        "h": 300,
        "ax": 0.4373,
        "src": "assets/images/sprites/boss6/owl_idle.png"
      },
      "idle2": {
        "w": 183,
        "h": 300,
        "ax": 0.4373,
        "src": "assets/images/sprites/boss6/owl_idle2.png"
      },
      "punch": {
        "w": 252,
        "h": 300,
        "ax": 0.3708,
        "src": "assets/images/sprites/boss6/owl_punch.png"
      },
      "kick": {
        "w": 300,
        "h": 325,
        "ax": 0.4017,
        "src": "assets/images/sprites/boss6/owl_kick.png"
      },
      "special": {
        "w": 493,
        "h": 338,
        "ax": 0.4371,
        "src": "assets/images/sprites/boss6/owl_special.png"
      },
      "crouch": {
        "w": 186,
        "h": 244,
        "ax": 0.4477,
        "src": "assets/images/sprites/boss6/owl_crouch.png"
      },
      "jump": {
        "w": 197,
        "h": 322,
        "ax": 0.4936,
        "src": "assets/images/sprites/boss6/owl_jump.png"
      },
      "fall": {
        "w": 290,
        "h": 292,
        "ax": 0.4465,
        "src": "assets/images/sprites/boss6/owl_fall.png"
      },
      "fly": {
        "w": 197,
        "h": 322,
        "ax": 0.4936,
        "src": "assets/images/sprites/boss6/owl_fly.png"
      },
      "walk1": {
        "w": 225,
        "h": 293,
        "ax": 0.4797,
        "src": "assets/images/sprites/boss6/owl_walk1.png"
      },
      "walk2": {
        "w": 183,
        "h": 316,
        "ax": 0.4368,
        "src": "assets/images/sprites/boss6/owl_walk2.png"
      },
      "back1": {
        "w": 222,
        "h": 298,
        "ax": 0.5246,
        "src": "assets/images/sprites/boss6/owl_back1.png"
      },
      "back2": {
        "w": 191,
        "h": 313,
        "ax": 0.5364,
        "src": "assets/images/sprites/boss6/owl_back2.png"
      },
      "knockdown": {
        "w": 320,
        "h": 110,
        "ax": 0.5313,
        "src": "assets/images/sprites/boss6/owl_knockdown.png"
      },
      "super": {
        "w": 385,
        "h": 332,
        "ax": 0.2792,
        "src": "assets/images/sprites/boss6/owl_super.png"
      }
    },
    "tiger": {
      "idle": {
        "w": 215,
        "h": 300,
        "ax": 0.4663,
        "src": "assets/images/sprites/boss7/tiger_idle.png"
      },
      "idle2": {
        "w": 215,
        "h": 300,
        "ax": 0.4663,
        "src": "assets/images/sprites/boss7/tiger_idle2.png"
      },
      "punch": {
        "w": 319,
        "h": 289,
        "ax": 0.3315,
        "src": "assets/images/sprites/boss7/tiger_punch.png"
      },
      "kick": {
        "w": 274,
        "h": 300,
        "ax": 0.2735,
        "src": "assets/images/sprites/boss7/tiger_kick.png"
      },
      "special": {
        "w": 344,
        "h": 314,
        "ax": 0.3107,
        "src": "assets/images/sprites/boss7/tiger_special.png"
      },
      "crouch": {
        "w": 205,
        "h": 251,
        "ax": 0.4688,
        "src": "assets/images/sprites/boss7/tiger_crouch.png"
      },
      "jump": {
        "w": 193,
        "h": 268,
        "ax": 0.4617,
        "src": "assets/images/sprites/boss7/tiger_jump.png"
      },
      "fall": {
        "w": 255,
        "h": 225,
        "ax": 0.4989,
        "src": "assets/images/sprites/boss7/tiger_fall.png"
      },
      "fly": {
        "w": 193,
        "h": 268,
        "ax": 0.4617,
        "src": "assets/images/sprites/boss7/tiger_fly.png"
      },
      "walk1": {
        "w": 239,
        "h": 293,
        "ax": 0.4654,
        "src": "assets/images/sprites/boss7/tiger_walk1.png"
      },
      "walk2": {
        "w": 197,
        "h": 313,
        "ax": 0.4174,
        "src": "assets/images/sprites/boss7/tiger_walk2.png"
      },
      "back1": {
        "w": 236,
        "h": 299,
        "ax": 0.5129,
        "src": "assets/images/sprites/boss7/tiger_back1.png"
      },
      "back2": {
        "w": 194,
        "h": 314,
        "ax": 0.5053,
        "src": "assets/images/sprites/boss7/tiger_back2.png"
      },
      "knockdown": {
        "w": 386,
        "h": 120,
        "ax": 0.4992,
        "src": "assets/images/sprites/boss7/tiger_knockdown.png"
      },
      "victory1": {
        "w": 136,
        "h": 300,
        "ax": 0.6512,
        "src": "assets/images/sprites/boss7/tiger_victory1.png"
      },
      "victory2": {
        "w": 148,
        "h": 294,
        "ax": 0.5882,
        "src": "assets/images/sprites/boss7/tiger_victory2.png"
      },
      "victory3": {
        "w": 149,
        "h": 266,
        "ax": 0.5979,
        "src": "assets/images/sprites/boss7/tiger_victory3.png"
      },
      "victory4": {
        "w": 174,
        "h": 207,
        "ax": 0.5114,
        "src": "assets/images/sprites/boss7/tiger_victory4.png"
      },
      "victory5": {
        "w": 144,
        "h": 257,
        "ax": 0.6339,
        "src": "assets/images/sprites/boss7/tiger_victory5.png"
      },
      "victory": {
        "w": 144,
        "h": 257,
        "ax": 0.6339,
        "src": "assets/images/sprites/boss7/tiger_victory.png"
      }
    },
    "bear": {
      "idle": {
        "w": 210,
        "h": 300,
        "ax": 0.4069,
        "src": "assets/images/sprites/boss2/bear_idle.png"
      },
      "idle2": {
        "w": 210,
        "h": 300,
        "ax": 0.4069,
        "src": "assets/images/sprites/boss2/bear_idle2.png"
      },
      "punch": {
        "w": 291,
        "h": 297,
        "ax": 0.336,
        "src": "assets/images/sprites/boss2/bear_punch.png"
      },
      "kick": {
        "w": 317,
        "h": 348,
        "ax": 0.3095,
        "src": "assets/images/sprites/boss2/bear_kick.png"
      },
      "special": {
        "w": 336,
        "h": 300,
        "ax": 0.3249,
        "src": "assets/images/sprites/boss2/bear_special.png"
      },
      "crouch": {
        "w": 193,
        "h": 236,
        "ax": 0.4096,
        "src": "assets/images/sprites/boss2/bear_crouch.png"
      },
      "jump": {
        "w": 254,
        "h": 329,
        "ax": 0.496,
        "src": "assets/images/sprites/boss2/bear_jump.png"
      },
      "fall": {
        "w": 254,
        "h": 329,
        "ax": 0.496,
        "src": "assets/images/sprites/boss2/bear_fall.png"
      },
      "fly": {
        "w": 195,
        "h": 296,
        "ax": 0.4465,
        "src": "assets/images/sprites/boss2/bear_fly.png"
      },
      "walk1": {
        "w": 236,
        "h": 294,
        "ax": 0.4725,
        "src": "assets/images/sprites/boss2/bear_walk1.png"
      },
      "walk2": {
        "w": 196,
        "h": 313,
        "ax": 0.3648,
        "src": "assets/images/sprites/boss2/bear_walk2.png"
      },
      "back1": {
        "w": 230,
        "h": 300,
        "ax": 0.5244,
        "src": "assets/images/sprites/boss2/bear_back1.png"
      },
      "back2": {
        "w": 197,
        "h": 314,
        "ax": 0.465,
        "src": "assets/images/sprites/boss2/bear_back2.png"
      },
      "knockdown": {
        "w": 320,
        "h": 155,
        "ax": 0.4969,
        "src": "assets/images/sprites/boss2/bear_knockdown.png"
      },
      "super": {
        "w": 550,
        "h": 354,
        "ax": 0.2161,
        "src": "assets/images/sprites/boss2/bear_super.png"
      },
      "victory1": {
        "w": 296,
        "h": 300,
        "ax": 0.4985,
        "src": "assets/images/sprites/boss2/bear_victory1.png"
      },
      "victory2": {
        "w": 287,
        "h": 296,
        "ax": 0.3774,
        "src": "assets/images/sprites/boss2/bear_victory2.png"
      },
      "victory3": {
        "w": 262,
        "h": 294,
        "ax": 0.4091,
        "src": "assets/images/sprites/boss2/bear_victory3.png"
      },
      "victory4": {
        "w": 393,
        "h": 315,
        "ax": 0.4651,
        "src": "assets/images/sprites/boss2/bear_victory4.png"
      },
      "victory5": {
        "w": 344,
        "h": 333,
        "ax": 0.4814,
        "src": "assets/images/sprites/boss2/bear_victory5.png"
      }
    },
    "gorilla": {
      "idle": {
        "w": 207,
        "h": 300,
        "ax": 0.4415,
        "src": "assets/images/sprites/boss5/gorilla_idle.png"
      },
      "idle2": {
        "w": 207,
        "h": 300,
        "ax": 0.4415,
        "src": "assets/images/sprites/boss5/gorilla_idle2.png"
      },
      "punch": {
        "w": 307,
        "h": 290,
        "ax": 0.3171,
        "src": "assets/images/sprites/boss5/gorilla_punch.png"
      },
      "kick": {
        "w": 382,
        "h": 358,
        "ax": 0.3063,
        "src": "assets/images/sprites/boss5/gorilla_kick.png"
      },
      "special": {
        "w": 496,
        "h": 356,
        "ax": 0.2419,
        "src": "assets/images/sprites/boss5/gorilla_special.png"
      },
      "crouch": {
        "w": 196,
        "h": 234,
        "ax": 0.4411,
        "src": "assets/images/sprites/boss5/gorilla_crouch.png"
      },
      "jump": {
        "w": 196,
        "h": 275,
        "ax": 0.491,
        "src": "assets/images/sprites/boss5/gorilla_jump.png"
      },
      "fall": {
        "w": 397,
        "h": 331,
        "ax": 0.451,
        "src": "assets/images/sprites/boss5/gorilla_fall.png"
      },
      "fly": {
        "w": 196,
        "h": 275,
        "ax": 0.491,
        "src": "assets/images/sprites/boss5/gorilla_fly.png"
      },
      "walk1": {
        "w": 249,
        "h": 293,
        "ax": 0.4797,
        "src": "assets/images/sprites/boss5/gorilla_walk1.png"
      },
      "walk2": {
        "w": 189,
        "h": 316,
        "ax": 0.3887,
        "src": "assets/images/sprites/boss5/gorilla_walk2.png"
      },
      "back1": {
        "w": 245,
        "h": 298,
        "ax": 0.5238,
        "src": "assets/images/sprites/boss5/gorilla_back1.png"
      },
      "back2": {
        "w": 191,
        "h": 315,
        "ax": 0.4782,
        "src": "assets/images/sprites/boss5/gorilla_back2.png"
      },
      "knockdown": {
        "w": 441,
        "h": 186,
        "ax": 0.4612,
        "src": "assets/images/sprites/boss5/gorilla_knockdown.png"
      },
      "victory1": {
        "w": 280,
        "h": 337,
        "ax": 0.4893,
        "src": "assets/images/sprites/boss5/gorilla_victory1.png"
      },
      "victory2": {
        "w": 261,
        "h": 339,
        "ax": 0.4425,
        "src": "assets/images/sprites/boss5/gorilla_victory2.png"
      },
      "victory3": {
        "w": 299,
        "h": 356,
        "ax": 0.4783,
        "src": "assets/images/sprites/boss5/gorilla_victory3.png"
      },
      "victory4": {
        "w": 273,
        "h": 359,
        "ax": 0.5073,
        "src": "assets/images/sprites/boss5/gorilla_victory4.png"
      },
      "victory5": {
        "w": 302,
        "h": 357,
        "ax": 0.548,
        "src": "assets/images/sprites/boss5/gorilla_victory5.png"
      },
      "victory": {
        "w": 302,
        "h": 357,
        "ax": 0.548,
        "src": "assets/images/sprites/boss5/gorilla_victory.png"
      }
    },
    "wolf": {
      "idle": {
        "w": 206,
        "h": 300,
        "ax": 0.4597,
        "src": "assets/images/sprites/boss8/wolf_idle.png"
      },
      "idle2": {
        "w": 206,
        "h": 300,
        "ax": 0.4597,
        "src": "assets/images/sprites/boss8/wolf_idle2.png"
      },
      "punch": {
        "w": 283,
        "h": 300,
        "ax": 0.3348,
        "src": "assets/images/sprites/boss8/wolf_punch.png"
      },
      "kick": {
        "w": 279,
        "h": 319,
        "ax": 0.3201,
        "src": "assets/images/sprites/boss8/wolf_kick.png"
      },
      "special": {
        "w": 308,
        "h": 325,
        "ax": 0.2995,
        "src": "assets/images/sprites/boss8/wolf_special.png"
      },
      "crouch": {
        "w": 193,
        "h": 238,
        "ax": 0.4451,
        "src": "assets/images/sprites/boss8/wolf_crouch.png"
      },
      "jump": {
        "w": 172,
        "h": 331,
        "ax": 0.4561,
        "src": "assets/images/sprites/boss8/wolf_jump.png"
      },
      "fall": {
        "w": 253,
        "h": 222,
        "ax": 0.5,
        "src": "assets/images/sprites/boss8/wolf_fall.png"
      },
      "fly": {
        "w": 172,
        "h": 331,
        "ax": 0.4561,
        "src": "assets/images/sprites/boss8/wolf_fly.png"
      },
      "walk1": {
        "w": 235,
        "h": 295,
        "ax": 0.4366,
        "src": "assets/images/sprites/boss8/wolf_walk1.png"
      },
      "walk2": {
        "w": 206,
        "h": 315,
        "ax": 0.4593,
        "src": "assets/images/sprites/boss8/wolf_walk2.png"
      },
      "back1": {
        "w": 232,
        "h": 302,
        "ax": 0.4805,
        "src": "assets/images/sprites/boss8/wolf_back1.png"
      },
      "back2": {
        "w": 198,
        "h": 309,
        "ax": 0.5327,
        "src": "assets/images/sprites/boss8/wolf_back2.png"
      },
      "knockdown": {
        "w": 336,
        "h": 111,
        "ax": 0.5,
        "src": "assets/images/sprites/boss8/wolf_knockdown.png"
      },
      "victory1": {
        "w": 211,
        "h": 300,
        "ax": 0.5264,
        "src": "assets/images/sprites/boss8/wolf_victory1.png"
      },
      "victory2": {
        "w": 197,
        "h": 296,
        "ax": 0.5283,
        "src": "assets/images/sprites/boss8/wolf_victory2.png"
      },
      "victory3": {
        "w": 261,
        "h": 297,
        "ax": 0.5,
        "src": "assets/images/sprites/boss8/wolf_victory3.png"
      },
      "victory4": {
        "w": 219,
        "h": 321,
        "ax": 0.5353,
        "src": "assets/images/sprites/boss8/wolf_victory4.png"
      },
      "victory5": {
        "w": 260,
        "h": 321,
        "ax": 0.5017,
        "src": "assets/images/sprites/boss8/wolf_victory5.png"
      },
      "victory": {
        "w": 260,
        "h": 321,
        "ax": 0.5017,
        "src": "assets/images/sprites/boss8/wolf_victory.png"
      }
    },
    "cat": {
      "idle": {
        "w": 207,
        "h": 300,
        "ax": 0.5039,
        "src": "assets/images/sprites/boss4/cat_idle.png"
      },
      "idle2": {
        "w": 207,
        "h": 300,
        "ax": 0.5039,
        "src": "assets/images/sprites/boss4/cat_idle2.png"
      },
      "punch": {
        "w": 330,
        "h": 298,
        "ax": 0.4213,
        "src": "assets/images/sprites/boss4/cat_punch.png"
      },
      "kick": {
        "w": 299,
        "h": 310,
        "ax": 0.4537,
        "src": "assets/images/sprites/boss4/cat_kick.png"
      },
      "special": {
        "w": 423,
        "h": 287,
        "ax": 0.2806,
        "src": "assets/images/sprites/boss4/cat_special.png"
      },
      "crouch": {
        "w": 209,
        "h": 236,
        "ax": 0.4834,
        "src": "assets/images/sprites/boss4/cat_crouch.png"
      },
      "jump": {
        "w": 191,
        "h": 295,
        "ax": 0.504,
        "src": "assets/images/sprites/boss4/cat_jump.png"
      },
      "fall": {
        "w": 304,
        "h": 295,
        "ax": 0.5,
        "src": "assets/images/sprites/boss4/cat_fall.png"
      },
      "fly": {
        "w": 191,
        "h": 295,
        "ax": 0.504,
        "src": "assets/images/sprites/boss4/cat_fly.png"
      },
      "walk1": {
        "w": 265,
        "h": 291,
        "ax": 0.5029,
        "src": "assets/images/sprites/boss4/cat_walk1.png"
      },
      "walk2": {
        "w": 205,
        "h": 320,
        "ax": 0.4988,
        "src": "assets/images/sprites/boss4/cat_walk2.png"
      },
      "back1": {
        "w": 261,
        "h": 299,
        "ax": 0.5458,
        "src": "assets/images/sprites/boss4/cat_back1.png"
      },
      "back2": {
        "w": 209,
        "h": 317,
        "ax": 0.605,
        "src": "assets/images/sprites/boss4/cat_back2.png"
      },
      "knockdown": {
        "w": 323,
        "h": 227,
        "ax": 0.5,
        "src": "assets/images/sprites/boss4/cat_knockdown.png"
      },
      "super": {
        "w": 412,
        "h": 329,
        "ax": 0.2701,
        "src": "assets/images/sprites/boss4/cat_super.png"
      },
      "victory1": {
        "w": 241,
        "h": 296,
        "ax": 0.5111,
        "src": "assets/images/sprites/boss4/cat_victory1.png"
      },
      "victory2": {
        "w": 284,
        "h": 258,
        "ax": 0.52,
        "src": "assets/images/sprites/boss4/cat_victory2.png"
      },
      "victory3": {
        "w": 263,
        "h": 258,
        "ax": 0.53,
        "src": "assets/images/sprites/boss4/cat_victory3.png"
      },
      "victory4": {
        "w": 345,
        "h": 255,
        "ax": 0.48,
        "src": "assets/images/sprites/boss4/cat_victory4.png"
      },
      "victory5": {
        "w": 290,
        "h": 258,
        "ax": 0.58,
        "src": "assets/images/sprites/boss4/cat_victory5.png"
      }
    },
    "dragon": {
      "idle": {
        "w": 219,
        "h": 300,
        "ax": 0.438,
        "src": "assets/images/sprites/FinalBoss/dragon_idle.png"
      },
      "idle2": {
        "w": 219,
        "h": 300,
        "ax": 0.438,
        "src": "assets/images/sprites/FinalBoss/dragon_idle2.png"
      },
      "punch": {
        "w": 269,
        "h": 299,
        "ax": 0.357,
        "src": "assets/images/sprites/FinalBoss/dragon_punch.png"
      },
      "kick": {
        "w": 295,
        "h": 331,
        "ax": 0.42,
        "src": "assets/images/sprites/FinalBoss/dragon_kick.png"
      },
      "special": {
        "w": 449,
        "h": 345,
        "ax": 0.28,
        "src": "assets/images/sprites/FinalBoss/dragon_special.png"
      },
      "crouch": {
        "w": 210,
        "h": 243,
        "ax": 0.4483,
        "src": "assets/images/sprites/FinalBoss/dragon_crouch.png"
      },
      "jump": {
        "w": 209,
        "h": 303,
        "ax": 0.4746,
        "src": "assets/images/sprites/FinalBoss/dragon_jump.png"
      },
      "fall": {
        "w": 445,
        "h": 255,
        "ax": 0.52,
        "src": "assets/images/sprites/FinalBoss/dragon_fall.png"
      },
      "fly": {
        "w": 342,
        "h": 372,
        "ax": 0.62,
        "src": "assets/images/sprites/FinalBoss/dragon_fly.png"
      },
      "walk1": {
        "w": 234,
        "h": 297,
        "ax": 0.4614,
        "src": "assets/images/sprites/FinalBoss/dragon_walk1.png"
      },
      "walk2": {
        "w": 217,
        "h": 310,
        "ax": 0.4331,
        "src": "assets/images/sprites/FinalBoss/dragon_walk2.png"
      },
      "back1": {
        "w": 232,
        "h": 303,
        "ax": 0.5082,
        "src": "assets/images/sprites/FinalBoss/dragon_back1.png"
      },
      "back2": {
        "w": 218,
        "h": 310,
        "ax": 0.5087,
        "src": "assets/images/sprites/FinalBoss/dragon_back2.png"
      },
      "knockdown": {
        "w": 445,
        "h": 255,
        "ax": 0.52,
        "src": "assets/images/sprites/FinalBoss/dragon_knockdown.png"
      },
      "fly2": {
        "w": 310,
        "h": 285,
        "ax": 0.54,
        "src": "assets/images/sprites/FinalBoss/dragon_fly2.png"
      }
    },
    "nata": {
      "idle": {
        "w": 174,
        "h": 300,
        "ax": 0.4731,
        "src": "assets/images/sprites/characters/nata_idle.png"
      },
      "idle2": {
        "w": 174,
        "h": 300,
        "ax": 0.4731,
        "src": "assets/images/sprites/characters/nata_idle2.png"
      },
      "punch": {
        "w": 282,
        "h": 289,
        "ax": 0.3385,
        "src": "assets/images/sprites/characters/nata_punch.png"
      },
      "kick": {
        "w": 274,
        "h": 270,
        "ax": 0.3749,
        "src": "assets/images/sprites/characters/nata_kick.png"
      },
      "special": {
        "w": 503,
        "h": 395,
        "ax": 0.315,
        "src": "assets/images/sprites/characters/nata_special.png"
      },
      "crouch": {
        "w": 137,
        "h": 205,
        "ax": 0.4132,
        "src": "assets/images/sprites/characters/nata_crouch.png"
      },
      "jump": {
        "w": 187,
        "h": 295,
        "ax": 0.498,
        "src": "assets/images/sprites/characters/nata_jump.png"
      },
      "fall": {
        "w": 391,
        "h": 153,
        "ax": 0.5,
        "src": "assets/images/sprites/characters/nata_fall.png"
      },
      "fly": {
        "w": 242,
        "h": 334,
        "ax": 0.4864,
        "src": "assets/images/sprites/characters/nata_fly.png"
      },
      "walk1": {
        "w": 249,
        "h": 266,
        "ax": 0.474,
        "src": "assets/images/sprites/characters/nata_walk1.png"
      },
      "walk2": {
        "w": 142,
        "h": 298,
        "ax": 0.4801,
        "src": "assets/images/sprites/characters/nata_walk2.png"
      },
      "back1": {
        "w": 141,
        "h": 298,
        "ax": 0.5803,
        "src": "assets/images/sprites/characters/nata_back1.png"
      },
      "back2": {
        "w": 239,
        "h": 279,
        "ax": 0.5122,
        "src": "assets/images/sprites/characters/nata_back2.png"
      },
      "knockdown": {
        "w": 209,
        "h": 281,
        "ax": 0.5383,
        "src": "assets/images/sprites/characters/nata_knockdown.png"
      },
      "victory1": {
        "w": 275,
        "h": 300,
        "ax": 0.4624,
        "src": "assets/images/sprites/characters/nata_victory1.png"
      },
      "victory2": {
        "w": 251,
        "h": 300,
        "ax": 0.3889,
        "src": "assets/images/sprites/characters/nata_victory2.png"
      },
      "victory3": {
        "w": 251,
        "h": 300,
        "ax": 0.4018,
        "src": "assets/images/sprites/characters/nata_victory3.png"
      },
      "victory4": {
        "w": 328,
        "h": 333,
        "ax": 0.3863,
        "src": "assets/images/sprites/characters/nata_victory4.png"
      },
      "victory5": {
        "w": 288,
        "h": 333,
        "ax": 0.4299,
        "src": "assets/images/sprites/characters/nata_victory5.png"
      },
      "punch1": {
        "w": 282,
        "h": 289,
        "ax": 0.3385,
        "src": "assets/images/sprites/characters/nata_punch.png"
      },
      "punch2": {
        "w": 274,
        "h": 270,
        "ax": 0.3749,
        "src": "assets/images/sprites/characters/nata_kick.png"
      },
      "punch3": {
        "w": 503,
        "h": 395,
        "ax": 0.315,
        "src": "assets/images/sprites/characters/nata_special.png"
      },
      "kick1": {
        "w": 274,
        "h": 270,
        "ax": 0.3749,
        "src": "assets/images/sprites/characters/nata_kick.png"
      },
      "kick2": {
        "w": 187,
        "h": 295,
        "ax": 0.498,
        "src": "assets/images/sprites/characters/nata_jump.png"
      },
      "kick3": {
        "w": 242,
        "h": 334,
        "ax": 0.4864,
        "src": "assets/images/sprites/characters/nata_fly.png"
      }
    },
    "andrey": {
      "idle": {
        "w": 245,
        "h": 320,
        "ax": 0.4309,
        "src": "assets/images/sprites/characters/andrey_idle.png"
      },
      "idle2": {
        "w": 245,
        "h": 320,
        "ax": 0.4309,
        "src": "assets/images/sprites/characters/andrey_idle2.png"
      },
      "punch": {
        "w": 316,
        "h": 299,
        "ax": 0.38,
        "src": "assets/images/sprites/characters/andrey_punch.png"
      },
      "kick": {
        "w": 295,
        "h": 350,
        "ax": 0.36,
        "src": "assets/images/sprites/characters/andrey_kick.png"
      },
      "special": {
        "w": 316,
        "h": 299,
        "ax": 0.38,
        "src": "assets/images/sprites/characters/andrey_special.png"
      },
      "crouch": {
        "w": 228,
        "h": 264,
        "ax": 0.49,
        "src": "assets/images/sprites/characters/andrey_crouch.png"
      },
      "jump": {
        "w": 285,
        "h": 380,
        "ax": 0.48,
        "src": "assets/images/sprites/characters/andrey_jump.png"
      },
      "fall": {
        "w": 343,
        "h": 160,
        "ax": 0.5,
        "src": "assets/images/sprites/characters/andrey_fall.png"
      },
      "fly": {
        "w": 285,
        "h": 380,
        "ax": 0.48,
        "src": "assets/images/sprites/characters/andrey_fly.png"
      },
      "walk1": {
        "w": 248,
        "h": 316,
        "ax": 0.4709,
        "src": "assets/images/sprites/characters/andrey_walk1.png"
      },
      "walk2": {
        "w": 213,
        "h": 320,
        "ax": 0.4845,
        "src": "assets/images/sprites/characters/andrey_walk2.png"
      },
      "back1": {
        "w": 213,
        "h": 320,
        "ax": 0.4845,
        "src": "assets/images/sprites/characters/andrey_back1.png"
      },
      "back2": {
        "w": 248,
        "h": 316,
        "ax": 0.4709,
        "src": "assets/images/sprites/characters/andrey_back2.png"
      },
      "knockdown": {
        "w": 343,
        "h": 160,
        "ax": 0.5,
        "src": "assets/images/sprites/characters/andrey_knockdown.png"
      },
      "victory1": {
        "w": 293,
        "h": 327,
        "ax": 0.5,
        "src": "assets/images/sprites/characters/andrey_victory1.png"
      },
      "victory2": {
        "w": 236,
        "h": 324,
        "ax": 0.5725,
        "src": "assets/images/sprites/characters/andrey_victory2.png"
      },
      "victory3": {
        "w": 243,
        "h": 327,
        "ax": 0.5018,
        "src": "assets/images/sprites/characters/andrey_victory3.png"
      },
      "victory4": {
        "w": 242,
        "h": 319,
        "ax": 0.4366,
        "src": "assets/images/sprites/characters/andrey_victory4.png"
      },
      "victory5": {
        "w": 252,
        "h": 319,
        "ax": 0.4809,
        "src": "assets/images/sprites/characters/andrey_victory5.png"
      },
      "punch1": {
        "w": 316,
        "h": 299,
        "ax": 0.38,
        "src": "assets/images/sprites/characters/andrey_punch.png"
      },
      "punch2": {
        "w": 316,
        "h": 299,
        "ax": 0.38,
        "src": "assets/images/sprites/characters/andrey_special.png"
      },
      "punch3": {
        "w": 316,
        "h": 299,
        "ax": 0.38,
        "src": "assets/images/sprites/characters/andrey_special.png"
      },
      "kick1": {
        "w": 295,
        "h": 350,
        "ax": 0.36,
        "src": "assets/images/sprites/characters/andrey_kick.png"
      },
      "kick2": {
        "w": 285,
        "h": 380,
        "ax": 0.48,
        "src": "assets/images/sprites/characters/andrey_jump.png"
      },
      "kick3": {
        "w": 285,
        "h": 380,
        "ax": 0.48,
        "src": "assets/images/sprites/characters/andrey_fly.png"
      }
    },
    "enemy_swamp": {
      "idle": {
        "w": 250,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_idle.png"
      },
      "walk1": {
        "w": 215,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_walk1.png"
      },
      "punch": {
        "w": 230,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_punch.png"
      },
      "kick": {
        "w": 337,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_kick.png"
      },
      "fall": {
        "w": 208,
        "h": 170,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_fall.png"
      },
      "walk2": {
        "w": 215,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_walk1.png"
      },
      "knockdown": {
        "w": 208,
        "h": 170,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_fall.png"
      },
      "idle2": {
        "w": 250,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_idle.png"
      },
      "crouch": {
        "w": 250,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_swamp_idle.png"
      }
    },
    "enemy_spear": {
      "idle": {
        "w": 283,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_idle.png"
      },
      "walk1": {
        "w": 295,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_walk1.png"
      },
      "crouch": {
        "w": 293,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_crouch.png"
      },
      "punch": {
        "w": 440,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_punch.png"
      },
      "fall": {
        "w": 194,
        "h": 170,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_fall.png"
      },
      "walk2": {
        "w": 295,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_walk1.png"
      },
      "knockdown": {
        "w": 194,
        "h": 170,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_fall.png"
      },
      "idle2": {
        "w": 283,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_idle.png"
      },
      "kick": {
        "w": 440,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_spear_punch.png"
      }
    },
    "enemy_fish": {
      "idle": {
        "w": 234,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_idle.png"
      },
      "walk1": {
        "w": 246,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_walk1.png"
      },
      "crouch": {
        "w": 250,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_crouch.png"
      },
      "punch": {
        "w": 304,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_punch.png"
      },
      "fall": {
        "w": 205,
        "h": 170,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_fall.png"
      },
      "walk2": {
        "w": 246,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_walk1.png"
      },
      "knockdown": {
        "w": 205,
        "h": 170,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_fall.png"
      },
      "idle2": {
        "w": 234,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_idle.png"
      },
      "kick": {
        "w": 304,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage1/enemy_fish_punch.png"
      }
    },
    "enemy_goblin": {
      "idle": {
        "w": 221,
        "h": 240,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_idle.png"
      },
      "walk1": {
        "w": 217,
        "h": 240,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_walk1.png"
      },
      "punch": {
        "w": 195,
        "h": 240,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_punch.png"
      },
      "kick": {
        "w": 313,
        "h": 240,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_kick.png"
      },
      "fall": {
        "w": 181,
        "h": 150,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_fall.png"
      },
      "walk2": {
        "w": 217,
        "h": 240,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_walk1.png"
      },
      "knockdown": {
        "w": 181,
        "h": 150,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_fall.png"
      },
      "idle2": {
        "w": 221,
        "h": 240,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_idle.png"
      },
      "crouch": {
        "w": 221,
        "h": 240,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_goblin_idle.png"
      }
    },
    "enemy_elf": {
      "idle": {
        "w": 206,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_idle.png"
      },
      "walk1": {
        "w": 285,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_walk1.png"
      },
      "crouch": {
        "w": 195,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_crouch.png"
      },
      "punch": {
        "w": 290,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_punch.png"
      },
      "fall": {
        "w": 145,
        "h": 170,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_fall.png"
      },
      "walk2": {
        "w": 285,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_walk1.png"
      },
      "knockdown": {
        "w": 145,
        "h": 170,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_fall.png"
      },
      "idle2": {
        "w": 206,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_idle.png"
      },
      "kick": {
        "w": 290,
        "h": 270,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_elf_punch.png"
      }
    },
    "enemy_walrus": {
      "idle": {
        "w": 291,
        "h": 290,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_idle.png"
      },
      "walk1": {
        "w": 271,
        "h": 290,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_walk1.png"
      },
      "crouch": {
        "w": 260,
        "h": 290,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_crouch.png"
      },
      "punch": {
        "w": 340,
        "h": 290,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_punch.png"
      },
      "fall": {
        "w": 232,
        "h": 180,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_fall.png"
      },
      "walk2": {
        "w": 271,
        "h": 290,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_walk1.png"
      },
      "knockdown": {
        "w": 232,
        "h": 180,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_fall.png"
      },
      "idle2": {
        "w": 291,
        "h": 290,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_idle.png"
      },
      "kick": {
        "w": 340,
        "h": 290,
        "ax": 0.5,
        "src": "assets/images/sprites/enemies/stage2/enemy_walrus_punch.png"
      }
    }
  };
  var EXTRA_SPRITES = {
    "owl_tornado": {
      "src": "assets/images/sprites/boss6/tornado.png",
      "w": 271,
      "h": 331,
      "ax": 0.5
    },
    "meteor_1": {
      "src": "assets/images/sprites/FinalBoss/meteor_1.png",
      "w": 198,
      "h": 255,
      "ax": 0.5
    },
    "meteor_2": {
      "src": "assets/images/sprites/FinalBoss/meteor_2.png",
      "w": 315,
      "h": 385,
      "ax": 0.5
    },
    "meteor_3": {
      "src": "assets/images/sprites/FinalBoss/meteor_3.png",
      "w": 355,
      "h": 410,
      "ax": 0.5
    },
    "meteor_4": {
      "src": "assets/images/sprites/FinalBoss/meteor_4.png",
      "w": 334,
      "h": 410,
      "ax": 0.5
    },
    "chicken": {
      "src": "assets/images/sprites/chicken.png",
      "w": 128,
      "h": 128,
      "ax": 0.5
    }
  };

  // js/data/charactersData.js
  var PLAYABLE_CHARACTERS = {
    andrey: {
      id: "andrey",
      name: "ANDREY",
      title: "G\xEAnio da Tecnologia",
      portrait: "assets/images/portrait_andrey.jpg",
      spriteId: "andrey",
      maxHp: 110,
      speed: 4.4,
      stats: {
        power: 82,
        speed: 85,
        defense: 80,
        special: 98
      },
      damage: {
        punch: 20,
        kick: 24,
        jumpKick: 28,
        special: 56
      },
      specialCooldown: 6.5,
      specialDuration: 0.85,
      specialName: "PULSO DE PLASMA & DRONE BOT",
      description: "Especialista em alta tecnologia com exoesqueleto de combate e disparos de plasma devastadores."
    },
    emerson: {
      id: "emerson",
      name: "EMERSON",
      title: "Tit\xE3 da Super For\xE7a",
      portrait: "assets/images/portrait_emerson.jpg",
      spriteId: "emerson",
      maxHp: 135,
      speed: 4,
      stats: {
        power: 100,
        speed: 70,
        defense: 95,
        special: 88
      },
      damage: {
        punch: 26,
        kick: 30,
        jumpKick: 34,
        special: 60
      },
      specialCooldown: 7.5,
      specialDuration: 0.85,
      specialName: "IMPACTO S\xCDSMICO DEMOLIDOR",
      description: "Possui super for\xE7a colossal e resist\xEAncia tit\xE2nica. Seus golpes esmagam tudo pela frente."
    },
    nata: {
      id: "nata",
      name: "NATA",
      title: "Dan\xE7arina Flamejante",
      portrait: "assets/images/portrait_nata.jpg",
      spriteId: "nata",
      maxHp: 95,
      speed: 5.3,
      stats: {
        power: 70,
        speed: 98,
        defense: 65,
        special: 88
      },
      damage: {
        punch: 16,
        kick: 24,
        jumpKick: 28,
        special: 45
      },
      specialCooldown: 6,
      specialDuration: 0.9,
      specialName: "FURAC\xC3O DE CHUTES",
      description: "Velocidade supers\xF4nica, chutes a\xE9reos acrob\xE1ticos e esquiva fant\xE1stica."
    },
    unicao: {
      id: "unicao",
      name: "UNIC\xC3O",
      title: "Lenda Canina",
      portrait: "assets/images/portrait_dog.jpg",
      spriteId: "dog",
      maxHp: 115,
      speed: 4.9,
      stats: {
        power: 85,
        speed: 88,
        defense: 75,
        special: 92
      },
      damage: {
        punch: 19,
        kick: 23,
        jumpKick: 27,
        special: 52
      },
      specialCooldown: 7,
      specialDuration: 0.9,
      specialName: "INVESTIDA DAS QUATRO PATAS",
      description: "Guerreiro canino lend\xE1rio com mordidas r\xE1pidas e arrancada fulminante."
    }
  };
  var BOSS_CONFIGS = {
    1: {
      stage: 1,
      id: "alligator",
      name: "KING GATOR",
      title: "O Flagelo dos Esgotos",
      spriteId: "alligator",
      maxHp: 320,
      speed: 2.8,
      attackPower: 16,
      specialCooldown: 7,
      scale: 1.05,
      specialName: "MORDIDA DA MORTE",
      arenaTheme: "sewer"
    },
    2: {
      stage: 2,
      id: "bear",
      name: "URSUS MAGNUS",
      title: "O Guardi\xE3o da Floresta",
      spriteId: "bear",
      maxHp: 380,
      speed: 2.7,
      attackPower: 19,
      specialCooldown: 8,
      scale: 1.1,
      specialName: "PATADA S\xCDSMICA",
      arenaTheme: "forest"
    },
    3: {
      stage: 3,
      id: "capybara",
      name: "CAPY SENSEI",
      title: "O Monge da Lagoa",
      spriteId: "capybara",
      maxHp: 440,
      speed: 3,
      attackPower: 20,
      specialCooldown: 7,
      scale: 1.05,
      specialName: "TSUNAMI ZEN",
      arenaTheme: "lagoon"
    },
    4: {
      stage: 4,
      id: "cat",
      name: "SHADOW CLAW",
      title: "A Ninja das Sombras",
      spriteId: "cat",
      maxHp: 500,
      speed: 4.2,
      attackPower: 22,
      specialCooldown: 6,
      scale: 1,
      specialName: "CORTE FANTASMA",
      arenaTheme: "rooftop"
    },
    5: {
      stage: 5,
      id: "gorilla",
      name: "TITAN KONG",
      title: "O Esmagador Urbano",
      spriteId: "gorilla",
      maxHp: 580,
      speed: 3,
      attackPower: 25,
      specialCooldown: 8,
      scale: 1.15,
      specialName: "MARTELO S\xCDSMICO",
      arenaTheme: "factory"
    },
    6: {
      stage: 6,
      id: "owl",
      name: "ZEPHYR OWL",
      title: "O Lorde dos Ventos",
      spriteId: "owl",
      maxHp: 650,
      speed: 3.6,
      attackPower: 24,
      specialCooldown: 6.5,
      scale: 1.05,
      hasTornado: true,
      specialName: "FURAC\xC3O DEVASTADOR",
      arenaTheme: "clocktower"
    },
    7: {
      stage: 7,
      id: "tiger",
      name: "RAIDEN TIGER",
      title: "A Fera do Trov\xE3o",
      spriteId: "tiger",
      maxHp: 740,
      speed: 4,
      attackPower: 27,
      specialCooldown: 6,
      scale: 1.1,
      specialName: "BOTE REL\xC2MPAGO",
      arenaTheme: "highway"
    },
    8: {
      stage: 8,
      id: "wolf",
      name: "FENRIR LUPUS",
      title: "O Alfa da Nevasca",
      spriteId: "wolf",
      maxHp: 840,
      speed: 4.1,
      attackPower: 29,
      specialCooldown: 5.5,
      scale: 1.08,
      specialName: "UIVO DO ABISMO",
      arenaTheme: "docks"
    },
    9: {
      stage: 9,
      id: "dragon",
      name: "BAHAMUT DRAGON",
      title: "O Imperador do Apocalipse",
      spriteId: "dragon",
      maxHp: 1100,
      speed: 3.8,
      attackPower: 35,
      specialCooldown: 5,
      scale: 1.25,
      hasMeteors: true,
      specialName: "CHUVA DE METEOROS C\xD3SMICOS",
      arenaTheme: "volcano"
    }
  };

  // js/core/imageLoader.js
  var ImageLoader = class {
    constructor() {
      this.cache = /* @__PURE__ */ new Map();
      this.totalToLoad = 0;
      this.loadedCount = 0;
    }
    // Preload essential portraits and Stage 1 sprites with guaranteed safety timeout
    async preloadCore(onProgress) {
      const essentialUrls = /* @__PURE__ */ new Set();
      for (const k in PLAYABLE_CHARACTERS) {
        essentialUrls.add(PLAYABLE_CHARACTERS[k].portrait);
      }
      essentialUrls.add("assets/images/sprites/chicken.png");
      essentialUrls.add("assets/images/backgrounds/stage1_alligator.jpg");
      const heroKeys = ["andrey", "emerson", "nata", "dog"];
      for (const hero of heroKeys) {
        if (SPRITE_META[hero]) {
          ["idle", "walk1", "punch", "kick"].forEach((a) => {
            if (SPRITE_META[hero][a]) {
              essentialUrls.add(SPRITE_META[hero][a].src);
            }
          });
        }
      }
      const stageEnemies = ["enemy_swamp", "enemy_spear", "enemy_fish", "enemy_goblin", "enemy_elf", "enemy_walrus"];
      for (const ek of stageEnemies) {
        if (SPRITE_META[ek]) {
          ["idle", "walk1", "punch", "fall"].forEach((a) => {
            if (SPRITE_META[ek][a]) {
              essentialUrls.add(SPRITE_META[ek][a].src);
            }
          });
        }
      }
      for (const bk of ["alligator", "bear"]) {
        if (SPRITE_META[bk]) {
          ["idle", "walk1", "punch", "fall"].forEach((a) => {
            if (SPRITE_META[bk][a]) {
              essentialUrls.add(SPRITE_META[bk][a].src);
            }
          });
        }
      }
      this.totalToLoad = essentialUrls.size;
      let completed = 0;
      const loadPromises = Array.from(essentialUrls).map((url) => {
        return this.loadImage(url).then(() => {
          completed++;
          if (onProgress) onProgress(completed / this.totalToLoad);
        });
      });
      const safetyTimeout = new Promise((resolve) => setTimeout(resolve, 1500));
      await Promise.race([Promise.all(loadPromises), safetyTimeout]);
      if (onProgress) onProgress(1);
      this.preloadBackgroundAssets();
    }
    preloadBackgroundAssets() {
      const bgNames = [
        "stage2_bear.jpg",
        "stage3_capybara.jpg",
        "stage4_cat.jpg",
        "stage5_gorilla.jpg",
        "stage6_owl.jpg",
        "stage7_tiger.jpg",
        "stage8_wolf.jpg",
        "stage9_dragon.jpg"
      ];
      for (const bg of bgNames) {
        this.loadImage(`assets/images/backgrounds/${bg}`);
      }
      for (const charKey in SPRITE_META) {
        for (const anim in SPRITE_META[charKey]) {
          const src = SPRITE_META[charKey][anim].src;
          if (!this.cache.has(src)) {
            this.loadImage(src);
          }
        }
      }
      for (const k in EXTRA_SPRITES) {
        this.loadImage(EXTRA_SPRITES[k].src);
      }
    }
    loadImage(src) {
      if (!src) return Promise.resolve(null);
      if (this.cache.has(src)) {
        return Promise.resolve(this.cache.get(src));
      }
      return new Promise((resolve) => {
        const img = new Image();
        let finished = false;
        const done = (result) => {
          if (!finished) {
            finished = true;
            this.cache.set(src, result);
            resolve(result);
          }
        };
        img.onload = () => done(img);
        img.onerror = () => done(null);
        setTimeout(() => done(img), 1e3);
        img.src = src;
      });
    }
    getImage(src) {
      if (!src) return null;
      if (this.cache.has(src)) {
        return this.cache.get(src);
      }
      this.loadImage(src);
      return null;
    }
  };

  // js/entities/entity.js
  var Entity = class {
    constructor(x, z, charKey, spriteMapKey = null) {
      this.x = x;
      this.z = z;
      this.y = 0;
      this.vx = 0;
      this.vz = 0;
      this.vy = 0;
      this.charKey = charKey;
      this.spriteMapKey = spriteMapKey || charKey;
      this.facing = 1;
      this.state = "idle";
      this.stateTimer = 0;
      this.animFrame = 0;
      this.animTimer = 0;
      this.maxHp = 100;
      this.hp = 100;
      this.speed = 3.5;
      this.isDead = false;
      this.isInvincible = false;
      this.invincibleTimer = 0;
      this.scale = 1;
      this.baseScale = 0.52;
      this.shadowWidth = 50;
      this.width = 40;
      this.depth = 26;
      this.filter = null;
    }
    get meta() {
      return SPRITE_META[this.spriteMapKey] || {};
    }
    getCurrentSpriteName() {
      const meta = this.meta;
      let s = this.state;
      if (s === "walk") {
        const step = Math.floor(this.animFrame) % 2;
        s = step === 0 ? "walk1" : "walk2";
      } else if (s === "back") {
        const step = Math.floor(this.animFrame) % 2;
        s = step === 0 ? "back1" : "back2";
      } else if (s === "idle") {
        const step = Math.floor(this.animFrame * 0.5) % 2;
        if (step === 1 && meta["idle2"]) s = "idle2";
        else s = "idle";
      } else if (s === "victory") {
        const vNum = Math.floor(this.animFrame * 0.8) % 5 + 1;
        const vName = `victory${vNum}`;
        if (meta[vName]) s = vName;
        else if (meta["victory"]) s = "victory";
        else s = "idle";
      } else if (s === "hurt") {
        s = meta["crouch"] ? "crouch" : "idle";
      }
      if (meta[s]) return s;
      if (s.startsWith("punch") && meta["punch"]) return "punch";
      if (s.startsWith("kick") && meta["kick"]) return "kick";
      if (meta["idle"]) return "idle";
      const firstKey = Object.keys(meta)[0];
      return firstKey || "idle";
    }
    getSpriteInfo() {
      const sName = this.getCurrentSpriteName();
      const info = this.meta[sName] || { w: 180, h: 300, ax: 0.5, src: "" };
      return { name: sName, info };
    }
    takeDamage(amount, knockbackX = 0, knockbackY = 0) {
      if (this.isInvincible || this.isDead) return false;
      this.hp -= amount;
      this.isInvincible = true;
      this.invincibleTimer = 0.35;
      if (this.hp <= 0) {
        this.hp = 0;
        this.isDead = true;
        this.state = "fall";
        this.vy = Math.max(knockbackY, 7);
        this.vx = knockbackX * 1.3;
        this.deathTimer = 0.45;
      } else if (knockbackY > 4 || amount >= 25) {
        this.state = "knockdown";
        this.stateTimer = 0.6;
        this.vy = knockbackY || 6;
        this.vx = knockbackX;
      } else {
        this.state = "hurt";
        this.stateTimer = 0.22;
        this.vx = knockbackX * 0.4;
      }
      return true;
    }
    updatePhysics(dt, stageLimits) {
      if (this.invincibleTimer > 0) {
        this.invincibleTimer -= dt;
        if (this.invincibleTimer <= 0) {
          this.isInvincible = false;
        }
      }
      if (this.y > 0 || this.vy !== 0) {
        this.y += this.vy;
        this.vy -= 22 * dt;
        if (this.y <= 0) {
          this.y = 0;
          this.vy = 0;
          if (this.state === "fall" || this.state === "knockdown") {
            if (this.isDead) {
              this.state = "fall";
            } else {
              this.state = "crouch";
              this.stateTimer = 0.25;
            }
          } else if (this.state === "jump") {
            this.state = "idle";
          }
        }
      }
      this.x += this.vx * dt * 60;
      this.z += this.vz * dt * 60;
      if (this.state === "hurt" || this.state === "knockdown" || this.state === "fall") {
        this.vx *= 0.88;
        this.vz *= 0.88;
      }
      if (stageLimits) {
        if (this.z < stageLimits.minZ) this.z = stageLimits.minZ;
        if (this.z > stageLimits.maxZ) this.z = stageLimits.maxZ;
      }
      this.animTimer += dt * 6;
      this.animFrame = this.animTimer;
      if (this.stateTimer > 0) {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          if (this.state === "hurt" || this.state === "crouch") {
            this.state = "idle";
          }
        }
      }
    }
    drawShadow(ctx, camera) {
      if (this.isDead && this.y === 0 && this.state === "fall") return;
      const screenX = camera.toScreenX(this.x);
      const screenY = camera.toScreenY(this.z);
      const jumpFactor = Math.max(0.3, 1 - this.y / 240);
      const zDepthScale = 0.8 + this.z / 600 * 0.35;
      const sw = this.shadowWidth * jumpFactor * zDepthScale * this.scale;
      const sh = sw * 0.32;
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * jumpFactor})`;
      ctx.beginPath();
      ctx.ellipse(screenX, screenY, sw, sh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    draw(ctx, camera, imageLoader) {
      const { name, info } = this.getSpriteInfo();
      const img = imageLoader.getImage(info.src);
      if (!img) return;
      const screenX = camera.toScreenX(this.x);
      const screenY = camera.toScreenY(this.z - this.y);
      const depthScale = (0.85 + this.z / 550 * 0.25) * this.scale * this.baseScale;
      const drawW = info.w * depthScale;
      const drawH = info.h * depthScale;
      const anchorX = (info.ax !== void 0 ? info.ax : 0.5) * drawW;
      const anchorY = drawH;
      ctx.save();
      ctx.translate(screenX, screenY);
      if (this.isInvincible) {
        const blink = Math.floor(Date.now() / 65) % 2 === 0;
        ctx.globalAlpha = blink ? 0.15 : 0.95;
      } else if (this.isDead && this.deathTimer !== void 0) {
        ctx.globalAlpha = Math.max(0, Math.min(1, this.deathTimer / 0.45));
      }
      if (this.facing === -1) {
        ctx.scale(-1, 1);
      }
      if (this.filter) {
        ctx.filter = this.filter;
      }
      ctx.drawImage(img, -anchorX, -anchorY, drawW, drawH);
      ctx.restore();
    }
    // Check 2.5D distance to target
    distanceTo(other) {
      const dx = this.x - other.x;
      const dz = (this.z - other.z) * 1.8;
      return Math.sqrt(dx * dx + dz * dz);
    }
  };

  // js/entities/player.js
  var Player = class extends Entity {
    constructor(x, z, charKey) {
      const config = PLAYABLE_CHARACTERS[charKey];
      super(x, z, charKey, config.spriteId);
      this.config = config;
      this.name = config.name;
      this.maxHp = config.maxHp;
      this.hp = this.maxHp;
      this.speed = config.speed;
      this.specialMeter = 100;
      this.specialCooldown = 0;
      this.lives = 3;
      this.score = 0;
      this.attackCooldown = 0;
      this.punchComboStep = 0;
      this.kickComboStep = 0;
      this.comboResetTimer = 0;
      this.hitEntities = /* @__PURE__ */ new Set();
    }
    isAttacking() {
      return this.state.startsWith("punch") || this.state.startsWith("kick") || this.state === "special";
    }
    handleInput(input) {
      if (this.isDead) return;
      if (this.state === "hurt" || this.state === "knockdown" || this.state === "fall" || this.state === "victory") {
        return;
      }
      if (input.isActionPressed("special")) {
        if (this.specialMeter >= 40 && this.state !== "special") {
          this.performSpecial();
          return;
        }
      }
      if (input.isActionPressed("jump") && this.y === 0 && !this.isAttacking() && this.state !== "jump") {
        this.state = "jump";
        this.vy = 10.5;
        this.punchComboStep = 0;
        this.kickComboStep = 0;
        let jumpDx = 0;
        if (input.keys.left) jumpDx -= 1;
        if (input.keys.right) jumpDx += 1;
        this.vx = jumpDx * this.speed;
        Sound.playJump();
      }
      if (this.y > 0) {
        let airDx = 0;
        if (input.keys.left) airDx -= 1;
        if (input.keys.right) airDx += 1;
        if (airDx !== 0) {
          this.facing = airDx > 0 ? 1 : -1;
          this.vx = airDx * (this.speed * 0.85);
        }
        if ((input.isActionPressed("punch") || input.isActionPressed("kick")) && this.state !== "kick3") {
          this.state = "kick3";
          this.stateTimer = 0.35;
          this.hitEntities.clear();
          Sound.playKick();
        }
        return;
      }
      if (this.state !== "special") {
        if (input.isActionPressed("punch") && this.attackCooldown <= 0) {
          this.triggerPunchChain();
          return;
        }
        if (input.isActionPressed("kick") && this.attackCooldown <= 0) {
          this.triggerKickChain();
          return;
        }
      }
      if (!this.isAttacking()) {
        let dx = 0;
        let dz = 0;
        if (input.keys.left) dx -= 1;
        if (input.keys.right) dx += 1;
        if (input.keys.up) dz -= 0.8;
        if (input.keys.down) dz += 0.8;
        if (dx !== 0 && dz !== 0) {
          dx *= 0.7071;
          dz *= 0.7071;
        }
        this.vx = dx * this.speed;
        this.vz = dz * (this.speed * 0.75);
        if (dx !== 0) {
          this.facing = dx > 0 ? 1 : -1;
        }
        if (dx !== 0 || dz !== 0) {
          this.state = "walk";
        } else {
          this.state = "idle";
        }
      } else {
        this.vx *= 0.75;
        this.vz *= 0.75;
      }
    }
    triggerPunchChain() {
      this.kickComboStep = 0;
      if (this.punchComboStep === 0 || this.comboResetTimer <= 0) {
        this.punchComboStep = 1;
        this.state = "punch1";
        this.stateTimer = 0.22;
        this.attackCooldown = 0.16;
        this.comboResetTimer = 0.48;
        this.hitEntities.clear();
        this.vx = this.facing * 1.5;
        Sound.playPunch();
      } else if (this.punchComboStep === 1) {
        this.punchComboStep = 2;
        this.state = "punch2";
        this.stateTimer = 0.24;
        this.attackCooldown = 0.18;
        this.comboResetTimer = 0.52;
        this.hitEntities.clear();
        this.vx = this.facing * 2.5;
        Sound.playPunch();
      } else if (this.punchComboStep === 2) {
        this.punchComboStep = 3;
        this.state = "punch3";
        this.stateTimer = 0.34;
        this.attackCooldown = 0.36;
        this.comboResetTimer = 0;
        this.hitEntities.clear();
        this.vx = this.facing * 4.5;
        Sound.playHeavyHit();
      }
    }
    triggerKickChain() {
      this.punchComboStep = 0;
      if (this.kickComboStep === 0 || this.comboResetTimer <= 0) {
        this.kickComboStep = 1;
        this.state = "kick1";
        this.stateTimer = 0.24;
        this.attackCooldown = 0.18;
        this.comboResetTimer = 0.5;
        this.hitEntities.clear();
        this.vx = this.facing * 2;
        Sound.playKick();
      } else if (this.kickComboStep === 1) {
        this.kickComboStep = 2;
        this.state = "kick2";
        this.stateTimer = 0.26;
        this.attackCooldown = 0.2;
        this.comboResetTimer = 0.54;
        this.hitEntities.clear();
        this.vx = this.facing * 3;
        Sound.playKick();
      } else if (this.kickComboStep === 2) {
        this.kickComboStep = 3;
        this.state = "kick3";
        this.stateTimer = 0.36;
        this.attackCooldown = 0.38;
        this.comboResetTimer = 0;
        this.hitEntities.clear();
        this.vx = this.facing * 5;
        Sound.playHeavyHit();
      }
    }
    performSpecial() {
      this.state = "special";
      this.stateTimer = this.config.specialDuration;
      this.specialMeter = Math.max(0, this.specialMeter - 40);
      this.isInvincible = true;
      this.invincibleTimer = this.config.specialDuration + 0.15;
      this.punchComboStep = 0;
      this.kickComboStep = 0;
      this.comboResetTimer = 0;
      this.hitEntities.clear();
      this.vx = this.facing * (this.charKey === "emerson" ? 6 : 4.5);
      Sound.playSpecial();
    }
    heal(amount) {
      this.hp = Math.min(this.maxHp, this.hp + amount);
      Sound.playChickenHeal();
    }
    addScore(points) {
      this.score += points;
      this.specialMeter = Math.min(100, this.specialMeter + points * 0.08);
    }
    update(dt, stageLimits, camera) {
      if (this.attackCooldown > 0) {
        this.attackCooldown -= dt;
      }
      if (this.comboResetTimer > 0) {
        this.comboResetTimer -= dt;
        if (this.comboResetTimer <= 0) {
          this.punchComboStep = 0;
          this.kickComboStep = 0;
        }
      }
      if (this.specialMeter < 100) {
        this.specialMeter = Math.min(100, this.specialMeter + dt * 4.5);
      }
      this.updatePhysics(dt, stageLimits);
      const screenLeft = camera.x + 35;
      const screenRight = camera.x + camera.width - 35;
      if (this.x < screenLeft) this.x = screenLeft;
      if (this.x > screenRight) this.x = screenRight;
      if (this.stateTimer <= 0) {
        if (this.isAttacking()) {
          this.state = "idle";
          if (this.punchComboStep === 3) this.punchComboStep = 0;
          if (this.kickComboStep === 3) this.kickComboStep = 0;
        }
      }
    }
    // Get current attack hitbox based on active state (punch1, punch2, punch3, kick1, kick2, kick3, special)
    getAttackHitbox() {
      if (!this.isAttacking()) return null;
      let reach = 60;
      let damage = this.config.damage.punch;
      let knockbackX = this.facing * 3.5;
      let knockbackY = 1.5;
      if (this.state === "punch1") {
        damage = this.config.damage.punch;
        reach = 60;
        knockbackX = this.facing * 3.5;
        knockbackY = 1.5;
      } else if (this.state === "punch2") {
        damage = Math.floor(this.config.damage.punch * 1.35);
        reach = 68;
        knockbackX = this.facing * 5.5;
        knockbackY = 2.5;
      } else if (this.state === "punch3") {
        damage = Math.floor(this.config.damage.punch * 2);
        reach = 85;
        knockbackX = this.facing * 9.5;
        knockbackY = 6;
      } else if (this.state === "kick1") {
        damage = this.config.damage.kick;
        reach = 65;
        knockbackX = this.facing * 4;
        knockbackY = 2;
      } else if (this.state === "kick2") {
        damage = Math.floor(this.config.damage.kick * 1.35);
        reach = 75;
        knockbackX = this.facing * 6.5;
        knockbackY = 3.5;
      } else if (this.state === "kick3") {
        damage = Math.floor(this.config.damage.kick * 2.1);
        reach = 90;
        knockbackX = this.facing * 10.5;
        knockbackY = 6.5;
      } else if (this.state === "special") {
        damage = this.config.damage.special;
        reach = 100;
        knockbackX = this.facing * 11;
        knockbackY = 7.5;
      }
      const attackX = this.x + this.facing * (reach * 0.6);
      return {
        x: attackX,
        z: this.z,
        y: this.y,
        width: reach,
        depth: 35,
        height: 60,
        damage,
        knockbackX,
        knockbackY
      };
    }
    respawn(spawnX, spawnZ) {
      this.hp = this.maxHp;
      this.isDead = false;
      this.state = "idle";
      this.x = spawnX;
      this.z = spawnZ;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      this.punchComboStep = 0;
      this.kickComboStep = 0;
      this.comboResetTimer = 0;
      this.isInvincible = true;
      this.invincibleTimer = 2;
    }
  };

  // js/stages/stageRenderer.js
  var StageRenderer = class {
    constructor(viewportWidth = 960, viewportHeight = 540) {
      this.width = viewportWidth;
      this.height = viewportHeight;
      this.weatherTimer = 0;
      this.lightningTimer = 0;
      this.isLightning = false;
    }
    draw(ctx, stageConfig, camera, isBossArena = false, imageLoader = null) {
      const theme = stageConfig.theme;
      const bgImg = imageLoader && stageConfig.bgImage ? imageLoader.getImage(stageConfig.bgImage) : null;
      if (bgImg) {
        this.drawArtisticBackground(ctx, bgImg, stageConfig, camera, isBossArena);
      } else {
        this.drawFallbackBackground(ctx, stageConfig, camera, isBossArena);
      }
      this.drawGround(ctx, stageConfig, camera, isBossArena);
      this.drawWeatherEffects(ctx, theme.weather);
    }
    drawArtisticBackground(ctx, bgImg, stageConfig, camera, isBossArena) {
      ctx.save();
      if (isBossArena) {
        const arenaH = this.height * 0.72;
        ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, 0, 0, this.width, arenaH);
        const arenaVignette = ctx.createRadialGradient(
          this.width / 2,
          arenaH * 0.45,
          80,
          this.width / 2,
          arenaH * 0.45,
          this.width * 0.65
        );
        arenaVignette.addColorStop(0, "transparent");
        arenaVignette.addColorStop(0.7, "rgba(0, 0, 0, 0.45)");
        arenaVignette.addColorStop(1, "rgba(0, 0, 0, 0.85)");
        ctx.fillStyle = arenaVignette;
        ctx.fillRect(0, 0, this.width, arenaH);
        ctx.fillStyle = stageConfig.theme.neonColors[0] || "#ffd700";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowBlur = 18;
        ctx.shadowColor = stageConfig.theme.neonColors[0] || "#ff0055";
        ctx.fillText(`COVIL DE ${stageConfig.bossName}`, this.width / 2, 45);
        ctx.shadowBlur = 0;
      } else {
        const scrollSpeed = 0.28;
        const bgWidth = this.width * 1.35;
        const bgHeight = this.height * 0.74;
        const offset = -(camera.x * scrollSpeed) % bgWidth;
        for (let x = offset - bgWidth; x < this.width + bgWidth; x += bgWidth) {
          ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, x, 0, bgWidth, bgHeight);
        }
        const tintGrad = ctx.createLinearGradient(0, 0, 0, bgHeight);
        tintGrad.addColorStop(0, "rgba(0, 0, 0, 0.35)");
        tintGrad.addColorStop(1, "rgba(0, 0, 0, 0.05)");
        ctx.fillStyle = tintGrad;
        ctx.fillRect(0, 0, this.width, bgHeight);
      }
      ctx.restore();
    }
    drawFallbackBackground(ctx, stageConfig, camera, isBossArena) {
      const theme = stageConfig.theme;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height * 0.7);
      skyGrad.addColorStop(0, theme.skyColors[0]);
      skyGrad.addColorStop(0.5, theme.skyColors[1]);
      skyGrad.addColorStop(1, theme.skyColors[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.height);
      if (isBossArena) {
        ctx.fillStyle = theme.arenaColor;
        ctx.fillRect(0, 100, this.width, 260);
        return;
      }
      const midOffset = -(camera.x * 0.4) % 360;
      for (let i = -1; i < 6; i++) {
        const bx = midOffset + i * 220;
        const bw = 170;
        const bh = 220 + i * 73 % 80;
        const by = 350 - bh;
        ctx.fillStyle = "#1c163b";
        ctx.fillRect(bx, by, bw, bh);
      }
    }
    drawGround(ctx, stageConfig, camera, isBossArena) {
      const theme = stageConfig.theme;
      const groundScreenY = camera.toScreenY(stageConfig.groundMinZ - 10);
      const groundHeight = this.height - groundScreenY;
      ctx.fillStyle = theme.curbColor;
      ctx.fillRect(0, groundScreenY - 14, this.width, 14);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, groundScreenY - 14, this.width, 2);
      const pavementGrad = ctx.createLinearGradient(0, groundScreenY, 0, this.height);
      pavementGrad.addColorStop(0, theme.streetColor);
      pavementGrad.addColorStop(1, "#05040a");
      ctx.fillStyle = pavementGrad;
      ctx.fillRect(0, groundScreenY, this.width, groundHeight);
      if (isBossArena) {
        ctx.save();
        ctx.strokeStyle = theme.neonColors[0] || "#00e5ff";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = theme.neonColors[0] || "#00e5ff";
        ctx.strokeRect(60, groundScreenY + 15, this.width - 120, groundHeight - 25);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        const markOffset = -(camera.x % 140);
        for (let mx = markOffset; mx < this.width + 140; mx += 140) {
          ctx.fillRect(mx, groundScreenY + 65, 65, 8);
        }
      }
    }
    drawWeatherEffects(ctx, weatherType) {
      this.weatherTimer += 0.05;
      if (weatherType === "heavy_rain" || weatherType === "neon_rain") {
        ctx.strokeStyle = weatherType === "neon_rain" ? "rgba(0, 240, 255, 0.35)" : "rgba(180, 220, 255, 0.28)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 60; i++) {
          const rx = (Math.sin(i * 99 + this.weatherTimer * 20) * 0.5 + 0.5) * this.width;
          const ry = (Math.cos(i * 33 + this.weatherTimer * 30) * 0.5 + 0.5) * this.height;
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 8, ry + 24);
        }
        ctx.stroke();
      } else if (weatherType === "snow") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        for (let i = 0; i < 45; i++) {
          const sx = (Math.sin(i * 47 + this.weatherTimer * 0.8) * 0.5 + 0.5) * this.width;
          const sy = (i * 18 + this.weatherTimer * 45) % this.height;
          ctx.beginPath();
          ctx.arc(sx, sy, i % 3 + 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (weatherType === "embers" || weatherType === "lava_ash") {
        ctx.fillStyle = weatherType === "lava_ash" ? "#ff4400" : "#ff8800";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ff3300";
        for (let i = 0; i < 35; i++) {
          const ex = (Math.sin(i * 61 + this.weatherTimer * 1.5) * 0.5 + 0.5) * this.width;
          const ey = this.height - (i * 22 + this.weatherTimer * 55) % this.height;
          ctx.beginPath();
          ctx.arc(ex, ey, i % 3 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (weatherType === "fireflies") {
        ctx.fillStyle = "#ffee66";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ffdd33";
        for (let i = 0; i < 20; i++) {
          const fx = (Math.sin(i * 13 + this.weatherTimer * 0.5) * 0.5 + 0.5) * this.width;
          const fy = 120 + (Math.cos(i * 29 + this.weatherTimer * 0.7) * 0.5 + 0.5) * 250;
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (weatherType === "lightning") {
        if (Math.random() < 0.015) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
          ctx.fillRect(0, 0, this.width, this.height);
        }
      }
    }
  };

  // js/data/stagesData.js
  var STAGES_DATA = [
    {
      number: 1,
      id: "stage_1",
      name: "P\xC2NTANO & ESGOTOS",
      subtitle: "O Covil Subterr\xE2neo dos R\xE9pteis",
      bossId: "alligator",
      bossName: "KING GATOR",
      bgImage: "assets/images/backgrounds/stage1_alligator.jpg",
      durationSeconds: 60,
      stageLength: 3200,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#04120f", "#09211c", "#10332c"],
        streetColor: "#121e1a",
        curbColor: "#1a2e28",
        fogColor: "rgba(0, 255, 170, 0.08)",
        arenaColor: "#0a1613",
        neonColors: ["#00ffaa", "#55ffdd", "#22bb77"],
        weather: "neon_mist"
      },
      door: {
        label: "PORT\xC3O DO ESGOTO",
        frameColor: "#00ffaa",
        glowColor: "#55ffdd"
      },
      enemyPool: [
        { type: "enemy_swamp", name: "Monstro do Lodo", hp: 48, speed: 2.7, damage: 9, spriteKey: "enemy_swamp" },
        { type: "enemy_spear", name: "Guerreiro da Lan\xE7a", hp: 40, speed: 3.3, damage: 10, spriteKey: "enemy_spear" },
        { type: "enemy_fish", name: "Peixe-Bagre Parrudo", hp: 60, speed: 2.5, damage: 13, spriteKey: "enemy_fish" }
      ],
      chickenSpawns: [600, 1400, 2300, 2900]
    },
    {
      number: 2,
      id: "stage_2",
      name: "FLORESTA DOS PINHEIROS & BAMBUS",
      subtitle: "Territ\xF3rio Selvagem de Ursus Magnus",
      bossId: "bear",
      bossName: "URSUS MAGNUS",
      bgImage: "assets/images/backgrounds/stage2_bear.jpg",
      durationSeconds: 60,
      stageLength: 3400,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#06110a", "#0c2114", "#143320"],
        streetColor: "#1a241b",
        curbColor: "#28382a",
        fogColor: "rgba(50, 255, 120, 0.07)",
        arenaColor: "#0d1a10",
        neonColors: ["#38ef7d", "#11998e", "#a8ff78"],
        weather: "spores"
      },
      door: {
        label: "CAVERNA ANCESTRAL",
        frameColor: "#38ef7d",
        glowColor: "#a8ff78"
      },
      enemyPool: [
        { type: "enemy_goblin", name: "Goblin da Picareta", hp: 44, speed: 3.4, damage: 10, spriteKey: "enemy_goblin" },
        { type: "enemy_elf", name: "Elfo das Adagas", hp: 48, speed: 3.8, damage: 11, spriteKey: "enemy_elf" },
        { type: "enemy_walrus", name: "Morsa B\xE1rbaro", hp: 75, speed: 2.6, damage: 14, spriteKey: "enemy_walrus" }
      ],
      chickenSpawns: [700, 1500, 2400, 3100]
    },
    {
      number: 3,
      id: "stage_3",
      name: "LAGO SAGRADO & TEMPLO ORIENTAL",
      subtitle: "\xC1guas de Serenidade e Combate",
      bossId: "capybara",
      bossName: "CAPY SENSEI",
      bgImage: "assets/images/backgrounds/stage3_capybara.jpg",
      durationSeconds: 60,
      stageLength: 3400,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#1c0c08", "#381810", "#542818"],
        streetColor: "#241a15",
        curbColor: "#3d2b22",
        fogColor: "rgba(255, 160, 50, 0.08)",
        arenaColor: "#170f0b",
        neonColors: ["#ff9900", "#ffd000", "#ff5500"],
        weather: "fireflies"
      },
      door: {
        label: "PORT\xC3O TORII ZEN",
        frameColor: "#ff9900",
        glowColor: "#ffd000"
      },
      enemyPool: [
        { type: "thug_quick", name: "Monge Renegado", hp: 48, speed: 3.6, damage: 10, spriteMod: "nata_mod" },
        { type: "thug_medium", name: "Guarda da Lagoa", hp: 60, speed: 2.8, damage: 12, spriteMod: "dog_mod" },
        { type: "thug_heavy", name: "Buda de Ferro", hp: 68, speed: 2.6, damage: 13, spriteMod: "emerson_mod" }
      ],
      chickenSpawns: [650, 1450, 2350, 3050]
    },
    {
      number: 4,
      id: "stage_4",
      name: "SHINJUKU NOTURNA & TERRA\xC7OS",
      subtitle: "Nas Sombras de Shadow Claw",
      bossId: "cat",
      bossName: "SHADOW CLAW",
      bgImage: "assets/images/backgrounds/stage4_cat.jpg",
      durationSeconds: 60,
      stageLength: 3500,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#0f051c", "#240c3c", "#3c1460"],
        streetColor: "#1b1226",
        curbColor: "#2d1e3d",
        fogColor: "rgba(255, 0, 180, 0.09)",
        arenaColor: "#130a1f",
        neonColors: ["#ff00b7", "#00f0ff", "#ffe600"],
        weather: "neon_rain"
      },
      door: {
        label: "PORTAL DO DOJO NEON",
        frameColor: "#ff00b7",
        glowColor: "#ff66db"
      },
      enemyPool: [
        { type: "thug_quick", name: "Ninja Cibern\xE9tico", hp: 52, speed: 3.8, damage: 11, spriteMod: "nata_mod" },
        { type: "thug_heavy", name: "Ronin Blindado", hp: 72, speed: 2.6, damage: 14, spriteMod: "andrey_mod" },
        { type: "thug_medium", name: "Agente das Sombras", hp: 62, speed: 3.2, damage: 12, spriteMod: "emerson_mod" }
      ],
      chickenSpawns: [750, 1600, 2500, 3200]
    },
    {
      number: 5,
      id: "stage_5",
      name: "FUNDI\xC7\xC3O S\xCDSMICA & F\xC1BRICA",
      subtitle: "O Dom\xEDnio do Tit\xE3 Urbano",
      bossId: "gorilla",
      bossName: "TITAN KONG",
      bgImage: "assets/images/backgrounds/stage5_gorilla.jpg",
      durationSeconds: 60,
      stageLength: 3500,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#140803", "#2c1207", "#481d0b"],
        streetColor: "#241712",
        curbColor: "#3b251c",
        fogColor: "rgba(255, 68, 0, 0.1)",
        arenaColor: "#170c07",
        neonColors: ["#ff4800", "#ff8800", "#ffcc00"],
        weather: "embers"
      },
      door: {
        label: "BUNKER DE A\xC7O HIDR\xC1ULICO",
        frameColor: "#ff4800",
        glowColor: "#ff7733"
      },
      enemyPool: [
        { type: "thug_heavy", name: "Oper\xE1rio Enfurecido", hp: 76, speed: 2.7, damage: 15, spriteMod: "andrey_mod" },
        { type: "thug_medium", name: "Capataz de Ferro", hp: 66, speed: 3.1, damage: 13, spriteMod: "dog_mod" },
        { type: "thug_quick", name: "Soldador Louco", hp: 55, speed: 3.5, damage: 12, spriteMod: "emerson_mod" }
      ],
      chickenSpawns: [800, 1650, 2550, 3250]
    },
    {
      number: 6,
      id: "stage_6",
      name: "TORRE DO REL\xD3GIO DA TEMPESTADE",
      subtitle: "Vendavais nas Alturas de Zephyr Owl",
      bossId: "owl",
      bossName: "ZEPHYR OWL",
      bgImage: "assets/images/backgrounds/stage6_owl.jpg",
      durationSeconds: 60,
      stageLength: 3600,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#050e1a", "#0a1d36", "#123058"],
        streetColor: "#141d29",
        curbColor: "#223042",
        fogColor: "rgba(0, 190, 255, 0.11)",
        arenaColor: "#0c1521",
        neonColors: ["#00d4ff", "#82e6ff", "#ffffff"],
        weather: "heavy_rain"
      },
      door: {
        label: "PORTAL DOS VENTOS G\xD3TICOS",
        frameColor: "#00d4ff",
        glowColor: "#82e6ff"
      },
      enemyPool: [
        { type: "thug_quick", name: "Cultista do Vento", hp: 58, speed: 3.9, damage: 13, spriteMod: "emerson_mod" },
        { type: "thug_medium", name: "Guardi\xE3o Alado", hp: 70, speed: 3.2, damage: 14, spriteMod: "nata_mod" },
        { type: "thug_heavy", name: "Cruzado da Tempestade", hp: 80, speed: 2.8, damage: 16, spriteMod: "andrey_mod" }
      ],
      chickenSpawns: [700, 1500, 2450, 3250]
    },
    {
      number: 7,
      id: "stage_7",
      name: "RODOVIA DO TROV\xC3O",
      subtitle: "Alta Voltagem com Raiden Tiger",
      bossId: "tiger",
      bossName: "RAIDEN TIGER",
      bgImage: "assets/images/backgrounds/stage7_tiger.jpg",
      durationSeconds: 60,
      stageLength: 3600,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#0a051d", "#1f0d38", "#38165e"],
        streetColor: "#171424",
        curbColor: "#2b233d",
        fogColor: "rgba(255, 234, 0, 0.09)",
        arenaColor: "#130d21",
        neonColors: ["#ffe600", "#ff0055", "#00f0ff"],
        weather: "lightning"
      },
      door: {
        label: "PORT\xC3O DA SUBESTA\xC7\xC3O EL\xC9TRICA",
        frameColor: "#ffe600",
        glowColor: "#fff159"
      },
      enemyPool: [
        { type: "thug_quick", name: "Motoqueiro Rel\xE2mpago", hp: 62, speed: 4, damage: 14, spriteMod: "emerson_mod" },
        { type: "thug_heavy", name: "Lutador Clandestino", hp: 84, speed: 2.8, damage: 17, spriteMod: "andrey_mod" },
        { type: "thug_medium", name: "Assaltante do Asfalto", hp: 72, speed: 3.3, damage: 15, spriteMod: "dog_mod" }
      ],
      chickenSpawns: [800, 1700, 2600, 3300]
    },
    {
      number: 8,
      id: "stage_8",
      name: "DOCAS CONGELADAS & HANGAR",
      subtitle: "A F\xFAria \xC1rtica de Fenrir Lupus",
      bossId: "wolf",
      bossName: "FENRIR LUPUS",
      bgImage: "assets/images/backgrounds/stage8_wolf.jpg",
      durationSeconds: 60,
      stageLength: 3700,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#030b18", "#07182c", "#0d2847"],
        streetColor: "#151e28",
        curbColor: "#233242",
        fogColor: "rgba(160, 230, 255, 0.13)",
        arenaColor: "#0e1621",
        neonColors: ["#38c6ff", "#8fe0ff", "#ffffff"],
        weather: "snow"
      },
      door: {
        label: "HANGAR SUBTERR\xC2NEO DO GELO",
        frameColor: "#38c6ff",
        glowColor: "#8fe0ff"
      },
      enemyPool: [
        { type: "thug_quick", name: "Ca\xE7ador do \xC1rtico", hp: 68, speed: 4, damage: 15, spriteMod: "dog_mod" },
        { type: "thug_heavy", name: "Guerreiro da Geada", hp: 90, speed: 2.9, damage: 18, spriteMod: "andrey_mod" },
        { type: "thug_medium", name: "Batedor Polar", hp: 75, speed: 3.4, damage: 16, spriteMod: "nata_mod" }
      ],
      chickenSpawns: [750, 1600, 2500, 3350]
    },
    {
      number: 9,
      id: "stage_9",
      name: "CIDADELA DO VULC\xC3O",
      subtitle: "O Trono C\xF3smico do Bahamut Dragon",
      bossId: "dragon",
      bossName: "BAHAMUT DRAGON",
      bgImage: "assets/images/backgrounds/stage9_dragon.jpg",
      durationSeconds: 60,
      stageLength: 3800,
      groundY: 420,
      groundMinZ: 365,
      groundMaxZ: 505,
      theme: {
        skyColors: ["#1c0404", "#3b0a0a", "#601010"],
        streetColor: "#261414",
        curbColor: "#402020",
        fogColor: "rgba(255, 34, 0, 0.14)",
        arenaColor: "#1e0c0c",
        neonColors: ["#ff2200", "#ff6600", "#ffd000"],
        weather: "lava_ash"
      },
      door: {
        label: "PORT\xC3O DO APOCALIPSE DRACONIANO",
        frameColor: "#ff2200",
        glowColor: "#ff7733"
      },
      enemyPool: [
        { type: "thug_heavy", name: "Campe\xE3o Draconiano", hp: 98, speed: 3.1, damage: 19, spriteMod: "andrey_mod" },
        { type: "thug_quick", name: "L\xE2mina do Fogo Eterno", hp: 74, speed: 4.1, damage: 17, spriteMod: "nata_mod" },
        { type: "thug_medium", name: "Cultista do Apocalipse", hp: 82, speed: 3.5, damage: 18, spriteMod: "emerson_mod" }
      ],
      chickenSpawns: [800, 1750, 2700, 3450]
    }
  ];

  // js/entities/enemy.js
  var Enemy = class extends Entity {
    constructor(x, z, config, playerTarget) {
      let spriteMapKey = config.spriteKey || "andrey";
      let filter = null;
      if (!config.spriteKey) {
        if (config.spriteMod === "nata_mod") {
          spriteMapKey = "nata";
          filter = "hue-rotate(180deg) brightness(0.9)";
        } else if (config.spriteMod === "dog_mod") {
          spriteMapKey = "dog";
          filter = "hue-rotate(90deg) contrast(1.1)";
        } else if (config.spriteMod === "emerson_mod") {
          spriteMapKey = "emerson";
          filter = "hue-rotate(240deg) saturate(1.4)";
        } else {
          spriteMapKey = "andrey";
          filter = "hue-rotate(300deg) brightness(0.85)";
        }
      }
      super(x, z, "enemy", spriteMapKey);
      this.filter = filter;
      this.name = config.name || "Capanga";
      this.maxHp = config.hp || 45;
      this.hp = this.maxHp;
      this.speed = config.speed || 2.8;
      this.attackPower = config.damage || 8;
      this.player = playerTarget;
      this.attackCooldown = Math.random() * 1.5 + 0.5;
      this.thinkTimer = Math.random() * 0.5;
      this.behavior = "approach";
      this.flankOffsetZ = (Math.random() - 0.5) * 50;
      this.hitPlayer = false;
      this.scoreValue = 100;
    }
    updateAI(dt, stageLimits) {
      if (this.isDead) {
        this.updatePhysics(dt, stageLimits);
        return;
      }
      if (this.state === "hurt" || this.state === "knockdown" || this.state === "fall") {
        this.updatePhysics(dt, stageLimits);
        return;
      }
      if (!this.player || this.player.isDead) {
        this.state = "idle";
        this.updatePhysics(dt, stageLimits);
        return;
      }
      if (this.attackCooldown > 0) {
        this.attackCooldown -= dt;
      }
      this.thinkTimer -= dt;
      if (this.thinkTimer <= 0) {
        this.thinkTimer = 0.4 + Math.random() * 0.4;
        const dist = this.distanceTo(this.player);
        if (dist < 70) {
          this.behavior = Math.random() < 0.65 ? "attack" : "retreat";
        } else if (dist < 180) {
          this.behavior = Math.random() < 0.5 ? "flank" : "approach";
        } else {
          this.behavior = "approach";
        }
      }
      const dx = this.player.x - this.x;
      const targetZ = this.player.z + (this.behavior === "flank" ? this.flankOffsetZ : 0);
      const dz = targetZ - this.z;
      this.facing = dx >= 0 ? 1 : -1;
      if (this.state === "punch" || this.state === "kick") {
        this.vx *= 0.8;
        this.vz *= 0.8;
      } else {
        const absDx = Math.abs(dx);
        const absDz = Math.abs(this.player.z - this.z);
        if (absDx < 62 && absDz < 24 && this.attackCooldown <= 0) {
          const isKick = Math.random() < 0.4;
          this.state = isKick ? "kick" : "punch";
          this.stateTimer = 0.28;
          this.attackCooldown = 1.4 + Math.random() * 1;
          this.hitPlayer = false;
          if (isKick) Sound.playKick();
          else Sound.playPunch();
        } else {
          let moveX = 0;
          let moveZ = 0;
          if (this.behavior === "retreat") {
            moveX = -Math.sign(dx);
            moveZ = Math.sign(dz) * 0.5;
          } else {
            if (absDx > 50) moveX = Math.sign(dx);
            if (absDz > 10) moveZ = Math.sign(dz);
          }
          const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
          if (len > 0) {
            this.vx = moveX / len * this.speed;
            this.vz = moveZ / len * (this.speed * 0.7);
            this.state = "walk";
          } else {
            this.vx = 0;
            this.vz = 0;
            this.state = "idle";
          }
        }
      }
      this.updatePhysics(dt, stageLimits);
      if (this.stateTimer <= 0) {
        if (this.state === "punch" || this.state === "kick") {
          this.state = "idle";
        }
      }
    }
    getAttackHitbox() {
      if ((this.state === "punch" || this.state === "kick") && !this.hitPlayer) {
        return {
          x: this.x + this.facing * 30,
          z: this.z,
          y: this.y,
          width: 45,
          depth: 25,
          height: 50,
          damage: this.attackPower,
          knockbackX: this.facing * 3.5,
          knockbackY: 1.5
        };
      }
      return null;
    }
    drawHealthBar(ctx, camera) {
      if (this.isDead || this.hp >= this.maxHp) return;
      const screenX = camera.toScreenX(this.x);
      const screenY = camera.toScreenY(this.z - this.y - 145 * this.scale);
      const w = 42;
      const h = 5;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(screenX - w / 2 - 1, screenY - 1, w + 2, h + 2);
      ctx.fillStyle = hpRatio > 0.4 ? "#ffcc00" : "#ff2222";
      ctx.fillRect(screenX - w / 2, screenY, w * hpRatio, h);
      ctx.restore();
    }
  };

  // js/entities/boss.js
  var BossProjectile = class {
    constructor(x, z, y, vx, vy, vz, type = "tornado", scale = 1) {
      this.x = x;
      this.z = z;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.vz = vz;
      this.type = type;
      this.scale = scale;
      this.life = 3.5;
      this.isDead = false;
      this.frame = 0;
    }
    update(dt) {
      this.x += this.vx * dt * 60;
      this.z += this.vz * dt * 60;
      this.y += this.vy * dt * 60;
      this.life -= dt;
      this.frame += dt * 8;
      if (this.life <= 0 || this.type === "meteor" && this.y <= 0) {
        this.isDead = true;
      }
    }
    draw(ctx, camera, imageLoader) {
      let src = "";
      let w = 200;
      let h = 200;
      if (this.type === "tornado") {
        src = "assets/images/sprites/boss6/tornado.png";
        w = 271;
        h = 331;
      } else {
        const meteorIndex = Math.floor(this.frame) % 4 + 1;
        src = `assets/images/sprites/FinalBoss/meteor_${meteorIndex}.png`;
        w = 315;
        h = 385;
      }
      const img = imageLoader.getImage(src);
      if (!img) return;
      const screenX = camera.toScreenX(this.x);
      const screenY = camera.toScreenY(this.z - this.y);
      const s = 0.45 * this.scale;
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.shadowBlur = 18;
      ctx.shadowColor = this.type === "tornado" ? "#00e5ff" : "#ff5500";
      ctx.drawImage(img, -w * s / 2, -h * s / 2, w * s, h * s);
      ctx.restore();
    }
  };
  var Boss = class extends Entity {
    constructor(stageNumber, x, z, playerTarget) {
      const config = BOSS_CONFIGS[stageNumber];
      super(x, z, config.spriteId, config.spriteId);
      this.config = config;
      this.stageNumber = stageNumber;
      this.name = config.name;
      this.title = config.title;
      this.maxHp = config.maxHp;
      this.hp = this.maxHp;
      this.speed = config.speed;
      this.attackPower = config.attackPower;
      this.scale = config.scale || 1.1;
      this.player = playerTarget;
      this.projectiles = [];
      this.superArmor = 50;
      this.superArmorMax = 50;
      this.specialCooldown = config.specialCooldown || 7;
      this.specialTimer = 3;
      this.attackCooldown = 1;
      this.aiState = "combat";
      this.introTimer = 2;
      this.hitPlayerThisSwing = false;
    }
    takeDamage(amount, knockbackX = 0, knockbackY = 0) {
      if (this.isInvincible || this.isDead) return false;
      this.hp -= amount;
      this.superArmor -= amount;
      this.isInvincible = true;
      this.invincibleTimer = 0.25;
      if (this.hp <= 0) {
        this.hp = 0;
        this.isDead = true;
        this.aiState = "defeated";
        this.state = "fall";
        this.vy = 8;
        this.vx = knockbackX * 1.5;
        Sound.playHeavyHit();
      } else if (this.superArmor <= 0) {
        this.superArmor = this.superArmorMax;
        this.state = "knockdown";
        this.stateTimer = 0.55;
        this.vy = knockbackY || 5;
        this.vx = knockbackX * 0.7;
        Sound.playHeavyHit();
      } else {
        Sound.playPunch();
      }
      return true;
    }
    updateAI(dt, stageLimits, camera) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update(dt);
        if (p.isDead) {
          this.projectiles.splice(i, 1);
        }
      }
      if (this.isDead) {
        this.updatePhysics(dt, stageLimits);
        return;
      }
      if (this.introTimer > 0) {
        this.introTimer -= dt;
        this.state = "idle";
        this.updatePhysics(dt, stageLimits);
        return;
      }
      if (this.state === "knockdown" || this.state === "fall" || this.state === "crouch") {
        this.updatePhysics(dt, stageLimits);
        return;
      }
      if (!this.player || this.player.isDead) {
        this.state = "idle";
        this.updatePhysics(dt, stageLimits);
        return;
      }
      if (this.attackCooldown > 0) this.attackCooldown -= dt;
      if (this.specialTimer > 0) this.specialTimer -= dt;
      const dx = this.player.x - this.x;
      const dz = this.player.z - this.z;
      const absDx = Math.abs(dx);
      const absDz = Math.abs(dz);
      this.facing = dx >= 0 ? 1 : -1;
      if (this.specialTimer <= 0 && this.state !== "special") {
        this.castSpecial(camera);
        return;
      }
      if (this.state === "special") {
        this.vx *= 0.9;
        this.vz *= 0.9;
        this.updatePhysics(dt, stageLimits);
        if (this.stateTimer <= 0) {
          this.state = "idle";
        }
        return;
      }
      if (this.state === "punch" || this.state === "kick") {
        this.vx *= 0.85;
        this.vz *= 0.85;
      } else {
        if (absDx < 75 && absDz < 28 && this.attackCooldown <= 0) {
          const isKick = Math.random() < 0.45;
          this.state = isKick ? "kick" : "punch";
          this.stateTimer = 0.32;
          this.attackCooldown = 1 + Math.random() * 0.8;
          this.hitPlayerThisSwing = false;
          if (isKick) Sound.playKick();
          else Sound.playPunch();
        } else {
          let moveX = Math.sign(dx);
          let moveZ = Math.sign(dz);
          const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
          if (len > 0) {
            this.vx = moveX / len * this.speed;
            this.vz = moveZ / len * (this.speed * 0.7);
            this.state = "walk";
          } else {
            this.vx = 0;
            this.vz = 0;
            this.state = "idle";
          }
        }
      }
      this.updatePhysics(dt, stageLimits);
      if (this.stateTimer <= 0) {
        if (this.state === "punch" || this.state === "kick") {
          this.state = "idle";
        }
      }
    }
    castSpecial(camera) {
      this.state = "special";
      this.stateTimer = 1.2;
      this.specialTimer = this.config.specialCooldown + Math.random() * 2;
      this.hitPlayerThisSwing = false;
      Sound.playSpecial();
      if (camera) camera.shake(10, 0.4);
      if (this.config.hasTornado) {
        const proj = new BossProjectile(
          this.x + this.facing * 40,
          this.z,
          20,
          this.facing * 5,
          0,
          (Math.random() - 0.5) * 1.5,
          "tornado",
          1.1
        );
        this.projectiles.push(proj);
      } else if (this.config.hasMeteors) {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            if (this.isDead) return;
            const spawnX = (this.player ? this.player.x : this.x) + (Math.random() - 0.5) * 260;
            const spawnZ = (this.player ? this.player.z : this.z) + (Math.random() - 0.5) * 80;
            const meteor = new BossProjectile(
              spawnX,
              spawnZ,
              380,
              // Falling from sky
              (Math.random() - 0.5) * 1.5,
              -7.5,
              0,
              "meteor",
              1.2
            );
            this.projectiles.push(meteor);
          }, i * 280);
        }
      } else {
        this.vx = this.facing * 7.5;
      }
    }
    getAttackHitbox() {
      if ((this.state === "punch" || this.state === "kick" || this.state === "special") && !this.hitPlayerThisSwing) {
        const reach = this.state === "special" ? 85 : 55;
        return {
          x: this.x + this.facing * (reach * 0.6),
          z: this.z,
          y: this.y,
          width: reach,
          depth: 30,
          height: 60,
          damage: this.state === "special" ? this.attackPower * 1.8 : this.attackPower,
          knockbackX: this.facing * (this.state === "special" ? 8 : 4.5),
          knockbackY: this.state === "special" ? 6 : 2.5
        };
      }
      return null;
    }
    drawProjectiles(ctx, camera, imageLoader) {
      for (const p of this.projectiles) {
        p.draw(ctx, camera, imageLoader);
      }
    }
  };

  // js/entities/item.js
  var ChickenItem = class {
    constructor(x, z) {
      this.x = x;
      this.z = z;
      this.y = 0;
      this.width = 44;
      this.height = 44;
      this.healAmount = 50;
      this.isCollected = false;
      this.bobTimer = Math.random() * Math.PI * 2;
    }
    update(dt, player) {
      if (this.isCollected) return;
      this.bobTimer += dt * 4;
      const dx = Math.abs(player.x - this.x);
      const dz = Math.abs(player.z - this.z);
      if (dx < 36 && dz < 20 && player.y < 30) {
        this.isCollected = true;
        player.heal(this.healAmount);
        player.addScore(300);
      }
    }
    draw(ctx, camera, imageLoader) {
      if (this.isCollected) return;
      const screenX = camera.toScreenX(this.x);
      const bobOffset = Math.sin(this.bobTimer) * 4;
      const screenY = camera.toScreenY(this.z - bobOffset);
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(screenX, camera.toScreenY(this.z), 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#ffd700";
      const img = imageLoader.getImage("assets/images/sprites/chicken.png");
      if (img) {
        ctx.drawImage(img, screenX - 28, screenY - 44, 56, 56);
      } else {
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(screenX, screenY - 20, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };
  var BossDoor = class {
    constructor(x, z, stageConfig) {
      this.x = x;
      this.z = z;
      this.stageConfig = stageConfig;
      this.isOpen = false;
      this.openProgress = 0;
      this.glowPulse = 0;
    }
    open() {
      this.isOpen = true;
    }
    update(dt) {
      this.glowPulse += dt * 5;
      if (this.isOpen && this.openProgress < 1) {
        this.openProgress = Math.min(1, this.openProgress + dt * 1.5);
      }
    }
    isPlayerEntering(player) {
      if (!this.isOpen) return false;
      const dx = Math.abs(player.x - this.x);
      const dz = Math.abs(player.z - this.z);
      return dx < 45 && dz < 35;
    }
    draw(ctx, camera) {
      const screenX = camera.toScreenX(this.x);
      const screenY = camera.toScreenY(this.z);
      const doorW = 90;
      const doorH = 175;
      ctx.save();
      ctx.translate(screenX, screenY);
      const frameColor = this.stageConfig.door.frameColor || "#00e5ff";
      const glowColor = this.stageConfig.door.glowColor || "#00f0ff";
      const pulseAlpha = 0.5 + Math.sin(this.glowPulse) * 0.4;
      ctx.lineWidth = 6;
      ctx.strokeStyle = frameColor;
      ctx.shadowBlur = this.isOpen ? 25 : 12;
      ctx.shadowColor = this.isOpen ? glowColor : "#ff0055";
      ctx.strokeRect(-doorW / 2, -doorH, doorW, doorH);
      ctx.fillStyle = "#080812";
      ctx.fillRect(-doorW / 2 + 3, -doorH + 3, doorW - 6, doorH - 3);
      if (this.openProgress < 1) {
        const slide = (doorW / 2 - 3) * this.openProgress;
        ctx.fillStyle = "#1e1c29";
        ctx.fillRect(-doorW / 2 + 3 - slide, -doorH + 3, doorW / 2 - 3, doorH - 3);
        ctx.fillRect(slide, -doorH + 3, doorW / 2 - 3, doorH - 3);
        if (!this.isOpen) {
          ctx.fillStyle = "#ff2222";
          ctx.beginPath();
          ctx.arc(0, -doorH + 20, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const grad = ctx.createLinearGradient(0, -doorH, 0, 0);
        grad.addColorStop(0, glowColor);
        grad.addColorStop(1, "rgba(0, 0, 0, 0.8)");
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.65 * pulseAlpha;
        ctx.fillRect(-doorW / 2 + 4, -doorH + 4, doorW - 8, doorH - 4);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = this.isOpen ? "#00ff88" : "#ff3366";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.isOpen ? "#00ff88" : "#ff3366";
      ctx.fillText(this.isOpen ? "PORTA ABERTA! ENTRE!" : "PORT\xC3O DO CHEFE", 0, -doorH - 12);
      if (this.isOpen) {
        ctx.fillStyle = "#ffe600";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("\u25BC", 0, -doorH - 28 + Math.sin(this.glowPulse) * 4);
      }
      ctx.restore();
    }
  };
  var ParticleSystem = class {
    constructor() {
      this.particles = [];
      this.texts = [];
    }
    addHitSparks(x, y, z, color = "#ffea00", count = 8) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.particles.push({
          x,
          y,
          z,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 2,
          vz: (Math.random() - 0.5) * 1.5,
          color,
          size: Math.random() * 4 + 3,
          life: 0.35,
          maxLife: 0.35
        });
      }
    }
    addFloatingText(text, x, y, z, color = "#fff") {
      this.texts.push({
        text,
        x,
        y,
        z,
        vy: 1.8,
        color,
        life: 0.8,
        maxLife: 0.8
      });
    }
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.z += p.vz * dt * 60;
        p.vy -= 12 * dt;
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.y += t.vy * dt * 60;
        t.life -= dt;
        if (t.life <= 0) {
          this.texts.splice(i, 1);
        }
      }
    }
    draw(ctx, camera) {
      for (const p of this.particles) {
        const sx = camera.toScreenX(p.x);
        const sy = camera.toScreenY(p.z - p.y);
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const t of this.texts) {
        const sx = camera.toScreenX(t.x);
        const sy = camera.toScreenY(t.z - t.y);
        const alpha = Math.max(0, t.life / t.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = t.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#000";
        ctx.font = "bold 15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(t.text, sx, sy);
        ctx.restore();
      }
    }
  };

  // js/stages/stageManager.js
  var StageManager = class {
    constructor(game) {
      this.game = game;
      this.currentStageIndex = 0;
      this.stageConfig = STAGES_DATA[0];
      this.phase = "street";
      this.stageTimer = 60;
      this.timeElapsed = 0;
      this.enemies = [];
      this.chickens = [];
      this.boss = null;
      this.door = null;
      this.particles = new ParticleSystem();
      this.spawnTimer = 0;
      this.nextChickenIndex = 0;
      this.stageLimits = {
        minZ: 370,
        maxZ: 500
      };
      this.transitionTimer = 0;
      this.clearTimer = 0;
    }
    loadStage(stageIndex) {
      this.currentStageIndex = stageIndex;
      this.stageConfig = STAGES_DATA[stageIndex];
      this.phase = "street";
      this.stageTimer = this.stageConfig.durationSeconds || 60;
      this.timeElapsed = 0;
      this.enemies = [];
      this.chickens = [];
      this.boss = null;
      this.particles = new ParticleSystem();
      this.spawnTimer = 1;
      this.nextChickenIndex = 0;
      this.transitionTimer = 0;
      this.clearTimer = 0;
      this.door = new BossDoor(this.stageConfig.stageLength - 160, 420, this.stageConfig);
      if (this.stageConfig.chickenSpawns) {
        for (const cx of this.stageConfig.chickenSpawns) {
          const cz = 380 + Math.random() * 100;
          this.chickens.push(new ChickenItem(cx, cz));
        }
      }
      this.game.camera.x = 0;
      this.game.camera.setLimits(0, this.stageConfig.stageLength);
      this.game.camera.isLocked = false;
      if (this.game.player) {
        this.game.player.x = 120;
        this.game.player.z = 430;
        this.game.player.y = 0;
        this.game.player.vx = 0;
        this.game.player.vz = 0;
        this.game.player.state = "idle";
      }
      Sound.startBgm(this.stageConfig.number, false);
      this.spawnWave(5);
    }
    spawnWave(count = 2) {
      const player = this.game.player;
      if (!player) return;
      const pool = this.stageConfig.enemyPool;
      if (!pool || pool.length === 0) return;
      for (let i = 0; i < count; i++) {
        const enemyConfig = pool[Math.floor(Math.random() * pool.length)];
        const spawnAhead = Math.random() < 0.65;
        const offset = 40 + i * 35 + Math.random() * 40;
        const spawnX = spawnAhead ? this.game.camera.x + this.game.camera.width + offset : Math.max(25, this.game.camera.x - offset);
        const spawnZ = 370 + Math.random() * 130;
        this.enemies.push(new Enemy(spawnX, spawnZ, enemyConfig, player));
      }
    }
    update(dt) {
      this.particles.update(dt);
      if (this.phase === "street" || this.phase === "door_open") {
        this.updateStreetPhase(dt);
      } else if (this.phase === "entering_door") {
        this.updateDoorTransition(dt);
      } else if (this.phase === "boss_battle") {
        this.updateBossBattle(dt);
      } else if (this.phase === "stage_cleared") {
        this.updateStageClear(dt);
      }
    }
    updateStreetPhase(dt) {
      this.timeElapsed += dt;
      this.stageTimer = Math.max(0, this.stageTimer - dt);
      const player = this.game.player;
      if (!player) return;
      if (this.door) {
        this.door.update(dt);
        if (!this.door.isOpen && (this.stageTimer <= 0 || player.x >= this.stageConfig.stageLength - 380)) {
          this.door.open();
          this.phase = "door_open";
          Sound.playDoorOpen();
        }
        if (this.door.isOpen && (this.door.isPlayerEntering(player) || player.x >= this.door.x - 25)) {
          this.phase = "entering_door";
          this.transitionTimer = 0.8;
          player.vx = 0;
          player.vz = 0;
          player.state = "idle";
          return;
        }
      }
      for (const chicken of this.chickens) {
        chicken.update(dt, player);
      }
      this.spawnTimer -= dt;
      const livingEnemies = this.enemies.filter((e) => !e.isDead);
      const targetEnemies = 6;
      if (this.stageTimer > 0) {
        if (livingEnemies.length <= 3 || this.spawnTimer <= 0 && livingEnemies.length < targetEnemies) {
          const countToSpawn = Math.max(2, Math.min(3, targetEnemies - livingEnemies.length));
          this.spawnWave(countToSpawn);
          this.spawnTimer = 2.2 + Math.random() * 1.8;
        }
      }
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        enemy.updateAI(dt, this.stageLimits);
        if (enemy.isDead) {
          enemy.deathTimer = (enemy.deathTimer !== void 0 ? enemy.deathTimer : 0.45) - dt;
          if (enemy.y <= 0 || enemy.deathTimer <= 0) {
            this.particles.addHitSparks(enemy.x, enemy.y || 15, enemy.z, "#ffbb00", 12);
            if (Math.random() < 0.3 || player && player.hp < 45) {
              this.chickens.push(new ChickenItem(enemy.x, enemy.z));
            }
            this.enemies.splice(i, 1);
          }
        }
      }
    }
    updateDoorTransition(dt) {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.phase = "boss_battle";
        this.setupBossArena();
      }
    }
    setupBossArena() {
      const player = this.game.player;
      this.game.camera.x = 0;
      this.game.camera.setLimits(0, 960);
      this.game.camera.isLocked = true;
      if (player) {
        player.x = 200;
        player.z = 430;
        player.y = 0;
        player.vx = 0;
        player.vz = 0;
        player.facing = 1;
        player.state = "idle";
      }
      this.boss = new Boss(this.stageConfig.number, 740, 430, player);
      this.enemies = [];
      Sound.playBossWarning();
      Sound.setBossIntensity(true);
      this.game.camera.shake(12, 0.6);
    }
    updateBossBattle(dt) {
      const player = this.game.player;
      if (!this.boss || !player) return;
      this.boss.updateAI(dt, this.stageLimits, this.game.camera);
      if (this.boss.isDead && this.boss.y === 0) {
        this.clearTimer += dt;
        if (this.clearTimer >= 1.5 && this.phase !== "stage_cleared") {
          this.phase = "stage_cleared";
          this.clearTimer = 0;
          player.state = "victory";
          Sound.playVictory();
          Sound.stopBgm();
          player.addScore(5e3);
        }
      }
    }
    updateStageClear(dt) {
      this.clearTimer += dt;
      const player = this.game.player;
      if (player) {
        player.state = "victory";
      }
    }
    advanceToNextStage() {
      if (this.currentStageIndex < STAGES_DATA.length - 1) {
        this.loadStage(this.currentStageIndex + 1);
        return true;
      } else {
        return false;
      }
    }
    // Draw entities sorted by Z for accurate 2.5D depth sorting
    drawEntities(ctx, camera, imageLoader) {
      const renderList = [];
      if (this.door && this.phase !== "boss_battle" && this.phase !== "stage_cleared") {
        renderList.push({ z: this.door.z - 20, type: "door", entity: this.door });
      }
      if (this.phase !== "boss_battle") {
        for (const c of this.chickens) {
          if (!c.isCollected) {
            renderList.push({ z: c.z, type: "chicken", entity: c });
          }
        }
      }
      if (this.game.player) {
        renderList.push({ z: this.game.player.z, type: "character", entity: this.game.player });
      }
      for (const e of this.enemies) {
        renderList.push({ z: e.z, type: "character", entity: e });
      }
      if (this.boss) {
        renderList.push({ z: this.boss.z, type: "character", entity: this.boss });
      }
      renderList.sort((a, b) => a.z - b.z);
      for (const item of renderList) {
        if (item.type === "character") {
          item.entity.drawShadow(ctx, camera);
        }
      }
      for (const item of renderList) {
        if (item.type === "door") {
          item.entity.draw(ctx, camera);
        } else if (item.type === "chicken") {
          item.entity.draw(ctx, camera, imageLoader);
        } else if (item.type === "character") {
          item.entity.draw(ctx, camera, imageLoader);
          if (item.entity instanceof Enemy) {
            item.entity.drawHealthBar(ctx, camera);
          }
        }
      }
      if (this.boss) {
        this.boss.drawProjectiles(ctx, camera, imageLoader);
      }
      this.particles.draw(ctx, camera);
    }
  };

  // js/ui/hud.js
  var HUD = class {
    constructor() {
      this.bannerText = "";
      this.bannerSubtext = "";
      this.bannerTimer = 0;
      this.bannerColor = "#00f0ff";
    }
    showBanner(text, subtext = "", duration = 2.5, color = "#00f0ff") {
      this.bannerText = text;
      this.bannerSubtext = subtext;
      this.bannerTimer = duration;
      this.bannerColor = color;
    }
    update(dt) {
      if (this.bannerTimer > 0) {
        this.bannerTimer -= dt;
      }
    }
    draw(ctx, player, stageManager, imageLoader) {
      if (!player) return;
      ctx.save();
      this.drawPlayerStats(ctx, player, imageLoader);
      this.drawStageTimer(ctx, stageManager);
      this.drawScore(ctx, player, stageManager);
      if (stageManager.phase === "boss_battle" && stageManager.boss) {
        this.drawBossHealthBar(ctx, stageManager.boss);
      }
      const livingEnemies = stageManager.enemies.filter((e) => !e.isDead);
      if ((stageManager.phase === "street" || stageManager.phase === "door_open") && (livingEnemies.length <= 1 || stageManager.door?.isOpen || stageManager.stageTimer <= 0 || player.x >= stageManager.stageConfig.stageLength - 420)) {
        this.drawGoPrompt(ctx, stageManager.door?.isOpen || stageManager.stageTimer <= 0);
      }
      if (this.bannerTimer > 0) {
        this.drawCenterBanner(ctx);
      }
      ctx.restore();
    }
    drawPlayerStats(ctx, player, imageLoader) {
      const startX = 25;
      const startY = 22;
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00f0ff";
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 3;
      ctx.fillStyle = "#110d24";
      ctx.strokeRect(startX, startY, 56, 56);
      ctx.fillRect(startX, startY, 56, 56);
      const portraitImg = imageLoader.getImage(player.config.portrait);
      if (portraitImg) {
        ctx.drawImage(portraitImg, startX + 2, startY + 2, 52, 52);
      }
      ctx.restore();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#000";
      ctx.fillText(player.name, startX + 68, startY + 16);
      const hpX = startX + 68;
      const hpY = startY + 22;
      const hpW = 190;
      const hpH = 14;
      const hpRatio = Math.max(0, player.hp / player.maxHp);
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(hpX - 1, hpY - 1, hpW + 2, hpH + 2);
      const hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0);
      if (hpRatio > 0.45) {
        hpGrad.addColorStop(0, "#00ff88");
        hpGrad.addColorStop(1, "#a6ff00");
      } else if (hpRatio > 0.2) {
        hpGrad.addColorStop(0, "#ffbb00");
        hpGrad.addColorStop(1, "#ff6600");
      } else {
        hpGrad.addColorStop(0, "#ff3333");
        hpGrad.addColorStop(1, "#990000");
      }
      ctx.fillStyle = hpGrad;
      ctx.fillRect(hpX, hpY, hpW * hpRatio, hpH);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, hpX + 6, hpY + 11);
      const spY = hpY + 18;
      const spW = 150;
      const spH = 8;
      const spRatio = Math.max(0, player.specialMeter / 100);
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(hpX - 1, spY - 1, spW + 2, spH + 2);
      ctx.fillStyle = spRatio >= 0.4 ? "#00e5ff" : "#0066aa";
      ctx.fillRect(hpX, spY, spW * spRatio, spH);
      ctx.fillStyle = spRatio >= 0.4 ? "#00e5ff" : "#888888";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(spRatio >= 0.4 ? "ESPECIAL PRONTO [L/C]" : "CARREGANDO SP", hpX + spW + 8, spY + 8);
      ctx.font = "bold 13px sans-serif";
      let hearts = "";
      for (let i = 0; i < 3; i++) {
        hearts += i < player.lives ? "\u2665 " : "\u2661 ";
      }
      ctx.fillStyle = player.lives > 1 ? "#ffd700" : "#ff4466";
      ctx.fillText(`${hearts} (${player.lives} VIDAS)`, startX, startY + 74);
      if (player.isInvincible) {
        ctx.fillStyle = "#00ffc4";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("\u2605 INVENC\xCDVEL \u2605", startX + 130, startY + 74);
      }
    }
    drawStageTimer(ctx, stageManager) {
      const cx = 480;
      const cy = 30;
      ctx.save();
      ctx.fillStyle = "rgba(12, 10, 24, 0.8)";
      ctx.strokeStyle = "#2b214a";
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 75, 12, 150, 48);
      ctx.strokeRect(cx - 75, 12, 150, 48);
      ctx.fillStyle = "#00f0ff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`FASE ${stageManager.stageConfig.number} DE 9`, cx, 26);
      const seconds = Math.ceil(stageManager.stageTimer);
      const mins = Math.floor(seconds / 60);
      const remSecs = seconds % 60;
      const timeStr = `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
      ctx.fillStyle = seconds <= 10 && Math.floor(Date.now() / 250) % 2 === 0 ? "#ff3333" : "#ffd700";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(stageManager.phase === "boss_battle" ? "BOSS" : timeStr, cx, 50);
      ctx.restore();
    }
    drawScore(ctx, player, stageManager) {
      const rx = 935;
      const ry = 28;
      ctx.save();
      ctx.textAlign = "right";
      ctx.fillStyle = "#a6b0cf";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("SCORE", rx, ry);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#00f0ff";
      ctx.fillText(player.score.toString().padStart(7, "0"), rx, ry + 22);
      ctx.fillStyle = "#00ffc4";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(stageManager.stageConfig.bossName, rx, ry + 40);
      ctx.restore();
    }
    drawBossHealthBar(ctx, boss) {
      const cx = 480;
      const cy = 492;
      const bw = 380;
      const bh = 18;
      const ratio = Math.max(0, boss.hp / boss.maxHp);
      ctx.save();
      ctx.fillStyle = "rgba(10, 8, 22, 0.88)";
      ctx.strokeStyle = "#ff2255";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(255, 34, 85, 0.5)";
      ctx.strokeRect(cx - bw / 2 - 14, cy - 22, bw + 28, bh + 30);
      ctx.fillRect(cx - bw / 2 - 14, cy - 22, bw + 28, bh + 30);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff2255";
      ctx.font = "bold 13px sans-serif";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff0033";
      ctx.fillText(`\u2620 CHEFE: ${boss.name.toUpperCase()} - ${boss.title}`, cx, cy - 6);
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.strokeStyle = "#ff4477";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - bw / 2 - 1, cy - 1, bw + 2, bh + 2);
      ctx.fillRect(cx - bw / 2, cy, bw, bh);
      const bossGrad = ctx.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
      bossGrad.addColorStop(0, "#ff0055");
      bossGrad.addColorStop(0.5, "#ff6600");
      bossGrad.addColorStop(1, "#ffd700");
      ctx.fillStyle = bossGrad;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ff3300";
      ctx.fillRect(cx - bw / 2, cy, bw * ratio, bh);
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.fillRect(cx - bw / 2, cy, bw * ratio, bh / 2);
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#000";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, cx, cy + 13);
      ctx.restore();
    }
    drawGoPrompt(ctx, isPortalOpen = false) {
      const pulse = Math.sin(Date.now() * 0.012) * 10;
      const arrowX = 835 + pulse;
      const arrowY = 270;
      ctx.save();
      ctx.fillStyle = "rgba(10, 8, 22, 0.9)";
      ctx.strokeStyle = isPortalOpen ? "#00ffc4" : "#ffe600";
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = isPortalOpen ? "#00ffc4" : "#ffe600";
      ctx.fillRect(arrowX - 110, arrowY - 32, 210, 64);
      ctx.strokeRect(arrowX - 110, arrowY - 32, 210, 64);
      ctx.textAlign = "center";
      ctx.fillStyle = isPortalOpen ? "#00ffc4" : "#ffe600";
      ctx.font = "900 24px sans-serif";
      ctx.fillText("GO!  \u25BA\u25BA", arrowX - 5, arrowY);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#000";
      ctx.fillText(isPortalOpen ? "PORTAL ABERTO! ENTRE!" : "AVANCE PELA RUA!", arrowX - 5, arrowY + 20);
      ctx.restore();
    }
    drawCenterBanner(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 210, 960, 120);
      ctx.textAlign = "center";
      ctx.fillStyle = this.bannerColor;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.bannerColor;
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(this.bannerText, 480, 265);
      if (this.bannerSubtext) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px sans-serif";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#000";
        ctx.fillText(this.bannerSubtext, 480, 305);
      }
      ctx.restore();
    }
  };

  // js/ui/characterSelect.js
  var CharacterSelect = class {
    constructor(onSelectCallback) {
      this.onSelect = onSelectCallback;
      this.charKeys = ["andrey", "emerson", "nata", "unicao"];
      this.selectedIndex = 0;
      this.keyboardBound = false;
    }
    setupDOM() {
      const container = document.getElementById("char-select-grid");
      if (!container) return;
      container.innerHTML = "";
      this.charKeys.forEach((key, index) => {
        const char = PLAYABLE_CHARACTERS[key];
        const card = document.createElement("div");
        card.className = `char-card ${index === this.selectedIndex ? "selected" : ""}`;
        card.id = `card-${key}`;
        card.innerHTML = `
        <div class="card-glow"></div>
        <div class="nav-cursor-badge">\u25C0 [A / W] SELECIONADO [S / D] \u25B6</div>
        <div class="card-portrait-wrapper">
          <img src="${char.portrait}" alt="${char.name}" class="char-portrait-img">
          <span class="char-badge">${char.title}</span>
        </div>
        <div class="card-info">
          <h3 class="char-name">${char.name}</h3>
          <p class="char-desc">${char.description}</p>
          <div class="stat-bars">
            <div class="stat-row">
              <span>FOR\xC7A</span>
              <div class="bar-bg"><div class="bar-fill" style="width: ${char.stats.power}%;"></div></div>
            </div>
            <div class="stat-row">
              <span>AGILIDADE</span>
              <div class="bar-bg"><div class="bar-fill" style="width: ${char.stats.speed}%;"></div></div>
            </div>
            <div class="stat-row">
              <span>DEFESA</span>
              <div class="bar-bg"><div class="bar-fill" style="width: ${char.stats.defense}%;"></div></div>
            </div>
            <div class="stat-row">
              <span>ESPECIAL</span>
              <div class="bar-bg"><div class="bar-fill sp-fill" style="width: ${char.stats.special}%;"></div></div>
            </div>
          </div>
          <button type="button" class="select-btn">JOGAR COM ${char.name} \u2794</button>
        </div>
      `;
        const btn = card.querySelector(".select-btn");
        if (btn) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.selectIndex(index);
            this.confirmSelection();
          });
        }
        card.addEventListener("click", () => {
          this.selectIndex(index);
          this.confirmSelection();
        });
        card.addEventListener("mouseenter", () => {
          if (this.selectedIndex !== index) {
            this.selectIndex(index);
            Sound.playTone(320, 520, 0.06, "triangle", 0.2);
          }
        });
        container.appendChild(card);
      });
      const startBtn = document.getElementById("btn-confirm-char");
      if (startBtn) {
        startBtn.onclick = () => this.confirmSelection();
      }
      this.selectIndex(this.selectedIndex);
      if (!this.keyboardBound) {
        this.keyboardBound = true;
        window.addEventListener("keydown", (e) => {
          const selectScreen = document.getElementById("char-select-screen");
          if (selectScreen && !selectScreen.classList.contains("hidden")) {
            const key = (e.key || "").toLowerCase();
            const code = e.code || "";
            if (key === "a" || code === "KeyA" || key === "arrowleft" || code === "ArrowLeft") {
              e.preventDefault();
              this.navigate(-1);
            } else if (key === "d" || code === "KeyD" || key === "arrowright" || code === "ArrowRight") {
              e.preventDefault();
              this.navigate(1);
            } else if (key === "w" || code === "KeyW" || key === "arrowup" || code === "ArrowUp") {
              e.preventDefault();
              this.navigate(-1);
            } else if (key === "s" || code === "KeyS" || key === "arrowdown" || code === "ArrowDown") {
              e.preventDefault();
              this.navigate(1);
            } else if (key === "enter" || key === " " || key === "j" || key === "z" || code === "KeyJ" || code === "KeyZ") {
              e.preventDefault();
              this.confirmSelection();
            }
          }
        });
      }
    }
    selectIndex(index) {
      this.selectedIndex = (index + this.charKeys.length) % this.charKeys.length;
      document.querySelectorAll(".char-card").forEach((el, i) => {
        el.classList.toggle("selected", i === this.selectedIndex);
      });
      const startBtn = document.getElementById("btn-confirm-char");
      if (startBtn) {
        const char = PLAYABLE_CHARACTERS[this.charKeys[this.selectedIndex]];
        startBtn.innerHTML = `JOGAR COM <strong>${char.name}</strong> \u2794 [ENTER / J]`;
      }
    }
    navigate(dir) {
      this.selectIndex(this.selectedIndex + dir);
      Sound.init();
      Sound.playTone(320, 560, 0.07, "triangle", 0.25);
    }
    confirmSelection() {
      const selectedKey = this.charKeys[this.selectedIndex];
      Sound.init();
      Sound.playSpecial();
      if (this.onSelect) {
        this.onSelect(selectedKey);
      }
    }
  };

  // js/main.js
  var Game = class {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");
      this.width = 960;
      this.height = 540;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.camera = new Camera(this.width, this.height);
      this.imageLoader = new ImageLoader();
      this.stageRenderer = new StageRenderer(this.width, this.height);
      this.stageManager = new StageManager(this);
      this.hud = new HUD();
      this.player = null;
      this.selectedCharKey = "andrey";
      this.state = "loading";
      this.lastTime = performance.now();
      this.continueTimer = 9.99;
      this.lastCountdownSec = 10;
      this.characterSelectUI = new CharacterSelect((charKey) => {
        this.selectedCharKey = charKey;
        this.startStage(0);
      });
      this.initViewportScale();
      this.init();
    }
    // Ensure game scales responsively to browser window without overflowing
    initViewportScale() {
      const container = document.getElementById("game-container");
      const resize = () => {
        const windowW = window.innerWidth;
        const windowH = window.innerHeight;
        const targetAspect = 16 / 9;
        const currentAspect = windowW / windowH;
        let finalW, finalH;
        if (currentAspect > targetAspect) {
          finalH = Math.min(windowH - 10, windowH * 0.98);
          finalW = finalH * targetAspect;
        } else {
          finalW = Math.min(windowW - 10, windowW * 0.98);
          finalH = finalW / targetAspect;
        }
        container.style.width = `${Math.floor(finalW)}px`;
        container.style.height = `${Math.floor(finalH)}px`;
      };
      window.addEventListener("resize", resize);
      resize();
    }
    async init() {
      this.characterSelectUI.setupDOM();
      this.bindDomEvents();
      let finishedLoading = false;
      const finish = () => {
        if (finishedLoading) return;
        finishedLoading = true;
        this.switchScreen("title-screen");
        this.state = "title";
      };
      const loadingScreen = document.getElementById("loading-screen");
      if (loadingScreen) {
        loadingScreen.addEventListener("click", finish);
        loadingScreen.style.cursor = "pointer";
      }
      const skipBtn = document.getElementById("btn-skip-loading");
      if (skipBtn) {
        skipBtn.addEventListener("click", finish);
      }
      setTimeout(finish, 800);
      const progressFill = document.getElementById("loading-bar-fill");
      try {
        await this.imageLoader.preloadCore((progress) => {
          if (progressFill) {
            progressFill.style.width = `${Math.floor(progress * 100)}%`;
          }
        });
      } catch (e) {
        console.warn("Preload notice:", e);
      }
      setTimeout(finish, 150);
      requestAnimationFrame((t) => this.gameLoop(t));
    }
    bindDomEvents() {
      const startBtn = document.getElementById("btn-play-game");
      if (startBtn) {
        startBtn.onclick = () => {
          Sound.init();
          Sound.playKick();
          this.switchScreen("char-select-screen");
          this.state = "select";
        };
      }
      const btnResume = document.getElementById("pause-opt-resume");
      if (btnResume) btnResume.onclick = () => this.resumeGame();
      const btnRestart = document.getElementById("pause-opt-restart");
      if (btnRestart) btnRestart.onclick = () => {
        this.state = "playing";
        this.startStage(this.stageManager.currentStageIndex);
      };
      const btnTitle = document.getElementById("pause-opt-title");
      if (btnTitle) btnTitle.onclick = () => {
        Sound.stopBgm();
        this.switchScreen("title-screen");
        this.state = "title";
      };
      const btnContinue = document.getElementById("btn-do-continue");
      if (btnContinue) btnContinue.onclick = () => this.doContinue();
      const btnGiveUp = document.getElementById("btn-give-up");
      if (btnGiveUp) btnGiveUp.onclick = () => this.giveUpContinue();
      window.addEventListener("keydown", (e) => {
        const key = (e.key || "").toLowerCase();
        const code = e.code || "";
        const isConfirm = key === "enter" || key === " " || key === "j" || key === "z" || code === "KeyJ" || code === "KeyZ" || code === "Space" || code === "Enter";
        if (this.state === "title") {
          if (isConfirm || key === "w" || key === "a" || key === "s" || key === "d") {
            if (startBtn) startBtn.click();
          }
        } else if (this.state === "continue") {
          if (isConfirm || key === "w" || key === "a" || key === "s" || key === "d") {
            this.doContinue();
          } else if (key === "escape") {
            this.giveUpContinue();
          }
        } else if (this.state === "stage_clear") {
          if (isConfirm || key === "w" || key === "a" || key === "s" || key === "d") {
            const nextBtn = document.getElementById("btn-next-stage");
            if (nextBtn) nextBtn.click();
          }
        } else if (this.state === "game_over") {
          if (isConfirm || key === "w" || key === "a" || key === "s" || key === "d") {
            const retryBtn2 = document.getElementById("btn-retry-game");
            if (retryBtn2) retryBtn2.click();
          }
        } else if (this.state === "victory") {
          if (isConfirm || key === "w" || key === "a" || key === "s" || key === "d") {
            const victoryBtn = document.getElementById("btn-victory-restart");
            if (victoryBtn) victoryBtn.click();
          }
        } else if (this.state === "playing") {
          if (key === "p" || key === "escape") {
            this.pauseGame();
          }
        } else if (this.state === "paused") {
          if (key === "w" || code === "KeyW" || key === "arrowup" || code === "ArrowUp") {
            this.navigatePause(-1);
          } else if (key === "s" || code === "KeyS" || key === "arrowdown" || code === "ArrowDown") {
            this.navigatePause(1);
          } else if (key === "a" || code === "KeyA" || key === "arrowleft" || code === "ArrowLeft") {
            this.navigatePause(-1);
          } else if (key === "d" || code === "KeyD" || key === "arrowright" || code === "ArrowRight") {
            this.navigatePause(1);
          } else if (isConfirm) {
            this.confirmPauseOption();
          } else if (key === "p" || key === "escape") {
            this.resumeGame();
          }
        }
      });
      const nextStageBtn = document.getElementById("btn-next-stage");
      if (nextStageBtn) {
        nextStageBtn.onclick = () => {
          Sound.playSpecial();
          const hasNext = this.stageManager.advanceToNextStage();
          if (hasNext) {
            this.switchScreen("hud-overlay");
            this.state = "playing";
            this.hud.showBanner(`FASE ${this.stageManager.stageConfig.number}`, this.stageManager.stageConfig.subtitle, 2.5);
          } else {
            this.switchScreen("victory-screen");
            this.state = "victory";
            Sound.playVictory();
          }
        };
      }
      const retryBtn = document.getElementById("btn-retry-game");
      if (retryBtn) {
        retryBtn.onclick = () => {
          this.startStage(0);
        };
      }
      const victoryPlayAgain = document.getElementById("btn-victory-restart");
      if (victoryPlayAgain) {
        victoryPlayAgain.onclick = () => {
          this.switchScreen("title-screen");
          this.state = "title";
        };
      }
      const muteBtn = document.getElementById("btn-toggle-sound");
      if (muteBtn) {
        muteBtn.onclick = () => {
          const isMuted = Sound.toggleMute();
          muteBtn.innerText = isMuted ? "\u{1F507} MUDO" : "\u{1F50A} SOM";
        };
      }
    }
    pauseGame() {
      this.state = "paused";
      this.switchScreen("pause-screen");
      this.pauseIndex = 0;
      this.updatePauseUI();
      Sound.init();
      Sound.playKick();
    }
    resumeGame() {
      this.switchScreen("hud-overlay");
      this.state = "playing";
      Sound.init();
      Sound.playPunch();
    }
    navigatePause(dir) {
      const total = 3;
      this.pauseIndex = (this.pauseIndex + dir + total) % total;
      this.updatePauseUI();
      Sound.init();
      Sound.playTone(320, 520, 0.06, "triangle", 0.2);
    }
    updatePauseUI() {
      const ids = ["pause-opt-resume", "pause-opt-restart", "pause-opt-title"];
      ids.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("selected", idx === (this.pauseIndex || 0));
      });
    }
    confirmPauseOption() {
      Sound.init();
      Sound.playSpecial();
      if (this.pauseIndex === 0) {
        this.resumeGame();
      } else if (this.pauseIndex === 1) {
        this.state = "playing";
        this.startStage(this.stageManager.currentStageIndex);
      } else if (this.pauseIndex === 2) {
        Sound.stopBgm();
        this.switchScreen("title-screen");
        this.state = "title";
      }
    }
    startContinueCountdown() {
      this.state = "continue";
      this.continueTimer = 9.99;
      this.lastCountdownSec = 10;
      this.switchScreen("continue-screen");
      Sound.stopBgm();
      Sound.playGameOver();
      this.renderContinueUI();
    }
    updateContinue(dt) {
      this.continueTimer -= dt;
      this.renderContinueUI();
      if (this.continueTimer <= 0) {
        this.giveUpContinue();
      }
    }
    renderContinueUI() {
      const sec = Math.max(0, Math.ceil(this.continueTimer));
      const numEl = document.getElementById("continue-countdown-number");
      if (numEl) numEl.innerText = sec;
      const btnEl = document.getElementById("btn-do-continue");
      if (btnEl) btnEl.innerText = `CONTINUAR (${sec}) [W A S D / ENTER]`;
      if (sec !== this.lastCountdownSec) {
        this.lastCountdownSec = sec;
        Sound.init();
        Sound.playTone(520, 360, 0.08, "square", 0.22);
      }
    }
    doContinue() {
      if (this.state !== "continue") return;
      this.state = "playing";
      this.switchScreen("hud-overlay");
      this.player.lives = 3;
      this.player.respawn(this.camera.x + 120, 430);
      Sound.init();
      Sound.playSpecial();
      Sound.startBgm(this.stageManager.stageConfig.number, this.stageManager.phase === "boss_battle");
      this.hud.showBanner("CONTINUOU!", "3 VIDAS RESTAURADAS \u2022 INVENC\xCDVEL POR 2s", 2.2, "#00ffc4");
    }
    giveUpContinue() {
      this.state = "game_over";
      this.switchScreen("game-over-screen");
      Sound.playGameOver();
    }
    switchScreen(activeScreenId) {
      const screens = [
        "loading-screen",
        "title-screen",
        "char-select-screen",
        "hud-overlay",
        "pause-screen",
        "continue-screen",
        "stage-clear-screen",
        "game-over-screen",
        "victory-screen"
      ];
      screens.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          if (id === activeScreenId || activeScreenId === "hud-overlay" && id === "hud-overlay") {
            el.classList.remove("hidden");
          } else {
            el.classList.add("hidden");
          }
        }
      });
    }
    startStage(stageIndex) {
      this.player = new Player(120, 430, this.selectedCharKey);
      this.camera.follow(this.player);
      this.stageManager.loadStage(stageIndex);
      this.switchScreen("hud-overlay");
      this.state = "playing";
      this.hud.showBanner(
        `FASE ${this.stageManager.stageConfig.number}: ${this.stageManager.stageConfig.name}`,
        `CHEFE A CAMINHO: ${this.stageManager.stageConfig.bossName}`,
        2.8
      );
    }
    gameLoop(currentTime) {
      const dt = Math.min((currentTime - this.lastTime) / 1e3, 0.1);
      this.lastTime = currentTime;
      if (this.state === "playing") {
        this.update(dt);
      } else if (this.state === "continue") {
        this.updateContinue(dt);
      }
      this.render();
      Input.clearJustPressed();
      requestAnimationFrame((t) => this.gameLoop(t));
    }
    update(dt) {
      if (Input.isActionPressed("pause")) {
        this.pauseGame();
        return;
      }
      if (this.player) {
        this.player.handleInput(Input);
        this.player.update(dt, this.stageManager.stageLimits, this.camera);
        if (this.player.isDead && this.player.y === 0) {
          this.player.deathTime = (this.player.deathTime || 0) + dt;
          if (this.player.deathTime > 1) {
            this.player.deathTime = 0;
            if (this.player.lives > 1) {
              this.player.lives--;
              this.player.respawn(this.camera.x + 120, 430);
              this.hud.showBanner("RETORNANDO!", `${this.player.lives} VIDAS RESTANTES \u2022 INVENC\xCDVEL POR 2s`, 2, "#ffd700");
              Sound.playJump();
            } else {
              this.player.lives = 0;
              this.startContinueCountdown();
              return;
            }
          }
        }
      }
      this.stageManager.update(dt);
      this.camera.update(dt);
      this.resolveCombatCollisions();
      if (this.stageManager.phase === "stage_cleared" && this.stageManager.clearTimer >= 2.5) {
        this.showStageClearScreen();
      }
      this.hud.update(dt);
    }
    resolveCombatCollisions() {
      const player = this.player;
      if (!player || player.isDead) return;
      const playerHitbox = player.getAttackHitbox();
      if (playerHitbox) {
        for (const enemy of this.stageManager.enemies) {
          if (!enemy.isDead && !player.hitEntities.has(enemy)) {
            if (this.check2DOverlap(playerHitbox, enemy)) {
              player.hitEntities.add(enemy);
              const tookDamage = enemy.takeDamage(
                playerHitbox.damage,
                playerHitbox.knockbackX,
                playerHitbox.knockbackY
              );
              if (tookDamage) {
                this.stageManager.particles.addHitSparks(enemy.x, enemy.y + 40, enemy.z, "#ffe600", 10);
                this.stageManager.particles.addFloatingText(`-${Math.floor(playerHitbox.damage)}`, enemy.x, enemy.y + 70, enemy.z, "#ffea00");
                player.addScore(150);
                this.camera.shake(5, 0.15);
              }
            }
          }
        }
        const boss2 = this.stageManager.boss;
        if (boss2 && !boss2.isDead && !player.hitEntities.has(boss2)) {
          if (this.check2DOverlap(playerHitbox, boss2)) {
            player.hitEntities.add(boss2);
            const tookDamage = boss2.takeDamage(
              playerHitbox.damage,
              playerHitbox.knockbackX,
              playerHitbox.knockbackY
            );
            if (tookDamage) {
              this.stageManager.particles.addHitSparks(boss2.x, boss2.y + 50, boss2.z, "#ff2255", 14);
              this.stageManager.particles.addFloatingText(`-${Math.floor(playerHitbox.damage)}`, boss2.x, boss2.y + 90, boss2.z, "#ff3366");
              player.addScore(250);
              this.camera.shake(7, 0.2);
            }
          }
        }
      }
      for (const enemy of this.stageManager.enemies) {
        if (!enemy.isDead) {
          const enemyHitbox = enemy.getAttackHitbox();
          if (enemyHitbox && !enemy.hitPlayer) {
            if (this.check2DOverlap(enemyHitbox, player)) {
              enemy.hitPlayer = true;
              const tookHit = player.takeDamage(enemyHitbox.damage, enemyHitbox.knockbackX, enemyHitbox.knockbackY);
              if (tookHit) {
                this.stageManager.particles.addHitSparks(player.x, player.y + 40, player.z, "#ff3333", 8);
                this.stageManager.particles.addFloatingText(`-${Math.floor(enemyHitbox.damage)}`, player.x, player.y + 60, player.z, "#ff4444");
                this.camera.shake(6, 0.2);
              }
            }
          }
        }
      }
      const boss = this.stageManager.boss;
      if (boss && !boss.isDead) {
        const bossHitbox = boss.getAttackHitbox();
        if (bossHitbox && !boss.hitPlayerThisSwing) {
          if (this.check2DOverlap(bossHitbox, player)) {
            boss.hitPlayerThisSwing = true;
            const tookHit = player.takeDamage(bossHitbox.damage, bossHitbox.knockbackX, bossHitbox.knockbackY);
            if (tookHit) {
              this.stageManager.particles.addHitSparks(player.x, player.y + 45, player.z, "#ff0055", 12);
              this.stageManager.particles.addFloatingText(`-${Math.floor(bossHitbox.damage)}`, player.x, player.y + 70, player.z, "#ff2222");
              this.camera.shake(9, 0.3);
            }
          }
        }
        for (const p of boss.projectiles) {
          if (!p.isDead) {
            const dx = Math.abs(player.x - p.x);
            const dz = Math.abs(player.z - p.z);
            const dy = Math.abs(player.y - p.y);
            if (dx < 35 && dz < 25 && dy < 40) {
              p.isDead = true;
              player.takeDamage(24, Math.sign(p.vx || 1) * 6, 5);
              this.stageManager.particles.addHitSparks(player.x, player.y + 40, player.z, "#ff6600", 12);
              this.camera.shake(8, 0.25);
            }
          }
        }
      }
    }
    // Check 2.5D proximity overlap
    check2DOverlap(hitbox, target) {
      const dx = Math.abs(hitbox.x - target.x);
      const dz = Math.abs(hitbox.z - target.z);
      const dy = Math.abs(hitbox.y - target.y);
      return dx < hitbox.width && dz < hitbox.depth && dy < hitbox.height;
    }
    showStageClearScreen() {
      this.state = "stage_clear";
      this.switchScreen("stage-clear-screen");
      const titleEl = document.getElementById("clear-stage-title");
      const bossEl = document.getElementById("clear-boss-defeated");
      const scoreEl = document.getElementById("clear-score-val");
      if (titleEl) titleEl.innerText = `${this.stageManager.stageConfig.name} CONCLU\xCDDA!`;
      if (bossEl) bossEl.innerText = `O Chefe ${this.stageManager.stageConfig.bossName} foi derrotado!`;
      if (scoreEl && this.player) scoreEl.innerText = this.player.score.toString();
    }
    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      if (this.state === "playing" || this.state === "stage_clear") {
        const isBossArena = this.stageManager.phase === "boss_battle" || this.stageManager.phase === "stage_cleared";
        this.stageRenderer.draw(this.ctx, this.stageManager.stageConfig, this.camera, isBossArena, this.imageLoader);
        this.stageManager.drawEntities(this.ctx, this.camera, this.imageLoader);
        this.hud.draw(this.ctx, this.player, this.stageManager, this.imageLoader);
      }
    }
  };
  function bootGame() {
    if (!window.GameInstance) {
      window.GameInstance = new Game();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootGame);
  } else {
    bootGame();
  }
})();
