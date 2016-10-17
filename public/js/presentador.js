var ws = new WebSocket('wss://' + location.host + '/ws');
var video;
var webRtcPeer;
var sessionFinished = false;
var viewerData = {};

/* TODO realizar evento de envio de pregunta individual
*  TODO mover video cuando esta en el medio
*  TODO mostrar feedback de respuestas a pregunta
*
* */


$(document).ready(function () {

	//solo seguir si se cuenta con camara web
	navigator.getMedia=(navigator.getUserMedia ||
						navigator.webkitGetUserMedia ||
						navigator.mozGetUserMedia ||
						navigator.msGetUserMedia);

	navigator.getMedia({
		video: true,
 	}, function(mediaStreamLocal) {
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

		//view events
		//lanzar pregunta en grupo
		$(".btn_lanzar_pregunta_grupo").click(function(e) {
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
		//lanzar pregunta individual
		$(".btn_lanzar_pregunta_individual").click(function(e) {
			e.preventDefault();

			var target_div    = $(this).parent().parent().find(".coleccion_viewers");
			var sesion_id     = $(this).attr("sesion");
			var evaluacion_id = $(this).attr("evaluacion");

			crearListaEstudiantes(target_div,sesion_id,evaluacion_id);
		});
		//abrir pregunta para enviar
		$(".collapsible-header").click(function() {
			$(".coleccion_viewers").html("");
		});

		$("#cerrar_tutoria_btn").click(function(e) {
			if(!confirm("Seguro que desea terminar?")) {
				e.preventDefault();
			}
		});
	}, function(error) {
		$("#body").html('');

		$("#modal_no_webcam").openModal({
			dismissible: false
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
			webRtcPeer.addIceCandidate(parsedMessage.candidate);
			break;
		case 'newViewer':
			agregarViewer(parsedMessage);
			break;
		case 'viewerLeft':
			removerViewer(parsedMessage);
			break;
		case 'sessionFinished':
			sessionFinished = true;
			break;
		default:
			console.error('Unrecognized message', parsedMessage);
	}
};

function removerViewer(viewer) {
	if(viewerData[viewer.email]) {
		delete viewer[viewer.email];
	}

	console.log(viewerData);
}

function agregarViewer(viewer) {
	viewerData[viewer.email] = {};
	viewerData[viewer.email].enabled   = true;
	viewerData[viewer.email].sessionId = viewer.sessionId;
	viewerData[viewer.email].nombre    = viewer.nombre;
	viewerData[viewer.email].email     = viewer.email;

	console.log(viewerData);
}

function crearListaEstudiantes(divTarget,sesion,eval) {
	divTarget.html("");
	Object.keys(viewerData).forEach(function(key,index) {
		var viewer = viewerData[key];

		var url = "/sesion/"+sesion+"/lanzar_evaluacion/"+eval+"/viewer/"+viewer.sessionId;
		var $linkEstudiante = $("<a>", {
			href: url,
			class: "collection-item pregunta_individual"
		}).html(viewer.nombre + ": " + viewer.email);
		divTarget.append($linkEstudiante);
	});
}

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
