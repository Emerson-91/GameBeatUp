import { Camera } from './core/camera.js';
import { Input } from './core/input.js';
import { Sound } from './core/audio.js';
import { ImageLoader } from './core/imageLoader.js';
import { Player } from './entities/player.js';
import { StageRenderer } from './stages/stageRenderer.js';
import { StageManager } from './stages/stageManager.js';
import { HUD } from './ui/hud.js';
import { CharacterSelect } from './ui/characterSelect.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.width = 960;
    this.height = 540;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Core Systems
    this.camera = new Camera(this.width, this.height);
    this.imageLoader = new ImageLoader();
    this.stageRenderer = new StageRenderer(this.width, this.height);
    this.stageManager = new StageManager(this);
    this.hud = new HUD();

    this.player = null;
    this.selectedCharKey = 'andrey';

    // Game States: 'loading' | 'title' | 'select' | 'playing' | 'paused' | 'continue' | 'stage_clear' | 'game_over' | 'victory'
    this.state = 'loading';
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
    const container = document.getElementById('game-container');
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

    window.addEventListener('resize', resize);
    resize();
  }

  async init() {
    this.characterSelectUI.setupDOM();
    this.bindDomEvents();

    let finishedLoading = false;
    const finish = () => {
      if (finishedLoading) return;
      finishedLoading = true;
      this.switchScreen('title-screen');
      this.state = 'title';
    };

    // Allow user to click anywhere on loading screen to jump straight to title
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.addEventListener('click', finish);
      loadingScreen.style.cursor = 'pointer';
    }
    const skipBtn = document.getElementById('btn-skip-loading');
    if (skipBtn) {
      skipBtn.addEventListener('click', finish);
    }

    // Maximum 800ms on loading screen before forcing title screen
    setTimeout(finish, 800);

    const progressFill = document.getElementById('loading-bar-fill');
    try {
      await this.imageLoader.preloadCore((progress) => {
        if (progressFill) {
          progressFill.style.width = `${Math.floor(progress * 100)}%`;
        }
      });
    } catch (e) {
      console.warn('Preload notice:', e);
    }

    setTimeout(finish, 150);
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  bindDomEvents() {
    const startBtn = document.getElementById('btn-play-game');
    if (startBtn) {
      startBtn.onclick = () => {
        Sound.init();
        Sound.playKick();
        this.switchScreen('char-select-screen');
        this.state = 'select';
      };
    }

    // Pause Menu DOM Buttons
    const btnResume = document.getElementById('pause-opt-resume');
    if (btnResume) btnResume.onclick = () => this.resumeGame();

    const btnRestart = document.getElementById('pause-opt-restart');
    if (btnRestart) btnRestart.onclick = () => {
      this.state = 'playing';
      this.startStage(this.stageManager.currentStageIndex);
    };

    const btnTitle = document.getElementById('pause-opt-title');
    if (btnTitle) btnTitle.onclick = () => {
      Sound.stopBgm();
      this.switchScreen('title-screen');
      this.state = 'title';
    };

    // Continue Screen Buttons
    const btnContinue = document.getElementById('btn-do-continue');
    if (btnContinue) btnContinue.onclick = () => this.doContinue();

    const btnGiveUp = document.getElementById('btn-give-up');
    if (btnGiveUp) btnGiveUp.onclick = () => this.giveUpContinue();

    // Global keyboard navigation for all menu screens
    window.addEventListener('keydown', (e) => {
      const key = (e.key || '').toLowerCase();
      const code = e.code || '';
      const isConfirm = key === 'enter' || key === ' ' || key === 'j' || key === 'z' || code === 'KeyJ' || code === 'KeyZ' || code === 'Space' || code === 'Enter';

      if (this.state === 'title') {
        if (isConfirm || key === 'w' || key === 'a' || key === 's' || key === 'd') {
          if (startBtn) startBtn.click();
        }
      } else if (this.state === 'continue') {
        if (isConfirm || key === 'w' || key === 'a' || key === 's' || key === 'd') {
          this.doContinue();
        } else if (key === 'escape') {
          this.giveUpContinue();
        }
      } else if (this.state === 'stage_clear') {
        if (isConfirm || key === 'w' || key === 'a' || key === 's' || key === 'd') {
          const nextBtn = document.getElementById('btn-next-stage');
          if (nextBtn) nextBtn.click();
        }
      } else if (this.state === 'game_over') {
        if (isConfirm || key === 'w' || key === 'a' || key === 's' || key === 'd') {
          const retryBtn = document.getElementById('btn-retry-game');
          if (retryBtn) retryBtn.click();
        }
      } else if (this.state === 'victory') {
        if (isConfirm || key === 'w' || key === 'a' || key === 's' || key === 'd') {
          const victoryBtn = document.getElementById('btn-victory-restart');
          if (victoryBtn) victoryBtn.click();
        }
      } else if (this.state === 'playing') {
        if (key === 'p' || key === 'escape') {
          this.pauseGame();
        }
      } else if (this.state === 'paused') {
        if (key === 'w' || code === 'KeyW' || key === 'arrowup' || code === 'ArrowUp') {
          this.navigatePause(-1);
        } else if (key === 's' || code === 'KeyS' || key === 'arrowdown' || code === 'ArrowDown') {
          this.navigatePause(1);
        } else if (key === 'a' || code === 'KeyA' || key === 'arrowleft' || code === 'ArrowLeft') {
          this.navigatePause(-1);
        } else if (key === 'd' || code === 'KeyD' || key === 'arrowright' || code === 'ArrowRight') {
          this.navigatePause(1);
        } else if (isConfirm) {
          this.confirmPauseOption();
        } else if (key === 'p' || key === 'escape') {
          this.resumeGame();
        }
      }
    });

    const nextStageBtn = document.getElementById('btn-next-stage');
    if (nextStageBtn) {
      nextStageBtn.onclick = () => {
        Sound.playSpecial();
        const hasNext = this.stageManager.advanceToNextStage();
        if (hasNext) {
          this.switchScreen('hud-overlay');
          this.state = 'playing';
          this.hud.showBanner(`FASE ${this.stageManager.stageConfig.number}`, this.stageManager.stageConfig.subtitle, 2.5);
        } else {
          // Final Victory!
          this.switchScreen('victory-screen');
          this.state = 'victory';
          Sound.playVictory();
        }
      };
    }

    const retryBtn = document.getElementById('btn-retry-game');
    if (retryBtn) {
      retryBtn.onclick = () => {
        this.startStage(0);
      };
    }

    const victoryPlayAgain = document.getElementById('btn-victory-restart');
    if (victoryPlayAgain) {
      victoryPlayAgain.onclick = () => {
        this.switchScreen('title-screen');
        this.state = 'title';
      };
    }

    const muteBtn = document.getElementById('btn-toggle-sound');
    if (muteBtn) {
      muteBtn.onclick = () => {
        const isMuted = Sound.toggleMute();
        muteBtn.innerText = isMuted ? '🔇 MUDO' : '🔊 SOM';
      };
    }
  }

  pauseGame() {
    this.state = 'paused';
    this.switchScreen('pause-screen');
    this.pauseIndex = 0;
    this.updatePauseUI();
    Sound.init();
    Sound.playKick();
  }

  resumeGame() {
    this.switchScreen('hud-overlay');
    this.state = 'playing';
    Sound.init();
    Sound.playPunch();
  }

  navigatePause(dir) {
    const total = 3;
    this.pauseIndex = (this.pauseIndex + dir + total) % total;
    this.updatePauseUI();
    Sound.init();
    Sound.playTone(320, 520, 0.06, 'triangle', 0.2);
  }

  updatePauseUI() {
    const ids = ['pause-opt-resume', 'pause-opt-restart', 'pause-opt-title'];
    ids.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('selected', idx === (this.pauseIndex || 0));
    });
  }

  confirmPauseOption() {
    Sound.init();
    Sound.playSpecial();
    if (this.pauseIndex === 0) {
      this.resumeGame();
    } else if (this.pauseIndex === 1) {
      this.state = 'playing';
      this.startStage(this.stageManager.currentStageIndex);
    } else if (this.pauseIndex === 2) {
      Sound.stopBgm();
      this.switchScreen('title-screen');
      this.state = 'title';
    }
  }

  startContinueCountdown() {
    this.state = 'continue';
    this.continueTimer = 9.99;
    this.lastCountdownSec = 10;
    this.switchScreen('continue-screen');
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
    const numEl = document.getElementById('continue-countdown-number');
    if (numEl) numEl.innerText = sec;

    const btnEl = document.getElementById('btn-do-continue');
    if (btnEl) btnEl.innerText = `CONTINUAR (${sec}) [W A S D / ENTER]`;

    if (sec !== this.lastCountdownSec) {
      this.lastCountdownSec = sec;
      Sound.init();
      Sound.playTone(520, 360, 0.08, 'square', 0.22);
    }
  }

  doContinue() {
    if (this.state !== 'continue') return;
    this.state = 'playing';
    this.switchScreen('hud-overlay');
    this.player.lives = 3;
    this.player.respawn(this.camera.x + 120, 430);
    Sound.init();
    Sound.playSpecial();
    Sound.startBgm(this.stageManager.stageConfig.number, this.stageManager.phase === 'boss_battle');
    this.hud.showBanner('CONTINUOU!', '3 VIDAS RESTAURADAS • INVENCÍVEL POR 2s', 2.2, '#00ffc4');
  }

  giveUpContinue() {
    this.state = 'game_over';
    this.switchScreen('game-over-screen');
    Sound.playGameOver();
  }

  switchScreen(activeScreenId) {
    const screens = [
      'loading-screen',
      'title-screen',
      'char-select-screen',
      'hud-overlay',
      'pause-screen',
      'continue-screen',
      'stage-clear-screen',
      'game-over-screen',
      'victory-screen'
    ];

    screens.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        if (id === activeScreenId || (activeScreenId === 'hud-overlay' && id === 'hud-overlay')) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });
  }

  startStage(stageIndex) {
    this.player = new Player(120, 430, this.selectedCharKey);
    this.camera.follow(this.player);

    this.stageManager.loadStage(stageIndex);
    this.switchScreen('hud-overlay');
    this.state = 'playing';

    this.hud.showBanner(
      `FASE ${this.stageManager.stageConfig.number}: ${this.stageManager.stageConfig.name}`,
      `CHEFE A CAMINHO: ${this.stageManager.stageConfig.bossName}`,
      2.8
    );
  }

  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'playing') {
      this.update(dt);
    } else if (this.state === 'continue') {
      this.updateContinue(dt);
    }

    this.render();

    Input.clearJustPressed();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    // Check Pause
    if (Input.isActionPressed('pause')) {
      this.pauseGame();
      return;
    }

    // 1. Player input & physics
    if (this.player) {
      this.player.handleInput(Input);
      this.player.update(dt, this.stageManager.stageLimits, this.camera);

      // Handle player respawn or death
      if (this.player.isDead && this.player.y === 0) {
        this.player.deathTime = (this.player.deathTime || 0) + dt;
        if (this.player.deathTime > 1.0) {
          this.player.deathTime = 0;
          if (this.player.lives > 1) {
            this.player.lives--;
            this.player.respawn(this.camera.x + 120, 430);
            this.hud.showBanner('RETORNANDO!', `${this.player.lives} VIDAS RESTANTES • INVENCÍVEL POR 2s`, 2.0, '#ffd700');
            Sound.playJump();
          } else {
            this.player.lives = 0;
            // 3 lives exhausted -> CONTINUE screen!
            this.startContinueCountdown();
            return;
          }
        }
      }
    }

    // 2. Stage progression, enemies & boss
    this.stageManager.update(dt);

    // 3. Camera follow
    this.camera.update(dt);

    // 4. Combat Collisions
    this.resolveCombatCollisions();

    // 5. Check Stage Clear transition
    if (this.stageManager.phase === 'stage_cleared' && this.stageManager.clearTimer >= 2.5) {
      this.showStageClearScreen();
    }

    // 6. HUD updates
    this.hud.update(dt);
  }

  resolveCombatCollisions() {
    const player = this.player;
    if (!player || player.isDead) return;

    // --- Player Attack vs Enemies & Boss ---
    const playerHitbox = player.getAttackHitbox();
    if (playerHitbox) {
      // Hit regular enemies
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
              this.stageManager.particles.addHitSparks(enemy.x, enemy.y + 40, enemy.z, '#ffe600', 10);
              this.stageManager.particles.addFloatingText(`-${Math.floor(playerHitbox.damage)}`, enemy.x, enemy.y + 70, enemy.z, '#ffea00');
              player.addScore(150);
              this.camera.shake(5, 0.15);
            }
          }
        }
      }

      // Hit Boss
      const boss = this.stageManager.boss;
      if (boss && !boss.isDead && !player.hitEntities.has(boss)) {
        if (this.check2DOverlap(playerHitbox, boss)) {
          player.hitEntities.add(boss);
          const tookDamage = boss.takeDamage(
            playerHitbox.damage,
            playerHitbox.knockbackX,
            playerHitbox.knockbackY
          );
          if (tookDamage) {
            this.stageManager.particles.addHitSparks(boss.x, boss.y + 50, boss.z, '#ff2255', 14);
            this.stageManager.particles.addFloatingText(`-${Math.floor(playerHitbox.damage)}`, boss.x, boss.y + 90, boss.z, '#ff3366');
            player.addScore(250);
            this.camera.shake(7, 0.2);
          }
        }
      }
    }

    // --- Enemies Attack vs Player ---
    for (const enemy of this.stageManager.enemies) {
      if (!enemy.isDead) {
        const enemyHitbox = enemy.getAttackHitbox();
        if (enemyHitbox && !enemy.hitPlayer) {
          if (this.check2DOverlap(enemyHitbox, player)) {
            enemy.hitPlayer = true;
            const tookHit = player.takeDamage(enemyHitbox.damage, enemyHitbox.knockbackX, enemyHitbox.knockbackY);
            if (tookHit) {
              this.stageManager.particles.addHitSparks(player.x, player.y + 40, player.z, '#ff3333', 8);
              this.stageManager.particles.addFloatingText(`-${Math.floor(enemyHitbox.damage)}`, player.x, player.y + 60, player.z, '#ff4444');
              this.camera.shake(6, 0.2);
            }
          }
        }
      }
    }

    // --- Boss Attack vs Player ---
    const boss = this.stageManager.boss;
    if (boss && !boss.isDead) {
      const bossHitbox = boss.getAttackHitbox();
      if (bossHitbox && !boss.hitPlayerThisSwing) {
        if (this.check2DOverlap(bossHitbox, player)) {
          boss.hitPlayerThisSwing = true;
          const tookHit = player.takeDamage(bossHitbox.damage, bossHitbox.knockbackX, bossHitbox.knockbackY);
          if (tookHit) {
            this.stageManager.particles.addHitSparks(player.x, player.y + 45, player.z, '#ff0055', 12);
            this.stageManager.particles.addFloatingText(`-${Math.floor(bossHitbox.damage)}`, player.x, player.y + 70, player.z, '#ff2222');
            this.camera.shake(9, 0.3);
          }
        }
      }

      // Check Boss Projectiles vs Player
      for (const p of boss.projectiles) {
        if (!p.isDead) {
          const dx = Math.abs(player.x - p.x);
          const dz = Math.abs(player.z - p.z);
          const dy = Math.abs(player.y - p.y);
          if (dx < 35 && dz < 25 && dy < 40) {
            p.isDead = true;
            player.takeDamage(24, Math.sign(p.vx || 1) * 6, 5);
            this.stageManager.particles.addHitSparks(player.x, player.y + 40, player.z, '#ff6600', 12);
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
    this.state = 'stage_clear';
    this.switchScreen('stage-clear-screen');

    const titleEl = document.getElementById('clear-stage-title');
    const bossEl = document.getElementById('clear-boss-defeated');
    const scoreEl = document.getElementById('clear-score-val');

    if (titleEl) titleEl.innerText = `${this.stageManager.stageConfig.name} CONCLUÍDA!`;
    if (bossEl) bossEl.innerText = `O Chefe ${this.stageManager.stageConfig.bossName} foi derrotado!`;
    if (scoreEl && this.player) scoreEl.innerText = this.player.score.toString();
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.state === 'playing' || this.state === 'stage_clear') {
      const isBossArena = this.stageManager.phase === 'boss_battle' || this.stageManager.phase === 'stage_cleared';

      // 1. Parallax Stage Background
      this.stageRenderer.draw(this.ctx, this.stageManager.stageConfig, this.camera, isBossArena, this.imageLoader);

      // 2. Depth-Sorted Entities (Player, Enemies, Boss, Items, Door)
      this.stageManager.drawEntities(this.ctx, this.camera, this.imageLoader);

      // 3. HUD Overlay
      this.hud.draw(this.ctx, this.player, this.stageManager, this.imageLoader);
    }
  }
}

// Boot game safely whether DOM is loading or already interactive/complete
function bootGame() {
  if (!window.GameInstance) {
    window.GameInstance = new Game();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
