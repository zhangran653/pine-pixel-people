// Check the same installed catalogs and dependency order used by the public world editor.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto, createHash } = require('node:crypto');
require('./check-scene-depth.cjs');
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
assert.equal(world.detailMode(), 'figure');
assert.ok(world.geometry('desk').body.density > world.geometry('desk', 'standard').body.density);
assert.ok(world.geometry('lamp').body.density > world.geometry('lamp', 'standard').body.density);
assert.equal(world.geometry('aircraft'), world.geometry('aircraft', 'standard'));
assert.throws(() => world.geometry('lamp', 'invalid'));
assert.throws(() => motion.compile({ version: 1, steps: [], detail: null }));
for (const detail of ['figure', 'standard']) {
  const book = motion.compile({ ...motion.presets.office, detail });
  assert.equal(store.readScoreFile(store.scoreFile(book.score)).score.detail, detail);
}
// Forward references, two nested floors and opposing rotations. The lamp is on the desk.
const pavilionBook = {
  version: 1,
  scene: [
    { kind: 'lamp', parent: 2, x: 2, y: 3, z: 21.1 },
    world.place('pavilion', 30, -10, 4, Math.PI / 2),
    { kind: 'stall', parent: 1, x: 5, y: 8, z: 1, heading: -Math.PI / 2 },
    { kind: 'desk', parent: 2, x: 2, y: 3 },
    world.place('bench', -60, -20)
  ],
  actorPlacement: { parent: 2, x: -6, y: 1, heading: 0.2 },
  steps: [{ action: 'switch-lamp', actors: ['look_developer'], target: 0 },
    { action: 'cradle', actors: ['mother', 'baby'] }]
};
{
  const plan = motion.compile(pavilionBook), xyz = p => [p.x, p.y, p.z];
  const floor = 4 + 2 * 2.55 + 1 + 2 * 2.35;
  const close = (a, b) => assert.ok(distance(a, b) < 1e-7, JSON.stringify([a, b]));
  close(xyz(plan.worldScene[0]), [24, -2, floor + 21.1]);
  close(xyz(plan.castFrame), [16, -4, floor]);
  assert.equal(plan.worldScene[2].heading, 0);
  assert.equal(plan.worldScene[0].parent, undefined);
  assert.deepEqual(clone(world.resolveScene(plan.score.scene)), clone(plan.worldScene));
  assert.deepEqual(clone(store.readScoreFile(store.scoreFile(plan.score)).score), clone(plan.score));
  const active = plan.sample(0.8)[0], fixture = active.pose.props.find(p => p.kind === 'lamp');
  close(motion.rig.world(active, [fixture.frame[3], fixture.frame[7], fixture.frame[11]]), xyz(plan.worldScene[0]));
  assert.deepEqual(Array.from(plan.scenery(0), p => p.kind), ['pavilion', 'stall', 'desk', 'bench']);
  assert.equal(plan.scenery(plan.starts[1]), plan.worldScene);
  const held = plan.score.steps[1].seconds * 0.53, time = plan.starts[1] + held, [adult, infant] = plan.sample(time);
  const raw = motion.compile({ version: 1, steps: [pavilionBook.steps[1]] }).sample(held);
  assert.ok(distance(adult.contacts.seatHand, infant.contacts.seat) < 0.01);
  close(adult.contacts.seatHand, motion.rig.world(plan.castFrame, raw[0].contacts.seatHand));
  close(xyz(infant), motion.rig.world(plan.castFrame, xyz(raw[1])));
  const duet = motion.actions.get('cradle');
  motion.registerAction({ ...duet, id: 'test-room-duet', station: 'desk', sample(u, ...actors) {
    const [a, b] = duet.sample(u, ...actors);
    return [{ ...a, pose: { ...a.pose, props: [activity.prop('desk', [3, -2, 0], 1)] } }, b];
  } });
  const bound = motion.compile({ ...pavilionBook, steps: [{ action: 'test-room-duet', actors: ['mother', 'baby'], target: 3 }] });
  const [byDesk, heldBaby] = bound.sample(held);
  close(motion.rig.world(byDesk, [3, -2, 0]), xyz(plan.worldScene[3]));
  close(heldBaby.contacts.seat, motion.rig.world(heldBaby, motion.rig.socket(find('baby'), heldBaby.pose, 'seat')));
  assert.ok(distance(byDesk.contacts.seatHand, heldBaby.contacts.seat) < 0.01);
  // Removing either shell promotes only its immediate children, including a placed cast.
  for (const removed of [1, 2]) {
    const next = motion.compile(world.removePlacement(plan.score, removed));
    next.worldScene.forEach((p, i) => {
      const old = plan.worldScene[i >= removed ? i + 1 : i];
      close(xyz(p), xyz(old));
      close([p.heading], [old.heading]);
    });
    close(xyz(next.castFrame), xyz(plan.castFrame));
    close(next.sample(time)[0].contacts.backHand, adult.contacts.backHand);
    assert.equal(next.score.steps[0].target, 0);
  }
  const detached = motion.compile(world.reparent(plan.score, null, undefined));
  close(xyz(detached.castFrame), xyz(plan.castFrame));
  assert.equal(detached.score.actorPlacement.parent, undefined);
  const returned = motion.compile(world.reparent(detached.score, null, 2));
  close(xyz(returned.castFrame), xyz(plan.castFrame));
  const shifted = motion.compile(world.removePlacement({ ...plan.score, steps: [
    { action: 'desk-code', actors: ['look_developer'], target: 3 }, ...plan.score.steps] }, 0));
  assert.equal(shifted.score.steps[0].target, 2);
  assert.equal(shifted.score.steps[1].target, undefined);
  assert.throws(() => world.reparent(plan.score, 1, 2));
  assert.throws(() => world.reparent(plan.score, null, 3));
  for (const scene of [[{ kind: 'pavilion', parent: 0 }],
    [{ kind: 'stall', parent: 1 }, { kind: 'pavilion', parent: 0 }],
    [{ kind: 'desk' }, { kind: 'lamp', parent: 0 }],
    [{ kind: 'book', parent: 999 }], [{ kind: 'chair', parent: null }]])
    assert.throws(() => world.normalize(scene));
  for (const actorPlacement of [null, { parent: 3 }, { kind: 'chair' }, { z: -1 }])
    assert.throws(() => motion.compile({ ...pavilionBook, actorPlacement }));
  const legacy = motion.compile({ version: 1, steps: [], scene: [world.place('chair', 2, 3)] });
  assert.deepEqual(clone(legacy.worldScene), clone(legacy.score.scene));
  assert.ok(!('actorPlacement' in legacy.score) && !('parent' in legacy.score.scene[0]));
  const gather = { version: 1, scene: [world.place('pavilion', 7, 11, 0, 0.9),
    world.place('desk', 6, 10), world.place('book', 9, 13, 21.1), world.place('pine', -80, 70)],
    steps: [{ action: 'idle', actors: ['child'] }] };
  const collected = motion.compile(world.collectContents(gather, 0));
  assert.deepEqual(Array.from(collected.score.scene, p => p.parent), [undefined, 0, 0, undefined]);
  assert.equal(collected.score.actorPlacement.parent, 0);
  close(xyz(collected.worldScene[1]), [6, 10, 5.1]);
  close(xyz(collected.worldScene[2]), [9, 13, 21.1 + 5.1]);
  assert.equal(world.collectContents(collected.score, 0), collected.score);
  for (const kind of ['pavilion', 'stall', 'cottage', 'dome']) {
    for (const detail of ['standard', 'figure']) {
      const full = world.geometry(kind, detail), bounds = [...full.model.bounds];
      const far = world.cutaway(kind, detail, 0), opposite = world.cutaway(kind, detail, Math.PI);
      assert.equal(far[0].model.colors, full.model.colors);
      assert.ok(far[1].model.bounds[5] < bounds[5]);
      assert.equal(far[1].model.bounds[3], opposite[1].model.bounds[0]);
      assert.deepEqual([...world.geometry(kind, detail).model.bounds], bounds);
    }
  }
}
// Check against the actual first empty voxel above the slab, independently of building metadata.
const flatStall = { version: 1, scene: [world.place('stall')], steps: [{ action: 'idle', actors: ['look_scholar'] }] };
const stallOffice = { ...flatStall, scene: [
  world.place('desk', -8, 0), world.place('lamp', -8, 3, 21.1), world.place('book', -7, -4, 21.1),
  world.place('book', 34, 0, 21.1), world.place('stall')],
  steps: [{ action: 'desk-code', actors: ['look_programmer'], target: 0 },
    { action: 'switch-lamp', actors: ['look_programmer'], target: 1 }] };
{
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, a + ' vs ' + b);
  for (const detail of ['standard', 'figure']) {
    for (const kind of ['stall', 'pavilion', 'cottage', 'dome']) {
      const { body, model } = world.geometry(kind, detail), { nx, ny, density } = body;
      const column = z => model.colors[(z * ny + (ny >> 1)) * nx + (nx >> 1)];
      let layer = 0;
      while (layer < body.nz && column(layer)) layer++;
      const surface = layer / density;
      assert.ok(surface > 0 && layer < body.nz);
      const score = { ...flatStall, detail, scene: [world.place(kind)] };
      const natural = motion.compile(score), member = motion.compile({ ...score, actorPlacement: { parent: 0 } });
      near(natural.sample(0)[0].z, surface);
      near(member.sample(0)[0].z, surface);
      near(motion.compile({ ...score, actorPlacement: { parent: 0, z: 3 } }).sample(0)[0].z, surface + 3);
      assert.deepEqual(clone(store.readScoreFile(store.scoreFile(natural.score)).score), clone(natural.score));
      assert.ok(!Object.hasOwn(natural.score, 'actorPlacement'));
      if (kind === 'stall') {
        let roof = layer;
        while (roof < body.nz && !column(roof)) roof++;
        const actor = find('look_scholar'), pose = natural.sample(0)[0].pose;
        assert.ok(roof / density > surface + actor.body.makePose(pose).bounds[5] / actor.body.density);
      }
    }
  }
  const height = score => motion.compile({ ...flatStall, ...score }).sample(0)[0].z;
  near(height({ actorPlacement: { z: 2 } }), 4.7);
  near(height({ actorPlacement: { z: 12 } }), 12);
  near(height({ actorPlacement: { x: 64 } }), 0);
  near(height({ scene: [world.place('stall', 0, 0, 30)] }), 0);
  near(height({ scene: [world.place('stall', 0, 0, 30)], actorPlacement: { parent: 0 } }), 34.7);
  const nested = [world.place('pavilion'), { kind: 'stall', parent: 0 }];
  near(height({ scene: nested }), 5.1 + 4.7);
  near(height({ scene: [{ kind: 'stall', parent: 1 }, nested[0]] }), 5.1 + 4.7);
  near(height({ scene: [world.place('pavilion'), world.place('stall')] }), 5.1);
  const rot = world.layout([world.place('stall', 20, 30, 0, Math.PI / 2)]);
  near(rot.floorAt(20, 65), 4.7);
  near(rot.floorAt(55, 30), 0);
  for (const action of ['run', 'jump', 'cradle']) {
    const steps = [{ action, actors: action === 'cradle' ? ['mother', 'baby'] : ['look_scholar'] }];
    const flat = motion.compile({ version: 1, steps }), raised = motion.compile({ ...flatStall, steps });
    for (const phase of [0, 0.16, 0.5, 0.73, 1]) {
      const at = phase * flat.duration, old = flat.sample(at), onFloor = raised.sample(at);
      old.forEach((e, i) => {
        near(onFloor[i].z, e.z + 4.7);
        if (e.contacts) for (const [key, pt] of Object.entries(e.contacts)) near(onFloor[i].contacts[key][2], pt[2] + 4.7);
      });
    }
  }
  const run = motion.compile({ ...flatStall, scene: [world.place('stall', 0, -20)],
    steps: [{ action: 'run', actors: ['look_scholar'] }] });
  near(run.sample(0)[0].z, 4.7);
  near(run.sample(run.duration / 2)[0].z, 0);
  near(run.sample(run.duration)[0].z, 4.7);
  const resident = motion.compile({ ...run.score, actorPlacement: { parent: 0, y: 20 } });
  near(resident.sample(0)[0].z, 4.7);
  near(resident.sample(resident.duration / 2)[0].z, 0);
  const edge = motion.compile({ ...flatStall, actorPlacement: { y: 32.9 } }).sample(0)[0];
  const ordinary = motion.compile({ ...flatStall, scene: [] }).sample(0)[0];
  const ankle = find('look_scholar').rig.ankle;
  for (const [i, foot] of edge.pose.feet.entries()) {
    const p = motion.rig.world(edge, foot);
    near(p[2] - ankle, p[1] <= 32.9 ? 4.7 : 0);
    if (p[1] <= 32.9) assert.notDeepEqual(clone(edge.pose.legs[i].knee), clone(ordinary.pose.legs[i].knee));
  }
  assert.deepEqual(clone(edge.pose.arms), clone(ordinary.pose.arms));
  const office = motion.compile(stallOffice);
  near(office.worldScene[0].z, 4.7);
  near(office.worldScene[1].z, 25.8);
  near(office.worldScene[2].z, 25.8);
  near(office.worldScene[3].z, 21.1);
  for (const [i, cue] of office.score.steps.entries()) {
    const t = office.starts[i] + cue.seconds * 0.3, e = office.sample(t)[0];
    const destination = office.worldScene[cue.target], fixture = e.pose.props.find(p => p.kind === destination.kind);
    near(e.z, 4.7);
    near(motion.rig.world(e, [fixture.frame[3], fixture.frame[7], fixture.frame[11]])[2], destination.z);
    assert.equal(world.resolveScene(office.scenery(t)), office.scenery(t));
  }
  for (const id of ['shop', 'manuscript']) {
    const plan = motion.compile(motion.presets[id]);
    assert.equal(plan.score.actorPlacement.parent, 0);
    near(plan.sample(0)[0].z, 4.7);
  }
}
// Check shoe contact against the rendered cells, not the height function used by the gait.
{
  const flight = world.stairs, close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, a + ' vs ' + b);
  const sampleZ = (geometry, x, y) => {
    const { body: { nx, ny, nz, density }, model } = geometry;
    const ix = Math.floor(nx / 2 + x * density), iy = Math.floor(ny / 2 + y * density);
    if (ix < 0 || iy < 0 || ix >= nx || iy >= ny) return 0;
    for (let z = nz - 1; z >= 0; z--) if (model.colors[(z * ny + iy) * nx + ix]) return (z + 1) / density;
    return 0;
  };
  const scene = [world.place('stairs')], geometry = world.geometry('stairs');
  const terrain = world.layout(scene);
  for (let n = 0; n <= flight.count + 3; n++) {
    const [x, height] = flight.foothold(n);
    for (const detail of ['figure', 'standard']) close(sampleZ(world.geometry('stairs', detail), x, 0), height);
    close(terrain.floorAt(x, 0, height), height);
    if (n > flight.count) close(terrain.floorAt(x, 0, 0), 0); // open space below the upper landing
  }
  for (const id of ['look_guide', 'child']) {
    const actor = find(id), scores = { version: 1, loop: true, steps: [{ action: 'climb-stairs', actors: [id] }] };
    const plan = motion.compile(scores), levels = new Set();
    assert.equal(plan.scenery(1)[0].kind, 'stairs');
    assert.equal(plan.score.scene, undefined, 'temporary preview geometry is separate from the authored scene');
    for (let frame = 0; frame <= 400; frame++) {
      const e = plan.sample(frame / 400 * plan.duration)[0];
      const gaps = e.pose.feet.map(foot => {
        const [x, y, ankle] = motion.rig.world(e, foot), floor = sampleZ(geometry, x, y), gap = ankle - actor.rig.ankle - floor;
        if (Math.abs(gap) < 1e-6) levels.add(Math.round(floor * 100) / 100);
        return gap;
      });
      close(Math.min(...gaps), 0);
    }
    assert.equal(levels.size, flight.count + 1);
    const start = plan.sample(0)[0], upper = plan.sample(plan.duration / 2)[0], end = plan.sample(plan.duration)[0];
    close(upper.z, 70); close(start.z, 0); close(end.z, 0); close(start.x, end.x); close(start.heading, end.heading);
    assert.ok(upper.x - start.x > 100);
    for (const foot of upper.pose.feet) close(motion.rig.world(upper, foot)[2] - actor.rig.ankle, 70);
    const instance = world.place('stairs', 21, -34, 8, Math.PI / 2);
    const bound = motion.compile({ ...scores, scene: [...scene, instance], steps: [{ ...scores.steps[0], target: 1 }] });
    const e = bound.sample(bound.duration / 2)[0], p = motion.rig.world(instance, [upper.x, upper.y, upper.z]);
    close(e.x, p[0]); close(e.y, p[1]); close(e.z, p[2]);
    assert.equal(bound.scenery(1), bound.worldScene);
    assert.deepEqual(clone(store.readScoreFile(store.scoreFile(bound.score)).score), clone(bound.score));
    assert.throws(() => motion.compile({ ...scores, scene: [world.place('desk')], steps: [{ ...scores.steps[0], target: 0 }] }));
  }
}
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
// The same editable face should visibly age when only its underlying head changes.
{
  const recipe = clone(looks.templateById.get('look_workshop_baby'));
  recipe.face = clone(looks.facePresets.gentle.face);
  const archived = { ...recipe, packs: { 'pine-core': looks.morphRelease } };
  const old = looks.build(archived), infant = looks.build(recipe);
  function digests(actor) {
    const rest = motion.rig.pose(actor.rig), coarse = actor.body.makePose(rest);
    return [hash(coarse.colors), hash(motion.faceLayers(actor, rest, coarse)[1].model.colors)];
  }
  assert.deepEqual(digests(old), [
    '89e9dadea7e44eb0526b32a270bea13c895a09c1265eb1150c15839864ba2513',
    '306cddaaeba496a4d4c709ac5ccff86406be2644c9e5a1dd8e033145a8d0ff09'
  ], 'the 1.12 baby must replay its original figure and portrait');
  const z = (actor, name) => actor.sockets[name].point[2];
  assert.equal(infant.rig.height, old.rig.height);
  assert.ok(z(infant, 'leftEye') < z(old, 'leftEye') - 0.8);
  assert.ok(z(infant, 'mouth') < z(old, 'mouth') - 0.6);
  assert.ok(z(infant, 'leftEarCanal') < z(old, 'leftEarCanal') - 0.6);
  const lowerFace = a => z(a, 'leftEye') - z(a, 'chinTip');
  assert.ok(lowerFace(infant) < 0.82 * lowerFace(old));
  const rest = motion.rig.pose(infant.rig);
  const band = motion.faceLayers(infant, rest, infant.body.makePose(rest))[1];
  const [mx, my, mz] = motion.rig.socket(infant, rest, 'mouth');
  const { nx, ny, density } = band.body;
  const mouthRow = (Math.floor((mz - band.z) * density) * ny + Math.floor((my - band.y) * density + ny / 2)) * nx;
  const tip = band.model.colors.subarray(mouthRow, mouthRow + nx).findLastIndex(Boolean);
  assert.ok(Math.abs(band.x + (tip + 0.5 - nx / 2) / density - mx) < 1.6 / density, 'mouth contact lies on the rendered lips');
  // Exercise the reusable prop contact without changing the clip's age eligibility.
  const sip = motion.actions.get('drink').sample(0.50, infant)[0].pose;
  assert.ok(distance(sip.bottle.lip, motion.rig.socket(infant, sip, 'mouth')) < 1e-7);
  const head = skull.reshape('baby', {}, 1, true);
  for (const h of [-0.75, -0.45, 0.3, 0.8]) assert.notEqual(head.row(h).width, skull.child.row(h).width);
  for (const base of ['adult', 'child', 'toddler']) {
    const doc = { ...recipe, base, packs: { 'pine-core': looks.infantNapeRelease } };
    assert.deepEqual(digests(looks.build(doc)), digests(looks.build({ ...doc, packs: archived.packs })), base);
  }
  const naturalBaby = looks.build({ ...recipe, face: { ...recipe.face, style: 'natural' } });
  const storedBaby = looks.build({ ...recipe, packs: { 'pine-core': looks.silhouetteRelease }, face: { ...recipe.face, style: 'natural' } });
  assert.deepEqual(digests(storedBaby), digests(looks.build({ ...recipe, packs: { 'pine-core': looks.infantNapeRelease } })),
    'archived natural ink preserves the separate infant portrait at both sampling densities');
  assert.notDeepEqual(digests(naturalBaby), digests(storedBaby), 'the new infant eye seat and chin change its silhouette');
  assert.notDeepEqual(digests(infant), digests(naturalBaby));
  const adult = { ...archived, base: 'adult', face: { ...recipe.face, facialHair: 'beard', complexion: 'fine-lines' } };
  const converted = looks.withBodyProfile(adult, 'baby');
  assert.equal(converted.packs['pine-core'], looks.release);
  assert.deepEqual(clone(converted.face), clone(recipe.face));
  assert.deepEqual(clone(converted.colors), clone(adult.colors));
  const reroll = looks.randomFace({ ...archived, face: { ...adult.face } }, () => 0.5);
  assert.ok(!reroll.face.facialHair && !reroll.face.complexion);
  assert.equal(looks.prepare(archived).recipe.packs['pine-core'], looks.morphRelease);
  assert.equal(looks.withBodyProfile(archived, 'baby').packs['pine-core'], looks.morphRelease);
}
{
  const seed = looks.templateById.get('look_body_male');
  const pixels = (doc) => {
    const actor = looks.build(doc), pose = motion.rig.pose(actor.rig);
    return hash(motion.faceLayers(actor, pose, actor.body.makePose(pose))[1].model.colors);
  };
  for (const key of Object.keys(looks.morphs)) {
    const withValue = (v) => ({ ...seed, shape: { ...seed.shape, [key]: v } });
    assert.deepEqual([shapeDefs[key].minimum, shapeDefs[key].maximum, shapeDefs[key].default], [-1, 1, 0]);
    assert.notEqual(pixels(withValue(-1)), pixels(withValue(1)), key + ' needs visible range');
    assert.throws(() => looks.prepare(withValue(1.01)));
    assert.throws(() => looks.prepare({ ...withValue(-1), packs: { 'pine-core': looks.occipitalRelease } }));
    assert.ok(!Object.hasOwn(looks.prepare(withValue(0)).recipe.shape, key));
  }
  const cheek = (height, h) => {
    const profile = skull.reshape('adult', { cheekHeight: height, cheekProjection: 0.8 }, 1, true);
    return profile.frontAt(profile.row(h), 0.6);
  };
  assert.ok(cheek(-1, -0.39) > cheek(1, -0.39) && cheek(1, 0) > cheek(-1, 0));
  for (const cheeks of Object.values(looks.cheekPresets)) for (const features of Object.values(looks.facePresets)) {
    const doc = clone(seed);
    Object.assign(doc.shape, cheeks.shape);
    looks.applyFacePreset(doc, features);
    for (const [key, value] of Object.entries(cheeks.shape)) assert.equal(doc.shape[key], value);
    assert.deepEqual(doc.colors, clone(seed.colors));
    assert.deepEqual(clone(looks.prepare(doc).recipe.face), clone(doc.face));
  }
  const skinMask = (skin) => {
    const actor = looks.build({ ...seed, colors: { ...seed.colors, skin }, shape: { ...seed.shape, cheekHeight: -0.6, noseWidth: 0.7 } });
    const pose = motion.rig.pose(actor.rig), upper = motion.faceLayers(actor, pose, actor.body.makePose(pose))[1];
    return hash(Uint8Array.from(upper.model.colors, (color) => Number(Boolean(color))));
  };
  assert.equal(skinMask('#47332f'), skinMask('#f6d8ca'), 'pigment must not select facial geometry');
  const styles = vm.runInContext('pinePortraitStyles', context);
  const ink = new Proxy({}, { get: () => 1 });
  const pairings = new Set(), expressHair = new Set(), naturalHair = new Set();
  function checkSpacing(doc) {
    const s = doc.shape, eyes = styles.eyes[doc.face.eyes], brows = styles.brows[doc.face.brows];
    const portrait = looks.portraitStyleOf(doc), baby = doc.base === 'baby';
    const drawn = portrait !== 'natural' && styles.illustratedEyeShape(doc.face.eyes, portrait, baby);
    const brow = drawn ? styles.illustratedBrow(doc.face.brows, portrait, baby) : brows;
    const fit = styles.proportionsFor(doc.base, portrait, doc.packs[looks.core]);
    if (drawn || eyes) assert.ok(fit.eyeCenter * s.eyeSpacing - (drawn ? drawn.width : eyes[1]) * fit.eyeWidth * (1 + 0.23 * (s.eyeWidth || 0)) >= 0.145 - 1e-8);
    if ((drawn || eyes) && brow) {
      // Sample the real pigment brushes at the pupil axis with the eye open.
      let upperLid = 0, lowerBrow = Infinity;
      for (let i = 0; i <= 230; i++) {
        const h = i / 500;
        const z = h / (fit.eyeOpen * (1 + 0.42 * (s.eyeOpening || 0)));
        if (drawn ? styles.illustratedEye(drawn, 0, z, 0, 1, ink, 0.018, portrait) : styles.eye(eyes, 0, z, 0, 1, ink)) upperLid = h;
        if (styles.brow(brow, 0, (h - 0.092 * (s.browHeight || 0)) / fit.browHeight, ink)) lowerBrow = Math.min(lowerBrow, h);
      }
      const gap = lowerBrow - upperLid;
      assert.ok(gap >= 0.034 && gap < 0.146, doc.face.eyes + '/' + doc.face.brows + ' brow gap ' + gap);
    }
    if (doc.face.outline === 'diamond') assert.ok((s.cheekWidth || 0) <= 0.3);
    if (s.cheekHeight > 0.32 && s.cheekProjection > 0.32) assert.ok((s.cheekFullness || 0) >= -0.12);
  }
  const clothing = (doc) => {
    const { hair, ...parts } = doc.parts;
    const dyes = Object.fromEntries(Object.entries(doc.colors).filter(([k]) =>
      !['eyes', 'hair', 'skin'].includes(k) && !(k in styles.dyes)));
    return [parts, dyes].map((v) => Object.entries(v).sort(([a], [b]) => a.localeCompare(b)));
  };
  const wardrobes = new Set(looks.templates.map((doc) => JSON.stringify([doc.base, clothing(doc)])));
  function seeded(state) {
    return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
  const random = seeded(83);
  const base = JSON.stringify(seed), colors = new Set(), ages = new Set(), ids = new Set(), outlines = new Set();
  const lowCheeks = [];
  const babySeed = looks.templateById.get('look_workshop_baby');
  const archive = { ...seed, packs: { 'pine-core': looks.lipJawRelease } };
  assert.equal(looks.portraitStyleOf(archive), 'natural');
  assert.equal(looks.portraitStyleOf(seed), 'animation');
  assert.equal(looks.portraitStyleOf({ ...seed, packs: { 'pine-core': looks.silhouetteRelease } }), 'game');
  assert.throws(() => looks.prepare({ ...seed, packs: { 'pine-core': looks.silhouetteRelease }, face: { ...seed.face, style: 'animation' } }));
  assert.throws(() => looks.prepare({ ...archive, face: { ...seed.face, style: 'manga' } }));
  assert.throws(() => looks.randomFace(seed, { portrait: 'unknown' }));
  assert.throws(() => looks.randomFace(seed, { family: 'unknown' }));
  // In all three drawing styles, check actual pigment clearance across every age
  // and variation setting. A family is never selected from the character's skin dye.
  for (const portrait of Object.keys(looks.portraitStyles)) {
    for (const id of ['look_ridge', 'look_fern', 'look_workshop_toddler', 'look_workshop_baby']) {
      const source = looks.templateById.get(id), roll = seeded(441);
      for (const style of ['natural', 'expressive']) {
        for (const family of Object.keys(looks.portraitFamilies)) {
          const face = looks.randomFace(source, { portrait, style, family, random: roll });
          checkSpacing(face);
          assert.equal(looks.prepare(face).recipe.face.style, portrait);
        }
      }
    }
  }
  const drawings = new Set();
  const archivedCharacter = looks.build(archive);
  const archivedNatural = looks.build({ ...archive, packs: { 'pine-core': looks.illustratedRelease },
    face: { ...(archive.face || looks.facePresets.classic.face), style: 'natural' } });
  for (const portrait of Object.keys(looks.portraitStyles)) {
    const doc = looks.setPortraitStyle(clone(seed), portrait);
    const character = looks.build(doc), pose = motion.rig.pose(character.rig), model = character.body.makePose(pose);
    const normal = motion.faceLayers(character, pose, model)[1];
    const close = motion.closePortraitLayers(character, pose, model)[1];
    assert.ok(normal.model.colors.length <= 480000 && close.model.colors.length <= 1152000);
    if (portrait === 'natural') {
      const previous = hash(archivedNatural.body.makePose(pose).colors);
      assert.equal(previous, hash(archivedCharacter.body.makePose(pose).colors), '1.16.0 replays natural ink from 1.15.0');
      assert.notEqual(hash(model.colors), previous, 'move the oral profile on a newly drawn natural face');
    } else assert.ok(close.body.density > normal.body.density, portrait + ' acquires more detail in the still editor');
    assert.deepEqual(character.rig.headPivot, archivedCharacter.rig.headPivot);
    assert.deepEqual(character.rig.jawPivot, archivedCharacter.rig.jawPivot);
    for (const key of ['leftEarCanal', 'leftJawJoint', 'rightJawJoint']) {
      const now = character.sockets[key], old = archivedCharacter.sockets[key];
      const span = styles.proportionsFor(doc.base, portrait, looks.release).headWidth ?? 1;
      assert.equal(now.frame, old.frame);
      assert.ok(distance(now.point, [old.point[0], old.point[1] * span, old.point[2]]) < 1e-8, portrait + ' ' + key);
    }
    const chin = character.sockets.chinTip, previousChin = archivedCharacter.sockets.chinTip;
    if (portrait === 'animation') {
      assert.equal(chin.frame, 'jaw');
      assert.deepEqual(chin.point.slice(1), previousChin.point.slice(1));
      assert.ok(chin.point[0] > previousChin.point[0], 'the little chin pad projects beneath the lip');
    } else assert.deepEqual(chin, previousChin, portrait + ' chinTip');
    drawings.add(hash(close.model.colors));
    const restored = looks.prepare(JSON.parse(JSON.stringify(doc))).recipe;
    assert.equal(looks.portraitStyleOf(restored), portrait);
    assert.deepEqual(restored.colors, looks.prepare(seed).recipe.colors);
  }
  assert.equal(drawings.size, 4, 'all art directions visibly redraw the same authored features');
  for (const style of ['natural', 'expressive']) {
    const babyRandom = seeded(17603), combinations = new Set();
    for (let i = 0; i < 64; i++) {
      const baby = looks.randomCharacter({ source: babySeed, locks: ['body'], style, random: babyRandom });
      assert.equal(baby.base, 'baby');
      assert.ok(['bald', 'crop', 'curly', 'crew'].includes(baby.parts.hair));
      assert.ok(['', 'oval', 'round', 'pear'].includes(baby.face.outline || ''));
      assert.ok(!['aquiline', 'long'].includes(baby.face.nose) && baby.face.eyes !== 'deep-set');
      checkSpacing(baby);
      combinations.add(baby.face.eyes + '/' + baby.face.nose);
    }
    assert.ok(combinations.size >= 28, 'independent infant eyes and noses in ' + style);
  }
  for (let i = 0; i < 160; i++) {
    const doc = looks.prepare(looks.randomCharacter(random)).recipe;
    checkSpacing(doc);
    if (doc.shape.cheekHeight < -0.48) lowCheeks.push(doc.shape.cheekFullness || 0);
    naturalHair.add(doc.colors.hair);
    assert.ok(wardrobes.has(JSON.stringify([doc.base, clothing(doc)])), 'whole authored outfit with its own dyes');
    const expressive = looks.prepare(looks.randomCharacter({ style: 'expressive', random })).recipe;
    checkSpacing(expressive);
    for (const key of Object.keys(looks.profileControls)) {
      assert.ok(Math.abs(doc.shape[key] || 0) <= 0.36 && Math.abs(expressive.shape[key] || 0) <= 0.70);
    }
    expressHair.add(expressive.colors.hair);
    pairings.add(doc.face.eyes + '/' + doc.face.nose);
    colors.add(doc.colors.skin); ages.add(looks.bodyProfileOf(doc)); ids.add(doc.id); outlines.add(doc.face.outline);
    const face = looks.randomFace(doc, random);
    assert.deepEqual(Object.keys(looks.cheekAdjustment(doc, 'natural')), []);
    assert.deepEqual(Object.keys(looks.cheekAdjustment(face, 'natural')), []);
    assert.deepEqual(Object.keys(looks.cheekAdjustment(expressive, 'expressive')), []);
    assert.deepEqual(clone(face.parts), clone(doc.parts));
    assert.deepEqual(clone(face.colors), clone(doc.colors));
    assert.equal(face.id, doc.id);
    if (i < 4) {
      const actor = looks.build(doc), sip = motion.actions.get('drink');
      if (motion.accepts(sip, 0, actor)) {
        const pose = sip.sample(0.5, actor)[0].pose;
        assert.ok(distance(pose.bottle.lip, motion.rig.socket(actor, pose, 'mouth')) < 1e-7);
      }
      const portable = store.scoreFile({ version: 1, loop: true, steps: [{ action: 'idle', actors: [doc.id] }] }, [doc]);
      assert.deepEqual(clone(portable.characters[0]), clone(doc));
      assert.equal(store.readScoreFile(clone(portable)).score.steps[0].actors[0], doc.id);
    }
    if (i < 32) {
      const actor = looks.build(expressive);
      const radius = { adult: 5.82, child: 4.89, toddler: 4.47, baby: 3.89 }[expressive.base] * expressive.shape.height;
      const vertical = (actor.sockets.leftEye.point[2] - actor.sockets.mouth.point[2]) / radius;
      const nose = styles.noses[expressive.face.nose] || styles.basicNoses[expressive.face.nose];
      const lip = styles.mouths[expressive.face.mouth]?.[2] ?? (expressive.face.mouth === 'full' ? 0.092 : 0.061);
      const fit = styles.proportionsFor(expressive.base, looks.portraitStyleOf(expressive), expressive.packs[looks.core]);
      const underside = styles.noseUnderside(nose, expressive.base !== 'baby');
      assert.ok(vertical - (nose[3] + underside) * fit.noseLength - lip * fit.lipHeight * (1 + 0.54 * (expressive.shape.upperLipFullness || 0)) >= 0.0399,
        'nose and upper lip need space on the ' + expressive.base + ' rig');
    }
  }
  assert.ok(lowCheeks.some((v) => v < -0.04) && lowCheeks.some((v) => v > 0.04) &&
    Math.max(...lowCheeks) < 0.28, 'low cheekbones should admit both lean and softly rounded cheeks');
  assert.ok(pairings.size >= 65, 'eye and nose pairs should combine independently');
  assert.ok(naturalHair.size >= 12 && expressHair.size > naturalHair.size && expressHair.has(looks.hairColors.莓紫));
  assert.ok(!naturalHair.has(looks.hairColors.莓紫));
  const lockedSkin = (skin) => looks.randomCharacter({
    source: { ...seed, colors: { ...seed.colors, skin } }, locks: ['skin'], random: seeded(315)
  });
  const dark = lockedSkin('#47332f'), light = lockedSkin('#f6d8ca');
  assert.notEqual(dark.colors.skin, light.colors.skin);
  for (const key of ['face', 'shape', 'parts']) assert.deepEqual(clone(dark[key]), clone(light[key]));
  const custom = clone(seed), pack = JSON.parse(read('packs/creek-hats.json'));
  custom.parts.hat = pack.id + '/' + pack.parts[0].id;
  custom.parts.bag = 'messenger';
  custom.packs[pack.id] = pack.release;
  custom.embeddedPacks = [pack];
  custom.colors.skin = '#976d54'; custom.colors.hair = '#52618a'; custom.colors.hat = '#705642';
  custom.shape.height = 1.23; custom.shape.legs = 0.83;
  const original = JSON.stringify(custom);
  for (const group of [['body'], ['skin'], ['hair'], ['wear'], ['body', 'skin', 'hair', 'wear']]) {
    const otherProfiles = new Set();
    let reroll = custom;
    for (let i = 0; i < 14; i++) {
      reroll = looks.prepare(looks.randomCharacter({ source: reroll, locks: group, random })).recipe;
      otherProfiles.add(looks.bodyProfileOf(reroll));
      if (group.includes('body')) {
        assert.equal(reroll.base, custom.base); assert.equal(reroll.gender, custom.gender);
        for (const key of ['height', 'shoulders', 'arms', 'legs']) assert.equal(reroll.shape[key], custom.shape[key]);
      }
      if (group.includes('skin')) assert.equal(reroll.colors.skin, custom.colors.skin);
      if (group.includes('hair')) {
        assert.equal(reroll.parts.hair, custom.parts.hair); assert.equal(reroll.colors.hair, custom.colors.hair);
      }
      if (group.includes('wear')) {
        assert.deepEqual(clone(clothing(reroll)), clone(clothing(custom)));
        assert.deepEqual(clone(reroll.embeddedPacks), clone(custom.embeddedPacks));
      }
    }
    if (!group.includes('body')) assert.ok(otherProfiles.size > 1, 'body available independently of other locks');
  }
  assert.equal(JSON.stringify(custom), original);
  assert.equal(ids.size, 160);
  assert.equal(ages.size, Object.keys(looks.bodyProfiles).length);
  assert.equal(colors.size, Object.keys(looks.colorPresets.skin).length);
  assert.ok(outlines.size >= 7);
  assert.equal(JSON.stringify(seed), base);
}
// Project the far cheek from the actual fine-pixel slices at mouth height, excluding the nose and lips.
function cheekEdges(actor, views) {
  const pose = motion.rig.pose(actor.rig);
  const mouth = motion.rig.socket(actor, pose, 'mouth'), ear = motion.rig.socket(actor, pose, 'leftEarCanal');
  const band = actor.body.faceLayers(pose, actor.body.makePose(pose), actor.sockets.chinTip.point[2] - 1, 4)[1];
  const { nx, ny, density } = band.body;
  const z = Math.floor((mouth[2] - band.z) * density);
  const angles = views.map((degrees) => degrees * Math.PI / 180);
  const edges = angles.map(() => -Infinity);
  for (let j = 0; j < ny; j++) {
    const y = band.y + (j + 0.5 - ny / 2) / density;
    if (y < 0.36 * Math.abs(ear[1]) || y > 0.93 * Math.abs(ear[1])) continue;
    const start = (z * ny + j) * nx;
    const i = band.model.colors.subarray(start, start + nx).findLastIndex(Boolean);
    if (i < 0) continue;
    const x = band.x + (i + 0.5 - nx / 2) / density;
    for (const [k, angle] of angles.entries()) edges[k] = Math.max(edges[k], x * Math.sin(angle) + y * Math.cos(angle));
  }
  assert.ok(edges.every(Number.isFinite));
  return edges;
}
for (const [id, outline] of [['look_body_female', 'square'], ['look_fern', 'round'], ['look_body_male', 'pear']]) {
  const full = clone(looks.templateById.get(id));
  full.parts.hair = 'bald'; full.parts.hat = 'none';
  full.face = { ...looks.facePresets.classic.face, outline };
  Object.assign(full.shape, { cheekHeight: -0.72, cheekWidth: 0.1, cheekProjection: -0.23, cheekFullness: 0.78 });
  const deep = { ...full, shape: { ...full.shape, headDepth: 1.2, faceRelief: 1.8 } };
  assert.ok(looks.cheekAdjustment(deep, 'expressive').cheekFullness < looks.cheekAdjustment(full, 'expressive').cheekFullness);
  const soft = clone(full);
  Object.assign(soft.shape, looks.cheekAdjustment(soft));
  assert.deepEqual(Object.keys(looks.cheekAdjustment(soft)), [], 'repeated correction must be idempotent');
  const before = looks.build(full), after = looks.build(soft);
  const angles = [45, 55, 65], oldEdges = cheekEdges(before, angles), newEdges = cheekEdges(after, angles);
  for (const [i, view] of angles.entries()) assert.ok(oldEdges[i] - newEdges[i] > 0.20, outline + ' at ' + view);
  for (const point of ['mouth', 'upperLip', 'lowerLip', 'chinTip', 'leftJawJoint', 'leftEarCanal']) {
    assert.deepEqual(before.sockets[point], after.sockets[point], point + ' must stay seated');
  }
}
// Measure both outlines of the rendered fine voxels at a fixed world-space pitch.
function portraitBand(actor, density = 4) {
  const pose = motion.rig.pose(actor.rig);
  const chin = motion.rig.socket(actor, pose, 'chinTip');
  const band = actor.body.faceLayers(pose, actor.body.makePose(pose), chin[2] - 1, density)[1];
  assert.equal(band.body.density, density);
  return band;
}
function portraitEdges(band) {
  const { body, model } = band, d = body.density;
  return (y, z) => {
    const row = Math.floor((y - band.y) * d + body.ny / 2);
    const layer = Math.floor((z - band.z) * d);
    const start = (layer * body.ny + row) * body.nx;
    const line = model.colors.subarray(start, start + body.nx);
    const first = line.findIndex(Boolean), last = line.findLastIndex(Boolean);
    assert.ok(first >= 0 && last > first);
    return [first, last].map((i) => band.x + (i + 0.5 - body.nx / 2) / d);
  };
}
// Read the 45-degree outline from occupied voxels. A sudden drop just below
// the mouth makes the far cheek look like another nose as the infant turns.
{
  const doc = looks.templateById.get('look_chestnut'), actor = looks.build(doc);
  const pose = motion.rig.pose(actor.rig), point = name => motion.rig.socket(actor, pose, name);
  const eye = point('leftEye'), lip = point('mouth'), chin = point('chinTip');
  const band = actor.body.faceLayers(pose, actor.body.makePose(pose), chin[2] - 1, 6)[1];
  const { nx, ny, density } = band.body, pitch = 1 / density;
  const zAt = z => Math.floor((z - band.z) * density);
  const angle = Math.SQRT1_2;
  let last;
  for (let z = zAt(lip[2] - 0.25 * (lip[2] - chin[2])); z <= zAt(lip[2] + 0.46 * (eye[2] - lip[2])); z++) {
    let edge = -Infinity;
    for (let y = 0; y < ny; y++) {
      const start = (z * ny + y) * nx;
      const x = band.model.colors.subarray(start, start + nx).findLastIndex(Boolean);
      if (x >= 0) edge = Math.max(edge, pitch * angle * (x + y));
    }
    assert.ok(Number.isFinite(edge));
    if (last !== undefined) assert.ok(Math.abs(last - edge) <= 1.6 * pitch, 'continuous infant cheek at the lip commissure');
    last = edge;
  }
  // The fitted knit rises above the forehead and covers the back below eye
  // level. Measure the dyed fabric on the visible front and rear centreline.
  const greenCap = looks.build({ ...doc, colors: { ...doc.colors, hat: '#00ff00' } });
  const cap = portraitBand(greenCap, 6), y = Math.floor(cap.body.ny / 2 - cap.y * 6);
  let front = Infinity, back = Infinity;
  const isWool = col => (col >>> 8 & 255) > 1.6 * (col & 255) && (col >>> 8 & 255) > 1.6 * (col >>> 16 & 255);
  for (let z = 0; z < cap.body.nz; z++) {
    const i = (z * cap.body.ny + y) * cap.body.nx;
    const row = cap.model.colors.subarray(i, i + cap.body.nx), first = row.findIndex(Boolean);
    if (first < 0) continue;
    const height = cap.z + (z + 0.5) / 6;
    if (isWool(row[first])) back = Math.min(back, height);
    if (isWool(row[row.findLastIndex(Boolean)])) front = Math.min(front, height);
  }
  assert.ok(Number.isFinite(front) && front > eye[2] + (eye[2] - lip[2]) && back < eye[2]);
}
// Raycast each profile from the outside. A pupil can be present in a front view
// and still disappear behind the outer corner of the eye when the actor turns.
for (const id of ['look_chestnut', 'look_hazel']) {
  const spec = vm.runInContext('pineDesignerBody', context).build(looks.templateById.get(id));
  for (const key of ['eyes', 'pupil', 'irisLight', 'irisRim', 'irisShadow', 'irisHoney'])
    spec.art.materials[key] = '14e6a0';
  const actor = motion.createCharacter({ id, label: id, ...spec });
  for (const blink of [0, 1]) {
    const pose = motion.rig.pose(actor.rig, { blink });
    const band = motion.closePortraitLayers(actor, pose, actor.body.makePose(pose))[1];
    const { nx, ny, density } = band.body;
    const eyeZ = motion.rig.socket(actor, pose, 'leftEye')[2];
    const start = Math.floor((eyeZ - 1.2 - band.z) * density);
    const end = Math.ceil((eyeZ + 1.2 - band.z) * density);
    for (const side of [-1, 1]) {
      let iris = 0;
      for (let z = start; z <= end; z++) for (let x = 0; x < nx; x++) {
        for (let i = 0; i < ny; i++) {
          const y = side < 0 ? i : ny - 1 - i;
          const color = band.model.colors[(z * ny + y) * nx + x];
          if (!color) continue;
          if ((color & 0xffffff) === 0xa0e614) iris++;
          break;
        }
      }
      assert.ok(blink ? iris === 0 : iris >= 3, id + ' profile iris and blink on side ' + side);
    }
  }
}
{
  const actor = looks.build(looks.templateById.get('look_hazel'));
  const pose = motion.rig.pose(actor.rig);
  const edge = portraitEdges(motion.closePortraitLayers(actor, pose, actor.body.makePose(pose))[1]);
  const lip = actor.sockets.mouth.point[2], chin = actor.sockets.chinTip.point[2];
  const front = t => edge(0, lip + t * (chin - lip))[1];
  const lowerLip = front(0.15), fold = front(0.45), pad = front(0.8);
  assert.ok(lowerLip > pad && pad > fold, 'lower lip, shallow fold and chin pad read in profile');
  assert.ok(front(1.15) < pad, 'chin rounds back toward the throat');
}
// Read the centreline from the occupied pixels, including the separate nose volume.
// Compare the same actors and lens pitch on either side of the profile upgrade.
{
  function tipAndPhiltrum(actor) {
    const pose = motion.rig.pose(actor.rig), socket = name => motion.rig.socket(actor, pose, name);
    const chin = socket('chinTip'), lip = socket('mouth'), upper = socket('upperLip'), eye = socket('leftEye');
    const band = actor.body.faceLayers(pose, actor.body.makePose(pose), chin[2] - 1, 6)[1];
    const edges = portraitEdges(band), pitch = 1 / band.body.density;
    const philtrumTop = lip[2] + 0.40 * (eye[2] - lip[2]);
    let tip = -Infinity, philtrum = Infinity;
    for (let z = upper[2]; z <= eye[2]; z += pitch) {
      const front = edges(0, z)[1];
      tip = Math.max(tip, front);
      if (z <= philtrumTop) philtrum = Math.min(philtrum, front);
    }
    return { recess: tip - philtrum, lipClearance: tip - edges(0, upper[2])[1], pitch };
  }
  for (const [id, nose, mouth, style] of [
    ['look_body_female', 'aquiline', 'thin', 'manga'], ['look_body_male', 'broad', 'relaxed', 'natural'],
    ['look_fern', 'short', 'soft-smile', 'game'], ['look_workshop_toddler', 'button', 'small', 'manga']
  ]) {
    const doc = clone(looks.templateById.get(id));
    Object.assign(doc.parts, { hair: 'bald', hat: 'none', neck: 'none' });
    doc.face = { ...looks.facePresets.classic.face, ...doc.face, nose, mouth, style };
    Object.assign(doc.shape, { lipProjection: -0.14, chinProjection: 0.04, noseBridge: 0.14 });
    const prior = tipAndPhiltrum(looks.build({ ...doc, packs: { 'pine-core': looks.illustratedRelease } }));
    const current = tipAndPhiltrum(looks.build(doc));
    assert.ok(current.recess <= prior.recess - 1.5 * current.pitch, id + ' soften the drop at the base of the nose');
    assert.ok(current.lipClearance >= 1.5 * current.pitch, id + ' retain a distinct tip above the upper lip');
  }
}
function sideProfile(actor) {
  const pose = motion.rig.pose(actor.rig);
  const point = (name) => motion.rig.socket(actor, pose, name);
  const eye = point('leftEye'), mouth = point('mouth'), ear = point('leftEarCanal'), chin = point('chinTip');
  const edges = portraitEdges(portraitBand(actor));
  const [rear, brow] = edges(0, eye[2] + 0.5 * (eye[2] - mouth[2]));
  const cheek = edges(0.49 * ear[1], 0.53 * eye[2] + 0.47 * mouth[2])[1];
  return { rear, brow, depth: brow - rear, cheek, chin: chin[0], lip: mouth[0] };
}
{
  const excursions = [];
  for (const id of ['look_body_female', 'look_fern', 'look_workshop_toddler', 'look_workshop_baby']) {
    const recipe = looks.templateById.get(id);
    const variant = (lipProjection, jawDefinition) => ({
      ...recipe, shape: { ...recipe.shape, lipProjection, jawDefinition }
    });
    const lips = [-1, 0, 1].map(v => looks.build(variant(v, 0)));
    const [low, neutral, high] = lips;
    for (const name of ['upperLip', 'mouth', 'lowerLip']) {
      const [a, b, c] = lips.map(actor => actor.sockets[name].point[0]);
      assert.ok(a < b && b < c, id + ' moves the ' + name + ' contact with the lip surface');
    }
    excursions.push(high.rig.mouth[0] - low.rig.mouth[0]);
    for (const actor of [low, high]) {
      for (const name of ['leftEye', 'chinTip', 'leftEarCanal', 'leftJawJoint', 'leftJawAngle', 'throat'])
        assert.deepEqual(actor.sockets[name], neutral.sockets[name], id + ' lip projection moved ' + name);
      const sip = motion.actions.get('drink').sample(0.50, actor)[0].pose;
      assert.ok(distance(sip.bottle.lip, motion.rig.socket(actor, sip, 'mouth')) < 1e-7);
    }
    // Compare occupied cells under the mandible, independently of their pigment.
    const volumes = [-1, 0, 1].map(v => {
      const actor = looks.build(variant(0, v)), angle = actor.sockets.leftJawAngle.point, chin = actor.sockets.chinTip.point;
      assert.deepEqual(actor.sockets, neutral.sockets, id + ' definition moved a contact');
      const band = portraitBand(actor), { nx, ny, density } = band.body;
      const from = Math.ceil((angle[0] - band.x) * density + nx / 2 - 0.5);
      const to = Math.floor((chin[0] - band.x) * density + nx / 2 - 0.5);
      const top = Math.floor((Math.max(angle[2], chin[2]) - band.z) * density - 0.5);
      let count = 0;
      for (let z = 0; z <= top; z++) for (let y = 0; y < ny; y++) {
        const start = (z * ny + y) * nx;
        for (let x = from; x <= to; x++) if (band.model.colors[start + x]) count++;
      }
      return count;
    });
    assert.ok(volumes[0] > volumes[1] && volumes[1] > volumes[2], id + ' must taper the underside of the jaw');
    const old = { ...variant(0, 0), packs: { 'pine-core': looks.naturalProfileRelease } };
    assert.equal(looks.prepare(old).recipe.packs['pine-core'], looks.naturalProfileRelease);
    for (const key of Object.keys(looks.profileControls))
      assert.throws(() => looks.prepare({ ...old, shape: { ...old.shape, [key]: 0.4 } }));
  }
  assert.ok(excursions.slice(1).every((delta, i) => delta < excursions[i]), 'younger heads use gentler projection');
  const old = looks.build({ ...looks.templateById.get('look_fern'), packs: { 'pine-core': looks.naturalProfileRelease } });
  const pose = motion.rig.pose(old.rig), coarse = old.body.makePose(pose);
  assert.equal(hash(coarse.colors), 'accdfe709baa9a2c138400b4119aa03a8e77bd3c962b2791749563948f08bd55');
  assert.equal(hash(motion.faceLayers(old, pose, coarse)[1].model.colors), '8fc5b2bb8c1d591dd384eb2bbe5ce64ce49ecf7c5e9848cab88a3a9a63ad470f');
}
{
  const baby = looks.templateById.get('look_workshop_baby');
  const oldDoc = { ...baby, packs: { 'pine-core': looks.infantRelease } };
  assert.ok(looks.hasInfantHead(oldDoc) && looks.hasInfantHead(baby));
  const old = looks.build(oldDoc), current = looks.build({ ...baby, face: { ...baby.face, style: 'natural' } });
  const rest = motion.rig.pose(old.rig), model = old.body.makePose(rest);
  assert.equal(hash(model.colors), '5919f9c4ce2b25550a1540b2fa62dc117c20f14a649cbcc82b614fa968b97e5d');
  assert.equal(hash(motion.faceLayers(old, rest, model)[1].model.colors),
    'be8ac6a748d64ca88d331b8cb5dcf42d49292c64e61c6b81957995229f0dfcf2', 'replay the 1.13.0 knit cap and portrait');
  const bareParts = { ...baby.parts, hair: 'bald', hat: 'none' };
  const oldBand = portraitBand(looks.build({ ...oldDoc, parts: bareParts }), 6);
  const bareBand = portraitBand(looks.build({ ...baby, parts: bareParts }), 6);
  const previous = portraitEdges(oldBand), revised = portraitEdges(bareBand);
  const nape = old.sockets.mouth.point[2] + 0.14;
  const upperNape = old.sockets.leftEarCanal.point[2] - 0.36;
  const bulge = old.sockets.leftEarCanal.point[2] + 1.50;
  assert.ok(previous(0, nape)[0] - revised(0, nape)[0] > 0.5, 'fill the notch behind the lower ear');
  const step = edges => edges(0, nape)[0] - edges(0, upperNape)[0];
  assert.ok(step(revised) > 0 && step(revised) < 0.65 * step(previous), 'ease the turn into the neck');
  const trim = revised(0, bulge)[0] - previous(0, bulge)[0];
  assert.ok(trim > 0 && trim < 0.5, 'retain a rounded, slightly shallower upper occiput');
  const rim = old.sockets.leftEye.point[2] + 2.8;
  const oldKnit = portraitEdges(portraitBand(old, 6))(0, rim), knit = portraitEdges(portraitBand(current, 6))(0, rim);
  assert.ok(Math.abs(knit[1] - oldKnit[1]) < 1e-8, 'front of folded band');
  const wool = revised(0, rim)[0] - knit[0];
  assert.ok(wool > 0.15 && wool < previous(0, rim)[0] - oldKnit[0] - 0.3, 'fit the folded band outside the new scalp');
  // Along a line through both earlobes, the visible pinnae and head form one
  // piece. The old lobes were separated from the skin by a voxel on each side.
  function solidEarRow(band, z) {
    const { nx, ny, density } = band.body;
    const x = Math.floor((old.sockets.leftEarCanal.point[0] - band.x) * density + nx / 2);
    const layer = Math.floor((z - band.z) * density);
    const row = Array.from({ length: ny }, (_, y) => band.model.colors[(layer * ny + y) * nx + x]);
    const first = row.findIndex(Boolean), last = row.findLastIndex(Boolean);
    return first >= 0 && row.slice(first, last + 1).every(Boolean);
  }
  for (const offset of [-0.82, -0.67]) {
    const z = old.sockets.leftEarCanal.point[2] + offset;
    assert.ok(!solidEarRow(oldBand, z) && solidEarRow(bareBand, z), 'seat each earlobe against the temple');
  }
  for (const shape of [{ headDepth: 0.8, occiput: 1.2 }, { headDepth: 1.2, occiput: 0.8 }]) {
    const proportions = { ...baby.shape, ...shape };
    const a = looks.build({ ...oldDoc, shape: proportions });
    const b = looks.build({ ...baby, face: { ...baby.face, style: 'natural' }, shape: proportions });
    const archive = looks.build({ ...baby, packs: { 'pine-core': looks.silhouetteRelease }, face: { ...baby.face, style: 'natural' }, shape: proportions });
    assert.deepEqual(archive.sockets, a.sockets, 'archived face and motion anchors at both ends of the depth sliders');
    for (const name of ['headPivot', 'leftJawJoint', 'rightJawJoint', 'leftEarCanal', 'collar'])
      assert.deepEqual(b.sockets[name], a.sockets[name], 'new infant geometry preserves the ' + name);
  }
  const before = skull.reshape('baby', baby.shape, 1, true), after = skull.reshape('baby', baby.shape, 1, true, true);
  for (const h of [-0.85, -0.54, -0.27, 0, 0.26, 0.55, 0.88]) {
    for (const y of [0, 0.4, 0.76]) assert.equal(after.frontAt(after.row(h), y), before.frontAt(before.row(h), y));
  }
}
for (const id of ['look_body_male', 'look_fern', 'look_workshop_toddler', 'look_workshop_baby']) {
  const doc = looks.templateById.get(id);
  const build = (pin, shape = {}) => looks.build({
    ...doc, packs: { 'pine-core': pin }, parts: { ...doc.parts, hair: 'bald', hat: 'none', neck: 'none' },
    shape: { ...doc.shape, ...shape }
  });
  const old = build(looks.mandibleRelease), current = build(looks.occipitalRelease);
  const before = sideProfile(old), after = sideProfile(current);
  const lastFit = build(looks.sagittalRelease), prior = sideProfile(lastFit);
  assert.deepEqual(current.sockets, lastFit.sockets, id + ' face and jaw landmarks after the occipital trim');
  assert.deepEqual([after.brow, after.cheek, after.chin, after.lip], [prior.brow, prior.cheek, prior.chin, prior.lip]);
  assert.ok(after.rear >= prior.rear && after.rear - prior.rear <= 0.5, id + ' modest rear trim');
  assert.ok(after.depth > 1.15 * before.depth && after.depth < 1.35 * before.depth, id + ' sagittal fit');
  assert.ok(after.rear < before.rear && after.brow > before.brow, id + ' forehead and occiput');
  assert.ok(after.cheek > before.cheek + 0.5 && after.chin > before.chin + 0.5, id + ' face and chin');
  const shallow = build(looks.occipitalRelease, { headDepth: 0.8 }), deep = build(looks.occipitalRelease, { headDepth: 1.2 });
  assert.ok(sideProfile(deep).depth > 1.4 * sideProfile(shallow).depth, id + ' head depth control');
  for (const actor of [current, shallow, deep]) {
    for (const name of ['headPivot', 'collar', 'leftEarCanal', 'rightEarCanal', 'leftJawJoint', 'rightJawJoint', 'leftJawAngle', 'rightJawAngle'])
      assert.ok(distance(actor.sockets[name].point, old.sockets[name].point) < 1e-8, id + ' ' + name);
    assert.deepEqual(actor.sockets.leftEye.point.slice(1), old.sockets.leftEye.point.slice(1));
    assert.equal(actor.sockets.chinTip.point[2], old.sockets.chinTip.point[2]);
  }
  const soft = sideProfile(build(looks.occipitalRelease, { faceRelief: 0 }));
  const raised = sideProfile(build(looks.occipitalRelease, { faceRelief: 1.8 }));
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
  if (doc.base === 'baby') {
    // Check the infant donor's ear-to-hinge offsets in head units. Its head
    // occupies more of the standing height than the older actors' heads.
    assert.ok(Math.abs((ear[2] - joint[2]) / 3.89 - 0.2644) < 0.001);
    assert.ok(Math.abs((joint[0] - ear[0]) / 3.43 - 0.3547) < 0.001);
  } else assert.ok(distance(joint, ear) < 0.06 * a.rig.height);
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
  for (const phase of [0.45, 0.53, 0.62]) {
    const [parent, child] = motion.actions.get('cradle').sample(phase, a, baby);
    assert.ok(distance(parent.contacts.seatHand, child.contacts.seat) < 0.01 &&
      distance(parent.contacts.backHand, child.contacts.back) < 0.01);
  }
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
// Editable figures share anatomical anchors across editions and the value design across dyes.
{
  const painter = vm.runInContext('pineDesignerBody', context);
  const archives = {
    look_chestnut: '35eb37ae64013ec86f64d1a76d32533a07a6ac0074d870f88c21bcbe6d50e04e',
    look_hazel: '379d98d7e669218a385658a1ed910e4c7dcb1f4b47c1e505b2830c0a8ae47a9e',
    look_developer: 'f87d7a3cd7984576cb12b2a72fadb3d19ac3d62676acd14114638126cd7b0506'
  };
  for (const id of [...Object.keys(archives), 'look_workshop_toddler', 'look_style_runner']) {
    const recipe = looks.templateById.get(id);
    const old = looks.build({ ...recipe, packs: { 'pine-core': looks.pixelRelease } }), current = looks.build(recipe);
    assert.deepEqual(current.sockets, old.sockets);
    assert.deepEqual(current.rig, old.rig);
    const pose = motion.actions.get(recipe.base === 'baby' ? 'sit' : 'walk').sample(0.32, current)[0].pose;
    const historic = old.body.makePose(pose), standard = current.body.makePose(pose);
    if (archives[id]) assert.equal(hash(historic.colors), archives[id], 'published 1.17.0 ' + id);
    assert.notEqual(hash(standard.colors), hash(historic.colors));
    const colors = { ...recipe.colors, skin: '#654632', hair: '#553867', top: '#3967a8', bottom: '#75415a', shoes: '#14563e' };
    const saved = looks.prepare(JSON.parse(JSON.stringify({ ...recipe, colors }))).recipe;
    const materials = painter.build(saved).art.materials;
    for (const [group, slot] of [['cloth','top'], ['trouser','bottom'], ['strand','hair'], ['hide','shoes']]) {
      assert.equal(materials[group + 'Ink4'], colors[slot].slice(1));
      assert.equal(new Set(Array.from({ length: 8 }, (_, level) => materials[group + 'Ink' + level])).size, 8);
    }
    const dyed = looks.build(saved), recolored = dyed.body.makePose(pose);
    const fine = motion.figureLayers(current, pose, standard)[0], alternate = motion.figureLayers(dyed, pose, recolored)[0];
    for (const [before, after] of [[standard, recolored], [fine.model, alternate.model]]) {
      assert.deepEqual(before.bounds, after.bounds);
      assert.equal(before.colors.length, after.colors.length);
      assert.ok(before.colors.every((color, i) => Boolean(color) === Boolean(after.colors[i])), 'dye changed a silhouette');
      assert.notEqual(hash(before.colors), hash(after.colors));
    }
  }
}
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
  const lamp = cast.group.getObjectByName('world/lamp'), fineLamp = lamp.geometry;
  const standard = motion.compile({ ...plan.score, detail: 'standard' });
  cast.setTime(standard, 0);
  assert.notEqual(lamp.geometry, fineLamp);
  assert.equal(cast.group.getObjectByName('look_programmer/face').visible, false);
  cast.setTime(plan, 0);
  assert.equal(lamp.geometry, fineLamp, 'revisit the cached fine prop after changing quality');
  assert.equal(cast.group.getObjectByName('look_programmer/face').visible, true);
  cast.setTime(plan, plan.starts[1]);
  const desk = cast.group.getObjectByName('world/desk');
  assert.ok(desk.visible);
  const shape = desk.geometry;
  cast.setScene([world.place('desk', 18, 6), world.place('test-cushion')]);
  assert.equal(cast.group.getObjectByName('world/desk').geometry, shape);
  cast.setScene(stallOffice.scene);
  assert.ok(Math.abs(cast.group.getObjectByName('world/desk').position.z - 4.7) < 1e-7);
  assert.ok(Math.abs(cast.group.getObjectByName('world/lamp').position.z - 25.8) < 1e-7);
  const room = motion.compile(pavilionBook);
  cast.setScene(room.score.scene);
  const deskMesh = cast.group.getObjectByName('world/desk'), deskAt = room.worldScene[3];
  assert.ok(distance(deskMesh.position.toArray(), [deskAt.x, deskAt.y, deskAt.z]) < 1e-7);
  cast.setTime(room, room.starts[1]);
  assert.ok(distance(deskMesh.position.toArray(), [deskAt.x, deskAt.y, deskAt.z]) < 1e-7);
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
