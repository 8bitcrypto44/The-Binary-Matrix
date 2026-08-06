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
  const BULLETIN_URL = "https://8bitcrypto44.github.io/The-Binary-Matrix/bulletin.json?v=11";
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
    { t: "Welcome · Step 1 of 6", b: "Tap empty cells to cycle: empty → 0 → 1. Green-rim cells are locked clues — do not change them." },
    { t: "Rules · Step 2 of 6", b: "Each row/column needs equal 0s and 1s. Never three identical bits in a line. Every row and column must be unique." },
    { t: "Controls · Step 3 of 6", b: "PING = hint (−200 score). CHECK finds errors but costs strikes. Keyboard: arrows move · Space cycles · Enter = CHECK." },
    { t: "Campaign · Step 4 of 6", b: "Pick Easy/Medium/Hard, choose a loadout perk, then JACK IN. Clear every sector on the map to finish the link." },
    { t: "Heat & extras · Step 5 of 6", b: "NexCorp HEAT rises as you clear sectors. High heat unlocks pursuit, bonus nodes, extraction, and side doors — ignore until you see them." },
    { t: "Full guide · Step 6 of 6", b: "Overwhelmed? Menu → FULL GUIDE explains every button, HUD bar, black-market item, and special mode. Tap NEXT to play." }
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
          if (els.helpOv) els.helpOv.classList.add("show");
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

// === ADDICTION SPRINT ===
  let cleanStreak = 0;
  let sectorMistakesAtStart = 0;

  Object.assign(els, {
    multHud: ROOT.querySelector("#bm-mult"),
    cmap: ROOT.querySelector("#bm-cmap"),
    rankUp: ROOT.querySelector("#bm-rank-up"),
    rankUpTitle: ROOT.querySelector("#bm-rank-up-title"),
    rankUpRank: ROOT.querySelector("#bm-rank-up-rank"),
    burst: ROOT.querySelector("#bm-burst"),
    victoryPreview: ROOT.querySelector("#bm-victory-preview"),
    challengeLink: ROOT.querySelector("#bm-challenge-link"),
    dailyPct: ROOT.querySelector("#bm-daily-pct")
  });

  if (!records.lastRank) records.lastRank = computeRank();

  function streakMult(n) {
    if (n >= 3) return 2;
    if (n === 2) return 1.5;
    if (n === 1) return 1.25;
    return 1;
  }

  function updateMultiplierHUD() {
    if (!els.multHud) return;
    if (geniusMode || dailyMode || omegaMode) {
      els.multHud.textContent = "";
      els.multHud.classList.remove("bm-hot");
      return;
    }
    const m = streakMult(cleanStreak);
    els.multHud.textContent = cleanStreak > 0
      ? ("CLEAN CHAIN ×" + m + " · " + cleanStreak + " sector" + (cleanStreak === 1 ? "" : "s"))
      : "Chain bonus · clear sectors with zero strikes";
    els.multHud.classList.toggle("bm-hot", cleanStreak >= 2);
  }

  function renderCampaignMap() {
    if (!els.cmap) return;
    if (dailyMode || omegaMode || arcadeMode || geniusMode) {
      els.cmap.classList.add("bm-hidden");
      return;
    }
    const len = campaignLen();
    if (typeof len !== "number" || len > 20) {
      els.cmap.classList.add("bm-hidden");
      return;
    }
    els.cmap.classList.remove("bm-hidden");
    els.cmap.innerHTML = "";
    for (let i = 0; i < len; i++) {
      const node = document.createElement("span");
      node.className = "bm-cmap-node";
      if (i < gridLevel) node.classList.add("done");
      if (i === gridLevel) node.classList.add("now");
      node.textContent = String(i + 1);
      node.title = "Sector " + (i + 1);
      els.cmap.appendChild(node);
      if (i < len - 1) {
        const line = document.createElement("span");
        line.className = "bm-cmap-line" + (i < gridLevel ? " done" : "");
        els.cmap.appendChild(line);
      }
    }
  }

  function showRankUp(newRank) {
    if (!els.rankUp || newRank === records.lastRank) return;
    if (els.rankUpTitle) els.rankUpTitle.textContent = "CLEARANCE UPGRADED";
    if (els.rankUpRank) els.rankUpRank.textContent = newRank;
    els.rankUp.classList.add("show");
    ROOT.classList.add("bm-rank-flash");
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.18, "triangle", 0.12); }, i * 120);
    });
    haptic([50, 40, 80, 40]);
    setTimeout(function () {
      els.rankUp.classList.remove("show");
      ROOT.classList.remove("bm-rank-flash");
    }, 2400);
    records.lastRank = newRank;
    saveRecords();
    updateRankDisplay();
  }

  function checkRankUp() {
    const r = computeRank();
    if (r !== records.lastRank) showRankUp(r);
  }

  function dailyPercentile(sc) {
    const h = ((dateSeed() * 997 + sc * 13) ^ 0x5bd1e995) >>> 0;
    return 22 + (h % 73);
  }

  function burstClear() {
    ROOT.classList.add("bm-burst");
    if (els.burst) els.burst.classList.add("show");
    if (els.rain) els.rain.style.filter = "brightness(1.6)";
    beep(880, 0.08, "square", 0.08);
    setTimeout(function () { beep(1175, 0.14, "triangle", 0.1); }, 90);
    haptic(35);
    setTimeout(function () {
      ROOT.classList.remove("bm-burst");
      if (els.burst) els.burst.classList.remove("show");
      if (els.rain) els.rain.style.filter = "";
    }, 750);
  }

  function popCell(r, c) {
    if (!els.grid) return;
    const td = els.grid.querySelector('td[data-r="' + r + '"][data-c="' + c + '"]');
    if (!td) return;
    td.classList.add("bm-pop");
    setTimeout(function () { td.classList.remove("bm-pop"); }, 420);
  }

  function previewVictoryCard() {
    if (!els.victoryPreview) return;
    try {
      const cv = drawVictoryCard();
      els.victoryPreview.src = cv.toDataURL("image/png");
      els.victoryPreview.classList.remove("bm-hidden");
    } catch (e) {
      els.victoryPreview.classList.add("bm-hidden");
    }
  }

  function shareChallengeLink() {
    const seed = challengeSeed || (dateSeed() ^ (gridLevel + 1) * 7919);
    const base = location.href.split("#")[0].split("?")[0];
    const url = base + (base.indexOf("?") >= 0 ? "&" : "?") + "seed=" + seed;
    const txt = "THE BINARY MATRIX · beat node seed " + seed + " · " + url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        if (els.challengeLink) {
          els.challengeLink.textContent = "LINK COPIED!";
          setTimeout(function () { els.challengeLink.textContent = "CHALLENGE LINK"; }, 1600);
        }
      }).catch(function () {});
    }
    beep(720, 0.06, "triangle", 0.06);
  }

  var _updateStreakDisplay = updateStreakDisplay;
  updateStreakDisplay = function () {
    _updateStreakDisplay();
    if (!els.streak) return;
    const s = records.dailyStreak || 0;
    els.streak.classList.remove("bm-flame-1", "bm-flame-2", "bm-flame-3");
    if (s >= 7) els.streak.classList.add("bm-flame-3");
    else if (s >= 3) els.streak.classList.add("bm-flame-2");
    else if (s >= 1) els.streak.classList.add("bm-flame-1");
  };

  var _updateDailyHint = updateDailyHint;
  updateDailyHint = function () {
    _updateDailyHint();
  };

  var _markCampaignClear2 = markCampaignClear;
  markCampaignClear = function (key) {
    const before = computeRank();
    _markCampaignClear2(key);
    const after = computeRank();
    if (after !== before) showRankUp(after);
  };

  var _calcSectorScore2 = calcSectorScore;
  calcSectorScore = function () {
    return Math.floor(_calcSectorScore2() * streakMult(cleanStreak));
  };

  var _onFinalStrike = onFinalStrikeWarning;
  onFinalStrikeWarning = function () {
    _onFinalStrike();
    ROOT.classList.add("bm-death-strike");
    setStatus("FINAL STRIKE — NexCorp logging your node · next error locks link", "err");
    beep(60, 0.5, "sawtooth", 0.16);
    setTimeout(function () { beep(45, 0.35, "sawtooth", 0.14); }, 120);
    haptic([120, 50, 120]);
    setTimeout(function () { ROOT.classList.remove("bm-death-strike"); }, 1600);
  };

  var _onWinChain = onWin;
  onWin = function () {
    const mStart = sectorMistakesAtStart;
    _onWinChain();
    if (!won) return;
    if (mistakes === mStart && !dailyMode) {
      cleanStreak++;
      updateMultiplierHUD();
    }
    if (!geniusMode) burstClear();
    renderCampaignMap();
    notifyResize();
  };

  var _loadGridChain = loadGridSector;
  loadGridSector = function (freshRun) {
    if (freshRun && !arcadeMode) cleanStreak = 0;
    sectorMistakesAtStart = mistakes;
    _loadGridChain(freshRun);
    setTimeout(function () {
      renderCampaignMap();
      updateMultiplierHUD();
    }, 55);
  };

  var _checkBoardChain = checkBoard;
  checkBoard = function () {
    const m0 = mistakes;
    _checkBoardChain();
    if (mistakes > m0) {
      cleanStreak = 0;
      updateMultiplierHUD();
    }
  };

  var _cellClickChain = cellClick;
  cellClick = function (e) {
    const td = e.target.closest("td");
    _cellClickChain(e);
    if (td) popCell(+td.dataset.r, +td.dataset.c);
  };

  var _showVictoryChain = showVictory;
  showVictory = function (opts) {
    opts = opts || {};
    if (opts.daily && els.dailyPct) {
      const pct = dailyPercentile(score);
      els.dailyPct.textContent = "You outscored ~" + pct + "% of operators today";
      els.dailyPct.classList.remove("bm-hidden");
    } else if (els.dailyPct) {
      els.dailyPct.classList.add("bm-hidden");
    }
    _showVictoryChain(opts);
    previewVictoryCard();
    notifyResize();
  };

  if (els.challengeLink) els.challengeLink.addEventListener("click", shareChallengeLink);

  updateMultiplierHUD();
  renderCampaignMap();

// === BOSS SPRINT — new feel ===
  let loadoutPerk = "chain";
  let ghostSolution = null;
  let sectorStartedAt = 0;
  let bonusNodeMode = false;

  if (!records.wanted) records.wanted = 0;
  if (!records.wantedDay) records.wantedDay = 0;
  if (!records.sectorPB) records.sectorPB = {};
  if (!records.ghost) records.ghost = {};
  function daysBetweenDates(fromSeed, toSeed) {
    if (!fromSeed || !toSeed) return 0;
    function toDate(s) {
      return new Date(Math.floor(s / 10000), Math.floor((s % 10000) / 100) - 1, s % 100);
    }
    return Math.max(0, Math.floor((toDate(toSeed) - toDate(fromSeed)) / 86400000));
  }
  if (records.wantedDay !== dateSeed()) {
    const gap = daysBetweenDates(records.wantedDay, dateSeed());
    if (gap > 0 && records.wantedDay) {
      records.wanted = Math.max(0, Math.round((records.wanted || 0) - gap * 12));
      if (records.wanted < 100) records.bonusUnlocked = false;
    }
    records.wantedDay = dateSeed();
    saveRecords();
  }
  loadoutPerk = records.loadout || "chain";

  Object.assign(els, {
    wantedFill: ROOT.querySelector("#bm-wanted-fill"),
    wantedLabel: ROOT.querySelector("#bm-wanted-label"),
    sectorPb: ROOT.querySelector("#bm-sector-pb"),
    bossIntro: ROOT.querySelector("#bm-boss-intro"),
    bossTitle: ROOT.querySelector("#bm-boss-title"),
    bossSub: ROOT.querySelector("#bm-boss-sub"),
    bonusBtn: ROOT.querySelector("#bm-bonus-node"),
    loadoutRoot: ROOT.querySelector("#bm-loadout")
  });

  function sectorKey() {
    return (difficulty || "m") + "L" + gridLevel + "N" + N + "S" + (challengeSeed || 0);
  }

  function isBossSector() {
    if (dailyMode || arcadeMode || omegaMode || geniusMode) return false;
    const len = campaignLen();
    if (typeof len !== "number" || len > 50) return false;
    return gridLevel === len - 1;
  }

  function perkChainMult(m) {
    if (loadoutPerk === "chain") return m * 1.15;
    return m;
  }

  function addWanted(amt) {
    const mul = loadoutPerk === "heat" ? 1.35 : 1;
    records.wanted = Math.min(100, Math.max(0, Math.round(records.wanted + amt * mul)));
    records.wantedDay = dateSeed();
    if (records.wanted >= 100 && !records.bonusUnlocked) {
      records.bonusUnlocked = true;
    }
    saveRecords();
    updateWantedUI();
  }

  function updateWantedUI() {
    const w = records.wanted || 0;
    if (els.wantedFill) els.wantedFill.style.width = w + "%";
    if (els.wantedLabel) {
      els.wantedLabel.textContent = w >= 100
        ? "WANTED · MAX · BONUS NODE LIVE"
        : ("NEXCORP HEAT · " + w + "%");
    }
    ROOT.classList.toggle("bm-heat-high", w >= 70);
    ROOT.classList.toggle("bm-heat-max", w >= 100);
    if (els.bonusBtn) {
      if (records.bonusUnlocked) els.bonusBtn.classList.remove("bm-hidden");
      else els.bonusBtn.classList.add("bm-hidden");
    }
  }

  function updateSectorPbLine() {
    if (!els.sectorPb || !playing || geniusMode) {
      if (els.sectorPb) els.sectorPb.textContent = "";
      return;
    }
    const pb = records.sectorPB[sectorKey()];
    if (!pb) {
      els.sectorPb.textContent = "Sector PB · none yet — set the ghost";
      return;
    }
    els.sectorPb.textContent = "Sector PB · " + fmtTime(pb.t) + " · " + pb.s + " strikes · score " + pb.sc;
  }

  function saveSectorPB() {
    const key = sectorKey();
    const t = Date.now() - sectorStartedAt;
    const s = mistakes - sectorMistakesAtStart;
    const sc = sectorGain;
    const prev = records.sectorPB[key];
    if (!prev || sc > prev.sc || (sc === prev.sc && t < prev.t)) {
      records.sectorPB[key] = { t: t, s: s, sc: sc };
      saveRecords();
    }
    if (s === 0 && solution) {
      records.ghost[key] = solution.map(function (row) { return row.slice(); });
      saveRecords();
    }
  }

  function loadGhostForSector() {
    ghostSolution = records.ghost[sectorKey()] || null;
  }

  function showBossIntro(done) {
    if (!els.bossIntro) { if (done) done(); return; }
    ROOT.classList.add("bm-mood-boss");
    if (els.bossTitle) els.bossTitle.textContent = difficulty.toUpperCase() + " · FINAL GATE";
    if (els.bossSub) {
      els.bossSub.textContent = sectorSpec()[4] + " · " + maxMistakes + " strike" + (maxMistakes === 1 ? "" : "s") + " · no margin";
    }
    els.bossIntro.classList.add("show");
    beep(80, 0.35, "sawtooth", 0.14);
    setTimeout(function () { beep(120, 0.25, "sawtooth", 0.12); }, 200);
    haptic([100, 50, 100]);
    setTimeout(function () {
      els.bossIntro.classList.remove("show");
      if (done) done();
    }, 2800);
  }

  function startBonusNode() {
    if (!records.bonusUnlocked) return;
    ensureAudio();
    hideVictory();
    records.bonusUnlocked = false;
    saveRecords();
    updateWantedUI();
    dailyMode = false;
    omegaMode = false;
    arcadeMode = false;
    geniusMode = false;
    gridLevel = 0;
    difficulty = difficulty === "easy" ? "medium" : difficulty;
    sectorCodes = [];
    applyMood();
    els.menu.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    bonusNodeMode = true;
    const spec = [6, 8, 2, 3, "BONUS NODE · HEAT MAX · 2× SCORE"];
    setTimeout(function () {
      const pack = newPuzzleFromSpec(spec);
      solution = pack.solution;
      puzzle = pack.puzzle;
      given = pack.given;
      grid = clone(puzzle);
      playing = true;
      paused = false;
      won = false;
      mistakes = 0;
      maxMistakes = 2;
      sectorClock = Date.now();
      sectorStartedAt = Date.now();
      startedAt = Date.now() - elapsedMs;
      loadGhostForSector();
      els.pauseOv.classList.remove("show");
      setStatus("BONUS NODE · 2× score · 6×6 · 2 strikes");
      renderGrid(false);
      updateHUD();
      updateSectorPbLine();
      startTimer();
      playMusic();
      ROOT.classList.add("bm-mood-boss");
      beep(440, 0.15, "sawtooth", 0.1);
    }, 40);
  }

  function maxPingsAllowed() {
    return MAX_PINGS + (loadoutPerk === "ping" && playing && !geniusMode ? 1 : 0);
  }

  function bindLoadout() {
    if (!els.loadoutRoot || els.loadoutRoot.dataset.bound) return;
    els.loadoutRoot.dataset.bound = "1";
    els.loadoutRoot.querySelectorAll(".bm-loadout-btn").forEach(function (btn) {
      btn.classList.toggle("selected", btn.dataset.loadout === loadoutPerk);
      btn.addEventListener("click", function () {
        loadoutPerk = btn.dataset.loadout || "chain";
        records.loadout = loadoutPerk;
        saveRecords();
        els.loadoutRoot.querySelectorAll(".bm-loadout-btn").forEach(function (b) {
          b.classList.toggle("selected", b === btn);
        });
        beep(640, 0.05, "square", 0.05);
      });
    });
  }

  var _streakMultOrig = streakMult;
  streakMult = function (n) {
    return perkChainMult(_streakMultOrig(n));
  };

  var _loadGridBoss = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridBoss(freshRun);
    setTimeout(function () {
      if (loadoutPerk === "strike") maxMistakes += 1;
      sectorStartedAt = Date.now();
      loadGhostForSector();
      updateSectorPbLine();
      if (isBossSector()) {
        playing = false;
        showBossIntro(function () {
          playing = true;
          beep(660, 0.12, "triangle", 0.08);
        });
      } else if (!bonusNodeMode) {
        ROOT.classList.remove("bm-mood-boss");
      }
    }, freshRun ? 45 : 55);
  };

  var _calcScoreBoss = calcSectorScore;
  calcSectorScore = function () {
    let s = _calcScoreBoss();
    if (bonusNodeMode) s = Math.floor(s * 2);
    return s;
  };

  var _onWinBoss = onWin;
  onWin = function () {
    const wasBonus = bonusNodeMode;
    const wasBoss = isBossSector();
    _onWinBoss();
    if (!won) return;
    saveSectorPB();
    if (wasBonus) bonusNodeMode = false;
    if (!dailyMode && !arcadeMode && !geniusMode && !wasBonus) addWanted(wasBoss ? 18 : 10);
    if (dailyMode) addWanted(6);
    updateSectorPbLine();
  };

  var _failOutBoss = failOut;
  failOut = function () {
    addWanted(-12);
    ROOT.classList.remove("bm-mood-boss");
    _failOutBoss();
  };

  var _renderGridBoss = renderGrid;
  renderGrid = function (flashBad) {
    _renderGridBoss(flashBad);
    if (!ghostSolution || !els.grid) return;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] !== -1 || given[r][c]) continue;
        const td = els.grid.querySelector('td[data-r="' + r + '"][data-c="' + c + '"]');
        if (!td || ghostSolution[r][c] === undefined) continue;
        td.classList.add("bm-ghost-hint");
        td.setAttribute("data-ghost", String(ghostSolution[r][c]));
      }
    }
  };

  var _showMenuBoss = showMenu;
  showMenu = function () {
    bonusNodeMode = false;
    ROOT.classList.remove("bm-mood-boss");
    _showMenuBoss();
    updateWantedUI();
    bindLoadout();
  };

  var _pingHintBoss = pingHint;
  pingHint = function () {
    if (!playing || paused || won || geniusMode || pingsUsed >= maxPingsAllowed() || score < PING_COST) return;
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
  };

  var _updatePingBoss = updatePingBtn;
  updatePingBtn = function () {
    _updatePingBoss();
    if (!els.pingBtn || geniusMode) return;
    const left = maxPingsAllowed() - pingsUsed;
    const can = playing && !won && !paused && left > 0 && score >= PING_COST;
    els.pingBtn.disabled = !can;
    els.pingBtn.textContent = "PING (−" + PING_COST + ") · " + left;
  };

  bindLoadout();
  updateWantedUI();
  if (els.bonusBtn) els.bonusBtn.addEventListener("click", startBonusNode);

