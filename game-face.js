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
  // Brow to upper lip, measured in units of the distance to the tip. The ball
  // rises out of a shallow root and rolls into two low wings.
  const nurseryNose = curve([-.22, 0, .32, .58, .78, .92, 1, 1.10, 1.24, 1.40],
    [0, .015, .06, .20, .57, .92, 1, .87, .36, 0]);
  // Root, bridge, ball and the short returning underside on the same surface.
  const softNose = curve([-.24,0,.28,.57,.80,.94,1,1.08,1.19,1.34],
    [0,.018,.16,.43,.81,.985,1,.95,.60,0]);
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
  // Draw one continuous profile from the upper lip, past the labiomental
  // crease and chin pad, onto the underside. Depths follow this face's lips
  // and existing jaw base. The ear-side hinge and lateral jaw keep their fit.
  function sculptLipChin(rows, age, mouth, noseBase, shape) {
    const index = h => clamp(Math.round((1+h)*rings/2),0,rings);
    const bottomH = 2*rows.findIndex(r=>r.width>.008)/rings-1;
    const height = mouth-bottomH;
    if (height < .15) return null;
    const depth = t => rows[index(mouth-t*height)].face[0];
    const upper = depth(-.085);
    const lower = upper-height*((age === 'adult' ? .033 : .021)-.028*(shape.lowerLipFullness || 0));
    const chinT = (age === 'adult' ? .52 : age === 'child' ? .49 : .45)+.04*(shape.chinHeight || 0);
    const setBack = (age === 'adult' ? .157 : age === 'child' ? .110 : .083)-.14*(shape.chinProjection || 0);
    const pad = lower-height*setBack;
    const crease = pad+height*((age === 'adult' ? .048 : .020)-.018*(shape.jawDefinition || 0));
    const top = -clamp((noseBase-mouth)/height*.88,.13,.26);
    const under = .80+.035*(shape.chinRoundness || 0);
    const contour = curve([top,-.085,-.012,.079,.17,.34,chinT,.68,under,.92,1],
      [depth(top),upper,upper-.016,lower,lower-.024,crease,pad,
        pad+.58*(depth(.71)-pad),.13*pad+.87*depth(under),depth(.92),depth(1)]);
    for (let i=index(bottomH); i<=index(mouth-top*height); i++) {
      const row = rows[i], t = (mouth-(2*i/rings-1))/height;
      if (t <= top || t >= 1) continue;
      const delta = contour(t)-row.face[0];
      for (let j=0;j<=steps;j++) {
        const v = j/steps;
        row.face[j] = Math.max(row.axis,row.face[j]+delta*(1-ramp(v,.22,.84)));
      }
      row.fore = row.face[0]-row.axis;
    }
    return {padH:mouth-chinT*height,creaseH:mouth-.34*height,bottomH};
  }
  function build(base, shape, face, baseTarget, scalp, eye, mouth, noseRow, drawn, painted, infantProfile, infantChin, infantNose, ink, layout) {
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
    const fittedTip = noseLength - (1 - noseLength) * .72 * ((shape.noseLipSpacing ?? 1) - 1);
    const tipAt = infantNose ? clamp(.56 + .61 * (fittedTip - .58), .43, .65) : fittedTip;
    const softPixels = !!layout?.softPixels;
    const noseBase = eye - Math.max(.24,eye-mouth) * tipAt * (infantNose ? 1.40 : softPixels ? 1.34 : .88/.61);
    const archFall = layout && layout.mouthHalf * layout.lateralDepth *
      (.54 + .11*value('lipProjection') + .06*value('jawDefinition'));
    const orbitCenter = layout?.eyeCenter ?? .48, orbitWidth = layout ? 1.20*layout.eyeHalf : .29;
    const reach =
      (infant ? 0.132 : base === 'adult' ? 0.205 : 0.166) *
      clamp(noseRow[2] / 0.19 + 0.32 * value('noseBridge'), 0.58, 1.5) *
      (0.85 + 0.15 * (shape.faceRelief ?? 1)) * (drawing ? 1 + (landmarks[base][baseTarget][2] - 1) * mix : 1);
    const fittedWidth = clamp(noseRow[1] * (1 + 0.26 * value('noseWidth')) * (infant ? 1.17 : 1), 0.105, 0.32);
    const noseWidth = infantNose ? .075 + .72 * fittedWidth : fittedWidth;
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
    const chinLift = neutralChins[base] + (drawing ? chinShift(base, baseTarget, mix) : 0) + (softPixels && !infant ? .050 : 0);
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
      const jawBreadth = layout?.storybook
        ? 1 + (infant ? .022 : .062)*bell(u,-.76,.22) - (infant ? 0 : .018)*bell(u,-.23,.28) : 1;
      const width =
        p[0](u) *
        jawBreadth * (1 - underChin * (infant ? .075 : .10)) * (1 +
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
      const tipRatio = t / tipAt;
      const nose = infantNose ? nurseryNose(tipRatio) * (.099 + .62 * (reach - .13))
        : softPixels ? softNose(tipRatio)*(.029+.64*reach) : noses(tipT) * reach * (infantProfile ? 1.38 : 1);
      const wing = infantNose ? .031 * bell(tipRatio, 1.10, .25) : softPixels ? .048 * bell(tipRatio,1.03,.27) : .037 * bell(tipT, .67, .19);
      const bulbWidth = infantNose || softPixels ? noseWidth * (.61 + .39 * ramp(tipRatio, .36, .91)) : noseWidth;
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
      const mouthBand = layout && ramp(h,mouth-.25,mouth-.04) * (1-ramp(h,mouth+.06,Math.max(mouth+.13,noseBase+.08))) *
        (infant ? .48 : base === 'toddler' ? .68 : .91);
      const lidH = layout && (h-eye) / (h >= eye ? layout.lidTop : layout.lidBottom);
      const lidBand = layout && (1-ramp(Math.abs(lidH),.72,1.70));
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
          eyeBand = layout ? bell(lidH,0,1.55) : bell(h, eye, 0.19);
        const socket = bell(y, orbitCenter, orbitWidth) * eyeBand * (0.044 + 0.036 * value('eyeDepth')) * amount;
        const undisturbed = dome(v);
        let f =
          undisturbed +
          nose * (infantNose || softPixels ? Math.max(0, 1 - (y / bulbWidth) ** 2) ** 1.28 : bell(y, 0, noseWidth)) +
          wing * bell(y, noseWidth * 0.74, noseWidth * 0.6) +
          mouthBed * bell(y, 0, 0.41) -
          oralArc * ramp(y, 0.025, 0.43) * (1 - ramp(y, 0.61, 0.9)) -
          socket;
        if (layout) {
          // Across the mouth, the turning point belongs to this person's
          // commissure. Beyond it the measured cheek section takes over.
          if (mouthBand > 0) {
            const q = y/layout.mouthHalf;
            const weight = mouthBand * ramp(q,.04,.72) * (1-ramp(q,1.02,1.90));
            const arc = q <= 1 ? q*q : 2*q-1;
            const dental = mid + mouthBed - archFall*arc;
            f += weight*(dental-f);
          }
          if (lidBand > 0) {
            const q = (y-layout.eyeCenter)/layout.eyeHalf;
            const weight = lidBand * (1-ramp(Math.abs(q),.73,1.36)) * ramp(y,.48*noseWidth,noseWidth+.04);
            const dome = bell(q,0,1.26)*bell(lidH,0,1.24);
            const surround = eyelids(y/eyeWidth) - .035*amount*value('eyeDepth');
            const relief = layout.lateralDepth*layout.eyeHalf * (infant ? .21 : .30);
            f += weight*(surround + relief*(dome-.38) - f);
          }
        } else {
          const lidRegion =
            ramp(y, 0.1, 0.25) * (1 - ramp(y, 0.72, 0.91)) * (1 - ramp(Math.abs(h - eye - 0.035), 0.145, 0.3));
          if (lidRegion > 0) {
            const eyeSurface =
              eyelids(y / eyeWidth) + 0.026 * bell(y, 0.46, 0.26) - 0.036 * amount * value('eyeDepth');
            f += lidRegion * (eyeSurface - f);
          }
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
    const lipChin = layout?.softProfile && !infant ? sculptLipChin(rowList,base,mouth,noseBase,shape) : null;
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
    return { row, insideSkin, frontAt, noseWidth, noseBase, infantNose, softPixels, storybook:!!layout?.storybook,
      brimEdge:layout?.brimEdge, ink, mouth, chin, lipChin, tip: eye - (eye - mouth) * tipAt, cheekCenter: -0.19 };
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
  // Pair lid design with the edge of the cheek shadow. Coordinates and light
  // are in head space, so the same patches wrap around a turning character.
  const brushes = {
    wash:{ lid:[[0,0],[.65,-.58],[.98,-.97],[1,-1],[.79,-.85],[.43,-.45],[0,0]], stroke:.79, brow:.82, iris:1.09, corner:.87, shadow:.08, warmth:.94 },
    cel: { lid:[[-.16,-.16],[.41,-.52],[.96,-.73],[1,-.87],[1,-.66],[.72,-.27],[.13,.13]], stroke:1.20, brow:1.05, iris:1.00, corner:1.04, shadow:.18, warmth:.68 },
    line:{ lid:[[-.12,-.12],[.39,-.39],[.73,-.58],[.87,-.68],[.93,-.50],[.75,-.18],[.22,.22]], stroke:1.55, brow:.93, iris:.91, corner:1.22, shadow:.12, warmth:.46 }
  };
  // Each row traces an upper and a lower lid from the tear duct to the temple.
  // Retain the selected eye's width and tilt when drawing these different openings.
  const restingLids = {
    rounded: [[-.10,-.10],[.64,-.60],[.97,-.95],[1,-1],[.94,-.82],[.62,-.51],[.02,.02]],
    almond:  [[-.18,-.18],[.46,-.54],[.77,-.77],[.90,-.82],[.89,-.59],[.65,-.30],[.13,.13]],
    covered: [[-.08,-.08],[.42,-.52],[.65,-.83],[.71,-.91],[.69,-.77],[.47,-.44],[.01,.01]],
    falling: [[.01,.01],[.65,-.46],[.90,-.71],[.94,-.78],[.76,-.68],[.39,-.44],[-.08,-.08]]
  };
  const lidKinds = {
    classic:'almond', almond:'almond', upturned:'almond', 'long-almond':'almond', 'level-eye':'almond',
    round:'rounded', 'doe-eye':'rounded', 'soft-oval':'rounded', 'double-lid':'rounded',
    narrow:'covered', sleepy:'covered', hooded:'covered', monolid:'covered', 'deep-set':'covered',
    downturned:'falling', crescent:'falling'
  };
  function featureBrush(base, ink, softPixels = false, eyes, storybook = false) {
    const guide = featureGuides[base], brush = brushes[ink];
    if (!brush) return guide;
    const mix = base === 'baby' ? .46 : base === 'toddler' ? .70 : .92;
    const drawing = softPixels ? restingLids[lidKinds[eyes]] || brush.lid : brush.lid;
    const lid = guide.lid.map((pair,i) => pair.map((v,j) => v + mix * (drawing[i][j] - v)));
    return { ...guide, lid, brow:guide.brow * brush.brow, brush, irisDrawing:irisDrawings[ink],softPixels,storybook };
  }
  // Indexed iris drawn in the surface coordinates of the eye. The small amber
  // or cool arc turns around the pupil and the catchlight stays on the lit side.
  const irisBrush = [
    '....rrr....', '..rriiirr..', '.riipppiir.', '.ri**pppiir',
    'ri**ppppiir', 'rii*ppppiir', 'riippppiiar', 'riiiippiiaa',
    '.riiaaaaii.', '..riiaair..', '....iir....'
  ];
  const irisDrawings = {
    wash:['....rrr....','..rriiirr..','.riipppiiir','.ri**pppiir','ii**ppppiir','iii*ppppiir','riiipppiiar','riiiippiaaa','.riiaaaaai.','..iiaaaai..','....iii....'],
    cel: ['....rrr....','..rririrr..','.rrippppiir','.ri**pppiir','ri**ppppiir','riiippppiir','riiipppiiaa','riiiippiaaa','.riaaaaaii.','..iiaaaii..','....iii....'],
    line:['....rrr....','..rrrrrrr..','.rriipppiir','.ri**pppiir','ri**ppppiir','riiippppiir','riiipppiirr','riiippiiaar','.riiaaaaai.','..riiaair..','....iii....']
  };
  const irisInks = { r:'irisShadow', p:'pupil', i:'eyes', a:'irisLight', '*':'glint' };
  // This cluster sits behind both lids. Its upper portion is deliberately
  // cropped at rest; the lower iris ends in a coloured arc against the white.
  const storyIris = [
    '...rrrrr...', '..rrrrrrr..', '.rrriiiiir.', '.rii**ppir.',
    'riii**pppii', 'riippppppii', 'riiippppiia', '.iiiippiaa.',
    '.iiaaaiiia.', '..iaaaaii..', '....iii....'
  ];
  // The artist chooses the resting attitude. Motion is layered over it in
  // head coordinates, shared by both eyes and independent of the camera.
  function expression(base, face, cue, jawOpen, ink) {
    const young = base === 'baby' || base === 'toddler';
    const storybook = face.finish === 'storybook';
    const warm = face.mouth === 'smile' || (storybook && face.mouth === 'soft-smile');
    const curious = face.eyes === 'round' && (!storybook || young);
    const rest = face.restExpression || (warm ? 'warm' : curious ? 'curious' : 'calm');
    const [across, up] = cue?.gaze || [0,0], smile = clamp(cue?.smile || 0,0,1);
    return {
      across:.44*across, up:.40*up, iris:young ? .63 : .65,
      lid:(young ? .84 : .92) + (rest === 'curious' ? (ink ? .07 : .13) : 0) + .045*up - .07*smile
        - (storybook && rest === 'warm' ? .065 : 0),
      lower:(young ? .84 : .93) - .09*smile - (ink && rest === 'warm' ? .14 : 0),
      brow:(rest === 'curious' ? .031 : 0) + .014*up,
      lift:(rest === 'warm' ? .74 : .46) + .72*smile,
      gap:(rest === 'warm' ? .24 : .045) + .51*smile,
      jaw:clamp(jawOpen || 0,0,1), rest, smile
    };
  }
  function paintedEye(guide, shape, off, h, blink, side, k, pitch, acting) {
    const q = off / ((guide.softPixels ? .99 : 1.06) * shape.width);
    if (guide.brush === brushes.line && q >= .87 && q < 1.17) {
      const lift = shape.tilt*q + .20*shape.up + .15*(q-1);
      if (Math.abs(h-lift) < (.028 + .20*pitch)*(1.17-q)/.30) return k.lash;
    }
    if (Math.abs(q) >= 1 || h > .42 || h < -.30) return 0;
    const at = (q + 1) * 3, i = Math.min(5, Math.floor(at)), t = at - i;
    const a = guide.lid[i], b = guide.lid[i + 1];
    const up = (shape.infant ? .053 + .72 * shape.up : shape.up) * guide.opening * (acting ? acting.lid : 1);
    const down = (shape.infant ? .031 + .83 * shape.down : shape.down) * 1.13 * guide.opening * (acting ? acting.lower : 1);
    const y = h - (guide.storybook ? .55 : guide.softPixels ? .76 : 1) * shape.tilt * q;
    const top = (a[0] + t * (b[0] - a[0])) * up * (guide.softPixels && !shape.infant ? .88 : 1);
    const base = (a[1] + t * (b[1] - a[1])) * down * (guide.storybook && !shape.infant ? .80 : 1);
    const shut = .65 * base + .35 * top, lid = top + blink * (shut - top);
    const floor = base + blink * (shut - base);
    const stroke = clamp(.023 + .29 * pitch, .025, .044) * (1 - .36 * q * q) *
      (guide.storybook ? 1.38+.24*q : guide.softPixels ? 1.09 + .15*q : guide.brush ? guide.brush.stroke * (.96 + .24*q) : 1);
    if (y > lid + stroke || y < floor - .22 * stroke) return 0;
    if (blink > .93 || y >= lid - .27 * stroke) {
      if (guide.storybook) return q < -.64 ? k.lidSkin : q > .86 ? k.browSoft : k.lash;
      if (guide.softPixels) return Math.abs(q) > .78 ? k.lidSkin : q < -.52 ? k.irisShadow : k.lash;
      return Math.abs(q) > .79 && !(guide.brush && q > 0) ? k.lidSkin : k.lash;
    }
    if (guide.storybook) {
      const across = side*(q+.025) - .70*(acting?.across || 0);
      const ix = across / (shape.infant ? .66 : .58);
      const iz = (h-(.16+.78*(acting?.up || 0))*up) / (.72*up+.38*down);
      if (Math.abs(ix) < 1 && Math.abs(iz) < 1) {
        const mark = storyIris[Math.floor((1-iz)*5.5)][Math.floor((ix+1)*5.5)];
        if (mark !== '.') return k[irisInks[mark]];
      }
      if (q > .28 && y < floor+.36*stroke) return k.lidRim;
      return Math.abs(q) > .80 || y > lid-1.7*stroke ? k.scleraShade : k.sclera;
    }
    if (guide.softPixels) {
      // Both pupils share the gaze direction. The eyelid clips a steady iris
      // while a small upper glint and a lower crescent describe its surface.
      const ix = (side*(q+.075)-.71*(acting?.across || 0))/(shape.infant ? .73 : .68);
      const iz = (h-(.075+.76*(acting?.up || 0))*up)/(.77*up+.42*down);
      const radius = ix*ix+iz*iz;
      if (q > .36 && y < floor+.40*stroke) return k.lidRim;
      if (radius < 1) {
        if (((ix+.28)/.19)**2 + ((iz-.24)/.19)**2 < 1) return k.glint;
        if ((ix/.55)**2+((iz-.11)/.55)**2 < 1) return k.pupil;
        if (radius > .88 || iz > .36) return k.irisShadow;
        return iz < -.23 && ix > -.56 ? k.irisLight : k.eyes;
      }
      return Math.abs(q) > .84 || y > lid-1.8*stroke ? k.scleraShade : k.sclera;
    }
    const ix = (acting ? (side * (q + .045) - acting.across) / acting.iris : side * (q + .032) / guide.iris) / (guide.brush?.iris ?? 1);
    const iz = (y - (.095 + (acting?.up || 0)) * up) / (.73 * up + .48 * down);
    if (Math.abs(ix) < 1 && Math.abs(iz) < 1) {
      const grid = guide.irisDrawing || irisBrush;
      const mark = grid[Math.floor((1 - iz) * 5.5)][Math.floor((ix + 1) * 5.5)];
      if (mark !== '.') return k[irisInks[mark]];
    }
    return Math.abs(q) > .81 || y > lid - 2 * stroke ? k.scleraShade : k.sclera;
  }
  // At six stations from the centre to a corner, draw the crease, upper lip
  // and lower lip independently. At sprite scale only the crease is continuous.
  const lipStations = [0,.20,.42,.66,.85,1];
  const lipDrawing = (seam, upper, lower, gap) => ({
    seam:curve(lipStations,seam), upper:curve(lipStations,upper), lower:curve(lipStations,lower), gap
  });
  const mouthDrawings = {
    gentle:lipDrawing([-.012,-.011,-.006,.008,.022,.030],[.36,.70,.58,.26,.07,0],[.76,.86,.58,.24,.05,0],.004),
    quiet:lipDrawing([-.005,-.002,.008,.016,.020,.019],[.42,.67,.59,.29,.08,0],[.84,.91,.68,.30,.05,0],0),
    bow:lipDrawing([-.009,.004,.012,.019,.022,.021],[.57,.98,.80,.36,.11,0],[.98,.95,.72,.35,.08,0],0),
    smile:lipDrawing([-.022,-.019,-.011,.011,.043,.069],[.33,.63,.54,.25,.07,0],[.92,.94,.80,.47,.15,0],.009),
    open:lipDrawing([-.008,-.005,.003,.017,.031,.039],[.45,.75,.57,.25,.07,0],[.86,.90,.65,.25,.06,0],.018),
    bud:lipDrawing([-.008,-.003,.011,.020,.023,.020],[.57,.93,.77,.34,.11,0],[1,.98,.70,.25,.05,0],.014)
  };
  const restingLifts = {pursed:.018, relaxed:.028, wide:.036, classic:.042, 'lower-full':.048, 'upper-full':.050, full:.057, bow:.060, small:.065};
  function mouthBrush(base, guide, name, row, upperScale, lowerScale, acting, softProfile = false, softPixels = false) {
    const young = base === 'toddler' || base === 'baby';
    const smiling = name === 'smile' || name === 'soft-smile' || acting.rest === 'warm';
    const parted = acting.rest === 'curious' && ['small','relaxed','classic','lower-full'].includes(name);
    const bow = ['bow','pursed','full','upper-full','lower-full'].includes(name);
    const gentleSmile = softProfile && smiling && name !== 'smile';
    const restingLift = restingLifts[name] ?? .046;
    const drawing = gentleSmile ? mouthDrawings.gentle : smiling ? mouthDrawings.smile : young ? mouthDrawings.bud : parted ? mouthDrawings.open : bow ? mouthDrawings.bow : mouthDrawings.quiet;
    const width = row[1] * (smiling ? 1.05 : 1.01) * (softPixels && !young ? 1.11 : 1);
    const top = (.013 + .72*row[2]) * upperScale * (softPixels ? .78 : 1);
    const bottom = (.021 + .83*row[3]) * lowerScale * (softPixels ? .72 : 1);
    const gap = softPixels ? (name === 'smile' ? .008 : 0) + .043*acting.jaw + .018*acting.smile :
      drawing.gap + (name === 'smile' ? .019 : 0) + .054*acting.jaw + .028*acting.smile;
    function seam(q) {
      const a = Math.min(1,Math.abs(q));
      if (softPixels) {
        const lift = name === 'smile' ? .105 : gentleSmile ? .085 : restingLift;
        if (guide.storybook) return -.010 + ((smiling ? .69 : .42)*lift+.058*acting.smile)*ramp(a,.18,.87);
        return -.016 + (lift+.041*acting.smile)*ramp(a,.18,.89);
      }
      return drawing.seam(a) * (.72+.28*guide.brush.corner) + (softProfile ? .036 : .061)*acting.smile*a*a;
    }
    function paint(lateral, h, k, pitch) {
      const q = lateral/width, a = Math.abs(q);
      if (a >= 1 || h < -.33 || h > .26) return 0;
      const y = h-seam(q);
      const taper = 1-ramp(a,.53,1);
      const end = softPixels ? 1-ramp(a,.68,.93) : softProfile ? 1-ramp(a,.62,.985) : 1;
      const line = guide.storybook ? clamp(1.30*pitch,.024,.055)
        : softPixels ? clamp(2.1*pitch,.034,.081) : .015+Math.min(.023,.56*pitch);
      const stroke = line * (.43+.57*taper)*end;
      const opening = gap * (1-a*a)**1.5*end;
      if (y < .48*stroke && y > -opening-.67*stroke) {
        if (opening > .061 && y < -.66*opening) return k.lipPetal;
        if (softProfile && a > (softPixels ? .58 : .46)) return a > (softPixels ? .80 : .76) ? k.lipCorner : k.upperLip;
        return a > .76 ? k.upperLip : k.lipLine;
      }
      if (y >= 0 && y < top*drawing.upper(a)*end)
        return softPixels ? (y > .54*top ? k.lipCorner : k.lipBody) : q < -.38 || a > .72 ? k.lipBody : k.upperLip;
      const lower = bottom*drawing.lower(a)*end*(softPixels ? 1.17 : 1);
      if (y < -opening && y > -opening-lower) {
        const depth = -(y+opening)/lower;
        if (q > -.53 && q < .16 && depth > .40 && depth < .82) return k.lipGlow;
        return depth > .32 ? k.lowerLip : k.lipBody;
      }
      return 0;
    }
    // Widen the central stroke vertically when the whole mouth spans only
    // a few screen pixels. Its ends still taper inside the same dental arch.
    function smallAccent(lateral,h) {
      const q = lateral/width, a = Math.abs(q);
      if (a >= 1 || h < -.39 || h > .20) return false;
      const y = h-seam(q), center = 1-ramp(a,.62,1);
      const opening = gap * (1-a*a)**1.5;
      return y > -opening-.18*center && y < .12*center;
    }
    // Once the jaws separate, locate each lip from its moving rim. The
    // actual opening already supplies its dark interior and tongue.
    function rim(q, distance, isUpper, k) {
      const a = Math.abs(q);
      if (a >= .99 || distance < 0) return 0;
      const taper = 1-ramp(a,.60,.99);
      const depth = (isUpper ? .78*top*drawing.upper(a) : .76*bottom*drawing.lower(a))*taper;
      if (distance >= depth) return 0;
      if (a > .75) return k.lipCorner;
      if (isUpper) return distance < .27*depth ? k.upperLip : k.lipBody;
      return q > -.50 && q < .18 && distance > .36*depth ? k.lipGlow : k.lowerLip;
    }
    function surroundingLight(lateral, h, noseBase) {
      const q = lateral/width;
      if (Math.abs(q) > 1.52 || h < -.26 || h > noseBase) return 0;
      // The mouth patch shares its landmarks with the skin between the nose
      // and chin. Leave the lit cheek open and turn the far corner into it.
      const upper = bell(q,-.22,.72)*bell(h,noseBase*.49,Math.max(.05,noseBase*.49));
      const corner = bell(q,.89,.45)*bell(h,drawing.seam(.88)-.014,.090);
      const under = bell(q,.14,.67)*bell(h,-bottom-.025,.062);
      const chin = bell(q,-.13,.83)*bell(h,-bottom-.136,.088);
      return softProfile ? .032*upper-.021*corner-.020*under+.019*chin : .038*upper-.049*corner-.044*under+.036*chin;
    }
    return {width,seam,paint,smallAccent,rim,surroundingLight};
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
  function skin(model, r, x, y, h, eye, infant, k, inks, painted, acting, oralLight = 0) {
    const a = Math.abs(y),
      side = x - r.axis;
    let noseLight = 0;
    if (model.storybook) {
      if (side > 0 && a < 1.15*model.noseWidth && h < eye) {
        const q = y/model.noseWidth, at = h-model.tip;
        const turn = .032*q*q + .014*q;
        const edge = at-turn;
        if (q > -.65 && q < .94 && edge < -.016 && edge > -.082+.020*Math.abs(q)) {
          return !infant && q > .39 && q < .77 && edge < -.042 ? k.nasalFold : k.nasalBase;
        }
        if (q > .26 && q < .89 && at > -.029 && at < (infant ? .075 : .127)*(1.14-q)) return k.nasalPlane;
        if (bell(q,-.24,.68)*bell(at,.018,.060) > .48) return k.nasalLight;
        const bridge = at/Math.max(.14,eye-model.tip);
        noseLight = -.18*bell(q,.57,.43)*bell(bridge,.28,.38);
      }
    } else if (model.softPixels) {
      // The septum stays lit between the two alae. In profile the visible
      // accent follows the underside of the round tip into the nearer wing.
      if (side > 0 && a < 1.12*model.noseWidth && h < eye && h > model.tip-.12) {
        const q = y/model.noseWidth, at = h-model.tip;
        const wing = bell(Math.abs(q),.64,.40)*bell(at,-.054+.035*q*q,.049);
        const ball = bell(q,-.22,.70)*bell(at,.020,.066);
        const base = bell(q,.18,.79)*bell(at,-.062+.037*q*q,.043);
        if (wing*(.86+.19*q) > (infant ? .74 : .55)) return k.nasalFold;
        if (ball > .47) return k.nasalLight;
        if (base*(.40+.65*Math.abs(q))+.32*wing > .40) return k.nasalBase;
        const bridge = (h-model.tip)/Math.max(.14,eye-model.tip);
        const plane = bell(q,.56-.18*bridge,.44)*bell(bridge,.25,.37);
        if (!infant && plane > .41) return k.nasalPlane;
        noseLight = (.12*ball - .18*wing - .075*base - .16*plane)*(infant ? .62 : 1);
      }
    } else if (side > 0 && model.infantNose) {
      const tip = h - model.tip, w = model.noseWidth;
      if (bell(a, w * .70, w * .34) * bell(tip, -.041, .030) > .29) return k[inks[17]];
      if (bell(y, w * .14, w * .93) * bell(tip, -.032, .038) > .35) return k[inks[19]];
      if (bell(y, -w * .22, w * .70) * bell(tip, .019, .036) > .29) return k[inks[8]];
    } else if (side > 0 && model.ink && a < model.noseWidth * 1.18) {
      const w = model.noseWidth, tip = h - model.tip;
      const q = y/w, bridge = (eye-h) / Math.max(.12,eye-model.tip);
      if (bell(a,w*.66,w*.34) * bell(tip,-.039,.035) > .29) return k[inks[16]];
      if (bell(y,w*.22,w*.98) * bell(tip,-.032,.050) > .21) return k[inks[17]];
      if (bridge > .26 && bridge < 1.06 && q > .19+.30*(1-bridge) && q < .35+.48*bridge)
        return k[inks[bridge > .70 ? 17 : 18]];
      if (bell(y,-w*.32,w*.76) * bell(tip,.031,.050) > .21) return k[inks[10]];
    } else if (side > 0 && a < model.noseWidth * 1.18) {
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
    if (model.ink) {
      const brush = brushes[model.ink];
      // The temple shadow descends beside the mouth. On the lit cheek a single
      // wedge meets the lower lid, leaving a quiet area around the lips.
      const wrap = .48*across + .30*(1-front) + .25*y + .12*under;
      const shadow = ramp(wrap, .32, .79);
      const z = h - eye + .25 - .14 * (a-.49);
      const malar = bell(a,.52,.39) * bell(z,0,.23) * front;
      const browLight = bell(y,-.22,.55) * bell(h,eye+.32,.33) * front;
      const ground = .53 + .11*turn*front - .054*y + .044*h - .12*under;
      let value = light*.47 + ground*.53 - brush.shadow*shadow + .080*browLight + (.060-.055*y)*malar + front*(oralLight+noseLight);
      if (model.softPixels) {
        const socket = bell(a,.43,.39)*bell(h,eye+.13,.20);
        value += front*(.055*malar-.099*socket) - .080*shadow;
      }
      let tone;
      if (brush === brushes.cel) tone = value < .37 ? 3 : value < .496 ? 5 : value < .615 ? 7 : 9;
      else if (brush === brushes.line) tone = value < .41 ? 4 : value < .55 ? 6 : value < .67 ? 8 : 9;
      else tone = clamp(Math.floor((value-.37)*13+4.5),4,9);
      let warm = malar*brush.warmth + shadow*.13;
      if (model.storybook) {
        // Tie the ear and far cheek to one shadow mass. A short diagonal
        // lower edge leads into the chin rather than outlining both cheeks.
        const boundary = .65-.29*ramp(-h,.17,.82);
        const sidePlane = ramp(across+.16*y+.22*(1-front),boundary,boundary+.24);
        value += .016*front - .078*sidePlane - .028*under;
        if (model.brimEdge) {
          const [height,reach] = model.brimEdge;
          const edge = height - .12 - .29*clamp(reach-x,0,.90) - .075*y;
          value -= .14*front*ramp(h,edge-.055,edge+.070);
        }
        tone = value < .402 ? 4 : value < .492 ? 5 : value < .555 ? 6 : value < .628 ? 7 : value < .705 ? 8 : 9;
        warm = .58*malar + .25*sidePlane;
      }
      return k[inks[tone + (warm > .48 ? 24 : warm > .19 ? 12 : 0)]];
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
  function palette(materials, swatches, tint, painted, ink) {
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
    if (ink) {
      // A cool reflected shadow and a warm light both start at the user's dye.
      // Keep the eye white, lip line and hair reflection in the same value range.
      for (let warmth=0; warmth<3; warmth++) for (let tone=3; tone<=9; tone++) {
        const key = 'skinPlane' + (warmth*12+tone);
        if (tone < 6) materials[key] = tint(materials[key], '54455a', (.048 + .010*dark) * (6-tone));
        if (tone > 7) materials[key] = tint(materials[key], 'ffdeba', (.079-.035*dark)*(tone-7));
      }
      materials.lipLine = tint(materials.lipLine, materials.upperLip, ink === 'wash' ? .38 : .18);
      materials.upperLip = tint(materials.upperLip, materials.skinPlane17, .23);
      materials.lipBody = tint(materials.lipBody, materials.skinPlane18, .26);
      materials.lowerLip = tint(materials.lowerLip, materials.skinPlane19, .31);
      materials.lipGlow = tint(materials.lowerLip, materials.lipGlow, ink === 'wash' ? .37 : .56);
    }
  }
  const cache = new Map();
  function model(base, shape, face, target, scalp, eye, mouth, nose, drawn = false, painted = false, infantProfile = false, infantChin = false, infantNose = false, ink, layout) {
    const key = JSON.stringify([base, shape, face.outline, face.nose, target, face.formMix ?? 1, eye, mouth, drawn, painted, infantProfile, infantChin, infantNose, ink, layout]);
    if (!cache.has(key)) {
      if (cache.size >= 8) cache.delete(cache.keys().next().value);
      cache.set(key, build(base, shape, face, target, scalp, eye, mouth, nose, drawn, painted, infantProfile, infantChin, infantNose, ink, layout));
    }
    return cache.get(key);
  }
  return { model, forms, baseForms, lipLift, chinShift, eye, lip, featureGuides, featureBrush, expression, paintedEye, paintedMouth, mouthBrush, skin, palette };
})();
