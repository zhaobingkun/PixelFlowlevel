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
class LinkEntry:
    level: int
    video_id: str
    title: str
    published_at: str  # ISO string

    @property
    def published_date(self) -> str:
        # Normalize to YYYY-MM-DD for sitemap <lastmod>
        try:
            return self.published_at[:10]
        except Exception:
            return ""


def html_escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def build_level_copy(level: int) -> dict[str, str]:
    opening_patterns = [
        "Start Pixel Flow level {level} by locking one short lane near the edge before you stretch any long route through the center. That opening keeps the board readable and leaves room for the final cleanup path.",
        "On Pixel Flow level {level}, the safest first move is usually the smallest confirmed connection you can make without crossing the middle. Building one stable side route first reduces the chance of boxing in later colors.",
        "Treat Pixel Flow level {level} like a route-order puzzle instead of a speed puzzle. Open with the cleanest corner path, then use that anchor to decide which line should claim the center corridor.",
        "The fastest way through Pixel Flow level {level} is to settle a compact section first and delay the longest path. That keeps your working area flexible while you confirm where each color pair can safely pass.",
    ]
    blocker_patterns = [
        "Most failed attempts happen when two colors compete for the same strip of cells. If that happens, reset only that lane, reopen the edge route, and reconnect the middle after the side pockets are secure.",
        "If the board keeps collapsing, the problem is usually route order rather than the final shape. Pull back one chain, clear the shared junction, and rebuild the longest line only after the smaller pair is fixed.",
        "When this stage feels stuck, look for the place where one route closes a doorway too early. Reopening that doorway and solving the nearby pocket first is often enough to free the rest of the board.",
        "A common stall point on this board is overcommitting to the center too early. Keep one escape channel open until the corners are settled, then finish the middle with fewer crossing decisions.",
    ]
    video_patterns = [
        "Use the walkthrough video as a checkpoint, not just a copy guide. Compare your opening route, the first center turn, and the last two cleanup moves to see exactly where your board order changed.",
        "The video is most useful when your layout looks close but the final cells refuse to close. Pause at the halfway point, compare the center lanes, and then replay the finish instead of restarting everything.",
        "If your board diverges from the guide, check the first third of the video and the transition into the final route. Those two moments usually reveal which line claimed too much space.",
        "Watch the clip once for route order and a second time for cleanup timing. Matching those two phases is usually more effective than tracing every drag in real time.",
    ]
    focus_patterns = [
        "Check the shortest edge pair first, then decide which route deserves the center lane.",
        "Read the corners before the middle so you know which path can stay flexible the longest.",
        "Secure one compact cluster first and use it to control the remaining open corridor.",
        "Start with the lane that closes the fewest exits and keep one backup channel available.",
    ]
    mistake_patterns = [
        "Do not let the longest line cross the middle before the side cells are stable.",
        "Avoid sealing a corner pocket too early or you will force a later crossover.",
        "Do not mirror the video blindly if your board already diverged in the opening.",
        "Avoid solving two competing colors at once when one narrow lane controls both.",
    ]

    return {
        "heading": f"How to clear Pixel Flow level {level}",
        "overview": opening_patterns[level % len(opening_patterns)].format(level=level),
        "approach": blocker_patterns[level % len(blocker_patterns)].format(level=level),
        "video_tip": video_patterns[level % len(video_patterns)].format(level=level),
        "focus": focus_patterns[level % len(focus_patterns)].format(level=level),
        "mistake": mistake_patterns[level % len(mistake_patterns)].format(level=level),
    }


