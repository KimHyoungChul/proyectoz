
$(document).ready(function () {
	$('.modal-trigger').leanModal();

	//chat events
	var chatInfo = {
		sesion: $('#sesion-id').val(),
		nombre: $('#nombre').val(),
		email: $('#email').val(),
		usuario: $('#usuario').val(),
		tipo_usuario: $('#tipo_usuario').val()
	};

	$('#btn').click(function() {
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







	$('#upload-file').click(initUpload);

	function uploadFile(file, signedRequest, url){
		const xhr = new XMLHttpRequest();
		var primero = true;
		xhr.upload.onprogress = function (evt) {
			if (primero) {
				primero = false;

				$('#upload-form').append('  <div class="progress">'+
					'<div id="progressbar" class="determinate" style="width: 0%"></div></div>');

			}
			if (evt.lengthComputable)
			{
				var percentComplete = (evt.loaded / evt.total)*100;
				console.log(percentComplete);
				$('#progressbar').css('width', percentComplete+'%' );
			}
		};
		xhr.open('PUT', signedRequest);
		xhr.onreadystatechange = function(){
			console.log(xhr.readyState);
			if(xhr.readyState === 4){
				if(xhr.status === 200){
					// alert('good');
					html = '<li class="collection-item">'+
						'<div>'+
						'<a href="lolol">SIII</a>'+
						'<a href=""  class="secondary-content"><i class="material-icons">delete</i></a>'+
						'</div>'+
						'</li>';
					$('#coleccion-archivos').append(html);
					$('#modal1').closeModal();
					$('#progressbar').remove();
					location.replace('/workspace?sesion='+chatInfo.sesion);

				}
				else{
					getSignedRequest(file)
				}


			}
		};
		xhr.send(file);

	}



	function getSignedRequest(file){
		console.log('test');
		const xhr = new XMLHttpRequest();
		xhr.open('GET', '/sign-s3?file-name='+file.name+'&file-type='+ file.type + '&sesion=' + chatInfo.sesion);
		xhr.onreadystatechange = function() {
			if(xhr.readyState === 4){
				if(xhr.status === 200){
					const response = JSON.parse(xhr.responseText);
					registerFile(file, response.signedRequest, response.url);
				}
				else{
					console.log(xhr.status);
					alert('Could not get signed URL.');
				}
			}
		};
		xhr.send();
	}



	function initUpload(){
		const files = document.getElementById('file-input').files;
		const file = files[0];
		if(file == null){
			return alert('No file selected.');
		}
		getSignedRequest(file);
	}
	function registerFile (file, signedRequest) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', '/registrar-archivo?file-name='+file.name+'&file-type='+ file.type + '&sesion=' + chatInfo.sesion + '&tipo=archivo' );
		xhr.onreadystatechange = function(){
			if(xhr.readyState === 4){
				if(xhr.status === 200){
					uploadFile(file, signedRequest);
				}


			}
		};
		xhr.send();
	}

	$.validator.setDefaults({
		errorClass: 'invalid',
		errorPlacement: function (error, element) {
			element.next("label").attr("data-error", error.contents().text());
		}
	});

	jQuery.extend(jQuery.validator.messages, {
		required: "Este campo es requerido.",
		url: "Esta URL no es valida"

	});

	$("#formURL").validate({
		rules: {
			recurso: {
				required: true,
				url: true
			}

		}
	});




});




