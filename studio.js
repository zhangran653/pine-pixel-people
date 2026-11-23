(() => {
  const id = (s) => document.getElementById(s);
  const lib = studioLibrary,
    stage = createStudioStage(id('studio-canvas'));
  PineWardrobe.hydrate();
  let incoming = null, incomingError = '';
  if (location.hash) {
    try {
      const snapshot = PineWardrobe.snapshot();
      if (snapshot) incoming = PineWardrobe.readScoreFile(snapshot);
    } catch (error) { incomingError = error.message; }
  }
  const storeKey = 'pineCreek.motionScores.v1',
    url = new URL(location.href),
    blank = () => ({ version: 1, loop: true, steps: [] });
  let books = {},
    savedBook;
  try {
    const data = JSON.parse(localStorage.getItem(storeKey) || '{}');
    if (data?.books && typeof data.books === 'object' && !Array.isArray(data.books)) books = data.books;
    savedBook = data?.book;
  } catch {
    /* Offline storage is optional. */
  }
  const goodBook = (b) => ['family', 'play', 'work', 'custom'].includes(b);
  let book = [url.searchParams.get('demo'), savedBook, 'family'].find(goodBook);
  let plan,
    selected = 0,
    position = 0,
    preview = null,
    previewTime = 0,
    playing = false,
    lastStamp = null,
    lastFrame = -1,
    lastCue = -1,
    request = 0;
  const $who = id('who'),
    $which = id('which'),
    $with = id('with'),
    $duration = id('seconds'),
    $repeat = id('times');
  const $scrub = id('scrub'),
    $list = id('cue-list'),
    $preset = id('preset');
  const fmt = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const actorsOf = (step) => step.actors.map((k) => lib.characters.get(k).label).join('与');
  function setNote(message = '') {
    id('feedback').textContent = message;
  }
  function initialScore(key) {
    try {
      return PineWardrobe.readScoreFile(books[key] || lib.presets[key] || blank());
    } catch {
      return lib.compile(lib.presets[key] || blank());
    }
  }
  function save() {
    books[book] = PineWardrobe.scoreFile(plan.score);
    try {
      localStorage.setItem(storeKey, JSON.stringify({ book, books }));
    } catch {
      /* Export remains available. */
    }
  }
  id('preview-three').addEventListener('click', (event) => {
    PineWardrobe.handoff(event.currentTarget,plan.score);
  });
  const option = (label, value) => new Option(label, value);
  function refreshActors() {
    const selected = $who.value;
    $who.replaceChildren(...Array.from(lib.characters.values(), p => option(p.label,p.id)));
    if (lib.characters.has(selected)) $who.value = selected;
  }
  function listPartners(wanted) {
    const clip = lib.actions.get($which.value);
    $with.replaceChildren();
    id('with-field').hidden = clip.roles.length < 2;
    if (clip.roles.length === 2) {
      for (const p of lib.characters.values()) if (lib.accepts(clip, 1, p)) $with.add(option(p.label, p.id));
      const ids = [...$with.options].map((o) => o.value);
      $with.value = ids.includes(wanted)
        ? wanted
        : ids.find((x) => x !== $who.value && x === 'mother') || ids.find((x) => x !== $who.value) || ids[0];
    }
  }
  function listActions(wanted, partner) {
    const groups = new Map(),
      p = lib.characters.get($who.value);
    const outfit = id('edit-outfit');
    const workshop = Object.hasOwn(PineLooks.workshopOutfits, p.id);
    const editable = PineWardrobe.saved.has(p.id);
    outfit.hidden = !workshop && !editable;
    outfit.textContent = workshop ? '试穿同款 ↗' : '编辑穿搭 ↗';
    if (!outfit.hidden) outfit.href = 'atelier.html?tab=wear&' + (workshop ? 'preset=look_workshop_' : 'saved=') + encodeURIComponent(p.id);
    $which.replaceChildren();
    for (const clip of lib.actions.values())
      if (lib.accepts(clip, 0, p)) {
        if (!groups.has(clip.group)) {
          const g = document.createElement('optgroup');
          g.label = clip.group;
          groups.set(clip.group, g);
          $which.append(g);
        }
        groups.get(clip.group).append(option(clip.label, clip.id));
      }
    if ([...$which.options].some((o) => o.value === wanted)) $which.value = wanted;
    $duration.value = lib.actions.get($which.value).seconds;
    listPartners(partner);
  }
  function toForm(step) {
    $who.value = step.actors[0];
    listActions(step.action, step.actors[1]);
    $duration.value = step.seconds;
    $repeat.value = step.repeat;
  }
  function draft() {
    const clip = lib.actions.get($which.value),
      actors = [$who.value];
    if (clip.roles.length === 2) actors.push($with.value);
    return lib.validateStep({
      action: clip.id,
      actors,
      seconds: $duration.valueAsNumber,
      repeat: $repeat.valueAsNumber
    });
  }
  function validated(fn) {
    if (!id('edit-form').reportValidity()) return;
    try {
      fn(draft());
    } catch (e) {
      setNote(e.message);
    }
  }
  function rebuildList() {
    $list.replaceChildren();
    plan.score.steps.forEach((s, i) => {
      const li = document.createElement('li'),
        button = document.createElement('button');
      button.type = 'button';
      button.className = 'cue';
      button.dataset.index = i;
      const num = document.createElement('span'),
        body = document.createElement('span'),
        name = document.createElement('span'),
        meta = document.createElement('span'),
        len = document.createElement('span');
      num.className = 'cue-num';
      num.textContent = String(i + 1).padStart(2, '0');
      name.className = 'cue-name';
      name.textContent = lib.actions.get(s.action).label;
      meta.className = 'cue-meta';
      meta.textContent = actorsOf(s);
      len.className = 'cue-time';
      len.textContent = fmt(s.seconds) + 's' + (s.repeat > 1 ? ' ×' + s.repeat : '');
      body.append(name, meta);
      button.append(num, body, len);
      button.setAttribute('aria-pressed', String(i === selected));
      button.addEventListener('click', () => pick(i));
      li.append(button);
      $list.append(li);
    });
    id('empty-score').hidden = plan.score.steps.length > 0;
    id('score-length').textContent = plan.score.steps.length + ' 段 · ' + fmt(plan.duration) + ' 秒';
    id('up').disabled = selected <= 0;
    id('down').disabled = selected < 0 || selected >= plan.score.steps.length - 1;
    id('remove').disabled = id('replace').disabled = selected < 0;
    id('loop').checked = plan.score.loop;
    lastCue = -1;
  }
  function invalidateTime() {
    lastFrame = -1;
    lastCue = -1;
    lastStamp = null;
  }
  function active() {
    return preview || plan;
  }
  function now() {
    return preview ? previewTime : position;
  }
  function setNow(t) {
    if (preview) previewTime = t;
    else position = t;
  }
  function render(force = false) {
    const show = active(),
      t = now(),
      cue = show.locate(t),
      frame = Math.floor(t * 20 + 0.00001);
    if (force || frame !== lastFrame || cue?.index !== lastCue) {
      lastFrame = frame;
      if (cue) stage.setFrame(show.sample(t));
      else stage.setFrame(soloClips.idle(0, lib.characters.get($who.value) || lib.characters.get('child')));
    }
    id('play').disabled = !show.duration;
    id('rewind').disabled = !show.duration;
    id('play').textContent = playing ? '暂停' : preview ? '播放单段' : '播放编排';
    id('play').setAttribute('aria-pressed', String(playing));
    id('return-score').hidden = !preview;
    id('loop').disabled = !!preview;
    $scrub.max = show.duration || 1;
    $scrub.value = t;
    $scrub.disabled = !show.duration;
    const timeLabel = fmt(t) + ' / ' + fmt(show.duration) + ' 秒';
    id('elapsed').textContent = timeLabel;
    $scrub.setAttribute('aria-valuetext', timeLabel);
    id('take-title').textContent = cue ? cue.clip.label : '自然待机';
    id('take-actors').textContent = cue
      ? actorsOf(cue.step)
      : lib.characters.get($who.value)?.label || '学龄儿童';
    id('take-number').textContent = preview
      ? '单段试看'
      : cue
        ? '第 ' +
          (cue.index + 1) +
          ' / ' +
          show.score.steps.length +
          ' 段' +
          (cue.step.repeat > 1 ? ' · 第 ' + (cue.iteration + 1) + ' 次' : '')
        : '空编排';
    id('studio-canvas').setAttribute(
      'aria-label',
      id('take-actors').textContent + ' · ' + id('take-title').textContent + '，拖动环视'
    );
    if (force || cue?.index !== lastCue) {
      for (const b of $list.querySelectorAll('.cue'))
        b.setAttribute('aria-current', !preview && Number(b.dataset.index) === cue?.index ? 'step' : 'false');
    }
    lastCue = cue?.index ?? -1;
  }
  function tick(timestamp) {
    request = 0;
    if (!playing || document.hidden) {
      lastStamp = null;
      return;
    }
    const dt = lastStamp === null ? 0 : Math.max(0, (timestamp - lastStamp) / 1000);
    lastStamp = timestamp;
    const show = active();
    let t = now() + dt;
    if (t >= show.duration) {
      if (!preview && plan.score.loop) t %= show.duration;
      else {
        t = show.duration;
        playing = false;
      }
    }
    setNow(t);
    render();
    if (playing) schedule();
  }
  function schedule() {
    if (!request && playing && !document.hidden) request = requestAnimationFrame(tick);
  }
  function pause() {
    playing = false;
    lastStamp = null;
    if (request) {
      cancelAnimationFrame(request);
      request = 0;
    }
  }
  function togglePlay() {
    if (playing) pause();
    else if (active().duration > 0) {
      if (now() >= active().duration) setNow(0);
      playing = true;
      lastStamp = null;
      schedule();
    }
    render(true);
  }
  function pick(i) {
    pause();
    preview = null;
    selected = i;
    position = plan.starts[i] || 0;
    invalidateTime();
    toForm(plan.score.steps[i]);
    rebuildList();
    render(true);
  }
  function updateScore(steps, selection) {
    const next = lib.compile({ ...plan.score, steps });
    pause();
    preview = null;
    plan = next;
    selected = steps.length ? Math.max(0, Math.min(selection, steps.length - 1)) : -1;
    position = selected < 0 ? 0 : plan.starts[selected];
    if (selected >= 0) toForm(plan.score.steps[selected]);
    invalidateTime();
    rebuildList();
    render(true);
    save();
    setNote();
  }
  function openBook(key, poster = false) {
    pause();
    preview = null;
    book = key;
    $preset.value = key;
    plan = initialScore(key);
    refreshActors();
    selected = plan.score.steps.length ? 0 : -1;
    position = poster && plan.score.steps[0]?.action === 'cradle' ? plan.score.steps[0].seconds * 0.55 : 0;
    if (selected >= 0) toForm(plan.score.steps[selected]);
    else {
      $who.value = 'child';
      listActions('run');
      $repeat.value = 1;
    }
    invalidateTime();
    rebuildList();
    render(true);
    setNote();
    save();
  }
  $who.addEventListener('change', () => {
    listActions($which.value);
    if (!plan.duration && !preview) render(true);
  });
  $which.addEventListener('change', () => {
    $duration.value = lib.actions.get($which.value).seconds;
    listPartners();
  });
  $preset.addEventListener('change', () => openBook($preset.value, true));
  id('try').addEventListener('click', () =>
    validated((s) => {
      pause();
      preview = lib.compile({ version: 1, steps: [s] });
      previewTime = 0;
      invalidateTime();
      playing = true;
      render(true);
      schedule();
      setNote();
    })
  );
  id('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    validated((s) => updateScore([...plan.score.steps, s], plan.score.steps.length));
  });
  id('replace').addEventListener('click', () =>
    validated((s) => {
      if (selected >= 0) {
        const steps = [...plan.score.steps];
        steps[selected] = s;
        updateScore(steps, selected);
      }
    })
  );
  function shift(n) {
    const j = selected + n;
    if (j < 0 || j >= plan.score.steps.length) return;
    const steps = [...plan.score.steps];
    [steps[j], steps[selected]] = [steps[selected], steps[j]];
    updateScore(steps, j);
  }
  id('up').addEventListener('click', () => shift(-1));
  id('down').addEventListener('click', () => shift(1));
  id('remove').addEventListener('click', () => {
    if (selected >= 0)
      updateScore(
        plan.score.steps.filter((_, i) => i !== selected),
        selected
      );
  });
  id('play').addEventListener('click', togglePlay);
  id('rewind').addEventListener('click', () => {
    setNow(0);
    lastStamp = null;
    render(true);
  });
  id('return-score').addEventListener('click', () => {
    pause();
    preview = null;
    invalidateTime();
    render(true);
  });
  $scrub.addEventListener('input', () => {
    pause();
    setNow($scrub.valueAsNumber);
    render(true);
  });
  id('loop').addEventListener('change', () => {
    plan.score.loop = id('loop').checked;
    save();
  });
  id('export').addEventListener('click', () => {
    const link = document.createElement('a'),
      blob = new Blob([JSON.stringify(PineWardrobe.scoreFile(plan.score), null, 2) + '\n'], { type: 'application/json' });
    link.href = URL.createObjectURL(blob);
    link.download = 'pine-motion-' + book + '.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setNote('已导出当前编排。');
  });
  id('import').addEventListener('click', () => id('load-file').click());
  let importRevision = 0;
  id('load-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const revision = ++importRevision;
    try {
      const source = await file.text();
      if (revision !== importRevision) return;
      const loaded = PineWardrobe.readScoreFile(source,true);
      books.custom = PineWardrobe.scoreFile(loaded.score);
      openBook('custom');
      setNote('已导入「' + file.name + '」。' + (loaded.charactersPersisted === false ? '存储空间不可用，可导出编排以保留形象。' : ''));
    } catch (error) {
      if (revision === importRevision) setNote('导入失败 · ' + error.message);
    } finally {
      if (revision === importRevision) e.target.value = '';
    }
  });
  const surface = id('studio-canvas'),
    orbit = id('orbit'),
    zoom = id('zoom');
  let drag = null;
  function setView(a, p, z) {
    stage.setView(a, p, z);
    orbit.value = Math.round(stage.bearing) % 360;
    zoom.value = Math.round(stage.zoom * 100);
    id('degrees').textContent = orbit.value + '°';
    id('magnification').textContent = zoom.value + '%';
  }
  orbit.addEventListener('input', () => {
    const value = orbit.valueAsNumber;
    setView(value, stage.tilt, stage.zoom);
    if (value === 360) {
      orbit.value = 360;
      id('degrees').textContent = '360°';
    }
  });
  zoom.addEventListener('input', () => setView(stage.bearing, stage.tilt, zoom.valueAsNumber / 100));
  surface.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, a: stage.bearing, p: stage.tilt };
    surface.setPointerCapture(e.pointerId);
    surface.classList.add('drag');
  });
  surface.addEventListener('pointermove', (e) => {
    if (drag?.id !== e.pointerId) return;
    setView(
      drag.a - ((e.clientX - drag.x) * 360) / surface.clientWidth,
      drag.p + ((e.clientY - drag.y) * 45) / surface.clientHeight,
      stage.zoom
    );
  });
  surface.addEventListener('lostpointercapture', () => {
    drag = null;
    surface.classList.remove('drag');
  });
  surface.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      setView(stage.bearing + (e.code === 'ArrowLeft' ? -10 : 10), stage.tilt, stage.zoom);
    }
  });
  document.addEventListener('visibilitychange', () => {
    lastStamp = null;
    if (!document.hidden) schedule();
  });
  new ResizeObserver(() => stage.draw()).observe(surface.parentElement);
  const autoplay =
    url.searchParams.get('play') === '1' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  openBook(book, !autoplay);
  if (incomingError) setNote(incomingError);
  const incomingStep = incoming?.score.steps[0];
  const requested = lib.characters.get(incomingStep?.actors[0] || url.searchParams.get('actor'));
  if (requested) {
    const clip =
      lib.actions.get(incomingStep?.action || url.searchParams.get('action')) ||
      lib.actions.get(requested.tags.includes('baby') ? 'crawl' : 'run');
    if (lib.accepts(clip, 0, requested)) {
      $who.value = requested.id;
      listActions(clip.id,incomingStep?.actors[1]);
      $repeat.value = 1;
      preview = lib.compile({ version: 1, steps: [draft()] });
      previewTime = autoplay ? 0 : clip.seconds * 0.37;
      invalidateTime();
      render(true);
    }
  }
  if (book === 'work' || ['phone', 'type'].includes(url.searchParams.get('action'))) setView(107, 26, 1);
  if (autoplay && active().duration) togglePlay();
})();
