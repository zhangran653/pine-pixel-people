// Run with Node. Additional character or action scripts can be passed in registration order.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({});
const builtins = [
  'motion',
  'character-slices',
  'actor',
  'surveyor-art',
  'family-art',
  'studio-props',
  'studio-rig',
  'studio-actions',
  'duet-clips',
  'studio-library'
];
const files = builtins.map((name) => join(__dirname, name + '.js'));
for (const path of [...files, ...process.argv.slice(2).map((arg) => resolve(arg))]) {
  vm.runInContext(readFileSync(path, 'utf8'), context, { filename: path });
}

const motion = context.PineMotion;
const people = [...motion.characters.values()];
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
