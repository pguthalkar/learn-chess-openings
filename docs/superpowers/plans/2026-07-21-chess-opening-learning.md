# Chess Opening Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Learn" mode to `chess.html` (modern chess) that lets users study three classic openings as a guided walkthrough or practice drill.

**Architecture:** Add a new `ChessLearn` IIFE module that drives a small state machine. Move application is extracted from `ChessGame._executeMove` into a pure `applyMove` helper in `chess-moves.js`, used by both modules. Opening data lives in a separate static `chess-openings.js` file with a startup validator. No backend. Existing play-mode untouched.

**Tech Stack:** Vanilla JS (ES2020+), HTML5 Canvas, IIFE module pattern. Tests run via Node + `vm.runInThisContext` (same pattern as `tests/ch-integration.test.js`).

## Global Constraints

- No external dependencies; no build step; no backend
- Module pattern: IIFE assigned to `const Name = (() => { ... return { ... }; })();` — matches existing chess modules
- Script load order in `chess.html` matters: constants → board → moves → pieces → renderer → input → openings → game → learn
- Coordinate convention: row 0 = rank 1 (White back rank), col 0 = a-file
- Test harness: `tests/learn.test.js` mirrors `tests/ch-integration.test.js` — uses `fs`, `path`, `vm` to load modules into shared context
- Run tests with: `node tests/learn.test.js`
- All commits use `Co-Authored-By: Claude <noreply@anthropic.com>` trailer
- Commit prefixes: `feat:`, `test:`, `refactor:`, `chore:`, `docs:`

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `js/chess-constants.js` | Modify | Add `CHESS_LEARN_STATE` enum |
| `js/chess-moves.js` | Modify | Add pure `applyMove(board, enPassantTarget, move)` |
| `js/chess-game.js` | Modify | Add Learn button on menu; route learn clicks; refactor `_executeMove` to use `applyMove` |
| `js/chess-renderer.js` | Modify | Add `renderLearnMenu`, `renderLearnCaption`, `renderLearnComplete`, hit-test helpers |
| `js/chess-openings.js` | Create | Static opening data + validator |
| `js/chess-learn.js` | Create | Learn sub-state machine, replay driver, click routing |
| `chess.html` | Modify | Load the two new JS files |
| `README.md` | Modify | Mention Learn mode |
| `tests/learn.test.js` | Create | Tests for `applyMove`, validator, learn state machine |

---

## Task 1: Add `CHESS_LEARN_STATE` enum

**Files:**
- Modify: `js/chess-constants.js` (append after the `CHESS_GAME_STATE` block, before the `CHESS_COLORS` block)

**Interfaces:**
- Consumes: nothing
- Produces: global `CHESS_LEARN_STATE` with `{ MENU, WALKTHROUGH, PRACTICE, COMPLETE }`

- [ ] **Step 1: Edit `js/chess-constants.js`**

Find the block:
```js
// Game state enumeration
const CHESS_GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PROMOTING: 'promoting',
    GAME_OVER: 'game_over'
};
```

Add this block immediately after it:
```js
// Learn mode state enumeration
const CHESS_LEARN_STATE = {
    MENU: 'learn_menu',
    WALKTHROUGH: 'learn_walkthrough',
    PRACTICE: 'learn_practice',
    COMPLETE: 'learn_complete'
};
```

- [ ] **Step 2: Verify in browser console**

Open `chess.html` in a browser (e.g. `open chess.html` or `python3 -m http.server 8000`), open DevTools console, type:
```js
CHESS_LEARN_STATE
```
Expected output: `{MENU: 'learn_menu', WALKTHROUGH: 'learn_walkthrough', PRACTICE: 'learn_practice', COMPLETE: 'learn_complete'}`

- [ ] **Step 3: Commit**

```bash
git add js/chess-constants.js
git commit -m "feat: add CHESS_LEARN_STATE enum"
```

---

## Task 2: Add `applyMove` pure helper to `chess-moves.js`

**Files:**
- Modify: `js/chess-moves.js` (add new exported function; no other changes)
- Test: `tests/learn.test.js` (created in Task 3 — but the helper itself is testable now)

**Interfaces:**
- Consumes: `board` (8×8 array of piece objects or null), `enPassantTarget` (`{row,col}` or null), `move` (object with `from`, `to`, plus optional `castle`, `enPassant`, `capturedRow`, `capturedCol`, `isDoubleStep`, `promoteTo`)
- Produces: `{ newBoard, newEnPassantTarget, capturedPiece, didCastle, didPromote, moverColor }` — never mutates `board` or `enPassantTarget`
- `moverColor` is the `player` of the piece that moved

- [ ] **Step 1: Write failing test (deferred to Task 3, but write the test stubs first as a checkpoint)**

