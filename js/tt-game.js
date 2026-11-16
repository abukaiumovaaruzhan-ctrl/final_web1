"use strict";

(function () {
  const game = document.getElementById("ttGame");
  if (!game) {
    console.warn("[tt-game] #ttGame not found");
    return;
  }

  const $ = (id) => document.getElementById(id);
  const required = ["ttBall","ballShadow","ttScore","ttBest","ttLives","ttOverlay"];
  const missing = required.filter((id) => !$(id));
  if (missing.length) {
    console.warn("[tt-game] missing elements:", missing);
    return;
  }

  const ball        = $("ttBall");
  const shadow      = $("ballShadow");
  const scoreEl     = $("ttScore");
  const bestEl      = $("ttBest");
  const livesEl     = $("ttLives");
  const overlay     = $("ttOverlay");
  const finalScore  = $("ttFinalScore");
  const newRecord   = $("ttNewRecord");
  const startBtn    = $("ttStartBtn");
  const playAgain   = $("ttPlayAgain");
  const court       = game.querySelector(".tt-court");

  const BEST_KEY  = "spinpoint-tt-best";
  const MAX_LIVES = 3;
  const BALL_SIZE = 26;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let score = 0;
  let lives = MAX_LIVES;
  let isRunning = false;
  let rafId = null;
  let flightStart = 0;
  let flightDuration = 1800;
  let fromLeft = true;
  let hasHitThisFlight = false;

  /* ---------- Audio ---------- */
  let audioCtx = null;
  function playPong(pitch) {
    if (reduceMotion) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch || 660, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (_) {}
  }

  /* ---------- Best ---------- */
  function readBest() {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; }
    catch (_) { return 0; }
  }
  function writeBest(v) {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch (_) {}
  }
  if (bestEl) bestEl.textContent = String(readBest());

  /* ---------- Geometry ---------- */
  function courtRect() {
    return court.getBoundingClientRect();
  }

  function ballPosition(t) {
    const r = courtRect();
    const w = r.width || 300;
    const h = r.height || 285;
    const startX = fromLeft ? w * 0.20 : w * 0.80;
    const endX   = fromLeft ? w * 0.80 : w * 0.20;
    const apexY  = h * 0.10;
    const baseY  = h * 0.32;
    const x = startX + (endX - startX) * t;
    const arc = Math.sin(t * Math.PI);
    const y = baseY - arc * (baseY - apexY);
    const scale = 1 - 0.22 * arc;
    return { x, y, scale };
  }

  function applyBallPos(p) {
    const half = (BALL_SIZE * p.scale) / 2;
    ball.style.left = (p.x - half) + "px";
    ball.style.top  = (p.y - half) + "px";
    ball.style.transform = "scale(" + p.scale + ")";
    shadow.style.setProperty("--ball-x", (p.x - 12) + "px");
    shadow.style.setProperty("--ball-y", (p.y + 55) + "px");
    shadow.style.opacity = String(0.15 + 0.35 * (1 - p.scale));
  }

  /* ---------- Loop ---------- */
  function tick(now) {
    if (!isRunning) return;
    if (!flightStart) flightStart = now;
    const t = Math.min(1, (now - flightStart) / flightDuration);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    applyBallPos(ballPosition(eased));
    if (t >= 1) { endFlight(); return; }
    rafId = requestAnimationFrame(tick);
  }

  function startFlight() {
    if (!isRunning) return;
    hasHitThisFlight = false;
    flightStart = 0;
    flightDuration = Math.max(900, 1800 - score * 60);
    ball.classList.remove("is-missed", "is-hit");
    ball.style.opacity = "1";
    ball.style.display = "block";
    if (reduceMotion) {
      const r = courtRect();
      applyBallPos({ x: (r.width || 300) / 2, y: (r.height || 285) * 0.3, scale: 1 });
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function endFlight() {
    cancelAnimationFrame(rafId);
    rafId = null;
    if (!hasHitThisFlight) { missBall(); }
    else {
      fromLeft = !fromLeft;
      setTimeout(startFlight, 120);
    }
  }

  /* ---------- Actions ---------- */
  function hitBall() {
    if (!isRunning || hasHitThisFlight) return;
    hasHitThisFlight = true;
    score += 1;
    scoreEl.textContent = String(score);
    if (scoreEl.animate) {
      scoreEl.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
        { duration: 220, easing: "ease-out" }
      );
    }
    ball.classList.remove("is-hit");
    void ball.offsetWidth;
    ball.classList.add("is-hit");
    spawnSparks();
    playPong(620 + Math.min(score, 20) * 25);
    const best = readBest();
    if (score > best) { writeBest(score); bestEl.textContent = String(score); }
  }

  function missBall() {
    lives -= 1;
    updateLivesUI();
    ball.classList.remove("is-hit");
    void ball.offsetWidth;
    ball.classList.add("is-missed");
    playPong(180);
    game.classList.remove("is-shaking");
    void game.offsetWidth;
    game.classList.add("is-shaking");
    setTimeout(function () { game.classList.remove("is-shaking"); }, 380);
    if (lives <= 0) setTimeout(gameOver, 400);
    else setTimeout(function () { fromLeft = !fromLeft; startFlight(); }, 500);
  }

  function updateLivesUI() {
    const dots = livesEl.querySelectorAll(".tt-life");
    dots.forEach(function (d, i) { d.classList.toggle("is-lost", i >= lives); });
  }

  function spawnSparks() {
    if (reduceMotion) return;
    const r = ball.getBoundingClientRect();
    const g = game.getBoundingClientRect();
    const cx = r.left - g.left + r.width / 2;
    const cy = r.top  - g.top  + r.height / 2;
    for (let i = 0; i < 6; i++) {
      const s = document.createElement("span");
      s.className = "hit-spark";
      s.style.left = cx + "px";
      s.style.top  = cy + "px";
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
      const dist = 25 + Math.random() * 25;
      s.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      s.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      game.appendChild(s);
      s.addEventListener("animationend", function () { s.remove(); }, { once: true });
    }
  }

  /* ---------- Game flow ---------- */
  function showStartOverlay() {
    if (!overlay) return;
    overlay.innerHTML =
      '<h4 id="ttOverlayTitle">Ready to rally?</h4>' +
      '<p>Tap the ball to score.<br>3 misses = game over.</p>' +
      '<button type="button" class="tt-play-again" id="ttStartBtn">Старт</button>';
    overlay.classList.add("is-visible");
    const btn = document.getElementById("ttStartBtn");
    if (btn) btn.addEventListener("click", startGame);
  }

  function startGame() {
    cancelAnimationFrame(rafId);
    score = 0;
    lives = MAX_LIVES;
    isRunning = true;
    hasHitThisFlight = false;
    fromLeft = true;
    scoreEl.textContent = "0";
    bestEl.textContent = String(readBest());
    updateLivesUI();
    if (overlay) overlay.classList.remove("is-visible");
    startFlight();
  }

  function gameOver() {
    isRunning = false;
    cancelAnimationFrame(rafId);

    const best = readBest();
    const isRecord = score > best;
    if (isRecord) { writeBest(score); bestEl.textContent = String(score); }

    if (overlay) {
      overlay.innerHTML =
        '<h4 id="ttOverlayTitle">Game over</h4>' +
        '<p>Your score</p>' +
        '<div class="tt-final-score">' + score + '</div>' +
        (isRecord ? '<p class="tt-new-record">★ NEW RECORD ★</p>' : '') +
        '<button type="button" class="tt-play-again" id="ttPlayAgain">Играть снова</button>';
      overlay.classList.add("is-visible");
      const btn = document.getElementById("ttPlayAgain");
      if (btn) { btn.addEventListener("click", startGame); btn.focus(); }
    }
  }

  /* ---------- Events ---------- */
  function onBallActivate(e) {
    e.preventDefault();
    if (!isRunning) return;
    hitBall();
  }

  ball.addEventListener("pointerdown", onBallActivate);
  ball.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") onBallActivate(e);
  });

  if (startBtn) startBtn.addEventListener("click", startGame);

  let resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!isRunning || reduceMotion) return;
      flightStart = 0;
    }, 200);
  });

  updateLivesUI();

})();