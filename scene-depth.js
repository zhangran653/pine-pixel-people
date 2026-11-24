// Orthographic Canvas compositor for independently rotated and scaled pixel stacks.
// The first occupied cell along a screen ray gives a color and a world-space depth.
// Empty cells reveal the other stacks behind them, including across different densities.
function projectSceneVolume(target, part, view) {
  const { body, model } = part, { width, height, colors, depth } = target;
  const { nx, ny, nz, density } = body, bounds = model.bounds || [0, 0, 0, nx, ny, nz];
  const [left, back, bottom, right, front, top] = bounds;
  const visibleBottom = view.floorZ === undefined ? bottom : Math.max(bottom, (view.floorZ - part.z) * density);
  if (right <= left || front <= back || top <= visibleBottom) return;
  const c = Math.cos(view.yaw - part.heading), s = Math.sin(view.yaw - part.heading);
  const cosTilt = Math.cos(view.elevation), sinTilt = Math.sin(view.elevation);
  const cx = (left + right) / 2, cy = (back + front) / 2, cz = (bottom + top) / 2;
  const hx = (right - left) / 2, hy = (front - back) / 2, hz = (top - bottom) / 2;
  const relX = cx - nx / 2, relY = cy - ny / 2;
  const along = c * relX + s * relY;
  const ca = Math.cos(view.yaw), sa = Math.sin(view.yaw);
  const originAlong = ca * part.x + sa * part.y;
  const scaleX = view.scaleX / density, scaleY = view.scaleY / density;
  const px = view.x + view.scaleX * (-sa * part.x + ca * part.y) + scaleX * (-s * relX + c * relY);
  const py = view.y + view.scaleY * (sinTilt * originAlong - cosTilt * part.z) + scaleY * (sinTilt * along - cosTilt * cz);
  const radiusX = Math.abs(s) * hx + Math.abs(c) * hy;
  const radiusY = Math.abs(sinTilt * c) * hx + Math.abs(sinTilt * s) * hy + Math.abs(cosTilt) * hz;
  const x0 = Math.max(0, Math.floor(px - scaleX * radiusX)), x1 = Math.min(width, Math.ceil(px + scaleX * radiusX));
  const y0 = Math.max(0, Math.floor(py - scaleY * radiusY)), y1 = Math.min(height, Math.ceil(py + scaleY * radiusY));
  if (x0 >= x1 || y0 >= y1) return;

  // Start rays on a plane just in front of this bounded volume. The affine
  // screen basis and the traversal steps are constant across the entire image.
  const snap = value => Math.abs(value) < 1e-12 ? 0 : value;
  const dx = snap(-c * cosTilt), dy = snap(-s * cosTilt), dz = snap(-sinTilt);
  const near = Math.abs(dx) * hx + Math.abs(dy) * hy + Math.abs(dz) * hz + 1;
  const nearDepth = cosTilt * originAlong + sinTilt * part.z + (cosTilt * along + sinTilt * cz + near) / density;
  const sx = Math.sign(dx), sy = Math.sign(dy), sz = Math.sign(dz);
  const stepX = 1 / Math.abs(dx), stepY = 1 / Math.abs(dy), stepZ = 1 / Math.abs(dz);
  const enterX = sx > 0 ? left : right, leaveX = sx > 0 ? right : left;
  const enterY = sy > 0 ? back : front, leaveY = sy > 0 ? front : back;
  const enterZ = sz > 0 ? visibleBottom : top, leaveZ = sz > 0 ? top : visibleBottom;
  const voxels = model.colors;
  const advanceX = -s / scaleX, advanceY = c / scaleX;
  for (let row = y0; row < y1; row++) {
    const v = (row + 0.5 - py) / scaleY, u0 = (x0 + 0.5 - px) / scaleX;
    let rx = cx - dx * near + c * sinTilt * v - s * u0;
    let ry = cy - dy * near + s * sinTilt * v + c * u0;
    const rz = cz - dz * near - cosTilt * v;
    if (!sz && (rz < visibleBottom || rz >= top)) continue;
    const zEnter = sz ? (enterZ - rz) / dz : -Infinity;
    const zExit = sz ? (leaveZ - rz) / dz : Infinity;
    for (let col = x0; col < x1; col++, rx += advanceX, ry += advanceY) {
      if ((!sx && (rx < left || rx >= right)) || (!sy && (ry < back || ry >= front))) continue;
      let t = Math.max(zEnter, sx ? (enterX - rx) / dx : -Infinity, sy ? (enterY - ry) / dy : -Infinity);
      const end = Math.min(zExit, sx ? (leaveX - rx) / dx : Infinity, sy ? (leaveY - ry) / dy : Infinity);
      const pixel = row * width + col;
      if (t >= end || Math.fround(nearDepth - t / density) < depth[pixel]) continue;
      // Move a tiny fraction into the first cell to resolve rays on a grid face.
      const inside = t + 1e-8;
      let ix = Math.max(left, Math.min(right - 1, Math.floor(rx + inside * dx)));
      let iy = Math.max(back, Math.min(front - 1, Math.floor(ry + inside * dy)));
      let iz = Math.max(bottom, Math.min(top - 1, Math.floor(rz + inside * dz)));
      let tx = sx ? (ix + (sx > 0 ? 1 : 0) - rx) / dx : Infinity;
      let ty = sy ? (iy + (sy > 0 ? 1 : 0) - ry) / dy : Infinity;
      let tz = sz ? (iz + (sz > 0 ? 1 : 0) - rz) / dz : Infinity;
      while (true) {
        const color = voxels[(iz * ny + iy) * nx + ix];
        if (color) {
          const hit = Math.fround(nearDepth - t / density);
          // Coplanar cells get a stable tie-break independent of placement order.
          if (hit > depth[pixel] || (hit === depth[pixel] && color > colors[pixel])) {
            depth[pixel] = hit;
            colors[pixel] = color;
          }
          break;
        }
        t = Math.min(tx, ty, tz);
        if (t >= end - 1e-8) break;
        if (tx <= t + 1e-10) { ix += sx; tx += stepX; }
        if (ty <= t + 1e-10) { iy += sy; ty += stepY; }
        if (tz <= t + 1e-10) { iz += sz; tz += stepZ; }
      }
    }
  }
}

