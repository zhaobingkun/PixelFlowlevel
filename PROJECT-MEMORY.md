# Project Memory

## Latest Daily Automation Check

- 2026-08-16: No successful wrapper run. The 10:30 launchd attempt refused because the repository was dirty from uncommitted `memory.md` and `PROJECT-MEMORY.md`; no wrapper rerun was authorized under the clean-worktree rule.
- Current read-only state remains 4,395 numeric level directories, max level 4,570, 605 missing levels, and 4,412 sitemap URLs. Project and external missing-level files match the computed gaps.

## Project

- Path: `/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel`
- Site theme: `Pixel Flow` level walkthrough archive
- Site type: static SEO walkthrough site
- Core content model: one page per level + playlist-backed video metadata

## Current State

- Current covered level page directories: `4395`
- Current maximum level in site data: `4570`
- Current generated `missingTo5000` in `assets/js/home-data.js`: `605`
- Note: static homepage/navigation values still show the previous `4204` / `4505` snapshot and need a separate static-page sync.

## Automation State

- The macOS launchd task runs `/Users/zhaobingkun/dev/Python/spider/run_pixelflow_daily.sh` daily at 10:30.
- The task now fast-forwards the site repo from `origin/main` before crawling, requires a clean `main` worktree, and automatically commits/pushes successful crawler-generated site changes.
- The commit/push logic lives in the external wrapper `/Users/zhaobingkun/dev/Python/spider/run_pixelflow_daily.sh` and is intentionally not part of the site repository.
- Pushing `origin/main` is the publish step because this repository is linked to the Vercel project `pixel-flowlevel`; no local Vercel CLI token is required.

## Main Files

- Homepage:
  - [index.html](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/index.html)
- Level list:
  - [levels.html](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/levels.html)
- Generic level template:
  - [level.html](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/level.html)
- Core data:
  - [assets/js/playlist-data.js](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/js/playlist-data.js)
  - [assets/js/home-data.js](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/js/home-data.js)
- Frontend logic:
  - [assets/js/home.js](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/js/home.js)
  - [assets/js/levels.js](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/js/levels.js)
  - [assets/js/level-page.js](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/js/level-page.js)
  - [assets/js/site.js](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/js/site.js)
- Styling:
  - [assets/css/site.css](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/css/site.css)
- Technical:
  - [sitemap.xml](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/sitemap.xml)
  - [robots.txt](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/robots.txt)
  - [README.md](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/README.md)

## Scripts Used For Maintenance

- Daily crawler wrapper:
  - `/Users/zhaobingkun/dev/Python/spider/run_pixelflow_daily.sh`
- Daily crawler main script:
  - `/Users/zhaobingkun/dev/Python/spider/pixelflow.py`
- Home data rebuild:
  - [scripts/build_home_data.py](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/scripts/build_home_data.py)
- JSON / markdown sync:
  - [scripts/sync_levels_from_markdown.py](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/scripts/sync_levels_from_markdown.py)
- INI-based sync:
  - [scripts/sync_levels_from_list6_ini.py](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/scripts/sync_levels_from_list6_ini.py)

## Core Workflow For Adding New Levels

Typical source file:
- `/Users/zhaobingkun/dev/Python/spider/cherie_found_levels_1.json`
- `/Users/zhaobingkun/dev/Python/spider/cherie_found_levels_2.json`

Standard flow:
1. Dry run:
   - run `sync_levels_from_markdown.py --links-json ... --dry-run`
2. Real sync:
   - updates `playlist-data.js`
   - creates missing `level/<n>/index.html`
   - updates `sitemap.xml`
3. Rebuild:
   - run `build_home_data.py`
4. Update static entry pages if needed:
   - homepage
   - levels page
   - 404
   - generic/static pages with hardcoded max values
5. Recompute missing levels file(s)

## Important External Missing Files

Project-internal missing file:
- [missing_levels_1-5000.txt](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/missing_levels_1-5000.txt)

External working copy:
- `/Users/zhaobingkun/dev/Python/spider/missing_levels_1-5000.txt`

Current external missing file status:
- covered: `4374`
- missing: `626`
- important current gaps confirmed:
  - `4341` is still missing

## Recent Level Sync History

Recent confirmed state after latest sync:
- Current site has `4374` numeric level directories through `4570`.
- `missing_levels_1-5000.txt` was checked against the actual level directories on 2026-08-02 and matches exactly.
- Both the project copy and `/Users/zhaobingkun/dev/Python/spider/missing_levels_1-5000.txt` contain the same `626` missing levels.
- `4341` remains missing.

Latest daily automation check (2026-08-09): level `2050` was added and published in commit `857bc753`; the project and external missing-level files now both contain `605` entries and match the computed gaps.

After the latest update:
- `playlist-data.js` now includes backfilled levels `1790-1803`
- `home-data.js` now has:
  - `maxLevel: 4570`
  - `missingTo5000: 626`
- homepage and static page inputs still use the stale `4505` snapshot
- homepage tracked-count text is still the stale `4204 levels tracked` snapshot

## Static Pages With Hardcoded Level Limits

These kinds of pages may need manual bumping after sync:
- `index.html`
- `levels.html`
- `404.html`
- `about.html`
- `blog.html`
- `contact.html`
- `privacy.html`
- `terms.html`
- `download.html`
- `level.html`

Reason:
- some contain hardcoded:
  - `max="N"`
  - placeholder text like `1-N`
  - chip links to latest level
  - homepage stats text

## Important Behavior Notes

- `home.js` uses `home-data.js` to drive `maxLevel` behavior on homepage
- `levels.js` derives max level from actual playlist data for list/search behavior
- daily crawler default handles are currently `https://www.youtube.com/@tidan_walktrough`, `@Rikke-games`, `https://www.youtube.com/@Chumliesgames`, and `@cheriegaming`
- some public/static pages can still lag if only playlist data changes and hardcoded HTML is not updated
- when there is a numeric gap, previous level pages may not get a `Next` link if the next literal level is missing

Example:
- after adding up to `4505`, `level/4340/` still has no `Next` because `4341` is missing
- after backfilling `1795-1803`, `level/1803/` jumps to `1923` because `1804-1922` are still missing

## SEO / Site Shape

- This is a large archive site with one URL per level
- Main SEO value comes from:
  - long-tail level pages
  - sitemap freshness
  - keeping homepage/list max level current
  - maintaining consistent level navigation and discovery

## What To Check After Each New Sync

1. `dry-run` returns:
   - `Missing in playlist: 0`
2. `assets/js/home-data.js`:
   - correct `maxLevel`
   - correct `missingTo5000`
3. homepage:
   - tracked count
   - `New: up to level ...`
   - latest chip link
4. levels page:
   - input max
   - latest chip
5. `sitemap.xml`:
   - includes latest URLs
6. external missing file:
   - re-generated correctly

## Practical Handoff Note

- If this project is reopened later, start from:
  - [assets/js/playlist-data.js](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/js/playlist-data.js)
  - [assets/js/home-data.js](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/assets/js/home-data.js)
  - [index.html](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/index.html)
  - [levels.html](/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel/levels.html)
  - current external JSON:
    - `/Users/zhaobingkun/dev/Python/spider/cherie_found_levels_1.json`
    - `/Users/zhaobingkun/dev/Python/spider/cherie_found_levels_2.json`

## Immediate Next-Step Pattern

When a new JSON arrives:
- dry-run first
- sync real changes
- rebuild home data
- bump any static hardcoded max values
- regenerate both missing-level files
