# Requirements Document

## Introduction

This document specifies the requirements for Chaturanga, a digital implementation of the ancient 6th-century Indian chess game. The game provides a local two-player hot-seat experience on an 8×8 ashtāpada board with historically authentic piece types (Raja, Mantri, Gaja, Ashva, Ratha, Padati) rendered using an Indian visual theme on HTML5 Canvas. The game uses vanilla JavaScript with an IIFE module pattern consistent with the existing project structure.

## Glossary

- **Chaturanga_System**: The overall game application responsible for managing the board, pieces, turns, and game state
- **Board_Renderer**: The subsystem responsible for drawing the 8×8 ashtāpada board and visual elements on HTML5 Canvas
- **Piece_Renderer**: The subsystem responsible for drawing piece graphics programmatically using Canvas API
- **Move_Engine**: The subsystem responsible for computing legal moves for each piece type based on Chaturanga rules
- **Turn_Manager**: The subsystem responsible for alternating control between the two players
- **Input_Handler**: The subsystem responsible for detecting and processing player mouse/touch interactions
- **Raja**: The King piece — moves one square in any direction
- **Mantri**: The Minister/Counselor piece — moves one square diagonally only
- **Gaja**: The Elephant piece — moves exactly two squares diagonally, can jump over intervening pieces
- **Ashva**: The Horse piece — moves in an L-shape (two squares in one direction, one square perpendicular), can jump
- **Ratha**: The Chariot piece — moves any number of squares along a rank or file (straight lines)
- **Padati**: The Infantry/Foot soldier piece — moves one square forward, captures one square diagonally forward
- **Ashtāpada**: The 8×8 game board used in Chaturanga
- **Active_Player**: The player whose turn it is to make a move
- **Opponent_Player**: The player who is not currently taking a turn

## Requirements

### Requirement 1: Board Initialization and Display

**User Story:** As a player, I want to see an authentic-looking Chaturanga board when the game starts, so that I feel immersed in the historical theme.

#### Acceptance Criteria

1. WHEN the game page loads, THE Board_Renderer SHALL draw an 8×8 grid of alternating colored squares using an earthy/sandstone color palette on the HTML5 Canvas element.
2. WHEN the game page loads, THE Board_Renderer SHALL draw an ornate traditional Indian-style border around the board area.
3. WHEN the game page loads, THE Chaturanga_System SHALL place all 32 pieces in the standard Chaturanga starting positions with one army on ranks 1-2 and the opposing army on ranks 7-8.
4. THE Board_Renderer SHALL render the board at a responsive size that fits within the browser viewport while maintaining a square aspect ratio.

### Requirement 2: Piece Rendering

**User Story:** As a player, I want each piece type to have a distinct Sanskrit-inspired visual design, so that I can identify pieces at a glance.

#### Acceptance Criteria

1. THE Piece_Renderer SHALL draw each of the six piece types (Raja, Mantri, Gaja, Ashva, Ratha, Padati) with a unique programmatic design using the Canvas API.
2. THE Piece_Renderer SHALL differentiate the two player armies using distinct color schemes while maintaining the earthy/sandstone palette.
3. THE Piece_Renderer SHALL render piece designs using Sanskrit-inspired iconography drawn programmatically without external image assets.

### Requirement 3: Raja Movement

**User Story:** As a player, I want to move my Raja one square in any direction, so that I can protect or reposition my King piece.

#### Acceptance Criteria

1. WHEN the Active_Player selects a Raja, THE Move_Engine SHALL highlight all squares within one square distance in any direction (horizontal, vertical, diagonal) that are either empty or occupied by an Opponent_Player piece.
2. WHEN a Raja destination square is occupied by an Opponent_Player piece, THE Move_Engine SHALL permit the capture of that piece.
3. THE Move_Engine SHALL exclude destination squares that are occupied by the Active_Player own pieces from the Raja legal move set.

### Requirement 4: Mantri Movement

**User Story:** As a player, I want to move my Mantri one square diagonally, so that I can use the Minister strategically on the board.

#### Acceptance Criteria

