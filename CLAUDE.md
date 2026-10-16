# Claude Code Project Instructions

Read `DESAIN.md` before making code changes. `DESAIN.md` is the source of truth for the game’s product intent, visual direction, gameplay rules, character roster, architecture guidance, and acceptance criteria.

## Project rules
- Keep the stack React + TypeScript + Vite.
- Preserve a playable browser game; do not replace it with a static mockup.
- Use Indonesian for player-facing UI.
- Keep character definitions data-driven and preserve all eight selectable characters.
- Do not claim a feature works unless it is implemented and checked.
- Prefer small, testable changes over a wholesale rewrite.
- Avoid adding dependencies unless they materially help.
- Always run `npm run build` after code changes and report any failures.
- Clean up animation frames, event listeners, and other resources.
- Update `DESAIN.md` if a deliberate product/design decision changes.

## First task
Audit the current implementation against the acceptance criteria in `DESAIN.md`. Identify bugs, fix the highest-priority ones, then run the production build. Summarize changed files and checks performed.
