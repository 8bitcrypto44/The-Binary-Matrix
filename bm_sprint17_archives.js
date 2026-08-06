  // === NEXCORP ARCHIVES SPRINT — memos, world events, archivist ===
  const ARCHIVE_MEMOS = {
    boss: { title: "MEMO · FINAL GATE", text: "NexCorp apex nodes bleed red telemetry. Operators who linger get logged twice." },
    extract: { title: "MEMO · EXFIL ROUTE", text: "Three-node extraction paths exist. Hunters converge on heat max — move fast." },
    contract: { title: "MEMO · BLACK CONTRACT", text: "Weekly contracts are bait. The payout is real. So is the trace." },
    pursuit: { title: "MEMO · HUNTER DIVISION", text: "70% heat triggers pursuit sweeps. Counter-intel buys one breath." },
    prestige: { title: "MEMO · PRESTIGE LINK", text: "Ascended operators keep syndicate rank but burn their heat signature." },
    root: { title: "MEMO · ROOT PROTOCOL", text: "Classified 8×8 core exists below OMEGA. One strike. No mercy." },
    daily: { title: "MEMO · DAILY NODE", text: "Global daily grids sync at midnight UTC. Fair loadout locked worldwide." },
    syndicate: { title: "MEMO · SYNDICATE", text: "Ghost bets and relay boards are how underground operators rank each other." }
  };

  const WORLD_EVENTS = [
    "NexCorp redeployed hunter division to sector 7 — pursuit timers tightened.",
    "Black market contracts rotating · phantom ledger active this week.",
    "Relay traffic up 22% · syndicate ghost bets flagged by compliance.",
    "Deep Net side doors opening above 70% heat · kernel probes detected.",
    "OMEGA chain runners breaching triple 8×8 nodes — root access logs spiking.",
    "Daily empire streak insurance sales up · operators playing long game.",
    "Challenge war duels spreading · beat-my-ghost links on every relay.",
    "Archivist clearance rumored · collect every leaked file to earn it."
  ];

  const BOOK_LINK = "https://www.8bitcrypto44.xyz";

  if (!records.archiveMemos) records.archiveMemos = [];
  if (!records.loreSeen) records.loreSeen = [];

  Object.assign(els, {
    archivesPanel: ROOT.querySelector("#bm-archives"),
    worldEvent: ROOT.querySelector("#bm-world-event"),
    declassifiedLink: ROOT.querySelector("#bm-declassified")
  });

  function unlockArchive(key) {
    if (!ARCHIVE_MEMOS[key]) return;
    if (records.archiveMemos.indexOf(key) >= 0) return;
    records.archiveMemos.push(key);
    saveRecords();
    renderArchives();
    checkArchivist();
  }

  function markLoreSeen(idx) {
    records.loreSeen = records.loreSeen || [];
    if (records.loreSeen.indexOf(idx) < 0) {
      records.loreSeen.push(idx);
      saveRecords();
      checkArchivist();
      renderArchives();
    }
  }

  function isArchivist() {
    return (records.loreSeen || []).length >= LORE_QUOTES.length &&
      (records.archiveMemos || []).length >= 6;
  }

  function checkArchivist() {
    if (isArchivist() && !records.archivist) {
      records.archivist = true;
      saveRecords();
      if (typeof appendArchive === "function") appendArchive("ARCHIVIST CLEARANCE GRANTED");
      setStatus("ARCHIVIST badge unlocked · all files declassified", "ok");
    }
  }

  function renderArchives() {
    if (!els.archivesPanel) return;
    const keys = records.archiveMemos || [];
    if (!keys.length) {
      els.archivesPanel.innerHTML = "<span class=\"bm-archive-empty\">NEXCORP ARCHIVES · breach nodes to leak memos</span>";
      return;
    }
    let html = keys.map(function (k) {
      const m = ARCHIVE_MEMOS[k];
      return m ? ("<div class=\"bm-archive-memo\"><b>" + m.title + "</b> · " + m.text + "</div>") : "";
    }).join("");
    html += "<div class=\"bm-archive-meta\">LORE " + (records.loreSeen || []).length + "/" +
      LORE_QUOTES.length + " · FILES " + keys.length + "/" + Object.keys(ARCHIVE_MEMOS).length;
    if (isArchivist()) html += " · ARCHIVIST";
    html += "</div>";
    els.archivesPanel.innerHTML = html;
  }

  function updateWorldEvent() {
    const ev = WORLD_EVENTS[dateSeed() % WORLD_EVENTS.length];
    if (els.worldEvent) els.worldEvent.textContent = "WORLD EVENT · " + ev;
    if (els.bulletin && !pendingDuel) {
      const cur = els.bulletin.textContent || "";
      if (cur.indexOf("CHALLENGE WAR") < 0) {
        els.bulletin.textContent = ev;
      }
    }
  }

  var _showSectorArch = showSectorCard;
  showSectorCard = function (clearedLabel, code, nextLabel, cb, loreQuote) {
    const idx = gridLevel % LORE_QUOTES.length;
    markLoreSeen(idx);
    if (typeof isBossSector === "function" && isBossSector()) unlockArchive("boss");
    _showSectorArch(clearedLabel, code, nextLabel, cb, loreQuote);
  };

  var _completeExtractArch = completeExtraction;
  completeExtraction = function () {
    unlockArchive("extract");
    _completeExtractArch();
  };

  var _completeContractArch = completeContract;
  completeContract = function () {
    unlockArchive("contract");
    _completeContractArch();
  };

  var _acceptPrestigeArch = acceptPrestige;
  acceptPrestige = function () {
    unlockArchive("prestige");
    _acceptPrestigeArch();
  };

  var _completeRootArch = completeRootProtocol;
  completeRootProtocol = function () {
    unlockArchive("root");
    _completeRootArch();
  };

  var _onWinArch = onWin;
  onWin = function () {
    _onWinArch();
    if (!won) return;
    if (dailyMode) unlockArchive("daily");
    if (typeof isPursuitActive === "function" && isPursuitActive()) unlockArchive("pursuit");
    if (typeof computeSyndicateRank === "function" && computeSyndicateRank() !== "RECRUIT") {
      unlockArchive("syndicate");
    }
  };

  var _computeBadgesArch = computeBadges;
  computeBadges = function (opts) {
    const b = _computeBadgesArch(opts);
    if (isArchivist()) b.push("ARCHIVIST");
    if (duelMode) b.push("DUEL");
    return b;
  };

  var _showMenuArch = showMenu;
  showMenu = function () {
    _showMenuArch();
    updateWorldEvent();
    renderArchives();
  };

  if (els.declassifiedLink) {
    els.declassifiedLink.href = BOOK_LINK;
    els.declassifiedLink.target = "_blank";
  }

  updateWorldEvent();
  renderArchives();
  checkArchivist();
