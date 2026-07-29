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
