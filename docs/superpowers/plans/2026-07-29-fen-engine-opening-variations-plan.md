# FEN Engine & Branching Opening Variations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure FEN engine (`ChessFEN`) and convert the 3 existing Learn-mode openings from flat move lists into branching trees (8 named variations total), so Practice mode accepts any valid reply at a position while Walkthrough stays a single linear demo.

**Architecture:** `ChessFEN` is a new, stateless module (board↔FEN conversion) with no dependency on the opening/learn code. `ChessOpenings`'s flat `moves` array becomes a `root` tree node with `children`; its validator becomes a recursive tree walk that recomputes FEN at every node via `ChessFEN` and cross-checks it against the authored value. `ChessLearn` swaps its flat `step` array-index for a `currentNode` tree pointer plus a `path` array (for caption lookups), while keeping `step` itself as a plain ply counter for turn parity.

**Tech Stack:** Vanilla JS (`const Module = (() => {...})()` IIFE pattern, no build step), Node's `vm` module for the existing test harness (`tests/learn.test.js`, run via `node tests/learn.test.js`).

## Global Constraints

- `ChessFEN` must be pure functions only — no module state (matches `ChessMoves.applyMove`'s convention).
- Walkthrough mode's behavior must look unchanged to the user: at every branch point it recognizes only the line's `isMain` child (or the sole child) — never a second, valid-but-non-main child.
- Do not touch `js/chess-renderer.js`, `js/chess-game.js`, `js/chess-moves.js`, or `js/chess-board.js` — this feature is entirely a data-and-traversal concern inside Learn mode. (Already confirmed: `chess-renderer.js`'s `renderLearnMenu`/`learnOpenerFromPixel` are fully data-driven off `ChessOpenings.getAll()`, so they need zero changes even while the opening count temporarily drops from 3 to 1 mid-plan.)
- Do not add a 4th opening, PGN import, an ECO lookup database, a variation-picker UI, or SRS/persisted progress — all explicitly out of scope per the design spec.
- All move coordinates use the existing board convention: row 0 = rank 1 (White back rank), col 0 = a-file; `CHESS_PLAYER.ONE` = White, `CHESS_PLAYER.TWO` = Black.
- Every FEN string embedded in this plan has already been computed and cross-checked against a from-scratch simulation using the real `js/chess-constants.js` and `js/chess-moves.js` (via a throwaway Node script) — they are not placeholders, copy them verbatim.

---

## Task 1: `ChessFEN` module

**Files:**
- Create: `js/chess-fen.js`
- Modify: `chess.html` (load the new script before `js/chess-openings.js`)
- Modify: `tests/learn.test.js` (load `chess-fen.js`; add `ChessFEN` unit tests)

**Interfaces:**
- Produces: `ChessFEN.boardToFEN(board, activeColor, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber) → string`, `ChessFEN.fenToBoard(fen) → {board, activeColor, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber}`, `ChessFEN.deriveCastlingRights(board) → {whiteKing, whiteQueen, blackKing, blackQueen}` — all consumed by Task 2's validator.

- [ ] **Step 1: Add the failing `ChessFEN` tests to `tests/learn.test.js`**

Edit `tests/learn.test.js`: change

```js
loadScript('js/chess-constants.js');
loadScript('js/chess-board.js');
```

to

```js
loadScript('js/chess-constants.js');
loadScript('js/chess-fen.js');
loadScript('js/chess-board.js');
```

Then insert the following block right before `loadScript('js/chess-openings.js');` (i.e. immediately after the existing `test_applyMove_doesNotMutateInput();` call):

```js
console.log('\nChessFEN');
test_fen_startingPosition();
test_fen_noCastlingRights();
test_fen_enPassantTarget();
test_fen_roundTripStartingPosition();
test_fen_deriveCastlingRights();

function test_fen_startingPosition() {
    const fen = ChessFEN.boardToFEN(
        CHESS_INITIAL_POSITIONS, CHESS_PLAYER.ONE,
        { whiteKing: true, whiteQueen: true, blackKing: true, blackQueen: true },
        null, 0, 1
    );
    assertEqual(fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'starting position FEN matches the known-good oracle');
}

function test_fen_noCastlingRights() {
    const board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { ...p } : null));
    board[0][4].moved = true; // white king
    board[0][7].moved = true; // white rook (kingside)
    board[0][0].moved = true; // white rook (queenside)
    board[7][4].moved = true; // black king
    board[7][7].moved = true; // black rook (kingside)
    board[7][0].moved = true; // black rook (queenside)
    const fen = ChessFEN.boardToFEN(board, CHESS_PLAYER.ONE, ChessFEN.deriveCastlingRights(board), null, 0, 1);
    assertEqual(fen.split(' ')[2], '-', 'no castling rights once all kings/rooks have moved');
}

function test_fen_enPassantTarget() {
    const fen = ChessFEN.boardToFEN(
        CHESS_INITIAL_POSITIONS, CHESS_PLAYER.TWO,
        { whiteKing: true, whiteQueen: true, blackKing: true, blackQueen: true },
        { row: 2, col: 4 }, 0, 1
    );
    assertEqual(fen.split(' ')[3], 'e3', 'en passant target {row:2, col:4} encodes as e3');
}

function test_fen_roundTripStartingPosition() {
    const decoded = ChessFEN.fenToBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    assert(JSON.stringify(decoded.board) === JSON.stringify(CHESS_INITIAL_POSITIONS), 'fenToBoard round-trips the starting position back to CHESS_INITIAL_POSITIONS');
    assertEqual(decoded.activeColor, CHESS_PLAYER.ONE, 'active color decoded as White');
    assertEqual(decoded.halfmoveClock, 0, 'halfmove clock decoded as 0');
    assertEqual(decoded.fullmoveNumber, 1, 'fullmove number decoded as 1');
}

function test_fen_deriveCastlingRights() {
    const startRights = ChessFEN.deriveCastlingRights(CHESS_INITIAL_POSITIONS);
    assert(startRights.whiteKing && startRights.whiteQueen && startRights.blackKing && startRights.blackQueen, 'all four castling flags true at the starting position');

    const board = CHESS_INITIAL_POSITIONS.map(row => row.map(p => p ? { ...p } : null));
    board[0][4].moved = true; // white king moved
    const rights = ChessFEN.deriveCastlingRights(board);
    assert(rights.whiteKing === false && rights.whiteQueen === false, 'both white castling rights lost once the king has moved');
    assert(rights.blackKing === true && rights.blackQueen === true, "black's castling rights unaffected");
}
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node tests/learn.test.js`
Expected: crash — `js/chess-fen.js` doesn't exist yet, so `loadScript('js/chess-fen.js')` throws `ENOENT`.

- [ ] **Step 3: Create `js/chess-fen.js`**

```js
/**
 * Modern Chess — FEN Engine
 * Board <-> FEN conversion. Pure functions — no module state.
 */
const ChessFEN = (() => {
    'use strict';

    const FEN_PIECE_LETTER = {
        king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p'
    };
    const FEN_LETTER_PIECE = {
        k: CHESS_PIECE_TYPE.KING, q: CHESS_PIECE_TYPE.QUEEN, r: CHESS_PIECE_TYPE.ROOK,
        b: CHESS_PIECE_TYPE.BISHOP, n: CHESS_PIECE_TYPE.KNIGHT, p: CHESS_PIECE_TYPE.PAWN
    };

    function boardToFEN(board, activeColor, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber) {
        const ranks = [];
        for (let row = 7; row >= 0; row--) {
            let rank = '';
            let empty = 0;
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece) { empty++; continue; }
                if (empty > 0) { rank += String(empty); empty = 0; }
                const letter = FEN_PIECE_LETTER[piece.type];
                rank += (piece.player === CHESS_PLAYER.ONE) ? letter.toUpperCase() : letter;
            }
            if (empty > 0) rank += String(empty);
            ranks.push(rank);
        }
        const placement = ranks.join('/');
        const active = (activeColor === CHESS_PLAYER.ONE) ? 'w' : 'b';
        let castling = '';
        if (castlingRights.whiteKing) castling += 'K';
        if (castlingRights.whiteQueen) castling += 'Q';
        if (castlingRights.blackKing) castling += 'k';
        if (castlingRights.blackQueen) castling += 'q';
        if (castling === '') castling = '-';
        const enPassant = enPassantTarget
            ? String.fromCharCode(97 + enPassantTarget.col) + String(enPassantTarget.row + 1)
            : '-';
        return `${placement} ${active} ${castling} ${enPassant} ${halfmoveClock} ${fullmoveNumber}`;
    }

    function fenToBoard(fen) {
        const parts = fen.split(' ');
        const placement = parts[0], active = parts[1], castling = parts[2], enPassant = parts[3];
        const halfmoveClock = parts[4], fullmoveNumber = parts[5];
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));
        const ranks = placement.split('/');
        for (let i = 0; i < 8; i++) {
            const row = 7 - i;
            const rank = ranks[i];
            let col = 0;
            for (let j = 0; j < rank.length; j++) {
                const ch = rank[j];
                if (ch >= '1' && ch <= '8') { col += Number(ch); continue; }
                const type = FEN_LETTER_PIECE[ch.toLowerCase()];
                const player = (ch === ch.toUpperCase()) ? CHESS_PLAYER.ONE : CHESS_PLAYER.TWO;
                board[row][col] = { type, player, moved: false };
                col++;
            }
        }
        const activeColor = (active === 'w') ? CHESS_PLAYER.ONE : CHESS_PLAYER.TWO;
        const castlingRights = {
            whiteKing: castling.includes('K'),
            whiteQueen: castling.includes('Q'),
            blackKing: castling.includes('k'),
            blackQueen: castling.includes('q')
        };
        const enPassantTarget = (enPassant === '-') ? null
            : { row: Number(enPassant[1]) - 1, col: enPassant.charCodeAt(0) - 97 };
        return {
            board, activeColor, castlingRights, enPassantTarget,
            halfmoveClock: Number(halfmoveClock), fullmoveNumber: Number(fullmoveNumber)
        };
    }

    function deriveCastlingRights(board) {
        const whiteKing = board[0][4];
        const whiteRookK = board[0][7];
        const whiteRookQ = board[0][0];
        const blackKing = board[7][4];
        const blackRookK = board[7][7];
        const blackRookQ = board[7][0];
        return {
            whiteKing: !!(whiteKing && whiteKing.type === CHESS_PIECE_TYPE.KING && !whiteKing.moved &&
                whiteRookK && whiteRookK.type === CHESS_PIECE_TYPE.ROOK && !whiteRookK.moved),
            whiteQueen: !!(whiteKing && whiteKing.type === CHESS_PIECE_TYPE.KING && !whiteKing.moved &&
                whiteRookQ && whiteRookQ.type === CHESS_PIECE_TYPE.ROOK && !whiteRookQ.moved),
            blackKing: !!(blackKing && blackKing.type === CHESS_PIECE_TYPE.KING && !blackKing.moved &&
                blackRookK && blackRookK.type === CHESS_PIECE_TYPE.ROOK && !blackRookK.moved),
            blackQueen: !!(blackKing && blackKing.type === CHESS_PIECE_TYPE.KING && !blackKing.moved &&
                blackRookQ && blackRookQ.type === CHESS_PIECE_TYPE.ROOK && !blackRookQ.moved)
        };
    }

    return { boardToFEN, fenToBoard, deriveCastlingRights };
})();
```

- [ ] **Step 4: Wire the new script into `chess.html`**

Edit `chess.html`: change

```html
    <script src="js/chess-input.js"></script>
    <script src="js/chess-openings.js"></script>
    <script src="js/chess-learn.js"></script>
```

to

```html
    <script src="js/chess-input.js"></script>
    <script src="js/chess-fen.js"></script>
    <script src="js/chess-openings.js"></script>
    <script src="js/chess-learn.js"></script>
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `node tests/learn.test.js`
Expected: the 5 new `ChessFEN` assertions pass (look for `OK` lines under `ChessFEN` and no `FAIL` lines); the pre-existing `applyMove` tests still pass; the script currently still crashes afterward at `loadScript('js/chess-openings.js')` — no, it doesn't crash, that file still exists — it should proceed to run the (still-unmodified) openings/learn tests and finish with a summary line. Confirm no new failures were introduced.

- [ ] **Step 6: Commit**

```bash
git add js/chess-fen.js chess.html tests/learn.test.js
git commit -m "feat: add ChessFEN board<->FEN conversion engine"
```

---

## Task 2: Branching tree engine — data model, validator, traversal, Italian Game

This is the one task where data model, validator, and consumer must land together: `ChessLearn` cannot run against a `root`-shaped opening until it stops reading `opening.moves`, and the validator cannot be tree-based until at least one real tree-shaped opening exists to validate. Ruy Lopez and Queen's Gambit are deliberately *not* touched here — they stay out of `CHESS_OPENINGS` until Tasks 3 and 4, so the Learn menu temporarily shows only the Italian Game. This is safe: `chess-renderer.js`'s menu is fully data-driven off `ChessOpenings.getAll()` (confirmed in Task 1's investigation), so it needs no changes and shows exactly as many buttons as there are openings at any point in this plan.

**Files:**
- Modify: `js/chess-openings.js` (flat `moves` array → tree `root`; validator rewritten as a recursive walk)
- Modify: `js/chess-learn.js` (`currentNode` tree pointer + `path` array replace flat-array indexing)
- Modify: `tests/learn.test.js` (openings-validator tests rewritten for tree/branch cases; `ChessLearn` tests rewritten for tree traversal; new branching-behavior tests)

**Interfaces:**
- Consumes: `ChessFEN.boardToFEN`/`deriveCastlingRights` (Task 1), `ChessMoves.applyMove(board, enPassantTarget, move) → {newBoard, newEnPassantTarget, capturedPiece, didCastle, didPromote, moverColor}` (existing).
- Produces: `ChessOpenings.getById(id) → {id, name, caption, root} | null` (replaces the old `{id, name, caption, moves}` shape) — tree node shape `{move: LearnMove|null, fen: string, name?: string, eco?: string, isMain?: boolean, children: Node[]}`. `ChessLearn.getCurrentNode() → Node`, `ChessLearn.getCaption() → string`, `ChessLearn.setRngForTesting(fn|null) → void` — all new, consumed only by tests in this task and Task 3/4.

- [ ] **Step 1: Replace the tail of `tests/learn.test.js` with tree-based tests (red)**

Edit `tests/learn.test.js`: replace everything from `loadScript('js/chess-openings.js');` through the end of the file with:

```js
loadScript('js/chess-openings.js');
loadScript('js/chess-learn.js');

const CHESS_START_FEN_TEST = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

console.log('\nChessOpenings.validate');
test_openings_validate_accepts_bundled();
test_openings_validate_rejects_out_of_bounds();
test_openings_validate_rejects_empty_start();
test_openings_validate_rejects_missing_ismain();
test_openings_validate_rejects_duplicate_ismain();
test_openings_validate_rejects_fen_mismatch();

function test_openings_validate_accepts_bundled() {
    const result = ChessOpenings.validate();
    assert(result.valid.length === 1, 'the bundled opening (italian) passes validation');
    assert(result.invalid.length === 0, 'no invalid openings');
}

function test_openings_validate_rejects_out_of_bounds() {
    const original = CHESS_OPENINGS.slice();
    CHESS_OPENINGS.push({
        id: 'bad-bounds', name: 'Bad Bounds', caption: 'oob',
        root: { move: null, fen: CHESS_START_FEN_TEST, children: [
            { move: { from: { r: 0, c: 0 }, to: { r: 8, c: 0 } }, fen: 'x', children: [] }
        ] }
    });
    const result = ChessOpenings.validate();
    assert(result.invalid.some(o => o.id === 'bad-bounds'), 'bad-bounds rejected');
    CHESS_OPENINGS.length = 0;
    CHESS_OPENINGS.push(...original);
}

function test_openings_validate_rejects_empty_start() {
    const original = CHESS_OPENINGS.slice();
    CHESS_OPENINGS.push({
        id: 'bad-empty', name: 'Bad Empty', caption: 'empty',
        root: { move: null, fen: CHESS_START_FEN_TEST, children: [
            { move: { from: { r: 3, c: 3 }, to: { r: 4, c: 3 } }, fen: 'x', children: [] } // e4 played from an empty square
        ] }
    });
    const result = ChessOpenings.validate();
    assert(result.invalid.some(o => o.id === 'bad-empty'), 'bad-empty rejected');
    CHESS_OPENINGS.length = 0;
    CHESS_OPENINGS.push(...original);
}

function test_openings_validate_rejects_missing_ismain() {
    const original = CHESS_OPENINGS.slice();
    CHESS_OPENINGS.push({
        id: 'bad-no-main', name: 'Bad No Main', caption: 'no main',
        root: { move: null, fen: CHESS_START_FEN_TEST, children: [
            { move: { from: { r: 1, c: 4 }, to: { r: 3, c: 4 }, isDoubleStep: true },
              fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
              children: [
                { move: { from: { r: 6, c: 4 }, to: { r: 4, c: 4 }, isDoubleStep: true }, fen: 'a', name: 'Line A', eco: 'X01', children: [] },
                { move: { from: { r: 6, c: 3 }, to: { r: 4, c: 3 }, isDoubleStep: true }, fen: 'b', name: 'Line B', eco: 'X02', children: [] }
              ] }
        ] }
    });
    const result = ChessOpenings.validate();
    assert(result.invalid.some(o => o.id === 'bad-no-main'), 'branch node with no isMain child rejected');
    CHESS_OPENINGS.length = 0;
    CHESS_OPENINGS.push(...original);
}

function test_openings_validate_rejects_duplicate_ismain() {
    const original = CHESS_OPENINGS.slice();
    CHESS_OPENINGS.push({
        id: 'bad-dup-main', name: 'Bad Dup Main', caption: 'dup main',
        root: { move: null, fen: CHESS_START_FEN_TEST, children: [
            { move: { from: { r: 1, c: 4 }, to: { r: 3, c: 4 }, isDoubleStep: true },
              fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
              children: [
                { move: { from: { r: 6, c: 4 }, to: { r: 4, c: 4 }, isDoubleStep: true }, fen: 'a', name: 'Line A', eco: 'X01', isMain: true, children: [] },
                { move: { from: { r: 6, c: 3 }, to: { r: 4, c: 3 }, isDoubleStep: true }, fen: 'b', name: 'Line B', eco: 'X02', isMain: true, children: [] }
              ] }
        ] }
    });
    const result = ChessOpenings.validate();
    assert(result.invalid.some(o => o.id === 'bad-dup-main'), 'branch node with two isMain children rejected');
    CHESS_OPENINGS.length = 0;
    CHESS_OPENINGS.push(...original);
}

function test_openings_validate_rejects_fen_mismatch() {
    const original = CHESS_OPENINGS.slice();
    CHESS_OPENINGS.push({
        id: 'bad-fen', name: 'Bad Fen', caption: 'fen mismatch',
        root: { move: null, fen: CHESS_START_FEN_TEST, children: [
            { move: { from: { r: 1, c: 4 }, to: { r: 3, c: 4 }, isDoubleStep: true },
              fen: 'not-the-real-fen', children: [] }
        ] }
    });
    const result = ChessOpenings.validate();
    assert(result.invalid.some(o => o.id === 'bad-fen'), 'authored fen not matching computed fen rejected');
    CHESS_OPENINGS.length = 0;
    CHESS_OPENINGS.push(...original);
}

// Real-module harness: give ChessRenderer a minimal fake canvas/window so its
// actual squareFromPixel/getBoardMetrics run under Node (no DOM available).
// A stub can't replace the ChessBoard/ChessRenderer identifiers here — they're
// lexical `const`s from earlier loadScript() calls, not properties on `global`,
// so `global.ChessBoard = mock` would not be seen by chess-learn.js at all.
global.window = { innerWidth: 1600, innerHeight: 1600, addEventListener: () => {} };
const _fakeCtx = new Proxy({}, {
    get(target, prop) {
        if (prop === 'measureText') return () => ({ width: 40 });
        if (prop === 'createRadialGradient') return () => ({ addColorStop: () => {} });
        if (prop in target) return target[prop];
        return () => {};
    },
    set(target, prop, value) { target[prop] = value; return true; }
});
const _fakeCanvas = { width: 0, height: 0, getContext: () => _fakeCtx };
ChessRenderer.init(_fakeCanvas);
ChessBoard.init();

function pixelFor(row, col) {
    const m = ChessRenderer.getBoardMetrics();
    return {
        px: m.offsetX + col * m.squareSize + m.squareSize / 2,
        py: m.offsetY + (7 - row) * m.squareSize + m.squareSize / 2
    };
}
function clickSquare(row, col) {
    ChessLearn.handleClick(pixelFor(row, col));
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function mainLineMoves(root) {
    const moves = [];
    let node = root;
    while (node.children.length > 0) {
        const next = node.children.length === 1 ? node.children[0] : node.children.find(c => c.isMain);
        moves.push(next.move);
        node = next;
    }
    return moves;
}

console.log('\nChessLearn state machine');
test_learn_walkthrough_correctMoveAdvances();
test_learn_walkthrough_wrongFromIgnored();
test_learn_walkthrough_wrongToIgnored();
test_learn_walkthrough_nonMainBranchClickIgnored();
test_learn_practice_correctUserMoveAndAutoBlack();
test_learn_practice_wrongDestinationTriggersCorrection();
test_learn_completeReachedAtEnd();

function test_learn_walkthrough_correctMoveAdvances() {
    ChessLearn.start('italian', 'walkthrough');
    assertEqual(ChessLearn.getState(), 'learn_walkthrough', 'started in walkthrough');
    assertEqual(ChessBoard.getPiece(1, 4).type, 'pawn', 'e2 has pawn initially');

    clickSquare(1, 4); // e2
    clickSquare(3, 4); // e4
    const moved = ChessBoard.getPiece(3, 4);
    assert(moved !== null, 'e4 now has the pawn');
    assertEqual(moved.type, 'pawn', 'piece on e4 is pawn');

    ChessLearn.exit();
}

function test_learn_walkthrough_wrongFromIgnored() {
    ChessLearn.start('italian', 'walkthrough');
    clickSquare(0, 0); // a1 — not the expected e2 source
    assert(ChessBoard.getPiece(1, 4) !== null, 'e2 pawn still in place after wrong source click');
    assertEqual(ChessLearn.getState(), 'learn_walkthrough', 'still in walkthrough');
    ChessLearn.exit();
}

function test_learn_walkthrough_wrongToIgnored() {
    ChessLearn.start('italian', 'walkthrough');
    clickSquare(1, 4); // e2 — correct source
    clickSquare(3, 0); // a4 — wrong destination
    assert(ChessBoard.getPiece(1, 4) !== null, 'e2 pawn still in place after wrong destination');
    assertEqual(ChessLearn.getState(), 'learn_walkthrough', 'still in walkthrough');
    ChessLearn.exit();
}

function test_learn_walkthrough_nonMainBranchClickIgnored() {
    ChessLearn.start('italian', 'walkthrough');
    clickSquare(1, 4); clickSquare(3, 4); // 1.e4
    clickSquare(6, 4); clickSquare(4, 4); // 1...e5
    clickSquare(0, 6); clickSquare(2, 5); // 2.Nf3
    clickSquare(7, 1); clickSquare(5, 2); // 2...Nc6
    clickSquare(0, 5); clickSquare(3, 2); // 3.Bc4 — branch node (Giuoco Piano is isMain, Two Knights is not)
    assertEqual(ChessLearn.getCaption(), 'Italian: e4 e5, knights out, bishop to c4.', 'caption still opening-level before the branch');

    // Two Knights Defense (3...Nf6, g8-f6) is NOT the main child — click is ignored
    clickSquare(7, 6); clickSquare(5, 5);
    assert(ChessBoard.getPiece(7, 6) !== null, 'knight still on g8 — non-main branch click ignored');
    assertEqual(ChessLearn.getCaption(), 'Italian: e4 e5, knights out, bishop to c4.', 'caption unchanged after ignored click');

    // Giuoco Piano (3...Bc5, f8-c5) IS the main child — advances normally
    clickSquare(7, 5); clickSquare(4, 2);
    assert(ChessBoard.getPiece(4, 2) !== null, 'bishop landed on c5');
    assertEqual(ChessLearn.getCaption(), 'Giuoco Piano', 'caption switches to the named variation');
    ChessLearn.exit();
}

function test_learn_practice_correctUserMoveAndAutoBlack() {
    // Practice auto-plays Black via a 300ms setTimeout; this test only checks
    // the synchronous user-move path (the auto-play itself is exercised with
    // real timers in the async branch tests below).
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); // e2
    clickSquare(3, 4); // e4
    assert(ChessBoard.getPiece(3, 4) !== null, 'e4 has white pawn after user move');
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice (Black timer pending)');
    const flash = ChessLearn.getFlashState();
    assert(flash.successFlash !== null, 'successFlash set after correct move');
    assertEqual(flash.successFlash.square.r, 3, 'successFlash square row is e4');
    assertEqual(flash.successFlash.square.c, 4, 'successFlash square col is e4');
    ChessLearn.exit();
}

function test_learn_practice_wrongDestinationTriggersCorrection() {
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); // e2 — correct source
    clickSquare(3, 0); // a4 — wrong destination
    // The correction fires 600ms later via setTimeout; here we only check
    // that nothing changed synchronously and we're still in practice.
    assert(ChessBoard.getPiece(1, 4) !== null, 'e2 pawn still there immediately after wrong click');
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice');
    const flash = ChessLearn.getFlashState();
    assert(flash.correctionArrow !== null, 'correctionArrow set after wrong move');
    assertEqual(flash.correctionArrow.from.r, 1, 'arrow starts at e2 row');
    assertEqual(flash.correctionArrow.from.c, 4, 'arrow starts at e2 col');
    assertEqual(flash.correctionArrow.to.r, 3, 'arrow ends at e4 row');
    assertEqual(flash.correctionArrow.to.c, 4, 'arrow ends at e4 col');
    ChessLearn.exit();
}

function test_learn_completeReachedAtEnd() {
    ChessLearn.start('italian', 'walkthrough');
    const op = ChessOpenings.getById('italian');
    const moves = mainLineMoves(op.root);
    for (let i = 0; i < moves.length; i++) {
        clickSquare(moves[i].from.r, moves[i].from.c);
        clickSquare(moves[i].to.r, moves[i].to.c);
    }
    assertEqual(ChessLearn.getState(), 'learn_complete', "reached COMPLETE after the main line's final move");
    ChessLearn.exit();
}

// --- Async: Practice branching, driven with real timers so Black's 300ms
// auto-play actually fires. RNG is injected via ChessLearn.setRngForTesting
// for determinism instead of sampling Math.random over many trials — this
// gives a stronger, non-flaky guarantee that the auto-play correctly picks
// children[index] for any index, rather than a statistical sample.
async function runAsyncBranchTests() {
    console.log('\nChessLearn practice branching (async, real timers, injected RNG)');

    ChessLearn.setRngForTesting(() => 0);
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); clickSquare(3, 4); // 1.e4
    await sleep(400); // black auto 1...e5 (single child — rng irrelevant here)
    clickSquare(0, 6); clickSquare(2, 5); // 2.Nf3
    await sleep(400); // black auto 2...Nc6 (single child)
    clickSquare(0, 5); clickSquare(3, 2); // 3.Bc4
    await sleep(400); // black auto-picks branch child index 0 = Giuoco Piano
    assertEqual(ChessLearn.getCurrentNode().name, 'Giuoco Piano', 'rng=>0 picks the Giuoco Piano branch');
    assertEqual(ChessLearn.getCaption(), 'Giuoco Piano', 'caption reflects Giuoco Piano');
    assert(ChessBoard.getPiece(4, 2) !== null && ChessBoard.getPiece(4, 2).type === 'bishop', 'black bishop landed on c5');
    ChessLearn.exit();
    ChessLearn.setRngForTesting(null);

    ChessLearn.setRngForTesting(() => 0.99);
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); clickSquare(3, 4);
    await sleep(400);
    clickSquare(0, 6); clickSquare(2, 5);
    await sleep(400);
    clickSquare(0, 5); clickSquare(3, 2);
    await sleep(400); // black auto-picks branch child index 1 = Two Knights Defense
    assertEqual(ChessLearn.getCurrentNode().name, 'Two Knights Defense', 'rng=>0.99 picks the Two Knights Defense branch');
    assertEqual(ChessLearn.getCaption(), 'Two Knights Defense', 'caption reflects Two Knights Defense');
    assert(ChessBoard.getPiece(5, 5) !== null && ChessBoard.getPiece(5, 5).type === 'knight', 'black knight landed on f6');
    ChessLearn.exit();
    ChessLearn.setRngForTesting(null);
}

