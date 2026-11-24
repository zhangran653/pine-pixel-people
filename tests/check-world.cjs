// Check the same installed catalogs and dependency order used by the public world editor.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto, createHash } = require('node:crypto');
const root = path.join(__dirname, '..'),
  read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const context = vm.createContext({ structuredClone, crypto: webcrypto });
for (const [, source] of read('index.html').matchAll(/<script defer src="([^"]+)"/g)) {
  if (source === 'world-editor.js') break;
  vm.runInContext(read(source), context, { filename: source });
}
const { PineWorld: world, PineMotion: motion, PineLooks: looks, PineWardrobe: store } = context;
const activity = vm.runInContext('activityMotion', context),
  clone = (v) => JSON.parse(JSON.stringify(v));
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const hash = (a) =>
  createHash('sha256')
    .update(Buffer.from(a.buffer, a.byteOffset, a.byteLength))
    .digest('hex');
const find = (id) => motion.characters.get(id);
for (const [id, asset] of world.items) {
  assert.ok(asset.family in world.families && asset.realms.every((k) => k in world.realms));
  const { model } = world.geometry(id);
  assert.ok(
    model.colors.some((c) => c !== 0),
    id
  );
  assert.equal(world.geometry(id).model, model);
}
// Full RGBA digests obtained from the two original HTML Canvas studies at all 28 heights.
for (const [id, rgba] of Object.entries({
  rover: '80ce73f90269983a279501765a8e5c025b61d7e444821317414eda8fb4a5a682',
  aircraft: '0841d85fea5d6390c74aca7772027b5b82bfd1faf27f43183b340b8e1e84094b'
})) {
  const { model, body } = world.geometry(id);
  assert.equal(body.nz, 28);
  assert.equal(hash(model.colors), rgba);
  assert.equal(model.colors.length, body.nx * body.ny * 28);
}
const shapeDefs = JSON.parse(read('character-v1.schema.json')).properties.shape.properties;
for (const doc of looks.templates) {
  const recipe = looks.prepare(doc).recipe,
    copy = looks.build(recipe);
  assert.ok(motion.characters.has(doc.id) && copy.tags.includes(doc.base), doc.id);
  const idle = motion.actions.get('idle').sample(0.4, copy)[0].pose;
  assert.ok(copy.body.makePose(idle).colors.some(Boolean), doc.id);
  if (doc.identity) assert.deepEqual(clone(recipe.identity), clone(doc.identity));
}
for (const key of ['hiker', 'surveyor', 'mother', 'child', 'toddler', 'baby']) {
  const legacy = find(key),
    id = 'look_workshop_' + key,
    preset = find(id);
  assert.equal(legacy.body, preset.body);
  const editable = looks.build(looks.templateById.get(id)),
    pose = motion.rig.pose(editable.rig);
  assert.equal(hash(legacy.body.makePose(pose).colors), hash(editable.body.makePose(pose).colors));
}
for (const key of ['programmer', 'developer', 'manager', 'cashier', 'guide'])
  assert.equal(looks.templateById.get('look_' + key).identity.era, 'modern');