// === PURSUIT SPRINT — heat chases you ===
  let pursuitPulseOsc = null;
  let pursuitPulseGain = null;
  let pursuitPulseTimer = null;
  let menuHeatAt = Date.now();

  Object.assign(els, {
    pursuitWrap: ROOT.querySelector("#bm-pursuit-wrap"),
    pursuitTimer: ROOT.querySelector("#bm-pursuit-timer"),
    ghostRace: ROOT.querySelector("#bm-ghost-race"),
    ghostLabel: ROOT.querySelector("#bm-ghost-label"),
    ghostFill: ROOT.querySelector("#bm-ghost-fill"),
    ghostMark: ROOT.querySelector("#bm-ghost-mark"),
    bountyBoard: ROOT.querySelector("#bm-bounty-board")
  });

  function isPursuitActive() {
    if (dailyMode || arcadeMode || omegaMode || bonusNodeMode) return false;
    if (geniusMode) return false;
    if (!playing || paused || won) return false;
    const heat = records.wanted || 0;
    return heat >= 70 || ROOT.classList.contains("bm-mood-boss");
  }

  function pursuitLimitMs() {
    const pb = records.sectorPB && records.sectorPB[sectorKey()];
    if (pb && pb.t > 4000) return Math.floor(pb.t * 1.12);
    const spec = sectorSpec();
    return (75 + (spec[0] || 6) * 22) * 1000;
  }

  function ghostPbMs() {
    const pb = records.sectorPB && records.sectorPB[sectorKey()];
    return pb && pb.t > 0 ? pb.t : null;
  }

  function fmtSec(ms) {
    return Math.max(0, Math.ceil(ms / 1000)) + "s";
  }

  function updateBountyBoard() {
    if (!els.bountyBoard) return;
    const w = records.wanted || 0;
    const perk = (loadoutPerk || "chain").toUpperCase();
    let line = "BOUNTY BOARD · HEAT " + w + "% · LOADOUT " + perk;
    if (w >= 70) line += " · PURSUIT ACTIVE";
    if (records.bonusUnlocked) line += " · BONUS LIVE";
    els.bountyBoard.textContent = line;
  }

  function applyMenuHeatDecay() {
    const idle = Date.now() - menuHeatAt;
    if (idle > 90000 && (records.wanted || 0) > 0) {
      records.wanted = Math.max(0, (records.wanted || 0) - 1);
      if (records.wanted < 100) records.bonusUnlocked = false;
      saveRecords();
      updateWantedUI();
    }
    menuHeatAt = Date.now();
  }

  function syncPursuitPulse() {
    const on = isPursuitActive() && !muted && musicVol && !REDUCED_MOTION;
    if (on && !pursuitPulseOsc) {
      ensureAudio();
      pursuitPulseOsc = audioCtx.createOscillator();
      pursuitPulseGain = audioCtx.createGain();
      pursuitPulseOsc.type = "triangle";
      pursuitPulseOsc.frequency.value = 82;
      pursuitPulseGain.gain.value = 0;
      pursuitPulseOsc.connect(pursuitPulseGain);
      pursuitPulseGain.connect(audioCtx.destination);
      pursuitPulseOsc.start();
      let up = true;
      pursuitPulseTimer = setInterval(function () {
        if (!pursuitPulseGain) return;
        pursuitPulseGain.gain.setTargetAtTime(up ? musicVol * 0.055 : musicVol * 0.012, audioCtx.currentTime, 0.08);
        up = !up;
      }, 520);
    } else if (!on && pursuitPulseOsc) {
      clearInterval(pursuitPulseTimer);
      pursuitPulseTimer = null;
      try { pursuitPulseOsc.stop(); } catch (e) {}
      pursuitPulseOsc.disconnect();
      pursuitPulseGain.disconnect();
      pursuitPulseOsc = null;
      pursuitPulseGain = null;
    }
  }

  function stopPursuitPulse() {
    if (!pursuitPulseOsc) return;
    clearInterval(pursuitPulseTimer);
    pursuitPulseTimer = null;
    try { pursuitPulseOsc.stop(); } catch (e) {}
    pursuitPulseOsc.disconnect();
    pursuitPulseGain.disconnect();
    pursuitPulseOsc = null;
    pursuitPulseGain = null;
  }

  function updatePursuitUI() {
    const active = isPursuitActive();
    ROOT.classList.toggle("bm-pursuit", active);
    ROOT.classList.toggle("bm-pursuit-urgent", false);
    if (els.pursuitWrap) els.pursuitWrap.hidden = !active;
    if (!active) {
      syncPursuitPulse();
      return;
    }
    const elapsed = Date.now() - sectorStartedAt;
    const limit = pursuitLimitMs();
    const left = limit - elapsed;
    if (left <= 0) {
      pursuitTimedOut();
      return;
    }
    if (els.pursuitTimer) {
      els.pursuitTimer.textContent = "PURSUIT · " + fmtTime(left) + " · trace closing";
    }
    if (left < 20000) ROOT.classList.add("bm-pursuit-urgent");
    if (els.rain) els.rain.style.filter = "brightness(1.25) saturate(1.35) hue-rotate(-55deg)";
    if (els.rainBack) els.rainBack.style.filter = "brightness(1.15) hue-rotate(-40deg)";
    syncPursuitPulse();
  }

  function updateGhostRace() {
    const ghost = ghostPbMs();
    const show = playing && !paused && !won && !geniusMode && !dailyMode && ghost;
    if (els.ghostRace) els.ghostRace.hidden = !show;
    if (!show || !els.ghostFill || !els.ghostLabel) return;
    const elapsed = Date.now() - sectorStartedAt;
    const pct = Math.min(100, Math.round(elapsed / ghost * 100));
    els.ghostFill.style.width = pct + "%";
    if (els.ghostMark) els.ghostMark.style.left = "100%";
    const delta = elapsed - ghost;
    if (delta > 0) {
      els.ghostLabel.textContent = "GHOST +" + fmtSec(delta) + " ahead · PB " + fmtTime(ghost);
      els.ghostFill.classList.add("bm-behind");
    } else {
      els.ghostLabel.textContent = "YOU +" + fmtSec(-delta) + " ahead · PB " + fmtTime(ghost);
      els.ghostFill.classList.remove("bm-behind");
    }
  }

  function pursuitTimedOut() {
    if (!playing || won) return;
    addWanted(8);
    setStatus("PURSUED — NexCorp trace timed out your node.", "err");
    beep(55, 0.4, "sawtooth", 0.14);
    haptic([80, 40, 80]);
    failOut();
  }

  function bountyTag() {
    return "HEAT " + (records.wanted || 0) + "% · " + (loadoutPerk || "chain").toUpperCase();
  }

  var _tickPursuit = tick;
  tick = function () {
    _tickPursuit();
    updatePursuitUI();
    updateGhostRace();
  };

  var _checkPursuit = checkBoard;
  checkBoard = function () {
    const m0 = mistakes;
    const s0 = score;
    _checkPursuit();
    if (mistakes > m0 && isPursuitActive()) {
      const pen = Math.max(90, Math.floor(Math.max(s0, score) * 0.1));
      score = Math.max(0, score - pen);
      updateHUD();
      setStatus("Pursuit penalty · −" + pen + " score · strikes cost double under trace", "err");
      beep(140, 0.12, "sawtooth", 0.1);
    }
  };

  var _loadGridPursuit = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridPursuit(freshRun);
    setTimeout(function () {
      updatePursuitUI();
      updateGhostRace();
      if (els.rain && !isPursuitActive()) {
        els.rain.style.filter = "";
        if (els.rainBack) els.rainBack.style.filter = "";
      }
    }, 60);
  };

  var _showMenuPursuit = showMenu;
  showMenu = function () {
    applyMenuHeatDecay();
    stopPursuitPulse();
    ROOT.classList.remove("bm-pursuit", "bm-pursuit-urgent");
    if (els.rain) els.rain.style.filter = "";
    if (els.rainBack) els.rainBack.style.filter = "";
    _showMenuPursuit();
    updateBountyBoard();
  };

  var _failOutPursuit = failOut;
  failOut = function () {
    stopPursuitPulse();
    ROOT.classList.remove("bm-pursuit", "bm-pursuit-urgent");
    _failOutPursuit();
  };

  var _stopMusicPursuit = stopMusic;
  stopMusic = function () {
    stopPursuitPulse();
    _stopMusicPursuit();
  };

  var _shareTextPursuit = shareText;
  shareText = function () {
    return _shareTextPursuit() + " · " + bountyTag();
  };

  var _shareChallengePursuit = shareChallengeLink;
  shareChallengeLink = function () {
    const seed = challengeSeed || (dateSeed() ^ (gridLevel + 1) * 7919);
    const base = location.href.split("#")[0].split("?")[0];
    const url = base + (base.indexOf("?") >= 0 ? "&" : "?") + "seed=" + seed;
    const txt = "THE BINARY MATRIX · bounty challenge · " + bountyTag() + " · beat seed " + seed + " · " + url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        if (els.challengeLink) {
          els.challengeLink.textContent = "BOUNTY COPIED!";
          setTimeout(function () { els.challengeLink.textContent = "CHALLENGE LINK"; }, 1600);
        }
      }).catch(function () {});
    }
    beep(720, 0.06, "triangle", 0.06);
  };

  var _relayPayloadPursuit = relayPayload;
  relayPayload = function () {
    try {
      const p = JSON.parse(_relayPayloadPursuit());
      p.wanted = records.wanted || 0;
      p.loadout = loadoutPerk || "chain";
      p.bounty = bountyTag();
      return JSON.stringify(p);
    } catch (e) {
      return _relayPayloadPursuit();
    }
  };

  var _shareRelayPursuit = shareRelayLink;
  shareRelayLink = function () {
    _shareRelayPursuit();
    setStatus("Relay copied · squad sees your " + bountyTag(), "ok");
  };

  var _syncHumPursuit = syncHum;
  syncHum = function () {
    _syncHumPursuit();
    if (humOsc && isPursuitActive()) humOsc.frequency.value = 72;
    else if (humOsc) humOsc.frequency.value = 58;
  };

  updateBountyBoard();
  updateWantedUI();

