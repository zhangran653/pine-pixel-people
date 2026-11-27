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
  const old = motion.rig.withArchivedArmPose(looks.build(pinned)), idle = motion.actions.get('idle');
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

function checkClothing(cast) {
  for (const age of ['adult','child','toddler','baby']) {
    const before = looks.withBaseFace(examples[age], 'round');
    before.bodyFinish = 'painted';
    const draft = looks.withClothingStudy(before);
    assert.equal(draft.packs[looks.core],looks.clothingStudyRelease);
    assert.deepEqual(toPlain({...draft,packs:before.packs}),toPlain(before));
    assert.deepEqual(toPlain(looks.prepare(toPlain(draft)).recipe.face),toPlain(draft.face));
    for (let seed=0; seed<8; seed++) {
      const options = {base:age, seed, bodyFinish:'painted'};
      const prior = looks.randomCharacter({...options,release:looks.baseFaceRelease});
      const next = looks.randomCharacter({...options,release:looks.clothingStudyRelease});
      for (const key of ['face','shape','gender']) assert.deepEqual(next[key],prior[key]);
      for (const key of ['skin','eyes','hair']) assert.equal(next.colors[key],prior.colors[key]);
      assert.deepEqual(next,looks.randomCharacter({...options,release:looks.clothingStudyRelease}));
      if (age==='adult' || age==='child') assert.deepEqual(next.parts,prior.parts);
      if (age==='baby') assert.equal(next.parts.shoes,'soft-booties');
    }
    const [old, current, dye] = [before,draft,{...draft,colors:{...draft.colors,top:'#7f4053',bottom:'#46686b'}}].map(d=>looks.build(d));
    assert.deepEqual(old.rig,current.rig);
    assert.deepEqual(old.sockets,current.sockets);
    const clip = motion.actions.get(age==='baby'?'baby-reach':'walk');
    const pose = clip.sample(.43,current)[0].pose;
    const cells = [old,current,dye].map(a=>a.body.makePose(pose).colors);
    assert.notEqual(mask(cells[0]),mask(cells[1]),age+' clothing changes the silhouette during movement');
    assert.equal(mask(cells[1]),mask(cells[2]),age+' same cut under a different dye');
    assert.notEqual(digest(cells[1]),digest(cells[2]));
    // Sample exactly the same face above the jaw. The cloth may meet the chin below it.
    const idle = motion.actions.get('idle').sample(.17,current)[0].pose;
    const faceStart = motion.rig.socket(current,idle,'mouth')[2]+.5;
    const at = Math.ceil(faceStart*old.body.density)*old.body.nx*old.body.ny;
    const heads=[old,current].map(a=>a.body.makePose(idle).colors.subarray(at));
    assert.ok(heads[0].some(Boolean));
    assert.equal(digest(heads[0]),digest(heads[1]),age+' keeps the same face and hair');
    motion.characters.set(current.id,current);
    cast.setFrame(clip.sample(.43,current));
    assert.ok(cast.group.getObjectByName(current.id).geometry.drawRange.count>0);
  }
  const babyTops = new Set(), toddlerHats = new Set();
  for (let seed=0; seed<128; seed++) {
    for (const base of ['toddler','baby']) {
      const options = {base, seed, release:looks.clothingStudyRelease};
      const doc = looks.randomCharacter(options);
      if (base==='baby') {
        babyTops.add(doc.parts.top);
        assert.equal(doc.parts.shoes,'soft-booties');
      } else toddlerHats.add(doc.parts.hat);
      const locked = looks.randomCharacter({...options,seed:seed+128,source:doc,locks:['wear','hair']});
      assert.deepEqual(locked.parts,doc.parts);
    }
  }
  for (const piece of ['tee','cardigan','breton','snap-knit']) assert.ok(babyTops.has(piece));
  for (const hat of ['none','pine-core/cotton-cap','pine-core/sunhat']) assert.ok(toddlerHats.has(hat));
}

function checkGarmentFits(cast) {
  const families = new Set(), previous = looks.expressionRelease, release = looks.garmentRelease;
  for (const base of ['adult','child','toddler','baby']) {
    for (let seed=0; seed<32; seed++) {
      const input = {base,seed,bodyFinish:'painted'};
      const prior = looks.randomCharacter({...input,release:previous});
      const next = looks.randomCharacter({...input,release});
      assert.deepEqual(next,looks.randomCharacter({...input,release}));
      assert.deepEqual(toPlain(looks.withoutGarmentStudy(next)),toPlain({...prior,id:next.id,label:next.label}));
      if (next.garmentFit) families.add(JSON.stringify(next.garmentFit));
    }
    const doc = looks.randomCharacter({base,seed:43,release,bodyFinish:'painted'});
    doc.parts.bottom = 'trousers';
    doc.garmentFit = {top:'bloused',legs:'wide'};
    doc.face.restExpression = 'curious';
    const old = looks.withoutGarmentStudy(doc);
    const fixed = looks.randomCharacter({source:doc,seed:9,base,locks:['wear']});
    assert.deepEqual(toPlain(fixed.garmentFit),toPlain(doc.garmentFit));
    assert.deepEqual(toPlain(looks.randomFace(doc,{seed:8}).garmentFit),toPlain(doc.garmentFit));
    assert.deepEqual(toPlain(looks.prepare(toPlain(doc)).recipe.garmentFit),toPlain(doc.garmentFit));
    assert.deepEqual(toPlain(looks.withExpressionStudy(doc)),toPlain(old));
    assert.ok(!looks.withFigureRatios(doc).garmentFit && !looks.withFigureStudy(doc).garmentFit);
    assert.throws(()=>looks.prepare({...old,garmentFit:doc.garmentFit}));
    assert.throws(()=>looks.prepare({...doc,garmentFit:{legs:'other'}}));
    assert.throws(()=>looks.prepare({...doc,clothingCut:'original'}));
    const prior = looks.build(old), current = looks.build(doc);
    assert.deepEqual(current.sockets,prior.sockets);
    const clip = motion.actions.get(base==='baby' ? 'baby-reach' : 'walk');
    const sample = clip.sample(.43,current), pose = sample[0].pose;
    const pixels = actor=>actor.body.makePose(pose).colors;
    const normal = pixels(current);
    assert.notEqual(mask(normal),mask(pixels(prior)),base+' sewn outline in motion');
    const tint = looks.build({...doc,colors:{...doc.colors,top:'#983357',bottom:'#426866'}});
    assert.equal(mask(normal),mask(pixels(tint)),base+' garment dyes preserve volume');
    // Face/hair are compared on the exact same pose; adults and children have a new idle stance.
    const rest = motion.actions.get('idle').sample(.17,current)[0].pose;
    const at = Math.ceil((motion.rig.socket(current,rest,'mouth')[2]+1)*current.body.density)*current.body.nx*current.body.ny;
    assert.equal(digest(current.body.makePose(rest).colors.subarray(at)),digest(prior.body.makePose(rest).colors.subarray(at)));
    for (const foot of rest.feet) assert.equal(foot[2],current.rig.ankle);
    const narrow = looks.build({...doc,garmentFit:{top:'bloused',legs:'tapered'}});
    assert.notEqual(mask(normal),mask(pixels(narrow)));
    for (const bottom of ['shorts','plaid-skirt','capris']) {
      const short = {...doc,parts:{...doc.parts,bottom}};
      const images = ['wide','tapered'].map(legs=>pixels(looks.build({...short,garmentFit:{top:'bloused',legs}})));
      assert.equal(digest(images[0]),digest(images[1]),bottom+' leaves skin, socks and hem intact');
    }
    motion.characters.set(current.id,current);
    cast.setFrame(sample);
    assert.ok(cast.group.getObjectByName(current.id).geometry.drawRange.count>0);
  }
  assert.ok(families.size>=3,'everyday outfits have repeatable sewn variants');
  const original = examples['baby02-source'], edited = examples['baby02-profile'];
  assert.deepEqual(toPlain(looks.prepare(edited).recipe),JSON.parse(read('studies/pixel-structure/baby02-profile.json')));
  assert.deepEqual(edited.colors,original.colors);
  assert.deepEqual(edited.parts,original.parts);
  assert.deepEqual({...edited.face,nose:original.face.nose},{...original.face});
  const sitters=[original,edited].map(d=>looks.build(d));
  const sits=sitters.map(actor=>motion.actions.get('idle').sample(.17,actor)[0].pose);
  assert.deepEqual(sits[0].feet,sits[1].feet);
  assert.deepEqual(sits[0].torso,sits[1].torso);
  assert.notEqual(mask(sitters[0].body.makePose(sits[0]).colors),mask(sitters[1].body.makePose(sits[1]).colors));
}

