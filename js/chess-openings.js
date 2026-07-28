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