// === EXTRACTION SPRINT — exfil, squad board, hunter voice ===
  let extractionMode = false;
  let extractionProgress = 0;
  let pursuitHunterShown = false;
  const EXTRACT_SPECS = [
    [4, 6, 3, 2, "EXTRACT · NODE 1 · QUIET EXIT"],
    [6, 10, 2, 2, "EXTRACT · NODE 2 · HUNTER SWARM"],
    [6, 8, 2, 1, "EXTRACT · NODE 3 · AIRLOCK"]
  ];
  const HUNTER_LINES = [
    "NexCorp hunter · I see your checksum, ghost.",
    "Trace locked · nowhere left to jack out.",
    "Heat signature confirmed · proceeding to intercept.",
    "Sector sweep active · drop the grid and walk away."
  ];

  if (!records.relayBoard) records.relayBoard = [];
  if (!records.extractions) records.extractions = 0;

  Object.assign(els, {
    extractBtn: ROOT.querySelector("#bm-extract"),
    extractBar: ROOT.querySelector("#bm-extract-bar"),
    extractLabel: ROOT.querySelector("#bm-extract-label"),
    extractOv: ROOT.querySelector("#bm-extract-ov"),
    extractLoot: ROOT.querySelector("#bm-extract-loot"),
    relayBoard: ROOT.querySelector("#bm-relay-board"),
    hunterLine: ROOT.querySelector("#bm-hunter-line"),
    hunterText: ROOT.querySelector("#bm-hunter-text")
  });

  function updateExtractBar() {
    if (!els.extractBar || !els.extractLabel) return;
    if (!extractionMode) {
      els.extractBar.hidden = true;
      return;
    }
    els.extractBar.hidden = false;
    els.extractLabel.textContent = "EXTRACTION · " + extractionProgress + " / 3 nodes cleared · do not fail";
    ROOT.classList.add("bm-extract-active");
  }

  function loadExtractionSector(idx) {
    const spec = EXTRACT_SPECS[idx] || EXTRACT_SPECS[EXTRACT_SPECS.length - 1];
    const pack = newPuzzleFromSpec(spec);
    solution = pack.solution;
    puzzle = pack.puzzle;
    given = pack.given;
    grid = clone(puzzle);
    N = spec[0];
    HALF = N / 2;
    playing = true;
    paused = false;
    won = false;
    mistakes = 0;
    maxMistakes = spec[3];
    sectorClock = Date.now();
    sectorStartedAt = Date.now();
    sectorMistakesAtStart = 0;
    els.pauseOv.classList.remove("show");
    if (els.gridWrap) els.gridWrap.classList.toggle("bm-omega-grid", N === 8);
    els.grid.className = "bm-grid sz" + N;
    setStatus("EXTRACTION " + (idx + 1) + "/3 · " + spec[4] + " · " + maxMistakes + " strike" + (maxMistakes === 1 ? "" : "s"), "ok");
    renderGrid(false);
    updateHUD();
    updateExtractBar();
    updateSectorPbLine();
    startTimer();
    playMusic();
    ROOT.classList.add("bm-mood-boss", "bm-extract-active");
    beep(520, 0.1, "triangle", 0.08);
  }

  function startExtraction() {
    if (!records.bonusUnlocked || extractionMode) return;
    ensureAudio();
    hideVictory();
    records.bonusUnlocked = false;
    saveRecords();
    updateWantedUI();
    dailyMode = false;
    omegaMode = false;
    arcadeMode = false;
    geniusMode = false;
    bonusNodeMode = false;
    extractionMode = true;
    extractionProgress = 0;
    pursuitHunterShown = false;
    score = score || 0;
    elapsedMs = elapsedMs || 0;
    startedAt = Date.now() - elapsedMs;
    applyMood();
    els.menu.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    setTimeout(function () { loadExtractionSector(0); }, 40);
  }

  function completeExtraction() {
    extractionMode = false;
    extractionProgress = 0;
    const loot = 3500;
    score += loot;
    records.wanted = 40;
    records.bonusUnlocked = false;
    records.extractions = (records.extractions || 0) + 1;
    saveRecords();
    playing = false;
    updateHUD();
    updateWantedUI();
    updateExtractBar();
    ROOT.classList.remove("bm-extract-active");
    if (els.extractOv && els.extractLoot) {
      els.extractLoot.textContent = "+" + loot + " LOOT · HEAT COOLED TO 40%";
      els.extractOv.classList.add("show");
      [440, 554, 659, 880].forEach(function (f, i) {
        setTimeout(function () { beep(f, 0.14, "triangle", 0.1); }, i * 100);
      });
      haptic([40, 30, 60, 30, 80]);
      setTimeout(function () { els.extractOv.classList.remove("show"); }, 3200);
    }
    setStatus("EXTRACTION COMPLETE · loot secured · NexCorp trace broken", "ok");
    pushRelayBoard({
      callsign: records.callsign || "GHOST",
      score: score,
      heat: records.wanted || 0,
      loadout: loadoutPerk || "chain",
      tag: "EXTRACTED",
      ts: Date.now()
    });
    notifyResize();
  }

  function extractionWin() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    won = true;
    playing = false;
    sectorGain = calcSectorScore();
    score += sectorGain;
    updateHUD();
    renderGrid(false);
    if (typeof burstClear === "function") burstClear();
    extractionProgress++;
    beep(660, 0.1, "triangle", 0.07);
    beep(880, 0.12, "square", 0.06);
    if (extractionProgress >= EXTRACT_SPECS.length) {
      setTimeout(completeExtraction, 450);
      return;
    }
    setTimeout(function () {
      won = false;
      loadExtractionSector(extractionProgress);
    }, 420);
  }

  function showHunterLine() {
    if (!els.hunterLine) return;
    const line = HUNTER_LINES[Math.floor(Math.random() * HUNTER_LINES.length)];
    if (els.hunterText) els.hunterText.textContent = line;
    els.hunterLine.classList.add("show");
    [90, 70, 110, 85, 120].forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.07, "sawtooth", 0.09); }, i * 140);
    });
    haptic([60, 30, 60]);
    setTimeout(function () { els.hunterLine.classList.remove("show"); }, 2600);
  }

  function pushRelayBoard(entry) {
    if (!entry || !entry.callsign) return;
    records.relayBoard = records.relayBoard || [];
    records.relayBoard.unshift(entry);
    const seen = {};
    records.relayBoard = records.relayBoard.filter(function (e) {
      const k = (e.callsign || "?").toUpperCase();
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).slice(0, 8);
    saveRecords();
    renderRelayBoard();
  }

  function renderRelayBoard() {
    if (!els.relayBoard) return;
    const rows = (records.relayBoard || []).slice(0, 5);
    if (!rows.length) {
      els.relayBoard.innerHTML = "<span class=\"bm-relay-empty\">SQUAD RELAY · share RELAY link to populate board</span>";
      return;
    }
    els.relayBoard.innerHTML = rows.map(function (e, i) {
      const cs = (e.callsign || "GHOST").toUpperCase();
      const tag = e.tag ? (" · " + e.tag) : "";
      return "<div class=\"bm-relay-row" + (i === 0 ? " bm-relay-top" : "") + "\">" +
        "<b>" + cs + "</b> · " + (e.score || 0) + " pts · HEAT " + (e.heat || 0) + "% · " +
        (e.loadout || "chain").toUpperCase() + tag + "</div>";
    }).join("");
  }

  function recordSelfRelay() {
    pushRelayBoard({
      callsign: records.callsign || "GHOST",
      score: score,
      heat: records.wanted || 0,
      loadout: loadoutPerk || "chain",
      tag: extractionMode ? "EXTRACTING" : (records.wanted >= 70 ? "HOT" : "RELAY"),
      ts: Date.now()
    });
  }

  var _onWinExtract = onWin;
  onWin = function () {
    if (extractionMode) {
      extractionWin();
      return;
    }
    _onWinExtract();
  };

  var _failOutExtract = failOut;
  failOut = function () {
    if (extractionMode) {
      extractionMode = false;
      extractionProgress = 0;
      records.wanted = Math.min(100, (records.wanted || 0) + 5);
      saveRecords();
      updateExtractBar();
      ROOT.classList.remove("bm-extract-active");
      setStatus("EXTRACTION FAILED — hunters boxed your node.", "err");
    }
    _failOutExtract();
  };

  var _updateWantedExtract = updateWantedUI;
  updateWantedUI = function () {
    _updateWantedExtract();
    if (els.wantedLabel && records.wanted >= 100 && records.bonusUnlocked) {
      els.wantedLabel.textContent = "WANTED · MAX · BONUS OR EXTRACT LIVE";
    }
    if (els.extractBtn) {
      if (records.bonusUnlocked && !extractionMode && !bonusNodeMode) {
        els.extractBtn.classList.remove("bm-hidden");
      } else {
        els.extractBtn.classList.add("bm-hidden");
      }
    }
    updateExtractBar();
  };

  var _showMenuExtract = showMenu;
  showMenu = function () {
    if (extractionMode) {
      extractionMode = false;
      extractionProgress = 0;
      ROOT.classList.remove("bm-extract-active");
    }
    _showMenuExtract();
    renderRelayBoard();
    updateBountyBoard();
  };

  var _loadGridExtract = loadGridSector;
  loadGridSector = function (freshRun) {
    if (freshRun && !extractionMode) pursuitHunterShown = false;
    _loadGridExtract(freshRun);
  };

  var _tickExtract = tick;
  tick = function () {
    _tickExtract();
    if (isPursuitActive() && !pursuitHunterShown && playing && !won) {
      pursuitHunterShown = true;
      showHunterLine();
    }
  };

  var _relayPayloadExtract = relayPayload;
  relayPayload = function () {
    try {
      const p = JSON.parse(_relayPayloadExtract());
      p.callsign = records.callsign || "GHOST";
      p.extractions = records.extractions || 0;
      return JSON.stringify(p);
    } catch (e) {
      return _relayPayloadExtract();
    }
  };

  var _shareRelayExtract = shareRelayLink;
  shareRelayLink = function () {
    recordSelfRelay();
    _shareRelayExtract();
  };

  var _tryLoadRelayExtract = tryLoadRelay;
  tryLoadRelay = function () {
    _tryLoadRelayExtract();
    try {
      const m = location.hash.match(/relay=([^&]+)/);
      if (!m) return;
      const s = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
      if (!s) return;
      pushRelayBoard({
        callsign: s.callsign || "SQUAD",
        score: s.score || 0,
        heat: s.wanted || 0,
        loadout: s.loadout || "chain",
        tag: "JOINED",
        ts: Date.now()
      });
    } catch (e) {}
  };

  if (els.extractBtn) els.extractBtn.addEventListener("click", startExtraction);
  if (els.extractOv) {
    els.extractOv.addEventListener("click", function () { els.extractOv.classList.remove("show"); });
  }

  renderRelayBoard();
  updateWantedUI();

// === BLACK MARKET SPRINT — credits, intel, contracts ===
  let intelBoostLeft = 0;
  let contractMode = false;
  let contractWeekDone = false;

  const CONTRACTS = [
    { spec: [6, 12, 2, 2], title: "PHANTOM LEDGER", lore: "NexCorp off-books node · numbers that never balance · find the ghost bit." },
    { spec: [4, 5, 3, 2], title: "SILK ROAD CACHE", lore: "Dead drop matrix · smugglers left a checksum · crack before customs sweep." },
    { spec: [6, 9, 2, 1], title: "ZERO-DAY VAULT", lore: "Unpatched sector · one strike · high clearance only · data worth millions." },
    { spec: [6, 11, 2, 2], title: "GHOST MARKET", lore: "Operators trade heat for hints here · this grid is the price list." },
    { spec: [4, 6, 3, 3], title: "BACKDOOR BAZAAR", lore: "Three strikes · generous clues · NexCorp thinks this node is offline." },
    { spec: [6, 10, 2, 2], title: "CRYPTO FORGE", lore: "Mint block pending · align the matrix or the chain rejects your key." }
  ];

  if (records.credits == null) {
    records.credits = (records.extractions || 0) * 800;
  }
  if (!records.contractWeek) records.contractWeek = 0;
  intelBoostLeft = records.intelBoostLeft || 0;

  Object.assign(els, {
    creditsHud: ROOT.querySelector("#bm-credits-hud"),
    creditsMenu: ROOT.querySelector("#bm-credits-menu"),
    blackMarket: ROOT.querySelector("#bm-blackmarket"),
    buyIntel: ROOT.querySelector("#bm-buy-intel"),
    heatIntel: ROOT.querySelector("#bm-heat-intel"),
    contractBtn: ROOT.querySelector("#bm-contract"),
    contractFlavor: ROOT.querySelector("#bm-contract-flavor"),
    marketBtn: ROOT.querySelector("#bm-market"),
    marketOv: ROOT.querySelector("#bm-market-ov"),
    contractIntro: ROOT.querySelector("#bm-contract-intro"),
    contractTitle: ROOT.querySelector("#bm-contract-title"),
    contractLore: ROOT.querySelector("#bm-contract-lore"),
    contractArt: ROOT.querySelector("#bm-contract-art")
  });

  function weekKey() {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    return d.getFullYear() * 100 + Math.floor((d - start) / 604800000);
  }

  function currentContract() {
    const wk = weekKey();
    const c = CONTRACTS[wk % CONTRACTS.length];
    return { week: wk, spec: c.spec, title: c.title, lore: c.lore };
  }

  function contractDoneThisWeek() {
    return records.contractWeek === weekKey();
  }

  function spendCredits(n) {
    n = Math.max(0, Math.round(n));
    if ((records.credits || 0) < n) return false;
    records.credits -= n;
    saveRecords();
    updateCreditsUI();
    return true;
  }

  function addCredits(n) {
    records.credits = (records.credits || 0) + Math.max(0, Math.round(n));
    saveRecords();
    updateCreditsUI();
  }

  function updateCreditsUI() {
    const cr = records.credits || 0;
    const txt = cr + " CR";
    if (els.creditsHud) els.creditsHud.textContent = "◈ " + txt;
    if (els.creditsMenu) els.creditsMenu.textContent = txt;
    const marketCr = ROOT.querySelector("#bm-credits-market");
    if (marketCr) marketCr.textContent = txt;
    if (els.buyIntel) els.buyIntel.disabled = cr < 300;
    if (els.heatIntel) {
      els.heatIntel.disabled = (records.wanted || 0) < 25;
    }
    if (els.contractBtn) {
      els.contractBtn.disabled = contractDoneThisWeek();
      els.contractBtn.textContent = contractDoneThisWeek() ? "CONTRACT · DONE THIS WEEK" : "WEEKLY CONTRACT · +600 CR";
    }
    updateContractFlavor();
    bindMarketOverlay();
  }

  function updateContractFlavor() {
    if (!els.contractFlavor) return;
    const c = currentContract();
    els.contractFlavor.textContent = "CONTRACT · " + c.title + " · " + c.lore;
  }

  function grantIntel(source) {
    intelBoostLeft += 1;
    records.intelBoostLeft = intelBoostLeft;
    saveRecords();
    setStatus(source + " · ghost intel active next " + intelBoostLeft + " sector(s)", "ok");
    beep(880, 0.08, "sine", 0.08);
    haptic(25);
    if (els.marketOv) els.marketOv.classList.remove("show");
  }

  function buyIntelCache() {
    if (!spendCredits(300)) {
      setStatus("Need 300 CR · extract loot or clear contracts.", "err");
      return;
    }
    grantIntel("INTEL CACHE purchased");
  }

  function tradeHeatForIntel() {
    if ((records.wanted || 0) < 25) {
      setStatus("Need 25%+ heat to trade for intel.", "err");
      return;
    }
    records.wanted = Math.max(0, (records.wanted || 0) - 25);
    if (records.wanted < 100) records.bonusUnlocked = false;
    saveRecords();
    updateWantedUI();
    grantIntel("HEAT traded for intel");
  }

  function swapLoadoutRuntime(perk) {
    if (!playing || paused || won || geniusMode || dailyMode || arcadeMode || contractMode) return;
    if (!spendCredits(400)) {
      setStatus("SWAP costs 400 CR · hit MARKET after exfil.", "err");
      return;
    }
    loadoutPerk = perk;
    records.loadout = perk;
    saveRecords();
    if (els.loadoutRoot) {
      els.loadoutRoot.querySelectorAll(".bm-loadout-btn").forEach(function (b) {
        b.classList.toggle("selected", b.dataset.loadout === perk);
      });
    }
    updatePingBtn();
    setStatus("BLACK MARKET · loadout swapped to " + perk.toUpperCase() + " this run", "ok");
    beep(640, 0.06, "square", 0.06);
    if (els.marketOv) els.marketOv.classList.remove("show");
  }

  function canUseMarket() {
    return playing && !paused && !won && !geniusMode && !dailyMode && !arcadeMode && !omegaMode && !extractionMode && !bonusNodeMode;
  }

  function openMarket() {
    if (!canUseMarket()) return;
    if (!els.marketOv) return;
    updateCreditsUI();
    els.marketOv.classList.add("show");
    beep(520, 0.05, "triangle", 0.05);
  }

  function bindMarketOverlay() {
    if (!els.marketOv || els.marketOv.dataset.bound) return;
    els.marketOv.dataset.bound = "1";
    els.marketOv.querySelectorAll("[data-bm-swap]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        swapLoadoutRuntime(btn.dataset.bmSwap || "chain");
      });
    });
    const intelBtn = els.marketOv.querySelector("#bm-market-intel");
    if (intelBtn) intelBtn.addEventListener("click", buyIntelCache);
    const closeBtn = els.marketOv.querySelector("#bm-market-close");
    if (closeBtn) closeBtn.addEventListener("click", function () { els.marketOv.classList.remove("show"); });
  }

  function showContractIntro(c, done) {
    if (!els.contractIntro) { if (done) done(); return; }
    if (els.contractTitle) els.contractTitle.textContent = c.title;
    if (els.contractLore) els.contractLore.textContent = c.lore;
    if (els.contractArt) {
      const glyphs = "◈010◈110◈001◈";
      els.contractArt.textContent = glyphs.repeat(8);
    }
    ROOT.classList.add("bm-mood-contract");
    els.contractIntro.classList.add("show");
    beep(220, 0.2, "triangle", 0.1);
    setTimeout(function () { beep(330, 0.15, "triangle", 0.08); }, 180);
    haptic([40, 20, 40]);
    setTimeout(function () {
      els.contractIntro.classList.remove("show");
      if (done) done();
    }, 3200);
  }

  function loadContractNode() {
    const c = currentContract();
    const spec = c.spec.concat([c.title + " · WEEKLY CONTRACT"]);
    const pack = newPuzzleFromSpec(spec);
    solution = pack.solution;
    puzzle = pack.puzzle;
    given = pack.given;
    grid = clone(puzzle);
    N = spec[0];
    HALF = N / 2;
    playing = false;
    paused = false;
    won = false;
    mistakes = 0;
    maxMistakes = spec[3];
    sectorClock = Date.now();
    sectorStartedAt = Date.now();
    sectorMistakesAtStart = 0;
    score = score || 0;
    elapsedMs = elapsedMs || 0;
    startedAt = Date.now() - elapsedMs;
    if (els.gridWrap) els.gridWrap.classList.toggle("bm-omega-grid", N === 8);
    els.grid.className = "bm-grid sz" + N;
    renderGrid(false);
    updateHUD();
    showContractIntro(c, function () {
      playing = true;
      setStatus("CONTRACT · " + c.title + " · +" + (600 + 900) + " CR/score on clear", "ok");
      startTimer();
      playMusic();
    });
  }

  function startWeeklyContract() {
    if (contractDoneThisWeek() || contractMode) return;
    ensureAudio();
    hideVictory();
    contractMode = true;
    dailyMode = false;
    omegaMode = false;
    arcadeMode = false;
    geniusMode = false;
    bonusNodeMode = false;
    extractionMode = false;
    applyMood();
    ROOT.classList.add("bm-mood-contract");
    els.menu.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    setTimeout(loadContractNode, 40);
  }

  function completeContract() {
    contractMode = false;
    records.contractWeek = weekKey();
    const scoreBonus = 900;
    const creditBonus = 600;
    score += scoreBonus;
    addCredits(creditBonus);
    saveRecords();
    playing = false;
    updateHUD();
    ROOT.classList.remove("bm-mood-contract");
    setStatus("CONTRACT CLEARED · +" + scoreBonus + " score · +" + creditBonus + " CR", "ok");
    [523, 659, 784].forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.12, "triangle", 0.09); }, i * 90);
    });
    haptic([30, 30, 50]);
    showMenu();
  }

  function contractWin() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    won = true;
    playing = false;
    sectorGain = calcSectorScore();
    score += sectorGain;
    updateHUD();
    renderGrid(false);
    setTimeout(completeContract, 500);
  }

  function useIntelBoostAfterSector() {
    if (intelBoostLeft > 0) {
      intelBoostLeft--;
      records.intelBoostLeft = intelBoostLeft;
      saveRecords();
    }
  }

  var _onWinMarket = onWin;
  onWin = function () {
    if (contractMode) {
      contractWin();
      return;
    }
    _onWinMarket();
    if (!won) return;
    if (!dailyMode && !arcadeMode && !geniusMode && !extractionMode && !bonusNodeMode) {
      addCredits(25);
    }
    useIntelBoostAfterSector();
  };

  var _completeExtractMarket = completeExtraction;
  completeExtraction = function () {
    addCredits(800);
    _completeExtractMarket();
  };

  var _renderGridMarket = renderGrid;
  renderGrid = function (flashBad) {
    _renderGridMarket(flashBad);
    if (!els.grid || intelBoostLeft <= 0 || !playing) return;
    els.grid.querySelectorAll("td.bm-ghost-hint").forEach(function (td) {
      td.classList.add("bm-ghost-bright");
    });
  };

  var _loadGridMarket = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridMarket(freshRun);
    setTimeout(function () {
      if (intelBoostLeft > 0 && els.sectorPb) {
        const extra = els.sectorPb.textContent;
        els.sectorPb.textContent = (extra ? extra + " · " : "") + "INTEL BOOST · bright ghosts";
      }
      renderGrid(false);
    }, 65);
  };

  var _showMenuMarket = showMenu;
  showMenu = function () {
    contractMode = false;
    ROOT.classList.remove("bm-mood-contract");
    if (els.marketOv) els.marketOv.classList.remove("show");
    _showMenuMarket();
    updateCreditsUI();
    renderRelayBoard();
  };

  var _updateBountyMarket = updateBountyBoard;
  updateBountyBoard = function () {
    if (!els.bountyBoard) { _updateBountyMarket(); return; }
    const w = records.wanted || 0;
    const perk = (loadoutPerk || "chain").toUpperCase();
    let line = "BOUNTY BOARD · HEAT " + w + "% · LOADOUT " + perk + " · ◈ " + (records.credits || 0) + " CR";
    if (w >= 70) line += " · PURSUIT ACTIVE";
    if (records.bonusUnlocked) line += " · BONUS LIVE";
    els.bountyBoard.textContent = line;
  };

  var _failOutMarket = failOut;
  failOut = function () {
    if (contractMode) {
      contractMode = false;
      ROOT.classList.remove("bm-mood-contract");
      setStatus("CONTRACT FAILED · NexCorp seized the node.", "err");
    }
    _failOutMarket();
  };

  if (els.buyIntel) els.buyIntel.addEventListener("click", buyIntelCache);
  if (els.heatIntel) els.heatIntel.addEventListener("click", tradeHeatForIntel);
  if (els.contractBtn) els.contractBtn.addEventListener("click", startWeeklyContract);
  if (els.marketBtn) els.marketBtn.addEventListener("click", openMarket);

  bindMarketOverlay();
  updateCreditsUI();

