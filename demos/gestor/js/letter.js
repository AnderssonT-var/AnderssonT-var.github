


//FUNCION LISTAR CURSOS DEL ALUMNO SEGUN EL GRADO
var cursos_table;
function listar_cursosAlumno(idGrado) {
   //var idGrado  =$("#AlumIDgrado").val();
    //var idGrado  =$("#idGrado").val();
    cursos_table = $("#table_cursos").DataTable({
        "ordering": false,
        "bLengthChange": false,
        "searching": {
            "regex": false
        },
        "lengthMenu": [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "All"]
        ],
        "pageLength": 10,
        "destroy": true,
        "async": false,
        "processing": true,
        "ajax": {
            "url": "../controlador/alumno/controlador_listar_cursosAlum.php",
            type: 'POST',
            data:{idGrado:idGrado}  
        },
        "columns": [{
            "data": "idcurso" 
        }, {
            "data": "nonbrecurso"
        }, 
         {
            "data": "stadodocent",
             render: function(data, type, row) {
                if (data == 'DICTANDO') {
                    return "<span class='label label-success'>" + data + "</span>";
                } else {
                    return "<span class='label label-info'>" + data + "</span>";
                }
            }
        },
          {
            "defaultContent": "<button style='font-size:13px;' type='button' class='vernotas btn btn-warning'><i class=' glyphicon glyphicon-eye-open' title='ver Notas'></i></button>"
        }],
        "language": idioma_espanol,
        select: true
    });
    document.getElementById("table_cursos_filter").style.display = "none";
    $('input.global_filter').on('keyup click', function() {
        filterGlobal();
    });
    $('input.column_filter').on('keyup click', function() {
        filterColumn($(this).parents('tr').attr('data-column'));
    });

}
function filterGlobal() {
    $('#table_cursos').DataTable().search($('#global_filter').val(), ).draw();
}

$('#table_cursos').on('click', '.vernotas', function() {
    var data = cursos_table.row($(this).parents('tr')).data();
    

    if (cursos_table.row(this).child.isShown()) {
        var data = cursos_table.row(this).data();
        var idcurso=data.idcurso;
    }
     $("#Cursonom").html(data.nonbrecurso).trigger("change");//SUBIENDO nomb CURSO A LA VISTA
     $('#divtablanotas').show();//PRECENTANDO EL DIV 
      //$('#divprocentaje').show();//PRECENTANDO EL DIV procentaje
    var idcurso=data.idcurso;
    // alert(idcurso);
     Listar_Notas(idcurso);


})

/*
var table_notas;
function Listar_Notas(idcurso){
	var idalumo  =$("#textId").val();
	//alert('curso '+idcurso+' alumno'+idalumo);

	 table_notas = $("#table_notascurso").DataTable({
        "ordering": false,
        "bLengthChange": false,
        "searching": {
            "regex": false
        },
        "responsive": true,
        dom: 'Bfrtilp',
        buttons:[ 
      
      {
        extend:    'pdfHtml5',
        text:      '<i class="fa fa-download"></i> ',
        titleAttr: 'Exportar a PDF',
        className: 'btn btn-danger',
        style:'background-color:red'
      },
      {
        "extend":    'print',
        "text":      '<i class="fa fa-print"></i> ',
        "titleAttr": 'Imprimir',
        "className": 'btn btn-info'
      },
    ],
        "lengthMenu": [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "All"]
        ],
        "pageLength": 10,
        "destroy": true,
        "async": false,
        "processing": true, 
        "ajax": {
            "url": "../controlador/alumno/controlador_listar_NotasCur.php",
            type: 'POST',
            data:{idcurso:idcurso,idalumo:idalumo}  
        },
        "columns":[{ 
            "data": "practica1" 
        }, {
            "data": "practica2"
        }, 
        {
            "data": "practica3"
        }, 
        {
            "data": "practica4"
        }, 
        {
            "data": "trabajo1"
        }, 
        {
            "data": "trabajo2"
        }, 
        {
            "data": "trabajo3"
        }, 
        {
            "data": "trabajo4"
        }, 
        {
            "data": "parcial1"
        }, 
        {
            "data": "parcial2"
        }, 
        {
            "data": "parcial3"
        }, 
        {
            "data": "parcial4"
        }, 
        {
            "data": "exsamen1"
        }, 
        {
            "data": "exsamen1"
        }, 
         
         ],
        "language": idioma_espanol,
        select: true
    });
    document.getElementById("table_notascurso_filter").style.display = "none";
    $('input.global_filter').on('keyup click', function() {
        filterGlobal();
    });
    $('input.column_filter').on('keyup click', function() {
        filterColumn($(this).parents('tr').attr('data-column'));
    });


}*/

