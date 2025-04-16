/*************************************************
 *       START SCREEN & LEADERBOARDS LOGIC
 *************************************************/
const startScreen        = document.getElementById("startScreen");
const leaderboardsScreen = document.getElementById("leaderboardsScreen");
const defeatScreen       = document.getElementById("defeatScreen");

const btnPlay            = document.getElementById("btnPlay");
const btnLeaderboards    = document.getElementById("btnLeaderboards");
const btnBack            = document.getElementById("btnBack");

const btnRestart           = document.getElementById("btnRestart");
const btnMainMenu          = document.getElementById("btnMainMenu");
const btnDefeatLeaderboards= document.getElementById("btnDefeatLeaderboards");

btnPlay.addEventListener("click", onPlayGame);
btnLeaderboards.addEventListener("click", onShowLeaderboards);
btnBack.addEventListener("click", onBackFromLeaderboards);

btnRestart.addEventListener("click", onRestartGame);
btnMainMenu.addEventListener("click", onDefeatMainMenu);
btnDefeatLeaderboards.addEventListener("click", onDefeatShowLeaderboards);

function onPlayGame() {
  startScreen.style.display = "none";
  gameContainer.style.display = "block";
  scoreboard.style.display = "flex";
  init();
}

function onShowLeaderboards() {
  startScreen.style.display = "none";
  leaderboardsScreen.style.display = "flex";
}

function onBackFromLeaderboards() {
  leaderboardsScreen.style.display = "none";
  startScreen.style.display = "flex";
}

function onRestartGame() {
  defeatScreen.style.display = "none";
  gameContainer.style.display = "block";
  scoreboard.style.display = "flex";
  init(); // fully resets with base speed
}

function onDefeatMainMenu() {
  defeatScreen.style.display = "none";
  startScreen.style.display = "flex";
}

function onDefeatShowLeaderboards() {
  defeatScreen.style.display = "none";
  leaderboardsScreen.style.display = "flex";
}

/*************************************************
 *            GAME-WIDE VARIABLES
 *************************************************/
const gameContainer     = document.getElementById("gameContainer");
const playerEl          = document.getElementById("player");
const scoreEl           = document.getElementById("score");
const livesEl           = document.getElementById("lives");
const levelEl           = document.getElementById("level");
const scoreboard        = document.getElementById("scoreboard");
const finalScoreDisplay = document.getElementById("finalScoreDisplay");

const GAME_WIDTH  = 600;
const GAME_HEIGHT = 600;

let level         = 1;
let score         = 0;
let lives         = 3;
let playerX       = GAME_WIDTH / 2 - 20;
let playerY       = GAME_HEIGHT - 60;
let playerSpeed   = 5;
let isMovingLeft  = false;
let isMovingRight = false;
let isShooting    = false;
let isInvulnerable= false;

const enemies      = [];
const bullets      = [];
const enemyBullets = [];

/* Enemy config */
const ENEMY_WIDTH   = 50;
const ENEMY_HEIGHT  = 50;
const enemyRows     = 3;
const enemyCols     = 8;
const enemySpacingX = 40;
const enemySpacingY = 40;
let enemyDirection  = 1;
let enemySpeed      = 1;
let maxEnemyBullets = 3; // baseline, increases with level
let divingEnemies = [];

const PLAYER_BULLET_WIDTH  = 6;
const PLAYER_BULLET_HEIGHT = 10;
const ENEMY_BULLET_WIDTH   = 6;
const ENEMY_BULLET_HEIGHT  = 10;
const PLAYER_BULLET_SPEED  = 7;
const ENEMY_BULLET_SPEED   = 4;

/*
  Important: We only want to bind events once,
  and we need to manage the requestAnimationFrame
  so we don't end up with multiple loops.
*/
let eventsBound = false;
let gameLoopId  = null;
let lastEnemyShotTime = 0;

/*************************************************
 *                INITIALIZATION
 *************************************************/
function init() {
  // 1) Cancel any old loop so we don't stack them
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
  }

  // 2) Reset everything (enemySpeed -> 1, etc.)
  resetAllGameVars();

  // 3) Bind events only once
  if (!eventsBound) {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    gameContainer.addEventListener("touchstart", onTouchStart);
    gameContainer.addEventListener("touchend", onTouchEnd);
    gameContainer.addEventListener("touchmove", onTouchMove);
    eventsBound = true;
  }

  // 4) Start a fresh loop
  gameLoopId = requestAnimationFrame(gameLoop);
}

