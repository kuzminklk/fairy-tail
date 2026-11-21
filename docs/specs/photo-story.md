# Photo story

## Problem

Seventeen photographs from one summer forest need a narrative form. A grid
gallery would show the frames but lose the story and the sense of walking
through the forest. Visitors need a clear beginning, a readable poem, and an
ending, on one page.

## Goal / non-goals

- Goal: present a Russian fairy tale in verse as ten scrollable chapters, each
  with a full-screen photograph behind the text, followed by a coda with all
  seventeen frames.
- Not in scope: multiple pages, routing, a content-management system, audio,
  comments, or user data.

## Behavior

- The cover introduces “Yasna”, the subtitle, a short description, a start
  link, and project metadata.
- Ten story sections follow: зачин, eight numbered chapters, and the epilogue.
  Each has a chapter label, a title, a poem, and one photograph.
- The photograph mapping is fixed:
  - cover — `13-pines`
  - зачин — `03-canopy`
  - I Берёза — `01-birch`
  - II Тропа — `09-fern-path`
  - III Хоровод — `04-away`
  - IV Оглянулась — `06-turning`
  - V Пень — `12-fallen-log`
  - VI Сосны — `14-pine-path`
  - VII Сон — `15-dream`
  - VIII Пробуждение — `10-walking`
  - эпилог — `16-dream-face`
- Scrolling past the 42% focus line advances the fixed background and updates
  the header, counter, rail, and progress bar.
- Stanzas fade in when a chapter enters the viewport. With reduced motion the
  text is shown without animation.
- Fast scanning shows the pre-blurred stage placeholder; after scrolling stops,
  the chapter's photograph sharpens in place.
- Without JavaScript the whole poem is visible; photographs remain as blurred
  LQIP fields.
- The epilogue leads into the frame filmstrip and footer.

## Design notes

- `index.html` contains one `<section data-scene data-layer>` per chapter;
  `data-photo` refers to a slug in `assets/photos/manifest.json`.
- Each section has a matching `.stage__layer` with `--pos` and inline `--lqip`.
- The active section is the last one whose top crosses the focus line.
- Chapter copy width is capped at 640px; the stage is fixed behind the page.
- The poem is ordinary HTML; see
  [0003. Poem as static HTML](../decisions/0003-poem-as-static-html.md).

## Acceptance criteria

- Cover, ten story sections, coda, and footer render on a static server.
- All eleven stage layers load their photographs with no missing files.
- The poem is readable without JavaScript.
- Chapter order, photograph mapping, captions, and screen-reader descriptions
  match the current poem.
- The page works at 320px, 390px, 768px, 1440px, and 2560px widths, including
  short landscape viewports.
- Scrolling down and back up on a mobile viewport leaves the stage photograph
  at a stable scale.
