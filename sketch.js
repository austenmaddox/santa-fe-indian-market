// Santa Fe Indian Market Network
let nodes;
let links;

// timeline
let startYear = 1922;
let endYear = 1931;
let sliderX, sliderY, sliderW;
let sliderPos;
let currentYear;

// timeline annotations - key takeaways by year
let timelineAnnotations;

// camera
let camX = 0, camY = 0;
let zoomLevel = 1.0;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4.0;

// dragging state
let draggingSlider = false;
let panning = false;
let panLastX, panLastY;
let pointerDownX, pointerDownY;
let pointerDownWorld;
let candidateClickNode = null;
let movedSincePress = false;

// info panel
let infoNode = null;

// LAYOUT
const HEADER_HEIGHT = 150;
const TOP_MARGIN = 20;
const NODE_RADIUS = 18;
const LABEL_SPACE = 10;
const SAFETY_MARGIN = 30;

// ---- NETWORK BOUNDS (world coords) ----
let worldLeft = 0;
let worldRight = 1000;
let worldTop = 0;
let worldBottom = 0; // calculated in setup

// ==========================================================
// NODE & LINK CLASSES
// ==========================================================
class Node {
  constructor(name, x, y, year, category, description) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.r = 18;
    this.years = [year];
    this.categoryByYear = new Map();
    this.categoryByYear.set(year, category);
    this.descriptionByYear = new Map();
    this.descriptionByYear.set(year, description);
  }

  addYear(year, category, description) {
    if (!this.years.includes(year)) {
      this.years.push(year);
    }
    this.categoryByYear.set(year, category);
    this.descriptionByYear.set(year, description);
  }

  isActiveInYear(year) {
    return this.years.includes(year);
  }

  getCategory(year) {
    if (this.categoryByYear.has(year)) {
      return this.categoryByYear.get(year);
    }
    return this.categoryByYear.get(this.years[0]);
  }

  getDescription(year) {
    if (this.descriptionByYear.has(year)) {
      return this.descriptionByYear.get(year);
    }
    return this.descriptionByYear.get(this.years[0]);
  }

  display(activeYear) {
    if (this.isActiveInYear(activeYear)) {
      stroke(17);
      strokeWeight(1.5);
      fill(229, 71, 36);
    } else {
      stroke(100);
      strokeWeight(1);
      fill(17);
    }

    ellipse(this.x, this.y, this.r * 2, this.r * 2);

    noStroke();
    fill(17);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(this.name, this.x, this.y - this.r - 10);
  }
}

class Link {
  constructor(a, b, year) {
    this.a = a;
    this.b = b;
    this.year = year;
  }
}

