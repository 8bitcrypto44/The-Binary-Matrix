  // === DAILY EMPIRE SPRINT — calendar, ghost board, loadout lock, insurance ===
  const DAILY_LOADOUTS = ["chain", "ping", "strike", "heat"];

  if (!records.heatCalendar) records.heatCalendar = [];
  if (!records.dailyGhostBoard) records.dailyGhostBoard = [];

  Object.assign(els, {
    heatCalendar: ROOT.querySelector("#bm-heat-calendar"),
    dailyGhostBoard: ROOT.querySelector("#bm-daily-ghost-board"),
    dailyLoadoutLine: ROOT.querySelector("#bm-daily-loadout-line"),
    streakInsureBtn: ROOT.querySelector("#bm-streak-insure")
  });

  function dailyLockedLoadout() {
    return DAILY_LOADOUTS[dateSeed() % DAILY_LOADOUTS.length];
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function weekStampCount() {
    const set = {};
    (records.heatCalendar || []).forEach(function (d) { set[d] = true; });
    let n = 0;
    for (let i = 0; i < 7; i++) if (set[daysAgo(i)]) n++;
    return n;
  }

  function stampHeatCalendar() {
    const today = dateSeed();
    records.heatCalendar = records.heatCalendar || [];
    if (records.heatCalendar.indexOf(today) < 0) {
      records.heatCalendar.push(today);
      records.heatCalendar = records.heatCalendar.slice(-14);
    }
    if (weekStampCount() >= 7) {
      records.heatCalendar = records.heatCalendar.filter(function (d) { return d !== today; });
      records.heatCalendar.push(today);
      if (typeof addCredits === "function") addCredits(500);
      setStatus("Weekly heat calendar complete · +500 CR syndicate bonus", "ok");
    }
    saveRecords();
    renderHeatCalendar();
  }

  function renderHeatCalendar() {
    if (!els.heatCalendar) return;
    const set = {};
    (records.heatCalendar || []).forEach(function (d) { set[d] = true; });
    if (records.dailyLastClear === dateSeed()) set[dateSeed()] = true;
    let html = "";
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i);
      const on = !!set[d];
      html += "<span class=\"bm-cal-day" + (on ? " done" : "") + "\">" + (on ? "◈" : "·") + "</span>";
    }
    els.heatCalendar.innerHTML = html;
    els.heatCalendar.title = "Weekly calendar · 7 stamps = +500 CR · " + weekStampCount() + "/7";
  }

  function pushDailyGhost(entry) {
    records.dailyGhostBoard = records.dailyGhostBoard || [];
    records.dailyGhostBoard.unshift(entry);
    records.dailyGhostBoard = records.dailyGhostBoard.slice(0, 5);
    saveRecords();
    renderDailyGhostBoard();
  }

  function renderDailyGhostBoard() {
    if (!els.dailyGhostBoard) return;
    const rows = records.dailyGhostBoard || [];
    if (!rows.length) {
      els.dailyGhostBoard.innerHTML = "<span class=\"bm-dg-empty\">DAILY GHOST BOARD · clear daily to rank</span>";
      return;
    }
    els.dailyGhostBoard.innerHTML = rows.map(function (e, i) {
      return "<div class=\"bm-dg-row" + (i === 0 ? " top" : "") + "\"><b>" +
        (e.callsign || "GHOST") + "</b> · " + e.score + " pts · " + fmtTime(e.t) +
        (e.pct ? " · top " + e.pct + "%" : "") + "</div>";
    }).join("");
  }

  function updateDailyEmpireUI() {
    renderHeatCalendar();
    renderDailyGhostBoard();
    if (els.dailyLoadoutLine) {
      els.dailyLoadoutLine.textContent = "TODAY'S FAIR LOADOUT · " + dailyLockedLoadout().toUpperCase() +
        " · all operators locked same perk";
    }
    if (els.streakInsureBtn) {
      els.streakInsureBtn.disabled = !!records.streakInsured || (records.credits || 0) < 150;
      els.streakInsureBtn.textContent = records.streakInsured
        ? "STREAK INSURED · active"
        : "STREAK INSURANCE · 150 CR";
    }
  }

  function buyStreakInsurance() {
    if (records.streakInsured) return;
    if (typeof spendCredits !== "function" || !spendCredits(150)) {
      setStatus("Streak insurance costs 150 CR.", "err");
      return;
    }
    records.streakInsured = true;
    saveRecords();
    updateDailyEmpireUI();
    setStatus("Streak insured · next missed day won't break chain", "ok");
    beep(660, 0.08, "triangle", 0.07);
  }

  var _startDailyEmpire = startDaily;
  startDaily = function () {
    loadoutPerk = dailyLockedLoadout();
    records.loadout = loadoutPerk;
    saveRecords();
    if (els.loadoutRoot) {
      els.loadoutRoot.querySelectorAll(".bm-loadout-btn").forEach(function (b) {
        b.classList.toggle("selected", b.dataset.loadout === loadoutPerk);
      });
    }
    _startDailyEmpire();
    setStatus("Daily node · fair loadout " + loadoutPerk.toUpperCase() + " · 6×6", "ok");
  };

  var _bumpDailyEmpire = bumpDailyStreak;
  bumpDailyStreak = function () {
    const today = dateSeed();
    const last = records.dailyLastClear || 0;
    if (last === today) return;
    const yesterday = today - 1;
    const contiguous = last === yesterday || last === today - 1;
    if (!contiguous && last && records.streakInsured) {
      records.streakInsured = false;
      records.dailyStreak = (records.dailyStreak || 0) + 1;
      records.dailyLastClear = today;
      saveRecords();
      updateStreakDisplay();
      setStatus("Streak insurance used · chain preserved", "ok");
      return;
    }
    _bumpDailyEmpire();
  };

  var _onWinDailyEmpire = onWin;
  onWin = function () {
    const wasDaily = dailyMode;
    const t0 = sectorStartedAt || sectorClock;
    _onWinDailyEmpire();
    if (!won || !wasDaily) return;
    stampHeatCalendar();
    const pct = typeof dailyPercentile === "function" ? dailyPercentile(score) : 50;
    pushDailyGhost({
      callsign: records.callsign || "GHOST",
      score: score,
      t: Date.now() - t0,
      pct: pct,
      day: dateSeed()
    });
    updateDailyEmpireUI();
  };

  var _showMenuDaily = showMenu;
  showMenu = function () {
    _showMenuDaily();
    updateDailyEmpireUI();
  };

  if (els.streakInsureBtn) els.streakInsureBtn.addEventListener("click", buyStreakInsurance);
  updateDailyEmpireUI();
