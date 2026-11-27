// Public authoring and playback API. Samplers depend on the playhead, never on DOM or elapsed frame count.
const studioLibrary = (() => {
  const characters = new Map(),
    actions = new Map(),
    rigs = studioRig.profiles;
  const isId = (s) => typeof s === 'string' && /^[a-z][a-z0-9_-]*$/.test(s);
  const domains = {
    life:['生活起居','日常','洗漱与仪容','穿衣与整理','等候与休息','姿势与休息','茶点与厨房','家务','家务与收纳','现代生活','手机与通勤','家具与照明'],
    expression:['表情与沟通','神情与反应','交流与示意','手势与情绪'],
    movement:['步态与运动','移动','姿态转换','步态与移动','体能与平衡','舞步与律动','运动与舞蹈'],
    work:['学习与工作','学习与工作','阅读与课堂','办公与协作','学习与书桌','桌面操作','文件与服务','教学与导览','零售与服务'],
    arts:['艺术与手艺','音乐与游戏','音乐与节拍','舞台与摄影','书画与传统工艺','手工与纺织'],
    outdoors:['户外与探索','园艺与观察','户外与调查'],
    together:['互动与亲子','婴幼儿','亲子','双人','双人配合','双人交接','亲子游戏'],
    imagined:['奇幻与科幻','科幻与探索','奇幻表演','科幻作业','奇幻仪式']
  };
  const domainLabels=Object.fromEntries(Object.entries(domains).map(([id,[name]])=>[id,name]));
  const domainByGroup=new Map(Object.entries(domains).flatMap(([id,[, ...groups]])=>groups.map(group=>[group,id])));
  const lengthBands={brief:[0,2],short:[2,3],medium:[3,5],long:[5,Infinity]};
  function createCharacter({ id, label, rig, art, density = 2, tags, box, sockets, anatomy }) {
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
      ...(anatomy ? {anatomy} : {}),
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
    route,
    items, seatSlots, wear, fixtures,
    transition = false,
    previewTurn = false
  }) {
    if (
      !isId(id) ||
      actions.has(id) ||
      !label ||
      typeof group !== 'string' ||
      typeof keywords !== 'string' ||
      typeof previewTurn !== 'boolean' || typeof transition !== 'boolean' ||
      typeof sample !== 'function' ||
      !Number.isFinite(seconds) ||
      seconds <= 0
    )
      throw new Error('动作定义无效或 ID 重复');
    if (seconds > 10) throw Error('单个动作最长为 10 秒，可在编排中连接或重复片段');
    if (station!==undefined && !PineWorld.items.has(station)) throw Error('动作的交互设施需要来自物件库');
    if (route !== undefined && (station || !PineWorld.items.has(route))) throw new Error('行走路线需要已注册的场景设施');
    if (
      !Array.isArray(roles) ||
      roles.length < 1 ||
      roles.length > 2 ||
      roles.some((r) => !Array.isArray(r) || !r.length || !r.every(isId))
    )
      throw new Error('动作需要一或两个含有效标签的角色槽位');
    const resources=motionSupplies.define(id,items,seatSlots,roles,wear,fixtures);
    const clip = {
      id,
      label,
      group,
      domain:domainByGroup.get(group) || '',
      seconds,
      roles, resources, targetKind:station || route || resources.fixtures[0]?.kind,
      sample:resources.wear.length ? (u,...cast)=>sample(u,...cast).map((part,i)=>{
        const rule=resources.wear[i];
        return rule?{...part,pose:{...part.pose,motionWear:rule}}:part;
      }) : sample,
      keywords,
      previewTurn,
      transition,
      ...(route ? { route } : {}),
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
    ...worldActions, ...everydayShortClips, ...objectShortClips, ...workshopShortClips, ...shortFootwork, ...shortDuets
  ])
    registerAction(clip);
  function findActions(person, { domain='', group='', query='', duration='', people='', ending='', eitherRole=false } = {}) {
    const words = query.normalize('NFKC').trim().toLowerCase().split(/\s+/).filter(Boolean);
    const band=lengthBands[duration];
    return [...actions.values()].filter((clip) => {
      if (person && !accepts(clip, 0, person) && !(eitherRole && accepts(clip, 1, person))) return false;
      if (domain && clip.domain!==domain) return false;
      if (group && clip.group !== group) return false;
      if (band && (clip.seconds<band[0] || clip.seconds>=band[1])) return false;
      if (people==='solo' && clip.roles.length!==1 || people==='pair' && clip.roles.length!==2) return false;
      if (ending==='transition' && !clip.transition || ending==='return' && clip.transition) return false;
      if (!words.length) return true;
      const text = [clip.label, clip.group, domainLabels[clip.domain], clip.id, ...clip.id.split('-'), clip.keywords, ...clip.resources.items.map(id=>PineWorld.items.get(id).label),
        (clip.resources.seatSlots.length?'折叠凳 椅子':''), ...clip.resources.fixtures.map(p=>PineWorld.items.get(p.kind).label),PineWorld.items.get(clip.route)?.label]
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
  function defaultActor(clip) {
    return [...characters.values()].find(p=>accepts(clip,0,p));
  }
  function performer(actor,pose) {
    return pose?.motionWear && globalThis.PineLooks ? PineLooks.motionOutfit(actor,pose.motionWear).actor : actor;
  }
  function prepareAction(id,{actor,partner,scene,actorPlacement}={}) {
    const clip=typeof id==='string'?actions.get(id):id;
    if (!clip) throw Error('找不到这个动作');
    const member=p=>typeof p==='string'?characters.get(p):p;
    const selected=actor===undefined?defaultActor(clip):member(actor);
    const cast=castFor(clip,selected,member(partner));
    if (!cast) throw Error('人物库里没有适合这段动作的演员搭配');
    const step={action:clip.id,actors:cast.map(p=>p.id),seconds:clip.seconds,repeat:1};
    const targetKind=clip.targetKind;
    if (scene?.length && targetKind) {
      const candidates=scene.map((p,index)=>({p,index})).filter(({p})=>p.kind===targetKind && p.parent===actorPlacement?.parent);
      if (candidates.length) {
        const distance=p=>Math.hypot((p.x||0)-(actorPlacement?.x||0),(p.y||0)-(actorPlacement?.y||0),(p.z||0)-(actorPlacement?.z||0));
        step.target=candidates.reduce((a,b)=>distance(a.p)<=distance(b.p)?a:b).index;
      }
    }
    const outfit=clip.resources.wear.flatMap((rule,i)=>{
      const piece=rule && globalThis.PineLooks?.motionOutfit(cast[i],rule).wear;
      return piece?[{actor:cast[i].id,...piece}]:[];
    });
    return {step,cast,items:motionSupplies.inventory(clip,cast),wear:outfit};
  }
  function stageFor(clip,cast) {
    return [...(clip.route?[PineWorld.place(clip.route)]:[]),...motionSupplies.stage(clip,cast[0])];
  }
  function accepts(clip, slot, person) {
    return !!person && clip.roles[slot]?.some((tag) => person.tags.includes(tag));
  }
  function faceLayers(actor, pose, model, bodyDensity = 0, close = false) {
    const cut = studioRig.socket(actor, pose, 'mouth')[2] - actor.rig.height * 0.068;
    const density = Math.max(3, Math.min(10, Math.round(300 / actor.rig.height)));
    return actor.body.faceLayers?.(pose, model, cut, density, bodyDensity, close) || null;
  }
  function closePortraitLayers(actor, pose, model) {
    return faceLayers(actor, pose, model, 0, true);
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
      ...(PineWorld.scenes[scene].actorPlacement ? { actorPlacement: { ...PineWorld.scenes[scene].actorPlacement } } : {}),
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
    if (step.target !== undefined && (!clip.targetKind || !Number.isSafeInteger(step.target) || step.target < 0))
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
    if (Object.keys(input).some((k) => !['version', 'loop', 'steps', 'scene', 'detail', 'actorPlacement'].includes(k)))
      throw new Error('编排含有未知字段');
    if (input.loop !== undefined && typeof input.loop !== 'boolean') throw new Error('loop 须为布尔值');
    const layout = input.scene !== undefined || input.actorPlacement !== undefined
      ? PineWorld.layout(input.scene === undefined ? [] : input.scene, input.actorPlacement) : { worldScene: [] };
    const { worldScene, castFrame, floorAt } = layout;
    const origin = { x: 0, y: 0, z: 0, heading: 0 };
    const score = {
        version: 1,
        ...(input.detail === undefined ? {} : { detail: PineWorld.detailMode(input.detail) }),
        ...(input.scene === undefined ? {} : { scene: layout.scene }),
        ...(castFrame ? { actorPlacement: layout.actorPlacement } : {}),
        loop: input.loop ?? false,
        steps: input.steps.map((step, index) => validateStep(step, index, cast))
      },
      starts = [];
    const routes = new Map();
    for (const step of score.steps) {
      const clip = actions.get(step.action);
      if (step.target !== undefined && score.scene?.[step.target]?.kind !== clip.targetKind)
        throw Error('动作绑定的场景物件缺失或类型不符');
      if (clip.route && !routes.has(clip.route)) {
        const placed = worldScene.find(p => p.kind === clip.route);
        const base = castFrame || origin;
        const obj = placed || { kind: clip.route, ...base, z: floorAt ? floorAt(base.x, base.y, base.z) : base.z };
        routes.set(clip.route, { obj, scenery: placed ? worldScene : PineWorld.withScenery(worldScene, obj) });
      }
    }
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
    function routeFor(cue) {
      return cue?.clip.route ? worldScene[cue.step.target] || routes.get(cue.clip.route).obj : undefined;
    }
    const setFrames=new Map();
    function fixtureFrame(cue) {
      if (cue.clip.route) return routeFor(cue);
      if (cue.step.target===undefined) return castFrame || origin;
      if (cue.clip.station) {
        const local=cue.clip.sample(0,...cue.step.actors.map(id=>cast.get(id)))[0];
        const world=sample(starts[cue.index])[0];
        const heading=world.heading-local.heading;
        const offset=studioRig.world({...origin,heading},[local.x,local.y,local.z]);
        return {x:world.x-offset[0],y:world.y-offset[1],z:world.z-offset[2],heading};
      }
      if (!setFrames.has(cue.index)) {
        const anchor=motionSupplies.stage(cue.clip,cast.get(cue.step.actors[0]))[0];
        const target=worldScene[cue.step.target], heading=target.heading-anchor.heading;
        const offset=studioRig.world({...origin,heading},[anchor.x,anchor.y,anchor.z]);
        setFrames.set(cue.index,{x:target.x-offset[0],y:target.y-offset[1],z:target.z-offset[2],heading});
      }
      return setFrames.get(cue.index);
    }
    function sample(t) {
      const cue = locate(t);
      if (!cue) return [];
      const entries = cue.clip.sample(cue.u, ...cue.step.actors.map((id) => cast.get(id)));
      let frame = castFrame;
      if (cue.clip.route) {
        frame = routeFor(cue);
      } else if (cue.step.target !== undefined && !cue.clip.station) {
        frame=fixtureFrame(cue);
      } else if (cue.step.target !== undefined) {
        const first = entries[0], destination = worldScene[cue.step.target];
        const fixture = first.pose.props.find(p => p.kind === cue.clip.station).frame;
        const origin = studioRig.world(first, [fixture[3], fixture[7], fixture[11]]);
        const heading = destination.heading - first.heading - Math.atan2(fixture[4], fixture[0]);
        const c = Math.cos(heading), s = Math.sin(heading);
        frame = { x: destination.x - c * origin[0] + s * origin[1],
          y: destination.y - s * origin[0] - c * origin[1], z: destination.z - origin[2], heading };
      }
      let surfaces;
      if (floorAt && entries.length && !cue.clip.route) {
        const base = frame || origin, support = cue.step.target === undefined ? layout.actorFloorAt : floorAt;
        surfaces = entries.map(e => {
          const [x, y] = studioRig.world(base, [e.x, e.y, 0]);
          const root = { x, y, z: 0, heading: base.heading + e.heading };
          if (!e.pose.feet?.length) return [support(x, y, base.z)];
          return e.pose.feet.map(foot => {
            const [fx, fy] = studioRig.world(root, foot);
            return support(fx, fy, base.z);
          });
        });
        if (cue.step.target === undefined) {
          // The planted shoe sets the common base even while running or carrying another actor.
          const feet = entries[0].pose.feet, levels = surfaces[0];
          const level = feet?.length === 2 && Math.abs(feet[0][2] - feet[1][2]) > 1e-6
            ? levels[feet[0][2] < feet[1][2] ? 0 : 1] : Math.min(...levels);
          if (Math.abs(level - base.z) > 1e-8) frame = { ...base, z: level };
        }
        if (!frame && surfaces.some(levels => levels.some(z => z > 0))) frame = origin;
      }
      if (!frame) return entries;
      return entries.map((e, i) => {
        const [x, y, z] = studioRig.world(frame, [e.x, e.y, e.z]);
        const result = { ...e, x, y, z, heading: e.heading + frame.heading };
        if (surfaces?.[i].some(h => h > frame.z + 1e-8))
          result.pose = studioRig.clearFootSurfaces(cast.get(e.character).rig, e.pose, surfaces[i], z, frame.z);
        if (e.contacts) result.contacts = Object.fromEntries(Object.entries(e.contacts)
          .map(([name, point]) => [name, studioRig.world(frame, point)]));
        if (i === 0 && cue.step.target !== undefined && cue.clip.station === 'lamp')
          result.pose = { ...result.pose, props: result.pose.props.filter(p => p.kind !== 'desk') };
        return result;
      });
    }
    const cueSets=new Map();
    function scenery(t) {
      const cue = locate(t);
      if (cue?.clip.route && !cue.clip.resources.fixtures.length) return routes.get(cue.clip.route).scenery;
      const animatedTarget=cue?.clip.station?cue.step.target:undefined;
      const scene=cue?.clip.route?routes.get(cue.clip.route).scenery:layout.scenery?layout.scenery(animatedTarget):worldScene;
      if (!cue) return scene;
      if (cueSets.has(cue.index)) return cueSets.get(cue.index);
      let result=scene;
      if (cue.clip.station==='desk' && animatedTarget!==undefined) {
        const e=sample(starts[cue.index])[0], seat=e.pose.props.find(p=>p.kind==='chair');
        if (seat) {
          const [x,y,z]=studioRig.world(e,[seat.frame[3],seat.frame[7],seat.frame[11]]);
          const nearby=scene.find(p=>p.kind==='chair' && Math.hypot(p.x-x,p.y-y)<5 && Math.abs(p.z-z)<1);
          if (nearby) result=PineWorld.withoutScenery(result,nearby);
        }
      }
      if (cue.clip.resources.fixtures.length) {
        const actor=cast.get(cue.step.actors[0]),base=fixtureFrame(cue);
        const fixtures=motionSupplies.stage(cue.clip,actor);
        for (const [i,p] of fixtures.entries()) {
          if (i===0 && cue.step.target!==undefined && !cue.clip.station && !cue.clip.route) continue;
          const [x,y,z]=studioRig.world(base,[p.x,p.y,p.z]);
          const floor=cue.step.target===undefined?(layout.actorFloorAt?.(x,y,base.z) ?? base.z):base.z;
          const item={...p,x,y,z:z-base.z+floor,heading:p.heading+base.heading};
          if (!result.some(o=>o.kind===item.kind && Math.hypot(o.x-item.x,o.y-item.y,o.z-item.z)<.5))
            result=PineWorld.withScenery(result,item);
        }
      }
      cueSets.set(cue.index,result);
      return cueSets.get(cue.index);
    }
    return { score, worldScene, castFrame, starts, duration, locate, sample, scenery, routeAt: t => routeFor(locate(t)) };
  }
  return {
    version: 1,
    rig: studioRig,
    characters,
    actions,
    domainLabels,
    faceLayers,
    closePortraitLayers,
    figureLayers,
    createCharacter,
    registerCharacter,
    registerAction,
    prepareAction, defaultActor, performer, stageFor,
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
