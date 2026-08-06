(function () {
  const ROOT = document.getElementById("binmat-root");
  if (!ROOT) return;

  let N = 6;
  let HALF = 3;
  const MUSIC_SRC = "https://archive.org/download/los-angeles_202505/Rob%20Dougan%20-%20Clubbed%20to%20Death%20%5BRadio%20Edit%5D.mp3";

  // Grid campaigns: [size, targetClues, strikes, digPasses, label]
  const CAMPAIGN = {
    easy: [
      [4, 10, 5, 1, "4×4 warm-up"],
      [4, 7, 5, 1, "4×4 thin clues"],
      [6, 18, 5, 1, "6×6 open field"],
      [6, 15, 5, 1, "6×6 standard"],
      [6, 12, 4, 2, "6×6 finale"]
    ],
    medium: [
      [4, 6, 3, 1, "4×4 spar"],
      [6, 14, 3, 2, "6×6 entry"],
      [6, 12, 3, 2, "6×6 denser"],
      [6, 10, 3, 2, "6×6 sparse"],
      [6, 9, 2, 3, "6×6 tight"],
      [6, 8, 2, 3, "6×6 finale"]
    ],
    hard: [
      [6, 10, 2, 3, "6×6 opener"],
      [4, 5, 2, 2, "4×4 pressure"],
      [6, 8, 2, 4, "6×6 deep dig"],
      [6, 7, 2, 4, "6×6 razor"],
      [4, 4, 1, 2, "4×4 one-strike"],
      [6, 7, 2, 4, "6×6 near-blank"],
      [6, 8, 1, 4, "6×6 last gate"]
    ]
  };

  const els = {
    rain: ROOT.querySelector("#bm-rain"),
    menu: ROOT.querySelector("#bm-menu"),
    play: ROOT.querySelector("#bm-play"),
    grid: ROOT.querySelector("#bm-grid"),
    status: ROOT.querySelector("#bm-status"),
    score: ROOT.querySelector("#bm-score"),
    time: ROOT.querySelector("#bm-time"),
    mistakes: ROOT.querySelector("#bm-mistakes"),
    diffLabel: ROOT.querySelector("#bm-diff-label"),
    solveBtn: ROOT.querySelector("#bm-solve"),
    checkBtn: ROOT.querySelector("#bm-check"),
    pauseOv: ROOT.querySelector("#bm-pause"),
    helpOv: ROOT.querySelector("#bm-help"),
    geniusHelp: ROOT.querySelector("#bm-genius-help"),
    vol: ROOT.querySelector("#bm-vol"),
    sfx: ROOT.querySelector("#bm-sfx"),
    mute: ROOT.querySelector("#bm-mute"),
    genius: ROOT.querySelector("#bm-genius"),
    vmLog: ROOT.querySelector("#bm-vm-log"),
    vmStatus: ROOT.querySelector("#bm-vm-status"),
    vmBrief: ROOT.querySelector("#bm-vm-brief"),
    probe: ROOT.querySelector("#bm-probe"),
    answer: ROOT.querySelector("#bm-answer")
  };

  let difficulty = "medium";
  let solution = null;
  let puzzle = null; // -1 empty, 0/1 values; givens tracked separately
  let given = null; // boolean[][]
  let grid = null;
  let playing = false;
  let paused = false;
  let won = false;
  let score = 0;
  let mistakes = 0;
  let maxMistakes = 99;
  let startedAt = 0;
  let elapsedMs = 0;
  let timerId = null;
  let musicVol = 0.36;
  let sfxVol = 0.36;
  let muted = false;
  let audioCtx = null;
  let bgMusic = null;
  let geniusMode = false;
  let vmLevel = 0;
  let vmProbes = 0;
  let vmSecrets = [];
  let vmChallenges = [];
  let vmCode = null;
  let vmExpectLen = 1;
  let vmShowRegs = true;
  let gridLevel = 0;
  let sectorGain = 0;
  let sectorClock = 0;
  let advanceTimer = null;
  const menuRules = ROOT.querySelector(".bm-rules");
  const RULES_GRID = menuRules ? menuRules.innerHTML : "";
  const RULES_GENIUS = "GENIUS replaces the grid.<br>Reverse a black-box <b>NX-8</b> CPU gate: probe inputs, read outputs, submit the key.<br>8 escalating kernels · 2 strikes · no Solve · ISA shown, program hidden.";

  // --- Matrix rain (inside frame) ---
  const ctx = els.rain.getContext("2d");
  let fontSize = 14;
  let drops = [];
  let speeds = [];
  let rainCols = 0;

  function sizeRain() {
    const r = ROOT.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    els.rain.width = Math.max(1, Math.floor(r.width * dpr));
    els.rain.height = Math.max(1, Math.floor(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontSize = r.width < 500 ? 12 : 14;
    rainCols = Math.ceil(r.width / fontSize);
    while (drops.length < rainCols) {
      drops.push(Math.random() * 40);
      speeds.push(0.45 + Math.random() * 0.7);
    }
    drops.length = rainCols;
    speeds.length = rainCols;
  }

  function drawRain() {
    const w = ROOT.clientWidth;
    const h = ROOT.clientHeight;
    ctx.fillStyle = won ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.07)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = won ? "#86efac" : "#22c55e";
    ctx.font = fontSize + "px monospace";
    for (let i = 0; i < rainCols; i++) {
      const ch = Math.random() < 0.5 ? "0" : "1";
      ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
      drops[i] += speeds[i] * (won ? 1.35 : 1);
    }
  }
  setInterval(drawRain, 50);
  window.addEventListener("resize", sizeRain);
  if (window.ResizeObserver) {
    new ResizeObserver(function () { sizeRain(); }).observe(ROOT);
  }

  // --- Audio ---
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, dur, type, vol) {
    if (muted || !sfxVol) return;
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "square";
    o.frequency.value = freq;
    g.gain.setValueAtTime((vol || 0.08) * sfxVol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  }

  function playWinFanfare() {
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.28, "triangle", 0.1); }, i * 220);
    });
  }

  function setupMusic() {
    bgMusic = new Audio(MUSIC_SRC);
    bgMusic.loop = true;
    bgMusic.preload = "auto";
    bgMusic.volume = muted ? 0 : musicVol;
  }

  function playMusic() {
    if (!bgMusic) setupMusic();
    bgMusic.volume = muted ? 0 : musicVol;
    bgMusic.play().catch(function () {});
  }

  function stopMusic() {
    if (!bgMusic) return;
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }

  function pauseMusic() {
    if (bgMusic) bgMusic.pause();
  }

  // --- Takuzu / Binary puzzle engine ---
  function clone(g) {
    return g.map(function (r) { return r.slice(); });
  }

  function rowArr(g, r) { return g[r]; }
  function colArr(g, c) {
    const a = [];
    for (let r = 0; r < N; r++) a.push(g[r][c]);
    return a;
  }

  function noTriple(a) {
    for (let i = 0; i < N - 2; i++) {
      if (a[i] !== -1 && a[i] === a[i + 1] && a[i] === a[i + 2]) return false;
    }
    return true;
  }

  function balanceOk(a) {
    let z = 0, o = 0;
    for (let i = 0; i < N; i++) {
      if (a[i] === 0) z++;
      else if (a[i] === 1) o++;
    }
    return z <= HALF && o <= HALF;
  }

  function lineUnique(g, isRow, idx) {
    const line = isRow ? rowArr(g, idx) : colArr(g, idx);
    if (line.indexOf(-1) >= 0) return true;
    for (let i = 0; i < N; i++) {
      if (i === idx) continue;
      const other = isRow ? rowArr(g, i) : colArr(g, i);
      if (other.indexOf(-1) >= 0) continue;
      let same = true;
      for (let k = 0; k < N; k++) if (line[k] !== other[k]) { same = false; break; }
      if (same) return false;
    }
    return true;
  }

  function canPlace(g, r, c, v) {
    const prev = g[r][c];
    g[r][c] = v;
    const ok = noTriple(rowArr(g, r)) && balanceOk(rowArr(g, r)) && lineUnique(g, true, r)
      && noTriple(colArr(g, c)) && balanceOk(colArr(g, c)) && lineUnique(g, false, c);
    g[r][c] = prev;
    return ok;
  }

  function findEmpty(g) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] === -1) return [r, c];
    return null;
  }

  function countSolutions(g, limit) {
    const lim = limit || 2;
    let count = 0;
    function dfs() {
      if (count >= lim) return;
      const pos = findEmpty(g);
      if (!pos) { count++; return; }
      const r = pos[0], c = pos[1];
      const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
      for (let i = 0; i < 2; i++) {
        const v = order[i];
        if (!canPlace(g, r, c, v)) continue;
        g[r][c] = v;
        dfs();
        g[r][c] = -1;
        if (count >= lim) return;
      }
    }
    dfs();
    return count;
  }

  function generateFull() {
    const g = [];
    for (let r = 0; r < N; r++) {
      g[r] = [];
      for (let c = 0; c < N; c++) g[r][c] = -1;
    }
    function dfs() {
      const pos = findEmpty(g);
      if (!pos) return true;
      const r = pos[0], c = pos[1];
      const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
      for (let i = 0; i < 2; i++) {
        const v = order[i];
        if (!canPlace(g, r, c, v)) continue;
        g[r][c] = v;
        if (dfs()) return true;
        g[r][c] = -1;
      }
      return false;
    }
    if (!dfs()) return generateFull();
    return g;
  }

  function digPuzzle(full, targetClues, passes) {
    let best = clone(full);
    let bestCount = N * N;
    const tries = passes || 1;
    for (let pass = 0; pass < tries; pass++) {
      const g = clone(full);
      const cells = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cells.push([r, c]);
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = cells[i]; cells[i] = cells[j]; cells[j] = t;
      }
      let clues = N * N;
      for (let i = 0; i < cells.length && clues > targetClues; i++) {
        const r = cells[i][0], c = cells[i][1];
        const keep = g[r][c];
        g[r][c] = -1;
        const test = clone(g);
        if (countSolutions(test, 2) !== 1) g[r][c] = keep;
        else clues--;
      }
      if (clues < bestCount) {
        best = g;
        bestCount = clues;
      }
      if (bestCount <= targetClues) break;
    }
    return best;
  }

  function campaignLen() {
    const c = CAMPAIGN[difficulty];
    return c ? c.length : 1;
  }

  function sectorSpec() {
    const c = CAMPAIGN[difficulty];
    return c ? c[Math.min(gridLevel, c.length - 1)] : [6, 11, 3, 2, "matrix"];
  }

  function setGridSize(n) {
    N = n;
    HALF = n / 2;
    if (els.grid) {
      els.grid.className = "bm-grid sz" + n;
      els.grid.setAttribute("aria-label", n + "×" + n + " Binary Matrix");
    }
  }

  function newPuzzleFromSpec(spec) {
    setGridSize(spec[0]);
    const full = generateFull();
    const dug = digPuzzle(full, spec[1], spec[3]);
    const giv = [];
    for (let r = 0; r < N; r++) {
      giv[r] = [];
      for (let c = 0; c < N; c++) giv[r][c] = dug[r][c] !== -1;
    }
    return { solution: full, puzzle: dug, given: giv };
  }

  // --- Rule highlights ---
  function violationMask(g) {
    const bad = [];
    for (let r = 0; r < N; r++) {
      bad[r] = [];
      for (let c = 0; c < N; c++) bad[r][c] = false;
    }
    function markLine(get, setBad) {
      const a = [];
      for (let i = 0; i < N; i++) a.push(get(i));
      for (let i = 0; i < N - 2; i++) {
        if (a[i] !== -1 && a[i] === a[i + 1] && a[i] === a[i + 2]) {
          setBad(i); setBad(i + 1); setBad(i + 2);
        }
      }
      let z = 0, o = 0, empty = 0;
      for (let i = 0; i < N; i++) {
        if (a[i] === 0) z++;
        else if (a[i] === 1) o++;
        else empty++;
      }
      if (z > HALF || o > HALF) {
        for (let i = 0; i < N; i++) if (a[i] !== -1) setBad(i);
      }
      if (!empty && (z !== HALF || o !== HALF)) {
        for (let i = 0; i < N; i++) setBad(i);
      }
    }
    for (let r = 0; r < N; r++) markLine(function (c) { return g[r][c]; }, function (c) { bad[r][c] = true; });
    for (let c = 0; c < N; c++) markLine(function (r) { return g[r][c]; }, function (r) { bad[r][c] = true; });
    // duplicate complete rows/cols
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let rowSame = true, colSame = true;
        for (let k = 0; k < N; k++) {
          if (g[i][k] === -1 || g[j][k] === -1 || g[i][k] !== g[j][k]) rowSame = false;
          if (g[k][i] === -1 || g[k][j] === -1 || g[k][i] !== g[k][j]) colSame = false;
        }
        if (rowSame) for (let k = 0; k < N; k++) { bad[i][k] = true; bad[j][k] = true; }
        if (colSame) for (let k = 0; k < N; k++) { bad[k][i] = true; bad[k][j] = true; }
      }
    }
    return bad;
  }

  function isCompleteValid(g) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] === -1) return false;
    const mask = violationMask(g);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (mask[r][c]) return false;
    return true;
  }

  // --- UI ---
  function fmtTime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function updateHUD() {
    if (els.score) els.score.textContent = String(score).padStart(6, "0");
    if (els.time) els.time.textContent = fmtTime(elapsedMs);
    if (els.mistakes) els.mistakes.textContent = mistakes + "/" + maxMistakes;
    if (els.diffLabel) {
      els.diffLabel.textContent = geniusMode
        ? ("GENIUS " + (vmLevel + 1) + "/" + vmN())
        : (difficulty.toUpperCase() + " " + (gridLevel + 1) + "/" + campaignLen());
    }
  }

  function setStatus(msg, cls) {
    els.status.textContent = msg || "";
    els.status.className = "bm-status" + (cls ? " " + cls : "");
  }

  function renderGrid(flashBad) {
    const mask = flashBad ? violationMask(grid) : null;
    els.grid.innerHTML = "";
    for (let r = 0; r < N; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < N; c++) {
        const td = document.createElement("td");
        const v = grid[r][c];
        const isG = given[r][c];
        if (v === -1) td.className = "empty";
        else if (v === 0) td.className = "zero";
        else td.className = "one";
        if (isG) td.classList.add("given");
        if (won) td.classList.add("won-cell");
        if (mask && mask[r][c]) td.classList.add("bad");
        if (v !== -1) td.textContent = String(v);
        td.dataset.r = r;
        td.dataset.c = c;
        tr.appendChild(td);
      }
      els.grid.appendChild(tr);
    }
  }

  function tick() {
    if (!playing || paused || won) return;
    elapsedMs = Date.now() - startedAt;
    updateHUD();
  }

  function startTimer() {
    clearInterval(timerId);
    timerId = setInterval(tick, 250);
  }

  function calcSectorScore() {
    const spec = sectorSpec();
    const base = difficulty === "hard" ? 2200 : difficulty === "medium" ? 1500 : 900;
    const sizeBonus = spec[0] === 6 ? 400 : 150;
    const sparseBonus = Math.max(0, (spec[0] * spec[0] - spec[1]) * 18);
    const timePenalty = Math.floor((Date.now() - sectorClock) / 1000) * 3;
    const missPenalty = mistakes * 100;
    return Math.max(80, base + sizeBonus + sparseBonus - timePenalty - missPenalty);
  }

  function matrixCode() {
    const bits = grid.flat().join("");
    try { return BigInt("0b" + bits).toString(); } catch (e) { return bits; }
  }

  function onWin() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    won = true;
    playing = false;
    sectorGain = calcSectorScore();
    score += sectorGain;
    updateHUD();
    renderGrid(false);
    const more = gridLevel < campaignLen() - 1;
    if (more) {
      setStatus("SECTOR " + (gridLevel + 1) + " CLEAR +" + sectorGain + " — next matrix…", "ok");
      beep(660, 0.1, "triangle", 0.07);
      beep(880, 0.12, "square", 0.06);
      advanceTimer = setTimeout(advanceSector, 850);
    } else {
      setStatus("LINK COMPLETE — matrix code " + matrixCode() + " · score " + score, "ok");
      playWinFanfare();
      if (bgMusic) bgMusic.volume = muted ? 0 : Math.min(musicVol, 0.22);
    }
  }

  function advanceSector() {
    advanceTimer = null;
    gridLevel++;
    loadGridSector(false);
  }

  function loadGridSector(freshRun) {
    const spec = sectorSpec();
    setStatus("Generating " + spec[0] + "×" + spec[0] + " · " + spec[4] + "…");
    setTimeout(function () {
      const pack = newPuzzleFromSpec(spec);
      solution = pack.solution;
      puzzle = pack.puzzle;
      given = pack.given;
      grid = clone(puzzle);
      playing = true;
      paused = false;
      won = false;
      geniusMode = false;
      mistakes = 0;
      maxMistakes = spec[2];
      sectorClock = Date.now();
      if (freshRun) {
        score = 0;
        elapsedMs = 0;
        startedAt = Date.now();
      } else {
        startedAt = Date.now() - elapsedMs;
      }
      els.pauseOv.classList.remove("show");
      els.solveBtn.classList.toggle("bm-hidden", difficulty !== "easy");
      let clues = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (given[r][c]) clues++;
      setStatus("Sector " + (gridLevel + 1) + "/" + campaignLen() + " · " + spec[4] + " · " + N + "×" + N + " · " + clues + " clues · " + maxMistakes + " strikes");
      renderGrid(false);
      updateHUD();
      startTimer();
      if (freshRun) {
        playMusic();
        beep(520, 0.1, "triangle", 0.07);
      } else {
        beep(600, 0.08, "triangle", 0.06);
      }
      sizeRain();
    }, freshRun ? 30 : 40);
  }

  function failOut() {
    playing = false;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    setStatus("SYSTEM LOCK — too many errors. Restart sector or ease difficulty.", "err");
    beep(140, 0.4, "sawtooth", 0.1);
    pauseMusic();
  }

  function cellClick(e) {
    const td = e.target.closest("td");
    if (!td || !playing || paused || won) return;
    const r = +td.dataset.r, c = +td.dataset.c;
    if (given[r][c]) {
      beep(220, 0.08, "sine", 0.04);
      return;
    }
    // cycle empty -> 0 -> 1 -> empty
    const cur = grid[r][c];
    grid[r][c] = cur === -1 ? 0 : cur === 0 ? 1 : -1;
    beep(760, 0.06, "square", 0.05);
    renderGrid(true);
    const mask = violationMask(grid);
    let hasBad = false;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (mask[i][j]) hasBad = true;
    if (hasBad) setStatus("Conflict highlighted — fix before CHECK", "err");
    else setStatus("Signal clean…");
    if (isCompleteValid(grid)) onWin();
  }

  function showMenu() {
    playing = false;
    paused = false;
    geniusMode = false;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    els.pauseOv.classList.remove("show");
    if (els.geniusHelp) els.geniusHelp.classList.remove("show");
    els.menu.classList.remove("bm-hidden");
    els.play.classList.add("bm-hidden");
    if (els.genius) els.genius.classList.add("bm-hidden");
    stopMusic();
    clearInterval(timerId);
  }

  function startGame() {
    ensureAudio();
    if (difficulty === "genius") {
      startGenius();
      return;
    }
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    gridLevel = 0;
    els.menu.classList.add("bm-hidden");
    if (els.genius) els.genius.classList.add("bm-hidden");
    els.play.classList.remove("bm-hidden");
    loadGridSector(true);
  }

  // --- Genius: NexCorp NX-8 VM crack ---
  function u8(n) { return n & 255; }

  function runNX8(code, inputBytes, leakRegs) {
    const mem = new Uint8Array(64);
    for (let i = 0; i < code.length && i < 64; i++) mem[i] = code[i];
    let A = 0, B = 0, Z = 0, PC = 0, ip = 0;
    const out = [];
    let steps = 0;
    while (steps++ < 4000) {
      if (PC < 0 || PC >= 64) return { out: out, err: "PC fault", A: A, B: B, Z: Z, steps: steps };
      const op = mem[PC++];
      if (op === 0x00) break;
      else if (op === 0x01) A = mem[PC++];
      else if (op === 0x02) B = mem[PC++];
      else if (op === 0x03) A = B;
      else if (op === 0x04) B = A;
      else if (op === 0x05) A = u8(A + B);
      else if (op === 0x06) A = u8(A ^ B);
      else if (op === 0x07) A = u8(A & B);
      else if (op === 0x08) A = u8(A | B);
      else if (op === 0x09) A = u8(~A);
      else if (op === 0x0A) A = ip < inputBytes.length ? inputBytes[ip++] : 0;
      else if (op === 0x0B) out.push(A);
      else if (op === 0x0C) Z = A === B ? 1 : 0;
      else if (op === 0x0D) { const a = mem[PC++]; if (Z) PC = a; }
      else if (op === 0x0E) PC = mem[PC++];
      else if (op === 0x0F) A = mem[mem[PC++] & 63];
      else if (op === 0x10) mem[mem[PC++] & 63] = A;
      else return { out: out, err: "bad opcode " + op.toString(16), A: A, B: B, Z: Z, steps: steps };
    }
    const res = { out: out, err: null, steps: steps };
    if (leakRegs) { res.A = A; res.B = B; res.Z = Z; }
    return res;
  }

  function outOk(bytes) {
    for (let i = 0; i + 1 < bytes.length; i++) {
      if (bytes[i] === 0x4F && bytes[i + 1] === 0x4B) return true;
    }
    return false;
  }

  // L1: emit syndrome (in^key) then OK/NO — probe 00 → first OUT byte is the key
  function progL1(keyByte) {
    return [
      0x0A, 0x02, keyByte, 0x06, 0x0B,
      0x02, 0x00, 0x0C, 0x0D, 0x11,
      0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00,
      0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00
    ];
  }

  // Patch JZ/JMP sites → shared OK / NO stubs
  function patchGate(code, sites, n) {
    const okAt = code.length;
    code.push(0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00);
    const failAt = code.length;
    code.push(0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00);
    for (let i = 0; i < n; i++) {
      code[sites[i] + 1] = i < n - 1 ? sites[i] + 4 : okAt;
      code[sites[i] + 3] = failAt;
    }
    return code;
  }

  // Exact multi-byte key → OK / NO (unique; one key only)
  function progExactBytes(key) {
    const code = [];
    const n = key.length;
    const sites = [];
    for (let i = 0; i < n; i++) {
      code.push(0x0A, 0x02, key[i], 0x06, 0x02, 0x00, 0x0C);
      sites.push(code.length);
      code.push(0x0D, 0x00, 0x0E, 0x00);
    }
    return patchGate(code, sites, n);
  }

  // Multi-byte XOR leak: OUT every in⊕key, then OK only if all matched (fail flag in mem[60])
  function progXorLeak(key) {
    const code = [0x01, 0x00, 0x10, 60];
    for (let i = 0; i < key.length; i++) {
      code.push(0x0A, 0x02, key[i], 0x06, 0x0B, 0x04, 0x0F, 60, 0x08, 0x10, 60);
    }
    code.push(0x0F, 60, 0x02, 0x00, 0x0C);
    const jzAt = code.length;
    code.push(0x0D, 0x00);
    code.push(0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00);
    const okAt = code.length;
    code.push(0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00);
    code[jzAt + 1] = okAt;
    return code;
  }

  function rk(n, rnd) {
    const a = [];
    for (let i = 0; i < n; i++) a.push(rnd());
    return a;
  }

  function buildGeniusChallenges() {
    const rnd = function () { return Math.floor(Math.random() * 256); };
    // xor: syndrome OUT; scored: prefix hint; leak: show regs
    const specs = [
      { n: 1, xor: 1, scored: 0, leak: 1, b: "1-byte XOR. Probe 00 → first OUT is the key." },
      { n: 2, xor: 0, scored: 1, leak: 1, b: "Exact 2-byte. Prefix score on NO." },
      { n: 3, xor: 0, scored: 1, leak: 0, b: "Exact 3-byte. Prefix score (lock one byte at a time)." },
      { n: 4, xor: 0, scored: 1, leak: 0, b: "Exact 4-byte. Prefix score on NO." },
      { n: 2, xor: 1, scored: 0, leak: 0, b: "2-byte XOR leak. Probe 0000 → OUT bytes are the key." },
      { n: 4, xor: 0, scored: 1, leak: 0, b: "Exact 4-byte. Prefix score on NO." },
      { n: 3, xor: 1, scored: 0, leak: 0, b: "3-byte XOR leak. Probe 000000 → OUT bytes are the key." },
      { n: 4, xor: 0, scored: 1, leak: 0, b: "Final exact 4-byte. Prefix score. 2 strikes total." }
    ];
    const total = specs.length;
    return specs.map(function (s, i) {
      let key, code;
      if (s.n === 1 && s.xor) {
        key = [rnd() || 0x5A];
        code = progL1(key[0]);
      } else if (s.xor) {
        key = rk(s.n, rnd);
        code = progXorLeak(key);
      } else {
        key = rk(s.n, rnd);
        code = progExactBytes(key);
      }
      return {
        code: code, key: key, len: s.n, leak: !!s.leak, scored: !!s.scored, syndrome: !!s.xor,
        brief: "L" + (i + 1) + "/" + total + " · " + s.b
      };
    });
  }

  function vmN() {
    return vmChallenges.length || 8;
  }

  function prefixScore(input, key) {
    let i = 0;
    while (i < key.length && i < input.length && input[i] === key[i]) i++;
    return i;
  }

  function hexByte(n) {
    return u8(n).toString(16).padStart(2, "0");
  }

  function parseHexBytes(str) {
    const clean = String(str || "").trim().toLowerCase().replace(/[^0-9a-f]/g, "");
    if (!clean.length || clean.length % 2) return null;
    const out = [];
    for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.substr(i, 2), 16));
    return out;
  }

  function fmtOut(bytes) {
    let ascii = "";
    const hex = bytes.map(hexByte).join(" ");
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      ascii += b >= 32 && b < 127 ? String.fromCharCode(b) : ".";
    }
    return hex + (ascii ? "  |  \"" + ascii + "\"" : "");
  }

  function setVmStatus(msg, cls) {
    if (!els.vmStatus) return;
    els.vmStatus.textContent = msg || "";
    els.vmStatus.className = "bm-status" + (cls ? " " + cls : "");
  }

  function appendLog(html) {
    if (!els.vmLog) return;
    if (els.vmLog.classList.contains("meta")) {
      els.vmLog.classList.remove("meta");
      els.vmLog.innerHTML = "";
    }
    const line = document.createElement("div");
    line.innerHTML = html;
    els.vmLog.appendChild(line);
    els.vmLog.scrollTop = els.vmLog.scrollHeight;
  }

  function loadVmLevel() {
    const ch = vmChallenges[vmLevel];
    vmCode = ch.code;
    vmExpectLen = ch.len;
    vmShowRegs = ch.leak;
    if (els.vmBrief) els.vmBrief.textContent = ch.brief;
    if (els.probe) els.probe.value = "";
    if (els.answer) els.answer.value = "";
    setVmStatus("Kernel " + (vmLevel + 1) + "/" + vmN() + " online. Probes: " + vmProbes);
    updateHUD();
  }

  function startGenius() {
    geniusMode = true;
    playing = true;
    paused = false;
    won = false;
    mistakes = 0;
    maxMistakes = 2;
    score = 0;
    vmProbes = 0;
    vmLevel = 0;
    vmSecrets = [];
    vmChallenges = buildGeniusChallenges();
    elapsedMs = 0;
    startedAt = Date.now();
    els.menu.classList.add("bm-hidden");
    els.play.classList.add("bm-hidden");
    els.genius.classList.remove("bm-hidden");
    els.pauseOv.classList.remove("show");
    els.vmLog.classList.add("meta");
    els.vmLog.textContent = "NX-8 sandbox ready. Program hidden. ISA visible.\nEnter probe hex and RUN. SUBMIT when sure.";
    loadVmLevel();
    startTimer();
    playMusic();
    beep(880, 0.08, "square", 0.06);
    beep(440, 0.12, "triangle", 0.06);
    sizeRain();
  }

  function geniusFailStrike(why) {
    mistakes++;
    updateHUD();
    setVmStatus(why + " · strikes " + mistakes + "/" + maxMistakes, "err");
    beep(160, 0.2, "sawtooth", 0.09);
    if (mistakes >= maxMistakes) {
      playing = false;
      setVmStatus("KERNEL LOCK — genius link severed.", "err");
      pauseMusic();
    }
  }

  function runProbe() {
    if (!geniusMode || !playing || paused || won) return;
    const bytes = parseHexBytes(els.probe.value);
    if (!bytes) {
      setVmStatus("Bad hex — use even digits, e.g. a7 or 3f1290", "err");
      return;
    }
    vmProbes++;
    const res = runNX8(vmCode, bytes, vmShowRegs);
    let html = "<span class='meta'>#" + vmProbes + " IN [" + bytes.map(hexByte).join(" ") + "]</span>\n";
    if (res.err) html += "<span class='bad'>FAULT: " + res.err + "</span>";
    else {
      const ok = outOk(res.out);
      html += (ok ? "<span class='ok'>" : "<span class='bad'>") + "OUT " + fmtOut(res.out) + "</span>";
      const ch = vmChallenges[vmLevel];
      if (!ok && ch && ch.scored) {
        const ps = prefixScore(bytes, ch.key);
        html += " <span class='meta'>· prefix score " + ps + "/" + ch.key.length + " leading bytes correct</span>";
      }
      if (ch && ch.syndrome && res.out.length) {
        const syn = res.out.slice(0, ch.len).map(hexByte).join(" ");
        html += " <span class='meta'>· syndrome " + syn + " (probe 00… ⇒ key)</span>";
      }
      html += " <span class='meta'>· " + res.steps + " cycles</span>";
      if (vmShowRegs) html += " <span class='meta'>· A=" + hexByte(res.A) + " B=" + hexByte(res.B) + " Z=" + res.Z + "</span>";
    }
    appendLog(html);
    setVmStatus("Probes: " + vmProbes + " · Kernel " + (vmLevel + 1) + "/" + vmN());
    beep(okTone(res), 0.07, "square", 0.05);
    updateHUD();
  }

  function okTone(res) {
    return res && res.out && res.out[0] === 0x4F ? 720 : 280;
  }

  function submitKey() {
    if (!geniusMode || !playing || paused || won) return;
    const bytes = parseHexBytes(els.answer.value);
    const ch = vmChallenges[vmLevel];
    if (!bytes || bytes.length !== ch.key.length) {
      setVmStatus("Key must be exactly " + ch.key.length + " byte(s) hex.", "err");
      return;
    }
    // Verify via VM
    const res = runNX8(ch.code, bytes, false);
    const ok = outOk(res.out);
    if (!ok) {
      geniusFailStrike("SUBMIT rejected");
      appendLog("<span class='bad'>SUBMIT [" + bytes.map(hexByte).join(" ") + "] → DENIED</span>");
      return;
    }
    vmSecrets.push(bytes.map(hexByte).join(""));
    appendLog("<span class='ok'>SUBMIT [" + bytes.map(hexByte).join(" ") + "] → GATE OPEN</span>");
    beep(660, 0.1, "triangle", 0.08);
    if (vmLevel >= vmChallenges.length - 1) {
      geniusWin();
      return;
    }
    vmLevel++;
    loadVmLevel();
    setVmStatus("Gate cleared. Kernel " + (vmLevel + 1) + "/" + vmN() + " primed.", "ok");
  }

  function geniusWin() {
    won = true;
    playing = false;
    const bonus = Math.max(0, 10000 - vmProbes * 30 - mistakes * 500 - Math.floor(elapsedMs / 1000) * 3);
    score = 8000 + vmN() * 1000 + bonus;
    updateHUD();
    const code = vmSecrets.join("");
    setVmStatus("NEXCORP BREACHED — matrix key " + code + " · score " + score, "ok");
    appendLog("<span class='ok'>ALL KERNELS OPEN · KEYCHAIN " + code + "</span>");
    playWinFanfare();
    if (bgMusic) bgMusic.volume = muted ? 0 : Math.min(musicVol, 0.22);
  }

  function restartSame() {
    if (!puzzle || geniusMode) return startGame();
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    grid = clone(puzzle);
    playing = true;
    paused = false;
    won = false;
    mistakes = 0;
    maxMistakes = sectorSpec()[2];
    startedAt = Date.now() - elapsedMs;
    els.pauseOv.classList.remove("show");
    setStatus("Sector " + (gridLevel + 1) + " reset — score kept.");
    renderGrid(false);
    updateHUD();
    startTimer();
    playMusic();
  }

  function checkBoard() {
    if (!playing || paused || won) return;
    const mask = violationMask(grid);
    let any = false, empty = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (grid[r][c] === -1) empty++;
      if (mask[r][c]) any = true;
    }
    renderGrid(true);
    if (empty === N * N) {
      setStatus("Place some bits first.", "err");
      return;
    }
    if (any) {
      mistakes++;
      updateHUD();
      setStatus("Violations highlighted in red.", "err");
      beep(200, 0.15, "sawtooth", 0.08);
      if (mistakes >= maxMistakes) failOut();
    } else if (empty) {
      setStatus("No conflicts yet — " + empty + " cells remain.");
      beep(640, 0.1, "triangle", 0.06);
    } else if (isCompleteValid(grid)) {
      onWin();
    } else {
      setStatus("Board full but invalid uniqueness.", "err");
    }
  }

  function solveIt() {
    if (difficulty !== "easy" || !solution || won) return;
    grid = clone(solution);
    renderGrid(false);
    onWin();
  }

  function togglePause() {
    if (!playing || won) return;
    paused = !paused;
    if (paused) {
      elapsedMs = Date.now() - startedAt;
      els.pauseOv.classList.add("show");
      pauseMusic();
      beep(400, 0.12, "sine", 0.06);
    } else {
      startedAt = Date.now() - elapsedMs;
      els.pauseOv.classList.remove("show");
      playMusic();
      beep(520, 0.1, "sine", 0.06);
    }
  }

  // --- Wire UI ---
  ROOT.querySelectorAll(".bm-diff").forEach(function (btn) {
    btn.addEventListener("click", function () {
      difficulty = btn.dataset.diff;
      ROOT.querySelectorAll(".bm-diff").forEach(function (b) { b.classList.toggle("selected", b === btn); });
      if (menuRules) menuRules.innerHTML = difficulty === "genius" ? RULES_GENIUS : RULES_GRID;
      updateHUD();
      beep(700, 0.05, "square", 0.04);
    });
  });

  ROOT.querySelector("#bm-start").addEventListener("click", startGame);
  ROOT.querySelector("#bm-tutorial").addEventListener("click", function () {
    els.helpOv.classList.add("show");
    beep(600, 0.05, "square", 0.04);
  });
  ROOT.querySelector("#bm-help-close").addEventListener("click", function () {
    els.helpOv.classList.remove("show");
  });
  ROOT.querySelector("#bm-menu-btn").addEventListener("click", showMenu);
  ROOT.querySelector("#bm-restart").addEventListener("click", restartSame);
  ROOT.querySelector("#bm-pause-btn").addEventListener("click", togglePause);
  ROOT.querySelector("#bm-resume").addEventListener("click", togglePause);
  els.checkBtn.addEventListener("click", checkBoard);
  els.solveBtn.addEventListener("click", solveIt);
  els.grid.addEventListener("click", cellClick);

  ROOT.querySelector("#bm-run-probe").addEventListener("click", runProbe);
  ROOT.querySelector("#bm-submit-key").addEventListener("click", submitKey);
  ROOT.querySelector("#bm-vm-menu").addEventListener("click", showMenu);
  ROOT.querySelector("#bm-vm-pause").addEventListener("click", togglePause);
  ROOT.querySelector("#bm-vm-isa").addEventListener("click", function () {
    if (els.geniusHelp) els.geniusHelp.classList.add("show");
    else els.helpOv.classList.add("show");
  });
  const gClose = ROOT.querySelector("#bm-genius-help-close");
  if (gClose) {
    gClose.addEventListener("click", function () {
      els.geniusHelp.classList.remove("show");
    });
  }
  els.probe.addEventListener("keydown", function (e) {
    if (e.key === "Enter") runProbe();
  });
  els.answer.addEventListener("keydown", function (e) {
    if (e.key === "Enter") submitKey();
  });

  function syncVol() {
    musicVol = Number(els.vol.value);
    sfxVol = Number(els.sfx.value);
    if (bgMusic) bgMusic.volume = muted ? 0 : musicVol;
    ROOT.querySelector("#bm-vol-lbl").textContent = Math.round(musicVol * 100) + "%";
    ROOT.querySelector("#bm-sfx-lbl").textContent = Math.round(sfxVol * 100) + "%";
  }
  els.vol.addEventListener("input", syncVol);
  els.sfx.addEventListener("input", syncVol);
  els.mute.addEventListener("click", function () {
    muted = !muted;
    els.mute.textContent = muted ? "UNMUTE" : "MUTE";
    els.mute.setAttribute("aria-pressed", muted ? "true" : "false");
    if (bgMusic) bgMusic.volume = muted ? 0 : musicVol;
    beep(500, 0.06, "square", 0.05);
  });

  // init
  setupMusic();
  sizeRain();
  requestAnimationFrame(function () { sizeRain(); drawRain(); });
  updateHUD();
})();
