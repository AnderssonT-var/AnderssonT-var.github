
var cursosDocente = [];
function Listra_Cursos_Docente(id_select){
    $.ajax({
     url:'../controlador/attendance/ControllerGetCursesDocente.php',
     type:'POST'

    }).done(function(resultado){
      var data = JSON.parse(resultado);
      if (data.length>0) {
        cursosDocente = data;
      Componente_cursos_Docente(data);
      render_couses(data, id_select)
      }else {
        $("#cursos_grado").html('<h3> No tienes cursos Asignados</h3>');
      }

    })

}
//////////////////////////////////////////
function render_couses(data,id_select) {
    var select = $("."+id_select);
    select.empty(); // Limpiamos el select por si tenía algo

    select.append('<option value="">Seleccione un curso</option>'); // Opción por defecto
console.log(data)
    $.each(data, function(index, item) {
        select.append('<option value="' + item.curso_id + '">' + item.nonbrecurso + '</option>');
    });
}

function Resito_AsistenciaView(){
  $("#DivAsistenciaCrud").hide();
  $("#DinNuevoAsistencia").show();
  Listra_Cursos_Docente('cmb_cousesId');

}

function Editar_AsistenciaView(){
  $("#DivAsistenciaCrud").hide();
  $("#EditarDivAsistencia").show();
  Listra_Cursos_Docente('cmb_cousesId_edit');


}

function Eliminar_AsistenciaView(){
  $("#DivAsistenciaCrud").hide();
  $("#EditarDivAsistencia").hide();
  $("#ElimirarDivAsistencia").show();

  Listra_Cursos_Docente('cmb_cousesId_remove');


}

function Reporte_AsistenciaView(){
  $("#DivAsistenciaCrud").hide();
  $("#EditarDivAsistencia").hide();
  $("#ElimirarDivAsistencia").hide();

}

async function cursosDocentef(id){

 var fountd = cursosDocente .filter(item => item.curso_id == id)
console.log(fountd)
 $(".id_grade").val(fountd[0].grado_id || '');
 $(".text_name_grade").val(fountd[0].gradonombre || '');  
} 

async function ShowSelected(idselect){
 
  var idgrado = $("."+idselect).val();

  if(idgrado){
    cursosDocentef(idgrado);
  }else{
 
  }
}


function Listar_Alumno_Asistencia() {
 var id_couses=$(".cmb_cousesId ").val();
 var id_grade=$(".id_grade").val();
 //var idyear  = $("#YearActualActivo").val();


 if ( id_couses?.length==0 ||  id_grade?.length==0) {
  return Swal.fire("MENSAJE DE ADVERTENCIA", "Debes seleccionar los prámetos para listar alumnos matriculados  !!", "warning");
}
$("#btn_bucar_data").html("<em class='fa fa-spin fa-refresh'></em>");
$('#btn_bucar_data').prop('disabled',true);

$.ajax({
 url:'../controlador/attendance/listar_asistencias.php',
 type:'POST',
 data:{id_couses:id_couses,id_grade:id_grade}
}).done(function(resultado){
  var data = JSON.parse(resultado);

  
  if (data.length!=0 ) {
    $("#btn_bucar_data").html("<em class='fa fa-search'></em>");
    $('#btn_bucar_data').prop('disabled',false);
    recorerresultado_Asistencias(data);

  }
  else{
    $("#btn_bucar_data").html("<em class='fa fa-search'></em>");
    $('#btn_bucar_data').prop('disabled',false);
    var datos_add ="";
    datos_add +=  "<tr><td ></td><td ></td><td >No se encontó Ningun Alumno Matriculado para los parametros ingresados!</td><tr>";  
    $("#tbody_tabla_detall").html(datos_add);
  }

});

} 

