# Design Document: Chaturanga (Indian Chess Game)

## Architecture Overview

The Chaturanga game follows the same architectural pattern as the existing Flappy Kiro game: vanilla JavaScript IIFE modules loaded via script tags into a single HTML page, with all rendering done through the HTML5 Canvas API.

The system is structured as a set of cooperating modules that communicate through a shared `Chaturanga` namespace object. Each module is an IIFE that exposes a public API and encapsulates its internal state.

```
┌─────────────────────────────────────────────────────┐
│                  chaturanga.html                      │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ constants.js │  │ board.js     │  │ pieces.js │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ moves.js    │  │ renderer.js  │  │ input.js  │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │                   game.js                        ││
│  │  (orchestrator — game loop, state, turns)        ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Module Decomposition

### 1. `ch-constants.js` — Constants and Configuration

Defines all shared constants: board dimensions, colors, piece types, game states, and initial piece positions.

### 2. `ch-board.js` — Board Data Model

Manages the 8×8 board array representation. Handles piece placement, removal, and board queries.

### 3. `ch-pieces.js` — Piece Definitions and Rendering

Defines piece types and their Canvas-drawn iconography. Each piece type has a dedicated drawing function using Sanskrit-inspired geometric designs.

### 4. `ch-moves.js` — Move Engine

Computes legal moves for each piece type. Contains the core game logic for movement rules, captures, and special moves (Gaja jumping, Padati promotion).

### 5. `ch-renderer.js` — Board and UI Rendering

Draws the board, pieces, highlights, borders, turn indicator, and game-over screens on the Canvas.

### 6. `ch-input.js` — Input Handler

Translates mouse clicks and touch events into board coordinates. Manages piece selection and move execution flow.

### 7. `ch-game.js` — Game Orchestrator

Main game loop, state machine (MENU → PLAYING → GAME_OVER), turn management, victory detection, and reset logic.

## Data Models

### Board Representation

```javascript
// Board is an 8×8 2D array. Index [row][col] where row 0 = rank 1 (bottom for player 1)
// null represents an empty square
// Each piece is an object: { type, player }

const PIECE_TYPE = {
    RAJA: 'raja',
    MANTRI: 'mantri',
    GAJA: 'gaja',
    ASHVA: 'ashva',
    RATHA: 'ratha',
    PADATI: 'padati'
};

const PLAYER = {
    ONE: 1,  // Army on ranks 1-2 (rows 0-1), moves "up"
    TWO: 2   // Army on ranks 7-8 (rows 6-7), moves "down"
};

// A piece on the board
// { type: PIECE_TYPE.RAJA, player: PLAYER.ONE }

// Board state
// board[row][col] = piece | null
```

### Game State

```javascript
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

