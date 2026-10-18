import { Entity } from './entity.js';
import { BOSS_CONFIGS } from '../data/charactersData.js';
import { Sound } from '../core/audio.js';

export class BossProjectile {
  constructor(x, z, y, vx, vy, vz, type = 'tornado', scale = 1.0) {
    this.x = x;
    this.z = z;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.type = type; // 'tornado' | 'meteor'
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
    if (this.life <= 0 || (this.type === 'meteor' && this.y <= 0)) {
      this.isDead = true;
    }
  }

  draw(ctx, camera, imageLoader) {
    let src = '';
    let w = 200;
    let h = 200;

    if (this.type === 'tornado') {
      src = 'assets/images/sprites/boss6/tornado.png';
      w = 271;
      h = 331;
    } else {
      const meteorIndex = (Math.floor(this.frame) % 4) + 1;
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
    // Draw projectile glow
    ctx.shadowBlur = 18;
    ctx.shadowColor = this.type === 'tornado' ? '#00e5ff' : '#ff5500';
    ctx.drawImage(img, (-w * s) / 2, (-h * s) / 2, w * s, h * s);
    ctx.restore();
  }
}

export class Boss extends Entity {
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

    // Boss Battle State
    this.superArmor = 50; // Takes multiple hits to flinch
    this.superArmorMax = 50;
    this.specialCooldown = config.specialCooldown || 7;
    this.specialTimer = 3.0; // Initial delay before first special

    this.attackCooldown = 1.0;
    this.aiState = 'combat'; // 'intro' | 'combat' | 'special_cast' | 'defeated'
    this.introTimer = 2.0;

    this.hitPlayerThisSwing = false;
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0) {
    if (this.isInvincible || this.isDead) return false;

    this.hp -= amount;
    this.superArmor -= amount;
    this.isInvincible = true;
    this.invincibleTimer = 0.25;

    // Boss flinches only when super armor breaks or on heavy special
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.aiState = 'defeated';
      this.state = 'fall';
      this.vy = 8;
      this.vx = knockbackX * 1.5;
      Sound.playHeavyHit();
    } else if (this.superArmor <= 0) {
      this.superArmor = this.superArmorMax;
      this.state = 'knockdown';
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
    // Update active projectiles
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

    // Intro roar/pause
    if (this.introTimer > 0) {
      this.introTimer -= dt;
      this.state = 'idle';
      this.updatePhysics(dt, stageLimits);
      return;
    }

    if (this.state === 'knockdown' || this.state === 'fall' || this.state === 'crouch') {
      this.updatePhysics(dt, stageLimits);
      return;
    }

    if (!this.player || this.player.isDead) {
      this.state = 'idle';
      this.updatePhysics(dt, stageLimits);
      return;
    }

    // Timers
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.specialTimer > 0) this.specialTimer -= dt;

    const dx = this.player.x - this.x;
    const dz = this.player.z - this.z;
    const absDx = Math.abs(dx);
    const absDz = Math.abs(dz);

    this.facing = dx >= 0 ? 1 : -1;

    // Special Trigger
    if (this.specialTimer <= 0 && this.state !== 'special') {
      this.castSpecial(camera);
      return;
    }

    // Handle Active Special
    if (this.state === 'special') {
      this.vx *= 0.9;
      this.vz *= 0.9;
      this.updatePhysics(dt, stageLimits);
      if (this.stateTimer <= 0) {
        this.state = 'idle';
      }
      return;
    }

    // Regular melee combat
    if (this.state === 'punch' || this.state === 'kick') {
      this.vx *= 0.85;
      this.vz *= 0.85;
    } else {
      if (absDx < 75 && absDz < 28 && this.attackCooldown <= 0) {
        // Melee attack
        const isKick = Math.random() < 0.45;
        this.state = isKick ? 'kick' : 'punch';
        this.stateTimer = 0.32;
        this.attackCooldown = 1.0 + Math.random() * 0.8;
        this.hitPlayerThisSwing = false;
        if (isKick) Sound.playKick();
        else Sound.playPunch();
      } else {
        // Move towards player
        let moveX = Math.sign(dx);
        let moveZ = Math.sign(dz);
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (len > 0) {
          this.vx = (moveX / len) * this.speed;
          this.vz = (moveZ / len) * (this.speed * 0.7);
          this.state = 'walk';
        } else {
          this.vx = 0;
          this.vz = 0;
          this.state = 'idle';
        }
      }
    }

    this.updatePhysics(dt, stageLimits);

    if (this.stateTimer <= 0) {
      if (this.state === 'punch' || this.state === 'kick') {
        this.state = 'idle';
      }
    }
  }

  castSpecial(camera) {
    this.state = 'special';
    this.stateTimer = 1.2;
    this.specialTimer = this.config.specialCooldown + Math.random() * 2.0;
    this.hitPlayerThisSwing = false;
    Sound.playSpecial();

    if (camera) camera.shake(10, 0.4);

    // Owl summons Tornado
    if (this.config.hasTornado) {
      const proj = new BossProjectile(
        this.x + this.facing * 40,
        this.z,
        20,
        this.facing * 5.0,
        0,
        (Math.random() - 0.5) * 1.5,
        'tornado',
        1.1
      );
      this.projectiles.push(proj);
    }
    // Dragon summons Meteor Shower
    else if (this.config.hasMeteors) {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (this.isDead) return;
          const spawnX = (this.player ? this.player.x : this.x) + (Math.random() - 0.5) * 260;
          const spawnZ = (this.player ? this.player.z : this.z) + (Math.random() - 0.5) * 80;
          const meteor = new BossProjectile(
            spawnX,
            spawnZ,
            380, // Falling from sky
            (Math.random() - 0.5) * 1.5,
            -7.5,
            0,
            'meteor',
            1.2
          );
          this.projectiles.push(meteor);
        }, i * 280);
      }
    }
    // Heavy charge for other bosses
    else {
      this.vx = this.facing * 7.5;
    }
  }

  getAttackHitbox() {
    if ((this.state === 'punch' || this.state === 'kick' || this.state === 'special') && !this.hitPlayerThisSwing) {
      const reach = this.state === 'special' ? 85 : 55;
      return {
        x: this.x + this.facing * (reach * 0.6),
        z: this.z,
        y: this.y,
        width: reach,
        depth: 30,
        height: 60,
        damage: this.state === 'special' ? this.attackPower * 1.8 : this.attackPower,
        knockbackX: this.facing * (this.state === 'special' ? 8 : 4.5),
        knockbackY: this.state === 'special' ? 6 : 2.5
      };
    }
    return null;
  }

  drawProjectiles(ctx, camera, imageLoader) {
    for (const p of this.projectiles) {
      p.draw(ctx, camera, imageLoader);
    }
  }
}
