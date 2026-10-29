const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const LEVEL_LENGTH = 6500;
const FLOOR_HEIGHT = 54;
const FLOOR_TOP = CANVAS_HEIGHT - FLOOR_HEIGHT;
const BOSS_GATE_X = 5150;
const BOSS_X = 5900;
const SHIELD_DURATION = 60;
const SHIELD_COOLDOWN = 240;

const WEAPONS = [
  { name: "Moonfire Bolt", cooldown: 18, damage: 2, speed: 10, color: "#87e5ff", radius: 7 },
  { name: "Royal Repeater", cooldown: 8, damage: 1, speed: 13, color: "#f4d36c", radius: 5 },
  { name: "Dragonfire Staff", cooldown: 34, damage: 5, speed: 7, color: "#ff744d", radius: 11 }
];

const WAVE_CHECKPOINTS = [850, 1700, 2550, 3400, 4250];
const WAVE_ROSTERS = [
  ["raider", "raider", "hexer", "raider", "hexer", "raider"],
  ["raider", "wisp", "wisp", "hexer", "raider", "wisp", "raider"],
  ["hexer", "raider", "wisp", "raider", "hexer", "wisp", "raider", "hexer"],
  ["wisp", "wisp", "hexer", "raider", "wisp", "hexer", "raider", "wisp", "hexer"],
  ["raider", "hexer", "wisp", "hexer", "raider", "wisp", "hexer", "raider", "wisp", "hexer"]
];

let player;
let floorSegments = [];
let enemies = [];
let projectiles = [];
let hostileProjectiles = [];
let hitEffects = [];
let boss = null;
let heroArtwork;
let gameState = "title";
let playerHealth = 6;
let selectedWeapon = 0;
let playerFacing = 1;
let nextWaveIndex = 0;
let shotCooldown = 0;
let damageCooldown = 0;
let shieldFrames = 0;
let shieldCooldown = 0;
let grounded = false;
let jumpWasDown = false;
let touchInput = { left: false, right: false, jump: false, fire: false };

function setup() {
  const gameCanvas = new Canvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  document.getElementById("gameCanvas").appendChild(gameCanvas);
  world.gravity.y = 32;
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
  hostileProjectiles = [];
  hitEffects = [];
  boss = null;
  nextWaveIndex = 0;
  playerHealth = 6;
  selectedWeapon = 0;
  playerFacing = 1;
  shotCooldown = 0;
  damageCooldown = 0;
  shieldFrames = 0;
  shieldCooldown = 0;
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
  if (gameState === "playing") {
    updatePlayer();
    updateWaves();
    updateEnemies();
    updateBoss();
    updateProjectiles();
    updateHostileProjectiles();
    updateHitEffects();
    updateCombat();
  }

  camera.x = constrain(player.x, width / 2, LEVEL_LENGTH - width / 2);
  camera.y = height / 2;
  drawScenery();

  drawEnemies();
  drawBoss();
  drawProjectiles();
  drawHostileProjectiles();
  drawHitEffects();
  drawPlayerShield();
  drawHud();

  if (gameState === "title") drawOverlay("THE EMBER KING", "Press ENTER or click to begin", "Defeat five enemy waves, then bring down the king.");
  if (gameState === "won") drawOverlay("THE KING HAS FALLEN", "Press ENTER or click to play again", "The relics are yours. The realm is free.");
  if (gameState === "lost") drawOverlay("YOUR QUEST ENDS HERE", "Press ENTER or click to try again", "The cursed army has claimed another champion.");
}

function drawScenery() {
  camera.off();
  noStroke();
  fill("#1b3037");
  const farOffset = (camera.x * 0.1) % 300;
  for (let hillX = -300 - farOffset; hillX < width + 300; hillX += 300) {
    triangle(hillX, FLOOR_TOP, hillX + 150, 210 + (floor(hillX / 300) % 3) * 18, hillX + 300, FLOOR_TOP);
  }

  fill("#203337");
  const midOffset = (camera.x * 0.24) % 430;
  for (let hillX = -430 - midOffset; hillX < width + 430; hillX += 430) {
    triangle(hillX, FLOOR_TOP, hillX + 215, 285, hillX + 430, FLOOR_TOP);
  }

  fill("#17272d");
  const ruinOffset = (camera.x * 0.42) % 620;
  for (let ruinX = -620 - ruinOffset; ruinX < width + 620; ruinX += 620) {
    rect(ruinX + 278, FLOOR_TOP - 145, 78, 145);
    triangle(ruinX + 262, FLOOR_TOP - 145, ruinX + 317, FLOOR_TOP - 213, ruinX + 372, FLOOR_TOP - 145);
    rect(ruinX + 300, FLOOR_TOP - 98, 13, 22);
    rect(ruinX + 333, FLOOR_TOP - 98, 13, 22);
  }

  camera.on();
}

