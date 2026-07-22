/**
 * Chaturanga — Board Data Model
 * Manages the 8×8 board array representation.
 * Handles piece placement, removal, and board queries.
 */
const ChBoard = (() => {
    // Internal 8×8 board state
    let board = [];

    /**
     * Deep copy a piece object (or null).
     */
    function _clonePiece(piece) {
        if (piece === null) return null;
        return { type: piece.type, player: piece.player };
    }

    /**
     * Deep copy the entire 8×8 board from a source array.
     */
    function _cloneBoard(source) {
        const copy = [];
        for (let row = 0; row < CH_BOARD_SIZE; row++) {
            copy[row] = [];
            for (let col = 0; col < CH_BOARD_SIZE; col++) {
                copy[row][col] = _clonePiece(source[row][col]);
            }
        }
        return copy;
    }

    /**
     * Initialize the board with starting positions (deep copy from constants).
     */
    function init() {
        board = _cloneBoard(CH_INITIAL_POSITIONS);
    }

    /**
     * Reset the board to the initial starting positions.
     */
    function reset() {
        board = _cloneBoard(CH_INITIAL_POSITIONS);
    }

    /**
     * Get the piece at a given position.
     * @param {number} row - Row index (0-7)
     * @param {number} col - Column index (0-7)
     * @returns {object|null} Piece object {type, player} or null
     */
    function getPiece(row, col) {
        if (row < 0 || row >= CH_BOARD_SIZE || col < 0 || col >= CH_BOARD_SIZE) {
            return null;
        }
        return board[row][col];
    }

    /**
     * Place a piece on the board at the given position.
     * @param {number} row - Row index (0-7)
     * @param {number} col - Column index (0-7)
     * @param {object} piece - Piece object {type, player}
     */
    function setPiece(row, col, piece) {
        if (row < 0 || row >= CH_BOARD_SIZE || col < 0 || col >= CH_BOARD_SIZE) {
            return;
        }
        board[row][col] = piece;
    }

    /**
     * Remove a piece from the board at the given position.
     * @param {number} row - Row index (0-7)
     * @param {number} col - Column index (0-7)
     * @returns {object|null} The removed piece or null if square was empty
     */
    function removePiece(row, col) {
        if (row < 0 || row >= CH_BOARD_SIZE || col < 0 || col >= CH_BOARD_SIZE) {
            return null;
        }
        const piece = board[row][col];
        board[row][col] = null;
        return piece;
    }

    /**
     * Move a piece from one square to another.
     * @param {number} fromRow - Source row
     * @param {number} fromCol - Source column
     * @param {number} toRow - Destination row
     * @param {number} toCol - Destination column
     * @returns {object|null} Captured piece or null
     */
    function movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        const captured = board[toRow][toCol];
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = null;
        return captured;
    }

    /**
     * Get a read-only deep copy of the current board state.
     * @returns {Array} 8×8 2D array (deep copy)
     */
    function getBoard() {
        return _cloneBoard(board);
    }

    /**
     * Find all pieces belonging to a given player.
     * @param {number} player - Player identifier (CH_PLAYER.ONE or CH_PLAYER.TWO)
     * @returns {Array} Array of {row, col, piece} objects
     */
    function findPieces(player) {
        const pieces = [];
        for (let row = 0; row < CH_BOARD_SIZE; row++) {
            for (let col = 0; col < CH_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece && piece.player === player) {
                    pieces.push({ row: row, col: col, piece: piece });
                }
            }
        }
        return pieces;
    }

    /**
     * Find the Raja (King) piece for a given player.
     * @param {number} player - Player identifier
     * @returns {object|null} {row, col} of the Raja or null if not found
     */
    function findRaja(player) {
        for (let row = 0; row < CH_BOARD_SIZE; row++) {
            for (let col = 0; col < CH_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece && piece.player === player && piece.type === CH_PIECE_TYPE.RAJA) {
                    return { row: row, col: col };
                }
            }
        }
        return null;
    }

    /**
     * Promote a piece at the given position to a new type.
     * Used for Padati promotion to Mantri.
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} newType - New piece type (e.g., CH_PIECE_TYPE.MANTRI)
     */
    function promotePiece(row, col, newType) {
        if (row < 0 || row >= CH_BOARD_SIZE || col < 0 || col >= CH_BOARD_SIZE) {
            return;
        }
        const piece = board[row][col];
        if (piece) {
            piece.type = newType;
        }
    }

    return {
        init: init,
        reset: reset,
        getPiece: getPiece,
        setPiece: setPiece,
        removePiece: removePiece,
        movePiece: movePiece,
        getBoard: getBoard,
        findPieces: findPieces,
        findRaja: findRaja,
        promotePiece: promotePiece
    };
})();