function resetAllGameVars() {
  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;

  level = 1;
  score = 0;
  lives = 3;
  updateLevel();
  updateScore();
  updateLives();

  playerX = GAME_WIDTH / 2 - 20;
  playerY = GAME_HEIGHT - 60;
  updatePlayerPosition();

  // Clean up leftover DOM elements
  while (gameContainer.querySelector(".enemy")) {
    gameContainer.querySelector(".enemy").remove();
  }
  while (gameContainer.querySelector(".bullet")) {
    gameContainer.querySelector(".bullet").remove();
  }
  while (gameContainer.querySelector(".enemy-bullet")) {
    gameContainer.querySelector(".enemy-bullet").remove();
  }

  createEnemies();

  enemyDirection = 1;
  enemySpeed     = 1; // base speed reset
  isInvulnerable = false;
  playerEl.style.visibility = "visible";

  lastEnemyShotTime = performance.now();
}

/*************************************************
 *              CREATE ENEMIES
 *************************************************/
function createEnemies() {
  for (let row = 0; row < enemyRows; row++) {
    for (let col = 0; col < enemyCols; col++) {
      const enemyEl = document.createElement("div");
      enemyEl.classList.add("enemy");
      enemyEl.style.backgroundImage = "url('images/enemy.png')";

      const x = 50 + col * enemySpacingX;
      const y = 50 + row * enemySpacingY;

      gameContainer.appendChild(enemyEl);

      enemies.push({
        el: enemyEl,
        x: x,
        y: y,
        alive: true
      });
    }
  }
}

/*************************************************
 *          RESET ENEMIES TO TOP
 *************************************************/

function resetEnemiesToTop() {
  enemies.forEach(e => {
    if (!e.alive) return;
    e.y = 50 + Math.floor(Math.random() * enemyRows) * enemySpacingY;
    e.x = 50 + Math.floor(Math.random() * enemyCols) * enemySpacingX;
    e.el.style.top = e.y + 'px';
    e.el.style.left = e.x + 'px';
  });

  divingEnemies.length = 0;
  enemyBullets.forEach(b => b.el.remove());
  enemyBullets.length = 0;
}


/*************************************************
 *          PLAYER CONTROLS - KEYBOARD
 *************************************************/
function onKeyDown(e) {
  if (e.key === "ArrowLeft") {
    isMovingLeft = true;
  } else if (e.key === "ArrowRight") {
    isMovingRight = true;
  } else if (e.key === " " || e.key === "Spacebar") {
    if (!isShooting) {
      isShooting = true;
      shootBullet();
    }
  }
}

function onKeyUp(e) {
  if (e.key === "ArrowLeft") {
    isMovingLeft = false;
  } else if (e.key === "ArrowRight") {
    isMovingRight = false;
  } else if (e.key === " " || e.key === "Spacebar") {
    isShooting = false;
  }
}

/*************************************************
 *          PLAYER CONTROLS - TOUCH
 *************************************************/
function onTouchStart(e) {
  const touchX = e.touches[0].clientX - gameContainer.offsetLeft;
  if (touchX < GAME_WIDTH / 2) {
    isMovingLeft = true;
  } else {
    isMovingRight = true;
  }

  if (!isShooting) {
    isShooting = true;
    shootBullet();
  }
}

function onTouchEnd(e) {
  isMovingLeft = false;
  isMovingRight = false;
  isShooting = false;
}

function onTouchMove(e) {
  e.preventDefault();
  const touchX = e.touches[0].clientX - gameContainer.offsetLeft;
  playerX = Math.max(0, Math.min(GAME_WIDTH - 40, touchX - 20));
  updatePlayerPosition();
}

/*************************************************
 *        PLAYER & ENEMY MOVEMENT
 *************************************************/
function updatePlayerPosition() {
  if (isMovingLeft) {
    playerX = Math.max(0, playerX - playerSpeed);
  }
  if (isMovingRight) {
    playerX = Math.min(GAME_WIDTH - 40, playerX + playerSpeed);
  }
  playerEl.style.left = playerX + "px";
  playerEl.style.top  = playerY + "px";
}

function moveEnemies() {
  let shiftDown = false;
  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    enemy.x += enemyDirection * enemySpeed;

    if (enemy.x < 0 || enemy.x + ENEMY_WIDTH > GAME_WIDTH) {
      shiftDown = true;
    }
  });

  if (shiftDown) {
    enemies.forEach(enemy => {
      if (!enemy.alive) return;
      enemy.y += 20;
    });
    enemyDirection *= -1;
  }

  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    enemy.el.style.left = enemy.x + "px";
    enemy.el.style.top  = enemy.y + "px";
  });
}

// Randomly selects an enemy to dive (independent movement like Galaga)
function maybeSendDivingEnemy() {
  // 1% chance each frame (~60fps) and max 2 diving enemies at once
  if (Math.random() < 0.01 && divingEnemies.length < 2) {

    // Filter enemies: must be alive and not already diving
    const eligible = enemies.filter(e => e.alive && !divingEnemies.includes(e));

    // If any eligible enemies exist, randomly pick one and mark it for diving
    if (eligible.length > 0) {
      const e = eligible[Math.floor(Math.random() * eligible.length)];

      // Start with a copy of the enemy and a sine-wave angle tracker
      divingEnemies.push({ ...e, angle: 0 });
    }
  }
}


