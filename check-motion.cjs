// Run with Node. Additional character or action scripts can be passed in registration order.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ structuredClone });
const builtins = [
  'motion',
  'character-slices',
  'actor',
  'surveyor-art',
  'family-art',
  'vehicle-slices',
  'world-objects', 'short-props',
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
  'motion-supplies', 'short-motion', 'everyday-short-clips', 'object-short-clips', 'workshop-short-clips', 'short-footwork', 'short-duets',
  'studio-library',
  'pixel-headwear',
  'pixel-portrait',
  'portrait-styles',
  'seasonal-wardrobe', 'wardrobe-patterns', 'hair-styles', 'infant-hair',
  'head-sections',
  'skull-core', 'head-shape', 'game-face',
  'short-hair',
  'collection-wardrobe', 'everyday-styles',
  'workshop-wear',
  'world-wardrobe', 'character-almanac', 'character-titles', 'character-collection',
  'figure-paint',
  'anatomy-core', 'designer-body',
  'appearance'
];
const files = builtins.map((name) => join(__dirname, name + '.js'));
let coreActions;
for (const path of [...files, ...process.argv.slice(2).map((arg) => resolve(arg))]) {
  vm.runInContext(readFileSync(path, 'utf8'), context, { filename: path });
  if (path===files.at(-1)) coreActions=new Set(context.PineMotion.actions.keys());
}

const motion = context.PineMotion;
// The six legacy actors cover the four rigs. Extensions supplied to the checker are also exercised.
const people = [...motion.characters.values()].filter((p) => !context.PineLooks.templateById.has(p.id));
const kitFor=vm.runInContext('motionSupplies.inventory',context);
const phases = [0, 0.15, 0.25, 0.375, 0.5, 0.625, 0.75, 0.85, 1];
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
let combinations = 0;

function vector(value, size, message) {
  assert.ok(Array.isArray(value) && value.length === size && value.every(Number.isFinite), message);
}

function checkCast(clip, cast) {
  const step = { action: clip.id, actors: cast.map((p) => p.id) };
  const plan = motion.compile({ version: 1, steps: [step] });
  const label = clip.id + ' / ' + step.actors.join(' + ');
  const observed=new Map();
  for (const phase of phases) {
    const time=phase*plan.duration, entries=plan.sample(time);
    if (coreActions.has(clip.id)) {
      const items=[...plan.scenery(time),...entries.flatMap(e=>e.pose.props)];
      const counts=new Map();
      for (const {kind} of items) if (kind!=='water') counts.set(kind,(counts.get(kind)||0)+1);
      for (const [kind,n] of counts) observed.set(kind,Math.max(observed.get(kind)||0,n));
    }
    assert.equal(entries.length, cast.length, label);
    entries.forEach(({ character, x, y, z, heading, pose }, i) => {
      assert.equal(character, cast[i].id, label);
      vector([x, y, z, heading], 4, label);
      vector(pose.torso, 12, label);
      vector(pose.head, 12, label);
      assert.equal(pose.legs.length, 2, label);
      assert.equal(pose.arms.length, 2, label);
      for (const side of [0, 1]) {
        const leg = pose.legs[side],
          arm = pose.arms[side];
        for (const v of [pose.feet[side], leg.hip, leg.knee, arm.shoulder, arm.elbow, arm.wrist, arm.hand]) {
          vector(v, 3, label);
        }
        if (coreActions.has(clip.id)) {
          const r = cast[i].rig;
          assert.ok(Math.abs(distance(arm.shoulder,arm.elbow)-r.upperArm) < 1e-5,label+' upper arm');
          assert.ok(Math.abs(distance(arm.elbow,arm.wrist)-r.forearm) < 1e-5,label+' forearm');
          assert.ok(Math.abs(distance(arm.wrist,arm.hand)-r.palm) < 1e-5,label+' palm');
          if (clip.id==='run' || clip.id==='walk') {
            const cosine = arm.elbow.reduce((sum,v,k)=>sum+(v-arm.shoulder[k])*(arm.wrist[k]-v),0)/(r.upperArm*r.forearm);
            assert.ok(clip.id==='run' ? cosine > -.20 && cosine < .45 : cosine > .75 && cosine < .995,label+' elbow flexion');
          }
        }
      }
    });
    if (phase === 0.5) {
      assert.deepEqual(entries, plan.sample(phase * plan.duration), label + ' 在相同时间的姿势不同');
      const [lead, partner] = entries.map((e) => e.contacts);
      if (clip.id === 'highfive') assert.ok(distance(lead.palm, partner.palm) < 0.01, label + ' 击掌未对齐');
      if (clip.id === 'cradle') {
        assert.ok(distance(lead.seatHand, partner.seat) < 0.01, label + ' 臀部支点未对齐');
        assert.ok(distance(lead.backHand, partner.back) < 0.01, label + ' 上背支点未对齐');
      }
    }
  }
  if (coreActions.has(clip.id)) {
    const listed=new Map(kitFor(clip,cast).map(({id,count})=>[id,count]));
    assert.deepEqual(observed,listed,label+' actual library items, including shared quantities');
  }
  combinations++;
}

