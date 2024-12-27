import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

/**
 * Menu Implementation
 */
const createMenu = () => {
    const menuContainer = document.createElement('div');
    menuContainer.style.position = 'absolute';
    menuContainer.style.width = '100%';
    menuContainer.style.height = '100%';
    menuContainer.style.display = 'flex';
    menuContainer.style.flexDirection = 'column';
    menuContainer.style.justifyContent = 'center';
    menuContainer.style.alignItems = 'center';
    menuContainer.style.background = 'rgba(0, 0, 0, 0.8)';
    menuContainer.style.zIndex = '10';
    menuContainer.id = 'menu';

    const createButton = (text, onClick) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.margin = '10px';
        button.style.padding = '10px 20px';
        button.style.fontSize = '20px';
        button.style.cursor = 'pointer';
        button.style.color = 'white';
        button.style.backgroundColor = '#333';
        button.style.border = '1px solid white';
        button.onclick = onClick;
        return button;
    };

    const startButton = createButton('Start Game', () => {
        document.body.removeChild(menuContainer);
        startGame();
    });

    const instructionsButton = createButton('Instructions', () => {
        alert('Move: W/A/S/D\nShoot: Click\nAvoid enemies and shoot them to increase your score!');
    });

    const creditsButton = createButton('Credits', () => {
        alert('Game by Marlou Ray Indiano, only me.');
    });

    menuContainer.appendChild(startButton);
    menuContainer.appendChild(instructionsButton);
    menuContainer.appendChild(creditsButton);
    document.body.appendChild(menuContainer);
};

/**
 * Game Over Screen
 */
const createGameOverScreen = () => {
    const gameOverContainer = document.createElement('div');
    gameOverContainer.style.position = 'absolute';
    gameOverContainer.style.width = '100%';
    gameOverContainer.style.height = '100%';
    gameOverContainer.style.display = 'flex';
    gameOverContainer.style.flexDirection = 'column';
    gameOverContainer.style.justifyContent = 'center';
    gameOverContainer.style.alignItems = 'center';
    gameOverContainer.style.background = 'rgba(0, 0, 0, 0.8)';
    gameOverContainer.style.zIndex = '10';
    gameOverContainer.id = 'gameOver';

    const title = document.createElement('h1');
    title.textContent = 'Game Over';
    title.style.color = 'white';
    title.style.marginBottom = '20px';

    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    restartButton.style.padding = '10px 20px';
    restartButton.style.fontSize = '20px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.color = 'white';
    restartButton.style.backgroundColor = '#333';
    restartButton.style.border = '1px solid white';
    restartButton.onclick = () => {
        document.body.removeChild(gameOverContainer);
        window.location.reload();
    };

    gameOverContainer.appendChild(title);
    gameOverContainer.appendChild(restartButton);
    document.body.appendChild(gameOverContainer);
};


/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Environment Map (HDRI)
 */
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/textures/hdr/sky.hdr', (hdrTexture) => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdrTexture; 
    scene.background = hdrTexture; 
});



/**
 * House
 */
const houseGroup = new THREE.Group();
scene.add(houseGroup);

const gltfLoader = new GLTFLoader();
gltfLoader.load(
    '/models/FullCity/scene.gltf',
    (gltfScene) => {
        gltfScene.scene.scale.set(0.5, 0.5, 0.5); 
        gltfScene.scene.position.set(0, 0, 0); 
        gltfScene.scene.rotation.set(0, Math.PI / 2, 0);

        gltfScene.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.envMapIntensity = 1;
            }
        });

        houseGroup.add(gltfScene.scene);
        console.log("GLTF model loaded successfully!");
    },
    undefined,
    (error) => {
        console.error('Error loading GLTF model:', error);
    }
);

/**
 * Floor
 */
