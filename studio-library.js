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
  function registerAction({ id, label, group = '日常', seconds, roles, sample }) {
    if (
      !isId(id) ||
      actions.has(id) ||
      !label ||
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
    const clip = { id, label, group, seconds, roles, sample };
    actions.set(id, clip);
    return clip;
  }
  const boxes = { adult: [64, 48, 52], child: [48, 40, 36], toddler: [40, 34, 31], baby: [36, 28, 24] };
  for (const [id, label, kind, art, density] of [
    ['hiker', '红帽徒步者', 'adult', hikerArt, 1],
    ['surveyor', '山野测绘员', 'adult', surveyorArt, 2],
    ['mother', '妈妈', 'adult', familyArt.mother, 2],
    ['child', '学龄儿童', 'child', familyArt.child, 2],
    ['toddler', '学步幼儿', 'toddler', familyArt.toddler, 2],
    ['baby', '小宝宝', 'baby', familyArt.baby, 2]
  ])
    registerCharacter({
      id,
      label,
      rig: kind,
      art,
      density,
      tags: [...new Set([kind, id])],
      box: boxes[kind]
    });
  const everyone = ['adult', 'child', 'toddler', 'baby'],
    walkers = ['adult', 'child', 'toddler'],
    devices = ['adult', 'child'];
  for (const [id, label, group, seconds, roles] of [
    ['idle', '自然待机', '日常', 3.2, [everyone]],
    ['walk', '散步', '移动', 4, [walkers]],
    ['run', '跑步', '移动', 2.8, [walkers]],
    ['jump', '屈膝跳跃', '移动', 1.7, [walkers]],
    ['crawl', '手膝爬行', '移动', 3.6, [['baby', 'toddler']]],
    ['sit', '坐着休息', '日常', 2.8, [everyone]],
    ['sitdown', '坐下再起身', '日常', 3.8, [walkers]],
    ['sway', '轻晃', '日常', 3.4, [everyone]],
    ['wave', '挥手', '日常', 2.2, [everyone]],
    ['clap', '拍手', '日常', 2.4, [everyone]],
    ['drink', '喝水', '日常', 3.6, [walkers]],
    ['phone', '看手机', '现代生活', 4.0, [devices]],
    ['type', '电脑打字', '现代生活', 4.2, [devices]],
    ['highfive', '相互击掌', '双人', 2.8, [walkers, walkers]],
    ['cradle', '抱起轻摇', '亲子', 5.8, [['mother'], ['baby']]],
    ['peekaboo', '躲猫猫', '亲子', 4.0, [['mother'], ['baby']]]
  ])
    registerAction({ id, label, group, seconds, roles, sample: soloClips[id] || duetClips[id] });
  function accepts(clip, slot, person) {
    return !!person && clip.roles[slot]?.some((tag) => person.tags.includes(tag));
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
  function validateStep(step, index = 0, cast = characters) {
    const fail = (msg) => {
      throw new Error('第 ' + (index + 1) + ' 段 · ' + msg);
    };
    if (!step || typeof step !== 'object' || Array.isArray(step)) fail('需要动作对象');
    if (Object.keys(step).some((k) => !['action', 'actors', 'seconds', 'repeat'].includes(k)))
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
    return { action: clip.id, actors: [...step.actors], seconds, repeat };
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
    if (Object.keys(input).some((k) => !['version', 'loop', 'steps'].includes(k)))
      throw new Error('编排含有未知字段');
    if (input.loop !== undefined && typeof input.loop !== 'boolean') throw new Error('loop 须为布尔值');
    const score = { version: 1, loop: input.loop ?? false, steps: input.steps.map((step, index) => validateStep(step, index, cast)) },
      starts = [];
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
      return cue.clip.sample(cue.u, ...cue.step.actors.map((id) => cast.get(id)));
    }
    return { score, starts, duration, locate, sample };
  }
  return {
    version: 1,
    rig: studioRig,
    characters,
    actions,
    createCharacter,
    registerCharacter,
    registerAction,
    accepts,
    compile,
    validateStep,
    presets
  };
})();
globalThis.PineMotion = studioLibrary;