// Game state object
// {
//   board: Piece[][],        // 8x8 array
//   activePlayer: PLAYER,    // whose turn it is
//   selectedSquare: {row, col} | null,
//   legalMoves: [{row, col}],
//   gameState: GAME_STATE,
//   winner: PLAYER | null,
//   winReason: 'capture' | 'stalemate' | null
// }
```

### Initial Board Layout

```
Rank 8 (row 7): Ratha Ashva Gaja Mantri Raja Gaja Ashva Ratha  [Player 2]
Rank 7 (row 6): Padati Padati Padati Padati Padati Padati Padati Padati [Player 2]
Rank 6 (row 5): empty
Rank 5 (row 4): empty
Rank 4 (row 3): empty
Rank 3 (row 2): empty
Rank 2 (row 1): Padati Padati Padati Padati Padati Padati Padati Padati [Player 1]
Rank 1 (row 0): Ratha Ashva Gaja Mantri Raja Gaja Ashva Ratha  [Player 1]
```

Note: The Raja is at column 4 (e-file equivalent), Mantri at column 3 (d-file equivalent).

## Component Interfaces

### ChConstants (ch-constants.js)

```javascript
// Exported constants (global scope)
const CH_BOARD_SIZE = 8;
const CH_PIECE_TYPE = { RAJA, MANTRI, GAJA, ASHVA, RATHA, PADATI };
const CH_PLAYER = { ONE: 1, TWO: 2 };
const CH_GAME_STATE = { MENU: 'menu', PLAYING: 'playing', GAME_OVER: 'game_over' };
const CH_COLORS = {
    boardLight: '#F5DEB3',      // wheat/sandstone light
    boardDark: '#8B6914',       // dark earth/amber
    border: '#5C3317',          // dark wood brown
    borderAccent: '#DAA520',    // golden accent
    playerOne: '#C62828',       // deep red
    playerTwo: '#1B5E20',       // deep green
    highlight: 'rgba(255, 215, 0, 0.5)',  // golden highlight
    legalMove: 'rgba(76, 175, 80, 0.6)',  // green indicator
    selected: 'rgba(255, 193, 7, 0.7)',   // amber selected
    background: '#3E2723',      // dark brown bg
    textPrimary: '#FFD54F',     // golden text
    textSecondary: '#BCAAA4'    // muted tan text
};
const CH_INITIAL_POSITIONS = [...]; // 2D array defining starting layout
```

### ChBoard (ch-board.js)

```javascript
const ChBoard = (() => {
    // Internal state: 8x8 board array

    function init();                          // Set up initial piece positions
    function reset();                         // Reset to starting positions
    function getPiece(row, col);              // Returns piece object or null
    function setPiece(row, col, piece);       // Place a piece on the board
    function removePiece(row, col);           // Remove piece, return it
    function movePiece(fromRow, fromCol, toRow, toCol); // Move piece, return captured piece or null
    function getBoard();                      // Returns the full 8x8 board array (read-only copy)
    function findPieces(player);              // Returns [{row, col, piece}] for all pieces of a player
    function findRaja(player);               // Returns {row, col} of the player's Raja
    function promotePiece(row, col, newType); // Change piece type (for Padati promotion)

    return { init, reset, getPiece, setPiece, removePiece, movePiece,
             getBoard, findPieces, findRaja, promotePiece };
})();
```

### ChMoves (ch-moves.js)

```javascript
const ChMoves = (() => {

    function getLegalMoves(row, col, board);  // Returns [{row, col}] of legal destinations
    function hasAnyLegalMove(player, board);  // Returns boolean — does this player have any legal move?

    // Internal helpers per piece type:
    // _getRajaMoves(row, col, player, board)
    // _getMantriMoves(row, col, player, board)
    // _getGajaMoves(row, col, player, board)
    // _getAshvaMoves(row, col, player, board)
    // _getRathaMoves(row, col, player, board)
    // _getPadatiMoves(row, col, player, board)

    return { getLegalMoves, hasAnyLegalMove };
})();
```

### ChPieces (ch-pieces.js)

```javascript
const ChPieces = (() => {

    function drawPiece(ctx, piece, x, y, size);  // Draw a piece at canvas coords
    // Internally dispatches to:
    // _drawRaja(ctx, player, x, y, size)
    // _drawMantri(ctx, player, x, y, size)
    // _drawGaja(ctx, player, x, y, size)
    // _drawAshva(ctx, player, x, y, size)
    // _drawRatha(ctx, player, x, y, size)
    // _drawPadati(ctx, player, x, y, size)

    return { drawPiece };
})();
```

### ChRenderer (ch-renderer.js)

```javascript
const ChRenderer = (() => {
    let canvas, ctx;
    let boardSize, squareSize, boardOffsetX, boardOffsetY;

    function init(canvasElement);             // Set up canvas and compute dimensions
    function resize();                        // Recompute board size for viewport
    function getBoardMetrics();               // Returns { boardSize, squareSize, offsetX, offsetY }
    function renderBoard();                   // Draw the 8x8 grid with alternating colors
    function renderBorder();                  // Draw ornate Indian-style border
    function renderPieces(board);             // Draw all pieces on the board
    function renderHighlights(selected, legalMoves); // Draw selection and move indicators
    function renderTurnIndicator(activePlayer); // Show whose turn it is
    function renderMenuScreen();              // Draw the title/start screen
    function renderGameOver(winner, reason);  // Draw game-over overlay
    function clear();                         // Clear the canvas
    function squareFromPixel(px, py);         // Convert pixel coords to board {row, col} or null

    return { init, resize, getBoardMetrics, renderBoard, renderBorder,
             renderPieces, renderHighlights, renderTurnIndicator,
             renderMenuScreen, renderGameOver, clear, squareFromPixel };
})();
```

### ChInput (ch-input.js)

```javascript
const ChInput = (() => {

    function init(canvas);                    // Attach mouse/touch event listeners
    function onSquareClick(callback);         // Register callback: ({row, col}) => void
    function onNewGame(callback);             // Register callback for new game button click
    function enable();                        // Enable input processing
    function disable();                       // Disable input processing

    return { init, onSquareClick, onNewGame, enable, disable };
})();
```

### ChGame (ch-game.js)

```javascript
const ChGame = (() => {

    function init();                          // Initialize all modules, start game loop
    // Internal:
    // _handleSquareClick({row, col})
    // _selectPiece(row, col)
    // _executeMove(toRow, toCol)
    // _switchTurn()
    // _checkVictory()
    // _checkStalemate()
    // _startNewGame()
    // _gameLoop()

    return { init };
})();
```

## Movement Rules Implementation

### Raja (King)
- Offsets: `[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]`
- Filter: destination in bounds AND not occupied by own piece

### Mantri (Minister)
- Offsets: `[-1,-1], [-1,1], [1,-1], [1,1]`
- Filter: destination in bounds AND not occupied by own piece

### Gaja (Elephant)
- Offsets: `[-2,-2], [-2,2], [2,-2], [2,2]`
- Jumping: no blocking check on intervening square
- Filter: destination in bounds AND not occupied by own piece

### Ashva (Horse)
- Offsets: `[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]`
- Jumping: inherent (L-shape)
- Filter: destination in bounds AND not occupied by own piece

### Ratha (Chariot)
- Directions: `[0,1], [0,-1], [1,0], [-1,0]`
- Sliding: iterate each direction, adding empty squares, stop at first occupied square
  - If opponent piece: include that square (capture), stop
  - If own piece: exclude that square, stop

### Padati (Infantry)
- Forward direction: Player 1 moves +row, Player 2 moves -row
- Forward move: one square forward if empty
- Capture: diagonal forward squares if occupied by opponent
- Promotion: if destination row is 7 (for Player 1) or 0 (for Player 2), promote to Mantri

## Rendering Approach

### Board Sizing
- Compute `squareSize = Math.floor(Math.min(viewportWidth, viewportHeight) * 0.85 / 8)`
- `boardSize = squareSize * 8`
- Center the board on canvas with offsets

### Board Drawing
1. Fill background with `CH_COLORS.background`
2. Draw ornate border (golden geometric patterns inspired by Indian temple motifs)
3. Draw 64 squares with alternating `boardLight` and `boardDark` colors
4. Overlay selection highlight and legal move dots

### Piece Drawing (Sanskrit-Inspired Iconography)
Each piece is drawn programmatically using Canvas paths:
- **Raja**: Crown/lotus symbol with radiating lines
- **Mantri**: Diamond/rhombus shape with inner dot
- **Gaja**: Elephant silhouette using arcs and curves
- **Ashva**: Horse head profile using bezier curves
- **Ratha**: Chariot wheel (spoked circle) with base
- **Padati**: Shield/spear triangle with base

Player differentiation via fill color (deep red vs deep green) with golden outlines.

### Border Design
Ornate border using repeating geometric patterns:
- Outer frame with `border` color
- Inner golden accent line
- Corner lotus/mandala motifs drawn with arc patterns
- Repeating diamond pattern along edges

## Game Loop and State Machine

```
┌──────┐    click "Start"    ┌─────────┐
│ MENU │ ──────────────────> │ PLAYING │
└──────┘                     └────┬────┘
    ^                             │
    │        click "New Game"     │ Raja captured
    │ <─────────────────────────  │ OR stalemate
    │                             v
    │                      ┌───────────┐
    └───────────────────── │ GAME_OVER │
                           └───────────┘
