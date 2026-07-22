const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tileSize = 30;
const baseSpeed = 3;

// State Game
let gameState = "START"; 
let level = 1;
let highScore = localStorage.getItem("pacman_highscore") || 0;

let shakeTime = 0;
let particles = [];
let floatingTexts = [];
let traps = [];

// Memuat Foto Pengguna
const pacmanImg = new Image();
pacmanImg.src = "foto-saya.png";

// Matriks Master Labirin Klasik (25 Kolom x 23 Baris)
const masterMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,1,2,1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,1,2,1,2,1,2,1,1,1,1,2,1,1,1,2,1],
  [1,2,1,1,1,2,1,1,1,1,2,1,2,1,2,1,1,1,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,1,2,2,2,2,1,2,1,2,2,2,2,1,2,2,2,2,2,1],
  [1,1,1,1,1,2,1,1,1,1,2,1,2,1,2,1,1,1,1,2,1,1,1,1,1],
  [2,2,2,2,1,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,1,2,2,2,2],
  [1,1,1,1,1,2,1,2,1,1,1,2,2,2,1,1,1,2,1,2,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1],
  [2,2,2,2,1,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,1,2,2,2,2],
  [1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,1,2,1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,1,2,1,2,1,2,1,1,1,1,2,1,1,1,2,1],
  [1,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,1],
  [1,1,2,2,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,2,2,1,1],
  [1,2,2,2,2,2,1,2,2,2,2,1,2,1,2,2,2,2,1,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,2,1,2,1,2,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Portal Wormhole
const portals = [
  { x: 1, y: 10, targetX: 23, targetY: 10, color: "#00FFFF" }, 
  { x: 23, y: 10, targetX: 1, targetY: 10, color: "#FF00FF" }  
];

let map = [];
let fruit = { x: 12, y: 10, active: false, timer: null };

// Randomize Penempatan Poin
function generateRandomizedMap() {
  let newMap = JSON.parse(JSON.stringify(masterMap));
  let validPathTiles = [];

  for (let r = 0; r < newMap.length; r++) {
    for (let c = 0; c < newMap[r].length; c++) {
      if (newMap[r][c] !== 1) {
        const isGhostHouse = (r >= 8 && r <= 11 && c >= 10 && c <= 14);
        const isPacmanSpawn = (r === 16 && c === 12);
        const isPortal = portals.some(p => p.x === c && p.y === r);

        if (!isGhostHouse && !isPacmanSpawn && !isPortal) {
          validPathTiles.push({ r, c });
          newMap[r][c] = 2;
        }
      }
    }
  }

  for (let i = validPathTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [validPathTiles[i], validPathTiles[j]] = [validPathTiles[j], validPathTiles[i]];
  }

  for (let i = 0; i < 4 && i < validPathTiles.length; i++) {
    const tile = validPathTiles[i];
    newMap[tile.r][tile.c] = 3;
  }

  const totalPellets = Math.floor((validPathTiles.length - 4) * 0.85);
  for (let i = 4; i < 4 + totalPellets && i < validPathTiles.length; i++) {
    const tile = validPathTiles[i];
    newMap[tile.r][tile.c] = 0;
  }

  return newMap;
}

map = generateRandomizedMap();

// Floating Text
class FloatingText {
  constructor(x, y, text, color = "#FFFF00") {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.vy = -1;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.02;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.font = "bold 16px monospace";
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// Particle
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 2;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6;
    this.alpha = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.03;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createBurst(x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}

// Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === "suspended") audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === "makan") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now); osc.stop(now + 0.05);
  } else if (type === "portal") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now); osc.stop(now + 0.15);
  } else if (type === "trap") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === "power") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.2);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === "makanHantu") {
    osc.type = "square";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === "mati") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
  } else if (type === "start") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.setValueAtTime(600, now + 0.1);
    osc.frequency.setValueAtTime(800, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.start(now); osc.stop(now + 0.35);
  }
}

function isTilePassable(gridX, gridY, isGhost = false) {
  if (gridX < 0 || gridX >= map[0].length) return true;
  if (map[gridY] !== undefined && map[gridY][gridX] !== undefined) {
    if (map[gridY][gridX] === 1) return false; // Dinding
    // Jika karakter adalah HANTU, larang melintasi tile portal wormhole
    if (isGhost && portals.some(p => p.x === gridX && p.y === gridY)) {
      return false;
    }
    return true;
  }
  return false;
}

