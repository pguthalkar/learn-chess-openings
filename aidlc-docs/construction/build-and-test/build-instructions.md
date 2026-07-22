# Build Instructions - Flappy Kiro

## Prerequisites
- **Build Tool**: None required (vanilla HTML/JS/CSS — no build step)
- **Dependencies**: None (zero external dependencies)
- **Environment Variables**: None
- **System Requirements**: Any modern web browser (Chrome, Firefox, Safari, Edge)

## "Build" Steps

Since Flappy Kiro is a static HTML5 game with no build tooling, compilation, or dependency installation, the "build" is simply verifying the file structure is correct.

### 1. Verify File Structure

```bash
# From workspace root, verify all required files exist:
ls index.html
ls css/style.css
ls js/constants.js js/input.js js/audio.js js/truck.js js/obstacles.js js/renderer.js js/game.js
ls assets/jump.wav assets/game_over.wav
```

Expected: All files exist without errors.

### 2. No Dependencies to Install

This project has zero external dependencies. No `npm install`, `pip install`, or similar commands needed.

### 3. Serve the Game

The game must be served over HTTP (not opened as a `file://` URL) due to the Web Audio API requiring HTTP for `fetch()` calls to load audio assets.

**Option A: Python HTTP Server (recommended)**
```bash
cd /Users/Pratik.Guthalkar/Downloads/qdev-aidlc
python3 -m http.server 8080
```
Then open: http://localhost:8080

**Option B: VS Code Live Server extension**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

**Option C: Node.js (if available)**
```bash
npx serve .
```

### 4. Verify Build Success

- **Expected Output**: Game title screen appears with "Flappy Kiro" title, truck emoji, and "Press Space to start your truck journey"
- **Build Artifacts**: None (source IS the artifact)
- **Common Warnings**: Console may show "Audio context not started" warning until first user interaction — this is normal browser behavior

## Troubleshooting

### Game Shows Blank Screen
- **Cause**: JavaScript error preventing game initialization
- **Solution**: Open browser DevTools (F12) → Console tab → Check for errors. Verify all JS files are loading (Network tab).

### Audio Doesn't Play
- **Cause**: Browser autoplay policy blocks audio before user interaction
- **Solution**: This is by design. Audio initializes on first spacebar press. Verify `assets/jump.wav` and `assets/game_over.wav` exist.

### Canvas Doesn't Fill Window
- **Cause**: CSS not loading
- **Solution**: Verify `css/style.css` is referenced correctly in `index.html` and file exists.
