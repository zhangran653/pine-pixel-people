// Swatches are evaluated on the moving garment, in its own coordinates.
// A cut controls the volume; its stitching, panels and cuffs share the same dyes.
const pinePatternWardrobe = (() => {
  const hair = {
    'feather-crop': {label:'羽尖层次短发',group:'短发',base:'side-part',cropBase:'pixie',fringe:'pixie'},
    'page-crop': {label:'圆页短发',group:'短发',base:'crop',cropBase:'crop',fringe:'blunt'},
    'brushed-crop': {label:'上梳短碎发',group:'短发',base:'crop',cropBase:'crew',fringe:'quiff'},
    'petal-bob': {label:'花瓣内扣波波',group:'中长发',base:'bob',length:1.32,wave:.52,fringe:'curtain',hem:.27},
    'swing-bob': {label:'斜摆齐颌短波波',group:'中长发',base:'side-part',length:1.13,asym:.45,hem:.23},
    'shoulder-shag': {label:'齐肩碎层',group:'中长发',base:'shoulder-length',fringe:'shag',length:1.67,hem:.53},
    'cascade-part': {label:'偏分长瀑发',group:'中长发',base:'shoulder-length',length:2.48,asym:.29,hem:.28,fringe:'pixie'},
    'ripple-lob': {label:'水波锁骨卷',group:'卷发',base:'long-waves',length:1.62,wave:1.46,fringe:'curtain',hem:.21},
    'willow-wave': {label:'柳叶长卷',group:'卷发',base:'long-waves',length:2.53,wave:.86,asym:.25,hem:.44},
    'cloud-puffs': {label:'双团蓬松卷',group:'卷发',base:'bun',curls:'taper',bun:'twin'},
    'looped-knot': {label:'低环盘发',group:'束发',base:'bun',bun:'low',fringe:'curtain'},
    'ribbon-fall': {label:'高束波浪马尾',group:'束发',base:'side-part',tail:'low',fringe:'sweep',tieHeight:.58,tailLength:1.85,tailWave:.21},
    'side-loop': {label:'侧束短马尾',group:'束发',base:'side-part',tail:'side',fringe:'pixie',tieHeight:.23,tailLength:1.06},
    'loop-braid': {label:'盘冠垂辫',group:'编发',base:'bun',bun:'crown',tail:'fish',tailLength:1.55},
    'ribbon-plait': {label:'长节绳辫',group:'编发',base:'bun',tail:'bubble',fringe:'curtain',tieHeight:.12,tailLength:2.22},
    'temple-braids': {label:'侧分齐肩细辫',group:'编发',base:'side-part',tail:'braids',fringe:'pixie',tailLength:1.32}
  };
  // label, gallery garment, silhouette, neckline, fabric detail, sleeve finish
  const tops = {
    'orchard-pinafore':['交背果园围裙','work','long','apron','pouch','linen'],
    'barista-apron':['铜扣半身咖啡围裙','work','long','bib','buttons','rolled'],
    'atelier-coat':['滚边工作褂','work','coat','offset','pockets','rolled'],
    'field-vest':['翻盖考察背心','active','coat','open','pockets','linen'],
    'running-shell':['拼色接力风衣','active','coat','zip','chevron','bar'],
    'ridge-fleece':['山纹抓绒衫','active','knit','zip','peaks','band'],
    'shell-parka':['弧肩航海派克服','active','coat','yoke','zipper','band'],
    'cable-knit':['双绞花毛衣','knits','knit','crew','cable','rib'],
    'fairisle-knit':['雪花提花圆领衫','knits','knit','crew','snow','rib'],
    'petal-cardigan':['花瓣领开衫','knits','knit','petal','buttons','band'],
    'lullaby-smock':['月牙围嘴小衫','knits','knit','bib','moon','rib'],
    'sunday-blouse':['荷叶领灯笼袖衫','casual','knit','petal','gathers','linen'],
    'patch-pullover':['方块拼布套头衫','casual','knit','crew','patch','rolled'],
    'station-jacket':['车站立领制服','tailored','coat','standing','bars','bar'],
    'double-vest':['双排扣礼宾马甲','tailored','coat','open','buttons','linen'],
    'camp-shirt':['贴袋开领衬衫','tailored','shirt','open','breast','rolled'],
    'reed-robe':['苇叶缘交领袍','robes','long','cross','reeds','band'],
    'loom-jacket':['织锦短褂','robes','coat','offset','diamonds','band'],
    'bell-tabard':['钟楼滚边罩袍','cloaks','long','yoke','border','linen'],
    'leaf-mantle':['叶尖披风','cloaks','long','leaves','veins','band'],
    'orbit-liner':['舱内舷窗夹衣','flight','coat','standing','port','bar'],
    'relay-shell':['星港接线服','flight','coat','zip','circuit','rolled']
  };
  // Knee width, ankle width, pigment on the moving upper and lower leg.
  const bottoms = {
    'gusset-slacks':['侧褶西裤',1.01,1.20,'fold'], 'sailor-pants':['翻边水手裤',1.14,1.54,'cuff'],
    'knee-cargos':['补强工装裤',1.09,1.03,'patch'], 'ribbon-joggers':['双线运动束裤',1.03,.91,'track'],
    'loom-pants':['织边直筒裤',1.05,1.22,'loom'], 'balloon-pants':['灯笼束口裤',1.22,.85,'gather'],
    'patch-tights':['护膝软棉裤',.97,.95,'oval'], 'flight-trousers':['舱线长裤',1.07,1.13,'signal']
  };
  // Knee travel, shin travel, hem width and number of folds.
  const skirts = {
    'folk-gather':['织边百褶长裙',.99,.47,1.53,18],
    'harbour-wrap':['系带斜裹裙',.91,.24,1.34,7],
    'bell-skirt':['铃形双层舞裙',.83,.04,1.58,10],
    'petal-skirt':['花瓣叠摆裙',.94,.16,1.48,8]
  };
  const isSkirt = id => id === 'skirt' || id === 'plaid-skirt' || Object.hasOwn(skirts,id);
  function skirtFabric(style,t,u,v,fold,k) {
    if(season.skirts[style]) return season.skirt(style,t,u,v,fold,k);
    if (style==='folk-gather' && (Math.abs(t-.79)<.035 || Math.abs(t-.91)<.045)) return k.accent;
    if (style==='harbour-wrap' && u>.08 && Math.abs(v-.47+.86*t)<.09) return k.trimLight;
    if (style==='bell-skirt' && t>.60+.075*Math.cos(6*Math.atan2(v,u))) return t>.93 ? k.trimLight : k.accent;
    if (style==='petal-skirt') {
      const hem=.88+.10*Math.cos(8*Math.atan2(v,u));
      if(t>hem) return k.bottomShade;
      if(t>hem-.065) return k.accent;
    }
    return t<.12 || fold>.62 ? k.bottomShade : fold<-.62 ? k.bottomLight : k.bottom;
  }
  const shoes = {
    'gum-plimsolls':['胶底帆布鞋',.54,.0,'gum'], 'court-sneakers':['侧杠球场鞋',.62,0,'bars'],
    'tassel-loafers':['流苏便鞋',.51,0,'tassel'], 'gaiter-boots':['护腿绑扣靴',.69,.57,'gaiter'],
    'petal-slippers':['花口软底鞋',.46,0,'petal'], 'cabin-boots':['舱内绝缘短靴',.67,.33,'cabin']
  };
  // Shapes are individual pieces of the same enamel collection. The pin lies
  // on the chest, the comb sits over the temple, and the drop hangs off the ear.
  const motifs = {
    daisy:['雏菊',['  ll  ',' lmm l','llggll',' lmml ','  ll  ']],
    ginkgo:['银杏',[' mllm ','lmlmll','mlmlmm',' mmmm ','  mm  ','   g  ']],
    koi:['锦鲤',['m    l','mm mll',' mmlgm','mm mmm','m    m']],
    moth:['飞蛾',['l   l','lm ml','lgmgl',' mmml','m g m']],
    berry:['双樱桃',['   ll ','  llm ','  g g ',' mm mm',' lmlmm',' mm mm']],
    starfall:['流星',['    gl','   lg ',' mml  ','lggml ',' mmm  ']],
    moon:['弯月',['  lll ',' ll   ','lm    ','lm   l',' mmmm ','  mm  ']],
    prism:['棱镜',['  ll  ',' lgml ','lggmml',' mmmm ','  mm  ']],
    swallow:['燕子',['l    l','lm  ml',' mmml ','  mgll',' mm   ','m  m  ']],
    bell:['铃兰',['   ll ','  m  l',' lg  m',' lgl m','    lg','    ll']],
    spool:['线轴',['lgggl',' mml ',' lmml',' lmm ','lgggl']],
    planet:['环星',['   ml  ','  lmm g','  mmlg ',' gggm  ','g mml  ','   m   ']]
  };
  const bags = {
    'doctor-case':['双扣手提诊包',.80,.40,.21,3.7,'clasp'], 'map-folio':['折页地图挎包',.72,.26,.29,4.8,'flap'],
    'market-basket':['拱柄菜篮',.84,.49,.23,3,'basket'], 'dancer-duffel':['圆鼓排练包',.99,.41,.19,2.4,'duffel'],
    'flap-ruck':['翻盖旅行背囊',.53,.74,.35,3.2,'ruck'], 'crescent-bag':['月牙斜挎包',.87,.31,.25,2.1,'crescent'],
    'tool-roll':['卷扣工具袋',.85,.28,.17,3,'roll'], 'capsule-pack':['硬壳样品背箱',.42,.64,.32,4.5,'capsule']
  };
  const labels = defs => Object.fromEntries(Object.entries(defs).map(([id, def])=>[id,def[0]]));
  const ornaments = (suffix, label) => Object.fromEntries(Object.entries(motifs).map(([id,[name]])=>[id+'-'+suffix,name+label]));
  const choices = {hair:Object.fromEntries(Object.entries(hair).map(([id,style])=>[id,style.label])),top:labels(tops),
    bottom:{...labels(bottoms),...labels(skirts)},shoes:labels(shoes),bag:labels(bags),brooch:ornaments('pin','珐琅胸针'),
    hairAccessory:ornaments('comb','边梳'),ears:ornaments('drops','垂耳饰')};
  const season=pineSeasonalWardrobe;
  Object.assign(tops,season.tops); Object.assign(bottoms,season.bottoms);
  Object.assign(skirts,season.skirts); Object.assign(shoes,season.shoes);
  function fabric(style,u,v,t,k) {
    if (season.tops[style]) return season.fabric(style,u,v,t,k);
    const [, , ,collar,detail] = tops[style], a=Math.abs(v), front=u>.15;
    const neck = .74 + .27*a, cross=t-.60-.43*v;
    if (collar==='cross' && front && Math.abs(cross)<.09) return cross<-.04 ? k.trimLight : k.accent;
    if (collar==='petal' && front && t>.79-.095*Math.cos(7*v) && a<.76) return k.lining;
    if (collar==='open' && front && a<Math.max(.07,(t-.41)*.88)) return a>(t-.41)*.88-.12 ? k.accent : k.lining;
    if (collar==='leaves' && t>.60-.14*Math.cos(6*v)-.13*a) return t>.82 ? k.topLight : k.accent;
    if (collar==='yoke' && t>neck-.09) return t<neck-.03 ? k.trimLight : k.accent;
    if (collar==='standing' && t>.86) return t<.90 ? k.trimLight : k.topShade;
    if (collar==='crew' && front && t>.85+.18*a*a && a<.68) return k.topShade;
    if (collar==='apron' || collar==='bib') {
      if (u<0 && Math.abs(a-(1-t)*.92)<.10) return k.accent;
      const edge=collar==='apron' ? .42+.42*(1-t) : .36+.10*Math.cos(5*t);
      if (t>.45 && (a>edge || !front)) return k.lining;
      if (a<edge && t>.75 && t<.80) return k.trimLight;
    }
    if (front && ((collar==='zip' && a<.055) || (collar==='offset' && Math.abs(v-.29)<.065))) return k.trimLight;
    if (detail==='snow' || detail==='peaks' || detail==='diamonds') {
      const row=detail==='peaks' ? .53 : detail==='snow' ? .68 : .22;
      const d=Math.abs((t-row)*8), wave=Math.abs(Math.cos(v*(detail==='peaks'?5:10)+u*.75));
      if (Math.abs(d-wave)<.27 || (detail==='snow' && d<.27 && wave<.57)) return k.accent;
      if (detail==='diamonds' && Math.abs(t-.40)<.035) return k.trimLight;
    } else if (detail==='cable' && Math.abs(a-.42-.075*Math.cos(20*t))<.085) return k.topLight;
    else if (detail==='patch' && (v>.22 && t<.44 || v<-.26 && t>.49 && t<.72)) return k.accent;
    else if (detail==='veins' && Math.abs(t-.32-.39*a)<.042) return k.trimLight;
    else if (detail==='reeds' && t<.26 && Math.sin(15*v+9*t)>.42) return k.accent;
    else if (detail==='border' && (Math.abs(t-.17)<.045 || Math.abs(t-.29)<.02)) return k.accent;
    if (front) {
      if ((detail==='pockets' && a>.24 && a<.74 && t>.20 && t<.42) ||
          (detail==='pouch' && a<.46 && t>.21 && t<.42) ||
          (detail==='breast' && v>.22 && v<.63 && t>.53 && t<.72)) return Math.cos(t*16)>.74 ? k.trimLight : k.topShade;
      if (detail==='buttons' && Math.abs(a-(collar==='open'?.39:.19))<.075 && t>.24 && t<.77 && Math.cos(t*31)>.57) return k.brass;
      if (detail==='port' && ((v-.42)/.21)**2+((t-.66)/.115)**2<1) return Math.abs(v-.42)<.095 ? k.lining : k.accent;
      if (detail==='moon' && ((v+.02)/.26)**2+((t-.56)/.13)**2<1 && ((v-.09)/.23)**2+((t-.60)/.12)**2>.79) return k.accent;
      if (detail==='gathers' && t>.61 && Math.abs(v)<.55 && Math.cos(22*v+.5*t)>.78) return k.topShade;
      if (detail==='zipper' && a<.071 && t>.22) return k.trimLight;
      if (detail==='bars' && v<-.21 && v>-.66 && t>.59 && t<.73) return t>.69 ? k.accent : k.brass;
      if (detail==='chevron' && Math.abs(t-.46-.34*a)<.10) return k.accent;
      if (detail==='circuit' && (Math.abs(v+.38)<.065 && t>.28 && t<.66 || v<-.33 && Math.abs(t-.66)<.035)) return k.trimLight;
    }
    return t<.08 ? k.topShade : k.top;
  }
  function sleeve(style,t,u,v,side,r,fore,k) {
    if(season.tops[style]) return season.sleeve(style,t,u,v,side,r,fore,k);
    const finish=tops[style][5];
    if (finish==='linen') return fore && t>.82 ? k.skinLight : side*v<-.46*r ? k.topShade : k.lining;
    if (finish==='rolled' && fore && t>.40) return t<.65 ? k.lining : k.skinLight;
    if (finish==='bar' && !fore && t>.38 && t<.66) return t<.47 ? k.trimLight : k.accent;
    if (fore && t>.72) return finish==='rib' && Math.cos(v/r*13)>.5 ? k.topLight : k.accent;
    return side*v<-.55*r ? k.topShade : k.top;
  }
  function trouser(kind,t,u,v,side,shin,k) {
    if(season.bottoms[kind]) return season.trouser(kind,t,u,v,side,shin,k);
    const mark=bottoms[kind][3], a=side*v;
    if (mark==='track' && (Math.abs(a-.65)<.14 || Math.abs(a-.35)<.08)) return k.accent;
    if (mark==='patch' && u>.23 && (shin ? t<.24 : t>.66)) return k.bottomShade;
    if (mark==='oval' && u>.26 && (v/.81)**2+((t-(shin?.04:.95))/.30)**2<1) return k.accent;
    if (mark==='fold' && Math.abs(v-side*(.32+.09*t))<.12) return k.bottomLight;
    if (mark==='cuff' && shin && t>.65) return t<.73 ? k.bottomShade : k.bottomLight;
    if (mark==='loom' && a>.54 && Math.cos(t*23+v*3)>.06) return k.accent;
    if (mark==='gather' && shin && t>.78) return t>.91 ? k.bottomShade : k.accent;
    if (mark==='signal' && Math.abs(a-.53+.29*t)<.13) return k.trimLight;
    return a<-.51 ? k.bottomShade : k.bottom;
  }
  function footwear(kind,f,a,z,k) {
    if(season.shoes[kind]) return season.shoe(kind,f,a,z,k);
    const mark=shoes[kind][3];
    if (z<.33) return mark==='gum' ? k.shoeLight : k.outsole;
    if (mark==='gum' && (z<.58 || (f>.52 && z<1.50))) return k.rubber;
    if (mark==='bars' && (Math.abs(f-.08-.39*a)<.12 || Math.abs(f+.25-.39*a)<.11)) return k.accent;
    if (mark==='tassel' && z>1.16 && f>-.24 && f<.33 && Math.abs(a)<.64) return Math.abs(a)<.16 ? k.brass : k.shoeShade;
    if (mark==='petal' && f<.16 && z>1.03 && Math.abs(a)<.56+.11*Math.cos(f*11)) return k.lining;
    if (mark==='cabin' && (z<.61 || Math.abs(f-.27)<.11)) return k.accent;
    if (mark==='gaiter' && Math.abs(f-.04+.36*a)<.20) return k.shoeLight;
    return f>.62 ? k.shoeLight : k.shoes;
  }
  // Merge horizontal runs into a stroke. The ornaments remain solid when viewed edge-on.
  const dies = Object.fromEntries(Object.entries(motifs).map(([id,[,rows]])=>{
    const spans=[],width=Math.max(...rows.map(row=>row.length));
    rows.forEach((row,j)=>{ for (let i=0;i<row.length;) {
      const start=i, tone=row[i++];
      while (row[i]===tone) i++;
      if (tone!==' ') spans.push([(start+i-width)/2,(rows.length-1)/2-j,(i-start)/2,tone]);
    }});
    return [id,spans];
  }));
  function ornament(id,stamp) {
    for (const [x,z,rx,tone] of dies[id.slice(0,id.lastIndexOf('-'))]) stamp(x,z,rx,tone);
  }
  function luggage(style,b,k,d,w,low,h) {
    const [,depth,width,height,power,kind]=bags[style], back=kind==='ruck'||kind==='capsule';
    const x=back ? -1.13*d : -.32*d, y=back ? 0 : 1.04*w, z=low+(back?.51:.31)*h;
    const line=(a,c,r,ink)=>b.link(a,c,r*w,r*w,1,()=>ink);
    if (!back) {
      line([.42*d,-.57*w,low+.97*h],[1.02*d,.23*w,low+.64*h],.066,k.bagShade);
      line([1.02*d,.23*w,low+.64*h],[x,y,z+.48*height*h],.066,k.bagShade);
    } else for (const side of [-1,1]) {
      line([x,side*.49*w,z+.78*height*h],[.12*d,side*.72*w,low+.96*h],.105,k.bagShade);
      line([.12*d,side*.72*w,low+.96*h],[.80*d,side*.57*w,low+.41*h],.082,k.bagMain);
    }
    b.blob(x,y,z,depth*d,width*w,height*h,(px,py,pz)=>{
      const u=(px-x)/(depth*d),v=(py-y)/(width*w),t=(pz-z)/(height*h);
      if (kind==='crescent' && t>.32+.72*u*u) return 0;
      if (kind==='basket') return t>.67 ? k.bagShade : (Math.floor(u*6)+Math.floor(t*6))%2===0 ? k.bagMain : k.bagLight;
      if (kind==='clasp' && Math.abs(Math.abs(u)-.52)<.12 && t>-.05 && t<.41) return k.brass;
      if (kind==='duffel' && Math.abs(Math.abs(u)-.47)<.12 || kind==='roll' && Math.abs(Math.abs(u)-.58)<.17) return k.bagShade;
      if (kind==='capsule' && Math.abs(v)<.43 && Math.abs(t-.24)<.16) return k.accent;
      if (kind==='flap' || kind==='ruck') {
        const edge=.02+.32*Math.abs(back?v:u);
        if(t>edge) return t<edge+.16 ? k.bagShade : k.bagLight;
      }
      return t>.74 ? k.bagLight : t<-.62 ? k.bagShade : k.bagMain;
    },power);
    if (kind==='basket'||kind==='clasp') {
      let prior=[x-depth*.66*d,y,z+.55*height*h];
      for(let i=1;i<=8;i++) {
        const a=Math.PI*i/8, p=[x-depth*.66*d*Math.cos(a),y,z+height*h*(.55+Math.sin(a)*1.40)];
        line(prior,p,.064,k.bagShade); prior=p;
      }
    }
  }
  return { hair,tops,bottoms,skirts,isSkirt,skirtFabric,shoes,bags,choices,fabric,sleeve,trouser,footwear,ornament,luggage };
})();
