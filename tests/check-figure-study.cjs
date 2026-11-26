// Check the real comparison page in an isolated Chrome profile. Pass --bench to time
// pose sampling and orthographic projection on the same character, camera and machine.
const assert = require('node:assert/strict');
const { readFileSync, writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const { resolve, join, sep } = require('node:path');
const { pathToFileURL } = require('node:url');

function loadDraft(pack) {
  const query = new URLSearchParams(location.search);
  if (query.has('recipe-pair')) {
    const url = new URL(location.href);
    url.hash = new URLSearchParams({character:JSON.stringify(pineFigureModels['baby02-profile']),partner:JSON.stringify(pineFigureModels['baby02-source'])});
    history.replaceState(null,'',url);return;
  }
  if (query.has('garment-hem')) {
    const doc=PineLooks.withGarmentStudy(pineFigureModels.adult), top=query.get('garment-hem');
    Object.assign(doc.parts,{top:'oxford',bottom:'trousers',shoes:'loafers',neck:'none',hat:'none'});
    doc.bodyFinish='painted';doc.garmentFit={top,legs:{tucked:'tapered',bloused:'straight',straight:'wide'}[top]};
    const url=new URL(location.href);url.hash=new URLSearchParams({character:JSON.stringify(doc)});
    history.replaceState(null,'',url);return;
  }
  if (query.has('garment-draft')) {
    const doc=PineLooks.randomCharacter({base:'child',seed:12,release:PineLooks.garmentRelease,bodyFinish:'painted'});
    doc.parts.bottom='trousers'; doc.garmentFit={top:'bloused',legs:'wide'}; doc.face.restExpression='warm';
    const url=new URL(location.href);url.hash=new URLSearchParams({character:JSON.stringify(doc)});
    history.replaceState(null,'',url);return;
  }
  if (query.has('acting-draft')) {
    const doc=PineLooks.randomCharacter({base:'baby',seed:12,release:PineLooks.expressionRelease,bodyFinish:'painted'});
    doc.face.restExpression='warm'; doc.shape.crownHeight=.76; doc.clothingCut='original';
    const url=new URL(location.href);url.hash=new URLSearchParams({character:JSON.stringify(doc)});
    history.replaceState(null,'',url); return;
  }
  if (query.has('ratio-draft')) {
    const doc=PineLooks.randomCharacter({base:'baby', seed:12, release:PineLooks.figureRatioRelease});
    Object.assign(doc.shape,{headScale:.96, crownHeight:.76, trunkLength:1.24, noseLipSpacing:1.13});
    doc.clothingCut='original';
    const url=new URL(location.href);
    url.hash=new URLSearchParams({character:JSON.stringify(doc)});
    history.replaceState(null,'',url);
    return;
  }
  if (query.has('feature-seed')) {
    const release=query.has('acting-profile') ? PineLooks.expressionRelease : query.has('ratio-test') || query.has('ratio-profile') ? PineLooks.figureRatioRelease : PineLooks.featureStudyRelease;
    const base=query.get('sample-age') || 'baby';
    let h = 2166136261;
    for (const c of 'pine/figure-holdout/'+release+'/'+base+'/'+query.get('feature-seed')) h=Math.imul(h^c.charCodeAt(0),16777619);
    const doc=PineLooks.randomCharacter({base,seed:Math.imul(h^(h>>>16),2246822507)>>>0,
      release,bodyFinish:'painted'});
    const url=new URL(location.href);
    url.hash = new URLSearchParams({character:JSON.stringify(doc)});
    history.replaceState(null,'',url);
    return;
  }
  if (!query.has('draft-test')) return;
  const doc = PineLooks.withGameFace(pineFigureModels.baby);
  doc.id = 'look_unsaved_sitter';
  doc.label = '未入库的小芽';
  doc.face.style = 'manga';
  doc.face.form = 'round';
  doc.face.formMix = .63;
  doc.bodyFinish = 'painted';
  doc.colors.top = '#925f78';
  doc.parts.hat = pack.id + '/' + pack.parts[0].id;
  doc.packs[pack.id] = pack.release;
  doc.embeddedPacks = [pack];
  const partner = { ...pineFigureModels.adult, label: '搭档小安' };
  const url = new URL(location.href);
  url.hash = new URLSearchParams({ character: JSON.stringify(doc), partner: JSON.stringify(partner) });
  history.replaceState(null, '', url);
}

// Compare the public face presets on identical joint transforms and an integer-anchored camera.
function measureFacePixels(edition) {
  try {
    const drawn = edition === 'bases', rows = [];
    const forms = drawn ? ['balanced','angular','round','long'] : ['balanced','angular'];
    for (const age of drawn ? ['adult','child','toddler','baby'] : ['adult','child','baby']) {
      const doc = drawn ? PineLooks.withBaseFace(pineFigureModels[age],'balanced') : PineLooks.withGameFace(pineFigureModels[age]);
      doc.bodyFinish = 'painted';
      const base = PineLooks.build(doc);
      const sample = PineMotion.actions.get('idle').sample(.17, base)[0];
      const faces = forms.map(form => {
        const actor = PineLooks.build({ ...doc, face:{ ...doc.face, form, formMix:1 } });
        for (const field of Object.keys(base.rig)) {
          // The lip contact point follows the sculpted mouth, for actions such as drinking.
          if (field !== 'mouth' && JSON.stringify(actor.rig[field]) !== JSON.stringify(base.rig[field]))
            throw Error('Face preset moved ' + age + ' joint or body measure: ' + field);
        }
        const body = actor.body, model = body.makePose(sample.pose);
        const part = { ...sample, actor, body, model, x:0, y:0, heading:0 };
        return studioPortraitLayers([part], PineMotion, PineMotion.figureLayers) || [part];
      });
      const high = Math.max(...faces[0].map(p => p.z + p.model.bounds[5] / p.body.density));
      const low = Math.min(...faces[0].map(p => p.z + p.model.bounds[2] / p.body.density));
      for (const size of [64,128]) for (const bearing of [0,315,270]) {
        const scale = size / (high-low), yaw = bearing * Math.PI / 180;
        const images = faces.map(bands => {
          const c = document.createElement('canvas');
          c.width = 256; c.height = 176;
          const ctx = c.getContext('2d', { willReadFrequently:true });
          for (const p of bands) {
            const x = -Math.sin(yaw)*p.x + Math.cos(yaw)*p.y;
            p.body.draw(ctx,p.model,128+scale*x,161-scale*p.z,yaw-p.heading,0,scale);
          }
          return new Uint32Array(ctx.getImageData(0,0,c.width,c.height).data.buffer);
        });
        for (let pair=0; pair<images.length; pair+=2) {
          const a=images[pair], b=images[pair+1];
          let changed = 0, outline = 0;
          for (let i=0; i<a.length; i++) {
            if (a[i] !== b[i]) changed++;
            if (((a[i] >>> 24) >= 128) !== ((b[i] >>> 24) >= 128)) outline++;
          }
          if (drawn && pair===2 && !outline) throw Error('The two bases share a silhouette at ' + [age,size,bearing]);
          rows.push({ age,size,bearing,...(drawn ? {from:forms[pair],to:forms[pair+1]} : {}),changed,outline });
        }
      }
    }
    document.getElementById('qa').textContent = JSON.stringify(rows);
  } catch (err) { document.getElementById('qa').textContent = 'FAIL ' + err.stack; }
}

function measureClothingPixels() {
  const get = id => document.getElementById(id);
  function set(id,value) {
    get(id).value = String(value);
    get(id).dispatchEvent(new Event(id==='bearing' || id==='phase' ? 'input' : 'change'));
  }
  try {
    const rows = [];
    for (const subject of ['adult','adult-female','baseline-4','baseline-2','chef','child-6','toddler','baby']) {
      set('subject',subject);
      for (const size of [64,128]) {
        set('sample-size',size);
        for (const action of ['idle',subject==='baby' ? 'baby-reach' : 'walk']) {
          set('action',action);
          set('phase',action==='idle'?17:43);
          const outline = [];
          for (const bearing of [0,315,270,180]) {
            set('bearing',bearing);
            const data = ['canvas-a','canvas-b'].map(id=>{
              const c=get(id);
              return c.getContext('2d').getImageData(0,0,c.width,c.height).data;
            });
            let count=0;
            for (let i=3; i<data[0].length; i+=4) if ((data[0][i]>=128)!==(data[1][i]>=128)) count++;
            outline.push(count);
          }
          if (outline.some(count=>!count)) throw Error('Identical cut at game scale: '+[subject,size,action,outline]);
          rows.push({subject,size,action,outline});
        }
      }
    }
    get('qa').textContent=JSON.stringify(rows);
  } catch (e) { get('qa').textContent='FAIL '+e.stack; }
}

function check(studyBench) {
  const $ = id => document.getElementById(id);
  const expect = (v, m) => { if (!v) throw Error(m); };
  const choose = (id, choice) => {
    $(id).value = choice;
    $(id).dispatchEvent(new Event('change'));
  };
  const turn = degree => document.querySelector('[data-angle="' + degree + '"]').click();
  const canvas = $('canvas-b');
  const picture = () => canvas.toDataURL();
  const linkedRecipe = side => JSON.parse(new URLSearchParams(new URL($('edit-' + side).href).hash.slice(1)).get('character'));
  try {
    const query = new URLSearchParams(location.search);
    if (query.has('chin-edge')) {
      const before = linkedRecipe('a'), after = linkedRecipe('b');
      expect(after.faceSurface === 'contour' && JSON.stringify({...after,faceSurface:'linked'}) === JSON.stringify(before),
        'chin and corner studies must compare one identity');
      choose('sample-size','256');
      const sides = [];
      for (const angle of [270,90]) {
        $('bearing').value=String(angle);
        $('bearing').dispatchEvent(new Event('input'));
        const rasters = ['a','b'].map(id=>{
          const el = $('canvas-'+id);
          return el.getContext('2d').getImageData(0,0,el.width,el.height);
        });
        $('face-marks').click();
        const excursions = rasters.map((plain,i)=>{
          const el = $('canvas-'+(i?'b':'a')), w = plain.width;
          const marked = el.getContext('2d').getImageData(0,0,w,el.height).data;
          let lipRow = -1;
          for (let p=0;p<marked.length;p+=4) if (marked[p]===255 && marked[p+1]===114 && marked[p+2]===167)
            lipRow = Math.max(lipRow,Math.floor(p/(4*w)));
          expect(lipRow>=0,'missing mouth reference');
          function forward(row) {
            let edge = -Infinity;
            for (let x=0;x<w;x++) if (plain.data[4*(row*w+x)+3]>=128)
              edge = Math.max(edge,angle===270 ? x : -x);
            return edge;
          }
          const underLip = Math.min(...[2,3,4,5].map(d=>forward(lipRow+d)));
          const pad = Math.max(...[6,7,8].map(d=>forward(lipRow+d)));
          return Math.max(0,pad-underLip);
        });
        $('face-marks').click();
        sides.push(excursions);
      }
      if (query.get('seed')==='2602') {
        expect(sides.every(([a,b])=>a>=2 && b<a),'hook still present in the rendered sides '+JSON.stringify(sides));
        const rest = picture();
        choose('action','open-mouth');
        expect(picture()!==rest && $('face-marks').hidden,'jaw action did not reach the contour');
      }
      $('qa').textContent = JSON.stringify({seed:query.get('seed'),profileRebound:sides});
      return;
    }
    function verifyWholePair(stable,trial,age,seed) {
      const drawn = PineLooks.randomCharacter({base:age,seed,ink:'auto',bodyFinish:'painted'});
      expect(stable.packs[PineLooks.core] === '1.18.0' && stable.id === trial.id &&
        trial.faceSurface === 'linked', 'unexpected whole-figure pair');
      const normalized = doc => JSON.stringify(PineLooks.prepare(doc).recipe);
      expect(normalized(drawn) === normalized(trial),'candidate did not replay the editor generator');
      expect(JSON.stringify(stable.parts) === JSON.stringify(trial.parts) &&
        JSON.stringify(stable.colors) === JSON.stringify(trial.colors),'wardrobe or dyes changed between versions');
    }
    if (query.has('ensemble-pair')) {
      const stable = linkedRecipe('a'), trial = linkedRecipe('b'), age = query.get('age');
      verifyWholePair(stable,trial,age,Number(query.get('seed')));
      const clip = age === 'baby' ? 'baby-reach' : 'walk';
      if (studyBench === 'ensemble') {
        $('qa').textContent = JSON.stringify({age,clip,...measureClip(stable,trial,clip)});
      } else {
        const standing = picture();
        choose('action',clip);
        expect(standing !== picture(),'action did not update the complete candidate');
        $('qa').textContent = age+' complete pair reproduced seed '+query.get('seed');
      }
      return;
    }
    if (query.has('ensemble-review')) {
      expect($('edit-b').hidden && !$('edit-b').hasAttribute('href') && $('results').hidden,'blind recipe leaked');
      // A throwaway browser profile checks the voting/export flow, with no human votes.
      for (let n = 0; n < 32; n++) document.querySelector('[data-vote="tie"]').click();
      expect(!$('results').hidden && $('progress').textContent.includes('32 / 32'),'incomplete review');
      let report;
      const originalBlob = window.Blob, originalClick = HTMLAnchorElement.prototype.click;
      try {
        window.Blob = class extends originalBlob { constructor(parts,opts) { super(parts,opts); report=JSON.parse(parts[0]); } };
        HTMLAnchorElement.prototype.click = () => {};
        $('export').click();
      } finally { window.Blob = originalBlob; HTMLAnchorElement.prototype.click = originalClick; }
      expect(report.review === 'ensemble' && report.pairs.length === 32,'incomplete replay data');
      for (const age of ['adult','child','toddler','baby']) {
        const agePairs = report.pairs.filter(row=>row.base === age);
        expect(agePairs.length === 8 && agePairs.filter(row=>row.a === '1.18.0').length === 4,'unbalanced sides');
      }
      for (const row of report.pairs.slice().reverse()) {
        const a = linkedRecipe('a'), b = linkedRecipe('b');
        expect(a.packs[PineLooks.core] === row.a && b.packs[PineLooks.core] === row.b,'reported sides differ');
        const [stable,trial] = row.a === '1.18.0' ? [a,b] : [b,a];
        verifyWholePair(stable,trial,row.base,row.seed);
        if (!$('prev').disabled) $('prev').click();
      }
      $('qa').textContent = '32 full-figure seeds replayed with paired wardrobe and balanced hidden sides';
      return;
    }
    if (query.has('mouth-turn')) {
      const left = linkedRecipe('a'), right = linkedRecipe('b');
      expect(right.faceSurface === 'linked' && JSON.stringify(PineLooks.withoutFaceSurface(right)) === JSON.stringify(left),
        'The mouth comparison must differ only in its supporting surface');
      expect(!$('face-marks').hidden,'missing face landmarks');
      const unmarked = picture();
      $('face-marks').click();
      expect(unmarked !== picture() && !$('face-key').hidden,'missing landmark projection');
      $('face-marks').click();
      expect(unmarked === picture(),'switching off landmarks must return the original pixels');
      const original = globalThis.createSliceActor, rows = [], regular = [];
      const lips = new Set(['lipLine','lipBody','lipGlow','lipPetal','upperLip','lowerLip']);
      function width(el) {
        const w = el.width, data = el.getContext('2d').getImageData(0,0,w,el.height).data;
        let lo = w, hi = -1;
        for (let i=0; i<data.length; i+=4) {
          if (data[i+3]<128 || data[i]-data[i+1]<128 || data[i+2]-data[i+1]<128) continue;
          const x = (i/4)%w;
          lo = Math.min(lo,x); hi = Math.max(hi,x);
        }
        return Math.max(0,hi-lo+1);
      }
      // Keep the real painter and its occluders, using magenta to identify
      // the six lip materials independently of the character's skin and dyes.
      try {
        const large = new Map();
        for (const compact of [false,true]) {
          globalThis.createSliceActor = (art,...args) => original({...art,
            smallMouthScale:compact ? art.smallMouthScale : undefined,
            materials:Object.fromEntries(Object.keys(art.materials).map(k=>[k,lips.has(k)?'ff00ff':'303030']))},...args);
          choose('subject','seeded');
          for (const size of [64,128,256]) {
            choose('sample-size',String(size));
            for (const angle of [0,315,270,90]) {
              $('bearing').value=String(angle);
              $('bearing').dispatchEvent(new Event('input'));
              if (compact) rows.push([size,angle,width($('canvas-a')),width($('canvas-b'))]);
              else if (size === 64) regular.push(width($('canvas-b')));
              if (angle === 0 || size === 256 || (size === 128 && query.get('age') === 'adult')) {
                const key = size+'/'+angle;
                if (compact) expect(large.get(key) === picture(),'small brush changed the larger projected image '+key);
                else large.set(key,picture());
              }
            }
          }
        }
      } finally { globalThis.createSliceActor=original; choose('subject','seeded'); }
      if (query.get('seed') === '2602' && query.get('age') === 'adult') {
        const [front,,sideA,sideB] = rows.filter(r=>r[0]===256);
        expect(Math.abs(front[2]-front[3])<=1 && [sideA,sideB].every(r=>r[2]-r[3]>=2 && r[3]<front[3]*.51),
          'The front mouth must keep its span while both profiles shorten: '+JSON.stringify(rows));
      }
      $('qa').textContent=JSON.stringify({age:query.get('age'),seed:query.get('seed'),regular64:regular,widths:rows});
      return;
    }
    if (query.has('recipe-pair')) {
      const source=linkedRecipe('a'), edited=linkedRecipe('b');
      expect($('before').value==='recipes' && source.face.nose==='rounded' && edited.face.nose==='button' &&
        JSON.stringify(source.parts)===JSON.stringify(edited.parts),'recipe-pair pane identity');
      expect($('title-a').textContent===source.label && $('title-b').textContent===edited.label,'pair labels');
      for(const [side,other] of [['a',edited],['b',source]]) {
        const url=new URL($('edit-'+side).href);
        expect(url.searchParams.get('study')==='recipes' &&
          JSON.parse(new URLSearchParams(url.hash.slice(1)).get('partner')).id===other.id,'opposite reference was lost');
      }
      const standing=picture();choose('action','baby-reach');
      expect(picture()!==standing && ![...$('action').options].some(o=>o.value==='follow-rattle'),'independently posed recipe samples');
      choose('subject','adult');
      expect($('before').value!=='recipes' && $('before').querySelector('[value="recipes"]').disabled,'archive subject retained a draft-only pair');
      choose('subject','baby02-profile'); choose('before','chin'); choose('action','idle');
      const trial=linkedRecipe('b'), old=linkedRecipe('a');
      expect(trial.packs['pine-core']===PineLooks.infantChinRelease && JSON.stringify(PineLooks.withoutInfantChin(trial))===JSON.stringify(old),'infant chin must use matching recipes');
      for (const size of ['64','128']) {
        choose('sample-size',size);
        for (const angle of [90,270]) {
          $('bearing').value=String(angle); $('bearing').dispatchEvent(new Event('input'));
          expect($('canvas-a').toDataURL()!==picture(),'missing native profile at '+size+' / '+angle);
        }
      }
      choose('action','crawl');
      expect($('phase').value!=='' && new URL($('edit-b').href).searchParams.get('action')==='crawl','infant chin must follow the selected pose');
      choose('before','chin-pad');choose('action','idle');choose('sample-size','64');
      expect(linkedRecipe('a').packs['pine-core']===PineLooks.infantChinRelease && linkedRecipe('b').packs['pine-core']===PineLooks.chinPadRelease,
        'lip-to-chin comparison must isolate the former and revised chins');
      expect($('canvas-a').toDataURL()!==picture(),'the fuller chin must read at native scale');
      $('qa').textContent='Two portable recipes, editable infant chin, bilateral native profiles, movement and reversible editor handoffs passed';return;
    }
    if (query.has('garment-hem')) {
      const doc=linkedRecipe('b');
      expect(doc.garmentFit.top===query.get('garment-hem') && $('sample-size').value==='64','incorrect native garment sample');
      const {width,height}=canvas, pixels=canvas.getContext('2d').getImageData(0,0,width,height).data;
      const widths=[], centralShirt=[], limit=Math.ceil(height*.94);
      let first=height,last=0;
      for(let y=0;y<=limit;y++) {
        let widthAtRow=0, green=0;
        for(let x=0;x<width;x++) {
          const i=4*(y*width+x);
          if(pixels[i+3]<128)continue;
          widthAtRow++;
          if(Math.abs(x-width/2)<=3 && pixels[i+1]>pixels[i] && pixels[i+1]>pixels[i+2]+6)green++;
        }
        widths[y]=widthAtRow;
        if(widthAtRow){first=Math.min(first,y);last=y;}
        if(green>=2)centralShirt.push(y);
      }
      expect(centralShirt.length>0 && last>first,'missing shirt or feet');
      const cuffY=last-Math.floor(.13*(last-first+1));
      const widthAtCuffs=widths.slice(cuffY,cuffY+3).sort((a,b)=>a-b)[1];
      $('qa').textContent=JSON.stringify({hem:doc.garmentFit.top,aboveSole:last-centralShirt.at(-1),widthAtCuffs});
      return;
    }
    if (query.has('garment-draft')) {
      const original=linkedRecipe('b'), prior=linkedRecipe('a');
      expect(original.garmentFit.legs==='wide' && original.face.restExpression==='warm' &&
        JSON.stringify(PineLooks.withoutGarmentStudy(original))===JSON.stringify(prior),'garment handoff lost its fit');
      choose('before','whole-1.19.9');
      expect(linkedRecipe('a').packs[PineLooks.core]===PineLooks.release && JSON.stringify(linkedRecipe('b'))===JSON.stringify(original),
        'full-figure comparison changed manual tailoring');
      choose('before','acting');
      expect(JSON.stringify(linkedRecipe('b'))===JSON.stringify(prior),'garment shape leaked into the earlier edition');
      document.querySelector('[data-mode="blind"]').click();choose('review-kind','garments');
      expect($('title-a').textContent==='A' && !$('edit-b').hasAttribute('href') && $('results').hidden,'wardrobe identity revealed early');
      for (let i=0;i<32;i++) document.querySelector('[data-vote="tie"]').click();
      expect(!$('results').hidden && $('progress').textContent.includes('32 / 32'),'garment review did not finish');
      $('qa').textContent='Manual garment fits survived handoff, cumulative and component views, and 32 isolated blind pairs';return;
    }
    if (query.has('acting-draft')) {
      const full = linkedRecipe('b'), old = linkedRecipe('a');
      expect(full.face.restExpression==='warm' && full.shape.crownHeight===.76 && $('action').value==='follow-rattle' &&
        JSON.stringify(PineLooks.withoutExpressionStudy(full))===JSON.stringify(old), 'actual expression draft did not survive the handoff');
      const frame=picture();
      $('phase').value=73; $('phase').dispatchEvent(new Event('input'));
      expect(picture()!==frame,'rattle frame did not advance');
      choose('before','whole-1.19.8');
      expect(linkedRecipe('a').packs[PineLooks.core]===PineLooks.release && JSON.stringify(linkedRecipe('b'))===JSON.stringify(full),
        'stable-to-trial comparison refitted an authored face');
      choose('before','whole-1.19.7');
      expect(JSON.stringify(linkedRecipe('b'))===JSON.stringify(old), 'old review leaked expression edits');
      document.querySelector('[data-mode="blind"]').click(); choose('review-kind','acting');
      expect($('title-a').textContent==='A' && !$('edit-b').hasAttribute('href') && $('results').hidden,'premature blind identity reveal');
      for (let i=0;i<32;i++) document.querySelector('[data-vote="tie"]').click();
      expect(!$('results').hidden && $('progress').textContent.includes('32 / 32'),'acting review did not finish');
      $('qa').textContent='Custom expression and wardrobe handoff, rattle and earlier editions, 32 isolated trial pairs'; return;
    }
    if (query.has('ratio-draft')) {
      const source=JSON.parse(new URLSearchParams(location.hash.slice(1)).get('character'));
      const left=linkedRecipe('a'), right=linkedRecipe('b');
      expect($('subject').value==='draft' && left.packs[PineLooks.core]===PineLooks.release && right.packs[PineLooks.core]===PineLooks.figureRatioRelease,
        'wrong editions in the complete draft comparison');
      for (const k of Object.keys(PineLooks.figureRatioRanges)) {
        expect(right.shape[k]===source.shape[k] && !(k in left.shape), 'lost a manually edited trial proportion');
      }
      expect(right.clothingCut==='original' && JSON.stringify(left.parts)===JSON.stringify(right.parts) &&
        JSON.stringify(left.colors)===JSON.stringify(right.colors), 'changed the saved outfit during the comparison');
      expect($('action').value==='baby-reach' && $('bearing').value==='270', 'lost the draft pose or its camera');
      $('qa').textContent='Stable figure paired with the saved proportions, clothes and action of the trial draft';
      return;
    }
    if (query.has('ratio-profile')) {
      const actors = [linkedRecipe('a'),linkedRecipe('b')].map(doc=>PineLooks.build(doc));
      const marks = actors.map(a=>{
        const pose=PineMotion.actions.get('idle').sample(.17,a)[0].pose;
        const bands=PineMotion.figureLayers(a,pose,a.body.makePose(pose));
        const top=Math.max(...bands.map(p=>p.z+p.model.bounds[5]/p.body.density));
        const bottom=Math.min(...bands.map(p=>p.z+p.model.bounds[2]/p.body.density));
        const z=name=>PineMotion.rig.socket(a,pose,name)[2];
        return {height:top-bottom,eye:(z('leftEye')+z('rightEye'))/2,mouth:z('mouth'),lip:z('upperLip')};
      });
      const rows=[];
      for (const size of [64,128]) {
        choose('sample-size', String(size));
        const scale=size/Math.max(...marks.map(p=>p.height));
        for (const bearing of [270,90]) {
          $('bearing').value=bearing; $('bearing').dispatchEvent(new Event('input'));
          const clearance=marks.map((p,i)=>{
            const c=$(i?'canvas-b':'canvas-a'), data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
            const screen=z=>c.height*.94-scale*z, eye=screen(p.eye), span=screen(p.mouth)-eye;
            // In a pure side view the last row at the forward silhouette extremum in
            // this eye-to-mouth band gives the underside of the projecting nose.
            let peak=-Infinity, lastRow;
            for (let y=Math.ceil(eye+.16*span-.5);y<=Math.floor(eye+.81*span-.5);y++) {
              for (let d=0;d<c.width;d++) {
                const x=bearing===270 ? c.width-1-d : d;
                if (data[(y*c.width+x)*4+3]<128) continue;
                if (-d>=peak) { peak=-d; lastRow=y; }
                break;
              }
            }
            expect(Number.isFinite(lastRow),'missing side silhouette');
            return Math.round((screen(p.lip)-lastRow-.5)*10)/10;
          });
          if ($('subject').value==='chef' && size===128)
            expect(clearance[1]>clearance[0]+.4, 'chef lost the separation between nose and upper lip');
          rows.push({size,bearing,clearance});
        }
      }
      $('qa').textContent=JSON.stringify({subject:query.has('feature-seed')?'adult/'+query.get('feature-seed'):$('subject').value,rows});
      return;
    }
    if (query.has('feature-test') || query.has('ratio-test') || query.has('acting-profile')) {
      const ratios = query.has('ratio-test'), acting = query.has('acting-profile');
      const newer = acting ? PineLooks.expressionRelease : ratios ? PineLooks.figureRatioRelease : PineLooks.featureStudyRelease;
      const undo = acting ? PineLooks.withoutExpressionStudy : ratios ? PineLooks.withoutFigureRatios : PineLooks.withoutFeatureStudy;
      const pair = [linkedRecipe('a'),linkedRecipe('b')];
      const reference = !query.has('feature-seed');
      expect($('subject').value === (reference?'baby-face-1':'draft') && pair[1].packs['pine-core'] === newer &&
        JSON.stringify(undo(pair[1])) === JSON.stringify(pair[0]), 'the seated holdout must use matching recipes');
      const actors = pair.map(doc=>PineLooks.build(doc));
      const rests = actors.map(a=>PineMotion.actions.get('idle').sample(.17,a)[0].pose);
      const bounds = actors.map((actor,i)=>{
        const model=actor.body.makePose(rests[i]), bands=PineMotion.figureLayers(actor,rests[i],model);
        return {top:Math.max(...bands.map(p=>p.z+p.model.bounds[5]/p.body.density)),bottom:Math.min(...bands.map(p=>p.z+p.model.bounds[2]/p.body.density))};
      });
      const heights = bounds.map(p=>p.top-p.bottom);
      // Scan between the actual moving collar and chin in a side view. Count only
      // background bounded by two opaque runs on the same row inside those joints.
      function scan(canvas, actor, pose, size, bearing) {
        const alpha=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
        const scale=size/Math.max(...heights), sign=bearing===270 ? 1 : -1;
        const pts=['collar','chinTip'].map(name=>PineMotion.rig.socket(actor,pose,name));
        const xs=pts.map(p=>canvas.width/2+scale*sign*p[0]), ys=pts.map(p=>canvas.height*.94-scale*p[2]);
        let rows=0, pixels=0;
        for(let y=Math.max(0,Math.ceil(Math.min(...ys)));y<Math.min(canvas.height,Math.max(...ys));y++) {
          let seen=false, blank=0, inside=0;
          for(let x=Math.max(0,Math.floor(Math.min(...xs)));x<=Math.min(canvas.width-1,Math.ceil(Math.max(...xs)));x++) {
            if(alpha[(y*canvas.width+x)*4+3]>=128) { if(seen) inside+=blank; seen=true; blank=0; }
            else if(seen) blank++;
          }
          if(inside) rows++;
          pixels+=inside;
        }
        return {rows,pixels};
      }
      const results=[];
      for(const [action,phase] of [['idle',17],['baby-reach',43],['crawl',61]]) {
        choose('action',action);
        $('phase').value=phase; $('phase').dispatchEvent(new Event('input'));
        const poses=actors.map(a=>PineMotion.actions.get(action).sample(phase/100,a)[0].pose);
        for(const size of [64,128]) for(const bearing of [270,90]) {
          choose('sample-size',String(size)); $('bearing').value=bearing; $('bearing').dispatchEvent(new Event('input'));
          const gaps=actors.map((a,i)=>scan($(i?'canvas-b':'canvas-a'),a,poses[i],size,bearing));
          if(reference) expect(gaps[1].pixels===0, 'open throat pixels at '+[action,size,bearing,JSON.stringify(gaps)]);
          if(reference && !ratios && !acting && size===128 && bearing===270 && action==='idle')
            expect(gaps[0].rows>=2 && gaps[1].pixels===0, 'the infant profile still has a notch under the chin: '+JSON.stringify(gaps));
          results.push([action,size,bearing,gaps.map(g=>g.pixels)]);
        }
      }
      expect(new URL($('edit-b').href).searchParams.get('tab')==='face', 'feature comparison did not return to the face editor');
      if (query.has('measure')) {
        const baby=(ratios || acting) && reference ? '1.19.6 / 01' : Number(query.get('feature-seed') || 0)+1;
        const crownToEye128=actors.map((a,i)=>{
          const eyes=['leftEye','rightEye'].map(k=>PineMotion.rig.socket(a,rests[i],k)[2]);
          return Math.round(1280*(bounds[i].top-(eyes[0]+eyes[1])/2)/heights[i])/10;
        });
        $('qa').textContent=JSON.stringify({baby,crownToEye128,frames:results}); return;
      }
      choose('before','whole-1.19.6');
      expect(!$('face-gallery').hidden && $('face-gallery').href.endsWith('/whole-1.19.6.webp') &&
        JSON.stringify(linkedRecipe('b')) === JSON.stringify(ratios ? pair[0] : pair[1]) &&
        linkedRecipe('a').packs[PineLooks.core] === PineLooks.release, 'full trial changed the random infant');
      if (ratios) {
        choose('before','whole-1.19.7');
        const stable=linkedRecipe('a');
        expect(JSON.stringify(linkedRecipe('b'))===JSON.stringify(pair[1]) && stable.packs[PineLooks.core]===PineLooks.release &&
          JSON.stringify(stable.parts)===JSON.stringify(pair[1].parts) && JSON.stringify(stable.colors)===JSON.stringify(pair[1].colors) &&
          $('face-gallery').href.endsWith('/whole-1.19.7.webp'), 'lost the person in the cumulative proportion study');
      }
      document.querySelector('[data-mode="blind"]').click(); choose('review-kind',ratios ? 'ratios' : 'features');
      expect($('progress').textContent.includes('0 / 32') && !$('edit-b').hasAttribute('href') && $('face-gallery').hidden,'the feature holdout leaked an answer');
      for(let i=0;i<32;i++) document.querySelector('[data-vote="tie"]').click();
      expect(!$('results').hidden && [...$('counts').rows].every(row=>row.cells[2].textContent==='8'), 'unreviewed age');
      $('qa').textContent='Checked 32 reversible '+(ratios?'proportion':'feature')+' pairs and seated throat pixels '+JSON.stringify(results);
      return;
    }
    if (query.has('clothing-test')) {
      expect($('before').value==='cut' && $('action').value==='walk' && $('phase').value==='43', 'clothing study lost the requested walk');
      const left=linkedRecipe('a'), right=linkedRecipe('b');
      expect(left.packs['pine-core']===PineLooks.baseFaceRelease && JSON.stringify(PineLooks.withClothingStudy(left))===JSON.stringify(right),
        'clothing trial changed a face, a body setting or an outfit part');
      for (const angle of [0,315,270,180]) {
        turn(angle);
        expect($('canvas-a').toDataURL()!==picture(),'identical clothing frames at '+angle);
      }
      document.querySelector('[data-mode="blind"]').click();
      choose('review-kind','cut');
      expect($('progress').textContent.includes('0 / 32') && !$('edit-b').hasAttribute('href'),'clothing A/B leaked a label or another review');
      for (let i=0;i<32;i++) document.querySelector('[data-vote="tie"]').click();
      expect(!$('results').hidden && [...$('counts').rows].every(row=>row.cells[2].textContent==='8'),'clothing blind pairs incomplete');
      $('qa').textContent='Matched all four walking angles and 32 reversible blind clothing pairs';
      return;
    }
    if (query.has('base-test')) {
      const left = linkedRecipe('a'), right = linkedRecipe('b');
      expect(left.packs['pine-core'] === PineLooks.gameFaceRelease && right.packs['pine-core'] === PineLooks.baseFaceRelease &&
        right.face.form === 'round' && JSON.stringify(left) === JSON.stringify(PineLooks.withGameFace(right)), 'base review must hold the entire recipe fixed');
      expect(!$('form-field').hidden && $('action').value === 'baby-reach' && $('bearing').value === '270.5' &&
        $('phase').value === '36.25' && $('canvas-a').toDataURL() !== picture(), 'new baby profile or same-frame handoff missing');
      choose('drawn-form','balanced');
      expect($('canvas-a').toDataURL() === picture() && $('prompt').textContent.includes('均衡'), 'two equal neutral bases should match pixel for pixel');
      choose('drawn-form','long'); choose('subject','toddler');
      expect($('title-b').textContent.includes('小椭圆') && new URL(location.href).searchParams.get('form') === 'long', 'toddler base choice lost');
      document.querySelector('[data-mode="blind"]').click();
      choose('review-kind','bases');
      expect($('form-field').hidden && $('progress').textContent.includes('0 / 32') && !$('edit-b').hasAttribute('href'), 'base review leaked its form or inherited votes');
      for (let n=0;n<32;n++) document.querySelector('[data-vote="tie"]').click();
      expect(!$('results').hidden && $('counts').rows.length === 4 && [...$('counts').rows].every(r=>r.cells[2].textContent==='8'), 'base review did not reach all four age groups');
      $('qa').textContent = 'Matched recipes, native neutral pixels, the seated baby action and 32 isolated base-review pairs';
      return;
    }
    if (query.has('bad-test')) {
      expect(!$('source-status').hidden && $('subject').value !== 'draft' && linkedRecipe('b').id, 'invalid fragment must recover with a usable standard figure');
      $('qa').textContent = 'Recovered from an invalid draft';
      return;
    }
    if (query.has('draft-test')) {
      const packet = new URLSearchParams(location.hash.slice(1));
      const source = PineLooks.prepare(JSON.parse(packet.get('character'))).recipe;
      const original = linkedRecipe('a'), revised = linkedRecipe('b');
      expect($('subject').value === 'draft' && $('before').value === 'current' && $('source-status').hidden &&
        JSON.stringify(original) === JSON.stringify(source), 'draft comparison changed the submitted original');
      expect(original.face.style === 'manga' && revised.face.style === 'animation' && revised.bodyFinish === 'painted' &&
        revised.face.formMix === .63 && $('prompt').textContent.includes('左侧保留原画风'), 'full candidate must actually enable the art face');
      expect($('action').value === 'follow-rattle' && !$('pose-note').hidden &&
        +$('phase').value === 36.25 && +$('bearing').value === 270.5, 'duet role, phase or camera changed');
      const link = new URL($('edit-b').href);
      expect(link.searchParams.get('action') === 'follow-rattle' && link.searchParams.get('tab') === 'face' &&
        Number(link.searchParams.get('phase')) === 36.25 && Number(link.searchParams.get('bearing')) === 270.5 &&
        JSON.parse(new URLSearchParams(link.hash.slice(1)).get('partner')).label === '搭档小安', 'editor return lost companion, camera or frame');
      choose('before','whole');
      const old = linkedRecipe('a');
      for (const field of ['id','label','base','gender','shape','parts','colors','embeddedPacks']) {
        expect(JSON.stringify(old[field]) === JSON.stringify(source[field]) && JSON.stringify(revised[field]) === JSON.stringify(source[field]),
          'look identity or portable part changed: ' + field);
      }
      expect(old.packs['pine-core'] === PineLooks.release && old.face.style === 'manga' && !old.bodyFinish &&
        !old.face.form && revised.face.form === 'round' && old.face.mouth === revised.face.mouth, 'stable projection is inaccurate');
      choose('before','finish');
      expect(!linkedRecipe('a').bodyFinish && linkedRecipe('b').bodyFinish === 'painted', 'already-painted draft masked the paint comparison');
      choose('before','current');
      choose('subject','child');
      expect($('before').value === 'whole' && $('before').querySelector('[value="current"]').disabled &&
        !location.hash && new URLSearchParams(location.search).get('action') !== 'follow-rattle', 'left the draft with stale controls or URL');
      choose('subject','draft');
      expect(JSON.parse(new URLSearchParams(location.hash.slice(1)).get('character')).id === source.id, 'returning to the draft lost its shareable recipe');
      document.querySelector('[data-mode="blind"]').click();
      expect(!location.hash && new URLSearchParams(location.search).get('mode') === 'blind' &&
        (!$('edit-a').hasAttribute('href') || linkedRecipe('a').id !== source.id), 'a blind link should only contain its holdout sample');
      $('qa').textContent = 'Replayed an unsaved costumed baby, external hat, adult caregiver, action phase and fractional angle';
      return;
    }
    const resume = query.get('resume');
    if (['bases','cut','features','ratios','acting','garments'].includes(resume)) {
      const cut = resume==='cut', features = resume==='features', ratios=resume==='ratios', acting=resume==='acting';
      const garments = resume==='garments';
      const target = garments ? PineLooks.garmentRelease : acting ? PineLooks.expressionRelease : ratios ? PineLooks.figureRatioRelease : features ? PineLooks.featureStudyRelease : cut ? PineLooks.clothingStudyRelease : PineLooks.baseFaceRelease;
      const previous = garments ? PineLooks.expressionRelease : acting ? PineLooks.figureRatioRelease : ratios ? PineLooks.featureStudyRelease : features ? PineLooks.clothingStudyRelease : cut ? PineLooks.baseFaceRelease : PineLooks.gameFaceRelease;
      const sides = [linkedRecipe('a'),linkedRecipe('b')].sort((a,b)=>a.packs['pine-core'].localeCompare(b.packs['pine-core']));
      const matched = garments || acting ? JSON.stringify((garments ? PineLooks.withoutGarmentStudy : PineLooks.withoutExpressionStudy)(sides[1]))===JSON.stringify(sides[0]) : ratios ? JSON.stringify(PineLooks.withoutFigureRatios(sides[1])) === JSON.stringify(sides[0]) : features ? JSON.stringify(PineLooks.withoutFeatureStudy(sides[1]))===JSON.stringify(sides[0]) :
        cut ? JSON.stringify(PineLooks.withClothingStudy(sides[0]))===JSON.stringify(sides[1]) : JSON.stringify(sides[0])===JSON.stringify(PineLooks.withGameFace(sides[1]));
      expect($('review-kind').value===resume && !$('results').hidden && matched,
        'resumed base review lost the actual control');
      let report;
      const BlobImpl=window.Blob, click=HTMLAnchorElement.prototype.click;
      try {
        window.Blob=class extends BlobImpl { constructor(parts,opts) { super(parts,opts);report=JSON.parse(parts[0]); } };
        HTMLAnchorElement.prototype.click=()=>{};
        $('export').click();
      } finally { window.Blob=BlobImpl; HTMLAnchorElement.prototype.click=click; }
      expect(report.study.endsWith(target) && report.review===resume && report.pairs.length===32, 'base review report format');
      const [age,index]=new URLSearchParams(location.search).get('case').split('/');
      const pair=report.pairs.find(p=>p.base===age && p.number===+index+1);
      const actual=PineLooks.randomCharacter({base:age,seed:pair.seed,release:target,bodyFinish:'painted'});
      expect(JSON.stringify(actual)===JSON.stringify(sides[1]) && [pair.a,pair.b].sort().join('/')===[previous,target].join('/'),
        'base review seed, versions or actual clothing did not replay');
      if (acting || garments) for (const row of report.pairs) {
        const base={base:row.base,seed:row.seed,bodyFinish:'painted'};
        const revised=PineLooks.randomCharacter({...base,release:target});
        const original=PineLooks.randomCharacter({...base,release:previous});
        expect(JSON.stringify((garments ? PineLooks.withoutGarmentStudy : PineLooks.withoutExpressionStudy)(revised))===JSON.stringify({...original,id:revised.id,label:revised.label}),
          'reported seed changed the appearance on downgrade '+row.base+'/'+row.number);
      }
      $('qa').textContent='Restored and independently replayed the ' + target + ' age review and its hidden-side export';
      return;
    }
    if (resume === 'cast') {
      expect($('review-kind').value === 'cast' && $('progress').textContent.includes('1 / 32') &&
        $('results').hidden && !$('edit-a').hasAttribute('href'), 'separate whole-cast session did not restore');
      for (let i=0;i<31;i++) document.querySelector('[data-vote="tie"]').click();
      expect(!$('results').hidden && $('progress').textContent.includes('32 / 32'), 'cast review did not finish');
      const sides = [linkedRecipe('a'), linkedRecipe('b')];
      const reports = [];
      const originalBlob = window.Blob, originalClick = HTMLAnchorElement.prototype.click;
      try {
        window.Blob = class extends originalBlob {
          constructor(parts, options) { super(parts, options); reports.push(JSON.parse(parts[0])); }
        };
        HTMLAnchorElement.prototype.click = () => {};
        $('export').click();
      } finally { window.Blob = originalBlob; HTMLAnchorElement.prototype.click = originalClick; }
      const report = reports[0], [age, num] = new URLSearchParams(location.search).get('case').split('/');
      const pair = report.pairs.find(p => p.base === age && p.number === Number(num) + 1);
      expect(report.review === 'cast' && report.candidateBodyFinish === 'painted' && report.pairs.length === 32,
        'cast export lost its comparison type or paint');
      sides.forEach((doc, i) => {
        const pane = i ? 'b' : 'a', pin = pair[pane];
        const expected = PineLooks.randomCharacter({ base: age, seed: pair.seed, release: pin,
          bodyFinish: pin === PineLooks.release ? undefined : 'painted' });
        expect(doc.packs['pine-core'] === pin && $('title-' + pane).textContent.includes(pin) &&
          doc.id === expected.id && JSON.stringify(doc.parts) === JSON.stringify(expected.parts) &&
          doc.bodyFinish === expected.bodyFinish, 'revealed recipe does not replay from its own public generator');
      });
      expect(new Set([pair.a, pair.b]).size === 2 && [pair.a, pair.b].includes(PineLooks.release), 'cast is missing the stable generator');
      $('qa').textContent = 'Restored separate whole-cast votes, independently replayed both generators and verified their exported labels';
      return;
    }
    if (resume) {
      expect(!$('results').hidden && $('counts').rows.length === 4 && !$('edit-b').hidden, 'saved review did not restore');
      expect($('progress').textContent.includes('32 / 32'), 'saved votes did not restore');
      $('qa').textContent = 'Restored 32 recorded votes';
      return;
    }
    expect($('subject').value === 'baby' && $('before').value === '1.19.0' && $('bearing').value === '270',
      'baby profile comparison link lost its subject, angle or baseline');
    choose('subject','adult');
    expect($('title-b').textContent.includes('1.19.3'), 'latest study did not start');
    const pin = side => JSON.parse(new URLSearchParams(new URL($('edit-' + side).href).hash.slice(1)).get('character')).packs['pine-core'];
    expect(pin('a') === '1.19.0' && pin('b') === '1.19.3', 'requested baseline should be first versus current study');
    choose('before','1.18.0');
    expect(pin('a') === '1.18.0' && pin('b') === '1.19.3', 'stable alternative baseline did not load');
    const headings = new Set();
    for (const a of [0,315,270,180]) { turn(a); headings.add(picture()); }
    expect(headings.size === 4, 'four model views did not produce four distinct images');
    const color = picture();
    choose('ink','silhouette');
    const pixels = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let occupied = 0;
    for (let p = 0; p < pixels.length; p += 4)
      if (pixels[p] === 41 && pixels[p+1] === 53 && pixels[p+2] === 46 && pixels[p+3] > 127) occupied++;
    expect(occupied > 160, 'silhouette is empty');
    choose('ink','values');
    expect(picture() !== color, 'value study is unchanged');
    choose('sample-size','64');
    function occupiedHeight(panel) {
      const small = panel.getContext('2d').getImageData(0,0,panel.width,panel.height).data;
      const occupiedRows = [];
      for (let y=0;y<panel.height;y++) {
        if (small[4 * panel.width*y + 3]) continue; // outside the figure, this is only the baseline
        for (let x=1;x<panel.width-1;x++) if (small[4*(y*panel.width+x)+3] > 127) { occupiedRows.push(y); break; }
      }
      return occupiedRows.at(-1) - occupiedRows[0] + 1;
    }
    const neutralPixels = Math.max(occupiedHeight($('canvas-a')), occupiedHeight(canvas));
    expect(Math.abs(neutralPixels - 64) <= 3, 'neutral figure occupied ' + neutralPixels + ' pixels instead of 64');
    const editable = new URLSearchParams(new URL($('edit-b').href).hash.slice(1)).get('character');
    expect(JSON.parse(editable).packs['pine-core'] === '1.19.3', 'editor handoff lost the selected recipe');
    choose('sample-size','256');
    choose('ink','color');
    choose('subject','baseline-4');
    const baseline = JSON.parse(new URLSearchParams(new URL($('edit-b').href).hash.slice(1)).get('character'));
    expect(baseline.base === 'child' && baseline.parts.hat === 'pine-core/sunhat' && baseline.parts.top === 'pullover' && $('guide').hidden, 'original consecutive sample 4 was lost');
    choose('before','whole-1.19.6');
    const stableHat = linkedRecipe('a'), trialHat = linkedRecipe('b');
    expect(stableHat.packs[PineLooks.core] === PineLooks.release && trialHat.packs[PineLooks.core] === PineLooks.featureStudyRelease &&
      trialHat.bodyFinish === 'painted' && PineLooks.usesClothingCut(trialHat), 'full figure versions or finishes do not match');
    for (const field of ['base','id','parts','shape','colors'])
      expect(JSON.stringify(stableHat[field]) === JSON.stringify(trialHat[field]), 'the complete comparison changed '+field);
    for (const key of ['eyes','brows','mouth','nose','outline'])
      expect(stableHat.face[key] === trialHat.face[key], 'the complete comparison changed '+key);
    expect($('canvas-a').toDataURL()!==picture(), 'stable yellow-hat pixels were reused on both sides');
    choose('subject','child-6');
    choose('before','finish');
    const left = linkedRecipe('a'), right = linkedRecipe('b');
    expect(!left.bodyFinish && right.bodyFinish === 'painted' && JSON.stringify({ ...left, bodyFinish: 'painted' }) === JSON.stringify(right),
      'body paint comparison must keep the exact same character');
    expect($('canvas-a').toDataURL() !== picture(), 'body paint has no visible effect');
    choose('before','whole');
    choose('sample-size','world');
    choose('ink','color');
    turn(270);
    let nativeDimensions;
    const heights = [];
    for (const subject of ['adult','child','toddler-1','baby']) {
      choose('subject',subject);
      const w = canvas.width, h = canvas.height, floor = Math.round(h * .94);
      const raster = canvas.getContext('2d').getImageData(0,0,w,h).data;
      if (!nativeDimensions) nativeDimensions = [w,h];
      expect(nativeDimensions[0] === w && nativeDimensions[1] === h, 'centimeter camera moved between age groups');
      for (const cm of [0,50,100,150,200]) {
        const i = 4 * ((floor-cm)*w+3);
        expect(raster[i] === 112 && raster[i+1] === 121 && raster[i+3] === 255, 'centimeter tick missing at ' + cm);
      }
      let top = floor;
      for (let y = 0; y < top; y++) for (let x = Math.floor(w/4); x < 3*w/4; x++) {
        if (raster[4*(y*w+x)+3] > 127) { top = y; break; }
      }
      heights.push(floor-top);
    }
    expect(heights.every((h,i) => h > 20 && (!i || heights[i-1] > h)), 'age scale or sitting height lost: ' + heights);
    choose('sample-size','64');
    const panes = [$('canvas-a'), canvas];
    function nativeRaster(panel) {
      const { width:w, height:h } = panel;
      return { w,h,data:new Uint32Array(panel.getContext('2d').getImageData(0,0,w,h).data.buffer) };
    }
    function isCrop(full, crop, x, y) {
      for (let j=0; j<crop.h; j++) for (let i=0; i<crop.w; i++)
        if (full.data[(y+j)*full.w+x+i] !== crop.data[j*crop.w+i]) return false;
      return true;
    }
    for (const subject of ['adult-female','baby']) {
      choose('subject',subject);
      const full = panes.map(nativeRaster);
      choose('framing','head');
      const crops = panes.map(nativeRaster);
      expect(crops.every((c,i) => c.w < full[i].w && c.h < full[i].h && c.data.filter(v => v >>> 24 > 127).length > 60), 'empty head crop');
      let match = false;
      for (let y=0; !match && y<=full[0].h-crops[0].h; y++) for (let x=0; !match && x<=full[0].w-crops[0].w; x++)
        match = panes.every((_, i) => isCrop(full[i],crops[i],x,y));
      expect(match, 'head framing must use the identical source pixels and crop window on both sides for ' + subject);
      choose('framing','body');
    }
    choose('before','1.19.2');
    for (const s of ['chef','hoodie','child','baby']) {
      choose('subject',s);
      expect(picture() !== color, 'did not render ' + s);
    }
    expect(!$('guide').hidden && $('guide-img').complete && $('guide-img').naturalWidth === 1448, 'reference is missing');
    expect(!$('action').querySelector('[value="walk"]'), 'infant walking offered');
    choose('action','crawl');
    const still = picture();
    $('phase').value = '62';
    $('phase').dispatchEvent(new Event('input'));
    expect(picture() !== still, 'action playhead did not render a new pose');
    document.querySelector('[data-mode="blind"]').click();
    expect($('title-a').textContent === 'A' && $('results').hidden && !$('edit-b').hasAttribute('href'), 'blind side revealed prematurely');
    for (let i=0;i<31;i++) document.querySelector('[data-vote="tie"]').click();
    expect($('progress').textContent.includes('31 / 32') && $('results').hidden, 'voting or premature reveal');
    document.querySelector('[data-vote="a"]').click();
    expect(!$('results').hidden && $('counts').rows.length === 4 && !$('edit-a').hidden, 'complete review missing results');
    const rows = [...$('counts').rows].map(row => [...row.cells].slice(1).map(td => +td.textContent));
    expect(rows.every(row => row.reduce((a,b)=>a+b,0) === 8) && rows.reduce((n,r)=>n+r[1],0) === 31, 'wrong age/vote totals');
    expect(Object.keys(JSON.parse(localStorage.getItem('pine.figureStudy.1.19.2-1.19.3.v1')).votes).length === 32, 'review not persisted');
    expect(localStorage.getItem('pine.figureStudy.1.18.0-1.19.0.v1') === '{"salt":77,"votes":{"adult/0":"b"}}', 'archived results were overwritten');
    choose('review-kind','cast');
    expect($('progress').textContent.includes('0 / 32') && !$('edit-b').hasAttribute('href'), 'new cast inherited face votes');
    document.querySelector('[data-vote="b"]').click();
    choose('review-kind','face');
    expect($('progress').textContent.includes('32 / 32') && !$('results').hidden, 'switching reviews lost face votes');
    const result = { views: headings.size, reviewPairs: 32 };
    function measureClip(base, candidate, clip) {
      const actors = [PineLooks.build(base), PineLooks.build(candidate)];
      const samples = [[],[]], projection = [[],[]];
      const action = PineMotion.actions.get(clip);
      const target = document.createElement('canvas');
      target.width = 320; target.height = 256;
      const ctx = target.getContext('2d');
      // Alternate test order and exclude the first four warm-up pairs.
      for (let frame=0;frame<24;frame++) {
        for (const side of frame % 2 ? [1,0] : [0,1]) {
          const actor = actors[side], t0 = performance.now();
          const sample = action.sample((frame + .3)/24,actor)[0], body = actor.body, model = body.makePose(sample.pose);
          const part = { ...sample, actor, body, model, x:0, y:0, heading:0 };
          const bands = studioPortraitLayers([part],PineMotion,PineMotion.figureLayers) || [part];
          const t1 = performance.now();
          ctx.clearRect(0,0,320,256);
          const yaw = -Math.PI/4, scale = 4.1;
          for (const band of bands) {
            const x = -Math.sin(yaw)*band.x + Math.cos(yaw)*band.y;
            band.body.draw(ctx,band.model,160+scale*x,244-scale*band.z,yaw,0,scale);
          }
          ctx.getImageData(156,170,1,1);
          const t2 = performance.now();
          if (frame >= 4) { samples[side].push(t1-t0); projection[side].push(t2-t1); }
        }
      }
      const median = values => {
        const sorted = values.slice().sort((a,b)=>a-b), middle = sorted.length / 2;
        return +((sorted[middle-1]+sorted[middle])/2).toFixed(1);
      };
      return {
        versions:studyBench === 'body' ? ['original ink','painted'] : [base.packs[PineLooks.core],candidate.packs[PineLooks.core]],
        framesPerVersion:20, medianPoseAndFineBandsMs:samples.map(median), medianProjectionAndReadbackMs:projection.map(median) };
    }
    if (studyBench) {
      const doc = structuredClone(pineFigureModels.adult);
      doc.packs[PineLooks.core] = PineLooks.structureStudyRelease;
      const base = studyBench === 'garments' ? PineLooks.randomCharacter({base:'adult',seed:42,release:PineLooks.expressionRelease,bodyFinish:'painted'}) :
        studyBench === 'acting' ? PineLooks.randomCharacter({base:'adult',seed:42,release:PineLooks.figureRatioRelease,bodyFinish:'painted'}) :
        studyBench === 'ratios' ? {...PineLooks.withFeatureStudy(PineLooks.withClothingStudy(PineLooks.withBaseFace(doc,'long'))),bodyFinish:'painted'} :
        studyBench === 'features' ? {...PineLooks.withClothingStudy(PineLooks.withBaseFace(doc,'long')),bodyFinish:'painted'} :
        studyBench === 'cut' ? {...PineLooks.withBaseFace(doc,'long'),bodyFinish:'painted'} : studyBench === 'body' ? PineLooks.randomCharacter({ base:'child', seed:3418494998, release:PineLooks.gameFaceRelease }) :
        studyBench === 'bases' ? PineLooks.withGameFace(PineLooks.withBaseFace(doc,'long')) : doc;
      const candidate = studyBench === 'garments' ? PineLooks.withGarmentStudy(base) : studyBench === 'acting' ? PineLooks.withExpressionStudy(base) : studyBench === 'ratios' ? PineLooks.withFigureRatios(base) : studyBench === 'features' ? PineLooks.withFeatureStudy(base) :
        studyBench === 'cut' ? PineLooks.withClothingStudy(base) : studyBench === 'body' ? { ...base, bodyFinish:'painted' } :
        studyBench === 'bases' ? PineLooks.withBaseFace(base) : PineLooks.withGameFace(base);
      result[studyBench === 'body' ? 'walkingChild' : 'walkingAdult'] = measureClip(base,candidate,'walk');
      if (studyBench === 'garments') {
        const baby = PineLooks.randomCharacter({base:'baby',seed:42,release:PineLooks.expressionRelease,bodyFinish:'painted'});
        result.seatedReach=measureClip(baby,PineLooks.withGarmentStudy(baby),'baby-reach');
      } else if (studyBench === 'acting') {
        const baby = PineLooks.randomCharacter({base:'baby',seed:42,release:PineLooks.figureRatioRelease,bodyFinish:'painted'});
        result.seatedReach=measureClip(baby,PineLooks.withExpressionStudy(baby),'baby-reach');
      } else if (studyBench === 'features' || studyBench === 'ratios') {
        const ratios = studyBench === 'ratios';
        const baby = PineLooks.randomCharacter({base:'baby',seed:42,release:ratios ? PineLooks.featureStudyRelease : PineLooks.clothingStudyRelease,bodyFinish:'painted'});
        result.seatedReach = measureClip(baby, ratios ? PineLooks.withFigureRatios(baby) : PineLooks.withFeatureStudy(baby), 'baby-reach');
      }
    }
    $('qa').textContent = JSON.stringify(result);
  } catch (err) { $('qa').textContent = 'FAIL ' + err.stack; }
}

const dir = mkdtempSync(join(tmpdir(), 'pine-figure-qa-')), root = resolve(__dirname, '..');
try {
  const file = join(dir, 'page.html');
  const measureCut = process.argv.includes('--measure-cut');
  const measureBases = process.argv.includes('--measure-bases');
  const measureForms = measureBases || process.argv.includes('--measure-forms');
  const bench = process.argv.includes('--bench-ensemble') ? 'ensemble' : process.argv.includes('--bench-garments') ? 'garments' : process.argv.includes('--bench-acting') ? 'acting' : process.argv.includes('--bench-ratios') ? 'ratios' : process.argv.includes('--bench-features') ? 'features' : process.argv.includes('--bench-cut') ? 'cut' : process.argv.includes('--bench-body') ? 'body' : measureBases || process.argv.includes('--bench-bases') ? 'bases' : process.argv.includes('--bench');
  const setup = join(dir, 'draft-fixture.js');
  writeFileSync(setup, '(' + loadDraft.toString() + ')(' + readFileSync(join(root,'packs/creek-hats.json'),'utf8') + ');');
  const page = readFileSync(join(root, 'figure-study.html'), 'utf8')
    .replace('<script defer src="figure-study.js">', '<script defer src="' + pathToFileURL(setup).href + '"></script><script defer src="figure-study.js">')
    .replace('<head>', '<head><base href="' + pathToFileURL(root+sep).href + '"><script>localStorage.setItem("pine.figureStudy.1.18.0-1.19.0.v1",JSON.stringify({salt:77,votes:{"adult/0":"b"}}))</script>')
    .replace('</body>', '<output id="qa"></output><script>window.addEventListener("load",()=>(' +
      (measureCut ? measureClothingPixels : measureForms ? measureFacePixels : check).toString() + ')(' + JSON.stringify(bench) + '));</script></body>');
  writeFileSync(file, page);
  const chrome = process.env.CHROME_BIN || (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
  const narrow = process.argv.includes('--narrow-mouth-turn');
  const flags = ['--headless','--disable-gpu','--no-first-run','--force-device-scale-factor=1',narrow ? '--window-size=480,800' : '--window-size=1100,850',
    '--user-data-dir=' + join(dir,'profile'),'--dump-dom',pathToFileURL(file).href];
  if (process.env.CI === 'true' && process.platform === 'linux') flags.unshift('--no-sandbox');
  const featureCase = '?feature-test=1&subject=baby-face-1&before=features&size=128&bearing=270';
  const ratioCase = '?ratio-test=1&subject=baby-face-1&before=ratios&size=128&bearing=270';
  const profileCase = '?ratio-profile=1&before=ratios&phase=17&bearing=270&subject=';
  const actingCases = ['?acting-draft=1&before=acting&action=follow-rattle&bearing=270&phase=23&size=128','?mode=blind&review=acting&case=baby%2F0&resume=acting','?acting-profile=1&before=acting&subject=baby-face-1&measure=1'];
  const garmentCases = ['?garment-draft=1&before=garments&subject=draft&action=walk&phase=43&size=64','?mode=blind&review=garments&case=child%2F0&resume=garments',
    '?recipe-pair=1&subject=draft&before=recipes&bearing=270&size=64'];
  for (const top of ['tucked','bloused','straight'])
    garmentCases.push('?subject=draft&before=garments&size=64&garment-hem='+top);
  const actingProfile = '?acting-profile=1&before=acting&size=128&bearing=270&measure=1&subject=';
  const mouthCase = '?mouth-turn=1&subject=seeded&before=surface&age=adult&seed=';
  const ensembleCases = ['adult','child','toddler','baby'].map(age=>'?ensemble-pair=1&before=whole-1.19.12&subject=seeded&seed=2602&age='+age);
  const ensembleReview = '?ensemble-review=1&mode=blind&review=ensemble&case=adult%2F0';
  const chinEdge = '?chin-edge=1&before=profile-line&subject=seeded&age=adult&seed=';
  const firstSeed = process.argv.includes('--holdout-mouth-turn') ? 2610 : 2600;
  const cases = process.argv.includes('--measure-chin-edge') ? Array.from({length:8},(_,i)=>chinEdge+(2600+i)) :
    bench === 'ensemble' ? ensembleCases : process.argv.includes('--check-ensemble') ? [...ensembleCases,ensembleReview] :
    narrow || process.argv.includes('--measure-mouth-turn') || process.argv.includes('--holdout-mouth-turn') ? Array.from({length:8},(_,i)=>mouthCase+(firstSeed+i)) :
    process.argv.includes('--measure-acting') ? [actingProfile+'baby-face-1',...Array.from({length:8},(_,i)=>actingProfile+'draft&feature-seed='+i)] :
    process.argv.includes('--bench-acting') || process.argv.includes('--bench-garments') ? ['?subject=baby&bearing=270&before=1.19.0'] :
    process.argv.includes('--check-garments') ? garmentCases :
    process.argv.includes('--check-acting') ? actingCases :
    process.argv.includes('--measure-ratio-profiles') ? [profileCase+'adult',profileCase+'chef',
    ...Array.from({length:8},(_,i)=>profileCase+'draft&sample-age=adult&feature-seed='+i)]
    : process.argv.includes('--measure-ratios') ? [ratioCase+'&measure=1',
    ...Array.from({length:8},(_,i)=>'?ratio-test=1&measure=1&subject=draft&before=ratios&feature-seed='+i)]
    : process.argv.includes('--measure-features') ? [featureCase+'&measure=1',
    ...Array.from({length:7},(_,i)=>'?feature-test=1&measure=1&subject=draft&before=features&feature-seed='+(i+1))]
    : measureCut ? ['?before=cut'] : measureForms ? [''] : ['?subject=baby&bearing=270&before=1.19.0', '?mode=blind&resume=1', '?mode=blind&review=cast&case=child%2F5&resume=cast',
    '?draft-test=1&before=current&action=follow-rattle&phase=36.25&bearing=270.5&framing=head', '?bad-test=1#character=%7B',
    '?base-test=1&subject=baby&before=bases&form=round&phase=36.25&action=baby-reach&bearing=270.5', '?mode=blind&review=bases&case=baby%2F0&resume=bases',
    '?clothing-test=1&subject=baseline-4&before=cut&action=walk&phase=43', '?mode=blind&review=cut&case=baby%2F0&resume=cut',
    mouthCase+'2602', chinEdge+'2602',ensembleCases[3],ensembleReview, featureCase, '?mode=blind&review=features&case=baby%2F0&resume=features',
    ratioCase, '?mode=blind&review=ratios&case=baby%2F0&resume=ratios', profileCase+'chef',
    '?ratio-draft=1&before=whole-1.19.7&action=baby-reach&bearing=270&phase=43&size=128',...actingCases,...garmentCases];
  const garmentPixels = {};
  for (const query of cases) {
    const args = [...flags.slice(0,-1), flags.at(-1) + query];
    const r = spawnSync(chrome, args, { encoding:'utf8', maxBuffer:4000000, timeout:120000 });
    const msg = r.stdout?.match(/<output id="qa">([^<]*)<\/output>/)?.[1];
    assert.ok(r.status === 0 && msg && !msg.startsWith('FAIL'), msg || r.error?.message || r.stderr?.slice(-1500));
    if (query.includes('garment-hem=')) {
      const row=JSON.parse(msg);garmentPixels[row.hem]=row;
    }
    console.log('Figure study passed', msg);
  }
  if (garmentPixels.tucked) {
    const {tucked, bloused, straight} = garmentPixels;
    assert.ok(tucked.aboveSole-bloused.aboveSole>=3,'raised waist must read at 64 pixels');
    assert.ok(bloused.widthAtCuffs>tucked.widthAtCuffs && straight.widthAtCuffs-bloused.widthAtCuffs>=2,
      'the three trouser openings must read at 64 pixels');
  }
} finally { rmSync(dir, { recursive:true, force:true, maxRetries:3 }); }
