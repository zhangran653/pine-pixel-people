// Visible captions are built from the same garment, hair and dye IDs the rig paints.
// Occupations remain in identity.role. Titles never infer a job or a trait from a face.
const pineCharacterTitles = (() => {
  const short = {
    top: {
      'field-jacket':'多袋夹克','trail-shell':'拼肩外套','striped-cardigan':'条纹长开衫',
      'rain-anorak':'连帽风衣','snap-knit':'按扣开衫','knit-vest':'针织背心',tee:'短袖衫',polo:'翻领短衫',
      'lab-coat':'长罩褂','chef-coat':'双排扣短褂',scrubs:'V领短衫',apron:'围裙',mechanic:'连体工装',
      uniform:'肩章外套',flightsuit:'拼接夹衣','barista-apron':'铜扣围裙','orchard-pinafore':'交背围裙',
      'kiln-smock':'背带罩衫','festival-bolero':'织边短衣','double-vest':'双排扣马甲','station-jacket':'立领短外套',
      'camp-shirt':'贴袋衬衫','shell-parka':'弧肩风衣','ridge-fleece':'山纹抓绒衫','running-shell':'拼色风衣',
      'field-vest':'翻盖背心','reed-robe':'交领长袍','bell-tabard':'滚边罩袍','relay-shell':'拼线夹克',
      'orbit-liner':'立领夹衣','lullaby-smock':'围嘴小衫','sunday-blouse':'灯笼袖衫',
      'qipao-bodice':'斜襟立领衫','sundress-bodice':'细吊带上衣','wrap-bodice':'系带上衣',
      'cotton-yukata':'交领浴衣上衣','two-button-suit':'两粒扣西装','double-suit':'双排扣西装',
      'fairisle-knit':'提花毛衣','quilt-jacket':'绗棉小袄','patch-pullover':'拼布套衫','cable-knit':'绞花毛衣'
    },
    hair: {
      'baby-whorl':'旋儿胎发','baby-sprout':'小翘发','baby-puffs':'双绒发团','baby-comma':'额前小卷',
      'baby-cloud':'蓬松短卷','baby-sweep':'细软偏刘海','brushed-crop':'上梳短发','page-crop':'圆弧短发',
      'petal-bob':'内扣波波头','swing-bob':'斜分波波头','shoulder-shag':'齐肩碎发','cascade-part':'偏分长发',
      'ribbon-fall':'高马尾','temple-braids':'齐肩细辫','loop-braid':'盘冠辫',afro:'蓬松卷发',braid:'长辫',
      'feather-crop':'层次短发','willow-wave':'长卷发','ribbon-plait':'绳结长辫','cloud-puffs':'双团卷发'
    },
    hat: {'sunhat':'圆檐帽','trail-cap':'鸭舌帽','survey-hat':'宽檐帽','hardhat':'安全帽','reed-hat':'竹斗笠',
      'harbour-peak':'短檐便帽','storm-brim':'披沿雨帽','beret':'贝雷帽','lantern-hood':'尖兜帽','bucket':'渔夫帽'},
    glasses: {oval:'椭圆镜框',goggles:'护目镜',rimless:'无框眼镜',browline:'眉线眼镜',geometric:'多边形眼镜'},
    bag: {'doctor-case':'双扣提包','dancer-duffel':'圆鼓手提包','market-basket':'编织提篮',
      'survey-satchel':'帆布挎包','map-folio':'折页挎包','tool-roll':'卷扣小包','flap-ruck':'翻盖背包'},
    bottom:{'flight-trousers':'拼线长裤','folk-gather':'织边百褶裙','knee-cargos':'护膝工装裤'}
  };
  // Perceptual distance keeps muted greens, blues and violets in their own dye families.
  function lab(hex) {
    const [r,g,b]=hex.slice(1).match(/../g).map(byte=>{
      const v=parseInt(byte,16)/255;
      return v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4;
    });
    const l=Math.cbrt(.412221*r+.536333*g+.051446*b),m=Math.cbrt(.211903*r+.680700*g+.107397*b),
      s=Math.cbrt(.088302*r+.281719*g+.629979*b);
    return [.210454*l+.793618*m-.004072*s,1.977998*l-2.428592*m+.450594*s,.025904*l+.782772*m-.808676*s];
  }
  const dyes=Object.entries({
    墨黑:'29282d',炭灰:'505057',银灰:'abadb0',米白:'e2dacc',燕麦色:'c5b79e',沙色:'bb9d78',驼色:'a28161',
    栗棕:'805c49',深棕:'60463c',赭红:'ad6650',砖红:'974d49',珊瑚色:'d68870',豆沙色:'b67980',莓紫:'925e79',
    灰紫:'83788f',丁香色:'ada0b6',芥黄:'be9b54',浅杏色:'ddbd91',橄榄绿:'80845c',
    苔绿:'647855',鼠尾草绿:'99a991',灰绿:'819184',豆绿:'899b83',灰青:'829997',松绿:'487160',青绿:'537d7b',湖蓝:'73969f',
    烟蓝:'788ba6',蓝灰:'657789',靛蓝:'495875',藏青:'384655',朱红:'dc3632',橙色:'f28b38',
    金黄:'e4b132',翠绿:'2f9969',宝蓝:'3d5fbd',紫色:'8350a7',亮粉色:'e28bb1',白色:'f4f3ee'
  }).map(([word,color])=>[word,lab('#'+color)]);
  function dye(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '';
    const q=lab(hex);
    let best='', distance=Infinity;
    for (const [word,c] of dyes) {
      const d=(q[0]-c[0])**2+1.65*((q[1]-c[1])**2+(q[2]-c[2])**2);
      if (d<distance) { best=word; distance=d; }
    }
    return best;
  }
  // Apron panels use an independent trim ink; their cut is a better identifier than the base dye.
  const twoTone=new Set(['apron','kiln-smock','barista-apron','orchard-pinafore','hi-vis','moth-cape','leaf-mantle']);
  const sets={
    'qipao-bodice/qipao-column':'斜襟旗袍','sundress-bodice/circle-skirt':'吊带伞裙',
    'cotton-yukata/yukata-hem':'棉浴衣','wrap-bodice/bias-midi':'系带裹身裙',
    'two-button-suit/two-pleat-slacks':'两粒扣西服套装','double-suit/two-pleat-slacks':'双排扣西服套装'
  };
  function features(doc,options) {
    const p=doc.parts;
    function part(slot) {
      const id=p[slot];
      if (!id || id==='none') return '';
      if (slot==='hat') {
        const [owner,key]=id.split('/');
        return short.hat[key] || options.catalog.get(owner+'@'+doc.packs[owner])?.parts.find(h=>h.id===key)?.label || '';
      }
      return short[slot]?.[id] || options.slots[slot]?.[id] || options.wearables[slot]?.[id] || '';
    }
    const ensemble=doc.colors.top===doc.colors.bottom && sets[p.top+'/'+p.bottom];
    const top=ensemble || part('top'), dyed=(twoTone.has(p.top) ? '' : dye(doc.colors.top))+top;
    const hat=part('hat'), hair=hat ? '' : part('hair');
    const glasses=part('glasses'), neck=part('neck'), bottom=part('bottom'), bag=part('bag');
    const sound=['headphones','earmuffs'].includes(p.audio) ? part('audio') : '';
    const skirt=!ensemble && (p.bottom.includes('skirt') || p.bottom==='harbour-wrap') ? bottom : '';
    const tokens=[hat,glasses,sound,hair,dyed,top,skirt,bottom,bag,neck,part('shoes')].filter(Boolean);
    const pairs=[];
    // Front-facing features take precedence over a pack hidden behind the torso.
    function pair(left,right) { if(left && right) pairs.push(left+'与'+right); }
    if(hat) { pair(hat,dyed); pair(hat,skirt || glasses); }
    if(glasses || sound) { pair(glasses || sound,dyed); pair(glasses || sound,skirt); }
    if(skirt) { pair(dyed,skirt); pair(hair,skirt); }
    pair(hair,dyed);
    pair(dyed,bag); pair(dyed,bottom); pair(dyed,neck); pair(hair,bag);
    // Keep a third visible detail if two real figures share both leading ones.
    const more=[hat || glasses || hair,dyed,bottom,bag || part('shoes')].filter(Boolean);
    for(let n=2;n<more.length;n++) pairs.push(more.slice(0,n+1).join('、'));
    return {tokens:[...new Set(tokens)],titles:[...new Set(pairs)]};
  }
  function index(docs,options) {
    const originals=new Map(), used=new Set();
    for(const doc of docs) {
      originals.set(doc.id,doc.label);
      const {titles}=features(doc,options);
      const title=titles.find(value=>!used.has(value));
      if(!title) throw new Error('人物需要新的可见辨识特征 '+doc.id);
      used.add(title); doc.label=title;
    }
    return originals;
  }
  return {features,index};
})();
