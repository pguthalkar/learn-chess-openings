# Chess Opening Learning — Design Spec

**Date:** 2026-07-21
**Status:** Approved (brainstorming)
**Target file:** `chess.html` (modern chess, not chaturanga)

## Goal

Add a "Learn" mode to the existing modern-chess app that lets a beginner study three classic openings (Italian Game, Ruy Lopez, Queen's Gambit) either as a guided walkthrough or as a practice drill where the app corrects wrong moves and continues.

## Scope (v1)

- 3 curated openings, 1 main line each, ~8–10 plies
- Two modes per opening: **Walkthrough** (user-paced, no penalties) and **Practice** (user plays White; app plays Black's correct responses; wrong moves get corrected)
- User always plays White in v1
- One short caption per opening, no per-move commentary
- New "Learn" entry point on the existing menu screen

## Non-Goals (YAGNI)

- Multiple variations per opening
- User choosing to play Black
- Algebraic notation display (Nf3, Bb5, etc.) — coordinate clicks are enough
- PGN import
- Saving progress across sessions
- Chaturanga support

## Architecture

### New files

| File | Responsibility |
|---|---|
| `js/chess-openings.js` | Static opening definitions + validator |
| `js/chess-learn.js` | Learn sub-state machine, replay driver, click routing for learn states |
| `tests/learn.test.js` | Unit tests for `applyMove`, validator, state machine |

### Modified files

| File | Change |
|---|---|
| `js/chess-constants.js` | Add `CHESS_LEARN_STATE` enum |
| `js/chess-moves.js` | Add pure `applyMove(board, enPassantTarget, move)` helper; refactor nothing else |
| `js/chess-game.js` | (a) Add a "Learn" button to `MENU`. (b) Click handler routes learn-states to `ChessLearn`. (c) `_executeMove` calls the new `applyMove` helper. |
| `js/chess-renderer.js` | Add `renderLearnMenu`, `renderOpeningPicker`, `renderLearnCaption`, `renderLearnComplete`. Hit-test helpers for the new UI. |
| `chess.html` | Load `chess-openings.js` and `chess-learn.js` in order |

No changes to `chess-board.js`, `chess-pieces.js`, `chess-input.js`, `chess-style.css`.

## State Machine

```
CHESS_GAME_STATE.MENU
  ├── click "Play"     → CHESS_GAME_STATE.PLAYING (unchanged)
  └── click "Learn"    → CHESS_LEARN_STATE.MENU

CHESS_LEARN_STATE.MENU
  ├── click "← Back"   → CHESS_GAME_STATE.MENU
  ├── click "Walkthrough" on opening X → CHESS_LEARN_STATE.WALKTHROUGH (opening X)
  └── click "Practice"  on opening X → CHESS_LEARN_STATE.PRACTICE   (opening X)

CHESS_LEARN_STATE.WALKTHROUGH / PRACTICE
  ├── end of moves     → CHESS_LEARN_STATE.COMPLETE
  └── click "← Back"   → CHESS_LEARN_STATE.MENU

CHESS_LEARN_STATE.COMPLETE
  └── click anywhere   → CHESS_LEARN_STATE.MENU
```

`CHESS_LEARN_STATE = { MENU, WALKTHROUGH, PRACTICE, COMPLETE }` lives in `chess-constants.js`. The active learn state is a separate variable inside `ChessLearn`; the main game state stays in `CHESS_GAME_STATE.MENU` while learn is active so the existing render loop can branch on learn via a getter.

## Data Model

### Opening definition (`chess-openings.js`)

```js
const CHESS_OPENINGS = [
  {
    id: 'italian',
    name: 'Italian Game',
    caption: 'Italian: e4 e5, knights out, bishop to c4.',
    moves: [
      { from: { r: 1, c: 4 }, to: { r: 3, c: 4 } }, // 1.e4
      { from: { r: 6, c: 4 }, to: { r: 4, c: 4 } }, // 1...e5
      { from: { r: 0, c: 6 }, to: { r: 2, c: 5 } }, // 2.Nf3
      { from: { r: 7, c: 1 }, to: { r: 5, c: 2 } }, // 2...Nc6
      { from: { r: 0, c: 5 }, to: { r: 3, c: 2 } }, // 3.Bc4
      { from: { r: 7, c: 5 }, to: { r: 6, c: 4 } }, // 3...Bc5 — first 6 plies of the Giuoco Piano main line
      // Remaining 2–4 plies for the Italian, plus full Ruy Lopez and Queen's Gambit
      // lines, are filled in during implementation (see "Open Question" below).
    ],
  },
  // { id: 'ruy-lopez', ... },
  // { id: 'queens-gambit', ... },
];
```

Coordinates: row 0 = rank 1 (White's back rank), col 0 = a-file — matches the convention already used by `ChessBoard` and `ChessRenderer.squareFromPixel`.

### `applyMove` helper (`chess-moves.js`)

Pure function. Replaces the move-application half of `ChessGame._executeMove`.

```js
function applyMove(board, enPassantTarget, move) {
  // Returns: { newBoard, newEnPassantTarget, capturedPiece, didCastle, didPromote, moverColor }
  // Handles: standard move, en passant (uses move.capturedRow/capturedCol), castling (uses move.castle),
  //          promotion (signaled by move.promoteTo). Never mutates input.
}
```

The `LearnMove` shape used by openings is `{ from:{r,c}, to:{r,c}, castle?, enPassant?, capturedRow?, capturedCol?, isDoubleStep? }` — the same fields `getLegalMoves` already produces, so a `LearnMove` is directly compatible with `applyMove`.

`ChessGame._executeMove` gets refactored to call `applyMove` and then handle promotion (which still lives in `ChessGame` because promotion UI uses the existing picker).

## Walkthrough Flow

1. `ChessLearn.startWalkthrough(openingId)`:
   - `ChessBoard.reset()`
   - Load `CHESS_OPENINGS[openingId].moves`
   - `step = 0`, state = `WALKTHROUGH`
2. Click any square:
   - If `from === moves[step].from` AND `to === moves[step].to` AND `board[from].player === expectedPlayer`:
     - `applyMove(...)`, `step++`
     - If `step === moves.length` → `COMPLETE`
   - Else: ignored (no penalty)
3. User-paced — moves only advance on click. No auto-play.
4. Caption: shows `opening.caption` for the whole walkthrough (single static line).

## Practice Flow

1. `ChessLearn.startPractice(openingId)`:
   - Same setup as walkthrough. `step = 0`, state = `PRACTICE`.
2. White's turn (step is even):
   - User clicks piece at `moves[step].from` then destination `moves[step].to`:
     - `applyMove`, `step++`
     - If `moves[step]` exists, after 300ms the app auto-plays Black's response: `applyMove`, `step++`
     - If `moves[step]` doesn't exist (end of line) → `COMPLETE`
   - User clicks the correct `from` but wrong `to`:
     - Flash red highlight on `from` square for 600ms
     - Then auto-play the correct move: `applyMove(moves[step])`, `step++`, then Black's response after 300ms
   - User clicks a piece that isn't `moves[step].from`: ignored (no flash, no penalty)
3. Black's turn (step is odd): user clicks are ignored. The 300ms timer auto-plays the response.
4. Caption: same as walkthrough — single static line.

## Renderer additions

| Function | Purpose |
|---|---|
| `renderLearnMenu()` | Centered title "Learn Chess Openings", list of openings with "Walkthrough" / "Practice" buttons each, "← Back" |
| `renderOpeningPicker()` | Same as `renderLearnMenu` (single function) |
| `renderLearnCaption(text)` | One line below the board (same Y as turn indicator). Hidden when text is `null` |
| `renderLearnComplete()` | Centered overlay "Opening complete — tap to continue" |
| `learnButtonFromPixel(px, py)` | Hit-test for learn UI |
| `backButtonFromPixel(px, py)` | Hit-test for the corner "← Back" button |

The main `_gameLoop` in `ChessGame` gets one new branch at the top: if `ChessLearn.isActive()`, dispatch to `ChessLearn.render()` which calls the appropriate renderer. Click routing in `_handleClick` likewise checks `ChessLearn.isActive()` first.

## Error Handling

- **Hand-authored opening data** — add `ChessOpenings.validate()` called once at module load. Rejects:
  - `from` or `to` outside `[0,7]×[0,7]`
  - First move starting from an empty square
  - First move's piece color not matching the expected player for that ply (even = White, odd = Black)
  - Logs errors to console and removes the bad opening from the picker
- **Unknown opening id** — `ChessLearn.start('italian', 'walkthrough')` with bad id → throws (caller bug, not user-facing)
- **Out-of-sync state** — if `applyMove` throws (e.g. the move shape doesn't match the board state — shouldn't happen if the validator passed), catch in `ChessLearn`, log to console, and transition to `LEARN_MENU`
- **Wrong-move spam** — practice has no rate limit; a frustrated user can rapid-click. Acceptable: wrong moves just get corrected, no state corruption

## Testing (`tests/learn.test.js`)

Mirror the style of the existing `tests/ch-integration.test.js`. Cover:

1. **`applyMove` correctness**
   - Standard pawn move sets `moved=true`
   - Pawn double-step sets `newEnPassantTarget` to the skipped square
   - En passant capture removes the captured pawn at the correct square
   - King-side castle relocates rook from col 7 to col 5
   - Queen-side castle relocates rook from col 0 to col 3
   - Does not mutate input board
2. **`ChessOpenings.validate`**
   - Accepts the three bundled openings
   - Rejects an opening with out-of-bounds coordinates
   - Rejects an opening whose first move starts on an empty square
3. **Walkthrough state machine**
   - Correct move advances `step`
   - Wrong `from` is ignored (no error, no advance)
   - Wrong `to` from correct `from` is ignored
   - Reaching `step === moves.length` transitions to `COMPLETE`
4. **Practice state machine**
   - Correct user move followed by correct Black response
   - Wrong `to` from correct `from` triggers correction flow (callback fired)
   - After end of line, `COMPLETE` is reached

Tests run via the same harness as the chaturanga tests (whatever the project uses — confirm during implementation).

## Files Touched — Final List

**New:**
- `js/chess-openings.js`
- `js/chess-learn.js`
- `tests/learn.test.js`

**Modified:**
- `js/chess-constants.js` — add `CHESS_LEARN_STATE`
- `js/chess-moves.js` — add `applyMove` (pure)
- `js/chess-game.js` — add Learn button to menu; route learn-states to `ChessLearn`; refactor `_executeMove` to call `applyMove`
- `js/chess-renderer.js` — add learn render functions
- `chess.html` — load new scripts
- `README.md` — mention Learn mode

**Untouched:**
- `js/chess-board.js`, `js/chess-pieces.js`, `js/chess-input.js`
- `css/chess-style.css`
- All chaturanga files
- `index.html`, `chaturanga.html`

## Open Question for Implementation

The actual main-line plies for each opening (after the first few moves) need to be filled in by the implementer. The data shape and validator are specified; the exact coordinates for Italian through move 10, Ruy Lopez through move 10, and Queen's Gambit through move 10 are implementation work — the spec guarantees the validator will catch any out-of-bounds or wrong-color entries, so author the lines, then run validation, then ship.
