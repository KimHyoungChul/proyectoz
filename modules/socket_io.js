/**
 * Created by forte on 14/08/16.
 */
var moment  = require('moment');
var idCounter = 0;
var clientes = [];
var sesiones = [];
var serverKey = process.env.FIREBASE_TOKEN;
var gcm = require('node-gcm');


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
            },
            include: [{
                model: models.usuario,
                as: "Usuario"
            }]

        }).then(function (tutor) {
            var tut = tutor[0];
            models.mensaje_workspace.create({
                sesion_tutoria: chatInfo.sesion,
                texto: chatInfo.mensaje,
                usuario: tut.usuario,
                hora_fecha: moment()
            });
            var cuerpo = tut.Usuario.nombre + " " + tut.Usuario.apellido + ": " + chatInfo.mensaje;
            usuariosSesion(chatInfo.sesion,models,cuerpo);

        });
    }
    else {
        models.estudiante.findAll({
            where:{
                id:chatInfo.usuario
            },
            include: [{
                model: models.usuario,
                as: "Usuario"
            }]

        }).then(function (estudiante) {
            var tut = estudiante[0];
            models.mensaje_workspace.create({
                sesion_tutoria: chatInfo.sesion,
                texto: chatInfo.mensaje,
                usuario: tut.usuario,
                hora_fecha: moment()
            });
            var cuerpo = tut.Usuario.nombre + " " + tut.Usuario.apellido + ": " + chatInfo.mensaje;
            usuariosSesion(chatInfo.sesion,models,cuerpo);

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

function enviarNotificacion(usuarios,encabezado,mensaje) {
    var registrationTokens = [];
    usuarios.forEach(function (usuario) {
        if(usuario.firebase_token){
            registrationTokens.push(usuario.firebase_token);

        }
    });

    var message = new gcm.Message({
        collapseKey: 'demo',
        priority: 'high',


        notification: {
            title: encabezado,
            icon: "education",
            body: mensaje
        }
    });

    var sender = new gcm.Sender(serverKey);


    sender.sendNoRetry(message, { registrationTokens: registrationTokens }, function(err, response) {
        if(err) console.error(err);
        else    console.log(response);
    });

}

function usuariosSesion(session,models,cuerpo){
    var usuarios = [];
    models.sesion_tutoria.find({
        where: {
            id: session
        },
        include: [{
            model: models.solicitud,
            as: 'Solicitud',

            include: [{
                model: models.estudiante,
                as: 'Estudiantes',
                through: { where: {estado: "aceptada"}},
                attributes: ['id'],
                include: [{
                    model: models.usuario,
                    as: 'Usuario',
                    where: {
                        firebase_token: {
                            $ne: null
                        }
                    }
                }]

            }
            ]

        }]

    }).then(function (sesion) {
        if(sesion){
            for(var i=0; i<sesion.Solicitud.Estudiantes.length; i++){
                usuarios.push(sesion.Solicitud.Estudiantes[i].Usuario);
            }

        }
        models.sesion_tutoria.find({
            where: {
                id: session
            },
            include: [{
                model: models.solicitud,
                as: 'Solicitud',

                include: [{
                    model: models.estudiante,
                    as: 'Estudiante',
                    include: [{
                        model: models.usuario,
                        as: 'Usuario',
                        where: {
                            firebase_token: {
                                $ne: null
                            }
                        }
                    }]

                }
                ]

            }]

        }).then(function (sesiones) {
            usuarios.push(sesiones.Solicitud.Estudiante.Usuario);
            var titulo = sesiones.Solicitud.titulo;
            enviarNotificacion(usuarios,titulo,cuerpo);



        });



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