// Both panes use the same game actor, sampled bands and orthographic camera as the editor.
(() => {
  const looks = PineLooks, motion = PineMotion;
  const $ = (id) => document.getElementById(id);
  const ages = { adult: '成人', child: '儿童', toddler: '幼儿', baby: '婴儿' };
  const rows = { adult: [0, 484], child: [489, 363], baby: [868, 218] };
  const originals = { hoodie: 'look_programmer', chef: 'look_chef' };
  const stableRelease = '1.18.0', previousStudy = looks.structureStudyRelease, currentStudy = looks.gameFaceRelease;
  const key = 'pine.figureStudy.' + previousStudy + '-' + currentStudy + '.v1';
  const holdout = 'pine/figure-holdout/' + currentStudy + '/';
  const search = new URLSearchParams(location.search);
  const stages = [$('canvas-a'), $('canvas-b')];
  let mode = search.get('mode') === 'blind' ? 'blind' : 'model';
  let actors, recipes, neutralLayers, neutralHeight, layers, ceiling, renderRequest = 0, timer = 0;
  let storageOK = true;

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
    try { data = JSON.parse(localStorage.getItem(key)); } catch { /* Private browsing or invalid data. */ }
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
  const session = restore();
  const requestedCase = search.get('case');
  if (mode === 'blind' && ids.includes(requestedCase)) session.current = requestedCase;
  function syncAddress() {
    const url = new URL(location.href);
    if (mode === 'blind') {
      url.searchParams.set('mode','blind');
      url.searchParams.set('case',session.current);
      url.searchParams.delete('subject');
      url.searchParams.delete('before');
    } else {
      url.searchParams.delete('mode');
      url.searchParams.delete('case');
      url.searchParams.set('subject',$('subject').value);
      url.searchParams.set('before',$('before').value);
    }
    url.searchParams.set('bearing',$('bearing').value);
    history.replaceState(null,'',url);
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(session)); }
    catch { storageOK = false; }
  }
  function flipped(id) {
    const group = ids.filter(other => other.split('/')[0] === id.split('/')[0]);
    group.sort((a,b) => hash(session.salt + a) - hash(session.salt + b));
    return group.indexOf(id) < 4;
  }
  function blindPair() {
    const base = session.current.split('/')[0];
    const seed = hash(holdout + session.current);
    const options = { base, seed, portrait: 'animation', style: 'natural' };
    const revised = looks.randomCharacter({ ...options, release: currentStudy });
    const old = looks.withFigureStudy(revised);
    return flipped(session.current) ? [revised, old] : [old, revised];
  }
  // Reproduce the original consecutive 1.18 random-contact sheet. The eight recipes
  // share one stream; drawing each with an independent seed would select other clothes.
  const archive = new Map();
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
  function modelPair() {
    const subject = $('subject').value;
    const doc = pineFigureModels[subject] || archive.get(subject) || looks.templateById.get(originals[subject]);
    const baseline = structuredClone(doc);
    baseline.packs[looks.core] = $('before').value;
    return [baseline, looks.withGameFace(doc)];
  }

  function stop() {
    cancelAnimationFrame(timer);
    timer = 0;
    $('play').textContent = '播放动作';
    $('play').setAttribute('aria-pressed', 'false');
  }
  function setSample() {
    stop();
    const blind = mode === 'blind';
    $('model-field').hidden = blind;
    $('before-field').hidden = blind;
    $('age-field').hidden = !blind;
    $('review').hidden = !blind;
    $('age').value = session.current.split('/')[0];
    const subject = $('subject').value;
    $('guide').hidden = blind || !(subject in rows);
    if (!$('guide').hidden) {
      const [y, height] = rows[subject];
      $('guide-img').parentElement.style.aspectRatio = '1448 / ' + height;
      $('guide-img').style.transform = 'translateY(' + (-100 * y / 1086) + '%)';
      $('guide-label').textContent = ages[subject] + '造型设定稿';
    }
    $('title-a').textContent = blind ? 'A' : $('before').selectedOptions[0].textContent;
    $('title-b').textContent = blind ? 'B' : currentStudy + ' · 美术基础脸';
    $('prompt').textContent = blind
      ? '本批比较 1.19.2 与 1.19.3。同一张随机配方使用相同的服装、颜色、动作和镜头。'
      : '同一人物配方、镜头与动作帧，分别用两版实时切片绘制。';
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode));
    recipes = blind ? blindPair() : modelPair();
    actors = recipes.map(doc => looks.build(doc));
    neutralLayers = sampleActors('idle', .17);
    // Pin pixel scale to the taller of the two actual neutral silhouettes, including hats.
    neutralHeight = Math.max(...neutralLayers.map(bands => {
      const lows = bands.map(p => p.z + p.model.bounds[2] / p.body.density);
      const highs = bands.map(p => p.z + p.model.bounds[5] / p.body.density);
      return Math.max(...highs) - Math.min(...lows);
    }));
    const choice = $('action').value;
    const clips = ['idle','walk','wave','sit','drink','crawl','baby-reach'].map(id => motion.actions.get(id))
      .filter(clip => clip && actors.every(actor => motion.accepts(clip, 0, actor)));
    $('action').replaceChildren(...clips.map(c => new Option(c.label, c.id)));
    $('action').value = clips.some(c => c.id === choice) ? choice : 'idle';
    updateReview();
    refreshLinks();
    startClip();
  }
  function startClip() {
    stop();
    $('phase').value = '17';
    // Set the two camera scales together, once per pair. Stationary babies sit close to the floor.
    const restingBaby = actors[0].tags.includes('baby') && $('action').value !== 'crawl';
    ceiling = Math.max(...actors.map(a => a.rig.height)) * (restingBaby ? 1.04 : 1.28);
    rebuildFrame();
  }
  function sampleActors(action, phase) {
    const clip = motion.actions.get(action);
    return actors.map(actor => {
      const sample = clip.sample(phase, actor)[0];
      const body = actor.body, model = body.makePose(sample.pose);
      const part = { ...sample, x: 0, y: 0, heading: 0, actor, body, model };
      return studioPortraitLayers([part], motion, motion.figureLayers) || [part];
    });
  }
  function rebuildFrame() {
    const action = $('action').value;
    const phase = Number($('phase').value) / 100;
    $('phase-value').value = Math.round(phase * 100) + '%';
    layers = action === 'idle' && phase === .17 ? neutralLayers : sampleActors(action, phase);
    draw();
  }
  function draw() {
    if (!layers) return;
    const bearing = Number($('bearing').value);
    $('angle-value').value = bearing + '°';
    document.querySelectorAll('[data-angle]').forEach(b =>
      b.setAttribute('aria-pressed', Number(b.dataset.angle) === bearing));
    const yaw = bearing * Math.PI / 180;
    const ink = $('ink').value;
    stages.forEach((canvas, pane) => {
      const scale = Number($('sample-size').value) / neutralHeight;
      const aspect = canvas.clientWidth / (canvas.clientHeight || 1) || 1;
      const height = Math.ceil(scale * ceiling * Math.max(1 / .94, .9 / aspect));
      const width = Math.max(1, Math.round(height * aspect));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, width, height);
      const floor = height * .94;
      for (const part of layers[pane]) {
        const x = -Math.sin(yaw) * part.x + Math.cos(yaw) * part.y;
        part.body.draw(ctx, part.model, width / 2 + scale * x, floor - scale * part.z, yaw, 0, scale);
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
      ctx.fillStyle = '#c9c6b6';
      ctx.fillRect(0, Math.ceil(floor) + 1, width, 1);
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
      $('title-a').textContent = flipped(session.current) ? 'A · ' + currentStudy : 'A · ' + previousStudy;
      $('title-b').textContent = flipped(session.current) ? 'B · ' + previousStudy : 'B · ' + currentStudy;
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
        const options = new URLSearchParams({ action: $('action').value, bearing: $('bearing').value });
        const data = new URLSearchParams({ character: JSON.stringify(recipes[i]) });
        link.href = 'atelier.html?' + options + '#' + data;
      } else link.removeAttribute('href');
    }
  }
  function navigate(id) {
    if (!ids.includes(id)) return;
    session.current = id;
    syncAddress();
    save();
    setSample();
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
    syncAddress();
    setSample();
  });
  document.querySelectorAll('[data-angle]').forEach(b => b.onclick = () => { $('bearing').value = b.dataset.angle; draw(); refreshLinks(); syncAddress(); });
  $('age').onchange = () => {
    const group = ids.filter(id => id.startsWith($('age').value + '/'));
    navigate(group.find(id => !session.votes[id]) || group[0]);
  };
  $('prev').onclick = () => navigate(ids[ids.indexOf(session.current) - 1]);
  $('next').onclick = () => navigate(ids[ids.indexOf(session.current) + 1]);
  $('export').onclick = () => {
    const pairs = ids.map(id => {
      const [base, ordinal] = id.split('/');
      const vote = session.votes[id], newOnLeft = flipped(id);
      return { base, number: Number(ordinal) + 1, seed: hash(holdout + id),
        a: newOnLeft ? currentStudy : previousStudy, b: newOnLeft ? previousStudy : currentStudy, vote };
    });
    const file = new Blob([JSON.stringify({ study: 'pine-figure-holdout-' + currentStudy, pairs }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pine-figure-review-' + currentStudy + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('before').onchange = $('subject').onchange = () => { syncAddress(); setSample(); };
  $('action').onchange = () => { startClip(); refreshLinks(); };
  $('phase').oninput = () => { stop(); rebuildFrame(); };
  $('bearing').oninput = () => { draw(); refreshLinks(); };
  $('bearing').onchange = syncAddress;
  $('ink').onchange = draw;
  $('sample-size').onchange = draw;
  $('play').onclick = () => {
    if (timer) { stop(); return; }
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
  $('before').value = [stableRelease, looks.tailoredRelease, looks.proportionStudyRelease, previousStudy].includes(search.get('before')) ? search.get('before') : previousStudy;
  const initialAngle = Number(search.get('bearing'));
  if (Number.isInteger(initialAngle) && initialAngle >= 0 && initialAngle < 360) $('bearing').value = initialAngle;
  if ([...$('subject').options].some(o => o.value === search.get('subject'))) $('subject').value = search.get('subject');
  save();
  setSample();
})();
