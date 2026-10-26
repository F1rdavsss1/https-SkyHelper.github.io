from pathlib import Path
import zipfile
import re
import json
import shutil
import xml.etree.ElementTree as ET

src = Path(r"C:/Users/Admin/Downloads/для  проекта пулково")
out_pub = Path(r"C:/Users/Admin/Desktop/SkyHelper/public/ops")
out_pub.mkdir(parents=True, exist_ok=True)

imgs = []
for i, p in enumerate(sorted(src.glob("photo_*.jpg"))):
    name = f"seat-map-{i + 1}.jpg"
    shutil.copy2(p, out_pub / name)
    imgs.append("/ops/" + name)
print("images", len(imgs))


CELL_BR = chr(0x2028)  # перенос строки внутри ячейки таблицы
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def para_text(p) -> str:
    parts = []
    for el in p.iter():
        if el.tag == W + "t":
            parts.append(el.text or "")
        elif el.tag == W + "tab":
            parts.append("\t")
        elif el.tag in (W + "br", W + "cr"):
            parts.append("\n")
    return "".join(parts).strip()


def block_lines(parent) -> list[str]:
    lines = []
    for el in parent:
        if el.tag == W + "p":
            t = para_text(el)
            if t:
                lines.append(t)
        elif el.tag == W + "tbl":
            for tr in el.iter(W + "tr"):
                # Переносы внутри ячейки — U+2028, чтобы строка таблицы оставалась одной строкой
                cells = [
                    CELL_BR.join(block_lines(tc)).replace(chr(10), CELL_BR)
                    for tc in tr.findall(W + "tc")
                ]
                row = " | ".join(c for c in cells if c)
                if row:
                    lines.append(row)
        elif el.tag == W + "sdt":
            content = el.find(W + "sdtContent")
            if content is not None:
                lines.extend(block_lines(content))
    return lines


def docx_text(path: Path) -> str:
    try:
        with zipfile.ZipFile(path) as z:
            root = ET.fromstring(z.read("word/document.xml"))
        body = root.find(W + "body")
        return "\n".join(block_lines(body))
    except Exception as e:
        return f"[не удалось прочитать: {e}]"


guides = []
for p in sorted(src.glob("*.docx")):
    text = docx_text(p)
    stem = p.stem.replace("  ", " ").strip()
    m = re.match(r"^([A-Za-z0-9]{1,3})\b", stem)
    code = m.group(1).upper() if m else None
    gid = re.sub(r"[^a-zA-Z0-9]+", "-", stem).strip("-").lower()[:60]
    guides.append(
        {
            "id": gid,
            "fileName": p.name,
            "titleRu": stem,
            "airlineCode": code,
            "bodyRu": text,
            "chars": len(text),
        }
    )

payload = {"images": imgs, "airlineGuides": guides}
(out_pub / "airline-guides.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("guides", len(guides))
if guides:
    print("sample", guides[0]["titleRu"], "chars", guides[0]["chars"])
