## About

### Description

“Yasna” project's website — a cinematic photo story and a fairy tale in verse. Seventeen photographs from a summer forest become ten chapters of a single scrollable tale: full-screen photographs stay on a fixed stage while the poem and chapter navigation move in front.

### Technologies

Development: Visual Studio Code, Artificial intelligence assistance  
Markup languages: HTML, CSS  
Programming languages: JavaScript, Python  
Design: Full-screen photography, Fixed stage, Cinematic typography, Dark theme  
Typography: Cormorant Garamond, Manrope  
Images: WebP and JPEG, Responsive `srcset`, Inline pre-blurred LQIP placeholders, Graduated preview and high-resolution loading, Original-resolution renditions  
Accessibility: Semantic HTML, ARIA, Keyboard navigation, Reduced motion, No-JavaScript fallback  
Formatting: “.editorconfig”, “.vscode/…”, Prettier, Ruff  
Version Control: Git, GitHub

### Documentation

- [AGENTS.md](AGENTS.md) — project guide for artificial-intelligence agents
- [docs/specs](docs/specs) — feature specifications
- [docs/decisions](docs/decisions) — architecture decision records

## State

### Path

Developed using DeepSeek Harness with 4.1 Flash model

1. Developed the fairy tale in Russian verse from the photographs
2. Implemented the full-screen photo stage and chapter navigation
3. Improved the responsive layout, accessibility and no-JavaScript fallback
4. Added high-resolution renditions, inline blurred placeholders for fast scrolling, and a deliberately mixed filmstrip
5. Documented the project, its features and architectural decisions

### To-dos

- Add automated visual regression checks for the stage and navigation

## Usage

### Clone

Clone the codebase via `git clone https://github.com/kuzminklk/fairy-tail`

### Run

1. Start a local server from the project directory by `python3 -m http.server 8000`
2. Visit [http://localhost:8000](http://localhost:8000)

### Images

1. Verify generated renditions by `python3 scripts/optimize-images.py --verify-only`
2. Regenerate all renditions by `python3 scripts/optimize-images.py --force`
