// Inspect the exposed surfaces of the same posed slice volumes used by both renderers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const context = vm.createContext({ structuredClone });
for (const [,file] of read('index.html').matchAll(/<script defer src="([^"]+)"/g)) {
  if (file === 'world-editor.js') break;
  vm.runInContext(read(file),context,{ filename:file });
}
const { PineLooks:looks, PineMotion:motion } = context;
const season = vm.runInContext('pineSeasonalWardrobe',context);
const sample = structuredClone(looks.templateById.get('look_museumcrew_educator'));
const schema = JSON.parse(read('character-v1.schema.json'));
assert.deepEqual(schema.properties.skirtEase.enum,Object.keys(looks.skirtEaseModes));
assert.equal(schema.properties.skirtEase.default,'fixed');
assert.ok(!('skirtEase' in looks.prepare(sample).recipe));
assert.throws(() => looks.prepare({...sample,skirtEase:'torn'}),/裙围/);
const fitted = looks.prepare({...sample,skirtEase:'flexible'}).recipe;
const borrowed = looks.applyOutfit(structuredClone(sample),looks.outfitFrom(fitted));
assert.equal(borrowed.skirtEase,'flexible');
assert.equal(looks.randomCharacter({source:fitted,locks:['wear'],seed:27}).skirtEase,'flexible');
looks.applyOutfit(borrowed,{parts:{top:'tee'},colors:{}});
assert.equal(borrowed.skirtEase,'flexible');
looks.applyOutfit(borrowed,looks.outfits['cn-qipao']);
assert.ok(!('skirtEase' in borrowed));

function render(action, phase, skirt, ease, age) {
  const doc = structuredClone(age ? looks.templates.find(d => d.base===age) : sample);
  looks.applyOutfit(doc,looks.outfits['cn-qipao']);
  doc.parts.bottom = skirt;
  if (ease) doc.skirtEase = ease;
  // Distinguish skin, cloth and woven trim independently of the native light ramps.
  Object.assign(doc.colors,{skin:'#ff00c3',bottom:'#11885b',accent:'#446fb9'});
  const actor = looks.build(doc), pose = motion.actions.get(action).sample(phase,actor)[0].pose;
  const model = actor.body.makePose(pose);
  return {actor,pose,layer:{body:actor.body,model,x:0,y:0,z:0}};
}
const isSkin = c => (c&255) > 1.6*((c>>>8)&255) && ((c>>>16)&255) > 1.4*((c>>>8)&255);
const isCloth = c => ((c>>>8)&255) > 1.24*(c&255);
function alongLimb(p, start, end) {
  const d = end.map((n,i) => n-start[i]), q = p.map((n,i) => n-start[i]);
  const t = q.reduce((s,n,i) => s+n*d[i],0) / d.reduce((s,n) => s+n*n,0);
  return {t, r:Math.hypot(...q.map((n,i) => n-Math.max(0,Math.min(1,t))*d[i]))};
}
function exposed({actor,pose,layer}, upperLimit=.65) {
  const {body,model} = layer, {nx,ny,density} = body, plane = nx*ny;
  const [x0,y0,z0,x1,y1,z1] = model.bounds, cells = model.colors;
  const top = Math.max(...pose.legs.map(l => l.hip[2]))+.07*actor.rig.height;
  const counts = {thighSkin:0, thighCloth:0, kneeSkin:0, kneeCloth:0, calfSkin:0};
  for (let z=z0; z<z1; z++) {
    const pz = layer.z+(z+.5)/density;
    if (pz>top) break;
    for (let y=y0; y<y1; y++) for (let x=x0; x<x1; x++) {
      const i=z*plane+y*nx+x, c=cells[i];
      if (!c || (cells[i-1] && cells[i+1] && cells[i-nx] && cells[i+nx] && cells[i-plane] && cells[i+plane])) continue;
      const p = [layer.x+(x+.5-nx/2)/density, layer.y+(y+.5-ny/2)/density, pz];
      if (pose.arms.some(arm => alongLimb(p,arm.elbow,arm.hand).r < .055*actor.rig.height)) continue;
      for (const [leg,{hip,knee}] of pose.legs.entries()) {
        const thigh=alongLimb(p,hip,knee), shin=alongLimb(p,knee,pose.feet[leg]);
        if (thigh.t>.25 && thigh.t<upperLimit && thigh.r<.08*actor.rig.height) {
          counts.thighSkin += Number(isSkin(c)); counts.thighCloth += Number(isCloth(c));
        } else if (thigh.t>.76 && thigh.t<1.05 && thigh.r<.08*actor.rig.height &&
            shin.t<.14 && p[0]>knee[0]+.35 && Math.abs(p[1]-knee[1])<.5) {
          counts.kneeSkin += Number(isSkin(c)); counts.kneeCloth += Number(isCloth(c));
        } else if (shin.t>.52 && shin.t<.70 && shin.r<.07*actor.rig.height) {
          counts.calfSkin += Number(isSkin(c));
        }
      }
    }
  }
  return counts;
}
function covered(frame, limit) {
  const counts = exposed(frame,limit);
  assert.equal(counts.thighSkin,0,JSON.stringify(counts));
  assert.ok(counts.thighCloth>12,'expected a visible cloth surface over the moving thigh');
  return counts;
}
for (const ease of ['fixed','flexible']) {
  for (const [action,phase] of [['walk',.2],['run',.41],['squat',.35],['jump',.50]]) {
    const frame = render(action,phase,'qipao-column',ease), counts = covered(frame);
    assert.equal(counts.kneeSkin,0); assert.ok(counts.kneeCloth>2);
    if (action==='jump') {
      const [lower] = motion.figureLayers(frame.actor,frame.pose,frame.layer.model);
      assert.ok(lower.body.density>frame.actor.body.density);
      assert.equal(covered({...frame,layer:lower}).kneeSkin,0);
    }
  }
}
covered(render('climb-stairs',.25,'mamian-skirt'));
covered(render('sit',.50,'yukata-hem'));
covered(render('sit',.42,'qipao-column','fixed','baby'),.50);
covered(render('sit',.42,'highland-kilt','fixed','child'),.50);
const mini = exposed(render('lunge',.33,'pleated-mini'),.48);
assert.equal(mini.thighSkin,0);
assert.ok(mini.calfSkin>10 && mini.kneeSkin>3,'a short hem leaves knees and calves visible');