// === SYNDICATE SPRINT — rank, crew, ghost bets, rivals ===
  let ghostBetActive = false;
  let ghostBetWager = 0;
  let activeRival = null;

  if (!records.syndicateCrew) records.syndicateCrew = "ghosts";
  if (!records.maxHeat) records.maxHeat = 0;
  if (!records.contractsTotal) records.contractsTotal = 0;

  Object.assign(els, {
    syndicateRank: ROOT.querySelector("#bm-syndicate-rank"),
    syndicateCrew: ROOT.querySelector("#bm-syndicate-crew"),
    ghostBetBtn: ROOT.querySelector("#bm-ghost-bet")
  });

  const CREW_PERKS = {
    hunters: { label: "HUNTERS", heat: 1.1, cr: 1.15, desc: "+10% heat · +15% CR" },
    ghosts: { label: "GHOSTS", heat: 1, cr: 1, desc: "Rival ghost race always on" },
    mercs: { label: "MERCS", heat: 1, cr: 1, strike: 1, desc: "+1 strike each sector" }
  };

  function syndicatePoints() {
    const ex = records.extractions || 0;
    const ct = records.contractsTotal || 0;
    const mh = records.maxHeat || 0;
    const cr = records.credits || 0;
    return ex * 12 + ct * 8 + Math.floor(mh / 10) + Math.floor(cr / 250) + (records.relayBoard || []).length * 2;
  }

  function computeSyndicateRank() {
    const p = syndicatePoints();
    const ex = records.extractions || 0;
    if (ex >= 3 && p >= 55 && (records.maxHeat || 0) >= 100) return "KINGPIN";
    if (ex >= 2 || p >= 38) return "PHANTOM";
    if (ex >= 1 || (records.contractsTotal || 0) >= 1 || p >= 22) return "FIXER";
    if (p >= 8) return "RUNNER";
    return "RECRUIT";
  }

  function crewKey() {
    return CREW_PERKS[records.syndicateCrew] ? records.syndicateCrew : "ghosts";
  }

  function updateSyndicateUI() {
    const rank = computeSyndicateRank();
    if (els.syndicateRank) {
      els.syndicateRank.textContent = "SYNDICATE · " + rank + " · " + syndicatePoints() + " REP";
    }
    if (els.rank) els.rank.textContent = "RANK · " + computeRank() + " · " + rank;
    if (els.syndicateCrew) {
      els.syndicateCrew.querySelectorAll(".bm-crew-btn").forEach(function (btn) {
        btn.classList.toggle("selected", btn.dataset.crew === crewKey());
      });
    }
    if (els.ghostBetBtn) {
      const ghost = typeof ghostPbMs === "function" ? ghostPbMs() : null;
      els.ghostBetBtn.disabled = !playing || paused || won || ghostBetActive || !ghost || geniusMode || dailyMode;
      els.ghostBetBtn.textContent = ghostBetActive
        ? ("BET LIVE · " + ghostBetWager + " CR")
        : "GHOST BET · 200 CR";
    }
  }

  function bindSyndicateCrew() {
    if (!els.syndicateCrew || els.syndicateCrew.dataset.bound) return;
    els.syndicateCrew.dataset.bound = "1";
    els.syndicateCrew.querySelectorAll(".bm-crew-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        records.syndicateCrew = btn.dataset.crew || "ghosts";
        saveRecords();
        updateSyndicateUI();
        beep(600, 0.05, "square", 0.05);
      });
    });
  }

  function pickRivalEcho() {
    const board = (records.relayBoard || []).filter(function (e) {
      return e && e.callsign && (e.callsign || "").toUpperCase() !== (records.callsign || "").toUpperCase();
    });
    if (!board.length) return null;
    return board[Math.floor(Math.random() * board.length)];
  }

  function rivalGhostMs() {
    if (!activeRival) return null;
    const base = typeof ghostPbMs === "function" ? ghostPbMs() : null;
    if (!base) return null;
    const jitter = ((activeRival.score || 0) % 17) - 8;
    return Math.max(4000, base + jitter * 1000);
  }

  function placeGhostBet() {
    if (ghostBetActive || !playing || paused || won) return;
    const ghost = typeof ghostPbMs === "function" ? ghostPbMs() : null;
    if (!ghost) {
      setStatus("Set a sector PB before betting.", "err");
      return;
    }
    if (typeof spendCredits !== "function" || !spendCredits(200)) {
      setStatus("Need 200 CR for ghost bet.", "err");
      return;
    }
    ghostBetActive = true;
    ghostBetWager = 200;
    activeRival = pickRivalEcho();
    updateSyndicateUI();
    setStatus("Ghost bet live · beat PB under trace · 2× CR payout", "ok");
    beep(740, 0.07, "triangle", 0.07);
  }

  function resolveGhostBet() {
    if (!ghostBetActive) return;
    const ghost = typeof ghostPbMs === "function" ? ghostPbMs() : null;
    const elapsed = Date.now() - sectorStartedAt;
    const target = rivalGhostMs() || ghost;
    ghostBetActive = false;
    if (target && elapsed <= target) {
      const win = ghostBetWager * 2;
      if (typeof addCredits === "function") addCredits(win);
      setStatus("Ghost bet WON · +" + win + " CR · syndicate pays", "ok");
      beep(880, 0.1, "triangle", 0.09);
    } else {
      setStatus("Ghost bet LOST · rival held the line", "err");
      beep(180, 0.12, "sawtooth", 0.08);
    }
    ghostBetWager = 0;
    activeRival = null;
    updateSyndicateUI();
  }

  var _addWantedSyn = addWanted;
  addWanted = function (amt) {
    const crew = CREW_PERKS[crewKey()];
    _addWantedSyn(Math.round(amt * (crew.heat || 1)));
    records.maxHeat = Math.max(records.maxHeat || 0, records.wanted || 0);
    saveRecords();
    updateSyndicateUI();
  };

  var _onWinSyn = onWin;
  onWin = function () {
    _onWinSyn();
    if (!won) return;
    const crew = CREW_PERKS[crewKey()];
    if (crew.cr > 1 && typeof addCredits === "function" && !dailyMode && !arcadeMode) {
      addCredits(Math.floor(25 * (crew.cr - 1)));
    }
    resolveGhostBet();
    updateSyndicateUI();
  };

  var _loadGridSyn = loadGridSector;
  loadGridSector = function (freshRun) {
    ghostBetActive = false;
    ghostBetWager = 0;
    activeRival = pickRivalEcho();
    _loadGridSyn(freshRun);
    setTimeout(function () {
      const crew = CREW_PERKS[crewKey()];
      if (crew.strike && playing && !geniusMode && !dailyMode && !arcadeMode && !extractionMode && !contractMode) {
        maxMistakes += crew.strike;
        updateHUD();
      }
      updateSyndicateUI();
    }, 70);
  };

  var _updateGhostSyn = updateGhostRace;
  updateGhostRace = function () {
    if (crewKey() === "ghosts" && playing && !paused && !won && !geniusMode && !dailyMode) {
      const rival = activeRival || pickRivalEcho();
      if (rival && els.ghostRace && !(typeof ghostPbMs === "function" && ghostPbMs())) {
        els.ghostRace.hidden = false;
        if (els.ghostLabel) {
          els.ghostLabel.textContent = "RIVAL " + (rival.callsign || "ECHO") + " · syndicate echo";
        }
        if (els.ghostFill) els.ghostFill.style.width = Math.min(100, (Date.now() - sectorStartedAt) / 90000 * 100) + "%";
        return;
      }
    }
    _updateGhostSyn();
    if (activeRival && els.ghostLabel && playing && typeof ghostPbMs === "function" && ghostPbMs()) {
      const line = els.ghostLabel.textContent || "";
      if (line.indexOf("RIVAL") < 0) {
        els.ghostLabel.textContent = "RIVAL " + (activeRival.callsign || "ECHO") + " · " + line;
      }
    }
  };

  var _showMenuSyn = showMenu;
  showMenu = function () {
    _showMenuSyn();
    updateSyndicateUI();
    bindSyndicateCrew();
  };

  var _completeContractSyn = completeContract;
  completeContract = function () {
    records.contractsTotal = (records.contractsTotal || 0) + 1;
    saveRecords();
    _completeContractSyn();
    updateSyndicateUI();
  };

  if (els.ghostBetBtn) els.ghostBetBtn.addEventListener("click", placeGhostBet);
  bindSyndicateCrew();
  updateSyndicateUI();

