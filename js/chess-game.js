/**
 * Modern Chess — Game Orchestrator Module
 * Main game loop, state machine (MENU → PLAYING → PROMOTING → GAME_OVER),
 * turn management, check/checkmate/stalemate detection, and reset logic.
 */
const ChessGame = (() => {
    'use strict';

    let gameState = CHESS_GAME_STATE.MENU;
    let activePlayer = CHESS_PLAYER.ONE;
    let selectedSquare = null;
    let legalMoves = [];
    let enPassantTarget = null;
    let pendingPromotion = null;
    let winner = null;
    let winReason = null;

    function _otherPlayer(player) {
        return player === CHESS_PLAYER.ONE ? CHESS_PLAYER.TWO : CHESS_PLAYER.ONE;
    }

    function init() {
        const canvas = document.getElementById('gameCanvas');

        ChessRenderer.init(canvas);
        ChessInput.init(canvas);
        ChessBoard.init();

        ChessInput.onClick(_handleClick);

        gameState = CHESS_GAME_STATE.MENU;
        ChessInput.enable();

        requestAnimationFrame(_gameLoop);
    }

    function _gameLoop() {
        ChessRenderer.clear();

        if (ChessLearn.isActive()) {
            ChessLearn.render();
            requestAnimationFrame(_gameLoop);
            return;
        }

        if (gameState === CHESS_GAME_STATE.MENU) {
            ChessRenderer.renderMenuScreen();
        } else if (gameState === CHESS_GAME_STATE.PLAYING) {
            const board = ChessBoard.getBoard();
            const inCheck = ChessMoves.isInCheck(board, activePlayer);

            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            if (inCheck) {
                ChessRenderer.renderCheckIndicator(ChessBoard.findKing(activePlayer));
            }
            ChessRenderer.renderHighlights(selectedSquare, legalMoves);
            ChessRenderer.renderPieces(board);
            ChessRenderer.renderCoordinates();
            ChessRenderer.renderTurnIndicator(activePlayer, inCheck);
        } else if (gameState === CHESS_GAME_STATE.PROMOTING) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            ChessRenderer.renderPromotionPicker(pendingPromotion.player);
        } else if (gameState === CHESS_GAME_STATE.GAME_OVER) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            ChessRenderer.renderGameOver(winner, winReason);
        }

        requestAnimationFrame(_gameLoop);
    }

    /**
     * _handleClick — the main interaction handler, routed by game state.
     * @param {object} point - {px, py} canvas-relative pixel coordinates
     */
    function _handleClick(point) {
        if (ChessLearn.isActive()) {
            // Back button takes priority. From the opening picker it exits Learn
            // mode entirely; from Walkthrough/Practice it returns to the picker.
            if (ChessRenderer.backButtonFromPixel(point.px, point.py)) {
                if (ChessLearn.getState() === CHESS_LEARN_STATE.MENU) {
                    ChessLearn.exit();
                } else {
                    ChessLearn.openMenu();
                }
                return;
            }
            ChessLearn.handleClick(point);
            return;
        }

        if (gameState === CHESS_GAME_STATE.MENU) {
            if (ChessRenderer.learnButtonFromPixel(point.px, point.py)) {
                ChessLearn.openMenu();
                return;
            }
            _startNewGame();
        } else if (gameState === CHESS_GAME_STATE.GAME_OVER) {
            _startNewGame();
        } else if (gameState === CHESS_GAME_STATE.PROMOTING) {
            const choiceIndex = ChessRenderer.promotionChoiceFromPixel(point.px, point.py);
            if (choiceIndex !== null) {
                _finalizePromotion(choiceIndex);
            }
        } else if (gameState === CHESS_GAME_STATE.PLAYING) {
            const square = ChessRenderer.squareFromPixel(point.px, point.py);
            if (!square) {
                return;
            }
            const { row, col } = square;

            const move = legalMoves.find((m) => m.row === row && m.col === col);

            if (move) {
                _executeMove(move);
            } else {
                const piece = ChessBoard.getPiece(row, col);
                if (piece && piece.player === activePlayer) {
                    _selectPiece(row, col);
                } else {
                    selectedSquare = null;
                    legalMoves = [];
                }
            }
        }
    }

    function _selectPiece(row, col) {
        const board = ChessBoard.getBoard();
        const piece = board[row][col];

        if (piece && piece.player === activePlayer) {
            selectedSquare = { row: row, col: col };
            legalMoves = ChessMoves.getLegalMoves(row, col, board, enPassantTarget);
        }
    }

    /**
     * _executeMove — apply a legal move (including castling rook relocation
     * and en passant capture), then either enter promotion or switch turns.
     */
    function _executeMove(move) {
        const fromRow = selectedSquare.row;
        const fromCol = selectedSquare.col;
        const board = ChessBoard.getBoard();
        const movingPieceBefore = board[fromRow][fromCol];

        const learnMove = {
            from: { r: fromRow, c: fromCol },
            to: { r: move.row, c: move.col },
            castle: move.castle,
            enPassant: move.enPassant,
            capturedRow: move.capturedRow,
            capturedCol: move.capturedCol,
            isDoubleStep: move.isDoubleStep
        };
        const result = ChessMoves.applyMove(board, enPassantTarget, learnMove);

        for (let r = 0; r < CHESS_BOARD_SIZE; r++) {
            for (let c = 0; c < CHESS_BOARD_SIZE; c++) {
                ChessBoard.setPiece(r, c, result.newBoard[r][c]);
            }
        }
        enPassantTarget = result.newEnPassantTarget;

        selectedSquare = null;
        legalMoves = [];

        const promotionRank = (movingPieceBefore.player === CHESS_PLAYER.ONE) ? 7 : 0;
        if (movingPieceBefore.type === CHESS_PIECE_TYPE.PAWN && move.row === promotionRank) {
            pendingPromotion = { row: move.row, col: move.col, player: movingPieceBefore.player };
            gameState = CHESS_GAME_STATE.PROMOTING;
        } else {
            _switchTurn();
        }
    }

    /**
     * _finalizePromotion — apply the chosen promotion piece type, then
     * resume the normal turn flow.
     */
    function _finalizePromotion(choiceIndex) {
        const newType = CHESS_PROMOTION_CHOICES[choiceIndex];
        ChessBoard.promotePiece(pendingPromotion.row, pendingPromotion.col, newType);
        pendingPromotion = null;
        gameState = CHESS_GAME_STATE.PLAYING;
        _switchTurn();
    }

    /**
     * _switchTurn — alternate the active player and check for checkmate/stalemate.
     */
    function _switchTurn() {
        const mover = activePlayer;
        activePlayer = _otherPlayer(activePlayer);

        const board = ChessBoard.getBoard();
        const inCheck = ChessMoves.isInCheck(board, activePlayer);
        const hasMove = ChessMoves.hasAnyLegalMove(activePlayer, board, enPassantTarget);

        if (!hasMove) {
            if (inCheck) {
                winner = mover;
                winReason = 'checkmate';
            } else {
                winner = null;
                winReason = 'stalemate';
            }
            gameState = CHESS_GAME_STATE.GAME_OVER;
        } else {
            gameState = CHESS_GAME_STATE.PLAYING;
        }
    }

    function _startNewGame() {
        ChessBoard.reset();
        activePlayer = CHESS_PLAYER.ONE;
        selectedSquare = null;
        legalMoves = [];
        enPassantTarget = null;
        pendingPromotion = null;
        winner = null;
        winReason = null;
        gameState = CHESS_GAME_STATE.PLAYING;
    }

    return { init: init };
})();

document.addEventListener('DOMContentLoaded', () => { ChessGame.init(); });