function checkInfantChin(cast) {
  const previous = looks.garmentRelease, release = looks.infantChinRelease;
  for (const base of ['adult','child','toddler','baby']) {
    for (let seed=0; seed<8; seed++) {
      const options = {base,seed,bodyFinish:'painted'};
      const old = looks.randomCharacter({...options,release:previous});
      const trial = looks.randomCharacter({...options,release});
      assert.deepEqual(toPlain(looks.withoutInfantChin(trial)),toPlain({...old,id:trial.id,label:trial.label}));
      assert.deepEqual(looks.prepare(toPlain(trial)).recipe.face,trial.face);
      if (seed !== 0 && base !== 'baby') continue;
      const [before,after] = [old,trial].map(d=>looks.build(d));
      const pose = motion.actions.get('idle').sample(.17,after)[0].pose;
      for (const key of ['mouth','upperLip','lowerLip','rightEye','leftEye','rightEarCanal','leftJawJoint','collar','seat'])
        assert.deepEqual(after.sockets[key],before.sockets[key],base+' '+key);
      const cells = a => a.body.makePose(pose).colors;
      if (base === 'baby') {
        assert.notEqual(mask(cells(before)),mask(cells(after)));
        assert.ok(after.sockets.chinTip.point[0] > after.sockets.throat.point[0]);
        assert.ok(after.sockets.lowerLip.point[2] > after.sockets.chinTip.point[2]);
        assert.deepEqual(motion.actions.get('idle').sample(.17,before)[0].pose.feet,pose.feet);
      } else assert.equal(digest(cells(before)),digest(cells(after)),base+' keeps its previous slices');
    }
  }
  const old = examples['baby02-profile'], next = looks.withInfantChin(old);
  assert.deepEqual(toPlain(looks.withoutInfantChin(next)),toPlain(old));
  const ageCut = looks.withoutGarmentStudy(old), sameCut = looks.withInfantChin(ageCut);
  assert.equal(looks.prepare(toPlain(sameCut)).recipe.clothingCut,'age');
  assert.deepEqual(toPlain(looks.withoutInfantChin(sameCut)),toPlain(ageCut));
  assert.throws(()=>looks.prepare({...ageCut,clothingCut:'age'}));
  const after = looks.build(next);
  const fullerDoc = looks.withInfantChin(next,looks.chinPadRelease), fuller = looks.build(fullerDoc);
  assert.deepEqual(toPlain(looks.withInfantChin(fullerDoc)),toPlain(next));
  assert.equal(looks.prepare(toPlain(fullerDoc)).recipe.packs[looks.core],looks.chinPadRelease);
  assert.throws(()=>looks.withInfantChin(next,'unknown'));
  for (const name of ['lowerLip','upperLip','mouth','throat','collar','leftJawJoint','leftEye','seat'])
    assert.deepEqual(fuller.sockets[name],after.sockets[name],name+' stays anchored as the chin fills');
  for (const base of ['adult','child','toddler','baby']) {
    const options = {base,seed:93,bodyFinish:'painted'};
    const prior = looks.randomCharacter({...options,release:looks.infantChinRelease});
    const trial = looks.randomCharacter({...options,release:looks.chinPadRelease});
    assert.deepEqual(toPlain(looks.withInfantChin(trial)),toPlain({...prior,id:trial.id,label:trial.label}));
    const actors = [prior,trial].map(d=>looks.build(d)), pose = motion.actions.get('idle').sample(.17,actors[0])[0].pose;
    const cells = actors.map(a=>digest(a.body.makePose(pose).colors));
    assert.equal(cells[0]===cells[1],base!=='baby',base+' chin scope');
  }
  motion.characters.set(after.id,after);
  for (const id of ['idle','baby-reach','crawl']) {
    const frame = motion.actions.get(id).sample(.61,after);
    cast.setFrame(frame);
    assert.ok(cast.group.getObjectByName(after.id).geometry.drawRange.count>0);
  }
  const scalp = scalps.scalp('baby',true), mouth = -.54;
  for (const form of ['balanced','long','round','angular']) for (const amount of [-1,0,1]) {
    const shape = {...next.shape,chinRoundness:amount,chinHeight:amount,chinProjection:amount};
    const args = ['baby',shape,next.face,form,scalp,-.13,mouth,styles.basicNoses.button,true,true,true];
    const oldSurface = surfaces.model(...args), surface = surfaces.model(...args,true);
    const pad = surfaces.model(...args,looks.chinPadRelease);
    assert.deepEqual(pad.row(mouth-.045).face,surface.row(mouth-.045).face);
    assert.ok(pad.chin.padH < surface.chin.padH && pad.chin.throatH === surface.chin.throatH);
    assert.ok(pad.row(pad.chin.padH).face[0] > surface.row(pad.chin.padH).face[0] + .045,
      'the forward pad must still be visible below the former tip in every face form');
    for (const h of [mouth-.045,mouth,surface.tip,.3,.72])
      assert.deepEqual(surface.row(h).face,oldSurface.row(h).face,'lower lip, nose and vault keep their surface');
    const {undersideX,bottomH,padH} = surface.chin;
    assert.ok(surface.row(bottomH-.012).width<.001 && surface.row(padH).face[0]>undersideX);
    for (let h=bottomH+.011; h<mouth-.075; h+=.011) {
      const row = surface.row(h);
      assert.ok(row.width>0 && row.rear>=0 && row.fore>=0 && row.face.every(Number.isFinite));
    }
  }
  const babies = [];
  for (let seed=3601;seed<=3664;seed++) {
    const doc = looks.randomCharacter({seed});
    if (doc.base !== 'baby') { assert.equal(doc.infantChin,undefined); continue; }
    babies.push(seed);
    assert.equal(looks.prepare(toPlain(doc)).recipe.infantChin,'round');
    const archived = looks.randomCharacter({base:'baby',seed,finish:'soft-pixel',release:looks.release});
    assert.equal(archived.infantChin,undefined);
    for (const key of ['shape','colors','face']) assert.deepEqual(doc[key],archived[key]);
    assert.deepEqual(toPlain({...doc.parts,hair:archived.parts.hair,hat:archived.parts.hat}),toPlain(archived.parts));
    assert.ok(['bald','crop','curly','crew'].includes(archived.parts.hair));
    assert.equal(looks.randomFace(archived,{seed}).infantChin,'round');
    const full = looks.withInfantChinStyle(doc,'full'), restored = looks.withInfantChinStyle(full,'round');
    assert.equal(looks.prepare(full).recipe.packs[looks.core],looks.release);
    assert.equal(looks.randomFace(looks.prepare(full).recipe,{seed}).infantChin,'full');
    assert.deepEqual(toPlain(restored),toPlain(doc));
  }
  assert.deepEqual(babies,[3603,3611,3615,3616,3633,3654,3657,3664]);
  const baby = looks.randomCharacter({seed:3603}), adult = looks.withBodyProfile(baby,'female');
  assert.equal(adult.infantChin,undefined);
  assert.throws(()=>looks.prepare({...adult,infantChin:'round'}));
  assert.equal(looks.randomCharacter({source:adult,seed:3603}).infantChin,'round');
  assert.equal(looks.randomCharacter({base:'baby',seed:3603,ink:'auto'}).infantChin,'round');
  const sitter = looks.withFittedPortrait(looks.withFaceFinish(baby,'storybook-lips'));
  assert.equal(looks.prepare(sitter).recipe.infantChin,'round');
  assert.equal(looks.prepare(looks.withoutInfantNose(sitter)).recipe.infantChin,'round');
  const roundActor = looks.build(sitter), fullActor = looks.build(looks.withInfantChinStyle(sitter,'full'));
  for (const point of ['leftJawJoint','rightJawJoint','leftEye','lowerLip','upperLip','throat','collar','seat'])
    assert.deepEqual(roundActor.sockets[point],fullActor.sockets[point],point+' moved with the infant chin');
  motion.characters.set(roundActor.id,roundActor);
  for (const clip of ['idle','baby-reach','crawl','open-mouth']) {
    const frame = motion.actions.get(clip).sample(.43,roundActor);
    cast.setFrame(frame);
    assert.ok(cast.group.getObjectByName(roundActor.id+'/face').geometry.drawRange.count>0);
  }
  for (const form of ['balanced','long','round','angular']) {
    const args = ['baby',sitter.shape,sitter.face,form,scalp,-.13,mouth,styles.basicNoses.button,true,true,true];
    const full = surfaces.model(...args,'full'), round = surfaces.model(...args,'round');
    assert.deepEqual(round.row(mouth-.042).face,full.row(mouth-.042).face);
    const pad = round.chin.padH, below = (pad+round.chin.bottomH)/2;
    assert.ok(pad > full.chin.padH && round.chin.bottomH > full.chin.bottomH);
    assert.ok(round.row(pad).face[0]-round.row(below).face[0] > .025,'the profile should turn back below the chin');
    assert.ok(Math.abs(round.row(pad).face[0]-round.row(mouth-.042).face[0]) < .07,'the visible chin should support the lower lip');
    assert.ok(round.row(mouth-.17).width > full.row(mouth-.17).width,'the cheeks should turn into a broader U');
  }
  console.log('Archived and rounded infant chins, normal mixed-age rolls, seated and crawling meshes, mouth and ear contacts passed');
}

