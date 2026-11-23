// The adapter takes the host's Three.js namespace so every mesh belongs to the same engine instance.
const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
const linear16 = Uint16Array.from({ length: 256 }, (_, i) => {
  const s = i / 255;
  return Math.round(65535 * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4));
});

// On each grid boundary, join coplanar, equally colored exposed cells into rectangles.
// A signed mask stores both color and outward direction. The extra bit preserves opaque black.
function surfaceRectangles(model, dimensions, scratch) {
  const faces = scratch.faces;
  faces.length = 0;
  const { colors, bounds } = model;
  const stride = [1, dimensions[0], dimensions[0] * dimensions[1]];
  for (let axis = 0; axis < 3; axis++) {
    const u = (axis + 1) % 3,
      v = (axis + 2) % 3;
    const columns = bounds[u + 3] - bounds[u],
      rows = bounds[v + 3] - bounds[v];
    if (columns <= 0 || rows <= 0) continue;
    if (scratch.mask.length < columns * rows) scratch.mask = new Int32Array(columns * rows);
    const mask = scratch.mask;
    for (let plane = bounds[axis]; plane <= bounds[axis + 3]; plane++) {
      const hasBefore = plane > bounds[axis],
        hasAfter = plane < bounds[axis + 3];
      const origin = plane * stride[axis] + bounds[u] * stride[u] + bounds[v] * stride[v];
      let count = 0;
      for (let row = 0; row < rows; row++) {
        let cell = origin + row * stride[v];
        for (let col = 0; col < columns; col++, cell += stride[u]) {
          const before = hasBefore ? colors[cell - stride[axis]] : 0;
          const after = hasAfter ? colors[cell] : 0;
          let key = 0;
          if (Boolean(before) !== Boolean(after)) {
            const color = before || after;
            key = (littleEndian ? color & 0xffffff : color >>> 8) | 0x1000000;
            if (after) key = -key;
            count++;
          }
          mask[row * columns + col] = key;
        }
      }
      if (!count) continue;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; ) {
          const at = row * columns + col,
            key = mask[at];
          if (!key) {
            col++;
            continue;
          }
          let width = 1,
            height = 1;
          while (col + width < columns && mask[at + width] === key) width++;
          while (row + height < rows) {
            const next = at + height * columns;
            let match = 0;
            while (match < width && mask[next + match] === key) match++;
            if (match !== width) break;
            height++;
          }
          faces.push(axis, plane, bounds[u] + col, bounds[v] + row, width, height, key);
          for (let r = 0; r < height; r++) {
            const start = at + r * columns;
            mask.fill(0, start, start + width);
          }
          col += width;
        }
      }
    }
  }
  return faces;
}

function allocateSurface(T, capacity) {
  const geometry = new T.BufferGeometry();
  const index = capacity * 4 > 65535 ? new Uint32Array(capacity * 6) : new Uint16Array(capacity * 6);
  for (let i = 0; i < capacity; i++) {
    const k = i * 4,
      n = i * 6;
    index[n] = k;
    index[n + 1] = k + 1;
    index[n + 2] = k + 2;
    index[n + 3] = k;
    index[n + 4] = k + 2;
    index[n + 5] = k + 3;
  }
  geometry.setIndex(new T.BufferAttribute(index, 1));
  geometry.setAttribute(
    'position',
    new T.BufferAttribute(new Float32Array(capacity * 12), 3).setUsage(T.DynamicDrawUsage)
  );
  geometry.setAttribute(
    'normal',
    new T.BufferAttribute(new Int8Array(capacity * 12), 3, true).setUsage(T.DynamicDrawUsage)
  );
  geometry.setAttribute(
    'color',
    new T.BufferAttribute(new Uint16Array(capacity * 12), 3, true).setUsage(T.DynamicDrawUsage)
  );
  geometry.boundingBox = new T.Box3();
  geometry.boundingSphere = new T.Sphere();
  return geometry;
}

function writeSurface(T, mesh, body, model, scratch, offset) {
  const faces = surfaceRectangles(model, [body.nx, body.ny, body.nz], scratch);
  const count = faces.length / 7;
  if (!count) {
    mesh.geometry.setDrawRange(0, 0);
    return;
  }
  if (!mesh.geometry.index || mesh.geometry.index.count < count * 6) {
    mesh.geometry.dispose();
    mesh.geometry = allocateSurface(T, 2 ** Math.ceil(Math.log2(count)));
  }
  const g = mesh.geometry,
    { position, color, normal } = g.attributes;
  const d = body.density;
  const origin = [
    body.nx / 2 - (offset?.x || 0) * d,
    body.ny / 2 - (offset?.y || 0) * d,
    -(offset?.z || 0) * d
  ];
  const p = position.array,
    n = normal.array,
    c = color.array;
  for (let f = 0; f < count; f++) {
    const j = f * 7,
      axis = faces[j],
      u = (axis + 1) % 3,
      v = (axis + 2) % 3;
    const plane = (faces[j + 1] - origin[axis]) / d;
    const loU = (faces[j + 2] - origin[u]) / d,
      loV = (faces[j + 3] - origin[v]) / d;
    const hiU = loU + faces[j + 4] / d,
      hiV = loV + faces[j + 5] / d;
    const front = faces[j + 6] > 0,
      rgb = Math.abs(faces[j + 6]);
    const red = linear16[littleEndian ? rgb & 255 : (rgb >> 16) & 255];
    const green = linear16[(rgb >> 8) & 255];
    const blue = linear16[littleEndian ? (rgb >> 16) & 255 : rgb & 255];
    for (let corner = 0; corner < 4; corner++) {
      const k = (f * 4 + corner) * 3;
      p[k + axis] = plane;
      p[k + u] = corner === 2 || corner === (front ? 1 : 3) ? hiU : loU;
      p[k + v] = corner === 2 || corner === (front ? 3 : 1) ? hiV : loV;
      n[k + axis] = front ? 127 : -127;
      n[k + u] = 0;
      n[k + v] = 0;
      c[k] = red;
      c[k + 1] = green;
      c[k + 2] = blue;
    }
  }
  for (const attribute of [position, normal, color]) {
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, count * 12);
    attribute.needsUpdate = true;
  }
  g.setDrawRange(0, count * 6);
  const b = model.bounds;
  g.boundingBox.min.set((b[0] - origin[0]) / d, (b[1] - origin[1]) / d, (b[2] - origin[2]) / d);
  g.boundingBox.max.set((b[3] - origin[0]) / d, (b[4] - origin[1]) / d, (b[5] - origin[2]) / d);
  g.boundingBox.getBoundingSphere(g.boundingSphere);
}