runAsyncBranchTests().then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node tests/learn.test.js`
Expected: crash or failures — `CHESS_OPENINGS` entries still have `.moves` not `.root`, and `ChessOpenings.validate()`/`ChessLearn` still read the old flat shape, so the new tree-shaped pushes and tree-based assertions fail.

- [ ] **Step 3: Replace `js/chess-openings.js` with the tree engine + Italian Game**

Replace the entire file contents:

```js
/**
 * Modern Chess — Opening Definitions and Validator
 * Static data for the Learn mode's curated openings, authored as branching
 * trees so Practice mode can accept multiple named variations at a position.
 */

const CHESS_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const CHESS_OPENINGS = [
    {
        id: 'italian',
        name: 'Italian Game',
        caption: 'Italian: e4 e5, knights out, bishop to c4.',
        root: {
            move: null, fen: CHESS_START_FEN,
            children: [
                { move: { from: { r: 1, c: 4 }, to: { r: 3, c: 4 }, isDoubleStep: true },
                  fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                  children: [
                    { move: { from: { r: 6, c: 4 }, to: { r: 4, c: 4 }, isDoubleStep: true },
                      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                      children: [
                        { move: { from: { r: 0, c: 6 }, to: { r: 2, c: 5 } },
                          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
                          children: [
                            { move: { from: { r: 7, c: 1 }, to: { r: 5, c: 2 } },
                              fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
                              children: [
                                { move: { from: { r: 0, c: 5 }, to: { r: 3, c: 2 } },
                                  fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
                                  children: [
                                    { move: { from: { r: 7, c: 5 }, to: { r: 4, c: 2 } },
                                      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
                                      name: 'Giuoco Piano', eco: 'C50', isMain: true,
                                      children: [
                                        { move: { from: { r: 1, c: 2 }, to: { r: 2, c: 2 } },
                                          fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq - 0 4',
                                          children: [
                                            { move: { from: { r: 7, c: 6 }, to: { r: 5, c: 5 } },
                                              fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 1 5',
                                              children: [
                                                { move: { from: { r: 1, c: 3 }, to: { r: 3, c: 3 }, isDoubleStep: true },
                                                  fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/2P2N2/PP3PPP/RNBQK2R b KQkq d3 0 5',
                                                  children: [] }
                                              ] }
                                          ] }
                                      ] },
                                    { move: { from: { r: 7, c: 6 }, to: { r: 5, c: 5 } },
                                      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
                                      name: 'Two Knights Defense', eco: 'C55',
                                      children: [
                                        { move: { from: { r: 2, c: 5 }, to: { r: 4, c: 6 } },
                                          fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 5 4',
                                          children: [
                                            { move: { from: { r: 6, c: 3 }, to: { r: 4, c: 3 }, isDoubleStep: true },
                                              fen: 'r1bqkb1r/ppp2ppp/2n2n2/3pp1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq d6 0 5',
                                              children: [
                                                { move: { from: { r: 3, c: 4 }, to: { r: 4, c: 3 } },
                                                  fen: 'r1bqkb1r/ppp2ppp/2n2n2/3Pp1N1/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 5',
                                                  children: [] }
                                              ] }
                                          ] }
                                      ] }
                                  ] }
                              ] }
                          ] }
                      ] }
                  ] }
            ]
        }
    }
];

