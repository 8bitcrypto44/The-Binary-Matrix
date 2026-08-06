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
