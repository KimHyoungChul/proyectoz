/**
 * Created by forte on 17/08/16.
 */

$(document).ready(function() {
    //inicializacion multiselect de keywords
    $("#keyword_select").material_select();
    //esconder calendario por defecto
    $("#calendar_div").css('display','none');
    //habilitar animacion de calendario de disponibilidad
    $("#calendar_btn").click(function(e) {
        e.preventDefault();
        $("#calendar_div").slideToggle('fast', function() {});
        $("#calendar").fullCalendar('render');
    });
    //inicializacion de calendario
    $('#calendar').fullCalendar({
        defaultView: 'agendaWeek',
        selectable: true,
        selectHelper: true,
        select: function(start, end) {
            var title = 'Tutoria';
            var eventData = {
                title: title,
                start: start,
                end: end,
            };
            $('#calendar').fullCalendar('renderEvent', eventData, true); // stick? = true
            $('#calendar').fullCalendar('unselect');
        },
        editable: true,
        events: []
    });
    //actualizar horaro para enviar con formulario
    $("form#nueva_solicitud").submit(function (e) {
        var eventos = [];
        var raw_eventos = $("#calendar").fullCalendar('clientEvents');

        raw_eventos.forEach(function (e) {
            eventos.push({
                start: e.start,
                end: e.end
            });
        });

        $("input#input_horario").val(JSON.stringify(eventos));
    });
});