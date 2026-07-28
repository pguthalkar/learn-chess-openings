
## Chess games

Two standalone canvas-based chess games live alongside Flappy Kiro:

- `chaturanga.html` - Ancient Indian chess (Chaturanga). Hand-drawn Sanskrit-inspired pieces. King captured directly ends the game; no check/castling/en passant.
- `chess.html` - Modern standard chess. Unicode glyph pieces. Full rules: check, checkmate, stalemate, castling, en passant, pawn promotion.

Open either file directly (or serve the folder) in a browser to play.

## How to run

Direct file open:

```
open chess.html
```

Or serve locally (needed if your browser blocks `file://` canvas loading):

```
cd /Users/Pratik.Guthalkar/workspace/chess
python3 -m http.server 8000
```

Then visit `http://localhost:8000/chess.html`. Click canvas to start, click a piece then a destination square to move.

## Learn Mode

`chess.html` now includes a **Learn Openings** option on the menu. It offers two modes for studying three curated openings (Italian Game, Ruy Lopez, Queen's Gambit):

- **Walkthrough** — user-paced; click each piece and destination to step through the main line. No penalties.
- **Practice** — you play White; the app plays Black's correct responses. Wrong moves flash red and get auto-corrected so the line continues.

Click "← Back" at any time to return to the opening picker, or again from there to return to the main menu.

## Resources

- `assets/` - Game audio and sprites
- `img/` - Screenshots and images
- `js/ch-*.js`, `css/ch-style.css` - Chaturanga modules
- `js/chess-*.js`, `css/chess-style.css` - Modern chess modules