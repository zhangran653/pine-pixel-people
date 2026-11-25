// Test the public viewer over HTTP, including a genuine edited-file round trip.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');

async function exercise() {
  const $ = (id) => document.getElementById(id);
  const expect = (value, msg) => {
    if (!value) throw Error(msg);
  };
  async function wait(predicate) {
    for (let i = 0; i < 250; i++) {
      if (predicate()) return;
      await new Promise((r) => setTimeout(r, 25));
    }
    throw Error('Viewer timeout: ' + $('status').textContent);
  }
  async function captureFile() {
    let saved;
    const create = URL.createObjectURL,
      click = HTMLAnchorElement.prototype.click;
    try {
      URL.createObjectURL = (blob) => {
        saved = blob;
        return 'blob:test';
      };
      HTMLAnchorElement.prototype.click = () => {};
      $('save').click();
      return await saved.text();
    } finally {
      URL.createObjectURL = create;
      HTMLAnchorElement.prototype.click = click;
    }
  }
  async function openFile(data) {
    const dt = new DataTransfer();
    dt.items.add(new File([data], 'example.json', { type: 'application/json' }));
    $('open').files = dt.files;
    $('open').dispatchEvent(new Event('change'));
    await wait(() => $('sample').value === 'local' || $('status').textContent.startsWith('导入失败'));
  }
  try {
    for (const [key, count] of [
      ['smooth-baby', 2],
      ['smooth-adult', 2],
      ['child', 3],
      ['baby', 3],
      ['adult', 3],
    ]) {
      $('sample').value = key;
      $('sample').dispatchEvent(new Event('change'));
      await wait(() => !$('proof').hidden && $('inputs').children.length === count);
      const frame = $('render'),
        data = frame.getContext('2d').getImageData(0, 0, frame.width, frame.height).data;
      expect(data.filter((c, i) => i % 4 === 3 && c === 255).length > 300, key + ' did not draw');
    }
    const before = $('render').toDataURL();
    document.querySelector('[data-angle="90"]').click();
    expect(before !== $('render').toDataURL(), 'angle did not turn the volume');
    const original = await captureFile();
    const layer = $('section'),
      rect = layer.getBoundingClientRect();
    const footprint = layer.getContext('2d').getImageData(0, 0, layer.width, layer.height).data;
    let empty = 0;
    while (empty < layer.width * layer.height && footprint[empty * 4 + 3]) empty++;
    expect(empty < layer.width * layer.height, 'test needs an empty cell');
    layer.dispatchEvent(
      new MouseEvent('click', {
        clientX: rect.left + (((empty % layer.width) + 0.5) * rect.width) / layer.width,
        clientY: rect.top + ((Math.floor(empty / layer.width) + 0.5) * rect.height) / layer.height,
      }),
    );
    const edited = await captureFile();
    expect(edited !== original, 'brush did not edit a voxel');
    $('undo').click();
    expect((await captureFile()) === original, 'undo did not restore the volume');
    $('dye').value = '#31bc83';
    $('dye').dispatchEvent(new Event('change'));
    expect(JSON.parse(await captureFile()).palette[0] === '#31bc83', 'dye did not reach exported palette');
    await openFile(edited);
    expect($('proof').hidden && (await captureFile()) === edited, 'file import/export did not round trip');
    $('sample').value = 'adult';
    $('sample').dispatchEvent(new Event('change'));
    await wait(() => !$('proof').hidden);
    await openFile('{"format":"pine.slices/1","dimensions":[99,99,-1]}');
    expect($('status').textContent.startsWith('导入失败'), 'malformed volume was accepted');
    await fetch('/__done', { method: 'POST', body: 'ok' });
  } catch (e) {
    await fetch('/__done', { method: 'POST', body: String(e.stack || e) });
  }
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pine-turnaround-chrome-'));
  let resolveResult;
  const result = new Promise((resolve) => {
    resolveResult = resolve;
  });
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.gz': 'application/gzip',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const server = http.createServer((req, res) => {
    if (req.url === '/__done' && req.method === 'POST') {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => {
        res.end();
        resolveResult(data);
      });
      return;
    }
    const url = new URL(req.url, 'http://localhost'),
      f = path.resolve(root, '.' + url.pathname);
    if (!f.startsWith(root + path.sep)) {
      res.writeHead(404).end();
      return;
    }
    fs.readFile(f, (err, bytes) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream');
      if (f.endsWith('turnaround-lab.html'))
        res.end(
          bytes
            .toString()
            .replace(
              '</body>',
              '<script>addEventListener("load",()=>(' + exercise.toString() + ')());</script></body>',
            ),
        );
      else res.end(bytes);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const chrome =
    process.env.CHROME_BIN ||
    (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : 'google-chrome');
  const args = [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--disable-background-networking',
    '--user-data-dir=' + dir,
    'http://127.0.0.1:' + server.address().port + '/turnaround-lab.html',
  ];
  if (process.env.CI === 'true' && process.platform === 'linux') args.unshift('--no-sandbox');
  const proc = spawn(chrome, args, { stdio: 'ignore' });
  let stop;
  try {
    const answer = await Promise.race([
      result,
      new Promise((resolve, reject) => {
        stop = setTimeout(() => reject(Error('Timed out testing viewer')), 60000);
        proc.once('error', reject);
        proc.once('exit', (code) => reject(Error('Chrome exited ' + code)));
      }),
    ]);
    assert.equal(answer, 'ok');
    console.log('5 multi-view examples, rotation, editable slices and JSON round trip passed');
  } finally {
    clearTimeout(stop);
    proc.kill();
    await new Promise((r) => {
      if (proc.exitCode !== null || proc.signalCode !== null || !proc.pid) r();
      else proc.once('exit', r);
    });
    server.close();
    // Chrome's helpers can finish writing the temporary profile after the browser exits.
    await fs.promises.rm(dir, { recursive: true, force: true, maxRetries: 12, retryDelay: 150 });
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
