// Dimensions are in the same local units as the character slices.
const studioProps = (() => {
  const materials = {
    deviceInk: '223442',
    deviceSlate: '405464',
    deviceBack: '597483',
    deviceEdge: '9eafb3',
    deviceShell: 'c0ceca',
    deviceKey: '657b88',
    deviceGlass: '215375',
    deviceBlue: '318bb3',
    deviceAqua: '56bbcd',
    deviceGlow: 'b0f4e7',
    deviceGold: 'ffce78',
    deviceHill: '478a9c',
    devicePine: '2b6376',
    foldWood: 'bf8850',
    foldHoney: 'dbab6b',
    foldGrain: 'ab764a',
    foldEnd: '956647',
    foldTube: '426b71',
    foldGlint: '7d9693',
    foldFoot: '324b51',
    foldPin: 'e5b874'
  };

  function roundedPanel(u, v, halfU, halfV, radius) {
    const a = Math.max(0, Math.abs(u) - halfU + radius);
    const b = Math.max(0, Math.abs(v) - halfV + radius);
    return a * a + b * b <= radius * radius;
  }

  // Each value is a cell of the display, independent of the actor's raster density.
  const phonePixels = [
    'bbgbbb',
    'ccbbcc',
    'cccccc',
    'ccgccb',
    'cggbbb',
    'bbbbbb',
    'bggggb',
    'bbbbbb',
    'bggbbb',
    'bbbbbb'
  ];
  const phoneColors = { b: 'deviceBlue', c: 'deviceAqua', g: 'deviceGlow' };

  function phone(x, y, z, ink, pad, style) {
    // The glass is on x=0. The rear shell extends 0.6 units away from the palm.
    if (x < -pad || x > 0.6 + pad || !roundedPanel(y, z, 1.55, 2.75, 0.42)) return 0;
    if (x >= 0.3) {
      if (!roundedPanel(y, z, 1.39, 2.59, 0.33)) return ink.deviceEdge;
      if (Math.abs(y - 0.67) < 0.52 && Math.abs(z - 1.83) < 0.59) {
        return Math.abs(y - 0.67) < 0.22 && z > 1.91 ? ink.deviceAqua : ink.deviceInk;
      }
      if (style === 'rugged') return Math.abs(y) > 1 || Math.abs(z) > 2.1 ? ink.deviceShade : ink.deviceMain;
      if (style === 'folio') return y < -0.89 || Math.abs(z - 0.2) < 0.3 ? ink.deviceLight : ink.deviceMain;
      if (y < -0.72 && z > 1.65 && z < 2.08) return ink.deviceShell;
      return z < -2.27 ? ink.deviceSlate : ink.deviceBack;
    }
    if (!roundedPanel(y, z, 1.27, 2.39, 0.29)) return ink.deviceInk;
    if (z > 2.07 && Math.abs(y) < 0.39) return ink.deviceGlass;
    if (z < -1.95) return Math.abs(y) < 0.68 && z > -2.21 ? ink.deviceGlow : ink.deviceGlass;
    const col = Math.min(5, Math.max(0, Math.floor(((1.27 - y) * 6) / 2.54)));
    const row = Math.min(9, Math.max(0, Math.floor(((2.39 - z) * 10) / 4.34)));
    return ink[phoneColors[phonePixels[row][col]]];
  }

  // The laptop shows a little field map, with a toolbar, a sidebar and a sunlit ridge.
  const ridge = [8, 8, 7, 6, 6, 5, 4, 5, 6, 7, 7, 6, 6, 5, 5, 6, 7, 7, 6, 5];
  const nearRidge = [10, 9, 9, 8, 8, 9, 10, 10, 9, 9, 8, 7, 7, 8, 9, 9, 8, 8, 7, 7];
  function laptopScreen(y, height, ink) {
    const col = Math.min(23, Math.max(0, Math.floor(((6.78 - y) * 24) / 13.56)));
    const row = Math.min(11, Math.max(0, Math.floor(((7.45 - height) * 12) / 6.54)));
    if (row <= 1) {
      if (col === 1) return ink.deviceGold;
      if (col >= 5 && col <= 11 && row === 1) return ink.deviceGlow;
      return ink.deviceGlass;
    }
    if (col < 4) {
      if ((row === 4 || row === 7 || row === 10) && (col === 1 || col === 2))
        return row === 4 ? ink.deviceGold : ink.deviceAqua;
      return ink.deviceSlate;
    }
    const mx = col - 4;
    if (row >= nearRidge[mx]) return row === 10 && mx > 1 && mx < 10 ? ink.deviceAqua : ink.devicePine;
    if (row >= ridge[mx]) return row === ridge[mx] && mx >= 4 && mx <= 7 ? ink.deviceGlow : ink.deviceHill;
    if ((mx - 14) * (mx - 14) + (row - 4) * (row - 4) <= 2) return ink.deviceGold;
    return row < 5 ? ink.deviceBlue : ink.deviceAqua;
  }

  function keyboard(x, y, ink) {
    const side = Math.abs(y);
    if (x > -0.99 && x < 2.84 && side < 6.44) {
      const row = Math.floor((x + 0.99) / 0.96);
      const rowEdge = x + 0.99 - row * 0.96;
      const across = (y + 6.44) / 1.18 + (row % 2) * 0.41;
      const keyEdge = across - Math.floor(across);
      if (rowEdge < 0.16 || rowEdge > 0.84) return ink.deviceInk;
      if (row === 0 && side < 2.34) return ink.deviceKey;
      if (keyEdge < 0.1 || keyEdge > 0.87) return ink.deviceInk;
      return rowEdge < 0.35 ? ink.deviceKey : ink.deviceSlate;
    }
    if (x < -1.36 && x > -3.47 && side < 2.38) {
      return side > 2.03 || x > -1.7 || x < -3.16 ? ink.deviceEdge : ink.deviceShell;
    }
    return ink.deviceShell;
  }

  const lidSin = 0.233,
    lidCos = Math.sqrt(1 - lidSin * lidSin);
  function laptop(x, y, z, ink, pad, style) {
    const side = Math.abs(y),
      hingeX = x - 4;
    const h = hingeX * lidSin + z * lidCos,
      normal = hingeX * lidCos - z * lidSin;
    if (h >= 0 && normal >= -0.38 - pad && normal <= 0.38 + pad && roundedPanel(y, h - 4, 7.5, 4, 0.46)) {
      if (normal >= 0) {
        if (!roundedPanel(y, h - 4, 7.25, 3.75, 0.37)) return ink.deviceEdge;
        if (style === 'field')
          return side > 6.3 || h < 1.0 || h > 7.0
            ? ink.deviceShade
            : Math.abs(h - 4) < 0.29 && side < 4
              ? ink.deviceLight
              : ink.deviceMain;
        if (style === 'stickers') {
          if (Math.abs(y + 3.6) + Math.abs(h - 5.5) < 1.55) return ink.deviceGold;
          if ((y - 2.9) ** 2 + (h - 3) ** 2 < 2.7) return h > 3 ? ink.deviceAqua : ink.devicePine;
          return ink.deviceMain;
        }
        if (Math.abs(y) * 1.15 + Math.abs(h - 4.1) < 0.86) return h > 4.1 ? ink.deviceShell : ink.deviceEdge;
        return h < 0.87 ? ink.deviceSlate : ink.deviceBack;
      }
      if (roundedPanel(y, h - 4.18, 6.78, 3.27, 0.19)) return laptopScreen(y, h, ink);
      if (h > 7.5 && side < 0.27) return ink.deviceEdge;
      return ink.deviceInk;
    }
    // Split hinge barrels join the silver keyboard deck to the display at x=4.
    if (hingeX * hingeX + (z - 0.08) * (z - 0.08) < 0.47 * 0.47 && side > 3.68 && side < 6.75)
      return side > 6.36 ? ink.deviceEdge : ink.deviceSlate;
    if (z > 0 || z < -0.99 || !roundedPanel(x, y, 4, 7.5, 0.48)) return 0;
    if (z < -0.59) return ink.deviceSlate;
    if (!roundedPanel(x, y, 3.83, 7.3, 0.42)) return ink.deviceEdge;
    return keyboard(x, y, ink);
  }

  function stool(x, y, z, ink) {
    const side = Math.abs(y);
    if (z > 0 || z < -8 || Math.abs(x) > 4 || side > 7) return 0;
    if (z >= -0.94 && roundedPanel(x, y, 4, 7, 0.51)) {
      if (z < -0.65 || side > 6.5) return ink.foldEnd;
      const front = Math.abs(x);
      if (front > 3.65 || front < 0.19) return ink.foldGrain;
      if (Math.abs(side - 5.44) < 0.34 && Math.abs(front - 2.7) < 0.32) return ink.foldPin;
      const grain = x + 0.13 * Math.sin(y * 0.47);
      if ((Math.abs(grain + 1.5) < 0.15 && y < 2.4) || (Math.abs(grain - 2.25) < 0.18 && y > -0.8))
        return ink.foldGrain;
      return x > 0 ? ink.foldHoney : ink.foldWood;
    }
    if (z > -1.6 && side < 6.24 && Math.abs(Math.abs(x) - 2.83) < 0.48) return ink.foldTube;
    // The two tubes on each side pass on opposite sides of the brass hinge pin.
    if (side > 5.28 && side < 6.47 && x * x + (z + 4.28) * (z + 4.28) < 0.72 * 0.72) return ink.foldPin;
    const t = (-z - 0.84) / 6.72,
      crossX = 2.95 - 5.9 * t;
    const outer = (x - crossX) * 0.75,
      inner = (x + crossX) * 0.75;
    const outerY = side - 5.94,
      innerY = side - 5.09;
    if (outer * outer + outerY * outerY < 0.61 * 0.61)
      return z < -7.23 ? ink.foldFoot : outerY > 0.24 ? ink.foldGlint : ink.foldTube;
    if (inner * inner + innerY * innerY < 0.59 * 0.59) return z < -7.23 ? ink.foldFoot : ink.foldGlint;
    if (Math.abs(z + 7.59) < 0.39 && side < 5.99 && Math.abs(Math.abs(x) - 2.94) < 0.43)
      return side > 5.25 ? ink.foldFoot : ink.foldTube;
    return 0;
  }

  function paint(pose, brush, ink, styles) {
    if (!pose.props?.length) return;
    for (const { kind, frame, scale = 1, rise = 0 } of pose.props) {
      if (!(scale > 0) || !Number.isFinite(scale)) continue;
      // A subpixel shell can put both faces into the same sample. Include a
      // neighboring sample on the normal axis until each face has its own color.
      const normalX = kind === 'laptop' ? lidCos : 1,
        normalZ = kind === 'laptop' ? -lidSin : 0;
      const step =
        (frame
          ? Math.max(...[0, 4, 8].map((i) => Math.abs(frame[i] * normalX + frame[i + 2] * normalZ)))
          : 1) /
        ((brush.density || 2) * scale);
      const pad = Math.max(0, step - (kind === 'phone' ? 0.3 : 0.38));
      let sample, bounds;
      if (kind === 'phone') {
        sample = phone;
        bounds = [-pad, 0.6 + pad, -1.55, 1.55, -2.75, 2.75];
      } else if (kind === 'laptop') {
        sample = laptop;
        bounds = [-4, 6.25 + pad, -7.5, 7.5, -1, 8.04 + pad * lidSin];
      } else if (kind === 'stool') {
        sample = stool;
        bounds = [-4, 4, -7, 7, -8, 0];
      } else continue;
      brush.frame(frame);
      if (kind === 'laptop' && rise > 0) {
        const middle = -0.9 * scale - rise / 2;
        brush.blob(
          0,
          0,
          middle,
          3.65 * scale,
          5.8 * scale,
          rise / 2,
          (_x, _y, z) => (z > middle ? ink.deviceBack : ink.deviceSlate),
          3.5
        );
      }
      brush.stamp(...bounds.map((v) => v * scale), (x, y, z) =>
        sample(x / scale, y / scale, z / scale, ink, pad, styles?.[kind])
      );
    }
    brush.frame(null);
  }
  return { paint, materials };
})();
