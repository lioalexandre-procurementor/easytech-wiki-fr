#!/usr/bin/env python3
"""
Fix update JSON body fields: remove **bold**, *italic*, and ### headings
that the update page renderer doesn't support. Converts ### to ## and
strips inline formatting markers, keeping the text clean.
"""
import json, re
from pathlib import Path

UPDATES_DIR = Path(__file__).resolve().parents[2] / "data" / "wc4" / "updates"

def clean_markdown(text):
    # Convert ### headings to ## headings
    text = re.sub(r'^### ', '## ', text, flags=re.MULTILINE)
    # Remove **bold** markers (keep text inside)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    # Remove *italic* markers (keep text inside) — but not ** which we already handled
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'\1', text)
    return text

for f in sorted(UPDATES_DIR.glob("*.json")):
    if f.name.startswith("_"):
        continue
    data = json.loads(f.read_text())
    changed = False
    for locale in ["fr", "en", "de"]:
        if locale in data.get("body", {}):
            original = data["body"][locale]
            cleaned = clean_markdown(original)
            if cleaned != original:
                data["body"][locale] = cleaned
                changed = True
    if changed:
        f.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        print(f"[FIXED] {f.name}")
    else:
        print(f"[OK] {f.name} — no changes needed")