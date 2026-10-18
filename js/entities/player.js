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
    this.kickComboStep = 0;  // 0, 1, 2, 3
    this.comboResetTimer = 0; // Window to chain into next combo hit
    this.hitEntities = new Set(); // Prevent multi-hits per attack swing
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

    // Special Attack
    if (input.isActionPressed('special')) {
      if (this.specialMeter >= 40 && this.state !== 'special') {
        this.performSpecial();
        return;
      }
    }

    // Jump
    if (input.isActionPressed('jump') && this.y === 0 && !this.isAttacking() && this.state !== 'jump') {
      this.state = 'jump';
      this.vy = 10.5;
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
    this.stateTimer = this.config.specialDuration;
    this.specialMeter = Math.max(0, this.specialMeter - 40);
    this.isInvincible = true;
    this.invincibleTimer = this.config.specialDuration + 0.15;
    this.punchComboStep = 0;
    this.kickComboStep = 0;
    this.comboResetTimer = 0;
    this.hitEntities.clear();

    // Emerson super strength: lunges with seismic shockwave
    this.vx = this.facing * (this.charKey === 'emerson' ? 6.0 : 4.5);
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

    // Keep player within visible camera screen bounds
    const screenLeft = camera.x + 35;
    const screenRight = camera.x + camera.width - 35;
    if (this.x < screenLeft) this.x = screenLeft;
    if (this.x > screenRight) this.x = screenRight;

    // Reset attacking states when stateTimer expires
    if (this.stateTimer <= 0) {
      if (this.isAttacking()) {
        this.state = 'idle';
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
  }
}
