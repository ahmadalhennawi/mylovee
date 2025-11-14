(() => {
  const meta = (name) => {
    const m = document.querySelector(`meta[name="${name}"]`);
    return (m && m.content) ? m.content.trim() : "";
  };

  const LOVE_NAME = meta('mylove-name') || 'Mein Schatz';
  const BIRTHDAY_STR = meta('mylove-birthday') || '1996-11-16'; // YYYY-MM-DD

  // Parse birthday
  const [BY, BM, BD] = BIRTHDAY_STR.split('-').map((n) => parseInt(n, 10));
  if (!BY || !BM || !BD) {
    // If misconfigured, do nothing
    return;
  }

  const overlay = document.getElementById('birthday-overlay');
  const countEl = overlay ? overlay.querySelector('.bd-count') : null;
  const msgEl = overlay ? overlay.querySelector('.bd-msg') : null;
  const canvas = document.getElementById('fireworks-canvas');
  const testBtn = document.getElementById('test-birthday-btn');

  if (!overlay || !countEl || !msgEl || !canvas) return;

  // Inject minimal styles for the overlay and button to match the modern love vibe
  const style = document.createElement('style');
  style.textContent = `
    #birthday-overlay { position: fixed; inset: 0; z-index: 99999; display: none; align-items: center; justify-content: center; 
      background: radial-gradient(1200px 800px at 50% 40%, rgba(76,29,149,0.95) 0%, rgba(15,23,42,0.95) 55%, rgba(15,23,42,0.98) 100%),
                  linear-gradient(135deg, rgba(255,95,150,0.25), rgba(192,132,252,0.18)); }
    #birthday-overlay .bd-content { position: relative; text-align: center; z-index: 2; padding: 20px 30px; }
    #birthday-overlay .bd-count { font-size: clamp(4rem, 9vw, 9rem); font-weight: 800; letter-spacing: 2px; color: #fff; 
      text-shadow: 0 10px 30px rgba(0,0,0,.4), 0 0 30px rgba(255,95,150,.5); }
    #birthday-overlay .bd-msg { margin-top: 14px; color: #ffcfdf; font-size: clamp(1rem, 2.4vw, 1.6rem); opacity: 0; }
    #birthday-overlay .bd-msg .bd-age { display: block; color: #fff; font-size: clamp(1.4rem, 3vw, 2rem); margin-top: 6px; }
    #fireworks-canvas { position: absolute; inset: 0; z-index: 1; }
    #test-birthday-btn { position: fixed; right: 18px; bottom: 18px; z-index: 100000; background: linear-gradient(135deg,#ff5f96,#c084fc); 
      color: #fff; border: none; border-radius: 999px; padding: 10px 16px; font-weight: 700; box-shadow: 0 8px 20px rgba(0,0,0,.25);
      cursor: pointer; opacity: .85; transition: transform .15s ease, opacity .15s ease; }
    #test-birthday-btn:hover { transform: translateY(-2px); opacity: 1; }
  `;
  document.head.appendChild(style);

  // Helpers
  const pad2 = (n) => (n < 10 ? '0' + n : '' + n);
  const format = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return (m > 0 ? pad2(m) + ':' : '') + pad2(sec);
  };

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const birthdayOfYear = (year) => {
    const d = new Date(year, BM - 1, BD);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const nextBirthdayMidnight = (now) => {
    const thisYear = birthdayOfYear(now.getFullYear());
    return (thisYear > now) ? thisYear : birthdayOfYear(now.getFullYear() + 1);
  };

  const ageOn = (year) => year - BY;

  let fireworksRAF = null;
  let fwCtx = null;
  let particles = [];
  let rockets = [];

  // Fireworks implementation (simple but pretty)
  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    fwCtx && fwCtx.scale(dpr, dpr);
  }

  function spawnRocket() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    rockets.push({
      x: Math.random() * w,
      y: h + 10,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(7 + Math.random() * 3),
      color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
      life: 60 + Math.random() * 20
    });
  }

  function burst(x, y, color) {
    const count = 40 + Math.random() * 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        gravity: 0.06 + Math.random() * 0.04,
        fade: 0.015 + Math.random() * 0.02
      });
    }
  }

  function runFireworks() {
    fwCtx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.08; // gravity
      r.life -= 1;

      fwCtx.beginPath();
      fwCtx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
      fwCtx.fillStyle = r.color;
      fwCtx.fill();

      if (r.life <= 0 || r.vy >= 0) {
        burst(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.fade;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
      fwCtx.globalAlpha = Math.max(0, p.alpha);
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      fwCtx.fillStyle = p.color;
      fwCtx.fill();
      fwCtx.globalAlpha = 1;
    }

    // spawn rockets randomly
    if (Math.random() < 0.08) spawnRocket();

    fireworksRAF = requestAnimationFrame(runFireworks);
  }

  function startFireworks() {
    fwCtx = canvas.getContext('2d');
    // size canvas to overlay size
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    if (!fireworksRAF) fireworksRAF = requestAnimationFrame(runFireworks);
  }

  function stopFireworks() {
    try { if (window && window.bdKeepRunning) return; } catch {}
    cancelAnimationFrame(fireworksRAF);
    fireworksRAF = null;
    window.removeEventListener('resize', resizeCanvas);
    particles = [];
    rockets = [];
    const ctx = canvas.getContext('2d');
    ctx && ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  function showOverlay(durationSec, finishingAge) {
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    countEl.style.display = '';
    msgEl.innerHTML = '';

    // extra cute effects during countdown
    try { startTwinkles(80); } catch {}
    try { startBalloons(); } catch {}

    let remaining = Math.max(0, Math.floor(durationSec));
    countEl.textContent = format(remaining);

    // confetti at the end of countdown
    try { setTimeout(() => startConfetti(120), remaining * 1000); } catch {}

    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        countEl.style.display = 'none';
        // Enhanced finale: run multi-stage sequence and stop here
        try { startFinalSequence(finishingAge); } catch {}
        return;
      }
      try { playCountdownTick(remaining); } catch {}
      countEl.textContent = format(remaining);
    };
    const timer = setInterval(tick, 1000);
  }

  let overlayShown = false;

  function checkSchedule() {
    const now = new Date();
    const target = nextBirthdayMidnight(now);
    const diffSec = Math.floor((target - now) / 1000);
    const url = new URLSearchParams(location.search);
    const force = url.get('testBirthday');

    if (overlayShown) return;

    if (force === '1' || force === 'now') {
      // Test: run short countdown
      showOverlay(10, ageOn(target.getFullYear()));
      overlayShown = true;
      return;
    }

    // If we are in the last 60s before midnight of birthday, start countdown
    if (diffSec > 0 && diffSec <= 60) {
      showOverlay(diffSec, ageOn(target.getFullYear()));
      overlayShown = true;
      return;
    }

    // If it's the birthday just after midnight (first minute), show greeting + fireworks
    const todayMidnight = birthdayOfYear(now.getFullYear());
    if (sameDay(now, todayMidnight) && now - todayMidnight <= 60 * 1000) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
      countEl.style.display = 'none';
      // Enhanced finale when already birthday just after midnight
      try { startFinalSequence(ageOn(now.getFullYear())); } catch {}
      overlayShown = true;
      return;
    }
  }

  // Hook test button
  if (testBtn) {
    testBtn.addEventListener('click', (e) => {
      try { e && e.preventDefault && e.preventDefault(); } catch {}
      const nb = nextBirthdayMidnight(new Date());
      overlayShown = true;
      showOverlay(10, ageOn(nb.getFullYear()));
    });
  }

  // Run on load and keep checking until shown
  checkSchedule();
  const scheduleTimer = setInterval(() => {
    if (overlayShown) { clearInterval(scheduleTimer); return; }
    checkSchedule();
  }, 1000);
})();

