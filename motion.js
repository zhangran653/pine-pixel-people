const hikerMotion = (() => {
  const minX = -79, maxX = 79, strideLength = 9.2, rad = Math.PI / 180;
  const clamp = (x, low = 0, high = 1) => Math.max(low, Math.min(high, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const ramp = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const close = (a, b) => Math.abs(a - b) < .00001;
  const between = (a, b, t) => a.map((x, i) => mix(x, b[i], t));
  const plus = (a, b, amount = 1) => a.map((x, i) => x + amount * b[i]);
  const unit = v => { const length = Math.hypot(...v) || 1; return v.map(n => n / length); };

  // Rigid parts retain the coordinates used to paint their rest pose.
  function frame(pivot, offset, yaw, pitch, roll) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const m = [cy*cp, cy*sp*sr-sy*cr, cy*sp*cr+sy*sr, 0,
      sy*cp, sy*sp*sr+cy*cr, sy*sp*cr-cy*sr, 0, -sp, cp*sr, cp*cr, 0];
    for (let i = 0; i < 3; i++) {
      const j = i*4;
      m[j+3] = pivot[i] + offset[i] - (m[j]*pivot[0]+m[j+1]*pivot[1]+m[j+2]*pivot[2]);
    }
    return m;
  }
  function point(m, p) {
    const [x,y,z] = p;
    return [m[0]*x+m[1]*y+m[2]*z+m[3], m[4]*x+m[5]*y+m[6]*z+m[7], m[8]*x+m[9]*y+m[10]*z+m[11]];
  }
  function compose(outer, inner) {
    const out = [];
    for (let row = 0; row < 12; row += 4) {
      for (let col = 0; col < 4; col++) {
        out.push(outer[row]*inner[col]+outer[row+1]*inner[col+4]+outer[row+2]*inner[col+8]+(col===3?outer[row+3]:0));
      }
    }
    return out;
  }

  // Intersect the two bone lengths in the plane selected by the bend direction.
  function joint(start, end, upper, lower, bendDirection) {
    const delta = end.map((x,i) => x-start[i]), length = Math.hypot(...delta);
    const n = length > .0001 ? delta.map(x=>x/length) : [0,0,-1];
    const d = clamp(length, Math.abs(upper-lower)+.0001, upper+lower);
    const along = (upper*upper-lower*lower+d*d)/(2*d);
    const bend = Math.sqrt(Math.max(0, upper*upper-along*along));
    const dot = bendDirection.reduce((sum,x,i)=>sum+x*n[i],0);
    const pole = unit(plus(bendDirection,n,-dot));
    return plus(plus(start,n,along),pole,bend);
  }
  // Carry a downward elbow around with the reaching arm. In the torso's frame a
  // hand pointing forward bends the elbow down; a hanging hand bends it back.
  function armPole(torso, reach, side, armLength) {
    const distance = Math.hypot(...reach);
    const n = distance ? reach.map(v => v/distance) : [-torso[2],-torso[6],-torso[10]];
    const x = torso[0]*n[0] + torso[4]*n[1] + torso[8]*n[2];
    const y = torso[1]*n[0] + torso[5]*n[1] + torso[9]*n[2];
    const z = torso[2]*n[0] + torso[6]*n[1] + torso[10]*n[2];
    const out = side*y;
    const extension = Math.min(1,distance/armLength);
    // In a forward-and-outward reach the elbow hangs mostly below the hand.
    // Swivel a little when lifting, and further when wrapping around the ribs.
    const swivel = .15 + extension*(.54*Math.max(0,-z) + .22*Math.max(0,z)
      + .42*Math.max(0,out) + 1.18*Math.max(0,-out));
    const sin = Math.sin(swivel), down = -Math.cos(swivel);
    // Parallel-transport that bend by the shortest rotation from [.8,.6,0]
    // (forward, outward, up). Its antipode lies behind and across the torso.
    const denominator = 1 + .8*x + .6*out;
    const k = denominator > .00001 ? ((-.6*x+.8*out)*sin + z*down)/denominator : 0;
    const forward = -.6*sin-k*(x+.8), outward = side*(.8*sin-k*(out+.6)), up = down-k*z;
    return [0,4,8].map(row => torso[row]*forward + torso[row+1]*outward + torso[row+2]*up);
  }
  // In a relaxed stand the thigh starts a little higher inside the pelvis.
  // Keep some leg reach in reserve so the knees can still soften with the breath.
  function standingHipLift(hipX, hipZ, ankleZ, thigh, shin) {
    const reach = thigh + shin;
    const verticalReach = Math.sqrt(Math.max(0, reach * reach - hipX * hipX));
    const slack = Math.max(0, verticalReach - (hipZ - ankleZ));
    return Math.min(0.04 * reach, 0.65 * slack);
  }
  const hikerHipLift = standingHipLift(-.4, 19.5, 3.1, 8.7, 8.45);
  function leg(side, ankle, bob = 0) {
    const hip = [-.4, side*3.05, 19.5+bob];
    const slack = 17.15 - Math.hypot(...ankle.map((v, i) => v - hip[i]));
    hip[2] += Math.min(hikerHipLift, Math.max(0, slack));
    return {hip, knee:joint(hip,ankle,8.7,8.45,[1,0,0])};
  }
  const waveKeys = [
    [0,0,118,60], [.23,.96,117,65], [.34,1,122,47], [.47,1,120,83],
    [.60,1,122,47], [.73,1,120,83], [.81,.96,118,65], [1,0,118,60],
  ];
  function waveAt(t) {
    if (t === null) return [0,0,0];
    const end = waveKeys.findIndex((k,i)=>i>0 && k[0]>=t);
    const a=waveKeys[end-1], b=waveKeys[end], w=ramp(t,a[0],b[0]);
    return [mix(a[1],b[1],w),mix(a[2],b[2],w)*rad,mix(a[3],b[3],w)*rad];
  }
  function arm(side, stride, torso, wave) {
    const reach = -side*stride, weight = side===-1 ? wave[0] : 0;
    const shoulder = [.3+.36*reach,side*5.65,31.8];
    function extend(from, length, spread, forward) {
      return [from[0]+length*Math.sin(forward), from[1]+side*length*Math.cos(forward)*Math.sin(spread),
        from[2]-length*Math.cos(forward)*Math.cos(spread)];
    }
    const spread = mix(.22,wave[1],weight), foreSpread = spread+mix(-.16,wave[2],weight);
    const fore = mix(.29+.63*reach,.14,weight);
    const elbow = extend(shoulder,6.78,spread,mix(.04+.50*reach,.27,weight));
    const wrist = extend(elbow,5.8,foreSpread,fore), hand = extend(wrist,1.32,foreSpread,fore);
    return {side,shoulder:point(torso,shoulder),elbow:point(torso,elbow),wrist:point(torso,wrist),hand:point(torso,hand)};
  }
  function reachFor(chain, target, weight, torso) {
    if (weight <= 0) return chain;
    let hand = between(chain.hand,target,weight);
    const reach = plus(hand,chain.shoulder,-1);
    if (Math.hypot(...reach)>13.90) hand=plus(chain.shoulder,unit(reach),13.90);
    const pole=between(unit(plus(chain.elbow,chain.shoulder,-1)),unit(armPole(torso,reach,chain.side,13.90)),weight);
    const elbow = joint(chain.shoulder,hand,6.78,7.12,pole);
    return {...chain,hand,elbow,wrist:between(elbow,hand,5.8/7.12)};
  }

  function flask(torso, head, clock) {
    const dock = point(torso,[-4.85,-6.65,26.8]);
    const mouth = point(head,[5.6,-.45,37.6]);
    const pull = ramp(clock,.49,1.26)*(1-ramp(clock,2.26,3.08));
    const tilt = ramp(clock,.88,1.50)*(1-ramp(clock,2.17,2.76));
    const lift = Math.sin(Math.PI*pull);
    const lip = between(dock,mouth,pull);
    // The hand draws the flask around the outside of the jacket.
    lip[0] += 2.25*lift;
    lip[1] -= 3.05*lift;
    const upright = unit(plus(dock,point(torso,[-4.85,-6.65,25.8]),-1));
    const tipped = unit([-.94,.25,-.23]);
    const axis = unit(between(upright,tipped,tilt));
    const base = plus(lip,axis,-6.8);
    const grip = plus(lip,axis,-3.6);
    grip[1] += 1.05;
    const weight = ramp(clock,0,.44)*(1-ramp(clock,3.10,3.56));
    return {base,lip,grip,weight,held:clock>=.43 && clock<3.12};
  }

  function create(pathY, start = -12, options = {}) {
    const seat = options.seat || {x:-12,y:pathY(-12)+8,height:5,heading:-Math.PI/2};
    const feetAt = [start,start], lifts = [0,0];
    let size = clamp(options.size ?? 1,.45,1.1), ambient = options.ambient ?? true;
    let facing=1, preferredFoot=1, destination=null, step=null, turn=null, pulse=0;
    let wantsSeat=false, align=0, lower=0, swayOn=false, sway=0, restful=1;
    let gesture=null, gestureTime=0, clock=0, idleRequest=null;
    const rootX = () => (feetAt[0]+feetAt[1])/2;
    const tangent = x => Math.atan2(pathY(x+.1)-pathY(x-.1),.2);
    const walking = () => !!step || !!turn;
    function destinationAt(target) {
      destination = clamp(target,minX,maxX);
      if (!walking() && close(destination,rootX()) && close(feetAt[0],feetAt[1])) destination=null;
    }
    function go(target) { wantsSeat=false; destinationAt(target); }
    function stand(animate = false) {
      wantsSeat=false;destination=null;swayOn=false;
      if (animate && !ambient) idleRequest=clock;
    }
    function toggleSeat() {
      if (wantsSeat) { stand(); return; }
      wantsSeat=true;
      if (align===0 && lower===0) destinationAt(seat.x);
      else destination=null;
    }
    function chooseStep() {
      if (step || turn) return;
      const together=close(feetAt[0],feetAt[1]);
      const direction=destination===null?0:Math.sign(destination-rootX());
      if (together) {
        if (!direction || close(destination,rootX())) { destination=null; return; }
        if (direction!==facing) { turn={elapsed:0,duration:.35}; return; }
      }
      const i=together?preferredFoot:((feetAt[0]-feetAt[1])*facing<0?0:1);
      const planted=feetAt[1-i], stride=strideLength*size;
      let landing=planted;
      if (direction===facing && facing*(destination-planted)>0)
        landing+=facing*Math.min(stride,Math.abs(destination-planted));
      if (close(feetAt[i],landing)) { destination=null; return; }
      const travel=Math.abs(landing-feetAt[i]);
      step={i,from:feetAt[i],to:landing,elapsed:0,duration:.29+.25*Math.min(1,travel/(2*stride)),lift:3.8*Math.min(1,travel/stride)};
      preferredFoot=1-i;
    }
    function advanceWalk(dt) {
      let remaining=dt;
      while (remaining>1e-8) {
        chooseStep();
        if (turn) {
          const used=Math.min(remaining,turn.duration-turn.elapsed);
          turn.elapsed+=used; remaining-=used;
          if (turn.elapsed>=turn.duration-1e-8) { facing=-facing; turn=null; }
        } else if (step) {
          const used=Math.min(remaining,step.duration-step.elapsed);
          step.elapsed+=used; remaining-=used;
          const t=clamp(step.elapsed/step.duration);
          pulse=Math.sin(Math.PI*t); lifts[step.i]=step.lift*pulse;
          feetAt[step.i]=mix(step.from,step.to,ease(t));
          if (t>=1-1e-8) { feetAt[step.i]=step.to;lifts[step.i]=0;pulse=0;step=null; }
        } else break;
      }
      chooseStep();
    }
    function advance(dt) {
      clock+=dt;
      if (idleRequest!==null && clock-idleRequest>=5.8) idleRequest=null;
      if (gesture) {
        gestureTime+=dt;
        if (gestureTime >= (gesture==='drink'?3.56:1.45)-1e-8) {gesture=null;gestureTime=0;}
      }
      if (!wantsSeat && (lower>0 || align>0)) {
        if (lower>0) lower=Math.max(0,lower-dt/.90);
        else align=Math.max(0,align-dt/.72);
      } else {
        if (align===0 && lower===0) advanceWalk(dt);
        if (wantsSeat && destination===null && !walking()) {
          if (align<1) align=Math.min(1,align+dt/.72);
          else lower=Math.min(1,lower+dt/1.02);
        }
      }
      const resting=!walking() && destination===null;
      restful = clamp(restful+(resting?1:-1)*dt/.38);
      sway = clamp(sway+(swayOn?1:-1)*dt/.55);
    }
    function setSize(value) {
      if (!Number.isFinite(value)) return;
      const next=clamp(value,.45,1.1), ratio=next/size;
      if (close(ratio,1)) return;
      // During a stride the support boot anchors the resize.
      const anchor=step?feetAt[1-step.i]:rootX();
      const resizePoint=x=>clamp(anchor+(x-anchor)*ratio,minX,maxX);
      feetAt[0]=resizePoint(feetAt[0]); feetAt[1]=resizePoint(feetAt[1]);
      if (step) {
        step.from=resizePoint(step.from);step.to=resizePoint(step.to);
        feetAt[step.i]=mix(step.from,step.to,ease(clamp(step.elapsed/step.duration)));
      }
      size=next;
    }
    function sample() {
      const roadX=rootX(), roadY=pathY(roadX);
      const forward=tangent(roadX)+(facing<0?Math.PI:0)+(turn?Math.PI*ease(turn.elapsed/turn.duration):0);
      const towardBench=ease(align), seated=ease(lower);
      const delta=seat.heading-forward;
      const heading=forward+Math.atan2(Math.sin(delta),Math.cos(delta))*towardBench;
      const c=Math.cos(heading), s=Math.sin(heading);
      // Move one foot at a time. Their final positions put the hips over the fixed seat.
      const back=7.85, bx=seat.x+Math.cos(seat.heading)*back*size, by=seat.y+Math.sin(seat.heading)*back*size;
      const x=mix(roadX,bx,towardBench), y=mix(roadY,by,towardBench);
      const feet=feetAt.map((u,i)=>{
        const lateral=(i===0?-1:1)*3.05*size;
        const a=turn?forward:tangent(u)+(facing<0?Math.PI:0);
        const w=ramp(align,i*.5,i*.5+.5);
        const fx=mix(u-Math.sin(a)*lateral,bx-Math.sin(seat.heading)*lateral,w)-x;
        const fy=mix(pathY(u)+Math.cos(a)*lateral,by+Math.cos(seat.heading)*lateral,w)-y;
        return [(c*fx+s*fy)/size,(-s*fx+c*fy)/size,3.1+lifts[i]+1.8*Math.sin(Math.PI*w)];
      });
      const stride=clamp((feet[1][0]-feet[0][0])/strideLength,-1,1);
      const elapsed=idleRequest===null?0:clock-idleRequest;
      const idleMotion=ambient?1:ramp(elapsed,0,.35)*(1-ramp(elapsed,5.25,5.8));
      const idle=ease(restful), breath=idleMotion*Math.sin(clock*1.72);
      const swayWave=Math.sin(clock*1.28)+.23*Math.sin(clock*.79+.6);
      const shift=idle*(.19*idleMotion*Math.sin(clock*.97)+1.08*sway*swayWave);
      const bob=.43*pulse-.39*Math.abs(stride)*(1-towardBench);
      const drop=(seat.height/size+3.10-19.2)*seated;
      const pitch=.235*Math.sin(seated*Math.PI)+.035*seated+.013*idle*breath;
      const torso=frame([-.15,0,19.2],[-(back-.15)*seated,shift*(1-.66*seated),drop+bob+.13*(breath-idleMotion)*idle*(1-seated)],0,pitch,-shift*.037);
      const hipZ=19.5+hikerHipLift*idle*(1-seated);
      // Bend at the hips on a long placement step instead of stretching a planted leg.
      feet.forEach((ankle,i)=>{
        const hip=point(torso,[-.4,(i===0?-1:1)*3.05,hipZ]);
        const across=(ankle[0]-hip[0])**2+(ankle[1]-hip[1])**2;
        const height=Math.sqrt(Math.max(0,17.15**2-across));
        torso[11]-=Math.max(0,hip[2]-ankle[2]-height);
      });
      const p=clock%13.4;
      const glance=((ramp(p,3.15,3.87)-ramp(p,4.55,5.45))*.20-(ramp(p,8.35,9.13)-ramp(p,9.72,10.6))*.14)*idle*idleMotion;
      const blinkPhase=clock%4.87;
      const blink=idleMotion*ramp(blinkPhase,1.55,1.64)*(1-ramp(blinkPhase,1.70,1.82));
      const drinkClock=gesture==='drink'?gestureTime:0;
      const sipping=ramp(drinkClock,.87,1.48)*(1-ramp(drinkClock,2.20,2.81));
      const head=compose(torso,frame([.2,0,34.5],[0,0,0],glance*(1-sipping)-.08*sipping,-.045*glance-.15*sipping-.005*breath*idle,shift*.014));
      const legs=feet.map((ankle,i)=>{
        const hip=point(torso,[-.4,(i===0?-1:1)*3.05,hipZ]);
        return {hip,knee:joint(hip,ankle,8.7,8.45,[1,0,0])};
      });
      const wave=waveAt(gesture==='wave'?clamp(gestureTime/1.45):null);
      const bottle=flask(torso,head,drinkClock);
      const arms=[-1,1].map((side,i)=>{
        let chain=arm(side,stride,torso,wave);
        const lap=between(legs[i].hip,legs[i].knee,.80);
        lap[1]+=side*.40; lap[2]+=2.50;
        chain=reachFor(chain,lap,seated*(side===-1?1-wave[0]:1),torso);
        if (i===0) chain=reachFor(chain,bottle.grip,bottle.weight,torso);
        return chain;
      });
      let posture='standing';
      if (wantsSeat) posture=lower>=1?'seated':align>=1?'sitting':align>0?'positioning':'approaching';
      else if (lower>0 || align>0) posture='rising';
      return {x,y,roadX,heading,feet,legs,arms,torso,head,bottle,blink,bob,size,posture,seatLevel:seated,
        aligning:align>0,sway:swayOn,gesture,wave:gesture==='wave',walking:walking(),turning:!!turn,destination,
        support:step?1-step.i:null};
    }
    const active=()=>destination!==null || walking() || gesture!==null || (wantsSeat?lower<1:lower>0||align>0);
    function startGesture(name) { if (!gesture) { gesture=name;gestureTime=0; } }
    return {
      go,advance,sample,setSize,stand,sit:toggleSeat,
      stop() { wantsSeat=false;destination=null; },
      toggle() {
        if (destination!==null) {wantsSeat=false;destination=null;return;}
        const x=rootX();
        go(close(x,minX)||(facing>0 && !close(x,maxX))?maxX:minX);
      },
      toggleSway() { swayOn=!swayOn; if (swayOn && !wantsSeat) destination=null; },
      wave() {startGesture('wave');}, drink() {startGesture('drink');},
      setAmbient(value) { ambient=value; },
      get active() {return active();},
      get animating() {return ambient || idleRequest!==null || swayOn || sway>0 || active();},
    };
  }
  return {create,leg,minX,maxX, geometry:{frame,point,compose,joint,armPole,standingHipLift}};
})();