function recorerresultado_Asistencias(data){ 
 var datos_add ="";let n=0;
 
 data.forEach(valor => {
  datos_add +=  "<tr>";  
  datos_add += "<td >"+valor.idalumno+"</td>";
  datos_add += "<td >"+valor.apellidop+','+valor.alumnonombre+"</td>";
  datos_add += "<td >"+valor.gradonombre+"</td>";
  datos_add+="<td style='text-align: center'>";
  datos_add+="<label class='switch_checbok' style='display: block !important;'>";
  datos_add+="<input type='checkbox' id='new_comboAsistencia' class='clas_chebo"+n+"'>";
  datos_add+="<span class='siderasis round'></span>";
  datos_add+="</label>";
  datos_add+="</td>";
  datos_add += "<tr>";
  n++;
})
 $('#tbody_tabla_detall').html(datos_add);

}
function asignar_attendance(){
  var cousesId=$(".cmb_cousesId ").val();
  var gradeId=$(".id_grade").val();


  var fechaAsisten =$("#FechaAsistencia").val();
  var vectorId=new Array();
  var vectorSelect=new Array();

  $('#tbody_tabla_detall tr').each(function() {
   vectorId.push($(this).find('td').eq(0).text());
 });

  $(".switch_checbok input[id='new_comboAsistencia']").each(function(index){
   if (this.checked) {
    vectorSelect.push(1+',');
  }else{
    vectorSelect.push(0+',');
  }

});

  var vectorIdpersonas = vectorId.toString();
  var vectorEstado = vectorSelect.toString();

  if(fechaAsisten.length == 0){
   return Swal.fire("Mensaje De Advertencia", "Ingrese fecha de las asistencias", "warning");
 }

 if(vectorIdpersonas.length == 0){
   return Swal.fire("Mensaje De Advertencia", "No hay Alumnos para registrar", "warning");
 }

 $('#button_resgist').prop('disabled',true);
 $('.loader').show();////prende
 $.ajax({
  url:'../controlador/attendance/registrar_asistencia.php',
  type:'POST',
  data:{vectorIdpersonas:vectorIdpersonas,vectorEstado:vectorEstado,fechaAsisten:fechaAsisten,
    cousesId:cousesId,gradeId:gradeId}
  }).done(function(resultado){
    var data = JSON.parse(resultado);
    if(data.status) {
     if (data.data==1) {
       $('#button_resgist').prop('disabled',false);
                $('.loader').hide();////prende
                $("#DinNuevoAsistencia").hide();
                $("#FechaAsistencia").val('')
                $("#DivAsistenciaCrud").show();
                reset_sedebar();
                Swal.fire({icon: 'success', title: 'Mensaje de Éxito !!', text:''+data.msg, showConfirmButton: false,timer: 1500 });
              } else {
                $('#button_resgist').prop('disabled',false);
                $('.loader').hide();////prende
                return Swal.fire("Mensaje De Advertencia", ""+data.msg, "warning");
              }

            }else{
              $('#button_resgist').prop('disabled',false);
                $('.loader').hide();////prende
                return Swal.fire("Mensaje De error", "No se pudo registrar las asistencias"+data.msg, "error");
              }
            });
}

 function reset_sedebar(){
  $("#DivAsistenciaCrud").show();
  $("#DinNuevoAsistencia").hide();
  $("#EditarDivAsistencia").hide();
  $("#ElimirarDivAsistencia").hide();
  
  $("#tbody_tabla_EditAsis").html("");


  $("#FecahaFin").val('');
  $("#FechaInicio").val('');
  $("#SeachFechaEdit").val("");
  $("#FechaAsistencia").val('');

  $("#txt_nivel_nivel").val('');
  $(".id_grade").val('');
   $(".text_name_grade").val('');
  $("#text_seccion").val('');
  $("#edit_txt_nivelId").val('');
  $("#edit_text_seccion").val('');
  $('#cbm_grado').val('').trigger('change');
  $('#elim_cbm_grado').val('').trigger('change');
  $('#edit_cbm_grado').val('').trigger('change');

  $('#edit_button_resgist').prop('disabled',false);

  $('#button_resgist').prop('disabled',false);
  $('#elim_button_resgist').prop('disabled',false);
  $("#elim_txt_nivel_nivel_seccion").val('');
  $("#edit_txt_nivel_nivel").val('');
 $('.loader').hide();////prende

 $("#tbody_tabla_Filtrados").html("");
 $("#tbody_tabla_detall").html("");
 $("#Reportes_asistencia").html("");

}


