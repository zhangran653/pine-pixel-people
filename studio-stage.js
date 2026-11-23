// Resample the performers into shared horizontal pictures only when their silhouettes can overlap.
// Both sides of a small hand or a baby can then pass in front of and behind another body.
function mergeStudioActors(
  parts,
  cellLimit = Infinity,
  density = Math.max(...parts.map((p) => p.body.density))
) {
  if (parts.length === 1) return parts[0];
  const overall = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  const plans = parts.map((p) => {
    const { body, model } = p,
      d = body.density,
      b = model.bounds,
      c = Math.cos(p.heading),
      s = Math.sin(p.heading);
    const x0 = (b[0] - body.nx / 2) / d,
      x1 = (b[3] - body.nx / 2) / d,
      y0 = (b[1] - body.ny / 2) / d,
      y1 = (b[4] - body.ny / 2) / d;
    const cx = p.x + (c * (x0 + x1)) / 2 - (s * (y0 + y1)) / 2,
      cy = p.y + (s * (x0 + x1)) / 2 + (c * (y0 + y1)) / 2;
    const ex = (Math.abs(c) * (x1 - x0) + Math.abs(s) * (y1 - y0)) / 2,
      ey = (Math.abs(s) * (x1 - x0) + Math.abs(c) * (y1 - y0)) / 2;
    const box = [
      Math.floor((cx - ex) * density),
      Math.floor((cy - ey) * density),
      Math.floor((p.z + b[2] / d) * density),
      Math.ceil((cx + ex) * density),
      Math.ceil((cy + ey) * density),
      Math.ceil((p.z + b[5] / d) * density)
    ];
    for (let k = 0; k < 3; k++) {
      overall[k] = Math.min(overall[k], box[k]);
      overall[k + 3] = Math.max(overall[k + 3], box[k + 3]);
    }
    return { p, c, s, box };
  });
  const [ox, oy, oz] = overall,
    w = overall[3] - ox,
    h = overall[4] - oy,
    depth = overall[5] - oz;
  if (w * h * depth > cellLimit)
    return density > 1 ? mergeStudioActors(parts, cellLimit, Math.max(1, density - 1)) : null;
  const colors = new Uint32Array(w * h * depth);
  for (const { p, c, s, box } of plans) {
    const { body, model } = p,
      d = body.density,
      pitch = body.nx * body.ny,
      sx = (c * d) / density,
      sy = (-s * d) / density;
    const first = (box[0] + 0.5) / density - p.x;
    for (let z = box[2]; z < box[5]; z++) {
      const iz = Math.floor(((z + 0.5) / density - p.z) * d);
      if (iz < model.bounds[2] || iz >= model.bounds[5]) continue;
      for (let y = box[1]; y < box[4]; y++) {
        const across = (y + 0.5) / density - p.y;
        let px = (c * first + s * across) * d + body.nx / 2,
          py = (-s * first + c * across) * d + body.ny / 2;
        let dest = ((z - oz) * h + y - oy) * w + box[0] - ox;
        for (let x = box[0]; x < box[3]; x++, px += sx, py += sy, dest++) {
          const ix = Math.floor(px),
            iy = Math.floor(py);
          if (ix < 0 || iy < 0 || ix >= body.nx || iy >= body.ny) continue;
          const value = model.colors[iz * pitch + iy * body.nx + ix];
          if (value) colors[dest] = value;
        }
      }
    }
  }
  return {
    x: (ox + w / 2) / density,
    y: (oy + h / 2) / density,
    z: oz / density,
    heading: 0,
    body: createSliceProjector(w, h, depth, density),
    model: { colors, sheets: [] }
  };
}

// Cut each person at their own chin. When adults and children touch, merge the
// shared height intervals so both faces and any intervening hands stay visible.
function studioPortraitLayers(parts, motion, sampleLayers = motion.faceLayers) {
  const cuts = new Set(),
    volumes = [];
  for (const p of parts) {
    const layers = sampleLayers.call(motion, p.actor, p.pose, p.model);
    if (!layers) {
      volumes.push(p);
      continue;
    }
    cuts.add(p.z + layers[1].z);
    const c = Math.cos(p.heading),
      s = Math.sin(p.heading);
    for (const layer of layers)
      volumes.push({
        ...layer,
        heading: p.heading,
        x: p.x + c * layer.x - s * layer.y,
        y: p.y + s * layer.x + c * layer.y,
        z: p.z + layer.z
      });
  }
  if (!cuts.size) return null;
  if (parts.length === 1) return volumes;
  const limits = [-Infinity, ...Array.from(cuts).sort((a, b) => a - b), Infinity];
  const drawings = [];
  for (let i = 1; i < limits.length; i++) {
    const band = [];
    for (const v of volumes) {
      const b = v.model.bounds,
        d = v.body.density;
      const lo = Math.max(b[2], Math.round((limits[i - 1] - v.z) * d));
      const hi = Math.min(b[5], Math.round((limits[i] - v.z) * d));
      if (hi <= lo) continue;
      if (lo === b[2] && hi === b[5]) band.push(v);
      else {
        const bounds = [b[0], b[1], lo, b[3], b[4], hi];
        band.push({ ...v, model: { colors: v.model.colors, bounds, sheets: [] } });
      }
    }
    if (!band.length) continue;
    const drawing = mergeStudioActors(band, 960000);
    if (!drawing) return null;
    drawings.push(drawing);
  }
  return drawings;
}

