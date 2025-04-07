/*************************************************
 *       START SCREEN & LEADERBOARDS LOGIC
 *************************************************/
const startScreen        = document.getElementById("startScreen");
const leaderboardsScreen = document.getElementById("leaderboardsScreen");
const btnPlay            = document.getElementById("btnPlay");
const btnLeaderboards    = document.getElementById("btnLeaderboards");
const btnBack            = document.getElementById("btnBack");

btnPlay.addEventListener("click", onPlayGame);
btnLeaderboards.addEventListener("click", onShowLeaderboards);
btnBack.addEventListener("click", onBackFromLeaderboards);

function onPlayGame() {
  // Hide start screen
  startScreen.style.display = "none";

  // Show game container & scoreboard
  gameContainer.style.display = "block";
  scoreboard.style.display = "block";

  // Initialize the game
  init();
}

function onShowLeaderboards() {
  // Hide start screen
  startScreen.style.display = "none";
  // Show leaderboards screen
  leaderboardsScreen.style.display = "flex";
}

function onBackFromLeaderboards() {
  // Hide leaderboards
  leaderboardsScreen.style.display = "none";
  // Show start screen again
  startScreen.style.display = "flex";
}


/*************************************************
 *            GAME-WIDE VARIABLES
 *************************************************/
const gameContainer = document.getElementById("gameContainer");
const playerEl      = document.getElementById("player");
const scoreEl       = document.getElementById("score");
const livesEl       = document.getElementById("lives");
const scoreboard    = document.getElementById("scoreboard");

const GAME_WIDTH  = 600;
const GAME_HEIGHT = 600;

/* Player: downward triangle ~40×40 bounding box */
let score         = 0;
let lives         = 3;
let playerX       = GAME_WIDTH / 2 - 20; 
let playerY       = GAME_HEIGHT - 60;
let playerSpeed   = 5;
let isMovingLeft  = false;
let isMovingRight = false;
let isShooting    = false;

/* 
   Flag indicating if the player is invulnerable 
   (i.e., blinking after being hit).
*/
let isInvulnerable = false;

/* Enemies & bullets arrays */
const enemies     = [];
const bullets     = [];
const enemyBullets= [];

/* Enemy config */
const ENEMY_WIDTH   = 30;
const ENEMY_HEIGHT  = 30;
const enemyRows     = 3;
const enemyCols     = 8;
const enemySpacingX = 40;
const enemySpacingY = 40;
let enemyDirection  = 1; 
let enemySpeed      = 1;

/* Bullet config */
const PLAYER_BULLET_WIDTH  = 6;
const PLAYER_BULLET_HEIGHT = 10;
const ENEMY_BULLET_WIDTH   = 6;
const ENEMY_BULLET_HEIGHT  = 10;
const PLAYER_BULLET_SPEED  = 7;
const ENEMY_BULLET_SPEED   = 4;

/*************************************************
 *                INITIALIZATION
 *************************************************/
let lastEnemyShotTime = 0;

function init() {
  resetAllGameVars();

  // Keyboard events
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // Touch events (mobile)
  gameContainer.addEventListener("touchstart", onTouchStart);
  gameContainer.addEventListener("touchend", onTouchEnd);
  gameContainer.addEventListener("touchmove", onTouchMove);

  requestAnimationFrame(gameLoop);
}

function resetAllGameVars() {
  // Clear existing arrays
  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;

  // Reset basic stats
  score = 0;
  lives = 3;
  updateScore();
  updateLives();

  // Reset player position
  playerX = GAME_WIDTH / 2 - 20;
  playerY = GAME_HEIGHT - 60;
  updatePlayerPosition();

  // Clear leftover DOM .enemy, .bullet, .enemy-bullet if any
  while (gameContainer.querySelector(".enemy")) {
    gameContainer.querySelector(".enemy").remove();
  }
  while (gameContainer.querySelector(".bullet")) {
    gameContainer.querySelector(".bullet").remove();
  }
  while (gameContainer.querySelector(".enemy-bullet")) {
    gameContainer.querySelector(".enemy-bullet").remove();
  }

  // Create new enemies
  createEnemies();

  // Reset speeds
  enemyDirection = 1;
  enemySpeed = 1;

  // Reset invulnerability
  isInvulnerable = false;
  playerEl.style.visibility = "visible";

  // Reset last shot time
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
 *          PLAYER CONTROLS - DESKTOP
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
 *          PLAYER CONTROLS - MOBILE
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
      if (enemy.alive) {
        enemy.y += 20;
      }
    });
    enemyDirection *= -1;
  }

  // Update DOM
  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    enemy.el.style.left = enemy.x + "px";
    enemy.el.style.top  = enemy.y + "px";
  });
}