def build_level_seo(level: int) -> dict[str, str]:
    title_patterns = [
        (
            "Pixel Flow Level {level} Walkthrough Guide",
            "Pixel Flow Level {level} Walkthrough Guide",
        ),
        (
            "How to Beat Pixel Flow Level {level} | Video Walkthrough",
            "How to Beat Pixel Flow Level {level}",
        ),
        (
            "Pixel Flow Level {level} Solution Guide and Walkthrough",
            "Pixel Flow Level {level} Solution Guide",
        ),
        (
            "Pixel Flow Level {level} Route Tips and Video Guide",
            "Pixel Flow Level {level} Route Tips",
        ),
        (
            "Pixel Flow {level} Puzzle Help | Walkthrough Guide",
            "Pixel Flow Level {level} Puzzle Help",
        ),
        (
            "Pixel Flow Level {level} Strategy and Walkthrough",
            "Pixel Flow Level {level} Strategy Guide",
        ),
    ]
    intro_patterns = [
        "Use this Pixel Flow level {level} guide when you need a quick route order check, a clean video reference, and a safer way to open the board without closing the center too early.",
        "This Pixel Flow level {level} walkthrough is built for players who want the fastest opening route, a reliable checkpoint against the video, and fewer late-board resets.",
        "Open Pixel Flow level {level} here if you want a direct solution path, a short explanation of the risky lane, and a walkthrough video you can compare against move by move.",
        "Pixel Flow level {level} can look simple until one route steals too much space. This guide helps you read the opening, protect the middle, and finish with fewer corrections.",
        "If Pixel Flow level {level} keeps breaking near the end, use this page to compare your first moves, recheck the shared corridor, and copy the cleanup order from the video.",
        "Come back to this Pixel Flow level {level} page when you need route tips, a fast puzzle reset point, and a walkthrough that shows where the board usually goes wrong.",
    ]
    meta_patterns = [
        "Pixel Flow level {level} walkthrough guide with video, opening route tips, and common mistake checks for a cleaner clear.",
        "How to beat Pixel Flow level {level} with a video walkthrough, route order notes, and quick puzzle help.",
        "Pixel Flow level {level} solution guide with walkthrough video, center-lane tips, and safer cleanup advice.",
        "Watch the Pixel Flow level {level} video guide, compare the opening route, and avoid the most common board mistakes.",
        "Pixel Flow {level} puzzle help with a full walkthrough video, route tips, and a quick way to fix stalled runs.",
        "Pixel Flow level {level} strategy guide covering first moves, route order, and walkthrough video checkpoints.",
    ]
    detail_meta_patterns = [
        "Level {level} walkthrough video and route order notes.",
        "Video solution for level {level} with a quick opening plan.",
        "Level {level} guide with video timing and cleanup help.",
        "Route tips and video checkpoints for level {level}.",
        "Puzzle help for level {level} with a direct video walkthrough.",
        "Level {level} strategy notes paired with the walkthrough video.",
    ]
    detail_desc_patterns = [
        "Use the video to confirm the opening route, then compare the center lane before you lock the final path.",
        "This guide is best used as a route-order check so you can fix the blocking move instead of replaying the whole board.",
        "Watch for the point where one color claims the shared corridor, because that usually decides whether the finish stays open.",
        "If your run collapses near the end, compare the first stable edge route and the final cleanup sequence against the video.",
        "The walkthrough is most helpful when your board looks close but one lane keeps sealing too early.",
        "Use these notes to identify the risky turn, then replay only that section with the video as a checkpoint.",
    ]
    idx = level % len(title_patterns)
    seo_title, heading = title_patterns[idx]
    return {
        "seo_title": seo_title.format(level=level),
        "heading": heading.format(level=level),
        "intro": intro_patterns[idx].format(level=level),
        "meta_description": meta_patterns[idx].format(level=level),
        "detail_meta": detail_meta_patterns[idx].format(level=level),
        "detail_description": detail_desc_patterns[idx].format(level=level),
    }


def parse_links_markdown(md_text: str) -> dict[int, LinkEntry]:
    # Example blocks:
    # ## 1. Pixel Flow Level 1923
    # - 链接：https://www.youtube.com/watch?v=R7utKMasBXk
    # - 发布时间：2025-12-04T18:12:39Z
    pattern = re.compile(
        r"^##\s*\d+\.\s*(?P<title>.+?)\s*\n"
        r"-\s*链接：https?://(?:www\.)?youtube\.com/watch\?v=(?P<vid>[\w-]+)\s*\n"
        r"-\s*发布时间：(?P<published>\d{4}-\d{2}-\d{2}T[0-9:\.]+Z)\s*$",
        re.M,
    )

    by_level: dict[int, LinkEntry] = {}
    for match in pattern.finditer(md_text):
        title = match.group("title").strip()
        video_id = match.group("vid").strip()
        published_at = match.group("published").strip()
        level_match = re.search(r"Pixel Flow Level\s*(\d+)", title, re.I)
        if not level_match:
            continue
        level = int(level_match.group(1))

        existing = by_level.get(level)
        if existing is None or published_at > existing.published_at:
            by_level[level] = LinkEntry(
                level=level,
                video_id=video_id,
                title=title,
                published_at=published_at,
            )
    return by_level


