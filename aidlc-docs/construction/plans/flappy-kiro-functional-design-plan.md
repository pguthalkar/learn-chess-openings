# Functional Design Plan - Flappy Kiro

## Plan Overview
Design the game's business logic, physics model, scoring algorithm, and game state management.

## Design Steps

- [x] Step 1: Define Game State Machine (title, playing, game-over states and transitions)
- [x] Step 2: Define Physics Model (gravity, lift, velocity, terminal velocity)
- [x] Step 3: Define Obstacle Generation Logic (spacing, gap sizing, randomization)
- [x] Step 4: Define Collision Detection Algorithm (hitbox shapes, detection method)
- [x] Step 5: Define Scoring System (point awards, high score persistence)
- [x] Step 6: Define Difficulty Progression Algorithm (what changes, rate of change, caps)
- [x] Step 7: Define Rendering Pipeline (draw order, canvas management, responsive scaling)
- [x] Step 8: Define Input Handling (spacebar events, debouncing, multi-press behavior)
- [x] Step 9: Define Audio System (sound triggering, concurrent playback, user interaction requirement)

---

## Clarifying Questions

Please answer the following questions to refine the functional design.

### Question 1
What shape should the truck's hitbox be for collision detection?

A) Rectangle matching the full truck sprite bounds (simple, slightly less forgiving)
B) Smaller rectangle inside the truck bounds (more forgiving, better player experience)
C) Circle/ellipse approximation (smoother collision feel)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
How should gravity and lift feel for the truck?

A) Light and floaty (slow fall, gentle lift — easier gameplay)
B) Heavy and snappy (fast fall, strong lift — more challenging, like original Flappy Bird)
C) Medium (balanced between floaty and snappy)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
How should difficulty progression work specifically?

A) Increase obstacle scroll speed only (barriers come faster)
B) Decrease gap size only (narrower openings)
C) Decrease spacing between barrier pairs only (less reaction time)
D) Combination of all three (speed + gap size + spacing)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
At what rate should difficulty increase?

A) Every 5 points (aggressive — gets hard quickly)
B) Every 10 points (moderate — steady ramp)
C) Every 15-20 points (gentle — long easy period before it gets tough)
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 5
Should the truck rotate/tilt based on its vertical velocity (nose up when ascending, nose down when falling)?

A) Yes, tilt the truck based on velocity (more dynamic visuals)
B) No, keep the truck level at all times (simpler)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6
What should the scrolling background look like?

A) Simple solid color with a ground/road strip at the bottom
B) Parallax scrolling with road at bottom and sky/clouds in background
C) Single scrolling road texture
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7
Should there be a maximum difficulty cap (so the game doesn't become literally impossible)?

A) Yes, cap difficulty after a certain score (e.g., after score 50, no more increase)
B) No, let difficulty increase indefinitely
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 8
How should the truck be rendered (since we don't have a truck sprite asset)?

A) Draw a simple truck using canvas shapes (rectangles, circles for wheels)
B) Use emoji/text character as placeholder (🚛)
C) Create a detailed pixel-art style truck using canvas drawing
D) Other (please describe after [Answer]: tag below)

[Answer]: C
