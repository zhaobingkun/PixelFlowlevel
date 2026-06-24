# Pixel Flow Memory

## Maintenance Notes

- 2026-06-24: The daily crawler now scans three YouTube handles by default:
  - `https://www.youtube.com/@tidan_walktrough`
  - `@Rikke-games`
  - `https://www.youtube.com/@Chumliesgames`
- The default handle list lives in `/Users/zhaobingkun/dev/Python/spider/pixelflow.py` as `DEFAULT_HANDLES`.
- The human-readable automation document is `/Users/zhaobingkun/dev/Python/spider/pixelflow_daily_task_README.txt`.

## Practical Checks

- Use syntax validation after editing the crawler:
  - `python3 -c "import ast, pathlib; ast.parse(pathlib.Path('/Users/zhaobingkun/dev/Python/spider/pixelflow.py').read_text(encoding='utf-8')); print('syntax ok')"`
- Use dry run when network/API validation is needed:
  - `/Library/Frameworks/Python.framework/Versions/3.13/bin/python3 /Users/zhaobingkun/dev/Python/spider/pixelflow.py --dry-run --skip-site-sync`
- Dry run still calls the YouTube API. It is safe for site files, but depends on network and API quota.

