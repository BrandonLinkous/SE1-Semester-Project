/*************************************************
 *            GAME-WIDE VARIABLES
 *************************************************/
const gameContainer = document.getElementById("gameContainer");
const playerEl = document.getElementById("player");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

const GAME_WIDTH = 600;
const GAME_HEIGHT = 600;

/* Player: downward triangle ~40px wide, 40px tall. */
let score = 0;
let lives = 3;
let playerX = GAME_WIDTH / 2 - 20;  // Horizontal center for the 40px base
let playerY = GAME_HEIGHT - 60;     // Slightly above bottom
let playerSpeed = 5;
let isMovingLeft = false;
let isMovingRight = false;
let isShooting = false;

/* 
   Flag indicating whether the player is currently invulnerable
   (i.e., blinking and can't be hit again). 
*/
let isInvulnerable = false;

/* Enemies & bullets */
const enemies = [];      // { el, x, y, alive }
const bullets = [];      // player bullets: { el, x, y }
const enemyBullets = []; // enemy bullets:  { el, x, y }

/* Enemy config */
const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 30;
const enemyRows = 3;
const enemyCols = 8;
const enemySpacingX = 40;
const enemySpacingY = 40;
let enemyDirection = 1; // 1 = right, -1 = left
let enemySpeed = 1;     // Increase per wave if desired

/* Bullet sizes & speeds */
const PLAYER_BULLET_WIDTH = 6;
const PLAYER_BULLET_HEIGHT = 10;
const ENEMY_BULLET_WIDTH = 6;
const ENEMY_BULLET_HEIGHT = 10;
const PLAYER_BULLET_SPEED = 7;
const ENEMY_BULLET_SPEED = 4;

/*************************************************
 *                INITIALIZATION
 *************************************************/
function init() {
  createEnemies();
  updateScore();
  updateLives();
  updatePlayerPosition();

  // Keyboard events
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // Touch events (mobile)
  gameContainer.addEventListener("touchstart", onTouchStart);
  gameContainer.addEventListener("touchend", onTouchEnd);
  gameContainer.addEventListener("touchmove", onTouchMove);

  // Start the loop
  requestAnimationFrame(gameLoop);
}

window.onload = init;

/*************************************************
 *              CREATE ENEMIES
 *************************************************/
