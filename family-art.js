// Draw in joint space for the limbs and in the two rigid bind poses for the body and face.
const familyArt = (() => {
  const pigments = {
    skin: 'cf916c',
    skinLight: 'edba94',
    skinShade: 'ae725a',
    cheek: 'da977a',
    lip: 'a26860',
    hair: '3e3036',
    hairMid: '614241',
    hairLight: '835949',
    eyes: '352e37',
    iris: '674a3d',
    white: 'f7ebd6',
    lid: 'a16c60',
    gold: 'e4bd76',
    ivory: 'eee4cc',
    knit: 'd4ceb9',
    coral: 'cf796a',
    coralLight: 'e39a85',
    coralDeep: 'aa615a',
    coralEdge: '8c5351',
    denim: '4b6176',
    denimLight: '647d8e',
    denimDark: '394958',
    shoe: 'b26858',
    blue: '438ab4',
    blueLight: '74b4cd',
    blueDeep: '326a8f',
    navy: '374d65',
    tealLight: '86aaa0',
    yellow: 'e3ae4a',
    sun: 'f0c969',
    ochre: 'b2803d',
    teal: '4b8987',
    tealDeep: '39676b',
    clay: 'ac604a',
    clayLight: 'd18a69',
    sole: '777873',
    rubber: 'd8d3bd',
    mint: '89b6a4',
    mintLight: 'b7d3b9',
    mintShade: '719c91',
    cream: 'f3e7c9',
    seam: 'a6b6a4'
  };

  // The lower edge of each head and the lip position are calibrated to that rig.
  const faces = {
    mother: { x: 0.58, z: 40.12, rx: 4.96, ry: 4.91, rz: 5.75, mx: 5.6, mz: 37.6, eye: 40.85, jaw: 0.16 },
    child: { x: 0.36, z: 27.71, rx: 3.98, ry: 4.12, rz: 4.85, mx: 4.1, mz: 25.8, eye: 28.4, jaw: 0.095 },
    toddler: { x: 0.31, z: 22.62, rx: 3.8, ry: 4.11, rz: 4.47, mx: 3.85, mz: 20.75, eye: 23.29, jaw: 0.06 },
    baby: { x: 0.31, z: 17.69, rx: 3.43, ry: 3.66, rz: 3.89, mx: 3.55, mz: 16.1, eye: 18.13, jaw: 0.02 }
  };
  function insideScalp(u, v, h) {
    const u2 = u * u,
      v2 = v * v;
    return u2 * u2 + v2 * v2 + h * h <= 1;
  }

  function face(pose, { stamp, blob }, k, spec) {
    const { x: cx, z: cz, rx, ry, rz, mx, mz, eye, jaw } = spec;
    const blink = pose.blink || 0,
      eyeHalf = ry * 0.225;
    stamp(cx - rx, cx + rx, -ry, ry, cz - rz, cz + rz, (x, y, z) => {
      const h = (z - cz) / rz,
        u = (x - cx) / rx;
      const v = y / (ry * (1 - jaw * Math.max(0, -h)));
      if (!insideScalp(u, v, h)) return 0;
      const a = Math.abs(y),
        dy = a - ry * 0.48;
      if (u > 0.5 && Math.abs(dy) < eyeHalf) {
        if (Math.abs(z - (eye + rz * 0.245 + 0.13 * dy)) < rz * 0.045) return k.hairMid;
        const eyeBottom = eye - rz * 0.125,
          opening = rz * 0.205 * (1 - blink);
        if (z > eyeBottom && z < eyeBottom + opening) {
          if (Math.abs(dy) < ry * 0.115) return z > eye - rz * 0.025 ? k.eyes : k.iris;
          return k.white;
        }
        if (blink > 0.53 && Math.abs(z - eyeBottom - rz * 0.032) < rz * 0.04) return k.lid;
      }
      if (u > 0.43 && a > ry * 0.63 && z > mz + 0.32 && z < eye - 0.48) return k.cheek;
      return u > 0.41 ? k.skinLight : h < -0.47 ? k.skinShade : k.skin;
    });
    for (const s of [-1, 1]) {
      blob(0.07, s * (ry - 0.1), cz - 0.16, rx * 0.23, ry * 0.205, rz * 0.268, (x, y, z) =>
        x < 0.28 && z < cz ? k.skinShade : k.skinLight
      );
    }
    blob(mx - 0.33, -0.02, mz + rz * 0.32, rx * 0.235, ry * 0.17, rz * 0.165, (x, y, z) =>
      z > mz + rz * 0.29 ? k.skinLight : k.skin
    );
    blob(mx - 0.39, -0.1, mz, 0.5, ry * 0.224, rz * 0.077, (x, y, z) => (z > mz ? k.lip : k.cheek), 2.5);
  }

  function legs(pose, { frame, link, blob }, k, style) {
    frame(null);
    const [thigh, kneeRadius, ankleRadius, ankleHeight, shoeLength, shoeWidth] = style.measure;
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1,
        foot = pose.feet[i],
        { hip, knee } = pose.legs[i];
      link(hip, knee, thigh, kneeRadius, 0.95, (t, u, v) => style.thigh(k, t, u, side * v));
      link(knee, foot, kneeRadius, ankleRadius, 0.93, (t, u, v) => style.shin(k, t, u, side * v));
      const dx = knee[0] - foot[0],
        dz = knee[2] - foot[2],
        horizontal = dx / (Math.hypot(dx, dz) || 1);
      const direction = pose.footYaw ? 1 : 1 - 2 * Math.max(0, Math.min(1, (horizontal - 0.7) / 0.29));
      const [fx, fy, fz] = foot,
        bottom = fz - ankleHeight,
        toe = shoeLength * 0.26 * direction;
      const sh = ankleHeight * 0.72;
      if (pose.footYaw) frame(hikerMotion.geometry.frame(foot,[0,0,0],pose.footYaw[i],0,0));
      blob(
        fx + toe,
        fy,
        bottom + sh,
        shoeLength,
        shoeWidth,
        sh,
        (x, y, z) => {
          const front = ((x - fx - toe) * direction) / shoeLength,
            outer = (side * (y - fy)) / shoeWidth;
          return style.shoe(k, front, outer, (z - bottom) / sh);
        },
        style.soft ? 2.4 : 3.15
      );
      blob(
        fx,
        fy,
        fz + 0.05,
        shoeLength * 0.56,
        shoeWidth * 0.92,
        ankleHeight * 0.58,
        (x, y, z) => {
          const front = ((x - fx) * direction) / shoeLength,
            outer = (side * (y - fy)) / shoeWidth;
          return style.upper(k, front, outer, (z - fz) / ankleHeight);
        },
        2.7
      );
      if (pose.footYaw) frame(null);
    }
  }

  function arms(pose, { frame, link, blob }, k, style) {
    frame(null);
    const [upper, elbowRadius, cuff, palm] = style.measure;
    for (const { side, shoulder, elbow, wrist, hand } of pose.arms) {
      link(shoulder, elbow, upper, elbowRadius, 0.95, (t, u, v) => style.sleeve(k, t * 0.52, u, side * v));
      link(elbow, wrist, elbowRadius, cuff, 0.94, (t, u, v) => style.sleeve(k, 0.52 + t * 0.48, u, side * v));
      const length = Math.hypot(hand[0] - wrist[0], hand[1] - wrist[1], hand[2] - wrist[2]) || 1;
      const along = hand.map((v, i) => (v - wrist[i]) / length);
      const near = hand.map((v, i) => v - 0.38 * palm * along[i]),
        far = hand.map((v, i) => v + 0.34 * palm * along[i]);
      link(near, far, palm, palm * 0.88, 0.85, (t, u, v) => (side * v > 0.13 ? k.skinLight : k.skin));
      blob(
        hand[0] + 0.43 * palm,
        hand[1] - 0.49 * palm * side,
        hand[2] + 0.18 * palm,
        0.5 * palm,
        0.47 * palm,
        0.62 * palm,
        k.skinLight
      );
    }
  }

  const motherLegs = {
    measure: [2.69, 2.12, 1.49, 3.1, 3.42, 1.97],
    thigh: (k, t, u, v) =>
      v > 1.53 && Math.abs(u - 0.13) < 0.22 ? k.denimLight : v < -0.95 ? k.denimDark : k.denim,
    shin: (k, t, u, v) => (t > 0.8 && t < 0.94 ? k.denimLight : v < -0.91 ? k.denimDark : k.denim),
    shoe: (k, f, v, h) =>
      h < 0.38 ? k.rubber : f < -0.53 ? k.shoe : v > 0.48 && f < 0.28 ? k.knit : k.ivory,
    upper: (k, f, v, h) => (h > 0.39 ? k.knit : f > 0.21 && Math.abs(h + 0.22 * v) < 0.12 ? k.white : k.ivory)
  };
  const motherArms = {
    measure: [2.42, 1.92, 1.43, 1.39],
    sleeve: (k, t, u, v) =>
      t > 0.95
        ? k.skin
        : t > 0.77
          ? k.coralDeep
          : t < 0.23 || u > 0.98
            ? k.coralLight
            : v < -0.9
              ? k.coralDeep
              : k.coral
  };
  function mother(pose, b, k) {
    const { frame, blob, stamp } = b;
    legs(pose, b, k, motherLegs);
    frame(pose.pelvis || pose.torso);
    blob(
      -0.13,
      0,
      19.2,
      3.9,
      5.3,
      3.2,
      (x, y, z) =>
        z > 21.05 ? k.denimDark : x < -0.65 && Math.abs(y) > 2.3 && z > 18.2 ? k.denimLight : k.denim,
      2.9
    );
    frame(pose.torso);
    // Curved lapels open over a striped cotton tee. The long hem has two patch pockets.
    stamp(-4.3, 4.83, -6.4, 6.4, 17.56, 34.5, (x, y, z) => {
      const h = z - 17.56,
        a = Math.abs(y);
      const width = h < 5 ? 5.75 - 0.18 * h : Math.min(6.03, 4.85 + 0.15 * (h - 5));
      const top = 34.51 - 0.09 * a * a,
        depth = 3.83 - 0.32 * Math.max(0, 1 - Math.abs(h - 6) / 5) + 0.17 * (h > 11);
      const u = (x - 0.14) / depth,
        v = y / width,
        u2 = u * u,
        v2 = v * v;
      if (u2 * u2 + v2 * v2 > 1 || z > top || z < 17.58 + (0.18 * a) / width) return 0;
      const opening = z < 24 ? 1.25 + 0.18 * (24 - z) : 1.25 + 0.22 * (z - 24);
      if (x > 1.08 && a < opening) {
        if (z < 21.0) return k.denim;
        if (z > 32.64 && a < 1.92) return k.skin;
        return (z > 24.8 && z < 25.35) || (z > 28.1 && z < 28.66) ? k.coralLight : k.ivory;
      }
      if (u > 0.27 && Math.abs(a - opening) < 0.42) return k.coralDeep;
      if (u > 0.24 && a > 2.73 && a < 4.95 && z > 19.2 && z < 22.34)
        return z > 21.86 ? k.coralEdge : k.coralLight;
      if (u < -0.42) {
        if (Math.abs(z - (30.58 - 0.14 * a)) < 0.29) return k.coralLight;
        if (z < 19.72 && a < 0.29) return k.coralEdge;
        return z > 30.45 ? k.coral : k.coralDeep;
      }
      return z < 18.4 ? k.coralDeep : z > 30.35 ? k.coralLight : k.coral;
    });
    blob(0.2, 0, 34.53, 2.06, 2.22, 1.41, k.skin, 2.4);
    arms(pose, b, k, motherArms);
    frame(pose.head);
    face(pose, b, k, faces.mother);
    // A side part, a temple lock and a low tied bun give three different profiles.
    stamp(-5.12, 5.79, -5.39, 5.39, 34.86, 47.15, (x, y, z) => {
      const u = (x - 0.4) / 5.35,
        v = y / 5.27,
        h = (z - 40.56) / 6.52;
      if (!insideScalp(u, v, h)) return 0;
      const edge =
        x < -0.75
          ? 35.28 + 0.31 * (y + 1)
          : x > 2
            ? 42.03 + 0.42 * y + 0.21 * (x - 2)
            : 38.0 + 0.77 * x + 0.22 * y;
      if (z < edge) return 0;
      if (z > 42.2 && Math.abs(y + 0.86 + 0.27 * x) < 0.35) return k.hairLight;
      return y < -0.69 && x > -0.7 ? k.hairMid : k.hair;
    });
    blob(-3.84, 0.35, 44.69, 2.35, 2.75, 2.15, k.coralDeep, 2.5);
    blob(
      -4.32,
      0.7,
      46.65,
      3.03,
      3.03,
      2.9,
      (x, y, z) =>
        Math.abs(y - 0.65 + 0.42 * (z - 46.6)) < 0.48 ? k.hairLight : x < -4.4 ? k.hair : k.hairMid,
      2.5
    );
    for (const s of [-1, 1]) blob(0.45, s * 5.11, 38.49, 0.37, 0.35, 0.43, k.gold);
    frame(null);
  }

  const childLegs = {
    measure: [2.15, 1.7, 1.19, 2.15, 2.68, 1.62],
    thigh: (k, t, u, v) => (t > 0.92 ? k.skin : t > 0.77 ? k.denimLight : v < -0.8 ? k.navy : k.denim),
    shin: (k, t, u, v) => (t < 0.32 ? k.skin : t < 0.47 ? k.ivory : t < 0.57 ? k.blue : k.knit),
    shoe: (k, f, v, h) =>
      h < 0.38 ? k.ivory : f > 0.61 ? k.coralLight : v > 0.41 && f < 0.15 ? k.blue : k.clay,
    upper: (k, f, v, h) => (h > 0.38 ? k.navy : f > 0.14 && Math.abs(h + 0.24 * v) < 0.16 ? k.white : k.clay)
  };
  const childArms = {
    measure: [1.88, 1.48, 1.08, 1.05],
    sleeve: (k, t, u, v) =>
      t > 0.9
        ? k.navy
        : t > 0.72 && t < 0.83
          ? k.blueLight
          : u > 0.82 || t < 0.2
            ? k.blueLight
            : v < -0.72
              ? k.blueDeep
              : k.blue
  };
  function child(pose, b, k) {
    const { frame, stamp, blob } = b;
    legs(pose, b, k, childLegs);
    frame(pose.pelvis || pose.torso);
    blob(-0.1, 0, 12.7, 2.91, 4.11, 2.4, k.denim, 3);
    frame(pose.torso);
    blob(
      0.05,
      0,
      16.94,
      3.15,
      4.54,
      5.78,
      (x, y, z) => {
        if (z < 12.63) return k.navy;
        if (x > 1.65 && Math.abs(y - 0.08) < 0.3) return k.ivory;
        if (
          x > 1.61 &&
          Math.abs(Math.abs(y) - 2.67) < 0.84 &&
          Math.abs(z - (15.8 + 0.56 * (Math.abs(y) - 2.6))) < 0.26
        )
          return k.navy;
        if (z > 19.4 && x > 0.91) return k.blueLight;
        return x < -0.86 ? k.blueDeep : k.blue;
      },
      3.3
    );
    // Behind the neck the windbreaker's hood lies flat, with a yellow inner facing.
    blob(
      -2.19,
      0,
      20.0,
      1.88,
      3.92,
      2.38,
      (x, y, z) => (z > 21.3 ? k.sun : x < -2.93 ? k.blueLight : k.blueDeep),
      2.6
    );
    blob(0.24, 0, 22.76, 1.69, 1.79, 1.03, k.skin, 2);
    stamp(2.55, 3.53, -0.75, 0.79, 18.71, 19.77, (x, y, z) =>
      Math.abs(y) < 0.34 || z < 19.1 ? k.yellow : 0
    );
    arms(pose, b, k, childArms);
    frame(pose.head);
    face(pose, b, k, faces.child);
    // Cropped sides and a cowlick swept to one side are visible without a hat.
    stamp(-4.04, 4.66, -4.47, 4.47, 24.45, 33.27, (x, y, z) => {
      const u = (x - 0.27) / 4.37,
        v = y / 4.42,
        h = (z - 28.01) / 5.21;
      if (!insideScalp(u, v, h)) return 0;
      const edge =
        x < -0.55
          ? 25.08 + 0.17 * y
          : x > 1.4
            ? 29.75 + 0.28 * y + 0.25 * (x - 1.4)
            : 26.66 + 0.69 * x + 0.16 * y;
      if (z < edge) return 0;
      if (x > -0.66 && Math.abs(y + 0.87 + 0.25 * x) < 0.29 && z > 30.7) return k.hairLight;
      return x > 1 || y < -2.38 ? k.hairMid : k.hair;
    });
    blob(0.74, -1.0, 32.22, 2.91, 2.0, 1.48, (x, y, z) => (x > 1.5 ? k.hairMid : k.hair), 2.25);
    blob(-0.95, 1.13, 32.79, 1.97, 1.41, 1.03, k.hairMid, 2.05);
    frame(null);
  }

  const toddlerLegs = {
    measure: [1.9, 1.56, 1.12, 1.75, 2.05, 1.37],
    thigh: (k, t, u, v) => (v > 1.05 && Math.abs(u) < 0.26 ? k.ochre : t > 0.82 ? k.sun : k.yellow),
    shin: (k, t, u, v) => (t > 0.68 ? k.sun : v < -0.71 ? k.ochre : k.yellow),
    shoe: (k, f, v, h) =>
      h < 0.37 ? k.rubber : v > 0.24 && Math.abs(f - 0.05) < 0.24 ? k.clayLight : k.clay,
    upper: (k, f, v, h) => (h > 0.24 ? k.ivory : h > -0.17 ? k.clayLight : k.clay)
  };
  const toddlerArms = {
    measure: [1.58, 1.29, 0.96, 0.92],
    sleeve: (k, t, u, v) =>
      t > 0.88 ? k.teal : (t > 0.24 && t < 0.37) || (t > 0.63 && t < 0.73) ? k.tealLight : k.ivory
  };
  function toddler(pose, b, k) {
    const { frame, blob, stamp } = b;
    legs(pose, b, k, toddlerLegs);
    frame(pose.pelvis || pose.torso);
    blob(-0.15, 0, 9.64, 2.69, 3.51, 2.56, (x, y, z) => (z < 8.27 && x < 0 ? k.ochre : k.yellow), 2.75);
    frame(pose.torso);
    blob(
      0.12,
      0,
      13.77,
      2.82,
      3.96,
      4.48,
      (x, y, z) => {
        const a = Math.abs(y);
        if (z < 12.63) return z > 11.96 ? k.ochre : k.yellow;
        const strap = Math.abs(a - 2.01 - 0.07 * (z - 14)) < 0.47;
        if (x > 1.37 && ((a < 2.69 && z < 15.38) || strap)) {
          if (strap && z > 15.66 && z < 16.27) return k.coralEdge;
          if (Math.abs(y) < 1.1 && z > 13.27 && z < 14.38) return z > 14.01 ? k.ochre : k.sun;
          return k.yellow;
        }
        if (x < -0.57 && (z < 14.08 || Math.abs(a - 0.48 * (z - 13)) < 0.47)) return k.yellow;
        return (z > 15.55 && z < 16.06) || (z > 13.1 && z < 13.66) ? k.tealLight : k.ivory;
      },
      2.58
    );
    blob(0.14, 0, 18.15, 1.51, 1.66, 0.94, k.skin, 2.2);
    arms(pose, b, k, toddlerArms);
    frame(pose.head);
    face(pose, b, k, faces.toddler);
    stamp(-3.98, 4.46, -4.44, 4.44, 19.98, 27.9, (x, y, z) => {
      const u = (x - 0.24) / 4.18,
        v = y / 4.39,
        h = (z - 22.75) / 5.09;
      if (!insideScalp(u, v, h)) return 0;
      const edge = x < -0.86 ? 20.16 + 0.16 * y : x > 1.71 ? 24.13 + 0.15 * x + 0.13 * y : 21.7 + 0.73 * x;
      if (z < edge) return 0;
      return y < -1.84 && z > 24.1 ? k.hairMid : k.hair;
    });
    for (const s of [-1, 1]) {
      blob(-1.72, s * 3.36, 25.43, 1.25, 1.12, 1.23, k.coralLight, 2.7);
      blob(
        -2.44,
        s * 4.17,
        26.03,
        1.87,
        1.58,
        1.82,
        (x, y, z) => (Math.abs(x + 2.36 + 0.25 * (z - 26)) < 0.4 ? k.hairMid : k.hair),
        2.3
      );
    }
    frame(null);
  }

  const babyLegs = {
    measure: [1.64, 1.35, 1.04, 1.4, 1.7, 1.17],
    soft: true,
    thigh: (k, t, u, v) => (v < -0.65 ? k.mintShade : k.mint),
    shin: (k, t, u, v) => (t > 0.66 ? k.cream : t > 0.52 ? k.mintLight : k.mint),
    shoe: (k, f, v, h) => (h < 0.52 ? k.mintLight : k.cream),
    upper: (k, f, v, h) => (h > 0.22 ? k.mintLight : k.cream)
  };
  const babyArms = {
    measure: [1.34, 1.08, 0.84, 0.79],
    sleeve: (k, t, u, v) => (t > 0.79 ? k.cream : v < -0.59 ? k.mintShade : u > 0.62 ? k.mintLight : k.mint)
  };
  function baby(pose, b, k) {
    const { frame, blob, stamp } = b;
    legs(pose, b, k, babyLegs);
    frame(pose.torso);
    // A broad padded seat connects both thighs when the baby sits or crawls.
    blob(
      -0.12,
      0,
      7.45,
      2.6,
      3.33,
      2.35,
      (x, y, z) => {
        if (x < -0.8 && z < 6.76) return k.mintLight;
        return x < -0.53 ? k.mintShade : k.mint;
      },
      2.74
    );
    blob(
      0.05,
      0,
      10.43,
      2.43,
      3.38,
      3.67,
      (x, y, z) => {
        const a = Math.abs(y);
        if (x > 0.82 && z > 12.4 - 0.19 * a && a < 2.65) return k.cream;
        if (x > 0.86 && Math.abs(y - 0.15 - 0.21 * (z - 10)) < 0.25) return k.mintLight;
        if (x > 0.95 && Math.abs(y - 0.1) < 0.35 && z > 10.32 && z < 10.83) return k.cream;
        return x < -0.73 ? k.mintShade : k.mint;
      },
      2.7
    );
    blob(0.13, 0, 14.03, 1.3, 1.45, 0.86, k.skin, 2.2);
    arms(pose, b, k, babyArms);
    frame(pose.head);
    face(pose, b, k, faces.baby);
    // A rolled, close-fitting cotton cap with a tied crown and a small folded tip.
    stamp(-3.67, 4.08, -4.0, 4.0, 16.32, 21.97, (x, y, z) => {
      const u = (x - 0.2) / 3.82,
        v = y / 3.97,
        h = (z - 17.68) / 4.26;
      if (!insideScalp(u, v, h)) return 0;
      const edge = 18.61 + 0.41 * x - 0.095 * y;
      if (z < edge) return 0;
      if (z < edge + 0.88) return z < edge + 0.3 ? k.mintShade : k.mintLight;
      if (Math.abs(y + 0.51 - 0.16 * x) < 0.19 && z > 20.04) return k.knit;
      return x > -0.75 ? k.cream : k.ivory;
    });
    blob(-0.35, 0.15, 21.18, 1.14, 0.96, 0.78, k.mintLight);
    blob(-1.2, 0.38, 21.66, 1.37, 0.81, 0.67, k.cream, 2.32);
    frame(null);
  }

  return {
    mother: { materials: pigments, paint: mother },
    child: { materials: { ...pigments, hair: '443335', hairMid: '6c4a40' }, paint: child },
    toddler: { materials: { ...pigments, skinLight: 'efbc94' }, paint: toddler },
    baby: { materials: { ...pigments, skin: 'd89f82', skinLight: 'f0c3a2', cheek: 'e9a48e' }, paint: baby }
  };
})();
