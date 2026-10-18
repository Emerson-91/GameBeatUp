export class ChickenItem {
  constructor(x, z) {
    this.x = x;
    this.z = z;
    this.y = 0;
    this.width = 44;
    this.height = 44;
    this.healAmount = 50;
    this.isCollected = false;
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    if (this.isCollected) return;

    this.bobTimer += dt * 4;

    // Check 2.5D pickup proximity
    const dx = Math.abs(player.x - this.x);
    const dz = Math.abs(player.z - this.z);

    if (dx < 36 && dz < 20 && player.y < 30) {
      this.isCollected = true;
      player.heal(this.healAmount);
      player.addScore(300);
    }
  }

  draw(ctx, camera, imageLoader) {
    if (this.isCollected) return;

    const screenX = camera.toScreenX(this.x);
    const bobOffset = Math.sin(this.bobTimer) * 4;
    const screenY = camera.toScreenY(this.z - bobOffset);

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(screenX, camera.toScreenY(this.z), 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Sparkle Halo
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#ffd700';

    const img = imageLoader.getImage('assets/images/sprites/chicken.png');
    if (img) {
      ctx.drawImage(img, screenX - 28, screenY - 44, 56, 56);
    } else {
      // Fallback golden roast chicken icon
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(screenX, screenY - 20, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class BossDoor {
  constructor(x, z, stageConfig) {
    this.x = x;
    this.z = z;
    this.stageConfig = stageConfig;
    this.isOpen = false;
    this.openProgress = 0; // 0 to 1
    this.glowPulse = 0;
  }

  open() {
    this.isOpen = true;
  }

  update(dt) {
    this.glowPulse += dt * 5;
    if (this.isOpen && this.openProgress < 1) {
      this.openProgress = Math.min(1, this.openProgress + dt * 1.5);
    }
  }

  isPlayerEntering(player) {
    if (!this.isOpen) return false;
    const dx = Math.abs(player.x - this.x);
    const dz = Math.abs(player.z - this.z);
    return dx < 45 && dz < 35;
  }

  draw(ctx, camera) {
    const screenX = camera.toScreenX(this.x);
    const screenY = camera.toScreenY(this.z);
    const doorW = 90;
    const doorH = 175;

    ctx.save();
    ctx.translate(screenX, screenY);

    const frameColor = this.stageConfig.door.frameColor || '#00e5ff';
    const glowColor = this.stageConfig.door.glowColor || '#00f0ff';
    const pulseAlpha = 0.5 + Math.sin(this.glowPulse) * 0.4;

    // Doorway Frame
    ctx.lineWidth = 6;
    ctx.strokeStyle = frameColor;
    ctx.shadowBlur = this.isOpen ? 25 : 12;
    ctx.shadowColor = this.isOpen ? glowColor : '#ff0055';
    ctx.strokeRect(-doorW / 2, -doorH, doorW, doorH);

    // Inner passage (dark void opening)
    ctx.fillStyle = '#080812';
    ctx.fillRect(-doorW / 2 + 3, -doorH + 3, doorW - 6, doorH - 3);

    // Sliding Door panels
    if (this.openProgress < 1) {
      const slide = (doorW / 2 - 3) * this.openProgress;
      ctx.fillStyle = '#1e1c29';
      // Left panel
      ctx.fillRect(-doorW / 2 + 3 - slide, -doorH + 3, doorW / 2 - 3, doorH - 3);
      // Right panel
      ctx.fillRect(slide, -doorH + 3, doorW / 2 - 3, doorH - 3);

      // Warning lights when locked
      if (!this.isOpen) {
        ctx.fillStyle = '#ff2222';
        ctx.beginPath();
        ctx.arc(0, -doorH + 20, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Portal aura when fully opened
      const grad = ctx.createLinearGradient(0, -doorH, 0, 0);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.65 * pulseAlpha;
      ctx.fillRect(-doorW / 2 + 4, -doorH + 4, doorW - 8, doorH - 4);
      ctx.globalAlpha = 1.0;
    }

    // Door header neon sign
    ctx.fillStyle = this.isOpen ? '#00ff88' : '#ff3366';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.isOpen ? '#00ff88' : '#ff3366';
    ctx.fillText(this.isOpen ? 'PORTA ABERTA! ENTRE!' : 'PORTÃO DO CHEFE', 0, -doorH - 12);

    if (this.isOpen) {
      // Animated flashing arrow
      ctx.fillStyle = '#ffe600';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('▼', 0, -doorH - 28 + Math.sin(this.glowPulse) * 4);
    }

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
  }

  addHitSparks(x, y, z, color = '#ffea00', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x: x,
        y: y,
        z: z,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 2,
        vz: (Math.random() - 0.5) * 1.5,
        color: color,
        size: Math.random() * 4 + 3,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  addFloatingText(text, x, y, z, color = '#fff') {
    this.texts.push({
      text: text,
      x: x,
      y: y,
      z: z,
      vy: 1.8,
      color: color,
      life: 0.8,
      maxLife: 0.8
    });
  }

  update(dt) {
    // Update sparks
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.z += p.vz * dt * 60;
      p.vy -= 12 * dt; // gravity
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt * 60;
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    // Draw sparks
    for (const p of this.particles) {
      const sx = camera.toScreenX(p.x);
      const sy = camera.toScreenY(p.z - p.y);
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw floating texts
    for (const t of this.texts) {
      const sx = camera.toScreenX(t.x);
      const sy = camera.toScreenY(t.z - t.y);
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#000';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.text, sx, sy);
      ctx.restore();
    }
  }
}
