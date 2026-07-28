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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
