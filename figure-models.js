// The three turnaround sitters use the same parts, pigments and recipe format as the editor.
const pineFigureModels = (() => {
  const plain = PineLooks.templates.find(doc => doc.id === 'look_body_male');
  function sitter(profile, label, parts, face, colors) {
    const doc = PineLooks.withBodyProfile(structuredClone(plain), profile);
    return { ...doc, id: 'look_model_' + doc.base, label,
      packs: { [PineLooks.core]: PineLooks.release },
      parts: { ...doc.parts, hat: 'none', neck: 'none', ...parts },
      face: { style: 'animation', ...face }, colors: { ...doc.colors, ...colors } };
  }
  return {
    adult: sitter('male', '卷袖衬衫', { hair: 'side-part', top: 'oxford', bottom: 'trousers', shoes: 'canvas-shoes' },
      { eyes: 'soft-oval', brows: 'straight', nose: 'short', mouth: 'soft-smile', outline: 'oval' },
      { skin: '#ac744c', hair: '#3c2c2a', eyes: '#473026', top: '#818465', bottom: '#50494b', shoes: '#80604c', accent: '#dcc8a0' }),
    child: sitter('child', '蓝色套头衫', { hair: 'crop', top: 'pullover', bottom: 'trousers', shoes: 'sneakers' },
      { eyes: 'round', brows: 'fine', nose: 'button', mouth: 'smile', outline: 'heart' },
      { skin: '#c38a60', hair: '#593b2f', eyes: '#4b322b', top: '#516881', bottom: '#a36544', shoes: '#cbbb96', accent: '#536479' }),
    baby: sitter('baby', '青色棉套装', { hair: 'curly', top: 'snap-knit', bottom: 'knee-pants', shoes: 'soft-booties' },
      { eyes: 'round', brows: 'fine', nose: 'button', mouth: 'soft-smile', outline: 'round' },
      { skin: '#99613f', hair: '#4e3028', eyes: '#442921', top: '#58796c', bottom: '#58796c', shoes: '#7d9580', accent: '#b5bc91' })
  };
})();
