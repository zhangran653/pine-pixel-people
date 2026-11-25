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
  function build(base, shape, face, baseTarget, scalp, eye, mouth, noseRow) {
    const p = profiles[base],
      amount = limits[base],
      infant = base === 'baby';
    const [jawTarget, chinTarget, cheekTarget, lengthTarget] = targets[baseTarget || 'balanced'].map(
      (delta) => delta * (face.formMix ?? 1)
    );
    const value = (key) => shape[key] || 0;
    const mouthDepth = amount * 0.075 * value('lipProjection');
    const tipAt = clamp(0.58 + (noseRow[3] - 0.3) * 0.83, 0.48, 0.7);
    const reach =
      (infant ? 0.132 : base === 'adult' ? 0.205 : 0.166) *
      clamp(noseRow[2] / 0.19 + 0.32 * value('noseBridge'), 0.58, 1.5) *
      (0.85 + 0.15 * (shape.faceRelief ?? 1));
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
    const chinLift = { adult: 0.09, child: 0.069, toddler: 0.055, baby: 0.06 }[base];
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
      const cheek = bell(u, -0.21 + 0.1 * value('cheekHeight'), 0.36);
      const outline = pinePortraitStyles.outlines[face.outline];
      const width =
        p[0](u) *
        (1 +
          amount *
            (jaw * (jawTarget + 0.48 * ((shape.jaw ?? 1) - 1) + 0.32 * (outline?.[2] || 0)) +
              cheek * (0.056 * value('cheekWidth') + 0.21 * (outline?.[1] || 0)) +
              0.039 * value('cheekFullness') * bell(u, -0.43, 0.29) +
              0.032 * value('chinRoundness') * chin));
      const back =
        p[1](u) +
        amount * (0.105 * value('jawPosition') + 0.075 * value('jawNeck') + 0.073 * value('jawAngle')) * jaw;
      const axis = p[2](u) + amount * (0.05 * value('jawPosition') + 0.033 * value('jawDefinition')) * jaw;
      const mid = p[3](u) + (chinTarget - 0.026 + 0.105 * value('chinProjection')) * amount * chin;
      const cheekDepth = (cheekTarget + 0.055 * value('cheekProjection')) * amount * cheek;
      const turn = p[5](u) + cheekDepth - 0.043 * amount * value('jawDefinition') * jaw;
      const side = p[4](u) + cheekDepth + 0.031 * amount * value('chinProjection') * chin;
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
      const nose = noses(tipT) * reach;
      const wing = bell(tipT, 0.67, 0.19);
      const upper = bell(h, mouth + 0.04, 0.077),
        lower = bell(h, mouth - 0.043, 0.077);
      const fold = bell(h, mouth - 0.134, 0.07);
      // The dental arch turns gradually from the cheek to the chin. A short
      // horizontal indentation at lip height casts a moustache-shaped stripe.
      const oralArc = ramp(eye - h, 0.1, 0.46) * (1 - ramp(-h, 0.76, 0.99)) * (infant ? 0.105 : 0.155);
      const mouthBed =
        mouthDepth * bell(h, mouth, 0.19) +
        upper * (0.041 + 0.014 * value('upperLipFullness')) +
        lower * (0.053 + 0.018 * value('lowerLipFullness')) -
        0.024 * fold;
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
        let f =
          dome(v) +
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
        ring.face[j] = f * (1 - vault) + cap.face[j] * vault;
      }
      ring.fore = ring.face[0] - ring.axis;
      return ring;
    });
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
    return { row, insideSkin, frontAt, noseWidth, tip: eye - (eye - mouth) * tipAt, cheekCenter: -0.19 };
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
  function lip(name, params, v, h, infant, k, pitch) {
    const [, width, up, down, smile] = params,
      q = Math.abs(v) / (width * (infant ? 1.06 : 1.08));
    if (q >= 1) return 0;
    const curve = 1 - q * q,
      line = clamp(0.012 + pitch * 0.35, 0.014, 0.031);
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
  function skin(model, r, x, y, h, eye, infant, k, inks) {
    const a = Math.abs(y),
      side = x - r.axis;
    if (side > 0 && a < model.noseWidth * 1.18) {
      const tip = h - model.tip;
      const underWing = bell(a, 0.64 * model.noseWidth, 0.34 * model.noseWidth) * bell(tip, -0.034, 0.034);
      if (underWing > 0.59) return k.noseShade;
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
    const light =
      0.47 +
      (0.29 * turn + 0.046) * front -
      0.08 * across * across -
      0.16 * under +
      0.029 * h +
      0.05 * bell(a, 0.41, 0.43) * bell(h, eye - 0.22, 0.23) * front;
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
  function palette(materials, swatches, tint) {
    const rgb = [1, 3, 5].map((i) => parseInt(swatches.skin.slice(i, i + 2), 16));
    const dark = clamp((148 - (0.25 * rgb[0] + 0.58 * rgb[1] + 0.17 * rgb[2])) / 110, 0, 1);
    materials.sclera = tint(materials.sclera, 'cba58d', 0.16 + 0.34 * dark);
    materials.scleraShade = tint(materials.sclera, materials.faceMid, 0.17 + 0.16 * dark);
    materials.glint = tint(materials.glint, 'f5d9b6', 0.33 * dark);
    materials.eyes = tint(materials.eyes, materials.irisLight, 0.14 * dark);
    for (let warmth = 0; warmth < 4; warmth++) {
      for (let tone = 5; tone < 12; tone++) {
        const name = 'skinPlane' + (12 * warmth + tone);
        materials[name] = tint(materials[name], 'e8aa84', (0.078 * dark * (tone - 4)) / 7);
      }
    }
  }
  const cache = new Map();
  function model(base, shape, face, target, scalp, eye, mouth, nose) {
    const key = JSON.stringify([base, shape, face.outline, face.nose, target, face.formMix ?? 1, eye, mouth]);
    if (!cache.has(key)) {
      if (cache.size >= 8) cache.delete(cache.keys().next().value);
      cache.set(key, build(base, shape, face, target, scalp, eye, mouth, nose));
    }
    return cache.get(key);
  }
  return { model, forms, eye, lip, skin, palette };
})();
