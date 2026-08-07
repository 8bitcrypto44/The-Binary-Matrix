#!/usr/bin/env python3
"""Full Binary Matrix QA: all campaign diffs + genius + perks/buttons via Chrome CDP."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

import websocket

ROOT = Path(__file__).resolve().parent
PORT = 8802
CDP_PORT = 9345
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

for arg in sys.argv[1:]:
    if arg.startswith("--port="):
        PORT = int(arg.split("=", 1)[1])
    elif arg.startswith("--cdp="):
        CDP_PORT = int(arg.split("=", 1)[1])


def http_json(url: str, timeout: float = 8.0):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode())


class CDP:
    def __init__(self, ws_url: str):
        self.ws = websocket.create_connection(ws_url, timeout=600)
        self._id = 0

    def call(self, method: str, params=None, timeout: float = 600.0):
        self._id += 1
        msg = {"id": self._id, "method": method}
        if params is not None:
            msg["params"] = params
        self.ws.settimeout(timeout)
        self.ws.send(json.dumps(msg))
        while True:
            raw = self.ws.recv()
            data = json.loads(raw)
            if "method" in data and "id" not in data:
                continue
            if data.get("id") == self._id:
                if "error" in data:
                    raise RuntimeError(f"{method}: {data['error']}")
                return data.get("result", {})

    def evaluate(self, expression: str, timeout: float = 600.0):
        result = self.call(
            "Runtime.evaluate",
            {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": True,
                "timeout": int(min(timeout * 1000, 2147483647)),
            },
            timeout=timeout + 30,
        )
        if result.get("exceptionDetails"):
            raise RuntimeError(json.dumps(result["exceptionDetails"], indent=2)[:4000])
        return result.get("result", {}).get("value")

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass


def start_server():
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def log_message(self, fmt, *args):
            pass

    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    thread = Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def wait_cdp(timeout: float = 30.0):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            return http_json(f"http://127.0.0.1:{CDP_PORT}/json/version")
        except Exception:
            time.sleep(0.2)
    raise RuntimeError("Chrome CDP not ready")


def main():
    httpd = start_server()
    base = f"http://127.0.0.1:{PORT}/index.html"
    try:
        urllib.request.urlopen(base, timeout=5).read(200)
    except Exception as e:
        raise SystemExit(f"Local server failed: {e}")

    profile = tempfile.mkdtemp(prefix="bm-qa-")
    chrome = subprocess.Popen(
        [
            CHROME,
            f"--remote-debugging-port={CDP_PORT}",
            "--remote-allow-origins=*",
            f"--user-data-dir={profile}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-popup-blocking",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    cdp = None
    try:
        wait_cdp()
        targets = http_json(f"http://127.0.0.1:{CDP_PORT}/json/list")
        page = next(t for t in targets if t.get("type") == "page")
        cdp = CDP(page["webSocketDebuggerUrl"])
        cdp.call("Page.enable")
        cdp.call("Page.navigate", {"url": base})
        cdp.evaluate(
            """
            new Promise(function(resolve, reject) {
              var t0 = Date.now();
              (function poll() {
                if (window.__BM_QA_READY && window.__BM_QA) return resolve(true);
                if (Date.now() - t0 > 45000) return reject(new Error('__BM_QA not ready'));
                setTimeout(poll, 100);
              })();
            })
            """,
            timeout=60,
        )
        report = cdp.evaluate("window.__BM_QA.runSuite()", timeout=600)
        out_path = ROOT / "qa_playthrough_results.json"
        out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(json.dumps(report, indent=2))
        print(f"\nWrote {out_path}")
        if not report.get("pass"):
            return 1
        return 0
    finally:
        if cdp:
            cdp.close()
        try:
            chrome.terminate()
            chrome.wait(timeout=5)
        except Exception:
            try:
                chrome.kill()
            except Exception:
                pass
        shutil.rmtree(profile, ignore_errors=True)
        httpd.shutdown()


if __name__ == "__main__":
    sys.exit(main())
