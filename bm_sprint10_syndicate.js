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
