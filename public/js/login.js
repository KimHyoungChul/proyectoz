/**
 * Created by manuel on 19/08/16.
 */
$(document).ready(function () {
    $('#login-incorrecto').hide();
    $.validator.setDefaults({
        errorClass: 'invalid',
        errorPlacement: function (error, element) {
            element.next("label").attr("data-error", error.contents().text());
        }
    });

    $("#formLogin").validate({
        rules: {
            email: {
                required: true
            },
            password: {
                required: true,
                minlength: 5
            }
        }
    });
    $('#btn-login').on('click', function () {
        console.log('klk');
        if ($('#formLogin').valid()) {
            $.post("/login/", {
                email: $('#email').val(),
                password: $('#password').val()
            }, function (response) {
                if (response.status === -1) {
                    $('#login-incorrecto').show();
                }
                else if (response.status === 0) {
                    location.assign("/");
                }
            });
        }

    });
});
