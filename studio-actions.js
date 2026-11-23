// All clips sample an absolute, normalized time. They use the same physical rig in playback and scrubbing.
const soloClips = (() => {
  const { pose, point, frame, ramp, mix, clamp } = studioRig;
  const pi = Math.PI,
    tau = 2 * pi,
    sides = [-1, 1],
    zero = [0, 0, 0];
  const blink = (u) => ramp(u, 0.37, 0.392) * (1 - ramp(u, 0.405, 0.43));
  const blend = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
  const unit = (v) => {
    const m = Math.hypot(...v) || 1;
    return v.map((n) => n / m);
  };
  const add = (a, b, f = 1) => a.map((x, i) => x + b[i] * f);
  function entry(person, p, x = 0, y = 0, z = 0, heading = 0) {
    return [{ character: person.id, x, y, z, heading, pose: p }];
  }
  const seated = studioRig.seated;
  function waist(r, person) {
    return person.tags.includes('baby') ? seated(r, true) : {};
  }
  function idle(u, a) {
    const r = a.rig,
      ch = waist(r, a),
      off = ch.hipOffset || zero,
      breath = ch.feet ? 0.15 : 0.005 * (r.thigh + r.shin);
    ch.hipOffset = [
      off[0],
      off[1] + r.height * 0.005 * Math.sin(tau * u),
      off[2] - breath * (1 - Math.cos(tau * u))
    ];
    ch.headYaw = 0.13 * Math.sin(u * tau) ** 3;
    ch.blink = blink(u);
    return entry(a, pose(r, ch));
  }
  function sway(u, a) {
    const r = a.rig,
      ch = waist(r, a),
      off = ch.hipOffset || zero,
      w = Math.sin(tau * u),
      nod = 1 - Math.cos(tau * u);
    ch.hipOffset = [off[0], off[1] + r.height * 0.026 * w, off[2] - r.height * 0.006 * nod];
    ch.roll = -0.068 * w;
    ch.headRoll = 0.054 * w;
    ch.headYaw = 0.09 * w;
    ch.blink = blink(u);
    return entry(a, pose(r, ch));
  }
  function sit(u, a) {
    const r = a.rig,
      floor = a.tags.includes('baby'),
      base = seated(r, floor);
    base.headYaw = 0.11 * Math.sin(tau * u);
    base.blink = blink(u);
    const legs = pose(r, base).legs;
    base.hands = legs.map(({ hip, knee }, i) => {
      const p = blend(hip, knee, 0.75);
      p[1] += sides[i] * 0.4;
      p[2] += r.height * 0.047;
      return p;
    });
    const p = pose(r, base);
    if (!floor)
      p.props = [
        {
          kind: 'stool',
          frame: frame(zero, [base.hipOffset[0], 0, r.height * 0.16], 0, 0, 0),
          scale: r.height / 50
        }
      ];
    return entry(a, p);
  }
  function sitdown(u, a) {
    const r = a.rig,
      base = seated(r),
      weight = ramp(u, 0.03, 0.35) * (1 - ramp(u, 0.65, 0.99));
    const lean = Math.sin(pi * weight),
      ch = {
        hipOffset: base.hipOffset.map((v) => v * weight),
        standing: 1 - weight,
        feet: base.feet,
        pitch: 0.29 * lean + 0.045 * weight,
        headPitch: -0.12 * lean,
        blink: blink(u)
      };
    const interim = pose(r, ch);
    ch.hands = interim.legs.map(({ hip, knee }, i) => {
      const rest = blend(hip, knee, 0.75);
      rest[1] += sides[i] * 0.4;
      rest[2] += r.height * 0.047;
      return blend(interim.arms[i].hand, rest, weight);
    });
    const p = pose(r, ch);
    p.props = [
      {
        kind: 'stool',
        frame: frame(zero, [base.hipOffset[0], 0, r.height * 0.16], 0, 0, 0),
        scale: r.height / 50
      }
    ];
    return entry(a, p);
  }
  function wave(u, a) {
    const r = a.rig,
      ch = waist(r, a),
      weight = ramp(u, 0, 0.21) * (1 - ramp(u, 0.8, 1));
    ch.blink = blink(u);
    const neutral = pose(r, ch);
    const shoulder = neutral.arms[0].shoulder,
      length = r.upperArm + r.forearm + r.palm;
    const target = add(
      shoulder,
      [0.24, -0.54 - 0.16 * Math.sin(3 * tau * u), 0.48 + 0.13 * Math.cos(3 * tau * u)],
      length
    );
    ch.hands = [blend(neutral.arms[0].hand, target, weight), null];
    ch.headRoll = 0.03 * weight;
    return entry(a, pose(r, ch));
  }
  function moving(u, a, run) {
    const r = a.rig,
      h = r.height,
      count = run ? 9 : 7,
      shift = h * (run ? 0.24 : 0.175);
    const time = clamp(u) * count,
      j = Math.min(count - 1, Math.floor(time)),
      t = clamp(time - j);
    const smooth = t * t * (3 - 2 * t),
      swing = j % 2,
      radius = (shift * (count - 1)) / tau;
    function place(k, side) {
      const phase = (k / (count - 1)) * tau,
        heading = phase;
      return [
        radius * Math.sin(phase) - Math.sin(heading) * side * r.hip[1],
        radius * (1 - Math.cos(phase)) + Math.cos(heading) * side * r.hip[1]
      ];
    }
    const contact = sides.map((s, i) =>
      i === swing
        ? blend(place(Math.max(0, j - 1), s), place(Math.min(j + 1, count - 1), s), smooth)
        : place(j, s)
    );
    const station = (j + mix(Math.max(0, j - 1), Math.min(j + 1, count - 1), smooth)) * 0.5;
    const heading = (station / (count - 1)) * tau;
    const x = (contact[0][0] + contact[1][0]) * 0.5,
      y = (contact[0][1] + contact[1][1]) * 0.5,
      c = Math.cos(heading),
      s = Math.sin(heading);
    const beat = Math.sin(pi * t),
      strength = ramp(u, 0, 0.08) * (1 - ramp(u, 0.92, 1));
    const feet = contact.map(([px, py], i) => [
      (px - x) * c + (py - y) * s,
      -(px - x) * s + (py - y) * c,
      r.ankle + (i === swing ? beat * h * (run ? 0.109 : 0.068) : 0)
    ]);
    const stride = clamp((feet[1][0] - feet[0][0]) / shift, -1, 1),
      drive = run ? 0.185 : 0.12;
    const ch = {
      feet,
      standing: 1 - strength,
      hipOffset: [0, 0, -0.017 * h * Math.abs(stride)],
      pitch: (run ? 0.14 : 0.045) * strength,
      headPitch: -0.035 * strength,
      blink: blink(u)
    };
    const neutral = pose(r, ch);
    ch.hands = neutral.arms.map((arm, i) =>
      add(arm.shoulder, [0.035 - sides[i] * drive * stride, sides[i] * 0.054, -(run ? 0.185 : 0.251)], h)
    );
    const airborne = run ? h * 0.051 * Math.sin(pi * clamp((t - 0.53) / 0.47)) ** 2 * strength : 0;
    return entry(a, pose(r, ch), x, y, airborne, heading);
  }
  function jump(u, a) {
    const r = a.rig,
      h = r.height,
      flight = clamp((u - 0.25) / 0.47),
      arc = 4 * flight * (1 - flight);
    const dip =
      ramp(u, 0.015, 0.15) - ramp(u, 0.15, 0.25) + 0.86 * (ramp(u, 0.71, 0.79) - ramp(u, 0.79, 0.98));
    const ch = {
      standing: 1 - Math.max(dip, arc),
      hipOffset: [-0.045 * h * dip, 0, -0.115 * h * dip],
      pitch: 0.23 * dip,
      feet: sides.map((s) => [-0.028 * h * arc, s * r.hip[1], r.ankle + 0.071 * h * arc]),
      headPitch: -0.08 * arc
    };
    const p = pose(r, ch);
    ch.hands = p.arms.map(({ shoulder }, i) =>
      add(shoulder, [0.04 - 0.16 * dip + 0.14 * arc, sides[i] * (0.053 + 0.08 * arc), -0.24 + 0.36 * arc], h)
    );
    return entry(a, pose(r, ch), 0, 0, h * 0.26 * arc);
  }
  function drink(u, a) {
    const r = a.rig,
      h = r.height,
      s = h / 50,
      raise = ramp(u, 0.17, 0.4) * (1 - ramp(u, 0.66, 0.86));
    const tilt = ramp(u, 0.3, 0.46) * (1 - ramp(u, 0.63, 0.81)),
      held = ramp(u, 0.01, 0.16) * (1 - ramp(u, 0.87, 0.99));
    const ch = { headPitch: -0.15 * tilt, headYaw: -0.055 * tilt, blink: blink(u) };
    const rest = pose(r, ch),
      mouth = studioRig.socket(a, rest, 'mouth'),
      dock = a.sockets?.bottleDock
        ? studioRig.socket(a, rest, 'bottleDock')
        : point(rest.torso, [-4.85 * s, -6.65 * s, 0.536 * h]);
    const lip = blend(dock, mouth, raise);
    lip[0] += 2 * s * Math.sin(pi * raise);
    lip[1] -= 2.7 * s * Math.sin(pi * raise);
    const axis = unit(blend([0, 0, 1], [-0.94, 0.25, -0.23], tilt)),
      base = add(lip, axis, -6.8 * s),
      grip = add(lip, axis, -3.6 * s);
    grip[1] += s;
    ch.hands = [blend(rest.arms[0].hand, grip, held), null];
    const p = pose(r, ch);
    p.bottle = { base, lip, held: held > 0.94 };
    return entry(a, p);
  }
  function phone(u, a) {
    const r = a.rig,
      h = r.height,
      s = h / 50,
      raised = ramp(u, 0.03, 0.23) * (1 - ramp(u, 0.81, 0.99));
    const tap = Math.sin(tau * u * 5),
      swiping = Math.sin(tau * u * 2.5);
    const ch = { headPitch: 0.25 * raised, headYaw: 0.12 * raised, blink: blink(u) };
    const rest = pose(r, ch);
    const center = [h * (0.065 + 0.09 * raised), h * 0.085, r.shoulder[2] - h * (0.18 - 0.115 * raised)];
    const close = [h * 0.11, 0, r.shoulder[2] - h * 0.03];
    const screen = frame(zero, center, 0.13, -0.19 - 0.07 * raised, 0);
    const travel = add(center, close, -1);
    const reach = r.upperArm + r.forearm + r.palm;
    const gripOffset = [0.45 * s, 1.48 * s, -0.8 * s];
    function reachableFraction(arm, offset, radius) {
      const fromShoulder = add(point(screen, offset), arm.shoulder, -1);
      const far = Math.hypot(...fromShoulder);
      if (far <= radius) return 1;
      const near = Math.hypot(...add(fromShoulder, travel, -1));
      return far > near ? clamp((radius - near) / (far - near)) : 0;
    }
    // Reserve the whole tapping area, so the phone stays steady between finger taps.
    const fraction = Math.min(
      reachableFraction(rest.arms[0], [-1.25 * s, -0.24 * s, 0], reach - 1.21 * s),
      reachableFraction(rest.arms[1], gripOffset, reach)
    );
    for (let i = 0; i < 3; i++) screen[4 * i + 3] = mix(close[i], center[i], fraction);
    const gripping = point(screen, gripOffset);
    const tapping = point(screen, [
      (-1.25 + 0.72 * tap) * s,
      (-0.24 + 0.75 * swiping) * s,
      0.6 * s * swiping
    ]);
    ch.hands = [blend(rest.arms[0].hand, tapping, raised), gripping];
    const p = pose(r, ch);
    p.props = [{ kind: 'phone', frame: screen, scale: s }];
    return entry(a, p);
  }
  function type(u, a) {
    const r = a.rig,
      h = r.height,
      s = h / 50,
      ch = seated(r);
    ch.pitch = 0.115;
    ch.headPitch = 0.155 + 0.022 * Math.sin(tau * u);
    ch.blink = blink(u);
    const seatedPose = pose(r, ch),
      knee = seatedPose.legs[0].knee;
    const x = knee[0] - 1.2 * s,
      lap = knee[2] + 2.0 * s;
    const shoulder = seatedPose.arms[1].shoulder,
      reach = r.upperArm + r.forearm + r.palm;
    // The lowest and farthest key must stay within reach for the whole cycle.
    const dx = Math.abs(x + 0.7 * s - shoulder[0]) + 0.65 * s;
    const dy = Math.abs(shoulder[1] - 2.8 * s) + 0.72 * s;
    const down = Math.sqrt(Math.max(0, reach * reach - dx * dx - dy * dy));
    const rise = Math.max(0, shoulder[2] - down - 0.7 * s - lap);
    const keyboard = frame(zero, [x, 0, lap + rise], 0, 0, 0);
    ch.hands = sides.map((side, i) => {
      const beat = Math.sin(tau * (u * (i ? 7 : 9) + i * 0.27));
      return point(keyboard, [
        (0.7 + 0.65 * Math.sin(tau * u * 3 + i)) * s,
        side * (2.8 + 0.72 * Math.cos(tau * u * 2 + i)) * s,
        (1.3 + 0.6 * beat) * s
      ]);
    });
    const p = pose(r, ch);
    p.props = [
      { kind: 'stool', scale: s, frame: frame(zero, [ch.hipOffset[0], 0, h * 0.16], 0, 0, 0) },
      { kind: 'laptop', frame: keyboard, scale: s, rise }
    ];
    return entry(a, p);
  }
  function clap(u, a) {
    const r = a.rig,
      h = r.height,
      ch = waist(r, a);
    ch.blink = blink(u);
    const p = pose(r, ch),
      spread = (1 - Math.cos(u * tau * 3)) * 0.5;
    const front = point(p.torso, [h * 0.13, 0, r.shoulder[2] - 0.06 * h]);
    ch.hands = sides.map((s) => [
      front[0],
      s * (h * 0.024 + spread * h * 0.12),
      front[2] + spread * h * 0.025
    ]);
    return entry(a, pose(r, ch));
  }
  function crawl(u, a) {
    const r = a.rig,
      h = r.height,
      steps = 12,
      t = clamp(u) * steps,
      j = Math.min(steps - 1, Math.floor(t)),
      f = t - j;
    const radius = h * 0.19,
      heading = (t * tau) / steps,
      c = Math.cos(heading),
      s = Math.sin(heading),
      x = radius * s,
      y = radius * (1 - c);
    // Store each support in the scene for a full step, even while the child's body turns.
    function support(forward, side, z, index, lift) {
      function mark(station) {
        const angle = (station * tau) / steps,
          cs = Math.cos(angle),
          sn = Math.sin(angle);
        return [radius * sn + cs * forward - sn * side, radius * (1 - cs) + sn * forward + cs * side];
      }
      const swing = (j + index) % 2;
      const p = swing ? blend(mark(j - 0.5), mark(j + 1.5), f * f * (3 - 2 * f)) : mark(j + 0.5);
      const dx = p[0] - x,
        dy = p[1] - y;
      return [c * dx + s * dy, -s * dx + c * dy, z + (swing ? lift * Math.sin(pi * f) ** 2 : 0)];
    }
    const ch = {
      pitch: 1.1,
      hipOffset: [0, 0, -r.pelvis[2] * 0.47],
      headPitch: -0.89,
      feet: sides.map((side, i) => support(-h * 0.16, side * r.hip[1], r.ankle, i + 1, h * 0.028)),
      hands: sides.map((side, i) => support(h * 0.24, side * r.shoulder[1], r.palm, i, h * 0.063)),
      kneePoles: [
        [0.65, 0, -1],
        [0.65, 0, -1]
      ],
      blink: blink(u)
    };
    return entry(a, pose(r, ch), x, y, 0, heading);
  }
  return {
    idle,
    sit,
    sitdown,
    sway,
    wave,
    walk: (u, a) => moving(u, a, false),
    run: (u, a) => moving(u, a, true),
    jump,
    drink,
    phone,
    type,
    clap,
    crawl
  };
})();
