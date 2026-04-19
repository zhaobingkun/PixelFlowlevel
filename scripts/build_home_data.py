#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    playlist_path = repo / "assets" / "js" / "playlist-data.js"
    output_path = repo / "assets" / "js" / "home-data.js"

    raw = playlist_path.read_text(encoding="utf-8")
    prefix = "window.PIXEL_FLOW_PLAYLIST = "
    data = json.loads(raw[len(prefix):])

    max_level = 0
    covered_to_5000: set[int] = set()
    featured = []
    for entry in data:
        start = entry.get("levelStart")
        end = entry.get("levelEnd")
        if isinstance(start, int) and isinstance(end, int):
            max_level = max(max_level, start, end)
            lo = max(1, min(start, end))
            hi = min(5000, max(start, end))
            if lo <= hi:
                covered_to_5000.update(range(lo, hi + 1))
        if len(featured) < 8 and entry.get("videoId"):
            featured.append({
                "title": entry.get("title"),
                "subtitle": entry.get("subtitle"),
                "href": entry.get("href"),
                "levelStart": start,
                "levelEnd": end,
                "slug": entry.get("slug"),
                "videoId": entry.get("videoId"),
            })

    ranges = []
    for start in range(1, max_level + 1, 50):
        end = min(start + 49, max_level)
        ranges.append({"start": start, "end": end, "label": f"{start}-{end}"})

    payload = {
        "maxLevel": max_level,
        "featured": featured,
        "ranges": ranges,
        "missingTo5000": max(0, 5000 - len(covered_to_5000)),
    }
    output_path.write_text(
        "window.PIXEL_FLOW_HOME = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
