// Stable role rosters. Each word is a named person and, optionally, a signature item.
// Each collection dresses from a short set of compatible cuts, before indexing the result.
const pineCharacterAlmanac = (() => {
  const fields = {food:'饮食与烹饪',health:'健康与照护',sport:'运动与休闲',design:'设计与影像',
    heritage:'文博与传承',media:'传媒与通信',habitat:'环境与栖居'};
  const settings = {kitchen:'厨房餐室',clinic:'诊所医院',museum:'博物展馆',garden:'花园温室',
    arena:'运动场馆',playground:'游戏角与游乐场',observatory:'观测台'};
  const scenes = [];
  function troupe(id,label,era,field,places,kit,profiles,roles) {
    scenes.push({id,label,era,field,places:places.split(' '),kit,profiles,
      roles:roles.trim().split(/\s+/).map(entry=>entry.split(':'))});
  }
  troupe('veloclub','城市骑行社','modern','sport','arena town transit','track','adult',
    'leader:骑行领队:map route:路线绘制员:folio mechanic:车队技师:tools coach:青训教练:stopwatch recorder:骑行记录员:camera marshal:路口引导员:flag medic:随队护理员:clinic courier:骑行补给员:flask');
  troupe('tram','有轨电车班组','modern','travel','town transit','uniform','adult',
    'driver:电车驾驶员:pass dispatcher:电车调度员:clipboard planner:线网规划员:map conductor:路面电车乘务员:pass host:候车厅服务员:badge fitter:车辆检修员:tools trainee:见习电车司机:notebook caller:到站播音员:earbuds');
  troupe('airfield','机场地面班组','modern','travel','transit workshop','flight','adult',
    'ramp:机坪协调员:headset dispatch:签派助理:clipboard luggage:行李分拣员:tag lounge:贵宾厅接待员:pass guide:航站楼问询员:map mechanic:航材检修员:tools weather:机场气象员:notebook load:载重平衡员:folio');
  troupe('coffee','街角咖啡馆','modern','food','kitchen town','cafe','adult',
    'roaster:咖啡烘焙师:mug brewer:手冲咖啡师:sprig buyer:生豆采购员:notebook host:咖啡馆领位员:bell trainer:拉花讲师:daisy counter:外带窗口店员:badge baker:咖啡馆司康师:berry artist:黑板菜单画师:folio');
  troupe('bakery','社区面包房','modern','food','kitchen town','baker','adult',
    'starter:天然酵种师:notebook oven:石炉面包师:scarf pastry:丹麦酥点师:berry proof:醒发间师傅:stopwatch icing:糖霜装饰师:daisy window:面包橱窗陈列员:basket delivery:清晨送包员:ruck tasting:烘焙课讲师:mug');
  troupe('bookfair','周末图书集','modern','trade','town school','paper','adult',
    'editor:独立出版编辑:notebook dealer:旧书摊主:folio artist:绘本作者:brooch letterer:封面字绘师:spool binder:折页装订师:tools teller:童书说读人:swallow curator:小志策展人:badge printer:孔版印刷师:plaid');
  troupe('museumcrew','博物馆小组','modern','heritage','museum workshop','paper','adult',
    'keeper:馆藏保管员:glasses curator:展览策展人:folio restorer:画布修复师:spool educator:博物馆教育员:badge registrar:藏品登记员:clipboard designer:展陈设计师:map guide:口述史讲解员:headset archivist:馆藏影像员:camera');
  troupe('dyeworks','植物染工房','modern','craft','workshop garden','loom','adult',
    'forager:染材采集师:basket dyer:靛缸染师:sprig stitcher:绞缬缝扎师:spool mixer:染料调配员:flask weaver:样布织造师:loom grader:色样整理员:folio washer:晒布场师傅:scarf mentor:草木染讲师:notebook');
  troupe('chamber','室内乐团','modern','arts','stage school','concert','adult',
    'viola:中提琴手:bell cello:大提琴手:prism flute:长笛手:swallow bass:低音提琴手:tie harp:竖琴手:moth clarinet:单簧管手:moon conductor:室内乐指挥:folio librarian:乐谱管理员:notebook');
  troupe('ballet','舞蹈排练室','modern','arts','stage arena','dance','adult',
    'lead:排练领舞:ribbon coach:舞团排练指导:stopwatch tap:踢踏舞演员:duffel wardrobe:舞服整理师:spool pianist:舞蹈钢琴伴奏:moon modern:现代舞编导:folio swing:摇摆舞领跳:bell assistant:舞台排练助理:headset');
  troupe('architecture','街区建筑事务所','modern','design','workshop town','paper','adult',
    'planner:社区建筑师:map modeler:建筑模型师:tools drafter:制图设计师:folio survey:建筑测绘员:clipboard material:材料样本师:capsule landscape:景观设计师:sprig lighting:建筑照明师:prism site:驻场设计师:ruck');
  troupe('clinicteam','社区诊疗室','modern','health','clinic town','clinic','adult',
    'gp:社区全科医师:clinic physio:康复治疗师:stopwatch optician:验光师:glasses diet:社区营养师:notebook desk:门诊接待员:badge speech:言语治疗师:folio hearing:听力师:hearing homecare:上门照护师:flap');
  troupe('coastguard','海滩救护站','modern','health','coast clinic','field','adult',
    'guard:海滩救生员:stopwatch patrol:巡滩队员:flask skipper:救护艇驾驶员:tag trainer:水域救护教练:clipboard medic:岸边急救员:clinic tower:瞭望台值班员:map radio:海湾联络员:headset supply:救护站补给员:ruck');
  troupe('weatherdesk','气象观测站','modern','science','observatory wild','field','adult',
    'cloud:云量观测员:notebook rain:降水记录员:folio balloon:探空气球员:flask sea:海况预报员:map wind:风场测量员:probe station:自动站维护员:tools chart:天气图绘制员:clipboard host:天气播报员:headset');
  troupe('horticulture','城市温室','modern','nature','garden town','garden','adult',
    'fern:蕨类园艺师:sprig rose:月季修枝师:basket seed:种子库管理员:folio orchid:兰房看护员:bell moss:苔藓栽培师:flask guide:温室讲解员:daisy soil:盆土调配员:gloves label:园艺标本员:notebook');
  troupe('broadcast','社区广播电台','modern','media','workshop town','studio','adult',
    'anchor:晨间电台主播:headset mixer:广播混音师:earbuds producer:栏目制作人:folio field:街访采编员:camera foley:广播拟音师:duffel scheduler:节目编排员:clipboard host:听众热线主持人:moon engineer:发射台工程师:tools');
  troupe('artclub','放学后美术社','modern','learning','school workshop','school','child',
    'paint:小小水彩画手:sprig clay:泥塑社小朋友:apron collage:拼贴画社员:folio ink:版画小助手:spool comic:校园漫画作者:notebook calligraphy:小小书法生:swallow print:植物拓印小朋友:daisy model:纸模型社员:ruck');
  troupe('rockpools','潮池观察队','modern','nature','coast school','explore','child',
    'shell:贝壳图鉴小作者:shell crab:小小螃蟹观察员:flask kelp:海藻标本小助手:folio sand:沙纹记录小朋友:notebook bird:岸鸟小向导:ruck tide:潮汐表小画手:map pool:岩池写生小朋友:camera coral:珊瑚故事小记者:koi');
  troupe('toddlerplay','街坊亲子游戏角','modern','home','playground home','play','toddler',
    'blocks:搭积木的小栗 bean:抱豆袋的沐沐 claps:拍手歌的小桥 hoops:滚球圈的小芒 crayon:蜡笔画手阿满 scarf:追丝巾的桃桃:softband bubbles:追泡泡的小纪 cups:玩叠杯的团子');
  troupe('firstyear','宝宝的第一个四季','modern','home','home playground','nursery','baby',
    'spring:春日阳台的小桃 seed:麦芽色的小禾 breeze:海风里的南南 berry:草莓衣的小米 autumn:秋阳里的安安 maple:枫叶毯上的果果 snow:雪窗旁的圆圆 pine:松绿衣的小柏');
  troupe('petrescue','动物领养小站','modern','service','town garden clinic','garden','adult',
    'carer:寄养照护员:gloves host:领养日接待员:badge walker:社区遛犬志愿者:flask groomer:宠物梳理师:tools photo:领养纪念摄影师:camera nurse:救助站护理员:clinic supply:寄养物资管理员:basket educator:动物习性讲解员:notebook');
  troupe('indiegames','独立游戏工作室','modern','design','workshop home','studio','adult',
    'pixel:像素美术师:prism tools:编辑器开发者:computer sound:游戏音效师:headset story:叙事设计师:notebook engine:引擎程序设计师:glasses ux:游戏交互设计师:folio level:关卡设计师:map qa:玩法测试员:earbuds');
  troupe('trailkids','森林周末营','modern','sport','wild playground','explore','child',
    'map:林径小读图员:map leaf:秋叶拓印小朋友:sprig tent:帐篷小帮手:ruck snack:野餐篮小队员:basket knot:绳结兴趣小队员:flask bird:林间小观鸟员:camera tale:营火故事小主持:swallow fern:蕨叶日记小作者:notebook');
  troupe('silkloom','古城织坊','historic','craft','workshop town','silk','adult',
    'warp:整经师傅:spool weft:过纬织工:loom brocade:织锦配色师:prism card:花本绘手:scroll dye:织坊染匠:sprig reel:缫丝师傅:basket pattern:纹样摹工:folio repair:织机修理匠:tools');
  troupe('blockprint','古籍刻印坊','historic','heritage','workshop school','scholar','adult',
    'carver:雕版刻工:tools scribe:写样书手:quill ink:调墨师傅:flask rub:刷印师傅:scarf folder:折页书工:spool bind:线装匠:loom proof:校样先生:scroll vendor:书坊掌柜:folio');
  troupe('caravan','山道行商','historic','trade','transit wild','caravan','adult',
    'leader:山道商队领队:map spices:香料行商:flask silk:绸布行商:spool tea:运茶客商:basket clerk:队中账房:scroll host:道旁店家:bell mule:驮队向导:ruck courier:山道送信人:folio');
  troupe('canallock','运河闸口','historic','travel','coast transit','harbour','adult',
    'lock:闸口看守:lantern rope:纤绳师傅:scarf ferry:河渡摆桨人:flag clerk:河运记簿人:scroll chart:水程图绘师:map loom:缆绳编匠:spool food:河埠茶水婆:flask weigh:码头称量员:basket');
  troupe('shadowplay','皮影戏班','historic','arts','stage town','festival','adult',
    'singer:皮影领唱:bell carver:影偶雕刻师:tools color:影偶敷彩师:prism screen:幕布师:spool puppeteer:操影艺人:swallow drum:皮影鼓师:scarf tune:弦乐伴奏师:moon host:戏班报幕人:fan');
  troupe('herbhall','山城本草铺','historic','health','garden town','gardenold','adult',
    'gather:山城药铺采药人:basket dry:晒药师:sprig sorter:草药拣选师:folio weigh:药秤师傅:charm mortar:药碾师:scarf decoct:煎药师:flask scribe:本草抄录人:quill grow:药圃管事:scroll');
  troupe('clockguild','报时钟楼','historic','craft','workshop town','clock','adult',
    'keeper:钟楼守时人:lantern bell:铸钟师:bell spring:游丝匠:tools face:钟面彩绘师:prism chime:编钟调音师:moon gear:齿轮磨工:scarf log:值更记时人:scroll courier:街巷报时人:flag');
  troupe('courtschool','书院小同窗','historic','learning','school garden','oldschool','child',
    'ink:砚边小书童:quill willow:柳下背诗人:scroll flute:竹笛小学徒:swallow leaf:夹叶小画手:sprig board:棋室小帮手:charm lantern:灯谜小能手:lantern loom:绣样小习生:spool sky:屋檐观星童:moon');
  troupe('cloudpost','云上邮局','fantasy','travel','transit wild','cloud','adult',
    'kite:风筝信使:swallow fog:晨雾分拣员:folio bell:门铃邮差:bell balloon:气囊驿使:tag chart:云路绘图师:map stamp:邮戳雕刻师:tools ribbon:节庆包裹师:spool tower:高塔值信员:lantern');
  troupe('gladecrew','苔原花圃','fantasy','nature','garden wild','grove','adult',
    'seed:流光育种人:flask moss:织苔匠:loom cap:蘑菇果园师:basket moth:授粉飞蛾师:moth rain:收露人:charm root:古根养护师:sprig keeper:温泉园丁:bell moon:月下开花记录员:notebook');
  troupe('pearlbay','珍珠湾潮务所','fantasy','travel','coast town','harbour','adult',
    'pearl:珍珠分色师:shell chart:潮径绘师:map tide:听潮人:moon boat:贝舟领航员:flag glass:海玻璃磨师:prism coral:珊瑚抄绘师:quill courier:潮函投递员:folio beacon:湾口灯守:lantern');
  troupe('teagrove','林下蘑菇茶馆','fantasy','food','kitchen wild','faircafe','adult',
    'brew:露水煮茶人:mug picker:菌伞采摘人:basket cake:苔饼点心师:berry menu:花瓣菜单师:sprig lamp:夜茶点灯人:lantern pot:彩釉壶修补师:tools honey:林蜜品评师:bell host:林客领位人:moth');
  troupe('skychoir','云海巡回乐团','fantasy','arts','stage transit','festival','adult',
    'conch:海螺号手:shell chime:风铃乐手:bell string:月弦演奏家:moon reed:云笛吹奏者:swallow choir:晨星合唱领队:prism score:云谱誊抄师:quill costume:巡演衣匠:spool host:流星报幕人:fan');
  troupe('aurorakids','极光小学徒','fantasy','learning','wild school observatory','fairchild','child',
    'light:拾光小学徒:prism moth:认蛾的小学徒:moth snow:雪纹小画手:folio comet:彗尾观测小朋友:notebook owl:夜枭送信童:ruck lantern:极光灯谜小队员:lantern wind:风铃小调音师:bell fern:发光蕨叶记录员:sprig');
  troupe('gemarchive','水晶大书库','fantasy','lore','school museum','scholar','adult',
    'prism:棱镜检索师:prism geode:晶洞编目师:folio mirror:镜页修复师:tools tale:星砂说书人:moon bind:晶册装帧师:spool night:夜读引灯人:lantern loan:漂流册管理员:scroll verse:回声抄诗人:quill');
  troupe('orbitfarm','轨道农场','scifi','habitat','station garden','spacegarden','adult',
    'root:气雾栽培员:flask algae:藻池技术员:probe grain:星麦育种员:folio hive:舱内授粉师:moth lab:根系采样员:capsule water:水循环技师:tools light:温室光谱师:prism steward:轮作调度员:clipboard');
  troupe('eva','舱外作业组','scifi','science','station transit','flight','adult',
    'lead:舱外作业领班:tag tether:系绳检查员:tools suit:航服整备师:spool panel:外舷板检修员:capsule beacon:信标标定员:probe time:气闸计时员:stopwatch log:出舱日志员:clipboard comms:头盔通信员:headset');
  troupe('deepsignal','深空通信阵列','scifi','media','observatory station','signal','adult',
    'listen:深空监听员:headset dish:天线检修师:tools relay:中继调度员:tag code:遥测解码员:computer map:脉冲星制图员:map lens:光学链路师:prism clock:星际授时员:stopwatch archive:深空信号档案员:folio');
  troupe('habitatlab','栖居舱机器人组','scifi','science','workshop station','signal','adult',
    'arm:机械臂调试员:tools wheel:舱内车底盘师:clipboard optics:巡检机视觉师:prism voice:陪伴机语音师:headset circuit:服务机电路师:probe textile:软体机织造师:spool test:站内测试员:computer depot:备用模块管理员:capsule');
  troupe('lunarkitchen','月面公共厨房','scifi','food','kitchen station','spacefood','adult',
    'baker:低重力面包师:berry brewer:星茶调饮师:mug menu:月面菜单设计师:folio ration:轮班餐配给员:clipboard greens:舱菜料理师:sprig jar:发酵罐看护员:flask line:轨道餐线主管:badge picnic:出舱便当师:capsule');
  troupe('starschool','星港少年学堂','scifi','learning','school station observatory','spacechild','child',
    'comet:彗星小观察员:notebook bot:桌面机器人社员:tools farm:舱菜种植小朋友:sprig map:星图社小画手:map radio:业余无线电小社员:earbuds model:星舰模型小作者:ruck photo:舷窗摄影小朋友:camera music:低重力合唱社员:planet');
  troupe('cradleship','摇篮舱的星星','scifi','home','station home','nursery','baby',
    'halo:光环窗边的小夏 lune:月牙衣的沐宝 comet:彗星毯上的阿黎 nova:舷窗下的星宝');

  // Top, bottom and footwear inventories are intentionally local to a workplace or activity.
  const kits={};
  function kit(id,tops,bottoms,shoes,dyes,motifs,hat) {
    kits[id]={tops:tops.split(' '),bottoms:bottoms.split(' '),shoes:shoes.split(' '),
      dyes:dyes.split(' '),motifs:motifs.split(' '),hat};
  }
  kit('track','running-shell rugby ridge-fleece hoodie field-vest','ribbon-joggers track-shorts knee-cargos joggers','court-sneakers runners gum-plimsolls','pool ochre cherry indigo','starfall swallow','cotton-cap');
  kit('uniform','station-jacket double-vest deck-jumper camp-shirt uniform','gusset-slacks pinstripe sailor-pants trousers','tassel-loafers oxfords deck-shoes','harbour indigo moss plum','bell planet','pine-outfitter/harbour-peak');
  kit('flight','relay-shell flightsuit thermal-shell orbit-liner station-jacket','flight-trousers knee-cargos ribbon-joggers cargo','cabin-boots gaiter-boots deck-shoes','indigo ochre pool storm','prism planet','pine-outfitter/harbour-peak');
  kit('cafe','barista-apron camp-shirt double-vest cable-knit orchard-pinafore','gusset-slacks panel-culottes cuffed-denim harbour-wrap','gum-plimsolls tassel-loafers mary-janes','coffee clay rose moss','berry bell');
  kit('baker','chef-coat orchard-pinafore barista-apron sunday-blouse kiln-smock','sailor-pants panel-culottes balloon-pants trousers','gum-plimsolls loafers canvas-shoes','wheat cherry cream herb','berry daisy');
  kit('paper','double-vest camp-shirt cable-knit atelier-coat sunday-blouse','panel-culottes gusset-slacks wide-leg cuffed-denim harbour-wrap','tassel-loafers gum-plimsolls oxfords','plum indigo clay herb coffee','spool swallow');
  kit('loom','orchard-pinafore atelier-coat loom-jacket kiln-smock patch-pullover','loom-pants balloon-pants panel-culottes banded-trousers','wrap-boots gum-plimsolls flats','indigo clay moss ochre','spool ginkgo');
  kit('concert','double-vest sunday-blouse blazer petal-cardigan camp-shirt','gusset-slacks pinstripe bell-skirt harbour-wrap','tassel-loafers mary-janes oxfords','plum harbour cherry coffee','moon bell');
  kit('dance','running-shell sunday-blouse festival-bolero rugby petal-cardigan','ribbon-joggers wide-leg panel-culottes capris bell-skirt','court-sneakers mary-janes flats','rose cherry pool plum','swallow starfall');
  kit('clinic','scrubs lab-coat petal-cardigan camp-shirt quilt-jacket','gusset-slacks sailor-pants capris trousers','gum-plimsolls loafers canvas-shoes','pool cream herb rose','daisy bell');
  kit('field','ridge-fleece shell-parka field-vest trail-shell rain-anorak','knee-cargos ribbon-joggers banded-trousers cargo','gaiter-boots trail-boots court-sneakers','harbour moss ochre clay','ginkgo starfall','pine-outfitter/storm-brim');
  kit('garden','orchard-pinafore field-vest camp-shirt atelier-coat cable-knit','knee-cargos balloon-pants panel-culottes bib-overalls','gaiter-boots gum-plimsolls deck-shoes','moss rose wheat herb','ginkgo daisy','sunhat');
  kit('studio','patch-pullover camp-shirt cable-knit running-shell field-vest','sailor-pants ribbon-joggers gusset-slacks cuffed-denim','court-sneakers gum-plimsolls high-tops','pool plum cherry wheat','planet prism');
  kit('school','petal-cardigan patch-pullover sunday-blouse cable-knit camp-shirt','bib-overalls sailor-pants panel-culottes shorts petal-skirt','gum-plimsolls mary-janes court-sneakers','rose pool wheat herb','berry daisy');
  kit('explore','ridge-fleece deck-jumper field-vest running-shell rugby','knee-cargos shorts ribbon-joggers capris','court-sneakers trail-boots gum-plimsolls','harbour herb cherry wheat','swallow koi','cotton-cap');
  kit('play','patch-pullover lullaby-smock petal-cardigan breton snap-knit','patch-tights bib-overalls balloon-pants knee-pants','petal-slippers strap-sneakers soft-booties','peach pool wheat herb','berry daisy');
  kit('nursery','lullaby-smock petal-cardigan snap-knit quilt-jacket sailor-knit fairisle-knit','patch-tights knee-pants balloon-pants bib-overalls','soft-booties petal-slippers','peach wheat rose pool cream','moon berry');
  kit('silk','reed-robe loom-jacket frog-coat cross-robe brocade','folk-gather loom-pants harbour-wrap banded-trousers','wrap-boots flats sandals','indigo clay moss ochre','spool ginkgo');
  kit('scholar','reed-robe frog-coat loom-jacket brocade cross-robe','loom-pants banded-trousers panel-culottes folk-gather','wrap-boots flats tassel-loafers','indigo cream herb plum','ginkgo prism');
  kit('caravan','reed-robe field-vest frog-coat loom-jacket cross-robe','loom-pants knee-cargos banded-trousers balloon-pants','gaiter-boots wrap-boots sandals','ochre clay herb harbour','ginkgo bell');
  kit('harbour','frog-coat reed-robe deck-jumper loom-jacket festival-bolero','banded-trousers sailor-pants harbour-wrap loom-pants','wrap-boots sandals deck-shoes','harbour herb clay cherry','koi moon');
  kit('festival','loom-jacket festival-bolero bell-tabard brocade reed-robe','loom-pants panel-culottes folk-gather bell-skirt','wrap-boots petal-slippers flats','cherry plum indigo wheat','moth bell');
  kit('gardenold','reed-robe frog-coat orchard-pinafore cross-robe loom-jacket','loom-pants banded-trousers folk-gather panel-culottes','wrap-boots sandals flats','herb clay coffee cream','ginkgo berry');
  kit('clock','bell-tabard loom-jacket double-vest frog-coat cross-robe','gusset-slacks banded-trousers loom-pants wide-leg','gaiter-boots wrap-boots tassel-loafers','coffee harbour ochre plum','bell spool');
  kit('oldschool','reed-robe frog-coat quilt-jacket cross-robe loom-jacket','loom-pants balloon-pants knee-pants folk-gather','wrap-boots flats petal-slippers','herb wheat rose indigo','swallow ginkgo');
  kit('cloud','bell-tabard leaf-mantle festival-bolero deck-jumper moth-cape','sailor-pants loom-pants panel-culottes banded-trousers','wrap-boots gaiter-boots deck-shoes','pool storm rose ochre','swallow starfall','pine-outfitter/lantern-hood');
  kit('grove','leaf-mantle moth-cape reed-robe orchard-pinafore bell-tabard','loom-pants panel-culottes petal-skirt folk-gather','wrap-boots flats gaiter-boots','herb rose moss plum','moth ginkgo');
  kit('faircafe','orchard-pinafore leaf-mantle petal-cardigan festival-bolero reed-robe','balloon-pants loom-pants harbour-wrap petal-skirt','petal-slippers flats wrap-boots','herb rose wheat clay','berry moth');
  kit('fairchild','leaf-mantle bell-tabard moth-cape quilt-jacket fairisle-knit','balloon-pants banded-trousers petal-skirt knee-pants','wrap-boots petal-slippers gaiter-boots','storm indigo rose herb','starfall moth');
  kit('spacegarden','orbit-liner orchard-pinafore relay-shell thermal-shell field-vest','flight-trousers knee-cargos sailor-pants gusset-slacks','cabin-boots gum-plimsolls gaiter-boots','herb pool storm ochre','planet ginkgo');
  kit('signal','relay-shell orbit-liner thermal-shell utility-gilet station-jacket','flight-trousers gusset-slacks knee-cargos ribbon-joggers','cabin-boots court-sneakers gaiter-boots','storm indigo pool clay','planet prism');
  kit('spacefood','orbit-liner barista-apron relay-shell chef-coat camp-shirt','flight-trousers sailor-pants knee-cargos gusset-slacks','cabin-boots gum-plimsolls loafers','pool cream ochre herb','planet berry');
  kit('spacechild','orbit-liner patch-pullover fairisle-knit running-shell deck-jumper','ribbon-joggers flight-trousers shorts bell-skirt','court-sneakers cabin-boots gum-plimsolls','storm rose ochre pool','planet starfall');

  // Four related cloth colours, independent of skin, eye and hair pigments.
  const swatches={
    pool:'62969a 435b6c 825f53 e5bd81',ochre:'c39a51 485e63 805745 f1d9a5',
    cherry:'a65356 51495e 8c6358 ecc89c',indigo:'667ca0 474559 946c52 e2baa0',
    harbour:'485f78 697b80 6e5147 e6c587',moss:'72815e 515d54 805940 e1bc82',
    plum:'8c7295 53495f 886664 dec5ae',coffee:'976d51 4f545a 775748 dec8a3',
    clay:'b87657 526c6f 805649 e5c293',rose:'c18a91 65586d 90716a ede1bf',
    wheat:'d7bc83 626779 8a684e a66549',cream:'ded4b8 626e76 8b6759 74998e',
    herb:'91a68c 526665 866a56 ddbb85',storm:'8098ad 555771 8b7780 e7b98e',
    peach:'dfa588 737b87 9b7665 f7dfb3'
  };
  const props={
    map:['bag','map-folio'],folio:['bag','crescent-bag'],tools:['bag','tool-roll'],clinic:['bag','doctor-case'],
    basket:['bag','market-basket'],duffel:['bag','dancer-duffel'],ruck:['bag','flap-ruck'],flap:['bag','messenger'],
    capsule:['bag','capsule-pack'],camera:['bag','camera'], pass:['charm','pass'],tag:['charm','signal-tag'],
    shell:['charm','shell-token'],charm:['charm','jade'],glasses:['glasses','oval'],hearing:['audio','hearing-aid'],
    headset:['audio','headphones'],earbuds:['audio','earbuds'],computer:['laptop','stickers'],flask:['bottle','flask'],
    mug:['implement','mug'],flag:['implement','guide-flag'],probe:['implement','probe'],scroll:['implement','scroll'],
    quill:['implement','quill'],fan:['implement','fan'],lantern:['implement','lantern'],notebook:['implement','notebook'],
    clipboard:['implement','clipboard'],stopwatch:['wrist','sport-band'],gloves:['gloves','fingerless'],
    badge:['brooch','nameplate'],brooch:['brooch','rosette'],tie:['neck','tie'],scarf:['neck','scarf'],
    ribbon:['hairAccessory','ribbon'],softband:['hairAccessory','band'],apron:['top','orchard-pinafore'],
    loom:['belt','sash'],plaid:['top','patch-pullover'],sprig:['hairAccessory','ginkgo-comb']
  };
  // Named motifs can be the signature piece as well as a coordinated accent.
  const motifs=['daisy','ginkgo','koi','moth','berry','starfall','moon','prism','swallow','bell','spool','planet'];
  const ageHeads={
    adult:'petal brook peach sorrel reed fig almond hearth copper dusk linden open willow tide harbor',
    child:'sprig finch robin scout',toddler:'pip robin acorn sprig clover',baby:'pip acorn clover'
  };
  const builds={adult:'even compact tall lean sturdy slight broad soft',child:'small growing even runner slight',
    toddler:'small soft even',baby:'baby'};
  const hairDeck={
    street:'feather-crop petal-bob side-pony ripple-lob fade looped-knot temple-braids low-bun swing-bob cloud-puffs page-crop curtain tapered-coils ribbon-fall brushed-crop curly-lob',
    art:'cascade-part pixie shoulder-shag crown-braid curly-lob angled-bob ribbon-plait side-loop quiff willow-wave temple-braids looped-knot',
    old:'low-bun crown-braid loop-braid side-part low-pony twin-braids looped-knot waist-length fishtail top-knot ribbon-plait bun',
    field:'feather-crop low-pony side-loop braid brushed-crop tapered-coils lob ribbon-fall pixie looped-knot page-crop low-bun',
    child:'swing-bob side-loop feather-crop twin-tails cloud-puffs pixie ribbon-plait bob page-crop twin-braids low-pony petal-bob',
    toddler:'crop bob curly pixie side-part twin-tails french-bob crew',baby:'baby-sprout baby-comma baby-sweep baby-cloud baby-whorl baby-puffs'
  };
  // Small authored variations sit on a fully paired face. Changing a smile does
  // not also move the nose, and the infant roster keeps its own nose/chin profile.
  const portraitAccents={
    clear:{traits:{},sculpt:{}},
    smile:{traits:{mouth:'soft-smile',complexion:'dimples'},sculpt:{mouthWidth:-.045}},
    observant:{traits:{brows:'straight',restExpression:'curious'},sculpt:{eyeDepth:.035}},
    soft:{traits:{brows:'feathered',mouth:'relaxed'},sculpt:{browHeight:.055}},
    bright:{traits:{nose:'short',complexion:'freckles'},sculpt:{noseBridge:-.12}},
    quiet:{traits:{mouth:'classic',restExpression:'calm'},sculpt:{lipProjection:-.14}},
    warm:{traits:{brows:'tapered',complexion:'left-mole'},sculpt:{mouthWidth:-.035}},
    elder:{traits:{complexion:'fine-lines',restExpression:'warm'},sculpt:{lipProjection:-.13}}
  };
  const adultAccents=Object.keys(portraitAccents);
  const complexions='peach cocoa sand copper porcelain bronze olive rose amber umber gold sienna'.split(' ');
  const hairDyes='espresso walnut ink cinnamon ash sable flax copper midnight chestnut honey plum'.split(' ');
  const iris='umber hazel espresso slate amber moss grey'.split(' ');
  const portraitDeck=Object.fromEntries(Object.entries(ageHeads).map(([key,s])=>[key,s.split(' ')]));
  for(const k of Object.keys(builds)) builds[k]=builds[k].split(' ');
  for(const k of Object.keys(hairDeck)) hairDeck[k]=hairDeck[k].split(' ');
  function hash(text) {
    let value=2166136261;
    for(const ch of text) value=Math.imul(value^ch.charCodeAt(0),16777619);
    return value>>>0;
  }
  function generate(add,palette) {
    for (const scene of scenes) {
      const {kit,roles,profiles:age,era}=scene, outfit=kits[kit];
      const deck=age!=='adult' ? hairDeck[age] : era==='historic' ? hairDeck.old :
        ['arts','design','lore'].includes(scene.field) || era==='fantasy' ? hairDeck.art :
        ['field','track','flight','garden'].includes(kit) ? hairDeck.field : hairDeck.street;
      // Shuffle each dimension independently, once per series. Walking the deck gives
      // distinct faces and cuts before a repeat, even in the four-person nursery.
      const decks=new Map();
      function draw(list,channel,index) {
        if(!decks.has(channel)){
          const ordered=list.slice().sort((a,b)=>hash(scene.id+'/'+channel+'/'+a)-hash(scene.id+'/'+channel+'/'+b));
          decks.set(channel,ordered);
        }
        const ordered=decks.get(channel);
        return ordered[index%ordered.length];
      }
      roles.forEach(([id,label,signature],n)=>{
        const key=scene.id+'_'+id;
        const choose=(list,channel)=>draw(list,channel,n);
        const profile=age==='adult' ? ((n+hash(scene.id))%2 ? 'female' : 'male') : age;
        const head=choose(portraitDeck[age],'head'), build=choose(builds[age],'body');
        const tint=choose(outfit.dyes,'cloth');
        const [top,bottom,shoe,accent]=swatches[tint].split(' ');
        const wear={top:choose(outfit.tops,'top'),bottom:choose(outfit.bottoms,'bottom'),shoes:choose(outfit.shoes,'shoes')};
        const hair=choose(deck,'hair');
        const dyes={};
        if (age!=='baby' && age!=='toddler') {
          const ornament=choose(outfit.motifs,'accent'), mount=['brooch','ears','hairAccessory'][(n+hash(scene.id+'/mount'))%3];
          const suffix={brooch:'pin',ears:'drops',hairAccessory:'comb'};
          if(n%4!==2) wear[mount]=ornament+'-'+suffix[mount];
          if(motifs.includes(signature)) wear[mount]=signature+'-'+suffix[mount];
          const capHair=['feather-crop','page-crop','brushed-crop','crop','crew','fade','pixie','bob','low-pony','low-bun','side-part','swing-bob'].includes(hair);
          if(outfit.hat && capHair && n%3===0 && !wear.hairAccessory) {
            wear.hat=outfit.hat.includes('/') ? outfit.hat : 'pine-core/'+outfit.hat;
            dyes.hat='#'+top;
          }
        }
        if (signature && !motifs.includes(signature)) {
          const [slot,value]=props[signature]; wear[slot]=value;
        }
        if(wear.hairAccessory) dyes.hairAccessory='#'+accent;
        if(wear.brooch) dyes.brooch='#'+accent;
        if(wear.ears) dyes.ears='#'+accent;
        if(wear.bag) dyes.bag='#'+(n%2 ? shoe : bottom);
        const accentId=age==='adult' ? choose(adultAccents,'portrait') : 'clear';
        const skin=choose(complexions,'skin'), eye=choose(iris,'eye');
        const strand=accentId==='elder' ? (hash(key)%2 ? 'salt' : 'silver') : choose(hairDyes,'strand');
        const colors=palette(skin,strand,eye,top,bottom,shoe,accent);
        const art={head,build,hair,wear,dyes,palette:colors,...portraitAccents[accentId]};
        add(scene,key,label,profile,art);
      });
    }
  }
  return {fields,settings,series:Object.fromEntries(scenes.map(s=>[s.id,s.label])),generate};
})();
