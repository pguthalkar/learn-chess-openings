// ===== TRUCK ENTITY =====
const Truck = (() => {
    let x = -100, y = -100, velocity = 0, angle = 0;
    let visible = false;

    function reset(canvas) {
        x = canvas.width * 0.2;
        y = canvas.height / 2;
        velocity = 0;
        angle = 0;
        visible = true;
    }

    function hide() {
        visible = false;
    }

    function update(canvasHeight) {
        // Apply gravity
        velocity += GRAVITY;

        // Cap terminal velocity
        if (velocity > TERMINAL_VELOCITY) {
            velocity = TERMINAL_VELOCITY;
        }

        // Apply velocity to position
        y += velocity;

        // Calculate tilt angle based on velocity
        angle = Math.max(-30, Math.min(90, velocity * 3));

        // Ceiling boundary
        if (y < 0) {
            y = 0;
            velocity = 0;
        }
    }

    function lift() {
        velocity = LIFT;
    }

    function getHitbox() {
        return {
            x: x,
            y: y,
            width: TRUCK_WIDTH,
            height: TRUCK_HEIGHT
        };
    }

    function getY() { return y; }
    function getX() { return x; }
    function getAngle() { return angle; }

    function render(ctx) {
        if (!visible) return;
        ctx.save();

        // Translate to truck center and rotate
        const centerX = x + TRUCK_WIDTH / 2;
        const centerY = y + TRUCK_HEIGHT / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.translate(-TRUCK_WIDTH / 2, -TRUCK_HEIGHT / 2);

        // --- Pixel-art style truck ---

        // Exhaust pipe (behind truck)
        ctx.fillStyle = COLORS.truckExhaust;
        ctx.fillRect(-4, TRUCK_HEIGHT * 0.2, 5, 6);

        // Main body
        ctx.fillStyle = COLORS.truckBody;
        ctx.fillRect(0, TRUCK_HEIGHT * 0.2, TRUCK_WIDTH * 0.7, TRUCK_HEIGHT * 0.55);

        // Cab (front, taller section)
        ctx.fillStyle = COLORS.truckCab;
        ctx.fillRect(TRUCK_WIDTH * 0.55, TRUCK_HEIGHT * 0.05, TRUCK_WIDTH * 0.45, TRUCK_HEIGHT * 0.7);

        // Window
        ctx.fillStyle = COLORS.truckWindow;
        ctx.fillRect(TRUCK_WIDTH * 0.62, TRUCK_HEIGHT * 0.12, TRUCK_WIDTH * 0.3, TRUCK_HEIGHT * 0.3);

        // Window frame
        ctx.strokeStyle = COLORS.truckCab;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(TRUCK_WIDTH * 0.62, TRUCK_HEIGHT * 0.12, TRUCK_WIDTH * 0.3, TRUCK_HEIGHT * 0.3);

        // Bumper (front)
        ctx.fillStyle = COLORS.truckBumper;
        ctx.fillRect(TRUCK_WIDTH * 0.92, TRUCK_HEIGHT * 0.5, TRUCK_WIDTH * 0.08, TRUCK_HEIGHT * 0.25);

        // Cargo area detail lines
        ctx.strokeStyle = COLORS.truckCab;
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            const lineX = TRUCK_WIDTH * 0.7 * (i / 4);
            ctx.beginPath();
            ctx.moveTo(lineX, TRUCK_HEIGHT * 0.2);
            ctx.lineTo(lineX, TRUCK_HEIGHT * 0.75);
            ctx.stroke();
        }

        // Headlight
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(TRUCK_WIDTH * 0.94, TRUCK_HEIGHT * 0.35, 4, 6);

        // Rear light
        ctx.fillStyle = '#FF1744';
        ctx.fillRect(-2, TRUCK_HEIGHT * 0.4, 3, 5);

        // Wheels
        const wheelRadius = TRUCK_HEIGHT * 0.18;

        // Rear wheel
        ctx.beginPath();
        ctx.arc(TRUCK_WIDTH * 0.2, TRUCK_HEIGHT * 0.85, wheelRadius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.truckWheel;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(TRUCK_WIDTH * 0.2, TRUCK_HEIGHT * 0.85, wheelRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.truckWheelHub;
        ctx.fill();

        // Front wheel
        ctx.beginPath();
        ctx.arc(TRUCK_WIDTH * 0.75, TRUCK_HEIGHT * 0.85, wheelRadius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.truckWheel;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(TRUCK_WIDTH * 0.75, TRUCK_HEIGHT * 0.85, wheelRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.truckWheelHub;
        ctx.fill();

        // Undercarriage
        ctx.fillStyle = COLORS.truckExhaust;
        ctx.fillRect(TRUCK_WIDTH * 0.1, TRUCK_HEIGHT * 0.72, TRUCK_WIDTH * 0.7, 3);

        ctx.restore();
    }

    return { reset, hide, update, lift, getHitbox, getX, getY, getAngle, render };
})();
