var ws = new WebSocket('wss://' + location.host + '/ws');
var video;
var webRtcPeer;
//chat stuff
var socket = io();

socket.on('chat message', function(msg){
	$('#messages').append($('<li>').text(msg));
});

$(document).ready(function () {
	//kurento stuff
	video = $("#video").get(0);

	presenter();
	$("#btn-finalizar").click(stop);

	//chat events
	$('#btn').click(function(){
		console.log('hey');
		socket.emit('chat message', $('#m').val());
		$('#m').val('');

		return false;
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
