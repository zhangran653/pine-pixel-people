// Browser storage and portable scores share the same recipe validation.
const PineWardrobe = (() => {
  const looks = PineLooks,
    motion = PineMotion,
    prefix = 'pineCreek.look.v1.',
    packPrefix = 'pineCreek.pack.v1.';
  const saved = new Map(),
    sessionDocs = new Map(),
    revisions = new Map();
  let skipped = 0;
  function readDisk(key) {
    try {
      return globalThis.localStorage.getItem(key);
    } catch {
      return undefined;
    }
  }
  function writeDisk(key, value) {
    try {
      globalThis.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  function remember(recipe, actor) {
    for (const p of recipe.embeddedPacks || []) looks.install(p);
    sessionDocs.set(recipe.id, recipe);
    motion.characters.set(recipe.id, actor);
  }
  function hydrate() {
    let keys;
    try {
      const storage = globalThis.localStorage;
      keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(Boolean);
    } catch {
      return 0;
    }
    skipped = 0;
    for (const key of keys.filter((k) => k.startsWith(packPrefix))) {
      try {
        looks.install(JSON.parse(readDisk(key)));
      } catch {
        skipped++;
      }
    }
    for (const key of keys.filter((k) => k.startsWith(prefix))) {
      try {
        const raw = readDisk(key),
          { recipe } = looks.prepare(JSON.parse(raw));
        if (key !== prefix + recipe.id) throw new Error('角色与存档 ID 不符');
        remember(recipe, looks.build(recipe));
        saved.set(recipe.id, recipe);
        revisions.set(recipe.id, raw);
      } catch {
        skipped++;
      }
    }
    return skipped;
  }
  function installPack(raw, persist = true) {
    const pack = looks.install(raw);
    if (persist) writeDisk(packPrefix + pack.id + '@' + pack.release, JSON.stringify(pack));
    return pack;
  }
  function persistRecipes(recipes) {
    const writes = recipes.map((recipe) => {
      const key = prefix + recipe.id,
        prior = readDisk(key);
      if (prior !== undefined && prior !== (revisions.get(recipe.id) ?? null))
        throw new Error('形象已在另一个标签页修改，请另存为新形象');
      return { key, id: recipe.id, prior, raw: JSON.stringify(recipe) };
    });
    const completed = [];
    for (const entry of writes) {
      if (!writeDisk(entry.key, entry.raw)) {
        // A quota error can interrupt a multi-actor import. Restore only values this operation wrote.
        for (const old of completed.reverse()) {
          if (readDisk(old.key) !== old.raw) continue;
          if (old.prior != null) writeDisk(old.key, old.prior);
          else {
            try {
              globalThis.localStorage.removeItem(old.key);
            } catch {
              /* Storage can become unavailable. */
            }
          }
        }
        return false;
      }
      completed.push(entry);
    }
    for (const entry of completed) revisions.set(entry.id, entry.raw);
    return true;
  }
  function save(raw) {
    const { recipe } = looks.prepare(raw),
      actor = looks.build(recipe),
      persistent = persistRecipes([recipe]);
    remember(recipe, actor);
    saved.set(recipe.id, recipe);
    return { recipe, persistent };
  }
  function importCharacter(raw) {
    let { recipe } = looks.prepare(raw);
    const disk = readDisk(prefix + recipe.id);
    if (disk && !saved.has(recipe.id)) hydrate();
    const prior = sessionDocs.get(recipe.id);
    if (prior && JSON.stringify(prior) !== JSON.stringify(recipe)) recipe = { ...recipe, id: looks.newId() };
    return save(recipe);
  }
  function scoreFile(score, additional = []) {
    const ids = new Set(score.steps.flatMap((s) => s.actors));
    const provided = new Map([...sessionDocs, ...additional.map((r) => [r.id, looks.prepare(r).recipe])]);
    const characters = [...ids]
      .filter((id) => id.startsWith('look_'))
      .map((id) => {
        const preset = looks.templateById.get(id);
        const doc = provided.get(id) || (preset && looks.prepare(preset).recipe);
        if (!doc) throw new Error('缺少形象存档 · ' + id);
        return doc;
      });
    return characters.length ? { format: 'pine-cast', version: 1, score, characters } : score;
  }
  function readScoreFile(input, persist = false) {
    const data = typeof input === 'string' ? JSON.parse(input) : input;
    if (data?.format !== 'pine-cast') return motion.compile(data);
    if (
      data.version !== 1 ||
      Object.keys(data).some((k) => !['format', 'version', 'score', 'characters'].includes(k)) ||
      !Array.isArray(data.characters) ||
      !Array.isArray(data.score?.steps)
    )
      throw new Error('角色编排包格式无效');
    const score = structuredClone(data.score);
    const ids = new Set(
      score.steps
        .flatMap((s) => (Array.isArray(s?.actors) ? s.actors : []))
        .filter((id) => typeof id === 'string' && id.startsWith('look_'))
    );
    const cast = new Map(motion.characters),
      staged = new Map(),
      packs = new Map(looks.catalog),
      mapped = new Map();
    for (const raw of data.characters) {
      let { recipe } = looks.prepare(raw, packs);
      const original = recipe.id;
      if (!ids.delete(original)) throw new Error('编排含多余或重复角色 · ' + original);
      for (const pack of recipe.embeddedPacks || []) looks.install(pack, packs);
      const prior = sessionDocs.get(original);
      if (prior && JSON.stringify(prior) !== JSON.stringify(recipe))
        recipe = { ...recipe, id: looks.newId() };
      mapped.set(original, recipe.id);
      const actor = looks.build(recipe, packs);
      cast.set(recipe.id, actor);
      staged.set(recipe.id, { recipe, actor });
    }
    if (ids.size) throw new Error('角色编排包缺少形象');
    for (const step of score.steps) {
      if (Array.isArray(step?.actors)) step.actors = step.actors.map((id) => mapped.get(id) || id);
    }
    const plan = motion.compile(score, cast);
    // Validate every part, actor and cue, including shared package versions, before applying any changes.
    if (persist) plan.charactersPersisted = persistRecipes([...staged.values()].map((entry) => entry.recipe));
    for (const { recipe, actor } of staged.values()) {
      remember(recipe, actor);
      if (persist) saved.set(recipe.id, recipe);
    }
    return plan;
  }
  function handoff(link, score, additional = []) {
    const json = JSON.stringify(scoreFile(score, additional));
    try {
      sessionStorage.setItem('pineCreek.threePreview.v1', json);
      link.hash = 'current';
    } catch {
      link.hash = new URLSearchParams({ score: json }).toString();
    }
  }
  function snapshot() {
    if (location.hash !== '#current') return new URLSearchParams(location.hash.slice(1)).get('score');
    // Back or reload must open the transfer for this navigation entry, even after a later preview.
    if (globalThis.history?.state?.pineTransfer) return history.state.pineTransfer;
    const json = sessionStorage.getItem('pineCreek.threePreview.v1');
    if (json && globalThis.history) {
      try { history.replaceState({ ...history.state, pineTransfer: json }, ''); } catch {}
    }
    return json;
  }
  function preview(link, score, seconds, playing, characters) {
    const url = new URL(link.href);
    url.searchParams.set('time', String(seconds));
    url.searchParams.set('play', playing ? '1' : '0');
    link.href = url;
    handoff(link, score, characters);
  }
  function editorLink(actor, tab) {
    const params = new URLSearchParams({ tab });
    if (saved.has(actor.id)) params.set('saved', actor.id);
    else if (sessionDocs.has(actor.id)) {
      return 'atelier.html?' + params + '#' + new URLSearchParams({ character: JSON.stringify(sessionDocs.get(actor.id)) });
    } else if (looks.templateById.has(actor.recipeId)) params.set('preset', actor.recipeId);
    else return;
    return 'atelier.html?' + params;
  }
  return {
    saved,
    recipeFor: (id) => sessionDocs.get(id),
    hydrate,
    installPack,
    save,
    importCharacter,
    scoreFile,
    readScoreFile,
    handoff,
    preview,
    editorLink,
    snapshot
  };
})();
globalThis.PineWardrobe = PineWardrobe;
