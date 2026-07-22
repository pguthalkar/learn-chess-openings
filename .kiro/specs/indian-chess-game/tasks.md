# Implementation Plan: Chaturanga (Indian Chess Game)

## Overview

Implement a two-player hot-seat Chaturanga game using vanilla JavaScript IIFE modules and HTML5 Canvas. The implementation follows module dependency order: constants → board → pieces → moves → renderer → input → game orchestrator. Each module is self-contained and communicates through the shared namespace.

## Tasks

- [x] 1. Set up project structure and entry points
  - [x] 1.1 Create `chaturanga.html` entry point
    - Create the HTML file with a canvas element, script tags in dependency order, and link to ch-style.css
    - Script load order: ch-constants.js, ch-board.js, ch-pieces.js, ch-moves.js, ch-renderer.js, ch-input.js, ch-game.js
    - _Requirements: 14.1, 14.2, 14.4_

  - [x] 1.2 Create `css/ch-style.css` minimal stylesheet
    - Style the canvas for fullscreen layout, set cursor styles, dark brown background, and basic responsive behavior
    - _Requirements: 14.3, 15.1_

- [x] 2. Implement constants module
  - [x] 2.1 Create `js/ch-constants.js` with all shared constants
    - Define CH_BOARD_SIZE (8), CH_PIECE_TYPE enum, CH_PLAYER enum, CH_GAME_STATE enum
    - Define CH_COLORS object with earthy/sandstone palette (boardLight, boardDark, border, borderAccent, playerOne, playerTwo, highlight, legalMove, selected, background, textPrimary, textSecondary)
    - Define CH_INITIAL_POSITIONS 2D array with standard Chaturanga starting layout (Ratha, Ashva, Gaja, Mantri, Raja, Gaja, Ashva, Ratha on back ranks; Padati on second ranks)
    - _Requirements: 1.1, 1.3, 14.1, 14.2, 15.1_

- [x] 3. Implement board data model
  - [x] 3.1 Create `js/ch-board.js` IIFE module
    - Implement `init()` to set up 8×8 board array from CH_INITIAL_POSITIONS
    - Implement `reset()` to restore starting positions
    - Implement `getPiece(row, col)`, `setPiece(row, col, piece)`, `removePiece(row, col)`
    - Implement `movePiece(fromRow, fromCol, toRow, toCol)` returning captured piece or null
    - Implement `getBoard()` returning read-only copy of board state
    - Implement `findPieces(player)` returning array of {row, col, piece}
    - Implement `findRaja(player)` returning {row, col} of player's Raja
    - Implement `promotePiece(row, col, newType)` for Padati promotion
    - _Requirements: 1.3, 8.4, 8.5, 13.2_

  - [ ]* 3.2 Write property tests for board module
    - **Property 13: Game reset produces initial state**
    - **Validates: Requirements 13.2, 13.3**

- [x] 4. Implement move engine
  - [x] 4.1 Create `js/ch-moves.js` IIFE module with `getLegalMoves` and `hasAnyLegalMove`
    - Implement `_getRajaMoves(row, col, player, board)` using 8-direction offsets filtered by bounds and own-piece check
    - Implement `_getMantriMoves(row, col, player, board)` using 4 diagonal offsets
    - Implement `_getGajaMoves(row, col, player, board)` using 4 two-step diagonal offsets with jumping (no blocking check)
    - Implement `_getAshvaMoves(row, col, player, board)` using 8 L-shaped offsets with jumping
    - Implement `_getRathaMoves(row, col, player, board)` using sliding logic along 4 cardinal directions, stopping at obstructions
    - Implement `_getPadatiMoves(row, col, player, board)` with forward move if empty, diagonal capture if opponent, direction based on player
    - Implement `getLegalMoves(row, col, board)` dispatching to per-type helper
    - Implement `hasAnyLegalMove(player, board)` iterating all player pieces checking for at least one legal move
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 12.1_

  - [ ]* 4.2 Write property test for Raja legal moves
    - **Property 1: Raja legal move correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 4.3 Write property test for Mantri legal moves
    - **Property 2: Mantri legal move correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 4.4 Write property test for Gaja legal moves
    - **Property 3: Gaja legal move correctness (with jumping)**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ]* 4.5 Write property test for Ashva legal moves
    - **Property 4: Ashva legal move correctness (with jumping)**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 4.6 Write property test for Ratha legal moves
    - **Property 5: Ratha legal move correctness (sliding)**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 4.7 Write property test for Padati legal moves
    - **Property 6: Padati legal move correctness**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ]* 4.8 Write property test for Padati promotion
    - **Property 7: Padati promotion to Mantri**
    - **Validates: Requirements 8.4, 8.5**

