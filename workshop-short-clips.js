const workshopShortClips = (() => {
  const {section}=shortMotion, {school,walking,prop,atGrip,contact,entry,reach}=activityMotion;
  const heritage=section('手工与纺织',school,'stool',[
    ['thread-needle','对准针眼穿线',3.0,'nearEdge objectTop nearEdge','cup eyeLine','inspect','hold','yarn/needle'],
    ['pull-thread','捻住线头抽线',2.55,'objectCenter across wide','inner near','pull','stroke','/yarn'],
    ['wind-yarn','把线绕上毛线团',3.2,'objectTop farEdge objectLow nearEdge objectTop','cup inner','focus','turn','/yarn'],
    ['embroider-stitch','在绣面上落一针',2.8,'near objectCenter wristUp','cup near','down','tap','needle/hoop'],
    ['tighten-hoop','拧紧绣绷',2.4,'crownEdge objectTop crownEdge','cup eyeLine','inspect','turn','/hoop'],
    ['turn-embroidery','翻看绣面背部',2.9,'nearEdge farEdge objectLow','cup outer wristUp','tilt','turn','/hoop'],
    ['comb-fibres','把纤维梳顺',3.0,'objectTop nearEdge objectLow','near cup','down','stroke','comb/yarn'],
    ['sight-ruler','举尺比量尺寸',2.7,'nearEdge farEdge forward','cup eyeLine','focus','hold','/ruler'],
    ['pin-fabric','别住一角布料',2.55,'wristUp nearEdge objectCenter','outer cup','down','tap','needle/cloth'],
    ['test-cloth','捻一捻布料厚薄',2.6,'nearEdge farEdge nearEdge','cup near','inspect','turn','/cloth'],
    ['polish-bead','用布擦亮珠子',3.0,'nearEdge objectCenter farEdge','cup wristUp','tender','stroke','cloth/prism'],
    ['inspect-pottery','端起陶碗看轮廓',3.2,'rim objectLow farRim','cup eyeLine','tilt','turn','/bowl'],
    ['flick-fan','手腕轻振展开扇面',2.25,'belt forward wide','belly','present','brisk','fan'],
    ['hide-behind-fan','用扇面半掩面容',2.75,'cup cheek nearEye','belly','shy','lift','fan']
  ]);
  const stage=section('舞台与摄影',walking,'stand',[
    ['cue-entrance','侧台示意演员入场',2.6,'ear forward diagonal','belly','aside','brisk'],
    ['cue-spotlight','向灯光席提示落点',2.55,'upFront overhead tableSide','eyeLine','lookUp','stroke'],
    ['slate-take','合上场记板',2.25,'wristUp pageTop objectCenter','near eyeLine','focus','brisk','ruler/clipboard'],
    ['show-slate','对镜头展示场记板',2.55,'pageEdge pageFoot','cup eyeLine offer','present','hold','/clipboard'],
    ['frame-portrait','竖起相机取半身像',2.6,'near objectTop nearEdge','cup eyeLine','tilt','turn','/camera'],
    ['low-angle-photo','蹲低机位仰拍',3.0,'near objectLow objectCenter','near lowFront','curl','settle','/camera'],
    ['pull-focus','拧镜头调焦',2.65,'nearEdge objectCenter farEdge','eyeLine eyeLine','focus','turn','/camera'],
    ['check-cue-card','瞥一眼提词卡',2.3,'sternum forward near','cup eyeLine cup','read','brisk','/card'],
    ['stage-curtain','将帷幕拨向侧面',2.85,'across highFront wide','center forward side','turn','stroke','cloth'],
    ['formal-curtsy','提裙屈身谢幕',3.1,'pocket sideLow sideLow','pocket sideLow sideLow','bow','settle'],
    ['present-microphone','把话筒递向观众',2.45,'chin chest offer','belly','present','stroke','microphone'],
    ['mic-check','对话筒试音',2.5,'cup lips chin','ear nearEar','listen','hold','microphone']
  ]);
  const fantasy=section('奇幻表演',school,'stand',[
    ['cup-starlight','双手聚拢星光',3.3,'outer nearEdge objectTop','wide cup middleHigh','tender','lift','/prism'],
    ['inspect-prism','把晶石迎光观察',3.1,'cup highFront overhead','brow','lookUp','turn','prism'],
    ['crystal-orbit','手掌环绕悬晶',3.5,'objectTop farEdge objectLow nearEdge objectTop','cup near','focus','stroke','/prism'],
    ['lantern-listen','侧耳听灯中回响',3.0,'cup ear nearEar','chest','listen','hold','lantern'],
    ['lower-lantern','放低灯笼察看足迹',2.95,'cup lowFront lowSide','knee','curl','stroke','lantern'],
    ['veil-lantern','用掌遮住灯光',2.45,'wide objectTop farEdge','near cup','shy','hold','/lantern'],
    ['unseal-scroll','拨开卷轴上的封记',2.65,'nearEdge objectCenter farEdge','cradle inner','inspect','turn','/scroll'],
    ['chant-scroll','托卷吟诵',3.6,'sternum lips upFront','cup eyeLine','open','hold','/scroll'],
    ['trace-spiral','用笔尖描空中螺旋',3.4,'wide highFront diagonal center wristUp','belly','focus','stroke','quill'],
    ['wind-charm','让绸带绕过手腕',2.85,'near wristUp across outer','center','sway','turn','ribbon'],
    ['orbit-dial','拨动观星盘刻度',3.0,'nearEdge objectTop farEdge','cup eyeLine','focus','turn','/astrolabe'],
    ['bless-sprout','用掌心护住新芽',3.05,'highFront objectTop nearEdge','cup cradle','tender','settle','/leaf-sprig'],
    ['greet-stars','向星空举扇行礼',3.1,'chest highSide overhead','sternum','lookUp','lift','fan']
  ]);
  const science=section('科幻与探索',school,'stand',[
    ['activate-probe','按下探测仪启动钮',2.0,'near objectTop near','cup','focus','tap','/probe'],
    ['listen-beacon','侧耳接收信标回音',2.75,'belt ear eyeLine','hip','listen','hold','beacon'],
    ['sweep-scanner','平移探头扫过地面',3.1,'lowSide lowFront acrossLow','knee','down','stroke','probe'],
    ['overhead-reading','举探头读取高处数据',3.15,'cup shelf overhead','eyeLine','lookUp','lift','probe'],
    ['triangulate','交替比准两个方位',3.25,'diagonal highFront highSide','cup eyeLine','turn','stroke','probe/astrolabe'],
    ['calibrate-dial','旋动仪盘校零',2.8,'nearEdge objectCenter objectTop farEdge','near cup','inspect','turn','/astrolabe'],
    ['match-signal','让两个读头相对',2.9,'outer farEdge nearEdge','outer center','focus','hold','probe/beacon'],
    ['shield-sensor','遮挡传感器测试读数',2.3,'outer objectTop objectCenter','cup eyeLine','inspect','hold','/probe'],
    ['scan-specimen','扫描掌中的样本',2.8,'outer objectTop nearEdge farEdge','cup inner','down','stroke','scanner/prism'],
    ['stow-sample','将样本收入胸前',2.25,'offer sternum pocket','near chest','tender','settle','prism','','stow'],
    ['raise-relay','举起信标转发讯号',2.85,'chest overhead highSide','ear','lookUp','lift','beacon'],
    ['view-star-map','侧举星图找方位',3.1,'brow forward diagonal','cup eyeLine shelf','turn','hold','/scroll'],
    ['holo-swipe','横扫手掌翻动光幕',2.25,'across eyeLine highSide','cup near','present','stroke','/beacon'],
    ['holo-pinch','双手拉开投影视窗',2.45,'center forward wide','center forward wide','open','stroke','beacon'],
    ['record-sound','将探头靠近声源',3.0,'cup forward highSide','ear','listen','stroke','probe'],
    ['transmit-pulse','按节拍发出三次短讯',2.75,'objectTop near objectTop near objectTop','near eyeLine','focus','pulse','/beacon']
  ]);
  // On a desk the work surface remains in scene space. Pen tips lie on the
  // paper during a stroke and lift clear between marks; the chair follows age.
  const {pose,ramp,clamp}=studioRig;
  const paths={
    dash:[[.9,-1.9],[.9,1.8]], vertical:[[1.5,-.9],[-1.9,-.9]],
    arch:[[-1.4,-1.9],[.45,-1.55],[1.3,0],[.5,1.5],[-1.4,1.85]],
    box:[[1.8,-1.7],[1.8,1.7],[-1.5,1.7],[-1.5,-1.7],[1.8,-1.7]],
    diagonal:[[-1.4,-1.8],[1.6,1.5]], flourish:[[.8,-1.95],[-.9,-.95],[1.4,.18],[-.65,.9],[.35,1.95]],
    dot:[[.15,-.55],[.15,-.55]], doubleDot:[[.55,-1,0],[.52,-1,1.4],[-.6,1,1.4],[-.6,1,0]],
    zigzag:[[-1.5,-1.9],[1.5,-.9],[-1.4,0],[1.4,1],[-1.3,1.9]],
    loop:[[.5,-1.25],[1.25,-.15],[.3,1.2],[-1.15,.25],[.5,-1.25]],
    topEdge:[[1.9,-2],[1.9,1.95]], fold:[[-1.4,-1.8],[0,0],[1.6,1.8],[-.3,.6]],
    sweep:[[1.4,-1.95],[-1.4,-1.7],[1.35,-.1],[-1.4,.1],[1.25,1.85]],
    touch:[[-.7,1.1,1.2],[-.7,1.1,0],[-.7,1.1,.9]], diagonalFold:[[1.6,-1.8],[0,0],[-1.5,1.65]],
    rows:[[1.2,-1.8],[1.2,1.8],[.4,-1.7,1],[0,-1.7],[0,1.7]],
    v:[[-.8,-1.7],[-1.5,-.7],[1.45,1.65]], corners:[[1.4,-1.8],[1.4,-1.8,1.1],[-1.3,1.8,1.1],[-1.3,1.8]]
  };
  const tipPoints={pen:[.4,0,-1.94],quill:[0,0,-2.7],stamp:[0,0,-.54],ruler:[0,-1.9,0],sponge:[0,0,-.42],
    needle:[0,0,-1.45],cloth:[0,0,-.24],mallet:[0,0,2.36]};
  function deskClip([id,label,seconds,surface,instrument,stroke,anchor,style]) {
    const line=paths[stroke], support=paths[anchor][0];
    const leavesMark=['stamp','quill','pen'].includes(instrument);
    const sample=(u,a)=>{
      const r=a.rig, s=r.height/50, span=reach(r), top=PineWorld.items.get('desk').anchors.surface[2],
        seat=studioRig.seated(r), z=clamp(top+.39*span-(r.shoulder[2]-r.pelvis[2])-.052*r.height,6,19);
      const deskX=.43*span+2, desk=prop('desk',[deskX,0,0],1), chair=prop('chair',[-2*s,0,0],z/13.1);
      const paper=prop(surface,[deskX-3.8,0,top+.22*s],s);
      const travel=ramp(u,.20,.77)*(line.length-1), i=Math.floor(travel), t=travel-i;
      const first=line[i], next=line[Math.min(i+1,line.length-1)];
      const over=1.85*(1-activityMotion.span(u,.04,.18,.80,.98));
      const returnHand=leavesMark?0:ramp(u,.82,1);
      const axis=k=>studioRig.mix(studioRig.mix(first[k]||0,next[k]||0,t),line[0][k]||0,returnHand);
      const px=axis(0), py=axis(1);
      const paperZ=({cloth:.36,envelope:.41,laptop:.64,scroll:.45,notebook:.88,clipboard:.74,book:1.03})[surface];
      const tip=contact(paper,[px,py,paperZ+over+axis(2)]);
      const effort=activityMotion.span(u,.025,.22,.76,.97);
      seat.hipOffset=[-2*s+.022*r.height*effort,0,z+.052*r.height-r.pelvis[2]];
      seat.pitch=.08+.065*effort; seat.headPitch=.16+.09*effort;
      seat.headYaw=.12*py*effort; seat.blink=activityMotion.blink(u);
      const toolTip=instrument && tipPoints[instrument];
      const contactTool=instrument && atGrip(instrument,tip,toolTip,s,style==='diagonal'?.46:-.1,instrument==='pen'||instrument==='quill'?.14:0);
      const holder=contactTool ? contact(contactTool,[0,0,0]) : tip;
      seat.hands=[holder,contact(paper,[support[0],support[1]+1.55,paperZ+.18])];
      const p=pose(r,seat); p.props=[desk,chair,paper];
      if ((instrument==='pen' || instrument==='quill') && u>=.20) {
        paper.inkPath=line.slice(0,i+1).map(([x,y])=>[x,y,paperZ]);
        paper.inkPath.push([px,py,paperZ]);
      }
      if (instrument==='stamp' && u>=.49) paper.seal=[line[1][0],line[1][1],paperZ];
      if(contactTool) p.props.push(atGrip(instrument,p.arms[0].hand,[0,0,0],s,style==='diagonal'?.46:-.1,instrument==='pen'||instrument==='quill'?.14:0));
      if (r.facialActing) p.faceCue={gaze:studioRig.lookAt(a,p,tip)};
      return [entry(a,p)];
    };
    return {...activityMotion.solo(id,label,id==='stamp-form'?'文件与服务':'桌面操作',seconds,school,sample,
      ['书桌 工作台 桌椅',PineWorld.items.get(surface).label,instrument && PineWorld.items.get(instrument).label].filter(Boolean).join(' ')),
      items:['desk','chair',surface,...(instrument?[instrument]:[])],station:'desk',transition:leavesMark};
  }
  const desks=[
    ['stamp-form','在表单上盖章',2.2,'clipboard','stamp','touch','corners'],
    ['draw-arch','在纸上画拱线',3.15,'notebook','pen','arch','corners'],
    ['draw-frame','描出方形边框',3.45,'notebook','pen','box','fold'],
    ['draw-axis','沿纸竖向画轴线',2.55,'notebook','pen','vertical','topEdge'],
    ['sketch-curve','勾一条连续曲线',3.05,'notebook','pen','flourish','rows'],
    ['plot-points','点定两个坐标',2.65,'notebook','pen','doubleDot','arch'],
    ['draw-zigzag','绘出锯齿折线',3.0,'notebook','pen','zigzag','v'],
    ['ink-stroke','运笔写一横',3.15,'scroll','quill','dash','vertical'],
    ['ink-hook','提腕勾一笔',2.85,'scroll','quill','v','topEdge'],
    ['ink-dot','落笔点墨',1.95,'scroll','quill','dot','box'],
    ['ink-wash','以侧锋铺墨',3.65,'scroll','quill','sweep','diagonal','diagonal'],
    ['affix-seal','把印章按在卷尾',2.55,'scroll','stamp','touch','topEdge'],
    ['place-ruler','把直尺沿纸边放齐',2.6,'notebook','ruler','topEdge','v'],
    ['square-corners','比对纸张的两个对角',2.95,'notebook','ruler','corners','box','diagonal'],
    ['crease-paper','沿中线压折纸张',2.55,'envelope',null,'vertical','diagonal'],
    ['press-paper-edge','沿外缘压实纸边',2.85,'envelope',null,'box','rows'],
    ['align-letter','把信纸边缘对齐',2.4,'envelope',null,'fold','corners'],
    ['polish-desktop','用海绵推擦工作面',3.6,'cloth','sponge','sweep','v'],
    ['mark-pattern','用针点出纸样两端',2.8,'cloth','needle','corners','arch'],
    ['press-seam','用手掌顺着压缝线',3.0,'cloth',null,'diagonalFold','topEdge'],
    ['pin-corner','把针别在布角',2.15,'cloth','needle','touch','corners'],
    ['trace-stencil','绕模板描一圈',3.1,'cloth','pen','loop','box'],
    ['tap-enter','按一下键盘回车',1.55,'laptop',null,'touch','rows'],
    ['drag-trackpad','在触控板上拖动',2.0,'laptop',null,'diagonal','topEdge'],
    ['scroll-trackpad','沿触控板竖向滑动',2.2,'laptop',null,'vertical','corners'],
    ['brush-keyboard','用布掸过键盘',2.8,'laptop','cloth','rows','fold'],
    ['follow-score','在乐谱上逐行指读',3.3,'book',null,'rows','box'],
    ['point-diagram','沿图示指出走向',2.85,'book',null,'zigzag','arch'],
    ['trace-map-border','对着地图勾出边界',3.6,'scroll',null,'loop','corners'],
    ['dab-wet-ink','轻按纸面吸去余墨',2.65,'scroll','cloth','doubleDot','fold']
  ];
  return [...heritage,...stage,...fantasy,...science,...desks.map(deskClip)];
})();
