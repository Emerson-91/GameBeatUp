export const STAGES_DATA = [
  {
    number: 1,
    id: 'stage_1',
    name: 'PÂNTANO & ESGOTOS',
    subtitle: 'O Covil Subterrâneo dos Répteis',
    bossId: 'alligator',
    bossName: 'KING GATOR',
    bgImage: 'assets/images/backgrounds/stage1_alligator.jpg',
    durationSeconds: 60,
    stageLength: 3200,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#04120f', '#09211c', '#10332c'],
      streetColor: '#121e1a',
      curbColor: '#1a2e28',
      fogColor: 'rgba(0, 255, 170, 0.08)',
      arenaColor: '#0a1613',
      neonColors: ['#00ffaa', '#55ffdd', '#22bb77'],
      weather: 'neon_mist'
    },
    door: {
      label: 'PORTÃO DO ESGOTO',
      frameColor: '#00ffaa',
      glowColor: '#55ffdd'
    },
    enemyPool: [
      { type: 'enemy_swamp', name: 'Monstro do Lodo', hp: 48, speed: 2.7, damage: 9, spriteKey: 'enemy_swamp', scale: 1.0, shadowWidth: 48, width: 40 },
      { type: 'enemy_spear', name: 'Guerreiro da Lança', hp: 40, speed: 3.3, damage: 10, spriteKey: 'enemy_spear', scale: 0.95, shadowWidth: 46, width: 38 },
      { type: 'enemy_fish', name: 'Peixe-Bagre Parrudo', hp: 60, speed: 2.5, damage: 13, spriteKey: 'enemy_fish', scale: 1.1, shadowWidth: 60, width: 48 }
    ],
    chickenSpawns: [600, 1400, 2300, 2900]
  },
  {
    number: 2,
    id: 'stage_2',
    name: 'FLORESTA DOS PINHEIROS & BAMBUS',
    subtitle: 'Território Selvagem de Ursus Magnus',
    bossId: 'bear',
    bossName: 'URSUS MAGNUS',
    bgImage: 'assets/images/backgrounds/stage2_bear.jpg',
    durationSeconds: 60,
    stageLength: 3400,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#06110a', '#0c2114', '#143320'],
      streetColor: '#1a241b',
      curbColor: '#28382a',
      fogColor: 'rgba(50, 255, 120, 0.07)',
      arenaColor: '#0d1a10',
      neonColors: ['#38ef7d', '#11998e', '#a8ff78'],
      weather: 'spores'
    },
    door: {
      label: 'CAVERNA ANCESTRAL',
      frameColor: '#38ef7d',
      glowColor: '#a8ff78'
    },
    enemyPool: [
      { type: 'enemy_goblin', name: 'Goblin da Picareta', hp: 44, speed: 3.4, damage: 10, spriteKey: 'enemy_goblin', scale: 0.9, shadowWidth: 42, width: 34 },
      { type: 'enemy_elf', name: 'Elfo das Adagas', hp: 48, speed: 3.8, damage: 11, spriteKey: 'enemy_elf', scale: 1.0, shadowWidth: 48, width: 38 },
      { type: 'enemy_walrus', name: 'Morsa Bárbaro', hp: 75, speed: 2.6, damage: 14, spriteKey: 'enemy_walrus', scale: 1.15, shadowWidth: 68, width: 52 }
    ],
    chickenSpawns: [700, 1500, 2400, 3100]
  },
  {
    number: 3,
    id: 'stage_3',
    name: 'LAGO SAGRADO & TEMPLO ORIENTAL',
    subtitle: 'Águas de Serenidade e Combate',
    bossId: 'capybara',
    bossName: 'CAPY SENSEI',
    bgImage: 'assets/images/backgrounds/stage3_capybara.jpg',
    durationSeconds: 60,
    stageLength: 3400,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#1c0c08', '#381810', '#542818'],
      streetColor: '#241a15',
      curbColor: '#3d2b22',
      fogColor: 'rgba(255, 160, 50, 0.08)',
      arenaColor: '#170f0b',
      neonColors: ['#ff9900', '#ffd000', '#ff5500'],
      weather: 'fireflies'
    },
    door: {
      label: 'PORTÃO TORII ZEN',
      frameColor: '#ff9900',
      glowColor: '#ffd000'
    },
    enemyPool: [
      { type: 'enemy_oni', name: 'Oni das Lâminas', hp: 48, speed: 3.7, damage: 11, spriteKey: 'enemy_oni', scale: 0.95, shadowWidth: 44, width: 36 },
      { type: 'enemy_reptile', name: 'Ninja Réptil', hp: 56, speed: 3.3, damage: 12, spriteKey: 'enemy_reptile', scale: 1.0, shadowWidth: 48, width: 40 },
      { type: 'enemy_kitsune', name: 'Lobo Shinobi', hp: 76, speed: 2.7, damage: 15, spriteKey: 'enemy_kitsune', scale: 1.15, shadowWidth: 66, width: 50 }
    ],
    chickenSpawns: [650, 1450, 2350, 3050]
  },
  {
    number: 4,
    id: 'stage_4',
    name: 'SHINJUKU NOTURNA & TERRAÇOS',
    subtitle: 'Nas Sombras de Shadow Claw',
    bossId: 'cat',
    bossName: 'SHADOW CLAW',
    bgImage: 'assets/images/backgrounds/stage4_cat.jpg',
    durationSeconds: 60,
    stageLength: 3500,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#0f051c', '#240c3c', '#3c1460'],
      streetColor: '#1b1226',
      curbColor: '#2d1e3d',
      fogColor: 'rgba(255, 0, 180, 0.09)',
      arenaColor: '#130a1f',
      neonColors: ['#ff00b7', '#00f0ff', '#ffe600'],
      weather: 'neon_rain'
    },
    door: {
      label: 'PORTAL DO DOJO NEON',
      frameColor: '#ff00b7',
      glowColor: '#ff66db'
    },
    enemyPool: [
      { type: 'enemy_ninja', name: 'Garras da Noite', hp: 50, speed: 3.8, damage: 11, spriteKey: 'enemy_ninja', scale: 0.95, shadowWidth: 42, width: 36 },
      { type: 'enemy_rat', name: 'Punk Roedor', hp: 60, speed: 3.4, damage: 12, spriteKey: 'enemy_rat', scale: 1.0, shadowWidth: 50, width: 42 },
      { type: 'enemy_brute', name: 'Bruto Mutante', hp: 82, speed: 2.6, damage: 16, spriteKey: 'enemy_brute', scale: 1.15, shadowWidth: 68, width: 54 }
    ],
    chickenSpawns: [750, 1600, 2500, 3200]
  },
  {
    number: 5,
    id: 'stage_5',
    name: 'FUNDIÇÃO SÍSMICA & FÁBRICA',
    subtitle: 'O Domínio do Titã Urbano',
    bossId: 'gorilla',
    bossName: 'TITAN KONG',
    bgImage: 'assets/images/backgrounds/stage5_gorilla.jpg',
    durationSeconds: 60,
    stageLength: 3500,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#140803', '#2c1207', '#481d0b'],
      streetColor: '#241712',
      curbColor: '#3b251c',
      fogColor: 'rgba(255, 68, 0, 0.1)',
      arenaColor: '#170c07',
      neonColors: ['#ff4800', '#ff8800', '#ffcc00'],
      weather: 'embers'
    },
    door: {
      label: 'BUNKER DE AÇO HIDRÁULICO',
      frameColor: '#ff4800',
      glowColor: '#ff7733'
    },
    enemyPool: [
      { type: 'enemy_cyber_elf', name: 'Guerreiro de Plasma', hp: 56, speed: 3.9, damage: 12, spriteKey: 'enemy_cyber_elf', scale: 0.95, shadowWidth: 42, width: 36 },
      { type: 'enemy_cyber_wolf', name: 'Lobo Biomecânico', hp: 68, speed: 3.5, damage: 14, spriteKey: 'enemy_cyber_wolf', scale: 1.05, shadowWidth: 54, width: 44 },
      { type: 'enemy_mecha_gorilla', name: 'Mecha Símio a Vapor', hp: 92, speed: 2.6, damage: 18, spriteKey: 'enemy_mecha_gorilla', scale: 1.2, shadowWidth: 72, width: 58 }
    ],
    chickenSpawns: [800, 1650, 2550, 3250]
  },
  {
    number: 6,
    id: 'stage_6',
    name: 'TORRE DO RELÓGIO DA TEMPESTADE',
    subtitle: 'Vendavais nas Alturas de Zephyr Owl',
    bossId: 'owl',
    bossName: 'ZEPHYR OWL',
    bgImage: 'assets/images/backgrounds/stage6_owl.jpg',
    durationSeconds: 60,
    stageLength: 3600,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#050e1a', '#0a1d36', '#123058'],
      streetColor: '#141d29',
      curbColor: '#223042',
      fogColor: 'rgba(0, 190, 255, 0.11)',
      arenaColor: '#0c1521',
      neonColors: ['#00d4ff', '#82e6ff', '#ffffff'],
      weather: 'heavy_rain'
    },
    door: {
      label: 'PORTAL DOS VENTOS GÓTICOS',
      frameColor: '#00d4ff',
      glowColor: '#82e6ff'
    },
    enemyPool: [
      { type: 'enemy_swallow', name: 'Andorinha Veloz', hp: 54, speed: 4.1, damage: 12, spriteKey: 'enemy_swallow', scale: 0.95, shadowWidth: 40, width: 34 },
      { type: 'enemy_toucan', name: 'Tucano Lutador', hp: 70, speed: 3.4, damage: 14, spriteKey: 'enemy_toucan', scale: 1.05, shadowWidth: 50, width: 42 },
      { type: 'enemy_crane', name: 'Garça Tuiuiú', hp: 84, speed: 3.0, damage: 16, spriteKey: 'enemy_crane', scale: 1.12, shadowWidth: 56, width: 44 }
    ],
    chickenSpawns: [700, 1500, 2450, 3250]
  },
  {
    number: 7,
    id: 'stage_7',
    name: 'RODOVIA DO TROVÃO',
    subtitle: 'Alta Voltagem com Raiden Tiger',
    bossId: 'tiger',
    bossName: 'RAIDEN TIGER',
    bgImage: 'assets/images/backgrounds/stage7_tiger.jpg',
    durationSeconds: 60,
    stageLength: 3600,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#0a051d', '#1f0d38', '#38165e'],
      streetColor: '#171424',
      curbColor: '#2b233d',
      fogColor: 'rgba(255, 234, 0, 0.09)',
      arenaColor: '#130d21',
      neonColors: ['#ffe600', '#ff0055', '#00f0ff'],
      weather: 'lightning'
    },
    door: {
      label: 'PORTÃO DA SUBESTAÇÃO ELÉTRICA',
      frameColor: '#ffe600',
      glowColor: '#fff159'
    },
    enemyPool: [
      { type: 'thug_quick', name: 'Motoqueiro Relâmpago', hp: 62, speed: 4.0, damage: 14, spriteMod: 'emerson_mod' },
      { type: 'thug_heavy', name: 'Lutador Clandestino', hp: 84, speed: 2.8, damage: 17, spriteMod: 'andrey_mod' },
      { type: 'thug_medium', name: 'Assaltante do Asfalto', hp: 72, speed: 3.3, damage: 15, spriteMod: 'dog_mod' }
    ],
    chickenSpawns: [800, 1700, 2600, 3300]
  },
  {
    number: 8,
    id: 'stage_8',
    name: 'DOCAS CONGELADAS & HANGAR',
    subtitle: 'A Fúria Ártica de Fenrir Lupus',
    bossId: 'wolf',
    bossName: 'FENRIR LUPUS',
    bgImage: 'assets/images/backgrounds/stage8_wolf.jpg',
    durationSeconds: 60,
    stageLength: 3700,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#030b18', '#07182c', '#0d2847'],
      streetColor: '#151e28',
      curbColor: '#233242',
      fogColor: 'rgba(160, 230, 255, 0.13)',
      arenaColor: '#0e1621',
      neonColors: ['#38c6ff', '#8fe0ff', '#ffffff'],
      weather: 'snow'
    },
    door: {
      label: 'HANGAR SUBTERRÂNEO DO GELO',
      frameColor: '#38c6ff',
      glowColor: '#8fe0ff'
    },
    enemyPool: [
      { type: 'thug_quick', name: 'Caçador do Ártico', hp: 68, speed: 4.0, damage: 15, spriteMod: 'dog_mod' },
      { type: 'thug_heavy', name: 'Guerreiro da Geada', hp: 90, speed: 2.9, damage: 18, spriteMod: 'andrey_mod' },
      { type: 'thug_medium', name: 'Batedor Polar', hp: 75, speed: 3.4, damage: 16, spriteMod: 'nata_mod' }
    ],
    chickenSpawns: [750, 1600, 2500, 3350]
  },
  {
    number: 9,
    id: 'stage_9',
    name: 'CIDADELA DO VULCÃO',
    subtitle: 'O Trono Cósmico do Bahamut Dragon',
    bossId: 'dragon',
    bossName: 'BAHAMUT DRAGON',
    bgImage: 'assets/images/backgrounds/stage9_dragon.jpg',
    durationSeconds: 60,
    stageLength: 3800,
    groundY: 420,
    groundMinZ: 365,
    groundMaxZ: 505,
    theme: {
      skyColors: ['#1c0404', '#3b0a0a', '#601010'],
      streetColor: '#261414',
      curbColor: '#402020',
      fogColor: 'rgba(255, 34, 0, 0.14)',
      arenaColor: '#1e0c0c',
      neonColors: ['#ff2200', '#ff6600', '#ffd000'],
      weather: 'lava_ash'
    },
    door: {
      label: 'PORTÃO DO APOCALIPSE DRACONIANO',
      frameColor: '#ff2200',
      glowColor: '#ff7733'
    },
    enemyPool: [
      { type: 'thug_heavy', name: 'Campeão Draconiano', hp: 98, speed: 3.1, damage: 19, spriteMod: 'andrey_mod' },
      { type: 'thug_quick', name: 'Lâmina do Fogo Eterno', hp: 74, speed: 4.1, damage: 17, spriteMod: 'nata_mod' },
      { type: 'thug_medium', name: 'Cultista do Apocalipse', hp: 82, speed: 3.5, damage: 18, spriteMod: 'emerson_mod' }
    ],
    chickenSpawns: [800, 1750, 2700, 3450]
  }
];
