/**
 * Created by forte on 14/08/16.
 */

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

function enviarMensaje(chatInfo){
    var sesion = clientes[chatInfo.sesion];
    sesion.forEach(function (cliente) {
        cliente.socket.emit('chat message', JSON.stringify(chatInfo));
    });
}



module.exports = {
    init: function (app_server) {
        var io = require('socket.io').listen(app_server);

        io.on('connection', function(socket) {
            var sessionId = nextUniqueId();
            var tutoria;
            sesiones[sessionId] = socket;
            
            socket.on('chat message', function(msg) {
                var chatInfo = JSON.parse(msg);
                enviarMensaje(chatInfo);
            });

            socket.on('inicializando', function(msg){
                var chatInfo = JSON.parse(msg);
                tutoria = chatInfo.sesion;
                ingresarCliente(sessionId, chatInfo);
            });

            socket.on('disconnect', function () {
                delete sesiones[sessionId];
                delete clientes[tutoria][sessionId];
            });
        });

        return io;
    }
};