/**
 * Chaturanga — Move Engine
 * Computes legal moves for each piece type.
 * Contains core game logic for movement rules and captures.
 */
const ChMoves = (() => {

    /**
     * Check if a position is within board bounds.
     */
    function _inBounds(row, col) {
        return row >= 0 && row < CH_BOARD_SIZE && col >= 0 && col < CH_BOARD_SIZE;
    }

    /**
     * Get legal moves for the Raja (King).
     * Moves one square in any direction (8 offsets).
     * Can move to empty squares or capture opponent pieces.
     */
    function _getRajaMoves(row, col, player, board) {
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
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

    /**
     * Get legal moves for the Mantri (Minister).
     * Moves one square diagonally (4 offsets).
     * Can move to empty squares or capture opponent pieces.
     */
    function _getMantriMoves(row, col, player, board) {
        const offsets = [
            [-1, -1], [-1, 1],
            [1, -1],  [1, 1]
        ];
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

    /**
     * Get legal moves for the Gaja (Elephant).
     * Moves exactly two squares diagonally (4 offsets).
     * Can jump over intervening pieces — no blocking check.
     * Can move to empty squares or capture opponent pieces.
     */
    function _getGajaMoves(row, col, player, board) {
        const offsets = [
            [-2, -2], [-2, 2],
            [2, -2],  [2, 2]
        ];
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

    /**
     * Get legal moves for the Ashva (Horse).
     * Moves in an L-shape (8 offsets).
     * Can jump over intervening pieces.
     * Can move to empty squares or capture opponent pieces.
     */
    function _getAshvaMoves(row, col, player, board) {
        const offsets = [
            [-2, -1], [-2, 1],
            [-1, -2], [-1, 2],
            [1, -2],  [1, 2],
            [2, -1],  [2, 1]
        ];
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

    /**
     * Get legal moves for the Ratha (Chariot).
     * Slides along 4 cardinal directions (rank and file).
     * Stops at first obstruction:
     *   - Opponent piece: include (capture), then stop
     *   - Own piece: exclude, then stop
     */
    function _getRathaMoves(row, col, player, board) {
        const directions = [
            [0, 1], [0, -1], [1, 0], [-1, 0]
        ];
        const moves = [];
        for (let d = 0; d < directions.length; d++) {
            const dRow = directions[d][0];
            const dCol = directions[d][1];
            let newRow = row + dRow;
            let newCol = col + dCol;
            while (_inBounds(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target) {
                    // Empty square — add and continue
                    moves.push({ row: newRow, col: newCol });
                } else if (target.player !== player) {
                    // Opponent piece — add (capture) and stop
                    moves.push({ row: newRow, col: newCol });
                    break;
                } else {
                    // Own piece — stop without adding
                    break;
                }
                newRow += dRow;
                newCol += dCol;
            }
        }
        return moves;
    }

    /**
     * Get legal moves for the Padati (Infantry/Pawn).
     * Forward direction: Player 1 moves +row (increasing), Player 2 moves -row (decreasing).
     * - Forward move: one square forward if empty
     * - Capture: diagonal forward squares if occupied by opponent
     * - No two-square advance option
     */
    function _getPadatiMoves(row, col, player, board) {
        const forward = (player === CH_PLAYER.ONE) ? 1 : -1;
        const moves = [];

        // Forward move (one square forward, must be empty)
        const fRow = row + forward;
        if (_inBounds(fRow, col)) {
            if (!board[fRow][col]) {
                moves.push({ row: fRow, col: col });
            }
        }

        // Diagonal captures (forward-left and forward-right)
        const captureOffsets = [
            [forward, -1],
            [forward, 1]
        ];
        for (let i = 0; i < captureOffsets.length; i++) {
            const newRow = row + captureOffsets[i][0];
            const newCol = col + captureOffsets[i][1];
            if (_inBounds(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (target && target.player !== player) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    /**
     * Get all legal moves for the piece at the given position.
     * Dispatches to the appropriate helper based on piece type.
     * @param {number} row - Row of the piece
     * @param {number} col - Column of the piece
     * @param {Array} board - The 8×8 board array
     * @returns {Array} Array of {row, col} legal destination squares
     */
    function getLegalMoves(row, col, board) {
        const piece = board[row][col];
        if (!piece) {
            return [];
        }

        const player = piece.player;

        switch (piece.type) {
            case CH_PIECE_TYPE.RAJA:
                return _getRajaMoves(row, col, player, board);
            case CH_PIECE_TYPE.MANTRI:
                return _getMantriMoves(row, col, player, board);
            case CH_PIECE_TYPE.GAJA:
                return _getGajaMoves(row, col, player, board);
            case CH_PIECE_TYPE.ASHVA:
                return _getAshvaMoves(row, col, player, board);
            case CH_PIECE_TYPE.RATHA:
                return _getRathaMoves(row, col, player, board);
            case CH_PIECE_TYPE.PADATI:
                return _getPadatiMoves(row, col, player, board);
            default:
                return [];
        }
    }

    /**
     * Check if the given player has at least one legal move available.
     * Iterates all pieces of the player, returning true as soon as any piece has a legal move.
     * @param {number} player - The player to check (CH_PLAYER.ONE or CH_PLAYER.TWO)
     * @param {Array} board - The 8×8 board array
     * @returns {boolean} True if the player has at least one legal move
     */
    function hasAnyLegalMove(player, board) {
        for (let row = 0; row < CH_BOARD_SIZE; row++) {
            for (let col = 0; col < CH_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece && piece.player === player) {
                    const moves = getLegalMoves(row, col, board);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    return {
        getLegalMoves: getLegalMoves,
        hasAnyLegalMove: hasAnyLegalMove
    };
})();
