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
  'studio-props',
  'studio-rig',
  'studio-actions',
  'duet-clips',
  'studio-library',
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
  return { m: c.PineMotion, l: c.PineLooks, w: c.PineWardrobe, disk };
}
function digest(person, motion, action = 'idle', phase = 0.31) {
  const e = motion.actions.get(action).sample(phase, person)[0];
  const model = person.body.makePose(e.pose);
  assert.ok(model.bounds[3] > model.bounds[0] && model.bounds[5] > model.bounds[2]);
  return createHash('sha256').update(Buffer.from(model.colors.buffer)).digest('hex');
}
const a = client(),
  hat = json('packs/creek-hats.json'),
  first = json('packs/creek-child.json'),
  second = json('packs/maple-child.json');
assert.equal(a.m.characters.size, 6);
assert.equal(a.l.catalog.size, 2);
assert.equal(a.l.prepare(second).recipe.baseNotice, read('LICENSE').trimEnd());
assert.equal(second.embeddedPacks[0].notice, read('LICENSE').trimEnd());
assert.deepEqual(clone(a.l.manifest(hat)), clone(a.l.manifest(second.embeddedPacks[0])));
assert.ok(a.w.save(first).persistent);
assert.ok(a.w.save(second).persistent);
assert.equal(a.w.saved.size, 2);
assert.equal(a.m.characters.size, 8);
const b = client(a.disk);
assert.equal(b.w.hydrate(), 0);
assert.equal(b.m.characters.size, 8);
for (const doc of [first, second]) {
  assert.equal(
    digest(a.m.characters.get(doc.id), a.m, 'run'),
    digest(b.m.characters.get(doc.id), b.m, 'run')
  );
  assert.deepEqual(clone(a.w.saved.get(doc.id)), clone(b.w.saved.get(doc.id)));
}
assert.notEqual(digest(a.m.characters.get(first.id), a.m), digest(a.m.characters.get(second.id), a.m));
const baseline = digest(a.l.build(first), a.m);
for (const [key, values] of Object.entries(a.l.shape)) {
  const doc = clone(first);
  doc.shape[key] = values[0];
  assert.notEqual(digest(a.l.build(doc), a.m), baseline, key + ' changes sampled pixels');
  doc.shape[key] = values[1] + 0.01;
  assert.throws(() => a.l.build(doc));
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
    const doc = clone(first);
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
    assert.equal([...a.m.actions.values()].filter((clip) => a.m.accepts(clip, 0, plain)).length, 13);
    const drink = a.m.actions.get('drink').sample(0.5, plain)[0].pose;
    assert.ok(distance(a.m.rig.socket(plain, drink, 'mouth'), drink.bottle.lip) < 1e-7);
    for (const action of ['run', 'jump', 'drink', 'phone', 'type']) {
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
assert.equal(corrupt.m.characters.size, 6);
assert.equal(corrupt.l.catalog.size, 2);
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
assert.equal(garbage.m.characters.size, 6);
// Frozen images from core 1.0.0 catch changes to old art even if both import and export change together.
assert.deepEqual(clone(a.l.prepare(first).recipe), first);
assert.deepEqual(clone(a.l.prepare(second).recipe), second);
const archived = [
  [first, 'e47e0e446e167d0613115204817ccde8461ddb9de804563dec6359313808fb6a'],
  [second, '8951ad26dc67bfe486d3e0abe082d3fc7cae7c7fac7777e816432db9f3485352'],
  [
    a.l.templates.find((p) => p.id === 'look_ridge'),
    '0569981e7d8ff0c5b2decb9ac9175b9d32cc4cdd5e69317c35bb20bc05d85827'
  ]
];
for (const [doc, expected] of archived) assert.equal(digest(a.l.build(doc), a.m), expected, doc.id);
const current = { ...first, packs: { 'pine-core': a.l.release } },
  classic = a.l.facePresets.classic.face;
assert.equal(digest(a.l.build(current), a.m), baseline);
assert.throws(() => a.l.prepare({ ...first, face: classic }));
assert.throws(() => a.l.prepare({ ...first, parts: { ...first.parts, hair: 'twin-tails' } }));
assert.throws(() => a.l.prepare({ ...current, face: { eyes: 'round' } }));
assert.throws(() => a.l.prepare({ ...current, face: { ...classic, eyes: 'unregistered' } }));
for (const base of ['child', 'adult']) {
  for (const [feature, choices] of Object.entries(a.l.features)) {
    const drawings = new Set(
      Object.keys(choices).map((value) => {
        const person = a.l.build({ ...current, base, face: { ...classic, [feature]: value } });
        const drinking = a.m.actions.get('drink').sample(0.5, person)[0].pose;
        assert.ok(distance(a.m.rig.socket(person, drinking, 'mouth'), drinking.bottle.lip) < 1e-7);
        return digest(person, a.m);
      })
    );
    assert.equal(drawings.size, Object.keys(choices).length, base + ' · ' + feature);
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
  assert.deepEqual(clone(a.l.prepare(a.l.templates.find((p) => p.id === doc.id)).recipe), doc);
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
console.log('PineLooks core ' + a.l.release + ' · 两代存档、四组五官、七种发型、全部服饰和双人复演通过');
console.log(
  'PineLooks v1 · 两个独立形象跨环境像素一致 · 8 项形体、5 组款式、7 色槽 · 双基型戴帽与喝水通过 · ' +
    pairings +
    ' 组击掌 · 编排导入、版本和存档冲突通过'
);
