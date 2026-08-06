(function () {
  const ROOT = document.getElementById("binmat-root");
  if (!ROOT) return;

  const EMBED = /\bembed=1\b/.test(location.search);
  const STORAGE_KEY = "bm_epic_v1";
  const SAVE_KEY = "bm_link_v1";
  const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (EMBED) document.documentElement.classList.add("bm-embed");

  let N = 6;
  let HALF = 3;
  const MUSIC_SRC = "https://archive.org/download/los-angeles_202505/Rob%20Dougan%20-%20Clubbed%20to%20Death%20%5BRadio%20Edit%5D.mp3";

  // [size, targetClues, strikes, digPasses, lore label]
  const CAMPAIGN = {
    easy: [
      [4, 10, 5, 1, "SUBLVL 01 — RECRUIT GRID"],
      [4, 7, 5, 1, "SUBLVL 02 — THIN SIGNAL"],
      [6, 18, 5, 1, "NODE 03 — OPEN FIELD"],
      [6, 15, 5, 1, "NODE 04 — STANDARD LINK"],
      [6, 12, 4, 2, "NODE 05 — EXIT GATE"]
    ],
    medium: [
      [4, 6, 3, 1, "SUBLVL 01 — SPAR"],
      [6, 14, 3, 2, "NODE 02 — ENTRY TUNNEL"],
      [6, 12, 3, 2, "NODE 03 — DENSE PACK"],
      [6, 10, 3, 2, "NODE 04 — SPARSE CORE"],
      [6, 9, 2, 3, "NODE 05 — TIGHT WEAVE"],
      [6, 8, 2, 3, "NODE 06 — FIREWALL"]
    ],
    hard: [
      [6, 10, 2, 3, "NODE 01 — RAZOR ENTRY"],
      [4, 5, 2, 2, "SUBLVL 02 — PRESSURE"],
      [6, 8, 2, 4, "NODE 03 — DEEP DIG"],
      [6, 7, 2, 4, "NODE 04 — ZERO MARGIN"],
      [4, 4, 1, 2, "SUBLVL 05 — ONE STRIKE"],
      [6, 7, 2, 4, "NODE 06 — NEAR BLANK"],
      [6, 8, 1, 4, "NEXCORP CORE — FINAL GATE"]
    ]
  };

  const KERNEL_NAMES = [
    "GATE α — XOR LEAK", "GATE β — DUAL KEY", "GATE γ — TRIPWIRE", "GATE δ — QUAD LOCK",
    "GATE ε — SYNDROME", "GATE ζ — DEEP HASH", "GATE η — TRIPLE XOR", "OMEGA — ROOT KEY"
  ];

  const LORE_QUOTES = [
    "The matrix doesn't lie. Operators do.",
    "NexCorp sees every bit you place.",
    "Zero or one. There is no maybe in the link.",
    "They built the firewall. We taught it to bleed.",
    "Every unique row is a fingerprint.",
    "The root matrix remembers who cracked it first.",
    "Silence on the wire means someone is listening.",
    "One strike left. Choose like your clearance depends on it."
  ];

  const OMEGA_SPEC = [8, 14, 1, 5, "OMEGA ROOT MATRIX"];

  const els = {
    rain: ROOT.querySelector("#bm-rain"),
    rainBack: ROOT.querySelector("#bm-rain-back"),
    menu: ROOT.querySelector("#bm-menu"),
    play: ROOT.querySelector("#bm-play"),
    grid: ROOT.querySelector("#bm-grid"),
    status: ROOT.querySelector("#bm-status"),
    score: ROOT.querySelector("#bm-score"),
    time: ROOT.querySelector("#bm-time"),
    mistakes: ROOT.querySelector("#bm-mistakes"),
    diffLabel: ROOT.querySelector("#bm-diff-label"),
    solveBtn: ROOT.querySelector("#bm-solve"),
    checkBtn: ROOT.querySelector("#bm-check"),
    pauseOv: ROOT.querySelector("#bm-pause"),
    helpOv: ROOT.querySelector("#bm-help"),
    geniusHelp: ROOT.querySelector("#bm-genius-help"),
    vol: ROOT.querySelector("#bm-vol"),
    sfx: ROOT.querySelector("#bm-sfx"),
    mute: ROOT.querySelector("#bm-mute"),
    genius: ROOT.querySelector("#bm-genius"),
    vmLog: ROOT.querySelector("#bm-vm-log"),
    vmStatus: ROOT.querySelector("#bm-vm-status"),
    vmBrief: ROOT.querySelector("#bm-vm-brief"),
    probe: ROOT.querySelector("#bm-probe"),
    answer: ROOT.querySelector("#bm-answer"),
    boot: ROOT.querySelector("#bm-boot"),
    bootLog: ROOT.querySelector("#bm-boot-log"),
    bootSkip: ROOT.querySelector("#bm-boot-skip"),
    sector: ROOT.querySelector("#bm-sector"),
    sectorKicker: ROOT.querySelector("#bm-sector-kicker"),
    sectorTitle: ROOT.querySelector("#bm-sector-title"),
    sectorCode: ROOT.querySelector("#bm-sector-code"),
    sectorNext: ROOT.querySelector("#bm-sector-next"),
    sectorLore: ROOT.querySelector("#bm-sector-lore"),
    rank: ROOT.querySelector("#bm-rank"),
    omegaBtn: ROOT.querySelector("#bm-omega"),
    victory: ROOT.querySelector("#bm-victory"),
    victoryTitle: ROOT.querySelector("#bm-victory-title"),
    victorySub: ROOT.querySelector("#bm-victory-sub"),
    keychain: ROOT.querySelector("#bm-keychain"),
    victoryScore: ROOT.querySelector("#bm-victory-score"),
    victoryTime: ROOT.querySelector("#bm-victory-time"),
    victoryBest: ROOT.querySelector("#bm-victory-best"),
    copyScore: ROOT.querySelector("#bm-copy-score"),
    shareX: ROOT.querySelector("#bm-share-x"),
    victoryMenu: ROOT.querySelector("#bm-victory-menu"),
    continueBtn: ROOT.querySelector("#bm-continue"),
    dailyBtn: ROOT.querySelector("#bm-daily"),
    dailyHint: ROOT.querySelector("#bm-daily-hint"),
    progressWrap: ROOT.querySelector("#bm-progress-wrap"),
    progressLabel: ROOT.querySelector("#bm-progress-label"),
    progressFill: ROOT.querySelector("#bm-progress-fill"),
    gridWrap: ROOT.querySelector("#bm-grid-wrap"),
    best: ROOT.querySelector("#bm-best"),
    vmProgressLabel: ROOT.querySelector("#bm-vm-progress-label"),
    vmProgressFill: ROOT.querySelector("#bm-vm-progress-fill"),
    regA: ROOT.querySelector("#bm-reg-a"),
    regB: ROOT.querySelector("#bm-reg-b"),
    regZ: ROOT.querySelector("#bm-reg-z"),
    regProbes: ROOT.querySelector("#bm-reg-probes")
  };

  let difficulty = "medium";
  let solution = null;
  let puzzle = null; // -1 empty, 0/1 values; givens tracked separately
  let given = null; // boolean[][]
  let grid = null;
  let playing = false;
  let paused = false;
  let won = false;
  let score = 0;
  let mistakes = 0;
  let maxMistakes = 99;
  let startedAt = 0;
  let elapsedMs = 0;
  let timerId = null;
  let musicVol = 0.36;
  let sfxVol = 0.36;
  let muted = false;
  let audioCtx = null;
  let bgMusic = null;
  let geniusMode = false;
  let vmLevel = 0;
  let vmProbes = 0;
  let vmSecrets = [];
  let vmChallenges = [];
  let vmCode = null;
  let vmExpectLen = 1;
  let vmShowRegs = true;
  let gridLevel = 0;
  let sectorGain = 0;
  let sectorClock = 0;
  let advanceTimer = null;
  let sectorCodes = [];
  let lastFlipCell = null;
  let bootDone = false;
  let records = loadRecords();
  let dailyMode = false;
  let omegaMode = false;
  let focusR = 0;
  let focusC = 0;
  let humOsc = null;
  let humGain = null;
  let lastVictoryDaily = false;
  let lastVictoryOmega = false;
  const menuRules = ROOT.querySelector(".bm-rules");
  const RULES_GRID = menuRules ? menuRules.innerHTML : "";
  const RULES_GENIUS = "GENIUS replaces the grid.<br>Reverse a black-box <b>NX-8</b> CPU gate: probe inputs, read outputs, submit the key.<br>8 escalating kernels · 2 strikes · no Solve · ISA shown, program hidden.";

  // --- Matrix rain (dual layer) ---
  const ctx = els.rain.getContext("2d");
  const ctxBack = els.rainBack ? els.rainBack.getContext("2d") : null;
  let fontSize = 14;
  let drops = [];
  let speeds = [];
  let rainCols = 0;
  let dropsBack = [];
  let rainHue = "#22c55e";
  let rainBright = "#39ff14";

  function applyMood() {
    ROOT.classList.remove("bm-mood-hard", "bm-mood-genius", "bm-mood-omega");
    if (omegaMode) {
      ROOT.classList.add("bm-mood-omega");
      rainHue = "#eab308";
      rainBright = "#fde047";
    } else if (difficulty === "hard") {
      ROOT.classList.add("bm-mood-hard");
      rainHue = "#ca8a04";
      rainBright = "#fbbf24";
    } else if (difficulty === "genius") {
      ROOT.classList.add("bm-mood-genius");
      rainHue = "#a16207";
      rainBright = "#fde68a";
    } else {
      rainHue = "#22c55e";
      rainBright = "#39ff14";
    }
  }

  function triggerGlitch() {
    ROOT.classList.remove("bm-glitch");
    void ROOT.offsetWidth;
    ROOT.classList.add("bm-glitch");
  }

  function sizeRain() {
    const r = ROOT.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    [els.rain, els.rainBack].forEach(function (cv) {
      if (!cv) return;
      cv.width = Math.max(1, Math.floor(r.width * dpr));
      cv.height = Math.max(1, Math.floor(r.height * dpr));
    });
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ctxBack) ctxBack.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontSize = r.width < 500 ? 12 : 14;
    rainCols = Math.ceil(r.width / fontSize);
    while (drops.length < rainCols) {
      drops.push(Math.random() * 40);
      speeds.push(0.45 + Math.random() * 0.7);
      dropsBack.push(Math.random() * 60);
    }
    drops.length = rainCols;
    speeds.length = rainCols;
    dropsBack.length = rainCols;
  }

  function drawRainLayer(c, dropArr, spdMul, alpha, bright) {
    if (!c) return;
    const w = ROOT.clientWidth;
    const h = ROOT.clientHeight;
    c.fillStyle = "rgba(0,0,0," + alpha + ")";
    c.fillRect(0, 0, w, h);
    c.font = fontSize + "px monospace";
    for (let i = 0; i < rainCols; i++) {
      const ch = Math.random() < 0.5 ? "0" : "1";
      c.fillStyle = Math.random() < 0.08 ? bright : rainHue;
      c.fillText(ch, i * fontSize, dropArr[i] * fontSize);
      if (dropArr[i] * fontSize > h && Math.random() > 0.975) dropArr[i] = 0;
      dropArr[i] += speeds[i] * spdMul * (won ? 1.4 : 1);
    }
  }

  function drawRain() {
    if (REDUCED_MOTION) return;
    drawRainLayer(ctxBack, dropsBack, 0.55, 0.04, rainBright);
    drawRainLayer(ctx, drops, 1, won ? 0.08 : 0.07, rainBright);
  }
  if (!REDUCED_MOTION) setInterval(drawRain, 50);
  window.addEventListener("resize", sizeRain);
  if (window.ResizeObserver) {
    new ResizeObserver(function () { sizeRain(); if (EMBED) notifyResize(); }).observe(ROOT);
  } else if (EMBED) {
    window.addEventListener("resize", notifyResize);
  }

  // --- Embed + persistence ---
  function notifyParent(inGame) {
    if (!EMBED || !window.parent) return;
    try { window.parent.postMessage({ type: "bm-chrome", inGame: !!inGame }, "*"); } catch (e) {}
    notifyResize();
  }

  function notifyResize() {
    if (!EMBED || !window.parent) return;
    requestAnimationFrame(function () {
      try {
        var h = Math.max(
          ROOT.offsetHeight || 0,
          ROOT.scrollHeight || 0,
          document.documentElement.scrollHeight || 0
        );
        window.parent.postMessage({ type: "bm-resize", height: h }, "*");
      } catch (e) {}
    });
  }

  function loadRecords() {
    try {
      const r = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (!r.clears) r.clears = {};
      return r;
    } catch (e) { return { clears: {} }; }
  }

  function ensureClears() {
    if (!records.clears) records.clears = {};
  }

  function markCampaignClear(key) {
    ensureClears();
    records.clears[key] = true;
    saveRecords();
    updateRankDisplay();
    updateOmegaBtn();
  }

  function computeRank() {
    ensureClears();
    const c = records.clears;
    if (c.omega || c.genius) return "OMEGA";
    if (c.hard) return "GHOST";
    if (c.medium || c.easy) return "OPERATOR";
    return "RECRUIT";
  }

  function updateRankDisplay() {
    if (els.rank) els.rank.textContent = "RANK · " + computeRank();
  }

  function updateOmegaBtn() {
    if (!els.omegaBtn) return;
    ensureClears();
    if (records.clears.hard || records.clears.omega) {
      els.omegaBtn.classList.remove("bm-hidden");
    } else {
      els.omegaBtn.classList.add("bm-hidden");
    }
  }

  function saveRecords() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (e) {}
  }

  function bestKey() {
    if (dailyMode) return "daily";
    if (omegaMode) return "omega";
    return geniusMode ? "genius" : difficulty;
  }

  function dateSeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function dailyDateLabel() {
    return new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function withSeed(seed, fn) {
    const rng = mulberry32(seed);
    const orig = Math.random;
    Math.random = rng;
    try { return fn(); } finally { Math.random = orig; }
  }

  function updateDailyHint() {
    if (!els.dailyHint) return;
    const best = records.daily;
    els.dailyHint.innerHTML = "Daily node · " + dailyDateLabel() + (best ? " · best <b>" + best + "</b>" : "");
  }

  function updateContinueBtn() {
    if (!els.continueBtn) return;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      els.continueBtn.classList.add("bm-hidden");
      return;
    }
    try {
      const s = JSON.parse(raw);
      els.continueBtn.classList.remove("bm-hidden");
      els.continueBtn.textContent = "CONTINUE " + s.difficulty.toUpperCase() + " " + (s.gridLevel + 1) + "/" + (CAMPAIGN[s.difficulty] ? CAMPAIGN[s.difficulty].length : "?");
    } catch (e) {
      els.continueBtn.classList.add("bm-hidden");
    }
  }

  function saveLink() {
    if (dailyMode || omegaMode || arcadeMode || geniusMode || !playing || won) return;
    if (difficulty === "genius") return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        difficulty: difficulty,
        gridLevel: gridLevel,
        score: score,
        elapsedMs: elapsedMs,
        mistakes: mistakes,
        maxMistakes: maxMistakes,
        grid: grid,
        puzzle: puzzle,
        given: given,
        solution: solution,
        N: N,
        sectorCodes: sectorCodes.slice()
      }));
      updateContinueBtn();
    } catch (e) {}
  }

  function clearLink() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    updateContinueBtn();
  }

  function shareText() {
    const diff = lastVictoryDaily ? "DAILY" : (lastVictoryOmega ? "OMEGA" : (geniusMode ? "GENIUS" : difficulty.toUpperCase()));
    const site = "https://www.8bitcrypto44.xyz";
    return "THE BINARY MATRIX · " + diff + " · score " + score + " · time " + fmtTime(elapsedMs) + " · " + site + " · 8bitcrypto_44";
  }

  function shareOnX() {
    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareText());
    window.open(url, "_blank", "noopener,noreferrer,width=550,height=420");
    beep(720, 0.06, "triangle", 0.06);
  }

  function restoreLink() {
    let s;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return; }
    if (!s || !s.grid) return;
    ensureAudio();
    hideVictory();
    dailyMode = false;
    omegaMode = false;
    geniusMode = false;
    difficulty = s.difficulty;
    gridLevel = s.gridLevel;
    score = s.score;
    elapsedMs = s.elapsedMs;
    mistakes = s.mistakes;
    maxMistakes = s.maxMistakes;
    grid = s.grid;
    puzzle = s.puzzle;
    given = s.given;
    solution = s.solution;
    N = s.N;
    HALF = N / 2;
    sectorCodes = s.sectorCodes || [];
    playing = true;
    paused = false;
    won = false;
    focusR = 0;
    focusC = 0;
    applyMood();
    ROOT.querySelectorAll(".bm-diff").forEach(function (b) {
      b.classList.toggle("selected", b.dataset.diff === difficulty);
    });
    if (menuRules) menuRules.innerHTML = RULES_GRID;
    els.menu.classList.add("bm-hidden");
    els.genius.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    setGridSize(N);
    els.solveBtn.classList.toggle("bm-hidden", difficulty !== "easy");
    startedAt = Date.now() - elapsedMs;
    setStatus("Link restored · " + sectorSpec()[4]);
    renderGrid(false);
    updateHUD();
    startTimer();
    playMusic();
    notifyParent(true);
    beep(600, 0.08, "triangle", 0.06);
  }

  function updateBestDisplay() {
    if (!els.best) return;
    const b = records[bestKey()];
    els.best.textContent = b ? "BEST " + String(b).padStart(6, "0") : "BEST —";
  }

  function maybeSaveBest(sc) {
    const k = bestKey();
    if (!records[k] || sc > records[k]) {
      records[k] = sc;
      saveRecords();
    }
    updateBestDisplay();
  }

  function updateProgressBar() {
    if (dailyMode || omegaMode) {
      if (els.progressWrap) els.progressWrap.hidden = false;
      if (els.progressLabel) {
        els.progressLabel.textContent = dailyMode
          ? ("DAILY · " + dailyDateLabel())
          : "OMEGA ROOT · 8×8";
      }
      if (els.progressFill) els.progressFill.style.width = won ? "100%" : (omegaMode ? "50%" : "66%");
      return;
    }
    if (!els.progressWrap || geniusMode) {
      if (els.progressWrap) els.progressWrap.hidden = true;
      return;
    }
    els.progressWrap.hidden = false;
    const len = campaignLen();
    const pct = len ? ((gridLevel + 1) / len) * 100 : 0;
    if (els.progressLabel) els.progressLabel.textContent = "SECTOR " + (gridLevel + 1) + "/" + len;
    if (els.progressFill) els.progressFill.style.width = Math.min(100, pct) + "%";
  }

  function updateVmProgress() {
    if (!geniusMode) return;
    const n = vmN();
    if (els.vmProgressLabel) els.vmProgressLabel.textContent = (KERNEL_NAMES[vmLevel] || ("GATE " + (vmLevel + 1))) + " · " + (vmLevel + 1) + "/" + n;
    if (els.vmProgressFill) els.vmProgressFill.style.width = ((vmLevel + 0.35) / n) * 100 + "%";
  }

  function updateVmRegs(res) {
    if (els.regProbes) els.regProbes.textContent = String(vmProbes);
    if (!res || !vmShowRegs) {
      if (els.regA) els.regA.textContent = "--";
      if (els.regB) els.regB.textContent = "--";
      if (els.regZ) els.regZ.textContent = "--";
      return;
    }
    if (els.regA) els.regA.textContent = hexByte(res.A);
    if (els.regB) els.regB.textContent = hexByte(res.B);
    if (els.regZ) els.regZ.textContent = String(res.Z);
  }

  // --- Boot sequence ---
  const BOOT_LINES = [
    { t: "NEXCORP UPLINK v3.7.2", c: "hi" },
    { t: "Handshake................ OK", c: "" },
    { t: "Matrix rain shader....... OK", c: "" },
    { t: "Takuzu engine............ OK", c: "" },
    { t: "NX-8 sandbox............. STANDBY", c: "" },
    { t: "", c: "" },
    { t: "Operator authenticated.", c: "hi" },
    { t: "> AWAITING JACK IN_", c: "hi" }
  ];

  function runBoot(cb) {
    if (!els.boot || !els.bootLog) {
      bootDone = true;
      if (els.menu) els.menu.classList.remove("bm-hidden");
      cb();
      return;
    }
    els.menu.classList.add("bm-hidden");
    els.boot.classList.add("show");
    els.bootLog.textContent = "";
    let i = 0;
    let skipped = false;
    function finish() {
      bootDone = true;
      els.boot.classList.remove("show");
      if (els.menu) els.menu.classList.remove("bm-hidden");
      cb();
    }
    function step() {
      if (skipped || i >= BOOT_LINES.length) {
        setTimeout(finish, 400);
        return;
      }
      const line = BOOT_LINES[i++];
      const span = document.createElement("span");
      if (line.c === "hi") span.className = "hi";
      if (line.c === "dim") span.className = "dim";
      span.textContent = line.t + (line.t ? "\n" : "");
      els.bootLog.appendChild(span);
      beep(880 + i * 20, 0.03, "square", 0.03);
      setTimeout(step, line.t ? 280 : 120);
    }
    if (els.bootSkip) {
      els.bootSkip.classList.remove("bm-hidden");
      els.bootSkip.onclick = function () { skipped = true; finish(); };
    }
    setTimeout(step, 350);
  }

  function showSectorCard(clearedLabel, code, nextLabel, cb, loreQuote) {
    if (!els.sector) { if (cb) cb(); return; }
    if (els.sectorKicker) els.sectorKicker.textContent = "SECTOR CLEARED";
    if (els.sectorTitle) els.sectorTitle.textContent = clearedLabel;
    if (els.sectorCode) els.sectorCode.textContent = "matrix code " + code;
    if (els.sectorLore) {
      if (loreQuote) {
        els.sectorLore.textContent = "\u201C" + loreQuote + "\u201D";
        els.sectorLore.classList.remove("bm-hidden");
      } else {
        els.sectorLore.textContent = "";
        els.sectorLore.classList.add("bm-hidden");
      }
    }
    if (els.sectorNext) els.sectorNext.textContent = nextLabel || "Next node loading…";
    if (els.gridWrap) {
      els.gridWrap.classList.add("bm-dissolve");
      setTimeout(function () { els.gridWrap.classList.remove("bm-dissolve"); }, 560);
    }
    els.sector.classList.add("show");
    beep(520, 0.08, "triangle", 0.07);
    beep(780, 0.1, "triangle", 0.08);
    setTimeout(function () {
      els.sector.classList.remove("show");
      if (cb) cb();
    }, 1200);
  }

  function showVictory(opts) {
    opts = opts || {};
    lastVictoryDaily = !!opts.daily;
    lastVictoryOmega = !!opts.omega;
    clearLink();
    if (els.victoryTitle) els.victoryTitle.textContent = opts.title || "LINK COMPLETE";
    if (els.victorySub) els.victorySub.textContent = opts.sub || "NexCorp firewall breached.";
    if (els.victoryScore) els.victoryScore.textContent = String(score);
    if (els.victoryTime) els.victoryTime.textContent = fmtTime(elapsedMs);
    if (els.victoryBest) els.victoryBest.textContent = records[bestKey()] ? String(records[bestKey()]) : "—";
    if (els.keychain) {
      els.keychain.innerHTML = "";
      (opts.codes || []).forEach(function (c, i) {
        const k = document.createElement("span");
        k.className = "bm-key";
        k.textContent = (opts.genius ? "K" : "S") + (i + 1) + " · " + c;
        els.keychain.appendChild(k);
      });
    }
    if (els.victory) els.victory.classList.add("show");
    notifyParent(false);
    playWinFanfare();
    if (bgMusic) bgMusic.volume = muted ? 0 : Math.min(musicVol, 0.22);
  }

  function hideVictory() {
    if (els.victory) els.victory.classList.remove("show");
  }

  // --- Audio ---
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, dur, type, vol) {
    if (muted || !sfxVol) return;
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "square";
    o.frequency.value = freq;
    g.gain.setValueAtTime((vol || 0.08) * sfxVol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  }

  function playWinFanfare() {
    [392, 523, 659, 784, 1046, 1318].forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.32, "triangle", 0.11); }, i * 180);
    });
  }

  function playStrikeStinger() {
    beep(120, 0.25, "sawtooth", 0.12);
    setTimeout(function () { beep(90, 0.35, "sawtooth", 0.1); }, 80);
    triggerGlitch();
  }

  function startHum() {
    if (REDUCED_MOTION || muted || !musicVol) return;
    ensureAudio();
    if (humOsc) return;
    humOsc = audioCtx.createOscillator();
    humGain = audioCtx.createGain();
    humOsc.type = "sine";
    humOsc.frequency.value = 58;
    humGain.gain.value = musicVol * 0.07;
    humOsc.connect(humGain);
    humGain.connect(audioCtx.destination);
    humOsc.start();
  }

  function stopHum() {
    if (!humOsc) return;
    try { humOsc.stop(); } catch (e) {}
    humOsc.disconnect();
    humGain.disconnect();
    humOsc = null;
    humGain = null;
  }

  function syncHum() {
    if (humGain) humGain.gain.value = muted || !musicVol ? 0 : musicVol * 0.07;
  }

  function setupMusic() {
    bgMusic = new Audio(MUSIC_SRC);
    bgMusic.loop = true;
    bgMusic.preload = "auto";
    bgMusic.volume = muted ? 0 : musicVol;
  }

  function playMusic() {
    if (!bgMusic) setupMusic();
    bgMusic.volume = muted ? 0 : musicVol;
    bgMusic.play().catch(function () {});
    startHum();
    syncHum();
  }

  function stopMusic() {
    if (!bgMusic) return;
    bgMusic.pause();
    bgMusic.currentTime = 0;
    stopHum();
  }

  function pauseMusic() {
    if (bgMusic) bgMusic.pause();
    syncHum();
  }

  // --- Takuzu / Binary puzzle engine ---
  function clone(g) {
    return g.map(function (r) { return r.slice(); });
  }

  function rowArr(g, r) { return g[r]; }
  function colArr(g, c) {
    const a = [];
    for (let r = 0; r < N; r++) a.push(g[r][c]);
    return a;
  }

  function noTriple(a) {
    for (let i = 0; i < N - 2; i++) {
      if (a[i] !== -1 && a[i] === a[i + 1] && a[i] === a[i + 2]) return false;
    }
    return true;
  }

  function balanceOk(a) {
    let z = 0, o = 0;
    for (let i = 0; i < N; i++) {
      if (a[i] === 0) z++;
      else if (a[i] === 1) o++;
    }
    return z <= HALF && o <= HALF;
  }

  function lineUnique(g, isRow, idx) {
    const line = isRow ? rowArr(g, idx) : colArr(g, idx);
    if (line.indexOf(-1) >= 0) return true;
    for (let i = 0; i < N; i++) {
      if (i === idx) continue;
      const other = isRow ? rowArr(g, i) : colArr(g, i);
      if (other.indexOf(-1) >= 0) continue;
      let same = true;
      for (let k = 0; k < N; k++) if (line[k] !== other[k]) { same = false; break; }
      if (same) return false;
    }
    return true;
  }

  function canPlace(g, r, c, v) {
    const prev = g[r][c];
    g[r][c] = v;
    const ok = noTriple(rowArr(g, r)) && balanceOk(rowArr(g, r)) && lineUnique(g, true, r)
      && noTriple(colArr(g, c)) && balanceOk(colArr(g, c)) && lineUnique(g, false, c);
    g[r][c] = prev;
    return ok;
  }

  function findEmpty(g) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] === -1) return [r, c];
    return null;
  }

  function countSolutions(g, limit) {
    const lim = limit || 2;
    let count = 0;
    function dfs() {
      if (count >= lim) return;
      const pos = findEmpty(g);
      if (!pos) { count++; return; }
      const r = pos[0], c = pos[1];
      const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
      for (let i = 0; i < 2; i++) {
        const v = order[i];
        if (!canPlace(g, r, c, v)) continue;
        g[r][c] = v;
        dfs();
        g[r][c] = -1;
        if (count >= lim) return;
      }
    }
    dfs();
    return count;
  }

  function generateFull() {
    const g = [];
    for (let r = 0; r < N; r++) {
      g[r] = [];
      for (let c = 0; c < N; c++) g[r][c] = -1;
    }
    function dfs() {
      const pos = findEmpty(g);
      if (!pos) return true;
      const r = pos[0], c = pos[1];
      const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
      for (let i = 0; i < 2; i++) {
        const v = order[i];
        if (!canPlace(g, r, c, v)) continue;
        g[r][c] = v;
        if (dfs()) return true;
        g[r][c] = -1;
      }
      return false;
    }
    if (!dfs()) return generateFull();
    return g;
  }

  function digPuzzle(full, targetClues, passes) {
    let best = clone(full);
    let bestCount = N * N;
    const tries = passes || 1;
    for (let pass = 0; pass < tries; pass++) {
      const g = clone(full);
      const cells = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cells.push([r, c]);
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = cells[i]; cells[i] = cells[j]; cells[j] = t;
      }
      let clues = N * N;
      for (let i = 0; i < cells.length && clues > targetClues; i++) {
        const r = cells[i][0], c = cells[i][1];
        const keep = g[r][c];
        g[r][c] = -1;
        const test = clone(g);
        if (countSolutions(test, 2) !== 1) g[r][c] = keep;
        else clues--;
      }
      if (clues < bestCount) {
        best = g;
        bestCount = clues;
      }
      if (bestCount <= targetClues) break;
    }
    return best;
  }

  function campaignLen() {
    if (dailyMode || omegaMode) return 1;
    const c = CAMPAIGN[difficulty];
    return c ? c.length : 1;
  }

  function sectorSpec() {
    if (omegaMode) return OMEGA_SPEC.slice();
    if (dailyMode) return [6, 12, 3, 2, "DAILY NODE — " + dailyDateLabel()];
    const c = CAMPAIGN[difficulty];
    return c ? c[Math.min(gridLevel, c.length - 1)] : [6, 11, 3, 2, "matrix"];
  }

  function setGridSize(n) {
    N = n;
    HALF = n / 2;
    if (els.grid) {
      els.grid.className = "bm-grid sz" + n;
      els.grid.setAttribute("aria-label", n + "×" + n + " Binary Matrix");
    }
  }

  function newPuzzleFromSpec(spec) {
    setGridSize(spec[0]);
    const full = generateFull();
    const dug = digPuzzle(full, spec[1], spec[3]);
    const giv = [];
    for (let r = 0; r < N; r++) {
      giv[r] = [];
      for (let c = 0; c < N; c++) giv[r][c] = dug[r][c] !== -1;
    }
    return { solution: full, puzzle: dug, given: giv };
  }

  // --- Rule highlights ---
  function violationMask(g) {
    const bad = [];
    for (let r = 0; r < N; r++) {
      bad[r] = [];
      for (let c = 0; c < N; c++) bad[r][c] = false;
    }
    function markLine(get, setBad) {
      const a = [];
      for (let i = 0; i < N; i++) a.push(get(i));
      for (let i = 0; i < N - 2; i++) {
        if (a[i] !== -1 && a[i] === a[i + 1] && a[i] === a[i + 2]) {
          setBad(i); setBad(i + 1); setBad(i + 2);
        }
      }
      let z = 0, o = 0, empty = 0;
      for (let i = 0; i < N; i++) {
        if (a[i] === 0) z++;
        else if (a[i] === 1) o++;
        else empty++;
      }
      if (z > HALF || o > HALF) {
        for (let i = 0; i < N; i++) if (a[i] !== -1) setBad(i);
      }
      if (!empty && (z !== HALF || o !== HALF)) {
        for (let i = 0; i < N; i++) setBad(i);
      }
    }
    for (let r = 0; r < N; r++) markLine(function (c) { return g[r][c]; }, function (c) { bad[r][c] = true; });
    for (let c = 0; c < N; c++) markLine(function (r) { return g[r][c]; }, function (r) { bad[r][c] = true; });
    // duplicate complete rows/cols
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let rowSame = true, colSame = true;
        for (let k = 0; k < N; k++) {
          if (g[i][k] === -1 || g[j][k] === -1 || g[i][k] !== g[j][k]) rowSame = false;
          if (g[k][i] === -1 || g[k][j] === -1 || g[k][i] !== g[k][j]) colSame = false;
        }
        if (rowSame) for (let k = 0; k < N; k++) { bad[i][k] = true; bad[j][k] = true; }
        if (colSame) for (let k = 0; k < N; k++) { bad[k][i] = true; bad[k][j] = true; }
      }
    }
    return bad;
  }

  function isCompleteValid(g) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] === -1) return false;
    const mask = violationMask(g);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (mask[r][c]) return false;
    return true;
  }

  // --- UI ---
  function fmtTime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function updateHUD() {
    if (els.score) els.score.textContent = String(score).padStart(6, "0");
    if (els.time) els.time.textContent = fmtTime(elapsedMs);
    if (els.mistakes) els.mistakes.textContent = mistakes + "/" + maxMistakes;
    if (els.diffLabel) {
      if (omegaMode) els.diffLabel.textContent = "OMEGA ROOT · 8×8";
      else if (geniusMode) els.diffLabel.textContent = "GENIUS " + (vmLevel + 1) + "/" + vmN();
      else els.diffLabel.textContent = difficulty.toUpperCase() + " " + (gridLevel + 1) + "/" + campaignLen();
    }
    updateProgressBar();
    updateVmProgress();
    if (els.regProbes) els.regProbes.textContent = String(vmProbes);
  }

  function setStatus(msg, cls) {
    els.status.textContent = msg || "";
    els.status.className = "bm-status" + (cls ? " " + cls : "");
  }

  function renderGrid(flashBad) {
    const mask = flashBad ? violationMask(grid) : null;
    els.grid.innerHTML = "";
    for (let r = 0; r < N; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < N; c++) {
        const td = document.createElement("td");
        const v = grid[r][c];
        const isG = given[r][c];
        if (v === -1) td.className = "empty";
        else if (v === 0) td.className = "zero";
        else td.className = "one";
        if (isG) td.classList.add("given");
        if (won) td.classList.add("won-cell");
        if (mask && mask[r][c]) td.classList.add("bad");
        if (v !== -1) td.textContent = String(v);
        if (lastFlipCell === r + "," + c) td.classList.add("bm-flip");
        if (playing && !won && !geniusMode && focusR === r && focusC === c) td.classList.add("bm-focus");
        td.dataset.r = r;
        td.dataset.c = c;
        tr.appendChild(td);
      }
      els.grid.appendChild(tr);
    }
    lastFlipCell = null;
  }

  function tick() {
    if (!playing || paused || won) return;
    elapsedMs = Date.now() - startedAt;
    updateHUD();
  }

  function startTimer() {
    clearInterval(timerId);
    timerId = setInterval(tick, 250);
  }

  function calcSectorScore() {
    const spec = sectorSpec();
    if (omegaMode) {
      const sparseBonus = Math.max(0, (spec[0] * spec[0] - spec[1]) * 28);
      const timePenalty = Math.floor((Date.now() - sectorClock) / 1000) * 4;
      const missPenalty = mistakes * 250;
      return Math.max(200, 5000 + sparseBonus - timePenalty - missPenalty);
    }
    const base = difficulty === "hard" ? 2200 : difficulty === "medium" ? 1500 : 900;
    const sizeBonus = spec[0] === 6 ? 400 : 150;
    const sparseBonus = Math.max(0, (spec[0] * spec[0] - spec[1]) * 18);
    const timePenalty = Math.floor((Date.now() - sectorClock) / 1000) * 3;
    const missPenalty = mistakes * 100;
    return Math.max(80, base + sizeBonus + sparseBonus - timePenalty - missPenalty);
  }

  function matrixCode() {
    const bits = grid.flat().join("");
    try { return BigInt("0b" + bits).toString(); } catch (e) { return bits; }
  }

  function onWin() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    won = true;
    playing = false;
    sectorGain = calcSectorScore();
    score += sectorGain;
    const code = matrixCode();
    sectorCodes.push(code);
    updateHUD();
    renderGrid(false);
    if (dailyMode) {
      score += 500;
      maybeSaveBest(score);
      setStatus("DAILY CLEARED +" + (sectorGain + 500), "ok");
      showVictory({
        title: "DAILY NODE CLEARED",
        sub: dailyDateLabel() + " · same puzzle for every operator worldwide",
        codes: [code],
        daily: true
      });
      return;
    }
    if (omegaMode) {
      score += 3000;
      maybeSaveBest(score);
      markCampaignClear("omega");
      setStatus("OMEGA ROOT CLEARED +" + (sectorGain + 3000), "ok");
      showVictory({
        title: "OMEGA ROOT BREACHED",
        sub: "8×8 root matrix cracked · clearance: OMEGA · one strike only",
        codes: [code],
        omega: true
      });
      return;
    }
    const spec = sectorSpec();
    const more = gridLevel < campaignLen() - 1;
    if (more) {
      setStatus("SECTOR " + (gridLevel + 1) + " CLEAR +" + sectorGain, "ok");
      beep(660, 0.1, "triangle", 0.07);
      beep(880, 0.12, "square", 0.06);
      advanceTimer = setTimeout(function () {
        const lore = LORE_QUOTES[gridLevel % LORE_QUOTES.length];
        showSectorCard(spec[4], code, "Routing to next node…", advanceSector, lore);
      }, 400);
    } else {
      setStatus("LINK COMPLETE", "ok");
      markCampaignClear(difficulty);
      maybeSaveBest(score);
      let sub = difficulty.toUpperCase() + " campaign cleared · NexCorp node chain broken.";
      if (difficulty === "hard") sub += " OMEGA ROOT MATRIX unlocked.";
      showVictory({
        title: "LINK COMPLETE",
        sub: sub,
        codes: sectorCodes
      });
    }
  }

  function advanceSector() {
    advanceTimer = null;
    gridLevel++;
    loadGridSector(false);
  }

  function loadGridSector(freshRun) {
    const spec = sectorSpec();
    setStatus("Generating " + spec[0] + "×" + spec[0] + " · " + spec[4] + "…");
    setTimeout(function () {
      const pack = newPuzzleFromSpec(spec);
      solution = pack.solution;
      puzzle = pack.puzzle;
      given = pack.given;
      grid = clone(puzzle);
      playing = true;
      paused = false;
      won = false;
      geniusMode = false;
      focusR = 0;
      focusC = 0;
      mistakes = 0;
      maxMistakes = spec[2];
      sectorClock = Date.now();
      if (freshRun) {
        score = 0;
        elapsedMs = 0;
        startedAt = Date.now();
      } else {
        startedAt = Date.now() - elapsedMs;
      }
      els.pauseOv.classList.remove("show");
      els.solveBtn.classList.toggle("bm-hidden", difficulty !== "easy" || omegaMode);
      if (els.gridWrap) els.gridWrap.classList.toggle("bm-omega-grid", omegaMode || spec[0] === 8);
      let clues = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (given[r][c]) clues++;
      setStatus("Sector " + (gridLevel + 1) + "/" + campaignLen() + " · " + spec[4] + " · " + N + "×" + N + " · " + clues + " clues · " + maxMistakes + " strikes");
      renderGrid(false);
      updateHUD();
      notifyParent(true);
      startTimer();
      if (freshRun) {
        playMusic();
        beep(520, 0.1, "triangle", 0.07);
      } else {
        beep(600, 0.08, "triangle", 0.06);
      }
      sizeRain();
      saveLink();
    }, freshRun ? 30 : 40);
  }

  function failOut() {
    playing = false;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    setStatus("SYSTEM LOCK — too many errors. Restart sector or ease difficulty.", "err");
    playStrikeStinger();
    pauseMusic();
    notifyParent(false);
  }

  function cellClick(e) {
    const td = e.target.closest("td");
    if (!td || !playing || paused || won) return;
    const r = +td.dataset.r, c = +td.dataset.c;
    focusR = r;
    focusC = c;
    if (given[r][c]) {
      beep(220, 0.08, "sine", 0.04);
      return;
    }
    // cycle empty -> 0 -> 1 -> empty
    const cur = grid[r][c];
    grid[r][c] = cur === -1 ? 0 : cur === 0 ? 1 : -1;
    const nv = grid[r][c];
    beep(nv === 0 ? 640 : nv === 1 ? 920 : 480, 0.06, nv === 1 ? "square" : "sine", 0.05);
    lastFlipCell = r + "," + c;
    renderGrid(true);
    const mask = violationMask(grid);
    let hasBad = false;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (mask[i][j]) hasBad = true;
    if (hasBad) setStatus("Conflict highlighted — fix before CHECK", "err");
    else setStatus("Signal clean…");
    if (isCompleteValid(grid)) onWin();
    else saveLink();
  }

  function moveFocus(dr, dc) {
    if (!grid || N < 1) return;
    focusR = (focusR + dr + N) % N;
    focusC = (focusC + dc + N) % N;
    renderGrid(true);
    beep(420, 0.03, "sine", 0.03);
  }

  function cycleFocusCell() {
    if (!playing || paused || won || !grid) return;
    const r = focusR, c = focusC;
    if (given[r][c]) {
      beep(220, 0.08, "sine", 0.04);
      return;
    }
    const cur = grid[r][c];
    grid[r][c] = cur === -1 ? 0 : cur === 0 ? 1 : -1;
    const nv = grid[r][c];
    beep(nv === 0 ? 640 : nv === 1 ? 920 : 480, 0.06, nv === 1 ? "square" : "sine", 0.05);
    lastFlipCell = r + "," + c;
    renderGrid(true);
    const mask = violationMask(grid);
    let hasBad = false;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (mask[i][j]) hasBad = true;
    if (hasBad) setStatus("Conflict highlighted — fix before CHECK", "err");
    else setStatus("Signal clean…");
    if (isCompleteValid(grid)) onWin();
    else saveLink();
  }

  function onGridKey(e) {
    if (!playing || paused || won || geniusMode) return;
    if (!els.play || els.play.classList.contains("bm-hidden")) return;
    if (e.key === "ArrowUp") { e.preventDefault(); moveFocus(-1, 0); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); moveFocus(1, 0); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); moveFocus(0, -1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); moveFocus(0, 1); return; }
    if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); cycleFocusCell(); return; }
    if (e.key === "Enter") { e.preventDefault(); checkBoard(); return; }
  }

  function showMenu() {
    playing = false;
    paused = false;
    geniusMode = false;
    dailyMode = false;
    omegaMode = false;
    hideVictory();
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    els.pauseOv.classList.remove("show");
    if (els.geniusHelp) els.geniusHelp.classList.remove("show");
    els.menu.classList.remove("bm-hidden");
    els.play.classList.add("bm-hidden");
    if (els.genius) els.genius.classList.add("bm-hidden");
    if (els.progressWrap) els.progressWrap.hidden = true;
    if (els.gridWrap) els.gridWrap.classList.remove("bm-omega-grid");
    stopMusic();
    clearInterval(timerId);
    applyMood();
    updateBestDisplay();
    updateContinueBtn();
    updateDailyHint();
    updateRankDisplay();
    updateOmegaBtn();
    notifyParent(false);
  }

  function startDaily() {
    ensureAudio();
    hideVictory();
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    dailyMode = true;
    omegaMode = false;
    geniusMode = false;
    gridLevel = 0;
    sectorCodes = [];
    score = 0;
    mistakes = 0;
    maxMistakes = 3;
    elapsedMs = 0;
    startedAt = Date.now();
    applyMood();
    els.menu.classList.add("bm-hidden");
    if (els.genius) els.genius.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    const pack = withSeed(dateSeed(), function () {
      setGridSize(6);
      const full = generateFull();
      const dug = digPuzzle(full, 12, 2);
      const giv = [];
      for (let r = 0; r < N; r++) {
        giv[r] = [];
        for (let c = 0; c < N; c++) giv[r][c] = dug[r][c] !== -1;
      }
      return { solution: full, puzzle: dug, given: giv };
    });
    solution = pack.solution;
    puzzle = pack.puzzle;
    given = pack.given;
    grid = clone(puzzle);
    playing = true;
    paused = false;
    won = false;
    focusR = 0;
    focusC = 0;
    sectorClock = Date.now();
    els.pauseOv.classList.remove("show");
    els.solveBtn.classList.add("bm-hidden");
    setStatus("Daily node · " + dailyDateLabel() + " · 6×6 · 3 strikes");
    renderGrid(false);
    updateHUD();
    startTimer();
    playMusic();
    beep(880, 0.08, "square", 0.06);
    sizeRain();
  }

  function startOmega() {
    ensureAudio();
    hideVictory();
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    omegaMode = true;
    dailyMode = false;
    geniusMode = false;
    gridLevel = 0;
    sectorCodes = [];
    score = 0;
    mistakes = 0;
    elapsedMs = 0;
    startedAt = Date.now();
    applyMood();
    els.menu.classList.add("bm-hidden");
    if (els.genius) els.genius.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    loadGridSector(true);
  }

  function startGame() {
    ensureAudio();
    hideVictory();
    applyMood();
    dailyMode = false;
    omegaMode = false;
    arcadeMode = false;
    sectorCodes = [];
    clearLink();
    if (difficulty === "genius") {
      startGenius();
      return;
    }
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    gridLevel = 0;
    els.menu.classList.add("bm-hidden");
    if (els.genius) els.genius.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    loadGridSector(true);
  }

  // --- Genius: NexCorp NX-8 VM crack ---
  function u8(n) { return n & 255; }

  function runNX8(code, inputBytes, leakRegs) {
    const mem = new Uint8Array(64);
    for (let i = 0; i < code.length && i < 64; i++) mem[i] = code[i];
    let A = 0, B = 0, Z = 0, PC = 0, ip = 0;
    const out = [];
    let steps = 0;
    while (steps++ < 4000) {
      if (PC < 0 || PC >= 64) return { out: out, err: "PC fault", A: A, B: B, Z: Z, steps: steps };
      const op = mem[PC++];
      if (op === 0x00) break;
      else if (op === 0x01) A = mem[PC++];
      else if (op === 0x02) B = mem[PC++];
      else if (op === 0x03) A = B;
      else if (op === 0x04) B = A;
      else if (op === 0x05) A = u8(A + B);
      else if (op === 0x06) A = u8(A ^ B);
      else if (op === 0x07) A = u8(A & B);
      else if (op === 0x08) A = u8(A | B);
      else if (op === 0x09) A = u8(~A);
      else if (op === 0x0A) A = ip < inputBytes.length ? inputBytes[ip++] : 0;
      else if (op === 0x0B) out.push(A);
      else if (op === 0x0C) Z = A === B ? 1 : 0;
      else if (op === 0x0D) { const a = mem[PC++]; if (Z) PC = a; }
      else if (op === 0x0E) PC = mem[PC++];
      else if (op === 0x0F) A = mem[mem[PC++] & 63];
      else if (op === 0x10) mem[mem[PC++] & 63] = A;
      else return { out: out, err: "bad opcode " + op.toString(16), A: A, B: B, Z: Z, steps: steps };
    }
    const res = { out: out, err: null, steps: steps };
    if (leakRegs) { res.A = A; res.B = B; res.Z = Z; }
    return res;
  }

  function outOk(bytes) {
    for (let i = 0; i + 1 < bytes.length; i++) {
      if (bytes[i] === 0x4F && bytes[i + 1] === 0x4B) return true;
    }
    return false;
  }

  // L1: emit syndrome (in^key) then OK/NO — probe 00 → first OUT byte is the key
  function progL1(keyByte) {
    return [
      0x0A, 0x02, keyByte, 0x06, 0x0B,
      0x02, 0x00, 0x0C, 0x0D, 0x11,
      0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00,
      0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00
    ];
  }

  // Patch JZ/JMP sites → shared OK / NO stubs
  function patchGate(code, sites, n) {
    const okAt = code.length;
    code.push(0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00);
    const failAt = code.length;
    code.push(0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00);
    for (let i = 0; i < n; i++) {
      code[sites[i] + 1] = i < n - 1 ? sites[i] + 4 : okAt;
      code[sites[i] + 3] = failAt;
    }
    return code;
  }

  // Exact multi-byte key → OK / NO (unique; one key only)
  function progExactBytes(key) {
    const code = [];
    const n = key.length;
    const sites = [];
    for (let i = 0; i < n; i++) {
      code.push(0x0A, 0x02, key[i], 0x06, 0x02, 0x00, 0x0C);
      sites.push(code.length);
      code.push(0x0D, 0x00, 0x0E, 0x00);
    }
    return patchGate(code, sites, n);
  }

  // Multi-byte XOR leak: OUT every in⊕key, then OK only if all matched (fail flag in mem[60])
  function progXorLeak(key) {
    const code = [0x01, 0x00, 0x10, 60];
    for (let i = 0; i < key.length; i++) {
      code.push(0x0A, 0x02, key[i], 0x06, 0x0B, 0x04, 0x0F, 60, 0x08, 0x10, 60);
    }
    code.push(0x0F, 60, 0x02, 0x00, 0x0C);
    const jzAt = code.length;
    code.push(0x0D, 0x00);
    code.push(0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00);
    const okAt = code.length;
    code.push(0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00);
    code[jzAt + 1] = okAt;
    return code;
  }

  function rk(n, rnd) {
    const a = [];
    for (let i = 0; i < n; i++) a.push(rnd());
    return a;
  }

  function buildGeniusChallenges() {
    const rnd = function () { return Math.floor(Math.random() * 256); };
    // xor: syndrome OUT; scored: prefix hint; leak: show regs
    const specs = [
      { n: 1, xor: 1, scored: 0, leak: 1, b: "1-byte XOR. Probe 00 → first OUT is the key." },
      { n: 2, xor: 0, scored: 1, leak: 1, b: "Exact 2-byte. Prefix score on NO." },
      { n: 3, xor: 0, scored: 1, leak: 0, b: "Exact 3-byte. Prefix score (lock one byte at a time)." },
      { n: 4, xor: 0, scored: 1, leak: 0, b: "Exact 4-byte. Prefix score on NO." },
      { n: 2, xor: 1, scored: 0, leak: 0, b: "2-byte XOR leak. Probe 0000 → OUT bytes are the key." },
      { n: 4, xor: 0, scored: 1, leak: 0, b: "Exact 4-byte. Prefix score on NO." },
      { n: 3, xor: 1, scored: 0, leak: 0, b: "3-byte XOR leak. Probe 000000 → OUT bytes are the key." },
      { n: 4, xor: 0, scored: 1, leak: 0, b: "Final exact 4-byte. Prefix score. 2 strikes total." }
    ];
    const total = specs.length;
    return specs.map(function (s, i) {
      let key, code;
      if (s.n === 1 && s.xor) {
        key = [rnd() || 0x5A];
        code = progL1(key[0]);
      } else if (s.xor) {
        key = rk(s.n, rnd);
        code = progXorLeak(key);
      } else {
        key = rk(s.n, rnd);
        code = progExactBytes(key);
      }
      return {
        code: code, key: key, len: s.n, leak: !!s.leak, scored: !!s.scored, syndrome: !!s.xor,
        brief: KERNEL_NAMES[i] + " · L" + (i + 1) + "/" + total + " · " + s.b
      };
    });
  }

  function vmN() {
    return vmChallenges.length || 8;
  }

  function prefixScore(input, key) {
    let i = 0;
    while (i < key.length && i < input.length && input[i] === key[i]) i++;
    return i;
  }

  function hexByte(n) {
    return u8(n).toString(16).padStart(2, "0");
  }

  function parseHexBytes(str) {
    const clean = String(str || "").trim().toLowerCase().replace(/[^0-9a-f]/g, "");
    if (!clean.length || clean.length % 2) return null;
    const out = [];
    for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.substr(i, 2), 16));
    return out;
  }

  function fmtOut(bytes) {
    let ascii = "";
    const hex = bytes.map(hexByte).join(" ");
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      ascii += b >= 32 && b < 127 ? String.fromCharCode(b) : ".";
    }
    return hex + (ascii ? "  |  \"" + ascii + "\"" : "");
  }

  function setVmStatus(msg, cls) {
    if (!els.vmStatus) return;
    els.vmStatus.textContent = msg || "";
    els.vmStatus.className = "bm-status" + (cls ? " " + cls : "");
  }

  function appendLog(html) {
    if (!els.vmLog) return;
    if (els.vmLog.classList.contains("meta")) {
      els.vmLog.classList.remove("meta");
      els.vmLog.innerHTML = "";
    }
    const line = document.createElement("div");
    line.innerHTML = html;
    els.vmLog.appendChild(line);
    els.vmLog.scrollTop = els.vmLog.scrollHeight;
  }

  function loadVmLevel() {
    const ch = vmChallenges[vmLevel];
    vmCode = ch.code;
    vmExpectLen = ch.len;
    vmShowRegs = ch.leak;
    if (els.vmBrief) els.vmBrief.textContent = ch.brief;
    if (els.probe) els.probe.value = "";
    if (els.answer) els.answer.value = "";
    setVmStatus("Kernel " + (vmLevel + 1) + "/" + vmN() + " online. Probes: " + vmProbes);
    updateVmRegs(null);
    updateHUD();
  }

  function startGenius() {
    geniusMode = true;
    playing = true;
    paused = false;
    won = false;
    mistakes = 0;
    maxMistakes = 2;
    score = 0;
    vmProbes = 0;
    vmLevel = 0;
    vmSecrets = [];
    vmChallenges = buildGeniusChallenges();
    elapsedMs = 0;
    startedAt = Date.now();
    applyMood();
    els.menu.classList.add("bm-hidden");
    els.play.classList.add("bm-hidden");
    els.genius.classList.remove("bm-hidden");
    els.pauseOv.classList.remove("show");
    if (els.progressWrap) els.progressWrap.hidden = true;
    els.vmLog.classList.add("meta");
    els.vmLog.textContent = "NX-8 sandbox ready. Program hidden. ISA visible.\nEnter probe hex and RUN. SUBMIT when sure.";
    loadVmLevel();
    startTimer();
    playMusic();
    beep(880, 0.08, "square", 0.06);
    beep(440, 0.12, "triangle", 0.06);
    sizeRain();
    notifyParent(true);
  }

  function geniusFailStrike(why) {
    mistakes++;
    updateHUD();
    setVmStatus(why + " · strikes " + mistakes + "/" + maxMistakes, "err");
    playStrikeStinger();
    if (mistakes >= maxMistakes) {
      playing = false;
      setVmStatus("KERNEL LOCK — genius link severed.", "err");
      pauseMusic();
    }
  }

  function runProbe() {
    if (!geniusMode || !playing || paused || won) return;
    const bytes = parseHexBytes(els.probe.value);
    if (!bytes) {
      setVmStatus("Bad hex — use even digits, e.g. a7 or 3f1290", "err");
      return;
    }
    vmProbes++;
    const res = runNX8(vmCode, bytes, vmShowRegs);
    let html = "<span class='meta'>#" + vmProbes + " IN [" + bytes.map(hexByte).join(" ") + "]</span>\n";
    if (res.err) html += "<span class='bad'>FAULT: " + res.err + "</span>";
    else {
      const ok = outOk(res.out);
      html += (ok ? "<span class='ok'>" : "<span class='bad'>") + "OUT " + fmtOut(res.out) + "</span>";
      const ch = vmChallenges[vmLevel];
      if (!ok && ch && ch.scored) {
        const ps = prefixScore(bytes, ch.key);
        html += " <span class='meta'>· prefix score " + ps + "/" + ch.key.length + " leading bytes correct</span>";
      }
      if (ch && ch.syndrome && res.out.length) {
        const syn = res.out.slice(0, ch.len).map(hexByte).join(" ");
        html += " <span class='meta'>· syndrome " + syn + " (probe 00… ⇒ key)</span>";
      }
      html += " <span class='meta'>· " + res.steps + " cycles</span>";
      if (vmShowRegs) html += " <span class='meta'>· A=" + hexByte(res.A) + " B=" + hexByte(res.B) + " Z=" + res.Z + "</span>";
    }
    appendLog(html);
    setVmStatus("Probes: " + vmProbes + " · Kernel " + (vmLevel + 1) + "/" + vmN());
    updateVmRegs(res.err ? null : res);
    beep(okTone(res), 0.07, "square", 0.05);
    updateHUD();
  }

  function okTone(res) {
    return res && res.out && res.out[0] === 0x4F ? 720 : 280;
  }

  function submitKey() {
    if (!geniusMode || !playing || paused || won) return;
    const bytes = parseHexBytes(els.answer.value);
    const ch = vmChallenges[vmLevel];
    if (!bytes || bytes.length !== ch.key.length) {
      setVmStatus("Key must be exactly " + ch.key.length + " byte(s) hex.", "err");
      return;
    }
    // Verify via VM
    const res = runNX8(ch.code, bytes, false);
    const ok = outOk(res.out);
    if (!ok) {
      geniusFailStrike("SUBMIT rejected");
      appendLog("<span class='bad'>SUBMIT [" + bytes.map(hexByte).join(" ") + "] → DENIED</span>");
      return;
    }
    vmSecrets.push(bytes.map(hexByte).join(""));
    appendLog("<span class='ok'>SUBMIT [" + bytes.map(hexByte).join(" ") + "] → GATE OPEN</span>");
    beep(660, 0.1, "triangle", 0.08);
    if (vmLevel >= vmChallenges.length - 1) {
      geniusWin();
      return;
    }
    vmLevel++;
    loadVmLevel();
    setVmStatus("Gate cleared. Kernel " + (vmLevel + 1) + "/" + vmN() + " primed.", "ok");
  }

  function geniusWin() {
    won = true;
    playing = false;
    const bonus = Math.max(0, 10000 - vmProbes * 30 - mistakes * 500 - Math.floor(elapsedMs / 1000) * 3);
    score = 8000 + vmN() * 1000 + bonus;
    updateHUD();
    maybeSaveBest(score);
    markCampaignClear("genius");
    appendLog("<span class='ok'>ALL KERNELS OPEN · KEYCHAIN " + vmSecrets.join("") + "</span>");
    showVictory({
      title: "NEXCORP BREACHED",
      sub: "All 8 CPU gates cracked · Operator clearance: OMEGA",
      codes: vmSecrets.slice(),
      genius: true
    });
  }

  function restartSame() {
    if (!puzzle || geniusMode) return startGame();
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    grid = clone(puzzle);
    playing = true;
    paused = false;
    won = false;
    mistakes = 0;
    maxMistakes = sectorSpec()[2];
    startedAt = Date.now() - elapsedMs;
    els.pauseOv.classList.remove("show");
    setStatus("Sector " + (gridLevel + 1) + " reset — score kept.");
    renderGrid(false);
    updateHUD();
    startTimer();
    playMusic();
  }

  function checkBoard() {
    if (!playing || paused || won) return;
    const mask = violationMask(grid);
    let any = false, empty = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (grid[r][c] === -1) empty++;
      if (mask[r][c]) any = true;
    }
    renderGrid(true);
    if (empty === N * N) {
      setStatus("Place some bits first.", "err");
      return;
    }
    if (any) {
      mistakes++;
      updateHUD();
      setStatus("Violations highlighted in red.", "err");
      beep(200, 0.15, "sawtooth", 0.08);
      if (mistakes >= maxMistakes) failOut();
    } else if (empty) {
      setStatus("No conflicts yet — " + empty + " cells remain.");
      beep(640, 0.1, "triangle", 0.06);
    } else if (isCompleteValid(grid)) {
      onWin();
    } else {
      setStatus("Board full but invalid uniqueness.", "err");
    }
  }

  function solveIt() {
    if (difficulty !== "easy" || !solution || won) return;
    grid = clone(solution);
    renderGrid(false);
    onWin();
  }

  function togglePause() {
    if (!playing || won) return;
    paused = !paused;
    if (paused) {
      elapsedMs = Date.now() - startedAt;
      els.pauseOv.classList.add("show");
      pauseMusic();
      beep(400, 0.12, "sine", 0.06);
    } else {
      startedAt = Date.now() - elapsedMs;
      els.pauseOv.classList.remove("show");
      playMusic();
      beep(520, 0.1, "sine", 0.06);
    }
  }

