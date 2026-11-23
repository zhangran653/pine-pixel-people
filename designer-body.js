// An editable body uses the same joint frames, material brushes and action sockets as the cast.
const pineDesignerBody = (() => {
  // Relative to the selected body. The editor, recipe validator and painter share these limits.
  const shapeRanges = {
    height: [0.75, 1.3, 1],
    shoulders: [0.7, 1.35, 1],
    arms: [0.8, 1.25, 1],
    legs: [0.8, 1.25, 1],
    faceWidth: [0.84, 1.16, 1],
    eyeSpacing: [0.8, 1.2, 1],
    jaw: [0.8, 1.2, 1],
    mouthHeight: [-1, 1, 0]
  };
  const defaults = {
    skin: '#d59773',
    hair: '#59413b',
    eyes: '#5d5142',
    top: '#528ba6',
    bottom: '#505e75',
    shoes: '#ae6752',
    accent: '#e6b963'
  };
  const dimensions = {
    child: {
      head: [0.38, 27.69, 3.98, 4.1, 4.89],
      eye: 28.37,
      mouth: 25.8,
      chin: 0.105,
      thigh: 2.16,
      knee: 1.69,
      ankle: 1.19,
      shoe: [2.65, 1.57],
      upper: 1.9,
      elbow: 1.48,
      cuff: 1.09,
      hand: 1.07,
      chest: 3.12,
      hips: 2.82
    },
    adult: {
      head: [0.55, 40.1, 4.9, 4.9, 5.82],
      eye: 40.85,
      mouth: 37.6,
      chin: 0.155,
      thigh: 2.7,
      knee: 2.13,
      ankle: 1.48,
      shoe: [3.42, 1.98],
      upper: 2.46,
      elbow: 1.94,
      cuff: 1.43,
      hand: 1.4,
      chest: 3.94,
      hips: 3.73
    }
  };
  // These are starting cuts. The shoulder and height controls still act on each cut.
  const torsoCuts = {
    original: {
      shoulderSpan: 1,
      shoulderLift: 0,
      shoulderSlope: 0.125,
      upperArm: 1,
      hipSpan: 1,
      hipAllowance: 0,
      hipDepth: 1,
      chestDepth: 1,
      waistAt: 0.31,
      waistInset: 0.105,
      waistDepthInset: 0,
      chestForward: 0
    },
    female: {
      shoulderSpan: 0.93,
      shoulderLift: -0.22,
      shoulderSlope: 0.17,
      upperArm: 0.96,
      hipSpan: 1.11,
      hipAllowance: 0.22,
      hipDepth: 1.055,
      chestDepth: 0.98,
      waistAt: 0.405,
      waistInset: 0.205,
      waistDepthInset: 0.095,
      chestForward: 0.24
    },
    male: {
      shoulderSpan: 1.105,
      shoulderLift: 0.18,
      shoulderSlope: 0.085,
      upperArm: 1.055,
      hipSpan: 0.94,
      hipAllowance: -0.13,
      hipDepth: 0.975,
      chestDepth: 1.075,
      waistAt: 0.325,
      waistInset: 0.071,
      waistDepthInset: 0.025,
      chestForward: 0.05
    }
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function measure(shape, key) {
    const [lo, hi, fallback] = shapeRanges[key];
    const value = shape[key];
    return Number.isFinite(value) ? clamp(value, lo, hi) : fallback;
  }
  function tint(color, target, amount) {
    let packed = 0;
    for (let i = 0; i < 6; i += 2) {
      const a = parseInt(color.slice(i, i + 2), 16),
        b = parseInt(target.slice(i, i + 2), 16);
      packed = packed * 256 + Math.round(a + (b - a) * amount);
    }
    return packed.toString(16).padStart(6, '0');
  }
  function palette(colors) {
    const base = {};
    for (const [key, fallback] of Object.entries(defaults)) {
      const value = colors?.[key];
      base[key] = (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback).slice(1);
    }
    const { skin, hair, eyes, top, bottom, shoes, accent } = base;
    return {
      ...base,
      skinLight: tint(skin, 'ffe8ca', 0.31),
      skinShade: tint(skin, '674047', 0.37),
      cheek: tint(skin, 'e88c78', 0.35),
      lips: tint(skin, '783e4b', 0.61),
      eyelid: tint(skin, '77494c', 0.47),
      eyeRim: tint(eyes, '202532', 0.6),
      eyeWhite: 'f2e5c9',
      hairLight: tint(hair, 'ccac81', 0.32),
      hairShade: tint(hair, '222638', 0.47),
      topLight: tint(top, 'f6e8cd', 0.3),
      topShade: tint(top, '344250', 0.36),
      topStitch: tint(top, '293145', 0.53),
      bottomLight: tint(bottom, 'e4d7c0', 0.28),
      bottomShade: tint(bottom, '212b3a', 0.48),
      shoeLight: tint(shoes, 'ede0be', 0.31),
      shoeShade: tint(shoes, '34313c', 0.47),
      trimLight: tint(accent, 'f7edce', 0.37),
      trimShade: tint(accent, '49424a', 0.39),
      rubber: 'e1ddc7',
      outsole: '776f68',
      hatMain: accent,
      hatLight: tint(accent, 'fff2d2', 0.36),
      hatShade: tint(accent, '474153', 0.38),
      hatTrim: tint(accent, '4c6472', 0.56),
      hatInk: tint(accent, '292a39', 0.69)
    };
  }

  function build(recipe, paintHat, hatPrimitives = []) {
    const kind = recipe.base === 'adult' ? 'adult' : 'child';
    const base = studioRig.profiles[kind],
      measures = dimensions[kind];
    const selectedCut = kind === 'adult' && (recipe.gender === 'female' || recipe.gender === 'male');
    const cut = selectedCut ? torsoCuts[recipe.gender] : torsoCuts.original;
    const shape = recipe.shape || {},
      parts = recipe.parts || {};
    const s = measure(shape, 'height'),
      shoulders = measure(shape, 'shoulders');
    const arms = measure(shape, 'arms'),
      legs = measure(shape, 'legs');
    const width = measure(shape, 'faceWidth'),
      spacing = measure(shape, 'eyeSpacing');
    const jaw = measure(shape, 'jaw'),
      mouthOffset = measure(shape, 'mouthHeight');
    const jeans = parts.bottom === 'trousers',
      boots = parts.shoes === 'boots';
    const skirt = parts.bottom === 'skirt',
      cargo = parts.bottom === 'cargo';
    const highTops = parts.shoes === 'high-tops',
      flats = parts.shoes === 'flats';
    const tee = parts.top === 'tee',
      hoodie = parts.top === 'hoodie',
      cardigan = parts.top === 'cardigan';
    const jacket = parts.top !== 'pullover' && !tee && !hoodie && !cardigan,
      scarf = parts.neck === 'scarf';
    const hairstyle = ['bob', 'bun', 'ponytail', 'twin-tails', 'braid', 'curly'].includes(parts.hair)
      ? parts.hair
      : 'crop';
    const hasHat = !!parts.hat && parts.hat !== 'none' && typeof paintHat === 'function';
    const ankle = base.ankle * s;
    const legChange = (base.hip[2] - base.ankle) * (legs - 1) * s;
    const hipBreadth = base.hip[1] * s * (1 + 0.17 * (shoulders - 1)) * cut.hipSpan;
    const rig = {
      height: base.height * s,
      ankle,
      hip: [base.hip[0] * s, hipBreadth, base.hip[2] * s + legChange],
      pelvis: [base.pelvis[0] * s, 0, base.pelvis[2] * s + legChange],
      shoulder: [
        base.shoulder[0] * s,
        base.shoulder[1] * s * shoulders * cut.shoulderSpan,
        base.shoulder[2] * s + 0.14 * legChange + cut.shoulderLift * s
      ],
      neck: base.neck.map((v) => v * s),
      mouth: null,
      thigh: base.thigh * s * legs,
      shin: base.shin * s * legs,
      upperArm: base.upperArm * s * arms,
      forearm: base.forearm * s * arms,
      palm: base.palm * s
    };
    const [cx, cz, rx, ry, rz] = measures.head;
    const fit = Object.freeze({
      x: cx * s,
      y: 0,
      z: cz * s,
      rx: rx * s * (1 + 0.12 * (width - 1)),
      ry: ry * s * width,
      rz: rz * s
    });
    const eyeY = fit.ry * 0.485 * spacing,
      eyeZ = measures.eye * s;
    // Narrow the lower half progressively. The jaw control changes the chin without moving the temples.
    const jawTaper = measures.chin - 0.86 * (jaw - 1);
    const jawWidth = (h) => fit.ry * (1 - jawTaper * clamp(-h, 0, 1));
    function faceFront(y, z) {
      const h = (z - fit.z) / fit.rz,
        v = y / jawWidth(h);
      return fit.x + fit.rx * Math.sqrt(Math.sqrt(Math.max(0, 1 - h * h - v * v * v * v)));
    }
    const mouthY = -0.062 * fit.ry,
      mouthZ = (measures.mouth + mouthOffset * (kind === 'child' ? 0.87 : 1.12)) * s;
    rig.mouth = [faceFront(mouthY, mouthZ) + 0.14 * s, mouthY, mouthZ];
    const eyeX = faceFront(eyeY, eyeZ);
    const socket = (frame, point) => ({ frame, point });
    const chestDepth = measures.chest * s * (1 + 0.19 * (shoulders - 1)) * cut.chestDepth;
    const hipHeight = measures.hips * s;
    const hipThickness = hipHeight * cut.hipDepth;
    const hipHalf = hipBreadth + measures.thigh * s * 0.76 + cut.hipAllowance * s;
    const sockets = {
      mouth: socket('head', rig.mouth),
      rightEye: socket('head', [eyeX, -eyeY, eyeZ]),
      leftEye: socket('head', [eyeX, eyeY, eyeZ]),
      seat: socket('torso', [rig.pelvis[0], 0, rig.pelvis[2] - 0.79 * hipHeight]),
      upperBack: socket('torso', [-0.89 * chestDepth, -0.15 * rig.shoulder[1], rig.shoulder[2] - 0.65 * s])
    };
    const materials = palette(recipe.colors);

    // The hem follows both upper legs. Its cross-section turns upward over bent
    // knees, and each half follows its own thigh during a running stride.
    function drawSkirt(pose, b, k, thigh) {
      const { legs: chains, torso } = pose;
      const up = [torso[2], torso[6], torso[10]];
      const left = [torso[1], torso[5], torso[9]];
      const kneeDrop = chains.reduce((sum, { hip, knee }) => sum + hip[2] - knee[2], 0) / (2 * rig.thigh);
      const seated = clamp((0.6 - kneeDrop) / 0.56, 0, 1);
      const hemReach = 0.86 + 0.16 * seated,
        drape = (0.15 + 0.13 * seated) * rig.thigh;
      const hem = chains.map(({ hip, knee }) =>
        hip.map((n, i) => n + hemReach * (knee[i] - n) - (i === 2 ? drape : 0))
      );
      const root = chains[0].hip.map((n, i) => (n + chains[1].hip[i]) * 0.5 + up[i] * 0.52 * thigh);
      const towardHem = hem[0].map((n, i) => (n + hem[1][i]) * 0.5 - root[i]);
      const length = Math.hypot(...towardHem) || 1;
      const down = towardHem.map((n) => n / length);
      const cross = (a, v) => [
        a[1] * v[2] - a[2] * v[1],
        a[2] * v[0] - a[0] * v[2],
        a[0] * v[1] - a[1] * v[0]
      ];
      const dot = (a, v) => a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
      const normal = cross(down, left),
        normalLength = Math.hypot(...normal) || 1;
      const front = normal.map((n) => n / normalLength);
      const side = cross(front, down);
      const gap = hem[1].map((n, i) => (n - hem[0][i]) * 0.5);
      const tilt = dot(gap, front),
        drop = dot(gap, down);
      const halfHips = hipHalf * 0.98;
      const halfHem = Math.max(hipHalf * 1.34, dot(gap, side) + 1.28 * thigh);
      const depthAtWaist = hipThickness * 0.96,
        depthAtHem = Math.max(1.24 * thigh, hipThickness * 1.04);
      const pad = Math.max(halfHem, depthAtHem) + 0.45 * s;
      const bounds = (axis) => [
        Math.min(root[axis], hem[0][axis], hem[1][axis]) - pad,
        Math.max(root[axis], hem[0][axis], hem[1][axis]) + pad
      ];
      b.stamp(...bounds(0), ...bounds(1), ...bounds(2), (x, y, z) => {
        const dx = x - root[0],
          dy = y - root[1],
          dz = z - root[2];
        const across = dx * side[0] + dy * side[1] + dz * side[2];
        if (Math.abs(across) > halfHem) return 0;
        const weight = clamp(across / Math.max(hipBreadth, s), -1, 1);
        const along =
          (dx * down[0] + dy * down[1] + dz * down[2]) / Math.max(0.4 * length, length + drop * weight);
        if (along < 0 || along > 1) return 0;
        const depth = depthAtWaist + (depthAtHem - depthAtWaist) * along;
        const u = (dx * front[0] + dy * front[1] + dz * front[2] - tilt * weight * along) / depth;
        const v = across / (halfHips + (halfHem - halfHips) * along);
        if (Math.abs(u) > 1 || Math.abs(v) > 1) return 0;
        const fold = Math.cos(12 * Math.atan2(v, u) + 0.2 * along);
        const rim = 1 - 0.048 * along * (1 + fold);
        if (Math.abs(u) ** 2.8 + Math.abs(v) ** 2.8 > rim ** 2.8 || along > 1 - 0.021 * (1 + fold)) return 0;
        if (along < 0.14 || along > 0.94) return k.bottomShade;
        if (along > 0.87 && along < 0.92) return k.bottomLight;
        return fold > 0.54 ? k.bottomShade : fold < -0.67 ? k.bottomLight : k.bottom;
      });
    }
    function drawLegs(pose, b, k) {
      const thigh = measures.thigh * s,
        kneeRadius = measures.knee * s,
        ankleRadius = measures.ankle * s;
      const shoeX = measures.shoe[0] * s,
        shoeY = measures.shoe[1] * s;
      b.frame(null);
      for (let i = 0; i < 2; i++) {
        const side = i ? 1 : -1,
          foot = pose.feet[i],
          { hip, knee } = pose.legs[i];
        if (cargo) {
          b.link(hip, knee, 1.11 * thigh, 1.13 * kneeRadius, 1, (t, u, v) => {
            if (t > 0.77 && u > 0.48 * kneeRadius) return k.bottomLight;
            return side * v < -0.69 * thigh ? k.bottomShade : k.bottom;
          });
          b.link(knee, foot, 1.14 * kneeRadius, 1.13 * ankleRadius, 0.98, (t, u, v) => {
            if (t > 0.84) return t > 0.92 ? k.bottomShade : k.bottomLight;
            if (t < 0.24 && u > 0.56 * kneeRadius) return k.bottomLight;
            return side * v < -0.72 * kneeRadius ? k.bottomShade : k.bottom;
          });
          const outward = [pose.torso[1], pose.torso[5], pose.torso[9]];
          const pocket = (t, offset) =>
            hip.map((v, j) => v + t * (knee[j] - v) + side * outward[j] * thigh * offset);
          b.link(pocket(0.33, 0.9), pocket(0.61, 0.88), 0.58 * thigh, 0.55 * thigh, 0.66, (t, u) =>
            t > 0.83 || u < -0.35 * thigh ? k.bottomShade : k.bottom
          );
          b.link(pocket(0.31, 0.98), pocket(0.4, 0.96), 0.62 * thigh, 0.58 * thigh, 0.58, (t) =>
            t > 0.73 ? k.bottomShade : k.bottomLight
          );
          b.blob(...pocket(0.385, 1.28), 0.14 * thigh, 0.105 * thigh, 0.16 * thigh, k.trimShade);
        } else if (skirt) {
          b.link(hip, knee, 0.82 * thigh, 0.87 * kneeRadius, 0.94, (t, u, v) =>
            side * v < -0.38 * thigh ? k.skin : k.skinLight
          );
          const lining = hip.map((n, j) => n + 0.36 * (knee[j] - n));
          b.link(hip, lining, 0.91 * thigh, 0.89 * thigh, 0.95, () => k.bottomShade);
          b.link(knee, foot, 0.88 * kneeRadius, 0.86 * ankleRadius, 0.91, (t, u, v) => {
            if (!flats && t > 0.68) return t < 0.76 ? k.accent : k.rubber;
            return side * v < -0.39 * kneeRadius ? k.skin : k.skinLight;
          });
        } else if (jeans) {
          b.link(hip, knee, thigh, kneeRadius, 0.95, (t, u, v) =>
            side * v > thigh * 0.48 && Math.abs(u - 0.05 * s) < 0.24 * s
              ? k.bottomLight
              : side * v < -0.82 * s
                ? k.bottomShade
                : k.bottom
          );
          b.link(knee, foot, kneeRadius, ankleRadius, 0.93, (t, u, v) =>
            t > 0.78 && t < 0.91 ? k.bottomLight : side * v < -0.65 * s ? k.bottomShade : k.bottom
          );
        } else {
          b.link(hip, knee, 0.79 * thigh, 0.9 * kneeRadius, 0.95, (t, u, v) =>
            side * v < -0.73 * s ? k.skin : k.skinLight
          );
          const hem = hip.map((v, j) => v + 0.71 * (knee[j] - v));
          b.link(hip, hem, 1.06 * thigh, 1.09 * kneeRadius, 1, (t, u, v) =>
            t > 0.81 ? k.bottomLight : side * v < -0.76 * s ? k.bottomShade : k.bottom
          );
          b.link(knee, foot, 0.91 * kneeRadius, ankleRadius, 0.94, (t, u, v) =>
            t > 0.62 ? k.rubber : t > 0.5 ? k.accent : side * v < -0.7 * s ? k.skin : k.skinLight
          );
        }
        const [x, y, z] = foot,
          floor = z - ankle;
        const dx = knee[0] - x,
          dz = knee[2] - z;
        const forward = 1 - 2 * clamp((dx / (Math.hypot(dx, dz) || 1) - 0.7) / 0.29, 0, 1);
        const toe = shoeX * 0.25 * forward,
          sh = ankle * (boots ? 0.73 : 0.64);
        if (highTops || flats) {
          const h = ankle * (flats ? 0.47 : 0.66),
            sx = shoeX * (flats ? 0.96 : 1.035);
          if (flats)
            b.blob(x + toe, y, floor + 0.51 * ankle, 0.85 * sx, 0.79 * shoeY, 0.5 * ankle, k.skinLight, 2.7);
          b.blob(
            x + toe,
            y,
            floor + h,
            sx,
            shoeY * (flats ? 0.96 : 1.035),
            h,
            (px, py, pz) => {
              const f = ((px - x - toe) * forward) / sx,
                across = (py - y) / shoeY,
                high = (pz - floor) / h;
              if (flats) {
                if (high < 0.27) return k.outsole;
                if (high > 0.7 && ((f + 0.11) / 0.67) ** 2 + (across / 0.75) ** 2 < 1) return 0;
                if (high > 0.62 && ((f + 0.11) / 0.73) ** 2 + (across / 0.85) ** 2 < 1) return k.shoeLight;
                return f < -0.59 ? k.shoeShade : k.shoes;
              }
              if (high < 0.22) return k.outsole;
              if (high < 0.66) return high > 0.4 && high < 0.51 ? k.shoeShade : k.rubber;
              if (f > 0.59) return k.rubber;
              return side * across < -0.55 ? k.shoeShade : k.shoes;
            },
            3.15
          );
          if (flats) {
            b.blob(
              x + toe + 0.12 * sx * forward,
              y,
              floor + 0.8 * ankle,
              0.16 * sx,
              0.85 * shoeY,
              0.2 * ankle,
              k.shoes,
              3.5
            );
            b.blob(
              x + toe + 0.11 * sx * forward,
              y + side * 0.78 * shoeY,
              floor + 0.81 * ankle,
              0.14 * sx,
              0.12 * shoeY,
              0.14 * ankle,
              k.accent
            );
          } else {
            const shaft = foot.map((v, j) => v + 0.42 * (knee[j] - v));
            b.link(shaft, foot, 1.2 * ankleRadius, 1.15 * ankleRadius, 1, (t, u, v) => {
              if (t < 0.13) return k.shoeShade;
              if (t < 0.23) return k.shoeLight;
              if (u * forward > 0.35 * ankleRadius) {
                const lace = t * 3.9 + (0.29 * Math.abs(v)) / ankleRadius;
                return Math.abs(lace - Math.round(lace)) < 0.18 ? k.rubber : k.shoeShade;
              }
              return side * v < -0.56 * ankleRadius ? k.shoeShade : k.shoes;
            });
            const patch = foot.map((v, j) => v + 0.24 * (knee[j] - v));
            b.blob(
              patch[0],
              patch[1] + side * 1.09 * ankleRadius,
              patch[2],
              0.51 * ankleRadius,
              0.22 * ankleRadius,
              0.49 * ankleRadius,
              (px, py, pz) =>
                Math.abs(px - patch[0]) + Math.abs(pz - patch[2]) < 0.36 * ankleRadius ? k.accent : k.rubber
            );
          }
          continue;
        }
        b.blob(
          x + toe,
          y,
          floor + sh,
          shoeX,
          shoeY,
          sh,
          (px, py, h) => {
            const front = ((px - x - toe) * forward) / shoeX,
              outer = (side * (py - y)) / shoeY,
              high = (h - floor) / sh;
            if (high < 0.28) return boots ? k.outsole : k.rubber;
            if (high < 0.53) return boots ? k.shoeShade : k.rubber;
            if (boots) return front > 0.66 ? k.shoeLight : front < -0.66 ? k.shoeShade : k.shoes;
            if (outer > 0.42 && Math.abs(front + 0.13) < 0.32 && high > 0.78) return k.accent;
            return front > 0.67 ? k.shoeLight : k.shoes;
          },
          3.25
        );
        const shaft = foot.map((v, j) => v + (boots ? 0.38 : 0.1) * (knee[j] - v));
        b.link(shaft, foot, ankleRadius * (boots ? 1.25 : 1.12), ankleRadius * 1.1, 1, (t, u, v) => {
          if (boots && t < 0.17) return k.shoeLight;
          if (u > 0.39 * ankleRadius && Math.abs(t * 2.85 - Math.round(t * 2.85) - (0.15 * v) / s) < 0.17)
            return k.rubber;
          return u < -0.46 * s ? k.shoeShade : k.shoes;
        });
      }
      if (skirt) drawSkirt(pose, b, k, thigh);
    }
    function drawArms(pose, b, k) {
      const breadth = s * (1 + 0.31 * (shoulders - 1)) * cut.upperArm,
        upper = measures.upper * breadth;
      const elbowR = measures.elbow * breadth,
        cuff = measures.cuff * s,
        palm = measures.hand * s;
      b.frame(null);
      for (const { side, shoulder, elbow, wrist, hand } of pose.arms) {
        if (tee) {
          b.link(shoulder, elbow, upper * 0.85, elbowR * 0.82, 0.91, (t, u, v) =>
            side * v < -0.43 * elbowR ? k.skin : k.skinLight
          );
          b.link(elbow, wrist, elbowR * 0.83, cuff * 0.82, 0.91, (t, u, v) =>
            side * v < -0.43 * cuff ? k.skin : k.skinLight
          );
          const hem = shoulder.map((v, i) => v + 0.44 * (elbow[i] - v));
          b.link(shoulder, hem, upper * 1.06, elbowR * 1.11, 0.99, (t, u, v) => {
            if (t > 0.8) return t > 0.92 ? k.topShade : k.topLight;
            return side * v < -0.56 * elbowR ? k.topShade : k.top;
          });
        } else if (hoodie || cardigan) {
          b.link(
            shoulder,
            elbow,
            upper * (hoodie ? 1.1 : 1.02),
            elbowR * (hoodie ? 1.12 : 1.0),
            0.98,
            (t, u, v) => {
              if (hoodie && t < 0.25 && side * v > 0.18 * upper) return k.topLight;
              return side * v < -0.55 * elbowR ? k.topShade : k.top;
            }
          );
          b.link(
            elbow,
            wrist,
            elbowR * (hoodie ? 1.13 : 1.01),
            cuff * (hoodie ? 1.06 : 0.98),
            0.98,
            (t, u, v) => {
              if (t > 0.72) {
                if (t < 0.79 || Math.abs(u - 0.06 * s) < 0.2 * s) return k.topLight;
                return k.topShade;
              }
              return side * v < -0.48 * elbowR ? k.topShade : k.top;
            }
          );
        } else {
          b.link(shoulder, elbow, upper, elbowR, 0.95, (t, u, v) => {
            if (!jacket && t > 0.4 && t < 0.59) return k.accent;
            if (jacket && t < 0.25) return k.topLight;
            return side * v < -0.74 * s ? k.topShade : k.top;
          });
          b.link(elbow, wrist, elbowR, cuff, 0.93, (t, u, v) =>
            t > 0.77 ? (jacket ? k.topStitch : k.topShade) : side * v < -0.69 * s ? k.topShade : k.top
          );
        }
        const length = Math.hypot(...hand.map((v, j) => v - wrist[j])) || 1;
        const axis = hand.map((v, j) => (v - wrist[j]) / length);
        const near = hand.map((v, j) => v - 0.39 * palm * axis[j]),
          far = hand.map((v, j) => v + 0.34 * palm * axis[j]);
        b.link(near, far, palm, palm * 0.87, 0.86, (t, u, v) => (side * v > 0.1 * s ? k.skinLight : k.skin));
        b.blob(
          hand[0] + 0.44 * palm,
          hand[1] - 0.5 * palm * side,
          hand[2] + 0.17 * palm,
          0.51 * palm,
          0.46 * palm,
          0.61 * palm,
          k.skinLight
        );
      }
    }
    function drawTorso(pose, b, k) {
      b.frame(pose.torso);
      const low = rig.pelvis[2] - hipHeight * 0.47 - (hoodie ? 0.42 * s : cardigan ? 0.52 * s : 0),
        high = rig.neck[2] - 0.1 * s,
        tall = high - low;
      const ease = hoodie ? 1.085 : cardigan ? 1.025 : 1;
      const broad = rig.shoulder[1] * 1.06,
        maxW = Math.max(hipHalf * 1.11, broad) * 1.05 * ease;
      const fittedDepth = ease * Math.max(chestDepth * 1.28, hipThickness + 0.77 * s);
      const back = selectedCut ? -fittedDepth : -1.14 * chestDepth;
      const front = selectedCut ? fittedDepth : 1.19 * chestDepth;
      b.blob(
        rig.pelvis[0],
        0,
        rig.pelvis[2],
        hipThickness,
        hipHalf,
        0.79 * hipHeight,
        (x, y, z) =>
          z > rig.pelvis[2] + 0.42 * hipHeight
            ? k.bottomShade
            : x < -s && Math.abs(y) > hipBreadth * 0.65
              ? k.bottomLight
              : k.bottom,
        2.7
      );
      b.stamp(back, front, -maxW, maxW, low, high, (x, y, z) => {
        const t = (z - low) / tall,
          w = hipHalf * (1 - t) + broad * t;
        const waistWeight = Math.max(0, 1 - Math.abs(t - cut.waistAt) / 0.34);
        const waist = w * (1 - cut.waistInset * waistWeight);
        const easeOverHips = clamp((0.34 - t) / 0.13, 0, 1);
        const widthAt = (waist + easeOverHips * Math.max(0, hipHalf + 0.29 * s - waist)) * ease;
        const chest = chestDepth * (0.92 + 0.08 * t);
        const depth =
          (chest + easeOverHips * Math.max(0, hipThickness - rig.pelvis[0] + 0.34 * s - chest)) *
          ease *
          (1 - cut.waistDepthInset * waistWeight);
        const ribWeight = Math.max(0, 1 - Math.abs(t - 0.67) / 0.29);
        const v = y / widthAt,
          u = (x - 0.07 * s - cut.chestForward * s * ribWeight) / depth;
        const u2 = u * u,
          v2 = v * v;
        if (t < 0 || t > 1 - cut.shoulderSlope * v2 || u2 * u2 + v2 * v2 > 1) return 0;
        const a = Math.abs(v);
        if (tee) {
          const crew = 0.852 + 0.37 * a * a;
          if (u > 0.44 && a < 0.6 && t > crew) return t < crew + 0.052 ? k.topStitch : k.skin;
          if (t < 0.05 || (t < 0.079 && u < -0.25)) return k.topShade;
          return u < -0.54 || a > 0.9 ? k.topShade : k.top;
        }
        if (hoodie) {
          if (t < 0.13)
            return t > 0.102 || (a > 0.15 && Math.floor(a * 12) % 3 === 0) ? k.topLight : k.topShade;
          if (a > 0.65 && t > 0.52 && Math.abs(t - (1.09 - 0.44 * a)) < 0.029) return k.topShade;
          return u < -0.55 ? k.topShade : k.top;
        }
        if (cardigan) {
          const edge = 0.048 + 0.56 * clamp((t - 0.42) / 0.57, 0, 1);
          if (u > 0.27 && a < edge + 0.079) {
            if (a >= edge) return k.topLight;
            if (t < 0.44) return k.topShade;
            if (a < 0.33 && t > 0.81 + 0.35 * a) return k.skinLight;
            return k.rubber;
          }
          if (t < 0.11) return t > 0.08 ? k.topLight : k.topShade;
          return u < -0.47 || a > 0.88 ? k.topShade : k.top;
        }
        if (t < 0.066) return k.topShade;
        if (jacket) {
          if (u > 0.39 && a < 0.06) return k.trimLight;
          if (u > 0.45 && a > 0.38 && a < 0.79 && Math.abs(t - (0.29 + 0.17 * (a - 0.38))) < 0.026)
            return k.topStitch;
          if (Math.abs(t - (0.72 - 0.1 * a)) < 0.021) return k.topShade;
          if (u < -0.46 && t > 0.7) return k.topShade;
          return t > 0.69 && u > -0.14 ? k.topLight : u < -0.66 ? k.topShade : k.top;
        }
        if (t > 0.55 && t < 0.64) return k.accent;
        if (t > 0.49 && t < 0.52) return k.trimLight;
        if (t < 0.14 && a > 0.18 && Math.floor(a * 14) % 2 === 0) return k.topShade;
        return u < -0.62 ? k.topShade : k.top;
      });
      if (tee) {
        // A small stitched chest pocket also gives the tee an asymmetric side view.
        const px = 0.89 * chestDepth,
          py = 0.4 * broad,
          pz = low + 0.6 * tall;
        b.blob(
          px,
          py,
          pz,
          0.19 * chestDepth,
          0.22 * broad,
          0.098 * tall,
          (x, y, z) => {
            if (z > pz + 0.049 * tall) return k.topLight;
            return z < pz - 0.061 * tall || Math.abs(y - py) > 0.165 * broad ? k.topShade : k.top;
          },
          3.7
        );
      } else if (hoodie) {
        const hoodZ = high - 0.105 * tall;
        b.blob(
          -0.88 * chestDepth,
          0,
          hoodZ,
          0.86 * chestDepth,
          0.83 * broad,
          0.216 * tall,
          (x, y, z) => {
            const v = Math.abs(y) / (0.83 * broad),
              h = (z - hoodZ) / (0.216 * tall);
            const opening = -0.29 + 1.1 * v * v;
            if (x < -0.67 * chestDepth && v < 0.85 && h > opening)
              return h < opening + 0.21 ? k.topLight : k.topStitch;
            if (x < -1.02 * chestDepth && v < 0.072 && h < opening) return k.topShade;
            return h > 0.64 ? k.topLight : k.top;
          },
          2.55
        );
        // The pocket narrows toward its top and has two inset diagonal hand openings.
        b.stamp(
          0.66 * chestDepth,
          1.27 * chestDepth,
          -0.76 * broad,
          0.76 * broad,
          low + 0.13 * tall,
          low + 0.46 * tall,
          (x, y, z) => {
            const h = ((z - low) / tall - 0.13) / 0.33,
              width = broad * (0.735 - 0.24 * h),
              a = Math.abs(y) / width;
            const front = chestDepth * (1.17 - 0.095 * a * a + 0.055 * Math.sin(Math.PI * h));
            if (h < 0 || h > 1 || a > 1 || x > front) return 0;
            if (h < 0.15 || (h > 0.93 && a < 0.79)) return k.topShade;
            if (a > 0.79 && h > 0.21) return a > 0.91 ? k.topLight : k.topStitch;
            return k.top;
          }
        );
        for (const side of [-1, 1]) {
          b.blob(
            0.79 * chestDepth,
            side * 0.29 * broad,
            high - 0.076 * tall,
            0.36 * chestDepth,
            0.32 * broad,
            0.065 * tall,
            (px, py, pz) => (pz > high - 0.054 * tall ? k.topLight : k.topShade),
            3
          );
          const start = [1.105 * chestDepth, side * 0.3 * broad, high - 0.09 * tall];
          const end = [
            1.15 * chestDepth,
            side * (side === 1 ? 0.21 : 0.27) * broad,
            low + (side === 1 ? 0.6 : 0.64) * tall
          ];
          b.link(start, end, 0.31 * s, 0.29 * s, 1, (t) => (t > 0.84 ? k.accent : k.rubber));
          b.blob(...end, 0.33 * s, 0.31 * s, 0.42 * s, k.trimShade);
        }
      } else if (cardigan) {
        for (const side of [-1, 1]) {
          const start = [0.95 * chestDepth, side * 0.57 * broad, high - 0.04 * tall];
          const join = [1.02 * chestDepth, side * 0.095 * broad, low + 0.43 * tall];
          b.link(start, join, 0.37 * s, 0.33 * s, 1, (t, u, v) =>
            side * v > 0.12 * s ? k.topLight : k.topShade
          );
          const y = side * 0.54 * broad,
            z = low + 0.245 * tall;
          b.blob(
            0.91 * chestDepth,
            y,
            z,
            0.17 * chestDepth,
            0.205 * broad,
            0.084 * tall,
            (px, py, pz) => (pz > z + 0.04 * tall ? k.topLight : k.topShade),
            3.7
          );
        }
        for (const level of [0.16, 0.29, 0.42]) {
          b.blob(
            1.0 * chestDepth,
            0.035 * broad,
            low + level * tall,
            0.13 * chestDepth,
            0.093 * broad,
            0.034 * tall,
            (x, y, z) => (x > 1.035 * chestDepth ? k.trimLight : k.trimShade),
            2.4
          );
        }
      } else if (jacket) {
        b.blob(
          -0.7 * chestDepth,
          0,
          high - 0.17 * tall,
          0.67 * chestDepth,
          broad * 0.77,
          0.18 * tall,
          (x, y, z) =>
            z > high - 0.095 * tall ? k.accent : x < -0.96 * chestDepth ? k.topLight : k.topShade,
          2.7
        );
        b.blob(
          0.96 * chestDepth,
          -0.17 * broad,
          low + 0.65 * tall,
          0.18 * chestDepth,
          0.1 * broad,
          0.045 * tall,
          k.accent,
          2.5
        );
      }
      b.blob(rig.neck[0], 0, rig.neck[2], fit.rx * 0.397, fit.ry * 0.41, fit.rz * 0.235, k.skin, 2.3);
      if (parts.neck === 'bow') {
        const mid = high - 0.07 * tall,
          wing = 0.48 * broad;
        b.blob(0.17 * chestDepth, 0, mid, 0.77 * chestDepth, 0.58 * broad, 0.047 * tall, k.trimShade, 2.9);
        b.stamp(
          0.69 * chestDepth,
          1.27 * chestDepth,
          -wing,
          wing,
          mid - 0.113 * tall,
          mid + 0.113 * tall,
          (x, y, z) => {
            const v = Math.abs(y) / wing,
              h = (z - mid) / (0.113 * tall);
            if (v < 0.11 || v > 1 || Math.abs(h) > 0.28 + 0.72 * v || x > (1.2 - 0.19 * v) * chestDepth)
              return 0;
            if (Math.abs(h - (y > 0 ? 0.2 : -0.2) * v) < 0.13 && v < 0.79) return k.trimShade;
            return h > 0.53 ? k.trimLight : k.accent;
          }
        );
        b.blob(
          1.15 * chestDepth,
          0,
          mid,
          0.18 * chestDepth,
          0.14 * broad,
          0.076 * tall,
          (x, y, z) => (z > mid + 0.027 * tall ? k.trimLight : k.accent),
          3.35
        );
      } else if (scarf) {
        const knotZ = rig.neck[2] - 0.11 * fit.rz;
        b.blob(
          0.11 * chestDepth,
          0,
          knotZ,
          chestDepth * 0.86,
          broad * 0.72,
          fit.rz * 0.27,
          (x, y, z) =>
            z > knotZ + 0.08 * fit.rz ? k.trimLight : x < -0.35 * chestDepth ? k.trimShade : k.accent,
          2.7
        );
        b.stamp(
          0.62 * chestDepth,
          1.14 * chestDepth,
          -0.37 * broad,
          0.18 * broad,
          knotZ - 0.26 * tall,
          knotZ,
          (x, y, z) => {
            const t = (z - knotZ) / (0.26 * tall) + 1,
              at = (-0.27 + 0.18 * t) * broad;
            if (
              Math.abs(y - at) > (0.025 + 0.17 * t) * broad ||
              x > (0.96 + 0.14 * t) * chestDepth ||
              x < 0.75 * chestDepth
            )
              return 0;
            return Math.abs(y - at - 0.05 * broad) < 0.04 * broad ? k.trimLight : k.accent;
          }
        );
      }
    }
    function drawTiedHair(b, k) {
      const { x, z, rx, ry, rz } = fit;
      const at = (u, v, h) => [x + rx * u, ry * v, z + rz * h];
      if (hairstyle === 'ponytail') {
        const start = hasHat ? 0.16 : 0.53;
        const tie = at(-0.95, 0.06, start),
          turn = at(-1.35, 0.14, start - 0.18);
        const mid = at(-1.52, 0.24, -0.5),
          end = at(-1.38, 0.35, -1.32);
        const strand = (t, u, v) =>
          Math.abs(v + 0.04 * ry - 0.1 * t * ry) < 0.061 * ry
            ? k.hairLight
            : u < -0.08 * rx
              ? k.hairShade
              : k.hair;
        b.link(tie, turn, 0.25 * rx, 0.37 * rx, 1.19, strand);
        b.link(turn, mid, 0.37 * rx, 0.32 * rx, 1.16, strand);
        b.link(mid, end, 0.32 * rx, 0.085 * rx, 1.1, strand);
        b.blob(...tie, 0.17 * rx, 0.36 * ry, 0.29 * rz, k.accent, 2.6);
      } else if (hairstyle === 'twin-tails') {
        for (const side of [-1, 1]) {
          const start = hasHat ? 0.06 : 0.32,
            tie = at(-0.54, side * 0.91, start);
          const high = at(-0.66, side * 1.25, start - 0.06),
            low = at(-0.8, side * 1.42, -0.5);
          const tip = at(-0.66, side * 1.32, -1.12);
          const strand = (t, u, v) =>
            Math.abs(u + 0.035 * rx) < 0.055 * rx ? k.hairLight : side * v > 0.09 * ry ? k.hairShade : k.hair;
          b.link(tie, high, 0.21 * rx, 0.28 * rx, 1.03, strand);
          b.link(high, low, 0.28 * rx, 0.245 * rx, 1.06, strand);
          b.link(low, tip, 0.245 * rx, 0.075 * rx, 1.02, strand);
          b.blob(...tie, 0.275 * rx, 0.17 * ry, 0.205 * rz, k.accent, 2.6);
        }
      } else if (hairstyle === 'braid') {
        // Alternating lobes cross at the nape. A small bow separates the plait from its loose end.
        for (let i = 0; i < 6; i++) {
          const t = i / 5,
            side = i % 2 ? 1 : -1,
            taper = 1 - 0.38 * t;
          const p = at(-0.85 - 0.4 * t, 0.12 + 0.32 * t + side * 0.135 * taper, -0.12 - 1.29 * t);
          b.blob(
            ...p,
            0.34 * rx * taper,
            0.36 * ry * taper,
            0.3 * rz * taper,
            (px, py, pz) => {
              const ridge = (py - p[1]) / ry - (side * 0.65 * (pz - p[2])) / rz;
              return Math.abs(ridge) < 0.075 * taper ? k.hairLight : px < p[0] ? k.hairShade : k.hair;
            },
            2.45
          );
        }
        b.blob(...at(-1.25, 0.48, -1.55), 0.18 * rx, 0.2 * ry, 0.105 * rz, k.accent, 2.8);
        b.blob(...at(-1.26, 0.52, -1.74), 0.17 * rx, 0.18 * ry, 0.22 * rz, k.hair);
      }
    }

    function drawCurls(b, k) {
      const { x, z, rx, ry, rz } = fit;
      // The lower ring remains visible under a hat. Curls at the temples frame the eyes.
      const rings = hasHat
        ? [[10, 0.1, 0.97, 0.215]]
        : [
            [10, 0.31, 0.97, 0.28],
            [8, 0.7, 0.79, 0.3],
            [6, 1.0, 0.43, 0.25]
          ];
      for (let row = 0; row < rings.length; row++) {
        const [count, h, r, size] = rings[row];
        for (let i = 0; i < count; i++) {
          const angle = (2 * Math.PI * (i + 0.39 * row)) / count,
            u = Math.cos(angle),
            v = Math.sin(angle);
          if (hasHat && u > 0.48) continue;
          const cx = x + r * rx * u,
            cy = r * ry * v;
          const cz =
            z + rz * (h + (row === 0 ? 0.23 * Math.max(0, u) - 0.26 * Math.max(0, -u) : 0) + 0.042 * (i % 3));
          const q = size * (0.91 + 0.075 * (i % 3));
          b.blob(
            cx,
            cy,
            cz,
            rx * q,
            ry * q,
            rz * q,
            (px, py, pz) => {
              const light = (py - cy) / ry + (0.54 * (pz - cz)) / rz;
              if ((i + row) % 3 !== 0 && light > 0.25 * q && light < 0.54 * q && pz > cz - 0.08 * rz)
                return k.hairLight;
              return px < cx - 0.1 * q * rx || pz < cz - 0.37 * q * rz ? k.hairShade : k.hair;
            },
            2.18
          );
        }
      }
    }
    function drawHead(pose, b, k) {
      b.frame(pose.head);
      const { x: cx, z: cz, rx, ry, rz } = fit;
      const blink = clamp(pose.blink || 0, 0, 1),
        eyeHalf = ry * 0.22;
      const face = recipe.face || {};
      const eyes = face.eyes || 'classic',
        brows = face.brows || 'classic';
      const nose = face.nose || 'classic',
        mouth = face.mouth || 'classic';
      function eyebrowInk(off, z) {
        if (brows === 'classic') {
          return Math.abs(off) < eyeHalf && Math.abs(z - (eyeZ + 0.202 * rz + 0.112 * off)) < 0.046 * rz
            ? k.hairShade
            : 0;
        }
        const q = off / (ry * (brows === 'straight' ? 0.341 : 0.29)),
          a = Math.abs(q);
        if (a > 1) return 0;
        let mid, half;
        if (brows === 'arched') {
          mid = 0.136 + 0.236 * Math.max(0, 1 - Math.abs(q - 0.09));
          half = 0.075 * (1 - 0.16 * a);
        } else if (brows === 'thick') {
          mid = 0.19 + 0.041 * q;
          half = 0.127 - 0.042 * a * a;
        } else {
          mid = 0.189;
          half = 0.07 * (1 - 0.12 * a);
        }
        const d = (z - eyeZ) / rz - mid;
        if (Math.abs(d) > half) return 0;
        if (brows === 'straight') return d > 0.008 || a > 0.84 ? k.hair : k.hairShade;
        return brows === 'thick' && d > half * 0.42 ? k.hair : k.hairShade;
      }
      function eyeInk(off, z) {
        if (eyes === 'classic') {
          if (Math.abs(off) >= eyeHalf) return 0;
          const bottom = eyeZ - 0.105 * rz;
          if (z > bottom && z < bottom + 0.213 * rz * (1 - blink)) {
            if (Math.abs(off) < 0.12 * ry) return z > eyeZ + 0.047 * rz ? k.eyeRim : k.eyes;
            return k.eyeWhite;
          }
          return blink > 0.55 && Math.abs(z - bottom - 0.029 * rz) < 0.044 * rz ? k.eyelid : 0;
        }
        const round = eyes === 'round',
          narrow = eyes === 'narrow';
        const q = off / (ry * (round ? 0.243 : narrow ? 0.255 : 0.291)),
          a = Math.abs(q);
        if (a > 1) return 0;
        const center = eyeZ + (round ? 0 : narrow ? 0.13 * off : 0.22 * off) - 0.095 * rz * blink;
        const h = (z - center) / rz,
          open = 1 - blink;
        if (blink > 0.8) return Math.abs(h + 0.015 * (1 - q * q)) < 0.055 ? k.eyelid : 0;
        const curve = round ? Math.sqrt(1 - q * q) : 1 - (narrow ? 0.67 : 0.95) * q * q;
        const top = (round ? 0.203 : narrow ? 0.068 : 0.157) * curve * open;
        const bottom = (round ? 0.196 : narrow ? 0.065 : 0.126) * curve * open;
        if (h > top || h < -bottom) return 0;
        if ((h > top - 0.026 && a < 0.96) || (!round && !narrow && q > 0.48 && h > top - 0.06))
          return k.eyeRim;
        if (a > (round ? 0.7 : narrow ? 0.63 : 0.6)) return k.eyeWhite;
        if (round && q < -0.1 && q > -0.43 && h > 0.037 && h < 0.114) return k.eyeWhite;
        return a < 0.22 && h > 0.014 ? k.eyeRim : k.eyes;
      }
      function lipInk(y, z) {
        const a = Math.abs(y - mouthY) / ry,
          h = (z - mouthZ) / rz;
        if (mouth === 'smile') {
          const q = a / 0.292,
            d = h - 0.17 * q * q;
          if (q < 1 && Math.abs(d) < 0.069 * (1 - 0.25 * q)) return k.lips;
          return q < 0.7 && d < 0 && d > -0.112 * (1 - q * q) ? k.cheek : 0;
        }
        if (mouth === 'full') {
          const q = a / 0.273,
            curve = 1 - q * q * q * q;
          if (
            q >= 1 ||
            h < -0.134 * curve ||
            h > (0.099 + 0.044 * Math.max(0, 1 - Math.abs(q - 0.39) * 2.8)) * curve
          )
            return 0;
          return h > -0.043 * curve ? k.lips : k.cheek;
        }
        if (mouth === 'small') {
          const q = a / 0.126;
          return q < 1 && Math.abs(h) < 0.077 * (1 - 0.3 * q * q) ? k.lips : 0;
        }
        return a < 0.19 && Math.abs(h) < 0.068 ? k.lips : 0;
      }
      b.stamp(cx - rx, cx + rx, -1.075 * ry, 1.075 * ry, cz - rz, cz + rz, (x, y, z) => {
        const h = (z - cz) / rz,
          u = (x - cx) / rx,
          v = y / jawWidth(h),
          u2 = u * u,
          v2 = v * v;
        if (u2 * u2 + v2 * v2 + h * h > 1) return 0;
        const a = Math.abs(y),
          off = a - eyeY;
        if (u > 0.49 && Math.abs(off) < 0.345 * ry) {
          const color = eyebrowInk(off, z) || eyeInk(off, z);
          if (color) return color;
        }
        if (u > 0.64) {
          if (mouth === 'classic') {
            if (Math.abs(y - mouthY) < 0.19 * ry && Math.abs(z - mouthZ) < 0.068 * rz) return k.lips;
          } else {
            const color = lipInk(y, z);
            if (color) return color;
          }
        }
        if (u > 0.47 && a > ry * 0.64 && z > mouthZ + 0.09 * rz && z < eyeZ - 0.11 * rz) return k.cheek;
        if (h > 0.63 || (u < -0.52 && h > -0.6)) return k.hair;
        return u > 0.4 ? k.skinLight : h < -0.42 ? k.skinShade : k.skin;
      });
      for (const side of [-1, 1]) {
        b.blob(
          cx - 0.08 * rx,
          side * (0.966 * ry),
          cz - 0.08 * rz,
          0.225 * rx,
          0.2 * ry,
          0.24 * rz,
          (x, y, z) => (x < cx && z < cz ? k.skinShade : k.skinLight)
        );
      }
      const noseZ = eyeZ - 0.205 * rz,
        noseX = faceFront(0, noseZ) - 0.1 * rx;
      if (nose === 'button') {
        b.blob(
          noseX + 0.067 * rx,
          0,
          noseZ - 0.059 * rz,
          0.213 * rx,
          0.207 * ry,
          0.147 * rz,
          (x, y, z) => {
            if (z < noseZ - 0.105 * rz) return k.skinShade;
            return Math.abs(y) < 0.109 * ry && z > noseZ - 0.03 * rz ? k.skinLight : k.cheek;
          },
          2.2
        );
      } else if (nose === 'bridge') {
        b.blob(
          noseX - 0.055 * rx,
          0,
          noseZ + 0.099 * rz,
          0.256 * rx,
          0.119 * ry,
          0.332 * rz,
          (x, y, z) => (y > 0.054 * ry ? k.skinShade : y < -0.065 * ry ? k.skin : k.skinLight),
          2.45
        );
        b.blob(
          noseX + 0.105 * rx,
          0,
          noseZ - 0.046 * rz,
          0.263 * rx,
          0.156 * ry,
          0.147 * rz,
          (x, y, z) => (z > noseZ - 0.081 * rz ? k.skinLight : k.skinShade),
          2.25
        );
      } else if (nose === 'wide') {
        b.blob(
          noseX + 0.006 * rx,
          0,
          noseZ,
          0.244 * rx,
          0.292 * ry,
          0.151 * rz,
          (x, y, z) => {
            if (z < noseZ - 0.032 * rz && Math.abs(Math.abs(y) - 0.156 * ry) < 0.063 * ry) return k.skinShade;
            return x > noseX + 0.097 * rx ? k.skinLight : k.skin;
          },
          2.8
        );
        for (const side of [-1, 1]) {
          b.blob(
            noseX + 0.04 * rx,
            0.2 * ry * side,
            noseZ - 0.067 * rz,
            0.144 * rx,
            0.111 * ry,
            0.092 * rz,
            (x, y, z) => (z < noseZ - 0.073 * rz ? k.skinShade : k.skin)
          );
        }
      } else {
        b.blob(noseX, 0, noseZ, 0.255 * rx, 0.16 * ry, 0.17 * rz, (x, y, z) =>
          z > noseZ - 0.035 * rz ? k.skinLight : k.skinShade
        );
      }
      if (mouth === 'classic') {
        b.blob(
          rig.mouth[0] - 0.095 * s,
          mouthY,
          mouthZ,
          0.48 * s,
          0.205 * ry,
          0.098 * rz,
          (x, y, z) => (z > mouthZ - 0.035 * rz ? k.lips : k.cheek),
          2.5
        );
      } else {
        b.stamp(
          rig.mouth[0] - 0.7 * rx,
          rig.mouth[0] + 0.67 * s,
          mouthY - 0.3 * ry,
          mouthY + 0.3 * ry,
          mouthZ - 0.18 * rz,
          mouthZ + 0.24 * rz,
          (x, y, z) => {
            const color = lipInk(y, z);
            if (!color) return 0;
            const front = faceFront(y, z);
            const reach = (mouth === 'full' ? 0.58 : mouth === 'small' ? 0.29 : 0.36) * s;
            return x >= front - 0.32 * s && x <= front + reach ? color : 0;
          }
        );
      }
      const bob = hairstyle === 'bob',
        bun = hairstyle === 'bun';
      const long = bob ? 0.255 : 0,
        crown = hasHat ? 1.018 : 1.075;
      b.stamp(
        cx - 1.12 * rx,
        cx + 1.12 * rx,
        -1.115 * ry,
        1.115 * ry,
        cz - (1.18 + long) * rz,
        cz + 1.22 * rz,
        (x, y, z) => {
          const u = (x - cx) / rx,
            v = y / ry,
            h = (z - cz) / rz;
          let edge;
          if (u < -0.33) edge = bob ? -1.06 : bun ? -0.77 : -0.55;
          else if (u > 0.52) edge = (bob ? 0.34 : bun ? 0.45 : 0.39) + 0.19 * v + (bun ? 0.12 : 0.07) * u;
          else edge = bob ? -0.98 + 0.74 * (u + 0.33) : -0.49 + 0.63 * (u + 0.33) + 0.075 * v;
          if (h < edge) return 0;
          const widen = 1 + (bob ? 0.072 : 0.044) * (hasHat ? 1 - clamp((h - 0.28) / 0.65, 0, 1) : 1);
          const ux = (u + 0.018) / (widen * (bob && h < -0.25 ? 1.04 : 1));
          const vy = v / (widen * (bob && h < -0.27 ? 1.055 : 1));
          const hh = h < 0 && bob ? h * 0.7 : (h - 0.017) / crown;
          const u2 = ux * ux,
            v2 = vy * vy;
          if (u2 * u2 + v2 * v2 + hh * hh > 1) return 0;
          if (h > 0.41 && Math.abs(v + 0.2 + 0.26 * u) < 0.06) return k.hairLight;
          if (bob && u < 0.1 && Math.abs(v - 0.2 + 0.2 * h) < 0.055) return k.hairLight;
          return u < -0.43 || (v > 0.55 && h < 0.4) ? k.hairShade : k.hair;
        }
      );
      if (bun && !hasHat) {
        b.blob(cx - 0.79 * rx, 0.14 * ry, cz + 0.78 * rz, 0.43 * rx, 0.44 * ry, 0.3 * rz, k.accent);
        b.blob(
          cx - 0.91 * rx,
          0.16 * ry,
          cz + 1.0 * rz,
          0.57 * rx,
          0.56 * ry,
          0.44 * rz,
          (x, y, z) =>
            Math.abs((y - 0.16 * ry) / ry + (0.35 * (z - cz - rz)) / rz) < 0.095
              ? k.hairLight
              : x < cx - rx
                ? k.hairShade
                : k.hair,
          2.35
        );
      } else if (hairstyle === 'crop' && !hasHat) {
        b.blob(cx + 0.17 * rx, -0.19 * ry, cz + 0.97 * rz, 0.57 * rx, 0.43 * ry, 0.255 * rz, (x, y, z) =>
          z > cz + 1.12 * rz ? k.hairLight : k.hair
        );
      }
      if (hairstyle === 'curly') drawCurls(b, k);
      else if (hairstyle === 'ponytail' || hairstyle === 'twin-tails' || hairstyle === 'braid')
        drawTiedHair(b, k);
      if (hasHat) paintHat(pose, b, k, fit);
      b.frame(null);
    }
    const art = {
      materials,
      paint(pose, brush, ink) {
        drawLegs(pose, brush, ink);
        drawTorso(pose, brush, ink);
        drawArms(pose, brush, ink);
        drawHead(pose, brush, ink);
      }
    };
    const even = (v) => 2 * Math.ceil(v / 2);
    // Keep ordinary fitted hats inside the default box. Grow it for taller or wider contributed parts.
    const allowance = [1.65, 1.42, 1.7];
    const radii = [fit.rx, fit.ry, fit.rz];
    let extension = 0;
    for (const stroke of hatPrimitives) {
      const extra = stroke.center.map(
        (c, i) => Math.max(0, Math.abs(c) + stroke.size[i] - allowance[i]) * radii[i]
      );
      extension = Math.max(extension, Math.hypot(...extra));
    }
    const box = [
      even(rig.height * 1.38 + 2 * extension),
      even(rig.height * 1.14 + 2 * extension),
      even(rig.height * 1.18 + 0.35 * fit.rz + extension)
    ];
    return { rig, art, sockets, box, density: 2, tags: [kind] };
  }

  function standingHeight(kind, scale = 1) {
    const [, centerZ, , , radiusZ] = dimensions[kind].head;
    return (centerZ + radiusZ) * scale;
  }
  return { build, standingHeight, shapeRanges };
})();
