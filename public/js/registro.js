/**
 * Created by manuel on 17/08/16.
 */
$(document).ready(function () {

    $('.datepicker').pickadate({
        selectMonths: true,
        selectYears: 110,
        max: true
    });

    $.validator.setDefaults({
        errorClass: 'invalid',
        errorPlacement: function (error, element) {
            element.next("label").attr("data-error", error.contents().text());
        }
    });

    jQuery.extend(jQuery.validator.messages, {
        required: "Este campo es requerido.",
        email: "Digite un correo válido",
        url: "Please enter a valid URL.",
        equalTo: "Las contraseñas deben de coincidir.",
        minlength: jQuery.validator.format("Debe de ser al menos {0} caracteres.")
    });
    $("#formEstudiante").validate({
        rules: {
            nombre: {
                required: true
            },
            apellido: {
                required: true
            },
            password: {
                required: true,
                minlength: 5
            },
            password_confirmar: {
                required: true,
                minlength: 5,
                equalTo: "#password"
            },
            institucion: {
                required: true
            },
            fecha_nacimiento:"required",
            ccomment: {
                required: true,
                minlength: 15
            }

        }
    });
});


