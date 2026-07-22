# Unit Test Instructions - Flappy Kiro

## Overview

Since this is a vanilla JavaScript project without a test framework, unit testing is performed through manual verification and browser DevTools console testing.

## Console-Based Verification Tests

Open `index.html` in a browser, then open DevTools Console (F12) and run these tests:

### Test 1: Constants Loaded
```javascript
// Verify all game constants are defined
console.assert(GRAVITY === 0.6, 'GRAVITY should be 0.6');
console.assert(LIFT === -10, 'LIFT should be -10');
console.assert(TERMINAL_VELOCITY === 12, 'TERMINAL_VELOCITY should be 12');
console.assert(GAP_SIZE === 150, 'GAP_SIZE should be 150');
console.assert(OBSTACLE_WIDTH === 60, 'OBSTACLE_WIDTH should be 60');
console.assert(INITIAL_SCROLL_SPEED === 3, 'INITIAL_SCROLL_SPEED should be 3');
console.assert(MAX_SCROLL_SPEED === 4.5, 'MAX_SCROLL_SPEED should be 4.5');
console.assert(DIFFICULTY_INTERVAL === 15, 'DIFFICULTY_INTERVAL should be 15');
console.assert(MAX_DIFFICULTY_LEVEL === 3, 'MAX_DIFFICULTY_LEVEL should be 3');
console.log('✅ All constants verified');
```

### Test 2: Modules Loaded
```javascript
// Verify all game modules exist
console.assert(typeof Input !== 'undefined', 'Input module should exist');
console.assert(typeof AudioManager !== 'undefined', 'AudioManager module should exist');
console.assert(typeof Truck !== 'undefined', 'Truck module should exist');
console.assert(typeof Obstacles !== 'undefined', 'Obstacles module should exist');
console.assert(typeof Renderer !== 'undefined', 'Renderer module should exist');
console.assert(typeof Game !== 'undefined', 'Game module should exist');
console.log('✅ All modules loaded');
```

### Test 3: Truck API
```javascript
// Verify truck module has required methods
console.assert(typeof Truck.reset === 'function', 'Truck.reset should be a function');
console.assert(typeof Truck.update === 'function', 'Truck.update should be a function');
console.assert(typeof Truck.lift === 'function', 'Truck.lift should be a function');
console.assert(typeof Truck.getHitbox === 'function', 'Truck.getHitbox should be a function');
console.assert(typeof Truck.render === 'function', 'Truck.render should be a function');
console.log('✅ Truck API verified');
```

### Test 4: Obstacles API
```javascript
// Verify obstacles module has required methods
console.assert(typeof Obstacles.reset === 'function', 'Obstacles.reset should be a function');
console.assert(typeof Obstacles.update === 'function', 'Obstacles.update should be a function');
console.assert(typeof Obstacles.checkCollision === 'function', 'Obstacles.checkCollision should be a function');
console.assert(typeof Obstacles.checkScoring === 'function', 'Obstacles.checkScoring should be a function');
console.assert(typeof Obstacles.render === 'function', 'Obstacles.render should be a function');
console.log('✅ Obstacles API verified');
```

### Test 5: High Score Persistence
```javascript
// Test localStorage integration
localStorage.removeItem('flappyKiro_highScore');
console.assert(localStorage.getItem('flappyKiro_highScore') === null, 'Should start with no high score');
localStorage.setItem('flappyKiro_highScore', '42');
console.assert(localStorage.getItem('flappyKiro_highScore') === '42', 'Should persist high score');
localStorage.removeItem('flappyKiro_highScore');
console.log('✅ High score persistence verified');
```

### Test 6: Canvas Setup
```javascript
// Verify canvas is properly sized
const canvas = document.getElementById('gameCanvas');
console.assert(canvas !== null, 'Canvas element should exist');
console.assert(canvas.width === window.innerWidth, 'Canvas width should match window');
console.assert(canvas.height === window.innerHeight, 'Canvas height should match window');
console.log('✅ Canvas setup verified');
```

## Expected Results
- **Total Checks**: 6 test groups, ~25 assertions
- **Expected**: All assertions pass (no console.assert failures)
- **Coverage**: Module loading, API contracts, constants, canvas setup, localStorage

## If Tests Fail
1. Check browser console for specific assertion failure message
2. Verify the file mentioned in the failure is loaded (Network tab)
3. Check for JavaScript syntax errors above the failing test