function checkFigureRatios(cast) {
  const keys = ['headScale','crownHeight','trunkLength','noseLipSpacing'];
  const close = (a,b) => Math.abs(a-b) < 1e-8;
  for (const base of ['adult','child','toddler','baby']) {
    const options = {base, release:looks.featureStudyRelease, bodyFinish:'painted'};
    const source = looks.randomCharacter({...options,seed:21});
    source.clothingCut = 'original';
    const doc = looks.withFigureRatios(source), previous = looks.build(source);
    assert.deepEqual(toPlain(looks.withoutFigureRatios(doc)),toPlain(source));
    assert.deepEqual(toPlain(looks.withFigureRatios(doc)),toPlain(doc));
    assert.deepEqual(looks.prepare(toPlain(doc)).recipe.shape,looks.prepare(doc).recipe.shape);
    assert.throws(()=>looks.prepare({...doc,packs:source.packs}));
    const neutral = {...doc,shape:{...source.shape}};
    const reference = looks.build(neutral), clip = motion.actions.get(base==='baby'?'baby-reach':'walk');
    const pose = clip.sample(.43,previous)[0].pose;
    assert.deepEqual(reference.sockets,previous.sockets);
    assert.equal(digest(reference.body.makePose(pose).colors),digest(previous.body.makePose(pose).colors));
    const facePixels = a=>motion.figureLayers(a,pose,a.body.makePose(pose)).at(-1).model.colors;
    assert.equal(digest(facePixels(reference)),digest(facePixels(previous)));
    const head = looks.build({...neutral,shape:{...neutral.shape,headScale:.85}});
    assert.ok(head.rig.headPivot.every((v,i)=>close(v,previous.rig.headPivot[i])), 'resizing shifted the skull joint');
    const manga = {...neutral,face:{...neutral.face,style:'manga'},anatomyParts:{...neutral.anatomyParts,skull:'long'}};
    const originalPivot=looks.build(manga).rig.headPivot;
    const resizedPivot=looks.build({...manga,shape:{...manga.shape,headScale:1.16}}).rig.headPivot;
    assert.ok(resizedPivot.every((v,i)=>close(v,originalPivot[i])), 'an alternate scalp moved the neck socket');
    const taller = looks.build({...neutral,shape:{...neutral.shape,trunkLength:1.2}});
    assert.deepEqual(taller.rig.pelvis,previous.rig.pelvis);
    assert.deepEqual(taller.rig.hip,previous.rig.hip);
    const lift = taller.rig.neck[2]-previous.rig.neck[2];
    assert.ok(lift>0 && close(lift,taller.rig.shoulder[2]-previous.rig.shoulder[2]));
    assert.ok(close(lift,taller.sockets.leftEye.point[2]-previous.sockets.leftEye.point[2]));
    const shortCrown = looks.build({...neutral,shape:{...neutral.shape,crownHeight:.70}});
    assert.deepEqual(shortCrown.sockets,previous.sockets);
    const gap = looks.build({...neutral,shape:{...neutral.shape,noseLipSpacing:1.5}});
    assert.ok(gap.sockets.upperLip.point[2]<previous.sockets.upperLip.point[2]);
    assert.deepEqual(gap.sockets.leftEye,previous.sockets.leftEye);
    const variations = new Set();
    for (let seed=0; seed<32; seed++) {
      const old = looks.randomCharacter({...options,seed});
      const next = looks.randomCharacter({...options,release:looks.figureRatioRelease,seed});
      assert.deepEqual(next,looks.randomCharacter({...options,release:looks.figureRatioRelease,seed}));
      const restored = looks.withoutFigureRatios(next);
      for (const field of ['parts','face','shape','colors','anatomyParts']) assert.deepEqual(toPlain(restored[field]),toPlain(old[field]));
      variations.add(keys.map(k=>next.shape[k]).join('/'));
    }
    assert.ok(variations.size>=6,base+' repeats the same proportions');
    const locked = looks.randomCharacter({source:doc,seed:3,locks:['body','skin','wear','hair']});
    assert.equal(locked.shape.headScale,doc.shape.headScale);
    assert.equal(locked.shape.trunkLength,doc.shape.trunkLength);
    assert.deepEqual(toPlain(locked.parts),toPlain(doc.parts)); assert.equal(locked.clothingCut,'original');
    const portrait = looks.randomFace(doc,{seed:3,release:looks.figureRatioRelease});
    assert.equal(portrait.shape.trunkLength,doc.shape.trunkLength);
    assert.equal(portrait.shape.headScale,doc.shape.headScale);
    const actor = looks.build(doc);
    if (base!=='baby') {
      const sip=motion.actions.get('drink').sample(.5,actor)[0].pose;
      const lip=motion.rig.socket(actor,sip,'mouth');
      assert.ok(Math.hypot(...lip.map((v,i)=>v-sip.bottle.lip[i]))<1e-7, 'resizing broke drinking contact');
    }
    motion.characters.set(actor.id,actor);
    cast.setFrame(clip.sample(.43,actor));
    assert.ok(cast.group.getObjectByName(actor.id+'/face').geometry.drawRange.count>0);
  }
}