```

### Game Loop (requestAnimationFrame)
1. Clear canvas
2. Render board and border
3. Render pieces from board state
4. Render highlights (selected piece + legal moves)
5. Render turn indicator
6. If GAME_OVER: render overlay with winner info and "New Game" button

### Turn Flow
1. Active player clicks a square
2. If square has own piece → select it, compute legal moves, highlight
3. If square is in legal moves → execute move
4. After move: check if opponent Raja was captured → victory
5. Switch turn
6. Check if new active player has any legal moves → stalemate if not

## Error Handling

- **Out-of-bounds clicks**: `squareFromPixel` returns null → ignored
- **Invalid selections**: clicking empty squares or opponent pieces when no piece selected → ignored
- **Clicking during GAME_OVER**: input disabled, only "New Game" click accepted
- **Window resize**: recalculate board metrics, re-render on next frame
- **Edge cases in move generation**: all move functions check bounds before adding destinations

## File Structure

```
chess/
├── chaturanga.html          # Entry point for Chaturanga game
├── css/
│   └── ch-style.css         # Minimal CSS (canvas fullscreen, cursor)
└── js/
    ├── ch-constants.js      # Constants, colors, initial positions
    ├── ch-board.js          # Board data model
    ├── ch-pieces.js         # Piece rendering (Canvas drawing)
    ├── ch-moves.js          # Move engine (legal move computation)
    ├── ch-renderer.js       # Board/UI rendering
    ├── ch-input.js          # Mouse/touch input handling
    └── ch-game.js           # Game orchestrator (loop, state, turns)