function Listar_Notas(idcurso) {
  var idalumo = $("#textId").val();

  $.ajax({
    url: "../controlador/alumno/letter-notes.php",
    type: "POST",
    data: {
      idcurso: idcurso,
      idalumo: idalumo
    }
  }).done(function (resp) {
    var datos = JSON.parse(resp);

    $('#tabla_notas').empty();

    if (!datos.data || datos.data.length === 0) {
      $('#tabla_notas').html(`
        <tr>
          <td colspan="15" style="text-align:center; padding: 20px; font-weight:bold; color:gray;">
            No hay notas para el curso aún.
          </td>
        </tr>
      `);
      return;
    }

    let template = '';

    datos.data.forEach(tarea => {
      const campos = [
        "practica1", "practica2", "practica3", "practica4",
        "trabajo1", "trabajo2", "trabajo3", "trabajo4",
        "parcial1", "parcial2", "parcial3", "parcial4",
        "exsamen1", "exsamen2"
      ];

      // Función para determinar la clase de color
      const colorClase = letra => {
        if (!letra) return '';
        const nota = letra.toUpperCase();
        return (nota === 'C' || nota === 'D' || nota === 'E') ? 'text-danger' : 'text-primary';
      };

      const letraANumero = letra => {
        const mapa = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0 };
        return mapa[letra?.toUpperCase()] ?? null;
      };

      const numeroALetra = prom => {
        if (prom >= 3.5) return 'A';
        if (prom >= 2.5) return 'B';
        if (prom >= 1.5) return 'C';
        if (prom >= 0.5) return 'D';
        return 'E';
      };

      let total = 0, count = 0;

      // Generar celdas con color según la letra
      let celdasNotas = '';
      campos.forEach(campo => {
        const valor = tarea[campo] ?? '';
        const color = colorClase(valor);
        celdasNotas += `<td><input type="text" style="border-radius: 5px;" class="form-control text-center ${color}" value="${valor}" disabled></td>`;


        const valNum = letraANumero(valor);
        if (valNum !== null) {
          total += valNum;
          count++;
        }
      });

      const promedioLetra = numeroALetra(total / count);
      const colorProm = colorClase(promedioLetra);

      template += `
        <tr>
          ${celdasNotas}
          <td class="text-center"><strong class="${colorProm}">${promedioLetra}</strong></td>
        </tr>
      `;
    });

    $('#tabla_notas').html(template);
  });
}


function aluas_de_clases(idgrado){
  var tala_aulas = $("#table_aulas").DataTable({
        "ordering": false,
        "bLengthChange": false,
        "searching": {
            "regex": false
        },
        "lengthMenu": [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "All"]
        ],
        "pageLength": 10,
        "destroy": true,
        "async": false,
        "processing": true,
        "ajax": {
            "url": "../controlador/alumno/controlador_listar_aulas.php",
            type: 'POST',
            data:{idgrado:idgrado}  
        },
        "columns": [{
            "data": "idaula" 
        }, {
            "data": "nombreaula"
        },
        {
            "data": "piso"
        },
        {
            "data": "numero"  
        },
        {
            "data": "aforro"
        },
         {
            "data": "seccion"
        },
         ],
        "language": idioma_espanol,
        select: true
    });
    document.getElementById("table_aulas_filter").style.display = "none";
    $('input.global_filter').on('keyup click', function() {
        filterGlobal();
    });
    $('input.column_filter').on('keyup click', function() {
        filterColumn($(this).parents('tr').attr('data-column'));
    });
}  


