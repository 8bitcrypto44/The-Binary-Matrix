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
