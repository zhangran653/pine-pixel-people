// Physical units are shared by every actor. Art density changes sampling, never bone length.
const studioRig = (() => {
  const { frame, point, compose, joint, standingHipLift } = hikerMotion.geometry;
  const sides = [-1, 1]; // anatomical right, then left
  const profiles = {
    adult: {
      height: 50,
      pelvis: [-0.15, 0, 19.2],
      hip: [-0.4, 3.05, 19.5],
      shoulder: [0.3, 5.65, 31.8],
      neck: [0.2, 0, 34.5],
      mouth: [5.6, -0.45, 37.6],
      ankle: 3.1,
      thigh: 8.7,
      shin: 8.45,
      upperArm: 6.78,
      forearm: 5.8,
      palm: 1.32
    },
    child: {
      height: 34,
      pelvis: [-0.17, 0, 12.3],
      hip: [-0.3, 2.55, 12.5],
      shoulder: [0.2, 4.1, 21],
      neck: [0.1, 0, 23],
      mouth: [4.1, -0.3, 25.8],
      ankle: 2.15,
      thigh: 5.6,
      shin: 5.4,
      upperArm: 4.75,
      forearm: 4.15,
      palm: 0.98
    },
    toddler: {
      height: 28,
      pelvis: [-0.13, 0, 9.4],
      hip: [-0.2, 2.25, 9.5],
      shoulder: [0.15, 3.65, 16.4],
      neck: [0.1, 0, 18.4],
      mouth: [3.85, -0.25, 20.75],
      ankle: 1.75,
      thigh: 4.25,
      shin: 4.05,
      upperArm: 3.85,
      forearm: 3.35,
      palm: 0.83
    },
    baby: {
      height: 22,
      pelvis: [-0.1, 0, 7.1],
      hip: [-0.1, 2.1, 7.2],
      shoulder: [0.1, 3.05, 12.65],
      neck: [0.1, 0, 14.15],
      mouth: [3.55, -0.25, 16.1],
      ankle: 1.4,
      thigh: 3.15,
      shin: 3.05,
      upperArm: 3.0,
      forearm: 2.55,
      palm: 0.75
    }
  };
  const origin = [0, 0, 0];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const ramp = (t, a, b) => {
    const u = clamp((t - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  function world(root, p) {
    const c = Math.cos(root.heading),
      s = Math.sin(root.heading);
    return [root.x + c * p[0] - s * p[1], root.y + s * p[0] + c * p[1], root.z + p[2]];
  }
  function local(root, p) {
    const c = Math.cos(root.heading),
      s = Math.sin(root.heading),
      x = p[0] - root.x,
      y = p[1] - root.y;
    return [c * x + s * y, -s * x + c * y, p[2] - root.z];
  }
  function seated(r, floor = false) {
    const depth = r.height * (floor ? 0.09 : 0.157),
      top = floor ? 0 : r.height * 0.16;
    return {
      hipOffset: [-depth, 0, top + r.height * (floor ? 0.108 : 0.064) - r.pelvis[2]],
      pitch: floor ? 0.07 : 0.045,
      feet: sides.map((s) => [floor ? r.height * 0.15 : 0, s * r.hip[1] * (floor ? 1.18 : 1), r.ankle])
    };
  }
  function validate(rig) {
    if (!rig || typeof rig !== 'object') throw new Error('请提供已登记的体型名称或体型参数');
    for (const key of ['height', 'ankle', 'thigh', 'shin', 'upperArm', 'forearm', 'palm']) {
      if (!Number.isFinite(rig[key]) || rig[key] <= 0) throw new Error('体型尺寸无效 · ' + key);
    }
    for (const key of ['pelvis', 'hip', 'shoulder', 'neck', 'mouth']) {
      if (!Array.isArray(rig[key]) || rig[key].length !== 3 || !rig[key].every(Number.isFinite))
        throw new Error('体型坐标无效 · ' + key);
    }
    for (const name of ['headPivot', 'jawPivot']) {
      const p = rig[name];
      if (p !== undefined && (!Array.isArray(p) || p.length !== 3 || !p.every(Number.isFinite)))
        throw Error('骨骼支点需要三个有限坐标 · ' + name);
    }
    return rig;
  }
  function bindSockets(rig, overrides = {}) {
    const eye = (side) => ({
      frame: 'head',
      point: [
        rig.mouth[0] + 0.0104 * rig.height,
        side * rig.shoulder[1] * 0.4,
        rig.mouth[2] + 0.064 * rig.height
      ]
    });
    const onBody = (p) => ({ frame: 'torso', point: p.map((v) => (v * rig.height) / 22) });
    const sockets = {
      mouth: { frame: 'head', point: rig.mouth },
      rightEye: eye(-1),
      leftEye: eye(1),
      seat: onBody([-0.12, 2.85, 5.9]),
      upperBack: onBody([-1.95, -1.18, 11.65]),
      ...overrides
    };
    for (const [name, s] of Object.entries(sockets)) {
      if (
        !s ||
        !(['head', 'torso'].includes(s.frame) || (s.frame === 'jaw' && rig.jawPivot)) ||
        !Array.isArray(s.point) ||
        s.point.length !== 3 ||
        !s.point.every(Number.isFinite)
      )
        throw new Error('接触点定义无效 · ' + name);
    }
    return sockets;
  }
  function socket(actor, pose, name) {
    const anchor = actor.sockets[name];
    if (!anchor) throw new Error('未知接触点 · ' + name);
    return point(pose[anchor.frame], anchor.point);
  }
  function mandibleFrame(rig, open) {
    const reach = Math.hypot(rig.mouth[0] - rig.jawPivot[0], rig.mouth[2] - rig.jawPivot[2]);
    const glide = reach * 0.075 * open * open;
    return frame(rig.jawPivot, [glide, 0, -0.35 * glide], 0, 0.38 * open, 0);
  }
  // A fixed desk or a planted foot can straddle a step. Keep the upper-body pose and its contacts.
  function clearFootSurfaces(rig, pose, surfaces, rootZ, baseZ) {
    if (!pose.legs || !pose.feet) return pose;
    const feet = pose.feet.slice(), legs = pose.legs.slice();
    let changed = false;
    for (const [i, old] of pose.feet.entries()) {
      const ankle = surfaces[i] - rootZ + rig.ankle;
      if (surfaces[i] <= baseZ + 1e-8 || ankle <= old[2] + 1e-8) continue;
      const { hip, knee } = legs[i], pole = knee.map((v, j) => v - hip[j]);
      feet[i] = [old[0], old[1], ankle];
      legs[i] = { ...legs[i], knee: joint(hip, feet[i], rig.thigh, rig.shin, pole) };
      changed = true;
    }
    return changed ? { ...pose, feet, legs } : pose;
  }
  function pose(rig, channels = {}) {
    const torso = frame(
      rig.pelvis,
      channels.hipOffset || origin,
      channels.yaw || 0,
      channels.pitch || 0,
      channels.roll || 0
    );
    const head = compose(
      torso,
      frame(
        rig.headPivot || rig.neck,
        origin,
        channels.headYaw || 0,
        channels.headPitch || 0,
        channels.headRoll || 0
      )
    );
    const feet = channels.feet || sides.map((s) => [0, s * rig.hip[1], rig.ankle]);
    const standing = clamp(channels.standing ?? (channels.feet ? 0 : 1));
    const hipZ =
      rig.hip[2] + standing * standingHipLift(rig.hip[0], rig.hip[2], rig.ankle, rig.thigh, rig.shin);
    // The contact foot is authoritative. Lower the pelvis for a distant planted foot.
    sides.forEach((s, i) => {
      const hip = point(torso, [rig.hip[0], s * rig.hip[1], hipZ]);
      const flat = (feet[i][0] - hip[0]) ** 2 + (feet[i][1] - hip[1]) ** 2;
      const limit = Math.sqrt(Math.max(0, (rig.thigh + rig.shin) ** 2 - flat));
      const excess = Math.max(0, hip[2] - feet[i][2] - limit);
      torso[11] -= excess;
      head[11] -= excess;
    });
    const legs = sides.map((s, i) => {
      const hip = point(torso, [rig.hip[0], s * rig.hip[1], hipZ]);
      return { hip, knee: joint(hip, feet[i], rig.thigh, rig.shin, channels.kneePoles?.[i] || [1, 0, 0]) };
    });
    const arms = sides.map((side, i) => {
      const base = [rig.shoulder[0], side * rig.shoulder[1], rig.shoulder[2]],
        shoulder = point(torso, base);
      const length = rig.upperArm + rig.forearm + rig.palm;
      const rest = point(torso, [
        base[0] + length * 0.1,
        base[1] + side * length * 0.15,
        base[2] - length * 0.945
      ]);
      const goal = channels.hands?.[i] || rest,
        delta = goal.map((v, k) => v - shoulder[k]);
      const factor = Math.min(1, length / (Math.hypot(...delta) || 1));
      const hand = delta.map((v, k) => shoulder[k] + v * factor);
      const elbow = joint(
        shoulder,
        hand,
        rig.upperArm,
        rig.forearm + rig.palm,
        channels.elbowPoles?.[i] || [-0.4, side, -0.55]
      );
      const wrist = elbow.map((v, k) => mix(v, hand[k], rig.forearm / (rig.forearm + rig.palm)));
      return { side, shoulder, elbow, wrist, hand };
    });
    const result = { torso, head, feet, legs, arms, blink: channels.blink || 0, props: [], bottle: null, bob: 0 };
    if (rig.jawPivot) {
      const open = clamp(channels.jawOpen || 0);
      result.jawOpen = open;
      result.jaw = head;
      if (open > 0) {
        // As the condyles roll, they also slide a little anteriorly and inferiorly.
        result.jawLocal = mandibleFrame(rig, open);
        result.jaw = compose(head, result.jawLocal);
      }
    }
    return result;
  }
  return {
    centimetersPerUnit: 3.4,
    profiles,
    seated,
    world,
    local,
    validate,
    bindSockets,
    socket,
    mandibleFrame,
    clearFootSurfaces,
    pose,
    point,
    frame,
    compose,
    clamp,
    mix,
    ramp
  };
})();
