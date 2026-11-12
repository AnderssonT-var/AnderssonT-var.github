/* Tovel Labs — módulos interactivos */
(function(){
'use strict';
const T = window.Tovel, {$, $$, clamp, lerp, reduce} = T;

/* ---------- Carrusel: arrastre 1:1, rubber-band, proyección de impulso y resorte ---------- */
function Carousel(root, onChange){
  const view = $('.car-view', root), track = $('.car-track', root), slides = $$('.slide', track);
  const tabs = $$('.car-tabs button', root), pill = $('.car-tabs .pill', root), dotsBox = $('.dots', root);
  const n = slides.length; let i = 0;
  dotsBox.innerHTML = slides.map(() => '<i></i>').join(''); const dots = $$('i', dotsBox);
  const s = {x:0, v:0, target:0, drag:false};
  const W = () => view.clientWidth;
  function go(k, vel){ i = clamp(k, 0, n-1); s.target = -i*W(); if(vel !== undefined) s.v = vel/60;
    tabs.forEach((b,j) => { b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; });
    dots.forEach((d,j) => d.classList.toggle('on', j === i));
    const b = tabs[i]; if(b && pill){ pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`; const tb = b.parentElement; const want = b.offsetLeft - (tb.clientWidth - b.offsetWidth)/2; if(tb.scrollWidth > tb.clientWidth) tb.scrollTo({left: want, behavior: reduce ? 'auto' : 'smooth'}); }
    slides.forEach((sl,j) => sl.setAttribute('aria-hidden', j !== i));
    onChange && onChange(i); }
  tabs.forEach((b,j) => { b.addEventListener('click', () => go(j)); b.addEventListener('keydown', e => { if(e.key === 'ArrowRight'){ go(i+1); tabs[i].focus(); } if(e.key === 'ArrowLeft'){ go(i-1); tabs[i].focus(); } }); });
  $('.prev', root).addEventListener('click', () => go(i-1));
  $('.next', root).addEventListener('click', () => go(i+1));
  // arrastre
  let x0 = 0, start = 0, hist = [], locked = null, y0 = 0;
  view.addEventListener('pointerdown', e => {
    if(e.target.closest('input,button,select,[role="slider"],.nodrag')) return;
    s.drag = true; locked = null; x0 = e.clientX; y0 = e.clientY; start = s.x; hist = [{x:e.clientX,t:performance.now()}];
  });
  view.addEventListener('pointermove', e => {
    if(!s.drag) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if(locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)){ locked = Math.abs(dx) > Math.abs(dy); if(locked) view.setPointerCapture(e.pointerId); else { s.drag = false; return; } }
    if(!locked) return;
    let nx = start + dx; const min = -(n-1)*W();
    if(nx > 0) nx = rubber(nx, W()); else if(nx < min) nx = min - rubber(min - nx, W());
    s.x = nx; s.v = 0; hist.push({x:e.clientX,t:performance.now()}); if(hist.length > 6) hist.shift();
  });
  const end = () => { if(!s.drag) return; s.drag = false; if(!locked) return;
    const a = hist[0], b = hist[hist.length-1]; const vel = (b.t - a.t) > 0 ? (b.x - a.x)/((b.t - a.t)/1000) : 0;
    const projected = s.x + (vel/1000)*.998/(1-.998)*.35;
    go(Math.round(-projected / W()), vel); };
  view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
  function rubber(o, d, c=.55){ return (o*d*c)/(d + c*Math.abs(o)); }
  addEventListener('resize', () => { s.x = s.target = -i*W(); go(i); });
  T.onFrame(() => { if(!s.drag){ if(reduce){ s.x = s.target; } else { s.v += (s.target - s.x)*.12; s.v *= .72; s.x += s.v; } }
    track.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0)`; });
  requestAnimationFrame(() => go(0));
  return {go, get i(){ return i; }};
}

/* ---------- 1. Domótica ---------- */
const domo = $('#domo');
if(domo){
  const voice = $('.voice', domo), voiceT = $('.voice span', domo); let vt;
  const say = (cmd, done) => { voice.classList.remove('idle'); voiceT.textContent = `"Alexa, ${cmd}"`; clearTimeout(vt); vt = setTimeout(() => { voice.classList.add('idle'); voiceT.textContent = done; }, 1300); };
  Carousel(domo);
  // luz
  const sl = $('.s-light', domo), sw = $('#lightSw'), dim = $('#lightDim');
  sw.addEventListener('click', () => { const on = sw.getAttribute('aria-checked') !== 'true'; say(on ? 'enciende la luz de la sala' : 'apaga la luz de la sala', on ? 'Luz encendida.' : 'Luz apagada.');
    setTimeout(() => { sw.setAttribute('aria-checked', on); sl.classList.toggle('on', on); if(navigator.vibrate) navigator.vibrate(10); }, reduce ? 0 : 380); });
  dim.addEventListener('input', () => { sl.style.setProperty('--b', dim.value/100); if(sw.getAttribute('aria-checked') !== 'true'){ sw.setAttribute('aria-checked', true); sl.classList.add('on'); } });
  dim.addEventListener('change', () => say(`pon la luz al ${dim.value} %`, `Brillo al ${dim.value} %.`));
  // ventilador
  const blades = $('.s-fan .blades', domo), fanScene = $('.s-fan', domo), fanBtns = $$('[data-fan]', domo);
  const fan = {a:0, v:0, target:0};
  fanBtns.forEach(b => b.addEventListener('click', () => { fanBtns.forEach(x => x.setAttribute('aria-pressed', x === b)); fan.target = +b.dataset.fan * 540;
    say(+b.dataset.fan ? `ventilador a velocidad ${b.dataset.fan}` : 'apaga el ventilador', +b.dataset.fan ? `Ventilador en velocidad ${b.dataset.fan}.` : 'Ventilador apagado.'); }));
  let lt = performance.now();
  T.onFrame(t => { const dt = Math.min((t-lt)/1000,.05); lt = t; fan.v = lerp(fan.v, fan.target, 1 - Math.pow(.25, dt)); fan.a = (fan.a + fan.v*dt) % 360;
    blades.style.transform = `rotate(${fan.a.toFixed(1)}deg)`; T.setVar(fanScene, '--w', clamp(fan.v/1620,0,1).toFixed(2)); });
  // cortinas
  const curt = $('.s-curt', domo), cr = $('#curtR');
  const setC = () => curt.style.setProperty('--o', cr.value/100); setC();
  cr.addEventListener('input', setC); cr.addEventListener('change', () => say(+cr.value > 50 ? 'abre las cortinas' : 'cierra las cortinas', `Cortinas al ${cr.value} %.`));
  // cerradura
  const lock = $('.s-lock', domo), lb = $('#lockBtn'), lst = $('.s-lock .state span', domo);
  lb.addEventListener('click', () => { const open = !lock.classList.contains('open'); say(open ? 'abre la puerta principal' : 'asegura la puerta', open ? 'Puerta abierta. Se asegurará sola.' : 'Puerta asegurada.');
    setTimeout(() => { lock.classList.toggle('open', open); lst.textContent = open ? 'Abierta' : 'Asegurada'; lb.textContent = open ? 'Asegurar puerta' : 'Abrir puerta'; if(navigator.vibrate) navigator.vibrate([10,40,10]); }, reduce ? 0 : 380); });
}

/* ---------- 2. Alarma con HMI ---------- */
const dist = $('#dist');
if(dist){
  const radar = $('#radar'), distV = $('#distV'), aState = $('#aState'), aled = $('#aled'), blip = $('.blip', radar), hmi = $('#hmi');
  const upd = () => { const v = +dist.value; distV.textContent = v + ' cm'; const al = v < 90;
    radar.classList.toggle('alert', al); hmi.classList.toggle('alert', al); aled.classList.toggle('warn', al); aled.classList.toggle('on', !al);
    const r = v/300*46; blip.style.left = (50 + r*Math.cos(-.9)) + '%'; blip.style.top = (50 + r*Math.sin(-.9)) + '%';
    aState.textContent = al ? '¡Intruso!' : 'Zona segura'; aState.style.color = al ? 'var(--brand-700)' : '';
    hmi.innerHTML = al ? `&gt; ALERTA ZONA 1<br>&gt; DIST ${v} cm · SIRENA ON<br>&gt; NOTIFICANDO AL DUEÑO…` : `&gt; SISTEMA ARMADO<br>&gt; DIST ${v} cm · SIN MOVIMIENTO<br>&gt; ZONA 1 OK`; };
  dist.addEventListener('input', upd); upd();
}

/* ---------- 3. Electrónica y robótica ---------- */
const elec = $('#elec');
function knob(el, onAngle, init=0){
  const st = {a:init, target:init, v:0};
  const ang = e => { const r = el.getBoundingClientRect(); return clamp(Math.atan2(e.clientX - (r.left + r.width/2), -(e.clientY - (r.top + r.height/2)))*180/Math.PI, -135, 135); };
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); st.target = ang(e); e.stopPropagation(); });
  el.addEventListener('pointermove', e => { if(el.hasPointerCapture(e.pointerId)) st.target = ang(e); });
  el.addEventListener('keydown', e => { if(['ArrowRight','ArrowUp'].includes(e.key)){ st.target = clamp(st.target + 10,-135,135); e.preventDefault(); } if(['ArrowLeft','ArrowDown'].includes(e.key)){ st.target = clamp(st.target - 10,-135,135); e.preventDefault(); } });
  T.onFrame(() => { st.v += (st.target - st.a)*.12; st.v *= .72; st.a += st.v; T.setVar(el, '--a', st.a.toFixed(1) + 'deg'); onAngle(st.a); });
}
if(elec){
  Carousel(elec);
  // E1: LED + PWM
  const led = $('#ledGlow'), ledCore = $('#ledCore'), duty = $('#dutyV'), scope = $('#scope'), sctx = scope.getContext('2d'); let D = .5, ph = 0;
  knob($('#potKnob'), a => { D = clamp((a + 135)/270, 0, 1); duty.textContent = Math.round(D*100) + ' %'; $('#potKnob').setAttribute('aria-valuenow', Math.round(D*100));
    led.style.opacity = (D*.95).toFixed(2); ledCore.style.fill = `rgb(${Math.round(120 + 135*D)},${Math.round(40 + 60*D)},${Math.round(30 + 15*D)})`; }, 0);
  function drawScope(){ const w = scope.width = scope.clientWidth*devicePixelRatio, h = scope.height = scope.clientHeight*devicePixelRatio; return {w,h}; }
  let sz = drawScope(); addEventListener('resize', () => sz = drawScope());
  T.onFrame(() => { if(!scope.offsetParent) return; const {w,h} = sz; sctx.clearRect(0,0,w,h);
    sctx.strokeStyle = 'rgba(111,227,210,.12)'; sctx.lineWidth = 1; for(let x=0;x<w;x+=w/10){ sctx.beginPath(); sctx.moveTo(x,0); sctx.lineTo(x,h); sctx.stroke(); } for(let y=0;y<h;y+=h/6){ sctx.beginPath(); sctx.moveTo(0,y); sctx.lineTo(w,y); sctx.stroke(); }
    ph = (ph + (reduce ? 0 : 1.2)) % (w/4); const per = w/4, hi = h*.25, lo = h*.75;
    sctx.strokeStyle = '#FFB627'; sctx.lineWidth = 2.5*devicePixelRatio; sctx.shadowColor = '#FFB627'; sctx.shadowBlur = 8; sctx.beginPath();
    for(let x=-per; x<w+per; x+=per){ const x0 = x - ph; sctx.lineTo(x0, lo); sctx.lineTo(x0, hi); sctx.lineTo(x0 + per*D, hi); sctx.lineTo(x0 + per*D, lo); }
    sctx.stroke(); sctx.shadowBlur = 0; });
  // E2: sensor de temperatura + LCD
  const tr = $('#tempR'), lcd = $('#lcd'), thermo = $('.thermo', elec), mf = $('.minifan', elec), mfb = $('.minifan .bl', elec); let mfa = 0;
  const updT = () => { const t = +tr.value/10; const hot = t >= 30; thermo.style.setProperty('--t', ((t - 10)/35).toFixed(3));
    lcd.textContent = `TEMP: ${t.toFixed(1).padStart(4,' ')}°C   \n${hot ? 'VENT: ON  ALERTA' : 'VENT: OFF   OK  '}`; mf.classList.toggle('on', hot); updT.hot = hot; };
  tr.addEventListener('input', updT); updT();
  T.onFrame(() => { if(updT.hot && !reduce){ mfa = (mfa + 18) % 360; mfb.style.transform = `rotate(${mfa}deg)`; } });
  // R1: brazo con servo
  const a1 = $('#arm1'), a2 = $('#arm2'), a3 = $('#arm3'), degV = $('#degV');
  knob($('#armKnob'), a => { a1.style.transform = `rotate(${(a*.28).toFixed(2)}deg)`; a2.style.transform = `rotate(${(-a*.35).toFixed(2)}deg)`; a3.style.transform = `rotate(${(Math.sin(a/20)*14).toFixed(2)}deg)`;
    const d = Math.round(a/1.5); degV.textContent = d + '°'; $('#armKnob').setAttribute('aria-valuenow', d); }, 0);
  // R2: seguidor de línea
  const path = $('#track'), bot = $('#bot'), sL = $('#sL'), sR = $('#sR'), goBtn = $('#botGo'), spd = $('#botSpd');
  const L = path.getTotalLength(); let pos = 0, run = false, lt2 = performance.now(), vcur = 0;
  const place = () => { const p = path.getPointAtLength(pos % L), q = path.getPointAtLength((pos + 2) % L); const ang = Math.atan2(q.y - p.y, q.x - p.x)*180/Math.PI;
    bot.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    const turn = ((Math.atan2(path.getPointAtLength((pos+14)%L).y - q.y, path.getPointAtLength((pos+14)%L).x - q.x)*180/Math.PI - ang + 540) % 360) - 180;
    sL.style.fill = turn < -4 ? '#FFB627' : '#3A3D44'; sR.style.fill = turn > 4 ? '#FFB627' : '#3A3D44'; };
  place();
  goBtn.addEventListener('click', () => { run = !run; goBtn.textContent = run ? 'Detener robot' : 'Iniciar robot'; goBtn.classList.toggle('hot', run); });
  T.onFrame(t => { const dt = Math.min((t-lt2)/1000,.05); lt2 = t; vcur = lerp(vcur, run ? +spd.value : 0, 1 - Math.pow(.05, dt)); if(vcur > .5){ pos += vcur*dt; place(); } });
}

