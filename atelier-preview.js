// A paper studio for the same sampled, horizontal pixel slices used by PineMotion.
const atelierPreview = (() => {
  const radians = Math.PI / 180;
  const portraits = new WeakMap();
  const logicalSizes = new WeakMap();
  let grain = null;

  function paper(canvas) {
    const w = canvas.width,
      h = canvas.height,
      ctx = canvas.getContext('2d');
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, '#eee5d4');
    wash.addColorStop(0.43, '#f5eedf');
    wash.addColorStop(0.73, '#f3ebdb');
    wash.addColorStop(1, '#e9dec8');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    const light = ctx.createRadialGradient(w * 0.42, h * 0.33, 0, w * 0.42, h * 0.33, Math.max(w, h) * 0.68);
    light.addColorStop(0, 'rgba(255,252,240,.43)');
    light.addColorStop(1, 'rgba(255,252,240,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);

    if (!grain) {
      grain = document.createElement('canvas');
      grain.width = grain.height = 96;
      const g = grain.getContext('2d'),
        noise = g.createImageData(96, 96);
      let state = 5017;
      for (let i = 0; i < noise.data.length; i += 4) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        noise.data[i] = 75;
        noise.data[i + 1] = 58;
        noise.data[i + 2] = 38;
        noise.data[i + 3] = state >>> 29;
      }
      g.putImageData(noise, 0, 0);
    }
    ctx.fillStyle = ctx.createPattern(grain, 'repeat');
    ctx.fillRect(0, 0, w, h);
  }

  function part(actor, sample) {
    return { ...sample, actor, body: actor.body, model: actor.body.makePose(sample.pose) };
  }

  function sampleFrame(motion, actor, compare, clip, phase) {
    if (!actor || !clip) return [];
    if (clip.roles.length === 2) {
      const pair = motion.castFor(clip, actor, compare);
      if (pair) {
        const samples = clip.sample(phase, ...pair);
        const parts = pair.map((a, i) => part(a, samples[i]));
        return [{ parts }];
      }
      clip = motion.actions.get('idle');
    }
    return (compare ? [actor, compare] : [actor]).map((a) => {
      const solo = motion.accepts(clip, 0, a) ? clip : motion.actions.get('idle');
      const sample = solo.sample(phase, a)[0];
      // A solo mirror follows the moving root horizontally and keeps the chosen
      // side facing the lens. Ground-relative height and all joint motion survive.
      const p = part(a, { ...sample, x: 0, y: 0, heading: clip.previewTurn ? sample.heading : 0 });
      return { parts: [p], drawing: p };
    });
  }

  function lens(bearing, portrait) {
    // A level full-body lens puts every point on the floor on the same scanline.
    const yaw = bearing * radians,
      tilt = (portrait ? 5 : 0) * radians;
    const ca = Math.cos(yaw),
      sa = Math.sin(yaw),
      ce = Math.cos(tilt),
      se = Math.sin(tilt);
    function project(x, y, z) {
      return [-sa * x + ca * y, se * (ca * x + sa * y) - ce * z];
    }
    return { yaw, tilt, ce, se, project };
  }

  function fromPart(p, local, camera) {
    const c = Math.cos(p.heading),
      s = Math.sin(p.heading);
    return camera.project(
      p.x + c * local[0] - s * local[1],
      p.y + s * local[0] + c * local[1],
      p.z + local[2]
    );
  }

  function projectedBounds(p, camera) {
    const body = p.body,
      b = p.model.bounds,
      d = body.density;
    const center = [
      (b[0] + b[3] - body.nx) / (2 * d),
      (b[1] + b[4] - body.ny) / (2 * d),
      (b[2] + b[5]) / (2 * d)
    ];
    const hx = (b[3] - b[0]) / (2 * d),
      hy = (b[4] - b[1]) / (2 * d),
      hz = (b[5] - b[2]) / (2 * d);
    const a = camera.yaw - p.heading,
      c = Math.abs(Math.cos(a)),
      s = Math.abs(Math.sin(a));
    const ex = s * hx + c * hy,
      ey = camera.se * (c * hx + s * hy) + camera.ce * hz;
    const [x, y] = fromPart(p, center, camera);
    return [x - ex, y - ey, x + ex, y + ey];
  }

  function framing(group, motion, camera, portrait, sharedFloor) {
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    let firstHeadX = Infinity,
      lastHeadX = -Infinity,
      firstHeadY = Infinity,
      lastHeadY = -Infinity;
    const height = Math.max(...group.parts.map((p) => p.actor.rig.height));
    // One lens for all appearances of a solo character. Hair, head depth and swinging arms
    // may change the occupied grid without changing the size of the eyes and mouth on screen.
    if (portrait && group.parts.length === 1) {
      const p = group.parts[0],
        rig = p.actor.rig;
      const focus = motion.rig.point(p.pose.head, [
        rig.neck[0],
        0,
        rig.neck[2] + 0.45 * (height - rig.neck[2])
      ]);
      const [x, headY] = fromPart(p, focus, camera),
        y = sharedFloor ? 0 : headY;
      const headroom = Math.max(0, p.body.nz / p.body.density - 1.27 * height);
      const halfWidth = 0.186 * height + headroom;
      return {
        x,
        y,
        left: -halfWidth,
        right: halfWidth,
        halfWidth,
        top: headY - y - 0.215 * height - headroom,
        bottom: headY - y + 0.207 * height,
        height
      };
    }
    for (const p of group.parts) {
      const h = p.actor.rig.height,
        b = projectedBounds(p, camera);
      left = Math.min(left, b[0]);
      right = Math.max(right, b[2]);
      if (portrait) {
        const rig = p.actor.rig;
        const focus = motion.rig.point(p.pose.head, [rig.neck[0], 0, rig.neck[2] + 0.36 * (h - rig.neck[2])]);
        const [x, y] = fromPart(p, focus, camera);
        firstHeadX = Math.min(firstHeadX, x);
        lastHeadX = Math.max(lastHeadX, x);
        firstHeadY = Math.min(firstHeadY, y);
        lastHeadY = Math.max(lastHeadY, y);
        top = Math.min(top, y - h * 0.2, b[1]);
        bottom = Math.max(bottom, y + h * 0.27);
      } else {
        top = Math.min(top, b[1]);
        bottom = Math.max(bottom, b[3]);
      }
    }
    const x = portrait ? (firstHeadX + lastHeadX) / 2 : group.parts.length === 1 ? 0 : (left + right) / 2;
    const y = portrait && !sharedFloor ? (firstHeadY + lastHeadY) / 2 : 0;
    return {
      x,
      y,
      left: left - x,
      right: right - x,
      halfWidth: Math.max(right - x, x - left, height * (portrait ? 0.15 : 0.205)),
      top: top - y,
      bottom: bottom - y,
      height
    };
  }

  // A rectangular sampling box includes empty corners around a swinging arm.
  // Read the outer painted cells only when a tight side-by-side crop needs them.
  function horizontalInk(group, camera, origin) {
    let left = Infinity,
      right = -Infinity;
    for (const p of group.parts) {
      const { body, model } = p,
        d = body.density;
      if (!p.columns) {
        const [x0, y0, z0, x1, y1, z1] = model.bounds;
        const low = new Int32Array(x1 - x0).fill(y1);
        const high = new Int32Array(x1 - x0).fill(y0 - 1);
        for (let z = z0; z < z1; z++) {
          for (let y = y0; y < y1; y++) {
            const row = (z * body.ny + y) * body.nx + x0;
            for (let i = 0; i < low.length; i++) {
              if (!model.colors[row + i]) continue;
              low[i] = Math.min(low[i], y);
              high[i] = Math.max(high[i], y);
            }
          }
        }
        p.columns = [];
        for (let i = 0; i < low.length; i++) {
          if (high[i] >= low[i])
            p.columns.push([
              (x0 + i + 0.5 - body.nx / 2) / d,
              (low[i] - body.ny / 2) / d,
              (high[i] + 1 - body.ny / 2) / d
            ]);
        }
      }
      const a = camera.yaw - p.heading,
        dx = -Math.sin(a),
        dy = Math.cos(a);
      const base = camera.project(p.x, p.y, p.z)[0] - origin,
        half = Math.abs(dx) / (2 * d);
      for (const [x, y0, y1] of p.columns) {
        const center = base + dx * x;
        left = Math.min(left, center + dy * (dy < 0 ? y1 : y0) - half);
        right = Math.max(right, center + dy * (dy < 0 ? y0 : y1) + half);
      }
    }
    return { left, right };
  }

  function fullBodyLayout(w, h, groups, frames, motion, pixel, action, camera) {
    const cm = motion.rig.centimetersPerUnit;
    const jumping = action === 'jump';
    const normalCeiling = jumping ? 300 : 240;
    const axis = Math.min(49 * pixel, Math.max(32 * pixel, w * 0.068));
    const left = axis + 13 * pixel,
      right = w - Math.max(10 * pixel, w * 0.036);
    const baseline = h - Math.min(h * 0.25, Math.max(35 * pixel, h * 0.112));
    const top = Math.min(h * 0.12, Math.max(7 * pixel, h * 0.025));

    // Hold one scale throughout a clip, including room for the tallest standard
    // adult. Contributed headwear can reserve a higher interval for the whole clip.
    let needed = Math.max(...frames.map((f) => -f.top * cm));
    const gap = 3;
    let sideBySideSpan = gap;
    for (const group of groups) {
      for (const { actor, body } of group.parts) {
        const base = actor.tags.map((tag) => motion.rig.profiles[tag]).find(Boolean);
        const maxHeight = Math.max(
          actor.rig.height,
          (base?.height || 0) * pineDesignerBody.shapeRanges.height[1]
        );
        // Reserve space for fully extended arms before playback on a narrow mirror.
        if (groups.length === 2) sideBySideSpan += base?.height || actor.rig.height;
        const envelope = (body.nz / body.density + 1) / actor.rig.height;
        const clearance = jumping ? envelope : envelope - 0.24;
        needed = Math.max(needed, clearance * maxHeight * cm);
      }
    }
    const ceiling = needed <= normalCeiling ? normalCeiling : Math.ceil(needed / 50) * 50;
    const width = Math.max(1, right - left),
      verticalScale = ((baseline - top) * cm) / ceiling;
    const normalSpan = Math.max(74, sideBySideSpan);
    const occupied = (edges) => edges.reduce((sum, f) => sum + f.right - f.left, gap * (edges.length - 1));
    let edges = frames,
      span = occupied(edges);
    if (span > Math.max(normalSpan, width / verticalScale)) {
      edges = groups.map((group, i) => horizontalInk(group, camera, frames[i].x));
      span = occupied(edges);
    }
    const scale = Math.max(0.001, Math.min(verticalScale, width / Math.max(normalSpan, span)));
    const room = width / scale;
    const pair = edges.length === 2;
    const separation = pair
      ? Math.min(room + edges[0].left - edges[1].right, Math.max(38, edges[0].right - edges[1].left + gap))
      : 0;
    const finalRight = separation + edges[edges.length - 1].right;
    const start = Math.max(-room / 2 - edges[0].left, Math.min(-separation / 2, room / 2 - finalRight));
    const middle = (left + right) / 2;
    return {
      scale,
      baseline,
      axis,
      top,
      pixel,
      cm,
      ceiling,
      origins: frames.map((f, i) => [middle + (start + i * separation - f.x) * scale, baseline])
    };
  }

  function referenceLines(ctx, w, layout) {
    const { axis, baseline, scale, cm, pixel } = layout;
    const left = axis + 9 * pixel,
      right = w - 8 * pixel;
    const fade = ctx.createLinearGradient(left, 0, right, 0);
    fade.addColorStop(0, 'rgba(119,105,75,.31)');
    fade.addColorStop(0.72, 'rgba(119,105,75,.15)');
    fade.addColorStop(1, 'rgba(119,105,75,0)');
    ctx.save();
    ctx.strokeStyle = fade;
    ctx.lineWidth = pixel;
    ctx.beginPath();
    ctx.moveTo(left, baseline);
    ctx.lineTo(right, baseline);
    ctx.stroke();
    const hundred = baseline - (scale * 100) / cm;
    ctx.setLineDash([3 * pixel, 5 * pixel]);
    ctx.beginPath();
    ctx.moveTo(left, hundred);
    ctx.lineTo(right, hundred);
    ctx.stroke();
    ctx.restore();
  }

  function ruler(ctx, layout) {
    const { axis, baseline, scale, top, cm, pixel, ceiling } = layout;
    const spacing = scale / cm;
    const minor = spacing * 10 < 5 * pixel ? 25 : 10;
    const max = Math.floor((Math.min(ceiling, (baseline - top) / spacing) + 1e-7) / minor) * minor;
    ctx.save();
    ctx.lineWidth = Math.max(0.8 * pixel, 0.65);
    ctx.strokeStyle = '#9a907a';
    ctx.fillStyle = '#675f4f';
    ctx.font = '500 ' + 11 * pixel + 'px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('cm', axis + 11 * pixel, baseline - max * spacing);
    ctx.textAlign = 'right';
    ctx.beginPath();
    ctx.moveTo(axis, baseline);
    ctx.lineTo(axis, baseline - max * spacing);
    for (let n = 0; n <= max; n += minor) {
      const y = baseline - n * spacing,
        major = n % 50 === 0;
      ctx.moveTo(axis, y);
      ctx.lineTo(axis + (major ? 8 : 4) * pixel, y);
      if (major) ctx.fillText(String(n), axis - 5 * pixel, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function softShadow(ctx, x, y, rx, ry, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    fade.addColorStop(0, 'rgba(86,64,42,' + opacity + ')');
    fade.addColorStop(0.45, 'rgba(86,64,42,' + opacity * 0.68 + ')');
    fade.addColorStop(1, 'rgba(86,64,42,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  function shadows(ctx, p, camera, scale, ox, oy) {
    const rig = p.actor.rig,
      h = rig.height,
      feet = p.pose.feet;
    const ground = feet.map((f) => fromPart(p, [f[0], f[1], -p.z], camera));
    const x = ox + (scale * (ground[0][0] + ground[1][0])) / 2;
    const y = oy + (scale * (ground[0][1] + ground[1][1])) / 2;
    const lift = Math.max(0, p.z / h);
    softShadow(
      ctx,
      x,
      y,
      scale * h * (0.255 + 0.1 * lift),
      scale * h * (0.053 + 0.025 * lift),
      0.18 * Math.exp(-3.4 * lift)
    );
    feet.forEach((f, i) => {
      const gap = Math.max(0, (p.z + f[2] - rig.ankle) / h);
      softShadow(
        ctx,
        ox + scale * ground[i][0],
        oy + scale * ground[i][1],
        scale * h * 0.094,
        scale * h * 0.031,
        0.3 * Math.exp(-17 * gap)
      );
    });
  }

  function paint(
    ctx,
    w,
    h,
    groups,
    motion,
    action,
    bearing,
    view,
    compact,
    layer,
    pixel = 1,
    detail = true,
    fixed = null
  ) {
    if (!groups.length) return;
    const feature = ['eyes', 'brows', 'nose', 'mouth'].includes(view);
    const portrait = view === 'face' || feature,
      camera = lens(bearing, portrait);
    const frames = groups.map((g) => framing(g, motion, camera, portrait, groups.length > 1));
    const measured =
      !portrait && !compact && fullBodyLayout(w, h, groups, frames, motion, pixel, action, camera);
    let scale, origins;
    if (fixed) {
      scale = Math.min(w / (fixed.right - fixed.left), h / (fixed.bottom - fixed.top));
      origins = [
        [w / 2 - ((fixed.left + fixed.right) * scale) / 2, h / 2 - ((fixed.top + fixed.bottom) * scale) / 2]
      ];
    } else if (feature) {
      const person = groups[0].parts[0],
        socket = (name) => motion.rig.socket(person.actor, person.pose, name);
      const left = socket('leftEye'),
        right = socket('rightEye'),
        mouth = socket('mouth'),
        span = Math.hypot(...left.map((v, i) => v - right[i]));
      const focus = left.map((v, i) => (v + right[i]) / 2);
      if (view === 'brows') focus[2] += 0.27 * span;
      if (view === 'mouth') focus.splice(0, 3, ...mouth);
      if (view === 'nose') for (let i = 0; i < 3; i++) focus[i] += 0.54 * (mouth[i] - focus[i]);
      const screen = fromPart(person, focus, camera);
      scale = Math.min(w / (span * (view === 'eyes' || view === 'brows' ? 1.98 : 1.18)), h / (0.71 * span));
      origins = [[w / 2 - screen[0] * scale, h / 2 - screen[1] * scale]];
    } else if (measured) {
      ({ scale, origins } = measured);
      referenceLines(ctx, w, measured);
    } else {
      const gap = Math.max(...frames.map((f) => f.height)) * 0.13 * (groups.length - 1);
      const span = gap + frames.reduce((sum, f) => sum + 2 * f.halfWidth, 0);
      const top = Math.min(...frames.map((f) => f.top)),
        bottom = Math.max(...frames.map((f) => f.bottom));
      const padTop = h * 0.055;
      scale = Math.min((w * (compact ? 0.94 : 0.87)) / span, (h - padTop) / (bottom - top));
      let cursor = (w - scale * span) / 2;
      const baseline = padTop + (h - padTop - (bottom - top) * scale) / 2 - top * scale;
      origins = frames.map((f) => {
        const origin = [cursor + (f.halfWidth - f.x) * scale, baseline - f.y * scale];
        cursor += (2 * f.halfWidth + gap) * scale;
        return origin;
      });
    }
    groups.forEach((g, i) => {
      const [ox, oy] = origins[i];
      for (const p of g.parts) shadows(ctx, p, camera, scale, ox, oy);
      const mode = detail ? (portrait ? 'portraitLayers' : 'figureLayers') : 'standardLayers';
      if (!g[mode]) {
        const layers =
          detail && studioPortraitLayers(g.parts, motion, portrait ? motion.faceLayers : motion.figureLayers);
        g[mode] = layers || [(g.drawing ??= mergeStudioActors(g.parts))];
      }
      const drawings = g[mode];
      // Magnify the finished pixel image instead of repeatedly projecting each
      // transparent slice across a large portrait canvas.
      const density = Math.max(...drawings.map((d) => d.body.density));
      const ratio = layer ? Math.min(1, Math.max(2.6, density * 1.9) / scale) : 1;
      let ink = ctx;
      if (ratio < 1) {
        resizeTo(layer, Math.ceil(w * ratio), Math.ceil(h * ratio));
        ink = layer.getContext('2d');
        ink.clearRect(0, 0, layer.width, layer.height);
      }
      for (const d of drawings) {
        const pos = camera.project(d.x, d.y, d.z);
        d.body.draw(
          ink,
          d.model,
          (ox + scale * pos[0]) * ratio,
          (oy + scale * pos[1]) * ratio,
          camera.yaw - d.heading,
          camera.tilt,
          scale * ratio
        );
      }
      if (ratio < 1) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(layer, 0, 0, layer.width / ratio, layer.height / ratio);
      }
    });
    return measured;
  }

  function dimensions(canvas, nativePixels = false) {
    // Detached library cards may only have an intrinsic size on their first paint.
    const last = logicalSizes.get(canvas);
    const cssW = canvas.clientWidth || last?.[0] || Number(canvas.getAttribute('width')) || 144;
    const cssH = canvas.clientHeight || last?.[1] || Number(canvas.getAttribute('height')) || 144;
    if (last?.[0] !== cssW || last?.[1] !== cssH) logicalSizes.set(canvas, [cssW, cssH]);
    const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2000000 / (cssW * cssH)));
    const sampling = nativePixels ? ratio : Math.min(ratio, 1.12, 1024 / Math.max(cssW, cssH));
    return [
      Math.max(1, Math.round(cssW * ratio)),
      Math.max(1, Math.round(cssH * ratio)),
      Math.max(1, Math.round(cssW * sampling)),
      Math.max(1, Math.round(cssH * sampling))
    ];
  }

  function resizeTo(canvas, w, h) {
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  }

  function create(canvas, motion) {
    const stage = document.createElement('canvas'),
      backdrop = document.createElement('canvas');
    const layer = document.createElement('canvas');
    const ctx = stage.getContext('2d', { alpha: false }),
      display = canvas.getContext('2d', { alpha: false });
    backdrop.width = 0;
    let previous = null,
      groups = [],
      disposed = false;
    function render() {
      if (disposed) return;
      const [width, height, w, h] = dimensions(canvas, previous?.detail);
      resizeTo(canvas, width, height);
      if (backdrop.width !== w || backdrop.height !== h) {
        resizeTo(backdrop, w, h);
        paper(backdrop);
      }
      const direct = width === w && height === h;
      if (!direct) resizeTo(stage, w, h);
      const target = direct ? display : ctx;
      target.drawImage(backdrop, 0, 0);
      const measured =
        previous &&
        paint(
          target,
          w,
          h,
          groups,
          motion,
          previous.clip.id,
          previous.bearing,
          previous.view,
          false,
          layer,
          w / logicalSizes.get(canvas)[0],
          previous.detail
        );
      if (!direct) {
        display.imageSmoothingEnabled = false;
        display.drawImage(stage, 0, 0, width, height);
      }
      if (measured) {
        // Put small numerals on device pixels after enlarging the pixel art.
        display.save();
        display.scale(width / w, height / h);
        ruler(display, measured);
        display.restore();
      }
    }
    function show({
      actor,
      compare = null,
      action = 'idle',
      u = 0,
      bearing = 25,
      view = 'body',
      detail = true
    }) {
      if (disposed) return;
      const clip = motion.actions.get(action) || motion.actions.get('idle');
      const phase = Math.max(0, Math.min(1, Number.isFinite(u) ? u : 0));
      const angle = Number.isFinite(bearing) ? ((bearing % 360) + 360) % 360 : 25;
      const frameChanged =
        !previous ||
        actor !== previous.actor ||
        compare !== previous.compare ||
        actor?.body !== previous.body ||
        compare?.body !== previous.comparisonBody ||
        clip !== previous.clip ||
        phase !== previous.phase;
      if (frameChanged) groups = sampleFrame(motion, actor, compare, clip, phase);
      if (!frameChanged && angle === previous.bearing && view === previous.view && detail === previous.detail)
        return;
      previous = {
        actor,
        compare,
        body: actor?.body,
        comparisonBody: compare?.body,
        clip,
        phase,
        bearing: angle,
        view,
        detail
      };
      render();
    }
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(render) : null;
    observer?.observe(canvas);
    return {
      show,
      resize: render,
      dispose() {
        disposed = true;
        observer?.disconnect();
        previous = null;
        groups = [];
        resizeTo(stage, 1, 1);
        resizeTo(backdrop, 1, 1);
        resizeTo(layer, 1, 1);
      }
    };
  }

  function thumbnail(canvas, actor, bearing = 24, view = 'face') {
    const [width, height, w, h] = dimensions(canvas, true);
    resizeTo(canvas, width, height);
    const angle = Number.isFinite(bearing) ? ((bearing % 360) + 360) % 360 : 24;
    const key = [w, h, angle, view].join('/');
    let saved = portraits.get(actor);
    if (!saved || saved.body !== actor.body) {
      saved = { body: actor.body, angles: new Map() };
      portraits.set(actor, saved);
    }
    let image = saved.angles.get(key);
    if (!image) {
      image = document.createElement('canvas');
      resizeTo(image, w, h);
      paper(image);
      const motion = globalThis.PineMotion,
        clip = motion.actions.get('idle');
      const groups = sampleFrame(motion, actor, null, clip, 0.17);
      // At outfit-card size the ordinary body grid already resolves the displayed pixels.
      const detail = view !== 'body' || Math.max(w, h) > 120;
      paint(image.getContext('2d'), w, h, groups, motion, clip.id, angle, view, true, null, 1, detail);
      if (saved.angles.size >= 4) saved.angles.delete(saved.angles.keys().next().value);
      saved.angles.set(key, image);
    }
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, width, height);
  }
  // A single camera box for the whole clip keeps a jump, turning step or rolling ball in world space.
  function actionCard(clip, cast, bearing) {
    const motion = globalThis.PineMotion,
      first = clip.sample(0, ...cast),
      height = Math.max(...cast.map((p) => p.rig.height));
    if (bearing === undefined)
      bearing =
        cast.length === 1
          ? -31
          : Math.abs(first[1].y - first[0].y) > Math.abs(first[1].x - first[0].x)
            ? 18
            : 68;
    const camera = lens(bearing, false),
      fixed = { left: Infinity, right: -Infinity, top: Infinity, bottom: 0 };
    for (let n = 0; n <= 10; n++) {
      clip.sample(n / 10, ...cast).forEach((e, i) => {
        const rig = cast[i].rig,
          p = e.pose;
        const landmarks = [
          ...p.feet,
          ...p.arms.flatMap((arm) => [arm.shoulder, arm.elbow, arm.hand]),
          ...p.legs.map((leg) => leg.knee),
          motion.rig.point(p.head, [0, 0, rig.height]),
          ...(p.props || []).map((item) => motion.rig.point(item.frame, [0, 0, 0]))
        ];
        for (const loc of landmarks) {
          const [x, y] = fromPart(e, loc, camera);
          fixed.left = Math.min(fixed.left, x);
          fixed.right = Math.max(fixed.right, x);
          fixed.top = Math.min(fixed.top, y);
        }
      });
    }
    fixed.left -= 0.115 * height;
    fixed.right += 0.115 * height;
    fixed.top -= 0.082 * height;
    fixed.bottom += 0.024 * height;
    return (canvas, u = 0.46) => {
      const groups = [{ parts: clip.sample(u, ...cast).map((e, i) => part(cast[i], e)) }];
      paper(canvas);
      paint(
        canvas.getContext('2d'),
        canvas.width,
        canvas.height,
        groups,
        motion,
        clip.id,
        bearing,
        'body',
        true,
        null,
        1,
        canvas.height > 115,
        fixed
      );
    };
  }
  return { create, thumbnail, actionCard };
})();
