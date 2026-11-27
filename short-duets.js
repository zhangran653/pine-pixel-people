// Each partner has a part and an entrance time. Shared props below have one
// owner per frame; both hands meet the same rigid object before ownership moves.
const shortDuets = (() => {
  const {walking,school,small,entry,reach,hand,between,atGrip,contact}=activityMotion;
  const {pose,local,world,ramp,clamp,commonReach}=studioRig;
  const root=(x,y,heading)=>({x,y,z:0,heading});
  function duet([id,label,seconds,layout,lead,reply,delay]) {
    const family=layout.startsWith('family'), infant=layout==='family-floor';
    const together=layout==='beside' || layout==='family-beside';
    const seated=infant?'floor':layout==='seated'?'stool':'stand';
    const actorPart=p=>shortMotion.phrase(p[0],p[1],p[2],p[3],p[4]||'',seated);
    const play=[actorPart(lead),actorPart(reply)];
    return {id,label,seconds,group:family?'亲子游戏':'双人配合',roles:family?[['adult'],infant?small:['child','toddler']]:[school,school],
      items:[lead[4],reply[4]].flatMap(tools=>(tools||'').split('/').filter(Boolean)),
      seatSlots:seated==='stool'?[0,1]:[],
      keywords:family?'陪伴 宝宝 孩子 亲子互动':'伙伴 对话 配合 互动',
      sample(u,a,b){
        const gap=(a.rig.height+b.rig.height)*(together?.127:infant?.185:.228);
        const roots=together?[root(0,-gap/2,.18),root(.035*b.rig.height,gap/2,-.23)]:
          [root(-gap/2,0,.19),root(gap/2,.020*b.rig.height,Math.PI-.19)];
        return [a,b].map((person,i)=>{
          const phase=i?ramp(u,delay,.98):ramp(u,0,1-delay*.45);
          const e=play[i](phase,person), partner=[b,a][i], aim=local(roots[i],world(roots[1-i],[0,0,partner.rig.height*(seated==='floor'?.54:.77)]));
          if(person.rig.facialActing) {
            const attention=i?1-ramp(u,delay,delay+.22):ramp(u,.68,.88);
            const prior=e.pose.faceCue?.gaze || [0,0];
            e.pose.faceCue={...e.pose.faceCue,gaze:between(prior,studioRig.lookAt(person,e.pose,aim),attention)};
          }
          return {...e,...roots[i]};
        });
      }};
  }
  const staged=[
    ['greet-return','相互点头问候',2.75,'facing',['sternum chest','rest','bow','settle'],['belly sternum','rest','tender','tap'],.19],
    ['invite-answer','邀请入座与应允',3.15,'facing',['center lowFront wide','belly','present','stroke'],['chest sternum','hip','bow','hold'],.18],
    ['ask-directions','问路与指路',3.65,'facing',['cup near forward','cup eyeLine','tilt','turn','/scroll'],['chest highFront highSide','belly','aside','stroke'],.20],
    ['compare-heights','两人比个子',3.15,'beside',['brow crown forward','hip','lookUp','lift'],['crown forehead upFront','rest','proud','turn'],.12],
    ['echo-rhythm','一人领拍一人应拍',3.3,'facing',['chest inner chest inner','center inner center inner','sway','pulse'],['knee lap knee lap','lap knee lap knee','focus','pulse'],.23],
    ['show-and-tell','展示藏品与凑近观察',3.1,'facing',['near eyeLine offer','center','present','lift','prism'],['chin brow near','belly','inspect','settle'],.15],
    ['interview','伸出话筒听搭档回答',3.4,'facing',['chin offer forward','belly','listen','stroke','microphone'],['chest center forward','belly','present','hold'],.19],
    ['joint-selfie','两人凑近自拍',3.35,'beside',['cup upFront diagonal','near cheek','proud','lift','phone'],['chest wristUp highSide','belly','shy','hold'],.10],
    ['cue-and-sing','指挥给拍与歌者起声',3.2,'facing',['upFront lowFront shelf','near wing','brace','brisk','baton'],['belly sternum forward','rib chest','open','lift'],.17],
    ['paired-bow','两人相向回礼',3.55,'facing',['belly acrossLow belt','belly acrossLow belt','bow','settle'],['chest belly belt','belly belt','bow','hold'],.16],
    ['check-in-desk','出示票卡与核验',2.95,'facing',['belt offer forward','rest','present','stroke','card'],['near lowFront forward','cup near','inspect','tap','scanner'],.11],
    ['celebrate-result','报出结果与举手庆祝',3.4,'beside',['pageTop objectCenter forward','cup eyeLine','read','lift','/clipboard'],['chest wristUp overhead','chest wing highSide','proud','lift'],.23],
    ['discuss-page','两人对照书页商量',3.5,'seated',['pageTop pageFoot','cup offer','read','stroke','/book'],['chin forward near','knee','listen','settle'],.12],
    ['shared-lookout','一起辨认远处地标',3.3,'beside',['brow highFront diagonal','hip','turn','stroke'],['belly brow temple','cup eyeLine','lookUp','lift','/astrolabe'],.16],
    ['traffic-signal-pair','一人示停一人收势',2.55,'facing',['near forward reachOut','rest','brace','brisk'],['forward chest belly','side chest','recoil','settle'],.13],
    ['family-copy-clap','大人示范宝宝跟着拍',3.45,'family-floor',['outer center outer center','outer center outer center','proud','pulse'],['side inner side inner','side inner side inner','tender','pulse'],.23],
    ['family-find-nose','你指鼻子我来学',3.05,'family-floor',['cheek nose chin','lap','tender','tap'],['lap cheek nose','lap','inspect','tap'],.20],
    ['family-lift-arms','亲子一起举高双臂',3.3,'family-floor',['side upFront overhead','side upFront overhead','open','lift'],['lap eyeLine crown','lap wristUp overhead','lookUp','lift'],.16],
    ['family-hear-bell','摇铃与循声侧耳',3.3,'family-floor',['cup wide highSide','lap','sway','pulse','rattle'],['lap ear nearEar','lap','listen','hold'],.13],
    ['family-hide-toy','藏在身后的玩具',3.5,'family-floor',['cup side behind','lap','shy','turn','ring'],['lap forward wide','lap near','aside','stroke'],.16],
    ['family-knee-song','唱着儿歌轮流拍膝',3.35,'family-floor',['lap knee lap knee','knee lap knee lap','sway','pulse'],['knee lap knee','lap knee lap','proud','pulse'],.21],
    ['family-show-colour','大人展示宝宝伸手选色',3.25,'family-floor',['cup highFront wide','cup near eyeLine','present','lift','ribbon/cloth'],['lap forward upFront','lap chest','focus','lift'],.18],
    ['family-learn-fan','并肩模仿摇扇',3.2,'family-beside',['chest eyeLine near eyeLine','hip','sway','pulse','fan'],['near wristUp near wristUp','belly','tilt','pulse','fan'],.19],
    ['family-count-stars','一起仰头数星星',3.7,'family-beside',['brow highFront highSide','belly','lookUp','stroke'],['cheek upFront crown','chest','lookUp','lift'],.17]
  ];
  function passing([id,label,seconds,kind,handle,halfWidth,lift]) {
    return {id,label,seconds,group:'双人交接',roles:[school,school],items:[kind],transition:true,keywords:'递给 接过 传递 交接 '+PineWorld.items.get(kind).label,
      sample(u,a,b){
        const cast=[a,b], size=Math.min(a.rig.height,b.rig.height)/50, h=Math.min(a.rig.shoulder[2],b.rig.shoulder[2]),
          lengths=cast.map(p=>reach(p.rig)), spacing=cast.map((p,i)=>Math.max(lengths[i]*.74,p.rig.mouth[0]+p.rig.palm*.7));
        const roots=cast.map((p,i)=>root(i?spacing[i]:-spacing[i],(i?-1:1)*p.rig.shoulder[1]*.93,i?Math.PI:0));
        const progress=activityMotion.span(u,.025,.37,.67,.975), ch=cast.map((p,i)=>{
          const diff=Math.max(0,p.rig.shoulder[2]-h-.42*lengths[i]);
          return {hipOffset:[0,0,-diff*progress],standing:1-progress,pitch:.09*progress,headPitch:.13*progress,blink:activityMotion.blink(u)};
        });
        const bodies=cast.map((p,i)=>pose(p.rig,ch[i])), shoulders=bodies.map((p,i)=>world(roots[i],p.arms[0].shoulder));
        const common=commonReach(shoulders,lengths.map(v=>v*.88),[0,0,h+lift*size]);
        const grips=cast.map((p,i)=>[(i?1:-1)*halfWidth,0,handle]);
        const tilt=kind==='book'?-.42:kind==='envelope'||kind==='card'?-.35:0;
        const roll=kind==='book'?.78:kind==='envelope'||kind==='card'?.48:0;
        const inScene=activityMotion.prop(kind,common,size,0,tilt,roll);
        const entries=cast.map((p,i)=>{
          const goal=local(roots[i],contact(inScene,grips[i]));
          const holding=i?ramp(u,.40,.58):1-ramp(u,.51,.73);
          const waiting=hand(p.rig,bodies[i],0,[.50,-.15,-.42]);
          const start=between(bodies[i].arms[0].hand,waiting,holding);
          const meet=i?activityMotion.span(u,.16,.46,.65,.97):activityMotion.span(u,.04,.37,.58,.92);
          const arms=[between(start,goal,meet),null], final=pose(p.rig,{...ch[i],hands:arms});
          if(p.rig.facialActing) final.faceCue={gaze:studioRig.lookAt(p,final,goal)};
          return {...entry(p,final),...roots[i],contacts:{palm:world(roots[i],final.arms[0].hand)}};
        });
        const owner=u<.51?0:1, p=entries[owner].pose;
        p.props.push(atGrip(kind,p.arms[0].hand,grips[owner],size,-roots[owner].heading,tilt,roll));
        return entries;
      }};
  }
  const exchanges=[
    ['pass-ticket','递交票券',2.25,'card',0,.82,-2.95],
    ['relay-baton','交接接力棒',2.15,'baton',.12,.25,.15],
    ['lend-book','将书递给搭档',3.05,'book',.28,2.48,-3.35],
    ['deliver-letter','把信交到对方手里',2.75,'envelope',0,1.9,-1.55],
    ['share-lantern','接过引路灯笼',3.45,'lantern',4.8,.64,-5.3],
    ['pass-tray','稳稳交接托盘',3.35,'tray',0,2.9,-3.65]
  ];
  return [...staged.map(duet),...exchanges.map(passing)];
})();