// Moves each diving enemy downward in a sine-wave pattern
function updateDivingEnemies() {
  for (let i = divingEnemies.length - 1; i >= 0; i--) {
    const d = divingEnemies[i];

    // Increment angle to drive the sine wave left-right pattern
    d.angle += 0.1;

    // Move downward, with horizontal sway
    d.y += 2;
    d.x += Math.sin(d.angle) * 3;

    // Apply new position to the DOM element
    d.el.style.left = d.x + "px";
    d.el.style.top = d.y + "px";

    // Remove from divingEnemies if it's off-screen
    if (d.y > GAME_HEIGHT) {
      divingEnemies.splice(i, 1);
    }
  }
}



/*************************************************
 *               SHOOTING
 *************************************************/
function shootBullet() {
  const bulletEl = document.createElement("div");
  bulletEl.classList.add("bullet");
  gameContainer.appendChild(bulletEl);

  // from player's center
  const bulletX = playerX + 20 - PLAYER_BULLET_WIDTH / 2;
  const bulletY = playerY;

  bullets.push({ el: bulletEl, x: bulletX, y: bulletY });
}

function enemyShoot(enemy) {
  const bulletEl = document.createElement("div");
  bulletEl.classList.add("enemy-bullet");
  gameContainer.appendChild(bulletEl);

  const bulletX = enemy.x + ENEMY_WIDTH / 2 - ENEMY_BULLET_WIDTH / 2;
  const bulletY = enemy.y + ENEMY_HEIGHT;

  enemyBullets.push({ el: bulletEl, x: bulletX, y: bulletY });
}

/*************************************************
 *   PLAYER BULLETS & COLLISIONS
 *************************************************/
function updatePlayerBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= PLAYER_BULLET_SPEED;
    b.el.style.left = b.x + "px";
    b.el.style.top  = b.y + "px";

    // Off-screen
    if (b.y < -PLAYER_BULLET_HEIGHT) {
      b.el.remove();
      bullets.splice(i, 1);
      continue;
    }

    // Collision with enemies
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (!e.alive) continue;

      if (rectsOverlap(b.x, b.y, PLAYER_BULLET_WIDTH, PLAYER_BULLET_HEIGHT,
                       e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT)) {
        e.alive = false;
        e.el.remove();
        b.el.remove();
        bullets.splice(i, 1);

        score += 10;
        updateScore();
        break;
      }
    }
  }
}

/*************************************************
 *   ENEMY BULLETS & COLLISIONS
 *************************************************/
function updateEnemyBullets(timestamp) {
  // Random enemy firing ~1/second
  const now = performance.now();
  if (enemyBullets.length < maxEnemyBullets && now - lastEnemyShotTime > 1000) {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length > 0) {
      const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      enemyShoot(randomEnemy);
    }
    lastEnemyShotTime = now;
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.y += ENEMY_BULLET_SPEED;
    eb.el.style.left = eb.x + "px";
    eb.el.style.top  = eb.y + "px";

    // Off-screen
    if (eb.y > GAME_HEIGHT + ENEMY_BULLET_HEIGHT) {
      eb.el.remove();
      enemyBullets.splice(i, 1);
      continue;
    }

    // If invulnerable, skip collision
    if (!isInvulnerable) {
      const bulletPoly = [
        [eb.x, eb.y],
        [eb.x + ENEMY_BULLET_WIDTH, eb.y],
        [eb.x + ENEMY_BULLET_WIDTH, eb.y + ENEMY_BULLET_HEIGHT],
        [eb.x, eb.y + ENEMY_BULLET_HEIGHT]
      ];
      const playerTriangle = [
        [playerX + 20, playerY], 
        [playerX + 40, playerY + 40],
        [playerX,      playerY + 40]
      ];

      if (satPolygonsCollide(playerTriangle, bulletPoly)) {
        loseLife();
        eb.el.remove();
        enemyBullets.splice(i, 1);
      }
    }
  }
}

/*************************************************
 *       ENEMY COLLISIONS
 *************************************************/

function updateEnemyCollisions() {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.alive || isInvulnerable) continue;

    const enemyPoly = [
      [e.x, e.y],
      [e.x + ENEMY_WIDTH, e.y],
      [e.x + ENEMY_WIDTH, e.y + ENEMY_HEIGHT],
      [e.x, e.y + ENEMY_HEIGHT],
    ];
    const playerTriangle = [
      [playerX + 20, playerY],
      [playerX + 40, playerY + 40],
      [playerX,      playerY + 40],
    ];

    if (satPolygonsCollide(playerTriangle, enemyPoly)) {
      loseLife();
      resetEnemiesToTop();
      break;
    }
  }
}


