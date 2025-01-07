// Game constants - define these first
const PLAYER_SPEED = 3;
const BULLET_SPEED = 7;
const ENEMY_BASE_SPEED = 2;
const ENEMY_BULLET_SPEED = 5;
const ENEMY_SHOOT_COOLDOWN = 1000; // 1 second in milliseconds
const ENEMY_SHOOT_CHANCE = 0.02;   // 2% chance to shoot
const COIN_SPEED = 3;
const COIN_SIZE = 10;
const COIN_DROP_CHANCE = 0.5; // 50% chance
const COIN_VALUE = 50; // Points per coin
const SHOP_BUTTON_WIDTH = 300;
const SHOP_BUTTON_HEIGHT = 50;
const SHOP_BUTTON_SPACING = 70;
const SPEED_UPGRADE_COST = 3;
const FIRE_RATE_UPGRADE_COST = 4;
const SPEED_UPGRADE_AMOUNT = 1;
const FIRE_RATE_REDUCTION = 100; // Reduces cooldown by 50ms
const DEV_MODE = true; // Set to false before release
const GOD_MODE = true; // Set to true for invulnerability

// Add constant for level when blue enemies start appearing
const BLUE_ENEMIES_START_LEVEL = 8;

// Add these with other game constants at the top
const MAX_SPEED_LEVEL = 3;
const MAX_FIRE_RATE_LEVEL = 8;

// Add these constants at the top
const GREEN_ENEMIES_START_LEVEL = 15;
const SPREAD_BULLET_ANGLE = Math.PI/6; // 30 degrees in radians

// Add these constants
const FINAL_LEVEL = 21;
let gameWon = false;

// Add these constants/variables at the top
const STARTING_LIVES = 3;
let lives = STARTING_LIVES;
let currentLevelAttempts = 0;
const MAX_LEVEL_ATTEMPTS = 3;

// Canvas setup
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Game variables
const player = {
    x: canvas.width/2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 30,
    speed: PLAYER_SPEED
};

// Rest of your game variables
const bullets = [];
const enemyBullets = [];
const enemies = [];
let gameOver = false;
let score = 0;
let lastShot = Date.now();
const BASE_SHOOT_COOLDOWN = 1000; // Changed from 250 to 500 (half second)
let shootCooldown = BASE_SHOOT_COOLDOWN;
let enemyShootChance = 0.02;
let level = 1;
let isPaused = false;
let continueButtonVisible = false;
const keys = {
    left: false,
    right: false,
    shoot: false
};
let animationFrameId = null;
const coins = [];
let coinsCollected = 0;
let playerSpeedLevel = 0;
let fireRateLevel = 0;

// Add shop button definitions
const shopButtons = [
    {
        text: 'Speed +1 (100 coins)',
        cost: SPEED_UPGRADE_COST,
        action: () => {
            if(coinsCollected >= SPEED_UPGRADE_COST && playerSpeedLevel < MAX_SPEED_LEVEL) {
                coinsCollected -= SPEED_UPGRADE_COST;
                player.speed += SPEED_UPGRADE_AMOUNT;
                playerSpeedLevel++;
                updateShopButtons();
            }
        }
    },
    {
        text: 'Fire Rate +1 (150 coins)',
        cost: FIRE_RATE_UPGRADE_COST,
        action: () => {
            if(coinsCollected >= FIRE_RATE_UPGRADE_COST && fireRateLevel < MAX_FIRE_RATE_LEVEL) {
                coinsCollected -= FIRE_RATE_UPGRADE_COST;
                shootCooldown = Math.max(100, shootCooldown - FIRE_RATE_REDUCTION);
                fireRateLevel++;
                updateShopButtons();
            }
        }
    }
];

// Add function to update shop button text
function updateShopButtons() {
    const speedMaxed = playerSpeedLevel >= MAX_SPEED_LEVEL;
    const fireRateMaxed = fireRateLevel >= MAX_FIRE_RATE_LEVEL;

    shopButtons[0].text = speedMaxed ? 
        `Movement Speed [MAX ${playerSpeedLevel}/${MAX_SPEED_LEVEL}]` : 
        `Movement Speed [${playerSpeedLevel}/${MAX_SPEED_LEVEL}] - ${SPEED_UPGRADE_COST} coins`;

    shopButtons[1].text = fireRateMaxed ? 
        `Fire Rate [MAX ${fireRateLevel}/${MAX_FIRE_RATE_LEVEL}]` : 
        `Fire Rate [${fireRateLevel}/${MAX_FIRE_RATE_LEVEL}] - ${FIRE_RATE_UPGRADE_COST} coins`;
}

