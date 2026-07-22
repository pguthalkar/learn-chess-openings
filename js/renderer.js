// ===== RENDERER =====
const Renderer = (() => {
    let canvas, ctx;
    let groundOffset = 0;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function getCanvas() { return canvas; }
    function getCtx() { return ctx; }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function renderBackground() {
        // Sky
        ctx.fillStyle = COLORS.sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);
    }

    function renderGround(scrollSpeed) {
        const groundY = canvas.height - GROUND_HEIGHT;

        // Road surface
        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(0, groundY, canvas.width, GROUND_HEIGHT);

        // Road edge (top)
        ctx.fillStyle = COLORS.groundEdge;
        ctx.fillRect(0, groundY, canvas.width, 4);

        // Scrolling dashed center line
        groundOffset = (groundOffset + scrollSpeed) % 40;
        ctx.strokeStyle = COLORS.groundLine;
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -groundOffset;
        ctx.beginPath();
        ctx.moveTo(0, groundY + GROUND_HEIGHT / 2);
        ctx.lineTo(canvas.width, groundY + GROUND_HEIGHT / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Road shoulder lines
        ctx.strokeStyle = '#FDD835';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 8);
        ctx.lineTo(canvas.width, groundY + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, groundY + GROUND_HEIGHT - 4);
        ctx.lineTo(canvas.width, groundY + GROUND_HEIGHT - 4);
        ctx.stroke();
    }

    function renderHUD(score) {
        const fontSize = Math.max(24, canvas.width * 0.04);
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';

        // Score with outline
        const scoreText = String(score);
        const scoreX = canvas.width / 2;
        const scoreY = fontSize + 20;

        ctx.strokeStyle = COLORS.scoreOutline;
        ctx.lineWidth = 4;
        ctx.strokeText(scoreText, scoreX, scoreY);
        ctx.fillStyle = COLORS.scoreText;
        ctx.fillText(scoreText, scoreX, scoreY);
    }

    function renderTitleScreen(highScore) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        const titleSize = Math.max(36, canvas.width * 0.06);
        ctx.font = `bold ${titleSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.titleText;
        ctx.fillText('Flappy Kiro', canvas.width / 2, canvas.height * 0.3);

        // Truck emoji as decoration
        const emojiSize = Math.max(40, canvas.width * 0.05);
        ctx.font = `${emojiSize}px Arial`;
        ctx.fillText('🚛', canvas.width / 2, canvas.height * 0.42);

        // Subtitle
        const subSize = Math.max(18, canvas.width * 0.025);
        ctx.font = `${subSize}px Arial, sans-serif`;
        ctx.fillStyle = COLORS.subtitleText;
        ctx.fillText('Press Space to start your truck journey', canvas.width / 2, canvas.height * 0.55);

        // High score
        if (highScore > 0) {
            const hsSize = Math.max(16, canvas.width * 0.02);
            ctx.font = `${hsSize}px Arial, sans-serif`;
            ctx.fillStyle = COLORS.subtitleText;
            ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height * 0.65);
        }

        // Controls hint
        const hintSize = Math.max(14, canvas.width * 0.016);
        ctx.font = `${hintSize}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText('Spacebar or Click/Tap to jump', canvas.width / 2, canvas.height * 0.75);
    }

    function renderGameOver(score, highScore) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Game Over text
        const goSize = Math.max(40, canvas.width * 0.06);
        ctx.font = `bold ${goSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gameOverText;
        ctx.fillText('Game Over', canvas.width / 2, canvas.height * 0.3);

        // Score
        const scoreSize = Math.max(24, canvas.width * 0.035);
        ctx.font = `bold ${scoreSize}px Arial, sans-serif`;
        ctx.fillStyle = COLORS.scoreText;
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height * 0.45);

        // High score
        const hsSize = Math.max(20, canvas.width * 0.028);
        ctx.font = `${hsSize}px Arial, sans-serif`;
        ctx.fillStyle = COLORS.subtitleText;
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height * 0.55);

        // New high score indicator
        if (score >= highScore && score > 0) {
            ctx.fillStyle = '#FFEB3B';
            ctx.fillText('🏆 New High Score! 🏆', canvas.width / 2, canvas.height * 0.63);
        }

        // Play again prompt
        const promptSize = Math.max(18, canvas.width * 0.025);
        ctx.font = `${promptSize}px Arial, sans-serif`;
        ctx.fillStyle = COLORS.subtitleText;
        ctx.fillText('Press Space or Click to Play Again', canvas.width / 2, canvas.height * 0.75);
    }

    return {
        init, resize, getCanvas, getCtx, clear,
        renderBackground, renderGround, renderHUD,
        renderTitleScreen, renderGameOver
    };
})();