// The front bridges the space between raised knees. Recolour a stripe on the
// source panel and read a voxel out in that bridge, well clear of either leg.
function bridgePigment() {
  const {actor,pose,layer} = render('jump',.5,'qipao-column');
  const [x,y,z] = pose.legs[0].knee.map((v,i) => (v+pose.legs[1].knee[i])/2);
  const {nx,ny,density} = layer.body;
  const ix = Math.floor(nx/2+(x+.14*actor.rig.thigh)*density);
  const iy = Math.floor(ny/2+y*density);
  return layer.model.colors[(Math.floor(z*density)*ny+iy)*nx+ix];
}
assert.ok(isCloth(bridgePigment()),'the wrap must add fabric between the two legs');
const walk = ease => render('walk',.2,'qipao-column',ease).layer.model.colors;
const open = walk();
assert.deepEqual(open,walk('fixed'));
assert.notDeepEqual(open,walk('flexible'));
// Close only the authored slit as a control. The real vent must reveal some skin.
const skirt = season.skirt;
try {
  season.skirt = (id,t,u,v,fold,k) => t>.25 && t<.90 && u>.5 && Math.abs(v)<.25
    ? k.accent : skirt(id,t,u,v,fold,k);
  const stripe = bridgePigment();
  assert.ok(((stripe>>>16)&255)>1.2*((stripe>>>8)&255),'the new panel must carry its source stripe');
  season.skirt = (id,t,u,v,fold,k) => skirt(id,t,u,v,fold,k) || k.bottom;
  const closed = walk();
  assert.ok(open.some((c,i) => isSkin(c) && isCloth(closed[i])), 'the side slit was sealed');
} finally { season.skirt = skirt; }
console.log('Skirt wraps passed on coarse and fine slices, both fits, open vents, short hems and portable outfits.');
