/*************************************************
 *       START SCREEN & LEADERBOARDS LOGIC
 *************************************************/
const startScreen           = document.getElementById("startScreen");
const leaderboardsScreen    = document.getElementById("leaderboardsScreen");
const defeatScreen          = document.getElementById("defeatScreen");

const btnPlay               = document.getElementById("btnPlay");
const btnLeaderboards       = document.getElementById("btnLeaderboards");
const btnBack               = document.getElementById("btnBack");

const btnRestart            = document.getElementById("btnRestart");
const btnMainMenu           = document.getElementById("btnMainMenu");
const btnDefeatLeaderboards = document.getElementById("btnDefeatLeaderboards");

btnPlay.addEventListener("click", onPlayGame);
btnLeaderboards.addEventListener("click", onShowLeaderboards);
btnBack.addEventListener("click", onBackFromLeaderboards);

btnRestart.addEventListener("click", onRestartGame);
btnMainMenu.addEventListener("click", onDefeatMainMenu);
btnDefeatLeaderboards.addEventListener("click", onDefeatShowLeaderboards);

function onPlayGame() {
  startScreen.style.display   = "none";
  gameContainer.style.display = "block";
  scoreboard.style.display    = "flex";
  init();
}
function onShowLeaderboards() {
  startScreen.style.display        = "none";
  leaderboardsScreen.style.display = "flex";
}
function onBackFromLeaderboards() {
  leaderboardsScreen.style.display = "none";
  startScreen.style.display        = "flex";
}
function onRestartGame() {
  defeatScreen.style.display    = "none";
  gameContainer.style.display   = "block";
  scoreboard.style.display      = "flex";
  init();
}
function onDefeatMainMenu() {
  defeatScreen.style.display = "none";
  startScreen.style.display  = "flex";
}
function onDefeatShowLeaderboards() {
  defeatScreen.style.display    = "none";
  leaderboardsScreen.style.display = "flex";
}

/*************************************************
 *            GAME‑WIDE VARIABLES
 *************************************************/
const gameContainer      = document.getElementById("gameContainer");
const playerEl           = document.getElementById("player");
const scoreEl            = document.getElementById("score");
const livesEl            = document.getElementById("lives");
const levelEl            = document.getElementById("level");
const scoreboard         = document.getElementById("scoreboard");
const finalScoreDisplay  = document.getElementById("finalScoreDisplay");

const GAME_WIDTH  = 600;
const GAME_HEIGHT = 600;

// Game state
let level           = 1;
let score           = 0;
let lives           = 3;
let playerX         = GAME_WIDTH/2 - 20;
let playerY         = GAME_HEIGHT - 60;
let playerSpeed     = 5;
let isMovingLeft    = false;
let isMovingRight   = false;
let isShooting      = false;
let isInvulnerable  = false;

const enemies       = [];
const bullets       = [];
const enemyBullets  = [];
const divingEnemies = [];



// Kamikaze queue for level 3
let kamikazeList        = [];
let nextKamikazeIndex   = 0;
let kamikazeCooldown    = false;
let kamikazeFirstLaunch = true;

/* Enemy config */
const ENEMY_WIDTH    = 50;
const ENEMY_HEIGHT   = 50;
const enemyRows      = 3;
const enemyCols      = 8;
const enemySpacingX  = 40;
const enemySpacingY  = 40;
let enemyDirection   = 1;
let enemySpeed       = 1;
let maxEnemyBullets  = 3;

/* Bullet config */
const PLAYER_BULLET_WIDTH   = 6;
const PLAYER_BULLET_HEIGHT  = 10;
const ENEMY_BULLET_WIDTH    = 6;
const ENEMY_BULLET_HEIGHT   = 10;
const PLAYER_BULLET_SPEED   = 7;
const ENEMY_BULLET_SPEED    = 4;

// Loop control
let eventsBound       = false;
let gameLoopId        = null;
let lastEnemyShotTime = 0;
let nextFireDelay = 600 + Math.random() * 600; // 600–1200ms at start