/* ---------- 4. Red Neuronal Junior: grafo → rostro que habla ---------- */
const ai = $('#ai');
if(ai){
  const cv = $('#aiCanvas'), ctx = cv.getContext('2d'), btn = $('#aiBtn'), mute = $('#aiMute'), bubble = $('#aiBubble'), nled = $('#nled');
  let W = 0, H = 0, S = 1;
  const size = () => { const r = cv.getBoundingClientRect(); S = devicePixelRatio || 1; W = cv.width = r.width*S; H = cv.height = r.height*S; };
  size(); addEventListener('resize', size);
  // grafo: capas [4,6,6,6,2] = 24 nodos | rostro: contorno 14 + ojos 4 + boca 6 = 24
  const layers = [4,6,6,6,2], nodes = [];
  layers.forEach((c,li) => { for(let k=0;k<c;k++) nodes.push({li, gx:.14 + li*.18, gy:.5 + (k - (c-1)/2)*.13}); });
  const face = [];
  for(let k=0;k<14;k++){ const a = -Math.PI/2 + k/14*Math.PI*2; face.push({x:.5 + Math.cos(a)*.27, y:.47 + Math.sin(a)*.36, role:'o'}); }
  face.push({x:.405,y:.38,role:'eL'},{x:.445,y:.38,role:'eL'},{x:.555,y:.38,role:'eR'},{x:.595,y:.38,role:'eR'});
  face.push({x:.40,y:.6,role:'mc'},{x:.46,y:.585,role:'mt'},{x:.54,y:.585,role:'mt'},{x:.60,y:.6,role:'mc'},{x:.54,y:.63,role:'mb'},{x:.46,y:.63,role:'mb'});
  // orden para que cada nodo viaje a un destino cercano
  const order = nodes.map((n,i) => i).sort((a,b) => nodes[a].gy - nodes[b].gy || nodes[a].gx - nodes[b].gx);
  const forder = face.map((f,i) => i).sort((a,b) => face[a].y - face[b].y || face[a].x - face[b].x);
  order.forEach((ni,k) => { nodes[ni].f = face[forder[k]]; nodes[ni].delay = k*.025; });
  const gEdges = [];
  nodes.forEach((a,i) => nodes.forEach((b,j) => { if(b.li === a.li + 1) gEdges.push([i,j]); }));
  const idx = f => nodes.findIndex(n => n.f === f);
  const fEdges = [];
  for(let k=0;k<14;k++) fEdges.push([idx(face[k]), idx(face[(k+1)%14])]);
  fEdges.push([idx(face[14]),idx(face[15])],[idx(face[16]),idx(face[17])]);
  [[18,19],[19,20],[20,21],[21,22],[22,23],[23,18]].forEach(([a,b]) => fEdges.push([idx(face[a]), idx(face[b])]));
  nodes.forEach(n => { n.x = n.gx; n.y = n.gy; n.vx = 0; n.vy = 0; });
  const pulses = [];
  let mode = 0, morphT = 0, talk = 0, talkTarget = 0, blink = 0, nextBlink = 2, speaking = false, tPrev = performance.now();
  const lines = ['Hola, soy Junior, la red neuronal de Tovel.','Aprendí a ver con una cámara y a escuchar con un micrófono.','Puedo reconocer rostros, voces y objetos.','¿Construimos algo juntos?'];
  let li = 0, typing = null, sayTimer = null, voiceOn = true;
  const synth = window.speechSynthesis;
  const esVoice = () => synth && synth.getVoices().find(v => /^es/i.test(v.lang));
  mute.addEventListener('click', () => { voiceOn = !voiceOn; mute.setAttribute('aria-pressed', !voiceOn); mute.textContent = voiceOn ? 'Voz: sí' : 'Voz: no'; if(!voiceOn && synth) synth.cancel(); });
  function speakLine(){
    if(mode !== 1) return;
    const text = lines[li % lines.length]; li++;
    bubble.textContent = ''; bubble.classList.add('on'); let c = 0; clearInterval(typing);
    typing = setInterval(() => { bubble.textContent = text.slice(0, ++c); if(c >= text.length) clearInterval(typing); }, 32);
    speaking = true;
    const done = () => { speaking = false; sayTimer = setTimeout(speakLine, 900); };
    if(voiceOn && synth && !reduce){
      try{ synth.cancel(); const u = new SpeechSynthesisUtterance(text); const v = esVoice(); if(v) u.voice = v; u.lang = v ? v.lang : 'es-ES'; u.rate = 1.02; u.pitch = 1.15;
        u.onboundary = () => { talkTarget = 1; }; u.onend = done; u.onerror = () => setTimeout(done, text.length*55); synth.speak(u);
        setTimeout(() => { if(speaking && !synth.speaking) done(); }, text.length*90 + 1500);
      }catch(e){ setTimeout(done, text.length*60); }
    } else setTimeout(done, text.length*60 + 300);
  }
  function wake(){ mode = 1; btn.textContent = 'Dormir a Junior'; btn.classList.add('hot'); nled.classList.add('on'); for(let k=0;k<30;k++) spawnPulse(); setTimeout(speakLine, 1300); }
  function sleep(){ mode = 0; btn.textContent = 'Despertar a Junior'; btn.classList.remove('hot'); nled.classList.remove('on'); clearTimeout(sayTimer); clearInterval(typing); speaking = false; bubble.classList.remove('on'); if(synth) synth.cancel(); }
  btn.addEventListener('click', () => mode ? sleep() : wake());
  function spawnPulse(){ const e = gEdges[Math.floor(Math.random()*gEdges.length)]; pulses.push({e, t:0, sp:.6 + Math.random()*.8}); }
  T.onFrame(t => {
    if(!cv.offsetParent) return;
    const dt = Math.min((t - tPrev)/1000, .05); tPrev = t;
    morphT = clamp(morphT + (mode ? dt : -dt)*.9, 0, 1);
    if(speaking){ talkTarget = Math.max(talkTarget*.9, .25 + .75*Math.abs(Math.sin(t/90))*Math.random()); } else talkTarget = 0;
    talk = lerp(talk, talkTarget, .35);
    nextBlink -= dt; if(nextBlink <= 0){ blink = 1; nextBlink = 2 + Math.random()*3; } blink = Math.max(0, blink - dt*7);
    const mx = (T.mouse.x/innerWidth - .5), my = (T.mouse.y/innerHeight - .5);
    nodes.forEach(n => {
      const k = clamp((morphT*1.6 - n.delay), 0, 1), e = k*k*(3 - 2*k);
      let fx = n.f.x + mx*.012, fy = n.f.y + my*.012;
      if(n.f.role === 'mt') fy -= talk*.03; if(n.f.role === 'mb') fy += talk*.05;
      if(n.f.role === 'eL' || n.f.role === 'eR'){ fy += (blink > .5 ? .01 : 0); }
      const tx = lerp(n.gx + Math.sin(t/900 + n.gy*9)*.006, fx, e), ty = lerp(n.gy + Math.cos(t/1100 + n.gx*9)*.006, fy, e);
      if(reduce){ n.x = tx; n.y = ty; } else { n.vx += (tx - n.x)*.16; n.vy += (ty - n.y)*.16; n.vx *= .7; n.vy *= .7; n.x += n.vx; n.y += n.vy; }
    });
    ctx.clearRect(0,0,W,H);
    const P = n => [n.x*W, n.y*H], fa = morphT, ga = 1 - morphT;
    // aristas del grafo
    if(ga > .01){ ctx.lineWidth = 1*S; ctx.strokeStyle = `rgba(111,227,210,${.16*ga})`; ctx.beginPath(); gEdges.forEach(([a,b]) => { const [x1,y1] = P(nodes[a]), [x2,y2] = P(nodes[b]); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); }); ctx.stroke(); }
    // pulsos
    if(!reduce && Math.random() < (mode ? .08 : .35)) spawnPulse();
    for(let k = pulses.length - 1; k >= 0; k--){ const p = pulses[k]; p.t += dt*p.sp; if(p.t >= 1){ pulses.splice(k,1); continue; }
      const [x1,y1] = P(nodes[p.e[0]]), [x2,y2] = P(nodes[p.e[1]]); const x = lerp(x1,x2,p.t), y = lerp(y1,y2,p.t);
      ctx.fillStyle = `rgba(255,182,39,${(.9*ga + .25)*(1 - Math.abs(p.t - .5)*1.6)})`; ctx.beginPath(); ctx.arc(x, y, 2.4*S, 0, 7); ctx.fill(); }
    // aristas del rostro
    if(fa > .01){ ctx.lineWidth = 2*S; ctx.strokeStyle = `rgba(244,238,228,${.75*fa})`; ctx.beginPath(); fEdges.forEach(([a,b]) => { const [x1,y1] = P(nodes[a]), [x2,y2] = P(nodes[b]); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); }); ctx.stroke();
      // boca rellena
      const m = [18,19,20,21,22,23].map(q => P(nodes[idx(face[q])])); ctx.fillStyle = `rgba(242,84,45,${.85*fa*(.3 + talk)})`; ctx.beginPath(); m.forEach(([x,y],q) => q ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
      // pupilas
      ['eL','eR'].forEach(r => { const pts = nodes.filter(n => n.f.role === r).map(P); const cx = (pts[0][0] + pts[1][0])/2 + mx*8*S, cy = (pts[0][1] + pts[1][1])/2 + my*6*S;
        ctx.fillStyle = `rgba(255,182,39,${fa})`; ctx.beginPath(); ctx.ellipse(cx, cy, 7*S, 7*S*Math.max(.12, 1 - blink), 0, 0, 7); ctx.fill();
        ctx.shadowColor = '#FFB627'; ctx.shadowBlur = 16*S*fa; ctx.fill(); ctx.shadowBlur = 0; });
      // mejillas/antena
      const top = P(nodes[idx(face[0])]); ctx.strokeStyle = `rgba(244,238,228,${.5*fa})`; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(top[0], top[1] - 22*S); ctx.stroke();
      ctx.fillStyle = `rgba(242,84,45,${fa})`; ctx.beginPath(); ctx.arc(top[0], top[1] - 26*S, 5*S*(1 + talk*.4), 0, 7); ctx.fill(); }
    // nodos
    nodes.forEach(n => { const [x,y] = P(n); const r = (n.f.role === 'eL' || n.f.role === 'eR') ? 4 : 5.5;
      ctx.fillStyle = '#16181B'; ctx.strokeStyle = fa > .5 ? '#F4EEE4' : '#6FE3D2'; ctx.lineWidth = 2*S; ctx.beginPath(); ctx.arc(x, y, r*S, 0, 7); ctx.fill(); ctx.stroke(); });
  });
}

