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
- The stage is `object-fit: cover`. Its height is the large viewport
  (`100lvh`), so mobile browser chrome hiding or reappearing does not resize
  the photograph. Its `sizes` is `max(100vw, stageHeight × image ratio)`,
  where portrait photographs use 2:3 and the single landscape photograph uses
  3:2. This accounts for the cover crop, which is wider than the viewport on
  portrait phones.
- `sizes` is recomputed after window resize or device rotation, so a rotated
  phone upgrades to a suitable file.
- Only the active chapter and its neighbours are requested. Other layers show
  their LQIP until needed.
- The lightbox uses the same high-resolution `srcset` with a display-size hint.
- The cover WebP is preloaded with matching width descriptors.

## Design notes

- `scripts/optimize-images.py` generates and verifies the files. It accepts
  `--verify-only` and `--force` and reuses fresh outputs by default.
- `assets/photos/manifest.json` records dimensions, byte sizes, paths, and
  average colors.
- `renditionWidths()` in `script.js` maps portrait and landscape slugs to
  actual widths; `webpSrcset()` and `jpgSrcset()` build candidates;
  `stageSizes()` reads the stage box and `lightboxSizes()` calculates the
  lightbox hint.
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
- No browser console errors, failed requests, or missing files.