const ChessOpenings = (() => {
    'use strict';

    function _isInBounds(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    function _cloneBoard(board) {
        return board.map(row => row.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));
    }

    function _moveLabel(mv) {
        const f = String.fromCharCode(97 + mv.from.c) + (mv.from.r + 1);
        const t = String.fromCharCode(97 + mv.to.c) + (mv.to.r + 1);
        return f + t;
    }

    function _validateNode(node, board, activeColor, enPassantTarget, halfmoveClock, fullmoveNumber, pathLabel, errors) {
        if (!Array.isArray(node.children)) {
            errors.push(`${pathLabel}: children must be an array`);
            return;
        }

        if (node.children.length >= 2) {
            const mains = node.children.filter(c => c.isMain === true);
            if (mains.length !== 1) {
                errors.push(`${pathLabel}: node with ${node.children.length} children must have exactly one isMain:true child (found ${mains.length})`);
            }
            const seen = new Set();
            for (const child of node.children) {
                const key = `${child.move.from.r},${child.move.from.c}-${child.move.to.r},${child.move.to.c}`;
                if (seen.has(key)) {
                    errors.push(`${pathLabel}: duplicate/ambiguous child move ${key}`);
                }
                seen.add(key);
            }
        }

        for (const child of node.children) {
            const mv = child.move;
            const childLabel = pathLabel + ' ' + _moveLabel(mv);

            if (!mv || !mv.from || !mv.to) {
                errors.push(`${childLabel}: missing from/to`);
                continue;
            }
            if (!_isInBounds(mv.from.r, mv.from.c) || !_isInBounds(mv.to.r, mv.to.c)) {
                errors.push(`${childLabel}: out-of-bounds coordinates`);
                continue;
            }
            const piece = board[mv.from.r][mv.from.c];
            if (!piece) {
                errors.push(`${childLabel}: source square is empty`);
                continue;
            }
            if (piece.player !== activeColor) {
                errors.push(`${childLabel}: wrong color (expected ${activeColor}, got ${piece.player})`);
                continue;
            }

            let result;
            try {
                result = ChessMoves.applyMove(board, enPassantTarget, mv);
            } catch (e) {
                errors.push(`${childLabel}: applyMove threw: ${e.message}`);
                continue;
            }

            const wasCaptureOrPawn = piece.type === CHESS_PIECE_TYPE.PAWN || !!result.capturedPiece;
            const newHalfmove = wasCaptureOrPawn ? 0 : halfmoveClock + 1;
            const newFullmove = (activeColor === CHESS_PLAYER.TWO) ? fullmoveNumber + 1 : fullmoveNumber;
            const nextActive = (activeColor === CHESS_PLAYER.ONE) ? CHESS_PLAYER.TWO : CHESS_PLAYER.ONE;

            const computedFEN = ChessFEN.boardToFEN(
                result.newBoard, nextActive, ChessFEN.deriveCastlingRights(result.newBoard),
                result.newEnPassantTarget, newHalfmove, newFullmove
            );

            if (child.fen !== computedFEN) {
                errors.push(`${childLabel}: authored fen does not match computed fen. authored='${child.fen}' computed='${computedFEN}'`);
            }
            if (child.name && !child.eco) {
                errors.push(`${childLabel}: name set without eco`);
            }

            _validateNode(child, result.newBoard, nextActive, result.newEnPassantTarget, newHalfmove, newFullmove, childLabel, errors);
        }
    }

    function validate() {
        const valid = [];
        const invalid = [];

        for (let i = 0; i < CHESS_OPENINGS.length; i++) {
            const op = CHESS_OPENINGS[i];
            const errors = [];

            if (!op.id) errors.push('missing id');
            if (!op.name) errors.push('missing name');
            if (!op.caption) errors.push('missing caption');
            if (!op.root) {
                errors.push('missing root');
                invalid.push({ id: op.id || `<index ${i}>`, errors });
                continue;
            }

            const board = _cloneBoard(CHESS_INITIAL_POSITIONS);
            _validateNode(op.root, board, CHESS_PLAYER.ONE, null, 0, 1, op.name || op.id, errors);

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

- [ ] **Step 4: Replace `js/chess-learn.js` with tree traversal**

Replace the entire file contents:

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
    let opening = null;           // current opening object ({id, name, caption, root})
    let currentNode = null;       // tree pointer — current position in opening.root
    let path = [];                // nodes descended into so far, for caption lookup
    let step = 0;                 // ply counter — still the source of truth for turn parity
    let selectedFrom = null;      // {r, c} — piece user clicked first
    let wrongFlash = null;        // {square:{r,c}, until:number} for red flash
    let successFlash = null;      // {square:{r,c}, until:number} for green flash
    let correctionArrow = null;   // {from:{r,c}, to:{r,c}, until:number}
    let pendingBlackMove = null;  // timeout id for the 300ms Black auto-play
    let pendingCorrection = null; // timeout id for the 600ms Practice wrong-move correction
    let lastError = null;         // {message} for error overlay
    let _rng = Math.random;       // swappable for deterministic tests

    const BLACK_RESPONSE_DELAY_MS = 300;
    const WRONG_MOVE_FLASH_MS = 600;
    const SUCCESS_FLASH_MS = 400;

    function _clearTimers() {
        if (pendingBlackMove !== null) {
            clearTimeout(pendingBlackMove);
            pendingBlackMove = null;
        }
        if (pendingCorrection !== null) {
            clearTimeout(pendingCorrection);
            pendingCorrection = null;
        }
    }

    function _expectedPlayer() {
        return (step % 2 === 0) ? CHESS_PLAYER.ONE : CHESS_PLAYER.TWO;
    }

    function _mainChild(node) {
        return node.children.length === 1
            ? node.children[0]
            : node.children.find(c => c.isMain === true);
    }

    function _currentCaption() {
        for (let i = path.length - 1; i >= 0; i--) {
            if (path[i].name) return path[i].name;
        }
        return opening ? opening.caption : '';
    }

    function _applyStep(node) {
        const move = node.move;
        const board = ChessBoard.getBoard();
        let result;
        try {
            result = ChessMoves.applyMove(board, null, move);
        } catch (e) {
            lastError = { message: 'applyMove failed: ' + e.message };
            state = CHESS_LEARN_STATE.MENU;
            return;
        }
        for (let r = 0; r < CHESS_BOARD_SIZE; r++) {
            for (let c = 0; c < CHESS_BOARD_SIZE; c++) {
                ChessBoard.setPiece(r, c, result.newBoard[r][c]);
            }
        }
        currentNode = node;
        path.push(node);
        step++;
    }

    function _checkEndOrContinue() {
        if (currentNode.children.length === 0) {
            state = CHESS_LEARN_STATE.COMPLETE;
            return;
        }
        if (_expectedPlayer() === CHESS_PLAYER.TWO && state === CHESS_LEARN_STATE.PRACTICE) {
            _clearTimers();
            pendingBlackMove = setTimeout(() => {
                pendingBlackMove = null;
                if (state === CHESS_LEARN_STATE.PRACTICE && currentNode.children.length > 0 && _expectedPlayer() === CHESS_PLAYER.TWO) {
                    const children = currentNode.children;
                    const chosen = children[Math.floor(_rng() * children.length)];
                    _applyStep(chosen);
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
        currentNode = null;
        path = [];
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
        successFlash = null;
        correctionArrow = null;
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
        currentNode = op.root;
        path = [];
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
        successFlash = null;
        correctionArrow = null;
        state = (mode === 'practice') ? CHESS_LEARN_STATE.PRACTICE : CHESS_LEARN_STATE.WALKTHROUGH;
        // If first move is Black's somehow, play it (shouldn't happen with our data — White always moves first)
        if (_expectedPlayer() === CHESS_PLAYER.TWO && currentNode.children.length > 0) {
            _applyStep(currentNode.children[0]);
        }
    }

    function exit() {
        _clearTimers();
        ChessBoard.reset();
        state = null;
        opening = null;
        currentNode = null;
        path = [];
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
        successFlash = null;
        correctionArrow = null;
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
        const expected = _mainChild(currentNode);
        const piece = ChessBoard.getPiece(sq.row, sq.col);

        if (!selectedFrom) {
            if (piece && piece.player === _expectedPlayer() &&
                sq.row === expected.move.from.r && sq.col === expected.move.from.c) {
                selectedFrom = { r: sq.row, c: sq.col };
            }
            return;
        }

        if (sq.row === expected.move.to.r && sq.col === expected.move.to.c &&
            selectedFrom.r === expected.move.from.r && selectedFrom.c === expected.move.from.c) {
            _applyStep(expected);
            selectedFrom = null;
            if (currentNode.children.length === 0) {
                state = CHESS_LEARN_STATE.COMPLETE;
            }
        } else {
            selectedFrom = null;
        }
    }

    function _handlePracticeClick(point) {
        // Black's turn — clicks are ignored
        if (_expectedPlayer() === CHESS_PLAYER.TWO) return;

        const sq = ChessRenderer.squareFromPixel(point.px, point.py);
        if (!sq) return;

        if (!selectedFrom) {
            const candidate = currentNode.children.find(c => c.move.from.r === sq.row && c.move.from.c === sq.col);
            if (candidate) {
                selectedFrom = { r: sq.row, c: sq.col };
            }
            return;
        }

        const matched = currentNode.children.find(c =>
            c.move.from.r === selectedFrom.r && c.move.from.c === selectedFrom.c &&
            c.move.to.r === sq.row && c.move.to.c === sq.col);

        if (matched) {
            // Correct — any matching child (any named variation) is accepted
            successFlash = { square: { r: matched.move.to.r, c: matched.move.to.c }, until: Date.now() + SUCCESS_FLASH_MS };
            _applyStep(matched);
            selectedFrom = null;
            _checkEndOrContinue();
        } else {
            // Wrong destination — flash, show the correct (main-line) move, and auto-correct
            const correction = _mainChild(currentNode);
            wrongFlash = { square: { r: selectedFrom.r, c: selectedFrom.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            correctionArrow = { from: { r: correction.move.from.r, c: correction.move.from.c }, to: { r: correction.move.to.r, c: correction.move.to.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            selectedFrom = null;
            pendingCorrection = setTimeout(() => {
                pendingCorrection = null;
                if (state !== CHESS_LEARN_STATE.PRACTICE) return;
                wrongFlash = null;
                correctionArrow = null;
                _applyStep(correction);
                _checkEndOrContinue();
            }, WRONG_MOVE_FLASH_MS);
        }
    }

    function render() {
        if (state === CHESS_LEARN_STATE.MENU) {
            ChessRenderer.renderLearnMenu();
            return;
        }
        if (state === CHESS_LEARN_STATE.WALKTHROUGH || state === CHESS_LEARN_STATE.PRACTICE) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            // Highlight selectedFrom in walkthrough and practice
            if (selectedFrom) {
                ChessRenderer.renderHighlights({ row: selectedFrom.r, col: selectedFrom.c }, []);
            }
            // Caption
            ChessRenderer.renderLearnCaption(_currentCaption());
            // Wrong-move flash overlay
            if (wrongFlash && Date.now() < wrongFlash.until) {
                ChessRenderer.renderWrongFlash(wrongFlash.square);
            }
            // Correct-move flash overlay
            if (successFlash && Date.now() < successFlash.until) {
                ChessRenderer.renderSuccessFlash(successFlash.square);
            }
            // Correction arrow (shown during the same window as wrongFlash)
            if (correctionArrow && Date.now() < correctionArrow.until) {
                ChessRenderer.renderCorrectionArrow(correctionArrow.from, correctionArrow.to);
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
        getError: () => lastError,
        getFlashState: () => ({ wrongFlash, successFlash, correctionArrow }),
        getCurrentNode: () => currentNode,
        getCaption: () => _currentCaption(),
        setRngForTesting: (fn) => { _rng = fn || Math.random; }
    };
})();
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `node tests/learn.test.js`
Expected: `0 failed` — every `ChessFEN`, `ChessOpenings.validate`, and `ChessLearn` assertion (including the async branching tests) prints `OK`/passes.

- [ ] **Step 6: Commit**

```bash
git add js/chess-openings.js js/chess-learn.js tests/learn.test.js
git commit -m "feat: convert Italian Game to a branching opening tree with a tree-walking validator and traversal"
```

---

## Task 3: Ruy Lopez tree (Berlin Defense, Closed Ruy Lopez, Exchange Variation)

**Files:**
- Modify: `js/chess-openings.js` (insert the `ruy-lopez` tree into `CHESS_OPENINGS`)
- Modify: `tests/learn.test.js` (bump the bundled-opening count assertion)

**Interfaces:**
- Consumes: `ChessOpenings.validate()`, `ChessFEN.boardToFEN` (unchanged from Task 2) — no engine changes in this task, content-only.

- [ ] **Step 1: Bump the expected valid-opening count (red)**

Edit `tests/learn.test.js`: change

```js
    assert(result.valid.length === 1, 'the bundled opening (italian) passes validation');
```

to

```js
    assert(result.valid.length === 2, 'the bundled openings (italian, ruy-lopez) pass validation');
```

- [ ] **Step 2: Run the tests and confirm the count assertion fails**

Run: `node tests/learn.test.js`
Expected: the `test_openings_validate_accepts_bundled` assertion fails (`expected 2, got 1`); everything else still passes.

- [ ] **Step 3: Insert the Ruy Lopez tree into `js/chess-openings.js`**

Edit `js/chess-openings.js`: change

```js
                                          ] }
                                      ] }
                                  ] }
                              ] }
                          ] }
                      ] }
                  ] }
            ]
        }
    }
];

const ChessOpenings = (() => {
```

to

```js
                                          ] }
                                      ] }
                                  ] }
                              ] }
                          ] }
                      ] }
                  ] }
            ]
        }
    },
    {
        id: 'ruy-lopez',
        name: 'Ruy Lopez',
        caption: 'Ruy Lopez: e4 e5, Nf3 Nc6, Bb5 — pressure on the e5 pawn.',
        root: {
            move: null, fen: CHESS_START_FEN,
            children: [
                { move: { from: { r: 1, c: 4 }, to: { r: 3, c: 4 }, isDoubleStep: true },
                  fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                  children: [
                    { move: { from: { r: 6, c: 4 }, to: { r: 4, c: 4 }, isDoubleStep: true },
                      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                      children: [
                        { move: { from: { r: 0, c: 6 }, to: { r: 2, c: 5 } },
                          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
                          children: [
                            { move: { from: { r: 7, c: 1 }, to: { r: 5, c: 2 } },
                              fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
                              children: [
                                { move: { from: { r: 0, c: 5 }, to: { r: 4, c: 1 } },
                                  fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
                                  children: [
                                    // Berlin Defense (main line)
                                    { move: { from: { r: 7, c: 6 }, to: { r: 5, c: 5 } },
                                      fen: 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
                                      name: 'Berlin Defense', eco: 'C65', isMain: true,
                                      children: [
                                        { move: { from: { r: 0, c: 4 }, to: { r: 0, c: 6 }, castle: 'king' },
                                          fen: 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
                                          children: [] }
                                      ] },
                                    // Closed Ruy Lopez / Exchange Variation branch
                                    { move: { from: { r: 6, c: 0 }, to: { r: 5, c: 0 } },
                                      fen: 'r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
                                      name: 'Closed Ruy Lopez', eco: 'C84',
                                      children: [
                                        // Closed main line: 4.Ba4
                                        { move: { from: { r: 4, c: 1 }, to: { r: 3, c: 0 } },
                                          fen: 'r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 1 4',
                                          isMain: true,
                                          children: [
                                            { move: { from: { r: 7, c: 6 }, to: { r: 5, c: 5 } },
                                              fen: 'r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 5',
                                              children: [
                                                { move: { from: { r: 0, c: 4 }, to: { r: 0, c: 6 }, castle: 'king' },
                                                  fen: 'r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 3 5',
                                                  children: [] }
                                              ] }
                                          ] },
                                        // Exchange Variation: 4.Bxc6
                                        { move: { from: { r: 4, c: 1 }, to: { r: 5, c: 2 } },
                                          fen: 'r1bqkbnr/1ppp1ppp/p1B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4',
                                          name: 'Exchange Variation', eco: 'C68',
                                          children: [
                                            { move: { from: { r: 6, c: 3 }, to: { r: 5, c: 2 } },
                                              fen: 'r1bqkbnr/1pp2ppp/p1p5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
                                              children: [] }
                                          ] }
                                      ] }
                                  ] }
                              ] }
                          ] }
                      ] }
                  ] }
            ]
        }
    }
];

const ChessOpenings = (() => {
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `node tests/learn.test.js`
Expected: `0 failed` — `result.valid.length === 2` now holds (the Ruy Lopez tree's nested branch, including its own `isMain` White-turn choice between Ba4 and Bxc6, validates cleanly), and all other tests are unaffected.

- [ ] **Step 5: Commit**

```bash
git add js/chess-openings.js tests/learn.test.js
git commit -m "feat: add Ruy Lopez branching tree (Berlin Defense, Closed Ruy Lopez, Exchange Variation)"
```

---

## Task 4: Queen's Gambit tree (QGA, QGD, Slav Defense)

**Files:**
- Modify: `js/chess-openings.js` (insert the `queens-gambit` tree into `CHESS_OPENINGS`)
- Modify: `tests/learn.test.js` (bump the bundled-opening count assertion)

**Interfaces:**
- Consumes: same as Task 3 — content-only, no engine changes.

- [ ] **Step 1: Bump the expected valid-opening count (red)**

Edit `tests/learn.test.js`: change

```js
    assert(result.valid.length === 2, 'the bundled openings (italian, ruy-lopez) pass validation');
```

to

```js
    assert(result.valid.length === 3, 'all three bundled openings (italian, ruy-lopez, queens-gambit) pass validation');
```

- [ ] **Step 2: Run the tests and confirm the count assertion fails**

Run: `node tests/learn.test.js`
Expected: the `test_openings_validate_accepts_bundled` assertion fails (`expected 3, got 2`); everything else still passes.

- [ ] **Step 3: Insert the Queen's Gambit tree into `js/chess-openings.js`**

Edit `js/chess-openings.js`: change

```js
                                              fen: 'r1bqkbnr/1pp2ppp/p1p5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
                                              children: [] }
                                          ] }
                                      ] }
                                  ] }
                              ] }
                          ] }
                      ] }
                  ] }
            ]
        }
    }
];

