import { Entity } from './entity.js';
import { Sound } from '../core/audio.js';

export class Enemy extends Entity {
  constructor(x, z, config, playerTarget) {
    // Choose base sprite map from config or mod
    let spriteMapKey = config.spriteKey || 'andrey';
    let filter = null;

    if (!config.spriteKey) {
      if (config.spriteMod === 'nata_mod') {
        spriteMapKey = 'nata';
        filter = 'hue-rotate(180deg) brightness(0.9)';
      } else if (config.spriteMod === 'dog_mod') {
        spriteMapKey = 'dog';
        filter = 'hue-rotate(90deg) contrast(1.1)';
      } else if (config.spriteMod === 'emerson_mod') {
        spriteMapKey = 'emerson';
        filter = 'hue-rotate(240deg) saturate(1.4)';
      } else {
        spriteMapKey = 'andrey';
        filter = 'hue-rotate(300deg) brightness(0.85)';
      }
    }

    super(x, z, 'enemy', spriteMapKey);

    this.filter = filter;
    this.name = config.name || 'Capanga';
    this.maxHp = config.hp || 45;
    this.hp = this.maxHp;
    this.speed = config.speed || 2.8;
    this.attackPower = config.damage || 8;
    this.player = playerTarget;

    this.attackCooldown = Math.random() * 1.5 + 0.5;
    this.thinkTimer = Math.random() * 0.5;
    this.behavior = 'approach'; // 'approach' | 'flank' | 'retreat'
    this.flankOffsetZ = (Math.random() - 0.5) * 50;

    this.hitPlayer = false;
    this.scoreValue = 100;

    if (config.scale) {
      this.scale = config.scale;
    }
    if (config.shadowWidth) {
      this.shadowWidth = config.shadowWidth;
    }
    if (config.width) {
      this.width = config.width;
    }
    if (config.depth) {
      this.depth = config.depth;
    }
  }

  updateAI(dt, stageLimits) {
    if (this.isDead) {
      this.updatePhysics(dt, stageLimits);
      return;
    }

    if (this.state === 'hurt' || this.state === 'knockdown' || this.state === 'fall') {
      this.updatePhysics(dt, stageLimits);
      return;
    }

    if (!this.player || this.player.isDead) {
      this.state = 'idle';
      this.updatePhysics(dt, stageLimits);
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    this.thinkTimer -= dt;
    if (this.thinkTimer <= 0) {
      this.thinkTimer = 0.4 + Math.random() * 0.4;
      const dist = this.distanceTo(this.player);
      if (dist < 70) {
        this.behavior = Math.random() < 0.65 ? 'attack' : 'retreat';
      } else if (dist < 180) {
        this.behavior = Math.random() < 0.5 ? 'flank' : 'approach';
      } else {
        this.behavior = 'approach';
      }
    }

    const dx = this.player.x - this.x;
    const targetZ = this.player.z + (this.behavior === 'flank' ? this.flankOffsetZ : 0);
    const dz = targetZ - this.z;

    this.facing = dx >= 0 ? 1 : -1;

    // Execute behavior
    if (this.state === 'punch' || this.state === 'kick') {
      // In attack animation
      this.vx *= 0.8;
      this.vz *= 0.8;
    } else {
      const absDx = Math.abs(dx);
      const absDz = Math.abs(this.player.z - this.z);

      // Check if close enough to hit
      if (absDx < 62 && absDz < 24 && this.attackCooldown <= 0) {
        // Strike player!
        const isKick = Math.random() < 0.4;
        this.state = isKick ? 'kick' : 'punch';
        this.stateTimer = 0.28;
        this.attackCooldown = 1.4 + Math.random() * 1.0;
        this.hitPlayer = false;
        if (isKick) Sound.playKick();
        else Sound.playPunch();
      } else {
        // Move towards player
        let moveX = 0;
        let moveZ = 0;

        if (this.behavior === 'retreat') {
          moveX = -Math.sign(dx);
          moveZ = Math.sign(dz) * 0.5;
        } else {
          // Approach
          if (absDx > 50) moveX = Math.sign(dx);
          if (absDz > 10) moveZ = Math.sign(dz);
        }

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

    // Reset attacking states
    if (this.stateTimer <= 0) {
      if (this.state === 'punch' || this.state === 'kick') {
        this.state = 'idle';
      }
    }
  }

  getAttackHitbox() {
    if ((this.state === 'punch' || this.state === 'kick') && !this.hitPlayer) {
      return {
        x: this.x + this.facing * 30,
        z: this.z,
        y: this.y,
        width: 45,
        depth: 25,
        height: 50,
        damage: this.attackPower,
        knockbackX: this.facing * 3.5,
        knockbackY: 1.5
      };
    }
    return null;
  }

  drawHealthBar(ctx, camera) {
    if (this.isDead || this.hp >= this.maxHp) return;

    const screenX = camera.toScreenX(this.x);
    const screenY = camera.toScreenY(this.z - this.y - 145 * this.scale);

    const w = 42;
    const h = 5;
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(screenX - w / 2 - 1, screenY - 1, w + 2, h + 2);

    ctx.fillStyle = hpRatio > 0.4 ? '#ffcc00' : '#ff2222';
    ctx.fillRect(screenX - w / 2, screenY, w * hpRatio, h);
    ctx.restore();
  }
}