for (const preset of Object.values(motion.presets)) {
  const plan = motion.compile(preset),
    loaded = store.readScoreFile(store.scoreFile(plan.score));
  assert.deepEqual(clone(plan.score), clone(loaded.score));
}
for (const id of ['look_body_male', 'look_body_female', 'look_relay', 'look_workshop_baby']) {
  const doc = looks.templateById.get(id),
    person = looks.build(doc),
    rig = person.rig;
  const pose = motion.rig.pose(rig, { headPitch: 0.27, headYaw: 0.45 });
  assert.ok(
    distance(motion.rig.socket(person, pose, 'headPivot'), motion.rig.point(pose.torso, rig.headPivot)) <
      1e-7,
    id
  );
  assert.ok(rig.headPivot[2] > rig.neck[2] + 0.055 * rig.height, id);
  assert.ok(
    distance(
      motion.rig.socket(person, pose, 'collar'),
      motion.rig.socket(person, motion.rig.pose(rig), 'collar')
    ) < 1e-7
  );
  for (const key of looks.jawControls) {
    assert.deepEqual([shapeDefs[key].minimum, shapeDefs[key].maximum], [-1, 1]);
    const variant = (v) => ({ ...doc, shape: { ...doc.shape, [key]: v } });
    const low = looks.prepare(variant(-1)).recipe,
      high = looks.prepare(variant(1)).recipe;
    assert.equal(high.shape[key], 1);
    assert.equal(low.shape[key], -1);
    assert.throws(() => looks.prepare(variant(1.01)));
    assert.throws(() => looks.prepare({ ...high, packs: { 'pine-core': looks.jawRelease } }));
    assert.ok(!Object.hasOwn(looks.prepare(variant(0)).recipe.shape, key));
    assert.notEqual(
      hash(looks.build(high).body.makePose(pose).colors),
      hash(looks.build(low).body.makePose(pose).colors),
      id + key
    );
  }
}
const skull = vm.runInContext('pineHeadShape', context);
// Measure the actual fine voxels, with one world-space pitch for both releases.
function sideProfile(actor) {
  const pose = motion.rig.pose(actor.rig);
  const point = (name) => motion.rig.socket(actor, pose, name);
  const eye = point('leftEye'), mouth = point('mouth'), ear = point('leftEarCanal'), chin = point('chinTip');
  const band = actor.body.faceLayers(pose, actor.body.makePose(pose), chin[2] - 1, 4)[1];
  const { body, model } = band, d = body.density;
  assert.equal(d, 4);
  function edges(y, z) {
    const row = Math.floor((y - band.y) * d + body.ny / 2);
    const layer = Math.floor((z - band.z) * d);
    const start = (layer * body.ny + row) * body.nx;
    const line = model.colors.subarray(start, start + body.nx);
    const first = line.findIndex(Boolean), last = line.findLastIndex(Boolean);
    assert.ok(first >= 0 && last > first);
    return [first, last].map((i) => band.x + (i + 0.5 - body.nx / 2) / d);
  }
  const [rear, brow] = edges(0, eye[2] + 0.5 * (eye[2] - mouth[2]));
  const cheek = edges(0.49 * ear[1], 0.53 * eye[2] + 0.47 * mouth[2])[1];
  return { rear, brow, depth: brow - rear, cheek, chin: chin[0], lip: mouth[0] };
}
for (const id of ['look_body_male', 'look_fern', 'look_workshop_toddler', 'look_workshop_baby']) {
  const doc = looks.templateById.get(id);
  const build = (pin, shape = {}) => looks.build({
    ...doc, packs: { 'pine-core': pin }, parts: { ...doc.parts, hair: 'bald', hat: 'none', neck: 'none' },
    shape: { ...doc.shape, ...shape }
  });
  const old = build(looks.mandibleRelease), current = build(looks.release);
  const before = sideProfile(old), after = sideProfile(current);
  const lastFit = build(looks.sagittalRelease), prior = sideProfile(lastFit);
  assert.deepEqual(current.sockets, lastFit.sockets, id + ' face and jaw landmarks after the occipital trim');
  assert.deepEqual([after.brow, after.cheek, after.chin, after.lip], [prior.brow, prior.cheek, prior.chin, prior.lip]);
  assert.ok(after.rear >= prior.rear && after.rear - prior.rear <= 0.5, id + ' modest rear trim');
  assert.ok(after.depth > 1.15 * before.depth && after.depth < 1.35 * before.depth, id + ' sagittal fit');
  assert.ok(after.rear < before.rear && after.brow > before.brow, id + ' forehead and occiput');
  assert.ok(after.cheek > before.cheek + 0.5 && after.chin > before.chin + 0.5, id + ' face and chin');
  const shallow = build(looks.release, { headDepth: 0.8 }), deep = build(looks.release, { headDepth: 1.2 });
  assert.ok(sideProfile(deep).depth > 1.4 * sideProfile(shallow).depth, id + ' head depth control');
  for (const actor of [current, shallow, deep]) {
    for (const name of ['headPivot', 'collar', 'leftEarCanal', 'rightEarCanal', 'leftJawJoint', 'rightJawJoint', 'leftJawAngle', 'rightJawAngle'])
      assert.ok(distance(actor.sockets[name].point, old.sockets[name].point) < 1e-8, id + ' ' + name);
    assert.deepEqual(actor.sockets.leftEye.point.slice(1), old.sockets.leftEye.point.slice(1));
    assert.equal(actor.sockets.chinTip.point[2], old.sockets.chinTip.point[2]);
  }
  const soft = sideProfile(build(looks.release, { faceRelief: 0 }));
  const raised = sideProfile(build(looks.release, { faceRelief: 1.8 }));
  assert.equal(soft.depth, raised.depth);
  assert.equal(soft.lip, raised.lip);
  assert.ok(raised.cheek > soft.cheek && raised.chin > soft.chin, id + ' relief independent of head depth');
}
for (const kind of ['adult', 'child']) {
  const head = skull[kind];
  const old = skull.posterior(1), current = skull.posterior(1, head);
  const rear = (fit, h) => {
    const row = head.row(h);
    return fit.fit(row.axis - row.rear, h);
  };
  const h = 0.35, shift = rear(current, h) - rear(old, h);
  assert.ok(shift > 0.032 && shift < 0.055, kind + ' maximum rear prominence');
  // The sagitta relative to the same chord measures the arc more directly than overall depth.
  const bulge = (fit) => (rear(fit, -0.1) + rear(fit, 0.8)) / 2 - rear(fit, h);
  assert.ok(bulge(current) < bulge(old) - 0.025);
  for (const end of [-0.58, -0.25, 0.83, 0.94, 1]) assert.equal(rear(current, end), rear(old, end));
  for (const depth of [0.8, 1, 1.2]) {
    const fit = skull.posterior(depth, head);
    for (const x of [-1.3, -0.9, -0.7, skull.earPlane, 0, 1])
      assert.ok(Math.abs(fit.unfit(fit.fit(x, h), h) - x) < 1e-8, kind + ' scalp and hair transform');
  }
}
for (const [key, min, max] of [['headDepth', 0.8, 1.2], ['faceRelief', 0, 1.8]]) {
  const seed = looks.templateById.get('look_body_male');
  const variant = (v) => ({ ...seed, shape: { ...seed.shape, [key]: v } });
  assert.deepEqual([shapeDefs[key].minimum, shapeDefs[key].maximum, shapeDefs[key].default], [min, max, 1]);
  for (const v of [min, max]) {
    assert.equal(looks.prepare(variant(v)).recipe.shape[key], v);
    assert.throws(() => looks.prepare({ ...variant(v), packs: { 'pine-core': looks.mandibleRelease } }));
  }
  assert.ok(!Object.hasOwn(looks.prepare(variant(1)).recipe.shape, key));
  assert.throws(() => looks.prepare(variant(max + 0.01)));
}
// Opening the jaw passes through the ear-side condyles, not the pitch joint in the cranium.
for (const id of ['look_body_male', 'look_relay', 'look_workshop_toddler', 'look_workshop_baby']) {
  const doc = looks.templateById.get(id), a = looks.build(doc), rest = motion.rig.pose(a.rig);
  const wide = motion.rig.pose(a.rig, { jawOpen: 1 });
  const socket = (p, name) => motion.rig.socket(a, p, name);
  const joint = socket(rest, 'leftJawJoint'), ear = socket(rest, 'leftEarCanal');
  assert.ok(joint[0] > ear[0] && joint[2] < ear[2] && joint[2] > socket(rest, 'leftJawAngle')[2], id);
  assert.ok(distance(joint, ear) < 0.06 * a.rig.height);
  assert.deepEqual(clone(socket(rest, 'rightJawJoint')), [joint[0], -joint[1], joint[2]]);
  for (const fixed of ['leftEye', 'rightEye', 'upperLip', 'collar', 'headPivot'])
    assert.deepEqual(socket(wide, fixed), socket(rest, fixed), id + ' ' + fixed);
  const openJoint = socket(wide, 'leftJawJoint');
  assert.ok(openJoint[0] > joint[0] && openJoint[2] < joint[2]);
  for (const name of ['chinTip', 'lowerLip']) {
    const p = socket(rest, name), q = socket(wide, name);
    assert.ok(q[2] < p[2] - 0.015 * a.rig.height);
    assert.ok(Math.abs(distance(p, joint) - distance(q, openJoint)) < 1e-7);
    assert.ok(distance(p, q) > 3 * distance(joint, openJoint));
  }
  const tilted = motion.rig.pose(a.rig, { headPitch: 0.26, headYaw: -0.48, jawOpen: 1 });
  const localChin = motion.rig.point(wide.jawLocal, a.sockets.chinTip.point);
  assert.ok(distance(socket(tilted, 'chinTip'), motion.rig.point(tilted.head, localChin)) < 1e-7);
  const fine = [rest, wide].map((pose) => motion.faceLayers(a, pose, a.body.makePose(pose))[1]);
  const [closed, opened] = fine;
  const grid = (b) => [b.x, b.y, b.z, b.body.density, b.body.nx, b.body.ny, b.body.nz];
  assert.deepEqual(grid(closed), grid(opened), id + ' stable facial grid');
  assert.notEqual(hash(closed.model.colors), hash(opened.model.colors));
  const eyeFloor = Math.floor((socket(rest, 'leftEye')[2] - closed.z) * closed.body.density) - 1;
  const plane = closed.body.nx * closed.body.ny;
  assert.equal(hash(closed.model.colors.subarray(eyeFloor * plane)), hash(opened.model.colors.subarray(eyeFloor * plane)));
  const open = motion.actions.get('open-mouth'), legacy = looks.build({ ...doc, packs: { 'pine-core': looks.neckRelease } });
  assert.equal(motion.accepts(open, 0, a), true);
  assert.equal(motion.accepts(open, 0, legacy), false);
  assert.equal(motion.rig.pose(legacy.rig, { jawOpen: 1 }).jaw, undefined);
  assert.ok(open.sample(0.48, a)[0].pose.jawOpen > 0.99);
}
for (const kind of ['child', 'adult']) {
  const old = skull.withJaw(kind),
    current = skull.reshape(kind, {});
  const length = (p) => p.row(-0.745).face[0] - p.row(-0.925).face[0];
  assert.ok(length(current) < length(old) - 0.07, kind + ' shorter submental span');
  assert.deepEqual(Array.from(current.row(0.1).face), Array.from(old.row(0.1).face));
}
for (const id of ['switch-lamp', 'desk-code', 'desk-notes', 'desk-read', 'desk-calligraphy']) {
  const clip = motion.actions.get(id),
    kind = clip.station,
    fixture = world.place(kind, 31, -12, kind === 'lamp' ? 21.1 : 0, 1.14);
  const plan = motion.compile({
    version: 1,
    loop: true,
    scene: [fixture, world.place('grass', 4, 3)],
    steps: [
      { action: id, actors: ['look_developer'], target: 0 },
      { action: 'idle', actors: ['look_developer'] }
    ]
  });
  const e = plan.sample(clip.seconds * 0.3)[0],
    prop = e.pose.props.find((p) => p.kind === kind);
  const origin = motion.rig.world(e, [prop.frame[3], prop.frame[7], prop.frame[11]]);
  assert.ok(distance(origin, [fixture.x, fixture.y, fixture.z]) < 1e-7);
  assert.deepEqual(
    Array.from(plan.scenery(0.5), (p) => p.kind),
    ['grass']
  );
  assert.equal(plan.scenery(clip.seconds + 0.1).length, 2);
  if (kind === 'lamp') {
    const hand = e.pose.arms[0].hand;
    assert.ok(distance(hand, activity.contact(prop, world.items.get('lamp').anchors.switch)) < 0.01);
    assert.equal(prop.on, true);
    assert.equal(plan.sample(clip.seconds * 0.82)[0].pose.props.at(-1).on, false);
  }
  assert.throws(() => motion.compile({ ...plan.score, scene: [world.place('grass')] }));
}
const base = looks.templateById.get('look_manager'),
  baby = find('baby');
