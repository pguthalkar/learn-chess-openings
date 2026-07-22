/**
 * Chaturanga — Game Orchestrator Module
 * Main game loop, state machine (MENU → PLAYING → GAME_OVER),
 * turn management, victory detection, and reset logic.
 */
const ChGame = (() => {
    'use strict';

    // Internal state variables
    let gameState = CH_GAME_STATE.MENU;
    let activePlayer = CH_PLAYER.ONE;
    let selectedSquare = null;
    let legalMoves = [];
    let winner = null;
    let winReason = null;

    /**
     * init — called on DOMContentLoaded.
     * Initializes all modules, registers input callbacks, and starts the game loop.
     */
    function init() {
        const canvas = document.getElementById('gameCanvas');

        ChRenderer.init(canvas);
        ChInput.init(canvas);
        ChBoard.init();

        ChInput.onSquareClick(_handleSquareClick);

        gameState = CH_GAME_STATE.MENU;
        ChInput.enable();

        requestAnimationFrame(_gameLoop);
    }

    /**
     * _gameLoop — the render loop driven by requestAnimationFrame.
     * Renders the appropriate screen based on the current game state.
     */
    function _gameLoop() {
        ChRenderer.clear();

        if (gameState === CH_GAME_STATE.MENU) {
            ChRenderer.renderMenuScreen();
        } else if (gameState === CH_GAME_STATE.PLAYING) {
            ChRenderer.renderBoard();
            ChRenderer.renderBorder();
            ChRenderer.renderHighlights(selectedSquare, legalMoves);
            ChRenderer.renderPieces(ChBoard.getBoard());
            ChRenderer.renderTurnIndicator(activePlayer);
        } else if (gameState === CH_GAME_STATE.GAME_OVER) {
            ChRenderer.renderBoard();
            ChRenderer.renderBorder();
            ChRenderer.renderPieces(ChBoard.getBoard());
            ChRenderer.renderGameOver(winner, winReason);
        }

        requestAnimationFrame(_gameLoop);
    }

    /**
     * _handleSquareClick — the main interaction handler.
     * Routes click events based on the current game state.
     * @param {object} square - {row, col} of the clicked square
     */
    function _handleSquareClick(square) {
        const { row, col } = square;

        if (gameState === CH_GAME_STATE.MENU) {
            _startNewGame();
            gameState = CH_GAME_STATE.PLAYING;
        } else if (gameState === CH_GAME_STATE.GAME_OVER) {
            _startNewGame();
            gameState = CH_GAME_STATE.PLAYING;
        } else if (gameState === CH_GAME_STATE.PLAYING) {
            // Check if a legal move is clicked
            const isLegalMove = legalMoves.some(
                (move) => move.row === row && move.col === col
            );

            if (isLegalMove) {
                _executeMove(row, col);
            } else {
                // Check if the square has a piece belonging to the active player
                const piece = ChBoard.getPiece(row, col);
                if (piece && piece.player === activePlayer) {
                    _selectPiece(row, col);
                } else {
                    // Deselect
                    selectedSquare = null;
                    legalMoves = [];
                }
            }
        }
    }

    /**
     * _selectPiece — select a piece belonging to the active player.
     * Computes and stores its legal moves for highlighting.
     * @param {number} row - Row of the piece
     * @param {number} col - Column of the piece
     */
    function _selectPiece(row, col) {
        const board = ChBoard.getBoard();
        const piece = board[row][col];

        if (piece && piece.player === activePlayer) {
            selectedSquare = { row: row, col: col };
            legalMoves = ChMoves.getLegalMoves(row, col, board);
        }
    }

    /**
     * _executeMove — execute the move from the selected square to the destination.
     * Handles captures, Padati promotion, and victory detection.
     * @param {number} toRow - Destination row
     * @param {number} toCol - Destination column
     */
    function _executeMove(toRow, toCol) {
        const fromRow = selectedSquare.row;
        const fromCol = selectedSquare.col;

        // Get the piece before moving (to check for promotion)
        const movingPiece = ChBoard.getPiece(fromRow, fromCol);

        // Move the piece and capture if applicable
        const captured = ChBoard.movePiece(fromRow, fromCol, toRow, toCol);

        // Check Padati promotion
        if (movingPiece && movingPiece.type === CH_PIECE_TYPE.PADATI) {
            const promotionRank = (movingPiece.player === CH_PLAYER.ONE) ? 7 : 0;
            if (toRow === promotionRank) {
                ChBoard.promotePiece(toRow, toCol, CH_PIECE_TYPE.MANTRI);
            }
        }

        // Check if captured piece is a Raja — victory!
        if (captured && captured.type === CH_PIECE_TYPE.RAJA) {
            winner = activePlayer;
            winReason = 'capture';
            gameState = CH_GAME_STATE.GAME_OVER;
        } else {
            _switchTurn();
        }

        // Clear selection
        selectedSquare = null;
        legalMoves = [];
    }

    /**
     * _switchTurn — alternate the active player and check for stalemate.
     */
    function _switchTurn() {
        activePlayer = (activePlayer === CH_PLAYER.ONE) ? CH_PLAYER.TWO : CH_PLAYER.ONE;

        // Check stalemate
        const hasMove = ChMoves.hasAnyLegalMove(activePlayer, ChBoard.getBoard());
        if (!hasMove) {
            // The player with no moves loses; the other player wins
            winner = (activePlayer === CH_PLAYER.ONE) ? CH_PLAYER.TWO : CH_PLAYER.ONE;
            winReason = 'stalemate';
            gameState = CH_GAME_STATE.GAME_OVER;
        }
    }

    /**
     * _startNewGame — reset everything to the initial state.
     */
    function _startNewGame() {
        ChBoard.reset();
        activePlayer = CH_PLAYER.ONE;
        selectedSquare = null;
        legalMoves = [];
        winner = null;
        winReason = null;
        gameState = CH_GAME_STATE.PLAYING;
    }

    return { init: init };
})();

document.addEventListener('DOMContentLoaded', () => { ChGame.init(); });
