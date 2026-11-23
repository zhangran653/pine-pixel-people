// An editable body uses the same joint frames, material brushes and action sockets as the cast.
const pineDesignerBody = (() => {
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
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function number(value, fallback, lo, hi) {
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
    const shape = recipe.shape || {},
      parts = recipe.parts || {};
    const s = number(shape.height, 1, 0.9, 1.1);
    const shoulders = number(shape.shoulders, 1, 0.85, 1.15);
    const arms = number(shape.arms, 1, 0.92, 1.08),
      legs = number(shape.legs, 1, 0.92, 1.08);
    const width = number(shape.faceWidth, 1, 0.84, 1.16),
      spacing = number(shape.eyeSpacing, 1, 0.8, 1.2);
    const jaw = number(shape.jaw, 1, 0.8, 1.2),
      mouthOffset = number(shape.mouthHeight, 0, -1, 1);
    const jeans = parts.bottom === 'trousers',
      boots = parts.shoes === 'boots';
    const jacket = parts.top !== 'pullover',
      scarf = parts.neck === 'scarf';
    const hairstyle = ['bob', 'bun'].includes(parts.hair) ? parts.hair : 'crop';
    const hasHat = !!parts.hat && parts.hat !== 'none' && typeof paintHat === 'function';
    const ankle = base.ankle * s;
    const legChange = (base.hip[2] - base.ankle) * (legs - 1) * s;
    const hipBreadth = base.hip[1] * s * (1 + 0.17 * (shoulders - 1));
    const rig = {
      height: base.height * s,
      ankle,
      hip: [base.hip[0] * s, hipBreadth, base.hip[2] * s + legChange],
      pelvis: [base.pelvis[0] * s, 0, base.pelvis[2] * s + legChange],
      shoulder: [
        base.shoulder[0] * s,
        base.shoulder[1] * s * shoulders,
        base.shoulder[2] * s + 0.14 * legChange
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
    const chestDepth = measures.chest * s * (1 + 0.19 * (shoulders - 1));
    const hipThickness = measures.hips * s;
    const hipHalf = hipBreadth + measures.thigh * s * 0.76;
    const sockets = {
      mouth: socket('head', rig.mouth),
      rightEye: socket('head', [eyeX, -eyeY, eyeZ]),
      leftEye: socket('head', [eyeX, eyeY, eyeZ]),
      seat: socket('torso', [rig.pelvis[0], 0, rig.pelvis[2] - 0.79 * hipThickness]),
      upperBack: socket('torso', [-0.89 * chestDepth, -0.15 * rig.shoulder[1], rig.shoulder[2] - 0.65 * s])
    };
    const materials = palette(recipe.colors);

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
        if (jeans) {
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
    }
    function drawArms(pose, b, k) {
      const breadth = s * (1 + 0.31 * (shoulders - 1)),
        upper = measures.upper * breadth;
      const elbowR = measures.elbow * breadth,
        cuff = measures.cuff * s,
        palm = measures.hand * s;
      b.frame(null);
      for (const { side, shoulder, elbow, wrist, hand } of pose.arms) {
        b.link(shoulder, elbow, upper, elbowR, 0.95, (t, u, v) => {
          if (!jacket && t > 0.4 && t < 0.59) return k.accent;
          if (jacket && t < 0.25) return k.topLight;
          return side * v < -0.74 * s ? k.topShade : k.top;
        });
        b.link(elbow, wrist, elbowR, cuff, 0.93, (t, u, v) =>
          t > 0.77 ? (jacket ? k.topStitch : k.topShade) : side * v < -0.69 * s ? k.topShade : k.top
        );
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
      const low = rig.pelvis[2] - hipThickness * 0.47,
        high = rig.neck[2] - 0.1 * s,
        tall = high - low;
      const broad = rig.shoulder[1] * 1.06,
        maxW = Math.max(hipHalf * 1.11, broad) * 1.05;
      b.blob(
        rig.pelvis[0],
        0,
        rig.pelvis[2],
        hipThickness,
        hipHalf,
        0.79 * hipThickness,
        (x, y, z) =>
          z > rig.pelvis[2] + 0.42 * hipThickness
            ? k.bottomShade
            : x < -s && Math.abs(y) > hipBreadth * 0.65
              ? k.bottomLight
              : k.bottom,
        2.7
      );
      b.stamp(-1.14 * chestDepth, 1.19 * chestDepth, -maxW, maxW, low, high, (x, y, z) => {
        const t = (z - low) / tall,
          w = hipHalf * (1 - t) + broad * t;
        const waist = w * (1 - 0.105 * Math.max(0, 1 - Math.abs(t - 0.31) / 0.34));
        const easeOverHips = clamp((0.34 - t) / 0.13, 0, 1);
        const widthAt = waist + easeOverHips * Math.max(0, hipHalf + 0.29 * s - waist);
        const chest = chestDepth * (0.92 + 0.08 * t);
        const depth = chest + easeOverHips * Math.max(0, hipThickness - rig.pelvis[0] + 0.34 * s - chest);
        const v = y / widthAt,
          u = (x - 0.07 * s) / depth;
        const u2 = u * u,
          v2 = v * v;
        if (t < 0 || t > 1 - 0.125 * v2 || u2 * u2 + v2 * v2 > 1) return 0;
        const a = Math.abs(v);
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
      if (jacket) {
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
      if (scarf) {
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
    function drawHead(pose, b, k) {
      b.frame(pose.head);
      const { x: cx, z: cz, rx, ry, rz } = fit;
      const blink = clamp(pose.blink || 0, 0, 1),
        eyeHalf = ry * 0.22;
      b.stamp(cx - rx, cx + rx, -1.075 * ry, 1.075 * ry, cz - rz, cz + rz, (x, y, z) => {
        const h = (z - cz) / rz,
          u = (x - cx) / rx,
          v = y / jawWidth(h),
          u2 = u * u,
          v2 = v * v;
        if (u2 * u2 + v2 * v2 + h * h > 1) return 0;
        const a = Math.abs(y),
          off = a - eyeY;
        if (u > 0.49 && Math.abs(off) < eyeHalf) {
          if (Math.abs(z - (eyeZ + 0.202 * rz + 0.112 * off)) < 0.046 * rz) return k.hairShade;
          const bottom = eyeZ - 0.105 * rz;
          if (z > bottom && z < bottom + 0.213 * rz * (1 - blink)) {
            if (Math.abs(off) < 0.12 * ry) return z > eyeZ + 0.047 * rz ? k.eyeRim : k.eyes;
            return k.eyeWhite;
          }
          if (blink > 0.55 && Math.abs(z - bottom - 0.029 * rz) < 0.044 * rz) return k.eyelid;
        }
        if (u > 0.64 && Math.abs(y - mouthY) < 0.19 * ry && Math.abs(z - mouthZ) < 0.068 * rz) return k.lips;
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
      b.blob(noseX, 0, noseZ, 0.255 * rx, 0.16 * ry, 0.17 * rz, (x, y, z) =>
        z > noseZ - 0.035 * rz ? k.skinLight : k.skinShade
      );
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

  return { build };
})();
