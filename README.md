
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

## Resources

- `assets/` - Game audio and sprites
- `img/` - Screenshots and images
- `js/ch-*.js`, `css/ch-style.css` - Chaturanga modules
- `js/chess-*.js`, `css/chess-style.css` - Modern chess modules