// Reconstruct the CC0 reference sections in the character’s head frame.
// Positive X faces forward; the lower face is fitted to the character's own neck.
const pineHeadShape = (() => {
  const count = 600,
    lateralSteps = 96;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lateral = [0, 0.2, 0.4, 0.6, 0.76, 0.88, 1];
  const earPlane = -0.115;
  function lobe(position, center, radius) {
    return Math.max(0, 1 - ((position - center) / radius) ** 2) ** 2;
  }
  // Monotone Hermite interpolation avoids a corner at the brow or a bump at the jaw.
  function slopes(points, channel) {
    const sec = points.slice(1).map((p, i) => (p[channel] - points[i][channel]) / (p[0] - points[i][0]));
    return points.map((_, i) => {
      if (!i) return sec[0];
      if (i === sec.length) return sec[i - 1];
      return sec[i] * sec[i - 1] > 0 ? 2 / (1 / sec[i] + 1 / sec[i - 1]) : 0;
    });
  }
  function curve(a, b, m0, m1, d, t) {
    return (
      (1 + 2 * t) * (1 - t) ** 2 * a +
      t * (1 - t) ** 2 * d * m0 +
      t * t * (3 - 2 * t) * b +
      t * t * (t - 1) * d * m1
    );
  }
  function sample(points, derivatives, interval, channel, h) {
    const a = points[interval],
      b = points[interval + 1],
      d = b[0] - a[0];
    return curve(a[channel], b[channel], derivatives[interval], derivatives[interval + 1], d, (h - a[0]) / d);
  }
  // The reference mesh was cut at the jaw to remove its neck. The pixel rig has a shorter
  // neck, so carry the underside of the chin back to the throat in the same cross-section.
  // Height, half-width, back of the throat, widest lateral point, front of the chin.
  function jawSections(reference, base, settings, animatedInfant = false) {
    const infant = base === 'baby', child = base === 'child';
    // The infant's menton sits close to the lower lip. Join its measured cheek
    // with a shallow chin pad and a broad curve back into the short neck.
    const lower = infant ? [
      [-1, 0.345, -0.33, 0.015, 0.32],
      [-0.964, 0.37, -0.34, 0.036, 0.40],
      [-0.928, 0.42, -0.346, 0.086, 0.56],
      [-0.89, 0.49, -0.35, 0.155, 0.73],
      [-0.85, 0.57, -0.35, 0.22, 0.85],
      [-0.80, 0.665, -0.345, 0.275, 0.918],
      [-0.73, 0.755, -0.325, 0.325, 0.968],
      [-0.65, 0.825, -0.305, 0.351, 0.997],
      [-0.59, 0.858, -0.30, 0.363, 1.012]
    ] : [
      [-1, 0.37, -0.415, -0.04, 0.32],
      [-0.96, 0.38, -0.42, -0.035, 0.325],
      [-0.925, 0.392, -0.42, -0.022, 0.35],
      [-0.904, 0.407, -0.415, 0.005, 0.42],
      [-0.886, 0.426, -0.405, 0.045, 0.63],
      [-0.864, 0.452, -0.4, 0.082, 0.804],
      [-0.835, 0.485, -0.38, 0.12, 0.915],
      [-0.795, 0.535, -0.35, 0.18, 0.985],
      [-0.745, 0.594, -0.321, 0.24, 1.017],
      [-0.69, 0.66, -0.288, 0.31, 1.001],
      [-0.635, 0.717, -0.265, 0.363, 0.974],
      [-0.59, 0.755, -0.279, 0.383, 0.998]
    ];
    const chinArc = [1, 0.978, 0.892, 0.739, 0.546, 0.357];
    const rings = lower.map(([h, width, back, side, front]) => {
      const t = clamp((h + 1) / 0.41, 0, 1);
      if (animatedInfant) {
        // The baby cheek turns into a short chin above the throat. Lift the
        // middle rings, while both ends still meet the neck and upper cheek.
        h += 0.066 * Math.sin(Math.PI * t);
      }
      // A child's chin pad is shallower and the underside turns into the neck a little sooner.
      if (child) {
        front -= 0.055 * Math.sin(Math.PI * t) + 0.018 * (1 - t);
        width *= 1 + 0.04 * Math.sin(Math.PI * t);
        back += 0.025;
      }
      // The lower neck ring and the measured cheek at -0.54 stay fixed. Amplitude
      // falls to zero at both ends so neither the lips nor the head pivot move.
      let chinCurve = 0;
      if (settings) {
        const arch = Math.sin(Math.PI * t),
          tip = Math.sin(Math.PI * t) ** 1.8;
        const neckBlend = Math.max(0, 1 - ((h + 0.922) / 0.101) ** 2);
        // Bring the upper throat forward under the chin, then ease it back into the
        // unchanged neck pivot. This sets the length of the visible underside in profile.
        const scale = infant ? 0.54 : 1;
        front += (infant ? 0.065 : child ? 0.13 : 0.18) * neckBlend * (1 + 0.88 * settings.jawNeck);
        h += (infant ? 0.008 : child ? 0.016 : 0.026) * arch + 0.065 * scale * settings.chinHeight * arch;
        const forward = scale * (0.19 + 0.16 * settings.jawPosition) * arch;
        back += forward;
        side += scale * (0.15 + 0.12 * settings.jawPosition) * arch;
        width *= 1 + (-0.075 + 0.12 * settings.chinRoundness) * tip;
        front += scale * (0.14 * settings.chinProjection - 0.022) * tip;
        // A higher jaw angle lifts and tapers the lateral rear rather than the chin.
        width *= 1 - 0.065 * settings.jawAngle * arch;
        side += 0.07 * settings.jawAngle * arch;
        chinCurve = settings.chinRoundness * tip;
      }
      const surface = chinArc.map((w, i) => {
        const round = Math.sqrt(1 - lateral[i] ** 2);
        const weight = round + (w - round) * t + 0.18 * chinCurve * lateral[i] * (1 - lateral[i]);
        return side + (front - side) * weight;
      });
      return [h, width, back, side, ...surface];
    });
    return [...rings, ...reference.filter(([h]) => h >= -0.54)];
  }
  function fitInfantNape(sections) {
    const tangents = slopes(pineInfantRear, 1);
    let i = 0;
    return sections.map((ring) => {
      const h = ring[0];
      if (h > pineInfantRear.at(-1)[0]) return ring;
      while (i < pineInfantRear.length - 2 && h > pineInfantRear[i + 1][0]) i++;
      const measured = sample(pineInfantRear, tangents, i, 1, h);
      const neck = clamp((-0.65 - h) / 0.27, 0, 1);
      // Seat the low end on the moving neck. Shift the middle arc as a unit
      // to retain its curvature, then blend into the original upper vault.
      const middle = clamp(Math.min((h + 0.70) / 0.42, (0.88 - h) / 0.40), 0, 1);
      const back = measured + 0.034 * neck * neck * (3 - 2 * neck) + 0.030 * middle * middle * (3 - 2 * middle);
      const fitted = ring.slice();
      fitted[2] = back;
      return fitted;
    });
  }
  // Offsets in head radii. The hm08 midline has a supported philtrum and a
  // shallower fold below the lip than the feature-free base used for painting.
  // Fit the turns to the actor's own tip, lip seam and chin before sampling.
  function oralProfile(planes) {
    const { chin, tip } = planes.contour, lip = planes.mouth;
    const lower = lip - chin, upper = tip - lip;
    const points = [
      [chin - 0.18, 0], [chin - 0.095, -0.043], [chin - 0.013, 0], [chin + 0.013, 0],
      [chin + 0.26 * lower, planes.orbit ? -0.015 : 0.014], [chin + 0.50 * lower, 0.078],
      [chin + 0.72 * lower, 0.081], [lip - 0.16 * lower, 0.072], [lip, 0.047],
      [lip + 0.15 * upper, 0.075], [lip + 0.49 * upper, 0.121],
      [lip + 0.76 * upper, 0.077], [tip, 0.008], [tip + 0.13, 0]
    ];
    const tangents = slopes(points, 1);
    return h => {
      if (h <= points[0][0] || h >= points.at(-1)[0]) return 0;
      let i = 0;
      while (h > points[i + 1][0]) i++;
      return planes.strength * sample(points, tangents, i, 1, h);
    };
  }
  // Sagittal offsets traced against the right-facing animation turnaround.
  // The landmarks move with the authored mouth and chin. The infant's chin
  // pad sits beneath the brow, with a much shallower fold below the lip.
  function animationProfile(form, infant) {
    const { eye, mouth, chin } = form;
    const low = mouth - chin;
    const points = [
      [-1, 0], [chin - 0.12, infant ? 0.10 : 0.012], [chin - 0.035, infant ? 0.172 : 0.042],
      [chin + 0.32 * low, infant ? 0.123 : 0.041], [mouth - 0.28 * low, infant ? 0.078 : 0.004],
      [mouth, infant ? 0.064 : 0], [mouth + 0.16 * (eye - mouth), infant ? 0.044 : 0],
      [mouth + 0.45 * (eye - mouth), 0], [eye, -0.025], [eye + 0.19, -0.019], [0.60, 0]
    ];
    const tangents = slopes(points, 1);
    return h => {
      if (h <= -1 || h >= 0.60) return 0;
      let i = 0;
      while (h > points[i + 1][0]) i++;
      return sample(points, tangents, i, 1, h);
    };
  }
  // Broad light groups sampled from bare skin in the original turnaround.
  // Columns run from the midline to the temple. Rows use the pupil-to-mouth
  // distance, so the artist's broad orbital shadow follows changes to the face.
  const guideLight = {
    baby: [134,133,129,122,112,96, 121,117,109,111,107,105, 114,108,100,101,106,112,
      119,114,99,91,106,115, 136,132,135,134,129,131, 133,129,127,133,132,138,
      130,123,104,106,106,112, 121,122,114,100,97,103, 110,102,85,80,86,96],
    adult: [133,130,116,90,77,75, 136,135,125,101,82,82, 125,115,100,101,93,90,
      125,118,103,96,88,95, 126,122,128,129,115,110, 113,116,120,117,110,110,
      100,110,106,102,108,117, 108,111,108,105,110,118, 120,113,100,101,109,114]
  };
  function guideTone(grid, x, z) {
    const col = clamp(x / 0.18, 0, 5), row = clamp((z + 1.10) / 0.34, 0, 8);
    const a = Math.min(4, Math.floor(col)), b = Math.min(7, Math.floor(row)), at = b * 6 + a;
    const top = grid[at] + (col - a) * (grid[at + 1] - grid[at]);
    const low = grid[at + 6] + (col - a) * (grid[at + 7] - grid[at + 6]);
    return top + (row - b) * (low - top);
  }
  function profile(base, fittedJaw = false, settings, relief = 0, facial, refitNape = false, planes) {
    const child = base !== 'adult', infant = base === 'baby';
    const reference = pineHeadSections[base];
    const faceRings = fittedJaw ? jawSections(reference, base, settings, infant && !!planes?.orbit) : reference;
    const sections = refitNape ? fitInfantNape(faceRings) : faceRings;
    // Across the upper ear the face table switches from a cheek to a temple
    // measurement. Bridge that short interval on the sides and rear only.
    const temples = refitNape && reference.filter(([h]) => [-0.36, -0.18, 0.26, 0.43].includes(h));
    const templeSlopes = refitNape && slopes(temples, 1);
    const gradients = sections[0].map((_, i) => slopes(sections, i));
    const neutral = posterior(1);
    const angles = lateral.map(Math.asin);
    const cheekCenter = facial ? (infant ? -0.34 : -0.205) + (infant ? 0.12 : 0.20) * facial.cheekHeight : -0.14;
    const oralDepth = planes?.contour && oralProfile(planes);
    const animationDepth = planes?.orbit && animationProfile(planes.form, infant);
    const meridians = Array.from({ length: lateralSteps + 1 }, (_, j) => {
      const angle = Math.asin(j / lateralSteps);
      let interval = 0;
      while (interval < angles.length - 2 && angle > angles[interval + 1]) interval++;
      return { interval, angle };
    });
    let section = 0;
    const rows = Array.from({ length: count + 1 }, (_, i) => {
      const h = (2 * i) / count - 1;
      while (section < sections.length - 2 && h > sections[section + 1][0]) section++;
      const value = (k) => sample(sections, gradients[k], section, k, h);
      let width = value(1),
        back = value(2),
        side = value(3);
      const front = lateral.slice(0, -1).map((_, j) => value(4 + j));
      if (infant) {
        // Ease the donor's upper dental arch into the short, separately painted
        // nose. The far cheek must not form another tip in three-quarter view.
        const inset = 0.082 * lobe(h, -0.51, 0.315);
        front.forEach((v, j) => { front[j] = v - inset * (1 - 0.42 * lateral[j] ** 2); });
        side -= 0.14 * inset;
      }
      if (planes?.form) {
        const form = planes.form;
        if (infant) {
          // Keep the cranial vault full. The brow turns into a shallow orbit, and
          // the widest part of a baby's cheek sits above its small chin.
          width *= 1 + 0.026 * lobe(h, form.mouth + 0.15, 0.22) - (animationDepth ? 0.044 : 0.145) * lobe(h, form.chin, 0.27);
          const forehead = 0.02 * lobe(h, 0.22, 0.40) - 0.062 * lobe(h, form.eye + 0.075, 0.31);
          const chin = 0.062 * lobe(h, form.chin - 0.055, 0.23);
          const lips = 0.050 * lobe(h, form.mouth + 0.042, 0.083) + 0.039 * lobe(h, form.mouth - 0.058, 0.071);
          for (let j = 0; j < front.length; j++) {
            const v = lateral[j];
            front[j] += forehead * (1 - 0.62 * v * v) - chin * (1 - 0.29 * v) +
              lips * lobe(v, 0, 0.41) - 0.072 * lobe(h, form.mouth, 0.19) * lobe(v, 0.40, 0.32) +
              0.065 * lobe(h, form.mouth + 0.18, 0.23) * lobe(v, 0.61, 0.31) -
              0.043 * lobe(h, form.eye, 0.22) * lobe(v, 0.65, 0.36);
            if (planes.orbit) front[j] += 0.037 * lobe(h, form.mouth + 0.139, 0.125) * lobe(v, 0, 0.55);
          }
        } else {
          // Sculpt across the front of each ring. Keep the temple and ear seat,
          // turn the outer cheek back, then taper the two sides of the mandible.
          const lower = 0.095 * lobe(h, -0.45, 0.39) + 0.145 * lobe(h, form.chin + 0.045, 0.26);
          width *= 1 - form.strength * (lower + 0.035 * lobe(h, -0.11, 0.30));
          if (planes.orbit) width *= 1 - 0.045 * form.strength * lobe(h, -0.05, 0.55);
          const turn = form.strength * (0.096 * lobe(h, -0.12, 0.59) + 0.117 * lobe(h, -0.52, 0.34));
          const pad = form.strength * 0.066 * lobe(h, form.chin - 0.115, 0.105);
          for (let j = 0; j < front.length; j++) {
            const v = lateral[j];
            front[j] -= turn * lobe(v, 0.76, 0.43) + pad * lobe(v, 0, 0.81);
          }
        }
      }
      if (animationDepth && h < planes.form.eye + 0.13) {
        // Loft the side of the muzzle from the same forehead-to-chin profile.
        // The original scans switch to a separate jaw section just below the
        // mouth. A continuous cheek arc bridges that seam in three-quarter view.
        if (infant) width += (planes.form.pixelPortrait ? 0.075 : 0.14) * lobe(h, -0.70, 0.19);
        if (planes.form.pixelPortrait) {
          // Keep the corners of the jaw behind the soft front pad. On an adult
          // the jaw turns progressively below the mouth before reaching the chin.
          width *= infant ? 1-.060*lobe(h,-.48,.50) : 1+.106*lobe(h,-.66,.32);
        }
        const cheek = clamp((h + 0.95) / 0.18, 0, 1) * clamp((planes.form.eye + 0.13 - h) / 0.26, 0, 1);
        for (let j = 1; j < front.length; j++) {
          const v = lateral[j];
          const arc = side + (front[0] - side) * Math.sqrt(1 - v * v);
          front[j] += (arc - front[j]) * cheek * (infant ? 0.94 : 0.67) * Math.min(1, 1.9 * v);
        }
      }
      if ((relief || facial) && h > -0.94 && h < (facial ? 0.48 : 0.29)) {
        // Low, overlapping facial planes read in three-quarter view. The dental arch
        // stays continuous, and the soft chin pad follows the selected chin height.
        const cheek = lobe(h, cheekCenter, facial ? 0.43 : 0.36);
        const bridge = lobe(h, infant ? pineInfantLandmarks.eye - 0.05 : 0.035, 0.25);
        const mouthCorners = lobe(h, infant ? pineInfantLandmarks.mouth : -0.42, 0.24);
        const chin = lobe(h, (infant ? -0.81 : -0.735) + 0.055 * settings.chinHeight, 0.19);
        const amount = (infant ? 0.43 : child ? 0.8 : 1) * relief;
        const lower = facial ? lobe(h, infant ? -0.53 : -0.42, infant ? 0.23 : 0.29) : 0;
        if (facial) width *= 1 + 0.13 * facial.cheekWidth * cheek + 0.075 * facial.cheekFullness * lower;
        for (let j = 0; j < front.length; j++) {
          const v = lateral[j];
          front[j] += amount * (
            (facial ? 0.052 : 0.115) * cheek * lobe(v, facial ? 0.59 : 0.50, facial ? 0.48 : 0.40) +
            (oralDepth ? 0.029 : 0.068) * bridge * lobe(v, 0, 0.44) +
            0.045 * chin * lobe(v, 0, 0.78) -
            0.062 * mouthCorners * lobe(v, 0.39, 0.37)
          );
          if (facial) {
            const softness = infant ? 0.50 : child ? 0.8 : 1;
            front[j] += softness * (
              0.123 * facial.cheekProjection * cheek * lobe(v, 0.59, 0.46) +
              (0.025 + 0.138 * facial.cheekFullness) * lower * lobe(v, 0.64, 0.40) -
              0.117 * facial.eyeDepth * lobe(h, infant ? pineInfantLandmarks.eye : 0.145, 0.23) * lobe(v, 0.50 * facial.eyeSpacing, 0.32)
            );
          }
        }
      }
      if (planes?.strength && h > -0.92 && h < 0.44) {
        // The source sections have their original nose and lips removed for the editable features.
        // Restore the bed of the orbit and wrap the dental arch back around the mouth corners.
        const orbit = lobe(h, planes.eye + 0.012, 0.24);
        const root = lobe(h, planes.eye + 0.025, 0.21);
        const chinH = -0.735 + 0.055 * settings.chinHeight;
        const chinTurn = 0.031 * lobe(h, chinH, 0.17) + 0.064 * lobe(h, chinH - 0.102, 0.086);
        const room = clamp((planes.mouth - chinH) / 0.30, 0.35, 1);
        const lipH = (h - planes.mouth) / (h < planes.mouth ? room : 1);
        const arch = lobe(lipH, 0, 0.32);
        const lip = 0.043 * lobe(lipH, 0.025, 0.11) + 0.032 * lobe(lipH, -0.060, 0.09);
        const inset = 0.026 * lobe(lipH, 0.145, 0.13) + 0.029 * lobe(lipH, -0.17, 0.13);
        for (let j = 0; j < front.length; j++) {
          const v = lateral[j];
          front[j] += planes.strength * (
            -0.061 * root * lobe(v, 0, 0.34) -
            0.100 * orbit * lobe(v, planes.eyeCenter / width, 0.38) +
            (lip - inset) * lobe(v, 0, 0.46) -
            0.023 * arch * lobe(v, 0, 0.67) -
            0.076 * arch * lobe(v, 0.32, 0.34) -
            chinTurn * lobe(v, 0, 0.78)
          );
        }
      }
      if (planes?.form?.model) {
        // The cheek turns toward the ear above the mouth. Keep the chin pad
        // beneath the lower lip and allow more malar fullness on the baby.
        const { eye, mouth, chin } = planes.form;
        const jaw = lobe(h, (chin + mouth) / 2, infant ? 0.25 : 0.32);
        width *= 1 + (infant ? 0.038 : -0.043) * jaw;
        for (let j = 0; j < front.length; j++) {
          const v = lateral[j];
          front[j] -= (infant ? 0.028 : 0.075) * lobe(h, mouth + 0.14, 0.34) * lobe(v, 0.69, 0.38)
            + 0.046 * lobe(h, chin + 0.06, 0.19) * lobe(v, 0, 0.59);
          front[j] += (infant ? 0.042 : 0.024) * lobe(h, eye + 0.30, 0.29) * (1 - v * v);
        }
      }
      // Seat the measured chin on the shorter neck of the pixel rig.
      const underChin = clamp((-h - 0.65) / 0.35, 0, 1);
      const inset = fittedJaw ? 0 : (child ? 0.13 : 0.19) * underChin * underChin * (3 - 2 * underChin);
      back -= inset;
      side -= inset;
      front.forEach((_, j) => (front[j] -= inset));
      // Reconstruct the last few polygon rings as a smooth cap around the measured vertex.
      if (h > 0.88) {
        const reference = sections.find((r) => r[0] === 0.88);
        const q = Math.sqrt(Math.max(0, (1 - h * h) / (1 - 0.88 * 0.88)));
        const top = 0.55 * sections.at(-1)[4] + 0.45 * reference[3];
        width = reference[1] * q;
        back = top + (reference[2] - top) * q;
        side = top + (reference[3] - top) * q;
        front.forEach((v, j) => (front[j] = top + (reference[j + 4] - top) * q));
      }
      // Authoring coordinates also fit hair and headwear. At the neutral setting the two
      // transforms cancel exactly, restoring the measured profile in physical head space.
      const axis = neutral.unfit(side, h),
        rear = axis - neutral.unfit(back, h);
      const outline = [...front, side].map((v, j) => [angles[j], neutral.unfit(v, h)]);
      const tangent = slopes(outline, 1);
      tangent[0] = 0;
      const face = Float32Array.from(meridians, ({ interval, angle }) =>
        sample(outline, tangent, interval, 1, angle)
      );
      if (planes?.strength && Math.abs(h - planes.eye) < 0.15) {
        // The iris sits on the round front of the eye. Its inner corner turns back
        // into the nose and the outer lid follows the temple as the camera turns.
        const center = planes.eyeCenter;
        const eye = planes.strength * lobe(h, planes.eye, 0.15);
        for (let j = 0; j <= lateralSteps; j++) {
          const y = width * j / lateralSteps;
          face[j] += eye * (0.068 * lobe(y, center, 0.20) - 0.066 * lobe(y, center - 0.20, 0.17));
        }
      }
      // Shift the whole dental arch at the lip seam, including the corners.
      // The transition ends above the chin pad and below the nose tip.
      const bed = planes?.lipBed;
      if (bed && (planes.strength || bed.depth) && h > bed.center - bed.below && h < bed.center + bed.above) {
        const height = Math.abs(h - bed.center) / (h > bed.center ? bed.above : bed.below);
        const envelope = lobe(height, 0, 1);
        // A recessed arch carries the surrounding tissue inward. Keep a broad
        // landing for the existing upper and lower lip volumes and their seam.
        const shoulder = clamp((height - 0.40) / 0.60, 0, 1);
        const shift = bed.depth * (bed.depth < 0 ? 1 - shoulder * shoulder * (3 - 2 * shoulder) : envelope);
        const start = bed.depth < 0 ? 0.54 : 0.31, end = bed.depth < 0 ? 0.96 : 0.85;
        const midline = face[0];
        const cornerInset = (planes.strength || 0) * 0.035 + Math.max(0, -bed.depth) * 0.46;
        for (let j = 0; j <= lateralSteps; j++) {
          const v = j / lateralSteps, t = clamp((v - start) / (end - start), 0, 1);
          const arch = shift * (1 - t * t * (3 - 2 * t));
          // A rounded central pad and a swept-back commissure remain readable
          // from either side, including when the whole arch is drawn inward.
          const pad = (midline - face[j]) * lobe(v, 0, 0.14) * (planes.strength || Math.abs(bed.depth));
          face[j] += arch + envelope * (pad - cornerInset * lobe(v, 0.39, 0.34));
        }
      }
      const support = oralDepth && oralDepth(h);
      if (support) {
        for (let j = 0; j <= lateralSteps; j++) face[j] += support * lobe(j / lateralSteps, 0, 0.64);
      }
      if (animationDepth) {
        const turn = animationDepth(h);
        for (let j = 0; j <= lateralSteps; j++) face[j] += turn * lobe(j / lateralSteps, 0, 0.96);
      }
      const templeDelta = refitNape && h > -0.18 && h < 0.26
        ? sample(temples, templeSlopes, 1, 1, h) - value(1) : 0;
      return { axis, rear, fore: face[0] - axis, width, templeDelta, face };
    });
    const row = (h) => rows[clamp(Math.round(((h + 1) * count) / 2), 0, count)];
    function frontAt(r, v) {
      const sample = clamp(Math.abs(v), 0, 1) * lateralSteps,
        i = Math.min(lateralSteps - 1, Math.floor(sample));
      return r.face[i] + (r.face[i + 1] - r.face[i]) * (sample - i);
    }
    if (planes?.form?.pixelPortrait && !infant) {
      // Trace one continuous sagittal contour from throat to lower lip. The
      // forward chin pad and the fold above it have independent depths.
      const { chin, mouth } = planes.form;
      const gap = mouth - chin;
      const top = mouth - 0.10 * gap;
      const throat = -1;
      const pad = row(chin).face[0] + 0.009;
      const lip = row(top).face[0];
      const round = settings.chinRoundness;
      const points = [
        [throat, 0.16 + 0.04 * settings.jawNeck],
        [chin - 0.147, 0.29 + 0.06 * settings.jawNeck],
        [chin - 0.094, 0.515 + 0.07 * settings.jawNeck],
        [chin - 0.060, 0.60 + 0.07 * settings.jawNeck],
        [chin - 0.044, pad - 0.29],
        [chin - 0.026, pad - 0.128],
        [chin, pad - 0.032],
        [chin + 0.11 * gap, pad - 0.006 - 0.006 * round],
        [chin + 0.24 * gap, pad],
        [chin + 0.40 * gap, pad - 0.012],
        [chin + 0.58 * gap, 0.54 * pad + 0.46 * lip - 0.049],
        [chin + 0.74 * gap, 0.25 * pad + 0.75 * lip - 0.027],
        [top, lip]
      ];
      const tangents = slopes(points, 1);
      tangents[tangents.length - 1] = (row(top + 0.014).face[0] - lip) / 0.014;
      let interval = 0;
      for (let i = 0; i <= count; i++) {
        const h = 2 * i / count - 1;
        if (h >= top) continue;
        while (h > points[interval + 1][0]) interval++;
        const ring = rows[i];
        const front = sample(points, tangents, interval, 1, h);
        const offset = front - ring.face[0];
        const underside = clamp((chin + 0.22 * gap - h) / 0.13, 0, 1);
        for (let j = 0; j <= lateralSteps; j++) {
          const v = j / lateralSteps;
          const side = ring.face[j] + offset * lobe(v, 0, 1);
          const rounded = ring.axis + (front - ring.axis) * Math.sqrt(1 - v * v);
          ring.face[j] = side + (rounded - side) * underside;
        }
        ring.fore = ring.face[0] - ring.axis;
      }
    }
    if (planes?.orbit) {
      // Embed the front cap of the eyeball beneath the two lids, before taking
      // lighting normals. Its iris and rim foreshorten on the same physical surface.
      const { center, width, height } = planes.orbit, eye = planes.form.eye;
      const pixel = planes.form.pixelPortrait;
      const equator = row(eye), apex = frontAt(equator, center / equator.width) + (pixel ? .108 : infant ? 0.068 : 0.070);
      for (let i = 0; i <= count; i++) {
        const z = (2 * i / count - 1 - eye) / height;
        if (Math.abs(z) >= 1) continue;
        const ring = rows[i];
        for (let j = 0; j <= lateralSteps; j++) {
          const across = ring.width * j / lateralSteps - center;
          const radius = (across / width) ** 2 + z * z;
          if (radius >= 1) continue;
          const cap = apex - (pixel ? .39 : .12) * across + (pixel ? .33 : .270) * (Math.sqrt(1 - radius) - 1);
          const weight = clamp((1 - radius) / 0.47, 0, 1);
          ring.face[j] += Math.max(pixel ? -.073 : -.026, cap - ring.face[j]) * weight * weight * (3 - 2 * weight);
        }
      }
    }
    // Two components of the normalized surface normal, with a soft light above and in front.
    // Per-height lookup avoids evaluating normals for every voxel in every animation frame.
    for (const [i, r] of rows.entries()) {
      const heightSpan = planes?.orbit ? 48 : 10;
      const lo = Math.max(0, i - heightSpan),
        hi = Math.min(count, i + heightSpan),
        below = rows[lo],
        above = rows[hi];
      r.frontLight = new Float32Array(lateralSteps + 1);
      r.sideLight = new Float32Array(lateralSteps + 1);
      for (let j = 0; j <= lateralSteps; j++) {
        const v = j / lateralSteps,
          y = v * r.width;
        const sideSpan = planes?.orbit ? 14 : 3;
        const left = Math.max(0, j - sideSpan),
          right = Math.min(lateralSteps, j + sideSpan);
        const dxdy =
          ((r.face[right] - r.face[left]) * lateralSteps) / ((right - left) * Math.max(0.01, r.width));
        const dxdh =
          ((frontAt(above, y / Math.max(0.001, above.width)) -
            frontAt(below, y / Math.max(0.001, below.width))) *
            count) /
          (2 * (hi - lo));
        const normal = 1 / Math.hypot(1, dxdy, 0.85 * dxdh);
        const ambient = 0.53 + 0.18 * Math.sqrt(1 - v * v) + 0.075 * ((2 * i) / count - 1);
        r.frontLight[j] = 0.58 * (0.74 - 0.53 * dxdh) * normal + 0.42 * ambient;
        r.sideLight[j] = 0.085 * dxdy * normal;
        if (planes?.orbit) {
          // A broad light source reads the turning cheek and forehead without
          // turning each small lip or orbital crease into a dark stripe.
          const h = 2 * i / count - 1;
          const broad = 0.32 + 0.43 * Math.sqrt(1 - v * v) + 0.095 * h;
          r.frontLight[j] = 0.52 * (0.28 + 0.64 * (0.78 - 0.60 * dxdh) * normal) + 0.48 * broad;
          const rel = (planes.form.eye - h) / (planes.form.eye - planes.form.mouth);
          const mask = clamp((1 - v) / 0.17, 0, 1) * clamp((rel + 1.65) / 0.55, 0, 1)
            * clamp((2.15 - rel) / 0.53, 0, 1);
          const tone = guideTone(infant ? guideLight.baby : guideLight.adult,
            y * (infant ? 0.478 : 0.485) / planes.orbit.center, rel);
          r.frontLight[j] += mask * (tone - 113) * 0.0053;
          r.sideLight[j] = 0.19 * dxdy * normal - 0.055 * v;
        }
      }
    }
    function insideSkin(r, x, y) {
      let width = r.width;
      if (r.templeDelta && x < 0.55) {
        const t = clamp((0.55 - x) / 0.44, 0, 1);
        width += r.templeDelta * t * t * (3 - 2 * t);
      }
      if (width < 0.001 || Math.abs(y) > width) return false;
      const v = y / width,
        dx = x - r.axis;
      if (dx < 0) return dx * dx <= r.rear * r.rear * (1 - v * v);
      return x <= frontAt(r, v);
    }
    function topAt(x, y) {
      // Binary search the upper dome once when authoring the short-hair map.
      let lo = 0.2,
        hi = 1;
      if (!insideSkin(row(lo), x, y)) return lo;
      for (let n = 0; n < 9; n++) {
        const mid = (lo + hi) / 2;
        if (insideSkin(row(mid), x, y)) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }
    // Transfer the existing long-hair scalp map to these sections, preserving its locks and parts.
    const charts = rows.map((r, i) => {
      const h = (2 * i) / count - 1,
        at = clamp(h, -0.91, 0.92),
        support = row(at),
        ring = Math.sqrt(1 - at * at);
      return {
        axis: r.axis,
        fore: support.fore / ring,
        rear: support.rear / ring,
        width: support.width / ring
      };
    });
    // Raise only the vault above the brow. Locks and hats above the vertex keep their own thickness.
    const rise = child ? 0.125 : 0.14,
      browHeight = 0.3,
      gain = 1 + rise / (1 - browHeight);
    const crown = {
      rise,
      raise: (h) => (h <= browHeight ? h : h >= 1 ? h + rise : browHeight + (h - browHeight) * gain),
      lower: (h) => (h <= browHeight ? h : h >= 1 + rise ? h - rise : browHeight + (h - browHeight) / gain)
    };
    return {
      cheekCenter,
      crown,
      row,
      frontAt,
      insideSkin,
      lateralSteps,
      inside: insideSkin,
      topAt,
      chart: (h) => charts[clamp(Math.round(((h + 1) * count) / 2), 0, count)]
    };
  }
  // Anchor the adjustment at the ears. The lower occiput tucks further in than the crown;
  // the ends of long hair gradually regain their original reach at the shoulders.
  function posterior(depth, skull) {
    const levels = [
      [-2.2, 1, 0],
      [-1.55, 0.91, 0.25],
      [-0.96, 0.7, 0.82],
      [-0.6, 0.675, 1],
      [-0.36, 0.617, 1],
      [-0.12, 0.587, 1],
      [0.0, 0.589, 1],
      [0.12, 0.6, 1],
      [0.36, 0.66, 1],
      [0.6, 0.749, 0.98],
      [0.82, 0.8, 0.9],
      [1.15, 0.85, 0.76],
      [1.55, 0.89, 0.66]
    ];
    const start = levels[0][0],
      end = levels.at(-1)[0],
      n = 400;
    const tangents = slopes(levels, 1);
    let j = 0;
    const widths = Float32Array.from({ length: n + 1 }, (_, i) => {
      const h = start + ((end - start) * i) / n;
      while (j < levels.length - 2 && h > levels[j + 1][0]) j++;
      const a = levels[j],
        b = levels[j + 1],
        t = (h - a[0]) / (b[0] - a[0]),
        u = t * t * (3 - 2 * t);
      let width = curve(a[1], b[1], tangents[j], tangents[j + 1], b[0] - a[0], t);
      if (skull) {
        const row = skull.row(h);
        const span = (earPlane - row.axis + row.rear) * width;
        // Ease only the outermost part of the occipital arc towards a shallower
        // tangent. Its fitted scalp and hair share this scale at the same height.
        const excess = span - 0.545;
        if (excess > 0) {
          const transition = 0.19;
          const eased = excess < transition ? excess * excess / (2 * transition) : excess - transition / 2;
          const inset = 0.3 * eased;
          width *= 1 - inset / span;
        }
      }
      return width * (1 + (depth - 1) * (a[2] + (b[2] - a[2]) * u));
    });
    const width = (h) => widths[clamp(Math.round(((h - start) * n) / (end - start)), 0, n)];
    return {
      fit: (x, h) => (x >= earPlane ? x : earPlane + (x - earPlane) * width(h)),
      unfit: (x, h) => (x >= earPlane ? x : earPlane + (x - earPlane) / width(h))
    };
  }
  const jaws = new Map();
  function withJaw(base) {
    if (!jaws.has(base)) jaws.set(base, profile(base, true));
    return jaws.get(base);
  }
  const controls = ['chinHeight', 'chinProjection', 'chinRoundness', 'jawPosition', 'jawAngle', 'jawNeck'];
  const adjustable = new Map();
  function reshape(base, shape, relief = 0, individual = false, refitNape = false, planes) {
    const settings = Object.fromEntries(controls.map((key) => [key, shape[key] ?? 0]));
    const facial = individual && {
      cheekHeight: shape.cheekHeight || 0, cheekWidth: shape.cheekWidth || 0,
      cheekProjection: shape.cheekProjection || 0, cheekFullness: shape.cheekFullness || 0,
      eyeDepth: shape.eyeDepth || 0, eyeSpacing: shape.eyeSpacing ?? 1
    };
    const key = [base, relief, refitNape, ...Object.values(settings), ...(facial ? Object.values(facial) : []),
      ...(planes?.strength ? [planes.eye, planes.eyeCenter, planes.mouth, planes.strength] : []),
      ...(planes?.lipBed ? ['lip', planes.lipBed.center, planes.lipBed.above, planes.lipBed.below, planes.lipBed.depth] : []),
      ...(planes?.contour ? ['contour', planes.contour.chin, planes.contour.tip] : []),
      ...(planes?.form ? ['form', !!planes.form.model, planes.form.eye, planes.form.mouth, planes.form.chin, planes.form.strength] : []),
      ...(planes?.orbit ? ['orbit', !!planes.form?.pixelPortrait, planes.orbit.center, planes.orbit.width, planes.orbit.height] : [])].join('|');
    if (!adjustable.has(key)) {
      if (adjustable.size >= 8) adjustable.delete(adjustable.keys().next().value);
      adjustable.set(key, profile(base, true, settings, relief, facial, refitNape, planes));
    }
    return adjustable.get(key);
  }
  let baby, babyNape;
  const heads = {
    adult: profile('adult'), child: profile('child'), get baby() { return baby ||= profile('baby'); },
    scalp(base, refitNape = false) {
      if (!refitNape || base !== 'baby') return heads[base];
      return babyNape ||= profile('baby', false, undefined, 0, undefined, true);
    },
    earPlane, posterior, withJaw, controls, reshape
  };
  return heads;
})();
