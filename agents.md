# Pixel Flow Project Instructions

## Project Background

- Project path: `/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel`
- Site: Pixel Flow level walkthrough archive.
- Type: static SEO site with one page per level and playlist-backed video metadata.
- External crawler workspace: `/Users/zhaobingkun/dev/Python/spider`

## Goals And Boundaries

- Keep the site crawlable as static HTML.
- Maintain level pages, sitemap, homepage stats, and missing-level records.
- Manual work must not auto commit or push unless the user explicitly asks. The daily launchd task is authorized to auto-publish crawler-generated changes through the external wrapper `/Users/zhaobingkun/dev/Python/spider/run_pixelflow_daily.sh`.
- The daily publisher must refuse to run when the site repo starts dirty or is not on `main`; this prevents unrelated manual work from being included in an automated commit.
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

## Daily Auto-Publish

- Before crawling, the wrapper fast-forwards the site repo from `origin/main` and requires a clean working tree.
- After a successful site sync, the external wrapper commits generated changes and pushes `main` to `origin`.
- A run with no generated site changes does not create an empty commit.
- The GitHub push is the publish trigger for the linked Vercel project; the daily wrapper does not require a local Vercel token.
- If the repository is dirty, the branch is not `main`, the fast-forward check fails, or the push fails, the task exits non-zero and leaves the files available for inspection.