In `tests/learn.test.js` (file does not exist yet — create it with just the loader skeleton and an empty test group):
```js
/**
 * Chess Learn — applyMove + validator + state machine tests
 *
 * Run with: node tests/learn.test.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(filePath) {
    const absPath = path.resolve(__dirname, '..', filePath);
    const code = fs.readFileSync(absPath, 'utf8');
    vm.runInThisContext(code, { filename: absPath });
}

loadScript('js/chess-constants.js');
loadScript('js/chess-board.js');
loadScript('js/chess-moves.js');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.error(`  ✗ FAIL: ${msg}`); } }
function assertEqual(a, e, msg) { if (a === e) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.error(`  ✗ FAIL: ${msg} (expected ${e}, got ${a})`); } }

console.log('applyMove: placeholder — tests in Task 3');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run the test file to verify harness works**

Run: `node tests/learn.test.js`
Expected: prints `0 passed, 0 failed` and exits 0.

- [ ] **Step 3: Commit the test harness**

```bash
git add tests/learn.test.js
git commit -m "test: scaffold learn test harness"
```

---

## Task 3: Implement and test `applyMove`

**Files:**
- Modify: `js/chess-moves.js`
- Modify: `tests/learn.test.js`

**Interfaces:** (from Task 2) — same shape.

- [ ] **Step 1: Write failing tests for `applyMove`**

Replace the body of `tests/learn.test.js` (keep the loader) with:
```js
/**
 * Chess Learn — applyMove + validator + state machine tests
 *
 * Run with: node tests/learn.test.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(filePath) {
    const absPath = path.resolve(__dirname, '..', filePath);
    const code = fs.readFileSync(absPath, 'utf8');
    vm.runInThisContext(code, { filename: absPath });
}

loadScript('js/chess-constants.js');
loadScript('js/chess-board.js');
loadScript('js/chess-moves.js');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.error(`  ✗ FAIL: ${msg}`); } }
function assertEqual(a, e, msg) { if (a === e) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.error(`  ✗ FAIL: ${msg} (expected ${e}, got ${a})`); } }
function assertDeepEqual(a, e, msg) { if (JSON.stringify(a) === JSON.stringify(e)) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.error(`  ✗ FAIL: ${msg}\n    expected: ${JSON.stringify(e)}\n    got: ${JSON.stringify(a)}`); } }

// Standard pawn move: e2-e4
function test_applyMove_standardPawn() {
    const board = ChessBoard.getBoard();
    const result = ChessMoves.applyMove(board, null, { from: { r: 1, c: 4 }, to: { r: 3, c: 4 } });
    assert(result.newBoard[3][4] !== null, 'pawn lands on e4');
    assert(result.newBoard[3][4].type === 'pawn', 'piece is a pawn');
    assert(result.newBoard[3][4].moved === true, 'pawn marked moved');
    assert(result.newBoard[1][4] === null, 'e2 is empty');
    assert(result.moverColor === 1, 'mover is White');
    assert(result.didCastle === undefined, 'no castle');
    assert(result.didPromote === undefined, 'no promotion');
    // Immutability: original board still has pawn on e2
    assert(board[1][4] !== null, 'original board unchanged');
}

// Pawn double-step sets en passant target to the skipped square
function test_applyMove_doubleStepSetsEnPassant() {
    const board = ChessBoard.getBoard();
    const result = ChessMoves.applyMove(board, null, { from: { r: 1, c: 4 }, to: { r: 3, c: 4 }, isDoubleStep: true });
    assert(result.newEnPassantTarget !== null, 'en passant target set');
    assertEqual(result.newEnPassantTarget.row, 2, 'target is skipped row');
    assertEqual(result.newEnPassantTarget.col, 4, 'target is correct file');
}

// King-side castle relocates rook from h1 to f1
function test_applyMove_kingSideCastle() {
    // Build a minimal board with king e1, rook h1, empty f1/g1
    const empty = () => null;
    const king = { type: 'king', player: 1, moved: false };
    const rook = { type: 'rook', player: 1, moved: false };
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0][4] = king;
    board[0][7] = rook;

    const result = ChessMoves.applyMove(board, null, { from: { r: 0, c: 4 }, to: { r: 0, c: 6 }, castle: 'king' });
    assert(result.newBoard[0][6] !== null && result.newBoard[0][6].type === 'king', 'king on g1');
    assert(result.newBoard[0][5] !== null && result.newBoard[0][5].type === 'rook', 'rook on f1');
    assert(result.newBoard[0][7] === null, 'h1 empty');
    assert(result.didCastle === 'king', 'didCastle flag');
}

// Queen-side castle relocates rook from a1 to d1
function test_applyMove_queenSideCastle() {
    const king = { type: 'king', player: 1, moved: false };
    const rook = { type: 'rook', player: 1, moved: false };
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0][4] = king;
    board[0][0] = rook;

    const result = ChessMoves.applyMove(board, null, { from: { r: 0, c: 4 }, to: { r: 0, c: 2 }, castle: 'queen' });
    assert(result.newBoard[0][2] !== null && result.newBoard[0][2].type === 'king', 'king on c1');
    assert(result.newBoard[0][3] !== null && result.newBoard[0][3].type === 'rook', 'rook on d1');
    assert(result.newBoard[0][0] === null, 'a1 empty');
    assert(result.didCastle === 'queen', 'didCastle flag');
}

// En passant capture removes the captured pawn
function test_applyMove_enPassant() {
    // Black pawn on a4 (row 4, col 0), white pawn on b4 (row 4, col 1)
    // White plays b4-b5 wait — en passant: black played b7-b5 last move, en passant target is b6 (row 2, col 1).
    // White pawn on a5 (row 3, col 0) captures diagonally to b6.
    const whitePawn = { type: 'pawn', player: 1, moved: true };
    const blackPawn = { type: 'pawn', player: 2, moved: true };
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[3][0] = whitePawn;
    board[4][1] = blackPawn;
    const enPassantTarget = { row: 2, col: 1 };

    const result = ChessMoves.applyMove(board, enPassantTarget, { from: { r: 3, c: 0 }, to: { r: 2, c: 1 }, enPassant: true, capturedRow: 4, capturedCol: 1 });
    assert(result.newBoard[2][1] !== null && result.newBoard[2][1].type === 'pawn', 'white pawn on b6');
    assert(result.newBoard[2][1].player === 1, 'pawn is white');
    assert(result.newBoard[4][1] === null, 'captured black pawn removed');
    assert(result.capturedPiece !== null && result.capturedPiece.player === 2, 'capturedPiece returned');
}

// Immutability: a standard move does not modify the input board
function test_applyMove_doesNotMutateInput() {
    const board = ChessBoard.getBoard();
    const snapshot = JSON.stringify(board);
    ChessMoves.applyMove(board, null, { from: { r: 1, c: 4 }, to: { r: 3, c: 4 } });
    assert(JSON.stringify(board) === snapshot, 'input board unchanged after applyMove');
}

console.log('applyMove');
test_applyMove_standardPawn();
test_applyMove_doubleStepSetsEnPassant();
test_applyMove_kingSideCastle();
test_applyMove_queenSideCastle();
test_applyMove_enPassant();
test_applyMove_doesNotMutateInput();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run tests, expect failure**

Run: `node tests/learn.test.js`
Expected: tests fail with `TypeError: ChessMoves.applyMove is not a function`.

- [ ] **Step 3: Implement `applyMove` in `js/chess-moves.js`**

Find the end of `ChessMoves` (the `return { ... };` block). Add `applyMove` as a private helper and export it.

First, add a private helper inside the IIFE, just above the `return`:
```js
    /**
     * applyMove — pure helper that applies a move to a cloned board and returns
     * the new state. Mirrors the move-application half of ChessGame._executeMove
     * (standard move, en passant, castling, promotion signal) but never mutates
     * the input board. Used by both ChessGame and ChessLearn.
     * @returns {{ newBoard:Array, newEnPassantTarget:object|null, capturedPiece:object|null, didCastle:string|undefined, didPromote:boolean, moverColor:number }}
     */
    function applyMove(board, enPassantTarget, move) {
        // Deep-clone the board
        const newBoard = board.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));

        const piece = newBoard[move.from.r][move.from.c];
        if (!piece) {
            throw new Error('applyMove: no piece at source square');
        }

        let didCastle = undefined;
        let capturedPiece = null;
        const moverColor = piece.player;

        if (move.enPassant) {
            capturedPiece = newBoard[move.capturedRow][move.capturedCol];
            newBoard[move.capturedRow][move.capturedCol] = null;
        } else {
            capturedPiece = newBoard[move.to.r][move.to.c];
        }

        // Move the piece
        newBoard[move.to.r][move.to.c] = piece;
        newBoard[move.from.r][move.from.c] = null;
        piece.moved = true;

        if (move.castle === 'king') {
            const rook = newBoard[move.from.r][7];
            newBoard[move.from.r][5] = rook;
            newBoard[move.from.r][7] = null;
            if (rook) rook.moved = true;
            didCastle = 'king';
        } else if (move.castle === 'queen') {
            const rook = newBoard[move.from.r][0];
            newBoard[move.from.r][3] = rook;
            newBoard[move.from.r][0] = null;
            if (rook) rook.moved = true;
            didCastle = 'queen';
        }

        const newEnPassantTarget = move.isDoubleStep
            ? { row: (move.from.r + move.to.r) / 2, col: move.from.c }
            : null;

        const didPromote = !!move.promoteTo;
        if (didPromote) {
            piece.type = move.promoteTo;
        }

        return { newBoard, newEnPassantTarget, capturedPiece, didCastle, didPromote, moverColor };
    }
```

Then update the `return` block to include `applyMove`:
```js
    return {
        getPseudoMoves: getPseudoMoves,
        getLegalMoves: getLegalMoves,
        hasAnyLegalMove: hasAnyLegalMove,
        isInCheck: isInCheck,
        isSquareAttacked: isSquareAttacked,
        applyMove: applyMove
    };
```

- [ ] **Step 4: Run tests, expect pass**

Run: `node tests/learn.test.js`
Expected: `6 passed, 0 failed` and exit 0.

- [ ] **Step 5: Commit**

```bash
git add js/chess-moves.js tests/learn.test.js
git commit -m "feat: add pure applyMove helper for board mutation"
```

---

## Task 4: Refactor `ChessGame._executeMove` to use `applyMove`

**Files:**
- Modify: `js/chess-game.js` (lines 119–159)

**Interfaces:** `ChessMoves.applyMove` from Task 3.

- [ ] **Step 1: Manually verify existing play mode still works**

Open `chess.html` in a browser, play a few moves (e2-e4, e7-e5, g1-f3). Confirm pieces move, turn indicator updates. (This is the baseline; if it's already broken, fix that first before refactoring.)

- [ ] **Step 2: Refactor `_executeMove`**

Replace the entire `_executeMove` function in `js/chess-game.js` (currently lines 119–159) with:
```js
    function _executeMove(move) {
        const fromRow = selectedSquare.row;
        const fromCol = selectedSquare.col;
        const board = ChessBoard.getBoard();
        const enPassantBefore = enPassantTarget;
        const result = ChessMoves.applyMove(board, enPassantBefore, move);

        // Sync engine state with the result
        for (let r = 0; r < CHESS_BOARD_SIZE; r++) {
            for (let c = 0; c < CHESS_BOARD_SIZE; c++) {
                ChessBoard.setPiece(r, c, result.newBoard[r][c]);
            }
        }
        enPassantTarget = result.newEnPassantTarget;

        const movingPiece = result.newBoard[move.to.row][move.to.col];

        selectedSquare = null;
        legalMoves = [];

        const promotionRank = (movingPiece.player === CHESS_PLAYER.ONE) ? 7 : 0;
        if (movingPiece.type === CHESS_PIECE_TYPE.PAWN && move.to.row === promotionRank) {
            pendingPromotion = { row: move.to.row, col: move.to.col, player: movingPiece.player };
            gameState = CHESS_GAME_STATE.PROMOTING;
        } else {
            _switchTurn();
        }
    }
