  // === SIGNAL WAR SPRINT — audio layers, rain, stingers, fast boot ===
  let signalOsc = null;
  let signalGain = null;
  let signalMood = "calm";
  let lastRainMul = 1;
  let rankStingerPlaying = false;

  if (records.fastBoot == null) records.fastBoot = false;

  Object.assign(els, {
    fastBootToggle: ROOT.querySelector("#bm-fast-boot")
  });

  function getSignalMood() {
    if (typeof contractMode !== "undefined" && contractMode) return "contract";
    if (ROOT.classList.contains("bm-mood-contract")) return "contract";
    if (ROOT.classList.contains("bm-mood-boss") || ROOT.classList.contains("bm-extract-active")) return "boss";
    if (typeof isPursuitActive === "function" && isPursuitActive()) return "pursuit";
    if (ROOT.classList.contains("bm-mood-deepnet")) return "pursuit";
    return "calm";
  }

  function stopSignalLayer() {
    if (!signalOsc) return;
    try { signalOsc.stop(); } catch (e) {}
    signalOsc.disconnect();
    signalGain.disconnect();
    signalOsc = null;
    signalGain = null;
  }

  function syncSignalWar() {
    if (muted || !musicVol || REDUCED_MOTION || !playing) {
      stopSignalLayer();
      return;
    }
    const mood = getSignalMood();
    if (mood === signalMood && signalOsc) return;
    signalMood = mood;
    stopSignalLayer();
    if (mood === "calm") return;
    ensureAudio();
    const freqs = { pursuit: 108, boss: 72, contract: 138 };
    const vols = { pursuit: 0.04, boss: 0.055, contract: 0.045 };
    signalOsc = audioCtx.createOscillator();
    signalGain = audioCtx.createGain();
    signalOsc.type = mood === "boss" ? "sawtooth" : "triangle";
    signalOsc.frequency.value = freqs[mood] || 100;
    signalGain.gain.value = musicVol * (vols[mood] || 0.04);
    signalOsc.connect(signalGain);
    signalGain.connect(audioCtx.destination);
    signalOsc.start();
    ROOT.classList.toggle("bm-signal-pursuit", mood === "pursuit");
    ROOT.classList.toggle("bm-signal-boss", mood === "boss");
    ROOT.classList.toggle("bm-signal-contract", mood === "contract");
  }

  function playRankStinger(rankName) {
    if (rankStingerPlaying || muted) return;
    rankStingerPlaying = true;
    const r = (rankName || "").toUpperCase();
    let seq = [523, 659, 784];
    if (r.indexOf("GHOST") >= 0 || r.indexOf("PHANTOM") >= 0) seq = [440, 554, 659, 880];
    if (r.indexOf("OMEGA") >= 0 || r.indexOf("KINGPIN") >= 0) seq = [330, 415, 523, 659, 880, 1046];
    if (r.indexOf("OPERATOR") >= 0 || r.indexOf("FIXER") >= 0) seq = [494, 587, 698];
    seq.forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.16, "triangle", 0.11); }, i * 100);
    });
    setTimeout(function () { rankStingerPlaying = false; }, seq.length * 100 + 200);
  }

  var _drawRainSignal = drawRain;
  drawRain = function () {
    if (REDUCED_MOTION) return;
    const left = playing && !won ? Math.max(0, maxMistakes - mistakes) : maxMistakes;
    const mul = playing && !won ? 1 + (maxMistakes - left) * 0.2 : 1;
    for (let i = 0; i < speeds.length; i++) {
      speeds[i] /= lastRainMul;
      speeds[i] *= mul;
    }
    lastRainMul = mul;
    if (left <= 1 && playing) {
      rainHue = "#ff6b81";
      rainBright = "#ff3355";
    } else if (typeof applyMood === "function" && !ROOT.classList.contains("bm-mood-boss")) {
      applyMood();
    }
    _drawRainSignal();
  };

  var _showRankUpSignal = showRankUp;
  showRankUp = function (newRank) {
    _showRankUpSignal(newRank);
    playRankStinger(newRank);
    if (typeof computeSyndicateRank === "function") {
      setTimeout(function () { playRankStinger(computeSyndicateRank()); }, 450);
    }
  };

  var _runBootSignal = runBoot;
  runBoot = function (cb) {
    records.bootVisits = (records.bootVisits || 0) + 1;
    const veteran = records.fastBoot || records.bootVisits > 2 ||
      (records.clears && (records.clears.medium || records.clears.hard)) ||
      (typeof computeSyndicateRank === "function" && computeSyndicateRank() !== "RECRUIT");
    if (veteran && els.boot && els.bootLog) {
      els.menu.classList.add("bm-hidden");
      els.boot.classList.add("show");
      els.bootLog.textContent = "";
      const lines = [
        "NEXCORP UPLINK · VETERAN CHANNEL",
        "Operator " + (records.callsign || "GHOST") + " authenticated.",
        "> JACK IN READY_"
      ];
      lines.forEach(function (t) {
        const span = document.createElement("span");
        span.className = "hi";
        span.textContent = t + "\n";
        els.bootLog.appendChild(span);
      });
      beep(880, 0.06, "square", 0.06);
      setTimeout(function () {
        bootDone = true;
        els.boot.classList.remove("show");
        if (els.menu) els.menu.classList.remove("bm-hidden");
        cb();
      }, 700);
      return;
    }
    _runBootSignal(cb);
  };

  var _tickSignal = tick;
  tick = function () {
    _tickSignal();
    syncSignalWar();
  };

  var _stopMusicSignal = stopMusic;
  stopMusic = function () {
    stopSignalLayer();
    ROOT.classList.remove("bm-signal-pursuit", "bm-signal-boss", "bm-signal-contract");
    _stopMusicSignal();
  };

  var _showMenuSignal = showMenu;
  showMenu = function () {
    stopSignalLayer();
    _showMenuSignal();
    if (els.fastBootToggle) els.fastBootToggle.checked = !!records.fastBoot;
  };

  if (els.fastBootToggle) {
    els.fastBootToggle.addEventListener("change", function () {
      records.fastBoot = !!els.fastBootToggle.checked;
      saveRecords();
    });
  }
