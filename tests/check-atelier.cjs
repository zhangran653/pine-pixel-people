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
    const photos = new Map();
    for (const profile of ['child', 'female', 'male']) {
      const b = document.querySelector('[data-body-profile="' + profile + '"]');
      b.click();
      expect(b.getAttribute('aria-pressed') === 'true', 'incorrect selected body profile ' + profile);
      const height = byId('edit-height');
      height.value = 0.9;
      height.dispatchEvent(new Event('input'));
      const low = contour();
      height.value = 1.1;
      height.dispatchEvent(new Event('input'));
      const high = contour();
      expect(low.height > 50 && high.height > 1.16 * low.height, profile + ' does not visibly grow');
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
    expect(PineWardrobe.saved.get(legacy.id).gender === 'female', 'body profile was lost on save');
    const small = document.createElement('canvas');
    small.style.cssText = 'width:288px;height:224px;display:block';
    document.body.append(small);
    const mirror = atelierPreview.create(small, PineMotion);
    const model = PineLooks.templates.find((p) => p.id === 'look_camper');
    const wide = { ...model, shape: { ...model.shape, shoulders: 1.15, arms: 1.08, height: 1.1 } };
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
    expect(cards.length === 7, 'missing hairstyle swatches');
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
    target.dataset.state = 'pass';
    target.textContent =
      'Body profiles, legacy saves, fixed scale, shared floor and hairstyle swatches passed';
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
    pathToFileURL(file).href
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
