/**
 * Created by forte on 15/08/16.
 */
var moment  = require('moment');
module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;
    var async = modules.async;


    app.post('/rest/login/', function(req, res) {
        console.log("rest api recibido:" + req.body.email);
        var response = {};
        res.contentType('json');
        models.usuario.findAll({
            include: [{
                model: models.estudiante,
                as: "Estudiante"
            },{
                model: models.tutor,
                as: "Tutor"
            }],
            where: {
                email: req.body.email
            }
        }).then(function(usuario){
            if(usuario.length > 0 && usuario[0].password === req.body.password){
                var u = usuario[0];
                response.status = 0;
                response.usuario = {
                    nombre: u.nombre + " " +u.apellido,
                    email: u.email

                };

                if(u.Estudiante){
                    response.usuario.id = u.Estudiante.id;
                    response.usuario.tipo_usuario = "estudiante"
                }else{
                    response.usuario.id = u.Tutor.id;
                    response.usuario.tipo_usuario = "tutor"
                }
                res.send(JSON.stringify( response ));
            }
            else {
                response.status = -1;
                res.send(JSON.stringify( response ));
            }
        });


    });

    app.post('/rest/registrar/', function(req, res) {
        var response = {};
        res.contentType('json');
        console.log("Api recibio peticion de registrar");
        console.log(req.body.fecha_nacimiento);
        models.usuario.create({
            email: req.body.email.toLocaleLowerCase(),
            password: req.body.password,
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            genero: req.body.genero,
            fecha_nacimiento: req.body.fecha_nacimiento
        }).then(function(usuario) {
            models.estudiante.create({
                institucion: req.body.institucion
            }).then(function(est) {
                usuario.setEstudiante(est);
                response.status = 0;
                res.send(JSON.stringify( response ));
            });
        });
    });

    app.post("/rest/registrarToken/", function(req,res){
        var response = {};
        res.contentType('json');

        models.usuario.findAll({
            where: {
                email: req.body.email
            }
        }).then(function(usuario){
            usuario[0].firebase_token = req.body.password;
            usuario[0].save().then(function () {
                res.send(JSON.stringify({lol:1}));
                console.log('guardado token');
            });
        })

    });

    app.post('/rest/sesiones/', function(req, res) {
        console.log("rest api recibido:" + req.body.email);
        var response = {};
        res.contentType('json');
        models.usuario.findAll({
            where: {
                email: "u1@u1.u1"
            }
        }).then(function(usuarios){
            var usuario = usuarios[0];

        });


    });

    app.get('/rest/solicitudes/:email', function(req, res) {
        var email = req.params.email;
        console.log('api recibido:' + email);
        res.contentType('json');
        models.solicitud.findAll({
            include: [{
                model: models.estudiante,
                as: 'Estudiante',
                include: [{
                    model: models.usuario,
                    as: 'Usuario',
                    where: {'email': email}
                }]
            },
                {
                    model: models.estudiante,
                    as: 'Estudiantes',
                    include: [{
                        model: models.usuario,
                        as: 'Usuario'

                    }]
                }],
            where:{
                estado: "pendiente"
            }
        }).then(function(solicitudes){
            var response = [];
            async.each(solicitudes, function (solicitud, callback) {

                var solic = {
                    estado: solicitud.estado,
                    titulo: solicitud.titulo,
                    cuerpo: solicitud.cuerpo,
                    fecha: moment(solicitud.fechaRealizacion).format("DD/MM/YYYY") ,
                    integrantes: []
                };
                response.push(solic);
                async.each(solicitud.Estudiantes, function (estudiante) {
                    solic.integrantes.push({
                        nombre: estudiante.Usuario.nombre + " " + estudiante.Usuario.apellido,
                        estado: estudiante.integrante_solicitud.estado
                    });
                });

                callback()
            }, function () {
                res.send(response);
            })

        });


    });

    app.get('/rest/mensajes_sesion/:sesion', function(req, res) {
        var sesion = req.params.sesion;
        var response = [];
        res.contentType('json');
        models.sesion_tutoria.findAll({
            where: {
                id: sesion
            },
            include: [{
                model: models.mensaje_workspace,
                as: 'Mensajes_workspace',
                include: [{
                    model: models.usuario,
                    as: 'Usuario'
                }]
            }]
        }).then(function (solicitud) {
            solicitud[0].Mensajes_workspace.forEach(function (mensaje) {
                response.push({
                    texto: mensaje.texto,
                    usuario: mensaje.Usuario.nombre + " " + mensaje.Usuario.apellido
                });
            });
            res.send(response);
        });
    });

    app.get('/rest/sesiones_estudiante/:email', function(req, res) {

        var email = req.params.email;
        console.log('api recibido:' + email);
        res.contentType('json');
        var sesiones = [];
        models.sesion_tutoria.findAll({
            where: {
                $or:[
                    {
                        estado: 'futura'
                    },{
                        estado: 'en-proceso'
                    }
                ]
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
                        where: {'email': email}
                    }]
                }]

            },{
                model:models.tutor,
                as: 'Tutor',
                include: [{
                    model:models.usuario,
                    as: 'Usuario'
                }]
            }]}).then(function (results) {
            async.each(results, function (sesion, callback) {
                sesiones.push(sesion);
                callback();
            }, function () {
                models.sesion_tutoria.findAll({
                    where: {
                        $or:[
                            {
                                estado: 'futura'
                            },{
                                estado: 'en-proceso'
                            }
                        ]
                    },
                    include:[{
                        model: models.solicitud,
                        as: 'Solicitud',
                        include:[{
                            model: models.estudiante,
                            as: 'Estudiantes',
                            include: [{
                                model: models.usuario,
                                as: 'Usuario',
                                where: {'email': email}
                            }]
                        }]
                    },{
                        model:models.tutor,
                        as: 'Tutor',
                        include: [{
                            model:models.usuario,
                            as: 'Usuario'
                        }]
                    }]
                }).then(function (results) {
                    results.forEach(function (sesion) {
                        sesiones.push(sesion);
                    });

                    var i;
                    var test = {};
                    var response = [];
                    for(i=0; i<sesiones.length;i++){
                        if(test[sesiones[i].id]){
                            continue;
                        }
                        var fecha = moment(console.log(sesiones[i].fecha));
                        var sesion = {
                            fecha: fecha.format("DD/MM/YYYY"),
                            hora_inicio: sesiones[i].hora_inicio.slice(0,5),
                            estado: sesiones[i].estado,
                            tutor: sesiones[i].Tutor.Usuario.nombre + " " + sesiones[i].Tutor.Usuario.apellido,
                            titulo: sesiones[i].Solicitud.titulo,
                            id: sesiones[i].id,
                            en_curso: sesiones[i].estado === "en-proceso"
                        };

                        response.push(sesion);



                    }

                    res.send(JSON.stringify(response));


                });

            });


        });

    });


};

