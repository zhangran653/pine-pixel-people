import * as THREE from 'three';
import { OrbitControls } from './vendor/three-r187/OrbitControls.js';
import { createPineCast } from './pine-three.mjs';
import { buildClearing } from './three-clearing.mjs';

function lightClearing(scene) {
  const sky = document.createElement('canvas');
  sky.width = 2;
  sky.height = 128;
  const ctx = sky.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, sky.height);
  gradient.addColorStop(0, '#9fc3ca');
  gradient.addColorStop(0.67, '#dce4cd');
  gradient.addColorStop(1, '#ece0c0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, sky.width, sky.height);
  scene.background = new THREE.CanvasTexture(sky);
  scene.background.colorSpace = THREE.SRGBColorSpace;
  scene.fog = new THREE.Fog(0xd4dfc9, 6, 25);
  scene.add(new THREE.HemisphereLight(0xfff9e8, 0xdfd9cd, 2.35));
  const sun = new THREE.DirectionalLight(0xffedcb, 1.55);
  sun.position.set(-3.2, 5.7, 3.2);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -3.6, right: 3.6, top: 3.6, bottom: -3.6, near: 0.1, far: 14 });
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.00016;
  sun.shadow.normalBias = 0.004;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
}

function showcases(motion) {
  PineWardrobe.hydrate();
  const choices = new Map();
  const register = (key, label, score) => choices.set(key, { label, plan: PineWardrobe.readScoreFile(score) });
  register('greet', '相互击掌', {
    version: 1,
    loop: true,
    steps: [{ action: 'highfive', actors: ['child', 'mother'] }]
  });
  register('play', '放学活动', motion.presets.play);
  register('family', '亲子时光', motion.presets.family);
  register('work', '营地办公', motion.presets.work);
  try {
    const snapshot = PineWardrobe.snapshot();
    if (snapshot) {
      register('studio', '工坊当前编排', snapshot);
      return choices;
    }
  } catch { /* A directly opened preview can still use its last saved score. */ }
  try {
    const saved = JSON.parse(localStorage.getItem('pineCreek.motionScores.v1') || 'null');
    if (saved?.books?.[saved.book]) register('studio', '工坊当前编排', saved.books[saved.book]);
  } catch {
    /* Built-in scores also work without browser storage. */
  }
  return choices;
}

