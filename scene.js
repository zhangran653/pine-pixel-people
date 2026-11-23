(() => {
  const id = name => document.getElementById(name);
  const canvas = id('trail-scene');
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  const cut = id('pose-slice').getContext('2d');
  const portrait = id('portrait'), portraitContext=portrait.getContext('2d',{willReadFrequently:true});
  const cast = new Map([
    ['hiker',{name:'红帽徒步者',body:hikerActor}],
    ['surveyor',{name:'山野测绘员',body:createSliceActor(surveyorArt,2)}],
  ]);
  const characterButtons=[...document.querySelectorAll('[data-character]')];
  const sizeSlider = id('character-size');
  const motionPref = matchMedia('(prefers-reduced-motion: reduce)');
  const linkedCharacter = new URL(location.href).searchParams.get('character');
  let savedCharacter;
  try {
    savedCharacter = localStorage.getItem('pineCreek.character');
    const saved = Number(localStorage.getItem('pineCreek.characterSize'));
    if (Number.isInteger(saved) && saved >= 45 && saved <= 110) sizeSlider.value = saved;
  } catch { /* The page also works when browser storage is unavailable. */ }
  const movement = hikerMotion.create(hikerTrail.pathY, -12, {
    seat:hikerTrail.restSpot, size:sizeSlider.valueAsNumber/100, ambient:!motionPref.matches,
  });
  const ground = document.createElement('canvas');
  const groundContext = ground.getContext('2d', { alpha: false, willReadFrequently: true });
  const scenery = document.createElement('canvas'), sceneryContext=scenery.getContext('2d',{willReadFrequently:true});
  const destinations = [...document.querySelectorAll('[data-destination]')];
  const angle = id('camera-angle'), levels = id('slice-level'), inspect = id('inspector');
  let cutHeight=(levels.valueAsNumber-.5)/Number(levels.max);
  const rad = Math.PI / 180, tick = 1/20;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  let character=cast.has(linkedCharacter)?linkedCharacter:cast.has(savedCharacter)?savedCharacter:'hiker';
  let actor=cast.get(character).body;
  let yaw = -60*rad, elevation = 25*rad, pose = movement.sample(), model = actor.makePose(pose);
  let viewWidth=480, viewHeight=245;
  let framingX = pose.roadX;
  let frozen = false, dirty = true, previous = 0, accumulator = 0, request = 0, drag = null;
  let cachedView = null, cachedProps = [];

  function camera() {
    const width=viewWidth, height=viewHeight;
    const scale = Math.min(width/192, height/151, 1.82);
    const follow = clamp((365-width)/180,0,.83);
    const aimX = framingX*follow, aimY = hikerTrail.pathY(framingX)*follow;
    const cx = width*.50, cy = height*.66;
    const a=Math.cos(yaw), b=Math.sin(yaw), s=Math.sin(elevation), c=Math.cos(elevation);
    return { width, height, scale, yaw, elevation, aimX, aimY,
      project(x, y, z = 0) {
        const dx=x-aimX, dy=y-aimY, toward=a*dx+b*dy;
        return {x:cx+scale*(-b*dx+a*dy), y:cy+scale*(s*toward-c*z), depth:c*toward+s*z};
      },
      groundPoint(screenX, screenY) {
        const across=(screenX-cx)/scale, toward=(screenY-cy)/(scale*s);
        return [aimX-b*across+a*toward, aimY+a*across+b*toward];
      },
    };
  }

  function shadow(ctx,view) {
    const scale=view.scale*pose.size;
    const body=pose.torso, c=Math.cos(pose.heading), s=Math.sin(pose.heading);
    const hipX=body[2]*19.2+body[3], hipY=body[6]*19.2+body[7];
    const center=view.project(pose.x+pose.size*(c*hipX-s*hipY),pose.y+pose.size*(s*hipX+c*hipY));
    ctx.save(); ctx.fillStyle='#26382c'; ctx.globalAlpha=.21;
    ctx.beginPath();ctx.ellipse(center.x+2*scale,center.y+scale,8.5*scale,3.2*scale,0,0,2*Math.PI);ctx.fill();
    for (const [fx,fy,fz] of pose.feet) {
      const p=view.project(pose.x+pose.size*(c*fx-s*fy),pose.y+pose.size*(s*fx+c*fy),0);
      ctx.globalAlpha=clamp(.34-(fz-3.1)*.062,.04,.34);
      ctx.beginPath();ctx.ellipse(p.x,p.y,3.3*scale,1.5*scale,0,0,2*Math.PI);ctx.fill();
    }
    ctx.restore();
  }

  function render() {
    const v = camera();
    const changed = !cachedView || ['width','height','scale','yaw','elevation','aimX','aimY'].some(k=>v[k]!==cachedView[k]);
    if (changed) {
      if (ground.width!==v.width || ground.height!==v.height) {
        ground.width=v.width;ground.height=v.height;
      }
      groundContext.resetTransform();groundContext.globalAlpha=1;groundContext.imageSmoothingEnabled=false;
      hikerTrail.drawGround(groundContext,v);
      cachedProps=hikerTrail.props(v).sort((a,b)=>a.depth-b.depth);
      cachedView=v;
    }
    // Keep the landscape on its original pixel grid. Composite the finer actor at
    // display resolution between the scenery behind it and the scenery in front.
    const detailed=actor.density>1;
    const landscape=detailed?sceneryContext:ctx;
    if(detailed && (scenery.width!==v.width || scenery.height!==v.height)) {
      scenery.width=v.width;scenery.height=v.height;
    }
    ctx.resetTransform();ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;
    landscape.resetTransform();landscape.globalAlpha=1;landscape.imageSmoothingEnabled=false;
    landscape.drawImage(ground,0,0);
    shadow(landscape,v);
    const base=v.project(pose.x,pose.y);
    let personPainted=false;
    function person() {
      if(detailed) {
        ctx.drawImage(scenery,0,0,canvas.width,canvas.height);
        landscape.clearRect(0,0,v.width,v.height);
      }
      const sx=canvas.width/v.width, sy=canvas.height/v.height;
      actor.draw(ctx,model,base.x*sx,base.y*sy,v.yaw-pose.heading,v.elevation,v.scale*pose.size*sx);
      personPainted=true;
    }
    for (const prop of cachedProps) {
      if (!personPainted && prop.depth>base.depth) person();
      landscape.save();
      if (personPainted && prop.height>30 && Number.isFinite(prop.baseX)) {
        const foot=v.project(prop.baseX,prop.baseY);
        if (Math.abs(foot.x-base.x)<v.scale*15*pose.size && foot.y-prop.height*v.scale*Math.cos(v.elevation)<base.y-v.scale*15*pose.size) landscape.globalAlpha=.50;
      }
      prop.paint(landscape);
      landscape.restore();
    }
    if (!personPainted) person();
    else if (detailed) ctx.drawImage(scenery,0,0,canvas.width,canvas.height);
    if (inspect.open) {
      const dpr=pixelRatio(portrait), w=Math.max(1,Math.round(portrait.clientWidth*dpr)), h=Math.max(1,Math.round(portrait.clientHeight*dpr));
      if(portrait.width!==w || portrait.height!==h){portrait.width=w;portrait.height=h;}
      portraitContext.clearRect(0,0,w,h);
      actor.draw(portraitContext,model,w*.50,h*.915,v.yaw-pose.heading,v.elevation,Math.min(w/42,h/54));
      actor.drawSlice(cut,model,levels.valueAsNumber);
    }
  }

  function readouts() {
    const place=pose.seatLevel>.1 ? '溪边木凳' : pose.x < -52 ? '林间营地' : pose.x < 3 ? '桥西小径' : pose.x < 26 ? '溪上木桥' : pose.x < 57 ? '桥东小径' : '松林路标';
    const resting={approaching:'去木凳',positioning:'转向木凳',sitting:'坐下中',seated:'坐着休息',rising:'起身中'};
    const active=resting[pose.posture] || (pose.turning?'转身':pose.walking?'行走':'自然站立');
    const status=[frozen?'定格':'',active,pose.sway&&!pose.walking?'轻晃':'',pose.wave?'挥手':pose.gesture==='drink'?'喝水':''].filter(Boolean).join(' · ');
    if (id('area').textContent!==place) id('area').textContent=place;
    if (id('action-status').textContent!==status) id('action-status').textContent=status;
    id('walk').textContent=pose.destination!==null?'停下':'沿路散步';
    id('freeze').textContent=frozen?'继续':'定格';
    id('freeze').setAttribute('aria-pressed',String(frozen));
    id('freeze').disabled=!frozen && !movement.animating;
    id('wave').disabled=!!pose.gesture;
    id('drink').disabled=!!pose.gesture;
    const atSeat=pose.posture!=='standing' && pose.posture!=='rising';
    id('sit').textContent=pose.posture==='approaching'?'取消落座':atSeat?'起身':'坐下';
    id('sit').setAttribute('aria-pressed',String(atSeat));
    id('sit').title=atSeat?id('sit').textContent:'到溪边的木凳坐下';
    id('sway').setAttribute('aria-pressed',String(pose.sway));
    id('route-position').style.left=(pose.x-hikerMotion.minX)/(hikerMotion.maxX-hikerMotion.minX)*100+'%';
    for(const b of destinations) b.setAttribute('aria-pressed',String(pose.destination===Number(b.dataset.destination)));
    id('bearing-value').textContent=angle.value+'°';
    angle.setAttribute('aria-valuetext',angle.value+' 度');
    id('slice-value').textContent=levels.value+' / '+actor.nz;
    levels.setAttribute('aria-valuetext','第 '+levels.value+' 层');
    id('size-value').textContent=sizeSlider.value+'%';
    sizeSlider.setAttribute('aria-valuetext',sizeSlider.value+'%');
  }

  function schedule() { if(!request) request=requestAnimationFrame(frame); }
  function invalidate() { dirty=true; schedule(); }
  function frame(time) {
    request=0;
    if(document.hidden){previous=0;return;}
    if(!frozen && movement.animating) {
      accumulator+=previous?clamp((time-previous)/1000,0,.12):0;
      let advanced=false;
      while(accumulator+1e-9>=tick) {
        movement.advance(tick);accumulator=Math.max(0,accumulator-tick);advanced=true;
        if(!movement.animating){accumulator=0;break;}
      }
      if(advanced){
        const next=movement.sample();
        if(next.roadX!==pose.roadX) framingX=next.roadX;
        pose=next;model=actor.makePose(pose);dirty=true;
      }
    }
    if(dirty){render();readouts();dirty=false;}
    previous=!frozen && movement.animating ? time : 0;
    if(previous) schedule();
  }
  function command(fn) {
    if(frozen){frozen=false;previous=0;accumulator=0;}
    fn();
    pose=movement.sample();
    readouts();invalidate();
  }
  function toggleFreeze() {
    if(!movement.animating && !frozen) return;
    frozen=!frozen;previous=0;accumulator=0;readouts();invalidate();
  }
  function pixelRatio(surface) {
    const cssPixels=Math.max(1,surface.clientWidth*surface.clientHeight);
    return Math.min(window.devicePixelRatio || 1, Math.sqrt(4194304/cssPixels));
  }
  function resize() {
    viewWidth=Math.max(1,Math.round(canvas.clientWidth/2.10));viewHeight=Math.max(1,Math.round(canvas.clientHeight/2.10));
    const detailed=actor.density>1, dpr=pixelRatio(canvas);
    const w=detailed?Math.max(1,Math.round(canvas.clientWidth*dpr)):viewWidth;
    const h=detailed?Math.max(1,Math.round(canvas.clientHeight*dpr)):viewHeight;
    if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;}
    invalidate();
  }
  function setBearing(value) {
    const wrapped=((value%360)+360)%360;
    angle.value=(value===360?360:Math.round(wrapped)%360);
    yaw=wrapped*rad;readouts();invalidate();
  }

  function syncCharacter() {
    levels.max=actor.nz;levels.value=Math.min(actor.nz,Math.floor(cutHeight*actor.nz)+1);
    cut.canvas.width=actor.nx;cut.canvas.height=actor.ny;
    for(const b of characterButtons) b.setAttribute('aria-pressed',String(b.dataset.character===character));
    canvas.setAttribute('aria-label','松林、溪流与木桥边的'+cast.get(character).name);
    portrait.setAttribute('aria-label',cast.get(character).name+'的当前姿势，拖动或用左右键环视');
    resize();readouts();
  }
  for(const b of characterButtons) b.addEventListener('click',()=>{
    if(character===b.dataset.character) return;
    character=b.dataset.character;actor=cast.get(character).body;
    model=actor.makePose(pose);
    try { localStorage.setItem('pineCreek.character',character); } catch { /* Optional preference. */ }
    const url=new URL(location.href);url.searchParams.set('character',character);
    try { history.replaceState(null,'',url); } catch { /* Local-file navigation can be restricted. */ }
    syncCharacter();
  });

  angle.addEventListener('input',()=>setBearing(angle.valueAsNumber));
  sizeSlider.addEventListener('input',()=>{
    movement.setSize(sizeSlider.valueAsNumber/100);
    pose=movement.sample();model=actor.makePose(pose);readouts();invalidate();
  });
  sizeSlider.addEventListener('change',()=>{
    try { localStorage.setItem('pineCreek.characterSize',sizeSlider.value); } catch { /* Optional preference. */ }
  });
  motionPref.addEventListener('change',()=>{
    movement.setAmbient(!motionPref.matches);
    pose=movement.sample();model=actor.makePose(pose);invalidate();
  });
  levels.addEventListener('input',()=>{cutHeight=(levels.valueAsNumber-.5)/actor.nz;readouts();invalidate();});
  inspect.addEventListener('toggle',invalidate);
  id('walk').addEventListener('click',()=>command(()=>movement.toggle()));
  id('stand').addEventListener('click',()=>command(()=>movement.stand(true)));
  id('sit').addEventListener('click',()=>command(()=>movement.sit()));
  id('drink').addEventListener('click',()=>command(()=>movement.drink()));
  id('sway').addEventListener('click',()=>command(()=>movement.toggleSway()));
  id('wave').addEventListener('click',()=>command(()=>movement.wave()));
  id('freeze').addEventListener('click',toggleFreeze);
  for(const b of destinations) b.addEventListener('click',()=>command(()=>movement.go(Number(b.dataset.destination))));
  window.addEventListener('keydown',e=>{
    if(e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,textarea,select,[contenteditable]')) return;
    if(e.code==='Space' && !e.target.closest('button,a,summary')){e.preventDefault();command(()=>movement.toggle());}
    else if(e.code==='KeyH'){e.preventDefault();command(()=>movement.wave());}
    else if(e.code==='KeyP'){e.preventDefault();toggleFreeze();}
    else if((e.target===canvas || e.target===portrait) && (e.code==='ArrowLeft'||e.code==='ArrowRight')) {
      e.preventDefault();setBearing(yaw/rad+(e.code==='ArrowLeft'?-10:10));
    }
  });
  for(const surface of [canvas,portrait]) {
    surface.addEventListener('pointerdown',e=>{
      if(!e.isPrimary || e.button!==0)return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,bearing:yaw/rad,elevation,moved:false};
      surface.setPointerCapture(e.pointerId);surface.classList.add('drag');
    });
    surface.addEventListener('pointermove',e=>{
      if(drag?.id!==e.pointerId)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(!drag.moved && Math.hypot(dx,dy)<5)return;
      drag.moved=true;elevation=clamp(drag.elevation+dy/surface.clientHeight*.68,17*rad,42*rad);
      setBearing(drag.bearing-dx/surface.clientWidth*360);
    });
    surface.addEventListener('lostpointercapture',()=>{drag=null;surface.classList.remove('drag');});
  }
  canvas.addEventListener('pointerup',e=>{
    if(drag?.id!==e.pointerId || drag.moved)return;
    const rect=canvas.getBoundingClientRect(),v=camera();
    const sx=(e.clientX-rect.left)*v.width/rect.width, sy=(e.clientY-rect.top)*v.height/rect.height;
    const bench=cachedProps.find(prop=>prop.seat)?.seat;
    if(bench) {
      const [bx,by]=v.groundPoint(sx,sy+v.scale*Math.cos(v.elevation)*bench.height);
      if(Math.abs(bx-bench.x)<=bench.width/2 && Math.abs(by-bench.y)<=bench.depth/2) {
        if(pose.posture==='standing'||pose.posture==='rising') command(()=>movement.sit());
        return;
      }
    }
    const [wx,wy]=v.groundPoint(sx,sy);
    let nearest=0,best=Infinity;
    for(let x=hikerMotion.minX;x<=hikerMotion.maxX;x++) {
      const d=(x-wx)**2+(hikerTrail.pathY(x)-wy)**2;
      if(d<best){best=d;nearest=x;}
    }
    if(best<14**2)command(()=>movement.go(nearest));
  });
  document.addEventListener('visibilitychange',()=>{previous=0;accumulator=0;if(!document.hidden)invalidate();});
  new ResizeObserver(resize).observe(canvas.parentElement);
  function watchPixelRatio() {
    matchMedia('(resolution: '+window.devicePixelRatio+'dppx)').addEventListener('change',()=>{
      resize();watchPixelRatio();
    },{once:true});
  }
  watchPixelRatio();
  syncCharacter();
})();
