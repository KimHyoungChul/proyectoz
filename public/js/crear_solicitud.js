/**
 * Created by forte on 17/08/16.
 */

$(document).ready(function() {
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
                title: title,
                start: start,
                end: end
            };
            $('#calendar').fullCalendar('renderEvent', eventData, true);
            $('#calendar').fullCalendar('unselect');
        },
        editable: true,
        eventOverlap: false,
        events: []
    });
    //actualizar horaro para enviar con formulario
    $("form#nueva_solicitud").submit(function (e) {
        //agregar intervalos como campo de formulario
        var intervalos = [];
        var raw_eventos = $("#calendar").fullCalendar('clientEvents');
        raw_eventos.forEach(function (e) {
            intervalos.push({
                start: e.start,
                end: e.end
            });
        });

        $("input#input_horario").val(JSON.stringify(intervalos));

        //agregar integrantes como campo de formulario
        var integrantes = $("#integrantes").material_chip('data');
        //do the job
        $("input#input_integrantes").val(JSON.stringify(integrantes));
    });
});