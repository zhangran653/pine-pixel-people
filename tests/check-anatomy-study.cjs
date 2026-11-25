// Run the actual modeler and atelier in an isolated Chrome profile.
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve, sep } = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

async function exerciseModeler() {
  const $ = (id) => document.getElementById(id);
  const expect = (value, message) => {
    if (!value) throw Error(message);
  };
  const picture = (id) => $(id).toDataURL();
  const pair = () => [picture('structure'), picture('dressed')];
  const change = (id, value) => {
    const el = $(id);
    el.value = value;
    expect(el.value === String(value), 'missing option ' + id + '/' + value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'));
    window.testFrame();
  };
  function visible(id) {
    const canvas = $(id);
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let occupied = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 100) occupied++;
    expect(occupied > 240 && occupied < canvas.width * canvas.height * 0.95, id + ' missing figure');
  }
  function portable(link) {
    return JSON.parse(new URLSearchParams(new URL(link).hash.slice(1)).get('character'));
  }
  function bothChanged(previous, message) {
    const next = pair();
    expect(
      next.every((image, i) => image !== previous[i]),
      message
    );
  }
  window.testFrame();
  expect(
    $('base').value === 'female' && $('layer').value === 'skull' && $('angle').value === '270',
    'opening selection'
  );
  const images = { skull: new Set(), dress: new Set() };
  for (const base of ['female', 'male', 'child', 'toddler', 'baby']) {
    change('base', base);
    visible('structure');
    visible('dressed');
    const doc = portable($('edit').href);
    expect(doc.base === (['female', 'male'].includes(base) ? 'adult' : base), 'wrong age ' + base);
    expect(doc.packs['pine-core'] === '1.19.2', 'wrong release');
    images.skull.add(picture('structure'));
    images.dress.add(picture('dressed'));
  }
  expect(images.skull.size >= 4 && images.dress.size === 5, 'age renders must change');
  change('base', 'female');
  const initial = pair();
  change('jaw', 100);
  bothChanged(initial, 'opening the jaw should change both the skull and skin');
  change('jaw', 0);
  expect(
    pair().every((image, i) => image === initial[i]),
    'closed pose did not restore'
  );
  const headings = [new Set(), new Set()];
  for (const angle of [0, 315, 270, 180]) {
    document.querySelector('[data-angle="' + angle + '"]').click();
    expect($('angle-value').value === angle + '°', 'angle control not synchronized');
    pair().forEach((image, i) => headings[i].add(image));
  }
  expect(
    headings.every((set) => set.size === 4),
    'both panes rotate in four directions'
  );
  change('angle', 313);
  change('layer', 'skeleton');
  expect($('framing').value === 'body', 'skeleton needs full body');
  const skeleton = pair();
  change('layer', 'muscle');
  visible('structure');
  expect(
    picture('structure') !== skeleton[0] && picture('dressed') === skeleton[1],
    'independent muscle layer'
  );
  const muscle = pair();
  change('part-arms', 'strong');
  bothChanged(muscle, 'arm part should change muscle and dressed body');
  change('part-torso', 'broad');
  change('part-legs', 'slender');
  change('layer', 'form');
  expect(picture('structure') !== picture('dressed'), 'bare form not independent');
  change('layer', 'skull');
  const beforeShape = pair();
  change('part-skull', 'angular');
  bothChanged(beforeShape, 'head part should change skull and face');
  change('depth', 112);
  change('chin', -30);
  change('action', 'wave');
  change('phase', 76);
  const here = new URL($('edit').href),
    recipe = portable(here);
  expect(
    here.pathname.endsWith('/atelier.html') &&
      here.searchParams.get('action') === 'wave' &&
      here.searchParams.get('bearing') === '313',
    'atelier destination'
  );
  expect(
    recipe.shape.headDepth === 1.12 &&
      recipe.shape.chinProjection === -0.3 &&
      recipe.anatomyParts.skull === 'angular' &&
      recipe.anatomyParts.torso === 'broad' &&
      recipe.anatomyParts.arms === 'strong' &&
      recipe.anatomyParts.legs === 'slender',
    'missing authored parts'
  );

  let file, download;
  const originalCreate = URL.createObjectURL,
    originalClick = HTMLAnchorElement.prototype.click;
  try {
    URL.createObjectURL = function (blob) {
      file = blob;
      return originalCreate.call(URL, blob);
    };
    HTMLAnchorElement.prototype.click = function () {
      download = this.download;
    };
    $('download').click();
  } finally {
    URL.createObjectURL = originalCreate;
    HTMLAnchorElement.prototype.click = originalClick;
  }
  expect(file?.type === 'application/json' && download.endsWith('.json'), 'missing JSON download');
  const content = JSON.parse(await file.text());
  expect(JSON.stringify(content) === JSON.stringify(recipe), 'download and handoff diverged');
  return here.search + here.hash;
}