function checkFacialActing(cast) {
  const {core,figureRatioRelease,expressionRelease} = looks;
  const close = (v,w) => Math.abs(v-w) < 1e-7;
  const fine = (actor,pose) => motion.figureLayers(actor,pose,actor.body.makePose(pose)).at(-1).model.colors;
  const rig = motion.rig;
  for (const base of ['adult','child','toddler','baby']) {
    const docs = [];
    for (let seed=0; seed<32; seed++) {
      const old = looks.randomCharacter({base,seed,release:figureRatioRelease,bodyFinish:'painted'});
      const next = looks.randomCharacter({base,seed,release:expressionRelease,bodyFinish:'painted'});
      const restored=looks.withoutExpressionStudy(next);
      assert.deepEqual(toPlain(restored),toPlain({...old,id:next.id,label:next.label}));
      assert.deepEqual(toPlain(looks.withExpressionStudy(restored)),toPlain(next));
      docs.push(next);
    }
    const doc = docs[4], original = looks.withoutExpressionStudy(doc);
    doc.face.restExpression = 'curious';
    assert.equal(looks.prepare(toPlain(doc)).recipe.face.restExpression,'curious');
    assert.throws(()=>looks.prepare({...doc,packs:original.packs}));
    assert.throws(()=>looks.prepare({...doc,face:{...doc.face,restExpression:'missing'}}));
    assert.deepEqual(toPlain(looks.withFigureRatios(doc)),toPlain(original));
    assert.equal(looks.randomFace(doc,{seed:8}).face.restExpression,'curious');
    assert.equal(looks.randomFace(doc,{seed:8,release:figureRatioRelease}).face.restExpression,undefined);
    const actor=looks.build(doc), old=looks.build(original);
    const channels={headYaw:.37,headPitch:-.15,hipOffset:[.63,-.32,.27]};
    const still=rig.pose(actor.rig,channels);
    assert.throws(()=>rig.pose(actor.rig,{faceCue:{gaze:[Infinity,0]}}));
    assert.deepEqual(toPlain(rig.pose(actor.rig,{faceCue:{gaze:[2,-3],smile:-1}}).faceCue),{gaze:[1,-1],smile:0});
    assert.ok(!rig.pose(old.rig,{faceCue:{gaze:[1,0]}}).faceCue);
    const midpoint=actor.sockets.leftEye.point.map((v,i)=>(v+actor.sockets.rightEye.point[i])*.5);
    for (const [offset,expected] of [[[10,0,0],[0,0]],[[0,8,0],[1,0]],[[0,0,-6],[0,-1]]]) {
      const target=rig.point(still.head,midpoint.map((v,i)=>v+offset[i]));
      const gaze=rig.lookAt(actor,still,target);
      assert.ok(gaze.every((v,i)=>close(v,expected[i])));
    }
    const gazes=[-1,0,1].map(x=>fine(actor,rig.pose(actor.rig,{...channels,faceCue:{gaze:[x,0]}})));
    assert.equal(new Set(gazes.map(digest)).size,3,base+' lost gaze pixels');
    assert.equal(new Set(gazes.map(mask)).size,1,base+' gaze changed the head silhouette');
    const closed=x=>digest(fine(actor,rig.pose(actor.rig,{...channels,blink:1,faceCue:{gaze:[x,0]}})));
    assert.equal(closed(-1),closed(1),base+' drew the moving iris through closed lids');
    const moods=new Set(Object.keys(looks.restExpressions).map(restExpression =>
      digest(fine(looks.build({...doc,face:{...doc.face,restExpression}}),still))));
    assert.equal(moods.size,3,base+' resting attitudes are identical');
    const dyed=looks.build({...doc,face:{...doc.face,iris:'two-tone'},colors:{...doc.colors,eyes:'#50808a',leftEye:'#987348'}});
    const change=fine(dyed,still);
    assert.equal(mask(change),mask(gazes[1]));
    assert.notEqual(digest(change),digest(gazes[1]),base+' custom eye pigments were lost');
    const manga={...original,face:{...original.face,style:'manga'}};
    const priorManga=looks.build(manga),nextManga=looks.build(looks.withExpressionStudy(manga));
    const mangaPose=motion.actions.get('idle').sample(.17,priorManga)[0].pose;
    assert.equal(digest(fine(priorManga,mangaPose)),digest(fine(nextManga,mangaPose)));
    const action=motion.actions.get(['baby','toddler'].includes(base)?'baby-reach':'phone');
    const sample=action.sample(.49,actor);
    assert.ok(sample[0].pose.faceCue.gaze[1]<0,base+' lost the prop target');
    assert.deepEqual(sample[0].pose.feet,action.sample(.49,old)[0].pose.feet);
    motion.characters.set(actor.id,actor); cast.setFrame(sample);
    assert.ok(cast.group.getObjectByName(actor.id+'/face').geometry.drawRange.count>0);
    if (base === 'baby') {
      const adult=looks.build(looks.withExpressionStudy(examples.adult));
      const clip=motion.actions.get('follow-rattle');
      for(const phase of [.08,.23,.56,.73]) {
        const [giver,baby]=clip.sample(phase,adult,actor);
        const expected=rig.lookAt(actor,baby.pose,rig.local(baby,giver.contacts.toy));
        assert.deepEqual(baby.pose.faceCue.gaze,expected);
      }
    }
    assert.equal(doc.packs[core],expressionRelease);
  }
  // Read the indexed pigment in head coordinates, on each side of the face.
  const style=styles.illustratedEyeShape('level-eye','animation',true);
  const ink={pupil:1,eyes:2,irisShadow:3,irisLight:4,sclera:5,scleraShade:6,lash:7,lidSkin:8,glint:9};
  for (const side of [-1,1]) {
    function pupilX(direction) {
      const acting=surfaces.expression('baby',{}, {gaze:[direction,0]},0);
      let total=0,count=0;
      for(let x=-45;x<=45;x++) for(let y=-28;y<=28;y++) {
        const pigment=surfaces.paintedEye(surfaces.featureGuides.baby,style,side*x/128,y/128,0,side,ink,1/64,acting);
        if(pigment===ink.pupil){total+=x;count++;}
      }
      assert.ok(count>8); return total/count;
    }
    assert.ok(pupilX(1)>pupilX(-1)+12,'left and right pupils must track the same world direction');
  }
}

