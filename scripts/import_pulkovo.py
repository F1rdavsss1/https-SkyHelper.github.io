"""Импорт памяток LED из .docx в public/ops/airline-guides.json.

Структура сохраняется как в Word, чтобы ничего не сдвинулось и не потерялось:
  - абзацы с разметкой (жирный, выделение маркером, красный, зачёркнутый);
  - нумерация списков (1. 2. 3. / •);
  - таблицы с пустыми и объединёнными ячейками (colspan / rowspan);
  - картинки на своих местах (EMF/WMF конвертируются в PNG через System.Drawing);
  - текст из надписей (text box).
"""

from pathlib import Path
import json
import re
import shutil
import subprocess
import zipfile
import xml.etree.ElementTree as ET

src = Path(r"C:/Users/Admin/Downloads/для  проекта пулково")
out_pub = Path(r"C:/Users/Admin/Desktop/SkyHelper/public/ops")
out_img = out_pub / "guides"
out_pub.mkdir(parents=True, exist_ok=True)

imgs = []
for i, p in enumerate(sorted(src.glob("photo_*.jpg"))):
    name = f"seat-map-{i + 1}.jpg"
    shutil.copy2(p, out_pub / name)
    imgs.append("/ops/" + name)
print("images", len(imgs))

CELL_BR = chr(0x2028)  # перенос строки внутри абзаца/ячейки
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
V = "{urn:schemas-microsoft-com:vml}"
MC = "{http://schemas.openxmlformats.org/markup-compatibility/2006}"
PR = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def on(el) -> bool:
    """<w:b/>, <w:b w:val="1"/> → True; <w:b w:val="0"/> → False"""
    return el is not None and el.get(W + "val", "true") not in ("0", "false", "off")


def is_red(color: str | None) -> bool:
    if not color or color == "auto" or len(color) != 6:
        return False
    r, g, b = (int(color[i : i + 2], 16) for i in (0, 2, 4))
    return r >= 0xB0 and g <= 0x60 and b <= 0x60


class Numbering:
    def __init__(self, z: zipfile.ZipFile):
        self.fmt: dict[tuple[str, int], tuple[str, str, int]] = {}
        self.counters: dict[str, list[int]] = {}
        try:
            root = ET.fromstring(z.read("word/numbering.xml"))
        except KeyError:
            return
        def parse_lvl(lvl):
            fmt = lvl.find(W + "numFmt")
            txt = lvl.find(W + "lvlText")
            start = lvl.find(W + "start")
            return (
                fmt.get(W + "val") if fmt is not None else "bullet",
                txt.get(W + "val") if txt is not None else "",
                int(start.get(W + "val")) if start is not None else 1,
            )

        abstract = {}
        for an in root.findall(W + "abstractNum"):
            abstract[an.get(W + "abstractNumId")] = {
                int(lvl.get(W + "ilvl", "0")): parse_lvl(lvl) for lvl in an.findall(W + "lvl")
            }
        for num in root.findall(W + "num"):
            aid = num.find(W + "abstractNumId")
            if aid is None:
                continue
            nid = num.get(W + "numId")
            for ilvl, v in abstract.get(aid.get(W + "val"), {}).items():
                self.fmt[(nid, ilvl)] = v
            # Переопределения уровня: свой формат и/или «начать нумерацию заново с N»
            for ov in num.findall(W + "lvlOverride"):
                ilvl = int(ov.get(W + "ilvl", "0"))
                lvl = ov.find(W + "lvl")
                if lvl is not None:
                    self.fmt[(nid, ilvl)] = parse_lvl(lvl)
                so = ov.find(W + "startOverride")
                if so is not None and (nid, ilvl) in self.fmt:
                    fmt, text, _ = self.fmt[(nid, ilvl)]
                    self.fmt[(nid, ilvl)] = (fmt, text, int(so.get(W + "val", "1")))

    @staticmethod
    def _render(n: int, fmt: str) -> str:
        if fmt in ("lowerLetter", "upperLetter"):
            s = chr(ord("a") + (n - 1) % 26)
            return s.upper() if fmt == "upperLetter" else s
        if fmt in ("lowerRoman", "upperRoman"):
            vals = [(10, "x"), (9, "ix"), (5, "v"), (4, "iv"), (1, "i")]
            s, k = "", n
            for v, r in vals:
                while k >= v:
                    s, k = s + r, k - v
            return s.upper() if fmt == "upperRoman" else s
        return str(n)

    def label(self, num_id: str, ilvl: int) -> str | None:
        f = self.fmt.get((num_id, ilvl))
        if not f or num_id == "0":
            return None
        fmt, text, start = f
        if fmt in ("bullet", "none"):
            return "•"
        cnt = self.counters.setdefault(num_id, [start - 1] * 9)
        cnt[ilvl] += 1
        for deeper in range(ilvl + 1, 9):
            cnt[deeper] = self.fmt.get((num_id, deeper), ("", "", 1))[2] - 1
        label = text
        for lv in range(9):
            if f"%{lv + 1}" in label:
                lf = self.fmt.get((num_id, lv), (fmt, "", 1))[0]
                label = label.replace(f"%{lv + 1}", self._render(max(cnt[lv], 1), lf))
        return label.strip() or "•"


