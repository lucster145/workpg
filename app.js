const canvas = document.getElementById("scene");
const hudHint = document.querySelector("#hud .hint");

function showRuntimeError(message) {
  if (hudHint) {
    hudHint.textContent = `Error: ${message}`;
    hudHint.style.color = "#a31919";
  }
}

if (!canvas) {
  throw new Error("Canvas element not found");
}

let ctx = canvas.getContext("2d", { alpha: false });
if (!ctx) {
  ctx = canvas.getContext("2d");
}
if (!ctx) {
  throw new Error("2D canvas context is not supported in this browser");
}

window.addEventListener("error", (event) => {
  showRuntimeError(event.message || "Unexpected runtime error");
});

const WORLD_W = 14;
const WORLD_H = 1000;
const ROOM_DEPTH = 10;
const ROOM_COUNT = 100;
const DOOR_START = 5;
const DOOR_END = 8;

const world = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(0));

function putTile(x, y, type = 1) {
  if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
    world[y][x] = type;
  }
}

for (let y = 0; y < WORLD_H; y += 1) {
  for (let x = 0; x < WORLD_W; x += 1) {
    if (x === 0 || x === WORLD_W - 1 || y === 0 || y === WORLD_H - 1) {
      putTile(x, y, 1);
    }
  }
}

for (let roomIndex = 1; roomIndex < ROOM_COUNT; roomIndex += 1) {
  const dividerY = roomIndex * ROOM_DEPTH;
  for (let x = 1; x < WORLD_W - 1; x += 1) {
    if (x < DOOR_START || x >= DOOR_END) {
      putTile(x, dividerY, 1);
    }
  }
}

for (let roomIndex = 0; roomIndex < ROOM_COUNT; roomIndex += 1) {
  const startY = roomIndex * ROOM_DEPTH + 1;
  const endY = (roomIndex + 1) * ROOM_DEPTH - 1;

  for (let y = startY; y <= endY; y += 2) {
    putTile(0, y, 2 + (y % 3));
    putTile(WORLD_W - 1, y, 2 + ((y + 1) % 3));
  }

  for (let x = 2; x < WORLD_W - 2; x += 3) {
    putTile(x, startY, 2 + ((x + roomIndex) % 3));
    putTile(x + 1, endY, 2 + ((x + roomIndex + 1) % 3));
  }
}

const input = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
};

const player = {
  x: 6.5,
  y: WORLD_H - 3.3,
  lookAngle: -Math.PI / 2,
};

// AI Characters
class AICharacter {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 1.0 + Math.random() * 0.5;
    this.walkTimer = Math.random() * 3;
    this.directionChangeInterval = 2 + Math.random() * 3;
    this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    this.id = Math.random();
  }

  update(dt) {
    this.walkTimer -= dt;
    if (this.walkTimer <= 0) {
      this.angle = Math.random() * Math.PI * 2;
      this.directionChangeInterval = 2 + Math.random() * 3;
      this.walkTimer = this.directionChangeInterval;
    }

    const newX = this.x + Math.cos(this.angle) * this.speed * dt;
    const newY = this.y + Math.sin(this.angle) * this.speed * dt;

    if (canStand(newX, newY)) {
      this.x = newX;
      this.y = newY;
    } else {
      this.angle = Math.random() * Math.PI * 2;
      this.walkTimer = 0;
    }
  }

  draw(tileSize) {
    const screen = worldToScreen(this.x, this.y, tileSize);
    const radiusPx = Math.max(6, tileSize * 0.15);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radiusPx, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#173a59";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y);
    ctx.lineTo(screen.x + Math.cos(this.angle) * radiusPx * 1.5, screen.y + Math.sin(this.angle) * radiusPx * 1.5);
    ctx.stroke();
  }
}

