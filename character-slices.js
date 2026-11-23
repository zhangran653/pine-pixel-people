// Paint in body coordinates. Density sets the number of samples per unit on each axis.
function createSliceActor(art, density = 1, accessories = null, box = [40,44,50]) {
  const [nx,ny,nz]=box.map(n=>Math.ceil(n*density));
  const bottleMaterials = {
    enamel: '396fa8', enamelLight: '639bc8', enamelFoot: '374f77',
    bottleBand: 'a2ccdc', steel: 'c1cfd0', spout: 'e4e8d9', seal: '465b67'
  };
  const palette = [[0, 0, 0]], ink = {};
  for (const [name, hex] of Object.entries({...art.materials, ...bottleMaterials, ...accessories?.materials})) {
    ink[name] = palette.length;
    palette.push([0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)));
  }
  const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  const swatches = palette.map(channels => Array.from({ length: 32 }, (_, level) => {
    const light = level ? level / 24 : .96;
    const [r,g,b] = channels.map(c => Math.min(255,Math.round(c*light)));
    return littleEndian ? (255<<24)|(b<<16)|(g<<8)|r : (r<<24)|(g<<16)|(b<<8)|255;
  }));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const MaterialGrid=palette.length<=256?Uint8Array:palette.length<=65536?Uint16Array:Uint32Array;
  const portraitLighting = new Uint8Array(palette.length);
  for (const name of art.portraitLighting?.soft || []) portraitLighting[ink[name]] = 1;
  for (const name of art.portraitLighting?.painted || []) portraitLighting[ink[name]] = 2;

  function paintBottle({base, lip, held}, rightArm, stamp, link) {
    const vector = lip.map((v, i) => v-base[i]);
    const length = Math.hypot(...vector);
    if (length < .001) return;
    const axis = vector.map(v => v/length);
    const [ax,ay,az] = axis, [bx,by,bz] = base, radius = 2.05;
    const bounds = dim => [Math.min(base[dim],lip[dim])-radius, Math.max(base[dim],lip[dim])+radius];
    stamp(...bounds(0), ...bounds(1), ...bounds(2), (x,y,z) => {
      const dx=x-bx, dy=y-by, dz=z-bz;
      const along = ax*dx+ay*dy+az*dz, t=along/length;
      if (t < 0 || t > 1) return 0;
      const rx=dx-along*ax, ry=dy-along*ay, rz=dz-along*az;
      let r = radius;
      if (t < .10) r = lerp(1.63, radius, t/.10);
      else if (t > .92) r = 1.05;
      else if (t > .80) r = .84;
      else if (t > .61) r = lerp(radius, .94, (t-.61)/.19);
      if (rx*rx+ry*ry+rz*rz > r*r) return 0;
      if (t > .89) return ink.spout;
      if (t > .77) return ink.seal;
      if (t > .63) return ink.steel;
      if (t < .10) return ink.enamelFoot;
      if (t < .25) return ink.bottleBand;
      return .5*rx-.72*ry+.25*rz > 1.28 ? ink.enamelLight : ink.enamel;
    });
    if (!rightArm || held === false) return;
    const reach = rightArm.hand.map((v,i) => v-base[i]);
    const grip = reach.reduce((sum,v,i) => sum+v*axis[i], 0);
    const normal = reach.map((v,i) => v-grip*axis[i]);
    const distance = Math.hypot(...normal);
    if (distance < .01 || distance > 3.45 || grip < .8 || grip > .77*length) return;
    const [ux,uy,uz] = normal.map(v => v/distance);
    const tangent = [ay*uz-az*uy, az*ux-ax*uz, ax*uy-ay*ux];
    const outward = [ux,uy,uz];
    function onGrip(h, angle) {
      return base.map((v,i) => v+(grip+h)*axis[i]+radius*(outward[i]*Math.cos(angle)+tangent[i]*Math.sin(angle)));
    }
    // Two short finger pads and an opposing thumb leave the enamel band visible.
    for (const h of [-.62,.53]) {
      link(onGrip(h,.05), onGrip(h-.13,1.13), .68, .51, 1, () => ink.skinLight);
    }
    link(onGrip(1.12,-.08), onGrip(.46,-.94), .74, .53, 1, () => ink.skin);
  }

  function samplePose(pose, density, nx, ny, nz, ox, oy, oz, faceDetail) {
    const pitch = nx * ny;
    let frame = null;
    const cells = new MaterialGrid(pitch * nz);
    function fillBounds(x0, x1, y0, y1, z0, z1, paint) {
      const left=Math.max(0,Math.floor((x0-ox)*density+nx/2)), right=Math.min(nx,Math.ceil((x1-ox)*density+nx/2));
      const top=Math.max(0,Math.floor((y0-oy)*density+ny/2)), bottom=Math.min(ny,Math.ceil((y1-oy)*density+ny/2));
      const low=Math.max(0,Math.floor((z0-oz)*density)), high=Math.min(nz,Math.ceil((z1-oz)*density));
      if (left >= right || top >= bottom) return;
      for (let z=low;z<high;z++) {
        const pz=oz+(z+.5)/density;
        for (let y=top;y<bottom;y++) {
          const py=oy+(y+.5-ny/2)/density, row=z*pitch+y*nx;
          for (let x=left;x<right;x++) {
            const color=paint(ox+(x+.5-nx/2)/density,py,pz);
            if (color) cells[row+x]=color;
          }
        }
      }
    }
    // Sample a rigid part in its original drawing coordinates. Inverse sampling
    // visits every destination pixel even when a thin feature tilts between slices.
    function stamp(x0, x1, y0, y1, z0, z1, paint) {
      if (!frame) {
        fillBounds(x0, x1, y0, y1, z0, z1, paint);
        return;
      }
      const m = frame;
      const cx=(x1+x0)/2, cy=(y1+y0)/2, cz=(z1+z0)/2;
      const hx=(x1-x0)/2, hy=(y1-y0)/2, hz=(z1-z0)/2;
      const bound = row => {
        const center = m[row]*cx + m[row+1]*cy + m[row+2]*cz + m[row+3];
        const extent = Math.abs(m[row])*hx + Math.abs(m[row+1])*hy + Math.abs(m[row+2])*hz;
        return [center-extent, center+extent];
      };
      fillBounds(...bound(0), ...bound(4), ...bound(8), (x, y, z) => {
        const dx=x-m[3], dy=y-m[7], dz=z-m[11];
        return paint(m[0]*dx+m[4]*dy+m[8]*dz, m[1]*dx+m[5]*dy+m[9]*dz, m[2]*dx+m[6]*dy+m[10]*dz);
      });
    }
    function blob(x, y, z, rx, ry, rz, color, exponent = 2) {
      stamp(x-rx, x+rx, y-ry, y+ry, z-rz, z+rz, (px, py, pz) => {
        const u = Math.abs((px-x)/rx), v = Math.abs((py-y)/ry), w = Math.abs((pz-z)/rz);
        if (u ** exponent + v ** exponent + w ** exponent > 1) return 0;
        return typeof color === 'function' ? color(px, py, pz) : color;
      });
    }
    // A tapered solid joins two points. The rounded ends keep moving joints joined.
    function link(a, b, r0, r1, width, color) {
      const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2];
      const length2 = dx*dx + dy*dy + dz*dz;
      const m = Math.max(r0, r1) * Math.max(1, width);
      stamp(Math.min(a[0], b[0])-m, Math.max(a[0], b[0])+m,
        Math.min(a[1], b[1])-m, Math.max(a[1], b[1])+m,
        Math.min(a[2], b[2])-m, Math.max(a[2], b[2])+m, (x, y, z) => {
          const t = clamp(((x-a[0])*dx + (y-a[1])*dy + (z-a[2])*dz) / length2, 0, 1);
          const u = x - a[0] - dx*t, v = (y - a[1] - dy*t) / width, w = z - a[2] - dz*t;
          if (u*u + v*v + w*w > lerp(r0, r1, t) ** 2) return 0;
          return color(t, u, v, w);
        });
    }
    const brush = {density, faceDetail, frame(transform) {frame=transform;}, stamp, blob, link};
    art.paint(pose, brush, ink);
    frame = null;
    if (pose.bottle) paintBottle(pose.bottle, pose.arms.find(arm => arm.side === -1), stamp, link);
    if (accessories && pose.props?.length) accessories.paint(pose,brush,ink);

    const colors = new Uint32Array(cells.length);
    const bounds=[nx,ny,nz,0,0,0];
    for (let i=0;i<cells.length;i++) {
      const material=cells[i];
      if (!material) continue;
      const dx = Number(!!cells[i-1]) - Number(!!cells[i+1]);
      const dy = Number(!!cells[i-nx]) - Number(!!cells[i+nx]);
      const dz = Number(!!cells[i-pitch]) - Number(!!cells[i+pitch]);
      const n = Math.hypot(dx,dy,dz);
      let shade = n ? Math.round((0.94 + (0.17 * (0.43 * dx - 0.37 * dy + 0.81 * dz)) / n) * 24) : 0;
      if (faceDetail && portraitLighting[material] === 2) {
        // The portrait artist has already lit these small color planes in head space.
        shade = 24;
      } else if (faceDetail && n && portraitLighting[material]) {
        // Two sampling distances soften stair-step shadows on cheeks without filtering any pigment edges.
        const gx = dx + Number(!!cells[i - 2]) - Number(!!cells[i + 2]);
        const gy = dy + Number(!!cells[i - 2 * nx]) - Number(!!cells[i + 2 * nx]);
        const gz = dz + Number(!!cells[i - 2 * pitch]) - Number(!!cells[i + 2 * pitch]);
        shade = Math.round(
          (0.975 + (0.072 * (0.43 * gx - 0.37 * gy + 0.81 * gz)) / (Math.hypot(gx, gy, gz) || 1)) * 24
        );
      }
      colors[i] = swatches[material][shade];
      const x=i%nx, row=(i-x)/nx, y=row%ny, z=(row-y)/ny;
      if(x<bounds[0])bounds[0]=x;if(x>=bounds[3])bounds[3]=x+1;
      if(y<bounds[1])bounds[1]=y;if(y>=bounds[4])bounds[4]=y+1;
      if(z<bounds[2])bounds[2]=z;if(z>=bounds[5])bounds[5]=z+1;
    }
    return { colors, sheets: [], bounds };
  }

  function makePose(pose) {
    return samplePose(pose, density, nx, ny, nz, 0, 0, 0, false);
  }
  // Split at a horizontal cell boundary. Every object above it, including hands,
  // glasses or a bottle in front of the mouth, shares the finer sampling grid.
  function faceLayers(pose, model, height, desiredDensity) {
    const b = model.bounds,
      plane = nx * ny;
    const cut = Math.max(b[2] + 1, Math.floor(height * density));
    if (cut >= b[5]) return null;
    let left = nx,
      right = 0,
      lowY = ny,
      highY = 0;
    for (let z = cut; z < b[5]; z++) {
      for (let y = b[1]; y < b[4]; y++) {
        const row = z * plane + y * nx;
        let first = b[0],
          last = b[3];
        while (first < last && !model.colors[row + first]) first++;
        if (first === last) continue;
        while (!model.colors[row + last - 1]) last--;
        left = Math.min(left, first);
        right = Math.max(right, last);
        lowY = Math.min(lowY, y);
        highY = Math.max(highY, y + 1);
      }
    }
    if (left >= right) return null;
    // Crop on the actor's grid. An off-center hairstyle or raised hand may grow
    // the crop, but must not move the row of samples through the middle of the lips.
    const xMin = (left - nx / 2 - 2) / density, xMax = (right - nx / 2 + 2) / density;
    const yMin = (lowY - ny / 2 - 2) / density, yMax = (highY - ny / 2 + 2) / density;
    const top = (b[5] - cut + 2) / density;
    const limit = 480000, volume = (xMax - xMin) * (yMax - yMin) * top;
    let d = Math.min(Math.floor(desiredDensity), Math.floor(Math.cbrt(limit / volume))), w, h, layers;
    for (; d > density; d--) {
      w = Math.ceil(xMax * d) - Math.floor(xMin * d);
      h = Math.ceil(yMax * d) - Math.floor(yMin * d);
      layers = Math.ceil(top * d);
      if (w * h * (layers + 2) <= limit) break;
    }
    if (!(d > density)) return null;
    const x = (Math.floor(xMin * d) + w / 2) / d,
      y = (Math.floor(yMin * d) + h / 2) / d,
      z = cut / density;
    // Keep two lighting neighbors below the join while sampling the upper section.
    const fine = samplePose(pose, d, w, h, layers + 2, x, y, z - 2 / d, true);
    if (fine.bounds[5] <= 2) return null;
    fine.colors = fine.colors.subarray(2 * w * h);
    fine.bounds[2] = Math.max(0, fine.bounds[2] - 2);
    fine.bounds[5] -= 2;
    return [
      {
        x: 0,
        y: 0,
        z: 0,
        body: createSliceProjector(nx, ny, cut, density),
        model: {
          colors: model.colors.subarray(0, plane * cut),
          bounds: [b[0], b[1], b[2], b[3], b[4], cut],
          sheets: []
        }
      },
      { x, y, z, body: createSliceProjector(w, h, layers, d), model: fine }
    ];
  }
  return {...createSliceProjector(nx,ny,nz,density), makePose, faceLayers};
}

