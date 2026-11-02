import { Camera } from './core/camera.js';
import { Input } from './core/input.js';
import { Sound } from './core/audio.js';
import { ImageLoader } from './core/imageLoader.js';
import { Player } from './entities/player.js';
import { StageRenderer } from './stages/stageRenderer.js';
import { StageManager } from './stages/stageManager.js';
import { HUD } from './ui/hud.js';
import { CharacterSelect } from './ui/characterSelect.js';
import { StoryIntro } from './ui/storyIntro.js';

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

    this.storyIntroUI = new StoryIntro();

    this.characterSelectUI = new CharacterSelect(
      (charKey) => {
        this.selectedCharKey = charKey;
        this.state = 'story';
        this.switchScreen('story-intro-screen');
        this.storyIntroUI.show(
          () => {
            this.startStage(0);
          },
          () => {
            this.startStage(0);
          }
        );
      },
      () => {
        this.switchScreen('title-screen');
        this.state = 'title';
      }
    );

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
    const chooseFighterBtn = document.getElementById('btn-choose-fighter');
    const storyBtn = document.getElementById('btn-story-intro');
    const howToPlayBtn = document.getElementById('btn-how-to-play');
    const howToPlayModal = document.getElementById('how-to-play-modal');
    const btnCloseInst = document.getElementById('btn-close-instructions');
    const btnInstPlay = document.getElementById('btn-inst-play');

    const toggleHowToPlay = (show) => {
      if (!howToPlayModal) return;
      if (show) {
        howToPlayModal.classList.remove('hidden');
      } else {
        howToPlayModal.classList.add('hidden');
      }
    };

    if (btnCloseInst) btnCloseInst.onclick = () => {
      Sound.init();
      Sound.playKick();
      toggleHowToPlay(false);
    };

    if (btnInstPlay) {
      btnInstPlay.onclick = () => {
        toggleHowToPlay(false);
        Sound.init();
        Sound.playKick();
        this.switchScreen('char-select-screen');
        this.state = 'select';
      };
    }

    if (howToPlayBtn) {
      howToPlayBtn.onclick = () => {
        Sound.init();
        Sound.playPunch();
        toggleHowToPlay(true);
      };
    }

    if (startBtn) {
      startBtn.onclick = () => {
        Sound.init();
        Sound.playKick();
        this.switchScreen('char-select-screen');
        this.state = 'select';
      };
    }

    if (chooseFighterBtn) {
      chooseFighterBtn.onclick = () => {
        Sound.init();
        Sound.playPunch();
        this.switchScreen('char-select-screen');
        this.state = 'select';
      };
    }

    if (storyBtn) {
      storyBtn.onclick = () => {
        Sound.init();
        Sound.playSpecial();
        this.state = 'story';
        this.switchScreen('story-intro-screen');
        this.storyIntroUI.show(
          () => {
            this.switchScreen('char-select-screen');
            this.state = 'select';
          },
          () => {
            this.switchScreen('title-screen');
            this.state = 'title';
          }
        );
      };
    }

    // 90s Arcade Menu Cursor Selection
    const menuItems = Array.from(document.querySelectorAll('.arcade-menu-item'));
    let activeMenuIdx = 0;

    const setActiveMenuItem = (index, playSfx = true) => {
      if (!menuItems.length) return;
      activeMenuIdx = (index + menuItems.length) % menuItems.length;
      menuItems.forEach((item, i) => {
        item.classList.toggle('active', i === activeMenuIdx);
      });
      if (playSfx) {
        Sound.init();
        Sound.playJump();
      }
    };

    menuItems.forEach((item, i) => {
      item.addEventListener('mouseenter', () => {
        if (activeMenuIdx !== i) {
          setActiveMenuItem(i, false);
        }
      });
    });

    // Hero chips interactive selection
    document.querySelectorAll('.hero-chip').forEach((chip) => {
      chip.style.cursor = 'pointer';
      chip.onclick = () => {
        const charKey = chip.getAttribute('data-char');
        Sound.init();
        Sound.playSpecial();
        if (charKey && this.characterSelectUI) {
          this.characterSelectUI.selectKey(charKey);
        }
        this.switchScreen('char-select-screen');
        this.state = 'select';
      };
    });

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
        const isModalOpen = howToPlayModal && !howToPlayModal.classList.contains('hidden');
        if (isModalOpen) {
          if (key === 'escape' || key === 't' || code === 'KeyT' || code === 'Escape') {
            toggleHowToPlay(false);
            Sound.playKick();
            e.preventDefault();
            return;
          } else if (isConfirm) {
            toggleHowToPlay(false);
            if (btnInstPlay) btnInstPlay.click();
            e.preventDefault();
            return;
          }
        }

        // Navigate menu items with W / S or Arrow Keys
        if (key === 'w' || key === 'arrowup' || code === 'KeyW' || code === 'ArrowUp') {
          setActiveMenuItem(activeMenuIdx - 1);
          e.preventDefault();
        } else if (key === 's' || key === 'arrowdown' || code === 'KeyS' || code === 'ArrowDown') {
          setActiveMenuItem(activeMenuIdx + 1);
          e.preventDefault();
        } else if (isConfirm) {
          if (menuItems[activeMenuIdx]) {
            menuItems[activeMenuIdx].click();
          } else if (startBtn) {
            startBtn.click();
          }
          e.preventDefault();
        } else if (key === 'h' || code === 'KeyH') {
          if (storyBtn) storyBtn.click();
        } else if (key === 'c' || code === 'KeyC') {
          if (chooseFighterBtn) chooseFighterBtn.click();
        } else if (key === 't' || code === 'KeyT') {
          toggleHowToPlay(true);
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
      'story-intro-screen',
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
      this.player.update(dt, this.stageManager.stageLimits, this.camera, this.stageManager.particles);

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

    // --- Emerson Seismic Ground Pound (Full-Screen Special) ---
    if (player.state === 'special' && player.charKey === 'emerson') {
      if (player.specialPhase >= 2 && !player.specialImpactTriggered) {
        player.specialImpactTriggered = true;

        // Violent screen tremor
        this.camera.shake(18, 0.75);
        Sound.playSeismicImpact();

        // Shockwaves & Ground Impact Visuals
        if (this.stageManager && this.stageManager.particles) {
          this.stageManager.particles.addShockwave(player.x, player.z, 160, '#00e5ff');
          this.stageManager.particles.addHitSparks(player.x, 15, player.z, '#00e5ff', 30);
          this.stageManager.particles.addFloatingText('💥 IMPACTO SÍSMICO!', player.x, player.y + 110, player.z, '#00ffff');
        }

        // Damage ALL active regular enemies on screen: 50% HP!
        for (const enemy of this.stageManager.enemies) {
          if (!enemy.isDead) {
            const damage = Math.max(1, Math.floor(enemy.maxHp * 0.50));
            const tookDamage = enemy.takeDamage(
              damage,
              (enemy.x >= player.x ? 1 : -1) * 9.5,
              8.5
            );
            if (tookDamage) {
              this.stageManager.particles.addHitSparks(enemy.x, enemy.y + 40, enemy.z, '#00e5ff', 16);
              this.stageManager.particles.addFloatingText(`-${damage} (50%)`, enemy.x, enemy.y + 70, enemy.z, '#00ffff');
              player.addScore(250);
            }
          }
        }

        // Damage Boss: 25% HP!
        const boss = this.stageManager.boss;
        if (boss && !boss.isDead) {
          const bossDamage = Math.max(1, Math.floor(boss.maxHp * 0.25));
          const tookDamage = boss.takeDamage(
            bossDamage,
            (boss.x >= player.x ? 1 : -1) * 7.5,
            5.0
          );
          if (tookDamage) {
            this.stageManager.particles.addHitSparks(boss.x, boss.y + 50, boss.z, '#00e5ff', 24);
            this.stageManager.particles.addFloatingText(`-${bossDamage} (25%)`, boss.x, boss.y + 90, boss.z, '#00ffff');
            player.addScore(500);
            if (boss.barBroken) {
              boss.barBroken = false;
              this.stageManager.particles.addHitSparks(boss.x, boss.y + 60, boss.z, '#ffff00', 30);
              this.stageManager.particles.addFloatingText(`⚡ BARRA QUEBRADA! [x${boss.currentBar}] ⚡`, boss.x, boss.y + 115, boss.z, '#ffd700');
              Sound.playHeavyHit();
              this.camera.shake(9, 0.25);
            }
          }
        }
      }

      // During Phase 3 (fissures and lightning crackle), emit intermittent electric sparks
      if (player.specialPhase === 3 && this.stageManager && this.stageManager.particles) {
        if (Math.random() < 0.4) {
          const rx = player.x + (Math.random() - 0.5) * 120;
          const rz = player.z + (Math.random() - 0.5) * 40;
          this.stageManager.particles.addHitSparks(rx, 8, rz, '#00e5ff', 4);
        }
      }
    }

    // --- AndreyBot Plasma Bomb Shots vs Enemies & Boss (Devastating Plasma Bombs) ---
    if (player.andreyShots && player.andreyShots.length > 0) {
      for (const shot of player.andreyShots) {
        if (shot.isDead) continue;

        // Check vs Regular Enemies
        for (const enemy of this.stageManager.enemies) {
          if (!enemy.isDead && !shot.isDead) {
            const dx = Math.abs(shot.x - enemy.x);
            const dz = Math.abs(shot.z - enemy.z);
            const dy = Math.abs(shot.y - enemy.y);
            if (dx < 48 && dz < 34 && dy < 55) {
              shot.isDead = true;
              // Cada tiro tira 20% de vida (aumentado de 9% para 20%!)
              const damage = Math.max(1, Math.floor(enemy.maxHp * 0.20));
              const tookDamage = enemy.takeDamage(
                damage,
                (shot.vx >= 0 ? 1 : -1) * 4.5,
                3.0
              );
              if (tookDamage) {
                this.stageManager.particles.addHitSparks(enemy.x, enemy.y + 35, enemy.z, '#00ff88', 16);
                this.stageManager.particles.addFloatingText(`-${damage} (20%) 💥`, enemy.x, enemy.y + 65, enemy.z, '#00ff88');
                Sound.playLaserHit();
                this.camera.shake(4.5, 0.12);
                player.addScore(120);
              }
            }
          }
        }

        // Check vs Boss
        const boss = this.stageManager.boss;
        if (boss && !boss.isDead && !shot.isDead) {
          const dx = Math.abs(shot.x - boss.x);
          const dz = Math.abs(shot.z - boss.z);
          const dy = Math.abs(shot.y - boss.y);
          if (dx < 56 && dz < 40 && dy < 65) {
            shot.isDead = true;
            // Cada tiro tira 15% de vida do chefe (aumentado de 9% para 15%!)
            const bossDamage = Math.max(1, Math.floor(boss.maxHp * 0.15));
            const tookDamage = boss.takeDamage(
              bossDamage,
              (shot.vx >= 0 ? 1 : -1) * 3.5,
              2.2
            );
            if (tookDamage) {
              this.stageManager.particles.addHitSparks(boss.x, boss.y + 45, boss.z, '#00ff88', 22);
              this.stageManager.particles.addFloatingText(`-${bossDamage} (15%) 💥`, boss.x, boss.y + 85, boss.z, '#00ff88');
              Sound.playLaserHit();
              this.camera.shake(5.5, 0.15);
              player.addScore(250);
              if (boss.barBroken) {
                boss.barBroken = false;
                this.stageManager.particles.addHitSparks(boss.x, boss.y + 60, boss.z, '#ffff00', 30);
                this.stageManager.particles.addFloatingText(`⚡ BARRA QUEBRADA! [x${boss.currentBar}] ⚡`, boss.x, boss.y + 115, boss.z, '#ffd700');
                Sound.playHeavyHit();
                this.camera.shake(9, 0.25);
              }
            }
          }
        }
      }
    }

    // --- Nata Electric Guitar Solo: Random Lightning Storm Collisions ---
    // Inimigos atingidos pelo raio tomam 50% de dano; o chefe toma 25% de dano
    if (player.nataLightnings && player.nataLightnings.length > 0) {
      for (const strike of player.nataLightnings) {
        if (strike.stage === 'strike' && !strike.hasDamaged) {
          strike.hasDamaged = true;

          // Camera shake on each lightning impact
          this.camera.shake(8.0, 0.2);

          // Check Regular Enemies in strike radius: 50% HP damage!
          for (const enemy of this.stageManager.enemies) {
            if (!enemy.isDead) {
              const dx = Math.abs(strike.x - enemy.x);
              const dz = Math.abs(strike.z - enemy.z);
              if (dx < 65 && dz < 42) {
                const damage = Math.max(1, Math.floor(enemy.maxHp * 0.50));
                const tookDamage = enemy.takeDamage(
                  damage,
                  (enemy.x >= strike.x ? 1 : -1) * 8.0,
                  7.0
                );
                if (tookDamage) {
                  this.stageManager.particles.addHitSparks(enemy.x, enemy.y + 40, enemy.z, '#00e5ff', 20);
                  this.stageManager.particles.addHitSparks(enemy.x, enemy.y + 20, enemy.z, '#ffd700', 14);
                  this.stageManager.particles.addFloatingText(`-${damage} (50%) ⚡♪`, enemy.x, enemy.y + 70, enemy.z, '#00ffff');
                  player.addScore(300);
                }
              }
            }
          }

          // Check Boss in strike radius: 25% HP damage!
          const boss = this.stageManager.boss;
          if (boss && !boss.isDead) {
            const dx = Math.abs(strike.x - boss.x);
            const dz = Math.abs(strike.z - boss.z);
            if (dx < 78 && dz < 52) {
              const bossDamage = Math.max(1, Math.floor(boss.maxHp * 0.25));
              const tookDamage = boss.takeDamage(
                bossDamage,
                (boss.x >= strike.x ? 1 : -1) * 6.5,
                5.0
              );
              if (tookDamage) {
                this.stageManager.particles.addHitSparks(boss.x, boss.y + 50, boss.z, '#00e5ff', 25);
                this.stageManager.particles.addHitSparks(boss.x, boss.y + 30, boss.z, '#ffd700', 20);
                this.stageManager.particles.addFloatingText(`-${bossDamage} (25%) ⚡♪`, boss.x, boss.y + 90, boss.z, '#ffd700');
                player.addScore(600);
                if (boss.barBroken) {
                  boss.barBroken = false;
                  this.stageManager.particles.addHitSparks(boss.x, boss.y + 60, boss.z, '#ffff00', 30);
                  this.stageManager.particles.addFloatingText(`⚡ BARRA QUEBRADA! [x${boss.currentBar}] ⚡`, boss.x, boss.y + 115, boss.z, '#ffd700');
                  Sound.playHeavyHit();
                  this.camera.shake(9, 0.25);
                }
              }
            }
          }
        }
      }
    }

    // --- Unicão Cosmic Cataclysm: Falling Planets vs Enemies & Boss ---
    // Cada hit de planeta causa 50% de dano aos adversários e 25% ao chefe!
    if (player.unicaoPlanets && player.unicaoPlanets.length > 0) {
      for (const planet of player.unicaoPlanets) {
        if (planet.stage === 'impact' && !planet.hasHitTarget) {
          planet.hasHitTarget = true;

          // Camera shake on each planet impact
          this.camera.shake(11.0, 0.28);

          // Check Regular Enemies in planet impact radius: 50% HP damage!
          for (const enemy of this.stageManager.enemies) {
            if (!enemy.isDead) {
              const dx = Math.abs(planet.targetX - enemy.x);
              const dz = Math.abs(planet.targetZ - enemy.z);
              if (dx < 75 * planet.scale + 35 && dz < 50 * planet.scale + 25) {
                const damage = Math.max(1, Math.floor(enemy.maxHp * 0.50));
                const tookDamage = enemy.takeDamage(
                  damage,
                  (enemy.x >= planet.targetX ? 1 : -1) * 9.0,
                  8.0 // Massive Knockdown launch!
                );
                if (tookDamage) {
                  this.stageManager.particles.addHitSparks(enemy.x, enemy.y + 40, enemy.z, '#ff4400', 22);
                  this.stageManager.particles.addHitSparks(enemy.x, enemy.y + 20, enemy.z, '#ffbb00', 16);
                  this.stageManager.particles.addFloatingText(`-${damage} (50%) 🪐💥`, enemy.x, enemy.y + 70, enemy.z, '#ff5500');
                  player.addScore(350);
                }
              }
            }
          }

          // Check Boss in planet impact radius: 25% HP damage!
          const boss = this.stageManager.boss;
          if (boss && !boss.isDead) {
            const dx = Math.abs(planet.targetX - boss.x);
            const dz = Math.abs(planet.targetZ - boss.z);
            if (dx < 90 * planet.scale + 45 && dz < 60 * planet.scale + 30) {
              const bossDamage = Math.max(1, Math.floor(boss.maxHp * 0.25));
              const tookDamage = boss.takeDamage(
                bossDamage,
                (boss.x >= planet.targetX ? 1 : -1) * 7.5,
                6.0
              );
              if (tookDamage) {
                this.stageManager.particles.addHitSparks(boss.x, boss.y + 50, boss.z, '#ff3300', 30);
                this.stageManager.particles.addHitSparks(boss.x, boss.y + 30, boss.z, '#ffcc00', 25);
                this.stageManager.particles.addFloatingText(`-${bossDamage} (25%) 🪐💥`, boss.x, boss.y + 90, boss.z, '#ff9900');
                player.addScore(700);
                if (boss.barBroken) {
                  boss.barBroken = false;
                  this.stageManager.particles.addHitSparks(boss.x, boss.y + 60, boss.z, '#ffff00', 30);
                  this.stageManager.particles.addFloatingText(`⚡ BARRA QUEBRADA! [x${boss.currentBar}] ⚡`, boss.x, boss.y + 115, boss.z, '#ffd700');
                  Sound.playHeavyHit();
                  this.camera.shake(12, 0.3);
                }
              }
            }
          }
        }
      }
    }

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
            if (boss.barBroken) {
              boss.barBroken = false;
              this.stageManager.particles.addHitSparks(boss.x, boss.y + 60, boss.z, '#ffff00', 30);
              this.stageManager.particles.addFloatingText(`⚡ BARRA QUEBRADA! [x${boss.currentBar}] ⚡`, boss.x, boss.y + 115, boss.z, '#ffd700');
              Sound.playHeavyHit();
              this.camera.shake(9, 0.25);
            }
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