/*************************************************
 *       LOSE LIFE & DEFEAT SCREEN
 *************************************************/
function loseLife() {
  lives--;  // Decrease lives count
  updateLives();  // Update heart display to match lives

  // Temporary invulnerability
  isInvulnerable = true;
  blinkPlayerThreeTimes(() => {
    isInvulnerable = false;
    playerEl.style.visibility = "visible";
  });

  if (lives <= 0) {
    showDefeatScreen();
  }
}

function showDefeatScreen() {
  // Hide game and scoreboard
  gameContainer.style.display = "none";
  scoreboard.style.display = "none";

  // Display final score
  finalScoreDisplay.textContent = `Score: ${score}`;

  // Show defeat screen
  defeatScreen.style.display = "flex";
}

/* Blink 3 times => toggles 6 times total */
function blinkPlayerThreeTimes(onComplete) {
  let toggles = 0;
  const blinkInterval = setInterval(() => {
    playerEl.style.visibility =
      (playerEl.style.visibility === "hidden") ? "visible" : "hidden";

    toggles++;
    if (toggles === 6) {
      clearInterval(blinkInterval);
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  }, 200);
}

/*************************************************
 *       SCORE, LIVES, LEVEL UPDATERS
 *************************************************/
function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function updateLives() {
  livesEl.textContent = `Lives: ${lives}`;
}

function updateLevel() {
  levelEl.textContent = `Level: ${level}`;
}

/*************************************************
 *             GAME LOOP
 *************************************************/
function gameLoop(timestamp) {
  updatePlayerPosition();
  moveEnemies();
  updatePlayerBullets();
  updateEnemyBullets(timestamp);
  updateEnemyCollisions();

  // If wave cleared => next level
  if (enemies.every(e => !e.alive)) {
    
    // Increase level count & display
    level++;
    updateLevel();

    // Increase difficulty
    enemySpeed += 0.3;
    maxEnemyBullets += 1;
    createEnemies();
  }

  // These are placed *after* the wave check to ensure
  // diving logic only runs on active enemies from the current level.
  // This prevents any diving behavior from trying to use old or empty enemy data
  maybeSendDivingEnemy();
  updateDivingEnemies();

  gameLoopId = requestAnimationFrame(gameLoop);
}

/*************************************************
 *       COLLISION FUNCTIONS (SAT & Helpers)
 *************************************************/
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(
    ax + aw < bx ||
    ax > bx + bw ||
    ay + ah < by ||
    ay > by + bh
  );
}

function satPolygonsCollide(polyA, polyB) {
  if (!boundingBoxesOverlap(polyA, polyB)) return false;
  const axes = [...getNormals(polyA), ...getNormals(polyB)];
  for (let axis of axes) {
    const [minA, maxA] = projectPolygon(polyA, axis);
    const [minB, maxB] = projectPolygon(polyB, axis);
    if (maxA < minB || maxB < minA) {
      return false; 
    }
  }
  return true;
}

function boundingBoxesOverlap(polyA, polyB) {
  let [minAx, minAy, maxAx, maxAy] = getPolyBounds(polyA);
  let [minBx, minBy, maxBx, maxBy] = getPolyBounds(polyB);
  return !(maxAx < minBx || minAx > maxBx || maxAy < minBy || minAy > maxBy);
}

function getPolyBounds(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let [px, py] of poly) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  return [minX, minY, maxX, maxY];
}

function getNormals(polygon) {
  const normals = [];
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    const edge = [p2[0] - p1[0], p2[1] - p1[1]];
    // Perp = (dy, -dx)
    normals.push([edge[1], -edge[0]]);
  }
  return normals;
}

function projectPolygon(polygon, axis) {
  let min = Infinity, max = -Infinity;
  for (let [px, py] of polygon) {
    let dot = px * axis[0] + py * axis[1];
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return [min, max];
}

/*************************************************
 *            SCORE & LIVES
 *************************************************/
function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function updateLives() {
  // Select all heart image elements inside the lives container
  const hearts = livesEl.querySelectorAll('.heart');

  // Update the number of visible hearts based on lives
  hearts.forEach((heart, index) => {
    // If the index is greater than or equal to current lives, hide the heart
    // Otherwise, show the heart
    heart.classList.toggle('hidden', index >= lives);
  });
}

/*************************************************
 *             GAME LOOP
 *************************************************/
function gameLoop(timestamp) {
  updatePlayerPosition();
  moveEnemies();
  updatePlayerBullets();
  updateEnemyBullets(timestamp);

  // If wave is cleared
  if (enemies.every(e => !e.alive)) {
    enemySpeed += 0.3; // increase difficulty
    createEnemies();
  }

  requestAnimationFrame(gameLoop);
}