// Add function to create enemies for current level
function createEnemiesForLevel() {
    if(level < BLUE_ENEMIES_START_LEVEL) {
        // Yellow enemies only
        for(let i = 0; i < level; i++) {
            enemies.push({
                x: (canvas.width/(level + 1)) * (i + 1) - 20,
                y: 30,
                width: 40,
                height: 30,
                direction: 1,
                lastShot: Date.now(),
                color: 'yellow',
                health: 1
            });
        }
    } else if(level < GREEN_ENEMIES_START_LEVEL) {
        // Yellow and blue enemies
        for(let i = 0; i < 7; i++) {
            enemies.push({
                x: (canvas.width/8) * (i + 1) - 20,
                y: 70,
                width: 40,
                height: 30,
                direction: 1,
                lastShot: Date.now(),
                color: 'yellow',
                health: 1
            });
        }
        
        const blueEnemyCount = level - 7;
        for(let i = 0; i < blueEnemyCount; i++) {
            enemies.push({
                x: (canvas.width/(blueEnemyCount + 1)) * (i + 1) - 20,
                y: 30,
                width: 40,
                height: 30,
                direction: 1,
                lastShot: Date.now(),
                color: 'blue',
                health: 2
            });
        }
    } else {
        // Yellow, blue, and green enemies
        for(let i = 0; i < 7; i++) {
            enemies.push({
                x: (canvas.width/8) * (i + 1) - 20,
                y: 110, // Moved down to make room for green enemies
                width: 40,
                height: 30,
                direction: 1,
                lastShot: Date.now(),
                color: 'yellow',
                health: 1
            });
        }
        
        const blueEnemyCount = 7;
        for(let i = 0; i < blueEnemyCount; i++) {
            enemies.push({
                x: (canvas.width/8) * (i + 1) - 20,
                y: 70,
                width: 40,
                height: 30,
                direction: 1,
                lastShot: Date.now(),
                color: 'blue',
                health: 2
            });
        }

        const greenEnemyCount = level - 14;
        for(let i = 0; i < greenEnemyCount; i++) {
            enemies.push({
                x: (canvas.width/(greenEnemyCount + 1)) * (i + 1) - 20,
                y: 30,
                width: 40,
                height: 30,
                direction: 1,
                lastShot: Date.now(),
                color: 'green',
                health: 3
            });
        }
    }
}

