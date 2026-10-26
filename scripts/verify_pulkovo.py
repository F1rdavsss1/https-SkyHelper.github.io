"""Проверка: текст в public/ops/airline-guides.json совпадает с .docx посимвольно и в том же порядке.

Запуск: python scripts/verify_pulkovo.py
"""
import json, sys, zipfile, re, difflib
import xml.etree.ElementTree as ET
from pathlib import Path
src = Path(r"C:/Users/Admin/Downloads/для  проекта пулково")
data = json.loads((Path(__file__).parent.parent / "public/ops/airline-guides.json").read_text(encoding="utf-8"))
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
for g in data["airlineGuides"]:
    root = ET.fromstring(zipfile.ZipFile(src / g["fileName"]).read("word/document.xml"))
    a = []; raw_text(root.find(W + "body"), a); a = norm("".join(a))
    b = []; flat(g["blocks"], b); b = norm("".join(b))
    if a != b:
        bad += 1
        sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op != "equal": report.append(f"{g['id']}: {op} docx[{a[max(0,i1-20):i2+20]}] app[{b[max(0,j1-20):j2+20]}]")
    if sorted(a) != sorted(b): report.append(f"{g['id']}: CHAR MULTISET DIFFERS")
sys.stdout.reconfigure(encoding="utf-8")
for line in report:
    print(line)
print("guides", len(data["airlineGuides"]), "mismatched", bad, "report lines", len(report))
sys.exit(1 if bad else 0)