function clampTarget(target) {
  return {
    x: Math.max(0, Math.min(map[0].length - 1, target.x)),
    y: Math.max(0, Math.min(map.length - 1, target.y))
  };
}

// Pacman Class
class Pacman {
  constructor(gridX, gridY) {
    this.startX = gridX;
    this.startY = gridY;
    this.lives = 3;
    this.score = 0;
    this.trapCount = 3;
    this.portalCooldown = 0;
    this.resetPosition();
  }

  resetPosition() {
    this.x = this.startX * tileSize;
    this.y = this.startY * tileSize;
    this.dirX = 0;
    this.dirY = 0;
    this.nextDirX = 0;
    this.nextDirY = 0;
    this.portalCooldown = 0;
  }

  setNextDirection(dx, dy) {
    this.nextDirX = dx;
    this.nextDirY = dy;
  }

  dropOilTrap() {
    if (this.trapCount > 0 && gameState === "PLAYING") {
      const gridX = Math.round(this.x / tileSize);
      const gridY = Math.round(this.y / tileSize);
      traps.push({ x: gridX, y: gridY });
      this.trapCount--;
      playSound("trap");
      createBurst(gridX * tileSize + tileSize / 2, gridY * tileSize + tileSize / 2, "#333", 10);
    }
  }

  update() {
    if (this.portalCooldown > 0) this.portalCooldown--;

    const currentGridX = Math.round(this.x / tileSize);
    const currentGridY = Math.round(this.y / tileSize);
    const isAtCenter = Math.abs(this.x - currentGridX * tileSize) < baseSpeed &&
                       Math.abs(this.y - currentGridY * tileSize) < baseSpeed;

    if (isAtCenter) {
      this.x = currentGridX * tileSize;
      this.y = currentGridY * tileSize;

      // Teleportasi Wormhole Khusus Pac-Man
      if (this.portalCooldown === 0) {
        portals.forEach(p => {
          if (p.x === currentGridX && p.y === currentGridY) {
            this.x = p.targetX * tileSize;
            this.y = p.targetY * tileSize;
            this.portalCooldown = 20;
            playSound("portal");
            createBurst(this.x + tileSize / 2, this.y + tileSize / 2, p.color, 15);
          }
        });
      }

      if (map[currentGridY]) {
        const tileValue = map[currentGridY][currentGridX];

        if (tileValue === 0) {
          map[currentGridY][currentGridX] = 2;
          this.score += 10;
          playSound("makan");
          checkPelletsLeft();
        } else if (tileValue === 3) {
          map[currentGridY][currentGridX] = 2;
          this.score += 50;
          playSound("power");
          createBurst(this.x + tileSize / 2, this.y + tileSize / 2, "#00FFFF", 20);
          triggerFrightenedMode();
          checkPelletsLeft();
        }

        if (fruit.active && currentGridX === fruit.x && currentGridY === fruit.y) {
          fruit.active = false;
          this.score += 200;
          this.trapCount += 2;
          playSound("power");
          floatingTexts.push(new FloatingText(this.x, this.y, "+200", "#FF0000"));
          createBurst(this.x + tileSize / 2, this.y + tileSize / 2, "#FF0000", 25);
        }
      }

      if (isTilePassable(currentGridX + this.nextDirX, currentGridY + this.nextDirY, false)) {
        this.dirX = this.nextDirX;
        this.dirY = this.nextDirY;
      } else if (!isTilePassable(currentGridX + this.dirX, currentGridY + this.dirY, false)) {
        this.dirX = 0;
        this.dirY = 0;
      }
    }

    this.x += this.dirX * baseSpeed;
    this.y += this.dirY * baseSpeed;

    if (this.x < -tileSize / 2) this.x = (map[0].length - 1) * tileSize;
    if (this.x > (map[0].length - 1) * tileSize) this.x = 0;
  }

