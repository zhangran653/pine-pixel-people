// Portrait profiles are measured in head radii. Pigment marks follow the surface as the head turns.
const pinePortraitStyles = (() => {
  // Brush sizes are fractions of the same head radii used by the skin and rig.
  // The randomizer also uses these dimensions to reserve space between features.
  const proportions = {
    standard: { outlineStrength: 1, eyeCenter: 0.485, eyeWidth: 1, eyeOpen: 1, browWidth: 1, browHeight: 1,
      noseWidth: 1, noseLength: 1, noseReach: 1, lipWidth: 1, lipHeight: 1 },
    baby: { outlineStrength: 0.46, eyeCenter: 0.456, eyeWidth: 1.035, eyeOpen: 1.12, browWidth: 0.80, browHeight: 0.84,
      noseWidth: 0.84, noseLength: 0.68, noseReach: 0.65, lipWidth: 0.78, lipHeight: 0.86 }
  };
  const illustratedRelease = '1.16.0';
  const silhouetteRelease = '1.16.1';
  const facePlaneRelease = '1.16.2';
  const pixelRelease = '1.17.0';
  const figureRelease = '1.18.0';
  const tailoredRelease = '1.19.0';
  const proportionStudyRelease = '1.19.1';
  const structureStudyRelease = '1.19.2';
  const gameFaceRelease = '1.19.3';
  const baseFaceRelease = '1.19.4';
  const clothingStudyRelease = '1.19.5';
  const hasBaseFace = pin => pin === baseFaceRelease || pin === clothingStudyRelease;
  const hasGameFace = pin => pin === gameFaceRelease || hasBaseFace(pin);
  const hasStructureStudy = pin => pin === structureStudyRelease || hasGameFace(pin);
  const hasProportionStudy = pin => pin === proportionStudyRelease || hasStructureStudy(pin);
  const hasTailoredFigure = pin => pin === tailoredRelease || hasProportionStudy(pin);
  const hasPixelFace = pin => pin === pixelRelease || pin === figureRelease || hasTailoredFigure(pin);
  const portraitStyles = { animation: '立体动画', game: '游戏立绘', manga: '漫画', natural: '自然' };
  function portraitStyle(recipe) {
    const pin = recipe.packs?.['pine-core'];
    if (pin === facePlaneRelease || hasPixelFace(pin)) return recipe.face?.style || 'animation';
    return pin === illustratedRelease || pin === silhouetteRelease ? recipe.face?.style || 'game' : 'natural';
  }
  function proportionsFor(base, style, pin) {
    const infant = base === 'baby';
    let p = proportions[infant ? 'baby' : 'standard'];
    if (infant && (pin === facePlaneRelease || hasPixelFace(pin))) p = { ...p, eyeCenter: 0.478, eyeWidth: 1.08, eyeOpen: 1.14,
      browWidth: 0.77, browHeight: 0.91, noseLength: 0.72, noseReach: 0.72, lipWidth: 0.92, lipHeight: 0.97 };
    if (hasTailoredFigure(pin) && style === 'animation') {
      const young = base === 'child' || base === 'toddler';
      // The turnaround gives the iris more vertical room while leaving clean skin
      // between lid and brow. The rim and nose share a smaller plane on young faces.
      const study = hasProportionStudy(pin);
      const headWidth = study ? { baby: 1.03, toddler: 1.045, child: 1.055, adult: 0.993 }[base]
        : infant ? 1.015 : young ? 0.975 : 0.935;
      return { ...p, headWidth,
        eyeCenter: infant ? 0.485 : 0.498, eyeWidth: p.eyeWidth * (young ? 1.08 : 1.03),
        eyeOpen: p.eyeOpen * (infant ? 1.17 : young ? 1.27 : 1.22),
        browWidth: p.browWidth * 0.89, browHeight: p.browHeight * 1.06,
        noseWidth: p.noseWidth * (infant ? 1.15 : 0.94), noseLength: p.noseLength * (infant ? 0.85 : 0.92),
        noseReach: p.noseReach * (study ? (infant ? 1.17 : 1.06) : (infant ? 0.83 : 0.91)), lipWidth: p.lipWidth * (infant ? 1.2 : 1.01) };
    }
    if (style === 'animation') return { ...p, headWidth: { baby: 0.916, toddler: 0.934, child: 0.95, adult: 0.938 }[base],
      eyeWidth: p.eyeWidth * 1.09, eyeOpen: p.eyeOpen * 1.09,
      browWidth: p.browWidth * 0.94, noseWidth: p.noseWidth * (infant ? 1.32 : 1.17),
      noseLength: p.noseLength * (infant ? 0.90 : 0.98), noseReach: p.noseReach * (infant ? 1 : 0.96),
      lipWidth: p.lipWidth * (infant ? 1.34 : 1.23) };
    if (style === 'natural') return p;
    const manga = style === 'manga', young = base !== 'adult';
    return { ...p, eyeWidth: p.eyeWidth * (manga ? 1.17 : 1.07), eyeOpen: p.eyeOpen * (manga ? 1.25 : 1.12),
      browWidth: p.browWidth * (manga ? 0.95 : 0.98), noseWidth: p.noseWidth * (manga ? 0.89 : 0.97),
      noseLength: p.noseLength * (manga ? 0.91 : 0.98), noseReach: p.noseReach * (manga ? 0.80 : 0.94),
      lipWidth: p.lipWidth * (manga ? (young ? 0.98 : 0.94) : 1),
      lipHeight: p.lipHeight * (manga ? (young ? 1 : 0.88) : 0.97) };
  }
  const morphs = {
    cheekHeight: ['颧骨高低', '低', '高'], cheekWidth: ['颧部宽度', '窄', '宽'],
    cheekProjection: ['颧骨前凸', '平缓', '突出'], cheekFullness: ['下颊丰满度', '清瘦', '饱满'],
    eyeDepth: ['眼窝深浅', '浅', '深'], eyeWidth: ['眼裂宽度', '窄', '宽'],
    eyeOpening: ['眼睑开合', '收窄', '舒展'], eyeTilt: ['眼尾倾角', '下垂', '上扬'],
    browHeight: ['眉眼距离', '近', '远'], noseBridge: ['鼻梁前伸', '平缓', '高挺'],
    noseWidth: ['鼻翼宽度', '窄', '宽'], mouthWidth: ['唇宽', '窄', '宽'],
    upperLipFullness: ['上唇厚度', '薄', '厚'], lowerLipFullness: ['下唇厚度', '薄', '厚']
  };
  const profileControls = {
    lipProjection: ['嘴唇前后', '内收', '前伸'],
    jawDefinition: ['下颌线清晰度', '柔和', '清晰']
  };
  const basicNoses = {
    classic: ['', 0.172, 0.197, 0.32, 0.10, 0.48, 0.099],
    button: ['', 0.158, 0.155, 0.26, 0.085, 0.59, 0.122],
    wide: ['', 0.235, 0.191, 0.30, 0.09, 0.82, 0.107],
    bridge: ['', 0.148, 0.255, 0.34, 0.178, 0.37, 0.089]
  };
  // label, half span, upper and lower lids, outer-corner lift, curve, double-lid crease
  const eyes = {
    upturned: ['上挑眼', 0.277, 0.105, 0.06, 0.099, 1.0, 0.047],
    downturned: ['垂眼尾', 0.278, 0.118, 0.075, -0.09, 0.85, 0.032],
    monolid: ['单眼皮', 0.27, 0.072, 0.062, 0.034, 0.78, 0],
    hooded: ['内双眼', 0.256, 0.066, 0.078, -0.008, 1.05, 0.045],
    'double-lid': ['宽双眼皮', 0.265, 0.13, 0.078, 0.032, 0.92, 0.08],
    'deep-set': ['深眼窝', 0.244, 0.093, 0.079, -0.016, 0.75, 0.113],
    'doe-eye': ['鹿眼', 0.233, 0.155, 0.111, 0.043, 0.57, 0.035],
    crescent: ['月牙眼', 0.267, 0.09, 0.037, 0.051, 1.16, 0],
    'long-almond': ['长杏眼', 0.307, 0.087, 0.051, 0.069, 0.89, 0.033],
    sleepy: ['半垂眼睑', 0.269, 0.036, 0.078, -0.036, 0.74, 0.065],
    'soft-oval': ['椭圆眼', 0.251, 0.127, 0.1, -0.025, 0.62, 0],
    'level-eye': ['平眼尾', 0.292, 0.085, 0.081, 0, 0.91, 0]
  };
  // label, half span, baseline, arch, outer lift, thickness, arch peak, texture
  const brows = {
    willow: ['柳叶眉', 0.315, 0.224, 0.078, 0.081, 0.034, 0.23, 'plain'],
    angled: ['眉峰眉', 0.303, 0.214, 0.12, 0.016, 0.055, 0.36, 'peak'],
    feathered: ['野生眉', 0.32, 0.205, 0.051, 0.042, 0.074, 0.06, 'feather'],
    fine: ['细弧眉', 0.29, 0.26, 0.082, 0.008, 0.029, 0.12, 'plain'],
    'short-brow': ['短圆眉', 0.208, 0.244, 0.038, -0.009, 0.063, -0.04, 'plain'],
    tapered: ['渐细长眉', 0.329, 0.19, 0.059, 0.052, 0.059, 0.15, 'taper'],
    descending: ['八字眉', 0.285, 0.231, 0.036, -0.091, 0.06, -0.12, 'plain'],
    lifted: ['上扬剑眉', 0.329, 0.218, 0.022, 0.111, 0.059, 0.3, 'taper'],
    'low-flat': ['低平眉', 0.294, 0.157, 0.012, -0.014, 0.06, 0, 'plain'],
    'brow-slit': ['断眉', 0.3, 0.224, 0.045, 0.043, 0.068, 0.23, 'slit']
  };
  // label, width, reach, tip below the eyes, bridge root, wing strength, tip height
  const noses = {
    straight: ['直鼻', 0.157, 0.211, 0.312, 0.16, 0.39, 0.097],
    upturned: ['微翘鼻', 0.179, 0.23, 0.239, 0.09, 0.55, 0.114],
    slender: ['窄鼻', 0.127, 0.171, 0.339, 0.1, 0.31, 0.083],
    rounded: ['圆润鼻尖', 0.2, 0.227, 0.298, 0.08, 0.64, 0.134],
    aquiline: ['弧形鼻梁', 0.163, 0.262, 0.352, 0.18, 0.45, 0.096],
    broad: ['宽鼻梁', 0.244, 0.168, 0.292, 0.13, 0.7, 0.092],
    short: ['短鼻', 0.152, 0.132, 0.236, 0.057, 0.44, 0.087],
    long: ['长鼻尖', 0.178, 0.256, 0.39, 0.145, 0.49, 0.112]
  };
  // label, half width, upper lip, lower lip, outer lift, cupid's bow, parted lip
  const mouths = {
    bow: ['唇峰唇', 0.251, 0.087, 0.068, 0.019, 0.66, 0],
    thin: ['薄唇', 0.283, 0.037, 0.038, 0.005, 0.17, 0],
    'lower-full': ['下唇丰润', 0.263, 0.042, 0.106, 0.018, 0.32, 0],
    'upper-full': ['上唇丰润', 0.268, 0.095, 0.048, 0.014, 0.41, 0],
    wide: ['宽唇', 0.331, 0.058, 0.059, 0.025, 0.31, 0],
    relaxed: ['放松唇', 0.262, 0.061, 0.067, -0.019, 0.33, 0.024],
    pursed: ['轻抿唇', 0.205, 0.041, 0.038, -0.04, 0.22, 0],
    'soft-smile': ['浅笑唇', 0.294, 0.054, 0.075, 0.08, 0.37, 0.016]
  };
  const outlines = {
    oval: ['鹅蛋脸', 0.025, -0.066, -0.015],
    round: ['圆脸', 0.09, 0.134, -0.018],
    square: ['方圆脸', 0.03, 0.207, 0.035],
    heart: ['心形脸', 0.103, -0.173, 0.065],
    long: ['长窄脸', -0.089, -0.074, -0.064],
    diamond: ['菱形脸', 0.142, -0.123, -0.077],
    pear: ['梨形脸', -0.05, 0.122, -0.068]
  };
  const basicEyes = {
    classic: ['', 0.255, 0.108, 0.067, 0.018, 0.85, 0],
    almond: ['', 0.276, 0.109, 0.067, 0.050, 0.92, 0.034],
    round: ['', 0.243, 0.147, 0.10, 0.015, 0.68, 0],
    narrow: ['', 0.265, 0.075, 0.052, 0.036, 1.02, 0]
  };
  const basicBrows = {
    classic: ['', 0.29, 0.210, 0.055, 0.021, 0.048, 0.12, 'plain'],
    straight: ['', 0.305, 0.207, 0.028, 0.007, 0.047, 0.15, 'plain'],
    arched: ['', 0.285, 0.218, 0.095, 0.025, 0.045, 0.21, 'plain'],
    thick: ['', 0.30, 0.215, 0.049, 0.034, 0.069, 0.17, 'plain']
  };
  // The aperture, lid weight and brow clearance are shared with the character generator.
  function illustratedEyeShape(name, style, infant = false) {
    const [, width, up, down, tilt, curve, crease] = eyes[name] || basicEyes[name];
    if (style === 'animation') return { width, up: 0.081 + 0.75 * up, down: 0.031 + 0.56 * down,
      tilt: tilt * 0.45, curve: 0.52 + 0.14 * curve, crease: 0, lidRise: 0.039, lash: infant ? 0.021 : 0.028, infant };
    const manga = style === 'manga';
    return { width, up: (manga ? 0.069 : 0.050) + up * 0.72, down: 0.022 + down * 0.75,
      tilt: tilt * (manga ? 0.64 : 0.73), curve: 0.35 + curve * 0.45,
      crease: !infant && !manga && crease > 0.068 ? 0.041 : 0,
      lash: infant ? 0.018 : manga ? 0.032 : 0.023, infant };
  }
  // Inner to outer canthus. Nine pairs trace the upper and lower lids of the
  // two drawing guides, with the small folds simplified into connected pixel groups.
  const lidArcs = {
    baby: [[-0.53, -0.53], [0.45, -0.94], [0.78, -1], [0.96, -1], [1, -0.99],
      [0.95, -0.94], [0.75, -0.84], [0.43, -0.60], [-0.14, -0.14]],
    adult: [[-0.72, -0.72], [0.35, -0.97], [0.75, -0.96], [0.95, -0.88], [1, -0.74],
      [0.96, -0.60], [0.78, -0.38], [0.53, -0.12], [0.14, 0.14]]
  };
  function animationEye(shape, v, h, blink, side, k, pixel, figure) {
    const q = v / shape.width;
    if (Math.abs(q) >= 1) return 0;
    const arcs = shape.infant ? lidArcs.baby : lidArcs.adult;
    const at = (q + 1) * 4, i = Math.min(7, Math.floor(at)), t = at - i;
    const upper = arcs[i][0] + t * (arcs[i + 1][0] - arcs[i][0]);
    const lower = arcs[i][1] + t * (arcs[i + 1][1] - arcs[i][1]);
    const cant = shape.tilt * q, up = shape.up * (upper > 0 ? upper ** shape.curve : upper);
    const down = (lower > 0 ? shape.up : shape.down) * lower;
    const closed = cant + 0.78 * down + 0.22 * up;
    const top = cant + up + blink * (closed - cant - up);
    const bottom = cant + down + blink * (closed - cant - down);
    const arch = 1 - q * q, weight = (shape.lash + 0.40 * pixel) * (0.63 + 0.29 * arch + 0.21 * q);
    if (blink > 0.89) return Math.abs(h - closed) < weight ? k.lash : 0;
    if (h > top + 0.34 * weight) return h < top + shape.lidRise * arch ? k.lidSkin : 0;
    if (h < bottom) return h > bottom - 0.023 * arch && q > -0.66 ? k.lidRim : 0;
    // The directed gaze leaves a larger wedge of sclera at the outer canthus.
    // Keep one shared light direction across both rounded corneas.
    const ix = (q + (shape.infant ? 0.22 : 0.18)) / (shape.infant ? 0.66 : 0.59);
    const irisHeight = shape.up * 0.73 + shape.down * 0.27;
    const iz = (h - 0.019) / irisHeight;
    const radius = ix * ix + iz * iz;
    if (figure && blink < 0.45 && radius < 1) {
      // At two or three samples across a pupil, reserve one warm light pixel
      // underneath the upper lid. The full-size corneal glint may miss the grid.
      const lightPixel = Math.min(0.53, Math.max(0.22, 1.25 * pixel / irisHeight));
      if (Math.abs(side * ix - 0.25) < lightPixel && Math.abs(iz - 0.25) < lightPixel) return k.glint;
    }
    if (h > top - weight) return k.lash;
    if (radius > 1) return h > top - 2.2 * weight || Math.abs(q) > 0.85 ? k.scleraShade : k.sclera;
    const gleam = Math.min(0.25, 0.168 + pixel * 0.62);
    if (((side * ix - 0.28) / gleam) ** 2 + ((iz - 0.33) / gleam) ** 2 < 1) return k.glint;
    if (radius > 0.89) return k.irisRim;
    if (radius < 0.265) return k.pupil;
    if (iz > 0.40) return k.irisShadow;
    if (iz < -0.22 && ix * side > -0.57) return k.irisLight;
    return k.eyes;
  }
  function illustratedEye(shape, v, h, blink, side, k, pixel, style, figure = false) {
    if (style === 'animation') return animationEye(shape, v, h, blink, side, k, pixel, figure);
    const q = v / shape.width, a = Math.abs(q);
    if (a >= 1.055) return 0;
    const curve = Math.max(0, 1 - q * q) ** shape.curve;
    const open = 1 - blink, mid = shape.tilt * q - 0.044 * blink;
    const top = mid + shape.up * curve * open, bottom = mid - shape.down * curve * open;
    const weight = (shape.lash + pixel * 0.26) * (0.67 + 0.34 * q + 0.26 * curve);
    if (blink > 0.88) return a < 1 && Math.abs(h - mid + 0.018 * curve) < weight ? k.lash : 0;
    if (q > 0.71 && h >= top - weight && h < top + weight * (1.08 - q) * 2.8) return k.lash;
    if (a >= 1) return 0;
    if (shape.crease && open > 0.7 && a < 0.62 && Math.abs(h - top - shape.crease) < 0.011) return k.browSoft;
    if (h > top + weight * 0.48 || h < bottom - 0.009) return 0;
    if (h >= top - weight) return k.lash;
    if (q > 0.43 && h < bottom + 0.012) return k.browSoft;
    // Clip the iris with the lids. Both catchlights face the same world-space light.
    const manga = style === 'manga', irisWidth = manga ? 0.62 : 0.53;
    const ix = (q + 0.045) / irisWidth, iz = (h - 0.012) / (shape.up * 0.74 + shape.down * 0.63);
    const radius = ix * ix + iz * iz;
    if (radius > 1) return k.sclera;
    const highlight = Math.min(0.30, (manga ? 0.23 : 0.18) + pixel * 1.7);
    if (((ix * side + 0.28) / highlight) ** 2 + ((iz - 0.32) / (highlight * 1.08)) ** 2 < 1) return k.glint;
    if (radius < (manga ? 0.25 : 0.26) || iz > 0.47 || radius > 0.90) return k.pupil;
    return iz < -0.15 ? k.irisLight : k.eyes;
  }
  function illustratedBrow(name, style, infant = false) {
    const row = [...(brows[name] || basicBrows[name])];
    row[4] *= 0.76;
    row[5] *= 0.76;
    if (style === 'animation') {
      row[2] += infant ? 0.066 : 0.045;
      row[3] = 0.042 + 0.91 * row[3];
      row[4] *= 0.49;
      row[5] *= infant ? 0.92 : 1.14;
    }
    return row;
  }
  function pigment(hex, red, green, blue) {
    return [red, green, blue].map((gain, i) =>
      Math.min(255, Math.round(parseInt(hex.slice(2 * i, 2 * i + 2), 16) * gain)).toString(16).padStart(2, '0')
    ).join('');
  }
  function illustratedColors(m, colors, tint, style, infant) {
    const manga = style === 'manga', skin = colors.skin.slice(1), iris = colors.eyes.slice(1);
    const hair = (colors.brow || colors.hair).slice(1);
    const lip = colors.lip?.slice(1) || tint(skin, 'a75260', manga ? 0.39 : 0.46);
    m.lash = tint(tint(hair, '292332', 0.76), skin, infant ? 0.43 : manga ? 0.10 : 0.20);
    m.browDeep = tint(tint(hair, '47323a', colors.brow ? 0.10 : 0.24), skin, infant ? 0.60 : 0.23);
    m.browSoft = tint(m.browDeep, skin, 0.38);
    m.sclera = tint(m.faceLight, 'fff5e7', infant ? 0.56 : manga ? 0.71 : 0.65);
    m.glint = 'fff8e9';
    m.pupil = tint(iris, '211d30', 0.77);
    m.irisLight = tint(iris, 'e5b887', manga ? 0.52 : 0.41);
    m.faceEdge = tint(skin, '815766', manga ? 0.15 : 0.11);
    m.templeSkin = tint(m.faceEdge, m.faceMid, 0.57);
    m.foreheadSkin = tint(m.faceMid, m.faceLight, 0.62);
    m.cheekWarm = tint(m.foreheadSkin, tint(skin, 'c97972', 0.46), infant ? 0.28 : 0.24);
    m.cheekVeil = tint(m.foreheadSkin, m.cheekWarm, 0.54);
    m.noseLight = tint(m.faceLight, 'ffe4ca', manga ? 0.10 : 0.19);
    m.noseShade = tint(m.faceMid, '8b595c', manga ? 0.27 : 0.38);
    m.bridgeSkin = tint(m.faceLight, m.faceMid, 0.34);
    m.wingSkin = tint(m.faceMid, m.faceEdge, 0.42);
    m.lipLine = tint(lip, '69434b', infant ? 0.17 : 0.27);
    m.upperLip = tint(m.faceMid, lip, 0.73);
    m.lowerLip = tint(m.faceLight, lip, manga ? 0.24 : 0.44);
    m.lips = m.lipLine;
    if (style === 'animation') {
      m.faceEdge = tint(skin, '553f40', 0.18);
      m.templeSkin = tint(skin, '70504b', 0.10);
      m.faceMid = skin;
      m.foreheadSkin = tint(skin, 'f5d4b6', 0.10);
      m.faceLight = tint(skin, 'ffe1c3', 0.145);
      m.cheekLight = tint(skin, 'ffe9cd', 0.20);
      m.cheekWarm = tint(m.foreheadSkin, tint(skin, 'ce7870', 0.31), 0.53);
      m.cheekVeil = tint(m.faceLight, m.cheekWarm, 0.53);
      m.bridgeSkin = tint(m.foreheadSkin, m.faceLight, 0.63);
      m.wingSkin = tint(m.faceMid, m.templeSkin, 0.35);
      m.noseLight = m.cheekLight;
      m.noseShade = tint(skin, '795057', 0.28);
      m.lash = tint(tint(iris, '30232a', 0.69), skin, infant ? 0.24 : 0.12);
      m.browDeep = tint(tint(hair, '4c373a', 0.45), skin, infant ? 0.57 : 0.33);
      if (!colors.brow) m.browDeep = tint(tint(skin, '382b30', infant ? 0.40 : 0.53), tint(hair, '382b30', 0.70), 0.32);
      m.browSoft = tint(m.browDeep, skin, 0.42);
      m.browVeil = tint(m.browDeep, skin, 0.64);
      m.lidSkin = tint(skin, '85594e', 0.24);
      m.lidRim = tint(skin, 'b47164', 0.34);
      m.sclera = tint(m.faceLight, 'fce6cf', infant ? 0.70 : 0.77);
      m.scleraShade = tint(m.sclera, m.templeSkin, 0.31);
      m.pupil = tint(iris, '170e12', 0.88);
      m.eyes = tint(iris, 'ac7852', 0.16);
      m.irisRim = tint(iris, '241619', 0.68);
      m.irisShadow = tint(iris, '432c2c', 0.50);
      m.irisLight = tint(iris, 'dfaa70', 0.52);
      const lipDye = colors.lip?.slice(1) || tint(pigment(skin, 1.02, 0.74, 0.80), 'b55e58', infant ? 0.21 : 0.32);
      m.lipLine = tint(pigment(lipDye, 0.64, 0.55, 0.54), '582921', 0.18);
      m.upperLip = pigment(lipDye, 0.94, 0.86, 0.81);
      m.lowerLip = tint(lipDye, 'e59a88', infant ? 0.20 : 0.26);
      m.lipGlow = tint(m.lowerLip, 'f4bd9e', infant ? 0.16 : 0.24);
      m.lips = m.lipLine;
      m.nostril = tint(skin, '492e32', 0.60);
      m.noseLight = tint(skin, 'ffce9b', 0.35);
      m.wingSkin = tint(skin, 'b8675b', 0.25);
      m.noseShade = tint(m.wingSkin, '5c3738', 0.33);
      // Four levels of local cheek colour share the same twelve diffuse values
      // as the forehead, so the cheek turns in light without a painted-on disc.
      for (let warmth = 0; warmth < 4; warmth++) {
        const base = tint(skin, 'da6c53', warmth * 0.074);
        const shadow = tint(pigment(base, 0.71, 0.62, 0.58), '482a30', 0.12);
        const light = tint(pigment(base, 1.22, 1.13, 1.08), 'ffddba', 0.12);
        for (let i = 0; i < 12; i++)
          m['skinPlane' + (12 * warmth + i)] = i < 5 ? tint(shadow, base, i / 5) : tint(base, light, (i - 5) / 6);
      }
    }
  }
  const labels = (profiles) => Object.fromEntries(Object.entries(profiles).map(([id, row]) => [id, row[0]]));
  const features = { eyes: labels(eyes), brows: labels(brows), nose: labels(noses), mouth: labels(mouths) };
  const details = {
    outline: labels(outlines),
    iris: {
      limbal: '深色瞳缘',
      sunburst: '放射纹虹膜',
      'two-tone': '双环虹膜',
      amber: '琥珀内环',
      large: '大瞳仁'
    },
    complexion: {
      freckles: '两颊雀斑',
      sunspots: '鼻梁雀斑',
      'left-mole': '左眼下痣',
      'lip-mole': '唇边痣',
      dimples: '浅酒窝',
      'beauty-spots': '散点美人痣',
      'fine-lines': '眼角细纹',
      'smile-lines': '笑纹',
      birthmark: '面颊胎记',
      'cheek-scar': '浅色颊痕'
    },
    makeup: {
      blush: '桃色腮红',
      draping: '斜扫腮红',
      eyeliner: '细眼线',
      winged: '上扬眼线',
      shadow: '柔雾眼影',
      shimmer: '眼角提亮'
    },
    facialHair: {
      stubble: '短胡茬',
      moustache: '短髭',
      pencil: '细胡须',
      handlebar: '翘角胡',
      goatee: '山羊胡',
      chinstrap: '下颌胡线',
      beard: '短络腮胡',
      sideburns: '长鬓角'
    }
  };
  const dyes = { brow: '眉色', lip: '唇色', leftEye: '左瞳色', makeup: '妆色', beard: '胡须色' };
  function color(colors, key) {
    return (
      colors[key] ||
      { brow: colors.hair, beard: colors.hair, leftEye: colors.eyes, lip: '#ad756d', makeup: '#c28a85' }[key]
    );
  }
  function materials(colors, tint) {
    const ink = {};
    for (const key of Object.keys(dyes)) {
      const base = color(colors, key).slice(1);
      ink[key + 'Pigment'] = base;
      ink[key + 'Deep'] = tint(base, '302935', 0.43);
      ink[key + 'Soft'] = tint(base, colors.skin.slice(1), 0.45);
    }
    ink.mark = tint(colors.skin.slice(1), '6b453c', 0.64);
    ink.skinFold = tint(colors.skin.slice(1), '725854', 0.34);
    ink.skinMark = tint(colors.skin.slice(1), '92574e', 0.5);
    ink.scar = tint(colors.skin.slice(1), 'ead0b7', 0.57);
    ink.makeupGlint = tint(color(colors, 'makeup').slice(1), 'fff0da', 0.67);
    ink.irisGold = tint(colors.eyes.slice(1), 'daae63', 0.6);
    if (colors.lip) {
      ink.upperLip = tint(colors.lip.slice(1), '775054', 0.23);
      ink.lowerLip = tint(colors.lip.slice(1), 'f4cebb', 0.32);
      ink.lipLine = tint(colors.lip.slice(1), '573d42', 0.41);
      ink.lips = ink.upperLip;
    }
    return ink;
  }
  function outlineWidth(row, h) {
    const peak = (at, span) => Math.max(0, 1 - ((h - at) / span) ** 2) ** 2;
    return 1 + row[1] * peak(-0.12, 0.51) + row[2] * peak(-0.57, 0.43) + row[3] * peak(0.45, 0.46);
  }
  function jawBreadth(outline, jaw, h, outlineStrength = 1) {
    const jawScale = 1 + 0.82 * (jaw - 1) * Math.max(0, Math.min(1, -h));
    const width = outline ? outlineWidth(outline, h) : 1;
    return jawScale * (outlineStrength === 1 ? width : 1 + outlineStrength * (width - 1));
  }
  function eye(row, v, h, blink, side, k, irisSpan = 1) {
    const [, width, up, down, tilt, power, crease] = row,
      q = v / width;
    if (Math.abs(q) >= 1) return 0;
    const curve = (1 - q * q) ** power,
      open = 1 - blink,
      pos = h - tilt * q + 0.047 * blink;
    const top = up * curve * open,
      bottom = -down * curve * open;
    if (
      crease &&
      open > 0.24 &&
      Math.abs(pos - top - crease * (0.4 + 0.6 * curve)) < 0.014 &&
      q > -0.78 &&
      q < 0.83
    )
      return k.browSoft;
    if (pos > top + 0.021 || pos < bottom - 0.014) return 0;
    if (blink > 0.86 || pos > top - 0.017) return k.lash;
    if (pos < bottom + 0.012 && q > 0.18) return k.browSoft;
    const iris = (q / (0.5 * irisSpan)) ** 2 + ((pos - 0.009) / 0.127) ** 2;
    if (iris > 1) return k.sclera;
    if (q * side > -0.28 && q * side < -0.085 && pos > 0.014 && pos < 0.06) return k.glint;
    return iris < 0.22 ? k.pupil : pos < -0.015 ? k.irisLight : k.eyes;
  }
  function brow(row, v, h, k, pixel = 0) {
    const [, span, base, arch, tilt, thick, peak, cut] = row,
      q = v / span;
    if (Math.abs(q) >= 1 || (cut === 'slit' && q > 0.24 && q < 0.53)) return 0;
    const arc = cut === 'peak' ? 1 - Math.abs(q - peak) * 0.85 : 1 - (q - peak) ** 2 * 0.77;
    const line = base + arch * arc + tilt * q,
      width = thick * (1 - 0.32 * Math.abs(q) - (cut === 'taper' ? 0.5 : 0.23) * Math.max(0, q));
    const d = h - line;
    if (pixel) {
      const coverage = (width + pixel - Math.abs(d)) / (2 * pixel);
      if (coverage < 0.21) return 0;
      if (coverage < 0.47) return k.browVeil;
      if (coverage < 0.80) return k.browSoft;
    }
    if (Math.abs(d) > width) return 0;
    if (cut === 'feather' && d > 0 && Math.cos(29 * q - 18 * d) < -0.25) return k.browSoft;
    return d > width * 0.31 ? k.browSoft : k.lash;
  }
  function mouth(row, v, h, k, pixel) {
    const [, width, up, down, lift, bow, gap] = row,
      q = Math.abs(v) / width;
    if (q >= 1) return 0;
    const taper = 1 - q * q,
      mid = lift * q * q - 0.008;
    const upper = up * taper * (1 - bow * Math.min(1, Math.abs(q - 0.35) * 2.25));
    const coverage = pixel * (1 - 0.68 * q);
    if (h > mid + upper + coverage || h < mid - down * taper - coverage) return 0;
    if (Math.abs(h - mid) < (gap || 0.014) * taper + 0.006) return k.lipLine;
    return h > mid ? k.upperLip : k.lowerLip;
  }
  function animationMouth(row, v, h, k, pixel, infant) {
    const [, width, up, down, lift, bow, gap] = row, q = Math.abs(v) / width;
    if (q >= 1.06) return 0;
    const unit = Math.min(q, 1), arch = 1 - unit * unit, seam = lift * unit ** 2.45 - 0.006;
    const dy = h - seam;
    const line = Math.max(0.012 + 0.24 * gap, pixel * 0.72) * (1 - 0.31 * unit);
    if (Math.abs(dy) < line) return k.lipLine;
    if (q >= 1) return 0;
    // Trace the shallow central notch, paired peaks and convex lower lip.
    // A single small light group under the closure survives the pixel grid.
    const notch = Math.max(0, 1 - q / 0.32);
    const upper = up * arch * (1 - bow * 0.55 * notch) + pixel * 0.24 * arch;
    const lower = down * arch * (1 - 0.28 * unit) + pixel * 0.27 * arch;
    if (dy > 0 && dy < upper) return k.upperLip;
    if (dy >= 0 || -dy >= lower) return 0;
    return !infant && q < 0.40 && -dy > 0.35 * lower && -dy < 0.68 * lower ? k.lipGlow : k.lowerLip;
  }
  // A whole-figure head may have only five pixels across its mouth. Design
  // those clusters at their own scale. Each row describes one half, from the
  // centre to the corner, painted in the moving mouth's local coordinates.
  const figureLips = {
    classic: ['....', '---.', 'll..'], small: ['....', '--..', 'l...'],
    full: ['uu..', '----', 'lll.'], smile: ['...-', '---.', '.l..'],
    bow: ['.u..', '-u-.', 'll..'], thin: ['....', 'u---', '....'],
    'lower-full': ['....','---.', 'hll.'], 'upper-full': ['uuu.', 'u--.', 'l...'],
    wide: ['....','----','lll.'], relaxed: ['....', 'uu--', 'hl..'],
    pursed: ['.u..','-u..','ll..'], 'soft-smile': ['...u','uu-.','hll.']
  };
  function figureMouth(name, v, h, width, pixel, k) {
    const y = 1 - Math.round(h / (2 * pixel)), x = Math.floor(4 * Math.abs(v) / (1.08 * width));
    if (y < 0 || y > 2 || x > 3) return 0;
    const mark = figureLips[name][y][x];
    if (mark === '-') return k.lipLine;
    if (mark === 'u') return k.upperLip;
    if (mark === 'l') return k.lowerLip;
    return mark === 'h' ? k.lipGlow : 0;
  }
  function noseUnderside(row, fittedProfile) {
    return fittedProfile ? 0.107 + 0.52 * row[6] : Math.max(0.105, Math.min(0.11, row[6]));
  }
  function tipProjection(row, reachScale, bridgeScale) {
    const reach = row[2] * reachScale;
    return (0.83 * reach - 0.37 * Math.max(0, reach - 0.15)) * (1 + 0.14 * (bridgeScale - 1));
  }
  // One dorsal line from the nasal root, around the tip and back to the philtrum.
  // Store the extra depth over this particular face, ready for any pose or camera.
  function noseContour(row, fit, eyeZ, mouthZ, front, bridgeScale, reachScale, animated = false) {
    const tip = eyeZ - row[3] * fit.rz, root = eyeZ + row[4] * fit.rz;
    const underside = Math.max(0.055, Math.min(noseUnderside(row, true), 0.79 * (tip - mouthZ) / fit.rz));
    const base = tip - underside * fit.rz, baseX = front(0, base), rootX = front(0, root);
    const tipX = front(0, tip) + fit.rx * tipProjection(row, reachScale, bridgeScale);
    const reach = fit.rx * row[2] * reachScale * 0.92;
    const steps = 96, smooth = t => t * t * (3 - 2 * t);
    const relief = Float32Array.from({ length: steps + 1 }, (_, i) => {
      const z = base + i * (root - base) / steps;
      let ridge;
      if (z < tip) ridge = tipX + (baseX - tipX) * smooth((tip - z) / (tip - base));
      else {
        const t = (root - z) / (root - tip), rise = smooth(t) ** (animated ? 2.24 : 1.16);
        const rootTurn = Math.max(0, 1 - ((t - 0.25) / 0.25) ** 2) ** 2;
        ridge = rootX + (tipX - rootX) * rise +
          reach * ((bridgeScale - 1) * 3.0 * rise * (1 - rise) - 0.115 * rootTurn);
      }
      return Math.max(0, (ridge - front(0, z)) / reach);
    });
    return { underside, at(z) {
      const i = Math.min(steps, Math.max(0, (z - base) * steps / (root - base)));
      const lo = Math.min(steps - 1, Math.floor(i));
      return relief[lo] + (relief[lo + 1] - relief[lo]) * (i - lo);
    } };
  }
  function nose(row, b, k, fit, eyeZ, front, widthScale = 1, bridgeScale = 1, reachScale = 1, shapedTip = false, style = 'natural', contour = null, pixelPortrait = false) {
    const [, baseWidth, baseReach, length, start, wingStrength, tipHeight] = row,
      { x: cx, rx, ry, rz } = fit;
    const reach = baseReach * reachScale * (shapedTip ? 0.92 : 1);
    const maxWidth = baseWidth * Math.max(1, widthScale) * ry;
    const root = eyeZ + start * rz,
      tip = eyeZ - length * rz;
    const underside = contour?.underside ?? (shapedTip ? Math.max(0.105, 1.25 * tipHeight) : 0.11);
    b.stamp(cx + 0.49 * rx, cx + (1.46 + Math.max(0, bridgeScale - 1) * reach) * rx, -maxWidth, maxWidth, tip - underside * rz, root, (x, y, z) => {
      const t = (root - z) / (root - tip);
      const wingBlend = Math.min(1, Math.max(0, (t - 0.15) / 0.65));
      const width = baseWidth * (1 + (widthScale - 1) * wingBlend * wingBlend * (3 - 2 * wingBlend));
      const q = y / (width * ry), h = (z - tip) / rz;
      if (t < 0 || Math.abs(q) >= 1) return 0;
      const bulb = Math.max(0, 1 - (q / 0.66) ** 2 - (h / (shapedTip && h < 0 ? underside : tipHeight)) ** 2);
      const wing = Math.max(0, 1 - ((Math.abs(q) - 0.63) / 0.38) ** 2 - ((h + 0.032) / 0.073) ** 2);
      let offset;
      if (contour) {
        const span = 0.43 + (style === 'animation' ? 0.39 : 0.31) * Math.max(0, 1 - (h / 0.22) ** 2);
        const curve = Math.max(0, 1 - (q / span) ** 2);
        const dorsum = contour.at(z) * (style === 'animation' ? Math.sqrt(curve) : curve);
        offset = Math.max(dorsum, 0.72 * wing * wingStrength);
      } else {
        const bridgeWidth = shapedTip ? 0.49 + 0.20 * t : 0.39 + 0.19 * t;
        const bridge = Math.max(0, 1 - (q / bridgeWidth) ** 2) * Math.min(1, t) *
          Math.max(0, Math.min(1, (1.19 - t) / 0.29));
        offset = Math.max(bridge * bridgeScale, bulb, wing * wingStrength);
      }
      const surface = front(y, z);
      if (offset < 0.045 || x < surface - 0.12 * rx || x > surface + reach * rx * offset) return 0;
      if (pixelPortrait) {
        const nostril = ((Math.abs(q) - 0.54) / 0.18) ** 2 + ((h + 0.055) / 0.026) ** 2;
        const glint = ((q + 0.13) / 0.25) ** 2 + ((h - 0.033) / 0.052) ** 2;
        if (nostril < 1 && wing > 0.2) return k.nostril;
        if (glint < 0.26 && bulb > 0.40) return k.noseGlow;
        if (glint < 1 && bulb > 0.31) return k.noseLight;
        if (h < -0.084 && Math.abs(q) < 0.77) return Math.abs(q) > 0.47 ? k.noseShade : k.wingSkin;
        if (h < 0.013 && (bulb > 0.11 || wing > 0.28)) return k.wingSkin;
        return q > 0.44 ? k.skinPlane7 : k.skinPlane9;
      }
      if (style === 'animation') {
        const nostril = ((Math.abs(q) - 0.62) / 0.18) ** 2 + ((h + 0.047) / 0.031) ** 2;
        if (nostril < 1 && wing > 0.30) return k.nostril;
        if (h < -0.040) return Math.abs(q) > 0.36 && wing > 0.22 ? k.noseShade : k.wingSkin;
        if (bulb > 0.41 && h > 0.003 && q > -0.53 && q < 0.32) return k.noseLight;
        if (wing > 0.32 || (bulb > 0.34 && h < 0.01)) return k.wingSkin;
        return q > 0.39 ? k.foreheadSkin : k.bridgeSkin;
      }
      if (style !== 'natural') {
        if (h < -0.033 && wing > 0.38 && Math.abs(q) > 0.45 && Math.abs(q) < 0.78) return k.noseShade;
        if (h < -0.028) return k.wingSkin;
        if (bulb > 0.59 && h > 0.008 && q > -0.38 && q < 0.15) return k.noseLight;
        if (t > 0.56 && q > 0.48) return k.wingSkin;
        return q > 0.22 && t > 0.36 ? k.faceMid : k.bridgeSkin;
      }
      if (shapedTip && h < -0.029 && h > -0.085 && Math.abs(q) > 0.47 && Math.abs(q) < 0.91 && wing > 0.16)
        return k.noseShade;
      if (wing > 0.25 && h < -0.024 && Math.abs(q) > 0.38 && Math.abs(q) < 0.75) return k.noseShade;
      return h < -0.025 || q > 0.44 ? k.faceEdge : q < -0.19 && q > -0.62 ? k.noseLight : k.faceMid;
    });
  }
  function iris(style, pigment, v, h, side, twoEyes, k) {
    if (twoEyes && side > 0 && k.irisHoney && pigment === k.irisHoney) return k.leftEyeSoft;
    if (twoEyes && side > 0 && (pigment === k.irisShadow || pigment === k.irisRim)) return k.leftEyeDeep;
    if (pigment !== k.eyes && pigment !== k.irisLight && pigment !== k.pupil && pigment !== k.eyeRim)
      return pigment;
    const dyed = twoEyes && side > 0,
      main = dyed ? k.leftEyePigment : k.eyes,
      dark = dyed ? k.leftEyeDeep : k.pupil;
    const r = (v / 0.137) ** 2 + (h / 0.125) ** 2;
    if (style === 'limbal' && r > 0.46) return dark;
    if (style === 'large' && r < 0.73) return dark;
    if (style === 'two-tone' && r > 0.22 && r < 0.63) return dyed ? k.leftEyeSoft : k.irisLight;
    if (style === 'amber' && r < 0.7 && r > 0.12) return k.irisGold;
    if (style === 'sunburst' && r > 0.18 && Math.cos(9 * Math.atan2(h, v)) > 0.03)
      return dyed ? k.leftEyeSoft : k.irisLight;
    if (!dyed) return pigment;
    return pigment === k.pupil || pigment === k.eyeRim
      ? dark
      : pigment === k.irisLight
        ? k.leftEyeSoft
        : main;
  }
  const dots = [
    [-0.77, -0.17],
    [-0.62, -0.21],
    [-0.54, -0.14],
    [-0.71, -0.27],
    [0.48, -0.19],
    [0.59, -0.13],
    [0.7, -0.24],
    [0.78, -0.18]
  ];
  const bridgeDots = [
    [-0.52, -0.15],
    [-0.36, -0.13],
    [-0.21, -0.12],
    [-0.08, -0.16],
    [0.12, -0.14],
    [0.27, -0.11],
    [0.43, -0.15],
    [0.6, -0.18]
  ];
  function skinInk(face, u, v, h, eyeH, mouthH, eyeOffset, k) {
    const a = Math.abs(v),
      eye = h - eyeH,
      lip = h - mouthH;
    if (face.complexion && u > 0.26 && eye < 0.01 && h > -0.68) {
      const mode = face.complexion;
      const spot = (cy, cz, r) => ((v - cy) / r) ** 2 + ((eye - cz) / (r * 0.86)) ** 2 < 1;
      if (mode === 'fine-lines' && a > 0.64 && a < 0.92) {
        const outward = a - 0.64;
        if (
          Math.abs(eye + 0.088 + 0.37 * outward) < 0.023 ||
          (outward > 0.072 && Math.abs(eye + 0.024 + 0.14 * outward) < 0.018)
        )
          return k.skinFold;
      }
      if (
        mode === 'smile-lines' &&
        eye < -0.23 &&
        lip > -0.09 &&
        Math.abs(a - (0.26 - 0.38 * (eye + 0.23))) < 0.025
      )
        return k.skinFold;
      if (mode === 'birthmark' && (spot(-0.65, -0.27, 0.114) || spot(-0.72, -0.3, 0.088))) return k.skinMark;
      if (mode === 'cheek-scar' && v > 0.44 && v < 0.79 && Math.abs(eye + 0.29 - 0.45 * (v - 0.58)) < 0.028)
        return k.scar;
      if (mode === 'freckles' || mode === 'sunspots') {
        const points = mode === 'freckles' ? dots : bridgeDots;
        for (let i = 0; i < points.length; i++)
          if (spot(points[i][0], points[i][1], i % 3 === 0 ? 0.039 : 0.03)) return k.mark;
      } else if (
        (mode === 'left-mole' && spot(0.64, -0.17, 0.048)) ||
        (mode === 'lip-mole' && Math.hypot(v + 0.34, lip - 0.025) < 0.051)
      )
        return k.mark;
      else if (mode === 'beauty-spots' && (spot(-0.49, -0.16, 0.042) || spot(0.74, -0.36, 0.05)))
        return k.mark;
      else if (
        mode === 'dimples' &&
        Math.abs(a - 0.43) < 0.038 &&
        Math.abs(lip - 0.065 + (a - 0.43) * 0.52) < 0.056
      )
        return k.noseShade;
    }
    if (face.makeup && u > 0.3) {
      const mode = face.makeup,
        q = (a - eyeOffset) / 0.29;
      const blush =
        ((a - (mode === 'draping' ? 0.71 : 0.59)) / 0.23) ** 2 +
        ((eye + 0.28 - (mode === 'draping' ? 0.38 * (a - 0.59) : 0)) / 0.106) ** 2;
      if ((mode === 'blush' || mode === 'draping') && blush < 1)
        return blush < 0.45 ? k.makeupPigment : k.makeupSoft;
      if (mode === 'shimmer' && Math.abs(q + 0.73) < 0.21 && Math.abs(eye - 0.008) < 0.05)
        return k.makeupGlint;
      if (mode === 'shadow' && Math.abs(q) < 1.04 && eye > 0.055 && eye < 0.185 * (1 - 0.56 * q * q))
        return k.makeupSoft;
      if (
        (mode === 'eyeliner' || mode === 'winged') &&
        q > 0.2 &&
        q < (mode === 'winged' ? 1.26 : 1) &&
        Math.abs(eye - (0.094 - 0.055 * q * q + (mode === 'winged' ? 0.1 * q * q : 0))) < 0.03
      )
        return k.makeupDeep;
    }
    if (face.facialHair && u > -0.1) {
      const mode = face.facialHair,
        hair = k.beardPigment,
        shade = k.beardDeep;
      const moustache = lip > 0.068 && lip < 0.159 - 0.045 * a && a < 0.31 && a > 0.02;
      const jaw = h < -0.33 - 0.16 * Math.max(0, 0.8 - a) && h > -0.98;
      const beard = jaw && (a > 0.32 + 0.32 * Math.max(0, h + 0.67) || lip < -0.12);
      if (mode === 'moustache' && moustache) return hair;
      if (mode === 'pencil' && a < 0.3 && a > 0.022 && Math.abs(lip - 0.085 + 0.085 * a) < 0.029)
        return shade;
      if (
        mode === 'handlebar' &&
        ((moustache && a < 0.29) ||
          (a > 0.23 && a < 0.43 && Math.abs(lip - (0.085 + 0.95 * (a - 0.28) ** 2 * 3)) < 0.042))
      )
        return hair;
      if (mode === 'goatee' && a < 0.24 && (moustache || (lip < -0.11 && h > -0.94 && a < 0.28 + 0.18 * h)))
        return shade;
      if (mode === 'sideburns' && a > 0.84 && h < 0.045 && h > -0.43 && u < 0.58) return hair;
      if (mode === 'chinstrap' && jaw && ((a > 0.62 && a < 0.94 && h < -0.3) || (h < -0.73 && lip < -0.2)))
        return hair;
      if (mode === 'beard' && (beard || moustache)) return a > 0.57 || h < -0.72 ? shade : hair;
      if (mode === 'stubble' && beard && Math.cos(v * 79 + h * 31) * Math.cos(h * 68 - v * 24) > 0.09)
        return k.beardSoft;
    }
    return 0;
  }
  return {
    proportions,
    illustratedRelease, silhouetteRelease, facePlaneRelease, pixelRelease, figureRelease, tailoredRelease, proportionStudyRelease, structureStudyRelease, gameFaceRelease, baseFaceRelease, clothingStudyRelease, hasBaseFace, hasGameFace, hasStructureStudy, hasProportionStudy, hasTailoredFigure, hasPixelFace, portraitStyles, portraitStyle, proportionsFor, tipProjection, noseContour,
    illustratedEyeShape, illustratedEye, illustratedBrow, illustratedColors,
    morphs,
    profileControls,
    basicNoses,
    features,
    details,
    dyes,
    color,
    materials,
    eyes,
    brows,
    noses,
    mouths,
    outlines,
    outlineWidth,
    jawBreadth,
    eye,
    brow,
    mouth, animationMouth, figureMouth,
    nose,
    noseUnderside,
    iris,
    skinInk
  };
})();