// === DEEP NET SPRINT — side door, ISA, archive, probe tokens ===
  let sideDoorMode = false;

  if (!records.isaFragments) records.isaFragments = [];
  if (!records.nexArchive) records.nexArchive = [];
  if (!records.probeTokens) records.probeTokens = 0;
  if (!records.sideDoorDay) records.sideDoorDay = 0;

  const ISA_DROPS = [
    "FRAG · JMP rel16 patches trace routes.",
    "FRAG · XOR leak gates echo your fingerprint.",
    "FRAG · Prefix score leaks one byte at a time.",
    "FRAG · Side doors open above 70% heat only."
  ];

  Object.assign(els, {
    deepNetBtn: ROOT.querySelector("#bm-deep-net"),
    archiveLog: ROOT.querySelector("#bm-archive-log"),
    sideDoorBar: ROOT.querySelector("#bm-side-door-bar")
  });

  function appendArchive(line) {
    records.nexArchive = records.nexArchive || [];
    records.nexArchive.unshift({ t: Date.now(), line: line });
    records.nexArchive = records.nexArchive.slice(0, 12);
    saveRecords();
    renderArchiveLog();
  }

  function addIsaFragment(label) {
    const frag = ISA_DROPS[(records.isaFragments.length + dateSeed()) % ISA_DROPS.length];
    records.isaFragments.push(label + " · " + frag);
    records.isaFragments = records.isaFragments.slice(-8);
    saveRecords();
    appendArchive("ISA UNLOCK · " + frag);
    renderArchiveLog();
  }

  function renderArchiveLog() {
    if (!els.archiveLog) return;
    const rows = records.nexArchive || [];
    if (!rows.length) {
      els.archiveLog.innerHTML = "<span class=\"bm-archive-empty\">NEXCORP ARCHIVE · crack nodes to leak files</span>";
      return;
    }
    els.archiveLog.innerHTML = rows.map(function (e) {
      return "<div class=\"bm-archive-row\">" + e.line + "</div>";
    }).join("");
  }

  function sideDoorAvailable() {
    return (records.wanted || 0) >= 70 && records.sideDoorDay !== dateSeed() && !sideDoorMode;
  }

  function updateDeepNetUI() {
    if (els.deepNetBtn) {
      if (sideDoorAvailable()) els.deepNetBtn.classList.remove("bm-hidden");
      else els.deepNetBtn.classList.add("bm-hidden");
      if (records.sideDoorDay === dateSeed()) {
        els.deepNetBtn.textContent = "DEEP NET · SIDE DOOR USED TODAY";
        els.deepNetBtn.disabled = true;
      } else {
        els.deepNetBtn.textContent = "DEEP NET · SIDE DOOR · 1 CPU GATE";
        els.deepNetBtn.disabled = (records.wanted || 0) < 70;
      }
    }
    if (els.sideDoorBar) els.sideDoorBar.hidden = !sideDoorMode;
    renderArchiveLog();
  }

  function startSideDoor() {
    if (!sideDoorAvailable()) return;
    ensureAudio();
    sideDoorMode = true;
    geniusMode = true;
    playing = true;
    paused = false;
    won = false;
    mistakes = 0;
    maxMistakes = 1;
    vmProbes = 0;
    vmLevel = 0;
    vmSecrets = [];
    vmChallenges = [buildGeniusChallenges()[2]];
    elapsedMs = 0;
    startedAt = Date.now();
    applyMood();
    ROOT.classList.add("bm-mood-deepnet");
    els.menu.classList.add("bm-hidden");
    els.play.classList.add("bm-hidden");
    els.genius.classList.remove("bm-hidden");
    if (els.progressWrap) els.progressWrap.hidden = true;
    if (els.vmBrief) els.vmBrief.textContent = "DEEP NET SIDE DOOR · 1 gate · 1 strike · heat trace active";
    if (els.kernelLorePanel && records.isaFragments.length) {
      els.kernelLorePanel.innerHTML = "<b>ISA FRAGMENTS</b> · " + records.isaFragments.slice(-2).join(" · ");
      els.kernelLorePanel.classList.remove("bm-hidden");
    }
    loadVmLevel();
    startTimer();
    playMusic();
    updateDeepNetUI();
    appendArchive("SIDE DOOR JACK-IN · heat " + (records.wanted || 0) + "%");
    setStatus("Deep Net side door · crack one NX-8 gate", "ok");
    notifyParent(true);
    beep(660, 0.12, "triangle", 0.08);
  }

  function finishSideDoor() {
    sideDoorMode = false;
    geniusMode = false;
    records.sideDoorDay = dateSeed();
    records.probeTokens = (records.probeTokens || 0) + 1;
    addIsaFragment("SIDE DOOR");
    if (typeof addCredits === "function") addCredits(250);
    saveRecords();
    ROOT.classList.remove("bm-mood-deepnet");
    els.genius.classList.add("bm-hidden");
    playing = false;
    appendArchive("SIDE DOOR CLEARED · probe token acquired");
    setStatus("Side door cleared · +250 CR · probe token · ISA fragment logged", "ok");
    updateDeepNetUI();
    showMenu();
  }

  var _geniusWinDeep = geniusWin;
  geniusWin = function () {
    if (sideDoorMode) {
      finishSideDoor();
      return;
    }
    _geniusWinDeep();
  };

  var _geniusFailDeep = geniusFailStrike;
  geniusFailStrike = function (why) {
    if (sideDoorMode) {
      sideDoorMode = false;
      geniusMode = false;
      ROOT.classList.remove("bm-mood-deepnet");
      els.genius.classList.add("bm-hidden");
      playing = false;
      appendArchive("SIDE DOOR FAILED · " + why);
      setStatus("Side door collapsed · hunters sealed the gate.", "err");
      showMenu();
      return;
    }
    _geniusFailDeep(why);
  };

  var _runProbeDeep = runProbe;
  runProbe = function () {
    if (records.probeTokens > 0 && geniusMode && sideDoorMode) {
      records.probeTokens--;
      saveRecords();
      appendArchive("PROBE TOKEN SPENT · free trace");
    }
    _runProbeDeep();
  };

  var _completeContractDeep = completeContract;
  completeContract = function () {
    addIsaFragment(typeof currentContract === "function" ? currentContract().title : "CONTRACT");
    records.probeTokens = (records.probeTokens || 0) + 1;
    saveRecords();
    _completeContractDeep();
    updateDeepNetUI();
  };

  var _onWinDeep = onWin;
  onWin = function () {
    _onWinDeep();
    if (!won) return;
    if (!dailyMode && !arcadeMode && !geniusMode && gridLevel === 0) {
      appendArchive("NODE BREACH · " + (difficulty || "link").toUpperCase() + " sector logged");
    }
  };

  var _showMenuDeep = showMenu;
  showMenu = function () {
    sideDoorMode = false;
    ROOT.classList.remove("bm-mood-deepnet");
    _showMenuDeep();
    updateDeepNetUI();
  };

  var _updateWantedDeep = updateWantedUI;
  updateWantedUI = function () {
    _updateWantedDeep();
    updateDeepNetUI();
  };

  if (els.deepNetBtn) els.deepNetBtn.addEventListener("click", startSideDoor);
  updateDeepNetUI();

// === HUNTER AI SPRINT — adaptive trace, decoys, counter-intel ===
  let hunterPressure = 0;
  let hunterFreezeLeft = 0;
  let decoyCell = null;
  let sectorMistakeCount = 0;

  const HUNTER_CALLOUTS = {
    chain: "Chain runner detected · cutting your multiplier lane.",
    ping: "Ping spammer · locking hint relays.",
    strike: "Tank build · hunters stacking strikes on you.",
    heat: "Heat dealer · NexCorp wants you alive for bait."
  };

  Object.assign(els, {
    hunterStatus: ROOT.querySelector("#bm-hunter-status")
  });

  function hunterActiveNow() {
    if (hunterFreezeLeft > 0) return false;
    return typeof isPursuitActive === "function" && isPursuitActive();
  }

  function updateHunterStatus() {
    if (!els.hunterStatus) return;
    if (hunterFreezeLeft > 0) {
      els.hunterStatus.textContent = "COUNTER-INTEL · hunter frozen " + hunterFreezeLeft + " sector(s)";
      els.hunterStatus.hidden = false;
      return;
    }
    if (!hunterActiveNow()) {
      els.hunterStatus.hidden = true;
      return;
    }
    els.hunterStatus.hidden = false;
    els.hunterStatus.textContent = "HUNTER AI · pressure " + hunterPressure + " · adapts to mistakes";
  }

  function plantDecoyNode() {
    decoyCell = null;
    if ((records.wanted || 0) < 80 || !playing || !grid) return;
    if (dailyMode || arcadeMode || geniusMode || contractMode || extractionMode) return;
    const opts = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!given[r][c] && grid[r][c] === -1) opts.push([r, c]);
    }
    if (!opts.length) return;
    decoyCell = opts[Math.floor(Math.random() * opts.length)];
  }

  function showHunterCallout() {
    const perk = (loadoutPerk || "chain").toLowerCase();
    const line = HUNTER_CALLOUTS[perk] || HUNTER_CALLOUTS.chain;
    if (els.hunterText) els.hunterText.textContent = line;
  }

  var _showHunterAI = showHunterLine;
  showHunterLine = function () {
    showHunterCallout();
    _showHunterAI();
  };

  var _pursuitLimit = pursuitLimitMs;
  pursuitLimitMs = function () {
    let base = _pursuitLimit();
    if (hunterActiveNow()) {
      base = Math.floor(base * (1 - Math.min(0.35, hunterPressure * 0.07)));
    }
    return Math.max(8000, base);
  };

  var _isPursuitHunter = isPursuitActive;
  isPursuitActive = function () {
    if (hunterFreezeLeft > 0) return false;
    return _isPursuitHunter();
  };

  function buyCounterIntel() {
    if (typeof spendCredits !== "function" || !spendCredits(250)) {
      setStatus("Counter-intel costs 250 CR.", "err");
      return;
    }
    hunterFreezeLeft += 1;
    hunterPressure = Math.max(0, hunterPressure - 1);
    setStatus("Counter-intel deployed · hunter frozen next sector", "ok");
    if (els.marketOv) els.marketOv.classList.remove("show");
    updateHunterStatus();
    beep(520, 0.08, "triangle", 0.08);
  }

  var _checkHunter = checkBoard;
  checkBoard = function () {
    const m0 = mistakes;
    _checkHunter();
    if (mistakes > m0 && hunterActiveNow()) {
      hunterPressure = Math.min(5, hunterPressure + 1);
      sectorMistakeCount++;
      updateHunterStatus();
    }
  };

  var _cellClickHunter = cellClick;
  cellClick = function (e) {
    const td = e.target.closest("td");
    _cellClickHunter(e);
    if (!decoyCell || !td || !playing || paused || won) return;
    const r = decoyCell[0], c = decoyCell[1];
    if (+td.dataset.r !== r || +td.dataset.c !== c) return;
    if (given[r][c]) return;
    if (grid[r][c] !== -1) {
      grid[r][c] = -1;
      decoyCell = null;
      if (typeof addWanted === "function") addWanted(8);
      setStatus("FALSE NODE · NexCorp honeypot · heat spike", "err");
      beep(100, 0.15, "sawtooth", 0.12);
      haptic([60, 30, 60]);
      renderGrid(true);
    }
  };

  var _renderGridHunter = renderGrid;
  renderGrid = function (flashBad) {
    _renderGridHunter(flashBad);
    if (!decoyCell || !els.grid) return;
    const td = els.grid.querySelector('td[data-r="' + decoyCell[0] + '"][data-c="' + decoyCell[1] + '"]');
    if (td && grid[decoyCell[0]][decoyCell[1]] === -1) td.classList.add("bm-decoy");
  };

  var _loadGridHunter = loadGridSector;
  loadGridSector = function (freshRun) {
    sectorMistakeCount = 0;
    if (hunterFreezeLeft > 0) hunterFreezeLeft--;
    _loadGridHunter(freshRun);
    setTimeout(function () {
      plantDecoyNode();
      updateHunterStatus();
    }, 75);
  };

  var _failOutHunter = failOut;
  failOut = function () {
    hunterPressure = Math.min(5, hunterPressure + 1);
    decoyCell = null;
    _failOutHunter();
    updateHunterStatus();
  };

  var _onWinHunter = onWin;
  onWin = function () {
    _onWinHunter();
    if (won) {
      hunterPressure = Math.max(0, hunterPressure - 1);
      decoyCell = null;
      updateHunterStatus();
    }
  };

  var _tickHunter = tick;
  tick = function () {
    _tickHunter();
    updateHunterStatus();
  };

  var _bindMarketHunter = bindMarketOverlay;
  bindMarketOverlay = function () {
    _bindMarketHunter();
    const btn = ROOT.querySelector("#bm-market-freeze");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", buyCounterIntel);
    }
  };

  bindMarketOverlay();
  updateHunterStatus();

// === SIGNAL WAR SPRINT — audio layers, rain, stingers, fast boot ===
  let signalOsc = null;
  let signalGain = null;
  let signalMood = "calm";
  let lastRainMul = 1;
  let rankStingerPlaying = false;

  if (records.fastBoot == null) records.fastBoot = false;

  Object.assign(els, {
    fastBootToggle: ROOT.querySelector("#bm-fast-boot")
  });

  function getSignalMood() {
    if (typeof contractMode !== "undefined" && contractMode) return "contract";
    if (ROOT.classList.contains("bm-mood-contract")) return "contract";
    if (ROOT.classList.contains("bm-mood-boss") || ROOT.classList.contains("bm-extract-active")) return "boss";
    if (typeof isPursuitActive === "function" && isPursuitActive()) return "pursuit";
    if (ROOT.classList.contains("bm-mood-deepnet")) return "pursuit";
    return "calm";
  }

  function stopSignalLayer() {
    if (!signalOsc) return;
    try { signalOsc.stop(); } catch (e) {}
    signalOsc.disconnect();
    signalGain.disconnect();
    signalOsc = null;
    signalGain = null;
  }

  function syncSignalWar() {
    if (muted || !musicVol || REDUCED_MOTION || !playing) {
      stopSignalLayer();
      return;
    }
    const mood = getSignalMood();
    if (mood === signalMood && signalOsc) return;
    signalMood = mood;
    stopSignalLayer();
    if (mood === "calm") return;
    ensureAudio();
    const freqs = { pursuit: 108, boss: 72, contract: 138 };
    const vols = { pursuit: 0.04, boss: 0.055, contract: 0.045 };
    signalOsc = audioCtx.createOscillator();
    signalGain = audioCtx.createGain();
    signalOsc.type = mood === "boss" ? "sawtooth" : "triangle";
    signalOsc.frequency.value = freqs[mood] || 100;
    signalGain.gain.value = musicVol * (vols[mood] || 0.04);
    signalOsc.connect(signalGain);
    signalGain.connect(audioCtx.destination);
    signalOsc.start();
    ROOT.classList.toggle("bm-signal-pursuit", mood === "pursuit");
    ROOT.classList.toggle("bm-signal-boss", mood === "boss");
    ROOT.classList.toggle("bm-signal-contract", mood === "contract");
  }

  function playRankStinger(rankName) {
    if (rankStingerPlaying || muted) return;
    rankStingerPlaying = true;
    const r = (rankName || "").toUpperCase();
    let seq = [523, 659, 784];
    if (r.indexOf("GHOST") >= 0 || r.indexOf("PHANTOM") >= 0) seq = [440, 554, 659, 880];
    if (r.indexOf("OMEGA") >= 0 || r.indexOf("KINGPIN") >= 0) seq = [330, 415, 523, 659, 880, 1046];
    if (r.indexOf("OPERATOR") >= 0 || r.indexOf("FIXER") >= 0) seq = [494, 587, 698];
    seq.forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.16, "triangle", 0.11); }, i * 100);
    });
    setTimeout(function () { rankStingerPlaying = false; }, seq.length * 100 + 200);
  }

  var _drawRainSignal = drawRain;
  drawRain = function () {
    if (REDUCED_MOTION) return;
    const left = playing && !won ? Math.max(0, maxMistakes - mistakes) : maxMistakes;
    const mul = playing && !won ? 1 + (maxMistakes - left) * 0.2 : 1;
    for (let i = 0; i < speeds.length; i++) {
      speeds[i] /= lastRainMul;
      speeds[i] *= mul;
    }
    lastRainMul = mul;
    if (left <= 1 && playing) {
      rainHue = "#ff6b81";
      rainBright = "#ff3355";
    } else if (typeof applyMood === "function" && !ROOT.classList.contains("bm-mood-boss")) {
      applyMood();
    }
    _drawRainSignal();
  };

  var _showRankUpSignal = showRankUp;
  showRankUp = function (newRank) {
    _showRankUpSignal(newRank);
    playRankStinger(newRank);
    if (typeof computeSyndicateRank === "function") {
      setTimeout(function () { playRankStinger(computeSyndicateRank()); }, 450);
    }
  };

  var _runBootSignal = runBoot;
  runBoot = function (cb) {
    records.bootVisits = (records.bootVisits || 0) + 1;
    const veteran = records.fastBoot || records.bootVisits > 2 ||
      (records.clears && (records.clears.medium || records.clears.hard)) ||
      (typeof computeSyndicateRank === "function" && computeSyndicateRank() !== "RECRUIT");
    if (veteran && els.boot && els.bootLog) {
      els.menu.classList.add("bm-hidden");
      els.boot.classList.add("show");
      els.bootLog.textContent = "";
      const lines = [
        "NEXCORP UPLINK · VETERAN CHANNEL",
        "Operator " + (records.callsign || "GHOST") + " authenticated.",
        "> JACK IN READY_"
      ];
      lines.forEach(function (t) {
        const span = document.createElement("span");
        span.className = "hi";
        span.textContent = t + "\n";
        els.bootLog.appendChild(span);
      });
      beep(880, 0.06, "square", 0.06);
      setTimeout(function () {
        bootDone = true;
        els.boot.classList.remove("show");
        if (els.menu) els.menu.classList.remove("bm-hidden");
        cb();
      }, 700);
      return;
    }
    _runBootSignal(cb);
  };

  var _tickSignal = tick;
  tick = function () {
    _tickSignal();
    syncSignalWar();
  };

  var _stopMusicSignal = stopMusic;
  stopMusic = function () {
    stopSignalLayer();
    ROOT.classList.remove("bm-signal-pursuit", "bm-signal-boss", "bm-signal-contract");
    _stopMusicSignal();
  };

  var _showMenuSignal = showMenu;
  showMenu = function () {
    stopSignalLayer();
    _showMenuSignal();
    if (els.fastBootToggle) els.fastBootToggle.checked = !!records.fastBoot;
  };

  if (els.fastBootToggle) {
    els.fastBootToggle.addEventListener("change", function () {
      records.fastBoot = !!els.fastBootToggle.checked;
      saveRecords();
    });
  }

