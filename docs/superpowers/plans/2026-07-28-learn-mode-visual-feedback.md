# Learn Mode Visual Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a green success flash on correct Practice moves and a correction arrow (showing the correct move) on wrong Practice moves, per `docs/superpowers/specs/2026-07-28-learn-mode-visual-feedback-design.md`.

**Architecture:** Two new transient state fields (`successFlash`, `correctionArrow`) inside the existing `ChessLearn` IIFE, set/cleared next to the existing `wrongFlash` field. Two new pure-drawing functions in `ChessRenderer` (`renderSuccessFlash`, `renderCorrectionArrow`), called from `ChessLearn.render()`. No new files, no changes to Walkthrough mode, normal Play mode, or opening data.

**Tech Stack:** Vanilla JS (ES2020+), HTML5 Canvas, IIFE module pattern — same as the rest of the codebase. Tests run via `node tests/learn.test.js`.

## Global Constraints

- No external dependencies; no build step; no backend
- Module pattern: existing `const Name = (() => { ... return { ... }; })();` IIFEs — do not restructure existing modules
- Practice mode only — Walkthrough and normal Play are untouched
- No new colors beyond one (`CHESS_COLORS.correct`) — the arrow reuses the existing `CHESS_COLORS.selected`
- All commits use `Co-Authored-By: Claude <noreply@anthropic.com>` trailer
- Commit prefixes: `feat:`, `test:`, `refactor:`, `chore:`, `docs:`
- Run tests with: `node tests/learn.test.js`

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `js/chess-constants.js` | Modify | Add `CHESS_COLORS.correct` |
| `js/chess-learn.js` | Modify | Add `successFlash`/`correctionArrow` state, set them in `_handlePracticeClick`, clear them in the existing correction timer, render them, expose them for testing |
| `js/chess-renderer.js` | Modify | Add `renderSuccessFlash(square)` and `renderCorrectionArrow(from, to)` |
| `tests/learn.test.js` | Modify | Extend the two existing Practice tests with assertions on the new state |

---

## Task 1: Add `CHESS_COLORS.correct`

**Files:**
- Modify: `js/chess-constants.js`

**Interfaces:**
- Consumes: nothing
- Produces: `CHESS_COLORS.correct` (green, used as the success-flash stroke color, mirroring how `CHESS_COLORS.check` is the wrong-flash stroke color)

- [ ] **Step 1: Edit `js/chess-constants.js`**

Find:
```js
    selected: 'rgba(255, 193, 7, 0.7)',
    check: 'rgba(211, 47, 47, 0.65)',
```

Replace with:
```js
    selected: 'rgba(255, 193, 7, 0.7)',
    check: 'rgba(211, 47, 47, 0.65)',
    correct: 'rgba(76, 175, 80, 0.65)',
```

- [ ] **Step 2: Verify in browser console**

Open `chess.html`, DevTools console:
```js
CHESS_COLORS.correct
```
Expected: `'rgba(76, 175, 80, 0.65)'`

- [ ] **Step 3: Commit**

```bash
git add js/chess-constants.js
git commit -m "feat: add correct color for success flash"
```

---

## Task 2: Add success flash and correction arrow drawing functions to `chess-renderer.js`

**Files:**
- Modify: `js/chess-renderer.js`

**Interfaces:**
- Consumes: `CHESS_COLORS.correct` (Task 1), `CHESS_COLORS.selected` (existing), module-level `ctx`/`offsetX`/`offsetY`/`squareSize` (existing closure variables, same ones `renderWrongFlash` already uses)
- Produces: `ChessRenderer.renderSuccessFlash(square)` where `square` is `{r, c}`; `ChessRenderer.renderCorrectionArrow(from, to)` where `from`/`to` are `{r, c}`

- [ ] **Step 1: Add `renderSuccessFlash` next to the existing `renderWrongFlash`**

In `js/chess-renderer.js`, find:
```js
    function renderWrongFlash(square) {
        const x = offsetX + square.c * squareSize;
        const y = offsetY + (7 - square.r) * squareSize;
        ctx.save();
        ctx.fillStyle = 'rgba(211, 47, 47, 0.5)';
        ctx.fillRect(x, y, squareSize, squareSize);
        ctx.strokeStyle = CHESS_COLORS.check;
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 4, y + 4, squareSize - 8, squareSize - 8);
        ctx.restore();
    }
```