/*************************************************
 *                INITIALIZATION
 *************************************************/
function init() {
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  resetAllGameVars();

  if (!eventsBound) {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup",   onKeyUp);
    gameContainer.addEventListener("touchstart", onTouchStart);
    gameContainer.addEventListener("touchend",   onTouchEnd);
    gameContainer.addEventListener("touchmove",  onTouchMove);
    eventsBound = true;
  }

  gameLoopId = requestAnimationFrame(gameLoop);
}

function resetAllGameVars() {
  enemies.length       = 0;
  bullets.length       = 0;
  enemyBullets.length  = 0;
  divingEnemies.length = 0;
  kamikazeList         = [];
  nextKamikazeIndex    = 0;

  level = 1; 
  score = 0;
  lives = 3;
  updateLevel();
  updateScore();
  updateLives();

  // Set maxEnemyBullets based on the level:
  if (level >= 3) {
    maxEnemyBullets = 5;
  } else if (level === 2) {
    maxEnemyBullets = 3;
  } else {
    maxEnemyBullets = 1;
  }

  playerX = GAME_WIDTH/2 - 20;
  playerY = GAME_HEIGHT - 60;
  updatePlayerPosition();

  // clear old DOM elements
  while (gameContainer.querySelector(".enemy"))      gameContainer.querySelector(".enemy").remove();
  while (gameContainer.querySelector(".bullet"))     gameContainer.querySelector(".bullet").remove();
  while (gameContainer.querySelector(".enemy-bullet")) gameContainer.querySelector(".enemy-bullet").remove();

  createEnemies();

  enemyDirection   = 1;
  enemySpeed       = 1;
  isInvulnerable   = false;
  playerEl.style.visibility = "visible";

  lastEnemyShotTime = performance.now();
}


/*************************************************
 *              CREATE ENEMIES
 *************************************************/
function createEnemies() {
  for (let row = 0; row < enemyRows; row++) {
    for (let col = 0; col < enemyCols; col++) {
      const eEl = document.createElement("div");
      const type = (level === 3 && row === 0) ? "kamikaze" : "normal";
      eEl.classList.add("enemy");
      if (type === "kamikaze") {
      eEl.classList.add("kamikaze");
      }
      const x0 = 50 + col * enemySpacingX;
      const y0 = 50 + row * enemySpacingY;
      eEl.style.left = x0 + "px";
      eEl.style.top  = y0 + "px";
      gameContainer.appendChild(eEl);
      const e = {
        el:        eEl,
        gridX:     x0,
        gridY:     y0,
        x:         x0,
        y:         y0,
        originalX: x0,
        originalY: y0,
        row, col,
        alive:     true,
        type
      };
      enemies.push(e);
    }
  }

  // Build kamikaze queue on Level 3
  if (level===3) {
    kamikazeList      = enemies.filter(e => e.type==="kamikaze");
    nextKamikazeIndex = 0;
  }
}

/*************************************************
 *          PLAYER CONTROLS (KEY & TOUCH)
 *************************************************/
function onKeyDown(e) {
  if (e.key === "ArrowLeft")  isMovingLeft  = true;
  if (e.key === "ArrowRight") isMovingRight = true;
  if ((e.key===" "||e.key==="Spacebar") && !isShooting) {
    isShooting = true;
    shootBullet();
  }
}
function onKeyUp(e) {
  if (e.key === "ArrowLeft")  isMovingLeft  = false;
  if (e.key === "ArrowRight") isMovingRight = false;
  if (e.key===" "||e.key==="Spacebar") isShooting = false;
}

function onTouchStart(e) {
  const tx = e.touches[0].clientX - gameContainer.offsetLeft;
  if (tx < GAME_WIDTH/2) isMovingLeft  = true;
  else                   isMovingRight = true;
  if (!isShooting) {
    isShooting = true;
    shootBullet();
  }
}
function onTouchEnd() {
  isMovingLeft = false;
  isMovingRight= false;
  isShooting   = false;
}
function onTouchMove(e) {
  e.preventDefault();
  const tx = e.touches[0].clientX - gameContainer.offsetLeft;
  playerX = Math.max(0, Math.min(GAME_WIDTH-40, tx-20));
  updatePlayerPosition();
}