1. WHEN the Active_Player selects a Mantri, THE Move_Engine SHALL highlight all squares exactly one square away diagonally that are either empty or occupied by an Opponent_Player piece.
2. THE Move_Engine SHALL restrict the Mantri to a maximum of four possible destination squares (the four diagonal adjacents).
3. THE Move_Engine SHALL exclude destination squares that are occupied by the Active_Player own pieces from the Mantri legal move set.

### Requirement 5: Gaja Movement

**User Story:** As a player, I want to move my Gaja exactly two squares diagonally with the ability to jump, so that I can use the Elephant's unique movement.

#### Acceptance Criteria

1. WHEN the Active_Player selects a Gaja, THE Move_Engine SHALL highlight all squares exactly two squares away diagonally that are either empty or occupied by an Opponent_Player piece.
2. THE Move_Engine SHALL allow the Gaja to jump over any piece occupying the intervening diagonal square.
3. THE Move_Engine SHALL restrict the Gaja to a maximum of four possible destination squares (the four squares two diagonal steps away).
4. THE Move_Engine SHALL exclude destination squares that are occupied by the Active_Player own pieces from the Gaja legal move set.

### Requirement 6: Ashva Movement

**User Story:** As a player, I want to move my Ashva in an L-shape and jump over pieces, so that I can use the Horse tactically.

#### Acceptance Criteria

1. WHEN the Active_Player selects an Ashva, THE Move_Engine SHALL highlight all squares reachable by an L-shaped move (two squares in one cardinal direction plus one square perpendicular) that are either empty or occupied by an Opponent_Player piece.
2. THE Move_Engine SHALL allow the Ashva to jump over any pieces between the origin and destination squares.
3. THE Move_Engine SHALL restrict the Ashva to a maximum of eight possible destination squares.
4. THE Move_Engine SHALL exclude destination squares that are occupied by the Active_Player own pieces from the Ashva legal move set.

### Requirement 7: Ratha Movement

**User Story:** As a player, I want to move my Ratha any number of squares in a straight line, so that I can control ranks and files.

#### Acceptance Criteria

1. WHEN the Active_Player selects a Ratha, THE Move_Engine SHALL highlight all squares along the rank and file from the Ratha current position up to the first obstruction in each direction.
2. WHEN a square along the Ratha path is occupied by an Opponent_Player piece, THE Move_Engine SHALL include that square as a valid capture destination and exclude all squares beyond it in that direction.
3. WHEN a square along the Ratha path is occupied by the Active_Player own piece, THE Move_Engine SHALL exclude that square and all squares beyond it in that direction.

### Requirement 8: Padati Movement and Promotion

**User Story:** As a player, I want to advance my Padati one square forward and capture diagonally, and promote the Padati upon reaching the last rank.

#### Acceptance Criteria

1. WHEN the Active_Player selects a Padati, THE Move_Engine SHALL highlight the square one step forward (toward the opponent side) if that square is empty.
2. WHEN diagonal forward squares are occupied by Opponent_Player pieces, THE Move_Engine SHALL include those squares as valid capture destinations for the Padati.
3. THE Move_Engine SHALL restrict Padati forward movement to one square only with no initial two-square advance option.
4. WHEN a Padati reaches the last rank (rank 8 for one player, rank 1 for the other), THE Chaturanga_System SHALL promote that Padati to a Mantri immediately.
5. THE Chaturanga_System SHALL replace the promoted Padati visual and movement rules with those of a Mantri for all subsequent turns.

### Requirement 9: Turn Management

**User Story:** As a player, I want clear indication of whose turn it is, so that both players know when to act.

#### Acceptance Criteria

1. WHEN the game starts, THE Turn_Manager SHALL assign the first turn to the player controlling the army on ranks 1-2.
2. WHEN the Active_Player completes a valid move, THE Turn_Manager SHALL transfer control to the Opponent_Player.
3. THE Chaturanga_System SHALL display a visible indicator identifying the Active_Player at all times during gameplay.
4. WHILE it is the Active_Player turn, THE Input_Handler SHALL accept piece selection and move inputs only for pieces belonging to the Active_Player.
5. WHILE it is the Active_Player turn, THE Input_Handler SHALL reject selection attempts on Opponent_Player pieces.