// Add function to draw continue button
function drawContinueButton() {
    // Level complete and stats
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Level ${level} Complete!`, canvas.width/2 - 80, 100);
    ctx.fillText(`Score: ${score}`, canvas.width/2 - 80, 140);
    ctx.fillText(`Coins: ${coinsCollected}`, canvas.width/2 - 80, 180);

    // Shop title
    ctx.font = '30px Arial';
    ctx.fillText('SHOP', canvas.width/2 - 40, 240);

    // Draw shop buttons
    shopButtons.forEach((button, index) => {
        const y = 280 + (SHOP_BUTTON_HEIGHT + 20) * index;
        
        // Determine button color
        let buttonColor = 'gray';
        if ((index === 0 && playerSpeedLevel >= MAX_SPEED_LEVEL) || 
            (index === 1 && fireRateLevel >= MAX_FIRE_RATE_LEVEL)) {
            buttonColor = '#444444'; // Darker gray for maxed
        } else if (coinsCollected >= button.cost) {
            buttonColor = 'white'; // White for affordable
        }
        
        // Draw button background
        ctx.fillStyle = buttonColor;
        ctx.fillRect(canvas.width/2 - SHOP_BUTTON_WIDTH/2, y, SHOP_BUTTON_WIDTH, SHOP_BUTTON_HEIGHT);
        
        // Draw button text
        ctx.fillStyle = 'black';
        ctx.font = '18px Arial'; // Slightly larger font
        
        // Center text horizontally and vertically
        const textWidth = ctx.measureText(button.text).width;
        const textX = canvas.width/2 - textWidth/2;
        const textY = y + SHOP_BUTTON_HEIGHT/2 + 6; // +6 for vertical centering
        
        ctx.fillText(button.text, textX, textY);
    });

    // Continue button
    ctx.fillStyle = 'white';
    ctx.fillRect(canvas.width/2 - 60, canvas.height - 100, 120, 40);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Continue', canvas.width/2 - 40, canvas.height - 73);

    // Dev buttons (if DEV_MODE is true)
    if(DEV_MODE) {
        // Skip level button
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 100, 30);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText('Skip Level', 25, 30);

        // Add coin button
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 50, 100, 30);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText('Add Coin', 25, 70);
    }
}

// Add skip level function
function skipLevel() {
    enemies.length = 0; // Clear all enemies
    isPaused = true;
    continueButtonVisible = true;
}

// Add coin function
function addDevCoin() {
    coinsCollected++;
    console.log('Dev coin added. Total coins:', coinsCollected);
    updateShopButtons(); // Update shop if open
}

// Add click handler for continue button
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Dev buttons check
    if(DEV_MODE) {
        // Skip level button
        if(x >= 10 && x <= 110 && y >= 10 && y <= 40) {
            skipLevel();
            return;
        }
        // Add coin button
        if(x >= 10 && x <= 110 && y >= 50 && y <= 80) {
            addDevCoin();
            return;
        }
    }

    if(continueButtonVisible) {
        // Shop button checks
        shopButtons.forEach((button, index) => {
            const buttonY = 280 + (SHOP_BUTTON_HEIGHT + 20) * index;
            if(x > canvas.width/2 - SHOP_BUTTON_WIDTH/2 && 
               x < canvas.width/2 + SHOP_BUTTON_WIDTH/2 &&
               y > buttonY && 
               y < buttonY + SHOP_BUTTON_HEIGHT) {
                button.action();
            }
        });

        // Continue button check
        if(x > canvas.width/2 - 60 && x < canvas.width/2 + 60 &&
           y > canvas.height - 100 && y < canvas.height - 60) {
            console.log(`Starting level ${level + 1} with score ${score}`);
            level++;
            isPaused = false;
            continueButtonVisible = false;
            enemyBullets.length = 0;
            bullets.length = 0;
            createEnemiesForLevel();
            if(animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
});

// Event listeners
document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft') {
        keys.left = true;
    }
    if(e.key === 'ArrowRight') {
        keys.right = true;
    }
    if(e.key === 'Space' || e.key === ' ') {
        keys.shoot = true;
        if(continueButtonVisible) {
            console.log(`Spacebar pressed - Starting level ${level + 1} with score ${score}`);
            level++;
            isPaused = false;
            continueButtonVisible = false;
            enemyBullets.length = 0;
            bullets.length = 0;
            createEnemiesForLevel();
            if(animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if(e.key === 'ArrowLeft') {
        keys.left = false;
    }
    if(e.key === 'ArrowRight') {
        keys.right = false;
    }
    if(e.key === 'Space' || e.key === ' ') {
        keys.shoot = false;
    }
});

function drawPlayer() {
    ctx.fillStyle = 'green';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawEnemies() {
    enemies.forEach(enemy => {
        // Flash white when hit, otherwise use normal color
        ctx.fillStyle = enemy.hit ? 'white' : enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw health bar for blue enemies
        if(enemy.color === 'blue' && enemy.health < 2) {
            // Red background for health bar
            ctx.fillStyle = 'red';
            ctx.fillRect(enemy.x, enemy.y - 5, enemy.width, 3);
            
            // Green health remaining
            ctx.fillStyle = 'green';
            const healthWidth = (enemy.health / 2) * enemy.width;
            ctx.fillRect(enemy.x, enemy.y - 5, healthWidth, 3);
        }
    });
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = 'white';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function updateBullets() {
    for(let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if(bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    let touchedEdge = false;
    
    enemies.forEach(enemy => {
        enemy.x += enemy.direction * ENEMY_BASE_SPEED;
        if(enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            touchedEdge = true;
        }
    });

    if(touchedEdge) {
        enemies.forEach(enemy => {
            enemy.direction *= -1;
            enemy.y += 20;
        });
    }
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        if(bullet.color) {
            ctx.fillStyle = bullet.color;
        } else if(bullet.horizontalSpeed) {
            ctx.fillStyle = 'lightblue';
        } else {
            ctx.fillStyle = 'red';
        }
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function updateEnemyBullets() {
    // Move existing bullets
    for(let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        // Apply both vertical and horizontal movement if angles exist
        if(bullet.angle !== undefined) {
            bullet.x += Math.sin(bullet.angle) * ENEMY_BULLET_SPEED;
            bullet.y += Math.cos(bullet.angle) * ENEMY_BULLET_SPEED;
        } else {
            bullet.y += ENEMY_BULLET_SPEED;
            if(bullet.horizontalSpeed) {
                bullet.x += bullet.horizontalSpeed;
            }
        }
        
        // Remove bullets that go off screen
        if(bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
    
    // Enemy shooting with individual cooldowns
    const currentTime = Date.now();
    enemies.forEach(enemy => {
        if(currentTime - enemy.lastShot > ENEMY_SHOOT_COOLDOWN) {
            if(Math.random() < ENEMY_SHOOT_CHANCE) {
                if(enemy.color === 'green') {
                    // Create three bullets for green enemies
                    [0, SPREAD_BULLET_ANGLE, -SPREAD_BULLET_ANGLE].forEach(angle => {
                        enemyBullets.push({
                            x: enemy.x + enemy.width/2,
                            y: enemy.y + enemy.height,
                            width: 3,
                            height: 15,
                            angle: angle,
                            color: 'lightgreen'
                        });
                    });
                } else {
                    // Normal bullet creation for other enemies
                    const bullet = {
                        x: enemy.x + enemy.width/2,
                        y: enemy.y + enemy.height,
                        width: 3,
                        height: 15
                    };

                    if(enemy.color === 'blue') {
                        bullet.horizontalSpeed = enemy.direction * ENEMY_BASE_SPEED;
                    }

                    enemyBullets.push(bullet);
                }
                enemy.lastShot = currentTime;
            }
        }
    });
}

function drawCoins() {
    ctx.fillStyle = 'lightblue';
    coins.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateCoins() {
    for(let i = coins.length - 1; i >= 0; i--) {
        coins[i].y += COIN_SPEED;
        
        // Check if coin is collected by player
        if(coins[i].y + coins[i].size > player.y && 
           coins[i].y - coins[i].size < player.y + player.height &&
           coins[i].x + coins[i].size > player.x && 
           coins[i].x - coins[i].size < player.x + player.width) {
            score += COIN_VALUE;
            coinsCollected++; // Increment coin counter
            coins.splice(i, 1);
            continue;
        }
        
        // Remove coins that go off screen
        if(coins[i].y - coins[i].size > canvas.height) {
            coins.splice(i, 1);
        }
    }
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if(bullet.x < enemy.x + enemy.width &&
               bullet.x + bullet.width > enemy.x &&
               bullet.y < enemy.y + enemy.height &&
               bullet.y + bullet.height > enemy.y) {
                // Remove the bullet
                bullets.splice(bulletIndex, 1);
                
                // Reduce enemy health
                enemy.health--;
                
                // If enemy health reaches 0, destroy it
                if(enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    score += 10;
                    
                    // Add chance to drop coin
                    if(Math.random() < COIN_DROP_CHANCE) {
                        coins.push({
                            x: enemy.x + enemy.width/2,
                            y: enemy.y + enemy.height/2,
                            size: COIN_SIZE
                        });
                    }
                } else {
                    // Flash the enemy white when hit but not destroyed
                    enemy.hit = true;
                    setTimeout(() => {
                        if(enemy && enemies.includes(enemy)) {
                            enemy.hit = false;
                        }
                    }, 100);
                }
            }
        });
    });

    // Check if enemy bullets hit player
    for(let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if(bullet.x < player.x + player.width &&
           bullet.x + bullet.width > player.x &&
           bullet.y < player.y + player.height &&
           bullet.y + bullet.height > player.y) {
            handlePlayerHit();
        }
    }

    // Check player collision with enemies
    enemies.forEach(enemy => {
        if(enemy.x < player.x + player.width &&
           enemy.x + enemy.width > player.x &&
           enemy.y < player.y + player.height &&
           enemy.y + enemy.height > player.y) {
            handlePlayerHit();
        }
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Level: ${level}    Score: ${score}    Coins: ${coinsCollected}    Lives: ${lives}`, 10, 30);
    
    // Show god mode indicator if active
    if(GOD_MODE) {
        ctx.fillStyle = 'gold';
        ctx.fillText('GOD MODE', canvas.width - 100, 30);
    }
}