// === DAILY EMPIRE SPRINT — calendar, ghost board, loadout lock, insurance ===
  const DAILY_LOADOUTS = ["chain", "ping", "strike", "heat"];

  if (!records.heatCalendar) records.heatCalendar = [];
  if (!records.dailyGhostBoard) records.dailyGhostBoard = [];

  Object.assign(els, {
    heatCalendar: ROOT.querySelector("#bm-heat-calendar"),
    dailyGhostBoard: ROOT.querySelector("#bm-daily-ghost-board"),
    dailyLoadoutLine: ROOT.querySelector("#bm-daily-loadout-line"),
    streakInsureBtn: ROOT.querySelector("#bm-streak-insure")
  });

  function dailyLockedLoadout() {
    return DAILY_LOADOUTS[dateSeed() % DAILY_LOADOUTS.length];
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function weekStampCount() {
    const set = {};
    (records.heatCalendar || []).forEach(function (d) { set[d] = true; });
    let n = 0;
    for (let i = 0; i < 7; i++) if (set[daysAgo(i)]) n++;
    return n;
  }

  function stampHeatCalendar() {
    const today = dateSeed();
    records.heatCalendar = records.heatCalendar || [];
    if (records.heatCalendar.indexOf(today) < 0) {
      records.heatCalendar.push(today);
      records.heatCalendar = records.heatCalendar.slice(-14);
    }
    if (weekStampCount() >= 7) {
      records.heatCalendar = records.heatCalendar.filter(function (d) { return d !== today; });
      records.heatCalendar.push(today);
      if (typeof addCredits === "function") addCredits(500);
      setStatus("Weekly heat calendar complete · +500 CR syndicate bonus", "ok");
    }
    saveRecords();
    renderHeatCalendar();
  }

  function renderHeatCalendar() {
    if (!els.heatCalendar) return;
    const set = {};
    (records.heatCalendar || []).forEach(function (d) { set[d] = true; });
    if (records.dailyLastClear === dateSeed()) set[dateSeed()] = true;
    let html = "";
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i);
      const on = !!set[d];
      html += "<span class=\"bm-cal-day" + (on ? " done" : "") + "\">" + (on ? "◈" : "·") + "</span>";
    }
    els.heatCalendar.innerHTML = html;
    els.heatCalendar.title = "Weekly calendar · 7 stamps = +500 CR · " + weekStampCount() + "/7";
  }

  function pushDailyGhost(entry) {
    records.dailyGhostBoard = records.dailyGhostBoard || [];
    records.dailyGhostBoard.unshift(entry);
    records.dailyGhostBoard = records.dailyGhostBoard.slice(0, 5);
    saveRecords();
    renderDailyGhostBoard();
  }

  function renderDailyGhostBoard() {
    if (!els.dailyGhostBoard) return;
    const rows = records.dailyGhostBoard || [];
    if (!rows.length) {
      els.dailyGhostBoard.innerHTML = "<span class=\"bm-dg-empty\">DAILY GHOST BOARD · clear daily to rank</span>";
      return;
    }
    els.dailyGhostBoard.innerHTML = rows.map(function (e, i) {
      return "<div class=\"bm-dg-row" + (i === 0 ? " top" : "") + "\"><b>" +
        (e.callsign || "GHOST") + "</b> · " + e.score + " pts · " + fmtTime(e.t) +
        (e.pct ? " · top " + e.pct + "%" : "") + "</div>";
    }).join("");
  }

  function updateDailyEmpireUI() {
    renderHeatCalendar();
    renderDailyGhostBoard();
    if (els.dailyLoadoutLine) {
      els.dailyLoadoutLine.textContent = "TODAY'S FAIR LOADOUT · " + dailyLockedLoadout().toUpperCase() +
        " · all operators locked same perk";
    }
    if (els.streakInsureBtn) {
      els.streakInsureBtn.disabled = !!records.streakInsured || (records.credits || 0) < 150;
      els.streakInsureBtn.textContent = records.streakInsured
        ? "STREAK INSURED · active"
        : "STREAK INSURANCE · 150 CR";
    }
  }

  function buyStreakInsurance() {
    if (records.streakInsured) return;
    if (typeof spendCredits !== "function" || !spendCredits(150)) {
      setStatus("Streak insurance costs 150 CR.", "err");
      return;
    }
    records.streakInsured = true;
    saveRecords();
    updateDailyEmpireUI();
    setStatus("Streak insured · next missed day won't break chain", "ok");
    beep(660, 0.08, "triangle", 0.07);
  }

  var _startDailyEmpire = startDaily;
  startDaily = function () {
    loadoutPerk = dailyLockedLoadout();
    records.loadout = loadoutPerk;
    saveRecords();
    if (els.loadoutRoot) {
      els.loadoutRoot.querySelectorAll(".bm-loadout-btn").forEach(function (b) {
        b.classList.toggle("selected", b.dataset.loadout === loadoutPerk);
      });
    }
    _startDailyEmpire();
    setStatus("Daily node · fair loadout " + loadoutPerk.toUpperCase() + " · 6×6", "ok");
  };

  var _bumpDailyEmpire = bumpDailyStreak;
  bumpDailyStreak = function () {
    const today = dateSeed();
    const last = records.dailyLastClear || 0;
    if (last === today) return;
    const yesterday = today - 1;
    const contiguous = last === yesterday || last === today - 1;
    if (!contiguous && last && records.streakInsured) {
      records.streakInsured = false;
      records.dailyStreak = (records.dailyStreak || 0) + 1;
      records.dailyLastClear = today;
      saveRecords();
      updateStreakDisplay();
      setStatus("Streak insurance used · chain preserved", "ok");
      return;
    }
    _bumpDailyEmpire();
  };

  var _onWinDailyEmpire = onWin;
  onWin = function () {
    const wasDaily = dailyMode;
    const t0 = sectorStartedAt || sectorClock;
    _onWinDailyEmpire();
    if (!won || !wasDaily) return;
    stampHeatCalendar();
    const pct = typeof dailyPercentile === "function" ? dailyPercentile(score) : 50;
    pushDailyGhost({
      callsign: records.callsign || "GHOST",
      score: score,
      t: Date.now() - t0,
      pct: pct,
      day: dateSeed()
    });
    updateDailyEmpireUI();
  };

  var _showMenuDaily = showMenu;
  showMenu = function () {
    _showMenuDaily();
    updateDailyEmpireUI();
  };

  if (els.streakInsureBtn) els.streakInsureBtn.addEventListener("click", buyStreakInsurance);
  updateDailyEmpireUI();

// === OMEGA PROTOCOL SPRINT — prestige, omega chain, legacy card, root access ===
  let omegaChainMode = false;
  let omegaChainStep = 0;
  let rootAccessMode = false;
  const OMEGA_CHAIN_LEN = 3;

  if (!records.prestigeLevel) records.prestigeLevel = 0;
  if (!records.prestigeRain) records.prestigeRain = "";
  if (!records.omegaChainBest) records.omegaChainBest = 0;
  if (!records.rootProtocolDone) records.rootProtocolDone = false;

  Object.assign(els, {
    prestigeOv: ROOT.querySelector("#bm-prestige-ov"),
    prestigeAccept: ROOT.querySelector("#bm-prestige-accept"),
    omegaChainBtn: ROOT.querySelector("#bm-omega-chain"),
    legacyBtn: ROOT.querySelector("#bm-legacy-card")
  });

  const PRESTIGE_RAIN = {
    gold: { hue: "#eab308", bright: "#fde047" },
    cyan: { hue: "#22d3ee", bright: "#67e8f9" },
    crimson: { hue: "#ff3355", bright: "#ff6b81" }
  };

  function applyPrestigeRain() {
    if (!records.prestigeRain || !PRESTIGE_RAIN[records.prestigeRain]) return;
    rainHue = PRESTIGE_RAIN[records.prestigeRain].hue;
    rainBright = PRESTIGE_RAIN[records.prestigeRain].bright;
    ROOT.classList.add("bm-prestige-rain");
  }

  function bestGhostDelta() {
    let best = null;
    const pbs = records.sectorPB || {};
    Object.keys(pbs).forEach(function (k) {
      const pb = pbs[k];
      if (pb && pb.t > 0) best = best == null ? pb.t : Math.min(best, pb.t);
    });
    return best;
  }

  function updateOmegaProtocolUI() {
    if (els.omegaChainBtn) {
      const show = records.clears && records.clears.hard;
      els.omegaChainBtn.classList.toggle("bm-hidden", !show);
      els.omegaChainBtn.textContent = omegaChainMode
        ? ("OMEGA CHAIN · " + omegaChainStep + "/" + OMEGA_CHAIN_LEN)
        : "OMEGA CHAIN · 3×8×8";
    }
    if (records.prestigeLevel > 0) applyPrestigeRain();
    if (els.rootAccessBtn && records.rootProtocolDone) {
      els.rootAccessBtn.textContent = "ROOT ACCESS · PROTOCOL CLEARED";
    } else if (els.rootAccessBtn && records.prestigeLevel > 0 && records.clears && records.clears.omega) {
      els.rootAccessBtn.textContent = "ROOT ACCESS · PROTOCOL";
    }
  }

  function offerPrestige() {
    if (records.prestigeLevel > 0 || difficulty !== "hard") return;
    if ((records.maxHeat || 0) < 100 && (records.wanted || 0) < 100) return;
    if (!els.prestigeOv) return;
    els.prestigeOv.classList.add("show");
    beep(440, 0.15, "triangle", 0.1);
  }

  function acceptPrestige() {
    records.prestigeLevel = 1;
    records.wanted = 0;
    records.bonusUnlocked = false;
    const keys = Object.keys(PRESTIGE_RAIN);
    records.prestigeRain = keys[dateSeed() % keys.length];
    saveRecords();
    if (typeof updateWantedUI === "function") updateWantedUI();
    if (els.prestigeOv) els.prestigeOv.classList.remove("show");
    applyPrestigeRain();
    setStatus("PRESTIGE LINK · heat zeroed · syndicate rank kept · rain recolored", "ok");
    if (typeof appendArchive === "function") appendArchive("PRESTIGE · operator ascended · " + records.prestigeRain);
    updateOmegaProtocolUI();
    [523, 659, 880, 1046].forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.14, "triangle", 0.1); }, i * 90);
    });
  }

  function loadOmegaChainSector() {
    omegaMode = true;
    gridLevel = omegaChainStep;
    const spec = [8, 14 - omegaChainStep * 2, 1, 1, "OMEGA CHAIN · NODE " + (omegaChainStep + 1)];
    setGridSize(8);
    const pack = newPuzzleFromSpec(spec);
    solution = pack.solution;
    puzzle = pack.puzzle;
    given = pack.given;
    grid = clone(puzzle);
    N = 8;
    HALF = 4;
    playing = true;
    paused = false;
    won = false;
    mistakes = 0;
    maxMistakes = 1;
    sectorClock = Date.now();
    sectorStartedAt = Date.now();
    if (els.gridWrap) els.gridWrap.classList.add("bm-omega-grid");
    els.grid.className = "bm-grid sz8";
    els.solveBtn.classList.add("bm-hidden");
    renderGrid(false);
    updateHUD();
    startTimer();
    setStatus("OMEGA CHAIN " + (omegaChainStep + 1) + "/" + OMEGA_CHAIN_LEN + " · 8×8 · 1 strike · no solve", "ok");
  }

  function startOmegaChain() {
    if (!(records.clears && records.clears.hard)) return;
    ensureAudio();
    hideVictory();
    omegaChainMode = true;
    omegaChainStep = 0;
    dailyMode = false;
    geniusMode = false;
    arcadeMode = false;
    extractionMode = false;
    contractMode = false;
    score = score || 0;
    elapsedMs = elapsedMs || 0;
    startedAt = Date.now() - elapsedMs;
    applyMood();
    ROOT.classList.add("bm-mood-omega", "bm-omega-chain");
    els.menu.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    loadOmegaChainSector();
    playMusic();
  }

  function completeOmegaChain() {
    omegaChainMode = false;
    omegaChainStep = 0;
    omegaMode = false;
    records.omegaChainBest = Math.max(records.omegaChainBest || 0, score);
    if (typeof addCredits === "function") addCredits(1000);
    score += 2000;
    saveRecords();
    playing = false;
    ROOT.classList.remove("bm-omega-chain");
    setStatus("OMEGA CHAIN CLEARED · +2000 score · +1000 CR", "ok");
    updateOmegaProtocolUI();
    showMenu();
  }

  function omegaChainWin() {
    won = true;
    playing = false;
    sectorGain = calcSectorScore();
    score += sectorGain;
    updateHUD();
    omegaChainStep++;
    if (omegaChainStep >= OMEGA_CHAIN_LEN) {
      setTimeout(completeOmegaChain, 450);
      return;
    }
    setTimeout(function () {
      won = false;
      loadOmegaChainSector();
    }, 500);
  }

  function startRootProtocol() {
    if (!(records.prestigeLevel > 0 && records.clears && records.clears.omega)) {
      startOmega();
      return;
    }
    ensureAudio();
    hideVictory();
    rootAccessMode = true;
    omegaMode = true;
    omegaChainMode = false;
    dailyMode = false;
    geniusMode = false;
    gridLevel = 0;
    score = score || 0;
    mistakes = 0;
    maxMistakes = 1;
    elapsedMs = 0;
    startedAt = Date.now();
    applyMood();
    ROOT.classList.add("bm-mood-omega", "bm-root-protocol");
    els.menu.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    const spec = [8, 10, 1, 1, "ROOT ACCESS PROTOCOL · NEXCORP CORE"];
    setGridSize(8);
    const pack = newPuzzleFromSpec(spec);
    solution = pack.solution;
    puzzle = pack.puzzle;
    given = pack.given;
    grid = clone(puzzle);
    N = 8;
    HALF = 4;
    playing = true;
    won = false;
    sectorClock = Date.now();
    sectorStartedAt = Date.now();
    els.solveBtn.classList.add("bm-hidden");
    renderGrid(false);
    updateHUD();
    startTimer();
    playMusic();
    setStatus("ROOT ACCESS PROTOCOL · 8×8 · 1 strike · classified", "ok");
    beep(80, 0.2, "sawtooth", 0.12);
  }

  function completeRootProtocol() {
    rootAccessMode = false;
    omegaMode = false;
    records.rootProtocolDone = true;
    score += 5000;
    if (typeof addCredits === "function") addCredits(1500);
    saveRecords();
    playing = false;
    ROOT.classList.remove("bm-root-protocol");
    markCampaignClear("root");
    showVictory({
      title: "ROOT ACCESS GRANTED",
      sub: "NexCorp core protocol breached · classified clearance logged",
      codes: [matrixCode()]
    });
    updateOmegaProtocolUI();
  }

  var _drawVictoryLegacy = drawVictoryCard;
  drawVictoryCard = function () {
    const cv = _drawVictoryLegacy();
    const c = cv.getContext("2d");
    c.fillStyle = "#c4b5fd";
    c.font = "11px Courier New, monospace";
    const syn = typeof computeSyndicateRank === "function" ? computeSyndicateRank() : "—";
    c.fillText("SYNDICATE " + syn + " · EXFIL " + (records.extractions || 0) +
      " · CONTRACTS " + (records.contractsTotal || 0), 24, 168);
    c.fillStyle = "#fde68a";
    const ghost = bestGhostDelta();
    c.fillText("LEGACY · prestige L" + (records.prestigeLevel || 0) +
      (ghost ? " · best ghost " + fmtTime(ghost) : ""), 24, 188);
    return cv;
  };

  var _onWinOmega = onWin;
  onWin = function () {
    if (omegaChainMode) {
      omegaChainWin();
      return;
    }
    if (rootAccessMode) {
      won = true;
      playing = false;
      sectorGain = calcSectorScore();
      score += sectorGain;
      updateHUD();
      completeRootProtocol();
      return;
    }
    _onWinOmega();
  };

  var _showVictoryOmega = showVictory;
  showVictory = function (opts) {
    if (!omegaChainMode && !rootAccessMode && difficulty === "hard" && !(opts && opts.daily)) {
      offerPrestige();
    }
    _showVictoryOmega(opts);
  };

  var _startRootAccessOmega = startRootAccess;
  startRootAccess = function () {
    if (records.prestigeLevel > 0 && records.clears && records.clears.omega && !records.rootProtocolDone) {
      startRootProtocol();
      return;
    }
    _startRootAccessOmega();
  };

  var _failOutOmega = failOut;
  failOut = function () {
    if (omegaChainMode) {
      omegaChainMode = false;
      omegaChainStep = 0;
      omegaMode = false;
      ROOT.classList.remove("bm-omega-chain");
      setStatus("OMEGA CHAIN broken · NexCorp sealed the root.", "err");
    }
    if (rootAccessMode) {
      rootAccessMode = false;
      omegaMode = false;
      ROOT.classList.remove("bm-root-protocol");
    }
    _failOutOmega();
  };

  var _showMenuOmega = showMenu;
  showMenu = function () {
    omegaChainMode = false;
    rootAccessMode = false;
    ROOT.classList.remove("bm-omega-chain", "bm-root-protocol");
    _showMenuOmega();
    updateOmegaProtocolUI();
  };

  if (els.prestigeAccept) els.prestigeAccept.addEventListener("click", acceptPrestige);
  if (els.prestigeOv) {
    els.prestigeOv.addEventListener("click", function (e) {
      if (e.target === els.prestigeOv) els.prestigeOv.classList.remove("show");
    });
  }
  if (els.omegaChainBtn) els.omegaChainBtn.addEventListener("click", startOmegaChain);
  if (els.legacyBtn) els.legacyBtn.addEventListener("click", downloadVictoryCard);

  updateOmegaProtocolUI();

