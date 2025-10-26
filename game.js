// Game state
const gameState = {
    playing: false,
    paused: false,
    health: 100,
    ammo: 30,
    score: 0,
    maxAmmo: 30
};

// Three.js scene setup
let scene, camera, renderer;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let enemies = [];
let bullets = [];

// Camera controls
let euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 0, 750);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0); // Eye height

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a9d23,
        roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create walls
    createWalls();

    // Create enemies
    spawnEnemies(10);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const wallHeight = 5;
    const wallThickness = 1;

    // North wall
    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(100, wallHeight, wallThickness),
        wallMaterial
    );
    northWall.position.set(0, wallHeight / 2, -50);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);

    // South wall
    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(100, wallHeight, wallThickness),
        wallMaterial
    );
    southWall.position.set(0, wallHeight / 2, 50);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);

    // East wall
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, 100),
        wallMaterial
    );
    eastWall.position.set(50, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    // West wall
    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, 100),
        wallMaterial
    );
    westWall.position.set(-50, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
}

function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const enemy = new THREE.Mesh(geometry, material);
        
        // Random position within bounds
        enemy.position.set(
            Math.random() * 80 - 40,
            1,
            Math.random() * 80 - 40
        );
        
        enemy.castShadow = true;
        enemy.userData.isEnemy = true;
        enemy.userData.health = 100;
        
        scene.add(enemy);
        enemies.push(enemy);
    }
}

// Input handling
function setupControls() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
    
    // Pointer lock for FPS controls
    const gameContainer = document.getElementById('game-container');
    gameContainer.addEventListener('click', () => {
        if (gameState.playing && !gameState.paused) {
            gameContainer.requestPointerLock();
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        // Handle pointer lock change
    });
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Escape':
            if (gameState.playing) {
                togglePause();
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

function onMouseMove(event) {
    if (document.pointerLockElement === document.getElementById('game-container') && gameState.playing) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        euler.setFromQuaternion(camera.quaternion);
        euler.y -= movementX * 0.002;
        euler.x -= movementY * 0.002;
        euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
        camera.quaternion.setFromEuler(euler);
    }
}

function onMouseClick(event) {
    if (document.pointerLockElement === document.getElementById('game-container') && gameState.playing) {
        shoot();
    }
}

function shoot() {
    if (gameState.ammo <= 0) return;
    
    gameState.ammo--;
    updateHUD();
    
    // Raycast to detect hits
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const intersects = raycaster.intersectObjects(enemies);
    
    if (intersects.length > 0) {
        const hitEnemy = intersects[0].object;
        if (hitEnemy.userData.isEnemy) {
            hitEnemy.userData.health -= 34; // 3 shots to kill
            
            // Flash effect
            const originalColor = hitEnemy.material.color.getHex();
            hitEnemy.material.color.setHex(0xffffff);
            setTimeout(() => {
                if (hitEnemy.material) {
                    hitEnemy.material.color.setHex(originalColor);
                }
            }, 100);
            
            if (hitEnemy.userData.health <= 0) {
                // Remove enemy
                scene.remove(hitEnemy);
                enemies = enemies.filter(e => e !== hitEnemy);
                gameState.score += 100;
                updateHUD();
                
                // Check win condition
                if (enemies.length === 0) {
                    endGame(true);
                }
            }
        }
    }
}

function togglePause() {
    gameState.paused = !gameState.paused;
    if (gameState.paused) {
        document.getElementById('menu').style.display = 'block';
        document.exitPointerLock();
    } else {
        document.getElementById('menu').style.display = 'none';
    }
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState.playing || gameState.paused) return;
    
    // Update movement
    const speed = 0.1;
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    
    if (moveForward || moveBackward) {
        velocity.z -= direction.z * speed;
    }
    if (moveLeft || moveRight) {
        velocity.x -= direction.x * speed;
    }
    
    camera.translateX(velocity.x);
    camera.translateZ(velocity.z);
    
    // Apply boundaries
    camera.position.x = Math.max(-48, Math.min(48, camera.position.x));
    camera.position.z = Math.max(-48, Math.min(48, camera.position.z));
    camera.position.y = 1.6; // Keep eye height constant
    
    // Damping
    velocity.x *= 0.8;
    velocity.z *= 0.8;
    
    // Simple enemy AI - rotate to face player
    enemies.forEach(enemy => {
        const dx = camera.position.x - enemy.position.x;
        const dz = camera.position.z - enemy.position.z;
        enemy.rotation.y = Math.atan2(dx, dz);
        
        // Move towards player slowly
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance > 2) {
            enemy.position.x += dx / distance * 0.02;
            enemy.position.z += dz / distance * 0.02;
        } else {
            // Enemy is close, damage player
            if (Math.random() < 0.01) { // 1% chance per frame
                gameState.health -= 1;
                updateHUD();
                if (gameState.health <= 0) {
                    endGame(false);
                }
            }
        }
    });
    
    renderer.render(scene, camera);
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
    
    // Reset camera position
    camera.position.set(0, 1.6, 0);
    euler.set(0, 0, 0);
    camera.quaternion.setFromEuler(euler);
    
    // Clear and respawn enemies
    enemies.forEach(enemy => scene.remove(enemy));
    enemies = [];
    spawnEnemies(10);
    
    updateHUD();
    animate();
}

function endGame(won) {
    gameState.playing = false;
    document.exitPointerLock();
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = gameState.score;
    
    if (won) {
        document.querySelector('#gameOver h1').textContent = 'You Win!';
    } else {
        document.querySelector('#gameOver h1').textContent = 'Game Over!';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Setup event listeners
document.getElementById('startBtn').addEventListener('click', () => {
    if (!scene) {
        init();
        setupControls();
    }
    startGame();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    startGame();
});
