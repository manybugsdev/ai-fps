// Game state
const gameState = {
    playing: false,
    paused: false,
    health: 100,
    ammo: 30,
    score: 0,
    maxAmmo: 30
};

// Canvas setup
let canvas, ctx;
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

// Player
const player = {
    x: 5,
    y: 5,
    angle: 0,
    fov: Math.PI / 3,
    moveSpeed: 0.05,
    rotateSpeed: 0.03
};

// World map (1 = wall, 0 = empty, 2 = enemy)
const worldMap = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
];

// Enemies
let enemies = [];

// Input handling
const keys = {};
let mouseMovementX = 0;

// Initialize the game
function init() {
    canvas = document.createElement('canvas');
    canvas.width = screenWidth;
    canvas.height = screenHeight;
    ctx = canvas.getContext('2d');
    document.getElementById('game-container').appendChild(canvas);

    // Spawn enemies
    spawnEnemies(10);

    // Setup controls
    setupControls();
}

function spawnEnemies(count) {
    enemies = [];
    const mapWidth = worldMap[0].length;
    const mapHeight = worldMap.length;
    
    for (let i = 0; i < count; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * (mapWidth - 2)) + 1;
            y = Math.floor(Math.random() * (mapHeight - 2)) + 1;
        } while (worldMap[Math.floor(y)][Math.floor(x)] !== 0);
        
        enemies.push({
            x: x + 0.5,
            y: y + 0.5,
            health: 100,
            size: 0.3,
            active: true
        });
    }
}

function setupControls() {
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Escape' && gameState.playing) {
            togglePause();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    canvas.addEventListener('click', () => {
        if (gameState.playing && !gameState.paused) {
            shoot();
            // Request pointer lock for mouse look
            canvas.requestPointerLock();
        }
    });

    // Mouse movement for looking around
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === canvas && gameState.playing && !gameState.paused) {
            mouseMovementX = e.movementX || 0;
        }
    });

    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement !== canvas && gameState.playing && !gameState.paused) {
            // Pointer lock lost
        }
    });

    window.addEventListener('resize', () => {
        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
        if (canvas) {
            canvas.width = screenWidth;
            canvas.height = screenHeight;
        }
    });
}

function shoot() {
    if (gameState.ammo <= 0) return;
    
    gameState.ammo--;
    updateHUD();
    
    // Check if we hit an enemy
    for (let enemy of enemies) {
        if (!enemy.active) continue;
        
        // Calculate angle to enemy
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const angleToEnemy = Math.atan2(dy, dx);
        
        // Normalize angle difference
        let angleDiff = angleToEnemy - player.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Check if enemy is in crosshair (within a small angle)
        if (Math.abs(angleDiff) < 0.1) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 10) { // Max shooting range
                enemy.health -= 34;
                
                if (enemy.health <= 0) {
                    enemy.active = false;
                    gameState.score += 100;
                    updateHUD();
                    
                    // Check win condition
                    if (enemies.filter(e => e.active).length === 0) {
                        endGame(true);
                    }
                }
                break; // Only hit one enemy per shot
            }
        }
    }
}

function togglePause() {
    gameState.paused = !gameState.paused;
    if (gameState.paused) {
        document.getElementById('menu').style.display = 'block';
        // Exit pointer lock when paused
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    } else {
        document.getElementById('menu').style.display = 'none';
        // Request pointer lock when unpausing
        if (canvas) {
            canvas.requestPointerLock();
        }
    }
}

// Raycasting rendering
function castRay(angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    
    let distance = 0;
    const step = 0.05;
    const maxDistance = 20;
    
    while (distance < maxDistance) {
        distance += step;
        const x = Math.floor(player.x + cos * distance);
        const y = Math.floor(player.y + sin * distance);
        
        if (x < 0 || x >= worldMap[0].length || y < 0 || y >= worldMap.length) {
            return { distance: maxDistance, type: 'wall' };
        }
        
        if (worldMap[y][x] === 1) {
            return { distance, type: 'wall' };
        }
    }
    
    return { distance: maxDistance, type: 'none' };
}

