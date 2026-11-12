#!/usr/bin/env python3
"""Build the embedded Lancer weapons/systems DB for lancer/index.html.

Source: Massif Press open data (lancer-data, the same data COMP/CON uses):
  https://github.com/massif-press/lancer-data (lib/weapons.json, lib/systems.json, lib/tags.json)
Output: compact DB literal injected into index.html between // __DB_START__ / // __DB_END__.

Usage:
  python3 build_db.py            # downloads JSON from GitHub, rebuilds DB in index.html
  python3 build_db.py --local /tmp   # use local *.json files (lancer-weapons.json etc.)
DB holds weapons, systems and the frame -> mounts map (29 frames).
"""
import argparse, html, json, re, sys, urllib.request
from pathlib import Path

HERE = Path(__file__).parent
INDEX = HERE / "index.html"
BASE = "https://raw.githubusercontent.com/massif-press/lancer-data/master/lib/"
MOUNT_MAP = {"Auxiliary": "Aux", "Main": "Main", "Heavy": "Heavy",
             "Superheavy": "Superheavy", "Ship-class": "Heavy",
             "Flex": "Flex", "Integrated": "Integrated"}
# manufacturer codes -> full names (for search; the books use the codes)
SRC_NAMES = {"GMS": "GMS", "IPS-N": "IPS-N", "HORUS": "HORUS",
             "SSC": "Smith-Shimano", "HA": "Harrison Armory"}

def fetch(name, local_dir):
    if local_dir:
        return json.loads((Path(local_dir) / name).read_text(encoding="utf-8"))
    with urllib.request.urlopen(BASE + name, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def clean(text):
    if not text:
        return ""
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text).strip()

def fmt_damage(dmg):
    parts = []
    for d in dmg or []:
        t = d.get("type") or ""
        parts.append(f"{d['val']} {t}".strip())
    return " + ".join(parts)

def fmt_range(rng):
    parts = []
    for r in rng or []:
        t = r.get("type") or ""
        parts.append(f"{t} {r['val']}".strip())
    return ", ".join(parts)

def limited_val(tags):
    for tg in (tags or []):
        if tg.get("id") == "tg_limited":
            v = tg.get("val")
            # у Prototype Weapon в val лежит дайс урона, а не число зарядов — трекер не применим
            return v if isinstance(v, int) else 0
    return 0

def fmt_tags(tags, tagmap):
    out = []
    for tg in tags or []:
        t = tagmap.get(tg["id"])
        if not t:
            out.append(tg["id"])
            continue
        name = t["name"]
        val = tg.get("val")
        if val is None:
            name = name.replace(" {VAL}", "").replace("{VAL}", "")
        else:
            name = name.replace("{VAL}", str(val))
        out.append(name)
    return ", ".join(out)

def fmt_actions(actions):
    lines = []
    for a in actions or []:
        head = a.get("name", "")
        act = a.get("activation") or ""
        freq = a.get("frequency") or ""
        bits = " — ".join(x for x in [act, freq] if x)
        if bits:
            head += f" ({bits})"
        detail = clean(a.get("detail") or "")
        if not detail:
            # fall back to structured fields when detail is empty
            extra = []
            if a.get("damage"):
                extra.append("Damage: " + fmt_damage(a["damage"]))
            if a.get("range"):
                extra.append("Range: " + fmt_range(a["range"]))
            if a.get("save"):
                extra.append("Save: " + str(a["save"]))
            detail = "; ".join(extra)
        trig = a.get("trigger")
        if trig:
            detail = "Trigger: " + clean(trig) + ("\n" + detail if detail else "")
        lines.append((head + ": " + detail).strip() if detail else head)
    return "\n\n".join(lines)

def fmt_deployables(deps):
    lines = []
    for d in deps or []:
        head = d.get("name", "")
        bits = [x for x in [d.get("type"), d.get("activation")] if x]
        if d.get("range"):
            bits.append(fmt_range(d["range"]))
        if d.get("size") is not None:
            bits.append(f"Size {d['size']}")
        if bits:
            head += " (" + ", ".join(bits) + ")"
        detail = clean(d.get("detail") or "")
        if not detail and d.get("damage"):
            detail = "Damage: " + fmt_damage(d["damage"])
        lines.append((head + ": " + detail).strip() if detail else head)
    return "\n\n".join(lines)

