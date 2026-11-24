// Original 28-layer rover and aircraft drawings from the first two slice studies.
const pineVehicleSlices = (() => {
  function bitmap(width, height, draw) {
    const data = new Uint8ClampedArray(width * height * 4);
    let color;
    const ctx = {
      set fillStyle(hex) {
        color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      },
      fillRect(x, y, w, h) {
        for (let j = Math.max(0, y); j < Math.min(height, y + h); j++)
          for (let i = Math.max(0, x); i < Math.min(width, x + w); i++) {
            const q = (j * width + i) * 4;
            data[q] = color[0];
            data[q + 1] = color[1];
            data[q + 2] = color[2];
            data[q + 3] = 255;
          }
      },
      createImageData(w, h) {
        return { data: new Uint8ClampedArray(w * h * 4) };
      },
      getImageData() {
        return { data: data.slice() };
      },
      putImageData(image) {
        data.set(image.data);
      }
    };
    draw(ctx);
    return { width, height, data, getContext: () => ctx };
  }
  function rover() {
    function rect(context, color, x, y, width, height) {
      context.fillStyle = color;
      context.fillRect(x, y, width, height);
    }

    function cutRect(context, color, x, y, width, height, corner = 2) {
      context.fillStyle = color;
      context.fillRect(x, y + corner, width, height - 2 * corner);
      for (let row = 0; row < corner; row++) {
        const inset = corner - row;
        context.fillRect(x + inset, y + row, width - 2 * inset, 1);
        context.fillRect(x + inset, y + height - 1 - row, width - 2 * inset, 1);
      }
    }

    function wheel(context, x, y, layer) {
      cutRect(context, '#101917', x, y, 13, 9);
      rect(context, layer > 6 ? '#3d4a43' : '#283530', x + 1, y + 2, 11, 5);
      rect(context, '#556050', x + 2, y + 4, 9, 1);
      for (const offset of [2, 5, 8, 11]) {
        rect(context, '#161f1b', x + offset, y + 1, 1, 7);
      }
    }

    function paintChassis(context, layer) {
      if (layer < 9) {
        for (const [x, y] of [
          [9, 2],
          [38, 2],
          [9, 27],
          [38, 27]
        ]) {
          wheel(context, x, y, layer);
        }
      }

      if (layer < 3) {
        cutRect(context, '#26332a', 7, 10, 47, 18);
        rect(context, '#475444', 10, 15, 38, 8);
        rect(context, '#131b17', 4, 12, 5, 14);
        rect(context, '#131b17', 51, 11, 5, 16);
        return;
      }

      const fender = layer < 10 ? '#526d48' : '#91af68';
      const shell = layer < 11 ? '#779958' : '#bbd782';
      cutRect(context, '#263925', 3, 6, 54, 26);
      cutRect(context, fender, 4, 7, 52, 24);
      cutRect(context, shell, 7, 9, 47, 20);
      rect(context, '#425e3a', 7, 9, 10, 20);
      rect(context, '#6c8b4d', 8, 11, 7, 16);
      rect(context, '#394837', 9, 14, 2, 10);

      // Tail lights sit at the left end of the cutouts. The bonnet faces right.
      rect(context, '#9d4a37', 3, 9, 3, 4);
      rect(context, '#ec8860', 3, 10, 1, 2);
      rect(context, '#9d4a37', 3, 25, 3, 4);
      rect(context, '#ec8860', 3, 26, 1, 2);
      rect(context, '#39523a', 10, 7, 36, 2);
      rect(context, '#39523a', 10, 29, 36, 2);
      rect(context, '#354835', 55, 13, 3, 12);
      rect(context, '#566349', 57, 15, 1, 8);
      rect(context, '#e4eea5', 53, 8, 3, 4);
      rect(context, '#e4eea5', 53, 26, 3, 4);
      rect(context, '#fcffd1', 55, 9, 1, 2);
      rect(context, '#fcffd1', 55, 27, 1, 2);

      if (layer < 12) return;
      rect(context, '#d3e990', 42, 11, 10, 16);
      rect(context, '#a5c479', 43, 13, 8, 12);
      for (const y of [15, 18, 21]) {
        rect(context, '#5f7d4f', 46, y, 4, 1);
      }
      rect(context, '#e2ecaa', 43, 11, 8, 1);
      rect(context, '#88aa62', 11, 10, 7, 2);
      rect(context, '#88aa62', 11, 26, 7, 2);
    }

    function paintCabin(context, layer) {
      const trim = Math.floor((layer - 15) / 3);
      const front = 43 - trim;
      cutRect(context, '#263c39', 16 + trim, 8 + trim, 27 - 2 * trim, 22 - 2 * trim);
      cutRect(context, '#658352', 17 + trim, 9 + trim, 25 - 2 * trim, 20 - 2 * trim);
      rect(context, '#2b5758', 23 + trim, 8 + trim, 14 - 2 * trim, 22 - 2 * trim);
      rect(context, '#478181', 24 + trim, 9 + trim, 11 - 2 * trim, 20 - 2 * trim);
      rect(context, '#78aca0', 25 + trim, 9 + trim, 6, 2);
      rect(context, '#78aca0', 25 + trim, 27 - trim, 6, 2);
      rect(context, '#234748', front - 4, 10 + trim, 4, 18 - 2 * trim);
      rect(context, '#629597', front - 3, 12 + trim, 2, 14 - 2 * trim);
      rect(context, '#a0c3ae', front - 2, 14 + trim, 1, 8 - 2 * trim);
      rect(context, '#395947', 19 + trim, 9 + trim, 2, 20 - 2 * trim);
      rect(context, '#9bb66c', 21 + trim, 8 + trim, 2, 22 - 2 * trim);
      rect(context, '#8aa56b', front - 6, 8 + trim, 2, 22 - 2 * trim);
    }

    function paintRoof(context, layer) {
      const trim = Math.max(0, layer - 23);
      cutRect(context, '#4b6648', 19 + trim, 10 + trim, 22 - 2 * trim, 18 - 2 * trim);
      cutRect(context, '#d5e58f', 20 + trim, 11 + trim, 20 - 2 * trim, 16 - 2 * trim);
      rect(context, '#add174', 22 + trim, 12 + trim, 16 - 2 * trim, 14 - 2 * trim);
      rect(context, '#799c51', 22 + trim, 13 + trim, 3, 12 - 2 * trim);
      rect(context, '#e7efaa', 23 + trim, 12 + trim, 12 - 2 * trim, 1);
      rect(context, '#e7efaa', 23 + trim, 25 - trim, 12 - 2 * trim, 1);
      rect(context, '#566d49', 32, 16, 4, 6);
      rect(context, '#9eb873', 33, 17, 2, 1);
      rect(context, '#9eb873', 33, 20, 2, 1);
    }

    function roverSlice(layer) {
      return bitmap(60, 38, (context) => {
        if (layer < 15) {
          paintChassis(context, layer);
        } else if (layer < 23) {
          paintCabin(context, layer);
        } else if (layer < 26) {
          paintRoof(context, layer);
        } else {
          cutRect(context, '#554a32', 25, 14, 5, 10, 1);
          rect(context, layer === 27 ? '#fce3a6' : '#db954e', 26, 15, 3, 8);
          rect(context, '#f8bf67', 26, 17, 3, 4);
        }
      });
    }

    const rover = Array.from({ length: 28 }, (_, index) => ({
      image: roverSlice(index),
      name:
        index < 3
          ? '底盘'
          : index < 9
            ? '车轮'
            : index < 15
              ? '车身'
              : index < 23
                ? '车窗'
                : index < 26
                  ? '车顶'
                  : '信号灯'
    }));

    return rover;
  }
  function aircraft() {
    const width = 88,
      height = 68;
    function rect(context, color, x, y, w, h) {
      context.fillStyle = color;
      context.fillRect(x, y, w, h);
    }

    // Fill complete pixel runs, so sloping outlines stay crisp on every source image.
    function shape(context, color, points) {
      const top = Math.min(...points.map((point) => point[1]));
      const bottom = Math.max(...points.map((point) => point[1]));
      context.fillStyle = color;
      for (let y = top; y < bottom; y++) {
        const row = y + 0.5;
        const edges = [];
        for (let index = 0; index < points.length; index++) {
          const [x1, y1] = points[index];
          const [x2, y2] = points[(index + 1) % points.length];
          if (row < y1 === row < y2) continue;
          edges.push(x1 + ((row - y1) * (x2 - x1)) / (y2 - y1));
        }
        edges.sort((left, right) => left - right);
        for (let index = 0; index < edges.length; index += 2) {
          const left = Math.round(edges[index]);
          context.fillRect(left, y, Math.round(edges[index + 1]) - left, 1);
        }
      }
    }

    // Each station specifies x, half-width, and the bottom and top occupied layers.
    // Interpolate the outlines to draw the 28 horizontal pixel images.
    const fuselage = [
      [4, 1, 7, 9],
      [15, 4, 4, 12],
      [30, 6.6, 2, 16],
      [47, 7.3, 1, 17],
      [58, 6.4, 2.5, 16],
      [67, 4.5, 5, 14],
      [76, 2.7, 7, 12],
      [86, 0.65, 8.4, 9.7]
    ];
    const engines = [
      [5, 4.3, 1, 11],
      [10, 4.7, 0, 12],
      [19, 5.5, 0, 13.4],
      [36, 5.6, 0.2, 14],
      [48, 5, 1, 13],
      [55, 3.9, 2.2, 10.7],
      [59, 2.8, 3.2, 9.6]
    ];
    const glass = [
      [37, 0.9, 13, 15.7],
      [43, 4.5, 13.5, 19.2],
      [49, 5.3, 14.2, 21.2],
      [54, 5, 14, 21.5],
      [60, 3.8, 13.6, 20],
      [65, 2.5, 12.8, 17.2],
      [68, 0.7, 12.5, 14.3]
    ];

    function profile(stations, x) {
      if (x < stations[0][0] || x > stations[stations.length - 1][0]) return null;
      const i = stations.findIndex((station) => station[0] >= x);
      if (i === 0) return stations[0].slice(1);
      const left = stations[i - 1],
        right = stations[i];
      const t = (x - left[0]) / (right[0] - left[0]);
      return left.slice(1).map((a, k) => a + (right[k + 1] - a) * t);
    }

    function inside(section, offset, z) {
      if (!section) return false;
      const [halfWidth, bottom, top] = section;
      return (offset / halfWidth) ** 2 + ((2 * z - bottom - top) / (top - bottom)) ** 2 <= 1;
    }

    const sections = Array.from({ length: width }, (_, x) =>
      [fuselage, engines, glass].map((stations) => profile(stations, x + 0.5))
    );
    const colors = {
      shell: '#dc7838',
      light: '#ffa75b',
      glint: '#ffd191',
      flank: '#b45831',
      steel: '#586c7b',
      metal: '#879ca4',
      silver: '#c3cfc9',
      chalk: '#e7e1c5',
      white: '#fff1ce',
      under: '#909da0',
      underlight: '#b7c2bb',
      seam: '#64767a',
      gunmetal: '#47585e',
      deep: '#303e46',
      black: '#263640',
      hot: '#ec9354',
      ember: '#ffd494',
      stripe: '#384f59',
      red: '#bc6255',
      green: '#66a994',
      glass: '#45838f',
      glassdark: '#315967',
      reflection: '#95cbc7',
      glintblue: '#d2e1cc'
    };
    const inks = Object.fromEntries(
      Object.entries(colors).map(([name, hex]) => [
        name,
        [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
      ])
    );

    function wingColor(x, y, z) {
      const span = Math.abs(y);
      if (span < 4 || span > 32) return;
      const s = (span - 4) / 28;
      const front = 62 - 34 * s;
      const rear = 18 + 7 * s;
      const chord = (x - rear) / (front - rear);
      if (chord < 0 || chord > 1) return;
      const middle = 8.5 + s * 1.6;
      const half = 0.66 + (1 - s) * (1.1 + 1.8 * Math.sin(chord * Math.PI));
      if (Math.abs(z - middle) > half) return;
      if (span > 30) return y < 0 ? 'red' : 'green';
      if (z < middle - 0.35) {
        if (span > 24 && span < 27) return 'stripe';
        return chord > 0.79 ? 'chalk' : chord < 0.13 ? 'seam' : 'underlight';
      }
      if (span > 25 && span < 28) return 'chalk';
      if (span > 23 && span <= 25) return 'stripe';
      if (chord > 0.9) return 'glint';
      if (chord < 0.12 || (chord < 0.32 && span > 13 && Math.floor(x + s * 5) === 28)) return 'flank';
      if (span > 15 && span < 20 && x >= 36 && x <= 40) {
        if (Math.abs(span - 17.5) + Math.abs(x - 38) <= 2.5) return 'chalk';
      }
      if (span < 14.5 && x > 34) return chord > 0.73 ? 'silver' : 'metal';
      return chord > 0.63 ? 'light' : 'shell';
    }

    function stabilizerColor(x, y, z) {
      const span = Math.abs(y);
      if (span < 7 || span > 22) return;
      const s = (span - 7) / 15;
      const rear = 4 + 2 * s,
        front = 29 - 19 * s;
      if (x < rear || x > front || Math.abs(z - (8 + s * 1.3)) > 1.1 + (1 - s) * 0.65) return;
      if (z < 8.6) return 'under';
      if (span > 18 && span < 21) return 'stripe';
      return x > front - 2 ? 'light' : 'shell';
    }

    function paintCell(x, y, z, sectionsAtX) {
      const a = Math.abs(y);
      const [body, engine, hood] = sectionsAtX;
      let ink = wingColor(x, y, z) || stabilizerColor(x, y, z);
      if (inside(engine, a - 8.1, z)) {
        if (x < 9) {
          const radius = Math.hypot((a - 8.1) / 4.1, (z - 6.2) / 4.6);
          ink = radius < 0.29 ? 'ember' : radius < 0.52 ? 'hot' : radius < 0.83 ? 'black' : 'under';
        } else if (x < 16) {
          ink = Math.floor(x) % 4 === 0 ? 'under' : z < 5 ? 'deep' : 'gunmetal';
        } else if (x > 54 && z < 9.7) {
          ink = Math.abs(a - 8.1) < 2.7 && z > 4 ? 'black' : 'seam';
        } else if (z < 4.6) ink = a > 8.5 ? 'under' : 'gunmetal';
        else if (z < 8) ink = x > 21 && x < 42 && z > 6.4 ? 'stripe' : 'flank';
        else ink = a > 10.5 ? 'flank' : x < 34 ? 'steel' : 'metal';
      }
      if (inside(body, y, z)) {
        if (x > 73) ink = z > 9.8 ? 'silver' : z > 8.4 ? 'metal' : 'steel';
        else if (x > 70 && x <= 72) ink = 'stripe';
        else if (z < 6.8) {
          ink = a < 1.3 && x > 24 && x < 59 ? 'seam' : 'underlight';
          if (((x > 28 && x < 30) || (x > 53 && x < 55)) && a > 1.5) ink = 'seam';
        } else if (z < 9.2) ink = 'steel';
        else if (z < 10.9 && x > 30 && x < 65) ink = 'shell';
        else if (z > 14.2 || a < 2.4) ink = 'silver';
        else ink = 'metal';
        if (x < 30 && z > 12.3 && a < 2.8) ink = x > 19 && x < 22 ? 'silver' : 'steel';
      }
      if (inside(hood, y, z) && z > 14) {
        ink = z < 15.8 || x < 40 ? 'deep' : y > 2.5 ? 'glassdark' : 'glass';
        if (z > 18.2 && y < -0.8 && y > -3.8 && x > 43 && x < 60) ink = 'reflection';
        if (z > 20.1 && x > 48 && x < 52 && y <= 0) ink = 'glintblue';
        if (x > 56 && x < 57.6) ink = z > 18.8 ? 'chalk' : 'gunmetal';
      }
      // The twin fins lean outwards and sweep backwards as their contours rise.
      if (z >= 10) {
        const rise = (z - 10) / 18;
        const center = 8.3 + 5.8 * rise;
        const back = 10 + 1.3 * rise,
          front = 34 - 15.3 * rise;
        if (Math.abs(a - center) < 1.85 - 0.83 * rise && x >= back && x < front) {
          ink = x < back + 2.2 ? 'flank' : 'shell';
          if (z > 24.5) ink = 'chalk';
          else if (z > 21.5) ink = 'stripe';
          else if (x > 17 && x < 20 && z > 16 && z < 19) ink = 'chalk';
          if (x >= front - 1.5) ink = 'light';
        }
      }
      return inks[ink];
    }

    const slices = Array.from({ length: 28 }, (_, layer) => ({
      name:
        layer < 5
          ? '机腹与双发吊舱'
          : layer < 11
            ? '主翼与水平尾翼'
            : layer < 16
              ? '机身与翼根'
              : layer < 22
                ? '座舱与垂尾'
                : '双垂尾顶端',
      image: bitmap(width, height, (context) => {
        const pixels = context.createImageData(width, height);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const ink = paintCell(x + 0.5, y + 0.5 - height / 2, layer + 0.5, sections[x]);
            if (!ink) continue;
            const i = (y * width + x) * 4;
            pixels.data.set(ink, i);
            pixels.data[i + 3] = 255;
          }
        }
        context.putImageData(pixels, 0, 0);
      })
    }));

    // Light the exposed silhouette of each source image, using the neighbouring
    // rows and layers. This same light stays on the same surface in every view.
    const images = slices.map(({ image }) => image.getContext('2d').getImageData(0, 0, width, height));
    function solid(x, y, z) {
      if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= images.length) return 0;
      return images[z].data[(y * width + x) * 4 + 3] ? 1 : 0;
    }
    images.forEach((pixels, z) => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (!pixels.data[i + 3]) continue;
          const dx =
            solid(x - 1, y, z) - solid(x + 1, y, z) + 0.55 * (solid(x - 2, y, z) - solid(x + 2, y, z));
          const dy =
            solid(x, y - 1, z) - solid(x, y + 1, z) + 0.55 * (solid(x, y - 2, z) - solid(x, y + 2, z));
          const dz =
            solid(x, y, z - 1) - solid(x, y, z + 1) + 0.55 * (solid(x, y, z - 2) - solid(x, y, z + 2));
          const length = Math.hypot(dx, dy, dz);
          if (length < 0.01) continue;
          const light = 0.94 + (0.15 * (0.18 * dx - 0.44 * dy + 0.88 * dz)) / length;
          for (let k = 0; k < 3; k++) pixels.data[i + k] *= light;
        }
      }
      slices[z].image.getContext('2d').putImageData(pixels, 0, 0);
    });

    return slices;
  }
  function model(id) {
    const drawings = id === 'rover' ? rover() : aircraft();
    const { width: w, height: h } = drawings[0].image,
      d = drawings.length,
      colors = new Uint32Array(w * h * d);
    drawings.forEach(({ image }, i) => colors.set(new Uint32Array(image.data.buffer), i * w * h));
    return {
      body: createSliceProjector(w, h, d, 1),
      model: { colors, bounds: [0, 0, 0, w, h, d], sheets: [] }
    };
  }
  return { model };
})();