// === CHALLENGE WARS SPRINT — duels, ghost links, war cards ===
  let duelMode = false;
  let pendingDuel = null;
  let duelGhostMs = 0;
  let duelOpponent = null;

  Object.assign(els, {
    duelAccept: ROOT.querySelector("#bm-duel-accept"),
    duelBar: ROOT.querySelector("#bm-duel-bar"),
    duelLabel: ROOT.querySelector("#bm-duel-label"),
    duelResult: ROOT.querySelector("#bm-duel-result"),
    duelResultTitle: ROOT.querySelector("#bm-duel-result-title"),
    duelResultSub: ROOT.querySelector("#bm-duel-result-sub")
  });

  function buildDuelPayload() {
    const pb = records.sectorPB && typeof sectorKey === "function" ? records.sectorPB[sectorKey()] : null;
    return {
      v: 1,
      seed: challengeSeed || (dateSeed() ^ ((gridLevel || 0) + 1) * 7919),
      heat: records.wanted || 0,
      loadout: loadoutPerk || "chain",
      rank: typeof computeSyndicateRank === "function" ? computeSyndicateRank() : computeRank(),
      callsign: records.callsign || "GHOST",
      ghostMs: pb && pb.t ? pb.t : 0,
      diff: difficulty || "medium",
      level: gridLevel || 0,
      cr: records.credits || 0
    };
  }

  function encodeDuel(obj) {
    return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(obj)))));
  }

  function decodeDuel(str) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(str)))));
    } catch (e) {
      return null;
    }
  }

  function duelShareUrl() {
    const d = buildDuelPayload();
    const base = location.href.split("#")[0].split("?")[0];
    return base + "?seed=" + d.seed + "&duel=" + encodeDuel(d);
  }

  function updateDuelUI() {
    if (els.duelAccept) {
      els.duelAccept.classList.toggle("bm-hidden", !pendingDuel || duelMode);
    }
    if (els.duelBar) els.duelBar.hidden = !duelMode;
    if (els.duelLabel && duelMode && duelOpponent) {
      els.duelLabel.textContent = "DUEL · vs " + (duelOpponent.callsign || "RIVAL") +
        " · " + (duelOpponent.rank || "RUNNER") + " · beat " +
        (duelGhostMs ? fmtTime(duelGhostMs) : "their ghost");
    }
  }

  function tryLoadDuel() {
    try {
      const q = new URLSearchParams(location.search);
      const raw = q.get("duel");
      if (!raw) return;
      pendingDuel = decodeDuel(raw);
      if (!pendingDuel || !pendingDuel.seed) return;
      challengeSeed = pendingDuel.seed;
      if (els.duelAccept) {
        els.duelAccept.classList.remove("bm-hidden");
        els.duelAccept.textContent = "DUEL ACCEPT · vs " + (pendingDuel.callsign || "RIVAL");
      }
      if (els.bulletin) {
        els.bulletin.textContent = "CHALLENGE WAR INCOMING · " + (pendingDuel.callsign || "RIVAL") +
          " · heat " + (pendingDuel.heat || 0) + "% · " + (pendingDuel.loadout || "chain").toUpperCase();
      }
    } catch (e) {}
  }

  function acceptDuel() {
    if (!pendingDuel) return;
    ensureAudio();
    duelMode = true;
    duelOpponent = pendingDuel;
    duelGhostMs = pendingDuel.ghostMs || 0;
    challengeSeed = pendingDuel.seed;
    difficulty = pendingDuel.diff || "medium";
    gridLevel = pendingDuel.level || 0;
    loadoutPerk = pendingDuel.loadout || loadoutPerk;
    records.loadout = loadoutPerk;
    saveRecords();
    hideVictory();
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    dailyMode = false;
    omegaMode = false;
    arcadeMode = false;
    geniusMode = false;
    extractionMode = false;
    contractMode = false;
    bonusNodeMode = false;
    sectorCodes = [];
    score = score || 0;
    mistakes = 0;
    elapsedMs = elapsedMs || 0;
    startedAt = Date.now() - elapsedMs;
    applyMood();
    if (els.duelAccept) els.duelAccept.classList.add("bm-hidden");
    if (els.duelResult) els.duelResult.classList.remove("show");
    els.menu.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    loadGridSector(true);
    updateDuelUI();
    setStatus("DUEL ACCEPTED · beat " + (duelOpponent.callsign || "rival") + "'s ghost", "ok");
    beep(720, 0.08, "triangle", 0.08);
  }

  function resolveDuel(outcome) {
    if (!duelMode) return;
    duelMode = false;
    pendingDuel = null;
    updateDuelUI();
    if (!els.duelResult) return;
    if (els.duelResultTitle) els.duelResultTitle.textContent = outcome.won ? "DUEL WON" : "DUEL LOST";
    if (els.duelResultSub) {
      els.duelResultSub.textContent = outcome.won
        ? ("You beat " + (duelOpponent.callsign || "rival") + "'s ghost · +" + outcome.cr + " CR")
        : ((duelOpponent.callsign || "Rival") + " held the line · train and rematch");
    }
    els.duelResult.classList.add("show");
    if (outcome.won && typeof addCredits === "function") addCredits(outcome.cr);
    setTimeout(function () { if (els.duelResult) els.duelResult.classList.remove("show"); }, 3200);
    duelOpponent = null;
    duelGhostMs = 0;
  }

  var _shareChallengeWar = shareChallengeLink;
  shareChallengeLink = function () {
    const d = buildDuelPayload();
    const url = duelShareUrl();
    const ghostLine = d.ghostMs ? (" · ghost " + fmtTime(d.ghostMs)) : "";
    const txt = "THE BINARY MATRIX · DUEL · " + (d.callsign || "GHOST") + " · " + d.rank +
      " · HEAT " + d.heat + "% · " + d.loadout.toUpperCase() + ghostLine +
      " · beat seed " + d.seed + " · " + url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        if (els.challengeLink) {
          els.challengeLink.textContent = "DUEL LINK COPIED!";
          setTimeout(function () { els.challengeLink.textContent = "CHALLENGE LINK"; }, 1600);
        }
      }).catch(function () {});
    }
    beep(720, 0.06, "triangle", 0.06);
  };

  var _parseUrlWar = parseUrlParams;
  parseUrlParams = function () {
    _parseUrlWar();
    tryLoadDuel();
  };

  var _updateGhostWar = updateGhostRace;
  updateGhostRace = function () {
    if (duelMode && duelGhostMs > 0 && playing && els.ghostRace) {
      els.ghostRace.hidden = false;
      const elapsed = Date.now() - sectorStartedAt;
      const pct = Math.min(100, Math.round(elapsed / duelGhostMs * 100));
      if (els.ghostFill) els.ghostFill.style.width = pct + "%";
      if (els.ghostLabel) {
        const delta = elapsed - duelGhostMs;
        els.ghostLabel.textContent = delta > 0
          ? ("RIVAL +" + Math.ceil(delta / 1000) + "s ahead · DUEL")
          : ("YOU +" + Math.ceil(-delta / 1000) + "s ahead · DUEL");
      }
      return;
    }
    _updateGhostWar();
  };

  var _onWinWar = onWin;
  onWin = function () {
    if (duelMode) {
      if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
      won = true;
      playing = false;
      sectorGain = calcSectorScore();
      score += sectorGain;
      updateHUD();
      renderGrid(false);
      const elapsed = Date.now() - sectorStartedAt;
      const beat = !duelGhostMs || elapsed <= duelGhostMs;
      resolveDuel({ won: beat, cr: beat ? 350 : 0 });
      return;
    }
    _onWinWar();
  };

  var _failOutWar = failOut;
  failOut = function () {
    if (duelMode) resolveDuel({ won: false, cr: 0 });
    _failOutWar();
  };

  var _drawCardWar = drawVictoryCard;
  drawVictoryCard = function () {
    const cv = _drawCardWar();
    const c = cv.getContext("2d");
    const syn = typeof computeSyndicateRank === "function" ? computeSyndicateRank() : computeRank();
    c.fillStyle = "#39ff14";
    c.font = "700 12px Courier New, monospace";
    c.fillText("[" + syn + "]", 480, 48);
    c.fillStyle = "#a78bfa";
    c.fillText((records.credits || 0) + " CR", 480, 68);
    if (duelMode || pendingDuel) {
      c.fillStyle = "#ff6b81";
      c.font = "10px Courier New, monospace";
      c.fillText("CHALLENGE WAR", 24, 210);
    }
    return cv;
  };

  var _showMenuWar = showMenu;
  showMenu = function () {
    if (!duelMode) updateDuelUI();
    _showMenuWar();
  };

  if (els.duelAccept) els.duelAccept.addEventListener("click", acceptDuel);
  if (els.duelResult) {
    els.duelResult.addEventListener("click", function () { els.duelResult.classList.remove("show"); });
  }
  tryLoadDuel();
  updateDuelUI();

// === NEXCORP ARCHIVES SPRINT — memos, world events, archivist ===
  const ARCHIVE_MEMOS = {
    boss: { title: "MEMO · FINAL GATE", text: "NexCorp apex nodes bleed red telemetry. Operators who linger get logged twice." },
    extract: { title: "MEMO · EXFIL ROUTE", text: "Three-node extraction paths exist. Hunters converge on heat max — move fast." },
    contract: { title: "MEMO · BLACK CONTRACT", text: "Weekly contracts are bait. The payout is real. So is the trace." },
    pursuit: { title: "MEMO · HUNTER DIVISION", text: "70% heat triggers pursuit sweeps. Counter-intel buys one breath." },
    prestige: { title: "MEMO · PRESTIGE LINK", text: "Ascended operators keep syndicate rank but burn their heat signature." },
    root: { title: "MEMO · ROOT PROTOCOL", text: "Classified 8×8 core exists below OMEGA. One strike. No mercy." },
    daily: { title: "MEMO · DAILY NODE", text: "Global daily grids sync at midnight UTC. Fair loadout locked worldwide." },
    syndicate: { title: "MEMO · SYNDICATE", text: "Ghost bets and relay boards are how underground operators rank each other." }
  };

  const WORLD_EVENTS = [
    "NexCorp redeployed hunter division to sector 7 — pursuit timers tightened.",
    "Black market contracts rotating · phantom ledger active this week.",
    "Relay traffic up 22% · syndicate ghost bets flagged by compliance.",
    "Deep Net side doors opening above 70% heat · kernel probes detected.",
    "OMEGA chain runners breaching triple 8×8 nodes — root access logs spiking.",
    "Daily empire streak insurance sales up · operators playing long game.",
    "Challenge war duels spreading · beat-my-ghost links on every relay.",
    "Archivist clearance rumored · collect every leaked file to earn it."
  ];

  const BOOK_LINK = "https://www.8bitcrypto44.xyz";

  if (!records.archiveMemos) records.archiveMemos = [];
  if (!records.loreSeen) records.loreSeen = [];

  Object.assign(els, {
    archivesPanel: ROOT.querySelector("#bm-archives"),
    worldEvent: ROOT.querySelector("#bm-world-event"),
    declassifiedLink: ROOT.querySelector("#bm-declassified")
  });

  function unlockArchive(key) {
    if (!ARCHIVE_MEMOS[key]) return;
    if (records.archiveMemos.indexOf(key) >= 0) return;
    records.archiveMemos.push(key);
    saveRecords();
    renderArchives();
    checkArchivist();
  }

  function markLoreSeen(idx) {
    records.loreSeen = records.loreSeen || [];
    if (records.loreSeen.indexOf(idx) < 0) {
      records.loreSeen.push(idx);
      saveRecords();
      checkArchivist();
      renderArchives();
    }
  }

  function isArchivist() {
    return (records.loreSeen || []).length >= LORE_QUOTES.length &&
      (records.archiveMemos || []).length >= 6;
  }

  function checkArchivist() {
    if (isArchivist() && !records.archivist) {
      records.archivist = true;
      saveRecords();
      if (typeof appendArchive === "function") appendArchive("ARCHIVIST CLEARANCE GRANTED");
      setStatus("ARCHIVIST badge unlocked · all files declassified", "ok");
    }
  }

  function renderArchives() {
    if (!els.archivesPanel) return;
    const keys = records.archiveMemos || [];
    if (!keys.length) {
      els.archivesPanel.innerHTML = "<span class=\"bm-archive-empty\">NEXCORP ARCHIVES · breach nodes to leak memos</span>";
      return;
    }
    let html = keys.map(function (k) {
      const m = ARCHIVE_MEMOS[k];
      return m ? ("<div class=\"bm-archive-memo\"><b>" + m.title + "</b> · " + m.text + "</div>") : "";
    }).join("");
    html += "<div class=\"bm-archive-meta\">LORE " + (records.loreSeen || []).length + "/" +
      LORE_QUOTES.length + " · FILES " + keys.length + "/" + Object.keys(ARCHIVE_MEMOS).length;
    if (isArchivist()) html += " · ARCHIVIST";
    html += "</div>";
    els.archivesPanel.innerHTML = html;
  }

  function updateWorldEvent() {
    const ev = WORLD_EVENTS[dateSeed() % WORLD_EVENTS.length];
    if (els.worldEvent) els.worldEvent.textContent = "WORLD EVENT · " + ev;
    if (els.bulletin && !pendingDuel) {
      const cur = els.bulletin.textContent || "";
      if (cur.indexOf("CHALLENGE WAR") < 0) {
        els.bulletin.textContent = ev;
      }
    }
  }

  var _showSectorArch = showSectorCard;
  showSectorCard = function (clearedLabel, code, nextLabel, cb, loreQuote) {
    const idx = gridLevel % LORE_QUOTES.length;
    markLoreSeen(idx);
    if (typeof isBossSector === "function" && isBossSector()) unlockArchive("boss");
    _showSectorArch(clearedLabel, code, nextLabel, cb, loreQuote);
  };

  var _completeExtractArch = completeExtraction;
  completeExtraction = function () {
    unlockArchive("extract");
    _completeExtractArch();
  };

  var _completeContractArch = completeContract;
  completeContract = function () {
    unlockArchive("contract");
    _completeContractArch();
  };

  var _acceptPrestigeArch = acceptPrestige;
  acceptPrestige = function () {
    unlockArchive("prestige");
    _acceptPrestigeArch();
  };

  var _completeRootArch = completeRootProtocol;
  completeRootProtocol = function () {
    unlockArchive("root");
    _completeRootArch();
  };

  var _onWinArch = onWin;
  onWin = function () {
    _onWinArch();
    if (!won) return;
    if (dailyMode) unlockArchive("daily");
    if (typeof isPursuitActive === "function" && isPursuitActive()) unlockArchive("pursuit");
    if (typeof computeSyndicateRank === "function" && computeSyndicateRank() !== "RECRUIT") {
      unlockArchive("syndicate");
    }
  };

  var _computeBadgesArch = computeBadges;
  computeBadges = function (opts) {
    const b = _computeBadgesArch(opts);
    if (isArchivist()) b.push("ARCHIVIST");
    if (duelMode) b.push("DUEL");
    return b;
  };

  var _showMenuArch = showMenu;
  showMenu = function () {
    _showMenuArch();
    updateWorldEvent();
    renderArchives();
  };

  if (els.declassifiedLink) {
    els.declassifiedLink.href = BOOK_LINK;
    els.declassifiedLink.target = "_blank";
  }

  updateWorldEvent();
  renderArchives();
  checkArchivist();

