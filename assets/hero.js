/* Tovel — portada 3D: la T pasa de plano técnico a pieza sólida */
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

const phaseEls = $$('.phase');
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
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .1, 400);
  cam.position.set(0, 0, 120);
  const P = (x,y) => new THREE.Vector3(x - 32, 32 - y, 0);
  const bar = new THREE.LineCurve3(P(13,18), P(37,18));
  const stem = new THREE.CurvePath();
  stem.add(new THREE.LineCurve3(P(25,19), P(25,44)));
  stem.add(new THREE.QuadraticBezierCurve3(P(25,44), P(25,50), P(31,50)));
  stem.add(new THREE.LineCurve3(P(31,50), P(37,50)));
  const R = 4.5, RB = R*1.06;
  const geos = [new THREE.TubeGeometry(bar, 24, RB, 32, false), new THREE.TubeGeometry(stem, 80, R, 32, false)];
  [[P(13,18),RB],[P(37,18),RB],[P(37,50),R]].forEach(([p,r]) => { const g = new THREE.SphereGeometry(r, 32, 16); g.translate(p.x, p.y, p.z); geos.push(g); });
  const spark = new THREE.SphereGeometry(7, 48, 24); spark.translate(P(50,18).x, P(50,18).y, 0);
  const group = new THREE.Group(); scene.add(group);
  const solidMat = new THREE.MeshStandardMaterial({depthWrite:false, color:0xF2542D, roughness:.42, metalness:.1, transparent:true, opacity:0});
  const sparkMat = new THREE.MeshStandardMaterial({color:0xFFB627, emissive:0xFFB627, emissiveIntensity:0, roughness:.25, transparent:true, opacity:0});
  solidMat.color.convertSRGBToLinear(); sparkMat.color.convertSRGBToLinear(); sparkMat.emissive.convertSRGBToLinear();
  const wireMat = new THREE.MeshBasicMaterial({color:0x2BA493, wireframe:true, transparent:true, opacity:.55});
  const edgeMat = new THREE.LineBasicMaterial({color:0x6FE3D2, transparent:true, opacity:.9});
  geos.forEach(g => { group.add(new THREE.Mesh(g, solidMat)); group.add(new THREE.Mesh(g, wireMat)); });
  group.add(new THREE.Mesh(spark, sparkMat)); group.add(new THREE.Mesh(spark, wireMat));
  const outline = new THREE.Group(); group.add(outline);
  [bar, stem].forEach(c => outline.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(60)), edgeMat)));
  const dimMat = new THREE.LineDashedMaterial({color:0x2BA493, dashSize:1.4, gapSize:1.2, transparent:true, opacity:.7});
  const dim = (a,b) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]), dimMat); l.computeLineDistances(); outline.add(l); };
  dim(P(13,8),P(37,8)); dim(P(6,18),P(6,50)); dim(P(43,58),P(57,58)); dim(P(13,6),P(13,10)); dim(P(37,6),P(37,10));
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
  const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w/h;
    const narrow = w < 760; cam.position.z = narrow ? 215 : 118; group.position.x = narrow ? 4 : 18; group.position.y = narrow ? 34 : 6;
    rings.forEach(r => r.position.copy(group.position)); cam.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  return {renderer, scene, cam, group, solidMat, sparkMat, wireMat, edgeMat, dimMat, pm, pts, rings, warm};
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
  stage.style.setProperty('--copyO', clamp(1 - p*5, 0, 1).toFixed(3));
  stage.style.setProperty('--phO', (reduce ? 0 : clamp((p - .12)*6, 0, 1)).toFixed(3));
  stage.style.setProperty('--gridO', (1 - clamp((p - .55)*2.4, 0, 1)).toFixed(3));
  stage.style.setProperty('--glowO', clamp((p - .6)*2.5, 0, 1).toFixed(3));
  stage.style.setProperty('--p', clamp(p*1.6, 0, 1).toFixed(3));
  const phase = p < .3 ? 0 : p < .52 ? 1 : p < .74 ? 2 : 3;
  phaseEls.forEach((el,i) => el.classList.toggle('on', i <= phase && p > .12));
  if(ph !== phase){ ph = phase; $('#capH').textContent = caps[phase][0]; $('#capP').textContent = caps[phase][1]; }
  $('#hudP').textContent = Math.round(p*100) + '%';
  if(!gl) return;
  const mx = T.mouse.x/innerWidth - .5, my = T.mouse.y/innerHeight - .5;
  st.rx = lerp(st.rx, my*.35, 1 - Math.pow(.02, dt)); st.ry = lerp(st.ry, mx*.6, 1 - Math.pow(.02, dt));
  const solid = clamp((p - .5)/.3, 0, 1), build = clamp(p/.5, 0, 1);
  const s01 = clamp(p/.86, 0, 1), ease = s01 < .5 ? 4*s01*s01*s01 : 1 - Math.pow(-2*s01 + 2, 3)/2;
  gl.group.rotation.x = st.rx + (1 - solid)*.15 - .05;
  gl.group.rotation.y = st.ry + Math.sin(t/2400)*.12 + (reduce ? 0 : ease*Math.PI*2);
  gl.group.scale.setScalar(.9 + solid*.18);
  gl.wireMat.opacity = (.12 + build*.45)*(1 - solid*.92);
  gl.edgeMat.opacity = (1 - solid)*.95;
  gl.dimMat.opacity = clamp(build*2, 0, 1)*(1 - clamp(solid*2, 0, 1))*.8;
  gl.solidMat.opacity = solid; const tr = solid < .995;
  if(gl.solidMat.transparent !== tr){ gl.solidMat.transparent = tr; gl.solidMat.depthWrite = !tr || solid > .5; gl.solidMat.needsUpdate = true; }
  if(!tr) gl.solidMat.opacity = 1;
  gl.sparkMat.opacity = solid; gl.sparkMat.emissiveIntensity = solid*(.42 + Math.sin(t/300)*.12);
  gl.warm.intensity = solid*.9;
  gl.pm.opacity = .15 + solid*.65;
  gl.pts.rotation.y += dt*(.04 + solid*.12);
  gl.rings.forEach((r,i) => { r.rotation.z += dt*(i ? -.08 : .1); r.material.opacity = .25 + solid*.35; });
  gl.renderer.render(gl.scene, gl.cam);
});
})();
