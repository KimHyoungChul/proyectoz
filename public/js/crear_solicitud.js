/**
 * Created by forte on 17/08/16.
 */

$(document).ready(function() {
    var eventIdCounter = 0;
    //inicializacion elementos materialize
    $("#keyword_select").material_select();
    $("#input_horario, #input_cuerpo").characterCounter();
    $("#integrantes").material_chip({
        secondaryPlaceholder: '+ Integrante'
    });
    //esconder calendario por defecto
    $("#calendar_div").css('display','none');
    //habilitar animacion de calendario de disponibilidad
    $("#calendar_btn").click(function(e) {
        e.preventDefault();
        $("#calendar_div").slideToggle('fast', function() {});
        $("#calendar").fullCalendar('render');
    });
    //inicializacion de calendario fullcalendar
    $('#calendar').fullCalendar({
        lang: 'es',
        defaultView: 'agendaWeek',
        selectable: true,
        timezone: 'America/Santo_Domingo',
        selectHelper: true,
        allDaySlot: false,
        slotLabelFormat: 'h A',
        slotDuration: '01:00:00',
        select: function(start, end) {
            var title = 'Tutoria';
            var eventData = {
                id: ++eventIdCounter,
                title: title,
                start: start,
                end: end
            };
            $('#calendar').fullCalendar('renderEvent', eventData, true);
            $('#calendar').fullCalendar('unselect');
        },
        eventClick: function(calEvent, jsEvent, view) {
            var resp = confirm("Borrar " + calEvent.title + " a esta hora?");
            if (resp === true) {
                $('#calendar').fullCalendar('removeEvents', calEvent._id);
            }
        },
        editable: true,
        height: 'auto',
        eventOverlap: false,
        events: []
    });
    //actualizar horaro para enviar con formulario
    $("form#nueva_solicitud").submit(function (e) {
        //agregar intervalos como campo de formulario
        var intervalos = [];
        var raw_eventos = $("#calendar").fullCalendar('clientEvents');
        if(raw_eventos.length <=0 ) {
            alert('Tienes que asignar por lo menos algun tiempo disponible');
            e.preventDefault();
            return;
        }
        else {
            raw_eventos.forEach(function (e) {
                intervalos.push({
                    start: e.start,
                    end: e.end
                });
            });
        }

        $("input#input_horario").val(JSON.stringify(intervalos));

        //agregar integrantes como campo de formulario
        var integrantes = $("#integrantes").material_chip('data');
        //do the job
        $("input#input_integrantes").val(JSON.stringify(integrantes));

        var keyword_div = $("#keyword_div");
        if(keyword_div.find("ul li[class=active]").length <= 0) {
            e.preventDefault();
            alert('Por favor selecciona al menos un keyword');
        }
    });
});