def parse_links_json(json_text: str) -> dict[int, LinkEntry]:
    payload = json.loads(json_text)
    items = payload.get("found", payload) if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        raise RuntimeError("JSON source must be a list or an object with a 'found' array.")

    by_level: dict[int, LinkEntry] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        level = item.get("level")
        title = item.get("title")
        video_id = item.get("video_id")
        published_at = item.get("publishedAt") or item.get("published_at") or ""
        if not isinstance(level, int) or not isinstance(title, str) or not title.strip():
            continue
        if not isinstance(video_id, str) or not video_id.strip():
            url = item.get("url")
            if isinstance(url, str):
                match = re.search(r"[?&]v=([\w-]+)", url)
                if match:
                    video_id = match.group(1)
        if not isinstance(video_id, str) or not video_id.strip():
            continue

        existing = by_level.get(level)
        if existing is None or published_at > existing.published_at:
            by_level[level] = LinkEntry(
                level=level,
                video_id=video_id.strip(),
                title=title.strip(),
                published_at=published_at.strip(),
            )
    return by_level


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


def append_playlist_entries(repo_root: str, entries: Iterable[LinkEntry], dry_run: bool) -> int:
    playlist_path = os.path.join(repo_root, "assets", "js", "playlist-data.js")
    content = open(playlist_path, "r", encoding="utf-8", errors="ignore").read()
    stripped = content.rstrip()
    if not stripped.endswith("]"):
        raise RuntimeError(f"Unexpected playlist end in {playlist_path}")
    close_index = stripped.rfind("]")
    prefix = stripped[:close_index].rstrip()
    if not prefix.endswith("}"):
        raise RuntimeError(f"Unexpected playlist body in {playlist_path}")

    new_entries = list(entries)
    if not new_entries:
        return 0

    blocks: list[str] = []
    for entry in new_entries:
        obj = {
            "title": entry.title,
            "subtitle": entry.title,
            "href": f"https://www.youtube.com/watch?v={entry.video_id}",
            "levelStart": entry.level,
            "levelEnd": entry.level,
            "slug": f"level-{entry.level}",
            "videoId": entry.video_id,
        }
        rendered = json.dumps(obj, ensure_ascii=False, indent=2)
        blocks.append("\n".join("  " + line if line else line for line in rendered.splitlines()))

    updated = prefix + ",\n" + ",\n".join(blocks) + "\n]\n"
    if not dry_run:
        with open(playlist_path, "w", encoding="utf-8") as f:
            f.write(updated)
    return len(new_entries)


def build_level_page(level: int, title: str, video_id: str, max_level: int, prev_level: int | None, next_level: int | None) -> str:
    seo_copy = build_level_seo(level)
    safe_title = html_escape(seo_copy["heading"])
    keyword_heading = html_escape(f"pixel flow {level}")
    subtitle = html_escape(seo_copy["intro"])
    description = html_escape(seo_copy["meta_description"])
    level_copy = build_level_copy(level)
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
  <title>{html_escape(seo_copy["seo_title"])}</title>
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
      <h2 class="level-keyword-title">{keyword_heading}</h2>
      <p>{subtitle}</p>
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
          <p>{html_escape(seo_copy["detail_meta"])}</p>
          <p>{html_escape(seo_copy["detail_description"])}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section level-guide-copy">
    <div class="container">
      <div class="card guide-copy-card">
        <span class="badge">Solve notes</span>
        <h2>{html_escape(level_copy["heading"])}</h2>
        <p>{html_escape(level_copy["overview"])}</p>
        <p>{html_escape(level_copy["approach"])}</p>
        <p>{html_escape(level_copy["video_tip"])}</p>
        <div class="guide-copy-grid">
          <div class="guide-copy-mini">
            <h3>First move focus</h3>
            <p>{html_escape(level_copy["focus"])}</p>
          </div>
          <div class="guide-copy-mini">
            <h3>Common mistake</h3>
            <p>{html_escape(level_copy["mistake"])}</p>
          </div>
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