//FUNCION DE PAGOS ALUMNO
var table_agos;
function pagos_penciones(id){
//var id  =$("#UserNom").val();

 var table_agos = $("#tabla_pagos").DataTable({
        "ordering": true,
        "bLengthChange": false,
        "searching": {
            "regex": false
        },
         "responsive": true,
        dom: 'Bfrtilp',
        buttons:[ 
      
      {
        extend:    'pdfHtml5',
        "text":      '<i class="fa fa-download"></i> ',
        "titleAttr": 'Exportar a PDF',
        "className": 'btn btn-danger'
        
      },
      {
        "extend":    'print',
        "text":      '<i class="fa fa-print"></i> ',
        "titleAttr": 'Imprimir',
        "className": 'btn btn-info'
      },
       {
        "extend":    'excel',
        "text":      '<i class="fa fa-file-text-o"></i> ',
        "titleAttr": 'Excel',
        "className": 'btn btn-info'
      },{
        "extend":    'csvHtml5',
        "text":      '<i class="fa  fa-file-excel-o"></i> ',
        "titleAttr": 'cvs',
        "className": 'btn btn-info'
      }/*,{
                extend: 'collection',
                text: 'Export',
                buttons: [
                    'copy',
                    'excel',
                    'csv',
                    'pdf',
                    'print'
                ]
            }*/
      ],
        "lengthMenu": [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "All"]
        ],
        "pageLength": 10,
        "destroy": true,
        "async": false,
        "processing": true,
        "ajax": {
            "url": "../controlador/alumno/controlador_meses_pagasosAlum.php",
            type: 'POST',
            data:{id:id}  
        },
        "columns": [{
            "data": "montopago" 
        }, {
            "data": "description"
        },
        {
            "data": "fechasPagados"
        },
        {
            "data": "fechaUpdate"  
        },
        {
            "data": "stado",
            render: function(data, type, row) {
                if (data == 'PAGADO') {
                    return "<span class='label label-success'>" + data + "</span>";
                } else {
                    return "<span class='label label-danger'>" + data + "</span>";
                }
            }
        },
         
         ],
        "language": idioma_espanol,
        select: true
    });
    document.getElementById("tabla_pagos_filter").style.display = "none";
    $('input.global_filter').on('keyup click', function() {
        filterGlobal();
    });
    $('input.column_filter').on('keyup click', function() {
        filterColumn($(this).parents('tr').attr('data-column'));
    });


}

function estadi_deudasAlum(){
var idalum = $("#textId").val();

 $.ajax({
        url:'../controlador/alumno/controlador_Estado_pagos.php',
        type:'POST',
        data:{ idalum: idalum}
    }).done(function(resp) {
      
        var data = JSON.parse(resp);
         $("#ApellidoAlumno").html(data[0]['apellidop']);///enviando a la vista Calificaciones id grado
         //$("#nombreGrado").html(data[0][1]).trigger("change");
         $("#nombreAlumno").html(data[0]['alumnonombre']);
         $("#gradoAlumno").html(data[0]['gradonombre']);

         var utip=(data[0]['fechaRegisto']);

         var fecha = new Date(utip);
         var options = { year: 'numeric', month: 'long', day: 'numeric' };
         var ultimopago = fecha.toLocaleDateString("es-ES", options)
         $("#Ultimoaporte").html( ultimopago);

         var mespag=(data[0]['fechaUpdate']);

         var fecha = new Date(mespag);
         var options = { year: 'numeric', month: 'long', day: 'numeric' };
         var mespago = fecha.toLocaleDateString("es-ES", options)

         $("#mesdepago").html(mespago);

         var estado=(data[0]['stadoPago'])

         if (estado =='PAGADO') {
          $("#estadopago").html(estado);
         }else
         {
          $("#estadeuda").html(estado);
         }
      pagos_penciones(data[0]['apellidop']);

    })

}