// Voxel brushes for objects used by the activity library. The prop frame also defines its contact points.
const activityProps = (() => {
  const materials = {
    ...PineWorld.materials,
    pageIvory: 'f4e9c7',
    pageEdge: 'ccbb95',
    pageInk: '58656a',
    bookCover: 'a34d4c',
    bookSpine: '703c41',
    ceramic: 'e8d9ac',
    ceramicRim: '91a7a0',
    food: 'dc9462',
    parcel: 'cb9a66',
    parcelEdge: 'a4774c',
    parcelTape: 'edce95',
    instrument: 'b86e41',
    instrumentDark: '684535',
    ballTeal: '428b89',
    ballGold: 'efb654',
    leaf: '68864c',
    leafLight: '92aa5f',
    pot: 'b57552',
    watering: '67968b',
    bristle: 'cdb17a'
  };
  const painters = {
    book({ box, line, oval, k, item }) {
      // Page normals slope toward the binding. A single raised leaf travels across the spine.
      for (const sign of [-1, 1]) {
        box([0, sign * 2.68, 0.02], [3.65, 2.71, 0.38], k.bookCover);
        box([0, sign * 2.64, 0.39], [3.47, 2.52, 0.37], k.pageEdge);
        for (let j = 0; j < 5; j++) {
          const y = sign * (0.58 + j * 0.96),
            z = 0.74 + 0.11 * Math.sin(((j + 0.5) * Math.PI) / 5);
          box([0, y, z], [3.37, 0.54, 0.2], k.pageIvory);
          for (const x of [-1.45, -0.3, 1.12])
            if (j > 0 && j < 4) box([x, y, z + 0.21], [0.115, 0.5, 0.11], k.pageInk);
        }
      }
      box([0, 3.0, -0.39], [1.85, 1.3, 0.13], k.bookSpine);
      oval([0, 3.0, -0.52], [1.1, 0.91, 0.16], k.ballGold);
      line([-3.63, 0, 0.3], [3.63, 0, 0.3], 0.33, k.bookSpine);
      const page = item.page || 0;
      if (page > 0.002 && page < 0.998) {
        const t = Math.PI * page,
          tip = [0, 4.81 * Math.cos(t), 0.89 + 4.45 * Math.sin(t)];
        for (let n = 0; n <= 8; n++) {
          const f = n / 8;
          line(
            [-3.23, tip[1] * f, 0.81 + (tip[2] - 0.81) * f],
            [3.23, tip[1] * f, 0.81 + (tip[2] - 0.81) * f],
            0.4,
            k.pageIvory
          );
        }
      }
    },
    pen({ line, oval, k }) {
      line([0.38, 0, -1.78], [-0.55, 0, 2.25], 0.32, k.deviceBlue);
      oval([0.4, 0, -1.94], [0.26, 0.25, 0.41], k.pageInk);
    },
    camera({ box, oval, k }) {
      box([0, 0, 0], [1.13, 3.1, 1.82], k.deviceSlate);
      box([0.07, 0, 1.62], [1.08, 3.01, 0.35], k.deviceEdge);
      box([0, 0.28, 2.1], [0.84, 1.12, 0.5], k.deviceInk);
      box([0, -2.17, 1.99], [0.45, 0.47, 0.23], k.deviceGold);
      oval([1.17, 0.4, 0.12], [1.19, 1.52, 1.48], k.deviceInk, 3);
      oval([2.0, 0.4, 0.12], [0.53, 1.13, 1.14], k.deviceGlass, 3);
      oval([2.38, 0.39, 0.28], [0.25, 0.65, 0.61], k.deviceBlue, 3);
      box([-1.1, 0.12, 0], [0.21, 1.76, 1.1], k.deviceGlass);
    },
    brush({ line, box, k }) {
      line([0, -0.75, -0.35], [0, 2.85, 0.28], 0.36, k.deviceAqua);
      box([0, 3.25, 0.32], [0.56, 1.03, 0.35], k.deviceBlue);
      for (let j = 0; j < 3; j++) box([-0.27, 2.59 + j * 0.59, 0.7], [0.43, 0.21, 0.48], k.pageIvory);
    },
    comb({ line, box, k }) {
      line([0, 0, -1.63], [0, 0, 2.35], 0.42, k.instrumentDark);
      box([0, 0.54, 1.77], [0.48, 0.62, 1.68], k.instrument);
      for (let j = 0; j < 5; j++)
        line([0, 0.88, 0.35 + j * 0.68], [0, 2.04, 0.35 + j * 0.68], 0.24, k.parcelTape);
    },
    bowl({ oval, box, k }) {
      oval([0, 0, -0.85], [2.9, 2.9, 1.69], k.ceramic);
      oval([0, 0, -0.04], [2.91, 2.91, 0.63], k.ceramicRim);
      oval([0, 0, 0.31], [2.4, 2.4, 0.38], k.food);
      oval([-0.62, 0.56, 0.57], [0.55, 0.49, 0.28], k.leafLight);
    },
    spoon({ line, oval, k }) {
      line([0, -0.65, 0], [0, 2.27, 0.19], 0.31, k.deviceEdge);
      oval([0, 2.56, 0.19], [0.69, 0.93, 0.45], k.ceramic);
    },
    parcel({ box, k }) {
      box([0, 0, 0], [3.03, 4.33, 3.12], k.parcel);
      box([0, 0, 0.02], [3.1, 0.75, 3.19], k.parcelTape);
      box([0, 1.99, 3.1], [1.17, 0.83, 0.17], k.pageIvory);
      box([3.05, 0, -2.63], [0.18, 4.21, 0.24], k.parcelEdge);
    },
    broom({ line, box, k }) {
      line([0, 0, -9.55], [0, 0, 5.9], 0.47, k.foldWood);
      box([0, 0, -10.2], [0.67, 2.56, 0.75], k.deviceSlate);
      for (let j = -3; j <= 3; j++) line([0, j * 0.64, -10.4], [0.31, j * 0.89, -13.19], 0.61, k.bristle);
    },
    wateringCan({ oval, line, box, k }) {
      oval([0, 0, -1.02], [2.72, 1.72, 2.23], k.watering, 3.3);
      box([0, 0, 0.61], [2.24, 1.48, 0.37], k.devicePine);
      line([1.75, 0, -1.34], [4.42, 0, 0.98], 0.7, k.watering);
      oval([4.52, 0, 1.05], [0.71, 0.88, 0.59], k.ceramicRim);
      line([-2.03, 0, -1.4], [-3.22, 0, -0.41], 0.45, k.watering);
      line([-3.22, 0, -0.41], [-3.1, 0, 1.45], 0.44, k.watering);
      line([-3.1, 0, 1.45], [-1.19, 0, 1.43], 0.44, k.watering);
    },
    plant({ oval, box, line, k }) {
      oval([0, 0, 1.84], [2.7, 2.7, 1.92], k.pot, 3.4);
      oval([0, 0, 3.49], [2.9, 2.9, 0.52], k.parcelEdge);
      oval([0, 0, 3.79], [2.36, 2.36, 0.32], k.instrumentDark);
      line([0, 0, 3.79], [-0.17, 0, 7.72], 0.35, k.leaf);
      oval([0.68, -0.91, 5.52], [0.77, 1.4, 0.58], k.leaf);
      oval([-0.65, 1, 6.37], [0.81, 1.45, 0.62], k.leafLight);
      oval([-0.26, -0.32, 7.55], [0.74, 0.83, 1.07], k.leafLight);
    },
    mat({ box, oval, k, item }) {
      box([0, 0, 0.22], [23.5, 8.8, 0.24], k.watering);
      for (const x of [-22, -20.5, 20.5, 22]) box([x, 0, 0.45], [0.38, 8.78, 0.13], k.parcelTape);
      if (item.pillow) oval([-17.4, 0, 1.2], [4.86, 6.64, 1.38], k.pageIvory, 3);
    },
    water({ line, oval, k, item, cell }) {
      if (item.length <= 0.1) return;
      const radius = Math.max(0.36, 0.75 * cell);
      line([0, 0, 0], [0, 0, -item.length], radius, k.deviceAqua);
      for (let i = 0; i < 3; i++) {
        const t = ((item.flow || 0) + i / 3) % 1;
        oval([0.21 * radius, -0.21 * radius, -t * item.length], [radius, radius, 1.3 * radius], k.deviceGlow);
      }
    },
    guitar({ oval, box, line, k }) {
      oval([0, -1.47, -0.72], [1.04, 3.2, 3.28], k.instrument);
      oval([0, 1.02, 0.21], [0.99, 2.56, 2.22], k.instrument);
      box([0, 4.96, 0.9], [0.65, 3.16, 0.64], k.instrumentDark);
      box([0, 8.33, 0.95], [0.75, 0.89, 0.92], k.instrument);
      oval([1.0, 0.14, 0.1], [0.33, 1.03, 1.11], k.instrumentDark);
      box([1.02, -2.38, 0.05], [0.22, 0.38, 1.12], k.bookSpine);
      for (const z of [-0.19, 0.22, 0.6]) line([1.09, -2.43, z], [0.68, 8.36, z + 0.77], 0.115, k.parcelTape);
    },
    ball({ oval, k }) {
      oval([0, 0, 0], [2.22, 2.22, 2.22], (x, y, z) =>
        Math.abs(z) < 0.46 || Math.abs(x * 0.84 + y * 0.53) < 0.38 ? k.ballGold : k.ballTeal
      );
    },
    rattle({ line, oval, k }) {
      line([0, 0, -1.12], [0, 0, 1.73], 0.44, k.foldWood);
      oval([0, 0, 2.09], [1.43, 1.31, 1.48], (x, y, z) =>
        Math.abs(z - 2.11) < 0.42 ? k.ballGold : k.ballTeal
      );
      oval([0.58, -0.82, 2.63], [0.5, 0.42, 0.47], k.pageIvory);
    },
    drum({ oval, k }) {
      oval(
        [0, 0, 0.06],
        [3.78, 3.65, 1.96],
        (x, y, z) => (Math.cos(Math.atan2(y, x) * 9 + 0.62 * z) > 0.73 ? k.parcelTape : k.bookCover),
        4
      );
      oval([0, 0, 1.69], [3.89, 3.77, 0.49], k.foldWood);
      oval([0, 0, 1.98], [3.43, 3.31, 0.28], k.pageIvory);
    }
  };
  function paint(item, b, k) {
    const painter = Object.hasOwn(painters, item.kind) ? painters[item.kind] : PineWorld.painters[item.kind];
    if (!painter) return false;
    const s = item.scale ?? 1;
    b.frame(item.frame);
    const scaled = (p) => p.map((v) => v * s);
    const box = (center, half, color) =>
      b.stamp(...center.flatMap((v, i) => [(v - half[i]) * s, (v + half[i]) * s]), (x, y, z) =>
        Math.abs(x - center[0] * s) <= half[0] * s &&
        Math.abs(y - center[1] * s) <= half[1] * s &&
        Math.abs(z - center[2] * s) <= half[2] * s
          ? color
          : 0
      );
    const line = (a, c, r, color) => b.link(scaled(a), scaled(c), r * s, r * s, 1, () => color);
    const oval = (center, radii, ink, power = 2) =>
      b.blob(
        ...scaled(center),
        ...scaled(radii),
        typeof ink === 'function' ? (x, y, z) => ink(x / s, y / s, z / s) : ink,
        power
      );
    painter({ box, line, oval, k, item, cell: 1 / (s * (b.density || 1)) });
    if (item.seal) {
      const [x,y,z]=item.seal;
      box([x,y,z+.06],[.65,.62,.16],k.bookCover);
      box([x+.10,y,z+.18],[.13,.36,.10],k.pageIvory);
    }
    if (item.inkPath?.length) {
      const points=item.inkPath, radius=item.kind==='scroll'?.25:.19;
      oval(points[0],[radius,radius,.15],k.pageInk);
      for(let j=1;j<points.length;j++) line(points[j-1],points[j],radius,k.pageInk);
    }
    return true;
  }
  return { materials, paint };
})();
