import { Entity } from './entity.js';
import { PLAYABLE_CHARACTERS } from '../data/charactersData.js';
import { Sound } from '../core/audio.js';

export class Player extends Entity {
  constructor(x, z, charKey) {
    const config = PLAYABLE_CHARACTERS[charKey];
    super(x, z, charKey, config.spriteId);

    this.config = config;
    this.name = config.name;
    this.maxHp = config.maxHp;
    this.hp = this.maxHp;
    this.speed = config.speed;

    // Special meter (0 to 100)
    this.specialMeter = 100;
    this.specialCooldown = 0;

    // Lives and Score
    this.lives = 3;
    this.score = 0;

    // Attack State & Combo Tracker
    // 3 Punches & 3 Kicks Chain System
    this.attackCooldown = 0;
    this.punchComboStep = 0; // 0, 1, 2, 3
    this.comboResetTimer = 0; // Window to chain into next combo hit
    this.hitEntities = new Set(); // Prevent multi-hits per attack swing

    // Special Attack Helpers (AndreyBots & Projectiles & Nata Lightning)
    this.andreyBots = [];
    this.andreyShots = [];
    this.andreyBotsSpawned = false;
    this.nataLightnings = [];
    this.nataNotes = [];
    this.nataLightningTimer = 0;
    this.unicaoPlanets = [];
    this.unicaoPlanetTimer = 0;

    // Reduced, tight jump height (arcade beat 'em up grounded feel)
    this.jumpPower = config.jumpPower || 7.0;
  }

  isAttacking() {
    return (
      this.state.startsWith('punch') ||
      this.state.startsWith('kick') ||
      this.state === 'special'
    );
  }

