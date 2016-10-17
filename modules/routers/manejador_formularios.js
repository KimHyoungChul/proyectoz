/**
 * Created by forte on 15/08/16.
 */
var moment  = require('moment');

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;
    var kurento = modules.kurento;
    var kurento = modules.kurento;
    var Sequelize = modules.models.Sequelize;

    app.post('/solicitud/crear/', function(req, res) {
        if(req.session.usuario && req.session.usuario.tipo === 'estudiante') {
            var estudiante_id = req.session.usuario.id;
            //crear horario
            models.horario.create({
                fecha_creacion: new Date()
            }).then(function (nuevoHorario) {
                //arreglo de intervalos transformados
                var intervalos = [];
                //transformar horas a formato indicado para persistir
                JSON.parse(req.body.horario).forEach(function(intervalo) {
                    intervalos.push({
                        hora_inicio: intervalo.start,
                        hora_fin:    intervalo.end,
                        horario:     nuevoHorario.get('id')
                    });
                });
                //guardar intervalos
                models.intervalo.bulkCreate(intervalos).then(function() {
                    //crear solicitud
                    models.solicitud.create({
                        titulo: req.body.titulo,
                        cuerpo: req.body.cuerpo,
                        fechaRealizacion: new Date(),
                        estudiante: estudiante_id,
                        horario: nuevoHorario.get('id')
                    }).then(function(nuevaSolicitud) {
                        //obtener keywords
                        var keyword_ids;
                        var raw_keywords = req.body.keywords;
                        //verificar si llego mas de un keyword
                        if(raw_keywords instanceof Array) {
                            keyword_ids = raw_keywords.map(function (keyword) {
                                return parseInt(keyword)
                            });
                        }
                        else {
                            var int_keyword = parseInt(raw_keywords);
                            keyword_ids = [int_keyword];
                        }
                        models.keyword.findAll({
                            where: {
                                id: {
                                    $in: keyword_ids
                                }
                            }
                        }).then(function(keywords) {
                            keywords.forEach(function(keyword) {
                                nuevaSolicitud.addKeyword(keyword);
                            });

                            //obtener correos
                            var correos = [];
                            JSON.parse(req.body.integrantes).forEach(function(integ) {
                                if(integ.tag !== req.session.usuario.email) {
                                    correos.push(integ.tag);
                                }
                            });
                            //obtener id de cada correo valido
                            //TODO excluir el usuario logueado
                            models.usuario.findAll({
                                attributes: ['id'],
                                where: {
                                    email: {
                                        $in: correos
                                    }
                                }
                            }).then(function(usuarioses) {
                                //obtener arreglo de id de usuarios
                                var ids = [];
                                usuarioses.forEach(function(user) {
                                    ids.push(user.get('id'));
                                });
                                //obtener estudiantes de los usuarios de los correos del paso anterior
                                models.estudiante.findAll({
                                    attributes: ['id'],
                                    where: {
                                        usuario: {
                                            $in: ids
                                        }
                                    }
                                }).then(function (estudianteses) {
                                    //crear arreglo de instancias a guardar
                                    var integrantes_solicitud = [];
                                    estudianteses.forEach(function(estud) {
                                        integrantes_solicitud.push({
                                            estudiante: estud.get('id'),
                                            solicitud: nuevaSolicitud.get('id')
                                        }) ;
                                    });
                                    //guardar estudiantes como integrante de la solicitud de tutoria
                                    models.integrante_solicitud.bulkCreate(integrantes_solicitud).then(function() {
                                        res.redirect(303,'/');
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
        else {
            res.redirect(303,'/');
        }
    });
    app.post('/solicitud/crear_tutoria/', function(req, res) {
        models.solicitud.find({
            where: {id: req.body.solicitud_id}
        }).then(function(solicitudEncontrada) {
            solicitudEncontrada.estado = 'aceptada';
            solicitudEncontrada.save().then(function(solicitudActualizada) {
                models.sesion_tutoria.create({
                    fecha: req.body.fecha,
                    hora_inicio: req.body.hora,
                    solicitud: solicitudActualizada.id,
                    tutor: req.session.usuario.id
                }).then(function(sesion_creada) {
                    res.redirect(303,'/');
                });
            });
        });
    });

    app.post('/keyword/crear/', function(req, res) {
        //Capitalizar texto de keyword
        var texto_keyword = req.body.texto.toLowerCase();
        //crear keyword si no se ha creado
        models.keyword.findOrCreate({
            where: {texto: texto_keyword},
            defaults: {texto: texto_keyword}
        }).spread(function(keyword, created) {
            res.redirect(303,'/keyword/crear/');
        });
    });

    app.post('/sesion/crear_evaluacion/', function(req, res) {
        var sesion_id = parseInt(req.body.sesion_id);
        var respuestas = req.body.respuestas;
        //que hayan al menos dos respuestas indica que muy posiblemente
        //request provino desde el form, como deberia de ser
        if(respuestas.length >= 2) {
            //crear evaluacion
            models.evaluacion.create({
                encabezado: req.body.encabezado,
                sesion_tutoria: sesion_id
            }).then(function(newEvaluacion) {
                //crear la opcion que es la correcta
                //verificar si se selecciono respuesta correcta en form
                //obtener indice de la respuesta correcta en arreglo desde el form
                var i;
                if(req.body.respuesta_evaluacion) {
                    i = parseInt(req.body.respuesta_correcta) - 1;
                }
                else {
                    i = 0;
                }
                var texto_opcion_correcta = respuestas[i];
                respuestas.splice(i,1);
                models.opcion_evaluacion.create({
                    texto_opcion: texto_opcion_correcta,
                    evaluacion: newEvaluacion.id
                }).then(function(opcionCreada) {
                    //asignar opcion correcta a evaluacion
                    newEvaluacion.set('respuesta_correcta',opcionCreada.id).save().then(function(evaluacion) {
                        //transformar arreglo de evaluaciones a nuevo arreglo
                        var opciones = respuestas.map(function(item) {
                            return {
                                texto_opcion: item,
                                evaluacion: evaluacion.id
                            };
                        });
                        //crear opciones restantes
                        models.opcion_evaluacion.bulkCreate(opciones).then(function() {
                            //devolver respuesta
                            res.redirect(303,'/');
                        })
                    });
                });
            });
        }
        else {
            res.redirect(303,'/');
        }
    });

    app.post('/sesion/responder_evaluacion/', function(req, res) {
        //convertir de formato json a entero usable en creacion de nuevo objeto
        var respuesta_elegida = parseInt(req.body.respuesta);
        //solo proseguir si es un usuario estudiante quien hizo el HTTP POST
        if("usuario" in req.session && req.session.usuario.tipo === 'estudiante') {
            //seguir si la respuesta es un id legitimo
            if (!isNaN(respuesta_elegida)) {
                //obtener identificador de usuario en sesion
                var id_estudiante = req.session.usuario.id;
                //crear nueva respuesta a evaluacion
                models.respuesta_evaluacion.create({
                    estudiante: id_estudiante,
                    respuesta: respuesta_elegida
                }).then(function (respuestaCreada) {
                    //notificar a presenter que alquien ya le respondio
                    var sesion = req.body.sesion;
                    if(kurento.data.presenters[sesion] && kurento.data.presenters[sesion].ws) {
                        kurento.data.presenters[sesion].ws.send(JSON.stringify({
                            id: 'evaluacionRespondida',
                            usuario: req.session.usuario.email
                        }));
                    }

                    //enviar respuesta de submission
                    res.send(JSON.stringify({status: 'success', mensaje: 'todo nitido'}));
                });
            }
            else {
                //enviar respuesta de submission
                res.send(JSON.stringify({status: 'fail', mensaje: 'identificador de opcion de pregunta no valida'}));
            }
        }
        else {
            //enviar respuesta de submission
            res.send(JSON.stringify({status: 'fail', mensaje: 'no se ha iniciado sesion'}));
        }
    });

    app.post('/estudiantes/crear/', function(req, res) {
        console.log(req.body.password);
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
                res.redirect(303,'/keyword/crear/');
            });
        });
    });

    app.post('/tutores/agregar_keyword/', function(req, res) {
        var tutorId  = parseInt(req.body.tutor);

        var raw_keywords = req.body.keywords;
        models.tutor.find({
            where: { id: tutorId }
        }).then(function(tutorEncontrado) {
            if(raw_keywords instanceof Array) {
                var keywords = raw_keywords.map(function(keyword) { return parseInt(keyword) });
                keywords.forEach(function (keyword) {
                   tutorEncontrado.addKeyword(keyword);
                });
            }
            else {
                var int_keyword = parseInt(raw_keywords);
                tutorEncontrado.addKeyword(int_keyword);
            }

            res.redirect(303,'/');
        });

    });

    app.post('/tutores/crear/', function(req, res) {
        console.log(req.body.password);
        models.usuario.create({
            email: req.body.email.toLocaleLowerCase(),
            password: req.body.password,
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            genero: req.body.genero,
            fecha_nacimiento: req.body.fecha_nacimiento
        }).then(function(usuario) {
            models.tutor.create({
                ocupacion: req.body.ocupacion,
                autorizado: false
            }).then(function(tut) {
                usuario.setTutor(tut);
                res.redirect(303,'/keyword/crear/');
            });
        });

    });

    app.post('/login/', function(req, res) {
        console.log('sdfs');
        var response = {};
        res.contentType('json');
        models.usuario.findAll({
            where: {
                email: req.body.email
            }
        }).then(function(usuario){
            if(usuario.length > 0 && usuario[0].password === req.body.password){
                response.status = 0;
                var user = {
                  id: usuario[0].id,
                  nombre: usuario[0].nombre + ' ' + usuario[0].apellido,
                  email: usuario[0].email
                };
                models.tutor.findAll({
                    where: {
                        usuario: usuario[0].id
                    }
                }).then(function (tutor) {
                    if(tutor.length > 0){
                        console.log(tutor);
                        user.autorizado = tutor[0].autorizado;
                        user.tipo = 'tutor';
                        user.id = tutor[0].id;
                        req.session.usuario = user;
                        response.status = 0;
                        res.send(JSON.stringify(response));
                    }
                });
                models.estudiante.findAll({
                    where: {
                        usuario: usuario[0].id
                    }
                }).then(function (estudiante) {
                    if(estudiante.length > 0){
                        user.autorizado = false;
                        user.tipo = 'estudiante';
                        user.id = estudiante[0].id;
                        req.session.usuario = user;
                        response.status = 0;
                        res.send(JSON.stringify(response));
                    }
                });
            }
            else {
                response.status = -1;
                res.send(JSON.stringify( response ));
            }
        });


    });



    app.post('/registrar-url', function(req, res) {
        const recurso = req.body.recurso;
        const sesion = req.body.sesion;
        models.recurso_workspace.create({
            url: recurso,
            tipo: 'url',
            sesion_tutoria: sesion
        });
        res.redirect(303,'/workspace?sesion=' + sesion);
    });




};