Add immediately after it:
```js
    function renderSuccessFlash(square) {
        const x = offsetX + square.c * squareSize;
        const y = offsetY + (7 - square.r) * squareSize;
        ctx.save();
        ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
        ctx.fillRect(x, y, squareSize, squareSize);
        ctx.strokeStyle = CHESS_COLORS.correct;
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 4, y + 4, squareSize - 8, squareSize - 8);
        ctx.restore();
    }

    /**
     * renderCorrectionArrow — straight line + triangular arrowhead from the
     * center of `from` to just short of the center of `to` (pulled back so
     * the tip doesn't sit directly under the piece glyph on the destination
     * square).
     */
    function renderCorrectionArrow(from, to) {
        const fromX = offsetX + from.c * squareSize + squareSize / 2;
        const fromY = offsetY + (7 - from.r) * squareSize + squareSize / 2;
        const toX = offsetX + to.c * squareSize + squareSize / 2;
        const toY = offsetY + (7 - to.r) * squareSize + squareSize / 2;

        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLength = squareSize * 0.28;
        const headWidth = squareSize * 0.18;
        const tipX = toX - Math.cos(angle) * squareSize * 0.15;
        const tipY = toY - Math.sin(angle) * squareSize * 0.15;
        const baseX = tipX - headLength * Math.cos(angle);
        const baseY = tipY - headLength * Math.sin(angle);

        ctx.save();
        ctx.strokeStyle = CHESS_COLORS.selected;
        ctx.fillStyle = CHESS_COLORS.selected;
        ctx.lineWidth = Math.max(3, squareSize * 0.08);
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(baseX, baseY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(
            baseX + Math.cos(angle + Math.PI / 2) * headWidth,
            baseY + Math.sin(angle + Math.PI / 2) * headWidth
        );
        ctx.lineTo(
            baseX + Math.cos(angle - Math.PI / 2) * headWidth,
            baseY + Math.sin(angle - Math.PI / 2) * headWidth
        );
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
```

- [ ] **Step 2: Expose both functions in the `return` block**

Find:
```js
        renderLearnMenu,
        renderLearnCaption,
        renderLearnComplete,
        renderWrongFlash,
        renderBackButton,
        clear
    };
```

Replace with:
```js
        renderLearnMenu,
        renderLearnCaption,
        renderLearnComplete,
        renderWrongFlash,
        renderSuccessFlash,
        renderCorrectionArrow,
        renderBackButton,
        clear
    };
```

- [ ] **Step 3: Syntax check**

Run: `node -c js/chess-renderer.js`
Expected: no output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add js/chess-renderer.js
git commit -m "feat: add renderSuccessFlash and renderCorrectionArrow"
```

---

## Task 3: Wire success flash and correction arrow into `chess-learn.js`

**Files:**
- Modify: `js/chess-learn.js`

**Interfaces:**
- Consumes: `ChessRenderer.renderSuccessFlash`/`renderCorrectionArrow` (Task 2)
- Produces: `ChessLearn.getFlashState()` → `{ wrongFlash, successFlash, correctionArrow }`, for test introspection only (Task 4 uses this)

- [ ] **Step 1: Add the new state variables and constant**

Find:
```js
    let state = null;             // one of CHESS_LEARN_STATE.*
    let opening = null;           // current opening object
    let step = 0;                 // index into opening.moves
    let selectedFrom = null;      // {r, c} — piece user clicked first
    let wrongFlash = null;        // {square:{r,c}, until:number} for red flash
    let pendingBlackMove = null;  // timeout id for the 300ms Black auto-play
    let lastError = null;         // {message} for error overlay

    const BLACK_RESPONSE_DELAY_MS = 300;
    const WRONG_MOVE_FLASH_MS = 600;
```

Replace with:
```js
    let state = null;             // one of CHESS_LEARN_STATE.*
    let opening = null;           // current opening object
    let step = 0;                 // index into opening.moves
    let selectedFrom = null;      // {r, c} — piece user clicked first
    let wrongFlash = null;        // {square:{r,c}, until:number} for red flash
    let successFlash = null;      // {square:{r,c}, until:number} for green flash
    let correctionArrow = null;   // {from:{r,c}, to:{r,c}, until:number}
    let pendingBlackMove = null;  // timeout id for the 300ms Black auto-play
    let lastError = null;         // {message} for error overlay

    const BLACK_RESPONSE_DELAY_MS = 300;
    const WRONG_MOVE_FLASH_MS = 600;
    const SUCCESS_FLASH_MS = 400;
