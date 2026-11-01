import { SPRITE_META, EXTRA_SPRITES } from '../data/metaData.js';
import { PLAYABLE_CHARACTERS } from '../data/charactersData.js';

export class ImageLoader {
  constructor() {
    this.cache = new Map();
    this.totalToLoad = 0;
    this.loadedCount = 0;
  }

  // Preload essential portraits and Stage 1 sprites with guaranteed safety timeout
  async preloadCore(onProgress) {
    const essentialUrls = new Set();

    // 1. Hero Portraits (for character select screen)
    for (const k in PLAYABLE_CHARACTERS) {
      essentialUrls.add(PLAYABLE_CHARACTERS[k].portrait);
    }

    // 2. Chicken item
    essentialUrls.add('assets/images/sprites/chicken.png');

    // 3. Stage 1 Background
    essentialUrls.add('assets/images/backgrounds/stage1_alligator.jpg');

    // 4. Hero core sprites (idle & walk)
    const heroKeys = ['andrey', 'emerson', 'nata', 'dog'];
    for (const hero of heroKeys) {
      if (SPRITE_META[hero]) {
        ['idle', 'walk1', 'punch', 'punch1', 'punch2', 'punch3', 'kick', 'kick1', 'kick2', 'kick3', 'special', 'special1', 'special2', 'special3', 'bot'].forEach((a) => {
          if (SPRITE_META[hero][a]) {
            essentialUrls.add(SPRITE_META[hero][a].src);
          }
        });
      }
    }

    // 5. Stage 1 to 6 Enemies
    const stageEnemies = [
      'enemy_swamp', 'enemy_spear', 'enemy_fish',
      'enemy_goblin', 'enemy_elf', 'enemy_walrus',
      'enemy_reptile', 'enemy_oni', 'enemy_kitsune',
      'enemy_rat', 'enemy_ninja', 'enemy_brute',
      'enemy_cyber_wolf', 'enemy_cyber_elf', 'enemy_mecha_gorilla',
      'enemy_swallow', 'enemy_toucan', 'enemy_crane'
    ];
    for (const ek of stageEnemies) {
      if (SPRITE_META[ek]) {
        ['idle', 'walk1', 'punch', 'fall'].forEach((a) => {
          if (SPRITE_META[ek][a]) {
            essentialUrls.add(SPRITE_META[ek][a].src);
          }
        });
      }
    }

    // 6. Bosses 1-6 (Alligator, Bear, Capybara, Cat, Gorilla, Owl)
    for (const bk of ['alligator', 'bear', 'capybara', 'cat', 'gorilla', 'owl']) {
      if (SPRITE_META[bk]) {
        ['idle', 'walk1', 'punch', 'fall'].forEach((a) => {
          if (SPRITE_META[bk][a]) {
            essentialUrls.add(SPRITE_META[bk][a].src);
          }
        });
      }
    }

    this.totalToLoad = essentialUrls.size;
    let completed = 0;

    const loadPromises = Array.from(essentialUrls).map((url) => {
      return this.loadImage(url).then(() => {
        completed++;
        if (onProgress) onProgress(completed / this.totalToLoad);
      });
    });

    // Safety timeout: Never stay stuck on loading for more than 1.5 seconds!
    const safetyTimeout = new Promise((resolve) => setTimeout(resolve, 1500));
    await Promise.race([Promise.all(loadPromises), safetyTimeout]);

    // Force progress to 100%
    if (onProgress) onProgress(1.0);

    // Continue preloading all other assets in the background without blocking UI
    this.preloadBackgroundAssets();
  }

  preloadBackgroundAssets() {
    // Backgrounds 2 to 9
    const bgNames = [
      'stage2_bear.jpg', 'stage3_capybara.jpg', 'stage4_cat.jpg',
      'stage5_gorilla.jpg', 'stage6_owl.jpg', 'stage7_tiger.jpg',
      'stage8_wolf.jpg', 'stage9_dragon.jpg'
    ];
    for (const bg of bgNames) {
      this.loadImage(`assets/images/backgrounds/${bg}`);
    }

    // All remaining sprites
    for (const charKey in SPRITE_META) {
      for (const anim in SPRITE_META[charKey]) {
        const src = SPRITE_META[charKey][anim].src;
        if (!this.cache.has(src)) {
          this.loadImage(src);
        }
      }
    }

    // Extra projectiles
    for (const k in EXTRA_SPRITES) {
      this.loadImage(EXTRA_SPRITES[k].src);
    }
  }

  loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src));
    }

    return new Promise((resolve) => {
      const img = new Image();
      let finished = false;

      const done = (result) => {
        if (!finished) {
          finished = true;
          this.cache.set(src, result);
          resolve(result);
        }
      };

      img.onload = () => done(img);
      img.onerror = () => done(null);

      // Max 1 second timeout per image
      setTimeout(() => done(img), 1000);

      img.src = src;
    });
  }

  getImage(src) {
    if (!src) return null;
    if (this.cache.has(src)) {
      return this.cache.get(src);
    }
    // Lazy trigger if not cached
    this.loadImage(src);
    return null;
  }
}
