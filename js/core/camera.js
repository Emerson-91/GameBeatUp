export class Camera {
  constructor(viewportWidth = 960, viewportHeight = 540) {
    this.x = 0;
    this.y = 0;
    this.width = viewportWidth;
    this.height = viewportHeight;

    this.minX = 0;
    this.maxX = 3200;
    this.isLocked = false;
    this.target = null;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  setLimits(minX, maxX) {
    this.minX = minX;
    this.maxX = maxX - this.width;
    if (this.maxX < this.minX) this.maxX = this.minX;
  }

  follow(entity) {
    this.target = entity;
  }

  shake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update(dt) {
    if (this.target) {
      // Keep player around 35% from left edge or center
      const desiredX = this.target.x - this.width * 0.35;

      if (!this.isLocked) {
        // Can only scroll forward in classic beat em up
        if (desiredX > this.x) {
          this.x += (desiredX - this.x) * 0.12;
        }
      }

      // Constrain within min and max
      if (this.x < this.minX) this.x = this.minX;
      if (this.x > this.maxX) this.x = this.maxX;
    }

    // Process Shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const decay = Math.max(0, this.shakeDuration / 0.25);
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
      if (this.shakeDuration <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  }

  // Convert world coordinates to screen coordinates
  toScreenX(worldX) {
    return Math.floor(worldX - this.x + this.shakeOffsetX);
  }

  toScreenY(worldY) {
    return Math.floor(worldY + this.shakeOffsetY);
  }
}
