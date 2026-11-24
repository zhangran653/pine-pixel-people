// All three clips can be sampled directly, including while paused or in reverse.
// Hands and support points are solved in character space. entry.contacts is in world space.
const duetClips = (() => {
  const { pose, point, mix, ramp } = studioRig;
  const pi = Math.PI;
  const sides = [-1, 1]; // anatomical right, then left
  const reach = (rig) => rig.upperArm + rig.forearm + rig.palm;
  const between = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
  const window = (u, start, up, down, end) => ramp(u, start, up) * (1 - ramp(u, down, end));
  const blink = (u, t) => window(u, t, t + 0.014, t + 0.019, t + 0.036);
  const { world, local } = studioRig;
  function entry(character, root, body, contacts) {
    return { character: character.id, ...root, pose: body, contacts };
  }

  function highfive(u, lead, partner) {
    const lift = window(u, 0.04, 0.26, 0.78, 0.96),
      meet = window(u, 0.27, 0.43, 0.56, 0.79);
    const actors = [lead, partner],
      arms = actors.map((c) => reach(c.rig));
    // The smaller participant chooses a comfortable height. The taller one bends to meet it.
    const z = Math.min(...actors.map(({ rig }, i) => rig.shoulder[2] + 0.55 * arms[i]));
    const palmY = (lead.rig.shoulder[1] * arms[1] + partner.rig.shoulder[1] * arms[0]) / (arms[0] + arms[1]);
    const common = [0, palmY, z];
    return actors.map((character, i) => {
      const rig = character.rig,
        side = i === 0 ? 1 : -1,
        handIndex = i === 0 ? 1 : 0;
      const arm = arms[i],
        space = Math.max(0.65 * arm, rig.mouth[0] + 0.9 * rig.palm);
      const root = { x: i === 0 ? -space : space, y: 0, z: 0, heading: i === 0 ? 0 : pi };
      const drop = Math.min(0.76 * (rig.hip[2] - rig.ankle), Math.max(0, rig.shoulder[2] - z + 0.16 * arm));
      const channels = {
        standing: 1 - lift,
        hipOffset: [0, 0, -lift * (drop + 0.025 * arm)],
        pitch: lift * (0.09 + (0.22 * drop) / rig.hip[2]),
        headPitch: lift * (0.07 + (0.17 * drop) / rig.hip[2]),
        headYaw: side * 0.07 * lift,
        blink: blink(u, i === 0 ? 0.16 : 0.76)
      };
      const rest = pose(rig, channels),
        hands = [null, null];
      const raised = point(rest.torso, [
        rig.shoulder[0] + 0.24 * arm,
        side * (rig.shoulder[1] + 0.15 * arm),
        rig.shoulder[2] + 0.49 * arm
      ]);
      const preload = between(rest.arms[handIndex].hand, raised, lift);
      hands[handIndex] = between(preload, local(root, common), meet);
      const body = pose(rig, { ...channels, hands });
      return entry(character, root, body, { palm: world(root, body.arms[handIndex].hand) });
    });
  }

  function seatedChannels(rig, lift, rock) {
    const scale = rig.height / 22,
      travel = rig.thigh + rig.shin;
    return {
      hipOffset: [0, 0, scale * mix(-5.1, -4.1, lift)],
      pitch: -0.13 * lift,
      roll: 0.045 * rock,
      headPitch: -0.1 - 0.08 * lift,
      feet: sides.map((side) => [
        rig.hip[0] + travel * (0.71 - 0.16 * lift + side * 0.043 * rock),
        side * (rig.hip[1] + scale * 0.42),
        rig.ankle + scale * (0.56 * lift + side * 0.21 * rock)
      ]),
      kneePoles: sides.map((side) => [0.7, 0.3 * side, 0.55])
    };
  }

  function cradle(u, mother, baby) {
    const m = mother.rig,
      b = baby.rig,
      arm = reach(m);
    const crouch = window(u, 0.025, 0.233, 0.818, 0.985);
    const lift = window(u, 0.255, 0.445, 0.625, 0.805);
    const grasp = window(u, 0.074, 0.23, 0.818, 0.955);
    const rocking = window(u, 0.435, 0.475, 0.617, 0.656);
    const rock = rocking * Math.sin((u - 0.45) * pi * 12);
    const deep = crouch * (1 - lift);
    const groundDistance = 0.301 * m.height,
      heldDistance = 0.202 * m.height;
    const mr = { x: -groundDistance * 0.45, y: 0, z: 0, heading: 0 };
    const br = {
      x: mr.x + mix(groundDistance, heldDistance, lift),
      y: mix(-4.46, -0.65, lift) + 0.85 * rock,
      z: lift * (0.718 * m.shoulder[2]) + 0.21 * rock,
      heading: 2.73 + 0.03 * lift + 0.045 * rock
    };

    const bc = seatedChannels(b, lift, rock);
    bc.headYaw = 0.17 * lift + 0.065 * rock;
    bc.blink = blink(u, 0.34) + blink(u, 0.74);
    const babyRest = pose(b, bc);
    // The baby's near hand folds toward its chest while the other reaches toward the parent.
    const bh = sides.map((side, i) => {
      const length = reach(b),
        goal = point(babyRest.torso, [
          b.shoulder[0] + length * (i === 0 ? 0.6 : 0.38),
          side * b.shoulder[1] * 0.72,
          b.shoulder[2] + length * (i === 0 ? 0.19 : -0.08)
        ]);
      return between(babyRest.arms[i].hand, goal, 0.22 + 0.7 * lift);
    });
    const bp = pose(b, { ...bc, hands: bh });
    const seat = world(br, studioRig.socket(baby, bp, 'seat'));
    const back = world(br, studioRig.socket(baby, bp, 'upperBack'));

    const mc = {
      // A low, side-on squat leaves room for the baby's head during the pickup.
      standing: 1 - deep,
      hipOffset: [-1.28 * deep - 0.28 * lift, 0.52 * rock, -0.819 * m.hip[2] * deep - 0.72 * lift],
      pitch: 0.67 * deep + 0.095 * lift,
      roll: 0.33 * deep + 0.05 * rock,
      headPitch: 0.22 - 0.92 * deep + 0.035 * rock,
      headYaw: -0.05 * deep + 0.04 * lift,
      headRoll: 0.05 * deep,
      kneePoles: [
        [1, -0.32, 0],
        [1, 0.32, 0]
      ],
      elbowPoles: [
        [-0.48, -1, -0.74],
        [-0.42, 1, -0.67]
      ],
      blink: blink(u, 0.13) + blink(u, 0.685)
    };
    const motherRest = pose(m, mc);
    // Move the held child as a single body when a short arm or wide shoulder would
    // otherwise stretch the hands away from both support points.
    if (lift > 0) {
      const delta = [0, 0, 0],
        anchors = [seat, back],
        shoulders = motherRest.arms.map((a) => world(mr, a.shoulder));
      for (let iteration = 0; iteration < 12; iteration++) {
        let fitted = true;
        anchors.forEach((anchor, i) => {
          const v = anchor.map((n, j) => n + delta[j] - shoulders[i][j]),
            d = Math.hypot(...v);
          if (d <= arm * 0.985) return;
          fitted = false;
          for (let j = 0; j < 3; j++) delta[j] -= v[j] * (1 - (arm * 0.985) / d);
        });
        if (fitted) break;
      }
      for (const [j, key] of ['x', 'y', 'z'].entries()) {
        const n = delta[j] * lift * grasp;
        br[key] += n;
        seat[j] += n;
        back[j] += n;
      }
    }
    const mh = [seat, back].map((anchor, i) => {
      const hand = between(motherRest.arms[i].hand, local(mr, anchor), grasp);
      // Route the hands around the child's sides while reaching and releasing.
      hand[1] += sides[i] * 0.17 * arm * Math.sin(pi * grasp);
      return hand;
    });
    const mp = pose(m, { ...mc, hands: mh });
    return [
      entry(mother, mr, mp, { seatHand: world(mr, mp.arms[0].hand), backHand: world(mr, mp.arms[1].hand) }),
      entry(baby, br, bp, { seat, back })
    ];
  }

  function peekaboo(u, mother, baby) {
    const m = mother.rig,
      b = baby.rig,
      arm = reach(m);
    const raised = window(u, 0.047, 0.246, 0.767, 0.963),
      reveal = ramp(u, 0.416, 0.526);
    const react = window(u, 0.475, 0.606, 0.828, 0.96);
    const clap = window(u, 0.605, 0.65, 0.672, 0.713) + window(u, 0.724, 0.768, 0.787, 0.831);
    const mr = { x: -0.137 * m.height, y: 0, z: 0, heading: 0 };
    const br = { x: 0.18 * m.height, y: 0, z: 0, heading: pi };
    const mc = {
      standing: 0,
      hipOffset: [-1.15, 0, -0.49 * m.hip[2] - 0.62 * raised],
      pitch: 0.44 + 0.09 * raised - 0.12 * raised * reveal,
      headPitch: 0.13 + 0.13 * raised * (1 - reveal) - 0.1 * raised * reveal,
      elbowPoles: [
        [-0.25, -1, -0.55],
        [-0.25, 1, -0.55]
      ],
      kneePoles: [
        [1, -0.32, 0],
        [1, 0.32, 0]
      ],
      blink: 0.9 * window(u, 0.258, 0.284, 0.399, 0.435) + blink(u, 0.863)
    };
    const motherRest = pose(m, mc);
    const eyes = ['rightEye', 'leftEye'].map((name) => studioRig.socket(mother, motherRest, name));
    const mh = sides.map((side, i) => {
      const open = point(motherRest.torso, [
        m.shoulder[0] + 0.36 * arm,
        side * (m.shoulder[1] + 0.62 * arm),
        m.shoulder[2] + 0.34 * arm
      ]);
      const gesture = between(eyes[i], open, reveal);
      gesture[2] += Math.sin(pi * reveal) * arm * 0.11;
      return between(motherRest.arms[i].hand, gesture, raised);
    });
    const mp = pose(m, { ...mc, hands: mh });
    const bc = seatedChannels(b, 0, 0);
    bc.headPitch = -0.18 - 0.13 * react + 0.063 * clap;
    bc.blink = blink(u, 0.155) + blink(u, 0.536);
    const babyRest = pose(b, bc);
    const bh = sides.map((side, i) => {
      const length = reach(b);
      const open = point(babyRest.torso, [
        b.shoulder[0] + 0.62 * length,
        side * (b.shoulder[1] + 0.1 * length),
        b.shoulder[2] + 0.18 * length
      ]);
      const together = point(babyRest.torso, [
        b.shoulder[0] + 0.65 * length,
        0,
        b.shoulder[2] + 0.12 * length
      ]);
      return between(babyRest.arms[i].hand, between(open, together, clap), react);
    });
    const bp = pose(b, { ...bc, hands: bh });
    return [
      entry(mother, mr, mp, {
        rightPalm: world(mr, mp.arms[0].hand),
        leftPalm: world(mr, mp.arms[1].hand),
        rightEye: world(mr, eyes[0]),
        leftEye: world(mr, eyes[1])
      }),
      entry(baby, br, bp, { rightPalm: world(br, bp.arms[0].hand), leftPalm: world(br, bp.arms[1].hand) })
    ];
  }

  return { highfive, cradle, peekaboo };
})();
