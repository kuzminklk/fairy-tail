# Responsive images

## Problem

Full-screen photographs must stay sharp on wide and HiDPI screens without
loading the 6.8 MB originals on every visit. The first implementation capped
renditions at 1800px on the long side and used incorrect `srcset` widths, which
made landscape and Retina displays look soft.

## Goal / non-goals

- Goal: serve enough pixels for the rendered area, choose the smallest adequate
  file, and keep the original photographs untouched.
- Not in scope: AVIF, a CDN image service, client-side resizing, or editing the
  originals.

## Behavior

- Each photograph has WebP versions at 900, 1800, 2400, and 3600px long side,
  plus a full-resolution WebP at the original pixel dimensions.
- JPEG versions at 900, 1800, and 2400px long side are the fallback for
  browsers without WebP.
- The browser chooses the file from actual pixel-width descriptors. WebP is
  used when supported.
- Stage photographs are loaded in three tiers. Every layer carries an inline
  128px pre-blurred placeholder, so even a fresh fast scan paints a photograph
  immediately without network or runtime blur.
- 900px previews are requested only after scrolling has been quiet for about
  120 ms and are kept once loaded. A fast scan can cross all eleven chapters
  without requesting a photograph file.
- The high-resolution rendition is requested about 500 ms after the scroll
  settles, only for the active chapter. When the reader moves on, the previous
  high-resolution layer is released after the cross-fade; previews stay
  available.
- The stage box follows the visible viewport; its photographs are
  `object-fit: cover` and use a stable `100lvh` height, so mobile browser
  chrome hiding or reappearing does not resize the picture. Their `sizes` is
  `max(100vw, largeViewportHeight × image ratio)`, where portrait photographs
  use 2:3 and the single landscape photograph uses 3:2. This accounts for the
  cover crop, which is wider than the viewport on portrait phones.
- `sizes` is recomputed after window resize or device rotation, so a rotated
  phone upgrades to a suitable file.
- Fast scrolling shows only the inline placeholders; once the reader settles,
  the 900px preview and then the high-resolution image fade in over the
  original 1.6 s image transition.
- The cover preload requests the 900px preview on phones and the 2400px rendition
  on wider screens; it never preloads the full cover file.
- The lightbox uses the same high-resolution `srcset` with a display-size hint.
- Preview and high-resolution files are requested only from the idle timers;
  high resolution uses low priority.

## Design notes

- `scripts/optimize-images.py` generates and verifies the files. It accepts
  `--verify-only` and `--force` and reuses fresh outputs by default.
- `assets/photos/manifest.json` records dimensions, byte sizes, paths, and
  average colors.
- `renditionWidths()` in `script.js` maps portrait and landscape slugs to
  actual widths; `webpSrcset()` and `jpgSrcset()` build the high-resolution
  candidates; `stageSizes()` reads a hidden `100lvh` probe and
  `lightboxSizes()` calculates the lightbox hint.
- `loadPreview()`, `loadHigh()`, `schedulePreviews()` and
  `scheduleStageCleanup()` in `script.js` implement the graduated tiers;
  `lastScrollAt` gates both the preview and high-resolution requests, and
  `scheduleStageCleanup()` releases only high-resolution layers.
- The inline `--lqip` data URIs are generated from the 128px files in
  `assets/photos/lqip/`; keep them in sync when the placeholders are regenerated.
- Full-size WebP is not an upscale; it uses the original pixel dimensions.
- The image pipeline is explained in
  [0004. Responsive image pipeline](../decisions/0004-responsive-image-pipeline.md).

## Acceptance criteria

- At 1440×900 and DPR 1 the cover selects the 2400px rendition; at DPR 2 it
  selects the full-resolution file.
- At 1920×1080 and DPR 1 the cover selects the 3600px rendition; at
  2560×1440 and DPR 1 it selects the full-resolution file.
- A 390×844 phone at DPR 3 selects the 3600px rendition; after rotation to
  844×390 the active layer upgrades to the full-resolution file.
- The landscape finale photograph selects 1800px at 1440×900 DPR 1 and 3600px
  at DPR 2.
- `python3 scripts/optimize-images.py --verify-only` reports 153 valid image
  files: 68 legacy renditions, 68 high-resolution renditions, and 17 LQIP.
- Scrolling down and back up on a mobile device does not resize the stage
  photograph or re-select a smaller rendition.
- A fast scroll paints only the inline placeholders and requests no additional
  photograph files; after it stops, the visible chapter loads a 900px preview
  and then exactly one high-resolution image.
- Fast scrolling never leaves an active chapter without a visible inline
  placeholder, and its copy is revealed immediately.
- At most the active high-resolution layer plus previews for visited chapters
  remain in the DOM after cleanup; previews are never released.
- The LQIP files are 128px wide, pre-blurred, and embedded as inline data URIs
  in the stage layers.
- No browser console errors, failed requests, or missing files.
