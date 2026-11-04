/* El desarrollador — comportamiento propio */
(function(){
'use strict';
const T = window.Tovel, {$, $$, clamp, reduce} = T;

/* órbita: radio de cada anillo */
const rings = $$('.orbit .ring');
const setR = () => rings.forEach(r => r.style.setProperty('--r', (r.clientWidth/2) + 'px'));
setR(); addEventListener('resize', setR);

/* roles que se escriben solos */
const typed = $('.role .typed');
if(typed){
  const roles = ['Desarrollador full-stack.','Constructor de robots.','Diseñador de circuitos.','Hacker ético.','Fundador de Tovel.'];
  if(reduce) typed.textContent = roles[0];
  else { let r = 0, c = 0, del = false;
    (function tick(){ const w = roles[r]; c += del ? -1 : 1; typed.textContent = w.slice(0, c);
      let d = del ? 32 : 64; if(!del && c === w.length){ del = true; d = 1700; } else if(del && c === 0){ del = false; r = (r+1) % roles.length; d = 300; }
      setTimeout(tick, d); })(); }
}

/* terminal que se escribe al aparecer */
const term = $('#termCode');
if(term){
  const html = term.innerHTML; const plain = term.textContent;
  if(!reduce && 'IntersectionObserver' in window){
    term.textContent = '';
    const io = new IntersectionObserver(es => { if(!es[0].isIntersecting) return; io.disconnect(); let i = 0;
      const step = () => { i += 3; if(i >= plain.length){ term.innerHTML = html; return; } term.textContent = plain.slice(0, i); setTimeout(step, 16); }; step(); }, {threshold:.4});
    io.observe(term);
  }
}

/* sub-pestañas con indicador y seguimiento del scroll */
const sub = $('.subtabs ul');
if(sub){
  const ind = $('.ind', sub), links = $$('a', sub), secs = links.map(a => $(a.getAttribute('href')));
  let cur = null;
  const place = a => { if(!a) return; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`;
    const want = a.offsetLeft - (sub.clientWidth - a.offsetWidth)/2; if(sub.scrollWidth > sub.clientWidth) sub.scrollTo({left:want, behavior: reduce ? 'auto' : 'smooth'}); };
  T.onFrame(() => { const y = innerHeight*.35; let k = 0; secs.forEach((s,i) => { if(s && s.getBoundingClientRect().top < y) k = i; });
    if(links[k] !== cur){ if(cur) cur.classList.remove('on'); cur = links[k]; cur.classList.add('on'); place(cur); } });
  addEventListener('resize', () => place(cur));
}

/* línea de tiempo */
const tl = $('.tl');
if(tl){ const evs = $$('.ev', tl);
  T.onFrame(() => { const r = tl.getBoundingClientRect(); const p = reduce ? 1 : clamp((innerHeight*.7 - r.top)/r.height, 0, 1);
    tl.style.setProperty('--tp', p.toFixed(3)); evs.forEach(e => e.classList.toggle('on', reduce || e.getBoundingClientRect().top < innerHeight*.7)); }); }

/* cintas de herramientas: duplicar para bucle continuo */
$$('.tape .track').forEach(t => t.innerHTML += t.innerHTML);

/* certificados */
const grid = $('#certs');
if(grid){
  const P = '../img/certificados/', PDF = n => P + encodeURIComponent('Andersson EfrainToapanta Velez-' + n + '.pdf');
  const certs = [
    {t:'Introducción a Redes (CCNA v7)', i:'Cisco', d:'15/09/2022', img:'introduccion a redes.png', pdf:PDF('NETWORKING-MATUT-certificate')},
    {t:'Carta de felicitación CCNA v7', i:'Cisco', d:'15/09/2022', img:'Carta.png', pdf:PDF('NETWORKING-MATUT-letter')},
    {t:'NDG Linux Essentials', i:'Cisco', d:'21/03/2022', img:'linux.png', pdf:PDF('LINUX-MATUTINO-2-certificate')},
    {t:'IT Essentials', i:'Cisco', d:'20/09/2021', img:'IT Essentials.png', pdf:PDF('ITE-MATUTINO-1ER-certificate')},
    {t:'Get Connected', i:'Cisco', d:'19/05/2021', img:'get Connected.png', pdf:PDF('GETCONNECTED-MAT-certificate')},
    {t:'Diseño de piezas e impresión 3D', i:'UDLA', d:'19/06/2022', img:'udla3D.png', pdf:PDF('Udla3D')},
    {t:'Prótesis biomecánicas 3D', i:'P4H', d:'10/12/2022', img:'P4HBionic.png', pdf:PDF('P4h-Bionic')}
  ];
  grid.innerHTML = certs.map((c,k) => `<button class="cert" type="button" data-k="${k}" data-i="${c.i}"><div class="th"><img src="${P + encodeURIComponent(c.img)}" alt="" loading="lazy"></div><div class="info"><span class="is">${c.i}</span><h3>${c.t}</h3><time>${c.d}</time></div></button>`).join('');
  // filtro con indicador
  const seg = $('.seg2'), sind = $('.ind', seg), btns = $$('button', seg);
  const placeS = b => { sind.style.width = b.offsetWidth + 'px'; sind.style.transform = `translateX(${b.offsetLeft - 4}px)`; };
  btns.forEach(b => b.addEventListener('click', () => { btns.forEach(x => x.setAttribute('aria-pressed', x === b)); placeS(b);
    $$('.cert', grid).forEach(c => c.classList.toggle('hide', b.dataset.f !== 'all' && c.dataset.i !== b.dataset.f)); }));
  requestAnimationFrame(() => placeS(btns[0])); addEventListener('resize', () => placeS(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
  if(document.fonts) document.fonts.ready.then(() => placeS(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
  // visor
  const ov = $('#lb'), img = $('#lbImg'), ti = $('#lbT'), is = $('#lbI'), pdf = $('#lbPdf'), cnt = $('#lbN');
  let k = 0, last = null;
  const visible = () => $$('.cert', grid).filter(c => !c.classList.contains('hide')).map(c => +c.dataset.k);
  const show = n => { k = n; const c = certs[n]; img.src = P + encodeURIComponent(c.img); img.alt = c.t; ti.textContent = c.t; is.textContent = c.i + ' · ' + c.d; pdf.href = c.pdf;
    const v = visible(); cnt.textContent = (v.indexOf(n) + 1) + ' / ' + v.length; };
  const open = n => { last = document.activeElement; show(n); ov.classList.add('show'); ov.setAttribute('aria-hidden','false'); $('#lbX').focus(); };
  const close = () => { ov.classList.remove('show'); ov.setAttribute('aria-hidden','true'); if(last) last.focus(); };
  const move = d => { const v = visible(); const i = v.indexOf(k); show(v[(i + d + v.length) % v.length]); };
  grid.addEventListener('click', e => { const c = e.target.closest('.cert'); if(c) open(+c.dataset.k); });
  $('#lbX').onclick = close; $('#lbPrev').onclick = () => move(-1); $('#lbNext').onclick = () => move(1);
  ov.addEventListener('click', e => { if(e.target === ov) close(); });
  addEventListener('keydown', e => { if(!ov.classList.contains('show')) return; if(e.key === 'Escape') close(); if(e.key === 'ArrowRight') move(1); if(e.key === 'ArrowLeft') move(-1); });
}
})();
