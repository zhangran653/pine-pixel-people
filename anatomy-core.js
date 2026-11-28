// Local bind dimensions; bones, clothing and the undressed form use the actor's
// actual rig units. The shoulder and hip measurements already include morphs.
const pineAnatomy = (() => {
  const profiles = {
    male: { waist: 0.82, rib: 0.95, hip: 0.92, belly: 0.03, waistZ: 0.42 },
    female: { waist: 0.76, rib: 0.91, hip: 0.95, belly: 0.04, waistZ: 0.43 },
    adult: { waist: 0.8, rib: 0.93, hip: 0.94, belly: 0.04, waistZ: 0.42 },
    child: { waist: 0.87, rib: 0.9, hip: 0.91, belly: 0.1, waistZ: 0.39 },
    toddler: { waist: 0.91, rib: 0.89, hip: 0.92, belly: 0.15, waistZ: 0.39 },
    baby: { waist: 0.96, rib: 0.88, hip: 0.94, belly: 0.21, waistZ: 0.35 },
  };
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const mix = (a, b, t) => a + (b - a) * t;
  function muscleSection(region, t, bend = 0) {
    const active = clamp(bend);
    const middle =
      region === 'upperArm'
        ? 0.48 - 0.09 * active
        : region === 'thigh'
          ? 0.42
          : region === 'forearm'
            ? 0.29
            : 0.33;
    const width = region === 'thigh' ? 0.46 : 0.36;
    const belly = Math.max(0, 1 - ((t - middle) / width) ** 2);
    return 0.97 + (0.085 + (region === 'upperArm' ? 0.065 : 0.025) * active) * belly * belly;
  }
  function bind(recipe, rig, sockets, sizes) {
    const profile = recipe.base === 'adult' && profiles[recipe.gender] ? recipe.gender : recipe.base;
    const p = profiles[profile];
    const parts = recipe.anatomyParts || {};
    const chestSpan = parts.torso === 'broad' ? 1.085 : parts.torso === 'slender' ? 0.91 : 1;
    const chestDepthScale = parts.torso === 'broad' ? 1.09 : parts.torso === 'slender' ? 0.93 : 1;
    const bellyScale = parts.torso === 'broad' ? 1.05 : parts.torso === 'slender' ? 0.96 : 1;
    const { hipHalf, hipThickness, hipHeight, chestDepth, measures, scale } = sizes;
    const shoulders = rig.shoulder[1],
      chest = chestDepth * chestDepthScale;
    const low = rig.pelvis[2] - 0.77 * hipHeight,
      high = rig.neck[2];
    const hip = hipHalf * p.hip,
      waist = mix(hip, shoulders, 0.4) * p.waist * bellyScale;
    // Each level has its own lateral breadth, front/back depth and sagittal axis.
    // The rise from the pelvis to the lower ribs is continuous through the waist.
    const levels = [
      [0, 0.4 * hip, 0.43 * hipThickness, 0.56 * hipThickness, rig.pelvis[0]],
      [0.13, hip, 0.88 * hipThickness, 1.02 * hipThickness, rig.pelvis[0]],
      [0.24, hip * 0.98, 0.96 * hipThickness, 0.99 * hipThickness, -0.025 * chest],
      [p.waistZ, waist, chest * (0.8 + p.belly), 0.78 * chest, 0.036 * chest],
      [
        0.57,
        mix(waist, shoulders * p.rib * chestSpan, 0.62),
        chest * (0.9 + 0.65 * p.belly),
        0.92 * chest,
        0.025 * chest,
      ],
      [0.72, shoulders * p.rib * chestSpan, chest, 0.98 * chest, -0.045 * chest],
      [0.84, shoulders * 0.94 * chestSpan, 0.87 * chest, 0.88 * chest, -0.036 * chest],
      [0.91, shoulders * 0.77, 0.63 * chest, 0.72 * chest, -0.014 * chest],
      [1, shoulders * 0.33, 0.4 * chest, 0.44 * chest, rig.neck[0]],
    ];
    let i = 0;
    const rings = Array.from({ length: 129 }, (_, row) => {
      const h = row / 128;
      while (i < levels.length - 2 && h > levels[i + 1][0]) i++;
      const a = levels[i],
        b = levels[i + 1],
        t = clamp((h - a[0]) / (b[0] - a[0]));
      const f = t * t * (3 - 2 * t);
      return {
        width: mix(a[1], b[1], f),
        front: mix(a[2], b[2], f),
        back: mix(a[3], b[3], f),
        axis: mix(a[4], b[4], f),
      };
    });
    function section(z) {
      return rings[clamp(Math.round((128 * (z - low)) / (high - low)), 0, 128)];
    }
    const limbs = Object.fromEntries(
      ['thigh', 'knee', 'ankle', 'upper', 'elbow', 'cuff', 'hand'].map((key) => [key, measures[key] * scale]),
    );
    // Attach the muscle groups to the same proximal/distal joint frames.
    // The palm, wrist and ankle connections retain the host skeleton's size.
    const bulk = (name) => (parts[name] === 'strong' ? 1.2 : parts[name] === 'slender' ? 0.84 : 1);
    limbs.upper *= bulk('arms');
    limbs.elbow *= mix(1, bulk('arms'), 0.48);
    limbs.thigh *= bulk('legs');
    limbs.knee *= mix(1, bulk('legs'), 0.48);
    function footEnds(pose, index) {
      const ankle = pose.feet[index],
        sole = rig.ankle;
      const { pitch, yaw } = pose.floorSeat ? studioRig.seatedAnkle(rig, pose, index) : { pitch: 0, yaw: pose.footYaw?.[index] ?? 0 };
      const heel = [
        ankle[0] - 0.25 * sole * Math.cos(yaw),
        ankle[1] - 0.25 * sole * Math.sin(yaw),
        ankle[2] - 0.48 * sole,
      ];
      const toe = [
        ankle[0] + sole * 1.36 * Math.cos(pitch) * Math.cos(yaw),
        ankle[1] + sole * 1.36 * Math.cos(pitch) * Math.sin(yaw),
        Math.max(0.36 * sole, ankle[2] - sole * 0.62) + Math.sin(pitch) * sole * 1.36,
      ];
      return { heel, toe };
    }
    function landmarks(pose) {
      const pt = studioRig.point,
        body = (q) => pt(pose.torso, q);
      const at = (h, xFraction, y = 0) => {
        const z = mix(low, high, h),
          row = section(z);
        return body([row.axis + xFraction * (xFraction > 0 ? row.front : row.back), y * row.width, z]);
      };
      const socket = (key) => pt(pose[sockets[key].frame], sockets[key].point);
      const nodes = {
        pelvis: body(rig.pelvis),
        lumbar: at(0.44, -0.48),
        thoracic: at(0.7, -0.48),
        sternum: at(0.73, 0.78),
        neck: body(rig.neck),
        headPivot: socket('headPivot'),
        chin: socket('chinTip'),
      };
      for (const [i, side] of ['right', 'left'].entries()) {
        const { shoulder, elbow, wrist, hand } = pose.arms[i],
          { hip, knee } = pose.legs[i];
        for (const [id, q] of Object.entries({
          shoulder,
          elbow,
          wrist,
          hand,
          hip,
          knee,
          ankle: pose.feet[i],
          ...footEnds(pose, i),
          ear: socket(side + 'EarCanal'),
          hinge: socket(side + 'JawJoint'),
          jaw: socket(side + 'JawAngle'),
          eye: socket(side + 'Eye'),
        }))
          nodes[side + id[0].toUpperCase() + id.slice(1)] = q;
      }
      return nodes;
    }
    function paintTorso(pose, brush, ink) {
      brush.frame(pose.torso);
      const wide = 1.1 * Math.max(hip, shoulders),
        deep = 1.5 * Math.max(hipThickness, chest);
      brush.stamp(-deep, deep, -wide, wide, low, high, (x, y, z) => {
        const r = section(z),
          u = (x - r.axis) / (x > r.axis ? r.front : r.back),
          v = y / r.width;
        if (u * u + v * v > 1) return 0;
        return v < -0.4 && u > 0.05 ? ink.clayLight : u < -0.36 || v > 0.65 ? ink.clayShade : ink.clay;
      });
      brush.frame(null);
    }
    function skin(pose, b, k) {
      paintTorso(pose, b, k);
      const link = (a, c, r0, r1, w) =>
        b.link(a, c, r0, r1, w, (t, u, v) =>
          v < -0.32 * r0 ? k.clayLight : u < -0.3 * r0 ? k.clayShade : k.clay,
        );
      const shaped = (a, c, r0, r1, region, bend) => {
        let prev = a,
          old = r0 * muscleSection(region, 0, bend);
        for (const t of [0.32, 0.62, 1]) {
          const end = c.map((v, j) => mix(a[j], v, t)),
            r = mix(r0, r1, t) * muscleSection(region, t, bend);
          link(prev, end, old, r, 0.92);
          prev = end;
          old = r;
        }
      };
      for (let i = 0; i < 2; i++) {
        const { hip, knee } = pose.legs[i],
          ankle = pose.feet[i],
          { shoulder, elbow, wrist, hand } = pose.arms[i];
        shaped(hip, knee, limbs.thigh * 0.91, limbs.knee * 0.79, 'thigh', pose.floorSeat ? 0.85 : 0);
        const calf = knee.map((v, j) => mix(v, ankle[j], 0.32));
        link(knee, calf, limbs.knee * 0.77, limbs.knee * 0.87, 0.88);
        link(calf, ankle, limbs.knee * 0.87, limbs.ankle * 0.66, 0.88);
        const { heel, toe } = footEnds(pose, i);
        link(heel, toe, 0.5 * rig.ankle, 0.42 * rig.ankle, 1.22);
        const reach = Math.hypot(...wrist.map((v, j) => v - shoulder[j]));
        const flex = clamp(1 - reach / (rig.upperArm + rig.forearm));
        shaped(shoulder, elbow, limbs.upper * 0.85, limbs.elbow * 0.73, 'upperArm', flex);
        const fore = elbow.map((v, j) => mix(v, wrist[j], 0.31));
        link(elbow, fore, limbs.elbow * 0.7, limbs.elbow * 0.74, 0.92);
        link(fore, wrist, limbs.elbow * 0.74, limbs.cuff * 0.62, 0.89);
        link(wrist, hand, limbs.cuff * 0.6, limbs.hand * 0.73, 0.84);
      }
    }
    function muscles(pose, b, k) {
      const pt = studioRig.point,
        dot = (a, c) => a.reduce((n, v, i) => n + v * c[i], 0);
      const unit = (v) => {
        const n = Math.hypot(...v) || 1;
        return v.map((x) => x / n);
      };
      const torsoAxis = [pose.torso[0], pose.torso[4], pose.torso[8]];
      const torsoUp = [pose.torso[2], pose.torso[6], pose.torso[10]];
      const ends = (a, c, t) => a.map((v, i) => mix(v, c[i], t));
      const softness =
        profile === 'baby' ? 0.72 : profile === 'toddler' ? 0.78 : profile === 'child' ? 0.87 : 1;
      // Tendons and bellies follow a local frame along each segment. A bent arm
      // moves the biceps belly toward the shoulder and leaves a fine distal tendon.
      function belly(a, c, radius, offset, region, bend, pigment) {
        const axis = unit(c.map((v, i) => v - a[i]));
        const basis = Math.abs(dot(torsoAxis, axis)) > 0.88 ? torsoUp : torsoAxis;
        const d = dot(axis, basis),
          normal = unit(basis.map((v, i) => v - d * axis[i]));
        const center = region === 'upperArm' ? 0.49 - 0.1 * bend : region === 'shin' ? 0.32 : 0.43;
        const path = (t) => ends(a, c, t).map((v, i) => v + normal[i] * offset * Math.sin(Math.PI * t));
        const thick = (t) =>
          radius * (0.24 + 0.76 * Math.sin(Math.PI * t) ** 0.76) * muscleSection(region, t, bend);
        let prev = path(0.025),
          r0 = thick(0.025);
        for (const t of [center * 0.55, center, 0.74, 0.97]) {
          const q = path(t),
            r1 = thick(t);
          b.link(prev, q, r0, r1, 0.81, () => (t > 0.88 ? k.tendon : pigment));
          prev = q;
          r0 = r1;
        }
      }
      b.frame(null);
      const n = landmarks(pose);
      // Wrap the paired rectus, obliques and spinal extensors around the same
      // waist sections that fit the mannequin and its clothing.
      b.frame(pose.torso);
      const abdomenLow = mix(low, high, 0.17),
        abdomenHigh = mix(low, high, 0.67);
      b.stamp(-chest * 1.25, chest * 1.35, -shoulders, shoulders, abdomenLow, abdomenHigh, (x, y, z) => {
        const row = section(z),
          t = (z - abdomenLow) / (abdomenHigh - abdomenLow);
        const u = (x - row.axis) / (x > row.axis ? row.front : row.back),
          v = Math.abs(y / row.width);
        const envelope = 0.7 + 0.12 * Math.sin(t * Math.PI);
        if (u * u + v * v > envelope * envelope || v > 0.78 || (t < 0.22 && v > 0.16 + 2.4 * t)) return 0;
        if (u >= 0 && v < 0.35) return v < 0.035 ? k.tendon : k.chest;
        if (u < -0.2 && v < 0.065) return k.tendon;
        return u > 0.15 ? k.flexor : k.extensor;
      });
      b.frame(null);
      function bend(a, j, c) {
        const first = unit(a.map((v, i) => v - j[i])),
          last = unit(c.map((v, i) => v - j[i]));
        return clamp((1 + dot(first, last)) * 0.6);
      }
      for (const [i, sgn] of [-1, 1].entries()) {
        const { hip, knee } = pose.legs[i],
          { shoulder, elbow, wrist } = pose.arms[i],
          ankle = pose.feet[i];
        const flex = bend(shoulder, elbow, wrist),
          fold = bend(hip, knee, ankle);
        belly(shoulder, elbow, 0.69 * limbs.upper, limbs.upper * 0.48 * softness, 'upperArm', flex, k.flexor);
        belly(shoulder, elbow, 0.63 * limbs.upper, -limbs.upper * 0.46 * softness, 'upperArm', 0, k.extensor);
        belly(elbow, wrist, 0.88 * limbs.elbow, 0.22 * limbs.elbow, 'forearm', flex, k.flexor);
        belly(hip, knee, 0.86 * limbs.thigh, 0.29 * limbs.thigh * softness, 'thigh', fold, k.flexor);
        belly(hip, knee, 0.69 * limbs.thigh, -0.51 * limbs.thigh * softness, 'thigh', fold, k.extensor);
        belly(knee, ankle, 0.86 * limbs.knee, -0.56 * limbs.knee * softness, 'shin', fold, k.extensor);
        const shoulderRoot = pt(pose.torso, [
          -0.12 * chest,
          sgn * 0.76 * shoulders,
          rig.shoulder[2] + 0.015 * rig.height,
        ]);
        belly(
          shoulderRoot,
          ends(shoulder, elbow, 0.37),
          0.65 * limbs.upper,
          0.05 * chest,
          'upperArm',
          0,
          k.extensor,
        );
        const side = i === 0 ? 'right' : 'left';
        const mastoid = ends(n.headPivot, n[side + 'Ear'], 0.49);
        const clavicle = pt(pose.torso, [0.3 * chest, sgn * 0.23 * shoulders, mix(low, high, 0.88)]);
        belly(mastoid, clavicle, 0.19 * chest, 0, 'forearm', 0, k.flexor);
        const nape = ends(n.neck, n.headPivot, 0.28);
        belly(nape, shoulderRoot, 0.23 * chest, -0.03 * chest, 'forearm', 0, k.extensor);
        const frontChest = pt(pose.torso, [chest * 0.73, sgn * 0.08 * shoulders, mix(low, high, 0.67)]);
        const outerChest = ends(shoulder, elbow, 0.13);
        belly(frontChest, outerChest, 0.34 * chest, 0.24 * chest, 'upperArm', 0, k.chest);
        const seat = pt(pose.torso, [
          rig.pelvis[0] - 0.29 * hipThickness,
          sgn * 0.48 * hipHalf,
          rig.pelvis[2] + 0.22 * hipHeight,
        ]);
        belly(
          seat,
          ends(hip, knee, 0.24),
          0.71 * limbs.thigh,
          -0.23 * hipThickness,
          'thigh',
          fold,
          k.extensor,
        );
      }
    }
    function bones(pose, b, k) {
      b.frame(null);
      const n = landmarks(pose),
        shaft = rig.height * 0.012;
      const chain = (names, r, ink) => {
        for (let j = 1; j < names.length; j++) b.link(n[names[j - 1]], n[names[j]], r, r * 0.9, 1, () => ink);
      };
      chain(['pelvis', 'lumbar', 'thoracic', 'neck', 'headPivot'], shaft * 1.15, k.bone);
      chain(['thoracic', 'sternum'], shaft, k.bone);
      for (const side of ['right', 'left']) {
        const shade = side === 'left' ? k.nearBone : k.farBone;
        chain(['sternum', side + 'Shoulder', side + 'Elbow', side + 'Wrist', side + 'Hand'], shaft, shade);
        chain(['pelvis', side + 'Hip', side + 'Knee', side + 'Ankle'], shaft * 1.12, shade);
        chain([side + 'Ankle', side + 'Heel', side + 'Toe'], shaft * 0.85, shade);
      }
      // The ilium widens toward the crest. The two rami connect to the pubis
      // below it and leave a window on each side in oblique and front views.
      b.frame(pose.torso);
      const pubis = [rig.pelvis[0] + hipThickness * 0.54, 0, rig.pelvis[2] - 0.25 * hipHeight];
      for (const side of [-1, 1]) {
        const crest = [
          rig.pelvis[0] - 0.2 * hipThickness,
          side * hip * 0.8,
          rig.pelvis[2] + 0.47 * hipHeight,
        ];
        const socket = [rig.pelvis[0], side * hip * 0.62, rig.pelvis[2] - 0.1 * hipHeight];
        const ischium = [
          rig.pelvis[0] - 0.35 * hipThickness,
          side * hip * 0.48,
          rig.pelvis[2] - 0.38 * hipHeight,
        ];
        b.link(crest, socket, shaft * 1.65, shaft * 1.1, 0.89, () => k.bone);
        b.link(ischium, socket, shaft * 0.74, shaft, 1, () => k.bone);
        b.link(ischium, pubis, shaft * 0.66, shaft * 0.68, 1, () => k.bone);
        b.link(socket, pubis, shaft * 0.73, shaft * 0.67, 1, () => k.bone);
        b.link(
          crest,
          [rig.pelvis[0] - 0.54 * hipThickness, 0, rig.pelvis[2] + 0.18 * hipHeight],
          shaft,
          shaft * 1.1,
          1,
          () => k.bone,
        );
      }
      b.frame(null);
      // Ribs turn into the sternum in front and terminate at the thoracic spine behind.
      for (const h of [0.55, 0.62, 0.69, 0.76]) {
        const z = mix(low, high, h),
          r = section(z);
        for (const side of [-1, 1]) {
          let prev;
          for (let i = 0; i <= 12; i++) {
            const angle = (Math.PI * i) / 12,
              x = -Math.cos(angle);
            const q = studioRig.point(pose.torso, [
              r.axis + x * 0.78 * (x > 0 ? r.front : r.back),
              side * r.width * 0.84 * Math.sin(angle),
              z + 0.035 * (high - low) * Math.cos(angle),
            ]);
            if (prev) b.link(prev, q, shaft * 0.46, shaft * 0.46, 1, () => k.bone);
            prev = q;
          }
        }
      }
      for (const name of Object.keys(n)) {
        // These are outer-surface measurement points. The volumetric skull
        // supplies its own orbits, mandibular rim and condyles.
        if (/Eye$|Ear$|Hinge$|Jaw$/.test(name) || name === 'chin') continue;
        const r = shaft * 0.92;
        b.blob(...n[name], r, r, r, k.joint);
      }
    }
    return { profile, low, high, section, limbs, landmarks, skin, bones, muscles, muscleSection };
  }
  return { bind, muscleSection };
})();
