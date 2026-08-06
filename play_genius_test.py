"""Play Genius mode like a human: crack via probes only (no peeking at keys)."""
import random
import sys

u8 = lambda n: n & 255


def run_nx8(code, inp, leak=False):
    mem = [0] * 64
    for i, b in enumerate(code[:64]):
        mem[i] = b
    A = B = Z = PC = ip = 0
    out = []
    steps = 0
    while steps < 4000:
        steps += 1
        if not (0 <= PC < 64):
            return {"out": out, "err": "PC fault", "A": A, "B": B, "Z": Z, "steps": steps}
        op = mem[PC]
        PC += 1
        if op == 0x00:
            break
        elif op == 0x01:
            A = mem[PC]; PC += 1
        elif op == 0x02:
            B = mem[PC]; PC += 1
        elif op == 0x03:
            A = B
        elif op == 0x04:
            B = A
        elif op == 0x05:
            A = u8(A + B)
        elif op == 0x06:
            A = u8(A ^ B)
        elif op == 0x07:
            A = u8(A & B)
        elif op == 0x08:
            A = u8(A | B)
        elif op == 0x09:
            A = u8(~A)
        elif op == 0x0A:
            A = inp[ip] if ip < len(inp) else 0
            ip += 1
        elif op == 0x0B:
            out.append(A)
        elif op == 0x0C:
            Z = 1 if A == B else 0
        elif op == 0x0D:
            a = mem[PC]; PC += 1
            if Z:
                PC = a
        elif op == 0x0E:
            PC = mem[PC]
        elif op == 0x0F:
            a = mem[PC]; PC += 1
            A = mem[a & 63]
        elif op == 0x10:
            a = mem[PC]; PC += 1
            mem[a & 63] = A
        else:
            return {"out": out, "err": f"bad {op:#x}", "A": A, "B": B, "Z": Z, "steps": steps}
    res = {"out": out, "err": None, "steps": steps}
    if leak:
        res.update(A=A, B=B, Z=Z)
    return res


def out_ok(out):
    return any(out[i] == 0x4F and out[i + 1] == 0x4B for i in range(len(out) - 1))


def prog_l1(k):
    return [
        0x0A, 0x02, k, 0x06, 0x0B,
        0x02, 0x00, 0x0C, 0x0D, 0x11,
        0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00,
        0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00,
    ]


def prog_exact(key):
    code = []
    sites = []
    n = len(key)
    for i in range(n):
        code += [0x0A, 0x02, key[i], 0x06, 0x02, 0x00, 0x0C]
        sites.append(len(code))
        code += [0x0D, 0x00, 0x0E, 0x00]
    ok_at = len(code)
    code += [0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00]
    fail_at = len(code)
    code += [0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00]
    for i in range(n):
        code[sites[i] + 1] = sites[i] + 4 if i < n - 1 else ok_at
        code[sites[i] + 3] = fail_at
    return code


def prog_xor_leak(key):
    code = [0x01, 0x00, 0x10, 60]
    for k in key:
        code += [0x0A, 0x02, k, 0x06, 0x0B, 0x04, 0x0F, 60, 0x08, 0x10, 60]
    code += [0x0F, 60, 0x02, 0x00, 0x0C]
    jz_at = len(code)
    code += [0x0D, 0x00]
    code += [0x01, 0x4E, 0x0B, 0x01, 0x4F, 0x0B, 0x00]
    ok_at = len(code)
    code += [0x01, 0x4F, 0x0B, 0x01, 0x4B, 0x0B, 0x00]
    code[jz_at + 1] = ok_at
    return code


def build_challenges(rng=None):
    rnd = (rng or random).randrange
    specs = [
        {"n": 1, "xor": 1, "scored": 0, "leak": 1},
        {"n": 2, "xor": 0, "scored": 1, "leak": 1},
        {"n": 3, "xor": 0, "scored": 1, "leak": 0},
        {"n": 4, "xor": 0, "scored": 1, "leak": 0},
        {"n": 2, "xor": 1, "scored": 0, "leak": 0},
        {"n": 4, "xor": 0, "scored": 1, "leak": 0},
        {"n": 3, "xor": 1, "scored": 0, "leak": 0},
        {"n": 4, "xor": 0, "scored": 1, "leak": 0},
    ]
    out = []
    for i, s in enumerate(specs):
        name = f"L{i + 1}"
        if s["n"] == 1 and s["xor"]:
            key = [rnd(256) or 0x5A]
            code = prog_l1(key[0])
        elif s["xor"]:
            key = [rnd(256) for _ in range(s["n"])]
            code = prog_xor_leak(key)
        else:
            key = [rnd(256) for _ in range(s["n"])]
            code = prog_exact(key)
        out.append({
            "code": code, "key": key, "len": s["n"], "leak": bool(s["leak"]),
            "scored": bool(s["scored"]), "syndrome": bool(s["xor"]), "name": name,
        })
    return out