/*************************************************
 *        PLAYER & ENEMY MOVEMENT
 *************************************************/
function updatePlayerPosition() {
  if (isMovingLeft)  playerX = Math.max(0, playerX - playerSpeed);
  if (isMovingRight) playerX = Math.min(GAME_WIDTH-40, playerX + playerSpeed);
  playerEl.style.left = playerX + "px";
  playerEl.style.top  = playerY + "px";
}

function moveEnemies() {
  // 1) advance grid positions
  let shiftDown = false;
  enemies.forEach(e => {
    if (!e.alive) return;

    e.gridX += enemyDirection * enemySpeed;

    if (e.gridX < 0 || e.gridX + ENEMY_WIDTH > GAME_WIDTH) {
      shiftDown = true;
    }
  });

  // 2) shift down if needed — BUT NOT ON LEVEL 1
  if (shiftDown) {
    if (level !== 1) {
      enemies.forEach(e => {
        if (!e.alive) return;
        e.gridY += 20;
      });
    }
    enemyDirection *= -1;
  }

  // 3) sync display from grid (skip diving)
  enemies.forEach(e => {
    if (!e.alive) return;
    const diving = divingEnemies.some(d => d.enemy === e);
    if (!diving) {
      e.x = e.gridX;
      e.y = e.gridY;
      e.el.style.left = e.x + "px";
      e.el.style.top  = e.y + "px";
    }
  });
}



/*************************************************
 *       LAUNCH & UPDATE DIVING ENEMIES
 *************************************************/
function launchSingleKamikaze() {
  if (nextKamikazeIndex < kamikazeList.length) {
    const e = kamikazeList[nextKamikazeIndex++];
    divingEnemies.push({
      enemy: e,
      x:     e.gridX,
      y:     e.gridY,
      angle: 0
    });
  }
}

function updateDivingEnemies() {
  for (let i = divingEnemies.length - 1; i >= 0; i--) {
    const d = divingEnemies[i];
    d.angle += 0.1;
    d.y     += 2;
    d.x     += Math.sin(d.angle) * 3;

    // update display and collision coords
    d.enemy.el.style.left = d.x + "px";
    d.enemy.el.style.top  = d.y + "px";
    d.enemy.x = d.x;
    d.enemy.y = d.y;

    // when off screen, snap back to grid
    if (d.y > GAME_HEIGHT) {
      d.enemy.x = d.enemy.gridX;
      d.enemy.y = d.enemy.gridY;
      d.enemy.el.style.left = d.enemy.gridX + "px";
      d.enemy.el.style.top  = d.enemy.gridY + "px";
      divingEnemies.splice(i, 1);
    }
  }
}

/*************************************************
 *               SHOOTING
 *************************************************/
function shootBullet() {
  const bEl = document.createElement("div");
  bEl.classList.add("bullet");
  gameContainer.appendChild(bEl);
  const bx = playerX + 20 - PLAYER_BULLET_WIDTH/2;
  bullets.push({ el: bEl, x: bx, y: playerY });
}

function enemyShoot(e) {
  if (e.type === "kamikaze") return; 

  if (enemyBullets.length >= maxEnemyBullets) return;

  const bEl = document.createElement("div");
  bEl.classList.add("enemy-bullet");
  gameContainer.appendChild(bEl);
  const bx = e.x + ENEMY_WIDTH/2 - ENEMY_BULLET_WIDTH/2;
  enemyBullets.push({ el: bEl, x: bx, y: e.y + ENEMY_HEIGHT });
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
    if (b.y < -PLAYER_BULLET_HEIGHT) {
      b.el.remove(); bullets.splice(i,1); continue;
    }
    for (let e of enemies) {
      if (!e.alive) continue;
      if (rectsOverlap(
            b.x,b.y,PLAYER_BULLET_WIDTH,PLAYER_BULLET_HEIGHT,
            e.x,e.y,ENEMY_WIDTH,ENEMY_HEIGHT
          )) {
        e.alive = false; e.el.remove();
        b.el.remove(); bullets.splice(i,1);
        score += 10; updateScore();
        break;
      }
    }
  }
}

