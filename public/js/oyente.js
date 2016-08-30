//kurento stuff
var ws = new WebSocket('wss://' + location.host + '/ws');
var video;
var webRtcPeer;

//node app stuff
var question_modal;
var question_title;
var question_radio_choices;

$(document).ready(function () {
	//kurento stuff
	video = $("#video").get(0);

	$("#btn-finalizar").click(stop);

	//chat events
	$('#btn').click(function(){
		console.log('hey');
		socket.emit('chat message', $('#m').val());
		$('#m').val('');

		return false;
	});

    //node app stuff
    question_modal = $("#question_modal_div");
    question_title = $("#question_title");
    question_radio_choices = $("#question_choices_div");
});

ws.onopen = function (e) {
	console.log('Conexion abierta.');
	viewer();
};

//chat stuff
var socket = io();

socket.on('chat message', function(msg){
	$('#messages').append($('<li>').text(msg));
});

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
			webRtcPeer.addIceCandidate(parsedMessage.candidate)
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
			// alert(parsedMessage.evaluacion + " : " + parsedMessage.mensaje + "\n" + parsedMessage.opciones);
            mostrarEvaluacion(parsedMessage.data.evaluacion,parsedMessage.data.opciones);
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
    //crear radio buttons de opciones
    //abrir modal
    //manejar salida de formulario con ajax
    question_title.text(evaluacion.encabezado);
    question_radio_choices.html(opciones[0].texto_opcion);
    question_modal.openModal();
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
			id : 'stop'
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
		presenter_id :  presenter_id
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
