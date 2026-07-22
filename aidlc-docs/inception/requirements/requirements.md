# Flappy Kiro - Requirements Document

## Intent Analysis

- **User Request**: Build a Flappy Bird clone called "Flappy Kiro" with truck/road theme
- **Request Type**: New Project
- **Scope Estimate**: Single Component (browser-based game)
- **Complexity Estimate**: Moderate (game loop, physics, collision detection, scoring, audio, responsive canvas)

## Theme Summary

The game was originally described with a ghost theme but after clarification, the user chose a **truck/road theme**:
- **Player Character**: A truck (drawn/rendered on canvas)
- **Obstacles**: Road barriers / construction barricades with gaps
- **Title Screen**: "Press Space to start your truck journey"
- **Sound Effects**: Truck engine sound on spacebar press, game_over.wav on collision
- **Game Name**: Flappy Kiro (retained)

## Functional Requirements

### FR-01: Game Engine
- Built with HTML5 Canvas + vanilla JavaScript (no frameworks)
- Responsive canvas that fills the browser window
- Smooth 60fps game loop using requestAnimationFrame

### FR-02: Player Character (Truck)
- Rendered as a truck graphic on the canvas (drawn or sprite-based)
- Moves persistently to the right (scrolling effect — truck stays centered, world moves left)
- Automatically descends due to gravity
- Ascends when player presses the spacebar
- Smooth movement with acceleration/deceleration physics

### FR-03: Obstacles (Road Barriers/Barricades)
- Vertical pairs of road barriers with equally-sized gaps at random heights
- Gaps are consistent in size but placed at random vertical positions
- Barriers scroll from right to left at consistent speed
- New barriers generated at regular intervals
- Difficulty progression: barriers get closer together and/or gaps get smaller as score increases

### FR-04: Collision Detection
- Detect collision between truck and road barriers
- Detect collision between truck and ground
- End gameplay immediately on any collision

### FR-05: Scoring System
- Award one point for each successful pass through a pair of barriers
- Display current score during gameplay (on-screen HUD)
- Persist high scores using browser localStorage
- Display high score on title screen and game over screen

### FR-06: Title Screen
- Display game title "Flappy Kiro"
- Display "Press Space to start your truck journey"
- Show high score if one exists
- Transition to gameplay on spacebar press

### FR-07: Game Over Screen
- Display "Game Over" text
- Display final score for the current run
- Display high score
- Play game_over.wav sound effect
- Display "Play Again" button/prompt
- Return to gameplay on button click or spacebar press

### FR-08: Audio
- Play truck engine sound on spacebar press (ascend action)
- Play game_over.wav on collision/game end
- Audio should be non-blocking (overlapping sounds allowed)

### FR-09: Difficulty Progression
- Gradually increase difficulty as score increases
- Methods: reduce gap between barriers, increase scroll speed, or reduce gap size
- Ensure difficulty curve is smooth and fair

## Non-Functional Requirements

### NFR-01: Performance
- Maintain 60fps on modern browsers
- Smooth animations without jank or stutter
- Efficient canvas rendering (minimize redraws)

### NFR-02: Responsiveness
- Canvas fills the entire browser window
- Resize handling when window dimensions change
- Game elements scale proportionally to viewport

### NFR-03: Browser Compatibility
- Support modern browsers (Chrome, Firefox, Safari, Edge)
- No external dependencies or build tools required
- Single HTML file with embedded or linked JS/CSS

### NFR-04: Usability
- Simple one-button control (spacebar only)
- Clear visual feedback for scoring
- Intuitive game flow (title → play → game over → play again)

### NFR-05: Code Quality
- Clean, readable vanilla JavaScript
- Well-structured with separation of concerns (game logic, rendering, input, audio)
- Comments for complex logic

## Asset Requirements

| Asset | Status | Notes |
|-------|--------|-------|
| Truck graphic | TO CREATE | Draw on canvas or create sprite |
| Road barriers | TO CREATE | Draw on canvas (barricade style) |
| Background | TO CREATE | Road/highway themed scrolling background |
| game_over.wav | EXISTS | Located at assets/game_over.wav |
| Truck engine sound | TO CREATE | Need truck engine audio for jump action |
| jump.wav | EXISTS | Located at assets/jump.wav (may repurpose) |
| ghosty.png | EXISTS | Located at assets/ghosty.png (not used in final theme) |

## Game Flow

```
+-------------------+     Spacebar     +-------------------+
|                   | --------------->  |                   |
|   Title Screen    |                  |     Gameplay      |
|                   |                  |                   |
+-------------------+                  +-------------------+
                                              |
                                              | Collision
                                              v
                                       +-------------------+
                                       |                   |
                                       |   Game Over       |
                                       |                   |
                                       +-------------------+
                                              |
                                              | Spacebar / Click
                                              v
                                       +-------------------+
                                       |                   |
                                       |     Gameplay      |
                                       |                   |
                                       +-------------------+
```
