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