```

Note: this uses `ChessBoard.setPiece` to sync the cloned board back. The double-step en passant target is now computed by `applyMove` from `move.isDoubleStep` (the existing `_executeMove` did the same). The new code drops the manual castle rook relocation since `applyMove` handles it via `move.castle`.

- [ ] **Step 3: Verify play mode still works**

Reload `chess.html`. Play:
- e2-e4, e7-e5, g1-f3, b8-c6, f1-c4 (Italian up to here)
- Castle king-side as White (e1-g1)
- En passant: from starting position, play e2-e4, a7-a6, e4-e5, d7-d5, e5-d6 (en passant)

Confirm:
- All standard moves work
- Castle relocates the rook visually
- En passant removes the captured pawn
- Promotion picker still appears when pawn reaches last rank

- [ ] **Step 4: Run the existing test to make sure nothing regressed**

Run: `node tests/ch-integration.test.js`
Expected: all chaturanga tests still pass (note: this test only loads ch-* modules, so it's unaffected, but run it to confirm the harness is healthy).

- [ ] **Step 5: Commit**

```bash
git add js/chess-game.js
git commit -m "refactor: use ChessMoves.applyMove in _executeMove"
```

---

## Task 5: Create `chess-openings.js` with data and validator

**Files:**
- Create: `js/chess-openings.js`
- Modify: `tests/learn.test.js` (add validator tests)

**Interfaces:**
- Produces: global `CHESS_OPENINGS` (array of opening objects) and `ChessOpenings` IIFE with `getAll()`, `getById(id)`, `validate()`

- [ ] **Step 1: Write failing validator tests**

Append to `tests/learn.test.js` (before the final `console.log`/`process.exit`):
```js
loadScript('js/chess-openings.js');

console.log('\nChessOpenings.validate');
test_openings_validate_accepts_bundled();
test_openings_validate_rejects_out_of_bounds();
test_openings_validate_rejects_empty_start();

function test_openings_validate_accepts_bundled() {
    const result = ChessOpenings.validate();
    assert(result.valid.length === 3, 'all three bundled openings pass validation');
    assert(result.invalid.length === 0, 'no invalid openings');
}

function test_openings_validate_rejects_out_of_bounds() {
    // Mutate the openings to include a bad one, then re-validate
    const original = CHESS_OPENINGS.slice();
    CHESS_OPENINGS.push({
        id: 'bad-bounds',
        name: 'Bad Bounds',
        caption: 'oob',
        moves: [{ from: { r: 0, c: 0 }, to: { r: 8, c: 0 } }]
    });
    const result = ChessOpenings.validate();
    assert(result.invalid.some(o => o.id === 'bad-bounds'), 'bad-bounds rejected');
    // Restore
    CHESS_OPENINGS.length = 0;
    CHESS_OPENINGS.push(...original);
}

function test_openings_validate_rejects_empty_start() {
    const original = CHESS_OPENINGS.slice();
    CHESS_OPENINGS.push({
        id: 'bad-empty',
        name: 'Bad Empty',
        caption: 'empty',
        moves: [{ from: { r: 3, c: 3 }, to: { r: 4, c: 3 } }] // e4 starts on an empty square
    });
    const result = ChessOpenings.validate();
    assert(result.invalid.some(o => o.id === 'bad-empty'), 'bad-empty rejected');
    CHESS_OPENINGS.length = 0;
    CHESS_OPENINGS.push(...original);
}
```

- [ ] **Step 2: Run tests, expect failure**

Run: `node tests/learn.test.js`
Expected: `Error: Cannot find module` or `ChessOpenings is not defined`.

- [ ] **Step 3: Create `js/chess-openings.js`**

```js
/**
 * Modern Chess — Opening Definitions and Validator
 * Static data for the Learn mode's curated openings.
 */

const CHESS_OPENINGS = [
    {
        id: 'italian',
        name: 'Italian Game',
        caption: 'Italian: e4 e5, knights out, bishop to c4.',
        moves: [
            { from: { r: 1, c: 4 }, to: { r: 3, c: 4 } },
            { from: { r: 6, c: 4 }, to: { r: 4, c: 4 } },
            { from: { r: 0, c: 6 }, to: { r: 2, c: 5 } },
            { from: { r: 7, c: 1 }, to: { r: 5, c: 2 } },
            { from: { r: 0, c: 5 }, to: { r: 3, c: 2 } },
            { from: { r: 7, c: 5 }, to: { r: 6, c: 4 } },
            { from: { r: 0, c: 2 }, to: { r: 4, c: 6 } },
            { from: { r: 7, c: 6 }, to: { r: 5, c: 5 } },
            { from: { r: 0, c: 1 }, to: { r: 2, c: 3 } },
            { from: { r: 5, c: 5 }, to: { r: 4, c: 6 } }
        ]
    },
    {
        id: 'ruy-lopez',
        name: 'Ruy Lopez',
        caption: 'Ruy Lopez: e4 e5, Nf3 Nc6, Bb5 — pressure on the e5 pawn.',
        moves: [
            { from: { r: 1, c: 4 }, to: { r: 3, c: 4 } },
            { from: { r: 6, c: 4 }, to: { r: 4, c: 4 } },
            { from: { r: 0, c: 6 }, to: { r: 2, c: 5 } },
            { from: { r: 7, c: 1 }, to: { r: 5, c: 2 } },
            { from: { r: 0, c: 5 }, to: { r: 3, c: 1 } },
            { from: { r: 7, c: 5 }, to: { r: 6, c: 4 } },
            { from: { r: 0, c: 1 }, to: { r: 2, c: 2 } },
            { from: { r: 5, c: 2 }, to: { r: 4, c: 1 } },
            { from: { r: 0, c: 4 }, to: { r: 0, c: 6 } },
            { from: { r: 6, c: 3 }, to: { r: 5, c: 4 } }
        ]
    },
    {
        id: 'queens-gambit',
        name: "Queen's Gambit",
        caption: "Queen's Gambit: d4 d5, c4 — offer a pawn for center control.",
        moves: [
            { from: { r: 1, c: 3 }, to: { r: 3, c: 3 } },
            { from: { r: 6, c: 3 }, to: { r: 4, c: 3 } },
            { from: { r: 1, c: 2 }, to: { r: 3, c: 2 } },
            { from: { r: 6, c: 5 }, to: { r: 5, c: 5 } },
            { from: { r: 0, c: 6 }, to: { r: 2, c: 5 } },
            { from: { r: 6, c: 6 }, to: { r: 5, c: 6 } },
            { from: { r: 0, c: 5 }, to: { r: 3, c: 2 } },
            { from: { r: 4, c: 3 }, to: { r: 3, c: 2 } },
            { from: { r: 0, c: 2 }, to: { r: 4, c: 6 } },
            { from: { r: 5, c: 6 }, to: { r: 4, c: 5 } }
        ]
    }
];

