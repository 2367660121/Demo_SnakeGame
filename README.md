# Snake Leaderboard Arcade

A lightweight Snake game built as a static site for GitHub Pages. Players enter a name on the start screen, play a classic Snake run, and compete on a browser-local leaderboard that keeps each player's best score.

## Features

- Classic Snake gameplay on a 16x16 grid
- Start screen with player name entry
- Local leaderboard with persistent best scores per player
- Keyboard controls with mobile-friendly on-screen buttons
- Pause, restart, and player switching
- Zero-dependency test coverage for game rules and leaderboard ranking

## Run locally

```bash
npm run dev
```

Then open [http://localhost:8000/](http://localhost:8000/).

## Run tests

```bash
npm test
```

## Manual verification

- Start screen accepts a player name and enters the game after clicking `Start Game`.
- Arrow keys and `WASD` both steer the snake.
- `Pause`, `Restart`, and `Change Player` behave correctly.
- Hitting a wall or the snake body ends the run.
- Finishing a run updates the leaderboard and highlights the active player.

## Deployment

This project is designed to work as a static GitHub Pages site. The current public URL is:

[https://2367660121.github.io/Demo_SnakeGame/](https://2367660121.github.io/Demo_SnakeGame/)

## Leaderboard scope

The leaderboard is stored in `localStorage`, so rankings are shared only within the same browser on the same device. A global cross-device leaderboard would require a backend or database service.
