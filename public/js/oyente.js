var ws = new WebSocket('wss://' + location.host + '/ws');
var video;
var webRtcPeer;

$(document).ready(function () {
	//kurento stuff
	video = $("#video").get(0);

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
	
	socket.emit('inicializando', JSON.stringify(chatInfo));
	socket.on('chat message', function(msg){
		var recibido = JSON.parse(msg);
		$('#messages').append($('<li>').text(recibido.nombre + ' : ' + recibido.mensaje));
		var element = document.getElementById("mensajes");
		element.scrollTop = element.scrollHeight;
		console.log(msg);
	});
});

ws.onopen = function (e) {
	console.log('Conexion abierta.');
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
		default:
			console.error('Unrecognized message', parsedMessage);
	}
};



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