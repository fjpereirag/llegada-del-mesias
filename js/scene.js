/* La Llegada del Mesías · «Un camino hacia Dios» (Three.js)
   Un sendero de piedra sube entre colinas nocturnas hacia una gran luz.
   Al hacer scroll caminas por él: las lámparas se encienden a tu paso y la luz crece.
   Pensado para móvil: geometría ligera, DPR ≤ 1.5, pausa fuera de pestaña, respaldo sin WebGL. */
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
  const small = Math.min(innerWidth, innerHeight) < 720;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || small;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.25 : 1.5));
  const BG = new THREE.Color(0x0B0E14);
  renderer.setClearColor(BG, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 900);

  /* ---------- El camino ---------- */
  const L = 300;                                     // longitud del recorrido
  const px = z => Math.sin(z * 0.022) * 9 + Math.sin(z * 0.057) * 3;
  const py = z => Math.pow(-z / L, 1.3) * 22;        // sube suavemente hacia la cumbre
  const pts = [];
  for (let i = 0; i <= 60; i++) { const z = -i * (L / 60); pts.push(new THREE.Vector3(px(z), py(z), z)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const GOAL = new THREE.Vector3(px(-L), py(-L) + 16, -L - 45);

  /* ---------- Ruido para el relieve ---------- */
  const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, z) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  };
  const fbm = (x, z) => vnoise(x, z) * .55 + vnoise(x * 2.1, z * 2.1) * .3 + vnoise(x * 4.3, z * 4.3) * .15;

  const TONES = [0xF4DFA8, 0xF6E3B4, 0xE9C77E, 0xF2A060, 0xFFF4DC].map(c => new THREE.Color(c));
  const U = {
    uTime: { value: 0 }, uHead: { value: 0 }, uLight: { value: TONES[0].clone() },
    uGoal: { value: GOAL }, uFog: { value: BG }, uCam: { value: new THREE.Vector3() }
  };
  const fogChunk = `
    vec3 applyFog(vec3 col, vec3 wp){
      float d = distance(wp, uCam);
      float f = 1. - exp(-pow(d*.0105, 1.6));
      // el horizonte se tiñe de la luz hacia la meta
      vec3 toG = normalize(uGoal - uCam); vec3 toP = normalize(wp - uCam);
      float g = pow(max(dot(toG,toP),0.), 18.);
      vec3 fogC = mix(uFog + vec3(.03,.035,.045), uLight*.55, g*.6);
      return mix(col, fogC, clamp(f,0.,1.));
    }`;

  /* ---------- Colinas ---------- */
  const SEG_X = lowPower ? 70 : 100, SEG_Z = lowPower ? 150 : 220;
  const tg = new THREE.PlaneGeometry(220, L + 160, SEG_X, SEG_Z);
  tg.rotateX(-Math.PI / 2); tg.translate(0, 0, -(L + 160) / 2 + 40);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i), zc = Math.min(0, Math.max(-L - 40, z));
    const d = Math.abs(x - px(zc));
    const valley = Math.min(1, Math.max(0, (d - 3.5) / 40));
    const h = py(zc) - .45 + valley * valley * 14 + fbm(x * .05, z * .05) * (0.25 + valley * 12) + (d > 60 ? (d - 60) * .25 : 0);
    tp.setY(i, h);
  }
  tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `varying vec3 vW; varying vec3 vN;
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vN=normal; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uLight; uniform vec3 uGoal; uniform vec3 uFog; uniform vec3 uCam; varying vec3 vW; varying vec3 vN;
      ${fogChunk}
      void main(){
        vec3 n = normalize(vN);
        vec3 ld = normalize(uGoal - vW);
        float rim = pow(max(dot(n, ld), 0.), 2.);
        float moon = max(dot(n, normalize(vec3(-.4,.8,.3))),0.);
        vec3 base = vec3(.022,.027,.04) + vec3(.02,.025,.04)*moon;
        vec3 col = base + uLight*rim*.10;
        gl_FragColor = vec4(applyFog(col, vW), 1.);
      }`
  }));
  scene.add(terrain);

  /* ---------- El camino: un hilo de luz dorada que serpentea hacia Él ---------- */
  const ribbon = (N, W, lift) => {
    const rp = new Float32Array((N + 1) * 2 * 3), ruv = new Float32Array((N + 1) * 2 * 2), idx = [];
    const P = new THREE.Vector3(), T = new THREE.Vector3(), SIDE = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= N; i++) {
      const t = i / N; curve.getPointAt(t, P); curve.getTangentAt(t, T);
      SIDE.crossVectors(T, UP).normalize();
      for (let s = 0; s < 2; s++) {
        const k = i * 2 + s, sg = s ? 1 : -1;
        rp[k * 3] = P.x + SIDE.x * W * sg; rp[k * 3 + 1] = P.y + lift; rp[k * 3 + 2] = P.z + SIDE.z * W * sg;
        ruv[k * 2] = s; ruv[k * 2 + 1] = t;
      }
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(ruv, 2));
    g.setIndex(idx); return g;
  };
  const pathFrag = (glow) => `uniform vec3 uLight; uniform vec3 uCam; uniform float uHead; uniform float uTime;
      varying vec2 vUv; varying vec3 vW;
      void main(){
        float x = (vUv.x - .5) * 2.;
        float prof = ${glow ? 'exp(-x*x*3.)*.22' : 'exp(-x*x*22.)*1.3 + exp(-x*x*4.)*.35'};
        // pulsos de luz que suben hacia la meta
        float f = fract(vUv.y*9. - uTime*.045);
        float pulse = smoothstep(0.,.03,f)*(1.-smoothstep(.03,.22,f));
        float ahead = smoothstep(uHead-.01, uHead+.02, vUv.y);
        float d = distance(vW, uCam);
        float fade = smoothstep(1.2, 6., d) * (1. - smoothstep(200., 420., d)*.6);
        float k = prof * (.75 + pulse*.9*ahead) * fade * (.55 + .45*ahead);
        vec3 col = mix(uLight, vec3(1.,.97,.9), clamp(prof-.6,0.,1.));
        gl_FragColor = vec4(col*k, k);
      }`;
  const pathVert = `varying vec2 vUv; varying vec3 vW;
      void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
  const NR = lowPower ? 600 : 900;
  [[1.6, .05, true], [.16, .07, false]].forEach(([w, lift, glow]) => {
    const m = new THREE.Mesh(ribbon(NR, w, lift), new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: pathVert, fragmentShader: pathFrag(glow)
    }));
    m.renderOrder = 3; scene.add(m);
  });

  /* ---------- Chispas que flotan sobre el camino ---------- */
  const SP = lowPower ? 500 : 900;
  const spp = new Float32Array(SP * 3), spt = new Float32Array(SP), sps = new Float32Array(SP);
  const P = new THREE.Vector3();
  for (let i = 0; i < SP; i++) {
    const t = Math.random(); curve.getPointAt(t, P);
    spp[i * 3] = P.x + (Math.random() - .5) * 3; spp[i * 3 + 1] = P.y + .2 + Math.random() * 2.2; spp[i * 3 + 2] = P.z + (Math.random() - .5) * 3;
    spt[i] = t; sps[i] = Math.random();
  }
  const spg = new THREE.BufferGeometry();
  spg.setAttribute('position', new THREE.BufferAttribute(spp, 3));
  spg.setAttribute('aT', new THREE.BufferAttribute(spt, 1));
  spg.setAttribute('aS', new THREE.BufferAttribute(sps, 1));
  const pr = renderer.getPixelRatio();
  scene.add(new THREE.Points(spg, new THREE.ShaderMaterial({
    uniforms: { ...U, uPx: { value: 26 * pr } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aT; attribute float aS; uniform float uTime; uniform float uPx; uniform float uHead; varying float vA;
      void main(){
        vec3 p = position; p.y += sin(uTime*.5 + aS*40.)*.15; p.x += cos(uTime*.3 + aS*20.)*.12;
        vec4 mv = modelViewMatrix*vec4(p,1.);
        float near = smoothstep(1.5, 5., -mv.z) * (1. - smoothstep(40., 140., -mv.z));
        vA = near * (.35 + .65*aS) * (.6 + .4*sin(uTime*2. + aS*90.));
        gl_PointSize = uPx * (.5 + aS) / -mv.z;
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `uniform vec3 uLight; varying float vA;
      void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d); gl_FragColor = vec4(uLight*a*vA, a*vA); }`
  })));

  /* ---------- Nubes y bruma (como en georgedo: velos entre los que pasa la luz) ---------- */
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `attribute float aSeed; varying vec2 vUv; varying vec3 vW; varying float vSeed;
      void main(){ vUv=uv; vSeed=aSeed; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uLight; uniform vec3 uGoal; uniform vec3 uCam; uniform float uTime; uniform float uHead;
      varying vec2 vUv; varying vec3 vW; varying float vSeed;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float v=0., a=.55; for(int i=0;i<4;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }
      void main(){
        vec2 p = vUv*2.6 + vSeed*13.;
        p += vec2(uTime*.012, -uTime*.006);
        float c = fbm(p + fbm(p*1.4)*.8);
        vec2 q = vUv - .5; float r = length(q*vec2(1.,1.6));
        float shape = smoothstep(.5, .12, r);
        float a = smoothstep(.36, .78, c) * shape;
        // luz cálida desde la meta y desde el camino
        float toward = pow(max(dot(normalize(uGoal - vW), normalize(uCam - vW))*-1.,0.),2.);
        float d = distance(vW, uCam);
        vec3 cool = vec3(.16,.18,.23), warm = uLight*.55;
        vec3 col = mix(cool, warm, clamp(toward*.6 + (1.-c)*.15, 0., 1.)) * (.55 + c*.6);
        a *= smoothstep(10., 40., d) * (1. - smoothstep(300., 560., d)) * .85;
        gl_FragColor = vec4(col, a);
      }`
  });
  const CN = lowPower ? 26 : 40;
  const cloudGeo = new THREE.PlaneGeometry(1, 1);
  const clouds = [];
  for (let i = 0; i < CN; i++) {
    const t = Math.min(1, (i + Math.random()) / CN * 1.08); curve.getPointAt(Math.min(1, t), P);
    const side = (i % 2 ? 1 : -1) * (4 + Math.random() * 18);
    const g = cloudGeo.clone();
    const seed = new Float32Array(4).fill(Math.random()); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.Mesh(g, cloudMat);
    const sc = 18 + Math.random() * 30;
    m.scale.set(sc * 1.8, sc, 1);
    m.position.set(P.x + side, P.y + 1 + Math.random() * 7, P.z - Math.random() * 6);
    m.userData.below = Math.random() < .35;     // algunas nubes yacen bajo el camino
    if (m.userData.below) { m.position.set(P.x + side * .6, P.y - 2.5, P.z); m.rotation.x = -Math.PI / 2.3; m.scale.set(sc * 2.2, sc * 1.4, 1); }
    m.renderOrder = 2; scene.add(m); clouds.push(m);
  }

  /* ---------- Cielo y estrellas ---------- */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uLight; uniform vec3 uFog; varying vec3 vD;
      void main(){
        float up = clamp(vD.y*1.4+.1,0.,1.);
        vec3 col = mix(uFog*1.25 + vec3(.0,.01,.03), vec3(.012,.018,.035), up);
        float g = pow(max(dot(vD, normalize(vec3(0.,.12,-1.))),0.), 10.);
        col += uLight*g*.22;
        gl_FragColor = vec4(col,1.);
      }`
  }));
  sky.renderOrder = -1; scene.add(sky);

  const SN = lowPower ? 900 : 1600;
  const sp = new Float32Array(SN * 3), ss = new Float32Array(SN);
  for (let i = 0; i < SN; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * .92); // hemisferio superior
    sp[i * 3] = Math.sin(ph) * Math.cos(th) * 600; sp[i * 3 + 1] = Math.cos(ph) * 600 + 20; sp[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 600;
    ss[i] = Math.random();
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aS', new THREE.BufferAttribute(ss, 1));
  const stars = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPx: { value: pr } }, transparent: true, depthWrite: false,
    vertexShader: `attribute float aS; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vA = .25 + .75*aS*(.6+.4*sin(uTime*1.5+aS*60.)); gl_PointSize = (1. + aS*2.2)*uPx; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor = vec4(vec3(.92,.9,.85), smoothstep(.5,.1,d)*vA); }`
  }));
  scene.add(stars);

  /* ---------- La Luz (meta del camino) ---------- */
  const lightMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uLight: U.uLight, uK: { value: 0 }, uR: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv*2.-1.; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uTime; uniform vec3 uLight; uniform float uK; uniform float uR; varying vec2 vUv;
      void main(){
        float d = length(vUv); float a = atan(vUv.y, vUv.x);
        float core = exp(-d*d*260.)*1.4 + exp(-d*26.)*.7;
        float halo = exp(-d*5.5)*.55;
        float r1 = pow(abs(sin(a*12. + uR)), 18.), r2 = pow(abs(sin(a*7. - uR*.6 + 1.3)), 30.);
        float rays = (r1*.6 + r2*.5) * exp(-d*3.2) * (.35 + uK*.65);
        vec3 col = mix(uLight, vec3(1.,.99,.95), clamp(core,0.,1.));
        float alpha = (core + halo + rays) * smoothstep(1., .55, d);
        gl_FragColor = vec4(col*alpha, alpha);
      }`
  });
  const light = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lightMat);
  // la cumbre: una colina con una cruz recortada contra la Luz
  const dark = new THREE.MeshBasicMaterial({ color: 0x07090D, fog: false });
  const summit = new THREE.Group();
  const hill = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dark);
  hill.scale.set(1.9, .36, 1.2); summit.add(hill);
  const v = new THREE.Mesh(new THREE.BoxGeometry(.9, 9, .9), dark); v.position.y = 10.6 + 4.5; summit.add(v);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(5.4, .9, .9), dark); hb.position.y = 10.6 + 6.4; summit.add(hb);
  summit.position.set(GOAL.x, py(-L) - 1, -L - 40); scene.add(summit);
  light.position.copy(GOAL); light.renderOrder = 2; scene.add(light);

  /* ---------- Bucle ---------- */
  const look = new THREE.Vector3(), camP = new THREE.Vector3(), tgt = new THREE.Vector3();
  let smooth = 0, visible = true, last = performance.now();
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { tilt.tx = e.clientX / innerWidth - .5; tilt.ty = e.clientY / innerHeight - .5; } }, { passive: true });

  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w < h ? 68 : 55; camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize); resize();

  const tick = (now) => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const reduce = S.reduce;
    U.uTime.value += reduce ? dt * .2 : dt;

    // caminar por el sendero según el scroll
    const target = Math.min(.93, S.progress * .93);
    smooth += (target - smooth) * (reduce ? 1 : Math.min(1, dt * 1.8));
    curve.getPointAt(smooth, camP);
    curve.getPointAt(Math.min(1, smooth + .035), look);
    const bob = reduce ? 0 : Math.sin(smooth * 900) * .025;          // paso suave
    tilt.x += (tilt.tx - tilt.x) * .04; tilt.y += (tilt.ty - tilt.y) * .04;
    camera.position.set(camP.x + tilt.x * .8, camP.y + 1.6 + bob - tilt.y * .3, camP.z + 2.2);
    tgt.copy(look).lerp(GOAL, .30 + smooth * .2); tgt.y += 1.2;
    camera.lookAt(tgt);
    U.uCam.value.copy(camera.position);
    U.uHead.value = smooth;
    sky.position.copy(camera.position); stars.position.copy(camera.position);

    // color de la luz por capítulo
    const tone = S.tone, i0 = Math.min(Math.floor(tone), TONES.length - 1), i1 = Math.min(TONES.length - 1, i0 + 1), f = tone - Math.floor(tone);
    U.uLight.value.lerp(TONES[i0].clone().lerp(TONES[i1], f * f * (3 - 2 * f)), .05);

    // la Luz crece al acercarse
    const k = smooth, breathe = reduce ? 1 : 1 + Math.sin(U.uTime.value * .7) * .04;
    light.quaternion.copy(camera.quaternion);
    light.scale.setScalar((210 + k * 60) * breathe);
    lightMat.uniforms.uK.value = k; lightMat.uniforms.uR.value = reduce ? 0 : U.uTime.value * .05;

    renderer.render(scene, camera);
  };
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });
  requestAnimationFrame(tick);

  // Equipos lentos (sin GPU dedicada): bajar resolución
  let frames = 0, t0 = performance.now();
  const probe = () => {
    frames++;
    if (performance.now() - t0 < 2000) return requestAnimationFrame(probe);
    if (frames / ((performance.now() - t0) / 1000) < 35) { renderer.setPixelRatio(.75); resize(); }
  };
  requestAnimationFrame(probe);
}
