// Exercise the actual editor and Canvas renderer in installed Chromium. No npm dependencies.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { join, resolve, sep } = require('node:path');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');

function checkEditor() {
  const byId = (id) => document.getElementById(id);
  const target = byId('qa-result');
  const expect = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  function contour(c = byId('mirror')) {
    const { width: w, height: h } = c;
    const px = c.getContext('2d').getImageData(0, 0, w, h).data;
    let top = h,
      bottom = -1,
      ruler = 2166136261;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w * 0.08; x++) ruler = Math.imul(ruler ^ px[4 * (y * w + x)], 16777619);
      for (let x = Math.ceil(w * 0.32); x < w * 0.76; x++) {
        const i = 4 * (y * w + x);
        if (px[i] + px[i + 1] + px[i + 2] < 351) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }
    return { top, bottom, height: bottom - top, ruler };
  }
  try {
    expect(byId('bearing').value === '90', 'profile link did not open at the requested bearing');
    const firstName = byId('look-name').value;
    byId('look-name').value = '交互测试人物';
    byId('look-name').dispatchEvent(new Event('input'));
    byId('edit-undo').click();
    expect(byId('look-name').value === firstName, 'undo character edits');
    byId('edit-redo').click();
    expect(byId('look-name').value === '交互测试人物', 'redo character edits');
    byId('edit-undo').click();
    const photos = new Map();
    for (const profile of ['child', 'female', 'male']) {
      const b = document.querySelector('[data-body-profile="' + profile + '"]');
      b.click();
      expect(b.getAttribute('aria-pressed') === 'true', 'incorrect selected body profile ' + profile);
      for (const [key, min, max] of [
        ['height', 0.75, 1.3],
        ['shoulders', 0.7, 1.35],
        ['arms', 0.8, 1.25],
        ['legs', 0.8, 1.25]
      ]) {
        const field = byId('edit-' + key);
        expect(
          +field.min === min && +field.max === max && +field.step === 0.01,
          'incorrect slider limits for ' + key
        );
        if (key !== 'height') {
          const hint = field.labels[0].querySelector('.slider-limits');
          expect(
            hint?.textContent === Math.round(min * 100) + '%–' + Math.round(max * 100) + '%',
            'incorrect range shown for ' + key
          );
        }
      }
      const height = byId('edit-height');
      height.value = height.min;
      height.dispatchEvent(new Event('input'));
      const low = contour();
      height.value = height.max;
      height.dispatchEvent(new Event('input'));
      const high = contour();
      expect(low.height > 45 && high.height > 1.63 * low.height, profile + ' does not visibly grow');
      expect(Math.abs(low.bottom - high.bottom) <= 4, profile + ' moved off the baseline');
      expect(low.ruler === high.ruler, profile + ' rescaled the centimeter ruler');
      photos.set(profile, byId('mirror').toDataURL());
    }
    expect(photos.get('female') !== photos.get('male'), 'adult profiles have the same visible pixels');
    document.querySelector('[data-body-profile="child"]').click();
    expect(photos.get('child') === byId('mirror').toDataURL(), 'switching back changed the child');
    const legacy = {
      ...PineLooks.archivedTemplates.get('look_body_female'),
      id: 'look_check_legacy',
      packs: { 'pine-core': PineLooks.styleRelease }
    };
    delete legacy.gender;
    const loaded = PineWardrobe.importCharacter(legacy);
    byId('save-look').click(); // Refresh the library through the editor.
    document.querySelector('[data-key="saved:' + loaded.recipe.id + '"]').click();
    expect(!byId('legacy-body').hidden, 'unmarked adults need their own visible state');
    expect(!document.querySelector('[data-body-profile][aria-pressed=true]'), 'a legacy gender was inferred');
    document.querySelector('[data-body-profile="female"]').click();
    byId('save-look').click();
    const profiled = PineWardrobe.saved.get(legacy.id);
    expect(
      profiled.gender === 'female' && profiled.packs['pine-core'] === PineLooks.profileRelease,
      'body profile or compatible version was lost on save'
    );
    const shoulders = byId('edit-shoulders');
    shoulders.value = shoulders.max;
    shoulders.dispatchEvent(new Event('input'));
    byId('save-look').click();
    const widened = PineWardrobe.saved.get(legacy.id);
    expect(
      widened.gender === 'female' &&
        widened.packs['pine-core'] === PineLooks.proportionRelease &&
        widened.shape.shoulders === 1.35,
      'extended shoulders failed to save on the original look'
    );
    const small = document.createElement('canvas');
    small.style.cssText = 'width:288px;height:224px;display:block';
    document.body.append(small);
    const mirror = atelierPreview.create(small, PineMotion);
    const model = PineLooks.archivedTemplates.get('look_camper');
    const wide = {
      ...model,
      packs: { 'pine-core': PineLooks.release },
      shape: { ...model.shape, shoulders: 1.35, arms: 1.25, legs: 1.25, height: 1.3 }
    };
    const lead = PineLooks.build(wide),
      partner = PineLooks.build({ ...wide, id: 'look_peer' });
    for (const action of ['wave', 'highfive', 'jump']) {
      let fixed;
      for (const u of [0, 0.25, 0.48, 0.72, 0.9]) {
        mirror.show({ actor: lead, compare: partner, action, u, bearing: 0, view: 'body' });
        const next = contour(small).ruler;
        if (fixed === undefined) fixed = next;
        expect(next === fixed, action + ' changed the ruler scale mid-clip on a narrow screen');
      }
    }
    const headFrames = [];
    for (const depth of [0.8, 1, 1.2]) {
      const p = PineLooks.build({
        ...model,
        shape: { ...model.shape, occiput: depth },
        packs: { 'pine-core': PineLooks.sculptRelease }
      });
      const original = p.body.draw;
      p.body.draw = (context, grid, x, y, yaw, pitch, scale) => {
        headFrames.push([x, y, scale]);
        return original(context, grid, x, y, yaw, pitch, scale);
      };
      mirror.show({ actor: p, action: 'idle', u: 0, bearing: 90, view: 'face', detail: false });
    }
    expect(
      headFrames.length === 3 && headFrames.every((f) => JSON.stringify(f) === JSON.stringify(headFrames[0])),
      'editing the occiput reframed the face'
    );
    mirror.dispose();
    small.remove();
    byId('tab-hair').click();
    document.querySelector('[data-hair-group="全部"]').click();
    const cards = [...document.querySelectorAll('[data-hair-style]')];
    expect(cards.length === Object.keys(PineLooks.hairOptions('adult')).length, 'missing age-appropriate hairstyle swatches');
    for (const button of cards) {
      const c = button.querySelector('canvas');
      expect(
        Math.abs(c.width / c.height - c.clientWidth / c.clientHeight) < 0.04,
        'stretched swatch ' + button.dataset.hairStyle
      );
    }
    document.querySelector('[data-hair-angle="180"]').click();
    document.querySelector('[data-hair-style="ponytail"]').click();
    const single = byId('mirror').toDataURL();
    document.querySelector('[data-hair-style="twin-tails"]').click();
    expect(single !== byId('mirror').toDataURL(), 'single and twin ponytails have identical back views');
    const loose = document.querySelector('[data-hair-style="shoulder-length"]');
    loose.click();
    const beforeDye = byId('mirror').toDataURL(),
      beforeCard = loose.querySelector('canvas').toDataURL();
    const palette = [...document.querySelectorAll('[data-hair-color]')];
    expect(palette.length === Object.keys(PineLooks.hairColors).length, 'missing hair colors');
    const dye = palette.find((b) => b.textContent === '铜红');
    dye.click();
    expect(
      dye.getAttribute('aria-pressed') === 'true' && byId('color-hair').value === dye.dataset.hairColor,
      'preset and color picker disagree'
    );
    expect(
      beforeDye !== byId('mirror').toDataURL() && beforeCard !== loose.querySelector('canvas').toDataURL(),
      'dye was not painted on both the mirror and hairstyle card'
    );
    byId('tab-colors').click();
    expect(byId('color-hair').value === dye.dataset.hairColor, 'color was lost when opening the colors tab');
    byId('color-hair').value = '#a6b784';
    byId('color-hair').dispatchEvent(new Event('input'));
    byId('tab-hair').click();
    expect(
      byId('color-hair').value === '#a6b784' &&
        !document.querySelector('[data-hair-color][aria-pressed=true]'),
      'custom color was replaced by a preset'
    );
    byId('save-look').click();
    const styled = PineWardrobe.saved.get(legacy.id);
    expect(
      styled.parts.hair === 'shoulder-length' &&
        styled.colors.hair === '#a6b784' &&
        styled.packs['pine-core'] === PineLooks.hairRelease,
      'saved hair style, dye or core version was lost'
    );
    byId('tab-face').click();
    expect(byId('bearing').value === '0', 'paused idle should face straight ahead for editing');
    const oldPortrait = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(
      !byId('update-head') && byId('mirror').toDataURL() !== oldPortrait,
      'old head did not upgrade in the mirror'
    );
    expect(
      PineWardrobe.saved.get(legacy.id).packs['pine-core'] === PineLooks.hairRelease,
      'preview overwrote the existing save'
    );
    byId('save-look').click();
    const updated = PineWardrobe.saved.get(legacy.id);
    expect(
      updated.packs['pine-core'] === PineLooks.release &&
        updated.id === styled.id &&
        ['shape', 'face', 'parts', 'colors'].every(
          (key) => JSON.stringify(updated[key]) === JSON.stringify(styled[key])
        ),
      'head upgrade changed the identity or other appearance settings'
    );
    const quality = byId('fine-face');
    expect(quality.checked && !byId('face-quality').hidden, 'close-up should open with fine features');
    const detailed = byId('mirror').toDataURL();
    quality.click();
    expect(byId('mirror').toDataURL() !== detailed, 'standard and fine portraits were identical');
    quality.click();
    expect(byId('mirror').toDataURL() === detailed, 'changing quality moved the camera or the pose');
    document.querySelector('[data-view="body"]').click();
    expect(
      quality.checked && !byId('face-quality').hidden,
      'whole-figure detail is unavailable in the full length mirror'
    );
    const canvas = byId('mirror'),
      ctx = canvas.getContext('2d');
    const whole = canvas.toDataURL(),
      { top, height } = contour(canvas);
    const a = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    quality.click();
    const b = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const changes = [0, 0];
    for (let y = top; y < top + height; y++) {
      for (let x = Math.floor(canvas.width * 0.38); x < canvas.width * 0.72; x++) {
        const i = (y * canvas.width + x) * 4;
        if (a[i] + a[i + 1] + a[i + 2] > 510 || b[i] + b[i + 1] + b[i + 2] > 510) continue;
        if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])
          changes[Number(y > top + height * 0.32)]++;
      }
    }
    expect(
      changes.every((n) => n > 15),
      'full-body detail did not change both the painted face and the outfit'
    );
    quality.click();
    expect(canvas.toDataURL() === whole, 'full-body quality switch moved the subject or camera');

    const pose = PineMotion.rig.pose(lead.rig, {});
    const coarse = lead.body.makePose(pose);
    for (const { body, model } of PineMotion.faceLayers(lead, pose, coarse)) {
      const testSlice = document.createElement('canvas');
      testSlice.width = body.nx;
      testSlice.height = body.ny;
      const ctx = testSlice.getContext('2d', { willReadFrequently: true });
      const pitch = body.nx * body.ny;
      for (const z of [0, Math.floor(body.nz / 2), body.nz - 1]) {
        body.drawSlice(ctx, model, z + 1);
        const pixels = new Uint32Array(ctx.getImageData(0, 0, body.nx, body.ny).data.buffer);
        expect(
          pixels.every((c, i) => c === model.colors[z * pitch + i]),
          'cropped slice shifted at ' + z
        );
      }
    }
    const adult = PineLooks.build(PineLooks.templates.find((p) => p.id === 'look_body_female'));
    const child = PineLooks.build(PineLooks.templates.find((p) => p.id === 'look_chorus'));
    const highfive = PineMotion.actions.get('highfive').sample(0.5, adult, child);
    const cast = [adult, child].map((actor, i) => ({
      ...highfive[i],
      actor,
      body: actor.body,
      model: actor.body.makePose(highfive[i].pose)
    }));
    const bands = studioPortraitLayers(cast, PineMotion);
    for (const p of cast) {
      const mouth = p.z + PineMotion.rig.socket(p.actor, p.pose, 'mouth')[2];
      expect(
        bands?.some(
          (b) => b.body.density > p.body.density && mouth >= b.z && mouth < b.z + b.body.nz / b.body.density
        ),
        'adult and child both need detail at their own head height'
      );
    }
    const archived = PineWardrobe.importCharacter({
      ...PineLooks.archivedTemplates.get('look_body_female'),
      id: 'look_archived_fringe',
      packs: { 'pine-core': PineLooks.headRelease }
    }).recipe;
    byId('save-look').click();
    document.querySelector('[data-key="saved:' + archived.id + '"]').click();
    byId('tab-hair').click();
    const archivedPhoto = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(
      archivedPhoto !== byId('mirror').toDataURL() && !byId('update-head'),
      'hair tab failed to preview the new fringe'
    );
    expect(
      PineWardrobe.saved.get(archived.id).packs['pine-core'] === PineLooks.headRelease,
      'hair preview changed the pinned save'
    );
    const previousFigure = PineWardrobe.importCharacter({
      ...PineLooks.archivedTemplates.get('look_body_female'),
      id: 'look_prior_figure',
      packs: { 'pine-core': PineLooks.strandRelease }
    }).recipe;
    byId('save-look').click();
    document.querySelector('[data-key="saved:' + previousFigure.id + '"]').click();
    byId('tab-shape').click();
    const beforeContour = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(beforeContour !== byId('mirror').toDataURL(), 'the full-body contour preview is missing');
    expect(
      PineWardrobe.saved.get(previousFigure.id).packs['pine-core'] === PineLooks.strandRelease,
      'the contour preview changed the original character on disk'
    );
    byId('tab-wear').click();
    expect(
      document.querySelectorAll('.workshop-outfits [data-outfit]').length === 6,
      'missing workshop outfits'
    );
    document.querySelector('[data-outfit="hiker"]').click();
    expect(
      byId('edit-bag').value === 'trail-pack' && byId('edit-top').value === 'trail-shell',
      'hiker outfit'
    );
    const change = (id, value) => {
      const field = byId('edit-' + id);
      field.value = value;
      field.dispatchEvent(new Event('change'));
    };
    change('glasses', 'round');
    change('phone', 'rugged');
    document.querySelector('[data-outfit="surveyor"]').click();
    expect(
      byId('edit-glasses').value === '' && byId('edit-phone').value === 'rugged',
      'wearable vs device selection'
    );
    expect(
      byId('edit-hat').value === 'pine-core/survey-hat@' + PineLooks.release &&
        byId('edit-attachment').value === 'map-tube',
      'survey gear'
    );
    change('bag', 'school-pack');
    change('bottle', 'thermos');
    document.querySelector('[data-try-action="drink"]').click();
    expect(byId('action').value === 'drink', 'drink preview');
    document.querySelector('[data-try-action="type"]').click();
    expect(byId('action').value === 'type', 'typing preview');
    byId('tab-colors').click();
    byId('color-bag').value = '#67853e';
    byId('color-bag').dispatchEvent(new Event('input'));
    byId('save-look').click();
    const wearing = PineWardrobe.saved.get(previousFigure.id);
    expect(
      wearing.parts.bag === 'school-pack' &&
        wearing.colors.bag === '#67853e' &&
        wearing.parts.phone === 'rugged',
      'saved custom outfit'
    );
    const query = byId('style-query');
    function search(term) {
      query.value = term;
      query.dispatchEvent(new Event('input'));
    }
    function choose(term, expected) {
      search(term);
      const firstMatch = byId('style-matches').querySelector('button');
      expect(firstMatch?.dataset.match === expected, 'search order for ' + term);
      query.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(byId('style-results').hidden, 'search selection did not close');
    }
    search('眼睛');
    expect(!!byId('style-matches').querySelector('.more-results'), 'missing search pagination');
    byId('style-matches').querySelector('.more-results').click();
    expect(byId('style-matches').querySelectorAll('[data-match]').length > 12, 'search pagination');
    search('不存在xyz');
    expect(!byId('style-matches').children.length, 'irrelevant search results');
    query.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(byId('style-results').hidden, 'escape did not dismiss results');
    choose('鱼骨辫', 'hair/fishtail');
    expect(
      document.querySelector('[data-hair-group="编发"]').getAttribute('aria-pressed') === 'true',
      'filtered hairstyle group'
    );
    choose('眉峰眉', 'brows/angled');
    expect(byId('edit-brows').value === 'angled', 'brows not applied');
    choose('琥珀内环', 'iris/amber');
    choose('头戴耳机', 'audio/headphones');
    expect(byId('edit-audio').value === 'headphones', 'earphones not applied');
    byId('tab-colors').click();
    const setDye = (key, value) => {
      const field = byId('color-' + key);
      field.value = value;
      field.dispatchEvent(new Event('input'));
    };
    setDye('eyes', '#267a8f');
    expect(byId('color-leftEye').value === '#267a8f', 'left eye failed to inherit a changed eye color');
    setDye('leftEye', '#855840');
    byId('color-leftEye').closest('.dye-setting').querySelector('button').click();
    expect(byId('color-leftEye').value === '#267a8f', 'reset eye dye');
    setDye('brow', '#50372b');
    byId('save-look').click();
    const mixed = PineWardrobe.saved.get(previousFigure.id);
    expect(
      mixed.parts.hair === 'fishtail' &&
        mixed.parts.audio === 'headphones' &&
        mixed.face.brows === 'angled' &&
        mixed.face.iris === 'amber' &&
        mixed.colors.brow === '#50372b' &&
        !Object.hasOwn(mixed.colors, 'leftEye'),
      'saved mixed collection'
    );
    const oldCut = PineWardrobe.importCharacter({
      ...PineLooks.archivedTemplates.get('look_body_male'),
      id: 'look_archived_short_hair',
      packs: { 'pine-core': PineLooks.collectionRelease }
    }).recipe;
    byId('save-look').click();
    document.querySelector('[data-key="saved:' + oldCut.id + '"]').click();
    byId('tab-hair').click();
    document.querySelector('[data-hair-angle="90"]').click();
    const depth = byId('edit-occiput');
    expect(
      depth.value === '1' && +depth.min === 0.8 && +depth.max === 1.2 && +depth.step === 0.01,
      'occipital depth control'
    );
    depth.value = depth.min;
    depth.dispatchEvent(new Event('input'));
    const shallow = byId('mirror').toDataURL();
    expect(
      byId('update-head')?.textContent === '试用新下颌与立体短发' &&
        PineWardrobe.saved.get(oldCut.id).packs['pine-core'] === PineLooks.collectionRelease,
      'profile edit overwrote archived hair'
    );
    depth.value = depth.max;
    depth.dispatchEvent(new Event('input'));
    expect(shallow !== byId('mirror').toDataURL(), 'side view did not show posterior depth');
    byId('tab-face').click();
    expect(byId('edit-occiput').value === '1.2', 'face and hair panels disagree on occipital depth');
    byId('save-look').click();
    const reshaped = PineWardrobe.saved.get(oldCut.id);
    expect(
      reshaped.shape.occiput === 1.2 && reshaped.packs['pine-core'] === PineLooks.sculptRelease,
      'profile failed to persist'
    );
    byId('tab-hair').click();
    const oldHair = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(
      !byId('update-head') && oldHair !== byId('mirror').toDataURL(),
      'short hair upgrade was invisible'
    );
    expect(
      PineWardrobe.saved.get(oldCut.id).packs['pine-core'] === PineLooks.sculptRelease,
      'short hair preview overwrote saved character'
    );
    byId('save-look').click();
    const lifted = PineWardrobe.saved.get(oldCut.id);
    expect(
      lifted.packs['pine-core'] === PineLooks.release && lifted.shape.occiput === 1.2,
      'short hair upgrade lost shape or pack version'
    );
    const priorJaw = PineWardrobe.importCharacter({
      ...lifted,
      id: 'look_prior_jaw',
      packs: { 'pine-core': PineLooks.volumeRelease }
    }).recipe;
    byId('save-look').click();
    document.querySelector('[data-key="saved:' + priorJaw.id + '"]').click();
    byId('tab-face').click();
    expect(byId('update-head')?.textContent === '试用新下颌', 'missing jaw-only upgrade');
    const oldJaw = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(
      oldJaw !== byId('mirror').toDataURL() &&
        PineWardrobe.saved.get(priorJaw.id).packs['pine-core'] === PineLooks.volumeRelease,
      'jaw preview did not preserve the prior save'
    );
    byId('tab-face').click();
    const pick = document.querySelector('[data-jaw-preset="soft"]');
    pick.click();
    expect(byId('edit-jawNeck').value === '0.4', 'jaw/neck preset');
    byId('jaw-points').click();
    expect(byId('bearing').value === '90' && byId('jaw-points').checked, 'side profile landmarks');
    const anchor = byId('mirror').toDataURL();
    byId('jaw-points').click();
    expect(byId('mirror').toDataURL() !== anchor, 'landmark overlay rendered');
    byId('jaw-demo').click();
    expect(byId('action').value === 'open-mouth' && byId('jaw-points').checked &&
      byId('play-look').getAttribute('aria-pressed') === 'true', 'ear-side jaw trial');
    byId('play-look').click();
    byId('jaw-points').click();
    byId('edit-jawNeck').value = '0.85';
    byId('edit-jawNeck').dispatchEvent(new Event('input', { bubbles: true }));
    byId('look-role').value = '星港向导';
    byId('look-role').dispatchEvent(new Event('input'));
    byId('look-era').value = 'scifi';
    byId('look-era').dispatchEvent(new Event('change'));
    byId('save-look').click();
    const edited = [...PineWardrobe.saved.values()].find((p) => p.identity?.role === '星港向导');
    expect(
      edited?.shape.jawNeck === 0.85 && edited.identity.era === 'scifi',
      'jaw geometry and editable role persist'
    );
    const previousProfile = PineWardrobe.importCharacter({
      ...edited, id: 'look_prior_profile', packs: { 'pine-core': PineLooks.mandibleRelease }
    }).recipe;
    byId('save-look').click();
    document.querySelector('[data-key="saved:' + previousProfile.id + '"]').click();
    byId('tab-face').click();
    expect(byId('update-head')?.textContent === '试用新侧面轮廓', 'missing sagittal profile upgrade');
    const originalSide = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(originalSide !== byId('mirror').toDataURL(), 'upgrading did not change the side view');
    for (const [key, min, max] of [['headDepth', 0.8, 1.2], ['faceRelief', 0, 1.8]]) {
      const field = byId('edit-' + key);
      expect(+field.min === min && +field.max === max && +field.value === 1, key + ' range or neutral');
      field.value = min;
      field.dispatchEvent(new Event('input'));
      const low = byId('mirror').toDataURL();
      field.value = max;
      field.dispatchEvent(new Event('input'));
      expect(low !== byId('mirror').toDataURL(), key + ' has no visible effect');
    }
    expect(PineWardrobe.saved.get(previousProfile.id).packs['pine-core'] === PineLooks.mandibleRelease,
      'trying new depth overwrote the saved profile');
    byId('save-look').click();
    const savedProfile = PineWardrobe.saved.get(previousProfile.id);
    expect(savedProfile.packs['pine-core'] === PineLooks.release &&
      savedProfile.shape.headDepth === 1.2 && savedProfile.shape.faceRelief === 1.8, 'depth controls did not persist');
    const priorOcciput = PineWardrobe.importCharacter({
      ...savedProfile, id: 'look_prior_occiput', packs: { 'pine-core': PineLooks.sagittalRelease }
    }).recipe;
    byId('save-look').click();
    document.querySelector('[data-key="saved:' + priorOcciput.id + '"]').click();
    byId('tab-face').click();
    expect(byId('update-head')?.textContent === '试用微收后脑', 'missing posterior-only upgrade');
    const rounder = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(rounder !== byId('mirror').toDataURL(), 'posterior trim was invisible');
    expect(PineWardrobe.saved.get(priorOcciput.id).packs['pine-core'] === PineLooks.sagittalRelease,
      'preview overwrote the prior occiput');
    byId('save-look').click();
    const trimmed = PineWardrobe.saved.get(priorOcciput.id);
    expect(trimmed.packs['pine-core'] === PineLooks.release && JSON.stringify(trimmed.shape) === JSON.stringify(savedProfile.shape),
      'the posterior-only upgrade changed the saved shape controls');
    document.querySelector('[data-realm=historic]').click();
    byId('look-query').value = '书生';
    byId('look-query').dispatchEvent(new Event('input'));
    const scholars = [...document.querySelectorAll('#look-shelf [data-key]')].map(b=>b.dataset.key);
    expect(scholars.length === 4 && scholars.includes('preset:look_scholar') && scholars.includes('preset:look_river_scholar'), 'realm and role search');
    choose('眼窝深浅', 'morph/eyeDepth');
    expect(byId('edit-eyeDepth').closest('details').open, 'search opens the matching facial control');
    choose('低颧饱颊', 'cheekPreset/low');
    expect(byId('edit-cheekHeight').value === '-0.75' && byId('edit-cheekFullness').value === '0.72', 'independent cheek preset');
    document.querySelector('[data-face-preset="deep-wide"]').click();
    expect(byId('edit-eyeDepth').value === '0.75' && byId('edit-noseWidth').value === '0.8' &&
      byId('edit-cheekHeight').value === '-0.75', 'feature recipe must preserve the cheek shape');
    byId('bearing').value = '55';
    byId('bearing').dispatchEvent(new Event('input'));
    const fullCheek = byId('mirror').toDataURL();
    expect(!byId('soften-cheeks').disabled, 'full cheeks should offer a local correction');
    byId('soften-cheeks').click();
    expect(Number(byId('edit-cheekFullness').value) < 0.2 && byId('soften-cheeks').disabled &&
      byId('edit-cheekHeight').value === '-0.75' && byId('edit-noseWidth').value === '0.8' &&
      byId('bearing').value === '55' && byId('mirror').toDataURL() !== fullCheek,
      'soften the visible cheek of the current draft at the same bearing');
    expect(!Object.hasOwn(PineWardrobe.saved.get(priorOcciput.id).shape, 'cheekFullness'), 'correction needs an explicit save');
    byId('edit-noseWidth').value = '0.56';
    byId('edit-noseWidth').dispatchEvent(new Event('input'));
    byId('look-name').value = '尚未保存的捏脸';
    byId('look-name').dispatchEvent(new Event('input'));
    const previousSide = byId('mirror').toDataURL(), savedCount = PineWardrobe.saved.size;
    byId('random-style').closest('details').querySelector('summary').click();
    expect(byId('random-style').value === 'natural', 'new random settings should start with a coordinated look');
    byId('random-style').value = 'expressive';
    byId('random-style').dispatchEvent(new Event('change'));
    const locks = [...document.querySelectorAll('[data-random-lock]')];
    expect(locks.length === 4 && locks.every((el) => !el.checked), 'four independently selectable locks');
    for (const el of locks) el.click();
    byId('random-face').click();
    expect(!byId('undo-random').hidden && byId('mirror').toDataURL() !== previousSide, 'face-only randomization');
    byId('random-character').click();
    const firstRoll = byId('look-name').value;
    byId('random-character').click();
    expect(byId('mirror').toDataURL() !== previousSide && firstRoll.startsWith('新人物 '), 'new editable random character');
    byId('undo-random').click();
    expect(byId('look-name').value === '尚未保存的捏脸' && byId('edit-noseWidth').value === '0.56' &&
      byId('mirror').toDataURL() === previousSide && PineWardrobe.saved.size === savedCount, 'restore draft across multiple rolls');
    byId('random-character').click();
    const newLabel = byId('look-name').value;
    byId('save-look').click();
    const generated = [...PineWardrobe.saved.values()].find((doc) => doc.label === newLabel);
    expect(generated && generated.id !== priorOcciput.id && generated.packs['pine-core'] === PineLooks.release &&
      PineWardrobe.saved.size === savedCount + 1, 'random character saved as new recipe');
    expect(generated.base === trimmed.base && generated.gender === trimmed.gender &&
      ['height', 'shoulders', 'arms', 'legs'].every((key) => generated.shape[key] === trimmed.shape[key]) &&
      Object.entries(trimmed.parts).every(([key, value]) => generated.parts[key] === value) &&
      ['skin', 'hair', 'top', 'bottom', 'shoes', 'accent'].every((key) => generated.colors[key] === trimmed.colors[key]),
      'locked body, skin, hairstyle and wardrobe survived rolls, undo and save');
    document.querySelector('[data-cheek-preset="low"]').click();
    byId('soften-cheeks').click();
    const repaired = Number(byId('edit-cheekFullness').value);
    byId('save-look').click();
    expect((PineWardrobe.saved.get(generated.id).shape.cheekFullness || 0) === repaired &&
      PineWardrobe.saved.size === savedCount + 1, 'save the local cheek correction under the same character ID');
    const oldBaby = PineWardrobe.importCharacter({
      ...PineLooks.archivedTemplates.get('look_workshop_baby'), id: 'look_archived_infant',
      packs: { 'pine-core': PineLooks.morphRelease }
    }).recipe;
    document.querySelector('[data-realm=""]').click();
    byId('look-query').value = oldBaby.id;
    byId('look-query').dispatchEvent(new Event('input'));
    document.querySelector('[data-key="saved:' + oldBaby.id + '"]').click();
    byId('tab-face').click();
    expect(byId('update-head')?.textContent === '试用婴儿头型', 'missing infant-specific upgrade');
    const earlierBaby = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(earlierBaby !== byId('mirror').toDataURL() && !byId('update-head'), 'infant preview did not change');
    document.querySelector('[data-face-preset="infant-almond"]').click();
    expect(byId('edit-nose').value === 'broad', 'infant preset should use the ordinary editable nose slot');
    expect(PineWardrobe.saved.get(oldBaby.id).packs['pine-core'] === PineLooks.morphRelease, 'preview changed the previous save');
    byId('save-look').click();
    expect(PineWardrobe.saved.get(oldBaby.id).packs['pine-core'] === PineLooks.release, 'save the new infant in place');
    const firstInfant = PineWardrobe.importCharacter({
      ...oldBaby, id: 'look_prior_infant_nape', packs: { 'pine-core': PineLooks.infantRelease }
    }).recipe;
    byId('look-query').value = firstInfant.id;
    byId('look-query').dispatchEvent(new Event('input'));
    document.querySelector('[data-key="saved:' + firstInfant.id + '"]').click();
    byId('tab-face').click();
    document.querySelector('[data-cheek-preset="low"]').click();
    expect(byId('update-head')?.textContent === '试用婴儿后脑曲线' &&
      document.querySelector('[data-face-preset="infant-almond"]'), '1.13.0 infant keeps its own head and face presets');
    byId('bearing').value = '90';
    byId('bearing').dispatchEvent(new Event('input'));
    const previousNape = byId('mirror').toDataURL();
    byId('update-head').click();
    expect(!byId('update-head') && byId('mirror').toDataURL() !== previousNape, 'preview the new posterior profile');
    expect(PineWardrobe.saved.get(firstInfant.id).packs['pine-core'] === PineLooks.infantRelease, 'preview must preserve the pinned save');
    byId('save-look').click();
    expect(PineWardrobe.saved.get(firstInfant.id).packs['pine-core'] === PineLooks.release, 'save the refitted nape');
    const priorSideRecipe = PineWardrobe.importCharacter({
      ...PineLooks.archivedTemplates.get('look_fern'), id: 'look_prior_facial_planes',
      packs: { 'pine-core': PineLooks.infantNapeRelease }
    }).recipe;
    byId('look-query').value = priorSideRecipe.id;
    byId('look-query').dispatchEvent(new Event('input'));
    document.querySelector('[data-key="saved:' + priorSideRecipe.id + '"]').click();
    byId('tab-face').click();
    byId('bearing').value = '90';
    byId('bearing').dispatchEvent(new Event('input'));
    const oldSide = byId('mirror').toDataURL();
    expect(byId('update-head')?.textContent === '试用自然侧脸', 'offer the side profile on a pinned 1.13.1 child');
    byId('update-head').click();
    expect(byId('mirror').toDataURL() !== oldSide && byId('bearing').value === '90', 'redraw in the same camera');
    expect(PineWardrobe.saved.get(priorSideRecipe.id).packs['pine-core'] === PineLooks.infantNapeRelease, 'preview must keep the save');
    byId('save-look').click();
    const savedSide = PineWardrobe.saved.get(priorSideRecipe.id);
    expect(savedSide.packs['pine-core'] === PineLooks.release && ['face', 'shape', 'parts', 'colors'].every(
      key => JSON.stringify(savedSide[key]) === JSON.stringify(priorSideRecipe[key])), 'save the upgraded recipe in place');
    const original = PineWardrobe.importCharacter({
      ...PineLooks.archivedTemplates.get('look_body_female'), id: 'look_archived_lips',
      packs: { 'pine-core': PineLooks.naturalProfileRelease }
    }).recipe;
    byId('look-query').value = original.id;
    byId('look-query').dispatchEvent(new Event('input'));
    document.querySelector('[data-key="saved:' + original.id + '"]').click();
    byId('tab-face').click();
    expect(byId('update-head')?.textContent === '试用嘴唇与下颌线', 'offer the two controls on a 1.14 save');
    for (const angle of [60, 270, 90]) {
      const button = document.querySelector('[data-profile-angle="' + angle + '"]');
      button.click();
      expect(+byId('bearing').value === angle && button.getAttribute('aria-pressed') === 'true' &&
        byId('mirror').dataset.framing === 'face', 'frame the face at ' + angle);
    }
    byId('update-head').click();
    const natural = byId('mirror').toDataURL();
    const lips = byId('edit-lipProjection'), jaw = byId('edit-jawDefinition');
    lips.value = '-0.45'; lips.dispatchEvent(new Event('input'));
    const tucked = byId('mirror').toDataURL();
    expect(tucked !== natural && jaw.value === '0' && lips.getAttribute('aria-valuetext') === '内收 45%', 'independent lip adjustment');
    jaw.value = '0.65'; jaw.dispatchEvent(new Event('input'));
    expect(byId('mirror').toDataURL() !== tucked && lips.value === '-0.45' &&
      jaw.getAttribute('aria-valuetext') === '清晰 65%', 'independent jaw definition');
    expect(PineWardrobe.saved.get(original.id).packs['pine-core'] === PineLooks.naturalProfileRelease, 'preserve the original during preview');
    byId('save-look').click();
    const sculpted = PineWardrobe.saved.get(original.id);
    expect(sculpted.packs['pine-core'] === PineLooks.release && sculpted.shape.lipProjection === -0.45 &&
      sculpted.shape.jawDefinition === 0.65, 'persist both profile settings on the character');
    const pinnedManga = PineWardrobe.importCharacter({ ...sculpted, id: 'look_prior_profile_ink',
      packs: { 'pine-core': PineLooks.illustratedRelease },
      face: { ...PineLooks.facePresets.classic.face, ...sculpted.face, style: 'manga', nose: 'aquiline' }
    }).recipe;
    byId('look-query').value = pinnedManga.id;
    byId('look-query').dispatchEvent(new Event('input'));
    document.querySelector('[data-key="saved:' + pinnedManga.id + '"]').click();
    byId('tab-face').click();
    document.querySelector('[data-profile-angle="270"]').click();
    const pinnedSide = byId('mirror').toDataURL();
    expect(byId('portrait-style').value === 'manga' && byId('update-head')?.textContent === '试用新版侧脸',
      'open a 1.16.0 manga save in its original style');
    byId('update-head').click();
    expect(byId('mirror').toDataURL() !== pinnedSide && byId('bearing').value === '270' &&
      PineWardrobe.saved.get(pinnedManga.id).packs['pine-core'] === PineLooks.illustratedRelease,
      'preview the new profile at the same angle before saving');
    byId('save-look').click();
    const fitted = PineWardrobe.saved.get(pinnedManga.id);
    expect(fitted.packs['pine-core'] === PineLooks.release && ['face', 'shape', 'parts', 'colors'].every(
      key => JSON.stringify(fitted[key]) === JSON.stringify(pinnedManga[key])), 'upgrade just the contour in place');
    const oldArt = PineWardrobe.importCharacter({
      ...PineLooks.archivedTemplates.get('look_relay'), id: 'look_prior_art_direction',
      packs: { 'pine-core': PineLooks.lipJawRelease }
    }).recipe;
    byId('look-query').value = oldArt.id;
    byId('look-query').dispatchEvent(new Event('input'));
    document.querySelector('[data-key="saved:' + oldArt.id + '"]').click();
    byId('tab-face').click();
    const styleSelect = byId('portrait-style'), legacyFrame = byId('mirror').toDataURL();
    expect(styleSelect.value === 'natural' && byId('update-head')?.textContent === '试用游戏立绘', 'original drawing style of a 1.15 save');
    const guide = document.querySelector('.turnaround-guide'), originalAngle = Number(byId('bearing').value);
    guide.open = true;
    for (const b of guide.querySelectorAll('[data-art-angle]')) {
      b.click();
      expect(Number(byId('bearing').value) === Number(b.dataset.artAngle) &&
        byId('portrait-style').value === 'natural', 'reference thumbnails rotate the existing character');
      expect(guide.querySelectorAll('[aria-pressed="true"]').length === 1 && b.getAttribute('aria-pressed') === 'true',
        'highlight the matching reference while turning the camera');
    }
    byId('bearing').value = 180;
    byId('bearing').dispatchEvent(new Event('input'));
    expect(!guide.querySelector('[aria-pressed="true"]'), 'a rear view clears the front-facing references');
    byId('bearing').value = originalAngle;
    byId('bearing').dispatchEvent(new Event('input'));
    guide.open = false;
    styleSelect.value = 'manga'; styleSelect.dispatchEvent(new Event('change'));
    const mangaFrame = byId('mirror').toDataURL();
    expect(mangaFrame !== legacyFrame && byId('edit-eyes').value === oldArt.face.eyes, 'redraw the same eye style');
    byId('choose-faces').click();
    const candidates = () => [...document.querySelectorAll('[data-face-candidate]')];
    expect(candidates().length === 4 && new Set(candidates().map(card => card.textContent)).size === 4,
      'offer four separate designs for the same actor');
    const firstCard = candidates()[0];
    byId('choose-faces').click();
    expect(candidates().length === 4 && !firstCard.isConnected, 'reroll the four face cards');
    candidates()[1].click();
    expect(candidates().length === 4 && candidates()[1].getAttribute('aria-pressed') === 'true' &&
      styleSelect.value === 'manga' && byId('look-name').value === oldArt.label &&
      !byId('undo-random').hidden, 'apply just the chosen face');
    const stableCards = candidates(), startAngle = byId('bearing').value;
    for (const angle of [90, 45, 0]) {
      const control = document.querySelector('[data-candidate-angle="' + angle + '"]');
      control.click();
      const camera = +byId('bearing').value;
      expect(Math.min(camera, 360 - camera) === angle && control.getAttribute('aria-pressed') === 'true' &&
        candidates().every((card, i) => card === stableCards[i]) && stableCards[1].getAttribute('aria-pressed') === 'true',
        'rotate the same four faces and preserve the selection at ' + angle);
    }
    byId('bearing').value = startAngle;
    byId('bearing').dispatchEvent(new Event('input'));
    const secondFrame = byId('mirror').toDataURL();
    candidates()[2].click();
    expect(candidates()[1].getAttribute('aria-pressed') === 'false' && byId('mirror').toDataURL() !== secondFrame,
      'audition another face from the same four at the current angle');
    byId('random-character').click();
    expect(styleSelect.value === 'manga', 'whole-person randomization respects the selected style');
    byId('undo-random').click();
    expect(byId('mirror').toDataURL() === mangaFrame, 'undo to the exact original manga portrait');
    byId('choose-faces').click();
    candidates()[0].click();
    expect(PineWardrobe.saved.get(oldArt.id).packs['pine-core'] === PineLooks.lipJawRelease, 'preview keeps the archived art intact');
    byId('save-look').click();
    const selected = PineWardrobe.saved.get(oldArt.id);
    expect(selected.face.style === 'manga' && ['parts', 'colors'].every(key =>
      JSON.stringify(selected[key]) === JSON.stringify(oldArt[key])) &&
      ['height', 'shoulders', 'arms', 'legs'].every(key => selected.shape[key] === oldArt.shape[key]),
      'save a reusable face with the same body, wardrobe and colors');
    const opening = byId('edit-eyeOpening');
    opening.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    opening.value = '0.22'; opening.dispatchEvent(new Event('input'));
    const movingFace = byId('mirror').toDataURL();
    window.dispatchEvent(new PointerEvent('pointerup'));
    expect(byId('mirror').toDataURL() !== movingFace && opening.value === '0.22',
      'restore the detailed portrait at the selected value on pointer release');
    byId('tab-shape').click();
    expect(!byId('edit-anatomy-skull'), 'old versions must keep their original body editor');
    byId('try-figure').click();
    expect(byId('try-figure').disabled && byId('save-state').dataset.dirty === 'true',
      'upgrading a saved figure must be an explicit, undoable edit');
    byId('edit-undo').click();
    expect(!byId('try-figure').disabled, 'undo must restore the previous figure painter');
    byId('edit-redo').click();
    expect(!byId('edit-anatomy-skull') && byId('portrait-style').value === 'animation', 'trial selects the painted animation face');
    byId('tab-face').click();
    const artForm = byId('edit-face-form');
    expect(artForm.value === 'balanced', 'show the implicit default base face');
    const beforeForm = byId('mirror').toDataURL();
    artForm.value = 'angular'; artForm.dispatchEvent(new Event('change'));
    expect(byId('mirror').toDataURL() !== beforeForm, 'the selected base face changes the live actor');
    const formMix = byId('edit-formMix');
    expect(!formMix.disabled, 'selected art base enables its blend control');
    formMix.value = '0.65'; formMix.dispatchEvent(new Event('input'));
    const reviewLink = byId('figure-link');
    reviewLink.dispatchEvent(new Event('focus'));
    let reviewUrl = new URL(reviewLink.href);
    const submitted = JSON.parse(new URLSearchParams(reviewUrl.hash.slice(1)).get('character'));
    expect(reviewUrl.searchParams.get('subject') === 'draft' && reviewUrl.searchParams.get('before') === 'current' &&
      reviewUrl.searchParams.get('framing') === 'head' && submitted.id === oldArt.id && submitted.face.form === 'angular' &&
      submitted.face.formMix === .65 && PineWardrobe.saved.get(oldArt.id).face.formMix !== .65,
      'the comparison opens the current unsaved sculpture without updating the wardrobe');
    byId('try-base-face').click();
    const formField = byId('edit-face-form');
    expect(!byId('try-base-face') && formField.value === 'angular' && byId('edit-formMix').value === '0.65',
      'enter the drawn base on the current sculpt and strength');
    formField.value = 'round'; formField.dispatchEvent(new Event('change'));
    const drawnUrl = new URL(reviewLink.href);
    const drawnDoc = JSON.parse(new URLSearchParams(drawnUrl.hash.slice(1)).get('character'));
    expect(drawnDoc.packs['pine-core'] === PineLooks.baseFaceRelease && drawnDoc.face.form === 'round' &&
      drawnUrl.searchParams.get('before') === 'bases', 'send the selected drawn face to its own comparison');
    byId('edit-undo').click();
    byId('edit-undo').click();
    expect(byId('try-base-face') && byId('edit-face-form').value === 'angular', 'return to the archived painter through undo');
    byId('tab-shape').click();
    const bodyFinish = byId('edit-body-finish');
    expect(bodyFinish.value === '', 'existing recipes keep their original body paint');
    bodyFinish.value = 'painted'; bodyFinish.dispatchEvent(new Event('change'));
    reviewUrl = new URL(reviewLink.href);
    expect(reviewUrl.searchParams.get('before') === 'whole' &&
      JSON.parse(new URLSearchParams(reviewUrl.hash.slice(1)).get('character')).bodyFinish === 'painted',
      'a finished trial opens against the stable renderer');
    const seam=byId('edit-clothing-cut'), uncutRecipe=JSON.parse(new URLSearchParams(reviewUrl.hash.slice(1)).get('character'));
    seam.value='cut';seam.dispatchEvent(new Event('change'));
    const sewnUrl=new URL(reviewLink.href), sewn=JSON.parse(new URLSearchParams(sewnUrl.hash.slice(1)).get('character'));
    expect(sewnUrl.searchParams.get('before')==='cut' && sewn.packs['pine-core']===PineLooks.clothingStudyRelease &&
      JSON.stringify(sewn.face)===JSON.stringify(uncutRecipe.face) && JSON.stringify(sewn.parts)===JSON.stringify(uncutRecipe.parts),
      'selecting clothing must preserve the actor and open the matching comparison');
    const changeField = (id,value) => {
      const field=byId('edit-'+id);
      field.value=value; field.dispatchEvent(new Event('change'));
    };
    const portableDraft = () => JSON.parse(new URLSearchParams(new URL(reviewLink.href).hash.slice(1)).get('character'));
    byId('tab-face').click(); changeField('feature-paint','painted');
    const paintedDoc=portableDraft();
    expect(paintedDoc.packs['pine-core']===PineLooks.featureStudyRelease && new URL(reviewLink.href).searchParams.get('before')==='features' &&
      JSON.stringify(paintedDoc.face)===JSON.stringify(sewn.face), 'applying feature ink changed the edited face');
    byId('tab-shape').click(); changeField('clothing-cut','original');
    expect(portableDraft().clothingCut==='original' && portableDraft().packs['pine-core']===PineLooks.featureStudyRelease,
      'choosing the old shirt must keep the painted eyes and mouth');
    byId('tab-face').click(); changeField('feature-paint','original');
    expect(portableDraft().packs['pine-core']===PineLooks.baseFaceRelease && !portableDraft().clothingCut,'original clothes and face must both be selectable');
    byId('edit-undo').click(); byId('edit-undo').click(); byId('edit-undo').click();
    byId('tab-shape').click();
    byId('edit-undo').click();
    expect(byId('edit-clothing-cut').value==='original' && new URL(reviewLink.href).searchParams.get('before')==='whole', 'clothing undo must restore the actual previous version');
    const assembly = { torso: 'broad', arms: 'slender', legs: 'strong' };
    for (const [slot, value] of Object.entries(assembly)) {
      const field = byId('edit-anatomy-' + slot);
      expect(field.value === 'balanced' && field.options.length === Object.keys(PineLooks.anatomyParts[slot]).length,
        'upgrading should start with an editable standard ' + slot);
      field.value = value;
      field.dispatchEvent(new Event('change'));
    }
    byId('edit-undo').click();
    expect(byId('edit-anatomy-legs').value === 'balanced' && byId('edit-anatomy-arms').value === 'slender',
      'undo one component edit without replacing the others');
    byId('edit-redo').click();
    document.querySelector('[data-body-profile="baby"]').click();
    expect(Object.entries(assembly).every(([slot, value]) => byId('edit-anatomy-' + slot).value === value),
      'age change must retain the chosen components');
    document.querySelector('[data-random-lock="body"]').checked = true;
    byId('random-character').click();
    expect(byId('try-figure').disabled && byId('edit-body-finish').value === 'painted' && Object.entries(assembly).every(([slot, value]) =>
      byId('edit-anatomy-' + slot).value === value), 'body lock must retain the renderer and all component choices');
    byId('undo-random').click();
    byId('save-look').click();
    const assembled = PineWardrobe.saved.get(oldArt.id);
    const diskRecipe = JSON.parse(localStorage.getItem('pineCreek.look.v1.' + assembled.id));
    const reimported = PineWardrobe.importCharacter(diskRecipe).recipe;
    expect(assembled.packs['pine-core'] === PineLooks.gameFaceRelease &&
      reimported.id === assembled.id && reimported.bodyFinish === 'painted' && reimported.face.form === 'angular' && reimported.face.formMix === 0.65 && JSON.stringify(reimported.anatomyParts) === JSON.stringify(assembly),
      'portable trial character must keep the selected renderer and art face and three individual body components');
    const partialAssembly = { ...assembled, anatomyParts: { arms: 'strong' } };
    expect(JSON.stringify(PineLooks.prepare(partialAssembly).recipe.anatomyParts) === '{"arms":"strong"}',
      'a partial recipe should keep its implicit standard components');
    for (const invalid of [{ ...partialAssembly, packs: { ...assembled.packs, 'pine-core': '1.19.1' } },
      { ...assembled, anatomyParts: { arms: 'round' } }, { ...assembled, anatomyParts: { ribs: 'balanced' } }]) {
      let rejected = false;
      try { PineLooks.prepare(invalid); } catch { rejected = true; }
      expect(rejected, 'reject unsupported anatomy fields, choices and renderer versions');
    }
    const priorRoll = PineLooks.randomCharacter({ seed: 18, source: assembled, release: '1.19.1', locks: ['body', 'wear'] });
    expect(!Object.hasOwn(PineLooks.prepare(priorRoll).recipe, 'anatomyParts') && !Object.hasOwn(priorRoll, 'bodyFinish'),
      'explicit older random generation must produce a portable old-format recipe');
    target.dataset.state = 'pass';
    target.textContent =
      'Body profiles, interchangeable anatomy, legacy saves, head upgrades, facial morphs, portrait styles, face auditions, independent locks, round-trip saves, studio outfits, style search and portrait detail passed';
  } catch (err) {
    target.dataset.state = 'fail';
    target.textContent = err.stack || err.message;
  }
}