def fmt_profiles(profiles, tagmap):
    lines = []
    for p in profiles or []:
        bits = []
        if p.get("damage"):
            bits.append(fmt_damage(p["damage"]))
        if p.get("range"):
            bits.append(fmt_range(p["range"]))
        if p.get("tags"):
            bits.append("tags: " + fmt_tags(p["tags"], tagmap))
        if p.get("effect"):
            bits.append(clean(p["effect"]))
        acts = fmt_actions(p.get("actions"))
        if acts:
            bits.append(acts)
        lines.append("Profile — " + p.get("name", "") + ": " + "; ".join(bits))
    return "\n\n".join(lines)

def fmt_triggered(x):
    lines = []
    for key, label in (("on_attack", "On attack"), ("on_hit", "On hit"), ("on_crit", "On crit")):
        v = x.get(key)
        if v:
            lines.append(f"{label}: " + clean(v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)))
    return "\n".join(lines)

def fmt_core(cs):
    parts = []
    if cs.get("description"):
        parts.append(clean(cs["description"]))
    if cs.get("active_effect"):
        head = "Active — " + (cs.get("active_name") or "Core Power")
        bits = [b for b in [cs.get("activation"), cs.get("use") or cs.get("frequency")] if b]
        if bits:
            head += " (" + ", ".join(bits) + ")"
        parts.append(head + ": " + clean(cs["active_effect"]))
    if cs.get("passive_name"):
        parts.append("Passive — " + cs["passive_name"] + ": " + clean(cs.get("passive_effect") or ""))
    return "\n\n".join(parts)

def fmt_traits(traits):
    return "\n\n".join(
        f"{t['name']}: {clean(t.get('description') or '')}" for t in (traits or []))

