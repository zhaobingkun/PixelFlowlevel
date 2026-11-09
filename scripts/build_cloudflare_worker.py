#!/usr/bin/env python3
"""Build the public-only static asset bundle used by Cloudflare Workers."""

from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANONICAL_HOST = "pixelflowlevel.app"
PUBLIC_DIRECTORIES = {"assets", "blog", "level"}
ROOT_PUBLIC_FILES = {
    "index.html",
    "404.html",
    "about.html",
    "ads.txt",
    "apple-touch-icon.png",
    "blog.html",
    "contact.html",
    "download.html",
    "favicon.ico",
    "favicon.png",
    "favicon.svg",
    "level.html",
    "levels.html",
    "logo.png",
    "privacy.html",
    "robots.txt",
    "sitemap.xml",
    "terms.html",
    "youtube-check.html",
}
VERIFICATION_FILE = re.compile(r"^[0-9a-f]{32}\.txt$")


def should_copy(relative: Path) -> bool:
    if any(part.startswith(".") for part in relative.parts):
        return False

    if len(relative.parts) == 1:
        return relative.name in ROOT_PUBLIC_FILES or bool(
            VERIFICATION_FILE.fullmatch(relative.name)
        )

    if relative.parts[0] == "assets":
        return relative.suffix.lower() in {".css", ".js"}

    if relative.parts[0] == "blog":
        return len(relative.parts) == 2 and relative.suffix.lower() == ".html"

    if relative.parts[0] == "level":
        return (
            len(relative.parts) == 3
            and relative.parts[1].isdigit()
            and relative.name == "index.html"
        )

    return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    output = args.output.resolve()

    if output == ROOT or output in {ROOT / "assets", ROOT / "blog", ROOT / "level"}:
        raise SystemExit(f"Refusing unsafe output directory: {output}")

    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    count = 0
    for source in ROOT.rglob("*"):
        if not source.is_file():
            continue
        relative = source.relative_to(ROOT)
        if not should_copy(relative):
            continue
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        count += 1

    required = [
        output / "index.html",
        output / "404.html",
        output / "levels.html",
        output / "level" / "1" / "index.html",
        output / "robots.txt",
        output / "sitemap.xml",
        output / "ads.txt",
    ]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise SystemExit("Missing required public files: " + ", ".join(missing))

    forbidden = [
        output / ".env.local",
        output / "agents.md",
        output / "memory.md",
        output / "PROJECT-MEMORY.md",
        output / "README.md",
        output / "reports",
        output / "scripts",
    ]
    leaked = [str(path) for path in forbidden if path.exists()]
    if leaked:
        raise SystemExit("Private project files leaked into build: " + ", ".join(leaked))

    print(f"Built {count} public files for https://{CANONICAL_HOST} in {output}")


if __name__ == "__main__":
    main()