for (const clip of motion.actions.values()) {
  for (const lead of people.filter((p) => motion.accepts(clip, 0, p))) {
    if (clip.roles.length === 1) checkCast(clip, [lead]);
    else
      for (const partner of people.filter((p) => motion.accepts(clip, 1, p)))
        checkCast(clip, [lead, partner]);
  }
}

for (const id of ['hiker', 'child', 'toddler']) {
  const active = motion.characters.get(id);
  const restFeet = motion.actions.get('idle').sample(0,active)[0].pose.feet;
  for (const u of phases) {
    const p = motion.actions.get('idle').sample(u,active)[0].pose;
    assert.deepEqual(p.feet,restFeet,id+' planted feet during the fitted idle');
    for (const [side,leg] of p.legs.entries()) {
      const reach = distance(leg.hip,p.feet[side]) / (active.rig.thigh + active.rig.shin);
      assert.ok(reach > .96 && reach < 1,id+' fitted standing knee');
      assert.ok(Math.abs(distance(leg.knee,p.feet[side]) - active.rig.shin) < 1e-6);
    }
  }
  // The original actors used a symmetric stance. Replay its exact foot and knee contracts.
  const actor = context.PineLooks.build(context.PineLooks.archivedTemplates.get('look_workshop_'+id));
  const { rig } = actor;
  const sample = (action, u) => motion.actions.get(action).sample(u, actor)[0].pose;
  const extension = (pose, i) => distance(pose.legs[i].hip, pose.feet[i]) / (rig.thigh + rig.shin);
  for (const u of phases) {
    const pose = sample('idle', u);
    pose.legs.forEach(({ hip, knee }, i) => {
      const foot = pose.feet[i],
        reach = extension(pose, i);
      // A relaxed knee must stay close to full reach without locking during the breath.
      assert.ok(reach > 0.96 && reach < 0.995, id + ' 自然站姿膝角');
      assert.deepEqual([...foot], [0, (i ? 1 : -1) * rig.hip[1], rig.ankle]);
      assert.ok(Math.abs(distance(hip, knee) - rig.thigh) < 1e-6);
      assert.ok(Math.abs(distance(knee, foot) - rig.shin) < 1e-6);
    });
  }
  const rest = sample('idle', 0);
  for (const action of ['walk', 'run', 'jump', 'sitdown']) {
    for (const u of [0, 1]) {
      const pose = sample(action, u);
      pose.legs.forEach(({ knee }, i) => assert.ok(distance(knee, rest.legs[i].knee) < 1e-6, action));
    }
  }
  for (const [action, u] of [
    ['sit', 0.5],
    ['jump', 0.15],
    ['run', 0.25]
  ]) {
    const pose = sample(action, u);
    assert.ok(
      pose.legs.some((_, i) => extension(pose, i) < 0.9),
      id + ' ' + action + ' 应能充分屈膝'
    );
  }
}

