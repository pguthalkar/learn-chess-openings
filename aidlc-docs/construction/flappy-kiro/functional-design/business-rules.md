# Business Rules - Flappy Kiro

## Game Rules

### BR-01: Truck Movement
- **Rule**: Truck only ascends when spacebar is pressed; otherwise gravity pulls it down
- **Constraint**: Velocity is SET to LIFT value on press (not additive)
- **Constraint**: Downward velocity cannot exceed TERMINAL_VELOCITY (12 px/frame)
- **Constraint**: Truck cannot go above the top of the canvas (y >= 0)

### BR-02: Collision Ends Game
- **Rule**: Any overlap between truck hitbox and a barrier OR the ground triggers game over
- **Constraint**: Collision detection uses full bounding rectangle (AABB)
- **Constraint**: Ground collision occurs when truck bottom edge touches ground strip

### BR-03: Scoring
- **Rule**: Player earns 1 point when truck's left edge passes a barrier's right edge
- **Constraint**: Each barrier pair can only award 1 point (scored flag)
- **Constraint**: Score only increments during PLAYING state

### BR-04: High Score Persistence
- **Rule**: High score is saved to localStorage when game ends IF current score exceeds stored high score
- **Constraint**: High score persists across browser sessions
- **Constraint**: Key: 'flappyKiro_highScore'
- **Constraint**: Default to 0 if no stored value

### BR-05: Difficulty Progression
- **Rule**: Scroll speed increases every 15 points
- **Constraint**: Only scroll speed changes (gap size and spacing remain constant)
- **Constraint**: Difficulty caps at score 50 (max speed 4.5 px/frame)
- **Constraint**: Speed formula: 3.0 + (min(floor(score/15), 3) * 0.5)

### BR-06: Obstacle Generation
- **Rule**: New obstacle pair spawns when horizontal distance from last obstacle exceeds OBSTACLE_SPACING
- **Constraint**: Gap center must be within safe bounds (80px from top/bottom)
- **Constraint**: Gap size is fixed at 150px (never changes)
- **Constraint**: Gap position is random within safe bounds

### BR-07: Truck Tilt
- **Rule**: Truck rotates based on vertical velocity
- **Constraint**: Rotation angle = clamp(velocity * 3, -30, 90) degrees
- **Constraint**: Negative angle = nose up (ascending), Positive = nose down (descending)

### BR-08: Input Handling
- **Rule**: Only keydown events register (not keyup)
- **Constraint**: Held spacebar (event.repeat === true) is ignored
- **Constraint**: Click/tap also triggers same action as spacebar

### BR-09: State Transitions
- **Rule**: Game transitions: TITLE -> PLAYING -> GAME_OVER -> PLAYING
- **Constraint**: Cannot skip states (no TITLE -> GAME_OVER)
- **Constraint**: GAME_OVER requires explicit user input to restart

### BR-10: Audio Playback
- **Rule**: Truck engine sound plays on every valid spacebar press during PLAYING state
- **Constraint**: Multiple sounds can overlap (rapid presses)
- **Rule**: Game over sound plays once on collision
- **Constraint**: AudioContext must be initialized by user interaction (browser requirement)

## Validation Rules

### VR-01: Canvas Bounds
- Truck Y position: [0, canvas.height - GROUND_HEIGHT - truck.height]
- Obstacle X position: [-OBSTACLE_WIDTH, canvas.width] (remove when off-screen left)
- Gap center Y: [80 + GAP_SIZE/2, canvas.height - GROUND_HEIGHT - 80 - GAP_SIZE/2]

### VR-02: Score Validation
- Score is always a non-negative integer
- Score starts at 0 on each new game
- Score only increments by 1

### VR-03: Speed Validation
- Scroll speed: [3.0, 4.5] px/frame (never below initial, never above cap)
- Truck velocity: [LIFT (-10), TERMINAL_VELOCITY (12)] px/frame

## Edge Cases

### EC-01: Rapid Spacebar
- Each press resets velocity to LIFT regardless of current velocity
- Sound plays for each valid press
- No input queue or buffering

### EC-02: Window Resize During Play
- Canvas resizes to new window dimensions
- Game objects reposition proportionally
- Ground height recalculates
- Obstacles in progress maintain relative positions

### EC-03: Tab Focus Loss
- requestAnimationFrame pauses when tab is inactive (browser default)
- Game effectively pauses when tab loses focus
- No explicit pause/resume logic needed

### EC-04: First Load (No High Score)
- localStorage returns null for high score
- Default to 0
- Title screen shows "High Score: 0" or omits display

### EC-05: Obstacle Cleanup
- Obstacles that have scrolled entirely off the left edge are removed from array
- Prevents memory growth during long sessions
