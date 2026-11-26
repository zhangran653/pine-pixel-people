// Wardrobe additions for the character catalogue. Pigments and coordinates come from the shared slice rig.
const pineCollectionWardrobe = (() => {
  const tops = {
    'kiln-smock': '交叉背带工艺罩衫', 'utility-gilet': '多袋短马甲', 'deck-jumper': '方领水手衫',
    'quilt-jacket': '拼布绗棉小袄', 'frog-coat': '盘扣对襟衫', 'festival-bolero': '织边节庆短衣',
    'moth-cape': '蛾翼披领', 'thermal-shell': '斜襟隔温服'
  };
  const bottoms = { 'panel-culottes': '折裥裙裤', 'banded-trousers': '缠带长裤' };
  const shoes = { 'deck-shoes': '白边甲板鞋', 'wrap-boots': '绕带长靴' };
  const bags = { 'reed-creel': '藤编挎篮', 'tube-case': '圆筒图匣' };
  const charms = { 'shell-token': '扇贝挂坠', 'signal-tag': '双片讯号牌' };
  const pattern = pinePatternWardrobe;
  Object.assign(tops,pattern.choices.top); Object.assign(bottoms,pattern.choices.bottom);
  Object.assign(shoes,pattern.choices.shoes); Object.assign(bags,pattern.choices.bag);
  const choices = { top: tops, bottom: bottoms, shoes, bag: bags, charm: charms };
  const currentChoices=Object.entries({...pattern.choices,...choices});
  function needsCurrentParts(parts) {
    return currentChoices.some(([slot, options]) => Object.hasOwn(options, parts[slot]));
  }
  const fabrics = {
    'kiln-smock'(u,v,t,k) {
      const a = Math.abs(v);
      if (u < 0 && (Math.abs(a - (1-t)*.9) < .11)) return k.accent;
      if (u > 0 && ((t < .63 && a < .8) || (a < .43 && t < .82))) {
        if (t > .27 && t < .44 && a < .54) return t > .39 ? k.trimLight : k.topShade;
        return k.accent;
      }
      return a > .34 && a < .54 && t > .55 ? k.accent : k.top;
    },
    'utility-gilet'(u,v,t,k) {
      const a = Math.abs(v);
      if (u > 0 && a < .12 + Math.max(0,t-.57)*1.12) return k.lining;
      if (u > 0 && a > .27 && a < .77 && ((t > .21 && t < .44) || (v < 0 && t > .53 && t < .68)))
        return (t > .37 && t < .44) || t > .63 ? k.trimLight : k.topShade;
      return t < .1 ? k.topShade : k.top;
    },
    'deck-jumper'(u,v,t,k) {
      const edge = u < 0 ? .54 : .60+.33*Math.abs(v);
      if (t > edge) return t < edge+.045 || (t > edge+.10 && t < edge+.14) ? k.lining : k.accent;
      return u > .2 && Math.abs(v) < .095 && t > .41 ? k.accent : k.top;
    },
    'quilt-jacket'(u,v,t,k) {
      const seam = Math.min(Math.abs(Math.sin(5*v+8*t)),Math.abs(Math.sin(5*v-8*t)));
      if (u > .24 && Math.abs(v-.20) < .055) return k.accent;
      if (t < .12 || t > .90) return k.trimLight;
      return seam < .19 ? k.topShade : (v < -.2 && t > .45 && t < .7 ? k.topLight : k.top);
    },
    'frog-coat'(u,v,t,k) {
      if (u > 0 && Math.abs(v) < .37 && [.37,.58,.79].some(y=> Math.abs(t-y) < .031))
        return Math.abs(v) < .09 ? k.brass : k.accent;
      return t > .90 || (u > 0 && Math.abs(v) < .045) ? k.trimLight : k.top;
    },
    'festival-bolero'(u,v,t,k) {
      const hem = .24 + .13*Math.abs(v);
      if (t < hem || (u > 0 && Math.abs(v) < .09)) return k.lining;
      if (t < hem+.13 || t > .9) return Math.cos(11*v+6*u) > .46 ? k.trimLight : k.accent;
      return k.top;
    },
    'moth-cape'(u,v,t,k) {
      const edge = .53 - .12*Math.cos(7*v) - .13*Math.abs(v);
      if (t < edge) return k.topShade;
      if (t < edge+.06) return k.trimLight;
      const spot = ((Math.abs(v)-.68)/.17)**2 + ((t-.66)/.08)**2;
      return spot < .30 ? k.topShade : spot < 1 ? k.trimLight : k.accent;
    },
    'thermal-shell'(u,v,t,k) {
      const seam = t-.48-.40*v;
      if (u > 0 && Math.abs(seam) < .052) return k.trimLight;
      if (u < 0 && t > .54 && t < .76 && Math.abs(v) < .58) return t > .69 ? k.accent : k.topShade;
      if (u > .18 && v > .28 && v < .62 && t > .68 && t < .80) return k.accent;
      return t < .22 ? k.topShade : k.top;
    }
  };
  for (const id of Object.keys(pattern.tops)) fabrics[id]=(u,v,t,k)=>pattern.fabric(id,u,v,t,k);
  function sleeve(style,t,u,v,side,r,fore,k) {
    if (Object.hasOwn(pattern.tops,style)) return pattern.sleeve(style,t,u,v,side,r,fore,k);
    if (style === 'utility-gilet' || style === 'kiln-smock') return fore && t > .76 ? k.skinLight : k.lining;
    if (style === 'moth-cape' && !fore) return t < .64 ? k.accent : t < .77 ? k.trimLight : k.top;
    if (style === 'thermal-shell' && !fore && t > .32 && t < .57) return k.accent;
    if (style === 'deck-jumper' && fore && ((t>.64 && t<.72) || (t>.79 && t<.88))) return k.accent;
    if (fore && t > .77) return style === 'festival-bolero' || style === 'frog-coat' ? k.accent : k.topShade;
    return side*v < -.46*r ? k.topShade : k.top;
  }
  function bag(kind,b,k,d,w,low,h) {
    if (Object.hasOwn(pattern.bags,kind)) return pattern.luggage(kind,b,k,d,w,low,h);
    const x = -.57*d, y = w*1.08, z = low+.28*h;
    const line = (a,c,r,color) => b.link(a,c,r,r,1,()=>color);
    if (kind === 'reed-creel') {
      b.blob(x,y,z,.88*d,.40*w,.22*h,(px,py,pz)=>{
        const level = (pz-z)/(.22*h);
        if (level>.66) return level>.87 ? k.bagLight : k.bagShade;
        const weft = Math.floor(level*5), warp = Math.floor((px-x)*5/d+(py-y)*2/w);
        return ((weft+warp)&1) ? k.bagMain : k.bagLight;
      },3.6);
      let previous = [x-.69*d,y,z+.13*h];
      for(let i=1;i<=8;i++){
        const angle=Math.PI*i/8, point=[x-.69*d*Math.cos(angle),y,z+h*(.13+.35*Math.sin(angle))];
        line(previous,point,.073*w,k.bagShade); previous=point;
      }
    } else {
      const start=[x-.46*d,y,z-.24*h], end=[x+.43*d,y,z+.35*h];
      b.link(start,end,.29*w,.29*w,1,(t)=>t<.11 || t>.87 ? k.bagLight : t>.73 && t<.79 ? k.brass : k.bagMain);
      line([d*.34,-w*.58,low+h*.93], [d*.84,w*.32,low+h*.61], .062*w,k.bagShade);
      line([d*.84,w*.32,low+h*.61], end,.062*w,k.bagShade);
    }
  }
  function charm(kind,b,k,d,w,low,h) {
    const x=1.05*d, y=-.32*w, z=low+.62*h, r=.19*w;
    for(const side of [-1,1]) b.link([x*.62,side*.48*w,low+.94*h],[x,y,z],r*.18,r*.15,1,()=>k.charmShade);
    if(kind==='shell-token') {
      for(let i=-2;i<=2;i++) {
        const a=i*.30;
        b.link([x,y,z],[x+r*.17,y+r*Math.sin(a)*1.65,z-r*Math.cos(a)*1.52],.28*r,.40*r,1,
          ()=> i%2 ? k.charmShade : k.charmMain);
      }
    } else for(const side of [-1,1]) {
      const cy=y+side*.54*r, cz=z-(side<0?.80:1.32)*r;
      b.blob(x,cy,cz,.34*r,.50*r,.89*r,(_x,_y,pz)=>pz>cz+.29*r ? k.brass : k.charmMain,3.8);
    }
  }
  function hat(id,label,strokes) {
    return {id,label,slot:'hat',primitives:strokes.map(([x,y,z,rx,ry,rz,color,power=2.6])=>({
      shape:'ellipsoid',center:[x,y,z],size:[rx,ry,rz],color,power
    }))};
  }
  const hatPack = {format:'pine-parts',version:1,id:'pine-outfitter',release:'1.0.0',title:'松溪衣装集',author:'Pine Pixel World contributors',license:'MIT',parts:[
    hat('storm-brim','后披沿雨帽',[
      [-.28,0,.43,1.38,1.18,.13,'hatShade'],[-.30,0,.48,1.38,1.16,.11,'hatMain'],
      [-.09,0,.77,1.02,.99,.53,'hatMain'],[0,0,.62,1.05,1.025,.077,'hatTrim']]),
    hat('harbour-peak','船务便帽',[
      [.32,0,.51,1.04,.85,.10,'hatShade'],[-.05,0,.64,1,1.03,.20,'hatTrim'],
      [-.10,0,.83,1.07,1.13,.25,'hatMain',3.2],[.86,0,.72,.10,.19,.13,'hatLight']]),
    hat('lantern-hood','提灯尖兜帽',[
      [-.61,0,.20,.50,.91,.75,'hatShade'],[-.30,-.83,.24,.51,.26,.67,'hatMain'],[-.30,.83,.24,.51,.26,.67,'hatMain'],
      [-.08,0,.64,1.08,1.09,.52,'hatMain'],[-.19,0,.98,.81,.81,.42,'hatMain'],
      [-.46,0,1.27,.56,.53,.32,'hatMain'],[-.77,.04,1.44,.37,.29,.21,'hatTrim'],[-1.0,.06,1.44,.16,.15,.12,'hatLight']]),
    hat('leaf-bonnet','双叶软帽',[
      [0,0,.68,1.045,1.055,.47,'hatMain'],[0,0,.49,1.035,1.075,.13,'hatTrim'],
      [-.13,-.31,1.10,.21,.32,.19,'hatLight'],[.04,.29,1.13,.22,.31,.21,'hatMain']])
  ]};
  return { tops, bottoms, shoes, bags, charms, choices, needsCurrentParts, fabrics, sleeve, bag, charm, hatPack };
})();
