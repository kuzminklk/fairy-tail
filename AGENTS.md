### Goal

“Yasna” is a cinematic photo story in verse. Seventeen photographs from one summer forest become a single scrollable fairy tale: full-screen photographs stay on a fixed stage while the Russian poem and chapter navigation move in front. The site is a static single-page experience with no build step and no runtime dependencies.

### Stack

Markup languages: HTML, CSS  
Programming languages: JavaScript, Python  
Images: WebP and JPEG renditions, responsive `srcset`, LQIP, original-resolution WebP  
Typography: Cormorant Garamond, Manrope (local WOFF2 subsets)  
Design: Full-screen photography, Fixed stage, Scroll-driven chapters, Dark theme  
Accessibility: Semantic HTML, ARIA, Native `<dialog>`, Reduced motion, No-JavaScript fallback  
Formatting: “.editorconfig”, “.vscode/…”, Prettier, Ruff  
Version Control: Git, GitHub

### Commands

Run a local server: `python3 -m http.server 8000`  
Verify image renditions: `python3 scripts/optimize-images.py --verify-only`  
Regenerate image renditions: `python3 scripts/optimize-images.py --force`  
Format code with Prettier: `prettier -w ./`

### Conventions

Keep the site static: no framework, bundler, package manager, or build step.  
Keep story content, interface copy, and alternative text in Russian; keep code, comments, README, AGENTS and documentation in English.  
Do not edit files in `photos/`; generate web renditions through `scripts/optimize-images.py`.  
Keep the poem in `index.html` and `poem.txt` in sync.  
Keep actual `srcset` widths, `sizes` calculations, and `assets/photos/manifest.json` in sync when changing the image pipeline.  
Keep the fixed stage sized with `100lvh` and derive image `sizes` from its box, not `window.innerHeight`; mobile browser chrome must not resize or re-select the photograph.  
Keep the Ken Burns drift on the stage, not on individual layers, so cross-fading photographs share one scale.  
Preserve accessibility: skip link, focus states, native dialogs, reduced-motion support, and no-JavaScript readability.  
Document behavior changes in `docs/specs` and architectural choices in `docs/decisions`.

### Documentation

- `docs/specs` — feature specifications and acceptance criteria.
- `docs/decisions` — architecture decision records.