function updatePlayer() {
  const movingLeft = keyIsDown(65) || keyIsDown(LEFT_ARROW) || touchInput.left;
  const movingRight = keyIsDown(68) || keyIsDown(RIGHT_ARROW) || touchInput.right;
  const moveDirection = Number(movingRight) - Number(movingLeft);
  const jumpDown = keyIsDown(32) || touchInput.jump;

  if (moveDirection !== 0) {
    playerFacing = moveDirection;
    player.vel.x = moveDirection * 4.3;
    player.mirror.x = playerFacing < 0;
  } else {
    player.vel.x = 0;
  }

  grounded = false;
  for (const floorSegment of floorSegments) {
    if (player.colliding(floorSegment)) grounded = true;
  }

  if (jumpDown && !jumpWasDown && grounded) player.vel.y = -10;
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
  if (shieldFrames > 0) shieldFrames--;
  if (shieldCooldown > 0) shieldCooldown--;

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
  const roster = WAVE_ROSTERS[nextWaveIndex];
  const entryX = min(player.x + width * 0.3, BOSS_GATE_X - 250);
  for (let index = 0; index < roster.length; index++) {
    const enemyType = roster[index];
    const flying = enemyType === "wisp";
    const sprite = new Sprite(entryX + index * 70, flying ? FLOOR_TOP - 125 - (index % 2) * 40 : FLOOR_TOP - 25, flying ? 42 : 34, flying ? 38 : 48);
    sprite.collider = "none";
    sprite.visible = false;
    enemies.push({
      sprite,
      enemyType,
      healthValue: enemyType === "raider" ? 7 : enemyType === "hexer" ? 6 : 5,
      moveSpeed: enemyType === "wisp" ? 1.55 : enemyType === "hexer" ? 0.9 : 1.35,
      attackCooldown: random(35, 90),
      floatOffset: random(TWO_PI),
      hitFlash: 0,
      colorValue: enemyType === "wisp" ? "#8de0d4" : enemyType === "hexer" ? "#bd8be8" : "#b3b8a0"
    });
  }
  nextWaveIndex++;
}

function spawnBoss() {
  const sprite = new Sprite(BOSS_X, FLOOR_TOP - 52, 94, 100);
  sprite.collider = "none";
  sprite.visible = false;
  boss = { sprite, healthValue: 135, maxHealth: 135, moveSpeed: 0.8, attackCooldown: 80, hitFlash: 0 };
}

function updateEnemies() {
  for (let index = enemies.length - 1; index >= 0; index--) {
    const enemy = enemies[index];
    const gap = player.x - enemy.sprite.x;
    if (enemy.enemyType === "raider") {
      if (abs(gap) < 700) enemy.sprite.x += Math.sign(gap) * enemy.moveSpeed;
      enemy.sprite.y = FLOOR_TOP - enemy.sprite.h / 2;
    } else if (enemy.enemyType === "hexer") {
      if (abs(gap) > 310) enemy.sprite.x += Math.sign(gap) * enemy.moveSpeed;
      else if (abs(gap) < 205) enemy.sprite.x -= Math.sign(gap) * enemy.moveSpeed;
      enemy.sprite.y = FLOOR_TOP - enemy.sprite.h / 2;
    } else {
      const desiredGap = 285;
      if (abs(gap) > desiredGap) {
        const approachDistance = abs(gap) - desiredGap;
        enemy.sprite.x += Math.sign(gap) * min(enemy.moveSpeed, approachDistance);
      }
      enemy.sprite.x = constrain(enemy.sprite.x, 35, LEVEL_LENGTH - 35);
      enemy.sprite.y = FLOOR_TOP - 145 + sin(frameCount * 0.07 + enemy.floatOffset) * 24;
    }

    if (enemy.hitFlash > 0) enemy.hitFlash--;
    if (boxesOverlap(player.x, player.y, player.w * 0.72, player.h * 0.82, enemy.sprite.x, enemy.sprite.y, enemy.sprite.w * 0.78, enemy.sprite.h * 0.86)) {
      hurtPlayer(1, enemy.sprite.x);
    }

    if (enemy.attackCooldown > 0) enemy.attackCooldown--;
    if (enemy.enemyType !== "raider" && enemy.attackCooldown <= 0 && abs(gap) < 650) {
      fireHostileProjectile(enemy.sprite.x, enemy.sprite.y, enemy.enemyType === "wisp" ? 5.2 : 4.5, enemy.enemyType === "wisp" ? "#8de0d4" : "#cf8cff", 1);
      enemy.attackCooldown = enemy.enemyType === "wisp" ? random(100, 145) : random(75, 110);
    }
  }
}

