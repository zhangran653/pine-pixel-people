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
  'appearance'
];
const files = builtins.map((name) => join(__dirname, name + '.js'));
for (const path of [...files, ...process.argv.slice(2).map((arg) => resolve(arg))]) {
  vm.runInContext(readFileSync(path, 'utf8'), context, { filename: path });
}

const motion = context.PineMotion;
// The six legacy actors cover the four rigs. Extensions supplied to the checker are also exercised.
const people = [...motion.characters.values()].filter((p) => !context.PineLooks.templateById.has(p.id));
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
  for (const phase of phases) {
    const entries = plan.sample(phase * plan.duration);
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
  const actor = motion.characters.get(id);
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
  first.forEach((e, i) => assert.ok(distance(keys(e), keys(last[i])) < 1e-6, id + ' does not loop'));
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
