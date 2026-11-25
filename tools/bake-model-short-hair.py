"""Fit the cropped and side-part cuts to the four views in figure-model-guide.webp.
Run with Pillow and NumPy. The embedded chart records radial thickness and dye
levels around each horizontal section; it contains no camera-facing sprites.
"""
import base64
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ROWS, ANGLES = 90, 144
LOW, HIGH = -.66, 1.43
GUIDE = Image.open(ROOT / "figure-model-guide.webp").convert("RGB")
RGB = np.asarray(GUIDE).astype(float)
SOFT = np.asarray(GUIDE.filter(ImageFilter.GaussianBlur(.66))).astype(float)
LUMA = SOFT @ np.array([.36, .47, .17])
# Front, three-quarter, profile and back. The hairline landmarks are an upper
# bound on strand length, keeping brows, ears and eyes out of the hair material.
FRONT = [(-74,84),(-42,87),(-35,84),(-29,72),(-21,65),(-9,61),(0,53),(10,53),(20,66),(29,71),(34,82),(44,86),(74,85)]
OBLIQUE = [(-75,105),(-41,106),(-28,117),(-20,118),(-20,82),(-11,76),(0,85),(7,85),(9,70),(20,64),(31,55),(37,56),(44,76),(75,82)]
PROFILE = [(-75,112),(-28,117),(-15,118),(-14,81),(-7,75),(0,78),(10,88),(15,87),(16,73),(24,68),(35,64),(43,51),(49,52),(54,74),(75,75)]
BACK = [(-75,82),(-48,83),(-37,95),(-23,110),(0,118),(23,111),(37,95),(48,83),(75,82)]
VIEWS = [(0, FRONT),(-45, OBLIQUE),(-90, PROFILE),(180, BACK)]
CUTS = {
    "part": (0, [243, 571, 878, 1207], [0, 0, 2, 0], 79),
    "crop": (490, [241, 565, 870, 1206], [0, 1, 1, 0], 80),
}

