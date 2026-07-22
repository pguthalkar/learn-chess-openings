/**
 * Chaturanga — Input Handler Module
 * Translates mouse clicks and touch events into board coordinates.
 * Manages piece selection flow via registered callbacks.
 */
const ChInput = (() => {
    'use strict';

    let enabled = false;
    let squareClickCallback = null;
    let newGameCallback = null;

    /**
     * init — attach mouse click and touch event listeners to the canvas.
     * On click/touch, get pixel coordinates, convert to board square
     * using ChRenderer.squareFromPixel, and invoke the registered callback.
     */
    function init(canvas) {
        canvas.addEventListener('click', (e) => {
            if (!enabled) return;

            const rect = canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            const square = ChRenderer.squareFromPixel(px, py);
            if (square && squareClickCallback) {
                squareClickCallback(square);
            }
        });

        canvas.addEventListener('touchend', (e) => {
            if (!enabled) return;

            e.preventDefault();

            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const px = touch.clientX - rect.left;
            const py = touch.clientY - rect.top;

            const square = ChRenderer.squareFromPixel(px, py);
            if (square && squareClickCallback) {
                squareClickCallback(square);
            }
        });
    }

    /**
     * onSquareClick — register a callback function that gets called
     * with {row, col} when a valid board square is clicked/tapped.
     */
    function onSquareClick(callback) {
        squareClickCallback = callback;
    }

    /**
     * onNewGame — register a callback for the "new game" action.
     * Invoked by the game orchestrator during GAME_OVER state or
     * on the menu "Click to Start" button.
     */
    function onNewGame(callback) {
        newGameCallback = callback;
    }

    /**
     * enable — enable input processing (clicks are processed
     * and callbacks are invoked).
     */
    function enable() {
        enabled = true;
    }

    /**
     * disable — disable input processing (clicks are silently ignored).
     */
    function disable() {
        enabled = false;
    }

    return { init, onSquareClick, onNewGame, enable, disable };
})();
