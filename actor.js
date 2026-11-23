const hikerArt = {
  materials: {
    skin: 'dc9a70', skinLight: 'efb98d', nose: 'dd8b68', cheek: 'e4987e', mouth: '995949',
    hair: '493a39', hairLight: '675047', eye: '2a333a', brow: '5e453f',
    cap: 'cc5946', capLight: 'eb7656', capBand: 'a5483e', capSeam: 'bc5142', capUnder: '813e39',
    jacket: '38877f', jacketShade: '2e726e', jacketLight: '55a597', hem: '345d5d', zipper: '94b7a3',
    pants: '3e526b', pantsLight: '536d80', pantsDark: '354459', cuff: '758994',
    leather: '8c593e', leatherLight: 'b57e50', sole: '50423b', lace: 'd8b684',
    pack: 'd79b45', packShadow: 'a57139', packLight: 'efbc68', buckle: 'e5d4a6',
    strap: '705440', scarf: 'f1d49d', scarfShade: 'cfa676', roll: '8d9a79', rollLight: 'acb897',
    lid: 'a57566'
  },
  paint(pose, { frame, blob, link }, ink) {
    const { feet, arms } = pose;
    const bob = pose.bob ?? 0, blink = Math.max(0, Math.min(1, pose.blink ?? 0));
    const rest = [1,0,0,0, 0,1,0,0, 0,0,1,bob];
    for (let leg = 0; leg < 2; leg++) {
      const side = leg === 0 ? -1 : 1;
      const ankle = feet[leg], { hip, knee } = pose.legs?.[leg] ?? hikerMotion.leg(side, ankle, bob);
      const lift = ankle[2] - 3.1, y = ankle[1];
      link(hip, knee, 2.8, 2.25, .93, (t, u, v) => u > .9 && t > .77 ? ink.pantsLight : side*v < -.9 ? ink.pantsDark : ink.pants);
      link(knee, ankle, 2.29, 1.85, .94, (t, u) => t > .7 && t < .88 ? ink.cuff : u < -.9 ? ink.pantsDark : ink.pants);
      blob(ankle[0]+1.05, y, 1.75+lift, 3.7, 2.22, 1.65, (x, yy, z) =>
        z < lift+1.05 ? ink.sole : x > ankle[0]+2.1 ? ink.leatherLight : ink.leather, 3.4);
      blob(ankle[0]+.05, y, 3.35+lift, 2.05, 2.04, 1.65, (x, yy, z) =>
        x > ankle[0]+1 && z > lift+3.1 && z < lift+3.9 ? ink.lace : ink.leather, 3);
    }
    frame(pose.torso ?? rest);
    blob(-.15, 0, 19.2, 3.95, 5.55, 3.25, ink.pants, 2.8);
    blob(.1, 0, 26.35, 4.32, 6.15, 8.35, (x, y, h) => {
      const a = Math.abs(y);
      if (h < 20.5) return ink.hem;
      if (x > .8 && Math.abs(a - (2.5 + (h-20)*.115)) < .72 && h > 22) return ink.strap;
      if (x > 2 && a < .65) return ink.zipper;
      if (x > 1.9 && a > 1.6 && a < 4.7 && h > 23 && h < 24.1) return ink.hem;
      return x < -.9 ? ink.jacketShade : h > 30.5 ? ink.jacketLight : ink.jacket;
    }, 3.1);
    // Pocket, flap, and bedroll sit on the back; the straps cross the front of the coat.
    blob(-4.75, 0, 26.6, 3.15, 5.05, 6.5, (x, y, h) => {
      if (x < -5.6 && Math.abs(y) < .72 && h > 25.7 && h < 27.6) return ink.buckle;
      if (x < -5.6 && Math.abs(y) < .78 && h > 23.7 && h < 30) return ink.strap;
      return h > 27 ? ink.packLight : Math.abs(y) > 3.85 ? ink.packShadow : ink.pack;
    }, 3.8);
    blob(-5.25, 0, 32.1, 2.15, 6.2, 1.95, (x, y, z) =>
      Math.abs(Math.abs(y)-3.5) < .69 ? ink.strap : z > 32.5 ? ink.rollLight : ink.roll, 3.5);
    frame(null);
    for (const { side, shoulder, elbow, wrist, hand } of arms) {
      link(shoulder, elbow, 2.6, 2.13, .92, (t, u) => u < -.95 ? ink.jacketShade : t < .22 ? ink.jacketLight : ink.jacket);
      link(elbow, wrist, 2.15, 1.7, 1, t => t > .75 ? ink.hem : ink.jacket);
      blob(hand[0], hand[1], hand[2], 1.75, 1.65, 2.25, (x, y) =>
        side*y > 7.6 ? ink.skinLight : ink.skin, 2.7);
    }
    frame(pose.torso ?? rest);
    blob(.4, 0, 34.8, 3.7, 4.75, 1.8, (x, y, z) => z > 34.7 ? ink.scarf : ink.scarfShade, 3);
    blob(3.75, -1.65, 32.35, 1.13, 1.45, 2.85, ink.scarf, 3);
    frame(pose.head ?? rest);
    blob(.8, 0, 39.55, 4.92, 5.65, 5.8, (x, y, h) => {
      const a = Math.abs(y);
      if (x < -.7 || (a > 4.05 && x < 2 && h > 39.8)) return h > 41.5 ? ink.hairLight : ink.hair;
      if (x > 3.25 && Math.abs(a-2.5) < .72) {
        if (h > 40.1 && h < 41.9) {
          if (h < 41.9 - 1.85*blink) return ink.eye;
          return h < 40.95 && blink > .8 ? ink.lid : ink.skin;
        }
        if (h > 42 && h < 43.2) return ink.brow;
      }
      if (x > 3.35 && h > 37.1 && h < 38 && a < 1.8) return ink.mouth;
      if (x > 2.3 && a > 3.3 && h > 38.5 && h < 40) return ink.cheek;
      return x > 2.5 ? ink.skinLight : ink.skin;
    }, 3);
    for (const side of [-1,1]) blob(.55, side*5.48, 39.7, 1.44, 1.04, 1.7, ink.skin);
    blob(5.6, 0, 39.85, 1.65, 1.2, 1.39, (x,y,z) => z > 39.8 ? ink.skinLight : ink.nose);
    blob(-.1, 0, 45.55, 5.75, 6.32, 3.9, (x, y, h) => {
      if (h < 44.8) return ink.capBand;
      if (Math.abs(y) < .65 && h > 47) return ink.capSeam;
      return x > 1.3 ? ink.capLight : ink.cap;
    }, 2.45);
    blob(4.6, 0, 44.2, 4.15, 5.92, .98, (x,y,z) => z > 44 ? ink.capLight : ink.capUnder, 2.8);
    blob(-.35, 0, 49.2, 1.28, 1.4, .92, ink.capBand);
  },
};
const hikerActor = createSliceActor(hikerArt);
