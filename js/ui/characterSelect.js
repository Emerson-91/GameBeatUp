import { PLAYABLE_CHARACTERS } from '../data/charactersData.js';
import { Sound } from '../core/audio.js';

export class CharacterSelect {
  constructor(onSelectCallback, onBackCallback) {
    this.onSelect = onSelectCallback;
    this.onBack = onBackCallback;
    this.charKeys = ['andrey', 'emerson', 'nata', 'unicao'];
    this.selectedIndex = 0;
    this.keyboardBound = false;

    // Archetype and theme data
    this.charThemes = {
      andrey: {
        themeClass: 'theme-andrey',
        styleTag: 'PLASMA & TECH',
        rank: 'S',
        color: '#00f0ff',
        spriteSrc: 'assets/images/sprites/characters/andrey_idle.png',
        sound: () => Sound.playTone(420, 680, 0.08, 'sine', 0.25)
      },
      emerson: {
        themeClass: 'theme-emerson',
        styleTag: 'FORÇA TITÂNICA',
        rank: 'S',
        color: '#ffb700',
        spriteSrc: 'assets/images/sprites/characters/emerson_idle.png',
        sound: () => Sound.playTone(130, 240, 0.12, 'sawtooth', 0.28)
      },
      nata: {
        themeClass: 'theme-nata',
        styleTag: 'VELOCIDADE & ROCK',
        rank: 'S',
        color: '#ff0077',
        spriteSrc: 'assets/images/sprites/characters/nata_idle.png',
        sound: () => Sound.playTone(340, 580, 0.09, 'triangle', 0.26)
      },
      unicao: {
        themeClass: 'theme-unicao',
        styleTag: 'LENDA CANINA',
        rank: 'S',
        color: '#00ffaa',
        spriteSrc: 'assets/images/sprites/characters/dog_idle.png',
        sound: () => Sound.playTone(400, 720, 0.08, 'square', 0.2)
      }
    };
  }

  selectKey(key) {
    const idx = this.charKeys.indexOf(key);
    if (idx !== -1) {
      this.selectIndex(idx);
    }
  }

