// Physical units are shared by every actor. Art density changes sampling, never bone length.
const studioRig = (() => {
  const { frame, point, compose, joint, armPole, standingHipLift } = hikerMotion.geometry;
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
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
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
  // Clamp a shared target to the intersection of the partners' reach spheres.
  function commonReach(shoulders, lengths, goal) {
    const fraction=lengths[0]/(lengths[0]+lengths[1]);
    const start=shoulders[0].map((v,i)=>mix(v,shoulders[1][i],fraction));
    const ray=goal.map((v,i)=>v-start[i]);
    const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
    const dd=dot(ray,ray);
    let t=1;
    if (dd>1e-10) shoulders.forEach((p,i)=>{
      const d=start.map((v,j)=>v-p[j]), b=dot(d,ray), c=dot(d,d)-lengths[i]**2;
      t=Math.min(t,clamp((-b+Math.sqrt(Math.max(0,b*b-dd*c)))/dd));
    });
    return start.map((v,i)=>v+t*ray[i]);
  }
  function seated(r, floor = false) {
    if (floor && r.infantFloorSupport) {
      const length = r.thigh + r.shin, height = r.height;
      const seatX = -.045 * height, seatZ = .102 * height;
      // A ring sitter balances on the seat and both heels. One leg opens farther
      // out while the other extends forward; the ankles separate in profile too.
      return {
        floorSeat: true,
        hipOffset: [seatX, 0, seatZ - r.pelvis[2]],
        pitch: r.infantLapRest ? .25 : .16, headPitch: r.infantLapRest ? -.225 : -.13,
        feet: [[seatX + .90 * length, -(r.hip[1] + .28 * length), r.ankle],
          [seatX + .48 * length, r.hip[1] + .46 * length, r.ankle]],
        kneePoles: [[.24, -.86, .92], [-.38, 1.08, .70]],
        // The palms rest over the two thighs, above the booties.
        hands: r.infantLapRest ? [[seatX+.69*length,-.78*r.shoulder[1],seatZ+.18*length],
          [seatX+.52*length,.85*r.shoulder[1],seatZ+.12*length]] : [[seatX + .56 * length, -.91 * r.shoulder[1], seatZ + .48 * length],
          [seatX + .49 * length, 1.08 * r.shoulder[1], seatZ + .31 * length]],
        ...(r.archivedArmPose ? { elbowPoles: [[-.45, -.80, -.67], [-.52, .90, -.52]] } : {})
      };
    }
    const depth = r.height * (floor ? 0.09 : 0.157),
      top = floor ? 0 : r.height * 0.16;
    return {
      hipOffset: [-depth, 0, top + r.height * (floor ? 0.108 : 0.064) - r.pelvis[2]],
      pitch: floor ? 0.07 : 0.045,
      feet: sides.map((s) => [floor ? r.height * 0.15 : 0, s * r.hip[1] * (floor ? 1.18 : 1), r.ankle])
    };
  }
  // The tucked leg opens more at the hip, the extended leg flexes up at
  // the ankle. Skin, shoes and socks can use the same two rotations.
  function seatedAnkle(r, pose, index) {
    const foot = pose.feet[index], hip = pose.legs[index].hip;
    const length = r.thigh + r.shin;
    const outward = Math.abs(foot[1] - hip[1]) / length;
    const extension = Math.abs(foot[0] - hip[0]) / length;
    return {pitch: .30 + .47 * clamp(extension), yaw: sides[index] * (.18 + .83 * clamp(outward, 0, .88))};
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
  // Targets use actor-local coordinates. Express the ray in the moving head frame
  // so eye motion stays attached when the root or the camera turns.
  function lookAt(actor, pose, target) {
    const left = socket(actor, pose, 'leftEye'), right = socket(actor, pose, 'rightEye');
    const [x,y,z] = target.map((v,i) => v - (left[i] + right[i]) * .5);
    if (Math.hypot(x,y,z) < 1e-6) return [0,0];
    const m = pose.head;
    const front = m[0]*x + m[4]*y + m[8]*z;
    const side = m[1]*x + m[5]*y + m[9]*z;
    const up = m[2]*x + m[6]*y + m[10]*z;
    const horizontal = Math.hypot(front,side);
    return [horizontal < 1e-6 ? 0 : clamp(Math.atan2(side,front) / .82,-1,1), clamp(Math.atan2(up,horizontal) / .78,-1,1)];
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
  // Open a free, hanging arm in the frontal plane without straightening its elbow.
  // Front, out and down are fractions of this actor's arm reach.
  function restingHand(rig, torso, side, front = .1, out = .15, down = .945) {
    const angle = rig.archivedArmPose ? 0 : .09;
    const c = Math.cos(angle), s = Math.sin(angle);
    const reach = rig.upperArm + rig.forearm + rig.palm;
    return point(torso, [
      rig.shoulder[0] + reach*front,
      side*(rig.shoulder[1] + reach*(out*c + down*s)),
      rig.shoulder[2] - reach*(down*c - out*s)
    ]);
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
        (channels.floorSeat && rig.seatedHeadOffset) || rig.headOffset || origin,
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
      const goal = channels.hands?.[i] || restingHand(rig,torso,side),
        delta = goal.map((v, k) => v - shoulder[k]);
      const requested = Math.hypot(...delta);
      const factor = Math.min(1, length / (requested || 1));
      let hand = delta.map((v, k) => shoulder[k] + v * factor);
      const lower = rig.forearm + rig.palm;
      const innerReach = Math.abs(rig.upperArm-lower)+.0001;
      if (!rig.archivedArmPose && requested < innerReach) {
        const ray = requested ? delta.map(v=>v/requested) : [-torso[2],-torso[6],-torso[10]];
        hand = shoulder.map((v,k)=>v+innerReach*ray[k]);
      }
      const ray = hand.map((v,k)=>v-shoulder[k]);
      let pole = channels.elbowPoles?.[i];
      if (!pole || (!rig.archivedArmPose && Math.hypot(...cross(ray,pole)) < 1e-7)) {
        pole = rig.archivedArmPose ? [-.4, side, -.55] : armPole(torso,ray,side,length);
      }
      const elbow = joint(shoulder, hand, rig.upperArm, lower, pole);
      const wrist = elbow.map((v, k) => mix(v, hand[k], rig.forearm/lower));
      const arm = { side, shoulder, elbow, wrist, hand };
      if (!rig.archivedArmPose) {
        // The thumb follows the hinge through full extension, where the three
        // joint positions alone no longer specify the forearm's rotation.
        const thumb = cross(hand.map((v,k)=>v-elbow[k]),cross(ray,pole));
        const magnitude = Math.hypot(...thumb);
        if (magnitude) arm.thumb = thumb.map(v=>v/magnitude);
      }
      return arm;
    });
    const result = { torso, head, feet, legs, arms, blink: channels.blink || 0, props: [], bottle: null, bob: 0 };
    if (rig.facialActing && channels.faceCue) {
      const { gaze = [0,0], smile = 0 } = channels.faceCue;
      if (!Array.isArray(gaze) || gaze.length !== 2 || !gaze.every(Number.isFinite) || !Number.isFinite(smile))
        throw Error('视线需要两个有限数值，笑意需要一个有限数值');
      result.faceCue = { gaze: gaze.map(v => clamp(v,-1,1)), smile: clamp(smile) };
    }
    if (channels.floorSeat) result.floorSeat = true;
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
    restingHand,
    // Freeze the original arm articulation for the published pixel-art comparisons.
    withArchivedArmPose: actor => ({...actor, rig:{...actor.rig, archivedArmPose:true}}),
    seated,
    seatedAnkle,
    commonReach,
    world,
    local,
    validate,
    bindSockets,
    socket,
    lookAt,
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
