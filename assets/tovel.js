/* Tovel — comportamiento compartido entre pestañas */
(function(){
'use strict';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = (s,r=document) => r.querySelector(s), $$ = (s,r=document) => [...r.querySelectorAll(s)];
const clamp = (v,a,b) => Math.min(Math.max(v,a),b);
const lerp = (a,b,t) => a + (b-a)*t;
const T = window.Tovel = {reduce, fine, $, $$, clamp, lerp, mouse:{x:innerWidth/2,y:innerHeight/2}, frames:[]};
T.onFrame = fn => T.frames.push(fn);
/* actualiza una variable CSS solo si cambió: cambiarla en un padre recalcula estilos de todos sus hijos */
const varCache = new WeakMap();
T.setVar = (el, name, val) => { let c = varCache.get(el); if(!c){ c = {}; varCache.set(el, c); } if(c[name] !== val){ c[name] = val; el.style.setProperty(name, val); } };

const Y = new Date().getFullYear();
$$('.yr').forEach(e => e.textContent = Y);
$$('[data-years]').forEach(e => e.dataset.to = Y - 2020);
if(!document.getElementById('pre')) document.documentElement.classList.add('page-in');

/* ---------- pestañas: indicador deslizante con resorte ---------- */
const tabs = $('.tabs'), ind = tabs && $('.ind', tabs);
if(tabs){
  const cur = $('a[aria-current="page"]', tabs);
  const place = (a, instant) => { if(!a){ ind.style.width = '0px'; return; } if(instant) ind.style.transition = 'none';
    ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`;
    if(instant) requestAnimationFrame(() => ind.style.transition = ''); };
  place(cur, true);
  if(cur) ind.style.background = 'var(--bone)';
  $$('a', tabs).forEach(a => {
    a.addEventListener('pointerenter', () => { if(!cur){ ind.style.background = 'rgba(244,238,228,.12)'; } place(cur ? cur : a); });
    a.addEventListener('click', () => { place(a); });
  });
  tabs.addEventListener('pointerleave', () => place(cur));
  addEventListener('resize', () => place(cur, true));
  if(document.fonts) document.fonts.ready.then(() => place(cur, true));
}

/* ---------- nav ---------- */
const nav = $('#nav'); let lastY = scrollY;
T.onFrame(() => {
  const sy = scrollY;
  nav.classList.toggle('solid', sy > 30);
  if(sy > lastY + 6 && sy > innerHeight*.5) nav.classList.add('hide');
  else if(sy < lastY - 6) nav.classList.remove('hide');
  lastY = sy;
});

/* ---------- cursor y botones magnéticos (resortes) ---------- */
addEventListener('pointermove', e => { T.mouse.x = e.clientX; T.mouse.y = e.clientY; }, {passive:true});
const cur = $('#cur');
if(fine && !reduce && cur){
  const c = {x:T.mouse.x,y:T.mouse.y,vx:0,vy:0};
  document.addEventListener('pointerover', e => { if(e.target.closest('a,button,[role="slider"],input,select,textarea,.drag')) cur.classList.add('big'); });
  document.addEventListener('pointerout', e => { if(e.target.closest('a,button,[role="slider"],input,select,textarea,.drag')) cur.classList.remove('big'); });
  T.onFrame(() => { c.vx += (T.mouse.x - c.x)*.32; c.vy += (T.mouse.y - c.y)*.32; c.vx *= .55; c.vy *= .55; c.x += c.vx; c.y += c.vy; cur.style.transform = `translate3d(${c.x}px,${c.y}px,0)`; });
  $$('.mag').forEach(el => {
    const s = {x:0,y:0,tx:0,ty:0,vx:0,vy:0};
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); s.tx = (e.clientX - r.left - r.width/2)*.25; s.ty = (e.clientY - r.top - r.height/2)*.32; });
    el.addEventListener('pointerleave', () => { s.tx = 0; s.ty = 0; });
    T.onFrame(() => { s.vx += (s.tx - s.x)*.18; s.vy += (s.ty - s.y)*.18; s.vx *= .62; s.vy *= .62; s.x += s.vx; s.y += s.vy;
      if(Math.abs(s.x) > .05 || Math.abs(s.y) > .05 || s.tx || s.ty) el.style.transform = `translate(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px)`; });
  });
  $$('.tilt').forEach(c => {
    c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); const px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
      c.style.setProperty('--mx', px*100 + '%'); c.style.setProperty('--my', py*100 + '%');
      c.style.transform = `perspective(900px) rotateX(${(.5-py)*5}deg) rotateY(${(px-.5)*7}deg)`; });
    c.addEventListener('pointerleave', () => c.style.transform = '');
  });
}

/* ---------- títulos que suben palabra por palabra ---------- */
$$('[data-split]').forEach(h => {
  let i = 0;
  const walk = node => [...node.childNodes].forEach(n => {
    if(n.nodeType === 3){ const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(w => { if(!w) return; if(/^\s+$/.test(w)){ frag.appendChild(document.createTextNode(w)); return; }
        const o = document.createElement('span'); o.className = 'split'; const s = document.createElement('span'); s.textContent = w; s.style.animationDelay = (.08*i++ + .1) + 's'; o.appendChild(s); frag.appendChild(o); });
      n.replaceWith(frag);
    } else if(n.nodeType === 1 && n.tagName !== 'BR') walk(n);
  });
  walk(h);
});

/* ---------- aparición y contadores ---------- */
if('IntersectionObserver' in window && !reduce){
  /* un elemento revelado con clip-path empieza invisible para IntersectionObserver: se observa su contenedor */
  const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ (e.target._rv || e.target).classList.add('in'); io.unobserve(e.target); } }), {threshold:.12, rootMargin:'0px 0px -6% 0px'});
  $$('.rv').forEach((el,i) => { el.style.transitionDelay = (i%3)*80 + 'ms'; if(el.classList.contains('ph')){ const w = el.parentElement; w._rv = el; io.observe(w); } else io.observe(el); });
  const co = new IntersectionObserver(es => es.forEach(e => { if(!e.isIntersecting) return; co.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, t0 = performance.now();
    (function st(t){ const p = clamp((t-t0)/1500,0,1); el.textContent = Math.round(to*(1-Math.pow(1-p,4))); if(p<1) requestAnimationFrame(st); })(t0); }), {threshold:.6});
  $$('.cnt').forEach(c => co.observe(c));
} else { $$('.rv').forEach(el => el.classList.add('in')); $$('.cnt').forEach(c => c.textContent = c.dataset.to); }

/* ---------- manifiesto ---------- */
const man = $('#man');
if(man){
  const hot = ['software','funciona,','enciende','negocios'];
  man.innerHTML = man.textContent.trim().split(/\s+/).map(w => `<span class="w${hot.includes(w.toLowerCase()) ? ' hot' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', man);
  if(reduce) words.forEach(w => w.classList.add('lit'));
  else T.onFrame(() => { const r = man.getBoundingClientRect(); const p = clamp((innerHeight*.8 - r.top)/(r.height + innerHeight*.3), 0, 1); const lit = Math.round(p*words.length); words.forEach((w,i) => w.classList.toggle('lit', i < lit)); });
}

/* ---------- proceso ---------- */
const proc = $('#process');
if(proc){ const ps = $$('.pstep', proc);
  T.onFrame(() => { const r = proc.getBoundingClientRect(); const p = reduce ? 1 : clamp((innerHeight*.85 - r.top)/(innerHeight*.5), 0, 1); T.setVar(proc, '--pp', p.toFixed(2)); ps.forEach((s,i) => s.classList.toggle('on', p*ps.length > i + .15)); }); }

/* ---------- productos en horizontal ---------- */
const hz = $('.hz'), rail = $('#rail');
if(hz && rail){
  const bar = $('.bar', hz), cnt = $('#hzN'), cards = $$('.pc', rail), imgs = cards.map(c => $('.im img', c));
  const size = () => { if(reduce) return; hz.style.height = (innerHeight + Math.max(rail.scrollWidth - innerWidth + 40, 0)) + 'px'; };
  size(); addEventListener('resize', size); addEventListener('load', size);
  if(reduce){ const st = $('.stick', hz); st.style.position = 'relative'; st.style.height = 'auto'; rail.style.overflowX = 'auto'; hz.style.paddingBlock = '40px'; }
  else { let hx = 0, last = performance.now();
    T.onFrame(t => { const dt = Math.min((t-last)/1000,.05); last = t; const r = hz.getBoundingClientRect(); const max = Math.max(rail.scrollWidth - innerWidth + 40, 0);
      const p = clamp(-r.top/(r.height - innerHeight), 0, 1); hx = lerp(hx, p, 1 - Math.pow(.0005, dt));
      rail.style.transform = `translate3d(${(-hx*max).toFixed(1)}px,0,0)`; T.setVar(bar, '--hp', hx.toFixed(3));
      imgs.forEach((im,i) => { if(im) im.style.transform = `translate3d(${((hx*(cards.length-1) - i)*-30).toFixed(1)}px,0,0)`; });
      if(cnt) cnt.textContent = String(Math.min(cards.length, Math.round(hx*(cards.length-1)) + 1)).padStart(2,'0'); }); }
}

/* ---------- trabajos: vista previa flotante ---------- */
const peek = $('#peek');
if(peek && fine && !reduce){
  const img = $('img', peek), pk = {x:0,y:0};
  $$('.work').forEach(w => { w.addEventListener('pointerenter', () => { img.src = w.dataset.img; peek.classList.add('on'); }); w.addEventListener('pointerleave', () => peek.classList.remove('on')); });
  T.onFrame(() => { pk.x = lerp(pk.x, T.mouse.x, .18); pk.y = lerp(pk.y, T.mouse.y, .18); peek.style.left = pk.x + 'px'; peek.style.top = pk.y + 'px'; });
}

/* ---------- marquee ---------- */
$$('.marquee .track').forEach(t => t.innerHTML += t.innerHTML);

/* ---------- formulario ---------- */
const form = $('#cform');
if(form){
  const plan = $('#fPlan'), q = new URLSearchParams(location.search).get('plan');
  if(q) [...plan.options].forEach(o => { if(o.text === q) plan.value = q; });
  const hint = $('#fHint');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const via = (e.submitter && e.submitter.dataset.via) || 'wa';
    const n = $('#fName'), m = $('#fMsg'), mail = $('#fMail');
    [n,m,mail].forEach(x => x.classList.remove('err'));
    const bad = [];
    if(!n.value.trim()) bad.push(n);
    if(!m.value.trim()) bad.push(m);
    if(mail.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value.trim())) bad.push(mail);
    if(bad.length){ bad.forEach(x => x.classList.add('err')); bad[0].focus(); hint.dataset.s = 'err'; hint.textContent = bad[0] === mail ? 'Revisa tu correo: parece incompleto.' : 'Escribe tu nombre y tu idea para poder responderte.'; return; }
    const txt = `${form.dataset.greet || "Hola Tovel"}, soy ${n.value.trim()}.` + (mail.value.trim() ? ` Mi correo: ${mail.value.trim()}.` : '') + `\nMe interesa: ${plan.value}.\n\n${m.value.trim()}`;
    if(via === 'wa') window.open('https://wa.me/593959133066?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    else location.href = 'mailto:anderssontoapanta@gmail.com?subject=' + encodeURIComponent((form.dataset.subject || 'Proyecto Tovel') + ': ' + plan.value) + '&body=' + encodeURIComponent(txt);
    hint.dataset.s = 'ok'; hint.textContent = via === 'wa' ? 'Abriendo WhatsApp con tu mensaje. Solo toca enviar.' : 'Abriendo tu correo con el mensaje listo.';
  });
}

/* ---------- bucle único ---------- */
(function loop(t){ T.frames.forEach(f => f(t)); requestAnimationFrame(loop); })(performance.now());
})();
