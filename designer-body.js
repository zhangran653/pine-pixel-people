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
    occiput: [0.8, 1.2, 1],
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
  function contouredLink(brush, torso, sections) {
    return (a, b, r0, r1, width, pigment) => {
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
      const pad = Math.max(r0, r1) * Math.max(1, width) * 1.18;
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
        return u * u + v * v + w * w <= radius * radius ? pigment(t, u, v, w) : 0;
      });
    };
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
  function palette(colors, surfaceDetails) {
    const base = {};
    for (const [key, fallback] of Object.entries(defaults)) {
      const value = colors?.[key];
      base[key] = (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback).slice(1);
    }
    const { skin, hair, eyes, top, bottom, shoes, accent } = base;
    const portraitSkin = tint(skin, 'ffe8ce', 0.24);
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
      faceMid: tint(skin, 'f0ccba', 0.23),
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

  function build(
    recipe,
    paintHat,
    hatPrimitives = [],
    roundedHead = true,
    surfaceDetails = roundedHead,
    softContours = surfaceDetails,
    sculptedHead = ['1.9.0', '1.9.1', '1.9.2', '1.10.0', '1.10.1'].includes(recipe.packs?.['pine-core']),
    layeredHair = ['1.9.1', '1.9.2', '1.10.0', '1.10.1'].includes(recipe.packs?.['pine-core']),
    fittedJaw = ['1.9.2', '1.10.0', '1.10.1'].includes(recipe.packs?.['pine-core'])
  ) {
    const kind = recipe.base === 'adult' ? 'adult' : 'child';
    const base = studioRig.profiles[recipe.base],
      measures = dimensions[recipe.base];
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
    const headShape = sculptedHead ? pineHeadShape[kind] : null;
    const articulatedJaw = recipe.packs?.['pine-core'] === '1.10.1';
    const adjustableJaw = articulatedJaw || recipe.packs?.['pine-core'] === '1.10.0';
    const skinShape = adjustableJaw
      ? pineHeadShape.reshape(kind, shape)
      : fittedJaw
        ? pineHeadShape.withJaw(kind)
        : headShape;
    const posterior = headShape ? pineHeadShape.posterior(measure(shape, 'occiput')) : null;
    const crownHeight = (h) => (headShape ? headShape.crown.raise(h) : h);
    const sliceHeight = (h) => (headShape ? headShape.crown.lower(h) : h);
    const shortHair = sculptedHead ? pineShortHair.get(parts.hair, kind, hasHat, layeredHair) : null;
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
      posterior,
      crown: headShape?.crown,
      y: 0,
      z: cz * s,
      rx: rx * s * (1 + 0.12 * (width - 1)),
      ry: ry * s * width,
      rz: rz * s
    });
    if (adjustableJaw) {
      const [forward, height] = pineHeadPivots[kind];
      rig.headPivot = [fit.x + fit.rx * forward, 0, fit.z + fit.rz * height];
    }
    const mandible = articulatedJaw ? pineMandibleLandmarks[kind] : null;
    if (mandible) {
      const [forward, height] = mandible.hinge;
      rig.jawPivot = [fit.x + forward * fit.rx, 0, fit.z + height * fit.rz];
    }
    const eyeY = fit.ry * 0.485 * spacing,
      eyeZ = measures.eye * s;
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
      headShape &&
      Float32Array.from({ length: 601 }, (_, i) => {
        const h = i / 300 - 1;
        const jawScale = 1 + 0.82 * (jaw - 1) * clamp(-h, 0, 1);
        return jawScale * (faceOutline ? pinePortraitStyles.outlineWidth(faceOutline, h) : 1);
      });
    const breadthScale = (h) => breadth[clamp(Math.round((h + 1) * 300), 0, 600)];
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
    const mouthY = roundedHead ? 0 : -0.062 * fit.ry;
    const travel = kind === 'child' ? 0.87 : 1.12;
    // Leave room for the philtrum at the top of the height control, even on the child face.
    const rise = surfaceDetails ? Math.min(travel, measures.eye - 0.47 * rz - measures.mouth) : travel;
    const mouthZ = (measures.mouth + mouthOffset * (mouthOffset > 0 ? rise : travel)) * s;
    // The rounded head carries the lip pigments on its own surface. The bottle
    // meets that same surface regardless of the shape or color of the lips.
    const lipReach = surfaceDetails
      ? 0
      : (recipe.face?.mouth === 'full' ? 0.42 : recipe.face?.mouth === 'small' ? 0.22 : 0.31) * s;
    rig.mouth = [faceFront(mouthY, mouthZ) + (roundedHead ? lipReach : 0.14 * s), mouthY, mouthZ];
    const eyeX = faceFront(eyeY, eyeZ);
    const socket = (frame, point) => ({ frame, point });
    const chestDepth = measures.chest * s * (1 + 0.19 * (shoulders - 1)) * cut.chestDepth;
    const hipHeight = measures.hips * s;
    const hipThickness = hipHeight * cut.hipDepth;
    const hipHalf = hipBreadth + measures.thigh * s * 0.76 + cut.hipAllowance * s;
    const collar = [rig.neck[0] - 0.035 * fit.rx, 0, rig.neck[2] - 0.27 * fit.rz],
      upperNeck = [fit.x + (0.055 + 0.04 * (shape.jawNeck || 0)) * fit.rx, 0, fit.z - 0.64 * fit.rz];
    const sockets = {
      ...(adjustableJaw
        ? {
            headPivot: socket('head', rig.headPivot),
            collar: socket('torso', collar),
            throat: socket('head', [
              fit.x + (0.52 + 0.115 * (shape.jawNeck || 0)) * fit.rx,
              0,
              fit.z + (-0.897 + 0.032 * (shape.chinHeight || 0)) * fit.rz
            ])
          }
        : {}),
      mouth: socket('head', rig.mouth),
      rightEye: socket('head', [eyeX, -eyeY, eyeZ]),
      leftEye: socket('head', [eyeX, eyeY, eyeZ]),
      seat: socket('torso', [rig.pelvis[0], 0, rig.pelvis[2] - 0.79 * hipHeight]),
      upperBack: socket('torso', [-0.89 * chestDepth, -0.15 * rig.shoulder[1], rig.shoulder[2] - 0.65 * s])
    };
    let angleForward, angleHeight;
    if (mandible) {
      angleForward = mandible.angle[0] + 0.12 * (shape.jawPosition || 0);
      angleHeight = mandible.angle[1] + 0.06 * (shape.jawAngle || 0);
      for (const [side, sign] of [['left', 1], ['right', -1]]) {
        sockets[side + 'EarCanal'] = socket('head', [
          fit.x - 0.127 * fit.rx, sign * 0.97 * fit.ry, fit.z - 0.067 * fit.rz
        ]);
        // The reference is a midline hinge. Fit its paired ends inside the pinnae of this character.
        sockets[side + 'JawJoint'] = socket('jaw', [rig.jawPivot[0], sign * 0.83 * fit.ry, rig.jawPivot[2]]);
        sockets[side + 'JawAngle'] = socket('jaw', [
          fit.x + angleForward * fit.rx,
          sign * mandible.angle[2] * fit.ry * breadthScale(angleHeight),
          fit.z + angleHeight * fit.rz
        ]);
      }
      const chinZ = fit.z + (-0.755 + 0.062 * (shape.chinHeight || 0)) * fit.rz;
      sockets.chinTip = socket('jaw', [faceFront(0, chinZ), 0, chinZ]);
      const lip = (offset) => [faceFront(0, mouthZ + offset), 0, mouthZ + offset];
      sockets.upperLip = socket('head', lip(0.04 * fit.rz));
      sockets.lowerLip = socket('jaw', lip(-0.04 * fit.rz));
    }
    const materials = palette(recipe.colors, surfaceDetails);
    if (adjustableJaw) {
      for (const [index, amount] of [0.105, 0.084, 0.062, 0.04].entries())
        materials['neckTone' + index] = tint(materials.faceMid, '805b4c', amount);
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
        cheekWarm: tint(materials.faceMid, materials.rose, 0.32),
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
    function drawLegs(pose, b, k) {
      const thigh = measures.thigh * s,
        kneeRadius = measures.knee * s,
        ankleRadius = measures.ankle * s;
      const shoeX = measures.shoe[0] * s,
        shoeY = measures.shoe[1] * s;
      b.frame(null);
      const thighLink = softContours ? contouredLink(b, pose.torso, limbContours.thigh) : b.link;
      const shinLink = softContours ? contouredLink(b, pose.torso, limbContours.shin) : b.link;
      for (let i = 0; i < 2; i++) {
        const side = i ? 1 : -1,
          foot = pose.feet[i],
          { hip, knee } = pose.legs[i];
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
        const forward = 1 - 2 * clamp((dx / (Math.hypot(dx, dz) || 1) - 0.7) / 0.29, 0, 1);
        const toe = shoeX * 0.25 * forward,
          sh = ankle * (boots ? 0.73 : 0.64);
        if (collectionShoes) {
          pineEverydayStyles.shoe(
            parts.shoes,
            b,
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
            b,
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
      const upperLink = softContours ? contouredLink(b, pose.torso, limbContours.upperArm) : b.link;
      const foreLink = softContours ? contouredLink(b, pose.torso, limbContours.forearm) : b.link;
      for (const { side, shoulder, elbow, wrist, hand } of pose.arms) {
        if (worldTop || collectionTop || workshopTop) {
          const sleeve = worldTop
            ? pineWorldWardrobe.sleeve
            : collectionTop
              ? pineEverydayStyles.sleeve
              : pineWorkshopWear.sleeve;
          upperLink(shoulder, elbow, 1.035 * upper, 1.02 * elbowR, 0.97, (t, u, v) =>
            sleeve(parts.top, t, u, v, side, elbowR, false, k)
          );
          foreLink(elbow, wrist, 1.02 * elbowR, cuff, 0.96, (t, u, v) =>
            sleeve(parts.top, t, u, v, side, cuff, true, k)
          );
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
            if (!jacket && t > 0.4 && t < 0.59) return k.accent;
            if (jacket && t < 0.25) return k.topLight;
            return side * v < -0.74 * s ? k.topShade : k.top;
          });
          foreLink(elbow, wrist, elbowR, cuff, 0.93, (t, u, v) =>
            t > 0.77 ? (jacket ? k.topStitch : k.topShade) : side * v < -0.69 * s ? k.topShade : k.top
          );
        }
        if (parts.wrist && side === 1) pineWorkshopWear.wristwear(parts.wrist, b, k, { elbow, wrist }, cuff);
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
        if (parts.gloves) pineEverydayStyles.hand(parts.gloves, b, k, { side, wrist, hand }, palm);
      }
    }
    function drawTorso(pose, b, k) {
      b.frame(pose.torso);
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
        // Round the outer shoulder and the corners of the upper rib cage.
        const shoulderDrop = softContours ? 0.047 * u2 + 0.013 * v2 : 0;
        const corner = softContours ? 0.2 * clamp((t - 0.38) / 0.4, 0, 1) : 0;
        const section = u2 * u2 + v2 * v2 + corner * (u2 * (1 - u2) + v2 * (1 - v2));
        if (t < 0 || t > 1 - cut.shoulderSlope * v2 - shoulderDrop || section > 1) return 0;
        const a = Math.abs(v);
        if (parts.bag || parts.attachment) {
          const strap = pineWorkshopWear.straps(parts.bag, parts.attachment, u, v, t, k);
          if (strap) return strap;
        }
        if (parts.bottom === 'bib-overalls') {
          const bib = pineWorkshopWear.bib(u, v, t, k);
          if (bib) return bib;
        }
        if (worldTop) return pineWorldWardrobe.fabric(parts.top, u, v, t, k);
        if (collectionTop) return pineEverydayStyles.overlay(parts.top, u, v, t, k);
        if (workshopTop) return pineWorkshopWear.fabric(parts.top, u, v, t, k);
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
      if (workshopTop) {
        pineWorkshopWear.torsoDetails(parts.top, b, k, chestDepth, broad, low, tall);
      } else if (tee) {
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
      if (parts.bag || parts.attachment)
        pineWorkshopWear.luggage(
          pineWorldWardrobe.bags[parts.bag] ? { ...parts, bag: null } : parts,
          b,
          k,
          chestDepth,
          broad,
          low,
          tall
        );
      pineWorldWardrobe.carried(parts, b, k, chestDepth, broad, low, tall);
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
        pineEverydayStyles.torso(parts, b, k, chestDepth, broad, low, tall);
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
        noseStyle = pinePortraitStyles.noses[nose],
        lipStyle = pinePortraitStyles.mouths[mouth];
      const skinDetails = face.complexion || face.facialHair || face.makeup;
      const dyeBrow = !!recipe.colors.brow,
        dyeEye = !!recipe.colors.leftEye;
      function eyebrowInk(off, z) {
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
        if (eyeStyle) return pinePortraitStyles.eye(eyeStyle, off / ry, (z - eyeZ) / rz, blink, side, k);
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
          const iris = (q / 0.49) ** 2 + ((h - 0.012) / (round ? 0.134 : 0.105)) ** 2;
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
        const a = Math.abs(y - mouthY) / ry,
          h = (z - mouthZ) / rz;
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
      const lipWidth = lipStyle?.[1] ?? ({ small: 0.184, full: 0.284, smile: 0.309 }[mouth] ?? 0.263);
      const lipHalf = lipWidth * (1 + 0.13 * (pose.jawOpen || 0));
      const lipLift = lipStyle?.[4] ?? (mouth === 'smile' ? 0.102 : 0.034);
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
        if (jawFrame && z < mouthZ + 0.14 * rz) {
          // Inverse skinning at each destination voxel keeps the lip edges solid through rotation.
          const forward = (x - cx) / rx, across = Math.abs(y) / ry;
          const dx = x - jawFrame[3], dz = z - jawFrame[11];
          const restX = jawFrame[0] * dx + jawFrame[8] * dz;
          const restZ = jawFrame[2] * dx + jawFrame[10] * dz;
          const front = studioRig.ramp(forward, mandible.hinge[0] - 0.15, 0.76);
          const cheekTop = rig.jawPivot[2] - (rig.jawPivot[2] - mouthZ) * front;
          const below = 1 - studioRig.ramp(z, cheekTop - 0.32 * rz, cheekTop + 0.055 * rz);
          const rear = studioRig.ramp(forward, mandible.hinge[0] - 0.54, mandible.hinge[0] + 0.05);
          let weight = below * rear;
          let cheekInset = 0;
          if (forward > 0.57 && across < 0.70) {
            const q = across / lipHalf, corner = clamp(1 - q * q, 0, 1);
            const seam = mouthZ + rz * lipLift * Math.min(1, q * q);
            const lower = jawFrame[8] * (x - jawFrame[3] - jawFrame[2] * seam) / jawFrame[0] +
              jawFrame[10] * seam + jawFrame[11];
            const gap = Math.max(0, seam - lower) * corner;
            const opening = z >= seam ? 0 : clamp((seam - z) / Math.max(0.01 * rz, seam - lower), 0, 1);
            // The mouth corners recede as the lower lip descends. A protruding cheek
            // here would hide both lips in profile even when the jaws are far apart.
            cheekInset = 0.21 * rx * pose.jawOpen * Math.sin(Math.PI * opening) *
              studioRig.ramp(across, lipHalf * 0.6, lipHalf) * (1 - studioRig.ramp(across, lipHalf * 1.15, 0.70)) *
              studioRig.ramp(forward, 0.57, 0.85);
            if (gap > 0 && z < seam && z > seam - gap) {
              const t = (seam - z) / gap;
              const frontLip = surface(y, seam);
              const inset = rx * pose.jawOpen * corner * (0.055 + 0.19 * Math.sin(Math.PI * t));
              // Only the exposed oral opening cuts the front surface. Lips retain their own pigment.
              if (x > frontLip - inset) return 0;
              if (x > frontLip - 0.42 * rx) return t > 0.78 ? k.oralTongue : k.oralShade;
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
        let section, localX, lateral;
        if (headShape) {
          // A rotated stamp visits the enclosing world-space box. The open throat ring must
          // stop at its local lower plane; the moving neck supplies the volume below it.
          if (fittedJaw && h < -1) return 0;
          if (adjustableJaw && h < -0.77) {
            // Let the neck supply the back of this ring. Only the pad at the front
            // is rigidly part of the skull; otherwise a nod drags the collar with it.
            const f = clamp((u - 0.19) / 0.68, 0, 1);
            const nape = clamp((0.1 - u) / 0.48, 0, 1);
            const lower =
              -0.882 -
              0.058 * f * f * (3 - 2 * f) -
              0.045 * nape * nape * (3 - 2 * nape) +
              0.015 * (shape.chinHeight || 0) * f;
            if (h < lower) return 0;
          }
          section = skinShape.row(h);
          localX = posterior.unfit(u, h);
          lateral = y / (ry * breadthScale(h));
          if (mandible && z < mouthZ && Math.abs(u - angleForward) < 0.43 && Math.abs(h - angleHeight) < 0.23) {
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
        if (u > 0.49 && Math.abs(off) < 0.345 * ry) {
          const browInk = eyebrowInk(off, z);
          if (browInk) return dyeBrow ? (browInk === k.browSoft ? k.browPigment : k.browDeep) : browInk;
          const side = Math.sign(y),
            color = eyeInk(off, z, side);
          if (color)
            return face.iris || dyeEye
              ? pinePortraitStyles.iris(face.iris, color, off / ry, (z - eyeZ) / rz, side, dyeEye, k)
              : color;
        }
        if (u > 0.64) {
          if (mouth === 'classic' && !b.faceDetail) {
            if (Math.abs(y - mouthY) < 0.19 * ry && Math.abs(z - mouthZ) < 0.068 * rz) return k.lips;
          } else {
            const color = lipInk(y, z);
            if (color) return color;
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
          const dx = localX - section.axis;
          if (adjustableJaw && h < -0.54) {
            // Submental shadow is local to the underside. It loses contrast toward
            // the ear instead of drawing a diagonal seam across the whole neck.
            const along = clamp((u - 0.07 - 0.12 * (shape.jawPosition || 0)) / 0.89, 0, 1);
            const border =
              -0.62 -
              0.205 * along +
              0.032 * (shape.chinHeight || 0) * along +
              0.032 * (shape.jawAngle || 0) * (1 - along);
            const shade = clamp((border - h) / 0.11, 0, 1) * clamp((u + 0.17) / 0.54, 0, 1);
            if (shade > 0.68) return k.neckTone0;
            if (shade > 0.4) return k.neckTone1;
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
          if (dx > 0) {
            const j = Math.min(
              headShape.lateralSteps,
              Math.round(Math.abs(lateral / section.width) * headShape.lateralSteps)
            );
            const light = section.frontLight[j] + Math.sign(y) * section.sideLight[j];
            if (!fittedJaw && h < -0.56 && light < 0.28) return k.underJaw;
            if (light < 0.08) return k.faceEdge;
            if (light < 0.25) return k.templeSkin;
            if (light < 0.43) return k.faceMid;
            if (h < -0.04 && h > -0.36 && a > 0.34 * ry && a < 0.88 * ry) {
              const flush = ((a / ry - 0.61) / 0.23) ** 2 + ((h + 0.203) / 0.135) ** 2;
              if (flush < 0.85 && light < 0.79) return k.cheekWarm;
            }
            if (light < 0.58) return k.foreheadSkin;
            return light < 0.835 ? k.faceLight : k.cheekLight;
          }
          const facing = dx / Math.max(0.01, section.rear);
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
          b.stamp(
            cx - 0.4 * rx,
            cx + 0.17 * rx,
            side * ry - ry * 0.23,
            side * ry + ry * 0.23,
            cz - 0.34 * rz,
            cz + 0.17 * rz,
            (x, y, z) => {
              const t = ((z - cz) / rz + 0.077) / 0.241;
              const earX = -0.115 + 0.043 * t;
              const forward = ((x - cx) / rx - earX) / (0.201 + 0.029 * t);
              const across = ((side * y) / ry - 0.966 - 0.025 * t) / 0.155;
              if (forward * forward + across * across + t * t > 1) return 0;
              const fold = ((forward + 0.07) / 0.55) ** 2 + ((t - 0.04) / 0.63) ** 2;
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
      const noseZ = eyeZ - 0.205 * rz,
        noseX = faceFront(0, noseZ) - 0.1 * rx;
      if (noseStyle) pinePortraitStyles.nose(noseStyle, b, k, fit, eyeZ, surface);
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
      const scalp = surfaceDetails && !shortHair && !hairStyle?.shave ? hairScalp(hairstyle, hasHat) : null;
      const hairTones = [0, k.hairDepth, k.hairMid, k.hair, k.hairSheen, k.hairHighlight, k.hairPart];
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
      if (hairStyle?.shave !== 'bare')
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
            if (shortHair) return shortTones[shortHair(u, v / breadthScale(h), h)];
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
              return radius <= scalp.radiusSquared[i] ? hairTones[scalp.tones[i]] : 0;
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
      if (hairStyle && !shortHair) {
        if (hairStyle.length) drawLooseHair(pose, b, k);
        b.frame(pose.head);
        pineHairStyles.draw(hairStyle, b, k, fit, hasHat, (u, v, h) => lockPoint(pose, u, v, h));
      } else if (hairstyle === 'curly') drawCurls(b, k);
      else if (hairstyle === 'ponytail' || hairstyle === 'twin-tails' || hairstyle === 'braid')
        drawTiedHair(b, k);
      else if (loose) drawLooseHair(pose, b, k);
      else if (hairstyle === 'twin-braids') drawTwinBraids(pose, b, k);
      if (parts.glasses || parts.ears) {
        b.frame(pose.head);
        pineWorkshopWear.facewear(parts, b, k, fit, eyeY, eyeZ, faceFront);
      }
      if (parts.hairAccessory) {
        b.frame(pose.head);
        pineEverydayStyles.headItem('hairAccessory', parts.hairAccessory, b, k, fit, hasHat);
      }
      if (hasHat) {
        b.frame(pose.head);
        paintHat(pose, b, k, fit);
      }
      if (parts.audio) {
        b.frame(pose.head);
        pineEverydayStyles.headItem('audio', parts.audio, b, k, fit, hasHat);
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
      b.frame(null);
      b.stamp(...a.flatMap((v, i) => [Math.min(v, c[i]) - radius, Math.max(v, c[i]) + radius]), (x, y, z) => {
        const dx = x - a[0],
          dy = y - a[1],
          dz = z - a[2],
          t = (dx * axis[0] + dy * axis[1] + dz * axis[2]) / length;
        if (t < 0 || t > 1) return 0;
        const smooth = t * t * (3 - 2 * t),
          waist = Math.sin(Math.PI * t);
        const face = (dx * forward[0] + dy * forward[1] + dz * forward[2]) / fit.rx,
          lateral = (dx * left[0] + dy * left[1] + dz * left[2]) / fit.ry;
        const front = 0.41 + 0.15 * smooth + 0.09 * (shape.jawNeck || 0) * smooth - 0.037 * waist;
        const rear = 0.42 - 0.06 * smooth,
          wide = 0.39 + 0.095 * smooth - 0.025 * waist;
        if ((face / (face > 0 ? front : rear)) ** 2 + (lateral / wide) ** 2 > 1) return 0;
        const light = clamp(0.48 + 0.7 * face - 0.18 * t - 0.12 * lateral, 0, 0.999);
        return k['neckTone' + Math.floor(light * 4)];
      });
    }
    const art = {
      materials,
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
          ...(fittedJaw ? ['jawShade'] : []),
          ...(adjustableJaw ? ['neckTone0', 'neckTone1', 'neckTone2', 'neckTone3'] : []),
          ...(headShape ? ['underJaw', 'templeSkin', 'foreheadSkin', 'cheekLight', 'cheekWarm'] : []),
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
          const item = activityMotion.atGrip(
            id,
            pose.arms[0].hand,
            PineWorld.items.get(id).anchors.grip || [0, 0, 0],
            scale
          );
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
    return { rig, art, sockets, box, density: 2, tags: articulatedJaw ? [recipe.base, 'mandible'] : [recipe.base] };
  }

  function standingHeight(kind, scale = 1, sculpted = false) {
    const [, centerZ, , , radiusZ] = dimensions[kind].head;
    return (
      (centerZ +
        radiusZ * (sculpted ? pineHeadShape[kind === 'adult' ? 'adult' : 'child'].crown.raise(1) : 1)) *
      scale
    );
  }
  return { build, standingHeight, shapeRanges };
})();
