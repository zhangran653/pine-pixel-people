// An editable body uses the same joint frames, material brushes and action sockets as the cast.
const pineDesignerBody = (() => {
  // The first three sculpt releases added the scalp, layered short hair and fitted jaw in order.
  const sculptedReleases = ['1.9.0', '1.9.1', '1.9.2', '1.10.0', '1.10.1', '1.11.0', '1.11.1',
    '1.12.0', '1.13.0', '1.13.1', '1.14.0', '1.15.0', pinePortraitStyles.illustratedRelease,
    pinePortraitStyles.silhouetteRelease, pinePortraitStyles.facePlaneRelease, pinePortraitStyles.pixelRelease, pinePortraitStyles.figureRelease, pinePortraitStyles.tailoredRelease, pinePortraitStyles.proportionStudyRelease, pinePortraitStyles.structureStudyRelease, pinePortraitStyles.gameFaceRelease, pinePortraitStyles.baseFaceRelease, pinePortraitStyles.clothingStudyRelease, pinePortraitStyles.featureStudyRelease, pinePortraitStyles.figureRatioRelease, pinePortraitStyles.expressionRelease, pinePortraitStyles.garmentRelease, pinePortraitStyles.infantChinRelease, pinePortraitStyles.chinPadRelease, pinePortraitStyles.infantNoseRelease];
  // Relative to the selected body. The editor, recipe validator and painter share these limits.
  const shapeRanges = {
    height: [0.75, 1.3, 1],
    shoulders: [0.7, 1.35, 1],
    arms: [0.8, 1.25, 1],
    legs: [0.8, 1.25, 1],
    faceWidth: [0.84, 1.16, 1],
    eyeSpacing: [0.8, 1.2, 1],
    jaw: [0.8, 1.2, 1],
    occiput: [0.8, 1.2, 1],
    headDepth: [0.8, 1.2, 1],
    faceRelief: [0, 1.8, 1],
    ...Object.fromEntries(Object.keys(pinePortraitStyles.morphs).map((key) => [key, [-1, 1, 0]])),
    ...Object.fromEntries(Object.keys(pinePortraitStyles.profileControls).map((key) => [key, [-1, 1, 0]])),
    ...Object.fromEntries(pineHeadShape.controls.map((k) => [k, [-1, 1, 0]])),
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
  const looseLengths = { 'shoulder-length': 1.78, 'long-waves': 2.25, 'half-up': 1.96 };
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
    toddler: {
      head: [0.31, 22.62, 3.8, 4.11, 4.47],
      eye: 23.29,
      mouth: 20.75,
      chin: 0.06,
      thigh: 1.9,
      knee: 1.56,
      ankle: 1.12,
      shoe: [2.05, 1.37],
      upper: 1.58,
      elbow: 1.29,
      cuff: 0.96,
      hand: 0.92,
      chest: 2.68,
      hips: 2.45
    },
    baby: {
      head: [0.31, 17.69, 3.43, 3.66, 3.89],
      eye: 18.13,
      mouth: 16.1,
      chin: 0.02,
      thigh: 1.64,
      knee: 1.35,
      ankle: 1.04,
      shoe: [1.7, 1.17],
      upper: 1.34,
      elbow: 1.08,
      cuff: 0.84,
      hand: 0.79,
      chest: 2.25,
      hips: 2.18
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
  // Floor-relative landmarks from the ordinary shirt and pullover turnarounds.
  // The adult's tucked waist sits above its hip pivot. A child's long pullover
  // ends near the hip. Match their skeletons before dressing either figure.
  const modelBodies = {
    adult: {
      rig: { hip: [-0.4, 3.05, 22.1], pelvis: [-0.15, 0, 22.85], shoulder: [0.3, 5.65, 32.55], neck: [0.2, 0, 35.4],
        thigh: 10.63, shin: 9.10, upperArm: 6.99, forearm: 6.35, palm: 1.41 }, shoulderFit: 0.92,
      measures: { thigh: 2.98, knee: 2.40, ankle: 1.76, shoe: [3.67, 2.18], upper: 2.30,
        elbow: 1.84, cuff: 1.43, hand: 1.54, chest: 3.86, hips: 3.92 }
    },
    child: {
      rig: { hip: [-0.3, 2.47, 12.6], pelvis: [-0.17, 0, 12.65], shoulder: [0.2, 4.1, 21.38], neck: [0.1, 0, 23.42],
        thigh: 5.99, shin: 5.10, upperArm: 5.04, forearm: 4.22, palm: 1.1 }, shoulderFit: 1.015,
      measures: { thigh: 2.27, knee: 1.80, ankle: 1.41, shoe: [2.80, 1.78], upper: 1.98,
        elbow: 1.52, cuff: 1.14, hand: 1.17, chest: 3.21, hips: 2.90 }
    },
    // Intermediate standing proportions. The seated infant uses its own rig.
    toddler: {
      rig: { hip: [-0.2, 2.18, 9.45], pelvis: [-0.13, 0, 9.42], shoulder: [0.15, 3.65, 16.37], neck: [0.1, 0, 18.58],
        thigh: 4.46, shin: 3.77, upperArm: 3.92, forearm: 3.46, palm: 0.84 }, shoulderFit: 0.99,
      measures: { thigh: 2.03, knee: 1.67, ankle: 1.27, shoe: [2.15, 1.53], upper: 1.62,
        elbow: 1.34, cuff: 1.02, hand: 1.00, chest: 2.80, hips: 2.49 }
    }
  };
  function faceHeights(base, infant) {
    const { eye, mouth, head } = dimensions[base];
    return infant ? { eye: head[1] + head[4] * pineInfantLandmarks.eye,
      mouth: head[1] + head[4] * pineInfantLandmarks.mouth } : { eye, mouth };
  }
  function trunkOffset(base, ratio) {
    return (base.shoulder[2] - base.pelvis[2]) * (ratio - 1);
  }
  // A lower vault keeps the brow in place and retains the thickness of a hat
  // above the crown. The same inverse maps hair, skin and hats into the loft.
  function fitCrown(original, ratio) {
    if (!original || ratio === 1) return original;
    const brow = .16, bend = .53, top = original.raise(1);
    const delta = (top - brow) * (ratio - 1);
    const newBend = bend + .27 * delta, newTop = top + delta;
    function remap(z, middle, end, movedMiddle, movedEnd) {
      if (z <= brow) return z;
      if (z >= end) return z + (movedEnd - end);
      if (z < middle) return brow + (z - brow) * (movedMiddle - brow) / (middle - brow);
      return movedMiddle + (z - middle) * (movedEnd - movedMiddle) / (end - middle);
    }
    return {
      rise: original.rise + delta,
      raise: h => remap(original.raise(h), bend, top, newBend, newTop),
      lower: z => original.lower(remap(z, newBend, newTop, bend, top))
    };
  }
  function mouthTravel(base, detailed, infant) {
    const { eye, mouth } = faceHeights(base, infant);
    const down = infant ? 0.47 : base === 'adult' ? 1.12 : 0.87;
    const minGap = (infant ? 0.35 : 0.47) * dimensions[base].head[4];
    return { down, up: detailed ? Math.min(down, eye - minGap - mouth) : down };
  }
  // Invert the painter's height control to leave a given eye-to-mouth distance in head radii.
  function maxMouthHeight(base, distance) {
    const infant = base === 'baby', { eye, mouth } = faceHeights(base, infant);
    const offset = eye - mouth - distance * dimensions[base].head[4];
    const { up, down } = mouthTravel(base, true, infant);
    return Math.max(-1, Math.min(1, Math.floor(100 * offset / (offset > 0 ? up : down)) / 100));
  }
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
  function swell(t, center, span) {
    const d = (t - center) / span;
    return Math.abs(d) >= 1 ? 0 : (1 - d * d) ** 2;
  }
  // A small change in radius and a fore/aft offset around the original bone.
  // Both return to zero at the joints. Lengths, resting pose and sockets stay on the authored rig.
  function contour(center, span, fullness, shift, taperAt, taper) {
    return Array.from({ length: 97 }, (_, i) => {
      const t = i / 96,
        belly = swell(t, center, span);
      return [1 + fullness * belly - taper * swell(t, taperAt, 0.16), shift * belly];
    });
  }
  const limbContours = {
    thigh: contour(0.34, 0.34, 0.045, 0.028, 0.8, 0.025),
    shin: contour(0.36, 0.36, 0.078, -0.082, 0.83, 0.03),
    upperArm: contour(0.27, 0.27, 0.047, -0.021, 0.81, 0.035),
    forearm: contour(0.29, 0.29, 0.064, 0.033, 0.82, 0.047)
  };
  function contouredLink(brush, torso, sections, paint) {
    return (a, b, r0, r1, width, pigment) => {
      if (paint && paint.tailored) return pineFigurePaint.cutLink(brush, torso, paint, a, b, r0, r1, width, pigment);
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        dz = b[2] - a[2];
      const length2 = dx * dx + dy * dy + dz * dz;
      if (length2 < 1e-8) return brush.blob(...a, r0, r0 * width, r0, pigment(0, 0, 0, 0));
      // Project the actor's forward direction onto the cross-section. The calf
      // fullness stays behind the shin, including when the knee bends.
      const along = (torso[0] * dx + torso[4] * dy + torso[8] * dz) / length2;
      const fx = torso[0] - along * dx,
        fy = torso[4] - along * dy,
        fz = torso[8] - along * dz;
      const fabric = paint && pineFigurePaint.limb(paint.k, torso, paint.side, dx, dy, dz, paint.region, paint.style, paint.base);
      const pad = Math.max(r0, r1) * Math.max(1, width) * (fabric ? 1.46 : 1.18);
      const bounds = (j) => [Math.min(a[j], b[j]) - pad, Math.max(a[j], b[j]) + pad];
      brush.stamp(...bounds(0), ...bounds(1), ...bounds(2), (x, y, z) => {
        const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy + (z - a[2]) * dz) / length2, 0, 1);
        const shape = sections[Math.round(96 * t)],
          base = r0 + (r1 - r0) * t;
        const shift = base * shape[1],
          radius = base * shape[0];
        const u = x - a[0] - dx * t - shift * fx,
          v = (y - a[1] - dy * t - shift * fy) / width,
          w = z - a[2] - dz * t - shift * fz;
        const distance2 = u * u + v * v + w * w;
        if (!fabric) return distance2 <= radius * radius ? pigment(t, u, v, w) : 0;
        if (distance2 > 1.76 * radius * radius) return 0;
        const material = pigment(t, u, v, w), edge = radius * fabric.radius(material, t, u / radius, v * width / radius, w / radius);
        return material && distance2 <= edge * edge ? fabric.color(material, t, u, v * width, w, edge) : 0;
      });
    };
  }
  // Compression rises from zero on a straight limb to one on a right-angle bend.
  function jointCompression(a, joint, b) {
    const ax = joint[0] - a[0], ay = joint[1] - a[1], az = joint[2] - a[2];
    const bx = b[0] - joint[0], by = b[1] - joint[1], bz = b[2] - joint[2];
    return clamp(1 - (ax * bx + ay * by + az * bz) / (Math.hypot(ax, ay, az) * Math.hypot(bx, by, bz) || 1), 0, 1);
  }
  // Each lock follows a curved path down the head. Angles run from the forehead
  // (0°) to the nape (180°). Each entry gives root, bend, tip, tip height,
  // half-width and an optional starting height for a shorter overlapping lock.
  const fringeLocks = {
    crop: [
      [-92, -94, -83, 0.03, 12],
      [-81, -66, -58, 0.28, 16],
      [-68, -59, -36, 0.43, 18],
      [-55, -40, -13, 0.34, 19],
      [-38, -20, 10, 0.44, 17],
      [-20, 3, 32, 0.37, 19],
      [1, 31, 58, 0.4, 19],
      [22, 54, 80, 0.13, 14],
      [-48, -33, -5, 0.28, 7, 0.82]
    ],
    sweep: [
      [-45, -74, -84, 0.04, 13],
      [15, -39, -64, 0.25, 18],
      [32, -15, -41, 0.38, 23],
      [47, 7, -20, 0.42, 25],
      [50, 28, 3, 0.51, 20],
      [58, 46, 28, 0.64, 17],
      [69, 61, 53, 0.48, 17],
      [80, 82, 79, 0.14, 15]
    ],
    curtain: [
      [-34, -66, -86, -0.11, 15],
      [-24, -53, -68, 0.18, 19],
      [-15, -35, -49, 0.35, 23],
      [-8, -17, -24, 0.55, 20],
      [8, 19, 35, 0.52, 22],
      [20, 42, 57, 0.29, 22],
      [34, 67, 82, -0.1, 16],
      [-13, -9, -21, 0.47, 7, 0.79],
      [21, 37, 52, 0.17, 7, 0.72]
    ],
    gathered: [
      [-113, -95, -80, 0.04, 11],
      [-127, -92, -62, 0.26, 16],
      [-112, -76, -46, 0.45, 18],
      [-92, -57, -29, 0.56, 18],
      [-72, -36, -8, 0.65, 18],
      [7, -8, -13, 0.73, 15],
      [69, 44, 17, 0.63, 18],
      [96, 65, 41, 0.52, 18],
      [114, 82, 62, 0.34, 15],
      [130, 99, 81, 0.13, 12]
    ]
  };
  const backLocks = [
    [-76, -89, -102, -0.32, 17],
    [-94, -114, -128, -0.53, 20],
    [-119, -137, -153, -0.7, 23],
    [-147, -165, -180, -0.82, 24],
    [174, 159, 145, -0.68, 22],
    [140, 130, 118, -0.46, 21],
    [100, 113, 97, -0.26, 17]
  ];
  const scalpAngles = 192,
    scalpRows = 144,
    scalpBottom = -1.2,
    scalpTop = 1.23;
  const scalpStep = (scalpTop - scalpBottom) / scalpRows,
    scalpMaps = new Map();
  // A reusable map stores the outer *radius* and pigment of the locks. The
  // renderer samples a solid in head space, so each lock has a real profile
  // in Canvas slices and in the Three.js surface extracted from those slices.
  function hairScalp(style, hasHat) {
    const bob = style === 'bob',
      short = style === 'crop' || style === 'side-part';
    const curtain = Object.hasOwn(looseLengths, style);
    const group = style === 'side-part' || bob ? 'sweep' : short ? 'crop' : curtain ? 'curtain' : 'gathered';
    const key = (group === 'gathered' ? group : style) + (hasHat ? '/hat' : '');
    if (scalpMaps.has(key)) return scalpMaps.get(key);
    const width = hasHat ? 1.023 : bob ? 1.09 : 1.05;
    const count = scalpAngles * scalpRows,
      base = new Float32Array(count);
    const radii = new Float32Array(count),
      tones = new Uint8Array(count);
    const { mix, ramp } = studioRig;
    const degreesPerCell = 360 / scalpAngles;
    for (let col = 0; col < scalpAngles; col++) {
      const theta = ((col + 0.5) / scalpAngles) * 2 * Math.PI;
      const front = Math.cos(theta),
        side = Math.sin(theta);
      const nape = (bob ? -1.02 : -0.78) + 0.24 * side * side;
      const temple = bob ? -0.8 : -0.14 - 0.17 * Math.max(0, 1 - ((front - 0.23) / 0.3) ** 2);
      const fringe =
        group === 'gathered'
          ? 0.635 - 0.095 * Math.exp(-(((side + 0.07) / 0.23) ** 2)) - 0.12 * side * side
          : (curtain ? 0.76 : 0.7) + 0.055 * side;
      const edge = mix(mix(nape, temple, ramp(front, -0.85, -0.03)), fringe, ramp(front, 0.12, 0.72));
      const crown = hasHat ? 1.015 : 1.075 + ((short ? 0.047 : 0.022) * (1 + Math.cos(theta + 0.55))) / 2;
      for (let row = 0; row < scalpRows; row++) {
        const h = scalpBottom + (row + 0.5) * scalpStep;
        const hh = ((h - 0.024) * (bob && h < 0 ? 0.76 : 1)) / crown;
        const i = row * scalpAngles + col;
        base[i] = width * Math.sqrt(Math.max(0, 1 - hh * hh));
        if (h < edge || !base[i]) continue;
        radii[i] = base[i];
        const light = 0.25 * front - 0.32 * side + 0.54 * h;
        tones[i] = light < -0.38 ? 1 : light < 0.11 ? 2 : 3;
      }
    }
    const guides = [...fringeLocks[group], ...backLocks];
    guides.forEach(([root, bend, tip, end, span, rootHeight], index) => {
      const fringe = index < fringeLocks[group].length;
      const start = rootHeight ?? 1.12 - 0.025 * (index % 3);
      if (fringe && style === 'long-waves') {
        root -= 20;
        bend -= 10;
      }
      if (fringe && style === 'half-up') end += 0.07;
      if (fringe && bob) {
        root = -root - 12;
        bend = -bend - 6;
        tip = -tip;
        end -= 0.035;
      }
      for (let row = Math.max(0, Math.floor((end - scalpBottom) / scalpStep)); row < scalpRows; row++) {
        const h = scalpBottom + (row + 0.5) * scalpStep,
          t = (start - h) / (start - end);
        if (t <= 0 || t >= 1) continue;
        const at = (1 - t) * (1 - t) * root + 2 * (1 - t) * t * bend + t * t * tip;
        const taper = Math.sqrt(1 - t ** 4);
        const spread = (span * taper) / Math.max(0.58, Math.sqrt(Math.max(0, 1 - (h / 1.15) ** 2)));
        const loft =
          (fringe && group !== 'gathered' ? 0.115 : 0.071) *
          (0.45 + 0.55 * Math.sin(Math.PI * t)) *
          (hasHat ? 1 - 0.92 * ramp(h, 0.22, 0.55) : 1);
        const shineAt = 0.3 + 0.075 * ((index * 3) % 5);
        for (
          let c = Math.floor((at - spread) / degreesPerCell);
          c <= Math.ceil((at + spread) / degreesPerCell);
          c++
        ) {
          const q = ((c + 0.5) * degreesPerCell - at) / spread;
          if (Math.abs(q) >= 1) continue;
          const col = (c + scalpAngles) % scalpAngles,
            i = row * scalpAngles + col;
          if (!base[i]) continue;
          const rib = 1 - q * q;
          const radius = base[i] + loft * rib * taper;
          if (radius <= radii[i]) continue;
          radii[i] = radius;
          const highlight = 1 - ((q + 0.2 - 0.15 * t) / 0.53) ** 2 - ((t - shineAt) / 0.32) ** 2;
          const litSide = Math.cos((at * Math.PI) / 180 + 0.65) + 0.45 * h;
          let tone = 3;
          if (q > 0.82 || (t > 0.92 && q > 0.35)) tone = 1;
          else if (q < -0.8 || q > 0.45 || (litSide < -0.65 && (q > 0.1 || q < -0.53))) tone = 2;
          else if (highlight > 0.76 && litSide > 0.4 && index % 3 !== 1) tone = 5;
          else if (highlight > 0.07 && litSide > -0.76) tone = 4;
          tones[i] = group === 'gathered' && fringe ? clamp(tone, 2, 4) : tone;
        }
      }
    });
    if (!hasHat && (curtain || group === 'sweep')) {
      const part = style === 'long-waves' ? -0.22 : bob ? -0.29 : group === 'sweep' ? 0.33 : -0.035;
      for (let col = 0; col < scalpAngles; col++) {
        const theta = ((col + 0.5) * 2 * Math.PI) / scalpAngles;
        const fore = Math.cos(theta),
          side = Math.sin(theta);
        for (let row = Math.ceil((0.76 - scalpBottom) / scalpStep); row < scalpRows; row++) {
          const i = row * scalpAngles + col;
          if (!tones[i]) continue;
          const u = base[i] * fore,
            v = base[i] * side;
          const gap = 0.042 * Math.max(0, 1 - ((u - 0.16) / 0.62) ** 2);
          const d = Math.abs(v - part * (1 + 0.28 * u) - 0.07 * u * u);
          if (d >= gap) continue;
          radii[i] = base[i] + (radii[i] - base[i]) * (d / gap);
          tones[i] = d < gap * 0.58 ? 6 : 2;
        }
      }
    }
    const rowMax = new Float32Array(scalpRows);
    for (let row = 0; row < scalpRows; row++) {
      const end = (row + 1) * scalpAngles;
      for (let i = end - scalpAngles; i < end; i++) {
        radii[i] *= radii[i];
        rowMax[row] = Math.max(rowMax[row], radii[i]);
      }
    }
    const map = { radiusSquared: radii, rowMax, tones };
    scalpMaps.set(key, map);
    return map;
  }
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
  function palette(colors, surfaceDetails, individual = false) {
    const base = {};
    for (const [key, fallback] of Object.entries(defaults)) {
      const value = colors?.[key];
      base[key] = (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback).slice(1);
    }
    const { skin, hair, eyes, top, bottom, shoes, accent } = base;
    const skinLevel = (0.21 * parseInt(skin.slice(0, 2), 16) + 0.72 * parseInt(skin.slice(2, 4), 16) +
      0.07 * parseInt(skin.slice(4), 16)) / 255;
    const portraitSkin = tint(skin, 'ffe8ce', individual ? 0.09 + 0.16 * skinLevel : 0.24);
    const flush = tint(portraitSkin, tint(skin, 'd68585', 0.42), 0.34);
    const dye = parseInt(hair, 16);
    const brightness = 0.2126 * (dye >> 16) + 0.7152 * ((dye >> 8) & 255) + 0.0722 * (dye & 255);
    const pale = clamp((brightness - 128) / 115, 0, 1);
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
      hatInk: tint(accent, '292a39', 0.69),
      pupil: tint(eyes, '28232a', 0.66),
      irisLight: tint(eyes, 'beaa87', 0.29),
      glint: 'e8dfcb',
      sclera: tint(skin, 'f9f0df', 0.82),
      browSoft: tint(hair, portraitSkin, 0.34),
      lash: tint(hair, '403537', 0.36),
      faceLight: portraitSkin,
      faceMid: tint(skin, 'f0ccba', individual ? 0.075 + 0.15 * skinLevel : 0.23),
      faceEdge: tint(skin, 'bb877c', 0.1),
      rose: flush,
      roseVeil: tint(portraitSkin, flush, 0.52),
      noseLight: tint(portraitSkin, 'ffe3c6', 0.22),
      noseShade: tint(skin, '8e625b', 0.39),
      lipLine: tint(skin, '885651', 0.57),
      upperLip: tint(skin, 'b47370', 0.58),
      lowerLip: tint(skin, 'dc9f93', 0.6),
      hairMid: surfaceDetails ? tint(hair, '211d24', 0.35 - 0.14 * pale) : tint(hair, '322d36', 0.16),
      hairDepth: surfaceDetails ? tint(hair, '13121a', 0.55 - 0.24 * pale) : tint(hair, '322d36', 0.32),
      hairSheen: surfaceDetails ? tint(hair, 'cbb39b', 0.25) : tint(hair, 'd8b39a', 0.15),
      hairHighlight: tint(hair, 'ffecdb', 0.31),
      hairPart: tint(hair, skin, 0.36)
    };
  }

  const ordinaryFaceForms = {long:'long', square:'angular', diamond:'angular', round:'round', pear:'round'};

  function build(
    recipe,
    paintHat,
    hatPrimitives = [],
    roundedHead = true,
    surfaceDetails = roundedHead,
    softContours = surfaceDetails,
    sculptedHead = sculptedReleases.includes(recipe.packs?.['pine-core']),
    layeredHair = sculptedReleases.indexOf(recipe.packs?.['pine-core']) >= 1,
    fittedJaw = sculptedReleases.indexOf(recipe.packs?.['pine-core']) >= 2
  ) {
    const kind = recipe.base === 'adult' ? 'adult' : 'child';
    const bodyStudy = pinePortraitStyles.hasProportionStudy(recipe.packs?.['pine-core']) && modelBodies[recipe.base];
    const standard = studioRig.profiles[recipe.base];
    const base = bodyStudy ? { ...standard, ...bodyStudy.rig } : standard;
    const measures = bodyStudy ? { ...dimensions[recipe.base], ...bodyStudy.measures } : dimensions[recipe.base];
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
    const skirt = parts.bottom === 'skirt' || parts.bottom === 'plaid-skirt',
      cargo = parts.bottom === 'cargo';
    const highTops = parts.shoes === 'high-tops',
      flats = parts.shoes === 'flats';
    const tee = parts.top === 'tee',
      hoodie = parts.top === 'hoodie',
      cardigan = parts.top === 'cardigan';
    const workshopTop = Object.hasOwn(pineWorkshopWear.clothes.top, parts.top),
      workshopBottom = Object.hasOwn(pineWorkshopWear.clothes.bottom, parts.bottom),
      workshopShoes = Object.hasOwn(pineWorkshopWear.clothes.shoes, parts.shoes);
    const collectionTop = Object.hasOwn(pineEverydayStyles.clothes.top, parts.top),
      collectionBottom = Object.hasOwn(pineEverydayStyles.clothes.bottom, parts.bottom),
      collectionShoes = Object.hasOwn(pineEverydayStyles.clothes.shoes, parts.shoes);
    const hairStyle = pineHairStyles.styles[parts.hair];
    const faceOutline = pinePortraitStyles.outlines[recipe.face?.outline];
    const worldTop = Object.hasOwn(pineWorldWardrobe.tops, parts.top);
    const jacket =
        !worldTop &&
        !collectionTop &&
        !workshopTop &&
        parts.top !== 'pullover' &&
        !tee &&
        !hoodie &&
        !cardigan,
      scarf = parts.neck === 'scarf';
    const loose = Object.hasOwn(looseLengths, parts.hair) || !!hairStyle?.length;
    const hairstyle = hairStyle
      ? hairStyle.base
      : loose ||
          ['bob', 'bun', 'ponytail', 'twin-tails', 'braid', 'curly', 'twin-braids', 'side-part'].includes(
            parts.hair
          )
        ? parts.hair
        : 'crop';
    const hasHat = !!parts.hat && parts.hat !== 'none' && typeof paintHat === 'function';
    const pin = recipe.packs?.['pine-core'];
    const style = pinePortraitStyles.portraitStyle(recipe);
    const illustrated = style !== 'natural';
    const tailored = pinePortraitStyles.hasTailoredFigure(pin);
    const modelAnatomy = pinePortraitStyles.hasProportionStudy(pin);
    const pixelStructure = pinePortraitStyles.hasStructureStudy(pin);
    const softPixels = pin === pinePortraitStyles.figureRelease && style === 'animation' && recipe.face?.finish === 'soft-pixel';
    const gameFace = style === 'animation' && (pinePortraitStyles.hasGameFace(pin) || softPixels);
    const drawnFace = gameFace && (pinePortraitStyles.hasBaseFace(pin) || softPixels);
    const clothingStudy = pinePortraitStyles.hasClothingStudy(pin) && recipe.clothingCut !== 'original';
    const paintedFeatures = gameFace && (pinePortraitStyles.hasPaintedFeatures(pin) || softPixels);
    const fittedRatios = pinePortraitStyles.hasFigureRatios(pin);
    const facialActing = gameFace && (pinePortraitStyles.hasFacialActing(pin) || softPixels);
    const portraitInk = gameFace && pin === pinePortraitStyles.infantNoseRelease && recipe.portraitInk;
    const faceInk = softPixels ? 'wash' : portraitInk;
    const featureGuide = paintedFeatures && pineGameFace.featureBrush(recipe.base, faceInk, softPixels, recipe.face?.eyes);
    const faceForm = softPixels ? ordinaryFaceForms[recipe.face.outline] || 'balanced'
      : recipe.face?.form ?? recipe.anatomyParts?.skull ?? 'balanced';
    const sculpt = softPixels ? {...recipe.face,formMix:recipe.base === 'baby' ? .48 : .68} : recipe.face || {};
    const drawnMix = drawnFace && faceForm !== 'balanced' ? sculpt.formMix ?? 1 : 0;
    const paintedBody = recipe.bodyFinish === 'painted';
    const wholeFigure = pin === pinePortraitStyles.figureRelease || tailored;
    const pattern = clothingStudy && pinePortraitStyles.hasGarmentFits(pin) && recipe.clothingCut !== 'age'
      ? pineFigurePaint.patternFor(parts.top, parts.bottom, recipe.base, recipe.garmentFit || {}) : null;
    const garment = tailored && pineFigurePaint.garmentCut(parts.top, recipe.base, clothingStudy, pattern);
    const pixelPortrait = pinePortraitStyles.hasPixelFace(pin) && style === 'animation';
    const fittedFace = pin === pinePortraitStyles.facePlaneRelease || pinePortraitStyles.hasPixelFace(pin);
    const infantFace = fittedFace && recipe.base === 'baby';
    const recentProfile = pin === pinePortraitStyles.silhouetteRelease || fittedFace;
    const refitProfile = recentProfile && recipe.base !== 'baby';
    const editableProfile = pin === '1.15.0' || pin === pinePortraitStyles.illustratedRelease || recentProfile;
    const naturalProfile = pin === '1.14.0' || editableProfile;
    const infantHeadVersion = pin === '1.13.0' || pin === '1.13.1' || naturalProfile;
    const infant = recipe.base === 'baby' && infantHeadVersion;
    const chinStyle = softPixels ? 'full' : pinePortraitStyles.infantChinStyle(recipe);
    const infantChin = infant && gameFace && chinStyle !== 'original';
    const infantNose = infant && gameFace && (softPixels || (pin === pinePortraitStyles.infantNoseRelease && recipe.infantNose === 'nursery'));
    const refitNape = sculptedHead && infant && pin !== '1.13.0';
    const headKind = infant ? 'baby' : kind;
    const proportionBase = recipe.base === 'baby' && !infant ? 'child' : recipe.base;
    const feature = pinePortraitStyles.proportionsFor(proportionBase, style, pin);
    const animated = style === 'animation';
    const pixelKnot = pixelPortrait && parts.hair === 'top-knot' && !hasHat;
    const animationEye = animated && pinePortraitStyles.illustratedEyeShape(recipe.face?.eyes || 'classic', style, infant);
    const heights = faceHeights(recipe.base, infant);
    const { up, down } = mouthTravel(recipe.base, surfaceDetails, infant);
    const [baseX, baseZ, baseRx, baseRy, baseRz] = measures.head;
    const headScale = fittedRatios ? shape.headScale ?? 1 : 1;
    const [pivotX, pivotZ] = pineHeadPivots[headKind];
    // Resize around the base of the skull so the neck still meets a nodding
    // head. The local coordinates are shared by hair, hats and face sockets.
    const cx = baseX + (1 - headScale) * baseRx * (1 + .12 * (width - 1)) * pivotX;
    const headZ = baseZ + (1 - headScale) * baseRz * pivotZ;
    const rx = baseRx * headScale, ry = baseRy * headScale, rz = baseRz * headScale;
    const trunkLift = fittedRatios ? trunkOffset(base, shape.trunkLength ?? 1) : 0;
    const eyeLevel = (heights.eye - baseZ) / baseRz - (softPixels ? (infant ? .018 : .052) : 0);
    const chinH = (infant ? (animated ? -0.746 : -0.81) : -0.755) + (infant ? 0.035 : 0.062) * (shape.chinHeight || 0) +
      (drawnMix ? .8 * pineGameFace.chinShift(recipe.base, faceForm, drawnMix) : 0);
    const neutralMouth = heights.mouth + mouthOffset * (mouthOffset > 0 ? up : down) +
      (drawnFace ? baseRz * pineGameFace.lipLift(recipe.base, faceForm, sculpt.formMix) : 0);
    const originalMouth = headScale === 1 ? neutralMouth : headZ + (neutralMouth - baseZ) * headScale;
    const lipRoom = clamp((originalMouth - headZ) / rz - chinH - .15, 0, .17);
    const mouthLevel = originalMouth - (gameFace && fittedRatios ? (shape.noseLipSpacing ?? 1) - 1 : 0) * lipRoom * rz;
    const mouthH = (mouthLevel - headZ) / rz;
    const profileStrength = { adult: 1, child: 0.82, toddler: 0.60, baby: 0.42 }[recipe.base];
    const planes = naturalProfile && !infant ? {
      eye: eyeLevel,
      eyeCenter: feature.eyeCenter * spacing / pinePortraitStyles.jawBreadth(faceOutline, jaw, eyeLevel),
      mouth: mouthH,
      strength: { adult: 1, child: 0.82, toddler: 0.55 }[recipe.base]
    } : null;
    const noseType = recipe.face?.nose || 'classic';
    const noseRow = pinePortraitStyles.noses[noseType] || pinePortraitStyles.basicNoses[noseType];
    const eyeSpan = feature.eyeWidth * (1 + 0.23 * (shape.eyeWidth || 0));
    const eyeOpen = feature.eyeOpen * (1 + 0.42 * (shape.eyeOpening || 0));
    const lipSpan = feature.lipWidth * (1 + 0.27 * (shape.mouthWidth || 0));
    const upperLipScale = feature.lipHeight * (1 + 0.54 * (shape.upperLipFullness || 0));
    const lowerLipScale = feature.lipHeight * (1 + 0.54 * (shape.lowerLipFullness || 0));
    const mouthName = recipe.face?.mouth || 'classic';
    const lipStyle = pinePortraitStyles.mouths[mouthName];
    const lipWidth = lipStyle?.[1] ?? ({ small:.184, full:animated ? .303 : .284, smile:.309 }[mouthName] ?? .263);
    const lipLift = lipStyle?.[4] ?? (mouthName === 'smile' ? .102 : .034);
    const liftedCorners = animated && ['smile','soft-smile','small','classic','bow','full'].includes(mouthName);
    const drawnMouth = animated && (lipStyle ? [...lipStyle] :
      ['',lipWidth,mouthName === 'full' ? .122 : .063,mouthName === 'full' ? .135 : .069,lipLift,.36,0]);
    if (liftedCorners) drawnMouth[4] = .036 + .59 * lipLift;
    let skinPlanes = planes;
    if (editableProfile) {
      const above = clamp(eyeLevel - noseRow[3] * feature.noseLength - mouthH - 0.012, 0.045, 0.245);
      const below = clamp(mouthH - chinH - 0.012, 0.035, 0.27);
      const reach = shape.lipProjection || 0;
      // The supported dental arch can retract farther. Its forward travel ends
      // behind the selected nose, including on a child's shorter profile.
      let travel = reach < 0 ? 0.105 : 0.130;
      if (refitProfile) {
        const noseDepth = pinePortraitStyles.tipProjection(noseRow, feature.noseReach, 1 + 0.63 * (shape.noseBridge || 0));
        const clearance = animated && recipe.base === 'child' ? 0.023 : 0;
        travel = reach < 0 ? 0.119 : clamp(0.54 * noseDepth - 0.029, 0.029, 0.093) - clearance;
      }
      if (infantFace && reach > 0) travel *= 0.52;
      const depth = profileStrength * ((infant ? 0 : -0.038) + travel * reach) *
        Math.min(1, above / 0.15, below / 0.15);
      skinPlanes = { ...planes, lipBed: { center: mouthH, above, below, depth } };
      if (refitProfile) skinPlanes.contour = { chin: chinH, tip: eyeLevel - noseRow[3] * feature.noseLength };
      if (fittedFace) skinPlanes.form = { model: tailored && pixelPortrait, anatomy: modelAnatomy && pixelPortrait, pixelStructure: pixelStructure && pixelPortrait, pixelPortrait, eye: eyeLevel, mouth: mouthH, chin: chinH, strength: profileStrength };
      if (animated) skinPlanes.orbit = {
        center: feature.eyeCenter * spacing / pinePortraitStyles.jawBreadth(faceOutline, jaw, eyeLevel, feature.outlineStrength),
        width: 1.23 * animationEye.width * feature.eyeWidth * (1 + 0.23 * (shape.eyeWidth || 0)),
        height: 1.53 * Math.max(animationEye.up, animationEye.down) * feature.eyeOpen * (1 + 0.42 * (shape.eyeOpening || 0))
      };
    }
    const skullForm = { eye: eyeLevel, mouth: mouthH, chin: chinH };
    const skullDriver = pixelStructure && !gameFace
      ? pineSkull.proportions(recipe.base, shape, skullForm, recipe.anatomyParts?.skull)
      : null;
    const headLift = trunkLift + (1 - headScale) * baseRz * pivotZ * ((skullDriver?.vaultHeight ?? 1) - 1);
    const mouthZ = (mouthLevel + headLift) * s;
    if (skinPlanes?.form?.pixelStructure) skinPlanes.form.bones = skullDriver;
    const headShape = sculptedHead ? pineHeadShape.scalp(headKind, refitNape) : null;
    const individual = pin === '1.12.0' || infantHeadVersion;
    const softenedOcciput = individual || recipe.packs?.['pine-core'] === '1.11.1';
    const fittedDepth = softenedOcciput || recipe.packs?.['pine-core'] === '1.11.0';
    const articulatedJaw = fittedDepth || recipe.packs?.['pine-core'] === '1.10.1';
    const adjustableJaw = articulatedJaw || recipe.packs?.['pine-core'] === '1.10.0';
    const posterior = headShape
      ? pineHeadShape.posterior(measure(shape, 'occiput'), softenedOcciput ? headShape : undefined)
      : null;
    const crown = fitCrown(headShape?.crown, fittedRatios ? shape.crownHeight ?? 1 : 1);
    const crownHeight = (h) => (crown ? crown.raise(h) : h);
    const sliceHeight = (h) => (crown ? crown.lower(h) : h);
    const downHair = infant && ['crop', 'crew', 'curly'].includes(parts.hair);
    const modelHair = tailored && !hasHat && !infant && pineShortHair.modelCut(parts.hair, headKind);
    const shortHair = modelHair || (sculptedHead && !downHair
      ? pineShortHair.get(parts.hair, headKind, hasHat, layeredHair, refitNape, !!planes) : null);
    const ankle = base.ankle * s;
    const legChange = (base.hip[2] - base.ankle) * (legs - 1) * s;
    const shoulderFit = tailored
      ? { adult: 0.925, child: 0.935, toddler: 0.97, baby: 1 }[recipe.base] : 1;
    const hipBreadth = base.hip[1] * s * (1 + 0.17 * (shoulders - 1)) * cut.hipSpan;
    const rig = {
      ...(facialActing ? { facialActing: true } : {}),
      ...(pattern && (recipe.base === 'adult' || recipe.base === 'child') ? { garmentStance:recipe.base } : {}),
      ...(facialActing && infant && !softPixels ? { seatedHeadOffset:[-.158*rx*s,0,-.245*rz*s] } : {}),
      ...(pixelStructure && infant ? { infantFloorSupport: true } : {}),
      ...(pinePortraitStyles.hasGameFace(pin) && infant ? { infantLapRest: true, headOffset: [-.043*rx*s,0,-.095*rz*s] } : {}),
      height: (base.height + trunkLift) * s,
      ankle,
      hip: [base.hip[0] * s, hipBreadth, base.hip[2] * s + legChange],
      pelvis: [base.pelvis[0] * s, 0, base.pelvis[2] * s + legChange],
      shoulder: [
        base.shoulder[0] * s,
        base.shoulder[1] * s * shoulders * cut.shoulderSpan * (bodyStudy ? bodyStudy.shoulderFit : shoulderFit),
        (base.shoulder[2] + trunkLift) * s + 0.14 * legChange + cut.shoulderLift * s
      ],
      neck: [base.neck[0] * s, base.neck[1] * s, (base.neck[2] + trunkLift) * s],
      mouth: null,
      thigh: base.thigh * s * legs,
      shin: base.shin * s * legs,
      upperArm: base.upperArm * s * arms,
      forearm: base.forearm * s * arms,
      palm: base.palm * s
    };
    const neutralX = cx * s,
      neutralRx = rx * s * (1 + 0.12 * (width - 1));
    // Restore most of the two reference axes' unit ratio. Younger silhouettes
    // retain more of their original proportions; the ear and skull base stay seated.
    const blendDepth = { adult: 0.86, child: 0.72, toddler: 0.58, baby: 0.5 }[recipe.base];
    const referenceDepth = ry * pineSagittalUnits[headKind] / rx;
    const depth = fittedDepth ? (1 + blendDepth * (referenceDepth - 1)) * measure(shape, 'headDepth') : 1;
    const fittedRx = neutralRx * depth;
    const fit = Object.freeze({
      x: neutralX + pineHeadShape.earPlane * (neutralRx - fittedRx),
      posterior,
      crown,
      y: 0,
      z: (headZ + headLift) * s,
      rx: fittedRx,
      ry: ry * s * width * (feature.headWidth ?? 1) * (skullDriver?.vaultWidth ?? 1),
      rz: rz * s * (skullDriver?.vaultHeight ?? 1)
    });
    const eyeY = fit.ry * feature.eyeCenter * spacing * (gameFace ? (infant ? .91 : .94) : 1);
    const eyeZ = softPixels ? fit.z+eyeLevel*fit.rz : ((headScale === 1 ? heights.eye : headZ + eyeLevel * rz) + headLift) * s;
    const softProfile = softPixels || (portraitInk && recipe.faceSurface === 'contour');
    const restingMouth = faceInk && pineGameFace.mouthBrush(recipe.base,featureGuide,mouthName,drawnMouth,
      upperLipScale,lowerLipScale,pineGameFace.expression(recipe.base,recipe.face,null,0,faceInk),softProfile,softPixels);
    // The paint, movable sockets and the shape underneath use the same openings.
    // Y and X use different head radii. Convert widths when drawing a depth arc.
    const layout = (portraitInk && recipe.faceSurface) || softPixels ? {
      eyeCenter:eyeY/fit.ry, eyeHalf:1.06*animationEye.width*eyeSpan,
      lidTop:animationEye.up*eyeOpen, lidBottom:animationEye.down*eyeOpen,
      mouthHalf:restingMouth.width*lipSpan, lateralDepth:fit.ry/fit.rx, ...(softProfile ? {softProfile:true} : {}),
      ...(softPixels ? {softPixels:true} : {})
    } : null;
    const skinShape = gameFace
      ? pineGameFace.model(recipe.base, shape, sculpt, faceForm, headShape, eyeLevel, mouthH, noseRow, drawnFace, paintedFeatures, facialActing && infant, infantChin && (chinStyle === 'full' ? pinePortraitStyles.chinPadRelease : pinePortraitStyles.infantChinRelease), infantNose, faceInk, layout)
      : adjustableJaw
      ? pineHeadShape.reshape(headKind, shape, fittedDepth ? measure(shape, 'faceRelief') : 0, individual, refitNape, skinPlanes)
      : fittedJaw
        ? pineHeadShape.withJaw(headKind)
        : headShape;
    const earZ = infant ? fit.z + (pineInfantLandmarks.ear + 0.067) * fit.rz : fit.z;
    let hatFit = fit;
    const knitBand = refitNape && parts.hat === 'pine-core/cotton-cap' && hatPrimitives.find(p => p.color === 'hatLight');
    if (knitBand) {
      // Seat the folded band around the scalp, allowing a little yarn outside
      // the lower rim. Its front edge and the height of the knit stay fixed.
      const h = knitBand.center[2] - knitBand.size[2];
      const row = skinShape.row(h), ear = pineHeadShape.earPlane;
      const scalp = posterior.fit(row.axis - row.rear, h);
      const band = posterior.fit(knitBand.center[0] - knitBand.size[0], knitBand.center[2]);
      hatFit = { ...fit, hatRearScale: Math.min(1, (ear - scalp + 0.085) / (ear - band)) };
    }
    const earFit = fittedDepth ? { ...fit, x: neutralX, rx: neutralRx, z: earZ } : fit;
    if (adjustableJaw) {
      const [forward, height] = pineHeadPivots[headKind];
      rig.headPivot = [neutralX + neutralRx * forward, 0, fit.z + fit.rz * height];
    }
    const mandible = articulatedJaw ? pineMandibleLandmarks[headKind] : null;
    if (mandible) {
      const [forward, height] = mandible.hinge;
      rig.jawPivot = [neutralX + forward * neutralRx, 0, fit.z + height * fit.rz];
    }
    const eyeCant = (shape.eyeTilt || 0) * 0.091 * fit.rz;
    const browLift = (shape.browHeight || 0) * 0.092 * fit.rz;
    const noseSpan = 1 + 0.34 * (shape.noseWidth || 0), noseRise = 1 + 0.63 * (shape.noseBridge || 0);
    const noseFit = infant || illustrated ? { ...fit, ry: fit.ry * feature.noseWidth, rz: fit.rz * feature.noseLength } : fit;
    const lipFrontLimit = editableProfile && (!infant || infantFace || shape.lipProjection) ? 0.44 : 0.64;
    // Narrow the lower half progressively. The jaw control changes the chin without moving the temples.
    const jawTaper = measures.chin - 0.86 * (jaw - 1);
    const jawWidth = (h) => fit.ry * (1 - jawTaper * clamp(-h, 0, 1));
    // In each horizontal ellipse the crown sits behind the ears and the chin
    // advances towards the face. The side-to-side axis stays on y = 0.
    const forehead = 1.08,
      occiput = kind === 'child' ? 1.12 : 1.16;
    function skullAxis(h) {
      const lower = Math.max(0, -h);
      return -0.055 - 0.115 * h + 0.21 * lower * lower;
    }
    function ovalWidth(h) {
      const lower = Math.max(0, -h);
      const original = jawWidth(h) * (1 - (kind === 'child' ? 0.045 : 0.085) * lower * lower);
      if (!softContours) return original;
      const adjustment = 0.021 * swell(h, -0.27, 0.26) - 0.041 * swell(h, -0.69, 0.3);
      const outline = faceOutline ? pinePortraitStyles.outlineWidth(faceOutline, h) : 1;
      return original * outline * (1 + (kind === 'child' ? 0.72 : 1) * adjustment);
    }
    function rearDepth(h) {
      if (!softContours) return occiput;
      return occiput * (1 + 0.016 * swell(h, 0.23, 0.38) - 0.075 * swell(h, -0.59, 0.4));
    }
    const breadth =
      headShape && !gameFace &&
      Float32Array.from({ length: 601 }, (_, i) => {
        const h = i / 300 - 1;
        const width = pinePortraitStyles.jawBreadth(faceOutline, jaw, h, feature.outlineStrength);
        return illustrated ? width * (1 - (style === 'manga' ? 0.083 : 0.038) * profileStrength * swell(h, -0.60, 0.47)) : width;
      });
    const breadthScale = (h) => gameFace ? 1 : breadth[clamp(Math.round((h + 1) * 300), 0, 600)];
    // Seat the infant's ear rim on the sloping sidewall at each height. A
    // constant lateral offset leaves the earlobe hanging behind the nape in a rear view.
    const earSeats = (refitNape || animated) && Float32Array.from({ length: 49 }, (_, i) => {
      const t = i / 24 - 1, h = (earZ - fit.z) / fit.rz - 0.077 + 0.241 * t;
      const row = skinShape.row(h);
      const x = neutralX + neutralRx * (pineHeadShape.earPlane + 0.043 * t);
      const u = posterior.unfit((x - fit.x) / fit.rx, h);
      const span = clamp((row.axis - u) / row.rear, 0, 1);
      return (row.width + row.templeDelta) * breadthScale(h) * Math.sqrt(1 - span * span) + 0.023 * (1 - t * t);
    });
    // Lay sparse locks along the actual dome. Each lock lifts off the skin in
    // the middle and tapers back down. Strokes are built once in the head frame.
    function infantLocks(style) {
      const curly = style === 'curly', close = style === 'crew';
      const strokes = [];
      for (const [ring, n, start] of [[0.13, 5, -0.35], [0.39, 8, 0.31], [0.80, 11, -0.17]]) {
        for (let i = 0; i < n; i++) {
          const angle = start + i * Math.PI * 2 / n + 0.12 * Math.sin(i * 3.74);
          const fringe = ring > 0.7 && Math.cos(angle) > 0.48;
          if (fringe && (close || i % 3 !== 1)) continue;
          for (let strand = 0; strand < (close ? 1 : 2); strand++) {
            const points = [];
            for (let j = 0; j <= 4; j++) {
              const t = j / 4, wave = Math.sin(Math.PI * t);
              const phi = ring + (close ? 0.10 : 0.22) * t + 0.065 * Math.sin(2 * i) + (curly ? 0.10 * wave : 0);
              const h = Math.cos(phi), row = skinShape.row(h);
              const theta = angle + 0.115 * strand + (curly ? 0.74 * wave - 0.29 * t : 0.52 * t + 0.08 * wave);
              const u = Math.cos(theta), v = Math.sin(theta);
              const forward = u < 0 ? row.axis + row.rear * u : skinShape.frontAt(row, v);
              const lift = (close ? 0.024 : curly ? 0.084 : 0.046) * wave;
              points.push([fit.x + fit.rx * posterior.fit(forward + lift * u, h),
                fit.ry * v * (row.width * breadthScale(h) + lift), fit.z + fit.rz * (crownHeight(h) + lift)]);
            }
            strokes.push({ points, shade: ring < 0.6 && (i + strand) % 3 === 0 ? 2 : (i + strand) % 2 });
          }
        }
      }
      return strokes;
    }
    // Curls follow the baby's own cranial sections. The cheek and the high
    // forehead stay exposed, while locks can descend behind the ears.
    function infantCurls() {
      const strokes = [];
      for (const [polar, count, phase] of [[0.24, 4, 0.8], [0.64, 8, 0.3], [1.02, 10, 0], [1.40, 11, 0.22], [1.72, 9, -0.4]]) {
        for (let i = 0; i < count; i++) {
          const bearing = (i + phase + 0.21 * Math.sin(i * 2.3 + polar * 5)) * 2 * Math.PI / count;
          const front = Math.cos(bearing);
          if (polar > 1.52 - 0.52 * front || (modelAnatomy && front > 0.36 && polar > 0.68)) continue;
          const points = [], radii = [];
          for (let j = 0; j <= 6; j++) {
            const t = j / 6, bow = Math.sin(Math.PI * t);
            const sweep = bearing + 0.46 * bow + 0.19 * t;
            const frontalLock = modelAnatomy && Math.cos(sweep) > 0.28;
            const latitude = polar + 0.073 * Math.cos(i * 2.71 + phase) + (frontalLock ? 0.19 : 0.37) * t - 0.15 * bow;
            const h = Math.cos(latitude), row = skinShape.row(h);
            const u = Math.cos(sweep), v = Math.sin(sweep);
            const forward = u < 0 ? row.axis + row.rear * u : skinShape.frontAt(row, v);
            const lift = gameFace ? .021+.090*bow+.014*Math.sin(3*bearing)*bow : 0.024 + 0.069 * bow;
            points.push([fit.x + fit.rx * posterior.fit(forward + lift * u, h),
              fit.ry * v * (row.width * breadthScale(h) + lift),
              fit.z + fit.rz * (crownHeight(h) + lift * h)]);
            radii.push(gameFace ? .015+.074*bow+.043*(1-t) : 0.025 + 0.11 * bow + 0.055 * (1 - t));
          }
          const lit = pixelStructure ? polar < 1.35 && (i + Math.round(polar * 10)) % 3 === 0 :
            Math.sin(bearing) < -0.15 && polar < 1.18;
          strokes.push({ points, radii, shade: lit ? 0 : polar > 1.33 && Math.sin(bearing) > 0.28 ? 2 : 1 });
        }
      }
      return strokes;
    }
    const modelCurls = downHair && parts.hair === 'curly' && tailored && !hasHat;
    const wisps = downHair ? (animated && knitBand ? [] : modelCurls ? infantCurls() : infantLocks(parts.hair)) : null;
    function faceFront(y, z) {
      const h = sliceHeight((z - fit.z) / fit.rz);
      if (headShape) {
        const row = skinShape.row(h);
        return (
          fit.x +
          fit.rx *
            posterior.fit(
              skinShape.frontAt(row, y / (fit.ry * breadthScale(h) * Math.max(0.0001, row.width))),
              h
            )
        );
      }
      if (roundedHead) {
        const v = y / ovalWidth(h);
        return fit.x + fit.rx * (skullAxis(h) + forehead * Math.sqrt(Math.max(0, 1 - h * h - v * v)));
      }
      const v = y / jawWidth(h);
      return fit.x + fit.rx * Math.sqrt(Math.sqrt(Math.max(0, 1 - h * h - v * v * v * v)));
    }
    const noseContour = !gameFace && (refitProfile || infantFace) &&
      pinePortraitStyles.noseContour(noseRow, noseFit, eyeZ, mouthZ, faceFront, noseRise, feature.noseReach, animated);
    const mouthY = roundedHead ? 0 : -0.062 * fit.ry;
    // The rounded head carries the lip pigments on its own surface. The bottle
    // meets that same surface regardless of the shape or color of the lips.
    const lipReach = surfaceDetails
      ? 0
      : (recipe.face?.mouth === 'full' ? 0.42 : recipe.face?.mouth === 'small' ? 0.22 : 0.31) * s;
    const contactZ = softProfile ? mouthZ + restingMouth.seam(0)*fit.rz : mouthZ;
    rig.mouth = [faceFront(mouthY, contactZ) + (roundedHead ? lipReach : 0.14 * s), mouthY, contactZ];
    const eyeX = faceFront(eyeY, eyeZ);
    const socket = (frame, point) => ({ frame, point });
    const chestDepth = measures.chest * s * (1 + 0.19 * (shoulders - 1)) * cut.chestDepth;
    const hipHeight = measures.hips * s;
    const hipThickness = hipHeight * cut.hipDepth;
    const hipHalf = hipBreadth + measures.thigh * s * 0.76 + cut.hipAllowance * s;
    const collar = [rig.neck[0] - 0.035 * neutralRx, 0, rig.neck[2] - 0.27 * fit.rz],
      upperNeck = [fit.x + ((modelAnatomy && infant ? 0.015 : 0.055) + 0.04 * (shape.jawNeck || 0)) * fit.rx, 0,
        fit.z - (modelAnatomy && infant ? 0.55 : pixelPortrait ? 0.38 : 0.64) * fit.rz];
    const chinJoin = infantChin && [
      fit.x + (skinShape.chin.throatX - .12) * fit.rx, 0, fit.z + (skinShape.chin.throatH + .072) * fit.rz
    ];
    const sockets = {
      ...(adjustableJaw
        ? {
            headPivot: socket('head', rig.headPivot),
            collar: socket('torso', collar),
            throat: socket('head', [
              fit.x + (infantChin ? skinShape.chin.throatX - .19 + .066 * (shape.jawNeck || 0) : 0.52 + 0.115 * (shape.jawNeck || 0)) * fit.rx,
              0,
              fit.z + (infantChin ? skinShape.chin.throatH + .077 : -0.897 + 0.032 * (shape.chinHeight || 0)) * fit.rz
            ])
          }
        : {}),
      mouth: socket('head', rig.mouth),
      rightEye: socket('head', [eyeX, -eyeY, eyeZ]),
      leftEye: socket('head', [eyeX, eyeY, eyeZ]),
      seat: socket('torso', [rig.pelvis[0], 0, rig.pelvis[2] - 0.79 * hipHeight]),
      upperBack: socket('torso', [-0.89 * chestDepth, -0.15 * rig.shoulder[1], rig.shoulder[2] - 0.65 * s])
    };
    let hingeForward, angleForward, angleHeight;
    if (mandible) {
      hingeForward = fittedDepth ? (rig.jawPivot[0] - fit.x) / fit.rx : mandible.hinge[0];
      const angle = mandible.angle[0] + 0.12 * (shape.jawPosition || 0);
      angleForward = fittedDepth ? (neutralX + angle * neutralRx - fit.x) / fit.rx : angle;
      angleHeight = mandible.angle[1] + 0.06 * (shape.jawAngle || 0);
      for (const [side, sign] of [['left', 1], ['right', -1]]) {
        sockets[side + 'EarCanal'] = socket('head', [
          neutralX - 0.127 * neutralRx, sign * 0.97 * fit.ry, earZ - 0.067 * fit.rz
        ]);
        // The reference is a midline hinge. Fit its paired ends inside the pinnae of this character.
        sockets[side + 'JawJoint'] = socket('jaw', [rig.jawPivot[0], sign * (skullDriver ? 0.75 : 0.83) * fit.ry, rig.jawPivot[2]]);
        sockets[side + 'JawAngle'] = socket('jaw', [
          fit.x + angleForward * fit.rx,
          sign * mandible.angle[2] * fit.ry * breadthScale(angleHeight) * (skullDriver ? 0.81 * skullDriver.jawWidth : 1),
          fit.z + angleHeight * fit.rz
        ]);
      }
      const chinZ = fit.z + (skinShape?.chin?.padH ?? skinShape?.lipChin?.padH ?? chinH) * fit.rz;
      sockets.chinTip = socket('jaw', [faceFront(0, chinZ), 0, chinZ]);
      const lip = (offset) => [faceFront(0, mouthZ + offset), 0, mouthZ + offset];
      sockets.upperLip = socket('head', lip(0.04 * fit.rz * upperLipScale));
      sockets.lowerLip = socket('jaw', lip(-0.04 * fit.rz * lowerLipScale));
      if (restingMouth) {
        const surfacePoint = (y,z) => socket('head',[faceFront(y,z),y,z]);
        const corner = fit.ry * lipSpan * restingMouth.width;
        const cornerZ = mouthZ + restingMouth.seam(1)*fit.rz;
        sockets.leftMouthCorner = surfacePoint(corner,cornerZ);
        sockets.rightMouthCorner = surfacePoint(-corner,cornerZ);
        sockets.noseTip = surfacePoint(0,fit.z + crownHeight(skinShape.tip)*fit.rz);
        sockets.noseBase = surfacePoint(0,fit.z + crownHeight(skinShape.noseBase)*fit.rz);
      }
    }
    const anatomy = pixelStructure ? pineAnatomy.bind(recipe, rig, sockets, {
      hipHalf, hipThickness, hipHeight, chestDepth, measures, scale: s
    }) : null;
    const panels = clothingStudy && pineFigurePaint.bodyPanels(garment, anatomy, rig.shoulder[1], chestDepth, hipThickness);
    const panelBounds = panels && {
      width: Math.max(...panels.map(r => r.width+r.lapWidth)),
      front: Math.max(...panels.map(r => r.axis+Math.max(0,r.lapAxis)+r.front+r.lapFront)),
      back: Math.min(...panels.map(r => r.axis+Math.min(0,r.lapAxis)-r.back-r.lapBack))
    };
    let skull = skullDriver && pineSkull.bind({ fit, sockets, driver: skullDriver, form: skullForm });
    const definition = shape.jawDefinition || 0;
    // The lateral edge runs from the fitted gonion to the underside of the chin.
    // The neck and joint keep their own frames throughout this soft-tissue adjustment.
    const jawContour = editableProfile && (!infant || definition !== 0) ? {
      span: (sockets.chinTip.point[0] - fit.x) / fit.rx - angleForward,
      chinEdge: chinH - 0.075,
      taper: profileStrength * ((infant ? 0 : 0.16) + 0.31 * definition),
      lift: profileStrength * ((infant ? 0 : 0.039) + 0.069 * definition),
      feather: 0.18 - 0.082 * profileStrength * (0.35 + 0.65 * definition)
    } : null;
    const materials = palette(recipe.colors, surfaceDetails, individual);
    if (adjustableJaw) {
      const shades = planes ? [0.215, 0.158, 0.106, 0.054] : [0.105, 0.084, 0.062, 0.04];
      for (const [index, amount] of shades.entries())
        materials['neckTone' + index] = tint(materials.faceMid, planes ? '50373a' : '805b4c', amount);
    }
    if (jawContour) {
      for (const [i, level] of [0.27, 0.19, 0.105].entries()) {
        materials['jawPlane' + i] = infant
          ? tint(materials['neckTone' + i], definition < 0 ? materials.faceMid : '38272d',
            Math.abs(definition) * (definition < 0 ? 0.62 : 0.075))
          : tint(materials.faceMid, fittedFace ? '624c44' : '302229',
            level * (fittedFace ? 0.67 : 1) * (0.23 + 0.77 * profileStrength) * (1 + 0.38 * definition));
      }
    }
    if (mandible) {
      materials.oralShade = tint(materials.lipLine, '371f2b', 0.73);
      materials.oralTongue = tint(materials.lipLine, 'bf786e', 0.47);
    }
    if (headShape)
      Object.assign(materials, {
        hairRoot: tint(materials.hair, '302936', 0.2),
        hairPlane: tint(materials.hair, 'c4ad97', 0.135),
        underJaw: tint(materials.skin, '886b62', 0.12),
        ...(fittedJaw ? { jawShade: tint(materials.skin, '775746', 0.182) } : {}),
        templeSkin: tint(materials.faceEdge, materials.faceMid, 0.46),
        foreheadSkin: tint(materials.faceMid, materials.faceLight, 0.48),
        cheekLight: tint(materials.faceLight, 'ffe1c7', 0.095),
        cheekWarm: tint(materials.faceMid, materials.rose, individual ? 0.15 : 0.32),
        stubbleLight: tint(materials.skin, materials.hair, 0.32),
        stubbleMid: tint(materials.skin, materials.hair, 0.57),
        stubbleDark: tint(materials.skin, materials.hair, 0.81)
      });
    const equipped = pineWorkshopWear.needsRelease(parts, recipe.colors);
    const everyday =
      collectionTop ||
      collectionBottom ||
      collectionShoes ||
      Object.hasOwn(pineEverydayStyles.clothes.neck, parts.neck) ||
      Object.entries(pineEverydayStyles.wearables).some(([slot, options]) =>
        Object.hasOwn(options, parts[slot])
      );
    if (equipped || everyday || worldTop || parts.charm)
      Object.assign(materials, pineWorkshopWear.materials(recipe.colors, tint));
    if (parts.charm) {
      const c = (recipe.colors.charm || '#bf9a66').slice(1);
      materials.charmMain = c;
      materials.charmShade = tint(c, '45434d', 0.4);
    }
    if (everyday) Object.assign(materials, pineEverydayStyles.materials(recipe.colors, tint));
    const detailedFace =
      Object.keys(recipe.face || {}).some(
        (k) =>
          Object.hasOwn(pinePortraitStyles.details, k) ||
          Object.hasOwn(pinePortraitStyles.features[k] || {}, recipe.face[k])
      ) || Object.keys(recipe.colors || {}).some((k) => Object.hasOwn(pinePortraitStyles.dyes, k));
    if (detailedFace) Object.assign(materials, pinePortraitStyles.materials(recipe.colors, tint));
    if (infant) {
      const pigment = (recipe.colors.brow || recipe.colors.hair).slice(1);
      materials.faceLight = tint(materials.faceMid, materials.faceLight, 0.74);
      materials.foreheadSkin = tint(materials.faceMid, materials.faceLight, 0.5);
      materials.cheekLight = tint(materials.faceLight, materials.cheekLight, 0.22);
      materials.browSoft = tint(materials.faceMid, pigment, recipe.colors.brow ? 0.49 : 0.26);
      materials.browDeep = tint(materials.faceMid, pigment, recipe.colors.brow ? 0.62 : 0.36);
      materials.lash = tint(materials.faceMid, materials.lash, 0.73);
      materials.noseShade = tint(materials.faceMid, materials.noseShade, 0.60);
      if (wisps) {
        materials.fineHairLight = tint(materials.foreheadSkin, materials.hair, 0.12);
        materials.fineHairMid = tint(materials.foreheadSkin, materials.hair, 0.22);
        materials.fineHairRoot = tint(materials.foreheadSkin, materials.hair, 0.39);
      }
    }
    if (illustrated) pinePortraitStyles.illustratedColors(materials, recipe.colors, tint, style, infant);
    if (pixelPortrait) pinePixelPortrait.dye(materials, recipe.colors, tint);
    if (wholeFigure) pineFigurePaint.palette(materials, recipe.colors, tint);
    if (modelCurls) {
      materials.fineHairRoot = tint(materials.hair, materials.hairDepth, 0.43);
      materials.fineHairMid = materials.hair;
      materials.fineHairLight = tint(materials.hair, materials.hairPlane, 0.57);
    }
    if (pixelStructure && pixelPortrait) {
      // Keep a corner of the sclera in the same value family as the lit cheek.
      materials.scleraShade = tint(materials.scleraShade, materials.sclera, 0.27);
      materials.sclera = tint(materials.sclera, materials.glint, 0.16);
      if (modelCurls) {
        materials.fineHairLight = tint(materials.hair, materials.lock7, 0.70);
        materials.fineHairMid = tint(materials.hair, materials.lock5, 0.34);
      }
    }
    if (gameFace) pineGameFace.palette(materials, recipe.colors, tint, paintedFeatures, faceInk);
    if (softPixels && !recipe.colors.lip) {
      materials.upperLip = tint(materials.skinPlane18,materials.upperLip,.76);
      materials.lipBody = tint(materials.skinPlane18,materials.lipBody,.72);
      materials.lowerLip = tint(materials.skinPlane19,materials.lowerLip,.67);
      materials.lipGlow = tint(materials.lowerLip,materials.lipGlow,.46);
    }
    if (softPixels) {
      materials.nasalFold = tint(materials.skinPlane16,materials.noseShade,.72);
      materials.nasalLight = tint(materials.skinPlane20,materials.noseLight,.23);
      materials.pupil = tint(materials.pupil,materials.irisShadow,.26);
      materials.nasalBase = tint(materials.skinPlane17,materials.noseShade,.39);
      materials.nasalPlane = tint(materials.skinPlane18,materials.nasalFold,.20);
      materials.oralWall = tint(materials.upperLip,materials.oralShade,.30);
      materials.oralTongue = tint(materials.lowerLip,materials.oralTongue,.46);
    }
    if (softProfile) materials.lipCorner = tint(materials.skinPlane18,materials.upperLip,.46);
    if (featureGuide && !recipe.colors.brow) {
      const soften = (1 - featureGuide.brow);
      materials.browDeep = tint(materials.browDeep, materials.faceMid, soften);
      materials.browSoft = tint(materials.browSoft, materials.faceMid, .7 * soften);
    }
    if (paintedFeatures && infant) {
      if (facialActing) for (let i=0; i<4; i++) {
        const tone = 'neckTone' + i;
        materials[tone] = tint(materials[tone], materials['skinPlane' + (3+i)], .52);
      }
      materials.throatMid = tint(materials.neckTone1, materials.skinPlane4, facialActing ? .42 : .28);
      materials.throatPad = tint(materials.neckTone1, materials.skinPlane4, facialActing ? .72 : .59);
    }
    if (paintedBody) pineFigurePaint.skinPalette(materials);
    if (infantFace && !animated) {
      const warm = tint(materials.skin, 'c47570', 0.36);
      materials.cheekWarm = tint(materials.faceLight, warm, 0.65);
      materials.cheekVeil = tint(materials.foreheadSkin, materials.cheekWarm, 0.52);
      const lip = recipe.colors.lip?.slice(1) || tint(materials.skin, 'ad5e68', 0.52);
      materials.lipLine = tint(lip, '57373e', 0.32);
      materials.upperLip = tint(materials.faceMid, lip, 0.70);
      materials.lowerLip = tint(lip, materials.faceLight, 0.57);
    }
    const planeMaterials = animated ? Array.from({ length: 48 }, (_, i) => 'skinPlane' + i) : [];
    if (animated && knitBand) {
      materials.knitShade = tint(materials.hatMain, '695447', 0.23);
      materials.knitSeam = tint(materials.hatMain, '695447', 0.12);
    }
    const bottleLength = rig.height * 0.136;
    if (parts.bottle) {
      const dock =
        parts.bag === 'trail-pack' || parts.bag === 'school-pack' || parts.bag === 'rucksack'
          ? [
              -1.43 * chestDepth,
              -1.07 * rig.shoulder[1],
              rig.pelvis[2] + 0.52 * (rig.neck[2] - rig.pelvis[2])
            ]
          : [-0.69 * chestDepth, -1.08 * hipHalf, rig.pelvis[2] + 0.35 * (rig.neck[2] - rig.pelvis[2])];
      sockets.bottleDock = socket('torso', dock);
    }

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
        if (parts.bottom === 'plaid-skirt') {
          if (along < 0.12 || along > 0.95) return k.bottomShade;
          if (Math.abs(Math.sin(12 * v)) < 0.2 || Math.abs(Math.sin(along * 14)) < 0.19) return k.accent;
          if (Math.cos(11 * v) * Math.cos(along * 13) > 0.15) return k.bottomLight;
        }
        if (along < 0.14 || along > 0.94) return k.bottomShade;
        if (along > 0.87 && along < 0.92) return k.bottomLight;
        return fold > 0.54 ? k.bottomShade : fold < -0.67 ? k.bottomLight : k.bottom;
      });
    }
    // Only a grounded, sitting baby compresses the seat and turns up the soles.
    // The action also supplies this weight during breathing and two-person scenes.
    const infantStudy = infant && modelAnatomy;
    function floorLoad(pose) {
      return infantStudy ? clamp(pose.floorSeat || 0, 0, 1) : 0;
    }
    function drawLegs(pose, b, k) {
      const seated = floorLoad(pose);
      const thigh = (anatomy?.limbs.thigh ?? measures.thigh * s) * (1 + .14 * seated),
        kneeRadius = (anatomy?.limbs.knee ?? measures.knee * s) * (1 + .035 * seated),
        ankleRadius = anatomy?.limbs.ankle ?? measures.ankle * s;
      const shoeX = measures.shoe[0] * s,
        shoeY = measures.shoe[1] * s;
      b.frame(null);
      for (let i = 0; i < 2; i++) {
        const side = i ? 1 : -1,
          foot = pose.feet[i],
          { hip, knee } = pose.legs[i];
        const bend = tailored ? jointCompression(hip, knee, foot) : 0;
        const thighLink = softContours ? contouredLink(b, pose.torso, limbContours.thigh,
          wholeFigure && { k, side, tailored, bend, garment, anatomy, paintedBody, thighRadius:thigh, kneeRadius, end: knee, base: recipe.base, region: 'thigh', seated, style: parts.bottom }) : b.link;
        const shinLink = softContours ? contouredLink(b, pose.torso, limbContours.shin,
          wholeFigure && { k, side, tailored, bend, garment, anatomy, paintedBody, kneeRadius, end: foot, base: recipe.base, region: 'shin', style: parts.bottom }) : b.link;
        if (collectionBottom && !skirt) {
          pineEverydayStyles.pants(
            parts.bottom,
            b,
            thighLink,
            shinLink,
            k,
            hip,
            knee,
            foot,
            side,
            thigh,
            kneeRadius,
            ankleRadius
          );
        } else if (workshopBottom) {
          const denim = parts.bottom === 'cuffed-denim',
            patches = parts.bottom === 'knee-pants';
          thighLink(hip, knee, 1.015 * thigh, 1.04 * kneeRadius, 0.96, (t, u, v) => {
            if (patches && t > 0.7 && u > 0.4 * kneeRadius && Math.abs(v) < 0.74 * kneeRadius)
              return k.bottomLight;
            if (side * v > 0.62 * thigh && Math.abs(u) < 0.16 * thigh) return k.bottomLight;
            return side * v < -0.65 * thigh ? k.bottomShade : k.bottom;
          });
          shinLink(knee, foot, 1.04 * kneeRadius, 1.07 * ankleRadius, 0.95, (t, u, v) => {
            if (denim && t > 0.68) return t > 0.73 && t < 0.9 ? k.bottomLight : k.bottomShade;
            if (patches && t < 0.19 && u > 0.43 * kneeRadius && Math.abs(v) < 0.74 * kneeRadius)
              return k.bottomLight;
            if (!denim && t > 0.85) return k.bottomShade;
            return side * v < -0.65 * ankleRadius ? k.bottomShade : k.bottom;
          });
        } else if (cargo) {
          thighLink(hip, knee, 1.11 * thigh, 1.13 * kneeRadius, 1, (t, u, v) => {
            if (t > 0.77 && u > 0.48 * kneeRadius) return k.bottomLight;
            return side * v < -0.69 * thigh ? k.bottomShade : k.bottom;
          });
          shinLink(knee, foot, 1.14 * kneeRadius, 1.13 * ankleRadius, 0.98, (t, u, v) => {
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
          thighLink(hip, knee, 0.82 * thigh, 0.87 * kneeRadius, 0.94, (t, u, v) =>
            side * v < -0.38 * thigh ? k.skin : k.skinLight
          );
          const lining = hip.map((n, j) => n + 0.36 * (knee[j] - n));
          b.link(hip, lining, 0.91 * thigh, 0.89 * thigh, 0.95, () => k.bottomShade);
          shinLink(knee, foot, 0.88 * kneeRadius, 0.86 * ankleRadius, 0.91, (t, u, v) => {
            if (!flats && t > 0.68) return t < 0.76 ? k.accent : k.rubber;
            return side * v < -0.39 * kneeRadius ? k.skin : k.skinLight;
          });
        } else if (jeans) {
          thighLink(hip, knee, thigh, kneeRadius, 0.95, (t, u, v) =>
            side * v > thigh * 0.48 && Math.abs(u - 0.05 * s) < 0.24 * s
              ? k.bottomLight
              : side * v < -0.82 * s
                ? k.bottomShade
                : k.bottom
          );
          shinLink(knee, foot, kneeRadius, ankleRadius, 0.93, (t, u, v) =>
            t > 0.78 && t < 0.91 ? k.bottomLight : side * v < -0.65 * s ? k.bottomShade : k.bottom
          );
        } else {
          thighLink(hip, knee, 0.79 * thigh, 0.9 * kneeRadius, 0.95, (t, u, v) =>
            side * v < -0.73 * s ? k.skin : k.skinLight
          );
          const hem = hip.map((v, j) => v + 0.71 * (knee[j] - v));
          thighLink(hip, hem, 1.06 * thigh, 1.09 * kneeRadius, 1, (t, u, v) =>
            t > 0.81 ? k.bottomLight : side * v < -0.76 * s ? k.bottomShade : k.bottom
          );
          shinLink(knee, foot, 0.91 * kneeRadius, ankleRadius, 0.94, (t, u, v) =>
            t > 0.62 ? k.rubber : t > 0.5 ? k.accent : side * v < -0.7 * s ? k.skin : k.skinLight
          );
        }
        const [x, y, z] = foot,
          floor = z - ankle;
        const dx = knee[0] - x,
          dz = knee[2] - z;
        const anklePose = pixelStructure && seated ? studioRig.seatedAnkle(rig, pose, i) : null;
        const forward = anklePose ? 1 : 1 - 2 * clamp((dx / (Math.hypot(dx, dz) || 1) - 0.7) / 0.29, 0, 1);
        const toe = shoeX * 0.25 * forward,
          sh = ankle * (boots ? 0.73 : 0.64);
        const footBrush = seated ? pineFigurePaint.seatedFoot(b, foot, forward, seated, anklePose?.pitch) : b;
        const turnout = anklePose ? Math.abs(anklePose.yaw) : undefined;
        const footwear = wholeFigure ? pineFigurePaint.shoeBrush(footBrush, k, foot, shoeX, shoeY, ankle, forward, side, parts.shoes, tailored, turnout) : b;
        if (collectionShoes) {
          pineEverydayStyles.shoe(
            parts.shoes,
            footwear,
            k,
            foot,
            knee,
            side,
            shoeX,
            shoeY,
            ankle,
            ankleRadius,
            forward
          );
          continue;
        }
        if (workshopShoes) {
          pineWorkshopWear.shoe(
            parts.shoes,
            footwear,
            k,
            foot,
            knee,
            side,
            shoeX,
            shoeY,
            ankle,
            ankleRadius,
            forward
          );
          continue;
        }
        if (highTops || flats) {
          const h = ankle * (flats ? 0.47 : 0.66),
            sx = shoeX * (flats ? 0.96 : 1.035);
          if (flats)
            footwear.blob(x + toe, y, floor + 0.51 * ankle, 0.85 * sx, 0.79 * shoeY, 0.5 * ankle, k.skinLight, 2.7);
          footwear.blob(
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
            footwear.blob(
              x + toe + 0.12 * sx * forward,
              y,
              floor + 0.8 * ankle,
              0.16 * sx,
              0.85 * shoeY,
              0.2 * ankle,
              k.shoes,
              3.5
            );
            footwear.blob(
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
            footwear.link(shaft, foot, 1.2 * ankleRadius, 1.15 * ankleRadius, 1, (t, u, v) => {
              if (t < 0.13) return k.shoeShade;
              if (t < 0.23) return k.shoeLight;
              if (u * forward > 0.35 * ankleRadius) {
                const lace = t * 3.9 + (0.29 * Math.abs(v)) / ankleRadius;
                return Math.abs(lace - Math.round(lace)) < 0.18 ? k.rubber : k.shoeShade;
              }
              return side * v < -0.56 * ankleRadius ? k.shoeShade : k.shoes;
            });
            const patch = foot.map((v, j) => v + 0.24 * (knee[j] - v));
            footwear.blob(
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
        footwear.blob(
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
        footwear.link(shaft, foot, ankleRadius * (boots ? 1.25 : 1.12), ankleRadius * 1.1, 1, (t, u, v) => {
          if (boots && t < 0.17) return k.shoeLight;
          if (u > 0.39 * ankleRadius && Math.abs(t * 2.85 - Math.round(t * 2.85) - (0.15 * v) / s) < 0.17)
            return k.rubber;
          return u < -0.46 * s ? k.shoeShade : k.shoes;
        });
      }
      if (skirt) drawSkirt(pose, b, k, thigh);
    }
    function drawArms(pose, b, k) {
      const seated = floorLoad(pose);
      const breadth = s * (1 + 0.31 * (shoulders - 1)) * cut.upperArm * (1 - .07 * seated);
      const upper = anatomy ? anatomy.limbs.upper * (breadth / s) : measures.upper * breadth;
      const elbowR = anatomy ? anatomy.limbs.elbow * (breadth / s) : measures.elbow * breadth,
        cuff = (anatomy?.limbs.cuff ?? measures.cuff * s) * (1 - .07 * seated),
        palm = (anatomy?.limbs.hand ?? measures.hand * s) * (1 + .075 * seated);
      b.frame(null);
      for (const { side, shoulder, elbow, wrist, hand } of pose.arms) {
        const bend = tailored ? jointCompression(shoulder, elbow, wrist) : 0;
        const upperLink = softContours ? contouredLink(b, pose.torso, limbContours.upperArm,
          wholeFigure && { k, side, tailored, bend, garment, anatomy, paintedBody, end: elbow, base: recipe.base, region: 'upperArm', style: parts.top }) : b.link;
        const foreLink = softContours ? contouredLink(b, pose.torso, limbContours.forearm,
          wholeFigure && { k, side, tailored, bend, garment, anatomy, paintedBody, end: wrist, base: recipe.base, region: 'forearm', style: parts.top }) : b.link;
        if (worldTop || collectionTop || workshopTop) {
          const sleeve = worldTop
            ? pineWorldWardrobe.sleeve
            : collectionTop
              ? pineEverydayStyles.sleeve
              : pineWorkshopWear.sleeve;
          upperLink(shoulder, elbow, 1.035 * upper, 1.02 * elbowR, 0.97, (t, u, v) =>
            sleeve(parts.top, t, u, v, side, elbowR, false, k)
          );
          foreLink(elbow, wrist, 1.02 * elbowR, cuff, 0.96, (t, u, v) => {
            if (tailored && parts.top === 'oxford') {
              if (t > 0.38) return k.skin;
              if (t > 0.14) return t < 0.19 || t > 0.34 ? k.topShade : k.topLight;
              return k.top;
            }
            if (wholeFigure && parts.top === 'oxford' && t > 0.45) {
              if (t > 0.69) return k.skin;
              return t < 0.50 || t > 0.63 ? k.topShade : k.topLight;
            }
            return sleeve(parts.top, t, u, v, side, cuff, true, k);
          });
        } else if (tee) {
          upperLink(shoulder, elbow, upper * 0.85, elbowR * 0.82, 0.91, (t, u, v) =>
            side * v < -0.43 * elbowR ? k.skin : k.skinLight
          );
          foreLink(elbow, wrist, elbowR * 0.83, cuff * 0.82, 0.91, (t, u, v) =>
            side * v < -0.43 * cuff ? k.skin : k.skinLight
          );
          const hem = shoulder.map((v, i) => v + 0.44 * (elbow[i] - v));
          upperLink(shoulder, hem, upper * 1.06, elbowR * 1.11, 0.99, (t, u, v) => {
            if (t > 0.8) return t > 0.92 ? k.topShade : k.topLight;
            return side * v < -0.56 * elbowR ? k.topShade : k.top;
          });
        } else if (hoodie || cardigan) {
          upperLink(
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
          foreLink(
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
          upperLink(shoulder, elbow, upper, elbowR, 0.95, (t, u, v) => {
            if (!jacket && !tailored && t > 0.4 && t < 0.59) return k.accent;
            if (tailored && parts.top === 'pullover') {
              const stripe = 0.53 + 0.036 * (side * v - u) / upper;
              if (Math.abs(t - stripe) < 0.043) return k.accent;
            }
            if (jacket && t < 0.25) return k.topLight;
            return side * v < -0.74 * s ? k.topShade : k.top;
          });
          foreLink(elbow, wrist, elbowR, cuff, 0.93, (t, u, v) =>
            t > 0.77 ? (jacket ? k.topStitch : k.topShade) : side * v < -0.69 * s ? k.topShade : k.top
          );
        }
        if (parts.wrist && side === 1) pineWorkshopWear.wristwear(parts.wrist, b, k, { elbow, wrist }, cuff);
        if (wholeFigure) {
          pineFigurePaint.hand(b, k, pose.torso, side, wrist, hand, palm * (tailored ? 1.10 : 1), infant, tailored, paintedBody);
        } else {
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
        if (parts.gloves) pineEverydayStyles.hand(parts.gloves, b, k, { side, wrist, hand }, palm);
      }
    }
    function drawTorso(pose, b, k) {
      b.frame(pose.torso);
      const seated = floorLoad(pose);
      const coatDrop = ['cross-robe', 'brocade', 'lab-coat', 'apron', 'mantle'].includes(parts.top)
        ? 3.45 * s
        : parts.top === 'striped-cardigan'
          ? 1.48 * s
          : parts.top === 'field-jacket'
            ? 0.52 * s
            : 0;
      const low =
          rig.pelvis[2] -
          hipHeight * 0.47 -
          (parts.top === 'trench' ? 2.46 * s : 0) -
          (hoodie ? 0.42 * s : cardigan ? 0.52 * s : coatDrop),
        high = rig.neck[2] - 0.1 * s,
        tall = high - low;
      const ease = hoodie ? 1.085 : cardigan ? 1.025 : 1;
      const broad = rig.shoulder[1] * 1.06,
        maxW = Math.max(hipHalf * 1.11, broad) * (tailored ? 1.18 : 1.05) * ease;
      const fittedDepth = ease * Math.max(chestDepth * 1.28, hipThickness + 0.77 * s);
      const back = selectedCut ? -fittedDepth : -1.14 * chestDepth;
      const front = selectedCut ? fittedDepth : 1.19 * chestDepth;
      const paint = wholeFigure && pineFigurePaint;
      const standingHem = pattern ? pattern.hemline : wholeFigure ? paint.hem(parts.top, recipe.base, modelAnatomy) : 0;
      // Cloth bunches at the hip when seated; leave the lap visible in front,
      // including on a matching set. Long coats still hang below the hips.
      const waistline = pixelStructure && standingHem > 0 ? standingHem + .16 * seated : standingHem;
      // A fitted accessory sits on the same rounded cross section as its cloth.
      const mount = panels && ((h, v, lift = 0) => {
        const t = waistline + (1-waistline)*h, row = panels[clamp(Math.round(t*96),0,96)];
        const u = Math.sqrt((1-v*v)/(1-.21*v*v));
        return [row.axis + seated*row.lapAxis + u*(row.front + seated*row.lapFront) + lift,
          v*(row.width + seated*row.lapWidth), low + tall*t];
      });
      function clothAt(u, v, t) {
        const a = Math.abs(v);
        if (parts.bag || parts.attachment) {
          const strap = pineWorkshopWear.straps(parts.bag, parts.attachment, u, v, t, k);
          if (strap) return strap;
        }
        if (parts.bottom === 'bib-overalls') {
          const bib = pineWorkshopWear.bib(u, v, t, k);
          if (bib) return bib;
        }
        if (panels) {
          const detail = paint.panelDetail(k, parts.top, u, v, t);
          if (detail) return detail;
        }
        if (tailored && parts.top === 'oxford') return paint.shirt(k, u, v, t);
        if (tailored && parts.top === 'pullover') {
          const yoke = 0.68 - 0.055 * v * v + 0.018 * u;
          if (Math.abs(t - yoke) < 0.031) return k.accent;
          if (t < .095) return Math.floor((v + .07 * u) * 16) % 3 === 0 ? k.topShade : k.top;
          if (v < -.62 && t < .145 && t > .085 && u > .12) return k.accent;
          return k.top;
        }
        if (worldTop) return pineWorldWardrobe.fabric(parts.top, u, v, t, k);
        if (collectionTop) return pineEverydayStyles.overlay(parts.top, u, v, t, k);
        if (pixelStructure && parts.top === 'snap-knit' && u > .60 && a < .10) {
          // Seat each snap on the placket itself so it follows the chest as
          // it tapers toward the neck or rounds over a seated infant's lap.
          const button = Math.round((t - .21) / .21);
          const dz = (t - .21 - .21 * button) / .032;
          if (button >= 0 && button < 4 && (v / .10) ** 2 + dz * dz <= 1)
            return dz > .28 ? k.brass : k.brassShade;
        }
        if (workshopTop) return pineWorkshopWear.fabric(parts.top, u, v, t, k, tailored);
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
      }
      if (seated) {
        paint.infantSeat(b, k, pose, rig, hipThickness, hipHalf, hipHeight, seated);
        b.frame(pose.torso);
      } else b.blob(
        rig.pelvis[0],
        0,
        rig.pelvis[2],
        hipThickness,
        hipHalf,
        0.79 * hipHeight,
        (x, y, z) => wholeFigure ? paint.waist(k, (x - rig.pelvis[0]) / hipThickness, y / hipHalf,
          clamp(0.37 + 0.41 * (z - rig.pelvis[2]) / hipHeight, 0, 1)) :
          z > rig.pelvis[2] + 0.42 * hipHeight
            ? k.bottomShade
            : x < -s && Math.abs(y) > hipBreadth * 0.65
              ? k.bottomLight
              : k.bottom,
        2.7
      );
      function paintedPanel(u, v, t, hemRise) {
        if (wholeFigure && t < waistline + hemRise) {
          const h = t / (waistline + hemRise);
          return seated ? paint.infantLap(k, u, v, h, pixelStructure) : paint.waist(k, u, v, h);
        }
        const garmentHeight = wholeFigure ? (t - waistline - hemRise) / (1 - waistline - hemRise) : t;
        const value = clothAt(u, v, garmentHeight);
        if (tailored) return paint.cutTorso(k, value, garment, u, v, garmentHeight);
        return wholeFigure ? paint.torso(k, value, parts.top, u, v, garmentHeight) : value;
      }
      const belt = panels && parts.belt, beltEase = belt ? 1.04 : 1;
      const beltHalf = belt === 'sash' ? .065 : .040;
      const buckle = belt === 'leather' || belt === 'utility' ? k.brass : k.beltLight;
      const halfWidth = panels ? panelBounds.width*beltEase : maxW;
      b.stamp(panels ? panelBounds.back*beltEase : back * (tailored ? 1.15 : 1),
        panels ? panelBounds.front*beltEase : front * (tailored ? 1.15 : 1) + seated * chestDepth * .55,
        -halfWidth, halfWidth, low, high, (x, y, z) => {
        const t = (z - low) / tall;
        if (panels) {
          if (t < 0 || t > 1) return 0;
          const row = panels[Math.round(t*96)];
          const dx = x - row.axis - seated*row.lapAxis;
          const v = y / (row.width + seated*row.lapWidth);
          const u = dx / (dx < 0 ? row.back + seated*row.lapBack : row.front + seated*row.lapFront);
          const u2 = u*u, v2 = v*v;
          if (belt) {
            const level = (t-waistline)/(1-waistline)-.21;
            if (Math.abs(level) < beltHalf && u2 < 1.082 && v2 < 1.082 && u2+v2-.21*u2*v2 < 1.075) {
              if (u > .75 && Math.abs(v) < .14) return buckle;
              if (belt === 'woven' && Math.cos(30*v+level*55) > .45) return k.beltLight;
              return level < -.48*beltHalf || v > .72 ? k.beltShade : k.beltMain;
            }
          }
          if (u2 > 1 || v2 > 1 || u2+v2-.21*u2*v2 > 1) return 0;
          const rise = waistline*(.11*u+.09*v2) + seated*(.054*v2-.025*u);
          return paintedPanel(u, v, t, rise);
        }
        const w = hipHalf * (1 - t) + broad * t;
        const waistWeight = Math.max(0, 1 - Math.abs(t - cut.waistAt) / 0.34);
        const waist = w * (1 - cut.waistInset * waistWeight);
        const easeOverHips = clamp((0.34 - t) / 0.13, 0, 1);
        const drape = wholeFigure ? paint.drape(parts.top, t, waistline) : 1;
        const ring = garment && garment.rings[clamp(Math.round(t * 96), 0, 96)];
        // A sitting infant carries the fullness of the lower belly in front of the
        // hip crease. Behind it, the back swells below the shoulder blades and
        // comes forwards again to join the compressed seat.
        const belly = seated * swell(t, .33, .43);
        const backArc = seated * swell(t, .63, .37);
        const seatTuck = seated * clamp((.40 - t) / .40, 0, 1) ** 2;
        const waistCenter = (.55 * belly - .28 * backArc + .18 * seated * (1-t) + .38 * seatTuck) * s;
        const widthAt = (1 + .075 * belly - .043 * backArc) * (ring ? ring[0] : 1) * (waist + easeOverHips * Math.max(0, hipHalf + 0.29 * s - waist)) * ease * drape;
        const chest = chestDepth * (0.92 + 0.08 * t);
        const depth =
          (chest + easeOverHips * Math.max(0, hipThickness - rig.pelvis[0] + 0.34 * s - chest)) *
          ease *
          (1 - cut.waistDepthInset * waistWeight) * drape * (ring ? ring[1] : 1) *
          (1 + .13 * belly + .085 * backArc);
        const ribWeight = Math.max(0, 1 - Math.abs(t - 0.67) / 0.29);
        // Drape this cut over the same muscular section used for the bare form.
        // The lower panel of long coats can hang freely below the pelvis.
        const core = anatomy && z >= anatomy.low ? anatomy.section(z) : null;
        const shellWidth = core ? core.width * (ring ? ring[0] : 1) * ease * drape * (1.065 + .055 * belly) : widthAt;
        const centerX = waistCenter + (core ? core.axis : .07 * s + cut.chestForward * s * ribWeight);
        const shellDepth = core ? (x > centerX ? core.front : core.back) * (ring ? ring[1] : 1)
          * ease * drape * (1.075 + .11 * belly + .055 * backArc) : depth;
        const v = y / shellWidth,
          u = (x - centerX) / (shellDepth * (x < waistCenter ? 1 - .12 * seatTuck : 1));
        const u2 = u * u,
          v2 = v * v;
        // The rounded-rectangle section is defined inside its own bounding box.
        // Far outside a narrow collar its negative mixed term creates stray corners.
        if (core && (u2 > 1 || v2 > 1)) return 0;
        // Round the outer shoulder and the corners of the upper rib cage.
        const shoulderDrop = wholeFigure ? 0.066 * u2 + 0.065 * v2 : softContours ? 0.047 * u2 + 0.013 * v2 : 0;
        const corner = wholeFigure ? 0.69 + 0.15 * t : softContours ? 0.2 * clamp((t - 0.38) / 0.4, 0, 1) : 0;
        const section = core ? u2 + v2 - .17 * u2 * v2 :
          u2 * u2 + v2 * v2 + corner * (u2 * (1 - u2) + v2 * (1 - v2));
        const hemRise = waistline * (0.13 * u + 0.085 * v2) + seated * (.068 * v2 - .022 * u);
        if (t < 0 || t > (core ? 1 : 1 - cut.shoulderSlope * v2 - shoulderDrop) || section > 1) return 0;
        return paintedPanel(u, v, t, hemRise);
      });
      const hemZ = low + tall * waistline, clothHeight = high - hemZ;
      if (wholeFigure && !panels && !(tailored && parts.top === 'oxford')) paint.neckline(b, k, parts.top, chestDepth, broad, hemZ, clothHeight);
      if (workshopTop) {
        if (!pixelStructure || parts.top !== 'snap-knit')
          pineWorkshopWear.torsoDetails(parts.top, b, k, chestDepth, broad, hemZ, clothHeight);
      } else if (tee && !panels) {
        // A small stitched chest pocket also gives the tee an asymmetric side view.
        const px = 0.89 * chestDepth,
          py = 0.4 * broad,
          pz = hemZ + 0.6 * clothHeight;
        b.blob(
          px,
          py,
          pz,
          0.19 * chestDepth,
          0.22 * broad,
          0.098 * clothHeight,
          (x, y, z) => {
            if (z > pz + 0.049 * clothHeight) return k.topLight;
            return z < pz - 0.061 * clothHeight || Math.abs(y - py) > 0.165 * broad ? k.topShade : k.top;
          },
          3.7
        );
      } else if (hoodie) {
        const hoodZ = high - 0.105 * clothHeight;
        b.blob(
          -0.88 * chestDepth,
          0,
          hoodZ,
          0.86 * chestDepth,
          0.83 * broad,
          0.216 * clothHeight,
          (x, y, z) => {
            const v = Math.abs(y) / (0.83 * broad),
              h = (z - hoodZ) / (0.216 * clothHeight);
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
          hemZ + 0.13 * clothHeight,
          hemZ + 0.46 * clothHeight,
          (x, y, z) => {
            const h = ((z - hemZ) / clothHeight - 0.13) / 0.33,
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
            high - 0.076 * clothHeight,
            0.36 * chestDepth,
            0.32 * broad,
            0.065 * clothHeight,
            (px, py, pz) => (pz > high - 0.054 * clothHeight ? k.topLight : k.topShade),
            3
          );
          const start = [1.105 * chestDepth, side * 0.3 * broad, high - 0.09 * clothHeight];
          const end = [
            1.15 * chestDepth,
            side * (side === 1 ? 0.21 : 0.27) * broad,
            hemZ + (side === 1 ? 0.6 : 0.64) * clothHeight
          ];
          b.link(start, end, 0.31 * s, 0.29 * s, 1, (t) => (t > 0.84 ? k.accent : k.rubber));
          b.blob(...end, 0.33 * s, 0.31 * s, 0.42 * s, k.trimShade);
        }
      } else if (cardigan) {
        for (const side of [-1, 1]) {
          const start = [0.95 * chestDepth, side * 0.57 * broad, high - 0.04 * clothHeight];
          const join = [1.02 * chestDepth, side * 0.095 * broad, hemZ + 0.43 * clothHeight];
          b.link(start, join, 0.37 * s, 0.33 * s, 1, (t, u, v) =>
            side * v > 0.12 * s ? k.topLight : k.topShade
          );
          const y = side * 0.54 * broad,
            z = hemZ + 0.245 * clothHeight;
          b.blob(
            0.91 * chestDepth,
            y,
            z,
            0.17 * chestDepth,
            0.205 * broad,
            0.084 * clothHeight,
            (px, py, pz) => (pz > z + 0.04 * clothHeight ? k.topLight : k.topShade),
            3.7
          );
        }
        for (const level of [0.16, 0.29, 0.42]) {
          b.blob(
            1.0 * chestDepth,
            0.035 * broad,
            hemZ + level * clothHeight,
            0.13 * chestDepth,
            0.093 * broad,
            0.034 * clothHeight,
            (x, y, z) => (x > 1.035 * chestDepth ? k.trimLight : k.trimShade),
            2.4
          );
        }
      } else if (jacket) {
        b.blob(
          -0.7 * chestDepth,
          0,
          high - 0.17 * clothHeight,
          0.67 * chestDepth,
          broad * 0.77,
          0.18 * clothHeight,
          (x, y, z) =>
            z > high - 0.095 * clothHeight ? k.accent : x < -0.96 * chestDepth ? k.topLight : k.topShade,
          2.7
        );
        b.blob(
          0.96 * chestDepth,
          -0.17 * broad,
          hemZ + 0.65 * clothHeight,
          0.18 * chestDepth,
          0.1 * broad,
          0.045 * clothHeight,
          k.accent,
          2.5
        );
      }
      const luggage = wholeFigure && (parts.bag || parts.attachment) ? paint.luggageBrush(b, k) : b;
      if (parts.bag || parts.attachment)
        pineWorkshopWear.luggage(
          pineWorldWardrobe.bags[parts.bag] ? { ...parts, bag: null } : parts,
          luggage,
          k,
          chestDepth,
          broad,
          low,
          tall
        );
      pineWorldWardrobe.carried(parts, luggage, k, chestDepth, broad, low, tall, wholeFigure);
      if (parts.bottle) {
        const [x, y, z] = sockets.bottleDock.point,
          r = rig.height * 0.043;
        b.blob(
          x + 0.48 * r,
          y + 0.63 * r,
          z - 0.66 * bottleLength,
          1.1 * r,
          0.8 * r,
          0.23 * bottleLength,
          (_x, _y, pz) => (pz > z - 0.56 * bottleLength ? k.bagLight : k.bagShade),
          3
        );
      }
      if (!adjustableJaw)
        b.blob(rig.neck[0], 0, rig.neck[2], fit.rx * 0.397, fit.ry * 0.41, fit.rz * 0.235, k.skin, 2.3);
      if (parts.belt || parts.brooch || Object.hasOwn(pineEverydayStyles.clothes.neck, parts.neck))
        pineEverydayStyles.torso(parts, b, k, chestDepth, broad, hemZ, clothHeight, mount);
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
      const at = (u, v, h) => [
        x + rx * (posterior ? posterior.fit(u, h) : u),
        ry * v,
        z + rz * crownHeight(h)
      ];
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

    // A lock follows the head at its root and the upper body where it rests on the shoulders.
    const headWeight = (height) => clamp((height + 1.52) / 1.12, 0, 1);
    function lockPoint(pose, u, v, h) {
      const rest = [
        fit.x + (posterior ? posterior.fit(u, h) : u) * fit.rx,
        v * fit.ry,
        fit.z + crownHeight(h) * fit.rz
      ];
      const head = studioRig.point(pose.head, rest),
        torso = studioRig.point(pose.torso, rest);
      const follow = headWeight(h);
      return torso.map((p, i) => p + follow * (head[i] - p));
    }

    function drawLooseHair(pose, b, k) {
      const { x: cx, z: cz, rx, ry, rz } = fit;
      const waves = hairStyle ? !!hairStyle.wave : hairstyle === 'long-waves',
        gathered = hairstyle === 'half-up';
      const length = hairStyle?.length || looseLengths[hairstyle];
      // Sample the sheet in torso space. Above the nape, undo the head rotation about the neck.
      const axis = (j) =>
        [0, 1, 2].map(
          (i) =>
            pose.head[j] * pose.torso[i] +
            pose.head[4 + j] * pose.torso[4 + i] +
            pose.head[8 + j] * pose.torso[8 + i]
        );
      const [headX, headY, headZ] = [0, 1, 2].map(axis);
      const neck = rig.headPivot || rig.neck;
      b.frame(pose.torso);
      b.stamp(
        cx - 1.72 * rx,
        cx + 1.5 * rx,
        -1.75 * ry,
        1.75 * ry,
        cz - (length + 0.35) * rz,
        cz + crownHeight(0.95) * rz,
        (x, y, z) => {
          const follow = headWeight((z - cz) / rz);
          const dx = x - neck[0],
            dy = y - neck[1],
            dz = z - neck[2];
          const physicalX = (x - cx + follow * (headX[0] * dx + headX[1] * dy + headX[2] * dz - dx)) / rx;
          const v = (y + follow * (headY[0] * dx + headY[1] * dy + headY[2] * dz - dy)) / ry;
          const h = sliceHeight(
            (z - cz + follow * (headZ[0] * dx + headZ[1] * dy + headZ[2] * dz - dz)) / rz
          );
          const u = posterior ? posterior.unfit(physicalX, h) : physicalX;
          if (h > 0.51 || h < -length - 0.12) return 0;
          const drop = clamp((0.28 - h) / 1.75, 0, 1);
          const bend = waves ? Math.sin(7.1 * h + 0.55 * v) * (hairStyle?.wave || 1) : 0;
          const width = 1.015 + (gathered ? 0.035 : 0.1) * drop + (waves ? 0.13 * drop * bend : 0);
          const crown = 1 - 0.42 * Math.max(h, 0) ** 2;
          const side = v / (crown * width);
          const back = (u + 0.16 * drop) / (crown * (1.08 + drop * (waves ? 0.15 : 0.04)));
          const radius = back * back + side * side;
          if (hairStyle?.nape && u > -0.3) return 0;
          const hem =
            -length +
            (hairStyle?.asym || 0) * side +
            (hairStyle?.hem || 0.3) * Math.pow(Math.min(1, Math.abs(side)), 1.6) +
            0.09 * Math.cos(10 * side);
          if (surfaceDetails) {
            if (radius > 1.23 || radius < 0.52 || u > (gathered ? -0.03 : 0.38) + 0.12 * h) return 0;
            const angle = Math.atan2(side, -back);
            const flow =
              9 * angle +
              (waves ? 0.98 * Math.sin(3.6 * h + angle) : 0.52 * h) +
              0.64 * Math.sin(2.3 * angle + 0.86 * h);
            const ridge = Math.cos(flow),
              end = hem - 0.1 * ridge;
            if (h < end || radius > 1.09 + 0.11 * ridge) return 0;
            if (radius < 0.66 || ridge < -0.69) return k.hairDepth;
            const light = Math.cos(2.7 * h + 1.7 * angle + 0.32 * Math.sin(flow));
            if (ridge > 0.65 && light > 0.08 && h > end + 0.16) return k.hairSheen;
            return ridge < -0.19 || (gathered && h > -0.36) ? k.hairMid : k.hair;
          }
          if (h < hem || radius > 1.1 || radius < 0.46 || u > (gathered ? -0.03 : 0.38) + 0.12 * h) return 0;
          const lock = Math.cos(11.4 * side + (waves ? 1.38 * bend : 0.42 * h) + 0.5 * u);
          if (lock > 0.83 && h < 0.05 && h > hem + 0.26 && side < 0.64) return k.hairLight;
          return radius < 0.61 || lock < -0.61 || (gathered && h > -0.36) ? k.hairShade : k.hair;
        }
      );
      b.frame(null);
      if (gathered) {
        const tie = lockPoint(pose, -1.08, 0, 0.1);
        const middle = lockPoint(pose, -1.38, 0.04, -0.52);
        const end = lockPoint(pose, -1.28, 0.16, -1.32);
        const strand = (t, u, v) => (Math.abs(v - (t - 0.5) * 0.13 * ry) < 0.075 * ry ? k.hairLight : k.hair);
        b.link(tie, middle, rx * 0.19, rx * 0.275, 1.33, strand);
        b.link(middle, end, rx * 0.275, rx * 0.07, 1.25, strand);
        b.blob(...tie, rx * 0.18, ry * 0.29, rz * 0.125, k.accent, 2.8);
      } else if (!hairStyle?.nape) {
        // Two face-framing sections fall in front of the collar. Leave the eyes and mouth open.
        const front = (chestDepth - cx) / rx + 0.14;
        for (const side of [-1, 1]) {
          const root = lockPoint(pose, 0.26, side * 0.95, 0.18);
          const cheek = lockPoint(pose, 0.42, side * (waves ? 1.17 : 1.01), -0.47);
          const collar = lockPoint(pose, front, side * (waves ? 0.79 : 0.87), -1.14);
          const tip = lockPoint(pose, front + 0.08, side * (waves ? 0.98 : 0.69), -length + 0.12 * side);
          const strand = (segment) => (t, u, v) => {
            if (!surfaceDetails)
              return side * v > 0.085 * ry ? k.hairShade : u > 0.1 * rx ? k.hairLight : k.hair;
            const along = (segment + t) / 3;
            const across = (side * v) / ry + (0.26 * u) / rx;
            const ribbon = across + 0.06 * Math.sin(5 * along + side);
            if (ribbon > 0.13 || u < -0.12 * rx) return k.hairDepth;
            if (ribbon > 0.041 || u < -0.054 * rx) return k.hairMid;
            return ribbon > -0.1 && ribbon < -0.035 && along > 0.14 && along < 0.81 ? k.hairSheen : k.hair;
          };
          b.link(root, cheek, 0.2 * rx, 0.24 * rx, 1.06, strand(0));
          b.link(cheek, collar, 0.24 * rx, 0.21 * rx, 1.15, strand(1));
          b.link(collar, tip, 0.21 * rx, (surfaceDetails ? 0.027 : 0.065) * rx, 1.2, strand(2));
        }
      }
    }

    function drawTwinBraids(pose, b, k) {
      b.frame(null);
      for (const side of [-1, 1]) {
        const root = lockPoint(pose, -0.52, side * 0.88, -0.23);
        const start = lockPoint(pose, -0.4, side * 1.06, -0.48);
        b.link(root, start, 0.26 * fit.rx, 0.23 * fit.rx, 1, () => k.hair);
        for (let i = 0; i < 6; i++) {
          const t = i / 5,
            twist = i % 2 ? 1 : -1;
          const size = 0.255 - 0.075 * t;
          const p = lockPoint(
            pose,
            -0.4 + 1.02 * t + twist * 0.055,
            side * (1.05 + 0.18 * Math.sin(Math.PI * t) + twist * 0.078),
            -0.49 - 1.34 * t
          );
          b.blob(
            ...p,
            size * fit.rx,
            size * fit.ry,
            (size + 0.045) * fit.rz,
            (x, y, z) => {
              const seam = (side * (y - p[1])) / fit.ry + (twist * 0.67 * (z - p[2])) / fit.rz;
              return Math.abs(seam) < 0.063 ? k.hairLight : x < p[0] ? k.hairShade : k.hair;
            },
            2.35
          );
        }
        b.blob(
          ...lockPoint(pose, 0.65, side * 1.05, -1.99),
          0.16 * fit.rx,
          0.17 * fit.ry,
          0.1 * fit.rz,
          k.accent,
          2.7
        );
        b.blob(
          ...lockPoint(pose, 0.65, side * 1.07, -2.16),
          0.14 * fit.rx,
          0.155 * fit.ry,
          0.19 * fit.rz,
          k.hair
        );
      }
    }

    function drawCurls(b, k) {
      const { x, z, rx, ry, rz } = fit;
      // The lower ring remains visible under a hat. Curls at the temples frame the eyes.
      const rings = surfaceDetails
        ? hasHat
          ? [[14, 0.12, 0.96, 0.17]]
          : [
              [15, 0.3, 0.95, 0.19],
              [16, 0.53, 0.9, 0.2],
              [14, 0.76, 0.73, 0.2],
              [11, 0.92, 0.53, 0.19],
              [7, 1.04, 0.3, 0.16]
            ]
        : hasHat
          ? [[10, 0.1, 0.97, 0.215]]
          : [
              [10, 0.31, 0.97, 0.28],
              [8, 0.7, 0.79, 0.3],
              [6, 1.0, 0.43, 0.25]
            ];
      for (let row = 0; row < rings.length; row++) {
        const [count, h, r, size] = rings[row];
        for (let i = 0; i < count; i++) {
          const angle =
              (2 * Math.PI * (i + 0.39 * row + (surfaceDetails ? 0.12 * Math.sin(2.3 * i + row) : 0))) /
              count,
            u = Math.cos(angle),
            v = Math.sin(angle);
          if (hasHat && u > 0.48) continue;
          const ringHeight =
            h + (row === 0 ? 0.23 * Math.max(0, u) - 0.26 * Math.max(0, -u) : 0) + 0.042 * (i % 3);
          const cz = z + rz * crownHeight(ringHeight);
          const cx = x + rx * (posterior ? posterior.fit(r * u, ringHeight) : r * u),
            cy = r * ry * v;
          const q =
            size * (surfaceDetails ? 0.93 + 0.15 * Math.sin(2.4 * i + 1.7 * row) : 0.91 + 0.075 * (i % 3));
          b.blob(
            cx,
            cy,
            cz,
            rx * q,
            ry * q,
            rz * q * (surfaceDetails ? 0.85 : 1),
            (px, py, pz) => {
              if (surfaceDetails) {
                const across = ((-(px - cx) * v) / rx + ((py - cy) * u) / ry) / q;
                const height = (pz - cz) / (rz * q);
                const curl = ((across + 0.14 * Math.sin(i)) / 0.83) ** 2 + ((height - 0.12) / 0.73) ** 2;
                if (height < -0.61 && across > 0.12) return k.hairDepth;
                if (curl < 0.16 && height < 0.2) return k.hairMid;
                if (curl > 0.31 && curl < 0.73 && height > 0.02 && across < 0.38 && (row + i) % 3 !== 1)
                  return k.hairSheen;
                return across > 0.56 || height < -0.24 ? k.hairMid : k.hair;
              }
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
    function drawInfantKnit(b, k) {
      const { x: cx, z: cz, rx, ry, rz } = fit;
      if (parts.hair === 'curly') {
        // A curl emerging from the front fold follows the child's own forehead.
        const curl = pixelPortrait
          ? [[-0.17, 0.72], [-0.10, 0.67], [-0.015, 0.61], [0.075, 0.60],
            [0.102, 0.55], [0.063, 0.507], [-0.033, 0.495], [-0.084, 0.52]]
          : [[-0.17, 0.66], [-0.09, 0.53], [0.005, 0.46], [0.10, 0.47], [0.12, 0.54], [0.065, 0.57]];
        const locks = curl.map(([v, h]) => {
          const y = v * ry, z = cz + crownHeight(h) * rz;
          return [faceFront(y, z) + (pixelPortrait ? 0.075 : 0.037) * rx, y, z];
        });
        const fullness = pixelPortrait ? 1.46 : 1;
        const curlInk = (_t, dx, dy, dz) => {
          if (!pixelPortrait) return k.hair;
          if (dz > 0.025 * ry && dx > 0) return k.lock6;
          return dy > 0.036 * ry ? k.lock2 : k.lock4;
        };
        for (let i = 1; i < locks.length; i++)
          b.link(locks[i - 1], locks[i], (0.070 - i * 0.006) * ry * fullness,
            (0.065 - i * 0.008) * ry * fullness, 1, curlInk);
      }
      b.stamp(cx - 1.40 * rx, cx + 1.30 * rx, -1.24 * ry, 1.24 * ry, cz - 0.49 * rz,
        cz + crownHeight(1.21) * rz, (x, y, z) => {
          const u = (x - cx) / rx, v = y / ry, h = sliceHeight((z - cz) / rz);
          const theta = Math.atan2(v, (u - 0.07) / 0.94);
          const forward = 0.5 + 0.5 * Math.cos(theta);
          const hem = pixelPortrait ? -0.40 + 1.13 * forward ** 1.18 + 0.065 * swell(forward, 0.43, 0.20)
            : -0.41 + 1.06 * forward ** 1.18 + 0.022 * Math.sin(2 * theta);
          if (h < hem || h > 1.17) return 0;
          const rise = h - hem, folded = 1 - studioRig.ramp(rise, 0.17, 0.25);
          const ribs = folded > 0.5 ? (pixelPortrait ? 23 : 43) : (pixelPortrait ? 12 : 26);
          const phase = theta * ribs + 1.1 * h + 0.34 * Math.sin(theta * 6);
          const rib = Math.cos(phase);
          const ease = 1.065 + folded * 0.060 + 0.012 * rib;
          const rowH = (h + 0.41) / 1.12 - 0.41;
          const slouch = 0.135 * studioRig.ramp(h, 0.12, 1.15);
          const localX = posterior.unfit(0.07 + (u - 0.07 + slouch) / ease, rowH);
          if (!skinShape.insideSkin(skinShape.row(rowH), localX, v / ease)) return 0;
          if (pixelPortrait) {
            const key = 0.47 * Math.cos(theta) - 0.31 * Math.sin(theta) + 0.35 * h;
            const stitch = Math.cos(phase + 1.5 * Math.sin(h * 12 + theta * 2));
            if (rise < 0.026) return k.weave2;
            if (rise > 0.183 && rise < 0.218) return key > 0.19 ? k.weave4 : k.weave3;
            const wale = theta * (folded > 0.52 ? 20 : 15) / Math.PI;
            const column = 2 * Math.abs(wale - Math.round(wale));
            const course = (rise * (folded > 0.52 ? 24 : 17) + 0.23 * Math.sin(theta * 4)) % 1;
            const loop = Math.max(0, 1 - Math.abs(column - 0.70 * course - 0.12) / 0.29);
            const tone = 4.55 + 2.45 * key + 1.08 * rib + 0.36 * stitch + 0.71 * loop - (rib < -0.72 ? 1.04 : 0);
            return k['weave' + clamp(Math.round(tone), 2, 8)];
          }
          if (rise < 0.024 || (rise > 0.19 && rise < 0.225)) return k.knitShade;
          const key = 0.42 * Math.cos(theta) - 0.55 * Math.sin(theta) + 0.21 * h;
          if (rib < -0.45) return key < -0.10 ? k.knitShade : k.knitSeam;
          return key > 0.20 && (folded > 0.5 || rib > 0.45) ? k.hatLight : k.hatMain;
        });
    }
    function drawHead(pose, b, k, bare = false) {
      b.frame(pose.head);
      const { x: cx, z: cz, rx, ry, rz } = fit;
      const blink = clamp(pose.blink || 0, 0, 1),
        eyeHalf = ry * 0.22;
      const face = recipe.face || {};
      const eyes = face.eyes || 'classic',
        brows = face.brows || 'classic';
      const nose = face.nose || 'classic', mouth = mouthName;
      // The close portrait has a softer cheek-to-chin transition. Keep the
      // recipe's jaw width, eye spacing, nose style and calibrated mouth height.
      function contourWidth(h) {
        const chin = clamp((-h - 0.1) / 0.87, 0, 1);
        return jawWidth(h) * (1 - (kind === 'child' ? 0.1 : 0.17) * chin * chin);
      }
      function portraitFront(y, z) {
        const h = (z - cz) / rz,
          v = Math.abs(y / contourWidth(h));
        return cx + rx * Math.cbrt(Math.max(0, 1 - h * h - v * v * v));
      }
      const surface = roundedHead || !b.faceDetail ? faceFront : portraitFront;
      const eyeStyle = pinePortraitStyles.eyes[eyes],
        browStyle = pinePortraitStyles.brows[brows],
        noseStyle = pinePortraitStyles.noses[nose];
      const skinDetails = face.complexion || face.facialHair || face.makeup;
      const drawnEye = animationEye || (illustrated && pinePortraitStyles.illustratedEyeShape(eyes, style, infantFace));
      const acting = facialActing && pineGameFace.expression(recipe.base, face, pose.faceCue, pose.jawOpen, faceInk);
      const drawnBrow = illustrated && pinePortraitStyles.illustratedBrow(brows, style, infantFace);
      const eyePixel = 0.5 / (b.density * rz * eyeOpen);
      // Allow more than a single cell of pigment on the turned surface.
      // A diagonal slice can meet a lid or lip a few cells behind its frontal tangent.
      const paintDepth = paintedFeatures ? .105 * rx + 1.4 / b.density : 0;
      const dyeBrow = !!recipe.colors.brow,
        dyeEye = !!recipe.colors.leftEye;
      function eyebrowInk(off, z) {
        if (pixelPortrait) return pinePixelPortrait.brow(drawnBrow, off / ry,
          (z - eyeZ) / rz - (featureGuide ? (1 - featureGuide.brow) * .072 : 0) - (acting?.brow || 0), k, infant,
          0.5 / (b.density * rz), featureGuide ? featureGuide.brow : 1);
        if (illustrated) return pinePortraitStyles.brow(drawnBrow, off / ry, (z - eyeZ) / rz, k,
          animated && !b.faceDetail ? 0.5 / (b.density * rz) : 0);
        if (browStyle) return pinePortraitStyles.brow(browStyle, off / ry, (z - eyeZ) / rz, k);
        if (b.faceDetail) {
          const q = off / (ry * (brows === 'straight' ? 0.305 : 0.285));
          if (Math.abs(q) >= 1) return 0;
          const arch = brows === 'arched' ? 0.096 : brows === 'straight' ? 0.025 : 0.055;
          const mid = eyeZ + rz * (0.209 + arch * (1 - (q - 0.12) ** 2) + 0.018 * q);
          const width =
            (brows === 'thick' ? 0.077 : 0.049) * (1 - 0.43 * Math.abs(q) - 0.32 * Math.max(0, q));
          const d = (z - mid) / rz;
          if (Math.abs(d) > width) return 0;
          return brows === 'thick' && d < -0.014 && q < 0.55 ? k.lash : k.browSoft;
        }
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
      function eyeInk(off, z, side) {
        if (featureGuide) return pineGameFace.paintedEye(featureGuide, drawnEye, off / ry, (z-eyeZ) / rz, blink, side, k, eyePixel, acting);
        if (gameFace) return pineGameFace.eye(drawnEye, off / ry, (z-eyeZ) / rz, blink, side, k, eyePixel);
        if (pixelPortrait && pixelStructure)
          return pinePixelPortrait.structureEye(drawnEye, off / ry, (z - eyeZ) / rz, blink, side, k, eyePixel);
        if (pixelPortrait && modelAnatomy)
          return pinePixelPortrait.orbitEye(drawnEye, off / ry, (z - eyeZ) / rz, blink, side, k, eyePixel);
        if (pixelPortrait && tailored)
          return pinePixelPortrait.modelEye(drawnEye, off / ry, (z - eyeZ) / rz, blink, side, k, eyePixel);
        if (pixelPortrait) return pinePixelPortrait.eye(drawnEye, off / ry, (z - eyeZ) / rz, blink, side, k, eyePixel, !b.faceDetail);
        if (illustrated) return pinePortraitStyles.illustratedEye(drawnEye, off / ry, (z - eyeZ) / rz, blink, side, k, eyePixel, style, !b.faceDetail);
        if (eyeStyle) return pinePortraitStyles.eye(eyeStyle, off / ry, (z - eyeZ) / rz, blink, side, k, infant ? 1.22 : 1);
        if (b.faceDetail) {
          const halfWidth = eyes === 'round' ? 0.24 : eyes === 'almond' ? 0.272 : 0.251;
          const q = off / (ry * halfWidth);
          if (Math.abs(q) >= 1) return 0;
          const round = eyes === 'round',
            slim = eyes === 'narrow';
          const curve = round ? Math.sqrt(1 - q * q) : 1 - q * q;
          const center = eyeZ + rz * ((eyes === 'almond' ? 0.052 : 0.021) * q - 0.043 * blink);
          const h = (z - center) / rz;
          const top = (slim ? 0.061 : round ? 0.135 : 0.101) * curve * (1 - blink);
          const bottom = -(slim ? 0.046 : round ? 0.095 : 0.066) * curve * (1 - blink);
          if (h > top + 0.025 || h < bottom - 0.012) return 0;
          if (blink > 0.87 || h > top - 0.016) return k.lash;
          if (h < bottom + 0.006 && q > 0.2) return k.browSoft;
          const iris = (q / (infant ? 0.60 : 0.49)) ** 2 + ((h - 0.012) / (round ? 0.134 : 0.105)) ** 2;
          if (iris > 1) return k.sclera;
          if (side * q > -0.28 && side * q < -0.1 && h > 0.014 && h < 0.059) return k.glint;
          if (iris < 0.23) return k.pupil;
          return h < -0.014 && iris < 0.86 ? k.irisLight : k.eyes;
        }
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
        if (inkMouth) return inkMouth.paint((y-mouthY)/(ry*lipSpan),(z-mouthZ)/rz,k,.5/(b.density*rz));
        const a = Math.abs(y - mouthY) / (ry * lipSpan);
        const radius = rz * (z >= mouthZ ? upperLipScale : lowerLipScale);
        const h = (z - mouthZ) / radius;
        if (featureGuide) return pineGameFace.paintedMouth(featureGuide, mouth, drawnMouth,
          (y-mouthY)/(ry*lipSpan), (z-mouthZ)/rz, k, .5/(b.density*rz), upperLipScale, lowerLipScale, acting);
        if (gameFace) return pineGameFace.lip(mouth,drawnMouth,(y-mouthY)/(ry*lipSpan),h,infant,k,.5/(b.density*rz),drawnMix);
        if (pixelPortrait && tailored)
          return pinePixelPortrait.modelMouth(mouth, drawnMouth, (y - mouthY) / (ry * lipSpan), h, infant && !pixelStructure, k, 0.5 / (b.density * rz));
        if (pixelPortrait && (b.faceDetail || (infant && liftedCorners)))
          return pinePixelPortrait.mouth(mouth, drawnMouth, (y - mouthY) / (ry * lipSpan), h, infant, k);
        if (animated) return b.faceDetail ? pinePortraitStyles.animationMouth(drawnMouth, a, h, k, 0.5 / (b.density * radius), infant)
          : pinePortraitStyles.figureMouth(mouth, a, h, lipWidth, 0.5 / (b.density * rz), k);
        if (illustrated && !lipStyle) {
          const q = a / lipWidth;
          if (q >= 1.10) return 0;
          const curve = Math.max(0, 1 - q * q);
          const seam = lipLift * Math.min(q * q, 1) - 0.008;
          const dy = h - seam, pitch = 0.5 / (b.density * rz * (z >= mouthZ ? upperLipScale : lowerLipScale));
          const line = Math.max(0.013, pitch * 1.08) * (1 - 0.33 * q * q);
          if (Math.abs(dy) < line) return k.lipLine;
          const up = mouth === 'full' ? 0.095 : 0.061;
          const down = mouth === 'full' ? 0.099 : 0.062;
          const peak = 1 - 0.32 * Math.min(1, Math.abs(q - 0.32) * 2.2);
          if (dy > 0 && dy < curve * up * peak + pitch * 0.20) return k.upperLip;
          if (dy < 0 && -dy < curve * down + pitch * 0.22) return k.lowerLip;
          return 0;
        }
        if (editableProfile && (!infant || infantFace) && Math.abs(h) < 0.20) {
          // Carry the narrow closure around the turning surface at each corner.
          // Cover a sample at figure scale as well as in a close portrait.
          const q = a / lipWidth;
          if (q > 0.58 && q < 1.12) {
            const seam = lipLift * Math.min(q * q, 1) - 0.008;
            const radius = (0.019 + 0.43 / (b.density * rz)) * (1 - 0.58 * studioRig.ramp(q, 0.85, 1.12));
            if (Math.abs(h - seam) <= radius) return k.lipLine;
          }
        }
        if (lipStyle) {
          const color = pinePortraitStyles.mouth(lipStyle, a, h, k, 0.5 / (b.density * rz));
          // Preserve the two peaks of the cupid's bow at the full-figure sampling pitch.
          if (headShape && mouth === 'bow' && a > 0.045 && a < 0.15 && h > 0.005 && h < 0.105)
            return k.upperLip;
          if (headShape && mouth === 'bow' && color && a < 0.085 && h > -0.045 && h < 0.05) return k.lipLine;
          return color;
        }
        if (b.faceDetail) {
          const width =
            mouth === 'small' ? 0.184 : mouth === 'full' ? 0.284 : mouth === 'smile' ? 0.309 : 0.263;
          const q = a / width;
          if (q >= 1) return 0;
          const curve = 1 - q * q;
          const seam = (mouth === 'smile' ? 0.102 : 0.034) * q * q - 0.008;
          const upper =
            (mouth === 'full' ? 0.092 : 0.061) *
            curve *
            (0.64 + 0.36 * Math.max(0, 1 - 3 * Math.abs(q - 0.3)));
          const lower = (mouth === 'full' ? 0.099 : 0.062) * curve;
          if (h > seam + upper || h < seam - lower) return 0;
          if (Math.abs(h - seam) < 0.019 || q > 0.88) return k.lipLine;
          return h > seam ? k.upperLip : k.lowerLip;
        }
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
      const rearX = cx - (headShape ? 1.315 : roundedHead ? 1.25 : 1) * rx,
        frontX = cx + (headShape ? 1.38 : roundedHead ? 1.1 : 1) * rx;
      const headHalf = faceOutline ? 1.22 * ry : 1.075 * ry;
      const jawFrame = articulatedJaw && pose.jawLocal;
      const inkMouth = faceInk && pineGameFace.mouthBrush(recipe.base,featureGuide,mouth,drawnMouth,upperLipScale,lowerLipScale,acting,softProfile,softPixels);
      const movingRims = softProfile && jawFrame && pose.jawOpen > .06;
      const lipHalf = (inkMouth ? inkMouth.width : lipWidth) * lipSpan * (1 + (softProfile ? -.08 : .13) * (pose.jawOpen || 0));
      const smallLipBack = b.smallMouthOffset && !movingRims ? faceFront(mouthY,mouthZ)-.56*ry*lipHalf : Infinity;
      if (headShape && !adjustableJaw) {
        // The source jaw sits in front of the hinge. Carry the nape up inside the jaw
        // so a nod or a turn cannot expose a gap between the mandible and the collar.
        b.link(
          [rig.neck[0], 0, rig.neck[2] - 0.12 * rz],
          [cx + 0.03 * rx, 0, cz - 0.47 * rz],
          0.36 * rx,
          0.46 * rx,
          1.06,
          (t, x, y) => (x > 0 && Math.abs(y) < 0.23 * ry ? k.skin : k.underJaw)
        );
      }
      b.stamp(rearX, frontX, -headHalf, headHalf, cz - rz - (jawFrame ? 0.45 * rx : 0), cz + crownHeight(1) * rz, (x, y, z) => {
        let rimInk = movingRims ? 0 : undefined;
        if (jawFrame && z < mouthZ + 0.14 * rz) {
          // Inverse skinning at each destination voxel keeps the lip edges solid through rotation.
          const forward = (x - cx) / rx, across = Math.abs(y) / ry;
          const dx = x - jawFrame[3], dz = z - jawFrame[11];
          const restX = jawFrame[0] * dx + jawFrame[8] * dz;
          const restZ = jawFrame[2] * dx + jawFrame[10] * dz;
          const front = studioRig.ramp(forward, hingeForward - 0.15, 0.76);
          const cheekTop = rig.jawPivot[2] - (rig.jawPivot[2] - mouthZ) * front;
          const below = 1 - studioRig.ramp(z, cheekTop - 0.32 * rz, cheekTop + 0.055 * rz);
          const rear = studioRig.ramp(forward, hingeForward - 0.54, hingeForward + 0.05);
          let weight = below * rear;
          let cheekInset = 0;
          if (forward > 0.57 && across < 0.70) {
            const q = across / lipHalf, corner = clamp(1 - q * q, 0, 1);
            const curve = inkMouth ? inkMouth.seam(q) : animated ? drawnMouth[4] * Math.min(1, q ** 2.45) : lipLift * Math.min(1, q * q);
            const seam = mouthZ + rz * curve;
            const rimFront = movingRims && q < 1 ? surface(y,seam) : undefined;
            const lower = jawFrame[8] * (rimFront ?? (x - jawFrame[3] - jawFrame[2] * seam) / jawFrame[0]) +
              jawFrame[10] * seam + jawFrame[11];
            const gap = Math.max(0, seam - lower) * corner;
            if (rimFront !== undefined) {
              const distance = z >= seam ? z-seam : seam-gap-z;
              const lowerFront = jawFrame[0]*rimFront+jawFrame[2]*seam+jawFrame[3];
              const edge = z >= seam ? rimFront : rimFront+(lowerFront-rimFront)*corner;
              rimInk = Math.abs(x-edge) <= .035*rx+1/b.density ? inkMouth.rim(y/(ry*lipHalf),distance/rz,z>=seam,k) : 0;
            }
            const opening = z >= seam ? 0 : clamp((seam - z) / Math.max(0.01 * rz, seam - lower), 0, 1);
            // The mouth corners recede as the lower lip descends. A protruding cheek
            // here would hide both lips in profile even when the jaws are far apart.
            cheekInset = 0.21 * rx * pose.jawOpen * Math.sin(Math.PI * opening) *
              studioRig.ramp(across, lipHalf * 0.6, lipHalf) * (1 - studioRig.ramp(across, lipHalf * 1.15, 0.70)) *
              studioRig.ramp(forward, 0.57, 0.85);
            if (gap > 0 && z < seam && z > seam - gap) {
              const t = (seam - z) / gap;
              const frontLip = rimFront ?? surface(y, seam);
              // In profile the inner lip turns back into the mouth. Its lower edge
              // travels with the mandible as it opens around the ear-side joint.
              const lowerFront = planes ? jawFrame[0] * frontLip + jawFrame[2] * seam + jawFrame[3] : frontLip;
              const edge = frontLip + (lowerFront - frontLip) * t * corner;
              const inset = rx * pose.jawOpen * corner * (planes
                ? 0.023 + 0.064 * Math.sin(Math.PI * t) : 0.055 + 0.19 * Math.sin(Math.PI * t));
              if (x > edge - inset) return 0;
              if (x > frontLip - 0.42 * rx) {
                if (softPixels) return t > .65+.11*q*q ? k.oralTongue : t < .36 && q < .75 ? k.oralShade : k.oralWall;
                return t > 0.78 ? k.oralTongue : k.oralShade;
              }
            }
            const followLip = 1 - studioRig.ramp(across, lipHalf * 0.7, lipHalf * 1.46);
            weight += (opening - weight) * followLip * studioRig.ramp(forward, 0.58, 0.83);
          }
          weight *= 1 - studioRig.ramp(z, mouthZ + 0.035 * rz, mouthZ + 0.14 * rz);
          x += weight * (restX - x) + cheekInset;
          z += weight * (restZ - z);
        }
        const h = sliceHeight((z - cz) / rz),
          u = (x - cx) / rx;
        let section, localX, lateral, jawShade = 0;
        if (headShape) {
          // A rotated stamp visits the enclosing world-space box. The open throat ring must
          // stop at its local lower plane; the moving neck supplies the volume below it.
          if (fittedJaw && h < -1) return 0;
          if (!gameFace && adjustableJaw && h < (pixelPortrait ? -.48 : jawContour || fittedFace ? -0.70 : -0.77)) {
            // Let the neck supply the back of this ring. Only the pad at the front
            // is rigidly part of the skull; otherwise a nod drags the collar with it.
            const f = clamp((u - 0.19) / 0.68, 0, 1);
            const nape = clamp((0.1 - u) / 0.48, 0, 1);
            const lower =
              -0.882 -
              0.058 * f * f * (3 - 2 * f) -
              0.045 * nape * nape * (3 - 2 * nape) +
              0.015 * (shape.chinHeight || 0) * f;
            const lift = jawContour ? jawContour.lift *
              swell((u - angleForward) / jawContour.span, 0.52, 0.48) : 0;
            const roundPad = fittedFace ? (infant ? 0.069 : 0.053 * profileStrength) * studioRig.ramp(u, 0.54, 1.0) : 0;
            if (pixelPortrait) {
              const along = studioRig.ramp(u, hingeForward - 0.10, 0.98);
              const nape = studioRig.ramp(-u, 0.03, 0.60);
              const outside = studioRig.ramp(Math.abs(y) / ry, 0.18, 0.66);
              let sideFloor = (infant ? -0.60 : -0.55) - (infant ? 0.292 : 0.337) * along
                - 0.11 * nape + 0.047 * (shape.jawAngle || 0) * (1 - along)
                + 0.025 * (shape.chinHeight || 0) * along;
              if (skinPlanes?.form?.pixelStructure) {
                const jawSpan = (sockets.chinTip.point[0] - cx) / rx - angleForward;
                const t = studioRig.ramp(u, angleForward - 0.08, angleForward + jawSpan);
                // The soft border starts below the actual angle and rounds
                // under the moving chin. The infant has a fuller lower pad.
                const atEar = angleHeight - (infant ? 0.100 : 0.065);
                const atChin = chinH - (infant ? 0.12 : 0.10);
                sideFloor = atEar + (atChin - atEar) * t - 0.10 * nape;
              }
              // Lift the angle under each ear and keep the soft midline
              // under the chin connected to the moving front of the neck.
              const throatFloor = lower - 0.095;
              if (h < throatFloor + outside * (sideFloor - throatFloor)) return 0;
            } else if (h < lower + lift + roundPad) return 0;
          }
          section = skinShape.row(h);
          localX = posterior.unfit(u, h);
          lateral = y / (ry * breadthScale(h));
          if (!gameFace && jawContour && h < -0.36) {
            const t = clamp((u - angleForward) / jawContour.span, 0, 1);
            const edge = angleHeight + (jawContour.chinEdge - angleHeight) * t - 0.062 * t * (1 - t);
            const side = studioRig.ramp(u, angleForward - 0.24, angleForward + 0.10);
            const below = edge - h;
            jawShade = side * studioRig.ramp(below, -0.035, jawContour.feather);
            // Round or tuck the volume below the bone. Taper out before the chin pad.
            lateral *= 1 + jawContour.taper * jawShade * (1 - studioRig.ramp(t, 0.75, 1));
            jawShade *= 1 - 0.45 * studioRig.ramp(below, 0.13, 0.32);
            if (fittedFace) jawShade *= 1 - 0.75 * studioRig.ramp(t, 0.54, 0.99);
          }
          if (!gameFace && mandible && z < mouthZ && Math.abs(u - angleForward) < 0.43 && Math.abs(h - angleHeight) < 0.23) {
            // Keep a small volume at the gonion under the ear, clear of the midline throat.
            const side = Math.max(0, 1 - ((u - angleForward) / 0.43) ** 2 - ((h - angleHeight) / 0.23) ** 2);
            const belowLip = studioRig.ramp(mouthZ - z, 0, 0.10 * rz);
            lateral /= 1 + (kind === 'adult' ? 0.062 : 0.036) * side * side * belowLip;
          }
          if (!skinShape.insideSkin(section, localX, lateral)) return 0;
        } else if (roundedHead) {
          const dx = u - skullAxis(h),
            depth = dx / (dx < 0 ? rearDepth(h) : forehead);
          const v = y / ovalWidth(h);
          if (depth * depth + v * v + h * h > 1) return 0;
        } else {
          const v = y / (b.faceDetail ? contourWidth(h) : jawWidth(h)),
            u2 = u * u,
            v2 = v * v;
          if ((b.faceDetail ? Math.abs(u) * u2 + Math.abs(v) * v2 : u2 * u2 + v2 * v2) + h * h > 1) return 0;
        }
        const a = Math.abs(y),
          off = a - eyeY;
        if (u > (pixelPortrait ? .40 : .49) && Math.abs(off) < (pixelPortrait ? .48 : animated ? 0.42 : 0.345) * ry * Math.max(1, eyeSpan) &&
            (!animated || x >= faceFront(y, z) - (paintedFeatures ? paintDepth : (pixelPortrait ? 3.8 : 1.40) / b.density))) {
          const browZ = infant ? eyeZ + (z - browLift - eyeZ) / feature.browHeight : z - browLift;
          const browInk = eyebrowInk(off / feature.browWidth, browZ);
          if (browInk) {
            if (animated && browInk === k.browVeil) return browInk;
            if (illustrated || infant) return browInk === k.browSoft ? k.browSoft : k.browDeep;
            return dyeBrow ? (browInk === k.browSoft ? k.browPigment : k.browDeep) : browInk;
          }
          // Coordinates along the curved lid, in its local tangent plane. At a
          // profile view the iris recedes behind the cornea and outer canthus.
          const eyeOff = (layout ? off : gameFace ? off - .16 * (faceFront(y,eyeZ)-eyeX) : modelAnatomy && pixelPortrait ? .86 * off - .085 * (faceFront(y,z)-eyeX) : pixelPortrait ? .99 * off - .075 * (faceFront(y,z)-eyeX) : animated ? 0.93 * off - 0.37 * (faceFront(y, z) - eyeX) : off) / eyeSpan;
          const lidZ = individual ? eyeZ + (z - eyeZ - eyeCant * eyeOff / (0.26 * ry)) / eyeOpen : z;
          const side = Math.sign(y),
            color = eyeInk(eyeOff, lidZ, side);
          if (color)
            return face.iris || dyeEye
              ? pinePortraitStyles.iris(face.iris, color, eyeOff / ry - (acting ? side*acting.across*1.06*drawnEye.width : 0),
                  (lidZ - eyeZ) / rz - (acting ? acting.up*drawnEye.up : 0), side, dyeEye, k)
              : color;
        }
        if (u > lipFrontLimit) {
          if (!illustrated && mouth === 'classic' && !b.faceDetail && (!editableProfile || infant)) {
            if (Math.abs(y - mouthY) < 0.19 * ry * lipSpan &&
              Math.abs(z - mouthZ) < 0.068 * rz * (z >= mouthZ ? upperLipScale : lowerLipScale)) return k.lips;
          } else {
            const color = rimInk ?? lipInk(y, z);
            if (color && (!paintedFeatures || x >= faceFront(y,z) - paintDepth)) return color;
          }
        }
        if (skinDetails) {
          const pigment = pinePortraitStyles.skinInk(
            face,
            u,
            y / ry,
            h,
            (eyeZ - cz) / rz,
            (mouthZ - cz) / rz,
            eyeY / ry,
            k
          );
          if (pigment) return pigment;
        }
        if (!surfaceDetails && (roundedHead ? h > 0.72 : h > 0.63 || (u < -0.52 && h > -0.6))) return k.hair;
        if (headShape) {
          if (gameFace) {
            const oralLight = inkMouth && localX > section.axis
              ? inkMouth.surroundingLight((y-mouthY)/(ry*lipSpan),(z-mouthZ)/rz,(layout ? skinShape.noseBase : skinShape.tip)-mouthH) : 0;
            const skin = pineGameFace.skin(skinShape,section,localX,lateral,h,eyeLevel,infant,k,planeMaterials,paintedFeatures,facialActing,oralLight);
            if (x >= smallLipBack && u > lipFrontLimit && inkMouth.smallAccent((y-mouthY)/(ry*lipSpan),(z-mouthZ)/rz) &&
                x >= faceFront(y,z)-paintDepth) return skin+b.smallMouthOffset;
            return skin;
          }
          const dx = localX - section.axis;
          if (skinPlanes?.form?.pixelStructure) {
            const index = dx <= 0 ? headShape.lateralSteps : Math.min(headShape.lateralSteps,
              Math.round(Math.abs(lateral / section.width) * headShape.lateralSteps));
            let light = section.frontLight[index] + Math.sign(y) * section.sideLight[index];
            if (dx < 0) {
              const back = 0.465 + 0.038 * h - 0.035 * Math.sign(y);
              light += (back - light) * studioRig.ramp(-dx / Math.max(0.01, section.rear), 0, 0.85);
            }
            // One continuous skin ramp spans both sides of the mandible. Keep
            // its cast shadow on the underside instead of across the lower ear.
            const forward = studioRig.ramp(u, angleForward - 0.14, 1.01);
            const border = angleHeight + (chinH - 0.035 - angleHeight) * forward;
            const under = studioRig.ramp(border - h, -0.03, infant ? 0.18 : 0.15);
            const cheek = swell(Math.abs(y) / ry, infant ? 0.53 : 0.56, infant ? 0.40 : 0.37)
              * swell(h, mouthH + (infant ? 0.16 : 0.21), 0.26) * studioRig.ramp(u, 0.22, 0.73);
            light += (infant ? 0.021 : 0.028) * cheek - (infant ? 0.049 : 0.074) * under;
            // The darker half of this skin ramp has larger value intervals.
            // Keep those intermediate values at the turn of the near cheek.
            const tone = clamp(5 + Math.round((light - 0.51) * 21), 3, 10);
            return k[planeMaterials[(cheek > 0.33 ? 12 : 0) + tone]];
          }
          if (jawContour && !infant && h < -0.36) {
            if (!animated) {
              if (jawShade > 0.76) return k.jawPlane0;
              if (jawShade > 0.46) return k.jawPlane1;
              if (jawShade > 0.20) return k.jawPlane2;
            }
          } else if (planes && h < -0.36) {
            // The shaded underside rises from the chin to the lateral angle below the ear.
            // The angle and chin controls move both the surface and its turning plane.
            const along = clamp((u - angleForward) / (0.96 - angleForward), 0, 1);
            const edge = angleHeight + (-0.84 + 0.055 * (shape.chinHeight || 0) - angleHeight) * along;
            const side = studioRig.ramp(u, angleForward - 0.30, angleForward + 0.09);
            const under = studioRig.ramp(edge - h, -0.038, 0.17) * side;
            if (under > 0.77) return k.neckTone0;
            if (under > 0.49) return k.neckTone1;
            if (under > 0.24) return k.neckTone2;
          } else if (adjustableJaw && !infantFace && h < -0.54) {
            // Submental shadow is local to the underside. It loses contrast toward
            // the ear instead of drawing a diagonal seam across the whole neck.
            const along = clamp((u - 0.07 - 0.12 * (shape.jawPosition || 0)) / 0.89, 0, 1);
            const border =
              -0.62 -
              0.205 * along +
              0.032 * (shape.chinHeight || 0) * along +
              0.032 * (shape.jawAngle || 0) * (1 - along);
            const shade = clamp((border - h) / 0.11, 0, 1) * clamp((u + 0.17) / 0.54, 0, 1);
            if (shade > 0.68) return jawContour ? k.jawPlane0 : k.neckTone0;
            if (shade > 0.4) return jawContour ? k.jawPlane1 : k.neckTone1;
          } else if (fittedJaw && !adjustableJaw && h < -0.4) {
            const along = clamp((u + 0.18) / 1.17, 0, 1);
            const border =
              -0.48 -
              0.35 * along * along * (3 - 2 * along) -
              0.052 * (1 - Math.min(1, Math.abs(lateral) / 0.66));
            const below = border - h;
            const shadowWidth =
              0.115 * clamp((u + 0.15) / 0.42, 0, 1) * (0.4 + 0.6 * Math.min(1, Math.abs(lateral) / 0.55));
            if (below > 0.018 && below < 0.018 + shadowWidth) return k.jawShade;
            if (below > -0.025) return k.underJaw;
          }
          if (pixelPortrait) {
            const index = dx <= 0 ? headShape.lateralSteps : Math.min(headShape.lateralSteps,
              Math.round(Math.abs(lateral / section.width) * headShape.lateralSteps));
            let light = section.frontLight[index] + Math.sign(y) * section.sideLight[index];
            if (dx < 0) {
              const back = 0.47 + 0.082 * h - 0.046 * Math.sign(y);
              light += (back - light) * studioRig.ramp(-dx / Math.max(0.01, section.rear), 0, 0.94);
            }
            // The shadow follows the line from the ear-side angle to the pad.
            // It crosses the midline softly where the jaw rolls into the throat.
            const along = studioRig.ramp(u, angleForward - 0.14, 1.03);
            const edge = angleHeight + (chinH - 0.038 - angleHeight) * along;
            const underside = infant ? 0 : studioRig.ramp(edge - h, -0.042, 0.095);
            return pinePixelPortrait.complexion(y / ry, h, light, dx / Math.max(0.05, section.fore),
              eyeLevel, mouthH, infant, k, planeMaterials, underside, tailored);
          }
          if (dx > 0) {
            const j = Math.min(
              headShape.lateralSteps,
              Math.round(Math.abs(lateral / section.width) * headShape.lateralSteps)
            );
            const diffuse = section.frontLight[j] + Math.sign(y) * section.sideLight[j];
            const light = animated ? diffuse - 0.045 * jawShade : diffuse;
            if (animated) {
              const cy = a / ry;
              const cheek = Math.max(0, 1 - ((cy - 0.57) / 0.40) ** 2 -
                ((h - mouthH - (infant ? 0.19 : 0.25)) / (infant ? 0.25 : 0.28)) ** 2);
              const warm = Math.round(3 * cheek * cheek);
              const tone = clamp(Math.round((light + 0.046 * cheek - 0.24) * 16), 0, 11);
              return k[planeMaterials[12 * warm + tone]];
            }
            if (!fittedJaw && h < -0.56 && light < 0.28) return k.underJaw;
            if (light < 0.08) return k.faceEdge;
            if (light < 0.25) return k.templeSkin;
            if (light < 0.43) return k.faceMid;
            const flushHeight = individual ? skinShape.cheekCenter - 0.05 : -0.203;
            if (h < flushHeight + 0.163 && h > flushHeight - 0.157 && a > 0.34 * ry && a < 0.88 * ry) {
              const flush = ((a / ry - 0.61) / 0.23) ** 2 + ((h - flushHeight) / 0.135) ** 2;
              if (illustrated && flush >= 0.40 && flush < 1.20 && light < 0.79) return k.cheekVeil;
              if (flush < 0.85 && light < 0.79) return k.cheekWarm;
            }
            if (light < 0.58) return k.foreheadSkin;
            return light < 0.835 ? k.faceLight : k.cheekLight;
          }
          const facing = dx / Math.max(0.01, section.rear);
          if (animated) {
            const edge = section.frontLight[headShape.lateralSteps] + Math.sign(y) * section.sideLight[headShape.lateralSteps];
            const back = 0.47 + 0.082 * h - 0.046 * Math.sign(y);
            const light = edge + (back - edge) * studioRig.ramp(-facing, 0, 0.94);
            return k[planeMaterials[clamp(Math.round((light - 0.24) * 16), 0, 11)]];
          }
          const illumination = 0.48 * facing + 0.39 * h - 0.12 * Math.max(0, a / ry - 0.5);
          if (!fittedJaw && h < -0.59) return k.underJaw;
          if (illumination < -0.25) return k.faceEdge;
          return illumination < 0.01 ? k.templeSkin : k.faceMid;
        }
        if (b.faceDetail) {
          const blush = ((a / ry - 0.62) / 0.22) ** 2 + ((z - eyeZ + 0.275 * rz) / (0.13 * rz)) ** 2;
          if (u > 0.35 && blush < 1.25) return blush < 0.54 ? k.rose : k.roseVeil;
          if (u < 0.2 || (h < -0.66 && u < 0.57)) return k.faceEdge;
          return u > 0.69 && h > -0.72 ? k.faceLight : k.faceMid;
        }
        if (u > 0.47 && a > ry * 0.64 && z > mouthZ + 0.09 * rz && z < eyeZ - 0.11 * rz) return k.cheek;
        return u > 0.4 ? k.skinLight : h < -0.42 ? k.skinShade : k.skin;
      });
      for (const side of [-1, 1]) {
        if (headShape) {
          if (pixelPortrait) {
            // A flared helix makes the ear readable in frontal and oblique portraits.
            // The concha still surrounds the original ear-canal socket.
            const anchor = sockets.leftEarCanal.point, wide = (infant ? .240 : .207)*neutralRx;
            const tall = (infant ? .235 : .243)*rz;
            b.stamp(anchor[0]-1.3*wide,anchor[0]+1.3*wide,side*ry-.42*ry,side*ry+.42*ry,
              anchor[2]-1.24*tall,anchor[2]+1.08*tall,(x,y,z)=>{
                const t=(z-anchor[2])/tall, forward=(x-anchor[0])/wide+.14*t;
                const seat=earSeats[clamp(Math.round(((z-earZ)/rz+.077)/.241*24+24),0,48)];
                const out=(side*y/ry-seat-.065+.070*forward)/.18;
                if (forward*forward/(1+.16*t)+t*t+out*out>1) return 0;
                return pinePixelPortrait.ear(forward,t,out,k);
              });
            continue;
          }
          const margin = (earSeats ? 0.36 : 0.23) * ry;
          b.stamp(
            neutralX - 0.4 * neutralRx,
            neutralX + 0.17 * neutralRx,
            side * ry - margin,
            side * ry + margin,
            earZ - 0.34 * rz,
            earZ + 0.17 * rz,
            (x, y, z) => {
              const seatT = ((z - earZ) / rz + 0.077) / 0.241;
              const t = infantFace ? seatT / 0.84 : seatT;
              const earX = pineHeadShape.earPlane + 0.043 * t;
              const forward = ((x - neutralX) / neutralRx - earX) / ((0.201 + 0.029 * t) * (infantFace ? 0.83 : 1));
              const across = earSeats
                ? ((side * y) / ry - earSeats[clamp(Math.round((seatT + 1) * 24), 0, 48)]) / 0.12
                : ((side * y) / ry - 0.966 - 0.025 * t) / 0.155;
              if (forward * forward + across * across + t * t > 1) return 0;
              const fold = ((forward + 0.07) / 0.55) ** 2 + ((t - 0.04) / 0.63) ** 2;
              if (infantFace) {
                if (across > 0.36 && fold < 0.66) return forward < 0.07 || t < -0.16 ? k.noseShade : k.cheekWarm;
                return forward > -0.57 && t > -0.54 ? k.foreheadSkin : k.faceMid;
              }
              if (across > 0.38 && fold < 0.56) return k.noseShade;
              if (across > 0.3 && fold < 1.13 && forward < 0.08) return k.faceMid;
              return t > -0.55 && forward > -0.74 ? k.skinLight : k.skin;
            }
          );
          continue;
        }
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
      // The art cage already includes its bridge, tip and both wings.
      if (!gameFace) {
        const noseZ = eyeZ - 0.205 * rz,
          noseX = faceFront(0, noseZ) - 0.1 * rx;
        if (noseStyle || individual)
          pinePortraitStyles.nose(noseStyle || pinePortraitStyles.basicNoses[nose], b, k, noseFit, eyeZ, surface, noseSpan, noseRise, feature.noseReach, !!planes || infantFace, style, noseContour, pixelPortrait);
        else if (b.faceDetail) {
          const root = eyeZ + 0.1 * rz,
            tip = eyeZ - (nose === 'button' ? 0.26 : 0.32) * rz;
          const width = ry * (nose === 'wide' ? 0.224 : nose === 'button' ? 0.158 : 0.172);
          const reach = rx * (nose === 'bridge' ? 0.255 : nose === 'button' ? 0.155 : 0.197);
          b.stamp(cx + 0.51 * rx, cx + 1.31 * rx, -width, width, tip - 0.105 * rz, root, (x, y, z) => {
            const q = y / width,
              t = (root - z) / (root - tip);
            if (t < 0 || Math.abs(q) >= 1) return 0;
            const ridge =
              Math.max(0, 1 - (q / (0.43 + 0.17 * t)) ** 2) * clamp(t, 0, 1) * clamp((1.17 - t) / 0.28, 0, 1);
            const bulb = Math.max(0, 1 - (q / 0.64) ** 2 - ((z - tip) / (0.099 * rz)) ** 2);
            const wing = Math.max(
              0,
              1 - ((Math.abs(q) - 0.61) / 0.39) ** 2 - ((z - tip + 0.033 * rz) / (0.064 * rz)) ** 2
            );
            const lift = Math.max(ridge, bulb, 0.48 * wing);
            if (lift < 0.045) return 0;
            const front = surface(y, z);
            if (x < front - 0.1 * rx || x > front + reach * lift) return 0;
            if (wing > 0.22 && z < tip - 0.036 * rz && Math.abs(q) > 0.4 && Math.abs(q) < 0.72)
              return k.noseShade;
            if (z < tip - 0.023 * rz) return k.faceEdge;
            if (q > 0.32) return k.faceMid;
            return q > -0.29 && q < 0.05 && t > 0.24 && z > tip ? k.noseLight : k.faceLight;
          });
        } else if (nose === 'button') {
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
      }
      // Reproduce the lip geometry of pinned releases through 1.5.0.
      if (!surfaceDetails) {
        if (mouth === 'classic' && !b.faceDetail && !roundedHead) {
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
            mouthY - (roundedHead ? 0.32 : 0.3) * ry,
            mouthY + (roundedHead ? 0.32 : 0.3) * ry,
            mouthZ - 0.18 * rz,
            mouthZ + 0.24 * rz,
            (x, y, z) => {
              const color = lipInk(y, z);
              if (!color) return 0;
              const front = surface(y, z);
              const reach = roundedHead
                ? lipReach * Math.max(0.12, 1 - ((y - mouthY) / (0.32 * ry)) ** 2)
                : (mouth === 'full' ? 0.58 : mouth === 'small' ? 0.29 : 0.36) * s;
              return x >= front - 0.32 * s && x <= front + reach ? color : 0;
            }
          );
        }
      }
      if (bare) { b.frame(null); return; }
      const bob = hairstyle === 'bob',
        bun = hairstyle === 'bun';
      const long = bob ? 0.255 : 0,
        crown = hasHat ? 1.018 : 1.075;
      const { mix, ramp } = studioRig;
      function archivedRoundHair(u, v, h) {
        // The hair follows the skull, with continuous transitions over the ear
        // and down to the nape. The part adds volume to one side of the crown.
        const short = hairstyle === 'crop' || hairstyle === 'side-part';
        const lift =
          short && !hasHat ? 0.07 * Math.max(0, 1 - ((v + 0.24) / 0.8) ** 2) * ramp(u, -0.7, 0.32) : 0;
        const hh = ((h - 0.024) * (bob && h < 0 ? 0.76 : 1)) / (crown + lift);
        const volume = hasHat ? 1.026 : bob ? 1.09 : 1.055;
        const dx = u - skullAxis(hh) + 0.022;
        const depth = dx / (volume * (dx < 0 ? occiput : forehead));
        const side = v / volume;
        if (depth * depth + side * side + hh * hh > 1) return 0;
        const nape = (bob ? -1.02 : bun ? -0.7 : -0.82) + 0.27 * v * v;
        const temple = bob ? -0.8 : -0.15 - 0.23 * Math.max(0, 1 - ((u - 0.24) / 0.32) ** 2);
        let fringe = (bun ? 0.5 : 0.41) + 0.15 * v;
        if (loose) {
          const part = hairstyle === 'long-waves' ? -0.32 : 0.08;
          fringe = 0.37 + 0.29 * Math.max(0, 1 - 1.45 * Math.abs(v - part)) - 0.075 * Math.abs(v);
        } else if (hairstyle === 'side-part') fringe = 0.42 + 0.34 * v;
        const edge = mix(mix(nape, temple, ramp(u, -0.85, -0.04)), fringe, ramp(u, 0.12, 0.65));
        if (h < edge) return 0;
        const sweep =
          v +
          0.24 * u +
          0.09 * h +
          (hairstyle === 'side-part' ? -0.22 : hairstyle === 'long-waves' ? 0.24 : -0.1);
        if (h > 0.45 && u > -0.57) {
          if (Math.abs(sweep) < 0.052) return k.hairMid;
          if (sweep > -0.25 && sweep < -0.12 && h > 0.55) return k.hairSheen;
        }
        // Locks sweep around the occiput and taper as they reach the hairline.
        const lock = Math.cos(14 * v + 2.4 * h + 2.8 * u * v + 2.0 * h * h);
        const light = 0.36 * u - 0.32 * v + 0.72 * h + 0.12 * lock;
        if (light < -0.48) return k.hairDepth;
        if (light < 0.07 || (u < -0.32 && lock < -0.88 && h < 0.69)) return k.hairMid;
        if (u < -0.35 && h > 0.05 && h < 0.76 && lock > 0.9 && light > 0.12) return k.hairSheen;
        return k.hair;
      }
      const scalp = surfaceDetails && !wisps && !shortHair && !hairStyle?.shave ? hairScalp(hairstyle, hasHat) : null;
      const hairTones = [0, k.hairDepth, k.hairMid, k.hair, k.hairSheen, k.hairHighlight, k.hairPart];
      const guideTones = modelHair && [0, ...[0, 1, 2, 3, 4, 4, 5, 6].map(i => k['strandInk' + i])];
      const shortTones = shortHair && [
        0,
        k.hairRoot,
        k.hair,
        k.hairPlane,
        k.hairSheen,
        k.stubbleLight,
        k.stubbleMid,
        k.stubbleDark
      ];
      const scalpWidth = shortHair && layeredHair ? 1.43 : surfaceDetails ? 1.24 : 1.115;
      if (portraitInk && !hasHat && ['blunt','hime'].includes(hairStyle?.fringe)) {
        // Join the heavy bangs to the crown over the selected forehead. The
        // separate fringe locks still determine the tips and cast their shadow.
        b.stamp(cx + .10*rx, cx + 1.50*rx, -.84*ry, .84*ry,
          cz + crownHeight(.40)*rz, cz + crownHeight(.91)*rz, (x,y,z) => {
            const h = sliceHeight((z-cz)/rz), v = y/ry;
            if (h < .41+.10*v*v || Math.abs(v) > .91*skinShape.row(h).width*breadthScale(h)) return 0;
            const depth = (x-faceFront(y,z))/rx;
            return depth > -.066 && depth < .050 ? k.hairRoot : 0;
          });
      }
      if (modelCurls) {
        // The short undercoat connects the curl roots. Separate arched locks
        // extend beyond it at the temples and crown, leaving an open forehead.
        b.stamp(cx - 1.5 * rx, cx + 1.45 * rx, -1.24 * ry, 1.24 * ry,
          cz - 0.51 * rz, cz + crownHeight(1.075) * rz, (x, y, z) => {
            const h = sliceHeight((z - cz) / rz) / 1.052;
            if (h >= 1) return 0;
            const row = skinShape.row(h);
            const axis = row.axis;
            const u = (posterior.unfit((x - cx) / rx, h) - axis) / 1.045;
            const v = y / (ry * breadthScale(h) * 1.055);
            const edge = -0.31 + (modelAnatomy ? 1.19 : 1.04) * studioRig.ramp(u / Math.max(0.3, row.width), -0.56, 0.80)
              - 0.12 * swell(v, -0.64, 0.25);
            if (h < edge || !skinShape.insideSkin(row, axis + u, v)) return 0;
            if (gameFace) {
              const angle=Math.atan2(v,u), lock=Math.cos(6*angle+3.5*h+1.8*Math.sin(3*angle-2*h));
              if (h<edge+.065 || lock<-.76) return k.fineHairRoot;
              if (lock>.42 && h>.12 && v<.78) return k.lock5;
            }
            return h < edge + 0.14 || (v > 0.54 && h < 0.55) ? k.fineHairRoot : k.fineHairMid;
          });
      }
      if (wisps) {
        const tones = [k.fineHairLight, k.fineHairMid, k.fineHairRoot];
        const wispRadii = [0.019, 0.034, 0.038, 0.027, 0.010];
        for (const { points, shade, radii = wispRadii } of wisps) {
          for (let j = 1; j < points.length; j++)
            b.link(points[j - 1], points[j], radii[j - 1] * ry, radii[j] * ry, 1, () =>
              gameFace && modelCurls && j>=2 && j<=4 && shade!==2 ? (shade===0 ? k.lock7 : k.lock5) : tones[shade]);
        }
      } else if (hairStyle?.shave !== 'bare')
        b.stamp(
          cx - (headShape ? 1.56 : surfaceDetails ? 1.48 : roundedHead ? 1.4 : 1.12) * rx,
          cx + (headShape ? 1.44 : surfaceDetails ? 1.3 : roundedHead ? 1.22 : 1.12) * rx,
          -scalpWidth * ry,
          scalpWidth * ry,
          cz - (1.18 + long) * rz,
          cz + crownHeight(shortHair ? 1.49 : 1.22) * rz,
          (x, y, z) => {
            const v = y / ry,
              h = sliceHeight((z - cz) / rz);
            const u = posterior ? posterior.unfit((x - cx) / rx, h) : (x - cx) / rx;
            if (shortHair) {
              const tone = shortHair(u, v / breadthScale(h), h);
              if (portraitInk && tone && (guideTones || tone <= 4))
                return pineFigurePaint.brushedHair(k, guideTones ? tone * .78 : tone * 1.44, u, v, h, portraitInk);
              if (guideTones) return guideTones[tone];
              return wholeFigure ? pineFigurePaint.hair(k, tone, u, v, h, true, shortTones) : shortTones[tone];
            }
            const chart = headShape?.chart(h);
            if (hairStyle?.shave) {
              if (chart) {
                const dx = u - chart.axis;
                return pineHairStyles.cropped(
                  hairStyle.shave,
                  dx / (dx < 0 ? chart.rear : chart.fore),
                  v / (chart.width * breadthScale(h)),
                  h,
                  k
                );
              }
              const dx = u - skullAxis(h) + 0.022;
              return pineHairStyles.cropped(
                hairStyle.shave,
                dx / (dx < 0 ? rearDepth(h) : forehead),
                v,
                h,
                k
              );
            }
            if (scalp) {
              const row = Math.floor((h - scalpBottom) / scalpStep);
              if (row < 0 || row >= scalpRows) return 0;
              const dx = chart ? u - chart.axis : u - skullAxis(h) + 0.022;
              const depth =
                dx / (chart ? (dx < 0 ? chart.rear : chart.fore) : dx < 0 ? rearDepth(h) : forehead);
              const side = chart ? v / (chart.width * breadthScale(h)) : v;
              const radius = depth * depth + side * side;
              if (radius > scalp.rowMax[row] || radius + h * h < 0.85) return 0;
              const col = Math.floor(Math.atan2(side, depth) * (scalpAngles / (2 * Math.PI)));
              const i = row * scalpAngles + ((col + scalpAngles) % scalpAngles);
              if (pixelKnot) {
                // A fitted mass of gathered hair sits beneath the separate swept locks.
                // The ears remain open and solid dark roots show between the ribbons.
                const frontness=depth/Math.max(.01,Math.sqrt(radius));
                const low=-.53+.72*studioRig.ramp(frontness,-.80,.02)+.62*studioRig.ramp(frontness,.05,.79);
                if(h<low || radius>scalp.radiusSquared[i]*.98) return 0;
                const sweep=Math.cos(18*Math.atan2(side,depth)+4.3*h+3.1*h*h);
                if(sweep>.55) return k.lock5;
                return sweep<-.48 ? k.lock2 : k.lock3;
              }
              if (radius > scalp.radiusSquared[i]) return 0;
              const tone = scalp.tones[i];
              if (portraitInk && tone && tone <= 5) return pineFigurePaint.brushedHair(k, tone * 1.19, u, v, h, portraitInk);
              return wholeFigure ? pineFigurePaint.hair(k, tone, u, v, h, false, hairTones) : hairTones[tone];
            }
            if (roundedHead) return archivedRoundHair(u, v, h);
            let edge;
            if (u < -0.33) edge = bob ? -1.06 : bun ? -0.77 : -0.55;
            else if (u > 0.52) edge = (bob ? 0.34 : bun ? 0.45 : 0.39) + 0.19 * v + (bun ? 0.12 : 0.07) * u;
            else edge = bob ? -0.98 + 0.74 * (u + 0.33) : -0.49 + 0.63 * (u + 0.33) + 0.075 * v;
            if (loose && u > 0.32) {
              const part = hairstyle === 'long-waves' ? -0.32 : 0.08;
              edge = b.faceDetail
                ? 0.38 + 0.26 * Math.max(0, 1 - 1.45 * Math.abs(v - part)) - 0.085 * Math.abs(v)
                : 0.3 + 0.37 * Math.max(0, 1 - 1.65 * Math.abs(v - part)) - 0.12 * Math.abs(v);
            } else if (hairstyle === 'side-part') {
              edge = u > 0.26 ? 0.34 + 0.44 * v + 0.1 * u : -0.2 + 0.22 * u + 0.15 * v;
            }
            if (h < edge) return 0;
            const widen = 1 + (bob ? 0.072 : 0.044) * (hasHat ? 1 - clamp((h - 0.28) / 0.65, 0, 1) : 1);
            const ux = (u + 0.018) / (widen * (bob && h < -0.25 ? 1.04 : 1));
            const vy = v / (widen * (bob && h < -0.27 ? 1.055 : 1));
            const hh = h < 0 && bob ? h * 0.7 : (h - 0.017) / crown;
            const u2 = ux * ux,
              v2 = vy * vy;
            if (u2 * u2 + v2 * v2 + hh * hh > 1) return 0;
            if (hairstyle === 'side-part' && Math.abs(v - 0.32 + 0.28 * u) < 0.073 && h > 0.38)
              return k.hairShade;
            if (loose && h > 0.47) {
              const sweep = v + 0.18 * u + (hairstyle === 'long-waves' ? 0.28 : -0.08);
              if (Math.abs(sweep) < 0.065) return k.hairShade;
              if (sweep < -0.11 && sweep > -0.24 && u > -0.48) return k.hairLight;
            }
            if (h > 0.41 && Math.abs(v + 0.2 + 0.26 * u) < 0.06) return k.hairLight;
            if (bob && u < 0.1 && Math.abs(v - 0.2 + 0.2 * h) < 0.055) return k.hairLight;
            return u < -0.43 || (v > 0.55 && h < 0.4) ? k.hairShade : k.hair;
          }
        );
      if (bun && !hasHat && !hairStyle) {
        b.blob(
          cx + (posterior ? posterior.fit(-0.79, 0.78) : -0.79) * rx,
          0.14 * ry,
          cz + crownHeight(0.78) * rz,
          0.43 * rx,
          0.44 * ry,
          0.3 * rz,
          k.accent
        );
        b.blob(
          cx + (posterior ? posterior.fit(-0.91, 1) : -0.91) * rx,
          0.16 * ry,
          cz + crownHeight(1) * rz,
          0.57 * rx,
          0.56 * ry,
          0.44 * rz,
          (x, y, z) =>
            Math.abs((y - 0.16 * ry) / ry + (0.35 * (z - cz - crownHeight(1) * rz)) / rz) < 0.095
              ? k.hairLight
              : x < cx - rx
                ? k.hairShade
                : k.hair,
          2.35
        );
      } else if (!roundedHead && hairstyle === 'crop' && !hasHat) {
        b.blob(cx + 0.17 * rx, -0.19 * ry, cz + 0.97 * rz, 0.57 * rx, 0.43 * ry, 0.255 * rz, (x, y, z) =>
          z > cz + 1.12 * rz ? k.hairLight : k.hair
        );
      } else if (!roundedHead && hairstyle === 'side-part' && !hasHat) {
        b.blob(
          cx + 0.14 * rx,
          -0.27 * ry,
          cz + 0.77 * rz,
          0.78 * rx,
          0.75 * ry,
          0.39 * rz,
          (x, y, z) => {
            const ridge = y / ry + (0.38 * (x - cx)) / rx + 0.36;
            return Math.abs(ridge) < 0.075 && z > cz + 0.75 * rz ? k.hairLight : k.hair;
          },
          2.35
        );
      }
      if (pixelKnot) {
        pinePixelPortrait.sweptBun(b, k, fit);
        pinePixelPortrait.templeLocks(b,k,fit,faceFront);
      } else if (hairStyle && !shortHair) {
        if (hairStyle.length) drawLooseHair(pose, b, k);
        b.frame(pose.head);
        pineHairStyles.draw(hairStyle, b, k, fit, hasHat, (u, v, h) => lockPoint(pose, u, v, h), animated);
      } else if (hairstyle === 'curly' && !wisps) drawCurls(b, k);
      else if (hairstyle === 'ponytail' || hairstyle === 'twin-tails' || hairstyle === 'braid')
        drawTiedHair(b, k);
      else if (loose) drawLooseHair(pose, b, k);
      else if (hairstyle === 'twin-braids') drawTwinBraids(pose, b, k);
      if (parts.glasses || parts.ears) {
        b.frame(pose.head);
        pineWorkshopWear.facewear(parts, b, k, fit, eyeY, eyeZ, faceFront, earFit);
      }
      if (parts.hairAccessory) {
        b.frame(pose.head);
        pineEverydayStyles.headItem('hairAccessory', parts.hairAccessory, b, k, fit, hasHat);
      }
      if (hasHat) {
        b.frame(pose.head);
        if (animated && knitBand) drawInfantKnit(b, k);
        else paintHat(pose, b, k, hatFit);
      }
      if (parts.audio) {
        b.frame(pose.head);
        pineEverydayStyles.headItem('audio', parts.audio, b, k, earFit, hasHat);
      }
      b.frame(null);
    }
    function drawMovingNeck(pose, b, k) {
      // Loft from a torso-bound collar to a skull-bound upper ring. The collar remains
      // planted while the throat and nape follow the upper cervical joint independently.
      const a = studioRig.point(pose.torso, collar),
        c = studioRig.point(pose.head, upperNeck);
      const delta = c.map((v, i) => v - a[i]),
        length = Math.hypot(...delta),
        axis = delta.map((v) => v / length);
      const direction = [0, 4, 8].map((i) => 0.65 * pose.torso[i] + 0.35 * pose.head[i]);
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
        along = dot(direction, axis);
      const forward = direction.map((n, i) => n - along * axis[i]),
        norm = Math.hypot(...forward);
      for (let i = 0; i < 3; i++) forward[i] /= norm;
      const left = [
        axis[1] * forward[2] - axis[2] * forward[1],
        axis[2] * forward[0] - axis[0] * forward[2],
        axis[0] * forward[1] - axis[1] * forward[0]
      ];
      const radius = 0.73 * Math.max(fit.rx, fit.ry);
      const babyChin = paintedFeatures && infant && studioRig.point(pose.jaw || pose.head, sockets.chinTip.point);
      let throat;
      const settled = facialActing && pose.floorSeat;
      if (babyChin) {
        const fore = [0, 4, 8].map(i => pose.head[i]);
        const side = [1, 5, 9].map(i => pose.head[i]);
        const up = [2, 6, 10].map(i => pose.head[i]);
        // The neck turns almost horizontal during a crawl. Keep its start on
        // the moving throat and draw the underside in the jaw's facing direction.
        const start = infantChin
          ? a.map((v,i) => v + .33*delta[i] + .27*neutralRx*forward[i])
          : a.map((v, i) => v + .30 * delta[i] + (settled ? .19 : .27) * neutralRx * forward[i] - .067 * fit.rz * up[i]);
        // The new fold meets the bottom of the pad. A target at the tip makes
        // the skin below the ear run all the way out to the front of the face.
        const attachment = infantChin ? studioRig.point(pose.jaw || pose.head, chinJoin)
          : babyChin.map((v,i) => v - .15 * fit.rx * fore[i] - .10 * fit.rz * up[i]);
        const reach = attachment.map((v,i) => v - start[i]);
        const span = dot(reach, fore);
        if (span > .18 * fit.rx)
          throat = { start, fore, side, up, span, drift: dot(reach, side), rise: dot(reach, up) };
      }
      b.frame(null);
      const tip = babyChin || a;
      const bounds = a.flatMap((v, i) => [Math.min(v, c[i], tip[i]) - radius, Math.max(v, c[i], tip[i]) + radius]);
      b.stamp(...bounds, (x, y, z) => {
        const dx = x - a[0],
          dy = y - a[1],
          dz = z - a[2],
          t = (dx * axis[0] + dy * axis[1] + dz * axis[2]) / length;
        if (!throat && (t < 0 || t > 1)) return 0;
        const depth = dx * forward[0] + dy * forward[1] + dz * forward[2];
        const across = dx * left[0] + dy * left[1] + dz * left[2];
        if (t >= 0 && t <= 1) {
          const smooth = t * t * (3 - 2 * t),
            waist = Math.sin(Math.PI * t);
          const neckDepth = neutralRx + (fit.rx - neutralRx) * smooth;
          const face = depth / neckDepth, lateral = across / fit.ry;
          const infantNeck = modelAnatomy && infant;
          const throatTurn = paintedFeatures ? (infantNeck ? .073 : .048) * waist : 0;
          const front = (infantNeck ? 0.34 : 0.41) + (infantNeck ? 0.095 : 0.15) * smooth +
            0.09 * (shape.jawNeck || 0) * smooth - 0.037 * waist - throatTurn;
          const rear = (infantNeck ? 0.36 : 0.42) - 0.06 * smooth + (paintedFeatures ? .061 * smooth : 0),
            wide = (infantNeck ? 0.35 : 0.39) + 0.095 * smooth - 0.025 * waist - .26 * throatTurn;
          if ((face / (face > 0 ? front : rear)) ** 2 + (lateral / wide) ** 2 <= 1) {
            const light = clamp(0.48 + 0.7 * face - 0.18 * t - 0.12 * lateral, 0, 0.999);
            return k['neckTone' + Math.floor(light * 4)];
          }
        }
        // Link the throat to the underside of the moving chin. In profile two
        // overlapping ovals otherwise leave an air notch under the infant's jaw.
        if (!throat) return 0;
        const px = x - throat.start[0], py = y - throat.start[1], pz = z - throat.start[2];
        const u = (px * throat.fore[0] + py * throat.fore[1] + pz * throat.fore[2]) / throat.span;
        if (u <= 0 || u >= 1) return 0;
        const side = px * throat.side[0] + py * throat.side[1] + pz * throat.side[2];
        const v = (side - u * throat.drift) / (fit.ry * (.37 - .16 * u));
        if (Math.abs(v) >= 1) return 0;
        const floor = infantChin
          ? throat.rise * u*u*(3-2*u) + fit.rz * (.076*Math.sin(Math.PI*u)**2 + .061*v*v)
          : throat.rise * u * (.72 + .28 * u) + .085 * fit.rz * v * v;
        // Round the underside while keeping its upper surface inside the jaw.
        const pad = facialActing && !infantChin ? (settled ? .054 : .036) * fit.rz * (1 - v*v) * Math.sin(Math.PI*u) : 0;
        const height = px * throat.up[0] + py * throat.up[1] + pz * throat.up[2] - floor;
        if (height >= -pad && height < .27 * fit.rz * (1 - v * v)) {
          const turn = facialActing ? u + .20*v*v + .62*height/fit.rz : u;
          return turn < .34 ? k.neckTone1 : turn < .67 ? k.throatMid : k.throatPad;
        }
        return 0;
      });
    }
    const art = {
      materials,
      illustratedPortrait: illustrated,
      ...(layout && (recipe.spriteMouth || softPixels) ? { smallMouthScale:Math.min(84/rig.height, 5.5/(2*fit.ry*layout.mouthHalf)) } : {}),
      ...(wholeFigure ? { figureLighting: pineFigurePaint.lighting } : {}),
      devices: { phone: parts.phone, laptop: parts.laptop },
      ...(parts.bottle
        ? {
            bottleStyle: parts.bottle,
            bottleScale: rig.height / 50,
            bottleMaterials: {
              enamel: materials.bottleMain,
              enamelLight: materials.bottleLight,
              enamelFoot: materials.bottleShade
            },
            carriedBottle(pose) {
              const dock = sockets.bottleDock.point;
              return {
                lip: studioRig.point(pose.torso, dock),
                base: studioRig.point(pose.torso, [dock[0], dock[1], dock[2] - bottleLength]),
                held: false
              };
            }
          }
        : {}),
      portraitLighting: {
        soft: [
          'skin',
          'skinLight',
          'skinShade',
          'cheek',
          'lips',
          'eyelid',
          ...(roundedHead ? ['hair', 'hairLight', 'hairShade', 'hairMid', 'hairDepth', 'hairSheen'] : []),
          ...(surfaceDetails ? ['hairHighlight', 'hairPart'] : []),
          ...(headShape ? ['hairRoot', 'hairPlane', 'stubbleLight', 'stubbleMid', 'stubbleDark'] : [])
        ],
        painted: [
          ...(illustrated ? ['bridgeSkin', 'wingSkin', 'cheekVeil', 'lash', 'browDeep', 'browSoft', 'eyes', 'pupil', 'sclera', 'irisLight', 'glint'] : []),
          ...(pixelPortrait ? pinePixelPortrait.painted : []),
          ...(animated ? [...planeMaterials, 'nostril', 'scleraShade', 'lidSkin', 'lidRim', 'irisRim', 'irisShadow', 'lipGlow'] : []),
          ...(softPixels ? ['nasalLight','nasalBase','nasalFold','nasalPlane','lipCorner','oralWall'] : []),
          ...(illustrated && recipe.colors.leftEye ? ['leftEyePigment', 'leftEyeDeep', 'leftEyeSoft'] : []),
          ...(paintedFeatures && infant ? ['throatMid','throatPad'] : []),
          ...(fittedJaw ? ['jawShade'] : []),
          ...(adjustableJaw ? ['neckTone0', 'neckTone1', 'neckTone2', 'neckTone3'] : []),
          ...(jawContour ? ['jawPlane0', 'jawPlane1', 'jawPlane2'] : []),
          ...(headShape ? ['underJaw', 'templeSkin', 'foreheadSkin', 'cheekLight', 'cheekWarm'] : []),
          ...(wisps ? ['fineHairLight', 'fineHairMid', 'fineHairRoot'] : []),
          'faceLight',
          'faceMid',
          'faceEdge',
          'rose',
          'roseVeil',
          'noseLight',
          'noseShade',
          'upperLip',
          'lowerLip',
          'lipLine'
        ]
      },
      paint(pose, brush, ink) {
        drawLegs(pose, brush, ink);
        if (adjustableJaw) drawMovingNeck(pose, brush, ink);
        drawTorso(pose, brush, ink);
        drawArms(pose, brush, ink);
        drawHead(pose, brush, ink);
        if (parts.implement && !pose.props?.length && !pose.bottle?.held) {
          const id = parts.implement,
            scale = rig.height / 50;
          const flatBook = tailored && (id === 'clipboard' || id === 'notebook');
          // Carry flat stationery by its upper edge beside the leg. The signed
          // roll points the page outward while the top corner stays in the hand.
          const grip = flatBook ? [0.65, 3.65, 0.28] : PineWorld.items.get(id).anchors.grip || [0, 0, 0];
          const item = activityMotion.atGrip(id, pose.arms[0].hand, grip, scale,
            flatBook ? 0.43 : 0, 0, flatBook ? 1.39 : 0);
          studioProps.paint({ props: [item] }, brush, ink);
        }
      }
    };
    if (fittedJaw) {
      const throat = [fit.x, 0, fit.z - 1.02 * fit.rz];
      const chin = [fit.x + 0.73 * fit.rx, 0, fit.z - 0.89 * fit.rz];
      // Reserve the open chin at both ends of the cycle. The eyes and upper lip
      // must stay on the same sampling grid when only the mandible moves.
      const openChin = mandible ? studioRig.point(studioRig.mandibleFrame(rig, 1), chin) : chin;
      art.portraitFloor = ({ head }) => {
        // The lower rim is an ellipse. Project its radius onto world Z as the head nods or rolls.
        const radius = 0.39 * Math.hypot(head[8] * fit.rx, head[9] * fit.ry);
        return Math.min(
          studioRig.point(head, throat)[2] - radius,
          studioRig.point(head, openChin)[2] - 0.3 * Math.abs(head[9]) * fit.ry
        );
      };
    }
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
    if (anatomy) {
      const projections = new Map();
      anatomy.body = mode => {
        if (!['form','muscle','skeleton','skull'].includes(mode)) throw Error('未知人体结构层');
        if (!projections.has(mode)) {
          const sculpture = Object.fromEntries(Object.entries(materials).map(([name,hex]) => {
            const rgb = [0,2,4].map(i => parseInt(hex.slice(i,i+2),16));
            const y = .299*rgb[0]+.587*rgb[1]+.114*rgb[2];
            return [name, y<45?'746751':y<95?'ae9677':y<148?'c5b091':y<199?'d5c2a4':'e7d8ba'];
          }));
          const body = createSliceActor({materials: {...sculpture, ...pineSkull.materials, clay:'c6b497',
            clayLight:'d7c8ac',clayShade:'ae987d',nearBone:'d3b78f',farBone:'859d9c',joint:'b58251',
            flexor:'b86350',extensor:'984e42',chest:'c57a62',tendon:'dbc1a2'},
            structureOnly: true, isolatedHead: mode === 'skull', illustratedPortrait: true, portraitFloor: art.portraitFloor,
            paint(pose, b, k) {
              if (mode === 'form') {
                anatomy.skin(pose, b, k);
                drawMovingNeck(pose, b, k);
                drawHead(pose, b, k, true);
              } else {
                if (mode !== 'skull') anatomy.bones(pose, b, k);
                if (mode === 'muscle') anatomy.muscles(pose,b,k);
                skull ??= pineSkull.bind({ fit, sockets, form: skullForm, driver: pineSkull.proportions(recipe.base,shape,skullForm,recipe.anatomyParts?.skull) });
                skull.paint(pose, b, k);
              }
            }}, 2, null, box);
          projections.set(mode, body);
        }
        return projections.get(mode);
      };
    }
    return { rig, art, sockets, box, ...(anatomy ? {anatomy} : {}), density: 2, tags: articulatedJaw ? [recipe.base, 'mandible'] : [recipe.base] };
  }

  function standingHeight(kind, scale = 1, sculpted = false, ratios) {
    const [, centerZ, , , radiusZ] = dimensions[kind].head;
    if (ratios) {
      const base = modelBodies[kind]?.rig || studioRig.profiles[kind];
      const headKind = kind === 'baby' ? 'baby' : kind === 'adult' ? 'adult' : 'child';
      const scalp = pineHeadShape.scalp(headKind, true);
      const crown = fitCrown(scalp.crown, ratios.crownHeight ?? 1);
      const headScale = ratios.headScale ?? 1;
      const pivotHeight = pineHeadPivots[headKind][1];
      return (centerZ + trunkOffset(base, ratios.trunkLength ?? 1) +
        radiusZ * (pivotHeight + headScale * (crown.raise(1) - pivotHeight))) * scale;
    }
    return (
      (centerZ +
        radiusZ * (sculpted ? pineHeadShape[kind === 'adult' ? 'adult' : 'child'].crown.raise(1) : 1)) *
      scale
    );
  }
  return { build, standingHeight, shapeRanges, maxMouthHeight };
})();
