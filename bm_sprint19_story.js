  // === STORY LINK SPRINT — Book 1 dialogue, beats, briefing ===
  let storyData = null;
  let pendingStoryStart = null;

  if (!records.storyBeatsSeen) records.storyBeatsSeen = [];
  if (records.storyBriefSeen == null) records.storyBriefSeen = false;

  Object.assign(els, {
    storyHud: ROOT.querySelector("#bm-story-hud"),
    storyBrief: ROOT.querySelector("#bm-story-brief"),
    storyBriefDialog: ROOT.querySelector("#bm-story-brief-dialog"),
    storyBriefGo: ROOT.querySelector("#bm-story-brief-go"),
    storyBriefSkip: ROOT.querySelector("#bm-story-brief-skip"),
    storyBriefTitle: ROOT.querySelector("#bm-story-brief-title"),
    victoryStory: ROOT.querySelector("#bm-victory-story")
  });

  function storyAssetVer() {
    const s = document.querySelector('script[src*="binary_matrix.js"]');
    const m = s && s.src.match(/[?&]v=(\d+)/);
    return m ? m[1] : "19";
  }

  function escapeStoryHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function storyChars() {
    return (storyData && storyData.characters) || {};
  }

  function renderDialogue(lines) {
    if (!lines || !lines.length) return "";
    const chars = storyChars();
    return lines.map(function (d) {
      const ch = chars[d.who] || { name: String(d.who || "?").toUpperCase(), tag: "", color: "#86efac" };
      return (
        '<div class="bm-dlg-row bm-dlg-' + escapeStoryHtml(d.who) + '">' +
        '<b style="color:' + escapeStoryHtml(ch.color) + '">' + escapeStoryHtml(ch.name) +
        (ch.tag ? ' <span class="bm-dlg-tag">· ' + escapeStoryHtml(ch.tag) + "</span>" : "") +
        "</b>" + escapeStoryHtml(d.line) + "</div>"
      );
    }).join("");
  }

  function markStoryBeat(id) {
    if (!id) return;
    records.storyBeatsSeen = records.storyBeatsSeen || [];
    if (records.storyBeatsSeen.indexOf(id) >= 0) return;
    records.storyBeatsSeen.push(id);
    saveRecords();
  }

  function storyModeActive() {
    return !dailyMode && !omegaMode && !arcadeMode && !contractMode &&
      difficulty !== "genius" && difficulty !== "daily";
  }

  function getStoryBeat() {
    if (!storyData || !storyModeActive()) return null;
    const camp = storyData.campaign && storyData.campaign[difficulty];
    if (!camp) return null;
    return camp[gridLevel] || null;
  }

  function updateStoryHud() {
    if (!els.storyHud) return;
    if (!storyData || !storyModeActive()) {
      els.storyHud.hidden = true;
      return;
    }
    const beat = getStoryBeat();
    if (beat && beat.chapter) {
      els.storyHud.textContent = "STORY · BOOK " + (storyData.book || 1) + " · " + beat.chapter;
      els.storyHud.hidden = false;
    } else {
      els.storyHud.hidden = true;
    }
  }

  function loadStoryBeats() {
    fetch("story_beats.json?v=" + storyAssetVer())
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        storyData = d;
        if (els.storyBriefTitle && d.title) els.storyBriefTitle.textContent = d.title;
        updateStoryHud();
      })
      .catch(function () {
        storyData = null;
      });
  }

  function hideStoryBrief() {
    if (els.storyBrief) els.storyBrief.classList.remove("show");
  }

  function finishStoryBrief() {
    records.storyBriefSeen = true;
    saveRecords();
    hideStoryBrief();
    const go = pendingStoryStart;
    pendingStoryStart = null;
    if (go) go();
  }

  function showStoryBriefing(onGo) {
    if (!els.storyBrief || !storyData || !storyData.briefing) {
      if (onGo) onGo();
      return;
    }
    pendingStoryStart = onGo;
    if (els.storyBriefDialog) els.storyBriefDialog.innerHTML = renderDialogue(storyData.briefing);
    els.storyBrief.classList.add("show");
    beep(440, 0.08, "sine", 0.05);
  }

  if (els.storyBriefGo) {
    els.storyBriefGo.onclick = function () { finishStoryBrief(); };
  }
  if (els.storyBriefSkip) {
    els.storyBriefSkip.onclick = function () { finishStoryBrief(); };
  }

  var _showSectorStory = showSectorCard;
  showSectorCard = function (clearedLabel, code, nextLabel, cb, loreQuote) {
    const beat = getStoryBeat();
    if (typeof markLoreSeen === "function") markLoreSeen(gridLevel % LORE_QUOTES.length);
    if (typeof isBossSector === "function" && isBossSector() && typeof unlockArchive === "function") {
      unlockArchive("boss");
    }
    if (beat && beat.dialogue && beat.dialogue.length && els.sector) {
      markStoryBeat(beat.id);
      updateStoryHud();
      if (els.sectorKicker) els.sectorKicker.textContent = beat.chapter ? ("STORY · " + beat.chapter) : "SECTOR CLEARED";
      if (els.sectorTitle) els.sectorTitle.textContent = clearedLabel;
      if (els.sectorCode) els.sectorCode.textContent = "matrix code " + code;
      if (els.sectorLore) {
        els.sectorLore.innerHTML = renderDialogue(beat.dialogue);
        els.sectorLore.classList.remove("bm-hidden");
      }
      if (els.sectorNext) els.sectorNext.textContent = nextLabel || "Next node loading…";
      if (els.gridWrap) {
        els.gridWrap.classList.add("bm-dissolve");
        setTimeout(function () { els.gridWrap.classList.remove("bm-dissolve"); }, 560);
      }
      els.sector.classList.add("show");
      beep(520, 0.08, "triangle", 0.07);
      beep(780, 0.1, "triangle", 0.08);
      setTimeout(function () {
        els.sector.classList.remove("show");
        if (cb) cb();
      }, 3400);
      return;
    }
    _showSectorStory(clearedLabel, code, nextLabel, cb, loreQuote);
  };

  var _hideVictoryStory = hideVictory;
  hideVictory = function () {
    if (els.victoryStory) {
      els.victoryStory.innerHTML = "";
      els.victoryStory.classList.add("bm-hidden");
    }
    _hideVictoryStory();
  };

  var _showVictoryStory = showVictory;
  showVictory = function (opts) {
    opts = opts || {};
    if (els.victoryStory) {
      if (!opts.daily && !opts.omega && !opts.genius && storyData && storyData.victory) {
        const vb = storyData.victory[difficulty];
        if (vb && vb.dialogue && vb.dialogue.length) {
          els.victoryStory.innerHTML = renderDialogue(vb.dialogue);
          els.victoryStory.classList.remove("bm-hidden");
        } else {
          els.victoryStory.innerHTML = "";
          els.victoryStory.classList.add("bm-hidden");
        }
      } else {
        els.victoryStory.innerHTML = "";
        els.victoryStory.classList.add("bm-hidden");
      }
    }
    _showVictoryStory(opts);
  };

  var _showKernelLoreStory = showKernelLore;
  showKernelLore = function (level) {
    _showKernelLoreStory(level);
    if (!storyData || !storyData.genius) return;
    const beat = storyData.genius[level];
    if (!beat || !beat.dialogue || !els.kernelLorePanel) return;
    markStoryBeat(beat.id);
    els.kernelLorePanel.innerHTML += renderDialogue(beat.dialogue);
  };

  var _startGameStory = startGame;
  startGame = function () {
    function go() {
      if (!records.storyBriefSeen && storyData && storyData.briefing && storyData.briefing.length) {
        showStoryBriefing(function () { _startGameStory(); });
        return;
      }
      _startGameStory();
    }
    if (!records.storyBriefSeen && !storyData) {
      setTimeout(go, 180);
      return;
    }
    go();
  };

  var _loadGridStory = loadGridSector;
  loadGridSector = function (freshRun) {
    _loadGridStory(freshRun);
    setTimeout(updateStoryHud, freshRun ? 80 : 120);
  };

  var _showMenuStory = showMenu;
  showMenu = function () {
    _showMenuStory();
    updateStoryHud();
  };

  loadStoryBeats();