class Doc:
    def __init__(self, path: Path, gid: str):
        self.z = zipfile.ZipFile(path)
        self.gid = gid
        self.numbering = Numbering(self.z)
        self.rels = {}
        rels = ET.fromstring(self.z.read("word/_rels/document.xml.rels"))
        for rel in rels.findall(PR + "Relationship"):
            self.rels[rel.get("Id")] = rel.get("Target")
        self.images: dict[str, str] = {}
        self.emf: list[Path] = []

    def image(self, rid: str | None) -> str | None:
        target = self.rels.get(rid or "")
        if not target or target.startswith("http"):
            return None
        if target in self.images:
            return self.images[target]
        member = "word/" + target.lstrip("/").removeprefix("word/")
        data = self.z.read(member)
        ext = Path(target).suffix.lower()
        dest_dir = out_img / self.gid
        dest_dir.mkdir(parents=True, exist_ok=True)
        name = f"img{len(self.images) + 1}{ext}"
        (dest_dir / name).write_bytes(data)
        if ext in (".emf", ".wmf"):
            self.emf.append(dest_dir / name)
            name = name.rsplit(".", 1)[0] + ".png"
        url = f"/ops/guides/{self.gid}/{name}"
        self.images[target] = url
        return url


def add_run(runs: list, text: str, marks: dict):
    if not text:
        return
    if runs and {k: v for k, v in runs[-1].items() if k != "x"} == marks:
        runs[-1]["x"] += text
    else:
        runs.append({"x": text, **marks})


def walk_inline(el, doc: Doc, runs: list, extra: list, marks: dict):
    """Обходит содержимое абзаца: тексты в runs, картинки и надписи в extra (после абзаца)."""
    for ch in el:
        tag = ch.tag
        if tag == W + "r":
            rpr = ch.find(W + "rPr")
            m = {}
            if rpr is not None:
                if on(rpr.find(W + "b")):
                    m["b"] = 1
                if on(rpr.find(W + "strike")) or on(rpr.find(W + "dstrike")):
                    m["s"] = 1
                hl = rpr.find(W + "highlight")
                shd = rpr.find(W + "shd")
                if (hl is not None and hl.get(W + "val") not in (None, "none")) or (
                    shd is not None and shd.get(W + "fill") not in (None, "auto", "FFFFFF")
                ):
                    m["hl"] = 1
                col = rpr.find(W + "color")
                if col is not None and is_red(col.get(W + "val")):
                    m["red"] = 1
            walk_inline(ch, doc, runs, extra, m)
        elif tag == W + "t":
            add_run(runs, ch.text or "", marks)
        elif tag == W + "tab":
            add_run(runs, " ", marks)
        elif tag in (W + "br", W + "cr"):
            add_run(runs, CELL_BR, marks)
        elif tag in (W + "noBreakHyphen", W + "softHyphen"):
            add_run(runs, "-" if tag == W + "noBreakHyphen" else "", marks)
        elif tag in (W + "del", W + "rPr", W + "pPr", W + "instrText", W + "delText"):
            continue
        elif tag == MC + "AlternateContent":
            choice = ch.find(MC + "Choice")
            walk_inline(choice if choice is not None else ch, doc, runs, extra, marks)
        elif tag == MC + "Fallback":
            continue
        elif tag == W + "txbxContent":
            extra.extend(blocks_of(ch, doc))
        elif tag == A + "blip":
            url = doc.image(ch.get(R + "embed") or ch.get(R + "link"))
            if url:
                extra.append({"t": "img", "src": url})
        elif tag == V + "imagedata":
            url = doc.image(ch.get(R + "id"))
            if url:
                extra.append({"t": "img", "src": url})
        else:
            walk_inline(ch, doc, runs, extra, marks)


def paragraph(p, doc: Doc) -> list:
    runs: list = []
    extra: list = []
    walk_inline(p, doc, runs, extra, {})
    # обрезаем пробелы по краям абзаца
    while runs and not runs[0]["x"].strip():
        runs.pop(0)
    while runs and not runs[-1]["x"].strip():
        runs.pop()
    if runs:
        runs[0]["x"] = runs[0]["x"].lstrip()
        runs[-1]["x"] = runs[-1]["x"].rstrip()
    out = []
    if runs:
        block = {"t": "p", "runs": runs}
        num = p.find(W + "pPr/" + W + "numPr")
        if num is not None:
            nid = num.find(W + "numId")
            ilvl = num.find(W + "ilvl")
            label = doc.numbering.label(
                nid.get(W + "val") if nid is not None else "0",
                int(ilvl.get(W + "val")) if ilvl is not None else 0,
            )
            if label:
                block["li"] = label
                block["lvl"] = int(ilvl.get(W + "val")) if ilvl is not None else 0
        out.append(block)
    return out + extra