function updateBoss() {
  if (!boss) return;
  const gap = player.x - boss.sprite.x;
  const bossPhase = boss.healthValue <= 45 ? 3 : boss.healthValue <= 90 ? 2 : 1;
  boss.moveSpeed = bossPhase === 3 ? 1.45 : bossPhase === 2 ? 1.05 : 0.8;
  if (abs(gap) < 760) boss.sprite.x += Math.sign(gap) * boss.moveSpeed;
  boss.sprite.y = FLOOR_TOP - boss.sprite.h / 2;
  if (boss.hitFlash > 0) boss.hitFlash--;
  if (boss.attackCooldown > 0) boss.attackCooldown--;
  if (boss.attackCooldown === 0) {
    const shotCount = bossPhase === 3 ? 7 : bossPhase === 2 ? 5 : 3;
    const spread = bossPhase === 3 ? 0.18 : 0.16;
    for (let shotIndex = 0; shotIndex < shotCount; shotIndex++) {
      const spreadAngle = (shotIndex - (shotCount - 1) / 2) * spread;
      fireHostileProjectile(boss.sprite.x - 28, boss.sprite.y - 20, bossPhase === 3 ? 7 : 6, "#ff875e", 1, spreadAngle);
    }
    boss.attackCooldown = bossPhase === 3 ? 58 : bossPhase === 2 ? 74 : 94;
  }
  if (boxesOverlap(player.x, player.y, player.w * 0.72, player.h * 0.82, boss.sprite.x, boss.sprite.y, boss.sprite.w * 0.72, boss.sprite.h * 0.82)) {
    hurtPlayer(2, boss.sprite.x);
  }
}

function fireHostileProjectile(originX, originY, speed, color, damage, spreadAngle = 0) {
  const aimAngle = atan2(player.y - originY, player.x - originX) + spreadAngle;
  hostileProjectiles.push({
    posX: originX,
    posY: originY,
    speedX: cos(aimAngle) * speed,
    speedY: sin(aimAngle) * speed,
    colorValue: color,
    damageValue: damage,
    radiusValue: 7,
    remainingFrames: 160
  });
}

function fireWeapon() {
  const weapon = WEAPONS[selectedWeapon];
  const originX = player.x + playerFacing * 30;
  const originY = player.y - 8;
  const target = getTargetInFacingDirection();
  const shotAngle = target
    ? atan2(target.y - originY, target.x - originX)
    : playerFacing < 0 ? PI : 0;

  projectiles.push({
    posX: originX,
    posY: originY,
    speedX: cos(shotAngle) * weapon.speed,
    speedY: sin(shotAngle) * weapon.speed,
    damageValue: weapon.damage,
    colorValue: weapon.color,
    radiusValue: weapon.radius,
    remainingFrames: 100
  });
  shotCooldown = weapon.cooldown;
}

function getTargetInFacingDirection() {
  let closestTarget = boss && (boss.sprite.x - player.x) * playerFacing > 0
    ? { x: boss.sprite.x, y: boss.sprite.y, distance: dist(player.x, player.y, boss.sprite.x, boss.sprite.y) }
    : null;

  for (const enemy of enemies) {
    if ((enemy.sprite.x - player.x) * playerFacing <= 0) continue;
    const targetDistance = dist(player.x, player.y, enemy.sprite.x, enemy.sprite.y);
    if (!closestTarget || targetDistance < closestTarget.distance) {
      closestTarget = { x: enemy.sprite.x, y: enemy.sprite.y, distance: targetDistance };
    }
  }

  return closestTarget;
}

