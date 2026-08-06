#!/usr/bin/env python3
"""Assemble Binary Matrix GoDaddy paste block + local preview."""
from pathlib import Path
import base64
import re

root = Path(__file__).resolve().parent
css = root.joinpath("binary_matrix.css").read_text(encoding="utf-8")
js = root.joinpath("binary_matrix.js").read_text(encoding="utf-8")
body = root.joinpath("binary_matrix.body.html").read_text(encoding="utf-8")

logo_path = root / "assets" / "brand" / "8bitcrypto44_logo.png"
if logo_path.exists():
    logo_uri = "data:image/png;base64," + base64.b64encode(logo_path.read_bytes()).decode("ascii")
else:
    logo_uri = ""
body = body.replace("__BRAND_LOGO_SRC__", logo_uri)

# minify lightly
css_min = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
css_min = re.sub(r"\s+", " ", css_min).strip()
css_min = re.sub(r"\s*([{:;,}>~+])\s*", r"\1", css_min)

js_min = re.sub(r"^\s*//.*$", "", js, flags=re.M)
js_min = re.sub(r"/\*.*?\*/", "", js_min, flags=re.S)
js_min = re.sub(r"\n\s*\n", "\n", js_min).strip()

body_min = re.sub(r">\s+<", "><", body.strip())

block = (
    "<!-- THE BINARY MATRIX by 8bitcrypto_44 — paste entire block into GoDaddy HTML -->\n"
    f"<style>\n{css_min}\n</style>\n"
    f"{body_min}\n"
    f"<script>\n{js_min}\n</script>\n"
)
block = re.sub(r"<!--.*?-->\s*", "", block, count=1, flags=re.S).strip() + "\n"

out_block = root / "binary_matrix_godaddy_block.html"
out_block.write_text(block, encoding="utf-8")

preview = (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n"
    "<meta charset=\"UTF-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no\">\n"
    "<title>The Binary Matrix by 8bitcrypto_44</title>\n"
    "<style>html,body{margin:0;background:#020603;min-height:100%;}"
    "body{padding:16px;box-sizing:border-box;}</style>\n"
    "</head>\n<body>\n"
    + block
    + "</body>\n</html>\n"
)
(root / "index.html").write_text(preview, encoding="utf-8")

print("godaddy block", out_block.stat().st_size)
print("index", (root / "index.html").stat().st_size)
print("brand logo embedded", bool(logo_uri), logo_path.stat().st_size if logo_path.exists() else 0)
print("limit tip: Digistracts uses ~51375; this block is", out_block.stat().st_size)
