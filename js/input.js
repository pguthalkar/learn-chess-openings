// ===== INPUT HANDLER =====
const Input = (() => {
    let actionCallback = null;

    function init() {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClick);
        document.addEventListener('touchstart', handleTouch);
    }

    function handleKeyDown(e) {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            if (e.repeat) return; // Ignore held key
            if (actionCallback) actionCallback();
        }
    }

    function handleClick() {
        if (actionCallback) actionCallback();
    }

    function handleTouch(e) {
        e.preventDefault();
        if (actionCallback) actionCallback();
    }

    function onAction(callback) {
        actionCallback = callback;
    }

    return { init, onAction };
})();
