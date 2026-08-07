// === QA SPRINT — browser playthrough harness (window.__BM_QA) ===
  let qaBusy = false;

  function qaWait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms || 0); });
  }

  function qaWaitFor(pred, timeoutMs, stepMs) {
    timeoutMs = timeoutMs || 30000;
    stepMs = stepMs || 50;
    const t0 = Date.now();
    return new Promise(function (resolve, reject) {
      function tick() {
        try {
          if (pred()) return resolve(true);
        } catch (e) {
          return reject(e);
        }
        if (Date.now() - t0 >= timeoutMs) return reject(new Error("qaWaitFor timeout"));
        setTimeout(tick, stepMs);
      }
      tick();
    });
  }

  function qaHexKey(bytes) {
    return bytes.map(hexByte).join("");
  }

  function qaCrackGate(ch) {
    if (ch.syndrome) {
      const probe = new Array(ch.len).fill(0);
      const res = runNX8(ch.code, probe, ch.leak);
      if (res.err) throw new Error("probe fault: " + res.err);
      return res.out.slice(0, ch.len);
    }
    const n = ch.len;
    const found = new Array(n).fill(0);
    for (let pos = 0; pos < n; pos++) {
      let hit = false;
      for (let b = 0; b < 256; b++) {
        const trial = found.slice(0, pos).concat([b]).concat(new Array(n - pos - 1).fill(0));
        const res = runNX8(ch.code, trial, false);
        if (res.err) throw new Error("trial fault: " + res.err);
        if (outOk(res.out)) return trial;
        if (prefixScore(trial, ch.key) >= pos + 1) {
          found[pos] = b;
          hit = true;
          break;
        }
      }
      if (!hit) throw new Error("crack failed at pos " + pos);
    }
    const ok = runNX8(ch.code, found, false);
    if (!outOk(ok.out)) throw new Error("cracked key rejected");
    return found;
  }

  function qaDismissOverlays() {
    try { dismissBlockers(); } catch (e) {}
    if (els.pauseOv) els.pauseOv.classList.remove("show");
    if (els.sector) els.sector.classList.remove("show");
    if (els.storyBrief) els.storyBrief.classList.remove("show");
    if (els.boot) els.boot.classList.remove("show");
    if (els.victory) els.victory.classList.remove("show");
    if (els.bossIntro) els.bossIntro.classList.remove("show");
    if (els.callsignOv) els.callsignOv.classList.remove("show");
    if (els.ftue) els.ftue.classList.remove("show");
    paused = false;
  }

  function qaSeed() {
    records.callsign = "QA_BOT";
    records.ftueDone = true;
    records.storyBriefSeen = true;
    records.fastBoot = true;
    records.bootVisits = 99;
    saveRecords();
    updateCallsignDisplay();
    qaDismissOverlays();
    try { showMenu(); } catch (e) {}
    if (typeof setPlayView === "function") setPlayView("campaign");
    return {
      callsign: records.callsign,
      clears: records.clears || {}
    };
  }

  function qaSetDiff(diff) {
    difficulty = diff;
    ROOT.querySelectorAll(".bm-diff").forEach(function (b) {
      b.classList.toggle("selected", b.dataset.diff === diff);
    });
    applyMood();
    updateBestDisplay();
  }

  function qaSetLoadout(id) {
    loadoutPerk = id || "chain";
    records.loadout = loadoutPerk;
    saveRecords();
    if (els.loadoutRoot) {
      els.loadoutRoot.querySelectorAll(".bm-loadout-btn").forEach(function (b) {
        b.classList.toggle("selected", b.dataset.loadout === loadoutPerk);
      });
    }
  }

  function qaSetCrew(id) {
    records.syndicateCrew = id || "ghosts";
    saveRecords();
    if (typeof syncSyndicateCrewUI === "function") syncSyndicateCrewUI();
    else if (els.syndicateCrew) {
      els.syndicateCrew.querySelectorAll(".bm-crew-btn").forEach(function (b) {
        b.classList.toggle("selected", b.dataset.crew === records.syndicateCrew);
      });
    }
  }

  function qaPrepMenu() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    qaDismissOverlays();
    playing = false;
    won = false;
    geniusMode = false;
    dailyMode = false;
    omegaMode = false;
    arcadeMode = false;
    hideVictory();
    try { showMenu(); } catch (e) {}
    if (typeof setPlayView === "function") setPlayView("campaign");
  }

  function qaForceSolve() {
    if (!playing || won || geniusMode || !solution) return false;
    grid = clone(solution);
    renderGrid(false);
    onWin();
    return true;
  }

  function qaStartGridCampaign(diff) {
    qaPrepMenu();
    qaSetDiff(diff);
    sectorCodes = [];
    clearLink();
    gridLevel = 0;
    hideVictory();
    applyMood();
    els.menu.classList.add("bm-hidden");
    if (els.genius) els.genius.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    notifyParent(true);
    loadGridSector(true);
  }

  async function qaPlayCampaign(diff, opts) {
    opts = opts || {};
    const len = CAMPAIGN[diff] ? CAMPAIGN[diff].length : 0;
    if (!len) throw new Error("unknown diff " + diff);
    if (opts.loadout) qaSetLoadout(opts.loadout);
    if (opts.crew) qaSetCrew(opts.crew);
    qaStartGridCampaign(diff);
    await qaWaitFor(function () { return playing && !won && !!solution; }, 12000);
    const sectors = [];
    for (let i = 0; i < len; i++) {
      const t0 = Date.now();
      if (!playing || won) throw new Error("not playing before sector " + (i + 1));
      if (!qaForceSolve()) throw new Error("solve failed sector " + (i + 1));
      if (i < len - 1) {
        await qaWaitFor(function () { return playing && !won && !!solution && gridLevel === i + 1; }, 8000);
      } else {
        await qaWaitFor(function () { return won && els.victory && els.victory.classList.contains("show"); }, 8000);
      }
      sectors.push({ index: i + 1, ms: Date.now() - t0, gridLevel: gridLevel, won: won });
    }
    const cleared = !!(records.clears && records.clears[diff]);
    return { diff: diff, sectors: sectors, cleared: cleared, score: score };
  }

  async function qaPlayGenius(opts) {
    opts = opts || {};
    if (opts.loadout) qaSetLoadout(opts.loadout);
    qaPrepMenu();
    qaSetDiff("genius");
    startGenius();
    await qaWaitFor(function () { return geniusMode && playing && vmChallenges && vmChallenges.length === 8; }, 8000);
    const gates = [];
    for (let i = 0; i < 8; i++) {
      await qaWaitFor(function () { return vmLevel === i && playing && !won; }, 5000);
      const ch = vmChallenges[i];
      const key = qaCrackGate(ch);
      if (els.probe) els.probe.value = qaHexKey(new Array(ch.len).fill(0));
      runProbe();
      if (els.answer) els.answer.value = qaHexKey(key);
      submitKey();
      gates.push({ gate: i + 1, key: qaHexKey(key) });
      if (i === 7) {
        await qaWaitFor(function () { return won && els.victory && els.victory.classList.contains("show"); }, 8000);
      } else {
        await qaWaitFor(function () { return vmLevel === i + 1 && playing && !won; }, 5000);
      }
    }
    return { gates: gates, cleared: !!(records.clears && records.clears.genius), score: score };
  }

  function qaClick(sel) {
    const el = ROOT.querySelector(sel);
    if (!el) return { ok: false, error: "missing " + sel };
    el.click();
    return { ok: true };
  }

  async function qaTestHubTabs() {
    const tabs = ["play", "ops", "intel", "market", "more"];
    const out = [];
    for (let i = 0; i < tabs.length; i++) {
      const id = tabs[i];
      const btn = ROOT.querySelector('.bm-hub-tab[data-hub-tab="' + id + '"]');
      if (!btn) { out.push({ tab: id, ok: false, error: "no tab btn" }); continue; }
      btn.click();
      await qaWait(80);
      const panel = ROOT.querySelector('#bm-hub-' + id);
      const ok = !!(panel && !panel.hidden && btn.classList.contains("selected"));
      out.push({ tab: id, ok: ok });
    }
    if (typeof setPlayView === "function") setPlayView("campaign");
    return out;
  }

  async function qaTestLoadouts() {
    const perks = ["chain", "ping", "strike", "heat"];
    const out = [];
    for (let i = 0; i < perks.length; i++) {
      const id = perks[i];
      qaSetLoadout(id);
      const btn = els.loadoutRoot && els.loadoutRoot.querySelector('.bm-loadout-btn[data-loadout="' + id + '"]');
      const selected = !!(btn && btn.classList.contains("selected") && loadoutPerk === id);
      out.push({ perk: id, selected: selected });
    }
    return out;
  }

  async function qaTestCrew() {
    const crews = ["hunters", "ghosts", "mercs"];
    const out = [];
    for (let i = 0; i < crews.length; i++) {
      const id = crews[i];
      qaSetCrew(id);
      const btn = els.syndicateCrew && els.syndicateCrew.querySelector('.bm-crew-btn[data-crew="' + id + '"]');
      const selected = !!(btn && btn.classList.contains("selected") && records.syndicateCrew === id);
      out.push({ crew: id, selected: selected });
    }
    return out;
  }

  async function qaTestInGameButtons() {
    qaSeed();
    qaSetLoadout("chain");
    qaStartGridCampaign("easy");
    await qaWaitFor(function () { return playing && !won && !!solution; }, 12000);
    const out = [];
    function push(name, fn) {
      try {
        fn();
        out.push({ btn: name, ok: true });
      } catch (e) {
        out.push({ btn: name, ok: false, error: String(e && e.message || e) });
      }
    }
    push("pause", function () { togglePause(); });
    push("resume", function () { togglePause(); });
    push("check", function () { checkBoard(); });
    push("ping-disabled", function () { pingHint(); });
    push("menu", function () { showMenu(); });
    await qaWait(120);
    push("restart", function () {
      if (typeof restartSame === "function") restartSame();
    });
    return out;
  }

  function qaSnapshot() {
    return {
      difficulty: difficulty,
      gridLevel: gridLevel,
      playing: playing,
      won: won,
      paused: paused,
      geniusMode: geniusMode,
      loadout: loadoutPerk,
      crew: records.syndicateCrew,
      score: score,
      mistakes: mistakes,
      maxMistakes: maxMistakes,
      clears: records.clears || {}
    };
  }

  async function qaRunSuite() {
    if (qaBusy) throw new Error("QA already running");
    qaBusy = true;
    const report = { startedAt: new Date().toISOString(), pass: true, results: [] };
    function finish(entry) {
      report.results.push(entry);
      if (!entry.ok) report.pass = false;
    }
    try {
      qaSeed();
      finish({ test: "seed", ok: true, data: qaSeed() });

      const hub = await qaTestHubTabs();
      finish({ test: "hub-tabs", ok: hub.every(function (x) { return x.ok; }), data: hub });

      const loadouts = await qaTestLoadouts();
      finish({ test: "loadouts", ok: loadouts.every(function (x) { return x.selected; }), data: loadouts });

      const crew = await qaTestCrew();
      finish({ test: "crew", ok: crew.every(function (x) { return x.selected; }), data: crew });

      const buttons = await qaTestInGameButtons();
      finish({ test: "ingame-buttons", ok: buttons.every(function (x) { return x.ok; }), data: buttons });

      for (let d = 0; d < 3; d++) {
        const diff = ["easy", "medium", "hard"][d];
        try {
          qaSeed();
          const r = await qaPlayCampaign(diff, { loadout: "chain", crew: "ghosts" });
          finish({ test: "campaign-" + diff, ok: r.cleared, data: r });
        } catch (e) {
          finish({ test: "campaign-" + diff, ok: false, error: String(e && e.message || e) });
        }
      }

      try {
        qaSeed();
        const g = await qaPlayGenius({ loadout: "chain" });
        finish({ test: "genius", ok: g.cleared, data: g });
      } catch (e) {
        finish({ test: "genius", ok: false, error: String(e && e.message || e) });
      }

      try {
        qaSeed();
        qaSetLoadout("strike");
        qaStartGridCampaign("easy");
        await qaWaitFor(function () { return playing && !won; }, 12000);
        const base = CAMPAIGN.easy[0][2];
        const strikeOk = maxMistakes >= base + 1;
        finish({ test: "perk-strike", ok: strikeOk, data: { base: base, maxMistakes: maxMistakes } });
      } catch (e) {
        finish({ test: "perk-strike", ok: false, error: String(e && e.message || e) });
      }
    } finally {
      qaBusy = false;
      report.finishedAt = new Date().toISOString();
      window.__BM_QA_REPORT = report;
    }
    return report;
  }

  const qaHostOk = /localhost|127\.0\.0\.1/i.test(location.hostname);
  const qaFlag = /\bqa=1\b/.test(location.search);
  if (qaHostOk || qaFlag) {
    window.__BM_QA = {
      seed: qaSeed,
      snapshot: qaSnapshot,
      setDiff: qaSetDiff,
      setLoadout: qaSetLoadout,
      setCrew: qaSetCrew,
      playCampaign: qaPlayCampaign,
      playGenius: qaPlayGenius,
      runSuite: qaRunSuite,
      dismiss: qaDismissOverlays,
      forceSolve: qaForceSolve
    };
    window.__BM_QA_READY = true;
  }