function Listar_Asistencias_fecha(){

  var couse_id=$(".cmb_cousesId_edit").val();
  var degre_id=$(".id_grade ").val();
  var fechaEntrada =$("#SeachFechaEdit").val();

 
  if ( couse_id?.length==0 || degre_id?.length==0) {
    return Swal.fire("MENSAJE DE ADVERTENCIA", "Debes seleccionar los prámetos para listar alumnos matriculados  !!", "warning");
  }

  if (fechaEntrada.length==0) {
    return Swal.fire("Mensaje de advertencia", "Ingrese la fecha que deseas editar !!", "warning");
  }
  $("#edit_btn_bucar_data").html("<em class='fa fa-spin fa-refresh'></em>");
  $('#edit_btn_bucar_data').prop('disabled',true);
  
  $.ajax({
    url:'../controlador/attendance/editar_attendance.php',
    type:'POST',
    data:{fechaEntrada:fechaEntrada,couse_id:couse_id,degre_id:degre_id}
  }).done(function(resultado){
   var data = JSON.parse(resultado);
   

   if (data?.length!=0 ) { 
     $("#edit_btn_bucar_data").html("<em class='fa fa-search'></em>");
     $('#edit_btn_bucar_data').prop('disabled',false);
     Asistencias_Encontrados(data);
   }else{
    $("#edit_btn_bucar_data").html("<em class='fa fa-search'></em>");
    $('#edit_btn_bucar_data').prop('disabled',false);
    var datos_add ="";
    datos_add +=  "<tr><td ></td><td ></td><td >No hay asistencia registrado para la fecha ingresado!</td><tr>";  
    $("#tbody_tabla_EditAsis").html(datos_add);
  }
});

}


function Asistencias_Encontrados(data){
 var datos_add ="";
 data.forEach(valor => {
   datos_add +=  "<tr>";  
   datos_add += "<td >"+valor.idalumno+"</td>";
   datos_add += "<td >"+valor.apellidop+"</td>";
   datos_add += "<td >"+valor.gradonombre+"</td>";
   datos_add+="<td><label class='switch_checbok' style='display: block !important;'>";
   valor.Est_Asis==1 ? datos_add+="<input type='checkbox' id='edit_comboAsistencia' checked>":
   datos_add+="<input type='checkbox' id='edit_comboAsistencia'>";

   datos_add+="<span class='siderasis round'></span>";
   datos_add+="</label>";
   datos_add+="</td>";
   datos_add += "<tr>";
 })
 $('#tbody_tabla_EditAsis').html(datos_add);
}


function Update_Asistencia(){

  var fechaAsisten =$("#SeachFechaEdit").val();
  var vectorId=new Array();
  var vectorSelect=new Array();

  $('#tbody_tabla_EditAsis tr').each(function() {
   vectorId.push($(this).find('td').eq(0).text());
 });
  $(".switch_checbok input[id='edit_comboAsistencia']").each(function(index){
   if (this.checked) {
    vectorSelect.push(1+',');
  }else{
    vectorSelect.push(0+',');
  }
});


  if(fechaAsisten.length == 0){
   return Swal.fire("Mensaje De Advertencia", "Ingrese fecha de las asistencias", "warning");
 }

 if(vectorId.length == 0){
   return Swal.fire("Mensaje De Advertencia", "No hay Alumnos para registrar", "warning");
 }

 $('#edit_button_resgist').prop('disabled',true);
 $('.loader').show();////prende

 var vectorIdpersonas = vectorId.toString();
 var vectorEstado = vectorSelect.toString();

 $.ajax({
  url:'../controlador/attendance/update_asistencia.php',
  type:'POST',
  data:{vectorIdpersonas:vectorIdpersonas,vectorEstado:vectorEstado,fechaAsisten:fechaAsisten}
}).done(function(resultado){

  var data = JSON.parse(resultado);

  if (data.data==1) {
   $('#edit_button_resgist').prop('disabled',false);
       $('.loader').hide();////prende

       $("#EditarDivAsistencia").hide();
       $("#DivAsistenciaCrud").show();
       reset_sedebar();
       Swal.fire({icon: 'success', title: 'Mensaje de Éxito !!', text:''+data.msg, showConfirmButton: false,timer: 1500 });
     }else{
       $('#edit_button_resgist').prop('disabled',false);
        $('.loader').hide();////prende
        return Swal.fire("Mensaje De Error", ""+data.msg, "error");
      }

    });

}


