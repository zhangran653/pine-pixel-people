// Each pane samples the same actor, joint frames, phase and orthographic camera.
(() => {
  const $ = (id) => document.getElementById(id),
    looks = PineLooks,
    motion = PineMotion;
  const params = new URLSearchParams(location.search);
  const names = { skull: '头骨', torso: '躯干', arms: '双臂', legs: '双腿' };
  const ageLabels = {
    male: '成人男性',
    female: '成人女性',
    adult: '成人通用',
    child: '儿童',
    baby: '婴儿',
    toddler: '幼儿',
  };
  let recipe,
    initial,
    actor,
    posed,
    elevation = 0,
    bands,
    request = 0,
    playing = 0;
  const partSelects = {};
  for (const [slot, options] of Object.entries(looks.anatomyParts)) {
    const label = document.createElement('label'),
      select = document.createElement('select');
    label.textContent = names[slot];
    select.id = 'part-' + slot;
    for (const [id, title] of Object.entries(options)) select.add(new Option(title, id));
    label.append(select);
    $('parts').append(label);
    partSelects[slot] = select;
    select.onchange = () => {
      recipe.anatomyParts = { ...recipe.anatomyParts, [slot]: select.value };
      rebuild();
    };
  }
  function baseRecipe(base) {
    const source =
      (base === 'female' && looks.archivedTemplates.get('look_body_female')) ||
      (base === 'toddler' && looks.archivedTemplates.get('look_workshop_toddler')) ||
      pineFigureModels[base] ||
      pineFigureModels.adult;
    const doc = looks.withFigureStudy(
      base === 'adult' ? { ...source, gender: 'unspecified' } : looks.withBodyProfile(source, base),
    );
    doc.label = ageLabels[base] + ' · 人体试作';
    return doc;
  }
  function openBase(doc, base) {
    initial = structuredClone(doc);
    recipe = structuredClone(doc);
    $('base').value = base;
    $('depth').value = Math.round((recipe.shape.headDepth ?? 1) * 100);
    $('chin').value = Math.round((recipe.shape.chinProjection ?? 0) * 100);
    for (const [slot, select] of Object.entries(partSelects))
      select.value = recipe.anatomyParts?.[slot] || 'balanced';
    $('jaw').value = 0;
    rebuild();
  }
  function stop() {
    cancelAnimationFrame(playing);
    playing = 0;
    $('play').setAttribute('aria-pressed', 'false');
    $('play').textContent = '播放动作';
  }
  function editLink() {
    const qs = new URLSearchParams({ tab: 'shape', bearing: $('angle').value, action: $('action').value });
    $('edit').href = 'atelier.html?' + qs + '#' + new URLSearchParams({ character: JSON.stringify(recipe) });
  }
  function rebuild() {
    stop();
    actor = looks.build(recipe);
    const action = $('action').value;
    const allowed = [
      'idle',
      'look-around',
      'open-mouth',
      'sway',
      'drink',
      'wave',
      'walk',
      'run',
      'sit',
      'crawl',
      'baby-reach',
      'jump',
    ]
      .map((id) => motion.actions.get(id))
      .filter((c) => c && motion.accepts(c, 0, actor) && c.roles.length === 1);
    $('action').replaceChildren(...allowed.map((c) => new Option(c.label, c.id)));
    $('action').value = allowed.some((c) => c.id === action) ? action : 'idle';
    $('depth-value').value = $('depth').value + '%';
    $('chin-value').value = $('chin').value + '%';
    editLink();
    schedule();
  }
  function schedule() {
    if (!request)
      request = requestAnimationFrame(() => {
        request = 0;
        frame();
      });
  }
  function frame() {
    const clip = motion.actions.get($('action').value),
      t = Number($('phase').value) / 100;
    const sample = clip.sample(t, actor)[0],
      pose = { ...sample.pose };
    const amount = Math.max(pose.jawOpen || 0, Number($('jaw').value) / 100);
    pose.jawOpen = amount;
    pose.jaw = pose.head;
    if (amount) {
      pose.jawLocal = motion.rig.mandibleFrame(actor.rig, amount);
      pose.jaw = motion.rig.compose(pose.head, pose.jawLocal);
    } else delete pose.jawLocal;
    posed = pose;
    elevation = sample.z || 0;
    const layer = $('layer').value,
      close = $('framing').value === 'head';
    bands = [actor.anatomy.body(layer), actor.body].map((body) => {
      const model = body.makePose(pose);
      const cast = body === actor.body ? actor : { ...actor, body };
      const p = { ...sample, pose, x: 0, y: 0, z: elevation, heading: 0, actor: cast, body, model };
      return (
        studioPortraitLayers([p], motion, close ? motion.closePortraitLayers : motion.figureLayers) || [p]
      );
    });
    $('phase-value').value = Math.round(t * 100) + '%';
    $('jaw-value').value = Math.round(amount * 100) + '%';
    $('structure-label').textContent = $('layer').selectedOptions[0].textContent;
    draw();
  }
  function draw() {
    if (!bands) return;
    const angle = +$('angle').value,
      yaw = (angle * Math.PI) / 180,
      head = $('framing').value === 'head';
    $('angle-value').value = angle + '°';
    for (const b of document.querySelectorAll('[data-angle]'))
      b.setAttribute('aria-pressed', +b.dataset.angle === angle);
    const marker = (name) => motion.rig.socket(actor, posed, name);
    const a = marker('leftEarCanal'),
      b = marker('rightEarCanal'),
      m = marker('mouth');
    const ear = a.map((v, i) => (v + b[i]) / 2),
      width = Math.hypot(...a.map((v, i) => v - b[i]));
    const focus = ear.map((v, i) => v + (m[i] - v) * 0.18);
    const height = actor.rig.height,
      baby = recipe.base === 'baby';
    const extent = head ? width * 1.95 : height * ($('action').value === 'jump' ? 1.35 : baby ? 0.94 : 1.07);
    const scaleHeight = head ? 152 : 192;
    for (const [i, cv] of [$('structure'), $('dressed')].entries()) {
      const aspect = cv.clientWidth / Math.max(1, cv.clientHeight);
      if (!aspect) continue;
      cv.height = scaleHeight;
      cv.width = Math.max(1, Math.round(cv.height * aspect));
      const scale = Math.min(
        cv.height / extent,
        cv.width / (head ? width * 1.85 : height * (baby ? 0.99 : 0.83)),
      );
      const x0 = cv.width / 2 - (head ? (-Math.sin(yaw) * focus[0] + Math.cos(yaw) * focus[1]) * scale : 0);
      const y0 = head ? cv.height * 0.5 + (ear[2] + elevation + width * 0.1) * scale : cv.height * 0.94;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const band of bands[i]) {
        const x = -Math.sin(yaw) * band.x + Math.cos(yaw) * band.y;
        band.body.draw(ctx, band.model, x0 + x * scale, y0 - band.z * scale, yaw, 0, scale);
      }
    }
  }
  $('base').onchange = () => openBase(baseRecipe($('base').value), $('base').value);
  $('reset').onclick = () => openBase(initial, $('base').value);
  $('layer').onchange = () => {
    if ($('layer').value === 'skull') $('framing').value = 'head';
    else $('framing').value = 'body';
    schedule();
  };
  $('framing').onchange = schedule;
  $('action').onchange = () => {
    stop();
    $('phase').value = 17;
    editLink();
    schedule();
  };
  $('phase').oninput = () => {
    stop();
    schedule();
  };
  $('jaw').oninput = schedule;
  for (const [id, key] of [
    ['depth', 'headDepth'],
    ['chin', 'chinProjection'],
  ])
    $(id).oninput = () => {
      recipe.shape[key] = +$(id).value / 100;
      rebuild();
    };
  $('angle').oninput = () => {
    draw();
    editLink();
  };
  for (const button of document.querySelectorAll('[data-angle]'))
    button.onclick = () => {
      $('angle').value = button.dataset.angle;
      draw();
      editLink();
    };
  $('play').onclick = () => {
    if (playing) {
      stop();
      return;
    }
    $('play').setAttribute('aria-pressed', 'true');
    $('play').textContent = '暂停动作';
    const length = motion.actions.get($('action').value).seconds * 1000,
      start = performance.now() - (length * +$('phase').value) / 100;
    let previous = 0;
    function tick(now) {
      if (now - previous > 100) {
        previous = now;
        $('phase').value = Math.round((((now - start) % length) / length) * 100);
        schedule();
      }
      playing = requestAnimationFrame(tick);
    }
    playing = requestAnimationFrame(tick);
  };
  $('download').onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = recipe.id + '-anatomy.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  window.addEventListener('resize', draw);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  const base = Object.hasOwn(ageLabels, params.get('base')) ? params.get('base') : 'male';
  const layer = params.get('layer');
  if (['skull', 'skeleton', 'muscle', 'form'].includes(layer)) $('layer').value = layer;
  $('framing').value = $('layer').value === 'skull' ? 'head' : 'body';
  const bearing = Number(params.get('bearing'));
  if (params.has('bearing') && Number.isInteger(bearing) && bearing >= 0 && bearing < 360)
    $('angle').value = bearing;
  const source = new URLSearchParams(location.hash.slice(1)).get('character');
  try {
    const doc = source ? looks.withFigureStudy(looks.prepare(JSON.parse(source)).recipe) : baseRecipe(base);
    openBase(doc, looks.bodyProfileOf(doc) || 'adult');
    const action = params.get('action');
    if ([...$('action').options].some((option) => option.value === action)) {
      $('action').value = action;
      editLink();
    }
  } catch (e) {
    $('status').textContent = '无法读取这个人物，已打开默认基型。' + e.message;
    openBase(baseRecipe(base), base);
  }
})();