// ==========================================================
// SETUP
// ==========================================================
function setup() {
  createCanvas(windowWidth, 810);
  smooth();

  sliderX = 120;
  sliderY = height - 90;
  sliderW = width - 2 * sliderX;
  sliderPos = sliderX;
  currentYear = startYear;

  timelineAnnotations = new Map();
  timelineAnnotations.set(
    1923,
    "The fair activities are well documented this year. The museum sent invites to many communities to encourage participation."
  );
  timelineAnnotations.set(
    1927,
    "For 1927, not at the prize winners are known, but it is known that San Ildefonso pottery outsold everything else. Traders were allowed to make sells during this fair."
  );
  timelineAnnotations.set(
    1928,
    "This year had a small fair, but it was still successful."
  );
  timelineAnnotations.set(
    1931,
    "1931 was the last year the fair was held in this format. After this, the fair went into communities. Uniquely at this fair, significant amounts of work were purchased ahead of the fair in part because of preparation for the Exposition of Indian Tribal Arts. "
  );

  let clearanceNeeded = NODE_RADIUS + LABEL_SPACE + SAFETY_MARGIN;
  let nodeMaxScreenY = sliderY - clearanceNeeded;
  worldBottom = nodeMaxScreenY - HEADER_HEIGHT;

  nodes = [];
  links = [];

  // Calculate proportional positions based on canvas width
  let w = width;
  
  nodes.push(new Node("Kenneth Chapman", w * 0.65, 400, 1922, "Santa Fe, NM", "Chapman was the curator at the Museum of New Mexico during the museum's sponsorship of the market. In the first fair, he was also a judge for the prizes. He was also a founding memeber of the Indian Arts Fund. "));
  nodes.push(new Node("Turine B. Boone", w * 0.17, 480, 1922, "Santa Fe, NM", "He was the assistant commissioner at the Bureau of Indian Affairs. At the first fair, he stated that a revival in Indian arts and crafts would aid in the assimilation of Native Americans and make them productive citizens. "));
  nodes.push(new Node("John DeHuff", w * 0.40, 150, 1922, "Santa Fe, NM", "He served as a judge for the prizes during the first fair and was the superintendent of the Santa Fe Indian School."));
  nodes.push(new Node("Lansing Bloom", w * 0.27, 150, 1922, "Santa Fe, NM", "Bloom was the assistant director of the Museum of New Mexico and served as the superintendent of exhibitions. His role was to accept the entries and pay out prize money."));
  nodes.push(new Node("Rose Dougan", w * 0.10, 280, 1922, "Santa Fe, NM", "Dougan was a patron of the Museum of New Mexico and donated a $1000 bond which the museum used to pay prize money."));
  nodes.push(new Node("Alfonso Roybal", w * 0.534, 290, 1922, "San Ildefonso", "He was from San Ildefonso Pueblo and won $25 for having the best collection of paintings in water color owned and painted by Indians. $25 was significant compared to the other individual prize winnings at $5 and $3"));
  nodes.push(new Node("Indian Fair Comittee", w * 0.55, 100, 1927, "Santa Fe, NM", "Up until 1926, the Musuem of New Mexico was running the fairs. In 1927, the Indian Fair Committee took over, but ran the fair in the same format as the museum with prizes and sales."));
  nodes.push(new Node("Santiago Naranjo", w * 0.47, 320, 1923, "Santa Fe, NM", "At the 1923 fair, Santiago Naranjo gave the oratory alongside John DeHuff. Naranjo was the governor of Santa Clara Pueblo"));
  nodes.push(new Node("Lakota beadwork", w * 0.65, 150, 1922, "Fort Peck Reservation", "Grand prize winner at the first fair. "));
  nodes.push(new Node("Odd Halseth", w * 0.20, 320, 1924, "Santa Fe, NM", "Preparing for the 1924 fair, the Museum of New Mexico sent Odd Halseth who emigrated from Norway to inquire on Jemez pottery. He found only a few women in this community had learned pottery-making when they were young but were not engaged with it at present."));
  nodes.push(new Node("Leonore Baca", w * 0.75, 240, 1924, "Jemez", "Fair organizers aimed to stimulate pottery creation by Jemez women and the work appeared at the 1924 fair. Leonore Baca won a total of $8 for first and second place prizes. After this, Baca continued to show at the fairs."));
  nodes.push(new Node("Tsianina", w * 0.15, 419, 1923, "Santa Fe, NM, National Guard Armory", "A Cherokee singer who who first performed during the 1923 fair and was present at subsequent fairs."));
  
  let tonitaRoybal = new Node("Tonita Roybal", w * 0.10, 410, 1923, "San Ildefonso", "Tonita Roybal was second prize winner for best single speciment of any new type, entire field of competition and was awarded $3.");
  tonitaRoybal.addYear(1928, "San Ildefonso", "Won first place at this fair.");
  tonitaRoybal.addYear(1929, "San Ildefonso", "Earned $93.15 in sales.");
  tonitaRoybal.addYear(1930, "San Ildefonso", "Took home $90.50 in sales.");
  nodes.push(tonitaRoybal);
  
  let mariaMartinez = new Node("Maria Martinez", w * 0.465, 460, 1923, "San Ildefonso", "The first prize for best single speciment of any new type, entire field of competition went to Maria Martinez. It is likely the prize money was $5 for this award. However, in all at this fair Martinez took home $385 in sales and prizes.");
  mariaMartinez.addYear(1927, "San Ildefonso", "Martinez won $3 for the second place prize.");
  mariaMartinez.addYear(1928, "San Ildefonso", "During this fair, Martinez won two prizes. She was awarded second place and recieved $10 for being the best-dressed Pueblo woman.");
  mariaMartinez.addYear(1929, "San Ildefonso", "In total, she took home $176.25.");
  mariaMartinez.addYear(1930, "San Ildefonso", "Earned $152 in sales, but this number likely included sales by her sisters.");
  nodes.push(mariaMartinez);
  
  let edgarLeeHewett = new Node("Edgar Lee Hewett", w * 0.80, 150, 1922, "Santa Fe, NM", "Hewett was the director of the Museum of New Mexico and the founder of the School of American Archaelogy. In 1922, the Museum of New Mexico sponsored the first market under his direction. Upon the opening of the market, Hewett stated, The hour has arrived.");
  edgarLeeHewett.addYear(1926, "Santa Fe, NM", "Hewett removed the Museum from further participation after this fair.");
  nodes.push(edgarLeeHewett);
  
  let lufinaBaca = new Node("Lufina Baca", w * 0.65, 280, 1927, "Santa Clara", "Earned $43.25 in sales. A singular pot went for $25.");
  lufinaBaca.addYear(1928, "Santa Clara", "Won for best undecorated pot over fifty inches in circumference.");
  lufinaBaca.addYear(1929, "Santa Clara", "Earned $28 in sales.");
  lufinaBaca.addYear(1930, "Santa Clara", "Earned $28 in sales.");
  nodes.push(lufinaBaca);
  
  nodes.push(new Node("Wesley Bradfield", w * 0.70, 450, 1922, "Santa Fe, NM", "Wesley Bradfield was a founding member of the Indian Arts Fund. He was also judge for the prizes during the first fair and an employee at the Museum of New Mexico. "));
  nodes.push(new Node("Indian Arts Fund", w * 0.40, 360, 1922, "Santa Fe, NM", "This group which was originally named Indian Pottery Fund had the purpose of aiding native arts through collecting and educating."));
  nodes.push(new Node("Susana Aguilar", w * 0.25, 380, 1927, "San Ildefonso", "First place recipient at the 1927 and was awarded $5. She sold $44 worth of pottery"));
  nodes.push(new Node("Tesuque people", w * 0.31, 400, 1923, "Santa Fe, NM", "Performed a buffalo dance."));
  nodes.push(new Node("Santo Domingo", w * 0.254, 40, 1923, "Santa Fe, NM", "Performed a Comanche dance."));
  nodes.push(new Node("Cochiti", w * 0.33, 260, 1923, "Santa Fe, NM", "Performed an antelope-hunting dance."));
  nodes.push(new Node("Crucita Trujillo", w * 0.17, 240, 1931, "Ohkay Owingeh", "Won the award of new style of pottery. This style was devloped by eight Ohkay Owingeh potters."));
  nodes.push(new Node("Ramona Gonzales", w * 0.65, 80, 1930, "San Ildefonso", "In the sale record for the first time at this fair."));
  nodes.push(new Node("Tomasita Montoya", w * 0.71, 110, 1930, "Ohkay Owingeh", "In the sale record for the first time at this fair."));
  nodes.push(new Node("Petrusina Naranjo", w * 0.72, 340, 1930, "Ohkay Owingeh", "Won for pottery in their first fair."));
  nodes.push(new Node("Manuelita Cruz", w * 0.80, 50, 1928, "Ohkay Owingeh", "Won for pottery in their first fair."));
  nodes.push(new Node("Rose Gonzales", w * 0.18, 90, 1930, "San Ildefonso", "In the sale record for the first time at this fair."));
  nodes.push(new Node("Van Gutierrez", w * 0.45, 200, 1930, "Santa Clara", "In the sale record for the first time at this fair."));
  nodes.push(new Node("Martha White", w * 0.90, 110, 1927, "Santa Fe, NM", "Martha loaned the Indian Fair Committee $500 to aid in covering costs of their first fair."));
  nodes.push(new Node("Amelia White", w * 0.10, 110, 1927, "Santa Fe, NM", "Indian Fair Committee member and donated towards their first fair."));
  nodes.push(new Node("Mary Wheelwright", w * 0.87, 230, 1927, "Santa Fe, NM", "Indian Fair Committee member and donated towards their first fair."));
  nodes.push(new Node("Margretta Dietrich", w * 0.06, 70, 1927, "Santa Fe, NM", "President of Indian Fair Committee."));
  nodes.push(new Node("Sells Agency", w * 0.567, 429, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Southern Pueblo Agency", w * 0.40, 70, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Pima Agency", w * 0.79, 400, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Pueblo Bonito Agency", w * 0.33, 110, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Pipesteam School", w * 0.95, 320, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Salt River Agency", w * 0.60, 200, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Navajo Agency at Fort Defiance", w * 0.90, 480, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Santa Fe Indian School", w * 0.32, 200, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Mount Pleasant School", w * 0.89, 360, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));
  nodes.push(new Node("Phoenix Indian School", w * 0.06, 240, 1923, "", "The organizers of the 1923 fair sent invites to various schools and agencies asking for their participation. This group sent an exhibit. "));

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      links.push(new Link(nodes[i], nodes[j], 0));
    }
  }

  sliderPos = map(startYear, startYear, endYear, sliderX, sliderX + sliderW);
}

