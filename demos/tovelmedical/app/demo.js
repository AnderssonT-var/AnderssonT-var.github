/* TovelMedical · capa de demo estática (datos ficticios, sin servidor). */
(function () {
  var root = document.documentElement.dataset.demoRoot || './';
  var r = function (p) { return root + p; };

  // 1. La agenda en JSON sale de archivos pregenerados.
  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = new URL(input instanceof Request ? input.url : String(input), location.href);
    var m;
    if (/api\/doctores\.json$/.test(url.pathname)) {
      var esp = url.searchParams.get('especialidad');
      url = new URL(esp ? url.pathname.replace('doctores.json', 'doctores-' + esp + '.json') : url.pathname, url);
    } else if ((m = url.pathname.match(/api\/doctores\/(\d+)\/bloques\.json$/))) {
      url = new URL(url.pathname.replace('bloques.json', 'bloques-' + url.searchParams.get('fecha') + '.json'), url);
    }
    return nativeFetch(url.href, init).then(function (res) {
      if (res.ok) return res;
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
  };

  var avisar = function (msg, tipo) {
    if (window.toast) window.toast(msg, tipo || 'ok', 4500);
    else alert(msg);
  };

  var inicios = {
    'admin@tovelmedical.com': 'admin.html',
    'doctor@tovelmedical.com': 'doctor.html',
    'paciente@tovelmedical.com': 'mi.html',
  };

  document.addEventListener('click', function (e) {
    var demo = e.target.closest('[data-demo]');
    if (demo && inicios[demo.dataset.demo]) { e.preventDefault(); location.href = r(inicios[demo.dataset.demo]); return; }
    var off = e.target.closest('a[data-demo-off]');
    if (off) { e.preventDefault(); avisar('Esta vista no está incluida en la demo. En la versión instalada funciona completa.'); }
  });

  // 2. Los formularios no guardan nada: avisan y, cuando tiene sentido, siguen el recorrido.
  window.addEventListener('submit', function (e) {
    if (e.defaultPrevented) return; // p. ej. el diálogo de confirmación de la app
    if ((e.target.getAttribute('method') || '').toLowerCase() === 'dialog') return;
    var f = e.target;
    var accion = f.getAttribute('data-demo-action') || '';
    e.preventDefault();
    if (accion === 'logout') { location.href = r('index.html'); return; }
    if (accion === 'login') {
      var mail = (f.querySelector('[name=email]') || {}).value || '';
      if (inicios[mail.trim().toLowerCase()]) { location.href = r(inicios[mail.trim().toLowerCase()]); return; }
      avisar('Usa una de las cuentas de prueba de abajo.', 'error'); return;
    }
    if (accion === 'registro') { location.href = r('mi/reservar.html'); return; }
    if (accion === 'reservar') {
      sessionStorage.setItem('demo-aviso', 'Reserva simulada. En la versión instalada el horario queda apartado para ti.');
      location.href = r('mi/citas.html'); return;
    }
    if (f.method.toLowerCase() === 'get') { avisar('Los filtros y búsquedas funcionan en la versión instalada.'); return; }
    avisar('Demo con datos ficticios: los cambios no se guardan.');
  });

  document.addEventListener('DOMContentLoaded', function () {
    var pendiente = sessionStorage.getItem('demo-aviso');
    if (pendiente) { sessionStorage.removeItem('demo-aviso'); setTimeout(function () { avisar(pendiente); }, 300); }

    // 3. Recorrido guiado.
    var pasos = [
      ['index.html', 'Portada pública'],
      ['mi/reservar.html', 'Reservar como paciente'],
      ['mi.html', 'Inicio del paciente'],
      ['doctor/agenda.html', 'Agenda del doctor'],
      ['doctor/citas/' + (document.documentElement.dataset.demoCita || '1') + '/atender.html', 'Atender una consulta'],
      ['admin.html', 'Panel de administración'],
      ['admin/doctores/1/edit.html', 'Doctor y sus turnos'],
    ];
    var aqui = location.pathname;
    var actual = pasos.findIndex(function (p) { return aqui.endsWith('/' + p[0]) || (p[0] === 'index.html' && /\/app\/?$/.test(aqui)); });
    var caja = document.createElement('div');
    caja.className = 'demo-tour';
    caja.innerHTML =
      '<button type="button" class="demo-tour-btn" popovertarget="demo-tour-panel" aria-label="Abrir el recorrido">' +
      '<span class="demo-dot"></span>Demo' + (actual >= 0 ? ' <b>' + (actual + 1) + '/' + pasos.length + '</b>' : '') + '</button>' +
      (actual >= 0 && actual < pasos.length - 1 ? '<a class="demo-next" href="' + r(pasos[actual + 1][0]) + '">Siguiente: ' + pasos[actual + 1][1] + '</a>' : '') +
      '<div id="demo-tour-panel" popover class="demo-tour-panel"><p><b>Recorrido por TovelMedical</b><br><span>Datos ficticios. Nada se guarda.</span></p><ol>' +
      pasos.map(function (p, i) { return '<li><a href="' + r(p[0]) + '"' + (i === actual ? ' aria-current="step"' : '') + '>' + p[1] + '</a></li>'; }).join('') +
      '</ol><a class="demo-back" href="' + r('../../productos.html') + '">Volver a Tovel</a></div>';
    document.body.append(caja);
  });
})();
