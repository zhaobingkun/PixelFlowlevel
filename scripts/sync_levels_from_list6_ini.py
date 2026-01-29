#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class LevelVideo:
    level: int
    video_id: str
    source_title: str


def html_escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def parse_list6_ini(text: str) -> dict[int, LevelVideo]:
    vids = re.findall(r'id="wc-endpoint"[^>]*href="/watch\?v=([\w-]{11})', text)
    titles = re.findall(r'id="video-title"[^>]*title="([^"]+)"', text)
    if len(vids) != len(titles):
        raise RuntimeError(f"Unexpected list6.ini shape: vids={len(vids)} titles={len(titles)}")

    level_to_video: dict[int, LevelVideo] = {}
    range_re = re.compile(r"\bLevel\s*(\d{1,5})\s*[-–]\s*(\d{1,5})\b", re.I)
    list_re = re.compile(r"\bLevel\s*([0-9]{1,5}(?:\s+[0-9]{1,5})*)", re.I)

    for vid, title in zip(vids, titles):
        match = range_re.search(title)
        if match:
            a = int(match.group(1))
            b = int(match.group(2))
            if b < a:
                a, b = b, a
            levels = range(a, b + 1)
        else:
            match2 = list_re.search(title)
            if not match2:
                continue
            seq = match2.group(1)
            nums = [int(x) for x in seq.split() if x.isdigit()]
            if not nums:
                continue
            levels = nums

        for lvl in levels:
            level_to_video.setdefault(lvl, LevelVideo(level=lvl, video_id=vid, source_title=title))

    return level_to_video


def parse_level_links(text: str) -> dict[int, LevelVideo]:
    pairs = re.findall(
        r"\b(\d{1,5})\s+https?://(?:www\.)?youtube\.com/watch\?v=([\w-]{11})\b", text
    )
    pairs += re.findall(r"\b(\d{1,5})\s+https?://youtu\.be/([\w-]{11})\b", text)
    level_to_video: dict[int, LevelVideo] = {}
    for level_str, vid in pairs:
        lvl = int(level_str)
        level_to_video.setdefault(lvl, LevelVideo(level=lvl, video_id=vid, source_title=f"Level {lvl}"))
    return level_to_video


def load_playlist_levels(repo_root: str) -> tuple[set[int], int]:
    playlist_path = os.path.join(repo_root, "assets", "js", "playlist-data.js")
    raw = open(playlist_path, "r", encoding="utf-8", errors="ignore").read()
    prefix = "window.PIXEL_FLOW_PLAYLIST = "
    if not raw.startswith(prefix):
        raise RuntimeError(f"Unexpected playlist format in {playlist_path}")
    arr_text = raw[len(prefix) :].strip()
    data = json.loads(arr_text)
    covered: set[int] = set()
    max_level = 0
    for entry in data:
        start = entry.get("levelStart")
        end = entry.get("levelEnd")
        if not isinstance(start, int) or not isinstance(end, int):
            continue
        lo, hi = (start, end) if start <= end else (end, start)
        for lvl in range(lo, hi + 1):
            covered.add(lvl)
        max_level = max(max_level, hi)
    return covered, max_level


def append_playlist_entries(repo_root: str, items: Iterable[LevelVideo], dry_run: bool) -> int:
    playlist_path = os.path.join(repo_root, "assets", "js", "playlist-data.js")
    content = open(playlist_path, "r", encoding="utf-8", errors="ignore").read()
    stripped = content.rstrip()
    if not stripped.endswith("]"):
        raise RuntimeError(f"Unexpected playlist end in {playlist_path}")
    close_index = stripped.rfind("]")
    prefix = stripped[:close_index].rstrip()
    if not prefix.endswith("}"):
        raise RuntimeError(f"Unexpected playlist body in {playlist_path}")

    new_items = list(items)
    if not new_items:
        return 0

    blocks: list[str] = []
    for item in new_items:
        title = f"Pixel Flow - Level {item.level}"
        obj = {
            "title": title,
            "subtitle": title,
            "href": f"https://www.youtube.com/watch?v={item.video_id}",
            "levelStart": item.level,
            "levelEnd": item.level,
            "slug": f"level-{item.level}",
            "videoId": item.video_id,
        }
        rendered = json.dumps(obj, ensure_ascii=False, indent=2)
        blocks.append("\n".join("  " + line if line else line for line in rendered.splitlines()))

    updated = prefix + ",\n" + ",\n".join(blocks) + "\n]\n"
    if not dry_run:
        with open(playlist_path, "w", encoding="utf-8") as f:
            f.write(updated)
    return len(new_items)


