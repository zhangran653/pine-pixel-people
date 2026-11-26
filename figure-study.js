// Both panes use the same game actor, sampled bands and orthographic camera as the editor.
(() => {
  const looks = PineLooks, motion = PineMotion;
  const $ = (id) => document.getElementById(id);
  const ages = { adult: '成人', child: '儿童', toddler: '幼儿', baby: '婴儿' };
  const rows = { adult: [0, 484], child: [489, 363], baby: [868, 218] };
  const originals = { hoodie: 'look_programmer', chef: 'look_chef' };
  const stableRelease = '1.18.0', previousStudy = looks.structureStudyRelease, currentStudy = looks.gameFaceRelease;
  const wholeEditions = new Map([['whole-1.19.6',looks.featureStudyRelease], ['whole-1.19.7',looks.figureRatioRelease], ['whole-1.19.8',looks.expressionRelease], ['whole-1.19.9',looks.garmentRelease]]);
  const reviews = { face:[previousStudy,currentStudy], cast:[stableRelease,currentStudy], bases:[currentStudy,looks.baseFaceRelease],
    cut:[looks.baseFaceRelease,looks.clothingStudyRelease], features:[looks.clothingStudyRelease,looks.featureStudyRelease],
    ratios:[looks.featureStudyRelease,looks.figureRatioRelease], acting:[looks.figureRatioRelease,looks.expressionRelease],
    garments:[looks.expressionRelease,looks.garmentRelease], ink:[looks.chinPadRelease,looks.infantNoseRelease] };
  const seedFor = (release, id) => hash('pine/figure-holdout/' + release + '/' + id);
  const search = new URLSearchParams(location.search);
  let reviewKind = Object.hasOwn(reviews, search.get('review')) ? search.get('review') : 'face';
  function storageKey() {
    const versions = reviews[reviewKind].join('-') + ({face:'', cast:'.painted.cast', bases:'.bases', cut:'.clothing', features:'.features', ratios:'.ratios', acting:'.acting', garments:'.garments',ink:'.portrait-ink'}[reviewKind]);
    return 'pine.figureStudy.' + versions + '.v1';
  }
  const stages = [$('canvas-a'), $('canvas-b')];
  const fullRasters = stages.map(() => document.createElement('canvas'));
  let mode = search.get('mode') === 'blind' ? 'blind' : 'model';
  let actors, recipes, neutralFrames, neutralHeight, frames, ceiling, renderRequest = 0, timer = 0;
  let storageOK = true;
  const packet = new URLSearchParams(location.hash.slice(1));
  let submitted, companion, companionActor;
  function readRecipe(field) {
    return looks.prepare(JSON.parse(packet.get(field))).recipe;
  }
  if (packet.has('character')) {
    try {
      submitted = readRecipe('character');
      $('subject').prepend(new Option('当前草稿 · ' + submitted.label, 'draft'));
      $('whole-comparisons').append(new Option('草稿原版与全身试作', 'current'));
      if (packet.has('partner')) {
        companion = readRecipe('partner');
        companionActor = looks.build(companion);
        $('whole-comparisons').append(new Option('草稿与对照人物的配方', 'recipes'));
      }
    } catch (e) {
      $('source-status').hidden = false;
      $('source-status').textContent = (submitted ? '无法读取搭档。' : '无法读取草稿，已打开标准人物。') + e.message;
    }
  }

  // An independent stream per age and number keeps the holdout set fixed across visits.
  function hash(text) {
    let value = 2166136261;
    for (const letter of text) value = Math.imul(value ^ letter.charCodeAt(0), 16777619);
    value ^= value >>> 16;
    return Math.imul(value, 2246822507) >>> 0;
  }
  const subjectId = (age, index) => age + '/' + index;
  const ids = Object.keys(ages).flatMap(age => Array.from({ length: 8 }, (_, n) => subjectId(age, n)));
  function restore() {
    let data;
    try { data = JSON.parse(localStorage.getItem(storageKey())); } catch { /* Private browsing or invalid data. */ }
    const validSalt = Number.isInteger(data?.salt) && data.salt >= 0 && data.salt <= 0xffffffff;
    const votes = {};
    if (validSalt) for (const id of ids) {
      if (['a','b','tie'].includes(data.votes?.[id])) votes[id] = data.votes[id];
    }
    return {
      salt: validSalt ? data.salt : crypto.getRandomValues(new Uint32Array(1))[0],
      current: ids.includes(data?.current) ? data.current : ids[0], votes
    };
  }
  let session = restore();
  const sessions = new Map([[reviewKind, session]]);
  const requestedCase = search.get('case');
  if (mode === 'blind' && ids.includes(requestedCase)) session.current = requestedCase;
  function syncAddress() {
    const url = new URL(location.href);
    url.hash = mode === 'model' && $('subject').value === 'draft' ? packet.toString() : '';
    if (mode === 'blind') {
      url.searchParams.set('mode','blind');
      url.searchParams.set('case',session.current);
      if (reviewKind !== 'face') url.searchParams.set('review',reviewKind);
      else url.searchParams.delete('review');
      url.searchParams.delete('subject');
      url.searchParams.delete('before');
    } else {
      url.searchParams.delete('mode');
      url.searchParams.delete('case');
      url.searchParams.delete('review');
      url.searchParams.set('subject',$('subject').value);
      url.searchParams.set('before',$('before').value);
    }
    if (mode === 'model' && !$('form-field').hidden && $('drawn-form').value)
      url.searchParams.set('form',$('drawn-form').value);
    else url.searchParams.delete('form');
    url.searchParams.set('bearing',$('bearing').value);
    if (!$('face-marks').hidden && $('face-marks').getAttribute('aria-pressed') === 'true') url.searchParams.set('marks','1');
    else url.searchParams.delete('marks');
    if ($('sample-size').value !== '256') url.searchParams.set('size',$('sample-size').value);
    else url.searchParams.delete('size');
    for (const [field, normal] of [['framing','body'], ['action','idle'], ['phase','17']]) {
      const value = $(field).value;
      if (value && value !== normal) url.searchParams.set(field,value);
      else url.searchParams.delete(field);
    }
    history.replaceState(null,'',url);
  }
  function save() {
    try { localStorage.setItem(storageKey(), JSON.stringify(session)); }
    catch { storageOK = false; }
  }
  function flipped(id) {
    const group = ids.filter(other => other.split('/')[0] === id.split('/')[0]);
    group.sort((a,b) => hash(session.salt + a) - hash(session.salt + b));
    return group.indexOf(id) < 4;
  }
  function beforeClothing(recipe) {
    const old = looks.withClothingStudy(recipe);
    old.packs[looks.core] = looks.baseFaceRelease;
    return old;
  }
  function blindPair() {
    const base = session.current.split('/')[0];
    const [, release] = reviews[reviewKind];
    const seed = seedFor(release, session.current);
    const options = { base, seed, portrait: 'animation', style: 'natural', release };
    if (reviewKind === 'ink') {
      const prior = looks.randomCharacter({...options,release:looks.chinPadRelease,bodyFinish:'painted'});
      const names = Object.keys(looks.portraitInks);
      const trial = looks.withPortraitInk(prior,names[seed % names.length]);
      return flipped(session.current) ? [trial,prior] : [prior,trial];
    }
    const cast = reviewKind === 'cast';
    const revised = looks.randomCharacter({ ...options, bodyFinish: reviewKind === 'face' ? undefined : 'painted' });
    const old = reviewKind === 'garments' ? looks.withoutGarmentStudy(revised) : reviewKind === 'acting' ? looks.withoutExpressionStudy(revised) : reviewKind === 'ratios' ? looks.withoutFigureRatios(revised) : reviewKind === 'features' ? looks.withoutFeatureStudy(revised) : reviewKind === 'cut' ? beforeClothing(revised) : cast ? looks.randomCharacter({ ...options, release:stableRelease }) :
      reviewKind === 'bases' ? looks.withGameFace(revised) : looks.withFigureStudy(revised);
    return flipped(session.current) ? [revised, old] : [old, revised];
  }
  // Reproduce the original consecutive 1.18 random-contact sheet. The eight recipes
  // share one stream; drawing each with an independent seed would select other clothes.
  const archive = new Map();
  const seedParam = search.get('seed'), seedAge = search.get('age');
  if (Object.hasOwn(ages,seedAge) && /^\d{1,10}$/.test(seedParam) && Number(seedParam) <= 0xffffffff) {
    archive.set('seeded',looks.randomCharacter({base:seedAge,seed:Number(seedParam),ink:'auto',bodyFinish:'painted'}));
    $('subject').prepend(new Option(ages[seedAge] + ' · 种子 ' + seedParam,'seeded'));
  }
  {
    const labels = ['围裙与布包','蓝夹克','短袖短裤','黄帽橙衫','安全帽与记录板','围兜背带裤','领带制服','牛仔夹克与记录板'];
    let state = 20261125;
    const random = () => {
      state = (Math.imul(1664525,state) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    for (const [n, label] of labels.entries()) {
      const doc = looks.randomCharacter({ random, release: stableRelease, source: looks.templateById.get('look_hazel'),
        locks: [], style: 'natural', portrait: 'animation' });
      const id = 'baseline-' + (n + 1);
      doc.id = 'look_baseline_' + (n + 1);
      doc.label = String(n + 1).padStart(2,'0') + ' · ' + label;
      archive.set(id, doc);
      $('baseline-subjects').append(new Option(doc.label, id));
    }
  }
  const randomSubjects = {
    'child-6': [currentStudy,'child/5'], 'adult-female': [currentStudy,'adult/0'],
    'toddler-1': [currentStudy,'toddler/0'], 'baby-face-1': [looks.featureStudyRelease,'baby/0']
  };
  function paintedFigure(doc) {
    if (doc.packs[looks.core] === looks.featureStudyRelease) return { ...doc };
    const clothed = looks.withClothingStudy(looks.withBaseFace(doc));
    return { ...looks.withFeatureStudy(clothed), bodyFinish:'painted' };
  }
  function modelPair() {
    const subject = $('subject').value;
    const sample = randomSubjects[subject];
    const source = subject === 'draft' ? submitted : sample
      ? looks.randomCharacter({ base: sample[1].split('/')[0], seed: seedFor(...sample), release:sample[0],
          bodyFinish:sample[0] === looks.featureStudyRelease ? 'painted' : undefined })
      : pineFigureModels[subject] || archive.get(subject) || looks.templateById.get(originals[subject]);
    const before = $('before').value;
    if (before === 'recipes') return [companion,submitted];
    if (before === 'surface') {
      const trial = looks.withFaceSurface(source);
      return [looks.withoutFaceSurface(trial),trial];
    }
    if (before === 'baby-nose') {
      const trial = looks.withInfantNose(source);
      return [looks.withoutInfantNose(trial),trial];
    }
    if (before === 'ink') {
      const trial = looks.withPortraitInk(looks.withoutFaceSurface(source),source.portraitInk || 'cel');
      return [looks.withoutPortraitInk(trial),trial];
    }
    const wasActing = pinePortraitStyles.hasFacialActing(source.packs[looks.core]);
    if (before === 'chin-pad') return [looks.withInfantChin(source), looks.withInfantChin(source,looks.chinPadRelease)];
    if (before === 'chin') {
      const trial = looks.withInfantChin(source);
      return [looks.withoutInfantChin(trial), trial];
    }
    if (before === 'garments') {
      const trial = looks.withGarmentStudy(subject === 'draft' ? source : paintedFigure(source));
      return [source.packs[looks.core] === looks.expressionRelease ? source : looks.withoutGarmentStudy(trial), trial];
    }
    if (before === 'acting') {
      const trial = looks.withExpressionStudy(subject === 'draft' ? source : paintedFigure(source));
      return [looks.withoutExpressionStudy(trial), trial];
    }
    const previous = wasActing && before !== 'current' ? looks.withoutExpressionStudy(source) : source;
    if (before === 'ratios') {
      const trial = looks.withFigureRatios(subject === 'draft' ? previous : paintedFigure(previous));
      return [looks.withoutFigureRatios(trial), trial];
    }
    const doc = previous.packs[looks.core] === looks.figureRatioRelease && before !== 'current' ? looks.withoutFigureRatios(previous) : previous;
    if (wholeEditions.has(before)) {
      const baseline = looks.withFigureStudy(doc);
      baseline.packs[looks.core] = stableRelease;
      delete baseline.anatomyParts;
      if (wholeEditions.get(before) === looks.featureStudyRelease) return [baseline, paintedFigure(doc)];
      const fitted = previous.packs[looks.core] === looks.figureRatioRelease ? previous : looks.withFigureRatios(paintedFigure(doc));
      const edition = wholeEditions.get(before);
      if (edition === looks.garmentRelease) return [baseline, looks.withGarmentStudy(wasActing ? source : fitted)];
      return [baseline, edition === looks.expressionRelease ? looks.withExpressionStudy(wasActing ? source : fitted) : fitted];
    }
    if (before === 'features') {
      const next = subject === 'draft' ? { ...doc, packs:{ ...doc.packs, [looks.core]:looks.featureStudyRelease } } : paintedFigure(doc);
      if (subject === 'draft' && !looks.usesClothingCut(doc)) next.clothingCut = 'original';
      const form = $('drawn-form').value;
      if (form && looks.portraitStyleOf(next)==='animation') next.face = {...next.face, form};
      return [looks.withoutFeatureStudy(next), next];
    }
    if (before === 'cut') {
      const source = subject === 'draft' ? doc : { ...looks.withBaseFace(doc), bodyFinish:'painted' };
      const old = beforeClothing(source);
      return [old, looks.withClothingStudy(old)];
    }
    if (before === 'bases') {
      const trial = looks.withBaseFace(doc, $('drawn-form').value || undefined);
      return [looks.withGameFace(trial), trial];
    }
    const whole = before === 'whole' || before === 'current';
    const revised = looks.withGameFace(doc);
    if (whole) {
      revised.bodyFinish = 'painted';
      if (before === 'current') return [doc, revised];
    } else delete revised.bodyFinish;
    if (before === 'finish') return [revised, { ...revised, bodyFinish: 'painted' }];
    const baseline = looks.withFigureStudy(whole ? revised : doc);
    baseline.packs[looks.core] = whole ? stableRelease : before;
    if (whole) baseline.face.style = looks.portraitStyleOf(doc);
    if (!pinePortraitStyles.hasStructureStudy(baseline.packs[looks.core])) delete baseline.anatomyParts;
    return [baseline, revised];
  }

  function stop() {
    cancelAnimationFrame(timer);
    timer = 0;
    $('play').textContent = '播放动作';
    $('play').setAttribute('aria-pressed', 'false');
  }
  function setSample(choice = $('action').value, phase = Number($('phase').value)) {
    stop();
    const blind = mode === 'blind';
    $('model-field').hidden = blind;
    $('before-field').hidden = blind;
    $('review-field').hidden = !blind;
    $('review-kind').value = reviewKind;
    $('age-field').hidden = !blind;
    $('review').hidden = !blind;
    $('age').value = session.current.split('/')[0];
    const subject = $('subject').value;
    for (const opt of $('before').querySelectorAll('[value="current"],[value="recipes"]')) opt.disabled = subject !== 'draft';
    if (!blind && subject !== 'draft' && ['current','recipes'].includes($('before').value)) $('before').value = 'whole';
    $('guide').hidden = blind || !(subject in rows);
    if (!$('guide').hidden) {
      const [y, height] = rows[subject];
      $('guide-img').parentElement.style.aspectRatio = '1448 / ' + height;
      $('guide-img').style.transform = 'translateY(' + (-100 * y / 1086) + '%)';
      $('guide-label').textContent = ages[subject] + '造型设定稿';
    }
    recipes = blind ? blindPair() : modelPair();
    const before = $('before').value, finish = before === 'finish', whole = before === 'whole' || before === 'current';
    const bases = !blind && before === 'bases', clothing = !blind && before === 'cut', features = !blind && before === 'features';
    const completeFigure = !blind && wholeEditions.get(before);
    const ratios = !blind && before === 'ratios', acting = !blind && before === 'acting';
    const chinPad = !blind && before === 'chin-pad';
    const chin = !blind && (before === 'chin' || before === 'chin-pad');
    const chinPrompt = chinPad
      ? '从下唇往下看，比较轮廓向下走了多远才转向脖子。可切换伸手、张嘴或左右侧面。'
      : '两侧共用鼻唇、肤色和坐姿。看下唇下方的圆弧，再切到伸手或爬行，观察下巴怎样接入颈部。';
    const garments = !blind && before === 'garments';
    const paired = !blind && before === 'recipes';
    $('face-gallery').hidden = blind || paired;
    $('face-gallery').href = 'studies/pixel-structure/' + (chinPad ? 'infant-chin-pad.webp' : chin ? 'infant-chin.webp' : garments ? 'garment-fits.webp' : acting ? 'acting-faces.webp' : ratios ? 'figure-ratios.webp' : completeFigure ? before + '.webp' : features ? 'painted-features.webp' : clothing ? 'garment-cuts.webp' : bases ? 'drawn-faces.webp' : 'game-faces.webp');
    $('face-gallery').textContent = chinPad ? '下唇到颏尖实拍' : chin ? '婴儿下巴与坐姿实拍' : garments ? '同人换装与动作实拍' : acting ? '眼神与坐姿实拍' : ratios ? '头身与侧脸比例实拍' : completeFigure ? '稳定版与完整试作实拍' : features ? '五官与坐姿侧面实拍' : clothing ? '衣物与动作实拍' : bases ? '分龄基础脸三视图' : '新旧脸型实拍';
    $('form-field').hidden = !bases && !(features && looks.portraitStyleOf(recipes[1])==='animation');
    const names = looks.baseFaceForms(recipes[1].base);
    if (!$('form-field').hidden) for (const opt of $('drawn-form').options) if (opt.value) opt.textContent = names[opt.value];
    const baselineTitle = features ? recipes[0].packs[looks.core] + ' · 原有五官' : clothing ? looks.baseFaceRelease + ' · 原有衣物' : bases ? currentStudy + ' · 原有脸型' : before === 'whole' || completeFigure ? stableRelease + ' · 稳定版' :
      before === 'current' ? recipes[0].packs[looks.core] + ' · 草稿原版' : $('before').selectedOptions[0].textContent;
    $('title-a').textContent = blind ? 'A' : paired ? recipes[0].label : chinPad ? looks.infantChinRelease + ' · 短圆下巴' : chin ? recipes[0].packs[looks.core] + ' · 原有下巴' : garments ? looks.expressionRelease + ' · 分龄剪裁' : acting ? looks.figureRatioRelease + ' · 原有神情' : ratios ? looks.featureStudyRelease + ' · 原有比例' : baselineTitle;
    $('title-b').textContent = blind ? 'B' : paired ? recipes[1].label : chinPad ? looks.chinPadRelease + ' · 饱满小下巴' : chin ? looks.infantChinRelease + ' · 短圆下巴' : garments ? looks.garmentRelease + ' · 分款剪裁' : acting ? looks.expressionRelease + ' · 动作神情' : ratios ? looks.figureRatioRelease + ' · 分龄比例' : completeFigure ? completeFigure + ' · 完整试作' : features ? looks.featureStudyRelease + ' · 五官与下颌' : clothing ? looks.clothingStudyRelease + ' · 分龄衣物剪裁' : bases ? looks.baseFaceRelease + ' · ' + names[recipes[1].face.form] :
      currentStudy + (whole ? ' · 全身试作' : finish ? ' · 四肢与衣边色块' : ' · 美术基础脸');
    $('prompt').textContent = blind
      ? reviewKind === 'cast'
        ? '稳定版与试作各自随机生成一人。年龄、种子、镜头与动作帧相同，比较整体搭配和造型。'
        : '本批比较 ' + reviews[reviewKind].join(' 与 ') + '。两侧共用同一张随机配方、同一动作和机位。'
      : paired ? '左侧是对照人物，右侧是当前草稿。两份配方共用机位和动作进度，可分别回到创作室编辑。'
      : chin ? (recipes[1].base === 'baby' && looks.portraitStyleOf(recipes[1]) === 'animation'
        ? chinPrompt
        : '选择立体动画画风的婴儿可比较下巴。当前人物沿用原有轮廓。')
      : garments ? '两侧用同一配方。正面看衣摆、袖口和裤腿之间的空隙，走几步看裤脚落在鞋面的形状。'
      : acting ? '两侧共用五官和穿搭。拖动动作进度，看眼睛是否朝向玩具或书页，再转到侧面看下巴与衣领。'
      : ratios ? '两侧共用人物、服饰和机位。比较眉上到头顶的弧线、鼻底到上唇的留白，以及肩膀和骨盆之间的长度。'
      : completeFigure ? '同一人物、穿搭、机位和动作进度。正面看头肩与四肢的比例，侧面看脸、下颌和身体的姿态。'
      : features ? (looks.portraitStyleOf(recipes[1]) === 'animation' ? '同一配方和动作帧。看笑嘴在正面是否连贯，转到侧面比较下唇、颏尖和衣领。' : '当前草稿采用其他五官画风。两边保留草稿画风，五官笔触试作使用立体动画。')
      : clothing ? '同一人物、穿搭和动作帧。转动观察肩线、领口和裤管，切到走路或伸手看弯曲处的衣料。'
      : bases ? (recipes[1].face.form === 'balanced' || recipes[1].face.formMix === 0
        ? '均衡底脸为两版共用。选择其他脸型或在创作室调高强度，可以比较分龄轮廓。'
        : '两侧使用同一款脸型、同一形变强度和动作帧。转到侧面看鼻唇与颏尖，再转到斜面看下颌接入颈部的位置。')
      : whole ? '两侧共用肤色、五官选择、穿搭和动作进度。' +
        (looks.portraitStyleOf(recipes[0]) === 'animation' ? '' : '左侧保留原画风，右侧使用立体动画基础脸。') +
        '头肩镜头直接放大全身画面里的像素。'
        : finish ? '同一个人物、同一帧。可转到侧面看袖口、手臂、膝盖和小腿的明暗。'
        : '同一人物配方、镜头与动作帧，分别用两版实时切片绘制。';
    if (!blind && (before === 'ink' || before === 'baby-nose')) {
      const drawing = before === 'ink';
      $('title-a').textContent = drawing ? '原有笔触' : '原有鼻形';
      $('title-b').textContent = drawing ? looks.portraitInks[recipes[1].portraitInk] : '浅鼻根与圆鼻头';
      $('prompt').textContent = drawing ? '同一张脸、同一组染色。把脸转到四分之三侧面，比较眼睑、面颊与头发的色块。'
        : recipes[1].base === 'baby' ? '两侧共用眼睛、嘴唇、下巴和坐姿。转到侧面看鼻根到鼻头的轮廓。' : '选择婴儿可比较鼻头的形状。';
      $('face-gallery').href = 'studies/pixel-structure/' + (drawing ? 'portrait-ink.webp' : 'nursery-nose.webp');
      $('face-gallery').textContent = drawing ? '同脸三种像素笔触实拍' : '婴儿鼻部三向实拍';
    }
    if (!blind && before === 'surface') {
      $('title-a').textContent = '原有脸部曲面';
      $('title-b').textContent = '眼眶与口周随五官塑形';
      $('prompt').textContent = '待机时头部固定朝前，两侧共用神情和笔触。正面看嘴宽，45° 看远侧嘴角，90° 看唇中央向近侧嘴角回收的距离。';
      $('face-gallery').href = 'studies/pixel-structure/face-surface.webp';
      $('face-gallery').textContent = '眼、鼻、唇、颏定位实拍';
    }
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode));
    actors = recipes.map(doc => looks.build(doc));
    neutralFrames = sampleActors('idle', .17);
    // Pin pixel scale to the taller of the two actual neutral silhouettes, including hats.
    neutralHeight = Math.max(...neutralFrames.map(({ bands }) => {
      const lows = bands.map(p => p.z + p.model.bounds[2] / p.body.density);
      const highs = bands.map(p => p.z + p.model.bounds[5] / p.body.density);
      return Math.max(...highs) - Math.min(...lows);
    }));
    const clipIds = new Set(['idle','walk','wave','sit','drink','crawl','baby-reach',choice]);
    if (acting || garments || chin || (paired && actors.every(a => pinePortraitStyles.hasFacialActing(a.figureRelease))) || pinePortraitStyles.hasFacialActing(completeFigure) || (blind && ['acting','garments'].includes(reviewKind)))
      for (const id of ['look-around','follow-rattle','rattle','read','write','phone','type','open-mouth']) clipIds.add(id);
    const clips = [...clipIds].map(id => motion.actions.get(id))
      .filter(clip => clip && (!paired || clip.roles.length === 1) && actors.every(actor => motion.castFor(clip, actor, partner())));
    $('action').replaceChildren(...clips.map(c => new Option(c.label, c.id)));
    const accepted = clips.some(c => c.id === choice);
    $('action').value = accepted ? choice : 'idle';
    updateReview();
    startClip(accepted ? phase : 17);
    refreshLinks();
  }
  function partner() {
    return mode === 'model' && $('subject').value === 'draft' && $('before').value !== 'recipes' ? companionActor : null;
  }
  function startClip(phase = 17) {
    stop();
    $('phase').value = String(phase);
    // Set the two camera scales together, once per pair. Stationary babies sit close to the floor.
    const restingBaby = actors[0].tags.includes('baby') && $('action').value !== 'crawl';
    const clip = motion.actions.get($('action').value);
    $('face-marks').hidden = mode !== 'model' || $('before').value !== 'surface' || clip.id !== 'idle';
    $('pose-note').hidden = clip.roles.length < 2;
    $('rattle-film').hidden = mode === 'blind' || clip.id !== 'follow-rattle' || !pinePortraitStyles.hasFacialActing(recipes[1].packs[looks.core]);
    const cast = actors.flatMap(actor => motion.castFor(clip, actor, partner()));
    ceiling = Math.max(...cast.map(a => a.rig.height)) * (restingBaby && clip.roles.length === 1 ? 1.04 : 1.28);
    rebuildFrame();
  }
  function faceForward(actor,pose) {
    // Keep the skull base at the seated or standing pivot while removing the
    // idle turn. Camera zero and +/-90 now measure the anatomy's own axes.
    const pivot = actor.rig.headPivot || actor.rig.neck;
    const position = motion.rig.point(pose.head,pivot);
    const head = motion.rig.frame(pivot,position.map((v,i)=>v-pivot[i]),0,0,0);
    return {...pose,head,jaw:pose.jawLocal ? motion.rig.compose(head,pose.jawLocal) : head};
  }
  function sampleActors(action, phase) {
    const clip = motion.actions.get(action);
    return actors.map(actor => {
      const cast = motion.castFor(clip, actor, partner());
      const sample = clip.sample(phase, ...cast)[cast.indexOf(actor)];
      const pose = action === 'idle' && mode === 'model' && $('before').value === 'surface' ? faceForward(actor,sample.pose) : sample.pose;
      const body = actor.body, model = body.makePose(pose);
      const heading = clip.roles.length === 2 || clip.previewTurn ? sample.heading : 0;
      const part = { ...sample, pose, x: 0, y: 0, heading, actor, body, model };
      const span = actor.rig.height - actor.rig.neck[2];
      const focus = motion.rig.point(pose.head, [actor.rig.neck[0], 0, actor.rig.neck[2] + .45 * span]);
      return { bands: studioPortraitLayers([part], motion, motion.figureLayers) || [part],
        focus, span, heading, z: part.z, pose };
    });
  }
  function rebuildFrame() {
    const action = $('action').value;
    const phase = Number($('phase').value) / 100;
    $('phase-value').value = Math.round(phase * 100) + '%';
    frames = action === 'idle' && phase === .17 ? neutralFrames : sampleActors(action, phase);
    draw();
  }
  function draw() {
    if (!frames) return;
    const bearing = Number($('bearing').value);
    $('angle-value').value = Number(bearing.toFixed(1)) + '°';
    document.querySelectorAll('[data-angle]').forEach(b =>
      b.setAttribute('aria-pressed', Number(b.dataset.angle) === bearing));
    const yaw = bearing * Math.PI / 180;
    const ink = $('ink').value;
    const marks = !$('face-marks').hidden && $('face-marks').getAttribute('aria-pressed') === 'true';
    $('face-key').hidden = !marks;
    const size = $('sample-size').value;
    const measured = size === 'world';
    const scale = measured ? motion.rig.centimetersPerUnit : Number(size) / neutralHeight;
    const close = $('framing').value === 'head';
    const aspect = stages[0].clientWidth / (stages[0].clientHeight || 1) || 1;
    const height = Math.ceil((measured ? 260 : scale * ceiling) * Math.max(1 / .94, .9 / aspect));
    const width = Math.max(1, Math.round(height * aspect)), floor = height * .94;
    let cropWidth, cropHeight, left, top;
    if (close) {
      // One integer crop of both native rasters retains differences in head carriage.
      const [[ax, az], [bx, bz]] = frames.map(({ focus, heading, z }) => [
        -Math.sin(yaw - heading) * focus[0] + Math.cos(yaw - heading) * focus[1], focus[2] + z
      ]);
      const headSpan = Math.max(...frames.map(frame => frame.span));
      const span = Math.max(1.53 * headSpan + Math.abs(az - bz),
        (1.32 * headSpan + Math.abs(ax - bx)) / aspect);
      cropHeight = Math.min(height, Math.max(1, Math.ceil(scale * span)));
      cropWidth = Math.min(width, Math.max(1, Math.round(cropHeight * aspect)));
      left = Math.max(0, Math.min(width - cropWidth, Math.round((width - cropWidth + scale * (ax + bx)) / 2)));
      top = Math.max(0, Math.min(height - cropHeight, Math.round(floor - (scale * (az + bz) + cropHeight) / 2)));
    }
    stages.forEach((canvas, pane) => {
      const raster = close ? fullRasters[pane] : canvas;
      if (raster.width !== width) raster.width = width;
      if (raster.height !== height) raster.height = height;
      const ctx = raster.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, width, height);
      for (const part of frames[pane].bands) {
        const x = -Math.sin(yaw) * part.x + Math.cos(yaw) * part.y;
        part.body.draw(ctx, part.model, width / 2 + scale * x, floor - scale * part.z,
          yaw - part.heading, 0, scale);
      }
      if (ink === 'silhouette') {
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#29352e';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      } else if (ink === 'values') {
        const image = ctx.getImageData(0, 0, width, height);
        for (let i = 0; i < image.data.length; i += 4) {
          if (!image.data[i + 3]) continue;
          const light = .2126 * image.data[i] + .7152 * image.data[i + 1] + .0722 * image.data[i + 2];
          const tone = light < 88 ? 50 : light < 161 ? 125 : 205;
          image.data[i] = image.data[i+1] = image.data[i+2] = tone;
        }
        ctx.putImageData(image, 0, 0);
      }
      if (marks) {
        const frame = frames[pane], relative = yaw - frame.heading;
        const anchors = { leftEye:'#5ee1cb',rightEye:'#5ee1cb',noseTip:'#ffc454',noseBase:'#ffc454',
          mouth:'#ff72a7',leftMouthCorner:'#ff72a7',rightMouthCorner:'#ff72a7',chinTip:'#73a6ff' };
        for (const [name,color] of Object.entries(anchors)) {
          const [x,y,z] = motion.rig.socket(actors[pane],frame.pose,name);
          const u = Math.round(width/2 + scale*(-Math.sin(relative)*x + Math.cos(relative)*y));
          const v = Math.round(floor - scale*(z+frame.z));
          ctx.fillStyle = '#303b40';
          ctx.fillRect(u-1,v-1,3,3);
          ctx.fillStyle = color;
          ctx.fillRect(u,v,1,1);
        }
      }
      ctx.fillStyle = '#c9c6b6';
      ctx.fillRect(0, Math.ceil(floor) + 1, width, 1);
      if (measured) {
        ctx.fillStyle = '#707967';
        ctx.font = '8px sans-serif';
        for (let cm = 0; cm <= 250; cm += 25) {
          const y = Math.round(floor - cm);
          ctx.fillRect(2, y, cm % 50 ? 4 : 8, 1);
          if (cm % 50 === 0) ctx.fillText(cm + ' cm', 12, y + 2);
        }
      }
      if (close) {
        if (canvas.width !== cropWidth) canvas.width = cropWidth;
        if (canvas.height !== cropHeight) canvas.height = cropHeight;
        const detail = canvas.getContext('2d', { willReadFrequently: true });
        detail.clearRect(0, 0, cropWidth, cropHeight);
        detail.drawImage(raster, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      }
    });
  }
  function updateReview() {
    if (mode !== 'blind') return;
    const [age, num] = session.current.split('/');
    const count = Object.keys(session.votes).length, done = count === ids.length;
    $('round').textContent = ages[age] + ' · 第 ' + (Number(num) + 1) + ' / 8 组';
    $('progress').textContent = '已评 ' + count + ' / ' + ids.length;
    $('prev').disabled = session.current === ids[0];
    $('next').disabled = session.current === ids.at(-1);
    const vote = session.votes[session.current];
    document.querySelectorAll('[data-vote]').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.vote === vote);
      b.disabled = done;
    });
    $('saved').textContent = !storageOK ? '本次评审只保存在当前页面' : done ? '评审已完成' : vote ? '本组偏好已保存' : '进度自动保存在此浏览器';
    $('results').hidden = !done;
    if (done) {
      $('title-a').textContent = 'A · ' + recipes[0].packs[looks.core];
      $('title-b').textContent = 'B · ' + recipes[1].packs[looks.core];
      const counts = $('counts');
      counts.replaceChildren();
      for (const [base, label] of Object.entries(ages)) {
        const totals = [0,0,0];
        for (const id of ids.filter(id => id.startsWith(base + '/'))) {
          const v = session.votes[id];
          const preferredNew = v === (flipped(id) ? 'a' : 'b');
          totals[v === 'tie' ? 1 : preferredNew ? 2 : 0]++;
        }
        const row = counts.insertRow();
        for (const value of [label,...totals]) row.insertCell().textContent = value;
      }
    }
  }
  function refreshLinks() {
    const visible = mode === 'model' || Object.keys(session.votes).length === ids.length;
    for (const [i, link] of [$('edit-a'), $('edit-b')].entries()) {
      link.hidden = !visible;
      if (visible) {
        const options = new URLSearchParams({ action: $('action').value, bearing: $('bearing').value, phase: $('phase').value });
        if ($('framing').value === 'head' || (mode === 'model' && ['features','ratios','acting','ink','baby-nose','surface'].includes($('before').value))) options.set('tab', 'face');
        else if ((mode === 'model' && ['cut','garments'].includes($('before').value)) ||
                 (mode === 'blind' && reviewKind === 'garments')) options.set('tab', 'shape');
        const data = new URLSearchParams({ character: JSON.stringify(recipes[i]) });
        if (mode === 'model' && $('before').value === 'recipes') {
          options.set('study','recipes');
          data.set('partner',JSON.stringify(recipes[1-i]));
        } else if (partner()) data.set('partner', JSON.stringify(companion));
        link.href = 'atelier.html?' + options + '#' + data;
      } else link.removeAttribute('href');
    }
  }
  function navigate(id) {
    if (!ids.includes(id)) return;
    session.current = id;
    save();
    setSample();
    syncAddress();
  }
  document.querySelectorAll('[data-vote]').forEach(b => b.onclick = () => {
    if (Object.keys(session.votes).length === ids.length) return;
    session.votes[session.current] = b.dataset.vote;
    const index = ids.indexOf(session.current);
    const next = [...ids.slice(index + 1), ...ids.slice(0, index)].find(id => !session.votes[id]);
    if (next) navigate(next);
    else { save(); updateReview(); refreshLinks(); }
  });
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
    mode = b.dataset.mode;
    setSample();
    syncAddress();
  });
  document.querySelectorAll('[data-angle]').forEach(b => b.onclick = () => { $('bearing').value = b.dataset.angle; draw(); refreshLinks(); syncAddress(); });
  $('age').onchange = () => {
    const group = ids.filter(id => id.startsWith($('age').value + '/'));
    navigate(group.find(id => !session.votes[id]) || group[0]);
  };
  $('prev').onclick = () => navigate(ids[ids.indexOf(session.current) - 1]);
  $('next').onclick = () => navigate(ids[ids.indexOf(session.current) + 1]);
  $('export').onclick = () => {
    const [before, after] = reviews[reviewKind];
    const pairs = ids.map(id => {
      const [base, ordinal] = id.split('/');
      const vote = session.votes[id], newOnLeft = flipped(id);
      return { base, number: Number(ordinal) + 1, seed: seedFor(after,id),
        a: newOnLeft ? after : before, b: newOnLeft ? before : after, vote };
    });
    const report = { study: 'pine-figure-holdout-' + after, review: reviewKind,
      ...(reviewKind !== 'face' ? { candidateBodyFinish: 'painted' } : {}), pairs };
    const file = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pine-figure-review-' + after + (reviewKind === 'face' ? '' : '-' + reviewKind) + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('before').onchange = $('drawn-form').onchange = $('subject').onchange = () => { setSample(); syncAddress(); };
  $('review-kind').onchange = () => {
    reviewKind = $('review-kind').value;
    session = sessions.get(reviewKind) || restore();
    sessions.set(reviewKind, session);
    save();
    setSample();
    syncAddress();
  };
  $('action').onchange = () => { startClip(); refreshLinks(); syncAddress(); };
  $('phase').oninput = () => { stop(); rebuildFrame(); refreshLinks(); };
  $('phase').onchange = syncAddress;
  $('framing').onchange = () => { draw(); refreshLinks(); syncAddress(); };
  $('bearing').oninput = () => { draw(); refreshLinks(); };
  $('bearing').onchange = syncAddress;
  $('face-marks').onclick = () => {
    const button = $('face-marks');
    button.setAttribute('aria-pressed',button.getAttribute('aria-pressed') !== 'true');
    draw();
    syncAddress();
  };
  $('ink').onchange = draw;
  $('sample-size').onchange = () => { draw(); syncAddress(); };
  $('play').onclick = () => {
    if (timer) { stop(); refreshLinks(); syncAddress(); return; }
    const seconds = motion.actions.get($('action').value).seconds;
    const start = performance.now() - Number($('phase').value) * seconds * 10;
    let last = 0;
    $('play').textContent = '暂停';
    $('play').setAttribute('aria-pressed', 'true');
    function tick(now) {
      if (now - last >= 90) {
        last = now;
        $('phase').value = Math.round(((now - start) / (1000 * seconds)) % 1 * 100);
        rebuildFrame();
      }
      timer = requestAnimationFrame(tick);
    }
    timer = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(renderRequest);
    renderRequest = requestAnimationFrame(draw);
  });
  for (const id of ['edit-a', 'edit-b']) {
    for (const event of ['click','auxclick','contextmenu']) $(id).addEventListener(event, refreshLinks);
  }
  if (submitted) $('subject').value = 'draft';
  else if (archive.has('seeded')) $('subject').value = 'seeded';
  if (Object.hasOwn(looks.gameFaceForms, search.get('form'))) $('drawn-form').value = search.get('form');
  if ([...$('before').options].some(o => o.value === search.get('before'))) $('before').value = search.get('before');
  else $('before').value = submitted ? 'whole' : previousStudy;
  if (search.get('framing') === 'head') $('framing').value = 'head';
  if (search.get('marks') === '1') $('face-marks').setAttribute('aria-pressed','true');
  if (['64', '128', '256', 'world'].includes(search.get('size'))) $('sample-size').value = search.get('size');
  const initialAngle = Number(search.get('bearing'));
  if (Number.isFinite(initialAngle) && initialAngle >= 0 && initialAngle <= 360) $('bearing').value = initialAngle % 360;
  if (['chin','chin-pad'].includes($('before').value) && !search.has('subject')) $('subject').value = 'baby02-profile';
  if ($('before').value === 'baby-nose' && !search.has('subject')) $('subject').value = 'baby02-pad';
  if ([...$('subject').options].some(o => o.value === search.get('subject'))) $('subject').value = search.get('subject');
  save();
  const phase = search.get('phase'), value = Number(phase);
  setSample(search.get('action') || 'idle',
    phase !== null && phase.trim() && Number.isFinite(value) && value >= 0 && value <= 100 ? value : 17);
})();
