# Code Generation Plan - Flappy Kiro

## Unit Context
- **Unit**: Flappy Kiro (single unit — complete browser game)
- **Project Type**: Greenfield
- **Technology**: HTML5 Canvas + vanilla JavaScript
- **Workspace Root**: /Users/Pratik.Guthalkar/Downloads/qdev-aidlc
- **Code Location**: Workspace root (index.html, js/, css/)

## Code Structure

```
/Users/Pratik.Guthalkar/Downloads/qdev-aidlc/
+-- index.html          (game entry point)
+-- css/
|   +-- style.css       (minimal styling for full-screen canvas)
+-- js/
|   +-- game.js         (main game loop, state machine, initialization)
|   +-- truck.js        (truck entity, physics, rendering)
|   +-- obstacles.js    (obstacle generation, movement, rendering)
|   +-- audio.js        (audio manager, sound loading/playback)
|   +-- renderer.js     (canvas management, background, HUD, screens)
|   +-- input.js        (keyboard/mouse input handling)
|   +-- constants.js    (all game constants/config values)
+-- assets/
|   +-- game_over.wav   (existing)
|   +-- jump.wav        (existing — used as truck engine sound)
|   +-- ghosty.png      (existing — unused)
```

## Generation Steps

- [x] Step 1: Create project structure and index.html
  - Create index.html with canvas element, script tags for all JS modules
  - Create css/style.css with full-screen canvas styling (no scrollbars, no margin)

- [x] Step 2: Create constants.js — All game configuration values
  - Physics constants (GRAVITY, LIFT, TERMINAL_VELOCITY)
  - Obstacle constants (GAP_SIZE, OBSTACLE_WIDTH, OBSTACLE_SPACING, MIN/MAX_GAP_Y)
  - Difficulty constants (INITIAL_SCROLL_SPEED, MAX_SCROLL_SPEED, DIFFICULTY_INTERVAL, MAX_DIFFICULTY_LEVEL)
  - Rendering constants (GROUND_HEIGHT, TRUCK_WIDTH, TRUCK_HEIGHT)
  - Color palette constants

- [x] Step 3: Create input.js — Input handling module
  - Spacebar keydown listener (with event.repeat filtering)
  - Click/tap listener
  - Export callback registration for game state actions

- [x] Step 4: Create audio.js — Audio management module
  - AudioContext initialization on first user interaction
  - Load and play truck engine sound (jump.wav)
  - Load and play game over sound (game_over.wav)
  - Support overlapping playback for engine sound

- [x] Step 5: Create truck.js — Truck entity module
  - Truck state (position, velocity, angle)
  - Physics update method (gravity, lift, terminal velocity, tilt)
  - Pixel-art truck rendering method (detailed canvas drawing)
  - Reset method for game restart
  - Hitbox getter for collision detection

- [x] Step 6: Create obstacles.js — Obstacle management module
  - Obstacle array management
  - Generation algorithm (random gap position within bounds)
  - Spawn timing logic (based on spacing)
  - Movement/scrolling (per-frame update)
  - Collision check method (AABB)
  - Scoring check method (truck passed barrier)
  - Road barrier/barricade rendering
  - Cleanup off-screen obstacles

- [x] Step 7: Create renderer.js — Canvas and rendering module
  - Canvas setup and resize handling
  - Background rendering (solid sky color)
  - Ground/road strip rendering (scrolling dashed center line)
  - HUD rendering (score with outline/shadow, top-center)
  - Title screen rendering (game title, subtitle, high score)
  - Game Over screen rendering (score, high score, play again prompt)

- [x] Step 8: Create game.js — Main game loop and state machine
  - Game state enum (TITLE, PLAYING, GAME_OVER)
  - State transition logic
  - Main game loop (requestAnimationFrame)
  - Score tracking and high score persistence (localStorage)
  - Difficulty progression logic
  - Integration of all modules (truck, obstacles, renderer, input, audio)
  - Window resize event handling
  - Game initialization

- [x] Step 9: Integration testing and verification
  - Verify all scripts load without errors
  - Verify game loop starts correctly
  - Document manual test cases for Build & Test phase

## Dependencies Between Steps
- Steps 1-2: Independent (project scaffold)
- Steps 3-7: Depend on Step 2 (constants), independent of each other
- Step 8: Depends on all previous steps (integrates everything)
- Step 9: Depends on Step 8

## Audio Note
- The existing `assets/jump.wav` will be used as the truck engine sound
- The existing `assets/game_over.wav` will be used as-is
- No new audio assets need to be created (repurposing existing files)
