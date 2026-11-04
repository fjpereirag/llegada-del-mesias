/* La Llegada del Mesías · hilo de luz 3D (Three.js)
   Un hilo de luz dorada atraviesa velos oscuros; la cámara lo recorre con el scroll.
   Respaldo estático si no hay WebGL. DPR ≤ 1.5 · se pausa fuera de pestaña. */
const root = document.documentElement;

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

let THREE;
try {
  if (!hasWebGL()) throw new Error('sin WebGL');
  THREE = await import('three');
} catch (e) {
  root.classList.add('no-webgl');
}

if (THREE) init();

function init() {
  const S = window.MESIAS || { progress: 0, tone: 0, reduce: false };
  const canvas = document.getElementById('luz');
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || innerWidth < 720;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.25 : 1.5));
  renderer.setClearColor(0x0B0E14, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0B0E14, 0.02);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

  /* ----- Recorrido: espiral que avanza hacia el fondo ----- */
  const pts = [];
  const N = 46;
  for (let i = 0; i < N; i++) {
    const a = i * 0.62, r = 1.6 + Math.sin(i * 0.35) * 0.9;
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.55 + Math.sin(i * 0.2) * 0.6, -i * 4.2));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);

  /* ----- Tonos por capítulo: inicio, encarnación, promesa, pascua, corazón ----- */
  const TONES = [0xE8C77A, 0xF0D9A0, 0xC9A35B, 0xE0703F, 0xFFF1D0].map(c => new THREE.Color(c));
  const uniforms = {
    uTime: { value: 0 }, uColor: { value: TONES[0].clone() },
    uDim: { value: innerWidth < 720 ? .45 : 1 }, uSize: { value: (lowPower ? 90 : 110) * renderer.getPixelRatio() }, uHead: { value: 0 }
  };

  /* ----- El hilo: miles de partículas a lo largo de la curva ----- */
  const COUNT = lowPower ? 6000 : 12000;
  const pos = new Float32Array(COUNT * 3), tArr = new Float32Array(COUNT), seed = new Float32Array(COUNT);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    const t = Math.random();
    curve.getPointAt(t, tmp);
    const spread = Math.pow(Math.random(), 3) * 0.55;
    const ang = Math.random() * Math.PI * 2;
    pos[i * 3] = tmp.x + Math.cos(ang) * spread;
    pos[i * 3 + 1] = tmp.y + Math.sin(ang) * spread;
    pos[i * 3 + 2] = tmp.z + (Math.random() - .5) * spread;
    tArr[i] = t; seed[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.BufferAttribute(tArr, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const threadMat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aT; attribute float aSeed;
      uniform float uTime; uniform float uSize; uniform float uHead; uniform float uDim;
      varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime*.6 + aSeed*30.) * .04;
        p.y += cos(uTime*.5 + aSeed*20.) * .04;
        vec4 mv = modelViewMatrix * vec4(p,1.);
        // pulsos de luz que fluyen por el hilo
        float flow = fract(aT*6. - uTime*.05);
        float pulse = smoothstep(.0,.08,flow) * (1.-smoothstep(.08,.5,flow));
        // el hilo se enciende por delante de la cámara
        float ahead = smoothstep(uHead-.02, uHead+.01, aT) * (1. - smoothstep(uHead+.25, uHead+.45, aT));
        vA = (.5 + pulse*1.4) * (.35 + ahead*.9) * (.5 + aSeed*.5) * uDim;
        gl_PointSize = uSize * (.35 + aSeed*.65) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vA;
      void main(){
        float d = length(gl_PointCoord - .5);
        float a = smoothstep(.5,.0,d);
        gl_FragColor = vec4(uColor * (1.+a*.6), a*vA);
      }`
  });
  scene.add(new THREE.Points(g, threadMat));

  /* ----- Polvo en suspensión ----- */
  const DUST = lowPower ? 900 : 1800;
  const dp = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) { dp[i * 3] = (Math.random() - .5) * 18; dp[i * 3 + 1] = (Math.random() - .5) * 10; dp[i * 3 + 2] = 4 - Math.random() * 200; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xA89F8C, size: 0.035, transparent: true, opacity: .45, depthWrite: false }));
  scene.add(dust);

  /* ----- Velos oscuros ----- */
  const veilMat = new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){
        vec2 p = vUv*3.; float t = uTime*.03;
        float v = n(p+vec2(t,0.))*.6 + n(p*2.1-vec2(0.,t))*.4;
        float edge = smoothstep(0.,.35,vUv.x)*smoothstep(1.,.65,vUv.x)*smoothstep(0.,.3,vUv.y)*smoothstep(1.,.7,vUv.y);
        gl_FragColor = vec4(vec3(.09,.12,.19)*(.6+v*.6), v*edge*.38);
      }`
  });
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), veilMat);
    const t = (i + .5) / 9; curve.getPointAt(t, tmp);
    m.position.set(tmp.x + (i % 2 ? 3.5 : -3.5), tmp.y + (Math.random() - .5) * 2, tmp.z - 2);
    m.rotation.set((Math.random() - .5) * .3, (i % 2 ? -1 : 1) * .5, (Math.random() - .5) * .4);
    scene.add(m);
  }

  /* ----- Bucle ----- */
  const look = new THREE.Vector3(), camP = new THREE.Vector3();
  let smooth = 0, running = true, visible = true, last = performance.now();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / innerWidth - .5); mouse.ty = (e.clientY / innerHeight - .5); }, { passive: true });

  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; uniforms.uDim.value = w < 720 ? .45 : 1;
    camera.fov = w < h ? 70 : 55; camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize); resize();

  const tick = (now) => {
    if (!running) return;
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const reduce = S.reduce;
    uniforms.uTime.value += reduce ? dt * .15 : dt;

    // cámara: recorre el hilo según el scroll (suavizado)
    const target = S.progress * 0.9;
    smooth += (target - smooth) * (reduce ? 1 : Math.min(1, dt * 2.2));
    const tc = Math.max(0, Math.min(.92, smooth));
    curve.getPointAt(tc, camP);
    curve.getPointAt(Math.min(1, tc + .05), look);
    mouse.x += (mouse.tx - mouse.x) * .04; mouse.y += (mouse.ty - mouse.y) * .04;
    const par = reduce ? 0 : 1;
    camera.position.set(camP.x * .55 + 1.2 + mouse.x * .6 * par, camP.y * .55 + .6 - mouse.y * .4 * par, camP.z + 6);
    camera.lookAt(look.x * .8 - .6, look.y * .8, look.z - 4);
    uniforms.uHead.value = tc;

    // color por capítulo
    const tone = S.tone, i0 = Math.floor(tone), i1 = Math.min(TONES.length - 1, i0 + 1), f = tone - i0;
    const c = TONES[Math.min(i0, TONES.length - 1)].clone().lerp(TONES[i1], f * f * (3 - 2 * f));
    uniforms.uColor.value.lerp(c, .06);

    dust.rotation.z += reduce ? 0 : dt * .004;
    renderer.render(scene, camera);
  };
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });
  requestAnimationFrame(tick);

  // Si el equipo va muy lento (p. ej. sin GPU dedicada), bajamos resolución
  let frames = 0, t0 = performance.now();
  const probe = () => {
    frames++;
    if (performance.now() - t0 < 2000) return requestAnimationFrame(probe);
    const fps = frames / ((performance.now() - t0) / 1000);
    if (fps < 35) renderer.setPixelRatio(.75), resize();
  };
  requestAnimationFrame(probe);
}
