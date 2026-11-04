/* La Llegada del Mesías · interacción (sin dependencias, móvil primero) */
(() => {
  const root = document.documentElement;
  const state = window.MESIAS = { progress: 0, tone: 0, reduce: false, sound: false };
  const $ = (s) => document.querySelector(s);

  /* ---------- Movimiento reducido ---------- */
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const btnMotion = $('#btn-motion');
  const setReduce = (v) => {
    state.reduce = v;
    root.classList.toggle('reduce-motion', v);
    btnMotion.setAttribute('aria-pressed', String(v));
    btnMotion.textContent = v ? 'Movimiento reducido · activado' : 'Reducir movimiento';
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
    [73.42, 110, 146.83, 185, 220].forEach((f, i) => {           // Re mayor abierto
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
  const btnSound = $('#btn-sound');
  const setSound = (v) => {
    state.sound = v;
    btnSound.setAttribute('aria-pressed', String(v));
    btnSound.setAttribute('aria-label', v ? 'Apagar sonido' : 'Encender sonido');
    if (v) startAudio();
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(v ? 0.55 : 0, ctx.currentTime, 0.8);
    }
  };
  btnSound.addEventListener('click', () => setSound(!state.sound));
  // campanilla al cumplirse una promesa
  const chime = (n) => {
    if (!state.sound || !ctx) return;
    const notes = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];
    [notes[n % 6], notes[n % 6] * 2].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(i ? .03 : .09, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 2.4);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 2.5);
    });
  };
  const vibrate = (ms) => { try { if (!state.reduce && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  /* ---------- Umbral ---------- */
  const gate = $('#gate');
  const enter = (withSound) => {
    setSound(withSound);
    gate.classList.add('is-gone');
    document.body.classList.remove('is-gated');
    setTimeout(() => document.querySelectorAll('#inicio .line, #inicio .reveal').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), i * 120)), 300);
  };
  gate.addEventListener('click', (e) => { const b = e.target.closest('[data-enter]'); if (b) enter(b.dataset.enter === 'sound'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !gate.classList.contains('is-gone')) enter(false); });
  gate.querySelector('button').focus({ preventScroll: true });

  /* ---------- Índice ---------- */
  const menu = $('#menu'), btnMenu = $('#btn-menu');
  const toggleMenu = (open) => {
    menu.hidden = !open; btnMenu.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('a').focus();
  };
  btnMenu.addEventListener('click', () => toggleMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) toggleMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { toggleMenu(false); btnMenu.focus(); } });

  /* ---------- Revelados ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  document.querySelectorAll('main .reveal, main .h2').forEach(el => { if (!el.closest('#inicio')) io.observe(el); });

  /* ---------- Promesas ---------- */
  const DATA = [
    { at: 'Génesis 3, 15', era: 'El primer anuncio · Protoevangelio', p: 'La descendencia de la mujer aplastará la cabeza de la serpiente.',
      nt: 'Gálatas 4, 4 · Mateo 1, 20', c: 'Nacido de mujer, Jesús vence al mal y al pecado original.' },
    { at: 'Isaías 7, 14', era: 'Profeta Isaías · siglo VIII a.C.', p: 'La Virgen concebirá y dará a luz un hijo, y le pondrá por nombre Emmanuel.',
      nt: 'Mateo 1, 18 · Lucas 1, 26-35', c: 'María concibe por obra del Espíritu Santo: Dios con nosotros.' },
    { at: 'Génesis 22, 18', era: 'Promesa a Abrahán · tiempo de los patriarcas', p: 'En tu descendencia serán bendecidas todas las naciones de la tierra.',
      nt: 'Mateo 1, 1 · Gálatas 3, 16', c: 'Jesús, hijo de Abrahán, trae la bendición de la salvación a todos los pueblos.' },
    { at: '2 Samuel 7, 12-16', era: 'Promesa a David · hacia el año 1000 a.C.', p: 'Afirmaré tu linaje y tu trono durará para siempre.',
      nt: 'Lucas 1, 32-33 · Mateo 1, 1', c: 'El Hijo de David recibe un Reino que no tendrá fin.' },
    { at: 'Miqueas 5, 2', era: 'Profeta Miqueas · siglo VIII a.C.', p: 'De ti, Belén, la más pequeña, saldrá el que ha de gobernar a Israel.',
      nt: 'Mateo 2, 1 · Lucas 2, 4-7', c: 'Jesús nace en Belén de Judá, cuna del Mesías.' },
    { at: 'Isaías 53, 4-5', era: 'Profeta Isaías · el Siervo doliente', p: 'Él cargó con nuestros dolores; fue herido por nuestras rebeliones.',
      nt: 'Marcos 10, 45 · Mateo 26, 28', c: 'Jesús entrega su vida en la cruz: redención para todos.' },
  ];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const flipIcon = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  const list = $('#promesas');
  list.innerHTML = DATA.map((d, i) => `
    <li class="promesa reveal">
      <span class="mojon" aria-hidden="true">${ROMAN[i]}</span>
      <button class="card" aria-pressed="false" aria-label="Promesa ${ROMAN[i]}: ${d.at}. Toca para ver su cumplimiento">
        <span class="card__inner">
          <span class="face face--front">
            <img src="img/at${i + 1}.webp" alt="" width="408" height="228" loading="lazy" draggable="false">
            <span class="face__body">
              <span class="face__label">Promesa · Antiguo Testamento</span>
              <span class="face__ref">${d.at}</span>
              <span class="face__era">${d.era}</span>
              <span class="face__txt">«${d.p}»</span>
              <span class="face__cta">${flipIcon} Toca para ver cómo se cumple</span>
            </span>
          </span>
          <span class="face face--back" aria-hidden="true">
            <img src="img/nt${i + 1}.webp" alt="" width="408" height="228" loading="lazy" draggable="false">
            <span class="face__body">
              <span class="seal"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2"/></svg> Cumplida en Jesús</span>
              <span class="face__label">Nuevo Testamento</span>
              <span class="face__ref">${d.nt}</span>
              <span class="face__txt">${d.c}</span>
              <span class="face__cta">${flipIcon} Volver a la promesa</span>
            </span>
          </span>
        </span>
      </button>
    </li>`).join('');
  list.querySelectorAll('.promesa').forEach(el => io.observe(el));

  const dots = $('.tally__dots'); dots.innerHTML = DATA.map(() => '<i></i>').join('');
  const tallyN = $('#tally-n'), endMsg = $('#promesas-end');
  const done = new Set();
  list.addEventListener('click', (e) => {
    const card = e.target.closest('.card'); if (!card) return;
    const li = card.closest('.promesa'), i = [...list.children].indexOf(li);
    const on = card.getAttribute('aria-pressed') !== 'true';
    card.setAttribute('aria-pressed', String(on));
    card.querySelector('.face--front').setAttribute('aria-hidden', String(on));
    card.querySelector('.face--back').setAttribute('aria-hidden', String(!on));
    card.setAttribute('aria-label', on ? `Promesa ${ROMAN[i]} cumplida: ${DATA[i].nt}. ${DATA[i].c} Toca para volver a la promesa`
                                       : `Promesa ${ROMAN[i]}: ${DATA[i].at}. Toca para ver su cumplimiento`);
    if (on && !done.has(i)) {
      done.add(i); li.classList.add('is-done'); chime(i); vibrate(18);
      dots.children[i].classList.add('on'); tallyN.textContent = done.size;
      if (done.size === DATA.length) { endMsg.classList.add('is-on'); chime(5); }
    }
  });

  /* ---------- Progreso, capítulo actual y tono de la luz ---------- */
  const pct = $('#pct'), rail = $('#rail-fill'), whereN = $('#where-n'), whereT = $('#where-t');
  const tones = [...document.querySelectorAll('[data-tone]')];
  let ticking = false, lastCur = -1;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    state.progress = p;
    pct.textContent = Math.round(p * 100);
    rail.style.transform = `scaleX(${p})`;
    const mid = scrollY + innerHeight * 0.5;
    let tone = 0;
    tones.forEach((s, i) => { if (mid >= s.offsetTop) tone = i + Math.min(1, (mid - s.offsetTop) / s.offsetHeight) * 0.999; });
    state.tone = Math.min(tone, tones.length - 1);
    const cur = Math.floor(state.tone);
    if (cur !== lastCur) { lastCur = cur; whereN.textContent = String(cur).padStart(2, '0'); whereT.textContent = tones[cur].dataset.name; }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();
})();