// ==========================================================
// DRAW
// ==========================================================
function draw() {
  background(236, 227, 204);

  noStroke();
  fill(246, 239, 224);
  rect(0, 0, width, HEADER_HEIGHT, 0, 0, 6, 6);

  fill(229, 71, 36);
  textAlign(LEFT, TOP);
  textSize(32);
  text("Santa Fe Indian Market — The Early Years", 20, 20);

  textSize(16);
  text(
    "The Santa Fe Indian Market began in 1922 at the Museum of New Mexico's direction under Edgar Lee Hewett. "
    + "The fair was designed to coincide with the Santa Fe Fiesta that occurs in September. "
    + "Fair organizers would send requests for exhibits to agencies and schools. "
    + "In the beginning, individual entries were not welcomed. Instead tribes/nations were "
    + "representatives of the objects. The web below allows viewers to explore the connections within "
    + "the early years of the fair. This project heavily relies on the research completed by "
    + "Bruce Bernstein in Santa Fe Indian Market: A history of native arts and the marketplace.",
    20, 60, width - 40, 300
  );

  push();
  translate(camX, camY + HEADER_HEIGHT);
  scale(zoomLevel);

  strokeWeight(2);
  for (let L of links) {
    if (L.a.isActiveInYear(currentYear) && L.b.isActiveInYear(currentYear)) {
      stroke(240, 167, 138);
      line(L.a.x, L.a.y, L.b.x, L.b.y);
    }
  }

  for (let n of nodes) {
    n.display(currentYear);
  }

  pop();

  drawYearSlider();
  drawTimelineAnnotation();

  if (infoNode !== null) drawInfoPanel(infoNode);
}