// Each edition adds clips to the same registry. Exercise continuity, planted feet and real object contacts.
const added = vm.runInContext(
  '[...gestureActions,...movementActions,...dailyActions,...socialActions].map(v=>v.id)',
  context
);
const original = [
  'idle',
  'walk',
  'run',
  'jump',
  'crawl',
  'sit',
  'sitdown',
  'sway',
  'wave',
  'clap',
  'drink',
  'phone',
  'type',
  'highfive',
  'cradle',
  'peekaboo'
];
for (const id of original) assert.ok(motion.actions.has(id));
const rigAPI = motion.rig;
// A contact fixes the hand. Turning or leaning the torso must carry the whole
// shoulder/elbow/wrist plane with it, at every age and on both sides.
for (const r of Object.values(rigAPI.profiles)) {
  const length = r.upperArm + r.forearm + r.palm;
  const neutral = rigAPI.pose(r);
  const turn = {yaw:.71, pitch:.25, roll:-.17, hipOffset:[.4,.7,-.2]};
  const frame = rigAPI.pose(r,turn).torso;
  for (const offset of [[.10,.15,-.945],[.48,-.27,-.19],[.21,.52,.66],[-.19,-.12,.34],[0,1,0],[0,0,1]]) {
    const hands = neutral.arms.map(({side,shoulder}) =>
      shoulder.map((v,k)=>v+length*offset[k]*(k===1 ? side : 1)));
    const straight = rigAPI.pose(r,{hands});
    const rotated = rigAPI.pose(r,{...turn, hands:hands.map(p=>rigAPI.point(frame,p))});
    for (const [i,arm] of straight.arms.entries()) {
      for (const key of ['shoulder','elbow','wrist','hand'])
        assert.ok(distance(rotated.arms[i][key],rigAPI.point(frame,arm[key])) < 1e-6, key+' follows torso');
      assert.ok(distance(arm.hand,hands[i]) < 1e-6);
      for (const [start,end,size] of [['shoulder','elbow',r.upperArm],['elbow','wrist',r.forearm],['wrist','hand',r.palm]])
        assert.ok(Math.abs(distance(arm[start],arm[end])-size) < 1e-6, start+' length');
      assert.ok(Math.abs(Math.hypot(...arm.thumb)-1) < 1e-7);
      assert.ok(Math.abs(arm.thumb.reduce((sum,v,k)=>sum+v*(arm.hand[k]-arm.wrist[k]),0)) < 1e-7);
    }
    const [right,left] = straight.arms;
    assert.ok(distance(right.elbow,[left.elbow[0],-left.elbow[1],left.elbow[2]]) < 1e-6);
  }
  const shoulder = neutral.arms[0].shoulder;
  const folded = rigAPI.pose(r,{hands:[shoulder]}).arms[0];
  assert.ok(Math.abs(distance(folded.wrist,folded.elbow)-r.forearm) < 1e-6);
  const target = [shoulder[0]+.65*length,shoulder[1],shoulder[2]];
  const custom = rigAPI.pose(r,{hands:[target],elbowPoles:[[0,0,1]]}).arms[0];
  assert.ok(custom.elbow[2] > shoulder[2] && distance(custom.hand,target) < 1e-7);
  const parallel = rigAPI.pose(r,{hands:[target],elbowPoles:[[1,0,0]]}).arms[0];
  assert.ok(Math.abs(distance(parallel.elbow,shoulder)-r.upperArm) < 1e-6);
}
{
  const actor = motion.characters.get('look_silkloom_dye'), r = actor.rig;
  for (const id of ['walk','run','clap','type','carry-box','tuck-hair','turn-collar','adjust-strap','gather-ponytail','wave']) {
    const clip = motion.actions.get(id);
    let previous, spread = 0;
    for (let n=0;n<=240;n++) {
      const pose = clip.sample(n/240,actor)[0].pose;
      const arms = pose.arms.map((arm,i)=>{
        const d = arm.elbow.map((v,k)=>(v-arm.shoulder[k])/r.upperArm);
        const m = pose.torso, local = [0,1,2].map(k=>m[k]*d[0]+m[k+4]*d[1]+m[k+8]*d[2]);
        spread = Math.max(spread,arm.side*local[1]);
        if (previous) {
          assert.ok(distance(local,previous[i].elbow) < .25,id+' elbow jumped at '+n);
          assert.ok(distance(arm.thumb,previous[i].thumb) < .32,id+' palm flipped at '+n);
        }
        return {elbow:local, thumb:arm.thumb};
      });
      previous = arms;
    }
    if (['walk','run','clap','type','carry-box'].includes(id)) assert.ok(spread < .40,id+' flared at the shoulder');
    if (id==='wave') assert.ok(spread > .70,'a deliberately raised elbow must clear the shoulder');
  }
}
const anchor = (obj, local) =>
  rigAPI.point(
    obj.frame,
    local.map((v) => v * obj.scale)
  );
