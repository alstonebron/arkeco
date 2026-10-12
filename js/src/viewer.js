/* ARK ECO 3D inspection viewer — bundled to IIFE (js/vendor/arkviewer.js) by scripts/build_viewer.mjs.
   Exposes window.ArkViewer.mount(container, glbUrl, opts) -> {dispose, setExplode} */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const GOLD = 0xffc20e;

function mount(container, glbUrl, opts = {}) {
  const w = () => container.clientWidth || 480;
  const h = () => container.clientHeight || 480;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w(), h());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.65;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w() / h(), 0.05, 60);

  // studio lighting: warm key, cool fill, gold rim — matches the site's dusk palette
  const key = new THREE.DirectionalLight(0xfff2dd, 4.2); key.position.set(3, 5, 2); scene.add(key);
  const fill = new THREE.DirectionalLight(0x8fb7ff, 2.4); fill.position.set(-4, 2, -1); scene.add(fill);
  const rim = new THREE.DirectionalLight(GOLD, 2.8); rim.position.set(0, -2, -5); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x9a9aaa, 0x201827, 2.4));
  scene.add(new THREE.AmbientLight(0x666678, 1.8));

  // soft ground disc
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(2.15, 64),
    new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.9, metalness: 0.1, transparent: true, opacity: 0.85 })
  );
  disc.rotation.x = -Math.PI / 2; disc.position.y = -0.02; scene.add(disc);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.autoRotate = opts.autoRotate !== false;
  controls.autoRotateSpeed = 1.6;
  controls.enablePan = false;
  controls.minDistance = 0.9; controls.maxDistance = 6;
  controls.target.set(0, 0.55, 0);

  let model = null, parts = [], raf = 0, disposed = false;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const loadPromise = loader.loadAsync(glbUrl).then(g => {
    if (disposed) return;
    model = g.scene;
    // normalize: center + scale to ~1.4 units, sit on ground
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const s = 2.2 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(model);
    const c = box2.getCenter(new THREE.Vector3());
    model.position.x -= c.x; model.position.z -= c.z; model.position.y -= box2.min.y;
    scene.add(model);
    // collect meshes with their rest positions for explode
    parts = [];
    model.traverse(o => { if (o.isMesh) parts.push({ o, p: o.position.clone() }); });
    camera.position.set(2.15, 1.45, 2.55);
    controls.target.set(0, (box2.max.y - box2.min.y) * 0.5, 0);
    return model;
  }).catch(err => { console.warn('[ArkViewer] load failed', glbUrl, err); });

  const ro = new ResizeObserver(() => {
    if (disposed || !w()) return;
    renderer.setSize(w(), h());
    camera.aspect = w() / h(); camera.updateProjectionMatrix();
  });
  ro.observe(container);

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  };
  tick();

  return {
    load: () => loadPromise,
    setExplode(t = 0) {  // 0..1 — parts drift outward from center
      if (!model) return;
      const box = new THREE.Box3().setFromObject(model);
      const c = box.getCenter(new THREE.Vector3());
      parts.forEach(({ o, p }) => {
        const d = p.clone().sub(c).normalize();
        if (!isFinite(d.x)) d.set(0, 1, 0);
        o.position.copy(p).addScaledVector(d, t * 0.55);
      });
    },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      controls.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}

window.ArkViewer = { mount };