function Estraer_Asistencia_Eliminar(){

  var id_couse=$(".cmb_cousesId_remove").val();
  var id_grade=$(".id_grade ").val();
  var fechainicio=$("#FechaInicio").val();
  var fechafin=$("#FecahaFin").val();



  if ( id_grade?.length==0 || id_couse?.length==0 ) {
    return Swal.fire("MENSAJE DE ADVERTENCIA", "Debes seleccionar los prámetos para listar Asistencias  !!", "warning");
  }
  if (fechainicio.length==0 || fechafin.length==0) {
    return Swal.fire("Mensaje de advertencia", "Ingrese la fecha que deseas Visualizar !!", "warning");
  }

  $("#elimi_btn_bucar_data").html("<em class='fa fa-spin fa-refresh'></em>");
  $('#elimi_btn_bucar_data').prop('disabled',true);
  


  $.ajax({
    url:'../controlador/attendance/filtrar_asistencias.php',
    type:'POST',
    data:{fechainicio:fechainicio,fechafin:fechafin,id_grade:id_grade,id_couse:id_couse}
  }).done(function(resultado){
    var data = JSON.parse(resultado);
    if (data?.length!=0) {
     Recorer_Filtros_Asistencia(data);

     $("#elimi_btn_bucar_data").html("<em class='fa fa-search'></em>");
     $('#elimi_btn_bucar_data').prop('disabled',false);
   }
   else{
    $("#FechaInicio").val('');
    $("#FecahaFin").val('');
    $("#elimi_btn_bucar_data").html("<em class='fa fa-search'></em>");
    $('#elimi_btn_bucar_data').prop('disabled',false);
    var datos_add ="";
    datos_add +=  "<tr><td ></td><td ></td><td >No hay asistencia registrado para la fecha ingresado!</td><tr>";  
    $("#tbody_tabla_Filtrados").html(datos_add);
  }
})
}

function  Recorer_Filtros_Asistencia(data){
  var numerador=1;
  var datos_add ="";
  data.forEach(valor => {
    datos_add +=  "<tr>";  
    datos_add += "<td >"+numerador+"</td>";
    datos_add += "<td >"+valor.apellidop+' '+valor.alumnonombre+"</td>";
    datos_add += "<td >"+valor.Fechas+"</td>";
    datos_add+="<td><label class='switch_checbok'>";

    valor.Est_Asis==1 ? datos_add+="<span class='label label-success'>Asistió</span>":
    datos_add+="<span class='label label-warning'>Falto</span>";
    datos_add+="</td>";
    datos_add += "<tr>";
    numerador++;
  })
  $('#tbody_tabla_Filtrados').html(datos_add);

}