/* ---------- 5. Impresión 3D ---------- */
const pr = $('#printer');
if(pr){
  const cv = $('#prCanvas'), ctx = cv.getContext('2d'), go = $('#prGo'), hudPhase = $('#prPhase'), hudTemp = $('#prTemp'), hudLayer = $('#prLayer'), bar = $('#prBar'), pled = $('#pled');
  let W = 0, H = 0, S = 1;
  const size = () => { const r = cv.getBoundingClientRect(); S = devicePixelRatio || 1; W = cv.width = r.width*S; H = cv.height = r.height*S; };
  size(); addEventListener('resize', size);
  // pieza: la T de Tovel de pie (tallo angosto abajo, barra ancha arriba) + chispa
  const LAYERS = 26;
  const layerW = k => k < 18 ? .16 : .46;               // ancho relativo
  const layerX = k => k < 18 ? .5 - .16/2 : .5 - .46/2;
  const st = {phase:'idle', temp:24, bed:24, layer:0, prog:0, nozX:.5, nozY:0, spool:0, fan:0, done:0, paused:false};
  const PH = {idle:'En espera', heat:'Calentando', print:'Imprimiendo', cool:'Enfriando', done:'¡Pieza lista!'};
  go.addEventListener('click', () => {
    if(st.phase === 'idle' || st.phase === 'done'){ Object.assign(st, {phase:'heat', layer:0, prog:0, done:0}); go.textContent = 'Pausar'; pled.classList.add('on'); }
    else if(st.phase === 'print'){ st.paused = !st.paused; go.textContent = st.paused ? 'Reanudar' : 'Pausar'; }
  });
  let tp = performance.now();
  T.onFrame(t => {
    if(!cv.offsetParent) return;
    const dt = Math.min((t - tp)/1000, .05)*(reduce ? 6 : 1); tp = t;
    if(st.phase === 'heat'){ st.temp = Math.min(210, st.temp + dt*110); st.bed = Math.min(60, st.bed + dt*30); if(st.temp >= 210) st.phase = 'print'; }
    else if(st.phase === 'print' && !st.paused){ st.prog += dt*1.25; st.spool += dt*4;
      const dir = st.layer % 2 ? -1 : 1, w = layerW(st.layer), x0 = layerX(st.layer); st.nozX = dir > 0 ? x0 + w*st.prog : x0 + w*(1 - st.prog);
      if(st.prog >= 1){ st.prog = 0; st.layer++; if(st.layer >= LAYERS){ st.phase = 'cool'; st.cool = 0; } } }
    else if(st.phase === 'cool'){ st.cool += dt; st.temp = Math.max(40, st.temp - dt*60); st.fan += dt*30; st.nozX = lerp(st.nozX, .88, .05); if(st.cool > 1.6){ st.phase = 'done'; st.done = 0; go.textContent = 'Imprimir otra'; pled.classList.remove('on'); } }
    else if(st.phase === 'done'){ st.done = Math.min(1, st.done + dt*1.4); st.temp = Math.max(24, st.temp - dt*40); st.bed = Math.max(24, st.bed - dt*10); }
    hudPhase.textContent = PH[st.phase] + (st.paused && st.phase === 'print' ? ' (pausa)' : '');
    hudTemp.textContent = Math.round(st.temp) + '° / ' + Math.round(st.bed) + '°';
    hudLayer.textContent = Math.min(st.layer + (st.phase === 'print' ? 1 : 0), LAYERS) + ' / ' + LAYERS;
    const total = st.phase === 'done' || st.phase === 'cool' ? 1 : (st.layer + st.prog)/LAYERS; T.setVar(bar, '--pp', total.toFixed(3));
    // dibujo
    ctx.clearRect(0,0,W,H);
    const bedY = H*.84, lh = H*.021, ox = W*.06, iw = W*.88;
    const X = r => ox + r*iw;
    // marco
    ctx.strokeStyle = '#3A3D44'; ctx.lineWidth = 6*S; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(X(.02), bedY + 20*S); ctx.lineTo(X(.02), H*.08); ctx.lineTo(X(.98), H*.08); ctx.lineTo(X(.98), bedY + 20*S); ctx.stroke();
    // carrete
    const sx = X(.86), sy = H*.08 - 2*S; ctx.save(); ctx.translate(sx, sy + 26*S); ctx.rotate(st.spool);
    ctx.fillStyle = '#2C2F35'; ctx.beginPath(); ctx.arc(0,0,20*S,0,7); ctx.fill(); ctx.strokeStyle = '#F2542D'; ctx.lineWidth = 7*S; ctx.beginPath(); ctx.arc(0,0,13*S,0,7); ctx.stroke();
    ctx.strokeStyle = '#14161A'; ctx.lineWidth = 3*S; ctx.beginPath(); ctx.moveTo(-18*S,0); ctx.lineTo(18*S,0); ctx.moveTo(0,-18*S); ctx.lineTo(0,18*S); ctx.stroke(); ctx.restore();
    // cama caliente
    const bedHot = clamp((st.bed - 24)/36, 0, 1);
    ctx.fillStyle = `rgb(${Math.round(58 + 160*bedHot)},${Math.round(61 + 20*bedHot)},${Math.round(68 - 20*bedHot)})`; ctx.fillRect(X(.12), bedY, X(.88) - X(.12), 8*S);
    if(bedHot > .1){ ctx.fillStyle = `rgba(242,84,45,${.25*bedHot})`; ctx.fillRect(X(.12), bedY - 4*S, X(.88) - X(.12), 4*S); }
    // capas impresas
    const glow = st.phase === 'done' ? st.done : 0;
    for(let k=0;k<Math.min(st.layer + 1, LAYERS);k++){
      const w = layerW(k), x0 = layerX(k); let a = x0, b = x0 + w;
      if(k === st.layer && st.phase === 'print'){ if(k % 2){ a = x0 + w*(1 - st.prog); } else { b = x0 + w*st.prog; } }
      else if(k === st.layer) continue;
      const y = bedY - (k+1)*lh;
      ctx.fillStyle = k % 2 ? '#FF6A45' : '#F2542D'; ctx.fillRect(X(a), y, X(b) - X(a), lh - 1*S);
      // brillo de filamento recién depositado
      if(k >= st.layer - 1 && st.phase === 'print'){ ctx.fillStyle = 'rgba(255,226,160,.5)'; ctx.fillRect(X(a), y, X(b) - X(a), 2*S); }
    }
    if(glow){ ctx.save(); ctx.shadowColor = '#FFB627'; ctx.shadowBlur = 30*S*glow; ctx.fillStyle = `rgba(255,182,39,${glow})`;
      const topY = bedY - LAYERS*lh, cx = X(layerX(25) + .46 + .07), cy = topY + 6*lh*.5; const bounce = 1 + Math.sin(glow*Math.PI)*.35;
      ctx.beginPath(); ctx.arc(cx, cy - (1 - glow)*40*S, 3.2*lh*bounce/1.35, 0, 7); ctx.fill(); ctx.restore(); }
    // gantry y boquilla
    const curY = st.phase === 'idle' ? bedY - 120*S : bedY - (Math.min(st.layer, LAYERS-1) + 1)*lh - 26*S;
    st.nozY = lerp(st.nozY || curY, curY, .15);
    ctx.strokeStyle = '#55585F'; ctx.lineWidth = 5*S; ctx.beginPath(); ctx.moveTo(X(.02), st.nozY); ctx.lineTo(X(.98), st.nozY); ctx.stroke();
    const nx = X(st.nozX); ctx.fillStyle = '#14161A'; ctx.strokeStyle = '#55585F'; ctx.lineWidth = 2*S;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(nx - 18*S, st.nozY - 12*S, 36*S, 26*S, 6*S) : ctx.rect(nx - 18*S, st.nozY - 12*S, 36*S, 26*S); ctx.fill(); ctx.stroke();
    const hot = clamp((st.temp - 24)/186, 0, 1);
    ctx.fillStyle = `rgb(${Math.round(85 + 170*hot)},${Math.round(88 + 80*hot)},${Math.round(95 - 50*hot)})`;
    ctx.beginPath(); ctx.moveTo(nx - 6*S, st.nozY + 14*S); ctx.lineTo(nx + 6*S, st.nozY + 14*S); ctx.lineTo(nx, st.nozY + 24*S); ctx.closePath(); ctx.fill();
    if(st.phase === 'print' && !st.paused){ ctx.fillStyle = 'rgba(255,182,39,.9)'; ctx.beginPath(); ctx.arc(nx, st.nozY + 26*S, 2.5*S, 0, 7); ctx.fill(); }
    // filamento del carrete a la boquilla
    ctx.strokeStyle = 'rgba(242,84,45,.7)'; ctx.lineWidth = 1.5*S; ctx.beginPath(); ctx.moveTo(sx, sy + 40*S); ctx.quadraticCurveTo((sx + nx)/2, sy + 80*S, nx, st.nozY - 12*S); ctx.stroke();
    // ventilador de capa
    ctx.save(); ctx.translate(nx + 26*S, st.nozY); ctx.rotate(st.fan + (st.phase === 'print' ? t/60 : 0)); ctx.strokeStyle = '#6FE3D2'; ctx.lineWidth = 2*S;
    for(let q=0;q<3;q++){ ctx.rotate(2.094); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-8*S); ctx.stroke(); } ctx.restore();
    // chispas de calor
    if(st.phase === 'heat' && !reduce){ for(let q=0;q<3;q++){ ctx.fillStyle = `rgba(255,182,39,${Math.random()})`; ctx.beginPath(); ctx.arc(nx + (Math.random() - .5)*20*S, st.nozY + 26*S + Math.random()*10*S, 1.5*S, 0, 7); ctx.fill(); } }
    if(st.phase === 'done' && glow > .6){ ctx.fillStyle = `rgba(244,238,228,${(glow - .6)*2.5})`; ctx.font = `600 ${14*S}px Inter, sans-serif`; ctx.textAlign = 'left'; ctx.fillText('T de Tovel · 26 capas', X(.05), H*.16); }
  });
}
})();

