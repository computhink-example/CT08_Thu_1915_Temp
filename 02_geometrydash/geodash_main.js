// player box
let player;    // Player sprite
let cube;   // Image for player sprite
let bg;     // Background image

// game variables
const TILE_SIZE = 50;
let tileMap1;   // Tile map for level design
let spike;  // Image for spike sprite
let playerJump = 0;

// world building groups
let ground;
let spikes;
let orbs;
let finishLine;

// image sprites


// menu


// sound assets


function preload() {
    cube = loadImage("assets/cube.png");
    bg = loadImage("assets/geobg.png");
    tileMap1 = loadStrings("stages/tiles1.txt");
    spike = loadImage("assets/spike.png");
}

function setup() {
  new Canvas(700, 600);
  world.gravity.y = 32;

  // Create player sprite
  startCoordinate = [TILE_SIZE, height - TILE_SIZE / 2];
  player = new Sprite(startCoordinate[0], startCoordinate[1], TILE_SIZE ,TILE_SIZE);  // (x, y, width, height)
  player.img = cube; // Load sprite image
  player.friction = 0;
  player.bounciness = 0;
  player.collider = "dynamic";  // Movable and affected by physics

  // Ground sprites group
  ground = new Group();
  ground.tile = "g";    // "g" represents ground in tile map
  ground.w = TILE_SIZE; // Width
  ground.h = TILE_SIZE; // Height
  ground.color = "black";
  ground.stroke = "white";  // Outline colour
  ground.collider = "static"; // It will not move

  // Spikes sprites group
  spikes = new Group();
  spikes.tile = "s";
  spikes.w = TILE_SIZE;
  spikes.h = TILE_SIZE;
  spikes.img = spike;
  spikes.collider = "static";

  // Orbs sprites group
  orbs = new Group();
  orbs.tile = "o";
  orbs.d = 24;  // Diameter
  orbs.collider = "static";
  orbs.color = "#fff53b";
  orbs.strokeWeight = 0;  // Outline thickness

  // Finish line group
  finishLine = new Group();
  finishLine.tile = "f";
  finishLine.w = TILE_SIZE;
  finishLine.h = height * 2;
  finishLine.collider = "static";
  finishLine.color = "orange";
  finishLine.visible = true;

  // Create tiles using tile groups
  new Tiles(tileMap1, 0, 0, TILE_SIZE, TILE_SIZE);  // (map, x, y, width, height)
}

function draw() {
  clear();  // Erase the previous frame before drawing the next
  image(bg, 0, 0, 800, 600);    // (image, x, y, width, height)

  player.vel.x = 8; // Positive x = moving right

  // Camera movement
  if (player.x >= width / 2) {
    // Follow player when it reaches the middle of screen
    camera.x = player.x;
  } else {
    // Stay in the middle
    camera.x = width / 2
  }

  // Jump input
  if ((kb.presses("space") || mouse.presses("left")) && playerJump == 0) {
    player.vel.y = -8;  // Negative y = moving up
    player.rotateTo(player.rotation + 359, 15); // (direction, speed)

    // Increment jump count
    playerJump++;
  }

  // Reset jump count when touching ground
  if (player.collides(ground)) {
    playerJump = 0;
  }

  // Collision with obstacles
  if (player.collides(spikes)) {
    resetGame();
  }

  // Loop through ground tiles
  for (let tile of ground) {
    if (player.collides(tile)) {
      let leftEdge = tile.x - tile.w / 2; // Calculate left edge
      let leftEdgeHeight = tile.y - tile.h / 2; // Calculate top edge
      
      // If player collides with left edge of ground tile
      if (player.x < leftEdge && player.y > leftEdgeHeight) {
        resetGame();
      }
    }
  }
}

function resetGame() {
  // Reset player position
    player.x = startCoordinate[0];
    player.y = startCoordinate[1];

    // Reset player rotation
    player.rotation = 0;

    // Reset player jump
    playerJump = 0;

    // Reset camera
    camera.x = width / 2;
}