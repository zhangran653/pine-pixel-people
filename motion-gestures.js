// Authored in shoulder-relative reach and physical rig units, independent of the pixel art.
const activityMotion = (() => {
  const { pose, point, frame, mix, ramp } = studioRig;
  const sides = [-1, 1],
    zero = [0, 0, 0],
    tau = 2 * Math.PI;
  const span = (u, a, b, c, d) => ramp(u, a, b) * (1 - ramp(u, c, d));
  const blink = (u) => span(u, 0.68, 0.697, 0.711, 0.737);
  const between = (a, b, t) => a.map((n, i) => mix(n, b[i], t));
  const reach = (r) => r.upperArm + r.forearm + r.palm;
  const legacyRestArm = [0.1, 0.15, -0.945];
  const walking = ['adult', 'child', 'toddler'],
    school = ['adult', 'child'],
    small = ['baby', 'toddler'],
    everyone = [...walking, 'baby'];
  function entry(a, p, x = 0, y = 0, z = 0, heading = 0) {
    return { character: a.id, x, y, z, heading, pose: p };
  }
  function hand(r, body, i, target) {
    const length = reach(r),
      side = sides[i];
    return point(body.torso, [
      r.shoulder[0] + target[0] * length,
      side * (r.shoulder[1] + target[1] * length),
      r.shoulder[2] + target[2] * length
    ]);
  }
  // Free hands travel around the shoulder on the way to a collar, ear or nape.
  // Endpoints are exact, including when the two keys touch the same point.
  function swingHand(r, body, i, from, to, t) {
    const palm = between(from,to,t);
    if (t === 0 || t === 1 || r.archivedArmPose) return palm;
    const step = to.map((v,k)=>v-from[k]), span = Math.hypot(...step);
    if (!span) return palm;
    const shoulder = body.arms[i].shoulder, start = from.map((v,k)=>v-shoulder[k]);
    const along = studioRig.clamp(-start.reduce((sum,v,k)=>sum+v*step[k],0)/(span*span));
    const gap = Math.hypot(...start.map((v,k)=>v+along*step[k]));
    const length = reach(r);
    const bow = 4*t*(1-t) * Math.min(.55*length,.52*span) * (1-ramp(gap/length,.12,.36));
    const m = body.torso;
    return palm.map((v,k)=>v+bow*(.73*m[4*k]+sides[i]*.68*m[4*k+1]+.57*m[4*k+2]));
  }
  function prop(kind, at, scale, yaw = 0, pitch = 0, roll = 0) {
    return { kind, frame: frame(zero, at, yaw, pitch, roll), scale };
  }
  function contact(item, anchor) {
    return point(
      item.frame,
      anchor.map((v) => v * item.scale)
    );
  }
  function atGrip(kind, anchor, grip, scale, yaw = 0, pitch = 0, roll = 0) {
    const item = prop(kind, zero, scale, yaw, pitch, roll),
      offset = contact(item, grip);
    for (let i = 0; i < 3; i++) item.frame[i * 4 + 3] = anchor[i] - offset[i];
    return item;
  }
  function seatProp(r, ch) {
    return prop('stool', [ch.hipOffset[0], 0, r.height * 0.16], r.height / 50);
  }
  function base(a) {
    return a.tags.includes('baby') ? studioRig.seated(a.rig, true) : {};
  }
  function solo(id, label, group, seconds, allowed, sample, keywords = '') {
    return { id, label, group, seconds, roles: [allowed], sample, keywords };
  }
  // A key is an absolute pose. Neutral channels fill omitted values at that key.
  function gesture(keys) {
    // A free hand takes the actor's resting position, including a seated baby's lap.
    const defaults = { right: null, left: null, head: zero, body: zero, shift: zero };
    if (!Array.isArray(keys) || keys.length < 2 || keys[0]?.at !== 0 || keys[keys.length - 1]?.at !== 1)
      throw Error('手势关键帧须从 0 到 1');
    const frames = keys.map((key, i) => {
      if (
        !key ||
        typeof key !== 'object' ||
        Object.keys(key).some((k) => !['at', 'blink', 'jawOpen', 'gaze'].includes(k) && !Object.hasOwn(defaults, k))
      )
        throw Error('无效的手势关键帧字段');
      if (!Number.isFinite(key.at) || (i && key.at <= keys[i - 1].at)) throw Error('关键帧时间须严格递增');
      const next = { at: key.at, blink: key.blink ?? 0, jawOpen: key.jawOpen ?? 0, gaze:key.gaze ?? [0,0] };
      if (!Array.isArray(next.gaze) || next.gaze.length !== 2 || !next.gaze.every(v => Number.isFinite(v) && Math.abs(v) <= 1))
        throw Error('手势视线需要两个 -1 至 1 的数值');
      for (const name of ['blink', 'jawOpen']) {
        if (!Number.isFinite(next[name]) || next[name] < 0 || next[name] > 1)
          throw Error('面部动作通道须在 0 至 1 · ' + name);
      }
      for (const [name, neutral] of Object.entries(defaults)) {
        const v = key[name] ?? neutral;
        if (v === null) {
          next[name] = null;
          continue;
        }
        if (!Array.isArray(v) || v.length !== 3 || !v.every(Number.isFinite))
          throw Error('无效的手势通道 ' + name);
        next[name] = [...v];
      }
      return next;
    });
    return (u, a) => {
      const r = a.rig,
        ch = base(a);
      let end = 1;
      while (end < frames.length - 1 && u > frames[end].at) end++;
      const first = frames[end - 1],
        last = frames[end],
        w = ramp(u, first.at, last.at);
      const channel = (name) => between(first[name], last[name], w);
      const [yaw, pitch, roll] = channel('body'),
        [headYaw, headPitch, headRoll] = channel('head'),
        shift = channel('shift');
      ch.yaw = yaw;
      ch.pitch = (ch.pitch || 0) + pitch;
      ch.roll = roll;
      ch.headYaw = headYaw;
      ch.headPitch = (ch.headPitch || 0) + headPitch;
      ch.headRoll = headRoll;
      ch.hipOffset = (ch.hipOffset || zero).map((p, i) => p + shift[i] * r.height);
      ch.blink = Math.max(blink(u), mix(first.blink, last.blink, w));
      ch.jawOpen = mix(first.jawOpen, last.jawOpen, w);
      if (r.facialActing) ch.faceCue = { gaze:channel('gaze') };
      const rest = pose(r, ch);
      ch.hands = ['right','left'].map((name,i)=>{
        const target = v => {
          if (v === null || (ch.floorSeat && v.every((x,j)=>x===legacyRestArm[j]))) return rest.arms[i].hand;
          return hand(r,rest,i,v);
        };
        return swingHand(r,rest,i,target(first[name]),target(last[name]),w);
      });
      return [entry(a, pose(r, ch))];
    };
  }
  return {
    sides,
    zero,
    tau,
    span,
    blink,
    between,
    reach,
    hand,
    swingHand,
    prop,
    contact,
    atGrip,
    seatProp,
    base,
    entry,
    gesture,
    solo,
    walking,
    school,
    small,
    everyone
  };
})();