- [x] 5. Checkpoint - Verify board and move engine
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement piece rendering
  - [x] 6.1 Create `js/ch-pieces.js` IIFE module with `drawPiece` dispatcher
    - Implement `_drawRaja(ctx, player, x, y, size)` — crown/lotus symbol with radiating lines
    - Implement `_drawMantri(ctx, player, x, y, size)` — diamond/rhombus shape with inner dot
    - Implement `_drawGaja(ctx, player, x, y, size)` — elephant silhouette using arcs and curves
    - Implement `_drawAshva(ctx, player, x, y, size)` — horse head profile using bezier curves
    - Implement `_drawRatha(ctx, player, x, y, size)` — chariot wheel (spoked circle) with base
    - Implement `_drawPadati(ctx, player, x, y, size)` — shield/spear triangle with base
    - Differentiate players via fill color (deep red vs deep green) with golden outlines
    - _Requirements: 2.1, 2.2, 2.3, 15.3_

- [x] 7. Implement renderer module
  - [x] 7.1 Create `js/ch-renderer.js` IIFE module
    - Implement `init(canvasElement)` to set up canvas context and compute initial dimensions
    - Implement `resize()` to recompute board size based on viewport while maintaining square aspect ratio
    - Implement `getBoardMetrics()` returning { boardSize, squareSize, offsetX, offsetY }
    - Implement `squareFromPixel(px, py)` converting pixel coordinates to board {row, col} or null
    - Implement `renderBoard()` drawing 64 alternating squares with earthy colors
    - Implement `renderBorder()` drawing ornate Indian-style border with golden geometric patterns, corner lotus motifs, and repeating diamond patterns
    - Implement `renderPieces(board)` iterating board and calling ChPieces.drawPiece for each piece
    - Implement `renderHighlights(selected, legalMoves)` drawing selection glow and legal move indicators
    - Implement `renderTurnIndicator(activePlayer)` showing active player text/indicator
    - Implement `renderMenuScreen()` drawing title/start screen
    - Implement `renderGameOver(winner, reason)` drawing game-over overlay with winner info
    - Implement `clear()` to clear the canvas
    - _Requirements: 1.1, 1.2, 1.4, 10.1, 15.1, 15.2, 15.4_

  - [ ]* 7.2 Write property test for responsive board sizing
    - **Property 14: Board responsive sizing maintains square aspect ratio**
    - **Validates: Requirements 1.4**

- [x] 8. Implement input handler
  - [x] 8.1 Create `js/ch-input.js` IIFE module
    - Implement `init(canvas)` attaching mouse click and touch event listeners
    - Implement `onSquareClick(callback)` to register the square click callback
    - Implement `onNewGame(callback)` to register the new game action callback
    - Implement `enable()` and `disable()` to control input processing
    - Convert pixel coordinates to board squares using ChRenderer.squareFromPixel
    - Handle both mouse and touch events for cross-device support
    - _Requirements: 9.4, 9.5, 10.1, 10.4, 11.3_

- [x] 9. Implement game orchestrator
  - [x] 9.1 Create `js/ch-game.js` IIFE module with game loop and state machine
    - Implement `init()` initializing all modules and starting requestAnimationFrame game loop
    - Implement game state machine: MENU → PLAYING → GAME_OVER
    - Implement `_gameLoop()` clearing canvas and rendering based on current state
    - Implement `_handleSquareClick({row, col})` dispatching to selection or move execution
    - Implement `_selectPiece(row, col)` selecting active player piece and computing legal moves via ChMoves
    - Implement `_executeMove(toRow, toCol)` moving piece, handling captures, checking promotion, checking victory
    - Implement `_switchTurn()` alternating activePlayer between PLAYER.ONE and PLAYER.TWO
    - Implement `_checkVictory()` detecting if opponent Raja was captured
    - Implement `_checkStalemate()` using ChMoves.hasAnyLegalMove on new active player
    - Implement `_startNewGame()` resetting board and state, assigning turn to Player 1
    - Handle Padati promotion: when Padati reaches last rank, call ChBoard.promotePiece to convert to Mantri
    - _Requirements: 8.4, 8.5, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, 13.1, 13.2, 13.3_

  - [ ]* 9.2 Write property test for turn alternation
    - **Property 8: Turn alternation**
    - **Validates: Requirements 9.2**

  - [ ]* 9.3 Write property test for piece selection restriction
    - **Property 9: Piece selection restricted to active player**
    - **Validates: Requirements 9.4, 9.5**

  - [ ]* 9.4 Write property test for move execution correctness
    - **Property 10: Move execution correctness**
    - **Validates: Requirements 10.2**

  - [ ]* 9.5 Write property test for victory on Raja capture
    - **Property 11: Victory on Raja capture**
    - **Validates: Requirements 11.1, 11.3**

  - [ ]* 9.6 Write property test for stalemate detection
    - **Property 12: Stalemate detection**
    - **Validates: Requirements 12.1, 12.2**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All modules use the IIFE pattern and expose public APIs on global scope
- No external dependencies — all rendering is programmatic Canvas API

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1", "6.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["7.2", "8.1"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6"] }
  ]
}
```
