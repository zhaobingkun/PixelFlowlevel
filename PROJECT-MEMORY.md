# Project Memory

## Project

- Path: `/Users/zhaobingkun/dev/PixelFlowlevel/pixelflow/PixelFlowlevel`
- Site theme: `Pixel Flow` level walkthrough archive
- Site type: static SEO walkthrough site
- Core content model: one page per level + playlist-backed video metadata

## Current State

- Current covered level page directories: `4195`
- Current maximum level in site data: `4505`
- Current homepage tracked-count text: `4195 levels tracked`
- Homepage `New:` marker currently points to: `4505`
- Current `missingTo5000` in `assets/js/home-data.js`: `805`

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
- covered: `4195`
- missing: `805`
- important current gaps confirmed:
  - `4341` is still missing

## Recent Level Sync History

Recent confirmed state after latest sync:
- JSON added historical backfill pages through `1794`
- Site added:
  - `1790-1794`
- highest site level is still `4505`
- `4341` remains missing

After the latest update:
- `playlist-data.js` now includes backfilled levels `1790-1794`
- `home-data.js` now has:
  - `maxLevel: 4505`
  - `missingTo5000: 805`
- homepage and levels page inputs still use `4505`
- homepage tracked-count text is now `4195 levels tracked`

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
- some public/static pages can still lag if only playlist data changes and hardcoded HTML is not updated
- when there is a numeric gap, previous level pages may not get a `Next` link if the next literal level is missing

Example:
- after adding up to `4505`, `level/4340/` still has no `Next` because `4341` is missing
- after backfilling `1790-1794`, `level/1794/` jumps to `1923` because `1795-1922` are still missing

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