// Persistent finale helpers and surprises
function startConfettiStream() {
  try { if (window.bdConfettiStream) return window.bdConfettiStream; } catch {}
  const id = setInterval(() => startConfetti(40 + Math.floor(Math.random() * 40)), 1800);
  try { window.bdConfettiStream = id; } catch {}
  return id;
}
function stopConfettiStream() {
  try {
    if (window.bdConfettiStream) {
      clearInterval(window.bdConfettiStream);
      window.bdConfettiStream = null;
    }
  } catch {}
}

function startHeartTrail() {
  const overlay = document.getElementById('birthday-overlay');
  if (!overlay) return () => {};
  if (window.bdHeartHandler) return window.bdHeartHandler;
  const make = (x, y) => {
    const el = document.createElement('div');
    el.textContent = '❤';
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.fontSize = (12 + Math.random() * 10) + 'px';
    el.style.color = ['#ff5f96', '#c084fc', '#ffb3c6', '#ffd166'][Math.floor(Math.random() * 4)];
    el.style.pointerEvents = 'none';
    el.style.zIndex = 4;
    el.style.opacity = '0.9';
    el.style.transition = 'transform 1.8s ease-out, opacity 1.8s ease-out';
    document.body.appendChild(el);
    const dx = (Math.random() - 0.5) * 60;
    const dy = -40 - Math.random() * 40;
    requestAnimationFrame(() => {
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.3)`;
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 1900);
  };
  const handler = (e) => { make(e.clientX, e.clientY); };
  overlay.addEventListener('mousemove', handler);
  try { window.bdHeartHandler = handler; } catch {}
  return handler;
}
function stopHeartTrail() {
  const overlay = document.getElementById('birthday-overlay');
  try {
    if (overlay && window.bdHeartHandler) {
      overlay.removeEventListener('mousemove', window.bdHeartHandler);
      window.bdHeartHandler = null;
    }
  } catch {}
}

function ensureCloseButton() {
  const overlay = document.getElementById('birthday-overlay');
  if (!overlay) return;
  let css = document.getElementById('bd-close-style');
  if (!css) {
    css = document.createElement('style');
    css.id = 'bd-close-style';
    css.textContent = `#bd-close{position:absolute;top:14px;right:14px;z-index:3;background:rgba(15,23,42,0.6);color:#fff;border:1px solid rgba(255,255,255,.2);padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:700;backdrop-filter:blur(6px);box-shadow:0 6px 16px rgba(0,0,0,.25);transition:transform .15s ease,opacity .15s ease}#bd-close:hover{transform:translateY(-1px);opacity:.95}`;
    document.head.appendChild(css);
  }
  let btn = document.getElementById('bd-close');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'bd-close';
    btn.type = 'button';
    btn.textContent = '💜';
    overlay.appendChild(btn);
  }
  btn.onclick = stopAllEffects;
}

