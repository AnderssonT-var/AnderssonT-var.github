/* Tovel — portada 3D: la palabra tovel pasa de plano técnico a pieza sólida, letra por letra */
(function(){
'use strict';
const T = window.Tovel, {$, $$, clamp, lerp, reduce} = T;
const hero = $('.hero'), stage = $('#stage'), canvas = $('#gl');
if(!hero) return;

/* preloader */
const pre = $('#pre'), preN = $('#preN'), n0 = performance.now();
(function count(t){ const p = clamp((t - n0)/1100, 0, 1); preN.textContent = String(Math.round(p*100)).padStart(3,'0'); if(p < 1) requestAnimationFrame(count); })(n0);
const ready = () => { pre.classList.add('done'); document.documentElement.classList.add('ready'); };
if(reduce || sessionStorage.getItem('tovel-seen')) ready(); else addEventListener('load', () => setTimeout(ready, Math.max(0, 1200 - (performance.now() - n0))));
try{ sessionStorage.setItem('tovel-seen','1'); }catch(e){}
setTimeout(ready, 3500);

const phaseEls = $$('.phase'), hudP = $('#hudP');
const caps = [
  ['Todo empieza en un plano.','Antes de escribir código dibujamos cada pieza: qué hace, cómo se conecta y cómo crece.'],
  ['El plano toma forma.','Arquitectura, base de datos y pantallas, aprobadas contigo antes de construir.'],
  ['Luego, el código.','Construimos por partes y te mostramos avances para ajustar a tiempo.'],
  ['Y se enciende.','Tu sistema en línea, probado y con soporte. Listo para trabajar por ti.']
];

function init(){
  if(!window.THREE) return null;
  let renderer;
  try{ renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'}); }catch(e){ return null; }
  if(!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .1, 1400);
  cam.position.set(0, 0, 120);
  /* La palabra "tovel" en tubos: la t aparece primero y las demás letras se construyen una tras otra.
     Coordenadas en una cuadrícula con y hacia abajo y línea base en y=50. */
  const W = (x,y) => new THREE.Vector3(x - 87, 31 - y, 0);
  const arc = (cx,cy,r,a0,a1) => { const c = new THREE.Curve(); c.getPoint = (t,o) => { const a = a0 + (a1 - a0)*t; return (o || new THREE.Vector3()).copy(W(cx + r*Math.cos(a), cy - r*Math.sin(a))); }; return c; };
  const line = (a,b) => new THREE.LineCurve3(W(...a), W(...b));
  const R = 4.5, RB = R*1.06;
  const tBar = line([13,18],[37,18]);
  const tStem = new THREE.CurvePath(); tStem.add(line([25,19],[25,44])); tStem.add(new THREE.QuadraticBezierCurve3(W(25,44), W(25,50), W(31,50))); tStem.add(line([31,50],[37,50]));
  const lStem = new THREE.CurvePath(); lStem.add(line([152,13],[152,44])); lStem.add(new THREE.QuadraticBezierCurve3(W(152,44), W(152,50), W(158,50))); lStem.add(line([158,50],[161,50]));
  const eArc = arc(131,39,11,0,Math.PI*2 - .72);
  const L = [ /* tubos [curva, radio, cerrada] y tapas [x,y,r] por letra */
    {tubes:[[tBar,RB],[tStem,R]], caps:[[13,18,RB],[37,18,RB],[37,50,R]]},
    {tubes:[[arc(62,39,11,0,Math.PI*2),R,true]], caps:[]},
    {tubes:[[line([84,28],[95,50]),R],[line([95,50],[106,28]),R]], caps:[[84,28,R],[95,50,R],[106,28,R]]},
    {tubes:[[line([120,39],[142,39]),R],[eArc,R]], caps:[[120,39,R],[131 + 11*Math.cos(-.72), 39 - 11*Math.sin(-.72), R]]},
    {tubes:[[lStem,R]], caps:[[152,13,R],[161,50,R]]}
  ];
  const group = new THREE.Group(); scene.add(group);
  const word = new THREE.Group(); group.add(word);
  const mk = () => { const solid = new THREE.MeshStandardMaterial({depthWrite:false, color:0xF2542D, roughness:.42, metalness:.1, transparent:true, opacity:0}); solid.color.convertSRGBToLinear();
    return {solid, wire:new THREE.MeshBasicMaterial({color:0x2BA493, wireframe:true, transparent:true, opacity:0}), edge:new THREE.LineBasicMaterial({color:0x6FE3D2, transparent:true, opacity:0})}; };
  const letters = L.map(def => { const m = mk(), g = new THREE.Group(), geos = [];
    def.tubes.forEach(([c,r,closed]) => { geos.push(new THREE.TubeGeometry(c, closed ? 96 : 64, r, 28, !!closed));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(60)), m.edge)); });
    def.caps.forEach(([x,y,r]) => { const s = new THREE.SphereGeometry(r, 28, 14), p = W(x,y); s.translate(p.x, p.y, 0); geos.push(s); });
    geos.forEach(geo => { g.add(new THREE.Mesh(geo, m.solid)); g.add(new THREE.Mesh(geo, m.wire)); });
    const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3());
    g.children.forEach(ch => ch.position.sub(c)); g.position.copy(c); word.add(g);
    return {g, ...m}; });
  const spark = new THREE.SphereGeometry(6.5, 48, 24); { const p = W(50,15); spark.translate(p.x, p.y, 0); }
  const sparkMat = new THREE.MeshStandardMaterial({color:0xFFB627, emissive:0xFFB627, emissiveIntensity:0, roughness:.25, transparent:true, opacity:0});
  sparkMat.color.convertSRGBToLinear(); sparkMat.emissive.convertSRGBToLinear();
  word.add(new THREE.Mesh(spark, sparkMat)); word.add(new THREE.Mesh(spark, letters[0].wire));
  const dimMat = new THREE.LineDashedMaterial({color:0x2BA493, dashSize:1.4, gapSize:1.2, transparent:true, opacity:.7});
  const dim = (a,b) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([W(...a),W(...b)]), dimMat); l.computeLineDistances(); word.add(l); };
  dim([13,8],[37,8]); dim([6,18],[6,50]); dim([43,58],[57,58]); dim([13,6],[13,10]); dim([37,6],[37,10]);
  dim([13,62],[161,62]); dim([13,60],[13,64]); dim([161,60],[161,64]);
  const N = 900, pos = new Float32Array(N*3);
  for(let i=0;i<N;i++){ const r = 46 + Math.random()*70, th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random() - 1);
    pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.sin(ph)*Math.sin(th)*.7; pos[i*3+2] = r*Math.cos(ph)*.6; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({color:0xFFB627, size:.55, transparent:true, opacity:0, depthWrite:false});
  const pts = new THREE.Points(pg, pm); scene.add(pts);
  const ringMat = new THREE.MeshBasicMaterial({color:0x3A3D44, transparent:true, opacity:.6});
  const rings = [44,58].map((r,i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .12, 8, 180), ringMat); m.rotation.x = Math.PI/2.3 + i*.3; m.rotation.y = i*.5; scene.add(m); return m; });
  scene.add(new THREE.AmbientLight(0xffffff, .28));
  const key = new THREE.DirectionalLight(0xffffff, .95); key.position.set(40,60,80); scene.add(key);
  const warm = new THREE.PointLight(0xFFB627, 0, 160); warm.position.set(18,14,30); scene.add(warm);
  const rim = new THREE.DirectionalLight(0x2BA493, .6); rim.position.set(-60,-20,-40); scene.add(rim);
  const TAN = Math.tan(35*Math.PI/360), view = {narrow:false, base:118, wide:200, aspect:1};
  const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w/h;
    view.narrow = w < 760; view.aspect = w/h; view.base = view.narrow ? 215 : 118;
    view.wide = Math.max(view.base, 190/(2*TAN*cam.aspect*(view.narrow ? .8 : .62)));
    cam.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  return {renderer, scene, cam, group, word, letters, sparkMat, dimMat, pm, pts, rings, warm, view, TAN};
}
const gl = init();
if(!gl) document.documentElement.classList.add('no-gl');

