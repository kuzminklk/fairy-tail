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

Load each stage layer in two tiers:

1. **Preview** — a single 900px file on phones and a 2400px file on wider
   screens, requested immediately for the active chapter and its neighbours.
2. **High resolution** — the existing responsive `srcset` up to the original
   file, requested only after scrolling has been quiet for about 240 ms and
   only for the active chapter.

High-resolution layers are released when the reader moves to another chapter;
previews more than one chapter away are released as well. The LQIP remains
under every tier, so no state is ever blank. The stage stays static: the
earlier full-screen drift animation was removed because it added a composited
transform to a large fixed layer, which cost mobile GPU time and could expose
clipping seams.

## Alternatives

- Keep loading full resolution eagerly — sharp, but causes the reported mobile
  stutter and high memory use.
- Serve only one lower resolution — drops the photographic detail the project
  is built around.
- Load high resolution for the active chapter and neighbours — still decodes
  three large images at every chapter change.
- Use a framework image component or a CDN resizing service — unnecessary for a
  static, dependency-free site and would add a build or network dependency.
- Animate the stage with a transform — visually pleasant, but proved risky for
  mobile compositing and repaint cost.

## Consequences

- Fast scrolling requests only small preview files; sharp detail follows when
  the reader settles on a chapter.
- A chapter may briefly show a softer preview before its high-resolution
  rendition fades in.
- One high-resolution image is decoded at a time; previews are limited to the
  active chapter and its immediate neighbours.
- More state lives in `script.js`, and the high-resolution timer must be kept
  in sync with scrolling.
- The visual language no longer includes a Ken Burns drift; cross-fades carry
  the motion instead.

The resulting behavior is described in
[Responsive images](../specs/responsive-images.md) and
[Visual language](../specs/visual-language.md).
