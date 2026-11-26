// Versioned appearance recipes and declarative headwear. Usable without a DOM.
const PineLooks = (() => {
  const core = 'pine-core',
    originalRelease = '1.0.0',
    styleRelease = '1.1.0',
    profileRelease = '1.2.0',
    proportionRelease = '1.3.0',
    hairRelease = '1.4.0',
    headRelease = '1.5.0',
    strandRelease = '1.6.0',
    contourRelease = '1.6.1',
    wardrobeRelease = '1.7.0',
    collectionRelease = '1.8.0',
    sculptRelease = '1.9.0',
    volumeRelease = '1.9.1',
    jawRelease = '1.9.2',
    neckRelease = '1.10.0',
    mandibleRelease = '1.10.1',
    sagittalRelease = '1.11.0',
    occipitalRelease = '1.11.1',
    morphRelease = '1.12.0',
    infantRelease = '1.13.0',
    infantNapeRelease = '1.13.1',
    naturalProfileRelease = '1.14.0',
    lipJawRelease = '1.15.0',
    illustratedRelease = pinePortraitStyles.illustratedRelease,
    silhouetteRelease = pinePortraitStyles.silhouetteRelease,
    facePlaneRelease = pinePortraitStyles.facePlaneRelease,
    pixelRelease = pinePortraitStyles.pixelRelease,
    release = pinePortraitStyles.figureRelease,
    tailoredRelease = pinePortraitStyles.tailoredRelease,
    proportionStudyRelease = pinePortraitStyles.proportionStudyRelease,
    structureStudyRelease = pinePortraitStyles.structureStudyRelease,
    gameFaceRelease = pinePortraitStyles.gameFaceRelease,
    baseFaceRelease = pinePortraitStyles.baseFaceRelease,
    clothingStudyRelease = pinePortraitStyles.clothingStudyRelease,
    featureStudyRelease = pinePortraitStyles.featureStudyRelease,
    figureRatioRelease = pinePortraitStyles.figureRatioRelease,
    expressionRelease = pinePortraitStyles.expressionRelease,
    garmentRelease = pinePortraitStyles.garmentRelease,
    infantChinRelease = pinePortraitStyles.infantChinRelease,
    chinPadRelease = pinePortraitStyles.chinPadRelease,
    infantNoseRelease = pinePortraitStyles.infantNoseRelease;
  const releases = [
    originalRelease,
    styleRelease,
    profileRelease,
    proportionRelease,
    hairRelease,
    headRelease,
    strandRelease,
    contourRelease,
    wardrobeRelease,
    collectionRelease,
    sculptRelease,
    volumeRelease,
    jawRelease,
    neckRelease,
    mandibleRelease,
    sagittalRelease,
    occipitalRelease,
    morphRelease,
    infantRelease,
    infantNapeRelease,
    naturalProfileRelease,
    lipJawRelease,
    illustratedRelease,
    silhouetteRelease,
    facePlaneRelease,
    pixelRelease,
    release,
    tailoredRelease, proportionStudyRelease, structureStudyRelease, gameFaceRelease, baseFaceRelease, clothingStudyRelease, featureStudyRelease, figureRatioRelease, expressionRelease, garmentRelease, infantChinRelease, chinPadRelease, infantNoseRelease
  ];
  function figurePin(recipe) {
    const pin = recipe?.packs?.[core];
    return pinePortraitStyles.hasTailoredFigure(pin) ? pin : release;
  }
  function withFigureStudy(recipe) {
    const next = structuredClone(recipe);
    next.packs[core] = structureStudyRelease;
    delete next.bodyFinish;
    delete next.clothingCut;
    clearFigureRatios(next);
    if (next.face?.form) {
      next.anatomyParts = { ...next.anatomyParts, skull: next.face.form };
      delete next.face.form;
    }
    if (next.face) delete next.face.formMix;
    return next;
  }
  function withGameFace(recipe) {
    const next = structuredClone(recipe);
    next.packs[core] = gameFaceRelease;
    delete next.clothingCut;
    clearFigureRatios(next);
    next.face = { ...facePresets.classic.face, ...next.face, style: 'animation' };
    return next;
  }
  function withBaseFace(recipe, form) {
    if (form === undefined) {
      const original = recipe.face?.form ?? recipe.anatomyParts?.skull;
      form = original ?? (['baby','toddler'].includes(recipe.base) ? 'round' : 'long');
    }
    requireThat(typeof form === 'string' && Object.hasOwn(pineGameFace.forms, form), '未知分龄基础脸');
    const next = withGameFace(recipe);
    next.packs[core] = baseFaceRelease;
    next.face.form = form;
    return next;
  }
  function withClothingStudy(recipe) {
    const next = structuredClone(recipe);
    next.packs[core] = clothingStudyRelease;
    delete next.clothingCut;
    clearFigureRatios(next);
    return next;
  }
  function usesClothingCut(recipe) {
    return pinePortraitStyles.hasClothingStudy(recipe.packs[core]) && recipe.clothingCut !== 'original';
  }
  function withFeatureStudy(recipe) {
    const next = withGameFace(recipe);
    next.packs[core] = featureStudyRelease;
    if (!usesClothingCut(recipe)) next.clothingCut = 'original';
    return next;
  }
  function withoutFeatureStudy(recipe) {
    const next = withClothingStudy(recipe);
    if (!usesClothingCut(recipe)) next.packs[core] = baseFaceRelease;
    return next;
  }
  // Existing consumers enumerate PineLooks.shape when constructing a stable recipe.
  const figureRatioRanges = {
    headScale:[.80,1.20,1], crownHeight:[.66,1.18,1],
    trunkLength:[.82,1.28,1], noseLipSpacing:[.76,1.68,1]
  };
  const ratioKeys = Object.keys(figureRatioRanges);
  const restExpressions = { calm:'安静', curious:'好奇', warm:'含笑' };
  const portraitInks = { wash:'柔彩', cel:'明暗块面', line:'勾线' };
  const faceFinishes = { original:'原有画法', 'soft-pixel':'柔和像素脸', storybook:'绘本像素 · 试作', 'storybook-lips':'绘本像素 · 分款鼻唇' };
  function generatedFaceFinish(options, source, base, pin) {
    const ordinary = pin === release && !options.release;
    const current = base === 'adult' ? 'storybook-lips' : 'soft-pixel';
    return options.finish ?? source?.face?.finish ?? (ordinary ? current : undefined);
  }
  function fitRandomInfantChin(doc, source, pinned) {
    const ordinary = pinePortraitStyles.ordinaryInfantChin(doc);
    const fitted = doc.base === 'baby' && doc.packs[core] === infantNoseRelease && portraitStyleOf(doc) === 'animation';
    if (!ordinary && !fitted) {
      if (doc.infantChin === 'round' || doc.packs[core] === release) delete doc.infantChin;
      return;
    }
    if (source?.base === 'baby') {
      if (source.infantChin !== undefined) {
        doc.infantChin = source.infantChin;
        return;
      }
      // Older fitted editions encode this choice in the pack version.
      if (fitted && source.packs[core] !== infantNoseRelease && pinePortraitStyles.hasTailoredFigure(source.packs[core])) {
        if (!pinned) doc.infantChin = pinePortraitStyles.infantChinStyle(source);
        return;
      }
    }
    if (!pinned) doc.infantChin = 'round';
  }
  function withFaceFinish(recipe, finish) {
    const pin = recipe.packs[core];
    requireThat((pin === release || pin === infantNoseRelease) && pinePortraitStyles.portraitStyle(recipe) === 'animation' &&
      typeof finish === 'string' && Object.hasOwn(faceFinishes,finish), '这项面部画法需要普通或分龄立体动画人物');
    const next = structuredClone(recipe);
    next.face ??= {...facePresets.classic.face};
    if (finish === 'original' && pin !== release) delete next.face.finish;
    else next.face.finish = finish;
    if (pin === release && finish === 'original') delete next.infantChin;
    if (finish !== 'original') {
      delete next.portraitInk;
      delete next.faceSurface;
      delete next.spriteMouth;
    }
    return next;
  }
  const garmentFits = {
    top: { tucked:'束入腰头', bloused:'宽身收口', straight:'直落下摆' },
    legs: { tapered:'收脚', straight:'直筒', wide:'阔腿' }
  };
  // The usual fit lives on the garment. Everyday items can also use these
  // sewn variants; ceremonial robes, uniforms and infant sets keep their cut.
  const alternateHems = { oxford:'straight', polo:'straight', tee:'tucked', breton:'tucked', cardigan:'straight' };
  const alternateLegs = { trousers:'tapered', 'cuffed-denim':'wide', cargo:'tapered', pinstripe:'wide' };
  function randomGarmentFit(doc, random) {
    delete doc.garmentFit;
    if (doc.clothingCut || doc.base === 'baby') return;
    const top = alternateHems[doc.parts.top], legs = alternateLegs[doc.parts.bottom];
    if (top && random() < .28) doc.garmentFit = { top };
    if (legs && random() < .30) (doc.garmentFit ??= {}).legs = legs;
  }
  const ageRatios = {
    adult:   { headScale:1.045, crownHeight:.97, trunkLength:1.035, noseLipSpacing:1.46 },
    child:   { headScale:1.015, crownHeight:.91, trunkLength:1.06,  noseLipSpacing:1.25 },
    toddler: { headScale:.99,   crownHeight:.87, trunkLength:1.09,  noseLipSpacing:1.14 },
    baby:    { headScale:.92,   crownHeight:.80, trunkLength:1.17,  noseLipSpacing:1.04 }
  };
  function clearPortraitOptions(doc) {
    if (doc.face) delete doc.face.finish;
    delete doc.infantChin;
    delete doc.infantNose;
    delete doc.portraitInk;
    delete doc.faceSurface;
    delete doc.spriteMouth;
  }
  function clearFigureRatios(doc) {
    clearPortraitOptions(doc);
    for (const key of ratioKeys) delete doc.shape[key];
    if (doc.face) delete doc.face.restExpression;
    delete doc.garmentFit;
    if (doc.clothingCut === 'age') delete doc.clothingCut;
  }
  function fittedFigureRatios(doc) {
    const base = ageRatios[doc.base], form = doc.face?.form ?? doc.anatomyParts?.skull;
    const nose = pinePortraitStyles.noses[doc.face?.nose] || pinePortraitStyles.basicNoses[doc.face?.nose] || pinePortraitStyles.basicNoses.classic;
    const amount = doc.face?.formMix ?? 1;
    const round = value => Math.round(value * 100) / 100;
    const philtrum = base.noseLipSpacing - (doc.portraitInk ? {adult:.22,child:.10,toddler:.04,baby:0}[doc.base] : 0);
    return {
      headScale: round(base.headScale + .17 * (1 - (doc.shape.height ?? 1))),
      crownHeight: round(base.crownHeight + (form === 'long' ? .035 : form === 'round' ? -.018 : 0) * amount),
      trunkLength: round(base.trunkLength + .24 * ((doc.shape.legs ?? 1) - 1)),
      noseLipSpacing: round(philtrum + .38 * (nose[3] - .30) + .06 * (doc.shape.upperLipFullness || 0))
    };
  }
  function withoutExpressionStudy(recipe) {
    const next = structuredClone(recipe);
    clearPortraitOptions(next);
    if (next.face) delete next.face.restExpression;
    delete next.garmentFit;
    if (next.clothingCut === 'age') delete next.clothingCut;
    next.packs[core] = figureRatioRelease;
    return next;
  }
  function withExpressionStudy(recipe) {
    if (pinePortraitStyles.hasGarmentFits(recipe.packs[core])) return withoutGarmentStudy(recipe);
    if (recipe.packs[core] === expressionRelease) return structuredClone(recipe);
    const next = withFigureRatios(recipe);
    next.packs[core] = expressionRelease;
    return next;
  }
  function withGarmentStudy(recipe) {
    if (pinePortraitStyles.hasGarmentFits(recipe.packs[core])) {
      const next = structuredClone(recipe);
      clearPortraitOptions(next);
      next.packs[core] = garmentRelease;
      delete next.clothingCut;
      return next;
    }
    const next = withExpressionStudy(recipe);
    next.packs[core] = garmentRelease;
    delete next.clothingCut;
    const style = pinePortraitStyles.portraitStyle(recipe);
    if (style !== pinePortraitStyles.portraitStyle(next)) next.face = {...next.face, style};
    return next;
  }
  function withFittedPortrait(recipe) {
    const alreadyFitted = recipe.packs[core] === infantNoseRelease;
    const next = alreadyFitted ? structuredClone(recipe) : withGarmentStudy(recipe);
    next.packs[core] = infantNoseRelease;
    next.bodyFinish = 'painted';
    delete next.clothingCut;
    if (!alreadyFitted && recipe.base === 'baby') {
      next.infantNose = 'nursery';
      if (recipe.infantChin) next.infantChin = recipe.infantChin;
    }
    return withFaceFinish(next,recipe.face?.finish || 'soft-pixel');
  }
  function withoutGarmentStudy(recipe) {
    const next = structuredClone(recipe);
    clearPortraitOptions(next);
    next.packs[core] = expressionRelease;
    delete next.garmentFit;
    if (next.clothingCut === 'age') delete next.clothingCut;
    return next;
  }
  function withInfantChin(recipe, edition = infantChinRelease) {
    requireThat(edition === infantChinRelease || edition === chinPadRelease, '未知婴儿下巴版本');
    const next = pinePortraitStyles.hasFacialActing(recipe.packs[core]) ? structuredClone(recipe) : withExpressionStudy(recipe);
    clearPortraitOptions(next);
    if (!pinePortraitStyles.hasGarmentFits(recipe.packs[core]) && usesClothingCut(next)) next.clothingCut = 'age';
    next.packs[core] = edition;
    return next;
  }
  function withoutInfantChin(recipe) {
    if (recipe.clothingCut === 'age') return withoutGarmentStudy(recipe);
    const next = structuredClone(recipe);
    clearPortraitOptions(next);
    next.packs[core] = garmentRelease;
    return next;
  }
  function withInfantChinStyle(recipe, style) {
    requireThat(['original','short','full','round'].includes(style), '未知婴儿下巴造型');
    if (style === 'round') requireThat(recipe.base === 'baby' && portraitStyleOf(recipe) === 'animation', '圆润下巴适用于立体动画婴儿');
    if (pinePortraitStyles.ordinaryInfantChin(recipe) || (style === 'round' && recipe.packs[core] === release)) {
      const next = pinePortraitStyles.ordinaryInfantChin(recipe) ? structuredClone(recipe) : withFaceFinish(recipe,'soft-pixel');
      next.infantChin = style;
      return next;
    }
    if (style === 'round') return {...portraitEdition(recipe),infantChin:style};
    if (recipe.packs[core] !== infantNoseRelease) return style === 'original' ? withoutInfantChin(recipe)
      : withInfantChin(recipe, style === 'short' ? infantChinRelease : chinPadRelease);
    const next = structuredClone(recipe);
    if (style === 'full' && recipe.base !== 'baby') delete next.infantChin;
    else next.infantChin = style;
    return next;
  }
  function portraitEdition(recipe) {
    if (recipe.packs[core] === infantNoseRelease) return structuredClone(recipe);
    const next = withInfantChin(recipe), chin = pinePortraitStyles.infantChinStyle(recipe);
    next.packs[core] = infantNoseRelease;
    if (chin !== 'full' || recipe.infantChin === 'full') next.infantChin = chin;
    return next;
  }
  function withInfantNose(recipe) {
    const next = portraitEdition(recipe);
    next.infantNose = 'nursery';
    return next;
  }
  function withoutInfantNose(recipe) {
    if (recipe.packs[core] !== infantNoseRelease) return structuredClone(recipe);
    if (recipe.portraitInk || recipe.face?.finish || recipe.infantChin === 'round') {
      const next = structuredClone(recipe);
      delete next.infantNose;
      return next;
    }
    const chin = pinePortraitStyles.infantChinStyle(recipe);
    return chin === 'original' ? withoutInfantChin(recipe) : withInfantChin(recipe, chin === 'short' ? infantChinRelease : chinPadRelease);
  }
  function withPortraitInk(recipe, ink) {
    requireThat(Object.hasOwn(portraitInks, ink), '未知像素笔触');
    const next = portraitEdition(recipe);
    next.face = { ...facePresets.classic.face, ...next.face, style:'animation' };
    delete next.face.finish;
    next.portraitInk = ink;
    return next;
  }
  function withoutPortraitInk(recipe) {
    const next = structuredClone(recipe);
    delete next.portraitInk;
    delete next.faceSurface;
    delete next.spriteMouth;
    return next;
  }
  function withFaceSurface(recipe, smallAccent = recipe.faceSurface ? !!recipe.spriteMouth : true, surface = recipe.faceSurface || 'linked') {
    requireThat(typeof smallAccent === 'boolean','小尺寸唇线需要布尔值');
    requireThat(['linked','contour'].includes(surface),'未知口周曲面');
    const next = withPortraitInk(recipe,recipe.portraitInk || 'cel');
    next.faceSurface = surface;
    if (smallAccent) next.spriteMouth = 'accent';
    else delete next.spriteMouth;
    return next;
  }
  function withoutFaceSurface(recipe) {
    const next = structuredClone(recipe);
    delete next.faceSurface;
    delete next.spriteMouth;
    return next;
  }
  function withFigureRatios(recipe) {
    if (pinePortraitStyles.hasFacialActing(recipe.packs[core])) return withoutExpressionStudy(recipe);
    if (recipe.packs[core] === figureRatioRelease) return structuredClone(recipe);
    const next = pinePortraitStyles.hasPaintedFeatures(recipe.packs[core]) ? structuredClone(recipe) : withFeatureStudy(recipe);
    next.packs[core] = figureRatioRelease;
    Object.assign(next.shape, fittedFigureRatios(next));
    return next;
  }
  function withoutFigureRatios(recipe) {
    const next = structuredClone(recipe);
    clearFigureRatios(next);
    next.packs[core] = featureStudyRelease;
    return next;
  }
  function hasRoundedHead(recipe) {
    return releases.indexOf(recipe.packs[core]) > releases.indexOf(hairRelease);
  }
  function hasSculptedHead(recipe) {
    return releases.indexOf(recipe.packs[core]) >= releases.indexOf(sculptRelease);
  }
  function hasMandible(recipe) {
    return releases.indexOf(recipe.packs[core]) >= releases.indexOf(mandibleRelease);
  }
  function hasFacialMorphs(recipe) {
    return releases.indexOf(recipe.packs[core]) >= releases.indexOf(morphRelease);
  }
  function hasInfantHead(recipe) {
    return recipe.base === 'baby' && releases.indexOf(recipe.packs?.[core]) >= releases.indexOf(infantRelease);
  }
  const shape = pineDesignerBody.shapeRanges;
  const morphKeys = Object.keys(pinePortraitStyles.morphs);
  const profileKeys = Object.keys(pinePortraitStyles.profileControls);
  const featureShapeKeys = morphKeys.filter((key) => !key.startsWith('cheek'));
  const optionalShape = ['occiput', 'headDepth', 'faceRelief', ...ratioKeys, ...pineHeadShape.controls, ...morphKeys, ...profileKeys];
  const cheekPresets = {
    balanced: { label: '柔和平衡', shape: {} },
    low: { label: '低颧饱颊', shape: { cheekHeight: -0.75, cheekProjection: -0.35, cheekFullness: 0.72 } },
    broad: { label: '宽颧平缓', shape: { cheekWidth: 0.75, cheekHeight: -0.22, cheekProjection: -0.48, cheekFullness: 0.16 } },
    high: { label: '高颧舒展', shape: { cheekHeight: 0.7, cheekProjection: 0.65, cheekWidth: 0.25, cheekFullness: 0.1 } },
    slim: { label: '窄颊清瘦', shape: { cheekHeight: 0.12, cheekWidth: -0.65, cheekProjection: 0.25, cheekFullness: -0.55 } }
  };
  const requiredShape = Object.keys(shape).filter((key) => !optionalShape.includes(key));
  const jawPresets = {
    natural: { label: '自然短颌', shape: {} },
    soft: {
      label: '柔圆下巴',
      shape: {
        chinHeight: 0.4,
        chinProjection: -0.18,
        chinRoundness: 0.72,
        jawPosition: 0.35,
        jawAngle: 0.15,
        jawNeck: 0.4
      }
    },
    tapered: {
      label: '微尖下巴',
      shape: {
        chinHeight: -0.25,
        chinProjection: 0.24,
        chinRoundness: -0.68,
        jawPosition: 0.4,
        jawAngle: 0.3,
        jawNeck: -0.25
      }
    },
    square: {
      label: '方正下颌',
      shape: {
        chinHeight: 0.05,
        chinProjection: 0.3,
        chinRoundness: 0.68,
        jawPosition: -0.58,
        jawAngle: -0.44,
        jawNeck: -0.32
      }
    }
  };
  const previousBodyRanges = {
    height: [0.9, 1.1],
    shoulders: [0.85, 1.15],
    arms: [0.92, 1.08],
    legs: [0.92, 1.08]
  };
  function usesExtendedShape(sizes) {
    return Object.entries(previousBodyRanges).some(([key, [lo, hi]]) => sizes[key] < lo || sizes[key] > hi);
  }
  const baseNotice = `MIT License

Copyright (c) 2026 zhangran653 and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
  const bodyProfiles = {
    female: { base: 'adult', gender: 'female', label: '女性' },
    male: { base: 'adult', gender: 'male', label: '男性' },
    baby: { base: 'baby', gender: 'unspecified', label: '婴儿' },
    toddler: { base: 'toddler', gender: 'unspecified', label: '幼儿' },
    child: { base: 'child', gender: 'unspecified', label: '儿童' }
  };
  const anatomyParts = {
    skull: { balanced: '标准', long: '修长', round: '圆润', angular: '棱角分明' },
    torso: { balanced: '标准', broad: '宽厚', slender: '纤细' },
    arms: { balanced: '标准', strong: '健壮', slender: '纤细' },
    legs: { balanced: '标准', strong: '健壮', slender: '纤细' }
  };
  function bodyProfileOf(recipe) {
    if (recipe.base !== 'adult') return recipe.base;
    return recipe.gender === 'female' || recipe.gender === 'male' ? recipe.gender : null;
  }
  function clearAdultFaceDetails(face) {
    if (!face) return;
    delete face.facialHair;
    if (face.complexion === 'fine-lines') delete face.complexion;
  }
  function withBodyProfile(recipe, profile) {
    if (!Object.hasOwn(bodyProfiles, profile)) throw new Error('未知的默认体型');
    const { base, gender } = bodyProfiles[profile];
    const next = JSON.parse(JSON.stringify(recipe));
    next.base = base;
    next.gender = gender;
    if (base !== 'baby' && pineInfantHair.styles[next.parts.hair])
      next.parts.hair = pineInfantHair.styles[next.parts.hair].grown;
    if (base !== 'baby' && (recipe.infantChin === 'round' || recipe.packs[core] === release)) delete next.infantChin;
    if (base === 'baby' && recipe.base !== 'baby') {
      next.packs[core] = figurePin(recipe);
      clearAdultFaceDetails(next.face);
      if (next.packs[core] === infantNoseRelease && next.face?.finish) next.infantNose = 'nursery';
      if (pinePortraitStyles.ordinaryInfantChin(next) || (next.packs[core] === infantNoseRelease && portraitStyleOf(next) === 'animation'))
        next.infantChin = 'round';
    } else next.packs[core] = editingRelease(next);
    if (base !== recipe.base && pinePortraitStyles.hasFigureRatios(next.packs[core])) {
      const previous = fittedFigureRatios(recipe), fitted = fittedFigureRatios(next);
      for (const key of ratioKeys) {
        const offset = (recipe.shape[key] ?? previous[key]) - previous[key];
        const [lo, hi] = figureRatioRanges[key];
        next.shape[key] = Math.max(lo, Math.min(hi, Math.round(100 * (fitted[key] + offset)) / 100));
      }
    }
    return next;
  }
  const originalSlots = {
    hair: { crop: '短碎发', bob: '齐耳发', bun: '盘发' },
    top: { jacket: '拉链夹克', pullover: '套头衫' },
    bottom: { shorts: '短裤', trousers: '长裤' },
    shoes: { sneakers: '运动鞋', boots: '短靴' },
    neck: { none: '无', scarf: '方巾' }
  };
  const additionalHair = {
    'shoulder-length': '披肩长发',
    'long-waves': '长波浪',
    'half-up': '半扎长发',
    'twin-braids': '双麻花辫',
    'side-part': '偏分短发'
  };
  const hairColors = {
    墨黑: '#28262c',
    深棕: '#49352f',
    栗棕: '#82513b',
    铜红: '#ad563e',
    蜜金: '#d2a763',
    银灰: '#c1c2c6',
    雾蓝: '#637f9b',
    莓紫: '#895a80',
    乌木黑: '#201e23',
    巧克力: '#624339',
    焦糖棕: '#a36d49',
    栗红: '#893e40',
    亚麻金: '#c9b389',
    浅铂金: '#e8d9ba',
    赤铜: '#be744a',
    浅灰白: '#e0ddd4',
    橄榄灰: '#7f826c',
    烟粉: '#bf8793',
    深靛蓝: '#39445e',
    墨绿: '#416055'
  };
  const colorPresets = {
    skin: {
      冷瓷: '#f6d8ca',
      暖瓷: '#efd2b4',
      淡桃: '#efc4ac',
      米杏: '#e1b798',
      暖沙: '#d6a17c',
      蜜杏: '#ca906c',
      橄榄棕: '#b68b68',
      琥珀棕: '#ab7657',
      古铜: '#93644e',
      红棕: '#855744',
      胡桃: '#714c3f',
      深栗: '#5b4039',
      乌木棕: '#47332f'
    },
    eyes: {
      深棕: '#3e342f',
      茶褐: '#705139',
      琥珀: '#a17d43',
      榛绿: '#77764a',
      苔绿: '#536b55',
      灰绿: '#70857a',
      深蓝: '#40576c',
      湖蓝: '#668b9b',
      雾灰: '#858b8c',
      暖黑: '#29272a'
    },
    lip: {
      裸杏: '#b98470',
      豆沙: '#ad756d',
      玫瑰: '#b96872',
      珊瑚: '#c67a6c',
      砖红: '#a95d52',
      莓果: '#934f61',
      深梅: '#7a4b5b',
      暖棕: '#936852'
    }
  };
  const slots = {
    hair: {
      ...originalSlots.hair,
      ...additionalHair,
      ponytail: '单马尾',
      'twin-tails': '双马尾',
      braid: '编发辫',
      curly: '短卷发'
    },
    top: {
      ...originalSlots.top,
      tee: '短袖 T 恤',
      hoodie: '连帽卫衣',
      cardigan: '针织开衫',
      ...pineWorldWardrobe.tops,
      ...pineWorkshopWear.clothes.top
    },
    bottom: { ...originalSlots.bottom, skirt: '百褶裙', cargo: '工装裤', ...pineWorkshopWear.clothes.bottom },
    shoes: {
      ...originalSlots.shoes,
      'high-tops': '高帮鞋',
      flats: '浅口鞋',
      ...pineWorkshopWear.clothes.shoes
    },
    neck: { ...originalSlots.neck, bow: '领结' }
  };
  const features = {
    eyes: { classic: '自然眼', round: '圆眼', almond: '杏眼', narrow: '细长眼' },
    brows: { classic: '自然眉', straight: '平眉', arched: '弯眉', thick: '浓眉' },
    nose: { classic: '自然鼻', button: '圆鼻头', bridge: '高鼻梁', wide: '宽鼻翼' },
    mouth: { classic: '自然唇', smile: '微笑唇', full: '饱满唇', small: '小巧唇' }
  };
  for (const [slot, options] of Object.entries(pineEverydayStyles.clothes))
    Object.assign(slots[slot], options);
  Object.assign(slots.hair, pineHairStyles.choices);
  const sharedHair = {...slots.hair};
  const archivedHair = Object.keys(sharedHair).filter(id=>!Object.hasOwn(pinePatternWardrobe.hair,id));
  Object.assign(slots.hair, pineInfantHair.choices);
  const hairGroups = {...pineHairStyles.groups};
  for (const id of Object.keys(pineInfantHair.choices)) hairGroups[id]=pineInfantHair.group;
  function hairOptions(base) { return base === 'baby' ? slots.hair : sharedHair; }
  for (const [slot, options] of Object.entries(pinePortraitStyles.features))
    Object.assign(features[slot], options);
  const faceDetails = pinePortraitStyles.details;
  const portraitStyles = pinePortraitStyles.portraitStyles;
  const portraitStyleOf = pinePortraitStyles.portraitStyle;
  function setPortraitStyle(recipe, style) {
    requireThat(typeof style === 'string' && Object.hasOwn(portraitStyles, style), '未知人物画风');
    if (portraitStyleOf(recipe) === style) return recipe;
    recipe.face = { ...(recipe.face || facePresets.classic.face), style };
    if (style !== 'animation') {
      delete recipe.face.finish;
      if (recipe.packs[core] === release || recipe.infantChin === 'round') delete recipe.infantChin;
    }
    recipe.packs[core] = figurePin(recipe);
    return recipe;
  }
  const wearables = { ...pineWorkshopWear.wearables };
  for (const [slot, options] of Object.entries(pineEverydayStyles.wearables))
    wearables[slot] = { ...wearables[slot], ...options };
  for (const [slot, options] of Object.entries(pineWorldWardrobe.wearables))
    wearables[slot] = { ...wearables[slot], ...options };
  const gearColors = { ...pineWorldWardrobe.dyes, ...pineWorkshopWear.dyes, ...pineEverydayStyles.dyes };
  const optionalColors = { ...gearColors, ...pinePortraitStyles.dyes };
  const carriedSlots = Object.keys(wearables).filter((k) => k !== 'phone' && k !== 'laptop');
  const outfitDyes = Object.keys(gearColors).filter((k) => k !== 'device');
  function gearColor(colors, key) {
    if (key === 'charm') return colors.charm || '#bf9a66';
    if (Object.hasOwn(pinePortraitStyles.dyes, key)) return pinePortraitStyles.color(colors, key);
    if (Object.hasOwn(pineEverydayStyles.dyes, key)) return colors[key] || pineEverydayStyles.defaults[key];
    return pineWorkshopWear.color(colors, key);
  }
  function usesCollection({ parts, face, colors }) {
    return (
      Object.hasOwn(pineHairStyles.choices, parts.hair) ||
      Object.entries(pineEverydayStyles.clothes).some(([k, v]) => Object.hasOwn(v, parts[k])) ||
      Object.entries(pineEverydayStyles.wearables).some(([k, v]) => Object.hasOwn(v, parts[k])) ||
      Object.entries(face || {}).some(
        ([k, v]) => Object.hasOwn(faceDetails, k) || Object.hasOwn(pinePortraitStyles.features[k] || {}, v)
      ) ||
      Object.keys(colors).some(
        (k) => Object.hasOwn(pineEverydayStyles.dyes, k) || Object.hasOwn(pinePortraitStyles.dyes, k)
      ) ||
      pineEverydayStyles.hats.some((h) => parts.hat === core + '/' + h.id)
    );
  }
  const facePresets = {
    classic: {
      label: '自然五官',
      face: { eyes: 'classic', brows: 'classic', nose: 'classic', mouth: 'classic' }
    },
    cheerful: { label: '圆眼微笑', face: { eyes: 'round', brows: 'arched', nose: 'button', mouth: 'smile' } },
    almond: {
      label: '平眉杏眼',
      face: { eyes: 'almond', brows: 'straight', nose: 'bridge', mouth: 'small' }
    },
    bold: { label: '浓眉细眼', face: { eyes: 'narrow', brows: 'thick', nose: 'wide', mouth: 'full' } },
    gentle: { label: '弯眉小嘴', face: { eyes: 'round', brows: 'arched', nose: 'classic', mouth: 'small' } }
  };
  for (const [id, label, eyes, brows, nose, mouth] of [
    ['clear', '清朗眉眼', 'monolid', 'tapered', 'straight', 'thin'],
    ['warm', '柔和垂眼', 'downturned', 'willow', 'rounded', 'soft-smile'],
    ['bright', '明亮圆眼', 'doe-eye', 'short-brow', 'short', 'bow'],
    ['sharp', '利落眉峰', 'upturned', 'angled', 'aquiline', 'wide'],
    ['calm', '沉静眉眼', 'hooded', 'low-flat', 'broad', 'relaxed'],
    ['mellow', '舒展长眼', 'long-almond', 'feathered', 'slender', 'lower-full']
  ])
    facePresets[id] = { label, face: { eyes, brows, nose, mouth } };
  for (const [id, label, eyes, brows, nose, mouth, shape] of [
    ['deep-wide', '深眼窝 · 宽鼻翼', 'level-eye', 'feathered', 'straight', 'thin',
      { eyeDepth: 0.75, browHeight: 0.22, noseWidth: 0.8, noseBridge: 0.25 }],
    ['open-soft', '舒展眼睑 · 丰下唇', 'long-almond', 'willow', 'short', 'lower-full',
      { eyeOpening: 0.35, eyeWidth: 0.1, noseBridge: -0.45, lowerLipFullness: 0.65 }],
    ['low-narrow', '低眉 · 窄鼻翼', 'hooded', 'low-flat', 'rounded', 'wide',
      { browHeight: -0.45, eyeTilt: -0.2, noseWidth: -0.7, mouthWidth: 0.28 }],
    ['level-full', '平眼尾 · 丰上唇', 'level-eye', 'tapered', 'broad', 'upper-full',
      { eyeWidth: 0.36, eyeDepth: -0.35, noseBridge: 0.42, upperLipFullness: 0.55 }]
  ]) facePresets[id] = { label, face: { eyes, brows, nose, mouth }, shape };
  const infantFacePresets = {
    'infant-round': { label: '圆眼浅笑', face: { eyes: 'round', brows: 'fine', nose: 'button', mouth: 'soft-smile' } },
    'infant-almond': { label: '杏眼小嘴', face: { eyes: 'almond', brows: 'straight', nose: 'broad', mouth: 'small' } },
    'infant-crescent': { label: '弯眼丰唇', face: { eyes: 'crescent', brows: 'short-brow', nose: 'rounded', mouth: 'lower-full' } }
  };
  function applyFacePreset(recipe, preset) {
    recipe.face = { ...recipe.face, ...preset.face };
    for (const key of featureShapeKeys) delete recipe.shape[key];
    Object.assign(recipe.shape, preset.shape || {});
    recipe.packs[core] = editingRelease(recipe);
    return recipe;
  }
  // Everyday outfits replace clothing. Workshop outfits include a complete set of personal equipment.
  const outfits = {
    track: {
      label: '球场短袖',
      parts: { top: 'tee', bottom: 'shorts', shoes: 'high-tops', neck: 'none' },
      colors: { top: '#4e8c89', bottom: '#435775', shoes: '#dcd4b7', accent: '#eab857' }
    },
    choir: {
      label: '合唱开衫',
      parts: { top: 'cardigan', bottom: 'skirt', shoes: 'flats', neck: 'bow' },
      colors: { top: '#a25749', bottom: '#495c71', shoes: '#684d48', accent: '#dec18c' }
    },
    camp: {
      label: '露营卫衣',
      parts: { top: 'hoodie', bottom: 'cargo', shoes: 'boots', neck: 'none' },
      colors: { top: '#ad7945', bottom: '#536856', shoes: '#685445', accent: '#c7dab1' }
    },
    work: {
      label: '工装夹克',
      parts: { top: 'jacket', bottom: 'cargo', shoes: 'high-tops', neck: 'scarf' },
      colors: { top: '#526e86', bottom: '#77644c', shoes: '#81594f', accent: '#dbac6a' }
    }
  };
  for (const [id, label, top, bottom, shoes, neck, palette] of [
    [
      'commute',
      '通勤西装',
      'blazer',
      'pinstripe',
      'oxfords',
      'tie',
      ['#495967', '#48535f', '#624c42', '#ae6a60']
    ],
    [
      'weekend',
      '海边周末',
      'breton',
      'capris',
      'sandals',
      'none',
      ['#eee6cb', '#8d9a9b', '#aa835e', '#456077']
    ],
    [
      'campus',
      '校园菱格',
      'argyle',
      'plaid-skirt',
      'mary-janes',
      'none',
      ['#946c63', '#657365', '#614947', '#d7c2a0']
    ],
    [
      'relay-track',
      '田径训练',
      'rugby',
      'track-shorts',
      'runners',
      'none',
      ['#537591', '#445e72', '#e6dfcd', '#e8b865']
    ],
    [
      'autumn',
      '秋日风衣',
      'trench',
      'wide-leg',
      'chelsea',
      'winter-scarf',
      ['#bd9e70', '#5d635c', '#57483b', '#ae574c']
    ]
  ])
    outfits[id] = {
      label,
      parts: { top, bottom, shoes, neck },
      colors: { top: palette[0], bottom: palette[1], shoes: palette[2], accent: palette[3] }
    };
  Object.assign(outfits, pineWorkshopWear.outfits);
  function applyOutfit(recipe, outfit) {
    if (Object.hasOwn(outfit.parts, 'hat')) {
      const owner = outfit.parts.hat.split('/')[0];
      const external = owner !== 'none' && owner !== core;
      const pin = external && (outfit.packs?.[owner] || recipe.packs[owner]);
      if (external) requireThat(pin, '穿搭缺少帽子素材包版本');
      const embedded = external && [...(outfit.embeddedPacks || []), ...(recipe.embeddedPacks || [])]
        .find(pack => pack.id === owner && pack.release === pin);
      for (const key of carriedSlots) delete recipe.parts[key];
      for (const key of outfitDyes) delete recipe.colors[key];
      recipe.packs = { [core]: recipe.packs[core] };
      if (external) recipe.packs[owner] = pin;
      if (embedded) recipe.embeddedPacks = [embedded];
      else delete recipe.embeddedPacks;
    }
    Object.assign(recipe.parts, outfit.parts);
    Object.assign(recipe.colors, outfit.colors);
    recipe.packs[core] = editingRelease(recipe);
    return recipe;
  }
  function needsNewCore(parts, face) {
    return (
      face !== undefined ||
      Object.entries(originalSlots).some(([key, values]) => !Object.hasOwn(values, parts[key]))
    );
  }
  function editingRelease(recipe) {
    const pin = recipe.packs[core];
    let needed = originalRelease;
    if ((recipe.infantChin !== undefined && !pinePortraitStyles.ordinaryInfantChin(recipe)) || recipe.infantNose || recipe.portraitInk) needed = infantNoseRelease;
    else if (recipe.garmentFit !== undefined) needed = garmentRelease;
    else if (recipe.face?.restExpression !== undefined) needed = expressionRelease;
    else if (ratioKeys.some(key => recipe.shape[key] !== undefined)) needed = figureRatioRelease;
    else if (recipe.clothingCut !== undefined) needed = featureStudyRelease;
    else if (recipe.bodyFinish !== undefined || recipe.face?.form !== undefined || recipe.face?.formMix !== undefined) needed = gameFaceRelease;
    else if (recipe.anatomyParts !== undefined) needed = structureStudyRelease;
    else if (recipe.face?.finish !== undefined) needed = release;
    else if (recipe.face?.style === 'animation') needed = facePlaneRelease;
    else if (recipe.face?.style !== undefined) needed = illustratedRelease;
    else if (profileKeys.some((key) => (recipe.shape[key] ?? 0) !== 0)) needed = lipJawRelease;
    else if (morphKeys.some((key) => recipe.shape[key] !== undefined && recipe.shape[key] !== 0))
      needed = morphRelease;
    else if (['headDepth', 'faceRelief'].some((key) => recipe.shape[key] !== undefined && recipe.shape[key] !== 1))
      needed = sagittalRelease;
    else if (
      pineHeadShape.controls.some((key) => recipe.shape[key] !== undefined && recipe.shape[key] !== 0) ||
      recipe.identity !== undefined ||
      ['toddler', 'baby'].includes(recipe.base) ||
      Object.hasOwn(pineWorldWardrobe.tops, recipe.parts.top) ||
      Object.entries(pineWorldWardrobe.wearables).some(([key, values]) =>
        Object.hasOwn(values, recipe.parts[key])
      ) ||
      Object.hasOwn(recipe.colors, 'charm') ||
      pineWorldWardrobe.hats.some((h) => recipe.parts.hat === core + '/' + h.id)
    )
      needed = neckRelease;
    else if (recipe.shape.occiput !== undefined && recipe.shape.occiput !== 1) needed = sculptRelease;
    else if (usesCollection(recipe)) needed = collectionRelease;
    else if (pineWorkshopWear.needsRelease(recipe.parts, recipe.colors)) needed = wardrobeRelease;
    else if (Object.hasOwn(additionalHair, recipe.parts.hair)) needed = hairRelease;
    else if (usesExtendedShape(recipe.shape)) needed = proportionRelease;
    else if (recipe.gender !== undefined) needed = profileRelease;
    else if (needsNewCore(recipe.parts, recipe.face)) needed = styleRelease;
    if ((pineCollectionWardrobe.needsCurrentParts(recipe.parts) || Object.hasOwn(pineInfantHair.choices,recipe.parts.hair)) &&
      releases.indexOf(needed) < releases.indexOf(release)) needed = release;
    return releases.indexOf(pin) >= releases.indexOf(needed) ? pin : needed;
  }
  const colors = {
    skin: '肤色',
    hair: '发色',
    eyes: '瞳色',
    top: '上衣',
    bottom: '下装',
    shoes: '鞋色',
    accent: '配饰'
  };
  const inks = ['hatMain', 'hatShade', 'hatLight', 'hatTrim', 'hatInk'];
  const slug = /^[a-z][a-z0-9-]{0,39}$/,
    semver = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})$/;
  const lookId = /^look_[a-z0-9][a-z0-9_-]{0,63}$/;
  const catalog = new Map();
  function requireThat(test, message) {
    if (!test) throw new Error(message);
  }
  function fields(obj, keys, optional = []) {
    requireThat(obj && typeof obj === 'object' && !Array.isArray(obj), '需要一个 JSON 对象');
    requireThat(
      keys.every((k) => Object.hasOwn(obj, k)) &&
        Object.keys(obj).every((k) => keys.includes(k) || optional.includes(k)),
      '字段缺失或含未知字段'
    );
  }
  function short(value, limit) {
    requireThat(
      typeof value === 'string' && value.trim().length && [...value].length <= limit,
      '名称或声明长度无效'
    );
    return value.trim();
  }
  function bounded(n, low, high) {
    requireThat(Number.isFinite(n) && n >= low && n <= high, '数值超出允许范围 ' + low + ' … ' + high);
    return n === 0 ? 0 : n;
  }
  function vector(input, low, high) {
    requireThat(Array.isArray(input) && input.length === 3, '部件坐标需要三个数值');
    return input.map((n) => bounded(n, low, high));
  }
  function manifest(raw) {
    fields(raw, ['format', 'version', 'id', 'release', 'title', 'author', 'license', 'parts'], ['notice']);
    requireThat(
      raw.format === 'pine-parts' &&
        raw.version === 1 &&
        typeof raw.id === 'string' &&
        slug.test(raw.id) &&
        typeof raw.release === 'string' &&
        semver.test(raw.release),
      '未知的部件格式、包名或版本'
    );
    requireThat(
      Array.isArray(raw.parts) && raw.parts.length > 0 && raw.parts.length <= 32,
      '每个包需要 1 至 32 个部件'
    );
    const seen = new Set();
    const parts = raw.parts.map((part) => {
      fields(part, ['id', 'label', 'slot', 'primitives']);
      requireThat(
        typeof part.id === 'string' && slug.test(part.id) && !seen.has(part.id) && part.slot === 'hat',
        '帽饰部件标识重复或无效'
      );
      seen.add(part.id);
      requireThat(
        Array.isArray(part.primitives) && part.primitives.length > 0 && part.primitives.length <= 96,
        '每个帽饰需要 1 至 96 个笔画'
      );
      const primitives = part.primitives.map((p) => {
        fields(p, ['shape', 'center', 'size', 'color'], p.shape === 'ellipsoid' ? ['power'] : []);
        requireThat(['box', 'ellipsoid'].includes(p.shape) && inks.includes(p.color), '未知的笔画或帽饰色槽');
        const entry = {
          shape: p.shape,
          center: vector(p.center, -2, 2),
          size: vector(p.size, 0.005, 2),
          color: p.color
        };
        if (p.power !== undefined) entry.power = bounded(p.power, 2, 6);
        return entry;
      });
      return { id: part.id, label: short(part.label, 60), slot: 'hat', primitives };
    });
    return {
      format: 'pine-parts',
      version: 1,
      id: raw.id,
      release: raw.release,
      title: short(raw.title, 80),
      author: short(raw.author, 160),
      license: short(raw.license, 80),
      ...(raw.notice === undefined ? {} : { notice: short(raw.notice, 8000) }),
      parts
    };
  }
  function install(raw, target = catalog) {
    const pack = manifest(raw),
      key = pack.id + '@' + pack.release,
      old = target.get(key);
    requireThat(pack.id !== core || old, 'pine-core 是保留的部件包');
    requireThat(!old || JSON.stringify(old) === JSON.stringify(pack), '同一包版本已有不同内容 · ' + key);
    target.set(key, pack);
    return pack;
  }
  const sunhat = manifest({
    format: 'pine-parts',
    version: 1,
    id: core,
    release,
    title: '松溪基础部件',
    author: 'zhangran653 and contributors',
    license: 'MIT',
    notice: baseNotice,
    parts: [
      {
        id: 'sunhat',
        label: '圆檐野餐帽',
        slot: 'hat',
        primitives: [
          { shape: 'ellipsoid', center: [0, 0, 0.55], size: [1.38, 1.32, 0.13], color: 'hatShade', power: 3 },
          { shape: 'ellipsoid', center: [0, 0, 0.61], size: [1.37, 1.31, 0.11], color: 'hatLight', power: 3 },
          { shape: 'ellipsoid', center: [0, 0, 0.82], size: [1.03, 1.06, 0.51], color: 'hatMain', power: 3 },
          { shape: 'ellipsoid', center: [0, 0, 0.71], size: [1.055, 1.08, 0.115], color: 'hatTrim', power: 4 }
        ]
      }
    ]
  });
  for (const pin of releases) {
    const parts =
      releases.indexOf(pin) >= releases.indexOf(wardrobeRelease)
        ? [...sunhat.parts, ...pineWorkshopWear.hats]
        : sunhat.parts;
    const hats =
      releases.indexOf(pin) >= releases.indexOf(collectionRelease)
        ? [...parts, ...pineEverydayStyles.hats]
        : parts;
    catalog.set(
      core + '@' + pin,
      manifest({
        ...sunhat,
        release: pin,
        parts: releases.indexOf(pin) >= releases.indexOf(neckRelease) ? [...hats, ...pineWorldWardrobe.hats] : hats
      })
    );
  }
  install({ ...pineCollectionWardrobe.hatPack, notice: baseNotice });
  function prepare(raw, source = catalog) {
    fields(
      raw,
      ['format', 'version', 'id', 'label', 'base', 'packs', 'parts', 'shape', 'colors'],
      ['embeddedPacks', 'baseNotice', 'face', 'gender', 'identity', 'anatomyParts', 'bodyFinish', 'clothingCut', 'garmentFit', 'infantChin', 'infantNose', 'portraitInk', 'faceSurface', 'spriteMouth']
    );
    requireThat(raw.baseNotice === undefined || raw.baseNotice === baseNotice, '基础素材许可声明与版本不符');
    requireThat(
      raw.format === 'pine-character' &&
        raw.version === 1 &&
        typeof raw.id === 'string' &&
        lookId.test(raw.id),
      '角色格式、版本或 ID 无效'
    );
    requireThat(['child', 'adult', 'toddler', 'baby'].includes(raw.base), '不支持的基型');
    let identity;
    if (raw.identity !== undefined) {
      fields(raw.identity, [], ['era', 'role', 'field', 'settings', 'series']);
      identity = {};
      if (raw.identity.era !== undefined) {
        requireThat(Object.hasOwn(PineWorld.realms, raw.identity.era), '未知时代');
        identity.era = raw.identity.era;
      }
      if (raw.identity.role !== undefined) identity.role = short(raw.identity.role, 48);
      if (raw.identity.field !== undefined) {
        requireThat(Object.hasOwn(pineCharacterCollection.fields, raw.identity.field), '未知人物领域');
        identity.field = raw.identity.field;
      }
      if (raw.identity.series !== undefined) {
        requireThat(Object.hasOwn(pineCharacterCollection.series, raw.identity.series), '未知人物系列');
        identity.series = raw.identity.series;
      }
      if (raw.identity.settings !== undefined) {
        const settings = raw.identity.settings;
        requireThat(Array.isArray(settings) && settings.length > 0 && settings.length <= Object.keys(pineCharacterCollection.settings).length &&
          settings.every(id => typeof id === 'string' && Object.hasOwn(pineCharacterCollection.settings,id)) &&
          new Set(settings).size === settings.length, '人物活动场景无效或重复');
        identity.settings = [...settings];
      }
    }
    const label = short(raw.label, 48),
      working = new Map(source);
    fields(raw.shape, requiredShape, optionalShape);
    fields(raw.colors, Object.keys(colors), Object.keys(optionalColors));
    fields(raw.parts, [...Object.keys(slots), 'hat'], Object.keys(wearables));
    const sizes = {},
      palette = {},
      parts = {};
    for (const key of requiredShape) sizes[key] = bounded(raw.shape[key], shape[key][0], shape[key][1]);
    for (const key of optionalShape) {
      if (!Object.hasOwn(raw.shape, key)) continue;
      const [lo, hi, normal] = figureRatioRanges[key] ?? shape[key],
        value = bounded(raw.shape[key], lo, hi);
      if (value !== normal) sizes[key] = value;
    }
    for (const key of [
      ...Object.keys(colors),
      ...Object.keys(optionalColors).filter((k) => Object.hasOwn(raw.colors, k))
    ]) {
      requireThat(
        typeof raw.colors[key] === 'string' && /^#[\da-f]{6}$/i.test(raw.colors[key]),
        '颜色需要六位 RGB · ' + key
      );
      palette[key] = raw.colors[key].toLowerCase();
    }
    for (const [slot, values] of Object.entries(slots)) {
      requireThat(
        typeof raw.parts[slot] === 'string' && Object.hasOwn(values, raw.parts[slot]),
        '未知部件 · ' + slot
      );
      parts[slot] = raw.parts[slot];
    }
    requireThat(Object.hasOwn(hairOptions(raw.base),parts.hair),'这个发型仅适用于婴儿');
    for (const [slot, values] of Object.entries(wearables)) {
      if (!Object.hasOwn(raw.parts, slot)) continue;
      requireThat(
        typeof raw.parts[slot] === 'string' && Object.hasOwn(values, raw.parts[slot]),
        '未知配件 · ' + slot
      );
      parts[slot] = raw.parts[slot];
    }
    parts.hat = raw.parts.hat;
    let owner = core,
      hat;
    if (parts.hat !== 'none') {
      requireThat(
        typeof parts.hat === 'string' &&
          parts.hat.split('/').length === 2 &&
          parts.hat.split('/').every((s) => slug.test(s)),
        '帽饰需要 包名/部件名'
      );
      [owner] = parts.hat.split('/');
    }
    fields(raw.packs, owner === core ? [core] : [core, owner]);
    const pin = raw.packs[core];
    requireThat(releases.includes(pin), '不支持的基础部件版本');
    requireThat(raw.bodyFinish === undefined || raw.bodyFinish === 'painted', '未知身体着色方式');
    requireThat(raw.clothingCut === undefined || (pinePortraitStyles.hasPaintedFeatures(pin) && raw.clothingCut === 'original') ||
      (pinePortraitStyles.hasInfantChin(pin) && raw.clothingCut === 'age'),
      '所选基础部件版本不支持这项衣物剪裁');
    requireThat(raw.infantChin === undefined || ((pin === infantNoseRelease || pinePortraitStyles.ordinaryInfantChin(raw)) &&
      ['original','short','full','round'].includes(raw.infantChin) &&
      (raw.infantChin !== 'round' || (raw.base === 'baby' && portraitStyleOf(raw) === 'animation'))), '此版本不支持选择该婴儿下巴');
    requireThat(raw.infantNose === undefined || (pin === infantNoseRelease && raw.infantNose === 'nursery'), '未知婴儿鼻部造型');
    requireThat(raw.portraitInk === undefined || (pin === infantNoseRelease && typeof raw.portraitInk === 'string' && Object.hasOwn(portraitInks, raw.portraitInk)), '未知像素笔触');
    requireThat(raw.faceSurface === undefined || (raw.portraitInk && ['linked','contour'].includes(raw.faceSurface)), '五官联动曲面需要立绘五官');
    requireThat(raw.spriteMouth === undefined || (raw.faceSurface && raw.spriteMouth === 'accent'), '小尺寸唇线需要联动口周曲面');
    if (raw.garmentFit !== undefined) {
      requireThat(pinePortraitStyles.hasGarmentFits(pin) && raw.clothingCut === undefined, '衣服版型需要启用分款剪裁');
      fields(raw.garmentFit, [], Object.keys(garmentFits));
      for (const [slot, value] of Object.entries(raw.garmentFit))
        requireThat(typeof value === 'string' && Object.hasOwn(garmentFits[slot], value), '未知衣服版型 · ' + slot);
    }
    const required = editingRelease(raw);
    requireThat(pin === required, '所选形象需要 pine-core ' + required);
    let anatomy;
    if (raw.anatomyParts !== undefined) {
      fields(raw.anatomyParts, [], Object.keys(anatomyParts));
      anatomy = {};
      for (const [slot, options] of Object.entries(anatomyParts)) {
        if (!Object.hasOwn(raw.anatomyParts, slot)) continue;
        const value = raw.anatomyParts[slot];
        requireThat(typeof value === 'string' && Object.hasOwn(options, value), '未知人体部件 · ' + slot);
        anatomy[slot] = value;
      }
    }
    const hasProfiles = releases.indexOf(pin) >= releases.indexOf(profileRelease);
    const gender = raw.gender === undefined ? 'unspecified' : raw.gender;
    requireThat(['female', 'male', 'unspecified'].includes(gender), '未知的性别值');
    requireThat(raw.base === 'adult' || gender === 'unspecified', '儿童使用中性体型');
    const pins = { [core]: pin };
    let face;
    if (pin !== originalRelease) {
      const selected = raw.face === undefined ? facePresets.classic.face : raw.face;
      fields(selected, Object.keys(features), [...Object.keys(faceDetails), 'style', 'form', 'formMix', 'restExpression', 'finish']);
      face = {};
      for (const [key, values] of Object.entries({ ...features, ...faceDetails })) {
        if (Object.hasOwn(faceDetails, key) && !Object.hasOwn(selected, key)) continue;
        requireThat(
          typeof selected[key] === 'string' && Object.hasOwn(values, selected[key]),
          '未知五官款式 · ' + key
        );
        face[key] = selected[key];
      }
      if (selected.finish !== undefined) {
        requireThat((pin === release || (pin === infantNoseRelease && !raw.portraitInk && selected.finish !== 'original')) &&
          (selected.style ?? 'animation') === 'animation' && typeof selected.finish === 'string' && Object.hasOwn(faceFinishes,selected.finish), '这项面部画法需要普通或分龄立体动画人物');
        face.finish = selected.finish;
      }
      if (selected.restExpression !== undefined) {
        requireThat(typeof selected.restExpression === 'string' && Object.hasOwn(restExpressions, selected.restExpression), '未知的平时神情');
        face.restExpression = selected.restExpression;
      }
      if (selected.form !== undefined) {
        requireThat(typeof selected.form === 'string' && Object.hasOwn(pineGameFace.forms, selected.form), '未知美术脸型');
        face.form = selected.form;
      }
      if (selected.formMix !== undefined) {
        requireThat(Number.isFinite(selected.formMix) && selected.formMix >= 0 && selected.formMix <= 1,
          '基础脸形变强度应在 0 至 1 之间');
        face.formMix = selected.formMix;
      }
      if (selected.style !== undefined) {
        requireThat(typeof selected.style === 'string' && Object.hasOwn(portraitStyles, selected.style), '未知人物画风');
        face.style = selected.style;
      }
    }
    if (owner !== core) {
      requireThat(
        typeof raw.packs[owner] === 'string' && semver.test(raw.packs[owner]),
        '请指定帽包的准确版本'
      );
      pins[owner] = raw.packs[owner];
    }
    if (raw.embeddedPacks !== undefined) {
      requireThat(
        Array.isArray(raw.embeddedPacks) && raw.embeddedPacks.length <= (owner === core ? 0 : 1),
        '只可内嵌使用中的外部帽包'
      );
      for (const pack of raw.embeddedPacks) {
        requireThat(pack?.id === owner && pack.release === pins[owner], '内嵌部件包与版本引用不符');
        install(pack, working);
      }
    }
    const pack = working.get(owner + '@' + pins[owner]);
    requireThat(pack, '缺少部件包 · ' + owner + '@' + pins[owner]);
    if (parts.hat !== 'none') {
      hat = pack.parts.find((p) => p.id === parts.hat.split('/')[1]);
      requireThat(hat, '帽包中没有此款式 · ' + parts.hat);
    }
    const recipe = {
      format: 'pine-character',
      version: 1,
      id: raw.id,
      label,
      base: raw.base,
      ...(identity ? { identity } : {}),
      ...(hasProfiles ? { gender } : {}),
      packs: pins,
      ...(raw.bodyFinish ? { bodyFinish: raw.bodyFinish } : {}),
      ...(raw.clothingCut ? { clothingCut: raw.clothingCut } : {}),
      ...(raw.infantChin && (raw.infantChin !== 'full' || raw.base === 'baby') ? { infantChin:raw.infantChin } : {}),
      ...(raw.infantNose ? { infantNose:raw.infantNose } : {}),
      ...(raw.portraitInk ? { portraitInk:raw.portraitInk } : {}),
      ...(raw.faceSurface ? { faceSurface:raw.faceSurface } : {}),
      ...(raw.spriteMouth ? { spriteMouth:raw.spriteMouth } : {}),
      ...(raw.garmentFit ? { garmentFit: { ...raw.garmentFit } } : {}),
      ...(anatomy ? { anatomyParts: anatomy } : {}),
      shape: sizes,
      parts,
      ...(face ? { face } : {}),
      colors: palette,
      baseNotice
    };
    // Portable recipes carry only the one external package they actually wear.
    if (owner !== core) recipe.embeddedPacks = [pack];
    return { recipe, hat };
  }
  function paintHat(part) {
    if (!part) return null;
    return (_pose, b, ink, fit) => {
      function fitX(x, h) {
        const mapped = fit.posterior ? fit.posterior.fit(x, h) : x;
        const ear = pineHeadShape.earPlane;
        return fit.hatRearScale && mapped < ear ? ear + (mapped - ear) * fit.hatRearScale : mapped;
      }
      for (const p of part.primitives) {
        const xmin = p.center[0] - p.size[0],
          xmax = p.center[0] + p.size[0];
        const left = fitX(xmin, p.center[2]), right = fitX(xmax, p.center[2]);
        const bottom = fit.crown?.raise(p.center[2] - p.size[2]),
          top = fit.crown?.raise(p.center[2] + p.size[2]);
        const x = fit.x + (fit.posterior ? (left + right) * 0.5 : p.center[0]) * fit.rx,
          y = fit.y + p.center[1] * fit.ry,
          z = fit.z + (fit.crown ? (top + bottom) * 0.5 : p.center[2]) * fit.rz;
        const rx = (fit.posterior ? (right - left) * 0.5 : p.size[0]) * fit.rx,
          ry = p.size[1] * fit.ry,
          rz = (fit.crown ? (top - bottom) * 0.5 : p.size[2]) * fit.rz,
          color = ink[p.color];
        if (p.shape === 'ellipsoid') b.blob(x, y, z, rx, ry, rz, color, p.power);
        else
          b.stamp(x - rx, x + rx, y - ry, y + ry, z - rz, z + rz, (px, py, pz) =>
            Math.abs(px - x) <= rx && Math.abs(py - y) <= ry && Math.abs(pz - z) <= rz ? color : 0
          );
      }
    };
  }
  function build(raw, source) {
    const { recipe, hat } = prepare(raw, source);
    const actor = PineMotion.createCharacter({
      id: recipe.id,
      label: recipe.label,
      ...pineDesignerBody.build(
        recipe,
        paintHat(hat),
        hat?.primitives,
        hasRoundedHead(recipe),
        releases.indexOf(recipe.packs[core]) >= releases.indexOf(strandRelease),
        releases.indexOf(recipe.packs[core]) >= releases.indexOf(contourRelease),
        hasSculptedHead(recipe),
        releases.indexOf(recipe.packs[core]) >= releases.indexOf(volumeRelease),
        releases.indexOf(recipe.packs[core]) >= releases.indexOf(jawRelease)
      )
    });
    actor.recipeId = recipe.id;
    actor.figureRelease = recipe.packs[core];
    actor.gender = recipe.gender ?? 'unspecified';
    return actor;
  }
  function newId() {
    const bytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(bytes);
    return 'look_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  const seeds = [
    [
      'fern',
      '溪谷学童',
      'child',
      ['crop', 'jacket', 'shorts', 'sneakers', 'scarf', 'none'],
      ['#d4946f', '#463831', '#343a38', '#498879', '#54566b', '#b47d4d', '#efba64'],
      {}
    ],
    [
      'maple',
      '枫林信使',
      'child',
      ['bob', 'pullover', 'trousers', 'boots', 'none', 'pine-core/sunhat'],
      ['#a56b50', '#392d38', '#403448', '#b55f44', '#536b70', '#624750', '#edc583'],
      { height: 0.94, faceWidth: 1.11, eyeSpacing: 1.15, jaw: 1.13, mouthHeight: -0.45 }
    ],
    [
      'ridge',
      '山野访客',
      'female',
      ['bun', 'jacket', 'trousers', 'boots', 'scarf', 'none'],
      ['#cc966f', '#493128', '#3c4744', '#586e9e', '#4a585a', '#935c45', '#d99a65'],
      { height: 1.04, shoulders: 1.09, jaw: 0.88 }
    ]
  ];
  const seedWardrobe = seeds.map(([key, label, profile, items, palette, sizes]) => ({
    format: 'pine-character',
    version: 1,
    id: 'look_' + key,
    label,
    base: bodyProfiles[profile].base,
    gender: bodyProfiles[profile].gender,
    packs: { [core]: release },
    shape: { ...Object.fromEntries(requiredShape.map((k) => [k, shape[k][2]])), ...sizes },
    parts: Object.fromEntries([...Object.keys(slots), 'hat'].map((k, i) => [k, items[i]])),
    colors: Object.fromEntries(Object.keys(colors).map((k, i) => [k, palette[i]]))
  }));
  const additions = [
    {
      key: 'chorus',
      label: '合唱队员',
      profile: 'child',
      hair: 'twin-tails',
      face: 'cheerful',
      outfit: 'choir',
      shape: { height: 0.94, eyeSpacing: 1.08, faceWidth: 1.06 },
      skin: '#d69979',
      hairColor: '#533630',
      eyes: '#514137'
    },
    {
      key: 'relay',
      label: '接力跑手',
      profile: 'child',
      hair: 'ponytail',
      face: 'almond',
      outfit: 'track',
      shape: { height: 1.08, legs: 1.05, jaw: 0.94 },
      skin: '#ad765a',
      hairColor: '#422d32',
      eyes: '#3b353a'
    },
    {
      key: 'camper',
      label: '露营领队',
      profile: 'male',
      hair: 'braid',
      face: 'bold',
      outfit: 'camp',
      shape: { height: 1.07, shoulders: 1.08, faceWidth: 1.03 },
      skin: '#b98569',
      hairColor: '#4b352e',
      eyes: '#514533'
    },
    {
      key: 'painter',
      label: '街角画师',
      profile: 'female',
      hair: 'curly',
      face: 'gentle',
      outfit: 'work',
      shape: { height: 0.96, jaw: 0.94 },
      skin: '#985f49',
      hairColor: '#392d33',
      eyes: '#41333c'
    }
  ];
  for (const style of additions) {
    const outfit = outfits[style.outfit],
      seed = seedWardrobe[0];
    seedWardrobe.push({
      ...seed,
      id: 'look_' + style.key,
      label: style.label,
      base: bodyProfiles[style.profile].base,
      gender: bodyProfiles[style.profile].gender,
      packs: { [core]: release },
      shape: { ...seed.shape, ...style.shape },
      parts: { hair: style.hair, ...outfit.parts, hat: 'none' },
      face: { ...facePresets[style.face].face },
      colors: { skin: style.skin, hair: style.hairColor, eyes: style.eyes, ...outfit.colors }
    });
  }
  // Same clothes, neutral pose and 100% height make the two adult silhouettes directly comparable.
  for (const profile of ['female', 'male']) {
    const model = withBodyProfile(seedWardrobe[0], profile);
    seedWardrobe.push({
      ...model,
      id: 'look_body_' + profile,
      label: bodyProfiles[profile].label + '体型样本',
      parts: { ...model.parts, hair: 'crop', top: 'tee', bottom: 'trousers', neck: 'none' },
      colors: { ...model.colors, top: '#59877b', bottom: '#526174', shoes: '#83664d' }
    });
  }
  const workshopProfiles = {
    hiker: ['male', 'crop', 'classic'],
    surveyor: ['female', 'braid', 'almond'],
    mother: ['female', 'bun', 'gentle'],
    child: ['child', 'crop', 'cheerful'],
    toddler: ['toddler', 'curly', 'cheerful'],
    baby: ['baby', 'crop', 'infant-round']
  };
  for (const [id, outfit] of Object.entries(pineWorkshopWear.outfits)) {
    const [profile, hair, face] = workshopProfiles[id];
    const model = withBodyProfile(seedWardrobe[0], profile);
    model.id = 'look_workshop_' + id;
    model.label = outfit.label;
    model.parts.hair = hair;
    model.face = { ...(infantFacePresets[face] || facePresets[face]).face };
    const palettes = {
      hiker: ['dc9a70', '493a39', '2a333a'],
      surveyor: ['c88a66', '393139', '674f3d'],
      mother: ['cf916c', '3e3036', '674a3d'],
      child: ['cf916c', '443335', '674a3d'],
      toddler: ['cf916c', '3e3036', '674a3d'],
      baby: ['d89f82', '3e3036', '674a3d']
    };
    const [skin, hairDye, eye] = palettes[id];
    Object.assign(model.colors, { skin: '#' + skin, hair: '#' + hairDye, eyes: '#' + eye });
    seedWardrobe.push(applyOutfit(model, outfit));
  }
  // The two turnaround sitters are ordinary editable recipes. Their colours,
  // clothes and individual features may also be used by any other character.
  for (const [id, label, profile, parts, face, shape, dyes] of [
    ['chestnut', '小栗 · 针织帽宝宝', 'baby',
      { hair: 'curly', hat: 'pine-core/cotton-cap', top: 'pullover', bottom: 'knee-pants', shoes: 'soft-booties' },
      { eyes: 'round', brows: 'fine', nose: 'rounded', mouth: 'soft-smile', outline: 'round' },
      { eyeSpacing: 0.94, eyeOpening: 0.09, browHeight: 0.53, noseWidth: 0.23, chinProjection: 0.06, jawDefinition: -0.32 },
      { skin: '#a66b48', hair: '#3b2924', eyes: '#523527', hat: '#dfcbaa' }],
    ['hazel', '阿榛 · 银发画师', 'female',
      { hair: 'top-knot', hat: 'none', top: 'tee', bottom: 'trousers', shoes: 'flats' },
      { eyes: 'almond', brows: 'arched', nose: 'rounded', mouth: 'soft-smile', outline: 'oval' },
      { faceWidth: 1.01, jaw: 0.98, eyeSpacing: 0.94, eyeOpening: 0.15, browHeight: 0.36, noseWidth: 0.13, lowerLipFullness: 0.14 },
      { skin: '#af7450', hair: '#aea097', eyes: '#493328', brow: '#533a31' }]
  ]) {
    const model = withBodyProfile(seedWardrobe[0], profile);
    model.id = 'look_' + id;
    model.label = label;
    model.face = { ...face, style: 'animation' };
    model.shape = { ...model.shape, height: 1, shoulders: 1, jaw: 1, faceWidth: 1, ...shape };
    Object.assign(model.parts, parts, { neck: 'none' });
    Object.assign(model.colors, dyes, { top: '#527875', bottom: '#565b66', accent: '#87a8a0' });
    model.packs[core] = release;
    seedWardrobe.push(model);
  }
  for (const [id, label, body, hair, faceId, outfit, details, gear, dyes] of [
    [
      'reader',
      '书店店员',
      'female',
      'french-bob',
      'warm',
      'commute',
      { outline: 'oval', complexion: 'freckles' },
      { glasses: 'oval', brooch: 'rosette' },
      { hair: '#644438', top: '#617970', accent: '#c9a887' }
    ],
    [
      'musician',
      '周末乐手',
      'male',
      'tapered-coils',
      'calm',
      'weekend',
      { outline: 'square', facialHair: 'goatee', iris: 'amber' },
      { audio: 'headphones', wrist: 'beads' },
      { skin: '#976954', hair: '#352b2a' }
    ],
    [
      'runner',
      '田径少年',
      'child',
      'space-buns',
      'bright',
      'relay-track',
      { outline: 'round', complexion: 'sunspots' },
      { hairAccessory: 'clips', bag: 'hip-pack' },
      { hair: '#573b35', top: '#4f8093' }
    ],
    [
      'florist',
      '花店花艺师',
      'female',
      'crown-braid',
      'mellow',
      'campus',
      { outline: 'heart', makeup: 'blush' },
      { ears: 'pearl', hairAccessory: 'flower' },
      { hair: '#8b634b', top: '#9a706d' }
    ],
    [
      'walker',
      '街头摄影师',
      'male',
      'slick-back',
      'sharp',
      'autumn',
      { outline: 'diamond', facialHair: 'stubble' },
      { bag: 'camera', glasses: 'browline' },
      { hair: '#443b37', skin: '#bb8564' }
    ],
    [
      'gardener',
      '社区园丁',
      'female',
      'low-bun',
      'warm',
      'camp',
      { outline: 'pear', complexion: 'fine-lines' },
      { top: 'oxford', audio: 'hearing-aid', bag: 'messenger' },
      { hair: '#bab1a6', skin: '#c29577', top: '#8f9c71', audio: '#aa8d71' }
    ]
  ]) {
    const model = withBodyProfile(seedWardrobe[0], body);
    model.id = 'look_style_' + id;
    model.label = label;
    model.parts.hair = hair;
    model.face = { ...facePresets[faceId].face, ...details };
    applyOutfit(model, outfits[outfit]);
    Object.assign(model.parts, gear);
    Object.assign(model.colors, dyes);
    seedWardrobe.push(model);
  }
  const skinDyes = Object.values(colorPresets.skin);
  const hairDyes = ['#493634', '#352e35', '#69513e', '#443438', '#554238', '#453b39'];
  const faceKeys = Object.keys(facePresets), cheekChoices = Object.values(cheekPresets);
  let n = 0;
  for (const [era, rows] of Object.entries(pineWorldWardrobe.roster)) {
    for (const [key, label, profile, hair, top, bottom, shoes, cloth, trim, gear] of rows) {
      const doc = withBodyProfile(seedWardrobe[0], profile);
      doc.id = 'look_' + key;
      doc.label = label;
      doc.identity = { era, role: label };
      doc.parts = { hair, top, bottom, shoes, neck: 'none', hat: 'none', ...gear };
      doc.shape = {
        ...doc.shape,
        ...cheekChoices[(n + Math.floor(n / faceKeys.length)) % cheekChoices.length].shape,
        height: [1, 0.98, 1.035, 0.96, 1.02][n % 5],
        faceWidth: [1.01, 0.97, 1.05][n % 3]
      };
      applyFacePreset(doc, facePresets[faceKeys[n % faceKeys.length]]);
      Object.assign(doc.colors, {
        skin: skinDyes[(5 * n + 3) % skinDyes.length],
        hair: hairDyes[n % 6],
        top: '#' + cloth,
        accent: '#' + trim,
        bottom: ['#494f60', '#586068', '#535660', '#664e52'][n % 4],
        shoes: ['#654e43', '#52454a', '#716052'][n % 3]
      });
      if (doc.parts.hat !== 'none')
        doc.colors.hat =
          top === 'chef-coat'
            ? '#e6e0cc'
            : doc.parts.hat.endsWith('hardhat')
              ? '#e8b751'
              : era === 'historic'
                ? '#9a825e'
                : '#736d8a';
      if (gear.charm)
        doc.colors.charm = gear.charm === 'jade' ? '#93bda0' : gear.charm === 'vial' ? '#8cc1c2' : '#d7b26c';
      seedWardrobe.push(doc);
      n++;
    }
  }
  // These original recipes also define the deterministic random wardrobe and historical studies.
  const archivedTemplates = new Map(seedWardrobe.map(doc => [doc.id,doc]));
  const neutralShape = Object.fromEntries(requiredShape.map(key => [key,shape[key][2]]));
  const templates = [...seedWardrobe, ...pineCharacterCollection.sources].map(source => {
    const doc = pineCharacterCollection.assemble(source,core,infantNoseRelease,neutralShape);
    const ratios = fittedFigureRatios(doc);
    // At game size, a little more room for the eyes and mouth keeps the faces readable.
    if (doc.base === 'adult') {
      ratios.headScale = Math.round((ratios.headScale + .09) * 100) / 100;
      ratios.noseLipSpacing = Math.round((ratios.noseLipSpacing - .10) * 100) / 100;
    } else if (doc.base === 'child') ratios.headScale = Math.round((ratios.headScale + .05) * 100) / 100;
    // Actors can have individually drawn crown heights and nose-to-lip spacing.
    for (const [key, value] of Object.entries(ratios)) doc.shape[key] ??= value;
    return doc;
  });
  const templateById = new Map(templates.map((doc) => [doc.id, doc]));
  function outfitFrom(doc,label=doc.label) {
    const outfit = {label, parts:{}, colors:{}};
    const owner = doc.parts.hat.split('/')[0];
    if (owner !== 'none' && owner !== core) {
      outfit.packs = { [owner]:doc.packs[owner] };
      const pack=doc.embeddedPacks?.find(p=>p.id===owner && p.release===doc.packs[owner]);
      if(pack) outfit.embeddedPacks=[structuredClone(pack)];
    }
    for (const part of ['top','bottom','shoes','neck','hat',...carriedSlots])
      if (doc.parts[part]) outfit.parts[part]=doc.parts[part];
    for (const dye of ['top','bottom','shoes','accent',...outfitDyes])
      if (doc.colors[dye]) outfit.colors[dye]=doc.colors[dye];
    return outfit;
  }
  // A roll borrows only the authored costume. The facial generator receives
  // its own age and edition, even when the costume donor uses a newer study.
  const catalogueWardrobes={adult:[],child:[],toddler:[],baby:[]};
  for (const {format,version,id,label,base,identity,packs,parts,colors} of templates)
    catalogueWardrobes[base].push({format,version,id,label,base,identity,packs,parts,colors});
  const collectionOutfits = {};
  for (const [id,label] of Object.entries({
    kiln_potter:'陶房围裙', harbour_pilot:'港湾水手服', woodblock_printer:'年画坊对襟衫',
    moth_keeper:'夜林灯蛾斗篷', lunar_geologist:'月面勘测服', dawn_baby:'晨光小棉衣'
  })) collectionOutfits[id]=outfitFrom(templateById.get('look_'+id),label);
  Object.assign(outfits,collectionOutfits);
  const pick = (items, random) => items[Math.floor(random() * items.length)];
  function between(min, max, random) {
    return Math.round(100 * (min + (max - min) * random())) / 100;
  }
  const eyePairings = { ...facePresets };
  for (const [eyes, brows] of [['double-lid', 'fine'], ['deep-set', 'arched'], ['crescent', 'lifted'],
    ['sleepy', 'descending'], ['soft-oval', 'brow-slit']]) eyePairings[eyes] = { face: { eyes, brows } };
  const eyePairs = Object.values(eyePairings);
  const nosePairs = [
    ...Object.values(facePresets),
    { face: { nose: 'long', mouth: 'thin' } }, { face: { nose: 'upturned', mouth: 'pursed' } }
  ];
  const infantEyes = [
    ['round', 'short-brow'], ['soft-oval', 'fine'], ['level-eye', 'classic'],
    ['almond', 'tapered'], ['monolid', 'short-brow'], ['crescent', 'straight'], ['doe-eye', 'fine']
  ].map(([eyes, brows]) => ({ face: { eyes, brows } }));
  const infantNoses = [
    ['button', 'small'], ['short', 'relaxed'], ['rounded', 'bow'], ['classic', 'soft-smile'],
    ['wide', 'lower-full'], ['broad', 'small'], ['upturned', 'classic']
  ].map(([nose, mouth]) => ({ face: { nose, mouth } }));
  // Each family couples silhouette, expression and soft tissue. Colors and body
  // profiles are selected separately, so every family works on every complexion.
  const portraitFamilies = {
    dawn: { label: '柔和杏眼', eyes: ['almond', 'warm', 'open-soft', 'classic', 'double-lid'], youngEyes: ['almond', 'soft-oval', 'doe-eye'],
      noses: ['warm', 'mellow', 'gentle', 'open-soft', 'level-full', 'clear'], outlines: ['oval', 'heart', 'pear'],
      shape: { cheekHeight: -0.54, cheekFullness: 0.09, eyeOpening: 0.14, chinRoundness: 0.28, jawDefinition: -0.12 } },
    ranger: { label: '清朗长眼', eyes: ['clear', 'mellow', 'level-full', 'almond'], youngEyes: ['level-eye', 'monolid', 'almond'],
      noses: ['clear', 'sharp', 'deep-wide', 'classic', 'warm', 'bold'], outlines: ['oval', 'long', 'square'],
      shape: { cheekHeight: 0.15, cheekProjection: -0.10, eyeTilt: 0.07, chinProjection: 0.08, jawDefinition: 0.20 } },
    lark: { label: '明快圆眼', eyes: ['bright', 'cheerful', 'gentle', 'level-full', 'soft-oval'], youngEyes: ['round', 'doe-eye', 'soft-oval'],
      noses: ['bright', 'cheerful', 'open-soft', 'calm', 'almond', 'mellow'], outlines: ['round', 'heart', 'oval'],
      shape: { cheekHeight: -0.31, cheekFullness: 0.12, eyeOpening: 0.18, chinHeight: 0.17, chinRoundness: 0.45 } },
    ember: { label: '英气眉峰', eyes: ['sharp', 'clear', 'bold', 'deep-wide', 'deep-set'], youngEyes: ['almond', 'level-eye', 'crescent'],
      noses: ['calm', 'almond', 'sharp', 'level-full', 'bright', 'clear'], outlines: ['square', 'diamond', 'oval'],
      shape: { cheekHeight: 0.24, cheekFullness: -0.14, browHeight: 0.14, chinRoundness: -0.15, jawDefinition: 0.24 } },
    sage: { label: '沉静柔眉', eyes: ['calm', 'classic', 'deep-wide', 'mellow'], youngEyes: ['monolid', 'soft-oval', 'level-eye'],
      noses: ['level-full', 'low-narrow', 'warm', 'classic', 'clear', 'bright'], outlines: ['pear', 'oval', 'square'],
      shape: { cheekHeight: -0.57, cheekFullness: -0.12, eyeDepth: 0.17, mouthWidth: 0.08, chinRoundness: 0.22 } },
    breeze: { label: '舒展浅笑', eyes: ['warm', 'open-soft', 'almond', 'bright', 'crescent'], youngEyes: ['crescent', 'almond', 'round'],
      noses: ['cheerful', 'warm', 'bold', 'mellow', 'open-soft', 'classic'], outlines: ['heart', 'oval', 'round'],
      shape: { cheekHeight: -0.20, cheekProjection: -0.24, eyeWidth: 0.09, lowerLipFullness: 0.16, jawDefinition: 0.06 } }
  };
  const familyIds = Object.keys(portraitFamilies);
  // Form, brow rhythm and mouth opening form a silhouette together. The ink,
  // hair mass, dyes and clothes are separate draws.
  const portraitCompositions = {
    dawn:   { forms:['balanced','round','long'], brows:['tapered','fine','arched'], mouths:['bow','lower-full','soft-smile'], rests:['warm','calm'], width:-.035, opening:.12, lip:-.12 },
    ranger: { forms:['long','angular'], brows:['straight','thick','tapered'], mouths:['wide','thin','relaxed'], rests:['curious','calm'], width:-.055, opening:-.14, lip:.21 },
    lark:   { forms:['round','balanced'], brows:['short-brow','lifted','arched'], mouths:['small','smile','bow'], rests:['curious','warm'], width:.018, opening:.29, lip:-.21 },
    ember:  { forms:['angular','balanced'], brows:['thick','lifted','straight'], mouths:['wide','upper-full','classic'], rests:['calm','curious'], width:-.008, opening:-.10, lip:.13 },
    sage:   { forms:['balanced','angular','long'], brows:['descending','fine','straight'], mouths:['relaxed','lower-full','thin'], rests:['calm','warm'], width:-.045, opening:-.24, lip:-.07 },
    breeze: { forms:['round','long'], brows:['fine','short-brow','tapered'], mouths:['soft-smile','smile','wide'], rests:['warm','curious'], width:.004, opening:.05, lip:.22 }
  };
  const expressionMouths = {
    calm:['classic','relaxed','thin','wide','upper-full','lower-full','bow','pursed'],
    curious:['soft-smile','relaxed','classic','bow','lower-full','small'],
    warm:['soft-smile','smile','bow','lower-full','wide']
  };
  function fitPaintedMouth(doc) {
    const s = doc.shape, name = doc.face.mouth;
    const fit = pinePortraitStyles.proportionsFor(doc.base,'animation',infantNoseRelease);
    const half = (pinePortraitStyles.mouths[name]?.[1] ?? ({small:.184,full:.303,smile:.309}[name] ?? .263)) * fit.lipWidth;
    const eyes = fit.eyeCenter * s.eyeSpacing * (doc.base === 'baby' ? .91 : .94);
    const width = half*(1+.27*s.mouthWidth);
    const young = doc.base === 'baby' || doc.base === 'toddler';
    const fitted = Math.max(eyes*(young ? .39 : name === 'small' || name === 'pursed' ? .50 : .53),
      Math.min(eyes*(doc.face.restExpression === 'warm' ? .78 : .72), width));
    s.mouthWidth = Math.round(100*Math.max(-1,Math.min(1,(fitted/half-1)/.27)))/100;
  }
  const naturalHairDyes = ['墨黑', '深棕', '栗棕', '铜红', '蜜金', '银灰', '乌木黑', '巧克力',
    '焦糖棕', '栗红', '亚麻金', '浅铂金', '赤铜', '浅灰白'].map((name) => hairColors[name]);
  const legacyBabyHair = ['bald', 'crop', 'curly', 'crew'];
  const babyHair = [...legacyBabyHair,...Object.keys(pineInfantHair.choices)];
  const profileDraws = ['female', 'male', 'child', 'female', 'male', 'toddler', 'female', 'male', 'child', 'baby'];
  const bodySizes = ['height', 'shoulders', 'arms', 'legs'];

  function generationOptions(input) {
    if (typeof input === 'function') return { random: input };
    if (input?.seed === undefined) return input || {};
    const { seed } = input;
    requireThat(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff && input.random === undefined,
      '种子必须是 32 位无符号整数，且不能同时指定 random');
    let state = seed;
    // SplitMix32 avalanches neighboring seeds before the first wardrobe/age draw.
    return { ...input, random() {
      state = (state + 0x9e3779b9) >>> 0;
      let value = Math.imul(state ^ (state >>> 16), 0x21f0aaad);
      value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
      return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
    } };
  }
  const figureProportions = [
    // Stature, shoulder span, arm reach and leg length share the same rig units.
    [0.92, 1.08, 0.95, 0.94], [1.04, 0.96, 1.07, 1.10], [1.07, 1.12, 1.04, 1.03],
    [0.94, 0.94, 1.01, 1.04], [1.03, 1.04, 0.99, 0.94], [1, 1, 1, 1]
  ];
  function fitBodyProportions(doc, random) {
    const scale = { adult: 1, child: 0.83, toddler: 0.68, baby: 0.50 }[doc.base];
    const proportions = pick(figureProportions, random);
    for (const [i, key] of bodySizes.entries()) {
      const variation = (random() + random() - 1) * (key === 'height' ? 0.08 : 0.042);
      doc.shape[key] = Math.round(100 * (1 + scale * (proportions[i] - 1 + variation))) / 100;
    }
  }

  // Each cut can use several existing authored tops, bottoms and shoes. Infant
  // feet keep soft booties; the same dyes work across ages and complexions.
  const clothingCuts = {
    shirt: [['oxford', 'polo', 'knit-vest'], ['trousers', 'cuffed-denim', 'wide-leg'], ['loafers', 'canvas-shoes', 'flats']],
    field: [['denim-jacket', 'field-jacket', 'trail-shell'], ['cargo', 'cuffed-denim', 'shorts'], ['trail-boots', 'canvas-shoes', 'chelsea']],
    knits: [['cardigan', 'pullover', 'breton'], ['trousers', 'capris', 'wide-leg', 'skirt'], ['mary-janes', 'flats', 'canvas-shoes']],
    active: [['hoodie', 'tee', 'rain-anorak'], ['joggers', 'track-shorts', 'knee-pants'], ['runners', 'sneakers', 'strap-sneakers']],
    play: [['sailor-knit', 'tee', 'snap-knit'], ['bib-overalls', 'shorts', 'knee-pants'], ['strap-sneakers', 'canvas-shoes']],
    nursery: [['snap-knit', 'sailor-knit', 'pullover'], ['knee-pants', 'bib-overalls', 'shorts'], ['soft-booties']]
  };
  const cutsByAge = {
    adult: ['shirt', 'field', 'knits', 'active'], child: ['shirt', 'play', 'knits', 'active', 'field'],
    toddler: ['play', 'knits', 'active'], baby: ['nursery']
  };
  // A complete outfit determines how much room the clothes need at the lap and
  // which hats can accompany it. All entries are ordinary editable catalog parts.
  const youngWardrobes = {
    baby: [
      { pieces:[['snap-knit','pullover','breton'],['knee-pants','joggers'],['soft-booties']], capChance:.08 },
      { pieces:[['tee','snap-knit','sailor-knit'],['bib-overalls','shorts'],['soft-booties']], capChance:.12 },
      { pieces:[['cardigan','breton','sailor-knit'],['capris','knee-pants','trousers'],['soft-booties']], capChance:.35 }
    ],
    toddler: [
      { pieces:clothingCuts.play }, { pieces:clothingCuts.knits }, { pieces:clothingCuts.active },
      { pieces:clothingCuts.play, hat:'sunhat' }, { pieces:clothingCuts.knits, hat:'cotton-cap' }
    ]
  };
  const outfitPalettes = [
    ['#698d85', '#55485a', '#8e624c', '#d6b877'], ['#967253', '#455766', '#584b49', '#b5c5a9'],
    ['#d6c4a0', '#6e5563', '#85624f', '#698b87'], ['#56758e', '#827366', '#43525a', '#d2a76a'],
    ['#ad7365', '#506768', '#d8c7a9', '#e6c89a'], ['#4d6268', '#a4967e', '#69574b', '#c9876a'],
    ['#926c93', '#494a63', '#c1b3b8', '#b1bd8c'], ['#965151', '#c3b79f', '#4b4d5c', '#e9cf94'],
    ['#9ab6bf', '#454f64', '#e1d6c0', '#c38d72'], ['#c89945', '#415d62', '#776050', '#ece0c0']
  ];
  const toddlerHair = ['crop', 'curly', 'bob', 'pixie', 'twin-tails', 'side-part', 'tapered-coils', 'french-bob', 'crew'];
  // Leave headroom for crowns and brims; low braids and long side lengths still fit.
  const brimHair = new Set(['crop', 'crew', 'fade', 'buzz', 'bald', 'pixie', 'bob', 'side-part', 'curly',
    'braid', 'twin-braids', 'low-bun', 'shoulder-length', 'lob', 'box-braids', 'locs', 'french-bob', ...Object.keys(pineInfantHair.choices)]);
  function tailoredOutfit(donor, lockedHair, random, sewn) {
    // Retain complete specialist outfits (and their matching equipment) among everyday looks.
    const keepDonor = random() < (donor.base === 'adult' ? 0.42 : 0.22);
    if (keepDonor && (donor.parts.hat === 'none' || !lockedHair || brimHair.has(lockedHair))) return donor;
    const choices = sewn && youngWardrobes[donor.base];
    const wardrobe = choices && pick(choices,random);
    const cut = wardrobe ? wardrobe.pieces : clothingCuts[pick(cutsByAge[donor.base], random)];
    const [top, bottom, shoes] = cut.map(options => pick(options, random));
    const [shirt, pants, shoe, accent] = pick(outfitPalettes, random);
    const cotton = donor.base === 'baby' && random() < (wardrobe?.capChance ?? .28);
    const accessory = cotton ? 'cotton-cap' : wardrobe?.hat;
    const hat = accessory && (!lockedHair || brimHair.has(lockedHair)) ? core+'/'+accessory : 'none';
    const casual = { ...donor, packs: { [core]: tailoredRelease }, parts: { hair: donor.parts.hair, top, bottom, shoes, neck: 'none', hat },
      colors: { skin: donor.colors.skin, hair: donor.colors.hair, eyes: donor.colors.eyes,
        top: shirt, bottom: pants, shoes: shoe, accent, ...(hat !== 'none' && { hat: accent }) } };
    delete casual.identity;
    delete casual.embeddedPacks;
    return casual;
  }
  const hairSilhouettes = [
    ['crop','crew','pixie','buzz','fade','bald','undercut'],
    ['side-part','quiff','slick-back','mullet','wolf'],
    ['bob','french-bob','angled-bob','lob','hime'],
    ['shoulder-length','long-waves','half-up','curtain','waist-length','beach-waves'],
    ['curly','tapered-coils','afro','curly-lob'],
    ['bun','low-bun','top-knot','crown-braid','space-buns'],
    ['ponytail','twin-tails','low-pony','side-pony','braid','twin-braids','fishtail','bubble-pony','box-braids','locs']
  ];
  const expandedHairSilhouettes=hairSilhouettes.map((ids,i)=>[...ids,...[
    ['feather-crop','page-crop','brushed-crop'], [], ['petal-bob','swing-bob'], ['shoulder-shag','cascade-part'],
    ['ripple-lob','willow-wave','cloud-puffs'], ['looped-knot'], ['ribbon-fall','side-loop','loop-braid','ribbon-plait','temple-braids']
  ][i]]);
  function randomHair(base, hat, tailored, random, ink, previousHair, currentPool) {
    if (base==='baby' && currentPool) {
      const pool=hat==='none' ? babyHair : ['bald','crop','baby-sweep','baby-cloud','baby-whorl'];
      const available=pool.filter(id=>id!==previousHair);
      return pick(available,random);
    }
    let choices = base === 'baby' ? legacyBabyHair : currentPool ? Object.keys(sharedHair) : archivedHair;
    if ((tailored || currentPool) && base === 'toddler') choices = toddlerHair;
    if (tailored && hat !== 'none') choices = choices.filter(id => brimHair.has(id));
    if (ink) {
      const groups = (currentPool ? expandedHairSilhouettes : hairSilhouettes).filter(group => group.some(id => choices.includes(id)));
      const available = groups.filter(group => !group.includes(previousHair));
      choices = pick(available.length ? available : groups, random).filter(id => choices.includes(id));
    }
    return pick(choices, random);
  }
  function seededLookId(doc, seed) {
    // Keep replayed JSON stable, and distinguish two differently locked or styled
    // looks generated from the same seed before either is saved to the wardrobe.
    const { id, label, ...appearance } = doc;
    let hash = 2166136261;
    for (const c of JSON.stringify(appearance)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    return 'look_s' + seed.toString(16).padStart(8, '0') + '_' + (hash >>> 0).toString(16).padStart(8, '0');
  }
  // The outline and jaw already supply some of the width at mouth level. Leave room
  // for them before adding soft tissue below a low-set cheekbone.
  function cheekAdjustment(recipe, style = 'soft') {
    const s = recipe.shape;
    const outline = pinePortraitStyles.outlines[recipe.face?.outline];
    const infant = hasInfantHead(recipe);
    const breadth = (h) => pinePortraitStyles.jawBreadth(outline, s.jaw ?? 1, h,
      infant ? pinePortraitStyles.proportions.baby.outlineStrength : 1);
    const lowerWidth = Math.max(0, breadth(-0.46) - breadth(-0.15));
    const low = Math.max(0, -(s.cheekHeight || 0));
    const projection = s.cheekProjection || 0;
    const fullness = s.cheekFullness || 0;
    const limit = style === 'soft' ? 0.06 : style === 'expressive' ? 0.38 : 0.27;
    const extraDepth = Math.max(0, projection) + Math.max(0, (s.faceRelief ?? 1) - 1);
    const maxFullness = limit - 1.75 * lowerWidth - low * (0.19 + 0.16 * extraDepth);
    const changes = {};
    if (fullness > maxFullness) changes.cheekFullness = Math.floor(100 * maxFullness) / 100;
    if (low > 0) {
      const maxProjection = 1 - low * (style === 'expressive' ? 0.82 : 0.99) - 1.2 * lowerWidth;
      if (projection > maxProjection) changes.cheekProjection = Math.floor(100 * maxProjection) / 100;
    }
    return changes;
  }
  // Limit the generated pigment footprints in head radii, using the painter's selected feature styles.
  function fitRandomFace(doc, baseLipLift = 0) {
    const { eyes, brows, nose, mouth, outline } = doc.face, s = doc.shape;
    const style = portraitStyleOf(doc), illustrated = style !== 'natural';
    const fit = pinePortraitStyles.proportionsFor(doc.base, style, doc.packs[core]);
    const drawn = illustrated && pinePortraitStyles.illustratedEyeShape(eyes, style, doc.base === 'baby');
    const eye = pinePortraitStyles.eyes[eyes], brow = illustrated ? pinePortraitStyles.illustratedBrow(brows, style, doc.base === 'baby') : pinePortraitStyles.brows[brows];
    const eyeHalf = drawn ? drawn.width : eye?.[1] ?? ({ round: 0.24, almond: 0.272 }[eyes] || 0.251);
    const upperLid = drawn ? drawn.up + Math.max(drawn.lash * 0.52, drawn.lidRise || 0, drawn.crease && drawn.crease + 0.011)
      : eye ? eye[2] + Math.max(0.021, eye[6] + 0.014)
      : ({ round: 0.135, narrow: 0.061 }[eyes] || 0.101) + 0.025;
    const browBase = brow
      ? brow[2] + brow[3] * (1 - (brow[7] === 'peak' ? 0.85 * Math.abs(brow[6]) : 0.77 * brow[6] ** 2)) - brow[5]
      : 0.209 + (brows === 'arched' ? 0.096 : brows === 'straight' ? 0.025 : 0.055) * (1 - 0.12 ** 2)
        - (brows === 'thick' ? 0.077 : 0.049);
    if (illustrated) {
      // Large manga eyes on a small forehead can exceed even the highest brow.
      // Fit their opening inside the available space before moving the brow.
      const maxOpen = (browBase * fit.browHeight + 0.092 - 0.038) / (upperLid * fit.eyeOpen);
      s.eyeOpening = Math.min(s.eyeOpening, Math.max(-1, Math.floor(100 * (maxOpen - 1) / 0.42) / 100));
    }
    const lidTop = upperLid * fit.eyeOpen * (1 + 0.42 * s.eyeOpening);
    const minBrow = Math.ceil(100 * (lidTop + (style === 'animation' ? 0.040 : 0.035) - browBase * fit.browHeight) / 0.092) / 100;
    const maxBrow = Math.floor(100 * (lidTop + 0.14 - browBase * fit.browHeight) / 0.092) / 100;
    s.browHeight = Math.max(-1, Math.min(1, Math.max(minBrow, Math.min(maxBrow, s.browHeight))));
    s.eyeSpacing = Math.max(s.eyeSpacing, Math.ceil(100 * (0.145 + eyeHalf * fit.eyeWidth * (1 + 0.23 * s.eyeWidth)) / fit.eyeCenter) / 100);

    const noseRow = pinePortraitStyles.noses[nose] || pinePortraitStyles.basicNoses[nose];
    const upperLip = pinePortraitStyles.mouths[mouth]?.[2] ?? (mouth === 'full' ? (style === 'animation' ? 0.122 : 0.092) : 0.061);
    // Include the wing below the tip and the extra lip peak painted by the bow style.
    const clearance = (noseRow[3] + pinePortraitStyles.noseUnderside(noseRow, doc.base !== 'baby' || style === 'animation')) * fit.noseLength
      + Math.max(upperLip, mouth === 'bow' ? 0.105 : 0) * fit.lipHeight * (1 + 0.54 * s.upperLipFullness) + 0.04;
    s.mouthHeight = Math.min(s.mouthHeight, pineDesignerBody.maxMouthHeight(doc.base, clearance + baseLipLift));
    if (outline === 'diamond') s.cheekWidth = Math.min(0.3, s.cheekWidth);
    if (s.cheekHeight > 0.32 && s.cheekProjection > 0.32) s.cheekFullness = Math.max(-0.12, s.cheekFullness);
  }
  function fitRandomProfile(doc, expressive) {
    if (doc.base === 'baby') return;
    const s = doc.shape, style = portraitStyleOf(doc);
    const row = pinePortraitStyles.noses[doc.face.nose] || pinePortraitStyles.basicNoses[doc.face.nose];
    const dimensions = pinePortraitStyles.proportionsFor(doc.base, style);
    const tip = pinePortraitStyles.tipProjection(row, dimensions.noseReach, 1 + 0.63 * s.noseBridge);
    // Balance the dental arch with the chosen nose and chin. Keep tighter bounds
    // on the side facing a long tip or a receding chin, with room to vary the other side.
    const center = 1.8 * (tip - 0.145) + 0.20 * (s.chinProjection || 0);
    const spread = expressive ? 0.42 : 0.22, limit = expressive ? 0.70 : 0.36;
    const fit = (v, lo, hi) => Math.round(100 * Math.min(hi, Math.max(lo, v))) / 100;
    s.lipProjection = fit(s.lipProjection + 0.075 + center, Math.max(-limit, center - spread), Math.min(limit, center + spread));
    const chin = s.chinProjection || 0, lip = s.lipProjection;
    s.chinProjection = fit(chin, lip * 0.36 - (expressive ? 0.53 : 0.29), lip * 0.46 + (expressive ? 0.36 : 0.20));
  }
  function randomFace(recipe, input) {
    const options = generationOptions(input);
    const { random = Math.random, style = 'natural', portrait = recipe.face?.style || 'animation',
      family, previousForm = recipe.face?.form, ink = recipe.portraitInk && (!options.release || options.release === infantNoseRelease) ? 'auto' : undefined,
      release: pin = ink ? infantNoseRelease : figurePin(recipe) } = options;
    requireThat(!ink || (pin === infantNoseRelease && (ink === 'auto' || Object.hasOwn(portraitInks,ink))), '未知像素随机笔触');
    requireThat(pin === release || pinePortraitStyles.hasTailoredFigure(pin), '未知随机人物版本');
    requireThat(typeof portrait === 'string' && Object.hasOwn(portraitStyles, portrait), '未知人物画风');
    requireThat(family === undefined || (typeof family === 'string' && Object.hasOwn(portraitFamilies, family)), '未知五官组合');
    const expressive = style === 'expressive';
    const brushed = ink && portrait === 'animation';
    const doc = brushed && recipe.packs[core] !== pin ? portraitEdition(recipe) : structuredClone(recipe);
    doc.packs[core] = pin;
    if (!pinePortraitStyles.hasGameFace(pin)) delete doc.bodyFinish;
    if (pin !== infantNoseRelease) clearPortraitOptions(doc);
    if (!pinePortraitStyles.hasGarmentFits(pin)) delete doc.garmentFit;
    if (!pinePortraitStyles.hasPaintedFeatures(pin) || (doc.clothingCut === 'age' && !pinePortraitStyles.hasInfantChin(pin))) delete doc.clothingCut;
    if (!pinePortraitStyles.hasFigureRatios(pin)) clearFigureRatios(doc);
    else if (!pinePortraitStyles.hasFacialActing(pin) && doc.face) delete doc.face.restExpression;
    if (!pinePortraitStyles.hasStructureStudy(pin)) delete doc.anatomyParts;
    if (doc.face) {
      delete doc.face.finish;
      delete doc.face.formMix;
      if (!pinePortraitStyles.hasGameFace(pin) || portrait !== 'animation') delete doc.face.form;
    }
    const infant = doc.base === 'baby';
    if (brushed) {
      doc.portraitInk = ink === 'auto' ? pick(Object.keys(portraitInks),random) : ink;
      if (!recipe.portraitInk) { doc.faceSurface = 'linked'; doc.spriteMouth = 'accent'; }
    } else {
      delete doc.portraitInk;
      delete doc.faceSurface;
      delete doc.spriteMouth;
    }
    let drawnForm = pinePortraitStyles.hasBaseFace(pin) && portrait === 'animation'
      ? pick(infant ? ['round','long','round','angular'] : ['round','long','angular'], random) : null;
    let families = familyIds;
    if (brushed && !infant) {
      // Drawing the cranium first avoids favouring long faces simply because
      // several pairings accept one. A reroll can use the preceding silhouette.
      const forms = family ? portraitCompositions[family].forms : Object.keys(pineGameFace.forms);
      drawnForm = pick(forms.filter(form => form !== previousForm),random);
      families = familyIds.filter(id => portraitCompositions[id].forms.includes(drawnForm));
    }
    const selectedFamily = portrait !== 'natural' && (family || pick(families, random));
    const design = portraitFamilies[selectedFamily], composition = brushed && portraitCompositions[selectedFamily];
    const young = infant || (design && doc.base === 'toddler');
    const eyePair = young ? pick(design ? infantEyes.filter(p => design.youngEyes.includes(p.face.eyes)) : infantEyes, random)
      : design ? eyePairings[pick(design.eyes, random)] : pick(eyePairs, random);
    const noses = young ? infantNoses : design ? design.noses : nosePairs;
    const noseRoll = random()*noses.length;
    const selectedNose = noses[Math.floor(noseRoll)];
    const nosePair = design && !young ? facePresets[selectedNose] : selectedNose;
    const cheeks = design || pick(cheekChoices, random);
    doc.face = { ...doc.face, style: portrait, eyes: eyePair.face.eyes, brows: eyePair.face.brows,
      nose: nosePair.face.nose, mouth: nosePair.face.mouth };
    // Explicitly pinned generations remain reproducible. A new ordinary roll
    // uses the current face drawing, including when started from an old save.
    if ((pin === release || pin === infantNoseRelease) && !brushed && portrait === 'animation') {
      const finish = generatedFaceFinish(options,recipe,doc.base,pin);
      if (finish !== undefined) {
        requireThat(typeof finish === 'string' && Object.hasOwn(faceFinishes,finish),'未知面部画法');
        if (pin === release || finish !== 'original') doc.face.finish = finish;
        if (finish === 'storybook-lips') {
          // The index picks a nose. Within every index the remaining fraction
          // is uniform, so lips vary without advancing the dye or wardrobe stream.
          const familyMouths = portraitCompositions[selectedFamily].mouths;
          const lipChoices = young ? familyMouths.filter(mouth => ['small','relaxed','bow','lower-full','soft-smile','classic'].includes(mouth)) : familyMouths;
          const mouths = [...new Set([nosePair.face.mouth,...lipChoices,...(young ? ['small','relaxed'] : [])])];
          doc.face.mouth = mouths[Math.floor((noseRoll%1)*mouths.length)];
        }
      }
    }
    if (composition) {
      if (!young) doc.face.brows = pick(composition.brows,random);
      const mouthRoll = random();
      doc.face.restExpression = pick(composition.rests,random);
      const compatible = expressionMouths[doc.face.restExpression];
      const familyMouths = (young ? ['small','bow','soft-smile','relaxed'] : composition.mouths).filter(mouth => compatible.includes(mouth));
      const mouths = [...new Set([...familyMouths, compatible[0]])];
      doc.face.mouth = mouths[Math.floor(mouthRoll*mouths.length)];
    }
    if (young) clearAdultFaceDetails(doc.face);
    const matchedOutlines = drawnForm && { round:['round','oval','pear'], long:['oval','heart'],
      angular:young ? ['oval','pear'] : ['square','oval'] }[drawnForm];
    const outline = pick(matchedOutlines || (young ? ['', 'oval', 'round', 'pear'] : design ? design.outlines : ['', ...Object.keys(faceDetails.outline)]), random);
    if (outline) doc.face.outline = outline;
    else delete doc.face.outline;
    const ageFullness = { baby: 0.12, toddler: 0.06 }[doc.base] || 0;
    for (const key of morphKeys) {
      const group = key.startsWith('cheek') ? cheeks : /^(eye|brow)/.test(key) ? eyePair : nosePair;
      // The hand-sculpted low-cheek preset has full cheeks. Roll that soft tissue
      // separately so a low cheekbone can also belong to a lean or neutral face.
      let center = (group.shape?.[key] || 0) * (expressive ? 1 : 0.82);
      if (design) center = design.shape[key] ?? center * 0.48;
      if (key === 'cheekFullness') center = (design ? center : Math.min(0, center)) + ageFullness;
      const spread = design ? (expressive ? 0.30 : 0.16) : (expressive ? 0.52 : 0.28);
      const offset = (random() + random() - 1) * spread;
      const value = (center + offset) * (infant ? 0.65 : 1);
      doc.shape[key] = Math.round(100 * Math.max(-1, Math.min(1, value))) / 100;
    }
    doc.shape.eyeSpacing = expressive ? between(0.87, 1.13, random) : between(0.94, 1.06, random);
    doc.shape.faceWidth = expressive ? between(0.89, 1.11, random) : between(0.94, 1.06, random);
    doc.shape.mouthHeight = design ? between(-0.06, 0.19, random) : between(-0.25, 0.25, random);
    if (composition) {
      const scale = young ? .50 : 1;
      doc.shape.faceWidth = Math.round(100 * (doc.shape.faceWidth + scale * composition.width)) / 100;
      doc.shape.eyeOpening = Math.round(100 * (doc.shape.eyeOpening + scale * composition.opening)) / 100;
      doc.shape.mouthWidth = Math.round(100 * (doc.shape.mouthWidth + scale * composition.lip)) / 100;
    }
    if (design) {
      const age = young ? 0.45 : 1;
      for (const key of pineHeadShape.controls)
        doc.shape[key] = Math.round(100 * age * ((design.shape[key] || 0) + between(-0.12, 0.12, random))) / 100;
      doc.shape.jaw = between(young ? 0.97 : 0.91, 1.04, random);
      doc.shape.headDepth = between(0.97, 1.04, random);
      doc.shape.faceRelief = between(0.87, 1.07, random);
    }
    if (!infant) {
      const widthAtJaw = pinePortraitStyles.jawBreadth(pinePortraitStyles.outlines[outline], doc.shape.jaw ?? 1, -0.56);
      const widthLimit = (expressive ? 1.085 : 1.035) * (doc.shape.headDepth ?? 1) ** 0.45 / widthAtJaw;
      doc.shape.faceWidth = Math.min(doc.shape.faceWidth, Math.max(0.94, Math.floor(100 * widthLimit) / 100));
    }
    if (composition) fitPaintedMouth(doc);
    fitRandomFace(doc, drawnForm ? Math.max(0, pineGameFace.lipLift(doc.base, drawnForm)) : 0);
    Object.assign(doc.shape, cheekAdjustment(doc, expressive ? 'expressive' : 'natural'));
    const spread = expressive ? 0.70 : 0.36;
    for (const key of profileKeys) {
      const center = design ? design.shape[key] ?? (key === 'lipProjection' ? -0.13 : 0) : 0;
      const jitter = design ? Math.min(spread * 0.60, spread - Math.abs(center)) : spread;
      doc.shape[key] = Math.round(100 * (center + (random() + random() - 1) * jitter)) / 100;
    }
    fitRandomProfile(doc, expressive);
    if (pinePortraitStyles.hasGameFace(pin) && portrait === 'animation') {
      // Draw from the neighbourhood of the chosen face. Colour and wardrobe never select a form.
      const options = infant ? ['balanced','round'] : ({
        heart: ['balanced','long'], round: ['balanced','round'], square: ['balanced','angular'],
        long: ['long','balanced'], diamond: ['angular','long'], pear: ['round','balanced']
      }[outline] || ['balanced','long','round']);
      doc.face.form = drawnForm || pick(options, random);
      if (drawnForm && drawnForm !== 'balanced') doc.face.formMix = brushed && !young && drawnForm === 'long'
        ? between(.66,.88,random) : between(.82, 1, random);
      if (infant && ['crescent','level-eye','monolid'].includes(doc.face.eyes)) {
        doc.shape.eyeOpening = Math.max(.16,doc.shape.eyeOpening);
        if (doc.face.mouth === 'relaxed') doc.face.mouth = 'soft-smile';
      }
    }
    if (pinePortraitStyles.hasFigureRatios(pin)) {
      const ratios = fittedFigureRatios(doc);
      doc.shape.crownHeight = ratios.crownHeight;
      doc.shape.noseLipSpacing = ratios.noseLipSpacing;
    }
    fitRandomInfantChin(doc,recipe,options.release);
    return doc;
  }
  function randomCharacter(input) {
    const options = generationOptions(input);
    const { random = Math.random, style, portrait, family, source, seed, base,
      ink = source?.portraitInk && (!options.release || options.release === infantNoseRelease) ? 'auto' : undefined, release: pin = ink ? infantNoseRelease : figurePin(source),
      bodyFinish = pinePortraitStyles.hasGameFace(pin) ? source?.bodyFinish : undefined,
      locks = [] } = options;
    requireThat(bodyFinish === undefined || (bodyFinish === 'painted' && pinePortraitStyles.hasGameFace(pin)), '所选基础部件版本不支持身体着色试作');
    const keep = new Set(source ? locks : []);
    const tailored = pinePortraitStyles.hasTailoredFigure(pin);
    requireThat(base === undefined || Object.values(bodyProfiles).some(profile => profile.base === base), '未知年龄基型');
    requireThat(base === undefined || !keep.has('body') || base === source.base, '指定年龄与锁定的体型不一致');
    let profiles = profileDraws;
    if (keep.has('hair')) {
      const nurseryOnly=Object.hasOwn(pineInfantHair.choices,source.parts.hair);
      requireThat(!nurseryOnly || base===undefined || base==='baby','锁定的发型仅适用于婴儿');
      if (nurseryOnly) profiles=['baby'];
      else if (base===undefined && !babyHair.includes(source.parts.hair)) profiles=profiles.filter(key=>key!=='baby');
    }
    if (base !== undefined) profiles = profiles.filter(key => bodyProfiles[key].base === base);
    const profile = keep.has('body') ? source : bodyProfiles[pick(profiles, random)];
    const donor = pick(seedWardrobe.filter((doc) => doc.base === profile.base), random);
    const currentPool=options.release===undefined && (!source || !!source.bodyFinish);
    const lockedHair=keep.has('hair') && source.parts.hair;
    let outfit=donor;
    if (keep.has('wear')) outfit=source;
    else if (currentPool && random()<.44) {
      const choices=catalogueWardrobes[profile.base];
      outfit=pick(lockedHair && !brimHair.has(lockedHair) ? choices.filter(d=>d.parts.hat==='none') : choices, random);
    } else if (tailored) outfit=tailoredOutfit(donor, lockedHair, random, pinePortraitStyles.hasClothingStudy(pin));
    const faceSource = { ...outfit, base: profile.base, shape: donor.shape, face: {} };
    if (ink && pin === infantNoseRelease) faceSource.packs = {...outfit.packs,[core]:pin};
    const doc = randomFace(faceSource,
      { random, style, portrait: portrait || source?.face?.style || 'animation', family, previousForm:source?.face?.form,
        finish:generatedFaceFinish(options,source,profile.base,pin), release: pin, ink });
    if (doc.portraitInk && source?.portraitInk) {
      if (source.faceSurface) doc.faceSurface = source.faceSurface;
      else delete doc.faceSurface;
      if (!source.spriteMouth) delete doc.spriteMouth;
    }
    doc.gender = profile.gender || 'unspecified';
    // Both original infant wardrobe donors wear a knit cap. An unlocked new
    // person can wear it or show their hair; an explicit edition replays its original pool.
    const nurseryPool = profile.base==='baby' && options.release===undefined;
    const canUncover = nurseryPool && !tailored && !keep.has('wear') && doc.parts.hat!=='none';
    doc.parts.hair = keep.has('hair') ? source.parts.hair : randomHair(profile.base, canUncover ? 'none' : doc.parts.hat,
      tailored, random, doc.portraitInk, source?.parts.hair, nurseryPool || currentPool);
    doc.colors.skin = keep.has('skin') ? source.colors.skin : pick(skinDyes, random);
    doc.colors.eyes = pick(Object.values(colorPresets.eyes), random);
    doc.colors.hair = keep.has('hair') ? source.colors.hair
      : pick(style === 'expressive' ? Object.values(hairColors) : naturalHairDyes, random);
    for (const key of Object.keys(pinePortraitStyles.dyes)) delete doc.colors[key];
    if (keep.has('body')) {
      for (const key of bodySizes) doc.shape[key] = source.shape[key];
      if (pinePortraitStyles.hasStructureStudy(pin) && source.anatomyParts !== undefined) {
        doc.anatomyParts = structuredClone(source.anatomyParts);
      } else delete doc.anatomyParts;
    } else if (tailored) fitBodyProportions(doc, random);
    else {
      doc.shape.height = between(0.88, 1.12, random);
      doc.shape.shoulders = between(0.83, 1.17, random);
    }
    if (pinePortraitStyles.hasStructureStudy(pin) && !keep.has('body')) {
      const torso = doc.shape.shoulders > 1.045 ? 'broad' : doc.shape.shoulders < 0.965 ? 'slender' : 'balanced';
      const build = torso === 'broad' ? 'strong' : torso;
      const skulls = doc.base === 'baby' || doc.base === 'toddler'
        ? ['balanced', 'balanced', 'round', 'long'] : ['balanced', 'long', 'round', 'angular'];
      doc.anatomyParts = { ...(doc.face.form ? {} : {skull: pick(skulls, random)}), torso,
        arms: pick(['balanced', build], random), legs: pick(['balanced', build], random) };
    }
    if (bodyFinish) doc.bodyFinish = bodyFinish;
    if (pinePortraitStyles.hasPaintedFeatures(pin) && source?.clothingCut === 'original') doc.clothingCut = 'original';
    if (pin === infantNoseRelease && source) {
      const chin = pinePortraitStyles.infantChinStyle(source);
      if (chin !== 'full') doc.infantChin = chin;
      else delete doc.infantChin;
    }
    fitRandomInfantChin(doc,source,options.release);
    if (pin === infantNoseRelease && (source?.infantNose || ((doc.portraitInk || doc.face?.finish) && doc.base === 'baby' && source?.base !== 'baby'))) doc.infantNose = 'nursery';
    if (pinePortraitStyles.hasInfantChin(pin) && source?.clothingCut === 'age') doc.clothingCut = 'age';
    if (pinePortraitStyles.hasGarmentFits(pin) && !keep.has('wear')) randomGarmentFit(doc, random);
    if (pinePortraitStyles.hasFigureRatios(pin)) {
      const ratios = fittedFigureRatios(doc);
      for (const key of ['headScale','trunkLength']) {
        if (!keep.has('body')) doc.shape[key] = ratios[key];
        else if (source.shape[key] === undefined) delete doc.shape[key];
        else doc.shape[key] = source.shape[key];
      }
    }
    if (canUncover && (['baby-sprout','baby-comma','baby-puffs'].includes(doc.parts.hair) || random()<.59)) {
      doc.parts.hat='none';
      doc.packs={ [core]:doc.packs[core] };
      delete doc.embeddedPacks;
    }
    doc.id = seed === undefined ? newId() : seededLookId(doc, seed);
    doc.label = '新人物 ' + doc.id.slice(-5).toUpperCase();
    return doc;
  }
  return {
    core,
    release,
    tailoredRelease, proportionStudyRelease, structureStudyRelease, gameFaceRelease, baseFaceRelease, clothingStudyRelease, featureStudyRelease, figureRatioRelease, expressionRelease, garmentRelease, garmentFits, withGarmentStudy, withoutGarmentStudy, restExpressions, withExpressionStudy, withoutExpressionStudy,
    withFigureStudy, withGameFace, withBaseFace, withClothingStudy, withFeatureStudy, withoutFeatureStudy, withFigureRatios, withoutFigureRatios, usesClothingCut,
    infantChinRelease, chinPadRelease, infantNoseRelease, withInfantChin, withoutInfantChin, withInfantChinStyle, withInfantNose, withoutInfantNose,
    portraitInks, withPortraitInk, withoutPortraitInk, withFaceSurface, withoutFaceSurface, faceFinishes, withFaceFinish, withFittedPortrait,
    originalRelease,
    styleRelease,
    profileRelease,
    proportionRelease,
    hairRelease,
    headRelease,
    strandRelease,
    contourRelease,
    wardrobeRelease,
    collectionRelease,
    sculptRelease,
    volumeRelease,
    jawRelease,
    neckRelease,
    mandibleRelease,
    sagittalRelease,
    occipitalRelease,
    morphRelease,
    infantRelease,
    infantNapeRelease,
    naturalProfileRelease,
    lipJawRelease, illustratedRelease, silhouetteRelease, facePlaneRelease, pixelRelease,
    portraitStyles, portraitStyleOf, setPortraitStyle, portraitFamilies, gameFaceForms:pineGameFace.forms, baseFaceForms:pineGameFace.baseForms,
    morphs: pinePortraitStyles.morphs,
    profileControls: pinePortraitStyles.profileControls,
    cheekPresets,
    cheekAdjustment,
    randomFace,
    randomCharacter,
    jawPresets,
    jawControls: pineHeadShape.controls,
    hasRoundedHead,
    hasSculptedHead,
    hasMandible,
    hasFacialMorphs,
    hasInfantHead,
    editingRelease,
    usesExtendedShape,
    bodyProfiles, anatomyParts,
    bodyProfileOf,
    withBodyProfile,
    features,
    facePresets,
    infantFacePresets,
    applyFacePreset,
    featureShapeKeys,
    outfits,
    workshopOutfits: pineWorkshopWear.outfits,
    collectionOutfits, outfitFrom,
    wearables,
    carriedSlots,
    outfitDyes,
    gearColors,
    gearColor,
    faceDetails,
    portraitColors: pinePortraitStyles.dyes,
    hairGroups, hairOptions, nurseryHair: pineInfantHair.choices,
    applyOutfit,
    needsNewCore,
    shape, figureRatioRanges,
    slots,
    colors,
    hairColors,
    colorPresets,
    catalog,
    templates,
    templateById,
    archivedTemplates,
    library: pineCharacterCollection,
    manifest,
    install,
    prepare,
    build,
    newId
  };
})();
globalThis.PineLooks = PineLooks;

// Old score IDs and public preset IDs both resolve to the very same editable recipe.
for (const doc of PineLooks.templates) {
  let built;
  const resolve = () => built || (built = PineLooks.build(doc));
  const expose = (id) =>
    PineMotion.characters.set(id, {
      id,
      label: doc.label,
      recipeId: doc.id,
      figureRelease: doc.packs[PineLooks.core],
      gender: doc.gender,
      tags: PineLooks.hasMandible(doc) ? [doc.base, 'mandible'] : [doc.base],
      get rig() {
        return resolve().rig;
      },
      get sockets() {
        return resolve().sockets;
      },
      get body() {
        return resolve().body;
      }
    });
  if (doc.id.startsWith('look_workshop_')) expose(doc.id.slice('look_workshop_'.length));
  expose(doc.id);
}
