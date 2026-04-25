const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d", { alpha: false });

const WORLD_W = 14;
const WORLD_H = 40;
const ROOM_DEPTH = 10;
const ROOM_COUNT = 4;
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
  y: WORLD_H - 3.3,
  lookAngle: -Math.PI / 2,
};

const MOVE_SPEED = 3.5;
const TURN_SPEED = 2.2;
const ZOOM_SPEED = 1.1;
const PLAYER_RADIUS = 0.2;
let zoom = 1;

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

function artPalette(type) {
  if (type === 2) {
    return ["#ff5e68", "#ffb14d", "#ffe872", "#6edfa6", "#65c5ff", "#8f91ff"];
  }
  if (type === 3) {
    return ["#ff7eb6", "#80d4ff", "#ffd980"];
  }
  if (type === 4) {
    return ["#8ff0c2", "#ffd36b", "#98bbff"];
  }
  return ["#eef6ff"];
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

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const { x: sx, y: sy } = worldToScreen(x, y, tileSize);
      ctx.fillStyle = (x + y) % 2 === 0 ? "#f8efd1" : "#f5e7c0";
      ctx.fillRect(sx, sy, tileSize + 1, tileSize + 1);
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
        const colors = artPalette(type);
        const stripeW = (tileSize - pad * 2) / colors.length;
        for (let i = 0; i < colors.length; i += 1) {
          ctx.fillStyle = colors[i];
          ctx.fillRect(sx + pad + stripeW * i, sy + pad, stripeW, tileSize - pad * 2);
        }
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
  if (input.ArrowUp) {
    zoom += ZOOM_SPEED * dt;
  }
  if (input.ArrowDown) {
    zoom -= ZOOM_SPEED * dt;
  }

  zoom = Math.max(0.75, Math.min(1.8, zoom));

  const forwardX = Math.cos(player.lookAngle);
  const forwardY = Math.sin(player.lookAngle);
  const rightX = Math.cos(player.lookAngle + Math.PI / 2);
  const rightY = Math.sin(player.lookAngle + Math.PI / 2);

  let vx = 0;
  let vy = 0;

  if (input.KeyW) {
    vx += forwardX;
    vy += forwardY;
  }
  if (input.KeyS) {
    vx -= forwardX;
    vy -= forwardY;
  }
  if (input.KeyA) {
    vx -= rightX;
    vy -= rightY;
  }
  if (input.KeyD) {
    vx += rightX;
    vy += rightY;
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
}

function render() {
  const tileSize = Math.max(20, Math.min(120, 78 * zoom));
  drawFloor(tileSize);
  drawWorld(tileSize);
  drawRoomLabels(tileSize);
  drawPlayer(tileSize);
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
