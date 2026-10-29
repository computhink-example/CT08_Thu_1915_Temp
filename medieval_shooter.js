const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const LEVEL_LENGTH = 6500;
const FLOOR_HEIGHT = 54;
const FLOOR_TOP = CANVAS_HEIGHT - FLOOR_HEIGHT;
const BOSS_GATE_X = 5150;
const BOSS_X = 5900;

const WEAPONS = [
  { name: "Moonfire Bolt", cooldown: 18, damage: 2, speed: 10, color: "#87e5ff", radius: 7 },
  { name: "Royal Repeater", cooldown: 8, damage: 1, speed: 13, color: "#f4d36c", radius: 5 },
  { name: "Dragonfire Staff", cooldown: 34, damage: 5, speed: 7, color: "#ff744d", radius: 11 }
];

const WAVE_CHECKPOINTS = [850, 1700, 2550, 3400, 4250];

let player;
let floorSegments = [];
let enemies = [];
let projectiles = [];
let boss = null;
let heroArtwork;
let gameState = "title";
let playerHealth = 6;
let selectedWeapon = 0;
let playerFacing = 1;
let nextWaveIndex = 0;
let shotCooldown = 0;
let damageCooldown = 0;
let grounded = false;
let jumpWasDown = false;
let touchInput = { left: false, right: false, jump: false, fire: false };

function setup() {
  const gameCanvas = new Canvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  document.getElementById("gameCanvas").appendChild(gameCanvas);
  world.gravity.y = 0.8;
  textFont("monospace");
  createHeroArtwork();
  buildLevel();
  bindTouchControls();
  resetGame();
}

function createHeroArtwork() {
  heroArtwork = createGraphics(64, 64);
  heroArtwork.noStroke();
  heroArtwork.fill("#672d37");
  heroArtwork.triangle(20, 33, 48, 34, 54, 57);
  heroArtwork.fill("#c94e45");
  heroArtwork.rect(20, 24, 27, 29, 5);
  heroArtwork.fill("#e9c27c");
  heroArtwork.rect(24, 5, 23, 22, 7);
  heroArtwork.fill("#657d74");
  heroArtwork.rect(21, 2, 29, 9, 3);
  heroArtwork.fill("#322d2b");
  heroArtwork.rect(24, 51, 9, 11, 3);
  heroArtwork.rect(39, 51, 9, 11, 3);
  heroArtwork.fill("#f5e4bd");
  heroArtwork.rect(38, 29, 20, 4, 2);
  heroArtwork.fill("#d8e4de");
  heroArtwork.rect(54, 25, 4, 13, 2);
}

function buildLevel() {
  const segmentWidth = 500;
  for (let segmentX = segmentWidth / 2; segmentX < LEVEL_LENGTH; segmentX += segmentWidth) {
    const floorSegment = new Sprite(segmentX, CANVAS_HEIGHT - FLOOR_HEIGHT / 2, segmentWidth, FLOOR_HEIGHT);
    floorSegment.collider = "static";
    floorSegment.color = "#394941";
    floorSegment.stroke = "#70816a";
    floorSegments.push(floorSegment);
  }
}

function resetGame() {
  if (player) player.remove();
  enemies.forEach((enemy) => enemy.sprite.remove());
  if (boss) boss.sprite.remove();

  enemies = [];
  projectiles = [];
  boss = null;
  nextWaveIndex = 0;
  playerHealth = 6;
  selectedWeapon = 0;
  playerFacing = 1;
  shotCooldown = 0;
  damageCooldown = 0;
  grounded = false;
  jumpWasDown = false;

  player = new Sprite(90, FLOOR_TOP - 42, 42, 58);
  player.img = heroArtwork;
  player.collider = "dynamic";
  player.friction = 0;
  player.bounciness = 0;
  player.rotationLock = true;
  player.color = "#c94e45";
  player.stroke = "#f1d29a";
  player.vel.x = 0;
  player.vel.y = 0;
  gameState = "title";
}