// ==========================================================
// SLIDER
// ==========================================================
function drawYearSlider() {
  stroke(17);
  strokeWeight(3);
  line(sliderX, sliderY, sliderX + sliderW, sliderY);

  textAlign(CENTER);
  textSize(12);

  for (let y = startYear; y <= endYear; y++) {
    let tx = map(y, startYear, endYear, sliderX, sliderX + sliderW);
    stroke(17);
    line(tx, sliderY - 6, tx, sliderY + 6);
    noStroke();
    fill(17);
    text(y, tx, sliderY + 20);
  }

  noStroke();
  fill(17);
  ellipse(sliderPos, sliderY, 18, 18);

  currentYear = int(map(sliderPos, sliderX, sliderX + sliderW, startYear, endYear));
  currentYear = constrain(currentYear, startYear, endYear);

  fill(216, 61, 31);
  textSize(14);
  text("Year: " + currentYear, width / 2, sliderY - 30);
}

// ==========================================================
// TIMELINE ANNOTATION
// ==========================================================
function drawTimelineAnnotation() {
  if (timelineAnnotations.has(currentYear)) {
    let annotation = timelineAnnotations.get(currentYear);

    let boxWidth = width - 2 * sliderX;
    let boxX = sliderX;
    let boxY = sliderY + 45;
    let padding = 12;

    textSize(13);
    textAlign(LEFT, TOP);
    let textHeight = 60;

    fill(229, 71, 36, 230);
    noStroke();
    rect(boxX, boxY, boxWidth, textHeight + padding * 2, 6);

    fill(255);
    text(annotation, boxX + padding, boxY + padding, boxWidth - padding * 2, textHeight);
  }
}

