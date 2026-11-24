// Regression checks run in separate browser-like contexts. No browser or packages required.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createHash, webcrypto } = require('node:crypto');
const vm = require('node:vm');
const read = (path) => readFileSync(join(__dirname, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const clone = (value) => JSON.parse(JSON.stringify(value));
const sources = [
  'motion',
  'character-slices',
  'actor',
  'surveyor-art',
  'family-art',
  'vehicle-slices',
  'world-objects',
  'activity-props',
  'studio-props',
  'studio-rig',
  'studio-actions',
  'duet-clips',
  'motion-gestures',
  'movement-clips',
  'daily-clips',
  'social-clips',
  'work-clips',
  'studio-library',
  'portrait-styles',
  'hair-styles',
  'head-sections',
  'head-shape',
  'short-hair',
  'everyday-styles',
  'workshop-wear',
  'world-wardrobe',
  'designer-body',
  'appearance',
  'appearance-store'
];
function client(disk = new Map(), quota = Infinity) {
  const localStorage = {
    get length() {
      return disk.size;
    },
    key: (i) => [...disk.keys()][i],
    getItem: (key) => disk.get(key) ?? null,
    removeItem: (key) => disk.delete(key),
    setItem: (key, value) => {
      if (!disk.has(key) && disk.size >= quota) throw new Error('QuotaExceededError');
      disk.set(key, value);
    }
  };
  const c = vm.createContext({ localStorage, structuredClone, crypto: webcrypto });
  for (const name of sources) vm.runInContext(read(name + '.js'), c, { filename: name + '.js' });
  return {
    m: c.PineMotion,
    l: c.PineLooks,
    w: c.PineWardrobe,
    painter: vm.runInContext('pineDesignerBody', c),
    disk
  };
}
function colorDigest(colors) {
  return createHash('sha256')
    .update(Buffer.from(colors.buffer, colors.byteOffset, colors.byteLength))
    .digest('hex');
}
function poseDigest(person, pose) {
  const model = person.body.makePose(pose);
  assert.ok(model.bounds[3] > model.bounds[0] && model.bounds[5] > model.bounds[2]);
  return colorDigest(model.colors);
}
function digest(person, motion, action = 'idle', phase = 0.31) {
  return poseDigest(person, motion.actions.get(action).sample(phase, person)[0].pose);
}
const a = client(),
  hat = json('packs/creek-hats.json'),
  first = json('packs/creek-child.json'),
  second = json('packs/maple-child.json');
const builtins = a.l.templates.length + 6;
assert.equal(a.m.characters.size, builtins);
const coreVersions = json('character-v1.schema.json').properties.packs.properties['pine-core'].enum;
assert.deepEqual(
  [...a.l.catalog.keys()],
  coreVersions.map((pin) => 'pine-core@' + pin)
);
assert.equal(a.l.prepare(second).recipe.baseNotice, read('LICENSE').trimEnd());
assert.equal(second.embeddedPacks[0].notice, read('LICENSE').trimEnd());
assert.deepEqual(clone(a.l.manifest(hat)), clone(a.l.manifest(second.embeddedPacks[0])));
assert.ok(a.w.save(first).persistent);
assert.ok(a.w.save(second).persistent);
assert.equal(a.w.saved.size, 2);
const importedSize = new Set([...a.l.templateById.keys(), first.id, second.id]).size + 6;
assert.equal(a.m.characters.size, importedSize);
const b = client(a.disk);
assert.equal(b.w.hydrate(), 0);
assert.equal(b.m.characters.size, importedSize);
for (const doc of [first, second]) {
  assert.equal(
    digest(a.m.characters.get(doc.id), a.m, 'run'),
    digest(b.m.characters.get(doc.id), b.m, 'run')
  );
  assert.deepEqual(clone(a.w.saved.get(doc.id)), clone(b.w.saved.get(doc.id)));
}
assert.notEqual(digest(a.m.characters.get(first.id), a.m), digest(a.m.characters.get(second.id), a.m));
const baseline = digest(a.l.build(first), a.m);
const current = { ...first, packs: { 'pine-core': a.l.release } };
const shapeSchema = json('character-v1.schema.json').properties.shape.properties;
for (const [key, values] of Object.entries(a.l.shape)) {
  const { minimum, maximum, default: normal } = shapeSchema[key];
  assert.deepEqual([...values], [minimum, maximum, normal], key + ' schema and renderer ranges differ');
  const doc = clone(current);
  doc.shape[key] = values[0];
  assert.notEqual(digest(a.l.build(doc), a.m), baseline, key + ' changes sampled pixels');
  doc.shape[key] = values[1] + 0.01;
  assert.throws(() => a.l.build(doc));
}
for (const pin of [a.l.originalRelease, a.l.styleRelease, a.l.profileRelease]) {
  for (const key of ['height', 'shoulders', 'arms', 'legs']) {
    for (const limit of a.l.shape[key].slice(0, 2)) {
      assert.throws(() =>
        a.l.prepare({ ...first, packs: { 'pine-core': pin }, shape: { ...first.shape, [key]: limit } })
      );
    }
  }
}
for (const [slot, choices] of Object.entries(a.l.slots)) {
  const doc = clone(first);
  doc.parts[slot] = Object.keys(choices).find((value) => value !== first.parts[slot]);
  assert.notEqual(digest(a.l.build(doc), a.m), baseline, slot + ' changes sampled pixels');
}
for (const key of Object.keys(a.l.colors)) {
  const doc = clone(first);
  doc.colors[key] = '#07aaff';
  assert.notEqual(digest(a.l.build(doc), a.m), baseline, key);
}
const tallPack = {
  ...clone(hat),
  id: 'tall-caps',
  parts: [
    {
      id: 'tall',
      label: 'Tall cap',
      slot: 'hat',
      primitives: [{ shape: 'box', center: [0, 0, 2], size: [1, 1, 2], color: 'hatMain' }]
    }
  ]
};
a.l.install(tallPack);
const tall = a.l.build({
  ...first,
  parts: { ...first.parts, hat: 'tall-caps/tall' },
  packs: { ...first.packs, 'tall-caps': '1.0.0' }
});
const tallModel = tall.body.makePose(a.m.actions.get('idle').sample(0.31, tall)[0].pose);
assert.ok(tall.body.nz > a.l.build(first).body.nz && tallModel.bounds[5] < tall.body.nz - 1);
let pairings = 0;
const distance = (u, v) => Math.hypot(...u.map((n, i) => n - v[i]));
const variants = [];
for (const base of ['adult', 'child'])
  for (const side of [0, 1]) {
    const doc = clone(current);
    doc.base = base;
    doc.id = 'look_' + base + side;
    for (const [key, range] of Object.entries(a.l.shape)) doc.shape[key] = range[side];
    const plain = a.l.build(doc);
    for (const id of ['field-cap', 'knit-cap']) {
      const capped = {
        ...doc,
        parts: { ...doc.parts, hat: 'creek-hats/' + id },
        packs: { ...doc.packs, 'creek-hats': hat.release }
      };
      assert.notEqual(digest(a.l.build(capped), a.m), digest(plain, a.m), base + ' · ' + id);
    }
    variants.push(plain);
    assert.deepEqual(
      [...a.m.actions.values()].filter((clip) => a.m.accepts(clip, 0, plain)).map((clip) => clip.id),
      [...a.m.findActions(a.m.characters.get(plain.tags.includes('adult') ? 'surveyor' : 'child'))].map(
        (clip) => clip.id
      )
    );
    const drink = a.m.actions.get('drink').sample(0.5, plain)[0].pose;
    assert.ok(distance(a.m.rig.socket(plain, drink, 'mouth'), drink.bottle.lip) < 1e-7);
    for (const action of [
      'run',
      'jump',
      'drink',
      'phone',
      'type',
      'pivot',
      'write',
      'guitar',
      'recline',
      'sweep'
    ]) {
      const e = a.m.actions.get(action).sample(0.5, plain)[0],
        model = plain.body.makePose(e.pose);
      const bounds = Array.from(model.bounds),
        body = plain.body;
      assert.ok(
        bounds[0] > 0 &&
          bounds[3] < body.nx - 1 &&
          bounds[1] > 0 &&
          bounds[4] < body.ny - 1 &&
          bounds[5] < body.nz - 1,
        action + ' hits a sampling edge'
      );
    }
  }
for (const lead of variants)
  for (const partner of variants) {
    const [left, right] = a.m.actions.get('highfive').sample(0.5, lead, partner);
    assert.ok(distance(left.contacts.palm, right.contacts.palm) < 0.01);
    for (const id of ['handshake', 'fist-bump']) {
      const [a1, a2] = a.m.actions.get(id).sample(0.5, lead, partner);
      assert.ok(distance(a1.contacts.palm, a2.contacts.palm) < 1e-6, id);
    }
    if (lead.tags.includes('adult') && partner.tags.includes('child')) {
      for (const u of [0.08, 0.32, 0.5, 0.79, 0.91]) {
        const [a1, a2] = a.m.actions.get('hold-hands').sample(u, lead, partner);
        assert.ok(distance(a1.contacts.palm, a2.contacts.palm) < 1e-6, 'custom actors lost hand contact');
      }
    }
    pairings++;
  }
const cast = json('packs/after-school.json'),
  fresh = client(),
  plan = fresh.w.readScoreFile(clone(cast), true);
assert.equal(plan.score.steps.length, 4);
assert.equal(plan.score.loop, true);
assert.equal(fresh.w.saved.size, 2);
const recovered = fresh.w.scoreFile(plan.score);
assert.equal(recovered.characters.length, 2);
assert.ok(recovered.characters[1].embeddedPacks.length);
assert.equal(
  digest(fresh.m.characters.get(second.id), fresh.m, 'drink'),
  digest(a.m.characters.get(second.id), a.m, 'drink')
);
const old = clone(a.m.presets.family);
assert.deepEqual(clone(a.w.scoreFile(old)), old);
assert.deepEqual(clone(fresh.w.readScoreFile(old).score), clone(fresh.m.compile(old).score));
const corrupt = client(),
  malformed = clone(cast);
malformed.score.steps[3].action = 'crawl';
assert.throws(() => corrupt.w.readScoreFile(malformed, true));
assert.equal(corrupt.m.characters.size, builtins);
assert.equal(corrupt.l.catalog.size, coreVersions.length);
assert.equal(corrupt.disk.size, 0);
const limited = client(new Map(), 1);
const temporary = limited.w.readScoreFile(clone(cast), true);
assert.equal(temporary.charactersPersisted, false);
assert.equal(limited.disk.size, 0);
assert.equal(limited.w.saved.size, 2);
assert.equal(limited.w.scoreFile(temporary.score).characters.length, 2);
const missing = clone(cast);
missing.characters.pop();
assert.throws(() => fresh.w.readScoreFile(missing));
const bad = clone(second);
bad.embeddedPacks[0].parts[0].primitives[0].color = 'missing';
assert.throws(() => a.w.importCharacter(bad));
const unpinned = clone(second);
delete unpinned.embeddedPacks;
unpinned.packs['creek-hats'] = '9.0.0';
assert.throws(() => a.l.prepare(unpinned));
const revised = clone(hat);
revised.parts[0].label += '新款';
assert.throws(() => a.l.install(revised));
revised.release = '1.1.0';
a.l.install(revised);
assert.equal(a.l.prepare(second).hat.label, hat.parts[0].label);
const changed = clone(second);
changed.colors.top = '#c88140';
const fork = a.w.importCharacter(changed).recipe;
assert.notEqual(fork.id, second.id);
assert.equal(a.w.saved.size, 3);
const collision = clone(cast);
collision.characters[0].label = '同名 ID 的其他演员';
const rekey = a.w.readScoreFile(collision, true).score;
assert.notEqual(rekey.steps[0].actors[0], first.id);
assert.equal(rekey.steps[0].actors[0], rekey.steps[2].actors[0]);
assert.equal(a.m.characters.get(first.id).label, first.label);
a.w.save({ ...first, label: '另一页的修改' });
assert.throws(() => b.w.save({ ...first, label: '较旧的草稿' }));
const garbage = client(new Map([['pineCreek.look.v1.broken', '{']]));
assert.equal(garbage.w.hydrate(), 1);
assert.equal(garbage.m.characters.size, builtins);
// Frozen images from core 1.0.0 catch changes to old art even if both import and export change together.
assert.deepEqual(clone(a.l.prepare(first).recipe), first);
assert.deepEqual(clone(a.l.prepare(second).recipe), second);
function asPriorStyle(doc) {
  const prior = clone(doc);
  delete prior.gender;
  prior.packs['pine-core'] = a.l.styleRelease;
  return prior;
}
const archived = [
  [first, 'e47e0e446e167d0613115204817ccde8461ddb9de804563dec6359313808fb6a'],
  [second, '8951ad26dc67bfe486d3e0abe082d3fc7cae7c7fac7777e816432db9f3485352'],
  [
    asPriorStyle(a.l.templates.find((p) => p.id === 'look_ridge')),
    '0569981e7d8ff0c5b2decb9ac9175b9d32cc4cdd5e69317c35bb20bc05d85827'
  ]
];
// The archive was painted at 31% of the original idle. Keep the reference pose fixed as clips evolve.
for (const [doc, expected] of archived) {
  const person = a.l.build(doc);
  const t = 0.31 * (2 * Math.PI);
  const referencePose = a.m.rig.pose(person.rig, {
    standing: 0,
    hipOffset: [0, person.rig.height * 0.005 * Math.sin(t), -0.15 * (1 - Math.cos(t))],
    headYaw: 0.13 * Math.sin(t) ** 3
  });
  assert.equal(poseDigest(person, referencePose), expected, doc.id);
}
const classic = a.l.facePresets.classic.face;
assert.equal(digest(a.l.build({ ...first, packs: { 'pine-core': a.l.hairRelease } }), a.m), baseline);
assert.notEqual(digest(a.l.build(current), a.m), baseline);
const adultSeed = a.l.templates.find((doc) => doc.id === 'look_body_female');
// The published 1.6.0 grids cover both editable bases at the same idle phase.
for (const [id, bodyHash, headHash] of [
  [
    'look_body_female',
    'b6a3f20854a45f62673506b45799efbe7741091a73f78d339e9125cc9390445b',
    '9a4950084782591456fb6efc9a6610dff6e4bb1686cf50058ce56f952f92df12'
  ],
  [
    'look_relay',
    'cb15156a048e7bad797b33f578b4426a311a6be6694ee81500accbc76470b3b0',
    '82865472b2d14a851c75a578f6e0912a786a37bfe9b1f4df796b7c02a644262d'
  ]
]) {
  const doc = a.l.templates.find((d) => d.id === id);
  const prior = a.l.build({ ...doc, packs: { 'pine-core': a.l.strandRelease } });
  const pose = a.m.actions.get('idle').sample(0.2, prior)[0].pose,
    model = prior.body.makePose(pose);
  assert.equal(colorDigest(model.colors), bodyHash);
  assert.equal(colorDigest(a.m.faceLayers(prior, pose, model)[1].model.colors), headHash);
}
// Project the occupied cells onto front and side masks independent of pigment,
// camera framing or resolution. This edition should read as the same character in motion.
function outlines(body, model) {
  const front = new Uint8Array(body.nz * body.ny),
    side = new Uint8Array(body.nz * body.nx);
  const [x0, y0, z0, x1, y1, z1] = model.bounds;
  for (let z = z0; z < z1; z++)
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        if (model.colors[(z * body.ny + y) * body.nx + x]) {
          front[z * body.ny + y] = 1;
          side[z * body.nx + x] = 1;
        }
      }
  return [front, side];
}
for (const id of ['look_body_female', 'look_body_male', 'look_relay']) {
  const doc = a.l.templates.find((d) => d.id === id);
  const prior = a.l.build({ ...doc, packs: { 'pine-core': '1.6.0' } });
  const refined = a.l.build({ ...doc, packs: { 'pine-core': '1.6.1' } });
  assert.deepEqual(refined.rig, prior.rig);
  assert.deepEqual(refined.sockets, prior.sockets);
  for (const [action, phase] of [
    ['idle', 0],
    ['run', 0.37],
    ['sit', 0.5]
  ]) {
    const pose = a.m.actions.get(action).sample(phase, prior)[0].pose;
    const old = outlines(prior.body, prior.body.makePose(pose));
    const updated = outlines(refined.body, refined.body.makePose(pose));
    updated.forEach((mask, view) => {
      let overlap = 0,
        union = 0;
      mask.forEach((cell, i) => {
        overlap += cell & old[view][i];
        union += cell | old[view][i];
      });
      assert.ok(overlap < union && overlap / union > 0.97, id + ' ' + action + ' contour drift');
    });
  }
}
// These two grids were sampled from the published 1.5.0 painter at rest.
const pinnedHead = a.l.build({
  ...adultSeed,
  packs: { 'pine-core': a.l.headRelease },
  parts: { ...adultSeed.parts, hair: 'shoulder-length', hat: 'none' },
  face: { ...classic, mouth: 'full' }
});
const pinnedPose = a.m.rig.pose(pinnedHead.rig, {});
const pinnedBody = pinnedHead.body.makePose(pinnedPose);
assert.equal(
  colorDigest(pinnedBody.colors),
  'ac13b57c6b4b85fee5e095a5249f7329a651588d8bc4de02452933898b351546'
);
assert.equal(
  colorDigest(a.m.faceLayers(pinnedHead, pinnedPose, pinnedBody)[1].model.colors),
  '86af616c38608c0b63b2da37ce2a774750b63eac46c0b9b1cb5dfcc92c222f6d'
);
// Mark the actual lip pigments and look from the front, including occlusion by skin.
// Check each visible row, since a slanted lip can still have a centered average.
function checkLipRows({ body, model, y }, label) {
  const [x0, y0, z0, x1, y1, z1] = model.bounds;
  const origin = 2 * y * body.density;
  assert.ok(Math.abs(origin - Math.round(origin)) < 1e-7, label + ' crop shifted off the sampling grid');
  let rows = 0;
  const bytes = new Uint8Array(model.colors.buffer, model.colors.byteOffset, model.colors.byteLength);
  for (let iz = z0; iz < z1; iz++) {
    const lip = new Set();
    for (let iy = y0; iy < y1; iy++) {
      const row = (iz * body.ny + iy) * body.nx;
      let ix = x1 - 1;
      while (ix >= x0 && !model.colors[row + ix]) ix--;
      if (ix < x0) continue;
      const p = (row + ix) * 4;
      if (bytes[p] > 160 && bytes[p + 1] === 0 && bytes[p + 2] === bytes[p])
        lip.add(Math.round(origin) + 2 * iy + 1 - body.ny);
    }
    for (const column of lip) assert.ok(lip.has(-column), label + ' lip row is off center');
    if (lip.size) rows++;
  }
  assert.ok(rows > 0, label + ' lip disappeared');
}
for (const base of ['adult', 'child']) {
  for (const [index, mouth] of Object.keys(a.l.features.mouth).entries()) {
    const wide = index % 2 === 1;
    const doc = {
      ...current,
      base,
      face: { ...classic, mouth },
      shape: {
        ...current.shape,
        faceWidth: wide ? 1.16 : 0.84,
        jaw: wide ? 1.2 : 0.8,
        mouthHeight: wide ? 1 : -1
      },
      parts: { ...current.parts, hair: index % 2 ? 'side-part' : 'ponytail', hat: 'none' }
    };
    const spec = a.painter.build(doc);
    for (const key of ['lips', 'upperLip', 'lowerLip', 'lipLine']) spec.art.materials[key] = 'ff00ff';
    const actor = a.m.createCharacter({ id: doc.id, label: doc.label, ...spec });
    assert.equal(actor.sockets.mouth.point[1], 0);
    const pose = a.m.rig.pose(actor.rig, {}),
      model = actor.body.makePose(pose);
    checkLipRows({ body: actor.body, model, y: 0 }, base + ' ' + mouth);
    checkLipRows(a.m.faceLayers(actor, pose, model)[1], base + ' close-up ' + mouth);
  }
}
// Compare crown and eye-level diameters at matching heights on the same short haircut.
function crownRatios(doc) {
  const actor = a.l.build(doc),
    pose = a.m.rig.pose(actor.rig, {});
  const upper = a.m.faceLayers(actor, pose, actor.body.makePose(pose))[1];
  const { body, model } = upper;
  function diameters(height) {
    const z = Math.floor((height - upper.z) * body.density);
    let left = body.nx,
      right = -1,
      top = body.ny,
      bottom = -1;
    for (let y = 0; y < body.ny; y++)
      for (let x = 0; x < body.nx; x++) {
        if (!model.colors[(z * body.ny + y) * body.nx + x]) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    assert.ok(right >= left && bottom >= top);
    return [right - left + 1, bottom - top + 1];
  }
  const eye = a.m.rig.socket(actor, pose, 'leftEye')[2],
    mouth = a.m.rig.socket(actor, pose, 'mouth')[2];
  const base = diameters(eye);
  return diameters(eye + 1.35 * (eye - mouth)).map((extent, i) => extent / base[i]);
}
for (const base of ['adult', 'child']) {
  const doc = { ...current, base, parts: { ...current.parts, hair: 'crop', hat: 'none' } };
  const round = crownRatios({ ...doc, packs: { 'pine-core': a.l.collectionRelease } }),
    old = crownRatios({ ...doc, packs: { 'pine-core': a.l.hairRelease } });
  assert.ok(
    round.every((ratio, i) => ratio < old[i] - 0.04),
    base + ' crown should taper from both views'
  );
}
// Measure real occupied cells from the ear plane with the same pose, height and camera axes.
function headProfile(recipe) {
  const actor = a.l.build(recipe);
  const pose = a.m.rig.pose(actor.rig, {});
  const bodyGrid = actor.body.makePose(pose);
  const upper = a.m.faceLayers(actor, pose, bodyGrid)[1];
  const { body, model } = upper;
  const [cx, cz, rx, rz] = recipe.base === 'child' ? [0.38, 27.69, 3.98, 4.89] : [0.55, 40.1, 4.9, 5.82];
  const ear = a.m.rig.point(pose.head, [cx - 0.115 * rx, 0, cz]);
  function extent(h, cheek = false) {
    const z = Math.floor((ear[2] + rz * h - upper.z) * body.density);
    let rear = body.nx,
      front = -1;
    const cheekY = Math.floor(
      body.ny / 2 +
        (ear[1] + 0.54 * (recipe.base === 'child' ? 4.1 : 4.9) * recipe.shape.faceWidth - upper.y) *
          body.density
    );
    for (let y = cheek ? cheekY : 0; y < (cheek ? cheekY + 1 : body.ny); y++) {
      for (let x = 0; x < body.nx; x++) {
        if (model.colors[(z * body.ny + y) * body.nx + x]) {
          rear = Math.min(rear, x);
          front = Math.max(front, x);
        }
      }
    }
    assert.ok(front >= rear, recipe.id + ' empty profile section');
    return {
      rear: ear[0] - (upper.x + (rear - body.nx / 2) / body.density),
      front: upper.x + (front + 1 - body.nx / 2) / body.density - ear[0]
    };
  }
  return {
    middle: extent(0.17),
    upperBack: extent(0.42),
    cheek: extent(-0.17, true),
    nape: extent(-0.36),
    crown: (upper.z + model.bounds[5] / body.density - ear[2]) / rz,
    cell: 1 / body.density,
    actor,
    bodyGrid,
    fineGrid: model
  };
}
for (const [id, oldBodyHash, oldHeadHash, sculptBodyHash, sculptHeadHash] of [
  [
    'look_body_male',
    'f96d3c05bc74d4c229a3ae6fca7e355b3b994299152bea535773e84187fd3252',
    '379be5196bc19f68b70a899ecb0da714aea90157edc59ed49d766ab7dd4e8065',
    '35cd83623efeea22f3edf71f0d20834f9d442aa5e333e203b0a99bb44ae84b97',
    'a4aabbf2f1758a1764b289d93df70754ce90b16ff04ef0c10f9fc618d50d36bb'
  ],
  [
    'look_relay',
    '9128e0bd075881a00565cd97d08567100ddbb4c45f224cbb15353c1672e4b192',
    '68b1ed8a2c49522c1ff658a5f215e5d16f9e585abdb1ede61eee5748ac21465e',
    '3656d7057216acf5a8861b3af380e24b3613633c821b0d89278ee314c9388536',
    '5cfb4d94ad70aa46c402a354bcdc7597a163a01e3e24947ee389b544772f5e2d'
  ]
]) {
  const seed = a.l.templates.find((doc) => doc.id === id);
  const crop = {
    ...seed,
    packs: { 'pine-core': a.l.sculptRelease },
    shape: { ...seed.shape, height: 1 },
    parts: { ...seed.parts, hat: 'none', neck: 'none', hair: 'crop' }
  };
  const prior = { ...crop, packs: { 'pine-core': a.l.collectionRelease } };
  const archivedCrop = headProfile(prior);
  assert.equal(colorDigest(archivedCrop.bodyGrid.colors), oldBodyHash);
  assert.equal(colorDigest(archivedCrop.fineGrid.colors), oldHeadHash);
  const sculpted = headProfile(crop);
  assert.equal(colorDigest(sculpted.bodyGrid.colors), sculptBodyHash);
  assert.equal(colorDigest(sculpted.fineGrid.colors), sculptHeadHash);
  const baldRecipe = { ...crop, parts: { ...crop.parts, hair: 'bald' } };
  const bald = headProfile(baldRecipe);
  const oldBald = headProfile({ ...baldRecipe, packs: prior.packs });
  assert.ok(bald.crown > oldBald.crown + 0.09 && bald.crown < oldBald.crown + 0.21, id + ' crown rise');
  assert.ok(Math.abs(bald.upperBack.rear - bald.middle.rear) < bald.cell * 2.2, id + ' occipital bulge');
  for (const [before, after] of [
    [archivedCrop, sculpted],
    [oldBald, bald]
  ]) {
    const ratio = after.middle.rear / before.middle.rear;
    assert.ok(ratio > 0.6 && ratio < 0.85, id + ' rear contour at ear level');
    assert.ok(after.nape.rear < after.middle.rear * 0.85, id + ' nape should taper below the occiput');
  }
  const buzz = headProfile({ ...crop, parts: { ...crop.parts, hair: 'buzz' } });
  assert.ok(
    buzz.crown < bald.crown + 0.07 && sculpted.crown > buzz.crown + 0.12,
    id + ' short hair lost crown volume'
  );
  const withDepth = (depth) => ({ ...crop, shape: { ...crop.shape, occiput: depth } });
  const shallow = headProfile(withDepth(0.8)),
    deep = headProfile(withDepth(1.2));
  assert.ok(
    shallow.middle.rear < 0.88 * sculpted.middle.rear && deep.middle.rear > 1.12 * sculpted.middle.rear
  );
  for (const variant of [shallow, deep]) {
    assert.ok(
      Math.abs(variant.middle.front - sculpted.middle.front) <= Math.max(variant.cell, sculpted.cell)
    );
    assert.deepEqual(variant.actor.rig, sculpted.actor.rig);
    assert.deepEqual(variant.actor.sockets, sculpted.actor.sockets);
    assert.ok(
      Math.abs(variant.cheek.front - sculpted.cheek.front) <= Math.max(variant.cell, sculpted.cell),
      id + ' occipital control moved cheek'
    );
  }
  assert.ok(!Object.hasOwn(a.l.prepare(withDepth(1)).recipe.shape, 'occiput'));
  assert.equal(a.l.prepare(withDepth(0.8)).recipe.shape.occiput, 0.8);
  const oldCustom = { ...withDepth(0.8), packs: prior.packs };
  assert.equal(a.l.editingRelease(oldCustom), a.l.sculptRelease);
  assert.throws(() => a.l.prepare(oldCustom), /1\.9\.0/);
  assert.throws(() => a.l.prepare(withDepth(1.21)));
}
// Count occupied samples, ignoring every pigment. A painted stripe on skin adds zero volume.
function upperHead(recipe) {
  const actor = a.l.build(recipe),
    pose = a.m.rig.pose(actor.rig, {}),
    body = actor.body;
  const model = body.makePose(pose);
  const child = recipe.base === 'child',
    rz = child ? 4.89 : 5.82;
  const center = a.m.rig.point(pose.head, [child ? 0.38 : 0.55, 0, child ? 27.69 : 40.1]);
  const start = Math.floor((center[2] + 0.02 * rz) * body.density) * body.nx * body.ny;
  let cells = 0;
  for (let i = start; i < model.colors.length; i++) if (model.colors[i]) cells++;
  return { actor, pose, model, cells, templeZ: center[2] + 0.46 * rz };
}
function templeEdges({ actor, pose, model, templeZ }) {
  // Pin sampling pitch so a changed bounding box cannot masquerade as gained volume.
  const cut = a.m.rig.socket(actor, pose, 'mouth')[2] - actor.rig.height * 0.068;
  const band = actor.body.faceLayers(pose, model, cut, 4)[1],
    body = band.body;
  assert.equal(body.density, 4);
  const z = Math.floor((templeZ - band.z) * body.density);
  let min = body.ny,
    max = -1;
  for (let y = 0; y < body.ny; y++) {
    const row = (z * body.ny + y) * body.nx;
    if (band.model.colors.subarray(row, row + body.nx).some(Boolean)) {
      min = Math.min(min, y);
      max = y;
    }
  }
  assert.ok(max >= min);
  return [min, max].map((y) => y + band.y * body.density - body.ny / 2);
}
for (const id of ['look_body_male', 'look_relay']) {
  const seed = a.l.templates.find((d) => d.id === id);
  const recipe = (hair, pin = a.l.volumeRelease, hat = 'none') => ({
    ...seed,
    packs: { 'pine-core': pin },
    shape: { ...seed.shape, height: 1 },
    parts: { ...seed.parts, hair, hat, neck: 'none' }
  });
  const old = a.l.sculptRelease,
    cut = upperHead(recipe('crop')),
    bald = upperHead(recipe('bald'));
  const trims = Object.keys(a.l.hairGroups).filter(
    (hair) => a.l.hairGroups[hair] === '短发' && hair !== 'bald'
  );
  assert.equal(trims.length, 9);
  for (const hair of trims) {
    const current = hair === 'crop' ? cut : upperHead(recipe(hair));
    assert.ok(current.cells > 1.055 * upperHead(recipe(hair, old)).cells, id + ' ' + hair + ' volume');
  }
  const previous = templeEdges(upperHead(recipe('crop', old))),
    next = templeEdges(cut);
  assert.ok(previous[0] - next[0] >= 2 && next[1] - previous[1] >= 2, id + ' flat temple locks');
  for (const hair of ['bald', 'shoulder-length']) {
    assert.equal(
      colorDigest(upperHead(recipe(hair)).model.colors),
      colorDigest(upperHead(recipe(hair, old)).model.colors)
    );
  }
  const dyed = upperHead({ ...recipe('crop'), colors: { ...seed.colors, hair: '#c6b7a8' } });
  const mask = (sample) => colorDigest(Uint8Array.from(sample.model.colors, (color) => Number(!!color)));
  assert.equal(mask(dyed), mask(cut));
  assert.notEqual(colorDigest(dyed.model.colors), colorDigest(cut.model.colors));
  const worn = (hair) => upperHead(recipe(hair, a.l.volumeRelease, 'pine-core/sunhat')).cells;
  const underHat = worn('crop') - worn('bald');
  assert.ok(underHat > 0 && underHat < 0.15 * (cut.cells - bald.cells), id + ' hat compression');
}
// Probe three sagittal planes through the underside of the jaw in head coordinates.
// A gap bracketed by two solid runs exposed the background between the chin and throat.
function jawSampler(recipe, channels = {}) {
  const actor = a.l.build(recipe),
    pose = a.m.rig.pose(actor.rig, channels);
  const model = actor.body.makePose(pose);
  const child = recipe.base === 'child',
    [cx, cz, rx, ry, rz] = child ? [0.38, 27.69, 3.98, 4.1, 4.89] : [0.55, 40.1, 4.9, 4.9, 5.82];
  const center = a.m.rig.point(pose.head, [cx, 0, cz]);
  const band = actor.body.faceLayers(pose, model, center[2] - 1.45 * rz, 5)[1],
    body = band.body;
  const d = body.density;
  return (u, v, h) => {
    const p = a.m.rig.point(pose.head, [cx + u * rx, ry * recipe.shape.faceWidth * v, cz + h * rz]);
    const x = Math.floor((p[0] - band.x) * d + body.nx / 2),
      y = Math.floor((p[1] - band.y) * d + body.ny / 2),
      z = Math.floor((p[2] - band.z) * d);
    return Boolean(band.model.colors[(z * body.ny + y) * body.nx + x]);
  };
}
function jawGaps(recipe) {
  const solid = jawSampler(recipe);
  let gaps = 0;
  for (const h of [-0.96, -0.93, -0.9, -0.87, -0.84, -0.79, -0.755]) {
    for (const v of [0, 0.22, -0.39]) {
      let seen = false,
        empty = 0;
      for (let step = -12; step <= 39; step++) {
        if (solid(step / 36, v, h)) {
          if (empty >= 3) gaps++;
          seen = true;
          empty = 0;
        } else if (seen) empty++;
      }
    }
  }
  return gaps;
}
for (const id of ['look_body_male', 'look_relay']) {
  const seed = a.l.templates.find((doc) => doc.id === id);
  const face = {
    ...seed,
    shape: { ...seed.shape, height: 1 },
    parts: { ...seed.parts, neck: 'none', hat: 'none' }
  };
  const archived = { ...face, packs: { 'pine-core': a.l.volumeRelease } };
  assert.ok(jawGaps(archived) > 0, id + ' archived jaw must reproduce the gap');
  assert.equal(jawGaps(face), 0, id + ' disconnected chin');
  for (const [jaw, faceWidth, pitch] of [
    [0.8, 0.84, 0.27],
    [1.2, 1.16, -0.27]
  ]) {
    const sized = { ...face, shape: { ...face.shape, jaw, faceWidth } };
    // A ray grazing an oblique voxel surface can cross its staircase several times.
    // In a nod, probe the interior of the bridge from the throat to the back of the chin.
    const solid = jawSampler(sized, { headPitch: pitch, headYaw: 0.35 });
    for (const h of [-0.85, -0.81])
      for (const v of [-0.16, 0, 0.16])
        for (const u of [0.22, 0.33, 0.42, 0.5]) assert.ok(solid(u, v, h), id + ' posed jaw gap');
    const actor = a.l.build(sized),
      pose = a.m.rig.pose(actor.rig, { headPitch: pitch, headRoll: -0.12 });
    const band = a.m.faceLayers(actor, pose, actor.body.makePose(pose))[1];
    const throat = face.base === 'child' ? [0.38, 0, 27.69 - 1.02 * 4.89] : [0.55, 0, 40.1 - 1.02 * 5.82];
    assert.ok(
      band.body.density > actor.body.density && band.z <= a.m.rig.point(pose.head, throat)[2],
      id + ' detail seam crossed the lower jaw'
    );
  }
  const before = upperHead(archived),
    after = upperHead(face);
  const b = after.actor.body,
    start = b.nx * b.ny * Math.ceil(a.m.rig.socket(after.actor, after.pose, 'mouth')[2] * b.density);
  assert.equal(
    colorDigest(before.model.colors.subarray(start)),
    colorDigest(after.model.colors.subarray(start)),
    id + ' upper face or hair changed with chin'
  );
  for (const [key, socket] of Object.entries(before.actor.sockets))
    assert.deepEqual(after.actor.sockets[key], socket, key + ' keeps its rest-space contact');
}
// Look straight across the parted fringe. A strand on each side must stand
// physically forward of the exposed forehead, independent of its pigment.
for (const base of ['adult', 'child']) {
  const actor = a.l.build({
    ...adultSeed,
    base,
    gender: base === 'adult' ? 'female' : 'unspecified',
    parts: { ...adultSeed.parts, hair: 'shoulder-length', hat: 'none' }
  });
  const pose = a.m.rig.pose(actor.rig, {});
  const layer = a.m.faceLayers(actor, pose, actor.body.makePose(pose))[1];
  const { body, model } = layer,
    d = body.density;
  const eye = a.m.rig.socket(actor, pose, 'leftEye'),
    mouth = a.m.rig.socket(actor, pose, 'mouth');
  const foreheadZ = Math.floor((eye[2] + (eye[2] - mouth[2]) - layer.z) * d);
  const center = Math.floor(body.ny / 2 + (mouth[1] - layer.y) * d);
  const span = Math.round(Math.abs(eye[1] - mouth[1]) * d);
  const front = (y, z) => {
    const offset = (z * body.ny + y) * body.nx;
    let x = body.nx - 1;
    while (x >= 0 && !model.colors[offset + x]) x--;
    return x;
  };
  for (const side of [-1, 1]) {
    const crest = Math.max(
      ...Array.from({ length: span }, (_, i) => front(center + side * (i + 1), foreheadZ))
    );
    assert.ok(crest - front(center, foreheadZ) >= 2, base + ' parted locks lost their relief');
  }
  const lipZ = Math.floor((mouth[2] - layer.z) * d);
  const profileX = layer.x + (front(center, lipZ) + 1 - body.nx / 2) / d;
  assert.ok(Math.abs(profileX - mouth[0]) <= 1 / d, base + ' lip contact floats above the cheek surface');
  for (let z = lipZ - 2; z <= lipZ + 2; z++) {
    assert.ok(front(center, z) <= front(center, z + 1), base + ' raised lip ledge in profile');
  }
}
for (const base of ['adult', 'child']) {
  const actor = a.l.build({ ...current, base });
  const rest = a.m.rig.pose(actor.rig, {}),
    body = actor.body,
    model = body.makePose(rest);
  const [lower, upper] = a.m.faceLayers(actor, rest, model);
  assert.equal(
    lower.model.colors.buffer,
    model.colors.buffer,
    'the lower body should reuse its sampled pixels'
  );
  assert.equal(lower.body.nz / lower.body.density, upper.z, 'the two grids must meet at one height');
  assert.ok(upper.body.density > body.density);
  assert.ok(upper.body.nx * upper.body.ny * (upper.body.nz + 2) <= 480000, 'portrait sample budget');
  const [figureBody, figureHead] = a.m.figureLayers(actor, rest, model);
  const lowerGrid = figureBody.body;
  assert.ok(
    lowerGrid.density > body.density,
    base + ' full-body clothes and hands stayed at standard density'
  );
  assert.ok(lowerGrid.nx * lowerGrid.ny * (lowerGrid.nz + 4) <= 800000, 'full-body sample budget');
  assert.ok(
    Math.abs(figureBody.z + lowerGrid.nz / lowerGrid.density - figureHead.z) < 1e-7,
    'gap at the neck'
  );
  assert.deepEqual([figureHead.x, figureHead.y, figureHead.z], [upper.x, upper.y, upper.z]);
  assert.equal(
    colorDigest(figureHead.model.colors),
    colorDigest(upper.model.colors),
    base + ' face changed between cameras'
  );
  const closed = a.m.faceLayers(actor, { ...rest, blink: 1 }, model)[1];
  assert.ok(
    upper.model.colors.some((color, i) => color !== closed.model.colors[i]),
    base + ' blink'
  );

  const sip = a.m.actions.get('drink').sample(0.5, actor)[0].pose;
  const held = body.makePose(sip);
  const pouring = a.m.faceLayers(actor, sip, held)[1];
  const bare = a.m.faceLayers(actor, { ...sip, bottle: null }, held)[1];
  const lip = sip.bottle.lip,
    grid = pouring.body;
  let changedAtMouth = false;
  for (let i = 0; i < pouring.model.colors.length && !changedAtMouth; i++) {
    if (pouring.model.colors[i] === bare.model.colors[i]) continue;
    const x = pouring.x + ((i % grid.nx) + 0.5 - grid.nx / 2) / grid.density;
    const y = pouring.y + ((Math.floor(i / grid.nx) % grid.ny) + 0.5 - grid.ny / 2) / grid.density;
    const z = pouring.z + (Math.floor(i / (grid.nx * grid.ny)) + 0.5) / grid.density;
    changedAtMouth = Math.hypot(x - lip[0], y - lip[1], z - lip[2]) < 1.1;
  }
  assert.ok(changedAtMouth, base + ' bottle spout must be drawn at the mouth in close-up');
}
const jumper = a.l.build({
  ...adultSeed,
  parts: { ...adultSeed.parts, hair: 'long-waves' },
  shape: { ...adultSeed.shape, height: 1.3, shoulders: 1.35, arms: 1.25 }
});
const reach = a.m.actions.get('jump').sample(0.48, jumper)[0].pose;
const jumpBands = a.m.figureLayers(jumper, reach, jumper.body.makePose(reach));
assert.ok(
  jumpBands?.every((b) => b.body.density > jumper.body.density),
  'a wide jumping pose loses full-body detail'
);
const addedHair = ['shoulder-length', 'long-waves', 'half-up', 'twin-braids', 'side-part'];
const schemaHair = json('character-v1.schema.json').properties.parts.properties.hair.enum;
assert.deepEqual([...Object.keys(a.l.slots.hair)].sort(), schemaHair.sort());
for (const pin of [a.l.originalRelease, a.l.styleRelease, a.l.profileRelease, a.l.proportionRelease]) {
  const dye = { ...first, packs: { 'pine-core': pin }, colors: { ...first.colors, hair: '#795cb4' } };
  assert.equal(a.l.editingRelease(dye), pin);
  assert.equal(a.l.prepare(dye).recipe.colors.hair, '#795cb4');
  for (const hair of addedHair) {
    const styled = { ...dye, parts: { ...dye.parts, hair } };
    assert.equal(a.l.editingRelease(styled), a.l.hairRelease);
    assert.throws(() => a.l.prepare(styled));
  }
}
// A second dye identifies the actual hair pixels without relying on a preset color or face dimensions.
for (const base of ['adult', 'child']) {
  const doc = { ...current, base, parts: { ...first.parts, hair: 'shoulder-length' } };
  const person = a.l.build(doc);
  const other = a.l.build({ ...doc, colors: { ...doc.colors, hair: '#56a4de' } });
  const pose = a.m.rig.pose(person.rig, {}),
    body = person.body;
  const original = body.makePose(pose).colors,
    tinted = other.body.makePose(pose).colors;
  let front = 0,
    back = 0;
  for (let i = 0; i < original.length; i++) {
    if (original[i] === tinted[i]) continue;
    assert.ok(original[i] && tinted[i], 'dye changed hair geometry');
    const z = (Math.floor(i / (body.nx * body.ny)) + 0.5) / body.density;
    if (z >= person.rig.shoulder[2]) continue;
    if (i % body.nx >= body.nx / 2) front++;
    else back++;
  }
  assert.ok(front > 5 && back > 20, base + ' loose hair does not reach both sides of the shoulders');
}
assert.throws(() => a.l.prepare({ ...first, face: classic }));
assert.throws(() => a.l.prepare({ ...first, parts: { ...first.parts, hair: 'twin-tails' } }));
assert.throws(() => a.l.prepare({ ...current, face: { eyes: 'round' } }));
assert.throws(() => a.l.prepare({ ...current, face: { ...classic, eyes: 'unregistered' } }));
for (const base of ['child', 'adult']) {
  for (const [feature, choices] of Object.entries(a.l.features)) {
    const portraits = new Set();
    const silhouettes = new Set(),
      fineSilhouettes = new Set(),
      contactPoints = new Set();
    const drawings = new Set(
      Object.keys(choices).map((value) => {
        const person = a.l.build({ ...current, base, face: { ...classic, [feature]: value } });
        const drinking = a.m.actions.get('drink').sample(0.5, person)[0].pose;
        assert.ok(distance(a.m.rig.socket(person, drinking, 'mouth'), drinking.bottle.lip) < 1e-7);
        const rest = a.m.actions.get('idle').sample(0.31, person)[0].pose;
        const model = person.body.makePose(rest);
        const close = a.m.faceLayers(person, rest, model)[1].model;
        portraits.add(colorDigest(close.colors));
        if (feature === 'mouth') {
          const occupied = (grid) => colorDigest(Uint8Array.from(grid.colors, (c) => Number(c !== 0)));
          silhouettes.add(occupied(model));
          fineSilhouettes.add(occupied(close));
          contactPoints.add(JSON.stringify(person.sockets.mouth.point));
        }
        return colorDigest(model.colors);
      })
    );
    assert.equal(drawings.size, Object.keys(choices).length, base + ' · ' + feature);
    assert.equal(portraits.size, Object.keys(choices).length, base + ' close-up · ' + feature);
    if (feature === 'mouth') {
      assert.equal(silhouettes.size, 1, base + ' lips add volume to the face');
      assert.equal(fineSilhouettes.size, 1, base + ' close-up lips add volume to the face');
      assert.equal(contactPoints.size, 1, base + ' lip style moved the bottle contact');
    }
  }
  for (const [slot, choices] of Object.entries(a.l.slots)) {
    const drawings = new Set(
      Object.keys(choices).map((value) =>
        digest(a.l.build({ ...current, base, parts: { ...first.parts, [slot]: value } }), a.m)
      )
    );
    assert.equal(drawings.size, Object.keys(choices).length, base + ' · ' + slot);
  }
}
const examples = ['chorus-child', 'relay-child'].map((name) => json('packs/' + name + '.json')),
  empty = client();
for (const doc of examples) {
  const edited = a.l.templates.find((p) => p.id === doc.id);
  assert.deepEqual(clone(a.l.prepare(asPriorStyle(edited)).recipe), doc);
  assert.equal(digest(a.l.build(asPriorStyle(edited)), a.m), digest(a.l.build(doc), a.m));
  assert.ok(a.l.hasRoundedHead(edited));
  assert.deepEqual(clone(empty.w.importCharacter(doc).recipe), doc);
}
const savedScore = empty.w.scoreFile({
  version: 1,
  loop: true,
  steps: [{ action: 'highfive', actors: examples.map((p) => p.id) }]
});
const clean = client(),
  both = clean.w.readScoreFile(clone(savedScore)).sample(1.4);
assert.ok(distance(both[0].contacts.palm, both[1].contacts.palm) < 0.01);
for (const doc of examples)
  assert.equal(digest(clean.m.characters.get(doc.id), clean.m, 'run'), digest(a.l.build(doc), a.m, 'run'));
const referenceModels = ['female', 'male'].map((gender) => json('packs/' + gender + '-adult.json'));
const [female, male] = referenceModels.map((doc) => {
  const template = a.l.templates.find((p) => p.id === doc.id);
  assert.deepEqual(clone(a.l.prepare({ ...template, packs: doc.packs }).recipe), doc);
  const person = a.l.build(doc);
  assert.equal(person.gender, doc.gender);
  assert.deepEqual(clone(person.tags), ['adult']);
  assert.deepEqual(
    [...a.m.actions.values()].filter((clip) => a.m.accepts(clip, 0, person)).map((clip) => clip.id),
    [...a.m.findActions(a.m.characters.get(person.tags.includes('adult') ? 'surveyor' : 'child'))].map(
      (clip) => clip.id
    )
  );
  return person;
});
assert.deepEqual(referenceModels[0].parts, referenceModels[1].parts);
assert.deepEqual(referenceModels[0].shape, referenceModels[1].shape);
assert.deepEqual(referenceModels[0].colors, referenceModels[1].colors);
assert.equal(female.rig.height, male.rig.height);
assert.ok(female.rig.shoulder[1] < male.rig.shoulder[1]);
assert.ok(female.rig.hip[1] > male.rig.hip[1]);
assert.notEqual(digest(female, a.m), digest(male, a.m));
const unmarked = asPriorStyle(referenceModels[0]);
assert.ok(!Object.hasOwn(a.l.prepare(unmarked).recipe, 'gender'));
assert.equal(a.l.bodyProfileOf(unmarked), null);
assert.equal(
  digest(a.l.build(unmarked), a.m),
  digest(a.l.build({ ...unmarked, packs: { 'pine-core': a.l.hairRelease }, gender: 'unspecified' }), a.m)
);
for (const version of [a.l.originalRelease, a.l.styleRelease]) {
  assert.throws(() => a.l.prepare({ ...first, packs: { 'pine-core': version }, gender: 'female' }));
}
for (const gender of ['female', 'male', 'unknown', null]) {
  assert.throws(() => a.l.prepare({ ...current, base: 'child', gender }));
}
const fromHat = a.l.withBodyProfile(second, 'female'),
  childAgain = a.l.withBodyProfile(fromHat, 'child');
assert.equal(fromHat.id, second.id);
assert.equal(fromHat.packs['pine-core'], a.l.profileRelease);
assert.equal(fromHat.packs['creek-hats'], second.packs['creek-hats']);
for (const k of ['parts', 'colors', 'shape', 'embeddedPacks']) {
  assert.deepEqual(clone(fromHat[k]), second[k]);
  assert.notEqual(fromHat[k], second[k]);
}
assert.equal(childAgain.gender, 'unspecified');
assert.equal(digest(a.l.build(childAgain), a.m), digest(a.l.build(second), a.m));
assert.equal(a.l.bodyProfileOf(childAgain), 'child');
assert.throws(() => a.l.withBodyProfile(first, 'invalid'));
const wide = a.l.withBodyProfile(
  {
    ...second,
    id: 'look_short_arms',
    shape: { ...second.shape, height: 0.75, shoulders: 1.35, arms: 0.8, legs: 0.8 }
  },
  'male'
);
assert.equal(wide.packs['pine-core'], a.l.proportionRelease);
const standard = a.l.build({
  ...wide,
  shape: Object.fromEntries(Object.entries(a.l.shape).map(([k, v]) => [k, v[2]]))
});
const short = a.l.build(wide);
for (const [actual, expected] of [
  [short.rig.height / standard.rig.height, 0.75],
  [short.rig.shoulder[1] / standard.rig.shoulder[1], 0.75 * 1.35],
  [short.rig.upperArm / standard.rig.upperArm, 0.75 * 0.8],
  [short.rig.thigh / standard.rig.thigh, 0.75 * 0.8]
])
  assert.ok(Math.abs(actual - expected) < 1e-9);
const s = short.rig.height / 50;
let phoneFrame, keysFrame;
for (const u of [0.27, 0.43, 0.5, 0.68, 0.79]) {
  const phone = a.m.actions.get('phone').sample(u, short)[0].pose,
    screen = phone.props[0].frame;
  const tau = 2 * Math.PI,
    swipe = Math.sin(tau * u * 2.5);
  const tap = [(-1.25 + 0.72 * Math.sin(tau * u * 5)) * s, (-0.24 + 0.75 * swipe) * s, 0.6 * s * swipe];
  assert.ok(distance(phone.arms[0].hand, a.m.rig.point(screen, tap)) < 1e-6);
  const typing = a.m.actions.get('type').sample(u, short)[0].pose,
    keyboard = typing.props[1].frame;
  typing.arms.forEach((arm, i) => {
    const key = [
      (0.7 + 0.65 * Math.sin(tau * u * 3 + i)) * s,
      (i ? 1 : -1) * (2.8 + 0.72 * Math.cos(tau * u * 2 + i)) * s,
      (1.3 + 0.6 * Math.sin(tau * (u * (i ? 7 : 9) + i * 0.27))) * s
    ];
    assert.ok(distance(arm.hand, a.m.rig.point(keyboard, key)) < 1e-6);
  });
  if (phoneFrame) {
    assert.deepEqual(screen, phoneFrame);
    assert.deepEqual(keyboard, keysFrame);
  }
  phoneFrame = screen;
  keysFrame = keyboard;
}
const longHaired = a.l.withBodyProfile(
  {
    ...wide,
    parts: { ...wide.parts, hair: 'long-waves' },
    colors: { ...wide.colors, hair: '#8058a6' }
  },
  'male'
);
assert.equal(longHaired.packs['pine-core'], a.l.hairRelease);
const castDocs = [...referenceModels, childAgain, longHaired],
  profilesClient = client(),
  audience = client();
for (const doc of castDocs) profilesClient.w.save(doc);
const profileScore = {
  version: 1,
  loop: true,
  steps: [
    { action: 'drink', actors: [female.id] },
    { action: 'run', actors: [male.id] },
    { action: 'highfive', actors: [female.id, male.id] },
    { action: 'highfive', actors: [male.id, childAgain.id] },
    { action: 'type', actors: [longHaired.id] }
  ]
};
const restoredProfiles = audience.w.readScoreFile(clone(profilesClient.w.scoreFile(profileScore)), true);
for (const doc of castDocs) {
  assert.equal(audience.w.saved.get(doc.id).gender, doc.gender);
  assert.deepEqual(clone(audience.w.saved.get(doc.id).shape), clone(doc.shape));
  assert.deepEqual(clone(audience.w.saved.get(doc.id).packs), clone(doc.packs));
  assert.deepEqual(clone(audience.w.saved.get(doc.id).parts), clone(doc.parts));
  assert.deepEqual(clone(audience.w.saved.get(doc.id).colors), clone(doc.colors));
  assert.equal(
    digest(audience.m.characters.get(doc.id), audience.m, 'run'),
    digest(a.l.build(doc), a.m, 'run')
  );
  const person = audience.m.characters.get(doc.id),
    pose = a.m.actions.get('drink').sample(0.5, person)[0].pose;
  assert.ok(distance(a.m.rig.socket(person, pose, 'mouth'), pose.bottle.lip) < 1e-7);
}
for (const i of [2, 3]) {
  const [lead, partner] = restoredProfiles.sample(
    restoredProfiles.starts[i] + restoredProfiles.score.steps[i].seconds / 2
  );
  assert.ok(distance(lead.contacts.palm, partner.contacts.palm) < 0.01);
}
// Portable workshop outfits share the existing mannequin and clip contact points.
const wardrobeSchema = json('character-v1.schema.json').properties;
for (const id of ['look_body_female', 'look_relay']) {
  const doc = a.l.templates.find((p) => p.id === id);
  const prior = { ...doc, packs: { 'pine-core': a.l.contourRelease } };
  const wardrobe = { ...doc, packs: { 'pine-core': a.l.wardrobeRelease } };
  assert.equal(digest(a.l.build(wardrobe), a.m, 'run'), digest(a.l.build(prior), a.m, 'run'));
}
const surveyExample = json('packs/workshop-surveyor.json');
const surveyTemplate = a.l.templates.find((p) => p.id === surveyExample.id);
assert.deepEqual(clone(a.l.prepare({ ...surveyTemplate, packs: surveyExample.packs }).recipe), surveyExample);
for (const [slot, options] of Object.entries(a.l.wearables)) {
  assert.deepEqual([...Object.keys(options)].sort(), [...wardrobeSchema.parts.properties[slot].enum].sort());
  const action = slot === 'phone' ? 'phone' : slot === 'laptop' ? 'type' : 'idle';
  for (const base of ['child', 'adult']) {
    const plain = { ...current, base };
    const unadorned = digest(a.l.build(plain), a.m, action);
    const seen = new Set([unadorned]);
    for (const value of Object.keys(options)) {
      const doc = { ...plain, parts: { ...plain.parts, [slot]: value } };
      const person = a.l.build(doc);
      seen.add(digest(person, a.m, action));
      if (slot === 'phone' || slot === 'laptop') {
        assert.equal(digest(person, a.m), digest(a.l.build(plain), a.m), slot + ' appeared during idle');
      }
      assert.throws(() => a.l.prepare({ ...doc, packs: { 'pine-core': a.l.contourRelease } }));
    }
    assert.equal(seen.size, Object.keys(options).length + 1, base + ' ' + slot + ' visuals');
    assert.throws(() => a.l.prepare({ ...plain, parts: { ...plain.parts, [slot]: 'absent-style' } }));
  }
}
// Optional portrait layers share the pinned schema and remain independently visible on both bases.
function finePortrait(doc) {
  const actor = a.l.build(doc),
    pose = a.m.rig.pose(actor.rig, {});
  return colorDigest(a.m.faceLayers(actor, pose, actor.body.makePose(pose))[1].model.colors);
}
for (const base of ['adult', 'child']) {
  const plain = { ...current, base, face: { ...classic }, parts: { ...current.parts, hair: 'crop' } };
  const neutral = finePortrait(plain);
  const hats = a.l.catalog.get(a.l.core + '@' + a.l.release).parts;
  const capped = new Set([neutral]);
  for (const hat of hats) {
    const recipe = { ...plain, parts: { ...plain.parts, hat: a.l.core + '/' + hat.id } };
    const drawing = finePortrait(recipe);
    assert.ok(!capped.has(drawing), base + ' headwear ' + hat.id);
    capped.add(drawing);
  }

  for (const [slot, choices] of Object.entries(a.l.faceDetails)) {
    assert.deepEqual(Object.keys(choices).sort(), [...wardrobeSchema.face.properties[slot].enum].sort());
    const samples = new Map([[neutral, 'original']]);
    for (const value of Object.keys(choices)) {
      const recipe = { ...plain, face: { ...plain.face, [slot]: value } };
      assert.equal(
        a.l.editingRelease({ ...recipe, packs: { 'pine-core': a.l.wardrobeRelease } }),
        a.l.collectionRelease
      );
      assert.throws(() => a.l.prepare({ ...recipe, packs: { 'pine-core': a.l.wardrobeRelease } }));
      const painted = finePortrait(recipe);
      assert.ok(!samples.has(painted), base + ' ' + slot + '/' + value + ' matches ' + samples.get(painted));
      samples.set(painted, value);
    }
  }
}
const collectionExample = json('packs/style-reader.json');
assert.deepEqual(
  clone(
    a.l.prepare({
      ...a.l.templates.find((doc) => doc.id === collectionExample.id),
      packs: collectionExample.packs
    }).recipe
  ),
  collectionExample
);
const dyedFace = {
  ...collectionExample,
  parts: { ...current.parts, hair: 'crop' },
  face: {
    ...classic,
    eyes: 'upturned',
    brows: 'angled',
    facialHair: 'beard',
    makeup: 'blush',
    iris: 'sunburst'
  }
};
const undyed = finePortrait(dyedFace);
for (const key of Object.keys(a.l.portraitColors)) {
  const recipe = { ...dyedFace, colors: { ...dyedFace.colors, [key]: '#176ebe' } };
  assert.notEqual(finePortrait(recipe), undyed, key + ' portrait dye');
  assert.throws(() => a.l.prepare({ ...recipe, colors: { ...recipe.colors, [key]: 'invalid' } }));
}
assert.equal(a.l.editingRelease(surveyExample), a.l.wardrobeRelease);
const archivedSurvey = { ...surveyTemplate, packs: surveyExample.packs };
assert.equal(finePortrait(archivedSurvey), finePortrait(surveyExample));
assert.equal(digest(a.l.build(archivedSurvey), a.m, 'run'), digest(a.l.build(surveyExample), a.m, 'run'));
const dressed = clone(a.l.templates.find((d) => d.id === 'look_workshop_hiker'));
Object.assign(dressed.parts, {
  charm: 'jade',
  glasses: 'round',
  wrist: 'watch',
  ears: 'hoops',
  phone: 'rugged',
  laptop: 'field',
  hairAccessory: 'ribbon',
  audio: 'earbuds',
  belt: 'utility',
  brooch: 'rosette',
  gloves: 'fingerless'
});
for (const key of Object.keys(a.l.gearColors)) {
  assert.ok(wardrobeSchema.colors.properties[key]);
  const doc = { ...dressed, colors: { ...dressed.colors, [key]: '#20a6fb' } };
  const action = key === 'device' ? 'type' : 'idle';
  assert.notEqual(digest(a.l.build(doc), a.m, action), digest(a.l.build(dressed), a.m, action), key + ' dye');
  assert.throws(() => a.l.prepare({ ...doc, colors: { ...doc.colors, [key]: 'invalid' } }));
}
dressed.parts.hair = 'fishtail';
dressed.face = { ...dyedFace.face, outline: 'heart', complexion: 'freckles' };
dressed.colors.leftEye = '#698fa3';
const { recipe: beforeWear } = a.l.prepare(dressed);
const custom = a.l.applyOutfit(clone(beforeWear), a.l.workshopOutfits.mother);
assert.deepEqual(custom.shape, clone(beforeWear.shape));
assert.deepEqual(custom.face, clone(beforeWear.face));
assert.equal(custom.parts.hair, beforeWear.parts.hair);
assert.equal(custom.parts.bag, undefined);
assert.equal(custom.parts.laptop, 'field');
const cleaned = a.l.applyOutfit(clone(second), a.l.workshopOutfits.surveyor);
assert.equal(cleaned.embeddedPacks, undefined);
assert.deepEqual(Object.keys(cleaned.packs), ['pine-core']);
assert.equal(a.l.prepare(cleaned).recipe.parts.hat, 'pine-core/survey-hat');
const wardrobeAudience = client();
const clothesScore = {
  version: 1,
  loop: true,
  steps: [
    { action: 'drink', actors: [dressed.id] },
    { action: 'highfive', actors: [dressed.id, cleaned.id] },
    { action: 'type', actors: [dressed.id] }
  ]
};
const reloaded = wardrobeAudience.w.readScoreFile(
  clone(a.w.scoreFile(clothesScore, [dressed, cleaned])),
  true
);
const replica = wardrobeAudience.m.characters.get(dressed.id);
assert.deepEqual(clone(wardrobeAudience.w.saved.get(dressed.id)), clone(beforeWear));
assert.equal(digest(replica, a.m, 'run'), digest(a.l.build(dressed), a.m, 'run'));
const [greetA, greetB] = reloaded.sample(reloaded.starts[1] + reloaded.score.steps[1].seconds / 2);
assert.ok(distance(greetA.contacts.palm, greetB.contacts.palm) < 0.01);
for (const u of [0, 0.48, 1]) {
  const pose = a.m.actions.get('drink').sample(u, replica)[0].pose;
  assert.ok(
    distance(pose.bottle.lip, a.m.rig.socket(replica, pose, u === 0.48 ? 'mouth' : 'bottleDock')) < 1e-7
  );
}
const noHat = { ...dressed, parts: { ...dressed.parts, hat: 'none' } };
const spec = a.painter.build(noHat);
const fitted = a.m.createCharacter({ id: 'look_dock', label: '水壶', ...spec });
const resting = a.m.actions.get('run').sample(0.31, fitted)[0].pose;
const carry = spec.art.carriedBottle(resting);
assert.equal(poseDigest(fitted, resting), poseDigest(fitted, { ...resting, bottle: carry }));
spec.art.carriedBottle = () => null;
assert.notEqual(poseDigest(fitted, resting), poseDigest(fitted, { ...resting, bottle: carry }));
spec.art.carriedBottle = () => {
  throw Error('drew a second bottle during the drinking clip');
};
assert.doesNotThrow(() => digest(fitted, a.m, 'drink', 0.5));
const visitor = client();
const visit = visitor.w.readScoreFile(json('packs/weekend-visit.json'), true);
assert.deepEqual([...visitor.w.saved.keys()].sort(), ['look_style_gardener', 'look_style_runner']);
assert.equal(visit.score.steps.length, 6);
assert.ok(visit.score.loop);
const pairStep = visit.score.steps.findIndex((step) => step.action === 'hold-hands');
const holding = visit.sample(visit.starts[pairStep] + visit.score.steps[pairStep].seconds / 2);
assert.deepEqual(
  Array.from(holding, (actor) => actor.character),
  ['look_style_gardener', 'look_style_runner']
);
assert.ok(distance(holding[0].contacts.palm, holding[1].contacts.palm) < 1e-6);
assert.deepEqual(
  clone(visitor.w.scoreFile(visit.score).characters),
  json('packs/weekend-visit.json').characters
);
console.log(
  'PineLooks core ' + a.l.release + ' · 历代存档、全身与五官精度、头型与唇线、扩展体型、发型及双人复演通过'
);
console.log(
  'PineLooks v1 · 角色跨环境像素一致 · 穿搭、随身物、独立脸部细节与染色通过 · 双基型戴帽与喝水通过 · ' +
    pairings +
    ' 组击掌 · 编排导入、版本和存档冲突通过'
);
