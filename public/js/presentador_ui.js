/**
 * Created by forte on 07/10/16.
 */



$(document).ready(function () {
    var located_in_bottom = true;

    var divLeft  = $("#div_preguntas");
    var divRight = $("#div_mensajes");
    var showLeft  = $("#show_left");
    var showRight = $("#show_right");

    var esconderLeft = function () {
        //esconder div
        divLeft.switchClass('col s4','hide',250,'swing');
        //mostrar boton
        showLeft.switchClass('hide','left_hidden',250,'swing');
        showLeft.attr("style","");
    };
    var esconderRight = function () {
        //esconder div
        divRight.switchClass('col s4','hide',250,'swing');
        //mostrar boton
        showRight.switchClass('hide','right_hidden',250,'swing');
        showRight.attr("style","");
    };
    var mostrarLeft = function () {
        //mostrar div
        //esconder derecho
        esconderRight();
        //mostrar div izquierdo
        divLeft.switchClass('hide','col s4',250,'swing');
        divLeft.attr("style","");
        //poner offset en pizzara
        $("#pizarra").toggleClass("offset-s1");
        //esconder boton izquierdo
        showLeft.switchClass('left_hidden','hide',250,'swing');
    };
    var mostrarRight = function () {
        //mostrar div
        //esconder izquierdo
        esconderLeft();
        //mostrar div derecho
        divRight.switchClass('hide','col s4',250,'swing');
        divRight.attr("style","");
        //poner offset en pizzara
        $("#pizarra").toggleClass("offset-s1");
        //esconder boton derecho
        showRight.switchClass('right_hidden','hide',250,'swing');
    };

    $("#btn_show_left").click(function() {
        mostrarLeft();
    });
    $("#btn_show_right").click(function() {
        mostrarRight();
    });

    $("#video-div-presentador").hover(function(event) {
        //handler in
        $(this).stop().animate({
            opacity: 0.3
        }, 150);

    },function(event) {
        //handler out
        $(this).stop().animate({
            opacity: 1
        },150);
    });

    $("#presentador_preguntas").hover(function(event) {
        //handler in
        $("#video-div-presentador").stop().animate({
            left: "35%"
        })

    },function(event) {
        //handler out
        $("#video-div-presentador").stop().animate({
            left: "1%"
        })
    });
});