function checkFeatureStudy(cast) {
  const release=looks.featureStudyRelease;
  for (const base of ['adult','child','toddler','baby']) {
    const ref=looks.withBaseFace(examples[base],'round');
    const uncut=looks.withFeatureStudy(ref), cut=looks.withClothingStudy(ref), trial=looks.withFeatureStudy(cut);
    assert.equal(uncut.clothingCut,'original');
    assert.equal(looks.prepare(uncut).recipe.clothingCut,'original');
    assert.deepEqual(toPlain(looks.withoutFeatureStudy(uncut)),toPlain(ref));
    assert.deepEqual(toPlain(looks.withoutFeatureStudy(trial)),toPlain(cut));
    assert.throws(()=>looks.prepare({...uncut,packs:cut.packs}));
    assert.throws(()=>looks.prepare({...trial,clothingCut:'wide'}));
    for(let seed=0;seed<24;seed++) {
      const old=looks.randomCharacter({base,seed,release:looks.clothingStudyRelease});
      const next=looks.randomCharacter({base,seed,release});
      assert.deepEqual(next,looks.randomCharacter({base,seed,release}));
      for(const key of ['parts','face','shape','colors']) assert.deepEqual(next[key],old[key]);
    }
    const locked=looks.randomCharacter({source:uncut,base,seed:41,locks:['wear','hair']});
    assert.equal(locked.clothingCut,'original'); assert.deepEqual(toPlain(locked.parts),toPlain(uncut.parts));
    const [old,actor]=[cut,trial].map(d=>looks.build(d));
    const clip=motion.actions.get(base==='baby'?'baby-reach':'wave'),pose=clip.sample(.43,actor)[0].pose;
    assert.deepEqual(old.sockets.leftJawJoint,actor.sockets.leftJawJoint);
    assert.deepEqual(clip.sample(.43,old)[0].pose.feet,pose.feet);
    const previous=old.body.makePose(pose), current=actor.body.makePose(pose);
    const limit=Math.floor((pose.arms[0].shoulder[2]-.10*actor.rig.height)*actor.body.density)*actor.body.nx*actor.body.ny;
    assert.equal(digest(previous.colors.subarray(0,limit)),digest(current.colors.subarray(0,limit)));
    const fine=(a,at)=>motion.figureLayers(a,at,a.body.makePose(at)).at(-1).model.colors;
    const face=fine(actor,pose), shut=fine(actor,{...pose,blink:1});
    assert.notEqual(digest(face),digest(shut),base+' blink in the painted face');
    for(const change of [{eyes:'#3781a1',leftEye:'#9b563f'}, {lip:'#923748'}, {skin:'#84593e'}]) {
      const tinted=looks.build({...trial,colors:{...trial.colors,...change}});
      const dyed=fine(tinted,pose);
      assert.equal(mask(dyed),mask(face));
      assert.notEqual(digest(dyed),digest(face));
    }
    const previousStyle={...cut,face:{...cut.face,style:'manga'}};
    assert.equal(digest(looks.build(previousStyle).body.makePose(pose).colors),
      digest(looks.build({...previousStyle,packs:trial.packs}).body.makePose(pose).colors));
    if(base!=='baby'){
      const sip=motion.actions.get('drink').sample(.5,actor)[0].pose, lip=motion.rig.socket(actor,sip,'mouth');
      assert.ok(Math.hypot(...lip.map((v,i)=>v-sip.bottle.lip[i]))<1e-7);
    }
    motion.characters.set(actor.id,actor);
    cast.setFrame(clip.sample(.43,actor));
    assert.ok(cast.group.getObjectByName(actor.id+'/face').geometry.drawRange.count>0);
  }
}

