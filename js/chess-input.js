/**
 * Modern Chess — Input Handler Module
 * Translates mouse clicks and touch events into canvas pixel coordinates.
 * The game orchestrator maps those to board squares or UI panels.
 */
const ChessInput = (() => {
    'use strict';

    let enabled = false;
    let clickCallback = null;

    function init(canvas) {
        canvas.addEventListener('click', (e) => {
            if (!enabled) return;

            const rect = canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            if (clickCallback) {
                clickCallback({ px, py });
            }
        });

        canvas.addEventListener('touchend', (e) => {
            if (!enabled) return;

            e.preventDefault();

            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const px = touch.clientX - rect.left;
            const py = touch.clientY - rect.top;

            if (clickCallback) {
                clickCallback({ px, py });
            }
        });
    }

    /**
     * onClick — register a callback invoked with {px, py} canvas-relative
     * pixel coordinates on every click/tap.
     */
    function onClick(callback) {
        clickCallback = callback;
    }

    function enable() {
        enabled = true;
    }

    function disable() {
        enabled = false;
    }

    return { init, onClick, enable, disable };
})();
