/**
 * Modern Chess — Board and UI Rendering Module
 * Draws the board, pieces, highlights, check indicator, turn indicator,
 * promotion picker, menu, and game-over overlays on the HTML5 Canvas.
 */
const ChessRenderer = (() => {
    'use strict';

    let canvas, ctx;
    let boardSize, squareSize, offsetX, offsetY;
    let promotionRects = [];

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        resize();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            resize();
        });
    }

    function resize() {
        squareSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.85 / CHESS_BOARD_SIZE);
        boardSize = squareSize * CHESS_BOARD_SIZE;
        offsetX = Math.floor((canvas.width - boardSize) / 2);
        offsetY = Math.floor((canvas.height - boardSize) / 2);
    }

    function getBoardMetrics() {
        return { boardSize, squareSize, offsetX, offsetY };
    }

    /**
     * squareFromPixel — convert pixel coordinates to board {row, col} or null.
     * Board row 0 is at the BOTTOM visually (Player 1 / White's side).
     */
    function squareFromPixel(px, py) {
        const localX = px - offsetX;
        const localY = py - offsetY;

        if (localX < 0 || localX >= boardSize || localY < 0 || localY >= boardSize) {
            return null;
        }

        const col = Math.floor(localX / squareSize);
        const visualRow = Math.floor(localY / squareSize);
        const row = 7 - visualRow;

        if (row < 0 || row >= CHESS_BOARD_SIZE || col < 0 || col >= CHESS_BOARD_SIZE) {
            return null;
        }

        return { row, col };
    }

    /**
     * promotionChoiceFromPixel — hit-test the promotion picker panel.
     * @returns {number|null} Index into CHESS_PROMOTION_CHOICES, or null
     */
    function promotionChoiceFromPixel(px, py) {
        for (let i = 0; i < promotionRects.length; i++) {
            const r = promotionRects[i];
            if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) {
                return i;
            }
        }
        return null;
    }

    function renderBoard() {
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
                const isLight = (row + col) % 2 === 0;
                ctx.fillStyle = isLight ? CHESS_COLORS.boardLight : CHESS_COLORS.boardDark;

                const x = offsetX + col * squareSize;
                const y = offsetY + (7 - row) * squareSize;
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }
    }

    function renderBorder() {
        const borderWidth = Math.max(8, squareSize * 0.12);
        const halfBorder = borderWidth / 2;

        ctx.strokeStyle = CHESS_COLORS.border;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(
            offsetX - halfBorder,
            offsetY - halfBorder,
            boardSize + borderWidth,
            boardSize + borderWidth
        );

        const accentWidth = Math.max(2, borderWidth * 0.25);
        ctx.strokeStyle = CHESS_COLORS.borderAccent;
        ctx.lineWidth = accentWidth;
        ctx.strokeRect(
            offsetX - accentWidth,
            offsetY - accentWidth,
            boardSize + accentWidth * 2,
            boardSize + accentWidth * 2
        );
    }

    /**
     * renderCoordinates — file letters (a-h) and rank numbers (1-8) along the edges.
     */
    function renderCoordinates() {
        const fontSize = Math.max(10, squareSize * 0.18);
        ctx.save();
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textSecondary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
            const letter = String.fromCharCode(97 + col);
            const x = offsetX + col * squareSize + squareSize / 2;
            ctx.fillText(letter, x, offsetY + boardSize + fontSize * 0.9);
        }
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            const label = String(row + 1);
            const y = offsetY + (7 - row) * squareSize + squareSize / 2;
            ctx.fillText(label, offsetX - fontSize * 0.9, y);
        }
        ctx.restore();
    }

    function renderPieces(board) {
        for (let row = 0; row < CHESS_BOARD_SIZE; row++) {
            for (let col = 0; col < CHESS_BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece) {
                    const x = offsetX + col * squareSize;
                    const y = offsetY + (7 - row) * squareSize;
                    ChessPieces.drawPiece(ctx, piece, x, y, squareSize);
                }
            }
        }
    }

    function renderHighlights(selected, legalMoves) {
        if (selected) {
            const x = offsetX + selected.col * squareSize;
            const y = offsetY + (7 - selected.row) * squareSize;

            ctx.save();
            ctx.fillStyle = CHESS_COLORS.selected;
            ctx.fillRect(x, y, squareSize, squareSize);

            ctx.shadowColor = CHESS_COLORS.selected;
            ctx.shadowBlur = squareSize * 0.3;
            ctx.strokeStyle = CHESS_COLORS.borderAccent;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, squareSize - 4, squareSize - 4);
            ctx.restore();
        }

        if (legalMoves && legalMoves.length > 0) {
            ctx.save();
            for (let i = 0; i < legalMoves.length; i++) {
                const move = legalMoves[i];
                const x = offsetX + move.col * squareSize + squareSize / 2;
                const y = offsetY + (7 - move.row) * squareSize + squareSize / 2;
                const radius = squareSize * 0.16;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = CHESS_COLORS.legalMove;
                ctx.fill();
            }
            ctx.restore();
        }
    }

    /**
     * renderCheckIndicator — glow the king's square if it is in check.
     */
    function renderCheckIndicator(kingSquare) {
        if (!kingSquare) {
            return;
        }
        const x = offsetX + kingSquare.col * squareSize;
        const y = offsetY + (7 - kingSquare.row) * squareSize;

        ctx.save();
        const gradient = ctx.createRadialGradient(
            x + squareSize / 2, y + squareSize / 2, squareSize * 0.1,
            x + squareSize / 2, y + squareSize / 2, squareSize * 0.7
        );
        gradient.addColorStop(0, CHESS_COLORS.check);
        gradient.addColorStop(1, 'rgba(211, 47, 47, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - squareSize * 0.3, y - squareSize * 0.3, squareSize * 1.6, squareSize * 1.6);
        ctx.restore();
    }

    function renderTurnIndicator(activePlayer, inCheck) {
        let text = activePlayer === CHESS_PLAYER.ONE ? 'White to Move' : 'Black to Move';
        if (inCheck) {
            text += ' — Check!';
        }

        const fontSize = Math.max(16, squareSize * 0.32);

        ctx.save();
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = inCheck ? CHESS_COLORS.check : CHESS_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textY = offsetY + boardSize + squareSize * 0.55;
        ctx.fillText(text, canvas.width / 2, textY);
        ctx.restore();
    }

    function renderMenuScreen() {
        ctx.fillStyle = CHESS_COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleSize = Math.max(36, Math.min(canvas.width, canvas.height) * 0.08);
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.fillText('CHESS', centerX, centerY - titleSize * 1.2);

        const lineWidth = titleSize * 3;
        ctx.strokeStyle = CHESS_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth / 2, centerY - titleSize * 0.5);
        ctx.lineTo(centerX + lineWidth / 2, centerY - titleSize * 0.5);
        ctx.stroke();

        const subtitleSize = Math.max(18, titleSize * 0.4);
        ctx.font = `${subtitleSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textSecondary;
        ctx.fillText('Standard Rules', centerX, centerY);

        _drawButton(centerX, centerY + titleSize * 1.2, 'Click to Start', titleSize * 0.45);

        ctx.restore();
    }

    function renderGameOver(winner, reason) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleSize = Math.max(28, Math.min(canvas.width, canvas.height) * 0.06);
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;

        let titleText;
        if (winner) {
            titleText = (winner === CHESS_PLAYER.ONE ? 'White' : 'Black') + ' Wins!';
        } else {
            titleText = 'Draw';
        }
        ctx.fillText(titleText, centerX, centerY - titleSize * 1.2);

        const reasonSize = Math.max(16, titleSize * 0.55);
        ctx.font = `${reasonSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textSecondary;

        let reasonText = '';
        if (reason === 'checkmate') {
            reasonText = 'Checkmate';
        } else if (reason === 'stalemate') {
            reasonText = 'Stalemate';
        } else {
            reasonText = reason || '';
        }
        ctx.fillText(reasonText, centerX, centerY - titleSize * 0.3);

        _drawButton(centerX, centerY + titleSize * 0.8, 'New Game', titleSize * 0.5);

        ctx.restore();
    }

    /**
     * renderPromotionPicker — overlay panel offering the four promotion choices
     * for the given player. Populates promotionRects for hit-testing.
     */
    function renderPromotionPicker(player) {
        promotionRects = [];

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cellSize = Math.max(48, squareSize);
        const panelWidth = cellSize * CHESS_PROMOTION_CHOICES.length;
        const panelHeight = cellSize;
        const startX = canvas.width / 2 - panelWidth / 2;
        const startY = canvas.height / 2 - panelHeight / 2;

        const labelSize = Math.max(14, cellSize * 0.25);
        ctx.font = `bold ${labelSize}px sans-serif`;
        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Promote pawn to:', canvas.width / 2, startY - labelSize * 1.5);

        for (let i = 0; i < CHESS_PROMOTION_CHOICES.length; i++) {
            const x = startX + i * cellSize;
            const y = startY;
            const isLight = i % 2 === 0;

            ctx.fillStyle = isLight ? CHESS_COLORS.boardLight : CHESS_COLORS.boardDark;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = CHESS_COLORS.borderAccent;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cellSize, cellSize);

            ChessPieces.drawPiece(ctx, { type: CHESS_PROMOTION_CHOICES[i], player: player }, x, y, cellSize);

            promotionRects.push({ x, y, w: cellSize, h: cellSize });
        }

        ctx.restore();
    }

    function _drawButton(centerX, y, text, fontSize) {
        ctx.font = `bold ${fontSize}px sans-serif`;
        const metrics = ctx.measureText(text);
        const padX = fontSize * 0.8;
        const padY = fontSize * 0.5;

        ctx.fillStyle = CHESS_COLORS.border;
        ctx.fillRect(centerX - metrics.width / 2 - padX, y - padY, metrics.width + padX * 2, fontSize + padY * 2);

        ctx.strokeStyle = CHESS_COLORS.borderAccent;
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - metrics.width / 2 - padX, y - padY, metrics.width + padX * 2, fontSize + padY * 2);

        ctx.fillStyle = CHESS_COLORS.textPrimary;
        ctx.fillText(text, centerX, y + fontSize * 0.35);
    }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = CHESS_COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return {
        init,
        resize,
        getBoardMetrics,
        squareFromPixel,
        promotionChoiceFromPixel,
        renderBoard,
        renderBorder,
        renderCoordinates,
        renderPieces,
        renderHighlights,
        renderCheckIndicator,
        renderTurnIndicator,
        renderMenuScreen,
        renderGameOver,
        renderPromotionPicker,
        clear
    };
})();
