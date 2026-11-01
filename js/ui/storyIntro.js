import { Sound } from '../core/audio.js';

export class StoryIntro {
  constructor(onComplete, onSkip) {
    this.onComplete = onComplete;
    this.onSkip = onSkip;
    this.currentScene = 0;
    this.container = null;
    this.autoTimer = null;
    this.autoDuration = 7500; // 7.5 seconds per scene if untouched
    this.timerStartTime = 0;
    this.rafId = null;

    this.scenes = [
      {
        id: 'prologue',
        type: 'prologue',
        badge: '★ PRÓLOGO • O CERCO DE NEO-METRÓPOLE ★',
        title: 'A BATALHA PELOS 9 REINOS',
        subtitle: 'QUEDA DA CIDADE & O CHAMADO DA REBELIÃO',
        themeColor: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.5)',
        text: 'Ano 209X. Uma tempestade cósmica cobriu os céus e Bahamut Dragon, o Imperador do Apocalipse, assumiu o poder absoluto. Sob suas ordens, 9 Lordes Supremos governaram com mão de ferro — dos canais de esgoto mais imundos aos terraços neon mais altos. Quando toda a esperança parecia extinta, os quatro maiores guerreiros do submundo se uniram sob uma única bandeira: STREET BRAWLERS!',
        imageBg: 'assets/images/backgrounds/stage1_alligator.jpg',
        sfx: 'start'
      },
      {
        id: 'andrey',
        type: 'hero',
        charKey: 'andrey',
        name: 'ANDREY',
        title: 'O Gênio da Tecnologia & Esquadrão AndreyBot',
        themeColor: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.65)',
        portrait: 'assets/images/portrait_andrey.jpg',
        sprite: 'assets/images/sprites/characters/andrey_idle.png',
        subSprite: 'assets/images/sprites/characters/andrey_bot.png',
        roleBadge: 'ESTRATEGISTA CIBERNÉTICO • PLASMA TÁTICO',
        stats: { poder: '82%', velocidade: '85%', tecnologia: '100%' },
        history: 'Prodígio em robótica e cibersegurança. Construiu seu próprio exo-equipamento de plasma e lançou 3 drones autônomos em órbita baixa para bombardear as forças inimigas a qualquer chamado.',
        quote: '"Os sensores mostram que King Gator selou os esgotos da cidade. Se não agirmos rápido, a rede de energia cai e os outros 8 reinos serão fortificados. Meus AndreyBots já estão engatilhados. Vamos descer e restaurar a ordem!"',
        sfx: 'laser'
      },
      {
        id: 'emerson',
        type: 'hero',
        charKey: 'emerson',
        name: 'EMERSON',
        title: 'O Titã Sísmico da Super Força',
        themeColor: '#ffaa00',
        glowColor: 'rgba(255, 170, 0, 0.65)',
        portrait: 'assets/images/portrait_emerson.jpg',
        sprite: 'assets/images/sprites/characters/emerson_idle.png',
        subSprite: 'assets/images/sprites/characters/emerson_special1.png',
        roleBadge: 'DEMOLIDOR TECTÔNICO • FORÇA COLOSSAL',
        stats: { poder: '100%', resistencia: '95%', impacto: '100%' },
        history: 'Nascido nos distritos industriais de forja pesada, Emerson desenvolveu uma musculatura titânica capaz de desferir socos com impacto de abalos sísmicos. Quando ele golpeia o solo, a terra inteira estremece.',
        quote: '"Deixa a conversa fiada pros computadores, Andrey! Plano bom é plano que derruba parede e amassa cara de réptil gigante. Meu soco especial tá a 100% carregado. Deixa que eu entro na frente arrombando as portas!"',
        sfx: 'heavy'
      },
      {
        id: 'nata',
        type: 'hero',
        charKey: 'nata',
        name: 'NATA',
        title: 'A Dançarina Flamejante da Noite',
        themeColor: '#ff0077',
        glowColor: 'rgba(255, 0, 119, 0.65)',
        portrait: 'assets/images/portrait_nata.jpg',
        sprite: 'assets/images/sprites/characters/nata_idle.png',
        subSprite: 'assets/images/sprites/characters/nata_kick.png',
        roleBadge: 'VELOCIDADE DA LUZ • CHUTES ACROBÁTICOS',
        stats: { velocidade: '98%', agilidade: '96%', precisao: '90%' },
        history: 'Mestre suprema em artes marciais acrobáticas e capoeira cyberpunk. Seus pés em chamas movem-se com tamanha rapidez que seus inimigos só percebem o golpe depois de estarem no chão.',
        quote: '"Vocês dois demoram uma eternidade! Enquanto o Emerson bate na parede e o Andrey ajusta antena, eu já desço voando e limpo a primeira linha de capangas. Só tentem não ficar pra trás enquanto eu danço!"',
        sfx: 'kick'
      },
      {
        id: 'unicao',
        type: 'hero',
        charKey: 'unicao',
        name: 'UNICÃO',
        title: 'A Lenda Canina Ancestral',
        themeColor: '#00ff88',
        glowColor: 'rgba(0, 255, 136, 0.65)',
        portrait: 'assets/images/portrait_dog.jpg',
        sprite: 'assets/images/sprites/characters/dog_idle.png',
        subSprite: 'assets/images/sprites/characters/dog_special.png',
        roleBadge: 'GUARDIÃO FERAL • FARO TÁTICO IMBATÍVEL',
        stats: { faro: '100%', velocidade: '88%', lealdade: '100%' },
        history: 'Guardião canino de sentidos lendários e presas afiadas. Seu faro detecta emboscadas e covis a quilômetros de distância. É o coração e a proteção viva dos Street Brawlers.',
        quote: '"AUUUU! GRRRR...! (O cheiro dos monstros do lodo tá forte nos canais de esgoto... Sigam minhas patas! Ninguém mexe com a nossa matilha!)"',
        sfx: 'growl'
      },
      {
        id: 'dialogue_assembly',
        type: 'assembly',
        badge: '★ BRIEFING DE MISSÃO • ENTRADA DOS ESGOTOS ★',
        title: 'O CONSELHO DE GUERRA DOS BRAWLERS',
        subtitle: 'A ESTRATÉGIA FINAL ANTES DA INVASÃO',
        themeColor: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.55)',
        dialogues: [
          { speaker: 'ANDREY', color: '#00f0ff', portrait: 'assets/images/portrait_andrey.jpg', text: 'A rota tá selada. Entramos pelo Pântano & Esgoto, derrotamos King Gator e avançamos rumo à Floresta dos Pinheiros!' },
          { speaker: 'EMERSON', color: '#ffaa00', portrait: 'assets/images/portrait_emerson.jpg', text: 'E se o réptil de armadura vier de dente aberto, vai tomar um soco sísmico que vai fazer a carcaça dele voar!' },
          { speaker: 'NATA', color: '#ff0077', portrait: 'assets/images/portrait_nata.jpg', text: 'Eu cubro a retaguarda aérea. Qualquer capanga que tentar cercar a gente vai virar churrasco nos meus pés!' },
          { speaker: 'UNICÃO', color: '#00ff88', portrait: 'assets/images/portrait_dog.jpg', text: 'AUF! AUF! (Vou farejar todos os frangos assados escondidos no caminho pra restaurar a nossa vida!)' },
          { speaker: 'TODOS', color: '#ffd700', portrait: 'assets/images/portrait_emerson.jpg', text: 'HORA DO QUEBRA-QUEBRA! STREET BRAWLERS, AVANÇAR PELOS 9 REINOS!' }
        ],
        sfx: 'special'
      }
    ];

    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  setupDOM() {
    let screen = document.getElementById('story-intro-screen');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'story-intro-screen';
      screen.className = 'screen-layer hidden story-screen';
      const container = document.getElementById('game-container');
      if (container) {
        container.appendChild(screen);
      } else {
        document.body.appendChild(screen);
      }
    }
    this.container = screen;
  }

  show(onComplete = null, onSkip = null) {
    if (onComplete) this.onComplete = onComplete;
    if (onSkip) this.onSkip = onSkip;

    this.setupDOM();
    this.currentScene = 0;
    this.container.classList.remove('hidden');

    window.addEventListener('keydown', this.boundKeyDown);
    this.renderCurrentScene();
  }

  hide() {
    this.stopAutoTimer();
    window.removeEventListener('keydown', this.boundKeyDown);
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'escape' || key === ' ') {
      e.preventDefault();
      this.skip();
    } else if (key === 'enter' || key === 'j' || key === 'z' || key === 'arrowright' || key === 'd') {
      e.preventDefault();
      this.nextScene();
    } else if (key === 'arrowleft' || key === 'a') {
      e.preventDefault();
      this.prevScene();
    }
  }

  nextScene() {
    Sound.init();
    if (this.currentScene < this.scenes.length - 1) {
      this.currentScene++;
      Sound.playTone(400, 600, 0.08, 'sine', 0.15);
      this.renderCurrentScene();
    } else {
      this.complete();
    }
  }

  prevScene() {
    if (this.currentScene > 0) {
      this.currentScene--;
      Sound.playTone(500, 350, 0.08, 'sine', 0.15);
      this.renderCurrentScene();
    }
  }

  skip() {
    Sound.init();
    Sound.playPunch();
    this.hide();
    if (this.onSkip) this.onSkip();
    else if (this.onComplete) this.onComplete();
  }

  complete() {
    Sound.init();
    Sound.playSpecial();
    this.hide();
    if (this.onComplete) this.onComplete();
  }

  stopAutoTimer() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  startAutoTimer() {
    this.stopAutoTimer();
    this.timerStartTime = performance.now();

    const barFill = this.container.querySelector('.story-timer-fill');

    const updateBar = () => {
      const elapsed = performance.now() - this.timerStartTime;
      const progress = Math.min(1, elapsed / this.autoDuration);
      if (barFill) {
        barFill.style.width = `${progress * 100}%`;
      }
      if (progress < 1) {
        this.rafId = requestAnimationFrame(updateBar);
      }
    };
    this.rafId = requestAnimationFrame(updateBar);

    this.autoTimer = setTimeout(() => {
      this.nextScene();
    }, this.autoDuration);
  }

  playSoundForScene(scene) {
    try {
      Sound.init();
      if (scene.sfx === 'laser') Sound.playLaserHit();
      else if (scene.sfx === 'heavy') Sound.playHeavyHit();
      else if (scene.sfx === 'kick') Sound.playKick();
      else if (scene.sfx === 'growl') Sound.playTone(320, 480, 0.18, 'sawtooth', 0.22);
      else if (scene.sfx === 'special') Sound.playSpecial();
      else Sound.playTone(300, 520, 0.12, 'sine', 0.18);
    } catch (e) {}
  }

  renderCurrentScene() {
    const scene = this.scenes[this.currentScene];
    this.playSoundForScene(scene);

    const isAssembly = scene.type === 'assembly';
    const isPrologue = scene.type === 'prologue';

    let contentHtml = '';

    // Step indicators
    let stepsHtml = '<div class="story-steps-row">';
    this.scenes.forEach((sc, idx) => {
      const active = idx === this.currentScene ? 'active' : '';
      const passed = idx < this.currentScene ? 'passed' : '';
      const scName = sc.name || (sc.id === 'prologue' ? 'PRÓLOGO' : 'BRIEFING');
      stepsHtml += `
        <div class="story-step-item ${active} ${passed}" data-idx="${idx}">
          <span class="step-num">${idx + 1}</span>
          <span class="step-label">${scName}</span>
        </div>
      `;
    });
    stepsHtml += '</div>';

    if (isPrologue) {
      contentHtml = `
        <div class="prologue-card-layout">
          <div class="prologue-banner-glow">
            <span class="story-badge">${scene.badge}</span>
            <h1 class="story-hero-title">${scene.title}</h1>
            <p class="story-hero-sub">${scene.subtitle}</p>
          </div>
          <div class="prologue-body-box">
            <div class="prologue-art-backdrop">
              <div class="prologue-heroes-lineup">
                <img src="assets/images/sprites/characters/andrey_idle.png" class="lineup-sprite s-andrey" alt="Andrey">
                <img src="assets/images/sprites/characters/emerson_idle.png" class="lineup-sprite s-emerson" alt="Emerson">
                <img src="assets/images/sprites/characters/nata_idle.png" class="lineup-sprite s-nata" alt="Nata">
                <img src="assets/images/sprites/characters/dog_idle.png" class="lineup-sprite s-unicao" alt="Unicão">
              </div>
            </div>
            <div class="story-speech-box prologue-speech">
              <p class="prologue-lead-text">${scene.text}</p>
            </div>
          </div>
        </div>
      `;
    } else if (isAssembly) {
      let dialoguesHtml = '';
      scene.dialogues.forEach((dlg) => {
        dialoguesHtml += `
          <div class="assembly-dialogue-row" style="border-left-color: ${dlg.color}">
            <img src="${dlg.portrait}" class="dialogue-thumb" alt="${dlg.speaker}">
            <div class="dialogue-text-wrap">
              <span class="dialogue-speaker" style="color: ${dlg.color}">${dlg.speaker}</span>
              <p class="dialogue-quote">${dlg.text}</p>
            </div>
          </div>
        `;
      });

      contentHtml = `
        <div class="assembly-card-layout">
          <div class="story-header-wrap">
            <span class="story-badge">${scene.badge}</span>
            <h1 class="story-hero-title" style="color: ${scene.themeColor}">${scene.title}</h1>
            <p class="story-hero-sub">${scene.subtitle}</p>
          </div>
          <div class="assembly-dialogues-list">
            ${dialoguesHtml}
          </div>
        </div>
      `;
    } else {
      // Hero Spotlight Showcase
      let statsHtml = '';
      for (const [stKey, stVal] of Object.entries(scene.stats)) {
        statsHtml += `
          <div class="hero-stat-pill">
            <span class="stat-name">${stKey.toUpperCase()}</span>
            <span class="stat-val" style="color: ${scene.themeColor}">${stVal}</span>
          </div>
        `;
      }

      contentHtml = `
        <div class="hero-spotlight-layout">
          <!-- Left Column: Portrait, Sprites & Aura -->
          <div class="hero-showcase-visual">
            <div class="hero-aura-glow" style="background: radial-gradient(circle, ${scene.glowColor} 0%, transparent 70%);"></div>
            <div class="hero-portrait-frame" style="border-color: ${scene.themeColor}; box-shadow: 0 0 25px ${scene.glowColor};">
              <img src="${scene.portrait}" class="hero-big-portrait" alt="${scene.name}">
              <div class="hero-role-badge" style="background: ${scene.themeColor};">${scene.roleBadge}</div>
            </div>
            <div class="hero-sprite-showcase">
              <img src="${scene.sprite}" class="hero-idle-sprite" alt="${scene.name}">
              ${scene.subSprite ? `<img src="${scene.subSprite}" class="hero-sub-sprite" alt="SubSprite">` : ''}
            </div>
          </div>

          <!-- Right Column: Lore, Stats & Character Voice Quote -->
          <div class="hero-showcase-info">
            <div class="hero-header-box">
              <span class="story-badge" style="border-color: ${scene.themeColor}; color: ${scene.themeColor};">${scene.name} &bull; APRESENTAÇÃO</span>
              <h1 class="story-hero-title" style="color: ${scene.themeColor}; text-shadow: 0 0 20px ${scene.glowColor};">${scene.name}</h1>
              <h3 class="story-hero-sub">${scene.title}</h3>
            </div>

            <div class="hero-lore-box">
              <h4 class="lore-title">📜 HISTÓRICO DE COMBATE</h4>
              <p class="lore-text">${scene.history}</p>
            </div>

            <div class="hero-stats-row">
              ${statsHtml}
            </div>

            <div class="story-speech-box" style="border-color: ${scene.themeColor}; box-shadow: inset 0 0 20px ${scene.glowColor};">
              <div class="speech-tag" style="background: ${scene.themeColor};">FALA DE INTRODUÇÃO</div>
              <p class="speech-quote">${scene.quote}</p>
            </div>
          </div>
        </div>
      `;
    }

    const isLastScene = this.currentScene === this.scenes.length - 1;
    const nextBtnText = isLastScene ? '🥊 ENTRAR NA BATALHA [ENTER]' : 'PRÓXIMO ➔ [ENTER / J]';

    this.container.innerHTML = `
      <div class="story-screen-backdrop"></div>
      <div class="arcade-scanlines"></div>

      <!-- Top Navigation Header -->
      <div class="story-top-nav">
        <div class="story-brand">
          <span class="brand-dot"></span>
          <span class="brand-text">STREET BRAWLERS &bull; MODO HISTÓRIA &bull; CENA ${this.currentScene + 1}/${this.scenes.length}</span>
        </div>
        ${stepsHtml}
        <button id="btn-skip-story" class="story-skip-btn" type="button" title="Pular história e ir direto para o jogo">
          PULAR HISTÓRIA ➔ [ESC / ESPAÇO]
        </button>
      </div>

      <!-- Main Stage Content -->
      <div class="story-main-stage">
        ${contentHtml}
      </div>

      <!-- Bottom Interactive Controls Bar -->
      <div class="story-bottom-bar">
        <div class="story-timer-bar">
          <div class="story-timer-fill" style="background: ${scene.themeColor}; box-shadow: 0 0 10px ${scene.themeColor}"></div>
        </div>

        <div class="story-controls-row">
          <button id="btn-prev-scene" class="secondary-btn story-nav-btn ${this.currentScene === 0 ? 'disabled' : ''}" type="button">
            ◀ ANTERIOR [A]
          </button>

          <div class="story-hint-keys">
            <span>[ENTER / J] AVANÇAR</span> &bull; <span>[A] VOLTAR</span> &bull; <span>[ESPAÇO / ESC] PULAR</span>
          </div>

          <button id="btn-next-scene" class="primary-btn story-next-btn" type="button" style="background: ${isLastScene ? 'linear-gradient(90deg, #ff0055, #ffd700)' : 'linear-gradient(90deg, #00f0ff, #0088ff)'};">
            <span class="btn-shine"></span>
            ${nextBtnText}
          </button>
        </div>
      </div>
    `;

    // Bind event handlers
    const nextBtn = this.container.querySelector('#btn-next-scene');
    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        this.nextScene();
      };
    }

    const prevBtn = this.container.querySelector('#btn-prev-scene');
    if (prevBtn && this.currentScene > 0) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        this.prevScene();
      };
    }

    const skipBtn = this.container.querySelector('#btn-skip-story');
    if (skipBtn) {
      skipBtn.onclick = (e) => {
        e.stopPropagation();
        this.skip();
      };
    }

    // Allow clicking on steps to jump to that scene
    this.container.querySelectorAll('.story-step-item').forEach((item) => {
      item.onclick = (e) => {
        e.stopPropagation();
        const targetIdx = parseInt(item.getAttribute('data-idx'), 10);
        if (!isNaN(targetIdx) && targetIdx !== this.currentScene) {
          this.currentScene = targetIdx;
          this.renderCurrentScene();
        }
      };
    });

    // Start auto advance timer
    this.startAutoTimer();
  }
}
