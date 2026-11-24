(() => {
  const W = PineWorld,
    M = PineMotion,
    wardrobe = PineWardrobe,
    $ = (id) => document.getElementById(id);
  const canvas = $('world-canvas'),
    ctx = canvas.getContext('2d', { alpha: false }),
    compositor = createSceneCompositor();
  const localKey = 'pinePixel.world.atlas.v1',
    rad = Math.PI / 180;
  const settings = {
    stairs: ['庭院建筑', 'guide', 'climb-stairs', '#e5e8db', '#b5c39b', '#879d7d', '#d9caa8'],
    street: ['现代街区', 'guide', 'guide-flag', '#d5dfcf', '#a5bd87', '#7c9b72', '#d7c6a3'],
    garden: ['现实自然', 'florist', 'look-around', '#e7e4cf', '#afc38e', '#729873', '#d7c9a3'],
    study: ['现代室内', 'programmer', 'desk-code', '#e6ddd0', '#d3b48d', '#a38f71', '#e4ceaa'],
    pavilion: ['园林', 'workshop_child', 'drink', '#e6e4d0', '#b4c397', '#819574', '#d9cba5'],
    airfield: ['现代交通', 'pilot', 'dock-check', '#d4e2dc', '#b0c59d', '#82977b', '#b3b9ae'],
    market: ['古代市井', 'scholar', 'unroll-map', '#ecdfc7', '#c4bd8e', '#a19770', '#d7c4a3'],
    grove: ['奇幻林地', 'mage', 'raise-crystal', '#ded9e9', '#a6b4a1', '#778c86', '#b7abb6'],
    station: ['科幻聚落', 'astronaut', 'scan-air', '#d7e0e4', '#a3b4b5', '#7b9299', '#bdc5bf']
  };
  settings.garden[1] = 'style_florist';
  const scenes = { ...W.scenes, work: { label: '我的工作场景', objects: [] } };
  settings.work = ['自建场景', 'guide', 'idle', '#e1e7da', '#b1c39d', '#899e7c', '#d6c9a9'];
  const customNames = {};
  function registerWork(id, title) {
    if (!/^work\.[a-zA-Z0-9._-]{1,144}$/.test(id) || typeof title !== 'string') return;
    customNames[id] = title.slice(0, 64);
    scenes[id] = { label: customNames[id], objects: [] };
    settings[id] = settings.work;
  }
  let sceneKey = 'street',
    plan,
    angle = 35,
    pitch = 24,
    zoom = 1,
    selected = 'rover',
    playing = false,
    t = 0,
    stamp = null,
    raf = 0;
  let selection = 0,
    activeSpace,
    memos = {},
    lastSample = '',
    actorDrawings = [],
    actorLayers = [];
  let pickFrame, picked = false;
  wardrobe.hydrate();
  try {
    const saved = JSON.parse(localStorage.getItem(localKey));
    if (saved?.version === 1) {
      memos = saved.books || {};
      for (const [id, name] of Object.entries(saved.names || {})) registerWork(id, name);
      if (Object.hasOwn(scenes, saved.active)) sceneKey = saved.active;
    }
  } catch {}
  const note = (s) => ($('world-status').textContent = s);
  function save(message) {
    try {
      memos[sceneKey] = wardrobe.scoreFile(plan.score);
      const latest = PineWorkspace.readLibrary(localKey);
      localStorage.setItem(localKey, JSON.stringify({ version: 1, active: sceneKey,
        books: { ...latest.books, [sceneKey]: memos[sceneKey] }, names: { ...latest.names, ...customNames } }));
      updateViewLink(true);
      note(message || '场景已保存到此浏览器');
    } catch (e) {
      note('未能保存到浏览器 · ' + e.message);
    }
  }
  function option(id, text) {
    return new Option(text, id);
  }
  for (const [id, s] of Object.entries(scenes)) $('world-scene').add(option(id, s.label));
  for (const [id, title] of Object.entries(W.families)) $('world-family').add(option(id, title));
  for (const [id, title] of Object.entries(W.realms)) $('world-realm').add(option(id, title));
  function baseScore(key) {
    const [, id, action] = settings[key],
      scene = scenes[key].objects.map((p) => ({ ...p }));
    if (key === 'study') return { ...M.presets.office, scene: structuredClone(M.presets.office.scene) };
    const actorPlacement = scenes[key].actorPlacement;
    return { version: 1, loop: true, scene, ...(actorPlacement ? { actorPlacement } : {}),
      steps: [{ action, actors: ['look_' + id], ...(key === 'stairs' ? {target: 0} : {}) }] };
  }
  function actors() {
    const select = $('world-actor');
    select.replaceChildren();
    for (const a of M.characters.values())
      if (!a.recipeId?.startsWith('look_workshop_') || a.id === a.recipeId || wardrobe.saved.has(a.id))
        select.add(option(a.id, a.label));
    const id = plan.score.steps[0]?.actors[0];
    if (id && !Array.from(select.options).some((o) => o.value === id))
      select.add(option(id, M.characters.get(id).label));
    select.value = id || 'look_guide';
    const actor = M.characters.get(select.value);
    const appearance = wardrobe.editorLink(actor, 'shape');
    $('edit-scene-actor').hidden = !appearance;
    if (appearance) $('edit-scene-actor').href = appearance;
    const clips = $('world-clip');
    clips.replaceChildren();
    for (const c of M.findActions(actor)) {
      let group = Array.from(clips.children).find((o) => o.label === c.group);
      if (!group) {
        group = document.createElement('optgroup');
        group.label = c.group;
        clips.append(group);
      }
      group.append(option(c.id, c.label));
    }
    clips.value = plan.score.steps[0]?.action || 'idle';
  }
  function editCast(chooseMotion) {
    const actor = M.characters.get($('world-actor').value);
    const previous = plan.score.steps[0],
      choice =
        M.actions.get(chooseMotion ? $('world-clip').value : previous?.action) || M.actions.get('idle');
    let clip = choice,
      cast = M.castFor(clip, actor);
    if (!cast || cast[0] !== actor) {
      clip = M.actions.get('idle');
      cast = [actor];
    }
    const step = { action: clip.id, actors: cast.map((a) => a.id) };
    if (clip.id === previous?.action)
      Object.assign(step, {
        seconds: previous.seconds,
        repeat: previous.repeat,
        ...(previous.target === undefined ? {} : { target: previous.target })
      });
    change({ ...plan.score, steps: [step, ...plan.score.steps.slice(1)] });
    actors();
  }
  $('world-actor').onchange = () => editCast(false);
  $('world-clip').onchange = () => editCast(true);
  const readEdit = () => ({ score: plan.score, selection, activeSpace });
  const edits = PineWorkspace.editHistory(readEdit, state => {
    plan = M.compile(state.score);
    selection = state.selection;
    activeSpace = state.activeSpace;
    play(false);
    t = 0;
    lastSample = '';
    $('world-detail').value = W.detailMode(plan.score.detail);
    actors();
    placements();
    draw();
    save('已恢复场景编辑');
  });
  function change(score, afterCompile, message) {
    const previous = readEdit();
    try {
      plan = M.compile(score);
    } catch (error) {
      note(error.message);
      placements();
      return;
    }
    edits.record(previous);
    if (afterCompile) afterCompile();
    t = 0;
    lastSample = '';
    placements();
    draw();
    save(message);
  }
  function loadScene(key, provided, requestedDetail, inside) {
    let next = provided;
    if (!next)
      try {
        if (memos[key]) next = wardrobe.readScoreFile(memos[key]);
      } catch {}
    plan = next || M.compile(baseScore(key));
    if (requestedDetail && requestedDetail !== W.detailMode(plan.score.detail))
      plan = M.compile({ ...plan.score, detail: requestedDetail });
    if (key === 'stairs' || sceneKey === 'stairs') {
      angle = key === 'stairs' ? -70 : 35;
      pitch = key === 'stairs' ? 16 : 24;
    }
    sceneKey = key;
    picked = false;
    activeSpace = W.items.get(plan.score.scene?.[inside]?.kind)?.interior ? inside : undefined;
    selection = activeSpace ?? 0;
    t = 0;
    lastSample = '';
    zoom = 1;
    $('world-scene').value = key;
    $('world-detail').value = W.detailMode(plan.score.detail);
    $('scene-title').textContent = scenes[key].label;
    $('scene-realm').textContent = settings[key][0];
    actors();
    placements();
    edits.clear();
    draw();
  }
  const labelAt = (list, i) => W.items.get(list[i].kind).label + ' · ' + (i + 1);
  function selectNode(i) {
    selection = i;
    picked = true;
    placements();
    $('scene-tree').querySelector('[data-node="' + (i ?? 'cast') + '"]')?.focus({ preventScroll: true });
  }
  function viewSpace(i) {
    activeSpace = i;
    if (i !== undefined) selection = i;
    placements();
    draw();
    updateViewLink();
  }
  function renderTree(list, castLabel) {
    const tree = $('scene-tree');
    tree.replaceChildren();
    const children = new Map();
    function add(parent, i) {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(i);
    }
    list.forEach((p, i) => add(p.parent, i));
    if (plan.score.steps.length) add(plan.score.actorPlacement?.parent, null);
    function branch(ul, parent) {
      for (const i of children.get(parent) || []) {
        const li = document.createElement('li'), row = document.createElement('div');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.node = i ?? 'cast';
        btn.textContent = i === null ? castLabel : labelAt(list, i);
        btn.setAttribute('aria-pressed', String(selection === i));
        btn.onclick = () => selectNode(i);
        row.className = 'tree-row';
        row.append(btn);
        li.append(row);
        if (i !== null && W.items.get(list[i].kind).interior) {
          const view = document.createElement('button');
          const deck = W.items.get(list[i].kind).interior.underside !== undefined;
          view.type = 'button';
          view.dataset.enter = i;
          view.textContent = activeSpace === i ? '返回全景' : deck ? '布置楼台' : '看内部';
          view.setAttribute('aria-label', activeSpace === i ? '返回全景' : deck ? '布置' + labelAt(list, i) : '查看' + labelAt(list, i) + '内部');
          view.onclick = () => {
            viewSpace(activeSpace === i ? undefined : i);
            tree.querySelector('[data-enter="' + i + '"]').focus({ preventScroll: true });
          };
          row.append(view);
          if (children.has(i)) {
            const group = document.createElement('ul');
            branch(group, i);
            li.append(group);
          }
        }
        ul.append(li);
      }
    }
    branch(tree, undefined);
  }
  function placements() {
    const list = plan.score.scene || [], el = $('placed');
    $('route-playback').hidden = !plan.duration;
    $('upper-landing').hidden = !plan.score.steps.some(s => M.actions.get(s.action).route === 'stairs');
    $('world-play').disabled = !plan.duration;
    const rooms = list.map((p, i) => W.items.get(p.kind).interior ? i : -1).filter(i => i >= 0);
    const hasSpaces = rooms.length > 0, hasCast = plan.score.steps.length > 0;
    if (selection !== null || !hasCast) selection = Math.max(0, Math.min(selection ?? 0, list.length - 1));
    const isCast = selection === null;
    const ids = [...new Set(plan.score.steps.flatMap(step => step.actors))];
    const castLabel = ids.length === 1 ? '演员 · ' + M.characters.get(ids[0]).label : '演员组 · ' + ids.length + ' 人';
    const item = isCast ? plan.score.actorPlacement || { x: 0, y: 0, z: 0, heading: 0 } : list[selection];
    $('picked-name').textContent = !picked || !item ? '点选物件 · 拖动环视' :
      isCast ? '已选演员' : '已选 · ' + W.items.get(item.kind).label;
    el.replaceChildren();
    for (let i = 0; i < list.length; i++) el.add(option(String(i), labelAt(list, i)));
    if (!list.length) el.add(option('', '场景为空'));
    el.value = isCast || !list.length ? '' : String(selection);
    $('placement-count').textContent = '(' + list.length + ')';
    $('tree-count').textContent = list.length;
    $('placement-title').textContent = hasSpaces ? '场景层级' : '场景中的物件';
    $('scene-tree').hidden = !hasSpaces;
    $('scene-tree').parentElement.classList.toggle('with-spaces', hasSpaces);
    if (hasSpaces) renderTree(list, castLabel);
    $('flat-picker').hidden = hasSpaces;
    $('selection-name').hidden = !hasSpaces && !isCast;
    $('selection-name').textContent = isCast ? castLabel : item ? labelAt(list, selection) : '';
    $('gather-interior').hidden = !W.items.get(item?.kind)?.interior;
    $('select-cast').disabled = !hasCast;
    $('select-cast').setAttribute('aria-pressed', String(isCast));
    const view = $('world-space');
    $('view-space-field').hidden = !hasSpaces;
    view.replaceChildren(option('', '全景'));
    const owner = $('place-parent');
    owner.replaceChildren(option('', '场景根层'));
    for (const i of rooms) {
      view.add(option(String(i), labelAt(list, i) + (W.items.get(list[i].kind).interior.underside !== undefined ? ' 楼面' : ' 内部')));
      if (isCast || !W.ancestors(list, i).includes(selection)) owner.add(option(String(i), labelAt(list, i)));
    }
    view.value = activeSpace ?? '';
    owner.value = item?.parent ?? '';
    $('parent-field').hidden = !item || owner.length < 2;
    $('place-item').textContent = activeSpace === undefined ? '放入场景' : '放入' + W.items.get(list[activeSpace].kind).label;
    const hint = $('coordinate-note');
    const target = isCast ? plan.score.steps[0]?.target : undefined;
    hint.hidden = !hasSpaces && !isCast;
    hint.textContent = target !== undefined ? '首段动作跟随「' + labelAt(list, target) + '」。这里设置自由动作的起点。' :
      item?.parent !== undefined ? '坐标相对「' + labelAt(list, item.parent) + '」，高度 0 是地板表面。' :
      isCast && hasSpaces ? '高度相对场景地面。人物走进有底座的建筑，会自动站到地板上。' :
      (item?.kind && W.items.get(item.kind).interior ? '移动或旋转建筑，里面的人物和物件会一起移动。' : '坐标相对整个场景。');
    for (const k of ['x', 'y', 'z', 'heading']) {
      const field = $('place-' + k);
      field.disabled = !item;
      field.value = item ? Number((k === 'heading' ? item[k] / rad : item[k]).toFixed(2)) : '';
    }
    $('remove-place').disabled = !item || isCast;
    $('remove-place').hidden = isCast;
  }
  $('placed').onchange = () => {
    selectNode(Number($('placed').value));
  };
  $('select-cast').onclick = () => { PineWorkspace.openTool('placements', true); selectNode(null); };
  $('more-items').onclick = () => { PineWorkspace.openTool('object-library'); $('world-query').focus(); };
  $('world-space').onchange = e => viewSpace(e.target.value === '' ? undefined : Number(e.target.value));
  $('place-parent').onchange = e => change(W.reparent(plan.score, selection,
    e.target.value === '' ? undefined : Number(e.target.value)));
  $('gather-interior').onclick = () => {
    const next = W.collectContents(plan.score, selection);
    if (next === plan.score) note('建筑范围内的人物和物件已经归位');
    else change(next);
  };
  for (const k of ['x', 'y', 'z', 'heading']) {
    const f = $('place-' + k);
    f.onchange = () => {
      if (!f.reportValidity() || !Number.isFinite(f.valueAsNumber)) {
        placements();
        return;
      }
      const values = { [k]: f.valueAsNumber * (k === 'heading' ? rad : 1) };
      if (selection === null) change({ ...plan.score, actorPlacement: { ...plan.score.actorPlacement, ...values } });
      else {
        const scene = [...plan.score.scene];
        scene[selection] = { ...scene[selection], ...values };
        change({ ...plan.score, scene });
      }
    };
  }
  $('remove-place').onclick = () => {
    const removed = selection, parent = plan.score.scene[removed].parent, label = W.items.get(plan.score.scene[removed].kind).label;
    change(W.removePlacement(plan.score, removed), () => {
      if (activeSpace === removed) activeSpace = parent;
      if (activeSpace > removed) activeSpace--;
    }, '已移除「' + label + '」，可撤销。');
  };
  $('place-item').onclick = () => {
    const scene = [...(plan.score.scene || [])];
    if (scene.length >= 64) {
      note('场景已达到 64 件物件的容量');
      return;
    }
    const n = scene.length;
    scene.push(activeSpace === undefined ? W.place(selected, 15 + 6 * (n % 4), -12 + 8 * (n % 5)) :
      { ...W.place(selected), parent: activeSpace });
    change({ ...plan.score, scene }, () => { selection = n; picked = true; }, '已放入「' + W.items.get(selected).label + '」，可以调整位置。');
    PineWorkspace.openTool('placements', true);
  };
  function camera(yaw, tilt) {
    const a = Math.cos(yaw),
      b = Math.sin(yaw),
      c = Math.cos(tilt),
      s = Math.sin(tilt);
    return (x, y, z) => [-b * x + a * y, (a * x + b * y) * s - c * z, (a * x + b * y) * c + s * z];
  }
  function corners(d) {
    const { body: b, model: m } = d,
      q = m.bounds || [0, 0, 0, b.nx, b.ny, b.nz],
      c = Math.cos(d.heading),
      s = Math.sin(d.heading),
      pts = [];
    for (const x of [q[0], q[3]])
      for (const y of [q[1], q[4]])
        for (const z of [q[2], q[5]]) {
          const dx = (x - b.nx * 0.5) / b.density,
            dy = (y - b.ny * 0.5) / b.density;
          pts.push([d.x + c * dx - s * dy, d.y + s * dx + c * dy, d.z + z / b.density]);
        }
    return pts;
  }
  function tile(canvas, id, direction = 37) {
    const b = W.geometry(id, 'standard'),
      ctx = canvas.getContext('2d'),
      w = canvas.width,
      h = canvas.height;
    const yaw = direction * rad,
      tilt = 24 * rad,
      P = camera(yaw, tilt),
      d = { ...b, x: 0, y: 0, z: 0, heading: 0 };
    const pts = corners(d).map((p) => P(...p)),
      xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    const loX = Math.min(...xs),
      hiX = Math.max(...xs),
      loY = Math.min(...ys),
      hiY = Math.max(...ys);
    const scale = Math.min((w - 6) / (hiX - loX), (h - 6) / (hiY - loY));
    ctx.clearRect(0, 0, w, h);
    b.body.draw(
      ctx,
      b.model,
      w / 2 - (scale * (loX + hiX)) / 2,
      h / 2 - (scale * (loY + hiY)) / 2,
      yaw,
      tilt,
      scale
    );
  }
  function selectItem(id) {
    selected = id;
    const d = W.items.get(id);
    $('item-name').textContent = d.label;
    $('item-spec').textContent = W.families[d.family] + ' · ' + d.realms.map((k) => W.realms[k]).join(' / ');
    tile($('item-preview'), id, 24);
    for (const b of $('world-grid').children)
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.dataset.kind === id));
  }
  const thumbs = new IntersectionObserver(
    (changes) => {
      for (const { isIntersecting, target } of changes)
        if (isIntersecting) {
          tile(target, target.dataset.kind);
          thumbs.unobserve(target);
        }
    },
    { root: $('world-grid'), rootMargin: '80px' }
  );
  const synonyms = {
    rover: '汽车 越野车 吉普',
    aircraft: '飞机 航空 飞行器',
    bicycle: '单车 骑行 自行车',
    laptop: '电脑 打字 笔电',
    notebook: '本子 笔记 日记',
    daisies: '花 草 花卉',
    poppies: '花 草 花卉',
    grass: '草地',
    lamp: '灯具 书桌',
    shuttle: '飞船 太空',
    pavilion: '古建筑 凉亭',
    stairs: '楼梯 台阶 上楼 下楼 楼层 平台 露台 二层 二楼'
  };
  function catalog() {
    thumbs.disconnect();
    const grid = $('world-grid');
    grid.replaceChildren();
    const family = $('world-family').value,
      realm = $('world-realm').value,
      q = $('world-query').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const found = [...W.items.values()].filter(
      (d) =>
        (!family || d.family === family) &&
        (!realm || d.realms.includes(realm)) &&
        q.every((w) =>
          [d.label, d.id, W.families[d.family], synonyms[d.id], ...d.realms.map((k) => W.realms[k])]
            .join(' ')
            .toLowerCase()
            .includes(w)
        )
    );
    for (const d of found) {
      const b = document.createElement('button'),
        im = document.createElement('canvas'),
        label = document.createElement('span');
      b.type = 'button';
      b.dataset.kind = im.dataset.kind = d.id;
      im.width = 112;
      im.height = 76;
      im.setAttribute('aria-hidden', 'true');
      label.textContent = d.label;
      b.append(im, label);
      grid.append(b);
      thumbs.observe(im);
      b.onclick = () => selectItem(d.id);
    }
    $('catalog-count').textContent = found.length + ' 件';
    $('clear-objects').hidden = !(family || realm || q.length);
    document.querySelector('.item-inspect').hidden = !found.length;
    if (found.length) {
      selectItem(found.some((d) => d.id === selected) ? selected : found[0].id);
    } else {
      const p = document.createElement('p');
      p.textContent = '没有匹配的物件。可以清除筛选，重新选择。';
      grid.append(p);
    }
    $('place-item').disabled = !found.length;
  }
  function draw() {
    if (!plan) return;
    const w = Math.max(2, Math.round(canvas.clientWidth)),
      h = Math.max(2, Math.round(canvas.clientHeight)),
      detail = W.detailMode(plan.score.detail);
    const ratio = Math.min(detail === 'figure' ? (window.devicePixelRatio || 1) : 1, 2, Math.sqrt(1600000 / (w * h)));
    const width = Math.max(2, Math.round(w * ratio)), height = Math.max(2, Math.round(h * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const yaw = angle * rad,
      elev = pitch * rad,
      project = camera(yaw, elev),
      cue = plan.locate(t);
    const key = [cue?.index, Math.floor(t * 10)].join('/');
    if (key !== lastSample) {
      lastSample = key;
      actorDrawings = plan.sample(t).map((e) => {
        const a = M.characters.get(e.character),
          model = a.body.makePose(e.pose);
        return { ...e, actor: a, body: a.body, model };
      });
      actorLayers = actorDrawings.flatMap(p => placeSliceLayers(p,
        detail === 'figure' && M.figureLayers(p.actor, p.pose, p.model))).map(p => ({ ...p, pickId: null }));
    }
    const placements = plan.scenery(t);
    const openRooms = new Set(W.ancestors(plan.score.scene || [], activeSpace).map(i => plan.worldScene[i]));
    const objects = placements.flatMap(p => {
      const index = plan.worldScene.indexOf(p), pickId = index < 0 ? undefined : index;
      const parts = openRooms.has(p) ? W.cutaway(p.kind, detail, yaw - p.heading) : [W.geometry(p.kind, detail)];
      return parts.map(part => ({ ...p, ...part, pickId }));
    });
    const framing = placements.map(p => ({ ...p, ...W.geometry(p.kind, 'standard') }));
    const all = [...framing, ...actorDrawings];
    // Include the ground footprint during framing so placed items remain visible from every azimuth.
    const route = cue?.clip.route;
    const points = (route ? framing : all).flatMap(corners);
    if (route === 'stairs') {
      const p = plan.routeAt(t);
      points.push(...W.stairs.routeBounds(p, actorDrawings[0].actor.rig.height));
    }
    const bounds = (axis, def, fn) => fn(def, ...points.map((p) => p[axis]));
    const x0 = bounds(0, -15, Math.min) - 7,
      x1 = bounds(0, 15, Math.max) + 7,
      y0 = bounds(1, -15, Math.min) - 7,
      y1 = bounds(1, 15, Math.max) + 7;
    const floor = [
        [x0, y0, 0],
        [x1, y0, 0],
        [x1, y1, 0],
        [x0, y1, 0]
      ],
      proj = [...points, ...floor, ...floor.map(([x, y]) => [x, y, -6])].map((p) => project(...p));
    const xx = proj.map((p) => p[0]),
      yy = proj.map((p) => p[1]),
      left = Math.min(...xx),
      right = Math.max(...xx),
      top = Math.min(...yy),
      bottom = Math.max(...yy);
    const scale = Math.min((w - 26) / (right - left), (h - 57) / (bottom - top)) * zoom,
      ox = w * 0.5 - (left + right) * 0.5 * scale,
      oy = h * 0.52 - (top + bottom) * 0.5 * scale;
    function screen(x, y, z = 0) {
      const p = project(x, y, z);
      return [ox + p[0] * scale, oy + p[1] * scale];
    }
    function poly(path, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      path.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](...screen(...p)));
      ctx.closePath();
      ctx.fill();
    }
    const [, , , sky, turf, edge, path] = settings[sceneKey];
    ctx.setTransform(width / w, 0, 0, height / h, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const wash = ctx.createLinearGradient(0, 0, w * 0.12, h);
    wash.addColorStop(0, sky);
    wash.addColorStop(1, '#f0efe1');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    const sides = floor
      .map((p, i) => [p, floor[(i + 1) % 4]])
      .sort((a, b) => project(...a[0])[2] + project(...a[1])[2] - project(...b[0])[2] - project(...b[1])[2]);
    for (const [a, b] of sides) poly([a, b, [b[0], b[1], -5], [a[0], a[1], -5]], edge);
    poly(floor, turf);
    const strip = Math.min((x1 - x0) * 0.13, 12);
    poly(
      [
        [-strip, y0, 0],
        [strip, y0, 0],
        [strip, y1, 0],
        [-strip, y1, 0]
      ],
      path
    );
    const indoor = sceneKey === 'study' || sceneKey === 'station' || sceneKey === 'airfield';
    if (indoor) {
      ctx.strokeStyle = '#51665825';
      ctx.lineWidth = 1;
      for (let x = Math.ceil(x0 / 12) * 12; x < x1; x += 12) {
        ctx.beginPath();
        ctx.moveTo(...screen(x, y0));
        ctx.lineTo(...screen(x, y1));
        ctx.stroke();
      }
      for (let y = Math.ceil(y0 / 12) * 12; y < y1; y += 12) {
        ctx.beginPath();
        ctx.moveTo(...screen(x0, y));
        ctx.lineTo(...screen(x1, y));
        ctx.stroke();
      }
    } else {
      let seed = 127;
      const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < 200; i++) {
        const x = x0 + random() * (x1 - x0),
          y = y0 + random() * (y1 - y0);
        const [px, py] = screen(x, y);
        ctx.fillStyle = i % 3 ? '#5d80552e' : '#fff6c546';
        ctx.fillRect(Math.round(px), Math.round(py), Math.max(1, scale * 1.5), Math.max(1, scale * 0.6));
      }
    }
    for (const d of all) {
      const p = screen(d.x, d.y),
        width = Math.max(1, (d.model.bounds[3] - d.model.bounds[0]) / d.body.density);
      const length = Math.max(1, (d.model.bounds[4] - d.model.bounds[1]) / d.body.density);
      ctx.fillStyle = '#344d412b';
      ctx.beginPath();
      ctx.ellipse(
        ...p,
        Math.max(width, length) * scale * 0.39,
        Math.min(width, length) * scale * 0.19,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    const view = {
      yaw, elevation: elev, floorZ: 0, x: ox * width / w, y: oy * height / h,
      scaleX: scale * width / w, scaleY: scale * height / h
    };
    compositor.draw(ctx, view, objects, actorLayers);
    pickFrame = { view, objects, actorLayers, cue, detail };
    $('world-angle').value = angle;
    $('angle-label').textContent = Math.round(angle) + '°';
    const scrub = $('world-scrub');
    if (!$('route-playback').hidden) {
      scrub.value = plan.duration ? t / plan.duration : 0;
      $('route-time').textContent = t.toFixed(1) + ' / ' + plan.duration.toFixed(1) + ' 秒';
    }
  }
  function orient(a) {
    angle = ((((a + 180) % 360) + 360) % 360) - 180;
    draw();
  }
  function magnify(v) {
    zoom = Math.max(0.5, Math.min(3, zoom * v));
    draw();
  }
  $('world-angle').oninput = () => orient(Number($('world-angle').value));
  $('zoom-in').onclick = () => magnify(1.15);
  $('zoom-out').onclick = () => magnify(1 / 1.15);
  $('world-reset-view').onclick = () => {
    angle = sceneKey === 'stairs' ? -70 : 35;
    pitch = sceneKey === 'stairs' ? 16 : 24;
    zoom = 1;
    draw();
  };
  let drag = null;
  canvas.onpointerdown = (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, angle, pitch, moved: false };
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = (e) => {
    if (drag?.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    pitch = Math.max(8, Math.min(66, drag.pitch + 0.22 * dy));
    orient(drag.angle + 0.47 * dx);
  };
  canvas.onpointerup = e => {
    if (drag?.id !== e.pointerId) return;
    const tap = !drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5;
    drag = null;
    if (!tap || !pickFrame) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * canvas.width / rect.width, y = (e.clientY - rect.top) * canvas.height / rect.height;
    const { view, objects, actorLayers, cue, detail } = pickFrame;
    const parts = [...objects];
    // A bound fixture is drawn with the actor. Its matching stationary cells still belong to the placed object.
    if (cue?.clip.station && cue.step.target !== undefined) {
      const fixture = plan.worldScene[cue.step.target];
      parts.push({ ...fixture, ...W.geometry(fixture.kind, detail), pickId: cue.step.target });
    }
    const hit = pickSceneVolume(view, x, y, parts.concat(actorLayers));
    if (hit === undefined) return;
    selectNode(hit);
    PineWorkspace.openTool(hit === null ? 'scene-cast' : 'placements', true);
  };
  canvas.onpointercancel = canvas.onlostpointercapture = () => { drag = null; };
  canvas.onkeydown = (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (plan.duration) play(!playing);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') magnify(e.key === 'ArrowUp' ? 1.1 : 1 / 1.1);
    else orient(angle + (e.key === 'ArrowRight' ? 10 : -10));
  };
  function tick(time) {
    if (!playing) return;
    if (stamp !== null && plan.duration) {
      t += Math.min(0.15, (time - stamp) / 1000);
      if (t >= plan.duration) {
        if (plan.score.loop) t %= plan.duration;
        else {
          t = plan.duration;
          play(false);
        }
      }
    }
    stamp = time;
    if (lastSample !== [plan.locate(t)?.index, Math.floor(t * 10)].join('/')) draw();
    if (playing) raf = requestAnimationFrame(tick);
  }
  function play(value) {
    playing = value;
    stamp = null;
    cancelAnimationFrame(raf);
    $('world-play').textContent = playing ? '暂停' : '播放动作';
    $('world-play').setAttribute('aria-pressed', String(playing));
    if (playing) {
      if (t >= plan.duration) t = 0;
      raf = requestAnimationFrame(tick);
    }
  }
  $('world-play').onclick = () => play(!playing);
  $('world-scrub').oninput = e => {
    play(false);
    t = Number(e.target.value) * plan.duration;
    lastSample = '';
    draw();
  };
  $('upper-landing').onclick = () => {
    const cue = plan.locate(t);
    const index = cue?.clip.route === 'stairs' ? cue.index : plan.score.steps.findIndex(s => M.actions.get(s.action).route === 'stairs');
    if (index < 0) return;
    play(false);
    t = plan.starts[index] + ((cue?.index === index ? cue.iteration : 0) + 0.5) * plan.score.steps[index].seconds;
    lastSample = '';
    draw();
  };
  $('world-query').oninput = catalog;
  $('world-family').onchange = catalog;
  $('world-realm').onchange = catalog;
  $('clear-objects').onclick = () => {
    for (const key of ['world-query', 'world-family', 'world-realm']) $(key).value = '';
    catalog();
    $('world-query').focus();
  };
  function updateViewLink(saved = false) {
    if (!['http:', 'https:'].includes(location.protocol)) return;
    const url = new URL(location.href);
    if (saved && (url.hash === '#current' || url.hash.startsWith('#score='))) {
      url.hash = '';
      url.searchParams.set('scene', sceneKey);
    }
    if (url.searchParams.has('scene') || activeSpace !== undefined) url.searchParams.set('scene', sceneKey);
    if (activeSpace === undefined) url.searchParams.delete('inside');
    else url.searchParams.set('inside', String(activeSpace));
    if (url.searchParams.has('detail') || url.hash) url.searchParams.set('detail', W.detailMode(plan.score.detail));
    history.replaceState(history.state, '', url);
  }
  $('world-detail').onchange = () => {
    edits.record(readEdit());
    plan = M.compile({ ...plan.score, detail: $('world-detail').value });
    lastSample = '';
    draw();
    save();
  };
  $('world-scene').onchange = () => {
    play(false);
    loadScene($('world-scene').value);
    save();
  };
  for (const id of ['world-studio', 'world-three']) $(id).onclick = () => {
    const link = $(id), url = new URL(link.href);
    url.searchParams.set('scene', sceneKey);
    link.href = url;
    if (id === 'world-three') wardrobe.preview(link, plan.score, t, playing);
    else wardrobe.handoff(link, plan.score);
  };
  $('world-export').onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(wardrobe.scoreFile(plan.score), null, 2)], { type: 'application/json' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pine-world-' + sceneKey + '.json';
    a.click();
    note('已导出「' + scenes[sceneKey].label + '」');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('open-world-file').onclick = () => $('world-import').click();
  $('world-import').onchange = async (e) => {
    try {
      const f = e.target.files[0];
      if (f) {
        const imported = wardrobe.readScoreFile(await f.text(), true);
        play(false);
        const previous = readEdit();
        loadScene(sceneKey, imported);
        edits.record(previous);
        save('已导入「' + f.name + '」，可撤销。');
      }
    } catch (err) {
      note(err.message);
    }
    e.target.value = '';
  };
  let incoming = null;
  try {
    if (location.hash && wardrobe.snapshot()) incoming = wardrobe.readScoreFile(wardrobe.snapshot());
  } catch (e) {
    note(e.message);
  }
  const query = new URLSearchParams(location.search);
  const priorView = PineWorkspace.resumed;
  if (!incoming && Object.hasOwn(scenes, priorView?.sceneKey)) sceneKey = priorView.sceneKey;
  if (Object.hasOwn(scenes, query.get('scene'))) sceneKey = query.get('scene');
  $('inventory-count').textContent =
    W.items.size +
    ' 件物件 · ' +
    Object.keys(W.families).length +
    ' 个分类 · ' +
    Object.keys(W.realms).length +
    ' 种时代与世界';
  const detail = query.get('detail');
  const inside = query.get('inside');
  if (incoming && query.get('destination') === 'work' && !Object.hasOwn(scenes, query.get('scene'))) {
    const key = query.get('book') || '';
    const work = /^[a-zA-Z0-9._-]{1,144}$/.test(key) ? 'work.' + key : 'work';
    if (!Object.hasOwn(scenes, work)) {
      registerWork(work, (query.get('title') || '我的编排') + ' · 场景');
      $('world-scene').add(option(work, scenes[work].label));
    }
    if (incoming.score.scene === undefined) {
      const base = memos[work] ? work : sceneKey;
      const previous = memos[base] ? wardrobe.readScoreFile(memos[base]).score : baseScore(base);
      incoming = M.compile({ ...incoming.score, scene: previous.scene || [],
        ...(previous.actorPlacement && !incoming.score.actorPlacement ? { actorPlacement: previous.actorPlacement } : {}) });
    }
    sceneKey = work;
  }
  loadScene(sceneKey, incoming, detail === 'figure' || detail === 'standard' ? detail : undefined,
    inside !== null && /^\d+$/.test(inside) ? Number(inside) : undefined);
  if (incoming && query.get('destination') === 'work') save('已载入动作编排，可以布置场景。');
  if (activeSpace !== undefined) PineWorkspace.openTool('placements');
  const phase = Number(query.get('phase'));
  if (phase > 0 && phase <= 1) { t = phase * plan.duration; lastSample = ''; draw(); }
  if (query.get('play') === '1') play(true);
  if (!incoming && priorView?.sceneKey === sceneKey && [priorView.angle, priorView.pitch, priorView.zoom, priorView.t].every(Number.isFinite)) {
    ({ angle, pitch, zoom, selection, picked } = priorView);
    activeSpace = W.items.get(plan.score.scene?.[priorView.activeSpace]?.kind)?.interior ? priorView.activeSpace : undefined;
    t = Math.max(0, Math.min(plan.duration, priorView.t));
    lastSample = '';
    if (priorView.filters) {
      $('world-query').value = priorView.filters.query;
      $('world-family').value = priorView.filters.family;
      $('world-realm').value = priorView.filters.realm;
      if (W.items.has(priorView.selected)) selected = priorView.selected;
    }
    placements();
    draw();
  }
  PineWorkspace.rememberView(() => ({ sceneKey, activeSpace, selection, selected, picked, angle, pitch, zoom, t,
    filters: { query: $('world-query').value, family: $('world-family').value, realm: $('world-realm').value } }));
  catalog();
  new ResizeObserver(draw).observe(canvas);
})();
