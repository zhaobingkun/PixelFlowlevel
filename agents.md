# Pixel Flow Project Instructions

## Project Background

- Project path: `/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel`
- Site: Pixel Flow level walkthrough archive.
- Type: static SEO site with one page per level and playlist-backed video metadata.
- External crawler workspace: `/Users/zhaobingkun/dev/Python/spider`

## Goals And Boundaries

- Keep the site crawlable as static HTML.
- Maintain level pages, sitemap, homepage stats, and missing-level records.
- Do not auto commit or push unless the user explicitly asks.
- For daily crawler work, use the existing automation chain instead of inventing a second workflow.

## Required Reading Before Work

Before changing this project, read:

- `agents.md`
- `memory.md`
- `PROJECT-MEMORY.md`

If any of these files are missing, recreate or update them with the current project state.

## SEO Rules

- Important page content must be visible in original HTML.
- Keep unique title, meta description, canonical URL, Open Graph, and sitemap entries for public SEO pages.
- Use hub and internal links so level pages are discoverable within three clicks where practical.
- Maintain `robots.txt`, `sitemap.xml`, canonical tags, and structured data when adding public pages.

## Daily Automation

- Wrapper: `/Users/zhaobingkun/dev/Python/spider/run_pixelflow_daily.sh`
- Main crawler: `/Users/zhaobingkun/dev/Python/spider/pixelflow.py`
- launchd plist: `/Users/zhaobingkun/Library/LaunchAgents/com.zhaobingkun.pixelflow.daily.plist`
- Logs:
  - `/Users/zhaobingkun/Library/Logs/pixelflow-daily.log`
  - `/Users/zhaobingkun/Library/Logs/pixelflow-daily.err.log`