/*************************************************
 *   ENEMY BULLETS & COLLISIONS
 *************************************************/
function updateEnemyBullets(timestamp) {
  const now = performance.now();

  if (enemyBullets.length < maxEnemyBullets && now - lastEnemyShotTime > nextFireDelay) {
    const shooters = enemies.filter(e => e.alive && e.type !== "kamikaze");

    if (shooters.length) {
      const bulletsToFire = Math.min(maxEnemyBullets - enemyBullets.length, Math.floor(Math.random() * 2) + 1); 
      for (let i = 0; i < bulletsToFire; i++) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        enemyShoot(shooter);
      }
    }

    lastEnemyShotTime = now;
    nextFireDelay = 600 + Math.random() * 600; // new random delay after firing
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.y += ENEMY_BULLET_SPEED;
    eb.el.style.left = eb.x + "px";
    eb.el.style.top = eb.y + "px";
    if (eb.y > GAME_HEIGHT + ENEMY_BULLET_HEIGHT) {
      eb.el.remove();
      enemyBullets.splice(i, 1);
      continue;
    }
    if (!isInvulnerable) {
      const bulletPoly = [
        [eb.x, eb.y],
        [eb.x + ENEMY_BULLET_WIDTH, eb.y],
        [eb.x + ENEMY_BULLET_WIDTH, eb.y + ENEMY_BULLET_HEIGHT],
        [eb.x, eb.y + ENEMY_BULLET_HEIGHT]
      ];
      const tri = [
        [playerX + 20, playerY],
        [playerX + 40, playerY + 40],
        [playerX, playerY + 40]
      ];
      if (satPolygonsCollide(tri, bulletPoly)) {
        loseLife();
        eb.el.remove();
        enemyBullets.splice(i, 1);
      }
    }
  }
}



/*************************************************
 *       ENEMY COLLISIONS (INCLUDING Kamikaze)
 *************************************************/
function updateEnemyCollisions() {
  for (let e of enemies) {
    if (!e.alive || isInvulnerable) continue;
    const polyB = [
      [e.x,        e.y],
      [e.x+ENEMY_WIDTH, e.y],
      [e.x+ENEMY_WIDTH, e.y+ENEMY_HEIGHT],
      [e.x,        e.y+ENEMY_HEIGHT]
    ];
    const tri = [
      [playerX+20, playerY],
      [playerX+40, playerY+40],
      [playerX,    playerY+40]
    ];
    if (satPolygonsCollide(tri, polyB)) {
      e.alive = false; e.el.remove();
      resetEnemiesToTop();
      loseLife();
      break;
    }
  }
}

/*************************************************
 *          RESET ENEMIES TO THEIR CURRENT GRID
 *************************************************/
function resetEnemiesToTop() {
  enemies.forEach(e => {
    if (!e.alive) return;
    e.x = e.gridX;
    e.y = e.gridY;
    e.el.style.left = e.x + "px";
    e.el.style.top  = e.y + "px";
  });
  divingEnemies.length = 0;
  enemyBullets.forEach(b => b.el.remove());
  enemyBullets.length = 0;
}

/*************************************************
 *       LOSE LIFE & DEFEAT SCREEN
 *************************************************/
function loseLife() {
  lives--; updateLives();
  isInvulnerable = true;
  blinkPlayerThreeTimes(() => {
    isInvulnerable = false;
    playerEl.style.visibility = "visible";
  });
  if (lives <= 0) showDefeatScreen();
}

function showDefeatScreen() {
  gameContainer.style.display = "none";
  scoreboard.style.display   = "none";
  finalScoreDisplay.textContent = `Score: ${score}`;
  defeatScreen.style.display = "flex";
}

