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
function mask(pixels) {
  const data = Buffer.allocUnsafe(pixels.length);
  for (let i=0; i<pixels.length; i++) data[i] = pixels[i] ? 1 : 0;
  return digest(data);
}
// Actual 1.19.3 native body cells from e0249ba, before the new opt-in painter.
const archived = {
  adult:'a691c0d0394ed2d577d0d37ffd78f1bdc5cefd9f695251e461e4239c4580cbba',
  child:'82321edc434701a21fee0e745ad64e3afbf74138ed2670657a0aa50a56057775',
  toddler:'818377b3b4606af831edf736e56788195c5def979b067f88b61aa10f7c440641',
  baby:'352b2cc62dd20fe7e9aea1865107bc637f896e6d4b96678869a8e95512556a88'
};
function checkDrawn(base, ref, cast) {
  const pinned = looks.withGameFace(base === 'toddler' ? looks.withBodyProfile(examples.child,base) : ref);
  pinned.face.form = 'angular'; pinned.bodyFinish = 'painted';
  const old = looks.build(pinned), idle = motion.actions.get('idle');
  assert.equal(digest(old.body.makePose(idle.sample(.17,old)[0].pose).colors),archived[base]);
  const neutral = looks.withBaseFace(ref,'balanced');
  neutral.bodyFinish = 'painted';
  const actor = looks.build(neutral), pose = idle.sample(.17,actor)[0].pose;
  const neutralCells = digest(actor.body.makePose(pose).colors);
  const refActor = looks.build(looks.withGameFace(neutral));
  assert.equal(digest(refActor.body.makePose(pose).colors),neutralCells);
  const forms = new Set(), shapes = new Set();
  for (let seed=0; seed<32; seed++) {
    const options = {base,seed,release:looks.baseFaceRelease,bodyFinish:'painted'};
    const doc = looks.randomCharacter(options);
    assert.deepEqual(doc,looks.randomCharacter(options));
    assert.deepEqual(looks.prepare(toPlain(doc)).recipe.face,doc.face);
    assert.ok(doc.face.formMix >= .82 && doc.face.formMix <= 1);
    forms.add(doc.face.form);
  }
  assert.deepEqual([...forms].sort(),['angular','long','round']);
  for (const form of forms) {
    const doc = looks.withBaseFace(neutral,form);
    assert.deepEqual(toPlain(doc.parts),toPlain(ref.parts));
    const zero = looks.build({...doc,face:{...doc.face,formMix:0}});
    assert.equal(digest(zero.body.makePose(pose).colors),neutralCells,base+' '+form+' must reach the neutral surface');
    const sculpt = looks.build(doc);
    for (const key of Object.keys(actor.rig)) if (key !== 'mouth') assert.deepEqual(sculpt.rig[key],actor.rig[key]);
    assert.notDeepEqual(sculpt.sockets.chinTip,actor.sockets.chinTip);
    assert.deepEqual(sculpt.sockets.leftJawJoint,actor.sockets.leftJawJoint);
    assert.notDeepEqual(sculpt.sockets.mouth,actor.sockets.mouth);
    const drink = motion.actions.get('drink');
    if (motion.accepts(drink,0,sculpt)) {
      const sip = drink.sample(.5,sculpt)[0].pose;
      const mouth = motion.rig.socket(sculpt,sip,'mouth');
      assert.ok(Math.hypot(...mouth.map((x,i)=>x-sip.bottle.lip[i])) < 1e-7,base+' '+form+' bottle contact');
    }
    const scalp = scalps.scalp(base==='toddler'?'child':base,true);
    const nose = styles.noses[doc.face.nose] || styles.basicNoses[doc.face.nose];
    for (const mix of [.25,.65,1]) {
      const mouth = (base==='baby'?-.577:-.42)+surfaces.lipLift(base,form,mix);
      const surface=surfaces.model(base,doc.shape,{...doc.face,formMix:mix},form,scalp,base==='baby'?-.13:.13,mouth,nose,true);
      assert.ok(surface.row(-1).width < .001 && surface.row(1).width < .001,'closed chin and crown');
      assert.ok(surface.row(surface.tip).face[0] > surface.row(mouth).face[0],base+' '+form+' nose clears the lip');
      for (const h of [-.87,-.72,-.55,-.36,-.18,.05,.29,.51]) {
        const row=surface.row(h);
        assert.ok(row.width>=0 && row.rear>=0 && row.face.every(Number.isFinite));
        if (row.width < .001) continue;
        // Where the legacy cheek turns in, the rear half reaches the temple axis.
        for (const v of [.52,.82,.95]) {
          const y = v*row.width, front = Math.max(row.axis,surface.frontAt(row,v));
          assert.ok(surface.insideSkin(row,front-.001,y) && !surface.insideSkin(row,front+.001,y));
        }
        if (mix===1) assert.ok(row.face.every(x=>x>=row.axis-.001),'the authored cheek joins the temple');
      }
    }
    const cells = sculpt.body.makePose(pose).colors;
    shapes.add(mask(cells));
    const dyed = looks.build({...doc,colors:{...doc.colors,skin:'#785647'}});
    const colors = dyed.body.makePose(pose).colors;
    assert.equal(mask(cells),mask(colors));
    assert.notEqual(digest(cells),digest(colors));
  }
  assert.equal(shapes.size,3,base+' needs three distinct volumes');
  const trial = looks.build({...looks.withBaseFace(neutral,'round'),id:'look_drawn_'+base});
  motion.characters.set(trial.id,trial);
  const clip = motion.actions.get(base==='baby'?'baby-reach':'wave');
  cast.setFrame(clip.sample(.43,trial));
  assert.ok(cast.group.getObjectByName(trial.id+'/face').geometry.drawRange.count>0);
  if (base === 'baby') {
    const rest = idle.sample(.17,trial)[0].pose;
    rest.feet.forEach(foot=>assert.equal(foot[2],trial.rig.ankle));
    assert.deepEqual(rest.feet,pose.feet);
  }
}

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
    assert.equal(mask(model.colors), mask(dyed.colors), 'dyes preserve the same silhouette');
    const shut = actor.body.makePose({ ...neutral, blink: 1 });
    assert.notEqual(digest(model.colors), digest(shut.colors), 'eyelids close on the live character');
    distinct.add(digest(model.colors));
    checkDrawn(base,ref,cast);
  }
  // The two painters can be compared on the exact short-sleeved child from the
  // holdout, with identical pose landmarks, clothing dyes and face pixels.
  const sample = { base: 'child', seed: 3418494998, release: looks.gameFaceRelease };
  const original = looks.randomCharacter(sample);
  const finish = looks.randomCharacter({ ...sample, bodyFinish: 'painted' });
  assert.deepEqual(finish, { ...original, bodyFinish: 'painted', id: finish.id, label: finish.label });
  assert.notEqual(original.id, finish.id);
  assert.equal(looks.prepare(toPlain(finish)).recipe.bodyFinish, 'painted');
  assert.ok(!Object.hasOwn(looks.withFigureStudy(finish), 'bodyFinish'));
  assert.throws(() => looks.prepare({ ...original, bodyFinish: 'unknown' }));
  assert.throws(() => looks.randomCharacter({ ...sample, release: looks.release, bodyFinish: 'painted' }));
  for (const skin of ['#e1b798', '#47332f']) {
    const actors = [original, finish].map(doc => looks.build({ ...doc, colors: { ...doc.colors, skin } }));
    const [prior, revised] = actors;
    assert.deepEqual(prior.rig, revised.rig);
    assert.deepEqual(prior.sockets, revised.sockets);
    const pose = motion.actions.get('idle').sample(.17, prior)[0].pose;
    const colors = actors.map(a => a.body.makePose(pose).colors);
    const { nx, ny, density } = prior.body;
    const band = (z) => Math.ceil(z * density) * nx * ny;
    assert.equal(digest(colors[0].subarray(band(prior.rig.neck[2] + 1))), digest(colors[1].subarray(band(prior.rig.neck[2] + 1))));
    assert.notEqual(digest(colors[0].subarray(0, band(pose.legs[0].knee[2]))), digest(colors[1].subarray(0, band(pose.legs[0].knee[2]))));
    motion.characters.set(revised.id, revised);
    cast.setFrame(motion.actions.get('wave').sample(.37, revised));
    assert.ok(cast.group.getObjectByName(revised.id).geometry.drawRange.count > 0);
  }
  cast.dispose();
  assert.equal(distinct.size, 4);
  console.log(
    'Four ages, 12 new drawn bases, both generations of 128 seeded recipes, archived cells, morph endpoints, blinks, dyes, grounded infant rest, sockets and Three.js meshes passed'
  );
}
check().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
