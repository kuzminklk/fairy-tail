### Goal

“Yasna” is a cinematic photo story in verse. Seventeen photographs from one summer forest become a single scrollable fairy tale: full-screen photographs stay on a fixed stage while the Russian poem and chapter navigation move in front. The site is a static single-page experience with no build step and no runtime dependencies.

### Stack

Markup languages: HTML, CSS  
Programming languages: JavaScript, Python  
Images: WebP and JPEG renditions, responsive `srcset`, inline pre-blurred LQIP placeholders, graduated preview/high-resolution loading, original-resolution WebP  
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
Keep actual `srcset` widths, `sizes` calculations, `assets/photos/manifest.json`, and the inline `--lqip` data URIs in sync when changing the image pipeline.  
Keep the stage box viewport-sized and give its photograph layers a stable `100lvh` height; derive image `sizes` from the large viewport, not `window.innerHeight`, so mobile browser chrome cannot resize or re-select the picture.  
Give every stage layer an inline pre-blurred placeholder (generated from `assets/photos/lqip/`): it must paint before any network image so fast scans never show black. Warm the cover and prologue previews at boot, then load other 900px previews only after scrolling settles, keep them once loaded, and load the high-resolution tier for the active chapter after a further pause; release only high-resolution layers.  
Keep fast scrolling readable: the fast-scroll mode reveals copy immediately; keep the original slow stage cross-fade and image fades rather than shortening them.  
Keep the stage static; avoid full-screen transform animations that can break mobile clipping and repaint performance.  
Preserve accessibility: skip link, focus states, native dialogs, reduced-motion support, and no-JavaScript readability.  
Document behavior changes in `docs/specs` and architectural choices in `docs/decisions`.

### Documentation

- `docs/specs` — feature specifications and acceptance criteria.
- `docs/decisions` — architecture decision records.
