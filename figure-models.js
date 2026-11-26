// Turnaround sitters use the same parts, pigments and recipe format as the editor.
const pineFigureModels = (() => {
  const plain = PineLooks.archivedTemplates.get('look_body_male');
  function sitter(profile, label, parts, face, colors) {
    const doc = PineLooks.withBodyProfile(structuredClone(plain), profile);
    return { ...doc, id: 'look_model_' + doc.base, label,
      packs: { [PineLooks.core]: PineLooks.release },
      parts: { ...doc.parts, hat: 'none', neck: 'none', ...parts },
      face: { style: 'animation', ...face }, colors: { ...doc.colors, ...colors } };
  }
  // Second unfiltered baby in the 1.19.9 review. Both portraits are ordinary
  // editable recipes; the low-resolution profile study has no custom painter.
  function infantProfile(edited) {
    const doc = PineLooks.randomCharacter({base:'baby',seed:0x10185c31,release:PineLooks.garmentRelease,bodyFinish:'painted'});
    doc.label = edited ? '婴儿 02 · 鼻唇与颏尖试调' : '婴儿 02 · 随机原样';
    if (edited) {
      doc.id = 'look_baby02_profile';
      doc.face.nose = 'button';
      Object.assign(doc.shape, {
        noseWidth:.48, noseBridge:-.18, mouthHeight:-.10, lipProjection:.43,
        lowerLipFullness:.20, chinProjection:.40, chinRoundness:.55, jawDefinition:-.23
      });
    }
    return doc;
  }
  return {
    'blue-jacket': {
      format:'pine-character',version:1,id:'look_study_blue_jacket',label:'黑发蓝衣',base:'adult',gender:'male',
      packs:{'pine-core':'1.18.0'}, identity:{era:'modern',role:'产品设计师'},
      shape:{height:.91,shoulders:.96,arms:1,legs:1,faceWidth:1.04,eyeSpacing:1.03,jaw:1.02,mouthHeight:-.32,
        cheekWidth:-.03,cheekHeight:-.17,cheekProjection:-.24,cheekFullness:-.02,eyeDepth:-.05,eyeWidth:.07,
        eyeOpening:-.02,eyeTilt:-.01,browHeight:-.02,noseBridge:.03,noseWidth:-.03,mouthWidth:.06,
        upperLipFullness:.06,lowerLipFullness:.06,chinHeight:-.12,chinProjection:.06,chinRoundness:-.03,
        jawPosition:.07,jawAngle:.11,jawNeck:-.1,headDepth:1.02,faceRelief:.98,lipProjection:-.19,jawDefinition:-.01},
      parts:{hair:'hime',top:'denim-jacket',bottom:'wide-leg',shoes:'canvas-shoes',neck:'none',hat:'none',audio:'earbuds',implement:'clipboard'},
      colors:{skin:'#efc4ac',hair:'#28262c',eyes:'#29272a',top:'#667394',bottom:'#494f60',shoes:'#52454a',accent:'#cf9775'},
      face:{style:'animation',eyes:'doe-eye',brows:'short-brow',nose:'wide',mouth:'full',outline:'heart'}
    },
    'yellow-hardhat': {
      format:'pine-character',version:1,id:'look_study_yellow_hardhat',label:'黄帽浅发',base:'adult',gender:'male',
      packs:{'pine-core':'1.18.0'},identity:{era:'modern',role:'建筑工程师'},
      shape:{height:1,shoulders:1.07,arms:1,legs:1,faceWidth:.95,eyeSpacing:.96,jaw:1.04,mouthHeight:.11,
        cheekHeight:-.16,cheekProjection:-.27,cheekFullness:.05,eyeDepth:.02,browHeight:-.02,noseWidth:0,
        noseBridge:-.16,cheekWidth:-.05,eyeWidth:.09,eyeOpening:.05,eyeTilt:-.05,mouthWidth:-.07,
        upperLipFullness:.05,lowerLipFullness:.17,chinHeight:.01,chinProjection:0,chinRoundness:.09,
        jawPosition:.1,jawAngle:-.07,jawNeck:.01,headDepth:1.01,faceRelief:.98,lipProjection:-.2,jawDefinition:-.05},
      parts:{hair:'slick-back',top:'hi-vis',bottom:'cargo',shoes:'trail-boots',neck:'none',hat:'pine-core/hardhat',implement:'clipboard'},
      colors:{skin:'#efc4ac',hair:'#c9b389',eyes:'#668b9b',top:'#cb8b47',bottom:'#664e52',shoes:'#716052',accent:'#f2de89',hat:'#e8b751'},
      face:{style:'animation',eyes:'downturned',brows:'willow',nose:'short',mouth:'lower-full',outline:'heart'}
    },
    get 'baby02-source'() { return infantProfile(false); },
    get 'baby02-profile'() { return infantProfile(true); },
    get 'baby02-pad'() {
      const doc = PineLooks.withInfantChin(infantProfile(true), PineLooks.chinPadRelease);
      return {...doc, id:'look_baby02_pad', label:'婴儿 02 · 饱满下巴'};
    },
    adult: sitter('male', '卷袖衬衫', { hair: 'side-part', top: 'oxford', bottom: 'trousers', shoes: 'canvas-shoes' },
      { eyes: 'soft-oval', brows: 'straight', nose: 'short', mouth: 'soft-smile', outline: 'oval' },
      { skin: '#ac744c', hair: '#3c2c2a', eyes: '#473026', top: '#818465', bottom: '#50494b', shoes: '#80604c', accent: '#dcc8a0' }),
    child: sitter('child', '蓝色套头衫', { hair: 'crop', top: 'pullover', bottom: 'trousers', shoes: 'sneakers' },
      { eyes: 'round', brows: 'fine', nose: 'button', mouth: 'smile', outline: 'heart' },
      { skin: '#c38a60', hair: '#593b2f', eyes: '#4b322b', top: '#516881', bottom: '#a36544', shoes: '#cbbb96', accent: '#536479' }),
    toddler: sitter('toddler', '杏色背带裤', { hair: 'pixie', top: 'tee', bottom: 'bib-overalls', shoes: 'strap-sneakers' },
      { eyes: 'round', brows: 'fine', nose: 'button', mouth: 'soft-smile', outline: 'oval' },
      { skin: '#c59170', hair: '#57473b', eyes: '#494034', top: '#849887', bottom: '#ba8752', shoes: '#92745c', accent: '#d9c29c' }),
    baby: sitter('baby', '青色棉套装', { hair: 'curly', top: 'snap-knit', bottom: 'knee-pants', shoes: 'soft-booties' },
      { eyes: 'round', brows: 'fine', nose: 'button', mouth: 'soft-smile', outline: 'round' },
      { skin: '#99613f', hair: '#4e3028', eyes: '#442921', top: '#58796c', bottom: '#58796c', shoes: '#7d9580', accent: '#b5bc91' })
  };
})();
