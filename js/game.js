// ===== MAIN GAME =====
const Game = (() => {
    let state = STATE.TITLE;
    let score = 0;
    let highScore = 0;
    let scrollSpeed = INITIAL_SCROLL_SPEED;
    let canvas, ctx;
    let lastFrameTime = 0;
    let audioInitialized = false;

    function init() {
        // Initialize renderer
        const canvasElement = document.getElementById('gameCanvas');
        Renderer.init(canvasElement);
        canvas = Renderer.getCanvas();
        ctx = Renderer.getCtx();

        // Load high score
        highScore = loadHighScore();

        // Initialize input
        Input.init();
        Input.onAction(handleAction);

        // Handle resize
        window.addEventListener('resize', () => {
            Renderer.resize();
            canvas = Renderer.getCanvas();
            ctx = Renderer.getCtx();
        });

        // Start game loop
        requestAnimationFrame(gameLoop);
    }

    function handleAction() {
        // Initialize audio on first interaction
        if (!audioInitialized) {
            AudioManager.init();
            audioInitialized = true;
        }

        switch (state) {
            case STATE.TITLE:
                startGame();
                break;
            case STATE.PLAYING:
                Truck.lift();
                AudioManager.playEngine();
                break;
            case STATE.GAME_OVER:
                startGame();
                break;
        }
    }

    function startGame() {
        state = STATE.PLAYING;
        score = 0;
        scrollSpeed = INITIAL_SCROLL_SPEED;
        Truck.reset(canvas);
        Obstacles.reset();
    }

    function gameOver() {
        state = STATE.GAME_OVER;
        AudioManager.playGameOver();

        // Update high score
        if (score > highScore) {
            highScore = score;
            saveHighScore(highScore);
        }
    }

    function gameLoop(timestamp) {
        // Clear canvas
        Renderer.clear();

        // Render background (always)
        Renderer.renderBackground();

        if (state === STATE.PLAYING) {
            // Update physics
            Truck.update(canvas.height);

            // Update obstacles
            Obstacles.update(scrollSpeed, canvas);

            // Check ground collision
            const hitbox = Truck.getHitbox();
            if (hitbox.y + hitbox.height >= canvas.height - GROUND_HEIGHT) {
                gameOver();
            }

            // Check obstacle collision
            if (Obstacles.checkCollision(hitbox, canvas)) {
                gameOver();
            }

            // Check scoring
            const points = Obstacles.checkScoring(hitbox.x);
            if (points > 0) {
                score += points;
                updateDifficulty();
            }
        }

        // Render game objects
        Renderer.renderGround(state === STATE.PLAYING ? scrollSpeed : 0);
        Obstacles.render(ctx, canvas);
        Truck.render(ctx);

        // Render UI
        if (state === STATE.PLAYING) {
            Renderer.renderHUD(score);
        } else if (state === STATE.TITLE) {
            Renderer.renderTitleScreen(highScore);
        } else if (state === STATE.GAME_OVER) {
            Renderer.renderHUD(score);
            Renderer.renderGameOver(score, highScore);
        }

        // Continue loop
        requestAnimationFrame(gameLoop);
    }

    function updateDifficulty() {
        const level = Math.min(Math.floor(score / DIFFICULTY_INTERVAL), MAX_DIFFICULTY_LEVEL);
        scrollSpeed = INITIAL_SCROLL_SPEED + (level * 0.5);
        scrollSpeed = Math.min(scrollSpeed, MAX_SCROLL_SPEED);
    }

    function loadHighScore() {
        const stored = localStorage.getItem(HIGH_SCORE_KEY);
        return stored ? parseInt(stored, 10) : 0;
    }

    function saveHighScore(score) {
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
    }

    return { init };
})();

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', Game.init);
