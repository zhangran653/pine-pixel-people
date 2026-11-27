// Small props use a single painter and grip whether held in a clip or placed in a scene.
(() => {
  const all=Object.keys(PineWorld.realms), modern=['modern','scifi'];
  function add(id,label,family,box,lift,grip,paint,realms=all) {
    PineWorld.register({id,label,family,realms,box,lift,anchors:{grip}},paint);
  }
  function rim(line,radius,width,ink,vertical=false) {
    const p=i=>{const a=i*Math.PI/8; return vertical?[0,radius*Math.cos(a),radius*Math.sin(a)]:[radius*Math.cos(a),radius*Math.sin(a),0];};
    for(let i=0;i<16;i++) line(p(i),p(i+1),width,ink);
  }
  add('cloth','条纹方巾','home',[8,9,4],.65,[0,1.9,0],({box,k})=>{
    box([0,0,0],[2.55,3,.26],k.teal);
    for(const y of [-2.5,-1.95,2.45]) box([0,y,.19],[2.55,.14,.15],k.linen);
  });
  add('tray','托盘','home',[11,12,4],.5,[0,3.6,0],({box,k})=>{
    box([0,0,0],[3.45,4.35,.28],k.wood);
    for(const s of [-1,1]) {box([s*3.35,0,.32],[.25,4.4,.35],k.timber);box([0,s*4.23,.32],[3.45,.23,.35],k.timber);}
  });
  add('ring','木制抓握环','home',[5,8,8],2.2,[0,1.65,-.2],({line,k})=>rim(line,1.8,.43,k.amber,true));
  add('hoop','圆形绣绷','trades',[9,9,4],.55,[0,2.7,0],({line,oval,box,k})=>{
    oval([0,0,0],[3,3,.27],k.linen);rim(line,3.08,.32,k.bark);
    box([0,-3.13,.15],[.62,.38,.32],k.steelBlue);
    line([-.9,-1,.31],[1.2,.85,.31],.22,k.moss);oval([.5,.1,.34],[.53,.59,.18],k.rose);
  });
  add('ribbon','细柄彩带','home',[6,15,9],2.1,[0,0,0],({line,k})=>{
    line([0,0,-1.7],[0,0,2.25],.30,k.wood);
    const knots=[[0,0,2.2],[.2,1.4,3.15],[.4,3.1,3.2],[.7,4.65,2],[.8,5.8,.6],[.7,6.8,.15]];
    for(let i=1;i<knots.length;i++) line(knots[i-1],knots[i],.46,i<4?k.rose:k.amber);
  });
  add('flute','横笛','home',[5,17,5],.65,[0,.1,0],({line,oval,k})=>{
    line([0,-1,0],[0,7.1,0],.48,k.timber);
    for(const y of [2,3.15,4.3,5.48]) oval([.1,y,.41],[.22,.25,.19],k.bark);
  });
  add('mallet','软头鼓槌','home',[5,5,9],2.25,[0,0,-1],({line,oval,k})=>{
    line([0,0,-1.92],[0,0,2.1],.32,k.wood);oval([0,0,2.15],[.79,.79,.76],k.linen);
  });
  add('ruler','木直尺','office',[6,11,4],.45,[0,1.5,0],({box,k})=>{
    box([0,0,0],[.85,4.20,.32],k.timber);
    for(let i=-3;i<=3;i++) box([.48,i,.33],[i%2?.25:.41,.10,.09],k.bark);
  });
  add('envelope','折口信封','office',[8,9,4],.6,[0,1.95,0],({box,line,k})=>{
    box([0,0,0],[2.20,3.15,.32],k.paper);
    line([1.85,-2.9,.37],[-.48,0,.38],.14,k.sand);line([-.48,0,.38],[1.85,2.9,.37],.14,k.sand);
    box([1,1.98,.36],[.48,.52,.13],k.rose);
  });
  add('keyring','黄铜钥匙圈','home',[4,6,7],2.68,[0,0,.48],({line,k})=>{
    rim(line,.76,.23,k.amber,true);line([0,.4,-.55],[0,.85,-2.3],.31,k.amber);line([0,.8,-2],[0,1.47,-2.15],.31,k.amber);
  });
  add('yarn','绕线毛线团','trades',[6,6,6],1.85,[0,1.15,-.05],({oval,line,k})=>{
    oval([0,0,0],[1.85,1.65,1.63],k.rose);
    for(const y of [-.7,.1,.9]) line([1.15,y-.5,-.7],[1.5,y+.50,.65],.20,k.linen);
    line([0,1.25,-.64],[0,2.15,-1.18],.21,k.rose);
  });
  add('card','纸质票卡','office',[5,7,4],.4,[0,.93,0],({box,k})=>{
    box([0,0,0],[1.27,2,.22],k.paper);box([0,-1.35,.2],[1.27,.26,.10],k.teal);box([.25,.45,.2],[.18,.62,.10],k.iron);
  });
  add('trowel','园艺花铲','trades',[6,5,10],2.2,[0,0,-1.4],({line,oval,k})=>{
    line([0,0,-1.9],[0,0,1.0],.42,k.timber);oval([0,0,2.05],[.49,1.1,1.72],k.steelBlue);
  });
  add('sponge','双色海绵','home',[5,5,4],.7,[0,.56,-.1],({box,k})=>{
    box([0,0,0],[1.0,1.42,.54],k.amber);box([0,0,.43],[1,1.42,.20],k.fir);
  });
  add('ladle','深汤勺','home',[5,10,5],1.2,[0,-1.4,0],({line,oval,k})=>{
    line([0,-1.98,.48],[0,2.12,0],.31,k.steelBlue);oval([0,2.57,-.1],[1.03,1.2,.69],k.steelBlue);
  });
  add('mirror','圆形手镜','home',[5,7,9],3.8,[0,0,-1.75],({oval,line,k})=>{
    line([0,0,-3.25],[0,0,.6],.41,k.timber);oval([0,0,1.35],[.43,2.04,2.28],k.amber);oval([.33,0,1.35],[.19,1.71,1.92],k.crystal);
  });
  add('sieve','带柄小筛','home',[8,10,5],1.05,[0,2.7,0],({line,k})=>{
    rim(line,2.45,.36,k.timber);for(const n of [-1.2,-.4,.4,1.2])line([n,-1.77,-.29],[n,1.77,-.29],.15,k.linen);
    line([0,2.1,0],[0,4,0],.39,k.wood);
  });
  add('whisk','竹茶筅','home',[5,5,8],2,[0,0,-.95],({line,k})=>{
    line([0,0,-1.6],[0,0,.75],.45,k.timber);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;line([0,0,.3],[.82*Math.cos(a),.82*Math.sin(a),2.36],.22,k.linen);}
  });
  add('stamp','木柄印章','office',[5,5,5],.65,[0,0,.60],({box,oval,k})=>{
    box([0,0,0],[1.05,1.05,.54],k.bark);oval([0,0,1.03],[.69,.69,1.01],k.rose);
  });
  add('sprayer','小喷壶','home',[6,5,8],1.83,[0,0,.25],({oval,box,k})=>{
    oval([0,0,-.28],[1.45,1.25,1.55],k.teal);box([.48,0,1.57],[1.18,.41,.35],k.paper);box([.76,0,1.09],[.26,.28,.53],k.rose);
  },modern);
  add('leaf-sprig','鲜绿枝叶','plants',[6,7,9],1.95,[0,0,-1.1],({line,oval,k})=>{
    line([0,0,-1.8],[0,.36,3.5],.23,k.bark);
    for(const [y,z,s] of [[-.75,.1,1],[.86,1.4,.88],[-.66,2.5,.7]])
      oval([0,y,z],[.39,1.12*s,.67*s],y>0?k.moss:k.sprout);
  });
  add('baton','指挥棒','home',[4,4,10],1.85,[0,0,-.75],({line,k})=>{
    line([0,0,-1.5],[0,0,-.15],.44,k.bark);line([0,0,-.12],[0,0,5.9],.24,k.linen);
  });
  add('tambourine','木框铃鼓','home',[9,9,5],.9,[0,2.15,0],({oval,line,k})=>{
    oval([0,0,0],[2.76,2.76,.57],k.linen);rim(line,2.76,.42,k.wood);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;oval([2.7*Math.cos(a),2.7*Math.sin(a),.15],[.58,.58,.22],k.amber);}
  });
  add('needle','穿线绣针','trades',[4,4,6],1.85,[0,0,0],({line,oval,k})=>{
    line([0,0,-1.45],[0,0,1.13],.21,k.steelBlue);oval([0,0,1.18],[.28,.24,.48],k.iron);
    line([0,0,1.15],[0,.95,.84],.17,k.rose);
  });
  add('microphone','手持话筒','trades',[5,5,7],1.95,[0,0,-.8],({line,oval,k})=>{
    line([0,0,-1.68],[0,0,1.18],.53,k.iron);oval([0,0,1.68],[.94,.94,1.05],k.steelBlue);
  },modern);
  add('window-frame','木框活动窗','furniture',[6,29,42],0,[0,0,15],({box,line,k})=>{
    for(const y of [-12.8,12.8]) box([0,y,20],[.75,.72,20],k.timber);
    for(const z of [9,39.6]) box([0,0,z],[1.0,13.5,.68],k.wood);
    box([.55,0,24],[.29,.31,15.2],k.linen);
    line([.45,-10.6,20],[.45,-6.8,23.8],.25,k.crystal);
    line([.45,4.7,10],[.45,8.6,13.9],.23,k.crystal);
  });
  add('peg-rail','带挂钩的木架','furniture',[7,21,27],0,[-1,0,22],({box,line,k})=>{
    for(const y of [-8.3,8.3]) {box([0,y,12.0],[.57,.65,12],k.wood);box([0,y,.55],[2.65,1,.55],k.bark);}
    box([0,0,21.6],[.64,9.3,1.4],k.timber);
    for(const y of [-5,0,5]) {line([-.4,y,21.6],[-2.2,y,21.6],.38,k.iron);line([-2.2,y,21.6],[-2.2,y,23.0],.38,k.iron);}
  });
  add('open-shelf','两层木搁架','furniture',[10,25,32],0,[-3,0,22],({box,k})=>{
    for(const y of [-10,10]) box([.5,y,14],[.9,.70,14],k.wood);
    for(const z of [10,27.5]) box([0,0,z],[4.1,11.5,.55],k.timber);
  });
  add('lock-panel','门闩与锁孔','furniture',[7,9,33],0,[-.8,0,26],({box,oval,k})=>{
    box([1,0,11],[.55,1,11],k.wood);box([1,0,.5],[2.4,3.1,.5],k.bark);
    box([.4,0,25.5],[.63,3.4,5.1],k.timber);box([-.32,0,26],[.37,1.58,2.15],k.amber);
    oval([-.74,0,26],[.21,.48,.57],k.iron);box([-.74,0,25.5],[.20,.22,.57],k.iron);
  });
  add('threshold-rail','木门槛','buildings',[5,20,4],0,[0,0,1.2],({box,k})=>{
    box([0,0,.66],[.93,8.5,.66],k.wood);box([0,0,1.38],[.92,8.5,.13],k.timber);
  });
  add('puddle','雨后浅水洼','home',[12,21,3],0,[0,0,.18],({oval,line,k})=>{
    oval([0,-.78,.19],[3.7,7.2,.22],k.steelBlue);oval([-.60,3.8,.19],[2.4,4.4,.21],k.steelBlue);
    line([-1.60,-4.0,.38],[-1.35,-1.45,.38],.21,k.shine);line([.6,2.3,.37],[.69,4.9,.37],.19,k.crystal);
  });
  add('planter-box','园艺育苗箱','plants',[12,15,9],0,[0,0,5.1],({box,oval,k})=>{
    box([0,0,2.5],[4.3,5.5,2.4],k.wood);box([0,0,4.91],[3.9,5.05,.24],k.bark);
    for (const y of [-5.5,5.5]) box([0,y,4.9],[4.6,.38,.41],k.timber);
    for (const x of [-4.2,4.2]) box([x,0,4.9],[.38,5.5,.41],k.timber);
    for (const y of [-3.2,2.85]) oval([1.3,y,5.46],[.83,1.08,.59],k.sprout);
  });
  add('card-reader','立式读卡器','furniture',[9,9,32],0,[-1,0,25],({box,k})=>{
    box([0,0,.65],[3.1,3.1,.65],k.iron);box([0,0,13.2],[.83,1.15,12.4],k.steelBlue);
    box([0,0,25],[1.32,2.57,3.4],k.iron);box([-1.36,0,26],[.21,1.91,1.1],k.crystal);
    box([-1.4,0,23.6],[.20,1.45,.27],k.amber);
  },modern);
  add('transit-strap','车厢吊环','transport',[5,18,12],6.7,[0,0,-5.1],({line,k})=>{
    line([0,-7,3.4],[0,7,3.4],.48,k.steelBlue);line([0,0,3.4],[0,0,-2.0],.42,k.linen);
    line([0,0,-1.9],[0,-1.4,-4.8],.40,k.amber);line([0,0,-1.9],[0,1.4,-4.8],.40,k.amber);
    line([0,-1.4,-4.8],[0,1.4,-4.8],.44,k.amber);
  },modern);
})();