function blinkPlayerThreeTimes(cb) {
  let t = 0;
  const iv = setInterval(() => {
    playerEl.style.visibility = 
      (playerEl.style.visibility==="hidden") ? "visible" : "hidden";
    if (++t === 6) {
      clearInterval(iv);
      if (cb) cb();
    }
  }, 200);
}

/*************************************************
 *      SCORE, LIVES, LEVEL UPDATERS
 *************************************************/
function updateScore() { scoreEl.textContent = `Score: ${score}`; }
function updateLives() { livesEl.textContent = `Lives: ${lives}`; }
function updateLevel() { levelEl.textContent = `Level: ${level}`; }

/*************************************************
 *             GAME LOOP
 *************************************************/
function gameLoop(timestamp) {
  updatePlayerPosition();
  moveEnemies();
  updatePlayerBullets();
  updateEnemyBullets(timestamp);
  updateEnemyCollisions();

  // wave clear → next level
  if (enemies.every(e=>!e.alive)) {
    level++; updateLevel();
    enemySpeed += 0.3;
    // Set enemy missile capacity based on level
    if (level >= 3) {
      maxEnemyBullets = 5;
    } else if (level === 2) {
  maxEnemyBullets = 3;
    } else {
      maxEnemyBullets = 1;
    }
    createEnemies();
  }

  // Level 3: if no dive in progress, launch next kamikaze
  if (level===3 && divingEnemies.length===0 && nextKamikazeIndex<kamikazeList.length) {
    if (kamikazeFirstLaunch) {
      // Launch the first kamikaze immediately
      launchSingleKamikaze();
      kamikazeFirstLaunch = false;
    } else if (!kamikazeCooldown) {
      kamikazeCooldown = true;
      setTimeout(() => {
        launchSingleKamikaze();
        kamikazeCooldown = false;
      }, 3000); // Delay every subsequent launch
    }
  }

  updateDivingEnemies();

  gameLoopId = requestAnimationFrame(gameLoop);
}

/*************************************************
 *       COLLISION FUNCTIONS (SAT & BBOX)
 *************************************************/
function rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh){
  return !(ax+aw<bx||ax>bx+bw||ay+ah<by||ay>by+bh);
}
function satPolygonsCollide(polyA,polyB){
  if(!boundingBoxesOverlap(polyA,polyB))return false;
  const axes = [...getNormals(polyA), ...getNormals(polyB)];
  for(const axis of axes){
    const [minA,maxA] = projectPolygon(polyA,axis);
    const [minB,maxB] = projectPolygon(polyB,axis);
    if(maxA<minB||maxB<minA) return false;
  }
  return true;
}
function boundingBoxesOverlap(a,b){
  const [minAx,minAy,maxAx,maxAy] = getPolyBounds(a);
  const [minBx,minBy,maxBx,maxBy] = getPolyBounds(b);
  return !(maxAx<minBx||minAx>maxBx||maxAy<minBy||minAy>maxBy);
}
function getPolyBounds(poly){
  let [minX,minY,maxX,maxY] = [Infinity,Infinity,-Infinity,-Infinity];
  for(const [px,py] of poly){
    minX=Math.min(minX,px); minY=Math.min(minY,py);
    maxX=Math.max(maxX,px); maxY=Math.max(maxY,py);
  }
  return [minX,minY,maxX,maxY];
}
function getNormals(polygon){
  const normals=[];
  for(let i=0;i<polygon.length;i++){
    const [x1,y1]=polygon[i], [x2,y2]=polygon[(i+1)%polygon.length];
    const edge=[x2-x1,y2-y1];
    normals.push([edge[1],-edge[0]]);
  }
  return normals;
}
function projectPolygon(poly,axis){
  let [min,max] = [Infinity,-Infinity];
  for(const [px,py] of poly){
    const dot = px*axis[0] + py*axis[1];
    min = Math.min(min,dot); max = Math.max(max,dot);
  }
  return [min,max];
}
