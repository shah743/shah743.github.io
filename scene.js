// A small progressive enhancement. The portrait and SVG fallback work alone.
const host = document.querySelector(".portrait-accent");
const hero = document.querySelector(".hero");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");
let sceneController;
let loading = false;
let failed = false;

function motionEnabled() {
  return document.documentElement.dataset.motion === "on" && !reducedMotion.matches;
}

async function initialize() {
  if (!host || loading || failed || sceneController || !motionEnabled() || navigator.connection?.saveData) return;
  loading = true;
  try {
    const THREE = await import("./vendor/three/three.module.js");
    // The preference can change while the optional module is downloading.
    if (!motionEnabled()) return;
    sceneController = createOrbit(THREE);
  } catch {
    failed = true;
    host.dataset.scene = "fallback";
  } finally {
    loading = false;
  }
}

function createOrbit(THREE) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
  if (!context) throw new Error("WebGL2 unavailable");

  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.65, 1.65, 1.65, -1.65, 0.1, 20);
  camera.position.z = 6;

  const sculpture = new THREE.Group();
  sculpture.rotation.set(0.3, -0.3, -0.25);
  scene.add(sculpture);

  const ringGeometry = new THREE.TorusGeometry(1.13, 0.013, 6, 96);
  const greenMaterial = new THREE.MeshStandardMaterial({ color: 0x5d7a62, roughness: 0.48, metalness: 0.18 });
  const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xb19961, roughness: 0.52, metalness: 0.2 });
  const rings = [[0.55, 0.25, 0], [1.25, -0.7, 0.5], [0.2, 1.22, -0.5]].map((rotation, index) => {
    const ring = new THREE.Mesh(ringGeometry, index === 1 ? goldMaterial : greenMaterial);
    ring.rotation.set(...rotation);
    sculpture.add(ring);
    return ring;
  });

  const beadGeometry = new THREE.SphereGeometry(0.075, 16, 12);
  const beads = rings.map((ring, index) => {
    const bead = new THREE.Mesh(beadGeometry, index === 1 ? greenMaterial : goldMaterial);
    ring.add(bead);
    return bead;
  });
  const centerGeometry = new THREE.IcosahedronGeometry(0.18, 1);
  sculpture.add(new THREE.Mesh(centerGeometry, greenMaterial));
  scene.add(new THREE.HemisphereLight(0xffffef, 0x899b8c, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-3, 4, 5);
  scene.add(light);

  let active = false;
  let visible = false;
  let contextLost = false;
  let frame = 0;
  let lastTime = 0;
  let phase = 0;
  const pointer = { x: 0, y: 0 };
  const tilt = { x: 0, y: 0 };

  function updateSculpture(delta) {
    phase += delta * 0.16;
    tilt.x += (pointer.x - tilt.x) * 0.06;
    tilt.y += (pointer.y - tilt.y) * 0.06;
    sculpture.rotation.x = 0.3 + Math.sin(phase * 0.4) * 0.13 + tilt.y * 0.12;
    sculpture.rotation.y = -0.3 + phase * 0.25 + tilt.x * 0.18;
    beads.forEach((bead, index) => {
      const angle = phase + index * Math.PI * 0.65;
      bead.position.set(Math.cos(angle) * 1.13, Math.sin(angle) * 1.13, 0);
    });
  }

  function tick(time) {
    if (!active) return;
    frame = requestAnimationFrame(tick);
    if (time - lastTime < 1000 / 30) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    updateSculpture(delta);
    renderer.render(scene, camera);
  }

  function syncPlayback() {
    const shouldPlay = visible && !document.hidden && motionEnabled() && !contextLost;
    if (active === shouldPlay) return;
    active = shouldPlay;
    host.dataset.scene = contextLost ? "fallback" : active ? "playing" : "paused";
    if (active) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
    }
  }

  function resize() {
    if (contextLost) return;
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }

  function move(event) {
    if (!active || !finePointer.matches) return;
    const bounds = hero.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  }

  hero.addEventListener("pointermove", move, { passive: true });
  hero.addEventListener("pointerleave", () => { pointer.x = 0; pointer.y = 0; });
  document.addEventListener("visibilitychange", syncPlayback);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    host.classList.remove("scene-ready");
    syncPlayback();
    host.dataset.scene = "fallback";
  });
  canvas.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    resize();
    host.classList.add("scene-ready");
    syncPlayback();
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  });
  visibilityObserver.observe(hero);

  updateSculpture(0);
  resize();
  host.classList.add("scene-ready");
  host.dataset.scene = "paused";

  // Browser back/forward cache can retain this page: pause/resume without leaks.
  window.addEventListener("pagehide", () => {
    active = false;
    cancelAnimationFrame(frame);
  });
  window.addEventListener("pageshow", syncPlayback);
  return { syncPlayback };
}

document.addEventListener("portfolio:motionchange", () => {
  if (sceneController) sceneController.syncPlayback();
  else initialize();
});

// Let the portrait and page content take priority over the optional 3D module.
if ("requestIdleCallback" in window) requestIdleCallback(initialize, { timeout: 1600 });
else window.setTimeout(initialize, 250);
