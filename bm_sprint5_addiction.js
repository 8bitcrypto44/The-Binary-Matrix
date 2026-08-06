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