### Requirement 10: Piece Selection and Move Execution

**User Story:** As a player, I want to click a piece to see its legal moves highlighted, then click a destination to move it.

#### Acceptance Criteria

1. WHEN the Active_Player clicks on one of their own pieces, THE Chaturanga_System SHALL visually highlight that piece as selected and display all legal destination squares with a distinct visual indicator.
2. WHEN the Active_Player clicks a highlighted legal destination square, THE Chaturanga_System SHALL move the selected piece to that square and remove any captured Opponent_Player piece.
3. WHEN the Active_Player clicks on a different one of their own pieces while a piece is selected, THE Chaturanga_System SHALL deselect the previous piece and select the new piece with updated legal move highlights.
4. WHEN the Active_Player clicks on a non-highlighted square or clicks on empty space, THE Chaturanga_System SHALL deselect the currently selected piece and remove all move highlights.

### Requirement 11: Victory by Raja Capture

**User Story:** As a player, I want to win by capturing the opponent's Raja, so that the game follows authentic Chaturanga victory rules.

#### Acceptance Criteria

1. WHEN the Active_Player moves a piece to the square occupied by the Opponent_Player Raja, THE Chaturanga_System SHALL declare the Active_Player as the winner.
2. WHEN a victory condition is met, THE Chaturanga_System SHALL display a victory message identifying the winning player.
3. WHEN a victory condition is met, THE Chaturanga_System SHALL stop accepting further move inputs.

### Requirement 12: Victory by Stalemate

**User Story:** As a player, I want the opponent to lose if they have no legal moves, so that stalemate is a loss condition per Chaturanga rules.

#### Acceptance Criteria

1. WHEN control transfers to a player, THE Move_Engine SHALL evaluate whether that player has at least one legal move available with any of their remaining pieces.
2. IF a player has no legal moves available with any remaining piece, THEN THE Chaturanga_System SHALL declare that player as the loser and the Opponent_Player as the winner.
3. WHEN a stalemate victory condition is met, THE Chaturanga_System SHALL display a victory message identifying the winning player and indicating the loss was due to stalemate.

### Requirement 13: Game Reset

**User Story:** As a player, I want to start a new game after one ends, so that we can play multiple rounds without reloading the page.

#### Acceptance Criteria

1. WHEN a game ends in victory, THE Chaturanga_System SHALL present a new game option to the players.
2. WHEN the players activate the new game option, THE Chaturanga_System SHALL reset the board to the initial starting position with all 32 pieces placed correctly.
3. WHEN a new game starts, THE Turn_Manager SHALL assign the first turn to the player controlling the army on ranks 1-2.

### Requirement 14: Technical Architecture

**User Story:** As a developer, I want the game structured using IIFE modules with separate script files and no external dependencies, so that the code follows the existing project conventions.

#### Acceptance Criteria

1. THE Chaturanga_System SHALL implement all game logic using vanilla JavaScript with no external library dependencies.
2. THE Chaturanga_System SHALL organize code into separate script files using the IIFE module pattern consistent with the existing project structure.
3. THE Chaturanga_System SHALL render all visual elements programmatically using the HTML5 Canvas API without external image or font assets.
4. THE Chaturanga_System SHALL operate within a single HTML page that loads all script files via script tags.

### Requirement 15: Visual Theme and Aesthetics

**User Story:** As a player, I want the game to have an authentic historical Indian visual theme, so that the experience feels connected to Chaturanga's heritage.

#### Acceptance Criteria

1. THE Board_Renderer SHALL use an earthy/sandstone color palette for the board squares, borders, and background elements.
2. THE Board_Renderer SHALL render ornate traditional Indian-style decorative patterns along the board border using programmatic Canvas drawing.
3. THE Piece_Renderer SHALL draw piece symbols using Sanskrit-inspired geometric and iconographic designs.
4. THE Chaturanga_System SHALL use a visual style consistent with ancient Indian aesthetics for all UI text and indicators.