def write_missing_level_pages(repo_root: str, entries: dict[int, LinkEntry], max_level: int, dry_run: bool) -> tuple[int, list[int]]:
    level_root = os.path.join(repo_root, "level")
    existing_dirs = {int(name) for name in os.listdir(level_root) if name.isdigit()}

    missing_levels = sorted([lvl for lvl in entries if lvl not in existing_dirs])
    if not missing_levels:
        return 0, []

    all_levels = sorted(existing_dirs.union(missing_levels))
    idx_by_level = {lvl: i for i, lvl in enumerate(all_levels)}

    created = 0
    for lvl in missing_levels:
        entry = entries[lvl]
        i = idx_by_level[lvl]
        prev_level = all_levels[i - 1] if i - 1 >= 0 else None
        next_level = all_levels[i + 1] if i + 1 < len(all_levels) else None
        html = build_level_page(
            level=lvl,
            title=entry.title,
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
        created += 1

    return created, missing_levels


def update_sitemap(repo_root: str, entries: dict[int, LinkEntry], added_levels: Iterable[int], dry_run: bool) -> int:
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

    add_set = set(added_levels)
    added = 0
    for lvl in sorted(add_set):
        if lvl in existing_level_lastmod:
            continue
        entry = entries.get(lvl)
        lastmod = entry.published_date if entry else ""
        if not lastmod:
            lastmod = dt.date.today().isoformat()
        existing_level_lastmod[lvl] = lastmod
        added += 1

    # Rebuild XML with the same compact 1-line-per-url style.
    out_lines: list[str] = []
    out_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    out_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    # Preserve non-level urls in original order.
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
    parser = argparse.ArgumentParser(description="Sync missing Pixel Flow level pages/data from a markdown links list.")
    parser.add_argument(
        "--links-md",
        default="/Users/zhaobingkun/dev/Python/spider/pixel_flow_level_links.md",
        help="Path to pixel_flow_level_links.md",
    )
    parser.add_argument(
        "--links-json",
        help="Path to a JSON file containing found level entries",
    )
    parser.add_argument("--repo-root", default=".", help="Repo root containing assets/ and level/")
    parser.add_argument("--dry-run", action="store_true", help="Print what would change without writing")
    args = parser.parse_args()

    repo_root = os.path.abspath(args.repo_root)
    if args.links_json:
        raw_text = open(args.links_json, "r", encoding="utf-8", errors="ignore").read()
        entries_by_level = parse_links_json(raw_text)
    else:
        md_text = open(args.links_md, "r", encoding="utf-8", errors="ignore").read()
        entries_by_level = parse_links_markdown(md_text)
    if not entries_by_level:
        raise RuntimeError("No entries parsed from input file.")

    covered_levels, playlist_max = load_playlist_levels(repo_root)
    link_max = max(entries_by_level)
    max_level = max(playlist_max, link_max)

    missing_for_playlist = sorted([lvl for lvl in entries_by_level if lvl not in covered_levels])
    missing_entries = [entries_by_level[lvl] for lvl in missing_for_playlist]

    created_pages, created_levels = write_missing_level_pages(
        repo_root=repo_root,
        entries=entries_by_level,
        max_level=max_level,
        dry_run=args.dry_run,
    )

    added_playlist = append_playlist_entries(repo_root, missing_entries, dry_run=args.dry_run)
    added_sitemap = update_sitemap(repo_root, entries_by_level, created_levels, dry_run=args.dry_run)

    print(f"Parsed link entries: {len(entries_by_level)} levels (unique)")
    print(f"Playlist max level: {playlist_max}; link max level: {link_max}; new max: {max_level}")
    print(f"Missing in playlist: {len(missing_for_playlist)}")
    print(f"Created level pages: {created_pages}")
    print(f"Added playlist entries: {added_playlist}")
    print(f"Added sitemap urls: {added_sitemap}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
