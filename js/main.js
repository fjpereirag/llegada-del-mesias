/* La Llegada del Mesías · interacción (sin dependencias) */
(() => {
  const root = document.documentElement;
  const state = window.MESIAS = { progress: 0, tone: 0, reduce: false, sound: false };

  /* ---------- Movimiento reducido ---------- */
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const btnMotion = document.getElementById('btn-motion');
  const setReduce = (v) => {
    state.reduce = v;
    root.classList.toggle('reduce-motion', v);
    btnMotion.setAttribute('aria-pressed', String(v));
    try { localStorage.setItem('mesias-reduce', v ? '1' : '0'); } catch (e) {}
  };
  let saved = null; try { saved = localStorage.getItem('mesias-reduce'); } catch (e) {}
  setReduce(saved ? saved === '1' : mq.matches);
  btnMotion.addEventListener('click', () => setReduce(!state.reduce));

  /* ---------- Sonido: acorde suave sintetizado (sin archivos) ---------- */
  let ctx, master;
  const startAudio = () => {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    master.connect(lp).connect(ctx.destination);
    // Re mayor abierto: D2 A2 D3 F#3 A3
    [73.42, 110, 146.83, 185, 220].forEach((f, i) => {
      [-4, 4].forEach(det => {
        const o = ctx.createOscillator(); o.type = i < 2 ? 'sine' : 'triangle';
        o.frequency.value = f; o.detune.value = det;
        const g = ctx.createGain(); g.gain.value = 0.05 / (i + 1);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
        const lg = ctx.createGain(); lg.gain.value = 0.02 / (i + 1);
        lfo.connect(lg).connect(g.gain); lfo.start();
        o.connect(g).connect(master); o.start();
      });
    });
  };
  const btnSound = document.getElementById('btn-sound');
  const setSound = (v) => {
    state.sound = v;
    btnSound.setAttribute('aria-pressed', String(v));
    btnSound.querySelector('span').textContent = v ? 'sí' : 'no';
    if (v) startAudio();
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(v ? 0.55 : 0, ctx.currentTime, 0.8);
    }
  };
  btnSound.addEventListener('click', () => setSound(!state.sound));
  // Sonido de papel al pasar página
  const tear = () => {
    if (!state.sound || !ctx) return;
    const len = 0.35, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) { const t = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2) * (Math.random() < 0.3 ? 1 : 0.4); }
    const s = ctx.createBufferSource(); s.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = 0.18;
    s.connect(bp).connect(g).connect(ctx.destination); s.start();
  };

  /* ---------- Umbral ---------- */
  const gate = document.getElementById('gate');
  const firstBtn = gate.querySelector('button'); firstBtn && firstBtn.focus({ preventScroll: true });
  gate.addEventListener('click', (e) => {
    const b = e.target.closest('[data-enter]'); if (!b) return;
    setSound(b.dataset.enter === 'sound');
    gate.classList.add('is-gone');
    document.body.classList.remove('is-gated');
    window.dispatchEvent(new Event('mesias:enter'));
    setTimeout(() => revealHero(), 300);
  });
  const revealHero = () => document.querySelectorAll('#inicio .line, #inicio .reveal').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), i * 120));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !gate.classList.contains('is-gone')) gate.querySelector('[data-enter="silent"]').click(); });

  /* ---------- Revelados ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  document.querySelectorAll('main .reveal:not(#inicio *), main .h2').forEach(el => io.observe(el));

  /* ---------- Progreso, capítulo activo y tono de la luz ---------- */
  const pct = document.getElementById('pct'), rail = document.getElementById('rail-fill');
  const tones = [...document.querySelectorAll('[data-tone]')];
  const navLinks = [...document.querySelectorAll('.hud__nav a')];
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    state.progress = p;
    pct.textContent = Math.round(p * 100);
    rail.style.transform = `scaleX(${p})`;
    // tono continuo: posición dentro de las secciones con data-tone
    const mid = scrollY + innerHeight * 0.5;
    let tone = 0;
    tones.forEach((s, i) => {
      const top = s.offsetTop, h = s.offsetHeight;
      if (mid >= top) tone = i + Math.min(1, (mid - top) / h) * 0.999;
    });
    state.tone = Math.min(tone, tones.length - 1);
    const cur = Math.floor(state.tone);
    navLinks.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + tones[cur].id)));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();

  /* ---------- Promesa: mazo de páginas ---------- */
  const DATA = [
    ['Génesis 3, 15', 'La descendencia de la mujer aplastará al mal', 'Gálatas 4, 4 · Mateo 1, 20', 'Victoria sobre el pecado original'],
    ['Isaías 7, 14', 'La Virgen dará a luz a Emmanuel', 'Mateo 1, 18 · Lucas 1, 26-35', 'Jesús revelado como Dios con nosotros'],
    ['Génesis 22, 18', 'En tu descendencia serán bendecidas todas las naciones', 'Mateo 1, 1 · Gálatas 3, 16', 'Bendición salvífica para todos los pueblos'],
    ['2 Samuel 7, 12-16', 'Un hijo del linaje de David reinará para siempre', 'Lucas 1, 32-33 · Mateo 1, 1', 'Un Reino que no tendrá fin'],
    ['Miqueas 5, 2', 'De ti, Belén, saldrá el que ha de gobernar', 'Mateo 2, 1 · Lucas 2, 4-7', 'Belén, cuna del Mesías'],
    ['Isaías 53, 4-5', 'El Siervo doliente, herido por nuestras rebeliones', 'Marcos 10, 45 · Mateo 26, 28', 'Redención universal por el sacrificio de la cruz'],
  ];
  const track = document.getElementById('deck-track');
  const bridge = `<div class="page__bridge" aria-hidden="true"><svg viewBox="0 0 100 400" preserveAspectRatio="none"><path d="M0 120 C 40 120, 30 200, 50 200 S 60 280, 100 280"/><circle cx="0" cy="120" r="4"/><circle cx="100" cy="280" r="4"/></svg></div>`;
  track.innerHTML = DATA.map((d, i) => `
    <article class="page" data-pos="next" role="group" aria-roledescription="página" aria-label="${i + 1} de ${DATA.length}">
      <div class="page__side">
        <img src="img/at${i + 1}.webp" alt="" width="408" height="228" loading="lazy" draggable="false">
        <p class="page__label">Profecía · Antiguo Testamento</p>
        <p class="page__ref">${d[0]}</p>
        <p class="page__txt">${d[1]}</p>
      </div>
      ${bridge}
      <div class="page__side">
        <img src="img/nt${i + 1}.webp" alt="" width="408" height="228" loading="lazy" draggable="false">
        <p class="page__label">Cumplimiento · Nuevo Testamento</p>
        <p class="page__ref">${d[2]}</p>
        <p class="page__txt">${d[3]}</p>
      </div>
      <span class="page__no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
    </article>`).join('');
  const pages = [...track.children];
  const iEl = document.getElementById('deck-i'), prev = document.getElementById('deck-prev'), next = document.getElementById('deck-next');
  document.getElementById('deck-n').textContent = String(pages.length).padStart(2, '0');
  let idx = 0;
  const render = () => {
    pages.forEach((p, i) => {
      p.dataset.pos = i < idx ? 'prev' : i === idx ? 'current' : 'next';
      p.classList.toggle('peek', i === idx + 1);
      p.style.zIndex = String(pages.length - i);
      p.setAttribute('aria-hidden', String(i !== idx));
      p.style.transform = '';
    });
    iEl.textContent = String(idx + 1).padStart(2, '0');
    prev.disabled = idx === 0; next.disabled = idx === pages.length - 1;
    // altura en móvil: la página actual manda
    if (innerWidth <= 720) track.style.height = pages[idx].offsetHeight + 'px'; else track.style.height = '';
  };
  const go = (n) => { const t = Math.max(0, Math.min(pages.length - 1, n)); if (t !== idx) { idx = t; tear(); render(); } };
  prev.addEventListener('click', () => go(idx - 1));
  next.addEventListener('click', () => go(idx + 1));
  document.getElementById('deck').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { go(idx - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { go(idx + 1); e.preventDefault(); }
  });
  // Arrastre
  let x0 = null, dx = 0, y0 = 0, locked = null;
  track.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; dx = 0; locked = null; });
  addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (locked === null && (Math.abs(dx) > 8 || Math.abs(e.clientY - y0) > 8)) locked = Math.abs(dx) > Math.abs(e.clientY - y0) ? 'x' : 'y';
    if (locked === 'x') {
      const p = pages[idx]; p.style.transition = 'none';
      p.style.transform = `translateX(${dx}px) rotate(${dx / 60}deg)`;
    }
  });
  const end = () => {
    if (x0 === null) return;
    const p = pages[idx]; p.style.transition = '';
    if (locked === 'x' && dx < -70) go(idx + 1);
    else if (locked === 'x' && dx > 70) go(idx - 1);
    else render();
    x0 = null;
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  addEventListener('resize', render);
  render();
})();