/*************************************************
 *               SHOOTING
 *************************************************/
function shootBullet() {
  const bulletEl = document.createElement("div");
  bulletEl.classList.add("bullet");
  gameContainer.appendChild(bulletEl);

  // Apex of the triangle
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
 *        PLAYER BULLET UPDATES & COLLISIONS
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

    // Check collision with enemies (basic bounding box)
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (!e.alive) continue;

      if (rectsOverlap(b.x, b.y, PLAYER_BULLET_WIDTH, PLAYER_BULLET_HEIGHT,
                       e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT)) {
        // Destroy enemy
        e.alive = false;
        e.el.remove();
        // Remove bullet
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
 *          ENEMY BULLET UPDATES
 *************************************************/
function updateEnemyBullets(timestamp) {
  // Randomly have enemies shoot about every ~1 second
  const now = performance.now();
  if (now - lastEnemyShotTime > 1000) {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length > 0) {
      const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      enemyShoot(randomEnemy);
    }
    lastEnemyShotTime = now;
  }

  // Move existing bullets
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

    // If invulnerable, skip collision checks
    if (!isInvulnerable) {
      // SAT-based collision: triangle (player) vs. rectangle (bullet)
      const bulletPoly = [
        [eb.x, eb.y],
        [eb.x + ENEMY_BULLET_WIDTH, eb.y],
        [eb.x + ENEMY_BULLET_WIDTH, eb.y + ENEMY_BULLET_HEIGHT],
        [eb.x, eb.y + ENEMY_BULLET_HEIGHT]
      ];

      const playerTriangle = [
        [playerX + 20, playerY],        // apex
        [playerX + 40, playerY + 40],   // bottom-right
        [playerX,      playerY + 40]    // bottom-left
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
 *            LOSE LIFE & BLINK
 *************************************************/
function loseLife() {
  lives--;
  updateLives();

  // Make player invulnerable during blink
  isInvulnerable = true;
  blinkPlayerThreeTimes(() => {
    // Once blinking ends, remove invulnerability
    isInvulnerable = false;
    playerEl.style.visibility = "visible";
  });

  if (lives <= 0) {
    alert("Game Over! Press OK to restart.");
    resetAllGameVars();
  }
}

/* Blink 3 times => toggles 6 times total */
function blinkPlayerThreeTimes(onComplete) {
  let toggles = 0;
  const blinkInterval = setInterval(() => {
    playerEl.style.visibility =
      (playerEl.style.visibility === "hidden") ? "visible" : "hidden";

    toggles++;
    if (toggles === 6) { // 3 full on-off cycles
      clearInterval(blinkInterval);
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  }, 200);
}

/*************************************************
 *         RECTANGLE BOUNDING BOX
 *************************************************/
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(
    ax + aw < bx ||
    ax > bx + bw ||
    ay + ah < by ||
    ay > by + bh
  );
}

/*************************************************
 *       SEPARATING AXIS THEOREM (SAT)
 *************************************************/
function satPolygonsCollide(polyA, polyB) {
  if (!boundingBoxesOverlap(polyA, polyB)) return false;
  const axes = [...getNormals(polyA), ...getNormals(polyB)];
  for (let axis of axes) {
    const [minA, maxA] = projectPolygon(polyA, axis);
    const [minB, maxB] = projectPolygon(polyB, axis);
    if (maxA < minB || maxB < minA) {
      return false; // gap => no collision
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
    // perp: (dx, dy) => (dy, -dx)
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
  livesEl.textContent = `Lives: ${lives}`;
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