export function createPineCast(
  THREE,
  motion,
  {
    metersPerUnit = (motion?.rig?.centimetersPerUnit ?? 3.4) / 100,
    sampleRate = 20,
    material,
    faceDetail = false,
    detail = faceDetail ? 'face' : 'standard'
  } = {}
) {
  if (![metersPerUnit, sampleRate].every((n) => Number.isFinite(n) && n > 0))
    throw new RangeError('比例与采样率须为正数');
  function checkDetail(mode) {
    if (!['standard', 'face', 'figure'].includes(mode)) throw new RangeError('未知的人物精度');
    return mode;
  }
  checkDetail(detail);
  const group = new THREE.Group(),
    basis = new THREE.Group();
  group.name = 'PineMotion';
  basis.rotation.x = -Math.PI / 2; // Pine (forward, left, up) -> Three (x, up, -z).
  basis.scale.setScalar(metersPerUnit);
  group.add(basis);
  const paint = material ?? new THREE.MeshLambertMaterial({ vertexColors: true });
  const slots = [],
    heads = [],
    scratch = { faces: [], mask: new Int32Array(0) };
  let previousPlan,
    previousTick,
    previousIndex,
    previousRepeat,
    previousEnd,
    lastEntries,
    disposed = false;

  function setFrame(entries) {
    if (disposed) throw new Error('此人物组已释放');
    const cast = entries.map((e) => {
      const actor = motion.characters.get(e.character);
      if (!actor) throw new Error('未知人物 · ' + e.character);
      return actor;
    });
    previousPlan = undefined;
    lastEntries = entries;
    entries.forEach((e, i) => {
      let mesh = slots[i];
      if (!mesh) {
        mesh = new THREE.Mesh(new THREE.BufferGeometry(), paint);
        mesh.castShadow = mesh.receiveShadow = true;
        slots.push(mesh);
        basis.add(mesh);
      }
      const body = cast[i].body;
      const model = body.makePose(e.pose);
      const sampleLayers =
        detail === 'figure' ? (motion.figureLayers ?? motion.faceLayers) : motion.faceLayers;
      const layers = detail !== 'standard' && sampleLayers?.call(motion, cast[i], e.pose, model);
      if (layers) {
        const [lower, upper] = layers;
        writeSurface(THREE, mesh, lower.body, lower.model, scratch, lower);
        let head = heads[i];
        if (!head) {
          head = heads[i] = new THREE.Mesh(new THREE.BufferGeometry(), paint);
          head.castShadow = head.receiveShadow = true;
          mesh.add(head);
        }
        writeSurface(THREE, head, upper.body, upper.model, scratch);
        head.position.set(upper.x, upper.y, upper.z);
        head.name = e.character + '/face';
        head.visible = true;
      } else {
        writeSurface(THREE, mesh, body, model, scratch);
        if (heads[i]) heads[i].visible = false;
      }
      mesh.name = e.character;
      mesh.position.set(e.x, e.y, e.z);
      mesh.rotation.z = e.heading;
      mesh.visible = true;
    });
    for (let i = entries.length; i < slots.length; i++) slots[i].visible = false;
  }
  function setDetail(mode) {
    if (disposed) throw new Error('此人物组已释放');
    if (detail === mode) return false;
    detail = checkDetail(mode);
    if (lastEntries) {
      const plan = previousPlan;
      setFrame(lastEntries);
      previousPlan = plan;
    }
    return true;
  }
  function setTime(plan, seconds) {
    if (disposed) throw new Error('此人物组已释放');
    const t = Math.max(0, Math.min(plan.duration, Number.isFinite(seconds) ? seconds : 0));
    const cue = plan.locate(t),
      tick = Math.floor(t * sampleRate),
      end = t === plan.duration;
    if (
      previousPlan === plan &&
      previousTick === tick &&
      previousIndex === cue?.index &&
      previousRepeat === cue?.iteration &&
      previousEnd === end
    )
      return false;
    let time = t;
    if (cue && !end) {
      const start = plan.starts[cue.index] + cue.iteration * cue.step.seconds;
      time = Math.max(start, tick / sampleRate);
    }
    setFrame(plan.sample(time));
    previousPlan = plan;
    previousTick = tick;
    previousIndex = cue?.index;
    previousRepeat = cue?.iteration;
    previousEnd = end;
    return true;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    group.removeFromParent();
    for (const mesh of slots) mesh.geometry.dispose();
    for (const head of heads) head?.geometry.dispose();
    if (!material) paint.dispose();
    basis.clear();
    slots.length = 0;
    heads.length = 0;
    lastEntries = undefined;
    scratch.faces.length = 0;
    scratch.mask = new Int32Array(0);
    previousPlan = undefined;
  }
  return {
    group,
    setFrame,
    setTime,
    setDetail,
    setFaceDetail: (enabled) => setDetail(enabled ? 'face' : 'standard'),
    dispose
  };
}
