/**
 * Modern Chess — Board Data Model
 * Manages the 8×8 board array representation.
 * Handles piece placement, removal, and board queries.
 */
const ChessBoard = (() => {
    // Internal 8×8 board state
    let board = [];

    /**
     * Deep copy a piece object (or null).
     */
    function _clonePiece(piece) {
        if (piece === null) return null;
        return { type: piece.type, player: piece.player, moved: !!piece.moved };
    }

    /**
     * Deep copy the entire 8×8 board from a source array.
     */
    function _cloneBoard(source) {
        const copy = [];
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            copy[row] = [];
            for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
                copy[row][col] = _clonePiece(source[row][col]);
            }
        }
        return copy;
    }

    /**
     * Initialize the board with starting positions (deep copy from constants).
     */
    function init() {
        board = _cloneBoard(CHESS_INITIAL_POSITIONS);
    }

    /**
     * Reset the board to the initial starting positions.
     */
    function reset() {
        board = _cloneBoard(CHESS_INITIAL_POSITIONS);
    }

    /**
     * Get the piece at a given position.
     */
    function getPiece(row, col) {
        if (row < 0 || row >= CHESS_BOARD_SIZE || col < 0 || col >= CHESS_BOARD_SIZE) {
            return null;
        }
        return board[row][col];
    }

    /**
     * Place a piece on the board at the given position.
     */
    function setPiece(row, col, piece) {
        if (row < 0 || row >= CHESS_BOARD_SIZE || col < 0 || col >= CHESS_BOARD_SIZE) {
            return;
        }
        board[row][col] = piece;
    }

    /**
     * Remove a piece from the board at the given position.
     */
    function removePiece(row, col) {
        if (row < 0 || row >= CHESS_BOARD_SIZE || col < 0 || col >= CHESS_BOARD_SIZE) {
            return null;
        }
        const piece = board[row][col];
        board[row][col] = null;
        return piece;
    }

    /**
     * Move a piece from one square to another. Marks the piece as moved
     * (used for castling and pawn double-step eligibility).
     * @returns {object|null} Captured piece or null
     */
    function movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        const captured = board[toRow][toCol];
        if (piece) {
            piece.moved = true;
        }
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = null;
        return captured;
    }

    /**
     * Get a read-only deep copy of the current board state.
     */
    function getBoard() {
        return _cloneBoard(board);
    }

    /**
     * Find all pieces belonging to a given player.
     */
    function findPieces(player) {
        const pieces = [];
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece && piece.player === player) {
                    pieces.push({ row: row, col: col, piece: piece });
                }
            }
        }
        return pieces;
    }

    /**
     * Find the King piece for a given player.
     */
    function findKing(player) {
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece && piece.player === player && piece.type === CHESS_PIECE_TYPE.KING) {
                    return { row: row, col: col };
                }
            }
        }
        return null;
    }

    /**
     * Promote a piece at the given position to a new type.
     */
    function promotePiece(row, col, newType) {
        if (row < 0 || row >= CHESS_BOARD_SIZE || col < 0 || col >= CHESS_BOARD_SIZE) {
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
        findKing: findKing,
        promotePiece: promotePiece
    };
})();
