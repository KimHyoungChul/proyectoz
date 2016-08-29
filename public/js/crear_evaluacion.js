/**
 * Created by forte on 29/08/16.
 */
$(document).ready(function() {
    var cantidad_respuestas = 2;
    var btn_agregar = $("#btn_agregar_respuesta");
    var div_respuesta = $("#div_respuesta_dummy").clone().removeAttr('id');
    $("#div_respuesta_dummy").remove();
    var respuestas = $("#div_respuestas");
    var respuestas_correctas = $("#div_respuesta_correcta");
    var item_respuesta_correcta = $("#respuesta_correcta_dummy").clone();
    $("#respuesta_correcta_dummy").remove();

    var eliminarRespuesta = function (event) {
        if(cantidad_respuestas <= 2) {
            //no se puede borrar porque quedaria una sola alternativa
        }
        else {
            //borrar pregunta correspondiente
            //borrar ultima respuesta del radio button
                //si esta seleccionada, seleccionar la primera
                //borrar y ya en cualquier otro caso
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
            var nueva_resp = item_respuesta_correcta.clone().removeClass('hide');
            nueva_resp.find("input").attr("id","resp_"+cantidad_respuestas).val(cantidad_respuestas);
            nueva_resp.find("label").attr("for","resp_"+cantidad_respuestas).text("Pregunta #"+cantidad_respuestas);
            respuestas_correctas.append(nueva_resp);

            $("a.btn_eliminar_respuesta:last").click(eliminarRespuesta);
        }
        else {
            //bloquear boton de agregar (se libera en otro sitio)
        }
    });
});
