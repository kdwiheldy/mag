# Marketing & Portfolio Poster Deck Workspace Rules

Whenever creating, updating, or styling presentation slides, posters, or marketing decks in this workspace:

1. **Always read and follow `.agents/skills/poster-deck-generator/SKILL.md` first.**
2. **Use `Posters/styles/poster-system.css` as the single source of truth** for all design tokens, grid math, card hierarchies, typography, and component styles. If the user asks to change a design rule, update `Posters/styles/poster-system.css` and verify that all examples in `Posters/examples/` and `Posters/template-starter.html` remain compliant.
3. **Enforce the 4K Master Grid (`3840px × 2160px`):**
   - Outer margin: `48px` (`3744px × 2064px` usable area).
   - Header bar: `3744px × 80px`, followed by a `48px` vertical gap.
   - Body grid: `3744px × 1936px` (`y = 176px` to `y = 2112px`).
   - **Flexible Multi-Column Rule:** Any number of columns ($N \ge 1$) or column width proportions may be used as long as $\sum W_{\text{col}} + (N - 1) \times 48\text{px} = 3744\text{px}$ and every column fills the exact `1936px` vertical height without overflowing or falling short.

