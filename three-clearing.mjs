// A cedar lookout above a mountain stream. World units are metres, with Y up.
export function buildClearing(THREE, scene) {
  const tau = Math.PI * 2;
  const waterLevel = -0.34;
  const boardCount = 19,
    boardPitch = 0.19,
    deckHalfDepth = 1.055;
  const railZ = -0.92;
  const root = new THREE.Group(),
    rail = new THREE.Group();
  root.name = 'Pine Creek clearing';
  rail.name = 'Creekside guardrail';
  scene.add(root);
  root.add(rail);

  function random(seed) {
    let n = seed >>> 0;
    return () => {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      return n / 4294967296;
    };
  }

  const matte = new THREE.MeshLambertMaterial({ vertexColors: true });
  const swatches = new Map();
  function linearColor(hex) {
    if (!swatches.has(hex)) swatches.set(hex, new THREE.Color(hex));
    return swatches.get(hex);
  }
  function batch() {
    return { positions: [], colors: [] };
  }
  function triangle(target, a, b, c, hex) {
    const color = linearColor(hex);
    target.positions.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) target.colors.push(color.r, color.g, color.b);
  }
  function quad(target, a, b, c, d, hex) {
    triangle(target, a, b, c, hex);
    triangle(target, a, c, d, hex);
  }
  function finish(target, parent, name, cast, receive, material = matte) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(target.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(target.colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    parent.add(mesh);
    return mesh;
  }
  const land = batch(),
    water = batch(),
    objects = batch(),
    railing = batch(),
    horizon = batch();

  function box(target, x, y, z, w, h, d, color, top = color, cap = true) {
    const a = x - w / 2,
      b = x + w / 2,
      c = z - d / 2,
      e = z + d / 2,
      t = y + h;
    if (cap) quad(target, [a, t, c], [a, t, e], [b, t, e], [b, t, c], top);
    quad(target, [a, y, c], [b, y, c], [b, y, e], [a, y, e], color);
    quad(target, [a, y, c], [a, t, c], [b, t, c], [b, y, c], color);
    quad(target, [b, y, c], [b, t, c], [b, t, e], [b, y, e], color);
    quad(target, [b, y, e], [b, t, e], [a, t, e], [a, y, e], color);
    quad(target, [a, y, e], [a, t, e], [a, t, c], [a, y, c], color);
  }
  function frustum(target, lower, upper, r0, r1, sides, colors, spin = 0) {
    const b = [],
      t = [];
    for (let i = 0; i < sides; i++) {
      const a = spin + (tau * i) / sides,
        dx = Math.cos(a),
        dz = Math.sin(a);
      b.push([lower[0] + dx * r0, lower[1], lower[2] + dz * r0]);
      t.push([upper[0] + dx * r1, upper[1], upper[2] + dz * r1]);
    }
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      quad(target, b[i], t[i], t[j], b[j], colors[i % colors.length]);
      triangle(target, upper, t[j], t[i], colors[0]);
    }
  }
  const creekZ = (x) =>
    -2.49 + 0.63 * Math.sin(0.51 * x + 1.2) + 0.79 * Math.sin(0.25 * x - 0.55) + 0.2 * Math.sin(x * 0.89);
  const creekWidth = (x) =>
    1.23 +
    0.25 * Math.sin(0.4 * x + 1.1) +
    0.12 * Math.sin(0.71 * x - 1.8) +
    0.065 * Math.sin(1.55 * x + 0.81);
  function groundHeight(x, z) {
    const margin = Math.abs(z - creekZ(x)) - creekWidth(x);
    if (margin < 0.14) return waterLevel - 0.04 + margin * 0.45;
    const distance = Math.hypot(x, z);
    const upland = Math.min(1, Math.max(0, (distance - 2.1) / 8));
    const meadow =
      -0.16 +
      upland *
        (0.37 + 0.27 * Math.sin(x * 0.43) + 0.21 * Math.cos(z * 0.74) + 0.18 * Math.sin((x + z) * 0.56));
    const blend = Math.min(1, (margin - 0.14) / 0.7);
    return (waterLevel + 0.023) * (1 - blend) + meadow * blend;
  }
  const pick = (array, n) => array[Math.floor(n * array.length)];
  const gravel = ['#9d9a7e', '#a6a386', '#aca98a', '#a4a083'];
  const sand = ['#c1b68e', '#c5ba92', '#b9b18c', '#c3b690'];
  const moss = ['#a2ad7e', '#a6ad7c', '#a2aa78', '#a9b281'];
  const meadow = ['#a5b780', '#aab986', '#a3b57e', '#afbc88', '#aab884'];
  const slopes = ['#9aaf87', '#a6b68e', '#a1b58a', '#9eb58d'];
  const shelf = [-0.18, 0.05, 0.24, 0.52, 0.95, 1.6, 2.6, 4.1, 6.2, 9.0, 13, 19, 27, 35];
  const channels = [-1, -0.8, -0.54, -0.2, 0.18, 0.52, 0.81, 1];
  const shallows = ['#a8c9b8', '#85b9b1', '#61a3a6', '#498d99', '#5195a0', '#66a8ac', '#85bcb4', '#a8cab9'];
  const warmWater = ['#afcebb', '#8dbfb2', '#6aafb1', '#50939e', '#599ba2', '#6bb0af', '#8cc0b5', '#b1cbba'];
  const terrainRng = random(485723);
  function shore(x, index, side, outer) {
    const margin = shelf[index],
      width = creekWidth(x);
    const spread = outer ? 0.11 * Math.sin(x * 0.92 + index * 2.3 + side) * Math.min(margin, 4) : 0;
    const z = creekZ(x) + side * (width + margin + spread);
    return [x, groundHeight(x, z), z];
  }
  function upward(target, a, b, c, d, color) {
    if ((b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]) > 0) quad(target, a, b, c, d, color);
    else quad(target, a, d, c, b, color);
  }
  const terrainRows = [];
  for (let i = 0; i <= 80; i++) {
    const x = -34 + i * 0.85;
    terrainRows.push([-1, 1].map((side) => shelf.map((_, j) => shore(x, j, side, j > 3))));
  }
  // Interpolate the actual two terrain triangles when placing roots and small stones.
  function landAt(x, z) {
    const column = (x + 34) / 0.85,
      i = Math.max(0, Math.min(79, Math.floor(column)));
    const t = Math.max(0, Math.min(1, column - i)),
      side = z >= creekZ(x) ? 1 : -1;
    const left = terrainRows[i][Number(side > 0)],
      right = terrainRows[i + 1][Number(side > 0)];
    const interp = (a, b) => a + (b - a) * t;
    for (let j = 1; j < shelf.length; j++) {
      const inner = interp(left[j - 1][2], right[j - 1][2]),
        outer = interp(left[j][2], right[j][2]);
      if (side * (z - outer) > 0) continue;
      const split = interp(left[j - 1][2], right[j][2]);
      const splitY = interp(left[j - 1][1], right[j][1]);
      const dist = z - split,
        near = side * dist < 0;
      const dz = (near ? inner : outer) - split;
      const endY = near ? interp(left[j - 1][1], right[j - 1][1]) : interp(left[j][1], right[j][1]);
      return Math.abs(dz) < 1e-6 ? splitY : splitY + ((endY - splitY) * dist) / dz;
    }
    return groundHeight(x, z);
  }
  function waterPoint(x, k) {
    const edge = channels[k];
    const offset =
      edge + (1 - Math.abs(edge)) * (0.07 * Math.sin(0.83 * x + k) + 0.045 * Math.cos(0.49 * x + 1.7 * k));
    const color = Math.cos(x * 0.67 + k * 0.95) > 0.24 ? warmWater[k] : shallows[k];
    return [
      [x, waterLevel + 0.005 * Math.sin(x * 1.5 + k * 0.9), creekZ(x) + creekWidth(x) * offset],
      linearColor(color)
    ];
  }
  for (let i = 0; i < 80; i++) {
    const x = -34 + i * 0.85,
      next = x + 0.85;
    for (let side = 0; side < 2; side++) {
      const left = terrainRows[i][side],
        right = terrainRows[i + 1][side];
      for (let j = 0; j < shelf.length - 1; j++) {
        const colors = j < 2 ? gravel : j === 2 ? sand : j < 5 ? moss : j < 10 ? meadow : slopes;
        upward(land, left[j], right[j], right[j + 1], left[j + 1], pick(colors, terrainRng()));
      }
    }
    for (let j = 0; j < channels.length - 1; j++) {
      const a = waterPoint(x, j),
        b = waterPoint(x, j + 1),
        c = waterPoint(next, j + 1),
        d = waterPoint(next, j);
      for (const [p, ink] of [a, b, c, a, c, d]) {
        water.positions.push(...p);
        water.colors.push(ink.r, ink.g, ink.b);
      }
    }
  }

  // Low-contrast pixel grain is painted into a small texture so the deck stays
  // perfectly planar, including under the character's feet.
  const stripPixels = 12,
    texW = boardCount * stripPixels,
    texH = 128;
  const pixels = new Uint8Array(texW * texH * 4);
  const plankTones = [
    [185, 140, 101],
    [195, 149, 106],
    [178, 134, 99],
    [198, 153, 110],
    [188, 143, 102]
  ];
  const grainRng = random(719443);
  function woodPixel(board, u, v, base, light = 0) {
    if (u < 0 || u >= stripPixels || v < 0 || v >= texH) return;
    const n = (v * texW + board * stripPixels + u) * 4;
    pixels[n] = base[0] + light;
    pixels[n + 1] = base[1] + light;
    pixels[n + 2] = base[2] + light;
    pixels[n + 3] = 255;
  }
  const deckPoints = [],
    deckUV = [];
  for (let i = 0; i < boardCount; i++) {
    const tone = pick(plankTones, grainRng()),
      center = (i - (boardCount - 1) / 2) * boardPitch;
    const edge = deckHalfDepth + (grainRng() - 0.5) * 0.018;
    const w = boardPitch - 0.009,
      a = center - w / 2,
      b = center + w / 2;
    box(objects, center, -0.083, 0, w, 0.083, edge * 2, '#996f51', undefined, false);
    deckPoints.push(a, 0, -edge, a, 0, edge, b, 0, edge, a, 0, -edge, b, 0, edge, b, 0, -edge);
    const u0 = (i * stripPixels + 0.5) / texW,
      u1 = ((i + 1) * stripPixels - 0.5) / texW,
      v0 = 0.5 / texH,
      v1 = 1 - v0;
    deckUV.push(u0, v0, u0, v1, u1, v1, u0, v0, u1, v1, u1, v0);
    for (let u = 0; u < stripPixels; u++) {
      const light = u === 0 ? 6 : u === stripPixels - 1 ? -8 : Math.floor(grainRng() * 5) - 2;
      for (let v = 0; v < texH; v++) woodPixel(i, u, v, tone, light);
    }
    for (let mark = 0; mark < 17; mark++) {
      let u = 1 + Math.floor(grainRng() * 10),
        v = Math.floor(grainRng() * texH);
      const run = 4 + Math.floor(grainRng() * 24),
        bend = Math.floor(grainRng() * run),
        kink = grainRng() > 0.5 ? 1 : -1;
      const shade = grainRng() > 0.3 ? -5 - Math.floor(grainRng() * 8) : 7 + Math.floor(grainRng() * 4);
      for (let k = 0; k < run; k++) woodPixel(i, u + (k >= bend ? kink : 0), v + k, tone, shade);
    }
    if (i % 3 === 1) {
      const mid = 24 + Math.floor(grainRng() * 79),
        u = 4 + Math.floor(grainRng() * 4);
      for (let d = -6; d <= 6; d++) {
        const off = Math.abs(d) > 4 ? 1 : 2;
        woodPixel(i, u - off, mid + d, tone, -9);
        woodPixel(i, u + off, mid + d, tone, 5);
        if (Math.abs(d) < 3) woodPixel(i, u, mid + d, tone, -16);
      }
    }
    for (const v of [9, texH - 10]) {
      const u = 3 + Math.floor(grainRng() * 6);
      woodPixel(i, u, v, [111, 104, 88]);
      woodPixel(i, u + 1, v, [134, 124, 100]);
    }
  }
  const tex = new THREE.DataTexture(pixels, texW, texH, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  const boards = new THREE.BufferGeometry();
  boards.setAttribute('position', new THREE.Float32BufferAttribute(deckPoints, 3));
  boards.setAttribute('uv', new THREE.Float32BufferAttribute(deckUV, 2));
  boards.computeVertexNormals();
  const deck = new THREE.Mesh(boards, new THREE.MeshLambertMaterial({ map: tex }));
  deck.name = 'Cedar walking surface';
  deck.castShadow = true;
  deck.receiveShadow = true;
  root.add(deck);
  for (const z of [-0.86, 0.86]) {
    box(objects, 0, -0.205, z, 3.6, 0.116, 0.118, '#876549');
    for (const x of [-1.58, 0, 1.58]) box(objects, x, -0.67, z, 0.105, 0.47, 0.14, '#795e49');
  }

  // The short rail is independently switchable and participates in the depth buffer.
  for (const x of [-1.56, 0.26, 1.56]) {
    box(railing, x, -0.13, railZ, 0.103, 0.71, 0.106, '#a37955', '#c69a6e');
    box(railing, x, 0.559, railZ, 0.12, 0.029, 0.122, '#9f7856', '#cda57b');
    box(railing, x, 0.045, railZ, 0.112, 0.075, 0.115, '#73776a');
  }
  box(railing, 0, 0.448, railZ, 3.31, 0.096, 0.087, '#aa805b', '#cd9f70');
  box(railing, 0, 0.197, railZ, 3.14, 0.055, 0.056, '#aa805e', '#c49a72');
  for (const x of [-1.55, 0.26, 1.55]) {
    for (const dir of [-1, 1]) box(railing, x, 0.476, railZ + dir * 0.055, 0.023, 0.023, 0.006, '#7b7767');
  }

  const rockSide = ['#82918a', '#99a194', '#89978d', '#a7a899', '#929b8c'];
  const rockTop = ['#b7b9a5', '#b6b5a2', '#abb29e'];
  function stone(x, z, rise, rx, rz, seed, base) {
    const rng = random(seed),
      count = 7,
      phase = rng() * tau;
    const bottom = [],
      waist = [],
      crown = [],
      lift = rise * (0.59 + rng() * 0.12);
    const inset = 0.43 + rng() * 0.18;
    for (let i = 0; i < count; i++) {
      const angle = phase + (tau * (i + (rng() - 0.5) * 0.24)) / count,
        variation = 0.83 + rng() * 0.27;
      const xx = rx * Math.cos(angle) * variation,
        zz = rz * Math.sin(angle) * variation;
      bottom.push([x + xx * 0.8, base - 0.06, z + zz * 0.82]);
      waist.push([x + xx, base + lift * (0.77 + rng() * 0.28), z + zz]);
      crown.push([x + xx * inset - 0.06 * rx, base + rise * (0.88 + rng() * 0.12), z + zz * inset]);
    }
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      quad(objects, bottom[i], waist[i], waist[j], bottom[j], pick(rockSide, rng()));
      quad(objects, waist[i], crown[i], crown[j], waist[j], pick(rockSide, rng()));
      triangle(objects, [x, base + rise, z], crown[j], crown[i], pick(rockTop, rng()));
    }
  }
  const ripples = random(8241);
  function ripple(x, z, length, width, hex) {
    const y = waterLevel + 0.016,
      k = 0.05 * Math.cos(x + z);
    upward(
      water,
      [x - length * 0.5, y, z],
      [x - length * 0.08, y, z + width],
      [x + length * 0.5, y, z + k],
      [x + length * 0.09, y, z - width * 0.22],
      hex
    );
  }
  for (let j = 0; j < 166; j++) {
    const x = (ripples() - 0.5) * 39;
    const z = creekZ(x) + (ripples() - 0.5) * creekWidth(x) * 1.8;
    ripple(
      x,
      z,
      0.1 + ripples() * 0.55,
      0.014 + ripples() * 0.032,
      pick(['#91c3bb', '#8cbab5', '#719fa3'], ripples())
    );
  }
  const rockSeeds = random(82442);
  for (const [x, side, r] of [
    [-5.4, -0.69, 0.41],
    [-3.1, 0.74, 0.22],
    [-1.75, -0.72, 0.28],
    [0.9, -0.73, 0.32],
    [2.76, 0.54, 0.48],
    [3.34, 0.73, 0.19],
    [5.7, -0.61, 0.38],
    [7.3, 0.83, 0.24],
    [-8, 0.59, 0.26]
  ]) {
    const z = creekZ(x) + side * creekWidth(x);
    stone(x, z, r * 0.8, r, r * 0.76, Math.floor(rockSeeds() * 1e6), waterLevel - 0.065);
    ripple(x - r * 0.77, z - 0.15 * r, r * 1.13, 0.028, '#b8d5c9');
    ripple(x + r, z + 0.43 * r, r * 0.77, 0.023, '#a4c9bd');
  }
  [
    [1.97, 0.26, 0.36, 0.22],
    [2.47, 0.49, 0.28, 0.2],
    [-3.4, 1.3, 0.32, 0.23],
    [-3.78, 1.5, 0.16, 0.12],
    [3.2, -4.2, 0.36, 0.28],
    [-6.3, -4.2, 0.41, 0.3]
  ].forEach(([x, z, rx, rz], i) => {
    stone(x, z, 0.08 + 0.08 * (i % 3), rx, rz, 5100 + i, landAt(x, z) - 0.02);
  });
  for (const [bank, side] of [
    [-7.8, -1],
    [-4.2, 1],
    [-2.4, -1],
    [0.8, -1],
    [2.9, 1],
    [5.6, -1],
    [8.3, 1]
  ]) {
    for (let n = 0; n < 4; n++) {
      const x = bank + (rockSeeds() - 0.5) * 0.66;
      const z = creekZ(x) + side * (creekWidth(x) + 0.04 + rockSeeds() * 0.25);
      const r = 0.045 + rockSeeds() * 0.105;
      stone(
        x,
        z,
        r * 0.57,
        r,
        r * (0.63 + rockSeeds() * 0.36),
        Math.floor(rockSeeds() * 1e6),
        landAt(x, z) - r * 0.14
      );
    }
  }

  const treePalette = [
    ['#537f71', '#608c74', '#729a7b', '#446e64'],
    ['#467a70', '#548974', '#68967b', '#3f6d67'],
    ['#688a70', '#759575', '#87a17e', '#567b69'],
    ['#5c8278', '#648e7e', '#749b87', '#50776d']
  ];
  const distantPine = ['#85a397', '#8ca99a', '#97b29f', '#77998e'];
  function pine(x, z, height, radius, seed, far = false) {
    const rng = random(seed),
      base = landAt(x, z) - 0.055,
      target = far ? horizon : objects;
    const palette = far ? distantPine : treePalette[Math.floor(rng() * treePalette.length)];
    const sway = (rng() - 0.5) * radius * 0.33,
      lean = (rng() - 0.5) * radius * 0.27;
    const at = (h) => [x + sway * h, base + height * h, z + lean * h];
    frustum(
      target,
      at(0),
      at(0.86),
      height * 0.033,
      height * 0.012,
      far ? 5 : 7,
      far ? ['#83988a', '#86998a'] : ['#8b785e', '#786e58', '#998265'],
      rng()
    );
    const tiers = far ? 3 : 4,
      branches = far ? 5 : 7;
    for (let k = 0; k < tiers; k++) {
      const t = k / (tiers - 1),
        y = 0.16 + 0.57 * t;
      const h = 0.38 - 0.11 * t,
        r = radius * (1 - 0.63 * t),
        spin = rng() * tau;
      const ring = [],
        shoulders = [],
        radii = [];
      for (let j = 0; j < branches; j++) radii.push(0.85 + 0.2 * rng(), 0.57 + 0.13 * rng());
      for (let j = 0; j < branches * 2; j++) {
        const angle = spin + (tau * j) / (branches * 2),
          len = r * radii[j],
          notch = (j % 2) * 0.043;
        const cx = Math.cos(angle),
          cz = Math.sin(angle),
          basePoint = at(y),
          shoulder = at(y + h * 0.41);
        ring.push([
          basePoint[0] + cx * len,
          base + height * (y + notch + rng() * 0.024),
          basePoint[2] + cz * len
        ]);
        shoulders.push([
          shoulder[0] + cx * len * 0.65,
          shoulder[1] + rng() * 0.024 * height,
          shoulder[2] + cz * len * 0.65
        ]);
      }
      const tip = at(k === tiers - 1 ? 1 : y + h);
      for (let j = 0; j < ring.length; j++) {
        const next = (j + 1) % ring.length,
          tone = (j % 2 === 0 ? 1 : 0) + (t > 0.5 && j % 4 === 0 ? 1 : 0);
        quad(target, ring[j], shoulders[j], shoulders[next], ring[next], palette[tone]);
        triangle(target, shoulders[j], tip, shoulders[next], palette[Math.min(2, tone + 1)]);
        triangle(target, at(y + 0.06), ring[j], ring[next], palette[3]);
      }
    }
  }
  const nearPines = [
    [-5.85, -4.65, 3.45, 0.9],
    [-7.46, -4.98, 2.6, 0.77],
    [-1.83, -7.1, 3.8, 1.02],
    [0.12, -8.15, 2.75, 0.81],
    [3.21, -6.5, 3.56, 0.91],
    [5.54, -5.86, 2.47, 0.66],
    [7.4, -2.12, 3.87, 1.04],
    [8.36, 0.39, 2.67, 0.81],
    [6.84, 3.6, 3.22, 0.92],
    [3.1, 7.73, 3.9, 1.11],
    [1.59, 8.59, 2.83, 0.86],
    [-4.52, 6.57, 3.59, 1.01],
    [-6.33, 7.18, 2.66, 0.77],
    [-8.07, 2.05, 4.02, 1.1],
    [-9.05, 2.94, 2.92, 0.83],
    [-6.64, -4.32, 1.44, 0.47],
    [-2.7, -6.93, 1.31, 0.44],
    [7.21, 4.25, 1.59, 0.49],
    [-5.95, 6.96, 1.38, 0.42]
  ];
  nearPines.forEach(([x, z, h, r], i) => {
    const center = creekZ(x),
      setback = creekWidth(x) + 0.47;
    const rootZ = center + Math.sign(z - center) * Math.max(setback, Math.abs(z - center));
    pine(x, rootZ, h, r, 147291 + i * 471);
  });
  const trees = random(194500);
  for (let i = 0; i < 56; i++) {
    const a = (tau * (i + trees() * 0.72)) / 56,
      dist = 10.4 + trees() * 8.5;
    const x = Math.cos(a) * dist,
      z = Math.sin(a) * dist;
    if (Math.abs(z - creekZ(x)) < creekWidth(x) + 0.72) continue;
    const h = 2.07 + trees() * 2.15;
    pine(x, z, h, h * (0.22 + trees() * 0.075), 23411 + i * 883, true);
  }

  const herbs = random(416420),
    leafColors = ['#728e69', '#89a176', '#9bad7b', '#819970'];
  function herbsAt(x, z, height, count) {
    const base = landAt(x, z) - 0.017;
    for (let i = 0; i < count; i++) {
      const a = herbs() * tau,
        len = height * (0.48 + herbs() * 0.58),
        spread = herbs() * 0.085;
      const px = x + Math.cos(a) * spread,
        pz = z + Math.sin(a) * spread;
      const r = 0.018 + len * 0.11,
        tip = [px + Math.cos(a) * len * 0.49, base + len, pz + Math.sin(a) * len * 0.49];
      const edge = [];
      for (let j = 0; j < 3; j++)
        edge.push([px + Math.cos(a + (j * tau) / 3) * r, base, pz + Math.sin(a + (j * tau) / 3) * r]);
      const tint = pick(leafColors, herbs());
      for (let j = 0; j < 3; j++) triangle(objects, edge[j], tip, edge[(j + 1) % 3], tint);
    }
  }
  for (let i = 0; i < 68; i++) {
    const x = (herbs() - 0.5) * 19,
      side = herbs() > 0.5 ? 1 : -1;
    const z = creekZ(x) + side * (creekWidth(x) + 0.38 + herbs() * 0.9);
    if (Math.abs(x) > 1.88 || Math.abs(z) > 1.1) herbsAt(x, z, 0.13 + herbs() * 0.18, 6);
  }
  for (const [x, z] of [
    [1.95, 0.92],
    [-1.95, 1.18],
    [-2.34, 1.31],
    [2.7, 0.85]
  ])
    herbsAt(x, z, 0.17, 7);

  function fern(x, z, size, seed) {
    const rng = random(seed),
      h = landAt(x, z) - 0.01;
    for (let j = 0; j < 7; j++) {
      const a = (tau * (j + 0.42 * rng())) / 7,
        cx = Math.cos(a),
        cz = Math.sin(a),
        reach = size * (0.72 + rng() * 0.42);
      const blade = (t) => {
        const center = [
          x + cx * reach * t,
          h + size * (0.18 * t + 0.65 * Math.sin(t * 2.66)),
          z + cz * reach * t
        ];
        const tooth = Math.round(t * 9) % 2 ? 1 : 0.43;
        const width = size * 0.17 * Math.sin(Math.PI * t) * tooth;
        return [
          [center[0] - cz * width, center[1], center[2] + cx * width],
          [center[0] + cz * width, center[1] + 0.022 * size, center[2] - cx * width]
        ];
      };
      let prev = blade(0);
      for (let k = 1; k <= 9; k++) {
        const next = blade(k / 9);
        upward(objects, prev[0], prev[1], next[1], next[0], j % 2 === 0 ? '#739769' : '#91aa75');
        prev = next;
      }
    }
  }
  for (const [i, [x, z, s]] of [
    [-2.01, 0.57, 0.35],
    [2.28, -0.23, 0.37],
    [-3.41, -0.38, 0.31],
    [2.95, -4.54, 0.39],
    [-0.93, -4.59, 0.31],
    [4.26, -3.45, 0.36]
  ].entries())
    fern(x, z, s, 356 + i * 113);
  // Small patches of oxeye daisies punctuate the bank without crowding the deck.
  for (const [x, z] of [
    [-2.14, 0.91],
    [2.33, 0.95],
    [2.71, 0.72],
    [-2.72, -4.81],
    [3.42, -4.88]
  ]) {
    for (let i = 0; i < 4; i++) {
      const px = x + (herbs() - 0.5) * 0.32,
        pz = z + (herbs() - 0.5) * 0.25,
        h = landAt(px, pz) - 0.01;
      const y = h + 0.095 + herbs() * 0.09,
        bloom = 0.03 + herbs() * 0.013;
      frustum(objects, [px - 0.015, h, pz], [px, y, pz], 0.005, 0.004, 3, ['#7b9469']);
      for (let j = 0; j < 5; j++) {
        const a = (tau * j) / 5 + 0.36 * i,
          cx = Math.cos(a),
          cz = Math.sin(a);
        const petal = (r, w, lift) => [
          px + bloom * (cx * r - cz * w),
          y + lift,
          pz + bloom * (cz * r + cx * w)
        ];
        upward(
          objects,
          petal(0.07, 0, 0),
          petal(0.55, -0.27, 0.003),
          petal(1, 0, 0.009),
          petal(0.55, 0.27, 0.003),
          '#f0e5bd'
        );
      }
      const r = bloom * 0.24;
      upward(
        objects,
        [px - r, y + 0.007, pz],
        [px, y + 0.007, pz + r],
        [px + r, y + 0.007, pz],
        [px, y + 0.007, pz - r],
        '#d9af52'
      );
    }
  }

  // Two quiet, continuous ridgelines give the orbit a horizon in every direction.
  const sections = 76,
    near = [],
    middle = [],
    shoulder = [],
    crest = [];
  for (let i = 0; i < sections; i++) {
    const a = (tau * i) / sections,
      c = Math.cos(a),
      s = Math.sin(a);
    const ridges =
      Math.sin(3 * a + 1.3) * 0.76 + Math.sin(7 * a + 0.2) * 0.47 + Math.cos(13 * a - 0.6) * 0.29;
    const rise = 4.25 + ridges + Math.pow(Math.max(0, Math.sin(5 * a + 1.4)), 3) * 1.82;
    const dist = 30.8 + 1.1 * Math.sin(7 * a + 1),
      hill = 2.3 + 0.42 * Math.cos(a * 6) + 0.31 * Math.sin(a * 11);
    near.push([c * 18, -0.12, s * 18]);
    middle.push([c * 22.7, hill, s * 22.7]);
    shoulder.push([c * (dist - 3.7), rise * 0.69, s * (dist - 3.7)]);
    crest.push([c * dist, rise, s * dist]);
  }
  const hillColors = ['#a9bb9f', '#afbea2', '#a8ba9f'];
  const ridgeColors = ['#b0c1b3', '#b5c3b7', '#b1c2b5'];
  for (let i = 0; i < sections; i++) {
    const j = (i + 1) % sections;
    quad(horizon, near[i], near[j], middle[j], middle[i], hillColors[i % 3]);
    quad(horizon, middle[i], middle[j], shoulder[j], shoulder[i], ridgeColors[(i + 1) % 3]);
    quad(
      horizon,
      shoulder[i],
      shoulder[j],
      crest[j],
      crest[i],
      crest[i][1] > 5.76 ? '#d5d8c8' : ridgeColors[i % 3]
    );
  }

  finish(land, root, 'Gravel banks and meadow', false, true);
  finish(
    water,
    root,
    'Mint-green stream',
    false,
    true,
    new THREE.MeshPhongMaterial({
      vertexColors: true,
      specular: 0x27484b,
      shininess: 26
    })
  );
  finish(objects, root, 'Pier, pines and river stones', true, true);
  finish(horizon, root, 'Distant woodline and ridges', false, false);
  finish(railing, rail, 'Cedar rails and capped posts', true, true);
  return { rail };
}
