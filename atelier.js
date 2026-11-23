(() => {
  const $ = (id) => document.getElementById(id),
    looks = PineLooks,
    wardrobe = PineWardrobe;
  const skipped = wardrobe.hydrate(),
    mirror = atelierPreview.create($('mirror'), PineMotion);
  const entries = new Map(),
    actors = new WeakMap(),
    clone = structuredClone;
  const names = {
    height: '身高',
    shoulders: '肩宽',
    arms: '臂长',
    legs: '腿长',
    faceWidth: '脸宽',
    eyeSpacing: '眼距',
    jaw: '下颌宽度',
    mouthHeight: '嘴部高低',
    hair: '发型',
    top: '上衣',
    bottom: '下装',
    shoes: '鞋款',
    neck: '颈饰',
    hat: '帽子'
  };
  const tabKeys = {
    shape: ['height', 'shoulders', 'arms', 'legs'],
    face: ['faceWidth', 'eyeSpacing', 'jaw', 'mouthHeight']
  };
  let draft,
    actor,
    tab = 'shape',
    view = 'body',
    cardKey = '',
    saved = false,
    dirty = false;
  let action = 'idle',
    phase = 0.19,
    bearing = 24,
    playing = false,
    frame = 0,
    stamp = null,
    lastSample = -1,
    drag = null;
  function note(text, error = false) {
    $('feedback').textContent = text;
    $('feedback').dataset.error = String(error);
  }
  function report(fn) {
    try {
      return fn();
    } catch (e) {
      note(e.message, true);
      return null;
    }
  }
  function actorFor(doc) {
    if (!actors.has(doc)) actors.set(doc, looks.build(doc));
    return actors.get(doc);
  }
  function compareDoc() {
    return entries.get($('compare').value);
  }
  function show() {
    const other = compareDoc();
    mirror.show({ actor, compare: other ? actorFor(other) : null, action, u: phase, bearing, view });
  }
  function orientation() {
    const dirs = ['正面', '正面偏侧', '侧面', '背面偏侧', '背面', '背面偏侧', '侧面', '正面偏侧'];
    $('angle-tag').textContent = dirs[Math.round(bearing / 45) % 8] + ' · ' + Math.round(bearing) + '°';
    $('bearing').value = Math.round(bearing);
  }
  function schedule() {
    if (!frame && playing && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    if (!playing || document.hidden) {
      stamp = null;
      return;
    }
    if (stamp !== null) phase = (phase + (time - stamp) / 1000 / PineMotion.actions.get(action).seconds) % 1;
    stamp = time;
    const sample = Math.floor(phase * PineMotion.actions.get(action).seconds * 16);
    if (sample !== lastSample) {
      show();
      lastSample = sample;
    }
    schedule();
  }
  function togglePlay() {
    playing = !playing;
    stamp = null;
    lastSample = -1;
    $('play-look').textContent = playing ? '暂停' : '播放';
    $('play-look').setAttribute('aria-pressed', String(playing));
    schedule();
  }
  function setView(next) {
    view = next;
    for (const b of document.querySelectorAll('[data-view]'))
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
    show();
  }
  function heading() {
    $('mirror-name').textContent = draft.label || '未命名形象';
    $('save-state').textContent = dirty ? '有未保存的修改' : saved ? '已保存' : '新形象';
    for (const b of document.querySelectorAll('[data-base]'))
      b.setAttribute('aria-pressed', String(b.dataset.base === draft.base));
  }
  function refreshAction() {
    const available = [...PineMotion.actions.values()].filter((clip) => PineMotion.accepts(clip, 0, actor));
    $('action').replaceChildren(...available.map((clip) => new Option(clip.label, clip.id)));
    if (!available.some((clip) => clip.id === action)) action = 'idle';
    $('action').value = action;
  }
  function changed() {
    dirty = true;
    actor = looks.build({ ...draft, label: draft.label.trim() || '未命名形象' });
    heading();
    show();
    note('');
  }
  function slider(key) {
    const [min, max] = looks.shape[key],
      label = document.createElement('label'),
      output = document.createElement('output'),
      field = document.createElement('input');
    label.className = 'slider-label';
    label.htmlFor = 'edit-' + key;
    label.append(names[key], output, field);
    field.id = 'edit-' + key;
    field.type = 'range';
    field.min = min;
    field.max = max;
    field.step = key === 'mouthHeight' ? 0.05 : 0.01;
    field.value = draft.shape[key];
    output.htmlFor = field.id;
    function value() {
      return key === 'mouthHeight'
        ? (draft.shape[key] > 0 ? '+' : '') + Math.round(draft.shape[key] * 100) + '%'
        : Math.round(draft.shape[key] * 100) + '%';
    }
    output.textContent = value();
    field.oninput = () => {
      draft.shape[key] = field.valueAsNumber;
      output.textContent = value();
      changed();
    };
    return label;
  }
  function picker(caption, id, options, value, apply) {
    const label = document.createElement('label'),
      field = document.createElement('select');
    field.id = 'edit-' + id;
    for (const [v, text] of options) field.add(new Option(text, v));
    field.value = value;
    field.onchange = () => {
      apply(field.value);
      changed();
    };
    label.append(caption, field);
    return label;
  }
  function fields() {
    const area = $('editor-fields');
    area.replaceChildren();
    area.setAttribute('aria-labelledby', 'tab-' + tab);
    for (const b of document.querySelectorAll('[data-tab]')) {
      const active = b.dataset.tab === tab;
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
    }
    if (tabKeys[tab]) {
      area.append(...tabKeys[tab].map(slider));
      return;
    }
    const grid = document.createElement('div');
    area.append(grid);
    if (tab === 'wear') {
      grid.className = 'wardrobe-grid';
      for (const [slot, values] of Object.entries(looks.slots)) {
        grid.append(
          picker(names[slot], slot, Object.entries(values), draft.parts[slot], (v) => {
            draft.parts[slot] = v;
          })
        );
      }
      const hats = [['none', '无帽饰']];
      for (const pack of looks.catalog.values())
        for (const p of pack.parts) {
          hats.push([
            pack.id + '/' + p.id + '@' + pack.release,
            p.label + (pack.id === looks.core ? '' : ' · ' + pack.release)
          ]);
        }
      const hat = draft.parts.hat,
        owner = hat.split('/')[0];
      grid.append(
        picker('帽子', 'hat', hats, hat === 'none' ? 'none' : hat + '@' + draft.packs[owner], (v) => {
          const [qualified, release] = v.split('@'),
            packId = qualified.split('/')[0];
          draft.parts.hat = qualified;
          draft.packs = { [looks.core]: looks.release };
          delete draft.embeddedPacks;
          if (qualified !== 'none') draft.packs[packId] = release;
        })
      );
      const button = document.createElement('button');
      button.className = 'pack-action';
      button.textContent = '导入帽饰包…';
      button.onclick = () => $('pack-file').click();
      area.append(button);
    } else {
      grid.className = 'color-grid';
      for (const [key, text] of Object.entries(looks.colors)) {
        const label = document.createElement('label'),
          input = document.createElement('input');
        input.type = 'color';
        input.id = 'color-' + key;
        input.value = draft.colors[key];
        input.oninput = () => {
          draft.colors[key] = input.value;
          changed();
        };
        label.append(input, text);
        grid.append(label);
      }
    }
  }
  function activate(doc, key, isSaved) {
    draft = clone(doc);
    if (!isSaved) draft.id = looks.newId();
    saved = isSaved;
    dirty = false;
    cardKey = key;
    actor = looks.build(draft);
    $('look-name').value = draft.label;
    heading();
    fields();
    refreshAction();
    shelf();
    show();
    note('');
  }
  function shelf() {
    const root = $('look-shelf'),
      compare = $('compare'),
      previous = compare.value;
    root.replaceChildren();
    entries.clear();
    const datasets = [
      ['预置', looks.templates.map((d) => ['preset:' + d.id, d])],
      ['已保存', [...wardrobe.saved].map(([id, d]) => ['saved:' + id, d])]
    ];
    compare.replaceChildren(new Option('无对照', ''));
    for (const [section, items] of datasets) {
      if (!items.length) continue;
      const label = document.createElement('div');
      label.className = 'shelf-group';
      label.textContent = section;
      root.append(label);
      for (const [key, doc] of items) {
        entries.set(key, doc);
        const b = document.createElement('button'),
          image = document.createElement('canvas'),
          title = document.createElement('small');
        b.type = 'button';
        b.dataset.key = key;
        b.setAttribute('aria-pressed', String(key === cardKey));
        b.title = section + ' · ' + doc.label;
        image.setAttribute('aria-hidden', 'true');
        title.textContent = doc.label;
        b.append(image, title);
        root.append(b);
        atelierPreview.thumbnail(image, actorFor(doc));
        b.onclick = () => switchTo(() => activate(doc, key, section === '已保存'));
        if (key !== cardKey) compare.add(new Option(section + ' · ' + doc.label, key));
      }
    }
    if ([...compare.options].some((o) => o.value === previous)) compare.value = previous;
    $('shelf-count').textContent = looks.templates.length + ' 款预置 · 已保存 ' + wardrobe.saved.size + ' 个';
  }
  function save(copy = false) {
    if (!$('look-name').reportValidity()) return;
    const result = wardrobe.save({ ...draft, id: copy ? looks.newId() : draft.id });
    activate(result.recipe, 'saved:' + result.recipe.id, true);
    if (!result.persistent) $('save-state').textContent = '仅在本页保存';
    note(
      result.persistent
        ? '已保存「' + draft.label + '」。'
        : '存储空间不可用，形象保留在本页。可导出 JSON 带走。',
      !result.persistent
    );
    return result;
  }
  function score() {
    const clip = PineMotion.actions.get(action),
      ids = [draft.id],
      docs = [draft];
    if (clip.roles.length === 2) {
      const other = compareDoc();
      if (other) {
        const doc = other.id === draft.id ? { ...other, id: looks.newId() } : other;
        ids.push(doc.id);
        docs.push(doc);
      } else ids.push(draft.base === 'adult' ? 'child' : 'mother');
    }
    return { score: { version: 1, loop: true, steps: [{ action, actors: ids }] }, docs };
  }
  let pendingSwitch = null;
  function switchTo(fn) {
    if (!dirty) {
      fn();
      return;
    }
    pendingSwitch = fn;
    $('switch-dialog').showModal();
  }
  $('switch-dialog').addEventListener('close', () => {
    if (pendingSwitch && $('switch-dialog').returnValue === 'discard') report(pendingSwitch);
    pendingSwitch = null;
    $('switch-dialog').returnValue = '';
  });
  function changeTab(b) {
    tab = b.dataset.tab;
    fields();
    setView(tab === 'face' ? 'face' : 'body');
  }
  for (const b of document.querySelectorAll('[data-tab]')) {
    b.onclick = () => changeTab(b);
    b.onkeydown = (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...document.querySelectorAll('[data-tab]')],
        n = tabs.length;
      const i =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? n - 1
            : (tabs.indexOf(b) + (event.key === 'ArrowRight' ? 1 : n - 1)) % n;
      changeTab(tabs[i]);
      tabs[i].focus();
    };
  }
  for (const b of document.querySelectorAll('[data-base]'))
    b.onclick = () => {
      draft.base = b.dataset.base;
      changed();
      refreshAction();
    };
  for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => setView(b.dataset.view);
  $('look-name').oninput = () => {
    draft.label = $('look-name').value;
    dirty = true;
    heading();
  };
  $('action').onchange = () => {
    action = $('action').value;
    phase = action === 'highfive' ? 0.48 : action === 'drink' ? 0.51 : 0.24;
    stamp = null;
    show();
  };
  $('compare').onchange = show;
  $('play-look').onclick = togglePlay;
  function orbit(angle) {
    bearing = angle;
    orientation();
    show();
  }
  $('bearing').oninput = () => orbit($('bearing').valueAsNumber);
  const canvas = $('mirror');
  canvas.onpointerdown = (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, angle: bearing };
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = (e) => {
    if (drag?.id === e.pointerId)
      orbit((((drag.angle - ((e.clientX - drag.x) * 360) / canvas.clientWidth) % 360) + 360) % 360);
  };
  canvas.onlostpointercapture = () => {
    drag = null;
  };
  canvas.onkeydown = (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      orbit((bearing + (e.key === 'ArrowLeft' ? 350 : 10)) % 360);
    }
  };
  $('save-look').onclick = () => report(() => save());
  $('fork-look').onclick = () => report(() => save(true));
  $('load').onclick = () => $('look-file').click();
  function upload(id, consume) {
    const input = $(id);
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const json = JSON.parse(await file.text());
        consume(json);
      } catch (e) {
        note('导入失败 · ' + e.message, true);
      } finally {
        input.value = '';
      }
    };
  }
  upload('look-file', (data) => {
    const { recipe } = looks.prepare(data);
    switchTo(() => {
      const r = wardrobe.importCharacter(recipe);
      activate(r.recipe, 'saved:' + r.recipe.id, true);
      if (!r.persistent) $('save-state').textContent = '仅在本页保存';
      note(
        '已导入「' + r.recipe.label + '」' + (r.persistent ? '。' : '，浏览器存储不可用，可导出 JSON。'),
        !r.persistent
      );
    });
  });
  upload('pack-file', (data) => {
    const pack = wardrobe.installPack(data);
    fields();
    note('已载入「' + pack.title + '」，可从帽子列表选择。');
  });
  $('export-look').onclick = () =>
    report(() => {
      if (!$('look-name').reportValidity()) return;
      const { recipe } = looks.prepare(draft),
        a = document.createElement('a');
      a.href = URL.createObjectURL(
        new Blob([JSON.stringify(recipe, null, 2) + '\n'], { type: 'application/json' })
      );
      a.download = recipe.id + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      note('已导出「' + recipe.label + '」，可在另一台设备导入。');
    });
  function transfer(e, write) {
    try {
      if (!$('look-name').reportValidity() || (write && !save())) {
        e.preventDefault();
        return;
      }
      const data = score();
      wardrobe.handoff(e.currentTarget, data.score, data.docs);
    } catch (error) {
      e.preventDefault();
      note(error.message, true);
    }
  }
  $('studio-link').onclick = (e) => transfer(e, true);
  $('three-link').onclick = (e) => transfer(e, false);
  document.addEventListener('visibilitychange', () => {
    stamp = null;
    schedule();
  });
  const first = looks.templates[0];
  activate(first, 'preset:' + first.id, false);
  orientation();
  if (skipped) note('有 ' + skipped + ' 个无效的本地存档，其他形象已载入。', true);
  if (location.protocol !== 'file:')
    fetch('packs/creek-hats.json')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((pack) => {
        wardrobe.installPack(pack, false);
        if (tab === 'wear') fields();
      })
      .catch(() => note('溪谷帽包未能载入，可在穿搭页手动导入 JSON。', true));
})();
