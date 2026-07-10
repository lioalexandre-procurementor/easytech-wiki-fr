#!/usr/bin/env python3
"""
Download an image from a URL, optionally crop/resize, convert to webp,
and save to the appropriate wiki public directory.

Usage:
  python3 download_image.py --url "https://i.redd.it/abc123.png" --dest "public/img/wc4/elites/352002.webp" --size 256
  python3 download_image.py --url "..." --dest "public/img/wc4/generals/GeneralName.webp" --size 512
"""
import argparse
import io
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "EasyTech-Wiki-Bot/1.0 (research; contact@easytech-wiki.com)",
]


def download(url: str) -> bytes:
    """Download image bytes with rotating user agents."""
    for i, ua in enumerate(USER_AGENTS):
        req = urllib.request.Request(url, headers={"User-Agent": ua})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except Exception as e:
            if i == len(USER_AGENTS) - 1:
                raise
            print(f"[WARN] UA {i} failed ({e}), retrying...", file=sys.stderr)
    raise RuntimeError("All user agents failed")


def convert_to_webp(input_bytes: bytes, dest: Path, size: int = 256) -> None:
    """Use macOS sips or Python Pillow to resize + convert to webp."""
    dest.parent.mkdir(parents=True, exist_ok=True)

    # Try sharp (Node) first — it's in the project already
    try:
        import subprocess
        proc = subprocess.run(
            ["npx", "sharp-cli", "--version"],
            capture_output=True, text=True, cwd=ROOT
        )
        if proc.returncode == 0:
            # Use sharp via pipe
            proc = subprocess.run(
                ["npx", "sharp-cli", "resize", str(size), str(size),
                 "-f", "webp", "-o", str(dest)],
                input=input_bytes, capture_output=True,
                cwd=ROOT, timeout=60
            )
            if proc.returncode == 0:
                print(f"[IMAGE] Saved {dest} ({len(input_bytes)}→{dest.stat().st_size} bytes) via sharp")
                return
            print(f"[WARN] sharp-cli failed: {proc.stderr.decode()}", file=sys.stderr)
    except Exception:
        pass

    # Try PIL
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(input_bytes))
        img = img.convert("RGBA")
        img.thumbnail((size, size), Image.Resampling.LANCZOS)
        img.save(dest, "webp", quality=80)
        print(f"[IMAGE] Saved {dest} ({len(input_bytes)}→{dest.stat().st_size} bytes) via PIL")
        return
    except ImportError:
        pass

    # Fallback: macOS sips + cwebp
    tmp_png = dest.with_suffix(".tmp.png")
    tmp_png.write_bytes(input_bytes)
    try:
        subprocess.run(["sips", "-Z", str(size), str(tmp_png)], check=True, capture_output=True)
        subprocess.run(["cwebp", "-q", "80", str(tmp_png), "-o", str(dest)], check=True, capture_output=True)
        tmp_png.unlink()
        print(f"[IMAGE] Saved {dest} ({dest.stat().st_size} bytes) via sips+cwebp")
    except Exception as e:
        # Last resort: save raw bytes as webp (may be suboptimal)
        if tmp_png.exists():
            tmp_png.unlink()
        dest.write_bytes(input_bytes)
        print(f"[IMAGE] Saved {dest} ({len(input_bytes)} bytes) — raw, may need manual conversion")


def main():
    parser = argparse.ArgumentParser(description="Download + resize image for easytech-wiki")
    parser.add_argument("--url", required=True, help="Source URL")
    parser.add_argument("--dest", required=True, help="Destination path relative to project root")
    parser.add_argument("--size", type=int, default=256, help="Max dimension (default: 256)")
    args = parser.parse_args()

    dest = ROOT / args.dest
    if not str(dest.resolve()).startswith(str(ROOT.resolve())):
        print("[ERROR] Destination must be inside project root", file=sys.stderr)
        sys.exit(1)

    print(f"[DOWNLOAD] {args.url}")
    data = download(args.url)
    convert_to_webp(data, dest, args.size)


if __name__ == "__main__":
    main()
