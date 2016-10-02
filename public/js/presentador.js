var ws = new WebSocket('wss://' + location.host + '/ws');
var video;
var webRtcPeer;
var sessionFinished = false;

$(document).ready(function () {
	//kurento stuff
	video = $("#video").get(0);

	// presenter();
	$("#btn-finalizar").click(stop);

	//chat events
	var chatInfo = {
		sesion: $('#sesion-id').val(),
		nombre: $('#nombre').val(),
		email: $('#email').val()
	};

	$('#btn').click(function(){
		chatInfo.mensaje = $('#m').val();
		socket.emit('chat message', JSON.stringify(chatInfo));
		$('#m').val('');

		return false;
	});
	//chat stuff
	var socket = io();

	console.log($('#nombre').val());
	socket.emit('inicializando', JSON.stringify(chatInfo));
	socket.on('chat message', function(msg){
		var recibido = JSON.parse(msg);
		$('#messages').append($('<li>').text(recibido.nombre + ' : ' + recibido.mensaje));
		var element = document.getElementById("mensajes");
		element.scrollTop = element.scrollHeight;
		console.log(msg);
	});

	//view events
	$(".btn_lanzar_pregunta").click(function(e) {
		e.preventDefault();

		var sesion_id = $(this).attr("sesion");
		var evaluacion_id = $(this).attr("evaluacion");
        var url = "/sesion/"+sesion_id+"/lanzar_evaluacion/"+evaluacion_id+"/";
        $.get(url,function(message) {
           var parsedMessage = JSON.parse(message);

            if(parsedMessage.status === 'ok') {
                alert("Pregunta Enviada");
            }
            else {
                alert("Inconvenientes con enviar pregunta");
            }
        });
	});

	$("#cerrar_tutoria_btn").click(function(e) {
		if(!confirm("Seguro que desea terminar?")) {
			e.preventDefault();
		}
	});
});

//kurento stuff
$(window).on('beforeunload', function() {
	ws.close();
});

ws.onopen = function(e) {
    console.log('Conexion presenter abierta.');
    presenter();
};

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
        case 'sessionFinished':
            sessionFinished = true;
            break;
		default:
			console.error('Unrecognized message', parsedMessage);
	}
};

function presenter() {
	if (!webRtcPeer) {

		var options = {
			localVideo: video,
			onicecandidate : onIceCandidate
		};

		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
			if(error) return console.log(error);

			this.generateOffer(onOfferPresenter);
		});
	}
}

function stop() {
	if (webRtcPeer) {
		var message = {
			id : 'stop'
		};

		sendMessage(message);
		dispose();
	}
	console.error("termino: " + new Date());
}

function onOfferPresenter(error, offerSdp) {
	if (error) return onError(error);

	var message = {
		id : 'presenter',
		sdpOffer : offerSdp,
		sesion_id: $('#sesion-id').val()
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
		webRtcPeer.processAnswer(message.sdpAnswer);
		console.error("empece: " + new Date());
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
