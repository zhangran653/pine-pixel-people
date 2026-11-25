// Orthographic pixels share the converter's coordinates: x forward, y screen-right
// at the front view, z up. The editor writes back the same inclusive run format.
(() => {
  'use strict';
  const el = (id) => document.getElementById(id);
  const root = 'studies/turnaround/';
  const cache = new Map();
  let model,
    loadId = 0;
  function unpack(doc) {
    if (
      doc?.format !== 'pine.slices/1' ||
      doc.dimensions?.length !== 3 ||
      !doc.dimensions.every((n) => Number.isInteger(n) && n > 0 && n <= 512) ||
      !Array.isArray(doc.palette) ||
      !doc.palette.length ||
      doc.palette.length > 256 ||
      !doc.palette.every((c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) ||
      !Array.isArray(doc.runs)
    )
      throw Error('底模格式无效');
    const [nx, ny, nz] = doc.dimensions;
    if (nx * ny * nz > 6000000) throw Error('底模超过此预览器的六百万格上限');
    const cells = new Uint16Array(nx * ny * nz);
    for (const row of doc.runs) {
      if (!Array.isArray(row) || row.length !== 5 || !row.every(Number.isInteger))
        throw Error('水平段格式无效');
      const [z, y, x0, x1, c] = row;
      if (
        z < 0 ||
        z >= nz ||
        y < 0 ||
        y >= ny ||
        x0 < 0 ||
        x1 < x0 ||
        x1 >= nx ||
        c < 0 ||
        c >= doc.palette.length
      )
        throw Error('水平段超出底模或色板范围');
      const start = (z * ny + y) * nx;
      for (let x = x0; x <= x1; x++) {
        if (cells[start + x]) throw Error('同一格重复编码');
        cells[start + x] = c + 1;
      }
    }
    return { nx, ny, nz, cells, palette: doc.palette.slice(), changes: [], level: Math.floor(nz * 0.65) };
  }
  function pack(m) {
    const { nx, ny, nz, cells, palette } = m,
      runs = [];
    for (let z = 0; z < nz; z++)
      for (let y = 0; y < ny; y++) {
        const offset = (z * ny + y) * nx;
        for (let x = 0; x < nx; ) {
          const start = x,
            ink = cells[offset + x++];
          while (x < nx && cells[offset + x] === ink) x++;
          if (ink) runs.push([z, y, start, x - 1, ink - 1]);
        }
      }
    return { format: 'pine.slices/1', dimensions: [nx, ny, nz], palette, runs };
  }
  function project() {
    if (!model) return;
    const { nx, ny, nz, cells, palette } = model,
      canvas = el('render'),
      angle = +el('angle').value;
    el('ang').value = angle + '°';
    const w = Math.ceil(Math.hypot(nx, ny)) + 2,
      a = (Math.PI * angle) / 180,
      c = Math.cos(a),
      s = Math.sin(a);
    canvas.width = w;
    canvas.height = nz + 2;
    const ctx = canvas.getContext('2d'),
      im = ctx.createImageData(w, nz + 2),
      depth = new Float32Array(w * nz);
    depth.fill(-Infinity);
    const colors = palette.map((hex) => parseInt(hex.slice(1), 16));
    for (let z = 0; z < nz; z++)
      for (let y = 0; y < ny; y++) {
        const offset = (z * ny + y) * nx,
          side = y - (ny - 1) / 2;
        for (let x = 0; x < nx; x++) {
          const ink = cells[offset + x];
          if (!ink) continue;
          const f = x - (nx - 1) / 2,
            col = Math.floor(f * s + side * c + w / 2 + 1e-10),
            d = f * c - side * s;
          const pixel = (nz - 1 - z) * w + col;
          if (d < depth[pixel]) continue;
          depth[pixel] = d;
          const i = 4 * (pixel + w),
            color = colors[ink - 1];
          im.data[i] = color >> 16;
          im.data[i + 1] = (color >> 8) & 255;
          im.data[i + 2] = color & 255;
          im.data[i + 3] = 255;
        }
      }
    ctx.putImageData(im, 0, 0);
  }
  function section() {
    if (!model) return;
    const { nx, ny, cells, palette, level } = model,
      canvas = el('section');
    canvas.width = ny;
    canvas.height = nx;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++) {
        const ink = cells[(level * ny + y) * nx + x];
        if (ink) {
          ctx.fillStyle = palette[ink - 1];
          ctx.fillRect(y, nx - 1 - x, 1, 1);
        }
      }
    el('level-value').value = level + 1 + ' / ' + model.nz;
    el('undo').disabled = !model.changes.length;
  }
  function colors(i = 0) {
    el('swatches').replaceChildren(...model.palette.map((v, j) => new Option(j + 1 + ' · ' + v, j)));
    el('swatches').value = i;
    el('dye').value = model.palette[i];
  }
  async function json(url) {
    const res = await fetch(url);
    if (!res.ok) throw Error('样本加载失败 · ' + res.status);
    return res.json();
  }
  async function example(key) {
    const response = await fetch(root + 'previews/' + key + '.json.gz');
    if (!response.ok) throw Error('底模加载失败 · ' + response.status);
    const bytes = new Uint8Array(await response.arrayBuffer());
    // Some static servers already send Content-Encoding: gzip.
    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return unpack(JSON.parse(new TextDecoder().decode(bytes)));
    const decoded = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return unpack(await new Response(decoded).json());
  }
  function drawSource(view, image, canvas) {
    const [x, y, right, bottom] = view.crop;
    canvas.width = right - x;
    canvas.height = bottom - y;
    canvas.getContext('2d').drawImage(image, x, y, right - x, bottom - y, 0, 0, canvas.width, canvas.height);
  }
  async function originals(key, ticket) {
    const manifestUrl = new URL(root + key + '.json', document.baseURI);
    const [manifest, results] = await Promise.all([json(manifestUrl), json(root + 'results.json')]);
    const sourceImages = new Map();
    const frames = await Promise.all(
      manifest.views.map(async (v) => {
        const url = new URL(v.source || manifest.source, manifestUrl).href;
        if (!sourceImages.has(url)) {
          const img = new Image();
          img.src = url;
          sourceImages.set(
            url,
            img.decode().then(() => img),
          );
        }
        return [v, await sourceImages.get(url)];
      }),
    );
    if (ticket !== loadId) return;
    el('inputs').replaceChildren();
    for (const [v, image] of frames) {
      if (v.role === 'holdout') {
        drawSource(v, image, el('reference'));
        continue;
      }
      const fig = document.createElement('figure'),
        cv = document.createElement('canvas'),
        label = document.createElement('figcaption');
      drawSource(v, image, cv);
      label.textContent = v.angle + '°';
      fig.append(cv, label);
      el('inputs').append(fig);
    }
    const m = results[key].views.oblique;
    el('metric').textContent =
      '初始底模在 45° 的轮廓重合率为 ' + (100 * m.silhouetteIou).toFixed(1) + '%。修改切片后可手动对照原画。';
    el('proof').hidden = false;
  }
  function activate(m) {
    model = m;
    el('level').max = m.nz - 1;
    el('level').value = m.level;
    el('save').disabled = false;
    colors();
    project();
    section();
  }
  async function choose() {
    const key = el('sample').value,
      ticket = ++loadId;
    model = null;
    el('save').disabled = true;
    el('undo').disabled = true;
    el('proof').hidden = true;
    el('status').textContent = '正在读取底模…';
    try {
      if (!cache.has(key)) cache.set(key, await example(key));
      if (ticket !== loadId) return;
      activate(cache.get(key));
      el('status').textContent =
        model.nz +
        ' 层 · ' +
        model.palette.length +
        ' 色 · ' +
        (key.startsWith('smooth-')
          ? '正、侧两张原画参与生成，背面由算法补全。'
          : key === 'local'
            ? '本机导入的底模。'
            : '正、侧、背三张设定参与生成。');
      if (key !== 'local') await originals(key, ticket);
    } catch (e) {
      if (ticket === loadId) el('status').textContent = e.message;
    }
  }
  el('sample').onchange = choose;
  el('angle').oninput = project;
  for (const button of document.querySelectorAll('[data-angle]'))
    button.onclick = () => {
      el('angle').value = button.dataset.angle;
      project();
    };
  el('level').oninput = () => {
    if (model) {
      model.level = +el('level').value;
      section();
    }
  };
  el('swatches').onchange = () => {
    if (model) el('dye').value = model.palette[+el('swatches').value];
  };
  el('dye').onchange = () => {
    if (!model) return;
    const index = +el('swatches').value,
      value = el('dye').value;
    if (model.palette[index] === value) return;
    model.changes.push({ index, old: model.palette[index], kind: 'dye' });
    model.palette[index] = value;
    colors(index);
    project();
    section();
  };
  el('section').onclick = (event) => {
    if (!model) return;
    const cv = el('section'),
      rect = cv.getBoundingClientRect(),
      { nx, ny, cells, level } = model;
    const y = Math.floor(((event.clientX - rect.left) * ny) / rect.width),
      x = nx - 1 - Math.floor(((event.clientY - rect.top) * nx) / rect.height);
    if (x < 0 || x >= nx || y < 0 || y >= ny) return;
    const index = (level * ny + y) * nx + x,
      old = cells[index],
      brush = el('brush').value;
    if (brush === 'pick') {
      if (old) colors(old - 1);
      return;
    }
    const ink = brush === 'cut' ? 0 : +el('swatches').value + 1;
    if (old === ink) return;
    model.changes.push({ kind: 'cell', index, old });
    cells[index] = ink;
    project();
    section();
  };
  el('undo').onclick = () => {
    const change = model?.changes.pop();
    if (!change) return;
    if (change.kind === 'dye') {
      model.palette[change.index] = change.old;
      colors(change.index);
    } else model.cells[change.index] = change.old;
    project();
    section();
  };
  el('save').onclick = () => {
    if (!model) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(pack(model))], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = el('sample').value + '-slices.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  el('open').onchange = async () => {
    const file = el('open').files[0];
    if (!file) return;
    try {
      if (file.size > 32 * 1024 * 1024) throw Error('请打开小于 32 MB 的底模');
      const local = unpack(JSON.parse(await file.text()));
      cache.set('local', local);
      if (!el('sample').querySelector('[value="local"]')) el('sample').add(new Option('本机导入', 'local'));
      el('sample').value = 'local';
      await choose();
    } catch (e) {
      el('status').textContent = '导入失败 · ' + e.message;
    } finally {
      el('open').value = '';
    }
  };
  const requested = new URLSearchParams(location.search).get('sample');
  if ([...el('sample').options].some((o) => o.value === requested)) el('sample').value = requested;
  choose();
})();
