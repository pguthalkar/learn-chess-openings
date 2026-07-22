// ===== AUDIO MANAGER =====
const AudioManager = (() => {
    let initialized = false;
    let audioContext = null;
    let engineBuffer = null;
    let gameOverBuffer = null;

    async function init() {
        if (initialized) return;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            engineBuffer = await loadSound('assets/jump.wav');
            gameOverBuffer = await loadSound('assets/game_over.wav');
            initialized = true;
        } catch (err) {
            console.warn('Audio initialization failed:', err);
        }
    }

    async function loadSound(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.decodeAudioData(arrayBuffer);
        } catch (err) {
            console.warn(`Failed to load sound: ${url}`, err);
            return null;
        }
    }

    function playEngine() {
        if (!initialized || !engineBuffer) return;
        playBuffer(engineBuffer);
    }

    function playGameOver() {
        if (!initialized || !gameOverBuffer) return;
        playBuffer(gameOverBuffer);
    }

    function playBuffer(buffer) {
        if (!audioContext || !buffer) return;

        // Resume context if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    }

    return { init, playEngine, playGameOver };
})();