function Elimirar_Asistencia(){
  var fechainicio=$("#FechaInicio").val();
  var fechafin=$("#FecahaFin").val();

  var idgrado_  = $(".id_grade").val();
  var couseId_  = $(".cmb_cousesId_remove").val();



  if(fechainicio.length==0 || fechafin.length==0){
    return Swal.fire("Mensaje De Advertencia", "Ingresa el Rango de Fechas", "warning");
  }

  Swal.fire({
    title: 'Esta seguro de eliminar al las asistencias?',
    text: "Una vez hecho esto el no se podran recuperar los registros",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#05ccc4',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Si'
  }).then((result) => {
    if (result.value) {

     $('#elim_button_resgist').prop('disabled',true);
 $('.loader').show();////prende  

 $.ajax({
  url:'../controlador/attendance/eliminar_asistencias.php',
  type:'POST',
  data:{fechainicio:fechainicio,fechafin:fechafin,idgrado_:idgrado_,couseId_:couseId_}
}).done(function(resultado){
  $("#FechaInicio").val('');
  $("#FecahaFin").val('');
  var data = JSON.parse(resultado);
  if (data!=null) {

    $("#tbody_tabla_Filtrados").html("");
    Swal.fire({icon: 'success', title: 'Mensaje de Éxito !!', text: 'Datos correctamente, Las Asistencias Se eliminó Corectamente',showConfirmButton: false,timer: 1500 });
    reset_sedebar();

    $('#elim_button_resgist').prop('disabled',false);
 $('.loader').hide();////prende  
}
else{
  $('#elim_button_resgist').prop('disabled',false);
 $('.loader').hide();////prende  
 return Swal.fire("Mensaje De Advertencia", "No se pudo Eliminar  las asistencias"+resultado, "error");
}
})
}
}) 
  

}



function reports_attendance(){

  var finicio= $("#reportFechainicio").val();
  var fFinal= $("#reportFechafin").val();
  if(finicio.length == 0 || fFinal.length==0){
    return;
  }

  var talb_filAlum = $("#table_alumno").DataTable({
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
    text: '<i class="fa fa-file-pdf-o"></i>',
    title: 'REPORTE DE ASISTENCIA',
    className: 'btn btn-danger',
    style:'background-color:red'

    
  },{
    "extend":    'print',
    "text":      '<i class="fa fa-print"></i>',
    title: 'REPORTE DE ASISTENCIA',
    "titleAttr": 'Imprimir',
    "className": 'btn btn-info'
  },

  {
    "extend":    'excel',
    "text":      '<i class="fa fa-file-text-o"></i>',
    title: 'RREPORTE DE ASISTENCIA',
    "titleAttr": 'Excel',
    "className": 'btn btn-info'
  },{
    "extend":    'csvHtml5',
    "text":      '<i class="fa  fa-file-excel-o"></i>',
    title: 'REPORTE DE ASISTENCIA',
    "titleAttr": 'cvs',
    "className": 'btn btn-info'
  } 
  
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
    "url": "../controlador/attendance/reporte_lista_rango_fechas.php",
    type: 'POST',
    data:{finicio:finicio,fFinal:fFinal}  
  },
  "columns": [{
    "data": "idalumno"
  }, {
    "data": "apellidop"
  }, {
    "data": "alumnonombre"
  }, {
    "data": "gradonombre"},


   {
    "data": "Fechas"
  }, {
    "data": "stadoalumno"
  },{
    "data": "Est_Asis",
    render: function(data, type, row) {
      if (data == '1') {
       return "<span class='label label-success'>Asistió</span>";
     } else {
      return "<span class='label label-warning'>Falto</span>";
    }
  }
  
}],
"language": idioma_espanol,
select: true
});
  document.getElementById("table_alumno_filter").style.display = "none";
  $('input.global_filter').on('keyup click', function() {
    filterGlobal();
  });
  $('input.column_filter').on('keyup click', function() {
    filterColumn($(this).parents('tr').attr('data-column'));
  });
  
}
function filterGlobal() {
  $('#table_alumno').DataTable().search($('#global_filter').val(), ).draw();
}




















////////////////////////////////////

function Componente_cursos_Docente(data){
  var html='';
        $.each(data, function(i,elemt) {
        html += "<div class='col-md-3'  >";
        html += "<div class='info-box' id='divevent' tabindex='0' style='border-radius: 6px;cursor: pointer;background:#8a9b9a;color:white' onclick='Asignar_attendance("+elemt.curso_id+","+elemt.grado_id+")''>";
          html += "<span class='info-box-icon' style='width: 70px;border-radius: 6px'>";
            html += "<em class='fa fa-book '></em>";
          html += "</span>";
          html += "<div class='info-box-content'>";
            html += "<div class=''style='margin-top: 10px'>";
              html += "<h5 class=''><strong>"+elemt.nonbrecurso+"</strong></h5>";
              html += "<input type='text' id='namecurso"+elemt.curso_id+"' value='"+elemt.nonbrecurso+"' hidden>";
            html += "</div>";
            html += "<div>";
            html += "</div>";
          html += "</div>";
        html += "</div>";
      html += "</div>";
           });
    $('#cursos_grado').append(html);
}