function checkOrdinaryFaces(cast) {
  const openings = ['doe-eye','almond','downturned','hooded'].map(eyes=>surfaces.featureBrush('adult','wash',true,eyes).lid);
  assert.equal(new Set(openings.map(lid=>JSON.stringify(lid))).size,4,'four selected eye types share a single drawing');
  for (const base of ['adult','child','toddler','baby']) {
    const options = {base,seed:2602};
    const a = looks.randomCharacter({...options,release:looks.release}), b = looks.randomCharacter({...options,release:looks.release,finish:'soft-pixel'});
    const finish = base === 'adult' ? 'storybook-lips' : 'soft-pixel';
    assert.deepEqual(looks.randomCharacter(options),looks.randomCharacter({...options,finish}));
    const clone = toPlain(b);
    delete clone.face.finish;
    assert.deepEqual({...clone,id:a.id,label:a.label},toPlain(a));
    assert.equal(b.face.finish,'soft-pixel');
    assert.deepEqual(toPlain(looks.prepare(b).recipe),toPlain(looks.prepare(toPlain(b)).recipe));
    assert.equal(looks.randomFace(a,{seed:52}).face.finish,finish);
    assert.equal(looks.randomFace(b,{seed:52}).face.finish,'soft-pixel');
    const original = {...b,face:{...b.face,finish:'original'}};
    assert.equal(looks.randomFace(original,{seed:52}).face.finish,'original');
    assert.equal(looks.randomCharacter({source:original,seed:52}).face.finish,'original');
    const implicit = toPlain(b);
    delete implicit.face.style;
    assert.equal(looks.prepare(implicit).recipe.face.finish,'soft-pixel');
    assert.throws(()=>looks.prepare({...b,face:{...b.face,style:'manga'}}),/面部画法/);
    assert.ok(!looks.withFaceSurface(b).face.finish);

    const plain = looks.build(a), actor = looks.build(b), saved = looks.build(original);
    const clip = motion.actions.get(base === 'baby' ? 'baby-reach' : 'walk');
    const pose = clip.sample(.41,actor)[0].pose;
    for (const name of ['height','hip','shoulder','neck','jawPivot']) assert.deepEqual(actor.rig[name],plain.rig[name]);
    const colors = person => person.body.makePose(pose).colors;
    const c = colors(plain), drawn = colors(actor);
    assert.equal(digest(c),digest(colors(saved)),'explicit original altered the archive');
    const neckHeight = motion.rig.point(pose.head,actor.rig.neck)[2];
    const beforeNeck = Math.floor((neckHeight-3)*actor.body.density)*actor.body.nx*actor.body.ny;
    assert.equal(digest(c.subarray(0,beforeNeck)),digest(drawn.subarray(0,beforeNeck)),base+' portrait changed pixels below the posed neck');
    assert.notEqual(digest(c),digest(drawn));
    const restored = looks.build(looks.prepare(toPlain(b)).recipe);
    assert.equal(digest(drawn),digest(colors(restored)));
    motion.characters.set(actor.id,actor);
    cast.setFrame(clip.sample(.41,actor));
    assert.ok(cast.group.getObjectByName(actor.id).geometry.drawRange.count > 0);
  }
  console.log('Ordinary random faces reproduce the wardrobe, preserve archived pixels, and animate in Three.js at four ages');
}

function checkStoryFaces(cast) {
  const blackHair = looks.withFaceFinish(examples['blue-jacket'],'storybook');
  const sculpt = shape => looks.build({...blackHair,shape:{...blackHair.shape,...shape}}).sockets;
  const low = sculpt({mouthHeight:-.8}), neutral = sculpt({mouthHeight:-.5}), high = sculpt({mouthHeight:.8});
  const mouthTravel = neutral.mouth.point[2]-low.mouth.point[2];
  const tipTravel = neutral.noseTip.point[2]-low.noseTip.point[2];
  assert.ok(mouthTravel > 0 && tipTravel > 0 && tipTravel < .5*mouthTravel,
    'a low-set mouth should not stretch the whole nose');
  assert.ok(sculpt({noseBridge:.5}).noseTip.point[0] > sculpt({noseBridge:-.5}).noseTip.point[0],
    'nose projection must still be editable');
  assert.ok(high.noseBase.point[2]-high.upperLip.point[2] > .04*5.82*blackHair.shape.height,
    'raising a full upper lip must leave space below the nasal base');
  for (const name of ['leftEye','rightEye','leftEarCanal']) assert.deepEqual(low[name],high[name]);
  const trial = looks.withFaceFinish(blackHair,'storybook-lips');
  const full = looks.build(trial).sockets, original = looks.build(blackHair).sockets;
  const thin = looks.build({...trial,face:{...trial.face,mouth:'thin'}}).sockets;
  for (const name of ['leftEye','rightEye','leftEarCanal','chinTip']) assert.deepEqual(full[name],original[name]);
  assert.ok(full.upperLip.point[0] > thin.upperLip.point[0]+.05 &&
    full.lowerLip.point[0] > thin.lowerLip.point[0]+.08,'full and thin lips must have different side silhouettes');
  for (const base of ['adult','child','toddler','baby']) {
    const previousPairs = new Set(), drawnPairs = new Set();
    for (let seed=3601; seed<=3728; seed++) {
      const options = {base,seed,style:seed%2 ? 'natural' : 'expressive'};
      const previous = looks.randomCharacter({...options,finish:'storybook'});
      const next = looks.randomCharacter({...options,finish:'storybook-lips'});
      assert.equal(next.face.finish,'storybook-lips');
      for (const key of ['parts','colors','identity']) assert.deepEqual(previous[key],next[key]);
      for (const key of ['eyes','brows','nose','outline']) assert.equal(previous.face[key],next.face[key]);
      previousPairs.add(previous.face.nose+'/'+previous.face.mouth);
      drawnPairs.add(next.face.nose+'/'+next.face.mouth);
      if (seed <= 3603) {
        const saved = looks.prepare(toPlain(next)).recipe;
        assert.deepEqual(toPlain(saved),toPlain(looks.prepare(looks.randomCharacter({...options,finish:'storybook-lips'})).recipe));
        const {noseBase,upperLip} = looks.build(next).sockets;
        assert.ok(noseBase.point[2] > upperLip.point[2],base+' nose overlaps the raised upper lip');
      }
    }
    assert.ok(drawnPairs.size > 2*previousPairs.size,base+' noses should accept several compatible lips');
    const ordinary = looks.randomCharacter({base,seed:131});
    const story = looks.withFaceFinish(ordinary,'storybook'), fitted = looks.withFittedPortrait(story);
    for (const key of ['face','parts','colors','identity']) assert.deepEqual(fitted[key],story[key]);
    assert.equal(fitted.packs[looks.core],looks.infantNoseRelease);
    assert.equal(fitted.bodyFinish,'painted');
    if (base === 'baby') {
      assert.equal(fitted.infantNose,'nursery');
      const flat = looks.withoutInfantNose(fitted);
      assert.equal(flat.face.finish,'storybook');
      assert.equal(flat.packs[looks.core],fitted.packs[looks.core]);
    }
    for (const doc of [story,fitted,looks.withFaceFinish(story,'storybook-lips'),looks.withFaceFinish(fitted,'storybook-lips')]) {
      const finish = doc.face.finish;
      const soft = looks.withFaceFinish(doc,'soft-pixel');
      assert.deepEqual(toPlain(looks.withFaceFinish(soft,finish)),toPlain(doc));
      assert.deepEqual(toPlain(looks.prepare(toPlain(doc)).recipe),toPlain(looks.prepare(doc).recipe));
      assert.equal(looks.randomFace(doc,{seed:30}).face.finish,finish);
      const rolled = looks.randomCharacter({source:doc,base,seed:30,locks:['body','wear','hair','skin']});
      assert.equal(looks.prepare(rolled).recipe.face.finish,finish);
      assert.deepEqual(toPlain(rolled.parts),toPlain(doc.parts));
      assert.equal(rolled.colors.skin,doc.colors.skin);
      assert.ok(!looks.withPortraitInk(doc,'cel').face.finish);
      assert.throws(()=>looks.prepare({...doc,portraitInk:'cel'}));
      assert.throws(()=>looks.prepare({...doc,face:{...doc.face,finish:['storybook']}}));
      const actor = looks.build(doc), clip = motion.actions.get(base === 'baby' ? 'baby-reach' : 'walk');
      const frame = clip.sample(.41,actor), pose = frame[0].pose;
      const head = (a,at)=>motion.figureLayers(a,at,a.body.makePose(at)).at(-1).model.colors;
      const open = head(actor,pose);
      assert.notEqual(digest(open),digest(head(actor,{...pose,blink:1})));
      assert.notEqual(digest(open),digest(head(looks.build(soft),pose)));
      const dyed = looks.build({...doc,colors:{...doc.colors,eyes:'#408595',lip:'#a24755'}});
      const tinted = head(dyed,pose);
      assert.equal(mask(open),mask(tinted));
      assert.notEqual(digest(open),digest(tinted));
      if (base === 'baby') assert.equal(Boolean(actor.rig.seatedHeadOffset),doc.packs[looks.core] === looks.infantNoseRelease);
      motion.characters.set(actor.id,actor);
      cast.setFrame(frame);
      assert.ok(cast.group.getObjectByName(actor.id+'/face').geometry.drawRange.count > 0);
    }
  }
  console.log('Storybook portraits retain dyes, blinks, rerolls, fitted infant support and Three.js meshes across four ages');
}