  draw() {
    ctx.save();
    const centerX = this.x + tileSize / 2;
    const centerY = this.y + tileSize / 2;
    const radius = tileSize / 2 - 1;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = "#000";
    ctx.fillRect(this.x, this.y, tileSize, tileSize);

    if (pacmanImg.complete && pacmanImg.naturalWidth !== 0) {
      const scale = Math.min((tileSize - 2) / pacmanImg.naturalWidth, (tileSize - 2) / pacmanImg.naturalHeight);
      const renderW = pacmanImg.naturalWidth * scale;
      const renderH = pacmanImg.naturalHeight * scale;
      const renderX = this.x + (tileSize - renderW) / 2;
      const renderY = this.y + (tileSize - renderH) / 2;
      ctx.drawImage(pacmanImg, renderX, renderY, renderW, renderH);
    }

    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

// Ghost Class (Dilarang Masuk Wormhole)
class Ghost {
  constructor(gridX, gridY, color, name) {
    this.homeX = gridX * tileSize;
    this.homeY = gridY * tileSize;
    this.baseColor = color;
    this.name = name;
    this.isStunned = false;
    this.resetPosition();
  }

  resetPosition() {
    this.x = this.homeX;
    this.y = this.homeY;
    this.isFrightened = false;
    this.isStunned = false;
    this.dirX = 0;
    this.dirY = -1;
  }

  getTarget(pacman, blinkyX, blinkyY) {
    const pGridX = Math.round(pacman.x / tileSize);
    const pGridY = Math.round(pacman.y / tileSize);

    let rawTarget = { x: pGridX, y: pGridY };

    if (this.name === "blinky") {
      rawTarget = { x: pGridX, y: pGridY };
    } else if (this.name === "pinky") {
      rawTarget = { x: pGridX + pacman.dirX * 4, y: pGridY + pacman.dirY * 4 };
    } else if (this.name === "inky") {
      const aheadX = pGridX + pacman.dirX * 2;
      const aheadY = pGridY + pacman.dirY * 2;
      const bGridX = Math.round(blinkyX / tileSize);
      const bGridY = Math.round(blinkyY / tileSize);
      rawTarget = { x: aheadX + (aheadX - bGridX), y: aheadY + (aheadY - bGridY) };
    } else if (this.name === "clyde") {
      const dist = Math.hypot(Math.round(this.x / tileSize) - pGridX, Math.round(this.y / tileSize) - pGridY);
      rawTarget = dist > 8 ? { x: pGridX, y: pGridY } : { x: 0, y: masterMap.length - 1 };
    }

    return clampTarget(rawTarget);
  }

  update(pacman, blinkyX, blinkyY) {
    if (this.isStunned) return;

    const currentSpeed = this.isFrightened ? baseSpeed / 2 : baseSpeed + (level - 1) * 0.2;

    const currentGridX = Math.round(this.x / tileSize);
    const currentGridY = Math.round(this.y / tileSize);
    const isAtCenter = Math.abs(this.x - currentGridX * tileSize) < currentSpeed &&
                       Math.abs(this.y - currentGridY * tileSize) < currentSpeed;

    if (isAtCenter) {
      this.x = currentGridX * tileSize;
      this.y = currentGridY * tileSize;

      traps.forEach((trap, index) => {
        if (trap.x === currentGridX && trap.y === currentGridY) {
          this.isStunned = true;
          traps.splice(index, 1);
          createBurst(this.x + tileSize / 2, this.y + tileSize / 2, "#FF8800", 15);
          setTimeout(() => { this.isStunned = false; }, 2500);
        }
      });

      const target = this.getTarget(pacman, blinkyX, blinkyY);
      const possibleMoves = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
      ];

      let bestMove = null;
      let targetDistance = this.isFrightened ? -Infinity : Infinity;

      for (let move of possibleMoves) {
        if (move.dx === -this.dirX && move.dy === -this.dirY) continue;

        // Parameter `isGhost = true` agar hantu menganggap tile portal sebagai Dinding
        if (isTilePassable(currentGridX + move.dx, currentGridY + move.dy, true)) {
          const nextTileX = currentGridX + move.dx;
          const nextTileY = currentGridY + move.dy;
          const dist = Math.hypot(nextTileX - target.x, nextTileY - target.y);

          if (this.isFrightened) {
            if (dist > targetDistance) {
              targetDistance = dist;
              bestMove = move;
            }
          } else {
            if (dist < targetDistance) {
              targetDistance = dist;
              bestMove = move;
            }
          }
        }
      }

      if (bestMove) {
        this.dirX = bestMove.dx;
        this.dirY = bestMove.dy;
      } else {
        if (isTilePassable(currentGridX - this.dirX, currentGridY - this.dirY, true)) {
          this.dirX = -this.dirX;
          this.dirY = -this.dirY;
        }
      }
    }

    this.x += this.dirX * currentSpeed;
    this.y += this.dirY * currentSpeed;
  }

  draw() {
    ctx.fillStyle = this.isStunned ? "#555" : (this.isFrightened ? "#0000FF" : this.baseColor);
    ctx.beginPath();
    ctx.arc(this.x + tileSize / 2, this.y + tileSize / 2 - 3, tileSize / 2 - 2, Math.PI, 0, false);
    ctx.lineTo(this.x + tileSize - 2, this.y + tileSize);
    ctx.lineTo(this.x + 2, this.y + tileSize);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.isFrightened ? "#FFCC00" : "#FFF";
    ctx.beginPath();
    ctx.arc(this.x + 9, this.y + 9, 3.5, 0, Math.PI * 2);
    ctx.arc(this.x + 21, this.y + 9, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Inisialisasi Karakter
const player = new Pacman(12, 16);
const ghosts = [
  new Ghost(12, 8,  "#FF0000", "blinky"),
  new Ghost(11, 10, "#FFB8FF", "pinky"),
  new Ghost(13, 10, "#00FFFF", "inky"),
  new Ghost(12, 10, "#FFB852", "clyde")
];

let frightenedTimer = null;
let ghostComboMultiplier = 1;

function triggerFrightenedMode() {
  ghostComboMultiplier = 1;
  ghosts.forEach(g => g.isFrightened = true);
  if (frightenedTimer) clearTimeout(frightenedTimer);
  frightenedTimer = setTimeout(() => {
    ghosts.forEach(g => g.isFrightened = false);
  }, 7000);
}

function checkPelletsLeft() {
  let pelletsCount = 0;
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      if (map[r][c] === 0 || map[r][c] === 3) pelletsCount++;
    }
  }

  if (pelletsCount === 60 && !fruit.active) {
    fruit.active = true;
    if (fruit.timer) clearTimeout(fruit.timer);
    fruit.timer = setTimeout(() => { fruit.active = false; }, 10000);
  }

  if (pelletsCount === 0) {
    level++;
    map = generateRandomizedMap();
    player.resetPosition();
    ghosts.forEach(g => g.resetPosition());
  }
}

// Input Handlers
function handleInputKey(key) {
  if (gameState === "START" || gameState === "GAMEOVER") {
    if (key === " " || key === "Enter") {
      resetGame();
      playSound("start");
      gameState = "PLAYING";
    }
    return;
  }

  if (key === "Shift") {
    player.dropOilTrap();
    return;
  }

  switch (key) {
    case "ArrowUp":    player.setNextDirection(0, -1); break;
    case "ArrowDown":  player.setNextDirection(0, 1);  break;
    case "ArrowLeft":  player.setNextDirection(-1, 0); break;
    case "ArrowRight": player.setNextDirection(1, 0);  break;
  }
}

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Shift"].includes(e.key)) {
    e.preventDefault();
  }
  handleInputKey(e.key);
});

