// Garments are drawn in the wearer's local coordinates. IDs describe a cut, independent of dye and wearer.
const pineSeasonalWardrobe = (() => {
  // Name, gallery family, body cut, collar, surface construction, sleeve.
  const tops={
    'banker-shirt':['细条纹扣领衬衫','tailored','shirt','point','pinstripe','cuff'],
    'linen-blouse':['七分袖麻衬衫','casual','shirt','split','tucks','three-quarter'],
    'cropped-blazer':['短款驳领西装','tailored','coat','lapel','crop','cuff'],
    'two-button-suit':['两粒扣西装','tailored','coat','lapel','single','suit'],
    'loopback-hoodie':['袋鼠兜连帽卫衣','casual','knit','hood','pouch','rib'],
    'zip-hoodie':['拉链连帽卫衣','casual','knit','hood','zip','rib'],
    'pointelle-cardigan':['镂纹圆领开衫','knits','knit','round','eyelet','rib'],
    'pocket-tee':['胸袋圆领短袖','casual','shirt','round','pocket','short'],
    'band-tee':['宽横条短袖','casual','shirt','boat','bands','short'],
    'rib-tank':['罗纹背心','casual','shirt','tank','vertical','bare'],
    'linen-camp':['亚麻开领短袖衬衫','casual','shirt','camp','seam','short'],
    'pique-polo':['珠地撞领运动衫','active','shirt','polo','placket','short'],
    'sundress-bodice':['细吊带收腰裙上身','casual','shirt','straps','waist','bare'],
    'gingham-blouse':['方领格纹泡袖衫','casual','shirt','square','gingham','puff'],
    'flannel-overshirt':['大格纹法兰绒衬衫','casual','coat','point','plaid','cuff'],
    'double-suit':['双排扣戗驳领西装','tailored','coat','peak','double','suit'],
    'crew-sweat':['三角插片圆领卫衣','casual','knit','round','gusset','rib'],
    'boxy-hood':['落肩拼袖连帽衫','casual','knit','hood','sidepanels','contrast'],
    'vneck-pullover':['嵌条V领毛衫','knits','knit','vneck','edging','rib'],
    'belted-trench':['腰带叠襟风衣','tailored','long','lapel','storm','tab'],
    'cord-shirtcoat':['灯芯绒衬衫夹克','casual','coat','point','cord','tab'],
    'channel-puffer':['横格蓬松羽绒服','active','coat','stand','quilt','padded'],
    'hood-parka':['带帽大口袋棉服','active','long','hood','park','tab'],
    'toggle-duffle':['牛角扣粗呢大衣','casual','long','stand','toggles','tab'],
    'shawl-knit':['青果领厚开衫','knits','knit','shawl','basket','rib'],
    'rib-rollneck':['高领罗纹针织衫','knits','knit','roll','ribbing','rib'],
    'wool-overcoat':['翻领长呢大衣','tailored','long','peak','welt','suit'],
    'wrap-bodice':['系带裹身裙上衣','casual','shirt','wrap','tie','three-quarter'],
    'mandarin-jacket':['立领一字扣便褂','robes','coat','stand','frogs','turnback'],
    'qipao-bodice':['斜襟盘扣旗袍上身','robes','shirt','mandarin','curved','cap'],
    'cross-ru':['缘边交领短襦','robes','shirt','cross','girdle','wide'],
    'cotton-yukata':['棉浴衣上身','robes','shirt','cross','obi','square-sleeve'],
    'open-haori':['敞襟羽织','robes','coat','haori','cords','wide'],
    'festival-happi':['宽襟祭典法被','robes','coat','happi','crest','square-sleeve'],
    'western-yoke':['尖肩片西部按扣衬衫','casual','shirt','point','western','snap'],
    'letterman-jacket':['拼袖棒球夹克','active','coat','varsity','letter','contrast'],
    'denim-trucker':['双胸袋短牛仔夹克','casual','coat','point','trucker','tab'],
    'aran-cardigan':['阿兰绞花开衫','knits','knit','vneck','aran','rib'],
    'bleu-workcoat':['法式三袋工作夹克','work','coat','point','threepocket','turnback'],
    'highland-waistcoat':['尖摆呢料马甲','tailored','coat','vneck','waistcoat','shirtsleeve'],
    'zhongshan-jacket':['四袋立翻领中山装上衣','tailored','coat','closed','four-pockets','cuff'],
    'plum-qipao':['梅枝滚边长旗袍上身','robes','shirt','mandarin','plum','three-quarter'],
    'furisode-robe':['扇花纹振袖和服上身','robes','shirt','cross','furisode','furisode'],
    'rodeo-shirt':['箭头袋口西部演出衬衫','casual','shirt','point','rodeo','snap'],
    'dirndl-bodice':['短袖衬衣拼束身胸衣','robes','shirt','scoop','dirndl','blouse-puff']
  };
  // Knee and ankle widths; shorts also specify where the cloth ends on the thigh.
  const bottoms={
    'two-pleat-slacks':['双褶西裤',1.05,1.26,'pressed'], 'linen-wide':['亚麻阔腿裤',1.22,1.70,'linen'],
    'denim-straight':['直筒牛仔裤',1.05,1.26,'denim'], 'denim-bootcut':['微喇牛仔裤',.99,1.61,'flare'],
    'pleated-hakama':['宽褶袴裤',1.28,1.72,'hakama'], 'fleece-jog':['罗口卫裤',1.12,.87,'sweat'],
    'bermuda-shorts':['翻边百慕大短裤',1.16,1,'hem',.86], 'linen-shorts':['抽绳亚麻短裤',1.23,1,'drawcord',.53]
  };
  const skirts={
    'office-pencil':['直筒通勤裙',.98,.22,1.13,4],'bias-midi':['斜裁中长裙',.97,.47,1.34,5],
    'pleated-mini':['箱褶短裙',.70,.01,1.51,12],'summer-tier':['层褶夏裙',1,.51,1.62,12],
    'circle-skirt':['伞摆裙',.96,.28,1.73,9],'wool-a-line':['呢料A字裙',.95,.09,1.47,5],
    'mamian-skirt':['侧褶马面裙',1,.68,1.52,20],'qipao-column':['侧开衩旗袍裙身',1,.46,1.12,2],
    'yukata-hem':['浴衣叠襟下摆',1,.74,1.26,3],'highland-kilt':['苏格兰格呢褶裙',.97,.055,1.38,16],
    'plum-qipao-hem':['梅枝开衩长旗袍裙身',1,.68,1.13,2],
    'furisode-hem':['扇花纹和服长下摆',1,.84,1.25,3],
    'dirndl-apron':['系褶围裙与宽摆裙',.99,.52,1.69,10]
  };
  const shoes={
    'penny-loafers':['一字带乐福鞋',.55,0,'penny'],'bow-flats':['蝴蝶结芭蕾鞋',.47,0,'bow'],
    'fisherman-sandals':['包头编带凉鞋',.52,0,'straps'],'slip-on-canvas':['松紧口帆布鞋',.55,0,'canvas'],
    'snow-boots':['翻绒雪地靴',.74,.51,'snow'],'derby-laceups':['开放襟德比鞋',.58,0,'derby'],
    'cowboy-boots':['弧口西部靴',.68,.57,'western'],'thong-zori':['夹趾草履',.40,0,'zori']
  };
  const neck={'knit-snood':'厚针织围脖','checked-muffler':'格纹长围巾','silk-foulard':'三角丝巾',
    'slim-tie':'窄版领带','sailor-kerchief':'打结海员巾','ribbon-tie':'垂带蝴蝶领结'};
  const names=list=>Object.fromEntries(Object.entries(list).map(([key,value])=>[key,value[0]]));
  const choices={top:names(tops),bottom:{...names(bottoms),...names(skirts)},shoes:names(shoes),neck};
  const seasons={spring:'春',summer:'夏',autumn:'秋',winter:'冬'};
  const regions={daily:'日常通用',cn:'中国',jp:'日本',us:'美国',eu:'欧洲'};
  const families={suit:'西装',skirt:'裙装',hoodie:'卫衣',shirt:'衬衫',knit:'针织',coat:'外套',light:'T恤与背心',traditional:'传统服饰'};
  const outfits={};
  // Palette order follows the garment down to the ground. Trim is a separate dye.
  function look(id,label,season,region,types,top,bottom,shoe,neckwear,palette) {
    const [shirt,trousers,foot,trim]=palette.split(' ').map(hex=>'#'+hex);
    outfits[id]={label,seasons:season.split(' '),region,families:types.split(' '),
      parts:{top,bottom,shoes:shoe,neck:neckwear}, colors:{top:shirt,bottom:trousers,shoes:foot,accent:trim}};
  }
  look('spring-stripes','细条衬衫与双褶西裤','spring autumn','daily','shirt','banker-shirt','two-pleat-slacks','derby-laceups','slim-tie','9cb8c7 505b67 624c43 765064');
  look('linen-sage','七分袖与亚麻阔腿裤','spring summer','daily','shirt','linen-blouse','linen-wide','penny-loafers','none','d8c9ad 799383 87664e ac8c6f');
  look('apricot-suit','短西装与直筒裙','spring autumn','daily','suit skirt','cropped-blazer','office-pencil','bow-flats','silk-foulard','bc9d89 716777 6b514c 839e93');
  look('navy-two-piece','深蓝两粒扣西服','spring autumn','daily','suit','two-button-suit','two-pleat-slacks','derby-laceups','slim-tie','4a5a73 4a5a73 554542 a86e70');
  look('moss-hoodie','草绿袋鼠兜卫衣','spring autumn','daily','hoodie','loopback-hoodie','fleece-jog','slip-on-canvas','none','799174 666c76 e1d3b8 cab892');
  look('plum-zip','莓红拉链卫衣与短裤','spring summer','daily','hoodie','zip-hoodie','bermuda-shorts','slip-on-canvas','none','aa6c76 7e8590 e1d1ba bda2a2');
  look('petal-cardi','镂纹开衫与伞摆裙','spring','daily','knit skirt','pointelle-cardigan','circle-skirt','bow-flats','ribbon-tie','b598ad 7d718d 865d69 d1c5a9');
  look('pocket-summer','口袋短袖与亚麻短裤','summer','daily','light','pocket-tee','linen-shorts','fisherman-sandals','none','d59778 899985 b48b66 e6c9a2');
  look('sail-stripes','宽条短袖与翻边短裤','summer','daily','light','band-tee','bermuda-shorts','slip-on-canvas','sailor-kerchief','e3d9c4 8797a2 b9a086 5e7989');
  look('pool-tank','罗纹背心与阔腿长裤','summer','daily','light','rib-tank','linen-wide','fisherman-sandals','none','759e9a b8a58e 8c715b a7b49b');
  look('linen-camp-look','开领衬衫与亚麻短裤','summer','daily','shirt','linen-camp','linen-shorts','fisherman-sandals','none','b4a278 8293a0 997957 dbcbac');
  look('courtside-polo','撞领短衫与百慕大裤','summer','daily','shirt','pique-polo','bermuda-shorts','slip-on-canvas','none','86a9a4 c0aa8e ddceb9 556f7e');
  look('sundress','松石色吊带伞裙','summer','daily','skirt','sundress-bodice','circle-skirt','bow-flats','none','709b94 709b94 b38571 ddc8a1');
  look('gingham-picnic','格纹泡袖衫与层褶裙','summer spring','daily','shirt skirt','gingham-blouse','summer-tier','fisherman-sandals','none','be8583 d6c3a7 9d795b e5ceba');
  look('flannel-weekend','大格衬衫与直筒牛仔裤','autumn spring','daily','shirt','flannel-overshirt','denim-straight','penny-loafers','none','9a6861 667e93 725943 625965');
  look('double-breast','灰绿双排扣西装','autumn winter','daily','suit','double-suit','two-pleat-slacks','derby-laceups','none','697a73 697a73 604c41 c1ab80');
  look('crew-denim','圆领卫衣与微喇牛仔裤','autumn spring','daily','hoodie','crew-sweat','denim-bootcut','slip-on-canvas','none','bc8d65 6a8194 d6c9ae d9b896');
  look('campus-hood','拼袖连帽衫与箱褶短裙','autumn spring','daily','hoodie skirt','boxy-hood','pleated-mini','slip-on-canvas','none','8594aa 69687b ccbfaa d0bc99');
  look('ochre-vneck','V领毛衫与呢料A字裙','autumn','daily','knit skirt','vneck-pullover','wool-a-line','penny-loafers','none','b19461 777f6c 806451 e0cfad');
  look('rain-trench','束腰风衣与微喇裤','autumn spring','daily','coat','belted-trench','denim-bootcut','derby-laceups','none','b1997e 63748a 7d6251 786453');
  look('cord-walk','灯芯绒夹克与翻边长裤','autumn','daily','shirt coat','cord-shirtcoat','cuffed-denim','penny-loafers','none','988059 667987 785844 c8b490');
  look('snow-puffer','羽绒服与翻绒雪地靴','winter','daily','coat','channel-puffer','fleece-jog','snow-boots','knit-snood','b1bec7 626a77 a38773 c58270');
  look('forest-parka','带帽棉服与格纹围巾','winter','daily','coat','hood-parka','denim-straight','snow-boots','checked-muffler','788966 657183 886d56 c79c7a');
  look('navy-duffle','牛角扣大衣与软围脖','winter','daily','coat','toggle-duffle','two-pleat-slacks','snow-boots','knit-snood','596981 877b78 755e4c cab68e');
  look('oat-shawl','厚针开衫与斜裁裙','winter autumn','daily','knit skirt','shawl-knit','bias-midi','gaiter-boots','none','c9bb9f 807185 896c58 a5937f');
  look('wine-rollneck','高领毛衣与呢裙','winter autumn','daily','knit skirt','rib-rollneck','wool-a-line','gaiter-boots','none','9c6974 606b7d 6f534c c5a486');
  look('camel-overcoat','长呢大衣与格纹围巾','winter','daily','coat','wool-overcoat','two-pleat-slacks','derby-laceups','checked-muffler','b39978 625a65 745746 916d65');
  look('wrap-dress','斜襟裹身中长裙','spring summer','daily','skirt','wrap-bodice','bias-midi','bow-flats','none','aa777a aa777a 855e61 e1c5a3');
  look('cn-qipao','豆绿斜襟旗袍','summer','cn','traditional skirt','qipao-bodice','qipao-column','bow-flats','none','849787 849787 8b7068 d8bc9a');
  look('cn-zhongshan','四袋五扣中山装','spring autumn','cn','traditional suit coat','zhongshan-jacket','two-pleat-slacks','derby-laceups','none','526575 526575 443f3c b6b7a0');
  look('cn-plum-qipao','绛红梅枝长旗袍','spring autumn','cn','traditional skirt','plum-qipao','plum-qipao-hem','bow-flats','none','924656 924656 704049 d9ae78');
  look('cn-mamian','交领短襦与侧褶马面裙','spring autumn','cn','traditional skirt','cross-ru','mamian-skirt','flats','none','d6c5a1 986369 805c55 c9a463');
  look('cn-cloth-jacket','立领盘扣便褂与阔腿裤','spring autumn','cn','traditional coat','mandarin-jacket','linen-wide','penny-loafers','none','677d81 595b68 5d4c45 b7ab8d');
  look('jp-furisode','绀青扇花纹振袖和服','spring autumn winter','jp','traditional skirt','furisode-robe','furisode-hem','thong-zori','none','475b85 475b85 784e48 d9a35d');
  look('jp-yukata','靛蓝棉浴衣与草履','summer','jp','traditional','cotton-yukata','yukata-hem','thong-zori','none','637995 637995 90755e d4b477');
  look('jp-haori','敞襟羽织与宽褶袴裤','spring autumn','jp','traditional coat','open-haori','pleated-hakama','thong-zori','none','768575 62667a 867453 baab94');
  look('jp-happi','宽襟法被与束口裤','summer autumn','jp','traditional coat','festival-happi','balloon-pants','thong-zori','none','5e8397 555f76 886e56 e1cdb0');
  look('us-rodeo','卷檐毡帽与西部演出衬衫','spring autumn','us','shirt traditional','rodeo-shirt','denim-bootcut','cowboy-boots','bolo','893f49 465b70 965e41 dfb574');
  look('us-western','尖肩片衬衫与西部靴','spring autumn','us','shirt traditional','western-yoke','denim-bootcut','cowboy-boots','bolo','bd8d65 697c91 9b7350 e2c7a2');
  look('us-campus','拼袖棒球夹克与直筒裤','spring autumn','us','coat','letterman-jacket','denim-straight','slip-on-canvas','none','597a71 65778a d3c9b1 d1bba0');
  look('us-trucker','双袋牛仔夹克与微喇裤','autumn spring','us','coat','denim-trucker','denim-bootcut','cowboy-boots','silk-foulard','718a9e 556b85 a07a58 c39575');
  look('at-dirndl','奥地利束身胸衣与围裙裙装','spring summer autumn','eu','traditional skirt','dirndl-bodice','dirndl-apron','bow-flats','none','466e60 505771 805b4c bf7a84');
  look('sc-kilt','苏格兰呢马甲与格呢裙','autumn winter','eu','traditional skirt','highland-waistcoat','highland-kilt','derby-laceups','ribbon-tie','6a6b65 6d8477 605952 af786e');
  look('ie-aran','爱尔兰阿兰绞花开衫','autumn winter','eu','knit','aran-cardigan','wool-a-line','gaiter-boots','none','c0ae8b 778372 876d52 e1cfaa');
  look('fr-bleu','法国蓝布工作夹克','spring autumn','eu','coat','bleu-workcoat','denim-straight','derby-laceups','none','587791 636c79 705e50 c5b497');
  outfits['us-rodeo'].parts.hat='pine-core/western-felt';
  outfits['us-rodeo'].colors.hat='#c69865';
  outfits['us-rodeo'].keepAccessories=true;
  outfits['cn-plum-qipao'].colors.embroidery='#e39aa4';
  outfits['jp-furisode'].colors.embroidery='#e29697';
  outfits['us-rodeo'].colors.embroidery='#79a69c';
  const textileNames={
    'cn-qipao':'旗袍 cheongsam qipao','cn-plum-qipao':'旗袍 梅花 cheongsam qipao','cn-zhongshan':'中山装 Zhongshan suit',
    'jp-yukata':'浴衣 和服 yukata kimono','jp-furisode':'振袖 和服 furisode kimono',
    'us-rodeo':'美国西部 牛仔 西部毡帽 rodeo western','us-western':'美国西部 牛仔 western',
    'at-dirndl':'奥地利 阿尔卑斯 围裙 Dirndl','sc-kilt':'苏格兰 高地 格呢 tartan kilt'
  };
  for (const [id,names] of Object.entries(textileNames)) outfits[id].keywords=names;
  const embroidered=({top,bottom})=>['plum-qipao','furisode-robe','rodeo-shirt'].includes(top) ||
    ['plum-qipao-hem','furisode-hem'].includes(bottom);
  // Dress an existing member where the context fits. IDs, faces and personal equipment stay with the wearer.
  const wearers={
    architecture_drafter:'spring-stripes', dyeworks_grader:'linen-sage', museumcrew_curator:'apricot-suit',
    chamber_conductor:'navy-two-piece', indiegames_tools:'moss-hoodie', artclub_comic:'plum-zip',
    bookfair_letterer:'petal-cardi', rockpools_sand:'pocket-summer', rockpools_tide:'sail-stripes',
    ballet_modern:'pool-tank', coffee_buyer:'linen-camp-look', veloclub_coach:'courtside-polo',
    bookfair_teller:'sundress', horticulture_orchid:'gingham-picnic', petrescue_walker:'flannel-weekend',
    airfield_lounge:'double-breast', broadcast_mixer:'crew-denim', artclub_model:'campus-hood',
    bookfair_editor:'ochre-vneck', architecture_survey:'rain-trench', architecture_modeler:'cord-walk',
    weatherdesk_wind:'snow-puffer', weatherdesk_rain:'forest-parka', tram_planner:'navy-duffle',
    museumcrew_registrar:'oat-shawl', broadcast_producer:'wine-rollneck', broadcast_field:'camel-overcoat',
    chamber_flute:'wrap-dress', silkloom_warp:'cn-cloth-jacket', museumcrew_educator:'cn-qipao',
    silkloom_brocade:'cn-mamian', bookfair_artist:'jp-yukata', dyeworks_mentor:'jp-haori',
    dyeworks_dyer:'jp-happi', chamber_bass:'us-western', artclub_collage:'us-campus',
    coffee_roaster:'us-trucker', bookfair_dealer:'ie-aran', dyeworks_weaver:'fr-bleu', chamber_viola:'sc-kilt',
    museumcrew_keeper:'cn-zhongshan', silkloom_dye:'cn-plum-qipao', dyeworks_stitcher:'jp-furisode',
    broadcast_host:'us-rodeo', dyeworks_forager:'at-dirndl'
  };
  const near=(v,center,radius)=>Math.abs(v-center)<radius;
  // Original pixel charts. One large motif leaves legible areas of plain cloth
  // on either side. Coordinates are local to the garment and turn with it.
  const plumBranch = [
    '.......pep.....','......ppepp....','.....aeheea....','......aeea.....',
    '....a..s.......','..pep.s...pep..','.ppehps..ppehp.',
    '..aeea.s..aeea.','....ss.s.ss....','......sss......','........ss.....'
  ];
  const foldingFan = [
    '.....hhhhh.....','...hhlllllhh...','.hhllaaallaalh.','.hlaacaaacaaalh',
    'hlaaacaaacaaalh','.hsaaacacaaash.','...hsacacash...','.....shchs.....',
    '.......hs......'
  ];
  function motif(rows,x,y,k) {
    if (Math.abs(x)>=1 || Math.abs(y)>=1) return 0;
    const row=rows[Math.floor((1-y)*.5*rows.length)];
    switch (row[Math.floor((1+x)*.5*row.length)]) {
      case 'a': return k.accent;
      case 'h': return k.trimLight;
      case 'e': return k.embroidery;
      case 'p': return k.petals;
      case 'c': return k.embroideryShade;
      case 'l': return k.lining;
      case 's': return k.trimShade;
      default: return 0;
    }
  }
  function qipaoEdge(t) {
    const turn=Math.max(0,Math.min(1,(.96-t)/.40));
    return -.055-.77*turn*(2-turn); // from the throat to the wearer's right
  }
  function kimonoCloth(furisode,u,v,t,k) {
    const front=u>.12, sashLow=furisode?.10:.08, sashHigh=furisode?.50:.37;
    if (t>=sashLow && t<=sashHigh) {
      const h=(t-sashLow)/(sashHigh-sashLow);
      if (h<.10 || h>.91) return k.trimShade;
      if (furisode && near(h,.53,.075)) return k.lining;
      if (furisode && (Math.abs((Math.abs(v)*2.5)%1-.5)+Math.abs(h-.5)*1.22)<.36) return k.trimLight;
      return k.accent;
    }
    if (front) {
      // The outer left collar runs from the wearer's left shoulder to right waist.
      const edge=.72+.48*v;
      if (near(t,edge,.082)) return t>edge+.026?k.lining:k.topShade;
      if (v<0 && t>edge && near(t,.72-.48*v,.066)) return k.lining;
      if (furisode && v>.16 && t>.55) {
        const ink=motif(plumBranch,(v-.54)/.40,(t-.75)/.23,k);
        if (ink) return ink;
      }
    }
    if (!furisode && t<sashLow && Math.cos(v*7+u*2)>.60) return k.topLight;
    return k.top;
  }
  function fabric(id,u,v,t,k) {
    const [,,,collar,detail]=tops[id], a=Math.abs(v), front=u>.10;
    if (detail==='furisode' || detail==='obi') return kimonoCloth(detail==='furisode',u,v,t,k);
    const button=(at,spacing=.19)=>front && near(v,at,.065) && t>.17 && t<.84 && Math.cos((t-.34)*2*Math.PI/spacing)>.53;
    // Lapels and an open shirt reveal a separate facing underneath the top cloth.
    if(front) {
      if(collar==='lapel'||collar==='peak'||collar==='shawl') {
        const edge=Math.max(0,(t-(collar==='shawl'?.39:.30))*(collar==='peak'?.98:.82));
        if(a<edge) {
          if(a<edge*.54) return k.lining;
          if(collar!=='shawl' && t>.72 && t<.79 && a>edge*.79) return k.top;
          return a>edge-.057 ? k.topLight : k.topShade;
        }
      }
      if(['point','camp','polo'].includes(collar)) {
        const point=.90-.18*Math.max(0,1-Math.abs(a-.27)/.26);
        if(a<.56 && t>point) return collar==='polo'?k.accent:k.topLight;
        if(collar==='camp' && a<Math.max(0,(t-.74)*1.12)) return k.skin;
      }
      if(collar==='split' && a<(t-.76)*.8) return k.skin;
      if(collar==='round'||collar==='boat'||collar==='square'||collar==='tank'||collar==='straps'||collar==='vneck') {
        let edge=.89+.22*a*a;
        if(collar==='boat') edge=.87+.12*a;
        if(collar==='square') edge=a<.53?.77:1;
        if(collar==='tank') edge=.73+.39*a*a;
        if(collar==='vneck') edge=.62+.52*a;
        if(collar==='straps') edge=a>.49&&a<.67 ? 1 : .72+.045*a;
        if(t>edge) return collar==='vneck' ? k.lining : k.skin;
        if(near(t,edge,.033)) return collar==='vneck' ? k.accent : k.topShade;
      }
      if(collar==='wrap'||collar==='cross') {
        const band=t-.69-.45*v;
        if(near(band,0,.055)) return k.accent;
        if(near(band,.072,.026) || (v<0 && near(t,.74-.41*v,.034))) return k.lining;
      }
      if(collar==='haori'||collar==='happi') {
        const opening=(collar==='haori'?.19:.07)+.22*t;
        if(a<opening) return k.lining;
        if(a<opening+.16) return collar==='happi'?k.topShade:k.accent;
      }
      if(collar==='hood' && t>.66 && near(a,.24,.047)) return t>.70?k.lining:k.brass;
    }
    if(collar==='roll' && t>.82) return Math.cos(t*64)>.55 ? k.topLight:k.topShade;
    if((collar==='stand'||collar==='mandarin') && t>.88 && (!front || a>.07)) return t<.925?k.accent:k.topShade;
    if(collar==='varsity' && t>.89+.10*a) return t>.94?k.accent:k.lining;
    const pocket=front && a>.27 && a<.72 && t>.26 && t<.43;
    const breast=front && v>.23 && v<.64 && t>.54 && t<.73;
    switch(detail) {
      case 'single': case 'double': case 'crop': case 'welt':
        if(detail==='crop' && t<.22) return k.lining;
        if(button(detail==='double'?.32:.03,.22) || (detail==='double'&&button(-.32,.22))) return k.brass;
        if(pocket && t>.372 && t<.42) return k.topShade;
        if(detail==='welt' && front && near(v,-.24,.042) && t<.69) return k.topLight;
        break;
      case 'storm':
        if(near(t,.33,.062)) return front && a<.15 ? k.brass : k.accent;
        if(t>.62+.18*a && (!front || v>.18)) return t<.66+.18*a ? k.topShade:k.topLight;
        break;
      case 'pinstripe': if(Math.cos(17*v+3*u)>.79) return k.lining; break;
      case 'tucks': if(front && a>.18 && a<.55 && t>.48 && Math.cos(24*v)>.2) return k.topLight; break;
      case 'pouch': if(front && t>.14 && t<.43 && a<.71-.62*t) return a>.58-.62*t?k.topShade:k.topLight; break;
      case 'zip': if(front && (a<.065 || (a>.36 && a<.70 && near(t,.18+.37*a,.035)))) return k.trimLight; break;
      case 'eyelet': if(front && button(0)) return k.brass;
        if(a>.19 && a<.71 && Math.cos(19*v+11*t)>.62 && Math.cos(19*v-11*t)>.58) return k.topShade; break;
      case 'pocket': if(breast) return t>.68?k.topShade:k.topLight; break;
      case 'bands': if(Math.cos(t*26+1.2*u)>.22) return k.accent; break;
      case 'vertical': if(Math.cos(v*23+u*2)>.52) return k.topShade; break;
      case 'seam': if(breast && (t>.675 || v>.58)) return k.topLight; break;
      case 'placket': if(front && a<.093 && t>.53) return button(0,.13)?k.brass:k.accent; break;
      case 'waist': if(t<.17) return t<.11?k.accent:k.topLight; break;
      case 'gingham': case 'plaid': {
        const wide=detail==='plaid', warp=Math.cos(v*(wide?11:17)+u*2)>.24, weft=Math.cos(t*(wide?21:30))>.23;
        if(warp&&weft) return k.topShade;
        if(warp||weft) return wide ? k.accent:k.lining;
        break;
      }
      case 'gusset': if(front && a<.34 && Math.abs(t-.65-.76*a)<.052) return k.topShade; break;
      case 'sidepanels': if(a>.66+.14*t) return k.accent; break;
      case 'edging': if(t<.16 || (front && near(t,.56+.49*a,.033))) return k.accent; break;
      case 'cord': if(breast || pocket) return t>.66 || t>.375&&t<.43 ? k.topShade:k.topLight;
        if(Math.cos(v*23+u*4)>.68) return k.topLight; break;
      case 'quilt': if(front&&a<.06) return k.trimLight;
        if(Math.cos(t*30+.7*a)>.59) return k.topShade; if(Math.cos(t*30+.7*a)<-.62) return k.topLight; break;
      case 'park': if(pocket) return t>.37?k.accent:k.topShade; if(front && a<.10) return k.topLight; break;
      case 'toggles': if(front && a<.39 && t>.27&&t<.81 && Math.cos((t-.36)*28)>.58) return a<.15?k.lining:k.accent; break;
      case 'basket': if(Math.cos(13*v)*Math.cos(22*t)>.43) return k.topLight; break;
      case 'ribbing': if(Math.cos(v*19+u*2)>.60) return k.topLight; break;
      case 'tie': if(near(t,.28,.042) || (front && v>.18 && t<.30 && near(v,.32-.48*t,.07))) return k.accent; break;
      case 'frogs': if(front && a<.31 && t>.20 && t<.88 && Math.cos((t-.32)*27)>.50) return a<.09?k.brass:k.accent; break;
      case 'curved': case 'plum':
        if (front && t>.33 && near(v,qipaoEdge(t),.062)) return k.accent;
        if (detail==='plum' && (front || u<-.35)) {
          const ink=motif(plumBranch,(v-(front?.40:-.36))/.32,(t-(front?.49:.64))/.21,k);
          if (ink) return ink;
        }
        return k.top;
      case 'four-pockets': {
        if (!front) return k.top;
        const collarTip=.79+.48*Math.abs(a-.32);
        if (t>collarTip && a<.52) return t<collarTip+.055?k.topShade:k.topLight;
        if (near(v,0,.046) && t<.92) return k.topShade;
        const chest=t>.52, center=chest?.47:.50, span=chest?.205:.245;
        const base=chest?.56:.105, flap=base+(chest?.117:.15)+.055*Math.abs(a-center)/span;
        if (Math.abs(a-center)<span && t>base && t<flap+.065) {
          if (t>flap) return k.topLight;
          if (near(t,flap,.030) || near(t,base,.020) || (!chest && near(a,center,.036))) return k.topShade;
          return k.top;
        }
        break;
      }
      case 'dirndl': {
        const neckline=front?.64+.43*a*a:.82+.17*a;
        if (t>neckline) return k.lining;
        if (near(t,neckline,.032)) return k.trimLight;
        if (front && a<.29 && t>.18 && t<.67) {
          const lacing=Math.abs(((t-.18)*4.8)%1-.5)*.48;
          if (near(a,lacing,.044)) return k.trimLight;
          if (near(a,.248,.035)) return k.trimShade;
        }
        if (t<.12) return k.accent;
        break;
      }
      case 'cords': if(front && a<.47 && near(t,.46+.15*a,.041)) return k.accent; break;
      case 'crest': if(!front && (v/.37)**2+((t-.63)/.18)**2<1) return a<.085 || near(t,.65,.039)?k.topShade:k.lining;
        if(t<.14 && Math.cos(15*v+4*u)>.15) return k.accent; break;
      case 'western': case 'rodeo': {
        const yoke=front ? .59+.41*Math.abs(a-.47) : .58+.28*a;
        if (near(t,yoke,.027)) return k.lining;
        if (t>yoke) {
          if (detail==='rodeo' && a>.20 && a<.74 && near(t,.75+.08*Math.cos((a-.20)*10),.044)) return k.embroidery;
          return k.accent;
        }
        if (front && a>.29 && a<.72 && near(t,.48+.12*(a-.32),.027)) return k.trimLight;
        if (front && detail==='rodeo' && near(a,.32,.07) && near(t,.49,.044)) return k.accent;
        if (button(0,.16)) return k.lining;
        break; }
      case 'letter': if(front && v>.27 && v<.58 && t>.54 && t<.77 && (v<.36 || t<.61)) return k.lining;
        if(t<.13) return t>.065?k.accent:k.topShade; break;
      case 'trucker': if(front && a>.25 && a<.71 && t>.52 && t<.74) return t>.59+.22*Math.abs(a-.48)?k.topLight:k.topShade;
        if(front && near(a,.20+.16*t,.046)) return k.trimLight; break;
      case 'aran': if(near(a,.43+.086*Math.sin(t*21),.070) || near(a,.43-.086*Math.sin(t*21),.048)) return k.topLight;
        if(a>.68 && Math.cos(v*18+t*16)>.70) return k.topShade; if(button(0,.20)) return k.brass; break;
      case 'threepocket': if(pocket||breast) return t>.68 || t>.37&&t<.43?k.topShade:k.topLight; break;
      case 'waistcoat': if(t<.12+.17*a || (!front && t>.52)) return k.lining;
        if(pocket && t>.365 || button(0,.15)) return k.trimLight; break;
    }
    if(front && ['point','split','camp'].includes(collar) && a<.05) return button(0,.18)?k.brass:k.topShade;
    return t<.075?k.topShade:k.top;
  }
  function sleeve(id,t,u,v,side,r,fore,k) {
    const [,,,,mark,finish]=tops[id], a=side*v/r;
    if (finish==='blouse-puff') return t>.75?k.trimLight:k.lining;
    if ((mark==='plum' || mark==='curved') && t>.84) return k.accent;
    if (mark==='rodeo' && fore && t>.66) return t>.92?k.trimLight:k.accent;
    if(finish==='shirtsleeve') return fore&&t>.82?k.topLight:k.lining;
    if(finish==='padded') return Math.cos(16*t+.5*a)>.64?k.topShade:k.topLight;
    if(finish==='contrast') return fore&&t>.80 ? (t>.9?k.accent:k.topShade) : k.accent;
    if(finish==='square-sleeve'||finish==='wide') return fore&&t>.78 ? (t>.90?k.trimLight:k.accent) : k.top;
    if(fore&&t>.76) return finish==='turnback'?k.lining:finish==='tab'&&a>.28?k.accent:
      finish==='snap'&&Math.cos(t*40)>.36?k.brass:k.topShade;
    if(mark==='bands' && Math.cos(t*13)>.18 || mark==='western' && !fore&&t<.22) return k.accent;
    if((mark==='gingham'||mark==='plaid') && (Math.cos(t*17)>.4||Math.cos(v/r*9)>.67)) return k.accent;
    return a<-.49?k.topShade:k.top;
  }
  // The upper edge of the rectangular sleeve follows the arm, the free edge
  // hangs with gravity and trails slightly behind. Inverse-sample both faces.
  function hangingSleeve(id,b,k,pose,arm,height,radius) {
    const formal=id==='furisode-robe', {shoulder,elbow,wrist,side}=arm, m=pose.torso;
    const outward=[m[1]*side,m[5]*side,m[9]*side], forward=[m[0],m[4],m[8]];
    const seam=shoulder.map((v,i)=>v+.28*(elbow[i]-v)+.40*radius*outward[i]);
    const width=wrist.map((v,i)=>v+.11*(elbow[i]-v)+.61*radius*outward[i]-seam[i]);
    const lowered=Math.max(0,-width[2]/(Math.hypot(...width)||1));
    const drop=Math.max(.6*radius,Math.min(height*(formal?.215:.093),Math.min(seam[2],seam[2]+width[2])-.65*radius));
    // A resting sleeve folds inward and back under the forearm. Dropping it
    // parallel to a lowered arm collapses the entire sleeve to a thin line.
    const hang=forward.map((v,i)=>drop*(-(.32+.20*lowered)*v+(.09-.47*lowered)*outward[i]-(i===2?1:0)));
    const dot=(a,c)=>a[0]*c[0]+a[1]*c[1]+a[2]*c[2];
    const normal=[width[1]*hang[2]-width[2]*hang[1],width[2]*hang[0]-width[0]*hang[2],width[0]*hang[1]-width[1]*hang[0]];
    const area=Math.hypot(...normal);
    if (area<.01) return;
    const n=normal.map(v=>v/area), ww=dot(width,width), hh=dot(hang,hang), wh=dot(width,hang);
    const across=width.map((v,i)=>(v*hh-hang[i]*wh)/(area*area));
    const down=hang.map((v,i)=>(v*ww-width[i]*wh)/(area*area));
    const thickness=(.70+.18*lowered)*radius;
    const bounds=i=>[seam[i]+Math.min(0,width[i])+Math.min(0,hang[i])-thickness,
      seam[i]+Math.max(0,width[i])+Math.max(0,hang[i])+thickness];
    b.stamp(...bounds(0),...bounds(1),...bounds(2),(x,y,z)=>{
      const dx=x-seam[0], dy=y-seam[1], dz=z-seam[2];
      const u=dx*across[0]+dy*across[1]+dz*across[2], v=dx*down[0]+dy*down[1]+dz*down[2];
      if (u<0 || u>1 || v<0 || v>1) return 0;
      const hem=.98-.14*u*u-.15*Math.max(0,1-4*u)**2;
      if (v>hem || Math.abs(dx*n[0]+dy*n[1]+dz*n[2])>thickness*(.93-.40*v)) return 0;
      if (v>hem-.055) return formal?k.trimLight:k.topShade;
      if (u>.91 && v<.29) return k.lining;
      if (formal) {
        const ink=motif(foldingFan,(u-.60)/.36,(.62-v)/.24,k);
        if (ink) return ink;
        if (near(v,.74-.34*u,.035)) return k.trimLight;
      }
      return u<.14 || (v>.35 && near(u,.25+.10*v,.026))?k.topShade:k.top;
    });
  }
  function torsoDetails(id,b,k,d,w,low,tall,neck,fit,mount) {
    const point=(t,v,lift=0)=>mount?mount(t,v,lift*d):[(.99-.40*v*v+lift)*d,v*w,low+t*tall];
    if (id==='cotton-yukata' || id==='furisode-robe') {
      const formal=id==='furisode-robe', h=low+(formal?.34:.24)*tall;
      const depth=formal?1.23:1.07;
      for (const sign of [-1,1]) {
        const z=h+(formal?.041:0)*tall;
        b.blob(-depth*d,sign*(formal?.34:.25)*w,z,(formal?.46:.33)*d,(formal?.37:.29)*w,
          (formal?.18:.10)*tall,(x,y,pz)=>pz>z+.065*tall?k.trimLight:Math.abs(y)<.24*w?k.trimShade:k.accent,2.9);
      }
      b.blob(-(depth+.14)*d,0,h,.29*d,.14*w,(formal?.135:.095)*tall,k.trimShade,2.9);
      if (formal) {
        for (const sign of [-1,1]) {
          const tail=[-1.30*d,sign*.21*w,h-.066*tall];
          b.link(tail,[-1.20*d,sign*.30*w,h-.225*tall],.17*w,.13*w,.91,t=>t>.82?k.trimLight:k.accent);
        }
      }
      return;
    }
    const tunic=id==='zhongshan-jacket';
    if (!tunic && id!=='qipao-bodice' && id!=='plum-qipao') return;
    const rx=.49*fit.rx, ry=.48*fit.ry, z0=neck[2]-.09*tall, height=.16*tall;
    b.stamp(neck[0]-rx,neck[0]+rx,-ry,ry,z0,z0+height,(x,y,z)=>{
      const u=(x-neck[0])/rx,v=y/ry,h=(z-z0)/height, ring=u*u+v*v;
      const top=1-(u>0?.26*Math.max(0,1-3*Math.abs(v)):0);
      if (ring>1 || ring<.60 || h>top || (u>.70 && Math.abs(v)<.075)) return 0;
      return h>top-.22 ? (tunic?k.topLight:k.accent) : v>.60?k.topShade:k.top;
    });
    if (tunic) {
      for (const sign of [-1,1]) for (const [t,v,half,depth] of [[.63,.49,.205,.11],[.245,.50,.242,.133]]) {
        const center=point(t,sign*v), left=point(t,sign*v-half), right=point(t,sign*v+half);
        const bottom=point(t-depth,sign*v), top=point(t+depth,sign*v);
        const [cx,cy,cz]=center, ry=(right[1]-left[1])*.5, rz=(top[2]-bottom[2])*.5;
        const dy=(right[0]-left[0])/(2*ry), dz=(top[0]-bottom[0])/(2*rz);
        b.stamp(cx-d,cx+.8*d,cy-ry,cy+ry,cz-rz,cz+rz,(x,y,z)=>{
          const u=(y-cy)/ry, h=(z-cz)/rz;
          const flap=.29+.23*Math.abs(u), edge=Math.abs(u)>.88 || h<-.82;
          const surface=cx+dy*(y-cy)+dz*(z-cz)-.048*d*u*u;
          if (x<surface-.13*d || x>surface+(h>flap?.17:.10)*d || h<-.99+.14*u*u) return 0;
          if (h>flap) return h>flap+.22?k.topLight:k.topShade;
          return edge?k.topShade:k.top;
        });
      }
      for (const t of [.13,.31,.49,.67,.85]) {
        b.blob(...point(t,0,.043),.095*d,.080*w,.033*tall,k.trimLight);
      }
    } else {
      for (const t of [.91,.78,.61]) {
        const edge=qipaoEdge(t), p=point(t,edge,.039);
        b.link(point(t+.018,edge-.105,.025),point(t,edge+.13,.041),.053*w,.046*w,.80,()=>k.accent);
        b.blob(...p,.081*d,.069*w,.028*tall,k.trimLight);
      }
    }
  }
  function trouser(id,t,u,v,side,shin,k) {
    const mark=bottoms[id][3], a=v*side;
    if(mark==='pressed' && u>.15 && near(v,side*(.25+.11*t),.10)) return k.bottomLight;
    if(mark==='linen' && near(v,.39*side-.22*Math.sin(t*4.2),.15)) return k.bottomLight;
    if(mark==='denim'||mark==='flare') {
      if(!shin && t<.35 && (u<-.4 && near(t,.23+.12*Math.abs(a),.04) || near(a,.69-.51*t,.085))) return k.accent;
      if(near(a,.72,.095) || (shin&&t>.88&&mark==='flare')) return k.bottomShade;
    }
    if(mark==='hakama'&&Math.cos(13*v+u*1.8)>.27) return k.bottomShade;
    if(mark==='sweat'&&shin&&t>.77) return t>.9?k.bottomShade:k.bottomLight;
    if(mark==='hem'&&t>.78 || mark==='drawcord'&&t<.14) return k.bottomLight;
    return a<-.54?k.bottomShade:k.bottom;
  }
  function skirt(id,t,u,v,fold,k) {
    const a=Math.abs(v);
    if ((id==='qipao-column' || id==='plum-qipao-hem') && t>.67) {
      const opening=(t-.67)/.33;
      // Cut through the side seam to the layer beneath. The slit narrows to a
      // point above the hem and leaves the front and back panels continuous.
      if (a>.95-.34*(t-.67) || (a>.38 && Math.abs(u)<.30*opening)) return 0;
      if (a>.38 && near(Math.abs(u),.30*opening,.045)) return k.accent;
    }
    if (id==='qipao-column' || id==='plum-qipao-hem') {
      if (id==='plum-qipao-hem' && (u>.16 || u<-.22)) {
        const ink=motif(plumBranch,(v-(u>0?.34:-.32))/.52,(.72-t)/.20,k);
        if (ink) return ink;
      }
      return t>.949?k.accent:k.bottom;
    }
    if (id==='furisode-hem' || id==='yukata-hem') {
      if (u>.12 && near(v,-.43-.21*t,.045)) return k.bottomShade;
      if (id==='furisode-hem') {
        if (near(t,.78+.13*v+.045*u,.03)) return k.trimLight;
        const ink=motif(foldingFan,(v-(u>=0?.16:-.46))/.56,(.69-.11*v-t)/.14,k);
        if (ink) return ink;
        const bloom=motif(plumBranch,(v-(u>=0?-.58:.39))/.38,(.86-t)/.14,k);
        if (bloom) return bloom;
        if (t>.947) return k.trimShade;
      }
      return a>.87?k.bottomShade:k.bottom;
    }
    if (id==='dirndl-apron') {
      const edge=.66+.10*t, hem=.895-.035*v*v;
      if (u>.18 && a<edge && t<hem) {
        const bow=v-.36;
        if (t<.18 && Math.abs(bow)<.21 && near(t,.115,.028+.20*Math.abs(bow))) return k.trimLight;
        if (t>.115 && t<.33 && near(Math.abs(bow),.047+.54*(t-.115),.039)) return k.trimShade;
        if (t<.085 || a>edge-.042) return k.trimShade;
        if (near(t,.81,.024) || near(t,.855,.012)) return k.lining;
        if (t<.30 && Math.cos(v*32+t*2)>.66) return k.trimLight;
        return k.accent;
      }
      if (t<.085) return k.accent;
    }
    if(id==='mamian-skirt') {
      if(t>.91 || near(t,.81,.021) || (near(a,.46,.04)&&a<.60)) return k.accent;
      if(a<.46) return k.bottom;
    }
    if(id==='highland-kilt') {
      const warp=Math.cos(11*v+1.4*u),weft=Math.cos(19*t);
      if (warp>.94 || weft>.96) return k.trimLight;
      if (warp>.49 && weft>.33) return k.trimShade;
      if (warp>.49 || weft>.33) return k.accent;
      if (warp<-.63 || weft<-.59) return k.bottomShade;
      return k.bottom;
    }
    if(id==='office-pencil' && u<0 && t>.65 && a<.10*(t-.47)) return 0;
    if(id==='wool-a-line' && u>.1 && near(a,.54-.15*t,.047)) return k.bottomShade;
    if(id==='summer-tier' && (near(t,.49+.03*Math.cos(v*7),.036) || near(t,.78+.035*Math.cos(v*7),.035))) return k.bottomLight;
    if(id==='bias-midi' && near(fold,.3,.18) && t>.49) return k.bottomLight;
    if(id==='pleated-mini' && t>.85) return t>.93?k.bottomShade:k.accent;
    if(id==='circle-skirt' && t>.90) return k.bottomLight;
    return t<.06 || fold>.72 ? k.bottomShade : fold<-.72?k.bottomLight:k.bottom;
  }
  function shoe(id,f,a,z,k) {
    const mark=shoes[id][3],side=Math.abs(a);
    if(z<.31) return k.outsole;
    if(mark==='straps'||mark==='zori') {
      if(z<.62) return k.shoes;
      if(mark==='zori') return near(f,.41-.82*side,.13)?k.accent:0;
      return f>.64 || side>.73 || near(f,.25+.14*a,.12)||near(f,-.21-.24*a,.13)?k.shoes:0;
    }
    if(mark==='bow' && z>1 && f<.12 && side<.69) return near(f,.02,.08)&&side<.53?k.accent:k.skinLight;
    if(mark==='penny' && near(f,.15,.16)&&z>.97) return side<.27 ? k.shoeShade:k.shoeLight;
    if(mark==='canvas' && (z<.56 || (f<.27&&f>-.25&&near(side,.48,.14)))) return k.rubber;
    if(mark==='derby' && f>-.24&&f<.29&&side<.52&&Math.cos((f+.12*a)*23)>.20) return k.shoeShade;
    if(mark==='snow'&&z<.68 || mark==='western'&&near(f,.29-.52*side,.12)) return k.shoeLight;
    return f>.66?k.shoeLight:k.shoes;
  }
  function neckwear(id,b,k,d,w,h,z,mount) {
    const anchor=(level,y,offset=.06)=>mount?mount(level,y,offset*d):[(1.05-.38*y*y+offset)*d,y*w,z(level)];
    const link=(a,c,r,end,ink)=>b.link(a,c,r*w,end*w,.79,ink);
    if(id==='knit-snood'||id==='checked-muffler'){
      const scarf=id==='checked-muffler';
      b.blob(.02*d,0,z(.97),1.02*d,.81*w,(scarf?.088:.12)*h,(x,y,pz)=>
        Math.cos((pz-z(.97))*48/h+(scarf?y/w*7:0))>.39?k.trimLight:k.accent,2.65);
      if(scarf) {
        link(anchor(.93,-.26),anchor(.41,-.43),.20,.18,(t,u,v)=>Math.cos(t*25)>.28||Math.cos(v/w*25)>.62?k.trimShade:k.accent);
        link(anchor(.94,.33),anchor(.63,.46),.15,.14,t=>t>.81?k.trimLight:k.accent);
      }
      return;
    }
    if(id==='slim-tie') {
      b.blob(...anchor(.88,0),.14*d,.117*w,.056*h,k.trimShade);
      link(anchor(.86,0),anchor(.45,.03),.064,.096,t=>t>.84?k.trimShade:k.accent);return;
    }
    for(const sign of [-1,1]) {
      const ribbon=id==='ribbon-tie',depth=id==='silk-foulard'?.77:.70;
      link(anchor(.96,sign*.47),anchor(depth,.03),ribbon?.065:.12,ribbon?.08:.13,()=>k.accent);
      if(ribbon) b.blob(...anchor(.84,sign*.16),.16*d,.17*w,.056*h,k.accent,2.4);
      link(anchor(ribbon?.84:depth,.02),anchor(ribbon?.59:.66,sign*(ribbon?.18:.26)),.085,
        id==='sailor-kerchief'?.12:.041,t=>t>.72?k.trimLight:k.accent);
    }
  }
  const dressHems={'qipao-bodice':'qipao-column','plum-qipao':'plum-qipao-hem','cotton-yukata':'yukata-hem',
    'furisode-robe':'furisode-hem','dirndl-bodice':'dirndl-apron'};
  return {tops,bottoms,skirts,shoes,neck,choices,outfits,wearers,seasons,regions,families,dressHems,embroidered,
    fabric,sleeve,hangingSleeve,torsoDetails,trouser,skirt,shoe,neckwear};
})();
