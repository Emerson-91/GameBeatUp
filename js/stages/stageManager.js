import { STAGES_DATA } from '../data/stagesData.js';
import { Enemy } from '../entities/enemy.js';
import { Boss } from '../entities/boss.js';
import { ChickenItem, BossDoor, ParticleSystem } from '../entities/item.js';
import { Sound } from '../core/audio.js';

export class StageManager {
  constructor(game) {
    this.game = game;
    this.currentStageIndex = 0;
    this.stageConfig = STAGES_DATA[0];

    // Stage phase: 'street' | 'door_open' | 'entering_door' | 'boss_battle' | 'stage_cleared'
    this.phase = 'street';
    this.stageTimer = 60; // 1 minute per stage
    this.timeElapsed = 0;

    // Entities
    this.enemies = [];
    this.chickens = [];
    this.boss = null;
    this.door = null;
    this.particles = new ParticleSystem();

    // Spawn control
    this.spawnTimer = 0;
    this.nextChickenIndex = 0;
    this.defeatedEnemiesCount = 0;

    // Boss fight helpers
    this.bossBattleTimer = 0;
    this.bossChickensSpawned = 0;
    this.bossChickenHpThresh1 = 0.65;
    this.bossChickenHpThresh2 = 0.35;
    this.bossChickenTimeThresh1 = 15;
    this.bossChickenTimeThresh2 = 32;
    this.bossMinionSpawnTimer = 0;

    // Arena bounds
    this.stageLimits = {
      minZ: 370,
      maxZ: 500
    };

    // Transition timers
    this.transitionTimer = 0;
    this.clearTimer = 0;
  }

  loadStage(stageIndex) {
    this.currentStageIndex = stageIndex;
    this.stageConfig = STAGES_DATA[stageIndex];
    this.phase = 'street';
    this.stageTimer = this.stageConfig.durationSeconds || 60;
    this.timeElapsed = 0;

    this.enemies = [];
    this.chickens = [];
    this.boss = null;
    this.particles = new ParticleSystem();
    this.spawnTimer = 1.0;
    this.nextChickenIndex = 0;
    this.transitionTimer = 0;
    this.clearTimer = 0;
    this.defeatedEnemiesCount = 0;

    // Setup Boss Door at the end of the 1-minute street walk
    this.door = new BossDoor(this.stageConfig.stageLength - 160, 420, this.stageConfig);

    // Frango aparece no início e no final da fase de forma aleatória
    const startX = 350 + Math.random() * 450; // Início
    const startZ = this.stageLimits.minZ + 15 + Math.random() * (this.stageLimits.maxZ - this.stageLimits.minZ - 30);
    this.chickens.push(new ChickenItem(startX, startZ));

    const endX = Math.max(startX + 800, this.stageConfig.stageLength - 950 + Math.random() * 450); // Final
    const endZ = this.stageLimits.minZ + 15 + Math.random() * (this.stageLimits.maxZ - this.stageLimits.minZ - 30);
    this.chickens.push(new ChickenItem(endX, endZ));

    // Camera setup
    this.game.camera.x = 0;
    this.game.camera.setLimits(0, this.stageConfig.stageLength);
    this.game.camera.isLocked = false;

    // Reposition player
    if (this.game.player) {
      this.game.player.x = 120;
      this.game.player.z = 430;
      this.game.player.y = 0;
      this.game.player.vx = 0;
      this.game.player.vz = 0;
      this.game.player.state = 'idle';
    }

    // Start Stage BGM
    Sound.startBgm(this.stageConfig.number, false);

    // Initial enemy wave (starts with ~5-6 enemies on screen)
    this.spawnWave(5);
  }

  spawnWave(count = 2) {
    const player = this.game.player;
    if (!player) return;

    const pool = this.stageConfig.enemyPool;
    if (!pool || pool.length === 0) return;

    for (let i = 0; i < count; i++) {
      // Pick random enemy from stage pool
      const enemyConfig = pool[Math.floor(Math.random() * pool.length)];

      // Spawn ahead or behind to surround player
      const spawnAhead = Math.random() < 0.65;
      const offset = 40 + i * 35 + Math.random() * 40;
      const spawnX = spawnAhead
        ? this.game.camera.x + this.game.camera.width + offset
        : Math.max(25, this.game.camera.x - offset);
      const spawnZ = 370 + Math.random() * 130;

      this.enemies.push(new Enemy(spawnX, spawnZ, enemyConfig, player));
    }
  }

