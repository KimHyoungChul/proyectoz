/**
 * Created by forte on 15/08/16.
 */

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;
    var Sequelize = modules.models.Sequelize;
    var kurento = modules.kurento;
    var moment = require('moment');
    //setear locale en spanish
    moment.locale('es-do');

    app.get('/solicitud/crear/', function(req, res) {
        models.keyword.findAll().then(function (_keywords) {
            res.render('crear_solicitud', {
                keywords: _keywords
            });
        });
    });

    app.get('/solicitud/ver/:sol_id/', function(req, res) {
        var solicitud_id = parseInt(req.params.sol_id);

        if(solicitud_id) {
            //obtener solicitud con el id especificado
            models.solicitud.find({
                where: {id: solicitud_id}
            }).then(function (solicitudEncontrada) {
                solicitudEncontrada.getHorario().then(function(horarioEncontrado) {
                    horarioEncontrado.getIntervalos({
                        attributes: [['hora_inicio','start'],['hora_fin','end']]
                    }).then(function(intervalosEncontrados) {
                        solicitudEncontrada.getKeywords().then(function(keywordsEncontrados) {
                            var data = {
                                solicitud: solicitudEncontrada,
                                keywords: keywordsEncontrados,
                                intervalos: intervalosEncontrados
                            };

                            if(req.session.usuario) {
                                data.tipoUsuario = req.session.usuario.tipo;
                            }
                            else {
                                data.tipoUsuario = null;
                            }

                            res.render('ver_solicitud',data);
                        });
                    });
                });
            })
        }
        else {
            res.redirect(303,'/');
        }
    });

    app.get('/sesion/:id/', function(req, res) {
        console.log(req.params.id);
        var opciones = {
            todavia: false,
            sesion: 0,
            presentador: false
        };
        models.sesion_tutoria.find({
            where:{
                id: parseInt(req.params.id)
            }
        }).then(function (sesion) {
            if (sesion && (sesion.estado === 'futura' || sesion.estado === 'en-proceso')) {

                var usuario = req.session.usuario;

                if (sesion.fecha <= new Date()) {
                    opciones.sesion = sesion.id;
                    opciones.nombre = req.session.usuario.nombre;
                    opciones.email = req.session.usuario.email;
                }
                else {
                    opciones.todavia = true;
                }

                if(usuario.tipo === 'tutor') {
                    opciones.presentador = true;
                    //preparar evaluaciones
                    sesion.getEvaluaciones().then(function(evaluacionesEncontradas) {
                        opciones.evaluaciones = evaluacionesEncontradas;
                        if(sesion.estado === 'futura') {
                            sesion.estado = 'en-proceso';
                            sesion.save().then(function(sesionActualizada) {
                                res.render('sesion_presentador',opciones);
                            });
                        }
                        else {
                            res.render('sesion_presentador',opciones);
                        }
                    });
                }
                else {
                    res.render('sesion_oyente',opciones);
                }
            }
            else {
                res.redirect(303,'/');
            }
        });
    });

    app.get('/sesion/cerrar/:ses_id/',function(req,res) {
        //verificar existencia y estado de sesion
        var sesion_id = parseInt(req.params.ses_id);
        //solo seguir si se ha iniciado sesion y el usuario es un tutor
        if(req.session.usuario && req.session.usuario.tipo === 'tutor') {
            //obtener usuario de la sesion
            var usuario = req.session.usuario;

            //buscar sesion
            models.sesion_tutoria.find({
                where: {
                    id: sesion_id
                }
            }).then(function(sesion) {
                //verificar que quien entro es el tutor de la sesion
                //cambiar estado de sesion si no se ha terminado ya
                if(sesion.tutor === usuario.id && ['futura','en-proceso'].includes(sesion.estado)) {
                    //TODO descomentar cambio de estado en una sesion te de tutoria
                    // sesion.estado = 'realizada';
                    sesion.save().then(function(sesionActualizada) {
                        //enviar mensaje a cada viewer para que se vayan
                        kurento.data.presenters[sesion_id].viewers.forEach(function (viewer) {
                            if(viewer.ws.readyState === 1) {
                                viewer.ws.send(JSON.stringify({
                                    id: 'sessionFinished',
                                    data: {
                                        mensaje_2: 'se termino la sesion ya'
                                    },
                                    mensaje: 'Se termino la sesion de tutoria'
                                }));
                            }
                        });
                        res.redirect(303,'/');
                    });
                }
                else {
                    res.redirect(303,'/');
                }
            });
        }
        else {
            res.redirect(303,'/');
        }
    });

    app.get('/sesion/:ses_id/lanzar_evaluacion/:ev_id/', function(req, res) {
        var sesion_id = parseInt(req.params.ses_id);
        var ev_id = parseInt(req.params.ev_id);
        //buscar evaluacion
        models.evaluacion.find({
            where: {
                id: ev_id
            }
        }).then(function(evaluacion) {
            //buscar opciones evaluacion
            evaluacion.getOpciones().then(function(opcionesEvaluacion) {
                //enviar mensaje a cada websocket de oyente conectado a sesion_id
                kurento.data.presenters[sesion_id].viewers.forEach(function (viewer) {
                    if(viewer.ws.readyState === 1) {
                        viewer.ws.send(JSON.stringify({
                            id: 'incomingQuestion',
                            data: {
                                evaluacion: JSON.stringify(evaluacion),
                                opciones: JSON.stringify(opcionesEvaluacion)
                            },
                            mensaje: 'lanzamiento de evaluacion fue exitoso'
                        }));
                    }
                });
                //enviar respuesta
                res.send(JSON.stringify({status: 'ok',message:'pretty neat'}));
            });
        });
    });

    app.get('/sesion/ver_evaluaciones/:ses_id/', function(req, res) {
        var sesion_id = parseInt(req.params.ses_id);

        if(!isNaN(sesion_id)) {
            //obtener sesion con el id especificado
            models.sesion_tutoria.find({
                where: {id: sesion_id}
            }).then(function (sesionEncontrada) {
                sesionEncontrada.getEvaluaciones().then(function (evaluacionesEncontradas) {
                    res.render('ver_evaluaciones', {
                        sesion: sesionEncontrada,
                        evaluaciones: evaluacionesEncontradas
                    });
                });
            });
        }
        else {
            res.redirect(303,'/');
        }
    });

    app.get('/sesion/crear_evaluacion/:ses_id/', function(req, res) {
        var sesion_id = parseInt(req.params.ses_id);

        if(!isNaN(sesion_id)) {
            //obtener sesion con el id especificado
            models.sesion_tutoria.find({
                where: {id: sesion_id}
            }).then(function (sesionEncontrada) {
                res.render('crear_evaluacion', {
                    sesion: sesionEncontrada
                });
            });
        }
        else {
            res.redirect(303,'/');
        }
    });

    app.get('/sesion/', function(req, res) {
        //buscar sesiones junto con sus asociaciones
        models.sesion_tutoria.findAll({
            where: {
                estado: {
                    $in: ['futura','en-proceso']
                }
            },
            include: [{
                model: models.solicitud,
                as: 'Solicitud',
                include: [{
                    model: models.keyword,
                    as: 'Keywords'
                }]
            },{
                model: models.tutor,
                as: 'Tutor',
                include: [{
                    model: models.usuario,
                    as: 'Usuario'
                }]
            }]
        }).then(function(sesionesEncontradas) {

            res.render('ver_sesiones',{
                sesiones: sesionesEncontradas,
                moment: moment
            });
        });
    });

    app.get('/sesion/tag/:tag_id', function(req, res) {
        var tag_id = parseInt(req.params.tag_id);

        models.sesion_tutoria.findAll({
            include: [{
                model: models.solicitud,
                as: 'Solicitud',
                include: [{
                    model: models.keyword,
                    as: 'Keywords',
                    where: {
                        id: tag_id
                    }
                }]
            },{
                model: models.tutor,
                as: 'Tutor',
                include: [{
                    model: models.usuario,
                    as: 'Usuario'
                }]
            }]
        }).then(function(sesionesEncontradas) {
            res.render('ver_sesiones',{
                sesiones: sesionesEncontradas,
                moment: moment
            });
        });
    });

    app.get('/keyword/crear/', function(req, res) {
        res.render('crear_keyword');
    });

    app.get('/estudiantes/crear/', function(req, res) {
        res.render('crear_estudiante');
    });

    app.get('/tutores/crear/', function(req, res){
        res.render('crear_tutor');
    });

    app.get('/tutores/ver_solicitudes/', function(req, res){
        var usuarioSesion = req.session.usuario;

        if(usuarioSesion) {
            //buscar tutor de sesion actual
            models.tutor.find({
                where: {
                    id: usuarioSesion.id
                }
            }).then(function(tutorEncontrado) {
                //buscar keywords que sabe el tutor
                tutorEncontrado.getKeywords({attributes: ['id']}).then(function(keywords) {
                    //obtener solo ids de los keywords encontrados
                    keywords = keywords.map(function(keyword) { return keyword.id });
                    //buscar solicitudes
                    models.keyword_solicitud.findAll({
                        where: {
                            keyword: {
                                $in: keywords
                            }
                        }
                    }).then(function(raw_solicitudes) {
                        //transformar objeto de cross-table a arreglo de solicitudes
                        //luego eliminando duplicados del arreglo
                        solicitudes_ids = raw_solicitudes.map(function(sol){
                            return sol.solicitud;
                        }).filter(function(elem, index, array) {
                                return array.indexOf(elem) === index;
                            }
                        );

                        //buscar datos de las solicitudes encontradas
                        models.solicitud.findAll({
                            where: {
                                id: {
                                    $in: solicitudes_ids
                                }
                            }
                        }).then(function(_solicitudes) {
                            res.render('ver_solicitudes',{
                                solicitudes: _solicitudes
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

    app.get('/tutores/agregar_keyword/', function(req, res) {
        models.tutor.findAll().then(function(_tutores) {
            models.keyword.findAll().then(function (_keywords) {
                res.render('agregar_keyword_tutor', {
                    tutores: _tutores,
                    keywords: _keywords
                });
            });
        });
    });

    app.get('/login/', function(req, res) {
        res.render('login');
    });

    app.get('/', function(req, res) {
        console.log(req.session);
        res.render('basic');
    });
};


