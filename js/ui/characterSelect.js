import { PLAYABLE_CHARACTERS } from '../data/charactersData.js';
import { Sound } from '../core/audio.js';

export class CharacterSelect {
  constructor(onSelectCallback) {
    this.onSelect = onSelectCallback;
    this.charKeys = ['andrey', 'emerson', 'nata', 'unicao'];
    this.selectedIndex = 0;
    this.keyboardBound = false;
  }

  setupDOM() {
    const container = document.getElementById('char-select-grid');
    if (!container) return;
    container.innerHTML = '';

    this.charKeys.forEach((key, index) => {
      const char = PLAYABLE_CHARACTERS[key];
      const card = document.createElement('div');
      card.className = `char-card ${index === this.selectedIndex ? 'selected' : ''}`;
      card.id = `card-${key}`;

      card.innerHTML = `
        <div class="card-glow"></div>
        <div class="nav-cursor-badge">◀ [A / W] SELECIONADO [S / D] ▶</div>
        <div class="card-portrait-wrapper">
          <img src="${char.portrait}" alt="${char.name}" class="char-portrait-img">
          <span class="char-badge">${char.title}</span>
        </div>
        <div class="card-info">
          <h3 class="char-name">${char.name}</h3>
          <p class="char-desc">${char.description}</p>
          <div class="stat-bars">
            <div class="stat-row">
              <span>FORÇA</span>
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
          <button type="button" class="select-btn">JOGAR COM ${char.name} ➔</button>
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
          Sound.playTone(320, 520, 0.06, 'triangle', 0.2);
        }
      });

      container.appendChild(card);
    });

    const startBtn = document.getElementById('btn-confirm-char');
    if (startBtn) {
      startBtn.onclick = () => this.confirmSelection();
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

          // A or Left Arrow -> previous character
          if (key === 'a' || code === 'KeyA' || key === 'arrowleft' || code === 'ArrowLeft') {
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
      startBtn.innerHTML = `JOGAR COM <strong>${char.name}</strong> ➔ [ENTER / J]`;
    }
  }

  navigate(dir) {
    this.selectIndex(this.selectedIndex + dir);
    Sound.init();
    Sound.playTone(320, 560, 0.07, 'triangle', 0.25);
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
