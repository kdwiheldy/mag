---
name: poster-deck-generator
description: >-
  Generate 4K 16:9 (3840x2160) marketing, architecture, data-science, and product showcase
  posters/slides in HTML + CSS matching the user's exact Portfolio Figma design system.
  Use whenever the user asks to create, edit, or automate slides, posters, or decks.
---

# Poster Deck Generator (HTML + CSS 4K 16:9 Design System)

Use this skill whenever the user asks to create, modify, or automate presentation slides, engineering/architecture posters, data-science PoC summaries, or marketing showcase boards.

---

## 1. File Locations & Cross-Project Setup

All shared assets, templates, and reference examples live inside the `Posters/` directory of this skill repository:

- **Single-Source-of-Truth Stylesheet:** `Posters/styles/poster-system.css`
  - Contains all CSS custom properties (`:root`), flexible multi-column grid classes, card levels, typography rules, custom bullets, `32px` bordered chips, KPI cards, architecture diagram primitives, SVG chart containers, JSON contract blocks, and `10px` bordered media frames.
  - **Rule:** If the user asks to change a global styling rule, update `Posters/styles/poster-system.css` so all slides stay synchronized.
- **Icon Registry (SF Symbols Aliases + Lucide SVGs):** `Posters/scripts/poster-icons.js`
  - Include `<script src="scripts/poster-icons.js"></script>` before `poster-preview.js` so any `<span class="card-icon" data-icon="..."></span>` is hydrated into a crisp `36×36px` SVG.
  - Supports SF Symbol names (`doc.text`, `sparkles`, `checklist`, `bolt`, `square.stack.3d.up`, `chart.xyaxis.line`, `slider.horizontal.3`, `exclamationmark.triangle`, `checkmark.shield`, `checkmark.circle`, `square.grid.2x2`, `magnifyingglass`, `cpu`, `server.rack`, `arrow.up.right`, `scope`, `iphone`, `clock`, `book`, `lock`) as well as Lucide kebab-case names.
- **Preview Scaler, Subtle Spacing Equalizer & Rule Validator:** `Posters/scripts/poster-preview.js`
  - Scales slides to fit any browser window, distributes small residual vertical pixel differences (`±1px` to `±6px`) on 4K posters, runs `window.validatePosterRules()` on load, and provides **Download PNG**, **Download PDF**, and **Hide/Menu** toolbar controls.
- **Device-Frame Mockup Renderer (Portfolio Framer Runtime):** `Posters/scripts/compose-device.mjs` + `Posters/framer/`
  - Renders crisp hardware-framed multi-device mockups (`dual-iphone`, `hero-iphone-portrait`, `iphone-masonry`, `mix-masonry-1`, `hero-ipad-landscape`, `hero-landscape`, etc.) from raw app screenshots into PNGs for `.media-frame`.
  - First-time runtime install (if `Posters/framer/node_modules` is missing): `cd Posters/framer && npm install --omit=dev`
  - List available layouts: `node Posters/scripts/compose-device.mjs --list`
  - Render a spec to PNG: `node Posters/scripts/compose-device.mjs --spec spec.json --out Posters/assets/framed.png`
  - *(Also works directly as an MCP server at `Posters/framer/mcp.mjs` with `FRAMER_DIST=Posters/framer/dist`.)*
- **Unified Preview Server & Batch PNG Exporter:** `Posters/scripts/serve.mjs` & `Posters/scripts/export-png.mjs`
  - Start unified preview server (enables 1-click **Download PNG** in browser): `node Posters/scripts/serve.mjs`
  - Or batch export slides directly from CLI: `node Posters/scripts/export-png.mjs Posters/<file>.html`
- **Blank Starter Templates:**
  - `Posters/template-starter.html` — Standard 4K `16:9` (`3840×2160`) poster template.
  - `Posters/template-social-portrait.html` — Instagram &amp; LinkedIn `4:5` portrait carousel template (`2160×2700`, 4 layout options, `.poster-canvas--social-portrait`, `.poster-body--social-1` / `.poster-body--social-2`).
  - `Posters/template-social-square.html` — Instagram &amp; LinkedIn `1:1` square post template (`2160×2160`, 2 layout options, `.poster-canvas--social-square`, `.poster-body--social-2`).
- **Reference Examples (`Posters/examples/`):**
  - `00-component-catalog.html` — Master visual catalog of all 8 component families + quick navigation bar.
  - `01-system-overview-and-architecture.html` — Archetype A (`951 | 1349 | 1348`): Modeled on Slide 61.
  - `02-ml-data-science-and-charts.html` — Archetype A (`951 | 1349 | 1348`): Modeled on Slide 60.
  - `03-pipeline-and-json-contracts.html` — Alternate Theme (`data-theme="pezen"`, `#FFA84C` + `Poppins`): Modeled on Slide 66.
  - `04-wide-span-and-media-frames.html` — Archetype B (`951 | 2745` with `1348.5 × 2` bottom split): Modeled on Slide 63.
  - `05-device-showcase-and-evaluation.html` — Archetype C (`1062 | 2634` with `1309 + 1277` bottom split): Modeled on Slide 67.
  - `06-flexible-4-column-marketing-matrix.html` — Archetype D (`756 | 948 | 948 | 948`): Demonstrates the Flexible Multi-Column Rule across 4 columns.

