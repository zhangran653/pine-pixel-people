// Check the production grid traversal against independent ray/box intersections.
// No canvas or GPU is needed to identify which source pixel should be visible.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../scene-depth.js'), 'utf8');
const project = vm.runInNewContext(source + '\nprojectSceneVolume');
const pick = vm.runInNewContext(source + '\npickSceneVolume');
const width = 31, height = 23;
function buffer() {
  return { width, height, colors: new Uint32Array(width * height), depth: new Float32Array(width * height).fill(-Infinity) };
}
function stack(nx, ny, nz, density, color, occupied, position) {
  const voxels = new Uint32Array(nx * ny * nz), cells = [];
  const bounds = [nx, ny, nz, 0, 0, 0];
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    if (!occupied(x, y, z)) continue;
    voxels[(z * ny + y) * nx + x] = color;
    cells.push([x, y, z]);
    for (const [axis, v] of [x, y, z].entries()) {
      bounds[axis] = Math.min(bounds[axis], v);
      bounds[axis + 3] = Math.max(bounds[axis + 3], v + 1);
    }
  }
  return { ...position, body: { nx, ny, nz, density }, model: { colors: voxels, bounds }, color, cells };
}
const rail = stack(7, 6, 5, 1.25, 0xff4477bb, (x, y, z) =>
  z === 4 || ((y === 0 || y === 5) && (x === 0 || x === 6)) || (x === y && z === 2),
  { x: -0.72, y: 0.34, z: 0.36, heading: 0, pickId: 0 });
const crossbar = stack(6, 5, 4, 1.75, 0xff996655, (x, y, z) =>
  y === 2 || (z === 1 && x > 0 && y > 0), { x: 0.28, y: 0.04, z: 0.76, heading: 0.64, pickId: null });

function reference(part, view, pixelX, pixelY) {
  const u = (pixelX + 0.5 - view.x) / view.scaleX, v = (pixelY + 0.5 - view.y) / view.scaleY;
  const a = Math.cos(view.yaw), b = Math.sin(view.yaw), c = Math.cos(view.elevation), s = Math.sin(view.elevation);
  const x = -b * u + a * s * v - part.x, y = a * u + b * s * v - part.y;
  const ch = Math.cos(part.heading), sh = Math.sin(part.heading), d = part.body.density;
  const start = [(ch * x + sh * y) * d + part.body.nx / 2, (-sh * x + ch * y) * d + part.body.ny / 2, (-c * v - part.z) * d];
  const ray = [(ch * a + sh * b) * c * d, (-sh * a + ch * b) * c * d, s * d];
  let closest = -Infinity;
  for (const cell of part.cells) {
    let enter = -Infinity, leave = Infinity;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(ray[i]) < 1e-10) {
        if (start[i] < cell[i] || start[i] >= cell[i] + 1) { leave = -Infinity; break; }
      } else {
        const low = (cell[i] - start[i]) / ray[i], high = (cell[i] + 1 - start[i]) / ray[i];
        enter = Math.max(enter, Math.min(low, high));
        leave = Math.min(leave, Math.max(low, high));
      }
    }
    if (leave > enter) closest = Math.max(closest, leave);
  }
  return Math.fround(closest);
}
let railWins = 0, barWins = 0;
for (const [azimuth, tilt] of [[0, 0], [90, 8], [-145, 24], [35, 24], [180, 66], [270, 90]]) {
  const view = { yaw: azimuth * Math.PI / 180, elevation: tilt * Math.PI / 180, x: 15.19, y: 16.27, scaleX: 3.4, scaleY: 3.1 };
  const forward = buffer(), reverse = buffer();
  for (const part of [rail, crossbar]) project(forward, part, view);
  for (const part of [crossbar, rail]) project(reverse, part, view);
  assert.deepEqual(reverse.colors, forward.colors, 'insertion order at ' + azimuth);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x, r = reference(rail, view, x, y), b = reference(crossbar, view, x, y);
    const nearest = Math.max(r, b), expected = nearest === -Infinity ? 0 : r > b ? rail.color : crossbar.color;
    assert.equal(forward.colors[p], expected, 'color at ' + [azimuth, tilt, x, y]);
    assert.equal(forward.depth[p], nearest, 'depth at ' + [azimuth, tilt, x, y]);
    assert.equal(pick(view, x + 0.4, y + 0.1, [rail, crossbar]),
      expected === 0 ? undefined : expected === rail.color ? rail.pickId : crossbar.pickId, 'select visible cell');
    if (r !== -Infinity && b !== -Infinity) {
      if (r > b) railWins++;
      if (b > r) barWins++;
    }
  }
}
assert.ok(railWins > 10 && barWins > 10, 'both volumes must show through on different overlapping pixels');
const underground = buffer();
project(underground, { ...rail, z: -10 }, { yaw: 0, elevation: 0.4, x: 15, y: 8, scaleX: 2, scaleY: 2, floorZ: 0 });
assert.ok(!underground.colors.some(Boolean), 'the floor hides scenery beneath the ground plane');