// === SPRINT 4+ FEATURE PACK ===
  const MUSIC_LOCAL = "assets/music/nexcorp_loop.mp3";
  const BULLETIN_URL = "https://8bitcrypto44.github.io/The-Binary-Matrix/bulletin.json?v=7";
  const PING_COST = 200;
  const MAX_PINGS = 2;
  const INTERCEPT_HEADERS = [
    "CLASSIFIED INTERCEPT", "NEXCORP TRAFFIC LOG", "OPERATOR BULLETIN", "SIGINT FRAGMENT",
    "ROOT CHANNEL SNIFF", "MATRIX HANDSHAKE", "GHOST NET PING"
  ];
  const KERNEL_LORE = [
    "Leak file α: XOR syndromes were never meant for outsiders.",
    "Gate β holds dual keys — NexCorp rotates them weekly.",
    "Tripwire γ logs every wrong probe. You are still here.",
    "Quad lock δ — four bytes, one breath, zero mercy.",
    "Syndrome ε mapped your fingerprint the first time you blinked.",
    "Deep hash ζ — they hash fear. We hash back.",
    "Triple XOR η — three masks, one truth underneath.",
    "OMEGA root — the CPU dreams in ones and zeros. Wake it."
  ];
  const BOOK_NODE_LABELS = {
    1: " · BINARY MATRIX CH.2",
    3: " · BOOK NODE: FIREWALL",
    5: " · CH.7 — DEEP DIG"
  };

  let arcadeMode = false;
  let arcadeDepth = 0;
  let challengeSeed = null;
  let sectorModifier = "";
  let pingsUsed = 0;
  let fogRevealed = null;
  let mirrorGrid = false;
  let procMusicOn = false;

  Object.assign(els, {
    brandSub: ROOT.querySelector("#bm-brand-sub"),
    callsignLabel: ROOT.querySelector("#bm-callsign-label"),
    bulletin: ROOT.querySelector("#bm-bulletin"),
    streak: ROOT.querySelector("#bm-streak"),
    pingBtn: ROOT.querySelector("#bm-ping"),
    relayOut: ROOT.querySelector("#bm-relay-out"),
    relayIn: ROOT.querySelector("#bm-relay-in"),
    arcadeBtn: ROOT.querySelector("#bm-arcade"),
    rootAccessBtn: ROOT.querySelector("#bm-root-access"),
    callsignOv: ROOT.querySelector("#bm-callsign-ov"),
    callsignInput: ROOT.querySelector("#bm-callsign-input"),
    callsignSave: ROOT.querySelector("#bm-callsign-save"),
    callsignSkip: ROOT.querySelector("#bm-callsign-skip"),
    callsignErr: ROOT.querySelector("#bm-callsign-err"),
    ftue: ROOT.querySelector("#bm-ftue"),
    ftueTitle: ROOT.querySelector("#bm-ftue-title"),
    ftueBody: ROOT.querySelector("#bm-ftue-body"),
    ftueNext: ROOT.querySelector("#bm-ftue-next"),
    ftueSkip: ROOT.querySelector("#bm-ftue-skip"),
    accessOv: ROOT.querySelector("#bm-access"),
    accessCode: ROOT.querySelector("#bm-access-code"),
    cpuViz: ROOT.querySelector("#bm-cpu-viz"),
    kernelLorePanel: ROOT.querySelector("#bm-kernel-lore-panel"),
    badges: ROOT.querySelector("#bm-badges"),
    victoryCard: ROOT.querySelector("#bm-victory-card")
  });

  function haptic(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
  }

  function updateCallsignDisplay() {
    const cs = records.callsign || "—";
    if (els.callsignLabel) els.callsignLabel.textContent = "OPERATOR · " + cs;
    if (els.brandSub && records.callsign) {
      els.brandSub.textContent = records.callsign + " · NexCorp link";
    }
  }

  function ensureCallsign(cb, opts) {
    opts = opts || {};
    if (records.callsign) { if (cb) cb(); return; }
    if (!els.callsignOv) { if (cb) cb(); return; }
    if (opts.defer) { if (cb) cb(); return; }

    function finishCallsign(v) {
      records.callsign = String(v || "GHOST").toUpperCase().slice(0, 16);
      saveRecords();
      updateCallsignDisplay();
      els.callsignOv.classList.remove("show");
      if (els.callsignErr) els.callsignErr.textContent = "";
      beep(880, 0.08, "triangle", 0.07);
      if (cb) cb();
    }

    function trySave(skip) {
      if (skip) {
        finishCallsign("GHOST_" + Math.floor(1000 + Math.random() * 9000));
        return;
      }
      const raw = (els.callsignInput && els.callsignInput.value || "").trim();
      const v = raw.replace(/[^A-Za-z0-9_\-.]/g, "").slice(0, 16);
      if (v.length < 2) {
        if (els.callsignErr) {
          els.callsignErr.textContent = raw.length
            ? "Use at least 2 letters/numbers (A–Z, 0–9, _ . -)"
            : "Type a callsign or tap SKIP · PLAY NOW";
        }
        beep(200, 0.1, "sawtooth", 0.06);
        if (els.callsignInput) els.callsignInput.focus();
        return;
      }
      finishCallsign(v);
    }

    els.callsignOv.classList.add("show");
    if (els.callsignInput) {
      setTimeout(function () {
        try { els.callsignInput.focus(); } catch (e) {}
      }, 120);
      els.callsignInput.onkeydown = function (e) {
        if (e.key === "Enter") { e.preventDefault(); trySave(false); }
      };
    }
    if (els.callsignSave) els.callsignSave.onclick = function () { trySave(false); };
    if (els.callsignSkip) els.callsignSkip.onclick = function () { trySave(true); };
  }

  function fetchBulletin() {
    if (!els.bulletin) return;
    fetch(BULLETIN_URL).then(function (r) { return r.json(); }).then(function (b) {
      if (b.headline) els.bulletin.textContent = b.headline;
      if (b.challengeSeed && !challengeSeed) challengeSeed = b.challengeSeed;
    }).catch(function () {
      els.bulletin.textContent = "NexCorp link stable · jack in when ready.";
    });
  }

  function updateStreakDisplay() {
    if (!els.streak) return;
    const s = records.dailyStreak || 0;
    const best = records.dailyStreakBest || 0;
    els.streak.textContent = s > 0
      ? ("Daily streak · " + s + " day" + (s === 1 ? "" : "s") + (best > s ? " · best " + best : ""))
      : "Daily streak · start today";
  }

  function bumpDailyStreak() {
    const today = dateSeed();
    const last = records.dailyLastClear || 0;
    let streak = records.dailyStreak || 0;
    if (last === today) return;
    const yesterday = today - 1;
    const lastDayNum = last % 100;
    const todayDayNum = today % 100;
    const lastMonth = Math.floor((last % 10000) / 100);
    const todayMonth = Math.floor((today % 10000) / 100);
    const contiguous = (last === yesterday) || (lastMonth === todayMonth && lastDayNum === todayDayNum - 1) ||
      (todayMonth > lastMonth && todayDayNum === 1 && lastDayNum >= 28);
    streak = contiguous && last ? streak + 1 : 1;
    records.dailyStreak = streak;
    records.dailyLastClear = today;
    if (streak > (records.dailyStreakBest || 0)) records.dailyStreakBest = streak;
    saveRecords();
    updateStreakDisplay();
  }

  function parseUrlParams() {
    try {
      const q = new URLSearchParams(location.search);
      const s = parseInt(q.get("seed"), 10);
      if (s > 0) challengeSeed = s;
      if (q.get("relay") === "1" && location.hash.indexOf("relay=") > 0) tryLoadRelay();
    } catch (e) {}
  }

  function pickSectorModifier(level) {
    if (dailyMode || omegaMode || arcadeMode || geniusMode) return "";
    const mods = ["FOG", "TIMER", "MIRROR"];
    return mods[(level + (challengeSeed || 0)) % mods.length];
  }

  function resetSectorModifiers() {
    sectorModifier = pickSectorModifier(gridLevel);
    pingsUsed = 0;
    fogRevealed = null;
    mirrorGrid = sectorModifier === "MIRROR";
    timerBonusEligible = sectorModifier === "TIMER";
    if (sectorModifier === "FOG") {
      fogRevealed = [];
      for (let r = 0; r < N; r++) {
        fogRevealed[r] = [];
        for (let c = 0; c < N; c++) fogRevealed[r][c] = !given[r][c];
      }
    }
    if (els.grid) els.grid.classList.toggle("bm-mirror", mirrorGrid);
    updatePingBtn();
  }

  function updatePingBtn() {
    if (!els.pingBtn) return;
    const left = MAX_PINGS - pingsUsed;
    const can = playing && !won && !paused && left > 0 && score >= PING_COST && !geniusMode;
    els.pingBtn.disabled = !can;
    els.pingBtn.textContent = "PING (−" + PING_COST + ") · " + left;
  }

  function pingHint() {
    if (!playing || paused || won || geniusMode || pingsUsed >= MAX_PINGS || score < PING_COST) return;
    if (!solution) return;
    const candidates = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (given[r][c] || grid[r][c] !== -1) continue;
      if (grid[r][c] !== solution[r][c]) candidates.push([r, c]);
    }
    if (!candidates.length) {
      setStatus("No empty cells to ping.", "err");
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const r = pick[0], c = pick[1];
    grid[r][c] = solution[r][c];
    given[r][c] = true;
    score -= PING_COST;
    pingsUsed++;
    lastFlipCell = r + "," + c;
    updateHUD();
    updatePingBtn();
    renderGrid(true);
    setStatus("PING lock · cell [" + r + "," + c + "] confirmed · −" + PING_COST, "ok");
    beep(1200, 0.12, "sine", 0.08);
    haptic(30);
    saveLink();
    notifyResize();
  }

  function onFinalStrikeWarning() {
    if (mistakes !== maxMistakes - 1) return;
    ROOT.classList.add("bm-final-strike");
    setTimeout(function () { ROOT.classList.remove("bm-final-strike"); }, 1400);
    setStatus("FINAL STRIKE — NexCorp is logging this node.", "err");
    beep(80, 0.4, "sawtooth", 0.14);
    haptic([80, 40, 80]);
  }

  function arcadeSectorSpec() {
    const size = arcadeDepth % 3 === 2 ? 4 : 6;
    const maxC = size * size;
    const clues = Math.max(size === 4 ? 4 : 6, maxC - 4 - Math.floor(arcadeDepth * 0.8));
    const strikes = Math.max(1, 3 - Math.floor(arcadeDepth / 5));
    return [size, clues, strikes, 2, "ARCADE NODE " + (arcadeDepth + 1)];
  }

  function startArcade() {
    ensureAudio();
    ensureCallsign(function () {
      hideVictory();
      arcadeMode = true;
      dailyMode = false;
      omegaMode = false;
      geniusMode = false;
      arcadeDepth = 0;
      gridLevel = 0;
      sectorCodes = [];
      score = 0;
      clearLink();
      applyMood();
      els.menu.classList.add("bm-hidden");
      if (els.genius) els.genius.classList.add("bm-hidden");
      els.play.classList.remove("bm-hidden");
      notifyParent(true);
      loadGridSector(true);
    });
  }

  function relayPayload() {
    return JSON.stringify({
      v: 1, difficulty: difficulty, gridLevel: gridLevel, score: score, elapsedMs: elapsedMs,
      mistakes: mistakes, maxMistakes: maxMistakes, grid: grid, puzzle: puzzle, given: given,
      solution: solution, N: N, sectorCodes: sectorCodes, arcadeMode: arcadeMode, arcadeDepth: arcadeDepth
    });
  }

  function shareRelayLink() {
    if (!grid || geniusMode) return;
    const hash = "relay=" + encodeURIComponent(btoa(unescape(encodeURIComponent(relayPayload()))));
    const url = (location.href.split("#")[0].split("?")[0]) + "?embed=1#relay=" +
      encodeURIComponent(btoa(unescape(encodeURIComponent(relayPayload()))));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        setStatus("Relay link copied — send to your squad.", "ok");
      }).catch(function () {});
    }
    beep(720, 0.06, "triangle", 0.06);
  }

  function tryLoadRelay() {
    try {
      const m = location.hash.match(/relay=([^&]+)/);
      if (!m) return;
      const s = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
      if (!s || !s.grid) return;
      if (els.relayIn) els.relayIn.classList.remove("bm-hidden");
      els.relayIn.onclick = function () {
        ensureAudio();
        hideVictory();
        difficulty = s.difficulty || "medium";
        gridLevel = s.gridLevel || 0;
        score = s.score || 0;
        elapsedMs = s.elapsedMs || 0;
        mistakes = s.mistakes || 0;
        maxMistakes = s.maxMistakes || 3;
        grid = s.grid;
        puzzle = s.puzzle;
        given = s.given;
        solution = s.solution;
        N = s.N || 6;
        HALF = N / 2;
        sectorCodes = s.sectorCodes || [];
        arcadeMode = !!s.arcadeMode;
        arcadeDepth = s.arcadeDepth || 0;
        dailyMode = false;
        omegaMode = false;
        geniusMode = false;
        playing = true;
        paused = false;
        won = false;
        applyMood();
        els.menu.classList.add("bm-hidden");
        els.play.classList.remove("bm-hidden");
        resetSectorModifiers();
        renderGrid(false);
        updateHUD();
        startTimer();
        playMusic();
        setStatus("Relay joined · continue the squad link.", "ok");
        notifyParent(true);
      };
    } catch (e) {}
  }

  function showAccessGranted(keyHex, cb) {
    if (!els.accessOv) { if (cb) cb(); return; }
    if (els.accessCode) els.accessCode.textContent = "KEY · " + keyHex;
    els.accessOv.classList.add("show");
    beep(1046, 0.2, "triangle", 0.12);
    haptic([50, 30, 100]);
    setTimeout(function () {
      els.accessOv.classList.remove("show");
      if (cb) cb();
    }, 900);
  }

  function showKernelLore(level) {
    if (!els.kernelLorePanel) return;
    const txt = KERNEL_LORE[level] || "";
    if (!txt) { els.kernelLorePanel.classList.add("bm-hidden"); return; }
    els.kernelLorePanel.innerHTML = "<b>LEAKED FILE</b> · " + txt;
    els.kernelLorePanel.classList.remove("bm-hidden");
    if (!records.kernelLore) records.kernelLore = {};
    records.kernelLore[level] = true;
    saveRecords();
  }

  function pulseCpuViz() {
    if (!els.cpuViz) return;
    els.cpuViz.classList.remove("bm-cpu-live");
    void els.cpuViz.offsetWidth;
    els.cpuViz.classList.add("bm-cpu-live");
  }

  function computeBadges(opts) {
    const b = [];
    if (mistakes === 0 && !opts.genius) b.push("NO STRIKES");
    if (records.clears && records.clears.omega) b.push("OMEGA ROOT");
    if ((records.dailyStreak || 0) >= 3) b.push("STREAK ×" + records.dailyStreak);
    if (opts.daily) b.push("DAILY CLEARED");
    if (opts.genius) b.push("ALL KERNELS");
    if (arcadeMode && arcadeDepth >= 5) b.push("ARCADE ×" + (arcadeDepth + 1));
    if (records.firstClear) b.push("FIRST CLEAR");
    return b;
  }

  function renderBadges(opts) {
    if (!els.badges) return;
    els.badges.innerHTML = "";
    computeBadges(opts || {}).forEach(function (t) {
      const s = document.createElement("span");
      s.className = "bm-badge";
      s.textContent = t;
      els.badges.appendChild(s);
    });
  }

  function drawVictoryCard() {
    const cv = document.createElement("canvas");
    cv.width = 600;
    cv.height = 340;
    const c = cv.getContext("2d");
    c.fillStyle = "#020603";
    c.fillRect(0, 0, 600, 340);
    c.strokeStyle = "#39ff14";
    c.lineWidth = 4;
    c.strokeRect(8, 8, 584, 324);
    c.fillStyle = "#39ff14";
    c.font = "700 28px Courier New, monospace";
    c.fillText("THE BINARY MATRIX", 24, 48);
    c.fillStyle = "#86efac";
    c.font = "14px Courier New, monospace";
    const cs = records.callsign || "OPERATOR";
    c.fillText(cs + " · " + computeRank() + " · score " + score, 24, 78);
    c.fillStyle = "#bbf7d0";
    c.font = "12px Courier New, monospace";
    c.fillText(shareText().slice(0, 72), 24, 108);
    c.fillStyle = "#fde68a";
    c.font = "11px Courier New, monospace";
    computeBadges({ daily: lastVictoryDaily, genius: geniusMode, omega: lastVictoryOmega }).forEach(function (badge, i) {
      c.fillText("[" + badge + "]", 24 + (i % 3) * 180, 140 + Math.floor(i / 3) * 22);
    });
    c.fillStyle = "#6b7280";
    c.fillText("www.8bitcrypto44.xyz", 24, 310);
    return cv;
  }

  function downloadVictoryCard() {
    const cv = drawVictoryCard();
    cv.toBlob(function (blob) {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "binary-matrix-" + (records.callsign || "score") + ".png";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    });
    beep(880, 0.08, "triangle", 0.07);
  }

  function maybeRootAccessTeaser() {
    if (!records.clears || !records.clears.omega) return;
    if (els.rootAccessBtn) els.rootAccessBtn.classList.remove("bm-hidden");
    ROOT.classList.add("bm-corrupt");
    setTimeout(function () { ROOT.classList.remove("bm-corrupt"); }, 1200);
  }

  function startRootAccess() {
    omegaMode = true;
    arcadeMode = false;
    startOmega();
  }

  var ftueStep = 0;
  var FTUE_STEPS = [
    { t: "Tutorial · Step 1", b: "Tap empty cells to cycle: empty → 0 → 1. Green cells are locked clues." },
    { t: "Tutorial · Step 2", b: "No three identical bits in a row or column. Each line needs equal 0s and 1s." },
    { t: "Tutorial · Step 3", b: "Use PING (−200 score) for a hint · CHECK spends strikes on errors · Enter = CHECK on keyboard." }
  ];

  function runInteractiveTutorial(force) {
    if (!force && records.ftueDone) {
      if (els.helpOv) els.helpOv.classList.add("show");
      return;
    }
    if (!els.ftue) { if (els.helpOv) els.helpOv.classList.add("show"); return; }
    ftueStep = 0;
    function showStep() {
      const s = FTUE_STEPS[ftueStep];
      if (els.ftueTitle) els.ftueTitle.textContent = s.t;
      if (els.ftueBody) els.ftueBody.textContent = s.b;
      els.ftue.classList.add("show");
    }
    showStep();
    if (els.ftueNext) {
      els.ftueNext.onclick = function () {
        ftueStep++;
        if (ftueStep >= FTUE_STEPS.length) {
          els.ftue.classList.remove("show");
          records.ftueDone = true;
          saveRecords();
          return;
        }
        showStep();
      };
    }
    if (els.ftueSkip) {
      els.ftueSkip.onclick = function () {
        els.ftue.classList.remove("show");
        records.ftueDone = true;
        saveRecords();
      };
    }
  }

  function startProceduralMusic() {
    if (procMusicOn || muted || !musicVol || REDUCED_MOTION) return;
    ensureAudio();
    procMusicOn = true;
    var t = audioCtx.currentTime;
    var bass = audioCtx.createOscillator();
    var bassG = audioCtx.createGain();
    bass.type = "sine";
    bass.frequency.value = 55;
    bassG.gain.value = musicVol * 0.04;
    bass.connect(bassG);
    bassG.connect(audioCtx.destination);
    bass.start(t);
    procMusicNodes = { stop: function () { try { bass.stop(); } catch (e) {} procMusicOn = false; } };
  }

  function stopProceduralMusic() {
    if (procMusicNodes) procMusicNodes.stop();
    procMusicNodes = null;
    procMusicOn = false;
  }

  function sectorLabelWithBook(specLabel, level) {
    return specLabel + (BOOK_NODE_LABELS[level] || "");
  }

  // Hook renderGrid fog/mirror (wrap original)
  var _renderGrid = renderGrid;
  renderGrid = function (flashBad) {
    if (!fogRevealed && !mirrorGrid) return _renderGrid(flashBad);
    const mask = flashBad ? violationMask(grid) : null;
    els.grid.innerHTML = "";
    for (let r = 0; r < N; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < N; c++) {
        const dc = mirrorGrid ? N - 1 - c : c;
        const td = document.createElement("td");
        const v = grid[r][dc];
        const isG = given[r][dc];
        const fog = fogRevealed && fogRevealed[r][dc] && isG;
        if (v === -1) td.className = "empty";
        else if (v === 0) td.className = "zero";
        else td.className = "one";
        if (isG) td.classList.add("given");
        if (fog) td.classList.add("bm-fog");
        if (won) td.classList.add("won-cell");
        if (mask && mask[r][dc]) td.classList.add("bad");
        if (!fog && v !== -1) td.textContent = String(v);
        if (lastFlipCell === r + "," + dc) td.classList.add("bm-flip");
        if (playing && !won && !geniusMode && focusR === r && focusC === dc) td.classList.add("bm-focus");
        td.dataset.r = r;
        td.dataset.c = dc;
        tr.appendChild(td);
      }
      els.grid.appendChild(tr);
    }
    lastFlipCell = null;
  };

  var _cellClick = cellClick;
  cellClick = function (e) {
    const td = e.target.closest("td");
    if (td && fogRevealed) {
      const r = +td.dataset.r, c = +td.dataset.c;
      if (fogRevealed[r][c] && given[r][c]) {
        fogRevealed[r][c] = false;
        renderGrid(true);
        beep(600, 0.05, "sine", 0.04);
        return;
      }
    }
    _cellClick(e);
  };

  var _sectorSpec = sectorSpec;
  sectorSpec = function () {
    if (arcadeMode) return arcadeSectorSpec();
    const spec = _sectorSpec().slice();
    if (!dailyMode && !omegaMode && spec[4]) spec[4] = sectorLabelWithBook(spec[4], gridLevel);
    return spec;
  };

  var _campaignLen = campaignLen;
  campaignLen = function () {
    if (arcadeMode) return 9999;
    return _campaignLen();
  };

  var _newPuzzleFromSpec = newPuzzleFromSpec;
  newPuzzleFromSpec = function (spec) {
    const seed = challengeSeed != null ? (challengeSeed + gridLevel * 997) : null;
    if (seed == null) return _newPuzzleFromSpec(spec);
    return withSeed(seed, function () { return _newPuzzleFromSpec(spec); });
  };

  var _showSectorCard = showSectorCard;
  showSectorCard = function (clearedLabel, code, nextLabel, cb, loreQuote) {
    if (els.sectorKicker) {
      els.sectorKicker.textContent = INTERCEPT_HEADERS[gridLevel % INTERCEPT_HEADERS.length];
    }
    _showSectorCard(clearedLabel, code, nextLabel, cb, loreQuote);
  };

  var _showVictory = showVictory;
  showVictory = function (opts) {
    opts = opts || {};
    if (opts.daily) bumpDailyStreak();
    if (!records.firstClear) { records.firstClear = true; saveRecords(); }
    if (arcadeMode) {
      records.arcadeBest = Math.max(records.arcadeBest || 0, arcadeDepth + 1);
      saveRecords();
    }
    renderBadges(opts);
    _showVictory(opts);
    maybeRootAccessTeaser();
    notifyResize();
  };

  var _onWin = onWin;
  onWin = function () {
    if (timerBonusEligible && sectorClock && Date.now() - sectorClock < 90000) {
      score += 300;
    }
    if (arcadeMode) {
      if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
      won = true;
      playing = false;
      sectorGain = calcSectorScore();
      score += sectorGain;
      updateHUD();
      renderGrid(false);
      beep(660, 0.1, "triangle", 0.07);
      beep(880, 0.12, "square", 0.06);
      arcadeDepth++;
      gridLevel++;
      records.arcadeBest = Math.max(records.arcadeBest || 0, arcadeDepth);
      saveRecords();
      setStatus("ARCADE NODE " + arcadeDepth + " CLEAR +" + sectorGain, "ok");
      haptic(25);
      setTimeout(function () {
        won = false;
        playing = true;
        mistakes = 0;
        _loadGridSector(false);
        setTimeout(function () { resetSectorModifiers(); updatePingBtn(); }, 50);
      }, 700);
      return;
    }
    _onWin();
  };

  var _loadGridSector = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridSector(freshRun);
    setTimeout(function () {
      resetSectorModifiers();
      updatePingBtn();
      if (sectorModifier && els.status) {
        setStatus(els.status.textContent + " · MOD " + sectorModifier);
      }
    }, freshRun ? 40 : 50);
  };

  var _checkBoard = checkBoard;
  checkBoard = function () {
    const before = mistakes;
    _checkBoard();
    if (mistakes > before) onFinalStrikeWarning();
    updatePingBtn();
  };

  var _shareText = shareText;
  shareText = function () {
    const base = _shareText();
    return records.callsign ? (base + " · " + records.callsign) : base;
  };

  var _setupMusic = setupMusic;
  setupMusic = function () {
    bgMusic = new Audio(MUSIC_LOCAL);
    bgMusic.loop = true;
    bgMusic.preload = "auto";
    bgMusic.volume = muted ? 0 : musicVol;
    bgMusic.onerror = function () {
      bgMusic.src = MUSIC_SRC;
    };
  };

  var _playMusic = playMusic;
  playMusic = function () {
    _playMusic();
    bgMusic.play().catch(function () {
      startProceduralMusic();
    });
  };

  var _stopMusic = stopMusic;
  stopMusic = function () {
    _stopMusic();
    stopProceduralMusic();
  };

  var _submitKey = submitKey;
  submitKey = function () {
    if (!geniusMode || !playing || paused || won) return;
    const bytes = parseHexBytes(els.answer.value);
    const ch = vmChallenges[vmLevel];
    if (!bytes || bytes.length !== ch.key.length) {
      setVmStatus("Key must be exactly " + ch.key.length + " byte(s) hex.", "err");
      return;
    }
    const res = runNX8(ch.code, bytes, false);
    const ok = outOk(res.out);
    if (!ok) {
      geniusFailStrike("SUBMIT rejected");
      appendLog("<span class='bad'>SUBMIT [" + bytes.map(hexByte).join(" ") + "] → DENIED</span>");
      return;
    }
    const keyHex = bytes.map(hexByte).join("");
    showAccessGranted(keyHex, function () {
      vmSecrets.push(keyHex);
      showKernelLore(vmLevel);
      appendLog("<span class='ok'>SUBMIT [" + keyHex + "] → GATE OPEN</span>");
      beep(660, 0.1, "triangle", 0.08);
      haptic(40);
      if (vmLevel >= vmChallenges.length - 1) {
        geniusWin();
        return;
      }
      vmLevel++;
      loadVmLevel();
      setVmStatus("Gate cleared. Kernel " + (vmLevel + 1) + "/" + vmN() + " primed.", "ok");
    });
  };

  var _runProbe = runProbe;
  runProbe = function () {
    pulseCpuViz();
    _runProbe();
    haptic(15);
  };

  function dismissBlockers() {
    [els.callsignOv, els.ftue, els.helpOv, els.accessOv, els.pauseOv].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
  }

  var _showMenu = showMenu;
  var _startGame0 = startGame;
  startGame = function () {
    ensureCallsign(function () {
      _startGame0();
      if (!records.ftueDone) runInteractiveTutorial(false);
    });
  };

  showMenu = function () {
    dismissBlockers();
    arcadeMode = false;
    _showMenu();
    updateCallsignDisplay();
    updateStreakDisplay();
    maybeRootAccessTeaser();
    notifyResize();
  };

  var _restartSame = restartSame;
  restartSame = function () {
    dismissBlockers();
    _restartSame();
  };

  var _updateHUD = updateHUD;
  updateHUD = function () {
    _updateHUD();
    updatePingBtn();
    if (arcadeMode && els.diffLabel) {
      els.diffLabel.textContent = "ARCADE · NODE " + (arcadeDepth + 1) + " · BEST " + (records.arcadeBest || 0);
    }
  };

  // --- Wire UI ---
  ROOT.querySelectorAll(".bm-diff").forEach(function (btn) {
    btn.addEventListener("click", function () {
      difficulty = btn.dataset.diff;
      ROOT.querySelectorAll(".bm-diff").forEach(function (b) { b.classList.toggle("selected", b === btn); });
      if (menuRules) menuRules.innerHTML = difficulty === "genius" ? RULES_GENIUS : RULES_GRID;
      applyMood();
      updateBestDisplay();
      beep(700, 0.05, "square", 0.04);
    });
  });

  ROOT.querySelector("#bm-start").addEventListener("click", startGame);
  if (els.dailyBtn) els.dailyBtn.addEventListener("click", startDaily);
  if (els.omegaBtn) els.omegaBtn.addEventListener("click", startOmega);
  if (els.continueBtn) els.continueBtn.addEventListener("click", restoreLink);
  if (els.pingBtn) els.pingBtn.addEventListener("click", pingHint);
  if (els.relayOut) els.relayOut.addEventListener("click", shareRelayLink);
  if (els.arcadeBtn) els.arcadeBtn.addEventListener("click", startArcade);
  if (els.rootAccessBtn) els.rootAccessBtn.addEventListener("click", startRootAccess);
  if (els.victoryCard) els.victoryCard.addEventListener("click", downloadVictoryCard);
  ROOT.addEventListener("keydown", onGridKey);
  ROOT.querySelector("#bm-tutorial").addEventListener("click", function () {
    runInteractiveTutorial(true);
    beep(600, 0.05, "square", 0.04);
  });
  ROOT.querySelector("#bm-help-close").addEventListener("click", function () {
    els.helpOv.classList.remove("show");
  });
  ROOT.querySelector("#bm-menu-btn").addEventListener("click", showMenu);
  ROOT.querySelector("#bm-restart").addEventListener("click", restartSame);
  ROOT.querySelector("#bm-pause-btn").addEventListener("click", togglePause);
  ROOT.querySelector("#bm-resume").addEventListener("click", togglePause);
  els.checkBtn.addEventListener("click", checkBoard);
  els.solveBtn.addEventListener("click", solveIt);
  els.grid.addEventListener("click", cellClick);

  ROOT.querySelector("#bm-run-probe").addEventListener("click", runProbe);
  ROOT.querySelector("#bm-submit-key").addEventListener("click", submitKey);
  ROOT.querySelector("#bm-vm-menu").addEventListener("click", showMenu);
  ROOT.querySelector("#bm-vm-pause").addEventListener("click", togglePause);
  ROOT.querySelector("#bm-vm-isa").addEventListener("click", function () {
    if (els.geniusHelp) els.geniusHelp.classList.add("show");
    else els.helpOv.classList.add("show");
  });
  const gClose = ROOT.querySelector("#bm-genius-help-close");
  if (gClose) {
    gClose.addEventListener("click", function () {
      els.geniusHelp.classList.remove("show");
    });
  }
  els.probe.addEventListener("keydown", function (e) {
    if (e.key === "Enter") runProbe();
  });
  els.answer.addEventListener("keydown", function (e) {
    if (e.key === "Enter") submitKey();
  });

  function syncVol() {
    musicVol = Number(els.vol.value);
    sfxVol = Number(els.sfx.value);
    if (bgMusic) bgMusic.volume = muted ? 0 : musicVol;
    ROOT.querySelector("#bm-vol-lbl").textContent = Math.round(musicVol * 100) + "%";
    ROOT.querySelector("#bm-sfx-lbl").textContent = Math.round(sfxVol * 100) + "%";
    syncHum();
  }
  els.vol.addEventListener("input", syncVol);
  els.sfx.addEventListener("input", syncVol);
  els.mute.addEventListener("click", function () {
    muted = !muted;
    els.mute.textContent = muted ? "UNMUTE" : "MUTE";
    els.mute.setAttribute("aria-pressed", muted ? "true" : "false");
    if (bgMusic) bgMusic.volume = muted ? 0 : musicVol;
    if (muted) stopHum();
    else if (playing && !paused) startHum();
    syncHum();
    beep(500, 0.06, "square", 0.05);
  });

  if (els.victoryMenu) els.victoryMenu.addEventListener("click", showMenu);
  if (els.shareX) els.shareX.addEventListener("click", shareOnX);
  if (els.copyScore) {
    els.copyScore.addEventListener("click", function () {
      const txt = shareText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () {
          els.copyScore.textContent = "COPIED!";
          setTimeout(function () { els.copyScore.textContent = "COPY SCORE"; }, 1600);
        }).catch(function () {});
      }
      beep(720, 0.06, "triangle", 0.06);
    });
  }

  // init
  setupMusic();
  sizeRain();
  applyMood();
  updateBestDisplay();
  requestAnimationFrame(function () { sizeRain(); drawRain(); });
  runBoot(function () {
    parseUrlParams();
    fetchBulletin();
    updateCallsignDisplay();
    updateStreakDisplay();
    ensureCallsign(null, { defer: true });
    updateHUD();
    updateContinueBtn();
    updateDailyHint();
    updateRankDisplay();
    updateOmegaBtn();
    maybeRootAccessTeaser();
    notifyParent(false);
  });
})();
