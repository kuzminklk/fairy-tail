# 0005. Native dialogs for the chapter index and lightbox

## Context

The site has two modal experiences: the full-screen chapter index and the
photograph lightbox. Both need focus containment, Escape handling, a backdrop,
and focus restoration. Custom modals usually need a focus-trap library and
careful ARIA work.

## Decision

Use the native `<dialog>` element with `showModal()` and `close()`. Let the
browser provide focus containment, Escape, backdrop, and focus restoration. Add
a body scroll-lock class while a dialog is open, handle chapter links by closing
the dialog before scrolling, and add arrow-key and swipe navigation to the
lightbox.

## Alternatives

- Custom `div` dialogs with a focus-trap library — more code and dependencies.
- `<details>` or inline panels — not modal enough for the full-screen index.
- Separate routes — contradicts the single-page decision.

## Consequences

- Dialog behavior follows platform conventions and is accessible by default.
- JavaScript is required for the dialogs; the story remains readable without
  the index and lightbox.
- Dialog markup stays in `index.html`; the lightbox photograph is filled by
  `script.js`.

The resulting behavior is described in
[Chapter navigation](../specs/chapter-navigation.md) and
[Frames and lightbox](../specs/frames-lightbox.md).
