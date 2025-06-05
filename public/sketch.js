let xScale = 0.015;
let yScale = 0.02;
let zOffset = 0;

let gap = 5;
let cols, rows;
let previousNoise = [];

let teamAScore = 0;
let teamBScore = 0;
let roundNumber = 1;

let teamAName = "Headnoise";
let teamBName = "Dosalona";

let energyBursts = [];
let teamAColor, teamBColor;
let currentAuraColor, targetAuraColor;

let showIntroScreen = true;
let showScore = true;


function setup() {
  createCanvas(600, 600);
  noStroke();
  frameRate(30);
  colorMode(HSB, 360, 100, 100, 255);

  cols = floor(width / gap);
  rows = floor(height / gap);

  for (let i = 0; i < cols; i++) {
    previousNoise[i] = [];
    for (let j = 0; j < rows; j++) {
      previousNoise[i][j] = 0;
    }
  }

  teamAColor = color(220, 80, 100, 255); // Blue
  teamBColor = color(120, 80, 100, 255); // Green
  currentAuraColor = teamBColor;
  targetAuraColor = teamBColor;
}

function draw() {
  if (showIntroScreen) {
    background(0, 0, 10);
    fill(0, 0, 100);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("Press 'A' to give a point to " + teamAName + "\n" +
         "Press 'L' to give a point to " + teamBName + "\n" +
         "Press SPACE to start\nOnce started, press SPACE to show/hide the score", width / 2, height / 2);
    return;
  }

  background(0, 0, 10, 40);

  let totalScore = teamAScore + teamBScore;
  let dominance = teamAScore / (totalScore || 1);
  targetAuraColor = lerpColor(teamBColor, teamAColor, dominance);

  let h = lerp(hue(currentAuraColor), hue(targetAuraColor), 0.05);
  let s = lerp(saturation(currentAuraColor), saturation(targetAuraColor), 0.05);
  let b = lerp(brightness(currentAuraColor), brightness(targetAuraColor), 0.05);
  let a = lerp(alpha(currentAuraColor), alpha(targetAuraColor), 0.05);
  currentAuraColor = color(h, s, b, a);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * gap + gap / 2;
      let y = j * gap + gap / 2;

      let noiseVal = noise(x * xScale, y * yScale, zOffset);
      previousNoise[i][j] = lerp(previousNoise[i][j], noiseVal, 0.1);

      let diameter = previousNoise[i][j] * gap * map(totalScore, 0, 20, 1, 2, true);

      fill(hue(currentAuraColor), saturation(currentAuraColor), brightness(currentAuraColor), 120 + noiseVal * 60);
      circle(x, y, diameter);
    }
  }

  zOffset += map(totalScore, 0, 20, 0.002, 0.02, true);

  strokeWeight(1.5);
  for (let i = energyBursts.length - 1; i >= 0; i--) {
    let b = energyBursts[i];

    if (b.fadingOut) {
      b.col.setAlpha(alpha(b.col) - 3);
    }

    stroke(hue(b.col), saturation(b.col), brightness(b.col), alpha(b.col));
    noFill();
    beginShape();
    for (let j = 0; j < b.path.length; j++) {
      let p = b.path[j];
      let t = frameCount * 0.05 + b.noiseOffset + j;

      let nX = noise(p.baseX * 0.01, p.baseY * 0.01, t);
      let nY = noise(p.baseX * 0.01 + 100, p.baseY * 0.01 + 100, t);

      p.offsetX = map(nX, 0, 1, -40, 40);
      p.offsetY = map(nY, 0, 1, -40, 40);

      let px = p.baseX + p.offsetX;
      let py = p.baseY + p.offsetY;
      curveVertex(px, py);

      p.history.unshift({ x: px, y: py });
      if (p.history.length > 10) p.history.pop();
    }
    endShape();

    for (let p of b.path) {
      for (let t = 0; t < p.history.length; t++) {
        let ghost = p.history[t];
        fill(hue(b.col), saturation(b.col), brightness(b.col), 50 - t * 4);
        noStroke();
        circle(ghost.x, ghost.y, 3);
      }
    }

    if (alpha(b.col) <= 0) {
      energyBursts.splice(i, 1);
    }
  }

  // Title and round display
  fill(0, 0, 100);
  textSize(20);
  textAlign(CENTER, TOP);
  text("Round " + roundNumber, width / 2, 10);

  // Score display
  if (showScore) {
  textSize(75);
  text(teamAScore + " - " + teamBScore, width / 2, 40);
}
}

function spawnEnergyBursts(teamColor, teamName) {
  for (let i = 0; i < 5; i++) {
    let start = { x: width / 2, y: height / 2 };
    let end = randomEdgePoint();
    let path = [];

    let segments = 10;
    for (let j = 0; j <= segments; j++) {
      let t = j / segments;
      let x = lerp(start.x, end.x, t);
      let y = lerp(start.y, end.y, t);
      path.push({ baseX: x, baseY: y, offsetX: 0, offsetY: 0, history: [] });
    }

    let h = (hue(teamColor) + random(-10, 10) + 360) % 360;
    let s = constrain(saturation(teamColor) + random(-10, 10), 60, 100);
    let b = constrain(brightness(teamColor) + random(-10, 10), 60, 100);
    let alphaVal = 220;
    let variedColor = color(h, s, b, alphaVal);

    energyBursts.push({
      path,
      col: variedColor,
      burstSpeed: 10,
      noiseOffset: random(1000),
      team: teamName,
      fadingOut: false
    });
  }
}

function fadeOpposingTeam(teamName) {
  for (let i = energyBursts.length - 1; i >= 0; i--) {
    let burst = energyBursts[i];
    if (burst.team !== teamName) {
      burst.fadingOut = true;
    }
  }
}

function randomEdgePoint() {
  let edge = floor(random(4));
  if (edge === 0) return { x: floor(random(width)), y: 0 };
  if (edge === 1) return { x: width - 1, y: floor(random(height)) };
  if (edge === 2) return { x: floor(random(width)), y: height - 1 };
  if (edge === 3) return { x: 0, y: floor(random(height)) };
}

function keyPressed() {
  if (showIntroScreen && key === ' ') {
    showIntroScreen = false;
    return;
  }

  if (!showIntroScreen && key === ' ') {
    showScore = !showScore;
    return;
  }

  if (key === 'a') {
    if (teamAScore < teamBScore) {
      fadeOpposingTeam(teamBName);
    }
    teamAScore++;
    spawnEnergyBursts(teamAColor, teamAName);
  }

  if (key === 'l') {
    if (teamBScore < teamAScore) {
      fadeOpposingTeam(teamAName);
    }
    teamBScore++;
    spawnEnergyBursts(teamBColor, teamBName);
  }

  if (key === 'r') {
    roundNumber++;
    teamAScore = 0;
    teamBScore = 0;
    energyBursts = [];
  }
}