function Asignar_attendance(idcurso,idgrado){
	$("#DinNuevoAsistencia").show();
  $("#idcurso").val(idcurso);
  $("#idgrado").val(idgrado);
  var nombrecurso =$("#namecurso"+idcurso).val();
  $("#NombreCursoselecionado").html(nombrecurso);

   $('#tbody_tabla_detall').html('');
   $("#FechaAsistencia ").val('');
   resetCheckbox() ;
    $("#btn_bucar_data").hide();

   $.ajax({
     url:'../controlador/attendance/ControllerGetAlumnos.php',
     type:'POST',
     data:{idcurso:idcurso,idgrado:idgrado}

    }).done(function(resultado){
      var data = JSON.parse(resultado);
      if (data.length>0) {
        Recorerresultado_Alumnos(data);

      }else {
         $("#tbody_tabla_detall").html('<p> No hay alumnos matrículados en este curso.</p>');
      }
    })
}

function Listar_Alumno_Asistencia_edit() {

  var idcurso=$("#idcurso ").val();
  var idgrado=$("#idgrado ").val();
  var fecha=$("#FechaAsistencia ").val();


     if (idcurso == null || idgrado==0 ) {console.log('NotData_Request');return;}
    if ( fecha?.length==0 ) {
     return Swal.fire("Mensaje de advertencia", "Ingrese la fecha que desea modificar la asistencia", "warning");
       }
       $("#btn_bucar_data").html("<em class='fa fa-spin fa-refresh'></em>");
        //$('#btn_bucar_data').prop('disabled',true);

       $.ajax({
        url:'../controlador/attendance/ControllerListarAsistenciaDate.php',
        type:'POST',
        data:{idcurso:idcurso,idgrado:idgrado,fecha:fecha}

       }).done(function(resultado){
         var data = JSON.parse(resultado);
      if (data.length!=0 ) {
        $("#btn_bucar_data").html("<em class='fa fa-search'></em>");
        $('#btn_bucar_data').prop('disabled',false);
        Asistencias_Editar(data);

      }
      else{
            $("#btn_bucar_data").html("<em class='fa fa-search'></em>");
        $('#btn_bucar_data').prop('disabled',false);
        var html ="";
        html +=  "<p>No se encontó Ningun Asistencia registrado para la fecha "+fecha+" </p>";  
        $("#tbody_tabla_detall").html(html);
      }

    });
} 

function Recorerresultado_Alumnos(data){ 
 var datos_add ="";let n=0;
    data.forEach(valor => {
     datos_add +=  "<tr>";  
     datos_add += "<td >"+valor.idalumno+"</td>";
     datos_add += "<td >"+valor.apellidop+','+valor.alumnonombre+"</td>";
     datos_add+="<td style='text-align: center'>";
     datos_add+="<label class='switch_checbok' style='display: block !important;'>";
     datos_add+="<input type='checkbox' id='new_comboAsistencia' class='clas_chebo"+n+"'>";
     datos_add+="<span class='siderasis round'></span>";
     datos_add+="</label>";
     datos_add+="</td>";
     datos_add += "</tr>";
     n++;
   })
    $('#tbody_tabla_detall').html(datos_add);

}
  ////REGISTRAR ASISTENCIA//////////