  handleInput(input) {
    if (this.isDead) return;

    // Don't interrupt recovery or knockdown
    if (this.state === 'hurt' || this.state === 'knockdown' || this.state === 'fall' || this.state === 'victory') {
      return;
    }

    // Special Attack (Requires 100% full SP meter)
    if (input.isActionPressed('special')) {
      if (this.specialMeter >= 100 && this.state !== 'special') {
        this.performSpecial();
        return;
      }
    }

    // Jump
    const canAndreyAct = this.charKey === 'andrey' && this.state === 'special';
    if (input.isActionPressed('jump') && this.y === 0 && (!this.isAttacking() || canAndreyAct) && this.state !== 'jump') {
      if (this.state === 'special') {
        this.specialPhase = 0;
      }
      this.state = 'jump';
      this.vy = this.jumpPower;
      this.punchComboStep = 0;
      this.kickComboStep = 0;
      let jumpDx = 0;
      if (input.keys.left) jumpDx -= 1;
      if (input.keys.right) jumpDx += 1;
      this.vx = jumpDx * this.speed;
      Sound.playJump();
    }

    // Mid-air state (Air movement & Jump Kick)
    if (this.y > 0) {
      let airDx = 0;
      if (input.keys.left) airDx -= 1;
      if (input.keys.right) airDx += 1;
      if (airDx !== 0) {
        this.facing = airDx > 0 ? 1 : -1;
        this.vx = airDx * (this.speed * 0.85);
      }

      if ((input.isActionPressed('punch') || input.isActionPressed('kick')) && this.state !== 'kick3') {
        this.state = 'kick3';
        this.stateTimer = 0.35;
        this.hitEntities.clear();
        Sound.playKick();
      }
      return;
    }

    // Ground Combo Attacks: 3 Punches & 3 Kicks Chain (Andrey is free to attack even right after special!)
    if (this.state !== 'special' || this.charKey === 'andrey') {
      // PUNCH CHAIN: 1st press -> punch1, 2nd press -> punch2, 3rd press -> punch3
      if (input.isActionPressed('punch') && this.attackCooldown <= 0) {
        if (this.state === 'special') {
          this.state = 'idle';
          this.specialPhase = 0;
        }
        this.triggerPunchChain();
        return;
      }

      // KICK CHAIN: 1st press -> kick1, 2nd press -> kick2, 3rd press -> kick3
      if (input.isActionPressed('kick') && this.attackCooldown <= 0) {
        if (this.state === 'special') {
          this.state = 'idle';
          this.specialPhase = 0;
        }
        this.triggerKickChain();
        return;
      }
    }

    // Movement if not locked in attack (or canceling Andrey's quick summon after 0.15s)
    const isAndreySpecialCancel = this.charKey === 'andrey' && this.state === 'special' && (this.specialDuration - this.stateTimer >= 0.15);
    if (!this.isAttacking() || isAndreySpecialCancel) {
      if (isAndreySpecialCancel) {
        this.state = 'idle';
        this.specialPhase = 0;
      }
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
        this.state = 'walk';
      } else {
        this.state = 'idle';
      }
    } else {
      // Gentle friction while attacking
      this.vx *= 0.75;
      this.vz *= 0.75;
    }
  }

  triggerPunchChain() {
    this.kickComboStep = 0; // Reset kick combo if switching to punch

    if (this.punchComboStep === 0 || this.comboResetTimer <= 0) {
      // 1st punch
      this.punchComboStep = 1;
      this.state = 'punch1';
      this.stateTimer = 0.22;
      this.attackCooldown = 0.16;
      this.comboResetTimer = 0.48;
      this.hitEntities.clear();
      this.vx = this.facing * 1.5;
      Sound.playPunch();
    } else if (this.punchComboStep === 1) {
      // 2nd punch
      this.punchComboStep = 2;
      this.state = 'punch2';
      this.stateTimer = 0.24;
      this.attackCooldown = 0.18;
      this.comboResetTimer = 0.52;
      this.hitEntities.clear();
      this.vx = this.facing * 2.5;
      Sound.playPunch();
    } else if (this.punchComboStep === 2) {
      // 3rd punch: Finisher with heavy impact!
      this.punchComboStep = 3;
      this.state = 'punch3';
      this.stateTimer = 0.34;
      this.attackCooldown = 0.36;
      this.comboResetTimer = 0;
      this.hitEntities.clear();
      this.vx = this.facing * 4.5;
      Sound.playHeavyHit();
    }
  }

  triggerKickChain() {
    this.punchComboStep = 0; // Reset punch combo if switching to kick

    if (this.kickComboStep === 0 || this.comboResetTimer <= 0) {
      // 1st kick
      this.kickComboStep = 1;
      this.state = 'kick1';
      this.stateTimer = 0.24;
      this.attackCooldown = 0.18;
      this.comboResetTimer = 0.50;
      this.hitEntities.clear();
      this.vx = this.facing * 2.0;
      Sound.playKick();
    } else if (this.kickComboStep === 1) {
      // 2nd kick
      this.kickComboStep = 2;
      this.state = 'kick2';
      this.stateTimer = 0.26;
      this.attackCooldown = 0.20;
      this.comboResetTimer = 0.54;
      this.hitEntities.clear();
      this.vx = this.facing * 3.0;
      Sound.playKick();
    } else if (this.kickComboStep === 2) {
      // 3rd kick: Heavy finisher!
      this.kickComboStep = 3;
      this.state = 'kick3';
      this.stateTimer = 0.36;
      this.attackCooldown = 0.38;
      this.comboResetTimer = 0;
      this.hitEntities.clear();
      this.vx = this.facing * 5.0;
      Sound.playHeavyHit();
    }
  }

  performSpecial() {
    this.state = 'special';
    this.specialDuration = this.config.specialDuration || 1.25;
    this.stateTimer = this.specialDuration;
    this.specialMeter = 0; // Consumes 100% full SP meter
    this.isInvincible = true;
    this.invincibleTimer = this.specialDuration + 0.25;
    this.punchComboStep = 0;
    this.kickComboStep = 0;
    this.comboResetTimer = 0;
    this.hitEntities.clear();
    this.specialPhase = 1;
    this.specialImpactTriggered = false;

    // Emerson super strength: leaps up with electric fist in phase 1
    if (this.charKey === 'emerson') {
      this.vy = 5.5;
      this.vx = this.facing * 1.5;
      Sound.playSpecial();
    } else if (this.charKey === 'andrey') {
      this.vy = 0;
      this.vx = 0;
      this.andreyBots = [];
      this.andreyShots = [];
      this.andreyBotsSpawned = true;
      this.specialDuration = 0.35; // Rápida animação de convocação (0.35s) e depois livre pra bater!
      this.stateTimer = this.specialDuration;
      this.invincibleTimer = 0.8;
      this.spawnAndreyBots(this.lastCamera);
      Sound.playSpecial();
    } else if (this.charKey === 'nata') {
      this.vy = 0;
      this.vx = 0;
      this.nataLightnings = [];
      this.nataNotes = [];
      this.nataLightningTimer = 0.15;
      Sound.playGuitarRiff();
    } else if (this.charKey === 'unicao' || this.charKey === 'dog') {
      this.vy = 0;
      this.vx = 0;
      this.unicaoPlanets = [];
      this.unicaoPlanetTimer = 0.45;
      this.specialDuration = this.config.specialDuration || 3.5;
      this.stateTimer = this.specialDuration;
      this.invincibleTimer = this.specialDuration + 0.3;
      Sound.playCosmicSummon();
    } else {
      this.vx = this.facing * 4.5;
      Sound.playSpecial();
    }
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0) {
    // If player is currently in 2s respawn invincibility or already dead, ignore damage
    if (this.isInvincible || this.isDead) return false;

    this.hp -= amount;

    // Regra: O modo invencível de 2 segundos é APENAS quando o personagem morre e renasce,
    // e NUNCA quando ele toma dano normal!
    this.isInvincible = false;
    this.invincibleTimer = 0;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.state = 'fall';
      this.vy = Math.max(knockbackY, 7.5);
      this.vx = knockbackX * 1.3;
      this.deathTimer = 0.45;
    } else if (knockbackY > 4 || amount >= 25) {
      this.state = 'knockdown';
      this.stateTimer = 0.6;
      this.vy = knockbackY || 6;
      this.vx = knockbackX;
    } else {
      this.state = 'hurt';
      this.stateTimer = 0.22;
      this.vx = knockbackX * 0.4;
    }

    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    Sound.playChickenHeal();
  }

  addScore(points) {
    this.score += points;
    this.specialMeter = Math.min(100, this.specialMeter + points * 0.08);
  }

  update(dt, stageLimits, camera, particles = null) {
    this.lastCamera = camera;
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Combo chaining timer window
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.punchComboStep = 0;
        this.kickComboStep = 0;
      }
    }

    // Slowly recharge special over time
    if (this.specialMeter < 100) {
      this.specialMeter = Math.min(100, this.specialMeter + dt * 4.5);
    }

    this.updatePhysics(dt, stageLimits);

    // Multi-frame special phases & physics
    if (this.state === 'special') {
      if (this.charKey === 'emerson') {
        const total = this.specialDuration || 1.25;
        const elapsed = total - this.stateTimer;
        if (elapsed < 0.35) {
          this.specialPhase = 1;
        } else if (elapsed < 0.65) {
          this.specialPhase = 2;
          this.y = 0;
          this.vy = 0;
          this.vx = 0;
        } else {
          this.specialPhase = 3;
          this.y = 0;
          this.vy = 0;
          this.vx = 0;
        }
      } else if (this.charKey === 'andrey') {
        const total = this.specialDuration || 0.35;
        this.specialPhase = 2; // Transmitting wifi / radio wave call
        if (!this.andreyBotsSpawned) {
          this.andreyBotsSpawned = true;
          this.spawnAndreyBots(camera);
        }
        this.y = 0;
        this.vy = 0;
        this.vx = 0;
      } else if (this.charKey === 'nata') {
        const total = this.specialDuration || 3.2;
        const elapsed = total - this.stateTimer;
        // Cycle smoothly through 5 guitar playing poses (sprites nata_victory1..5)
        this.specialPhase = 1 + (Math.floor(elapsed * 5.0) % 5);
        this.y = 0;
        this.vy = 0;
        this.vx = 0;

        // Periodic lightning storm strikes across screen
        this.nataLightningTimer -= dt;
        if (this.nataLightningTimer <= 0 && elapsed < total - 0.25) {
          this.nataLightningTimer = 0.22 + Math.random() * 0.08;
          this.spawnNataLightning(camera);
        }

        // Emit musical notes and electric shock sparks around Nata while rocking out
        if (Math.random() < 0.45) {
          this.spawnNataAuraNote();
        }
      } else if (this.charKey === 'unicao' || this.charKey === 'dog') {
        const total = this.specialDuration || 3.5;
        const elapsed = total - this.stateTimer;
        // Poses:
        // 0.0s - 0.7s: Phase 1 (charging power stance dog_special1)
        // 0.7s - 1.8s: Phase 2 (cosmic howling with huge flaming aura dog_special2)
        // 1.8s - 3.5s: Phase 3 (pointing to the sky with summoning circle dog_special3)
        if (elapsed < 0.7) {
          this.specialPhase = 1;
        } else if (elapsed < 1.8) {
          this.specialPhase = 2;
        } else {
          this.specialPhase = 3;
        }
        this.y = 0;
        this.vy = 0;
        this.vx = 0;

        // Periodic random falling planets across screen
        this.unicaoPlanetTimer -= dt;
        if (this.unicaoPlanetTimer <= 0 && elapsed < total - 0.3) {
          this.unicaoPlanetTimer = 0.28 + Math.random() * 0.12;
          this.spawnUnicaoPlanet(camera);
        }
      } else {
        this.specialPhase = 1;
      }
    } else {
      this.specialPhase = 0;
      this.specialImpactTriggered = false;
      this.andreyBotsSpawned = false;
    }

    // Keep player within visible camera screen bounds
    const screenLeft = camera.x + 35;
    const screenRight = camera.x + camera.width - 35;
    if (this.x < screenLeft) this.x = screenLeft;
    if (this.x > screenRight) this.x = screenRight;

    // Reset attacking states when stateTimer expires
    if (this.stateTimer <= 0) {
      if (this.isAttacking()) {
        this.state = 'idle';
        this.specialPhase = 0;
        this.specialImpactTriggered = false;
        if (this.punchComboStep === 3) this.punchComboStep = 0;
        if (this.kickComboStep === 3) this.kickComboStep = 0;
      }
    }

    // Always update active AndreyBots and their falling plasma shots
    if (this.andreyBots.length > 0 || this.andreyShots.length > 0) {
      this.updateAndreyBots(dt, camera, particles);
    }

    // Always update active Nata lightning strikes and floating music notes
    if (this.nataLightnings.length > 0 || this.nataNotes.length > 0) {
      this.updateNataLightnings(dt, camera, particles);
    }

    // Always update active Unicao falling planets
    if (this.unicaoPlanets.length > 0) {
      this.updateUnicaoPlanets(dt, camera, particles);
    }
  }

  // Get current attack hitbox based on active state (punch1, punch2, punch3, kick1, kick2, kick3, special)
  getAttackHitbox() {
    if (!this.isAttacking()) return null;

    let reach = 60;
    let damage = this.config.damage.punch;
    let knockbackX = this.facing * 3.5;
    let knockbackY = 1.5;

    // PUNCH CHAIN
    if (this.state === 'punch1') {
      damage = this.config.damage.punch;
      reach = 60;
      knockbackX = this.facing * 3.5;
      knockbackY = 1.5;
    } else if (this.state === 'punch2') {
      damage = Math.floor(this.config.damage.punch * 1.35);
      reach = 68;
      knockbackX = this.facing * 5.5;
      knockbackY = 2.5;
    } else if (this.state === 'punch3') {
      damage = Math.floor(this.config.damage.punch * 2.0);
      reach = 85;
      knockbackX = this.facing * 9.5;
      knockbackY = 6.0; // Knockdown!
    }
    // KICK CHAIN
    else if (this.state === 'kick1') {
      damage = this.config.damage.kick;
      reach = 65;
      knockbackX = this.facing * 4.0;
      knockbackY = 2.0;
    } else if (this.state === 'kick2') {
      damage = Math.floor(this.config.damage.kick * 1.35);
      reach = 75;
      knockbackX = this.facing * 6.5;
      knockbackY = 3.5;
    } else if (this.state === 'kick3') {
      damage = Math.floor(this.config.damage.kick * 2.1);
      reach = 90;
      knockbackX = this.facing * 10.5;
      knockbackY = 6.5; // Heavy Knockdown!
    }
    // SPECIAL
    else if (this.state === 'special') {
      // Emerson, Andrey, Nata, and Unicao specials are handled via custom area/drone/lightning/planet mechanics
      if (this.charKey === 'emerson' || this.charKey === 'andrey' || this.charKey === 'nata' || this.charKey === 'unicao' || this.charKey === 'dog') return null;

      damage = this.config.damage.special;
      reach = 100;
      knockbackX = this.facing * 11.0;
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
      damage: damage,
      knockbackX: knockbackX,
      knockbackY: knockbackY
    };
  }

  // Spawn the 3 AndreyBots patrolling across the screen
  spawnAndreyBots(camera) {
    Sound.playBotSummon();
    const camLeft = camera ? camera.x : this.x - 200;
    const camW = camera ? camera.width : 960;

    // 3 distinct AndreyBots flying at different altitudes, depths, and directions
    this.andreyBots = [
      {
        id: 1,
        x: camLeft + 100,
        z: this.z - 40,
        baseY: 200,
        y: 200,
        vx: 6.2,
        facing: 1,
        hoverTimer: 0,
        dropTimer: 0.1, // Dobro da frequência de tiros
        scale: 0.36,
        color: '#00ff88',
        life: 4.5
      },
      {
        id: 2,
        x: camLeft + camW - 120,
        z: this.z + 5,
        baseY: 235,
        y: 235,
        vx: -5.6,
        facing: -1,
        hoverTimer: 1.5,
        dropTimer: 0.22, // Dobro da frequência de tiros
        scale: 0.34,
        color: '#00e5ff',
        life: 4.5
      },
      {
        id: 3,
        x: camLeft + 220,
        z: this.z + 45,
        baseY: 175,
        y: 175,
        vx: 6.8,
        facing: 1,
        hoverTimer: 3.0,
        dropTimer: 0.16, // Dobro da frequência de tiros
        scale: 0.38,
        color: '#39ff14',
        life: 4.5
      }
    ];
  }

  // Update AndreyBots patrol ("indo e voltando") and their falling plasma shots
  updateAndreyBots(dt, camera, particles) {
    const camLeft = camera ? camera.x + 35 : 0;
    const camRight = camera ? camera.x + camera.width - 35 : 2000;

    // 1. Update each bot
    for (let i = this.andreyBots.length - 1; i >= 0; i--) {
      const bot = this.andreyBots[i];
      bot.life -= dt;
      bot.hoverTimer += dt;
      bot.y = bot.baseY + Math.sin(bot.hoverTimer * 5.5) * 12;

      // Move horizontally
      bot.x += bot.vx * dt * 60;

      // Rebound at screen edges ("indo e voltando")
      if (bot.x >= camRight && bot.vx > 0) {
        bot.vx = -Math.abs(bot.vx);
        bot.facing = -1;
      } else if (bot.x <= camLeft && bot.vx < 0) {
        bot.vx = Math.abs(bot.vx);
        bot.facing = 1;
      }

      // Thruster particle trail
      if (particles && Math.random() < 0.6) {
        particles.addHitSparks(bot.x - bot.facing * 10, bot.y - 12, bot.z, bot.color, 1);
      }

      // Drop plasma bomb shots (dobro de tiros: cadência de 0.18s a 0.24s)
      bot.dropTimer -= dt;
      if (bot.dropTimer <= 0 && bot.life > 0.3) {
        bot.dropTimer = 0.18 + Math.random() * 0.06;
        Sound.playLaserDrop();
        this.andreyShots.push({
          x: bot.x,
          z: bot.z + (Math.random() - 0.5) * 20,
          y: bot.y - 15,
          vx: bot.vx * 0.22,
          vy: -7.5,
          color: bot.color,
          radius: 12,
          isDead: false
        });
      }

      // When bot life expires, it launches upwards off the screen
      if (bot.life <= 0) {
        bot.baseY += 18 * dt * 60;
        if (bot.y > 450) {
          this.andreyBots.splice(i, 1);
        }
      }
    }

    // 2. Update falling shots
    for (let i = this.andreyShots.length - 1; i >= 0; i--) {
      const shot = this.andreyShots[i];
      shot.x += shot.vx * dt * 60;
      shot.y += shot.vy * dt * 60;

      // Trail sparks
      if (particles && Math.random() < 0.5) {
        particles.addHitSparks(shot.x, shot.y, shot.z, shot.color, 1);
      }

      // Hit the ground
      if (shot.y <= 0) {
        shot.isDead = true;
        if (particles) {
          particles.addHitSparks(shot.x, 8, shot.z, shot.color, 8);
          particles.addShockwave(shot.x, shot.z, 35, shot.color);
        }
      }

      if (shot.isDead) {
        this.andreyShots.splice(i, 1);
      }
    }
  }

  // Draw active AndreyBots and falling plasma shots in world space
  drawBots(ctx, camera, imageLoader) {
    const botImg = imageLoader.getImage('assets/images/sprites/characters/andrey_bot.png');

    // 1. Draw bot shadows on the ground
    for (const bot of this.andreyBots) {
      const screenX = camera.toScreenX(bot.x);
      const screenY = camera.toScreenY(bot.z);
      const depthScale = 0.8 + (bot.z / 600) * 0.35;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.beginPath();
      ctx.ellipse(screenX, screenY, 24 * depthScale, 8 * depthScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Draw AndreyBots in the air
    for (const bot of this.andreyBots) {
      const screenX = camera.toScreenX(bot.x);
      const screenY = camera.toScreenY(bot.z - bot.y);
      const w = 240 * bot.scale;
      const h = 192 * bot.scale;

      ctx.save();
      ctx.translate(screenX, screenY);
      if (bot.facing === -1) {
        ctx.scale(-1, 1);
      }

      // Drone glow
      ctx.shadowBlur = 14;
      ctx.shadowColor = bot.color;

      if (botImg) {
        ctx.drawImage(botImg, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = '#ff7755';
        ctx.fillRect(-20, -18, 40, 36);
      }

      // Thruster flame jets under legs
      ctx.fillStyle = bot.color;
      ctx.beginPath();
      ctx.arc(-14, h / 2 - 2, 4 + Math.random() * 3, 0, Math.PI * 2);
      ctx.arc(14, h / 2 - 2, 4 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 3. Draw falling shots
    for (const shot of this.andreyShots) {
      if (shot.isDead) continue;
      const sx = camera.toScreenX(shot.x);
      const sy = camera.toScreenY(shot.z - shot.y);
      const r = shot.radius || 11;

      // Ground target reticle below falling shot
      const groundY = camera.toScreenY(shot.z);
      const fallProgress = Math.min(1, Math.max(0, 1 - shot.y / 240));
      ctx.save();
      ctx.fillStyle = `rgba(0, 255, 136, ${0.15 + fallProgress * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(sx, groundY, 15 * fallProgress, 6 * fallProgress, 0, 0, Math.PI * 2);
      ctx.fill();

      // Plasma projectile orb
      ctx.translate(sx, sy);
      ctx.shadowBlur = 14;
      ctx.shadowColor = shot.color;

      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#a8ffc4');
      grad.addColorStop(0.85, shot.color);
      grad.addColorStop(1, 'rgba(0, 255, 136, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Energy tail
      ctx.fillStyle = 'rgba(0, 255, 136, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.9, r * 0.45, r * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Spawn musical aura note or </> shock around Nata while playing guitar
  spawnNataAuraNote() {
    const chars = ['♪', '♫', '♬', '♩'];
    const colors = ['#ffd700', '#00ffff', '#ff007f', '#a855f7', '#ffffff', '#39ff14'];
    const isShock = Math.random() < 0.42;
    this.nataNotes.push({
      text: isShock ? '</>' : chars[Math.floor(Math.random() * chars.length)],
      isShock: isShock,
      x: this.x + (Math.random() - 0.5) * 55,
      z: this.z + (Math.random() - 0.5) * 20,
      y: 40 + Math.random() * 60,
      vx: (Math.random() - 0.5) * 3,
      vy: 2.2 + Math.random() * 2.5,
      alpha: 1.0,
      scale: isShock ? 0.95 : 1.25,
      color: isShock ? '#00e5ff' : colors[Math.floor(Math.random() * colors.length)],
      life: 0.9,
      maxLife: 0.9,
      sway: Math.random() * Math.PI * 2
    });
  }

  // Spawn a random lightning bolt strike across the stage
  spawnNataLightning(camera) {
    const camLeft = camera ? camera.x + 60 : this.x - 300;
    const camW = camera ? camera.width - 120 : 720;
    const targetX = camLeft + Math.random() * camW;
    const targetZ = 370 + Math.random() * 140;

    // Pre-calculate zig-zag lightning vertices from sky (y=520) down to ground (y=0)
    const segments = [];
    let curX = targetX + (Math.random() - 0.5) * 70;
    let curY = 520;
    segments.push({ x: curX, y: curY });
    while (curY > 0) {
      curY -= 32 + Math.random() * 28;
      if (curY < 0) curY = 0;
      curX += (Math.random() - 0.5) * 38;
      if (curY === 0) curX = targetX;
      segments.push({ x: curX, y: curY });
    }

    this.nataLightnings.push({
      x: targetX,
      z: targetZ,
      stage: 'warning', // 'warning' -> 'strike' -> 'fading'
      warningTimer: 0.22,
      strikeTimer: 0.18,
      fadeTimer: 0.45,
      hasDamaged: false,
      hasSoundPlayed: false,
      segments: segments,
      burstElements: []
    });
  }

  // Update active lightning strikes, shock signs </>, and music notes
  updateNataLightnings(dt, camera, particles) {
    // 1. Update lightning strikes
    for (let i = this.nataLightnings.length - 1; i >= 0; i--) {
      const strike = this.nataLightnings[i];

      if (strike.stage === 'warning') {
        strike.warningTimer -= dt;
        if (strike.warningTimer <= 0) {
          strike.stage = 'strike';
          if (!strike.hasSoundPlayed) {
            strike.hasSoundPlayed = true;
            Sound.playLightningStrike();
          }

          // Spawn burst of shock symbols </> and musical notes at ground impact
          const noteChars = ['♪', '♫', '♬', '♩'];
          const noteColors = ['#ffd700', '#00ffff', '#ff007f', '#a855f7', '#ffffff'];

          // 5 Shock symbols </>
          for (let s = 0; s < 5; s++) {
            const angle = (Math.PI * 2 * s) / 5 + (Math.random() - 0.5) * 0.4;
            const speed = 2.5 + Math.random() * 4.0;
            strike.burstElements.push({
              text: '</>',
              isShock: true,
              x: strike.x,
              z: strike.z,
              y: 10 + Math.random() * 25,
              vx: Math.cos(angle) * speed,
              vy: 3.5 + Math.random() * 4.0,
              vz: Math.sin(angle) * (speed * 0.5),
              alpha: 1.0,
              scale: 1.1 + Math.random() * 0.4,
              color: ['#00e5ff', '#ffd700', '#ffffff', '#00ff88'][Math.floor(Math.random() * 4)],
              life: 0.65,
              maxLife: 0.65,
              sway: Math.random() * 6
            });
          }

          // 5 Musical notes
          for (let n = 0; n < 5; n++) {
            const angle = (Math.PI * 2 * n) / 5 + (Math.random() - 0.5) * 0.5;
            const speed = 2.0 + Math.random() * 3.5;
            strike.burstElements.push({
              text: noteChars[Math.floor(Math.random() * noteChars.length)],
              isShock: false,
              x: strike.x,
              z: strike.z,
              y: 15 + Math.random() * 25,
              vx: Math.cos(angle) * speed,
              vy: 4.0 + Math.random() * 3.5,
              vz: Math.sin(angle) * (speed * 0.5),
              alpha: 1.0,
              scale: 1.35 + Math.random() * 0.4,
              color: noteColors[Math.floor(Math.random() * noteColors.length)],
              life: 0.75,
              maxLife: 0.75,
              sway: Math.random() * 6
            });
          }

          if (particles) {
            particles.addShockwave(strike.x, strike.z, 75, '#00e5ff');
            particles.addHitSparks(strike.x, 20, strike.z, '#ffd700', 16);
          }
        }
      } else if (strike.stage === 'strike') {
        strike.strikeTimer -= dt;
        if (strike.strikeTimer <= 0) {
          strike.stage = 'fading';
        }
      } else if (strike.stage === 'fading') {
        strike.fadeTimer -= dt;
      }

      // Update burst elements within this strike
      for (let j = strike.burstElements.length - 1; j >= 0; j--) {
        const el = strike.burstElements[j];
        el.life -= dt;
        el.x += el.vx * dt * 60;
        el.y += el.vy * dt * 60;
        el.z += el.vz * dt * 60;
        el.vy -= 8.0 * dt; // Gravity
        el.sway += dt * 5;
        el.alpha = Math.max(0, el.life / el.maxLife);
        if (el.life <= 0) {
          strike.burstElements.splice(j, 1);
        }
      }

      if (strike.stage === 'fading' && strike.fadeTimer <= 0 && strike.burstElements.length === 0) {
        this.nataLightnings.splice(i, 1);
      }
    }

    // 2. Update aura notes around Nata
    for (let i = this.nataNotes.length - 1; i >= 0; i--) {
      const note = this.nataNotes[i];
      note.life -= dt;
      note.x += note.vx * dt * 60;
      note.y += note.vy * dt * 60;
      note.sway += dt * 4;
      note.alpha = Math.max(0, note.life / note.maxLife);
      if (note.life <= 0) {
        this.nataNotes.splice(i, 1);
      }
    }
  }

  // Draw Nata's lightning storm, </> shock signs, and musical notes in world space
  drawNataLightnings(ctx, camera) {
    if (this.nataLightnings.length === 0 && this.nataNotes.length === 0) return;

    // 1. Draw lightning warning indicators and lightning bolts
    for (const strike of this.nataLightnings) {
      const sx = camera.toScreenX(strike.x);
      const groundY = camera.toScreenY(strike.z);

      if (strike.stage === 'warning') {
        // Warning zone on floor with glowing ellipse and crackling </>
        const progress = 1 - (strike.warningTimer / 0.22);
        const radius = 32 + progress * 14;

        ctx.save();
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + progress * 0.5})`;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00e5ff';
        ctx.beginPath();
        ctx.ellipse(sx, groundY, radius, radius * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing warning text </> on ground
        ctx.font = 'bold 16px "Courier New", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + progress * 0.4})`;
        ctx.shadowColor = '#ffd700';
        ctx.fillText('</>', sx, groundY);
        ctx.restore();
      } else if (strike.stage === 'strike' || (strike.stage === 'fading' && strike.fadeTimer > 0.3)) {
        // High-voltage giant lightning bolt from sky to ground
        const alpha = strike.stage === 'strike' ? 1.0 : (strike.fadeTimer / 0.45);
        const segs = strike.segments;
        if (segs && segs.length > 1) {
          ctx.save();
          // Outer cyan/purple aura
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.85 * alpha})`;
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'miter';
          ctx.shadowBlur = 24;
          ctx.shadowColor = '#00e5ff';

          ctx.beginPath();
          ctx.moveTo(camera.toScreenX(segs[0].x), camera.toScreenY(strike.z - segs[0].y));
          for (let k = 1; k < segs.length; k++) {
            ctx.lineTo(camera.toScreenX(segs[k].x), camera.toScreenY(strike.z - segs[k].y));
          }
          ctx.stroke();

          // Electric magenta core
          ctx.strokeStyle = `rgba(255, 0, 180, ${0.9 * alpha})`;
          ctx.lineWidth = 7;
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#ff00aa';
          ctx.stroke();

          // Hot white central arc
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 3.2;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffffff';
          ctx.stroke();

          // Ground impact flash
          const flashGrad = ctx.createRadialGradient(sx, groundY, 4, sx, groundY, 55);
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alpha})`);
          flashGrad.addColorStop(0.35, `rgba(0, 229, 255, ${0.75 * alpha})`);
          flashGrad.addColorStop(0.8, `rgba(189, 0, 255, ${0.35 * alpha})`);
          flashGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.ellipse(sx, groundY, 55, 22, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // Draw burst shock symbols </> and musical notes
      for (const el of strike.burstElements) {
        const elSx = camera.toScreenX(el.x);
        const elSy = camera.toScreenY(el.z - el.y);

        ctx.save();
        ctx.globalAlpha = el.alpha;
        ctx.translate(elSx, elSy);
        ctx.scale(el.scale, el.scale);

        if (el.isShock) {
          ctx.font = '900 18px "Courier New", monospace, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowBlur = 12;
          ctx.shadowColor = el.color;
          ctx.fillStyle = el.color;
          ctx.fillText(el.text, 0, 0);

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#ffffff';
          ctx.strokeText(el.text, 0, 0);
        } else {
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowBlur = 14;
          ctx.shadowColor = el.color;
          ctx.fillStyle = el.color;
          ctx.fillText(el.text, Math.sin(el.sway) * 4, 0);
        }
        ctx.restore();
      }
    }

    // 2. Draw rockstar aura notes & sparks around Nata
    for (const note of this.nataNotes) {
      const nsx = camera.toScreenX(note.x);
      const nsy = camera.toScreenY(note.z - note.y);

      ctx.save();
      ctx.globalAlpha = note.alpha;
      ctx.translate(nsx, nsy);
      ctx.scale(note.scale, note.scale);

      if (note.isShock) {
        ctx.font = '900 17px "Courier New", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 10;
        ctx.shadowColor = note.color;
        ctx.fillStyle = note.color;
        ctx.fillText(note.text, 0, 0);
      } else {
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 12;
        ctx.shadowColor = note.color;
        ctx.fillStyle = note.color;
        ctx.fillText(note.text, Math.sin(note.sway) * 5, 0);
      }
      ctx.restore();
    }
  }

  // Spawn a random fiery falling planet across the stage
  spawnUnicaoPlanet(camera) {
    const camLeft = camera ? camera.x + 50 : this.x - 250;
    const camW = camera ? camera.width - 100 : 760;
    const targetX = camLeft + Math.random() * camW;
    const targetZ = 365 + Math.random() * 145;

    // Pick 1 of the 3 planet types: 1 = Saturn, 2 = Jupiter, 3 = Giant Lava Planet
    const planetType = Math.floor(Math.random() * 3) + 1;
    const scales = { 1: 0.68, 2: 0.78, 3: 0.88 };
    const baseRadii = { 1: 45, 2: 55, 3: 72 };

    // Falling diagonally from top-left (following the flame angle) to target ground
    const startAltitude = 480 + Math.random() * 80;
    const fallDistanceX = 220 + Math.random() * 60;
    const startX = targetX - fallDistanceX;

    this.unicaoPlanets.push({
      type: planetType,
      targetX: targetX,
      targetZ: targetZ,
      x: startX,
      y: startAltitude,
      startY: startAltitude,
      z: targetZ,
      vx: (targetX - startX) / 0.52,
      vy: -startAltitude / 0.52,
      scale: scales[planetType],
      hitRadius: baseRadii[planetType],
      stage: 'falling', // 'falling' -> 'impact' -> 'dead'
      impactTimer: 0.35,
      hasHitTarget: false,
      debris: []
    });
  }

  // Update active falling planets, trail particles, and explosive impact crater
  updateUnicaoPlanets(dt, camera, particles) {
    for (let i = this.unicaoPlanets.length - 1; i >= 0; i--) {
      const p = this.unicaoPlanets[i];

      if (p.stage === 'falling') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Trail sparks and fiery smoke in the sky
        if (particles && Math.random() < 0.6) {
          const sparkColor = p.type === 3 ? '#ff2200' : (p.type === 2 ? '#ffaa00' : '#ff5500');
          particles.addHitSparks(p.x, p.y * 0.5, p.z, sparkColor, 2);
        }

        // Planet crashes into the stage ground!
        if (p.y <= 0) {
          p.y = 0;
          p.stage = 'impact';
          Sound.playMeteorCrash();

          // Explosive fiery shockwaves & volcanic debris
          if (particles) {
            const shockColor = p.type === 3 ? '#ff1100' : '#ff7700';
            particles.addShockwave(p.targetX, p.targetZ, 125 * p.scale, shockColor);
            particles.addHitSparks(p.targetX, 30, p.targetZ, '#ffcc00', 25);
            particles.addHitSparks(p.targetX, 15, p.targetZ, '#ff3300', 20);
          }

          // Generate fiery crater debris fragments flying outward
          for (let d = 0; d < 8; d++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 3.5 + Math.random() * 6.0;
            p.debris.push({
              x: p.targetX,
              y: 10 + Math.random() * 20,
              z: p.targetZ,
              vx: Math.cos(angle) * spd,
              vy: 4.0 + Math.random() * 5.0,
              vz: Math.sin(angle) * (spd * 0.45),
              color: ['#ffdd00', '#ff5500', '#ff0000', '#441100'][Math.floor(Math.random() * 4)],
              size: 4 + Math.random() * 6,
              alpha: 1.0,
              life: 0.45
            });
          }
        }
      } else if (p.stage === 'impact') {
        p.impactTimer -= dt;

        // Update debris
        for (let d = p.debris.length - 1; d >= 0; d--) {
          const deb = p.debris[d];
          deb.life -= dt;
          deb.x += deb.vx * dt * 60;
          deb.y += deb.vy * dt * 60;
          deb.z += deb.vz * dt * 60;
          deb.vy -= 10.0 * dt; // Gravity
          deb.alpha = Math.max(0, deb.life / 0.45);
          if (deb.life <= 0) p.debris.splice(d, 1);
        }

        if (p.impactTimer <= 0 && p.debris.length === 0) {
          p.stage = 'dead';
          this.unicaoPlanets.splice(i, 1);
        }
      }
    }
  }

  // Draw falling planets, impact reticles, and explosive fire craters in world space
  drawUnicaoPlanets(ctx, camera, imageLoader) {
    if (this.unicaoPlanets.length === 0) return;

    for (const p of this.unicaoPlanets) {
      const groundSx = camera.toScreenX(p.targetX);
      const groundSy = camera.toScreenY(p.targetZ);

      // 1. Draw glowing fiery impact crater reticle on the ground
      if (p.stage === 'falling') {
        const fallProgress = Math.min(1, Math.max(0, 1 - p.y / p.startY));
        const craterRadius = (35 + fallProgress * 45) * p.scale;

        ctx.save();
        ctx.fillStyle = `rgba(255, 68, 0, ${0.15 + fallProgress * 0.45})`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#ff3300';
        ctx.beginPath();
        ctx.ellipse(groundSx, groundSy, craterRadius, craterRadius * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 204, 0, ${0.4 + fallProgress * 0.6})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Pulsing warning celestial marker
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('🪐', groundSx, groundSy);
        ctx.restore();
      }

      // 2. Draw falling planet in the sky
      if (p.stage === 'falling') {
        const sx = camera.toScreenX(p.x);
        const sy = camera.toScreenY(p.z - p.y);
        const imgKey = `assets/images/sprites/characters/dog_planet${p.type}.png`;
        const planetImg = imageLoader ? imageLoader.getImage(imgKey) : null;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(p.scale, p.scale);

        // Blazing re-entry atmospheric glow
        ctx.shadowBlur = 28;
        ctx.shadowColor = p.type === 3 ? '#ff2200' : '#ff9900';

        if (planetImg) {
          const pw = planetImg.width || 260;
          const ph = planetImg.height || 260;
          ctx.drawImage(planetImg, -pw / 2, -ph / 2, pw, ph);
        } else {
          ctx.fillStyle = '#ff5500';
          ctx.beginPath();
          ctx.arc(0, 0, 50, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Draw impact explosion crater & debris
      if (p.stage === 'impact') {
        const progress = Math.max(0, p.impactTimer / 0.35);

        ctx.save();
        // Explosive radial fire flash
        const flashGrad = ctx.createRadialGradient(groundSx, groundSy, 5, groundSx, groundSy, 95 * p.scale);
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * progress})`);
        flashGrad.addColorStop(0.35, `rgba(255, 170, 0, ${0.8 * progress})`);
        flashGrad.addColorStop(0.7, `rgba(255, 34, 0, ${0.5 * progress})`);
        flashGrad.addColorStop(1, 'rgba(255, 34, 0, 0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.ellipse(groundSx, groundSy, 95 * p.scale, 38 * p.scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flying fiery rock debris
        for (const deb of p.debris) {
          const dsx = camera.toScreenX(deb.x);
          const dsy = camera.toScreenY(deb.z - deb.y);
          ctx.fillStyle = deb.color;
          ctx.globalAlpha = deb.alpha;
          ctx.beginPath();
          ctx.arc(dsx, dsy, deb.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  respawn(spawnX, spawnZ) {
    this.hp = this.maxHp;
    this.isDead = false;
    this.state = 'idle';
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
    this.invincibleTimer = 2.0;
    this.andreyBots = [];
    this.andreyShots = [];
    this.nataLightnings = [];
    this.nataNotes = [];
    this.unicaoPlanets = [];
  }
}


