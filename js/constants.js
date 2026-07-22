// ===== PHYSICS =====
const GRAVITY = 0.25;
const LIFT = -6;
const TERMINAL_VELOCITY = 7;

// ===== OBSTACLES =====
const GAP_SIZE = 250;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_SPACING = 420;
const MIN_GAP_MARGIN = 120;

// ===== DIFFICULTY =====
const INITIAL_SCROLL_SPEED = 1.5;
const MAX_SCROLL_SPEED = 2.8;
const DIFFICULTY_INTERVAL = 25;
const MAX_DIFFICULTY_LEVEL = 3;

// ===== TRUCK =====
const TRUCK_WIDTH = 60;
const TRUCK_HEIGHT = 40;

// ===== GROUND =====
const GROUND_HEIGHT = 60;

// ===== COLORS =====
const COLORS = {
    sky: '#87CEEB',
    ground: '#4A4A4A',
    groundLine: '#FFFFFF',
    groundEdge: '#6B6B6B',
    truckBody: '#E53935',
    truckCab: '#C62828',
    truckWindow: '#90CAF9',
    truckBumper: '#9E9E9E',
    truckWheel: '#212121',
    truckWheelHub: '#757575',
    truckExhaust: '#616161',
    barrierOrange: '#FF6D00',
    barrierWhite: '#FFFFFF',
    barrierPost: '#795548',
    barrierCap: '#424242',
    scoreText: '#FFFFFF',
    scoreOutline: '#000000',
    titleText: '#FFFFFF',
    subtitleText: '#E0E0E0',
    gameOverText: '#FF1744',
    hudBackground: 'rgba(0, 0, 0, 0.3)'
};

// ===== GAME STATES =====
const STATE = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

// ===== LOCAL STORAGE =====
const HIGH_SCORE_KEY = 'flappyKiro_highScore';