const ChessOpenings = (() => {
    'use strict';

    function _isInBounds(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    /**
     * Validate the CHESS_OPENINGS array. Returns { valid: [...], invalid: [...] }.
     * Each invalid entry includes an `errors` array of human-readable strings.
     */
    function validate() {
        const valid = [];
        const invalid = [];
        const startingBoard = CHESS_INITIAL_POSITIONS;

        for (let i = 0; i < CHESS_OPENINGS.length; i++) {
            const op = CHESS_OPENINGS[i];
            const errors = [];

            if (!op.id) errors.push('missing id');
            if (!op.name) errors.push('missing name');
            if (!op.caption) errors.push('missing caption');
            if (!Array.isArray(op.moves) || op.moves.length === 0) {
                errors.push('moves must be a non-empty array');
                invalid.push({ id: op.id || `<index ${i}>`, errors });
                continue;
            }

            // Replay the moves on a clone, checking shape and color each ply
            const board = startingBoard.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));

            for (let m = 0; m < op.moves.length; m++) {
                const mv = op.moves[m];
                const expectedColor = (m % 2 === 0) ? 1 : 2;

                if (!mv.from || !mv.to) {
                    errors.push(`move ${m}: missing from/to`);
                    break;
                }
                if (!_isInBounds(mv.from.r, mv.from.c) || !_isInBounds(mv.to.r, mv.to.c)) {
                    errors.push(`move ${m}: out-of-bounds coordinates`);
                    break;
                }
                const piece = board[mv.from.r][mv.from.c];
                if (!piece) {
                    errors.push(`move ${m}: source square is empty`);
                    break;
                }
                if (piece.player !== expectedColor) {
                    errors.push(`move ${m}: wrong color (expected ${expectedColor}, got ${piece.player})`);
                    break;
                }

                // Apply the move using applyMove
                try {
                    const result = ChessMoves.applyMove(board, null, mv);
                    // Mutate our replay board with the result
                    for (let r = 0; r < 8; r++) {
                        for (let c = 0; c < 8; c++) {
                            board[r][c] = result.newBoard[r][c];
                        }
                    }
                } catch (e) {
                    errors.push(`move ${m}: applyMove threw: ${e.message}`);
                    break;
                }
            }

            if (errors.length === 0) {
                valid.push(op);
            } else {
                invalid.push({ id: op.id, errors });
            }
        }

        return { valid, invalid };
    }

    function getAll() {
        return CHESS_OPENINGS.slice();
    }

    function getById(id) {
        return CHESS_OPENINGS.find(o => o.id === id) || null;
    }

    return { validate, getAll, getById };
})();
```

- [ ] **Step 4: Run tests, expect pass**

Run: `node tests/learn.test.js`
Expected: all `applyMove` tests pass + 3 validator tests pass = `9 passed, 0 failed`. The validation output may log warnings to console for the bad-bounds and bad-empty cases (from the negative test cases themselves, which is expected).

- [ ] **Step 5: Commit**

```bash
git add js/chess-openings.js tests/learn.test.js
git commit -m "feat: add chess openings data and validator"
```

---

## Task 6: Add Learn button to menu in `chess-game.js`

**Files:**
- Modify: `js/chess-game.js` (add `learnButtonFromPixel` hit-test; update menu click handler)
- Modify: `js/chess-renderer.js` (add `renderLearnButtonOnMenu` and the hit-test helper)

**Interfaces:**
- `ChessLearn` global will be defined in Task 7 — this task stubs the click routing
- `ChessRenderer.learnButtonFromPixel(px, py)` returns boolean (clicked the Learn button or not)

- [ ] **Step 1: Add Learn button rendering to `chess-renderer.js`**

In `chess-renderer.js`, add a module-level variable alongside `promotionRects`:
```js
    let menuLearnButtonRect = null;
```

Replace `renderMenuScreen` with the version below (adds a Learn button below "Click to Start"):
```js
    function renderMenuScreen() {
        ctx.fillStyle = CHESS_COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleSize = Math.max(36, Math.min(canvas.width, canvas.height) * 0.08);
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.fillText('CHESS', centerX, centerY - titleSize * 1.6);

        const lineWidth = titleSize * 3;
        ctx.strokeStyle = CHESS_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth / 2, centerY - titleSize * 0.9);
        ctx.lineTo(centerX + lineWidth / 2, centerY - titleSize * 0.9);
        ctx.stroke();

        const subtitleSize = Math.max(18, titleSize * 0.4);
        ctx.font = `${subtitleSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textSecondary;
        ctx.fillText('Standard Rules', centerX, centerY - titleSize * 0.4);

        _drawButton(centerX, centerY + titleSize * 0.6, 'Click to Start', titleSize * 0.45);

        // Learn button — stores its hit-rect in menuLearnButtonRect
        const learnY = centerY + titleSize * 1.6;
        const learnSize = titleSize * 0.45;
        const learnMetrics = ctx.measureText('Learn Openings');
        const learnPadX = learnSize * 0.8;
        const learnPadY = learnSize * 0.5;
        menuLearnButtonRect = {
            x: centerX - learnMetrics.width / 2 - learnPadX,
            y: learnY - learnPadY,
            w: learnMetrics.width + learnPadX * 2,
            h: learnSize + learnPadY * 2
        };
        ctx.fillStyle = CHESS_COLORS.border;
        ctx.fillRect(menuLearnButtonRect.x, menuLearnButtonRect.y, menuLearnButtonRect.w, menuLearnButtonRect.h);
        ctx.strokeStyle = CHESS_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.strokeRect(menuLearnButtonRect.x, menuLearnButtonRect.y, menuLearnButtonRect.w, menuLearnButtonRect.h);
        ctx.font = `bold ${learnSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Learn Openings', centerX, learnY + learnSize * 0.35);

        ctx.restore();
    }
```

Add a hit-test function. Add inside the IIFE, after `promotionChoiceFromPixel`:
```js
    function learnButtonFromPixel(px, py) {
        if (!menuLearnButtonRect) return false;
        const r = menuLearnButtonRect;
        return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
    }
```

Update the returned object to include `learnButtonFromPixel`:
```js
    return {
        init,
        resize,
        getBoardMetrics,
        squareFromPixel,
        promotionChoiceFromPixel,
        learnButtonFromPixel,
        renderBoard,
        renderBorder,
        renderCoordinates,
        renderPieces,
        renderHighlights,
        renderCheckIndicator,
        renderTurnIndicator,
        renderMenuScreen,
        renderGameOver,
        renderPromotionPicker,
        clear
    };
```

- [ ] **Step 2: Update `ChessGame._handleClick` to route Learn**

In `js/chess-game.js`, replace the MENU branch of `_handleClick`:
```js
    function _handleClick(point) {
        if (gameState === CHESS_GAME_STATE.MENU) {
            if (ChessRenderer.learnButtonFromPixel(point.px, point.py)) {
                if (typeof ChessLearn !== 'undefined' && ChessLearn.openMenu) {
                    ChessLearn.openMenu();
                }
                return;
            }
            _startNewGame();
        } else if (gameState === CHESS_GAME_STATE.GAME_OVER) {
            _startNewGame();
        } else if (gameState === CHESS_GAME_STATE.PROMOTING) {
            const choiceIndex = ChessRenderer.promotionChoiceFromPixel(point.px, point.py);
            if (choiceIndex !== null) {
                _finalizePromotion(choiceIndex);
            }
        } else if (gameState === CHESS_GAME_STATE.PLAYING) {
            const square = ChessRenderer.squareFromPixel(point.px, point.py);
            if (!square) {
                return;
            }
            const { row, col } = square;

            const move = legalMoves.find((m) => m.row === row && m.col === col);

            if (move) {
                _executeMove(move);
            } else {
                const piece = ChessBoard.getPiece(row, col);
                if (piece && piece.player === activePlayer) {
                    _selectPiece(row, col);
                } else {
                    selectedSquare = null;
                    legalMoves = [];
                }
            }
        }
    }
