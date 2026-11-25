// SPDX-License-Identifier: MIT
// An original stylized craniofacial construction. Local +X is anterior, +Z superior.
const pineSkull = (() => {
  const materials = Object.freeze({
    boneLight: 'f3e6c9',
    bone: 'd7c4a0',
    boneShade: 'ae997c',
    boneDeep: '807464',
    tooth: 'fcf0d8'
  });
  const parts = Object.freeze({
    balanced: [1, 1, 1, 0],
    long: [0.95, 1.075, 0.95, -0.026],
    round: [1.065, 0.98, 1.035, 0.014],
    angular: [1.005, 1.015, 1.105, 0.031]
  });
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function proportions(base, shape, form, part = 'balanced') {
    const infant = base === 'baby',
      young = base !== 'adult';
    const growth = { adult: 1, child: 0.64, toddler: 0.36, baby: 0 }[base];
    const [vaultWidth, vaultHeight, jawWidth, chinAdvance] = parts[part] || parts.balanced;
    const archHeight = form.mouth + (infant ? 0.075 : 0.12) + 0.085 * (shape.cheekHeight || 0);
    return Object.freeze({
      base,
      part,
      growth,
      vaultWidth,
      vaultHeight,
      jawWidth: jawWidth * (1 + 0.24 * ((shape.jaw ?? 1) - 1)),
      chinFront: (infant ? 0.88 : young ? 0.895 : 0.91) + chinAdvance + 0.11 * (shape.chinProjection || 0),
      chinWidth: (infant ? 0.31 : 0.32 + 0.03 * growth) * jawWidth * (1 + 0.16 * (shape.chinRoundness || 0)),
      archHeight,
      archFront: 0.65 + 0.075 * (shape.cheekProjection || 0),
      archWidth: (0.71 + 0.055 * growth) * (1 + 0.07 * (shape.cheekWidth || 0)),
      cheekTurn: infant ? 0.042 : young ? 0.082 : 0.108,
      orbitDepth: 0.31 + 0.042 * growth + 0.046 * (shape.eyeDepth || 0)
    });
  }
  const solid = (x, y, z, cx, cy, cz, rx, ry, rz) =>
    ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
  // Elliptical swept segments form separate bilateral rami and the horseshoe of the jaw.
  function segment(a, b, width, thick, high) {
    const dx = (b[0] - a[0]) / width,
      dy = (b[1] - a[1]) / thick,
      dz = (b[2] - a[2]) / high;
    const length = dx * dx + dy * dy + dz * dz;
    return (x, y, z) => {
      const u = (x - a[0]) / width,
        v = (y - a[1]) / thick,
        h = (z - a[2]) / high;
      const t = clamp((u * dx + v * dy + h * dz) / length, 0, 1);
      return (u - t * dx) ** 2 + (v - t * dy) ** 2 + (h - t * dz) ** 2 <= 1;
    };
  }
  function bind({ fit, sockets, driver, form }) {
    const rest = (p) => [(p[0] - fit.x) / fit.rx, p[1] / fit.ry, (p[2] - fit.z) / fit.rz];
    const eye = rest(sockets.leftEye.point);
    const joint = rest(sockets.leftJawJoint.point);
    const angle = rest(sockets.leftJawAngle.point);
    const { growth, archWidth, archFront, archHeight, orbitDepth } = driver;
    const infant = driver.base === 'baby';
    const chin = [driver.chinFront - 0.1, 0, form.chin + 0.052];
    const mouth = form.mouth;
    const cheek = [archFront - 0.139, archWidth - 0.156, archHeight + 0.06];
    const temple = [joint[0] - 0.13, archWidth - 0.067, joint[2] + 0.15];
    const cheekArch = segment(temple, cheek, 0.096, 0.066, infant ? 0.06 : 0.074);
    const cheekWall = segment(cheek, [eye[0] - 0.292, eye[1] + 0.11, eye[2] + 0.04], 0.076, 0.059, 0.085);
    const alveolus = [chin[0] - 0.135, driver.chinWidth, mouth - 0.078];
    const corner = [angle[0] + 0.1, angle[1] - 0.045, angle[2] + 0.018];
    const ramus = segment(
      [joint[0], joint[1] - 0.061, joint[2]],
      corner,
      0.125 + 0.018 * growth,
      0.062,
      0.08
    );
    const coronoid = segment(
      corner,
      [joint[0] + 0.22, joint[1] - 0.1, joint[2] + 0.036],
      0.088,
      0.065,
      0.089
    );
    const jawBody = segment(corner, [alveolus[0], alveolus[1], chin[2] + 0.1], 0.104, 0.08, 0.098);
    const symphysis = segment([alveolus[0], alveolus[1], chin[2] + 0.084], chin, 0.08, 0.1, 0.084);
    const ovalWidth = (infant ? 0.275 : 0.248) * clamp(eye[1] / 0.47, 0.8, 1.14);
    const ovalHeight = infant ? 0.216 : 0.195;
    const top = infant ? 1.07 : 1.04;
    const bottom = eye[2] - (infant ? 0.325 : 0.355);
    const vaultZ = (top + bottom) / 2,
      vaultR = (top - bottom) / 2;
    const faceMid = (eye[2] + mouth) / 2;
    const teethY = driver.chinWidth + 0.095;
    const maxX = driver.chinFront - 0.113;
    function headInk(x, signedY, z, k) {
      const y = Math.abs(signedY);
      const rear = infant ? 0.61 : 0.79;
      const vault = solid(x, y, z, 0.035, 0, vaultZ, x < 0 ? rear : 0.87, 0.875, vaultR);
      const plate = solid(
        x + 0.34 * y * y,
        y,
        z,
        0.56,
        0,
        faceMid + 0.085,
        0.345,
        archWidth - 0.033,
        (eye[2] - mouth) * 0.67 + 0.088
      );
      const maxilla = solid(x, y, z, maxX - 0.19, 0, mouth + 0.14, 0.167, teethY + 0.013, 0.176);
      const nasal = solid(
        x,
        y,
        z,
        eye[0] - (infant ? 0.14 : 0.112),
        0,
        eye[2] - 0.075,
        infant ? 0.11 : 0.14,
        0.122,
        infant ? 0.165 : 0.202
      );
      const brow = solid(
        x + 0.66 * (y - eye[1]),
        y,
        z,
        eye[0] - 0.286,
        eye[1],
        eye[2] + 0.174,
        0.14,
        ovalWidth + 0.008,
        0.122
      );
      const arch =
        x > temple[0] - 0.11 &&
        x < eye[0] + 0.06 &&
        y > archWidth - 0.24 &&
        (cheekArch(x, y, z) || cheekWall(x, y, z));
      const toothRow = y / teethY;
      const arcade =
        toothRow < 1 &&
        z > mouth - 0.015 &&
        z < mouth + 0.13 &&
        Math.abs(x - (maxX - 0.036 - 0.22 * toothRow * toothRow)) < 0.068;
      if (vault > 1 && plate > 1 && maxilla > 1 && nasal > 1 && brow > 1 && !arch && !arcade) return 0;
      // The orbit is an open, deep bowl entering the front and outer side of the face plate.
      const orbital = solid(
        x + 0.36 * (y - eye[1]),
        y,
        z,
        eye[0] + 0.085,
        eye[1],
        eye[2] + 0.004,
        orbitDepth,
        ovalWidth,
        ovalHeight
      );
      if (orbital < 1) return 0;
      const noseH = (z - mouth) / (eye[2] - mouth);
      const aperture = (y / (0.114 - 0.047 * clamp(noseH, 0, 1))) ** 2 + ((noseH - 0.46) / 0.28) ** 2;
      if (x > maxX - 0.31 && aperture < 1) return 0;
      const templeGap = solid(x, y, z, joint[0] + 0.26, archWidth - 0.14, cheek[2] - 0.11, 0.27, 0.25, 0.13);
      if (!arch && templeGap < 1) return 0;
      if (!infant && arcade && z < mouth + 0.068) {
        return Math.cos(y * (driver.base === 'adult' ? 55 : 45)) > 0.84 ? k.boneShade : k.tooth;
      }
      if (orbital < 1.68 && x < eye[0] - 0.08) return k.boneDeep;
      if (aperture < 1.3 && x < maxX - 0.25) return k.boneDeep;
      if (arch) return z > cheek[2] + 0.01 || signedY < 0 ? k.bone : k.boneShade;
      if ((z < vaultZ && x < 0.41) || z < mouth + 0.13 || (x < maxX - 0.12 && aperture < 1.7))
        return k.boneShade;
      const light = 0.49 * x - 0.28 * signedY + (0.73 * (z - vaultZ)) / vaultR;
      return light > 0.52 ? k.boneLight : light > -0.21 ? k.bone : k.boneShade;
    }
    function jawInk(x, signedY, z, k) {
      const y = Math.abs(signedY);
      const u = y / teethY;
      // The two tooth-bearing arches meet when the mandible closes. On an
      // infant these are short, smooth alveolar ridges.
      const ridge =
        u < 1 &&
        z > chin[2] + 0.023 &&
        z < mouth - (infant ? 0.075 : 0.041) &&
        Math.abs(x - (chin[0] - 0.075 - 0.24 * u * u)) < (infant ? 0.076 : 0.085);
      if (
        !ramus(x, y, z) &&
        !coronoid(x, y, z) &&
        !jawBody(x, y, z) &&
        !symphysis(x, y, z) &&
        solid(x, y, z, joint[0], joint[1] - 0.033, joint[2], 0.082, 0.048, 0.063) > 1 &&
        !ridge
      )
        return 0;
      if (!infant && ridge && z > mouth - 0.107)
        return Math.cos(y * (driver.base === 'adult' ? 55 : 45)) > 0.86 ? k.bone : k.tooth;
      if (z < chin[2] - 0.013 || (signedY > 0 && x < angle[0] + 0.29)) return k.boneShade;
      return signedY < 0 && z > chin[2] + 0.065 ? k.boneLight : k.bone;
    }
    function paint(pose, b, k) {
      const stamp = (low, high, sample) =>
        b.stamp(
          fit.x - 1.05 * fit.rx,
          fit.x + 1.25 * fit.rx,
          -1.12 * fit.ry,
          1.12 * fit.ry,
          fit.z + fit.rz * low,
          fit.z + fit.rz * high,
          (x, y, z) => sample((x - fit.x) / fit.rx, y / fit.ry, (z - fit.z) / fit.rz, k)
        );
      b.frame(pose.head);
      stamp(bottom - 0.67, top + 0.02, headInk);
      b.frame(pose.jaw || pose.head);
      stamp(Math.min(chin[2], angle[2]) - 0.17, Math.max(joint[2], angle[2], mouth) + 0.18, jawInk);
    }
    return { driver, paint };
  }
  return Object.freeze({ materials, proportions, bind });
})();
