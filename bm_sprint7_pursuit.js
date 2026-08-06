  // === PURSUIT SPRINT — heat chases you ===
  let pursuitPulseOsc = null;
  let pursuitPulseGain = null;
  let pursuitPulseTimer = null;
  let menuHeatAt = Date.now();

  Object.assign(els, {
    pursuitWrap: ROOT.querySelector("#bm-pursuit-wrap"),
    pursuitTimer: ROOT.querySelector("#bm-pursuit-timer"),
    ghostRace: ROOT.querySelector("#bm-ghost-race"),
    ghostLabel: ROOT.querySelector("#bm-ghost-label"),
    ghostFill: ROOT.querySelector("#bm-ghost-fill"),
    ghostMark: ROOT.querySelector("#bm-ghost-mark"),
    bountyBoard: ROOT.querySelector("#bm-bounty-board")
  });

  function isPursuitActive() {
    if (dailyMode || arcadeMode || omegaMode || bonusNodeMode) return false;
    if (geniusMode) return false;
    if (!playing || paused || won) return false;
    const heat = records.wanted || 0;
    return heat >= 70 || ROOT.classList.contains("bm-mood-boss");
  }

  function pursuitLimitMs() {
    const pb = records.sectorPB && records.sectorPB[sectorKey()];
    if (pb && pb.t > 4000) return Math.floor(pb.t * 1.12);
    const spec = sectorSpec();
    return (75 + (spec[0] || 6) * 22) * 1000;
  }

  function ghostPbMs() {
    const pb = records.sectorPB && records.sectorPB[sectorKey()];
    return pb && pb.t > 0 ? pb.t : null;
  }

  function fmtSec(ms) {
    return Math.max(0, Math.ceil(ms / 1000)) + "s";
  }

  function updateBountyBoard() {
    if (!els.bountyBoard) return;
    const w = records.wanted || 0;
    const perk = (loadoutPerk || "chain").toUpperCase();
    let line = "BOUNTY BOARD · HEAT " + w + "% · LOADOUT " + perk;
    if (w >= 70) line += " · PURSUIT ACTIVE";
    if (records.bonusUnlocked) line += " · BONUS LIVE";
    els.bountyBoard.textContent = line;
  }

  function applyMenuHeatDecay() {
    const idle = Date.now() - menuHeatAt;
    if (idle > 90000 && (records.wanted || 0) > 0) {
      records.wanted = Math.max(0, (records.wanted || 0) - 1);
      if (records.wanted < 100) records.bonusUnlocked = false;
      saveRecords();
      updateWantedUI();
    }
    menuHeatAt = Date.now();
  }

  function syncPursuitPulse() {
    const on = isPursuitActive() && !muted && musicVol && !REDUCED_MOTION;
    if (on && !pursuitPulseOsc) {
      ensureAudio();
      pursuitPulseOsc = audioCtx.createOscillator();
      pursuitPulseGain = audioCtx.createGain();
      pursuitPulseOsc.type = "triangle";
      pursuitPulseOsc.frequency.value = 82;
      pursuitPulseGain.gain.value = 0;
      pursuitPulseOsc.connect(pursuitPulseGain);
      pursuitPulseGain.connect(audioCtx.destination);
      pursuitPulseOsc.start();
      let up = true;
      pursuitPulseTimer = setInterval(function () {
        if (!pursuitPulseGain) return;
        pursuitPulseGain.gain.setTargetAtTime(up ? musicVol * 0.055 : musicVol * 0.012, audioCtx.currentTime, 0.08);
        up = !up;
      }, 520);
    } else if (!on && pursuitPulseOsc) {
      clearInterval(pursuitPulseTimer);
      pursuitPulseTimer = null;
      try { pursuitPulseOsc.stop(); } catch (e) {}
      pursuitPulseOsc.disconnect();
      pursuitPulseGain.disconnect();
      pursuitPulseOsc = null;
      pursuitPulseGain = null;
    }
  }

  function stopPursuitPulse() {
    if (!pursuitPulseOsc) return;
    clearInterval(pursuitPulseTimer);
    pursuitPulseTimer = null;
    try { pursuitPulseOsc.stop(); } catch (e) {}
    pursuitPulseOsc.disconnect();
    pursuitPulseGain.disconnect();
    pursuitPulseOsc = null;
    pursuitPulseGain = null;
  }

  function updatePursuitUI() {
    const active = isPursuitActive();
    ROOT.classList.toggle("bm-pursuit", active);
    ROOT.classList.toggle("bm-pursuit-urgent", false);
    if (els.pursuitWrap) els.pursuitWrap.hidden = !active;
    if (!active) {
      syncPursuitPulse();
      return;
    }
    const elapsed = Date.now() - sectorStartedAt;
    const limit = pursuitLimitMs();
    const left = limit - elapsed;
    if (left <= 0) {
      pursuitTimedOut();
      return;
    }
    if (els.pursuitTimer) {
      els.pursuitTimer.textContent = "PURSUIT · " + fmtTime(left) + " · trace closing";
    }
    if (left < 20000) ROOT.classList.add("bm-pursuit-urgent");
    if (els.rain) els.rain.style.filter = "brightness(1.25) saturate(1.35) hue-rotate(-55deg)";
    if (els.rainBack) els.rainBack.style.filter = "brightness(1.15) hue-rotate(-40deg)";
    syncPursuitPulse();
  }

  function updateGhostRace() {
    const ghost = ghostPbMs();
    const show = playing && !paused && !won && !geniusMode && !dailyMode && ghost;
    if (els.ghostRace) els.ghostRace.hidden = !show;
    if (!show || !els.ghostFill || !els.ghostLabel) return;
    const elapsed = Date.now() - sectorStartedAt;
    const pct = Math.min(100, Math.round(elapsed / ghost * 100));
    els.ghostFill.style.width = pct + "%";
    if (els.ghostMark) els.ghostMark.style.left = "100%";
    const delta = elapsed - ghost;
    if (delta > 0) {
      els.ghostLabel.textContent = "GHOST +" + fmtSec(delta) + " ahead · PB " + fmtTime(ghost);
      els.ghostFill.classList.add("bm-behind");
    } else {
      els.ghostLabel.textContent = "YOU +" + fmtSec(-delta) + " ahead · PB " + fmtTime(ghost);
      els.ghostFill.classList.remove("bm-behind");
    }
  }

  function pursuitTimedOut() {
    if (!playing || won) return;
    addWanted(8);
    setStatus("PURSUED — NexCorp trace timed out your node.", "err");
    beep(55, 0.4, "sawtooth", 0.14);
    haptic([80, 40, 80]);
    failOut();
  }

  function bountyTag() {
    return "HEAT " + (records.wanted || 0) + "% · " + (loadoutPerk || "chain").toUpperCase();
  }

  var _tickPursuit = tick;
  tick = function () {
    _tickPursuit();
    updatePursuitUI();
    updateGhostRace();
  };

  var _checkPursuit = checkBoard;
  checkBoard = function () {
    const m0 = mistakes;
    const s0 = score;
    _checkPursuit();
    if (mistakes > m0 && isPursuitActive()) {
      const pen = Math.max(90, Math.floor(Math.max(s0, score) * 0.1));
      score = Math.max(0, score - pen);
      updateHUD();
      setStatus("Pursuit penalty · −" + pen + " score · strikes cost double under trace", "err");
      beep(140, 0.12, "sawtooth", 0.1);
    }
  };

  var _loadGridPursuit = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridPursuit(freshRun);
    setTimeout(function () {
      updatePursuitUI();
      updateGhostRace();
      if (els.rain && !isPursuitActive()) {
        els.rain.style.filter = "";
        if (els.rainBack) els.rainBack.style.filter = "";
      }
    }, 60);
  };

  var _showMenuPursuit = showMenu;
  showMenu = function () {
    applyMenuHeatDecay();
    stopPursuitPulse();
    ROOT.classList.remove("bm-pursuit", "bm-pursuit-urgent");
    if (els.rain) els.rain.style.filter = "";
    if (els.rainBack) els.rainBack.style.filter = "";
    _showMenuPursuit();
    updateBountyBoard();
  };

  var _failOutPursuit = failOut;
  failOut = function () {
    stopPursuitPulse();
    ROOT.classList.remove("bm-pursuit", "bm-pursuit-urgent");
    _failOutPursuit();
  };

  var _stopMusicPursuit = stopMusic;
  stopMusic = function () {
    stopPursuitPulse();
    _stopMusicPursuit();
  };

  var _shareTextPursuit = shareText;
  shareText = function () {
    return _shareTextPursuit() + " · " + bountyTag();
  };

  var _shareChallengePursuit = shareChallengeLink;
  shareChallengeLink = function () {
    const seed = challengeSeed || (dateSeed() ^ (gridLevel + 1) * 7919);
    const base = location.href.split("#")[0].split("?")[0];
    const url = base + (base.indexOf("?") >= 0 ? "&" : "?") + "seed=" + seed;
    const txt = "THE BINARY MATRIX · bounty challenge · " + bountyTag() + " · beat seed " + seed + " · " + url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        if (els.challengeLink) {
          els.challengeLink.textContent = "BOUNTY COPIED!";
          setTimeout(function () { els.challengeLink.textContent = "CHALLENGE LINK"; }, 1600);
        }
      }).catch(function () {});
    }
    beep(720, 0.06, "triangle", 0.06);
  };

  var _relayPayloadPursuit = relayPayload;
  relayPayload = function () {
    try {
      const p = JSON.parse(_relayPayloadPursuit());
      p.wanted = records.wanted || 0;
      p.loadout = loadoutPerk || "chain";
      p.bounty = bountyTag();
      return JSON.stringify(p);
    } catch (e) {
      return _relayPayloadPursuit();
    }
  };

  var _shareRelayPursuit = shareRelayLink;
  shareRelayLink = function () {
    _shareRelayPursuit();
    setStatus("Relay copied · squad sees your " + bountyTag(), "ok");
  };

  var _syncHumPursuit = syncHum;
  syncHum = function () {
    _syncHumPursuit();
    if (humOsc && isPursuitActive()) humOsc.frequency.value = 72;
    else if (humOsc) humOsc.frequency.value = 58;
  };

  updateBountyBoard();
  updateWantedUI();
