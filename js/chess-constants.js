/**
 * Modern Chess — Shared Constants and Configuration
 * Defines board dimensions, piece types, player identifiers,
 * game states, color palette, and initial piece positions.
 */

// Board dimensions
const CHESS_BOARD_SIZE = 8;

// Piece type enumeration
const CHESS_PIECE_TYPE = {
    KING: 'king',
    QUEEN: 'queen',
    ROOK: 'rook',
    BISHOP: 'bishop',
    KNIGHT: 'knight',
    PAWN: 'pawn'
};

// Player enumeration (ONE = White, TWO = Black)
const CHESS_PLAYER = {
    ONE: 1,
    TWO: 2
};

// Game state enumeration
const CHESS_GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PROMOTING: 'promoting',
    GAME_OVER: 'game_over'
};

// Modern flat color palette
const CHESS_COLORS = {
    boardLight: '#EEEED2',
    boardDark: '#769656',
    border: '#212121',
    borderAccent: '#26A69A',
    playerOne: '#FAFAFA',
    playerTwo: '#212121',
    pieceOutlineOne: '#212121',
    pieceOutlineTwo: '#EEEEEE',
    highlight: 'rgba(255, 215, 0, 0.5)',
    legalMove: 'rgba(38, 166, 154, 0.65)',
    selected: 'rgba(255, 193, 7, 0.7)',
    check: 'rgba(211, 47, 47, 0.65)',
    background: '#1B1B1B',
    textPrimary: '#ECEFF1',
    textSecondary: '#90A4AE'
};

// Promotion choices, in display order
const CHESS_PROMOTION_CHOICES = [
    CHESS_PIECE_TYPE.QUEEN,
    CHESS_PIECE_TYPE.ROOK,
    CHESS_PIECE_TYPE.BISHOP,
    CHESS_PIECE_TYPE.KNIGHT
];

// Initial board positions — 8×8 array
// Row 0 = rank 1 (Player 1 / White back rank)
// Row 7 = rank 8 (Player 2 / Black back rank)
const CHESS_INITIAL_POSITIONS = [
    // Row 0: White back rank
    [
        { type: CHESS_PIECE_TYPE.ROOK, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.KNIGHT, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.BISHOP, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.QUEEN, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.KING, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.BISHOP, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.KNIGHT, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.ROOK, player: CHESS_PLAYER.ONE, moved: false }
    ],
    // Row 1: White pawns
    [
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.ONE, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.ONE, moved: false }
    ],
    // Row 2: empty
    [null, null, null, null, null, null, null, null],
    // Row 3: empty
    [null, null, null, null, null, null, null, null],
    // Row 4: empty
    [null, null, null, null, null, null, null, null],
    // Row 5: empty
    [null, null, null, null, null, null, null, null],
    // Row 6: Black pawns
    [
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.PAWN, player: CHESS_PLAYER.TWO, moved: false }
    ],
    // Row 7: Black back rank
    [
        { type: CHESS_PIECE_TYPE.ROOK, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.KNIGHT, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.BISHOP, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.QUEEN, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.KING, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.BISHOP, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.KNIGHT, player: CHESS_PLAYER.TWO, moved: false },
        { type: CHESS_PIECE_TYPE.ROOK, player: CHESS_PLAYER.TWO, moved: false }
    ]
];