def build(local_dir):
    weapons = fetch("weapons.json", local_dir)
    systems = fetch("systems.json", local_dir)
    tags = fetch("tags.json", local_dir)
    frames = fetch("frames.json", local_dir)
    tagmap = {t["id"]: t for t in tags}

    db_w, warns = [], []
    for x in weapons:
        tags_txt = fmt_tags(x.get("tags"), tagmap)
        parts = []
        if tags_txt:
            parts.append(tags_txt)
        if x.get("effect"):
            parts.append(clean(x["effect"]))
        trig = fmt_triggered(x)
        if trig:
            parts.append(trig)
        acts = fmt_actions(x.get("actions"))
        if acts:
            parts.append(acts)
        profs = fmt_profiles(x.get("profiles"), tagmap)
        if profs:
            parts.append(profs)
        deps = fmt_deployables(x.get("deployables"))
        if deps:
            parts.append(deps)
        if x.get("sp") is not None:
            parts.append(f"SP: {x['sp']}")
        desc = clean(x.get("description") or "")
        if desc:
            parts.append(desc)
        full_desc = "\n\n".join(parts)
        lic = x.get("license")
        lvl = x.get("license_level")
        src = x.get("source") or ""
        srcf = SRC_NAMES.get(src, src)
        lab_parts = [src] + ([lic] if lic and lic != src else []) + ([f"LL{lvl}"] if lvl is not None else [])
        lab = " · ".join(p for p in lab_parts if p)
        mount = MOUNT_MAP.get(x.get("mount"), "Main")
        # profile weapons (e.g. Assault Cannon) carry damage/range in profiles;
        # use the first usable profile (skip N/A stubs like Apocalypse Rail charge 4)
        dmg = fmt_damage(x.get("damage"))
        rng = fmt_range(x.get("range"))
        if (not dmg or not rng or dmg == "N/A" or rng == "N/A") and x.get("profiles"):
            for p0 in x["profiles"]:
                pd = fmt_damage(p0.get("damage"))
                pr = fmt_range(p0.get("range"))
                if pd and pd != "N/A" and pr and pr != "N/A":
                    dmg, rng = pd, pr
                    break
        db_w.append({
            "n": x["name"], "m": mount, "t": x.get("type") or "",
            "d": dmg, "r": rng, "g": tags_txt,
            "lab": " · ".join(p for p in [lab, mount] if p),
            "sf": srcf if srcf != src else "",
            "lic": x.get("license") or "",
            "ll": x.get("license_level") if x.get("license_level") is not None else None,
            "lim": limited_val(x.get("tags")),
            "x": full_desc,
        })
    db_s = []
    for x in systems:
        parts = []
        if x.get("effect"):
            parts.append(clean(x["effect"]))
        acts = fmt_actions(x.get("actions"))
        if acts:
            parts.append(acts)
        deps = fmt_deployables(x.get("deployables"))
        if deps:
            parts.append(deps)
        desc = clean(x.get("description") or "")
        if desc:
            parts.append(desc)
        full_desc = "\n\n".join(parts)
        if not full_desc:
            warns.append(f"system without text: {x['name']}")
        lic = x.get("license")
        lvl = x.get("license_level")
        src = x.get("source") or ""
        srcf = SRC_NAMES.get(src, src)
        lab_parts = [src] + ([lic] if lic and lic != src else []) + ([f"LL{lvl}"] if lvl is not None else [])
        lab = " · ".join(p for p in lab_parts if p)
        db_s.append({
            "n": x["name"], "t": x.get("type") or "", "p": x.get("sp") or 0,
            "lab": " · ".join(p for p in [lab, f"{x.get('sp') or 0} SP"] if p),
            "sf": srcf if srcf != src else "",
            "lic": x.get("license") or "",
            "ll": x.get("license_level") if x.get("license_level") is not None else None,
            "lim": limited_val(x.get("tags")),
            "x": full_desc,
        })
    w_by_id = {x["id"]: x["name"] for x in weapons}
    frames_db = {}
    for x in frames:
        cs = x.get("core_system") or {}
        iw = [w_by_id[i] for i in (cs.get("integrated") or []) if i in w_by_id]
        frames_db[x["name"]] = {
            "m": x.get("mounts") or [],
            "c": cs.get("name") or "",
            "cd": fmt_core(cs),
            "t": fmt_traits(x.get("traits")),
            "s": x.get("stats") or {},
            "iw": iw,
            # лицензия фрейма: имя = имя фрейма; ранг, нужный для фрейма, — II
            # (корбук: ранг I даёт снаряжение, ранг II — фрейм; у Everest 0 — без лицензии)
            "lic": x["name"] if x["name"] != "Everest" else "GMS",
            "ll": x.get("license_level") if x.get("license_level") is not None else 2,
        }
    db = {"weapons": db_w, "systems": db_s, "frames": frames_db}
    for w_ in warns:
        print("WARN:", w_, file=sys.stderr)
    return db

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--local", default=None, help="dir with lancer-weapons.json etc.")
    args = ap.parse_args()
    db = build(args.local)
    lit = json.dumps(db, ensure_ascii=False, separators=(",", ":"))
    print(f"weapons: {len(db['weapons'])}, systems: {len(db['systems'])}, DB bytes: {len(lit.encode('utf-8'))}")
    html_src = INDEX.read_text(encoding="utf-8")
    block = "// __DB_START__\nconst DB = " + lit + ";\n// __DB_END__"
    if "// __DB_START__" in html_src:
        # NB: replacement via lambda — a plain string would make re.sub
        # interpret \n inside the JSON literal as real newlines (breaking JS strings)
        html_src = re.sub(r"// __DB_START__.*?// __DB_END__", lambda _: block, html_src, flags=re.S)
    else:
        anchor = "const KEY = 'lancer-tracker-v1';"
        assert anchor in html_src, "anchor not found in index.html"
        html_src = html_src.replace(anchor, block + "\n" + anchor, 1)
    INDEX.write_text(html_src, encoding="utf-8")
    print("index.html bytes:", len(html_src.encode("utf-8")))

if __name__ == "__main__":
    main()
