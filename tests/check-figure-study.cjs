// Check the real comparison page in an isolated Chrome profile. Pass --bench to time
// pose sampling and orthographic projection on the same character, camera and machine.
const assert = require('node:assert/strict');
const { readFileSync, writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const { resolve, join, sep } = require('node:path');
const { pathToFileURL } = require('node:url');

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
    const resume = new URLSearchParams(location.search).get('resume');
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
    choose('subject','child-6');
    choose('before','finish');
    const left = linkedRecipe('a'), right = linkedRecipe('b');
    expect(!left.bodyFinish && right.bodyFinish === 'painted' && JSON.stringify({ ...left, bodyFinish: 'painted' }) === JSON.stringify(right),
      'body paint comparison must keep the exact same character');
    expect($('canvas-a').toDataURL() !== picture(), 'body paint has no visible effect');
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
    if (studyBench) {
      const doc = structuredClone(pineFigureModels.adult);
      doc.packs[PineLooks.core] = PineLooks.structureStudyRelease;
      const base = studyBench === 'body'
        ? PineLooks.randomCharacter({ base:'child', seed:3418494998, release:PineLooks.gameFaceRelease }) : doc;
      const actors = [PineLooks.build(base), PineLooks.build(studyBench === 'body' ? { ...base, bodyFinish:'painted' } : PineLooks.withGameFace(base))];
      const samples = [[],[]], projection = [[],[]];
      const walk = PineMotion.actions.get('walk');
      const target = document.createElement('canvas');
      target.width = 320; target.height = 256;
      const ctx = target.getContext('2d');
      // Alternate test order and exclude the first four warm-up pairs.
      for (let frame=0;frame<24;frame++) {
        for (const side of frame % 2 ? [1,0] : [0,1]) {
          const actor = actors[side], t0 = performance.now();
          const sample = walk.sample((frame + .3)/24,actor)[0], body = actor.body, model = body.makePose(sample.pose);
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
      result[studyBench === 'body' ? 'walkingChild' : 'walkingAdult'] = {
        versions:studyBench === 'body' ? ['original ink','painted'] : [PineLooks.structureStudyRelease,PineLooks.gameFaceRelease],
        framesPerVersion:20, medianPoseAndFineBandsMs:samples.map(median), medianProjectionAndReadbackMs:projection.map(median) };
    }
    $('qa').textContent = JSON.stringify(result);
  } catch (err) { $('qa').textContent = 'FAIL ' + err.stack; }
}

const dir = mkdtempSync(join(tmpdir(), 'pine-figure-qa-')), root = resolve(__dirname, '..');
try {
  const file = join(dir, 'page.html');
  const page = readFileSync(join(root, 'figure-study.html'), 'utf8')
    .replace('<head>', '<head><base href="' + pathToFileURL(root+sep).href + '"><script>localStorage.setItem("pine.figureStudy.1.18.0-1.19.0.v1",JSON.stringify({salt:77,votes:{"adult/0":"b"}}))</script>')
    .replace('</body>', '<output id="qa"></output><script>window.addEventListener("load",()=>(' +
      check.toString() + ')(' + JSON.stringify(process.argv.includes('--bench-body') ? 'body' : process.argv.includes('--bench')) + '));</script></body>');
  writeFileSync(file, page);
  const chrome = process.env.CHROME_BIN || (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
  const flags = ['--headless','--disable-gpu','--no-first-run','--force-device-scale-factor=1','--window-size=1100,850',
    '--user-data-dir=' + join(dir,'profile'),'--dump-dom',pathToFileURL(file).href];
  if (process.env.CI === 'true' && process.platform === 'linux') flags.unshift('--no-sandbox');
  for (const query of ['?subject=baby&bearing=270&before=1.19.0', '?mode=blind&resume=1', '?mode=blind&review=cast&case=child%2F5&resume=cast']) {
    const args = [...flags.slice(0,-1), flags.at(-1) + query];
    const r = spawnSync(chrome, args, { encoding:'utf8', maxBuffer:4000000, timeout:120000 });
    const msg = r.stdout?.match(/<output id="qa">([^<]*)<\/output>/)?.[1];
    assert.ok(r.status === 0 && msg && !msg.startsWith('FAIL'), msg || r.error?.message || r.stderr?.slice(-1500));
    console.log('Figure study passed', msg);
  }
} finally { rmSync(dir, { recursive:true, force:true, maxRetries:3 }); }
