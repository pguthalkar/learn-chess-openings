/**
 * Chaturanga — Piece Rendering Module
 * Draws each piece type using Canvas API paths, arcs, and bezier curves.
 * Sanskrit-inspired geometric designs — no external images or fonts.
 */
const ChPieces = (() => {
    'use strict';

    /**
     * Returns fill and stroke colors based on player.
     */
    function _getColors(player) {
        const fill = player === CH_PLAYER.ONE ? CH_COLORS.playerOne : CH_COLORS.playerTwo;
        const stroke = CH_COLORS.borderAccent;
        return { fill, stroke };
    }

    /**
     * Raja — Crown/Lotus symbol with radiating lines.
     * A regal lotus crown with radiating sun-like spikes and a central jewel.
     */
    function _drawRaja(ctx, player, x, y, size) {
        const { fill, stroke } = _getColors(player);
        const cx = x + size / 2;
        const cy = y + size / 2;
        const r = size * 0.35;

        ctx.save();

        // Base circle (body of the king)
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.15, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.03;
        ctx.stroke();

        // Crown — five pointed lotus petals radiating upward
        const petalCount = 5;
        const petalHeight = r * 0.7;
        const petalWidth = r * 0.25;
        const crownBase = cy - r * 0.15;

        ctx.beginPath();
        for (let i = 0; i < petalCount; i++) {
            const angle = -Math.PI / 2 + (i - (petalCount - 1) / 2) * (Math.PI / (petalCount + 1));
            const tipX = cx + Math.cos(angle) * petalHeight;
            const tipY = crownBase + Math.sin(angle) * petalHeight;

            const baseLeftX = cx + Math.cos(angle + 0.3) * petalWidth;
            const baseLeftY = crownBase + Math.sin(angle + 0.3) * petalWidth;
            const baseRightX = cx + Math.cos(angle - 0.3) * petalWidth;
            const baseRightY = crownBase + Math.sin(angle - 0.3) * petalWidth;

            ctx.moveTo(baseLeftX, baseLeftY);
            ctx.quadraticCurveTo(tipX, tipY, baseRightX, baseRightY);
        }
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.025;
        ctx.stroke();

        // Radiating lines from crown tips (sun rays)
        ctx.beginPath();
        for (let i = 0; i < petalCount; i++) {
            const angle = -Math.PI / 2 + (i - (petalCount - 1) / 2) * (Math.PI / (petalCount + 1));
            const innerR = petalHeight * 0.85;
            const outerR = petalHeight * 1.05;
            const sx = cx + Math.cos(angle) * innerR;
            const sy = crownBase + Math.sin(angle) * innerR;
            const ex = cx + Math.cos(angle) * outerR;
            const ey = crownBase + Math.sin(angle) * outerR;
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
        }
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.02;
        ctx.stroke();

        // Central jewel dot
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.15, r * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();

        // Small decorative circle inside jewel
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.15, r * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.restore();
    }

    /**
     * Mantri — Diamond/rhombus shape with inner dot and decorative border.
     * Looks like a minister's gem/seal.
     */
    function _drawMantri(ctx, player, x, y, size) {
        const { fill, stroke } = _getColors(player);
        const cx = x + size / 2;
        const cy = y + size / 2;
        const r = size * 0.32;

        ctx.save();

        // Outer diamond
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.035;
        ctx.stroke();

        // Inner diamond (smaller, concentric)
        const ir = r * 0.55;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ir);
        ctx.lineTo(cx + ir, cy);
        ctx.lineTo(cx, cy + ir);
        ctx.lineTo(cx - ir, cy);
        ctx.closePath();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.02;
        ctx.stroke();

        // Central dot
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();

        // Four small dots at inner diamond midpoints
        const dotR = r * 0.06;
        const dotDist = r * 0.35;
        ctx.fillStyle = stroke;
        ctx.beginPath();
        ctx.arc(cx, cy - dotDist, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + dotDist, cy, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy + dotDist, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - dotDist, cy, dotR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Gaja — Elephant silhouette using arcs and curves.
     * Recognizable elephant head with trunk and large ears.
     */
    function _drawGaja(ctx, player, x, y, size) {
        const { fill, stroke } = _getColors(player);
        const cx = x + size / 2;
        const cy = y + size / 2;
        const s = size * 0.38;

        ctx.save();

        // Elephant body (large oval)
        ctx.beginPath();
        ctx.ellipse(cx, cy + s * 0.1, s * 0.6, s * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.03;
        ctx.stroke();

        // Left ear
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.55, cy - s * 0.1, s * 0.3, s * 0.45, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.025;
        ctx.stroke();

        // Right ear
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.55, cy - s * 0.1, s * 0.3, s * 0.45, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.025;
        ctx.stroke();

        // Head circle (on top of body)
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.25, s * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.03;
        ctx.stroke();

        // Trunk (curved line going downward)
        ctx.beginPath();
        ctx.moveTo(cx, cy + s * 0.05);
        ctx.quadraticCurveTo(cx + s * 0.15, cy + s * 0.5, cx - s * 0.1, cy + s * 0.8);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.04;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Eyes
        ctx.beginPath();
        ctx.arc(cx - s * 0.15, cy - s * 0.3, s * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + s * 0.15, cy - s * 0.3, s * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();

        // Forehead decoration (small circle)
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.45, s * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();

        ctx.restore();
    }

    /**
     * Ashva — Horse head profile using bezier curves.
     * Stylized horse/knight facing left with flowing mane.
     */
    function _drawAshva(ctx, player, x, y, size) {
        const { fill, stroke } = _getColors(player);
        const cx = x + size / 2;
        const cy = y + size / 2;
        const s = size * 0.36;

        ctx.save();

        // Horse head profile shape
        ctx.beginPath();
        // Start at the chin
        ctx.moveTo(cx - s * 0.3, cy + s * 0.6);
        // Jaw line to muzzle
        ctx.quadraticCurveTo(cx - s * 0.7, cy + s * 0.2, cx - s * 0.5, cy - s * 0.1);
        // Nose bridge up to forehead
        ctx.bezierCurveTo(cx - s * 0.6, cy - s * 0.5, cx - s * 0.3, cy - s * 0.8, cx, cy - s * 0.85);
        // Forehead curve to ear tip
        ctx.bezierCurveTo(cx + s * 0.2, cy - s * 0.9, cx + s * 0.4, cy - s * 0.7, cx + s * 0.3, cy - s * 0.5);
        // Ear back to neck
        ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.3, cx + s * 0.6, cy * 0, cx + s * 0.5, cy * 0);
        // Back of neck down
        ctx.bezierCurveTo(cx + s * 0.55, cy + s * 0.3, cx + s * 0.4, cy + s * 0.6, cx + s * 0.2, cy + s * 0.7);
        // Close back to chin
        ctx.quadraticCurveTo(cx, cy + s * 0.75, cx - s * 0.3, cy + s * 0.6);
        ctx.closePath();

        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.03;
        ctx.stroke();

        // Mane (flowing lines along neck)
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.1, cy - s * 0.7);
        ctx.quadraticCurveTo(cx + s * 0.35, cy - s * 0.4, cx + s * 0.3, cy - s * 0.1);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.025;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + s * 0.0, cy - s * 0.6);
        ctx.quadraticCurveTo(cx + s * 0.25, cy - s * 0.3, cx + s * 0.2, cy + s * 0.0);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.02;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(cx - s * 0.15, cy - s * 0.3, s * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();

        // Nostril
        ctx.beginPath();
        ctx.arc(cx - s * 0.45, cy + s * 0.0, s * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();

        ctx.restore();
    }

    /**
     * Ratha — Chariot wheel (spoked circle) with base.
     * A large spoked wheel with a decorative hub and chariot base.
     */
    function _drawRatha(ctx, player, x, y, size) {
        const { fill, stroke } = _getColors(player);
        const cx = x + size / 2;
        const cy = y + size / 2;
        const r = size * 0.3;

        ctx.save();

        // Chariot base (rectangular platform below wheel)
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.9, cy + r * 0.7);
        ctx.lineTo(cx + r * 0.9, cy + r * 0.7);
        ctx.lineTo(cx + r * 1.0, cy + r * 1.1);
        ctx.lineTo(cx - r * 1.0, cy + r * 1.1);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.025;
        ctx.stroke();

        // Outer wheel rim
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.1, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.035;
        ctx.stroke();

        // Inner wheel rim
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.1, r * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.02;
        ctx.stroke();

        // Spokes (8 spokes radiating from center)
        const spokeCount = 8;
        const hubR = r * 0.2;
        const rimR = r * 0.78;
        ctx.beginPath();
        for (let i = 0; i < spokeCount; i++) {
            const angle = (i / spokeCount) * Math.PI * 2;
            const sx = cx + Math.cos(angle) * hubR;
            const sy = (cy - r * 0.1) + Math.sin(angle) * hubR;
            const ex = cx + Math.cos(angle) * rimR;
            const ey = (cy - r * 0.1) + Math.sin(angle) * rimR;
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
        }
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.025;
        ctx.stroke();

        // Central hub
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.1, hubR, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();

        // Hub inner dot
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.1, hubR * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.restore();
    }

    /**
     * Padati — Shield and spear design.
     * A triangular shield/spear pointing upward with a base, evoking infantry.
     */
    function _drawPadati(ctx, player, x, y, size) {
        const { fill, stroke } = _getColors(player);
        const cx = x + size / 2;
        const cy = y + size / 2;
        const s = size * 0.32;

        ctx.save();

        // Shield (rounded triangle shape)
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 0.9);
        ctx.bezierCurveTo(
            cx + s * 0.15, cy - s * 0.6,
            cx + s * 0.7, cy - s * 0.2,
            cx + s * 0.6, cy + s * 0.4
        );
        ctx.quadraticCurveTo(cx + s * 0.4, cy + s * 0.8, cx, cy + s * 0.9);
        ctx.quadraticCurveTo(cx - s * 0.4, cy + s * 0.8, cx - s * 0.6, cy + s * 0.4);
        ctx.bezierCurveTo(
            cx - s * 0.7, cy - s * 0.2,
            cx - s * 0.15, cy - s * 0.6,
            cx, cy - s * 0.9
        );
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.03;
        ctx.stroke();

        // Shield inner border
        const is = s * 0.65;
        ctx.beginPath();
        ctx.moveTo(cx, cy - is * 0.75);
        ctx.bezierCurveTo(
            cx + is * 0.12, cy - is * 0.45,
            cx + is * 0.55, cy - is * 0.1,
            cx + is * 0.45, cy + is * 0.35
        );
        ctx.quadraticCurveTo(cx + is * 0.3, cy + is * 0.65, cx, cy + is * 0.7);
        ctx.quadraticCurveTo(cx - is * 0.3, cy + is * 0.65, cx - is * 0.45, cy + is * 0.35);
        ctx.bezierCurveTo(
            cx - is * 0.55, cy - is * 0.1,
            cx - is * 0.12, cy - is * 0.45,
            cx, cy - is * 0.75
        );
        ctx.closePath();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.02;
        ctx.stroke();

        // Spear tip at top
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 1.1);
        ctx.lineTo(cx - s * 0.1, cy - s * 0.85);
        ctx.lineTo(cx + s * 0.1, cy - s * 0.85);
        ctx.closePath();
        ctx.fillStyle = stroke;
        ctx.fill();

        // Center emblem dot
        ctx.beginPath();
        ctx.arc(cx, cy + s * 0.05, s * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();

        ctx.restore();
    }

    /**
     * Public API: drawPiece dispatcher.
     * Draws the appropriate piece at canvas coordinates (x, y) within a square of given size.
     */
    function drawPiece(ctx, piece, x, y, size) {
        if (!piece || !piece.type || !piece.player) {
            return;
        }

        switch (piece.type) {
            case CH_PIECE_TYPE.RAJA:
                _drawRaja(ctx, piece.player, x, y, size);
                break;
            case CH_PIECE_TYPE.MANTRI:
                _drawMantri(ctx, piece.player, x, y, size);
                break;
            case CH_PIECE_TYPE.GAJA:
                _drawGaja(ctx, piece.player, x, y, size);
                break;
            case CH_PIECE_TYPE.ASHVA:
                _drawAshva(ctx, piece.player, x, y, size);
                break;
            case CH_PIECE_TYPE.RATHA:
                _drawRatha(ctx, piece.player, x, y, size);
                break;
            case CH_PIECE_TYPE.PADATI:
                _drawPadati(ctx, piece.player, x, y, size);
                break;
            default:
                break;
        }
    }

    return { drawPiece };
})();
