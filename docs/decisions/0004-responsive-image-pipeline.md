# 0004. Responsive image pipeline

## Context

The originals are 3648×5472 JPEGs (about 6.8 MB each), larger than needed for
most screens. A single 1800px rendition was blurred when the portrait image
was scaled to fill a landscape viewport — the file was only 1200px wide. The
site needed sharp images on HiDPI and landscape screens without loading the
originals on every visit.

## Decision

Generate renditions offline with Python and Pillow:

- WebP at 900, 1800, 2400, and 3600px long side, plus full-resolution WebP at
  the original dimensions;
- JPEG at 900, 1800, and 2400px long side as a fallback;
- 24px blurred LQIP placeholders;
- a `manifest.json` with dimensions, bytes, paths, and average color.

Keep `photos/` untouched. In the browser, create a `<picture>` with actual
pixel-width descriptors and choose the rendition through `sizes`. Compute
`sizes` for the cover-cropped stage as `max(100vw, 100vh × image ratio)` and
refresh it after resize or rotation. The lightbox uses the same
high-resolution candidates.

## Alternatives

- Serve originals only — excellent quality, unacceptable initial payload.
- A single 1800px derivative — simple, but produced the landscape blur fixed
  earlier.
- A CDN image service — not available for a static, dependency-free project.
- AVIF — better compression, but one more format to generate and test.

## Consequences

- Assets total about 56 MiB, but each chapter requests one file, and the
  browser picks 2400px or 3600px at 1× and full resolution at 2×, depending on
  the viewport.
- Changing the source photographs requires rerunning
  `scripts/optimize-images.py` and updating the manifest.
- `srcset` widths, `sizes` calculations, and the manifest are coupled and must
  be updated together.

The resulting behavior is described in
[Responsive images](../specs/responsive-images.md).
