/**
 * Modern Chess — Learn Mode
 * Sub-state machine for studying curated openings as either
 * a user-paced walkthrough or a practice drill.
 *
 * The main game state stays in CHESS_GAME_STATE.MENU while Learn is active;
 * ChessLearn owns its own state via CHESS_LEARN_STATE.
 *
 * Move application goes through ChessMoves.applyMove. The board is the
 * same ChessBoard the main game uses — Learn is a guest, not a parallel engine.
 */

const ChessLearn = (() => {
    'use strict';

    let state = null;             // one of CHESS_LEARN_STATE.*
    let opening = null;           // current opening object
    let step = 0;                 // index into opening.moves
    let selectedFrom = null;      // {r, c} — piece user clicked first
    let wrongFlash = null;        // {square:{r,c}, until:number} for red flash
    let successFlash = null;      // {square:{r,c}, until:number} for green flash
    let correctionArrow = null;   // {from:{r,c}, to:{r,c}, until:number}
    let pendingBlackMove = null;  // timeout id for the 300ms Black auto-play
    let lastError = null;         // {message} for error overlay

    const BLACK_RESPONSE_DELAY_MS = 300;
    const WRONG_MOVE_FLASH_MS = 600;
    const SUCCESS_FLASH_MS = 400;

    function _clearTimers() {
        if (pendingBlackMove !== null) {
            clearTimeout(pendingBlackMove);
            pendingBlackMove = null;
        }
    }

    function _expectedPlayer() {
        return (step % 2 === 0) ? CHESS_PLAYER.ONE : CHESS_PLAYER.TWO;
    }

    function _applyStep() {
        const move = opening.moves[step];
        const board = ChessBoard.getBoard();
        let result;
        try {
            result = ChessMoves.applyMove(board, null, move);
        } catch (e) {
            lastError = { message: 'applyMove failed at step ' + step + ': ' + e.message };
            state = CHESS_LEARN_STATE.MENU;
            return;
        }
        for (let r = 0; r < CHESS_BOARD_SIZE; r++) {
            for (let c = 0; c < CHESS_BOARD_SIZE; c++) {
                ChessBoard.setPiece(r, c, result.newBoard[r][c]);
            }
        }
        step++;
    }

    function _checkEndOrContinue() {
        if (step >= opening.moves.length) {
            state = CHESS_LEARN_STATE.COMPLETE;
            return;
        }
        // If next move is Black's, auto-play it after a short delay
        if (_expectedPlayer() === CHESS_PLAYER.TWO && state === CHESS_LEARN_STATE.PRACTICE) {
            _clearTimers();
            pendingBlackMove = setTimeout(() => {
                pendingBlackMove = null;
                if (state === CHESS_LEARN_STATE.PRACTICE && step < opening.moves.length && _expectedPlayer() === CHESS_PLAYER.TWO) {
                    _applyStep();
                    _checkEndOrContinue();
                }
            }, BLACK_RESPONSE_DELAY_MS);
        }
    }

    function openMenu() {
        _clearTimers();
        ChessBoard.reset();
        state = CHESS_LEARN_STATE.MENU;
        opening = null;
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
        successFlash = null;
        correctionArrow = null;
    }

    function start(openingId, mode) {
        _clearTimers();
        const op = ChessOpenings.getById(openingId);
        if (!op) {
            lastError = { message: 'Unknown opening: ' + openingId };
            state = CHESS_LEARN_STATE.MENU;
            return;
        }
        ChessBoard.reset();
        opening = op;
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
        successFlash = null;
        correctionArrow = null;
        state = (mode === 'practice') ? CHESS_LEARN_STATE.PRACTICE : CHESS_LEARN_STATE.WALKTHROUGH;
        // If first move is Black's somehow, play it (shouldn't happen with our data — White always moves first)
        if (_expectedPlayer() === CHESS_PLAYER.TWO) {
            _applyStep();
        }
    }

    function exit() {
        _clearTimers();
        ChessBoard.reset();
        state = null;
        opening = null;
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
        successFlash = null;
        correctionArrow = null;
    }

    function isActive() {
        return state !== null;
    }

    function handleClick(point) {
        if (state === CHESS_LEARN_STATE.MENU) {
            const opener = ChessRenderer.learnOpenerFromPixel(point.px, point.py);
            if (opener) {
                start(opener.id, opener.mode);
            }
            return;
        }
        if (state === CHESS_LEARN_STATE.WALKTHROUGH) {
            _handleWalkthroughClick(point);
            return;
        }
        if (state === CHESS_LEARN_STATE.PRACTICE) {
            _handlePracticeClick(point);
            return;
        }
        if (state === CHESS_LEARN_STATE.COMPLETE) {
            openMenu();
            return;
        }
    }

    function _handleWalkthroughClick(point) {
        const sq = ChessRenderer.squareFromPixel(point.px, point.py);
        if (!sq) return;
        const expected = opening.moves[step];
        const piece = ChessBoard.getPiece(sq.row, sq.col);

        if (!selectedFrom) {
            // Pick a piece — accept any of the active player's pieces that could plausibly move
            if (piece && piece.player === _expectedPlayer() &&
                sq.row === expected.from.r && sq.col === expected.from.c) {
                selectedFrom = { r: sq.row, c: sq.col };
            }
            return;
        }

        if (sq.row === expected.to.r && sq.col === expected.to.c &&
            selectedFrom.r === expected.from.r && selectedFrom.c === expected.from.c) {
            // Correct move — apply
            _applyStep();
            selectedFrom = null;
            if (step >= opening.moves.length) {
                state = CHESS_LEARN_STATE.COMPLETE;
            }
        } else {
            // Wrong destination — just deselect
            selectedFrom = null;
        }
    }

    function _handlePracticeClick(point) {
        // Black's turn — clicks are ignored
        if (_expectedPlayer() === CHESS_PLAYER.TWO) return;

        const sq = ChessRenderer.squareFromPixel(point.px, point.py);
        if (!sq) return;
        const expected = opening.moves[step];

        if (!selectedFrom) {
            // Selecting a piece — accept if it matches the expected source
            if (sq.row === expected.from.r && sq.col === expected.from.c) {
                selectedFrom = { r: sq.row, c: sq.col };
            }
            return;
        }

        // Already have selectedFrom. Check destination.
        if (sq.row === expected.to.r && sq.col === expected.to.c) {
            // Correct
            successFlash = { square: { r: expected.to.r, c: expected.to.c }, until: Date.now() + SUCCESS_FLASH_MS };
            _applyStep();
            selectedFrom = null;
            _checkEndOrContinue();
        } else {
            // Wrong destination — flash, show the correct move, and auto-correct
            wrongFlash = { square: { r: selectedFrom.r, c: selectedFrom.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            correctionArrow = { from: { r: expected.from.r, c: expected.from.c }, to: { r: expected.to.r, c: expected.to.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            selectedFrom = null;
            setTimeout(() => {
                if (state !== CHESS_LEARN_STATE.PRACTICE) return;
                wrongFlash = null;
                correctionArrow = null;
                _applyStep();
                _checkEndOrContinue();
            }, WRONG_MOVE_FLASH_MS);
        }
    }

    function render() {
        if (state === CHESS_LEARN_STATE.MENU) {
            ChessRenderer.renderLearnMenu();
            return;
        }
        if (state === CHESS_LEARN_STATE.WALKTHROUGH || state === CHESS_LEARN_STATE.PRACTICE) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            // Highlight selectedFrom in walkthrough and practice
            if (selectedFrom) {
                ChessRenderer.renderHighlights({ row: selectedFrom.r, col: selectedFrom.c }, []);
            }
            // Caption
            const caption = opening ? opening.caption : '';
            ChessRenderer.renderLearnCaption(caption);
            // Wrong-move flash overlay
            if (wrongFlash && Date.now() < wrongFlash.until) {
                ChessRenderer.renderWrongFlash(wrongFlash.square);
            }
            // Correct-move flash overlay
            if (successFlash && Date.now() < successFlash.until) {
                ChessRenderer.renderSuccessFlash(successFlash.square);
            }
            // Correction arrow (shown during the same window as wrongFlash)
            if (correctionArrow && Date.now() < correctionArrow.until) {
                ChessRenderer.renderCorrectionArrow(correctionArrow.from, correctionArrow.to);
            }
            // Back button
            ChessRenderer.renderBackButton();
            return;
        }
        if (state === CHESS_LEARN_STATE.COMPLETE) {
            ChessRenderer.renderBoard();
            ChessRenderer.renderBorder();
            ChessRenderer.renderPieces(ChessBoard.getBoard());
            ChessRenderer.renderCoordinates();
            ChessRenderer.renderLearnComplete();
            return;
        }
    }

    return {
        openMenu,
        start,
        exit,
        isActive,
        handleClick,
        render,
        getState: () => state,
        getError: () => lastError,
        getFlashState: () => ({ wrongFlash, successFlash, correctionArrow })
    };
})();
