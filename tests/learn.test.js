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
loadScript('js/chess-fen.js');
loadScript('js/chess-board.js');
loadScript('js/chess-moves.js');
loadScript('js/chess-pieces.js');
loadScript('js/chess-renderer.js');
ChessBoard.init();

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
    // White pawn on a5 (row 3, col 0) captures diagonally to b6 (row 2, col 1).
    // Black pawn just double-stepped to b5 (row 4, col 1); en passant target is b6.
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
    assert(result.valid.length === 3, 'all three bundled openings (italian, ruy-lopez, queens-gambit) pass validation');
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

    await test_learn_practice_doubleWrongClickDoesNotCrashSession();
    await test_learn_practice_userPicksNonMainWhiteBranch_exchangeVariation();
    await test_learn_practice_userPicksMainWhiteBranch_closedMainLine();
    await test_learn_practice_threeWayBranch_picksThirdChild();
}

async function test_learn_practice_doubleWrongClickDoesNotCrashSession() {
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); // e2 — correct source
    clickSquare(3, 0); // a4 — wrong destination (arms first correction timer)
    clickSquare(1, 4); // e2 again — correct source
    clickSquare(3, 1); // b4 — wrong destination again, inside the first timer's 600ms window
    await sleep(700); // let both corrections resolve
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice after two rapid wrong clicks — no crash to menu');
    assert(ChessLearn.getError() === null, 'no error recorded after double wrong click');
    ChessLearn.exit();
}

async function test_learn_practice_userPicksNonMainWhiteBranch_exchangeVariation() {
    ChessLearn.setRngForTesting(() => 0.99); // forces Black's Nf6-vs-a6 pick to a6 (Closed Ruy Lopez)
    ChessLearn.start('ruy-lopez', 'practice');
    clickSquare(1, 4); clickSquare(3, 4); // 1.e4
    await sleep(400); // black auto 1...e5
    clickSquare(0, 6); clickSquare(2, 5); // 2.Nf3
    await sleep(400); // black auto 2...Nc6
    clickSquare(0, 5); clickSquare(4, 1); // 3.Bb5
    await sleep(400); // black auto-picks a6 (Closed Ruy Lopez) via rng=>0.99
    assertEqual(ChessLearn.getCurrentNode().name, 'Closed Ruy Lopez', 'black auto-play entered Closed Ruy Lopez');
    // White's turn now — user clicks the NON-main child (4.Bxc6, Exchange Variation)
    clickSquare(4, 1); clickSquare(5, 2);
    assertEqual(ChessLearn.getCurrentNode().name, 'Exchange Variation', 'user click on the non-main child is accepted in Practice');
    assert(ChessBoard.getPiece(5, 2) !== null && ChessBoard.getPiece(5, 2).type === 'bishop', 'white bishop captured on c6');
    ChessLearn.exit();
    ChessLearn.setRngForTesting(null);
}

async function test_learn_practice_userPicksMainWhiteBranch_closedMainLine() {
    ChessLearn.setRngForTesting(() => 0.99); // forces Black's Nf6-vs-a6 pick to a6 (Closed Ruy Lopez)
    ChessLearn.start('ruy-lopez', 'practice');
    clickSquare(1, 4); clickSquare(3, 4);
    await sleep(400);
    clickSquare(0, 6); clickSquare(2, 5);
    await sleep(400);
    clickSquare(0, 5); clickSquare(4, 1);
    await sleep(400);
    assertEqual(ChessLearn.getCurrentNode().name, 'Closed Ruy Lopez', 'black auto-play entered Closed Ruy Lopez');
    // White's turn — user clicks the MAIN child (4.Ba4)
    clickSquare(4, 1); clickSquare(3, 0);
    assert(ChessLearn.getState() === 'learn_practice' || ChessLearn.getState() === 'learn_complete', 'still progressing after main-line click');
    assert(ChessBoard.getPiece(3, 0) !== null && ChessBoard.getPiece(3, 0).type === 'bishop', 'white bishop retreated to a4');
    ChessLearn.exit();
    ChessLearn.setRngForTesting(null);
}

async function test_learn_practice_threeWayBranch_picksThirdChild() {
    ChessLearn.setRngForTesting(() => 0.99); // floor(0.99 * 3) = 2 -> third child
    ChessLearn.start('queens-gambit', 'practice');
    clickSquare(1, 3); clickSquare(3, 3); // 1.d4
    await sleep(400); // black auto 1...d5
    clickSquare(1, 2); clickSquare(3, 2); // 2.c4
    await sleep(400); // black auto-picks the 3rd branch child via rng=>0.99
    assertEqual(ChessLearn.getCurrentNode().name, 'Slav Defense', 'rng=>0.99 picks the third child (Slav Defense) of the 3-way branch');
    ChessLearn.exit();
    ChessLearn.setRngForTesting(null);
}

runAsyncBranchTests().then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
});