const textureLoader = new THREE.TextureLoader();
const floorColorTexture = textureLoader.load('/textures/floor/color.jpg');
const floorRoughnessTexture = textureLoader.load('/textures/floor/roughness.jpg');
const floorNormalTexture = textureLoader.load('/textures/floor/normal.jpg');
const floorAmbientOcclusionTexture = textureLoader.load('/textures/floor/ambientOcclusion.jpg');

const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorColorTexture,
    roughnessMap: floorRoughnessTexture,
    normalMap: floorNormalTexture,
    aoMap: floorAmbientOcclusionTexture,
    roughness: 0.8,
    metalness: 0.1,
});

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(640, 480), 
    floorMaterial
);
floor.rotation.x = -Math.PI * 0.5; 
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

/**
 *  Snowflakes
 */
const snowTexture = new THREE.TextureLoader().load('/textures/snowtexture.jpg'); // Snow texture

const snowGeometry = new THREE.BufferGeometry();
const snowCount = 50000;
const snowPositions = new Float32Array(snowCount * 3);

for (let i = 0; i < snowCount; i++) {
    const x = Math.random() * 50 - 25;
    const y = Math.random() * 20 + 10;
    const z = Math.random() * 50 - 25;
    snowPositions[i * 3] = x;
    snowPositions[i * 3 + 1] = y;
    snowPositions[i * 3 + 2] = z;
}

snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

// Spherical snowflakes by using smaller points
const snowMaterial = new THREE.PointsMaterial({
    map: snowTexture,
    size: 0.1,  
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending, 
});

const snow = new THREE.Points(snowGeometry, snowMaterial);
scene.add(snow);

/**
 * Animate Snowfall
 */
const animateSnow = () => {
    const positions = snowGeometry.attributes.position.array;

    for (let i = 0; i < snowCount; i++) {
        positions[i * 3] -= 0.01;
        positions[i * 3 + 1] -= 0.04;

        // Reset snowflakes that fall below the ground
        if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = Math.random() * 20 + 10; 
            positions[i * 3] = Math.random() * 50 - 25; 
            positions[i * 3 + 2] = Math.random() * 50 - 25; 
        }
    }

    snowGeometry.attributes.position.needsUpdate = true;
};

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(4, 5, 5);
scene.add(camera);

/**
 * First-Person Controls (Pointer Lock)
 */
const controls = new PointerLockControls(camera, canvas);
document.addEventListener('click', () => {
    controls.lock();
});

// Movement controls
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const baseSpeed = 2;
const sprintSpeed = 4;
const jumpHeight = 3;
let canJump = false;
let isSprinting = false;
let moveSpeed = 2;

const keysPressed = { KeyW: false, KeyA: false, KeyS: false, KeyD: false };

document.addEventListener('keydown', (event) => {
    keysPressed[event.code] = true;
    if (event.code === 'Space' && canJump) {
        velocity.y = jumpHeight;
        canJump = false;
    }
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.code] = false;
});

const applyCameraRelativeMovement = (delta) => {
    direction.set(0, 0, 0);

    if (keysPressed['KeyW']) direction.z += 1;
    if (keysPressed['KeyS']) direction.z -= 1;
    if (keysPressed['KeyA']) direction.x -= 1;
    if (keysPressed['KeyD']) direction.x += 1;

    direction.normalize();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(forward, direction.z);
    move.addScaledVector(right, direction.x);

    move.normalize();
    move.multiplyScalar(moveSpeed * delta);

    camera.position.add(move);
};

/**
 * Collision Detection
 */
const floorHeight = 0.5;

const checkCollisions = () => {
    if (camera.position.y <= floorHeight) {
        velocity.y = 0;
        canJump = true;
        camera.position.y = floorHeight;
    }
};

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#262827');

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const clock = new THREE.Clock();

const tick = () => {
    const delta = clock.getDelta();

    //movement
    applyCameraRelativeMovement(delta);

    //gravity
    velocity.y -= 9.8 * delta;
    camera.position.addScaledVector(velocity, delta);

    checkCollisions();

    
    animateSnow();

    
    renderer.render(scene, camera);

    window.requestAnimationFrame(tick);
};