// === STORY LINK SPRINT — Book 1 dialogue, beats, briefing ===
  let storyData = null;
  let pendingStoryStart = null;

  if (!records.storyBeatsSeen) records.storyBeatsSeen = [];
  if (records.storyBriefSeen == null) records.storyBriefSeen = false;

  Object.assign(els, {
    storyHud: ROOT.querySelector("#bm-story-hud"),
    storyBrief: ROOT.querySelector("#bm-story-brief"),
    storyBriefDialog: ROOT.querySelector("#bm-story-brief-dialog"),
    storyBriefGo: ROOT.querySelector("#bm-story-brief-go"),
    storyBriefSkip: ROOT.querySelector("#bm-story-brief-skip"),
    storyBriefTitle: ROOT.querySelector("#bm-story-brief-title"),
    victoryStory: ROOT.querySelector("#bm-victory-story")
  });

  function storyAssetVer() {
    const s = document.querySelector('script[src*="binary_matrix.js"]');
    const m = s && s.src.match(/[?&]v=(\d+)/);
    return m ? m[1] : "19";
  }

  function escapeStoryHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function storyChars() {
    return (storyData && storyData.characters) || {};
  }

  function renderDialogue(lines) {
    if (!lines || !lines.length) return "";
    const chars = storyChars();
    return lines.map(function (d) {
      const ch = chars[d.who] || { name: String(d.who || "?").toUpperCase(), tag: "", color: "#86efac" };
      return (
        '<div class="bm-dlg-row bm-dlg-' + escapeStoryHtml(d.who) + '">' +
        '<b style="color:' + escapeStoryHtml(ch.color) + '">' + escapeStoryHtml(ch.name) +
        (ch.tag ? ' <span class="bm-dlg-tag">· ' + escapeStoryHtml(ch.tag) + "</span>" : "") +
        "</b>" + escapeStoryHtml(d.line) + "</div>"
      );
    }).join("");
  }

  function markStoryBeat(id) {
    if (!id) return;
    records.storyBeatsSeen = records.storyBeatsSeen || [];
    if (records.storyBeatsSeen.indexOf(id) >= 0) return;
    records.storyBeatsSeen.push(id);
    saveRecords();
  }

  function storyModeActive() {
    return !dailyMode && !omegaMode && !arcadeMode && !contractMode &&
      difficulty !== "genius" && difficulty !== "daily";
  }

  function getStoryBeat() {
    if (!storyData || !storyModeActive()) return null;
    const camp = storyData.campaign && storyData.campaign[difficulty];
    if (!camp) return null;
    return camp[gridLevel] || null;
  }

  function updateStoryHud() {
    if (!els.storyHud) return;
    if (!storyData || !storyModeActive()) {
      els.storyHud.hidden = true;
      return;
    }
    const beat = getStoryBeat();
    if (beat && beat.chapter) {
      els.storyHud.textContent = "STORY · BOOK " + (storyData.book || 1) + " · " + beat.chapter;
      els.storyHud.hidden = false;
    } else {
      els.storyHud.hidden = true;
    }
  }

  function loadStoryBeats() {
    fetch("story_beats.json?v=" + storyAssetVer())
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        storyData = d;
        if (els.storyBriefTitle && d.title) els.storyBriefTitle.textContent = d.title;
        updateStoryHud();
      })
      .catch(function () {
        storyData = null;
      });
  }

  function hideStoryBrief() {
    if (els.storyBrief) els.storyBrief.classList.remove("show");
  }

  function finishStoryBrief() {
    records.storyBriefSeen = true;
    saveRecords();
    hideStoryBrief();
    const go = pendingStoryStart;
    pendingStoryStart = null;
    if (go) go();
  }

  function showStoryBriefing(onGo) {
    if (!els.storyBrief || !storyData || !storyData.briefing) {
      if (onGo) onGo();
      return;
    }
    pendingStoryStart = onGo;
    if (els.storyBriefDialog) els.storyBriefDialog.innerHTML = renderDialogue(storyData.briefing);
    els.storyBrief.classList.add("show");
    beep(440, 0.08, "sine", 0.05);
  }

  if (els.storyBriefGo) {
    els.storyBriefGo.onclick = function () { finishStoryBrief(); };
  }
  if (els.storyBriefSkip) {
    els.storyBriefSkip.onclick = function () { finishStoryBrief(); };
  }

  var _showSectorStory = showSectorCard;
  showSectorCard = function (clearedLabel, code, nextLabel, cb, loreQuote) {
    const beat = getStoryBeat();
    if (typeof markLoreSeen === "function") markLoreSeen(gridLevel % LORE_QUOTES.length);
    if (typeof isBossSector === "function" && isBossSector() && typeof unlockArchive === "function") {
      unlockArchive("boss");
    }
    if (beat && beat.dialogue && beat.dialogue.length && els.sector) {
      markStoryBeat(beat.id);
      updateStoryHud();
      if (els.sectorKicker) els.sectorKicker.textContent = beat.chapter ? ("STORY · " + beat.chapter) : "SECTOR CLEARED";
      if (els.sectorTitle) els.sectorTitle.textContent = clearedLabel;
      if (els.sectorCode) els.sectorCode.textContent = "matrix code " + code;
      if (els.sectorLore) {
        els.sectorLore.innerHTML = renderDialogue(beat.dialogue);
        els.sectorLore.classList.remove("bm-hidden");
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
      }, 3400);
      return;
    }
    _showSectorStory(clearedLabel, code, nextLabel, cb, loreQuote);
  };

  var _hideVictoryStory = hideVictory;
  hideVictory = function () {
    if (els.victoryStory) {
      els.victoryStory.innerHTML = "";
      els.victoryStory.classList.add("bm-hidden");
    }
    _hideVictoryStory();
  };

  var _showVictoryStory = showVictory;
  showVictory = function (opts) {
    opts = opts || {};
    if (els.victoryStory) {
      if (!opts.daily && !opts.omega && !opts.genius && storyData && storyData.victory) {
        const vb = storyData.victory[difficulty];
        if (vb && vb.dialogue && vb.dialogue.length) {
          els.victoryStory.innerHTML = renderDialogue(vb.dialogue);
          els.victoryStory.classList.remove("bm-hidden");
        } else {
          els.victoryStory.innerHTML = "";
          els.victoryStory.classList.add("bm-hidden");
        }
      } else {
        els.victoryStory.innerHTML = "";
        els.victoryStory.classList.add("bm-hidden");
      }
    }
    _showVictoryStory(opts);
  };

  var _showKernelLoreStory = showKernelLore;
  showKernelLore = function (level) {
    _showKernelLoreStory(level);
    if (!storyData || !storyData.genius) return;
    const beat = storyData.genius[level];
    if (!beat || !beat.dialogue || !els.kernelLorePanel) return;
    markStoryBeat(beat.id);
    els.kernelLorePanel.innerHTML += renderDialogue(beat.dialogue);
  };

  var _startGameStory = startGame;
  startGame = function () {
    function go() {
      if (!records.storyBriefSeen && storyData && storyData.briefing && storyData.briefing.length) {
        showStoryBriefing(function () { _startGameStory(); });
        return;
      }
      _startGameStory();
    }
    if (!records.storyBriefSeen && !storyData) {
      setTimeout(go, 180);
      return;
    }
    go();
  };

  var _loadGridStory = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridStory(freshRun);
    setTimeout(updateStoryHud, freshRun ? 80 : 120);
  };

  var _showMenuStory = showMenu;
  showMenu = function () {
    _showMenuStory();
    updateStoryHud();
  };

  loadStoryBeats();

// === VIEWPORT SPRINT — dynamic embed height, no scroll except tutorials ===
  const EMBED_MIN_H = 680;
  let embedFsActive = false;

  Object.assign(els, {
    fsBtn: ROOT.querySelector("#bm-fullscreen")
  });

  function isTutScrollTarget(node) {
    return node && node.closest && node.closest(".bm-tut-scroll");
  }

  function blockEmbedScroll(e) {
    if (!EMBED) return;
    if (isTutScrollTarget(e.target)) return;
    e.preventDefault();
  }

  function measureEmbedHeight() {
    if (!EMBED) return EMBED_MIN_H;
    const doc = document.documentElement;
    const bod = document.body;
    [doc, bod, ROOT].forEach(function (el) {
      el.style.height = "auto";
      el.style.minHeight = "0";
      el.style.maxHeight = "none";
    });
    const h = Math.ceil(Math.max(
      EMBED_MIN_H,
      ROOT.getBoundingClientRect().height || 0,
      ROOT.scrollHeight || 0,
      ROOT.offsetHeight || 0,
      doc.scrollHeight || 0,
      bod.scrollHeight || 0
    ));
    return h;
  }

  function applyEmbedFrameHeight(h) {
    if (!EMBED) return;
    h = Math.max(EMBED_MIN_H, Math.round(h || measureEmbedHeight()));
    [document.documentElement, document.body, ROOT].forEach(function (el) {
      el.style.height = h + "px";
      el.style.minHeight = h + "px";
      el.style.maxHeight = h + "px";
      el.style.overflow = "hidden";
    });
    return h;
  }

  function syncEmbedUiMode() {
    if (!EMBED) return;
    const menuOpen = els.menu && !els.menu.classList.contains("bm-hidden");
    const playOpen = els.play && !els.play.classList.contains("bm-hidden");
    const geniusOpen = els.genius && !els.genius.classList.contains("bm-hidden");
    ROOT.classList.toggle("bm-ui-menu", !!menuOpen);
    ROOT.classList.toggle("bm-ui-play", !!playOpen);
    ROOT.classList.toggle("bm-ui-genius", !!geniusOpen);
    notifyResize();
  }

  function isNativeFs() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function updateFsBtn() {
    if (!els.fsBtn) return;
    const on = EMBED ? embedFsActive : isNativeFs();
    els.fsBtn.textContent = on ? "EXIT FS" : "FULLSCREEN";
    els.fsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    els.fsBtn.title = on ? "Exit fullscreen" : "Enter fullscreen";
  }

  function toggleFullscreen() {
    ensureAudio();
    if (EMBED && window.parent) {
      embedFsActive = !embedFsActive;
      try {
        window.parent.postMessage({ type: embedFsActive ? "bm-fs" : "bm-fs-exit" }, "*");
      } catch (e) {}
      updateFsBtn();
      setTimeout(syncEmbedUiMode, 150);
      beep(660, 0.06, "triangle", 0.05);
      return;
    }
    const rootEl = document.documentElement;
    const req = rootEl.requestFullscreen || rootEl.webkitRequestFullscreen;
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (isNativeFs()) {
      if (ex) ex.call(document);
    } else if (req) {
      try {
        const p = req.call(rootEl);
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    }
  }

  function onFsStateMsg(active) {
    embedFsActive = !!active;
    updateFsBtn();
    syncEmbedUiMode();
  }

  notifyResize = function () {
    if (!EMBED || !window.parent) return;
    requestAnimationFrame(function () {
      try {
        const h = applyEmbedFrameHeight(measureEmbedHeight());
        window.parent.postMessage({ type: "bm-resize", height: h }, "*");
      } catch (e) {}
    });
  };

  if (EMBED) {
    applyEmbedFrameHeight(measureEmbedHeight());
    document.addEventListener("wheel", blockEmbedScroll, { passive: false });
    document.addEventListener("touchmove", blockEmbedScroll, { passive: false });
    window.addEventListener("resize", syncEmbedUiMode);
  }

  var _runBootVp = runBoot;
  runBoot = function (cb) {
    _runBootVp(function () {
      syncEmbedUiMode();
      if (cb) cb();
    });
  };

  var _showMenuVp = showMenu;
  showMenu = function () {
    _showMenuVp();
    syncEmbedUiMode();
  };

  var _loadGridVp = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridVp(freshRun);
    setTimeout(syncEmbedUiMode, freshRun ? 80 : 120);
  };

  var _startGeniusVp = typeof startGenius === "function" ? startGenius : null;
  if (_startGeniusVp) {
    startGenius = function () {
      _startGeniusVp();
      setTimeout(syncEmbedUiMode, 80);
    };
  }

  var _showVictoryVp = showVictory;
  showVictory = function (opts) {
    _showVictoryVp(opts);
    setTimeout(syncEmbedUiMode, 80);
  };

  if (els.fsBtn) {
    els.fsBtn.addEventListener("click", toggleFullscreen);
  }
  document.addEventListener("fullscreenchange", updateFsBtn);
  document.addEventListener("webkitfullscreenchange", updateFsBtn);
  window.addEventListener("message", function (e) {
    if (!e.data || typeof e.data !== "object") return;
    if (e.data.type === "bm-fs-state") onFsStateMsg(e.data.active);
  });
  updateFsBtn();
  if (EMBED) syncEmbedUiMode();

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
    if (els.helpOv) els.helpOv.classList.add("show");
    beep(600, 0.05, "square", 0.04);
  });
  ROOT.querySelector("#bm-help-close").addEventListener("click", function () {
    els.helpOv.classList.remove("show");
  });
  const openGeniusHelp = ROOT.querySelector("#bm-open-genius-help");
  if (openGeniusHelp) {
    openGeniusHelp.addEventListener("click", function () {
      els.helpOv.classList.remove("show");
      if (els.geniusHelp) els.geniusHelp.classList.add("show");
    });
  }
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