function updateProjectiles() {
  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index];
    projectile.posX += projectile.speedX;
    projectile.posY += projectile.speedY;
    projectile.remainingFrames--;
    let hitTarget = false;

    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex];
      if (boxesOverlap(projectile.posX, projectile.posY, projectile.radiusValue * 2, projectile.radiusValue * 2, enemy.sprite.x, enemy.sprite.y, enemy.sprite.w, enemy.sprite.h)) {
        enemy.healthValue -= projectile.damageValue;
        enemy.hitFlash = 7;
        createHitEffect(projectile.posX, projectile.posY, projectile.colorValue, 9);
        if (enemy.healthValue <= 0) {
          createHitEffect(enemy.sprite.x, enemy.sprite.y, enemy.colorValue, 16);
          enemy.sprite.remove();
          enemies.splice(enemyIndex, 1);
        }
        hitTarget = true;
        break;
      }
    }

    if (!hitTarget && boss && boxesOverlap(projectile.posX, projectile.posY, projectile.radiusValue * 2, projectile.radiusValue * 2, boss.sprite.x, boss.sprite.y, boss.sprite.w, boss.sprite.h)) {
      boss.healthValue -= projectile.damageValue;
      boss.hitFlash = 7;
      createHitEffect(projectile.posX, projectile.posY, projectile.colorValue, 12);
      hitTarget = true;
      if (boss.healthValue <= 0) {
        createHitEffect(boss.sprite.x, boss.sprite.y, "#ffbd5b", 36);
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

function updateHostileProjectiles() {
  for (let index = hostileProjectiles.length - 1; index >= 0; index--) {
    const projectile = hostileProjectiles[index];
    projectile.posX += projectile.speedX;
    projectile.posY += projectile.speedY;
    projectile.remainingFrames--;
    const hitsPlayer = boxesOverlap(projectile.posX, projectile.posY, projectile.radiusValue * 2, projectile.radiusValue * 2, player.x, player.y, player.w * 0.8, player.h * 0.85);
    if (hitsPlayer) {
      hurtPlayer(projectile.damageValue, projectile.posX);
      createHitEffect(projectile.posX, projectile.posY, projectile.colorValue, 7);
    }
    if (hitsPlayer || projectile.remainingFrames <= 0 || abs(projectile.posX - player.x) > width * 1.5 || projectile.posY < -50 || projectile.posY > height + 50) {
      hostileProjectiles.splice(index, 1);
    }
  }
}

function createHitEffect(effectX, effectY, color, particleCount) {
  for (let index = 0; index < particleCount; index++) {
    const angle = random(TWO_PI);
    const speed = random(1.2, 4.8);
    hitEffects.push({
      posX: effectX,
      posY: effectY,
      speedX: cos(angle) * speed,
      speedY: sin(angle) * speed,
      colorValue: color,
      lifeValue: random(12, 24),
      maxLife: 24,
      radiusValue: random(2, 5)
    });
  }
}

function updateHitEffects() {
  for (let index = hitEffects.length - 1; index >= 0; index--) {
    const effect = hitEffects[index];
    effect.posX += effect.speedX;
    effect.posY += effect.speedY;
    effect.speedX *= 0.92;
    effect.speedY *= 0.92;
    effect.lifeValue--;
    if (effect.lifeValue <= 0) hitEffects.splice(index, 1);
  }
}

function updateCombat() {
  if (playerHealth <= 0 && gameState === "playing") {
    gameState = "lost";
    player.vel.x = 0;
    player.vel.y = 0;
    player.collider = "none";
  }
}

function hurtPlayer(damage, attackerX) {
  if (shieldFrames > 0 || damageCooldown > 0) return;
  playerHealth -= damage;
  createHitEffect(player.x, player.y, "#ff5d52", 10);
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
    if (enemy.hitFlash > 0) fill("#fff4d8");
    else fill(enemy.colorValue);

    if (enemy.enemyType === "wisp") {
      const flap = sin(frameCount * 0.25 + enemy.floatOffset) * 8;
      ellipse(0, 0, 25, 28);
      ellipse(-18, -flap, 18, 11);
      ellipse(18, flap, 18, 11);
      fill("#e9fff0");
      ellipse(-5, -3, 5, 7);
      ellipse(5, -3, 5, 7);
    } else if (enemy.enemyType === "hexer") {
      triangle(-17, 15, 0, -25, 17, 15);
      ellipse(0, -13, 20, 20);
      fill("#f4d0ff");
      ellipse(-5, -14, 4, 6);
      ellipse(5, -14, 4, 6);
      stroke("#e4b7ff");
      strokeWeight(3);
      line(17, -10, 23, 13);
    } else {
      fill("#27312c");
      ellipse(0, 0, 34, 40);
      fill(enemy.hitFlash > 0 ? "#fff4d8" : enemy.colorValue);
      rect(-12, -9, 24, 25, 4);
      fill("#d6bd8b");
      ellipse(0, -19, 20, 17);
      fill("#a3443c");
      rect(-15, -29, 30, 7, 2);
      fill("#ffdb8d");
      rect(-5, -20, 3, 3);
      rect(3, -20, 3, 3);
    }
    pop();
  }
}

function drawBoss() {
  if (!boss) return;
  push();
  translate(boss.sprite.x, boss.sprite.y);
  noStroke();
  fill(boss.hitFlash > 0 ? "#fff0c9" : "#512f36");
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

function drawHostileProjectiles() {
  noStroke();
  for (const projectile of hostileProjectiles) {
    fill(projectile.colorValue);
    circle(projectile.posX, projectile.posY, projectile.radiusValue * 2);
    fill("#fff0d6");
    circle(projectile.posX, projectile.posY, projectile.radiusValue);
  }
}

function drawHitEffects() {
  noStroke();
  for (const effect of hitEffects) {
    const alpha = 255 * effect.lifeValue / effect.maxLife;
    fill(red(effect.colorValue), green(effect.colorValue), blue(effect.colorValue), alpha);
    circle(effect.posX, effect.posY, effect.radiusValue * 2 * effect.lifeValue / effect.maxLife);
  }
}

function drawPlayerShield() {
  if (shieldFrames <= 0) return;
  push();
  noFill();
  stroke("#8fe9ff");
  strokeWeight(3);
  ellipse(player.x, player.y, player.w + 22, player.h + 22);
  pop();
}

function drawHud() {
  camera.off();
  noStroke();
  fill("#111b20e8");
  rect(14, 14, 360, 98, 5);
  fill("#f0d18a");
  textSize(14);
  text(`VITALITY  ${"◆ ".repeat(max(0, playerHealth))}`, 28, 38);
  fill("#e8e2d3");
  textSize(12);
  text(`WEAPON  ${WEAPONS[selectedWeapon].name}`, 28, 61);
  const progressText = boss ? "FINAL BOSS" : `WAVE ${max(1, nextWaveIndex)} / ${WAVE_CHECKPOINTS.length}`;
  text(progressText, 28, 80);
  const shieldStatus = shieldFrames > 0
    ? `ACTIVE  ${ceil(shieldFrames / 60)}s`
    : shieldCooldown > 0 ? `COOLDOWN  ${ceil(shieldCooldown / 60)}s` : "READY  [E]";
  fill(shieldFrames > 0 ? "#8fe9ff" : shieldCooldown > 0 ? "#a7afa7" : "#a6e09b");
  text(`SHIELD  ${shieldStatus}`, 28, 101);

  if (boss) {
    const barWidth = 250;
    fill("#111b20e8");
    rect(width - barWidth - 18, 18, barWidth, 34, 4);
    fill("#e8e2d3");
    text("EMBER KING", width - barWidth - 8, 14);
    fill("#6f3038");
    rect(width - barWidth - 10, 28, barWidth - 16, 13, 3);
    fill("#ef795f");
    rect(width - barWidth - 10, 28, (barWidth - 16) * max(0, boss.healthValue) / boss.maxHealth, 13, 3);
    fill("#e8e2d3");
    text(`PHASE ${boss.healthValue <= 45 ? 3 : boss.healthValue <= 90 ? 2 : 1}`, width - barWidth - 10, 67);
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

function keyPressed(event) {
  const pressedKey = typeof key === "string" ? key.toLowerCase() : "";
  const enterPressed = event.key === "Enter" || key === "Enter" || keyCode === 13;

  if (enterPressed) {
    if (gameState !== "playing") resetGameAndStart();
    return false;
  }

  if (key === "1") selectedWeapon = 0;
  if (key === "2") selectedWeapon = 1;
  if (key === "3") selectedWeapon = 2;
  if (pressedKey === "e") activateShield();
  if (keyCode === 32) return false;
}

function activateShield() {
  if (gameState !== "playing" || shieldCooldown > 0 || shieldFrames > 0) return;
  shieldFrames = SHIELD_DURATION;
  shieldCooldown = SHIELD_COOLDOWN;
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
      if (action === "shield") activateShield();
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