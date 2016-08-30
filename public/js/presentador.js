var ws = new WebSocket('wss://' + location.host + '/ws');
var video;
var webRtcPeer;

$(document).ready(function () {
	//kurento stuff
	video = $("#video").get(0);

	presenter();
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
			webRtcPeer.addIceCandidate(parsedMessage.candidate);
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
