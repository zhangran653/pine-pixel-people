// Shared objects are painted by one actor per frame. Both partners solve contacts in the same scene space.
const socialActions = (() => {
  const { pose, point, world, local, ramp, mix, clamp } = studioRig;
  const { reach, hand, between, blink, span, prop, contact, atGrip, sides, tau, school, walking } =
    activityMotion;
  const root = (x, y, heading = 0) => ({ x, y, z: 0, heading });
  const placed = (a, r, p, contacts = {}) => ({ character: a.id, ...r, pose: p, contacts });
  const delta = (a, b) => a.map((v, i) => v - b[i]),
    plus = (a, b) => a.map((v, i) => v + b[i]);
  const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
  // Along the line toward the intended meeting point, keep both hands inside their reach spheres.
  function commonPoint(shoulders, lengths, goal) {
    const start = between(shoulders[0], shoulders[1], lengths[0] / (lengths[0] + lengths[1])),
      d = delta(goal, start),
      dd = dot(d, d);
    let t = 1;
    if (dd > 1e-10)
      shoulders.forEach((s, i) => {
        const q = delta(start, s),
          b = dot(q, d),
          c = dot(q, q) - lengths[i] ** 2;
        t = Math.min(t, clamp((-b + Math.sqrt(Math.max(0, b * b - dd * c))) / dd));
      });
    return plus(
      start,
      d.map((v) => v * t)
    );
  }
  function exchange(id, u, first, second) {
    const cast = [first, second],
      r = cast.map((a) => a.rig),
      lengths = r.map(reach),
      arm = [0, 0],
      size = Math.min(...r.map((v) => v.height)) / 65;
    const returning = id === 'handover',
      bump = id === 'fist-bump',
      phase = returning ? (u <= 0.5 ? u * 2 : 2 - 2 * u) : u;
    const meet = returning
      ? span(phase, 0.12, 0.43, 0.68, 0.96)
      : span(u, 0.07, bump ? 0.41 : 0.31, bump ? 0.55 : 0.72, 0.95);
    const heights = r.map((v) => v.shoulder[2]),
      height = Math.min(...heights) - (bump ? 0.035 : 0.16) * Math.min(...lengths);
    const roots = r.map((v, i) =>
      root(
        (i ? 1 : -1) * Math.max(0.54 * lengths[i], v.mouth[0] + 0.7 * v.palm),
        (i ? -1 : 1) * 0.58 * v.shoulder[1],
        i ? Math.PI : 0
      )
    );
    const channels = r.map((v, i) => {
      const drop = Math.min(
        v.pelvis[2] - 0.09 * v.height,
        Math.max(0, v.shoulder[2] - height - 0.27 * lengths[i])
      );
      return {
        hipOffset: [0, 0, -drop * meet],
        standing: 1 - meet,
        pitch: meet * (0.09 + (0.4 * drop) / v.hip[2]),
        headPitch: meet * (0.06 + (0.13 * drop) / v.hip[2]),
        blink: blink((u + 0.17 * i) % 1)
      };
    });
    const rest = r.map((v, i) => pose(v, channels[i]));
    const shoulders = rest.map((p, i) => world(roots[i], p.arms[arm[i]].shoulder));
    const lift = bump
      ? 0.16 * Math.sin(Math.PI * meet)
      : !returning
        ? 0.085 * Math.sin(3 * tau * u) * meet
        : 0;
    const common = commonPoint(
      shoulders,
      lengths.map((v) => v * 0.97),
      [0, 0, height + lift * Math.min(...lengths)]
    );
    const targets = cast.map((a, i) => {
      const resting = returning ? hand(r[i], rest[i], 0, [0.45, -0.04, -0.52]) : rest[i].arms[0].hand;
      const grip = returning ? [(i ? 1 : -1) * 2.84 * size, 0, 0] : [0, 0, 0];
      const arrival = returning
        ? i
          ? span(phase, 0.21, 0.47, 0.65, 0.92)
          : span(phase, 0.08, 0.43, 0.64, 0.92)
        : meet;
      const goal = between(resting, local(roots[i], plus(common, grip)), arrival);
      if (bump) goal[2] += 0.13 * lengths[i] * Math.sin(Math.PI * arrival);
      const p = pose(r[i], { ...channels[i], hands: [goal, null] });
      return placed(a, roots[i], p, { palm: world(roots[i], p.arms[0].hand) });
    });
    if (returning) {
      const owner = phase < 0.54 ? 0 : 1,
        off = [(owner ? 1 : -1) * 2.84, 0, 0],
        p = targets[owner].pose;
      p.props = [atGrip('parcel', p.arms[0].hand, off, size, -roots[owner].heading)];
    }
    return targets;
  }
  function holdingHands(u, adult, child) {
    const cast = [adult, child],
      r = cast.map((a) => a.rig),
      lengths = r.map(reach),
      step = 0.13 * Math.min(...r.map((v) => v.height));
    const stops = [0, step, 2 * step, step, 0],
      time = clamp(u) * 8,
      n = Math.min(7, Math.floor(time)),
      t = time - n,
      station = Math.floor(n / 2);
    const from = stops[station],
      to = stops[station + 1],
      swing = n % 2,
      ease = t * t * (3 - 2 * t),
      lift = Math.sin(Math.PI * t) ** 2;
    const feetX = sides.map((_, i) => mix(from, to, i === swing ? ease : swing)),
      x = (feetX[0] + feetX[1]) / 2;
    const roots = r.map((v, i) => root(x, (i ? 1 : -1) * (v.shoulder[1] + 0.33 * lengths[i])));
    const low = Math.min(...r.map((v) => v.shoulder[2])),
      shortReach = Math.min(...lengths);
    const difference = Math.abs(r[0].shoulder[2] - r[1].shoulder[2]);
    const z = low + shortReach * mix(-0.3, 0.36, clamp(difference / shortReach));
    const ch = r.map((v, i) => {
      const drop = Math.min(v.pelvis[2] - 0.1 * v.height, Math.max(0, v.shoulder[2] - z - 0.84 * lengths[i]));
      return {
        standing: 0.7,
        hipOffset: [0, 0, -drop - 0.012 * v.height * lift],
        pitch: 0.065 + (0.27 * drop) / v.height,
        headYaw: (i ? -1 : 1) * (0.095 + 0.11 * Math.cos(tau * u)),
        blink: blink((u + 0.18 * i) % 1),
        feet: sides.map((side, j) => [
          feetX[j] - x,
          side * v.hip[1],
          v.ankle + (j === swing ? 0.056 * v.height * lift : 0)
        ])
      };
    });
    const rest = r.map((v, i) => pose(v, ch[i])),
      idx = [1, 0];
    const near = rest.map((p, i) => world(roots[i], p.arms[idx[i]].shoulder));
    const common = commonPoint(
      near,
      lengths.map((v) => 0.96 * v),
      [x + 0.23 * Math.min(...lengths), 0, z + 0.04 * step * lift]
    );
    return cast.map((a, i) => {
      const hands = [null, null];
      hands[idx[i]] = local(roots[i], common);
      hands[1 - idx[i]] = hand(r[i], rest[i], 1 - idx[i], [0.13 + 0.22 * sides[swing] * lift, 0.17, -0.88]);
      const p = pose(r[i], { ...ch[i], hands });
      return placed(a, roots[i], p, { palm: world(roots[i], p.arms[idx[i]].hand) });
    });
  }
  function socialGesture(u, first, second, mirror) {
    const cast = [first, second],
      space = 0.22 * (first.rig.height + second.rig.height);
    return cast.map((a, i) => {
      const r = a.rig,
        m = mirror ? (i ? 0.08 : 0) : i * 0.5,
        v = (u + 1 - m) % 1;
      const talk = span(v, 0.025, 0.11, 0.37, 0.51),
        beat = Math.sin(tau * v * 3),
        left = 0.5 - 0.5 * Math.cos(tau * v);
      const ch = {
        jawOpen: mirror ? 0 : talk * (0.12 + 0.34 * Math.sin(tau * v * 5) ** 2),
        headYaw: mirror ? 0.11 * Math.sin(tau * v) : 0.08 * beat * talk,
        headPitch: mirror ? -0.07 * left : 0.11 * (1 - talk) * Math.sin(tau * v * 2),
        roll: mirror ? 0.09 * Math.sin(tau * v) : 0,
        blink: blink(v)
      };
      const p = pose(r, ch);
      const targets = mirror
        ? [
            [0.31, 0.18 + 0.4 * left, -0.7 + 1.29 * left],
            [0.29, 0.45 - 0.22 * left, 0.38 - 1.06 * left]
          ]
        : [
            [0.13 + 0.46 * talk, 0.15 + 0.2 * talk, -0.91 + (0.89 + 0.15 * beat) * talk],
            [0.11 + 0.27 * talk, 0.13 + 0.23 * talk, -0.92 + 0.53 * talk]
          ];
      if (mirror && i) targets.reverse();
      ch.hands = targets.map((v, j) => hand(r, p, j, v));
      return placed(a, root((i ? 0.5 : -0.5) * space, 0, i ? Math.PI : 0), pose(r, ch));
    });
  }
  function story(u, adult, young) {
    const m = adult.rig,
      b = young.rig,
      s = Math.min(m.height / 52, b.height / 29),
      turn = ramp(u, 0.3, 0.7);
    const mr = root(0, -m.shoulder[1] * 0.92),
      br = root(0.035 * b.height, b.shoulder[1] + 0.18 * reach(b), -0.16);
    const mc = studioRig.seated(m, true),
      bc = studioRig.seated(b, true);
    mc.yaw = 0.15;
    mc.headYaw = 0.19 + 0.15 * Math.sin(tau * u);
    mc.headPitch = 0.23;
    bc.headYaw = -0.25 - 0.14 * Math.sin(tau * u);
    bc.headPitch = 0.05 + 0.16 * Math.cos(tau * u);
    mc.blink = blink(u);
    bc.blink = blink((u + 0.23) % 1);
    const rest = pose(m, mc),
      book = prop(
        'book',
        point(rest.torso, [
          m.shoulder[0] + 0.47 * reach(m),
          0.46 * m.shoulder[1],
          m.shoulder[2] - 0.51 * reach(m)
        ]),
        s,
        0.04,
        -0.68
      );
    book.page = turn;
    mc.hands = [
      contact(book, [-0.4, -4.58, 0.16]),
      contact(book, [-0.4, 4.2 - 2.76 * Math.sin(Math.PI * turn), 0.8 + 2.6 * Math.sin(Math.PI * turn)])
    ];
    const mp = pose(m, mc);
    mp.props = [book];
    const bp = pose(b, bc),
      page = world(mr, contact(book, [0, 3.1, 1])),
      interest = span(u, 0.12, 0.31, 0.61, 0.84);
    bc.hands = [between(bp.arms[0].hand, local(br, page), 0.68 * interest), null];
    return [placed(adult, mr, mp, { page }), placed(young, br, pose(b, bc))];
  }
  function followToy(u, adult, baby) {
    const m = adult.rig,
      b = baby.rig,
      ch = studioRig.seated(m, true),
      bc = studioRig.seated(b, true),
      s = b.height / 29;
    const mr = root(-0.135 * m.height, 0),
      br = root(0.2 * m.height, 0, Math.PI);
    const w = Math.sin(tau * u),
      beat = Math.sin(2 * tau * u);
    ch.headPitch = 0.19;
    ch.headYaw = -0.07 * w;
    ch.blink = blink(u);
    const rest = pose(m, ch);
    ch.hands = [hand(m, rest, 0, [0.65, -0.34 + 0.36 * w, -0.1 + 0.18 * beat]), null];
    const mp = pose(m, ch),
      toy = atGrip('rattle', mp.arms[0].hand, [0, 0, 0], s, 0, 0.18 * beat, 0.24 * Math.sin(5 * tau * u));
    mp.props = [toy];
    const target = world(mr, contact(toy, [0, 0, 2.1])),
      goal = local(br, target),
      neutral = pose(b, bc),
      eye = studioRig.socket(baby, neutral, 'rightEye');
    bc.headYaw = clamp(Math.atan2(goal[1], Math.max(1, goal[0])), -0.6, 0.6);
    bc.headPitch = clamp(-Math.atan2(goal[2] - eye[2], Math.max(1, goal[0] - eye[0])), -0.47, 0.31);
    if (b.facialActing) {
      // The eyes cover the last part of the turn while the head faces the caregiver.
      bc.headYaw *= .54;
      bc.headPitch *= .82;
    }
    bc.blink = blink((u + 0.22) % 1);
    const look = pose(b, bc);
    bc.hands = [
      between(look.arms[0].hand, goal, 0.34 + 0.16 * w),
      between(look.arms[1].hand, goal, 0.33 - 0.16 * w)
    ];
    const bp = pose(b,bc);
    if (b.facialActing) bp.faceCue = { gaze:studioRig.lookAt(baby,bp,goal), smile:.35 + .12*beat };
    if (m.facialActing)
      mp.faceCue = { gaze:studioRig.lookAt(adult,mp,local(mr,world(br,studioRig.socket(baby,bp,'leftEye')))), smile:.36 };
    return [placed(adult, mr, mp, { toy: target }), placed(baby, br, bp)];
  }
  function rollBall(u, first, second) {
    const cast = [first, second],
      r = cast.map((a) => a.rig),
      s = Math.min(...r.map((v) => v.height)) / 40,
      z = 2.22 * s;
    const roots = r.map((v, i) => root((i ? 1 : -1) * 0.3 * v.height, 0, i ? Math.PI : 0));
    const ends = roots.map((v, i) => world(v, [0.16 * r[i].height, 0, z]));
    const outward = ramp(u, 0.095, 0.41),
      back = ramp(u, 0.59, 0.91),
      travel = outward - back,
      ball = between(ends[0], ends[1], travel);
    const results = cast.map((a, i) => {
      const grip = i ? travel : 1 - travel,
        ch = studioRig.seated(r[i], true);
      ch.pitch = 0.2 + 0.22 * grip;
      ch.headPitch = 0.18 + 0.14 * grip;
      ch.blink = blink((u + 0.2 * i) % 1);
      const rest = pose(r[i], ch),
        near = local(roots[i], ends[i]);
      ch.hands = sides.map((side, j) =>
        between(rest.arms[j].hand, [near[0], side * 1.75 * s, z + 0.79 * s], 0.32 + 0.68 * grip)
      );
      return placed(a, roots[i], pose(r[i], ch));
    });
    const owner = travel <= 0.5 ? 0 : 1,
      rotation = (-(ends[1][0] - ends[0][0]) * travel) / z;
    results[owner].pose.props = [prop('ball', local(roots[owner], ball), s, -roots[owner].heading, rotation)];
    results[owner].contacts.ball = ball;
    return results;
  }
  const both = [walking, walking],
    young = ['child', 'toddler', 'baby'];
  return [
    [
      'handshake',
      '握手问好',
      '双人',
      3.25,
      both,
      (u, a, b) => exchange('handshake', u, a, b),
      '握手 打招呼 见面'
    ],
    ['fist-bump', '碰拳庆祝', '双人', 2.75, both, (u, a, b) => exchange('fist-bump', u, a, b), '碰拳 加油'],
    [
      'handover',
      '递接包裹',
      '双人',
      5.7,
      [school, school],
      (u, a, b) => exchange('handover', u, a, b),
      '递物 交接 礼物 快递 传递'
    ],
    ['chat', '面对面交谈', '双人', 4.65, both, (u, a, b) => socialGesture(u, a, b, false), '对话 聊天 说话'],
    [
      'mirror-game',
      '双人镜像游戏',
      '双人',
      3.9,
      both,
      (u, a, b) => socialGesture(u, a, b, true),
      '模仿 跳舞 同步'
    ],
    [
      'hold-hands',
      '牵手迈步',
      '亲子',
      4.35,
      [['adult'], ['child', 'toddler']],
      holdingHands,
      '散步 陪走 学步 妈妈'
    ],
    ['storytime', '一起翻绘本', '亲子', 4.75, [['adult'], young], story, '讲故事 亲子共读 阅读 宝宝'],
    [
      'follow-rattle',
      '追看摇铃',
      '亲子',
      3.7,
      [['adult'], ['baby', 'toddler']],
      followToy,
      '逗宝宝 追视 沙锤'
    ],
    ['roll-ball', '面对面滚球', '亲子', 4.15, [walking, young], rollBall, '传球 地板游戏 宝宝 互动']
  ].map(([id, label, group, seconds, roles, sample, keywords]) => ({
    id,
    label,
    group,
    seconds,
    roles,
    sample,
    keywords
  }));
})();
