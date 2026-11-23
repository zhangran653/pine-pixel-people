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
    eyes: '眼型',
    brows: '眉形',
    nose: '鼻型',
    mouth: '唇形',
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
  let hairAngle = 140,
    priorAngle = 24,
    swatchKey = '',
    swatchFrame = 0;
  const swatchActors = new Map(),
    thumbnails = new WeakMap();
  function paintThumbnail(canvas) {
    const item = thumbnails.get(canvas);
    if (item) atelierPreview.thumbnail(canvas, item.actor, item.bearing);
  }
  function paintThumbnails(container) {
    for (const canvas of container.querySelectorAll('canvas')) paintThumbnail(canvas);
  }
  const thumbnailSize = new ResizeObserver((changes) => {
    for (const { target } of changes) paintThumbnails(target);
  });
  thumbnailSize.observe($('look-shelf'));
  thumbnailSize.observe($('editor-fields'));
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
    mirror.show({
      actor,
      compare: other ? actorFor(other) : null,
      action,
      u: phase,
      bearing,
      view,
      detail: $('fine-face').checked
    });
  }
  function centimeters(doc, scale = doc.shape.height) {
    return Math.round(pineDesignerBody.standingHeight(doc.base, scale) * PineMotion.rig.centimetersPerUnit);
  }
  function measurements() {
    const other = compareDoc();
    $('stage-size').textContent =
      '站姿 ' + centimeters(draft) + ' cm' + (other ? ' · 对照 ' + centimeters(other) + ' cm' : '');
  }
  function orientation() {
    const dirs = ['正面', '正面偏侧', '侧面', '背面偏侧', '背面', '背面偏侧', '侧面', '正面偏侧'];
    $('angle-tag').textContent = dirs[Math.round(bearing / 45) % 8] + ' · ' + Math.round(bearing) + '°';
    $('bearing').value = Math.round(bearing);
    for (const b of document.querySelectorAll('[data-hair-angle]')) {
      const difference = Math.abs(((bearing - Number(b.dataset.hairAngle) + 540) % 360) - 180);
      b.setAttribute('aria-pressed', String(difference < 8));
    }
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
    $('mirror').dataset.framing = view;
    for (const b of document.querySelectorAll('[data-view]'))
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
    show();
  }
  function heading() {
    $('mirror-name').textContent = draft.label || '未命名形象';
    measurements();
    $('save-state').textContent = dirty ? '有未保存的修改' : saved ? '已保存' : '新形象';
    const profile = looks.bodyProfileOf(draft);
    for (const b of document.querySelectorAll('[data-body-profile]'))
      b.setAttribute('aria-pressed', String(b.dataset.bodyProfile === profile));
    $('legacy-body').hidden = profile !== null;
  }
  function refreshAction() {
    const available = [...PineMotion.actions.values()].filter((clip) => PineMotion.accepts(clip, 0, actor));
    $('action').replaceChildren(...available.map((clip) => new Option(clip.label, clip.id)));
    if (!available.some((clip) => clip.id === action)) action = 'idle';
    $('action').value = action;
  }
  function changed() {
    dirty = true;
    draft.packs[looks.core] = looks.editingRelease(draft);
    actor = looks.build({ ...draft, label: draft.label.trim() || '未命名形象' });
    heading();
    markPresets();
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
    const caption = document.createElement('span');
    caption.textContent = names[key];
    if (key !== 'height' && tabKeys.shape.includes(key)) {
      const limits = document.createElement('small');
      limits.className = 'slider-limits';
      limits.setAttribute('aria-hidden', 'true');
      limits.textContent = Math.round(min * 100) + '%–' + Math.round(max * 100) + '%';
      caption.append(limits);
    }
    label.append(caption, output, field);
    field.id = 'edit-' + key;
    field.type = 'range';
    field.min = min;
    field.max = max;
    field.step = key === 'mouthHeight' ? 0.05 : 0.01;
    field.value = draft.shape[key];
    output.htmlFor = field.id;
    function updateReadout() {
      const percentage = Math.round(draft.shape[key] * 100) + '%';
      const text =
        key === 'height'
          ? centimeters(draft) + ' cm · ' + percentage
          : (key === 'mouthHeight' && draft.shape[key] > 0 ? '+' : '') + percentage;
      output.value = text;
      field.setAttribute('aria-valuetext', text);
    }
    updateReadout();
    field.oninput = () => {
      draft.shape[key] = field.valueAsNumber;
      updateReadout();
      if (key === 'height' && view !== 'body') setView('body');
      changed();
    };
    if (key !== 'height') return label;
    const wrap = document.createElement('div'),
      stops = document.createElement('div');
    stops.className = 'height-stops';
    for (const [factor, name] of [
      [min, '最低'],
      [1, '基准'],
      [max, '最高']
    ]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = name + ' ' + centimeters(draft, factor) + ' cm';
      b.onclick = () => {
        field.value = factor;
        field.dispatchEvent(new Event('input'));
      };
      stops.append(b);
    }
    wrap.append(label, stops);
    return wrap;
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
  function markPresets() {
    const currentFace = draft.face || looks.facePresets.classic.face;
    for (const b of document.querySelectorAll('[data-face-preset]')) {
      const face = looks.facePresets[b.dataset.facePreset].face;
      b.setAttribute('aria-pressed', String(Object.keys(face).every((k) => face[k] === currentFace[k])));
    }
    for (const b of document.querySelectorAll('[data-outfit]')) {
      const outfit = looks.outfits[b.dataset.outfit];
      const match =
        Object.entries(outfit.parts).every(([k, v]) => draft.parts[k] === v) &&
        Object.entries(outfit.colors).every(([k, v]) => draft.colors[k] === v);
      b.setAttribute('aria-pressed', String(match));
    }
    for (const b of document.querySelectorAll('[data-hair-style]'))
      b.setAttribute('aria-pressed', String(b.dataset.hairStyle === draft.parts.hair));
    for (const b of document.querySelectorAll('[data-hair-color]'))
      b.setAttribute('aria-pressed', String(b.dataset.hairColor === draft.colors.hair));
  }
  function presetGroup(title, choices, type, apply) {
    const group = document.createElement('fieldset'),
      legend = document.createElement('legend'),
      row = document.createElement('div');
    group.className = 'preset-group';
    legend.textContent = title;
    row.className = 'preset-choices';
    group.append(legend, row);
    for (const [id, preset] of Object.entries(choices)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset[type] = id;
      if (type === 'outfit') {
        const palette = document.createElement('span');
        palette.className = 'fabric-swatch';
        palette.setAttribute('aria-hidden', 'true');
        for (const color of [preset.colors.top, preset.colors.bottom, preset.colors.accent]) {
          const chip = document.createElement('i');
          chip.style.backgroundColor = color;
          palette.append(chip);
        }
        button.append(palette);
      }
      button.append(preset.label);
      button.onclick = () => {
        if (button.getAttribute('aria-pressed') === 'true') return;
        apply(preset);
        changed();
        for (const select of $('editor-fields').querySelectorAll('select')) {
          const slot = select.id.slice(5);
          if (type === 'facePreset' && Object.hasOwn(preset.face, slot)) select.value = preset.face[slot];
          if (type === 'outfit' && Object.hasOwn(preset.parts, slot)) select.value = preset.parts[slot];
        }
      };
      row.append(button);
    }
    return group;
  }
  function headUpgrade(area) {
    if (draft.packs[looks.core] === looks.release) return;
    const update = document.createElement('button');
    update.type = 'button';
    update.id = 'update-head';
    update.textContent = '试用新版头发与五官';
    update.onclick = () => {
      draft.packs[looks.core] = looks.release;
      changed();
      fields();
    };
    area.append(update);
  }
  function faceFields(area) {
    headUpgrade(area);
    area.append(
      presetGroup('五官组合', looks.facePresets, 'facePreset', (p) => {
        draft.face = { ...p.face };
      })
    );
    const grid = document.createElement('div');
    grid.className = 'wardrobe-grid';
    const selected = draft.face || looks.facePresets.classic.face;
    for (const [key, choices] of Object.entries(looks.features)) {
      grid.append(
        picker(names[key], key, Object.entries(choices), selected[key], (value) => {
          draft.face = { ...(draft.face || looks.facePresets.classic.face), [key]: value };
        })
      );
    }
    area.append(grid, ...tabKeys.face.map(slider));
    markPresets();
  }
  function paintHairCards(cards, stagger = false) {
    cancelAnimationFrame(swatchFrame);
    const headVersion = looks.hasRoundedHead(draft) ? draft.packs[looks.core] : looks.hairRelease;
    const currentKey = JSON.stringify([
      headVersion,
      draft.base,
      draft.gender,
      draft.shape,
      draft.face,
      draft.colors
    ]);
    if (swatchKey !== currentKey) {
      swatchKey = currentKey;
      swatchActors.clear();
    }
    const pending = [];
    for (const button of cards.children) {
      const key = button.dataset.hairStyle;
      if (!swatchActors.has(key)) {
        const sample = {
          ...looks.templates[0],
          packs: { [looks.core]: headVersion },
          base: draft.base,
          gender: draft.gender ?? 'unspecified',
          shape: draft.shape,
          face: draft.face || looks.facePresets.classic.face,
          colors: draft.colors,
          parts: { ...looks.templates[0].parts, hair: key, neck: 'none', hat: 'none' }
        };
        swatchActors.set(key, looks.build(sample));
      }
      const canvas = button.querySelector('canvas');
      thumbnails.set(canvas, { actor: swatchActors.get(key), bearing: 140 });
      if (stagger && key !== draft.parts.hair) pending.push(canvas);
      else paintThumbnail(canvas);
    }
    // On a dye change the mirror and selected card update first. Let the picker
    // accept more input between the remaining voxel portraits.
    function nextCard() {
      if (!cards.isConnected) return;
      paintThumbnail(pending.shift());
      if (pending.length) swatchFrame = requestAnimationFrame(nextCard);
    }
    if (pending.length) swatchFrame = requestAnimationFrame(nextCard);
  }
  function colorInput(key, onUpdate) {
    const input = document.createElement('input');
    input.type = 'color';
    input.id = 'color-' + key;
    input.value = draft.colors[key];
    input.oninput = () => {
      if (draft.colors[key] === input.value) return;
      draft.colors[key] = input.value;
      changed();
      onUpdate?.();
    };
    input.onchange = input.oninput;
    return input;
  }
  function hairColorFields(cards) {
    const group = document.createElement('fieldset'),
      legend = document.createElement('legend');
    const options = document.createElement('div'),
      custom = document.createElement('div');
    const caption = document.createElement('label'),
      value = document.createElement('output');
    group.className = 'preset-group hair-dyes';
    legend.textContent = '发色';
    options.className = 'hair-color-options';
    custom.className = 'custom-hair-color';
    let timer;
    function refresh() {
      clearTimeout(timer);
      if (cards.isConnected) paintHairCards(cards, true);
    }
    const input = colorInput('hair', () => {
      value.value = draft.colors.hair.toUpperCase();
      clearTimeout(timer);
      cancelAnimationFrame(swatchFrame);
      timer = setTimeout(refresh, 110);
    });
    input.addEventListener('change', refresh);
    caption.htmlFor = input.id;
    caption.textContent = '自定义发色';
    value.htmlFor = input.id;
    value.value = draft.colors.hair.toUpperCase();
    custom.append(input, caption, value);
    for (const [name, color] of Object.entries(looks.hairColors)) {
      const button = document.createElement('button'),
        chip = document.createElement('i');
      button.type = 'button';
      button.dataset.hairColor = color;
      chip.style.backgroundColor = color;
      chip.setAttribute('aria-hidden', 'true');
      button.append(chip, name);
      button.onclick = () => {
        if (input.value === color) return;
        input.value = color;
        input.dispatchEvent(new Event('input'));
        refresh();
      };
      options.append(button);
    }
    group.append(legend, options, custom);
    return group;
  }
  function hairFields(area) {
    headUpgrade(area);
    const cards = document.createElement('div');
    cards.className = 'hair-cards';
    cards.setAttribute('role', 'group');
    cards.setAttribute('aria-label', '选择发型');
    area.append(hairColorFields(cards), cards);
    for (const [key, name] of Object.entries(looks.slots.hair)) {
      const button = document.createElement('button'),
        canvas = document.createElement('canvas');
      button.type = 'button';
      button.dataset.hairStyle = key;
      canvas.setAttribute('aria-hidden', 'true');
      button.append(canvas, name);
      cards.append(button);
      button.onclick = () => {
        if (draft.parts.hair !== key) {
          draft.parts.hair = key;
          changed();
        }
      };
    }
    paintHairCards(cards);
    const row = document.createElement('div'),
      caption = document.createElement('span');
    row.className = 'hair-angles';
    caption.textContent = '观察角度';
    row.append(caption);
    for (const [name, angle] of [
      ['正面', 0],
      ['侧面', 90],
      ['后侧', 140],
      ['背面', 180]
    ]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.hairAngle = String(angle);
      b.textContent = name;
      b.onclick = () => orbit(angle);
      row.append(b);
    }
    area.append(row);
    orientation();
    markPresets();
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
    if (tab === 'shape') {
      area.append(...tabKeys.shape.map(slider));
      return;
    }
    if (tab === 'face') {
      faceFields(area);
      return;
    }
    if (tab === 'hair') {
      hairFields(area);
      return;
    }
    if (tab === 'wear')
      area.append(
        presetGroup('整套穿搭', looks.outfits, 'outfit', (outfit) => {
          Object.assign(draft.parts, outfit.parts);
          Object.assign(draft.colors, outfit.colors);
        })
      );
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
      for (const pack of looks.catalog.values()) {
        if (pack.id === looks.core && pack.release !== draft.packs[looks.core]) continue;
        for (const p of pack.parts) {
          hats.push([
            pack.id + '/' + p.id + '@' + pack.release,
            p.label + (pack.id === looks.core ? '' : ' · ' + pack.release)
          ]);
        }
      }
      const hat = draft.parts.hat,
        owner = hat.split('/')[0];
      grid.append(
        picker('帽子', 'hat', hats, hat === 'none' ? 'none' : hat + '@' + draft.packs[owner], (v) => {
          const [qualified, release] = v.split('@'),
            packId = qualified.split('/')[0];
          draft.parts.hat = qualified;
          draft.packs = { [looks.core]: draft.packs[looks.core] };
          delete draft.embeddedPacks;
          if (qualified !== 'none' && packId !== looks.core) draft.packs[packId] = release;
        })
      );
      const button = document.createElement('button');
      button.className = 'pack-action';
      button.textContent = '导入帽饰包…';
      button.onclick = () => $('pack-file').click();
      area.append(button);
      markPresets();
    } else {
      grid.className = 'color-grid';
      for (const [key, text] of Object.entries(looks.colors)) {
        const label = document.createElement('label');
        label.append(colorInput(key), text);
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
        thumbnails.set(image, { actor: actorFor(doc), bearing: 24 });
        b.onclick = () => switchTo(() => activate(doc, key, section === '已保存'));
        if (key !== cardKey) compare.add(new Option(section + ' · ' + doc.label, key));
      }
    }
    paintThumbnails(root);
    if ([...compare.options].some((o) => o.value === previous)) compare.value = previous;
    measurements();
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
    const next = b.dataset.tab;
    if (next === 'hair' && tab !== 'hair') {
      priorAngle = bearing;
      bearing = hairAngle;
    }
    if (next !== 'hair' && tab === 'hair') {
      hairAngle = bearing;
      bearing = priorAngle;
    }
    if (next === 'face' && tab !== 'face') {
      if (!playing && action === 'idle') {
        bearing = 0;
        phase = 0;
      } else if (Math.cos((bearing * Math.PI) / 180) < 0) bearing = 18;
    }
    tab = next;
    orientation();
    fields();
    setView(tab === 'face' || tab === 'hair' ? 'face' : 'body');
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
  for (const b of document.querySelectorAll('[data-body-profile]'))
    b.onclick = () => {
      if (looks.bodyProfileOf(draft) === b.dataset.bodyProfile) return;
      draft = looks.withBodyProfile(draft, b.dataset.bodyProfile);
      changed();
      fields();
      refreshAction();
    };
  for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => setView(b.dataset.view);
  $('fine-face').onchange = show;
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
  $('compare').onchange = () => {
    measurements();
    show();
  };
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
  const query = new URLSearchParams(location.search);
  const first = looks.templates.find((doc) => doc.id === query.get('preset')) || looks.templates[0];
  activate(first, 'preset:' + first.id, false);
  const partner = looks.templates.find((doc) => doc.id !== first.id && doc.id === query.get('compare'));
  if (partner) {
    $('compare').value = 'preset:' + partner.id;
    measurements();
    show();
  }
  const openingTab = [...document.querySelectorAll('[data-tab]')].find(
    (b) => b.dataset.tab === query.get('tab')
  );
  if (openingTab) changeTab(openingTab);
  const requestedHair = query.get('hair');
  if (Object.hasOwn(looks.slots.hair, requestedHair) && requestedHair !== draft.parts.hair) {
    draft.parts.hair = requestedHair;
    changed();
  }
  const openingAngle = Number(query.get('bearing') || NaN);
  if (Number.isInteger(openingAngle) && openingAngle >= 0 && openingAngle <= 360) orbit(openingAngle);
  else orientation();
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