def direct(el, tag: str):
    """Дочерние tag, включая обёрнутые в w:sdt / w:customXml."""
    for ch in el:
        if ch.tag == tag:
            yield ch
        elif ch.tag in (W + "sdt", W + "customXml"):
            content = ch.find(W + "sdtContent")
            yield from direct(content if content is not None else ch, tag)


def table(tbl, doc: Doc) -> dict:
    rows = []
    above: dict[int, dict] = {}  # колонка сетки → ячейка, которую продолжает vMerge
    for tr in direct(tbl, W + "tr"):
        row = []
        col = 0
        trpr = tr.find(W + "trPr")
        before = trpr.find(W + "gridBefore") if trpr is not None else None
        if before is not None and int(before.get(W + "val", "0")) > 0:
            n = int(before.get(W + "val"))
            row.append({"c": [], "cs": n})
            col += n
        for tc in direct(tr, W + "tc"):
            pr = tc.find(W + "tcPr")
            span_el = pr.find(W + "gridSpan") if pr is not None else None
            span = int(span_el.get(W + "val", "1")) if span_el is not None else 1
            vm = pr.find(W + "vMerge") if pr is not None else None
            if vm is not None and vm.get(W + "val") != "restart" and col in above:
                above[col]["rs"] = above[col].get("rs", 1) + 1
                col += span
                continue
            cell = {"c": blocks_of(tc, doc)}
            if span > 1:
                cell["cs"] = span
            if vm is not None:
                above[col] = cell
            else:
                above.pop(col, None)
            row.append(cell)
            col += span
        if row:
            rows.append(row)
    return {"t": "table", "rows": rows}


def blocks_of(parent, doc: Doc) -> list:
    out = []
    for el in parent:
        if el.tag == W + "p":
            out.extend(paragraph(el, doc))
        elif el.tag == W + "tbl":
            t = table(el, doc)
            if t["rows"]:
                out.append(t)
        elif el.tag in (W + "sdt", W + "customXml"):
            content = el.find(W + "sdtContent")
            out.extend(blocks_of(content if content is not None else el, doc))
    return out


def plain(blocks: list) -> str:
    """Плоский текст для поиска по списку памяток."""
    lines = []
    for b in blocks:
        if b["t"] == "p":
            lines.append(((b.get("li") or "") + " " + "".join(r["x"] for r in b["runs"])).strip())
        elif b["t"] == "table":
            for row in b["rows"]:
                lines.append(" | ".join(plain(c["c"]).replace("\n", " ") for c in row))
    return "\n".join(lines)


def convert_emf(paths: list[Path]):
    if not paths:
        return
    script = "Add-Type -AssemblyName System.Drawing\n"
    for p in paths:
        png = p.with_suffix(".png")
        script += (
            f"$m = New-Object System.Drawing.Imaging.Metafile('{p}'); "
            "$b = New-Object System.Drawing.Bitmap($m.Width, $m.Height); "
            "$g = [System.Drawing.Graphics]::FromImage($b); $g.Clear([System.Drawing.Color]::White); "
            "$g.DrawImage($m, 0, 0, $m.Width, $m.Height); "
            f"$b.Save('{png}', [System.Drawing.Imaging.ImageFormat]::Png); "
            "$g.Dispose(); $b.Dispose(); $m.Dispose()\n"
        )
    subprocess.run(["powershell", "-NoProfile", "-Command", script], check=True)
    for p in paths:
        p.unlink()


if out_img.exists():
    shutil.rmtree(out_img)

guides = []
emf: list[Path] = []
for p in sorted(src.glob("*.docx")):
    stem = p.stem.replace("  ", " ").strip()
    m = re.match(r"^([A-Za-z0-9]{1,3})\b", stem)
    code = m.group(1).upper() if m else None
    gid = re.sub(r"[^a-zA-Z0-9]+", "-", stem).strip("-").lower()[:60]
    doc = Doc(p, gid)
    body = ET.fromstring(doc.z.read("word/document.xml")).find(W + "body")
    blocks = blocks_of(body, doc)
    emf.extend(doc.emf)
    text = plain(blocks)
    # Колонтитулы (например «Check-in Guide (eff. 13.08.2021)») — в сведения об источнике
    header = " ".join(
        "".join(t.text or "" for t in ET.fromstring(doc.z.read(n)).iter(W + "t")).strip()
        for n in sorted(doc.z.namelist())
        if re.match(r"word/(header|footer)\d*\.xml$", n)
    ).strip()
    guides.append(
        {
            "id": gid,
            "fileName": p.name,
            "titleRu": stem,
            "airlineCode": code,
            "bodyRu": text,
            "blocks": blocks,
            **({"header": header} if header else {}),
        }
    )

convert_emf(emf)

payload = {"images": imgs, "airlineGuides": guides}
(out_pub / "airline-guides.json").write_text(
    json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
)
print("guides", len(guides), "images in guides", sum(1 for _ in out_img.rglob("*.*")))
