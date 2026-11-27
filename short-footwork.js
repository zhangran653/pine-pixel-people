// Foot phrases are authored as successive landings. Interpolate just the moving
// shoe in scene space, then solve both legs relative to the moving pelvis.
const shortFootwork = (() => {
  const {pose,clamp,ramp,mix}=studioRig, {entry,solo,walking,school,hand,between,blink}=activityMotion;
  const places={
    home:[0,0,0], ahead:[.16,0,0], far:[.245,0,0], back:[-.14,0,0], trail:[-.22,0,0],
    out:[0,.105,0], wide:[0,.16,0], close:[0,-.042,0], diag:[.145,.084,0], retreat:[-.135,.08,0],
    cross:[.125,-.145,0], behind:[-.115,-.13,0], toe:[.12,.012,.027], tap:[.025,.11,.024],
    knee:[.055,.014,.165], high:[.047,.035,.211], tuck:[-.07,0,.133], heel:[.16,.008,.029],
    kick:[.235,.015,.094], sweep:[.13,.12,.075], fan:[.026,.175,.077], crossLift:[.124,-.115,.09],
    in:[.055,-.055,0], lead:[.09,0,0], halfBack:[-.075,0,0], rearToe:[-.145,.025,.037]
  };
  const guards={
    walk:[[.30,.11,-.70],[.05,.15,-.88],.035], low:[[.48,.15,-.38],[.32,.23,-.52],.22],
    balance:[[.18,.77,-.01],[.12,.65,.04],.04], hike:[[.49,.13,-.22],[.44,.14,-.37],.12],
    groove:[[.26,.55,.02],[.35,.34,-.45],.085], ballet:[[.22,.64,.38],[.28,.51,-.19],-.035],
    skate:[[.56,.11,-.26],[.13,.50,-.51],.22], ready:[[.52,.16,-.06],[.41,.19,-.22],.12],
    bow:[[.20,.28,-.79],[.22,.30,-.77],.17], parade:[[.65,.12,-.13],[.03,.12,-.90],-.035],
    lift:[[.21,.36,.61],[.34,.48,.19],-.055], cross:[[.32,-.56,-.16],[.33,-.50,-.19],.055]
  };
  function makeSteps([id,label,group,seconds,guard,blocks,keywords,oneWay=false]) {
    const beats=blocks.split(' ').map(token=>{
      const [foot,name]=token.split(':');
      if (!(name in places) || !['R','L'].includes(foot)) throw Error('未知落脚点 '+id+' '+token);
      return {leg:foot==='R'?0:1,mark:places[name]};
    });
    const [right,left,lean]=guards[guard];
    const marks=[[places.home,places.home]];
    for(const beat of beats) {
      const feet=marks[marks.length-1].slice(); feet[beat.leg]=beat.mark; marks.push(feet);
    }
    const sample=(u,a)=>{
      const r=a.rig,h=r.height, v=clamp(u)*beats.length, i=Math.min(beats.length-1,Math.floor(v)),
        t=v-i, leg=beats[i].leg, side=leg?1:-1, swing=Math.sin(Math.PI*t)**2, w=ramp(t,0,1);
      const active=activityMotion.span(u,0,.13,.86,1);
      const shoes=marks[i].map((p,j)=>{
        const next=marks[i+1][j], sign=j?1:-1, v=between(p,next,w);
        const stride=Math.hypot(next[0]-p[0],next[1]-p[1]);
        return [v[0]*h,sign*(r.hip[1]+v[1]*h),v[2]*h+(j===leg?(.022+.23*stride)*h*swing:0)];
      });
      const x=(shoes[0][0]+shoes[1][0])/2, y=(shoes[0][1]+shoes[1][1])/2;
      const feet=shoes.map(p=>[p[0]-x,p[1]-y,r.ankle+p[2]]);
      const weight=(Math.max(0,shoes[1][2])-Math.max(0,shoes[0][2]))/h;
      const ch={feet,standing:1-active,hipOffset:[-.025*h*lean*active,-h*(.033*side*swing+.14*weight),-.025*h*active],
        pitch:lean*active,roll:.075*side*swing,headRoll:-.045*side*swing,
        yaw:-.115*side*swing,headYaw:.09*side*swing,headPitch:(guard==='low'?.14:-.03)*active,blink:blink(u)};
      const body=pose(r,ch);
      ch.hands=[right,left].map((p,j)=>{
        const shift=(j?1:-1)*side*swing;
        return between(body.arms[j].hand,hand(r,body,j,[p[0]+.13*shift,p[1],p[2]-.13*shift]),active);
      });
      return [entry(a,pose(r,ch),x,y)];
    };
    const clip=solo(id,label,group,seconds,group==='步态与移动'?walking:school,sample,keywords);
    return oneWay?{...clip,transition:true}:clip;
  }
  const travel='步态与移动', sport='体能与平衡', dance='舞步与律动';
  const steps=[
    ['threshold','迈过门槛',travel,2.15,'hike','R:knee R:far L:ahead','跨门槛 跨步',true],
    ['step-away','侧身让开半步',travel,1.75,'balance','L:out R:cross','让路 避让',true],
    ['edge-forward','小步往前挪',travel,2.45,'low','R:lead L:lead R:ahead L:ahead','挪步 慢移',true],
    ['step-back-check','回收前脚退开',travel,2.1,'ready','R:halfBack L:trail R:back','退让 后退',true],
    ['wide-stance','分脚站稳',travel,1.9,'ready','L:wide R:out','打开站距 站稳',true],
    ['close-stance','收脚立正',travel,2.05,'parade','R:close L:in','并脚 立正',true],
    ['diagonal-dodge','斜跨一步闪开',travel,1.8,'skate','R:diag L:cross','躲避 变向',true],
    ['toe-test','探脚试地面',travel,2.75,'balance','R:toe R:heel R:home','试探 落脚'],
    ['step-over-line','跨线换重心',travel,2.35,'hike','L:knee L:far R:lead','跨越 地面',true],
    ['trail-stop','前后错步急停',travel,1.7,'low','R:far L:rearToe','刹步 停住',true],
    ['tight-passage','侧挪穿过窄口',travel,2.85,'cross','R:out L:cross R:wide L:behind','狭窄 侧移',true],
    ['rock-back','从前脚退回后脚',travel,2.45,'walk','R:toe L:halfBack R:home L:home','撤步 重心'],
    ['heel-dig','脚跟向前点地',sport,2.15,'hike','R:heel R:home L:heel L:home','热身 脚跟'],
    ['kneelift-hold','抱臂提膝停稳',sport,2.9,'cross','R:knee R:high R:knee R:home','控腿 平衡'],
    ['curl-heel','屈膝后勾小腿',sport,2.65,'balance','L:tuck L:home R:tuck R:home','勾腿 热身'],
    ['kick-forward','向前摆腿',sport,2.35,'balance','R:knee R:kick R:knee R:home','摆腿 健身'],
    ['leg-fan','向侧面打开腿',sport,2.9,'balance','L:knee L:fan L:tap L:home','开髋 侧摆'],
    ['cross-knee','异侧提膝收肘',sport,2.65,'ready','R:crossLift R:home L:crossLift L:home','协调 热身'],
    ['ankle-circle','单脚在空中绕小圈',sport,3.1,'balance','R:knee R:sweep R:fan R:tuck R:home','踝关节 热身'],
    ['side-lunge','向侧旁屈膝压腿',sport,3.0,'low','L:wide R:in R:home L:home','侧弓步 健身'],
    ['split-balance','前后分腿找平衡',sport,2.95,'balance','R:ahead L:trail L:halfBack R:home L:home','稳定 前后'],
    ['skater-step','滑冰式左右换重心',sport,2.85,'skate','R:diag L:behind L:diag R:behind R:home L:home','滑步 体能'],
    ['quick-feet','短促碎步热身',sport,2.2,'ready','R:toe L:toe R:in L:in R:home L:home','敏捷 碎步'],
    ['single-leg-reach','单脚支撑向前探身',sport,2.95,'skate','L:tuck L:rearToe L:tuck L:home','支撑 控制'],
    ['v-step','V字开合步',dance,2.85,'groove','R:diag L:diag R:home L:home','有氧 舞步'],
    ['grapevine-step','侧向交叉藤步',dance,3.1,'groove','R:out L:behind R:wide L:cross L:home R:home','交叉步 舞蹈'],
    ['box-step','四拍方步',dance,3.35,'ballet','R:ahead L:diag R:out L:back R:home L:home','方形 舞蹈'],
    ['mambo-rock','曼波前后摇步',dance,2.85,'groove','L:ahead R:toe L:home R:back R:home','曼波 节奏'],
    ['jazz-square','爵士方块步',dance,3.3,'ready','R:cross L:back R:out L:ahead L:home R:home','爵士 交叉'],
    ['ballet-point','绷脚尖侧点',dance,3.15,'ballet','R:tap R:fan R:tap R:home','芭蕾 点地'],
    ['curtsy-step','后交叉屈膝礼',dance,2.95,'bow','L:behind R:toe R:home L:home','谢幕 礼节'],
    ['kick-ball-change','踢踏换脚',dance,2.15,'groove','R:kick R:halfBack L:toe R:home L:home','踢踏 节拍'],
    ['heel-toe','跟尖交替点步',dance,2.5,'parade','L:heel L:rearToe L:heel L:home','脚尖 脚跟 舞蹈'],
    ['sweep-step','划半圆收步',dance,2.95,'ballet','R:crossLift R:sweep R:fan R:tap R:home','舞蹈 圆弧'],
    ['step-touch','并步轻点脚',dance,2.75,'lift','L:out R:cross R:out L:cross L:home R:home','律动 并步'],
    ['charleston','前点后踢舞步',dance,2.75,'groove','R:toe R:home L:tuck L:back R:heel L:home R:home','舞步 摇摆']
  ];
  // Flight has a single takeoff and a landing. Move the root only while
  // airborne. The landed shoes stay in the same world positions during recovery.
  function jumpClip([id,label,seconds,dx,dy,lift,yaw,knees,guard]) {
    const arms=guards[guard];
    return {...solo(id,label,sport,seconds,school,(u,a)=>{
      const r=a.rig,h=r.height, take=.31, land=.71, flight=clamp((u-take)/(land-take));
      const arc=4*flight*(1-flight), prep=activityMotion.span(u,0,.18,.20,take),
        catchStep=activityMotion.span(u,.64,.77,.82,1), active=activityMotion.span(u,.11,.30,.70,.95);
      const ch={standing:1-Math.max(prep,arc,catchStep),
        feet:[-1,1].map((s,i)=>[h*knees[i][0]*arc,s*(r.hip[1]+h*knees[i][1]*arc),r.ankle+h*knees[i][2]*arc]),
        pitch:.26*prep+.20*catchStep,headPitch:-.14*prep-.09*catchStep,
        hipOffset:[-.024*h*(prep+catchStep),0,-h*(.12*prep+.092*catchStep)],blink:blink(u)};
      const body=pose(r,ch);
      ch.hands=[0,1].map(i=>between(body.arms[i].hand,hand(r,body,i,arms[i]),active));
      return [entry(a,pose(r,ch),h*dx*flight,h*dy*flight,h*lift*arc,yaw*ramp(flight,0,1))];
    },'腾空 起跳 落地 '+label),transition:!!(dx||dy||yaw)};
  }
  const jumps=[
    ['puddle-hop','双脚跳过水洼',2.05,.31,0,.17,0,[[.045,0,.056],[.042,0,.058]],'hike'],
    ['hop-back','后撤小跳',1.65,-.14,0,.085,0,[[.04,.01,.035],[.025,.02,.03]],'balance'],
    ['lateral-hop','侧跳越线',1.8,0,.19,.115,0,[[.02,.012,.06],[0,.05,.045]],'skate'],
    ['tuck-hop','收膝跳',1.95,0,0,.19,0,[[.09,.01,.115],[.09,.01,.115]],'ready'],
    ['star-hop','展臂星形跳',1.9,0,0,.135,0,[[.045,.10,.04],[.045,.10,.04]],'lift'],
    ['quarter-hop','跳转四分之一圈',2.05,0,0,.135,Math.PI/2,[[.03,0,.075],[-.045,0,.07]],'cross'],
    ['half-hop','半转身落地',2.25,.035,0,.16,Math.PI,[[.06,0,.08],[-.065,.01,.08]],'ballet'],
    ['split-leap','空中前后分腿',2.15,.18,0,.19,0,[[.20,0,.12],[-.19,.01,.105]],'ballet'],
    ['side-bound','斜向跨跳接稳',2.15,.17,-.15,.15,-.20,[[.11,.035,.075],[-.065,.025,.12]],'balance'],
    ['heel-click','空中并拢脚跟',1.85,0,0,.15,0,[[-.055,-.044,.075],[-.055,-.044,.075]],'groove']
  ];
  return [...steps.map(makeSteps),...jumps.map(jumpClip)];
})();
