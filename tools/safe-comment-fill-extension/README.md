# Safe Comment Filler (Chrome Extension, Manual Submit)

This extension imports rows from an Excel-exported CSV file and fills comment form fields:

- `comment`
- `name`
- `email`
- `website`

It is designed for approved/authorized sites and **does not auto-submit forms**.

## 1) Load extension

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this folder: `tools/safe-comment-fill-extension`

## 2) Prepare CSV from Excel

In Excel, save as `CSV UTF-8`.

Required column:

- `url`

Optional columns (default values are used when missing):

- `comment`
- `name`
- `email`
- `website`

See `sample-comments.csv` for format.

## 3) Use

1. Open extension popup
2. Import CSV
3. Confirm/edit approved domains
4. Choose one:
   - `Fill Current Page`: fill current page only
   - `Start Batch`: opens first row URL and fills fields when page loads
5. Review form manually and submit yourself
6. Click `Next Row` for next URL

## Notes

- The extension only fills fields; it never clicks submit.
- Some sites sanitize HTML in `name`/`comment`; in those cases `<a href=...>` may be stored as plain text.
