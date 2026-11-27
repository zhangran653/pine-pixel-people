// Score a single small action on a cast member. Landmarks follow the posed head,
// torso and legs; hand-held objects use the same frames for drawing and touch.
const shortMotion = (() => {
  const {pose, point, ramp, mix, lookAt} = studioRig;
  const {between, hand, reach, entry, prop, atGrip, contact, blink} = activityMotion;
  const reachMarks = {
    hip:[.08,.10,-.81], pocket:[.09,-.04,-.81], belt:[.23,-.32,-.73], belly:[.32,-.29,-.52],
    rib:[.20,-.08,-.31], chest:[.28,-.31,-.10], center:[.39,-.37,-.12], sternum:[.29,-.33,.02],
    collar:[.22,-.23,.18], shoulder:[.01,.02,.08], farShoulder:[.18,-.78,.08],
    farElbow:[.28,-.78,-.36], across:[.48,-.77,-.16], acrossLow:[.45,-.70,-.54],
    side:[.07,.65,-.33], sideLow:[.12,.50,-.65], wide:[.07,.91,.03], wing:[-.13,.66,.35],
    highSide:[.14,.64,.58], crown:[.14,.04,.91], overhead:[.12,.28,.93],
    upFront:[.48,.08,.68], highFront:[.66,.05,.47], eyeLine:[.50,-.09,.39],
    near:[.42,.09,-.22], forward:[.82,.04,-.11], reachOut:[.91,.22,.10],
    low:[.43,.06,-.67], lowFront:[.68,.03,-.55], shelf:[.65,.22,.34],
    offer:[.70,-.17,-.22], cup:[.40,-.18,-.32], lap:[.27,.05,-.73],
    elbowOut:[.11,.34,-.29], behind:[-.28,.21,-.51], backWaist:[-.24,-.02,-.74],
    nape:[-.17,-.13,.31], nearEar:[.10,.10,.39], nearEye:[.29,-.09,.36],
    inner:[.40,-.42,-.30], outer:[.53,.32,-.20], diagonal:[.70,-.46,.16],
    rail:[.47,.48,-.32], kneeHeight:[.30,.14,-.88], lowSide:[.38,.52,-.43],
    wristUp:[.33,.20,.46], cradle:[.37,-.25,-.47], middleHigh:[.46,-.35,.32],
    tableNear:[.56,-.12,-.47], tableFar:[.80,-.12,-.41], tableSide:[.62,.35,-.44]
  };
  const faceMarks = {
    brow:[.026,.036,.084], temple:[-.015,.090,.069], ear:[-.051,.111,.031],
    cheek:[.004,.072,.014], chin:[.009,.025,-.062], lips:[.012,.016,0],
    nose:[.025,.013,.039], forehead:[.010,.039,.125], hairline:[-.010,.071,.149]
  };
  // Offsets on an object supported by the other hand, in its own pixel space.
  const objectMarks = {
    objectCenter:[0,0,.65], objectTop:[0,0,1.75], objectLow:[0,0,-1.15],
    pageLeft:[-.48,-2.75,.95], pageRight:[-.52,2.70,.95], pageTop:[1.9,-1.6,.96],
    pageFoot:[-2.2,-1.28,.96], pageEdge:[-.50,-4.12,.83],
    rim:[1.0,-.72,1.92], farRim:[-.80,1.03,1.92], handle:[0,2.30,.45],
    screenTop:[.44,.56,1.15], screenMiddle:[.44,0,.10], screenBottom:[.44,-.35,-1.0],
    nearEdge:[.45,-1.28,.28], farEdge:[.45,1.32,.28], crownEdge:[0,-1.45,2.4],
    boxTop:[.50,-1.4,2.2], boxSide:[.10,-2.8,-.10], boxCorner:[2,-2.4,1.8]
  };
  const surfaces = {
    mug:{rim:[.95,-1.46,2.44],farRim:[-.64,1.67,2.44],handle:[3.19,0,.35]},
    bowl:{rim:[1.15,-2.24,.27],farRim:[-.71,2.35,.27],objectCenter:[0,0,.68],objectLow:[1.35,-.42,-1.95]},
    drum:{rim:[1.30,-3.13,1.92],objectTop:[0,0,2.25],objectCenter:[.32,-.56,2.26]},
    phone:{screenMiddle:[.56,0,.10],screenBottom:[.56,-.38,-1.72],screenTop:[.56,.42,1.47],nearEdge:[.55,-1.19,.15],farEdge:[.55,1.18,.15]},
    clipboard:{pageTop:[1.9,-1.6,.74],pageFoot:[-2.2,-1.28,.75],pageLeft:[-.5,-2.7,.74],pageRight:[-.5,2.7,.74]},
    parcel:{boxTop:[.75,-1.4,3.18],boxSide:[.1,-4.3,-.1],boxCorner:[2.5,-3.5,3.1],objectLow:[.3,-.65,-3.19]},
    cloth:{nearEdge:[.4,-2.48,.30],farEdge:[.45,2.4,.30],objectCenter:[0,0,.31]},
    envelope:{nearEdge:[.2,-2.5,.37],objectTop:[1.7,1.9,.41],objectCenter:[0,0,.39],farEdge:[.3,2.3,.37]}
  };
  const toolGrips = {
    book:[0,3.85,.07], notebook:[0,1.95,.12], brush:[0,0,-1.05], comb:[0,0,-1.02],
    spoon:[0,-.83,0], bowl:[-.12,1.62,-.15], camera:[-.12,1.55,-.2],
    guitar:[0,.60,0], broom:[0,0,1.9], phone:[-.30,.80,-.75], pen:[0,0,0],
    parcel:[0,2.55,-.21], drum:[0,2.75,.23], ball:[0,1.4,-.45],
    mug:[2.98,0,.22], lantern:[0,0,4.6]
  };
  const tips = {pen:[.4,0,-1.94], quill:[0,0,-2.7], stamp:[0,0,-.54], spoon:[0,2.56,.19], mallet:[0,0,2.36], ladle:[0,2.55,.06]};
  const attitudes = {
    easy:[0,0,0,0,0,0], inspect:[-.07,.10,0,-.09,.26,0], down:[0,.14,0,0,.34,0],
    read:[.04,.055,0,.12,.23,-.03], focus:[-.08,.09,-.025,-.19,.10,.02],
    reach:[-.14,.16,-.045,-.24,.01,-.035], extend:[.085,.11,.03,.14,-.08,.04],
    brace:[-.12,.23,-.06,-.10,-.08,.02], pull:[.13,-.09,.07,.16,.07,-.04],
    open:[0,-.085,0,.05,-.15,.04], shy:[.13,.05,.08,.24,.20,.12],
    listen:[-.08,.055,-.045,-.24,.015,.17], lookUp:[0,-.09,0,.14,-.39,-.04],
    turn:[.29,.03,.055,.48,.03,.035], aside:[-.23,.04,-.07,-.41,-.03,.06],
    settle:[0,.14,.035,.05,.18,-.06], present:[-.14,-.035,-.03,-.19,-.08,.07],
    sway:[.11,-.02,-.14,.17,-.04,.12], curl:[-.05,.30,.07,-.08,.21,-.08],
    proud:[.04,-.125,0,-.11,-.11,.03], recoil:[.09,-.16,-.095,.16,-.09,-.10],
    tender:[-.10,.12,-.06,-.16,.15,.115], tilt:[.045,.035,.12,.04,.07,-.20],
    twist:[-.32,.12,-.08,.23,-.09,.06], bow:[0,.36,0,0,.15,.02]
  };
  // Four times delimit the lift, the travelling stroke and the release.
  const timing = {
    reach:[.04,.28,.68,.98], tap:[.105,.32,.54,.92], stroke:[.035,.22,.77,.975],
    hold:[.025,.29,.73,.98], lift:[.065,.38,.69,.99], pulse:[.05,.22,.77,.97],
    turn:[.04,.34,.71,.99], brisk:[.075,.25,.62,.90], settle:[.04,.34,.76,.99]
  };
  const zero = [0,0,0];
  function tool(kind, position, side, weight, u, rhythm, scale) {
    const grip=toolGrips[kind] || PineWorld.items.get(kind)?.anchors.grip || zero;
    const page=kind==='book' || kind==='notebook' || kind==='clipboard' || kind==='scroll';
    const yaw=(side ? -.12 : .12) + (rhythm==='turn' ? .63 : .11)*weight;
    const pitch=page ? -.48 : kind==='phone' ? -.10 : kind==='pen' || kind==='quill' ? .21 : 0;
    const roll=(rhythm==='pulse' ? .23*Math.sin(u*Math.PI*6) : rhythm==='lift' ? -.32 : .06)*weight;
    return atGrip(kind,position,grip,scale,yaw,pitch,roll);
  }
  function mark(name, actor, body, i, other) {
    const r=actor.rig, side=i ? 1 : -1, h=r.height;
    if (name==='rest') return body.arms[i].hand;
    if (name==='matSide') return [body.feet[i][0]*.55,side*(r.hip[1]+h*.105),.022*h];
    if (name==='knee' || name==='foot') {
      const p=name==='knee' ? body.legs[i].knee : body.feet[i];
      return [p[0]+.021*h,p[1],p[2]+.037*h];
    }
    if (Object.hasOwn(objectMarks,name)) return contact(other,surfaces[other.kind]?.[name] || objectMarks[name]);
    if (Object.hasOwn(faceMarks,name)) {
      const [x,y,z]=faceMarks[name], mouth=r.mouth;
      return point(body.head,[mouth[0]+x*h,side*y*h,mouth[2]+z*h]);
    }
    return hand(r,body,i,reachMarks[name]);
  }
  function track(text) {
    const marks=(text || 'rest').split(' ');
    for(const m of marks)
      if(!['rest','foot','knee','matSide'].includes(m) && !(m in reachMarks) && !(m in faceMarks) && !(m in objectMarks))
        throw Error('未知动作落点 '+m);
    return marks;
  }
  function trace(marks, actor, body, side, other, u, times, held,finish) {
    const [start,arrive,last,end]=times, resting=held && !(marks[0] in objectMarks) ? mark(marks[0],actor,body,side,other) : body.arms[side].hand;
    if (u<=start) return resting;
    if (u<arrive) return between(resting,mark(marks[0],actor,body,side,other),ramp(u,start,arrive));
    const final=marks.length-1;
    if (u>=last) {
      const lastHand=mark(marks[final],actor,body,side,other);
      if (finish==='hold') return lastHand;
      return between(lastHand,finish==='stow'?body.arms[side].hand:resting,ramp(u,last,end));
    }
    const pos=Math.min(1,(u-arrive)/(last-arrive))*final, begin=Math.floor(pos);
    return between(mark(marks[begin],actor,body,side,other),mark(marks[Math.min(begin+1,final)],actor,body,side,other),ramp(pos-begin,0,1));
  }
  function phrase(rightText,leftText,attitude,rhythm,tools='',seat='stand',finish='',id='') {
    const right=track(rightText),left=track(leftText), [primary,support]=(tools || '').split('/'),
      angles=attitudes[attitude], times=timing[rhythm];
    if (!angles || !times) throw Error('未知动作节奏或姿态 '+attitude+' '+rhythm);
    if (right.some(m=>m in objectMarks) && !support || left.some(m=>m in objectMarks))
      throw Error('动作的接触点需要左手支撑物 '+rightText+' / '+leftText);
    const sealAt=primary==='stamp'?right.findLastIndex(m=>m in objectMarks):-1;
    return (u,actor)=>{
      const r=actor.rig, h=r.height, ground=seat==='floor' || actor.tags.includes('baby');
      const ch=ground || seat==='stool' ? studioRig.seated(r,ground) : {};
      if (['scoop-soil','tamp-soil','sow-seed','brush-mat'].includes(id)) {
        ch.hipOffset=[-.025*h,0,-.32*h]; ch.pitch=.31;
        ch.feet=[[.13*h,-r.hip[1],r.ankle],[-.16*h,r.hip[1],r.ankle]];
        ch.kneePoles=[[1,-.14,.24],[.48,.13,-.86]];
      }
      const offset=ch.hipOffset || zero, pitch=ch.pitch || 0, neck=ch.headPitch || 0;
      const attend=activityMotion.span(u,0,times[1]-.065,times[2]-.01,.965);
      const effort=activityMotion.span(u,times[0],times[1]+.02,times[2]+.02,1);
      const beat=Math.sin(Math.PI*2*ramp(u,times[1],times[2]))*effort;
      const [yaw,lean,roll,headYaw,headPitch,headRoll]=angles;
      Object.assign(ch,{yaw:yaw*effort,pitch:pitch+lean*effort,roll:roll*effort,
        headYaw:headYaw*attend,headPitch:neck+headPitch*attend,headRoll:headRoll*attend,
        hipOffset:[offset[0]+h*lean*.065*effort,offset[1]-h*roll*.15*effort,
          offset[2]-h*(Math.abs(lean)*.092*effort+.003*beat*beat)],blink:blink(u)});
      if (attitude==='recoil') ch.jawOpen=.40*effort;
      if (!ch.hands && (ground || seat==='stool')) {
        const sitting=pose(r,ch);
        ch.hands=sitting.legs.map(l=>[l.knee[0]-.025*h,l.knee[1],l.knee[2]+.038*h]);
      }
      const body=pose(r,ch), scale=h/50;
      const leftGoal=trace(left,actor,body,1,null,u,times,!!support,finish==='hold'?finish:'');
      const leftHand=clampHand(body.arms[1].shoulder,leftGoal,reach(r));
      const held=support && tool(support,leftHand,1,effort,u,rhythm,scale);
      const delayed=Math.max(0,Math.min(1,u-.022*Math.sin(Math.PI*u)));
      let rightGoal=trace(right,actor,body,0,held,delayed,times,!!primary,finish);
      if(primary && tips[primary] && right.some(m=>m in objectMarks)) {
        const mounted=tool(primary,zero,0,effort,u,rhythm,scale), tip=contact(mounted,tips[primary]);
        const align=activityMotion.span(delayed,times[0],times[1],times[2],times[3]);
        rightGoal=rightGoal.map((n,i)=>n-tip[i]*align);
      }
      rightGoal=motionSupplies.touch(id,rightGoal,actor,activityMotion.span(delayed,times[0],times[1],times[2],times[3]));
      const hook=primary && motionSupplies.hanging(id,actor,primary);
      if (hook) rightGoal=delayed<times[2]
        ? between(rightGoal,hook.hand,ramp(delayed,times[1],times[2]-.09))
        : between(hook.hand,body.arms[0].hand,ramp(delayed,times[2],times[3]));
      ch.hands=[rightGoal,leftHand];
      const p=pose(r,ch);
      if (held) p.props.push(held);
      if (primary && (finish!=='stow' || delayed<times[2])) {
        const item=hook?(delayed<times[2]?hook.carried(p.arms[0].hand):hook.mounted):tool(primary,p.arms[0].hand,0,effort,u,rhythm,scale);
        p.props.push(item);
      }
      if (id==='present-dish') {
        const bowl={kind:'bowl',scale:.72*scale,frame:held.frame.slice()};
        const origin=contact(held,[0,0,2.03]);
        origin.forEach((v,i)=>bowl.frame[i*4+3]=v);
        p.props.push(bowl);
      }
      if (held && sealAt>=0 && delayed>=mix(times[1],times[2],sealAt/Math.max(1,right.length-1)))
        held.seal=surfaces[held.kind]?.[right[sealAt]] || objectMarks[right[sealAt]];
      if (seat==='stool' && !ground) p.props.push(activityMotion.seatProp(r,{hipOffset:offset}));
      if (r.facialActing) {
        const watching=held ? contact(held,[0,0,.8]) : p.arms[rightText==='rest'?1:0].hand;
        const gaze=lookAt(actor,p,watching);
        p.faceCue={gaze:gaze.map(n=>n*attend*(['inspect','read','focus','down','tender'].includes(attitude)?.75:.26)),
          smile:attitude==='proud'||attitude==='tender'?.48*effort:0};
      }
      return entry(actor,p);
    };
  }
  function clampHand(shoulder,target,length) {
    const d=target.map((n,i)=>n-shoulder[i]), w=Math.min(1,length/(Math.hypot(...d)||1));
    return shoulder.map((n,i)=>n+d[i]*w);
  }
  function section(group,roles,seat,rows) {
    return rows.map(([id,label,seconds,right,left,attitude,rhythm,tools,keywords,finish])=>{
      const sample=phrase(right,left,attitude,rhythm,tools,seat,finish,id);
      const items=(tools || '').split('/').filter(Boolean);
      if (id==='present-dish') items.push('bowl');
      const props=items.map(id=>PineWorld.items.get(id).label);
      const clip=activityMotion.solo(id,label,group,seconds,roles,(u,actor)=>[sample(u,actor)],[keywords,...props].filter(Boolean).join(' '));
      return {...clip,items,seatSlots:seat==='stool'?[0]:[],transition:!!(finish || tools?.startsWith('stamp/'))};
    });
  }
  return {phrase,section,tool,clampHand};
})();
