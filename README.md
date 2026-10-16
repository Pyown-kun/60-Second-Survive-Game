# Last 60 Seconds — Survival Arena

Browser survival arena built with React, TypeScript, Vite, and Canvas rendering. It includes a selectable cast of 8 original stylized survivors, automatic targeting, waves, pickups, health/XP/coins, upgrades, pause, and end-of-run results.

## Requirements
- Node.js 20+ recommended
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build
```bash
npm run build
npm run preview
```
Deploy the project to Vercel or Netlify as a Vite app. Build command: `npm run build`; output directory: `dist`.

## Controls
- WASD or arrow keys: move
- Mouse: aim (crosshair follows the cursor)
- Left mouse button (hold to fire continuously): shoot
- P: pause/resume
- Survive 60 seconds, then defeat the boss to win; upgrades open on every level up

## Character selection
Choose one of the 8 characters on the main menu. Each has different health, speed, damage, color palette, and a small perk. The selected survivor is the character rendered in the arena.

## Notes
This is a playable prototype. Audio, saved online leaderboard, mobile joystick, and persistent upgrade economy are not included yet. Character sprites are drawn with canvas/CSS shapes so the project works without external image assets.
