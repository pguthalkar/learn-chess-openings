// ===== OBSTACLE MANAGEMENT =====
const Obstacles = (() => {
    let obstacles = [];

    function reset() {
        obstacles = [];
    }

    function spawn(canvas) {
        const maxGapY = canvas.height - GROUND_HEIGHT - MIN_GAP_MARGIN - GAP_SIZE / 2;
        const minGapY = MIN_GAP_MARGIN + GAP_SIZE / 2;
        const gapCenterY = Math.random() * (maxGapY - minGapY) + minGapY;

        obstacles.push({
            x: canvas.width,
            gapCenterY: gapCenterY,
            topHeight: gapCenterY - GAP_SIZE / 2,
            bottomY: gapCenterY + GAP_SIZE / 2,
            width: OBSTACLE_WIDTH,
            scored: false
        });
    }

    function shouldSpawn(canvas) {
        if (obstacles.length === 0) return true;
        const last = obstacles[obstacles.length - 1];
        return (canvas.width - last.x) >= OBSTACLE_SPACING;
    }

    function update(scrollSpeed, canvas) {
        // Move obstacles left
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= scrollSpeed;

            // Remove off-screen obstacles
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
            }
        }

        // Spawn new obstacle if needed
        if (shouldSpawn(canvas)) {
            spawn(canvas);
        }
    }

    function checkCollision(truckHitbox, canvas) {
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];

            // Top barrier collision
            if (
                truckHitbox.x < obs.x + obs.width &&
                truckHitbox.x + truckHitbox.width > obs.x &&
                truckHitbox.y < obs.topHeight &&
                truckHitbox.y + truckHitbox.height > 0
            ) {
                return true;
            }

            // Bottom barrier collision
            if (
                truckHitbox.x < obs.x + obs.width &&
                truckHitbox.x + truckHitbox.width > obs.x &&
                truckHitbox.y + truckHitbox.height > obs.bottomY &&
                truckHitbox.y < obs.bottomY + (canvas.height - obs.bottomY)
            ) {
                return true;
            }
        }
        return false;
    }

    function checkScoring(truckX) {
        let points = 0;
        for (let i = 0; i < obstacles.length; i++) {
            if (!obstacles[i].scored && truckX > obstacles[i].x + obstacles[i].width) {
                obstacles[i].scored = true;
                points++;
            }
        }
        return points;
    }

    function render(ctx, canvas) {
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            renderBarrier(ctx, obs.x, 0, obs.width, obs.topHeight, canvas);
            renderBarrier(ctx, obs.x, obs.bottomY, obs.width, canvas.height - obs.bottomY - GROUND_HEIGHT, canvas);
        }
    }

    function renderBarrier(ctx, x, y, width, height, canvas) {
        if (height <= 0) return;

        const stripeHeight = 12;
        const numStripes = Math.ceil(height / stripeHeight);

        // Draw support posts (sides)
        const postWidth = 6;
        ctx.fillStyle = COLORS.barrierPost;
        ctx.fillRect(x + 2, y, postWidth, height);
        ctx.fillRect(x + width - postWidth - 2, y, postWidth, height);

        // Draw orange/white stripes
        for (let s = 0; s < numStripes; s++) {
            const stripeY = y + s * stripeHeight;
            const stripeH = Math.min(stripeHeight, y + height - stripeY);
            ctx.fillStyle = s % 2 === 0 ? COLORS.barrierOrange : COLORS.barrierWhite;
            ctx.fillRect(x + postWidth + 2, stripeY, width - (postWidth + 2) * 2, stripeH);
        }

        // Top cap
        ctx.fillStyle = COLORS.barrierCap;
        ctx.fillRect(x - 3, y > 0 ? y : y + height - 6, width + 6, 6);

        // Reflective dots
        ctx.fillStyle = '#FFEB3B';
        const dotSpacing = 20;
        const dotStartY = y + 10;
        for (let d = dotStartY; d < y + height - 10; d += dotSpacing) {
            ctx.beginPath();
            ctx.arc(x + width / 2, d, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function getObstacles() {
        return obstacles;
    }

    return { reset, update, checkCollision, checkScoring, render, getObstacles };
})();
