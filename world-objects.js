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
    stone: '91a49e',
    stoneJoint: '839790'
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
  // Both sampling densities have a voxel boundary at these floor heights.
  const stoneFloor = 2, domeFloor = 6, stallEaves = 28;
  function building(style) {
    return ({ box, oval, line, k }) => {
      if (style === 'dome') {
        oval([0, 0, 3], [22, 20, 3], k.iron, 3);
        oval([0, 0, 5], [20, 18, 17], (x, y, z) =>
          z <= domeFloor || (x / 18.5) ** 2 + (y / 16.5) ** 2 + ((z - 5) / 15.5) ** 2 >= 1 ? k.steelBlue : 0);
        for (const y of [-8, 0, 8]) box([16, y, 9], [2.3, 2.2, 2], k.crystal);
        box([19, 0, 5], [3, 4.5, 5], k.night);
        return;
      }
      const pavilion = style === 'pavilion',
        stall = style === 'stall';
      box([0, 0, stoneFloor / 2], [16, 14, stoneFloor / 2], k.stone);
      if (!pavilion && !stall) {
        for (const side of [-1, 1]) {
          box([side * 13.2, 0, 11.4], [0.6, 11.8, 9.4], k.linen);
          box([0, side * 11.2, 11.4], [13.8, 0.6, 9.4], k.linen);
        }
        box([13.8, 0, 7.7], [0.6, 3, 5.7], k.bark);
        for (const y of [-7.3, 7.3]) {
          box([13.9, y, 13], [0.7, 2.2, 2.5], k.teal);
          box([14.55, y, 13], [0.3, 0.4, 2.5], k.timber);
        }
      }
      const postTop = stall ? stallEaves + 1.2 : 21.8, postBase = 1.8;
      for (const x of [-12, 12])
        for (const y of [-10, 10]) box([x, y, (postTop + postBase) / 2],
          [1.15, 1.15, (postTop - postBase) / 2], pavilion ? k.tile : k.wood);
      if (stall) {
        box([9, 0, 10], [4, 11.8, 1], k.timber);
        for (let j = -3; j <= 3; j++) box([0, j * 4, stallEaves + 1.2], [16, 2, 1.2], j % 2 ? k.teal : k.linen);
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
  const stairs = {
    count: 14, tread: 3, rise: 2, start: -28, halfWidth: 8, landing: 14, deck: 2, scale: 2.5,
    // World-unit foot marks. Marks before the flight and past its last tread are level.
    foothold(n) {
      return [(this.start + (n - 0.5) * this.tread) * this.scale,
        Math.max(0, Math.min(this.count, n)) * this.rise * this.scale];
    },
    routeBounds(p, height) {
      const points = [], c = Math.cos(p.heading), s = Math.sin(p.heading);
      for (const n of [-1, this.count + 3]) {
        const [center, floor] = this.foothold(n);
        for (const x of [center - 0.35 * height, center + 0.35 * height])
          for (const y of [-this.halfWidth * this.scale, this.halfWidth * this.scale])
            for (const z of [0, floor + 1.15 * height])
              points.push([p.x + c * x - s * y, p.y + s * x + c * y, p.z + z]);
      }
      return points;
    }
  };
  item('stairs', '木踏步楼梯与楼台', 'buildings', all, [60, 22, 42], 0, {}, ({ box, line, k }) => {
    const { count, tread, rise, start, halfWidth: w, landing, deck } = stairs;
    const end = start + count * tread, top = count * rise, railY = w - 0.7, railHeight = 9;
    for (let i = 0; i < count; i++) {
      const x = start + (i + 0.5) * tread, z = (i + 1) * rise;
      box([x, 0, z / 2], [tread / 2, w, z / 2], k.stone);
      box([x, 0, z - 0.5], [tread / 2, w + 0.35, 0.5], i % 2 ? k.timber : k.wood);
      if (i % 3 === 0) box([x, railY, z + railHeight / 2], [0.45, 0.55, railHeight / 2], k.iron);
    }
    for (const side of [-w, w]) {
      for (let z = 4; z < top; z += 4) {
        const left = start + (z / rise) * tread;
        box([(left + end) / 2, side, z], [(end - left) / 2, 0.28, 0.24], k.stoneJoint);
        for (let x = left + (z % 8 ? 2 : 5); x < end - 0.5; x += 8)
          box([x, side, z - 2], [0.25, 0.28, 2], k.stoneJoint);
      }
    }
    box([end + landing / 2, 0, top - deck / 2], [landing / 2, w, deck / 2], k.bark);
    for (let board = 0; board < 7; board++)
      box([end + 1 + board * 2, 0, top - 0.5], [1, w + 0.35, 0.5], board % 3 ? k.timber : k.wood);
    for (const y of [-railY, railY]) {
      box([end + landing - 1, y, top / 2], [0.9, 0.9, top / 2], k.iron);
      line([end + landing - 1, y, top - 7], [end + landing - 6, y, top - deck], 0.7, k.steelBlue);
    }
    for (const x of [end, end + landing - 1])
      box([x, railY, top + railHeight / 2], [0.55, 0.55, railHeight / 2], k.iron);
    for (const up of [4, railHeight]) {
      const a = [start + tread / 2, railY, rise + up], b = [end - tread / 2, railY, top + up];
      line(a, b, up === railHeight ? 0.8 : 0.42, up === railHeight ? k.bark : k.steelBlue);
      line(b, [end + landing - 0.5, railY, top + up], up === railHeight ? 0.8 : 0.42,
        up === railHeight ? k.bark : k.steelBlue);
    }
  });
  const deskTop = { x: 10, y: 17, height: 21.1 };
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
        x = desk ? deskTop.x : 5.2,
        y = desk ? deskTop.y : bench ? 14 : 5.4,
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
  item('desk', '木制书桌', 'furniture', all, [24, 38, 24], 0, { surface: [0, 0, deskTop.height] }, furniture('desk'));
  item('chair', '靠背椅', 'furniture', all, [15, 15, 24], 0, { seat: [0, 0, 13.1] }, furniture('chair'));
  item('bench', '公园长椅', 'furniture', all, [16, 33, 24], 0, { seat: [0, 0, 13.1] }, furniture('bench'));
  item('lamp', '可开关台灯', 'furniture', both, [17, 11, 16], 0, { switch: [2, 0, 1.4] }, furniture('lamp'));
  // Existing motion props use the same painter when placed on a table or on the ground.
  for (const [id, label, family, eras, box, lift, anchors] of [
    ['phone', '智能手机', 'office', both, [5, 6, 8], 3, { screen: [0, 0, 0] }],
    ['laptop', '笔记本电脑', 'office', both, [19, 20, 13], 1.5, { keyboard: [0, 0, 0] }],
    ['stool', '折叠凳', 'furniture', all, [12, 17, 10], 8, { seat: [0, 0, 0] }],
    ['mat', '条纹软垫', 'home', all, [49, 20, 4], .1],
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
    stairs: stairs.scale,
    dome: 2.85,
    pine: 1.65,
    oak: 1.75,
    blossom: 1.65,
    waygate: 1.75
  };
  for (const def of items.values()) def.scale = scales[def.id] || 1;
  // Heights in the asset's sampling box, before its display scale.
  for (const [id, floor, cutHeight, halfX, halfY] of [
    ['pavilion', stoneFloor, 20, 16, 14], ['stall', stoneFloor, stallEaves, 16, 14],
    ['cottage', stoneFloor, 19.8, 12.6, 10.6], ['dome', domeFloor, 13, 13, 11]
  ]) items.get(id).interior = { floor, cutHeight, footprint: [halfX, halfY] };
  const landingHeight = stairs.count * stairs.rise;
  items.get('stairs').interior = { floor: landingHeight, underside: landingHeight - stairs.deck,
    origin: [stairs.start + stairs.count * stairs.tread + stairs.landing / 2, 0],
    footprint: [stairs.landing / 2, stairs.halfWidth] };
  function register(def, paint) {
    const { id, label, family, realms: eras, box, lift = 0, scale = 1, anchors = {} } = def;
    if (
      typeof id !== 'string' ||
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      items.has(id) ||
      id === 'water'
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
    const interior = def.interior;
    if (interior !== undefined && (!interior || !Number.isFinite(interior.floor) ||
        interior.floor < 0 || interior.floor >= box[2] || (interior.cutHeight !== undefined &&
        (!Number.isFinite(interior.cutHeight) || interior.cutHeight < interior.floor || interior.cutHeight > box[2]))))
      throw Error('室内地坪与剖开高度须位于采样盒内');
    if (interior?.footprint !== undefined && (!Array.isArray(interior.footprint) || interior.footprint.length !== 2 ||
        !interior.footprint.every((n, i) => Number.isFinite(n) && n > 0 && n <= box[i] / 2)))
      throw Error('室内地坪范围需要两个有效的半宽');
    if (interior?.origin !== undefined && (!Array.isArray(interior.origin) || interior.origin.length !== 2 ||
        !interior.origin.every((n, i) => Number.isFinite(n) && Math.abs(n) <= box[i] / 2)))
      throw Error('地坪原点需要采样盒内的两个平面坐标');
    if (interior?.underside !== undefined && (!Number.isFinite(interior.underside) || interior.underside < 0 || interior.underside >= interior.floor))
      throw Error('架空楼板的底面须低于楼面');
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
    if (interior) entry.interior = { floor: interior.floor, cutHeight: interior.cutHeight ?? interior.floor,
      footprint: interior.footprint?.slice() ?? [box[0] / 2, box[1] / 2],
      ...(interior.origin ? { origin: interior.origin.slice() } : {}),
      ...(interior.underside === undefined ? {} : { underside: interior.underside }) };
    return entry;
  }
  const cache = new Map();
  function detailMode(value = 'figure') {
    if (value !== 'figure' && value !== 'standard') throw Error('场景精细度须为 figure 或 standard');
    return value;
  }
  function geometry(id, detail = 'figure') {
    detailMode(detail);
    const def = items.get(id);
    if (!def) throw Error('未知场景物件 ' + id);
    const bitmap = id === 'rover' || id === 'aircraft';
    const base = Math.max(...def.box) > 25 ? 1 : 3;
    const canRefine = def.box.reduce((cells, size) => cells * Math.ceil(size * (base + 1)), 1) <= 1000000;
    const density = !bitmap && detail === 'figure' && canRefine ? base + 1 : base;
    const key = id + '/' + density;
    if (cache.has(key)) return cache.get(key);
    let result;
    if (bitmap) result = pineVehicleSlices.model(id);
    else {
      const body = createSliceActor({ materials: {}, paint() {} }, density, studioProps, def.box);
      const prop = activityMotion.prop(id, [0, 0, def.lift], 1);
      result = { body, model: body.makePose({ arms: [], props: [prop] }) };
    }
    if (def.scale !== 1) {
      const b = result.body;
      result.body = createSliceProjector(b.nx, b.ny, b.nz, b.density / def.scale);
    }
    cache.set(key, result);
    return result;
  }
  const place = (kind, x = 0, y = 0, z = 0, heading = 0) => ({ kind, x, y, z, heading });
  const sections = new WeakMap();
  // Reuse the original voxels. Keep the floor and the far side below the eaves.
  function cutaway(id, detail, bearing) {
    const whole = geometry(id, detail), def = items.get(id);
    if (!def.interior || def.interior.underside !== undefined) return [whole];
    const { body, model } = whole, c = Math.cos(bearing), s = Math.sin(bearing);
    const axis = Math.abs(c) >= Math.abs(s) ? 0 : 1, nearPositive = (axis === 0 ? c : s) > 0;
    const key = axis * 2 + Number(nearPositive);
    if (!sections.has(whole)) sections.set(whole, new Map());
    const cache = sections.get(whole);
    if (cache.has(key)) return cache.get(key);
    const layer = z => Math.round(z * def.scale * body.density);
    const floor = model.bounds.slice(), wall = model.bounds.slice();
    floor[5] = Math.min(floor[5], layer(def.interior.floor));
    wall[2] = Math.max(wall[2], floor[5]);
    wall[5] = Math.min(wall[5], layer(def.interior.cutHeight));
    const middle = Math.floor((axis === 0 ? body.nx : body.ny) / 2);
    if (nearPositive) wall[axis + 3] = Math.min(wall[axis + 3], middle);
    else wall[axis] = Math.max(wall[axis], middle);
    const parts = [floor, wall].filter(b => b[3] > b[0] && b[4] > b[1] && b[5] > b[2])
      .map(bounds => ({ body, model: { ...model, bounds } }));
    cache.set(key, parts);
    return parts;
  }
  const scenes = {
    stairs: {
      label: '楼梯与二层露台',
      objects: [place('stairs'), { ...place('plant', 6.5, 12), parent: 0 },
        place('daisies', -72, 21), place('grass', -56, 26)]
    },
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
    pavilion: {
      label: '亭中小憩',
      actorPlacement: { parent: 0, x: 20, y: 3, heading: 0.45 },
      objects: [
        place('pavilion'),
        { ...place('desk', -12, 5), parent: 0 },
        { ...place('book', -12, 3, 21.1, -0.18), parent: 0 },
        { ...place('plant', -15, 16, 21.1), parent: 0 },
        { ...place('chair', 0, 15, 0, Math.PI), parent: 0 },
        place('blossom', -38, 47),
        place('daisies', 33, -37)
      ]
    },
    airfield: {
      label: '小型机场',
      objects: [place('aircraft', -67, 56, 0, 0.25), place('beacon', -26, -47), place('grass', 13, -17)]
    },
    market: {
      label: '古镇集市',
      actorPlacement: { parent: 0, x: -8, y: 8, heading: 0.2 },
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
  const fields = ['x', 'y', 'z', 'heading'];
  function placement(raw, scene, actor = false) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
        (!actor && !items.has(raw.kind)) || Object.keys(raw).some(k =>
          !fields.includes(k) && k !== 'parent' && (actor || k !== 'kind')))
      throw Error('场景含有未知物件或字段');
    const p = actor ? {} : { kind: raw.kind };
    for (const k of fields) {
      const v = raw[k] === undefined ? 0 : raw[k];
      if (!Number.isFinite(v) || Math.abs(v) > (k === 'heading' ? Math.PI * 2 : 256) || (k === 'z' && v < 0))
        throw Error('场景位置或角度超出范围');
      p[k] = v;
    }
    if (raw.parent !== undefined) {
      if (!Number.isSafeInteger(raw.parent) || raw.parent < 0 || !items.get(scene[raw.parent]?.kind)?.interior)
        throw Error('所属空间须指向场景中可容纳物件的建筑');
      p.parent = raw.parent;
    }
    return p;
  }
  function floorOrigin(room) {
    const { scale, interior } = items.get(room.kind), c = Math.cos(room.heading), s = Math.sin(room.heading);
    const [dx, dy] = interior.origin || [0, 0];
    return { x: room.x + (c * dx - s * dy) * scale, y: room.y + (s * dx + c * dy) * scale,
      z: room.z + interior.floor * scale, heading: room.heading };
  }
  function inside(room, p) {
    const origin = floorOrigin(room), c = Math.cos(room.heading), s = Math.sin(room.heading);
    const angle = room.heading + p.heading;
    return {
      ...(p.kind === undefined ? {} : { kind: p.kind }),
      x: origin.x + c * p.x - s * p.y,
      y: origin.y + s * p.x + c * p.y,
      z: origin.z + p.z,
      heading: Math.abs(angle) <= Math.PI ? angle : Math.atan2(Math.sin(angle), Math.cos(angle))
    };
  }
  function horizontalSurface(p, halfX, halfY, bottom, top) {
    return { x: p.x, y: p.y, c: Math.cos(p.heading), s: Math.sin(p.heading), halfX, halfY, bottom, top };
  }
  function covers(surface, x, y) {
    const dx = x - surface.x, dy = y - surface.y;
    return Math.abs(surface.c * dx + surface.s * dy) <= surface.halfX + 1e-8 &&
      Math.abs(surface.c * dy - surface.s * dx) <= surface.halfY + 1e-8;
  }
  function floorSurface(p) {
    const { interior, scale } = items.get(p.kind), origin = floorOrigin(p);
    return horizontalSurface(origin, interior.footprint[0] * scale, interior.footprint[1] * scale,
      p.z + (interior.underside || 0) * scale, origin.z);
  }
  function supportScene(placements) {
    const floors = [];
    for (const p of placements) {
      const { interior, scale } = items.get(p.kind);
      if (interior) floors.push(floorSurface(p));
      if (p.kind === 'stairs') {
        const { count, tread, rise, start, halfWidth } = stairs;
        function strip(x, length, bottom, top) {
          const center = { ...p, x: p.x + Math.cos(p.heading) * x * scale, y: p.y + Math.sin(p.heading) * x * scale };
          floors.push(horizontalSurface(center, length * scale / 2, halfWidth * scale, p.z + bottom * scale, p.z + top * scale));
        }
        for (let i = 0; i < count; i++) strip(start + (i + 0.5) * tread, tread, 0, (i + 1) * rise);
      }
    }
    if (!floors.length) return;
    // Walk up connected slabs in order. A raised building with air underneath stays overhead.
    floors.sort((a, b) => a.bottom - b.bottom);
    function floorAt(x, y, z = 0) {
      let height = z;
      for (const floor of floors) {
        if (floor.bottom > Math.max(0, height) + 1e-8) break;
        if (floor.top > height && covers(floor, x, y)) height = floor.top;
      }
      return height;
    }
    const liftedDesks = [];
    placements.forEach((p, i) => {
      if (items.get(p.kind).interior) return;
      const z = floorAt(p.x, p.y, p.z);
      if (z === p.z) return;
      placements[i] = { ...p, z };
      if (p.kind === 'desk') liftedDesks.push(horizontalSurface(p, deskTop.x, deskTop.y,
        p.z + deskTop.height, z + deskTop.height));
    });
    // Keep articles resting on a moved desktop in contact with it, including a bound lamp.
    if (liftedDesks.length) placements.forEach((p, i) => {
      if (items.get(p.kind).interior || p.kind === 'desk') return;
      let z = p.z;
      for (const top of liftedDesks)
        if (Math.abs(p.z - top.bottom) < 1e-6 && covers(top, p.x, p.y)) z = Math.max(z, top.top);
      if (z !== p.z) placements[i] = { ...p, z };
    });
    return floorAt;
  }
  const resolvedScenes = new WeakSet();
  function withoutScenery(placements, item) {
    const result=placements.filter(p=>p!==item);
    resolvedScenes.add(result);
    return result;
  }
  function withScenery(placements, extra) {
    const result = [...placements, extra];
    resolvedScenes.add(result);
    return result;
  }
  function layout(raw, actor) {
    if (!Array.isArray(raw) || raw.length > 64) throw Error('场景最多容纳 64 个物件');
    const scene = Array.from(raw, p => placement(p, raw)), worldScene = [], visiting = new Set();
    function resolve(i) {
      if (worldScene[i]) return worldScene[i];
      if (visiting.has(i)) throw Error('建筑不能直接或间接包含自己');
      visiting.add(i);
      const p = scene[i];
      worldScene[i] = p.parent === undefined ? p : inside(resolve(p.parent), p);
      visiting.delete(i);
      return worldScene[i];
    }
    scene.forEach((_, i) => resolve(i));
    const floorAt = supportScene(worldScene);
    resolvedScenes.add(worldScene);
    const views = new Map([[undefined, worldScene]]);
    function scenery(target) {
      if (!views.has(target)) {
        const visible = worldScene.filter((_, i) => i !== target);
        resolvedScenes.add(visible);
        views.set(target, visible);
      }
      return views.get(target);
    }
    const actorPlacement = actor === undefined ? undefined : placement(actor, raw, true);
    const castFrame = actorPlacement?.parent === undefined ? actorPlacement :
      inside(worldScene[actorPlacement.parent], actorPlacement);
    let actorFloorAt = floorAt;
    if (actorPlacement?.parent !== undefined) {
      const rooms = ancestors(scene, actorPlacement.parent).map(i => floorSurface(worldScene[i]));
      actorFloorAt = (x, y) => {
        let z = 0;
        for (const room of rooms) if (covers(room, x, y)) z = Math.max(z, room.top);
        return floorAt(x, y, z) + actorPlacement.z;
      };
    }
    return { scene, worldScene, actorPlacement, castFrame, floorAt, actorFloorAt, scenery };
  }
  const normalize = raw => layout(raw).scene;
  const resolveScene = raw => resolvedScenes.has(raw) ? raw : layout(raw).worldScene;
  function ancestors(scene, i) {
    const path = [];
    while (i !== undefined) {
      if (!scene[i] || path.includes(i)) throw Error('无效的建筑层级');
      path.push(i);
      i = scene[i].parent;
    }
    return path;
  }
  // Promote through one floor at a time so deleting/moving out preserves the world pose.
  function promote(scene, p) {
    const room = scene[p.parent];
    return { ...inside(room, p), ...(room.parent === undefined ? {} : { parent: room.parent }) };
  }
  function relativeToRoom(room, p) {
    const origin = floorOrigin(room), dx = p.x - origin.x, dy = p.y - origin.y;
    const c = Math.cos(room.heading), s = Math.sin(room.heading), angle = p.heading - room.heading;
    return { x: c * dx + s * dy, y: -s * dx + c * dy,
      z: p.z - origin.z, heading: Math.atan2(Math.sin(angle), Math.cos(angle)) };
  }
  function onFootprint(room, local) {
    const { scale, interior } = items.get(room.kind);
    return Math.abs(local.x) <= scale * interior.footprint[0] && Math.abs(local.y) <= scale * interior.footprint[1];
  }
  function reparent(score, index, parent) {
    const { scene, worldScene, actorPlacement, castFrame } = layout(score.scene || [], score.actorPlacement);
    const actor = index === null, p = actor ? actorPlacement || placement({}, scene, true) : scene[index];
    if (!p || (parent !== undefined && (!Number.isSafeInteger(parent) || !items.get(scene[parent]?.kind)?.interior)))
      throw Error('无法移动到指定空间');
    if (!actor && ancestors(scene, parent).includes(index)) throw Error('建筑不能直接或间接包含自己');
    let next = p;
    if (p.parent !== parent) {
      if (parent === undefined || ancestors(scene, p.parent).includes(parent)) {
        while (next.parent !== parent) next = promote(scene, next);
      } else {
        const room = worldScene[parent], local = relativeToRoom(room, actor ? castFrame || p : worldScene[index]);
        next = { ...p, parent, ...local, z: Math.max(0, local.z) };
        if (!onFootprint(room, local)) Object.assign(next, { x: 0, y: 0, z: 0 });
      }
    }
    if (actor) return { ...score, actorPlacement: next };
    scene[index] = next;
    return { ...score, scene };
  }
  function collectContents(score, index) {
    const { scene, actorPlacement } = layout(score.scene || [], score.actorPlacement);
    const room = scene[index], def = items.get(room?.kind);
    if (!def?.interior) throw Error('请选择可容纳物件的建筑');
    const members = [];
    function consider(i, p) {
      if (p.parent !== room.parent || p.z < room.z + (def.interior.underside || 0) * def.scale ||
          p.z >= room.z + def.box[2] * def.scale) return;
      const local = relativeToRoom(room, p);
      if (onFootprint(room, local)) members.push({ i, p, local });
    }
    scene.forEach((p, i) => { if (!items.get(p.kind).interior) consider(i, p); });
    if (score.steps.length) consider(null, actorPlacement || placement({}, scene, true));
    if (!members.length) return score;
    // Lift the collection only as far as needed for its lowest origin to meet the indoor floor.
    const lift = Math.max(0, ...members.map(m => -m.local.z));
    const result = { ...score, scene };
    for (const { i, p, local } of members) {
      const next = { ...p, ...local, z: local.z + lift, parent: index };
      if (i === null) result.actorPlacement = next;
      else scene[i] = next;
    }
    return result;
  }
  function removePlacement(score, index) {
    const { scene, actorPlacement } = layout(score.scene || [], score.actorPlacement);
    if (!scene[index]) throw Error('无法移除指定物件');
    function adopt(p) {
      const next = p.parent === index ? promote(scene, p) : p;
      return next.parent > index ? { ...next, parent: next.parent - 1 } : next;
    }
    const steps = score.steps.map(step => {
      if (step.target === index) {
        const { target, ...rest } = step;
        return rest;
      }
      return step.target > index ? { ...step, target: step.target - 1 } : step;
    });
    return { ...score, scene: scene.filter((_, i) => i !== index).map(adopt), steps,
      ...(actorPlacement ? { actorPlacement: adopt(actorPlacement) } : {}) };
  }
  return { realms, families, items, painters, materials, geometry, cutaway, detailMode, place, scenes, stairs,
    normalize, resolveScene, layout, withScenery, withoutScenery, ancestors, reparent, collectContents, removePlacement, register };
})();
globalThis.PineWorld = PineWorld;
