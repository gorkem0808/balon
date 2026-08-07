(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const DEFAULTS = {
    gameDurationSec: 60,
    countdownSec: 3,
    scorePerHit: 100,
    launchIntervalMinMs: 900,
    launchIntervalMaxMs: 1500,
    hitWindowMs: 3100,
    warningSeconds: 10,
    autoStartOnCoin: false,
    fullscreenOnStart: true,
    balloonScalePct: 125,
    confettiPowerPct: 145,
    idleMotion: true,
    blinkEnabled: true,
    decorBalloons: true,
    lightsBlink: true,
    musicEnabled: true,
    masterVolume: 85,
    musicVolume: 32,
    effectsVolume: 88,
    coinVolume: 100,
    startVolume: 100,
    hitVolume: 100,
    wrongVolume: 90,
    warningVolume: 72,
    endVolume: 100,
    launchVolume: 55
  };

  const SETTINGS_KEY = 'korgem.pandapig.keyboard.settings.v2';
  const BEST_KEY = 'korgem.pandapig.best.v2';

  function loadSettings() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  let settings = loadSettings();

  const ui = {
    stage: $('#stage'),
    score: $('#scoreValue'),
    time: $('#timeValue'),
    best: $('#bestValue'),
    credits: $('#creditsValue'),
    scoreCard: $('#scoreCard'),
    timeCard: $('#timeCard'),
    bestCard: $('#bestCard'),
    message: $('#centerMessage'),
    messageText: $('#messageText'),
    countdown: $('#countdown'),
    toast: $('#toast'),
    balloonLayer: $('#balloonLayer'),
    burstLayer: $('#burstLayer'),
    pauseBtn: $('#pauseBtn'),
    servicePanel: $('#servicePanel'),
    serviceStatus: $('#serviceStatus'),
    panda: $('#pandaCharacter'),
    pig: $('#pigCharacter'),
    pandaBlink: $('#pandaBlink'),
    pigBlink: $('#pigBlink'),
    decorLayer: $('#decorBalloonLayer'),
    lightsLayer: $('#lightsLayer')
  };

  const game = {
    state: 'attract',
    score: 0,
    best: Number(localStorage.getItem(BEST_KEY) || 0),
    credits: 0,
    timeLeft: Number(settings.gameDurationSec) || 60,
    endAt: 0,
    paused: false,
    pausedAt: 0,
    active: null,
    lastSide: null,
    sameSideCount: 0,
    launchTimer: null,
    tickTimer: null,
    serviceWasPaused: false,
    lastWarningSecond: null,
    wrongCooldownUntil: 0
  };

  const AUDIO_FILES = {
    music: '../assets/audio/music_loop.wav',
    coin: '../assets/audio/coin.wav',
    start: '../assets/audio/start.wav',
    hit: '../assets/audio/hit.wav',
    wrong: '../assets/audio/wrong.wav',
    warning: '../assets/audio/warning.wav',
    end: '../assets/audio/end.wav',
    launch: '../assets/audio/launch.wav',
    click: '../assets/audio/click.wav'
  };

  const audio = {
    unlocked: false,
    music: null,
    init() {
      this.music = new Audio(AUDIO_FILES.music);
      this.music.loop = true;
      this.music.preload = 'auto';
      this.applyMusicVolume();
    },
    async unlock() {
      if (this.unlocked) return;
      this.unlocked = true;
      try {
        if (settings.musicEnabled) await this.playMusic();
      } catch (_) {}
    },
    volume(name) {
      const master = clamp(Number(settings.masterVolume) || 0, 0, 100) / 100;
      if (name === 'music') return master * (clamp(Number(settings.musicVolume) || 0, 0, 100) / 100);
      const fx = clamp(Number(settings.effectsVolume) || 0, 0, 100) / 100;
      const key = `${name}Volume`;
      const event = clamp(Number(settings[key] ?? 100), 0, 100) / 100;
      return master * fx * event;
    },
    applyMusicVolume() {
      if (!this.music) return;
      this.music.volume = this.volume('music');
      if (!settings.musicEnabled) this.music.pause();
      else if (this.unlocked && this.music.paused) this.playMusic();
    },
    async playMusic() {
      if (!settings.musicEnabled || !this.music) return;
      this.applyMusicVolume();
      try { await this.music.play(); } catch (_) {}
    },
    effect(name, factor = 1) {
      if (!this.unlocked || !AUDIO_FILES[name]) return;
      const el = new Audio(AUDIO_FILES[name]);
      el.preload = 'auto';
      el.volume = clamp(this.volume(name) * factor, 0, 1);
      el.play().catch(() => {});
    }
  };
  audio.init();

  function updateHud() {
    ui.score.textContent = Math.round(game.score).toLocaleString('tr-TR');
    ui.time.textContent = Math.max(0, Math.ceil(game.timeLeft));
    ui.best.textContent = Math.round(game.best).toLocaleString('tr-TR');
    ui.credits.textContent = game.credits;
  }

  function showToast(text, ms = 1100) {
    ui.toast.textContent = text;
    ui.toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => ui.toast.classList.remove('show'), ms);
  }

  function showCenter(text, visible = true) {
    ui.messageText.textContent = text;
    ui.message.classList.toggle('show', visible);
  }

  async function showCountdown(value) {
    ui.countdown.textContent = value;
    ui.countdown.classList.remove('fire');
    void ui.countdown.offsetWidth;
    ui.countdown.classList.add('fire');
    await sleep(720);
  }

  async function requestGameFullscreen() {
    if (!settings.fullscreenOnStart || document.fullscreenElement) return;
    try { await document.documentElement.requestFullscreen(); } catch (_) {}
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) { showToast('TAM EKRAN TARAYICI TARAFINDAN ENGELLENDİ'); }
  }

  function addCoin() {
    game.credits += 1;
    updateHud();
    audio.effect('coin');
    showToast('KREDİ ALINDI');
    pulseCard(ui.bestCard, 260);
    if (settings.autoStartOnCoin && (game.state === 'attract' || game.state === 'ended')) {
      setTimeout(() => startGame(), 600);
    } else if (game.state !== 'playing' && game.state !== 'countdown') {
      showCenter('SPACE İLE BAŞLAT', true);
    }
  }

  async function startGame() {
    if (game.state === 'playing' || game.state === 'countdown') return;
    if (game.credits <= 0) {
      audio.effect('wrong', .55);
      showToast('ÖNCE C İLE KREDİ');
      return;
    }

    game.credits -= 1;
    game.score = 0;
    game.timeLeft = Number(settings.gameDurationSec) || 60;
    game.lastWarningSecond = null;
    game.state = 'countdown';
    game.paused = false;
    ui.stage.classList.remove('paused');
    ui.pauseBtn.textContent = 'Ⅱ';
    ui.timeCard.classList.remove('warning');
    clearActiveBalloon();
    clearTimeout(game.launchTimer);
    updateHud();
    showCenter('', false);

    const count = Math.max(1, Number(settings.countdownSec) || 3);
    for (let n = count; n >= 1; n--) await showCountdown(String(n));
    audio.effect('start');
    await showCountdown('BAŞLA!');

    game.state = 'playing';
    game.endAt = performance.now() + game.timeLeft * 1000;
    scheduleLaunch(250);
  }

  function randomLaunchDelay() {
    const min = Math.max(250, Number(settings.launchIntervalMinMs) || 900);
    const max = Math.max(min, Number(settings.launchIntervalMaxMs) || 1500);
    return min + Math.random() * (max - min);
  }

  function chooseSide() {
    let side = Math.random() < .5 ? 'L' : 'R';
    if (side === game.lastSide) {
      game.sameSideCount += 1;
      if (game.sameSideCount >= 2) side = side === 'L' ? 'R' : 'L';
    } else {
      game.sameSideCount = 0;
    }
    game.lastSide = side;
    return side;
  }

  function scheduleLaunch(delay = randomLaunchDelay()) {
    clearTimeout(game.launchTimer);
    if (game.state !== 'playing') return;
    game.launchTimer = setTimeout(() => {
      if (game.paused || ui.servicePanel.classList.contains('open') || game.active) {
        scheduleLaunch(150);
        return;
      }
      launchBalloon();
    }, delay);
  }

  function launchBalloon() {
    if (game.active || game.state !== 'playing') return;
    const side = chooseSide();
    audio.effect('launch');

    const colors = [
      ['#ff829c', '#d81752'],
      ['#4abaff', '#0673db'],
      ['#ffdf45', '#f49a00'],
      ['#91e543', '#3c9d13'],
      ['#ca6aff', '#7624ca'],
      ['#ff7a67', '#d72916']
    ];
    const [c1, c2] = colors[Math.floor(Math.random() * colors.length)];
    const el = document.createElement('div');
    el.className = 'game-balloon';
    el.style.setProperty('--x', side === 'L' ? '41.2%' : '59.0%');
    el.style.setProperty('--color1', c1);
    el.style.setProperty('--color2', c2);
    el.style.setProperty('--flight', `${Math.max(900, Number(settings.hitWindowMs) || 3100)}ms`);
    el.style.setProperty('--balloon-scale', String(clamp(Number(settings.balloonScalePct) || 125, 90, 160) / 100));
    el.dataset.side = side;
    el.title = side === 'L' ? 'Sol sepet balonu' : 'Sağ sepet balonu';
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      onBasket(side, 'touch');
    });

    ui.balloonLayer.appendChild(el);
    flashBasket(side, 'correct', .35);
    const lifetime = Math.max(900, Number(settings.hitWindowMs) || 3100);
    const timeout = setTimeout(() => missBalloon(), lifetime + 100);
    game.active = { side, el, timeout, hit: false };
  }

  function onBasket(side) {
    if (game.state !== 'playing' || game.paused || !game.active) return;
    if (performance.now() < game.wrongCooldownUntil) return;
    if (game.active.side !== side) {
      game.wrongCooldownUntil = performance.now() + 250;
      audio.effect('wrong');
      flashBasket(side, 'wrong');
      wrongCharacter(side);
      showToast('YANLIŞ SEPET!', 650);
      return;
    }
    hitBalloon();
  }

  function hitBalloon() {
    const active = game.active;
    if (!active || active.hit) return;
    active.hit = true;
    clearTimeout(active.timeout);
    game.active = null;

    const rect = active.el.getBoundingClientRect();
    const stageRect = ui.stage.getBoundingClientRect();
    const px = rect.left - stageRect.left + rect.width / 2;
    const py = rect.top - stageRect.top + rect.height / 2;

    active.el.classList.add('popped');
    setTimeout(() => active.el.remove(), 260);
    confettiBurst(px, py, active.side);
    flashBasket(active.side, 'correct');

    game.score += Math.max(1, Number(settings.scorePerHit) || 100);
    if (game.score > game.best) game.best = game.score;
    updateHud();
    audio.effect('hit');
    celebrate(active.side);
    pulseCard(ui.scoreCard);
    showToast(`+${settings.scorePerHit} PUAN`, 700);
    scheduleLaunch(randomLaunchDelay());
  }

  function missBalloon() {
    const active = game.active;
    if (!active) return;
    game.active = null;
    active.el.style.transition = 'opacity .22s, transform .22s';
    active.el.style.opacity = '0';
    active.el.style.transform += ' scale(.8)';
    setTimeout(() => active.el.remove(), 240);
    audio.effect('wrong', .58);
    showToast('BALON KAÇTI!', 650);
    scheduleLaunch(randomLaunchDelay());
  }

  function clearActiveBalloon() {
    if (game.active) {
      clearTimeout(game.active.timeout);
      game.active.el.remove();
      game.active = null;
    }
    ui.balloonLayer.innerHTML = '';
  }

  function flashBasket(side, kind = 'correct', opacityFactor = 1) {
    const f = document.createElement('div');
    f.className = `basket-feedback ${side === 'L' ? 'left' : 'right'} ${kind}`;
    if (opacityFactor !== 1) f.style.opacity = String(opacityFactor);
    ui.stage.appendChild(f);
    setTimeout(() => f.remove(), 500);
  }

  function confettiBurst(x, y, side) {
    const power = clamp(Number(settings.confettiPowerPct) || 145, 70, 200) / 100;
    const count = Math.round(46 * power);
    const colors = ['#ffe339','#ff536c','#54c1ff','#77e467','#c56cff','#ffffff','#ff9b34'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      const shape = i % 7 === 0 ? 'star' : (i % 3 === 0 ? 'round' : '');
      p.className = `confetti-piece ${shape}`;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      const ang = Math.random() * Math.PI * 2;
      const dist = (70 + Math.random() * 155) * power;
      let dx = Math.cos(ang) * dist;
      let dy = Math.sin(ang) * dist - (35 + Math.random() * 80);
      if (side === 'L') dx += Math.random() * 40;
      if (side === 'R') dx -= Math.random() * 40;
      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);
      p.style.setProperty('--r', `${180 + Math.random() * 720}deg`);
      p.style.setProperty('--d', `${650 + Math.random() * 430}ms`);
      p.style.setProperty('--s', `${6 + Math.random() * 11}px`);
      p.style.setProperty('--c', colors[i % colors.length]);
      ui.burstLayer.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }

  function celebrate(side) {
    const el = side === 'L' ? ui.panda : ui.pig;
    el.classList.remove('celebrate');
    void el.offsetWidth;
    el.classList.add('celebrate');
    setTimeout(() => el.classList.remove('celebrate'), 1050);
    const blink = side === 'L' ? ui.pandaBlink : ui.pigBlink;
    blinkNow(blink, Math.random() < .5 ? 'wink-left' : 'wink-right', 190);
  }

  function celebrateBoth() {
    celebrate('L');
    setTimeout(() => celebrate('R'), 120);
  }

  function wrongCharacter(side) {
    const el = side === 'L' ? ui.panda : ui.pig;
    el.classList.remove('wrong-nod');
    void el.offsetWidth;
    el.classList.add('wrong-nod');
    setTimeout(() => el.classList.remove('wrong-nod'), 450);
  }

  function pulseCard(card, duration = 400) {
    card.classList.remove('pulse');
    void card.offsetWidth;
    card.classList.add('pulse');
    setTimeout(() => card.classList.remove('pulse'), duration);
  }

  function tick() {
    if (game.state !== 'playing' || game.paused) return;
    const now = performance.now();
    game.timeLeft = Math.max(0, (game.endAt - now) / 1000);
    updateHud();

    const warningAt = Math.max(3, Number(settings.warningSeconds) || 10);
    if (game.timeLeft <= warningAt && game.timeLeft > 0) {
      ui.timeCard.classList.add('warning');
      const sec = Math.ceil(game.timeLeft);
      if (sec !== game.lastWarningSecond) {
        game.lastWarningSecond = sec;
        audio.effect('warning', sec <= 3 ? 1 : .78);
      }
    } else {
      ui.timeCard.classList.remove('warning');
    }

    if (game.timeLeft <= 0) endGame();
  }

  function endGame() {
    if (game.state !== 'playing') return;
    game.state = 'ended';
    clearTimeout(game.launchTimer);
    clearActiveBalloon();
    game.timeLeft = 0;
    ui.timeCard.classList.remove('warning');
    audio.effect('end');
    celebrateBoth();
    if (game.score >= game.best) {
      game.best = game.score;
      localStorage.setItem(BEST_KEY, String(game.best));
      pulseCard(ui.bestCard, 650);
    }
    updateHud();
    showCenter(`OYUN BİTTİ · ${game.score.toLocaleString('tr-TR')} PUAN`, true);
    if (game.credits > 0 && settings.autoStartOnCoin) setTimeout(() => startGame(), 2600);
  }

  function togglePause(force) {
    if (game.state !== 'playing') return;
    const next = typeof force === 'boolean' ? force : !game.paused;
    if (next === game.paused) return;
    game.paused = next;
    ui.stage.classList.toggle('paused', game.paused);
    ui.pauseBtn.textContent = game.paused ? '▶' : 'Ⅱ';
    if (game.paused) {
      game.pausedAt = performance.now();
      showCenter('DURAKLATILDI', true);
    } else {
      game.endAt += performance.now() - game.pausedAt;
      showCenter('', false);
    }
  }

  // ---- Decorative movement ----
  const decorBalloons = [
    [36.364,12.434,8.134,18.278,5.6,-1.8],
    [45.754,11.477,7.895,18.278,6.3,-3.3],
    [55.742,13.178,8.134,18.278,5.9,-4.1],
    [41.926,28.799,7.656,17.428,6.7,-2.7],
    [50.478,28.799,7.656,17.428,5.4,-3.9],
    [35.167,40.489,7.895,17.853,6.1,-1.2],
    [45.754,40.701,7.895,18.278,5.8,-4.5],
    [55.982,40.808,7.895,18.278,6.5,-2.0]
  ];

  function buildDecorBalloons() {
    ui.decorLayer.innerHTML = '';
    decorBalloons.forEach((b, i) => {
      const img = document.createElement('img');
      img.className = 'decor-balloon';
      img.src = `../assets/decor/balloon_${i + 1}.png`;
      img.style.left = `${b[0]}%`;
      img.style.top = `${b[1]}%`;
      img.style.width = `${b[2]}%`;
      img.style.height = `${b[3]}%`;
      img.style.setProperty('--dur', `${b[4]}s`);
      img.style.setProperty('--delay', `${b[5]}s`);
      ui.decorLayer.appendChild(img);
    });
  }

  const lightPositions = [
    [1.2,6.1],[5.4,8.0],[9.0,10.6],[12.0,13.0],[15.4,14.8],
    [70.5,22.7],[74.0,20.8],[77.5,19.1],[80.8,17.3],[84.1,15.6],[87.0,14.2],[90.2,12.6],[93.7,10.8],[97.1,9.0],
    [4.2,38.5],[6.0,40.5],[8.0,41.1],[10.0,41.8],[12.3,41.5],
    [84.8,44.2],[87.0,44.8],[89.2,45.0],[91.5,45.1],[94.0,44.6],
    [11.2,18.0],[15.6,12.0],[20.0,15.5],[24.0,23.0],[28.0,31.0]
  ];

  function buildLights() {
    ui.lightsLayer.innerHTML = '';
    lightPositions.forEach((p, i) => {
      const d = document.createElement('i');
      d.className = 'twinkle';
      d.style.left = `${p[0]}%`;
      d.style.top = `${p[1]}%`;
      d.style.setProperty('--dur', `${1.25 + (i % 6) * .22}s`);
      d.style.setProperty('--delay', `${-(i % 7) * .19}s`);
      ui.lightsLayer.appendChild(d);
    });
  }

  function blinkNow(group, cls = 'blink', ms = 130) {
    if (!settings.blinkEnabled) return;
    group.classList.remove('blink', 'wink-left', 'wink-right');
    group.classList.add(cls);
    setTimeout(() => group.classList.remove('blink', 'wink-left', 'wink-right'), ms);
  }

  function blinkLoop(group) {
    const again = () => {
      const delay = 2800 + Math.random() * 3600;
      setTimeout(() => {
        if (settings.blinkEnabled && !ui.servicePanel.classList.contains('open')) {
          const r = Math.random();
          blinkNow(group, r < .18 ? 'wink-left' : (r < .36 ? 'wink-right' : 'blink'), r < .36 ? 180 : 125);
        }
        again();
      }, delay);
    };
    again();
  }

  function applyVisualSettings() {
    ui.stage.classList.toggle('idle-motion', !!settings.idleMotion);
    ui.stage.classList.toggle('no-decor-motion', !settings.decorBalloons);
    ui.stage.classList.toggle('no-light-motion', !settings.lightsBlink);
    audio.applyMusicVolume();
  }

  // ---- F8 settings ----
  const numberFields = {
    setGameDuration: 'gameDurationSec',
    setScorePerHit: 'scorePerHit',
    setLaunchMin: 'launchIntervalMinMs',
    setLaunchMax: 'launchIntervalMaxMs',
    setHitWindow: 'hitWindowMs',
    setWarningSeconds: 'warningSeconds'
  };
  const rangeFields = {
    setBalloonScale: 'balloonScalePct',
    setConfettiPower: 'confettiPowerPct',
    setMasterVolume: 'masterVolume',
    setMusicVolume: 'musicVolume',
    setEffectsVolume: 'effectsVolume',
    setCoinVolume: 'coinVolume',
    setStartVolume: 'startVolume',
    setHitVolume: 'hitVolume',
    setWrongVolume: 'wrongVolume',
    setWarningVolume: 'warningVolume',
    setEndVolume: 'endVolume',
    setLaunchVolume: 'launchVolume'
  };
  const checkFields = {
    setAutoStart: 'autoStartOnCoin',
    setFullscreen: 'fullscreenOnStart',
    setIdleMotion: 'idleMotion',
    setBlink: 'blinkEnabled',
    setDecorBalloons: 'decorBalloons',
    setLightsBlink: 'lightsBlink',
    setMusicEnabled: 'musicEnabled'
  };

  function outputForInput(id) {
    const out = document.getElementById(`out${id.replace(/^set/, '')}`);
    if (!out) return;
    const el = document.getElementById(id);
    out.value = `${el.value}%`;
    out.textContent = `${el.value}%`;
  }

  function fillServiceForm() {
    for (const [id,key] of Object.entries(numberFields)) document.getElementById(id).value = settings[key];
    for (const [id,key] of Object.entries(rangeFields)) {
      document.getElementById(id).value = settings[key];
      outputForInput(id);
    }
    for (const [id,key] of Object.entries(checkFields)) document.getElementById(id).checked = !!settings[key];
  }

  function readServiceForm() {
    const next = { ...settings };
    for (const [id,key] of Object.entries(numberFields)) next[key] = Number(document.getElementById(id).value);
    for (const [id,key] of Object.entries(rangeFields)) next[key] = Number(document.getElementById(id).value);
    for (const [id,key] of Object.entries(checkFields)) next[key] = document.getElementById(id).checked;
    if (next.launchIntervalMaxMs < next.launchIntervalMinMs) next.launchIntervalMaxMs = next.launchIntervalMinMs;
    return next;
  }

  function openService() {
    game.serviceWasPaused = game.state === 'playing' && !game.paused;
    if (game.serviceWasPaused) togglePause(true);
    fillServiceForm();
    ui.servicePanel.classList.add('open');
    ui.servicePanel.setAttribute('aria-hidden', 'false');
  }

  function closeService() {
    ui.servicePanel.classList.remove('open');
    ui.servicePanel.setAttribute('aria-hidden', 'true');
    if (game.serviceWasPaused && game.state === 'playing') togglePause(false);
  }

  $('#closeService').addEventListener('click', closeService);
  $('#saveSettings').addEventListener('click', () => {
    settings = readServiceForm();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyVisualSettings();
    if (game.state !== 'playing') game.timeLeft = settings.gameDurationSec;
    updateHud();
    ui.serviceStatus.textContent = 'Ayarlar kaydedildi ve uygulandı.';
    audio.effect('click');
    showToast('AYARLAR KAYDEDİLDİ');
  });
  $('#resetDefaults').addEventListener('click', () => {
    settings = { ...DEFAULTS };
    fillServiceForm();
    applyVisualSettings();
    ui.serviceStatus.textContent = 'Varsayılan değerler forma yüklendi. Kalıcı yapmak için Kaydet & Uygula.';
  });

  Object.keys(rangeFields).forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      outputForInput(id);
      const preview = readServiceForm();
      settings = { ...settings, ...preview };
      audio.applyMusicVolume();
    });
  });

  $$('.audio-grid button[data-sound]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await audio.unlock();
      settings = readServiceForm();
      audio.effect(btn.dataset.sound);
    });
  });

  $('#testCoin').addEventListener('click', async () => { await audio.unlock(); addCoin(); });
  $('#testLeft').addEventListener('click', () => onBasket('L'));
  $('#testRight').addEventListener('click', () => onBasket('R'));
  $('#fullscreenTest').addEventListener('click', toggleFullscreen);
  ui.pauseBtn.addEventListener('click', () => togglePause());

  document.addEventListener('pointerdown', () => audio.unlock(), { once:false });
  document.addEventListener('keydown', async (event) => {
    if (event.key === 'F8') {
      event.preventDefault();
      if (ui.servicePanel.classList.contains('open')) closeService(); else openService();
      return;
    }
    if (event.key === 'Escape' && ui.servicePanel.classList.contains('open')) {
      closeService();
      return;
    }
    if (ui.servicePanel.classList.contains('open')) return;

    const k = event.key.toLowerCase();
    if (k === 'c') {
      await requestGameFullscreen();
      audio.unlock();
      addCoin();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      await requestGameFullscreen();
      audio.unlock();
      if (game.state !== 'playing' && game.state !== 'countdown') startGame();
      return;
    }
    audio.unlock();
    if (k === 'a') onBasket('L');
    if (k === 'l') onBasket('R');
    if (k === 'p') togglePause();
    if (event.key === 'F11') {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  buildDecorBalloons();
  buildLights();
  blinkLoop(ui.pandaBlink);
  blinkLoop(ui.pigBlink);
  applyVisualSettings();
  game.tickTimer = setInterval(tick, 100);
  updateHud();
  showCenter('C TUŞU İLE KREDİ', true);
})();
