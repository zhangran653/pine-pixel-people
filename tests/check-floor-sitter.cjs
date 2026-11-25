// Run with node tests/check-floor-sitter.cjs. Exercise the same clips and body
// builders as the atelier, including floor-seated gestures outside studio-actions.
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const vm = require('node:vm');
const read = file => readFileSync(resolve(__dirname, '..', file), 'utf8');
const context = vm.createContext({structuredClone});
for (const [,file] of read('figure-study.html').matchAll(/<script defer src="([^"]+\.js)"/g)) {
  if (file === 'studio-stage.js') break;
  if (file !== 'workspace.js') vm.runInContext(read(file), context, {filename:file});
}
const looks = context.PineLooks, motion = context.PineMotion;
const examples = vm.runInContext('pineFigureModels', context);
const rig = vm.runInContext('studioRig', context);
const model = (doc, pin, shape = {}) => looks.build({...doc, packs:{'pine-core':pin}, shape:{...doc.shape,...shape}});
const sample = (actor, clip, phase) => motion.actions.get(clip).sample(phase, actor)[0].pose;
const distance = (a,b) => Math.hypot(...a.map((v,i) => v-b[i]));
const near = (a,b) => assert.ok(Math.abs(a-b) < 1e-6, a+' vs '+b);

for (const shape of [{}, {height:.75, shoulders:1.35, arms:.8, legs:1.25},
  {height:1.3, shoulders:.7, arms:1.25, legs:.8}]) {
  const baby = model(examples.baby, '1.19.2', shape), r = baby.rig;
  for (const action of ['idle','sit','sway','wave','baby-reach']) {
    for (const phase of [0,.25,.5,.75,1]) {
      const p = sample(baby, action, phase);
      assert.equal(p.floorSeat, true, action);
      const hip = rig.point(p.torso, r.pelvis);
      assert.ok(hip[2] < .12*r.height && hip[2] > .08*r.height, 'low, supported pelvis');
      assert.ok(hip[0] < Math.min(...p.feet.map(q=>q[0])), 'seat behind heels');
      assert.ok(p.feet[0][0] - p.feet[1][0] > .4*(r.thigh+r.shin), 'heels separate in profile');
      for (const [i,leg] of p.legs.entries()) {
        near(distance(leg.hip,leg.knee), r.thigh);
        near(distance(leg.knee,p.feet[i]), r.shin);
        near(p.feet[i][2], r.ankle);
        if (action !== 'baby-reach') // reaching down to the toy can touch a shoe
          assert.ok(p.arms[i].hand[2] - r.ankle > .095*r.height, 'palette-independent hand/ankle clearance');
      }
      const far = rig.seatedAnkle(r,p,0), tucked = rig.seatedAnkle(r,p,1);
      assert.ok(far.pitch > tucked.pitch && Math.abs(far.yaw) < Math.abs(tucked.yaw));
    }
  }
  assert.equal(sample(baby,'crawl',.33).floorSeat, undefined);
  const kick = sample(baby,'baby-kicks',.125);
  assert.ok(Math.max(...kick.feet.map(q=>q[2])) > r.ankle);
}

// A limb part changes the actual clothed outer surface without moving a joint.
for (const age of ['adult','child','baby']) {
  const clothed = bulk => {
    const doc = {...examples[age], anatomyParts:{legs:bulk,arms:bulk}};
    const actor = model(doc,'1.19.2'), pose = sample(actor,'idle',.4);
    const occupied = actor.body.makePose(pose).colors.reduce((n,v)=>n+Number(v!==0),0);
    return {pose, occupied};
  };
  const slender = clothed('slender'), strong = clothed('strong');
  assert.deepEqual(strong.pose, slender.pose);
  assert.ok(strong.occupied > slender.occupied, age+' shoe/sleeve binding');
}

// Full-body, face and garment voxels from ce69732. A shared helper change must
// leave each archived 1.19.1 recipe identical, even when seated or gesturing.
const archived = {
  adult: 'e2bd82f06949405a827ea6483b81587409a5fe973abf11618f86398b21b3f13c',
  child: '50391c77ec0722b73bc3ec7a7536def9b292b902bf7b6cccd3da4700204a40f2',
  toddler: '3f4b103bf8af3cac3031290c8110c6645b4ba4eec22e7380570442d642f2ad6c',
  baby: 'f06aca59c2c642165f72a7609e8cb5b9c82fc88fa9c4936b457d1336669a54dd'
};
for (const [age, digest] of Object.entries(archived)) {
  const doc = age === 'toddler' ? looks.templateById.get('look_workshop_toddler') : examples[age];
  const actor = model(doc, '1.19.1'), hash = createHash('sha256');
  assert.equal(actor.rig.infantFloorSupport, undefined);
  for (const action of ['idle','sit','wave']) {
    const p = sample(actor,action,.42);
    for (const {model} of motion.figureLayers(actor,p,actor.body.makePose(p))) {
      const ink = model.colors;
      hash.update(new Uint8Array(ink.buffer,ink.byteOffset,ink.byteLength));
    }
  }
  assert.equal(hash.digest('hex'), digest, age);
}
console.log('Grounded infant poses, shared ankle frames and archived 1.19.1 pixels passed.');
