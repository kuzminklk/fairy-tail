# Visual language

## Problem

A photograph-led tale needs a consistent cinematic atmosphere and readable
poetry over changing images, on screens from small phones to wide monitors.

## Goal / non-goals

- Goal: define the palette, type, spacing, layout, and motion that make the
  story feel like one piece and remain legible over photographs.
- Not in scope: a component library, light theme, user-selectable typography,
  or a design-token export format.

## Behavior

- Palette: near-black forest background `#060a07`, paper cream `#f4efe3`,
  muted gold `#d9c091`, moss `#a9b894`.
- Type: Cormorant Garamond for the poem, chapter titles, and display headings;
  Manrope for uppercase labels, counters, captions, and controls. Both have
  local Cyrillic and Latin WOFF2 subsets.
- Cover: a large serif title, small uppercase eyebrow and subtitle, short
  introduction, pill-shaped start link, metadata row, and vertical scroll hint.
- Chapter layout: a left column up to 640px for the poem; the photograph stays
  visible on the right. A gradient scrim and text shadow keep the verse
  readable without hiding the image.
- Responsive breakpoints: 1120px, 860px, 640px, and 380px; a dedicated short
  landscape rule keeps chapter content below the fixed header.
- Motion: chapter content reveals with staggered fades, the stage drifts
  slowly, and photographs cross-fade between chapters. The drift belongs to
  the stage rather than to individual layers, so both photographs in a
  cross-fade share one scale and the background cannot jump or shrink.
- Reduced motion: animation and smooth scrolling are suppressed; reveal
  content is shown immediately.
- Accessibility: skip link, semantic headings, visible focus outlines, native
  dialogs, and screen-reader photo descriptions. Every control has a target of
  at least 24px; primary controls are 44px or larger.

## Design notes

- Tokens live in `:root` in `style.css`.
- Fonts are loaded with `@font-face` and `unicode-range`; key faces are
  preloaded in `index.html`.
- The veil, grain, and LQIP layers are `aria-hidden`.
- The verse column uses Cormorant Garamond at `clamp()` sizes; UI labels use
  letter-spaced Manrope.
- The accessibility audit is run through axe; the current page has no WCAG
  A/AA violations.
- Motion and reveal decisions are recorded in
  [0003. Poem as static HTML](../decisions/0003-poem-as-static-html.md) and
  [0002. Fixed photo stage](../decisions/0002-fixed-photo-stage.md).

## Acceptance criteria

- Every chapter's verse is readable over its photograph at 320px and 1440px.
- Short landscape viewports do not place chapter titles under the fixed header.
- Reduced motion removes reveals, drift, and smooth scrolling.
- Focus is visible on all links, buttons, dots, and dialog controls.
- The no-JavaScript and reduced-motion states remain fully legible.
