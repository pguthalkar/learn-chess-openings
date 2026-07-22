# Domain Entities - Flappy Kiro

## Entity: Game

The root entity managing overall game state.

| Property | Type | Description |
|----------|------|-------------|
| state | Enum(TITLE, PLAYING, GAME_OVER) | Current game state |
| score | Integer | Current score for this run |
| highScore | Integer | All-time high score (from localStorage) |
| scrollSpeed | Float | Current horizontal scroll speed (px/frame) |
| difficultyLevel | Integer (0-3) | Current difficulty tier |
| canvas | HTMLCanvasElement | Game canvas reference |
| ctx | CanvasRenderingContext2D | Drawing context |

## Entity: Truck

The player character.

| Property | Type | Description |
|----------|------|-------------|
| x | Float | Horizontal position (fixed during gameplay) |
| y | Float | Vertical position (varies with physics) |
| width | Integer | Hitbox/render width |
| height | Integer | Hitbox/render height |
| velocity | Float | Current vertical velocity (px/frame) |
| angle | Float | Current rotation angle (degrees) |

### Truck Rendering Details
- Rendered as pixel-art style truck using canvas drawing calls
- Body: Main rectangle with cab section
- Wheels: Two circles at bottom
- Details: Window, bumper, exhaust
- Colors: Primary truck color with accents
- Rotation applied around truck center point

## Entity: Obstacle

A pair of barriers (top and bottom) with a gap.

| Property | Type | Description |
|----------|------|-------------|
| x | Float | Horizontal position of the pair |
| topHeight | Float | Height of top barrier (from canvas top) |
| bottomY | Float | Y position where bottom barrier starts |
| width | Integer | Width of barriers (60px) |
| gapCenterY | Float | Center of the gap between barriers |
| scored | Boolean | Whether player has passed this obstacle |

### Obstacle Rendering Details
- Rendered as road construction barricades
- Orange/white striped pattern
- Flat top and bottom caps
- Support posts on sides

## Entity: Ground

The road/ground strip at the bottom of the canvas.

| Property | Type | Description |
|----------|------|-------------|
| height | Integer | Height of ground strip |
| scrollOffset | Float | Current scroll position for animation |
| color | String | Road color (dark gray/asphalt) |

### Ground Rendering Details
- Dark gray/asphalt colored strip
- Dashed center line (scrolling for movement illusion)
- Fixed at bottom of canvas

## Entity: Background

The sky/environment behind all game elements.

| Property | Type | Description |
|----------|------|-------------|
| color | String | Sky/background color |

### Background Rendering Details
- Simple solid color fill (light blue sky)
- No parallax or moving elements (per user choice)

## Entity: AudioManager

Manages sound playback.

| Property | Type | Description |
|----------|------|-------------|
| engineSound | String | Path to truck engine sound file |
| gameOverSound | String | Path to game over sound file |
| initialized | Boolean | Whether AudioContext is active |

### Audio Methods
- playEngine(): Play truck engine sound (allows overlap)
- playGameOver(): Play game over sound (once)
- init(): Initialize AudioContext on first user interaction

## Entity: HUD (Heads-Up Display)

Score display during gameplay.

| Property | Type | Description |
|----------|------|-------------|
| score | Integer (reference to Game.score) | Current score |
| fontSize | Integer | Score text size (scales with canvas) |
| position | {x, y} | Score display position (top-center) |

### HUD Rendering Details
- Large white text with dark outline/shadow
- Positioned at top-center of canvas
- Font scales proportionally to canvas width

## Entity Relationships

```
+-------------------+
|       Game        |
+-------------------+
| state             |
| score             |
| highScore         |
| scrollSpeed       |
+-------------------+
        |
        | owns (1:1)
        v
+-------------------+       +-------------------+
|      Truck        |       |   AudioManager    |
+-------------------+       +-------------------+
| x, y, velocity   |       | engineSound       |
| width, height     |       | gameOverSound     |
| angle             |       | initialized       |
+-------------------+       +-------------------+
        |
        | collides with (1:many)
        v
+-------------------+
|    Obstacle[]     |
+-------------------+
| x, topHeight      |
| bottomY, width    |
| gapCenterY        |
| scored            |
+-------------------+
        |
        | scrolls above
        v
+-------------------+       +-------------------+
|     Ground        |       |    Background     |
+-------------------+       +-------------------+
| height            |       | color             |
| scrollOffset      |       +-------------------+
| color             |
+-------------------+
        |
        | displays over
        v
+-------------------+
|       HUD         |
+-------------------+
| score             |
| fontSize          |
| position          |
+-------------------+
```
