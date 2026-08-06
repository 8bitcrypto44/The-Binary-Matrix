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
