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

  function duet(motion, clip, actor, compare) {
    const partnerFor = (slot) => {
      if (compare && motion.accepts(clip, slot, compare)) return compare;
      const candidates = [
        motion.characters.get(actor.tags.includes('adult') ? 'child' : 'mother'),
        ...motion.characters.values()
      ];
      return candidates.find((p) => p && p !== actor && motion.accepts(clip, slot, p));
    };
    if (motion.accepts(clip, 0, actor)) {
      const other = partnerFor(1);
      if (other) return [actor, other];
    }
    if (motion.accepts(clip, 1, actor)) {
      const other = partnerFor(0);
      if (other) return [other, actor];
    }
    return null;
  }

  function part(actor, sample) {
    return { ...sample, actor, body: actor.body, model: actor.body.makePose(sample.pose) };
  }

  function sampleFrame(motion, actor, compare, clip, phase) {
    if (!actor || !clip) return [];
    if (clip.roles.length === 2) {
      const pair = duet(motion, clip, actor, compare);
      if (pair) {
        const samples = clip.sample(phase, ...pair);
        const parts = pair.map((a, i) => part(a, samples[i]));
        return [{ parts, drawing: mergeStudioActors(parts) }];
      }
      clip = motion.actions.get('idle');
    }
    return (compare ? [actor, compare] : [actor]).map((a) => {
      const sample = clip.sample(phase, a)[0];
      // A solo mirror follows the moving root horizontally and keeps the chosen
      // side facing the lens. Ground-relative height and all joint motion survive.
      const p = part(a, { ...sample, x: 0, y: 0, heading: 0 });
      return { parts: [p], drawing: p };
    });
  }

  function lens(bearing, portrait) {
    const yaw = bearing * radians,
      tilt = (portrait ? 5 : 9) * radians;
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

  function standingHeight(actor, action) {
    if (action === 'jump') return actor.rig.height * 1.28;
    if (action === 'crawl') return actor.rig.height * 0.73;
    if (action === 'sit' || action === 'type' || action === 'peekaboo') return actor.rig.height * 0.85;
    if (actor.tags.includes('baby') && ['idle', 'wave', 'clap', 'sway'].includes(action))
      return actor.rig.height * 0.82;
    return actor.rig.height;
  }

  function framing(group, motion, action, camera, portrait, sharedFloor) {
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    let firstHeadX = Infinity,
      lastHeadX = -Infinity,
      firstHeadY = Infinity,
      lastHeadY = -Infinity;
    const height = Math.max(...group.parts.map((p) => p.actor.rig.height));
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
        // The nominal height keeps squats and jumps visible against a steady floor.
        top = Math.min(top, -standingHeight(p.actor, action) * camera.ce, b[1]);
        bottom = Math.max(bottom, h * 0.035, b[3]);
      }
    }
    const x = portrait ? (firstHeadX + lastHeadX) / 2 : group.parts.length === 1 ? 0 : (left + right) / 2;
    const y = portrait && !sharedFloor ? (firstHeadY + lastHeadY) / 2 : 0;
    return {
      x,
      y,
      halfWidth: Math.max(right - x, x - left, height * (portrait ? 0.15 : 0.205)),
      top: top - y,
      bottom: bottom - y,
      height
    };
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

  function paint(ctx, w, h, groups, motion, action, bearing, view, compact, layer) {
    if (!groups.length) return;
    const portrait = view === 'face',
      camera = lens(bearing, portrait);
    const frames = groups.map((g) => framing(g, motion, action, camera, portrait, groups.length > 1));
    const height = Math.max(...frames.map((f) => f.height));
    const gap = height * (portrait ? 0.13 : 0.22) * (groups.length - 1);
    const span = gap + frames.reduce((sum, f) => sum + 2 * f.halfWidth, 0);
    const top = Math.min(...frames.map((f) => f.top)),
      bottom = Math.max(...frames.map((f) => f.bottom));
    const padTop = h * (compact ? 0.055 : portrait ? 0.055 : 0.085);
    const padBottom = h * (portrait ? 0 : 0.11);
    const scale = Math.min((w * (compact ? 0.94 : 0.87)) / span, (h - padTop - padBottom) / (bottom - top));
    let cursor = (w - scale * span) / 2;
    const baseline = padTop + (h - padTop - padBottom - (bottom - top) * scale) / 2 - top * scale;
    groups.forEach((g, i) => {
      const f = frames[i],
        ox = cursor + (f.halfWidth - f.x) * scale,
        oy = baseline - f.y * scale;
      for (const p of g.parts) shadows(ctx, p, camera, scale, ox, oy);
      const d = g.drawing,
        pos = camera.project(d.x, d.y, d.z);
      const x = ox + scale * pos[0],
        y = oy + scale * pos[1];
      // Magnify the finished pixel image instead of repeatedly projecting each
      // transparent slice across a large portrait canvas.
      const ratio = layer ? Math.min(1, Math.max(2.6, d.body.density * 1.9) / scale) : 1;
      if (ratio === 1) {
        d.body.draw(ctx, d.model, x, y, camera.yaw - d.heading, camera.tilt, scale);
      } else {
        resizeTo(layer, Math.ceil(w * ratio), Math.ceil(h * ratio));
        const ink = layer.getContext('2d');
        ink.clearRect(0, 0, layer.width, layer.height);
        d.body.draw(ink, d.model, x * ratio, y * ratio, camera.yaw - d.heading, camera.tilt, scale * ratio);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(layer, 0, 0, layer.width / ratio, layer.height / ratio);
      }
      cursor += (2 * f.halfWidth + gap) * scale;
    });
  }

  function dimensions(canvas, compact) {
    // Detached library cards may only have an intrinsic size on their first paint.
    const last = logicalSizes.get(canvas);
    const cssW = canvas.clientWidth || last?.[0] || Number(canvas.getAttribute('width')) || 144;
    const cssH = canvas.clientHeight || last?.[1] || Number(canvas.getAttribute('height')) || 144;
    if (last?.[0] !== cssW || last?.[1] !== cssH) logicalSizes.set(canvas, [cssW, cssH]);
    const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2000000 / (cssW * cssH)));
    const sampling = Math.min(ratio, compact ? 1.5 : 1.12, 1024 / Math.max(cssW, cssH));
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
      const [width, height, w, h] = dimensions(canvas, false);
      resizeTo(canvas, width, height);
      if (backdrop.width !== w || backdrop.height !== h) {
        resizeTo(backdrop, w, h);
        paper(backdrop);
      }
      resizeTo(stage, w, h);
      ctx.drawImage(backdrop, 0, 0);
      if (previous)
        paint(ctx, w, h, groups, motion, previous.clip.id, previous.bearing, previous.view, false, layer);
      display.imageSmoothingEnabled = false;
      display.drawImage(stage, 0, 0, width, height);
    }
    function show({ actor, compare = null, action = 'idle', u = 0, bearing = 25, view = 'body' }) {
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
      if (!frameChanged && angle === previous.bearing && view === previous.view) return;
      previous = {
        actor,
        compare,
        body: actor?.body,
        comparisonBody: compare?.body,
        clip,
        phase,
        bearing: angle,
        view
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

  function thumbnail(canvas, actor) {
    const [width, height, w, h] = dimensions(canvas, true);
    resizeTo(canvas, width, height);
    let saved = portraits.get(actor);
    if (!saved || saved.w !== w || saved.h !== h || saved.body !== actor.body) {
      const image = document.createElement('canvas');
      resizeTo(image, w, h);
      paper(image);
      const motion = globalThis.PineMotion,
        clip = motion.actions.get('idle');
      const groups = sampleFrame(motion, actor, null, clip, 0.17);
      paint(image.getContext('2d'), w, h, groups, motion, clip.id, 24, 'face', true);
      saved = { w, h, body: actor.body, image };
      portraits.set(actor, saved);
    }
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(saved.image, 0, 0, width, height);
  }
  return { create, thumbnail };
})();
