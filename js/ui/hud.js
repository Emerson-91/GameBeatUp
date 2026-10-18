export class HUD {
  constructor() {
    this.bannerText = '';
    this.bannerSubtext = '';
    this.bannerTimer = 0;
    this.bannerColor = '#00f0ff';
  }

  showBanner(text, subtext = '', duration = 2.5, color = '#00f0ff') {
    this.bannerText = text;
    this.bannerSubtext = subtext;
    this.bannerTimer = duration;
    this.bannerColor = color;
  }

  update(dt) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }
  }

  draw(ctx, player, stageManager, imageLoader) {
    if (!player) return;

    ctx.save();

    // 1. Player HUD (Top-Left)
    this.drawPlayerStats(ctx, player, imageLoader);

    // 2. Stage Info & 1-Minute Timer (Top-Center)
    this.drawStageTimer(ctx, stageManager);

    // 3. Score & Stage Count (Top-Right)
    this.drawScore(ctx, player, stageManager);

    // 4. Boss Health Bar (When in Boss Battle)
    if (stageManager.phase === 'boss_battle' && stageManager.boss) {
      this.drawBossHealthBar(ctx, stageManager.boss);
    }

    // 5. GO! Prompt pointing right to advance towards the boss portal
    const livingEnemies = stageManager.enemies.filter((e) => !e.isDead);
    if ((stageManager.phase === 'street' || stageManager.phase === 'door_open') &&
        (livingEnemies.length <= 1 || stageManager.door?.isOpen || stageManager.stageTimer <= 0 || player.x >= stageManager.stageConfig.stageLength - 420)) {
      this.drawGoPrompt(ctx, stageManager.door?.isOpen || stageManager.stageTimer <= 0);
    }

    // 6. Big Screen Banner (Stage Start / Warning / Clear)
    if (this.bannerTimer > 0) {
      this.drawCenterBanner(ctx);
    }

    ctx.restore();
  }

  drawPlayerStats(ctx, player, imageLoader) {
    const startX = 25;
    const startY = 22;

    // Portrait frame (circular/hexagon with border)
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#110d24';
    ctx.strokeRect(startX, startY, 56, 56);
    ctx.fillRect(startX, startY, 56, 56);

    const portraitImg = imageLoader.getImage(player.config.portrait);
    if (portraitImg) {
      ctx.drawImage(portraitImg, startX + 2, startY + 2, 52, 52);
    }
    ctx.restore();

    // Name & Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#000';
    ctx.fillText(player.name, startX + 68, startY + 16);

    // Health Bar (HP)
    const hpX = startX + 68;
    const hpY = startY + 22;
    const hpW = 190;
    const hpH = 14;
    const hpRatio = Math.max(0, player.hp / player.maxHp);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(hpX - 1, hpY - 1, hpW + 2, hpH + 2);

    const hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0);
    if (hpRatio > 0.45) {
      hpGrad.addColorStop(0, '#00ff88');
      hpGrad.addColorStop(1, '#a6ff00');
    } else if (hpRatio > 0.2) {
      hpGrad.addColorStop(0, '#ffbb00');
      hpGrad.addColorStop(1, '#ff6600');
    } else {
      hpGrad.addColorStop(0, '#ff3333');
      hpGrad.addColorStop(1, '#990000');
    }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(hpX, hpY, hpW * hpRatio, hpH);

    // HP Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, hpX + 6, hpY + 11);

    // Special Meter (SP)
    const spY = hpY + 18;
    const spW = 150;
    const spH = 8;
    const spRatio = Math.max(0, player.specialMeter / 100);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(hpX - 1, spY - 1, spW + 2, spH + 2);

    ctx.fillStyle = spRatio >= 0.4 ? '#00e5ff' : '#0066aa';
    ctx.fillRect(hpX, spY, spW * spRatio, spH);

    ctx.fillStyle = spRatio >= 0.4 ? '#00e5ff' : '#888888';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(spRatio >= 0.4 ? 'ESPECIAL PRONTO [L/C]' : 'CARREGANDO SP', hpX + spW + 8, spY + 8);

    // Lives counter & Invincibility Badge
    ctx.font = 'bold 13px sans-serif';
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < player.lives ? '♥ ' : '♡ ';
    }

    ctx.fillStyle = player.lives > 1 ? '#ffd700' : '#ff4466';
    ctx.fillText(`${hearts} (${player.lives} VIDAS)`, startX, startY + 74);

    if (player.isInvincible) {
      ctx.fillStyle = '#00ffc4';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('★ INVENCÍVEL ★', startX + 130, startY + 74);
    }
  }

  drawStageTimer(ctx, stageManager) {
    const cx = 480;
    const cy = 30;

    // Background badge
    ctx.save();
    ctx.fillStyle = 'rgba(12, 10, 24, 0.8)';
    ctx.strokeStyle = '#2b214a';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 75, 12, 150, 48);
    ctx.strokeRect(cx - 75, 12, 150, 48);

    // Stage name
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`FASE ${stageManager.stageConfig.number} DE 9`, cx, 26);

    // 1-minute Countdown timer
    const seconds = Math.ceil(stageManager.stageTimer);
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;

    ctx.fillStyle = seconds <= 10 && Math.floor(Date.now() / 250) % 2 === 0 ? '#ff3333' : '#ffd700';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(stageManager.phase === 'boss_battle' ? 'BOSS' : timeStr, cx, 50);

    ctx.restore();
  }

  drawScore(ctx, player, stageManager) {
    const rx = 935;
    const ry = 28;

    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#a6b0cf';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SCORE', rx, ry);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText(player.score.toString().padStart(7, '0'), rx, ry + 22);

    ctx.fillStyle = '#00ffc4';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(stageManager.stageConfig.bossName, rx, ry + 40);
    ctx.restore();
  }

  drawBossHealthBar(ctx, boss) {
    const cx = 480;
    const cy = 492; // Positioned cleanly at the bottom of the screen
    // Exact double of the player's health bar width (player: 190px -> boss: 380px)
    const bw = 380;
    const bh = 18;
    const ratio = Math.max(0, boss.hp / boss.maxHp);

    ctx.save();

    // Backdrop Card at bottom of screen
    ctx.fillStyle = 'rgba(10, 8, 22, 0.88)';
    ctx.strokeStyle = '#ff2255';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 34, 85, 0.5)';
    ctx.strokeRect(cx - bw / 2 - 14, cy - 22, bw + 28, bh + 30);
    ctx.fillRect(cx - bw / 2 - 14, cy - 22, bw + 28, bh + 30);

    // Header Label above the bar
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2255';
    ctx.font = 'bold 13px sans-serif';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0033';
    ctx.fillText(`☠ CHEFE: ${boss.name.toUpperCase()} - ${boss.title}`, cx, cy - 6);

    // HP Bar Outer Border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeStyle = '#ff4477';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - bw / 2 - 1, cy - 1, bw + 2, bh + 2);
    ctx.fillRect(cx - bw / 2, cy, bw, bh);

    // HP Fill (Gradient from crimson to fiery gold)
    const bossGrad = ctx.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
    bossGrad.addColorStop(0, '#ff0055');
    bossGrad.addColorStop(0.5, '#ff6600');
    bossGrad.addColorStop(1, '#ffd700');
    ctx.fillStyle = bossGrad;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff3300';
    ctx.fillRect(cx - bw / 2, cy, bw * ratio, bh);

    // Upper gloss shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(cx - bw / 2, cy, bw * ratio, bh / 2);

    // HP Numeric Readout
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, cx, cy + 13);

    ctx.restore();
  }

  drawGoPrompt(ctx, isPortalOpen = false) {
    const pulse = Math.sin(Date.now() * 0.012) * 10;
    const arrowX = 835 + pulse;
    const arrowY = 270;

    ctx.save();

    // Bouncing neon indicator pointing right
    ctx.fillStyle = 'rgba(10, 8, 22, 0.9)';
    ctx.strokeStyle = isPortalOpen ? '#00ffc4' : '#ffe600';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 20;
    ctx.shadowColor = isPortalOpen ? '#00ffc4' : '#ffe600';
    ctx.fillRect(arrowX - 110, arrowY - 32, 210, 64);
    ctx.strokeRect(arrowX - 110, arrowY - 32, 210, 64);

    // Animated rightward arrow & text
    ctx.textAlign = 'center';
    ctx.fillStyle = isPortalOpen ? '#00ffc4' : '#ffe600';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('GO!  ►►', arrowX - 5, arrowY);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#000';
    ctx.fillText(isPortalOpen ? 'PORTAL ABERTO! ENTRE!' : 'AVANCE PELA RUA!', arrowX - 5, arrowY + 20);

    ctx.restore();
  }

  drawCenterBanner(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 210, 960, 120);

    ctx.textAlign = 'center';
    ctx.fillStyle = this.bannerColor;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.bannerColor;
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(this.bannerText, 480, 265);

    if (this.bannerSubtext) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#000';
      ctx.fillText(this.bannerSubtext, 480, 305);
    }
    ctx.restore();
  }
}