  update(dt) {
    this.particles.update(dt);

    if (this.phase === 'street' || this.phase === 'door_open') {
      this.updateStreetPhase(dt);
    } else if (this.phase === 'entering_door') {
      this.updateDoorTransition(dt);
    } else if (this.phase === 'boss_battle') {
      this.updateBossBattle(dt);
    } else if (this.phase === 'stage_cleared') {
      this.updateStageClear(dt);
    }
  }

  updateStreetPhase(dt) {
    this.timeElapsed += dt;
    this.stageTimer = Math.max(0, this.stageTimer - dt);

    const player = this.game.player;
    if (!player) return;

    // Update Door
    if (this.door) {
      this.door.update(dt);

      // When 1 minute elapses OR player reaches end of stage, open portal!
      if (!this.door.isOpen && (this.stageTimer <= 0 || player.x >= this.stageConfig.stageLength - 380)) {
        this.door.open();
        this.phase = 'door_open';
        Sound.playDoorOpen();
      }

      // Check if player enters door or walks right into the portal
      if (this.door.isOpen && (this.door.isPlayerEntering(player) || player.x >= this.door.x - 25)) {
        this.phase = 'entering_door';
        this.transitionTimer = 0.8;
        player.vx = 0;
        player.vz = 0;
        player.state = 'idle';
        return;
      }
    }

    // Update Chicken pickups
    for (const chicken of this.chickens) {
      chicken.update(dt, player);
    }

    // Spawn waves of enemies along the 1-minute journey: Maintain an average of 6 enemies on screen!
    this.spawnTimer -= dt;
    const livingEnemies = this.enemies.filter((e) => !e.isDead);

    // Target around 6 active enemies on screen at a time
    const targetEnemies = 6;
    if (this.stageTimer > 0) {
      if (livingEnemies.length <= 3 || (this.spawnTimer <= 0 && livingEnemies.length < targetEnemies)) {
        const countToSpawn = Math.max(2, Math.min(3, targetEnemies - livingEnemies.length));
        this.spawnWave(countToSpawn);
        this.spawnTimer = 2.2 + Math.random() * 1.8;
      }
    }

    // Update Enemies AI & Physics
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.updateAI(dt, this.stageLimits);

      // Dead enemy cleanup: delete immediately from screen once landed or death timer expires!
      if (enemy.isDead) {
        enemy.deathTimer = (enemy.deathTimer !== undefined ? enemy.deathTimer : 0.45) - dt;
        if (enemy.y <= 0 || enemy.deathTimer <= 0) {
          this.particles.addHitSparks(enemy.x, enemy.y || 15, enemy.z, '#ffbb00', 12);
          
          this.defeatedEnemiesCount++;
          // A cada 6 inimigos derrotados, o frango aparece de forma aleatória
          if (this.defeatedEnemiesCount % 6 === 0) {
            const dropX = enemy.x + (Math.random() - 0.5) * 35;
            const dropZ = Math.min(this.stageLimits.maxZ, Math.max(this.stageLimits.minZ, enemy.z + (Math.random() - 0.5) * 25));
            this.chickens.push(new ChickenItem(dropX, dropZ));
            this.particles.addHitSparks(dropX, 15, dropZ, '#ffd700', 22);
            this.particles.addFloatingText('🍗 FRANGO!', dropX, 65, dropZ, '#ffd700');
            Sound.playChickenHeal();
          }

          this.enemies.splice(i, 1);
        }
      }
    }
  }

  updateDoorTransition(dt) {
    this.transitionTimer -= dt;
    if (this.transitionTimer <= 0) {
      // Enter Boss Arena!
      this.phase = 'boss_battle';
      this.setupBossArena();
    }
  }

  setupBossArena() {
    const player = this.game.player;
    this.game.camera.x = 0;
    this.game.camera.setLimits(0, 960);
    this.game.camera.isLocked = true;

    // Place player on left side of arena
    if (player) {
      player.x = 200;
      player.z = 430;
      player.y = 0;
      player.vx = 0;
      player.vz = 0;
      player.facing = 1;
      player.state = 'idle';
    }

    // Spawn Boss on right side of arena
    this.boss = new Boss(this.stageConfig.number, 740, 430, player);

    // Clear regular street enemies
    this.enemies = [];

    // Boss battle timers and random chicken spawn thresholds
    this.bossBattleTimer = 0;
    this.bossChickensSpawned = 0; // Exatamente 2 frangos no boss
    this.bossChickenHpThresh1 = 0.72 - Math.random() * 0.14; // entre 58% e 72%
    this.bossChickenHpThresh2 = 0.38 - Math.random() * 0.14; // entre 24% e 38%
    this.bossChickenTimeThresh1 = 12 + Math.random() * 6;     // fallback ~12-18s
    this.bossChickenTimeThresh2 = 28 + Math.random() * 8;     // fallback ~28-36s

    // Inimigos da fase no boss: aparecem dois por vez no meio da luta
    this.bossMinionSpawnTimer = 3.2;

    // Trigger Boss Sirens & Boss BGM
    Sound.playBossWarning();
    Sound.setBossIntensity(true);
    this.game.camera.shake(12, 0.6);
  }

  updateBossBattle(dt) {
    const player = this.game.player;
    if (!this.boss || !player) return;

    this.bossBattleTimer += dt;
    this.boss.updateAI(dt, this.stageLimits, this.game.camera);

    // 1. Frango aparece duas vezes de forma aleatória no boss
    if (this.bossChickensSpawned < 2 && !this.boss.isDead) {
      const bossHpPct = this.boss.hp / this.boss.maxHp;
      let shouldSpawn = false;

      if (this.bossChickensSpawned === 0) {
        if (bossHpPct <= this.bossChickenHpThresh1 || this.bossBattleTimer >= this.bossChickenTimeThresh1) {
          shouldSpawn = true;
          this.bossChickensSpawned = 1;
        }
      } else if (this.bossChickensSpawned === 1) {
        if (bossHpPct <= this.bossChickenHpThresh2 || this.bossBattleTimer >= this.bossChickenTimeThresh2) {
          shouldSpawn = true;
          this.bossChickensSpawned = 2;
        }
      }

      if (shouldSpawn) {
        const chickenX = 220 + Math.random() * 520;
        const chickenZ = this.stageLimits.minZ + 15 + Math.random() * (this.stageLimits.maxZ - this.stageLimits.minZ - 30);
        this.chickens.push(new ChickenItem(chickenX, chickenZ));
        this.particles.addHitSparks(chickenX, 15, chickenZ, '#ffd700', 24);
        this.particles.addFloatingText('🍗 FRANGO ASSADO!', chickenX, 65, chickenZ, '#ffd700');
        Sound.playChickenHeal();
      }
    }

    // 2. Atualiza itens de frango na arena do boss
    for (const chicken of this.chickens) {
      chicken.update(dt, player);
    }

    // 3. Os outros inimigos da fase também aparecem para atrapalhar, mas aparecem dois por vez no meio da luta
    if (!this.boss.isDead) {
      const livingMinions = this.enemies.filter((e) => !e.isDead);

      // Limite estrito de exatamente 2 por vez
      if (livingMinions.length < 2) {
        this.bossMinionSpawnTimer -= dt;
        if (this.bossMinionSpawnTimer <= 0) {
          const countNeeded = 2 - livingMinions.length;
          const pool = this.stageConfig.enemyPool;
          if (pool && pool.length > 0) {
            for (let k = 0; k < countNeeded; k++) {
              const enemyConfig = pool[Math.floor(Math.random() * pool.length)];
              const spawnLeft = Math.random() < 0.5;
              const spawnX = spawnLeft ? -25 - Math.random() * 30 : 985 + Math.random() * 30;
              const spawnZ = this.stageLimits.minZ + Math.random() * (this.stageLimits.maxZ - this.stageLimits.minZ);
              const minion = new Enemy(spawnX, spawnZ, enemyConfig, player);
              this.enemies.push(minion);
            }
          }
          this.bossMinionSpawnTimer = 3.5 + Math.random() * 2.5;
        }
      }
    } else {
      // Quando o boss morre, limpa os capangas com faíscas
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        this.particles.addHitSparks(e.x, e.y || 20, e.z, '#ffaa00', 8);
        this.enemies.splice(i, 1);
      }
    }

    // 4. Atualiza IA e física dos inimigos comuns na luta do boss
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.updateAI(dt, this.stageLimits);

      if (enemy.isDead) {
        enemy.deathTimer = (enemy.deathTimer !== undefined ? enemy.deathTimer : 0.45) - dt;
        if (enemy.y <= 0 || enemy.deathTimer <= 0) {
          this.particles.addHitSparks(enemy.x, enemy.y || 15, enemy.z, '#ffbb00', 12);
          this.defeatedEnemiesCount++;
          // A cada 6 inimigos derrotados
          if (this.defeatedEnemiesCount % 6 === 0) {
            const dropX = enemy.x + (Math.random() - 0.5) * 35;
            const dropZ = Math.min(this.stageLimits.maxZ, Math.max(this.stageLimits.minZ, enemy.z + (Math.random() - 0.5) * 25));
            this.chickens.push(new ChickenItem(dropX, dropZ));
            this.particles.addHitSparks(dropX, 15, dropZ, '#ffd700', 20);
            this.particles.addFloatingText('🍗 FRANGO!', dropX, 65, dropZ, '#ffd700');
            Sound.playChickenHeal();
          }
          this.enemies.splice(i, 1);
        }
      }
    }

    // 5. Check Boss defeat
    if (this.boss.isDead && this.boss.y === 0) {
      this.clearTimer += dt;
      if (this.clearTimer >= 1.5 && this.phase !== 'stage_cleared') {
        this.phase = 'stage_cleared';
        this.clearTimer = 0;
        player.state = 'victory';
        Sound.playVictory();
        Sound.stopBgm();
        player.addScore(5000);
      }
    }
  }

  updateStageClear(dt) {
    this.clearTimer += dt;
    const player = this.game.player;
    if (player) {
      player.state = 'victory';
    }
  }

  advanceToNextStage() {
    if (this.currentStageIndex < STAGES_DATA.length - 1) {
      this.loadStage(this.currentStageIndex + 1);
      return true;
    } else {
      // Game Beaten!
      return false;
    }
  }

  // Draw entities sorted by Z for accurate 2.5D depth sorting
  drawEntities(ctx, camera, imageLoader) {
    const renderList = [];

    // Add Door in street phase
    if (this.door && this.phase !== 'boss_battle' && this.phase !== 'stage_cleared') {
      renderList.push({ z: this.door.z - 20, type: 'door', entity: this.door });
    }

    // Add Chickens in all active gameplay phases (street and boss battle!)
    for (const c of this.chickens) {
      if (!c.isCollected) {
        renderList.push({ z: c.z, type: 'chicken', entity: c });
      }
    }

    // Add Player
    if (this.game.player) {
      renderList.push({ z: this.game.player.z, type: 'character', entity: this.game.player });
    }

    // Add Enemies
    for (const e of this.enemies) {
      renderList.push({ z: e.z, type: 'character', entity: e });
    }

    // Add Boss
    if (this.boss) {
      renderList.push({ z: this.boss.z, type: 'character', entity: this.boss });
    }

    // Sort by Z coordinate (objects with lower Z are drawn first / behind)
    renderList.sort((a, b) => a.z - b.z);

    // 1. Draw all shadows first
    for (const item of renderList) {
      if (item.type === 'character') {
        item.entity.drawShadow(ctx, camera);
      }
    }

    // 2. Draw sorted entities
    for (const item of renderList) {
      if (item.type === 'door') {
        item.entity.draw(ctx, camera);
      } else if (item.type === 'chicken') {
        item.entity.draw(ctx, camera, imageLoader);
      } else if (item.type === 'character') {
        item.entity.draw(ctx, camera, imageLoader);
        if (item.entity instanceof Enemy) {
          item.entity.drawHealthBar(ctx, camera);
        }
      }
    }

    // 3. Draw Boss Projectiles (tornados, meteors)
    if (this.boss) {
      this.boss.drawProjectiles(ctx, camera, imageLoader);
    }

    // Draw AndreyBots, aerial plasma bomb shots, Nata lightning storm, and Unicao falling planets
    if (this.game && this.game.player) {
      if (this.game.player.drawBots) {
        this.game.player.drawBots(ctx, camera, imageLoader);
      }
      if (this.game.player.drawNataLightnings) {
        this.game.player.drawNataLightnings(ctx, camera);
      }
      if (this.game.player.drawUnicaoPlanets) {
        this.game.player.drawUnicaoPlanets(ctx, camera, imageLoader);
      }
    }

    // 4. Draw Hit Sparks & Floating Damage Texts
    this.particles.draw(ctx, camera);
  }
}