function RegistrarAsistencia(){
       var idcurso=$("#idcurso").val();
       var idgrado=$("#idgrado").val();
       var nombrecurso =$("#namecurso"+idcurso).val();
       var fechaAsisten =$("#FechaAsistencia").val();

        if(fechaAsisten.length == 0){
          return Swal.fire("Mensaje De Advertencia", "Ingrese fecha de las asistencias", "warning");
        }

         var vectorId=new Array();
         var vectorSelect=new Array();

         $('#tbody_tabla_detall tr').each(function() {
          vectorId.push($(this).find('td').eq(0).text());
        });

         $(".switch_checbok input[id='new_comboAsistencia']").each(function(index){
          if (this.checked) {
           vectorSelect.push(1);
         }else{
           vectorSelect.push(0);
         }

       });

        var vectorIdpersonas = vectorId.toString();
        var vectorEstado = vectorSelect.toString();
       if(vectorIdpersonas.length == 0){
         return Swal.fire("Mensaje De Advertencia", "No hay Alumnos para registrar", "warning");
       }
       $('#button_resgist').prop('disabled',true);

       $.ajax({
       
          url: editando === false ? "../controlador/attendance/ControllerRegistrarAsistencia.php" : "../controlador/attendance/ControllerActualizarAsistencia.php",
        type:'POST',
        data:{vectorIdpersonas:vectorIdpersonas,vectorEstado:vectorEstado,fechaAsisten:fechaAsisten,
        idgrado:idgrado,idcurso:idcurso}

        }).done(function(resultado){
          var data = JSON.parse(resultado);
          console.log(data);
          if(data==2){
            $('#button_resgist').prop('disabled',false);
             return Swal.fire("Mensaje De Advertencia", "attendance Para el curso "+nombrecurso+" en la fecha "+fechaAsisten+ " ya esta registrado.", "warning");
          }
          if (data==1) {
            Swal.fire({icon: 'success', title: 'Mensaje de Éxito !!', text:'La attendance se guardo corectamente.', showConfirmButton: false,timer: 1500 });
            $('#button_resgist').prop('disabled',false);
            $("#btn_bucar_data").hide();
            $("#FechaAsistencia").val('');
             $("#DinNuevoAsistencia").hide();

            return;
             }else{
              $('#button_resgist').prop('disabled',false);
            return Swal.fire("Mensaje De error", "No se pudo registrar las asistencias para la fecha"+fechaAsisten, "error"); 
          }
         

        });
}

var editando=false;
function Black_MenuAsis(){
  $("#DinNuevoAsistencia").hide();
 $("#tbody_tabla_detall").html("");
 editando=false;
 resetCheckbox() ;

$("#FechaAsistencia").val('');
  $("#btn_bucar_data").hide();

}

function  All_Editar_Nuevo(e){

  if (e.checked) {
     $("#tbody_tabla_detall").html("");
    $("#btn_bucar_data").show();
    $("#FechaAsistencia").val('');
    editando=true;
} else {
    $("#btn_bucar_data").hide();
    editando=false;
}
}





function resetCheckbox() {
  $(".cheboktem").prop("checked", false);
}
///LISTAR ASISTENCIA///////////


 function All_select(e){
    if(e.checked){
           $("#tbody_tabla_detall .switch_checbok ").each(function(i){
            $("input[class='clas_chebo"+i+"']").prop("checked", true);
           });
    }
    else{
       $("#tbody_tabla_detall .switch_checbok ").each(function(i){
            $("input[class='clas_chebo"+i+"']").prop("checked", false);  
           });
    }   
  }



function Asistencias_Editar(data){
 var html =""; let n=0;
 data.forEach(valor => {
   html +=  "<tr>";  
   html += "<td >"+valor.idalumno+"</td>";
    html += "<td >"+valor.apellidop+','+valor.alumnonombre+"</td>";
   html+="<td><label class='switch_checbok' style='display: block !important;'>";
   valor.Est_Asis==1 ? html+="<input type='checkbox' id='new_comboAsistencia' class='clas_chebo"+n+"' checked >":
   html+="<input type='checkbox' id='new_comboAsistencia' class='clas_chebo"+n+"'>";

   html+="<span class='siderasis round'></span>";
   html+="</label>";
   html+="</td>";
   html += "</tr>";
 })
 $('#tbody_tabla_detall').html(html);
}