const ChessOpenings = (() => {
```

to

```js
                                              fen: 'r1bqkbnr/1pp2ppp/p1p5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
                                              children: [] }
                                          ] }
                                      ] }
                                  ] }
                              ] }
                          ] }
                      ] }
                  ] }
            ]
        }
    },
    {
        id: 'queens-gambit',
        name: "Queen's Gambit",
        caption: "Queen's Gambit: d4 d5, c4 — offer a pawn for center control.",
        root: {
            move: null, fen: CHESS_START_FEN,
            children: [
                { move: { from: { r: 1, c: 3 }, to: { r: 3, c: 3 }, isDoubleStep: true },
                  fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
                  children: [
                    { move: { from: { r: 6, c: 3 }, to: { r: 4, c: 3 }, isDoubleStep: true },
                      fen: 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2',
                      children: [
                        { move: { from: { r: 1, c: 2 }, to: { r: 3, c: 2 } },
                          fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2',
                          children: [
                            // Queen's Gambit Accepted
                            { move: { from: { r: 4, c: 3 }, to: { r: 3, c: 2 } },
                              fen: 'rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
                              name: "Queen's Gambit Accepted", eco: 'D20',
                              children: [
                                { move: { from: { r: 0, c: 6 }, to: { r: 2, c: 5 } },
                                  fen: 'rnbqkbnr/ppp1pppp/8/8/2pP4/5N2/PP2PPPP/RNBQKB1R b KQkq - 1 3',
                                  children: [
                                    { move: { from: { r: 7, c: 6 }, to: { r: 5, c: 5 } },
                                      fen: 'rnbqkb1r/ppp1pppp/5n2/8/2pP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 2 4',
                                      children: [
                                        { move: { from: { r: 1, c: 4 }, to: { r: 2, c: 4 } },
                                          fen: 'rnbqkb1r/ppp1pppp/5n2/8/2pP4/4PN2/PP3PPP/RNBQKB1R b KQkq - 0 4',
                                          children: [
                                            { move: { from: { r: 6, c: 4 }, to: { r: 5, c: 4 } },
                                              fen: 'rnbqkb1r/ppp2ppp/4pn2/8/2pP4/4PN2/PP3PPP/RNBQKB1R w KQkq - 0 5',
                                              children: [
                                                { move: { from: { r: 0, c: 5 }, to: { r: 3, c: 2 } },
                                                  fen: 'rnbqkb1r/ppp2ppp/4pn2/8/2BP4/4PN2/PP3PPP/RNBQK2R b KQkq - 0 5',
                                                  children: [] }
                                              ] }
                                          ] }
                                      ] }
                                  ] }
                              ] },
                            // Queen's Gambit Declined (main line)
                            { move: { from: { r: 6, c: 4 }, to: { r: 5, c: 4 } },
                              fen: 'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
                              name: "Queen's Gambit Declined", eco: 'D30', isMain: true,
                              children: [
                                { move: { from: { r: 0, c: 1 }, to: { r: 2, c: 2 } },
                                  fen: 'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR b KQkq - 1 3',
                                  children: [
                                    { move: { from: { r: 7, c: 6 }, to: { r: 5, c: 5 } },
                                      fen: 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4',
                                      children: [
                                        { move: { from: { r: 0, c: 2 }, to: { r: 4, c: 6 } },
                                          fen: 'rnbqkb1r/ppp2ppp/4pn2/3p2B1/2PP4/2N5/PP2PPPP/R2QKBNR b KQkq - 3 4',
                                          children: [
                                            { move: { from: { r: 7, c: 5 }, to: { r: 6, c: 4 } },
                                              fen: 'rnbqk2r/ppp1bppp/4pn2/3p2B1/2PP4/2N5/PP2PPPP/R2QKBNR w KQkq - 4 5',
                                              children: [
                                                { move: { from: { r: 1, c: 4 }, to: { r: 2, c: 4 } },
                                                  fen: 'rnbqk2r/ppp1bppp/4pn2/3p2B1/2PP4/2N1P3/PP3PPP/R2QKBNR b KQkq - 0 5',
                                                  children: [] }
                                              ] }
                                          ] }
                                      ] }
                                  ] }
                              ] },
                            // Slav Defense
                            { move: { from: { r: 6, c: 2 }, to: { r: 5, c: 2 } },
                              fen: 'rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
                              name: 'Slav Defense', eco: 'D10',
                              children: [
                                { move: { from: { r: 0, c: 6 }, to: { r: 2, c: 5 } },
                                  fen: 'rnbqkbnr/pp2pppp/2p5/3p4/2PP4/5N2/PP2PPPP/RNBQKB1R b KQkq - 1 3',
                                  children: [
                                    { move: { from: { r: 7, c: 6 }, to: { r: 5, c: 5 } },
                                      fen: 'rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 2 4',
                                      children: [
                                        { move: { from: { r: 0, c: 1 }, to: { r: 2, c: 2 } },
                                          fen: 'rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 3 4',
                                          children: [
                                            { move: { from: { r: 4, c: 3 }, to: { r: 3, c: 2 } },
                                              fen: 'rnbqkb1r/pp2pppp/2p2n2/8/2pP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5',
                                              children: [
                                                { move: { from: { r: 1, c: 0 }, to: { r: 3, c: 0 }, isDoubleStep: true },
                                                  fen: 'rnbqkb1r/pp2pppp/2p2n2/8/P1pP4/2N2N2/1P2PPPP/R1BQKB1R b KQkq a3 0 5',
                                                  children: [] }
                                              ] }
                                          ] }
                                      ] }
                                  ] }
                              ] }
                          ] }
                      ] }
                  ] }
            ]
        }
    }
];