tick();

/**
 * Lighting Adjustment
 */
const shootingLight = new THREE.PointLight(0xff0000, 1, 50);
shootingLight.position.set(0, 5, 0);
scene.add(shootingLight);

/**
 * Shooting Mechanism
 */
const projectiles = [];
const shoot = () => {
    const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const projectile = new THREE.Mesh(sphereGeometry, sphereMaterial);
    projectile.position.copy(camera.position);

    const forwardDirection = new THREE.Vector3();
    camera.getWorldDirection(forwardDirection);
    forwardDirection.multiplyScalar(300); // Speed of the projectile
    projectile.userData.velocity = forwardDirection;

    scene.add(projectile);
    projectiles.push(projectile);
};

window.addEventListener('click', shoot);


/**
 * Crosshair
 */
const createCrosshair = () => {
    const crosshair = document.createElement('div');
    crosshair.style.position = 'absolute';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.width = '10px';
    crosshair.style.height = '10px';
    crosshair.style.background = 'white';
    crosshair.style.border = '2px solid black';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.borderRadius = '50%';
    crosshair.style.zIndex = '5';
    document.body.appendChild(crosshair);
};

createCrosshair();


/**
 * Enemy Generation
 */
const enemies = [];
const enemyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

const spawnEnemy = () => {
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(
        (Math.random() - 0.5) * 20, 
        1, 
        -20 
    );

    const baseSpeed = 300; 
    const additionalSpeed = score / 100; 
    const totalSpeed = baseSpeed + additionalSpeed;

    enemy.userData.velocity = new THREE.Vector3(0, 0, totalSpeed); 
    scene.add(enemy);
    enemies.push(enemy);
};

setInterval(spawnEnemy, 300); //Spawn an enemy every 300 miliseconds

/**
 * Scoring System
 */
let score = 0;
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '40px'; 
scoreElement.style.zIndex = '5';
document.body.appendChild(scoreElement);

const updateScore = () => {
    scoreElement.textContent = `Score: ${score}`;
};

updateScore();

/**
 * Collision Detection
 */
const detectCollisions = () => {
    projectiles.forEach((projectile, projectileIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            const distance = projectile.position.distanceTo(enemy.position);
            if (distance < 0.6) {
                scene.remove(projectile);
                scene.remove(enemy);
                projectiles.splice(projectileIndex, 1);
                enemies.splice(enemyIndex, 1);
                score += 10;
                updateScore();
            }
        });
    });

    enemies.forEach((enemy) => {
        const distance = camera.position.distanceTo(enemy.position);
        if (distance < 0.6) {
            createGameOverScreen();
        }
    });
};

/**
 * Animation Loop Updates
 */
const animateProjectiles = (delta) => {
    projectiles.forEach((projectile, index) => {
        projectile.position.add(projectile.userData.velocity.clone().multiplyScalar(delta));
        if (projectile.position.length() > 100) {
            scene.remove(projectile);
            projectiles.splice(index, 1);
        }
    });
};

const animateEnemies = (delta) => {
    enemies.forEach((enemy, index) => {
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, enemy.position).normalize();

        // Adjust speed of the enemy
        const speed = 50; 
        const velocity = direction.multiplyScalar(speed * delta);

        // Update enemy position
        enemy.position.add(velocity);
    });
};

const tickWithUpdates = () => {
    const delta = clock.getDelta();
    applyCameraRelativeMovement(delta);
    velocity.y -= 9.8 * delta;
    camera.position.addScaledVector(velocity, delta);
    checkCollisions();
    animateSnow();
    animateProjectiles(delta);
    animateEnemies(delta);
    detectCollisions();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tickWithUpdates);
};

/**
 * Start Game
 */
const startGame = () => {
    tickWithUpdates();
};

// Initialize the menu
createMenu();