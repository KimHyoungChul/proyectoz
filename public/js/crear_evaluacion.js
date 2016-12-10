/**
 * Created by forte on 29/08/16.
 */
$(document).ready(function() {
    var cantidad_respuestas = 2;
    var btn_agregar = $("#btn_agregar_respuesta");
    var div_respuesta = $("#div_respuesta_dummy").clone().removeAttr('id');
    $("#div_respuesta_dummy").remove();
    var respuestas = $("#div_respuestas");
    var respuestas_correctas = $("#select_respuesta");
    var item_respuesta_correcta = $("#respuesta_correcta_dummy").clone().removeAttr('id');
    $("#respuesta_correcta_dummy").remove();
    

    var eliminarRespuesta = function (e) {
        //solo se puede eliminar respuesta si hay mas de 2
        if(cantidad_respuestas > 2) {
            cantidad_respuestas--;
            //borrar pregunta correspondiente
            var resp_div = $(this).parent().parent();
            resp_div.remove();
            //borrar ultima respuesta del radio button
            var last_radio_item = respuestas_correctas.find("option:last");
            //borrar y ya en cualquier otro caso
            last_radio_item.remove();
            //actualizar select de materialize
            $("#select_respuesta").material_select();
            //habilitar boton de agregar
            btn_agregar.attr("disabled",false);
        }
    };

    $("a.btn_eliminar_respuesta").click(eliminarRespuesta);

    btn_agregar.click(function(e) {
        if(cantidad_respuestas < 10) {
            //actualizar cantidad de respuestas
            cantidad_respuestas++;
            //agregar input de respuesta
            respuestas.append(div_respuesta.clone().removeClass('hide'));
            //agregar radio_button de respuesta correcta
            var nueva_resp = item_respuesta_correcta.clone().removeAttr('class');
            nueva_resp.val(cantidad_respuestas);
            nueva_resp.text("Pregunta #"+cantidad_respuestas);
            respuestas_correctas.append(nueva_resp);

            $("a.btn_eliminar_respuesta:last").click(eliminarRespuesta);
            $('#select_respuesta').material_select();

            if(cantidad_respuestas >= 10) {
                btn_agregar.attr("disabled", true);
            }
        }
    });

    $('#select_respuesta').material_select();

    $("form#nueva_evaluacion").submit(function(e) {
        if(!confirm('Si no se selecciona nada, la primera opcion sera la correcta')) {
            e.preventDefault();
        }
        else {
            return true;
        }
    });

    var submitLogin = function () {
            var resps = [];
        var respuestas = $(".respuesta-pregunta");
            respuestas.each(function (resp,value) {
                resps.push($(value).val())
            });

        console.log(resps);
            $.post("/sesion/crear_evaluacion/", {
                sesion_id: $('#sesion_id').val(),
                encabezado: $('#input_encabezado').val(),
                respuestas: resps

            }, function (response) {

                    location.assign("/");

            });


    };
    $('#btn-crear-eval').on('click', submitLogin);
});
