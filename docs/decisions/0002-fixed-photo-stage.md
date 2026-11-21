# 0002. Fixed photo stage

## Context

Each chapter needs a full-screen photograph behind a poem. The page scrolls
linearly through ten story sections, and the photograph should change when the
reader enters a new chapter. Per-section backgrounds are possible, but
`background-attachment: fixed` is unreliable on mobile, and an `<img>` per
section would make cross-fades and lazy loading harder to coordinate.

## Decision

Use one fixed `.stage` element behind the story, containing one layer per
section. `script.js` selects the active section at a 42% focus line, loads the
matching photograph into that layer, and cross-fades opacity between layers.
Only the active layer and its immediate neighbours are requested. Each layer
paints a 24px LQIP from inline CSS before the sharp image loads.

## Alternatives

- One `<img>` per section with sticky positioning — more DOM and harder
  cross-fades, with mobile viewport quirks.
- `background-attachment: fixed` — simple CSS, but poorly supported on mobile
  and impossible to art-direct per image.
- Scroll-driven animation libraries — additional dependencies for a small
  effect.

## Consequences

- One photograph is visible at a time; the coda hides the stage entirely.
- Images are requested progressively; slow connections see the LQIP.
- The active section depends on JavaScript; without it the LQIP cover remains.
- The slow drift animation pauses with its layer instead of resetting, so an
  outgoing photograph never snaps back to 100% during a cross-fade.
- Active-layer selection and photo descriptions must stay synchronized with
  the section markup.

The resulting behavior is described in [Photo story](../specs/photo-story.md).
