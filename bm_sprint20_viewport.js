  // === VIEWPORT SPRINT — dynamic embed height; scroll on mobile only ===
  const EMBED_MIN_H = 680;
  let embedFsActive = false;

  Object.assign(els, {
    fsBtn: ROOT.querySelector("#bm-fullscreen")
  });

  function isMobileDevice() {
    try {
      if (window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(pointer: coarse)").matches) {
        return false;
      }
    } catch (e) {}
    var touch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    var narrow = false;
    try {
      narrow = window.matchMedia("(max-width: 700px)").matches;
    } catch (e2) {}
    var coarse = false;
    try {
      coarse = window.matchMedia("(pointer: coarse)").matches;
    } catch (e3) {}
    return (touch && coarse) || narrow;
  }

  function isMobileEmbed() {
    return EMBED && isMobileDevice();
  }

  function syncMobileClass() {
    document.documentElement.classList.toggle("bm-mobile", isMobileDevice());
  }

  function isTutScrollTarget(node) {
    return node && node.closest && node.closest(".bm-tut-scroll");
  }

  function blockEmbedScroll(e) {
    if (!EMBED || isMobileEmbed()) return;
    if (isTutScrollTarget(e.target)) return;
    e.preventDefault();
  }

  function measureEmbedHeight() {
    if (!EMBED) return EMBED_MIN_H;
    const doc = document.documentElement;
    const bod = document.body;
    const shell = ROOT.querySelector(".bm-shell");
    const stage = ROOT.querySelector(".bm-stage");
    [doc, bod, ROOT, shell, stage].forEach(function (el) {
      if (!el) return;
      el.style.height = "auto";
      el.style.minHeight = "0";
      el.style.maxHeight = "none";
    });
    const rootTop = ROOT.getBoundingClientRect().top;
    let maxBottom = ROOT.getBoundingClientRect().bottom;
    [shell, stage, ROOT.querySelector(".bm-top"), els.menu, els.play, els.genius].forEach(function (el) {
      if (!el || el.classList.contains("bm-hidden")) return;
      const r = el.getBoundingClientRect();
      if (r.bottom > maxBottom) maxBottom = r.bottom;
    });
    ROOT.querySelectorAll("#bm-play .bm-bar, #bm-genius .bm-bar, #bm-grid, .bm-actions").forEach(function (el) {
      if (!el || el.closest(".bm-hidden")) return;
      const r = el.getBoundingClientRect();
      if (r.bottom > maxBottom) maxBottom = r.bottom;
    });
    const bboxH = Math.ceil(Math.max(0, maxBottom - rootTop)) + 24;
    let h = Math.ceil(Math.max(
      EMBED_MIN_H,
      bboxH,
      ROOT.getBoundingClientRect().height || 0,
      ROOT.scrollHeight || 0,
      ROOT.offsetHeight || 0,
      doc.scrollHeight || 0,
      bod.scrollHeight || 0
    ));
    if (isMobileEmbed() && (ROOT.classList.contains("bm-ui-play") || ROOT.classList.contains("bm-ui-genius"))) {
      h = Math.max(h, EMBED_MIN_H + 120);
    }
    return h;
  }

  function applyEmbedFrameHeight(h) {
    if (!EMBED) return h;
    h = Math.max(EMBED_MIN_H, Math.round(h || measureEmbedHeight()));
    const mobile = isMobileEmbed();
    syncMobileClass();
    const shell = ROOT.querySelector(".bm-shell");
    const stage = ROOT.querySelector(".bm-stage");
    [document.documentElement, document.body, ROOT, shell, stage, els.play, els.menu, els.genius].forEach(function (el) {
      if (!el) return;
      if (mobile) {
        el.style.height = "auto";
        el.style.minHeight = "0";
        el.style.maxHeight = "none";
        el.style.flex = "";
      }
    });
    [document.documentElement, document.body, ROOT].forEach(function (el) {
      if (mobile) {
        el.style.overflowX = "hidden";
        el.style.overflowY = "visible";
        el.style.webkitOverflowScrolling = "";
        el.style.overscrollBehaviorY = "";
        el.style.touchAction = "pan-y";
      } else {
        el.style.height = h + "px";
        el.style.minHeight = h + "px";
        el.style.maxHeight = h + "px";
        el.style.overflow = "hidden";
        el.style.overflowY = "";
        el.style.webkitOverflowScrolling = "";
      }
    });
    if (!mobile) {
      [shell, stage, els.play, els.menu, els.genius].forEach(function (el) {
        if (!el) return;
        el.style.height = "";
        el.style.minHeight = "";
        el.style.maxHeight = "";
        el.style.flex = "";
      });
    }
    return h;
  }

  function syncEmbedUiMode() {
    if (!EMBED) return;
    syncMobileClass();
    const menuOpen = els.menu && !els.menu.classList.contains("bm-hidden");
    const playOpen = els.play && !els.play.classList.contains("bm-hidden");
    const geniusOpen = els.genius && !els.genius.classList.contains("bm-hidden");
    ROOT.classList.toggle("bm-ui-menu", !!menuOpen);
    ROOT.classList.toggle("bm-ui-play", !!playOpen);
    ROOT.classList.toggle("bm-ui-genius", !!geniusOpen);
    notifyResize();
    if (isMobileEmbed()) scheduleEmbedResizeBurst();
  }

  let embedBurstGen = 0;
  let embedMutObs = null;

  function flushEmbedResize() {
    if (!EMBED || !window.parent) return;
    try {
      const h = applyEmbedFrameHeight(measureEmbedHeight());
      window.parent.postMessage({
        type: "bm-resize",
        height: h,
        mobile: isMobileEmbed()
      }, "*");
      window.parent.postMessage({
        type: "bm-mobile",
        active: isMobileEmbed()
      }, "*");
    } catch (e) {}
  }

  function scheduleEmbedResizeBurst() {
    if (!EMBED || !isMobileEmbed()) return;
    flushEmbedResize();
    const gen = ++embedBurstGen;
    [32, 96].forEach(function (ms) {
      setTimeout(function () {
        if (gen !== embedBurstGen) return;
        flushEmbedResize();
      }, ms);
    });
  }

  function bindEmbedResizeObserver() {
    if (!EMBED || !isMobileEmbed() || embedMutObs || !window.MutationObserver) return;
    let debounce = null;
    embedMutObs = new MutationObserver(function () {
      clearTimeout(debounce);
      debounce = setTimeout(flushEmbedResize, 0);
    });
    embedMutObs.observe(ROOT, { childList: true, subtree: true, attributes: true, characterData: true });
  }

  function isNativeFs() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function updateFsBtn() {
    if (!els.fsBtn) return;
    const on = EMBED ? embedFsActive : isNativeFs();
    els.fsBtn.textContent = on ? "EXIT FS" : "FULLSCREEN";
    els.fsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    els.fsBtn.title = on ? "Exit fullscreen" : "Enter fullscreen";
  }

  function toggleFullscreen() {
    ensureAudio();
    if (EMBED && window.parent) {
      embedFsActive = !embedFsActive;
      try {
        window.parent.postMessage({ type: embedFsActive ? "bm-fs" : "bm-fs-exit" }, "*");
      } catch (e) {}
      updateFsBtn();
      setTimeout(syncEmbedUiMode, 150);
      beep(660, 0.06, "triangle", 0.05);
      return;
    }
    const rootEl = document.documentElement;
    const req = rootEl.requestFullscreen || rootEl.webkitRequestFullscreen;
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (isNativeFs()) {
      if (ex) ex.call(document);
    } else if (req) {
      try {
        const p = req.call(rootEl);
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    }
  }

  function onFsStateMsg(active) {
    embedFsActive = !!active;
    updateFsBtn();
    syncEmbedUiMode();
  }

  notifyResize = function () {
    if (!EMBED || !window.parent) return;
    flushEmbedResize();
    requestAnimationFrame(flushEmbedResize);
  };

  if (EMBED) {
    syncMobileClass();
    applyEmbedFrameHeight(measureEmbedHeight());
    bindEmbedResizeObserver();
    document.addEventListener("wheel", blockEmbedScroll, { passive: false });
    document.addEventListener("touchmove", blockEmbedScroll, { passive: false });
    window.addEventListener("resize", syncEmbedUiMode);
    window.addEventListener("orientationchange", function () {
      setTimeout(syncEmbedUiMode, 160);
    });
  } else {
    syncMobileClass();
    window.addEventListener("resize", syncMobileClass);
    window.addEventListener("orientationchange", function () {
      setTimeout(syncMobileClass, 160);
    });
  }

  var _runBootVp = runBoot;
  runBoot = function (cb) {
    _runBootVp(function () {
      syncEmbedUiMode();
      if (isMobileEmbed()) scheduleEmbedResizeBurst();
      if (cb) cb();
    });
  };

  var _showMenuVp = showMenu;
  showMenu = function () {
    _showMenuVp();
    syncEmbedUiMode();
  };

  var _loadGridVp = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridVp(freshRun);
    setTimeout(syncEmbedUiMode, freshRun ? 0 : 40);
    if (isMobileEmbed()) {
      setTimeout(scheduleEmbedResizeBurst, freshRun ? 120 : 160);
      setTimeout(scheduleEmbedResizeBurst, freshRun ? 320 : 360);
    }
  };

  var _startGeniusVp = typeof startGenius === "function" ? startGenius : null;
  if (_startGeniusVp) {
    startGenius = function () {
      _startGeniusVp();
      setTimeout(syncEmbedUiMode, 0);
    };
  }

  var _showVictoryVp = showVictory;
  showVictory = function (opts) {
    _showVictoryVp(opts);
    setTimeout(syncEmbedUiMode, 0);
  };

  if (els.fsBtn) {
    els.fsBtn.addEventListener("click", toggleFullscreen);
  }
  document.addEventListener("fullscreenchange", updateFsBtn);
  document.addEventListener("webkitfullscreenchange", updateFsBtn);
  window.addEventListener("message", function (e) {
    if (!e.data || typeof e.data !== "object") return;
    if (e.data.type === "bm-fs-state") onFsStateMsg(e.data.active);
    if (e.data.type === "bm-request-resize") {
      flushEmbedResize();
      scheduleEmbedResizeBurst();
    }
  });
  updateFsBtn();
  if (EMBED) {
    syncEmbedUiMode();
    scheduleEmbedResizeBurst();
  }
