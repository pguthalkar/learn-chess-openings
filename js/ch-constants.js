/**
 * Chaturanga — Shared Constants and Configuration
 * Defines board dimensions, piece types, player identifiers,
 * game states, color palette, and initial piece positions.
 */

// Board dimensions
const CH_BOARD_SIZE = 8;

// Piece type enumeration
const CH_PIECE_TYPE = {
    RAJA: 'raja',
    MANTRI: 'mantri',
    GAJA: 'gaja',
    ASHVA: 'ashva',
    RATHA: 'ratha',
    PADATI: 'padati'
};

// Player enumeration
const CH_PLAYER = {
    ONE: 1,
    TWO: 2
};

// Game state enumeration
const CH_GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

// Earthy/sandstone color palette
const CH_COLORS = {
    boardLight: '#F5DEB3',
    boardDark: '#8B6914',
    border: '#5C3317',
    borderAccent: '#DAA520',
    playerOne: '#C62828',
    playerTwo: '#1B5E20',
    highlight: 'rgba(255, 215, 0, 0.5)',
    legalMove: 'rgba(76, 175, 80, 0.6)',
    selected: 'rgba(255, 193, 7, 0.7)',
    background: '#3E2723',
    textPrimary: '#FFD54F',
    textSecondary: '#BCAAA4'
};

// Initial board positions — 8×8 array
// Row 0 = rank 1 (Player 1 back rank)
// Row 7 = rank 8 (Player 2 back rank)
const CH_INITIAL_POSITIONS = [
    // Row 0: Player 1 back rank
    [
        { type: CH_PIECE_TYPE.RATHA, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.ASHVA, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.GAJA, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.MANTRI, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.RAJA, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.GAJA, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.ASHVA, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.RATHA, player: CH_PLAYER.ONE }
    ],
    // Row 1: Player 1 pawns
    [
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.ONE }
    ],
    // Row 2: empty
    [null, null, null, null, null, null, null, null],
    // Row 3: empty
    [null, null, null, null, null, null, null, null],
    // Row 4: empty
    [null, null, null, null, null, null, null, null],
    // Row 5: empty
    [null, null, null, null, null, null, null, null],
    // Row 6: Player 2 pawns
    [
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.PADATI, player: CH_PLAYER.TWO }
    ],
    // Row 7: Player 2 back rank
    [
        { type: CH_PIECE_TYPE.RATHA, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.ASHVA, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.GAJA, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.MANTRI, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.RAJA, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.GAJA, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.ASHVA, player: CH_PLAYER.TWO },
        { type: CH_PIECE_TYPE.RATHA, player: CH_PLAYER.TWO }
    ]
];