function checkOrdinaryFaces() {
  const $ = id => document.getElementById(id), out = $('qa-result');
  const recipe = () => {
    const link = $('figure-link');
    link.dispatchEvent(new Event('focus'));
    return JSON.parse(new URLSearchParams(new URL(link.href).hash.slice(1)).get('character'));
  };
  const check = (pass, message) => { if (!pass) throw Error(message); };
  try {
    $('tab-face').click();
    const source = recipe();
    check(source.packs[PineLooks.core] === PineLooks.release && !source.face.finish,'expected an archived character');
    const prior = $('mirror').toDataURL();
    $('random-character').click();
    const first = recipe(), ageFinish = base => base === 'adult' ? 'storybook-lips' : 'soft-pixel';
    check(first.face.finish === ageFinish(first.base),'ordinary random button used the wrong face drawing for this age');
    $('undo-random').click();
    check(JSON.stringify(recipe()) === JSON.stringify(source),'random and undo changed the captured recipe');
    $('choose-faces').click();
    document.querySelector('[data-face-candidate]').click();
    check(recipe().face.finish === ageFinish(source.base),'face candidates missed the ordinary drawing for this age');
    $('undo-random').click();
    check(JSON.stringify(recipe()) === JSON.stringify(source),'choosing a new default changed the original recipe');
    const setFinish = value => {
      const field = $('edit-face-finish');
      field.value = value;
      field.dispatchEvent(new Event('change'));
    };
    setFinish('soft-pixel');
    let draft = recipe();
    check(draft.face.finish === 'soft-pixel' && prior !== $('mirror').toDataURL(),'the mirror did not repaint');
    delete draft.face.finish;
    check(JSON.stringify(draft) === JSON.stringify(source),'changing the finish moved other settings');
    setFinish('original');
    check($('mirror').toDataURL() === prior, 'restoring the original drawing changed archived pixels');
    $('random-character').click();
    check(recipe().face.finish === 'original','ordinary reroll lost explicit finish');
    $('undo-random').click();
    setFinish('soft-pixel');
    $('choose-faces').click();
    document.querySelector('[data-face-candidate]').click();
    draft = recipe();
    check(draft.face.finish === 'soft-pixel' && JSON.stringify(draft.parts) === JSON.stringify(source.parts),'candidate changed the finish or clothes');
    $('random-face').click();
    check(recipe().face.finish === 'soft-pixel','face-only reroll lost selected finish');
    $('random-character').click();
    check(recipe().face.finish === 'soft-pixel' && new URL($('figure-link').href).searchParams.get('before') === 'everyday','random page opened a different edition');
    const finish = new URLSearchParams(location.search).get('model') === 'blue-jacket' ? 'storybook-lips' : 'storybook';
    setFinish(finish);
    $('choose-faces').click();
    document.querySelector('[data-face-candidate]').click();
    const drawing = recipe();
    check(drawing.face.finish === finish && new URL($('figure-link').href).searchParams.get('before') === finish,'study lost the selected drawing');
    $('tab-shape').click();
    const cut = $('edit-clothing-cut');
    cut.value = 'patterns';
    cut.dispatchEvent(new Event('change'));
    const fitted = recipe();
    check(fitted.packs[PineLooks.core] === PineLooks.infantNoseRelease && fitted.bodyFinish === 'painted','fitted body not selected');
    for (const key of ['face','colors','parts']) check(JSON.stringify(fitted[key]) === JSON.stringify(drawing[key]), 'fit altered '+key);
    $('tab-face').click();
    check($('edit-face-finish').value === finish,'fitted face picker is wrong');
    $('random-face').click();
    $('random-character').click();
    check(recipe().face.finish === finish,'changing the actor lost the fitted face drawing');
    $('save-look').click();
    check(PineWardrobe.saved.get(recipe().id)?.face.finish === finish,'fitted character did not save');
    out.dataset.state = 'pass'; out.textContent = 'Studio face drawings, candidates, fitted clothes, save and both random buttons passed';
  } catch (error) { out.dataset.state = 'fail'; out.textContent = error.stack; }
}
function checkLibrary() {
  const $ = id => document.getElementById(id), out = $('qa-result');
  const check = (ok, message) => { if (!ok) throw Error(message); };
  const keys = () => [...$('look-shelf').querySelectorAll('[data-key]')].map(b => b.dataset.key);
  function filter(id, value) {
    $(id).value = value;
    $(id).dispatchEvent(new Event(id === 'look-query' ? 'input' : 'change'));
  }
  function recipe() {
    const link = $('figure-link');
    link.dispatchEvent(new Event('focus'));
    return JSON.parse(new URLSearchParams(new URL(link.href).hash.slice(1)).get('character'));
  }
  try {
    check(!$('person-library').hidden, 'gallery link did not open the shelf');
    filter('shelf-source','preset');
    const count = () => Number($('shelf-count').textContent.match(/\d+/)[0]);
    check(count() === PineLooks.templates.length && count() >= 500 && keys().length === 12, 'paginated character count');
    filter('look-query','程序员');
    const programmer=PineLooks.templateById.get('look_programmer');
    check(keys().includes('preset:'+programmer.id) && programmer.label.includes('圆框眼镜'), 'old role still finds the visually titled preset');
    filter('look-query',programmer.label);
    check(keys().join()==='preset:'+programmer.id, 'find an individual by the full visible caption');
    filter('look-query',''); filter('shelf-region','cn'); filter('shelf-season','summer');
    check(keys().join()==='preset:look_museumcrew_educator','regional summer clothing examples match the actual garment');
    filter('shelf-region',''); filter('shelf-season','');
    for (const [term,person] of [['中山装','museumcrew_keeper'],['振袖','dyeworks_stitcher'],['rodeo','broadcast_host'],['Dirndl','dyeworks_forager']]) {
      filter('look-query',term);
      check(keys().includes('preset:look_'+person),'missing regional clothing search result: '+term);
    }
    filter('look-query','');
    const all = new Set();
    while (true) {
      for (const key of keys()) {
        check(!all.has(key) && PineLooks.templateById.has(key.slice(7)), 'missing or duplicated entry between pages');
        all.add(key);
      }
      const next = [...$('shelf-pages').querySelectorAll('button')].find(b=>b.textContent==='下一页');
      if (next.disabled) break;
      next.click();
    }
    check(all.size===PineLooks.templates.length, 'last page loses entries');
    document.querySelector('[data-shelf-view=face]').click();
    check(keys().length===(all.size%12 || 12) && $('look-shelf').dataset.framing==='face', 'framing must keep the page');
    filter('shelf-source','new'); check(count()===PineLooks.library.almanacIds.size, 'current release filter');
    $('shelf-next').click();
    const pageKeys=keys().join(), range=$('shelf-range').textContent;
    const related=$('look-shelf').querySelector('[data-related]'), group=related.dataset.related;
    related.click();
    check(keys().length>=3 && keys().every(key=>PineLooks.templateById.get(key.slice(7)).identity.series===group) &&
      $('shelf-source').value==='' && $('shelf-series').value===group,'show complete series from a restricted browse');
    $('shelf-family-back').click();
    check(keys().join()===pageKeys && $('shelf-range').textContent===range && $('shelf-source').value==='new' &&
      $('look-shelf').dataset.framing==='face','return from a series must restore the original result page and view');
    filter('shelf-series','firstyear'); filter('shelf-hair','infant');
    check(count()===8 && keys().every(key=>PineLooks.library.almanacIds.has(key.slice(7))), 'nursery hair in the new collection');
    filter('shelf-series',''); filter('shelf-hair',''); filter('shelf-source','earlier');
    document.querySelector('[data-realm=fantasy]').click(); filter('shelf-age','child');
    filter('shelf-setting','wild'); filter('shelf-gear','bags');
    check(keys().sort().join() === 'preset:look_firefly_child,preset:look_moon_post_child','four dimensions must combine');
    filter('shelf-field','nature'); filter('shelf-garment','cloaks'); filter('shelf-profile','unspecified');
    check(keys().join()==='preset:look_firefly_child','field, costume and body filters did not intersect');
    check($('shelf-applied').children.length===8, 'active filters are not all visible');
    filter('shelf-profile','male');
    check(!keys().length && !$('shelf-empty').hidden, 'empty filter recovery');
    $('empty-clear').click(); filter('shelf-age','baby'); filter('shelf-source','preset');
    check(count()===PineLooks.templates.filter(d=>d.base==='baby').length, 'infant results');
    $('clear-looks').click(); filter('shelf-size','24'); check(keys().length===24,'page size');
    filter('shelf-order','name');
    const labels=[...$('look-shelf').querySelectorAll('strong')].map(e=>e.textContent);
    check(labels.join() === [...labels].sort(new Intl.Collator('zh-Hans-CN',{numeric:true}).compare).join(),'name sort');
    document.querySelector('[data-shelf-view=body]').click();
    check($('look-shelf').dataset.framing==='body','full body view');
    filter('look-query','褶边厨师帽');
    check(keys().join() === 'preset:look_chef', 'search by the display name of an equipped item');
    filter('look-query','炼金');
    check(keys().length===3 && keys().includes('preset:look_alchemist') && keys().includes('preset:look_herb_alchemist'), 'search by role');
    document.querySelector('[data-shelf-view=face]').click();
    check($('look-shelf').dataset.framing === 'face', 'portrait view');
    $('look-shelf').querySelector('[data-key="preset:look_alchemist"]').click();
    const selected = recipe(), original = PineLooks.templateById.get('look_alchemist');
    check(!$('person-edit').hidden && selected.id !== original.id, 'selected character needs its own editable copy');
    for (const key of ['parts','colors','shape','face'])
      check(Object.keys(original[key]).every(k => selected[key][k] === original[key][k]), 'gallery selection lost '+key);
    $('look-field').value='craft'; $('look-field').dispatchEvent(new Event('change'));
    $('look-series').value='pottery'; $('look-series').dispatchEvent(new Event('change'));
    const coast = $('look-settings').querySelector('input[value=coast]'); coast.click();
    check(recipe().identity.field==='craft' && recipe().identity.series==='pottery' && recipe().identity.settings.includes('coast'),'editable classification');
    $('look-name').value = '铜框眼镜习作';
    $('look-name').dispatchEvent(new Event('input'));
    $('save-look').click();
    check(PineWardrobe.saved.get(selected.id)?.label === '铜框眼镜习作' && original.label !== '铜框眼镜习作',
      'editing or saving a copy overwrote the preset');
    $('tab-wear').click();
    document.querySelector('[data-outfit=moth_keeper]').click();
    const dressed=recipe();
    check(dressed.parts.top==='moth-cape' && dressed.parts.implement==='lantern' && dressed.embeddedPacks[0].id==='pine-outfitter',
      'wearing an entire gallery costume lost the headwear or handheld prop');
    check(JSON.stringify(dressed.face)===JSON.stringify(selected.face) && dressed.parts.hair===selected.parts.hair,'outfit changed the person');
    $('save-look').click(); $('tool-person-library').click(); $('clear-looks').click();
    filter('shelf-source','saved'); filter('shelf-series','pottery'); filter('shelf-garment','cloaks'); filter('shelf-gear','tools');
    check(keys().join()==='saved:'+selected.id,'newly worn garment or edited identity was not searchable');
    out.dataset.state = 'pass';
    $('look-shelf').querySelector('[data-key]').click(); $('tab-wear').click();
    const wearer=recipe();
    $('borrow-outfit').click(); $('clear-looks').click(); filter('shelf-source','new'); filter('shelf-order','name');
    const sorted=PineLooks.templates.filter(d=>PineLooks.library.almanacIds.has(d.id))
      .sort((a,b)=>new Intl.Collator('zh-Hans-CN',{numeric:true}).compare(a.label,b.label));
    check(!$('shelf-borrow').hidden && !keys().includes('preset:'+sorted.at(-1).id),'outfit picking mode and first page');
    const draw=Math.random;
    try { Math.random=()=>.999999; $('shelf-draw').click(); } finally { Math.random=draw; }
    const borrowed=recipe(), donor=sorted.at(-1);
    check(!$('person-edit').hidden && $('shelf-borrow').hidden && borrowed.id===wearer.id &&
      JSON.stringify(borrowed.face)===JSON.stringify(wearer.face) && borrowed.parts.hair===wearer.parts.hair &&
      borrowed.colors.skin===wearer.colors.skin, 'borrowing a costume must preserve the active person');
    for(const [slot,value] of Object.entries(PineLooks.outfitFrom(donor).parts))
      check(borrowed.parts[slot]===value,'off-page random outfit: '+slot);
    $('borrow-outfit').click(); $('shelf-borrow-back').click();
    check(JSON.stringify(recipe())===JSON.stringify(borrowed),'cancelled borrowing changed the person');
    filter('rack-region','jp');filter('rack-season','summer');
    check($('rack-count').textContent.startsWith('2 套') && !$('rack-roll').disabled,'filtered seasonal outfits');
    $('rack-look-jp-yukata').click();
    const yukata=recipe();
    check(yukata.parts.top==='cotton-yukata' && yukata.parts.bottom==='yukata-hem' &&
      yukata.label==='铜框眼镜习作' && yukata.parts.hair===borrowed.parts.hair,'try on a seasonal outfit and retain personal name and hair');
    $('rack-roll').click(); check(recipe().parts.top==='festival-happi','roll a different outfit inside current filters');
    filter('rack-family','suit');
    check($('rack-roll').disabled && !$('rack-clear').hidden,'recover from empty seasonal intersection');
    $('rack-clear').click();
    check($('rack-count').textContent.startsWith(Object.keys(PineLooks.seasonalWardrobe.outfits).length+' 套') && !$('rack-next').disabled,'reset seasonal wardrobe');
    filter('rack-region','us'); filter('rack-family','traditional');
    check($('rack-look-us-rodeo') && $('rack-look-us-western'),'western heritage shirts missing from the regional rack');
    filter('rack-region','jp'); $('rack-look-jp-furisode').click();
    check(recipe().parts.bottom==='furisode-hem' && recipe().parts.top==='furisode-robe','formal kimono cut');
    $('tab-colors').click();
    const thread=$('color-embroidery');
    check(thread && thread.value===recipe().colors.embroidery,'missing embroidery colour');
    thread.value='#678945'; thread.dispatchEvent(new Event('input'));
    check(recipe().colors.embroidery==='#678945','custom embroidery dye is not portable');
    out.textContent = '500-person gallery, scoped random selection, editable filters, outfit borrowing and pagination passed';
  } catch (error) { out.dataset.state = 'fail'; out.textContent = error.stack; }
}
function checkInfantHair() {
  const $=id=>document.getElementById(id), out=$('qa-result');
  const check=(ok,reason)=>{ if(!ok) throw Error(reason); };
  const recipe=()=>{
    $('figure-link').dispatchEvent(new Event('focus'));
    return JSON.parse(new URLSearchParams(new URL($('figure-link').href).hash.slice(1)).get('character'));
  };
  try {
    const ids=Object.keys(PineLooks.nurseryHair), cards=()=>[...document.querySelectorAll('[data-hair-style]')];
    check(cards().length===ids.length && cards().every(b=>ids.includes(b.dataset.hairStyle)),'infant tab opens on six exclusive swatches');
    document.querySelector('[data-hair-style=baby-puffs]').click();
    const original=recipe(), bare=$('mirror').toDataURL();
    document.querySelector('[data-hair-hat=on]').click();
    check($('mirror').toDataURL()!==bare && recipe().parts.hat===original.parts.hat,'hat comparison did not preserve the costume');
    document.querySelector('[data-hair-hat=off]').click();
    document.querySelector('[data-hair-angle="180"]').click();
    document.querySelector('[data-hair-style=baby-whorl]').click();
    const dye=document.querySelector('[data-hair-color="#82513b"]');
    dye.click(); $('save-look').click();
    const d=recipe();
    check(d.parts.hair==='baby-whorl' && d.colors.hair==='#82513b' && d.parts.hat===original.parts.hat &&
      PineWardrobe.saved.get(d.id)?.parts.hair===d.parts.hair,'saving the dyed scalp or preserving hat');
    const search=$('style-query');
    search.value='额前逗号卷';
    search.dispatchEvent(new Event('input'));
    check(document.querySelector('[data-match="hair/baby-comma"]'),'baby hair is searchable');
    document.querySelector('[data-body-profile=child]').click();
    check(!document.querySelector('[data-hair-style^="baby-"], [data-match="hair/baby-comma"]') &&
      !ids.includes(recipe().parts.hair),'changing age left an infant-only hairstyle or search result');
    check($('bearing').value==='140','a child should open on the shared hairstyle angle');
    $('tab-wear').click();
    check(![...$('edit-hair').options].some(o=>ids.includes(o.value)),'wear picker offers infant-only styles to children');
    document.querySelector('[data-body-profile=baby]').click();
    $('tab-hair').click();
    check($('bearing').value==='180' && cards().length===ids.length,'return to the infant hair group and its last angle');
    out.dataset.state='pass';out.textContent='Nursery-only swatches, cap preview, colour, rotation, save and changing age passed';
  } catch(e) {out.dataset.state='fail';out.textContent=e.stack;}
}
function checkRoundedBaby() {
  const $ = id => document.getElementById(id), out = $('qa-result');
  const check = (pass, message) => { if (!pass) throw Error(message); };
  const recipe = () => {
    const link = $('figure-link');
    link.dispatchEvent(new Event('focus'));
    return JSON.parse(new URLSearchParams(new URL(link.href).hash.slice(1)).get('character'));
  };
  const choose = value => {
    const pick = $('edit-infant-chin');
    pick.value = value;
    pick.dispatchEvent(new Event('change'));
  };
  try {
    const initial = recipe();
    check(initial.id === PineLooks.randomCharacter({seed:3603}).id && initial.infantChin === 'round' &&
      $('edit-infant-chin').value === 'round' && $('bearing').value === '270','wrong baby or initial side view');
    const pixels = $('mirror').toDataURL();
    choose('pad');
    const full = recipe();
    check(full.infantChin === 'full' && $('mirror').toDataURL() !== pixels,'the side silhouette did not change');
    check(JSON.stringify({...full,infantChin:'round'}) === JSON.stringify(initial),'choosing the chin changed another setting');
    choose('round');
    check($('mirror').toDataURL() === pixels,'the rounded silhouette did not return');
    $('choose-faces').click();
    document.querySelector('[data-face-candidate]').click();
    check(recipe().infantChin === 'round','face candidate lost the infant chin');
    $('random-face').click();
    $('save-look').click();
    const saved = PineWardrobe.saved.get(recipe().id);
    check(saved?.infantChin === 'round' && PineLooks.prepare(JSON.parse(JSON.stringify(saved))).recipe.infantChin === 'round',
      'the saved editable baby lost the new chin');
    out.dataset.state = 'pass'; out.textContent = 'Real random infant, both chin silhouettes, face candidates, reroll and save passed';
  } catch (error) { out.dataset.state = 'fail'; out.textContent = error.stack; }
}
function checkInfantProfilePair() {
  const $=id=>document.getElementById(id), result=$('qa-result');
  try {
    const pair=new URLSearchParams(new URL($('figure-link').href).hash.slice(1));
    const source=JSON.parse(pair.get('partner')), trial=JSON.parse(pair.get('character'));
    if (new URL($('figure-link').href).searchParams.get('before')!=='recipes' || $('compare').value!=='review:partner' ||
        $('bearing').value!=='270' || $('tab-face').getAttribute('aria-selected')!=='true' ||
        trial.face.nose!=='button' || source.face.nose!=='rounded' || trial.id===source.id ||
        JSON.stringify(trial.colors)!==JSON.stringify(source.colors) || JSON.stringify(trial.parts)!==JSON.stringify(source.parts))
      throw Error('editable baby profile and its original must open side by side at 90 degrees');
    const slider=$('edit-chinProjection');slider.value=.15;slider.dispatchEvent(new Event('input'));
    const edited=new URLSearchParams(new URL($('figure-link').href).hash.slice(1));
    if (JSON.parse(edited.get('character')).shape.chinProjection!==.15 || JSON.stringify(source)!==edited.get('partner'))
      throw Error('editing the chin should only affect its own recipe');
    const choose = (id,value) => {
      const select = $('edit-'+id);
      select.value=value;
      select.dispatchEvent(new Event('change'));
    };
    const documentPair = () => new URLSearchParams(new URL($('figure-link').href).hash.slice(1));
    choose('infant-chin','soft');
    const softer=JSON.parse(documentPair().get('character'));
    if (softer.packs['pine-core']!==PineLooks.infantChinRelease || JSON.stringify(softer.shape)!==JSON.stringify(JSON.parse(edited.get('character')).shape))
      throw Error('the infant surface changed the authored face controls');
    choose('infant-chin','pad');
    if (JSON.parse(documentPair().get('character')).packs['pine-core']!==PineLooks.chinPadRelease ||
        documentPair().get('partner')!==edited.get('partner'))
      throw Error('the fuller chin needs its own editable recipe and original reference');
    $('tab-wear').click();
    for (const cut of ['original','cut','patterns']) {
      choose('clothing-cut',cut);
      if (JSON.parse(documentPair().get('character')).packs['pine-core']!==PineLooks.chinPadRelease)
        throw Error('changing the clothing cut lost the selected chin');
    }
    $('tab-face').click();choose('infant-chin','prior');
    if (documentPair().toString()!==edited.toString()) throw Error('the chosen chin, clothes and comparison must round-trip');
    choose('infant-nose','nursery');
    $('try-ink').click();
    const surface = JSON.parse(documentPair().get('character'));
    if (surface.faceSurface!=='linked' || $('edit-face-surface').value!=='linked') throw Error('linked face structure missing from the trial');
    if (surface.spriteMouth!=='accent' || $('edit-sprite-mouth').value!=='accent') throw Error('small-profile brush missing');
    choose('sprite-mouth','');
    if (JSON.parse(documentPair().get('character')).spriteMouth || $('edit-face-surface').value!=='linked')
      throw Error('disabling the small brush changed the face structure');
    choose('sprite-mouth','accent');
    if (JSON.stringify(surface)!==documentPair().get('character')) throw Error('small mouth did not round-trip');
    choose('face-surface','contour');choose('sprite-mouth','');
    if (JSON.parse(documentPair().get('character')).faceSurface!=='contour') throw Error('small brush changed the chosen chin');
    choose('sprite-mouth','accent');choose('face-surface','linked');
    if (JSON.stringify(surface)!==documentPair().get('character')) throw Error('returning from the chin trial lost the prior face');
    choose('face-surface','original');
    if (documentPair().get('character')!==JSON.stringify(PineLooks.withoutFaceSurface(surface))) throw Error('changing the surface edited the recipe');
    choose('face-surface','linked');
    choose('infant-chin','pad');choose('portrait-ink','line');
    $('tab-wear').click();choose('clothing-cut','cut');choose('clothing-cut','patterns');
    $('tab-face').click();choose('infant-nose','prior');
    const ink = JSON.parse(documentPair().get('character'));
    if (ink.portraitInk!=='line' || ink.faceSurface!=='linked' || ink.infantNose || $('edit-infant-chin').value!=='pad')
      throw Error('nose, chin, clothes and brush must be independently editable');
    choose('infant-nose','nursery');$('random-face').click();
    const rerolled = JSON.parse(documentPair().get('character'));
    if (!PineLooks.portraitInks[rerolled.portraitInk] || rerolled.infantNose!=='nursery' ||
        JSON.stringify(ink.colors)!==JSON.stringify(rerolled.colors) || JSON.stringify(ink.parts)!==JSON.stringify(rerolled.parts))
      throw Error('rerolling just the face lost the selected nose, ink or costume');
    result.dataset.state='pass';result.textContent='Editable infant chin and profile, independent clothes, former recipe and seated comparison passed';
  } catch (err) {
    result.dataset.state='fail';result.textContent=err.stack || err.message;
  }
}

