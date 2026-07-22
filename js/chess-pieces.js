/**
 * Modern Chess — Piece Rendering Module
 * Draws each piece using standard Unicode chess glyphs on the Canvas.
 */
const ChessPieces = (() => {
    'use strict';

    const GLYPHS = {
        one: {
            king: '♔',
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘',
            pawn: '♙'
        },
        two: {
            king: '♚',
            queen: '♛',
            rook: '♜',
            bishop: '♝',
            knight: '♞',
            pawn: '♟'
        }
    };

    /**
     * drawPiece — draw the glyph for a piece centered within a square.
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} piece - {type, player}
     * @param {number} x - Square's top-left x
     * @param {number} y - Square's top-left y
     * @param {number} size - Square size
     */
    function drawPiece(ctx, piece, x, y, size) {
        if (!piece || !piece.type || !piece.player) {
            return;
        }

        const set = piece.player === CHESS_PLAYER.ONE ? GLYPHS.one : GLYPHS.two;
        const glyph = set[piece.type];
        if (!glyph) {
            return;
        }

        const fill = piece.player === CHESS_PLAYER.ONE ? CHESS_COLORS.playerOne : CHESS_COLORS.playerTwo;
        const outline = piece.player === CHESS_PLAYER.ONE ? CHESS_COLORS.pieceOutlineOne : CHESS_COLORS.pieceOutlineTwo;

        const cx = x + size / 2;
        const cy = y + size / 2;

        ctx.save();
        ctx.font = `${size * 0.78}px "Segoe UI Symbol", "Noto Sans Symbols", "DejaVu Sans", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.lineWidth = Math.max(1, size * 0.035);
        ctx.strokeStyle = outline;
        ctx.strokeText(glyph, cx, cy);

        ctx.fillStyle = fill;
        ctx.fillText(glyph, cx, cy);
        ctx.restore();
    }

    return { drawPiece };
})();
