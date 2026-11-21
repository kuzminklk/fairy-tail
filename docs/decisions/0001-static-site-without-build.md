# 0001. Static site without a build step

## Context

“Yasna” is a single-page art project: a fixed sequence of ten story chapters
and a coda. Content changes when the poem or photographs change, not per
request. There is no application state, authentication, or data fetching. The
site should stay easy to host, review, and hand over.

## Decision

Build the site with static HTML, CSS, and JavaScript only. Do not add a
framework, bundler, package manager, or runtime dependency. Keep the only
Python script in the repository for offline photograph preparation.

Serve the result from any static file server.

## Alternatives

- Next.js — matches the personal website but adds a build step and dependencies
  that this one-page project does not need.
- Vite or Astro — useful for component reuse, but the page is hand-authored and
  small enough to keep readable as plain HTML.
- A generated site — would duplicate content and complicate editing the poem.

## Consequences

- Deployment is a folder upload; local development needs only
  `python3 -m http.server`.
- HTML is edited directly; there is no templating or component system.
- Browser APIs and progressive enhancement replace framework features.
- Documentation must live in the repository because there is no generated API
  reference.

The feature behavior is described in [Photo story](../specs/photo-story.md).
