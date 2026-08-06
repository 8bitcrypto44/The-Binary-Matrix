#!/usr/bin/env python3
"""Build GitHub Pages multi-file host + GoDaddy iframe snippet."""
from pathlib import Path
import base64
import re

root = Path(__file__).resolve().parent

ASSET_VER = "10"
PAGES_URL = "https://8bitcrypto44.github.io/The-Binary-Matrix/"
_brand_logo = root / "assets" / "brand" / "8bitcrypto44_logo.png"
BRAND_LOGO_URI = (
    "data:image/png;base64," + base64.b64encode(_brand_logo.read_bytes()).decode("ascii")
    if _brand_logo.exists()
    else f"{PAGES_URL}assets/brand/8bitcrypto44_logo.png?v={ASSET_VER}"
)


def minify_css(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s*([{:;,}>~+])\s*", r"\1", s)
    return s


body = root.joinpath("binary_matrix.body.html").read_text(encoding="utf-8")
body = body.replace("__BRAND_LOGO_SRC__", BRAND_LOGO_URI)

css = root.joinpath("binary_matrix.css").read_text(encoding="utf-8")
def merge_js():
    js_path = root.joinpath("binary_matrix.js")
    src = js_path.read_text(encoding="utf-8")
    s4 = root.joinpath("bm_sprint4.js").read_text(encoding="utf-8").strip() + "\n"
    wire = "  // --- Wire UI ---"
    start_mark = "// === SPRINT 4+ FEATURE PACK ==="
    if start_mark in src and wire in src:
        pre = src.split(start_mark)[0]
        post = wire + src.split(wire, 1)[1]
        merged = pre + s4 + "\n" + post
    elif "// __SPRINT4_INJECT__" in src:
        merged = src.replace("// __SPRINT4_INJECT__\n", s4)
    else:
        merged = src
    js_path.write_text(merged, encoding="utf-8")
    return merged


js = merge_js()

v = ASSET_VER
pages = (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n"
    "<meta charset=\"UTF-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no\">\n"
    "<meta name=\"description\" content=\"The Binary Matrix — jack in, crack NexCorp grids and CPU gates.\">\n"
    "<title>The Binary Matrix by 8bitcrypto_44</title>\n"
    f"<link rel=\"stylesheet\" href=\"binary_matrix.css?v={v}\">\n"
    "<style>html,body{margin:0;min-height:100%;background:#020603;}"
    "html.bm-embed,html.bm-embed body{padding:0;background:#020603;height:100%;overflow:auto;-webkit-overflow-scrolling:touch;}</style>\n"
    "</head>\n<body>\n"
    + body.strip()
    + "\n"
    f"<script src=\"binary_matrix.js?v={v}\"></script>\n"
    "</body>\n</html>\n"
)
(root / "index.html").write_text(pages, encoding="utf-8")

iframe_src = f"{PAGES_URL}?embed=1&v={v}"
iframe_src_attr = iframe_src.replace("&", "&amp;")

iframe_snippet = f"""<!-- THE BINARY MATRIX — GoDaddy: cover card → JACK IN iframe -->
<style>
.bm-gd{{box-sizing:border-box;width:100%;max-width:920px;margin:0 auto;font-family:"Courier New",Courier,monospace;color:#e8ffe8}}
.bm-gd *{{box-sizing:border-box}}
.bm-gd-card{{
  border:4px solid #39ff14;border-radius:12px;padding:10px;overflow:hidden;
  background:linear-gradient(180deg,#020603,#0a140c 55%,#061008);
  box-shadow:0 0 24px rgba(57,255,20,.28),0 12px 28px rgba(0,0,0,.45)
}}
.bm-gd-top{{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}}
.bm-gd-brand{{font-size:15px;letter-spacing:2px;color:#39ff14;font-weight:700;text-shadow:0 0 10px rgba(57,255,20,.4)}}
.bm-gd-brand span{{color:#86efac;font-weight:400;font-size:12px;letter-spacing:1px}}
.bm-gd-stage{{position:relative;width:100%;aspect-ratio:16/10;background:#020603;border:2px solid #14532d;border-radius:8px;overflow:hidden}}
.bm-gd-cover{{position:absolute;inset:0;transition:opacity .55s ease}}
.bm-gd-hero{{position:absolute;inset:0;background:#020603;overflow:hidden}}
.bm-gd-art{{position:absolute;inset:0;width:100%;height:100%;display:block}}
.bm-gd-matrix{{
  position:absolute;inset:0;opacity:.35;
  background:repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(57,255,20,.04) 18px,rgba(57,255,20,.04) 19px);
  animation:bmGdRain 12s linear infinite
}}
@keyframes bmGdRain{{0%{{background-position:0 0}}100%{{background-position:0 240px}}}}
.bm-gd-glyphs{{
  position:absolute;inset:0;font-size:11px;line-height:14px;color:#22c55e;opacity:.25;
  word-break:break-all;padding:8px;pointer-events:none;user-select:none
}}
.bm-gd-veil{{
  position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center;
  background:linear-gradient(180deg,rgba(2,6,3,.35) 0%,rgba(2,8,4,.82) 50%,rgba(0,4,2,.94) 100%)
}}
.bm-gd-title{{margin:0;font-size:clamp(24px,5.5vw,42px);font-weight:700;letter-spacing:3px;color:#39ff14;text-shadow:0 0 20px rgba(57,255,20,.55),2px 2px 0 #000;line-height:1.1}}
.bm-gd-tag{{margin:0;font-size:clamp(13px,2.8vw,15px);color:#bbf7d0;max-width:28em;line-height:1.45}}
.bm-gd-tip{{margin:0;font-size:clamp(12px,2.4vw,14px);color:#86efac;max-width:28em}}
.bm-gd-promo{{margin:0;font-size:12px;color:#6b7280;max-width:32em}}
.bm-gd-site{{position:absolute;left:10px;bottom:8px;z-index:3;display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px;text-decoration:none;opacity:.9}}
.bm-gd-site img{{width:96px;max-width:100%;height:auto;image-rendering:pixelated;filter:drop-shadow(0 0 6px rgba(57,255,20,.3))}}
.bm-gd-site span{{font-size:10px;color:#39ff14;letter-spacing:.4px}}
.bm-gd-enter{{
  appearance:none;border:3px solid #39ff14;border-radius:10px;padding:12px 28px;font:700 16px "Courier New",Courier,monospace;
  letter-spacing:.5px;cursor:pointer;color:#031406;background:linear-gradient(180deg,#39ff14,#0a9a2a);
  box-shadow:0 0 18px rgba(57,255,20,.4),0 4px 0 #052;transition:transform .12s,box-shadow .12s
}}
.bm-gd-enter:hover{{transform:translateY(-2px) scale(1.03);box-shadow:0 0 26px rgba(57,255,20,.55),0 6px 0 #052}}
.bm-gd-enter:active{{transform:scale(.98)}}
.bm-gd-play{{display:none;position:absolute;inset:0;background:#020603;line-height:0}}
.bm-gd-play iframe{{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#020603}}
.bm-gd-load{{
  display:none;position:absolute;inset:0;z-index:15;align-items:center;justify-content:center;
  background:rgba(0,8,2,.92);color:#39ff14;font:700 16px "Courier New",Courier,monospace;padding:20px;text-align:center
}}
.bm-gd.is-loading .bm-gd-load{{display:flex}}
.bm-gd.is-fading .bm-gd-cover{{opacity:0}}
.bm-gd.is-open .bm-gd-cover{{display:none}}
.bm-gd.is-open .bm-gd-play{{display:block}}
.bm-gd.is-open .bm-gd-top{{display:none!important}}
.bm-gd.is-open .bm-gd-card{{padding:0;display:flex;flex-direction:column}}
.bm-gd.is-open:not(.is-fs-mode):not(.is-land) .bm-gd-stage{{
  aspect-ratio:auto!important;min-height:680px;height:auto!important;border:0!important;border-radius:0!important;overflow:visible
}}
.bm-gd.is-open:not(.is-fs-mode):not(.is-land) .bm-gd-play{{
  position:relative;inset:auto;min-height:680px
}}
.bm-gd.is-open:not(.is-fs-mode):not(.is-land) .bm-gd-play iframe{{
  position:relative;inset:auto;min-height:680px;height:680px
}}
.bm-gd.is-open.is-land,.bm-gd.is-fs-mode{{
  position:fixed!important;inset:0!important;width:100vw!important;width:100dvw!important;height:100vh!important;height:100dvh!important;
  max-width:none!important;margin:0!important;padding:0!important;z-index:2147483646!important;background:#020603!important
}}
.bm-gd.is-open.is-land .bm-gd-card,.bm-gd.is-fs-mode .bm-gd-card{{
  height:100%!important;width:100%!important;border:0!important;border-radius:0!important;padding:0!important;box-shadow:none!important;
  display:flex!important;flex-direction:column!important;background:#020603!important
}}
.bm-gd.is-open.is-land .bm-gd-top,.bm-gd.is-fs-mode .bm-gd-top{{display:none!important}}
.bm-gd.is-open.is-land .bm-gd-stage,.bm-gd.is-fs-mode .bm-gd-stage{{
  flex:1!important;min-height:0!important;aspect-ratio:auto!important;height:auto!important;border:0!important;border-radius:0!important
}}
@media (max-width:700px){{
  .bm-gd-card{{padding:4px;border-width:2px}}
  .bm-gd-enter{{padding:14px 22px;min-height:48px;width:min(100%,280px)}}
  .bm-gd-site img{{width:72px}}
}}
</style>
<div class="bm-gd" id="bm-gd">
  <div class="bm-gd-card">
    <div class="bm-gd-top">
      <div class="bm-gd-brand">THE BINARY MATRIX <span>by 8bitcrypto_44</span></div>
    </div>
    <div class="bm-gd-stage">
      <div class="bm-gd-cover">
        <div class="bm-gd-hero" aria-hidden="true">
          <div class="bm-gd-matrix"></div>
          <svg class="bm-gd-art" viewBox="0 0 920 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="bmG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#020603"/>
                <stop offset="100%" stop-color="#0a140c"/>
              </linearGradient>
              <filter id="bmGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect width="920" height="520" fill="url(#bmG)"/>
            <g fill="none" stroke="#39ff14" stroke-opacity=".35" stroke-width="1">
              <path d="M0 80 H920 M0 160 H920 M0 240 H920 M0 320 H920 M0 400 H920"/>
              <path d="M80 0 V520 M160 0 V520 M240 0 V520 M320 0 V520 M400 0 V520 M480 0 V520 M560 0 V520 M640 0 V520 M720 0 V520 M800 0 V520"/>
            </g>
            <text x="460" y="250" text-anchor="middle" fill="#39ff14" font-family="Courier New,monospace" font-size="42" font-weight="700" filter="url(#bmGlow)" opacity=".85">NEXCORP</text>
            <text x="460" y="290" text-anchor="middle" fill="#86efac" font-family="Courier New,monospace" font-size="16" opacity=".7">THE BINARY MATRIX</text>
          </svg>
          <div class="bm-gd-glyphs">010011010010110101100110011010010101101001011010010110100101101001011010010110100101101001011010</div>
        </div>
        <div class="bm-gd-veil">
          <h2 class="bm-gd-title">THE BINARY MATRIX</h2>
          <p class="bm-gd-tag">Crack the grid · Jack the kernel · Survive NexCorp</p>
          <p class="bm-gd-tip">Easy → Hard campaigns · Genius = 8 CPU gates · Matrix rain + soundtrack</p>
          <button type="button" class="bm-gd-enter" id="bm-gd-enter" aria-expanded="false">JACK IN</button>
          <p class="bm-gd-promo">Companion game to the Binary Matrix book series</p>
          <a class="bm-gd-site" href="https://www.8bitcrypto44.xyz" target="_blank" rel="noopener noreferrer">
            <img src="{BRAND_LOGO_URI}" alt="" width="96" height="13" decoding="async">
            <span>www.8bitcrypto44.xyz</span>
          </a>
        </div>
      </div>
      <div class="bm-gd-play" id="bm-gd-play">
        <div class="bm-gd-load" id="bm-gd-load">Establishing NexCorp link…</div>
        <iframe id="bm-gd-frame" title="The Binary Matrix" width="100%" height="680"
          data-src="{iframe_src_attr}" allow="autoplay; fullscreen" allowfullscreen scrolling="auto"></iframe>
      </div>
    </div>
  </div>
</div>
<script>
(function(){{
  var root=document.getElementById("bm-gd"),btn=document.getElementById("bm-gd-enter"),frame=document.getElementById("bm-gd-frame");
  if(!root||!btn||!frame)return;
  var baseSrc="{iframe_src}";
  function phone(){{try{{if(window.matchMedia("(pointer: fine)").matches&&!window.matchMedia("(pointer: coarse)").matches)return false;}}catch(e){{}}return(("ontouchstart" in window)||navigator.maxTouchPoints>0)&&!!(window.matchMedia&&window.matchMedia("(pointer: coarse)").matches);}}
  function land(){{return window.matchMedia&&window.matchMedia("(orientation: landscape)").matches||window.innerWidth>window.innerHeight;}}
  function isFs(){{return root.classList.contains("is-fs-mode")||!!(document.fullscreenElement||document.webkitFullscreenElement);}}
  function syncLand(){{root.classList.toggle("is-land",root.classList.contains("is-open")&&phone()&&land());}}
  function setFrameHeight(h){{
    h=Math.max(560,Math.min(Number(h)||680,960));
    frame.style.height=h+"px";
    var st=root.querySelector(".bm-gd-stage");
    var pl=document.getElementById("bm-gd-play");
    if(st){{st.style.minHeight=h+"px";st.style.aspectRatio="auto";}}
    if(pl)pl.style.minHeight=h+"px";
  }}
  function mountFs(){{if(root.dataset.bmMounted==="1")return;var slot=document.createElement("div");slot.setAttribute("data-bm-slot","1");slot.style.cssText="display:block;width:100%;max-width:920px;margin:0 auto;height:"+Math.max(1,Math.round(root.getBoundingClientRect().height))+"px";if(root.parentNode)root.parentNode.insertBefore(slot,root);document.body.appendChild(root);root.dataset.bmMounted="1";}}
  function unmountFs(){{if(root.dataset.bmMounted!=="1")return;var slot=document.querySelector("[data-bm-slot]");if(slot&&slot.parentNode){{slot.parentNode.insertBefore(root,slot);slot.parentNode.removeChild(slot);}}delete root.dataset.bmMounted;}}
  function finishExit(){{unmountFs();root.classList.remove("is-fs-mode");try{{document.documentElement.style.overflow="";document.body.style.overflow="";}}catch(e){{}}syncLand();}}
  function enterFs(){{mountFs();root.classList.add("is-fs-mode");try{{document.documentElement.style.overflow="hidden";document.body.style.overflow="hidden";}}catch(e){{}}var req=frame.requestFullscreen||frame.webkitRequestFullscreen;if(req&&!document.fullscreenElement){{try{{var p=req.call(frame);if(p&&p.catch)p.catch(function(){{}});}}catch(e){{}}}}}}
  function exitFs(){{root.classList.remove("is-fs-mode");var ex=document.exitFullscreen||document.webkitExitFullscreen;if(ex&&document.fullscreenElement){{try{{var p=ex.call(document);if(p&&p.then)p.then(finishExit).catch(finishExit);else finishExit();}}catch(e){{finishExit();}}}}else finishExit();}}
  btn.addEventListener("click",function(){{
    frame.setAttribute("src",baseSrc);root.classList.add("is-open","is-loading","is-fading");btn.setAttribute("aria-expanded","true");
    if(phone())enterFs();syncLand();setTimeout(function(){{root.classList.remove("is-fading");}},600);
  }});
  frame.addEventListener("load",function(){{root.classList.remove("is-loading");}});
  setTimeout(function(){{root.classList.remove("is-loading");}},8000);
  window.addEventListener("message",function(e){{
    if(!e.data||typeof e.data!=="object")return;
    if(e.data.type==="bm-fs")enterFs();
    if(e.data.type==="bm-fs-exit")exitFs();
    if(e.data.type==="bm-resize"&&e.data.height&&!isFs()&&!root.classList.contains("is-land"))setFrameHeight(e.data.height);
  }});
  document.addEventListener("fullscreenchange",function(){{if(!document.fullscreenElement&&!document.webkitFullscreenElement&&root.classList.contains("is-fs-mode"))finishExit();}});
  document.addEventListener("webkitfullscreenchange",function(){{if(!document.fullscreenElement&&!document.webkitFullscreenElement&&root.classList.contains("is-fs-mode"))finishExit();}});
  window.addEventListener("resize",syncLand);
  window.addEventListener("orientationchange",function(){{setTimeout(syncLand,120);}});
}})();
</script>
"""

for name in ("godaddy_iframe_snippet.html", "binary_matrix_godaddy_block.html"):
    (root / name).write_text(iframe_snippet, encoding="utf-8")

print("index.html", (root / "index.html").stat().st_size)
print("iframe snippet", (root / "godaddy_iframe_snippet.html").stat().st_size)
print("ASSET_VER", v)
