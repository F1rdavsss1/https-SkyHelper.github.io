from pathlib import Path
import zipfile
import re
import json
import shutil

src = Path(r"C:/Users/Admin/Downloads/для  проекта пулково")
out_pub = Path(r"C:/Users/Admin/Desktop/SkyHelper/public/ops")
out_pub.mkdir(parents=True, exist_ok=True)
out_data = Path(r"C:/Users/Admin/Desktop/SkyHelper/src/data")

imgs = []
for i, p in enumerate(sorted(src.glob("photo_*.jpg"))):
    name = f"seat-map-{i + 1}.jpg"
    shutil.copy2(p, out_pub / name)
    imgs.append("/ops/" + name)
print("images", len(imgs))


def docx_text(path: Path) -> str:
    try:
        with zipfile.ZipFile(path) as z:
            xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
        texts = re.findall(r"<w:t[^>]*>(.*?)</w:t>", xml)
        raw = "\n".join(
            t.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
            for t in texts
        )
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        return "\n".join(lines)
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
            "bodyRu": text[:14000],
            "chars": len(text),
        }
    )

payload = {"images": imgs, "airlineGuides": guides}
(out_data / "pulkovoGuides.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("guides", len(guides))
if guides:
    print("sample", guides[0]["titleRu"], "chars", guides[0]["chars"])
