# SE1-Semester-Project

BucBattle Shooter

This is a browser-based shooter inspired by classic space shooters, built using HTML, CSS, and JavaScript. It features:

    A downward-pointing triangle player controlled via keyboard or touch.

    Enemies arranged in rows/columns that move across the screen and shoot at the player.

    Precise collision detection (using the Separating Axis Theorem) between the triangular player and rectangular enemy bullets.

    A blink-and-invulnerable mechanic whenever the player gets hit, preventing immediate consecutive hits.

Table of Contents

    Features

    Installation and Setup

    Gameplay

    Controls

    File Structure

    Customization

    License

Features

    Responsive Controls: Works on desktop (arrow keys & spacebar) and mobile (touch events).

    SAT Collision: Ensures bullet edges and triangle edges are detected correctly—no “slipping through.”

    Temporary Invulnerability: After the player is hit, the player’s triangle blinks three times and cannot be hit again during the blinking period.

    Multiple Waves: Once all enemies are destroyed, a new wave spawns with slightly increased speed.

    Scoring: Gain points by destroying enemies; losing all lives triggers game over.

Installation and Setup

    Clone or Download this repository.

    Directory Structure:

    .
    ├── index.html
    ├── css
    │   └── style.css
    └── js
        └── scripts.js

    Open index.html in your browser (e.g., Chrome, Firefox, Edge).

    Play! No additional build steps are required.

Gameplay

    Your player is the green triangle at the bottom.

    Rows of red square enemies appear at the top.

    Enemies move horizontally and occasionally shift downward, shooting orange bullets.

    You shoot yellow bullets to destroy enemies.

    Score increases by 10 points per enemy destroyed.

    Lives start at 3. If an enemy bullet hits you, you lose 1 life and blink (during which you can’t be hit again).

    When lives reach 0, a “Game Over” message appears.

Controls
Desktop

    Arrow Left / Right: Move the triangle (player) left or right.

    Spacebar: Shoot a bullet upward.

Mobile / Touch

    Touch Left: Move player left.

    Touch Right: Move player right.

    Touch Start: Also triggers a bullet shot.

    (You can drag left/right to move continuously.)

    Tip: You can refine the touch controls by adding on-screen buttons or more advanced gesture logic if desired.

File Structure

    index.html

        The main HTML document.

        Loads the stylesheet and script.

        Contains the game container (#gameContainer), the player element (#player), and the scoreboard.

    css/style.css

        Styles for the game container, player (triangle), enemies (30×30 squares), bullets, and scoreboard.

    js/scripts.js

        Contains all game logic, including:

            Player input handling (keyboard & touch).

            Enemy creation, positioning, and shooting.

            Bullet updates & collision detection (via SAT).

            Score, lives, and wave progression.

            Temporary invincibility (blinking mechanic) after being hit.

Customization

    Dimensions: Change the width/height in both index.html (canvas size) and style.css (for #gameContainer), plus adjust any references in scripts.js (like GAME_WIDTH, GAME_HEIGHT).

    Speeds: Tweak playerSpeed, enemySpeed, PLAYER_BULLET_SPEED, ENEMY_BULLET_SPEED in scripts.js to make the game faster or slower.

    Blink Duration: Adjust the blink interval or number of toggles in blinkPlayerThreeTimes() to control how long the player remains invulnerable after a hit.

    Collision Method: This code uses SAT. You could switch to simpler bounding-box or polygon–polygon checks if you prefer (less accuracy).

    Visuals: Use different colors, images, or sprites for the player, enemies, or bullets.

License

This project is provided under the MIT License. You’re free to use, modify, and distribute it. See MIT License for more details.

Enjoy customizing and improving this classic arcade-style shooter!
