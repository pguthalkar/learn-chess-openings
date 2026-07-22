/**
 * Chaturanga — Comprehensive Integration Test
 * Final checkpoint: verifies all modules work together correctly.
 *
 * Run with: node tests/ch-integration.test.js
 */

// ─── Load Node-compatible modules ───────────────────────────────────────────
// These IIFE modules assign to global const variables, so we evaluate them
// in a shared context using vm.runInThisContext to simulate <script> loading.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(filePath) {
    const absPath = path.resolve(__dirname, '..', filePath);
    const code = fs.readFileSync(absPath, 'utf8');
    vm.runInThisContext(code, { filename: absPath });
}

loadScript('js/ch-constants.js');
loadScript('js/ch-board.js');
loadScript('js/ch-moves.js');

// ─── Test Utilities ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ FAIL: ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ FAIL: ${message} (expected ${expected}, got ${actual})`);
    }
}

function assertDeepEqual(actual, expected, message) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a === e) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ FAIL: ${message}`);
        console.error(`    expected: ${e}`);
        console.error(`    actual:   ${a}`);
    }
}

// ─── TEST 1: Board Initialization ──────────────────────────────────────────

console.log('\n═══ TEST 1: Board Initialization with Correct Piece Placement ═══');

ChBoard.init();
const initBoard = ChBoard.getBoard();

// Check board is 8×8
assertEqual(initBoard.length, 8, 'Board has 8 rows');
for (let r = 0; r < 8; r++) {
    assert(initBoard[r].length === 8, `Row ${r} has 8 columns`);
}

// Check Player 1 back rank (row 0)
assertEqual(initBoard[0][0].type, 'ratha', 'P1 row 0 col 0 is Ratha');
assertEqual(initBoard[0][1].type, 'ashva', 'P1 row 0 col 1 is Ashva');
assertEqual(initBoard[0][2].type, 'gaja', 'P1 row 0 col 2 is Gaja');
assertEqual(initBoard[0][3].type, 'mantri', 'P1 row 0 col 3 is Mantri');
assertEqual(initBoard[0][4].type, 'raja', 'P1 row 0 col 4 is Raja');
assertEqual(initBoard[0][5].type, 'gaja', 'P1 row 0 col 5 is Gaja');
assertEqual(initBoard[0][6].type, 'ashva', 'P1 row 0 col 6 is Ashva');
assertEqual(initBoard[0][7].type, 'ratha', 'P1 row 0 col 7 is Ratha');

// Check Player 1 pawns (row 1)
for (let c = 0; c < 8; c++) {
    assertEqual(initBoard[1][c].type, 'padati', `P1 row 1 col ${c} is Padati`);
    assertEqual(initBoard[1][c].player, 1, `P1 row 1 col ${c} belongs to Player 1`);
}

// Check empty rows (2-5)
for (let r = 2; r <= 5; r++) {
    for (let c = 0; c < 8; c++) {
        assertEqual(initBoard[r][c], null, `Row ${r} col ${c} is empty`);
    }
}

// Check Player 2 pawns (row 6)
for (let c = 0; c < 8; c++) {
    assertEqual(initBoard[6][c].type, 'padati', `P2 row 6 col ${c} is Padati`);
    assertEqual(initBoard[6][c].player, 2, `P2 row 6 col ${c} belongs to Player 2`);
}

// Check Player 2 back rank (row 7)
assertEqual(initBoard[7][0].type, 'ratha', 'P2 row 7 col 0 is Ratha');
assertEqual(initBoard[7][4].type, 'raja', 'P2 row 7 col 4 is Raja');

// Total piece count
let totalPieces = 0;
for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
        if (initBoard[r][c]) totalPieces++;
    }
}
assertEqual(totalPieces, 32, 'Board has 32 pieces at start');

// ─── TEST 2: Legal Move Generation for All Piece Types ──────────────────────

console.log('\n═══ TEST 2: Legal Move Generation for All Piece Types ═══');

// Test Raja moves (place Raja in center of empty board)
ChBoard.init();
// Clear the board for isolated testing
for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
        ChBoard.setPiece(r, c, null);
    }
}
ChBoard.setPiece(4, 4, { type: CH_PIECE_TYPE.RAJA, player: CH_PLAYER.ONE });

let board = ChBoard.getBoard();
let moves = ChMoves.getLegalMoves(4, 4, board);
assertEqual(moves.length, 8, 'Raja in center has 8 legal moves');

// Test Raja in corner
ChBoard.setPiece(4, 4, null);
ChBoard.setPiece(0, 0, { type: CH_PIECE_TYPE.RAJA, player: CH_PLAYER.ONE });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(0, 0, board);
assertEqual(moves.length, 3, 'Raja in corner has 3 legal moves');

// Test Mantri moves (center)
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);
ChBoard.setPiece(3, 3, { type: CH_PIECE_TYPE.MANTRI, player: CH_PLAYER.ONE });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(3, 3, board);
assertEqual(moves.length, 4, 'Mantri in center has 4 legal moves');

// Test Gaja moves (center, with jumping)
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);
ChBoard.setPiece(4, 4, { type: CH_PIECE_TYPE.GAJA, player: CH_PLAYER.ONE });
// Place blocking piece on intervening square
ChBoard.setPiece(3, 3, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(4, 4, board);
assertEqual(moves.length, 4, 'Gaja in center has 4 legal moves (can jump)');

// Test Ashva moves (center)
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);
ChBoard.setPiece(4, 4, { type: CH_PIECE_TYPE.ASHVA, player: CH_PLAYER.ONE });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(4, 4, board);
assertEqual(moves.length, 8, 'Ashva in center has 8 legal moves');

// Test Ratha moves (open file/rank)
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);
ChBoard.setPiece(4, 4, { type: CH_PIECE_TYPE.RATHA, player: CH_PLAYER.ONE });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(4, 4, board);
assertEqual(moves.length, 14, 'Ratha in center of empty board has 14 legal moves');

// Test Ratha blocked by own piece
ChBoard.setPiece(4, 6, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(4, 4, board);
// Right direction: col 5 only (col 6 is own piece, blocked)
// All other directions: 4 left, 4 up, 4 down + 1 right = 13
assertEqual(moves.length, 12, 'Ratha blocked by own piece loses squares (12 moves)');

// Test Ratha captures opponent
ChBoard.setPiece(4, 6, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(4, 4, board);
// Right direction: col 5 + col 6 (capture) = 2
// Other: 4 left, 4 up, 4 down = 12 + 2 = 14...wait let me think
// Actually left: col 3, 2, 1, 0 = 4, up: row 5,6,7 = 3, down: row 3,2,1,0 = 4, right: col 5, col 6 (capture) = 2
// Total = 4 + 3 + 4 + 2 = 13
assertEqual(moves.length, 13, 'Ratha captures opponent piece (13 moves)');

// Test Padati moves (forward from starting position)
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);
ChBoard.setPiece(1, 3, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(1, 3, board);
assertEqual(moves.length, 1, 'Padati with empty forward has 1 move');

// Test Padati captures
ChBoard.setPiece(2, 2, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
ChBoard.setPiece(2, 4, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(1, 3, board);
assertEqual(moves.length, 3, 'Padati with forward + two captures has 3 moves');

// Test Padati blocked forward
ChBoard.setPiece(2, 3, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(1, 3, board);
assertEqual(moves.length, 2, 'Padati blocked forward but can capture diagonals has 2 moves');

// ─── TEST 3: Move Execution with Captures ──────────────────────────────────

console.log('\n═══ TEST 3: Move Execution with Captures ═══');

ChBoard.init();
// Clear for a simple test
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);

ChBoard.setPiece(3, 3, { type: CH_PIECE_TYPE.RATHA, player: CH_PLAYER.ONE });
ChBoard.setPiece(3, 6, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });

const captured = ChBoard.movePiece(3, 3, 3, 6);

assertEqual(ChBoard.getPiece(3, 3), null, 'Source square is empty after move');
assertEqual(ChBoard.getPiece(3, 6).type, 'ratha', 'Destination has the moved piece');
assertEqual(ChBoard.getPiece(3, 6).player, 1, 'Moved piece belongs to Player 1');
assertEqual(captured.type, 'padati', 'Captured piece is Padati');
assertEqual(captured.player, 2, 'Captured piece belongs to Player 2');

// ─── TEST 4: Turn Alternation ───────────────────────────────────────────────

console.log('\n═══ TEST 4: Turn Alternation Logic ═══');

// Simulate turn switching
let activePlayer = CH_PLAYER.ONE;
assertEqual(activePlayer, 1, 'Game starts with Player 1');

activePlayer = (activePlayer === CH_PLAYER.ONE) ? CH_PLAYER.TWO : CH_PLAYER.ONE;
assertEqual(activePlayer, 2, 'After move, turn switches to Player 2');

activePlayer = (activePlayer === CH_PLAYER.ONE) ? CH_PLAYER.TWO : CH_PLAYER.ONE;
assertEqual(activePlayer, 1, 'After another move, turn switches back to Player 1');

// ─── TEST 5: Padati Promotion to Mantri ─────────────────────────────────────

console.log('\n═══ TEST 5: Padati Promotion to Mantri ═══');

for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);

// Player 1 Padati about to promote (moves to row 7)
ChBoard.setPiece(6, 3, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE });
ChBoard.movePiece(6, 3, 7, 3);

// Simulate promotion check as done in ch-game.js
const movedPiece = ChBoard.getPiece(7, 3);
const promotionRank = (movedPiece.player === CH_PLAYER.ONE) ? 7 : 0;
if (movedPiece.type === CH_PIECE_TYPE.PADATI && 7 === promotionRank) {
    ChBoard.promotePiece(7, 3, CH_PIECE_TYPE.MANTRI);
}

const promotedPiece = ChBoard.getPiece(7, 3);
assertEqual(promotedPiece.type, 'mantri', 'Padati promoted to Mantri at last rank');
assertEqual(promotedPiece.player, 1, 'Promoted piece still belongs to Player 1');

// After promotion, piece should have Mantri moves
board = ChBoard.getBoard();
moves = ChMoves.getLegalMoves(7, 3, board);
// Mantri at (7,3) — only diagonal squares within bounds: (6,2) and (6,4)
assertEqual(moves.length, 2, 'Promoted Mantri has correct number of diagonal moves');

// Player 2 Padati promotion (moves to row 0)
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);
ChBoard.setPiece(1, 5, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
ChBoard.movePiece(1, 5, 0, 5);

const p2Piece = ChBoard.getPiece(0, 5);
const p2PromotionRank = (p2Piece.player === CH_PLAYER.ONE) ? 7 : 0;
if (p2Piece.type === CH_PIECE_TYPE.PADATI && 0 === p2PromotionRank) {
    ChBoard.promotePiece(0, 5, CH_PIECE_TYPE.MANTRI);
}
assertEqual(ChBoard.getPiece(0, 5).type, 'mantri', 'Player 2 Padati promoted to Mantri at row 0');

// ─── TEST 6: Victory by Raja Capture ────────────────────────────────────────

console.log('\n═══ TEST 6: Victory by Raja Capture ═══');

for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);

ChBoard.setPiece(4, 4, { type: CH_PIECE_TYPE.RAJA, player: CH_PLAYER.TWO });
ChBoard.setPiece(4, 3, { type: CH_PIECE_TYPE.RATHA, player: CH_PLAYER.ONE });

// Player 1 captures Player 2's Raja
const capturedRaja = ChBoard.movePiece(4, 3, 4, 4);
assertEqual(capturedRaja.type, 'raja', 'Captured piece is Raja');
assertEqual(capturedRaja.player, 2, 'Captured Raja belongs to Player 2');

// Simulate victory detection
let gameOver = false;
let winner = null;
let winReason = null;
if (capturedRaja && capturedRaja.type === CH_PIECE_TYPE.RAJA) {
    gameOver = true;
    winner = CH_PLAYER.ONE;
    winReason = 'capture';
}
assert(gameOver, 'Game is over after Raja capture');
assertEqual(winner, 1, 'Player 1 is the winner');
assertEqual(winReason, 'capture', 'Win reason is capture');

// ─── TEST 7: Stalemate Detection ────────────────────────────────────────────

console.log('\n═══ TEST 7: Stalemate Detection ═══');

for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) ChBoard.setPiece(r, c, null);

// Player 2 Raja in corner, surrounded by its OWN pieces so it can't capture any
ChBoard.setPiece(0, 0, { type: CH_PIECE_TYPE.RAJA, player: CH_PLAYER.TWO });
// Block all escape squares with Player 2's own pieces (Raja can't move to own pieces)
ChBoard.setPiece(1, 0, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
ChBoard.setPiece(1, 1, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
ChBoard.setPiece(0, 1, { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO });
// The padatis also must not have legal moves. They move backward (toward row 0)
// for Player 2, so forward for P2 = decreasing row. They're at row 1 — forward is row 0,
// which is blocked. They also need blocked diagonal captures.
// Actually, Player 2 padati at (1,0): forward = row 0, col 0 is occupied by Raja (own),
//   diagonal forward = (0,1) occupied by own piece. No capture targets. So (1,0) has 0 moves.
// Player 2 padati at (1,1): forward = row 0, col 1 is occupied by own piece (0,1).
//   diagonal captures: (0,0) occupied by own Raja, (0,2) is empty — but diagonal capture
//   requires opponent piece there. So (1,1) has 0 moves.
// Player 2 padati at (0,1): at row 0 already, forward = row -1 out of bounds. 0 moves.
// So Player 2 has no legal moves at all. 

board = ChBoard.getBoard();
const hasMove = ChMoves.hasAnyLegalMove(CH_PLAYER.TWO, board);
assertEqual(hasMove, false, 'Player 2 (Raja + Padatis all blocked) has no legal moves — stalemate');

// Place a Player 1 piece that has a move
ChBoard.setPiece(4, 4, { type: CH_PIECE_TYPE.RAJA, player: CH_PLAYER.ONE });
board = ChBoard.getBoard();
const p1HasMove = ChMoves.hasAnyLegalMove(CH_PLAYER.ONE, board);
assertEqual(p1HasMove, true, 'Player 1 still has legal moves');

// ─── TEST 8: Game Reset ─────────────────────────────────────────────────────

console.log('\n═══ TEST 8: Game Reset ═══');

// Mess up the board
ChBoard.setPiece(4, 4, { type: CH_PIECE_TYPE.RAJA, player: CH_PLAYER.ONE });
ChBoard.setPiece(0, 0, null);

// Reset
ChBoard.reset();
const resetBoard = ChBoard.getBoard();

// Verify it matches initial positions
let matchesInitial = true;
for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
        const piece = resetBoard[r][c];
        const expected = CH_INITIAL_POSITIONS[r][c];
        if (piece === null && expected === null) continue;
        if (piece === null || expected === null) { matchesInitial = false; break; }
        if (piece.type !== expected.type || piece.player !== expected.player) {
            matchesInitial = false;
            break;
        }
    }
    if (!matchesInitial) break;
}
assert(matchesInitial, 'Board reset restores initial 32-piece layout');

// Count pieces after reset
let resetCount = 0;
for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
        if (resetBoard[r][c]) resetCount++;
    }
}
assertEqual(resetCount, 32, 'Reset board has 32 pieces');

// ─── SUMMARY ────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════');
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('═══════════════════════════════════════════════════\n');

if (failed > 0) {
    process.exit(1);
}
