/**
 * Created by forte on 17/08/16.
 */

$(document).ready(function() {
    //esconder calendario por defecto
    $("#calendar_div").css('display','none');
    // habilitar animacion de calendario de disponibilidad
    $("#calendar_btn").click(function(e) {
        e.preventDefault();
        $("#calendar_div").slideToggle('fast', function() {});
        $("#calendar").fullCalendar('render');
    });
    //inicializacion de calendario fullcalendar
    $('#timepicker').pickatime({
        autoclose: false
    });

    $("#fecha").pickadate({
        selectMonths: true
    });

    var eventos_element = $("#intervalos");
    var eventos = JSON.parse(eventos_element.text());
    eventos_element.remove();
    var calendar = $("#calendar");
    calendar.fullCalendar({
        defaultDate: eventos[0].start,
        lang: 'es',
        defaultView: 'agendaWeek',
        timezone: 'America/Santo_Domingo',
        allDaySlot: false,
        slotLabelFormat: 'h A',
        slotDuration: '01:00:00',
        events: eventos
    });
});