```

Note the `typeof ChessLearn !== 'undefined'` guard so the game still works if `chess-learn.js` is not loaded (during the interim before Task 7).

- [ ] **Step 3: Verify in browser**

Open `chess.html`. You should see two buttons: "Click to Start" and "Learn Openings". Clicking "Click to Start" plays normally. Clicking "Learn Openings" does nothing yet (Task 7 wires it up).

- [ ] **Step 4: Commit**

```bash
git add js/chess-renderer.js js/chess-game.js
git commit -m "feat: add Learn button to chess menu"
```

---

## Task 7: Create `chess-learn.js` with state machine and click routing

**Files:**
- Create: `js/chess-learn.js`
- Modify: `chess.html` (load new script)

**Interfaces:**
- `ChessLearn.isActive()` → boolean (true when any learn state is active)
- `ChessLearn.openMenu()` → transitions to `LEARN_MENU`
- `ChessLearn.start(openingId, mode)` where mode ∈ `'walkthrough'|'practice'`
- `ChessLearn.handleClick({px,py})` → process a click in a learn state
- `ChessLearn.render(ctx)` → draw the current learn state's UI
- `ChessLearn.exit()` → return to main MENU

- [ ] **Step 1: Create `js/chess-learn.js`**

```js
/**
 * Modern Chess — Learn Mode
 * Sub-state machine for studying curated openings as either
 * a user-paced walkthrough or a practice drill.
 *
 * The main game state stays in CHESS_GAME_STATE.MENU while Learn is active;
 * ChessLearn owns its own state via CHESS_LEARN_STATE.
 *
 * Move application goes through ChessMoves.applyMove. The board is the
 * same ChessBoard the main game uses — Learn is a guest, not a parallel engine.
 */