// Trace just the clicked output pixel through the same cells and depth ties as the rendered frame.
function pickSceneVolume(view, x, y, parts) {
  const pixel = { width: 1, height: 1, colors: new Uint32Array(1), depth: new Float32Array([-Infinity]) };
  const ray = { ...view, x: view.x - Math.floor(x), y: view.y - Math.floor(y) };
  let selected;
  for (const part of parts) {
    const depth = pixel.depth[0], color = pixel.colors[0];
    projectSceneVolume(pixel, part, ray);
    if (depth !== pixel.depth[0] || color !== pixel.colors[0]) selected = part.pickId;
  }
  return selected;
}

function createSceneCompositor() {
  const overlay = document.createElement('canvas'), ink = overlay.getContext('2d');
  let pixels, frame, background, cameraKey, previous = [];
  function draw(ctx, view, scenery, actors) {
    const { width, height } = ctx.canvas;
    if (!frame || width !== frame.width || height !== frame.height) {
      overlay.width = width;
      overlay.height = height;
      pixels = ink.createImageData(width, height);
      frame = { width, height, colors: new Uint32Array(pixels.data.buffer), depth: new Float32Array(width * height) };
      background = { width, height, colors: new Uint32Array(width * height), depth: new Float32Array(width * height) };
      cameraKey = null;
    }
    const key = [view.x, view.y, view.scaleX, view.scaleY, view.yaw, view.elevation, view.floorZ].join('/');
    const same = key === cameraKey && scenery.length === previous.length && scenery.every((p, i) => {
      const q = previous[i];
      return p.model === q.model && p.body === q.body && p.x === q.x && p.y === q.y && p.z === q.z && p.heading === q.heading;
    });
    if (!same) {
      background.colors.fill(0);
      background.depth.fill(-Infinity);
      for (const p of scenery) projectSceneVolume(background, p, view);
      previous = scenery.map(p => ({ ...p }));
      cameraKey = key;
    }
    frame.colors.set(background.colors);
    frame.depth.set(background.depth);
    for (const p of actors) projectSceneVolume(frame, p, view);
    ink.putImageData(pixels, 0, 0);
    ctx.save();
    ctx.resetTransform();
    ctx.drawImage(overlay, 0, 0);
    ctx.restore();
  }
  return { draw };
}