---

## 2. Non-Negotiable Master Grid & Spacing Math (4K 16:9)

Every slide (`<section class="poster-canvas">`) MUST obey these exact dimensions:

| Element | CSS Class | Exact Dimensions | Mathematical Rule |
| :--- | :--- | :--- | :--- |
| **Slide Canvas** | `.poster-canvas` | `3840px × 2160px` | `padding: 48px`, `gap: 48px`, `background: #FFFFFF` |
| **Usable Area** | — | `3744px × 2064px` | `x: 48..3792`, `y: 48..2112` |
| **Top Header Bar** | `.poster-header` | `3744px × 80px` | Placed at `y: 48..128`; `justify-content: space-between` |
| **Header-to-Body Gap** | — | `48px` | Body always starts at `y = 176px` |
| **Body Grid** | `.poster-body` | `3744px × 1936px` | Spans `y: 176..2112` (`2064 - 80 - 48 = 1936px`) |
| **Major Grid Gap** | — | `48px` | Horizontal gap between columns AND vertical gap between top-level cards |

### Flexible Multi-Column, Content-Fit & Subtle Spacing Rules
1. **Horizontal Width Sum:** Any number of columns ($N \ge 1$) or custom column widths may be used as long as:
   $$\sum_{i=1}^{N} W_{\text{col}, i} + (N - 1) \times 48\text{px} = 3744\text{px}$$
2. **Zero Empty Card Space + Subtle "Eye-Balled" Vertical Flushness (`1936px`):**
   - Every `.poster-col` must start at `y = 176px` and end flush at `y = 2112px` (`1936px` tall).
   - **NEVER leave empty blank space at the bottom of a `.card`, `.subcard`, `.json-contract-card`, or `.json-code-box`**, and **NEVER use `justify-content: space-between` or `style="flex: 1;"` on `.json-code-box` / `.subcard` to stretch short content over a tall box.**
   - Instead, **write or expand complete sentences, bullet items, subcards, or JSON fields** so the natural unstretched height of every card fits its allocated height within a few pixels (`< 28px` slack; `1 line of 32px prose ≈ 45px`).
   - In a 2-column `.inner-grid-2` of subcards, **paired subcards in the same row must have the same number of header and prose lines** so neither card has empty bottom space.
   - Once the content naturally fills the column, `applySubtleSpacing()` in `poster-preview.js` nudges card/bullet gaps by only a few pixels (`±1px` to `±8px`, e.g., `18px -> 15.5px` or `20.5px`) so every column lands flush at `1936px` with zero perceptible inconsistency and zero empty bottom space.

---

## 3. Strict Header, Card, Icon, & Chip Rules

1. **Top Header Bar (`.poster-header`) — Dual Title + Subtitle Required on BOTH Sides:**
   - **Left Side (`.poster-brand`):** `80×80px` `.poster-brand-logo` + `24px` gap + `.poster-brand-text` containing BOTH `.poster-brand-title` (`32px SemiBold #242529`) and `.poster-brand-subtitle` (`24px Regular #606363`, `6px` gap).
   - **Right Side (`.poster-header-meta`):** Right-aligned stack containing BOTH `.poster-meta-title` (`32px SemiBold #242529` with `<span class="accent">` in `var(--primary)`) and `.poster-meta-subtitle` (`24px Regular #606363`, `6px` gap).
2. **Level 1 Card Header (`.card > .card-header`) — Always `36×36` Icon + Title, NO Small Subtitle:**
   - Every Level 1 `.card` MUST begin with `<div class="card-header"><span class="card-icon"><!-- 36x36 SVG --></span><h2 class="card-title">Title</h2></div>` (`gap: 18px`).
   - **Never place a small `24px` subtitle below a Level 1 `.card`'s title.** Below `.card-header`, go directly into `32px` `.prose`, a `.subcard`, or an `.arch-canvas`.
   - Subtitles (`24px #606363`, `.subcard-subtitle`) are ONLY used inside Level 2 inner `.subcard` headers (`.subcard-header`) or `.stat-card`s.
3. **Colored Cards (`.card--primary` & `.card--warning`) — Always Use an Inner White `.subcard`:**
   - Both `.card--primary` (`#F36E25` / `#FFA84C`) and `.card--warning` (`#FBC966`) use a dark `#242529` `.card-icon` + `.card-title` header, `gap: 24px`, and **ALWAYS wrap their body inside an inner white card (`<div class="subcard"><p class="prose">...</p></div>`)** (`#FFFFFF`, `rounded: 36px`, `p: 24px`). Never place raw text directly on a colored card background without an inner white `.subcard`.
