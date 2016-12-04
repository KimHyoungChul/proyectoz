
$(document).ready(function() {
    $('select').material_select();

    $('.tooltipped').tooltip({delay: 50});

    $(".form_invitacion").submit(function(e) {
        var $formElement = $(this);

        e.preventDefault();

        var estudiante = $(this).find("input#input_estudiante").val();
        var solicitud = $(this).find("input#input_solicitud").val();
        var respuesta = $(this).find("button[name=accion]").val();

        $('.tooltipped').tooltip('remove');
        
        

        $.post({
            url: $formElement.attr('action'),
            data: {
                estudiante: estudiante,
                solicitud: solicitud,
                respuesta: respuesta
            },
            success: function(raw_data) {
                var data = JSON.parse(raw_data);

                if(data.status === 'ok') {
                    Materialize.toast('Respuesta a invitacion ha sido confirmada', 2500);
                    $formElement.parent().parent().remove();
                }
                else {
                    Materialize.toast('Hubo un error confirmando respuesta...', 2500);
                }

            }
        });
    })
});