  setupDOM() {
    const container = document.getElementById('char-select-grid');
    if (!container) return;
    container.innerHTML = '';

    this.charKeys.forEach((key, index) => {
      const char = PLAYABLE_CHARACTERS[key];
      const theme = this.charThemes[key] || {
        themeClass: 'theme-default',
        styleTag: 'LUTADOR',
        rank: 'A',
        color: '#00f0ff',
        spriteSrc: '',
        sound: () => Sound.playTone(300, 500, 0.06, 'triangle', 0.2)
      };

      const card = document.createElement('div');
      card.className = `char-card ${theme.themeClass} ${index === this.selectedIndex ? 'selected' : ''}`;
      card.id = `card-${key}`;

      card.innerHTML = `
        <div class="card-glow"></div>
        <div class="card-1p-badge">
          <span class="p1-icon">★ 1P</span>
          <span class="p1-text">SELECIONADO</span>
        </div>

        <div class="card-media-combo">
          <div class="card-portrait-wrapper">
            <img src="${char.portrait}" alt="${char.name}" class="char-portrait-img">
            <div class="portrait-overlay"></div>
          </div>
          <div class="card-sprite-preview">
            <img src="${theme.spriteSrc}" alt="${char.name} sprite" class="fighter-idle-sprite">
            <div class="fighter-ground-shadow"></div>
          </div>
          <div class="card-top-tags">
            <span class="char-archetype-tag" style="border-color: ${theme.color}; color: ${theme.color};">${theme.styleTag}</span>
            <span class="char-rank-badge" style="background: ${theme.color};">RANK ${theme.rank}</span>
          </div>
        </div>

        <div class="card-info">
          <div class="card-header-row">
            <h3 class="char-name" style="color: ${theme.color};">${char.name}</h3>
            <span class="char-title-small">${char.title}</span>
          </div>

          <p class="char-desc">${char.description}</p>

          <div class="char-special-box" style="border-color: ${theme.color}66;">
            <span class="sp-icon">⚡</span>
            <span class="sp-name" style="color: ${theme.color};" title="${char.specialName}">${char.specialName}</span>
          </div>

          <div class="stat-bars">
            <div class="stat-row">
              <span class="stat-lbl">FORÇA</span>
              <div class="bar-bg"><div class="bar-fill bar-power" style="width: ${char.stats.power}%;"></div></div>
              <span class="stat-val">${char.stats.power}</span>
            </div>
            <div class="stat-row">
              <span class="stat-lbl">AGILIDADE</span>
              <div class="bar-bg"><div class="bar-fill bar-speed" style="width: ${char.stats.speed}%;"></div></div>
              <span class="stat-val">${char.stats.speed}</span>
            </div>
            <div class="stat-row">
              <span class="stat-lbl">DEFESA</span>
              <div class="bar-bg"><div class="bar-fill bar-defense" style="width: ${char.stats.defense}%;"></div></div>
              <span class="stat-val">${char.stats.defense}</span>
            </div>
            <div class="stat-row">
              <span class="stat-lbl">ESPECIAL</span>
              <div class="bar-bg"><div class="bar-fill bar-special" style="width: ${char.stats.special}%;"></div></div>
              <span class="stat-val">${char.stats.special}</span>
            </div>
          </div>

          <button type="button" class="select-btn" style="border-color: ${theme.color};">
            ESCOLHER ${char.name} ➔
          </button>
        </div>
      `;

      const btn = card.querySelector('.select-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectIndex(index);
          this.confirmSelection();
        });
      }

      card.addEventListener('click', () => {
        this.selectIndex(index);
        this.confirmSelection();
      });

      card.addEventListener('mouseenter', () => {
        if (this.selectedIndex !== index) {
          this.selectIndex(index);
          if (theme.sound) theme.sound();
          else Sound.playTone(320, 520, 0.06, 'triangle', 0.2);
        }
      });

      container.appendChild(card);
    });

    const startBtn = document.getElementById('btn-confirm-char');
    if (startBtn) {
      startBtn.onclick = () => this.confirmSelection();
    }

    const backBtn = document.getElementById('btn-back-to-title');
    if (backBtn) {
      backBtn.onclick = () => {
        Sound.playTone(260, 180, 0.08, 'sawtooth', 0.2);
        if (this.onBack) this.onBack();
      };
    }

    this.selectIndex(this.selectedIndex);

    // Bind WASD and Arrow Keys to navigate character menu seamlessly
    if (!this.keyboardBound) {
      this.keyboardBound = true;
      window.addEventListener('keydown', (e) => {
        const selectScreen = document.getElementById('char-select-screen');
        if (selectScreen && !selectScreen.classList.contains('hidden')) {
          const key = (e.key || '').toLowerCase();
          const code = e.code || '';

          // Escape -> Return to Title
          if (key === 'escape' || code === 'Escape') {
            e.preventDefault();
            if (this.onBack) {
              Sound.playTone(260, 180, 0.08, 'sawtooth', 0.2);
              this.onBack();
            }
          }
          // A or Left Arrow -> previous character
          else if (key === 'a' || code === 'KeyA' || key === 'arrowleft' || code === 'ArrowLeft') {
            e.preventDefault();
            this.navigate(-1);
          }
          // D or Right Arrow -> next character
          else if (key === 'd' || code === 'KeyD' || key === 'arrowright' || code === 'ArrowRight') {
            e.preventDefault();
            this.navigate(1);
          }
          // W or Up Arrow
          else if (key === 'w' || code === 'KeyW' || key === 'arrowup' || code === 'ArrowUp') {
            e.preventDefault();
            this.navigate(-1);
          }
          // S or Down Arrow
          else if (key === 's' || code === 'KeyS' || key === 'arrowdown' || code === 'ArrowDown') {
            e.preventDefault();
            this.navigate(1);
          }
          // Enter, Space, J, Z to confirm selection and start game
          else if (key === 'enter' || key === ' ' || key === 'j' || key === 'z' || code === 'KeyJ' || code === 'KeyZ') {
            e.preventDefault();
            this.confirmSelection();
          }
        }
      });
    }
  }

  selectIndex(index) {
    this.selectedIndex = (index + this.charKeys.length) % this.charKeys.length;
    document.querySelectorAll('.char-card').forEach((el, i) => {
      el.classList.toggle('selected', i === this.selectedIndex);
    });

    const startBtn = document.getElementById('btn-confirm-char');
    if (startBtn) {
      const char = PLAYABLE_CHARACTERS[this.charKeys[this.selectedIndex]];
      const theme = this.charThemes[this.charKeys[this.selectedIndex]];
      startBtn.innerHTML = `<span class="btn-shine"></span>JOGAR COM <strong style="color: ${theme ? theme.color : '#00f0ff'};">${char.name}</strong> ➔ [ENTER / J]`;
    }
  }

  navigate(dir) {
    this.selectIndex(this.selectedIndex + dir);
    Sound.init();
    const theme = this.charThemes[this.charKeys[this.selectedIndex]];
    if (theme && theme.sound) theme.sound();
    else Sound.playTone(320, 560, 0.07, 'triangle', 0.25);
  }

  confirmSelection() {
    const selectedKey = this.charKeys[this.selectedIndex];
    Sound.init();
    Sound.playSpecial();
    if (this.onSelect) {
      this.onSelect(selectedKey);
    }
  }
}
