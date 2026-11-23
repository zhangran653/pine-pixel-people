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
    mirror.dispose();
    small.remove();
    byId('tab-hair').click();
    const cards = [...document.querySelectorAll('[data-hair-style]')];
    expect(cards.length === 12, 'missing hairstyle swatches');
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
    expect(palette.length === 8, 'missing hair colors');
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
    expect(byId('face-quality').hidden, 'portrait setting is visible in the full length mirror');

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
    target.dataset.state = 'pass';
    target.textContent =
      'Body profiles, legacy saves, head upgrade, scale, hairstyles, dyes, close-ups and slice alignment passed';
  } catch (err) {
    target.dataset.state = 'fail';
    target.textContent = err.message;
  }
}

const root = resolve(__dirname, '..'),
  dir = mkdtempSync(join(tmpdir(), 'pine-atelier-check-'));
try {
  const base = pathToFileURL(root + sep).href;
  const page = readFileSync(join(root, 'atelier.html'), 'utf8')
    .replace('<head>', '<head><base href="' + base + '">')
    .replace('</head>', '<style>#mirror{width:640px!important;height:360px!important}</style></head>')
    .replace(
      '</body>',
      '<output id="qa-result" data-state="pending"></output><script>document.addEventListener("DOMContentLoaded",' +
        checkEditor.toString() +
        ');</script></body>'
    );
  const file = join(dir, 'view.html');
  writeFileSync(file, page);
  const browser =
    process.env.CHROME_BIN ||
    (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : 'google-chrome');
  const args = [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1200,850',
    '--force-device-scale-factor=1',
    '--user-data-dir=' + join(dir, 'profile'),
    '--dump-dom',
    pathToFileURL(file).href + '?bearing=90'
  ];
  if (process.env.CI === 'true' && process.platform === 'linux') args.unshift('--no-sandbox');
  const run = spawnSync(browser, args, { encoding: 'utf8', timeout: 45000, maxBuffer: 4 * 1024 * 1024 });
  if (run.error) throw run.error;
  const result = /<output id="qa-result" data-state="(\w+)">([^<]*)<\/output>/.exec(run.stdout);
  assert.ok(
    run.status === 0 && result?.[1] === 'pass',
    result?.[2] || run.stderr.slice(-1000) || 'Editor did not finish'
  );
  console.log(result[2]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