const ChessOpenings = (() => {
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `node tests/learn.test.js`
Expected: `0 failed` — all three openings (8 named variations total) validate, and the full `ChessLearn` traversal/branching suite still passes unchanged.

- [ ] **Step 5: Commit**

```bash
git add js/chess-openings.js tests/learn.test.js
git commit -m "feat: add Queen's Gambit branching tree (QGA, QGD, Slav Defense)"
```

---

## Self-Review Notes

- **Spec coverage:** FEN engine (Task 1) ✓; tree data model + validator with `isMain`/duplicate/fen-mismatch rules (Task 2) ✓; Italian/Ruy Lopez/Queen's Gambit — 8 variations total (Tasks 2–4) ✓; Practice accepts any child, Walkthrough only the `isMain` child, random Black auto-reply, dynamic caption via `path`, completion via `children.length === 0` (Task 2) ✓; all 5 `ChessFEN` test bullets and all 3 validator test bullets from the spec's Testing section ✓. The spec's "50 trials" suggestion for the random-auto-reply test is deliberately replaced with RNG injection (`setRngForTesting`) — documented inline in Task 2 — since it gives a stronger, faster, non-flaky guarantee than statistical sampling would.
- **Non-goals respected:** no PGN import, no ECO lookup database, no variation-picker UI, no 4th opening, no SRS — nothing in this plan touches those. `js/chess-renderer.js`, `js/chess-game.js`, `js/chess-moves.js`, `js/chess-board.js` are never modified.
- **No placeholders:** every FEN string in every task was computed by actually replaying the authored moves through the real `ChessMoves.applyMove` and the new `ChessFEN.boardToFEN` in a throwaway Node script, not hand-derived — copy them verbatim.
- **Bug fix folded into Task 2:** the original `chess-learn.js`'s wrong-move correction `setTimeout` (600ms) was never cancelled by `_clearTimers()`/`exit()`/`start()` — only the Black auto-play timer was. A stale correction timer from an earlier, already-exited Practice session could fire mid-way through a later session and call `_applyStep` with a stale closure-captured node, corrupting whatever session was then running. This was latent in the original code (never surfaced because no prior test chained two real-timer Practice sessions close together) and was caught here by actually running the new async branching tests end-to-end against the rewritten `chess-learn.js` before finalizing this plan. Task 2's `chess-learn.js` now tracks this timer as `pendingCorrection` and clears it alongside `pendingBlackMove`.
- **Type/name consistency checked:** `ChessOpenings.getById(id)` returns `{id, name, caption, root}` everywhere (Task 2 introduces it, Tasks 3–4 just add sibling array entries — no shape drift). `ChessLearn`'s new getters (`getCurrentNode`, `getCaption`, `setRngForTesting`) are defined once in Task 2 and reused as-is by every later task's tests.
