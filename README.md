# Bluff Revolver Party

A premium-style browser multiplayer bluff card game with cinematic revolver punishment and real-time Socket.io rooms.

## Tech Stack

- Frontend: React + Vite + Tailwind + Phaser + Framer Motion
- Backend: Node.js + Express + Socket.io
- State: In-memory room/game state (no database)

## Project Structure

```text
bluff-revolver-party/
  client/
    public/assets/
      cards/
      characters/
      weapons/
      audio/
      effects/
      backgrounds/
    src/
      components/
      pages/
      game/
      hooks/
      socket/
      App.jsx
      main.jsx
      index.css
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
  server/
    gameLogic/
      engine.js
    socket/
      handlers.js
    server.js
    package.json
  README.md
```

## Key Files

- `server/gameLogic/engine.js`: room lifecycle, deck logic, bluff check, revolver chamber logic, elimination and win detection.
- `server/socket/handlers.js`: all Socket.io events and state broadcasts.
- `server/server.js`: Express + Socket.io bootstrapping.
- `client/src/App.jsx`: game flow controller (home/lobby/game).
- `client/src/pages/GameRoomPage.jsx`: Phaser scene integration + overlays/HUD.
- `client/src/game/PhaserTableScene.js`: high-end 2D table scene, seat glow, card and cinematic camera effects.
- `client/src/hooks/useGameSocket.js`: client event subscriptions and event-state bridge.

## Socket Events Implemented

- `createRoom`
- `joinRoom`
- `leaveRoom`
- `selectCharacter`
- `playerReady`
- `startGame`
- `dealCards`
- `playerTurn`
- `playCard`
- `challengePlayer`
- `revealCard`
- `startRevolver`
- `revolverResult`
- `playerEliminated`
- `nextTurn`
- `gameEnd`
- `disconnect`

## Gameplay Summary

1. Host creates private room; players join by code (2-6 players).
2. Players select character and mark ready.
3. Host starts game; each player gets 10 cards.
4. Active player plays a face-down card and claims target rank.
5. Others challenge or accept.
6. Challenge triggers reveal + revolver punishment:
   - If liar: liar punished.
   - If truthful: challenger punished.
7. Revolver has 6 chambers and 1 bullet.
8. `BANG` eliminates punished player; `CLICK` survives.
9. Last alive player wins.

## Asset Replacement Notes

Use these folders for premium final art/audio:

- Cards: `client/public/assets/cards/`
- Characters: `client/public/assets/characters/`
- Revolver/Gun: `client/public/assets/weapons/`
- Sounds/music: `client/public/assets/audio/`
- Particles/muzzle flash: `client/public/assets/effects/`
- Environments: `client/public/assets/backgrounds/`

You can swap procedural Phaser-generated visuals with sprite sheets and atlases for full AAA polish.

## Run

### 1) Install backend deps

```bash
cd server
npm install
```

### 2) Install frontend deps

```bash
cd ../client
npm install
```

### 3) Start backend

```bash
cd ../server
npm run dev
```

### 4) Start frontend

```bash
cd ../client
npm run dev
```

### 5) Multiplayer local test

1. Open frontend URL in multiple tabs.
2. Tab A: create room.
3. Tabs B/C: join using code.
4. Ready up and start game.
5. Play, challenge, trigger revolver, and verify elimination/win.

## Common Errors

- Room not found: join using exact uppercase code.
- Start blocked: all non-host players must be ready.
- CORS issues on deployment: set explicit allowed origin in `server/server.js`.
- Phaser not rendering: ensure browser hardware acceleration is enabled.
- Port collision:
  - server default `4000`
  - Vite default `5173`

## Future Upgrades

- Rejoin tokens for disconnect recovery.
- Rich card claim variants (multi-card plays).
- Better anti-cheat validation with signed actions.
- Premium audio mixer + spatial feel.
- Sprite-sheet character reactions and lip-sync stingers.
- Match history and ranked mode with persistent storage.
