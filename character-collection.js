// Art direction for the editable character library. Each entry is a fixed design.
// The seed wardrobe supplies the role's equipment. This sheet chooses the person wearing it.
const pineCharacterCollection = (() => {
  function head(form, outline, eyes, brows, nose, mouth, restExpression, shape) {
    return { face: { form, outline, eyes, brows, nose, mouth, restExpression }, shape };
  }
  const heads = {
    almond: head('balanced','oval','almond','tapered','straight','bow','warm',
      {faceWidth:.96,eyeSpacing:.96,eyeOpening:.07,cheekHeight:-.18,chinRoundness:.22}),
    hearth: head('round','pear','soft-oval','feathered','broad','lower-full','warm',
      {faceWidth:1.025,jaw:.98,browHeight:.12,cheekHeight:-.24,cheekFullness:.07,chinRoundness:.28}),
    willow: head('long','heart','long-almond','willow','short','relaxed','calm',
      {faceWidth:.955,jaw:.95,eyeSpacing:1.035,eyeTilt:.08,cheekProjection:-.12,chinRoundness:.15}),
    ember: head('angular','oval','hooded','angled','straight','wide','curious',
      {faceWidth:.99,jaw:1.025,eyeSpacing:.97,eyeWidth:.12,browHeight:.13,cheekHeight:-.04,jawDefinition:.16}),
    open: head('balanced','heart','doe-eye','short-brow','rounded','small','curious',
      {faceWidth:.975,jaw:.95,eyeOpening:.16,eyeSpacing:1.03,mouthWidth:-.09,chinRoundness:.27}),
    harbor: head('angular','square','level-eye','thick','broad','relaxed','calm',
      {faceWidth:1.025,jaw:1.045,eyeWidth:.12,eyeOpening:-.04,noseWidth:.12,chinRoundness:.08}),
    dusk: head('long','oval','monolid','straight','slender','soft-smile','calm',
      {faceWidth:.965,eyeSpacing:1.055,eyeWidth:.12,noseBridge:-.09,cheekHeight:-.19,chinRoundness:.19}),
    copper: head('balanced','diamond','upturned','lifted','upturned','classic','curious',
      {faceWidth:.98,jaw:.96,eyeSpacing:.97,browHeight:.12,cheekProjection:-.13,chinRoundness:.10}),
    tide: head('round','oval','crescent','fine','wide','soft-smile','warm',
      {faceWidth:1.015,eyeSpacing:1.02,eyeOpening:.08,cheekHeight:-.22,noseWidth:.10,chinRoundness:.31}),
    flint: head('long','square','deep-set','low-flat','aquiline','thin','calm',
      {faceWidth:.985,jaw:1.015,eyeWidth:.06,eyeDepth:.12,noseBridge:-.10,cheekFullness:-.09,chinRoundness:.06}),
    fig: head('balanced','pear','downturned','arched','rounded','lower-full','warm',
      {faceWidth:1.005,jaw:.99,eyeSpacing:1.025,browHeight:.13,cheekHeight:-.28,chinRoundness:.20}),
    reed: head('long','oval','double-lid','feathered','bridge','relaxed','curious',
      {faceWidth:.96,jaw:.97,eyeSpacing:.975,eyeDepth:.06,noseBridge:-.10,chinRoundness:.14}),
    linden: head('angular','heart','almond','descending','wide','bow','calm',
      {faceWidth:.98,jaw:.955,eyeWidth:.08,browHeight:.09,cheekProjection:-.11,chinRoundness:.17}),
    petal: head('balanced','oval','soft-oval','feathered','short','bow','warm',
      {faceWidth:.97,jaw:.975,eyeSpacing:1.025,eyeOpening:.09,cheekHeight:-.19,noseBridge:-.12,chinRoundness:.28}),
    brook: head('long','oval','almond','tapered','straight','relaxed','calm',
      {faceWidth:.975,jaw:.98,eyeSpacing:1.015,eyeOpening:.08,cheekProjection:-.11,lipProjection:-.15,chinRoundness:.25}),
    peach: head('round','heart','crescent','fine','rounded','soft-smile','warm',
      {faceWidth:1.005,jaw:.975,eyeOpening:.13,browHeight:.09,cheekHeight:-.22,chinRoundness:.32}),
    sorrel: head('balanced','square','double-lid','straight','short','relaxed','curious',
      {faceWidth:1.005,jaw:1.005,eyeWidth:.06,eyeOpening:.09,noseBridge:-.10,jawDefinition:-.08,chinRoundness:.23}),
    sprig: head('balanced','heart','soft-oval','short-brow','button','small','curious',
      {faceWidth:.985,jaw:.96,eyeSpacing:1.04,eyeOpening:.15,cheekHeight:-.19,chinRoundness:.34}),
    robin: head('round','oval','round','arched','short','soft-smile','warm',
      {faceWidth:1.005,jaw:.975,eyeSpacing:1.02,browHeight:.15,cheekHeight:-.21,chinRoundness:.32}),
    scout: head('balanced','round','level-eye','straight','rounded','relaxed','curious',
      {faceWidth:.985,jaw:1.005,eyeWidth:.08,eyeOpening:.12,cheekProjection:-.07,chinRoundness:.27}),
    finch: head('long','heart','almond','fine','upturned','bow','warm',
      {faceWidth:.97,jaw:.965,eyeSpacing:1.035,eyeOpening:.10,cheekHeight:-.15,chinRoundness:.28}),
    pip: head('round','round','doe-eye','short-brow','button','small','curious',
      {faceWidth:1.005,jaw:.97,eyeOpening:.14,noseBridge:-.24,cheekHeight:-.18,chinRoundness:.40}),
    acorn: head('balanced','round','soft-oval','fine','rounded','bow','warm',
      {faceWidth:.99,jaw:.99,eyeSpacing:1.035,eyeOpening:.11,noseBridge:-.25,noseWidth:.09,chinRoundness:.48}),
    clover: head('round','oval','round','short-brow','button','small','curious',
      {faceWidth:1.01,jaw:.985,eyeSpacing:1.02,eyeOpening:.09,noseBridge:-.27,cheekHeight:-.18,chinRoundness:.53})
  };
  function build(height, shoulders, arms, legs, torso, arm, leg) {
    return { shape:{height,shoulders,arms,legs}, parts:{torso,arms:arm,legs:leg} };
  }
  const builds = {
    even: build(1,1,1,1,'balanced','balanced','balanced'),
    tall: build(1.105,.985,1.03,1.07,'slender','balanced','slender'),
    lean: build(1.025,.925,1.025,1.045,'slender','slender','balanced'),
    compact: build(.93,1.035,.97,.96,'balanced','balanced','strong'),
    sturdy: build(1.035,1.105,1,.98,'broad','strong','strong'),
    slight: build(.96,.91,.96,1.02,'slender','slender','slender'),
    runner: build(1.045,.975,1,1.09,'balanced','slender','strong'),
    broad: build(1.075,1.12,1.035,1.02,'broad','strong','balanced'),
    soft: build(.985,1.025,.99,.99,'balanced','balanced','balanced'),
    small: build(.94,.965,.98,.97,'balanced','slender','balanced'),
    growing: build(1.045,.94,1.015,1.05,'slender','balanced','balanced'),
    baby: build(1,1,.98,.98,'balanced','balanced','balanced')
  };
  const skin = { porcelain:'efcbb7', peach:'e8b18d', rose:'dba18b', sand:'d5a17b',
    gold:'c38c65', olive:'b58b68', amber:'b47853', copper:'a7694b', sienna:'975f48',
    bronze:'85533f', umber:'704738', cocoa:'613d33' };
  const hair = { ink:'302935', espresso:'3a2d2c', sable:'483534', walnut:'604232', chestnut:'794a3b',
    copper:'a05b40', cinnamon:'8b5746', flax:'bf9964', honey:'ae8053', silver:'a99b91',
    salt:'827b78', ash:'81746a', plum:'554051', midnight:'343849', moss:'536056', pearl:'d4c6ae', fawn:'986d4d' };
  const eyes = { espresso:'40302a', umber:'594333', amber:'805830', hazel:'717044',
    moss:'566448', slate:'506374', grey:'656367', plum:'664954', teal:'416568' };
  function palette(skinTone, hairTone, iris, top, bottom, shoes, accent) {
    return {skin:'#'+skin[skinTone],hair:'#'+hair[hairTone],eyes:'#'+eyes[iris],
      top:'#'+top,bottom:'#'+bottom,shoes:'#'+shoes,accent:'#'+accent};
  }

  const people = {
    fern: {fit:{top:'straight',legs:'straight'},head:'sprig',build:'small',hair:'side-part', palette:palette('gold','chestnut','hazel','567c61','554951','986d48','dbad54'),
      wear:{top:'field-jacket',bottom:'shorts',shoes:'trail-boots',bag:'school-pack'}, traits:{complexion:'sunspots'}, dyes:{bag:'#906b47'}},
    maple: {head:'finch',build:'growing',hair:'twin-braids', palette:palette('bronze','espresso','amber','b45f46','476772','694c47','dcbf82'),
      wear:{top:'breton',bottom:'cuffed-denim',bag:'messenger'}, traits:{iris:'amber'}, dyes:{hat:'#d6af6b',bag:'#81533e'}},
    ridge: {fit:{top:'straight',legs:'tapered'},head:'willow',build:'lean',hair:'curly-lob', palette:palette('rose','walnut','slate','526c86','665749','865a46','d39b63'),
      wear:{top:'trench',bottom:'capris',bag:'hip-pack'}, traits:{complexion:'freckles'}, dyes:{bag:'#826447'}},
    chorus: {head:'robin',build:'small',hair:'twin-tails', palette:palette('sand','ink','espresso','823f51','453d54','654348','ead8ad'),
      wear:{top:'cardigan',bottom:'plaid-skirt',shoes:'mary-janes',hairAccessory:'ribbon'}, dyes:{hairAccessory:'#e0b975'}},
    relay: {fit:{top:'tucked',legs:'straight'},head:'scout',build:'runner',hair:'bubble-pony', palette:palette('sienna','sable','umber','307b7b','373e59','cba466','efba67'),
      wear:{top:'rugby',bottom:'track-shorts',shoes:'runners',wrist:'sport-band'}, traits:{eyes:'almond',brows:'lifted'}, dyes:{wrist:'#ebb563'}},
    camper: {head:'harbor',build:'sturdy',hair:'locs', palette:palette('umber','espresso','amber','6a7049','454c43','855d41','e1a256'),
      wear:{top:'trail-shell',bottom:'cargo',bag:'trail-pack',bottle:'canteen'}, traits:{facialHair:'stubble'}, dyes:{bag:'#ad7947',bottle:'#678f91'}},
    painter: {fit:{top:'straight',legs:'wide'},head:'copper',build:'compact',hair:'curly-lob', palette:palette('amber','plum','moss','505f7c','846741','874b43','d68c68'),
      wear:{top:'denim-jacket',bottom:'wide-leg',shoes:'canvas-shoes',ears:'bar'}, traits:{complexion:'left-mole'}},
    body_female: {head:'almond',build:'even',hair:'pixie', palette:palette('sand','walnut','hazel','64857c','465563','89684c','d5bf93'),
      wear:{top:'tee',bottom:'trousers',shoes:'canvas-shoes'}, traits:{mouth:'relaxed'}},
    body_male: {head:'harbor',build:'even',hair:'crew', palette:palette('copper','espresso','umber','64857c','465563','89684c','d5bf93'),
      wear:{top:'tee',bottom:'trousers',shoes:'canvas-shoes'}, traits:{nose:'straight'}},
    workshop_hiker: {head:'hearth',build:'sturdy',hair:'quiff', palette:palette('gold','walnut','moss','457567','58513f','865c42','e3ad5f'),
      traits:{complexion:'sunspots',mouth:'relaxed'}, dyes:{hat:'#ae5344',bag:'#a57646',attachment:'#c29b66',bottle:'#517b88'}},
    workshop_surveyor: {head:'reed',build:'tall',hair:'fishtail', palette:palette('copper','espresso','hazel','b08c4e','475c66','6d5142','d9c087'),
      traits:{brows:'straight',complexion:'freckles'}, dyes:{hat:'#977a55',bag:'#735146',attachment:'#9a7049'}},
    workshop_mother: {head:'fig',build:'soft',hair:'half-up', palette:palette('amber','chestnut','umber','aa5f68','536878','947865','e3bb9a'),
      traits:{eyes:'soft-oval',complexion:'smile-lines'}, dyes:{ears:'#d9ac64'}},
    workshop_child: {head:'sprig',build:'growing',hair:'pixie', palette:palette('gold','chestnut','umber','497b92','545964','c4864f','e5af64'),
      wear:{bag:'school-pack'}, traits:{eyes:'almond',mouth:'bow'}, dyes:{bag:'#b68b57'}},
    workshop_toddler: {head:'pip',build:'small',hair:'curly', palette:palette('amber','walnut','umber','678c86','c39459','b86b54','f2dbac'),
      traits:{eyes:'round',mouth:'relaxed'}, sculpt:{height:.99,chinRoundness:.48}},
    workshop_baby: {head:'clover',build:'small',hair:'crew', palette:palette('gold','fawn','umber','93bcb6','677f80','c4886d','f1d9b4'),
      wear:{hat:'none'}, sculpt:{height:.96,chinProjection:.08}},
    chestnut: {head:'acorn',build:'baby',hair:'curly', palette:palette('bronze','espresso','espresso','527e79','746958','bc9669','b9c6a2'),
      wear:{top:'snap-knit'}, traits:{eyes:'doe-eye'}, dyes:{hat:'#e3cba7'}, sculpt:{chinProjection:.10}},
    hazel: {head:'almond',build:'lean',hair:'top-knot', palette:palette('amber','silver','umber','527b73','634756','966d4f','d7b47b'),
      wear:{top:'pullover',bottom:'capris',bag:'messenger',ears:'hoops'}, traits:{brows:'arched',complexion:'smile-lines'}, dyes:{brow:'#63504b',bag:'#925d42',ears:'#d1a864'}},
    style_reader: {fit:{top:'bloused',legs:'wide'},head:'dusk',build:'slight',hair:'angled-bob', palette:palette('peach','chestnut','moss','637b69','5e4958','7a5444','ddbd8f'),
      wear:{top:'cardigan',bottom:'wide-leg',neck:'pendant'}, traits:{complexion:'freckles'}, dyes:{glasses:'#5f443e',brooch:'#c49a68'}},
    style_musician: {head:'ember',build:'tall',hair:'afro', palette:palette('umber','espresso','amber','ded3b4','434e63','986744','576880'),
      wear:{bottom:'cuffed-denim',shoes:'high-tops'}, traits:{facialHair:'goatee',mouth:'lower-full'}, dyes:{audio:'#90644e',wrist:'#c29561'}},
    style_runner: {head:'finch',build:'runner',hair:'space-buns', palette:palette('copper','ink','espresso','da8056','474463','6c7e81','f6d182'),
      wear:{neck:'none'}, traits:{eyes:'level-eye',complexion:'sunspots'}, dyes:{bag:'#697484',hairAccessory:'#f1be73'}},
    style_florist: {head:'tide',build:'soft',hair:'crown-braid', palette:palette('rose','cinnamon','hazel','858957','604957','906d57','e2aa9d'),
      wear:{top:'apron',bottom:'plaid-skirt'}, traits:{mouth:'bow',complexion:'dimples'}, dyes:{hairAccessory:'#e7a49c',ears:'#e8cead'}},
    style_walker: {head:'flint',build:'lean',hair:'quiff', palette:palette('olive','midnight','grey','ad906e','444954','705046','994e50'),
      traits:{facialHair:'sideburns'}, dyes:{glasses:'#5b4b49',bag:'#684d45'}},
    style_gardener: {fit:{top:'straight',legs:'straight'},head:'hearth',build:'compact',hair:'low-bun', palette:palette('gold','salt','hazel','80906a','545c49','7d5940','d8b46d'),
      wear:{top:'field-jacket',bottom:'bib-overalls'}, traits:{complexion:'fine-lines',mouth:'soft-smile'}, dyes:{audio:'#ae8b68',bag:'#91744f',brow:'#685a4d'}},

    programmer: {fit:{top:'bloused',legs:'wide'},head:'linden',build:'slight',hair:'hime', palette:palette('peach','ink','umber','79546b','434b5c','a78263','cfa477'),
      wear:{top:'cardigan',bottom:'wide-leg',shoes:'canvas-shoes',glasses:'round'}, traits:{eyes:'almond',mouth:'small'}, dyes:{glasses:'#59433b',audio:'#486274',bag:'#aa8156'}},
    developer: {fit:{top:'tucked',legs:'tapered'},head:'reed',build:'tall',hair:'quiff', palette:palette('amber','walnut','umber','719287','474852','9b7456','d2b784'),
      wear:{bottom:'cuffed-denim',shoes:'canvas-shoes'}, traits:{nose:'rounded',complexion:'dimples'}, dyes:{glasses:'#4e3d36',charm:'#d8c9a1'}},
    manager: {fit:{top:'straight',legs:'tapered'},head:'willow',build:'tall',hair:'low-bun', palette:palette('bronze','espresso','amber','744b61','454053','794c43','ddc2a0'),
      wear:{shoes:'chelsea'}, traits:{brows:'arched',iris:'amber'}, dyes:{bag:'#704a3d',ears:'#dfc5a4'}},
    cashier: {head:'open',build:'compact',hair:'tapered-coils', palette:palette('copper','espresso','umber','dbc9aa','555d59','85634e','4d817e'),
      wear:{bottom:'cuffed-denim'}, traits:{brows:'feathered',nose:'wide'}, dyes:{brooch:'#d7b676'}},
    guide: {fit:{top:'tucked',legs:'tapered'},head:'copper',build:'runner',hair:'side-pony', palette:palette('olive','sable','moss','477c84','575a56','a46e4b','eba35f'),
      traits:{mouth:'soft-smile',complexion:'sunspots'}, dyes:{hat:'#cc8451',bag:'#7d5946',bottle:'#739f9c'}},
    teacher: {fit:{top:'tucked',legs:'straight'},head:'hearth',build:'broad',hair:'side-part', palette:palette('gold','salt','umber','9b8252','505766','775c46','e4cba3'),
      traits:{facialHair:'moustache',complexion:'smile-lines'}, dyes:{glasses:'#695243',bag:'#ad8b61',brow:'#61534b'}},
    nurse: {fit:{top:'straight',legs:'tapered'},head:'tide',build:'sturdy',hair:'fade', palette:palette('sienna','ink','umber','487c7e','445968','c8b49a','a9cbb6'),
      traits:{eyes:'level-eye',mouth:'relaxed'}, dyes:{charm:'#c6b186',wrist:'#586a66'}},
    chemist: {head:'dusk',build:'lean',hair:'twin-braids', palette:palette('umber','midnight','espresso','c8c7b0','4e5a68','716052','4b7872'),
      wear:{glasses:'rimless'}, traits:{mouth:'lower-full'}, dyes:{glasses:'#58686a'}},
    chef: {head:'harbor',build:'sturdy',hair:'buzz', palette:palette('amber','espresso','hazel','e2d4b8','58545d','706053','934f48'),
      traits:{facialHair:'moustache',eyes:'crescent'}, dyes:{hat:'#e9ddc3',belt:'#94534d'}},
    barista: {fit:{top:'straight',legs:'wide'},head:'open',build:'slight',hair:'french-bob', palette:palette('sand','copper','moss','d7bea0','54474b','745a49','45697c'),
      traits:{complexion:'freckles',mouth:'bow'}, dyes:{bag:'#9c7954'}},
    electrician: {head:'ember',build:'compact',hair:'low-pony', palette:palette('copper','sable','amber','526b74','49535a','946e48','dfae5b'),
      traits:{eyes:'long-almond',brows:'straight'}, dyes:{hat:'#d5aa5d',belt:'#7d634b',gloves:'#6f6150'}},
    builder: {head:'flint',build:'broad',hair:'crew', palette:palette('sand','chestnut','slate','bf8051','545761','7e644b','efd99b'),
      traits:{nose:'broad',facialHair:'stubble'}, dyes:{hat:'#d7a444'}},
    courier: {head:'linden',build:'runner',hair:'bubble-pony', palette:palette('bronze','espresso','umber','9d5751','455361','73674e','e6bb71'),
      traits:{eyes:'level-eye',mouth:'soft-smile'}, dyes:{hat:'#954b49',bag:'#b58959',bottle:'#728c8b'}},
    pilot: {head:'reed',build:'lean',hair:'pixie', palette:palette('olive','ink','grey','475b72','394452','674f44','d7b170'),
      traits:{nose:'straight',brows:'tapered'}, dyes:{bag:'#755444',brooch:'#e0b875'}},
    librarian: {head:'fig',build:'soft',hair:'side-part', palette:palette('rose','silver','slate','967969','504f65','786050','d5bd92'),
      traits:{eyes:'hooded',facialHair:'pencil',complexion:'fine-lines'}, dyes:{glasses:'#634647',brow:'#72615b'}},
    vendor: {head:'hearth',build:'compact',hair:'curly-lob', palette:palette('sienna','sable','amber','a68b67','634955','806047','64815a'),
      traits:{eyes:'round',complexion:'smile-lines'}, dyes:{bag:'#bd9a68',ears:'#d4a761'}},
    designer: {fit:{top:'straight',legs:'wide'},head:'copper',build:'tall',hair:'undercut', palette:palette('peach','midnight','slate','657b94','574e62','b09270','d99976'),
      traits:{brows:'brow-slit',mouth:'relaxed'}, dyes:{audio:'#778c91'}},
    reporter: {fit:{top:'straight',legs:'straight'},head:'almond',build:'lean',hair:'lob', palette:palette('bronze','walnut','amber','ae9068','444e5e','765442','a65f65'),
      traits:{eyes:'deep-set',mouth:'wide'}, dyes:{bag:'#654a40',charm:'#b8a58a'}},

    scholar: {head:'dusk',build:'tall',hair:'top-knot', palette:palette('sand','ink','umber','597b76','505866','815b45','d8c8a0'),
      traits:{nose:'straight'}, dyes:{hat:'#536358',charm:'#97b8a1'}},
    scribe: {head:'linden',build:'slight',hair:'fishtail', palette:palette('gold','sable','hazel','7f687e','48485a','87664f','d0b879'),
      wear:{bottom:'wide-leg'}, traits:{eyes:'monolid',nose:'short'}, dyes:{bag:'#8b7059'}},
    merchant: {head:'flint',build:'sturdy',hair:'locs', palette:palette('bronze','sable','amber','9c5944','545c55','78503c','d4b367'),
      traits:{facialHair:'beard',mouth:'lower-full'}, dyes:{hat:'#b69b65',bag:'#b48450',bottle:'#b09056'}},
    herbalist: {head:'fig',build:'compact',hair:'twin-braids', palette:palette('amber','salt','hazel','688052','615449','856947','d7bc80'),
      traits:{complexion:'sunspots',mouth:'relaxed'}, dyes:{hat:'#bba77d',bag:'#765540',bottle:'#bc955a',charm:'#8da899'}},
    artisan: {head:'tide',build:'soft',hair:'crown-braid', palette:palette('sienna','espresso','umber','934f65','58485e','795344','d5ad62'),
      traits:{brows:'straight',complexion:'dimples'}, dyes:{belt:'#b88255'}},
    lanternkeeper: {head:'harbor',build:'broad',hair:'low-bun', palette:palette('olive','salt','grey','4d5a74','494656','745548','d0a45d'),
      traits:{eyes:'hooded',facialHair:'chinstrap',complexion:'fine-lines'}, dyes:{bag:'#906b49'}},
    poet: {head:'willow',build:'lean',hair:'half-up', palette:palette('porcelain','ink','moss','669287','5e566d','986855','e4c5a3'),
      traits:{eyes:'upturned',complexion:'left-mole'}, dyes:{ears:'#c6a477',charm:'#c68581'}},
    apprentice: {head:'scout',build:'small',hair:'twin-tails', palette:palette('gold','walnut','umber','6d8991','575565','956f4d','dfb96c'),
      wear:{shoes:'flats'}, traits:{eyes:'monolid',mouth:'small'}, dyes:{bag:'#9c7b54'}},

    mage: {head:'willow',build:'tall',hair:'waist-length', palette:palette('bronze','plum','amber','685982','49425e','79594f','dab66b'),
      traits:{eyes:'doe-eye',brows:'arched'}, dyes:{hat:'#685982',charm:'#d1ab62'}},
    alchemist: {head:'hearth',build:'compact',hair:'curly', palette:palette('rose','copper','hazel','9b9c77','5d5064','775348','92739f'),
      wear:{glasses:'round'}, traits:{nose:'upturned',complexion:'freckles'}, dyes:{glasses:'#976643',charm:'#8bb8aa',bottle:'#7da89b'}},
    ranger: {head:'ember',build:'runner',hair:'fishtail', palette:palette('copper','moss','moss','4d7560','515647','795b43','cfac69'),
      traits:{eyes:'almond',complexion:'cheek-scar'}, dyes:{bag:'#917047',bottle:'#b79969',charm:'#94b9a0'}},
    oracle: {head:'reed',build:'tall',hair:'long-waves', palette:palette('umber','pearl','grey','525c82','4e4763','736477','d2b475'),
      traits:{eyes:'level-eye',nose:'broad',iris:'two-tone'}, dyes:{ears:'#d3b376',charm:'#b69a72',brow:'#9b897c'}},
    bard: {head:'copper',build:'soft',hair:'beach-waves', palette:palette('sand','cinnamon','hazel','a76359','605167','835942','e2b76d'),
      traits:{mouth:'wide',brows:'arched',complexion:'dimples'}, dyes:{hat:'#895360',bag:'#9a704a',charm:'#c8a261'}},
    sprite: {head:'robin',build:'small',hair:'space-buns', palette:palette('copper','moss','amber','7d996e','635773','a27d65','e5a8a1'),
      traits:{eyes:'upturned',complexion:'freckles'}, dyes:{hairAccessory:'#e6a49e',bottle:'#91bdb0'}},

    astronaut: {head:'open',build:'sturdy',hair:'pixie', palette:palette('bronze','ink','umber','c9c6b3','596b76','7f6555','4c828b'),
      traits:{eyes:'hooded',nose:'rounded'}, dyes:{belt:'#65757e',charm:'#ba9668'}},
    engineer: {head:'harbor',build:'broad',hair:'tapered-coils', palette:palette('sienna','espresso','amber','547383','4c535b','815f47','dba15d'),
      traits:{facialHair:'goatee',brows:'feathered',mouth:'upper-full'}, dyes:{glasses:'#7e6959',bag:'#896747',wrist:'#ba945d'}},
    xenobotanist: {fit:{top:'straight',legs:'tapered'},head:'dusk',build:'slight',hair:'curly-lob', palette:palette('olive','walnut','moss','95aa91','55556c','77655c','8f779e'),
      traits:{nose:'wide',complexion:'left-mole'}, dyes:{bottle:'#86b8a9'}},
    navigator: {head:'linden',build:'lean',hair:'slick-back', palette:palette('cocoa','silver','teal','515a81','46465c','705c58','85beb7'),
      traits:{brows:'lifted',eyes:'long-almond'}, dyes:{audio:'#7b9c9c',wrist:'#9a8176',brow:'#6d5c59'}},
    roboticist: {fit:{top:'straight',legs:'tapered'},head:'tide',build:'compact',hair:'angled-bob', palette:palette('peach','plum','slate','aa7581','4e536a','9b795d','a8d2bf'),
      traits:{eyes:'almond',nose:'short'}, dyes:{belt:'#636675',gloves:'#657378'}},
    cadet: {head:'sprig',build:'growing',hair:'curtain', palette:palette('amber','midnight','slate','647f9e','47596a','91785f','e4b773'),
      traits:{eyes:'level-eye',brows:'lifted',mouth:'relaxed'}, dyes:{audio:'#859eaa',bag:'#b69368'}}
  };

  const fields = {
    home:'家庭与日常', learning:'教育与学习', craft:'手艺与制作', trade:'餐饮与商贸',
    arts:'文艺与表演', travel:'交通与远行', nature:'自然与田野', science:'科学与工程',
    service:'社区与服务', lore:'典籍与秘术'
  };
  const settings = {
    home:'居家', town:'街区市集', school:'学校书馆', workshop:'工作室', stage:'舞台节庆',
    wild:'户外山林', coast:'水岸海洋', transit:'途中驿站', station:'星际舱站'
  };
  // Role and setting are editorial choices. A costume change only changes the garment and gear facets.
  function indexGroups(groups) {
    const index = new Map();
    for (const [group, ids] of Object.entries(groups))
      for (const id of ids.split(' ')) {
        if (!index.has(id)) index.set(id, []);
        index.get(id).push(group);
      }
    return index;
  }
  const originalFields = indexGroups({
    home:'body_female body_male workshop_mother workshop_baby workshop_toddler chestnut hazel style_walker',
    learning:'fern maple relay workshop_child style_runner teacher librarian apprentice cadet',
    craft:'painter electrician builder designer artisan engineer roboticist',
    trade:'style_florist cashier chef barista vendor merchant',
    arts:'chorus style_musician reporter poet bard', travel:'ridge workshop_hiker guide courier pilot astronaut navigator',
    nature:'camper workshop_surveyor style_gardener herbalist ranger sprite xenobotanist',
    science:'programmer developer chemist alchemist',
    service:'manager nurse lanternkeeper style_reader', lore:'scholar scribe mage oracle'
  });
  const originalSettings = indexGroups({
    home:'body_female body_male workshop_mother workshop_toddler workshop_baby chestnut hazel',
    town:'ridge painter body_female body_male style_reader style_musician style_runner style_florist style_walker manager cashier guide nurse chef barista builder courier vendor reporter merchant lanternkeeper bard',
    school:'fern maple chorus relay workshop_child style_reader teacher librarian scholar scribe apprentice cadet',
    workshop:'painter programmer developer manager chemist chef electrician designer artisan alchemist engineer roboticist',
    stage:'chorus style_musician designer reporter poet bard oracle',
    wild:'fern relay camper workshop_hiker workshop_surveyor workshop_child style_runner style_gardener herbalist mage ranger sprite xenobotanist',
    coast:'ridge workshop_surveyor pilot', transit:'maple camper workshop_hiker guide courier pilot scholar merchant lanternkeeper astronaut navigator',
    station:'astronaut engineer xenobotanist navigator roboticist cadet'
  });
  const garments = {
    casual:['休闲便装','tee hoodie jacket'],
    knits:['针织与棉衣','pullover cardigan striped-cardigan snap-knit sailor-knit argyle quilt-jacket breton'],
    active:['户外与运动','trail-shell rain-anorak rugby field-jacket utility-gilet'],
    tailored:['衬衫与正装','oxford blazer polo knit-vest trench uniform deck-jumper'],
    work:['工装与罩衫','apron scrubs chef-coat lab-coat hi-vis mechanic denim-jacket kiln-smock'],
    robes:['交领与礼服','cross-robe brocade kimono frog-coat festival-bolero'],
    cloaks:['披肩与斗篷','mantle moth-cape'], flight:['航行与隔温服','flightsuit thermal-shell']
  };
  const cuts = indexGroups(Object.fromEntries(Object.entries(garments).map(([id, pair])=>[id,pair[1]])));
  const gear = {
    head:['帽子与发饰',['hat','hairAccessory']], eyewear:['眼镜',['glasses']], bags:['包袋与背具',['bag','attachment']],
    jewelry:['首饰与挂件',['ears','brooch','charm']], wrist:['腕饰与手套',['wrist','gloves']], audio:['耳机与听辅',['audio']],
    neck:['领饰与围巾',['neck']], waist:['腰带与束带',['belt']],
    drink:['水壶',['bottle']], tools:['手持物',['implement']], devices:['手机与电脑',['phone','laptop']]
  };
  function facets(doc) {
    const p = doc.parts;
    const worn = Object.entries(gear).filter(([, [,slots]]) => slots.some(slot => p[slot] && p[slot] !== 'none')).map(([key]) => key);
    if (['pendant','pearls','choker'].includes(p.neck) && !worn.includes('jewelry')) worn.push('jewelry');
    return { garment: cuts.get(p.top)?.[0], gear: worn };
  }
  const sources = [], newIds = new Set();
  function add(era,id,label,profile,field,places,art,role=label) {
    people[id] = art;
    const base = profile === 'male' || profile === 'female' ? 'adult' : profile;
    const key = 'look_' + id;
    newIds.add(key);
    sources.push({format:'pine-character',version:1,id:key,label,base,gender:base === 'adult' ? profile : 'unspecified',
      identity:{era,role,field,settings:places},parts:{neck:'none',hat:'none'}});
  }
  add('modern','kiln_potter','窑边陶艺师','female','craft',['workshop','town'],{
    head:'fig',build:'compact',hair:'low-bun',palette:palette('amber','walnut','hazel','797e72','485462','925e45','bc7551'),
    wear:{top:'kiln-smock',bottom:'panel-culottes',shoes:'deck-shoes',bag:'reed-creel',wrist:'woven',hairAccessory:'band'},traits:{eyes:'soft-oval',complexion:'freckles'},dyes:{bag:'#bb955e',hairAccessory:'#bb805d'}});
  add('modern','bookbinder','手工装帧师','male','craft',['workshop','school'],{
    head:'dusk',build:'lean',hair:'curtain',palette:palette('sand','salt','umber','7c5263','454758','745a49','dcc59a'),
    wear:{top:'utility-gilet',bottom:'cuffed-denim',shoes:'oxfords',glasses:'oval',implement:'notebook'},traits:{nose:'upturned',complexion:'fine-lines'}});
  add('modern','harbour_pilot','港口引航员','female','travel',['coast','transit'],{
    head:'harbor',build:'sturdy',hair:'low-pony',palette:palette('bronze','espresso','amber','d9ceb3','454f62','7a5145','465e75'),
    wear:{top:'deck-jumper',bottom:'wide-leg',shoes:'deck-shoes',hat:'pine-outfitter/harbour-peak',charm:'shell-token'},traits:{eyes:'hooded',mouth:'bow'},dyes:{hat:'#435b70',charm:'#d8bb8b'}});
  add('modern','village_vet','社区兽医','male','service',['town','wild'],{
    head:'hearth',build:'broad',hair:'tapered-coils',palette:palette('sienna','sable','umber','79998a','515765','855d4d','d4c59e'),
    wear:{top:'scrubs',bottom:'cargo',shoes:'canvas-shoes',bag:'pouch',implement:'clipboard'},traits:{brows:'angled',mouth:'small'}});
  add('modern','sound_recordist','田野录音师','female','arts',['wild','workshop'],{
    head:'reed',build:'tall',hair:'box-braids',palette:palette('cocoa','ink','amber','9e815c','4c675f','765a4d','d1ad69'),
    wear:{top:'utility-gilet',bottom:'banded-trousers',shoes:'trail-boots',audio:'headphones',bag:'hip-pack'},traits:{mouth:'upper-full',brows:'straight'},dyes:{audio:'#586275'}});
  add('modern','night_conductor','夜班列车长','male','travel',['transit','town'],{
    head:'flint',build:'tall',hair:'side-part',palette:palette('olive','salt','slate','515b72','434958','714f43','d2ac6b'),
    wear:{top:'uniform',bottom:'pinstripe',shoes:'oxfords',hat:'pine-outfitter/harbour-peak',wrist:'watch',charm:'signal-tag'},traits:{facialHair:'pencil',brows:'tapered'},dyes:{hat:'#52556a'}});
  add('modern','stage_rigger','剧场灯光师','female','arts',['stage','workshop'],{
    head:'ember',build:'runner',hair:'undercut',palette:palette('rose','plum','moss','49566d','544755','8a6c55','c77d65'),
    wear:{top:'utility-gilet',bottom:'cargo',shoes:'high-tops',belt:'utility',gloves:'fingerless',audio:'ear-hooks'},traits:{eyes:'double-lid',complexion:'left-mole'}});
  add('modern','bread_baker','晨市面包师','male','trade',['town','workshop'],{
    head:'tide',build:'sturdy',hair:'curly',palette:palette('gold','cinnamon','hazel','e0cdab','675551','896b53','966b50'),
    wear:{top:'kiln-smock',bottom:'trousers',shoes:'loafers',bag:'reed-creel'},traits:{facialHair:'handlebar',eyes:'downturned'},dyes:{bag:'#c59b64'}});
  add('modern','rehearsal_dancer','排练厅舞者','female','arts',['stage','school'],{
    head:'copper',build:'runner',hair:'top-knot',palette:palette('umber','espresso','amber','99586b','4e5369','b99b80','e7c0a1'),
    wear:{top:'festival-bolero',bottom:'panel-culottes',shoes:'flats',hairAccessory:'ribbon'},traits:{eyes:'long-almond',mouth:'bow'}});
  add('modern','birdwatch_child','观鸟学童','child','nature',['wild','school'],{
    head:'scout',build:'growing',hair:'wolf',palette:palette('peach','chestnut','moss','738356','635849','89624c','ceb178'),
    wear:{top:'utility-gilet',bottom:'knee-pants',shoes:'trail-boots',hat:'pine-core/bucket',bag:'tube-case',implement:'notebook'},traits:{eyes:'round',nose:'short'},dyes:{hat:'#c6ac77'}});
  add('modern','rain_pupil','雨巷通学童','child','learning',['school','town'],{
    head:'sprig',build:'small',hair:'french-bob',palette:palette('copper','ink','umber','c49548','4d6070','7e684e','e3cf97'),
    wear:{top:'rain-anorak',bottom:'capris',shoes:'deck-shoes',bag:'school-pack',hat:'pine-outfitter/storm-brim'},traits:{eyes:'monolid',mouth:'bow'},dyes:{hat:'#d3a44c',bag:'#927361'}});
  add('modern','young_rower','少年划船手','child','travel',['coast','school'],{
    head:'finch',build:'runner',hair:'low-pony',palette:palette('bronze','walnut','amber','cedacb','586479','a58467','487c88'),
    wear:{top:'deck-jumper',bottom:'track-shorts',shoes:'deck-shoes',wrist:'sport-band'},traits:{eyes:'level-eye',mouth:'wide'}});
  add('modern','reading_grandma','夜读外婆','female','home',['home','school'],{
    head:'hearth',build:'soft',hair:'low-bun',palette:palette('rose','silver','umber','ae837f','655c69','8b7159','d5bc92'),
    wear:{top:'quilt-jacket',bottom:'panel-culottes',shoes:'flats',glasses:'oval',implement:'notebook'},traits:{eyes:'crescent',complexion:'fine-lines'},dyes:{brow:'#786658'}});
  add('modern','blocks_toddler','积木小玩家','toddler','home',['home','school'],{
    head:'pip',build:'small',hair:'crew',palette:palette('sienna','sable','espresso','cf8b62','66817b','c49a72','edd4a2'),
    wear:{top:'quilt-jacket',bottom:'bib-overalls',shoes:'strap-sneakers'},traits:{brows:'fine',eyes:'round'},sculpt:{height:.96}});
  add('modern','dawn_baby','晨光棉衣宝宝','baby','home',['home'],{
    head:'acorn',build:'baby',hair:'crew',palette:palette('peach','walnut','umber','84aa9b','897b78','be9a74','e5c99c'),
    wear:{top:'quilt-jacket',bottom:'knee-pants',shoes:'soft-booties'},traits:{mouth:'small',brows:'short-brow'},dyes:{brow:'#715341'},sculpt:{eyeSpacing:1.05,chinRoundness:.54}});
  add('modern','rain_baby','听雨宝宝','baby','home',['home','town'],{
    head:'clover',build:'small',hair:'curly',palette:palette('umber','espresso','espresso','8ca6b5','646c87','ae8b6d','dec7a5'),
    wear:{top:'snap-knit',bottom:'joggers',shoes:'soft-booties'},traits:{eyes:'doe-eye',mouth:'relaxed'},sculpt:{chinRoundness:.49}});
  add('historic','woodblock_printer','木版年画师','female','craft',['workshop','stage'],{
    head:'linden',build:'compact',hair:'crown-braid',palette:palette('olive','ink','moss','945950','515465','795749','ddbc7a'),
    wear:{top:'frog-coat',bottom:'banded-trousers',shoes:'wrap-boots',bag:'tube-case',implement:'scroll'},traits:{nose:'straight',mouth:'thin'}});
  add('historic','reed_ferryman','芦湾艄公','male','travel',['coast','transit'],{
    head:'harbor',build:'broad',hair:'low-bun',palette:palette('copper','salt','umber','5b7e81','645d51','805841','d8b77b'),
    wear:{top:'kimono',bottom:'banded-trousers',shoes:'sandals',hat:'pine-core/reed-hat',bag:'reed-creel'},traits:{facialHair:'stubble',complexion:'sunspots'},dyes:{hat:'#b5a471'}});
  add('historic','tea_host','茶坊掌柜','female','trade',['town','transit'],{
    head:'fig',build:'soft',hair:'top-knot',palette:palette('sand','walnut','umber','6c826c','69566a','86614c','c4a267'),
    wear:{top:'frog-coat',bottom:'panel-culottes',shoes:'flats',implement:'mug',charm:'jade'},traits:{eyes:'crescent',complexion:'smile-lines'}});
  add('historic','rug_weaver','织毯匠','male','craft',['workshop','town'],{
    head:'ember',build:'sturdy',hair:'locs',palette:palette('bronze','sable','amber','a16758','565970','816248','e0ac68'),
    wear:{top:'festival-bolero',bottom:'wide-leg',shoes:'wrap-boots',belt:'sash'},traits:{facialHair:'goatee',eyes:'soft-oval'}});
  add('historic','post_rider','驿路信使','female','travel',['transit','wild'],{
    head:'reed',build:'runner',hair:'fishtail',palette:palette('amber','chestnut','hazel','84714d','534b55','795542','d09461'),
    wear:{top:'cross-robe',bottom:'banded-trousers',shoes:'wrap-boots',bag:'tube-case',bottle:'flask'},traits:{eyes:'upturned',brows:'low-flat'}});
  add('historic','drum_child','庙会小鼓手','child','arts',['stage','town'],{
    head:'robin',build:'growing',hair:'top-knot',palette:palette('gold','ink','umber','ac554e','4d596b','967052','dfb86f'),
    wear:{top:'festival-bolero',bottom:'banded-trousers',shoes:'wrap-boots',wrist:'woven',belt:'sash'},traits:{eyes:'almond',brows:'angled'}});
  add('historic','market_toddler','赶集幼童','toddler','home',['town','home'],{
    head:'pip',build:'small',hair:'crop',palette:palette('sand','espresso','umber','ae7b5b','687570','ad8463','e9c994'),
    wear:{top:'frog-coat',bottom:'knee-pants',shoes:'soft-booties',hat:'pine-outfitter/leaf-bonnet'},traits:{eyes:'soft-oval',nose:'rounded'},dyes:{hat:'#a59b6f'}});
  add('historic','archive_keeper','藏书楼校勘师','male','lore',['school','workshop'],{
    head:'flint',build:'lean',hair:'top-knot',palette:palette('rose','silver','grey','686d89','565166','876b51','c2ab82'),
    wear:{top:'cross-robe',bottom:'wide-leg',shoes:'loafers',implement:'quill',charm:'jade'},traits:{complexion:'fine-lines',facialHair:'goatee',eyes:'monolid'},dyes:{brow:'#706057'}});
  add('fantasy','moth_keeper','灯蛾守望人','female','lore',['wild','stage'],{
    head:'willow',build:'tall',hair:'waist-length',palette:palette('bronze','pearl','amber','565572','514a61','766054','bea372'),
    wear:{top:'moth-cape',bottom:'wide-leg',shoes:'wrap-boots',implement:'lantern',hat:'pine-outfitter/lantern-hood'},traits:{eyes:'long-almond',mouth:'lower-full'},dyes:{hat:'#65607b',brow:'#9d8875'}});
  add('fantasy','moss_farmer','苔庭菌农','male','nature',['wild','town'],{
    head:'hearth',build:'compact',hair:'tapered-coils',palette:palette('sienna','moss','hazel','87946a','67574d','816b51','d2b087'),
    wear:{top:'kiln-smock',bottom:'capris',shoes:'wrap-boots',bag:'reed-creel',hat:'pine-core/bucket'},traits:{eyes:'downturned',facialHair:'sideburns'},dyes:{hat:'#998b6a'}});
  add('fantasy','cloud_boater','云海摆渡人','female','travel',['coast','transit'],{
    head:'tide',build:'broad',hair:'half-up',palette:palette('copper','silver','slate','77969b','5c607b','926d56','dfc9a1'),
    wear:{top:'deck-jumper',bottom:'panel-culottes',shoes:'deck-shoes',bag:'tube-case',charm:'shell-token'},traits:{eyes:'monolid',brows:'lifted'}});
  add('fantasy','tide_weaver','潮汐织师','male','craft',['coast','workshop'],{
    head:'linden',build:'lean',hair:'long-waves',palette:palette('cocoa','midnight','teal','4a7478','4c536c','78605d','9fbdae'),
    wear:{top:'moth-cape',bottom:'banded-trousers',shoes:'sandals',charm:'shell-token',ears:'pearl'},traits:{mouth:'relaxed',brows:'arched'}});
  add('fantasy','glass_clockmaker','琉璃钟匠','female','craft',['workshop','town'],{
    head:'copper',build:'compact',hair:'space-buns',palette:palette('peach','plum','moss','9b707f','56536b','876752','bacebc'),
    wear:{top:'frog-coat',bottom:'panel-culottes',shoes:'chelsea',glasses:'geometric',implement:'prism'},traits:{eyes:'deep-set',mouth:'bow'}});
  add('fantasy','firefly_child','萤火采集童','child','nature',['wild','coast'],{
    head:'sprig',build:'small',hair:'twin-braids',palette:palette('amber','walnut','hazel','608260','62637c','a78059','dfb56f'),
    wear:{top:'moth-cape',bottom:'shorts',shoes:'wrap-boots',bag:'reed-creel',implement:'lantern'},traits:{eyes:'upturned',mouth:'soft-smile'}});
  add('fantasy','moon_post_child','月邮小信使','child','travel',['transit','wild'],{
    head:'scout',build:'growing',hair:'bubble-pony',palette:palette('rose','midnight','slate','7b6c93','525a76','967058','d9b888'),
    wear:{top:'festival-bolero',bottom:'banded-trousers',shoes:'wrap-boots',bag:'tube-case',hat:'pine-outfitter/lantern-hood'},traits:{eyes:'crescent',mouth:'small'},dyes:{hat:'#887398'}});
  add('fantasy','star_moss_baby','星苔摇篮宝宝','baby','home',['home','wild'],{
    head:'acorn',build:'small',hair:'crew',palette:palette('copper','espresso','umber','96a777','797689','c09a79','d9d3a7'),
    wear:{top:'quilt-jacket',bottom:'knee-pants',shoes:'soft-booties',hat:'pine-outfitter/leaf-bonnet'},traits:{eyes:'round',nose:'button'},dyes:{hat:'#a4af7a'}});
  add('scifi','glasshouse_keeper','月港育苗师','male','nature',['station','workshop'],{
    head:'dusk',build:'tall',hair:'box-braids',palette:palette('umber','sable','amber','83a194','556b70','7e7061','c4d4ac'),
    wear:{top:'utility-gilet',bottom:'panel-culottes',shoes:'deck-shoes',bottle:'elixir',implement:'probe'},traits:{eyes:'soft-oval',nose:'short'}});
  add('scifi','orbital_loader','环轨货运员','female','travel',['station','transit'],{
    head:'harbor',build:'sturdy',hair:'fade',palette:palette('gold','midnight','slate','bf825a','56596c','846853','e0c286'),
    wear:{top:'thermal-shell',bottom:'cargo',shoes:'wrap-boots',gloves:'fingerless',bag:'tube-case'},traits:{eyes:'double-lid',mouth:'wide'}});
  add('scifi','sonar_listener','深海声呐师','male','science',['coast','station'],{
    head:'reed',build:'soft',hair:'slick-back',palette:palette('sienna','salt','teal','516e8b','465771','796350','94beb5'),
    wear:{top:'thermal-shell',bottom:'joggers',shoes:'deck-shoes',audio:'headphones',charm:'signal-tag'},traits:{eyes:'hooded',facialHair:'stubble'},dyes:{audio:'#92a6a6'}});
  add('scifi','lunar_geologist','月面地质员','female','science',['station','wild'],{
    head:'ember',build:'runner',hair:'wolf',palette:palette('olive','copper','moss','b78969','546a72','866a58','9bc1b8'),
    wear:{top:'thermal-shell',bottom:'banded-trousers',shoes:'wrap-boots',bag:'tube-case',implement:'probe'},traits:{nose:'rounded',brows:'brow-slit'},dyes:{bag:'#af8e67'}});
  add('scifi','orbit_tailor','轨道服装师','female','craft',['station','workshop'],{
    head:'almond',build:'slight',hair:'angled-bob',palette:palette('bronze','plum','teal','997485','4f576d','8e7467','a5ccbd'),
    wear:{top:'festival-bolero',bottom:'panel-culottes',shoes:'chelsea',wrist:'digital',charm:'signal-tag'},traits:{eyes:'monolid',nose:'wide'}});
  add('scifi','weather_pupil','舱内气象学童','child','learning',['station','school'],{
    head:'finch',build:'growing',hair:'curtain',palette:palette('peach','ash','slate','829eae','58657b','a28b79','e1c480'),
    wear:{top:'thermal-shell',bottom:'joggers',shoes:'runners',bag:'school-pack',implement:'notebook'},traits:{eyes:'doe-eye',mouth:'small'}});
  add('scifi','porthole_toddler','舷窗观星幼儿','toddler','home',['station','home'],{
    head:'pip',build:'small',hair:'curly',palette:palette('amber','espresso','amber','8f94b0','677887','b89573','e4c48d'),
    wear:{top:'deck-jumper',bottom:'bib-overalls',shoes:'soft-booties'},traits:{eyes:'round',brows:'arched',nose:'short'}});
  add('scifi','nursery_baby','温室舱宝宝','baby','home',['station','home'],{
    head:'clover',build:'baby',hair:'bald',palette:palette('sand','fawn','umber','95b9ad','7c8e9d','bea185','e4d6ac'),
    wear:{top:'quilt-jacket',bottom:'capris',shoes:'soft-booties'},traits:{eyes:'soft-oval',mouth:'bow'},sculpt:{chinRoundness:.55}});

  add('modern','winter_runner','冬训小跑手','child','learning',['school','wild'],{
    head:'robin',build:'growing',hair:'pixie',palette:palette('amber','chestnut','hazel','7098a2','565a77','a47b60','e5b780'),
    wear:{top:'trail-shell',bottom:'joggers',shoes:'runners',gloves:'knit',wrist:'sport-band'},traits:{eyes:'almond',mouth:'soft-smile'}});

  // Each series starts with a published character. Members can have their own ages,
  // silhouettes and wardrobes while sharing a profession or a daily activity.
  const seriesRoster = {
    software:['程序员','programmer developer'],
    managers:['项目经理','manager'], guides:['导游','guide'], retail:['售货员','cashier vendor'],
    nurses:['护理师','nurse'], cooks:['厨师','chef bread_baker'], pottery:['陶艺师','kiln_potter'],
    dance:['舞者','rehearsal_dancer'], painters:['画师','painter woodblock_printer'],
    scholars:['书生','scholar poet'], boatmen:['摆渡人','reed_ferryman cloud_boater'],
    lamplight:['灯蛾守望人','moth_keeper'], starmages:['星图法师','mage'],
    alchemists:['炼金师','alchemist'], rangers:['森林巡护人','ranger'],
    pilots:['航行员','navigator astronaut pilot harbour_pilot'], mechanics:['星港机械师','engineer roboticist'],
    geology:['月面地质员','lunar_geologist'],
    household:['街坊与家人','body_female body_male workshop_mother hazel style_walker reading_grandma'],
    nursery:['摇篮里的宝宝','workshop_baby chestnut dawn_baby rain_baby star_moss_baby nursery_baby'],
    playgroup:['学步幼儿','workshop_toddler blocks_toddler market_toddler porthole_toddler'],
    pupils:['通学与见习','fern workshop_child apprentice cadet rain_pupil weather_pupil'],
    sports:['少年运动员','relay style_runner young_rower winter_runner'],
    trekkers:['踏青与考察','ridge camper workshop_hiker workshop_surveyor birdwatch_child'],
    post:['驿路信使','maple courier post_rider moon_post_child'],
    stage:['音乐与舞台','chorus style_musician stage_rigger bard drum_child sound_recordist'],
    garden:['花草与园圃','style_florist style_gardener herbalist moss_farmer glasshouse_keeper xenobotanist firefly_child sprite'],
    books:['书馆与教学','style_reader teacher librarian scribe archive_keeper bookbinder'],
    makers:['工艺与设计','artisan designer rug_weaver orbit_tailor glass_clockmaker tide_weaver'],
    technical:['技术与测量','electrician builder chemist sonar_listener'],
    shops:['店铺与茶坊','merchant barista tea_host'], transport:['港口与驿站','night_conductor orbital_loader lanternkeeper'],
    press:['新闻记者','reporter'], vets:['兽医','village_vet'], oracles:['占星先知','oracle']
  };
  const series = Object.fromEntries(Object.entries(seriesRoster).map(([key,[label]])=>[key,label]));
  const membership = new Map();
  for (const [group,[,members]] of Object.entries(seriesRoster))
    for (const person of members.split(' ')) membership.set(person,group);

  const peerSettings = {
    game_programmer:['home','workshop'], field_manager:['town','workshop','transit'],
    museum_guide:['town','school'], coast_guide:['coast','wild','transit'],
    bookshop_clerk:['town','school'], outreach_nurse:['town','home'], street_dancer:['stage','town'],
    plein_air_painter:['coast','wild'], poster_painter:['stage','workshop'],
    river_scholar:['coast','school','transit'], academy_scholar:['school'],
    tide_starmage:['coast','wild'], herb_alchemist:['wild','workshop'], lake_boater:['coast'],
    radio_reporter:['workshop','town'], field_reporter:['town','transit'],
    clinic_vet:['town'], orchard_oracle:['wild','town']
  };
  function peers(group,era,portraits) {
    const [role,roster] = seriesRoster[group], first = roster.split(' ')[0];
    const origin = sources.find(s=>s.id==='look_'+first)?.identity;
    const field = origin?.field ?? originalFields.get(first)[0];
    const places = origin?.settings ?? originalSettings.get(first);
    for (const [id,label,profile,head,build,hair,colors,wear,traits] of portraits) {
      add(era,id,label,profile,field,peerSettings[id] || places,{head,build,hair,palette:colors,wear,traits},role);
      membership.set(id,group);
    }
  }
  peers('software','modern',[
    ['game_programmer','独立游戏程序员','female','peach','compact','space-buns',palette('bronze','espresso','amber','627b78','535975','986d53','d9ae7b'),
      {top:'breton',bottom:'bib-overalls',shoes:'high-tops',laptop:'stickers',ears:'studs'},{complexion:'dimples'}],
    ['systems_programmer','系统程序员','male','brook','broad','fade',palette('sand','ash','slate','a47756','475762','795a47','dcc69e'),
      {top:'utility-gilet',bottom:'cuffed-denim',shoes:'deck-shoes',laptop:'field',wrist:'watch'},{brows:'feathered'}]
  ]);
  peers('managers','modern',[
    ['studio_manager','设计工作室经理','male','sorrel','lean','tapered-coils',palette('sienna','sable','hazel','718d83','535468','86634e','dbb78c'),
      {top:'knit-vest',bottom:'pinstripe',shoes:'loafers',glasses:'oval',implement:'notebook'},{complexion:'dimples'}],
    ['field_manager','驻场项目经理','female','petal','compact','side-pony',palette('olive','cinnamon','moss','af7756','475b60','7d5a44','d1b175'),
      {top:'field-jacket',bottom:'cargo',shoes:'trail-boots',bag:'survey-satchel',phone:'rugged'},{complexion:'sunspots'}]
  ]);
  peers('guides','modern',[
    ['museum_guide','博物馆导游','male','brook','tall','side-part',palette('copper','walnut','amber','7b708a','4a5865','7e5c4b','d9bf90'),
      {top:'oxford',bottom:'trousers',shoes:'oxfords',brooch:'nameplate',implement:'guide-flag'},{mouth:'soft-smile'}],
    ['coast_guide','海湾徒步导游','female','peach','compact','twin-braids',palette('rose','copper','slate','64877b','74624e','906a4b','e1af73'),
      {top:'utility-gilet',bottom:'shorts',shoes:'trail-boots',bag:'hip-pack',bottle:'canteen'},{complexion:'freckles'}]
  ]);
  peers('retail','modern',[
    ['bookshop_clerk','书店售货员','female','petal','slight','angled-bob',palette('peach','espresso','umber','788a74','68546a','805b4c','dbc6a0'),
      {top:'striped-cardigan',bottom:'plaid-skirt',shoes:'mary-janes',brooch:'nameplate',implement:'notebook'},{mouth:'relaxed'}],
    ['produce_clerk','果蔬店售货员','male','sorrel','sturdy','curly',palette('bronze','walnut','amber','b08053','53685f','87684d','dcc98b'),
      {top:'apron',bottom:'knee-pants',shoes:'canvas-shoes',bag:'reed-creel',wrist:'woven'},{complexion:'smile-lines'}]
  ]);
  peers('nurses','modern',[
    ['ward_nurse','病房护理师','female','petal','tall','low-bun',palette('gold','espresso','umber','86a99c','5d6e7c','c8b8a2','e0ceb5'),
      {top:'scrubs',bottom:'trousers',shoes:'runners',brooch:'nameplate',implement:'clipboard'},{eyes:'almond'}],
    ['outreach_nurse','社区巡诊护理师','male','peach','compact','quiff',palette('rose','cinnamon','moss','7392a0','505d70','9b8064','ddbb9a'),
      {top:'quilt-jacket',bottom:'joggers',shoes:'canvas-shoes',bag:'messenger',phone:'folio'},{brows:'straight'}]
  ]);
  peers('cooks','modern',[
    ['bistro_cook','小馆主厨','female','brook','lean','crown-braid',palette('sienna','ink','amber','557a72','514e61','866649','dcbb8a'),
      {top:'chef-coat',bottom:'pinstripe',shoes:'loafers',neck:'scarf'},{eyes:'soft-oval'}],
    ['cafe_cook','咖啡馆轻食厨师','male','peach','soft','wolf',palette('peach','honey','hazel','c19776','5b635b','89634f','e4cea2'),
      {top:'apron',bottom:'cuffed-denim',shoes:'deck-shoes',implement:'mug'},{complexion:'freckles'}]
  ]);
  peers('pottery','modern',[
    ['glaze_potter','青釉陶艺师','male','brook','tall','half-up',palette('sand','ink','umber','557d7b','515776','8e7059','cbbb90'),
      {top:'apron',bottom:'wide-leg',shoes:'sandals',wrist:'beads'},{brows:'tapered'}],
    ['firing_potter','柴烧陶艺师','female','sorrel','sturdy','pixie',palette('sienna','salt','amber','ad765c','4f5e56','795d4c','d7b173'),
      {top:'denim-jacket',bottom:'bib-overalls',shoes:'wrap-boots',belt:'utility'},{complexion:'smile-lines'}]
  ]);
  peers('dance','modern',[
    ['street_dancer','街舞舞者','male','sorrel','runner','afro',palette('umber','espresso','amber','778da3','574e68','bb976f','e1b578'),
      {top:'rugby',bottom:'joggers',shoes:'high-tops',wrist:'sport-band'},{eyes:'almond'}],
    ['ribbon_dancer','彩带舞者','female','petal','slight','fishtail',palette('sand','chestnut','hazel','bf858a','736180','aa826d','eed0a0'),
      {top:'sailor-knit',bottom:'skirt',shoes:'mary-janes',hairAccessory:'ribbon',wrist:'bangle'},{complexion:'dimples'}]
  ]);
  peers('painters','modern',[
    ['plein_air_painter','河岸写生画师','female','peach','runner','beach-waves',palette('copper','espresso','teal','8b9671','526477','9a7454','e1bd85'),
      {top:'trail-shell',bottom:'capris',shoes:'deck-shoes',bag:'tube-case',implement:'notebook'},{complexion:'sunspots'}],
    ['poster_painter','剧场海报画师','male','brook','broad','curtain',palette('rose','plum','slate','aa6973','54576e','876550','e6bd9a'),
      {top:'kiln-smock',bottom:'banded-trousers',shoes:'canvas-shoes',wrist:'woven'},{eyes:'double-lid'}]
  ]);
  peers('scholars','historic',[
    ['river_scholar','江南游学书生','female','petal','lean','fishtail',palette('gold','walnut','hazel','7b8a9f','64586f','95735b','ddbe86'),
      {top:'cross-robe',bottom:'panel-culottes',shoes:'flats',bag:'tube-case',implement:'scroll'},{brows:'willow'}],
    ['academy_scholar','书院讲读书生','male','sorrel','compact','low-bun',palette('sienna','ink','umber','ae805c','505f62','85624e','dec6a0'),
      {top:'frog-coat',bottom:'wide-leg',shoes:'wrap-boots',implement:'fan',charm:'jade'},{eyes:'crescent'}]
  ]);
  peers('boatmen','historic',[
    ['canal_boater','运河摆渡人','female','peach','runner','crown-braid',palette('gold','walnut','moss','ae7955','4d6266','8a644b','e2c797'),
      {top:'frog-coat',bottom:'capris',shoes:'sandals',belt:'woven',bag:'pouch'},{complexion:'sunspots'}],
    ['lake_boater','湖心摆渡人','male','brook','lean','half-up',palette('sand','espresso','slate','667b98','5b5967','896e51','d8b982'),
      {top:'cross-robe',bottom:'knee-pants',shoes:'wrap-boots',neck:'scarf',bottle:'gourd'},{brows:'straight'}]
  ]);
  peers('lamplight','fantasy',[
    ['dew_moth_keeper','露谷灯蛾守望人','male','peach','compact','tapered-coils',palette('copper','walnut','amber','73947d','565670','896950','e2c888'),
      {top:'moth-cape',bottom:'banded-trousers',shoes:'wrap-boots',implement:'lantern',charm:'shell-token'},{eyes:'soft-oval'}],
    ['ember_moth_keeper','余烬灯蛾守望人','female','petal','runner','crown-braid',palette('rose','copper','moss','aa716e','58526b','956a55','e5c197'),
      {top:'festival-bolero',bottom:'plaid-skirt',shoes:'chelsea',implement:'lantern',hairAccessory:'pins'},{brows:'arched'}]
  ]);
  peers('starmages','fantasy',[
    ['dawn_starmage','晨星图法师','male','brook','broad','curly-lob',palette('olive','silver','teal','6c879b','525872','836955','dbbc7f'),
      {top:'mantle',bottom:'wide-leg',shoes:'wrap-boots',implement:'astrolabe',brooch:'star'},{brows:'feathered'}],
    ['tide_starmage','潮汐星图法师','female','peach','compact','space-buns',palette('gold','ink','umber','738e86','5c536f','92715b','e1b69c'),
      {top:'brocade',bottom:'panel-culottes',shoes:'flats',charm:'shell-token',implement:'scroll'},{complexion:'dimples'}]
  ]);
  peers('alchemists','fantasy',[
    ['herb_alchemist','花草炼金师','female','petal','tall','long-waves',palette('bronze','espresso','amber','829774','5b5369','946e55','e1bc91'),
      {top:'kiln-smock',bottom:'wide-leg',shoes:'sandals',hairAccessory:'flower',bottle:'elixir'},{eyes:'almond'}],
    ['copper_alchemist','铜炉炼金师','male','sorrel','sturdy','side-part',palette('sand','copper','slate','ac775e','53616a','81604a','dbc18b'),
      {top:'utility-gilet',bottom:'banded-trousers',shoes:'wrap-boots',implement:'prism',charm:'vial'},{complexion:'freckles'}]
  ]);
  peers('rangers','fantasy',[
    ['fern_ranger','蕨谷巡护人','female','brook','runner','box-braids',palette('umber','ink','amber','789277','545c6d','8c6b4e','dfbd80'),
      {top:'utility-gilet',bottom:'cargo',shoes:'trail-boots',bag:'rucksack',bottle:'flask'},{eyes:'soft-oval'}],
    ['frost_ranger','霜林巡护人','male','peach','sturdy','wolf',palette('rose','ash','slate','8292a9','565975','8c7062','d9c398'),
      {top:'quilt-jacket',bottom:'banded-trousers',shoes:'wrap-boots',neck:'winter-scarf',bag:'reed-creel'},{brows:'straight'}]
  ]);
  peers('pilots','scifi',[
    ['shuttle_pilot','穿梭艇航行员','female','sorrel','compact','curly-lob',palette('sienna','espresso','amber','b77e70','4e6172','8c7162','e3c7a2'),
      {top:'flightsuit',bottom:'cargo',shoes:'high-tops',brooch:'badge',wrist:'digital'},{mouth:'soft-smile'}],
    ['aurora_pilot','极光航行员','male','petal','tall','side-part',palette('peach','ash','teal','809da5','585970','947965','debb92'),
      {top:'deck-jumper',bottom:'pinstripe',shoes:'deck-shoes',implement:'astrolabe',charm:'signal-tag'},{brows:'tapered'}]
  ]);
  peers('mechanics','scifi',[
    ['hull_mechanic','舱壳机械师','female','peach','sturdy','french-bob',palette('copper','midnight','umber','b7815a','4c626b','826651','dcc68a'),
      {top:'mechanic',bottom:'bib-overalls',shoes:'wrap-boots',gloves:'fingerless',belt:'utility'},{eyes:'almond'}],
    ['servo_mechanic','伺服机械师','male','brook','slight','locs',palette('umber','espresso','hazel','71998b','515b70','8c7765','d9bc99'),
      {top:'utility-gilet',bottom:'joggers',shoes:'runners',implement:'probe',wrist:'digital'},{brows:'tapered'}]
  ]);
  peers('geology','scifi',[
    ['crater_geologist','环坑地质员','male','sorrel','broad','tapered-coils',palette('bronze','sable','amber','779795','575b71','8a735a','e2bd8b'),
      {top:'utility-gilet',bottom:'cargo',shoes:'trail-boots',bag:'rucksack',implement:'probe'},{eyes:'soft-oval'}],
    ['ice_geologist','月冰地质员','female','petal','lean','low-pony',palette('sand','ash','slate','9699af','52677c','967967','b7d2c5'),
      {top:'quilt-jacket',bottom:'wide-leg',shoes:'wrap-boots',neck:'scarf',implement:'clipboard'},{complexion:'freckles'}]
  ]);

  peers('press','modern',[
    ['radio_reporter','电台记者','female','petal','compact','pixie',palette('bronze','walnut','amber','788c9b','595468','886850','dbb584'),
      {top:'knit-vest',bottom:'panel-culottes',shoes:'loafers',audio:'headphones',implement:'notebook'},{eyes:'almond'}],
    ['field_reporter','驻地记者','male','sorrel','tall','curly',palette('olive','espresso','hazel','a18467','4e6465','84674f','d8bc91'),
      {top:'field-jacket',bottom:'cuffed-denim',shoes:'trail-boots',bag:'camera',phone:'rugged'},{complexion:'sunspots'}]
  ]);
  peers('vets','modern',[
    ['aviary_vet','鸟园兽医','female','peach','lean','low-pony',palette('sand','copper','moss','889c7f','566275','96765b','ddc58f'),
      {top:'utility-gilet',bottom:'capris',shoes:'trail-boots',bag:'survey-satchel',implement:'notebook'},{complexion:'freckles'}],
    ['clinic_vet','诊所兽医','male','brook','compact','side-part',palette('amber','salt','umber','c5c8b2','586a71','836955','85a296'),
      {top:'lab-coat',bottom:'trousers',shoes:'deck-shoes',glasses:'rimless',brooch:'nameplate'},{brows:'feathered',complexion:'fine-lines'}]
  ]);
  peers('oracles','fantasy',[
    ['aurora_oracle','极光占星师','female','petal','tall','fishtail',palette('umber','silver','amber','8293ad','605b7b','937969','dbca9d'),
      {top:'moth-cape',bottom:'wide-leg',shoes:'flats',implement:'astrolabe',ears:'star'},{eyes:'double-lid'}],
    ['orchard_oracle','果园观星者','male','peach','compact','curtain',palette('rose','walnut','moss','8b9975','675c70','8c7151','e3bb87'),
      {top:'frog-coat',bottom:'banded-trousers',shoes:'wrap-boots',neck:'pendant',implement:'prism'},{brows:'straight'}]
  ]);

  function assemble(source, core, edition, neutralShape) {
    const key = source.id.slice(5), art = people[key];
    const identity = { era: 'modern', role: source.label, ...source.identity };
    identity.series = membership.get(key);
    identity.field ??= originalFields.get(key)[0];
    identity.settings = [...(identity.settings || originalSettings.get(key))];
    const parts = { ...source.parts, hair: art.hair, ...art.wear };
    const packs = { [core]: edition };
    const hatPack = pineCollectionWardrobe.hatPack;
    if (parts.hat.startsWith(hatPack.id + '/')) packs[hatPack.id] = hatPack.release;
    const portrait = heads[art.head], frame = builds[art.build];
    return {
      format: source.format, version: source.version, id: source.id, label: source.label,
      base: source.base, gender: source.gender, packs,
      identity,
      bodyFinish: 'painted',
      anatomyParts: { ...frame.parts },
      parts,
      colors: { ...art.palette, ...art.dyes },
      shape: {
        ...neutralShape, ...frame.shape,
        headDepth: 1.02, faceRelief: .96, lipProjection: -.18, jawDefinition: -.05, chinHeight: .05,
        ...portrait.shape, ...art.sculpt
      },
      face: {
        style: 'animation', finish: source.base === 'adult' ? 'storybook-lips' : 'soft-pixel',
        formMix: .87, ...portrait.face, ...art.traits
      },
      ...(art.fit ? { garmentFit: { ...art.fit } } : {}),
      ...(source.base === 'baby' ? { infantNose: 'nursery', infantChin: 'round' } : {})
    };
  }
  return { assemble, sources, newIds, fields, settings, series, facets,
    garments: Object.fromEntries(Object.entries(garments).map(([key, [label]]) => [key,label])),
    gear: Object.fromEntries(Object.entries(gear).map(([key, [label]]) => [key,label])) };
})();
