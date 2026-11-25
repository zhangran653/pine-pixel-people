"""Rebuild the 2D, 16-colour portrait study. Dependencies: Pillow and NumPy.

Run from any directory: python tools/compare_portrait_pixelization.py
The source is the smooth, three-view infant portrait in animation-turnaround.webp.
Each output uses its own photographed/rendered view, including 45 degrees. Only
the front and profile contribute samples to the learned palette. Eye and mouth
landmarks and the alternate 16-slot material palette are hand-authored below.
This is a colour and sampling experiment, independent of the slice reconstructor.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TARGET = (52, 45)
VIEWS = ("正面", "斜面 45°", "侧面")
EYES = (((206, 224), (327, 223)), ((267, 220), (356, 219)), ((331, 219),))
MOUTHS = ((270, 299), (318, 300), (374, 294))
# Background, three knits, two shirt tones, six skin tones, two dark hair/eye
# tones, an eye highlight and a lip tone. This palette applies to this sitter.
MATERIAL_PALETTE = np.array([
    [209, 184, 164], [143, 117, 98], [194, 164, 139], [231, 203, 177],
    [52, 63, 59], [93, 107, 99], [85, 46, 29], [125, 64, 39],
    [160, 83, 50], [183, 109, 68], [203, 129, 83], [219, 153, 106],
    [48, 28, 21], [91, 54, 34], [246, 225, 198], [151, 71, 53],
], dtype=np.uint8)


def lab_from_rgb(rgb):
    v = rgb.astype(np.float32) / 255
    linear = np.where(v > .04045, ((v + .055) / 1.055) ** 2.4, v / 12.92)
    matrix = [[.4124564, .3575761, .1804375], [.2126729, .7151522, .0721750],
              [.0193339, .1191920, .9503041]]
    xyz = np.einsum('...c,jc->...j', linear, matrix) / [0.95047, 1, 1.08883]
    f = np.where(xyz > (6 / 29) ** 3, np.cbrt(xyz), xyz / (3 * (6 / 29) ** 2) + 4 / 29)
    return np.stack((116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]),
                     200 * (f[..., 1] - f[..., 2])), axis=-1)


def shared_palette(views):
    samples = []
    for i in (0, 2):
        rgb = views[i]
        samples.append(rgb[::5, ::5].reshape(-1, 3))
        for x, y in EYES[i]:
            samples.append(rgb[y-21:y+20, x-28:x+30:2].reshape(-1, 3))
        x, y = MOUTHS[i]
        samples.append(rgb[y-10:y+10, x-18:x+19:2].reshape(-1, 3))
    samples = np.concatenate(samples)
    ids = np.linspace(0, len(samples)-1, 10000, dtype=int)
    tile = Image.fromarray(samples[ids].reshape(100, 100, 3))
    learned = tile.quantize(colors=16, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    return np.array(learned.getpalette()[:48], dtype=np.uint8).reshape(16, 3)


def nearest_lab(lab, colors):
    # One colour at a time keeps the high-resolution sampling pass small.
    best = np.full(lab.shape[:-1], np.inf)
    labels = np.zeros(best.shape, np.uint8)
    for i, swatch in enumerate(colors):
        error = np.square(lab - swatch).sum(axis=-1)
        better = error < best
        labels[better] = i
        best[better] = error[better]
    return labels


def pixelize(rgb, palette, eyes, protect):
    width, height = TARGET
    source = Image.fromarray(rgb)
    if protect:
        source = source.filter(ImageFilter.MedianFilter(7))
    colors = lab_from_rgb(palette)
    averaged = np.array(source.resize(TARGET, Image.Resampling.BOX))
    labels = nearest_lab(lab_from_rgb(averaged), colors)
    if not protect:
        return palette[labels]

    # Retain a dominant surface colour inside each footprint. Mixed cells keep
    # the original local average when no cluster covers enough of their area.
    cell = 8
    grid = np.array(source.resize((width * cell, height * cell), Image.Resampling.BOX))
    subpixels = nearest_lab(lab_from_rgb(grid), colors).reshape(height, cell, width, cell)
    coverage = np.stack([(subpixels == i).mean(axis=(1, 3)) for i in range(len(colors))], axis=-1)
    labels = np.where(coverage.max(axis=-1) > .43, coverage.argmax(axis=-1), labels)
    lab = colors[labels].copy()
    light = lab[..., 0]
    neighbours = np.lib.stride_tricks.sliding_window_view(np.pad(light, 1, mode='edge'), (3, 3))
    rim = (neighbours.max(axis=(-1,-2)) - light > 21) & (light > 12)
    light[rim] -= 10
    labels = nearest_lab(lab, colors)

    # One marked eye may keep one highlight if it has enough dark pixels around
    # its original pupil. The 45-degree input has its own annotated eye points.
    highlight = np.square(colors - [85, 5, 18]).sum(axis=-1).argmin()
    for x, y in eyes:
        cx, cy = round(x * width / source.width), round(y * height / source.height)
        if rgb[y, x].mean() >= 125:
            continue
        region = labels[cy-2:cy+3, cx-2:cx+3]
        dark = np.argwhere(colors[region, 0] < 29)
        if len(dark) >= 3:
            iy, ix = min(dark, key=lambda p: (abs(p[0]-2) + abs(p[1]-2), p[0]-p[1]))
            region[iy, ix] = highlight
    return palette[labels]


def render_sheet(font_file, output):
    with Image.open(ROOT / 'animation-turnaround.webp') as sheet:
        views = [np.array(sheet.crop((i*512, 0, (i+1)*512, 444)).convert('RGB')) for i in range(3)]
    learned = shared_palette(views)
    panel = (208, 180)  # Integer 4x nearest-neighbour enlargement of each 52x45 output.
    margin, gap, top = 16, 12, 83
    row_height = panel[1] + 32
    width = 2 * margin + 4 * panel[0] + 3 * gap
    board = Image.new('RGB', (width, top + 3 * row_height + 70), '#f3efe5')
    draw = ImageDraw.Draw(board)
    font = lambda size: ImageFont.truetype(str(font_file), size)
    draw.text((margin, 9), '从非像素头像到 16 色像素', font=font(25), fill='#273c31')
    headings = ('非像素源图', '区域平均后量化', '同色票，保护轮廓与眼部', '按材质分配 16 色')
    for j, title in enumerate(headings):
        draw.text((margin + j * (panel[0] + gap), 51), title, font=font(16), fill='#334e3d')
    for i, rgb in enumerate(views):
        y = top + i * row_height
        art = [Image.fromarray(rgb).resize(panel, Image.Resampling.LANCZOS)]
        for palette, protect in ((learned, False), (learned, True), (MATERIAL_PALETTE, True)):
            sprite = pixelize(rgb, palette, EYES[i], protect)
            art.append(Image.fromarray(sprite).resize(panel, Image.Resampling.NEAREST))
        for j, frame in enumerate(art):
            board.paste(frame, (margin + j * (panel[0] + gap), y))
        draw.text((margin, y + panel[1] + 3), VIEWS[i], font=font(15), fill='#4b5c50')
    y = top + 3 * row_height
    draw.text((margin, y), '每种方法输出 52 × 45 像素，最多 16 色。第 2、3 列共用从正面与侧面抽取的色票。', font=font(15), fill='#425a48')
    draw.text((margin, y+26), '每行使用对应源图。眼区为手动标定，第 4 列为这名角色的衣料、肤色与五官手动留色。', font=font(15), fill='#425a48')
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output, 'WEBP', lossless=True, method=6)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT/'studies/turnaround/pixel-translation.webp')
    parser.add_argument('--font', type=Path, help='font with simplified Chinese glyphs')
    args = parser.parse_args()
    fonts = [args.font, Path('/System/Library/Fonts/Hiragino Sans GB.ttc'),
             Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),
             Path('C:/Windows/Fonts/msyh.ttc')]
    chosen = next((path for path in fonts if path and path.is_file()), None)
    if not chosen:
        parser.error('Pass --font with a Chinese font, such as Noto Sans CJK.')
    render_sheet(chosen, args.output)


if __name__ == '__main__':
    main()
