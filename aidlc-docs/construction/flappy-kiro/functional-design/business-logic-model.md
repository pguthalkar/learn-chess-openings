# Business Logic Model - Flappy Kiro

## 1. Game State Machine

```
+-------------------+      Spacebar       +-------------------+
|                   | ------------------>  |                   |
|   STATE: TITLE    |                     |  STATE: PLAYING   |
|                   |                     |                   |
+-------------------+                     +-------------------+
                                                 |
                                                 | Collision detected
                                                 v
                                          +-------------------+
                                          |                   |
                                          | STATE: GAME_OVER  |
                                          |                   |
                                          +-------------------+
                                                 |
                                                 | Spacebar or Click
                                                 v
                                          +-------------------+
                                          |                   |
                                          |  STATE: PLAYING   |
                                          |                   |
                                          +-------------------+
```

### State Definitions

| State | Entry Actions | Active Behaviors | Exit Triggers |
|-------|--------------|-----------------|---------------|
| TITLE | Show title, show high score, reset game objects | Listen for spacebar | Spacebar pressed |
| PLAYING | Reset truck position, start obstacle generation | Physics, rendering, collision, scoring | Collision detected |
| GAME_OVER | Play game_over.wav, save high score, show score | Listen for restart input | Spacebar or click |

### State Transitions

| From | To | Trigger | Actions |
|------|----|---------|---------|
| TITLE | PLAYING | Spacebar | Reset truck, clear obstacles, reset score, start game loop |
| PLAYING | GAME_OVER | Collision | Stop physics, play sound, calculate final score, update high score |
| GAME_OVER | PLAYING | Spacebar/Click | Reset all game objects, reset score, restart game loop |

## 2. Physics Model

### Constants (Heavy and Snappy - Flappy Bird style)

| Parameter | Value | Description |
|-----------|-------|-------------|
| GRAVITY | 0.6 px/frame^2 | Downward acceleration per frame |
| LIFT | -10 px/frame | Immediate upward velocity on spacebar |
| TERMINAL_VELOCITY | 12 px/frame | Maximum downward speed |
| INITIAL_SCROLL_SPEED | 3 px/frame | Base horizontal scroll speed |
| MAX_SCROLL_SPEED | 6 px/frame | Maximum scroll speed (difficulty cap) |

### Physics Update Algorithm (per frame)

```
function updatePhysics(truck):
    // Apply gravity
    truck.velocity += GRAVITY
    
    // Cap terminal velocity
    if truck.velocity > TERMINAL_VELOCITY:
        truck.velocity = TERMINAL_VELOCITY
    
    // Apply velocity to position
    truck.y += truck.velocity
    
    // Calculate tilt angle based on velocity
    truck.angle = clamp(truck.velocity * 3, -30, 90) degrees
    
    // Ground collision check
    if truck.y + truck.height >= canvas.height - GROUND_HEIGHT:
        trigger GAME_OVER
    
    // Ceiling boundary (prevent going above canvas)
    if truck.y < 0:
        truck.y = 0
        truck.velocity = 0
```

### Lift (Spacebar Press)

```
function onSpacebar():
    truck.velocity = LIFT  // Immediate velocity set (not additive)
    playSound('truck_engine')
```

## 3. Obstacle Generation Logic

### Parameters

| Parameter | Initial Value | Description |
|-----------|--------------|-------------|
| GAP_SIZE | 150 px | Vertical gap between top and bottom barriers |
| OBSTACLE_WIDTH | 60 px | Width of each barrier |
| OBSTACLE_SPACING | 300 px | Horizontal distance between obstacle pairs |
| MIN_GAP_Y | 80 px | Minimum distance from top for gap center |
| MAX_GAP_Y | canvas.height - GROUND_HEIGHT - 80 px | Maximum distance from top for gap center |

### Generation Algorithm

```
function generateObstacle():
    // Random gap position within bounds
    gapCenterY = random(MIN_GAP_Y + GAP_SIZE/2, MAX_GAP_Y - GAP_SIZE/2)
    
    topBarrier = {
        x: canvas.width,
        y: 0,
        width: OBSTACLE_WIDTH,
        height: gapCenterY - GAP_SIZE/2
    }
    
    bottomBarrier = {
        x: canvas.width,
        y: gapCenterY + GAP_SIZE/2,
        width: OBSTACLE_WIDTH,
        height: canvas.height - (gapCenterY + GAP_SIZE/2)
    }
    
    return { topBarrier, bottomBarrier, scored: false }
```

### Spawn Timing

