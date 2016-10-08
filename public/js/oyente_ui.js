
$(document).ready(function () {

    var mostrandoChat = false;

    var divVideo   = $("#video-div-oyente");
    var divPizarra = $("#pizarra[tipo=pizarra_oyente]");
    var divChat  = $("#div_mensajes_oyente");

    var show_chat = $("#toggle_chat");

    show_chat.click(function(e) {
        if(mostrandoChat) {
            // divLeft.switchClass('hide','col s4',250,'swing');
            divVideo.switchClass('s4','s5',250,'swing');
            divPizarra.switchClass('s4','s6',250,'swing');
            divChat.switchClass('s4 text-center','s1 hide',250,'swing');
            
            show_chat.find("#icon_btn_toggle_chat").html("skip_previous");

            mostrandoChat = false;
        }
        else {
            divVideo.switchClass('s5','s4',250,'swing');
            divPizarra.switchClass('s6','s4',250,'swing');
            divChat.switchClass('s1 hide','s4 text-center',250,'swing');
            divChat.attr('style','');

            show_chat.find("#icon_btn_toggle_chat").html("skip_next");
            

            mostrandoChat = true;
        }
    });
});