def bake(config):
    top, centers, offsets, eye = config
    views = []
    for i, (angle, landmarks) in enumerate(VIEWS):
        # Align the minimum and maximum of each hair cap with the head radii.
        x = centers[i]
        sub = RGB[top:top+123, x-75:x+76]
        r, g, b = sub.transpose(2,0,1)
        solid = (g < 145) & (b < 138)
        hair = (r < 159) & (g < 123) & (r-g < 61) & (b < 121)
        dx = np.arange(-75,76)
        limit = np.interp(dx, *np.asarray(landmarks).T) + offsets[i]
        if top and i < 3:
            limit = limit + 2
        hair &= np.arange(123)[:,None] <= limit
        values = LUMA[top:top+123, x-75:x+76]
        # A sparse highlight and a broad midtone survive a dark or a pale hair dye.
        levels = np.quantile(values[hair], [.10,.24,.40,.60,.75,.88,.97])
        ink = 1 + np.searchsorted(levels, values)
        a = np.deg2rad(angle)
        views.append((solid, hair, ink, np.cos(a), np.sin(a)))

    envelope=[]
    kernel = np.exp(-.5*(np.arange(-4,5)/1.65)**2)
    kernel /= kernel.sum()
    for solid,*_ in views:
        ranges=[]
        for line in solid:
            xs=np.flatnonzero(line)
            ranges.append((xs[0]-75,xs[-1]-75) if xs.size else (0,0))
        values=np.asarray(ranges,dtype=float)
        envelope.append(np.array([np.convolve(np.pad(side,4,mode='edge'),kernel,mode='valid')
            for side in values.T]).T)
    result = bytearray()
    angles = np.arange(ANGLES) * 2 * np.pi / ANGLES
    ca, sa = np.cos(angles), np.sin(angles)
    for j in range(ROWS):
        z = LOW + (j+.5) / ROWS * (HIGH-LOW)
        max_radius = np.zeros(ANGLES)
        dye = np.zeros(ANGLES)
        y = [int(round(eye + offsets[i] + (.13-z)*58)) for i in range(4)]
        if all(0 <= n < 123 for n in y):
            edges = [envelope[i][y[i]] for i in range(4)]
            # The guide's profile and front sections specify an asymmetric oval.
            # Move its centre as the whorl leans across the crown.
            x0, x1 = np.array(edges[2])/47.5
            y0, y1 = np.array(edges[0])/47.8
            cx, cy = (x0+x1)/2, (y0+y1)/2
            rx, ry = max(.001,(x1-x0)/2), max(.001,(y1-y0)/2)
            rad = 1 / np.sqrt((ca/rx)**2 + (sa/ry)**2)
            for i, (_,_,_, co,si) in enumerate(views):
                # Intersect the diagonal silhouette with the oval.
                axis = -ca*si*47.5 + sa*co*47.8
                middle = -cx*si*47.5 + cy*co*47.8
                lo, hi = edges[i]
                limit = (np.where(axis>0,hi+1,lo-1)-middle)/np.where(abs(axis)<.001,1,axis)
                rad = np.where(abs(axis)>.001,np.minimum(rad,np.maximum(.004,limit)),rad)
            px, py = cx + ca*rad*.98, cy + sa*rad*.98
            weight = np.zeros(ANGLES)
            coverage = np.zeros(ANGLES)
            for i, mirrored in [(0,False),(1,False),(2,False),(3,False),(2,True),(1,True)]:
                # The opposite side uses the profile's own ear. Both ends of the
                # turn still meet the original asymmetric front and back drawings.
                co, si = views[i][-2:]
                if mirrored: si=-si
                column = -px*si*47.5 + py*co*47.8
                if mirrored: column = -column
                col = np.clip(np.rint(75+column).astype(int),0,150)
                surface = np.maximum(0,ca*co + sa*si)**7
                hair = views[i][1][y[i],col]
                weight += surface
                coverage += surface * hair
                dye += surface * hair * views[i][2][y[i],col]
            fade = np.minimum(1, np.maximum(.0,(z-.47)/.61))
            keep = (coverage > weight*.43) & (rad>.09)
            # All views have skin, neck and eye outlines with the same dark ink as
            # hair. Use a continuous forehead opening and a crown interior.
            open_brow = .14 + .35 * np.sqrt(np.maximum(0,ca)) + .065 * np.maximum(0,sa) * np.maximum(0,ca)
            keep &= (ca<.28) | (z>open_brow)
            keep |= (z>.86) & (rad>.19)
            # Recess valleys between locks in the silhouette and preserve a dark
            # underside at the parted fringe. Chart radii refer to the moving centre.
            dye = np.rint(dye/np.maximum(coverage,.0001)).clip(1,8)
            max_radius = np.where(keep,rad*(.976+.0063*dye)+.035*fade,0)
        else: cx=cy=0
        result.extend([int(np.clip(round(cx*80+128),0,255)),int(np.clip(round(cy*80+128),0,255))])
        for radius, color in zip(max_radius,dye):
            result.extend([int(np.clip(round(radius*150),0,255)),int(color) if radius>0 else 0])
    # A drawn strand has a connected underside. Fill ink-sized gaps along a
    # strand and soften row-to-row pen noise without rounding off its silhouette.
    table = np.frombuffer(result, dtype=np.uint8).copy().reshape(ROWS,-1)
    field = table[:,2:].reshape(ROWS,ANGLES,2)
    height = LOW+(np.arange(ROWS)+.5)*(HIGH-LOW)/ROWS
    for col in range(ANGLES):
        radius, tones = field[:,col,:].T
        hits = (radius>0).astype(int)
        sustained = np.flatnonzero(np.convolve(hits,np.ones(6,dtype=int),'valid')>=5)
        if not sustained.size: continue
        start = sustained[0]
        positions = np.flatnonzero(hits)
        top = positions[-1]+1
        radius0 = np.interp(np.arange(start,top),positions,radius[positions])
        ink0 = np.interp(np.arange(start,top),positions,tones[positions])
        radius[start:top] = np.rint(np.convolve(np.pad(radius0,(2,2),mode='edge'),
            [.10,.22,.36,.22,.10],'valid'))
        tones[start:top] = np.rint(np.convolve(np.pad(ink0,(1,1),mode='edge'),[.2,.6,.2],'valid'))
        field[:start,col] = 0
    # Four turns of the brush lift the broad illustrated locks off the fitted
    # cap. Roots follow the surface; the free ends erase to a single point.
    # Entries are (root bearing, tip bearing, root/tip heights, half-width, lift).
    locks = [(17,-44,1.04,.48,19,.105),(-55,-94,.91,.40,17,.145),
             (63,98,.88,.44,14,.12),(129,159,.70,.13,19,.105),
             (-117,-144,.71,.06,16,.105)]
    if top: locks = [(-34,-5,1.12,.52,16,.12),(3,38,1.17,.59,14,.11),
                     (-54,-96,.91,.42,17,.15),(47,89,.90,.39,18,.145),
                     (112,153,.73,.12,19,.105),(-110,-151,.77,.12,19,.11)]
    surface = field.copy()
    for start, end, root, tip, half, lift in locks:
        for j,h in enumerate(height):
            t=(root-h)/(root-tip)
            if not (0<t<1): continue
            swing = np.sin(np.pi*t)
            center=start+(end-start)*(t*t*(3-2*t)) + 9*np.sign(end-start)*swing
            width=half*(.28+.72*np.sin(np.pi*t)**.65)*(1-.72*t**3)
            delta=(np.rad2deg(angles)-center+180)%360-180
            band=abs(delta)<width
            occupied=np.flatnonzero(surface[j,:,0]>0)
            if occupied.size<2: continue
            sw=delta[band]/width
            skin=np.interp(np.flatnonzero(band),occupied,surface[j,occupied,0],period=ANGLES)
            lift_r=150*lift*swing*(1-sw**2)**.65
            field[j,band,0]=np.maximum(field[j,band,0],np.rint(skin+lift_r).clip(1,255))
            shade=np.where(sw>.72,2,np.where((sw<-.08)&(sw>-.62)&(t>.17)&(t<.56),6,4))
            field[j,band,1]=np.where(t>.9,2,shade)
    return table.tobytes()

def pack(data):
    # Pack frequent repeats of the same adjacent radius/ink pair with a short run.
    result = bytearray()
    p = 0
    while p < len(data):
        n=1
        while n<255 and data[p:p+2]==data[p+n*2:p+n*2+2]: n+=1
        result.extend([n,*data[p:p+2]])
        p+=n*2
    return base64.b64encode(result).decode()

generated = ["// Generated by tools/bake-model-short-hair.py from figure-model-guide.webp.",
             "const pineModelShortCuts = {"]
for name, cfg in CUTS.items():
    data=pack(bake(cfg))
    lines=[repr(data[i:i+128]) for i in range(0,len(data),128)]
    generated.append("  "+name+": [\n    "+",\n    ".join(lines)+"\n  ].join(''),")
generated.append("};\n")
target=ROOT/"short-hair.js"
head=target.read_text().split("// Generated by tools/bake-model-short-hair.py")[0].rstrip()
target.write_text(head+"\n\n"+"\n".join(generated))
