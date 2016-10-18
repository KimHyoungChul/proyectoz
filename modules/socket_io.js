/**
 * Created by forte on 14/08/16.
 */
var moment  = require('moment');
var idCounter = 0;
var clientes = [];
var sesiones = [];


function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

function ingresarCliente(sessionId, chatInfo){
    var cliente = clientes[chatInfo.sesion];
    var nuevoCliente = {
        socket: sesiones[sessionId],
        info: chatInfo
    };
    if(cliente){
        clientes[chatInfo.sesion][sessionId] = nuevoCliente;
    }
    else{
        clientes[chatInfo.sesion] = [nuevoCliente];
    }
}

function enviarMensaje(chatInfo, models){
    var sesion = clientes[chatInfo.sesion];

    console.log(chatInfo);

    if(chatInfo.tipo_usuario === 'tutor'){
        models.tutor.findAll({
            where:{
                id:chatInfo.usuario
            }

        }).then(function (tutor) {
            var tut = tutor[0];
            models.mensaje_workspace.create({
                sesion_tutoria: chatInfo.sesion,
                texto: chatInfo.mensaje,
                usuario: tut.usuario,
                hora_fecha: moment()
            });

        });
    }
    else {
        models.estudiante.findAll({
            where:{
                id:chatInfo.usuario
            }

        }).then(function (estudiante) {
            var tut = estudiante[0];
            models.mensaje_workspace.create({
                sesion_tutoria: chatInfo.sesion,
                texto: chatInfo.mensaje,
                usuario: tut.usuario,
                hora_fecha: moment()
            });

        });

    }


    sesion.forEach(function (cliente) {
        cliente.socket.emit('chat message', JSON.stringify(chatInfo));
    });
}

function actualizarPizarra(chatInfo){
    var sesion = clientes[chatInfo.sesion];

    console.log(chatInfo);

    sesion.forEach(function (cliente) {
        cliente.socket.emit('pizarra_edit', JSON.stringify(chatInfo));
    });
}

function modoPizarra(chatInfo){
    var sesion = clientes[chatInfo.sesion];

    console.log(chatInfo);

    sesion.forEach(function (cliente) {
        cliente.socket.emit('pizarra_mode', JSON.stringify(chatInfo));
    });
}



module.exports = {
    init: function (app_server, models) {
        var io = require('socket.io').listen(app_server);

        io.on('connection', function(socket) {
            var sessionId = nextUniqueId();
            var tutoria;
            sesiones[sessionId] = socket;
            
            socket.on('chat message', function(msg) {
                var chatInfo = JSON.parse(msg);
                enviarMensaje(chatInfo,models);
            });

            socket.on('pizarra_edit', function(msg) {
                var chatInfo = JSON.parse(msg);
                actualizarPizarra(chatInfo);
            });

            socket.on('pizarra_mode', function(msg) {
                var chatInfo = JSON.parse(msg);
                modoPizarra(chatInfo);
            });

            socket.on('inicializando', function(msg){
                var chatInfo = JSON.parse(msg);
                tutoria = chatInfo.sesion;
                ingresarCliente(sessionId, chatInfo);
            });

            socket.on('disconnect', function () {
                if(sessionId && tutoria) {
                    delete sesiones[sessionId];
                    delete clientes[tutoria][sessionId];
                }
            });
        });

        return io;
    }
};