// Interactive Characters
class InteractiveCharacter {
  constructor(x, y, name, message) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.message = message;
    this.color = `hsl(${Math.random() * 360}, 85%, 45%)`;
  }

  draw(tileSize) {
    const screen = worldToScreen(this.x, this.y, tileSize);
    const radiusPx = Math.max(8, tileSize * 0.2);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radiusPx, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(screen.x - radiusPx * 0.3, screen.y - radiusPx * 0.2, radiusPx * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screen.x + radiusPx * 0.3, screen.y - radiusPx * 0.2, radiusPx * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(screen.x - radiusPx * 0.3, screen.y - radiusPx * 0.2, radiusPx * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screen.x + radiusPx * 0.3, screen.y - radiusPx * 0.2, radiusPx * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#173a59";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radiusPx, 0, Math.PI * 2);
    ctx.stroke();
  }

  getDistance(px, py) {
    return Math.hypot(this.x - px, this.y - py);
  }
}

// Initialize AI Characters - spread throughout rooms
const aiCharacters = [];
for (let i = 0; i < 30; i++) {
  const roomIndex = Math.floor(Math.random() * ROOM_COUNT);
  const roomCenterY = roomIndex * ROOM_DEPTH + ROOM_DEPTH / 2;
  const x = 2 + Math.random() * (WORLD_W - 4);
  const y = roomCenterY + (Math.random() - 0.5) * 4;
  if (canStand(x, y)) {
    aiCharacters.push(new AICharacter(x, y));
  }
}

// Initialize Interactive Characters
const interactiveCharacters = [
  new InteractiveCharacter(6.5, ROOM_DEPTH * 1 + 5, "Alice", "Welcome to the gallery! Explore all the rooms!"),
  new InteractiveCharacter(6.5, ROOM_DEPTH * 30 + 5, "Bob", "Did you know there are 100 rooms to explore?"),
  new InteractiveCharacter(6.5, ROOM_DEPTH * 60 + 5, "Charlie", "Keep walking to discover more amazing art!"),
];

let selectedCharacter = null;
let interactionText = "";

const MOVE_SPEED = 3.5;
const TURN_SPEED = 2.2;
const PLAYER_RADIUS = 0.2;
const zoom = 1.05;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}

function isBlocked(x, y) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx < 0 || cx >= WORLD_W || cy < 0 || cy >= WORLD_H) {
    return true;
  }
  return world[cy][cx] !== 0;
}

function canStand(x, y) {
  const points = [
    [x - PLAYER_RADIUS, y],
    [x + PLAYER_RADIUS, y],
    [x, y - PLAYER_RADIUS],
    [x, y + PLAYER_RADIUS],
  ];

  return points.every(([px, py]) => !isBlocked(px, py));
}

