// Original, matched face sections. X points forward, Y from the midline to the ear,
// Z up. Every ring has the same vertices in all four ages and all four face targets.
const pineGameFace = (() => {
  const levels = [-1, -0.94, -0.85, -0.74, -0.6, -0.45, -0.28, -0.1, 0.1, 0.28, 0.46, 0.64];
  // Width, back, temple, front at centre / 52% / 82% of the half width.
  // At the lowest ring the chin closes in front of the throat. Higher rings
  // reach the ear progressively; a turn can reveal the space beneath the jaw.
  const cages = {
    adult: [
      [0, 0.43, 0.43, 0.43, 0.43, 0.43],
      [0.28, 0.23, 0.43, 0.68, 0.64, 0.57],
      [0.46, 0.02, 0.35, 0.86, 0.82, 0.68],
      [0.58, -0.19, 0.26, 0.91, 0.86, 0.68],
      [0.68, -0.45, 0.15, 0.88, 0.82, 0.61],
      [0.77, -0.72, 0.09, 0.93, 0.85, 0.6],
      [0.84, -0.96, 0.06, 0.94, 0.88, 0.63],
      [0.9, -1.15, 0.04, 0.95, 0.88, 0.66],
      [0.94, -1.23, 0.02, 0.91, 0.84, 0.63],
      [0.97, -1.25, 0.02, 1.01, 0.91, 0.69],
      [0.98, -1.19, 0.03, 1.02, 0.9, 0.66],
      [0.94, -1.03, 0.03, 0.94, 0.83, 0.62]
    ],
    child: [
      [0, 0.39, 0.39, 0.39, 0.39, 0.39],
      [0.25, 0.2, 0.38, 0.64, 0.6, 0.52],
      [0.44, -0.01, 0.31, 0.81, 0.77, 0.63],
      [0.59, -0.19, 0.24, 0.87, 0.82, 0.66],
      [0.73, -0.43, 0.17, 0.87, 0.83, 0.64],
      [0.81, -0.65, 0.13, 0.92, 0.87, 0.66],
      [0.88, -0.87, 0.09, 0.94, 0.9, 0.68],
      [0.93, -1.02, 0.06, 0.93, 0.88, 0.66],
      [0.96, -1.12, 0.05, 0.94, 0.86, 0.64],
      [0.98, -1.14, 0.05, 1.02, 0.93, 0.71],
      [0.98, -1.09, 0.06, 1.04, 0.92, 0.7],
      [0.94, -0.96, 0.07, 0.96, 0.85, 0.66]
    ],
    toddler: [
      [0, 0.38, 0.38, 0.38, 0.38, 0.38],
      [0.27, 0.18, 0.38, 0.62, 0.59, 0.51],
      [0.48, -0.04, 0.31, 0.78, 0.75, 0.62],
      [0.63, -0.23, 0.26, 0.84, 0.8, 0.65],
      [0.76, -0.43, 0.22, 0.88, 0.85, 0.68],
      [0.85, -0.61, 0.18, 0.94, 0.89, 0.69],
      [0.91, -0.78, 0.13, 0.94, 0.9, 0.7],
      [0.95, -0.92, 0.1, 0.93, 0.87, 0.66],
      [0.98, -1.03, 0.08, 0.99, 0.91, 0.69],
      [1, -1.04, 0.08, 1.06, 0.96, 0.74],
      [0.99, -0.97, 0.1, 1.06, 0.95, 0.73],
      [0.9, -0.81, 0.12, 0.97, 0.88, 0.69]
    ],
    baby: [
      [0, 0.38, 0.38, 0.38, 0.38, 0.38],
      [0.28, 0.17, 0.37, 0.6, 0.57, 0.5],
      [0.49, -0.03, 0.32, 0.76, 0.73, 0.62],
      [0.64, -0.21, 0.28, 0.84, 0.8, 0.66],
      [0.77, -0.41, 0.23, 0.88, 0.85, 0.68],
      [0.87, -0.58, 0.19, 0.92, 0.89, 0.7],
      [0.92, -0.74, 0.14, 0.94, 0.9, 0.72],
      [0.95, -0.87, 0.11, 0.93, 0.87, 0.67],
      [0.99, -0.95, 0.1, 1.02, 0.94, 0.73],
      [1, -0.98, 0.1, 1.07, 0.98, 0.76],
      [0.97, -0.88, 0.11, 1.05, 0.95, 0.74],
      [0.85, -0.69, 0.14, 0.94, 0.86, 0.68]
    ]
  };
  // Signed coordinates of the three complete authored variations in the same
  // cage: jaw breadth, chin depth, cheek turn and lower-face length.
  const targets = {
    balanced: [0, 0, 0, 0],
    long: [-0.085, 0.043, -0.026, 0.052],
    round: [0.078, -0.031, 0.031, -0.044],
    angular: [0.087, 0.062, -0.042, 0.016]
  };
  const forms = { balanced: '均衡', long: '秀长', round: '柔圆', angular: '利落' };
  const adultForms = { balanced:'均衡', long:'窄颏长脸', round:'短圆脸', angular:'宽颌脸' };
  const youngForms = { balanced:'均衡', long:'小椭圆脸', round:'短圆脸', angular:'柔方脸' };
  const baseForms = age => age === 'adult' ? adultForms : youngForms;
  // The front, profile and three-quarter drawings use a 32-unit head radius.
  // Rows rise from chin to forehead. Read across a row as half-width, back,
  // temple, centre front, and the front surfaces at 52% and 82% of half-width.
  // Above the last row the original scalp and hair attachment take over.
  const drawingLevels = [-1, -.91, -.76, -.58, -.39, -.17, .06, .29, .52];
  const drawings = {
    adult: {
      round: [
        [0,12,12,12,12,12], [12,7,13,20,20,18], [20,0,10,27,26,22],
        [24,-14,5,27,26,21], [27,-26,2,29,27,20], [28,-35,1,31,28,21],
        [30,-39,1,29,26,20], [31,-40,1,32,29,22], [31,-37,1,32,29,21]],
      long: [
        [0,13,13,13,13,13], [6,8,14,22,21,18], [13,2,12,27,26,21],
        [17,-9,7,28,25,18], [21,-24,3,29,25,18], [25,-36,1,30,26,19],
        [28,-39,1,30,26,18], [30,-40,1,33,29,21], [31,-37,1,32,29,21]],
      angular: [
        [0,15,15,15,15,15], [12,9,14,24,23,20], [22,1,11,29,28,24],
        [25,-15,5,29,26,20], [26,-26,2,30,26,19], [27,-36,1,30,26,18],
        [29,-39,1,30,27,19], [31,-40,1,33,29,21], [31,-37,1,32,29,21]]
    },
    child: {
      round: [
        [0,12,12,12,12,12], [12,7,13,20,20,17], [20,1,11,25,24,20],
        [25,-11,7,27,26,22], [28,-22,4,29,28,22], [30,-29,2,30,29,22],
        [31,-35,2,30,28,20], [32,-36,2,33,30,23], [31,-33,2,33,30,23]],
      long: [
        [0,13,13,13,13,13], [7,8,13,21,20,18], [14,2,11,27,25,21],
        [19,-9,7,27,24,18], [22,-20,4,28,26,19], [26,-30,2,29,26,19],
        [29,-35,2,30,27,20], [31,-36,2,33,30,23], [31,-33,2,33,30,23]],
      angular: [
        [0,14,14,14,14,14], [11,8,13,23,22,19], [20,1,11,29,27,23],
        [24,-11,7,27,25,19], [26,-21,4,29,26,20], [28,-30,2,29,27,20],
        [30,-35,2,30,28,20], [31,-36,2,33,30,23], [31,-33,2,33,30,23]]
    },
    toddler: {
      round: [
        [0,13,13,13,13,13], [12,8,13,20,19,17], [21,2,11,25,24,21],
        [26,-8,8,27,26,23], [29,-17,5,30,29,23], [31,-25,3,30,29,22],
        [32,-32,3,32,29,22], [32,-33,3,34,31,24], [31,-30,3,33,30,23]],
      long: [
        [0,13,13,13,13,13], [8,8,13,21,20,18], [16,2,12,26,25,21],
        [21,-8,8,27,25,20], [25,-17,5,28,26,20], [28,-26,3,30,28,21],
        [31,-32,3,32,29,21], [32,-33,3,34,31,24], [31,-30,3,33,30,23]],
      angular: [
        [0,14,14,14,14,14], [11,8,13,22,21,18], [20,2,12,28,26,23],
        [24,-8,8,27,25,21], [27,-17,5,29,27,21], [29,-26,3,30,28,21],
        [31,-32,3,32,29,21], [32,-33,3,34,31,24], [31,-30,3,33,30,23]]
    },
    baby: {
      round: [
        [0,13,13,13,13,13], [13,9,14,19,19,17], [22,4,12,24,24,21],
        [27,-5,9,27,27,23], [30,-15,6,30,29,24], [31,-23,4,30,29,22],
        [32,-29,3,32,30,23], [32,-31,3,34,31,24], [30,-26,4,33,30,23]],
      long: [
        [0,13,13,13,13,13], [8,9,14,21,20,18], [16,4,12,25,24,21],
        [22,-5,9,26,25,21], [26,-15,6,28,27,21], [29,-24,4,30,28,21],
        [31,-29,3,32,30,22], [32,-31,3,34,31,24], [30,-26,4,33,30,23]],
      angular: [
        [0,14,14,14,14,14], [11,9,14,21,20,18], [20,4,12,27,26,22],
        [25,-5,9,27,26,22], [28,-15,6,29,28,22], [30,-24,4,30,28,22],
        [31,-29,3,32,30,22], [32,-31,3,34,31,24], [30,-26,4,33,30,23]]
    }
  };
  // Vertical chin cut, lip height relative to the original, and nasal reach.
  const landmarks = {
    adult: { round:[.215,.067,.82], long:[.03,-.023,1.04], angular:[.116,.008,1.10] },
    child: { round:[.183,.052,.87], long:[.025,-.013,1.03], angular:[.087,.012,1.04] },
    toddler: { round:[.161,.047,.91], long:[.038,-.009,1.02], angular:[.083,.015,1.02] },
    baby: { round:[.165,.053,.93], long:[.044,.004,1.025], angular:[.090,.024,1] }
  };
  const neutralChins = { adult:.09, child:.069, toddler:.055, baby:.06 };
  const limits = { adult: 1, child: 0.74, toddler: 0.54, baby: 0.37 };
  const steps = 96,
    rings = 192;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  function ramp(x, lo, hi) {
    const t = clamp((x - lo) / (hi - lo), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function bell(x, center, radius) {
    const q = (x - center) / radius;
    return Math.abs(q) < 1 ? (1 - q * q) ** 2 : 0;
  }
  // A monotone cubic rounds the joins without putting a bump between two
  // identical control points. Slopes are prepared once per authored curve.
  function curve(xs, ys) {
    const sec = ys.slice(1).map((y, i) => (y - ys[i]) / (xs[i + 1] - xs[i]));
    const slopes = ys.map((_, i) =>
      !i
        ? sec[0]
        : i === sec.length
          ? sec[i - 1]
          : sec[i] * sec[i - 1] <= 0
            ? 0
            : 2 / (1 / sec[i] + 1 / sec[i - 1])
    );
    return (x) => {
      if (x <= xs[0]) return ys[0];
      let i = 0;
      while (i < sec.length - 1 && x > xs[i + 1]) i++;
      const d = xs[i + 1] - xs[i],
        t = clamp((x - xs[i]) / d, 0, 1),
        s = 1 - t;
      return (
        s * s * ((1 + 2 * t) * ys[i] + t * d * slopes[i]) +
        t * t * ((3 - 2 * t) * ys[i + 1] - s * d * slopes[i + 1])
      );
    };
  }
  const profiles = Object.fromEntries(
    Object.entries(cages).map(([age, rows]) => [
      age,
      rows[0].map((_, j) =>
        curve(
          levels,
          rows.map((row) => row[j])
        )
      )
    ])
  );
  const drawnProfiles = Object.fromEntries(Object.entries(drawings).map(([age, designs]) => [
    age, Object.fromEntries(Object.entries(designs).map(([form, rows]) => [
      form, rows[0].map((_, i) => curve(drawingLevels, rows.map(row => row[i] / 32)))
    ]))
  ]));
  function lipLift(age, form, mix = 1) {
    return (landmarks[age][form]?.[1] || 0) * mix;
  }
  function chinShift(age, form, mix = 1) {
    return ((landmarks[age][form]?.[0] ?? neutralChins[age]) - neutralChins[age]) * mix;
  }
  const noses = curve([-0.32, -0.04, 0.24, 0.46, 0.61, 0.73, 0.88, 1], [0, 0.13, 0.49, 0.8, 1, 0.58, 0, 0]);
  const cross = [0, 0.28, 0.52, 0.82, 0.95, 1];
  function frontAt(row, v) {
    const f = clamp(Math.abs(v), 0, 1) * steps,
      j = Math.min(steps - 1, Math.floor(f));
    return row.face[j] + (row.face[j + 1] - row.face[j]) * (f - j);
  }
  function insideSkin(row, x, y) {
    if (row.width < 0.001 || Math.abs(y) > row.width) return false;
    const v = y / row.width;
    return x < row.axis ? (x - row.axis) ** 2 <= row.rear ** 2 * (1 - v * v) : x <= frontAt(row, v);
  }
  // Draw upwards from the underside of the infant chin to an existing row just
  // under the lower lip. The lip supplies the depth for this particular face.
  function sculptInfantChin(rows, mouth, shape, supported) {
    const ringIndex = h => clamp(Math.round((1 + h) * rings / 2), 0, rings);
    const shortJoin = 2 * ringIndex(mouth - .076) / rings - 1;
    const joinIndex = ringIndex(mouth - (supported ? .067 : .076)), joinH = 2 * joinIndex / rings - 1;
    const join = rows[joinIndex], lip = rows[ringIndex(mouth - .042)].face[0];
    const roundness = shape.chinRoundness || 0, projection = shape.chinProjection || 0;
    const shortPad = shortJoin - .062 + .019 * (shape.chinHeight || 0);
    const throatH = Math.max(-.99, shortPad - .111 - .015 * roundness);
    const shortTip = lip - .076 + .034 * projection;
    const throatX = shortTip - .20 - .025 * roundness;
    // Carry the small front cushion down from the lip before turning it under.
    // The throat keeps its independent attachment at the back of the cushion.
    const padH = supported ? shortPad - .046 : shortPad;
    const bottomH = supported ? Math.max(-.99, throatH - .055) : throatH;
    const tip = supported ? lip - .003 + .060 * projection : shortTip;
    const undersideX = supported ? lip - .166 - .024 * roundness : throatX;
    const padStation = (padH - bottomH) / (joinH - bottomH);
    // Square-root spacing rounds the underside away from its lowest voxel.
    // Linear spacing would close in a cone and leave a single dangling pixel.
    const stations = [0, .10, .28, padStation, .81, 1].map(Math.sqrt);
    const breadth = curve(stations, supported
      ? [0, .23, .45, .67 + .04*roundness, .90, 1]
      : [0, .32, .55, .73 + .04*roundness, .91, 1]);
    const jawBack = join.axis - join.rear;
    const rear = curve(stations, [undersideX, undersideX-.12, undersideX-.25, undersideX-.39, jawBack+.08, jawBack]);
    const axis = curve(stations, [undersideX, undersideX-.05, undersideX-.11, undersideX-.18, join.axis+.03, join.axis]);
    const front = curve(stations, supported
      ? [undersideX, tip-.098, tip-.030, tip, lip-.024+.024*projection, join.face[0]]
      : [undersideX, tip-.12, tip-.038, tip, Math.min(tip,join.face[0])-.022, join.face[0]]);
    for (let i = 0; i < joinIndex; i++) {
      const h = 2*i/rings - 1, r = rows[i];
      const t = clamp((h - bottomH) / (joinH - bottomH), 0, 1);
      const arc = Math.sqrt(t), blend = ramp(t,.21,1);
      r.width = join.width * breadth(arc);
      r.axis = axis(arc);
      r.rear = r.axis - rear(arc);
      r.fore = front(arc) - r.axis;
      for (let j = 0; j <= steps; j++) {
        const v = j / steps, lipSection = (join.face[j] - join.axis) / join.fore;
        const padSection = Math.sqrt(1-v*v);
        r.face[j] = r.axis + r.fore * (padSection + (lipSection - padSection) * blend);
      }
    }
    return { padH, bottomH, undersideX, throatH, throatX, supported };
  }
  function build(base, shape, face, baseTarget, scalp, eye, mouth, noseRow, drawn, painted, infantProfile, infantChin) {
    const mix = face.formMix ?? 1, drawing = drawn && drawnProfiles[base][baseTarget];
    const p = drawing && mix > 0 ? profiles[base].map((original, i) => h => {
      const a = original(h);
      return a + (drawing[i](h) - a) * mix;
    }) : profiles[base];
    const amount = limits[base],
      infant = base === 'baby';
    const [jawTarget, chinTarget, cheekTarget, lengthTarget] = targets[drawing ? 'balanced' : baseTarget || 'balanced'].map(
      delta => delta * mix
    );
    const value = (key) => shape[key] || 0;
    const mouthDepth = amount * 0.075 * value('lipProjection');
    const noseLength = clamp(0.58 + (noseRow[3] - 0.3) * 0.83, 0.48, 0.7);
    // Give the philtrum room between the returning nasal base and the upper lip.
    // The mouth takes part of the change, so a long nose retains its character.
    const tipAt = noseLength - (1 - noseLength) * .72 * ((shape.noseLipSpacing ?? 1) - 1);
    const reach =
      (infant ? 0.132 : base === 'adult' ? 0.205 : 0.166) *
      clamp(noseRow[2] / 0.19 + 0.32 * value('noseBridge'), 0.58, 1.5) *
      (0.85 + 0.15 * (shape.faceRelief ?? 1)) * (drawing ? 1 + (landmarks[base][baseTarget][2] - 1) * mix : 1);
    const noseWidth = clamp(noseRow[1] * (1 + 0.26 * value('noseWidth')) * (infant ? 1.17 : 1), 0.105, 0.32);
    // Both lids close over the same curved eye plane. The brow and cheek can
    // change depth outside it without shearing the iris on a three-quarter turn.
    const eyeWidth = p[0](eye),
      centre = p[3](eye),
      middle = p[4](eye),
      outer = p[5](eye),
      temple = p[2](eye);
    const eyelids = curve(cross, [
      centre,
      centre * 0.6 + middle * 0.4 - 0.015,
      middle - 0.04,
      outer - 0.026,
      temple + 0.54 * (outer - temple),
      temple
    ]);
    const chinLift = neutralChins[base] + (drawing ? chinShift(base, baseTarget, mix) : 0);
    const lowerLength = lengthTarget * amount - 0.032 * amount * value('chinHeight');
    const rowList = Array.from({ length: rings + 1 }, (_, i) => {
      const h = (i * 2) / rings - 1,
        vault = ramp(h, 0.35, 0.64),
        cap = scalp.row(h);
      if (vault === 1) return { ...cap };
      const u = clamp(
        h - chinLift * ramp(-h, 0.4, 0.9) + lowerLength * ramp(-h, 0.37, 0.78) * (1 - ramp(-h, 0.89, 1)),
        -1,
        0.64
      );
      const jaw = bell(u, -0.68, 0.42),
        chin = bell(u, -0.77, 0.24);
      // The pad below the lip, the underside reaching the throat, and the
      // angle below the ear have different depths on the profile drawing.
      const pad = painted ? bell(h, mouth - (infant ? .195 : .23), infant ? .135 : .16) : 0;
      const underChin = painted ? ramp(-u, .67, .97) : 0;
      const cheek = bell(u, -0.21 + 0.1 * value('cheekHeight'), 0.36);
      const outline = pinePortraitStyles.outlines[face.outline];
      const width =
        p[0](u) *
        (1 - underChin * (infant ? .075 : .10)) * (1 +
          amount *
            (jaw * (jawTarget + 0.48 * ((shape.jaw ?? 1) - 1) + 0.32 * (outline?.[2] || 0)) +
              cheek * (0.056 * value('cheekWidth') + 0.21 * (outline?.[1] || 0)) +
              0.039 * value('cheekFullness') * bell(u, -0.43, 0.29) +
              0.032 * value('chinRoundness') * chin));
      const back =
        p[1](u) +
        amount * (0.105 * value('jawPosition') + 0.075 * value('jawNeck') + 0.073 * value('jawAngle')) * jaw +
        underChin * (infant ? .045 : .079) * (1 - ramp(-u, .86, 1));
      const axis = p[2](u) + amount * (0.05 * value('jawPosition') + 0.033 * value('jawDefinition')) * jaw;
      const mid = p[3](u) + (chinTarget - 0.026 + 0.105 * value('chinProjection')) * amount * chin +
        pad * (infantProfile ? .085 : infant ? .049 : .073) -
        (infantProfile ? .054 * bell(h,.21,.39) : 0);
      const cheekDepth = (cheekTarget + 0.055 * value('cheekProjection')) * amount * cheek;
      const turn = p[5](u) + cheekDepth - 0.043 * amount * value('jawDefinition') * jaw;
      const side = p[4](u) + cheekDepth + 0.031 * amount * value('chinProjection') * chin + .021 * pad;
      const orbitTurn = bell(u, eye, 0.24) * (infant ? 0.06 : 0.08);
      const dome = curve(cross, [
        mid,
        mid * 0.6 + side * 0.4 - 0.29 * orbitTurn,
        side - orbitTurn,
        turn - 0.63 * orbitTurn,
        axis + 0.54 * (turn - axis),
        axis
      ]);
      const t = (eye - h) / Math.max(0.24, eye - mouth),
        tipT = (t * 0.61) / tipAt;
      const nose = noses(tipT) * reach * (infantProfile ? 1.38 : 1);
      const wing = bell(tipT, 0.67, 0.19);
      const upper = bell(h, mouth + 0.04, 0.077),
        lower = bell(h, mouth - 0.043, 0.077);
      const fold = bell(h, mouth - 0.134, 0.07);
      // The dental arch turns gradually from the cheek to the chin. A short
      // horizontal indentation at lip height casts a moustache-shaped stripe.
      const archDepth = (infant ? 0.105 : 0.155) + (drawing ? mix * (infant ? .03 : .07) : 0);
      const oralArc = ramp(eye - h, 0.1, 0.46) * (1 - ramp(-h, 0.76, 0.99)) * archDepth;
      const mouthBed =
        mouthDepth * bell(h, mouth, 0.19) +
        upper * (0.041 + 0.014 * value('upperLipFullness')) +
        lower * (0.053 + 0.018 * value('lowerLipFullness')) -
        (painted ? (infant ? .047 : .071) : .024) * fold;
      const ring = {
        axis: axis + (cap.axis - axis) * vault,
        width: width + (cap.width - width) * vault,
        rear: (axis - back) * (1 - vault) + cap.rear * vault,
        templeDelta: 0,
        face: new Float32Array(steps + 1)
      };
      for (let j = 0; j <= steps; j++) {
        const v = j / steps,
          y = v * width,
          eyeBand = bell(h, eye, 0.19);
        const socket = bell(y, 0.48, 0.29) * eyeBand * (0.044 + 0.036 * value('eyeDepth')) * amount;
        const undisturbed = dome(v);
        let f =
          undisturbed +
          nose * bell(y, 0, noseWidth) +
          0.037 * wing * bell(y, noseWidth * 0.74, noseWidth * 0.6) +
          mouthBed * bell(y, 0, 0.41) -
          oralArc * ramp(y, 0.025, 0.43) * (1 - ramp(y, 0.61, 0.9)) -
          socket;
        const lidRegion =
          ramp(y, 0.1, 0.25) * (1 - ramp(y, 0.72, 0.91)) * (1 - ramp(Math.abs(h - eye - 0.035), 0.145, 0.3));
        if (lidRegion > 0) {
          const eyeSurface =
            eyelids(y / eyeWidth) + 0.026 * bell(y, 0.46, 0.26) - 0.036 * amount * value('eyeDepth');
          f += lidRegion * (eyeSurface - f);
        }
        // Fade mouth and eye relief towards the temple at the outer edge of
        // each authored cross section. The legacy endpoint keeps its original relief.
        if (drawing && mix > 0) {
          const joined = Math.max(axis, f + (undisturbed - f) * ramp(v, .77, 1));
          f += (joined - f) * mix;
        }
        ring.face[j] = f * (1 - vault) + cap.face[j] * vault;
      }
      ring.fore = ring.face[0] - ring.axis;
      return ring;
    });
    const chin = infantChin ? sculptInfantChin(rowList, mouth, shape, infantChin === pinePortraitStyles.chinPadRelease) : null;
    if (infantProfile) {
      // Carry the outline over the upper occiput into the original cap. These
      // are rear stations only. Width, brow and facial profiles stay independent.
      const nape = curve([-.16,0,.16,.29,.41,.52,.63,.74,.85],
        [-.77,-.88,-.934,-.943,-.902,-.824,-.716,-.56,-.343]);
      for (let i=0; i<=rings; i++) {
        const h = i*2/rings-1;
        if (h <= -.16 || h >= .85) continue;
        const r = rowList[i], blend = ramp(h,-.16,.12) * (1-ramp(h,.64,.85));
        r.rear += (r.axis - nape(h) - r.rear) * blend;
      }
    }
    for (let i = 0; i <= rings; i++) {
      const r = rowList[i],
        low = rowList[Math.max(0, i - 3)],
        high = rowList[Math.min(rings, i + 3)];
      r.frontShade = new Float32Array(steps + 1);
      r.sideShade = new Float32Array(steps + 1);
      for (let j = 0; j <= steps; j++) {
        const v = j / steps,
          y = v * r.width;
        const dy = (frontAt(r, v + 0.035) - frontAt(r, v - 0.035)) / (Math.max(0.05, r.width) * 0.07);
        const dz = clamp(
          ((frontAt(high, y / Math.max(0.015, high.width)) - frontAt(low, y / Math.max(0.015, low.width))) *
            rings) /
            12,
          -1.4,
          1.4
        );
        const len = Math.hypot(1, dy, dz);
        r.frontShade[j] = (0.64 - 0.47 * dz) / len;
        r.sideShade[j] = (0.4 * dy) / len;
      }
    }
    const row = (h) => rowList[clamp(Math.round(((h + 1) * rings) / 2), 0, rings)];
    return { row, insideSkin, frontAt, noseWidth, mouth, chin, tip: eye - (eye - mouth) * tipAt, cheekCenter: -0.19 };
  }

  function eye(shape, off, h, blink, side, k, pitch) {
    const q = off / shape.width;
    if (Math.abs(q) >= 1) return 0;
    const arch = (1 - q * q) ** 0.73;
    const up = shape.infant ? Math.max(0.184, shape.up) : shape.up;
    const down = shape.infant ? Math.max(0.098, shape.down) : shape.down;
    const top = up * arch * (shape.infant ? 0.97 : 0.9);
    const bottom = -down * arch * (shape.infant ? 1.16 : 1.05);
    const y = h - shape.tilt * q;
    const shut = bottom * 0.41 + top * 0.19;
    const edge = top + (shut - top) * blink,
      floor = bottom + (shut - bottom) * blink;
    const stroke = clamp(0.021 + 0.42 * pitch, 0.023, 0.043) * (0.62 + 0.38 * arch);
    if (y > edge + stroke || y < floor - stroke * 0.29) return 0;
    if (blink > 0.94 || y > edge - 0.48 * stroke) return k.lash;
    const irisX = (q + 0.045) / (shape.infant ? 0.7 : 0.73);
    const irisY = (y - 0.12 * up) / (1.03 * Math.max(up, down));
    const iris = irisX * irisX + irisY * irisY;
    if (iris > 1) return y > 0.6 * edge || q > 0.84 ? k.scleraShade : k.sclera;
    if (blink < 0.55 && ((side * irisX + 0.28) / 0.28) ** 2 + ((irisY - 0.3) / 0.29) ** 2 < 1) return k.glint;
    if (irisY < -0.24 && Math.abs(irisX) < 0.81) return k.irisLight;
    if ((irisX * irisX) / 0.48 + (irisY * irisY) / 0.85 < 1) return k.pupil;
    return irisY > 0.32 ? k.irisShadow : k.eyes;
  }
  function lip(name, params, v, h, infant, k, pitch, drawn = 0) {
    const [, width, up, down, smile] = params,
      q = Math.abs(v) / (width * (infant ? 1.06 : 1.08) * (1 + .07 * drawn));
    if (q >= 1) return 0;
    const curve = 1 - q * q,
      line = clamp(0.012 + pitch * 0.35, 0.014, 0.031) + drawn * (.006 + .15 * pitch);
    const height = h - clamp(smile * (infant ? 1.22 : 1.05), -0.08, 0.11) * q * q;
    if (infant && (name === 'soft-smile' || name === 'smile')) {
      const cavity = (name === 'smile' ? 0.129 : 0.087) * curve;
      if (height < line && height > -cavity) return height < -0.53 * cavity ? k.lipPetal : k.lipLine;
    }
    if (Math.abs(height) < line * (0.67 + 0.33 * curve)) return k.lipLine;
    if (height > 0 && height < up * 0.65 * curve && !infant) return k.upperLip;
    if (height < 0 && height > -down * (infant ? 0.69 : 0.85) * curve) return k.lowerLip;
    return 0;
  }
  // Upper and lower lid heights at seven stations from tear duct to temple.
  // The visible white ends in two wedges. The iris stays behind the moving lid.
  const featureGuides = {
    adult:   { lid:[[-.12,-.12],[.55,-.56],[.89,-.87],[1,-.90],[.91,-.73],[.59,-.38],[.08,.08]], opening:.97, iris:.71, brow:.95, smile:.054, part:.031 },
    child:   { lid:[[-.18,-.18],[.59,-.66],[.95,-.97],[1,-1],[.94,-.87],[.62,-.48],[.02,.02]], opening:1.04, iris:.73, brow:.89, smile:.095, part:.018 },
    toddler: { lid:[[-.21,-.21],[.63,-.71],[.97,-.99],[1,-1],[.95,-.9],[.64,-.55],[-.03,-.03]], opening:1.13, iris:.74, brow:.80, smile:.125, part:.044 },
    baby:    { lid:[[-.19,-.19],[.64,-.65],[.96,-.94],[1,-.96],[.95,-.85],[.63,-.49],[-.04,-.04]], opening:1.03, iris:.68, brow:.68, smile:.146, part:.085 }
  };
  // Indexed iris drawn in the surface coordinates of the eye. The small amber
  // or cool arc turns around the pupil and the catchlight stays on the lit side.
  const irisBrush = [
    '....rrr....', '..rriiirr..', '.riipppiir.', '.ri**pppiir',
    'ri**ppppiir', 'rii*ppppiir', 'riippppiiar', 'riiiippiiaa',
    '.riiaaaaii.', '..riiaair..', '....iir....'
  ];
  const irisInks = { r:'irisShadow', p:'pupil', i:'eyes', a:'irisLight', '*':'glint' };
  // The artist chooses the resting attitude. Motion is layered over it in
  // head coordinates, shared by both eyes and independent of the camera.
  function expression(base, face, cue, jawOpen) {
    const rest = face.restExpression || (face.mouth === 'smile' ? 'warm' : face.eyes === 'round' ? 'curious' : 'calm');
    const young = base === 'baby' || base === 'toddler';
    const [across, up] = cue?.gaze || [0,0], smile = clamp(cue?.smile || 0,0,1);
    return {
      across:.44*across, up:.40*up, iris:young ? .63 : .65,
      lid:(young ? .84 : .92) + (rest === 'curious' ? .13 : 0) + .045*up - .07*smile,
      lower:(young ? .84 : .93) - .09*smile,
      brow:(rest === 'curious' ? .031 : 0) + .014*up,
      lift:(rest === 'warm' ? .74 : .46) + .72*smile,
      gap:(rest === 'warm' ? .24 : .045) + .51*smile,
      jaw:clamp(jawOpen || 0,0,1)
    };
  }
  function paintedEye(guide, shape, off, h, blink, side, k, pitch, acting) {
    const q = off / (1.06 * shape.width);
    if (Math.abs(q) >= 1 || h > .42 || h < -.30) return 0;
    const at = (q + 1) * 3, i = Math.min(5, Math.floor(at)), t = at - i;
    const a = guide.lid[i], b = guide.lid[i + 1];
    const up = (shape.infant ? .053 + .72 * shape.up : shape.up) * guide.opening * (acting ? acting.lid : 1);
    const down = (shape.infant ? .031 + .83 * shape.down : shape.down) * 1.13 * guide.opening * (acting ? acting.lower : 1);
    const y = h - shape.tilt * q;
    const top = (a[0] + t * (b[0] - a[0])) * up;
    const base = (a[1] + t * (b[1] - a[1])) * down;
    const shut = .65 * base + .35 * top, lid = top + blink * (shut - top);
    const floor = base + blink * (shut - base);
    const stroke = clamp(.023 + .29 * pitch, .025, .044) * (1 - .36 * q * q);
    if (y > lid + stroke || y < floor - .22 * stroke) return 0;
    if (blink > .93 || y >= lid - .27 * stroke) return Math.abs(q) > .79 ? k.lidSkin : k.lash;
    const ix = acting ? (side * (q + .045) - acting.across) / acting.iris : side * (q + .032) / guide.iris;
    const iz = (y - (.095 + (acting?.up || 0)) * up) / (.73 * up + .48 * down);
    if (Math.abs(ix) < 1 && Math.abs(iz) < 1) {
      const mark = irisBrush[Math.floor((1 - iz) * 5.5)][Math.floor((ix + 1) * 5.5)];
      if (mark !== '.') return k[irisInks[mark]];
    }
    return Math.abs(q) > .81 || y > lid - 2 * stroke ? k.scleraShade : k.sclera;
  }
  function paintedMouth(guide, name, row, lateral, h, k, pitch, upperScale, lowerScale, acting) {
    if (h > .33 || h < -.55) return 0;
    const [, width, up, down, lift, bow, part] = row;
    const q = Math.abs(lateral) / (1.12 * width);
    if (q >= 1) return 0;
    // The centre and corners meet as a single band at figure resolution.
    // A lifted corner gets narrower and softer as it turns into the cheek.
    const mass = 1 - q * q;
    const rise = name === 'smile' ? .14 : name === 'soft-smile' ? .071 + .32 * guide.part : lift;
    const y = h - rise * (acting ? acting.lift : 1) * (.14 * q + .86 * q * q);
    const seam = (.029 + Math.min(.025, .61 * pitch)) * (.69 + .31 * mass) * (acting ? .68 : 1);
    const restingGap = name === 'smile' ? guide.smile : name === 'soft-smile' ? guide.part : part * .62;
    const gap = (acting ? restingGap * acting.gap + .075*acting.jaw : restingGap) * mass * lowerScale;
    if (y < seam && y > -gap - .56 * seam) {
      if (q > .88 || (acting && gap < .023 && q > .47)) return k.upperLip;
      if (gap > .064 && y < -.52 * gap) return k.lipPetal;
      return k.lipLine;
    }
    const cupid = 1 + bow * .24 * bell(q, .37, .28);
    if (y > 0 && y < (.020 + .64 * up * upperScale) * mass * cupid) return k.upperLip;
    if (y < 0 && y > -gap - (.033 + .77 * down * lowerScale) * mass)
      return q < .67 && y < -gap - .31 * down ? k.lowerLip : k.lipBody;
    return 0;
  }
  function skin(model, r, x, y, h, eye, infant, k, inks, painted, acting) {
    const a = Math.abs(y),
      side = x - r.axis;
    if (side > 0 && a < model.noseWidth * 1.18) {
      const tip = h - model.tip;
      if (painted) {
        const width = a / model.noseWidth;
        if (tip < -.008 && tip > -.063 * (1 - .55 * width) && width < .81)
          return k[inks[width > .56 ? 15 : 17]];
        if (bell(y, -.025, model.noseWidth * .80) * bell(tip, .032, .057) > .32)
          return k[inks[10]];
      }
      const underWing = bell(a, 0.64 * model.noseWidth, 0.34 * model.noseWidth) * bell(tip, -0.034, 0.034);
      if (underWing > 0.59) return painted && infant ? k[inks[17]] : k.noseShade;
      const noseTurn = bell(y, 0.16 * model.noseWidth, model.noseWidth * 0.86) * bell(tip, -0.033, 0.034);
      if (noseTurn > 0.38 || underWing > 0.23) return k[inks[18]];
      if (bell(y, -0.025, model.noseWidth * 0.62) * bell(tip, 0.024, 0.036) > 0.46) return k[inks[10]];
    }
    // Large connected paint groups give cheeks a turning plane in three-quarter
    // view. Outer eyelids and the underside share the shadow family with the ear.
    const across = clamp(a / Math.max(0.01, r.width), 0, 1);
    const bottom = ramp(-h, 0.4, 0.93),
      front = ramp(side, -0.4, 0.69);
    const under = bottom * (1 - 0.42 * front);
    const blush =
      bell(a, infant ? 0.57 : 0.63, infant ? 0.37 : 0.33) *
      bell(h, eye - (infant ? 0.21 : 0.24), 0.21) *
      front;
    const index = Math.min(steps, Math.round(across * steps));
    const turn = r.frontShade[index] + Math.sign(y) * r.sideShade[index];
    let light =
      0.47 +
      (0.29 * turn + 0.046) * front -
      0.08 * across * across -
      0.16 * under +
      0.029 * h +
      0.05 * bell(a, 0.41, 0.43) * bell(h, eye - 0.22, 0.23) * front;
    if (model.chin && (h < model.mouth - .065 || (h < model.mouth + .15 && a > .32))) {
      const below = ramp(model.chin.padH - h, .015, .12);
      const cheekLight = .48 + .064*front - .035*across*across - .042*below;
      const cheek = ramp(a,.32,.61) * ramp(model.mouth-h,-.15,.12);
      light += (cheekLight-light) * (.36 * cheek + .39 * ramp(model.mouth-h,.065,.14));
      light += .078 * bell(a,0,.48) * bell(h,model.chin.padH,.105) * front - .032 * below;
      if (model.chin.supported) {
        const pad = ramp(x,.43,.83) * (1-ramp(a,.30,.62));
        light += pad * (.093 * bell(h,model.chin.padH+.016,.076) - .049 * bell(h,model.mouth-.10,.039));
      }
    } else if (painted && (h < -.38 || h < model.mouth - .07)) {
      const chinFront = ramp(x, .02, .89);
      const underside = ramp((infant ? -.43 : -.42) - .39 * chinFront - h, -.035, .23);
      light += .065 * bell(a, .31, .43) * bell(h, model.mouth - .20, .13) * front
        - underside * (.078 - .031 * chinFront);
    }
    if (acting && infant && side < 0) {
      // A rear surface has its own light, independent of the changing eye and
      // cheek normals at the same width. Let the nape turn into the collar.
      const rear = Math.min(1,-side / Math.max(.05,r.rear));
      const nape = .48 + .13*h - .045*y - .043*rear;
      light += (nape-light) * ramp(rear,0,.62);
    }
    const tone =
      light > 0.715
        ? 10
        : light > 0.652
          ? 8
          : light > 0.58
            ? 7
            : light > 0.5
              ? 6
              : light > 0.43
                ? 5
                : light > 0.35
                  ? 4
                  : 3;
    return k[inks[(blush > 0.36 ? 24 : blush > 0.14 ? 12 : 0) + tone]];
  }
  function palette(materials, swatches, tint, painted) {
    const rgb = [1, 3, 5].map((i) => parseInt(swatches.skin.slice(i, i + 2), 16));
    const dark = clamp((148 - (0.25 * rgb[0] + 0.58 * rgb[1] + 0.17 * rgb[2])) / 110, 0, 1);
    materials.sclera = tint(materials.sclera, 'cba58d', 0.16 + 0.34 * dark);
    materials.scleraShade = tint(materials.sclera, materials.faceMid, 0.17 + 0.16 * dark);
    materials.glint = tint(materials.glint, 'f5d9b6', 0.33 * dark);
    materials.eyes = tint(materials.eyes, materials.irisLight, 0.14 * dark);
    if (painted) {
      materials.sclera = tint(materials.sclera, materials.faceMid, .20);
      materials.scleraShade = tint(materials.scleraShade, materials.faceMid, .23);
      materials.glint = tint(materials.glint, materials.sclera, .22);
      const iris = swatches.eyes.slice(1);
      const daylight = parseInt(iris.slice(4),16) - parseInt(iris.slice(0,2),16) > 18 ? 'bdd2d9' : 'dfb28f';
      const irisValue = Math.max(...[0,2,4].map(i => parseInt(iris.slice(i,i+2),16))) / 255;
      materials.eyes = tint(iris, daylight, .13 + .12 * (1 - irisValue));
      materials.irisLight = tint(materials.eyes, daylight, .37);
      materials.irisShadow = tint(iris, '302029', .43);
      materials.lipLine = tint(materials.lipLine, materials.faceMid, .16);
      materials.upperLip = tint(materials.upperLip, materials.faceMid, .15);
      materials.lowerLip = tint(materials.lowerLip, materials.faceMid, .22);
      const fair = clamp((.25*rgb[0] + .58*rgb[1] + .17*rgb[2] - 166) / 65, 0, 1);
      for (let warmth=0; warmth<4; warmth++) for (let tone=3; tone<=6; tone++) {
        const name = 'skinPlane' + (12*warmth + tone);
        materials[name] = tint(materials[name], '9e6c62', fair * .086 * (7-tone)/4);
      }
    }
    for (let warmth = 0; warmth < 4; warmth++) {
      for (let tone = 5; tone < 12; tone++) {
        const name = 'skinPlane' + (12 * warmth + tone);
        materials[name] = tint(materials[name], 'e8aa84', (0.078 * dark * (tone - 4)) / 7);
      }
    }
  }
  const cache = new Map();
  function model(base, shape, face, target, scalp, eye, mouth, nose, drawn = false, painted = false, infantProfile = false, infantChin = false) {
    const key = JSON.stringify([base, shape, face.outline, face.nose, target, face.formMix ?? 1, eye, mouth, drawn, painted, infantProfile, infantChin]);
    if (!cache.has(key)) {
      if (cache.size >= 8) cache.delete(cache.keys().next().value);
      cache.set(key, build(base, shape, face, target, scalp, eye, mouth, nose, drawn, painted, infantProfile, infantChin));
    }
    return cache.get(key);
  }
  return { model, forms, baseForms, lipLift, chinShift, eye, lip, featureGuides, expression, paintedEye, paintedMouth, skin, palette };
})();
