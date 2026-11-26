(() => {
  const $ = (id) => document.getElementById(id),
    looks = PineLooks,
    wardrobe = PineWardrobe;
  const skipped = wardrobe.hydrate(),
    mirror = atelierPreview.create($('mirror'), PineMotion);
  const entries = new Map(),
    actors = new WeakMap(),
    clone = structuredClone;
  const cheekKeys = Object.keys(looks.morphs).filter((key) => key.startsWith('cheek'));
  const faceControls = { ...looks.morphs, ...looks.profileControls };
  const names = {
    ...Object.fromEntries(Object.entries(faceControls).map(([key, row]) => [key, row[0]])),
    height: '身高',
    shoulders: '肩宽',
    arms: '臂长',
    legs: '腿长',
    faceWidth: '脸宽',
    eyeSpacing: '眼距',
    jaw: '下颌宽度',
    chinHeight: '下巴高低',
    chinProjection: '下巴前后',
    chinRoundness: '下巴圆钝度',
    jawPosition: '下颌后角前后',
    jawAngle: '下颌后角高低',
    jawNeck: '颌颈接点前后',
    occiput: '后脑深度',
    headDepth: '头部前后径',
    faceRelief: '面部起伏',
    crownHeight: '眉上颅顶高度',
    headScale: '头部整体大小',
    trunkLength: '肩到骨盆的长度',
    noseLipSpacing: '鼻底到上唇的间距',
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
    hat: '帽子',
    bag: '背包与挎包',
    attachment: '包外挂',
    glasses: '眼镜',
    ears: '耳饰',
    wrist: '腕饰',
    bottle: '随身水壶',
    charm: '随身佩饰',
    implement: '手持物品',
    phone: '手机外壳',
    laptop: '笔记本外壳',
    outline: '脸型',
    iris: '虹膜纹理',
    complexion: '面部印记',
    makeup: '妆容',
    facialHair: '胡须',
    hairAccessory: '发饰',
    audio: '耳机与耳罩',
    belt: '腰带',
    brooch: '胸针',
    gloves: '手套'
  };
  const tabKeys = {
    shape: ['height', 'shoulders', 'arms', 'legs'],
    face: ['faceWidth', 'eyeSpacing', 'jaw', 'mouthHeight']
  };
  let draft,
    actor,
    tab = 'shape',
    view = 'body',
    showJawPoints = false,
    cardKey = '',
    saved = false,
    dirty = false;
  let action = 'idle',
    phase = 0.19,
    bearing = 24,
    playing = false,
    sculpting = false,
    frame = 0,
    stamp = null,
    lastSample = -1,
    drag = null;
  let hairGroup = '',
    comparisonSlot = 'eyes',
    paletteSlot = 'skin';
  let hairAngle = 140,
    priorAngle = 24,
    swatchKey = '',
    swatchFrame = 0;
  const draftKey = 'pinePixel.atelier.draft.v1';
  let transferredPartner;
  const readEdit = () => ({ doc: clone(draft), key: cardKey, dirty, saved });
  let previousEdit;
  const edits = PineWorkspace.editHistory(readEdit, state => {
    restoreEdit(state);
    note('已恢复形象编辑');
  });
  function restoreEdit(state) {
    const raw = state.doc;
    const doc = looks.prepare({ ...raw, label: raw.label.trim() || '未命名形象' }).recipe;
    activate(doc, state.key, state.saved, true, false);
    draft.label = raw.label;
    $('look-name').value = raw.label;
    dirty = state.dirty;
    previousEdit = null;
    heading();
  }
  function keepDraft() {
    if (!draft) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({
        ...readEdit(), tab, view, bearing, action, phase, compare: $('compare').value,
        fine: $('fine-face').checked, url: location.href
      }));
    } catch {}
  }
  window.addEventListener('pagehide', keepDraft);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keepDraft(); });
  const swatchActors = new Map(),
    thumbnails = new WeakMap();
  function paintThumbnail(canvas) {
    const item = thumbnails.get(canvas);
    if (item) atelierPreview.thumbnail(canvas, item.actor || actorFor(item.doc), item.bearing, item.view);
  }
  function paintThumbnails(container) {
    for (const canvas of container.querySelectorAll('canvas')) paintThumbnail(canvas);
  }
  const visibleShelfCards = new Set();
  const shelfVisibility = new IntersectionObserver(
    (changes) => {
      for (const { target, isIntersecting } of changes) {
        if (isIntersecting && target.isConnected) {
          visibleShelfCards.add(target);
          paintThumbnail(target);
        } else visibleShelfCards.delete(target);
      }
    },
    { rootMargin: '96px' }
  );
  const thumbnailSize = new ResizeObserver((changes) => {
    for (const { target } of changes) {
      if (target === $('look-shelf')) visibleShelfCards.forEach(paintThumbnail);
      else paintThumbnails(target);
    }
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
  function studyLens() {
    if (!draft) return;
    const paintedFace = draft.bodyFinish === 'painted' && looks.portraitStyleOf(draft) === 'animation';
    const namedPair = (query.get('study') === 'recipes' || Object.hasOwn(pineFigureModels,query.get('compare'))) &&
      $('compare').value === 'review:partner';
    const ordinaryFace = (tab === 'face' || view === 'face') && draft.packs[looks.core] === looks.release && looks.portraitStyleOf(draft) === 'animation';
    const before = namedPair ? 'recipes' : pinePortraitStyles.isStorybook(draft.face?.finish) ? draft.face.finish : ordinaryFace ? 'everyday' : draft.portraitInk && looks.portraitStyleOf(draft) === 'animation' ? (draft.faceSurface === 'contour' ? 'profile-line' : draft.faceSurface ? 'surface' : 'ink') :
      draft.base === 'baby' && draft.infantNose ? 'baby-nose' : draft.base === 'baby' && draft.packs[looks.core] === looks.chinPadRelease ? 'chin-pad' :
      draft.base === 'baby' && draft.packs[looks.core] === looks.infantChinRelease ? 'chin' :
      pinePortraitStyles.hasGarmentFits(draft.packs[looks.core]) ? 'garments' :
      draft.packs[looks.core] === looks.expressionRelease ? 'acting' :
      draft.packs[looks.core] === looks.figureRatioRelease ? 'ratios' :
      draft.packs[looks.core] === looks.featureStudyRelease ? 'features' :
      draft.packs[looks.core] === looks.clothingStudyRelease ? 'cut' :
      draft.packs[looks.core] === looks.baseFaceRelease && looks.portraitStyleOf(draft) === 'animation' ? 'bases' :
      draft.packs[looks.core] === looks.release || paintedFace ? 'whole' : 'current';
    $('figure-link').search = new URLSearchParams({ before, subject: 'draft', action, phase: String(phase * 100),
      bearing: String(((bearing % 360) + 360) % 360), framing: view === 'body' ? 'body' : 'head', size: '128' });
  }
  function studyLink() {
    if (!draft) return;
    const portable = looks.prepare({ ...draft, label: draft.label.trim() || '未命名形象' }).recipe;
    const packet = new URLSearchParams({ character: JSON.stringify(portable) });
    const other = compareDoc();
    if (other) packet.set('partner', JSON.stringify(looks.prepare(other).recipe));
    $('figure-link').hash = packet.toString();
    studyLens();
  }
  function show() {
    const other = compareDoc(),
      partner = other ? actorFor(other) : null,
      clip = PineMotion.actions.get(action);
    const line = $('action-partner');
    line.hidden = clip.roles.length !== 2;
    if (!line.hidden) {
      const cast = PineMotion.castFor(clip, actor, partner);
      const label = cast?.find((p) => p !== actor)?.label || '';
      const text = '试演搭档 · ' + label;
      if (line.textContent !== text) line.textContent = text;
    }
    mirror.show({
      actor,
      compare: partner,
      action,
      u: phase,
      bearing,
      view,
      detail: $('fine-face').checked,
      still: !playing && !sculpting,
      landmarks: showJawPoints && tab === 'face'
    });
  }
  $('editor-fields').addEventListener('pointerdown', (event) => {
    if (tab === 'face' && view === 'face' && event.target.matches('input[type="range"]')) sculpting = true;
  });
  function finishSculpting() {
    if (!sculpting) return;
    sculpting = false;
    show();
  }
  for (const event of ['pointerup', 'pointercancel', 'blur']) window.addEventListener(event, finishSculpting);
  function centimeters(doc, scale = doc.shape.height) {
    return Math.round(
      pineDesignerBody.standingHeight(doc.base, scale, looks.hasSculptedHead(doc),
        pinePortraitStyles.hasFigureRatios(doc.packs[looks.core]) ? doc.shape : undefined) *
        PineMotion.rig.centimetersPerUnit
    );
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
    for (const b of document.querySelectorAll('[data-hair-angle], [data-profile-angle], [data-art-angle]')) {
      const angle = Number(b.dataset.profileAngle ?? b.dataset.hairAngle ?? b.dataset.artAngle);
      const difference = Math.abs(((bearing - angle + 540) % 360) - 180);
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
    if (!playing) show();
    schedule();
  }
  function setView(next) {
    view = next;
    studyLens();
    $('mirror').dataset.framing = view;
    for (const b of document.querySelectorAll('[data-view]'))
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
    show();
  }
  function heading() {
    if (previousEdit && dirty && JSON.stringify(previousEdit.doc) !== JSON.stringify(draft)) {
      const field = document.activeElement;
      edits.record(previousEdit, field?.matches('input') ? field : null);
    }
    previousEdit = readEdit();
    $('mirror-name').textContent = draft.label || '未命名形象';
    $('portrait-style').value = looks.portraitStyleOf(draft);
    const ink = $('portrait-style').value === 'animation' && draft.portraitInk;
    $('try-ink').setAttribute('aria-pressed', String(!!ink));
    $('try-ink').textContent = ink ? '立绘五官 · ' + looks.portraitInks[ink] : '试用像素立绘五官';
    const trial = pinePortraitStyles.hasGameFace(draft.packs[looks.core]) && looks.portraitStyleOf(draft) === 'animation';
    $('anatomy-link').href = 'anatomy-study.html#' + new URLSearchParams({character: JSON.stringify(draft)});
    studyLink();
    $('try-figure').disabled = trial;
    $('try-figure').textContent = trial ? (pinePortraitStyles.hasBaseFace(draft.packs[looks.core]) ? '已启用分龄基础脸' : '已启用美术基础脸') : '试用动画美术脸型';
    measurements();
    $('save-state').textContent = dirty ? '有未保存的修改' : saved ? '已保存' : '新形象';
    $('save-state').dataset.dirty = String(dirty);
    const profile = looks.bodyProfileOf(draft);
    for (const b of document.querySelectorAll('[data-body-profile]'))
      b.setAttribute('aria-pressed', String(b.dataset.bodyProfile === profile));
    $('legacy-body').hidden = profile !== null;
  }
  function refreshAction() {
    const available = PineMotion.findActions(actor, { eitherRole: true }),
      groups = new Map();
    for (const clip of available) {
      if (!groups.has(clip.group)) {
        const g = document.createElement('optgroup');
        g.label = clip.group;
        groups.set(clip.group, g);
      }
      groups.get(clip.group).append(new Option(clip.label, clip.id));
    }
    $('action').replaceChildren(...groups.values());
    if (!available.some((clip) => clip.id === action)) action = 'idle';
    $('action').value = action;
  }
  function changed() {
    const candidates = $('face-candidates');
    if (candidates?.childElementCount) {
      candidates.replaceChildren();
      $('choose-faces').textContent = '挑一组脸';
    }
    dirty = true;
    draft.packs[looks.core] = looks.editingRelease(draft);
    const upgrade = $('update-head');
    if (upgrade) {
      if (!upgradeLabel()) upgrade.remove();
      else upgrade.textContent = upgradeLabel();
    }
    const previousTags = actor.tags.join(' ');
    actor = looks.build({ ...draft, label: draft.label.trim() || '未命名形象' });
    if (actor.tags.join(' ') !== previousTags) refreshAction();
    heading();
    markPresets();
    $('editor-fields')
      .querySelector('.feature-comparison[open]')
      ?.dispatchEvent(new Event('refresh-comparison'));
    show();
    note('');
  }
  function slider(key) {
    const blend = key === 'formMix';
    const [min, max, normal] = blend ? [0, 1, 1] : looks.figureRatioRanges[key] ?? looks.shape[key],
      label = document.createElement('label'),
      output = document.createElement('output'),
      field = document.createElement('input');
    label.className = 'slider-label';
    label.htmlFor = 'edit-' + key;
    const caption = document.createElement('span');
    caption.textContent = blend ? '脸型强度' : names[key];
    if ((key !== 'height' && tabKeys.shape.includes(key)) || looks.profileControls[key] || looks.figureRatioRanges[key]) {
      const limits = document.createElement('small');
      limits.className = 'slider-limits';
      limits.setAttribute('aria-hidden', 'true');
      limits.textContent = looks.profileControls[key]
        ? looks.profileControls[key].slice(1).join(' ↔ ')
        : Math.round(min * 100) + '%–' + Math.round(max * 100) + '%';
      caption.append(limits);
    }
    label.append(caption, output, field);
    field.id = 'edit-' + key;
    field.type = 'range';
    field.min = min;
    field.max = max;
    field.step = key === 'mouthHeight' || looks.jawControls.includes(key) ? 0.05 : 0.01;
    field.value = (blend ? draft.face : draft.shape)[key] ?? normal;
    output.htmlFor = field.id;
    function updateReadout() {
      const percentage = Math.round(field.valueAsNumber * 100) + '%';
      const text =
        key === 'height'
          ? centimeters(draft) + ' cm · ' + percentage
          : (key === 'mouthHeight' && draft.shape[key] > 0 ? '+' : '') + percentage;
      const endpoints = {
        chinHeight: ['低', '高'],
        chinProjection: ['后收', '前伸'],
        chinRoundness: ['尖', '圆'],
        jawPosition: ['靠后', '靠前'],
        jawAngle: ['低', '高'],
        jawNeck: ['靠后', '靠前']
      };
      const directions = faceControls[key]?.slice(1) || endpoints[key];
      if (directions) {
        const n = field.valueAsNumber;
        const neutral = looks.profileControls[key] ? '自然' : '居中';
        output.value = n === 0 ? neutral : directions[Number(n > 0)] + ' ' + Math.round(Math.abs(n) * 100) + '%';
        field.setAttribute('aria-valuetext', output.value);
        return;
      }
      output.value = text;
      field.setAttribute('aria-valuetext', text);
    }
    updateReadout();
    field.oninput = () => {
      (blend ? draft.face : draft.shape)[key] = field.valueAsNumber;
      updateReadout();
      if (key === 'height' && view !== 'body') setView('body');
      changed();
      if (key === 'occiput' && tab === 'hair')
        paintHairCards($('editor-fields').querySelector('.hair-cards'), true);
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
      const pin = draft.packs[looks.core];
      apply(field.value);
      changed();
      if (['feature-paint','infant-chin','infant-nose','portrait-ink','face-surface','clothing-cut'].includes(id) || (id === 'bottom' && pinePortraitStyles.hasGarmentFits(pin)) ||
          ((tab === 'wear' || tab === 'shape') && pin !== draft.packs[looks.core])) {
        fields();
        $('edit-' + id)?.focus({ preventScroll: true });
      }
    };
    label.append(caption, field);
    return label;
  }
  function markPresets() {
    const hasMorphs = looks.hasFacialMorphs(draft);
    const soften = $('soften-cheeks');
    if (soften) {
      soften.hidden = !hasMorphs;
      soften.disabled = !Object.keys(looks.cheekAdjustment(draft)).length;
    }
    for (const button of document.querySelectorAll('[data-cheek-preset]')) {
      const selected = looks.cheekPresets[button.dataset.cheekPreset].shape;
      button.setAttribute('aria-pressed', String(hasMorphs &&
        cheekKeys.every((k) => (draft.shape[k] || 0) === (selected[k] || 0))));
    }
    for (const b of document.querySelectorAll('[data-jaw-preset]')) {
      const p = looks.jawPresets[b.dataset.jawPreset];
      b.setAttribute(
        'aria-pressed',
        String(
          hasMorphs &&
            looks.jawControls.every((k) => (draft.shape[k] || 0) === (p.shape[k] || 0))
        )
      );
    }
    const currentFace = draft.face || looks.facePresets.classic.face;
    for (const b of document.querySelectorAll('[data-face-preset]')) {
      const preset = looks.infantFacePresets[b.dataset.facePreset] || looks.facePresets[b.dataset.facePreset];
      b.setAttribute('aria-pressed', String(Object.keys(preset.face).every((k) => preset.face[k] === currentFace[k]) &&
        looks.featureShapeKeys.every((k) => (draft.shape[k] || 0) === (preset.shape?.[k] || 0))));
    }
    for (const b of document.querySelectorAll('[data-outfit]')) {
      const outfit = looks.outfits[b.dataset.outfit];
      const match =
        Object.entries(outfit.parts).every(([k, v]) => draft.parts[k] === v) &&
        Object.entries(outfit.colors).every(([k, v]) => draft.colors[k] === v) &&
        (!Object.hasOwn(outfit.parts,'hat') ||
          (looks.carriedSlots.every((k) => draft.parts[k] === outfit.parts[k]) &&
            looks.outfitDyes.every((k) => draft.colors[k] === outfit.colors[k])));
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
        const workshop = Object.hasOwn(looks.workshopOutfits,id);
        if (workshop || Object.hasOwn(looks.collectionOutfits,id)) {
          group.classList.add(workshop ? 'workshop-outfits' : 'collection-outfits');
          const thumbnail = document.createElement('canvas');
          const model = looks.templateById.get((workshop ? 'look_workshop_' : 'look_') + id);
          thumbnail.setAttribute('aria-hidden', 'true');
          thumbnails.set(thumbnail, { actor: actorFor(model), bearing: 29, view: 'body' });
          button.append(thumbnail);
        }
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
        fields();
        const selector = type === 'outfit' ? 'data-outfit' : 'data-face-preset';
        document.querySelector('[' + selector + '="' + id + '"]')?.focus({ preventScroll: true });
      };
      row.append(button);
    }
    return group;
  }
  function upgradeLabel() {
    if (draft.packs[looks.core] === looks.release || pinePortraitStyles.hasTailoredFigure(draft.packs[looks.core])) return '';
    if (draft.packs[looks.core] === looks.pixelRelease) return '试用全身像素画风';
    if (draft.packs[looks.core] === looks.facePlaneRelease) return '试用像素笔触';
    if ([looks.illustratedRelease, looks.silhouetteRelease].includes(draft.packs[looks.core]))
      return draft.base === 'baby' ? '试用新版婴儿脸' : '试用新版侧脸';
    if (draft.packs[looks.core] === looks.lipJawRelease) return '试用游戏立绘';
    if (draft.packs[looks.core] === looks.naturalProfileRelease) return '试用嘴唇与下颌线';
    if (looks.hasInfantHead(draft))
      return draft.packs[looks.core] === looks.infantRelease ? '试用婴儿后脑曲线' : '试用嘴唇与下颌线';
    if (draft.base === 'baby') return '试用婴儿头型';
    if (looks.hasFacialMorphs(draft)) return '试用自然侧脸';
    if (draft.packs[looks.core] === looks.occipitalRelease) return '试用独立颧颊与五官';
    if (draft.packs[looks.core] === looks.sagittalRelease) return '试用微收后脑';
    if (draft.packs[looks.core] === looks.mandibleRelease) return '试用新侧面轮廓';
    if (draft.packs[looks.core] === looks.neckRelease) return '试用耳前下颌关节';
    if (draft.packs[looks.core] === looks.jawRelease) return '试用可调下颌';
    if (draft.packs[looks.core] === looks.volumeRelease) return '试用新下颌';
    return looks.hasSculptedHead(draft) ? '试用新下颌与立体短发' : '试用新头型与短发';
  }
  function figureUpgrade(area) {
    if (!upgradeLabel()) return;
    const update = document.createElement('button');
    update.type = 'button';
    update.id = 'update-head';
    update.textContent = upgradeLabel();
    update.onclick = () => {
      draft.packs[looks.core] = looks.release;
      changed();
      fields();
    };
    area.append(update);
  }
  const expandedFields = new Map();
  function foldFields(group) {
    const name = group.querySelector('legend').textContent;
    const section = document.createElement('details'), summary = document.createElement('summary');
    section.className = 'field-fold';
    section.dataset.fold = name;
    section.open = expandedFields.get(name) === true;
    summary.textContent = name;
    section.append(summary, group);
    section.ontoggle = () => { if (section.isConnected) expandedFields.set(name, section.open); };
    return section;
  }
  function revealField(el) {
    const section = el?.closest('details');
    if (section) {
      section.open = true;
      if (section.dataset.fold) expandedFields.set(section.dataset.fold, true);
    }
    return el;
  }
  function faceFields(area, candidates) {
    figureUpgrade(area);
    if ([looks.release,looks.infantNoseRelease].includes(draft.packs[looks.core]) && looks.portraitStyleOf(draft) === 'animation') {
      area.append(picker('面部画法','face-finish',Object.entries(looks.faceFinishes),
        draft.face?.finish || 'original',value=>{ draft = looks.withFaceFinish(draft,value); }));
    }
    const gameFace = pinePortraitStyles.hasGameFace(draft.packs[looks.core]) && looks.portraitStyleOf(draft) === 'animation';
    const drawn = gameFace && pinePortraitStyles.hasBaseFace(draft.packs[looks.core]);
    const ratioFit = pinePortraitStyles.hasFigureRatios(draft.packs[looks.core]);
    const acting = pinePortraitStyles.hasFacialActing(draft.packs[looks.core]);
    const painted = gameFace && pinePortraitStyles.hasPaintedFeatures(draft.packs[looks.core]);
    if (looks.portraitStyleOf(draft) === 'animation') area.append(picker('像素笔触', 'portrait-ink',
      [['','原有笔触'], ...Object.entries(looks.portraitInks)], draft.portraitInk || '',
      value => { draft = value ? looks.withPortraitInk(draft,value) : looks.withoutPortraitInk(draft); }));
    if (gameFace && draft.portraitInk) area.append(picker('眼眶与口周', 'face-surface',
      [['original','原有曲面'], ['linked','随眼距和嘴宽塑形'],['contour','唇到下巴的连续轮廓 · 试作']], draft.faceSurface || 'original',
      value => { draft = value === 'original' ? looks.withoutFaceSurface(draft) : looks.withFaceSurface(draft,undefined,value); }));
    if (draft.faceSurface && looks.portraitStyleOf(draft) === 'animation') area.append(picker('小尺寸唇线', 'sprite-mouth',
      [['','常规取样'],['accent','保留唇中央一笔']], draft.spriteMouth || '',
      value => { draft = looks.withFaceSurface(draft,value === 'accent'); }));
    area.append(picker('五官与比例', 'feature-paint', [['original','原有笔触'], ['painted','分龄像素笔触 · 1.19.6'], ['ratios','分龄笔触与可调比例 · 1.19.7'], ['acting','动作眼神与神情 · 1.19.8']],
      acting ? 'acting' : ratioFit ? 'ratios' : painted ? 'painted' : 'original', value => {
        if (value === 'acting') draft = looks.withExpressionStudy(draft);
        else if (value === 'ratios') draft = looks.withFigureRatios(draft);
        else if (value === 'painted') draft = looks.withFeatureStudy(draft);
        else draft = looks.withoutFeatureStudy(draft);
      }));
    if (draft.base === 'baby' && looks.portraitStyleOf(draft) === 'animation') area.append(
      picker('婴儿下巴', 'infant-chin', [
        ['prior','原有下巴'], ['soft',acting || pinePortraitStyles.ordinaryInfantChin(draft) ? '短圆下巴' : '分龄五官与短圆下巴'],
        ['pad','饱满小下巴'], ['round',draft.packs[looks.core] === looks.release && !pinePortraitStyles.ordinaryInfantChin(draft)
          ? '圆润下巴（柔和像素脸）' : '圆润下巴']
      ], ({original:'prior',short:'soft',full:'pad',round:'round'})[pinePortraitStyles.infantChinStyle(draft)],
      value => { draft = looks.withInfantChinStyle(draft, {prior:'original',soft:'short',pad:'full',round:'round'}[value]); }),
      picker('婴儿鼻部','infant-nose',[['prior','原有鼻形'],['nursery','浅鼻根与圆鼻头']],
        draft.infantNose || 'prior', value => { draft = value === 'nursery' ? looks.withInfantNose(draft) : looks.withoutInfantNose(draft); })
    );
    if (acting && gameFace) area.append(picker('平时神情', 'rest-expression',
      [['','随五官'], ...Object.entries(looks.restExpressions)], draft.face.restExpression || '', value => {
        if (value) draft.face.restExpression = value;
        else delete draft.face.restExpression;
      }));
    if (!drawn) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'try-base-face';
      button.textContent = '试用分龄基础脸';
      button.onclick = () => tryBaseFace();
      area.append(button);
    }
    if (gameFace) {
      const form = draft.face?.form ?? draft.anatomyParts?.skull ?? 'balanced';
      const mix = slider('formMix');
      const field = mix.querySelector('input');
      field.disabled = form === 'balanced';
      const choices = drawn ? looks.baseFaceForms(draft.base) : looks.gameFaceForms;
      area.append(picker(drawn ? '分龄基础脸' : '美术基础脸', 'face-form', Object.entries(choices), form, value => {
        draft.face.form = value;
        field.disabled = value === 'balanced';
      }), mix);
    }
    area.append(candidates || faceAudition());
    const guide = $('turnaround-guide').content.firstElementChild.cloneNode(true);
    const babyGuide = draft.base === 'baby' || draft.base === 'toddler';
    guide.dataset.sitter = babyGuide ? 'baby' : 'adult';
    if (pinePortraitStyles.hasPixelFace(draft.packs[looks.core]) && looks.portraitStyleOf(draft) === 'animation') {
      guide.dataset.art = 'pixel';
      const comparison = guide.querySelector('.guide-comparison');
      comparison.href = acting ? 'studies/pixel-structure/acting-faces.webp' : ratioFit ? 'studies/pixel-structure/figure-ratios.webp' : painted ? 'studies/pixel-structure/painted-features.webp' : drawn ? 'studies/pixel-structure/drawn-faces.webp' : gameFace ? 'studies/pixel-structure/game-faces.webp' : 'pixel-face-before-after.webp';
      comparison.textContent = '同一角色的两版实机对照';
      if (draft.portraitInk || (draft.base === 'baby' && draft.infantNose)) {
        comparison.href = 'studies/pixel-structure/' + (draft.portraitInk ? 'portrait-mouth.webp' : 'nursery-nose.webp');
        comparison.textContent = draft.portraitInk ? '随机人物的嘴与神情对照' : '婴儿鼻部三向对照';
      }
      if (draft.faceSurface) {
        comparison.href = 'studies/pixel-structure/face-surface.webp';
        comparison.textContent = '眼眶和嘴角的三向结构对照';
      }
    }
    guide.open = expandedFields.get('turnaround') === true;
    guide.ontoggle = () => { if (guide.isConnected) expandedFields.set('turnaround', guide.open); };
    for (const button of guide.querySelectorAll('[data-art-angle]')) {
      button.setAttribute('aria-label', (babyGuide ? '婴儿参考' : '成人参考') + '，转到' + button.textContent);
      button.onclick = () => { setView('face'); orbit(Number(button.dataset.artAngle)); };
    }
    area.append(guide);
    const contours = document.createElement('fieldset'), title = document.createElement('legend');
    contours.className = 'jaw-controls';
    title.textContent = '嘴唇与下颌线';
    const views = document.createElement('div');
    views.className = 'category-buttons';
    for (const [angle, label] of [[60, '斜侧 60°'], [90, '正侧 90°'], [270, '另一侧 270°']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.profileAngle = String(angle);
      button.onclick = () => { setView('face'); orbit(angle); };
      views.append(button);
    }
    contours.append(title, views, ...Object.keys(looks.profileControls).map(slider));
    area.append(contours);
    orientation();
    if (looks.hasInfantHead(draft))
      area.append(presetGroup('婴儿五官', looks.infantFacePresets, 'facePreset', (p) => looks.applyFacePreset(draft, p)));
    area.append(
      presetGroup('五官组合', looks.facePresets, 'facePreset', (p) => looks.applyFacePreset(draft, p))
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
    const more = document.createElement('fieldset'),
      legend = document.createElement('legend'),
      details = document.createElement('div');
    more.className = 'preset-group';
    legend.textContent = '脸型与细节';
    details.className = 'wardrobe-grid';
    for (const [slot, options] of Object.entries(looks.faceDetails))
      details.append(
        picker(
          names[slot],
          slot,
          [['', slot === 'outline' ? '原始轮廓' : '无'], ...Object.entries(options)],
          selected[slot] || '',
          (v) => {
            draft.face = { ...(draft.face || looks.facePresets.classic.face) };
            if (v) draft.face[slot] = v;
            else delete draft.face[slot];
          }
        )
      );
    more.append(legend, details);
    const jaw = document.createElement('fieldset'),
      jawTitle = document.createElement('legend'),
      buttons = document.createElement('div');
    jaw.className = 'jaw-controls';
    jawTitle.textContent = '下巴与下颌';
    buttons.className = 'category-buttons';
    jaw.append(jawTitle, buttons);
    for (const [id, preset] of Object.entries(looks.jawPresets)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.jawPreset = id;
      b.textContent = preset.label;
      b.setAttribute(
        'aria-pressed',
        String(looks.jawControls.every((k) => (draft.shape[k] || 0) === (preset.shape[k] || 0)))
      );
      b.onclick = () => {
        for (const key of looks.jawControls) delete draft.shape[key];
        Object.assign(draft.shape, preset.shape);
        if (!looks.hasFacialMorphs(draft)) draft.packs[looks.core] = looks.morphRelease;
        changed();
        fields();
      };
      buttons.append(b);
    }
    const side = document.createElement('button');
    side.type = 'button';
    side.textContent = '看侧面';
    side.onclick = () => {
      setView('face');
      orbit(90);
    };
    const profile = document.createElement('fieldset'), profileTitle = document.createElement('legend');
    profile.className = 'jaw-controls';
    profileTitle.textContent = '侧面轮廓';
    profile.append(profileTitle, slider('headDepth'), slider('faceRelief'), slider('occiput'), side);
    if (ratioFit) {
      profile.insertBefore(slider('crownHeight'), side);
      if (gameFace) profile.insertBefore(slider('noseLipSpacing'), side);
    }
    const cheeks = document.createElement('fieldset'), cheekTitle = document.createElement('legend');
    cheeks.className = 'jaw-controls';
    cheekTitle.textContent = '颧骨与脸颊';
    const presets = document.createElement('div');
    presets.className = 'category-buttons';
    for (const [id, choice] of Object.entries(looks.cheekPresets)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.cheekPreset = id;
      button.textContent = choice.label;
      button.onclick = () => {
        setCheeks(choice);
        fields();
      };
      presets.append(button);
    }
    const soften = document.createElement('button');
    soften.type = 'button';
    soften.id = 'soften-cheeks';
    soften.textContent = '收顺面颊';
    soften.title = '按当前脸型减轻嘴角外侧的鼓起';
    soften.onclick = () => {
      Object.assign(draft.shape, looks.cheekAdjustment(draft));
      changed();
      fields();
      note('已收顺嘴角外侧到下颌的轮廓。');
    };
    cheeks.append(cheekTitle, presets, soften, ...cheekKeys.map(slider));
    const facialControls = Object.entries({
      '眼睛与眉骨': ['eyeDepth', 'eyeWidth', 'eyeOpening', 'eyeTilt', 'browHeight'],
      '鼻梁与鼻翼': ['noseBridge', 'noseWidth'],
      '唇形与厚度': ['mouthWidth', 'upperLipFullness', 'lowerLipFullness']
    }).map(([label, keys]) => {
      const panel = document.createElement('details'), title = document.createElement('summary');
      panel.className = 'jaw-controls';
      title.textContent = label;
      panel.append(title, ...keys.map(slider));
      return panel;
    });
    if (actor.rig.jawPivot) {
      const trial = document.createElement('button');
      trial.type = 'button';
      trial.id = 'jaw-demo';
      trial.textContent = '侧面试张口';
      trial.onclick = () => {
        showJawPoints = true;
        toggle.checked = true;
        $('action').value = 'open-mouth';
        $('action').dispatchEvent(new Event('change'));
        setView('face');
        orbit(90);
        if (!playing) togglePlay();
      };
      buttons.append(trial);
    }
    const inspect = document.createElement('label'),
      toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = 'jaw-points';
    toggle.checked = showJawPoints;
    inspect.className = 'jaw-points';
    toggle.onchange = () => {
      showJawPoints = toggle.checked;
      if (toggle.checked) {
        setView('face');
        orbit(90);
      }
      show();
    };
    inspect.append(toggle, '显示接点');
    for (const [name, color] of [
      ...(actor.rig.jawPivot ? [['下颌关节 · 张口', '#326f59']] : []),
      ['颅底 · 点头', '#8e5c91'],
      ['颌颈转折', '#b76a3d'],
      ['领口', '#567f9a']
    ]) {
      const tag = document.createElement('span'),
        dot = document.createElement('i');
      dot.style.background = color;
      tag.append(dot, name);
      inspect.append(tag);
    }
    if (actor.rig.headPivot) jaw.append(inspect);
    jaw.append(...looks.jawControls.map(slider), slider('jaw'));
    area.append(grid, featureComparison(), ...tabKeys.face.filter(k => k !== 'jaw').map(slider),
      ...facialControls, ...[cheeks, jaw, profile, more].map(foldFields));
    markPresets();
  }
  function faceAudition() {
    const group = document.createElement('div'), actions = document.createElement('div'), cards = document.createElement('div');
    actions.className = 'category-buttons';
    cards.className = 'face-candidates';
    cards.id = 'face-candidates';
    const roll = document.createElement('button'), choose = document.createElement('button');
    roll.type = choose.type = 'button';
    roll.id = 'random-face';
    roll.textContent = '随机五官';
    roll.onclick = () => randomize(false);
    choose.id = 'choose-faces';
    choose.textContent = '挑一组脸';
    choose.setAttribute('aria-controls', cards.id);
    actions.append(roll, choose);
    group.append(actions, cards);
    let batch = 0;
    choose.onclick = () => {
      const portrait = $('portrait-style').value, style = $('random-style').value;
      const remaining = Object.keys(looks.portraitFamilies);
      cards.replaceChildren();
      choose.textContent = '换一组候选脸';
      const angles = document.createElement('div'), previews = [];
      angles.className = 'category-buttons candidate-angles';
      angles.setAttribute('role', 'group');
      angles.setAttribute('aria-label', '候选脸视角');
      cards.append(angles);
      const direction = bearing > 180 ? -1 : 1;
      for (const [degrees, label] of [[0, '正面'], [45, '斜侧面'], [90, '正侧面']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.candidateAngle = String(degrees);
        button.textContent = label;
        button.onclick = () => {
          const angle = (360 + direction * degrees) % 360;
          orbit(angle);
          render(angle);
        };
        angles.append(button);
      }
      for (let i = 0; i < 4; i++) {
        const family = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0];
        const doc = looks.randomFace(draft, { portrait, style, family });
        const button = document.createElement('button'), canvas = document.createElement('canvas');
        button.type = 'button';
        button.dataset.faceCandidate = String(i);
        button.setAttribute('aria-pressed', 'false');
        canvas.setAttribute('aria-hidden', 'true');
        button.append(canvas, portrait === 'natural' ? '方案 ' + (i + 1) : looks.portraitFamilies[family].label);
        button.onclick = () => {
          if (button.getAttribute('aria-pressed') === 'true') return;
          for (const option of cards.querySelectorAll('[data-face-candidate]')) option.setAttribute('aria-pressed', String(option === button));
          randomize(false, doc);
          button.focus({ preventScroll: true });
        };
        cards.append(button);
        previews.push({ canvas, doc });
      }
      function render(angle) {
        const token = ++batch, queue = previews.slice();
        const fromFront = Math.min(angle, 360 - angle);
        const nearest = Math.min(90, Math.round(fromFront / 45) * 45);
        for (const button of angles.children) button.setAttribute('aria-pressed', String(+button.dataset.candidateAngle === nearest));
        function paint() {
          if (token !== batch || !cards.isConnected || !queue.length) return;
          const item = queue.shift();
          if (!item.canvas.isConnected) return;
          item.actor ??= looks.build({ ...item.doc, label: item.doc.label.trim() || '候选脸' });
          thumbnails.set(item.canvas, { actor: item.actor, bearing: angle, view: 'face' });
          paintThumbnail(item.canvas);
          if (queue.length) requestAnimationFrame(paint);
        }
        requestAnimationFrame(paint);
      }
      render(Math.min(bearing, 360 - bearing) > 90 ? (360 + direction * 90) % 360 : bearing);
    };
    return group;
  }
  function featureComparison() {
    const panel = document.createElement('details'),
      summary = document.createElement('summary'),
      row = document.createElement('div'),
      cards = document.createElement('div');
    panel.className = 'feature-comparison';
    summary.textContent = '比较五官局部';
    row.className = 'category-buttons';
    cards.className = 'feature-cards';
    panel.append(summary, row, cards);
    let pending = 0,
      revision = '';
    function fill() {
      if (!panel.open || !panel.isConnected) return;
      const compared = { ...(draft.face || looks.facePresets.classic.face) };
      const chosen = compared[comparisonSlot];
      delete compared[comparisonSlot];
      const signature = JSON.stringify([
        comparisonSlot,
        compared,
        draft.shape,
        draft.parts,
        draft.colors,
        draft.packs,
        draft.base,
        draft.gender
      ]);
      if (revision === signature) {
        for (const b of cards.children)
          b.setAttribute('aria-pressed', String(b.dataset.featureValue === chosen));
        return;
      }
      cancelAnimationFrame(pending);
      revision = signature;
      cards.replaceChildren();
      for (const button of row.children)
        button.setAttribute('aria-pressed', String(button.dataset.compareSlot === comparisonSlot));
      for (const [value, label] of Object.entries(looks.features[comparisonSlot])) {
        const button = document.createElement('button'),
          canvas = document.createElement('canvas'),
          slot = comparisonSlot;
        button.type = 'button';
        button.dataset.featureValue = value;
        button.setAttribute(
          'aria-pressed',
          String((draft.face || looks.facePresets.classic.face)[slot] === value)
        );
        canvas.setAttribute('aria-hidden', 'true');
        button.append(canvas, label);
        cards.append(button);
        button.onclick = () => {
          const field = $('edit-' + slot);
          field.value = value;
          field.dispatchEvent(new Event('change'));
        };
      }
      const queue = [...cards.children];
      function render() {
        if (!panel.open || !panel.isConnected || !queue.length) return;
        const button = queue.shift(),
          sample = clone(draft);
        sample.face = {
          ...(draft.face || looks.facePresets.classic.face),
          [comparisonSlot]: button.dataset.featureValue
        };
        // Remove face coverings from the comparison crop. The mirror still shows the worn outfit.
        delete sample.parts.glasses;
        sample.packs[looks.core] = looks.editingRelease(sample);
        const preview = looks.build({ ...sample, label: sample.label.trim() || '试选' });
        atelierPreview.thumbnail(button.firstChild, preview, 0, comparisonSlot);
        if (queue.length) pending = requestAnimationFrame(render);
      }
      render();
    }
    for (const key of Object.keys(looks.features)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = names[key];
      b.dataset.compareSlot = key;
      b.onclick = () => {
        comparisonSlot = key;
        fill();
      };
      row.append(b);
    }
    panel.ontoggle = () => {
      if (panel.open) {
        revision = '';
        fill();
      } else cancelAnimationFrame(pending);
    };
    panel.addEventListener('refresh-comparison', fill);
    return panel;
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
      const canvas = button.querySelector('canvas');
      function draw() {
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
          sample.packs[looks.core] = looks.editingRelease(sample);
          swatchActors.set(key, looks.build(sample));
        }
        thumbnails.set(canvas, { actor: swatchActors.get(key), bearing: 140 });
        paintThumbnail(canvas);
      }
      if (stagger && key !== draft.parts.hair) {
        if (!thumbnails.has(canvas)) {
          canvas.width = Math.max(1, canvas.clientWidth);
          canvas.height = Math.max(1, canvas.clientHeight);
        }
        pending.push(draw);
      } else draw();
    }
    // On a dye change the mirror and selected card update first. Let the picker
    // accept more input between the remaining voxel portraits.
    function nextCard() {
      if (!cards.isConnected) return;
      pending.shift()();
      if (pending.length) swatchFrame = requestAnimationFrame(nextCard);
    }
    if (pending.length) swatchFrame = requestAnimationFrame(nextCard);
  }
  function colorInput(key, onUpdate) {
    const input = document.createElement('input');
    input.type = 'color';
    input.id = 'color-' + key;
    input.value = draft.colors[key] || looks.gearColor(draft.colors, key);
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
    figureUpgrade(area);
    const cards = document.createElement('div');
    cards.className = 'hair-cards';
    cards.setAttribute('role', 'group');
    cards.setAttribute('aria-label', '选择发型');
    const filters = document.createElement('div');
    filters.className = 'category-buttons';
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', '发型类别');
    if (!hairGroup) hairGroup = looks.hairGroups[draft.parts.hair] || '短发';
    for (const group of ['全部', '短发', '中长发', '束发', '卷发', '编发']) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = group;
      b.dataset.hairGroup = group;
      b.setAttribute('aria-pressed', String(group === hairGroup));
      b.onclick = () => {
        hairGroup = group;
        fields();
        document.querySelector('[data-hair-group="' + group + '"]')?.focus({ preventScroll: true });
      };
      filters.append(b);
    }
    area.append(slider('occiput'), filters, cards);
    for (const [key, name] of Object.entries(looks.slots.hair)) {
      if (hairGroup !== '全部' && looks.hairGroups[key] !== hairGroup) continue;
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
    paintHairCards(cards, true);
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
    area.insertBefore(row, filters);
    area.append(hairColorFields(cards));
    orientation();
    markPresets();
  }
  function garmentFields(area) {
    const pin = draft.packs[looks.core];
    const cut = looks.usesClothingCut(draft);
    const current = !cut ? 'original' : pinePortraitStyles.hasGarmentFits(pin) && draft.clothingCut !== 'age' ? 'patterns' : 'cut';
    area.append(picker('衣物轮廓', 'clothing-cut', [
      ['original','原有剪裁'], ['cut','分龄剪裁 · 1.19.5'], ['patterns','分款剪裁 · 1.19.9 试作']
    ], current, value => {
      if (pin === looks.release && draft.face?.finish && draft.face.finish !== 'original' && value !== 'original') {
        draft = looks.withFittedPortrait(draft);
        if (value === 'cut') draft.clothingCut = 'age';
      } else if (value === 'patterns') {
        if (pinePortraitStyles.hasInfantChin(pin)) delete draft.clothingCut;
        else draft = looks.withGarmentStudy(draft);
      } else if (pinePortraitStyles.hasInfantChin(pin)) {
        delete draft.garmentFit;
        draft.clothingCut = value === 'cut' ? 'age' : 'original';
      } else {
        if (pin === looks.garmentRelease) draft = looks.withoutGarmentStudy(draft);
        if (pinePortraitStyles.hasPaintedFeatures(draft.packs[looks.core])) {
          if (value === 'cut') delete draft.clothingCut;
          else draft.clothingCut = 'original';
        } else if (value === 'cut') draft = looks.withClothingStudy(draft);
        else draft.packs[looks.core] = looks.baseFaceRelease;
      }
    }));
    if (current !== 'patterns') return;
    for (const [slot, choices] of Object.entries(looks.garmentFits)) {
      if (slot === 'legs' && !pineFigurePaint.longPants.has(draft.parts.bottom)) continue;
      area.append(picker(slot === 'top' ? '上衣版型' : '裤腿版型', 'fit-'+slot,
        [['','随衣物'], ...Object.entries(choices)], draft.garmentFit?.[slot] || '', value => {
          if (value) (draft.garmentFit ??= {})[slot] = value;
          else if (draft.garmentFit) {
            delete draft.garmentFit[slot];
            if (!Object.keys(draft.garmentFit).length) delete draft.garmentFit;
          }
        }));
    }
  }
  function fields(candidates) {
    const area = $('editor-fields');
    area.replaceChildren();
    area.setAttribute('aria-labelledby', 'tab-' + tab);
    for (const b of document.querySelectorAll('[data-tab]')) {
      const active = b.dataset.tab === tab;
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
    }
    if (tab === 'shape') {
      figureUpgrade(area);
      garmentFields(area);
      if (pinePortraitStyles.hasStructureStudy(draft.packs[looks.core])) {
        const section = $('anatomy-fields').content.cloneNode(true);
        const grid = section.querySelector('.wardrobe-grid');
        const captions = { skull: '颅骨', torso: '躯干', arms: '手臂', legs: '腿部' };
        for (const [slot, options] of Object.entries(looks.anatomyParts)) {
          if (slot === 'skull' && pinePortraitStyles.hasGameFace(draft.packs[looks.core]) && looks.portraitStyleOf(draft) === 'animation') continue;
          grid.append(picker(captions[slot], 'anatomy-' + slot, Object.entries(options),
            draft.anatomyParts?.[slot] ?? 'balanced', value => {
              (draft.anatomyParts ??= {})[slot] = value;
            }));
        }
        if (pinePortraitStyles.hasGameFace(draft.packs[looks.core])) {
          section.querySelector('legend').textContent = '身体造型';
          grid.append(picker('身体着色', 'body-finish', [['', '原有着色'], ['painted', '四肢与衣边色块']],
            draft.bodyFinish || '', value => {
              if (value) draft.bodyFinish = value;
              else delete draft.bodyFinish;
            }));
        }
        area.append(section);
      }
      area.append(...tabKeys.shape.map(slider));
      if (pinePortraitStyles.hasFigureRatios(draft.packs[looks.core])) area.append(slider('headScale'), slider('trunkLength'));
      return;
    }
    if (tab === 'face') {
      faceFields(area, candidates);
      return;
    }
    if (tab === 'hair') {
      hairFields(area);
      return;
    }
    if (tab === 'wear') {
      wearFields(area);
      markPresets();
      return;
    }
    colorFields(area);
  }
  function colorFields(area) {
    figureUpgrade(area);
    const palette = document.createElement('fieldset'),
      legend = document.createElement('legend'),
      tabs = document.createElement('div'),
      swatches = document.createElement('div');
    palette.className = 'preset-group';
    legend.textContent = '预设色卡';
    tabs.className = 'category-buttons';
    swatches.className = 'hair-color-options';
    const colorNames = { ...looks.colors, ...looks.portraitColors, ...looks.gearColors };
    const palettes = { ...looks.colorPresets, hair: looks.hairColors };
    function refresh() {
      swatches.replaceChildren();
      for (const b of tabs.children)
        b.setAttribute('aria-pressed', String(b.dataset.palette === paletteSlot));
      for (const [label, value] of Object.entries(palettes[paletteSlot])) {
        const b = document.createElement('button'),
          chip = document.createElement('i');
        b.type = 'button';
        b.dataset.swatch = value;
        b.setAttribute(
          'aria-pressed',
          String((draft.colors[paletteSlot] || looks.gearColor(draft.colors, paletteSlot)) === value)
        );
        chip.setAttribute('aria-hidden', 'true');
        chip.style.backgroundColor = value;
        b.append(chip, label);
        b.onclick = () => {
          const field = $('color-' + paletteSlot);
          field.value = value;
          field.dispatchEvent(new Event('input'));
        };
        swatches.append(b);
      }
    }
    for (const key of Object.keys(palettes)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.palette = key;
      b.textContent = colorNames[key];
      b.onclick = () => {
        paletteSlot = key;
        refresh();
      };
      tabs.append(b);
    }
    palette.append(legend, tabs, swatches);
    area.append(palette);
    const sections = [
      ['人物配色', ['skin', 'hair', 'eyes', ...Object.keys(looks.portraitColors)]],
      ['衣物配色', ['top', 'bottom', 'shoes', 'accent', 'hat']],
      ['配件配色', Object.keys(looks.gearColors).filter((k) => k !== 'hat')]
    ];
    for (const [caption, keys] of sections) {
      const section = document.createElement('fieldset'),
        title = document.createElement('legend'),
        grid = document.createElement('div');
      section.className = 'preset-group';
      title.textContent = caption;
      grid.className = 'color-grid';
      for (const key of keys) {
        const item = document.createElement('div'),
          label = document.createElement('label'),
          reset = document.createElement('button');
        item.className = 'dye-setting';
        const input = colorInput(key, () => {
          reset.disabled = false;
          for (const inherited of Object.keys({ ...looks.portraitColors, ...looks.gearColors })) {
            const field = $('color-' + inherited);
            if (field && !Object.hasOwn(draft.colors, inherited))
              field.value = looks.gearColor(draft.colors, inherited);
          }
          if (paletteSlot === key) refresh();
        });
        label.append(input, colorNames[key]);
        item.append(label);
        if (!Object.hasOwn(looks.colors, key)) {
          reset.type = 'button';
          reset.textContent = '↺';
          reset.title = '恢复默认' + colorNames[key];
          reset.setAttribute('aria-label', reset.title);
          reset.disabled = !Object.hasOwn(draft.colors, key);
          reset.onclick = () => {
            delete draft.colors[key];
            input.value = looks.gearColor(draft.colors, key);
            reset.disabled = true;
            changed();
            if (paletteSlot === key) refresh();
          };
          item.append(reset);
        }
        grid.append(item);
      }
      section.append(title, grid);
      area.append(section);
    }
    refresh();
  }
  function selectHat(value) {
    const [qualified, version] = value.split('@'), owner = qualified.split('/')[0];
    draft.parts.hat = qualified;
    draft.packs = { [looks.core]: draft.packs[looks.core] };
    delete draft.embeddedPacks;
    if (qualified !== 'none' && owner !== looks.core) draft.packs[owner] = version;
  }
  function wearFields(area) {
    figureUpgrade(area);
    const apply = (outfit) => looks.applyOutfit(draft, outfit);
    const featured = presetGroup('工坊同款', looks.workshopOutfits, 'outfit', apply);
    area.append(featured);
    paintThumbnails(featured);
    const collection = presetGroup('形象库穿搭', looks.collectionOutfits, 'outfit', apply);
    area.append(collection);
    paintThumbnails(collection);
    const everyday = Object.fromEntries(
      Object.entries(looks.outfits).filter(([id]) => !Object.hasOwn(looks.workshopOutfits,id) && !Object.hasOwn(looks.collectionOutfits,id))
    );
    area.append(presetGroup('日常穿搭', everyday, 'outfit', apply));
    function group(title) {
      const section = document.createElement('fieldset'),
        legend = document.createElement('legend'),
        grid = document.createElement('div');
      section.className = 'preset-group wear-section';
      legend.textContent = title;
      grid.className = 'wardrobe-grid';
      section.append(legend, grid);
      area.append(foldFields(section));
      return grid;
    }
    const clothing = group('服装与鞋帽');
    garmentFields(clothing);
    for (const [slot, options] of Object.entries(looks.slots)) {
      clothing.append(
        picker(names[slot], slot, Object.entries(options), draft.parts[slot], (v) => {
          draft.parts[slot] = v;
          if (slot === 'hair') hairGroup = looks.hairGroups[v];
        })
      );
    }
    const pin = draft.packs[looks.core],
      hats = [['none', '无帽饰']];
    const pinnedHats = looks.catalog.get(looks.core + '@' + pin).parts;
    for (const pack of looks.catalog.values()) {
      if (pack.id === looks.core && pack.release !== looks.release) continue;
      for (const p of pack.parts) {
        const version = pack.id === looks.core && pinnedHats.some((h) => h.id === p.id) ? pin : pack.release;
        hats.push([
          pack.id + '/' + p.id + '@' + version,
          p.label + (pack.id === looks.core ? '' : ' · ' + pack.release)
        ]);
      }
    }
    const hat = draft.parts.hat;
    clothing.append(
      picker(
        '帽子',
        'hat',
        hats,
        hat === 'none' ? hat : hat + '@' + draft.packs[hat.split('/')[0]],
        selectHat
      )
    );
    const head = group('头部配件'),
      gear = group('随身与衣物配件'),
      devices = group('动作道具');
    for (const [slot, options] of Object.entries(looks.wearables)) {
      const device = slot === 'phone' || slot === 'laptop';
      (device ? devices : ['glasses', 'ears', 'audio', 'hairAccessory'].includes(slot) ? head : gear).append(
        picker(
          names[slot],
          slot,
          [['', device ? '工坊原款' : '无'], ...Object.entries(options)],
          draft.parts[slot] || '',
          (v) => {
            if (v) draft.parts[slot] = v;
            else delete draft.parts[slot];
          }
        )
      );
    }
    const actions = document.createElement('div');
    actions.className = 'wear-actions';
    for (const [clip, label] of [
      ['drink', '试演喝水'],
      ['phone', '试演手机'],
      ['type', '试演打字']
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.tryAction = clip;
      button.onclick = () => {
        $('action').value = clip;
        $('action').dispatchEvent(new Event('change'));
        $('mirror').scrollIntoView({ block: 'nearest' });
      };
      actions.append(button);
    }
    devices.parentNode.append(actions);
    const button = document.createElement('button');
    button.className = 'pack-action';
    button.textContent = '导入帽饰包…';
    button.onclick = () => $('pack-file').click();
    area.append(button);
  }
  let randomOrigin = null;
  function activate(doc, key, isSaved, keepId = false, resetEdits = true) {
    if (resetEdits) edits.clear();
    previousEdit = null;
    randomOrigin = null;
    $('undo-random').hidden = true;
    draft = clone(doc);
    hairGroup = looks.hairGroups[draft.parts.hair] || '短发';
    if (!isSaved && !keepId) draft.id = looks.newId();
    saved = isSaved;
    dirty = false;
    cardKey = key;
    actor = looks.build(draft);
    $('look-name').value = draft.label;
    $('look-era').value = draft.identity?.era || '';
    $('look-role').value = draft.identity?.role || '';
    $('look-field').value = draft.identity?.field || '';
    $('look-series').value = draft.identity?.series || '';
    for (const box of $('look-settings').querySelectorAll('input')) box.checked=!!draft.identity?.settings?.includes(box.value);
    heading();
    fields();
    refreshAction();
    shelf();
    show();
    note('');
  }
  function setCheeks(choice) {
    for (const key of cheekKeys) delete draft.shape[key];
    Object.assign(draft.shape, choice.shape);
    if (!looks.hasFacialMorphs(draft)) draft.packs[looks.core] = looks.morphRelease;
    changed();
  }
  function randomize(whole, candidate) {
    const origin = randomOrigin || { doc: clone(draft), key: cardKey, saved, dirty };
    const style = $('random-style').value, portrait = $('portrait-style').value;
    if (whole) {
      const locks = [...document.querySelectorAll('[data-random-lock]:checked')].map((el) => el.dataset.randomLock);
      const prior = readEdit();
      activate(looks.randomCharacter({ source: draft, style, portrait, locks }), '', false, true, false);
      edits.record(prior);
    } else {
      const gallery = candidate ? $('face-candidates').parentElement : null;
      if (candidate) {
        // Keep the same four faces available for comparison while the editor rebuilds the sliders.
        gallery.remove();
        const body = Object.fromEntries(tabKeys.shape.map(key => [key, draft.shape[key]]));
        draft = { ...draft, face: clone(candidate.face), shape: { ...candidate.shape, ...body },
          packs: { ...draft.packs, [looks.core]: candidate.packs[looks.core] } };
        if (candidate.infantChin) draft.infantChin = candidate.infantChin;
        else delete draft.infantChin;
        if (candidate.portraitInk) draft.portraitInk = candidate.portraitInk;
        else delete draft.portraitInk;
        if (candidate.faceSurface) draft.faceSurface = candidate.faceSurface;
        else delete draft.faceSurface;
        if (candidate.spriteMouth) draft.spriteMouth = candidate.spriteMouth;
        else delete draft.spriteMouth;
      } else draft = looks.randomFace(draft, { style, portrait });
      changed();
      fields(gallery);
    }
    randomOrigin = origin;
    $('undo-random').hidden = false;
    dirty = true;
    heading();
  }
  function tryFigure() {
    if (pinePortraitStyles.hasGameFace(draft.packs[looks.core])) {
      if (looks.portraitStyleOf(draft) === 'animation') return;
      looks.setPortraitStyle(draft,'animation');
    } else draft = looks.withGameFace(draft);
    changed();
    fields();
  }
  function tryBaseFace(form) {
    const pin = draft.packs[looks.core], cut = draft.clothingCut, shape = draft.shape, rest = draft.face?.restExpression;
    const savedOptions = Object.fromEntries(['garmentFit','portraitInk','faceSurface','spriteMouth','infantNose','infantChin'].filter(key => draft[key]).map(key => [key,draft[key]]));
    draft = looks.withBaseFace(draft, form);
    if (pinePortraitStyles.hasClothingStudy(pin)) draft.packs[looks.core] = pin;
    if (pinePortraitStyles.hasFigureRatios(pin)) draft.shape = shape;
    if (pinePortraitStyles.hasFacialActing(pin) && rest) draft.face.restExpression = rest;
    Object.assign(draft,savedOptions);
    if (cut) draft.clothingCut = cut;
    changed();
    fields();
  }
  $('try-figure').onclick = tryFigure;
  $('try-ink').onclick = () => {
    draft = draft.portraitInk && looks.portraitStyleOf(draft) === 'animation' ? looks.withoutPortraitInk(draft) : looks.withFaceSurface(draft);
    changed();
    fields();
  };
  $('random-character').onclick = () => randomize(true);
  $('portrait-style').onchange = () => {
    looks.setPortraitStyle(draft, $('portrait-style').value);
    changed();
    fields();
  };
  $('undo-random').onclick = () => {
    if (!randomOrigin) return;
    const origin = randomOrigin;
    activate(origin.doc, origin.key, origin.saved, true);
    dirty = origin.dirty;
    heading();
  };
  function galleryEntries() {
    return [
      ...[...wardrobe.saved].reverse().map(([id,doc]) => ['saved:'+id,doc]),
      ...looks.templates.map(doc => ['preset:'+doc.id,doc])
    ];
  }
  const gallery = pineCharacterGallery.create({
    getEntries: galleryEntries,
    observe(canvas,doc,view) {
      thumbnails.set(canvas, {doc,bearing:334,view});
      shelfVisibility.observe(canvas);
    },
    resetImages() { shelfVisibility.disconnect(); visibleShelfCards.clear(); },
    select(doc,key) {
      switchTo(() => {
        activate(doc,key,key.startsWith('saved:'));
        PineWorkspace.openTool('person-edit',true);
      });
    }
  });
  function shelf() {
    entries.clear();
    const compare = $('compare'), previous=compare.value;
    compare.replaceChildren(new Option('无对照',''));
    if (transferredPartner) {
      entries.set('review:partner',transferredPartner);
      compare.add(new Option('随配方带入 · '+transferredPartner.label,'review:partner'));
    }
    for (const [key,doc] of galleryEntries()) {
      entries.set(key,doc);
      if (key!==cardKey) compare.add(new Option((key.startsWith('saved:') ? '已保存' : PineWorld.realms[doc.identity?.era || 'modern'])+' · '+doc.label,key));
    }
    if (entries.has(previous) && previous!==cardKey) compare.value=previous;
    measurements();
    gallery.refresh(cardKey);
  }
  function save(copy = false) {
    if (!validName()) return;
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
      other = compareDoc(),
      otherActor = other ? actorFor(other) : null;
    const cast = PineMotion.castFor(clip, actor, otherActor),
      docs = [draft];
    const ids = cast.map((person) => {
      if (person === actor) return draft.id;
      if (other && person === otherActor) {
        const doc = other.id === draft.id ? { ...other, id: looks.newId() } : other;
        docs.push(doc);
        return doc.id;
      }
      return person.id;
    });
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
    if (pendingSwitch && $('switch-dialog').returnValue === 'save' && report(() => save())) report(pendingSwitch);
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
    };
  for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => setView(b.dataset.view);
  $('fine-face').onchange = show;
  for (const [id,label] of Object.entries(PineWorld.realms)) $('look-era').add(new Option(label,id));
  for (const [id,label] of Object.entries(looks.library.fields)) $('look-field').add(new Option(label,id));
  for (const [id,label] of Object.entries(looks.library.series)) $('look-series').add(new Option(label,id));
  for (const [id,label] of Object.entries(looks.library.settings)) {
    const item=document.createElement('label'), box=document.createElement('input');
    box.type='checkbox'; box.value=id; item.append(box,document.createTextNode(label)); $('look-settings').append(item);
  }
  const roles=new Set(looks.templates.map(item=>item.identity?.role).filter(Boolean));
  for (const role of roles) $('role-options').append(new Option(role,role));
  function editIdentity() {
    const era = $('look-era').value,
      role = $('look-role').value.trim();
    const field = $('look-field').value, series = $('look-series').value;
    const settings = [...$('look-settings').querySelectorAll('input:checked')].map(box => box.value);
    const identity = { ...(era && {era}), ...(role && {role}), ...(field && {field}), ...(series && {series}), ...(settings.length && {settings}) };
    if (Object.keys(identity).length) draft.identity = identity;
    else delete draft.identity;
    draft.packs[looks.core] = looks.editingRelease(draft);
    dirty = true;
    heading();
  }
  $('look-era').onchange = editIdentity;
  $('look-role').oninput = editIdentity;
  $('look-field').onchange = editIdentity;
  $('look-series').onchange = editIdentity;
  $('look-settings').onchange = editIdentity;
  $('look-name').oninput = () => {
    draft.label = $('look-name').value;
    dirty = true;
    heading();
  };
  $('action').onchange = () => {
    action = $('action').value;
    phase = action === 'drink' ? 0.51 : PineMotion.actions.get(action).roles.length === 2 ? 0.48 : 0.37;
    stamp = null;
    studyLens();
    show();
  };
  $('compare').onchange = () => {
    measurements();
    studyLink();
    show();
  };
  $('play-look').onclick = togglePlay;
  function orbit(angle) {
    bearing = angle;
    studyLens();
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
      if (!validName()) return;
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
  function validName() {
    const el = $('look-name');
    if (el.validity.valid && el.value.trim()) return true;
    PineWorkspace.openTool('person-edit');
    el.focus();
    if (!el.reportValidity() || !el.value.trim()) note('请输入角色名。', true);
    return false;
  }
  function transfer(e, write) {
    try {
      if (!validName() || (write && !save())) {
        e.preventDefault();
        return;
      }
      const data = score();
      if (write) {
        const destination = new URL(e.currentTarget.href);
        destination.searchParams.set('person', draft.id);
        e.currentTarget.href = destination;
      }
      if (write) wardrobe.handoff(e.currentTarget, data.score, data.docs);
      else wardrobe.preview(e.currentTarget, data.score, phase * PineMotion.actions.get(action).seconds, playing, data.docs);
    } catch (error) {
      e.preventDefault();
      note(error.message, true);
    }
  }
  $('studio-link').onclick = (e) => transfer(e, true);
  $('three-link').onclick = (e) => transfer(e, false);
  for (const event of ['focus','pointerdown','click','auxclick','contextmenu'])
    $('figure-link').addEventListener(event, studyLink);
  document.addEventListener('visibilitychange', () => {
    stamp = null;
    schedule();
  });
  const queryField = $('style-query'),
    searchPanel = $('style-results'),
    matches = $('style-matches');
  const aliases = {
    eyes: '眼睛 眼皮 眼尾',
    brows: '眉毛',
    nose: '鼻子 鼻尖 鼻梁',
    mouth: '嘴 嘴巴 嘴唇',
    iris: '眼珠 瞳孔 虹膜',
    complexion: '皮肤 印记',
    facialHair: '胡子 胡须',
    makeup: '化妆 彩妆',
    hair: '头发 发型',
    hairAccessory: '头饰 发饰 发夹',
    ears: '耳环 耳钉 耳坠',
    wrist: '手链 手镯 手表',
    audio: '耳机 耳罩 助听器',
    bag: '包 背包 挎包',
    top: '服饰 服装 衣服 上装',
    bottom: '服饰 裤子 裙子',
    shoes: '鞋子 鞋靴',
    neck: '项链 围巾 领带',
    hat: '帽饰 帽子',
    gloves: '手套'
  };
  function searchStyles() {
    matches.replaceChildren();
    const words = queryField.value.normalize('NFKC').trim().toLowerCase().split(/\s+/).filter(Boolean);
    searchPanel.hidden = !words.length;
    if (!words.length) return;
    const results = [];
    function collect(slot, value, label, tab, caption = names[slot], hint = '') {
      const haystack = [label, caption, value, slot, aliases[slot], hint]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (words.every((word) => haystack.includes(word)))
        results.push({
          slot,
          value,
          label,
          tab,
          caption,
          rank: words.every((w) => label.toLowerCase().includes(w)) ? 0 : 1
        });
    }
    for (const [slot, options] of Object.entries({
      ...looks.features,
      ...looks.faceDetails,
      ...looks.slots,
      ...looks.wearables
    })) {
      const dest =
        Object.hasOwn(looks.features, slot) || Object.hasOwn(looks.faceDetails, slot)
          ? 'face'
          : slot === 'hair'
            ? 'hair'
            : 'wear';
      const category =
        dest === 'face'
          ? '五官 脸部'
          : slot === 'hair'
            ? ''
            : Object.hasOwn(looks.wearables, slot) || slot === 'neck'
              ? '配饰 配件'
              : '服饰 衣物';
      for (const [id, label] of Object.entries(options))
        collect(slot, id, label, dest, names[slot], slot === 'hair' ? looks.hairGroups[id] : category);
    }
    for (const pack of looks.catalog.values()) {
      if (pack.id === looks.core && pack.release !== looks.release) continue;
      for (const h of pack.parts) collect('hat', pack.id + '/' + h.id + '@' + pack.release, h.label, 'wear');
    }
    for (const [id, outfit] of Object.entries(looks.outfits))
      collect('outfit', id, outfit.label, 'wear', '成套穿搭');
    for (const [id, p] of Object.entries(looks.facePresets))
      collect('facePreset', id, p.label, 'face', '五官组合');
    for (const [key, [label, low, high]] of Object.entries(faceControls))
      collect('morph', key, label, 'face', '五官微调', low + ' ' + high);
    for (const [id, preset] of Object.entries(looks.cheekPresets))
      collect('cheekPreset', id, preset.label, 'face', '颧骨与脸颊');
    for (const [name, id] of Object.entries(looks.hairColors)) collect('hairColor', id, name, 'hair', '发色');
    for (const [slot, swatches] of Object.entries(looks.colorPresets))
      for (const [label, value] of Object.entries(swatches))
        collect(
          'color-' + slot,
          value,
          label,
          'colors',
          looks.colors[slot] || looks.portraitColors[slot],
          '配色'
        );
    results.sort((a, b) => a.rank - b.rank);
    $('style-count').textContent = results.length ? '找到 ' + results.length + ' 款' : '没有匹配的款式';
    let offset = 0;
    function display() {
      matches.querySelector('.more-results')?.remove();
      for (const item of results.slice(offset, offset + 12)) {
        const b = document.createElement('button'),
          part = document.createElement('small');
        b.type = 'button';
        b.dataset.match = item.slot + '/' + item.value;
        part.textContent = item.caption;
        b.append(item.label, part);
        b.onclick = () => {
          queryField.value = '';
          searchStyles();
          if (item.slot === 'hair') hairGroup = looks.hairGroups[item.value];
          if (tab !== item.tab) changeTab($('tab-' + item.tab));
          else if (item.slot === 'hair') fields();
          if (item.slot.startsWith('color-')) {
            const key = item.slot.slice(6);
            document.querySelector('[data-palette="' + key + '"]')?.click();
            const field = $(item.slot);
            field.value = item.value;
            field.dispatchEvent(new Event('input'));
            field.focus({ preventScroll: true });
            return;
          }
          if (item.slot === 'morph') {
            const field = revealField($('edit-' + item.value));
            field.focus();
            return;
          }
          const data = {
            hair: 'hair-style',
            outfit: 'outfit',
            facePreset: 'face-preset',
            cheekPreset: 'cheek-preset',
            hairColor: 'hair-color'
          }[item.slot];
          if (data) {
            const option = document.querySelector('[data-' + data + '="' + item.value + '"]');
            revealField(option)?.click();
            document
              .querySelector('[data-' + data + '="' + item.value + '"]')
              ?.focus({ preventScroll: true });
          } else {
            let field = $('edit-' + item.slot),
              value = item.value;
            if (item.slot === 'hat' && value.startsWith(looks.core + '/'))
              value = [...field.options].find((o) => o.value.split('@')[0] === value.split('@')[0])?.value;
            if (!field || !value) return;
            field.value = value;
            revealField(field).dispatchEvent(new Event('change'));
            $('edit-' + item.slot)?.focus({ preventScroll: true });
          }
        };
        matches.append(b);
      }
      offset += 12;
      if (offset < results.length) {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'more-results';
        more.textContent = '显示更多';
        more.onclick = display;
        matches.append(more);
      }
    }
    display();
  }
  queryField.oninput = searchStyles;
  queryField.onkeydown = (e) => {
    if (e.key === 'Escape') {
      queryField.value = '';
      searchStyles();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      matches.querySelector('button')?.focus();
    }
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      matches.querySelector('button')?.click();
    }
  };
  const query = new URLSearchParams(location.search);
  showJawPoints = query.get('points') === '1';
  const stored = wardrobe.saved.get(query.get('saved'));
  let transferredLook;
  try {
    const packet = new URLSearchParams(location.hash.slice(1));
    if (packet.has('character')) {
      transferredLook = looks.prepare(JSON.parse(packet.get('character'))).recipe;
      for (const pack of transferredLook.embeddedPacks || []) wardrobe.installPack(pack, false);
      if (packet.has('partner')) transferredPartner = looks.prepare(JSON.parse(packet.get('partner'))).recipe;
    }
  } catch (e) {
    note(e.message, true);
  }
  const first =
    transferredLook ||
    stored ||
    (Object.hasOwn(pineFigureModels, query.get('model')) && pineFigureModels[query.get('model')]) ||
    looks.templates.find((doc) => doc.id === query.get('preset')) ||
    looks.templates[0];
  const comparisonKey = query.get('compare');
  if (!transferredPartner && Object.hasOwn(pineFigureModels,comparisonKey)) {
    const example = pineFigureModels[comparisonKey];
    if (example.id !== first.id) transferredPartner = example;
  }
  if (transferredLook) {
    const availableId = !wardrobe.saved.has(first.id) && !looks.templateById.has(first.id);
    activate(first, '', false, availableId);
  } else activate(first, (stored ? 'saved:' : 'preset:') + first.id, !!stored);
  if (query.get('figure') === 'study') tryFigure();
  if (query.get('figure') === 'ink' || query.get('figure') === 'random') {
    const ink = query.get('figure') === 'ink';
    const seed = query.get('seed'), age = query.get('age');
    if (seed !== null && /^\d{1,10}$/.test(seed) && Number(seed) <= 0xffffffff && ['adult','child','toddler','baby'].includes(age))
      activate(looks.randomCharacter({ base:age, seed:Number(seed), ...(ink && {ink:'auto',bodyFinish:'painted'}) }), '', false, true);
    else if (ink) { draft = looks.withFaceSurface(draft); changed(); fields(); }
  }
  if (query.get('figure') === 'baby-nose' && draft.base === 'baby' && looks.portraitStyleOf(draft) === 'animation') {
    draft = looks.withInfantNose(draft);
    changed();
    fields();
  }
  if (query.get('figure') === 'cut' && !looks.usesClothingCut(draft)) {
    if (pinePortraitStyles.hasPaintedFeatures(draft.packs[looks.core])) delete draft.clothingCut;
    else draft = looks.withClothingStudy(draft);
    changed();
    fields();
  }
  if (query.get('figure') === 'features') {
    draft = looks.withFeatureStudy(draft);
    changed();
    fields();
  }
  if (['chin','chin-pad'].includes(query.get('figure')) && draft.base === 'baby' && looks.portraitStyleOf(draft) === 'animation') {
    draft = looks.withInfantChin(draft,query.get('figure') === 'chin-pad' ? looks.chinPadRelease : looks.infantChinRelease);
    changed();
    fields();
  }
  if (['ratios','acting','garments'].includes(query.get('figure'))) {
    const upgrade = {ratios:looks.withFigureRatios, acting:looks.withExpressionStudy, garments:looks.withGarmentStudy};
    draft = upgrade[query.get('figure')](draft);
    changed();
    fields();
  }
  if (query.get('figure') === 'bases') {
    const form = query.get('form');
    tryBaseFace(Object.hasOwn(looks.gameFaceForms, form) ? form : undefined);
  }
  const partner = looks.templates.find((doc) => doc.id !== first.id && doc.id === comparisonKey);
  if (partner || transferredPartner) {
    $('compare').value = transferredPartner ? 'review:partner' : 'preset:' + partner.id;
    studyLink();
    measurements();
    show();
  }
  const openingTab = [...document.querySelectorAll('[data-tab]')].find(
    (b) => b.dataset.tab === query.get('tab')
  );
  if (openingTab) changeTab(openingTab);
  const requestedPortrait = query.get('portrait');
  if (Object.hasOwn(looks.portraitStyles, requestedPortrait) && requestedPortrait !== looks.portraitStyleOf(draft)) {
    looks.setPortraitStyle(draft, requestedPortrait);
    changed();
    fields();
  }
  const requestedFinish = query.get('finish');
  if (Object.hasOwn(looks.faceFinishes,requestedFinish) && [looks.release,looks.infantNoseRelease].includes(draft.packs[looks.core]) &&
    looks.portraitStyleOf(draft) === 'animation') {
    draft = looks.withFaceFinish(draft,requestedFinish);
    changed();
    fields();
  }
  if (query.get('random') === '1') randomize(true);
  const cheekExample = query.get('cheeks');
  if (Object.hasOwn(looks.cheekPresets, cheekExample)) {
    setCheeks(looks.cheekPresets[cheekExample]);
    fields();
  }
  const featureExample = query.get('features');
  const featureChoices = looks.hasInfantHead(draft)
    ? { ...looks.facePresets, ...looks.infantFacePresets } : looks.facePresets;
  if (Object.hasOwn(featureChoices, featureExample)) {
    looks.applyFacePreset(draft, featureChoices[featureExample]);
    changed();
    fields();
  }
  const contourOverrides = {};
  for (const key of Object.keys(looks.profileControls)) {
    const raw = query.get(key);
    if (!raw?.trim()) continue;
    const value = Number(raw), [min, max] = looks.shape[key];
    if (Number.isFinite(value) && value >= min && value <= max)
      contourOverrides[key] = Math.round(value * 100) / 100;
  }
  if (Object.keys(contourOverrides).length) {
    Object.assign(draft.shape, contourOverrides);
    changed();
    if (tab === 'face') fields();
  }
  const requestedHair = query.get('hair');
  const dyes = {};
  for (const key of Object.keys({ ...looks.colors, ...looks.portraitColors, ...looks.gearColors })) {
    const value = query.get('dye.' + key) ?? (key === 'skin' ? query.get('skin') : null);
    if (/^[0-9a-f]{6}$/i.test(value || '') && '#' + value.toLowerCase() !== draft.colors[key])
      dyes[key] = '#' + value.toLowerCase();
  }
  const changeHair = Object.hasOwn(looks.slots.hair, requestedHair) && requestedHair !== draft.parts.hair;
  const removeHat = query.get('hat') === 'none' && draft.parts.hat !== 'none';
  if (changeHair) {
    draft.parts.hair = requestedHair;
    hairGroup = looks.hairGroups[requestedHair];
  }
  if (removeHat) selectHat('none');
  if (changeHair || removeHat || Object.keys(dyes).length) {
    Object.assign(draft.colors, dyes);
    changed();
    fields();
  }
  const requestedAction = query.get('action');
  if (requestedAction && [...$('action').options].some((o) => o.value === requestedAction)) {
    $('action').value = requestedAction;
    $('action').dispatchEvent(new Event('change'));
  }
  const percent = query.get('phase');
  if (requestedAction === action && percent !== null && percent.trim() &&
      Number.isFinite(Number(percent)) && Number(percent) >= 0 && Number(percent) <= 100) {
    phase = Number(percent) / 100;
    studyLens();
    show();
  }
  const openingAngle = Number(query.get('bearing') || NaN);
  if (Number.isFinite(openingAngle) && openingAngle >= 0 && openingAngle <= 360) orbit(openingAngle);
  else orientation();
  if (query.get('play') === '1' && requestedAction === action) togglePlay();
  try {
    const local = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
    const navigation = performance.getEntriesByType('navigation')[0]?.type;
    if (local?.doc && ((!location.search && !location.hash) ||
        (local.url === location.href && ['reload', 'back_forward'].includes(navigation)))) {
      const preset = !local.dirty && !local.saved && local.key?.startsWith('preset:') &&
        looks.templateById.get(local.key.slice(7));
      restoreEdit(preset ? { ...local, doc: { ...preset, id: local.doc.id } } : local);
      const tabButton = [...document.querySelectorAll('[data-tab]')].find(b => b.dataset.tab === local.tab);
      if (tabButton) changeTab(tabButton);
      if ([...$('action').options].some(o => o.value === local.action)) action = $('action').value = local.action;
      if ([...$('compare').options].some(o => o.value === local.compare)) $('compare').value = local.compare;
      if (typeof local.fine === 'boolean') $('fine-face').checked = local.fine;
      if (Number.isFinite(local.phase)) phase = local.phase;
      if (Number.isFinite(local.bearing)) orbit(local.bearing);
      setView(local.view === 'face' ? 'face' : 'body');
      measurements();
      if (dirty) note('已恢复本标签页的未保存草稿。');
    }
  } catch {}
  if (query.get('tool') === 'person-library') PineWorkspace.openTool('person-library');
  if (query.get('candidates') === '1' && tab === 'face') $('choose-faces').click();
  if (query.get('reference') === '1' && tab === 'face') document.querySelector('.turnaround-guide').open = true;
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