function seeded(seed) {
  const s = Math.sin(seed * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

const artCache = new Map();

function buildArtTexture(type, variant) {
  const art = document.createElement("canvas");
  art.width = 120;
  art.height = 120;
  const a = art.getContext("2d");

  const base = a.createLinearGradient(0, 0, art.width, art.height);
  base.addColorStop(0, "#fffef7");
  base.addColorStop(1, "#f5f0da");
  a.fillStyle = base;
  a.fillRect(0, 0, art.width, art.height);

  if (type === 2) {
    const cx = 60;
    const cy = 62;
    for (let i = 0; i < 11; i += 1) {
      const angle = (Math.PI * 2 * i) / 11 + variant * 0.2;
      const r = 28 + i * 1.5;
      a.strokeStyle = `hsl(${(i * 35 + variant * 17) % 360} 85% 62%)`;
      a.lineWidth = 4;
      a.beginPath();
      a.arc(cx + Math.cos(angle) * 5, cy + Math.sin(angle) * 5, r, angle - 0.9, angle + 0.9);
      a.stroke();
    }
    a.fillStyle = "#ffdd67";
    a.beginPath();
    a.arc(cx, cy, 11, 0, Math.PI * 2);
    a.fill();
  } else if (type === 3) {
    const sky = a.createLinearGradient(0, 0, 0, 75);
    sky.addColorStop(0, "#9fd7ff");
    sky.addColorStop(1, "#f5fdff");
    a.fillStyle = sky;
    a.fillRect(8, 8, 104, 70);

    a.fillStyle = "#6ecb83";
    a.beginPath();
    a.moveTo(8, 78);
    for (let x = 8; x <= 112; x += 6) {
      const h = 62 + Math.sin(x * 0.08 + variant) * 9;
      a.lineTo(x, h);
    }
    a.lineTo(112, 112);
    a.lineTo(8, 112);
    a.closePath();
    a.fill();

    for (let i = 0; i < 6; i += 1) {
      const x = 20 + i * 16;
      const y = 86 + Math.sin(i + variant) * 5;
      a.fillStyle = i % 2 ? "#ff9aa2" : "#8fd3ff";
      a.beginPath();
      a.arc(x, y, 6.5, 0, Math.PI * 2);
      a.fill();
      a.fillStyle = "#2f4f68";
      a.fillRect(x - 1, y + 6, 2, 8);
    }
  } else {
    for (let i = 0; i < 16; i += 1) {
      const r = seeded(i + variant * 13);
      const x = 10 + r * 100;
      const y = 10 + seeded(i * 7 + variant) * 100;
      const w = 12 + seeded(i * 11 + variant) * 24;
      const h = 8 + seeded(i * 5 + variant) * 22;
      a.fillStyle = `hsl(${(140 + i * 29 + variant * 31) % 360} 75% 70%)`;
      a.fillRect(x, y, w, h);
    }
    a.strokeStyle = "#30465f";
    a.lineWidth = 2;
    a.beginPath();
    a.moveTo(14, 96);
    a.lineTo(106, 24);
    a.stroke();
  }

  a.strokeStyle = "#9d6f39";
  a.lineWidth = 6;
  a.strokeRect(5, 5, 110, 110);
  return art;
}

function getArtTexture(type, variant) {
  const key = `${type}-${variant}`;
  if (!artCache.has(key)) {
    artCache.set(key, buildArtTexture(type, variant));
  }
  return artCache.get(key);
}

function worldToScreen(wx, wy, tileSize) {
  return {
    x: (wx - player.x) * tileSize + canvas.width / 2,
    y: (wy - player.y) * tileSize + canvas.height / 2,
  };
}

function drawFloor(tileSize) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#ebf8ff");
  grad.addColorStop(1, "#d7f0ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const startX = Math.floor(player.x - canvas.width / tileSize / 2) - 1;
  const endX = Math.ceil(player.x + canvas.width / tileSize / 2) + 1;
  const startY = Math.floor(player.y - canvas.height / tileSize / 2) - 1;
  const endY = Math.ceil(player.y + canvas.height / tileSize / 2) + 1;

  // Draw carpet
  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const { x: sx, y: sy } = worldToScreen(x, y, tileSize);
      
      // Carpet pattern - alternating style
      const roomIndex = Math.floor(y / ROOM_DEPTH);
      const carpetPattern = (x + roomIndex) % 2 === 0;
      
      if (carpetPattern) {
        ctx.fillStyle = "#d4a574"; // Brown carpet
        ctx.fillRect(sx, sy, tileSize + 1, tileSize + 1);
        
        // Add carpet texture
        ctx.fillStyle = "rgba(139, 90, 43, 0.1)";
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(sx + 2 + i * 4, sy + 2, 2, tileSize - 4);
        }
      } else {
        ctx.fillStyle = "#e8dcc4"; // Light beige carpet
        ctx.fillRect(sx, sy, tileSize + 1, tileSize + 1);
      }
    }
  }
}

function drawWorld(tileSize) {
  for (let y = 0; y < WORLD_H; y += 1) {
    for (let x = 0; x < WORLD_W; x += 1) {
      const type = world[y][x];
      if (type === 0) {
        continue;
      }

      const { x: sx, y: sy } = worldToScreen(x, y, tileSize);
      if (sx > canvas.width || sy > canvas.height || sx + tileSize < 0 || sy + tileSize < 0) {
        continue;
      }

      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(sx, sy, tileSize, tileSize);
      ctx.strokeStyle = "#bfd6ea";
      ctx.lineWidth = Math.max(1, tileSize * 0.05);
      ctx.strokeRect(sx, sy, tileSize, tileSize);

      if (type > 1) {
        const pad = tileSize * 0.18;
        const variant = ((x * 37 + y * 17) % 8 + 8) % 8;
        const tex = getArtTexture(type, variant);
        ctx.drawImage(tex, sx + pad, sy + pad, tileSize - pad * 2, tileSize - pad * 2);
        ctx.strokeStyle = "#8f6734";
        ctx.lineWidth = Math.max(1, tileSize * 0.04);
        ctx.strokeRect(sx + pad, sy + pad, tileSize - pad * 2, tileSize - pad * 2);
      }
    }
  }
}