for (const id of added) {
  const clip = motion.actions.get(id),
    lead = people.find((a) => motion.accepts(clip, 0, a)),
    cast = motion.castFor(clip, lead);
  const first = clip.sample(0, ...cast),
    last = clip.sample(1, ...cast);
  const keys = (e) => [
    e.x,
    e.y,
    e.z,
    Math.cos(e.heading),
    Math.sin(e.heading),
    ...e.pose.head,
    ...(e.pose.jaw || e.pose.head),
    ...e.pose.torso,
    ...e.pose.arms.flatMap((arm) => [...arm.hand, ...arm.elbow]),
    ...e.pose.feet.flat()
  ];
  if (!clip.transition) first.forEach((e, i) => assert.ok(distance(keys(e), keys(last[i])) < 1e-6, id + ' does not loop'));
  assert.ok(
    [0.16, 0.3, 0.47, 0.65, 0.79].some((u) =>
      clip.sample(u, ...cast).some((e, i) => distance(keys(e), keys(first[i])) > 0.01)
    ),
    id + ' stayed still'
  );
}
for (const id of ['sidestep', 'backstep', 'quiet-walk', 'march', 'pivot', 'skip', 'dance-step']) {
  const actor = motion.characters.get('child'),
    clip = motion.actions.get(id),
    beats = id === 'pivot' ? 16 : 8;
  for (let step = 0; step < beats; step++) {
    const marks = [0.18, 0.48, 0.8].map((t) => {
      const e = clip.sample((step + t) / beats, actor)[0];
      return e.pose.feet.map((foot) => rigAPI.world(e, foot));
    });
    assert.ok(
      [0, 1].some((i) =>
        marks.slice(1).every((m) => distance(m[i].slice(0, 2), marks[0][i].slice(0, 2)) < 1e-7)
      ),
      id + ' sliding support'
    );
  }
}
const adult = motion.characters.get('surveyor'),
  kid = motion.characters.get('child'),
  baby = motion.characters.get('baby');
// An authored action is a short independent cue. A score can still deliberately
// slow a cue down, including old files that used a 17-second stair round trip.
const shortIds=vm.runInContext('[...everydayShortClips,...objectShortClips,...workshopShortClips,...shortFootwork,...shortDuets].map(c=>c.id)', context);
assert.ok(motion.actions.size>=500);
assert.throws(()=>motion.registerAction({id:'quality-overlong',label:'时长检查',seconds:10.01,roles:[['adult']],sample:()=>[]}),/10/);
assert.equal(motion.compile({version:1,steps:[{action:'climb-stairs',actors:[adult.id],seconds:17}]}).duration,17);
assert.ok(motion.findActions(baby,{people:'pair',domain:'together',eitherRole:true}).some(c=>c.id==='family-hear-bell'));
assert.ok(!motion.findActions(baby,{group:'桌面操作'}).length);
const supplies=motion.prepareAction('family-hear-bell',{actor:'baby'});
assert.deepEqual([...supplies.step.actors],['mother','baby']);
assert.deepEqual(Array.from(supplies.items,i=>i.id),['rattle']);
assert.equal(motion.prepareAction('family-learn-fan').items.find(i=>i.id==='fan').count,2);
assert.deepEqual(Array.from(motion.prepareAction('stamp-form').items,i=>i.id),['desk','chair','clipboard','stamp']);
const bare=[...motion.characters.values()].find(p=>p.recipe?.base==='adult' && !p.recipe.parts.glasses);
const dressed=motion.prepareAction('adjust-glasses',{actor:bare});
assert.ok(dressed.wear[0].borrowed && !bare.recipe.parts.glasses);
const glassesFrame=motion.actions.get('adjust-glasses').sample(.5,bare)[0];
assert.equal(motion.performer(bare,glassesFrame.pose).recipe.parts.glasses,'round');
assert.equal(motion.performer(bare,motion.actions.get('idle').sample(.5,bare)[0].pose),bare);
const own=[...motion.characters.values()].find(p=>p.recipe?.base==='adult' && p.recipe.parts.glasses);
assert.equal(motion.prepareAction('adjust-glasses',{actor:own}).wear[0].borrowed,false);
const libraryWorld=context.PineWorld, matching=motion.prepareAction('stamp-form',{actor:adult,scene:[
  libraryWorld.place('desk',31,17),libraryWorld.place('desk',3,1)]});
