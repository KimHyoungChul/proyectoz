var ws = new WebSocket('ws://' + location.host + '/ws');
var video;
var webRtcPeer;
var sessionFinished = false;
var viewerData = {};
var last_cant_contestadas;
var last_cantidad_enviadas;

/*
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
		//pizarra
		var editor = ace.edit("editor");
		editor.setTheme("ace/theme/dawn");

		var enviarMensajeChat = function () {
			chatInfo.mensaje = $('#m').val();
			socket.emit('chat message', JSON.stringify(chatInfo));
			$('#m').val('');

			return false;
		};
		
		$('#btn').click(enviarMensajeChat);

		$("#formChatSesionPresentador").submit(function(e) {
			e.preventDefault();

			enviarMensajeChat();
		})



		//chat stuff
		var socket = io();

		console.log($('#nombre').val());
		socket.emit('inicializando', JSON.stringify(chatInfo));
		socket.on('chat message', function (msg) {
			var recibido = JSON.parse(msg);
			$('#messages').append($('<li>').text(recibido.nombre + ' : ' + recibido.mensaje));
			var element = document.getElementById("mensajes");
			element.scrollTop = element.scrollHeight;
			console.log(msg);
		});
		
		//pizarra stuff
		$('#select-lenguajes').on('change',function () {
			var nuevo_modo = this.value;
			editor.getSession().setMode("ace/mode/"+nuevo_modo);

		});

		editor.getSession().on('change', function(e) {
			chatInfo.mensaje = editor.getValue();
			chatInfo.modo = $('#select-lenguajes').val();
			socket.emit('pizarra_edit', JSON.stringify(chatInfo));
		});

		//view events
		//lanzar pregunta en grupo
		$(".btn_lanzar_pregunta_grupo").click(function (e) {
			e.preventDefault();

			var sesion_id = $(this).attr("sesion");
			var evaluacion_id = $(this).attr("evaluacion");
			var url = "/sesion/" + sesion_id + "/lanzar_evaluacion/" + evaluacion_id + "/";

			$.get(url, function (message) {
				var parsedMessage = JSON.parse(message);

				if (parsedMessage.status === 'ok') {
					Materialize.toast('Evaluacion enviada!', 4000);

					last_cant_contestadas = 0;
					last_cantidad_enviadas = parseInt(parsedMessage.cantidad_enviadas);
				}
				else {
					alert("Inconvenientes con enviar pregunta");
				}
			});
		});
		//lanzar pregunta individual
		$(".btn_abrir_grupo").click(function (e) {
			e.preventDefault();

			var target_div = $(this).parent().parent().find(".coleccion_viewers");
			var sesion_id = $(this).attr("sesion");
			var evaluacion_id = $(this).attr("evaluacion");

			crearListaEstudiantes(target_div, sesion_id, evaluacion_id);
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
		case 'evaluacionRespondida':
			Materialize.toast(parsedMessage.usuario + ' ya respondio!', 4000);
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
			class: "collection-item pregunta_individual btn_lanzar_pregunta_individual"
		}).html(viewer.nombre + ": " + viewer.email);
		divTarget.append($linkEstudiante);
	});

	/*
	* Lanzar evaluacion individual
	* se puso aqui porque los links se crean
	* y borran mediante jquery y hay que actualizar event listeners
	*/
	$("a.btn_lanzar_pregunta_individual").click(function(e) {
		e.preventDefault();

		var url = $(this).attr("href");

		if(url) {

			$.get(url, function (message) {
				var parsedMessage = JSON.parse(message);

				if (parsedMessage.status === 'ok') {
					Materialize.toast('Evaluacion enviada!', 4000);

					last_cant_contestadas = 0;
					last_cantidad_enviadas = parseInt(parsedMessage.cantidad_enviadas);
				}
				else {
					alert("Inconvenientes con enviar pregunta");
				}
			});
		}
		else {
			console.error("No se pudo enviar pregunta individual");
		}
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
