# Chapter navigation

## Problem

The story is long and photographic; readers need to know where they are and
jump to a chapter without losing orientation.

## Goal / non-goals

- Goal: show the current chapter, allow direct jumps, and indicate reading
  progress.
- Not in scope: URL routing, browser back/forward integration, search, or an
  automatically generated table of contents from the poem.

## Behavior

- The header shows the current chapter numeral and title; the counter reads
  `01 / 10` through `10 / 10`. The cover shows `—` in the counter.
- A vertical rail on the right lists the ten story chapters. The active dot is
  larger and gold; hover or focus reveals the chapter title.
- The “Главы” button opens a full-screen native dialog with all ten chapters.
  Activating a chapter closes the dialog and scrolls to that section.
- A thin progress bar at the top follows the page scroll.
- The rail and chapter label hide in the coda; the header remains available.
- Keyboard: controls are buttons or links with visible focus; Escape closes
  the chapter dialog automatically; the dialog handles its own focus.
- Smooth scrolling switches to instant when reduced motion is preferred.

## Design notes

- `script.js` collects `[data-scene]` sections; the cover is excluded from
  counted story chapters.
- `findActiveSection()` uses the same 42% focus line as the stage.
- Rail buttons and labels are generated from section metadata; the chapter
  list inside the dialog is static HTML.
- The active rail dot exposes `aria-current="step"`; stale values are removed
  when the chapter changes.
- The chapter dialog uses `<dialog>` and `showModal()`; body scrolling is
  locked while it is open.
- At widths below 1120px the header chapter label is hidden; below 860px the
  rail is hidden; below 640px the counter is hidden.

## Acceptance criteria

- Header title and counter update while scrolling in both directions.
- Rail dots and the chapter dialog jump to the correct section.
- The dialog closes on Escape, the close button, or a chapter choice, and
  focus returns to the “Главы” button.
- The active rail dot exposes `aria-current="step"`; no other dot does.
- Keyboard and screen-reader users can open, navigate, and close the dialog.
- Without JavaScript the story remains scrollable; dynamic navigation is
  unavailable.