function stopAllEffects() {
  try { window.bdKeepRunning = false; } catch {}
  stopConfettiStream();
  stopHeartTrail();
  try { if (window.bdPhotosTimer) { clearInterval(window.bdPhotosTimer); window.bdPhotosTimer = null; } } catch {}
  try { const p = document.getElementById('bd-photos'); if (p) p.remove(); } catch {}
  try { stopBirthdaySong(); } catch {}
  try { stopBirthdayTrack(); } catch {}
  try { window.bdStopBalloons && window.bdStopBalloons(); } catch {}
  try { window.bdStopTwinkles && window.bdStopTwinkles(); } catch {}
  try { document.getElementById('birthday-overlay').style.display = 'none'; } catch {}
  try { document.getElementById('birthday-overlay').setAttribute('aria-hidden', 'true'); } catch {}
  try { stopFireworks(); } catch {}
}

// In case finale gets triggered by midnight branch, switch to persistent mode automatically
(function observeFinale() {
  const overlay = document.getElementById('birthday-overlay');
  const count = overlay ? overlay.querySelector('.bd-count') : null;
  if (!overlay || !count) return;
  setInterval(() => {
    try {
      if (overlay.style.display !== 'none' && getComputedStyle(count).display === 'none') {
        if (!window.bdFinaleStarted) {
          window.bdFinaleStarted = true;
          window.bdKeepRunning = true;
          ensureCloseButton();
          startConfettiStream();
          try { playBirthdayAudioPreferred(); } catch {}
          try { ensureAudioButton(); } catch {}
        }
      }
    } catch {}
  }, 1000);
})();

// Audio: Happy Birthday melody (Web Audio API)
let bdAudio = { ctx: null, master: null, timers: [], playing: false };
let bdTrack = { el: null, playing: false };

function ensureAudioCtx() {
  if (bdAudio.ctx) return bdAudio.ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0.15; // gentle volume
  master.connect(ctx.destination);
  bdAudio.ctx = ctx;
  bdAudio.master = master;
  return ctx;
}

