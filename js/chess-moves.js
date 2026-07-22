/**
 * Modern Chess — Move Engine
 * Computes legal moves for each piece type, including check detection,
 * castling, en passant, and pawn promotion triggers.
 */
const ChessMoves = (() => {

    const ROOK_DIRECTIONS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const BISHOP_DIRECTIONS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const QUEEN_DIRECTIONS = ROOK_DIRECTIONS.concat(BISHOP_DIRECTIONS);
    const KNIGHT_OFFSETS = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    const KING_OFFSETS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    function _inBounds(row, col) {
        return row >= 0 && row < CHESS_BOARD_SIZE && col >= 0 && col < CHESS_BOARD_SIZE;
    }

    function _otherPlayer(player) {
        return player === CHESS_PLAYER.ONE ? CHESS_PLAYER.TWO : CHESS_PLAYER.ONE;
    }

    // ---- Raw movement generation (pseudo-legal, no self-check filtering) ----

    function _slidingMoves(row, col, player, board, directions) {
        const moves = [];
        for (let d = 0; d < directions.length; d++) {
            let newRow = row + directions[d][0];
            let newCol = col + directions[d][1];
            while (_inBounds(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else if (target.player !== player) {
                    moves.push({ row: newRow, col: newCol });
                    break;
                } else {
                    break;
                }
                newRow += directions[d][0];
                newCol += directions[d][1];
            }
        }
        return moves;
    }

    function _offsetMoves(row, col, player, board, offsets) {
        const moves = [];
        for (let i = 0; i < offsets.length; i++) {
            const newRow = row + offsets[i][0];
            const newCol = col + offsets[i][1];
            if (_inBounds(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target.player !== player) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        return moves;
    }

    function _pawnAdvanceAndCaptureMoves(row, col, player, board, enPassantTarget) {
        const forward = (player === CHESS_PLAYER.ONE) ? 1 : -1;
        const startRow = (player === CHESS_PLAYER.ONE) ? 1 : 6;
        const moves = [];

        // One square forward
        const oneRow = row + forward;
        if (_inBounds(oneRow, col) && !board[oneRow][col]) {
            moves.push({ row: oneRow, col: col });

            // Two squares forward from the starting rank
            const twoRow = row + forward * 2;
            if (row === startRow && _inBounds(twoRow, col) && !board[twoRow][col]) {
                moves.push({ row: twoRow, col: col, isDoubleStep: true });
            }
        }

        // Diagonal captures
        const captureCols = [col - 1, col + 1];
        for (let i = 0; i < captureCols.length; i++) {
            const newCol = captureCols[i];
            if (_inBounds(oneRow, newCol)) {
                const target = board[oneRow][newCol];
                if (target && target.player !== player) {
                    moves.push({ row: oneRow, col: newCol });
                } else if (!target && enPassantTarget &&
                    enPassantTarget.row === oneRow && enPassantTarget.col === newCol) {
                    moves.push({ row: oneRow, col: newCol, enPassant: true, capturedRow: row, capturedCol: newCol });
                }
            }
        }

        return moves;
    }

    function _castlingMoves(row, col, player, board) {
        const moves = [];
        const king = board[row][col];
        if (!king || king.moved) {
            return moves;
        }
        if (isSquareAttacked(board, row, col, _otherPlayer(player))) {
            return moves; // Can't castle out of check
        }

        // King-side: rook at col 7, king passes through col 5, 6
        const kingSideRook = board[row][7];
        if (kingSideRook && kingSideRook.type === CHESS_PIECE_TYPE.ROOK &&
            kingSideRook.player === player && !kingSideRook.moved &&
            !board[row][5] && !board[row][6] &&
            !isSquareAttacked(board, row, 5, _otherPlayer(player)) &&
            !isSquareAttacked(board, row, 6, _otherPlayer(player))) {
            moves.push({ row: row, col: 6, castle: 'king' });
        }

        // Queen-side: rook at col 0, king passes through col 3, 2 (col 1 must be empty too)
        const queenSideRook = board[row][0];
        if (queenSideRook && queenSideRook.type === CHESS_PIECE_TYPE.ROOK &&
            queenSideRook.player === player && !queenSideRook.moved &&
            !board[row][1] && !board[row][2] && !board[row][3] &&
            !isSquareAttacked(board, row, 3, _otherPlayer(player)) &&
            !isSquareAttacked(board, row, 2, _otherPlayer(player))) {
            moves.push({ row: row, col: 2, castle: 'queen' });
        }

        return moves;
    }

    /**
     * Get pseudo-legal moves for the piece at (row, col) — does not filter
     * moves that leave the mover's own king in check.
     */
    function getPseudoMoves(row, col, board, enPassantTarget) {
        const piece = board[row][col];
        if (!piece) {
            return [];
        }
        const player = piece.player;

        switch (piece.type) {
            case CHESS_PIECE_TYPE.KING:
                return _offsetMoves(row, col, player, board, KING_OFFSETS)
                    .concat(_castlingMoves(row, col, player, board));
            case CHESS_PIECE_TYPE.QUEEN:
                return _slidingMoves(row, col, player, board, QUEEN_DIRECTIONS);
            case CHESS_PIECE_TYPE.ROOK:
                return _slidingMoves(row, col, player, board, ROOK_DIRECTIONS);
            case CHESS_PIECE_TYPE.BISHOP:
                return _slidingMoves(row, col, player, board, BISHOP_DIRECTIONS);
            case CHESS_PIECE_TYPE.KNIGHT:
                return _offsetMoves(row, col, player, board, KNIGHT_OFFSETS);
            case CHESS_PIECE_TYPE.PAWN:
                return _pawnAdvanceAndCaptureMoves(row, col, player, board, enPassantTarget);
            default:
                return [];
        }
    }

    // ---- Attack detection (occupancy-independent, used for check/castling) ----

    function _pawnAttacksSquare(row, col, player, targetRow, targetCol) {
        const forward = (player === CHESS_PLAYER.ONE) ? 1 : -1;
        return targetRow === row + forward && (targetCol === col - 1 || targetCol === col + 1);
    }

    function _slidingAttacksSquare(row, col, board, directions, targetRow, targetCol) {
        for (let d = 0; d < directions.length; d++) {
            let newRow = row + directions[d][0];
            let newCol = col + directions[d][1];
            while (_inBounds(newRow, newCol)) {
                if (newRow === targetRow && newCol === targetCol) {
                    return true;
                }
                if (board[newRow][newCol]) {
                    break; // Blocked — nothing beyond this square is attacked
                }
                newRow += directions[d][0];
                newCol += directions[d][1];
            }
        }
        return false;
    }

    function _offsetAttacksSquare(row, col, offsets, targetRow, targetCol) {
        for (let i = 0; i < offsets.length; i++) {
            if (row + offsets[i][0] === targetRow && col + offsets[i][1] === targetCol) {
                return true;
            }
        }
        return false;
    }

    /**
     * isSquareAttacked — true if (targetRow, targetCol) is attacked by any
     * piece belonging to byPlayer on the given board.
     */
    function isSquareAttacked(board, targetRow, targetCol, byPlayer) {
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (!piece || piece.player !== byPlayer) {
                    continue;
                }
                switch (piece.type) {
                    case CHESS_PIECE_TYPE.PAWN:
                        if (_pawnAttacksSquare(row, col, piece.player, targetRow, targetCol)) return true;
                        break;
                    case CHESS_PIECE_TYPE.KNIGHT:
                        if (_offsetAttacksSquare(row, col, KNIGHT_OFFSETS, targetRow, targetCol)) return true;
                        break;
                    case CHESS_PIECE_TYPE.KING:
                        if (_offsetAttacksSquare(row, col, KING_OFFSETS, targetRow, targetCol)) return true;
                        break;
                    case CHESS_PIECE_TYPE.ROOK:
                        if (_slidingAttacksSquare(row, col, board, ROOK_DIRECTIONS, targetRow, targetCol)) return true;
                        break;
                    case CHESS_PIECE_TYPE.BISHOP:
                        if (_slidingAttacksSquare(row, col, board, BISHOP_DIRECTIONS, targetRow, targetCol)) return true;
                        break;
                    case CHESS_PIECE_TYPE.QUEEN:
                        if (_slidingAttacksSquare(row, col, board, QUEEN_DIRECTIONS, targetRow, targetCol)) return true;
                        break;
                    default:
                        break;
                }
            }
        }
        return false;
    }

    /**
     * isInCheck — true if the given player's king is currently attacked.
     */
    function isInCheck(board, player) {
        let kingRow = -1, kingCol = -1;
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece && piece.player === player && piece.type === CHESS_PIECE_TYPE.KING) {
                    kingRow = row;
                    kingCol = col;
                }
            }
        }
        if (kingRow === -1) {
            return false;
        }
        return isSquareAttacked(board, kingRow, kingCol, _otherPlayer(player));
    }

    /**
     * Simulate a move on a cloned board (including castling rook relocation
     * and en passant capture) and return the resulting board.
     */
    function _simulateMove(board, fromRow, fromCol, move) {
        const clone = board.map(r => r.map(p => p ? { type: p.type, player: p.player, moved: p.moved } : null));
        const piece = clone[fromRow][fromCol];

        clone[move.row][move.col] = piece;
        clone[fromRow][fromCol] = null;

        if (move.enPassant) {
            clone[move.capturedRow][move.capturedCol] = null;
        }
        if (move.castle === 'king') {
            clone[fromRow][5] = clone[fromRow][7];
            clone[fromRow][7] = null;
        } else if (move.castle === 'queen') {
            clone[fromRow][3] = clone[fromRow][0];
            clone[fromRow][0] = null;
        }

        return clone;
    }

    /**
     * Get all legal moves for the piece at (row, col) — pseudo-legal moves
     * filtered to exclude any that leave the mover's own king in check.
     * @param {Array} board - The 8×8 board array
     * @param {object|null} enPassantTarget - {row, col} square capturable via en passant, or null
     */
    function getLegalMoves(row, col, board, enPassantTarget) {
        const piece = board[row][col];
        if (!piece) {
            return [];
        }
        const pseudoMoves = getPseudoMoves(row, col, board, enPassantTarget || null);
        const legal = [];
        for (let i = 0; i < pseudoMoves.length; i++) {
            const move = pseudoMoves[i];
            const resultBoard = _simulateMove(board, row, col, move);
            if (!isInCheck(resultBoard, piece.player)) {
                legal.push(move);
            }
        }
        return legal;
    }

    /**
     * hasAnyLegalMove — true if the given player has at least one legal move.
     */
    function hasAnyLegalMove(player, board, enPassantTarget) {
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece && piece.player === player) {
                    if (getLegalMoves(row, col, board, enPassantTarget).length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    return {
        getLegalMoves: getLegalMoves,
        hasAnyLegalMove: hasAnyLegalMove,
        isInCheck: isInCheck,
        isSquareAttacked: isSquareAttacked
    };
})();