function drawPlayer(tileSize) {
  const px = canvas.width / 2;
  const py = canvas.height / 2;
  const radiusPx = Math.max(8, tileSize * PLAYER_RADIUS);

  ctx.fillStyle = "#ff7f50";
  ctx.beginPath();
  ctx.arc(px, py, radiusPx, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#173a59";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + Math.cos(player.lookAngle) * radiusPx * 1.8, py + Math.sin(player.lookAngle) * radiusPx * 1.8);
  ctx.stroke();

  ctx.fillStyle = "rgba(72, 133, 183, 0.2)";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, radiusPx * 5.4, player.lookAngle - 0.5, player.lookAngle + 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawRoomLabels(tileSize) {
  ctx.fillStyle = "#2d5776";
  ctx.font = `${Math.max(14, Math.floor(tileSize * 0.34))}px Trebuchet MS`;
  ctx.textAlign = "center";
  for (let roomIndex = 0; roomIndex < ROOM_COUNT; roomIndex += 1) {
    const centerY = roomIndex * ROOM_DEPTH + ROOM_DEPTH / 2;
    const p = worldToScreen(WORLD_W / 2, centerY, tileSize);
    if (p.y > -40 && p.y < canvas.height + 40) {
      ctx.fillText(`Room ${roomIndex + 1}`, p.x, p.y);
    }
  }
}

function update(dt) {
  if (input.ArrowLeft) {
    player.lookAngle -= TURN_SPEED * dt;
  }
  if (input.ArrowRight) {
    player.lookAngle += TURN_SPEED * dt;
  }

  const forwardX = Math.cos(player.lookAngle);
  const forwardY = Math.sin(player.lookAngle);

  let vx = 0;
  let vy = 0;

  if (input.ArrowUp) {
    vx += forwardX;
    vy += forwardY;
  }
  if (input.ArrowDown) {
    vx -= forwardX;
    vy -= forwardY;
  }

  if (vx !== 0 || vy !== 0) {
    const len = Math.hypot(vx, vy);
    const stepX = (vx / len) * MOVE_SPEED * dt;
    const stepY = (vy / len) * MOVE_SPEED * dt;

    if (canStand(player.x + stepX, player.y)) {
      player.x += stepX;
    }
    if (canStand(player.x, player.y + stepY)) {
      player.y += stepY;
    }
  }

  // Update AI characters
  for (const ai of aiCharacters) {
    ai.update(dt);
  }

  // Check interaction with interactive characters
  selectedCharacter = null;
  for (const npc of interactiveCharacters) {
    const dist = npc.getDistance(player.x, player.y);
    if (dist < 1.5) {
      selectedCharacter = npc;
      interactionText = `Talk to ${npc.name}: "${npc.message}"`;
      break;
    }
  }
}

function render() {
  const tileSize = Math.max(20, Math.min(120, 78 * zoom));
  drawFloor(tileSize);
  drawWorld(tileSize);
  drawRoomLabels(tileSize);
  
  // Draw interactive characters
  for (const npc of interactiveCharacters) {
    npc.draw(tileSize);
  }
  
  // Draw AI characters
  for (const ai of aiCharacters) {
    ai.draw(tileSize);
  }
  
  drawPlayer(tileSize);
  
  // Draw interaction text if nearby
  if (interactionText) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, canvas.height - 50, canvas.width - 20, 40);
    ctx.fillStyle = "#fff";
    ctx.font = `16px Trebuchet MS`;
    ctx.textAlign = "left";
    ctx.fillText(interactionText, 20, canvas.height - 20);
  }
}

window.addEventListener("keydown", (event) => {
  if (event.code in input) {
    input[event.code] = true;
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code in input) {
    input[event.code] = false;
    event.preventDefault();
  }
});

window.addEventListener("resize", resize);

function startGame() {
  resize();

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

try {
  startGame();
} catch (error) {
  showRuntimeError(error instanceof Error ? error.message : "Game failed to start");
}
