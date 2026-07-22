/**
 * Chaturanga — Board and UI Rendering Module
 * Draws the board, pieces, highlights, borders, turn indicator,
 * menu screen, and game-over overlays on the HTML5 Canvas.
 */
const ChRenderer = (() => {
    'use strict';

    let canvas, ctx;
    let boardSize, squareSize, offsetX, offsetY;

    /**
     * init — store canvas reference, get 2d context, compute initial
     * board dimensions, and set up resize listener.
     */
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');

        // Size canvas to fill viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        resize();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            resize();
        });
    }

    /**
     * resize — recompute board size so it fits within 85% of the
     * smallest viewport dimension, centered on canvas.
     */
    function resize() {
        squareSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.85 / CH_BOARD_SIZE);
        boardSize = squareSize * CH_BOARD_SIZE;
        offsetX = Math.floor((canvas.width - boardSize) / 2);
        offsetY = Math.floor((canvas.height - boardSize) / 2);
    }

    /**
     * getBoardMetrics — return current layout metrics.
     */
    function getBoardMetrics() {
        return { boardSize, squareSize, offsetX, offsetY };
    }

    /**
     * squareFromPixel — convert pixel coordinates to board {row, col} or null.
     * Board row 0 is at the BOTTOM visually (Player 1's side).
     */
    function squareFromPixel(px, py) {
        const localX = px - offsetX;
        const localY = py - offsetY;

        if (localX < 0 || localX >= boardSize || localY < 0 || localY >= boardSize) {
            return null;
        }

        const col = Math.floor(localX / squareSize);
        const visualRow = Math.floor(localY / squareSize);
        // Row 0 is at the bottom, row 7 at the top visually
        const row = 7 - visualRow;

        if (row < 0 || row >= CH_BOARD_SIZE || col < 0 || col >= CH_BOARD_SIZE) {
            return null;
        }

        return { row, col };
    }

    /**
     * renderBoard — draw 64 alternating squares.
     */
    function renderBoard() {
        for (let row = 0; row < CH_BOARD_SIZE; row++) {
            for (let col = 0; col < CH_BOARD_SIZE; col++) {
                const isLight = (row + col) % 2 === 0;
                ctx.fillStyle = isLight ? CH_COLORS.boardLight : CH_COLORS.boardDark;

                const x = offsetX + col * squareSize;
                const y = offsetY + (7 - row) * squareSize;
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }
    }

    /**
     * renderBorder — draw ornate Indian-style border around the board.
     */
    function renderBorder() {
        const borderWidth = Math.max(12, squareSize * 0.2);
        const halfBorder = borderWidth / 2;

        // Outer frame
        ctx.strokeStyle = CH_COLORS.border;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(
            offsetX - halfBorder,
            offsetY - halfBorder,
            boardSize + borderWidth,
            boardSize + borderWidth
        );

        // Inner golden accent line
        const accentWidth = Math.max(3, borderWidth * 0.25);
        ctx.strokeStyle = CH_COLORS.borderAccent;
        ctx.lineWidth = accentWidth;
        ctx.strokeRect(
            offsetX - accentWidth,
            offsetY - accentWidth,
            boardSize + accentWidth * 2,
            boardSize + accentWidth * 2
        );

        // Corner lotus/mandala motifs using arc patterns
        _drawCornerMotif(offsetX, offsetY, borderWidth);
        _drawCornerMotif(offsetX + boardSize, offsetY, borderWidth);
        _drawCornerMotif(offsetX, offsetY + boardSize, borderWidth);
        _drawCornerMotif(offsetX + boardSize, offsetY + boardSize, borderWidth);

        // Repeating diamond/geometric patterns along edges
        _drawEdgePatterns(borderWidth);
    }

    /**
     * Draw a lotus/mandala motif at a corner position.
     */
    function _drawCornerMotif(cx, cy, borderWidth) {
        const r = borderWidth * 0.6;

        ctx.save();
        ctx.strokeStyle = CH_COLORS.borderAccent;
        ctx.lineWidth = 2;

        // Draw concentric arcs to form a mandala pattern
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, angle, angle + Math.PI / 2);
            ctx.stroke();
        }

        // Inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = CH_COLORS.borderAccent;
        ctx.fill();

        // Petals
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const petalX = cx + Math.cos(angle) * r * 0.7;
            const petalY = cy + Math.sin(angle) * r * 0.7;
            ctx.beginPath();
            ctx.arc(petalX, petalY, r * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = CH_COLORS.borderAccent;
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Draw repeating diamond patterns along board edges.
     */
    function _drawEdgePatterns(borderWidth) {
        const diamondSize = squareSize * 0.2;
        const patternOffset = borderWidth * 0.75;

        ctx.save();
        ctx.fillStyle = CH_COLORS.borderAccent;

        // Top edge
        for (let i = 0; i < CH_BOARD_SIZE; i++) {
            const cx = offsetX + i * squareSize + squareSize / 2;
            const cy = offsetY - patternOffset;
            _drawDiamond(cx, cy, diamondSize);
        }

        // Bottom edge
        for (let i = 0; i < CH_BOARD_SIZE; i++) {
            const cx = offsetX + i * squareSize + squareSize / 2;
            const cy = offsetY + boardSize + patternOffset;
            _drawDiamond(cx, cy, diamondSize);
        }

        // Left edge
        for (let i = 0; i < CH_BOARD_SIZE; i++) {
            const cx = offsetX - patternOffset;
            const cy = offsetY + i * squareSize + squareSize / 2;
            _drawDiamond(cx, cy, diamondSize);
        }

        // Right edge
        for (let i = 0; i < CH_BOARD_SIZE; i++) {
            const cx = offsetX + boardSize + patternOffset;
            const cy = offsetY + i * squareSize + squareSize / 2;
            _drawDiamond(cx, cy, diamondSize);
        }

        ctx.restore();
    }

    /**
     * Draw a single diamond shape at (cx, cy).
     */
    function _drawDiamond(cx, cy, size) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size * 0.6, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size * 0.6, cy);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * renderPieces — iterate the 8×8 board array and draw each piece.
     * Board row 0 draws at the bottom, row 7 at the top.
     */
    function renderPieces(board) {
        for (let row = 0; row < CH_BOARD_SIZE; row++) {
            for (let col = 0; col < CH_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece) {
                    const x = offsetX + col * squareSize;
                    const y = offsetY + (7 - row) * squareSize;
                    ChPieces.drawPiece(ctx, piece, x, y, squareSize);
                }
            }
        }
    }

    /**
     * renderHighlights — draw selection glow and legal move indicators.
     */
    function renderHighlights(selected, legalMoves) {
        // Draw selection highlight
        if (selected) {
            const x = offsetX + selected.col * squareSize;
            const y = offsetY + (7 - selected.row) * squareSize;

            ctx.save();
            ctx.fillStyle = CH_COLORS.selected;
            ctx.fillRect(x, y, squareSize, squareSize);

            // Glow effect
            ctx.shadowColor = CH_COLORS.selected;
            ctx.shadowBlur = squareSize * 0.3;
            ctx.strokeStyle = CH_COLORS.borderAccent;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, squareSize - 4, squareSize - 4);
            ctx.restore();
        }

        // Draw legal move indicators
        if (legalMoves && legalMoves.length > 0) {
            ctx.save();
            for (let i = 0; i < legalMoves.length; i++) {
                const move = legalMoves[i];
                const x = offsetX + move.col * squareSize + squareSize / 2;
                const y = offsetY + (7 - move.row) * squareSize + squareSize / 2;
                const radius = squareSize * 0.2;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = CH_COLORS.legalMove;
                ctx.fill();

                // Subtle border on the indicator
                ctx.strokeStyle = 'rgba(76, 175, 80, 0.9)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    /**
     * renderTurnIndicator — display text indicating whose turn it is.
     */
    function renderTurnIndicator(activePlayer) {
        const text = activePlayer === CH_PLAYER.ONE
            ? 'Player 1\'s Turn (Red)'
            : 'Player 2\'s Turn (Green)';

        const fontSize = Math.max(16, squareSize * 0.35);

        ctx.save();
        ctx.font = `bold ${fontSize}px serif`;
        ctx.fillStyle = CH_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Position below the board
        const textY = offsetY + boardSize + squareSize * 0.7;
        ctx.fillText(text, canvas.width / 2, textY);
        ctx.restore();
    }

    /**
     * renderMenuScreen — draw a title/start screen.
     */
    function renderMenuScreen() {
        // Background overlay
        ctx.fillStyle = CH_COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title: "CHATURANGA" in golden text
        const titleSize = Math.max(36, Math.min(canvas.width, canvas.height) * 0.08);
        ctx.font = `bold ${titleSize}px serif`;
        ctx.fillStyle = CH_COLORS.textPrimary;
        ctx.fillText('CHATURANGA', centerX, centerY - titleSize * 1.2);

        // Decorative line under title
        const lineWidth = titleSize * 3;
        ctx.strokeStyle = CH_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth / 2, centerY - titleSize * 0.5);
        ctx.lineTo(centerX + lineWidth / 2, centerY - titleSize * 0.5);
        ctx.stroke();

        // Subtitle
        const subtitleSize = Math.max(18, titleSize * 0.4);
        ctx.font = `${subtitleSize}px serif`;
        ctx.fillStyle = CH_COLORS.textSecondary;
        ctx.fillText('Ancient Indian Chess', centerX, centerY);

        // "Click to Start" button text
        const btnSize = Math.max(20, titleSize * 0.45);
        ctx.font = `bold ${btnSize}px serif`;
        ctx.fillStyle = CH_COLORS.textPrimary;

        const btnY = centerY + titleSize * 1.2;
        const btnText = 'Click to Start';
        const btnMetrics = ctx.measureText(btnText);
        const btnPadX = btnSize * 0.8;
        const btnPadY = btnSize * 0.5;

        // Button background
        ctx.fillStyle = CH_COLORS.border;
        ctx.fillRect(
            centerX - btnMetrics.width / 2 - btnPadX,
            btnY - btnPadY,
            btnMetrics.width + btnPadX * 2,
            btnSize + btnPadY * 2
        );

        // Button border
        ctx.strokeStyle = CH_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            centerX - btnMetrics.width / 2 - btnPadX,
            btnY - btnPadY,
            btnMetrics.width + btnPadX * 2,
            btnSize + btnPadY * 2
        );

        // Button text
        ctx.fillStyle = CH_COLORS.textPrimary;
        ctx.font = `bold ${btnSize}px serif`;
        ctx.fillText(btnText, centerX, btnY + btnSize * 0.35);

        // Decorative corner elements on the screen
        _drawMenuDecoration(centerX, centerY, titleSize);

        ctx.restore();
    }

    /**
     * Draw decorative elements on the menu screen.
     */
    function _drawMenuDecoration(centerX, centerY, titleSize) {
        const r = titleSize * 0.3;
        const positions = [
            { x: centerX - titleSize * 2.5, y: centerY - titleSize * 1.2 },
            { x: centerX + titleSize * 2.5, y: centerY - titleSize * 1.2 }
        ];

        ctx.fillStyle = CH_COLORS.borderAccent;
        positions.forEach(pos => {
            // Small diamond decorations
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - r);
            ctx.lineTo(pos.x + r * 0.6, pos.y);
            ctx.lineTo(pos.x, pos.y + r);
            ctx.lineTo(pos.x - r * 0.6, pos.y);
            ctx.closePath();
            ctx.fill();
        });
    }

    /**
     * renderGameOver — draw a semi-transparent overlay with winner info.
     */
    function renderGameOver(winner, reason) {
        // Semi-transparent overlay
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Winner text
        const titleSize = Math.max(28, Math.min(canvas.width, canvas.height) * 0.06);
        ctx.font = `bold ${titleSize}px serif`;
        ctx.fillStyle = CH_COLORS.textPrimary;

        const winnerText = `Player ${winner} Wins!`;
        ctx.fillText(winnerText, centerX, centerY - titleSize * 1.2);

        // Reason text
        const reasonSize = Math.max(16, titleSize * 0.55);
        ctx.font = `${reasonSize}px serif`;
        ctx.fillStyle = CH_COLORS.textSecondary;

        let reasonText = '';
        if (reason === 'capture') {
            reasonText = 'Victory by Raja Capture';
        } else if (reason === 'stalemate') {
            reasonText = 'Victory by Stalemate';
        } else {
            reasonText = reason || '';
        }
        ctx.fillText(reasonText, centerX, centerY - titleSize * 0.3);

        // "New Game" button
        const btnSize = Math.max(20, titleSize * 0.5);
        ctx.font = `bold ${btnSize}px serif`;

        const btnY = centerY + titleSize * 0.8;
        const btnText = 'New Game';
        const btnMetrics = ctx.measureText(btnText);
        const btnPadX = btnSize * 0.8;
        const btnPadY = btnSize * 0.5;

        // Button background
        ctx.fillStyle = CH_COLORS.border;
        ctx.fillRect(
            centerX - btnMetrics.width / 2 - btnPadX,
            btnY - btnPadY,
            btnMetrics.width + btnPadX * 2,
            btnSize + btnPadY * 2
        );

        // Button border
        ctx.strokeStyle = CH_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            centerX - btnMetrics.width / 2 - btnPadX,
            btnY - btnPadY,
            btnMetrics.width + btnPadX * 2,
            btnSize + btnPadY * 2
        );

        // Button text
        ctx.fillStyle = CH_COLORS.textPrimary;
        ctx.fillText(btnText, centerX, btnY + btnSize * 0.35);

        ctx.restore();
    }

    /**
     * clear — clear the entire canvas and fill with background color.
     */
    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = CH_COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return {
        init,
        resize,
        getBoardMetrics,
        squareFromPixel,
        renderBoard,
        renderBorder,
        renderPieces,
        renderHighlights,
        renderTurnIndicator,
        renderMenuScreen,
        renderGameOver,
        clear
    };
})();
