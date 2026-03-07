# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Devolution Idle Game — a turn-based monster collection game where instead of attacking wild monsters, the player **tames** them through calming/bonding actions, and monsters **devolve** (regress to simpler, cuter forms) instead of evolving.

Genre: Devolution-based idle collection roguelite with turn-based taming combat.

## Tech Stack

- **Plain HTML + vanilla JS** (no bundler, no TypeScript)
- **Pixi.js v8** via CDN (`<script>` tag in index.html)
- **localStorage** for save data persistence
- **GitHub Pages** for static hosting — open `index.html` directly or serve with any static server

## Development

```bash
# Local development — any static file server works, e.g.:
npm run dev
# Then open http://localhost:8080

# No build step required. Deploy by pushing to GitHub Pages.
```

## Project Structure

```
src/
  index.html        — Entry point, loads Pixi.js CDN + main.js
  main.js           — Game bootstrap (Pixi app init)
  storage.js        — localStorage save/load/clear utility
  asset/            — Sprites, audio, and other static assets
sandbox/            — Dynamic test/prototype space
thumbs/             — Hub homepage thumbnail images
docs/devlog/        — Development logs (Korean)
```

## Key Game Design Concepts

- **Combat goal**: Raise the enemy's Taming gauge while managing their Escape gauge, then trigger Human Bonding at the right timing — NOT reducing HP to zero
- **Sensory axes** (MVP: 4 types): sound, temperature, smell, behavior/distance
- **Devolution**: Monsters gain XP from combat, enter egg state at threshold, then return in a simpler/cuter form after a wait period
- **Team rotation**: Core idle mechanic — monsters leave for devolution, forcing roster management
- **MVP scope**: 3 ally monsters, 3 actions each, 8-10 enemy types, 4 sensory axes, 2-3 human bonding actions, single devolution per monster

## Language

- All game design documentation is written in **Korean**
- Use `/devlog` skill to write development logs (also in Korean, stored in `docs/devlog/`)
