// ====================================================
// Canvas and layout variables
// ====================================================

// Width of the webcam/game area.
let cameraWidth = 800;

// Height of the webcam/game area.
let cameraHeight = 450;

// Width of each side panel.
let sidePanelWidth = 220;

// Total canvas width = left panel + webcam area + right panel.
let totalCanvasWidth = cameraWidth + sidePanelWidth * 2;

// x-position where the webcam area starts.
let cameraX = sidePanelWidth;

// x-position of the left panel.
let leftPanelX = 0;
let leftPanelCenterX = sidePanelWidth / 2;

// x-position of the right panel.
let rightPanelX = sidePanelWidth + cameraWidth;
let rightPanelCenterX = rightPanelX + sidePanelWidth / 2;

// ML Model
let bodyPose;

// Array to store detected people
let detectedPeople = [];

// Game variables
let skeletonColour;
let player1Person;
let player2Person;
let player1Colour;
let player2Colour;

// Game assets
let bothHandsUpImage;
let leftHandUpImage;
let rightHandUpImage;
let handsOnHeadImage;
let tPoseImage;

// ====================================================
// Preload
// ====================================================

function preload(){
    // Load ml5 Body Pose model
    bodyPose = ml5.bodyPose("MoveNet", {flipped: true});

    // Load assets
    bothHandsUpImage = loadImage("assets/poseBattle_bothHandsUp.png");
    leftHandUpImage = loadImage("assets/poseBattle_leftHandUp.png");
    rightHandUpImage = loadImage("assets/poseBattle_rightHandUp.png");
    handsOnHeadImage = loadImage("assets/poseBattle_handsOnHead.png");
    tPoseImage = loadImage("assets/poseBattle_tpose.png");
}

// ====================================================
// Setup
// ====================================================

// setup() runs once at the start.
function setup() {
    // Set up canvas
    new Canvas(totalCanvasWidth, cameraHeight);

    // Set up video
    let constraints = {
        video: {
            width: cameraWidth,
            height: cameraHeight,
            aspectRatio: cameraWidth / cameraHeight
        },
        audio: false,
        flipped: true // makes the video mirrored
    };
    video = createCapture(constraints);
    video.hide();

    // Set up text.
    textAlign(CENTER, CENTER);

    // Set up model to detect using camera video then save results to array
    bodyPose.detectStart(video, gotPeople);

    // Set game variables
    skeletonColour = color(255, 255, 0); // color(r, g, b)
    player1Colour = color(255, 0, 0);
    player2Colour = color(0, 0, 255);
}


// ====================================================
// Main draw loop
// ====================================================

// draw() runs again and again.
function draw() {
    // Clear the canvas with a dark background.
    background(30);
    // Draw the side panels.
    drawUIPanel();
    // Draw the middle line that separates Player 1 and Player 2 areas.
    drawMiddleLine();

    // Draw video
    image(video, cameraX, 0, cameraWidth, cameraHeight);

    // Show number of people detected
    // drawDetectionStatus();

    // Test draw nose
    // if (detectedPeople.length > 0) {
    //     let person = detectedPeople[0];

    //     let x = person.nose.x + cameraX;
    //     let y = person.nose.y;
    //     fill(255, 0, 0);
    //     circle(x, y, 50);
    // }

    // Draw skeleton on all detected people
    //drawAllSkeletons();

    // Find and draw player1 and player2
    findPlayers();
    drawPlayerSkeletons();
    drawPlayerStatus();
}

// ====================================================
// Draw side UI panels
// ====================================================

// Draws the left and right UI panels.
function drawUIPanel() {
    // Remove outlines.
    noStroke();

    // Set panel colour.
    fill(20);

    // Draw left panel.
    rect(leftPanelX, 0, sidePanelWidth, cameraHeight);

    // Draw right panel.
    rect(rightPanelX, 0, sidePanelWidth, cameraHeight);

    // Set divider line colour.
    stroke(255, 180);

    // Set divider line thickness.
    strokeWeight(2);

    // Draw line between left panel and webcam.
    line(sidePanelWidth, 0, sidePanelWidth, cameraHeight);

    // Draw line between webcam and right panel.
    line(rightPanelX, 0, rightPanelX, cameraHeight);
}


// ====================================================
// Draw middle divider line
// ====================================================

// Draws the vertical line that separates Player 1 and Player 2.
function drawMiddleLine() {
    // Set line colour to white with transparency.
    stroke(255, 180);

    // Set line thickness.
    strokeWeight(2);

    // Draw the middle line inside the webcam area.
    line(width / 2, 0, width / 2, cameraHeight);
}

// Callback function for when bodyPose outputs data
function gotPeople(results) {
  // save the coordinates of people it detects to the array
  detectedPeople = results;
}

// Debug info
function drawDetectionStatus() {
    fill(0);
    textSize(24);
    text("People Detected: " + detectedPeople.length, width / 2, height * 0.1);
    console.log(detectedPeople);
}