for (const config of [
  { height: 0.75, arms: 0.8, legs: 1.25, shoulders: 0.7 },
  { height: 1.3, arms: 0.8, legs: 0.8, shoulders: 1.35 }
]) {
  const a = looks.build({ ...base, shape: { ...base.shape, ...config } });
  const [parent, child] = motion.actions.get('cradle').sample(0.5, a, baby);
  assert.ok(
    distance(parent.contacts.seatHand, child.contacts.seat) < 0.01 &&
      distance(parent.contacts.backHand, child.contacts.back) < 0.01
  );
}
assert.throws(() => world.normalize([{ kind: 'absent' }]));
assert.throws(() => world.normalize([{ kind: 'chair', z: -1 }]));
assert.throws(() => world.normalize([{ kind: 'chair', x: null }]));
world.register(
  {
    id: 'test-cushion',
    label: '坐垫',
    family: 'furniture',
    realms: ['modern'],
    box: [6, 6, 4],
    anchors: { seat: [0, 0, 2] }
  },
  ({ oval, k }) => oval([0, 0, 1], [2.5, 2.5, 1], k.teal)
);
assert.ok(world.geometry('test-cushion').model.colors.some(Boolean));
async function three() {
  const T = await import('../vendor/three-r187/three.module.js'),
    { createPineCast } = await import('../pine-three.mjs');
  // The adapter can receive a world registry from the host just like its motion registry.
  const cast = createPineCast(T, motion, { world }),
    plan = motion.compile(motion.presets.office);
  cast.setTime(plan, 0);
  const nodes = [];
  cast.group.traverse((n) => {
    if (n.visible && n.name.startsWith('world/')) nodes.push(n);
  });
  assert.ok(nodes.some((m) => m.name === 'world/lamp' && m.geometry.drawRange.count > 0));
  cast.setTime(plan, plan.starts[1]);
  const desk = cast.group.getObjectByName('world/desk');
  assert.ok(desk.visible);
  const shape = desk.geometry;
  cast.setScene([world.place('desk', 18, 6), world.place('test-cushion')]);
  assert.equal(cast.group.getObjectByName('world/desk').geometry, shape);
  const speaking = motion.compile({ version: 1, steps: [{ action: 'open-mouth', actors: ['look_body_male'] }] });
  cast.setDetail('face');
  cast.setTime(speaking, 0);
  const faceMesh = cast.group.getObjectByName('look_body_male/face');
  const geometryHash = () => {
    const g = faceMesh.geometry;
    return hash(g.attributes.position.array.subarray(0, 2 * g.drawRange.count));
  };
  const closed = geometryHash();
  cast.setTime(speaking, 0.48 * speaking.duration);
  assert.notEqual(geometryHash(), closed);
  cast.setTime(speaking, speaking.duration);
  assert.equal(geometryHash(), closed);
  cast.dispose();
}
three()
  .then(() =>
    console.log(
      'World catalog, original vehicles, editable cast, jaw landmarks, portable scenes, hand contacts and Three.js passed'
    )
  )
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
