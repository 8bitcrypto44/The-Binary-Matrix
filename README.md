# The Binary Matrix — Game

by **8bitcrypto_44**

Companion puzzle for *The Binary Matrix* book series. NexCorp lime frame, dual-layer matrix rain, boot sequence, and CPU-gate Genius mode.

## Play online

**GitHub Pages:** https://8bitcrypto44.github.io/The-Binary-Matrix/

## GoDaddy (iframe — recommended)

1. Run `python build_game.py`
2. Paste **entire** `godaddy_iframe_snippet.html` into a Website Builder HTML section
3. Visitors click **JACK IN** → full game loads from GitHub Pages (no size limit)

## Play locally

```bash
python build_game.py
python -m http.server 8781
```

Open http://localhost:8781/

## Rebuild after edits

```bash
python build_game.py
```

Bump `ASSET_VER` in `build_game.py` when publishing so Pages/CDN pick up new CSS/JS.

## Features

- NexCorp **boot sequence** on load
- **Daily node** — same 6×6 puzzle worldwide each day + share on X
- **Continue link** — resume mid-campaign after refresh
- **Keyboard** — arrows, Space, Enter
- Dual-layer matrix rain + **ambient hum** + scanlines
- Lore-named campaign sectors (Easy / Medium / Hard)
- Sector transition cards + **keychain victory** screen
- **localStorage** best scores per difficulty
- **Genius** — 8 named NexCorp CPU gates, register panel, progress bar
- `?embed=1` for iframe hosting

## Source layout

| File | Purpose |
|------|---------|
| `binary_matrix.css` | Styles |
| `binary_matrix.js` | Game logic |
| `binary_matrix.body.html` | HTML shell |
| `build_game.py` | Builds `index.html` + iframe snippet |
| `godaddy_iframe_snippet.html` | GoDaddy paste (~8KB) |