function createSliceProjector(nx,ny,nz,density) {
  const dimensions=[nx,ny,nz], pitch=nx*ny;
  // Repack the same horizontal images along either lateral axis for edge-on views.
  const faces = [[1,2],[0,2],[0,1]], cols = 8, gutter = 2;
  function sheet(model, axis) {
    if (model.sheets[axis]) return model.sheets[axis];
    const bounds = model.bounds || [0, 0, 0, nx, ny, nz];
    const [u, v] = faces[axis];
    const u0 = bounds[u],
      v0 = bounds[v],
      k0 = bounds[axis];
    const w = Math.max(1, bounds[u + 3] - u0),
      h = Math.max(1, bounds[v + 3] - v0),
      count = Math.max(0, bounds[axis + 3] - k0);
    const tw = w + 2 * gutter,
      th = h + 2 * gutter;
    const image = document.createElement('canvas');
    image.width = Math.min(cols, Math.max(1, count)) * tw;
    image.height = th * Math.max(1, Math.ceil(count / cols));
    const c = image.getContext('2d', { willReadFrequently: true }),
      data = c.createImageData(image.width, image.height);
    const out = new Uint32Array(data.data.buffer);
    // Atlas offsets are separable along x, y and z, including the gutters of each slice.
    const offsets = dimensions.map((length, dim) =>
      Int32Array.from({ length }, (_, i) => {
        if (dim === u) return i - u0;
        if (dim === v) return (i - v0) * image.width;
        const tile = i - k0;
        return (Math.floor(tile / cols) * th + gutter) * image.width + (tile % cols) * tw + gutter;
      })
    );
    for (let z = bounds[2]; z < bounds[5]; z++)
      for (let y = bounds[1]; y < bounds[4]; y++) {
        const src = z * pitch + y * nx,
          dest = offsets[2][z] + offsets[1][y];
        for (let x = bounds[0]; x < bounds[3]; x++) {
          const value = model.colors[src + x];
          if (value) out[dest + offsets[0][x]] = value;
        }
      }
    c.putImageData(data, 0, 0);
    return (model.sheets[axis] = { image, w, h, tw, th, u0, v0, k0, count });
  }
  function draw(ctx, model, x, y, azimuth, elevation, worldScale) {
    const scale=worldScale/density;
    const a = Math.cos(azimuth), b = Math.sin(azimuth), c = Math.cos(elevation), s = Math.sin(elevation);
    const axes = [[-b,s*a,c*a],[a,s*b,c*b],[0,-c,s]];
    let axis = 0;
    for (let i=1;i<3;i++) if (Math.abs(axes[i][2]) > Math.abs(axes[axis][2])) axis=i;
    const normal=axes[axis], across=axes[faces[axis][0]], down=axes[faces[axis][1]], source=sheet(model,axis);
    const ox=x-scale*(axes[0][0]*nx/2+axes[1][0]*ny/2-across[0]*source.u0-down[0]*source.v0);
    const oy=y-scale*(axes[0][1]*nx/2+axes[1][1]*ny/2-across[1]*source.u0-down[1]*source.v0);
    const samples=Math.max(1,Math.ceil(scale*Math.hypot(normal[0],normal[1])*1.7));
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    for (let pass=0; pass<source.count; pass++) {
      const tile=normal[2]>=0 ? pass : source.count-1-pass;
      const k=source.k0+tile;
      for (let sub=0; sub<samples; sub++) {
        const d=k+((normal[2]>=0?sub:samples-1-sub)+.5)/samples;
        ctx.setTransform(scale*across[0],scale*across[1],scale*down[0],scale*down[1],ox+d*scale*normal[0],oy+d*scale*normal[1]);
        ctx.drawImage(source.image,(tile%cols)*source.tw+gutter,Math.floor(tile/cols)*source.th+gutter,source.w,source.h,0,0,source.w,source.h);
      }
    }
    ctx.restore();
  }
  function drawSlice(ctx, model, level) {
    const atlas = sheet(model, 2),
      k = level - 1 - atlas.k0;
    ctx.clearRect(0, 0, nx, ny);
    if (k >= 0 && k < atlas.count)
      ctx.drawImage(
        atlas.image,
        (k % cols) * atlas.tw + gutter,
        Math.floor(k / cols) * atlas.th + gutter,
        atlas.w,
        atlas.h,
        atlas.u0,
        atlas.v0,
        atlas.w,
        atlas.h
      );
  }
  return { draw, drawSlice, nx, ny, nz, density };
}