const ChessLearn = (() => {
    'use strict';

    let state = null;             // one of CHESS_LEARN_STATE.*
    let opening = null;           // current opening object
    let step = 0;                 // index into opening.moves
    let selectedFrom = null;      // {r, c} — piece user clicked first
    let wrongFlash = null;        // {square:{r,c}, until:number} for red flash
    let pendingBlackMove = null;  // timeout id for the 300ms Black auto-play
    let lastError = null;         // {message} for error overlay

    const BLACK_RESPONSE_DELAY_MS = 300;
    const WRONG_MOVE_FLASH_MS = 600;

    function _clearTimers() {
        if (pendingBlackMove !== null) {
            clearTimeout(pendingBlackMove);
            pendingBlackMove = null;
        }
    }

    function _expectedPlayer() {
        return (step % 2 === 0) ? CHESS_PLAYER.ONE : CHESS_PLAYER.TWO;
    }

    function _applyStep() {
        const move = opening.moves[step];
        const board = ChessBoard.getBoard();
        let result;
        try {
            result = ChessMoves.applyMove(board, null, move);
        } catch (e) {
            lastError = { message: 'applyMove failed at step ' + step + ': ' + e.message };
            state = CHESS_LEARN_STATE.MENU;
            return;
        }
        for (let r = 0; r < CHESS_BOARD_SIZE; r++) {
            for (let c = 0; c < CHESS_BOARD_SIZE; c++) {
                ChessBoard.setPiece(r, c, result.newBoard[r][c]);
            }
        }
        step++;
    }

    function _checkEndOrContinue() {
        if (step >= opening.moves.length) {
            state = CHESS_LEARN_STATE.COMPLETE;
            return;
        }
        // If next move is Black's, auto-play it after a short delay
        if (_expectedPlayer() === CHESS_PLAYER.TWO && state === CHESS_LEARN_STATE.PRACTICE) {
            _clearTimers();
            pendingBlackMove = setTimeout(() => {
                pendingBlackMove = null;
                if (state === CHESS_LEARN_STATE.PRACTICE && step < opening.moves.length && _expectedPlayer() === CHESS_PLAYER.TWO) {
                    _applyStep();
                    _checkEndOrContinue();
                }
            }, BLACK_RESPONSE_DELAY_MS);
        }
    }

    function openMenu() {
        _clearTimers();
        ChessBoard.reset();
        state = CHESS_LEARN_STATE.MENU;
        opening = null;
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
    }

    function start(openingId, mode) {
        _clearTimers();
        const op = ChessOpenings.getById(openingId);
        if (!op) {
            lastError = { message: 'Unknown opening: ' + openingId };
            state = CHESS_LEARN_STATE.MENU;
            return;
        }
        ChessBoard.reset();
        opening = op;
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
        state = (mode === 'practice') ? CHESS_LEARN_STATE.PRACTICE : CHESS_LEARN_STATE.WALKTHROUGH;
        // If first move is Black's somehow, play it (shouldn't happen with our data — White always moves first)
        if (_expectedPlayer() === CHESS_PLAYER.TWO) {
            _applyStep();
        }
    }

    function exit() {
        _clearTimers();
        ChessBoard.reset();
        state = null;
        opening = null;
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
    }

    function isActive() {
        return state !== null;
    }

    function handleClick(point) {
        if (state === CHESS_LEARN_STATE.MENU) {
            const opener = ChessRenderer.learnOpenerFromPixel(point.px, point.py);
            if (opener) {
                start(opener.id, opener.mode);
            }
            return;
        }
        if (state === CHESS_LEARN_STATE.WALKTHROUGH) {
            _handleWalkthroughClick(point);
            return;
        }
        if (state === CHESS_LEARN_STATE.PRACTICE) {
            _handlePracticeClick(point);
            return;
        }
        if (state === CHESS_LEARN_STATE.COMPLETE) {
            openMenu();
            return;
        }
    }

    function _handleWalkthroughClick(point) {
        const sq = ChessRenderer.squareFromPixel(point.px, point.py);
        if (!sq) return;
        const expected = opening.moves[step];
        const piece = ChessBoard.getPiece(sq.row, sq.col);

        if (!selectedFrom) {
            // Pick a piece — accept any of the active player's pieces that could plausibly move
            if (piece && piece.player === _expectedPlayer() &&
                sq.row === expected.from.r && sq.col === expected.from.c) {
                selectedFrom = { r: sq.row, c: sq.col };
            }
            return;
        }

        if (sq.row === expected.to.r && sq.col === expected.to.c &&
            selectedFrom.r === expected.from.r && selectedFrom.c === expected.from.c) {
            // Correct move — apply
            _applyStep();
            selectedFrom = null;
            if (step >= opening.moves.length) {
                state = CHESS_LEARN_STATE.COMPLETE;
            }
        } else {
            // Wrong destination — just deselect
            selectedFrom = null;
        }
    }

    function _handlePracticeClick(point) {
        // Black's turn — clicks are ignored
        if (_expectedPlayer() === CHESS_PLAYER.TWO) return;

        const sq = ChessRenderer.squareFromPixel(point.px, point.py);
        if (!sq) return;
        const expected = opening.moves[step];
        const piece = ChessBoard.getPiece(sq.row, sq.col);

        if (!selectedFrom) {
            // Selecting a piece — accept if it matches the expected source
            if (sq.row === expected.from.r && sq.col === expected.from.c) {
                selectedFrom = { r: sq.row, c: sq.col };
            }
            return;
        }

        // Already have selectedFrom. Check destination.
        if (sq.row === expected.to.r && sq.col === expected.to.c) {
            // Correct
            _applyStep();
            selectedFrom = null;
            _checkEndOrContinue();
        } else {
            // Wrong destination — flash and auto-correct
            wrongFlash = { square: { r: selectedFrom.r, c: selectedFrom.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            selectedFrom = null;
            setTimeout(() => {
                if (state !== CHESS_LEARN_STATE.PRACTICE) return;
                if (wrongFlash) wrongFlash = null;
                _applyStep();
                _checkEndOrContinue();
            }, WRONG_MOVE_FLASH_MS);
        }
    }

    function render(ctx) {
        if (state === CHESS_LEARN_STATE.MENU) {
            ChessRenderer.renderLearnMenu(ctx);
            return;
        }
        if (state === CHESS_LEARN_STATE.WALKTHROUGH || state === CHESS_LEARN_STATE.PRACTICE) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            // Highlight selectedFrom in walkthrough and practice
            if (selectedFrom) {
                ChessRenderer.renderHighlights(selectedFrom, []);
            }
            // Caption
            const caption = opening ? opening.caption : '';
            ChessRenderer.renderLearnCaption(caption);
            // Wrong-move flash overlay
            if (wrongFlash && Date.now() < wrongFlash.until) {
                ChessRenderer.renderWrongFlash(wrongFlash.square);
            }
            // Back button
            ChessRenderer.renderBackButton();
            return;
        }
        if (state === CHESS_LEARN_STATE.COMPLETE) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            ChessRenderer.renderLearnComplete();
            return;
        }
    }

    return {
        openMenu,
        start,
        exit,
        isActive,
        handleClick,
        render,
        getState: () => state,
        getError: () => lastError
    };
})();
```

- [ ] **Step 2: Add the Learn render functions to `chess-renderer.js`**

Add these functions to the `ChessRenderer` IIFE (before the `return` block):

```js
    let learnMenuRects = [];      // [{x,y,w,h,openingId,mode}]
    let backButtonRect = null;

    function renderLearnMenu(ctx) {
        learnMenuRects = [];
        ctx.save();
        ctx.fillStyle = CHESS_COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const titleSize = Math.max(28, Math.min(canvas.width, canvas.height) * 0.05);
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Learn Chess Openings', centerX, titleSize * 1.5);

        const openings = ChessOpenings.getAll();
        const rowHeight = titleSize * 1.3;
        const startY = titleSize * 3;

        for (let i = 0; i < openings.length; i++) {
            const op = openings[i];
            const y = startY + i * rowHeight;
            ctx.font = `bold ${titleSize * 0.5}px sans-serif`;
            ctx.fillStyle = CHESS_COLORS.textPrimary;
            ctx.fillText(op.name, centerX - titleSize * 2.5, y);

            // Two buttons: Walkthrough, Practice
            const btnW = titleSize * 2.8;
            const btnH = titleSize * 0.7;
            const walkX = centerX;
            const pracX = centerX + btnW + titleSize * 0.5;

            _drawLearnButton(walkX, y, btnW, btnH, 'Walkthrough', 'walkthrough', op.id);
            _drawLearnButton(pracX, y, btnW, btnH, 'Practice', 'practice', op.id);
        }

        // Back button
        backButtonRect = {
            x: titleSize * 0.5,
            y: titleSize * 0.5,
            w: titleSize * 2.5,
            h: titleSize * 0.9
        };
        ctx.fillStyle = CHESS_COLORS.border;
        ctx.fillRect(backButtonRect.x, backButtonRect.y, backButtonRect.w, backButtonRect.h);
        ctx.strokeStyle = CHESS_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.strokeRect(backButtonRect.x, backButtonRect.y, backButtonRect.w, backButtonRect.h);
        ctx.font = `bold ${titleSize * 0.4}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('← Back', backButtonRect.x + backButtonRect.w / 2, backButtonRect.y + backButtonRect.h / 2);

        ctx.restore();
    }

    function _drawLearnButton(centerX, centerY, w, h, label, mode, openingId) {
        const x = centerX - w / 2;
        const y = centerY - h / 2;
        ctx.fillStyle = CHESS_COLORS.border;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = CHESS_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.font = `bold ${h * 0.5}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, centerX, centerY);
        learnMenuRects.push({ x, y, w, h, mode, openingId });
    }

    function learnOpenerFromPixel(px, py) {
        for (let i = 0; i < learnMenuRects.length; i++) {
            const r = learnMenuRects[i];
            if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) {
                return { id: r.openingId, mode: r.mode };
            }
        }
        return null;
    }

    function renderBackButton() {
        const fontSize = Math.max(14, squareSize * 0.25);
        const w = fontSize * 4;
        const h = fontSize * 1.8;
        backButtonRect = { x: 12, y: 12, w, h };
        ctx.save();
        ctx.fillStyle = CHESS_COLORS.border;
        ctx.fillRect(backButtonRect.x, backButtonRect.y, w, h);
        ctx.strokeStyle = CHESS_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.strokeRect(backButtonRect.x, backButtonRect.y, w, h);
        ctx.font = `bold ${fontSize * 0.7}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('← Back', backButtonRect.x + w / 2, backButtonRect.y + h / 2);
        ctx.restore();
    }

    function backButtonFromPixel(px, py) {
        if (!backButtonRect) return false;
        const r = backButtonRect;
        return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
    }

    function renderLearnCaption(text) {
        if (!text) return;
        const fontSize = Math.max(14, squareSize * 0.22);
        const textY = offsetY + boardSize + squareSize * 0.55;
        ctx.save();
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, textY);
        ctx.restore();
    }

    function renderWrongFlash(square) {
        const x = offsetX + square.c * squareSize;
        const y = offsetY + (7 - square.r) * squareSize;
        ctx.save();
        ctx.fillStyle = 'rgba(211, 47, 47, 0.5)';
        ctx.fillRect(x, y, squareSize, squareSize);
        ctx.strokeStyle = CHESS_COLORS.check;
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 4, y + 4, squareSize - 8, squareSize - 8);
        ctx.restore();
    }

    function renderLearnComplete() {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const titleSize = Math.max(28, Math.min(canvas.width, canvas.height) * 0.06);
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.fillText('Opening Complete', centerX, centerY - titleSize * 0.5);
        const subSize = titleSize * 0.5;
        ctx.font = `${subSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textSecondary;
        ctx.fillText('Tap to continue', centerX, centerY + titleSize * 0.5);
        ctx.restore();
    }
```

Update the `return` block to expose the new functions:
```js
    return {
        init,
        resize,
        getBoardMetrics,
        squareFromPixel,
        promotionChoiceFromPixel,
        learnButtonFromPixel,
        learnOpenerFromPixel,
        backButtonFromPixel,
        renderBoard,
        renderBorder,
        renderCoordinates,
        renderPieces,
        renderHighlights,
        renderCheckIndicator,
        renderTurnIndicator,
        renderMenuScreen,
        renderGameOver,
        renderPromotionPicker,
        renderLearnMenu,
        renderLearnCaption,
        renderLearnComplete,
        renderWrongFlash,
        renderBackButton,
        clear
    };
```

- [ ] **Step 3: Update `chess-game.js` to dispatch to Learn**

Replace the `_gameLoop` function with this version (adds a branch at the top for learn):
```js
    function _gameLoop() {
        ChessRenderer.clear();

        if (ChessLearn.isActive()) {
            ChessLearn.render();
            requestAnimationFrame(_gameLoop);
            return;
        }

        if (gameState === CHESS_GAME_STATE.MENU) {
            ChessRenderer.renderMenuScreen();
        } else if (gameState === CHESS_GAME_STATE.PLAYING) {
            const board = ChessBoard.getBoard();
            const inCheck = ChessMoves.isInCheck(board, activePlayer);

            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            if (inCheck) {
                ChessRenderer.renderCheckIndicator(ChessBoard.findKing(activePlayer));
            }
            ChessRenderer.renderHighlights(selectedSquare, legalMoves);
            ChessRenderer.renderPieces(board);
            ChessRenderer.renderCoordinates();
            ChessRenderer.renderTurnIndicator(activePlayer, inCheck);
        } else if (gameState === CHESS_GAME_STATE.PROMOTING) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            ChessRenderer.renderPromotionPicker(pendingPromotion.player);
        } else if (gameState === CHESS_GAME_STATE.GAME_OVER) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            ChessRenderer.renderGameOver(winner, winReason);
        }

        requestAnimationFrame(_gameLoop);
    }