```

- [ ] **Step 2: Set `successFlash` on a correct Practice move and `correctionArrow` on a wrong one**

Find `_handlePracticeClick`'s body:
```js
        // Already have selectedFrom. Check destination.
        if (sq.row === expected.to.r && sq.col === expected.to.c) {
            // Correct
            _applyStep();
            selectedFrom = null;
            _checkEndOrContinue();
        } else {
            // Wrong destination — flash and auto-correct
            wrongFlash = { square: { r: selectedFrom.r, c: selectedFrom.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            selectedFrom = null;
            setTimeout(() => {
                if (state !== CHESS_LEARN_STATE.PRACTICE) return;
                if (wrongFlash) wrongFlash = null;
                _applyStep();
                _checkEndOrContinue();
            }, WRONG_MOVE_FLASH_MS);
        }
```

Replace with:
```js
        // Already have selectedFrom. Check destination.
        if (sq.row === expected.to.r && sq.col === expected.to.c) {
            // Correct
            successFlash = { square: { r: expected.to.r, c: expected.to.c }, until: Date.now() + SUCCESS_FLASH_MS };
            _applyStep();
            selectedFrom = null;
            _checkEndOrContinue();
        } else {
            // Wrong destination — flash, show the correct move, and auto-correct
            wrongFlash = { square: { r: selectedFrom.r, c: selectedFrom.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            correctionArrow = { from: { r: expected.from.r, c: expected.from.c }, to: { r: expected.to.r, c: expected.to.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
            selectedFrom = null;
            setTimeout(() => {
                if (state !== CHESS_LEARN_STATE.PRACTICE) return;
                wrongFlash = null;
                correctionArrow = null;
                _applyStep();
                _checkEndOrContinue();
            }, WRONG_MOVE_FLASH_MS);
        }
```

- [ ] **Step 3: Render the new overlays**

Find in `render()`:
```js
            // Wrong-move flash overlay
            if (wrongFlash && Date.now() < wrongFlash.until) {
                ChessRenderer.renderWrongFlash(wrongFlash.square);
            }
            // Back button
            ChessRenderer.renderBackButton();
```

Replace with:
```js
            // Wrong-move flash overlay
            if (wrongFlash && Date.now() < wrongFlash.until) {
                ChessRenderer.renderWrongFlash(wrongFlash.square);
            }
            // Correct-move flash overlay
            if (successFlash && Date.now() < successFlash.until) {
                ChessRenderer.renderSuccessFlash(successFlash.square);
            }
            // Correction arrow (shown during the same window as wrongFlash)
            if (correctionArrow && Date.now() < correctionArrow.until) {
                ChessRenderer.renderCorrectionArrow(correctionArrow.from, correctionArrow.to);
            }
            // Back button
            ChessRenderer.renderBackButton();
```

- [ ] **Step 4: Expose a test-only introspection getter**

Find the `return` block:
```js
    return {
        openMenu,
        start,
        exit,
        isActive,
        handleClick,
        render,
        getState: () => state,
        getError: () => lastError
    };
```

Replace with:
```js
    return {
        openMenu,
        start,
        exit,
        isActive,
        handleClick,
        render,
        getState: () => state,
        getError: () => lastError,
        getFlashState: () => ({ wrongFlash, successFlash, correctionArrow })
    };
```

- [ ] **Step 5: Syntax check**

Run: `node -c js/chess-learn.js`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add js/chess-learn.js
git commit -m "feat: wire success flash and correction arrow into practice mode"
```

---

## Task 4: Extend tests and verify in-browser

**Files:**
- Modify: `tests/learn.test.js`

**Interfaces:**
- Consumes: `ChessLearn.getFlashState()` (Task 3)

- [ ] **Step 1: Extend `test_learn_practice_correctUserMoveAndAutoBlack`**

Find:
```js
function test_learn_practice_correctUserMoveAndAutoBlack() {
    // Practice auto-plays Black via a 300ms setTimeout; this test only checks
    // the synchronous user-move path (the auto-play is verified in-browser).
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); // e2
    clickSquare(3, 4); // e4
    assert(ChessBoard.getPiece(3, 4) !== null, 'e4 has white pawn after user move');
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice (Black timer pending)');
    ChessLearn.exit();
}
```

Replace with:
```js
function test_learn_practice_correctUserMoveAndAutoBlack() {
    // Practice auto-plays Black via a 300ms setTimeout; this test only checks
    // the synchronous user-move path (the auto-play is verified in-browser).
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); // e2
    clickSquare(3, 4); // e4
    assert(ChessBoard.getPiece(3, 4) !== null, 'e4 has white pawn after user move');
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice (Black timer pending)');
    const flash = ChessLearn.getFlashState();
    assert(flash.successFlash !== null, 'successFlash set after correct move');
    assertEqual(flash.successFlash.square.r, 3, 'successFlash square row is e4');
    assertEqual(flash.successFlash.square.c, 4, 'successFlash square col is e4');
    ChessLearn.exit();
}
```

- [ ] **Step 2: Extend `test_learn_practice_wrongDestinationTriggersCorrection`**

Find:
```js
function test_learn_practice_wrongDestinationTriggersCorrection() {
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); // e2 — correct source
    clickSquare(3, 0); // a4 — wrong destination
    // The correction fires 600ms later via setTimeout; here we only check
    // that nothing changed synchronously and we're still in practice.
    assert(ChessBoard.getPiece(1, 4) !== null, 'e2 pawn still there immediately after wrong click');
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice');
    ChessLearn.exit();
}
```

Replace with:
```js
function test_learn_practice_wrongDestinationTriggersCorrection() {
    ChessLearn.start('italian', 'practice');
    clickSquare(1, 4); // e2 — correct source
    clickSquare(3, 0); // a4 — wrong destination
    // The correction fires 600ms later via setTimeout; here we only check
    // that nothing changed synchronously and we're still in practice.
    assert(ChessBoard.getPiece(1, 4) !== null, 'e2 pawn still there immediately after wrong click');
    assertEqual(ChessLearn.getState(), 'learn_practice', 'still in practice');
    const flash = ChessLearn.getFlashState();
    assert(flash.correctionArrow !== null, 'correctionArrow set after wrong move');
    assertEqual(flash.correctionArrow.from.r, 1, 'arrow starts at e2 row');
    assertEqual(flash.correctionArrow.from.c, 4, 'arrow starts at e2 col');
    assertEqual(flash.correctionArrow.to.r, 3, 'arrow ends at e4 row');
    assertEqual(flash.correctionArrow.to.c, 4, 'arrow ends at e4 col');
    ChessLearn.exit();
}
```

- [ ] **Step 3: Run the full suite**

Run: `node tests/learn.test.js`
Expected: all tests pass (43 passed, 0 failed — the existing 41 plus 2 new assertions' worth of checks folded into the two extended tests; exact count may differ slightly by how `assert`/`assertEqual` calls are tallied, but `0 failed` is the required outcome).

- [ ] **Step 4: Run the chaturanga suite to confirm no regression**

Run: `node tests/ch-integration.test.js`
Expected: `116 | Passed: 116 | Failed: 0` (unchanged — this suite doesn't touch Learn mode).

- [ ] **Step 5: Manual browser smoke test**

Serve the app (`python3 -m http.server 8000` from the repo root) and open `http://localhost:8000/chess.html`:
1. Menu → Learn Openings → Practice → Italian Game
2. Play the correct first move (e2 then e4) — expect a brief green flash on e4
3. Start the next move, click the correct source, then an incorrect destination — expect the red flash on the source square AND an amber arrow pointing from that square to the correct destination, both clearing together after ~600ms when the move auto-corrects
4. Confirm Walkthrough mode is unchanged (no flashes/arrows appear there) and normal Play mode is unaffected

- [ ] **Step 6: Commit**

```bash
git add tests/learn.test.js
git commit -m "test: cover success flash and correction arrow state"
```

---

## Self-Review

**Spec coverage check:**
- Green flash on correct Practice move → Task 3 Step 2/3, Task 4 Step 1
- Arrow on wrong Practice move, during the existing 600ms window → Task 3 Step 2/3, Task 4 Step 2
- Walkthrough/Play untouched → no task modifies `_handleWalkthroughClick`, `chess-game.js`, or opening data
- One new color, arrow reuses `CHESS_COLORS.selected` → Task 1
- Testing via extended existing tests + browser smoke test → Task 4

**Placeholder scan:** No "TBD"/"TODO". Every step has full code.

**Type consistency:** `successFlash: {square:{r,c}, until}` and `correctionArrow: {from:{r,c}, to:{r,c}, until}` are defined once in Task 3 Step 1 and used identically in Task 3 Steps 2–4 and Task 4. `ChessLearn.getFlashState()` return shape matches what Task 4's assertions read.

**No spec gaps found.**
