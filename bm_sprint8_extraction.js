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
