// A clip borrows catalog objects for the duration of its cue. Items held by one
// or two performers are drawn by the sampler. Set dressing stays in world space.
const motionSupplies = (() => {
  const previous = new Map();
  for (const [items, actions] of [
    ['phone','phone call'], ['laptop stool','type'], ['stool','sitdown take-seat rise-from-seat'],
    ['mat','recline tummy-time'], ['book stool','read'], ['book pen stool','write'],
    ['camera','photograph field-observe'], ['brush','brush-teeth'], ['comb','comb'],
    ['bowl spoon stool','eat stir'], ['broom','sweep'], ['plant wateringCan','water-plant'],
    ['parcel','carry-box handover wrap-parcel'], ['guitar stool','guitar'],
    ['ball','bounce-ball baby-reach roll-ball'], ['rattle','rattle follow-rattle'], ['drum','toy-drum'],
    ['book','storytime show-page'], ['clipboard','brief-team point-map'], ['notebook','review-notes'],
    ['scroll','show-plan unroll-map'], ['mug','coffee-break serve-mug'], ['parcel scanner','scan-code dock-check'],
    ['clipboard pen','check-order'], ['guide-flag','guide-flag'], ['notebook probe','survey-sample'],
    ['lantern','carry-lantern'], ['fan','fan-cool'], ['quill scroll','lift-brush'],
    ['prism','check-jade raise-crystal trace-rune'], ['astrolabe','read-stars'], ['bowl mug','mix-elixir'],
    ['lantern prism','light-ward'], ['probe','scan-air aim-beacon'], ['clipboard probe','compare-readings'],
    ['desk chair notebook pen','desk-notes desk-sketch'], ['desk chair laptop','desk-code'],
    ['desk chair book','desk-read'], ['desk chair scroll quill','desk-calligraphy'], ['desk lamp','switch-lamp']
  ]) for (const id of actions.split(' ')) previous.set(id,items.split(' '));

  // Clothing comes from the same slots as the character editor. A compatible
  // piece already worn by the actor takes precedence over the loan.
  const wardrobe = new Map();
  for (const [ids,slot,fallback,accept] of [
    ['check-watch','wrist','watch',['watch','sport-band','digital']],
    ['drink','bottle','canteen'], ['tip-hat press-hat','hat','pine-core/trail-cap'],
    ['adjust-glasses','glasses','round'], ['fasten-earring','ears','hoops'], ['adjust-strap','bag','school-pack'],
    ['tighten-belt','belt','leather'], ['tie-scarf','neck','winter-scarf',['scarf','winter-scarf','silk-foulard','checked-muffler','knit-snood','sailor-kerchief']],
    ['straighten-tie','neck','tie',['tie','slim-tie','ribbon-tie','bolo']], ['hold-skirt formal-curtsy','bottom','skirt','skirt'],
    ['check-shoelace','shoes','canvas-shoes',['sneakers','high-tops','trail-boots','canvas-shoes','runners','oxfords','derby-laceups','court-sneakers']],
    ['pull-zip','top','jacket',['jacket','trail-shell','rain-anorak','zip-hoodie','hood-parka','station-jacket']],
    ['smooth-jacket','top','jacket',['jacket','field-jacket','trail-shell','blazer','cropped-blazer','denim-jacket','mandarin-jacket','zhongshan-jacket','letterman-jacket','quilt-jacket','station-jacket','loom-jacket']],
    ['gather-ponytail','hair','ponytail',['ponytail','low-pony','side-pony','bubble-pony','long-waves','shoulder-length','half-up']],
    ['roll-sleeve pull-sleeve button-cuff unfasten-collar turn-collar','top','oxford',['oxford','denim-jacket','knit-vest','blazer','trench','field-jacket','banker-shirt','flannel-overshirt','cord-shirtcoat','rodeo-shirt']]
  ]) for(const id of ids.split(' ')) wardrobe.set(id,{slot,fallback,accept});

  // x and y are in a 50-unit performer’s space. Fixture height is its actual
  // catalog height, so a child can reach a raised lock or a towel rail as well.
  const sets = new Map();
  function set(ids,kind,x,y,z=0,heading=0) {
    for(const id of ids.split(' ')) sets.set(id,{kind,x,y,z,heading});
  }
  set('puddle-hop','puddle',7.75,0);
  set('threshold','threshold-rail',6.4,0);
  set('brush-mat','mat',9,-1); set('baby-pat-floor','mat',0,0);
  set('wipe-window','window-frame',12,-4);
  set('wipe-table dust-corner','desk',18,-4);
  set('dust-shelf','open-shelf',15,-6);
  set('hang-cloth hook-keys mark-trail','peg-rail',12,-8);
  set('hold-handrail','transit-strap',6,-7);
  set('turn-key','lock-panel',11,-6);
  set('tap-transit','card-reader',10,-8);
  set('scoop-soil tamp-soil sow-seed','planter-box',9,-5);
  set('mist-leaves','plant',13,-6);
  set('invite-seat','chair',12,-13,0,-.85);
  set('invite-answer','chair',1,-17,0,Math.PI/2);
  set('wash-cheeks','desk',14,-1);

  function stage(clip,actor) {
    const scale=actor.rig.height/50;
    return clip.resources.fixtures.map(p=>PineWorld.place(p.kind,p.x*scale,p.y*scale,
      p.kind==='transit-strap'?actor.rig.shoulder[2]+activityMotion.reach(actor.rig)*.72-1.9:p.z,p.heading));
  }
  function hanging(id,actor,kind) {
    if (sets.get(id)?.kind!=='peg-rail') return null;
    const s=actor.rig.height/50, at=sets.get(id);
    const hook=[at.x*s-2.2,at.y*s,22.5], grip=PineWorld.items.get(kind).anchors.grip;
    const edge=kind==='cloth'?[-2.2,0,0]:kind==='keyring'?[0,0,.82]:[0,0,1.9];
    const pitch=kind==='cloth'?1.38:0;
    const mounted=activityMotion.atGrip(kind,hook,edge,s,0,pitch);
    const hand=activityMotion.contact(mounted,grip);
    return {mounted,hand,carried:p=>activityMotion.atGrip(kind,p,grip,s,0,pitch)};
  }
  // Constrain the working hand to the actual contact plane during the stroke.
  function touch(id,hand,actor,amount) {
    if (!amount || !sets.has(id)) return hand;
    const s=actor.rig.height/50, spec=sets.get(id);
    const reach=activityMotion.reach(actor.rig);
    const nearX=spec.x*s, nearY=spec.y*s;
    const bounded=(n,mid,span)=>studioRig.clamp(n,mid-span,mid+span);
    let goal;
    if (id==='wipe-window') goal=[nearX-.73*s,bounded(hand[1],nearY,11),bounded(hand[2],23,12)];
    if (id==='wipe-table' || id==='dust-corner') goal=[bounded(hand[0],nearX,8),bounded(hand[1],nearY,14),21.1+.4*s];
    if (id==='dust-shelf') goal=[bounded(hand[0],nearX,3.3),bounded(hand[1],nearY,9.9),28.35];
    if (id==='hold-handrail') goal=[nearX,nearY,actor.rig.shoulder[2]+reach*.72];
    if (id==='turn-key') goal=[nearX-1.15*s,nearY,26];
    if (id==='tap-transit') goal=[nearX-1.45*s,nearY,25.0];
    if (id==='scoop-soil' || id==='tamp-soil' || id==='sow-seed')
      goal=[bounded(hand[0],nearX,3.5),bounded(hand[1],nearY,4.5),5.2+.17*reach];
    return goal?activityMotion.between(hand,goal,amount):hand;
  }
  function define(id,items,seats,roles,requiredWear,requiredFixtures) {
    const carried=items ?? previous.get(id) ?? [];
    const seatSlots=seats ?? (id==='sit'||id==='doze'?[0]:[]);
    const wear=requiredWear ?? (wardrobe.has(id)?[wardrobe.get(id)]:[]);
    const fixtures=requiredFixtures ?? (sets.has(id)?[sets.get(id)]:[]);
    if (!Array.isArray(fixtures) || fixtures.some(p=>!p || !PineWorld.items.has(p.kind) ||
        ![p.x,p.y,p.z??0,p.heading??0].every(Number.isFinite))) throw Error('动作的布景引用无效 · '+id);
    if (!Array.isArray(carried) || carried.some(key=>!PineWorld.items.has(key)) ||
        !Array.isArray(seatSlots) || seatSlots.some(i=>!Number.isInteger(i)||i<0||i>=roles.length) ||
        !Array.isArray(wear) || wear.length>roles.length || wear.some(rule=>rule && (!rule.slot || !rule.fallback)))
      throw Error('动作引用了无效的物件、穿搭或演员槽位 · '+id);
    const scenery=fixtures.map(p=>PineWorld.place(p.kind,p.x,p.y,p.z??0,p.heading??0));
    if (id==='wash-cheeks' && !requiredFixtures) scenery.push(PineWorld.place('bowl',8,-1,21.1));
    return {items:carried.slice(),seatSlots:seatSlots.slice(),wear:wear.slice(),fixtures:scenery};
  }
  function inventory(clip,cast) {
    const counts=new Map();
    const add=id=>counts.set(id,(counts.get(id)||0)+1);
    clip.resources.items.forEach(add);
    for (const slot of clip.resources.seatSlots) if (!cast[slot].tags.includes('baby')) add('stool');
    if (clip.route) add(clip.route);
    for (const p of clip.resources.fixtures) add(p.kind);
    return Array.from(counts,([id,count])=>({id,count,label:PineWorld.items.get(id).label}));
  }
  return {define,inventory,stage,touch,hanging};
})();
