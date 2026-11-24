(() => {
  const W = PineWorld,
    M = PineMotion,
    wardrobe = PineWardrobe,
    $ = (id) => document.getElementById(id);
  const canvas = $('world-canvas'),
    ctx = canvas.getContext('2d', { alpha: false });
  const localKey = 'pinePixel.world.atlas.v1',
    rad = Math.PI / 180;
  const settings = {
    street: ['现代街区', 'guide', 'guide-flag', '#d5dfcf', '#a5bd87', '#7c9b72', '#d7c6a3'],
    garden: ['现实自然', 'florist', 'look-around', '#e7e4cf', '#afc38e', '#729873', '#d7c9a3'],
    study: ['现代室内', 'programmer', 'desk-code', '#e6ddd0', '#d3b48d', '#a38f71', '#e4ceaa'],
    airfield: ['现代交通', 'pilot', 'dock-check', '#d4e2dc', '#b0c59d', '#82977b', '#b3b9ae'],
    market: ['古代市井', 'scholar', 'unroll-map', '#ecdfc7', '#c4bd8e', '#a19770', '#d7c4a3'],
    grove: ['奇幻林地', 'mage', 'raise-crystal', '#ded9e9', '#a6b4a1', '#778c86', '#b7abb6'],
    station: ['科幻聚落', 'astronaut', 'scan-air', '#d7e0e4', '#a3b4b5', '#7b9299', '#bdc5bf']
  };
  settings.garden[1] = 'style_florist';
  const demos = Object.keys(W.scenes);
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
    memos = {},
    lastSample = '',
    actorDrawings = [];
  wardrobe.hydrate();
  try {
    const saved = JSON.parse(localStorage.getItem(localKey));
    if (saved?.version === 1) {
      memos = saved.books || {};
      if (demos.includes(saved.active)) sceneKey = saved.active;
    }
  } catch {}
  const note = (s) => ($('world-status').textContent = s);
  function save() {
    try {
      memos[sceneKey] = wardrobe.scoreFile(plan.score);
      localStorage.setItem(localKey, JSON.stringify({ version: 1, active: sceneKey, books: memos }));
      note('已保存到此浏览器');
    } catch (e) {
      note('未能保存到浏览器 · ' + e.message);
    }
  }
  function option(id, text) {
    return new Option(text, id);
  }
  for (const [id, s] of Object.entries(W.scenes)) $('world-scene').add(option(id, s.label));
  for (const [id, title] of Object.entries(W.families)) $('world-family').add(option(id, title));
  for (const [id, title] of Object.entries(W.realms)) $('world-realm').add(option(id, title));
  function baseScore(key) {
    const [, id, action] = settings[key],
      scene = W.scenes[key].objects.map((p) => ({ ...p }));
    if (key === 'study') return { ...M.presets.office, scene: structuredClone(M.presets.office.scene) };
    return { version: 1, loop: true, scene, steps: [{ action, actors: ['look_' + id] }] };
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
  function change(score) {
    plan = M.compile(score);
    t = 0;
    lastSample = '';
    placements();
    draw();
    save();
  }
  function loadScene(key, provided) {
    let next = provided;
    if (!next)
      try {
        if (memos[key]) next = wardrobe.readScoreFile(memos[key]);
      } catch {}
    plan = next || M.compile(baseScore(key));
    sceneKey = key;
    selection = 0;
    t = 0;
    lastSample = '';
    zoom = 1;
    $('world-scene').value = key;
    $('scene-title').textContent = W.scenes[key].label;
    $('scene-realm').textContent = settings[key][0];
    actors();
    placements();
    draw();
  }
  function placements() {
    const list = plan.score.scene || [],
      el = $('placed');
    el.replaceChildren();
    selection = Math.max(0, Math.min(selection, list.length - 1));
    for (const [i, p] of list.entries())
      el.add(option(String(i), W.items.get(p.kind).label + ' · ' + (i + 1)));
    if (!list.length) el.add(option('', '场景为空'));
    el.value = list.length ? String(selection) : '';
    $('placement-count').textContent = '(' + list.length + ')';
    const item = list[selection];
    for (const k of ['x', 'y', 'z', 'heading']) {
      const field = $('place-' + k);
      field.disabled = !item;
      field.value = item ? Number((k === 'heading' ? item[k] / rad : item[k]).toFixed(2)) : '';
    }
    $('remove-place').disabled = !item;
  }
  $('placed').onchange = () => {
    selection = Number($('placed').value);
    placements();
  };
  for (const k of ['x', 'y', 'z', 'heading']) {
    const f = $('place-' + k);
    f.onchange = () => {
      if (!f.reportValidity() || !Number.isFinite(f.valueAsNumber)) {
        placements();
        return;
      }
      const list = [...plan.score.scene];
      list[selection] = { ...list[selection], [k]: f.valueAsNumber * (k === 'heading' ? rad : 1) };
      change({ ...plan.score, scene: list });
    };
  }
  $('remove-place').onclick = () => {
    const scene = plan.score.scene.filter((_, i) => i !== selection),
      steps = plan.score.steps.map((step) => {
        const n = { ...step };
        if (n.target === selection) delete n.target;
        else if (n.target > selection) n.target--;
        return n;
      });
    change({ ...plan.score, scene, steps });
  };
  $('place-item').onclick = () => {
    const scene = [...(plan.score.scene || [])];
    if (scene.length >= 64) {
      note('场景已达到 64 件物件的容量');
      return;
    }
    const n = scene.length;
    scene.push(W.place(selected, 15 + 6 * (n % 4), -12 + 8 * (n % 5)));
    selection = n;
    change({ ...plan.score, scene });
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
    const b = W.geometry(id),
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
    pavilion: '古建筑 凉亭'
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
    if (found.length) {
      selectItem(found.some((d) => d.id === selected) ? selected : found[0].id);
    } else {
      const p = document.createElement('p');
      p.textContent = '没有匹配的物件';
      grid.append(p);
    }
    $('place-item').disabled = !found.length;
  }
  function draw() {
    if (!plan) return;
    const w = Math.max(2, Math.round(canvas.clientWidth)),
      h = Math.max(2, Math.round(canvas.clientHeight));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
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
        return { ...e, body: a.body, model };
      });
    }
    const objects = plan.scenery(t).map((p) => ({ ...p, ...W.geometry(p.kind) })),
      all = [...objects, ...actorDrawings];
    // Include the ground footprint during framing so placed items remain visible from every azimuth.
    const points = all.flatMap(corners);
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
    ctx.resetTransform();
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
    all.sort((a, b) => project(a.x, a.y, a.z)[2] - project(b.x, b.y, b.z)[2]);
    for (const d of all) d.body.draw(ctx, d.model, ...screen(d.x, d.y, d.z), yaw - d.heading, elev, scale);
    $('world-angle').value = angle;
    $('angle-label').textContent = Math.round(angle) + '°';
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
    angle = 35;
    pitch = 24;
    zoom = 1;
    draw();
  };
  let drag = null;
  canvas.onpointerdown = (e) => {
    drag = [e.clientX, e.clientY, angle, pitch];
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = (e) => {
    if (drag) {
      pitch = Math.max(8, Math.min(66, drag[3] + 0.22 * (e.clientY - drag[1])));
      orient(drag[2] + 0.47 * (e.clientX - drag[0]));
    }
  };
  canvas.onpointercancel = canvas.onpointerup = () => {
    drag = null;
  };
  canvas.onkeydown = (e) => {
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
  $('world-query').oninput = catalog;
  $('world-family').onchange = catalog;
  $('world-realm').onchange = catalog;
  $('world-scene').onchange = () => {
    play(false);
    loadScene($('world-scene').value);
    save();
  };
  for (const id of ['world-studio', 'world-three']) $(id).onclick = () => wardrobe.handoff($(id), plan.score);
  $('world-export').onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(wardrobe.scoreFile(plan.score), null, 2)], { type: 'application/json' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pine-world-' + sceneKey + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('world-import').onchange = async (e) => {
    try {
      const f = e.target.files[0];
      if (f) {
        const imported = wardrobe.readScoreFile(await f.text(), true);
        play(false);
        loadScene(sceneKey, imported);
        save();
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
  if (demos.includes(query.get('scene'))) sceneKey = query.get('scene');
  $('inventory-count').textContent =
    W.items.size +
    ' 件物件 · ' +
    Object.keys(W.families).length +
    ' 个分类 · ' +
    Object.keys(W.realms).length +
    ' 种时代与世界';
  loadScene(sceneKey, incoming);
  catalog();
  new ResizeObserver(draw).observe(canvas);
})();
