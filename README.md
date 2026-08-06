# The Binary Matrix — Game

by **8bitcrypto_44**

Companion puzzle for *The Binary Matrix* book series. Digistracts-width (920px) lime frame with live matrix rain inside the border.

## Play online

**GitHub Pages:** https://8bitcrypto44.github.io/The-Binary-Matrix/

## Play locally

```bash
python build_game.py
python -m http.server 8781
```

Open http://localhost:8781/

## GoDaddy / website embed

1. Run `python build_game.py`
2. Paste the **entire** contents of `binary_matrix_godaddy_block.html` into a Website Builder HTML section

## Features

- New unique 4×4 / 6×6 Takuzu puzzle each sector — linked campaigns per difficulty
- Locked clue cells, empty → 0 → 1 → empty cycle
- Live rule conflict highlights
- Easy / Medium / Hard / Genius (NexCorp kernel crack)
- Score, timer, CHECK strikes
- Matrix rain wallpaper + Clubbed to Death music
- Clean lime-border UI matching Digistracts width

## Source layout

| File | Purpose |
|------|---------|
| `binary_matrix.css` | Styles |
| `binary_matrix.js` | Game logic |
| `binary_matrix.body.html` | HTML shell |
| `build_game.py` | Builds `index.html` + GoDaddy block |
| `index.html` | GitHub Pages entry (generated) |

After editing CSS/JS/body, run `python build_game.py` before committing.
