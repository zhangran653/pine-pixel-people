// Run with Node. Use the same script order, slice painter and Three adapter as the editors.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { resolve } = require('node:path');
const vm = require('node:vm');
const read = (name) => readFileSync(resolve(__dirname, '..', name), 'utf8');
const context = vm.createContext({ structuredClone });
for (const [, file] of read('figure-study.html').matchAll(/<script defer src="([^"]+)"/g)) {
  if (!['workspace.js', 'figure-study.js'].includes(file))
    vm.runInContext(read(file), context, { filename: file });
}
const looks = context.PineLooks,
  motion = context.PineMotion;
const { examples, surfaces, scalps, styles } = vm.runInContext(
  '({examples:pineFigureModels,surfaces:pineGameFace,scalps:pineHeadShape,styles:pinePortraitStyles})',
  context
);
const digest = (cells) => createHash('sha256').update(cells).digest('hex');
const toPlain = (obj) => JSON.parse(JSON.stringify(obj));

async function check() {
  const cast = (await import('../pine-three.mjs')).createPineCast(
    await import('../vendor/three-r187/three.module.js'),
    motion,
    { detail: 'figure' }
  );
  const distinct = new Set();
  for (const base of ['adult', 'child', 'toddler', 'baby']) {
    const first = looks.randomCharacter({ base, release: looks.gameFaceRelease, seed: 2718 });
    for (let seed = 0; seed < 32; seed++) {
      const options = { base, release: looks.gameFaceRelease, seed };
      const doc = looks.randomCharacter(options);
      assert.deepEqual(looks.randomCharacter(options), doc);
      assert.deepEqual(looks.prepare(toPlain(doc)).recipe.face, doc.face);
      if (base === 'baby') assert.ok(['balanced', 'round'].includes(doc.face.form));
    }
    const old = looks.withFigureStudy(first);
    assert.equal(old.packs[looks.core], looks.structureStudyRelease);
    assert.equal(old.anatomyParts.skull, first.face.form);
    assert.ok(!Object.hasOwn(old.face, 'form'));
    for (const key of ['parts', 'colors', 'shape']) assert.deepEqual(old[key], first[key]);
    assert.throws(() => looks.prepare({ ...first, packs: { [looks.core]: looks.structureStudyRelease } }));
    assert.throws(() => looks.prepare({ ...first, face: { ...first.face, form: 'missing' } }));
    const ref = examples[base] || looks.withBodyProfile(examples.child, base);
    const doc = looks.withGameFace(ref);
    const kind = base === 'toddler' ? 'child' : base;
    const eye = base === 'baby' ? -0.13 : 0.13,
      mouth = base === 'baby' ? -0.577 : -0.42;
    const geometry = (target, formMix = 1) =>
      surfaces.model(
        base,
        doc.shape,
        { ...doc.face, formMix },
        target,
        scalps.scalp(kind, true),
        eye,
        mouth,
        styles.noses[doc.face.nose] || styles.basicNoses[doc.face.nose]
      );
    const profiles = new Set();
    for (const form of Object.keys(looks.gameFaceForms)) {
      const model = geometry(form);
      assert.equal(model, geometry(form), 'identical shapes must reuse the cached surface');
      const jaw = model.row(-0.72),
        mouthRow = model.row(mouth);
      profiles.add([jaw.width, jaw.fore, jaw.axis].join('/'));
      assert.ok(model.row(model.tip).face[0] > mouthRow.face[0], base + ' nose clears lips');
      assert.ok(mouthRow.face[0] - model.frontAt(mouthRow, 0.37) > 0.05, base + ' mouth turns in profile');
      assert.ok(model.row(-1).width < 0.001 && model.row(1).width < 0.001, base + ' closed chin and crown');
      for (const h of [-0.85, -0.45, 0, 0.33, 0.71]) {
        const r = model.row(h),
          y = 0.52 * r.width,
          x = model.frontAt(r, 0.52);
        assert.ok(model.insideSkin(r, x - 0.001, y) && !model.insideSkin(r, x + 0.001, y));
        assert.ok(Math.abs(model.frontAt(r, -0.52) - x) < 1e-8);
        assert.ok([...r.face].every(Number.isFinite));
      }
    }
    assert.equal(profiles.size, 4, base + ' has distinct authored forms');
    const width = (form, weight) => geometry(form, weight).row(-0.68).width;
    const standard = width('balanced', 1),
      half = width('round', 0.5),
      full = width('round', 1);
    assert.equal(width('round', 0), standard);
    assert.ok(standard < half && half < full, base + ' editable weight interpolates the jaw');
    assert.throws(() => looks.prepare({ ...doc, face: { ...doc.face, formMix: 1.1 } }));
    const actor = looks.build(doc);
    motion.characters.set(actor.id, actor);
    const clip = motion.actions.get(base === 'baby' ? 'baby-reach' : 'wave');
    const entries = clip.sample(0.32, actor);
    cast.setFrame(entries);
    const face = cast.group.getObjectByName(actor.id + '/face');
    assert.ok(face.visible && face.geometry.drawRange.count > 0);
    const neutral = motion.actions.get('idle').sample(0.17, actor)[0].pose;
    if (base === 'baby') {
      const prior = looks.build(looks.withFigureStudy(ref));
      const oldPose = motion.actions.get('idle').sample(0.17, prior)[0].pose;
      neutral.arms.forEach(({ hand }, i) =>
        assert.ok(hand[2] < oldPose.arms[i].hand[2], 'lower palms at rest')
      );
      neutral.feet.forEach((foot) => assert.equal(foot[2], actor.rig.ankle));
    }
    const model = actor.body.makePose(neutral),
      changed = looks.build({ ...doc, face: { ...doc.face, form: 'angular' } });
    const alternate = changed.body.makePose(neutral);
    assert.notEqual(digest(model.colors), digest(alternate.colors), 'form changes actual body cells');
    const recolored = looks.build({ ...doc, colors: { ...doc.colors, skin: '#683d31', eyes: '#527c8e' } });
    const dyed = recolored.body.makePose(neutral);
    assert.notEqual(digest(model.colors), digest(dyed.colors), 'dyes change sampled pigments');
    const mask = (pixels) => {
      const data = Buffer.allocUnsafe(pixels.length);
      for (let i = 0; i < pixels.length; i++) data[i] = pixels[i] ? 1 : 0;
      return digest(data);
    };
    assert.equal(mask(model.colors), mask(dyed.colors), 'dyes preserve the same silhouette');
    const shut = actor.body.makePose({ ...neutral, blink: 1 });
    assert.notEqual(digest(model.colors), digest(shut.colors), 'eyelids close on the live character');
    distinct.add(digest(model.colors));
  }
  cast.dispose();
  assert.equal(distinct.size, 4);
  console.log(
    'Four ages, 16 authored faces, 128 replayed recipes, mouth profiles, blinks, independent dyes, grounded infant rest and four Three.js face meshes passed'
  );
}
check().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
