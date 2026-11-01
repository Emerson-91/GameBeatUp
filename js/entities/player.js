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

    // Special Attack Helpers (AndreyBots & Projectiles)
    this.andreyBots = [];
    this.andreyShots = [];
    this.andreyBotsSpawned = false;

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
    if (input.isActionPressed('jump') && this.y === 0 && !this.isAttacking() && this.state !== 'jump') {
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

    // Ground Combo Attacks: 3 Punches & 3 Kicks Chain
    if (this.state !== 'special') {
      // PUNCH CHAIN: 1st press -> punch1, 2nd press -> punch2, 3rd press -> punch3
      if (input.isActionPressed('punch') && this.attackCooldown <= 0) {
        this.triggerPunchChain();
        return;
      }

      // KICK CHAIN: 1st press -> kick1, 2nd press -> kick2, 3rd press -> kick3
      if (input.isActionPressed('kick') && this.attackCooldown <= 0) {
        this.triggerKickChain();
        return;
      }
    }

    // Movement if not locked in attack
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
    } else if (this.charKey === 'andrey') {
      this.vy = 0;
      this.vx = 0;
      this.andreyBots = [];
      this.andreyShots = [];
      this.andreyBotsSpawned = false;
    } else {
      this.vx = this.facing * 4.5;
    }
    Sound.playSpecial();
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
        const total = this.specialDuration || 4.5;
        const elapsed = total - this.stateTimer;
        if (elapsed < 0.5) {
          this.specialPhase = 1; // Powering up remote with green flame
        } else if (elapsed < 1.1) {
          this.specialPhase = 2; // Transmitting wifi / radio wave call
          if (!this.andreyBotsSpawned) {
            this.andreyBotsSpawned = true;
            this.spawnAndreyBots(camera);
          }
        } else {
          this.specialPhase = 3; // Commanding 3 bots with forward pointing green flame
        }
        this.y = 0;
        this.vy = 0;
        this.vx = 0;
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
      // Emerson and Andrey specials are handled via custom area/drone mechanics
      if (this.charKey === 'emerson' || this.charKey === 'andrey') return null;

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
        dropTimer: 0.2,
        scale: 0.36,
        color: '#00ff88',
        life: 3.8
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
        dropTimer: 0.45,
        scale: 0.34,
        color: '#00e5ff',
        life: 3.8
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
        dropTimer: 0.35,
        scale: 0.38,
        color: '#39ff14',
        life: 3.8
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

      // Drop plasma bomb shots
      bot.dropTimer -= dt;
      if (bot.dropTimer <= 0 && bot.life > 0.4) {
        bot.dropTimer = 0.38 + Math.random() * 0.12;
        Sound.playLaserDrop();
        this.andreyShots.push({
          x: bot.x,
          z: bot.z + (Math.random() - 0.5) * 16,
          y: bot.y - 15,
          vx: bot.vx * 0.22,
          vy: -7.5,
          color: bot.color,
          radius: 11,
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
  }
}