```

Update `_handleClick` to also route to Learn:
```js
    function _handleClick(point) {
        if (ChessLearn.isActive()) {
            // Back button takes priority
            if (ChessRenderer.backButtonFromPixel(point.px, point.py)) {
                ChessLearn.exit();
                return;
            }
            ChessLearn.handleClick(point);
            return;
        }

        if (gameState === CHESS_GAME_STATE.MENU) {
            if (ChessRenderer.learnButtonFromPixel(point.px, point.py)) {
                ChessLearn.openMenu();
                return;
            }
            _startNewGame();
        } else if (gameState === CHESS_GAME_STATE.GAME_OVER) {
            _startNewGame();
        } else if (gameState === CHESS_GAME_STATE.PROMOTING) {
            const choiceIndex = ChessRenderer.promotionChoiceFromPixel(point.px, point.py);
            if (choiceIndex !== null) {
                _finalizePromotion(choiceIndex);
            }
        } else if (gameState === CHESS_GAME_STATE.PLAYING) {
            const square = ChessRenderer.squareFromPixel(point.px, point.py);
            if (!square) {
                return;
            }
            const { row, col } = square;

            const move = legalMoves.find((m) => m.row === row && m.col === col);

            if (move) {
                _executeMove(move);
            } else {
                const piece = ChessBoard.getPiece(row, col);
                if (piece && piece.player === activePlayer) {
                    _selectPiece(row, col);
                } else {
                    selectedSquare = null;
                    legalMoves = [];
                }
            }
        }
    }
```

- [ ] **Step 4: Load the new script in `chess.html`**

Add `<script src="js/chess-openings.js"></script>` and `<script src="js/chess-learn.js"></script>` to `chess.html` in the correct order (after `chess-renderer.js`, before `chess-game.js`):

```html
    <script src="js/chess-constants.js"></script>
    <script src="js/chess-board.js"></script>
    <script src="js/chess-moves.js"></script>
    <script src="js/chess-pieces.js"></script>
    <script src="js/chess-renderer.js"></script>
    <script src="js/chess-input.js"></script>
    <script src="js/chess-openings.js"></script>
    <script src="js/chess-learn.js"></script>
    <script src="js/chess-game.js"></script>
```

- [ ] **Step 5: Manual test in browser**

Open `chess.html`. Verify:
1. Menu shows "Click to Start" and "Learn Openings" buttons
2. Click "Learn Openings" → see the 3 openings each with "Walkthrough" and "Practice" buttons
3. Click "← Back" → returns to main menu
4. Click "Walkthrough" on Italian Game → board appears with starting position, caption visible, "← Back" in corner
5. Click the e2 pawn, then e4 → pawn moves
6. Click e7 pawn, then e5 → black pawn moves
7. Continue through 3-4 moves to verify the flow
8. Click "← Back" mid-walkthrough → returns to learn menu
9. Click "Practice" on Italian Game → board appears
10. Click e2-e4 (correct) → moves
11. Wait 300ms → black's e7-e5 auto-plays
12. Try clicking f2 (wrong) → nothing happens (no flash)
13. Click e4 pawn, then e5 (correct next move) → moves
14. Try clicking d2 (wrong source) → ignored
15. Click e4 pawn, then d5 (wrong destination from correct source) → red flash on e4, then correct move (d5... actually e5 then f5? check Italian line — move 5 is Bc4, so wrong-move would correct to Bc4) auto-plays
16. Reach end → "Opening Complete" overlay
17. Click → returns to learn menu
18. Click "← Back" → returns to main menu
19. Click "Click to Start" → play a normal game and confirm play mode is unaffected

- [ ] **Step 6: Commit**

```bash
git add js/chess-learn.js js/chess-renderer.js js/chess-game.js chess.html
git commit -m "feat: add learn mode with walkthrough and practice"
```

---

## Task 8: Add Learn state machine tests

**Files:**
- Modify: `tests/learn.test.js`

- [ ] **Step 1: Add state machine tests**

In `tests/learn.test.js`, add a load for `chess-learn.js` after the other loadScript calls:
```js
loadScript('js/chess-openings.js');
loadScript('js/chess-learn.js');
```

Then append before the final `console.log`/`process.exit`:
```js
console.log('\nChessLearn state machine');
test_learn_walkthrough_correctMoveAdvances();
test_learn_walkthrough_wrongFromIgnored();
test_learn_walkthrough_wrongToIgnored();
test_learn_practice_correctUserMoveAndAutoBlack();
test_learn_practice_wrongDestinationTriggersCorrection();
test_learn_completeReachedAtEnd();

function test_learn_walkthrough_correctMoveAdvances() {
    // Stub ChessBoard and ChessRenderer enough to test the state machine
    const savedBoard = global.ChessBoard;
    const savedRenderer = global.ChessRenderer;
    let _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));
    global.ChessBoard = {
        getBoard: () => _board.map(row => row.slice()),
        setPiece: (r, c, p) => { _board[r][c] = p; },
        reset: () => { _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null)); }
    };
    global.ChessRenderer = {
        squareFromPixel: (px, py) => null,
        learnOpenerFromPixel: () => null,
        backButtonFromPixel: () => false
    };

    ChessLearn.start('italian', 'walkthrough');
    assertEqual(ChessLearn.getState(), 'learn_walkthrough', 'started in walkthrough');
    assertEqual(_board[1][4].type, 'pawn', 'e2 has pawn initially');

    // Click e2 (r:1, c:4) then e4 (r:3, c:4) — correct
    global.ChessRenderer.squareFromPixel = (px, py) => ({ row: 1, c: 4 });
    ChessLearn.handleClick({});
    global.ChessRenderer.squareFromPixel = (px, py) => ({ row: 3, c: 4 });
    ChessLearn.handleClick({});
    assert(_board[3][4] !== null, 'e4 now has the pawn');
    assertEqual(_board[3][4].type, 'pawn', 'piece on e4 is pawn');

    // Restore
    global.ChessBoard = savedBoard;
    global.ChessRenderer = savedRenderer;
    ChessLearn.exit();
}

function test_learn_walkthrough_wrongFromIgnored() {
    const savedBoard = global.ChessBoard;
    const savedRenderer = global.ChessRenderer;
    let _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));
    global.ChessBoard = {
        getBoard: () => _board.map(row => row.slice()),
        setPiece: (r, c, p) => { _board[r][c] = p; },
        reset: () => { _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null)); }
    };
    let _row = 0, _col = 0;
    global.ChessRenderer = {
        squareFromPixel: () => ({ row: _row, c: _col }),
        learnOpenerFromPixel: () => null,
        backButtonFromPixel: () => false
    };

    ChessLearn.start('italian', 'walkthrough');
    _row = 0; _col = 0; // a1 — not the expected e2 source
    ChessLearn.handleClick({});
    assert(_board[1][4] !== null, 'e2 pawn still in place after wrong source click');
    assertEqual(ChessLearn.getState(), 'learn_walkthrough', 'still in walkthrough');

    global.ChessBoard = savedBoard;
    global.ChessRenderer = savedRenderer;
    ChessLearn.exit();
}

function test_learn_walkthrough_wrongToIgnored() {
    const savedBoard = global.ChessBoard;
    const savedRenderer = global.ChessRenderer;
    let _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));
    global.ChessBoard = {
        getBoard: () => _board.map(row => row.slice()),
        setPiece: (r, c, p) => { _board[r][c] = p; },
        reset: () => { _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null)); }
    };
    let _row = 0, _col = 0;
    global.ChessRenderer = {
        squareFromPixel: () => ({ row: _row, c: _col }),
        learnOpenerFromPixel: () => null,
        backButtonFromPixel: () => false
    };

    ChessLearn.start('italian', 'walkthrough');
    _row = 1; _col = 4; ChessLearn.handleClick({}); // e2 — correct source
    _row = 3; _col = 0; ChessLearn.handleClick({}); // a4 — wrong destination
    assert(_board[1][4] !== null, 'e2 pawn still in place after wrong destination');
    assertEqual(ChessLearn.getState(), 'learn_walkthrough', 'still in walkthrough');

    global.ChessBoard = savedBoard;
    global.ChessRenderer = savedRenderer;
    ChessLearn.exit();
}

