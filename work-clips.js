// Hand targets are fractions of reach. Props share the same grip and surface anchors as placed scene objects.
const worldActions = (() => {
  const { solo, school, walking, gesture, prop, atGrip, contact, span, entry, tau } = activityMotion;
  const { pose, point, ramp } = studioRig;
  const result = [];
  const paths = {
    present: [
      [0.24, 0.18, -0.46],
      [0.76, 0.29, 0.05],
      [0.62, 0.52, 0.12]
    ],
    inspect: [
      [0.26, 0.07, -0.56],
      [0.55, -0.05, 0.15],
      [0.43, -0.25, 0.03]
    ],
    wave: [
      [0.26, 0.2, -0.51],
      [0.3, 0.47, 0.65],
      [0.43, 0.13, 0.78]
    ],
    scan: [
      [0.27, 0.08, -0.6],
      [0.7, 0.08, -0.34],
      [0.62, -0.34, -0.29]
    ],
    pour: [
      [0.26, 0.16, -0.64],
      [0.62, -0.12, -0.12],
      [0.56, -0.3, -0.07]
    ],
    trace: [
      [0.27, 0.07, -0.5],
      [0.64, -0.22, -0.16],
      [0.46, 0.21, -0.09]
    ],
    lift: [
      [0.25, 0.15, -0.42],
      [0.45, 0.24, 0.38],
      [0.51, 0.16, 0.62]
    ],
    fan: [
      [0.26, 0.13, -0.56],
      [0.44, 0.29, 0.15],
      [0.35, 0.06, 0.2]
    ],
    record: [
      [0.22, 0.06, -0.6],
      [0.49, -0.12, -0.24],
      [0.44, -0.23, -0.13]
    ]
  };
  // Timing, secondary hand, head tracking, wrist rotation and item choice are authored per clip.
  function handClip(id, label, group, seconds, kind, path, left, head, turn, other = null, keywords = '') {
    const [a, b, c] = paths[path],
      frames = [
        { at: 0, right: a, left: [0.13, 0.12, -0.87] },
        { at: 0.26, right: b, left, head },
        { at: 0.48, right: c, left, head, body: [turn * 0.16, 0.025, 0] },
        { at: 0.67, right: b, left, head },
        { at: 0.8, right: c, left, head },
        { at: 1, right: a, left: [0.13, 0.12, -0.87] }
      ];
    const motion = gesture(frames);
    result.push(
      solo(
        id,
        label,
        group,
        seconds,
        school,
        (u, actor) => {
          const [e] = motion(u, actor),
            s = actor.rig.height / 50,
            w = span(u, 0.03, 0.26, 0.8, 0.99);
          const grip = PineWorld.items.get(kind).anchors.grip || [0, 0, 0];
          const item = atGrip(
            kind,
            e.pose.arms[0].hand,
            grip,
            s,
            turn * w,
            0,
            path === 'pour' ? -w * 0.85 : path === 'fan' ? w * Math.sin(u * tau * 4) * 0.46 : 0
          );
          e.pose.props = [item];
          if (other)
            e.pose.props.push(
              atGrip(
                other,
                e.pose.arms[1].hand,
                PineWorld.items.get(other).anchors.grip || [0, 0, 0],
                s,
                -0.16 * w,
                -0.2 * w
              )
            );
          return [e];
        },
        keywords +
          ' ' +
          PineWorld.items.get(kind).label +
          (other ? ' ' + PineWorld.items.get(other).label : '')
      )
    );
  }
  const work = '办公与协作',
    service = '零售与服务',
    learning = '教学与导览',
    craft = '书画与传统工艺',
    magic = '奇幻仪式',
    space = '科幻作业',
    field = '户外与调查';
  for (const row of [
    [
      'brief-team',
      '拿夹板汇报',
      work,
      4.1,
      'clipboard',
      'present',
      [0.5, 0.33, 0.02],
      [0.22, -0.06, 0],
      0.35
    ],
    [
      'review-notes',
      '核对工作记录',
      work,
      3.6,
      'notebook',
      'inspect',
      [0.43, -0.18, -0.29],
      [0.08, 0.24, -0.07],
      -0.18
    ],
    ['show-plan', '展示平面图', work, 4.4, 'scroll', 'present', [0.58, 0.24, -0.17], [-0.12, 0.1, 0], -0.4],
    [
      'coffee-break',
      '端杯小憩',
      work,
      3.6,
      'mug',
      'inspect',
      [0.15, 0.18, -0.88],
      [-0.06, 0.02, -0.04],
      0.14
    ],
    [
      'scan-code',
      '给商品扫码',
      service,
      3.3,
      'scanner',
      'scan',
      [0.52, -0.11, -0.38],
      [0.09, 0.19, 0.01],
      -0.28,
      'parcel',
      '收银 售货员 条码'
    ],
    [
      'serve-mug',
      '递上咖啡',
      service,
      3.5,
      'mug',
      'present',
      [0.49, -0.08, -0.32],
      [-0.12, 0.035, -0.03],
      0.12
    ],
    [
      'check-order',
      '核对订单',
      service,
      3.8,
      'clipboard',
      'inspect',
      [0.38, -0.16, -0.22],
      [-0.13, 0.28, 0],
      0.36,
      'pen'
    ],
    [
      'wrap-parcel',
      '翻检包裹',
      service,
      3.7,
      'parcel',
      'record',
      [0.42, -0.21, -0.2],
      [0.07, 0.27, -0.04],
      0.48
    ],
    [
      'guide-flag',
      '举旗集合',
      learning,
      4.2,
      'guide-flag',
      'wave',
      [0.62, 0.22, -0.12],
      [0.28, -0.1, -0.025],
      0.42,
      null,
      '导游 集合 旅行'
    ],
    [
      'show-page',
      '展示书页',
      learning,
      4.1,
      'book',
      'present',
      [0.49, -0.19, -0.1],
      [-0.24, -0.04, 0.02],
      0.25
    ],
    [
      'point-map',
      '指示路线',
      learning,
      3.8,
      'clipboard',
      'present',
      [0.83, 0.12, 0.15],
      [0.29, -0.07, 0],
      -0.24
    ],
    [
      'field-observe',
      '举起相机取景',
      field,
      4.6,
      'camera',
      'inspect',
      [0.45, -0.26, 0.13],
      [0.16, 0.035, -0.07],
      0.23
    ],
    [
      'survey-sample',
      '记录样本',
      field,
      4.1,
      'probe',
      'scan',
      [0.48, 0.03, -0.4],
      [-0.14, 0.29, 0.04],
      -0.5,
      'notebook'
    ],
    [
      'carry-lantern',
      '提灯探路',
      field,
      4.5,
      'lantern',
      'lift',
      [0.48, 0.22, -0.32],
      [-0.31, -0.06, 0.015],
      -0.31
    ],
    ['fan-cool', '轻摇折扇', craft, 3.4, 'fan', 'fan', [0.09, 0.1, -0.9], [-0.11, -0.055, 0.08], 0.55],
    [
      'unroll-map',
      '展开行旅图卷',
      craft,
      4.7,
      'scroll',
      'inspect',
      [0.55, -0.07, -0.1],
      [0.06, 0.19, -0.04],
      -0.3
    ],
    [
      'lift-brush',
      '悬腕试笔',
      craft,
      3.6,
      'quill',
      'trace',
      [0.55, -0.1, -0.29],
      [0.07, 0.26, -0.03],
      0.36,
      'scroll'
    ],
    [
      'check-jade',
      '把玩晶石',
      craft,
      3.6,
      'prism',
      'inspect',
      [0.43, -0.14, -0.15],
      [-0.13, 0.16, 0.05],
      0.66
    ],
    [
      'raise-crystal',
      '托起发光晶石',
      magic,
      4.7,
      'prism',
      'lift',
      [0.53, -0.13, 0.2],
      [0.13, -0.23, -0.025],
      -0.48
    ],
    ['read-stars', '举盘观星', magic, 5.1, 'astrolabe', 'lift', [0.61, 0.37, 0.28], [-0.26, -0.32, 0], 0.67],
    [
      'mix-elixir',
      '调配药剂',
      magic,
      4.2,
      'mug',
      'pour',
      [0.47, -0.12, -0.29],
      [0.1, 0.23, 0.04],
      0.19,
      'bowl'
    ],
    ['trace-rune', '描绘符文', magic, 3.9, 'prism', 'trace', [0.58, 0.18, -0.03], [-0.14, 0.11, 0.06], 0.78],
    [
      'light-ward',
      '点亮守护灯',
      magic,
      4.8,
      'lantern',
      'present',
      [0.5, -0.08, 0.26],
      [0.14, -0.09, 0.02],
      -0.47,
      'prism'
    ],
    [
      'scan-air',
      '扫描空气成分',
      space,
      4.2,
      'probe',
      'scan',
      [0.24, 0.23, -0.74],
      [-0.21, 0.08, -0.03],
      0.72
    ],
    [
      'aim-beacon',
      '校准信号方向',
      space,
      4.8,
      'probe',
      'lift',
      [0.65, -0.05, 0.32],
      [0.24, -0.16, 0.03],
      -0.52
    ],
    [
      'compare-readings',
      '比对仪器读数',
      space,
      4.5,
      'probe',
      'inspect',
      [0.48, 0.02, -0.18],
      [-0.13, 0.2, 0.03],
      0.27,
      'clipboard'
    ],
    [
      'dock-check',
      '检查货运标签',
      space,
      3.9,
      'scanner',
      'record',
      [0.54, -0.15, -0.18],
      [0.16, 0.22, -0.04],
      0.52,
      'parcel'
    ]
  ])
    handClip(...row);
  const desks = {
    'desk-notes': ['坐下写笔记', '学习与书桌', 4.2, 'notebook'],
    'desk-sketch': ['绘制设计草图', work, 4.4, 'notebook'],
    'desk-code': ['在书桌前编程', work, 3.9, 'laptop'],
    'desk-read': ['坐在桌旁翻书', '学习与书桌', 4.7, 'book'],
    'desk-calligraphy': ['案前临帖', craft, 5.2, 'scroll']
  };
  for (const [id, [label, group, seconds, book]] of Object.entries(desks)) {
    const sample = (u, a) => {
      const r = a.rig,
        s = r.height / 50,
        seat = studioRig.seated(r),
        sketch = id === 'desk-sketch',
        coding = book === 'laptop',
        reading = book === 'book';
      const reach = activityMotion.reach(r),
        deskX = 0.43 * reach + 2;
      const seatZ = studioRig.clamp(
        22.1 + 0.39 * reach - (r.shoulder[2] - r.pelvis[2]) - 0.052 * r.height,
        6,
        19
      );
      seat.hipOffset = [-2 * s, 0, seatZ + r.height * 0.052 - r.pelvis[2]];
      seat.headPitch = 0.21 + 0.025 * Math.cos(tau * u);
      seat.pitch = 0.11;
      seat.blink = activityMotion.blink(u);
      const desk = prop('desk', [deskX, 0, 0], 1),
        chair = prop('chair', [seat.hipOffset[0], 0, 0], seatZ / 13.1);
      const paper = prop(book, [deskX - 3.8, 0, 22.1], s),
        cycle = Math.sin(tau * u);
      const tipId = book === 'scroll' ? 'quill' : 'pen',
        page = span(u, 0.16, 0.62, 0.78, 1);
      const right = contact(
        paper,
        coding
          ? [0.8, -2.9, 0.9 + 0.46 * Math.sin(8 * tau * u)]
          : reading
            ? [0.1, -4 + 8 * page, 1 + 3 * Math.sin(Math.PI * page)]
            : [
                0.8 + cycle * (sketch ? 1.7 : 1),
                -0.6 + (sketch ? 1.6 * Math.cos(tau * u) : 1.8 * Math.sin(2 * tau * u)),
                0.95
              ]
      );
      const left = contact(
        paper,
        coding ? [0.5, 2.75, 0.9 + 0.41 * Math.sin(7 * tau * u + 0.5)] : [0.5, 3.35, 0.9]
      );
      const writing = !coding && !reading;
      seat.hands = [
        right.map((v, i) => v + (writing && i === 2 ? (tipId === 'quill' ? 2.8 : 1.95) * s : 0)),
        left
      ];
      const p = pose(r, seat);
      paper.page = reading ? page : 0;
      p.props = [desk, chair, paper];
      if (writing) p.props.push(atGrip(tipId, p.arms[0].hand, [0, 0, 0], s));
      return [entry(a, p)];
    };
    result.push({
      ...solo(id, label, group, seconds, school, sample, '桌子 椅子 书房 电脑 书写'),
      station: 'desk'
    });
  }
  result.push({
    ...solo(
      'switch-lamp',
      '伸手开关台灯',
      '家具与照明',
      3.8,
      school,
      (u, a) => {
        const r = a.rig,
          reach = activityMotion.reach(r),
          z = 22.5;
        const pulse = span(u, 0.04, 0.28, 0.35, 0.49) + span(u, 0.53, 0.73, 0.81, 0.96);
        const dip = Math.min(0, z + 0.42 * reach - r.shoulder[2]),
          ch = { hipOffset: [0, 0, dip * pulse], headPitch: 0.14 * pulse };
        const stand = pose(r, ch),
          gap = Math.max(0, z - r.shoulder[2]);
        const target = [
          r.shoulder[0] + Math.min(0.58 * reach, Math.sqrt(Math.max(0, reach * reach - gap * gap)) * 0.7),
          -r.shoulder[1],
          z
        ];
        const lamp = prop('lamp', [target[0] - 2, target[1], 21.1], 1);
        const base = prop('desk', [target[0] + 4, target[1] + 8, 0], 1);
        ch.hands = [activityMotion.between(stand.arms[0].hand, target, pulse), stand.arms[1].hand];
        const p = pose(r, ch);
        lamp.on = u >= 0.28 && u < 0.73;
        p.props = [base, lamp];
        return [entry(a, p)];
      },
      '灯 光源 开灯 关灯 家具'
    ),
    station: 'lamp'
  });
  return result;
})();