4. **Chips / Pill Badges (`.badge`) — `32px` Geist Mono SemiBold with `2px` Border:**
   - Standard chips (`.badge`) are `height: 42px`, `padding: 0 18px`, `border-radius: 21px`, `border: 2px solid`, `background: 10% tint`, and **`font-size: 32px` `Geist Mono SemiBold`**.
   - Only micro connector tags inside architecture diagrams use `.diagram-chip` (`20px` `Geist Mono SemiBold`).
5. **JSON Contract Blocks (`.json-contract-card` + `.json-code-box`):**
   - Outer container: `.json-contract-card` (`#F0F0F0`, `2px solid #EAEAEA`, `rounded: 36px`, `p: 24px`).
   - Inner code box: `.json-code-box` (`#FFFFFF`, `1.5px dashed #242529`, `rounded: 36px`, `p: 24px`, `24px Geist Mono SemiBold`, keys in `.json-key` `#6BC785`, types in `.json-type` `#FF584D`).
6. **Flexible Fonts & Brand Colors (Not Fixed):**
   - `Inter` and `Geist Mono` are only the defaults. Any slide or project can load its own fonts (via Google Fonts `<link>` or `@font-face`) and override `--font-sans`, `--font-display` (for headlines/card titles), `--font-mono`, and `--primary` / `--primary-tint` on `.poster-canvas`.

---

## 4. Social Media Marketing Rules (Instagram & LinkedIn)

When generating social media posts or carousels (instead of dense 4K `16:9` engineering posters), use the social canvas modifiers in `Posters/styles/poster-system.css`:

1. **Canvas Formats & Column Presets (2× High-Res):**
   - **4:5 Portrait Carousel (`2160×2700`):** `.poster-canvas--social-portrait` (`--header-height: 140px`, `--body-height: 2416px`).
   - **1:1 Square Feed Post (`2160×2160`):** `.poster-canvas--social-square` (`--header-height: 140px`, `--body-height: 1876px`).
   - **Body Grids (`2064px` usable width):** `.poster-body--social-1` (`2064px`), `.poster-body--social-2` (`1008 | 48 | 1008`), `.poster-body--social-asymmetric` (`840 | 48 | 1176`).
2. **Mobile-First Typography Floor (`40px` Minimum):**
   - Social canvases automatically scale up via CSS variables: `40px` subtitles/annotations/KPI labels, `42px` chips (`68px` height), `48px` body prose, `54px` titles, `112px` `.hero-headline` & `.stat-value`, and `140×140px` `.poster-brand-logo` (always slightly taller than the stacked title + subtitle).
   - Never drop below `40px` on a `2160px` social canvas.
3. **Flat Card Hierarchy (No Multi-Level Neutral Cards):**
   - On social canvases, **do NOT nest `.subcard`s inside neutral grey `.card`s**—use flat Level 1 `.card`s or side-by-side `.poster-subgrid` tiles instead.
   - Colored cards (`.card--primary`, `.card--warning`) still **always** wrap their body in an inner white `.subcard`.
4. **Full-Bleed Media Over Stretched Whitespace:**
   - Keep text cards tight (`< 3` short bullets or a punchy headline) and never stretch a text card or `.stat-card` over empty vertical space.
   - Fill remaining vertical space with `.media-frame--fill` containing full-bleed `<img>` photography (`object-fit: cover`) and floating `.media-annotation` callouts.

---

## 5. Headless Chrome Verification Command

After creating or editing any slide, verify layout math, icon hydration, zero empty slack, and zero overflows at native resolution:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --window-size=3840,3000 \
  --virtual-time-budget=1000 --dump-dom \
  "file://$(pwd)/Posters/<file>.html" \
  | grep -o 'data-validation-result="[^"]*"'
```

---

## 6. Using This System From Another Project (Remote / Hosted Setup)

If an agent is working inside a **different repository** and reads this `SKILL.md` (locally or from a hosted GitHub URL):
1. **Locate or Clone Assets:** If `Posters/styles/poster-system.css` is not present in the current workspace, either clone this repository locally or reference its hosted CDN/Pages URLs for `Posters/styles/poster-system.css`, `Posters/scripts/poster-icons.js`, and `Posters/scripts/poster-preview.js`.
2. **Preserve Exact Asset Links:** Ensure every generated `.html` file loads `poster-system.css`, `poster-icons.js`, and `poster-preview.js` (in that order for scripts).
3. **Validate Before Returning:** Run the headless Chrome command above (or open in a headless browser) and fix any reported rule/slack/overflow issues until `valid=true`.
