# Candle Fixes Page Structure Refresh

## Summary
Replace the current image-led Candle Fixes page with a clean, screenshot-aligned troubleshooting layout while keeping the existing `/candle-fixes` route and backend data source. The new page should be structure-only for now: no real images, no designer card, just text plus grey placeholder blocks.

## Key Changes
- Rebuild the Candle Fixes page into a plain white document-style layout:
  - top intro section with `CANDLE FIXES` heading and one muted subtitle line
  - four vertically spaced fix sections, one per API record
  - each fix section uses a two-column desktop layout:
    - left: title, red `Cause:` line, `Fix:` label, bullet list of steps
    - right: three equal grey rounded placeholder blocks in a row
- Remove the current editorial hero treatment from this page:
  - no hero image
  - no `editorial-card`, badge, or cinematic copy
  - no image card on the right
- Keep the page data-driven from `contentApi.getFixes()`:
  - preserve loading and error handling
  - use `title`, `cause`, and `fixSteps`
  - do not render `videoUrl`, `beforeImage`, or `afterImage` yet
- Parse `fixSteps` into bullets:
  - split multiline numbered text into individual list items
  - strip leading numbering like `1.` / `2.` before rendering
- Responsive behavior:
  - `lg+`: text column + 3-placeholder column layout like the screenshot
  - `sm` to `lg`: stack text above a 3-column placeholder row
  - below `sm`: stack text above a 2-column placeholder grid, with the third placeholder spanning full width
- Keep the existing site shell unchanged:
  - same navbar
  - same footer
  - no route or navigation changes needed beyond preserving `/candle-fixes`

## Public Interfaces / Types
- No backend or route contract changes
- Keep `/api/fixes` unchanged and continue consuming `CandleFixResponse`
- Frontend usage should explicitly rely on:
  - `id`
  - `title`
  - `cause`
  - `fixSteps`
- `videoUrl`, `beforeImage`, and `afterImage` remain unused on this page until the later image/content pass

## Test Plan
- Route render:
  - `/candle-fixes` shows the page heading and subtitle
  - one rendered fix section per API item
- Data formatting:
  - causes render with the red `Cause:` treatment
  - `fixSteps` render as bullet items, not raw numbered paragraphs
- Structure checks:
  - each fix section renders exactly three placeholder blocks
  - page contains no content image element for the fix gallery area
- State checks:
  - loading state still renders cleanly
  - API failure still renders the error state without breaking layout
- Manual responsive checks:
  - desktop matches the screenshot’s left-text/right-placeholders rhythm
  - mobile stacks cleanly without overflow or tiny unreadable text

## Assumptions
- This pass is layout-only; real before/after/tutorial images will be added later
- Existing backend fix content stays as the source of truth, even where the screenshot text differs
- No new CTA button is added inside each fix section because the screenshot does not show one
- The current route and content API are already correct, so this is a frontend-only restructure