function updatePlayer() {
    if(keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if(keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

function updateShooting() {
    const currentTime = Date.now();
    if(keys.shoot && currentTime - lastShot > shootCooldown) {
        bullets.push({
            x: player.x + player.width/2,
            y: player.y,
            width: 3,
            height: 15,
            speed: BULLET_SPEED
        });
        lastShot = currentTime;
    }
}

// Add this with other game variables
let waitingForRespawn = false;

// Update handlePlayerHit function
function handlePlayerHit() {
    // Skip damage if god mode is active
    if(GOD_MODE) {
        return;
    }

    lives--;
    
    if(lives <= 0) {
        gameOver = true;
        return;
    }
    
    waitingForRespawn = true;
    isPaused = true;
}

// Add drawRespawnScreen function
function drawRespawnScreen() {
    // Darken the background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Show lives remaining
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Lives Remaining: ${lives}`, canvas.width/2, canvas.height/2 - 50);

    // Draw try again button
    const buttonX = canvas.width/2 - 100;
    const buttonY = canvas.height/2;
    const buttonWidth = 200;
    const buttonHeight = 50;

    ctx.fillStyle = 'white';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('Try Again', canvas.width/2, canvas.height/2 + 35);
    
    // Add instruction text
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Click or press Enter to continue', canvas.width/2, canvas.height/2 + 80);

    ctx.textAlign = 'left';
}

// Update gameLoop to show respawn screen
function gameLoop() {
    if(gameOver) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText(`Coins Collected: ${coinsCollected}`, canvas.width/2, canvas.height/2 + 60);
        
        // Add restart button
        ctx.fillStyle = 'white';
        ctx.fillRect(canvas.width/2 - 100, canvas.height/2 + 100, 200, 50);
        ctx.fillStyle = 'black';
        ctx.fillText('Try Again', canvas.width/2, canvas.height/2 + 135);
        
        ctx.textAlign = 'left';
        return;
    }

    if(gameWon) {
        drawVictoryScreen();
        return;
    }

    if(waitingForRespawn) {
        drawRespawnScreen();
        return;
    }

    if(enemies.length === 0 && !continueButtonVisible) {
        if(level === FINAL_LEVEL) {
            gameWon = true;
            return;
        }
        isPaused = true;
        continueButtonVisible = true;
    }

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if(isPaused) {
        drawContinueButton();
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    updatePlayer();
    updateShooting();
    updateEnemyBullets();
    updateCoins();
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawEnemyBullets();
    drawCoins();
    drawScore();
    
    updateBullets();
    updateEnemies();
    checkCollisions();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Update the initial game start
function initializeGame() {
    level = 1;
    score = 0;
    coinsCollected = 0;
    lives = STARTING_LIVES;
    waitingForRespawn = false;
    playerSpeedLevel = 0;
    fireRateLevel = 0;
    player.speed = PLAYER_SPEED;
    shootCooldown = BASE_SHOOT_COOLDOWN;
    isPaused = false;
    continueButtonVisible = false;
    gameOver = false;
    gameWon = false;
    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    coins.length = 0;
    updateShopButtons();
    createEnemiesForLevel();
    if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

initializeGame();

// Add keyboard shortcut for dev skip
document.addEventListener('keydown', (e) => {
    if(DEV_MODE) {
        if(e.key === 'k') { // 'k' for skip
            skipLevel();
        }
        if(e.key === 'c') { // 'c' for coin
            addDevCoin();
        }
    }
    // ... rest of the keydown handling code ...
});

// Add victory screen function
function drawVictoryScreen() {
    // Background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Victory text
    ctx.fillStyle = 'gold';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width/2, 100);

    // Stats
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Final Stats:', canvas.width/2, 180);
    ctx.fillText(`Score: ${score}`, canvas.width/2, 220);
    ctx.fillText(`Coins Collected: ${coinsCollected}`, canvas.width/2, 260);
    ctx.fillText(`Movement Speed Level: ${playerSpeedLevel}/${MAX_SPEED_LEVEL}`, canvas.width/2, 300);
    ctx.fillText(`Fire Rate Level: ${fireRateLevel}/${MAX_FIRE_RATE_LEVEL}`, canvas.width/2, 340);

    // Draw restart button
    const restartButton = {
        x: canvas.width/2 - 100,
        y: canvas.height - 150,
        width: 200,
        height: 50
    };

    ctx.fillStyle = 'white';
    ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('Play Again', canvas.width/2, restartButton.y + 33);

    // Reset text alignment for rest of the game
    ctx.textAlign = 'left';
}

// Update click handler to handle victory screen restart
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle victory screen restart button
    if(gameWon) {
        const restartButton = {
            x: canvas.width/2 - 100,
            y: canvas.height - 150,
            width: 200,
            height: 50
        };

        if(x >= restartButton.x && x <= restartButton.x + restartButton.width &&
           y >= restartButton.y && y <= restartButton.y + restartButton.height) {
            gameWon = false;
            initializeGame();
            return;
        }
    }

    // ... rest of the click handler remains the same ...
});

// Add respawn function to handle both click and keyboard events
function respawnPlayer() {
    console.log('Respawning player');
    if(waitingForRespawn) {
        // Reset level state
        enemies.length = 0;
        bullets.length = 0;
        enemyBullets.length = 0;
        coins.length = 0;
        
        // Reset player position
        player.x = canvas.width/2 - 25;
        player.y = canvas.height - 50;
        
        // Recreate enemies for current level
        createEnemiesForLevel();
        
        // Resume game
        waitingForRespawn = false;
        isPaused = false;
        
        // Ensure animation frame is running
        if(animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(gameLoop);
        
        console.log('Game resumed after respawn');
    }
}

// Update click handler to use respawnPlayer function
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle respawn click first
    if(waitingForRespawn) {
        console.log('Click detected while waiting for respawn');
        if(x >= canvas.width/2 - 100 && 
           x <= canvas.width/2 + 100 &&
           y >= canvas.height/2 && 
           y <= canvas.height/2 + 50) {
            console.log('Try Again button clicked');
            respawnPlayer();
            return;
        }
    }

    // Handle shop buttons
    if(continueButtonVisible) {
        // Shop button checks
        shopButtons.forEach((button, index) => {
            const buttonY = 280 + (SHOP_BUTTON_HEIGHT + 20) * index;
            if(x > canvas.width/2 - SHOP_BUTTON_WIDTH/2 && 
               x < canvas.width/2 + SHOP_BUTTON_WIDTH/2 &&
               y > buttonY && 
               y < buttonY + SHOP_BUTTON_HEIGHT) {
                button.action();
            }
        });

        // Continue button check
        if(x > canvas.width/2 - 60 && x < canvas.width/2 + 60 &&
           y > canvas.height - 100 && y < canvas.height - 60) {
            console.log(`Starting level ${level + 1} with score ${score}`);
            level++;
            isPaused = false;
            continueButtonVisible = false;
            enemyBullets.length = 0;
            bullets.length = 0;
            createEnemiesForLevel();
            if(animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    // Dev button checks
    if(DEV_MODE) {
        if(x >= 10 && x <= 110 && y >= 10 && y <= 40) {
            skipLevel();
            return;
        }
        if(x >= 10 && x <= 110 && y >= 50 && y <= 80) {
            addDevCoin();
            return;
        }
    }
});

// Update keydown handler
document.addEventListener('keydown', function(e) {
    if(waitingForRespawn && e.key === 'Enter') {
        console.log('Enter pressed while waiting for respawn');
        respawnPlayer();
        return;
    }

    if(e.key === 'ArrowLeft') {
        keys.left = true;
    }
    if(e.key === 'ArrowRight') {
        keys.right = true;
    }
    if(e.key === ' ' || e.key === 'Space') {
        keys.shoot = true;
    }

    // Dev controls
    if(DEV_MODE) {
        if(e.key === 'k') {
            skipLevel();
        }
        if(e.key === 'c') {
            addDevCoin();
        }
    }
});