def build_level_page(level: int, title: str, video_id: str, max_level: int, prev_level: int | None, next_level: int | None) -> str:
    safe_title = html_escape(title)
    description = html_escape(f"{title} walkthrough video and guide.")
    canonical = f"https://pixelflowlevel.app/level/{level}/"
    youtube = f"https://www.youtube.com/watch?v={video_id}"
    iframe = f"https://www.youtube.com/embed/{video_id}"

    nav_html = ""
    if prev_level is not None or next_level is not None:
        links = []
        if prev_level is not None:
            links.append(f'<a class="level-nav-link" href="/level/{prev_level}/">← Previous ({prev_level})</a>')
        if next_level is not None:
            links.append(f'<a class="level-nav-link" href="/level/{next_level}/">Next ({next_level}) →</a>')
        nav_html = f'<div class="level-nav">{"".join(links)}</div>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6428701926694635"
     crossorigin="anonymous"></script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-HCVTYH1N52"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());

  gtag('config', 'G-HCVTYH1N52');
</script>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{safe_title}</title>
  <meta name="description" content="{description}">
  <meta name="keywords" content="Pixel Flow, pixel puzzle game, download Pixel Flow, free puzzle games, strategic gameplay, pixel art visuals, offline puzzle game, challenging levels, pixel flow level, pixel flow guide">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#ffe0f6">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="canonical" href="{canonical}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/site.css">
</head>

<body data-level-base="/levels/" data-detail-page="/level">

<header class="site-header">
  <div class="container nav">
    <a class="brand" href="/index.html">
      <img class="brand-logo" src="/logo.png" alt="Pixel Flow" width="42" height="42">
      <div>
        <span>Pixel Flow</span>
        <small>Pixel Flow Guide</small>
      </div>
    </a>
    <nav class="nav-links">
      <a href="/index.html">Home</a>
      <a href="/levels.html">Levels</a>
      <a href="/blog.html">Blog</a>
      <a href="/download.html">Download</a>
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
    </nav>
    <div class="nav-actions">
      <input type="number" min="1" max="{max_level}" placeholder="Jump to level" data-nav-jump-input>
      <button type="button" data-nav-jump-btn>Go</button>
    </div>
    <button class="nav-toggle" type="button" data-nav-toggle>Menu</button>
  </div>
</header>
<div class="mobile-nav" data-mobile-nav>
  <div class="container">
    <a href="/index.html">Home</a>
    <a href="/levels.html">Levels</a>
    <a href="/blog.html">Blog</a>
    <a href="/download.html">Download</a>
    <a href="/about.html">About</a>
    <a href="/contact.html">Contact</a>
    <input type="number" min="1" max="{max_level}" placeholder="Jump to level" data-nav-jump-input>
    <button type="button" data-nav-jump-btn>Go</button>
  </div>
</div>

<main>
  <section class="hero" style="padding-bottom: 3rem;">
    <div class="container">
      <span class="hero-kicker">Pixel flow level</span>
      <h1>{safe_title}</h1>
      <p>{safe_title}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/levels.html">Back to all levels</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split">
      <div>
        <div class="video-frame">
          <iframe src="{iframe}" title="{safe_title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          {nav_html}
        </div>
      </div>
      <div>
        <div class="related-levels">
          <h3>Nearby levels</h3>
          <div class="related-grid"></div>
        </div>
        <div class="card">
          <span class="badge">Level {level}</span>
          <h2>Walkthrough details</h2>
          <p>{safe_title}</p>
          <p>Watch the quick {safe_title} walkthrough and follow along to clear the stage.</p>
        </div>
      </div>
    </div>
  </section>

  <div class="notice-box">
    <h3>Version Differences 更新提示</h3>
    <p>Pixel Flow levels get tuned occasionally, so layouts or solutions may change between app updates. If this guide doesn’t match perfectly, use the screenshot and video above to adjust.</p>
    <p>像素流关卡有时会调整，不同版本可能导致布局或解法略有差异。如发现与当前关卡不完全一致，请参考上方图片与视频自行微调。</p>
  </div>

  <div class="level-note"><p>Level {level}: 观看视频 {video_id}，关注开局路径与堵点，必要时暂停复现操作，确保边角与孤块被填满。</p></div>
</main>

<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="brand" style="gap: 0.6rem; margin-bottom: 1rem;">
          <img class="brand-logo" src="/logo.png" alt="Pixel Flow" width="42" height="42">
          <div>
            <span>Pixel Flow</span>
            <small>Pixel Flow Guide</small>
          </div>
        </div>
        <p>Pixel Flow is a pixel puzzle game built around strategic gameplay, clean pixel art visuals, and offline puzzle game sessions.</p>
      </div>
      <div>
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/index.html">Home</a></li>
          <li><a href="/levels.html">All Levels</a></li>
          <li><a href="/download.html">Download Pixel Flow</a></li>
          <li><a href="/blog.html">Blog</a></li>
          <li><a href="/about.html">About</a></li>
          <li><a href="/contact.html">Contact</a></li>
          <li><a href="/privacy.html">Privacy Policy</a></li>
          <li><a href="/terms.html">Terms</a></li>
        </ul>
      </div>
      <div>
        <h3>Stay Updated</h3>
        <p>More Pixel Flow walkthroughs and pixel puzzle strategies on the way.</p>
      </div>
    </div>
    <p class="copyright">© <span data-current-year></span> Pixel Flow Guide. Fan-made walkthrough site.</p>
  </div>
