class InputHandler {
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

    // Track just-pressed states for menu navigation & actions
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
    window.addEventListener('keydown', (e) => {
      this.handleKey(e, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKey(e, false);
    });
  }

  handleKey(e, isDown) {
    const code = e.code || '';
    const key = (e.key || '').toLowerCase();

    // Prevent default browser scrolling/actions for game control keys
    const preventKeys = [
      'keyw', 'keys', 'keya', 'keyd',
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
      'space'
    ];
    if (preventKeys.includes(code.toLowerCase()) || ['w', 's', 'a', 'd', ' '].includes(key)) {
      if (e.target && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
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

    // W / Up Arrow
    if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
      setAction('up', isDown);
    }
    // S / Down Arrow
    if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
      setAction('down', isDown);
    }
    // A / Left Arrow
    if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
      setAction('left', isDown);
    }
    // D / Right Arrow
    if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
      setAction('right', isDown);
    }

    // J / Z (Punch / Confirm in menus)
    if (code === 'KeyJ' || code === 'KeyZ' || key === 'j' || key === 'z') {
      setAction('punch', isDown);
    }
    // K / X (Kick)
    if (code === 'KeyK' || code === 'KeyX' || key === 'k' || key === 'x') {
      setAction('kick', isDown);
    }
    // Space (Jump)
    if (code === 'Space' || key === ' ') {
      setAction('jump', isDown);
    }
    // L / C (Special)
    if (code === 'KeyL' || code === 'KeyC' || key === 'l' || key === 'c') {
      setAction('special', isDown);
    }
    // Enter (Confirm)
    if (code === 'Enter' || key === 'enter') {
      setAction('confirm', isDown);
    }
    // P / Escape (Pause)
    if (code === 'KeyP' || code === 'Escape' || key === 'p' || key === 'escape') {
      setAction('pause', isDown);
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
          btn.classList.add('active');
        };
        const end = (e) => {
          e.preventDefault();
          this.keys[keyName] = false;
          btn.classList.remove('active');
        };
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', end, { passive: false });
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
      };

      bindBtn('btn-up', 'up');
      bindBtn('btn-down', 'down');
      bindBtn('btn-left', 'left');
      bindBtn('btn-right', 'right');
      bindBtn('btn-punch', 'punch');
      bindBtn('btn-kick', 'kick');
      bindBtn('btn-jump', 'jump');
      bindBtn('btn-special', 'special');
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindAll);
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
}

export const Input = new InputHandler();
