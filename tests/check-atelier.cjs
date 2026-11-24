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
      ...PineLooks.templates.find((p) => p.id === 'look_body_female'),
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
    const model = PineLooks.templates.find((p) => p.id === 'look_camper');
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
    expect(cards.length === Object.keys(PineLooks.slots.hair).length, 'missing hairstyle swatches');
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
      ...PineLooks.templates.find((p) => p.id === 'look_body_female'),
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
      ...PineLooks.templates.find((p) => p.id === 'look_body_female'),
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
      ...PineLooks.templates.find((p) => p.id === 'look_body_male'),
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
    byId('shelf-era').value = 'historic';
    byId('shelf-era').dispatchEvent(new Event('change'));
    byId('look-query').value = '书生';
    byId('look-query').dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('#look-shelf button').length === 1, 'realm and role search');
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
      ...PineLooks.templateById.get('look_workshop_baby'), id: 'look_archived_infant',
      packs: { 'pine-core': PineLooks.morphRelease }
    }).recipe;
    byId('shelf-era').value = '';
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
    target.dataset.state = 'pass';
    target.textContent =
      'Body profiles, legacy saves, head upgrades, facial morphs, guided random portraits, independent locks, round-trip saves, studio outfits, style search and portrait detail passed';
  } catch (err) {
    target.dataset.state = 'fail';
    target.textContent = err.stack || err.message;
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
    status.dataset.state = 'pass';
    status.textContent =
      'World filters, scene placement, rotation, independent detail, playback, score handoff, and desk preset passed';
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
    ['atelier', checkEditor, '?bearing=90'],
    ['studio', checkStudioMotions, '?demo=custom'],
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
