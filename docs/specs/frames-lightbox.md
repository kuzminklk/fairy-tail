# Frames and lightbox

## Problem

The story uses eleven photographs, but the collection has seventeen. Visitors
should see all of them without turning the page into a conventional grid
gallery. The photographs also need full-size viewing that works with keyboards,
pointers, and touch.

## Goal / non-goals

- Goal: add a compact coda filmstrip of all seventeen frames and an accessible
  full-size lightbox.
- Not in scope: zoom or pan, slideshow autoplay, downloads, editable captions,
  or a separate gallery page.

## Behavior

- A horizontal filmstrip after the epilogue shows all seventeen frames with
  their original numbers.
- The strip scrolls with pointer, touch, or previous/next buttons.
- Selecting a frame opens a native dialog with the high-resolution photograph,
  a caption, a counter, previous/next buttons, and a close button.
- Arrow keys move between photographs; Escape closes the dialog; horizontal
  swipe moves between photographs on touch screens. The dialog contains focus
  and returns it to the frame that opened it.
- The filmstrip is built only when the reader approaches the coda.

## Design notes

- Photo metadata lives in the `photos` array in `script.js`.
- `buildFrames()` is called from an `IntersectionObserver` with a 900px margin
  before the coda.
- `openLightbox()`, `renderLightbox()`, and `stepLightbox()` manage the dialog;
  the lightbox `<img>` and `<source>` receive high-resolution candidates and a
  `sizes` hint.
- The dialog reuses the shared body scroll-lock class; the lightbox respects
  reduced motion through the global animation rules.
- The dialog is a native `<dialog>`; the rationale is in
  [0005. Native dialogs](../decisions/0005-native-dialogs.md).

## Acceptance criteria

- Seventeen frames render with numbers 01–17 and correct accessible names.
- The filmstrip scrolls and previous/next buttons move it by most of a viewport.
- The lightbox opens, changes photographs with arrows and swipe, and closes
  with Escape or the close button.
- The active photo is requested at a resolution appropriate to the viewport and
  DPR; there are no 404s.
- Without JavaScript the coda section is present but the filmstrip is empty;
  the rest of the story is unaffected.
