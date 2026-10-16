/* Gestor Académico · demo estática.
   Sustituye al servidor PHP: cada petición AJAX se responde con lo que devolvió
   la app real (grabado con datos ficticios). Los cambios no se guardan. */
(function () {
  var ROOT = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/demo\/gestor-demo\.js.*$/, '') : '';
  })();
  var WRITE = /(registr|modific|editar|actualiz|update|elimin|insert|agregar|cambiar|crear|subir|send|guardar|asignar|anular|delete|borrar|nuevo|matricul|pagar)/i;
  var REC = window.__REC || [];
  var BY_PATH = {};
  REC.forEach(function (r) { (BY_PATH[r.p] = BY_PATH[r.p] || []).push(r); });

  function rel(url) {
    var a = new URL(url, location.href);
    var p = a.href.indexOf(ROOT) === 0 ? a.href.slice(ROOT.length) : a.pathname.replace(/^.*\/gestor\//, '');
    return { p: p.split('?')[0].split('#')[0], q: a.search.slice(1) };
  }
  function parse(s) {
    var o = {};
    (s || '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
      try { k = decodeURIComponent(k.replace(/\+/g, ' ')); v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) {}
      o[k] = v;
    });
    return o;
  }
  function score(a, b) {
    var s = 0, k;
    for (k in a) if (k in b) s += (String(a[k]) === String(b[k])) ? 3 : 0.5;
    for (k in b) if (!(k in a)) s -= 0.25;
    return s;
  }
  function lookup(p, params) {
    var list = BY_PATH[p];
    if (!list) return null;
    var best = null, bs = -1e9;
    for (var i = 0; i < list.length; i++) {
      var s = score(params, list[i].a);
      if (s > bs) { bs = s; best = list[i]; }
    }
    return best;
  }

  var toastEl, toastT;
  function toast(m) {
    if (!toastEl) {
      toastEl = document.createElement('div'); toastEl.id = 'demo-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = m; toastEl.style.opacity = 1;
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.style.opacity = 0; }, 2800);
  }
  window.__demoToast = toast;

  function respond(opts) {
    var u = rel(opts.url);
    var body = typeof opts.data === 'string' ? opts.data : '';
    var isForm = opts.data && typeof opts.data === 'object';
    var params = parse(u.q + '&' + body);
    var p = u.p;

    // Inicio de sesión: cualquier contraseña entra en la demo
    if (/controlador_crear_session\.php$/.test(p)) {
      var rol = (params.rol || '').toUpperCase();
      var key = rol.indexOf('DOCENTE') === 0 ? 'docente' : rol.indexOf('ALUM') === 0 ? 'alumno' : 'admin';
      try { sessionStorage.setItem('gestor-demo-rol', key); } catch (e) {}
      return '1';
    }
    if (/controlador_verificar_usuario\.php$/.test(p) && window.__LOGIN) {
      var who = p.indexOf('/docente/') > -1 ? 'docente' : p.indexOf('/alumno/') > -1 ? 'alumno' : 'admin';
      return window.__LOGIN[who];
    }
    if (/cerrar_session/.test(p)) { try { sessionStorage.clear(); } catch (e) {} return '1'; }

    var isWrite = !/^vista\//.test(p) && !/cambiar_estado/.test(p) && (isForm || (WRITE.test(p.split('/').pop()) && !/listar|traer|extraer|combo|ver|get|mostrar/i.test(p.split('/').pop())));
    var hit = lookup(p, params);
    if (isWrite) {
      setTimeout(function () { toast('Demo con datos ficticios: el cambio no se guarda.'); }, 400);
      if (hit && /^\s*[01]\s*$/.test(hit.r)) return '1';
      return hit ? hit.r : '1';
    }
    if (hit) return hit.r;
    if (/vista\//.test(p)) return '<div class="col-md-12"><div class="box box-info"><div class="box-body">Esta sección no está incluida en la demo.</div></div></div>';
    return '[]';
  }

  function install($) {
    $.ajaxTransport('+*', function (opts) {
      var u = rel(opts.url).p;
      if (!/\.php$/.test(u)) return;
      return {
        send: function (headers, done) {
          var txt = respond(opts);
          setTimeout(function () { done(200, 'OK', { text: txt }, 'Content-Type: text/html; charset=utf-8'); }, 90);
        },
        abort: function () {}
      };
    });
  }
  if (window.jQuery) install(window.jQuery);
  else {
    var t = setInterval(function () { if (window.jQuery) { clearInterval(t); install(window.jQuery); } }, 5);
  }

  // Reportes PDF pre-generados
  var wopen = window.open;
  window.open = function (url) {
    var m = /reporte_matricula\.php\?id=(\d+)/.exec(url || '');
    if (m) return wopen.call(window, ROOT + 'demo/reportes/matricula-' + m[1] + '.pdf', '_blank');
    if (/\.php/.test(url || '')) { toast('Este reporte no está incluido en la demo.'); return null; }
    return wopen.apply(window, arguments);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.createElement('div');
    bar.id = 'demo-bar';
    bar.innerHTML = '<span>Demo · datos ficticios</span>' +
      '<a href="' + ROOT + 'vista/admin.html" data-r="admin">Administrador</a>' +
      '<a href="' + ROOT + 'vista/docente.html" data-r="docente">Docente</a>' +
      '<a href="' + ROOT + 'vista/alumno.html" data-r="alumno">Alumno</a>' +
      '<a href="https://github.com/AnderssonT-var/Gestor_academico" target="_blank" rel="noopener">Código</a>';
    document.body.appendChild(bar);
    bar.addEventListener('click', function (e) {
      var a = e.target.closest('[data-r]');
      if (a) try { sessionStorage.setItem('gestor-demo-rol', a.getAttribute('data-r')); } catch (x) {}
    });
    var cur = window.__ROLE && bar.querySelector('[data-r="' + window.__ROLE + '"]');
    if (cur) cur.className = 'on';
  });
})();