function exerciseAtelier() {
  const decode = (hash) => JSON.parse(new URLSearchParams(hash.slice(1)).get('character'));
  const input = decode(location.hash);
  if (!document.getElementById('edit-anatomy-skull')) throw Error('handoff did not open the body editor');
  // The atelier rewrites this link from its active, validated draft.
  const link = document.getElementById('anatomy-link');
  const accepted = decode(new URL(link.href).hash);
  // Opening a portable character creates a new editable draft ID in the atelier.
  const expected = PineLooks.prepare(input).recipe;
  const actual = PineLooks.prepare(accepted).recipe;
  expected.id = actual.id;
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw Error('atelier did not activate the transferred recipe');
  return 'ok';
}

// Advance the public requestAnimationFrame loop after each input, keeping every still
// on the same pose. No internal renderer or modeler functions are called by the test.
function frameClock() {
  const callbacks = new Map();
  let index = 0;
  window.requestAnimationFrame = (cb) => {
    callbacks.set(++index, cb);
    return index;
  };
  window.cancelAnimationFrame = (key) => callbacks.delete(key);
  window.testFrame = () => {
    const pending = [...callbacks.values()];
    callbacks.clear();
    for (const cb of pending) cb(performance.now());
  };
}
const root = resolve(__dirname, '..');
const temp = mkdtempSync(join(tmpdir(), 'pine-anatomy-study-'));
const chrome =
  process.env.CHROME_BIN ||
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'google-chrome');
function runPage(name, inspect, query, clock = '') {
  const base = '<base href="' + pathToFileURL(root + sep).href + '">';
  const test =
    '<output id="qa"></output><script>window.addEventListener("load",async()=>{try{' +
    'document.getElementById("qa").textContent="OK "+encodeURIComponent(await (' +
    inspect.toString() +
    ')());' +
    '}catch(err){document.getElementById("qa").textContent="FAIL "+err.stack}});</script>';
  const html = readFileSync(join(root, name), 'utf8')
    .replace('<head>', '<head>' + base + clock)
    .replace('</body>', test + '</body>');
  const path = join(temp, name);
  writeFileSync(path, html);
  const args = [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1180,850',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=4000',
    '--user-data-dir=' + join(temp, 'profile'),
    '--dump-dom',
    pathToFileURL(path).href + query
  ];
  if (process.env.CI === 'true' && process.platform === 'linux') args.unshift('--no-sandbox');
  const result = spawnSync(chrome, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 6000000 });
  const output = result.stdout?.match(/<output id="qa">([^<]*)<\/output>/)?.[1];
  assert.ok(
    result.status === 0 && output?.startsWith('OK '),
    output || result.error?.message || result.stderr?.slice(-900)
  );
  return decodeURIComponent(output.slice(3));
}
try {
  const transfer = runPage(
    'anatomy-study.html',
    exerciseModeler,
    '?base=female&layer=skull&bearing=270',
    '<script>(' + frameClock.toString() + ')();</script>'
  );
  assert.equal(runPage('atelier.html', exerciseAtelier, transfer), 'ok');
  console.log(
    'Passed anatomy study canvases, ages, layers, articulation, parts, JSON export and atelier handoff.'
  );
} finally {
  rmSync(temp, { recursive: true, force: true, maxRetries: 3 });
}
