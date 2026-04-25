const canvas = document.getElementById("scene");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#dff3ff");
scene.fog = new THREE.Fog("#dff3ff", 9, 28);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 1.7, 42);

const galleryWidth = 15;
const galleryDepth = 24;
const wallHeight = 4.8;
const roomCount = 4;
const totalDepth = galleryDepth * roomCount;

const room = new THREE.Group();
scene.add(room);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(galleryWidth, totalDepth, 16, 40),
  new THREE.MeshStandardMaterial({ color: "#fef6dd", roughness: 0.9, metalness: 0 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
room.add(floor);

const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(galleryWidth, totalDepth),
  new THREE.MeshStandardMaterial({ color: "#fffaf0", roughness: 0.9 }),
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = wallHeight;
room.add(ceiling);

function createWall(width, height, x, y, z, ry = 0) {
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ color: "#f5fcff", roughness: 0.95 }),
  );
  wall.position.set(x, y, z);
  wall.rotation.y = ry;
  wall.receiveShadow = true;
  room.add(wall);
}

createWall(galleryWidth, wallHeight, 0, wallHeight / 2, -totalDepth / 2);
createWall(galleryWidth, wallHeight, 0, wallHeight / 2, totalDepth / 2, Math.PI);
createWall(totalDepth, wallHeight, -galleryWidth / 2, wallHeight / 2, 0, Math.PI / 2);
createWall(totalDepth, wallHeight, galleryWidth / 2, wallHeight / 2, 0, -Math.PI / 2);

const doorwayWidth = 3.8;
const halfSegment = (galleryWidth - doorwayWidth) / 4;
for (let i = 1; i < roomCount; i += 1) {
  const dividerZ = totalDepth / 2 - galleryDepth * i;
  createWall((galleryWidth - doorwayWidth) / 2, wallHeight, -halfSegment - doorwayWidth / 2, wallHeight / 2, dividerZ);
  createWall((galleryWidth - doorwayWidth) / 2, wallHeight, halfSegment + doorwayWidth / 2, wallHeight / 2, dividerZ);
}

const hemi = new THREE.HemisphereLight("#fff2bf", "#aed2ee", 0.74);
scene.add(hemi);

const key = new THREE.DirectionalLight("#fff6db", 0.8);
key.position.set(2, 7, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -14;
key.shadow.camera.right = 14;
key.shadow.camera.top = 60;
key.shadow.camera.bottom = -60;
scene.add(key);

for (let i = 0; i < roomCount; i += 1) {
  const roomCenterZ = totalDepth / 2 - galleryDepth * i - galleryDepth / 2;
  const spot = new THREE.SpotLight("#fff6de", 0.9, 30, Math.PI * 0.27, 0.55, 1.1);
  spot.position.set(0, wallHeight - 0.2, roomCenterZ);
  spot.target.position.set(0, 0, roomCenterZ);
  spot.castShadow = i === 0;
  scene.add(spot);
  scene.add(spot.target);
}

function paintSky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#8fd2ff");
  g.addColorStop(1, "#e6f8ff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#ffdf5e";
  ctx.beginPath();
  ctx.arc(110, 95, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 7; i += 1) {
    const x = 85 + i * 95;
    const y = 45 + (i % 3) * 16;
    ctx.beginPath();
    ctx.arc(x, y, 19, 0, Math.PI * 2);
    ctx.arc(x + 26, y + 4, 23, 0, Math.PI * 2);
    ctx.arc(x + 52, y, 17, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#74be56";
  ctx.fillRect(0, h - 84, w, 84);
}

function paintRainbow(ctx, w, h) {
  paintSky(ctx, w, h);
  const colors = ["#ff5b63", "#ffae45", "#ffe66e", "#52d68d", "#50b7ff", "#7a87ff"];
  ctx.lineWidth = 20;
  colors.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(w / 2, h + 42, 200 - i * 22, Math.PI, Math.PI * 2);
    ctx.stroke();
  });
}

function paintBalloons(ctx, w, h) {
  paintSky(ctx, w, h);
  const balloons = [
    { x: 150, y: 170, c: "#ff6f91" },
    { x: 245, y: 130, c: "#8c7dff" },
    { x: 340, y: 175, c: "#56d0ff" },
    { x: 435, y: 140, c: "#ffb35c" },
  ];

  balloons.forEach((b) => {
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 36, 46, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#5c6778";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + 43);
    ctx.bezierCurveTo(b.x - 9, b.y + 70, b.x + 11, b.y + 95, b.x - 5, b.y + 118);
    ctx.stroke();
  });

  ctx.fillStyle = "#f2a23d";
  for (let i = 0; i < 6; i += 1) {
    const bx = 70 + i * 100;
    ctx.fillRect(bx, h - 95 - (i % 2) * 10, 28, 30 + (i % 3) * 11);
    ctx.beginPath();
    ctx.moveTo(bx + 14, h - 95 - (i % 2) * 10);
    ctx.lineTo(bx + 7, h - 112 - (i % 2) * 10);
    ctx.lineTo(bx + 21, h - 112 - (i % 2) * 10);
    ctx.closePath();
    ctx.fill();
  }
}

function paintFriendlyShapes(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#fff7c2");
  g.addColorStop(1, "#e7f7ff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 18; i += 1) {
    const x = 60 + (i % 6) * 90;
    const y = 75 + Math.floor(i / 6) * 125;
    const r = 24 + (i % 3) * 8;

    ctx.fillStyle = ["#ff8a80", "#ffd166", "#5cd5b0", "#67c9ff", "#9b8bff"][i % 5];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1f3752";
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 8, y - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#1f3752";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 2, 10, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}

function createArtTexture(painter) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 420;
  const ctx = c.getContext("2d");
  painter(ctx, c.width, c.height);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addPainting(texture, x, y, z, ry, width = 2.6, height = 1.8) {
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.2, height + 0.2, 0.13),
    new THREE.MeshStandardMaterial({ color: "#9e6b32", roughness: 0.6 }),
  );
  frame.position.set(x, y, z);
  frame.rotation.y = ry;
  frame.castShadow = true;
  room.add(frame);

  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7 }),
  );
  art.position.set(x, y, z + (ry === 0 ? 0.071 : ry === Math.PI ? -0.071 : 0));

  if (Math.abs(ry - Math.PI / 2) < 0.001) {
    art.position.x = x + 0.071;
  } else if (Math.abs(ry + Math.PI / 2) < 0.001) {
    art.position.x = x - 0.071;
  }

  art.rotation.y = ry;
  room.add(art);
}

