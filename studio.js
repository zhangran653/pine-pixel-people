(() => {
  const id = (s) => document.getElementById(s);
  const lib = studioLibrary,
    stage = createStudioStage(id('studio-canvas'));
  PineWardrobe.hydrate();
  let incoming = null,
    incomingError = '';
  if (location.hash) {
    try {
      const snapshot = PineWardrobe.snapshot();
      if (snapshot) incoming = PineWardrobe.readScoreFile(snapshot);
    } catch (error) {
      incomingError = error.message;
    }
  }
  const storeKey = 'pineCreek.motionScores.v1',
    url = new URL(location.href),
    blank = () => ({ version: 1, loop: true, steps: [] });
  let books = {}, worldSource = '',
    savedBook;
  try {
    const data = JSON.parse(localStorage.getItem(storeKey) || '{}');
    if (data?.books && typeof data.books === 'object' && !Array.isArray(data.books)) books = data.books;
    savedBook = data?.book;
    worldSource = data?.worldSource || '';
  } catch {
    /* Offline storage is optional. */
  }
  const board = url.searchParams.get('board');
  const previousBooks = 'kept.';
  const pendingBooks = new Set();
  const owner = url.searchParams.get('person');
  const personBook = owner && incoming?.score.steps.some(s => s.actors.includes(owner)) ? 'person.' + owner : 'character';
  const transferred = incoming && (board === '1' ? 'world' : board === 'character' ? personBook : '');
  function bookTitle(key) {
    const raw = books[key], steps = (raw?.score || raw)?.steps || [];
    const actor = key.startsWith('person.') ? key.slice(7) : steps[0]?.actors[0];
    const name = raw?.characters?.find(doc => doc.id === actor)?.label || lib.characters.get(actor)?.label;
    return (name || '人物') + (key.startsWith(previousBooks) ? ' · ' + steps.length + ' 段 · ' + (lib.actions.get(steps[0]?.action)?.label || '空编排') : '的编排');
  }
  if (transferred) {
    const next = PineWardrobe.scoreFile(incoming.score), previous = books[transferred];
    const prior = JSON.stringify(previous);
    if (previous && prior !== JSON.stringify(next) &&
        !Object.keys(books).some(k => k.startsWith(previousBooks) && JSON.stringify(books[k]) === prior)) {
      const key = previousBooks + PineLooks.newId();
      books[key] = previous;
      pendingBooks.add(key);
    }
    books[transferred] = next;
  }
  if (transferred === 'world') worldSource = url.searchParams.get('scene') || '';
  const goodBook = b => typeof b === 'string' && (Object.hasOwn(books, b) || b === 'custom' || Object.hasOwn(lib.presets, b));
  let book = [transferred, url.searchParams.get('demo'), savedBook, 'family'].find(goodBook);
  let plan,
    selected = 0,
    position = 0,
    preview = null,
    previewTime = 0,
    previewLoop = false,
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
    pendingBooks.add(book);
    try {
      const latest = PineWorkspace.readLibrary(storeKey);
      const merged = { ...latest.books };
      for (const key of pendingBooks) merged[key] = books[key];
      localStorage.setItem(storeKey, JSON.stringify({ book, books: merged, worldSource: book === 'world' ? worldSource : latest.worldSource }));
      pendingBooks.clear();
      id('book-status').textContent = $preset.selectedOptions[0].textContent + ' · 已自动保存';
      return true;
    } catch {
      id('book-status').textContent = '仅在本页，可从文件菜单导出';
      return false;
    }
  }
  id('preview-three').addEventListener('click', (event) => {
    PineWardrobe.preview(event.currentTarget, active().score, now(), playing);
  });
  const option = (label, value) => new Option(label, value);
  const query = id('motion-query'),
    category = id('motion-group');
  for (const name of new Set([...lib.actions.values()].map((clip) => clip.group)))
    category.add(option(name, name));
  for (const [key, label] of Object.entries(lib.presetLabels)) $preset.add(option(label, key));
  if (books.world) $preset.add(option('从世界图鉴带入', 'world'));
  if (books.character) $preset.add(option('当前人物的编排', 'character'));
  for (const key of Object.keys(books).filter(k => k.startsWith('person.'))) $preset.add(option(bookTitle(key), key));
  const kept = document.createElement('optgroup');
  kept.label = '之前的编排';
  for (const key of Object.keys(books).filter(k => k.startsWith(previousBooks)).reverse()) kept.append(option(bookTitle(key), key));
  if (kept.childElementCount) $preset.append(kept);
  $preset.add(option('我的编排', 'custom'));
  function visibleCast() {
    return [...lib.characters.values()].filter(
      (p) => !p.id.startsWith('look_workshop_') || PineWardrobe.saved.has(p.id)
    );
  }
  function refreshActors() {
    const selected = $who.value;
    $who.replaceChildren(...visibleCast().map((p) => option(p.label, p.id)));
    if (lib.characters.has(selected)) $who.value = selected;
  }
  function targets(selected = '') {
    const clip = lib.actions.get($which.value),
      field = id('action-target');
    field.replaceChildren(option(clip?.route && plan?.worldScene.some(p => p.kind === clip.route) ? '使用首个匹配设施' : '随动作创建', ''));
    const scene = plan?.score.scene || [];
    for (const [i, p] of scene.entries()) {
      if (p.kind !== (clip?.station || clip?.route)) continue;
      const path = PineWorld.ancestors(scene, i).reverse()
        .map(n => PineWorld.items.get(scene[n].kind).label + ' · ' + (n + 1));
      field.add(option(path.join(' / '), String(i)));
    }
    field.value = String(selected ?? '');
    id('target-field').hidden = field.options.length < 2;
  }
  function partnersFor(clip) {
    return visibleCast().filter((person) => lib.accepts(clip, 1, person));
  }
  function preferredPartner(partners, wanted) {
    return (
      partners.find((p) => p.id === wanted) ||
      partners.find((p) => p.id === 'mother' && p.id !== $who.value) ||
      partners.find((p) => p.id !== $who.value) ||
      partners[0]
    );
  }
  function listPartners(wanted) {
    const clip = lib.actions.get($which.value);
    $with.replaceChildren();
    id('with-field').hidden = !clip || clip.roles.length < 2;
    if (!clip) return;
    if (clip.roles.length === 2) {
      const partners = partnersFor(clip);
      const extra = lib.characters.get(wanted);
      if (extra && lib.accepts(clip, 1, extra) && !partners.includes(extra)) partners.push(extra);
      for (const p of partners) $with.add(option(p.label, p.id));
      $with.value = preferredPartner(partners, wanted)?.id || '';
    }
  }
  let matches = [],
    cardPage = 0,
    cardTask = 0;
  function drawCards() {
    cancelAnimationFrame(cardTask);
    const browser = id('motion-browser'),
      cards = id('motion-cards'),
      pages = id('motion-pages');
    cards.replaceChildren();
    pages.hidden = matches.length <= 6;
    if (!browser.open) return;
    const who = lib.characters.get($who.value);
    const total = Math.ceil(matches.length / 6);
    id('motion-prev').disabled = cardPage === 0;
    id('motion-next').disabled = cardPage + 1 >= total;
    id('motion-page').value = total ? cardPage + 1 + ' / ' + total : '';
    const jobs = [];
    for (const clip of matches.slice(cardPage * 6, cardPage * 6 + 6)) {
      const b = document.createElement('button'),
        c = document.createElement('canvas'),
        caption = document.createElement('span');
      c.width = 120;
      c.height = 86;
      c.setAttribute('aria-hidden', 'true');
      caption.textContent = clip.label;
      b.type = 'button';
      b.dataset.clip = clip.id;
      b.setAttribute('aria-pressed', String(clip.id === $which.value));
      b.append(c, caption);
      cards.append(b);
      const cast = clip.roles.length === 1 ? [who] : [who, preferredPartner(partnersFor(clip), $with.value)];
      if (cast.every(Boolean))
        jobs.push(() => atelierPreview.actionCard(clip, cast)(c, clip.id === 'jump' ? 0.49 : 0.46));
      b.onclick = () => {
        $which.value = clip.id;
        $which.dispatchEvent(new Event('change'));
        id('try').click();
        cards.querySelector('[data-clip="' + clip.id + '"]')?.focus({ preventScroll: true });
      };
    }
    function next() {
      if (!browser.open || !jobs.length) return;
      jobs.shift()();
      if (jobs.length) cardTask = requestAnimationFrame(next);
    }
    if (jobs.length) cardTask = requestAnimationFrame(next);
  }
  id('motion-browser').ontoggle = drawCards;
  id('motion-prev').onclick = () => {
    if (cardPage > 0) {
      cardPage--;
      drawCards();
    }
  };
  id('motion-next').onclick = () => {
    if ((cardPage + 1) * 6 < matches.length) {
      cardPage++;
      drawCards();
    }
  };
  function listActions(wanted, partner) {
    const groups = new Map(),
      p = lib.characters.get($who.value);
    const outfit = id('edit-outfit');
    const link = PineWardrobe.editorLink(p, 'wear');
    outfit.hidden = !link;
    outfit.textContent = '编辑穿搭';
    if (link) outfit.href = link;
    $which.replaceChildren();
    const available = lib.findActions(p, { group: category.value, query: query.value });
    for (const clip of available) {
      if (!groups.has(clip.group)) {
        const g = document.createElement('optgroup');
        g.label = clip.group;
        groups.set(clip.group, g);
        $which.append(g);
      }
      groups.get(clip.group).append(option(clip.label, clip.id));
    }
    if ([...$which.options].some((o) => o.value === wanted)) $which.value = wanted;
    const hasMatch = available.length > 0;
    id('clear-motions').hidden = !query.value && !category.value;
    $which.disabled = !hasMatch;
    id('try').disabled = id('append').disabled = !hasMatch;
    id('replace').disabled = selected < 0 || !hasMatch;
    id('motion-count').textContent = hasMatch
      ? p.label + '可选 · ' + available.length + ' 个动作'
      : '没有符合条件的动作，可以更换分类或清空搜索。';
    if (hasMatch) $duration.value = lib.actions.get($which.value).seconds;
    listPartners(partner);
    targets();
    matches = available;
    cardPage = Math.max(0, Math.floor(matches.findIndex((clip) => clip.id === $which.value) / 6));
    drawCards();
  }
  function toForm(step) {
    const actor = lib.characters.get(step.actors[0]);
    if (
      !lib.findActions(actor, { group: category.value, query: query.value }).some((c) => c.id === step.action)
    ) {
      query.value = '';
      category.value = '';
    }
    if (!Array.from($who.options).some((o) => o.value === actor.id)) $who.add(option(actor.label, actor.id));
    $who.value = step.actors[0];
    listActions(step.action, step.actors[1]);
    $duration.value = step.seconds;
    $repeat.value = step.repeat;
    targets(step.target);
  }
  function draft() {
    const clip = lib.actions.get($which.value),
      actors = [$who.value];
    if (clip.roles.length === 2) actors.push($with.value);
    return lib.validateStep({
      action: clip.id,
      ...(id('action-target').value !== '' ? { target: Number(id('action-target').value) } : {}),
      actors,
      seconds: $duration.valueAsNumber,
      repeat: $repeat.valueAsNumber
    });
  }
  function validated(fn) {
    if (!$which.value || !id('edit-form').reportValidity()) return;
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
      button.addEventListener('click', () => {
        pick(i);
        $list.querySelector('[data-index="' + i + '"]').focus({ preventScroll: true });
      });
      li.append(button);
      $list.append(li);
    });
    id('empty-score').hidden = plan.score.steps.length > 0;
    id('score-length').textContent = plan.score.steps.length + ' 段 · ' + fmt(plan.duration) + ' 秒';
    id('up').disabled = selected <= 0;
    id('down').disabled = selected < 0 || selected >= plan.score.steps.length - 1;
    id('remove').disabled = selected < 0;
    id('cue-count').textContent = plan.score.steps.length;
    id('edit-cue').disabled = selected < 0;
    id('replace').disabled = selected < 0 || !$which.value;
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
  // A shared book or joined hands are hidden behind a partner in a side-on shot.
  // Let the viewer's first orbit take precedence over subsequent automatic cuts.
  const openingViews = {
    'climb-stairs': [291, 16],
    'hold-hands': [18, 18],
    storytime: [21, 19],
    photograph: [324, 18],
    'water-plant': [303, 21],
    guitar: [18, 19],
    phone: [107, 26],
    type: [107, 26]
  };
  let manualBearing = false,
    framedAction = null;
  function frameAction(clip) {
    if (!clip || manualBearing || framedAction === clip.id) return;
    framedAction = clip.id;
    const [angle, pitch] = Object.hasOwn(openingViews, clip.id)
      ? openingViews[clip.id]
      : book === 'work'
        ? [107, 26]
        : [78, 21];
    if (stage.bearing !== angle || stage.tilt !== pitch) setView(angle, pitch, stage.zoom);
  }
  function render(force = false) {
    const show = active(),
      t = now(),
      cue = show.locate(t),
      frame = Math.floor(t * 20 + 0.00001);
    if (force || frame !== lastFrame || cue?.index !== lastCue) {
      lastFrame = frame;
      if (cue) stage.setFrame(show.sample(t), show.scenery(t), show.score.detail);
      else
        stage.setFrame(
          soloClips.idle(0, lib.characters.get($who.value) || lib.characters.get('child')),
          show.scenery(t), show.score.detail
        );
      frameAction(cue?.clip);
    }
    id('play').disabled = !show.duration;
    id('rewind').disabled = !show.duration;
    id('play').textContent = playing ? '暂停' : preview ? '播放单段' : '播放编排';
    id('play').setAttribute('aria-pressed', String(playing));
    id('return-score').hidden = !preview;
    id('loop').checked = show.score.loop;
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
      if (show.score.loop) t %= show.duration;
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
  const readEdit = () => ({ score: { ...plan.score }, selected });
  const edits = PineWorkspace.editHistory(readEdit, state => {
    applyScore(lib.compile(state.score), state.selected);
    setNote('已恢复时间线');
  });
  function updateScore(steps, selection, message) {
    const next = lib.compile({ ...plan.score, steps });
    edits.record(readEdit());
    applyScore(next, selection);
    setNote(message);
  }
  function applyScore(next, selection) {
    const steps = next.score.steps;
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
  }
  function openBook(key, poster = false) {
    edits.clear();
    pause();
    preview = null;
    book = key;
    $preset.value = key;
    query.value = '';
    category.value = '';
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
    return save();
  }
  id('edit-world').onclick = () => {
    const link = id('edit-world'), dest = new URL(link.href);
    dest.searchParams.set('destination', 'work');
    if (book === 'world' && worldSource) dest.searchParams.set('scene', worldSource);
    else dest.searchParams.delete('scene');
    dest.searchParams.set('book', book);
    dest.searchParams.set('title', $preset.selectedOptions[0].textContent);
    link.href = dest;
    PineWardrobe.handoff(link, plan.score);
  };
  function filterActions() {
    const prior = $which.value,
      duration = $duration.value;
    listActions(prior, $with.value);
    if (prior && $which.value === prior) $duration.value = duration;
  }
  query.addEventListener('input', filterActions);
  id('clear-motions').onclick = () => { query.value = ''; category.value = ''; filterActions(); query.focus(); };
  id('add-cue').onclick = () => { PineWorkspace.openTool('motion-library'); query.focus(); };
  id('edit-cue').onclick = () => {
    if (selected < 0) return;
    pick(selected);
    PineWorkspace.openTool('motion-library');
    $which.focus();
    setNote('正在编辑第 ' + (selected + 1) + ' 段，修改后点「替换选中段」。');
  };
  category.addEventListener('change', filterActions);
  query.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      query.value = '';
      filterActions();
    }
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      if ($which.value) id('try').click();
    }
  });
  $who.addEventListener('change', () => {
    listActions($which.value);
    if (!plan.duration && !preview) render(true);
  });
  $which.addEventListener('change', () => {
    $duration.value = lib.actions.get($which.value).seconds;
    listPartners($with.value);
    targets();
    cardPage = Math.max(0, Math.floor(matches.findIndex((clip) => clip.id === $which.value) / 6));
    drawCards();
  });
  $with.addEventListener('change', drawCards);
  $preset.addEventListener('change', () => openBook($preset.value, true));
  id('try').addEventListener('click', () =>
    validated((s) => {
      pause();
      preview = lib.compile({ ...plan.score, loop: previewLoop, steps: [s] });
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
    validated(s => {
      updateScore([...plan.score.steps, s], plan.score.steps.length, '已加入「' + lib.actions.get(s.action).label + '」');
      PineWorkspace.openTool('motion-score', true);
    });
  });
  id('replace').addEventListener('click', () =>
    validated((s) => {
      if (selected >= 0) {
        const steps = [...plan.score.steps];
        steps[selected] = s;
        updateScore(steps, selected, '已替换第 ' + (selected + 1) + ' 段');
        PineWorkspace.openTool('motion-score', true);
      }
    })
  );
  function shift(n) {
    const j = selected + n;
    if (j < 0 || j >= plan.score.steps.length) return;
    const steps = [...plan.score.steps];
    [steps[j], steps[selected]] = [steps[selected], steps[j]];
    updateScore(steps, j, '已移到第 ' + (j + 1) + ' 段');
  }
  id('up').addEventListener('click', () => shift(-1));
  id('down').addEventListener('click', () => shift(1));
  id('remove').addEventListener('click', () => {
    if (selected >= 0)
      updateScore(
        plan.score.steps.filter((_, i) => i !== selected),
        selected, '已移除第 ' + (selected + 1) + ' 段，可撤销。'
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
    if (!preview) edits.record(readEdit());
    active().score.loop = id('loop').checked;
    if (preview) previewLoop = preview.score.loop;
    else save();
  });
  id('export').addEventListener('click', () => {
    const link = document.createElement('a'),
      blob = new Blob([JSON.stringify(PineWardrobe.scoreFile(plan.score), null, 2) + '\n'], {
        type: 'application/json'
      });
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
      const loaded = PineWardrobe.readScoreFile(source, true);
      books.custom = PineWardrobe.scoreFile(loaded.score);
      openBook('custom');
      setNote(
        '已导入「' +
          file.name +
          '」。' +
          (loaded.charactersPersisted === false ? '存储空间不可用，可导出编排以保留形象。' : '')
      );
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
    manualBearing = true;
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
    if (e.clientX !== drag.x || e.clientY !== drag.y) manualBearing = true;
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
      manualBearing = true;
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
  const persisted = openBook(book, !autoplay);
  if (transferred && persisted && ['https:', 'http:'].includes(location.protocol)) {
    const local = new URL(location.href);
    local.hash = '';
    local.searchParams.delete('board');
    local.searchParams.set('demo', book);
    history.replaceState(history.state, '', local);
  }
  if (transferred) setNote(board === 'character' ? '人物和试演动作已加入时间线。' : '已载入此场景的完整编排。');
  if (incomingError) setNote(incomingError);
  const incomingStep = incoming?.score.steps[0];
  const requested = lib.characters.get(incomingStep?.actors[0] || url.searchParams.get('actor'));
  if (requested && !transferred) {
    const clip =
      lib.actions.get(incomingStep?.action || url.searchParams.get('action')) ||
      lib.actions.get(requested.tags.includes('baby') ? 'crawl' : 'run');
    if (lib.accepts(clip, 0, requested)) {
      if (!Array.from($who.options).some((o) => o.value === requested.id))
        $who.add(option(requested.label, requested.id));
      $who.value = requested.id;
      listActions(clip.id, incomingStep?.actors[1] || url.searchParams.get('partner'));
      $repeat.value = incomingStep?.repeat ?? 1;
      if (incomingStep) $duration.value = incomingStep.seconds;
      previewLoop = incoming?.score.loop ?? previewLoop;
      preview = lib.compile({
        ...plan.score,
        loop: previewLoop,
        steps: [draft()]
      });
      previewTime = autoplay ? 0 : preview.score.steps[0].seconds * 0.37;
      invalidateTime();
      render(true);
    }
  }
  if (autoplay && active().duration) togglePlay();
  const priorView = PineWorkspace.resumed;
  if (!incoming && priorView?.book === book && [priorView.position, priorView.bearing, priorView.tilt, priorView.zoom].every(Number.isFinite)) {
    if (plan.score.steps[priorView.selected]) pick(priorView.selected);
    position = Math.max(0, Math.min(plan.duration, priorView.position));
    if (priorView.preview) {
      try {
        preview = PineWardrobe.readScoreFile(priorView.preview);
        toForm(preview.score.steps[0]);
        previewTime = Math.max(0, Math.min(preview.duration, priorView.previewTime));
        previewLoop = preview.score.loop;
      } catch { preview = null; }
    }
    manualBearing = priorView.manualBearing;
    setView(priorView.bearing, priorView.tilt, priorView.zoom);
    const form = priorView.form;
    if (form && [...$who.options].some(o => o.value === form.who)) {
      $who.value = form.who;
      query.value = form.query;
      category.value = form.group;
      listActions(form.action, form.partner);
      if ($which.value === form.action) {
        $duration.value = form.seconds;
        $repeat.value = form.repeat;
        targets(form.target);
      }
    }
    invalidateTime();
    render(true);
  }
  PineWorkspace.rememberView(() => ({ book, selected, position, previewTime, manualBearing,
    bearing: stage.bearing, tilt: stage.tilt, zoom: stage.zoom,
    form: { who: $who.value, action: $which.value, partner: $with.value, query: query.value, group: category.value,
      seconds: $duration.value, repeat: $repeat.value, target: id('action-target').value },
    ...(preview ? { preview: PineWardrobe.scoreFile(preview.score) } : {}) }));
})();
