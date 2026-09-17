function setup() {
    createCanvas(800, 400);   // Background size (width x height)
    background("yellow");    // Background colour

    fill("black");    // Text colour
    textSize(24);   // Text size

    text("Hello", 50, 50);    // (string, x, y)

    // let age = 13;

    // if (age <= 9) {
    //     console.log("Lower Primary"); // print
    // } else if (age <= 12) {
    //     console.log("Upper Primary");
    // } else {
    //     console.log("Secondary");
    // }

    // for (let i = 2; i <= 20; i += 2) {
    //     console.log(i);
    //     yPos = 10 + (i * 10);
    //     text(i, 100, yPos);
    // }

    // let count = 0;

    // while (count < 10) {
    //     console.log(count); 
    //     count++;    // count += 1 or count = count + 1
    // }

    let groceries = ["apple", "bread", "milk"];

    groceries.push("orange");   // Append
    groceries.push("butter");

    // groceries.shift();

    groceries.splice(1, 1, "kaya");

    console.log(groceries);

    let yPos = 100;
    for (let item of groceries) {
        console.log(item);
        text(item, 400, yPos);
        yPos += 20;
    }
}

function draw() {
    // fill("red");
    // stroke("blue");
    // circle(width / 2, height / 2, 100);
}