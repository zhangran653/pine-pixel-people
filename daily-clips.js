// Object contacts and poses share the actor's coordinate system. Attached props use the solved hand.
const dailyActions = (() => {
  const { pose, point, mix, ramp, socket } = studioRig;
  const {
    sides,
    tau,
    span,
    blink,
    between,
    reach,
    hand,
    prop,
    contact,
    atGrip,
    entry,
    solo,
    walking,
    school,
    small,
    seatProp
  } = activityMotion;
  const add = (p, q) => p.map((n, i) => n + q[i]);
  function center(r, p, forward, side, up) {
    return point(p.torso, [
      r.shoulder[0] + forward * reach(r),
      side * reach(r),
      r.shoulder[2] + up * reach(r)
    ]);
  }
  function reading(u, a, writing) {
    const r = a.rig,
      s = r.height / 50,
      ch = studioRig.seated(r),
      turn = ramp(u, 0.27, 0.69);
    ch.pitch = 0.07;
    ch.headPitch = 0.24 + 0.033 * Math.sin(tau * u);
    ch.headYaw = writing ? -0.1 + 0.045 * Math.sin(tau * u) : 0.13 * Math.cos(tau * u);
    ch.blink = blink(u);
    const rest = pose(r, ch),
      book = prop('book', center(r, rest, 0.49, 0, writing ? -0.43 : -0.27), s, 0, writing ? -0.3 : -0.73);
    book.page = writing ? 0 : turn;
    let pen;
    if (writing) {
      const x = -1.18 + 0.54 * Math.sin(tau * u * 4),
        y = -2.41 + 0.61 * Math.sin(tau * u * 2);
      const tip = contact(book, [x, y, 1.02]);
      pen = atGrip('pen', tip, [0.4, 0, -1.94], s, 0, 0.18, -0.21);
      ch.hands = [contact(pen, [0, 0, 0]), contact(book, [-0.35, 4.55, 0.12])];
    } else {
      const sweep = span(u, 0.16, 0.32, 0.57, 0.76);
      const turning = contact(book, [
        -0.72,
        3.78 * Math.cos(Math.PI * Math.min(turn, 0.58)),
        0.85 + 3.45 * Math.sin(Math.PI * turn)
      ]);
      ch.hands = [
        contact(book, [-0.37, -4.71, 0.16]),
        between(contact(book, [-0.37, 4.71, 0.16]), turning, sweep)
      ];
    }
    const p = pose(r, ch);
    if (r.facialActing) {
      const target = writing ? contact(pen,[.4,0,-1.94]) : contact(book,[0,2.8*(1-2*turn),.85]);
      p.faceCue = { gaze:studioRig.lookAt(a,p,target) };
    }
    p.props = [seatProp(r, ch), book];
    if (writing) p.props.push(atGrip('pen', p.arms[0].hand, [0, 0, 0], s, 0, 0.18, -0.21));
    return [entry(a, p)];
  }
  function phoneCall(u, a) {
    const r = a.rig,
      s = r.height / 50,
      up = span(u, 0.025, 0.25, 0.78, 0.98);
    const ch = { headRoll: -0.12 * up, headYaw: 0.08 * Math.sin(tau * u) * up, blink: blink(u) };
    const rest = pose(r, ch),
      eye = socket(a, rest, 'rightEye');
    const ear = add(eye, [-2.3 * s, -2.89 * s, -1.12 * s]);
    const phone = atGrip('phone', ear, [0.25, 0, 1.62], s, -1.46, 0, 0.06);
    ch.hands = [
      between(rest.arms[0].hand, contact(phone, [0.3, 0.1, -0.73]), up),
      hand(r, rest, 1, [0.15 + 0.28 * up, 0.17, -0.91 + 0.45 * up])
    ];
    const p = pose(r, ch);
    p.props = [atGrip('phone', p.arms[0].hand, [0.3, 0.1, -0.73], s, -1.46, 0, 0.06)];
    return [entry(a, p)];
  }
  function photo(u, a) {
    const r = a.rig,
      s = r.height / 50,
      up = span(u, 0.04, 0.31, 0.72, 0.96),
      snap = span(u, 0.47, 0.49, 0.52, 0.58);
    const ch = { headPitch: 0.1 * up, headYaw: -0.06 * up, blink: Math.max(snap, blink(u)) };
    const rest = pose(r, ch),
      eye = socket(a, rest, 'rightEye');
    const camera = prop(
      'camera',
      between(center(r, rest, 0.48, 0, -0.54), add(eye, [1.32 * s, -0.2 * s, -1.4 * s]), up),
      s,
      0,
      0.065 * snap
    );
    ch.hands = [contact(camera, [0, -2.54, 0.3 - 0.25 * snap]), contact(camera, [0.21, 2.19, -0.89])];
    const p = pose(r, ch);
    p.props = [camera];
    return [entry(a, p)];
  }
  function grooming(u, a, id) {
    const r = a.rig,
      s = r.height / 50,
      up = span(u, 0.04, 0.25, 0.75, 0.96),
      beat = Math.sin(tau * u * (id === 'comb' ? 3 : 6));
    const ch = { headRoll: (id === 'comb' ? 0.15 : 0.04) * up, headPitch: 0.08 * up, blink: blink(u) };
    const rest = pose(r, ch),
      brush = id === 'brush',
      goal = brush
        ? contact(
            atGrip(
              'brush',
              add(socket(a, rest, 'mouth'), [0, 0.66 * beat * s, 0]),
              [-0.27, 3.25, 1.0],
              s,
              0,
              0.1,
              0.05
            ),
            [0, 0, 0]
          )
        : add(socket(a, rest, 'rightEye'), [(-1.27 - 0.4 * beat) * s, -2.76 * s, (1.04 + 1.58 * beat) * s]);
    ch.hands = [between(rest.arms[0].hand, goal, up), null];
    const p = pose(r, ch);
    p.props = [
      atGrip(
        id,
        p.arms[0].hand,
        [0, 0, 0],
        s,
        0,
        brush ? 0.1 : -0.24,
        brush ? 0.05 : -0.23 + 0.25 * beat * up
      )
    ];
    return [entry(a, p)];
  }
  function bowlMotion(u, a, stir) {
    const r = a.rig,
      s = r.height / 50,
      ch = studioRig.seated(r),
      lift = stir ? 0 : span(u, 0.23, 0.43, 0.62, 0.85);
    ch.pitch = 0.09;
    ch.headPitch = 0.2 - 0.12 * lift;
    ch.blink = blink(u);
    const rest = pose(r, ch),
      bowl = prop('bowl', center(r, rest, 0.48, 0.13, -0.53), s);
    ch.hands = [null, contact(bowl, [0, 2.46, -0.77])];
    const beat = tau * u * (stir ? 3 : 1),
      food = contact(bowl, [0.93 * Math.cos(beat), 1.28 * Math.sin(beat), 0.66]);
    const end = between(food, socket(a, rest, 'mouth'), lift);
    const spoon = atGrip(
      'spoon',
      end,
      [0, 2.56, 0.19],
      s,
      stir ? -0.45 + 0.38 * Math.sin(beat) : -0.17,
      -0.05,
      -0.2 + 0.16 * lift
    );
    ch.hands[0] = contact(spoon, [0, 0, 0]);
    const p = pose(r, ch);
    p.props = [
      seatProp(r, ch),
      bowl,
      atGrip(
        'spoon',
        p.arms[0].hand,
        [0, 0, 0],
        s,
        stir ? -0.45 + 0.38 * Math.sin(beat) : -0.17,
        -0.05,
        -0.2 + 0.16 * lift
      )
    ];
    return [entry(a, p)];
  }
  function sweep(u, a) {
    const r = a.rig,
      L = reach(r),
      s = r.height / 50,
      beat = Math.cos(tau * u);
    const ch = {
      standing: 0.48,
      pitch: 0.2,
      roll: -0.055 * beat,
      headPitch: 0.2,
      headYaw: -0.16 * beat,
      hipOffset: [-0.018 * r.height, 0.015 * r.height * beat, -0.032 * r.height],
      blink: blink(u)
    };
    const itemScale = (r.shoulder[2] - 0.4 * L) / 13.4;
    const broom = atGrip(
      'broom',
      [0.2 * r.height, 0.115 * r.height * beat, 0.61 * s],
      [0.31, 0, -13.19],
      itemScale,
      0,
      -0.21,
      0.17 * beat
    );
    ch.hands = [contact(broom, [0, 0, -0.07]), contact(broom, [0, 0, 3.25])];
    ch.elbowPoles = [
      [-0.3, -1, -0.3],
      [-0.3, 1, -0.3]
    ];
    const p = pose(r, ch);
    p.props = [broom];
    return [entry(a, p)];
  }
  function pouringPose(a, pour, eyes) {
    const r = a.rig,
      s = r.height / 50;
    const ch = { pitch: 0.13 * pour, headPitch: 0.18 + 0.12 * pour, headYaw: -0.16, blink: eyes },
      rest = pose(r, ch);
    ch.hands = [
      hand(r, rest, 0, [0.5 + 0.16 * pour, 0.09, -0.74 + 0.45 * pour]),
      hand(r, rest, 1, [0.23, 0.14, -0.84])
    ];
    const p = pose(r, ch),
      can = atGrip('wateringCan', p.arms[0].hand, [-3.09, 0, 0.48], s, 0, 0.12 + 0.62 * pour);
    return { p, can, spout: contact(can, [4.53, 0, 0.97]) };
  }
  const potLocations = new WeakMap();
  function water(u, a) {
    const s = a.rig.height / 50,
      pour = span(u, 0.19, 0.4, 0.65, 0.87),
      { p, can, spout } = pouringPose(a, pour, blink(u));
    if (!potLocations.has(a)) {
      const [x, y] = pouringPose(a, 1, 0).spout;
      potLocations.set(a, [x, y, 0]);
    }
    p.props = [prop('plant', potLocations.get(a), s), can];
    if (pour > 0.62) {
      const stream = prop('water', spout, s);
      stream.length = Math.max(0, (spout[2] - 3.94 * s) / s) * ramp(pour, 0.62, 0.92);
      stream.flow = (u * 5) % 1;
      p.props.push(stream);
    }
    return [entry(a, p)];
  }
  function carry(u, a) {
    const r = a.rig,
      h = r.height,
      s = h / 50,
      w = Math.sin(tau * u),
      beat = w * w;
    const ch = {
      feet: sides.map((side) => [
        0.032 * h * side * w,
        side * r.hip[1],
        r.ankle + Math.max(0, side * w) * 0.066 * h
      ]),
      standing: 0.46,
      hipOffset: [0, 0.013 * h * w, -0.018 * h * beat],
      pitch: -0.055,
      headYaw: 0.1 * w,
      blink: blink(u)
    };
    const rest = pose(r, ch),
      box = prop('parcel', center(r, rest, 0.53, 0, -0.43), s, 0, -0.055, 0.03 * w);
    ch.hands = sides.map((side) => contact(box, [-0.2, side * 4.27, -0.84]));
    const p = pose(r, ch);
    p.props = [box];
    return [entry(a, p)];
  }
  function guitar(u, a) {
    const r = a.rig,
      s = (r.height / 50) * 1.46,
      beat = Math.sin(tau * u * 4),
      ch = studioRig.seated(r);
    ch.yaw = 0.075;
    ch.headPitch = 0.12 + 0.035 * Math.cos(tau * u * 2);
    ch.headYaw = 0.13;
    ch.blink = blink(u);
    const rest = pose(r, ch),
      instrument = prop('guitar', center(r, rest, 0.39, -0.11, -0.42), s, 0, 0.04, 0.22);
    ch.hands = [
      contact(instrument, [1.18, -0.77, 0.28 + 1.51 * beat]),
      contact(instrument, [0.19, 5.31 + 0.86 * Math.sin(tau * u), 0.94])
    ];
    const p = pose(r, ch);
    p.props = [seatProp(r, ch), instrument];
    return [entry(a, p)];
  }
  function bounce(u, a) {
    const r = a.rig,
      s = r.height / 50,
      cycle = (u * 2) % 1,
      drop = cycle < 0.5 ? 2 * cycle : 2 * (1 - cycle),
      low = drop * drop;
    const ch = {
      headPitch: 0.14 + 0.21 * low,
      pitch: 0.095 + 0.13 * low,
      hipOffset: [0, 0, -0.045 * r.height * low],
      blink: blink(u)
    };
    const rest = pose(r, ch);
    ch.hands = [hand(r, rest, 0, [0.46, 0.23, -0.38 - 0.47 * Math.sin(Math.PI * cycle)]), null];
    const p = pose(r, ch),
      at = p.arms[0].hand.slice();
    at[2] = mix(at[2] - 1.98 * s, 2.22 * s, low);
    p.props = [prop('ball', at, s, cycle * tau)];
    return [entry(a, p)];
  }
  function nursery(u, a, id) {
    const r = a.rig,
      h = r.height,
      s = h / 35,
      w = Math.sin(tau * u * 2),
      phase = 0.5 - 0.5 * Math.cos(tau * u),
      ch = studioRig.seated(r, true);
    ch.headPitch = id === 'reach' ? -0.19 * phase : 0.12 + 0.04 * w;
    if (r.facialActing && ch.floorSeat && id === 'reach') {
      // Bring the shoulders over the toy, keeping seat and both heels planted.
      ch.pitch += .10*phase;
      ch.headPitch += .14*phase;
    }
    ch.roll = 0.042 * w;
    ch.blink = blink(u);
    if (id === 'kick') {
      ch.pitch = -0.2;
      const seated = pose(r, ch),
        length = r.thigh + r.shin;
      ch.feet = seated.legs.map(({ hip }, i) => [
        hip[0] + length * (0.64 + 0.19 * sides[i] * w),
        hip[1] + sides[i] * 0.013 * h,
        r.ankle + 0.36 * length * Math.max(0, sides[i] * w)
      ]);
    }
    const rest = pose(r, ch);
    const toyCenter = [0.14 * h, 0, 2.22 * s];
    if (id === 'reach')
      ch.hands = sides.map((side, i) =>
        between(
          hand(r, rest, i, [0.38, 0.15, -0.42]),
          [toyCenter[0], side * 1.71 * s, toyCenter[2] + 1.0 * s],
          phase
        )
      );
    if (id === 'kick')
      ch.hands = sides.map((side, i) => hand(r, rest, i, [0.21, 0.31, -0.68 + 0.15 * w * side]));
    if (id === 'rattle')
      ch.hands = [
        hand(r, rest, 0, [0.42, 0.28 + 0.1 * w, 0.12 + 0.2 * Math.sin(tau * u * 5)]),
        hand(r, rest, 1, [0.41, 0.14, -0.22])
      ];
    let drum;
    if (id === 'drum') {
      const anchor = center(r, rest, 0.52, 0, -0.56);
      drum = prop('drum', anchor, s);
      ch.hands = sides.map((side, i) =>
        contact(drum, [0.16, side * 1.75, 2.01 + Math.max(0, side * w) * 3.08])
      );
    }
    const p = pose(r, ch);
    if (id === 'rattle')
      p.props = [
        atGrip('rattle', p.arms[0].hand, [0, 0, 0], s, 0.14, 0.24 * Math.sin(tau * u * 5), -0.33 + 0.19 * w)
      ];
    if (drum) p.props = [drum];
    if (id === 'reach') p.props = [prop('ball', toyCenter, s)];
    if (r.facialActing && p.props.length) {
      const item = p.props[0], target = contact(item,[0,0,id === 'rattle' ? 2.1 : 0]);
      p.faceCue = { gaze:studioRig.lookAt(a,p,target), smile:id === 'reach' ? .48*phase : .22 };
    }
    return [entry(a, p)];
  }
  return [
    solo('read', '捧书翻页', '学习与工作', 4.5, school, (u, a) => reading(u, a, false), '阅读 看书 读书'),
    solo(
      'write',
      '在本子上写字',
      '学习与工作',
      3.9,
      school,
      (u, a) => reading(u, a, true),
      '笔记 作业 记录 书写'
    ),
    solo('call', '接听电话', '现代生活', 4.15, school, phoneCall, '手机 通话 打电话'),
    solo('photograph', '举相机拍照', '现代生活', 3.7, school, photo, '摄影 拍摄 快门'),
    solo('brush-teeth', '刷牙', '日常', 3.55, school, (u, a) => grooming(u, a, 'brush'), '洗漱 牙刷 起床'),
    solo('comb', '梳头发', '日常', 3.95, school, (u, a) => grooming(u, a, 'comb'), '梳子 整理'),
    solo('eat', '用勺吃饭', '日常', 4.1, walking, (u, a) => bowlMotion(u, a, false), '早餐 午餐 吃东西'),
    solo('stir', '用勺搅拌', '家务', 3.3, school, (u, a) => bowlMotion(u, a, true), '做饭 烹饪 调拌 碗'),
    solo('sweep', '扫地', '家务', 3.75, school, sweep, '清扫 打扫 扫帚'),
    solo('water-plant', '给盆栽浇水', '家务', 4.25, school, water, '园艺 浇花 花盆'),
    solo('carry-box', '抱箱踏步', '家务', 3.4, school, carry, '搬运 快递 包裹'),
    solo('guitar', '坐着弹吉他', '音乐与游戏', 3.65, school, guitar, '乐器 演奏 扫弦'),
    solo('bounce-ball', '单手拍球', '运动与舞蹈', 2.6, walking, bounce, '篮球 玩球 运球'),
    solo(
      'baby-reach',
      '坐着伸手够球',
      '婴幼儿',
      3.0,
      small,
      (u, a) => nursery(u, a, 'reach'),
      '宝宝 探索 抓取'
    ),
    solo('baby-kicks', '坐姿交替踢腿', '婴幼儿', 2.9, small, (u, a) => nursery(u, a, 'kick'), '宝宝 蹬腿'),
    solo('rattle', '摇拨浪玩具', '婴幼儿', 2.8, small, (u, a) => nursery(u, a, 'rattle'), '宝宝 摇铃 沙锤'),
    solo(
      'toy-drum',
      '拍玩具鼓',
      '音乐与游戏',
      2.9,
      [...small, 'child'],
      (u, a) => nursery(u, a, 'drum'),
      '宝宝 童谣 打鼓 节奏'
    )
  ];
})();