function createStudioStage(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  const back = document.createElement('canvas'),
    front = document.createElement('canvas');
  const bg = back.getContext('2d', { alpha: false, willReadFrequently: true }),
    fg = front.getContext('2d', { willReadFrequently: true });
  const anchorX = -34,
    anchorY = hikerTrail.pathY(anchorX) - 1,
    actorSize = 0.68,
    rad = Math.PI / 180;
  let bearing = 78,
    tilt = 21,
    zoom = 1,
    cacheKey = '',
    view = null,
    entries = [],
    drawings = [];
  function camera(w, h) {
    const yaw = bearing * rad,
      elevation = tilt * rad,
      c = Math.cos(yaw),
      s = Math.sin(yaw),
      cv = Math.cos(elevation),
      sv = Math.sin(elevation);
    const scale = Math.min(w / 88, h / 57) * zoom;
    return {
      width: w,
      height: h,
      yaw,
      elevation,
      scale,
      project(x, y, z = 0) {
        const dx = x - anchorX,
          dy = y - anchorY,
          toward = c * dx + s * dy;
        return {
          x: w * 0.5 + scale * (-s * dx + c * dy),
          y: h * 0.741 + scale * (sv * toward - cv * z),
          depth: cv * toward + sv * z
        };
      }
    };
  }
  function paintScenery() {
    const v = view,
      focus = v.project(anchorX, anchorY);
    back.width = front.width = v.width;
    back.height = front.height = v.height;
    bg.imageSmoothingEnabled = fg.imageSmoothingEnabled = false;
    hikerTrail.drawGround(bg, v);
    for (const prop of hikerTrail.props(v).sort((a, b) => a.depth - b.depth)) {
      const ahead = prop.depth > focus.depth,
        dest = ahead ? fg : bg;
      dest.save();
      if (ahead && prop.height > 15) {
        const p = v.project(prop.baseX, prop.baseY),
          clearance = prop.height * v.scale * Math.cos(v.elevation);
        if (Math.abs(p.x - focus.x) < v.scale * (prop.height * 0.32 + 14) && p.y - clearance < focus.y)
          dest.globalAlpha = 0.14;
      }
      prop.paint(dest);
      dest.restore();
    }
  }
  function draw() {
    const device = Math.min(
      window.devicePixelRatio || 1,
      Math.sqrt(3600000 / Math.max(1, canvas.clientWidth * canvas.clientHeight))
    );
    const W = Math.max(2, Math.round(canvas.clientWidth * device)),
      H = Math.max(2, Math.round(canvas.clientHeight * device));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    const w = Math.max(2, Math.round(canvas.clientWidth / 2)),
      h = Math.max(2, Math.round(canvas.clientHeight / 2));
    const key = [w, h, bearing, tilt, zoom].join('/');
    if (key !== cacheKey) {
      view = camera(w, h);
      paintScenery();
      cacheKey = key;
    }
    ctx.resetTransform();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(back, 0, 0, W, H);
    const sx = W / w,
      sy = H / h,
      world = view.scale * actorSize;
    for (const e of entries) {
      const p = view.project(anchorX + e.x * actorSize, anchorY + e.y * actorSize);
      const radius = Math.max(3, e.rig.height * 0.158),
        lift = Math.max(0, e.z / e.rig.height);
      ctx.fillStyle = 'rgba(39,50,37,' + Math.max(0.075, 0.27 - lift * 0.52) + ')';
      ctx.beginPath();
      ctx.ellipse(
        p.x * sx,
        (p.y + 0.45) * sy,
        radius * world * sx,
        (radius * 0.35 + lift) * world * sy,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    for (const drawing of drawings) {
      const p = view.project(
        anchorX + drawing.x * actorSize,
        anchorY + drawing.y * actorSize,
        drawing.z * actorSize
      );
      drawing.body.draw(
        ctx,
        drawing.model,
        p.x * sx,
        p.y * sy,
        view.yaw - drawing.heading,
        view.elevation,
        world * sx
      );
    }
    ctx.drawImage(front, 0, 0, W, H);
  }
  function setFrame(list) {
    entries = list.map((e) => {
      const actor = studioLibrary.characters.get(e.character);
      return { ...e, actor, rig: actor.rig, body: actor.body, model: actor.body.makePose(e.pose) };
    });
    drawings = entries.length
      ? studioPortraitLayers(entries, studioLibrary, studioLibrary.figureLayers) || [
          mergeStudioActors(entries)
        ]
      : [];
    draw();
  }
  function setView(angle, pitch = tilt, magnify = zoom) {
    bearing = ((angle % 360) + 360) % 360;
    tilt = studioRig.clamp(pitch, 9, 44);
    zoom = studioRig.clamp(magnify, 0.65, 1.65);
    draw();
  }
  return {
    setFrame,
    setView,
    draw,
    get bearing() {
      return bearing;
    },
    get tilt() {
      return tilt;
    },
    get zoom() {
      return zoom;
    }
  };
}
