const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d", { alpha: false });

const WORLD_W = 14;
const WORLD_H = 40;
const ROOM_DEPTH = 10;
const ROOM_COUNT = 4;
const DOOR_START = 5;
const DOOR_END = 8;

const world = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(0));

function putWall(x, y, type = 1) {
  if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
    world[y][x] = type;
  }
}

for (let y = 0; y < WORLD_H; y += 1) {
  for (let x = 0; x < WORLD_W; x += 1) {
    if (x === 0 || x === WORLD_W - 1 || y === 0 || y === WORLD_H - 1) {
      putWall(x, y, 1);
    }
  }
}

for (let r = 1; r < ROOM_COUNT; r += 1) {
  const wallY = r * ROOM_DEPTH;
  for (let x = 1; x < WORLD_W - 1; x += 1) {
    if (x < DOOR_START || x >= DOOR_END) {
      putWall(x, wallY, 1);
    }
  }
}

function placeArtOnVerticalWall(x, yStart, yEnd, startType) {
  for (let y = yStart; y <= yEnd; y += 1) {
    putWall(x, y, startType + (y % 3));
  }
}

for (let r = 0; r < ROOM_COUNT; r += 1) {
  const y0 = r * ROOM_DEPTH + 1;
  const y1 = (r + 1) * ROOM_DEPTH - 1;
  placeArtOnVerticalWall(0, y0, y1, 2);
  placeArtOnVerticalWall(WORLD_W - 1, y0, y1, 2);
}

for (let x = 2; x < WORLD_W - 2; x += 2) {
  putWall(x, 0, 2 + (x % 3));
  putWall(x, WORLD_H - 1, 2 + ((x + 1) % 3));
}

const input = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
};

const player = {
  x: 6.5,
  y: WORLD_H - 3.5,
  dir: -Math.PI / 2,
  look: 0,
};

const MOVE_SPEED = 3.6;
const TURN_SPEED = 1.8;
const LOOK_SPEED = 380;
const FOV = Math.PI / 3;
const MAX_DIST = 30;

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}

function isWall(x, y) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cy < 0 || cy >= WORLD_H || cx < 0 || cx >= WORLD_W) {
    return true;
  }
  return world[cy][cx] !== 0;
}

function wallTypeAt(x, y) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cy < 0 || cy >= WORLD_H || cx < 0 || cx >= WORLD_W) {
    return 1;
  }
  return world[cy][cx] || 1;
}

function artColor(type, stripe) {
  if (type === 2) {
    const rainbow = ["#ff6464", "#ffaa4f", "#ffe873", "#6ddf92", "#61c9ff", "#8f92ff"];
    return rainbow[stripe % rainbow.length];
  }
  if (type === 3) {
    return stripe % 2 === 0 ? "#ff8fc7" : "#84d7ff";
  }
  if (type === 4) {
    return stripe % 3 === 0 ? "#ffd86d" : "#86f1b6";
  }
  return "#f4f9ff";
}

