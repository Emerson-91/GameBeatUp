export const PLAYABLE_CHARACTERS = {
  andrey: {
    id: 'andrey',
    name: 'ANDREY',
    title: 'Gênio da Tecnologia',
    portrait: 'assets/images/portrait_andrey.jpg',
    spriteId: 'andrey',
    maxHp: 110,
    speed: 4.4,
    stats: {
      power: 82,
      speed: 85,
      defense: 80,
      special: 98
    },
    damage: {
      punch: 20,
      kick: 24,
      jumpKick: 28,
      special: 75
    },
    specialCooldown: 8.5,
    specialDuration: 0.35,
    specialName: 'ESQUADRÃO ANDREYBOT (BOMBARDEIO AÉREO)',
    description: 'Gênio da alta tecnologia. Seu especial 100% convoca 3 AndreyBots que bombardeiam a arena com disparos de plasma devastadores (20% de vida por acerto e 15% no chefe), enquanto Andrey fica 100% livre para se mover, socar e chutar em conjunto!'
  },
  emerson: {
    id: 'emerson',
    name: 'EMERSON',
    title: 'Titã da Super Força',
    portrait: 'assets/images/portrait_emerson.jpg',
    spriteId: 'emerson',
    maxHp: 135,
    speed: 4.0,
    stats: {
      power: 100,
      speed: 70,
      defense: 95,
      special: 88
    },
    damage: {
      punch: 26,
      kick: 30,
      jumpKick: 34,
      special: 60
    },
    specialCooldown: 8.0,
    specialDuration: 1.25,
    specialName: 'SOCO SÍSMICO DEMOLIDOR (TERREMOTO TOTAL)',
    description: 'Possui super força colossal. Seu especial 100% é um estrondoso soco no chão que faz toda a tela tremer e estraçalha todos os inimigos (50% de dano) e o chefe (25% de dano)!'
  },
  nata: {
    id: 'nata',
    name: 'NATA',
    title: 'Dançarina Flamejante',
    portrait: 'assets/images/portrait_nata.jpg',
    spriteId: 'nata',
    maxHp: 95,
    speed: 5.3,
    stats: {
      power: 70,
      speed: 98,
      defense: 65,
      special: 88
    },
    damage: {
      punch: 16,
      kick: 24,
      jumpKick: 28,
      special: 45
    },
    specialCooldown: 8.5,
    specialDuration: 3.2,
    specialName: 'SOLO DE GUITARRA ELÉTRICA (TEMPESTADE DE RAIOS)',
    description: 'Toca um solo épico de guitarra com distorção que invoca múltiplos raios aleatórios com sinais de choque </> e notas musicais pela fase. Quem for acertado pelo raio toma dano de 50% e o chefe 25%!'
  },
  unicao: {
    id: 'unicao',
    name: 'UNICÃO',
    title: 'Lenda Canina',
    portrait: 'assets/images/portrait_dog.jpg',
    spriteId: 'dog',
    maxHp: 115,
    speed: 4.9,
    stats: {
      power: 85,
      speed: 88,
      defense: 75,
      special: 92
    },
    damage: {
      punch: 19,
      kick: 23,
      jumpKick: 27,
      special: 52
    },
    specialCooldown: 8.5,
    specialDuration: 3.5,
    specialName: 'CATACLISMA CÓSMICO (INVOCAÇÃO DE PLANETAS)',
    description: 'Invoca o poder dos cosmos e faz planetas flamejantes caírem do céu de forma aleatória na fase! Cada impacto de planeta causa 50% de dano aos adversários e 25% ao chefe!'
  }
};

