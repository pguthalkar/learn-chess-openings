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
    let opening = null;           // current opening object ({id, name, caption, root})
    let currentNode = null;       // tree pointer — current position in opening.root
    let path = [];                // nodes descended into so far, for caption lookup
    let step = 0;                 // ply counter — still the source of truth for turn parity
    let selectedFrom = null;      // {r, c} — piece user clicked first
    let wrongFlash = null;        // {square:{r,c}, until:number} for red flash
    let successFlash = null;      // {square:{r,c}, until:number} for green flash
    let correctionArrow = null;   // {from:{r,c}, to:{r,c}, until:number}
    let pendingBlackMove = null;  // timeout id for the 300ms Black auto-play
    let pendingCorrection = null; // timeout id for the 600ms Practice wrong-move correction
    let lastError = null;         // {message} for error overlay
    let _rng = Math.random;       // swappable for deterministic tests

    const BLACK_RESPONSE_DELAY_MS = 300;
    const WRONG_MOVE_FLASH_MS = 600;
    const SUCCESS_FLASH_MS = 400;

    function _clearTimers() {
        if (pendingBlackMove !== null) {
            clearTimeout(pendingBlackMove);
            pendingBlackMove = null;
        }
        if (pendingCorrection !== null) {
            clearTimeout(pendingCorrection);
            pendingCorrection = null;
        }
    }

    function _expectedPlayer() {
        return (step % 2 === 0) ? CHESS_PLAYER.ONE : CHESS_PLAYER.TWO;
    }

    function _mainChild(node) {
        return node.children.length === 1
            ? node.children[0]
            : node.children.find(c => c.isMain === true);
    }

    function _currentCaption() {
        for (let i = path.length - 1; i >= 0; i--) {
            if (path[i].name) return path[i].name;
        }
        return opening ? opening.caption : '';
    }

    function _applyStep(node) {
        const move = node.move;
        const board = ChessBoard.getBoard();
        let result;
        try {
            result = ChessMoves.applyMove(board, null, move);
        } catch (e) {
            lastError = { message: 'applyMove failed: ' + e.message };
            state = CHESS_LEARN_STATE.MENU;
            return;
        }
        for (let r = 0; r < CHESS_BOARD_SIZE; r++) {
            for (let c = 0; c < CHESS_BOARD_SIZE; c++) {
                ChessBoard.setPiece(r, c, result.newBoard[r][c]);
            }
        }
        currentNode = node;
        path.push(node);
        step++;
    }

    function _checkEndOrContinue() {
        if (currentNode.children.length === 0) {
            state = CHESS_LEARN_STATE.COMPLETE;
            return;
        }
        if (_expectedPlayer() === CHESS_PLAYER.TWO && state === CHESS_LEARN_STATE.PRACTICE) {
            _clearTimers();
            pendingBlackMove = setTimeout(() => {
                pendingBlackMove = null;
                if (state === CHESS_LEARN_STATE.PRACTICE && currentNode.children.length > 0 && _expectedPlayer() === CHESS_PLAYER.TWO) {
                    const children = currentNode.children;
                    const chosen = children[Math.floor(_rng() * children.length)];
                    _applyStep(chosen);
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
        currentNode = null;
        path = [];
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
        currentNode = op.root;
        path = [];
        step = 0;
        selectedFrom = null;
        wrongFlash = null;
        successFlash = null;
        correctionArrow = null;
        state = (mode === 'practice') ? CHESS_LEARN_STATE.PRACTICE : CHESS_LEARN_STATE.WALKTHROUGH;
        // If first move is Black's somehow, play it (shouldn't happen with our data — White always moves first)
        if (_expectedPlayer() === CHESS_PLAYER.TWO && currentNode.children.length > 0) {
            _applyStep(currentNode.children[0]);
        }
    }

    function exit() {
        _clearTimers();
        ChessBoard.reset();
        state = null;
        opening = null;
        currentNode = null;
        path = [];
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
        const expected = _mainChild(currentNode);
        const piece = ChessBoard.getPiece(sq.row, sq.col);

        if (!selectedFrom) {
            if (piece && piece.player === _expectedPlayer() &&
                sq.row === expected.move.from.r && sq.col === expected.move.from.c) {
                selectedFrom = { r: sq.row, c: sq.col };
            }
            return;
        }

        if (sq.row === expected.move.to.r && sq.col === expected.move.to.c &&
            selectedFrom.r === expected.move.from.r && selectedFrom.c === expected.move.from.c) {
            _applyStep(expected);
            selectedFrom = null;
            if (currentNode.children.length === 0) {
                state = CHESS_LEARN_STATE.COMPLETE;
            }
        } else {
            selectedFrom = null;
        }
    }

    function _handlePracticeClick(point) {
        // A correction is already pending (600ms flash window) — ignore clicks
        // until it resolves, rather than arming a second competing timer.
        if (pendingCorrection !== null) return;
        // Black's turn — clicks are ignored
        if (_expectedPlayer() === CHESS_PLAYER.TWO) return;

        const sq = ChessRenderer.squareFromPixel(point.px, point.py);
        if (!sq) return;

        if (!selectedFrom) {
            const candidate = currentNode.children.find(c => c.move.from.r === sq.row && c.move.from.c === sq.col);
            if (candidate) {
                selectedFrom = { r: sq.row, c: sq.col };
            }
            return;
        }

        const matched = currentNode.children.find(c =>
            c.move.from.r === selectedFrom.r && c.move.from.c === selectedFrom.c &&
            c.move.to.r === sq.row && c.move.to.c === sq.col);

        if (matched) {
            // Correct — any matching child (any named variation) is accepted
            successFlash = { square: { r: matched.move.to.r, c: matched.move.to.c }, until: Date.now() + SUCCESS_FLASH_MS };
            _applyStep(matched);
            selectedFrom = null;
            _checkEndOrContinue();
        } else {
            // Wrong destination — flash, show the correct (main-line) move, and auto-correct
            const correction = _mainChild(currentNode);
            wrongFlash = { square: { r: selectedFrom.r, c: selectedFrom.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            correctionArrow = { from: { r: correction.move.from.r, c: correction.move.from.c }, to: { r: correction.move.to.r, c: correction.move.to.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            selectedFrom = null;
            pendingCorrection = setTimeout(() => {
                pendingCorrection = null;
                if (state !== CHESS_LEARN_STATE.PRACTICE) return;
                wrongFlash = null;
                correctionArrow = null;
                _applyStep(correction);
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
            ChessRenderer.renderLearnCaption(_currentCaption());
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
        getFlashState: () => ({ wrongFlash, successFlash, correctionArrow }),
        getCurrentNode: () => currentNode,
        getCaption: () => _currentCaption(),
        setRngForTesting: (fn) => { _rng = fn || Math.random; }
    };
})();
