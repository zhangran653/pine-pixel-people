// Run with node tests/check-skull.cjs from any working directory.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const read = (name) => readFileSync(resolve(__dirname, '..', name), 'utf8');
const context = vm.createContext({ structuredClone });
for (const [, name] of read('atelier.html').matchAll(/<script defer src="([^"]+\.js)"/g)) {
  if (name === 'appearance-store.js') break;
  if (name !== 'workspace.js') vm.runInContext(read(name), context, { filename: name });
}
const looks = context.PineLooks;
const rig = vm.runInContext('studioRig', context);
const skulls = vm.runInContext('pineSkull', context);
const digest = (cells) =>
  createHash('sha256').update(Buffer.from(cells.buffer, cells.byteOffset, cells.byteLength)).digest('hex');
const distance = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]));

function depthsOfStandaloneSkull() {
  // Sample the same volumetric brushes without a character, its art or a camera.
  const form = { eye: 0.12, mouth: -0.43, chin: -0.755 };
  const sockets = {
    leftEye: { point: [0.86, 0.46, form.eye] },
    leftJawAngle: { point: [0.15, 0.58, -0.52] },
    leftJawJoint: { point: [0.13, 0.75, -0.25] }
  };
  const bone = skulls.bind({
    fit: { x: 0, z: 0, rx: 1, ry: 1, rz: 1 }, form, sockets,
    driver: skulls.proportions('adult', {}, form)
  });
  let frame;
  const samples = {};
  const brush = {
    frame(part) { frame = part; },
    stamp(...args) { samples[frame] = args.at(-1); }
  };
  const ink = Object.fromEntries(Object.keys(skulls.materials).map((name, index) => [name, index + 1]));
  bone.paint({ head: 'cranium', jaw: 'mandible' }, brush, ink);
  function front(y, z) {
    for (let x = 1.3; x >= -1; x -= 0.01) if (samples.cranium(x, y, z)) return x;
    return -1;
  }
  for (const y of [-0.46, 0.46]) {
    assert.ok(front(y, form.eye + 0.20) > front(y, form.eye) + 0.09, 'orbital rim over a hollow socket');
  }
  const apertureZ = form.mouth + 0.46 * (form.eye - form.mouth);
  assert.ok(front(0.14, apertureZ) > front(0, apertureZ) + 0.12, 'open nasal aperture');
  assert.ok(samples.mandible(...sockets.leftJawJoint.point), 'condyle contains its joint');
  assert.equal(samples.mandible(0.38, 0, -0.58), 0, 'open space between the two sides of the mandible');
}
depthsOfStandaloneSkull();

for (const age of ['adult', 'child', 'toddler', 'baby']) {
  const source = [...looks.archivedTemplates.values()].find(draft => draft.base === age);
  const skullDigests = new Set(), formDigests = new Set();
  for (const skull of ['balanced', 'long', 'round', 'angular']) {
    const actor = looks.build({
      ...source, face: { ...looks.facePresets.classic.face, style: 'animation' },
      packs: { 'pine-core': '1.19.2' }, anatomyParts: { skull }
    });
    const label = age + '/' + skull;
    const body = actor.anatomy.body('skull');
    const closed = rig.pose(actor.rig), opened = rig.pose(actor.rig, { jawOpen: 1 });
    const still = body.makePose(closed).colors, open = body.makePose(opened).colors;
    const outer = actor.anatomy.body('form').makePose(closed).colors;
    const left = actor.sockets.leftJawJoint.point, right = actor.sockets.rightJawJoint.point;
    assert.equal(left[0], actor.rig.jawPivot[0]);
    assert.equal(left[2], actor.rig.jawPivot[2]);
    assert.equal(left[1], -right[1]);
    assert.ok(left[2] < actor.sockets.leftEarCanal.point[2], label + ' hinge below ear');
    const chin = rig.socket(actor, closed, 'chinTip'), movedChin = rig.socket(actor, opened, 'chinTip');
    const movedJoint = rig.socket(actor, opened, 'leftJawJoint');
    assert.ok(movedChin[2] < chin[2], label + ' open chin descends');
    assert.ok(Math.abs(distance(chin, left) - distance(movedChin, movedJoint)) < 1e-6, label + ' rigid mandible');
    const upper = Math.ceil((left[2] + 0.35 * (actor.sockets.leftEye.point[2] - left[2])) * body.density);
    const cut = body.nx * body.ny * upper;
    assert.equal(digest(still.subarray(cut)), digest(open.subarray(cut)), label + ' opening holds the cranium still');
    assert.notEqual(digest(still), digest(open), label + ' opening moves jaw voxels');
    let occupied = 0, exposed = 0;
    for (let i = 0; i < still.length; i++) {
      if (!still[i]) continue;
      occupied++;
      if (!outer[i]) exposed++;
    }
    assert.ok(occupied > 500 && exposed < 0.008 * occupied, label + ' bone fits under the soft tissue');
    skullDigests.add(digest(still));
    formDigests.add(digest(outer));
  }
  assert.equal(skullDigests.size, 4, age + ' four different skulls');
  assert.equal(formDigests.size, 4, age + ' outer head follows the selected skull');
}
console.log('Passed skull construction, four ages, four skull shapes, soft tissue and jaw articulation.');