function checkPortraitBrushes(cast) {
  const pins = [looks.garmentRelease,looks.infantChinRelease,looks.chinPadRelease];
  for (const pin of pins) {
    const prior = looks.randomCharacter({base:'baby',seed:26,release:pin});
    const nose = looks.withInfantNose(prior);
    assert.deepEqual(toPlain(looks.withoutInfantNose(nose)),toPlain(prior));
    assert.equal(styles.infantChinStyle(looks.randomFace(prior,{ink:'auto',seed:7})),styles.infantChinStyle(prior));
    assert.equal(styles.infantChinStyle(looks.randomCharacter({source:prior,base:'baby',ink:'auto',seed:7})),styles.infantChinStyle(prior));
    for (const chin of ['short','full','original']) {
      const doc = looks.withInfantChinStyle(looks.withPortraitInk(nose,'wash'),chin);
      assert.equal(styles.infantChinStyle(doc),chin);
      assert.equal(doc.infantNose,'nursery');
      const off = looks.withoutInfantNose(doc);
      assert.equal(off.portraitInk,'wash');
      assert.deepEqual(toPlain(looks.withInfantNose(off)),toPlain(doc));
      assert.deepEqual(toPlain(looks.prepare(toPlain(doc)).recipe.colors),toPlain(doc.colors));
    }
  }
  for (const nose of ['button','wide','long']) {
    const row = styles.noses[nose] || styles.basicNoses[nose];
    const args = ['baby',{}, {nose}, 'round', scalps.scalp('baby',true), -.13, -.56, row, true,true,true,looks.chinPadRelease];
    const prior = surfaces.model(...args), next = surfaces.model(...args,true);
    assert.ok(prior.row(prior.tip).face[0] > next.row(next.tip).face[0] + .035);
    assert.ok(next.row(next.tip).face[0] > next.row(next.mouth).face[0]);
    for (const h of [-.83,-.56,.24,.74]) assert.deepEqual(next.row(h).face,prior.row(h).face);
  }
  const faces = new Set(), finishes = new Set(), rests = new Set();
  for (const base of ['adult','child','toddler','baby']) for (let seed=0;seed<32;seed++) {
    const options = {base,seed,ink:'auto'};
    const doc = looks.randomCharacter(options), ready = looks.prepare(toPlain(doc)).recipe;
    assert.deepEqual(doc,looks.randomCharacter(options));
    assert.equal(ready.portraitInk,doc.portraitInk);
    assert.equal(ready.faceSurface,'linked');
    if (base === 'baby') assert.equal(ready.infantNose,'nursery');
    const again = looks.randomCharacter({...options, source:ready,locks:['wear','body','skin','hair']});
    assert.deepEqual(toPlain(again.parts),toPlain(ready.parts));
    assert.equal(again.colors.skin,ready.colors.skin);
    assert.equal(again.colors.hair,ready.colors.hair);
    assert.equal(again.faceSurface,'linked');
    if (base !== 'baby') assert.notEqual(again.face.form,ready.face.form);
    faces.add(doc.face.form); rests.add(doc.face.restExpression); finishes.add(doc.portraitInk);
  }
  assert.deepEqual([faces.size,rests.size,finishes.size],[4,3,3]);
  const inks = {lipLine:1, upperLip:2, lipBody:3, lowerLip:4, lipGlow:5, lipPetal:6, lipCorner:7};
  const guide = surfaces.featureBrush('adult','cel'), row = styles.mouths.relaxed;
  const mouth = (rest,jaw) => surfaces.mouthBrush('adult',guide,'relaxed',row,1,1,
    surfaces.expression('adult',{mouth:'relaxed',restExpression:rest},null,jaw,'cel'));
  const closed = mouth('calm',0), open = mouth('curious',.8), smiling = mouth('warm',0);
  assert.ok(smiling.seam(.94)-smiling.seam(0) > closed.seam(.94)-closed.seam(0)+.035);
  assert.equal(open.paint(0,-.030,inks,.02),inks.lipLine,'opening follows the jaw under the crease');
  assert.notEqual(closed.paint(0,-.030,inks,.02),inks.lipLine);
  assert.equal(closed.paint(.995*closed.width,-.045,inks,.02),0,'lower lip tapers away before the corner');
  const warm = surfaces.expression('adult',{restExpression:'warm'},null,0,'cel');
  const gentle = surfaces.mouthBrush('adult',guide,'soft-smile',row,1,1,warm,true);
  const broad = surfaces.mouthBrush('adult',guide,'smile',row,1,1,warm,true);
  assert.ok(gentle.seam(.94)-gentle.seam(0) < broad.seam(.94)-broad.seam(0));
  assert.equal(gentle.paint(.85*gentle.width,gentle.seam(.85),inks,.02),inks.lipCorner);
  assert.equal(gentle.paint(.995*gentle.width,gentle.seam(.995),inks,.02),0,'no isolated tick at the smile corner');
  assert.equal(gentle.rim(0,0,true,inks),inks.upperLip);
  assert.equal(gentle.rim(0,0,false,inks),inks.lowerLip);
  assert.equal(gentle.rim(0,-.01,false,inks),0,'leave the open cavity to the jaw geometry');
  assert.equal(gentle.rim(0,.22,false,inks),0,'the lower-lip brush must stop before the chin');
  const actorColors = new Set();
  for (const ink of Object.keys(looks.portraitInks)) {
    const doc = looks.withPortraitInk(examples.adult,ink);
    doc.id = 'look_brush_'+ink;
    const before = looks.withoutPortraitInk(doc);
    assert.deepEqual(doc.parts,before.parts);
    assert.deepEqual(doc.shape,before.shape);
    const [a,b] = [before,doc].map(d=>looks.build(d)), action = motion.actions.get('walk');
    const pose = action.sample(.37,b)[0].pose, old = a.body.makePose(pose).colors, painted = b.body.makePose(pose).colors;
    assert.equal(mask(old),mask(painted),'side-part keeps its volume when brush changes');
    assert.notEqual(digest(old),digest(painted));
    actorColors.add(digest(painted));
    motion.characters.set(b.id,b);
    cast.setFrame(action.sample(.37,b));
    assert.ok(cast.group.getObjectByName(b.id).geometry.drawRange.count>0);
  }
  assert.equal(actorColors.size,3);
  const doc = looks.withPortraitInk(examples.adult,'line');
  assert.throws(()=>looks.prepare({...doc,portraitInk:'unknown'}));
  assert.throws(()=>looks.prepare({...doc,packs:{[looks.core]:looks.chinPadRelease}}));
  assert.throws(()=>looks.prepare({...doc,faceSurface:'unknown'}));
  assert.throws(()=>looks.prepare({...looks.withoutPortraitInk(doc),faceSurface:'linked'}));
  assert.equal(looks.randomCharacter({source:doc,seed:2602}).faceSurface,undefined);
  assert.equal(looks.randomFace(doc,{seed:2602}).faceSurface,undefined);
  const linked = looks.randomCharacter({base:'adult',seed:2601,ink:'auto'});
  const oldLayout = looks.withoutFaceSurface(linked);
  assert.deepEqual(toPlain(looks.withFaceSurface(oldLayout)),toPlain(linked));
  const regular = looks.withFaceSurface(linked,false);
  assert.throws(()=>looks.prepare({...oldLayout,spriteMouth:'accent'}));
  assert.throws(()=>looks.prepare({...linked,spriteMouth:'unknown'}));
  assert.equal(looks.prepare(regular).recipe.spriteMouth,undefined);
  assert.equal(looks.randomFace(regular,{seed:27}).spriteMouth,undefined);
  assert.equal(looks.randomCharacter({source:regular,seed:27}).spriteMouth,undefined);
  assert.equal(looks.randomCharacter({source:linked,seed:27}).spriteMouth,'accent');
  for (const base of ['adult','child','toddler','baby']) {
    const previous = looks.randomCharacter({base,seed:2602,ink:'auto'});
    const contour = looks.withFaceSurface(previous,undefined,'contour');
    assert.deepEqual(toPlain(looks.withFaceSurface(contour,true,'linked')),toPlain(previous));
    assert.equal(looks.randomFace(contour,{seed:29}).faceSurface,'contour');
    assert.equal(looks.randomCharacter({source:contour,base,seed:29}).faceSurface,'contour');
    const [a,b] = [previous,contour].map(doc=>looks.build(doc));
    for (const key of ['noseTip','rightEye','leftEye','rightJawJoint','leftEarCanal','seat'])
      assert.deepEqual(a.sockets[key],b.sockets[key],base+' fixed reference '+key);
    if (base === 'baby') assert.deepEqual(a.sockets.chinTip,b.sockets.chinTip,'the infant retains its own chin cushion');
    else assert.notDeepEqual(a.sockets.chinTip.point,b.sockets.chinTip.point,base+' chin socket follows the new pad');
    const poses = motion.actions.get('open-mouth').sample(.43,b);
    motion.characters.set(b.id,b);
    cast.setFrame(poses);
    assert.ok(cast.group.getObjectByName(b.id).geometry.drawRange.count>0);
  }
  const sprite = looks.build(linked), neutral = motion.actions.get('idle').sample(.17,sprite);
  const band = motion.figureLayers(sprite,neutral[0].pose,sprite.body.makePose(neutral[0].pose)).at(-1);
  const full = band.model, small = band.body.modelAtScale(full,.8,Math.PI/2,0);
  assert.notEqual(small,full);
  assert.equal(mask(small.colors),mask(full.colors),'pigment must preserve occupancy and occlusion');
  assert.notEqual(digest(small.colors),digest(full.colors));
  assert.equal(band.body.modelAtScale(full,8,Math.PI/2,0),full);
  assert.equal(band.body.modelAtScale(full,.8,0,0),full);
  motion.characters.set(sprite.id,sprite);
  cast.setDetail('figure');
  cast.setFrame(neutral);
  const mesh = cast.group.getObjectByName(sprite.id+'/face');
  const appearance = () => digest(mesh.geometry.attributes.color.array.subarray(0,mesh.geometry.drawRange.count*2));
  const portrait = appearance();
  assert.equal(cast.setPixelScale(.8,Math.PI/2,0),true);
  assert.notEqual(appearance(),portrait);
  assert.equal(cast.setPixelScale(.81,Math.PI/2,0),false);
  assert.equal(cast.setPixelScale(undefined),true);
  assert.equal(appearance(),portrait,'Three.js restores the exact portrait colors');
  assert.throws(()=>cast.setPixelScale(0));
  const bake = (recipe,key,value) => {
    const a = looks.build({...recipe,shape:{...recipe.shape,[key]:value}});
    const pose = motion.actions.get('idle').sample(.17,a)[0].pose;
    return mask(motion.figureLayers(a,pose,a.body.makePose(pose)).at(-1).model.colors);
  };
  // Only the opaque head cells count. Moving colour over an identical face
  // cannot pass the test for a responsive orbital socket or dental arch.
  for (const [field,lo,hi] of [['eyeSpacing',.9,1.1],['eyeWidth',-.6,.6],['mouthWidth',-.6,.6]]) {
    assert.equal(bake(oldLayout,field,lo),bake(oldLayout,field,hi),'original surface at '+field);
    assert.notEqual(bake(linked,field,lo),bake(linked,field,hi),'linked surface at '+field);
  }
  console.log('Four ages, 128 repeatable brush recipes, independent infant nose and chin, locks, moving cells and Three.js passed');
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
  checkClothing(cast);
  checkFeatureStudy(cast);
  checkFigureRatios(cast);
  checkFacialActing(cast);
  checkGarmentFits(cast);
  checkInfantChin(cast);
  checkPortraitBrushes(cast);
  checkOrdinaryFaces(cast);
  checkStoryFaces(cast);
  console.log('Four garment ages, 128 reproducible wardrobes, fits and wear locks, shared face pixels, short hems, dyes, floor contacts and Three.js passed');
  console.log('Four ages, 128 reversible acting recipes, bilateral gaze, closed lids, prop tracking, planted feet and Three.js passed');
  console.log('Four ages, 128 reproducible ratio fits, independent head and trunk controls, neutral archived meshes, locks and Three.js passed');
  console.log('Four painted ages, both clothing cuts, archived styles, 96 seeded pairs, blinks, lip/eye/skin dyes, drinking contacts and Three.js passed');
  cast.dispose();
  assert.equal(distinct.size, 4);
  console.log('Matched garments, joint contacts, faces, planted feet, dyes, 32 full-character seeds and Three.js passed for the four 1.19.5 ages');
  console.log(
    'Four ages, 12 new drawn bases, both generations of 128 seeded recipes, archived cells, morph endpoints, blinks, dyes, grounded infant rest, sockets and Three.js meshes passed'
  );
}
check().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
