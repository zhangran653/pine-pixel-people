"""Prepare the optional portrait cutout mask with Pillow, NumPy and OpenCV.
Each portrait is segmented in its own crop using its own paper border.
The RGB source and the masks of the other views never enter that fit.
"""

from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STUDIES = ROOT / "studies" / "turnaround"


def cutout(rgb):
    paper = np.median(np.concatenate([rgb[:, :10], rgb[:, -10:]], axis=1), axis=1)
    contrast = np.max(abs(rgb.astype(float) - paper[:, None, :]), axis=2)
    # Fit the silhouette first; the lightest yarn of the beanie may be very
    # close in colour to the paper, but it belongs inside the outer contour.
    disk = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    rough = cv2.morphologyEx((contrast > 20).astype("uint8"), cv2.MORPH_CLOSE, disk)
    contours, _ = cv2.findContours(rough, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    body = np.zeros_like(rough)
    cv2.drawContours(body, [max(contours, key=cv2.contourArea)], -1, 1, cv2.FILLED)
    inside = cv2.erode(body, disk)
    outside = cv2.dilate(body, disk)
    trimap = np.where(body, cv2.GC_PR_FGD, cv2.GC_PR_BGD).astype("uint8")
    trimap[outside == 0] = cv2.GC_BGD
    trimap[inside > 0] = cv2.GC_FGD
    cv2.setRNGSeed(71)
    cv2.grabCut(
        np.ascontiguousarray(rgb[:, :, ::-1]),
        trimap,
        None,
        np.zeros((1, 65)),
        np.zeros((1, 65)),
        3,
        cv2.GC_INIT_WITH_MASK,
    )
    return np.where(trimap % 2, 255, 0).astype("uint8")


if __name__ == "__main__":
    cv2.setNumThreads(1)
    source = np.asarray(Image.open(ROOT / "animation-turnaround.webp").convert("RGB"))
    sheet = np.zeros(source.shape[:2], dtype="uint8")
    for name in ["smooth-baby", "smooth-adult"]:
        manifest = json.loads((STUDIES / (name + ".json")).read_text())
        for view in manifest["views"]:
            x, y, x1, y1 = view["crop"]
            sheet[y:y1, x:x1] = cutout(source[y:y1, x:x1])
    Image.fromarray(sheet).save(STUDIES / "portrait-alpha.png", optimize=True)
