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
