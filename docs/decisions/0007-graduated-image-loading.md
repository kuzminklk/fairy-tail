# 0007. Graduated stage image loading

## Context

The stage can show the photograph at up to the original 3648×5472 resolution.
A single decoded frame of that size occupies roughly 80 MB of memory, and a
2400px rendition still occupies about 35 MB. The first implementation loaded
the active chapter and both neighbours at the browser-selected resolution.
During fast scrolling on a phone this meant several large decodes and network
requests in quick succession, producing the stutter and memory pressure
reported for mobile Chrome.

The photographs do need their high-resolution detail, so permanently lowering
the resolution was not an acceptable fix.

## Decision

Load each stage layer in three tiers:

1. **Inline placeholder** — a 128px-wide, pre-blurred JPEG embedded as a data
   URI in the layer's CSS. It needs no network request or runtime blur filter;
   its tiny decode is immediate, so it is available even on a fresh fast scan.
2. **Preview** — a 900px WebP/JPEG file. The initial cover and prologue are
   warmed at boot; all other previews are requested only after scrolling has
   been quiet for about 120 ms and are kept once loaded. A fast scan can cross
   the remaining chapters without requesting or decoding another file.
3. **High resolution** — the existing responsive `srcset` up to the original
   file, requested about 500 ms after the scroll settles and only for the active
   chapter.

High-resolution layers are released when the reader moves on; previews are not.
The placeholders remain under every tier, so no state is ever black or blank.
The stage stays static and keeps its original 1.4 s cross-fade and 1.6 s image
fades: shortening them during fast scrolling made the photographs feel abrupt,
so only the copy is accelerated. The coda keeps the last photograph behind its
dark veil instead of hiding the stage entirely.

Fast wheel or touch scrolling is detected separately. During a skim, all copy
is revealed immediately (the IntersectionObserver can fall behind); photographs
stay on their inline placeholders until the reader stops, when the 900px preview
and then the high-resolution rendition fade in.

## Alternatives

- Keep loading full resolution eagerly — sharp, but causes the reported mobile
  stutter and high memory use.
- Prewarm every 900px preview — tried, but the browser still failed to paint all
  of them during a very fast scan and users saw black.
- Serve only one lower resolution — drops the photographic detail the project
  is built around.
- Load high resolution for the active chapter and neighbours — still decodes
  three large images at every chapter change.
- Use a framework image component or a CDN resizing service — unnecessary for a
  static, dependency-free site and would add a build or network dependency.
- Animate the stage with a transform — visually pleasant, but proved risky for
  mobile compositing and repaint cost.

## Consequences

- Fast scrolling paints only the inline 128px placeholders and requests no
  photograph files.
- After the reader stops, the active chapter fades from the blurred placeholder
  through a 900px preview to the high-resolution rendition.
- High-resolution layers are limited to the active chapter; the outgoing layer
  is released after its cross-fade. Previews for visited chapters stay
  resident.
- More state lives in `script.js`, and the placeholder/preview/high timers must
  be kept in sync with scrolling.
- Fast-scroll mode permanently reveals the sections it passes; this trades the
  staggered entrance for readable copy. Normal slow scrolling keeps the
  reveal.
- The visual language no longer includes a Ken Burns drift; cross-fades carry
  the motion instead.

The resulting behavior is described in
[Responsive images](../specs/responsive-images.md) and
[Visual language](../specs/visual-language.md).