/* ---------- 6. Prótesis de mano articulada: cada dedo y cada falange por separado ---------- */
(function(){
const T = window.Tovel, {$, $$, clamp, lerp, reduce} = T;
const box = $('#hand'); if(!box) return;
const cv = $('#handCanvas'), ctx = cv.getContext('2d');
let W = 0, H = 0, S = 1;
const size = () => { const r = cv.getBoundingClientRect(); S = devicePixelRatio || 1; W = cv.width = r.width*S; H = cv.height = r.height*S; };
size(); addEventListener('resize', size);
const NAMES = ['Pulgar','Índice','Medio','Anular','Meñique'];
const GEST = {abrir:[0,0,0,0,0], puno:[1,1,1,1,1], pinza:[.62,.6,0,0,0], senalar:[.85,0,1,1,1], paz:[.85,0,0,1,1], taza:[.45,.55,.6,.62,.66], rock:[.7,0,1,1,0]};
const tgt = [0,0,0,0,0], cur = [0,0,0,0,0], vel = [0,0,0,0,0];
const sliders = $$('.finger input', box), outs = $$('.finger b', box), gBtns = $$('.gestures [data-g]', box);
const setT = (arr, from) => { arr.forEach((v,i) => { tgt[i] = v; if(from !== 'slider') sliders[i].value = Math.round(v*100); }); };
sliders.forEach((s,i) => s.addEventListener('input', () => { tgt[i] = s.value/100; gBtns.forEach(b => b.setAttribute('aria-pressed', false)); stopDemo(); }));
gBtns.forEach(b => b.addEventListener('click', () => { gBtns.forEach(x => x.setAttribute('aria-pressed', x === b)); stopDemo(); setT(GEST[b.dataset.g]); }));
let demo = null; const demoBtn = $('#handDemo');
function stopDemo(){ if(demo){ clearInterval(demo); demo = null; demoBtn.textContent = 'Demostración'; demoBtn.classList.remove('hot'); } }
demoBtn.addEventListener('click', () => { if(demo){ stopDemo(); return; } const seq = ['puno','abrir','senalar','paz','rock','pinza','taza','abrir']; let k = 0;
  demoBtn.textContent = 'Detener'; demoBtn.classList.add('hot'); const step = () => { const g = seq[k++ % seq.length]; gBtns.forEach(x => x.setAttribute('aria-pressed', x.dataset.g === g)); setT(GEST[g]); }; step(); demo = setInterval(step, 1300); });
// geometría (unidades relativas al alto del lienzo)
const F = [ null,
  {x:-.105, len:[.135,.085,.065]}, {x:-.035, len:[.15,.095,.07]}, {x:.035, len:[.14,.09,.068]}, {x:.1, len:[.11,.072,.058]} ];
const JMAX = [[0,0],[80,95,70],[80,95,70],[80,95,70],[80,95,70]].map(a => a.map(d => d*Math.PI/180));
function shade(c, k){ return `rgb(${Math.round(c[0]*k)},${Math.round(c[1]*k)},${Math.round(c[2]*k)})`; }
const ORANGE = [242,84,45], DARK = [60,63,70];
let tp = performance.now();
T.onFrame(t => {
  if(!cv.offsetParent) return;
  const dt = Math.min((t - tp)/1000, .05); tp = t;
  for(let i=0;i<5;i++){ if(reduce){ cur[i] = tgt[i]; } else { vel[i] += (tgt[i] - cur[i])*.16; vel[i] *= .7; cur[i] += vel[i]; } }
  outs.forEach((o,i) => { const d = Math.round(cur[i]*(i ? 245 : 120)) + '°'; if(o.textContent !== d) o.textContent = d; });
  ctx.clearRect(0,0,W,H);
  const U = H*1.18, cx = W*.5, palmTop = H*.5, palmW = U*.29, palmH = U*.3;
  // antebrazo y muñeca (encaje)
  ctx.fillStyle = '#2C2F35'; roundRect(cx - palmW*.36, palmTop + palmH*.92, palmW*.72, H, 18*S); ctx.fill();
  ctx.fillStyle = '#3A3D44'; roundRect(cx - palmW*.42, palmTop + palmH*.86, palmW*.84, U*.05, 10*S); ctx.fill();
  // palma
  const pg = ctx.createLinearGradient(0, palmTop, 0, palmTop + palmH); pg.addColorStop(0, '#3E4148'); pg.addColorStop(1, '#2E3137');
  ctx.fillStyle = pg; roundRect(cx - palmW/2, palmTop, palmW, palmH, 26*S); ctx.fill();
  // circuito en la palma
  ctx.strokeStyle = 'rgba(111,227,210,.35)'; ctx.lineWidth = 1.5*S; ctx.beginPath();
  for(let i=1;i<5;i++){ const bx = cx + F[i].x*U; ctx.moveTo(bx, palmTop + 6*S); ctx.lineTo(bx, palmTop + palmH*.45); ctx.lineTo(cx, palmTop + palmH*.62); } ctx.stroke();
  ctx.fillStyle = '#FFB627'; ctx.beginPath(); ctx.arc(cx, palmTop + palmH*.62, 6*S, 0, 7); ctx.fill();
  // dedos
  const drawFinger = (i) => {
    const f = F[i], w = (i === 4 ? .042 : .05)*U; let x = cx + f.x*U, y = palmTop + 4*S, th = 0;
    for(let j=0;j<3;j++){
      th += cur[i]*JMAX[i][j];
      const L = f.len[j]*U, dy = -L*Math.cos(th), k = .75 + .45*Math.max(0, Math.cos(th));
      const back = Math.cos(th) < 0;
      ctx.fillStyle = back ? shade(DARK, 1.15) : shade(ORANGE, k);
      roundRect(x - w/2, Math.min(y, y + dy) - w*.05, w, Math.abs(dy) + w*.1, w*.42); ctx.fill();
      // articulación (servo)
      ctx.fillStyle = '#14161A'; ctx.beginPath(); ctx.arc(x, y, w*.2, 0, 7); ctx.fill();
      y += dy;
    }
    ctx.fillStyle = cur[i] > .85 ? '#6FE3D2' : '#FFB627'; ctx.beginPath(); ctx.arc(x, y, w*.16, 0, 7); ctx.fill(); // sensor de presión en la yema
  };
  for(let i=1;i<5;i++) drawFinger(i);
  // pulgar: gira hacia la palma y se acorta al flexionar
  const c = cur[0], bx = cx - palmW*.5 + 6*S, by = palmTop + palmH*.72; let ang = (-40 + c*80)*Math.PI/180, x = bx, y = by;
  const tl = [.1, .078, .06];
  for(let j=0;j<3;j++){
    const L = tl[j]*U*(1 - c*.25*j), nx = x + Math.sin(ang)*L, ny = y - Math.cos(ang)*L, w = .055*U;
    ctx.strokeStyle = shade(ORANGE, .95 - j*.06 - c*.15); ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
    ctx.fillStyle = '#14161A'; ctx.beginPath(); ctx.arc(x, y, w*.2, 0, 7); ctx.fill();
    x = nx; y = ny; ang += c*.5;
  }
  ctx.fillStyle = c > .55 ? '#6FE3D2' : '#FFB627'; ctx.beginPath(); ctx.arc(x, y, .055*U*.16, 0, 7); ctx.fill();
});
function roundRect(x, y, w, h, r){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, w/2, h/2)); else ctx.rect(x, y, w, h); }
})();
