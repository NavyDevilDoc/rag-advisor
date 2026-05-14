# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pillow>=10",
# ]
# ///
"""Build the social-preview OG image from a source screenshot.

Drop your source screenshot at `frontend/og-source.png` and run from the
repo root:

    uv run scripts/build_og_image.py

Output: `frontend/public/og-image.png` at 1200x630 (the standard og:image
size that Facebook, LinkedIn, Discord, Slack, and Twitter all crop nicely).

The crop strategy is "fit width, take from top" — useful for tall product
screenshots where the most compelling content (hero card + scores) is up top.
"""

from pathlib import Path
import sys

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
SOURCE_CANDIDATES = [
    REPO / "frontend" / "og-source.png",
    REPO / "frontend" / "og-source.jpg",
    REPO / "frontend" / "og-source.jpeg",
    # Fallback locations / names accepted as a convenience.
    REPO / "test_website_og_screenshot.png",
    REPO / "og-source.png",
]
TARGET = REPO / "frontend" / "public" / "og-image.png"
TARGET_W, TARGET_H = 1200, 630


def main() -> int:
    source = next((p for p in SOURCE_CANDIDATES if p.exists()), None)
    if source is None:
        print(
            "No source screenshot found. Drop one at frontend/og-source.png "
            "(or .jpg/.jpeg) and rerun.",
            file=sys.stderr,
        )
        return 1

    print(f"Source: {source.relative_to(REPO)}")
    img = Image.open(source).convert("RGB")
    sw, sh = img.size

    src_ratio = sw / sh
    target_ratio = TARGET_W / TARGET_H

    if src_ratio > target_ratio:
        # Source wider than target → fit by height, center-crop the sides.
        new_h = TARGET_H
        new_w = round(sw * TARGET_H / sh)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        left = (new_w - TARGET_W) // 2
        img = img.crop((left, 0, left + TARGET_W, TARGET_H))
    else:
        # Source taller than target (our results-screenshot case) → fit by
        # width, crop from the top so the hero card stays visible.
        new_w = TARGET_W
        new_h = round(sh * TARGET_W / sw)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        img = img.crop((0, 0, TARGET_W, TARGET_H))

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    img.save(TARGET, "PNG", optimize=True)
    print(f"Wrote {TARGET.relative_to(REPO)}  {TARGET_W}x{TARGET_H}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
