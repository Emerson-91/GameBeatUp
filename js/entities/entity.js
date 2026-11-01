import { SPRITE_META } from '../data/metaData.js';

export class Entity {
  constructor(x, z, charKey, spriteMapKey = null) {
    this.x = x;
    this.z = z;
    this.y = 0; // Altitude above ground
    this.vx = 0;
    this.vz = 0;
    this.vy = 0;

    this.charKey = charKey;
    this.spriteMapKey = spriteMapKey || charKey;

    this.facing = 1; // 1: right, -1: left
    this.state = 'idle'; // idle, walk, back, punch, kick, special, jump, hurt, fall, knockdown, victory
    this.stateTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;

    this.maxHp = 100;
    this.hp = 100;
    this.speed = 3.5;
    this.isDead = false;
    this.isInvincible = false;
    this.invincibleTimer = 0;

    // Dimensions
    this.scale = 1.0;
    this.baseScale = 0.52; // Scale down 300px sprites to fit ~150px height in 540p
    this.shadowWidth = 50;

    // Hitbox / Hurtbox
    this.width = 40;
    this.depth = 26; // Z-axis collision tolerance

    // Color Tint / Hue Mod (for enemy variants)
    this.filter = null;
  }

  get meta() {
    return SPRITE_META[this.spriteMapKey] || {};
  }

  getCurrentSpriteName() {
    const meta = this.meta;
    let s = this.state;

    // Handle walking animation frames
    if (s === 'walk') {
      const step = Math.floor(this.animFrame) % 2;
      s = step === 0 ? 'walk1' : 'walk2';
    } else if (s === 'back') {
      const step = Math.floor(this.animFrame) % 2;
      s = step === 0 ? 'back1' : 'back2';
    } else if (s === 'idle') {
      // Subtly alternate idle & idle2 if available
      const step = Math.floor(this.animFrame * 0.5) % 2;
      if (step === 1 && meta['idle2']) s = 'idle2';
      else s = 'idle';
    } else if (s === 'victory') {
      // Step through victory poses
      const vNum = (Math.floor(this.animFrame * 0.8) % 5) + 1;
      const vName = `victory${vNum}`;
      if (meta[vName]) s = vName;
      else if (meta['victory']) s = 'victory';
      else s = 'idle';
    } else if (s === 'hurt') {
      s = meta['crouch'] ? 'crouch' : 'idle';
    } else if (s === 'special') {
      if (this.specialPhase && meta[`special${this.specialPhase}`]) {
        return `special${this.specialPhase}`;
      }
      if (meta['special']) return 'special';
    }

    if (meta[s]) return s;
    if (s.startsWith('punch') && meta['punch']) return 'punch';
    if (s.startsWith('kick') && meta['kick']) return 'kick';
    if (meta['idle']) return 'idle';
    const firstKey = Object.keys(meta)[0];
    return firstKey || 'idle';
  }

  getSpriteInfo() {
    const sName = this.getCurrentSpriteName();
    const info = this.meta[sName] || { w: 180, h: 300, ax: 0.5, src: '' };
    return { name: sName, info };
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0) {
    if (this.isInvincible || this.isDead) return false;

    this.hp -= amount;
    this.isInvincible = true;
    this.invincibleTimer = 0.35;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.state = 'fall';
      this.vy = Math.max(knockbackY, 7);
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

  updatePhysics(dt, stageLimits) {
    // Invincibility flicker
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
      }
    }

    // Apply Gravity & Vertical Movement
    if (this.y > 0 || this.vy !== 0) {
      this.y += this.vy;
      this.vy -= 22 * dt; // Gravity
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        if (this.state === 'fall' || this.state === 'knockdown') {
          if (this.isDead) {
            this.state = 'fall';
          } else {
            // Get up after a moment
            this.state = 'crouch';
            this.stateTimer = 0.25;
          }
        } else if (this.state === 'jump') {
          this.state = 'idle';
        }
      }
    }

    // Position integration
    this.x += this.vx * dt * 60;
    this.z += this.vz * dt * 60;

    // Apply friction to knockbacks
    if (this.state === 'hurt' || this.state === 'knockdown' || this.state === 'fall') {
      this.vx *= 0.88;
      this.vz *= 0.88;
    }

    // Ground Boundaries
    if (stageLimits) {
      if (this.z < stageLimits.minZ) this.z = stageLimits.minZ;
      if (this.z > stageLimits.maxZ) this.z = stageLimits.maxZ;
    }

    // Animation progress
    this.animTimer += dt * 6;
    this.animFrame = this.animTimer;

    // State timers
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.state === 'hurt' || this.state === 'crouch') {
          this.state = 'idle';
        }
      }
    }
  }

  drawShadow(ctx, camera) {
    if (this.isDead && this.y === 0 && this.state === 'fall') return;

    const screenX = camera.toScreenX(this.x);
    const screenY = camera.toScreenY(this.z);

    // Shadow shrinks and lightens as character jumps higher
    const jumpFactor = Math.max(0.3, 1 - this.y / 240);
    const zDepthScale = 0.8 + (this.z / 600) * 0.35;
    const sw = this.shadowWidth * jumpFactor * zDepthScale * this.scale;
    const sh = sw * 0.32;

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * jumpFactor})`;
    ctx.beginPath();
    ctx.ellipse(screenX, screenY, sw, sh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  draw(ctx, camera, imageLoader) {
    const { name, info } = this.getSpriteInfo();
    const img = imageLoader.getImage(info.src);
    if (!img) return;

    const screenX = camera.toScreenX(this.x);
    // 2.5D position: ground is at z, altitude goes up (-y)
    const screenY = camera.toScreenY(this.z - this.y);

    // Apply depth scaling based on Z
    const depthScale = (0.85 + (this.z / 550) * 0.25) * this.scale * this.baseScale;
    const drawW = info.w * depthScale;
    const drawH = info.h * depthScale;

    // Horizontal Anchor: ax specifies where the center of character is in the sprite
    const anchorX = (info.ax !== undefined ? info.ax : 0.5) * drawW;
    const anchorY = drawH; // Feet at bottom

    ctx.save();
    ctx.translate(screenX, screenY);

    // Invincible rapid blink effect (flashes during 2 seconds of invincibility)
    if (this.isInvincible) {
      const blink = Math.floor(Date.now() / 65) % 2 === 0;
      ctx.globalAlpha = blink ? 0.15 : 0.95;
    } else if (this.isDead && this.deathTimer !== undefined) {
      ctx.globalAlpha = Math.max(0, Math.min(1, this.deathTimer / 0.45));
    }

    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    if (this.filter) {
      ctx.filter = this.filter;
    }

    ctx.drawImage(img, -anchorX, -anchorY, drawW, drawH);
    ctx.restore();
  }

  // Check 2.5D distance to target
  distanceTo(other) {
    const dx = this.x - other.x;
    const dz = (this.z - other.z) * 1.8; // Z axis has higher perspective weight
    return Math.sqrt(dx * dx + dz * dz);
  }
}
