  // === VIEWPORT SPRINT — dynamic embed height, no scroll except tutorials ===
  const EMBED_MIN_H = 680;
  let embedFsActive = false;

  Object.assign(els, {
    fsBtn: ROOT.querySelector("#bm-fullscreen")
  });

  function isTutScrollTarget(node) {
    return node && node.closest && node.closest(".bm-tut-scroll");
  }

  function blockEmbedScroll(e) {
    if (!EMBED) return;
    if (isTutScrollTarget(e.target)) return;
    e.preventDefault();
  }

  function measureEmbedHeight() {
    if (!EMBED) return EMBED_MIN_H;
    const doc = document.documentElement;
    const bod = document.body;
    [doc, bod, ROOT].forEach(function (el) {
      el.style.height = "auto";
      el.style.minHeight = "0";
      el.style.maxHeight = "none";
    });
    const h = Math.ceil(Math.max(
      EMBED_MIN_H,
      ROOT.getBoundingClientRect().height || 0,
      ROOT.scrollHeight || 0,
      ROOT.offsetHeight || 0,
      doc.scrollHeight || 0,
      bod.scrollHeight || 0
    ));
    return h;
  }

  function applyEmbedFrameHeight(h) {
    if (!EMBED) return;
    h = Math.max(EMBED_MIN_H, Math.round(h || measureEmbedHeight()));
    [document.documentElement, document.body, ROOT].forEach(function (el) {
      el.style.height = h + "px";
      el.style.minHeight = h + "px";
      el.style.maxHeight = h + "px";
      el.style.overflow = "hidden";
    });
    return h;
  }

  function syncEmbedUiMode() {
    if (!EMBED) return;
    const menuOpen = els.menu && !els.menu.classList.contains("bm-hidden");
    const playOpen = els.play && !els.play.classList.contains("bm-hidden");
    const geniusOpen = els.genius && !els.genius.classList.contains("bm-hidden");
    ROOT.classList.toggle("bm-ui-menu", !!menuOpen);
    ROOT.classList.toggle("bm-ui-play", !!playOpen);
    ROOT.classList.toggle("bm-ui-genius", !!geniusOpen);
    notifyResize();
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
    requestAnimationFrame(function () {
      try {
        const h = applyEmbedFrameHeight(measureEmbedHeight());
        window.parent.postMessage({ type: "bm-resize", height: h }, "*");
      } catch (e) {}
    });
  };

  if (EMBED) {
    applyEmbedFrameHeight(measureEmbedHeight());
    document.addEventListener("wheel", blockEmbedScroll, { passive: false });
    document.addEventListener("touchmove", blockEmbedScroll, { passive: false });
    window.addEventListener("resize", syncEmbedUiMode);
  }

  var _runBootVp = runBoot;
  runBoot = function (cb) {
    _runBootVp(function () {
      syncEmbedUiMode();
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
    setTimeout(syncEmbedUiMode, freshRun ? 80 : 120);
  };

  var _startGeniusVp = typeof startGenius === "function" ? startGenius : null;
  if (_startGeniusVp) {
    startGenius = function () {
      _startGeniusVp();
      setTimeout(syncEmbedUiMode, 80);
    };
  }

  var _showVictoryVp = showVictory;
  showVictory = function (opts) {
    _showVictoryVp(opts);
    setTimeout(syncEmbedUiMode, 80);
  };

  if (els.fsBtn) {
    els.fsBtn.addEventListener("click", toggleFullscreen);
  }
  document.addEventListener("fullscreenchange", updateFsBtn);
  document.addEventListener("webkitfullscreenchange", updateFsBtn);
  window.addEventListener("message", function (e) {
    if (!e.data || typeof e.data !== "object") return;
    if (e.data.type === "bm-fs-state") onFsStateMsg(e.data.active);
  });
  updateFsBtn();
  if (EMBED) syncEmbedUiMode();
