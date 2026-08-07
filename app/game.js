(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const DEFAULTS = {
    gameDurationSec: 60,
    countdownSec: 3,
    scorePerHit: 100,
    launchIntervalMinMs: 850,
    launchIntervalMaxMs: 1500,
    hitWindowMs: 2600,
    motorLeftPulseMs: 420,
    motorRightPulseMs: 420,
    sensorDebounceMs: 80,
    coinDebounceMs: 120,
    autoStartOnCoin: true,
    creditsPerCoin: 1,
    mp3Volume: 24,
    trackCoin: 1,
    trackStart: 2,
    trackLaunch: 3,
    trackHit: 4,
    trackMiss: 5,
    trackEnd: 6,
    ledMode: 'during-game',
    ledHitPulseMs: 180,
    characterAnimation: true,
    ferrisWheelAnimation: true,
    fullscreenOnStart: false,
    hardwareBaudRate: 115200,
    preferredPort: ''
  };

  const SETTINGS_KEY = 'korgem.pandapig.settings.v1';
  const BEST_KEY = 'korgem.pandapig.best.v1';

  function loadSettings() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  let settings = loadSettings();

  const ui = {
    score: $('#scoreValue'),
    time: $('#timeValue'),
    best: $('#bestValue'),
    credits: $('#creditsValue'),
    message: $('#centerMessage'),
    messageText: $('#messageText'),
    countdown: $('#countdown'),
    toast: $('#toast'),
    balloonLayer: $('#balloonLayer'),
    burstLayer: $('#burstLayer'),
    pauseBtn: $('#pauseBtn'),
    hardwareBadge: $('#hardwareBadge'),
    hardwareText: $('#hardwareBadge b'),
    stage: $('#stage'),
    servicePanel: $('#servicePanel'),
    portState: $('#portState'),
    serialLog: $('#serialLog')
  };

  const game = {
    state: 'attract',
    score: 0,
    best: Number(localStorage.getItem(BEST_KEY) || 0),
    credits: 0,
    timeLeft: settings.gameDurationSec,
    endAt: 0,
    paused: false,
    pausedAt: 0,
    active: null,
    lastSide: null,
    sameSideCount: 0,
    launchTimer: null,
    tickTimer: null,
    serviceWasPaused: false
  };

  const hardware = {
    connected: false,
    path: '',
    lastLines: [],

    async send(command, quiet = false) {
      if (!window.picoBridge || !this.connected) {
        if (!quiet) logSerial(`[MOCK] ${command}`);
        return false;
      }
      try {
        await window.picoBridge.write(command);
        logSerial(`> ${command}`);
        return true;
      } catch (err) {
        logSerial(`! ${err.message || err}`);
        setHardwareState(false, 'PICO HATA');
        return false;
      }
    },

    handleLine(line) {
      if (!line) return;
      logSerial(`< ${line}`);
      const normalized = String(line).trim().toUpperCase().replaceAll(':', ' ');
      const parts = normalized.split(/\s+/);

      if (parts[0] === 'READY') {
        setHardwareState(true, 'PICO HAZIR');
        this.send(`MP3 VOLUME ${settings.mp3Volume}`, true);
        this.send(`SET DEBOUNCE ${settings.sensorDebounceMs}`, true);
        return;
      }

      if (parts[0] === 'EVENT') {
        if (parts[1] === 'COIN') addCoin('pico');
        if (parts[1] === 'SENSOR' && parts[2] === 'L') onSensor('L', 'pico');
        if (parts[1] === 'SENSOR' && parts[2] === 'R') onSensor('R', 'pico');
        if (parts[1] === 'SENSOR_LEFT') onSensor('L', 'pico');
        if (parts[1] === 'SENSOR_RIGHT') onSensor('R', 'pico');
      }
    }
  };

  function setHardwareState(online, text = '') {
    hardware.connected = online;
    ui.hardwareBadge.classList.toggle('online', online);
    ui.hardwareBadge.classList.toggle('offline', !online);
    ui.hardwareText.textContent = text || (online ? 'PICO BAĞLI' : 'PICO YOK');
    ui.portState.textContent = online ? `Bağlı: ${hardware.path || 'Pico'}` : 'Bağlı değil';
  }

  function logSerial(text) {
    const stamp = new Date().toLocaleTimeString('tr-TR');
    hardware.lastLines.push(`[${stamp}] ${text}`);
    if (hardware.lastLines.length > 18) hardware.lastLines.shift();
    ui.serialLog.textContent = hardware.lastLines.join('\n');
    ui.serialLog.scrollTop = ui.serialLog.scrollHeight;
  }

  function updateHud() {
    ui.score.textContent = game.score.toLocaleString('tr-TR');
    ui.time.textContent = Math.max(0, Math.ceil(game.timeLeft));
    ui.best.textContent = game.best.toLocaleString('tr-TR');
    ui.credits.textContent = game.credits;
  }

  function showToast(text, ms = 1300) {
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

  function playTrack(track) {
    const n = Number(track);
    if (n > 0) hardware.send(`MP3 PLAY ${n}`, true);
  }

  function ledOn() { hardware.send('LED ON', true); }
  function ledOff() { hardware.send('LED OFF', true); }
  function ledPulse(ms = settings.ledHitPulseMs) { hardware.send(`LED PULSE ${Math.max(20, Number(ms) || 100)}`, true); }

  function addCoin(source = 'test') {
    game.credits += Math.max(1, Number(settings.creditsPerCoin) || 1);
    updateHud();
    playTrack(settings.trackCoin);
    showToast('KREDİ ALINDI');

    if (settings.autoStartOnCoin && (game.state === 'attract' || game.state === 'ended')) {
      setTimeout(() => startGame(), 550);
    } else if (game.state !== 'playing' && game.state !== 'countdown') {
      showCenter('BAŞLAMAK İÇİN SPACE');
    }
  }

  async function startGame() {
    if (game.state === 'playing' || game.state === 'countdown') return;
    if (game.credits <= 0) {
      showToast('ÖNCE KOIN');
      return;
    }

    game.credits -= 1;
    game.score = 0;
    game.timeLeft = Number(settings.gameDurationSec) || 60;
    game.state = 'countdown';
    game.paused = false;
    clearActiveBalloon();
    clearTimeout(game.launchTimer);
    updateHud();
    showCenter('', false);

    const count = Math.max(1, Number(settings.countdownSec) || 3);
    for (let n = count; n >= 1; n--) await showCountdown(String(n));
    await showCountdown('BAŞLA!');

    game.state = 'playing';
    game.endAt = performance.now() + game.timeLeft * 1000;
    if (settings.ledMode === 'during-game') ledOn();
    playTrack(settings.trackStart);
    scheduleLaunch(350);
  }

  function randomLaunchDelay() {
    const min = Math.max(150, Number(settings.launchIntervalMinMs) || 850);
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
      if (game.paused || ui.servicePanel.classList.contains('open')) {
        scheduleLaunch(180);
        return;
      }
      launchBalloon();
    }, delay);
  }

  function launchBalloon() {
    if (game.active || game.state !== 'playing') return;

    const side = chooseSide();
    const pulse = side === 'L' ? settings.motorLeftPulseMs : settings.motorRightPulseMs;
    hardware.send(`MOTOR ${side} ${Math.max(50, Number(pulse) || 400)}`, true);
    playTrack(settings.trackLaunch);

    const colors = [
      ['#ff869e', '#d71952'],
      ['#4ab8ff', '#0871d9'],
      ['#ffde48', '#f39a00'],
      ['#8ee440', '#3b9b12'],
      ['#cb6cff', '#7624c8'],
      ['#ff7967', '#d82616']
    ];
    const [c1, c2] = colors[Math.floor(Math.random() * colors.length)];
    const el = document.createElement('div');
    el.className = 'game-balloon';
    el.style.setProperty('--x', side === 'L' ? '41.4%' : '59.6%');
    el.style.setProperty('--color1', c1);
    el.style.setProperty('--color2', c2);
    el.style.setProperty('--flight', `${Math.max(700, Number(settings.hitWindowMs) || 2600)}ms`);
    el.dataset.side = side;
    el.title = side === 'L' ? 'Sol balon' : 'Sağ balon';

    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      onSensor(side, 'touch');
    });

    ui.balloonLayer.appendChild(el);
    const timeout = setTimeout(() => missBalloon(), Math.max(700, Number(settings.hitWindowMs) || 2600) + 80);
    game.active = { side, el, timeout, hit: false };
  }

  function onSensor(side, source = 'test') {
    if (game.state !== 'playing' || game.paused || !game.active) return;
    if (game.active.side !== side) {
      showToast(side === 'L' ? 'SOL SENSÖR - AKTİF BALON SAĞDA' : 'SAĞ SENSÖR - AKTİF BALON SOLDA', 700);
      return;
    }
    hitBalloon(source);
  }

  function hitBalloon(source) {
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
    burst(px, py);

    game.score += Math.max(1, Number(settings.scorePerHit) || 100);
    if (game.score > game.best) game.best = game.score;
    updateHud();
    playTrack(settings.trackHit);
    ledPulse(settings.ledHitPulseMs);
    react(active.side);
    showToast(`+${settings.scorePerHit} PUAN`, 650);
    scheduleLaunch(randomLaunchDelay());
  }

  function missBalloon() {
    const active = game.active;
    if (!active) return;
    game.active = null;
    active.el.style.transition = 'opacity .2s';
    active.el.style.opacity = '0';
    setTimeout(() => active.el.remove(), 230);
    playTrack(settings.trackMiss);
    showToast('KAÇTI!', 650);
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

  function burst(x, y) {
    const palette = ['#ffdf3c','#ff4e68','#59bbff','#7ce05b','#c46cff','#ffffff'];
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('i');
      p.className = 'burst';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      const ang = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 90;
      p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
      p.style.background = palette[i % palette.length];
      ui.burstLayer.appendChild(p);
      setTimeout(() => p.remove(), 750);
    }
  }

  const animationLocks = { panda: false, pig: false };
  async function animatePatch(selector, lockKey) {
    if (!settings.characterAnimation || animationLocks[lockKey]) return;
    animationLocks[lockKey] = true;
    const frames = $$(selector + ' .character-frame');
    const sequence = [1, 2, 3, 2, 1, 0];
    for (const idx of sequence) {
      frames.forEach((f, i) => f.classList.toggle('active', i === idx));
      await sleep(idx === 3 ? 170 : 135);
    }
    frames.forEach((f, i) => f.classList.toggle('active', i === 0));
    animationLocks[lockKey] = false;
  }

  function react(side) {
    if (side === 'L') animatePatch('#pandaPatch', 'panda');
    if (side === 'R') animatePatch('#pigPatch', 'pig');
  }

  function celebrateBoth() {
    animatePatch('#pandaPatch', 'panda');
    animatePatch('#pigPatch', 'pig');
  }

  function tick() {
    if (game.state !== 'playing' || game.paused) return;
    const now = performance.now();
    game.timeLeft = Math.max(0, (game.endAt - now) / 1000);
    updateHud();
    if (game.timeLeft <= 0) endGame();
  }

  function endGame() {
    if (game.state !== 'playing') return;
    game.state = 'ended';
    clearTimeout(game.launchTimer);
    clearActiveBalloon();
    game.timeLeft = 0;
    ledOff();
    playTrack(settings.trackEnd);
    celebrateBoth();

    if (game.score >= game.best) {
      game.best = game.score;
      localStorage.setItem(BEST_KEY, String(game.best));
    }
    updateHud();
    showCenter(`OYUN BİTTİ · ${game.score.toLocaleString('tr-TR')} PUAN`, true);
    if (game.credits > 0 && settings.autoStartOnCoin) {
      setTimeout(() => startGame(), 2400);
    }
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
      const pausedFor = performance.now() - game.pausedAt;
      game.endAt += pausedFor;
      showCenter('', false);
    }
  }

  // Ferris wheel: real scene snapshots are cross-faded inside the original wheel area.
  // No synthetic wheel is drawn in front of the approved art.
  let wheelIndex = 0;
  setInterval(() => {
    if (!settings.ferrisWheelAnimation || game.paused || ui.servicePanel.classList.contains('open')) return;
    const frames = $$('#wheelViewport .wheel-frame');
    wheelIndex = (wheelIndex + 1) % frames.length;
    frames.forEach((f, i) => f.classList.toggle('active', i === wheelIndex));
  }, 880);

  // ---------------- F8 SERVICE ----------------
  const fieldMap = {
    setGameDuration: 'gameDurationSec',
    setScorePerHit: 'scorePerHit',
    setLaunchMin: 'launchIntervalMinMs',
    setLaunchMax: 'launchIntervalMaxMs',
    setHitWindow: 'hitWindowMs',
    setMotorLeft: 'motorLeftPulseMs',
    setMotorRight: 'motorRightPulseMs',
    setSensorDebounce: 'sensorDebounceMs',
    setLedHit: 'ledHitPulseMs',
    setMp3Volume: 'mp3Volume',
    setTrackCoin: 'trackCoin',
    setTrackStart: 'trackStart',
    setTrackLaunch: 'trackLaunch',
    setTrackHit: 'trackHit',
    setTrackMiss: 'trackMiss',
    setTrackEnd: 'trackEnd'
  };

  function fillServiceForm() {
    for (const [id, key] of Object.entries(fieldMap)) {
      const el = document.getElementById(id);
      if (el) el.value = settings[key];
    }
    $('#setAutoStart').checked = !!settings.autoStartOnCoin;
    $('#setWheelAnim').checked = !!settings.ferrisWheelAnimation;
    $('#setCharacterAnim').checked = !!settings.characterAnimation;
  }

  function readServiceForm() {
    const next = { ...settings };
    for (const [id, key] of Object.entries(fieldMap)) {
      const el = document.getElementById(id);
      next[key] = Number(el.value);
    }
    next.autoStartOnCoin = $('#setAutoStart').checked;
    next.ferrisWheelAnimation = $('#setWheelAnim').checked;
    next.characterAnimation = $('#setCharacterAnim').checked;
    next.preferredPort = $('#portSelect').value || settings.preferredPort || '';
    next.hardwareBaudRate = 115200;
    if (next.launchIntervalMaxMs < next.launchIntervalMinMs) next.launchIntervalMaxMs = next.launchIntervalMinMs;
    return next;
  }

  async function applySettingsToPico() {
    await hardware.send(`MP3 VOLUME ${Math.max(0, Math.min(30, settings.mp3Volume))}`, true);
    await hardware.send(`SET DEBOUNCE ${Math.max(10, settings.sensorDebounceMs)}`, true);
  }

  async function refreshPorts() {
    const select = $('#portSelect');
    const current = select.value || settings.preferredPort;
    select.innerHTML = '<option value="">Port seçin</option>';
    if (!window.picoBridge) {
      const opt = document.createElement('option');
      opt.value = 'MOCK';
      opt.textContent = 'Tarayıcı / Mock Modu';
      select.appendChild(opt);
      return;
    }
    try {
      const ports = await window.picoBridge.listPorts();
      for (const p of ports) {
        const opt = document.createElement('option');
        opt.value = p.path;
        const info = [p.path, p.manufacturer, p.friendlyName].filter(Boolean).join(' · ');
        opt.textContent = info || p.path;
        select.appendChild(opt);
      }
      if (current && [...select.options].some(o => o.value === current)) select.value = current;
      logSerial(`${ports.length} seri port bulundu.`);
    } catch (err) {
      logSerial(`Port tarama hatası: ${err.message || err}`);
    }
  }

  async function connectPort() {
    const serialPath = $('#portSelect').value;
    if (!serialPath || serialPath === 'MOCK') {
      setHardwareState(false, 'MOCK MOD');
      showToast('Mock mod: klavye ile test');
      return;
    }
    try {
      ui.portState.textContent = 'Bağlanıyor...';
      const result = await window.picoBridge.connect({ path: serialPath, baudRate: 115200 });
      hardware.path = result.path || serialPath;
      settings.preferredPort = hardware.path;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setHardwareState(true, 'PICO BAĞLI');
      await hardware.send('PING', true);
      await applySettingsToPico();
    } catch (err) {
      setHardwareState(false, 'BAĞLANTI HATASI');
      logSerial(`Bağlantı hatası: ${err.message || err}`);
    }
  }

  async function disconnectPort() {
    try {
      if (window.picoBridge) await window.picoBridge.disconnect();
    } catch (_) {}
    hardware.path = '';
    setHardwareState(false, 'PICO YOK');
  }

  function openService() {
    game.serviceWasPaused = game.state === 'playing' && !game.paused;
    if (game.serviceWasPaused) togglePause(true);
    fillServiceForm();
    ui.servicePanel.classList.add('open');
    ui.servicePanel.setAttribute('aria-hidden', 'false');
    refreshPorts();
  }

  function closeService() {
    ui.servicePanel.classList.remove('open');
    ui.servicePanel.setAttribute('aria-hidden', 'true');
    if (game.serviceWasPaused && game.state === 'playing') togglePause(false);
  }

  $('#closeService').addEventListener('click', closeService);
  $('#refreshPorts').addEventListener('click', refreshPorts);
  $('#connectPort').addEventListener('click', connectPort);
  $('#disconnectPort').addEventListener('click', disconnectPort);

  $('#saveSettings').addEventListener('click', async () => {
    settings = readServiceForm();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    await applySettingsToPico();
    game.timeLeft = game.state === 'playing' ? game.timeLeft : settings.gameDurationSec;
    updateHud();
    showToast('AYARLAR KAYDEDİLDİ');
    logSerial('Ayarlar kaydedildi ve Pico’ya uygulandı.');
  });

  $('#resetDefaults').addEventListener('click', () => {
    settings = { ...DEFAULTS };
    fillServiceForm();
    showToast('VARSAYILAN AYARLAR YÜKLENDİ');
  });

  $$('.test-grid button').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const test = btn.dataset.test;
      if (test === 'motorL') await hardware.send(`MOTOR L ${Number($('#setMotorLeft').value) || 400}`);
      if (test === 'motorR') await hardware.send(`MOTOR R ${Number($('#setMotorRight').value) || 400}`);
      if (test === 'sensorL') onSensor('L', 'service');
      if (test === 'sensorR') onSensor('R', 'service');
      if (test === 'coin') addCoin('service');
      if (test === 'led') await hardware.send('LED PULSE 500');
      if (test === 'mp3') await hardware.send(`MP3 PLAY ${Number($('#setTrackHit').value) || 4}`);
    });
  });

  ui.pauseBtn.addEventListener('click', () => togglePause());

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

    if (event.key.toLowerCase() === 'c') addCoin('keyboard');
    if (event.key.toLowerCase() === 'a') onSensor('L', 'keyboard');
    if (event.key.toLowerCase() === 'l') onSensor('R', 'keyboard');
    if (event.code === 'Space') {
      event.preventDefault();
      if (game.state !== 'playing' && game.state !== 'countdown') startGame();
    }
    if (event.key === 'F11') {
      event.preventDefault();
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch (_) {}
    }
  });

  if (window.picoBridge) {
    window.picoBridge.onLine((line) => hardware.handleLine(line));
    window.picoBridge.onState((info) => {
      if (info.state === 'connected') {
        hardware.path = info.detail || hardware.path;
        setHardwareState(true, 'PICO BAĞLI');
      }
      if (info.state === 'disconnected') setHardwareState(false, 'PICO YOK');
      if (info.state === 'error') {
        setHardwareState(false, 'PICO HATA');
        logSerial(`Seri hata: ${info.detail || ''}`);
      }
    });
  }

  game.tickTimer = setInterval(tick, 100);
  updateHud();
  showCenter('KOIN ATIN', true);
  setHardwareState(false, window.picoBridge ? 'PICO YOK' : 'MOCK MOD');
  logSerial('Oyun hazır. F8 servis menüsünü açar.');
})();