function handleDpad(key) { handleInputKey(key); }
function dropTrap() { player.dropOilTrap(); }

// LOCK TOUCH & PREVENT REFRESH ON MOBILE
window.addEventListener("touchmove", (e) => {
  e.preventDefault();
}, { passive: false });

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  if (gameState === "START" || gameState === "GAMEOVER") {
    resetGame();
    playSound("start");
    gameState = "PLAYING";
  }
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  if (gameState !== "PLAYING") return;
  let dx = e.changedTouches[0].clientX - touchStartX;
  let dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) player.setNextDirection(1, 0);
    else if (dx < -30) player.setNextDirection(-1, 0);
  } else {
    if (dy > 30) player.setNextDirection(0, 1);
    else if (dy < -30) player.setNextDirection(0, -1);
  }
}, { passive: false });

function resetGame() {
  player.lives = 3;
  player.score = 0;
  player.trapCount = 3;
  level = 1;
  traps = [];
  particles = [];
  floatingTexts = [];
  map = generateRandomizedMap();
  player.resetPosition();
  ghosts.forEach(g => g.resetPosition());
}

// Render Map
function drawMap() {
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      if (map[r][c] === 1) {
        ctx.fillStyle = "#1919A6";
        ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
      } else if (map[r][c] === 0) {
        ctx.fillStyle = "#FFB8AE";
        ctx.beginPath();
        ctx.arc(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (map[r][c] === 3) {
        ctx.fillStyle = "#FFB8AE";
        ctx.beginPath();
        ctx.arc(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  portals.forEach(p => {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x * tileSize + tileSize / 2, p.y * tileSize + tileSize / 2, 10, 0, Math.PI * 2);
    ctx.stroke();
  });

  traps.forEach(t => {
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(t.x * tileSize + tileSize / 2, t.y * tileSize + tileSize / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FF8800";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  if (fruit.active) {
    const fx = fruit.x * tileSize + tileSize / 2;
    const fy = fruit.y * tileSize + tileSize / 2;
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.arc(fx - 4, fy + 2, 6, 0, Math.PI * 2);
    ctx.arc(fx + 4, fy + 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Tabrakan
function checkCollisions() {
  ghosts.forEach(g => {
    if (g.isStunned) return;

    const dist = Math.hypot(player.x - g.x, player.y - g.y);
    if (dist < tileSize / 2) {
      if (g.isFrightened) {
        const pointsEarned = 200 * ghostComboMultiplier;
        player.score += pointsEarned;
        
        floatingTexts.push(new FloatingText(g.x, g.y, `+${pointsEarned}`, "#00FFFF"));
        ghostComboMultiplier *= 2;

        playSound("makanHantu");
        createBurst(g.x + tileSize / 2, g.y + tileSize / 2, "#FFFF00", 20);
        g.resetPosition();
      } else {
        player.lives -= 1;
        playSound("mati");
        shakeTime = 15;

        if (player.lives > 0) {
          player.resetPosition();
          ghosts.forEach(gh => gh.resetPosition());
        } else {
          if (player.score > highScore) {
            highScore = player.score;
            localStorage.setItem("pacman_highscore", highScore);
          }
          gameState = "GAMEOVER";
        }
      }
    }
  });
}

function drawUI() {
  ctx.fillStyle = "#FFF";
  ctx.font = "bold 15px monospace";
  ctx.fillText(`SCORE: ${player.score}`, 15, 25);
  ctx.fillText(`HIGH: ${highScore}`, 135, 25);
  ctx.fillText(`LVL: ${level}`, 255, 25);

  ctx.fillStyle = "#FF8800";
  ctx.fillText(`TRAPS: ${player.trapCount}`, 330, 25);

  for (let i = 0; i < player.lives; i++) {
    const iconX = canvas.width - 35 - i * 28;
    const iconY = 10;
    const iconSize = 20;

    ctx.save();
    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
    ctx.clip();

    if (pacmanImg.complete && pacmanImg.naturalWidth !== 0) {
      const scale = Math.min(iconSize / pacmanImg.naturalWidth, iconSize / pacmanImg.naturalHeight);
      const renderW = pacmanImg.naturalWidth * scale;
      const renderH = pacmanImg.naturalHeight * scale;
      const renderX = iconX + (iconSize - renderW) / 2;
      const renderY = iconY + (iconSize - renderH) / 2;
      ctx.drawImage(pacmanImg, renderX, renderY, renderW, renderH);
    }

    ctx.restore();
  }
}

function drawOverlays() {
  if (gameState === "START") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFFF00";
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAC-MAN", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#FFF";
    ctx.font = "18px monospace";
    ctx.fillText("Press SPACE / Tap to Start", canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = "14px monospace";
    ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, canvas.height / 2 + 60);
    ctx.textAlign = "left";
  } else if (gameState === "GAMEOVER") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FF0000";
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#FFF";
    ctx.font = "18px monospace";
    ctx.fillText(`Final Score: ${player.score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);

    ctx.fillStyle = "#FFFF00";
    ctx.font = "16px monospace";
    ctx.fillText("Press SPACE / Tap to Play Again", canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = "left";
  }
}

// Loop Game
function gameLoop() {
  ctx.save();

  if (shakeTime > 0) {
    let shakeX = (Math.random() - 0.5) * 12;
    let shakeY = (Math.random() - 0.5) * 12;
    ctx.translate(shakeX, shakeY);
    shakeTime--;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "PLAYING") {
    player.update();
    const blinky = ghosts.find(g => g.name === "blinky");
    const blinkyX = blinky ? blinky.x : player.x;
    const blinkyY = blinky ? blinky.y : player.y;

    ghosts.forEach(g => g.update(player, blinkyX, blinkyY));
    checkCollisions();
  }

  drawMap();
  player.draw();
  ghosts.forEach(g => g.draw());

  particles.forEach((p, index) => {
    p.update();
    p.draw();
    if (p.alpha <= 0) particles.splice(index, 1);
  });

  floatingTexts.forEach((ft, index) => {
    ft.update();
    ft.draw();
    if (ft.alpha <= 0) floatingTexts.splice(index, 1);
  });

  drawUI();
  drawOverlays();

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);