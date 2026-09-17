let handPose;   // ML Model
let video;      // Webcam video
let videoW = 640;
let videoH = 480;
let hands = []; // global variable to store hands

// Game sprites
let fingerTip;
let balloon;
let leftWall, rightWall, topWall, botWall;

// Game variables
let gameStart = false;
let gameOver = false;

function preload() {
  // Create options for model settings
  let options = {
    flipped: true,
    runtime: "tfjs",
    modelType: "full",
    detectorModelUrl: undefined, //default to use the tf.hub model
    landmarkModelUrl: undefined //default to use the tf.hub model
  }

  // Load the handPose model
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(videoW, videoH);
  world.gravity.y = 5;

  let constraints = {
    video: {
      mandatory: {
        minWidth: videoW,
        minHeight: videoH,
      },
      optional: [{ minFrameRate: 60 }],
    },
    audio: false,
    flipped: true // makes the video mirrored
  };

  // Create the webcam video and hide it
  video = createCapture(constraints);
  video.size(640, 480);
  video.hide();
  // start detecting hands from the webcam video + model
  handPose.detectStart(video, gotHands);

  // Game sprites
  fingerTip = new Sprite();
  fingerTip.diameter = 60;
  fingerTip.collider = "none"; // No physics but collidable - hide for now
  fingerTip.color = "rgba(0, 255, 0, 0.05)"; // a = transparency
  fingerTip.visible = false; // Hide for now

  balloon = new Sprite();
  balloon.x = width / 2;
  balloon.y = height * 0.4; // Top 10% of canvas
  balloon.diameter = 80;
  balloon.collider = "none"; // Not in use yet
  balloon.color = "rgba(255, 225, 0, 0.9)";
  // balloon.bounciness = 0.8; // 1 = perfect elasticity
  // balloon.mass = 5;
  // balloon.drag = 0.2;

  // Boundary walls
  leftWall = new Sprite();
  leftWall.x = 0;
  leftWall.y = height / 2;
  leftWall.width = 5;
  leftWall.height = height;
  leftWall.collider = "static";
  //leftWall.visible = false;
  
  rightWall = new Sprite();
  rightWall.x = width;
  rightWall.y = height / 2;
  rightWall.width = 5;
  rightWall.height = height;
  rightWall.collider = "static";

  topWall = new Sprite();
  topWall.x = width / 2;
  topWall.y = 0;
  topWall.width = width;
  topWall.height = 5;
  topWall.collider = "static";

  botWall = new Sprite();
  botWall.x = width / 2;
  botWall.y = height;
  botWall.width = width;
  botWall.height = 5;
  botWall.collider = "static";
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, videoW, videoH);

  // Start menu
  if (gameStart === false) {
    textSize(40);
    textAlign(CENTER, CENTER); // horizontal, vertical alignment
    fill("rgb(0, 255, 20)");
    text("Bounce the Ball", width / 2, height * 0.1); // (text, x, y)
    fill("rgb(0, 200, 20)");
    textSize(28);
    text("Use Index Finger to bounce the Ball!", width / 2, height * 0.2);
    text("Press Space to start the game.", width / 2, height * 0.3);
  } else {
    // Draw all the tracked hand points
    // Loop through all the hands detected (can detect left or right)
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i]; // current hand (left or right)

      // Keypoint 8 = INDEX_FINGER_TIP
      let keypoint = hand.keypoints[8];

      // make sprite follow finger tip position
      fingerTip.x = keypoint.x;
      fingerTip.y = keypoint.y;
    }
  }
  
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}

function keyPressed() {
  // Start game key
  if (key === " ") {
    gameStart = true;

    balloon.collider = "dynamic";
    balloon.bounciness = 0.8; // 1 = perfect elasticity
    balloon.mass = 5;
    balloon.drag = 0.2;
  }
}