function draw() {
  background("#17242b");
  camera.x = constrain(player.x, width / 2, LEVEL_LENGTH - width / 2);
  camera.y = height / 2;

  drawScenery();

  if (gameState === "playing") {
    updatePlayer();
    updateWaves();
    updateEnemies();
    updateBoss();
    updateProjectiles();
    updateCombat();
  }

  drawEnemies();
  drawBoss();
  drawProjectiles();
  drawHud();

  if (gameState === "title") drawOverlay("THE EMBER KING", "Press ENTER or click to begin", "Defeat five enemy waves, then bring down the king.");
  if (gameState === "won") drawOverlay("THE KING HAS FALLEN", "Press ENTER or click to play again", "The relics are yours. The realm is free.");
  if (gameState === "lost") drawOverlay("YOUR QUEST ENDS HERE", "Press ENTER or click to try again", "The cursed army has claimed another champion.");
}

function drawScenery() {
  noStroke();
  fill("#263b3b");
  for (let hillX = floor(camera.x / 390) * 390 - 780; hillX < camera.x + width; hillX += 390) {
    triangle(hillX, FLOOR_TOP, hillX + 195, 190 + (abs(hillX) % 70), hillX + 390, FLOOR_TOP);
  }

  fill("#17272d");
  for (let towerX = floor(camera.x / 760) * 760 - 760; towerX < camera.x + width; towerX += 760) {
    rect(towerX + 300, FLOOR_TOP - 150, 78, 150);
    triangle(towerX + 284, FLOOR_TOP - 150, towerX + 339, FLOOR_TOP - 218, towerX + 394, FLOOR_TOP - 150);
    fill("#42524a");
    rect(towerX + 326, FLOOR_TOP - 101, 12, 24);
    fill("#17272d");
  }

  fill("#72836d");
  for (let detailX = floor(camera.x / 100) * 100 - 200; detailX < camera.x + width; detailX += 100) {
    rect(detailX, FLOOR_TOP + 8, 42, 3);
  }
}

function updatePlayer() {
  const movingLeft = keyIsDown(65) || keyIsDown(LEFT_ARROW) || touchInput.left;
  const movingRight = keyIsDown(68) || keyIsDown(RIGHT_ARROW) || touchInput.right;
  const moveDirection = Number(movingRight) - Number(movingLeft);
  const jumpDown = keyIsDown(32) || touchInput.jump;

  if (moveDirection !== 0) {
    playerFacing = moveDirection;
    player.vel.x = moveDirection * 4.3;
  } else {
    player.vel.x = 0;
  }

  grounded = false;
  for (const floorSegment of floorSegments) {
    if (player.collides(floorSegment)) grounded = true;
  }

  if (jumpDown && !jumpWasDown && grounded) player.vel.y = -13;
  jumpWasDown = jumpDown;

  const movementLimit = nextWaveIndex === WAVE_CHECKPOINTS.length && enemies.length > 0
    ? BOSS_GATE_X
    : LEVEL_LENGTH - 42;

  if (player.x < 24) {
    player.x = 24;
    player.vel.x = max(0, player.vel.x);
  } else if (player.x > movementLimit) {
    player.x = movementLimit;
    player.vel.x = min(0, player.vel.x);
  }

  if (shotCooldown > 0) shotCooldown--;
  if (damageCooldown > 0) damageCooldown--;

  const firing = (mouseIsPressed && mouseButton === LEFT) || touchInput.fire;
  if (firing && shotCooldown === 0) fireWeapon();
}

function updateWaves() {
  if (nextWaveIndex < WAVE_CHECKPOINTS.length && enemies.length === 0 && player.x >= WAVE_CHECKPOINTS[nextWaveIndex]) {
    spawnWave();
  }

  if (nextWaveIndex === WAVE_CHECKPOINTS.length && enemies.length === 0 && !boss && player.x >= BOSS_GATE_X) {
    spawnBoss();
  }
}

function spawnWave() {
  const entryX = min(player.x + width * 0.56, BOSS_GATE_X - 180);
  for (let index = 0; index < 3; index++) {
    const sprite = new Sprite(entryX + index * 82, FLOOR_TOP - 25, 34, 48);
    sprite.collider = "none";
    sprite.visible = false;
    enemies.push({
      sprite,
      healthValue: 3,
      moveSpeed: 1.15 + index * 0.12,
      attackCooldown: 0,
      colorValue: index === 1 ? "#92a77a" : "#b3b8a0"
    });
  }
  nextWaveIndex++;
}