// ==========================================================
// INFO PANEL
// ==========================================================
function drawInfoPanel(n) {
  let panelW = 320;
  let panelH = 240;
  let panelX = width - panelW - 20;
  let panelY = 200;
  let padding = 16;
  let yOffset = panelY + padding;

  fill(229, 71, 36);
  rect(panelX, panelY, panelW, panelH, 8);

  fill(255);
  textAlign(LEFT, TOP);

  textSize(16);
  text(n.name, panelX + padding, yOffset);
  yOffset += 20;

  textSize(10);
  if (n.isActiveInYear(currentYear)) {
    text(currentYear, panelX + padding, yOffset);
  } else {
    let allYears = n.years.join(", ");
    text("Active: " + allYears, panelX + padding, yOffset);
  }
  yOffset += 12;

  text(n.getCategory(currentYear), panelX + padding, yOffset);
  yOffset += 16;

  textSize(12);
  text(n.getDescription(currentYear), panelX + padding, yOffset, panelW - 2 * padding, panelH - (yOffset - panelY) - padding);
}

// ==========================================================
// MOUSE INTERACTION
// ==========================================================
function screenToWorld(sx, sy) {
  let wx = (sx - camX) / zoomLevel;
  let wy = (sy - camY - HEADER_HEIGHT) / zoomLevel;
  return createVector(wx, wy);
}

function mousePressed() {
  pointerDownX = mouseX;
  pointerDownY = mouseY;
  movedSincePress = false;

  if (dist(mouseX, mouseY, sliderPos, sliderY) < 12) {
    draggingSlider = true;
    return;
  }

  let world = screenToWorld(mouseX, mouseY);
  pointerDownWorld = world;
  candidateClickNode = null;
  for (let n of nodes) {
    if (dist(world.x, world.y, n.x, n.y) < n.r + 4) {
      candidateClickNode = n;
      break;
    }
  }
}

function mouseDragged() {
  movedSincePress = true;

  if (draggingSlider) {
    sliderPos = constrain(mouseX, sliderX, sliderX + sliderW);
    return;
  }
}

function mouseReleased() {
  if (draggingSlider) {
    draggingSlider = false;
    return;
  }

  if (panning) {
    panning = false;
    if (!movedSincePress && candidateClickNode !== null) infoNode = candidateClickNode;
    return;
  }

  if (!movedSincePress && candidateClickNode !== null) {
    infoNode = candidateClickNode;
  } else if (!movedSincePress) {
    infoNode = null;
  }

  candidateClickNode = null;
}