export function startClearing(motion) {
  const id = (key) => document.getElementById(key);
  const canvas = id('clearing'),
    select = id('showcase'),
    slider = id('time-3d'),
    play = id('play-3d');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  lightClearing(scene);
  const { rail } = buildClearing(THREE, scene);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.07, 70);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.minDistance = 2.05;
  controls.maxDistance = 8.0;
  controls.minPolarAngle = 0.13;
  controls.maxPolarAngle = Math.PI * 0.505;
  controls.target.set(0, 0.81, 0);
  function home() {
    camera.position.set(2.7, 1.7, 3.95);
    controls.target.set(0, 0.81, 0);
    controls.update();
  }
  home();
  const cast = createPineCast(THREE, motion);
  cast.group.rotation.y = -2.27;
  scene.add(cast.group);
  const choices = showcases(motion);
  for (const [value, entry] of choices) select.add(new Option(entry.label, value));
  let plan,
    time = 0,
    playing = false,
    last = null,
    request = 0;

  function render() {
    const distance = camera.position.distanceTo(controls.target);
    const actors = plan?.locate(time)?.step.actors || [];
    const tallest = Math.max(0, ...actors.map((key) => motion.characters.get(key).rig.height));
    const faceHeight = tallest * 0.20 * motion.rig.centimetersPerUnit / 100;
    const facePixels = canvas.clientHeight * faceHeight / (2 * Math.tan(camera.fov * Math.PI / 360) * distance);
    if (cast.setFaceDetail(facePixels >= 58)) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
  }
  function resize() {
    const width = Math.max(1, canvas.clientWidth),
      height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }
  function sync() {
    if (cast.setTime(plan, time)) {
      renderer.shadowMap.needsUpdate = true;
      render();
    }
    const cue = plan.locate(time);
    id('clip-label').textContent = cue?.clip.label || '空编排';
    id('cast-label').textContent = cue
      ? cue.step.actors.map((key) => motion.characters.get(key).label).join('与')
      : '可以在动作工坊添加第一段';
    slider.max = plan.duration || 1;
    slider.value = time;
    slider.disabled = !plan.duration;
    const progress = time.toFixed(1) + ' / ' + plan.duration.toFixed(1) + ' 秒';
    id('clock-3d').textContent = progress;
    slider.setAttribute('aria-valuetext', progress);
    play.textContent = playing ? '暂停' : '播放';
    play.disabled = !plan.duration;
    play.setAttribute('aria-pressed', String(playing));
  }
  function schedule() {
    if (playing && !request && !document.hidden) request = requestAnimationFrame(tick);
  }
  function tick(now) {
    request = 0;
    if (!playing || document.hidden) {
      last = null;
      return;
    }
    if (last !== null) time += (now - last) / 1000;
    last = now;
    if (time >= plan.duration) {
      if (plan.score.loop) time %= plan.duration;
      else {
        time = plan.duration;
        playing = false;
      }
    }
    sync();
    schedule();
  }
  function toggle() {
    if (!plan.duration) return;
    if (!playing && time >= plan.duration) time = 0;
    playing = !playing;
    last = null;
    sync();
    schedule();
  }
  function choose(key, first = false) {
    select.value = key;
    plan = choices.get(key).plan;
    time = 0;
    if (first && key === 'greet') time = plan.duration * 0.48;
    if (first && key === 'family') time = plan.score.steps[0].seconds * 0.53;
    playing = !!plan.duration && (first ? !matchMedia('(prefers-reduced-motion: reduce)').matches : playing);
    last = null;
    sync();
    schedule();
  }
  select.addEventListener('change', () => choose(select.value));
  play.addEventListener('click', toggle);
  slider.addEventListener('input', () => {
    playing = false;
    last = null;
    time = slider.valueAsNumber;
    sync();
  });
  id('show-rail').addEventListener('change', (e) => {
    rail.visible = e.target.checked;
    renderer.shadowMap.needsUpdate = true;
    render();
  });
  id('rail-view').addEventListener('click', () => {
    camera.position.set(0.18, 1.12, -3.6);
    controls.target.set(0, 0.73, 0);
    controls.update();
  });
  id('home-view').addEventListener('click', home);
  canvas.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      toggle();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (e.key === 'ArrowLeft') spherical.theta -= Math.PI / 12;
    if (e.key === 'ArrowRight') spherical.theta += Math.PI / 12;
    if (e.key === 'ArrowUp') spherical.phi -= Math.PI / 20;
    if (e.key === 'ArrowDown') spherical.phi += Math.PI / 20;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.setFromSpherical(spherical).add(controls.target);
    controls.update();
  });
  controls.addEventListener('change', render);
  document.addEventListener('visibilitychange', () => {
    last = null;
    if (!document.hidden) schedule();
  });
  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement);
  resize();
  const wanted = new URL(location.href).searchParams.get('show');
  choose(choices.has(wanted) ? wanted : 'family', true);
  id('three-controls').disabled = false;
  id('gl-status').hidden = true;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    if (request) cancelAnimationFrame(request);
    observer.disconnect();
    controls.dispose();
    cast.dispose();
    scene.background.dispose();
    const geometries = new Set(),
      materials = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) for (const m of [].concat(object.material)) materials.add(m);
      object.shadow?.dispose();
    });
    geometries.forEach((g) => g.dispose());
    const textures = new Set();
    for (const material of materials) {
      if (material.map) textures.add(material.map);
      material.dispose();
    }
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
  });
}