function checkRatioEditor() {
  const byId = id => document.getElementById(id), target=byId('qa-result');
  const draft = () => JSON.parse(new URLSearchParams(new URL(byId('figure-link').href).hash.slice(1)).get('character'));
  const expect = (ok, message) => { if (!ok) throw Error(message); };
  function set(fieldName, value) {
    const field=byId('edit-'+fieldName);
    field.value=String(value);
    field.dispatchEvent(new Event(field.type==='range' ? 'input' : 'change'));
  }
  try {
    const original=draft();
    set('feature-paint','ratios');
    expect(draft().packs['pine-core']===PineLooks.figureRatioRelease && new URL(byId('figure-link').href).searchParams.get('before')==='ratios',
      'the proportion editor lost its comparison');
    set('crownHeight',.83); set('noseLipSpacing',1.56);
    byId('tab-shape').click();
    set('headScale',1.10); set('trunkLength',1.19);
    const edited=PineLooks.prepare(draft()).recipe;
    expect(edited.shape.headScale===1.10 && edited.shape.crownHeight===.83 && edited.shape.trunkLength===1.19 && edited.shape.noseLipSpacing===1.56,
      'proportion edits must be independent');
    byId('tab-face').click(); set('feature-paint','painted');
    expect(JSON.stringify(draft())===JSON.stringify(original), 'returning to the original proportions changed another part of the recipe');
    byId('edit-undo').click();
    expect(JSON.stringify(draft().shape)===JSON.stringify(edited.shape) && draft().packs['pine-core']===PineLooks.figureRatioRelease,
      'undo failed to restore the edited proportions');
    target.dataset.state='pass';
    set('feature-paint','acting'); set('rest-expression','curious');
    const acting=draft();
    expect(acting.face.restExpression==='curious' && JSON.stringify(acting.shape)===JSON.stringify(edited.shape) &&
      new URL(byId('figure-link').href).searchParams.get('before')==='acting','the editable attitude lost the figure or handoff');
    set('rest-expression','');
    expect(!('restExpression' in draft().face),'automatic expression was not restored');
    set('feature-paint','ratios');
    expect(JSON.stringify(draft())===JSON.stringify(edited) && !byId('edit-rest-expression'),'trial downgrade changed proportions or old controls');
    byId('tab-wear').click();
    set('clothing-cut','patterns');set('bottom','trousers');set('fit-top','bloused');set('fit-legs','wide');
    expect(draft().garmentFit.top==='bloused' && draft().garmentFit.legs==='wide' &&
      new URL(byId('figure-link').href).searchParams.get('before')==='garments','editable garment fit and study handoff');
    set('bottom','skirt');
    expect(!byId('edit-fit-legs') && draft().garmentFit.legs==='wide','skirt must preserve the stored trouser setting');
    expect(byId('edit-skirt-ease').value==='fixed','old skirt should open with a fixed hem');
    set('skirt-ease','flexible');
    expect(draft().skirtEase==='flexible','skirt ease missing from the portable recipe');
    set('bottom','trousers');
    expect(!byId('edit-skirt-ease') && !draft().skirtEase && byId('edit-fit-legs').value==='wide',
      'changing the bottom should restore trouser fit and release the previous skirt setting');
    byId('tab-face').click();set('rest-expression','warm');
    expect(draft().garmentFit.legs==='wide' && draft().packs['pine-core']===PineLooks.garmentRelease,'editing eyes must preserve tailoring');
    byId('tab-shape').click();set('fit-top','');set('fit-legs','');
    expect(!draft().garmentFit,'automatic cut should omit the override');
    set('clothing-cut','cut');
    expect(!byId('edit-fit-top') && draft().packs['pine-core']===PineLooks.expressionRelease && draft().face.restExpression==='warm','restore previous cut with authored expression');
    target.textContent='Independent proportions, expression, garments, shirt and trouser fits, undo and studio handoff passed';
  } catch (err) {
    target.dataset.state='fail'; target.textContent=err.stack || err.message;
  }
}