function test_learn_practice_correctUserMoveAndAutoBlack() {
    // Note: practice auto-plays Black with a setTimeout(300). This test only
    // exercises the synchronous user-move path; the Black auto-play is verified
    // manually in the browser (Task 7 Step 5).
    const savedBoard = global.ChessBoard;
    const savedRenderer = global.ChessRenderer;
    let _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));
    global.ChessBoard = {
        getBoard: () => _board.map(row => row.slice()),
        setPiece: (r, c, p) => { _board[r][c] = p; },
        reset: () => { _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null)); }
    };
    let _row = 0, _col = 0;
    global.ChessRenderer = {
        squareFromPixel: () => ({ row: _row, c: _col }),
        learnOpenerFromPixel: () => null,
        backButtonFromPixel: () => false
    };

    ChessLearn.start('italian', 'practice');
    _row = 1; _col = 4; ChessLearn.handleClick({}); // e2
    _row = 3; _col = 4; ChessLearn.handleClick({}); // e4
    assert(_board[3][4] !== null, 'e4 has white pawn after user move');
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice (Black timer pending)');
    ChessLearn.exit();

    global.ChessBoard = savedBoard;
    global.ChessRenderer = savedRenderer;
}

function test_learn_practice_wrongDestinationTriggersCorrection() {
    const savedBoard = global.ChessBoard;
    const savedRenderer = global.ChessRenderer;
    let _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));
    global.ChessBoard = {
        getBoard: () => _board.map(row => row.slice()),
        setPiece: (r, c, p) => { _board[r][c] = p; },
        reset: () => { _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null)); }
    };
    let _row = 0, _col = 0;
    global.ChessRenderer = {
        squareFromPixel: () => ({ row: _row, c: _col }),
        learnOpenerFromPixel: () => null,
        backButtonFromPixel: () => false
    };

    ChessLearn.start('italian', 'practice');
    _row = 1; _col = 4; ChessLearn.handleClick({}); // e2 — correct source
    _row = 3; _col = 0; ChessLearn.handleClick({}); // a4 — wrong destination
    // wrongFlash should be set; the correction happens 600ms later via setTimeout
    // We can't easily wait for it in a sync test, so we just verify no immediate
    // board change and that we're still in practice
    assert(_board[1][4] !== null, 'e2 pawn still there immediately after wrong click');
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice');
    ChessLearn.exit();

    global.ChessBoard = savedBoard;
    global.ChessRenderer = savedRenderer;
}

function test_learn_completeReachedAtEnd() {
    const savedBoard = global.ChessBoard;
    const savedRenderer = global.ChessRenderer;
    let _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));
    global.ChessBoard = {
        getBoard: () => _board.map(row => row.slice()),
        setPiece: (r, c, p) => { _board[r][c] = p; },
        reset: () => { _board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null)); }
    };
    let _row = 0, _col = 0;
    global.ChessRenderer = {
        squareFromPixel: () => ({ row: _row, c: _col }),
        learnOpenerFromPixel: () => null,
        backButtonFromPixel: () => false
    };

    // Use queens-gambit (also 10 plies)
    ChessLearn.start('queens-gambit', 'walkthrough');
    const moves = CHESS_OPENINGS.find(o => o.id === 'queens-gambit').moves;
    for (let i = 0; i < moves.length; i++) {
        _row = moves[i].from.r; _col = moves[i].from.c; ChessLearn.handleClick({});
        _row = moves[i].to.r; _col = moves[i].to.c; ChessLearn.handleClick({});
    }
    assertEqual(ChessLearn.getState(), 'learn_complete', 'reached COMPLETE after final move');

    global.ChessBoard = savedBoard;
    global.ChessRenderer = savedRenderer;
    ChessLearn.exit();
}
```

- [ ] **Step 2: Run tests, expect all pass**

Run: `node tests/learn.test.js`
Expected: 6 `applyMove` tests pass + 3 validator tests pass + 6 state machine tests pass = `15 passed, 0 failed`.

- [ ] **Step 3: Commit**

```bash
git add tests/learn.test.js
git commit -m "test: add learn mode state machine tests"
```

---

## Task 9: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a "Learn mode" section**

Find the "How to run" section in `README.md` (around line 12) and add a new section before it (or after, your call — keep it near the top of the file).

Add this content (insert after the existing "## How to run" section, before "## Resources"):
```markdown
## Learn Mode

`chess.html` now includes a **Learn Openings** option on the menu. It offers two modes for studying three curated openings (Italian Game, Ruy Lopez, Queen's Gambit):

- **Walkthrough** — user-paced; click each piece and destination to step through the main line. No penalties.
- **Practice** — you play White; the app plays Black's correct responses. Wrong moves flash red and get auto-corrected so the line continues.

Click "← Back" at any time to return to the menu.
```

- [ ] **Step 2: Verify rendered correctly**

Run: `cat README.md`
Expected: the new "Learn Mode" section appears in the file.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document Learn mode in README"
```

---

## Task 10: Final smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run all tests**

Run: `node tests/learn.test.js && node tests/ch-integration.test.js`
Expected: both test files exit 0.

- [ ] **Step 2: Full browser smoke test**

Open `chess.html`. Verify the full flow:
1. Menu → Learn Openings
2. Walkthrough Italian Game → step through 2 moves → ← Back → back to learn menu
3. Practice Italian Game → make one correct move → wait for Black's auto-response → make one wrong move → see red flash → see correction → continue
4. Practice Queen's Gambit → complete all 10 plies → see "Opening Complete" → click → back to learn menu
5. ← Back → main menu → Click to Start → play a normal game end-to-end (move a few pieces, capture something, deliver check)

- [ ] **Step 3: Final commit (only if smoke test surfaced a fix)**

If you made any tweaks during smoke test, commit them:
```bash
git add -A
git commit -m "chore: post-smoke-test fixes"
```

If no changes were needed, skip this step. The implementation is complete.

---

## Self-Review

**Spec coverage check:**
- Goal: 3 openings, walkthrough + practice, user plays White → covered (Tasks 5, 7)
- Scope: few curated openings, no backend → covered (no backend in any task)
- YAGNI list → respected (no PGN, no save, no variation tree)
- Architecture: `ChessLearn` IIFE + `applyMove` helper + `chess-openings.js` data + validator → covered (Tasks 3, 5, 7)
- `CHESS_LEARN_STATE` enum → covered (Task 1)
- Walkthrough flow → covered (Task 7 `_handleWalkthroughClick` + Task 8 test)
- Practice flow with 300ms delay + 600ms red flash → covered (Task 7 `_handlePracticeClick`)
- Renderer additions → covered (Task 7)
- Error handling: validator + out-of-sync try/catch → covered (Tasks 5, 7)
- Tests for applyMove, validator, walkthrough, practice → covered (Tasks 3, 5, 8)

**Placeholder scan:** No "TBD" / "TODO" / "implement later" in any task. Every code step has the full code. No "similar to Task N" without restating the code.

**Type consistency:**
- `ChessLearn.openMenu` / `start` / `exit` / `isActive` / `handleClick` / `render` / `getState` / `getError` — used identically in Tasks 6, 7, 8
- `ChessRenderer.learnButtonFromPixel` / `learnOpenerFromPixel` / `backButtonFromPixel` / `renderLearnMenu` / `renderLearnCaption` / `renderLearnComplete` / `renderWrongFlash` / `renderBackButton` — used identically in Tasks 6, 7, 8
- `ChessMoves.applyMove` — used identically in Tasks 3, 5, 7
- `CHESS_LEARN_STATE` values `'learn_menu'`, `'learn_walkthrough'`, `'learn_practice'`, `'learn_complete'` — used identically in Tasks 1, 7, 8

**No spec gaps found.**