function spawnBoss() {
  const sprite = new Sprite(BOSS_X, FLOOR_TOP - 52, 94, 100);
  sprite.collider = "none";
  sprite.visible = false;
  boss = { sprite, healthValue: 42, moveSpeed: 0.72, attackCooldown: 0 };
}

function updateEnemies() {
  for (let index = enemies.length - 1; index >= 0; index--) {
    const enemy = enemies[index];
    const gap = player.x - enemy.sprite.x;
    if (abs(gap) < 540) enemy.sprite.x += Math.sign(gap) * enemy.moveSpeed;
    enemy.sprite.y = FLOOR_TOP - enemy.sprite.h / 2;
    if (enemy.attackCooldown > 0) enemy.attackCooldown--;
    if (boxesOverlap(player.x, player.y, player.w * 0.72, player.h * 0.82, enemy.sprite.x, enemy.sprite.y, enemy.sprite.w * 0.78, enemy.sprite.h * 0.86)) {
      hurtPlayer(1, enemy.sprite.x);
      enemy.attackCooldown = 50;
    }
  }
}

function updateBoss() {
  if (!boss) return;
  const gap = player.x - boss.sprite.x;
  if (abs(gap) < 760) boss.sprite.x += Math.sign(gap) * boss.moveSpeed;
  boss.sprite.y = FLOOR_TOP - boss.sprite.h / 2;
  if (boss.attackCooldown > 0) boss.attackCooldown--;
  if (boxesOverlap(player.x, player.y, player.w * 0.72, player.h * 0.82, boss.sprite.x, boss.sprite.y, boss.sprite.w * 0.72, boss.sprite.h * 0.82)) {
    hurtPlayer(2, boss.sprite.x);
    boss.attackCooldown = 65;
  }
}

function fireWeapon() {
  const weapon = WEAPONS[selectedWeapon];
  projectiles.push({
    posX: player.x + playerFacing * 32,
    posY: player.y - 5,
    horizontalSpeed: playerFacing * weapon.speed,
    damageValue: weapon.damage,
    colorValue: weapon.color,
    radiusValue: weapon.radius,
    remainingFrames: 100
  });
  shotCooldown = weapon.cooldown;
}

function updateProjectiles() {
  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index];
    projectile.posX += projectile.horizontalSpeed;
    projectile.remainingFrames--;
    let hitTarget = false;

    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex];
      if (boxesOverlap(projectile.posX, projectile.posY, projectile.radiusValue * 2, projectile.radiusValue * 2, enemy.sprite.x, enemy.sprite.y, enemy.sprite.w, enemy.sprite.h)) {
        enemy.healthValue -= projectile.damageValue;
        if (enemy.healthValue <= 0) {
          enemy.sprite.remove();
          enemies.splice(enemyIndex, 1);
        }
        hitTarget = true;
        break;
      }
    }

    if (!hitTarget && boss && boxesOverlap(projectile.posX, projectile.posY, projectile.radiusValue * 2, projectile.radiusValue * 2, boss.sprite.x, boss.sprite.y, boss.sprite.w, boss.sprite.h)) {
      boss.healthValue -= projectile.damageValue;
      hitTarget = true;
      if (boss.healthValue <= 0) {
        boss.sprite.remove();
        boss = null;
        gameState = "won";
      }
    }

    if (hitTarget || projectile.remainingFrames <= 0 || projectile.posX < 0 || projectile.posX > LEVEL_LENGTH) {
      projectiles.splice(index, 1);
    }
  }
}

function updateCombat() {
  if (playerHealth <= 0) gameState = "lost";
}

function hurtPlayer(damage, attackerX) {
  if (damageCooldown > 0) return;
  playerHealth -= damage;
  damageCooldown = 55;
  player.vel.x = player.x < attackerX ? -4 : 4;
  player.vel.y = -4;
}

function boxesOverlap(firstX, firstY, firstW, firstH, secondX, secondY, secondW, secondH) {
  return abs(firstX - secondX) * 2 < firstW + secondW && abs(firstY - secondY) * 2 < firstH + secondH;
}

