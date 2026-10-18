export class StageRenderer {
  constructor(viewportWidth = 960, viewportHeight = 540) {
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.weatherTimer = 0;
    this.lightningTimer = 0;
    this.isLightning = false;
  }

  draw(ctx, stageConfig, camera, isBossArena = false, imageLoader = null) {
    const theme = stageConfig.theme;
    const bgImg = imageLoader && stageConfig.bgImage ? imageLoader.getImage(stageConfig.bgImage) : null;

    if (bgImg) {
      this.drawArtisticBackground(ctx, bgImg, stageConfig, camera, isBossArena);
    } else {
      this.drawFallbackBackground(ctx, stageConfig, camera, isBossArena);
    }

    // 2.5D Street Ground Pavement
    this.drawGround(ctx, stageConfig, camera, isBossArena);

    // Stage-specific Ambient Fog & Weather Effects
    this.drawWeatherEffects(ctx, theme.weather);
  }

  drawArtisticBackground(ctx, bgImg, stageConfig, camera, isBossArena) {
    ctx.save();

    if (isBossArena) {
      // Locked Arena View with focal lighting
      const arenaH = this.height * 0.72;
      ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, 0, 0, this.width, arenaH);

      // Arena dramatic vignette & glow
      const arenaVignette = ctx.createRadialGradient(
        this.width / 2, arenaH * 0.45, 80,
        this.width / 2, arenaH * 0.45, this.width * 0.65
      );
      arenaVignette.addColorStop(0, 'transparent');
      arenaVignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.45)');
      arenaVignette.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = arenaVignette;
      ctx.fillRect(0, 0, this.width, arenaH);

      // Boss Crest Banner
      ctx.fillStyle = stageConfig.theme.neonColors[0] || '#ffd700';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 18;
      ctx.shadowColor = stageConfig.theme.neonColors[0] || '#ff0055';
      ctx.fillText(`COVIL DE ${stageConfig.bossName}`, this.width / 2, 45);
      ctx.shadowBlur = 0;

    } else {
      // Parallax scrolling street walk view (0.28 scroll factor)
      const scrollSpeed = 0.28;
      const bgWidth = this.width * 1.35;
      const bgHeight = this.height * 0.74;

      const offset = -(camera.x * scrollSpeed) % bgWidth;

      for (let x = offset - bgWidth; x < this.width + bgWidth; x += bgWidth) {
        ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, x, 0, bgWidth, bgHeight);
      }

      // Upper atmospheric tint
      const tintGrad = ctx.createLinearGradient(0, 0, 0, bgHeight);
      tintGrad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      tintGrad.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
      ctx.fillStyle = tintGrad;
      ctx.fillRect(0, 0, this.width, bgHeight);
    }

    ctx.restore();
  }

  drawFallbackBackground(ctx, stageConfig, camera, isBossArena) {
    const theme = stageConfig.theme;

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height * 0.7);
    skyGrad.addColorStop(0, theme.skyColors[0]);
    skyGrad.addColorStop(0.5, theme.skyColors[1]);
    skyGrad.addColorStop(1, theme.skyColors[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    if (isBossArena) {
      ctx.fillStyle = theme.arenaColor;
      ctx.fillRect(0, 100, this.width, 260);
      return;
    }

    // Midground buildings
    const midOffset = -(camera.x * 0.4) % 360;
    for (let i = -1; i < 6; i++) {
      const bx = midOffset + i * 220;
      const bw = 170;
      const bh = 220 + ((i * 73) % 80);
      const by = 350 - bh;

      ctx.fillStyle = '#1c163b';
      ctx.fillRect(bx, by, bw, bh);
    }
  }

  drawGround(ctx, stageConfig, camera, isBossArena) {
    const theme = stageConfig.theme;
    const groundScreenY = camera.toScreenY(stageConfig.groundMinZ - 10);
    const groundHeight = this.height - groundScreenY;

    // Curb edge line
    ctx.fillStyle = theme.curbColor;
    ctx.fillRect(0, groundScreenY - 14, this.width, 14);

    // Curb highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, groundScreenY - 14, this.width, 2);

    // Main 2.5D pavement
    const pavementGrad = ctx.createLinearGradient(0, groundScreenY, 0, this.height);
    pavementGrad.addColorStop(0, theme.streetColor);
    pavementGrad.addColorStop(1, '#05040a');
    ctx.fillStyle = pavementGrad;
    ctx.fillRect(0, groundScreenY, this.width, groundHeight);

    if (isBossArena) {
      // Boss Arena ring boundary
      ctx.save();
      ctx.strokeStyle = theme.neonColors[0] || '#00e5ff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = theme.neonColors[0] || '#00e5ff';
      ctx.strokeRect(60, groundScreenY + 15, this.width - 120, groundHeight - 25);
      ctx.restore();
    } else {
      // Perspective Lane Markings along street
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      const markOffset = -(camera.x % 140);
      for (let mx = markOffset; mx < this.width + 140; mx += 140) {
        ctx.fillRect(mx, groundScreenY + 65, 65, 8);
      }
    }
  }

  drawWeatherEffects(ctx, weatherType) {
    this.weatherTimer += 0.05;

    if (weatherType === 'heavy_rain' || weatherType === 'neon_rain') {
      ctx.strokeStyle = weatherType === 'neon_rain' ? 'rgba(0, 240, 255, 0.35)' : 'rgba(180, 220, 255, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 60; i++) {
        const rx = (Math.sin(i * 99 + this.weatherTimer * 20) * 0.5 + 0.5) * this.width;
        const ry = (Math.cos(i * 33 + this.weatherTimer * 30) * 0.5 + 0.5) * this.height;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 8, ry + 24);
      }
      ctx.stroke();
    } else if (weatherType === 'snow') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 45; i++) {
        const sx = (Math.sin(i * 47 + this.weatherTimer * 0.8) * 0.5 + 0.5) * this.width;
        const sy = ((i * 18 + this.weatherTimer * 45) % this.height);
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 3) + 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (weatherType === 'embers' || weatherType === 'lava_ash') {
      ctx.fillStyle = weatherType === 'lava_ash' ? '#ff4400' : '#ff8800';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff3300';
      for (let i = 0; i < 35; i++) {
        const ex = (Math.sin(i * 61 + this.weatherTimer * 1.5) * 0.5 + 0.5) * this.width;
        const ey = this.height - ((i * 22 + this.weatherTimer * 55) % this.height);
        ctx.beginPath();
        ctx.arc(ex, ey, (i % 3) + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    } else if (weatherType === 'fireflies') {
      // Floating glowing fireflies for lagoon/zen temple
      ctx.fillStyle = '#ffee66';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffdd33';
      for (let i = 0; i < 20; i++) {
        const fx = (Math.sin(i * 13 + this.weatherTimer * 0.5) * 0.5 + 0.5) * this.width;
        const fy = 120 + (Math.cos(i * 29 + this.weatherTimer * 0.7) * 0.5 + 0.5) * 250;
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    } else if (weatherType === 'lightning') {
      // Occasional lightning flash on highway
      if (Math.random() < 0.015) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.fillRect(0, 0, this.width, this.height);
      }
    }
  }
}
