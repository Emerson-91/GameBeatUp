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

    const isReady = spRatio >= 1.0;
    if (isReady) {
      const pulse = 0.75 + Math.sin(Date.now() / 140) * 0.25;
      ctx.fillStyle = `rgba(0, 240, 255, ${pulse})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
    } else {
      ctx.fillStyle = '#0088cc';
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(hpX, spY, spW * spRatio, spH);
    ctx.shadowBlur = 0;

    ctx.fillStyle = isReady ? '#00ffff' : '#888888';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(isReady ? 'ESPECIAL 100% PRONTO [L/C]' : `SP: ${Math.floor(player.specialMeter)}%`, hpX + spW + 8, spY + 8);

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
    const barsMax = boss.barsMax || 4;
    const curBar = boss.currentBar;
    if (curBar <= 0 && boss.hp <= 0) return;

    // Palette of gradient colors per bar tier (1 is always the final critical red life)
    const BOSS_PALETTES = {
      4: [
        null,
        { primary: '#ff0055', secondary: '#990022', glow: '#ff0033', label: 'CRÍTICA' }, // 1 (Vermelho Sangue)
        { primary: '#ff7700', secondary: '#cc4400', glow: '#ff6600', label: 'LARANJA' }, // 2 (Laranja Fogo)
        { primary: '#ffd700', secondary: '#cc9900', glow: '#ffd700', label: 'DOURADA' }, // 3 (Ouro)
        { primary: '#00e676', secondary: '#009944', glow: '#00ff88', label: 'VERDE' }     // 4 (Verde Neon)
      ],
      10: [
        null,
        { primary: '#ff0055', secondary: '#990022', glow: '#ff0033', label: 'CRÍTICA' }, // 1 (Vermelho)
        { primary: '#ff3d00', secondary: '#bf360c', glow: '#ff3d00', label: 'LAVA' },    // 2 (Lava)
        { primary: '#ff9100', secondary: '#e65100', glow: '#ff9100', label: 'ÂMBAR' },   // 3 (Âmbar)
        { primary: '#ffd600', secondary: '#f57f17', glow: '#ffd600', label: 'SOLAR' },   // 4 (Ouro Solar)
        { primary: '#76ff03', secondary: '#33691e', glow: '#76ff03', label: 'LIMA' },    // 5 (Lima)
        { primary: '#00e676', secondary: '#004d40', glow: '#00ff88', label: 'VERDE' },   // 6 (Esmeralda)
        { primary: '#00e5ff', secondary: '#006064', glow: '#00e5ff', label: 'CIANO' },   // 7 (Ciano)
        { primary: '#2979ff', secondary: '#0d47a1', glow: '#2979ff', label: 'AZUL' },    // 8 (Cobalto)
        { primary: '#ff1744', secondary: '#880e4f', glow: '#ff1744', label: 'MAGENTA' }, // 9 (Magenta)
        { primary: '#d500f9', secondary: '#4a148c', glow: '#e040fb', label: 'CÓSMICA' }  // 10 (Cósmica)
      ]
    };

    const palette = (barsMax === 10) ? BOSS_PALETTES[10] : BOSS_PALETTES[4];
    const curColor = palette[curBar] || palette[1];
    const underBar = curBar - 1;
    const underColor = underBar >= 1 ? palette[underBar] : null;

    const ratio = Math.max(0, Math.min(1, boss.currentBarRatio));

    const cx = 480;
    const cy = 492;
    const bw = 380;
    const bh = 18;

    ctx.save();

    // 1. Backdrop Card at bottom of screen
    ctx.fillStyle = 'rgba(10, 8, 22, 0.92)';
    ctx.strokeStyle = curColor.glow;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 16;
    ctx.shadowColor = curColor.glow;
    ctx.strokeRect(cx - bw / 2 - 52, cy - 23, bw + 64, bh + 31);
    ctx.fillRect(cx - bw / 2 - 52, cy - 23, bw + 64, bh + 31);

    // 2. Boss Name and Title Header
    ctx.textAlign = 'left';
    ctx.fillStyle = curColor.primary;
    ctx.font = 'bold 13px sans-serif';
    ctx.shadowBlur = 10;
    ctx.shadowColor = curColor.glow;
    ctx.fillText(`☠ CHEFE: ${boss.name.toUpperCase()} - ${boss.title}`, cx - bw / 2 - 46, cy - 7);

    // 3. Mini Diamond / Pip Indicators for each life on the right of the header
    ctx.textAlign = 'right';
    let pipsStr = '';
    for (let b = 1; b <= barsMax; b++) {
      pipsStr += (b <= curBar ? '◆' : '◇');
    }
    ctx.font = '11px sans-serif';
    ctx.fillStyle = (curBar === 1) ? '#ff2255' : curColor.primary;
    ctx.fillText(pipsStr, cx + bw / 2 + 6, cy - 7);

    // 4. Arcade Life Multiplier Badge on the Left (e.g. [ x4 ], [ x10 ])
    const badgeX = cx - bw / 2 - 48;
    const badgeY = cy;
    const badgeW = 42;
    const badgeH = bh;

    // Glowing badge box
    const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    badgeGrad.addColorStop(0, curColor.primary);
    badgeGrad.addColorStop(1, curColor.secondary);
    ctx.fillStyle = badgeGrad;
    ctx.shadowBlur = curBar === 1 ? (12 + Math.sin(Date.now() * 0.015) * 6) : 8;
    ctx.shadowColor = curColor.glow;
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    // Badge text: x4, x10
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillText(`x${curBar}`, badgeX + badgeW / 2, badgeY + 13);

    // 5. HP Gauge Outer Frame
    const barX = cx - bw / 2;
    const barY = cy;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.strokeStyle = '#222233';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 1, barY - 1, bw + 2, bh + 2);
    ctx.fillRect(barX, barY, bw, bh);

    // 6. Under-Layer: The Next Bar Waiting Underneath (Full Width)
    if (underColor) {
      const underGrad = ctx.createLinearGradient(barX, 0, barX + bw, 0);
      underGrad.addColorStop(0, underColor.primary);
      underGrad.addColorStop(1, underColor.secondary);
      ctx.fillStyle = underGrad;
      ctx.shadowBlur = 0;
      ctx.fillRect(barX, barY, bw, bh);

      // Subtle dim filter on under-bar so active top-bar pops out
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(barX, barY, bw, bh);
    } else {
      // Empty gauge background (dark crimson hazard)
      ctx.fillStyle = 'rgba(25, 4, 10, 0.95)';
      ctx.fillRect(barX, barY, bw, bh);
    }

    // 7. Active Top-Layer: Current Bar Draining
    if (ratio > 0) {
      const fillW = bw * ratio;
      const curGrad = ctx.createLinearGradient(barX, 0, barX + bw, 0);
      curGrad.addColorStop(0, curColor.primary);
      curGrad.addColorStop(1, curColor.secondary);
      ctx.fillStyle = curGrad;
      ctx.shadowBlur = 12;
      ctx.shadowColor = curColor.glow;
      ctx.fillRect(barX, barY, fillW, bh);

      // Leading edge white flash spark / razor edge line
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.fillRect(barX + fillW - 2, barY, 2, bh);

      // Upper gloss shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.shadowBlur = 0;
      ctx.fillRect(barX, barY, fillW, bh / 2);
    }

    // 8. HP Readout in center of the bar
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`VIDA ${curBar}/${barsMax} • ${Math.ceil(boss.hp)} / ${boss.maxHp}`, cx, cy + 13);

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