const gestureActions = (() => {
  const { gesture, solo, everyone, walking, school } = activityMotion;
  const group = '手势与情绪';
  const result = [];
  function add(id, label, section, seconds, roles, keys, keywords = '') {
    const frames = [{ at: 0 }, ...keys.map(([at, channels]) => ({ at, ...channels })), { at: 1 }];
    result.push(solo(id, label, section, seconds, roles, gesture(frames), keywords));
  }
  add(
    'open-mouth', '自然张合嘴', '日常', 2.8, ['mandible'],
    [
      [0.14, { jawOpen: 0 }],
      [0.48, { jawOpen: 1 }],
      [0.62, { jawOpen: 0.94 }],
      [0.94, { jawOpen: 0 }]
    ],
    '开口 张口 下颌骨 耳前关节 闭嘴'
  );
  add(
    'nod',
    '点头回应',
    group,
    2.1,
    everyone,
    [
      [0.18, { head: [0, -0.12, 0] }],
      [0.32, { head: [0, 0.32, 0] }],
      [0.48, { head: [0, -0.09, 0] }],
      [0.64, { head: [0, 0.23, 0] }]
    ],
    '同意 肯定'
  );
  add(
    'shake-head',
    '摇头',
    group,
    2.25,
    everyone,
    [
      [0.17, { head: [-0.34, 0, 0.045] }],
      [0.36, { head: [0.38, 0, -0.04] }],
      [0.57, { head: [-0.3, 0, 0.03] }],
      [0.78, { head: [0.21, 0, -0.02] }]
    ],
    '拒绝 否定'
  );
  add(
    'look-around',
    '左右张望',
    '日常',
    3.7,
    everyone,
    [
      [0.2, { gaze:[.82,.18], head: [0.56, -0.055, 0], body: [0.1, 0, 0] }],
      [0.39, { gaze:[.38,-.15], head: [0.53, 0.05, 0], body: [0.1, 0, 0] }],
      [0.65, { gaze:[-.86,.12], head: [-0.61, -0.04, 0.05], body: [-0.13, 0, 0] }],
      [0.79, { gaze:[-.38,.21], head: [-0.56, -0.08, 0.05], body: [-0.13, 0, 0] }]
    ],
    '寻找 观察 环顾'
  );
  const armsFolded = { right: [0.35, -0.56, -0.37], left: [0.41, -0.52, -0.24], body: [-0.04, 0, 0] };
  add(
    'fold-arms',
    '抱臂等候',
    '姿势与休息',
    4,
    walking,
    [
      [0.23, { right: armsFolded.right }],
      [0.39, armsFolded],
      [0.68, { ...armsFolded, head: [0.22, 0.02, -0.04] }],
      [0.81, armsFolded]
    ],
    '叉手 等人 站立'
  );
  const chin = { right: [0.39, -0.25, 0.22], left: [0.28, -0.42, -0.49], head: [-0.16, 0.15, -0.1] };
  add(
    'think',
    '托腮思考',
    group,
    3.8,
    school,
    [
      [0.25, chin],
      [0.48, { ...chin, head: [-0.22, -0.06, -0.09] }],
      [0.73, chin]
    ],
    '想事情 沉思'
  );
  const shrug = {
    right: [0.35, 0.53, -0.1],
    left: [0.35, 0.53, -0.1],
    head: [-0.1, 0, 0.18],
    body: [0, -0.04, 0]
  };
  add(
    'shrug',
    '摊手耸肩',
    group,
    2.6,
    walking,
    [
      [0.24, { ...shrug, head: [0, 0.1, 0] }],
      [0.41, shrug],
      [0.65, { ...shrug, left: [0.31, 0.62, -0.05] }]
    ],
    '困惑 疑问'
  );
  add(
    'point',
    '伸手指路',
    group,
    3.15,
    walking,
    [
      [0.19, { head: [-0.31, -0.02, 0], right: [0.37, 0.26, -0.24] }],
      [0.37, { head: [-0.45, -0.03, 0], body: [-0.18, 0, 0], right: [0.83, 0.46, 0.13] }],
      [0.71, { head: [-0.42, -0.015, 0], body: [-0.18, 0, 0], right: [0.85, 0.43, 0.09] }]
    ],
    '方向 指向'
  );
  const call = { right: [0.53, 0.34, 0.38], head: [-0.18, 0, 0.07] };
  add(
    'beckon',
    '招手示意过来',
    group,
    2.9,
    walking,
    [
      [0.16, call],
      [0.3, { ...call, right: [0.24, 0.06, 0.45] }],
      [0.45, call],
      [0.59, { ...call, right: [0.23, 0.05, 0.48] }],
      [0.74, call]
    ],
    '招呼 过来'
  );
  const bow = {
    right: [0.22, -0.34, -0.73],
    left: [0.21, -0.32, -0.77],
    body: [0, 0.43, 0],
    head: [0, 0.13, 0],
    shift: [-0.035, 0, -0.025]
  };
  add(
    'bow',
    '鞠躬致谢',
    group,
    3,
    walking,
    [
      [0.18, { right: [0.23, -0.34, -0.77], left: [0.23, -0.34, -0.73] }],
      [0.41, bow],
      [0.63, bow],
      [0.83, { right: [0.22, -0.34, -0.73], left: [0.21, -0.32, -0.77] }]
    ],
    '感谢 问候 礼貌'
  );
  const surprised = {
    right: [0.37, 0.08, 0.24],
    left: [0.38, 0.08, 0.24],
    head: [0, -0.19, 0],
    body: [0, -0.09, 0]
  };
  add(
    'surprise',
    '吃惊捧脸',
    group,
    2.45,
    everyone,
    [
      [0.21, { head: [0, 0.1, 0] }],
      [0.31, surprised],
      [0.46, { ...surprised, head: [0.14, -0.1, -0.07] }],
      [0.67, surprised]
    ],
    '惊讶 惊喜'
  );
  const laugh = { right: [0.39, -0.21, 0.15], left: [0.29, -0.39, -0.57], body: [0, 0.14, 0], blink: 0.79 };
  add(
    'laugh',
    '掩嘴大笑',
    group,
    2.95,
    everyone,
    [
      [0.18, laugh],
      [0.31, { ...laugh, body: [0, -0.02, 0.055] }],
      [0.45, laugh],
      [0.57, { ...laugh, body: [0, -0.03, -0.035] }],
      [0.72, laugh]
    ],
    '开心 高兴 笑'
  );
  const cheer = { right: [0.1, 0.48, 0.73], left: [0.1, 0.48, 0.73], head: [0, -0.13, 0] };
  add(
    'cheer',
    '举手欢呼',
    group,
    2.85,
    walking,
    [
      [0.18, { right: [0.34, 0.09, -0.19], left: [0.34, 0.09, -0.19], shift: [0, 0, -0.045] }],
      [0.32, cheer],
      [0.49, { ...cheer, right: [0.15, 0.44, 0.45], left: [0.15, 0.44, 0.45] }],
      [0.64, cheer],
      [0.77, { ...cheer, head: [0.14, -0.1, 0] }]
    ],
    '加油 庆祝'
  );
  const sad = { right: [0.36, -0.05, 0.3], head: [-0.12, 0.32, -0.12], body: [0, 0.1, -0.035] };
  add(
    'wipe-tears',
    '低头擦眼角',
    group,
    3.45,
    everyone,
    [
      [0.2, { head: [0, 0.31, 0], body: [0, 0.09, 0] }],
      [0.37, sad],
      [0.55, { ...sad, right: [0.34, 0.12, 0.3] }],
      [0.7, sad]
    ],
    '难过 伤心 哭'
  );
  const yawn = { right: [0.39, -0.23, 0.21], head: [0, -0.21, 0.04], blink: 0.92, jawOpen: 0.87 };
  add(
    'yawn',
    '掩口打哈欠',
    '日常',
    3.5,
    everyone,
    [
      [0.22, { right: [0.4, -0.1, -0.06], head: [0, 0.06, 0] }],
      [0.45, yawn],
      [0.64, yawn],
      [0.79, { ...yawn, head: [0, 0.1, 0], blink: 0.35, jawOpen: 0.25 }]
    ],
    '困倦 起床'
  );
  add(
    'check-watch',
    '抬腕看表',
    '现代生活',
    2.9,
    school,
    [
      [0.24, { left: [0.44, -0.34, -0.13], body: [0.07, 0.04, 0], head: [0.18, 0.27, 0] }],
      [0.47, { left: [0.43, -0.4, -0.11], right: [0.46, -0.47, -0.13], head: [0.19, 0.33, 0] }],
      [0.69, { left: [0.44, -0.34, -0.13], head: [0.14, 0.2, 0] }]
    ],
    '时间 手表'
  );
  const listen = { right: [0.08, 0.15, 0.43], body: [-0.11, 0.07, -0.05], head: [-0.1, 0, 0.22] };
  add(
    'listen',
    '侧耳倾听',
    group,
    3.1,
    walking,
    [
      [0.24, listen],
      [0.53, { ...listen, head: [-0.22, 0.03, 0.24] }],
      [0.76, listen]
    ],
    '听 说话'
  );
  const stretch = {
    right: [0.02, 0.22, 0.82],
    left: [0.02, 0.22, 0.82],
    head: [0, -0.16, 0],
    body: [0, -0.07, 0]
  };
  add(
    'wake-stretch',
    '伸懒腰',
    '姿势与休息',
    3.8,
    walking,
    [
      [0.2, { right: [0.18, 0.58, 0.05], left: [0.18, 0.58, 0.05] }],
      [0.39, stretch],
      [0.58, { ...stretch, body: [0, -0.04, 0.12], head: [0, -0.09, -0.06] }],
      [0.73, stretch]
    ],
    '苏醒 休息 伸展'
  );
  const side = {
    right: [0.07, 0.02, 0.88],
    left: [0.14, 0.12, -0.87],
    body: [0, 0, 0.27],
    head: [0, 0, 0.07],
    shift: [0, -0.025, -0.015]
  };
  add(
    'side-stretch',
    '侧身拉伸',
    '运动与舞蹈',
    4.35,
    school,
    [
      [0.24, side],
      [0.38, side],
      [0.5, { right: [0.1, 0.46, -0.14], left: [0.1, 0.46, -0.14] }],
      [
        0.64,
        {
          right: side.left,
          left: side.right,
          body: [0, 0, -0.27],
          head: [0, 0, -0.07],
          shift: [0, 0.025, -0.015]
        }
      ],
      [0.78, { right: side.left, left: side.right, body: [0, 0, -0.27] }]
    ],
    '热身 伸展 体育'
  );
  const raised = { right: [0.16, 0.26, 0.89], left: [0.15, 0.12, -0.89], head: [-0.11, -0.08, 0] };
  add(
    'raise-hand',
    '举手发言',
    '学习与工作',
    3.6,
    school,
    [
      [0.18, { right: [0.32, 0.28, 0.27] }],
      [0.34, raised],
      [0.55, { ...raised, head: [0.12, -0.05, 0] }],
      [0.75, raised]
    ],
    '课堂 回答 提问 报到'
  );
  return result;
})();