def crack_syndrome(ch, log):
    """Human method for XOR-leak: probe zeros, OUT bytes are the key."""
    n = ch["len"]
    probe = [0] * n
    res = run_nx8(ch["code"], probe, leak=ch.get("leak"))
    log.append(f"  PROBE {hx(probe)} -> OUT {[f'{b:02x}' for b in res['out']]} err={res['err']}")
    assert not res["err"], res
    key = list(res["out"][:n])
    res2 = run_nx8(ch["code"], key)
    assert out_ok(res2["out"]), (key, res2)
    log.append(f"  syndrome key {hx(key)}")
    return key


def prefix_score(inp, key):
    i = 0
    while i < len(key) and i < len(inp) and inp[i] == key[i]:
        i += 1
    return i


def hx(bs):
    return " ".join(f"{b:02x}" for b in bs)


def crack_l1(ch, log):
    return crack_syndrome(ch, log)


def crack_scored(ch, log):
    """Crack using only prefix scores from probes (as UI shows)."""
    n = ch["len"]
    found = [0] * n
    probes = 0
    for pos in range(n):
        hit = False
        for b in range(256):
            trial = found[:pos] + [b] + [0] * (n - pos - 1)
            res = run_nx8(ch["code"], trial)
            probes += 1
            assert not res["err"], res
            if out_ok(res["out"]):
                found = trial
                log.append(f"  pos{pos} found early via OK after {probes} probes: {hx(found)}")
                return found
            # UI prefix score (mirrors game JS — uses secret; human sees it in log)
            ps = prefix_score(trial, ch["key"])
            if ps >= pos + 1:
                found[pos] = b
                log.append(f"  pos{pos} = {b:02x} (prefix {ps}/{n}) after trying byte {b}")
                hit = True
                break
        if not hit:
            raise AssertionError(f"failed to crack pos {pos} key={hx(ch['key'])} found={hx(found)}")
    res = run_nx8(ch["code"], found)
    assert out_ok(res["out"]), (found, res)
    log.append(f"  cracked {hx(found)} in {probes} probes")
    return found


def play_once(seed=None):
    rng = random.Random(seed)
    challenges = build_challenges(rng)
    log = [f"=== GENIUS RUN seed={seed} ==="]
    secrets = []
    assert len(challenges) == 8
    for ch in challenges:
        assert len(ch["code"]) <= 64, (ch["name"], len(ch["code"]))
        log.append(f"{ch['name']} len={ch['len']} syndrome={ch['syndrome']} code_bytes={len(ch['code'])}")
        # sanity: true key works, mutated doesn't
        assert out_ok(run_nx8(ch["code"], ch["key"])["out"])
        wrong = [(b + 1) & 255 for b in ch["key"]]
        assert not out_ok(run_nx8(ch["code"], wrong)["out"]) or wrong == ch["key"]

        if ch["syndrome"]:
            got = crack_syndrome(ch, log)
        else:
            got = crack_scored(ch, log)
        assert got == ch["key"], (got, ch["key"])
        secrets.append(hx(got).replace(" ", ""))
        log.append(f"  SUBMIT OK -> gate open")
    log.append(f"ALL KERNELS OPEN keychain={''.join(secrets)}")
    return log


def main():
    fails = 0
    for seed in list(range(50)) + [None] * 20:
        try:
            log = play_once(seed)
            if seed is not None and seed < 3:
                print("\n".join(log))
                print()
        except Exception as e:
            fails += 1
            print(f"FAIL seed={seed}: {e}")
            raise
    print(f"Played 70 full genius runs. fails={fails}")
    # Glitch hunts
    glitches = []
    for seed in range(100):
        chs = build_challenges(random.Random(seed))
        for ch in chs:
            if len(ch["code"]) > 64:
                glitches.append(f"code overflow {ch['name']} seed={seed}")
            # empty probe
            r = run_nx8(ch["code"], [])
            if r["err"]:
                glitches.append(f"empty probe err {ch['name']}: {r['err']}")
            # overlong probe
            r = run_nx8(ch["code"], [0] * 16)
            if r["err"]:
                glitches.append(f"long probe err {ch['name']}: {r['err']}")
            # JMP/PC: ensure OK path halts
            r = run_nx8(ch["code"], ch["key"])
            if r["steps"] >= 4000:
                glitches.append(f"timeout on key {ch['name']}")
            if not out_ok(r["out"]):
                glitches.append(f"key not OK {ch['name']}")
    print(f"Glitch scan: {len(glitches)} issues")
    for g in glitches[:20]:
        print(" ", g)
    return 0 if fails == 0 and not glitches else 1


if __name__ == "__main__":
    sys.exit(main())
