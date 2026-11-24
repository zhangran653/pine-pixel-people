// Public authoring and playback API. Samplers depend on the playhead, never on DOM or elapsed frame count.
const studioLibrary = (() => {
  const characters = new Map(),
    actions = new Map(),
    rigs = studioRig.profiles;
  const isId = (s) => typeof s === 'string' && /^[a-z][a-z0-9_-]*$/.test(s);
  function createCharacter({ id, label, rig, art, density = 2, tags, box, sockets }) {
    if (!isId(id) || !label || typeof art?.paint !== 'function' || !art.materials)
      throw new Error('人物定义无效');
    if (
      typeof art.materials !== 'object' ||
      Array.isArray(art.materials) ||
      !Object.values(art.materials).every(
        (color) => typeof color === 'string' && /^[0-9a-f]{6}$/i.test(color)
      )
    )
      throw new Error('人物调色板需要六位 RGB 十六进制色值');
    if (
      !Number.isSafeInteger(density) ||
      density < 1 ||
      !Array.isArray(tags) ||
      !tags.length ||
      !tags.every(isId)
    )
      throw new Error('请提供正整数密度与有效的角色标签');
    const skeleton = studioRig.validate(typeof rig === 'string' ? rigs[rig] : rig);
    const bounds = box || [
      Math.ceil(skeleton.height * 1.28),
      Math.ceil(skeleton.height * 0.96),
      Math.ceil(skeleton.height * 1.05)
    ];
    if (!Array.isArray(bounds) || bounds.length !== 3 || !bounds.every((x) => Number.isFinite(x) && x > 0))
      throw new Error('切片采样盒无效');
    const item = {
      id,
      label,
      rig: skeleton,
      sockets: studioRig.bindSockets(skeleton, sockets),
      tags: [...tags],
      body: createSliceActor(art, density, studioProps, bounds)
    };
    return item;
  }
  function registerCharacter(definition) {
    if (characters.has(definition.id)) throw new Error('人物 ID 重复');
    const item = createCharacter(definition);
    characters.set(item.id, item);
    return item;
  }
  function registerAction({
    id,
    label,
    group = '日常',
    seconds,
    roles,
    sample,
    keywords = '',
    station,
    previewTurn = false
  }) {
    if (
      !isId(id) ||
      actions.has(id) ||
      !label ||
      typeof group !== 'string' ||
      typeof keywords !== 'string' ||
      typeof previewTurn !== 'boolean' ||
      typeof sample !== 'function' ||
      !Number.isFinite(seconds) ||
      seconds <= 0
    )
      throw new Error('动作定义无效或 ID 重复');
    if (
      !Array.isArray(roles) ||
      roles.length < 1 ||
      roles.length > 2 ||
      roles.some((r) => !Array.isArray(r) || !r.length || !r.every(isId))
    )
      throw new Error('动作需要一或两个含有效标签的角色槽位');
    const clip = {
      id,
      label,
      group,
      seconds,
      roles,
      sample,
      keywords,
      previewTurn,
      ...(station ? { station } : {})
    };
    actions.set(id, clip);
    return clip;
  }
  const everyone = ['adult', 'child', 'toddler', 'baby'],
    walkers = ['adult', 'child', 'toddler'],
    devices = ['adult', 'child'];
  for (const [id, label, group, seconds, roles, keywords] of [
    ['idle', '自然待机', '日常', 3.2, [everyone], '站立 站着 站姿 呼吸 放松'],
    ['walk', '散步', '移动', 4, [walkers], '走路 行走 步行 漫步 前进'],
    ['run', '跑步', '移动', 2.8, [walkers], '奔跑 跑动 快跑 运动'],
    ['jump', '屈膝跳跃', '移动', 1.7, [walkers], '起跳 落地 跳起来'],
    ['crawl', '手膝爬行', '移动', 3.6, [['baby', 'toddler']], '宝宝爬 爬动 学爬'],
    ['sit', '坐着休息', '日常', 2.8, [everyone], '坐姿 坐凳 椅子'],
    ['sitdown', '坐下再起身', '日常', 3.8, [walkers], '起立 落座 坐椅子'],
    ['sway', '轻晃', '日常', 3.4, [everyone], '摇摆 摇晃 轻微晃动'],
    ['wave', '挥手', '日常', 2.2, [everyone], '招手 打招呼 你好 告别 再见'],
    ['clap', '拍手', '日常', 2.4, [everyone], '鼓掌 欢迎 拍巴掌'],
    ['drink', '喝水', '日常', 3.6, [walkers], '饮水 补水 水瓶 水壶'],
    ['phone', '看手机', '现代生活', 4.0, [devices], '用手机 玩手机 刷手机 刷屏 看消息'],
    ['type', '电脑打字', '现代生活', 4.2, [devices], '用电脑 键盘 笔记本 办公 输入'],
    ['highfive', '相互击掌', '双人', 2.8, [walkers, walkers], '拍掌 庆祝 双人互动'],
    ['cradle', '抱起轻摇', '亲子', 5.8, [['adult'], ['baby']], '抱宝宝 安抚 哄睡 亲子互动'],
    ['peekaboo', '躲猫猫', '亲子', 4.0, [['adult'], ['baby']], '捉迷藏 遮眼 逗宝宝 亲子互动']
  ])
    registerAction({ id, label, group, seconds, roles, keywords, sample: soloClips[id] || duetClips[id] });
  for (const clip of [
    ...gestureActions,
    ...movementActions,
    ...dailyActions,
    ...socialActions,
    ...worldActions
  ])
    registerAction(clip);
  function findActions(person, { group = '', query = '', eitherRole = false } = {}) {
    const words = query.normalize('NFKC').trim().toLowerCase().split(/\s+/).filter(Boolean);
    return [...actions.values()].filter((clip) => {
      if (!accepts(clip, 0, person) && !(eitherRole && accepts(clip, 1, person))) return false;
      if (group && clip.group !== group) return false;
      const text = [clip.label, clip.group, clip.id, ...clip.id.split('-'), clip.keywords]
        .join(' ')
        .normalize('NFKC')
        .toLowerCase();
      return words.every((word) => text.includes(word));
    });
  }
  function castFor(clip, actor, preferred = null) {
    if (!actor) return null;
    if (clip.roles.length === 1) return accepts(clip, 0, actor) ? [actor] : null;
    const partners = [
      preferred,
      characters.get(actor.tags.includes('adult') ? 'child' : 'mother'),
      ...characters.values()
    ];
    for (const partner of partners) {
      if (!partner || partner === actor) continue;
      if (accepts(clip, 0, actor) && accepts(clip, 1, partner)) return [actor, partner];
      if (accepts(clip, 1, actor) && accepts(clip, 0, partner)) return [partner, actor];
    }
    return null;
  }
  function accepts(clip, slot, person) {
    return !!person && clip.roles[slot]?.some((tag) => person.tags.includes(tag));
  }
  function faceLayers(actor, pose, model, bodyDensity = 0) {
    const cut = studioRig.socket(actor, pose, 'mouth')[2] - actor.rig.height * 0.068;
    const density = Math.max(3, Math.min(10, Math.round(300 / actor.rig.height)));
    return actor.body.faceLayers?.(pose, model, cut, density, bodyDensity) || null;
  }
  function figureLayers(actor, pose, model) {
    const bodyDensity = Math.max(3, Math.min(5, Math.round(180 / actor.rig.height)));
    return faceLayers(actor, pose, model, bodyDensity);
  }
  const built = (action, actors, repeat = 1) => ({
    action,
    actors,
    seconds: actions.get(action).seconds,
    repeat
  });
  const presets = {
    family: {
      version: 1,
      loop: true,
      steps: [
        built('cradle', ['mother', 'baby']),
        built('peekaboo', ['mother', 'baby']),
        built('crawl', ['baby']),
        built('clap', ['baby'])
      ]
    },
    play: {
      version: 1,
      loop: true,
      steps: [
        built('run', ['child']),
        built('jump', ['child'], 2),
        built('highfive', ['child', 'mother']),
        built('walk', ['toddler']),
        built('jump', ['toddler'])
      ]
    },
    work: {
      version: 1,
      loop: true,
      steps: [
        built('phone', ['surveyor']),
        built('type', ['surveyor']),
        built('drink', ['surveyor']),
        built('wave', ['surveyor'])
      ]
    }
  };
  const presetLabels = { family: '亲子时光', play: '放学活动', work: '营地办公' };
  for (const [id, label, steps] of [
    [
      'morning',
      '清晨起居',
      [
        ['wake-stretch', 'mother'],
        ['brush-teeth', 'mother'],
        ['comb', 'mother'],
        ['eat', 'mother'],
        ['check-watch', 'mother']
      ]
    ],
    [
      'study',
      '书桌时光',
      [
        ['read', 'child'],
        ['write', 'child'],
        ['raise-hand', 'child'],
        ['think', 'child'],
        ['type', 'child'],
        ['doze', 'child']
      ]
    ],
    [
      'house',
      '家务午后',
      [
        ['carry-box', 'surveyor'],
        ['sweep', 'surveyor'],
        ['stir', 'surveyor'],
        ['water-plant', 'surveyor'],
        ['recline', 'surveyor']
      ]
    ],
    [
      'training',
      '操场热身',
      [
        ['march', 'child'],
        ['side-stretch', 'child'],
        ['lunge', 'child'],
        ['jumping-jack', 'child'],
        ['balance', 'child'],
        ['bounce-ball', 'child']
      ]
    ],
    [
      'neighbors',
      '邻里见面',
      [
        ['handshake', 'mother', 'surveyor'],
        ['chat', 'mother', 'surveyor'],
        ['handover', 'surveyor', 'mother'],
        ['bow', 'mother']
      ]
    ],
    [
      'nursery',
      '陪宝宝玩',
      [
        ['storytime', 'mother', 'baby'],
        ['follow-rattle', 'mother', 'baby'],
        ['rattle', 'baby'],
        ['tummy-time', 'baby'],
        ['roll-ball', 'mother', 'baby'],
        ['toy-drum', 'baby']
      ]
    ],
    [
      'music',
      '周末排练',
      [
        ['guitar', 'surveyor'],
        ['dance-step', 'child'],
        ['mirror-game', 'child', 'mother'],
        ['cheer', 'child']
      ]
    ],
    [
      'outdoors',
      '一起出门',
      [
        ['hold-hands', 'mother', 'toddler'],
        ['look-around', 'toddler'],
        ['pivot', 'mother'],
        ['photograph', 'mother'],
        ['skip', 'child']
      ]
    ]
  ]) {
    presetLabels[id] = label;
    presets[id] = { version: 1, loop: true, steps: steps.map(([action, ...ids]) => built(action, ids)) };
  }
  for (const [id, label, scene, steps] of [
    [
      'office',
      '开发者的工作日',
      'study',
      [
        ['desk-code', 'programmer'],
        ['brief-team', 'manager'],
        ['coffee-break', 'developer']
      ]
    ],
    [
      'shop',
      '市集开张',
      'market',
      [
        ['scan-code', 'cashier'],
        ['serve-mug', 'barista'],
        ['check-order', 'vendor']
      ]
    ],
    [
      'trip',
      '导游带队出发',
      'street',
      [
        ['guide-flag', 'guide'],
        ['point-map', 'guide'],
        ['drink', 'guide']
      ]
    ],
    [
      'manuscript',
      '古镇书案',
      'market',
      [
        ['desk-calligraphy', 'scribe'],
        ['unroll-map', 'scholar'],
        ['fan-cool', 'poet']
      ]
    ],
    [
      'moon',
      '月下星图',
      'grove',
      [
        ['raise-crystal', 'mage'],
        ['read-stars', 'oracle'],
        ['light-ward', 'ranger']
      ]
    ],
    [
      'orbit',
      '星港巡检',
      'station',
      [
        ['scan-air', 'astronaut'],
        ['aim-beacon', 'engineer'],
        ['compare-readings', 'navigator']
      ]
    ],
    [
      'airstrip',
      '机场值勤',
      'airfield',
      [
        ['dock-check', 'pilot'],
        ['brief-team', 'pilot']
      ]
    ]
  ]) {
    presetLabels[id] = label;
    presets[id] = {
      version: 1,
      loop: true,
      scene: PineWorld.scenes[scene].objects.map((p) => ({ ...p })),
      steps: steps.map(([action, person]) => built(action, ['look_' + person]))
    };
  }
  // A desk already in the scene becomes the work surface during the first cue.
  presets.office.scene = presets.office.scene.filter((p) => p.kind === 'desk' || p.kind === 'lamp');
  presets.office.steps[0].target = 0;
  function validateStep(step, index = 0, cast = characters) {
    const fail = (msg) => {
      throw new Error('第 ' + (index + 1) + ' 段 · ' + msg);
    };
    if (!step || typeof step !== 'object' || Array.isArray(step)) fail('需要动作对象');
    if (Object.keys(step).some((k) => !['action', 'actors', 'seconds', 'repeat', 'target'].includes(k)))
      fail('含有未知字段');
    const clip = actions.get(step.action);
    if (!clip) fail('无法识别动作 ' + String(step.action));
    if (!Array.isArray(step.actors) || step.actors.length !== clip.roles.length) fail('角色人数与动作不符');
    step.actors.forEach((id, i) => {
      if (!accepts(clip, i, cast.get(id))) fail('第 ' + (i + 1) + ' 个角色不适用此动作');
    });
    const seconds = step.seconds === undefined ? clip.seconds : step.seconds,
      repeat = step.repeat === undefined ? 1 : step.repeat;
    if (!Number.isFinite(seconds) || seconds <= 0) fail('单次时长须为正数');
    if (!Number.isSafeInteger(repeat) || repeat < 1 || !Number.isFinite(seconds * repeat))
      fail('重复次数或总时长无效');
    if (step.target !== undefined && (!clip.station || !Number.isSafeInteger(step.target) || step.target < 0))
      fail('此动作无法绑定指定物件');
    return {
      action: clip.id,
      actors: [...step.actors],
      seconds,
      repeat,
      ...(step.target === undefined ? {} : { target: step.target })
    };
  }
  function compile(input, cast = characters) {
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input);
      } catch {
        throw new Error('无法解析 JSON');
      }
    }
    if (!input || input.version !== 1 || !Array.isArray(input.steps))
      throw new Error('需要 version 为 1 且包含 steps 数组的编排');
    if (Object.keys(input).some((k) => !['version', 'loop', 'steps', 'scene', 'detail'].includes(k)))
      throw new Error('编排含有未知字段');
    if (input.loop !== undefined && typeof input.loop !== 'boolean') throw new Error('loop 须为布尔值');
    const score = {
        version: 1,
        ...(input.detail === undefined ? {} : { detail: PineWorld.detailMode(input.detail) }),
        ...(input.scene === undefined ? {} : { scene: PineWorld.normalize(input.scene) }),
        loop: input.loop ?? false,
        steps: input.steps.map((step, index) => validateStep(step, index, cast))
      },
      starts = [];
    for (const step of score.steps)
      if (step.target !== undefined && score.scene?.[step.target]?.kind !== actions.get(step.action).station)
        throw Error('动作绑定的场景物件缺失或类型不符');
    let duration = 0;
    for (const step of score.steps) {
      starts.push(duration);
      const next = duration + step.seconds * step.repeat;
      if (!Number.isFinite(next) || next <= duration) throw new Error('总时长超出可表示范围');
      duration = next;
    }
    function locate(t) {
      if (!starts.length) return null;
      const at = Math.min(duration, Math.max(0, Number.isFinite(t) ? t : 0));
      let index = 0,
        end = starts.length;
      while (index + 1 < end) {
        const mid = Math.floor((index + end) / 2);
        if (at < starts[mid]) end = mid;
        else index = mid;
      }
      const step = score.steps[index],
        cycles = (at - starts[index]) / step.seconds,
        nearest = Math.round(cycles);
      // Subtracting a nonzero start can round an exact repeat boundary into the preceding iteration.
      const progress = at === starts[index] + nearest * step.seconds ? nearest : cycles;
      const iteration = Math.min(step.repeat - 1, Math.floor(progress));
      const u = at === duration ? 1 : studioRig.clamp(progress - iteration);
      return { index, iteration, u, step, clip: actions.get(step.action) };
    }
    function sample(t) {
      const cue = locate(t);
      if (!cue) return [];
      const entries = cue.clip.sample(cue.u, ...cue.step.actors.map((id) => cast.get(id)));
      if (cue.step.target === undefined) return entries;
      // A placed station supplies the origin and heading for the whole gesture.
      const e = entries[0],
        destination = score.scene[cue.step.target];
      const fixture = e.pose.props.find((item) => item.kind === cue.clip.station),
        f = fixture.frame;
      const angle = destination.heading - Math.atan2(f[4], f[0]),
        c = Math.cos(angle),
        s = Math.sin(angle);
      e.x = destination.x - c * f[3] + s * f[7];
      e.y = destination.y - s * f[3] - c * f[7];
      e.z = destination.z - f[11];
      e.heading = angle;
      if (cue.clip.station === 'lamp') e.pose.props = e.pose.props.filter((p) => p.kind !== 'desk');
      return entries;
    }
    function scenery(t) {
      const target = locate(t)?.step.target,
        scene = score.scene || [];
      return target === undefined ? scene : scene.filter((_, index) => index !== target);
    }
    return { score, starts, duration, locate, sample, scenery };
  }
  return {
    version: 1,
    rig: studioRig,
    characters,
    actions,
    faceLayers,
    figureLayers,
    createCharacter,
    registerCharacter,
    registerAction,
    accepts,
    findActions,
    castFor,
    keyframedGesture: activityMotion.gesture,
    presetLabels,
    compile,
    validateStep,
    presets
  };
})();
globalThis.PineMotion = studioLibrary;
