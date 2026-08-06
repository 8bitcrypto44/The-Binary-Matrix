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