function drawEnemies() {
  for (const enemy of enemies) {
    push();
    translate(enemy.sprite.x, enemy.sprite.y);
    noStroke();
    fill("#27312c");
    ellipse(0, 0, 34, 40);
    fill(enemy.colorValue);
    rect(-12, -9, 24, 25, 4);
    fill("#d6bd8b");
    ellipse(0, -19, 20, 17);
    fill("#a3443c");
    rect(-15, -29, 30, 7, 2);
    fill("#ffdb8d");
    rect(-5, -20, 3, 3);
    rect(3, -20, 3, 3);
    pop();
  }
}

function drawBoss() {
  if (!boss) return;
  push();
  translate(boss.sprite.x, boss.sprite.y);
  noStroke();
  fill("#512f36");
  ellipse(0, 0, 91, 94);
  fill("#8b3940");
  rect(-35, -29, 70, 61, 10);
  fill("#d2b56c");
  triangle(-29, -51, -38, -79, -12, -57);
  triangle(29, -51, 38, -79, 12, -57);
  fill("#f6d77c");
  ellipse(-13, -35, 8, 6);
  ellipse(13, -35, 8, 6);
  fill("#d5e0d4");
  rect(-44, 13, 88, 8, 3);
  pop();
}

function drawProjectiles() {
  noStroke();
  for (const projectile of projectiles) {
    fill(projectile.colorValue);
    circle(projectile.posX, projectile.posY, projectile.radiusValue * 2);
    fill("#fff2c2");
    circle(projectile.posX, projectile.posY, projectile.radiusValue);
  }
}

function drawHud() {
  camera.off();
  noStroke();
  fill("#111b20e8");
  rect(14, 14, 360, 76, 5);
  fill("#f0d18a");
  textSize(14);
  text(`VITALITY  ${"◆ ".repeat(max(0, playerHealth))}`, 28, 38);
  fill("#e8e2d3");
  textSize(12);
  text(`WEAPON  ${WEAPONS[selectedWeapon].name}`, 28, 61);
  const progressText = boss ? "FINAL BOSS" : `WAVE ${min(nextWaveIndex + 1, WAVE_CHECKPOINTS.length)} / ${WAVE_CHECKPOINTS.length}`;
  text(progressText, 28, 80);

  if (boss) {
    const barWidth = 250;
    fill("#111b20e8");
    rect(width - barWidth - 18, 18, barWidth, 34, 4);
    fill("#e8e2d3");
    text("EMBER KING", width - barWidth - 8, 14);
    fill("#6f3038");
    rect(width - barWidth - 10, 28, barWidth - 16, 13, 3);
    fill("#ef795f");
    rect(width - barWidth - 10, 28, (barWidth - 16) * max(0, boss.healthValue) / 42, 13, 3);
  }
  camera.on();
}

function drawOverlay(title, action, subtitle) {
  camera.off();
  noStroke();
  fill("#10191ce8");
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  fill("#efbd58");
  textSize(width < 600 ? 25 : 36);
  text(title, width / 2, height / 2 - 54);
  fill("#f1ead9");
  textSize(15);
  text(subtitle, width / 2, height / 2 - 12);
  fill("#b9c3b9");
  textSize(13);
  text(action, width / 2, height / 2 + 31);
  textAlign(LEFT, BASELINE);
  camera.on();
}

function keyPressed() {
  if (keyCode === ENTER && gameState !== "playing") resetGameAndStart();
  if (key === "1") selectedWeapon = 0;
  if (key === "2") selectedWeapon = 1;
  if (key === "3") selectedWeapon = 2;
  if (keyCode === 32) return false;
}

function mousePressed() {
  if (gameState !== "playing") resetGameAndStart();
}

function resetGameAndStart() {
  resetGame();
  gameState = "playing";
}

function bindTouchControls() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    const action = button.dataset.action;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      touchInput[action] = true;
      button.classList.add("selected");
      button.setPointerCapture(event.pointerId);
      if (action === "fire" && gameState !== "playing") resetGameAndStart();
    });
    const release = () => {
      touchInput[action] = false;
      button.classList.remove("selected");
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  document.querySelectorAll("[data-weapon]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedWeapon = Number(button.dataset.weapon);
      document.querySelectorAll("[data-weapon]").forEach((weaponButton) => weaponButton.classList.remove("selected"));
      button.classList.add("selected");
    });
  });
}