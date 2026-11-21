# 0003. Poem as static HTML

## Context

The fairy tale is the primary content. It must be selectable, searchable, and
readable by assistive technology and by visitors with JavaScript disabled. At
the same time, stanzas should reveal as the reader enters a chapter.

## Decision

Keep the full poem in `index.html` as ordinary headings, paragraphs, and lines.
Use JavaScript only for presentation: the `html.js` class gates reveal
animations, `IntersectionObserver` adds `.is-revealed`, and the missing class
leaves the text visible. Keep a plain-text copy in `poem.txt` for editing and
review, and keep both copies in sync.

## Alternatives

- Render the poem from a JSON array — easier to reuse, but hides content from
  no-JS visitors and adds a second source of truth.
- A Markdown or template build — unnecessary for one page.
- Canvas or image-based typography — inaccessible and unsearchable.

## Consequences

- The poem is readable without JavaScript and by search engines.
- Editing a line requires updating `index.html` and `poem.txt`.
- No content-management system; the poem lives with its markup.

The resulting behavior is described in [Photo story](../specs/photo-story.md)
and [Visual language](../specs/visual-language.md).