</footer>

<script src="/assets/js/playlist-data.js"></script>
<script src="/assets/js/levels.js"></script>
<script src="/assets/js/site.js"></script>
</body>
</html>
"""


def write_missing_level_pages(repo_root: str, mapping: dict[int, LevelVideo], max_level: int, dry_run: bool) -> list[int]:
    level_root = os.path.join(repo_root, "level")
    existing_dirs = {int(name) for name in os.listdir(level_root) if name.isdigit()}
    missing_levels = sorted([lvl for lvl in mapping if lvl not in existing_dirs])
    if not missing_levels:
        return []

    all_levels = sorted(existing_dirs.union(missing_levels))
    idx_by_level = {lvl: i for i, lvl in enumerate(all_levels)}

    for lvl in missing_levels:
        entry = mapping[lvl]
        i = idx_by_level[lvl]
        prev_level = all_levels[i - 1] if i - 1 >= 0 else None
        next_level = all_levels[i + 1] if i + 1 < len(all_levels) else None
        title = f"Pixel Flow - Level {lvl}"
        html = build_level_page(
            level=lvl,
            title=title,
            video_id=entry.video_id,
            max_level=max_level,
            prev_level=prev_level,
            next_level=next_level,
        )
        out_dir = os.path.join(level_root, str(lvl))
        out_path = os.path.join(out_dir, "index.html")
        if not dry_run:
            os.makedirs(out_dir, exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(html)
    return missing_levels


def update_sitemap(repo_root: str, added_levels: Iterable[int], lastmod: str, dry_run: bool) -> int:
    sitemap_path = os.path.join(repo_root, "sitemap.xml")
    lines = open(sitemap_path, "r", encoding="utf-8", errors="ignore").read().splitlines()

    existing_level_lastmod: dict[int, str] = {}
    other_url_lines: list[str] = []

    level_re = re.compile(r"<loc>https://pixelflowlevel\.app/level/(\d+)/</loc><lastmod>(\d{4}-\d{2}-\d{2})</lastmod>")

    for line in lines:
        match = level_re.search(line)
        if match:
            lvl = int(match.group(1))
            existing_level_lastmod[lvl] = match.group(2)
        elif "<url><loc>" in line:
            other_url_lines.append(line)

    added = 0
    for lvl in sorted(set(added_levels)):
        if lvl in existing_level_lastmod:
            continue
        existing_level_lastmod[lvl] = lastmod
        added += 1

    out_lines: list[str] = []
    out_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    out_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for line in other_url_lines:
        out_lines.append(line)
    for lvl in sorted(existing_level_lastmod):
        out_lines.append(
            f"  <url><loc>https://pixelflowlevel.app/level/{lvl}/</loc><lastmod>{existing_level_lastmod[lvl]}</lastmod></url>"
        )
    out_lines.append("</urlset>")
    out = "\n".join(out_lines) + "\n"
    if not dry_run:
        with open(sitemap_path, "w", encoding="utf-8") as f:
            f.write(out)
    return added


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync missing Pixel Flow levels from playlist sources.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--ini", help="Path to list6.ini (YouTube playlist HTML dump)")
    group.add_argument("--links", help="Path to a text/rtf file containing: <level> <youtube url> per line")
    parser.add_argument("--repo-root", default=".", help="Repo root containing assets/ and level/")
    parser.add_argument("--dry-run", action="store_true", help="Print what would change without writing")
    args = parser.parse_args()

    repo_root = os.path.abspath(args.repo_root)
    if args.ini:
        src_text = open(args.ini, "r", encoding="utf-8", errors="ignore").read()
        mapping = parse_list6_ini(src_text)
        source_label = "ini"
    else:
        src_text = open(args.links, "r", encoding="utf-8", errors="ignore").read()
        mapping = parse_level_links(src_text)
        source_label = "links"
    if not mapping:
        raise RuntimeError("No levels parsed from source")

    covered_levels, playlist_max = load_playlist_levels(repo_root)
    max_level = max(playlist_max, max(mapping))

    missing_for_playlist = sorted([lvl for lvl in mapping if lvl not in covered_levels])
    to_add = [mapping[lvl] for lvl in missing_for_playlist]

    created_levels = write_missing_level_pages(repo_root, mapping, max_level=max_level, dry_run=args.dry_run)
    added_playlist = append_playlist_entries(repo_root, to_add, dry_run=args.dry_run)
    added_sitemap = update_sitemap(
        repo_root,
        added_levels=created_levels,
        lastmod=dt.date.today().isoformat(),
        dry_run=args.dry_run,
    )

    print(f"Source: {source_label}")
    print(f"Parsed levels: {len(mapping)} (unique)")
    print(f"Playlist max level: {playlist_max}; mapping max level: {max(mapping)}; max: {max_level}")
    print(f"Missing in playlist: {len(missing_for_playlist)}")
    print(f"Created level pages: {len(created_levels)}")
    print(f"Added playlist entries: {added_playlist}")
    print(f"Added sitemap urls: {added_sitemap}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
