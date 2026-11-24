// Shared by the scene editor, motion props, the Canvas projector and the Three.js adapter.
// All point coordinates are in the rig's +X forward, +Y left, +Z up space.
const PineWorld = (() => {
  const realms = { modern: '现代', historic: '古代', fantasy: '奇幻', scifi: '科幻' };
  const families = {
    transport: '交通工具',
    plants: '花草树木',
    buildings: '建筑与设施',
    furniture: '家具与照明',
    office: '书写与数码',
    home: '日用与文娱',
    trades: '职业器具',
    wonders: '奇幻与科技装置'
  };
  const items = new Map();
  const painters = Object.create(null);
  const worldColors = {
    wood: 'ae7751',
    bark: '79513e',
    timber: 'd5a576',
    iron: '425963',
    steelBlue: '7797a1',
    linen: 'f3dfb2',
    teal: '498e87',
    amber: 'edb552',
    rose: 'c56c79',
    moss: '608550',
    sprout: 'a1b96c',
    fir: '396d5d',
    tile: 'ab6153',
    paper: 'ffebbc',
    violet: '867eb6',
    crystal: '80d8dc',
    shine: 'd9fff2',
    night: '404560',
    sand: 'd7b77d',
    stone: '91a49e'
  };
  const materials = Object.fromEntries(
    Object.entries(worldColors).map(([key, value]) => ['world_' + key, value])
  );
  const brushColors = new WeakMap();
  function inks(palette) {
    if (!brushColors.has(palette))
      brushColors.set(
        palette,
        Object.fromEntries(Object.keys(worldColors).map((key) => [key, palette['world_' + key]]))
      );
    return brushColors.get(palette);
  }
  const all = Object.keys(realms);
  const both = ['modern', 'scifi'],
    old = ['historic', 'fantasy'];
  function item(id, label, family, eras, box, lift = 0, anchors = {}, paint = null) {
    items.set(id, { id, label, family, realms: eras, box, lift, anchors });
    if (paint) painters[id] = (brush) => paint({ ...brush, k: inks(brush.k) });
  }
  item('rover', '山地勘探车', 'transport', both, [60, 38, 28], 0, { seat: [2, 0, 12] });
  item('aircraft', '双发像素飞机', 'transport', both, [88, 68, 28], 0, { cockpit: [10, 0, 12] });
  function ring(line, center, r, axis, color, tube = 0.72) {
    let last;
    for (let i = 0; i <= 24; i++) {
      const a = (i * Math.PI) / 12,
        p = center.slice();
      p[(axis + 1) % 3] += r * Math.cos(a);
      p[(axis + 2) % 3] += r * Math.sin(a);
      if (last) line(last, p, tube, color);
      last = p;
    }
  }
  item(
    'bicycle',
    '城市自行车',
    'transport',
    both,
    [38, 12, 28],
    0,
    { seat: [-2, 0, 18], handle: [9, 0, 20] },
    ({ line, box, oval, k }) => {
      for (const x of [-10, 10]) {
        ring(line, [x, 0, 7.4], 6.6, 1, k.iron, 0.85);
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          line([x, 0, 7.4], [x + 6.1 * Math.cos(a), 0, 7.4 + 6.1 * Math.sin(a)], 0.42, k.steelBlue);
        }
      }
      for (const [a, b] of [
        [
          [-10, 0, 7.4],
          [-2, 0, 16]
        ],
        [
          [-2, 0, 16],
          [1, 0, 7.6]
        ],
        [
          [1, 0, 7.6],
          [-10, 0, 7.4]
        ],
        [
          [1, 0, 7.6],
          [8, 0, 16.6]
        ],
        [
          [-2, 0, 16],
          [8, 0, 16.6]
        ],
        [
          [10, 0, 7.4],
          [7.5, 0, 20.3]
        ]
      ])
        line(a, b, 0.83, k.teal);
      oval([-2.5, 0, 17.6], [2.6, 1.45, 0.89], k.bark);
      line([7.5, -4, 20.5], [7.5, 4, 20.5], 0.69, k.iron);
      box([1, 1.8, 7.2], [1.3, 0.8, 0.5], k.amber);
    }
  );
  item(
    'handcart',
    '木轮手推车',
    'transport',
    old,
    [38, 26, 18],
    0,
    { handle: [15, 0, 10] },
    ({ box, line, k }) => {
      for (const y of [-9, 9]) {
        ring(line, [-4, y, 5.8], 5, 1, k.bark, 0.95);
        for (const dx of [-3.5, 3.5]) line([-4 - dx, y, 2.3], [-4 + dx, y, 9.3], 0.63, k.wood);
        line([0, y, 6], [16, y, 10], 0.9, k.wood);
      }
      box([-4, 0, 7.2], [8, 8.6, 1.2], k.wood);
      for (const y of [-8, 8]) for (const z of [10, 13]) box([-4, y, z], [8, 0.75, 1.05], k.timber);
      box([-11.7, 0, 11], [0.8, 8, 3.5], k.wood);
    }
  );
  item(
    'shuttle',
    '磁悬浮通勤艇',
    'transport',
    ['scifi'],
    [54, 30, 20],
    0,
    { seat: [1, 0, 10] },
    ({ box, oval, k }) => {
      oval([0, 0, 7], [23, 9, 4.3], k.steelBlue, 2.5);
      oval([2, 0, 10.7], [12, 7, 4.6], k.night);
      for (const sign of [-1, 1]) {
        oval([-5, sign * 9, 5], [14, 2.8, 3.1], k.iron);
        box([-7, sign * 11.4, 5.2], [7, 0.5, 0.9], k.crystal);
      }
      oval([15, 0, 8.5], [5, 5.8, 1.2], k.linen);
    }
  );
  function groundPlant(kind) {
    return ({ line, oval, k }) => {
      const offsets = [
        [-5, -2, 6],
        [-2, 3, 9],
        [1, -3, 8],
        [4, 2, 7],
        [0.4, 1, 10],
        [4, -3, 4],
        [-5, 3, 5]
      ];
      for (const [x, y, h] of offsets) {
        line([x * 0.5, y * 0.55, 0.5], [x, y, h], kind === 'grass' ? 0.63 : 0.55, k.moss);
        oval([x * 0.77 + 1, y * 0.8, h * 0.48], [1.8, 0.8, 0.65], k.sprout);
        if (kind === 'grass') continue;
        for (let i = 0; i < 5; i++) {
          const a = (i * 2 * Math.PI) / 5;
          oval(
            [x + 1.12 * Math.cos(a), y + 1.12 * Math.sin(a), h],
            [1.12, 0.95, 0.74],
            kind === 'daisies' ? k.linen : k.rose
          );
        }
        oval([x, y, h + 0.49], [0.8, 0.83, 0.58], k.amber);
      }
    };
  }
  for (const [id, label] of [
    ['grass', '青草丛'],
    ['daisies', '野雏菊'],
    ['poppies', '花圃虞美人']
  ])
    item(id, label, 'plants', all, [18, 16, 14], 0, {}, groundPlant(id));
  function tree(style) {
    return ({ line, oval, k }) => {
      line([0, 0, 1], [0.9, -0.4, 28], 2.1, k.bark);
      if (style === 'pine') {
        for (const [z, r] of [
          [16, 13],
          [23, 11],
          [30, 8.8],
          [37, 6],
          [42, 3.4]
        ])
          for (let j = 0; j < 4; j++)
            oval(
              [0.5, 0, z + j * 1.25],
              [r * (1 - j * 0.18), r * (1 - j * 0.18) * 0.89, 2.5],
              j === 3 ? k.moss : k.fir
            );
      } else {
        for (const [x, y, z, r] of [
          [-7, 1, 24, 8.5],
          [7, -2, 27, 8.4],
          [2, 5, 31, 8],
          [-1, -4, 34, 7.7],
          [0.5, 1, 38, 6.9]
        ]) {
          line([0.4, 0, 13], [x, y, z], 1.25, k.wood);
          oval([x, y, z], [r, r * 0.85, r * 0.76], style === 'blossom' ? k.rose : k.moss);
          oval(
            [x - 1.6, y + 1.4, z + r * 0.38],
            [r * 0.67, r * 0.65, r * 0.43],
            style === 'blossom' ? k.linen : k.sprout
          );
        }
      }
    };
  }
  for (const [id, label] of [
    ['pine', '层枝松树'],
    ['oak', '庭院阔叶树'],
    ['blossom', '春日花树']
  ])
    item(id, label, 'plants', all, [36, 34, 49], 0, {}, tree(id));
  item('moonshroom', '月光巨菇', 'plants', ['fantasy'], [26, 26, 28], 0, {}, ({ oval, k }) => {
    oval([0, 0, 9], [3.4, 3.8, 9.8], k.linen);
    oval([0, 0, 17], [11.4, 11.4, 3.1], k.paper);
    oval([0, 0, 19.8], [11, 11, 5.5], k.violet);
    for (const [x, y, z] of [
      [3, 4, 24],
      [-5, 0, 23.8],
      [5, -6, 22.5]
    ])
      oval([x, y, z], [1.7, 1.5, 0.8], k.crystal);
  });
  function building(style) {
    return ({ box, oval, line, k }) => {
      if (style === 'dome') {
        oval([0, 0, 3], [22, 20, 3], k.iron, 3);
        oval([0, 0, 5], [20, 18, 17], k.steelBlue);
        for (const y of [-8, 0, 8]) box([16, y, 9], [2.3, 2.2, 2], k.crystal);
        box([19, 0, 5], [3, 4.5, 5], k.night);
        return;
      }
      const pavilion = style === 'pavilion',
        stall = style === 'stall';
      box([0, 0, 1.1], [16, 14, 1.1], k.stone);
      if (!pavilion && !stall) {
        box([0, 0, 11.4], [13.8, 11.8, 9.4], k.linen);
        box([13.8, 0, 7.7], [0.6, 3, 5.7], k.bark);
        for (const y of [-7.3, 7.3]) {
          box([13.9, y, 13], [0.7, 2.2, 2.5], k.teal);
          box([14.55, y, 13], [0.3, 0.4, 2.5], k.timber);
        }
      }
      for (const x of [-12, 12])
        for (const y of [-10, 10]) box([x, y, 11.8], [1.15, 1.15, 10], pavilion ? k.tile : k.wood);
      if (stall) {
        box([9, 0, 10], [4, 11.8, 1], k.timber);
        for (let j = -3; j <= 3; j++) box([0, j * 4, 22], [16, 2, 1.2], j % 2 ? k.teal : k.linen);
      } else
        for (let i = 0; i < 8; i++) {
          const rx = pavilion ? 17 - i : 16,
            ry = 15 - i * 1.7;
          box([0, 0, 21 + i * 1.2], [rx, ry, 1], i === 0 ? k.bark : pavilion ? k.fir : k.tile);
        }
      if (pavilion) line([-10, 0, 31], [10, 0, 31], 1, k.amber);
    };
  }
  for (const [id, label, eras] of [
    ['cottage', '瓦顶街屋', all],
    ['stall', '条纹市集摊位', ['modern', 'historic', 'fantasy']],
    ['pavilion', '木构凉亭', old],
    ['dome', '观测站穹顶', ['scifi']]
  ])
    item(id, label, 'buildings', eras, [48, 44, 36], 0, {}, building(id));
  function furniture(kind) {
    return ({ box, line, oval, k, item }) => {
      if (kind === 'lamp') {
        oval([0, 0, 0.8], [3.9, 3.9, 0.8], k.iron);
        line([0, 0, 1], [0, 0, 10], 0.65, k.steelBlue);
        line([0, 0, 10], [2.6, 0, 13], 0.68, k.teal);
        oval([3, 0, 11.9], [3.8, 3.1, 2], k.teal);
        oval([3, 0, 10.85], [3.25, 2.75, 0.65], item.on === false ? k.steelBlue : k.paper);
        box([2, 0, 1.4], [0.6, 0.7, 0.49], k.amber);
        return;
      }
      const desk = kind === 'desk',
        bench = kind === 'bench',
        x = desk ? 10 : 5.2,
        y = desk ? 17 : bench ? 14 : 5.4,
        z = desk ? 20 : 12;
      for (const dx of [-1, 1])
        for (const dy of [-1, 1]) box([dx * (x - 1.4), dy * (y - 1.4), z / 2], [0.9, 0.9, z / 2], k.bark);
      box([0, 0, z], [x, y, 1.1], k.timber);
      if (!desk) {
        for (const dy of [-1, 1])
          line([-x + 1, dy * (y - 1), z], [-x + 0.2, dy * (y - 1), z + 9], 0.85, k.bark);
        for (const lift of [4.5, 8.3]) box([-x, 0, z + lift], [0.8, y, 1.15], k.wood);
      } else {
        box([-4, 9, 17], [4.1, 5.5, 1.8], k.wood);
        box([0.2, 9, 17], [0.45, 1.3, 0.43], k.iron);
      }
    };
  }
  item('desk', '木制书桌', 'furniture', all, [24, 38, 24], 0, { surface: [0, 0, 21.1] }, furniture('desk'));
  item('chair', '靠背椅', 'furniture', all, [15, 15, 24], 0, { seat: [0, 0, 13.1] }, furniture('chair'));
  item('bench', '公园长椅', 'furniture', all, [16, 33, 24], 0, { seat: [0, 0, 13.1] }, furniture('bench'));
  item('lamp', '可开关台灯', 'furniture', both, [17, 11, 16], 0, { switch: [2, 0, 1.4] }, furniture('lamp'));
  // Existing motion props use the same painter when placed on a table or on the ground.
  for (const [id, label, family, eras, box, lift, anchors] of [
    ['phone', '智能手机', 'office', both, [5, 6, 8], 3, { screen: [0, 0, 0] }],
    ['laptop', '笔记本电脑', 'office', both, [19, 20, 13], 1.5, { keyboard: [0, 0, 0] }],
    ['stool', '折叠凳', 'furniture', all, [12, 17, 10], 8, { seat: [0, 0, 0] }],
    ['book', '展开的书', 'office', all, [11, 15, 8], 1, { page: [0, 2, 1] }],
    ['pen', '签字笔', 'office', both, [5, 5, 7], 2.3],
    ['camera', '照相机', 'office', both, [8, 9, 8], 2.4],
    ['bowl', '餐碗', 'home', all, [8, 8, 6], 2.7],
    ['spoon', '汤匙', 'home', all, [5, 11, 4], 1],
    ['parcel', '包裹', 'home', all, [10, 12, 9], 3.3],
    ['broom', '扫帚', 'home', all, [7, 10, 22], 14],
    ['wateringCan', '浇花壶', 'home', all, [13, 7, 8], 3.5],
    ['plant', '桌面盆栽', 'plants', all, [9, 9, 11], 0.2],
    ['guitar', '木吉他', 'home', ['modern', 'historic', 'fantasy'], [6, 23, 12], 4.6],
    ['drum', '小鼓', 'home', all, [11, 11, 7], 2.1],
    ['ball', '软球', 'home', all, [7, 7, 7], 2.4],
    ['rattle', '宝宝摇铃', 'home', all, [6, 6, 8], 1.6],
    ['comb', '梳子', 'home', all, [5, 7, 8], 2],
    ['brush', '牙刷', 'home', all, [4, 11, 4], 1.2]
  ])
    item(id, label, family, eras, box, lift, anchors);
  function implement(id, label, family, eras, box, lift, paint, anchors = { grip: [0, 0, 0] }) {
    item(id, label, family, eras, box, lift, anchors, paint);
  }
  implement(
    'notebook',
    '线圈笔记本',
    'office',
    both,
    [10, 13, 5],
    0.5,
    ({ box, oval, k }) => {
      box([0, 0, 0], [3.7, 4.9, 0.45], k.teal);
      box([0, 0.32, 0.46], [3.52, 4.3, 0.31], k.paper);
      for (let j = -3; j <= 3; j++) box([0, j + 0.32, 0.84], [2.6, 0.12, 0.1], k.steelBlue);
      for (const x of [-2.6, -1, 1, 2.6]) oval([x, -4.3, 0.45], [0.3, 0.55, 0.51], k.iron);
    },
    { page: [0, 0, 0.85] }
  );
  implement(
    'guide-flag',
    '导游手旗',
    'trades',
    ['modern', 'historic', 'fantasy'],
    [7, 11, 19],
    3,
    ({ line, box, k }) => {
      line([0, 0, -2.6], [0, 0, 13.4], 0.47, k.timber);
      for (let j = 0; j < 6; j++)
        box(
          [Math.sin(j * 0.65) * 0.6, 1 + j, 11.15 - 0.22 * j],
          [0.42, 0.6, 2.2 - 0.18 * j],
          j === 1 ? k.linen : k.rose
        );
    }
  );
  implement('scanner', '手持扫码器', 'trades', both, [7, 6, 8], 2.3, ({ box, line, k }) => {
    line([0, 0, -1.6], [0.6, 0, 1.7], 0.76, k.iron);
    box([1, 0, 1.9], [1.85, 1, 0.86], k.steelBlue);
    box([2.74, 0, 1.9], [0.38, 0.74, 0.51], k.rose);
  });
  implement('clipboard', '记录夹板', 'office', both, [9, 11, 4], 0.7, ({ box, k }) => {
    box([0, 0, 0], [3.7, 4.3, 0.4], k.bark);
    box([0, 0, 0.43], [3.3, 3.9, 0.18], k.paper);
    box([0, 3.5, 0.65], [1.45, 0.6, 0.22], k.steelBlue);
    for (let i = -2; i < 3; i++) box([-0.15, i, 0.69], [2.3, 0.15, 0.12], k.iron);
  });
  implement('scroll', '双轴长卷', 'office', old, [10, 19, 5], 1.4, ({ box, line, k }) => {
    box([0, 0, 0], [3.7, 6, 0.23], k.paper);
    for (const y of [-6, 6]) line([-4.2, y, 0.13], [4.2, y, 0.13], 1.05, k.timber);
    for (let j = -4; j < 5; j += 2) box([-0.3, j, 0.33], [2, 0.22, 0.17], k.bark);
  });
  implement('quill', '书写毛笔', 'trades', old, [5, 5, 12], 3.1, ({ line, oval, k }) => {
    line([0, 0, -1.3], [0, 0, 6.7], 0.43, k.wood);
    oval([0, 0, -1.8], [0.73, 0.73, 1.46], k.night);
  });
  implement('fan', '折扇', 'trades', old, [7, 16, 12], 1.8, ({ line, k }) => {
    for (let j = -5; j <= 5; j++) {
      const a = j * 0.16;
      line([0, 0, -1], [0, Math.sin(a) * 8, Math.cos(a) * 8], 0.51, k.timber);
      line(
        [0, Math.sin(a) * 3, Math.cos(a) * 3],
        [0, Math.sin(a) * 8, Math.cos(a) * 8],
        0.81,
        j % 2 ? k.linen : k.rose
      );
    }
  });
  implement('mug', '陶瓷杯', 'home', all, [9, 8, 7], 2.5, ({ oval, line, k }) => {
    oval([0, 0, 0.3], [2.1, 2.1, 2.4], k.teal, 3.5);
    oval([0, 0, 2.34], [1.65, 1.65, 0.29], k.bark);
    for (const z of [-0.8, 1.35]) line([1.45, 0, z], [3.2, 0, z], 0.55, k.teal);
    line([3.2, 0, -0.8], [3.2, 0, 1.35], 0.55, k.teal);
  });
  implement(
    'lantern',
    '提梁灯笼',
    'furniture',
    old,
    [10, 10, 14],
    6.5,
    ({ oval, line, k }) => {
      oval([0, 0, -1], [3.45, 3.45, 3.9], k.rose, 2.5);
      for (const z of [-4.5, 2.5]) oval([0, 0, z], [2.45, 2.45, 0.68], k.amber);
      for (const y of [-2, 2]) line([0, y, 2.8], [0, 0, 5.5], 0.4, k.wood);
      line([0, 0, -4.8], [0, 0, -6.2], 0.5, k.amber);
    },
    { grip: [0, 0, 5.5] }
  );
  implement('astrolabe', '观星盘', 'wonders', old, [7, 12, 12], 4.6, ({ line, oval, k }) => {
    ring(line, [0, 0, 0], 4, 0, k.amber, 0.56);
    line([0, -2.8, -2.8], [0, 2.8, 2.8], 0.56, k.timber);
    line([0, 0, -3.9], [0, 0, 3.9], 0.42, k.linen);
    oval([0, 0.4, 0.4], [0.8, 0.9, 0.9], k.teal);
  });
  implement('prism', '浮光晶石', 'wonders', ['fantasy', 'scifi'], [8, 8, 11], 4, ({ oval, k }) => {
    oval(
      [0, 0, 0.8],
      [2.7, 2.4, 4.7],
      (x, y) => (x - y > 1 ? k.shine : x + y > 0 ? k.crystal : k.violet),
      1.05
    );
  });
  implement('probe', '环境探测仪', 'wonders', ['scifi'], [8, 7, 10], 2.6, ({ box, line, oval, k }) => {
    box([0, 0, 0.4], [1.1, 1.6, 2.6], k.night);
    box([1.1, 0, 0.9], [0.29, 1.25, 1.15], k.crystal);
    line([0, -0.9, 2.4], [0, -0.9, 5.6], 0.41, k.steelBlue);
    oval([0, -0.9, 5.7], [0.68, 0.72, 0.73], k.rose);
  });
  implement('beacon', '信号航标', 'wonders', ['scifi'], [17, 17, 25], 0, ({ box, line, oval, k }) => {
    oval([0, 0, 2], [6.8, 6.8, 2], k.iron);
    line([0, 0, 2], [0, 0, 18], 1.15, k.steelBlue);
    for (const z of [12, 18]) oval([0, 0, z], [4.1, 4.1, 1], k.teal);
    oval([0, 0, 16], [2.5, 2.5, 3.8], k.crystal);
  });
  implement('waygate', '晶石拱门', 'wonders', ['fantasy'], [18, 35, 38], 0, ({ box, oval, k }) => {
    for (const sign of [-1, 1]) {
      box([0, sign * 12, 2], [4, 4, 2], k.stone);
      for (let i = 0; i < 6; i++)
        box(
          [0, sign * (12 - Math.max(0, i - 3) * 2), 5 + i * 4.5],
          [2.7, 2.6, 2.4],
          i % 2 ? k.violet : k.stone
        );
    }
    oval([0, 0, 31], [3.2, 6.8, 3.6], k.crystal, 1.3);
  });
  // Model cell sizes convert the original drawing grid to a shared human scale.
  const scales = {
    rover: 1.65,
    aircraft: 2.45,
    bicycle: 1.28,
    handcart: 1.25,
    shuttle: 2.15,
    cottage: 2.5,
    pavilion: 2.55,
    stall: 2.35,
    dome: 2.85,
    pine: 1.65,
    oak: 1.75,
    blossom: 1.65,
    waygate: 1.75
  };
  for (const def of items.values()) def.scale = scales[def.id] || 1;
  function register(def, paint) {
    const { id, label, family, realms: eras, box, lift = 0, scale = 1, anchors = {} } = def;
    if (
      typeof id !== 'string' ||
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      items.has(id) ||
      ['water', 'mat'].includes(id)
    )
      throw Error('无效或重复的物件 ID');
    if (
      typeof label !== 'string' ||
      !label.trim() ||
      !Object.hasOwn(families, family) ||
      !Array.isArray(eras) ||
      !eras.length ||
      !eras.every((e) => Object.hasOwn(realms, e))
    )
      throw Error('物件分类或时代无效');
    if (
      !Array.isArray(box) ||
      box.length !== 3 ||
      !box.every((n) => Number.isFinite(n) && n > 0 && n <= 256) ||
      !Number.isFinite(lift) ||
      !(Number.isFinite(scale) && scale > 0) ||
      typeof paint !== 'function'
    )
      throw Error('需要有效的采样盒、比例与绘制函数');
    if (
      !anchors ||
      typeof anchors !== 'object' ||
      Array.isArray(anchors) ||
      !Object.values(anchors).every((v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite))
    )
      throw Error('接触点需要三个坐标');
    item(
      id,
      label,
      family,
      [...new Set(eras)],
      box.slice(),
      lift,
      Object.fromEntries(Object.entries(anchors).map(([k, v]) => [k, v.slice()])),
      paint
    );
    const entry = items.get(id);
    entry.scale = scale;
    return entry;
  }
  const cache = new Map();
  function geometry(id) {
    if (cache.has(id)) return cache.get(id);
    const def = items.get(id);
    if (!def) throw Error('未知场景物件 ' + id);
    let result;
    if (id === 'rover' || id === 'aircraft') result = pineVehicleSlices.model(id);
    else {
      const density = Math.max(...def.box) > 25 ? 1 : 3;
      const body = createSliceActor({ materials: {}, paint() {} }, density, studioProps, def.box);
      const prop = activityMotion.prop(id, [0, 0, def.lift], 1);
      result = { body, model: body.makePose({ arms: [], props: [prop] }) };
    }
    if (def.scale !== 1) {
      const b = result.body;
      result.body = createSliceProjector(b.nx, b.ny, b.nz, b.density / def.scale);
    }
    cache.set(id, result);
    return result;
  }
  const place = (kind, x = 0, y = 0, z = 0, heading = 0) => ({ kind, x, y, z, heading });
  const scenes = {
    street: {
      label: '街角出行',
      objects: [
        place('rover', -28, 46, 0, 0.15),
        place('bicycle', 17, -22, 0, -0.35),
        place('oak', -48, -30),
        place('grass', -23, -19)
      ]
    },
    garden: {
      label: '春日花园',
      objects: [
        place('bench', -14, 17),
        place('blossom', -30, -19),
        place('daisies', 4, -15),
        place('poppies', -5, 16),
        place('grass', -18, -10)
      ]
    },
    study: {
      label: '书桌一角',
      objects: [
        place('desk', -13, 18),
        place('lamp', -17, 27, 21.1),
        place('book', -10, 16, 21.1),
        place('chair', 0, 18, 0, Math.PI)
      ]
    },
    airfield: {
      label: '小型机场',
      objects: [place('aircraft', -67, 56, 0, 0.25), place('beacon', -26, -47), place('grass', 13, -17)]
    },
    market: {
      label: '古镇集市',
      objects: [place('stall', -36, 38), place('handcart', -8, -21), place('lantern', -10, 22, 11)]
    },
    grove: {
      label: '月光林地',
      objects: [
        place('waygate', -24, 12),
        place('moonshroom', -12, -16),
        place('moonshroom', -30, -25),
        place('daisies', -5, 17)
      ]
    },
    station: {
      label: '星港观测站',
      objects: [place('dome', -53, 50), place('shuttle', -15, -46, 0, 0.3), place('beacon', -18, 3)]
    }
  };
  function normalize(scene) {
    if (!Array.isArray(scene) || scene.length > 64) throw Error('场景最多容纳 64 个物件');
    return scene.map((p) => {
      if (
        !p ||
        !items.has(p.kind) ||
        Object.keys(p).some((k) => !['kind', 'x', 'y', 'z', 'heading'].includes(k))
      )
        throw Error('场景含有未知物件或字段');
      const q = { kind: p.kind };
      for (const k of ['x', 'y', 'z', 'heading']) {
        const v = p[k] === undefined ? 0 : p[k];
        if (
          !Number.isFinite(v) ||
          Math.abs(v) > (k === 'heading' ? Math.PI * 2 : 256) ||
          (k === 'z' && v < 0)
        )
          throw Error('场景位置或角度超出范围');
        q[k] = v;
      }
      return q;
    });
  }
  return { realms, families, items, painters, materials, geometry, place, scenes, normalize, register };
})();
globalThis.PineWorld = PineWorld;