export const BOSS_CONFIGS = {
  1: {
    stage: 1,
    id: 'alligator',
    name: 'KING GATOR',
    title: 'O Flagelo dos Esgotos',
    spriteId: 'alligator',
    bars: 4,
    hpPerBar: 320,
    maxHp: 1280, // 4x (4 barras de 320)
    speed: 2.8,
    attackPower: 16,
    specialCooldown: 7,
    scale: 1.05,
    specialName: 'MORDIDA DA MORTE',
    arenaTheme: 'sewer'
  },
  2: {
    stage: 2,
    id: 'bear',
    name: 'URSUS MAGNUS',
    title: 'O Guardião da Floresta',
    spriteId: 'bear',
    bars: 4,
    hpPerBar: 380,
    maxHp: 1520, // 4x (4 barras de 380)
    speed: 2.7,
    attackPower: 19,
    specialCooldown: 8,
    scale: 1.1,
    specialName: 'PATADA SÍSMICA',
    arenaTheme: 'forest'
  },
  3: {
    stage: 3,
    id: 'capybara',
    name: 'CAPY SENSEI',
    title: 'O Monge da Lagoa',
    spriteId: 'capybara',
    bars: 4,
    hpPerBar: 440,
    maxHp: 1760, // 4x (4 barras de 440)
    speed: 3.0,
    attackPower: 20,
    specialCooldown: 7,
    scale: 1.05,
    specialName: 'TSUNAMI ZEN',
    arenaTheme: 'lagoon'
  },
  4: {
    stage: 4,
    id: 'cat',
    name: 'SHADOW CLAW',
    title: 'A Ninja das Sombras',
    spriteId: 'cat',
    bars: 4,
    hpPerBar: 500,
    maxHp: 2000, // 4x (4 barras de 500)
    speed: 4.2,
    attackPower: 22,
    specialCooldown: 6,
    scale: 1.0,
    specialName: 'CORTE FANTASMA',
    arenaTheme: 'rooftop'
  },
  5: {
    stage: 5,
    id: 'gorilla',
    name: 'TITAN KONG',
    title: 'O Esmagador Urbano',
    spriteId: 'gorilla',
    bars: 4,
    hpPerBar: 580,
    maxHp: 2320, // 4x (4 barras de 580)
    speed: 3.0,
    attackPower: 25,
    specialCooldown: 8,
    scale: 1.15,
    specialName: 'MARTELO SÍSMICO',
    arenaTheme: 'factory'
  },
  6: {
    stage: 6,
    id: 'owl',
    name: 'ZEPHYR OWL',
    title: 'O Lorde dos Ventos',
    spriteId: 'owl',
    bars: 4,
    hpPerBar: 650,
    maxHp: 2600, // 4x (4 barras de 650)
    speed: 3.6,
    attackPower: 24,
    specialCooldown: 6.5,
    scale: 1.05,
    hasTornado: true,
    specialName: 'FURACÃO DEVASTADOR',
    arenaTheme: 'clocktower'
  },
  7: {
    stage: 7,
    id: 'tiger',
    name: 'RAIDEN TIGER',
    title: 'A Fera do Trovão',
    spriteId: 'tiger',
    bars: 4,
    hpPerBar: 740,
    maxHp: 2960, // 4x (4 barras de 740)
    speed: 4.0,
    attackPower: 27,
    specialCooldown: 6,
    scale: 1.1,
    specialName: 'BOTE RELÂMPAGO',
    arenaTheme: 'highway'
  },
  8: {
    stage: 8,
    id: 'wolf',
    name: 'FENRIR LUPUS',
    title: 'O Alfa da Nevasca',
    spriteId: 'wolf',
    bars: 4,
    hpPerBar: 840,
    maxHp: 3360, // 4x (4 barras de 840)
    speed: 4.1,
    attackPower: 29,
    specialCooldown: 5.5,
    scale: 1.08,
    specialName: 'UIVO DO ABISMO',
    arenaTheme: 'docks'
  },
  9: {
    stage: 9,
    id: 'dragon',
    name: 'BAHAMUT DRAGON',
    title: 'O Imperador do Apocalipse',
    spriteId: 'dragon',
    bars: 10,
    hpPerBar: 1100,
    maxHp: 11000, // 10x (10 barras de 1100)
    speed: 3.8,
    attackPower: 35,
    specialCooldown: 5.0,
    scale: 1.25,
    hasMeteors: true,
    specialName: 'CHUVA DE METEOROS CÓSMICOS',
    arenaTheme: 'volcano'
  }
};