const st = {p:0, rx:0, ry:0}; let t0 = performance.now(), ph = -1;
T.onFrame(t => {
  const dt = Math.min((t - t0)/1000, .05); t0 = t;
  const vh = innerHeight, hr = hero.getBoundingClientRect();
  if(hr.bottom < 0) return;
  const target = clamp(-hr.top/(hr.height - vh), 0, 1);
  st.p = reduce ? 1 : lerp(st.p, target, 1 - Math.pow(.0009, dt));
  const p = st.p;
  T.setVar(stage, '--copyO', clamp(1 - p*5, 0, 1).toFixed(2));
  T.setVar(stage, '--phO', (reduce ? 0 : clamp((p - .12)*6, 0, 1)).toFixed(2));
  T.setVar(stage, '--gridO', (1 - clamp((p - .55)*2.4, 0, 1)).toFixed(2));
  T.setVar(stage, '--glowO', clamp((p - .6)*2.5, 0, 1).toFixed(2));
  T.setVar(stage, '--p', clamp(p*1.6, 0, 1).toFixed(2));
  const phase = p < .3 ? 0 : p < .52 ? 1 : p < .74 ? 2 : 3;
  phaseEls.forEach((el,i) => el.classList.toggle('on', i <= phase && p > .12));
  if(ph !== phase){ ph = phase; $('#capH').textContent = caps[phase][0]; $('#capP').textContent = caps[phase][1]; }
  const hp = Math.round(p*100) + '%'; if(hudP.textContent !== hp) hudP.textContent = hp;
  if(!gl) return;
  const mx = T.mouse.x/innerWidth - .5, my = T.mouse.y/innerHeight - .5;
  st.rx = lerp(st.rx, my*.35, 1 - Math.pow(.02, dt)); st.ry = lerp(st.ry, mx*.6, 1 - Math.pow(.02, dt));
  const solid = clamp((p - .5)/.3, 0, 1), build = clamp(p/.5, 0, 1);
  const form = reduce ? 1 : clamp((p - .1)/.42, 0, 1), fe = form < .5 ? 4*form*form*form : 1 - Math.pow(-2*form + 2, 3)/2;
  const s01 = clamp(p/.86, 0, 1), ease = s01 < .5 ? 4*s01*s01*s01 : 1 - Math.pow(-2*s01 + 2, 3)/2;
  /* cámara: de la t sola a la palabra completa */
  const v = gl.view, z = lerp(v.base, v.wide, fe), hv = 2*z*gl.TAN, wv = hv*v.aspect;
  gl.cam.position.z = z;
  gl.word.position.set(55*(1 - fe), 1*(1 - fe), 0);
  gl.group.position.set(wv*(v.narrow ? lerp(.02, 0, fe) : lerp(.16, .06, fe)), hv*(v.narrow ? lerp(.21, .2, fe) : lerp(.08, .1, fe)), 0);
  const zs = z/v.base; gl.rings.forEach(r => { r.position.copy(gl.group.position); r.scale.setScalar(lerp(1, zs*.8, fe)); }); gl.pts.scale.setScalar(lerp(1, zs*.85, fe));
  gl.group.rotation.x = st.rx + (1 - solid)*.15 - .05;
  gl.group.rotation.y = st.ry*(1 - fe*.6) + Math.sin(t/2400)*.12*(1 - fe*.5) + (reduce ? 0 : ease*Math.PI*2);
  gl.group.scale.setScalar(.9 + solid*.18);
  /* cada letra se dibuja (plano) y luego se vuelve sólida, una tras otra */
  gl.letters.forEach((l,i) => {
    const b = i ? clamp((p - .12 - (i - 1)*.085)/.12, 0, 1) : build;
    const so = clamp((solid - i*.09)/.6, 0, 1);
    const pop = i ? 1 - Math.pow(1 - b, 3) : 1;
    l.g.scale.setScalar(.35 + .65*pop); l.g.rotation.y = (1 - pop)*-1.4; l.g.position.y += 0;
    l.wire.opacity = (i ? b*.55 : .12 + build*.45)*(1 - so*.92);
    l.edge.opacity = (i ? b : 1)*(1 - so)*.95;
    l.solid.opacity = so; const tr = so < .995;
    if(l.solid.transparent !== tr){ l.solid.transparent = tr; l.solid.depthWrite = !tr || so > .5; l.solid.needsUpdate = true; }
    if(!tr) l.solid.opacity = 1;
  });
  gl.dimMat.opacity = clamp(build*2, 0, 1)*(1 - clamp(solid*2, 0, 1))*.8;
  gl.sparkMat.opacity = solid; gl.sparkMat.emissiveIntensity = solid*(.42 + Math.sin(t/300)*.12);
  gl.warm.intensity = solid*.9; gl.warm.position.x = lerp(18, 0, fe);
  gl.pm.opacity = .15 + solid*.65;
  gl.pts.rotation.y += dt*(.04 + solid*.12);
  gl.rings.forEach((r,i) => { r.rotation.z += dt*(i ? -.08 : .1); r.material.opacity = .25 + solid*.35; });
  gl.renderer.render(gl.scene, gl.cam);
});
})();
