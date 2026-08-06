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