function startBirthdaySong() {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  if (bdAudio.playing) return;
  const resume = async () => {
    try { if (ctx.state === 'suspended') await ctx.resume(); } catch {}
  };
  resume().then(() => {
    bdAudio.playing = true;
    playSongLoop();
  });
}

function stopBirthdaySong() {
  bdAudio.playing = false;
  try { bdAudio.timers.forEach(id => clearTimeout(id)); } catch {}
  bdAudio.timers = [];
  // do not close context; just leave it for reuse
}

// Short tick/chime for countdown seconds
function playCountdownTick(remaining) {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  // be polite: if user hasn’t interacted and autoplay is blocked, this may be silent until unblocked
  const now = ctx.currentTime + 0.01;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const isFinal5 = remaining <= 5;
  const freq = isFinal5 ? 1100 : 700;
  const dur = isFinal5 ? 0.12 : 0.06;
  const vol = isFinal5 ? 0.20 : 0.12;
  osc.type = isFinal5 ? 'square' : 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.connect(g); g.connect(bdAudio.master);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(vol, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function ensureAudioFile() {
  if (bdTrack.el) return bdTrack.el;
  const el = document.getElementById('bd-audio-file');
  if (!el) return null;
  el.loop = true;
  el.volume = 0.5;
  bdTrack.el = el;
  return el;
}

async function startBirthdayTrack() {
  const el = ensureAudioFile();
  if (!el) return false;
  try {
    await el.play();
    bdTrack.playing = true;
    return true;
  } catch (e) {
    return false; // likely autoplay blocked
  }
}

function stopBirthdayTrack() {
  if (!bdTrack.el) return;
  try { bdTrack.el.pause(); } catch {}
  try { bdTrack.el.currentTime = 0; } catch {}
  bdTrack.playing = false;
}

// Prefer real audio track; fall back to synth if missing/blocked
async function playBirthdayAudioPreferred() {
  const ok = await startBirthdayTrack();
  if (!ok && !bdAudio.playing) startBirthdaySong();
}

function noteFreq(n) {
  // n like 'G4', 'C5'; supports sharps with '#'
  const A4 = 440;
  const SEMI = Math.pow(2, 1 / 12);
  const map = {
    'C': -9, 'C#': -8, 'Db': -8,
    'D': -7, 'D#': -6, 'Eb': -6,
    'E': -5,
    'F': -4, 'F#': -3, 'Gb': -3,
    'G': -2, 'G#': -1, 'Ab': -1,
    'A': 0, 'A#': 1, 'Bb': 1,
    'B': 2
  };
  const m = n.match(/^([A-G](?:#|b)?)(\d)$/);
  if (!m) return A4;
  const name = m[1];
  const oct = parseInt(m[2], 10);
  const halfStepsFromA4 = (oct - 4) * 12 + map[name];
  return A4 * Math.pow(SEMI, halfStepsFromA4);
}

function tone(ctx, freq, when, dur, gain = 0.25) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(g); g.connect(bdAudio.master);
  const a = g.gain;
  a.setValueAtTime(0.0001, when);
  a.linearRampToValueAtTime(gain, when + 0.02);
  a.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function playSongLoop() {
  if (!bdAudio.playing) return;
  const ctx = bdAudio.ctx;
  const beat = 0.48; // seconds per beat (~125 bpm)
  // Happy Birthday melody (notes with durations in beats)
  const part = [
    ['G4', 1], ['G4', 1], ['A4', 2], ['G4', 2], ['C5', 2], ['B4', 4],
    ['G4', 1], ['G4', 1], ['A4', 2], ['G4', 2], ['D5', 2], ['C5', 4],
    ['G4', 1], ['G4', 1], ['G5', 2], ['E5', 2], ['C5', 2], ['B4', 2], ['A4', 2],
    ['F5', 1], ['F5', 1], ['E5', 2], ['C5', 2], ['D5', 2], ['C5', 4]
  ];
  const start = ctx.currentTime + 0.05;
  let t = start;
  for (const [n, d] of part) {
    const freq = noteFreq(n);
    const dur = d * beat * 0.95;
    tone(ctx, freq, t, dur);
    t += d * beat;
  }
  const total = t - start + 0.3;
  const id = setTimeout(() => { if (bdAudio.playing) playSongLoop(); }, total * 1000);
  bdAudio.timers.push(id);
}

// Audio UI helper: show a small button to enable sound if blocked
function ensureAudioButton() {
  const overlay = document.getElementById('birthday-overlay');
  if (!overlay) return;
  // show if either WebAudio or HTMLAudio track is available
  if (!ensureAudioCtx() && !ensureAudioFile()) return; // no audio support
  let css = document.getElementById('bd-audio-style');
  if (!css) {
    css = document.createElement('style');
    css.id = 'bd-audio-style';
    css.textContent = `#bd-audio{position:absolute;left:14px;bottom:14px;z-index:3;background:rgba(15,23,42,0.6);color:#fff;border:1px solid rgba(255,255,255,.2);padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:700;backdrop-filter:blur(6px);box-shadow:0 6px 16px rgba(0,0,0,.25)}#bd-audio.hidden{display:none}`;
    document.head.appendChild(css);
  }
  let btn = document.getElementById('bd-audio');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'bd-audio';
    btn.type = 'button';
    btn.textContent = '💜';
    overlay.appendChild(btn);
  }
  const refresh = () => {
    const anyPlaying = !!bdAudio.playing || !!bdTrack.playing;
    btn.classList.toggle('hidden', anyPlaying);
  };
  btn.onclick = async () => {
    try {
      const ctx = bdAudio.ctx;
      if (ctx && ctx.state === 'suspended') await ctx.resume();
    } catch {}
    await playBirthdayAudioPreferred();
    refresh();
  };
  refresh();
}

// Cute effects implementations (global helpers)
function startBalloons() {
  const overlay = document.getElementById('birthday-overlay');
  if (!overlay) return () => {};
  const css = document.createElement('style');
  css.textContent = `
    .bd-balloon { position: absolute; bottom: -80px; width: 28px; height: 36px; border-radius: 50% 50% 48% 48%;
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.6), rgba(255,255,255,0) 35%),
                  linear-gradient(160deg, #ff7fb1, #ff5f96);
      box-shadow: 0 10px 25px rgba(0,0,0,.25); z-index: 2; }
    .bd-balloon.bd2 { background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.6), rgba(255,255,255,0) 35%), linear-gradient(160deg, #c084fc, #9b72f2); }
    .bd-balloon.bd3 { background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.6), rgba(255,255,255,0) 35%), linear-gradient(160deg, #ffb3c6, #ff86b6); }
    .bd-balloon::after { content: ''; position: absolute; left: 50%; transform: translateX(-50%); bottom: -16px; width: 2px; height: 26px; background: rgba(255,255,255,.7); }
    @keyframes riseBalloon { 0% { transform: translateY(0) translateX(0) scale(1); opacity: .95; } 100% { transform: translateY(-105vh) translateX(var(--drift)) scale(1.05); opacity: .9; } }
  `;
  document.head.appendChild(css);

  let active = true;
  const spawn = () => {
    if (!active) return;
    const b = document.createElement('div');
    b.className = 'bd-balloon ' + ['', 'bd2', 'bd3'][Math.floor(Math.random() * 3)];
    const left = Math.random() * 100;
    const drift = (Math.random() * 60 - 30) + 'px';
    const dur = 8 + Math.random() * 6;
    b.style.left = left + '%';
    b.style.setProperty('--drift', drift);
    b.style.animation = `riseBalloon ${dur}s ease-in forwards`;
    overlay.appendChild(b);
    setTimeout(() => b.remove(), dur * 1000 + 400);
  };
  const timer = setInterval(spawn, 500);
  for (let i = 0; i < 8; i++) setTimeout(spawn, i * 120);
  const stopper = () => { active = false; clearInterval(timer); };
  try { window.bdStopBalloons = stopper; } catch {}
  return stopper;
}

function startConfetti(count = 100) {
  const overlay = document.getElementById('birthday-overlay');
  if (!overlay) return;
  const css = document.createElement('style');
  css.textContent = `
    .bd-confetti { position: absolute; top: -12px; width: 10px; height: 14px; opacity: .95; will-change: transform; z-index: 3; }
    .bd-confetti.c1 { background: #ff5f96; }
    .bd-confetti.c2 { background: #c084fc; }
    .bd-confetti.c3 { background: #ffd166; }
    .bd-confetti.c4 { background: #06d6a0; }
    .bd-confetti.c5 { background: #118ab2; }
    @keyframes fallConfetti { to { transform: translateY(110vh) rotate(720deg); opacity: 1; } }
  `;
  document.head.appendChild(css);
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'bd-confetti c' + (1 + (i % 5));
    p.style.left = Math.random() * 100 + '%';
    p.style.transform = `translateY(-12px) rotate(${Math.random() * 360}deg)`;
    const delay = Math.random() * 200;
    const dur = 5 + Math.random() * 3.5;
    p.style.animation = `fallConfetti ${dur}s linear ${delay}ms forwards`;
    overlay.appendChild(p);
    pieces.push({ el: p, t: dur * 1000 + delay });
  }
  setTimeout(() => pieces.forEach(x => x.el.remove()), 9000);
}

function startTwinkles(n = 60) {
  const overlay = document.getElementById('birthday-overlay');
  if (!overlay) return () => {};
  const css = document.createElement('style');
  css.textContent = `
    .bd-twinkle { position: absolute; width: 3px; height: 3px; background: rgba(255,255,255,.85); border-radius: 50%; z-index:1; opacity:.6; filter: blur(.2px); }
    @keyframes twinkle { 0%,100% { transform: scale(1); opacity: .3; } 50% { transform: scale(1.8); opacity: .9; } }
  `;
  document.head.appendChild(css);
  const dots = [];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'bd-twinkle';
    d.style.left = Math.random() * 100 + '%';
    d.style.top = Math.random() * 100 + '%';
    d.style.animation = `twinkle ${2 + Math.random() * 2.5}s ease-in-out ${Math.random() * 2}s infinite`;
    overlay.appendChild(d);
    dots.push(d);
  }
  const stopper = () => dots.forEach(d => d.remove());
  try { window.bdStopTwinkles = stopper; } catch {}
  return stopper;
}


// === Finale sequence: multi-stage program (message -> letter -> stats -> secret) ===
function startFinalSequence(finishingAge) {
  const overlay = document.getElementById('birthday-overlay');
  const msgEl = overlay ? overlay.querySelector('.bd-msg') : null;
  if (!overlay || !msgEl) return;

  const getMeta = (name) => {
    const m = document.querySelector(`meta[name="${name}"]`);
    return (m && m.content) ? m.content.trim() : "";
  };
  const LOVE_NAME = getMeta('mylove-name') || 'Mein Schatz';

  // 1) Big personal message right after countdown
  msgEl.innerHTML = `
    🎂 عيد ميلاد سعيد، ${LOVE_NAME}!
    <span class="bd-age">صرتي ${finishingAge} سنة يا لموش 💖</span>
  `;
  msgEl.style.opacity = "1";

  // Persist & start effects
  try { window.bdKeepRunning = true; } catch {}
  try { startFireworks(); } catch {}
  try { startConfettiStream(); } catch {}
  try { ensureCloseButton(); } catch {}
  try { playBirthdayAudioPreferred(); } catch {}
  try { ensureAudioButton(); } catch {}
  try { startHeartTrail(); } catch {}

  // Mark sequence as active (damit Fallback-Texte nicht doppelt laufen)
  try { window.bdSeqActive = true; } catch {}

  // Build sequence texts dynamic
  try {
    const nowForSeq = new Date();
    const startDateForSeq = new Date(2016, 3, 16); // 16. April 2016
    const diffMsForSeq = nowForSeq - startDateForSeq;
    const totalDaysForSeq = Math.floor(diffMsForSeq / (1000 * 60 * 60 * 24));

    const seq = [
      `🎂 عيد ميلاد سعيد، ${LOVE_NAME}!\nصرتي ${finishingAge} سنة يا لموش 💖`,
      'لموش…',
      'من أول مرة هضرت معاك و قلبي حسّ بحاجة مختلفة.',
      'من 2016 و أنا نقول: ربي عطاني نعمة في شكل إنسانة.',
      'كل عام و انتي أحلى حاجة في حياتي.',
      'ما نحبش المستقبل بلا وجودك فيه 💜',
      'الكون كامل يدوّر، و في الوسط انتي يا لموش 💜',
      'LAMÖSCH – لموش',
      `مع بعضنا منذ ${totalDaysForSeq.toLocaleString('ar')} يوم`,
      'و قلبي كل يوم يحبك أكتر من اليوم اللي قبله. 💗',
      'إذا وصلتي لهنا... اضغطي على 💜 في الزاوية 3 مرات 😉'
    ];

    ensureSecretHeart();
    runTypedSequence(seq, { speed: 55, pauseMs: 3000, fadeMs: 700 });
  } catch {}

  // 2.5) After 40s — start mini photo slideshow (if photos provided)
  setTimeout(() => {
    try {
      const urls = getPhotoUrlsFromMeta();
      if (urls && urls.length) ensurePhotoSlideshow(urls);
    } catch {}
  }, 40000);
}

// Typewriter effect for arrays of lines (Fallback, wenn man es separat nutzen will)
function typeMessageLines(lines, index) {
  const overlay = document.getElementById('birthday-overlay');
  const msgEl = overlay ? overlay.querySelector('.bd-msg') : null;
  if (!msgEl || !lines || index >= lines.length) return;
  msgEl.innerHTML = '';
  let i = 0;
  const currentLine = lines[index];
  const lineEl = document.createElement('div');
  lineEl.style.whiteSpace = 'pre-wrap';
  msgEl.appendChild(lineEl);

  const interval = setInterval(() => {
    lineEl.textContent = currentLine.slice(0, i);
    i++;
    if (i > currentLine.length) {
      clearInterval(interval);
      setTimeout(() => {
        const br = document.createElement('br');
        msgEl.appendChild(br);
        typeMessageLines(lines, index + 1);
      }, 1500);
    }
  }, 60);
}

// Tiny secret heart in corner with triple-click reveal
// Tiny secret heart in corner with triple-click reveal
function ensureSecretHeart() {
  const overlay = document.getElementById('birthday-overlay');
  if (!overlay) return;
  // Always ensure an overlay-local heart button (overlay sits above everything)
  let css = document.getElementById('bd-secret-style');
  if (!css) {
    css = document.createElement('style');
    css.id = 'bd-secret-style';
    css.textContent = `#bd-secret-heart{position:absolute;top:14px;left:14px;z-index:3;background:rgba(15,23,42,0.6);color:#fff;border:1px solid rgba(255,255,255,.2);padding:10px 14px;border-radius:12px;cursor:pointer;font-weight:800;backdrop-filter:blur(6px);box-shadow:0 6px 16px rgba(0,0,0,.25);touch-action:manipulation;-webkit-tap-highlight-color:transparent}`;
    document.head.appendChild(css);
  }
  let btn = document.getElementById('bd-secret-heart');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'bd-secret-heart';
    btn.type = 'button';
    btn.title = 'اضغطي 3 مرات';
    btn.textContent = '💜';
    overlay.appendChild(btn);
  }
  if (!btn._bdSecretHooked) {
    let clicks = 0;
    let t = null;
    btn.addEventListener('click', () => {
      clicks += 1;
      if (t) clearTimeout(t);
      t = setTimeout(() => { clicks = 0; }, 1200);
      if (clicks >= 3) {
        clicks = 0;
        const msgEl = overlay.querySelector('.bd-msg');
        if (msgEl) {
          const secret = document.createElement('div');
          secret.style.marginTop = '12px';
          secret.style.fontSize = '1rem';
          secret.textContent = 'هذا السر الصغير بيني و بينك يا لموش. 🥰';
          msgEl.appendChild(secret);
        }
      }
    });
    btn._bdSecretHooked = true;
  }
}


// Parse photo URLs from meta content: <meta name="mylove-photos" content="/img/a.jpg, /img/b.jpg">
function getPhotoUrlsFromMeta() {
  const m = document.querySelector('meta[name="mylove-photos"]');
  if (!m || !m.content) return [];
  return m.content.split(',').map(s => s.trim()).filter(Boolean);
}

// Simple rotating photo card in overlay, cycles every ~18s
function ensurePhotoSlideshow(urls, intervalMs = 18000) {
  const overlay = document.getElementById('birthday-overlay');
  if (!overlay) return;
  let list = (urls || []).slice();
  if (!list.length) {
    try {
      const nodes = Array.from(document.querySelectorAll('.bg-photo'));
      const pick = nodes.map(n => {
        const bg = n.style.backgroundImage || '';
        const m = bg.match(/url\((?:"|')?([^\)"']+)(?:"|')?\)/);
        return m ? m[1] : '';
      }).filter(Boolean);
      list = pick.slice(0, 4); // at most 4
    } catch {}
  }
  if (!list.length) return;
  if (window.bdPhotosTimer) return; // already running

  let css = document.getElementById('bd-photos-style');
  if (!css) {
    css = document.createElement('style');
    css.id = 'bd-photos-style';
    css.textContent = `
      #bd-photos{position:absolute;right:18px;bottom:72px;z-index:3;width:220px;height:280px;background:rgba(15,23,42,0.55);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(10px);border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);opacity:.0;transform:translateY(6px);transition:opacity .5s ease, transform .5s ease}
      #bd-photos.show{opacity:1;transform:translateY(0)}
      #bd-photos figure{margin:0;position:relative;width:100%;height:100%}
      #bd-photos img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s ease}
      #bd-photos img.show{opacity:1}
      #bd-photos figcaption{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(0,0,0,0) 0, rgba(0,0,0,.55) 60%, rgba(0,0,0,.75) 100%);color:#fff;padding:10px 12px;font-size:.95rem}
    `;
    document.head.appendChild(css);
  }

  let card = document.getElementById('bd-photos');
  if (!card) {
    card = document.createElement('div');
    card.id = 'bd-photos';
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    const cap = document.createElement('figcaption');
    fig.appendChild(img);
    fig.appendChild(cap);
    card.appendChild(fig);
    overlay.appendChild(card);
    requestAnimationFrame(() => card.classList.add('show'));
  }

  const captions = [
    'تتذكري هاد اليوم؟',
    'هنا كنتِ أجمل من العادة… و العادة أصلاً خرافية.',
    'ضحكتك هنا قلبت الدنيا عندي 💜',
    'من ألمانيا للجزائر… حبّي ليك أكبر من المسافة.'
  ];

  let idx = 0;
  const fig = card.querySelector('figure');
  const img = fig.querySelector('img');
  const cap = fig.querySelector('figcaption');

  const showIdx = (i) => {
    const url = list[i % list.length];
    const caption = captions[i % captions.length];
    const tmp = new Image();
    tmp.onload = () => {
      img.classList.remove('show');
      setTimeout(() => {
        img.src = url;
        cap.textContent = caption;
        requestAnimationFrame(() => img.classList.add('show'));
      }, 120);
    };
    tmp.onerror = () => { /* skip broken image */ };
    tmp.src = url;
  };

  const safeShow = () => {
    try { showIdx(idx++); } catch {}
  };
  safeShow();
  const timer = setInterval(safeShow, intervalMs);
  try { window.bdPhotosTimer = timer; } catch {}
}

// Typed sequence runner: types text, waits, fades, then next
function runTypedSequence(texts, opts = {}) {
  const overlay = document.getElementById("birthday-overlay");
  const msgEl = overlay ? overlay.querySelector(".bd-msg") : null;
  if (!msgEl || !texts || !texts.length) return;
  const speed = opts.speed || 55;
  const pauseMs = opts.pauseMs || 3000;
  const fadeMs = opts.fadeMs || 700;
  msgEl.style.whiteSpace = "pre-wrap";
  msgEl.style.transition = `opacity ${fadeMs}ms ease`;
  let idx = 0;

  const typeOne = (text, cb) => {
    msgEl.innerHTML = "";
    msgEl.style.opacity = "1";
    let i = 0;
    const step = () => {
      msgEl.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) {
        setTimeout(step, Math.max(10, speed));
      } else {
        cb && cb();
      }
    };
    step();
  };

  const fadeOut = (cb) => {
    msgEl.style.opacity = "0";
    setTimeout(() => { cb && cb(); }, fadeMs + 50);
  };

  const next = () => {
    if (idx >= texts.length) return;
    const t = texts[idx];
    typeOne(t, () => {
      setTimeout(() => {
        fadeOut(() => {
          idx++;
          next();
        });
      }, pauseMs);
    });
  };

  try { msgEl.innerHTML = ""; } catch {}
  next();
}