assert.equal(matching.step.target,1);
const jumping=motion.prepareAction('puddle-hop',{actor:kid}), puddlePlan=motion.compile({version:1,steps:[jumping.step]});
assert.equal(puddlePlan.scenery(0)[0].kind,'puddle');
assert.deepEqual(puddlePlan.scenery(0),puddlePlan.scenery(puddlePlan.duration*.52));
assert.ok(puddlePlan.sample(puddlePlan.duration*.52)[0].z>2);
const rainyStreet=[libraryWorld.place('puddle',28,-13,0,1.2)];
const atWater=motion.prepareAction('puddle-hop',{actor:kid,scene:rainyStreet}).step;
const onStreet=motion.compile({version:1,steps:[atWater],scene:rainyStreet});
assert.equal(atWater.target,0); assert.equal(onStreet.scenery(1).length,1);
const localPuddle=motion.stageFor(motion.actions.get('puddle-hop'),[kid])[0], start=onStreet.sample(0)[0];
assert.ok(distance(rigAPI.world(start,[localPuddle.x,localPuddle.y,localPuddle.z]),[28,-13,0])<1e-7);
for(const [id,kind] of [['hang-cloth','cloth'],['hook-keys','keyring'],['mark-trail','ribbon']]) {
  const clip=motion.actions.get(id), end=clip.sample(1,adult)[0].pose, mounted=end.props.find(p=>p.kind===kind);
  assert.deepEqual(mounted.frame,clip.sample(.88,adult)[0].pose.props.find(p=>p.kind===kind).frame);
  assert.ok(distance(end.arms[0].hand,anchor(mounted,[0,0,0]))>2,id+' hand must let go');
}
const fingerprints=new Map(), {createHash}=require('node:crypto');
for (const id of shortIds) {
  const clip=motion.actions.get(id), cast=motion.castFor(clip,people.find(p=>motion.accepts(clip,0,p)));
  const signature=createHash('sha256');
  const joints=frame=>frame.flatMap(e=>[e.x,e.y,e.z,...e.pose.head,...e.pose.torso,...e.pose.feet.flat(),...e.pose.arms.flatMap(a=>a.hand)]);
  for (const u of [0,.23,.46,.67,.83,1]) {
    const frame=clip.sample(u,...cast);
    signature.update(JSON.stringify([joints(frame),frame.flatMap(e=>e.pose.props.map(p=>[p.kind,p.frame]))]));
  }
  const fingerprint=signature.digest('hex');
  assert.ok(!fingerprints.has(fingerprint),id+' duplicates '+fingerprints.get(fingerprint));
  fingerprints.set(fingerprint,id);
  if (!clip.transition) assert.ok(distance(joints(clip.sample(0,...cast)),joints(clip.sample(1,...cast)))<1e-6,id+' loop seam');
}
for (const [arrival,departure] of [['take-seat','rise-from-seat'],['lower-to-knee','rise-from-knee'],['ascend-stairs','turn-on-landing'],['turn-on-landing','descend-stairs']]) {
  const end=motion.actions.get(arrival).sample(1,adult)[0],start=motion.actions.get(departure).sample(0,adult)[0];
  assert.ok(Math.abs(end.z-start.z)<1e-8 && distance(end.pose.feet.flat(),start.pose.feet.flat())<1e-8,arrival+' cue boundary');
}
for(const clip of motion.findActions(adult,{group:'双人交接'})) for(const cast of [[adult,kid],[kid,adult]]) {
  const shared=u=>{
    const entries=clip.sample(u,...cast),owners=entries.filter(e=>e.pose.props.length);
    assert.equal(owners.length,1,clip.id);
    const e=owners[0], item=e.pose.props[0];
    return {owner:e.character, points:[[0,0,0],[1,0,0],[0,1,0]].flatMap(p=>rigAPI.world(e,anchor(item,p)))};
  };
  const a=shared(.51-1e-7),b=shared(.51);
  assert.notEqual(a.owner,b.owner,clip.id);
  assert.ok(distance(a.points,b.points)<1e-5,clip.id+' object jumped at release');
}
for(const id of ['threshold','grapevine-step','ankle-circle']) {
  const clip=motion.actions.get(id), sample=u=>{const e=clip.sample(u,adult)[0];return e.pose.feet.map(p=>rigAPI.world(e,p));};
  for(const t of [.07,.27,.53,.81]) {
    const a=sample(t),b=sample(t+.005);
    assert.ok(a.some((p,i)=>distance(p,b[i])<1e-7),id+' needs a planted foot');
  }
}
const sitter=context.PineLooks.build(context.PineLooks.templateById.get('look_dawn_baby'));
assert.ok(motion.actions.get('baby-find-feet').sample(.53,sitter)[0].pose.floorSeat);
const scrollMark=u=>motion.actions.get('ink-hook').sample(u,adult)[0].pose.props.find(p=>p.kind==='scroll').inkPath;
assert.equal(scrollMark(0),undefined);assert.ok(scrollMark(1).length>=3);
const poseAt = (id, u, person = adult) => motion.actions.get(id).sample(u, person)[0].pose;
for (const [actor, id, u, kind] of [
  [adult, 'read', 0.5, 'book'],
  [adult, 'write', 0.47, 'pen'],
  [adult, 'photograph', 0.5, 'camera'],
  [adult, 'brush-teeth', 0.5, 'brush'],
  [adult, 'comb', 0.44, 'comb'],
  [adult, 'eat', 0.52, 'spoon'],
  [adult, 'stir', 0.35, 'bowl'],
  [adult, 'carry-box', 0.32, 'parcel'],
  [adult, 'sweep', 0.5, 'broom'],
  [adult, 'water-plant', 0.5, 'plant'],
  [adult, 'water-plant', 0.5, 'wateringCan'],
  [adult, 'water-plant', 0.5, 'water'],
  [adult, 'guitar', 0.38, 'guitar'],
  [kid, 'bounce-ball', 0.25, 'ball'],
  [baby, 'rattle', 0.38, 'rattle'],
  [baby, 'toy-drum', 0.27, 'drum'],
  [kid, 'recline', 0.5, 'mat']
]) {
  const p = poseAt(id, u, actor),
    visible = actor.body.makePose(p),
    other = actor.body.makePose({ ...p, props: p.props.filter((v) => v.kind !== kind) });
  assert.ok(
    visible.colors.some((c, i) => c !== other.colors[i]),
    id + ' invisible ' + kind
  );
}
for (const u of [0.1, 0.33, 0.5, 0.72, 0.94]) {
  const p = poseAt('write', u),
    book = p.props.find((v) => v.kind === 'book'),
    pen = p.props.find((v) => v.kind === 'pen');
  assert.ok(
    distance(
      anchor(pen, [0.4, 0, -1.94]),
      anchor(book, [-1.18 + 0.54 * Math.sin(8 * Math.PI * u), -2.41 + 0.61 * Math.sin(4 * Math.PI * u), 1.02])
    ) < 1e-6
  );
  const sweep = poseAt('sweep', u),
    broom = sweep.props[0];
  assert.ok(distance(anchor(broom, [0, 0, -0.07]), sweep.arms[0].hand) < 1e-6);
  assert.ok(distance(anchor(broom, [0, 0, 3.25]), sweep.arms[1].hand) < 1e-6);
}
const garden = poseAt('water-plant', 0.5),
  plant = garden.props[0],
  stream = garden.props[2];