// Check confidence value of keypoint
function pointIsReady(point) {
    // Check if point exists
    if (point == null || point == undefined) {
        return false;
    }
    // Use point if confidence is high enough
    if (point.confidence > 0.25) {
        return true;
    } else {
        return false;
    }
}

// Draw a line between two body points
function drawBodyLine(point1, point2) {
    // Check if point is detected confidently
    if (pointIsReady(point1) && pointIsReady(point2)) {
        // Draw line between point1 and point2
        line(point1.x + cameraX, point1.y, point2.x + cameraX, point2.y);
    }
}

// Draw circle on body point
function drawBodyPoint(point) {
    // Check if point is detected confidently
    if (pointIsReady(point)) {
        // Draw circle on point
        circle(point.x + cameraX, point.y, 10);
    }
}

// Draws one person's skeleton.
function drawSkeleton(person, skeletonColour) {
    // Set skeleton line colour.
    stroke(skeletonColour);

    // Set skeleton line thickness.
    strokeWeight(3);

    // Draw shoulder line.
    drawBodyLine(person.left_shoulder, person.right_shoulder);

    // Draw left upper arm.
    drawBodyLine(person.left_shoulder, person.left_elbow);

    // Draw left lower arm.
    drawBodyLine(person.left_elbow, person.left_wrist);

    // Draw right upper arm.
    drawBodyLine(person.right_shoulder, person.right_elbow);

    // Draw right lower arm.
    drawBodyLine(person.right_elbow, person.right_wrist);

    // Draw left body side.
    drawBodyLine(person.left_shoulder, person.left_hip);

    // Draw right body side.
    drawBodyLine(person.right_shoulder, person.right_hip);

    // Draw hip line.
    drawBodyLine(person.left_hip, person.right_hip);

    // Remove outlines for the body point circles.
    noStroke();

    // Set circle colour.
    fill(skeletonColour);

    // Draw important body points.
    drawBodyPoint(person.nose);
    drawBodyPoint(person.left_shoulder);
    drawBodyPoint(person.right_shoulder);
    drawBodyPoint(person.left_elbow);
    drawBodyPoint(person.right_elbow);
    drawBodyPoint(person.left_wrist);
    drawBodyPoint(person.right_wrist);
    drawBodyPoint(person.left_hip);
    drawBodyPoint(person.right_hip);
}

function drawAllSkeletons() {
    // Loop through array of detected people
    for (let i = 0; i < detectedPeople.length; i++) {
        // For each person detected draw a skeleton
        let person = detectedPeople[i];

        drawSkeleton(person, skeletonColour);
    }
}

// Check the positions of each player and assign their team
function findPlayers() {
    // Reset who player1 and player2 is before checking
    player1Person = null;
    player2Person = null;

    // Save closest distance from player1Center and player2Center
    let closestPlayer1Distance = Number.MAX_VALUE;
    let closestPlayer2Distance = Number.MAX_VALUE;

    let player1CenterX = cameraWidth / 4 + cameraX;
    let player2CenterX = cameraWidth / 4 * 3 + cameraX;

    let cameraCenterX = cameraWidth / 2 + cameraX;

    for (let i = 0; i < detectedPeople.length; i++) {
        // Loop through detected people and get their nose position
        let person = detectedPeople[i];
        let nose = person.nose;

        // Check if nose detected clearly
        if (pointIsReady(nose)) {
            // Offset nose position
            let noseX = nose.x + cameraX;

            // Check if person is on the left
            if (noseX < cameraCenterX) {
                // Calculate distance from player1Center
                let distanceFromPlayer1Center = abs(noseX - player1CenterX);
                if (distanceFromPlayer1Center < closestPlayer1Distance) {
                    // Set closest person to be player1
                    player1Person = person;
                    closestPlayer1Distance = distanceFromPlayer1Center;
                }
            } else {
                // If person is on the right
                // Calculate distance from player2Center
                let distanceFromPlayer2Center = abs(noseX - player2CenterX);
                if (distanceFromPlayer2Center < closestPlayer2Distance) {
                    // Set closest person to be player2
                    player2Person = person;
                    closestPlayer2Distance = distanceFromPlayer2Center;
                }
            }
        }
    }
}

// Draw player1 and player2 skeleton
function drawPlayerSkeletons() {
    // Check if player1 exists
    if (player1Person != null) {
        drawSkeleton(player1Person, player1Colour);
    }
    // Check if player2 exists
    if (player2Person != null) {
        drawSkeleton(player2Person, player2Colour);
    }
}

// Draw info for player1 and player2 in the side panels
function drawPlayerStatus() {
    noStroke(); // Remove text outline
    textSize(28);
    
    // Check if player1 exists
    if (player1Person != null) {
        fill(player1Colour); // Text colour
        text("Detected", leftPanelCenterX, height / 2);
    }

    // Check if player2 exists
    if (player2Person != null) {
        fill(player2Colour); // Text colour
        text("Detected", rightPanelCenterX, height / 2);
    }
}