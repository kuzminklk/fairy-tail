# 0002. Fixed photo stage

## Context

Each chapter needs a full-screen photograph behind a poem. The page scrolls
linearly through ten story sections, and the photograph should change when the
reader enters a new chapter. Per-section backgrounds are possible, but
`background-attachment: fixed` is unreliable on mobile, and an `<img>` per
section would make cross-fades and lazy loading harder to coordinate.

## Decision

Use one fixed `.stage` element behind the story, containing one layer per
section. The stage box follows the visible viewport, while every photograph is
sized to the large viewport (`100lvh`): mobile browser chrome can hide or
reappear without rescaling the picture, and the extra area is clipped by the
stage. `script.js` selects the active section at a 42% focus line, loads the
matching photograph into that layer, and cross-fades opacity between layers.
Every layer gets a small preview that is prewarmed and kept resident; only the
active layer upgrades to the high-resolution tier after scrolling settles. Each layer paints a 24px
LQIP from inline CSS before the sharp image loads.

## Alternatives

- One `<img>` per section with sticky positioning — more DOM and harder
  cross-fades, with mobile viewport quirks.
- `background-attachment: fixed` — simple CSS, but poorly supported on mobile
  and impossible to art-direct per image.
- Scroll-driven animation libraries — additional dependencies for a small
  effect.

## Consequences

- One photograph is visible at a time. The coda keeps the last photograph
  behind its dark veil instead of blanking the stage, so scanning into and out
  of the coda never flashes black.
- Images are requested progressively; slow connections see the LQIP.
- The active section depends on JavaScript; without it the LQIP cover remains.
- The stage is static. An earlier full-screen drift animation was removed
  because it cost mobile GPU time and could expose clipping seams; all
  cross-fading layers now share the stable stage box.
- Photographs keep the large-viewport height while mobile browser chrome
  changes; the picture does not resize or reveal a strip when scrolling down
  and back up.
- Active-layer selection and photo descriptions must stay synchronized with
  the section markup.

The resulting behavior is described in [Photo story](../specs/photo-story.md).
