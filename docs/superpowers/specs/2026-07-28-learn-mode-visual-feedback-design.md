# Learn Mode Visual Feedback — Design Spec

**Date:** 2026-07-28
**Status:** Approved (brainstorming)
**Target file:** `chess.html` Learn mode (`js/chess-learn.js`, `js/chess-renderer.js`)

## Goal

Add richer visual feedback to Practice mode: a green flash confirming a correct move, and an arrow showing the correct move when the user gets it wrong (during the existing auto-correction window).

## Context

This is a follow-up to the Learn mode feature (`docs/superpowers/specs/2026-07-21-chess-opening-learning-design.md`). That spec is implemented and shipped. The user asked about a much larger set of features (PGN import, FEN-based state matching, ECO opening database, spaced-repetition scheduling). That request was decomposed into independent sub-projects; this spec covers only the first and smallest one: visual feedback. The others (FEN engine, data model v2, PGN import, ECO database, SRS) are out of scope here and each need their own spec later. SRS in particular needs explicit sign-off before starting, since it requires lifting the standing "no saved progress across sessions" non-goal from the original spec.

## Scope

- Practice mode only. Walkthrough mode is unchanged — it stays silent on wrong clicks, by design (self-paced, no correction UI).
- Green flash on the destination square after every correct Practice move (~400ms).
- Arrow from the correct source square to the correct destination square, shown only during the existing 600ms wrong-move correction window (replacing nothing — it appears alongside the existing red flash on the source square).

## Non-Goals (YAGNI)

- No changes to Walkthrough mode.
- No changes to normal Play mode.
- No new opening data, no FEN, no PGN, no ECO codes, no SRS — those are separate future specs.
- No animation/easing on the arrow or flash — same flat instant-appear/instant-clear style as the existing red flash.
- No sound.

## Architecture

No new files. Two modified files:

| File | Change |
|---|---|
| `js/chess-constants.js` | Add two colors: `CHESS_COLORS.correct` (green flash) and reuse the existing `CHESS_COLORS.selected` (amber) for the arrow — no new arrow color needed. |
| `js/chess-learn.js` | Add `successFlash` state (set on correct Practice move, cleared after 400ms) and `correctionArrow` state (set alongside the existing `wrongFlash` on a wrong Practice move, cleared on the same 600ms timer). |
| `js/chess-renderer.js` | Add `renderSuccessFlash(square)` and `renderCorrectionArrow(from, to)`. |

## Data Model

Both new states live in `ChessLearn`'s existing closure variables, next to `wrongFlash`:

```js
let successFlash = null;      // {square:{r,c}, until:number}
let correctionArrow = null;   // {from:{r,c}, to:{r,c}, until:number}

const SUCCESS_FLASH_MS = 400;
```

`correctionArrow` shares `wrongFlash`'s existing `WRONG_MOVE_FLASH_MS` (600ms) and is cleared in the same `setTimeout` callback that already clears `wrongFlash` — one timer, two pieces of state, so they can never desync.

## Behavior Changes in `_handlePracticeClick`

**Correct-move branch** (destination matches `expected.to`): immediately after `_applyStep()`, set:
```js
successFlash = { square: { r: expected.to.r, c: expected.to.c }, until: Date.now() + SUCCESS_FLASH_MS };
```
(`expected` is already in scope, captured before `_applyStep()` mutates `step`.)

**Wrong-move branch**: alongside the existing `wrongFlash` assignment, add:
```js
correctionArrow = { from: { r: expected.from.r, c: expected.from.c }, to: { r: expected.to.r, c: expected.to.c }, until: Date.now() + WRONG_MOVE_FLASH_MS };
```
Both are cleared together in the existing correction `setTimeout` (which already runs `_applyStep()` after the flash window):
```js
setTimeout(() => {
    if (state !== CHESS_LEARN_STATE.PRACTICE) return;
    wrongFlash = null;
    correctionArrow = null;
    _applyStep();
    _checkEndOrContinue();
}, WRONG_MOVE_FLASH_MS);
```

## Render Changes

In `ChessLearn.render()`, inside the `WALKTHROUGH || PRACTICE` branch, after the existing `wrongFlash` check:
```js
if (successFlash && Date.now() < successFlash.until) {
    ChessRenderer.renderSuccessFlash(successFlash.square);
}
if (correctionArrow && Date.now() < correctionArrow.until) {
    ChessRenderer.renderCorrectionArrow(correctionArrow.from, correctionArrow.to);
}
```
(`successFlash` only ever gets set in Practice, so no explicit mode check is needed here — same pattern the existing `wrongFlash` check already relies on.)

### `renderSuccessFlash(square)` (chess-renderer.js)

Same shape as the existing `renderWrongFlash`: fills the square with a translucent green (`CHESS_COLORS.correct`) and draws a green-stroked inset border. Uses the same coordinate math (`offsetX + square.c * squareSize`, `offsetY + (7 - square.r) * squareSize`).

### `renderCorrectionArrow(from, to)` (chess-renderer.js)

Draws a straight line from the center of `from`'s square to the center of `to`'s square, with a filled triangular arrowhead at the `to` end, in `CHESS_COLORS.selected` (existing amber, already used for square-selection highlight — no new color introduced for this). Line width and arrowhead size scale with `squareSize` (consistent with how every other renderer function scales, e.g. `renderCheckIndicator`, `renderWrongFlash`).

Implementation approach: compute the angle between the two centers, draw the line from center-to-center, then draw a small filled triangle at the `to` end rotated to that angle. Pure canvas path drawing — no images/sprites, matching the rest of the app's all-vector rendering (pieces, board, borders are all drawn this way already).

## Error Handling

No new error paths. Both new states are purely cosmetic and derived from data that's already validated (the opening's `moves` array passed `ChessOpenings.validate()` at load time). If `expected` is somehow malformed, the existing `applyMove` try/catch in `_applyStep` already handles that — this spec adds no new failure modes.

## Testing

Same approach as the shipped Learn mode tests (`tests/learn.test.js`): the existing Practice tests (`test_learn_practice_correctUserMoveAndAutoBlack`, `test_learn_practice_wrongDestinationTriggersCorrection`) already exercise the correct-move and wrong-move branches — no new test file needed, but two assertions are added to those existing tests to confirm the new state gets set (e.g. `successFlash !== null` after a correct move, `correctionArrow !== null` after a wrong move, with the right `from`/`to`/`square` values). The actual pixel-level rendering (color, arrow shape) is verified visually via a browser screenshot smoke test, matching how the original red flash was verified when Learn mode shipped.

## Files Touched — Final List

**Modified:**
- `js/chess-constants.js` — add `CHESS_COLORS.correct`
- `js/chess-learn.js` — add `successFlash`/`correctionArrow` state and their triggers/clears
- `js/chess-renderer.js` — add `renderSuccessFlash`, `renderCorrectionArrow`
- `tests/learn.test.js` — extend two existing Practice tests with new assertions

**Untouched:**
- Everything else, including all of Walkthrough mode, normal Play mode, and the opening data.
