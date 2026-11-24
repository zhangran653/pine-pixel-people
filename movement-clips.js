// Each travelling step fixes one footprint in the scene until the other foot lands.
const movementActions = (() => {
  const { pose, ramp, mix, clamp } = studioRig;
  const { sides, entry, solo, walking, school, blink, hand, span, seatProp, tau, between } = activityMotion;
  const routes = {
    sidestep: [
      [0, 0, 0],
      [0, -0.15, 0],
      [0, -0.29, 0],
      [0, -0.15, 0],
      [0, 0, 0]
    ],
    backstep: [
      [0, 0, 0],
      [-0.14, 0, 0],
      [-0.27, 0, 0],
      [-0.14, 0, 0],
      [0, 0, 0]
    ],
    'quiet-walk': [
      [0, 0, 0],
      [0.105, 0, 0],
      [0.2, -0.035, -0.23],
      [0.105, 0, 0],
      [0, 0, 0]
    ],
    march: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    pivot: Array.from({ length: 9 }, (_, i) => [0, 0, (i * Math.PI) / 4]),
    skip: [
      [0, 0, 0],
      [0.105, -0.025, 0],
      [0.21, 0, 0],
      [0.105, 0.025, 0],
      [0, 0, 0]
    ],
    'dance-step': [
      [0, 0, 0],
      [0, 0.135, -0.13],
      [0.033, 0, 0],
      [0, -0.135, 0.13],
      [0, 0, 0]
    ]
  };
  function footsteps(id, u, a) {
    const r = a.rig,
      h = r.height,
      route = routes[id],
      beats = (route.length - 1) * 2;
    const time = clamp(u) * beats,
      n = Math.min(beats - 1, Math.floor(time)),
      t = time - n;
    const station = Math.floor(n / 2),
      from = route[station],
      to = route[station + 1],
      second = n % 2;
    const lead = id === 'sidestep' || id === 'dance-step' ? (to[1] > from[1] ? 1 : 0) : 0,
      swing = second ? 1 - lead : lead;
    const ease = t * t * (3 - 2 * t),
      lift = Math.sin(Math.PI * t) ** 2,
      heading = mix(from[2], to[2], (second + ease) / 2);
    const mark = (p, side) => [
      p[0] * h - Math.sin(p[2]) * side * r.hip[1],
      p[1] * h + Math.cos(p[2]) * side * r.hip[1]
    ];
    const planted = sides.map((side, i) =>
      between(mark(from, side), mark(to, side), i === swing ? ease : second)
    );
    const x = (planted[0][0] + planted[1][0]) / 2,
      y = (planted[0][1] + planted[1][1]) / 2,
      c = Math.cos(heading),
      s = Math.sin(heading);
    const height =
      { march: 0.14, skip: 0.136, 'quiet-walk': 0.038, pivot: 0.057, 'dance-step': 0.085 }[id] || 0.072;
    const feet = planted.map(([px, py], i) => [
      (px - x) * c + (py - y) * s,
      -(px - x) * s + (py - y) * c,
      r.ankle + (i === swing ? h * height * lift : 0)
    ]);
    const active = span(u, 0, 0.085, 0.91, 1),
      weight = sides[swing] * lift,
      quiet = id === 'quiet-walk',
      dance = id === 'dance-step';
    const ch = {
      feet,
      standing: 1 - active,
      hipOffset: [0, -h * 0.015 * weight, -h * ((quiet ? 0.066 : 0.013) * active + 0.012 * lift)],
      pitch: (quiet ? 0.21 : id === 'backstep' ? -0.04 : 0.04) * active,
      roll: (dance ? 0.12 : 0.04) * weight,
      headYaw: (id === 'backstep' ? -0.32 : quiet ? 0.19 : 0) * active,
      headRoll: -0.026 * weight,
      blink: blink(u)
    };
    const rest = pose(r, ch);
    ch.hands = sides.map((side, i) => {
      let goal = [0.17 + side * weight * 0.36, 0.15, -0.83];
      if (quiet) goal = [0.44 + side * weight * 0.13, 0.14, -0.26];
      if (id === 'sidestep') goal = [0.26, 0.4 + 0.12 * side * weight, -0.56];
      if (id === 'pivot') goal = [0.31, 0.32 + 0.13 * side * weight, -0.57];
      if (id === 'skip') goal = [0.34, 0.29, -0.26 + 0.33 * weight * side];
      if (dance)
        goal = [0.31 + 0.13 * side * weight, 0.4 + 0.12 * side * weight, 0.03 + 0.53 * side * weight];
      return between(rest.arms[i].hand, hand(r, rest, i, goal), active);
    });
    const hop = id === 'skip' ? h * 0.084 * Math.sin(Math.PI * clamp((t - 0.2) / 0.8)) ** 2 : 0;
    return [entry(a, pose(r, ch), x, y, hop, heading)];
  }
  const clips = [];
  for (const [id, label, seconds, keys] of [
    ['sidestep', '侧步横移', 3.8, '并步 左右 移动'],
    ['backstep', '退步再回位', 3.55, '后退 倒走'],
    ['quiet-walk', '放轻脚步', 4.7, '慢走 轻步'],
    ['march', '原地高抬腿', 3.5, '踏步 热身'],
    ['pivot', '换脚原地转身', 4.4, '转圈 旋转 360'],
    ['skip', '交替蹦跳', 3.1, '跳步 跳跃'],
    ['dance-step', '左右律动舞步', 3.7, '跳舞 音乐 律动']
  ]) {
    clips.push({
      ...solo(
        id,
        label,
        id === 'dance-step' ? '运动与舞蹈' : '移动',
        seconds,
        walking,
        (u, a) => footsteps(id, u, a),
        keys
      ),
      previewTurn: id === 'pivot'
    });
  }
  function exercise(id, u, a) {
    const r = a.rig,
      h = r.height,
      phase = span(u, 0.03, 0.33, 0.65, 0.97),
      ch = { blink: blink(u) };
    let goals;
    if (id === 'squat') {
      const weight = 0.5 - 0.5 * Math.cos(2 * tau * u);
      ch.standing = 1 - weight;
      ch.hipOffset = [-0.064 * h * weight, 0, -0.153 * h * weight];
      ch.pitch = 0.32 * weight;
      ch.headPitch = -0.15 * weight;
      goals = sides.map(() => [0.12 + 0.72 * weight, 0.12, -0.93 + 0.84 * weight]);
    } else if (id === 'lunge' || id === 'kneel') {
      const step = span(u, 0, 0.21, 0.79, 1),
        lift = Math.sin(Math.PI * step) ** 2 * 0.084 * h,
        kneel = id === 'kneel';
      ch.feet = [
        [r.hip[0] + 0.18 * h * step, -r.hip[1], r.ankle + lift],
        [r.hip[0] - (kneel ? 0.15 : 0.115) * h * step, r.hip[1], r.ankle]
      ];
      ch.standing = 1 - step;
      ch.hipOffset = [(kneel ? 0.012 : 0.061) * h * phase, 0, -(kneel ? 0.226 : 0.132) * h * phase];
      ch.pitch = (kneel ? 0.15 : 0.22) * phase;
      ch.headPitch = -0.12 * phase;
      if (kneel)
        ch.kneePoles = [
          [1, 0, 0],
          [0.16, 0.09, -1]
        ];
      goals = sides.map((side, i) =>
        i === 0 ? [0.15 + 0.45 * phase, 0.12, -0.92 + 0.26 * phase] : [0.1, 0.15, -0.94 + 0.4 * phase]
      );
    } else if (id === 'balance') {
      ch.feet = [
        [0.062 * h * phase, -r.hip[1] - 0.023 * h * phase, r.ankle + 0.18 * h * phase],
        [0, r.hip[1], r.ankle]
      ];
      ch.standing = 1 - phase;
      ch.hipOffset = [0, 0.045 * h * phase, -0.012 * h * phase];
      ch.roll = -0.065 * phase;
      goals = sides.map((side) => [0.1, 0.15 + 0.65 * phase, -0.945 + 0.94 * phase + side * 0.06 * phase]);
    } else {
      const open = ramp(u, 0, 0.5) * (1 - ramp(u, 0.5, 1)),
        bounce = Math.sin(tau * u) ** 2;
      ch.feet = sides.map((side) => [0, side * (r.hip[1] + h * 0.095 * open), r.ankle]);
      ch.standing = 1 - bounce;
      ch.hipOffset = [0, 0, -h * 0.021 * bounce];
      ch.headPitch = -0.075 * open;
      goals = sides.map(() => [0.13, 0.15 + 0.6 * Math.sin(Math.PI * open), -0.94 + 1.76 * open]);
      const rest = pose(r, ch);
      ch.hands = sides.map((_, i) => hand(r, rest, i, goals[i]));
      return [entry(a, pose(r, ch), 0, 0, h * 0.103 * bounce)];
    }
    const rest = pose(r, ch);
    ch.hands = sides.map((_, i) => hand(r, rest, i, goals[i]));
    return [entry(a, pose(r, ch))];
  }
  for (const [id, label, group, sec, roles, keys] of [
    ['squat', '屈髋深蹲', '运动与舞蹈', 3.4, walking, '健身 下蹲'],
    ['lunge', '弓步压腿', '运动与舞蹈', 3.9, school, '拉伸 热身'],
    ['balance', '单脚平衡', '运动与舞蹈', 3.8, walking, '抬腿 单脚站立'],
    ['jumping-jack', '开合跳', '运动与舞蹈', 1.8, school, '跳跃 热身 健身'],
    ['kneel', '单膝跪下再起身', '姿势与休息', 3.9, school, '单膝跪地 蹲下 起立']
  ])
    clips.push(solo(id, label, group, sec, roles, (u, a) => exercise(id, u, a), keys));
  function resting(id, u, a) {
    const r = a.rig,
      floor = id === 'floor-rest' || a.tags.includes('baby'),
      ch = studioRig.seated(r, floor);
    const settle = 0.5 - 0.5 * Math.cos(tau * u);
    if (id === 'floor-rest') {
      ch.feet = sides.map((side) => [r.hip[0] + 0.105 * r.height, -side * 0.37 * r.hip[1], r.ankle]);
      ch.kneePoles = sides.map((side) => [0.3, side, -0.12]);
      ch.pitch = 0.015 + 0.025 * settle;
      ch.headPitch = 0.07 * settle;
      ch.blink = 0.22 + 0.68 * settle;
    } else {
      ch.pitch = 0.11 + 0.12 * settle;
      ch.headPitch = 0.12 + 0.52 * settle;
      ch.headRoll = 0.16 * settle;
      ch.blink = 0.23 + 0.77 * settle;
    }
    const rest = pose(r, ch);
    ch.hands = rest.legs.map(({ hip, knee }) => {
      const p = between(hip, knee, 0.75);
      p[2] += 0.046 * r.height;
      return p;
    });
    const p = pose(r, ch);
    if (!floor) p.props = [seatProp(r, ch)];
    return [entry(a, p)];
  }
  clips.push(
    solo(
      'floor-rest',
      '盘腿静坐',
      '姿势与休息',
      4.5,
      school,
      (u, a) => resting('floor-rest', u, a),
      '冥想 呼吸 地面'
    )
  );
  clips.push(
    solo(
      'doze',
      '坐着打盹',
      '姿势与休息',
      4.7,
      activityMotion.everyone,
      (u, a) => resting('doze', u, a),
      '小睡 睡觉 午休'
    )
  );
  function groundRest(u, a, prone) {
    const r = a.rig,
      h = r.height,
      s = h / 50,
      breath = 0.5 - 0.5 * Math.cos(tau * u),
      L = r.thigh + r.shin;
    const ch = {
      standing: 0,
      pitch: prone ? 1.22 - 0.14 * breath : -1.49 + 0.014 * breath,
      hipOffset: [(prone ? -0.11 : 0.1) * h, 0, (prone ? 0.166 : 0.157) * h - r.pelvis[2]],
      headPitch: prone ? -0.3 - 0.53 * breath : -0.035,
      headYaw: (prone ? 0.16 : 0.055) * Math.sin(tau * u),
      blink: prone ? blink(u) : 0.93 + 0.07 * breath
    };
    const origin = studioRig.point(studioRig.frame(r.pelvis, ch.hipOffset, 0, ch.pitch, 0), r.hip);
    ch.feet = sides.map((side) => [
      origin[0] + (prone ? -0.8 : 0.88) * L,
      side * (r.hip[1] + 0.012 * h),
      r.ankle + (prone ? 0.004 : 0.014) * h
    ]);
    ch.kneePoles = sides.map((side) => [prone ? 0.5 : -0.3, side * 0.16, prone ? -0.75 : 1]);
    if (prone) {
      ch.elbowPoles = sides.map((side) => [-0.75, side * 0.28, -1]);
      ch.hands = sides.map((side) => [0.23 * h, side * r.shoulder[1] * 1.11, 0.061 * h]);
    } else {
      const rest = pose(r, ch);
      ch.hands = sides.map((side, i) => hand(r, rest, i, [0.3, -0.26, -0.65 + 0.025 * breath]));
    }
    const p = pose(r, ch),
      mat = activityMotion.prop('mat', [0, 0, 0], s);
    mat.pillow = !prone;
    p.props = [mat];
    return [entry(a, p)];
  }
  clips.push(
    solo(
      'recline',
      '仰卧小憩',
      '姿势与休息',
      5.2,
      school,
      (u, a) => groundRest(u, a, false),
      '躺卧 睡觉 午睡 呼吸'
    )
  );
  clips.push(
    solo(
      'tummy-time',
      '俯卧撑臂抬头',
      '婴幼儿',
      3.8,
      activityMotion.small,
      (u, a) => groundRest(u, a, true),
      '宝宝 趴着 抬头'
    )
  );
  // Each beat moves one sole between two marks on the actual flight. The other stays planted.
  const stairBeats = (() => {
    const beats = [], last = PineWorld.stairs.count + 3;
    let marks = [[-1, 0], [-1, 0]], swing = 0;
    function step(n, yaw) {
      const next = marks.slice();
      next[swing] = [n, yaw];
      beats.push({ from: marks, to: next, swing });
      marks = next;
      swing = 1 - swing;
    }
    function rest(n) {
      for (let i = 0; i < n; i++) beats.push({ from: marks, to: marks, swing: -1 });
    }
    function turn(n, yaw) {
      for (const angle of [yaw - Math.PI / 2, yaw]) { step(n, angle); step(n, angle); }
    }
    rest(1);
    for (let n = 0; n <= last; n++) step(n, 0);
    step(last, 0);
    rest(2);
    turn(last, Math.PI);
    rest(6);
    for (let n = last - 1; n >= -1; n--) step(n, Math.PI);
    step(-1, Math.PI);
    turn(-1, tau);
    rest(1);
    return beats;
  })();
  function stairWalk(u, actor) {
    const rig = actor.rig, at = clamp(u) * stairBeats.length;
    const index = Math.min(stairBeats.length - 1, Math.floor(at)), t = at - index;
    const beat = stairBeats[index], ease = t * t * (3 - 2 * t), arc = Math.sin(Math.PI * t) ** 2;
    const yaw = side => mix(beat.from[side][1], beat.to[side][1], ease);
    const heading = (yaw(0) + yaw(1)) / 2;
    function mark([n, turn], side) {
      const [x, z] = PineWorld.stairs.foothold(n), y = side * rig.hip[1];
      return [x - y * Math.sin(turn), y * Math.cos(turn), z];
    }
    const feet = sides.map((side, i) => between(mark(beat.from[i], side), mark(beat.to[i], side), ease));
    const x = (feet[0][0] + feet[1][0]) / 2, y = (feet[0][1] + feet[1][1]) / 2;
    const bodyHeight = (feet[0][2] + feet[1][2]) / 2;
    if (beat.swing >= 0) {
      const levels = Math.abs(beat.to[beat.swing][0] - beat.from[beat.swing][0]);
      feet[beat.swing][2] += arc * Math.max(rig.height * 0.09, levels * PineWorld.stairs.rise * PineWorld.stairs.scale * 0.7);
    }
    // The pixel sampling volume begins at zero. Keep its origin at the lower shoe throughout the stride.
    const z = Math.min(feet[0][2], feet[1][2]), c = Math.cos(heading), s = Math.sin(heading);
    const swing = beat.swing < 0 ? 0 : sides[beat.swing] * arc;
    const stride = Math.abs(beat.to[0][0] - beat.to[1][0]);
    const ch = { feet: feet.map(([px, py, pz]) => [c * (px - x) + s * (py - y), c * (py - y) - s * (px - x), rig.ankle + pz - z]),
      hipOffset: [0, -swing * rig.height * 0.014, bodyHeight - z - 0.8 * stride],
      pitch: 0.035 * stride + 0.025 * Math.abs(swing), roll: 0.025 * swing, headPitch: 0.06 * stride,
      blink: blink(u) };
    const rest = pose(rig, ch);
    ch.hands = sides.map((side, i) => between(rest.arms[i].hand,
      hand(rig, rest, i, [0.11 + side * swing * 0.3, 0.14, -0.84]), Math.abs(swing)));
    return [entry(actor, pose(rig, ch), x, y, z, Math.atan2(s, c))];
  }
  clips.push({ ...solo('climb-stairs', '上下楼梯', '移动', 17, school, stairWalk, '上楼 下楼 爬楼 台阶 楼台 转身'),
    route: 'stairs' });
  return clips;
})();
