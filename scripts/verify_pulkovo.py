"""Проверка: текст в public/ops/airline-guides.json совпадает с .docx посимвольно и в том же порядке.

Запуск: python scripts/verify_pulkovo.py
"""
import json, sys, zipfile, re, difflib
import xml.etree.ElementTree as ET
from pathlib import Path
SOURCES = [Path(r"C:/Users/Admin/Documents/for pulk"), Path(r"C:/Users/Admin/Downloads/для  проекта пулково")]
pub = Path(__file__).parent.parent / "public/ops"
data = json.loads((pub / "airline-guides.json").read_text(encoding="utf-8"))
ops = json.loads((pub / "ops-docs.json").read_text(encoding="utf-8"))
def source(name):
    return next(d / name for d in SOURCES if (d / name).exists())
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
MC = "{http://schemas.openxmlformats.org/markup-compatibility/2006}"
def raw_text(el, out):
    for ch in el:
        if ch.tag in (MC + "Fallback", W + "del"): continue
        if ch.tag == W + "t": out.append(ch.text or "")
        raw_text(ch, out)
def flat(blocks, out):
    for b in blocks:
        if b["t"] == "p": out.extend(r["x"] for r in b["runs"])
        elif b["t"] == "table":
            for row in b["rows"]:
                for c in row: flat(c["c"], out)
norm = lambda s: re.sub(r"\s+", "", s)
bad = 0; report = []
checked = 0
for g in data["airlineGuides"] + ops["docs"]:
    if not g["fileName"].endswith(".docx"):
        continue
    checked += 1
    root = ET.fromstring(zipfile.ZipFile(source(g["fileName"])).read("word/document.xml"))
    a = []; raw_text(root.find(W + "body"), a); a = norm("".join(a))
    b = []; flat(g["blocks"], b); b = norm("".join(b))
    if a != b:
        bad += 1
        sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op != "equal": report.append(f"{g['id']}: {op} docx[{a[max(0,i1-20):i2+20]}] app[{b[max(0,j1-20):j2+20]}]")
    if sorted(a) != sorted(b): report.append(f"{g['id']}: CHAR MULTISET DIFFERS")
# Excel: каждая непустая ячейка листа должна оказаться в памятке ровно столько же раз
XS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
for g in data["airlineGuides"]:
    if not g["fileName"].endswith(".xlsx"):
        continue
    checked += 1
    z = zipfile.ZipFile(source(g["fileName"]))
    shared = ["".join(t.text or "" for t in si.iter(XS + "t")) for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(XS + "si")]
    cells = []
    for n in z.namelist():
        if re.match(r"xl/worksheets/sheet\d+\.xml$", n):
            for c in ET.fromstring(z.read(n)).iter(XS + "c"):
                v = c.find(XS + "v")
                if v is not None:
                    cells.append((shared[int(v.text)] if c.get("t") == "s" else v.text).strip())
    b = []; flat(g["blocks"], b)
    if sorted(x for x in cells if x) != sorted(b):
        bad += 1
        report.append(f"{g['id']}: xlsx cells differ")
sys.stdout.reconfigure(encoding="utf-8")
for line in report:
    print(line)
print("docx checked", checked, "mismatched", bad, "report lines", len(report))
sys.exit(1 if bad else 0)
