# Integration Test Instructions - Flappy Kiro

## Purpose
Verify that all game modules work together correctly as an integrated system.

## Test Scenarios

### Scenario 1: Game State Transitions
- **Description**: Verify TITLE → PLAYING → GAME_OVER → PLAYING cycle
- **Setup**: Open game in browser
- **Test Steps**:
  1. Verify game starts in TITLE state (title screen visible)
  2. Press Spacebar — verify transition to PLAYING (truck appears, obstacles scroll)
  3. Let truck fall to ground — verify transition to GAME_OVER (overlay appears, sound plays)
  4. Press Spacebar — verify transition back to PLAYING (game resets)
- **Expected Results**: Clean state transitions, no visual glitches, score resets on restart

### Scenario 2: Physics + Rendering Integration
- **Description**: Verify truck physics are correctly rendered
- **Setup**: Start a new game
- **Test Steps**:
  1. Press Spacebar to start
  2. Observe truck falling (gravity applied)
  3. Press Spacebar — observe truck jump (immediate upward velocity)
  4. Observe truck tilting down while falling, tilting up while rising
  5. Rapidly press Spacebar — observe multiple jumps
- **Expected Results**: 
  - Truck falls at accelerating speed
  - Single spacebar gives snappy upward jump
  - Truck tilt matches velocity direction
  - No visual stuttering or teleporting

### Scenario 3: Obstacle Generation + Collision
- **Description**: Verify obstacles spawn correctly and collision detection works
- **Setup**: Start a new game
- **Test Steps**:
  1. Observe first obstacle appears from right side
  2. Observe obstacles are road barricade styled (orange/white stripes)
  3. Observe gap is present between top and bottom barriers
  4. Navigate through a gap — observe no collision triggered
  5. Intentionally hit a barrier — observe game over triggered
  6. Let truck hit ground — observe game over triggered
- **Expected Results**: 
  - Obstacles spawn at regular intervals
  - Gaps are navigable
  - Collision detection triggers correctly
  - No phantom collisions (false positives)

### Scenario 4: Scoring + Difficulty
- **Description**: Verify scoring increments and difficulty progresses
- **Setup**: Start a new game, play skillfully
- **Test Steps**:
  1. Pass through first barrier pair — observe score shows "1"
  2. Continue playing — verify score increments by 1 each barrier
  3. Reach score 15 — observe slight speed increase
  4. Reach score 30 — observe another speed increase
  5. Reach score 50+ — verify speed doesn't increase further
- **Expected Results**:
  - Score displayed in top-center
  - +1 per barrier pair passed
  - Speed noticeably increases at 15, 30, 45
  - Speed caps and game remains playable at score 50+

### Scenario 5: Audio Integration
- **Description**: Verify sounds play at correct moments
- **Setup**: Start a new game with audio enabled
- **Test Steps**:
  1. Press Spacebar on title screen — audio system initializes (no sound on first transition)
  2. During gameplay, press Spacebar — hear truck engine sound
  3. Rapidly press Spacebar — hear overlapping engine sounds
  4. Collide with obstacle — hear game over sound
  5. Restart and repeat — sounds work consistently
- **Expected Results**:
  - Engine sound plays on each jump
  - Multiple engine sounds can overlap
  - Game over sound plays once on collision
  - No audio errors in console

### Scenario 6: High Score Persistence
- **Description**: Verify high score saves and loads across sessions
- **Setup**: Start a new game
- **Test Steps**:
  1. Play and achieve a score (e.g., 5)
  2. Game over — note high score displayed
  3. Refresh the page
  4. Title screen — verify high score is displayed
  5. Play again and achieve a lower score
  6. Game over — verify high score remains unchanged
  7. Play again and beat the high score
  8. Game over — verify "New High Score" indicator and updated value
- **Expected Results**:
  - High score persists across page refreshes
  - Only updates when beaten
  - Shows "New High Score" celebration text

### Scenario 7: Responsive Resize
- **Description**: Verify game handles window resize
- **Setup**: Start a game, then resize browser window
- **Test Steps**:
  1. Start game at full window size
  2. While playing, resize window (drag edge)
  3. Observe game elements reposition
  4. Ground stays at bottom
  5. Truck remains on screen
- **Expected Results**:
  - Canvas resizes to match new window dimensions
  - No crash or visual artifacts
  - Game continues functioning after resize

## How to Run
All integration tests are manual — play the game in a browser and follow each scenario's test steps. Check browser DevTools console for any JavaScript errors during testing.
