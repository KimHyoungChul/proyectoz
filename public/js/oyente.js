var ws = new WebSocket('wss://' + location.host + '/ws');
var video;
var webRtcPeer;
var sessionFinished = false;
var chatInfo = {};

$(document).ready(function () {
	//kurento stuff
	video = $("#video").get(0);

	$("#btn-finalizar").click(stop);

	//chat events
	chatInfo = {
		sesion: $('#sesion-id').val(),
		nombre: $('#nombre').val(),
		email: $('#email').val()
	};

	//pizarra
	var editor = ace.edit("editor");
	editor.setTheme("ace/theme/dawn");
	editor.setReadOnly(true);


	$('#btn').click(function(){
		chatInfo.mensaje = $('#m').val();
		socket.emit('chat message', JSON.stringify(chatInfo));
		$('#m').val('');

		return false;
	});
	//chat stuff
	var socket = io();
	
	socket.emit('inicializando', JSON.stringify(chatInfo));
	socket.on('chat message', function(msg){
		var recibido = JSON.parse(msg);
		$('#messages').append($('<li>').text(recibido.nombre + ' : ' + recibido.mensaje));
		var element = document.getElementById("mensajes");
		element.scrollTop = element.scrollHeight;
		console.log(msg);
	});

	//pizarra stuff
	socket.on('pizarra_edit', function(msg){
		var recibido = JSON.parse(msg);
		editor.setValue(recibido.mensaje);
		editor.getSession().setMode("ace/mode/"+recibido.modo);
		editor.find("{Bruce Springsteen}");
	});

	socket.on('pizarra_mode', function(msg){
		var recibido = JSON.parse(msg);
		editor.getSession().setMode("ace/mode/"+recibido.mensaje);
	});

    //node app stuff
    question_modal = $("#question_modal_div");
    question_title = $("#question_title");
    question_radio_choices = $("#question_choices_div");

    //node app events
    $("form#form_pregunta").submit(function(e) {
        e.preventDefault();

        var sesion_id = $(this).find("input[name=sesion]").val();
        var respuesta = question_radio_choices.find("input[type=radio]:checked").val();

        if(respuesta) {
            $.post({
                url: '/sesion/responder_evaluacion/',
                data: {
                    sesion: sesion_id,
                    respuesta: respuesta
                },
                success: function (raw_answer) {
                    var respuesta = JSON.parse(raw_answer);

                    if (respuesta.status === 'success') {
                        question_modal.closeModal();
                    }
                    else {
                        alert('Hubo un error al enviar la respuesta: ' + respuesta.mensaje);
                    }
                }
            });
        }
        else {
            alert('Por favor elige una opcion y envia tu respuesta');
        }
    });
});

ws.onopen = function (e) {
	console.log('Conexion viewer abierta.');
	viewer();
};

//kurento stuff
$(window).on('beforeunload', function() {
	ws.close();
});

ws.onmessage = function (message) {
	var parsedMessage = JSON.parse(message.data);

	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
		case 'presenterResponse':
			presenterResponse(parsedMessage);
			break;
		case 'viewerResponse':
			viewerResponse(parsedMessage);
			break;
		case 'stopCommunication':
			dispose();
			break;
		case 'iceCandidate':
			webRtcPeer.addIceCandidate(parsedMessage.candidate);
			break;
		case 'resumeSession':
			console.error('Esta vivo!');
			viewer();
			break;
		case 'halt':
			console.error('Se murio');
			webRtcPeer = null;
			break;
		case 'incomingQuestion':
			mostrarEvaluacion(parsedMessage.data.evaluacion,parsedMessage.data.opciones);
			break;
		case 'sessionFinished':
            sessionFinished = true;
			dispose();
			terminarSesion();
            break;
		default:
			console.error('Unrecognized message', parsedMessage);
	}
};

//node app stuff
function mostrarEvaluacion(raw_evaluacion,raw_opciones) {
    var evaluacion = JSON.parse(raw_evaluacion);
    var opciones = JSON.parse(raw_opciones);
    //cambiar texto de modal
	question_title.text(evaluacion.encabezado);
    //borrar contenido de posible evaluacion anterior
    question_radio_choices.html("");
    //crear radio buttons de opciones
    opciones.forEach(function(op) {
        //crear nuevo id de radio button
        var radio_id = "resp_"+op.id;
        //crear elementos radio button con el formato de materializecss
        var p = $("<p>");
        //crear input para radio button con atributos necesarios
        var input = $("<input>",{
            class: 'with-gap',
            type: 'radio',
            name: 'respuesta',
            value: op.id,
            id: radio_id
        });
        //crear label del radio button
        var label = $("<label>", {
			for: radio_id,
			class: 'black-text'
		}).html(op.texto_opcion);
        //agregar elementos al DOM en su lugar correspondiente
        p.append(input).append(label);
        question_radio_choices.append(p);
    });
    //manejar salida de formulario con ajax
    //abrir modal
    question_modal.openModal({ dismissible: false });
}

function terminarSesion() {
	//TODO beautify todo el proceso de terminar una sesion
	//cambiar imagen del video
	video.src = '';
	video.poster = '/img/webrtc.png';
	video.style.background = '';

	//mostrar mensaje en pizarra
	$("#pizarra").html("<h1>Se termino la sesion de tutoria</h1>");

	//deshabilitar chat
	$("#btn").addClass("disabled").unbind('click');
	$("#m").attr("disabled",true);

	//mostrar boton de salida
	$("#btn_salir").removeClass('hide');
}

//kurento stuff
function viewer() {
	if (!webRtcPeer) {

		var options = {
			remoteVideo: video,
			onicecandidate : onIceCandidate
		};

		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
			if(error) return onError(error);

			this.generateOffer(onOfferViewer);
		});
	}
}

function stop() {
	if (webRtcPeer) {
		var message = {
			id : 'stop',
			isViewer: true,
			emailViewer: chatInfo.email
		};

		sendMessage(message);
		dispose();
	}
}

function onOfferViewer(error, offerSdp) {
	if (error){
		alert(error);
	} 
	var presenter_id = $('#sesion-id').val();
	var message = {
		id : 'viewer',
		sdpOffer : offerSdp,
		presenter_id :  presenter_id,
		nombreViewer: chatInfo.nombre,
		emailViewer: chatInfo.email
	};

	sendMessage(message);
}

function onIceCandidate(candidate) {
	console.log('Local candidate' + JSON.stringify(candidate));

	var message = {
		id : 'onIceCandidate',
		candidate : candidate
	};

	sendMessage(message);
}

function presenterResponse(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';

		console.warn('Call not accepted for the following reason: ' + errorMsg);

		dispose();
	}
	else {
		$('#presenter-id').html('ID de tutoria: ' + message.presenter_id);
		webRtcPeer.processAnswer(message.sdpAnswer);
	}
}

function viewerResponse(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';
		console.warn('Call not accepted for the following reason: ' + errorMsg);
		dispose();
	}
	else {
		webRtcPeer.processAnswer(message.sdpAnswer);
		console.error("empece: " + new Date());
	}
}

function dispose() {
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;
	}
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);

	console.log('Senging message: ' + jsonMessage);

	ws.send(jsonMessage);
}