```

## Script Load Order

```html
<script src="js/ch-constants.js"></script>
<script src="js/ch-board.js"></script>
<script src="js/ch-pieces.js"></script>
<script src="js/ch-moves.js"></script>
<script src="js/ch-renderer.js"></script>
<script src="js/ch-input.js"></script>
<script src="js/ch-game.js"></script>
```

Order matters: constants first (no dependencies), then data model, then logic modules, then rendering, then input, and finally the orchestrator which depends on all others.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Raja legal move correctness

*For any* valid board state and any Raja at position (r, c), the set of legal moves returned by the Move Engine SHALL be exactly the set of squares within one step in any direction (horizontal, vertical, diagonal) that are within board bounds and not occupied by the active player's own piece.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 2: Mantri legal move correctness

*For any* valid board state and any Mantri at position (r, c), the set of legal moves returned by the Move Engine SHALL be exactly the set of squares one step diagonally away that are within board bounds and not occupied by the active player's own piece, with a maximum of four destinations.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 3: Gaja legal move correctness (with jumping)

*For any* valid board state and any Gaja at position (r, c), the set of legal moves returned by the Move Engine SHALL be exactly the set of squares two steps diagonally away that are within board bounds and not occupied by the active player's own piece, regardless of any piece on the intervening diagonal square.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 4: Ashva legal move correctness (with jumping)

*For any* valid board state and any Ashva at position (r, c), the set of legal moves returned by the Move Engine SHALL be exactly the set of squares reachable by L-shaped offsets that are within board bounds and not occupied by the active player's own piece, regardless of intervening pieces.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 5: Ratha legal move correctness (sliding)

*For any* valid board state and any Ratha at position (r, c), the set of legal moves returned by the Move Engine SHALL include all empty squares along each rank/file direction until the first obstruction, include opponent-occupied squares as the final valid square in that direction, and exclude own-piece-occupied squares and all squares beyond any obstruction.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 6: Padati legal move correctness

*For any* valid board state and any Padati at position (r, c), the set of legal moves SHALL include the one-square-forward destination if and only if it is empty, and include each diagonal-forward square if and only if it is occupied by an opponent piece, with no two-square advance option.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 7: Padati promotion to Mantri

*For any* board state where a Padati is moved to the last rank (row 7 for Player 1, row 0 for Player 2), the system SHALL replace that Padati with a Mantri, and the promoted piece SHALL subsequently generate only Mantri-legal moves.

**Validates: Requirements 8.4, 8.5**

### Property 8: Turn alternation

*For any* sequence of valid moves starting from the initial game state, the active player SHALL alternate between Player 1 and Player 2 after each completed move.

**Validates: Requirements 9.2**

### Property 9: Piece selection restricted to active player

*For any* game state during play, attempting to select a piece SHALL succeed if and only if that piece belongs to the active player.

**Validates: Requirements 9.4, 9.5**

### Property 10: Move execution correctness

*For any* valid move from square (r1, c1) to square (r2, c2), after execution the piece SHALL be at (r2, c2), square (r1, c1) SHALL be empty, and if an opponent piece was at (r2, c2) it SHALL be removed from the board.

**Validates: Requirements 10.2**

### Property 11: Victory on Raja capture

*For any* board state where a legal move captures the opponent's Raja, the game SHALL immediately transition to GAME_OVER with the capturing player declared as winner, and no further moves SHALL be accepted.

**Validates: Requirements 11.1, 11.3**

### Property 12: Stalemate detection

*For any* board state where it becomes a player's turn, the system SHALL correctly determine whether that player has at least one legal move, and if no legal move exists, declare that player the loser.

**Validates: Requirements 12.1, 12.2**

### Property 13: Game reset produces initial state

*For any* game state (mid-game or ended), activating the reset function SHALL produce a board state identical to the initial starting position with all 32 pieces correctly placed and the turn assigned to Player 1.

**Validates: Requirements 13.2, 13.3**

### Property 14: Board responsive sizing maintains square aspect ratio

*For any* viewport width and height, the computed board size SHALL be square (equal width and height) and SHALL fit entirely within both the viewport width and viewport height.

**Validates: Requirements 1.4**
