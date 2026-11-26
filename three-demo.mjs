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
  const register = (key, label, score) =>
    choices.set(key, { label, plan: PineWardrobe.readScoreFile(score) });
  register('greet', '相互击掌', {
    version: 1,
    loop: true,
    steps: [{ action: 'highfive', actors: ['child', 'mother'] }]
  });
  for (const [key, label] of Object.entries(motion.presetLabels)) register(key, label, motion.presets[key]);
  try {
    const snapshot = PineWardrobe.snapshot();
    if (snapshot) {
      const source = new URLSearchParams(location.search).get('from');
      register('studio', source === 'world' ? '当前场景' : source === 'atelier' ? '当前人物试演' : '工坊当前编排', snapshot);
      return choices;
    }
  } catch {
    /* A directly opened preview can still use its last saved score. */
  }
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
  const { root: clearing, rail } = buildClearing(THREE, scene);
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0xb5bea0 })
  );
  floor.receiveShadow = true;
  floor.visible = false;
  scene.add(floor);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.07, 70);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.minDistance = 2.05;
  controls.maxDistance = 8.0;
  controls.minPolarAngle = 0.13;
  controls.maxPolarAngle = Math.PI * 0.505;
  controls.target.set(0, 0.81, 0);
  let sceneView = null;
  function home() {
    if (sceneView) {
      const { center, radius } = sceneView,
        distance = Math.max(3.3, radius * (camera.aspect < 1 ? 3.1 : 2.45));
      controls.maxDistance = Math.max(8, distance * 2.8);
      controls.target.copy(center);
      camera.position
        .copy(center)
        .addScaledVector(
          new THREE.Vector3(0.94, 0.62, -0.25).applyQuaternion(cast.group.quaternion).normalize(),
          distance
        );
      scene.fog.near = distance * 0.98;
      scene.fog.far = Math.max(25, distance * 3);
      camera.far = Math.max(60, distance * 5);
      camera.updateProjectionMatrix();
      controls.update();
      return;
    }
    controls.maxDistance = 8;
    scene.fog.near = 6;
    scene.fog.far = 25;
    camera.position.set(2.7, 1.7, 3.95);
    controls.target.set(0, 0.81, 0);
    controls.update();
  }
  home();
  const cast = createPineCast(THREE, motion, { detail: 'figure' });
  cast.group.rotation.y = -2.27;
  scene.add(cast.group);
  const castBasis = cast.group.children[0], toEye = new THREE.Vector3(), basisRotation = new THREE.Quaternion();
  const choices = showcases(motion);
  for (const [value, entry] of choices) select.add(new Option(entry.label, value));
  let plan,
    time = 0,
    playing = false,
    last = null,
    request = 0;

  function render() {
    const distance = toEye.subVectors(camera.position,controls.target).length();
    if (distance > 0 && canvas.height) {
      castBasis.getWorldQuaternion(basisRotation).invert();
      toEye.normalize().applyQuaternion(basisRotation);
      const span = 2*distance*Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()/2));
      cast.setPixelScale(canvas.height*castBasis.scale.x/span,Math.atan2(toEye.y,toEye.x),Math.asin(THREE.MathUtils.clamp(toEye.z,-1,1)));
    }
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
    if (first && key === 'studio') {
      const params = new URLSearchParams(location.search), at = Number(params.get('time'));
      if (params.has('time') && Number.isFinite(at)) time = Math.max(0, Math.min(plan.duration, at));
      if (params.has('play')) playing = playing && params.get('play') === '1';
    }
    last = null;
    sync();
    sceneView = null;
    const visible = plan.scenery(time);
    const flights = new Set(plan.starts.map(t => plan.routeAt(t)).filter(p => p?.kind === 'stairs'));
    clearing.visible = !(plan.score.scene?.length || visible.length || flights.size);
    floor.visible = !clearing.visible;
    id('rail-view').hidden = floor.visible;
    id('show-rail').parentElement.hidden = floor.visible;
    if (!clearing.visible) {
      cast.group.updateMatrixWorld(true);
      const box = new THREE.Box3().makeEmpty();
      cast.group.traverse((mesh) => {
        if (mesh.isMesh && mesh.visible && mesh.parent.visible) {
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          box.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
        }
      });
      if (flights.size) {
        const basis = cast.group.children[0];
        const height = Math.max(36, ...plan.score.steps.flatMap(step => step.actors.map(id => motion.characters.get(id).rig.height)));
        for (const p of flights)
          for (const point of PineWorld.stairs.routeBounds(p, height))
            box.expandByPoint(new THREE.Vector3(...point).applyMatrix4(basis.matrixWorld));
      }
      if (!box.isEmpty()) {
        sceneView = box.getBoundingSphere(new THREE.Sphere());
        const size = box.getSize(new THREE.Vector3());
        floor.scale.set(size.x + 1.2, 0.16, size.z + 1.2);
        floor.position.set(sceneView.center.x, -0.085, sceneView.center.z);
      }
    }
    home();
    render();
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
    floor.geometry.dispose();
    floor.material.dispose();
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
