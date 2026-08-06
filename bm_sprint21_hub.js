  // === HUB SPRINT — tabbed operator terminal (scalable menu) ===
  const HUB_TAB_KEY = "bm_hub_tab";
  const HUB_TABS = ["play", "ops", "intel", "market", "more"];
  const hubTabsEl = ROOT.querySelector("#bm-hub-tabs");
  const hubPanels = ROOT.querySelectorAll(".bm-hub-panel");
  const hubTabBtns = hubTabsEl ? hubTabsEl.querySelectorAll(".bm-hub-tab") : [];
  const audioEl = ROOT.querySelector(".bm-audio");
  const audioTop = ROOT.querySelector(".bm-top");
  const audioMount = ROOT.querySelector("#bm-hub-audio");
  let hubTab = "play";

  function validHubTab(id) {
    return HUB_TABS.indexOf(id) >= 0 ? id : "play";
  }

  function readHubTab() {
    try {
      return validHubTab(localStorage.getItem(HUB_TAB_KEY) || "play");
    } catch (e) {
      return "play";
    }
  }

  function writeHubTab(id) {
    hubTab = validHubTab(id);
    try {
      localStorage.setItem(HUB_TAB_KEY, hubTab);
    } catch (e2) {}
  }

  function dockMenuAudio(onMenu) {
    if (!audioEl || !audioTop || !audioMount) return;
    if (onMenu) {
      audioMount.appendChild(audioEl);
      audioEl.classList.add("bm-hub-audio-bar");
    } else {
      audioTop.appendChild(audioEl);
      audioEl.classList.remove("bm-hub-audio-bar");
    }
  }

  function setHubTab(id, opts) {
    opts = opts || {};
    hubTab = validHubTab(id);
    if (!opts.silent) writeHubTab(hubTab);
    hubTabBtns.forEach(function (btn) {
      const on = btn.getAttribute("data-hub-tab") === hubTab;
      btn.classList.toggle("selected", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    hubPanels.forEach(function (panel) {
      const on = panel.getAttribute("data-hub-panel") === hubTab;
      panel.classList.toggle("selected", on);
      panel.hidden = !on;
    });
    if (typeof notifyResize === "function") notifyResize();
    if (typeof scheduleEmbedResizeBurst === "function") scheduleEmbedResizeBurst();
  }

  function syncMenuChrome() {
    const menuOpen = els.menu && !els.menu.classList.contains("bm-hidden");
    const playOpen = els.play && !els.play.classList.contains("bm-hidden");
    const geniusOpen = els.genius && !els.genius.classList.contains("bm-hidden");
    ROOT.classList.toggle("bm-ui-menu", !!menuOpen);
    ROOT.classList.toggle("bm-ui-play", !!playOpen);
    ROOT.classList.toggle("bm-ui-genius", !!geniusOpen);
    dockMenuAudio(!!menuOpen);
  }

  const playHome = ROOT.querySelector("#bm-play-home");
  const playSubs = ROOT.querySelectorAll(".bm-play-sub");
  const playCampaignBtn = ROOT.querySelector("#bm-mode-campaign");
  const playSpecialBtn = ROOT.querySelector("#bm-mode-special");
  const playSpecialEmpty = ROOT.querySelector("#bm-play-special-empty");
  let playView = "home";

  function hubResize() {
    if (typeof notifyResize === "function") notifyResize();
    if (typeof scheduleEmbedResizeBurst === "function") scheduleEmbedResizeBurst();
  }

  function syncSpecialOpsCard() {
    const special = ROOT.querySelector("#bm-play-special");
    if (!special) return;
    const any = special.querySelector(".bm-special-actions button:not(.bm-hidden)");
    if (playSpecialBtn) playSpecialBtn.classList.toggle("bm-hidden", !any);
    if (playSpecialEmpty) playSpecialEmpty.hidden = !!any;
  }

  function setPlayView(view) {
    playView = view || "home";
    if (playHome) playHome.hidden = playView !== "home";
    playSubs.forEach(function (sub) {
      const id = sub.id || "";
      const slug = id.replace("bm-play-", "");
      sub.hidden = playView !== slug;
    });
    hubResize();
  }

  if (playCampaignBtn) {
    playCampaignBtn.addEventListener("click", function () {
      setPlayView("campaign");
      beep(720, 0.05, "square", 0.04);
    });
  }
  if (playSpecialBtn) {
    playSpecialBtn.addEventListener("click", function () {
      syncSpecialOpsCard();
      setPlayView("special");
      beep(720, 0.05, "square", 0.04);
    });
  }
  ROOT.querySelectorAll("[data-play-back]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setPlayView("home");
      beep(620, 0.04, "square", 0.03);
    });
  });
  ROOT.querySelectorAll("[data-hub-back]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setPlayView("home");
      setHubTab("play");
      beep(620, 0.04, "square", 0.03);
    });
  });

  var _setHubTabCore = setHubTab;
  setHubTab = function (id, opts) {
    _setHubTabCore(id, opts);
    if (validHubTab(id) !== "play") setPlayView("home");
  };

  if (hubTabsEl) {
    hubTab = readHubTab();
    setHubTab(hubTab, { silent: true });
    hubTabsEl.addEventListener("click", function (e) {
      const btn = e.target.closest(".bm-hub-tab");
      if (!btn) return;
      setHubTab(btn.getAttribute("data-hub-tab"));
    });
  }

  var _showMenuHub = showMenu;
  showMenu = function () {
    _showMenuHub();
    syncMenuChrome();
    syncSpecialOpsCard();
    setPlayView("home");
    setHubTab(readHubTab(), { silent: true });
  };

  if (typeof updateOmegaBtn === "function") {
    var _updateOmegaBtnHub = updateOmegaBtn;
    updateOmegaBtn = function () {
      _updateOmegaBtnHub();
      syncSpecialOpsCard();
    };
  }

  var _loadGridHub = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridHub(freshRun);
    syncMenuChrome();
  };

  if (typeof startGenius === "function") {
    var _startGeniusHub = startGenius;
    startGenius = function () {
      _startGeniusHub();
      syncMenuChrome();
    };
  }

  var _showVictoryHub = showVictory;
  showVictory = function (opts) {
    _showVictoryHub(opts);
    syncMenuChrome();
  };

  var _runBootHub = runBoot;
  runBoot = function (cb) {
    _runBootHub(function () {
      syncMenuChrome();
      syncSpecialOpsCard();
      if (cb) cb();
    });
  };

  syncMenuChrome();
  syncSpecialOpsCard();
  setPlayView("home");