```
function shouldSpawnObstacle():
    if obstacles.length == 0:
        return true
    lastObstacle = obstacles[obstacles.length - 1]
    return (canvas.width - lastObstacle.x) >= OBSTACLE_SPACING
```

## 4. Collision Detection

### Hitbox Definition
- **Type**: Full bounding rectangle matching truck sprite
- **Shape**: AABB (Axis-Aligned Bounding Box)

### Algorithm (AABB vs AABB)

```
function checkCollision(truck, barrier):
    return (
        truck.x < barrier.x + barrier.width AND
        truck.x + truck.width > barrier.x AND
        truck.y < barrier.y + barrier.height AND
        truck.y + truck.height > barrier.y
    )

function checkAllCollisions():
    for each obstacle in obstacles:
        if checkCollision(truck, obstacle.topBarrier):
            return true
        if checkCollision(truck, obstacle.bottomBarrier):
            return true
    
    // Ground collision
    if truck.y + truck.height >= canvas.height - GROUND_HEIGHT:
        return true
    
    return false
```

## 5. Scoring System

### Point Award Logic

```
function checkScoring():
    for each obstacle in obstacles:
        if NOT obstacle.scored:
            // Truck has passed the right edge of the barrier
            if truck.x > obstacle.topBarrier.x + obstacle.topBarrier.width:
                obstacle.scored = true
                score += 1
                checkDifficultyProgression()
```

### High Score Persistence

```
function saveHighScore():
    currentHigh = localStorage.getItem('flappyKiro_highScore') || 0
    if score > currentHigh:
        localStorage.setItem('flappyKiro_highScore', score)

function loadHighScore():
    return parseInt(localStorage.getItem('flappyKiro_highScore')) || 0
```

## 6. Difficulty Progression

### Model: Scroll Speed Increase Only

| Score Threshold | Scroll Speed | Speed Multiplier |
|----------------|-------------|-----------------|
| 0-14 | 3.0 px/frame | 1.0x |
| 15-29 | 3.5 px/frame | 1.17x |
| 30-44 | 4.0 px/frame | 1.33x |
| 45-50+ | 4.5 px/frame | 1.5x (CAPPED) |

### Algorithm

```
function checkDifficultyProgression():
    // Increase every 15 points, cap at score 50
    level = min(floor(score / 15), 3)  // Max level 3
    scrollSpeed = INITIAL_SCROLL_SPEED + (level * 0.5)
    scrollSpeed = min(scrollSpeed, MAX_SCROLL_SPEED)
```

### Cap Behavior
- Difficulty caps at score 50 (level 3)
- After cap, scroll speed remains constant at 4.5 px/frame
- Gap size and spacing never change

## 7. Rendering Pipeline

### Draw Order (back to front)
1. Background (solid sky color)
2. Scrolling ground/road strip
3. Obstacles (road barriers)
4. Truck (with rotation)
5. HUD (score display)
6. Overlay (title screen / game over screen)

### Responsive Scaling
- Canvas fills entire browser window
- Game elements scale proportionally to canvas dimensions
- All positional values calculated relative to canvas.width and canvas.height
- Recalculate on window resize event

### Frame Loop

```
function gameLoop(timestamp):
    deltaTime = timestamp - lastFrameTime
    lastFrameTime = timestamp
    
    clearCanvas()
    
    if state == PLAYING:
        updatePhysics()
        updateObstacles()
        checkAllCollisions()
        checkScoring()
    
    render()
    requestAnimationFrame(gameLoop)
```

## 8. Input Handling

### Spacebar Events
- **Event**: keydown (key === ' ' or code === 'Space')
- **Debounce**: Only first keydown registers (ignore held key via event.repeat)
- **Multi-press**: Each press sets velocity to LIFT (non-additive)

### Input by State

| State | Spacebar | Click/Tap |
|-------|----------|-----------|
| TITLE | Start game | Start game |
| PLAYING | Lift truck | Lift truck |
| GAME_OVER | Restart game | Restart game |

## 9. Audio System

### Sound Events

| Trigger | Sound | Behavior |
|---------|-------|----------|
| Spacebar (PLAYING) | truck_engine (jump.wav) | Play from start, allow overlap |
| Collision | game_over.wav | Play once |

### Browser Audio Constraint
- Audio context requires user interaction to start
- First spacebar press on TITLE screen initializes AudioContext
- Use Audio() elements or Web Audio API for playback

### Concurrent Playback
- Allow multiple engine sounds to overlap (rapid spacebar presses)
- Create new Audio instance or clone for each play event