function checkWorldEditor() {
  const get = (id) => document.getElementById(id),
    check = (ok, msg) => {
      if (!ok) throw Error(msg);
    };
  const set = (id, value, event = 'change') => {
    get(id).value = value;
    get(id).dispatchEvent(new Event(event, { bubbles: true }));
  };
  const status = get('qa-result');
  try {
    check(get('world-grid').children.length === PineWorld.items.size, 'world inventory');
    const firstScene = get('world-scene').value;
    check(get('world-detail').value === 'figure', 'legacy and new scenes open in full detail');
    set('world-angle', '72', 'input');
    const fine = get('world-canvas').toDataURL();
    get('world-play').click();
    set('world-detail', 'standard');
    check(get('world-angle').value === '72' && get('world-play').getAttribute('aria-pressed') === 'true',
      'changing detail preserves the orbit and playback');
    get('world-play').click();
    check(get('world-canvas').toDataURL() !== fine, 'the scene quality control changes the displayed pixels');
    set('world-detail', 'figure');
    check(get('world-canvas').toDataURL() === fine, 'the same figure detail and camera reproduce the same frame');
    set('world-detail', 'standard');
    set('world-query', '飞机', 'input');
    check(get('world-grid').children.length === 1, 'aircraft lookup');
    const before = get('placed').length;
    get('place-item').click();
    check(get('placed').length === before + 1, 'scene placement');
    check(!get('placements').hidden && get('object-library').hidden, 'new objects open the inspector');
    get('edit-undo').click();
    check(get('placed').length === before, 'undo object insertion');
    get('edit-redo').click();
    check(get('placed').length === before + 1 && get('place-heading').value === '0', 'restore object and selection');
    set('place-x', '67');
    set('place-heading', '90');
    get('world-studio').addEventListener('click', (e) => e.preventDefault(), { once: true });
    get('world-studio').click();
    const saved = JSON.parse(sessionStorage.getItem('pineCreek.threePreview.v1')),
      plan = PineWardrobe.readScoreFile(saved);
    check(plan.score.detail === 'standard', 'quality survives the real scene handoff and import');
    check(
      plan.score.scene.some(
        (p) => p.kind === 'aircraft' && p.x === 67 && Math.abs(p.heading - Math.PI / 2) < 1e-6
      ),
      'world transfer'
    );
    get('remove-place').click();
    check(get('placed').length === before, 'remove placement');
    set('world-scene', 'study');
    check(get('world-clip').value === 'desk-code', 'office station');
    check(get('world-detail').value === 'figure', 'a different scene has its own quality');
    set('world-scene', firstScene);
    check(get('world-detail').value === 'standard', 'restore scene-specific quality');
    check(get('scene-tree').hidden && get('view-space-field').hidden, 'flat controls for ordinary props');
    set('world-scene', 'pavilion');
    const tree = get('scene-tree');
    const node = i => tree.querySelector('[data-node="' + i + '"]');
    check(!tree.hidden && node(0).closest('li').querySelector('ul [data-node="cast"]'), 'actor listed inside the pavilion');
    const exterior = get('world-canvas').toDataURL();
    tree.querySelector('[data-enter="0"]').click();
    check(get('world-space').value === '0' && get('world-canvas').toDataURL() !== exterior, 'real interior cutaway');
    set('world-space', '');
    check(get('world-canvas').toDataURL() === exterior, 'restoring exterior reproduces the same pixels');
    set('world-space', '0');
    set('world-query', '台灯', 'input');
    get('place-item').click();
    check(get('place-parent').value === '0' && get('place-z').valueAsNumber === 0, 'new lamp lands on the indoor floor');
    const lampIndex = Number(get('placed').value);
    set('place-z', 21.1);
    node('cast').click();
    set('place-y', 7);
    function scenePlan() {
      get('world-studio').addEventListener('click', e => e.preventDefault(), { once: true });
      get('world-studio').click();
      return PineWardrobe.readScoreFile(JSON.parse(sessionStorage.getItem('pineCreek.threePreview.v1')));
    }
    node(0).click();
    set('place-x', 32);
    set('place-heading', 90);
    const nested = scenePlan(), lamp = nested.worldScene[lampIndex];
    check(nested.score.scene[lampIndex].parent === 0 && Math.abs(lamp.z - 26.2) < 1e-7, 'lamp height round-trips');
    check(Math.abs(nested.castFrame.x - 25) < 1e-7 && nested.score.actorPlacement.parent === 0, 'the room rotates the cast');
    get('remove-place').click();
    const freed = scenePlan(), removed = freed.worldScene[lampIndex - 1];
    check(get('scene-tree').hidden && !get('world-space').value && !freed.worldScene.some(p => p.kind === 'pavilion'),
      'removing the active room exits the cutaway');
    check(Math.hypot(removed.x-lamp.x, removed.y-lamp.y, removed.z-lamp.z) < 1e-7 &&
      freed.castFrame.x === nested.castFrame.x, 'promoted furniture and cast keep their world placement');
    set('world-query', '凉亭', 'input');
    get('place-item').click();
    const roomIndex = Number(get('placed').value);
    set('place-x', 32);
    set('place-y', 0);
    set('place-heading', 90);
    get('gather-interior').click();
    const gathered = scenePlan();
    check(gathered.score.actorPlacement.parent === roomIndex && gathered.score.scene[0].parent === roomIndex,
      'collecting an existing arrangement adopts the desk and cast together');
    const blossom = gathered.score.scene.findIndex(p => p.kind === 'blossom');
    check(gathered.score.scene[blossom].parent === undefined, 'the tree beyond the footprint stays outside');
    node(blossom).click();
    set('place-parent', String(roomIndex));
    check(get('place-x').valueAsNumber === 0 && get('place-z').valueAsNumber === 0, 'move a distant item onto the indoor floor');
    set('place-parent', '');
    check(Math.abs(get('place-z').valueAsNumber - 5.1) < 0.001, 'moving back out keeps its height');
    set('world-scene', 'study');
    set('world-query', '摊位', 'input');
    get('place-item').click();
    set('place-x', -17);
    set('place-y', 18);
    const covered = scenePlan();
    check(covered.score.actorPlacement === undefined && covered.score.scene[0].z === 0,
      'adding a stall preserves the original authoring coordinates and hierarchy');
    check(Math.abs(covered.sample(0)[0].z - 4.7) < 1e-7 &&
      Math.abs(covered.worldScene.find(p => p.kind === 'lamp').z - 25.8) < 1e-7,
      'the actor, desk and lamp move onto the actual floor before grouping anything');
    set('world-clip', 'idle');
    get('select-cast').click();
    set('place-x', 70);
    check(scenePlan().sample(0)[0].z === 0, 'walkable support ends outside the stall footprint');
    set('place-x', -17);
    set('world-detail', 'standard');
    check(Math.abs(scenePlan().sample(0)[0].z - 4.7) < 1e-7, 'returning to the stall uses its floor at standard quality too');
    set('world-scene', 'stairs');
    check(get('world-clip').value === 'ascend-stairs' && !get('route-playback').hidden, 'stair scene with timeline');
    const downstairs = get('world-canvas').toDataURL();
    get('upper-landing').click();
    check(get('world-scrub').valueAsNumber === 0.5 && get('world-canvas').toDataURL() !== downstairs, 'pause with both feet upstairs');
    set('world-scrub', 0, 'input');
    check(get('world-canvas').toDataURL() === downstairs, 'scrub back to the approach with the same camera');
    set('place-heading', 90);
    set('place-z', 8);
    const climb = scenePlan(), top = climb.sample(climb.duration / 2)[0];
    check(Math.abs(top.z - 78) < 1e-7 && top.y > 45 && climb.scenery(0).filter(p => p.kind === 'stairs').length === 1,
      'a rotated and elevated stair route stays bound through the studio handoff');
    const pot = climb.worldScene.find(p => p.kind === 'plant');
    check(Math.abs(pot.x + 12) < 1e-6 && Math.abs(pot.y - 59) < 1e-6 && Math.abs(pot.z - 78) < 1e-6,
      'the editable potted plant follows the upper landing');
    status.dataset.state = 'pass';
    status.textContent =
      'World filters, scene placement, interior views, hierarchy edits, rotation, quality, playback, and score handoff passed';
  } catch (e) {
    status.dataset.state = 'fail';
    status.textContent = e.stack;
  }
}
function checkStudioMotions() {
  const byId = (id) => document.getElementById(id);
  const target = byId('qa-result');
  const expect = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  const set = (id, value, event = 'change') => {
    byId(id).value = value;
    byId(id).dispatchEvent(new Event(event, { bubbles: true }));
  };
  try {
    expect(byId('preset').options.length === Object.keys(PineMotion.presets).length + 1, 'preset list');
    expect(
      byId('motion-group').options.length ===
        new Set([...PineMotion.actions.values()].map((clip) => clip.group)).size + 1,
      'activity categories'
    );
    byId('motion-browser').open = true;
    set('who',''); expect(byId('which').options.length===500,'browse the whole catalog without choosing an actor');
    set('which','baby-find-feet'); expect(byId('motion-supplies').textContent.includes('演员'),'provide an age-appropriate main actor automatically');
    set('motion-domain','movement'); set('motion-duration','short'); set('motion-people','solo'); set('motion-ending','transition');
    const choices=Array.from(byId('which').options,o=>o.value);
    expect(choices.includes('threshold') && choices.every(id=>{
      const c=PineMotion.actions.get(id);
      return c.seconds>=2 && c.seconds<3 && c.roles.length===1 && c.transition && c.domain==='movement';
    }),'combined motion filters');
    byId('clear-motions').click();
    set('who','baby'); set('motion-domain','together'); set('motion-people','pair'); set('motion-query','循声','input');
    expect(byId('which').value==='family-hear-bell' && byId('with').value==='mother' &&
      byId('motion-supplies').textContent.includes('宝宝摇铃'),'auto cast and library rattle for a baby in the second role');
    byId('try').click();
    byId('preview-three').addEventListener('click',e=>e.preventDefault(),{once:true}); byId('preview-three').click();
    const family=JSON.parse(sessionStorage.getItem('pineCreek.threePreview.v1'));
    expect(family.steps[0].actors.join(',')==='mother,baby','role order for portable preview');
    byId('edit-world').addEventListener('click',e=>e.preventDefault(),{once:true}); byId('edit-world').click();
    const incoming=JSON.parse(sessionStorage.getItem('pineCreek.threePreview.v1'));
    expect(new URL(byId('edit-world').href).searchParams.get('book').startsWith('clip.') &&
      incoming.steps.length===1 && incoming.steps[0].action==='family-hear-bell','single clip travels to the world');
    const make=URL.createObjectURL, click=HTMLAnchorElement.prototype.click;
    let clipFile,clipBlob;
    try {
      URL.createObjectURL=b=>{clipBlob=b;return make.call(URL,b);};
      HTMLAnchorElement.prototype.click=function(){clipFile=this.download;};
      byId('export-clip').click();
    } finally {URL.createObjectURL=make;HTMLAnchorElement.prototype.click=click;}
    expect(clipFile==='pine-motion-family-hear-bell.json' && clipBlob?.type==='application/json','export individual clip');
    byId('return-score').click(); byId('clear-motions').click();
    set('who', 'child');
    set('motion-group', '家务');
    set('motion-query', '打扫', 'input');
    const card = byId('motion-cards').querySelector('[data-clip="sweep"]');
    expect(card && byId('which').options.length === 1, 'action search and pose cards');
    card.click();
    expect(
      byId('take-title').textContent === '扫地' && document.activeElement.dataset.clip === 'sweep',
      'pose card playback and keyboard focus'
    );
    byId('return-score').click();
    set('seconds', '1.8', 'input');
    set('times', '2', 'input');
    byId('append').click();
    expect(byId('cue-list').children.length === 1 && byId('scrub').max === '3.6', 'repeated cue');
    expect(!byId('motion-score').hidden && byId('tool-motion-score').getAttribute('aria-selected') === 'true', 'append selects timeline');
    byId('edit-undo').click();
    expect(byId('cue-list').children.length === 0, 'undo timeline append');
    byId('edit-redo').click();
    expect(byId('cue-list').children.length === 1, 'redo timeline append');
    byId('loop').click();
    expect(!byId('loop').checked, 'score loop');
    set('motion-query', 'xyz-无匹配', 'input');
    expect(
      byId('try').disabled && byId('append').disabled && byId('replace').disabled,
      'empty search actions'
    );
    set('motion-group', '');
    set('motion-query', '摄影', 'input');
    byId('try').click();
    expect(!byId('loop').checked, 'single clip initial loop');
    byId('loop').click();
    byId('preview-three').addEventListener('click', (event) => event.preventDefault(), { once: true });
    byId('preview-three').click();
    const handoff = JSON.parse(sessionStorage.getItem('pineCreek.threePreview.v1'));
    expect(handoff.loop && handoff.steps[0].action === 'photograph', 'pass the active preview to Three.js');
    byId('return-score').click();
    expect(!byId('loop').checked && byId('take-title').textContent === '扫地', 'preserve board and its loop');
    set('preset', 'nursery');
    expect(byId('who').value === 'mother' && byId('with').value === 'baby', 'nursery role order');
    expect(byId('orbit').value === '21', 'show both readers and their book');
    set('orbit', '50', 'input');
    byId('cue-list').querySelector('[data-index="1"]').click();
    expect(byId('orbit').value === '50', 'preserve a manually chosen viewing angle');
    set('who', 'baby');
    set('motion-query', '踢腿', 'input');
    expect(byId('which').value === 'baby-kicks', 'infant actions');
    set('motion-query', '', 'input');
    const first = byId('motion-page').value;
    (byId('motion-next').disabled ? byId('motion-prev') : byId('motion-next')).click();
    expect(
      byId('motion-page').value !== first && byId('motion-cards').children.length > 0,
      'pose card pagination'
    );
    target.dataset.state = 'pass';
    target.textContent =
      'Action search, pose cards, repeated cues, independent single-clip looping, Three.js handoff and age-specific casting passed';
  } catch (error) {
    target.dataset.state = 'fail';
    target.textContent = error.message;
  }
}