const painters = [paintRainbow, paintBalloons, paintFriendlyShapes];
const frontBackX = [-4.4, 0, 4.4];

for (let i = 0; i < roomCount; i += 1) {
  const roomCenterZ = totalDepth / 2 - galleryDepth * i - galleryDepth / 2;
  const northZ = roomCenterZ - galleryDepth / 2 + 0.07;
  const southZ = roomCenterZ + galleryDepth / 2 - 0.07;

  frontBackX.forEach((x, index) => {
    addPainting(createArtTexture(painters[(i + index) % painters.length]), x, 2.2, northZ, 0);
    addPainting(createArtTexture(painters[(i + index + 1) % painters.length]), x, 2.2, southZ, Math.PI);
  });

  addPainting(createArtTexture(painters[i % painters.length]), -galleryWidth / 2 + 0.07, 2.2, roomCenterZ - 4, Math.PI / 2, 2.1, 1.5);
  addPainting(createArtTexture(painters[(i + 1) % painters.length]), -galleryWidth / 2 + 0.07, 2.2, roomCenterZ + 4, Math.PI / 2, 2.1, 1.5);
  addPainting(createArtTexture(painters[(i + 2) % painters.length]), galleryWidth / 2 - 0.07, 2.2, roomCenterZ - 4, -Math.PI / 2, 2.1, 1.5);
  addPainting(createArtTexture(painters[i % painters.length]), galleryWidth / 2 - 0.07, 2.2, roomCenterZ + 4, -Math.PI / 2, 2.1, 1.5);
}

const pillars = new THREE.Group();
room.add(pillars);
for (let r = 0; r < roomCount; r += 1) {
  const roomCenterZ = totalDepth / 2 - galleryDepth * r - galleryDepth / 2;
  for (let i = -1; i <= 1; i += 1) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, wallHeight, 18),
      new THREE.MeshStandardMaterial({ color: "#f0f6fb", roughness: 0.85 }),
    );
    pillar.position.set(i * 3.5, wallHeight / 2, roomCenterZ);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    pillars.add(pillar);
  }
}

const moveState = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
};

let yaw = Math.PI;
let pitch = 0;
const moveSpeed = 4.8;
const lookSpeed = 1.45;

const minX = -galleryWidth / 2 + 0.8;
const maxX = galleryWidth / 2 - 0.8;
const minZ = -totalDepth / 2 + 0.8;
const maxZ = totalDepth / 2 - 0.8;

window.addEventListener("keydown", (event) => {
  if (event.code in moveState) {
    moveState[event.code] = true;
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code in moveState) {
    moveState[event.code] = false;
    event.preventDefault();
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function updateControls(dt) {
  if (moveState.ArrowLeft) yaw += lookSpeed * dt;
  if (moveState.ArrowRight) yaw -= lookSpeed * dt;
  if (moveState.ArrowUp) pitch += lookSpeed * dt;
  if (moveState.ArrowDown) pitch -= lookSpeed * dt;

  pitch = Math.max(-1.15, Math.min(1.15, pitch));

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const velocity = new THREE.Vector3();

  if (moveState.KeyW) velocity.add(forward);
  if (moveState.KeyS) velocity.sub(forward);
  if (moveState.KeyA) velocity.sub(right);
  if (moveState.KeyD) velocity.add(right);

  if (velocity.lengthSq() > 0) {
    velocity.normalize().multiplyScalar(moveSpeed * dt);
    camera.position.add(velocity);
    camera.position.x = Math.max(minX, Math.min(maxX, camera.position.x));
    camera.position.z = Math.max(minZ, Math.min(maxZ, camera.position.z));
  }

  const lookDir = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  );
  camera.lookAt(camera.position.clone().add(lookDir));
}

function animate() {
  const dt = Math.min(0.033, clock.getDelta());
  updateControls(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