function createEnemies() {
  // Clear old
  enemies.forEach(e => e.el.remove());
  enemies.length = 0;

  for (let row = 0; row < enemyRows; row++) {
    for (let col = 0; col < enemyCols; col++) {
      const enemyEl = document.createElement("div");
      enemyEl.classList.add("enemy");

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
  // Move the triangle's center to the touch:
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
  playerEl.style.top = playerY + "px";
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
    enemy.el.style.top = enemy.y + "px";
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

  // Fire from enemy bottom center
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
    b.el.style.top = b.y + "px";

    // Off-screen
    if (b.y < -PLAYER_BULLET_HEIGHT) {
      b.el.remove();
      bullets.splice(i, 1);
      continue;
    }

    // Check collision with enemies (basic box check)
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (!e.alive) continue;

      if (rectsOverlap(
        b.x, b.y, PLAYER_BULLET_WIDTH, PLAYER_BULLET_HEIGHT,
        e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT
      )) {
        // Hit an enemy
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
 *          ENEMY BULLET UPDATES
 *************************************************/
function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.y += ENEMY_BULLET_SPEED;
    eb.el.style.left = eb.x + "px";
    eb.el.style.top = eb.y + "px";

    // Off-screen
    if (eb.y > GAME_HEIGHT + ENEMY_BULLET_HEIGHT) {
      eb.el.remove();
      enemyBullets.splice(i, 1);
      continue;
    }

    // If we're currently invulnerable, skip collision checks
    if (isInvulnerable) {
      continue;
    }

    // Tri-rect collision using SAT approach
    const bulletPoly = [
      [eb.x, eb.y],
      [eb.x + ENEMY_BULLET_WIDTH, eb.y],
      [eb.x + ENEMY_BULLET_WIDTH, eb.y + ENEMY_BULLET_HEIGHT],
      [eb.x, eb.y + ENEMY_BULLET_HEIGHT],
    ];

    const playerTriangle = [
      [playerX + 20, playerY],        // apex
      [playerX + 40, playerY + 40],   // bottom-right
      [playerX, playerY + 40]         // bottom-left
    ];

    if (satPolygonsCollide(playerTriangle, bulletPoly)) {
      loseLife();
      eb.el.remove();
      enemyBullets.splice(i, 1);
    }
  }
}

/*************************************************
 *           LOSE LIFE + INVULNERABILITY
 *************************************************/
function loseLife() {
  lives--;
  updateLives();

  // Make player invulnerable during blink
  isInvulnerable = true;
  blinkPlayerThreeTimes(() => {
    // Once blinking is done, we remove invulnerability
    isInvulnerable = false;

    // Ensure the player is visible again
    playerEl.style.visibility = "visible";
  });

  if (lives <= 0) {
    alert("Game Over! Press OK to restart.");
    resetGame();
  }
}

/* 
  blinkPlayerThreeTimes(onComplete):
  Toggles the player's visibility 6 times
  (on->off->on->off->on->off->on = 3 full blinks).
  The optional callback is triggered after blinking finishes.
*/
function blinkPlayerThreeTimes(onComplete) {
  let toggles = 0;
  const blinkInterval = setInterval(() => {
    // Toggle visibility
    playerEl.style.visibility =
      (playerEl.style.visibility === "hidden") ? "visible" : "hidden";

    toggles++;
    // Once we've toggled 6 times, stop
    if (toggles === 6) {
      clearInterval(blinkInterval);

      // If there's a callback, call it
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  }, 200);
}

/*************************************************
 *         RECTANGLE OVERLAP (for bullets->enemies)
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
 *  For any two convex polygons.
 *************************************************/
function satPolygonsCollide(polyA, polyB) {
  if (!boundingBoxesOverlap(polyA, polyB)) return false;
  const axes = [...getNormals(polyA), ...getNormals(polyB)];
  for (let axis of axes) {
    const [minA, maxA] = projectPolygon(polyA, axis);
    const [minB, maxB] = projectPolygon(polyB, axis);
    if (maxA < minB || maxB < minA) {
      return false; // gap found => no collision
    }
  }
  return true;
}

/*************************************************
 *   POLYGON BOUNDING BOX + OVERLAP
 *************************************************/
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

/*************************************************
 *   GET NORMALS (PERPENDICULAR VECTORS) OF EDGES
 *************************************************/
function getNormals(polygon) {
  const normals = [];
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    const edge = [p2[0] - p1[0], p2[1] - p1[1]];
    // Perp: (dx, dy) => (dy, -dx)
    normals.push([edge[1], -edge[0]]);
  }
  return normals;
}

/*************************************************
 *   PROJECT POLYGON ONTO AN AXIS -> [MIN,MAX]
 *************************************************/
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

function resetGame() {
  score = 0;
  lives = 3;
  updateScore();
  updateLives();

  // Remove bullets
  bullets.forEach(b => b.el.remove());
  enemyBullets.forEach(eb => eb.el.remove());
  bullets.length = 0;
  enemyBullets.length = 0;

  // Reset enemies
  createEnemies();

  // Reset player
  playerX = GAME_WIDTH / 2 - 20;
  playerY = GAME_HEIGHT - 60;
  updatePlayerPosition();

  // Cancel invulnerability if needed
  isInvulnerable = false;
  playerEl.style.visibility = "visible";

  // Optionally reset speeds
  enemySpeed = 1;
  enemyDirection = 1;
}

/*************************************************
 *             GAME LOOP
 *************************************************/
let lastEnemyShotTime = 0;
function gameLoop(timestamp) {
  updatePlayerPosition();
  moveEnemies();
  updatePlayerBullets();
  updateEnemyBullets();

  // Random enemy fires ~1 per second
  if (timestamp - lastEnemyShotTime > 1000) {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length > 0) {
      const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      enemyShoot(randomEnemy);
    }
    lastEnemyShotTime = timestamp;
  }

  // If wave is cleared
  if (enemies.every(e => !e.alive)) {
    enemySpeed += 0.3; // ramp difficulty
    createEnemies();
  }

  requestAnimationFrame(gameLoop);
}