function checkCharacterTransfer() {
  const target = document.getElementById('qa-result');
  try {
    const book = document.getElementById('preset').value;
    const score = JSON.parse(localStorage.getItem('pineCreek.motionScores.v1')).books[book];
    const plan = PineWardrobe.readScoreFile(score);
    if (book !== 'person.look_guide' || plan.score.steps.length !== 1 || plan.score.steps[0].action !== 'drink' ||
        plan.score.steps[0].actors[0] !== 'look_guide' || document.getElementById('return-score').hidden !== true ||
        !document.getElementById('cue-list').textContent.includes(document.getElementById('take-actors').textContent))
      throw Error('The actor and action in the monitor must be in the editable timeline');
    target.dataset.state = 'pass';
    target.textContent = 'A character handoff opens its own editable timeline with the displayed actor and action';
  } catch (error) {
    target.dataset.state = 'fail';
    target.textContent = error.message;
  }
}

const root = resolve(__dirname, '..'),
  dir = mkdtempSync(join(tmpdir(), 'pine-atelier-check-'));
try {
  const base = pathToFileURL(root + sep).href;
  const browser =
    process.env.CHROME_BIN ||
    (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : 'google-chrome');
  for (const [name, check, query] of [
    ['atelier', checkLibrary, '?tool=person-library'],
    ['atelier', checkEditor, '?bearing=90'],
    ['atelier', checkOrdinaryFaces, '?model=yellow-hardhat&tab=face&bearing=0'],
    ['atelier', checkOrdinaryFaces, '?model=blue-jacket&tab=face&bearing=270'],
    ['atelier', checkOrdinaryFaces, '?tab=face&bearing=0#' + new URLSearchParams({character:JSON.stringify({
      ...JSON.parse(readFileSync(join(root,'packs/female-adult.json'),'utf8')),packs:{'pine-core':'1.18.0'}
    })})],
    ['atelier', checkInfantHair, '?preset=look_chestnut&tab=hair'],
    ['atelier', checkRoundedBaby, '?figure=random&age=baby&seed=3603&tab=face&bearing=270&action=idle&phase=17'],
    ['atelier', checkRatioEditor, '?figure=features&model=baby&tab=face'],
    ['atelier', checkInfantProfilePair, '?model=baby02-profile&compare=baby02-source&tab=face&bearing=270&action=idle&phase=17'],
    ['studio', checkStudioMotions, '?demo=custom'],
    ['studio', checkCharacterTransfer, '?board=character&person=look_guide#score=' + encodeURIComponent(JSON.stringify({
      version: 1, steps: [{ action: 'drink', actors: ['look_guide'] }]
    }))],
    ['index', checkWorldEditor, '?scene=street']
  ]) {
    const page = readFileSync(join(root, name + '.html'), 'utf8')
      .replace('<head>', '<head><base href="' + base + '">')
      .replace('</head>', '<style>#mirror{width:640px!important;height:360px!important}</style></head>')
      .replace(
        '</body>',
        '<output id="qa-result" data-state="pending"></output><script>document.addEventListener("DOMContentLoaded",' +
          check.toString() +
          ');</script></body>'
      );
    const file = join(dir, name + '.html');
    writeFileSync(file, page);
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      '--window-size=1200,850',
      '--force-device-scale-factor=1',
      '--user-data-dir=' + join(dir, name + '-profile'),
      '--dump-dom',
      pathToFileURL(file).href + query
    ];
    if (process.env.CI === 'true' && process.platform === 'linux') args.unshift('--no-sandbox');
    const run = spawnSync(browser, args, { encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024 });
    if (run.error) throw run.error;
    const result = /<output id="qa-result" data-state="(\w+)">([^<]*)<\/output>/.exec(run.stdout);
    assert.ok(
      run.status === 0 && result?.[1] === 'pass',
      result?.[2] || run.stderr.slice(-1000) || name + ' did not finish'
    );
    console.log(result[2]);
  }
} finally {
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