function render() {
    // Clear screen - sky and floor
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, screenWidth, screenHeight / 2);
    ctx.fillStyle = '#3a9d23';
    ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight / 2);
    
    const numRays = screenWidth;
    const rayStep = player.fov / numRays;
    
    // Cast rays for walls
    for (let i = 0; i < numRays; i++) {
        const rayAngle = player.angle - player.fov / 2 + rayStep * i;
        const ray = castRay(rayAngle);
        
        // Fix fisheye effect
        const correctedDistance = ray.distance * Math.cos(rayAngle - player.angle);
        
        if (ray.type === 'wall') {
            const wallHeight = screenHeight / correctedDistance;
            const brightness = Math.max(50, 255 - correctedDistance * 20);
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            ctx.fillRect(
                i,
                screenHeight / 2 - wallHeight / 2,
                1,
                wallHeight
            );
        }
    }
    
    // Render enemies (sprites)
    const activeEnemies = enemies.filter(e => e.active);
    
    // Sort enemies by distance (far to near)
    activeEnemies.sort((a, b) => {
        const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
        const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
        return distB - distA;
    });
    
    for (let enemy of activeEnemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle to enemy
        const angleToEnemy = Math.atan2(dy, dx);
        let angleDiff = angleToEnemy - player.angle;
        
        // Normalize angle
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Check if enemy is in view
        if (Math.abs(angleDiff) < player.fov / 2 + 0.5) {
            const enemyScreenX = (angleDiff + player.fov / 2) / player.fov * screenWidth;
            const enemySize = screenHeight / distance * enemy.size;
            
            // Draw enemy as a red rectangle
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(
                enemyScreenX - enemySize / 2,
                screenHeight / 2 - enemySize,
                enemySize,
                enemySize * 2
            );
            
            // Draw enemy health bar
            ctx.fillStyle = '#000000';
            ctx.fillRect(
                enemyScreenX - enemySize / 2,
                screenHeight / 2 - enemySize - 10,
                enemySize,
                5
            );
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(
                enemyScreenX - enemySize / 2,
                screenHeight / 2 - enemySize - 10,
                enemySize * (enemy.health / 100),
                5
            );
        }
    }
}

function update() {
    if (!gameState.playing || gameState.paused) return;
    
    // Handle mouse look (rotation)
    if (mouseMovementX !== 0) {
        player.angle += mouseMovementX * 0.002; // Sensitivity adjustment
        mouseMovementX = 0; // Reset after applying
    }
    
    // Handle movement
    let moveX = 0;
    let moveY = 0;
    
    // Forward/backward movement
    if (keys['KeyW'] || keys['ArrowUp']) {
        moveX += Math.cos(player.angle) * player.moveSpeed;
        moveY += Math.sin(player.angle) * player.moveSpeed;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        moveX -= Math.cos(player.angle) * player.moveSpeed;
        moveY -= Math.sin(player.angle) * player.moveSpeed;
    }
    
    // Strafing left/right movement
    if (keys['KeyA'] || keys['ArrowLeft']) {
        // Move perpendicular to facing direction (left)
        moveX += Math.cos(player.angle - Math.PI / 2) * player.moveSpeed;
        moveY += Math.sin(player.angle - Math.PI / 2) * player.moveSpeed;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        // Move perpendicular to facing direction (right)
        moveX += Math.cos(player.angle + Math.PI / 2) * player.moveSpeed;
        moveY += Math.sin(player.angle + Math.PI / 2) * player.moveSpeed;
    }
    
    // Collision detection
    const newX = player.x + moveX;
    const newY = player.y + moveY;
    
    if (worldMap[Math.floor(newY)][Math.floor(newX)] === 0) {
        player.x = newX;
        player.y = newY;
    }
    
    // Update enemies
    for (let enemy of enemies) {
        if (!enemy.active) continue;
        
        // Simple AI - move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.5) {
            const moveSpeed = 0.01;
            const newEnemyX = enemy.x + (dx / distance) * moveSpeed;
            const newEnemyY = enemy.y + (dy / distance) * moveSpeed;
            
            // Check collision with walls
            if (worldMap[Math.floor(newEnemyY)][Math.floor(newEnemyX)] === 0) {
                enemy.x = newEnemyX;
                enemy.y = newEnemyY;
            }
        }
        
        // Damage player if close
        if (distance < 0.6 && Math.random() < 0.02) {
            gameState.health -= 1;
            updateHUD();
            if (gameState.health <= 0) {
                endGame(false);
            }
        }
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    document.getElementById('healthValue').textContent = Math.max(0, gameState.health);
    document.getElementById('ammoValue').textContent = gameState.ammo;
    document.getElementById('scoreValue').textContent = gameState.score;
}

function startGame() {
    gameState.playing = true;
    gameState.paused = false;
    gameState.health = 100;
    gameState.ammo = 30;
    gameState.score = 0;
    
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('gameOver').style.display = 'none';
    
    // Reset player position
    player.x = 5;
    player.y = 5;
    player.angle = 0;
    
    // Respawn enemies
    spawnEnemies(10);
    
    updateHUD();
    gameLoop();
}

function endGame(won) {
    gameState.playing = false;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = gameState.score;
    
    if (won) {
        document.querySelector('#gameOver h1').textContent = 'You Win!';
    } else {
        document.querySelector('#gameOver h1').textContent = 'Game Over!';
    }
}

// Setup event listeners
document.getElementById('startBtn').addEventListener('click', () => {
    if (!canvas) {
        init();
    }
    startGame();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    startGame();
});