assert.ok(distance(anchor(stream, [0, 0, -stream.length]), anchor(plant, [0, 0, 3.94])) < 1e-6);
const meal = poseAt('eat', 0.5);
assert.ok(distance(rigAPI.socket(adult, meal, 'mouth'), anchor(meal.props[2], [0, 2.56, 0.19])) < 1e-6);
for (const u of [0.27 - 1e-7, 0.27, 0.5, 0.73, 0.73 + 1e-7]) {
  const pair = motion.actions.get('handover').sample(u, adult, kid),
    owners = pair.filter((e) => e.pose.props.length);
  assert.equal(owners.length, 1);
  const owner = owners[0],
    gift = owner.pose.props[0];
  if (u !== 0.5)
    for (const [i, e] of pair.entries())
      assert.ok(
        distance(e.contacts.palm, rigAPI.world(owner, anchor(gift, [i ? 2.84 : -2.84, 0, 0]))) < 1e-6
      );
}
for (const u of phases) {
  const pair = motion.actions.get('hold-hands').sample(u, adult, kid);
  assert.ok(distance(pair[0].contacts.palm, pair[1].contacts.palm) < 1e-6);
  const rolling = motion.actions.get('roll-ball').sample(u, adult, baby);
  assert.equal(rolling.filter((e) => e.pose.props.length).length, 1);
}
assert.equal(motion.findActions(kid, { query: '摄影' })[0].id, 'photograph');
assert.equal(motion.findActions(kid, { query: '用手机' })[0].id, 'phone');
assert.equal(motion.findActions(adult, { query: '走路' })[0].id, 'walk');
assert.equal(motion.findActions(adult, { group: '家务', query: 'sweep' })[0].id, 'sweep');
assert.ok(!motion.findActions(baby, { query: '摄影' }).length);
assert.deepEqual(
  [...motion.castFor(motion.actions.get('hold-hands'), kid, adult)].map((a) => a.id),
  ['surveyor', 'child']
);
assert.deepEqual(
  [...motion.castFor(motion.actions.get('roll-ball'), kid, adult)].map((a) => a.id),
  ['surveyor', 'child']
);
for (const keys of [
  [{ at: 0 }, { at: 0 }],
  [{ at: 0 }, { at: 1, right: [0, NaN, 0] }],
  [{ at: 0 }, { at: 1, unknown: true }]
]) {
  assert.throws(() => motion.keyframedGesture(keys));
}
for (const key of Object.keys(motion.presetLabels))
  assert.ok(motion.compile(motion.presets[key]).duration > 0);
const example = motion.compile(readFileSync(join(__dirname, 'family-score.json'), 'utf8'));
assert.equal(example.locate(example.duration).u, 1);
const repeated = motion.compile({
  version: 1,
  steps: [
    { action: 'wave', actors: ['child'], seconds: 1.234 },
    { action: 'jump', actors: ['toddler'], seconds: 0.1, repeat: 5 }
  ]
});
const boundary = repeated.locate(repeated.starts[1] + 2 * 0.1);
assert.equal(boundary.iteration, 2);
assert.equal(boundary.u, 0);
assert.throws(() => motion.compile({ version: 1, steps: [{ action: 'run', actors: ['baby'] }] }));
console.log(
  'PineMotion v' +
    motion.version +
    ' · ' +
    people.length +
    ' 个人物 · ' +
    motion.actions.size +
    ' 个动作 · ' +
    combinations +
    ' 组动作与演员搭配通过检查'
);