function drawBackground(horizon) {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#95d9ff");
  sky.addColorStop(1, "#e8f9ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, horizon);

  const floor = ctx.createLinearGradient(0, horizon, 0, canvas.height);
  floor.addColorStop(0, "#f5e9c6");
  floor.addColorStop(1, "#dcbf88");
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

  for (let y = Math.max(horizon, 0); y < canvas.height; y += 3) {
    const t = (y - horizon) / Math.max(1, canvas.height - horizon);
    const depthShade = 1 - Math.min(0.58, t * 0.75);
    const c = Math.floor(229 * depthShade);
    ctx.strokeStyle = `rgb(${c}, ${Math.floor(c * 0.93)}, ${Math.floor(c * 0.75)})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function castRay(rayAngle) {
  const rayDirX = Math.cos(rayAngle);
  const rayDirY = Math.sin(rayAngle);

  let mapX = Math.floor(player.x);
  let mapY = Math.floor(player.y);

  const deltaDistX = Math.abs(1 / (rayDirX || 0.00001));
  const deltaDistY = Math.abs(1 / (rayDirY || 0.00001));

  let stepX = 0;
  let stepY = 0;
  let sideDistX = 0;
  let sideDistY = 0;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (player.x - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - player.x) * deltaDistX;
  }

  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (player.y - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - player.y) * deltaDistY;
  }

  let hit = false;
  let side = 0;
  let type = 1;

  while (!hit) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    if (mapX < 0 || mapX >= WORLD_W || mapY < 0 || mapY >= WORLD_H) {
      hit = true;
      type = 1;
    } else if (world[mapY][mapX] > 0) {
      hit = true;
      type = world[mapY][mapX];
    }
  }

  const perpDist = side === 0
    ? (mapX - player.x + (1 - stepX) / 2) / (rayDirX || 0.00001)
    : (mapY - player.y + (1 - stepY) / 2) / (rayDirY || 0.00001);

  const hitPoint = side === 0
    ? player.y + perpDist * rayDirY
    : player.x + perpDist * rayDirX;

  const wallU = hitPoint - Math.floor(hitPoint);

  return {
    distance: Math.max(0.0001, perpDist),
    side,
    type,
    wallU,
  };
}

function drawSlice(x, startY, endY, ray) {
  const sliceH = endY - startY + 1;
  const clampedStart = Math.max(0, startY);
  const clampedEnd = Math.min(canvas.height - 1, endY);
  if (clampedEnd <= clampedStart) {
    return;
  }

  const distFade = Math.max(0.2, 1 - ray.distance / MAX_DIST);
  for (let y = clampedStart; y <= clampedEnd; y += 1) {
    const yT = (y - startY) / Math.max(1, sliceH);
    const stripe = Math.floor(ray.wallU * 8 + yT * 7);
    let base = artColor(ray.type, stripe);

    if (ray.type === 1) {
      base = stripe % 2 === 0 ? "#f8fbff" : "#e7f1fa";
    }

    const shade = ray.side === 1 ? 0.86 : 1;
    const finalShade = shade * distFade;

    const rgb = base.match(/[\da-f]{2}/gi);
    const r = parseInt(rgb[0], 16);
    const g = parseInt(rgb[1], 16);
    const b = parseInt(rgb[2], 16);
    ctx.fillStyle = `rgb(${Math.floor(r * finalShade)}, ${Math.floor(g * finalShade)}, ${Math.floor(b * finalShade)})`;
    ctx.fillRect(x, y, 1, 1);
  }

  if (ray.type > 1) {
    const frameTop = clampedStart + Math.floor((clampedEnd - clampedStart) * 0.13);
    const frameBottom = clampedStart + Math.floor((clampedEnd - clampedStart) * 0.87);
    ctx.fillStyle = "#8f6734";
    ctx.fillRect(x, frameTop, 1, 2);
    ctx.fillRect(x, frameBottom - 2, 1, 2);
  }
}

function update(dt) {
  if (input.ArrowLeft) {
    player.dir -= TURN_SPEED * dt;
  }
  if (input.ArrowRight) {
    player.dir += TURN_SPEED * dt;
  }
  if (input.ArrowUp) {
    player.look -= LOOK_SPEED * dt;
  }
  if (input.ArrowDown) {
    player.look += LOOK_SPEED * dt;
  }

  player.look = Math.max(-canvas.height * 0.22, Math.min(canvas.height * 0.22, player.look));

  const moveX = Math.cos(player.dir);
  const moveY = Math.sin(player.dir);
  const strafeX = Math.cos(player.dir + Math.PI / 2);
  const strafeY = Math.sin(player.dir + Math.PI / 2);

  let nextX = player.x;
  let nextY = player.y;

  if (input.KeyW) {
    nextX += moveX * MOVE_SPEED * dt;
    nextY += moveY * MOVE_SPEED * dt;
  }
  if (input.KeyS) {
    nextX -= moveX * MOVE_SPEED * dt;
    nextY -= moveY * MOVE_SPEED * dt;
  }
  if (input.KeyA) {
    nextX -= strafeX * MOVE_SPEED * dt;
    nextY -= strafeY * MOVE_SPEED * dt;
  }
  if (input.KeyD) {
    nextX += strafeX * MOVE_SPEED * dt;
    nextY += strafeY * MOVE_SPEED * dt;
  }

  const pad = 0.22;
  if (!isWall(nextX + Math.sign(nextX - player.x) * pad, player.y)) {
    player.x = nextX;
  }
  if (!isWall(player.x, nextY + Math.sign(nextY - player.y) * pad)) {
    player.y = nextY;
  }

  player.x = Math.max(1.2, Math.min(WORLD_W - 1.2, player.x));
  player.y = Math.max(1.2, Math.min(WORLD_H - 1.2, player.y));
}

function render() {
  const horizon = Math.floor(canvas.height * 0.46 + player.look);
  drawBackground(horizon);

  for (let x = 0; x < canvas.width; x += 1) {
    const cameraX = (2 * x) / canvas.width - 1;
    const rayAngle = player.dir + cameraX * (FOV / 2) * 1.9;
    const ray = castRay(rayAngle);
    const correctedDist = ray.distance * Math.cos(rayAngle - player.dir);

    const wallHeight = Math.floor(canvas.height / Math.max(0.001, correctedDist));
    const startY = Math.floor(horizon - wallHeight / 2);
    const endY = Math.floor(horizon + wallHeight / 2);

    drawSlice(x, startY, endY, ray);
  }

  ctx.fillStyle = "rgba(26, 54, 87, 0.55)";
  ctx.fillRect(canvas.width / 2 - 1, canvas.height / 2 - 8, 2, 16);
  ctx.fillRect(canvas.width / 2 - 8, canvas.height / 2 - 1, 16, 2);
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
