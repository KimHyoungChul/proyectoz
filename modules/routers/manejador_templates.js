/**
 * Created by forte on 15/08/16.
 */

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;
    var Sequelize = modules.models.Sequelize;
    var kurento = modules.kurento;

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
                    horarioEncontrado.getIntervalos().then(function(intervalosEncontrados) {
                        solicitudEncontrada.getKeywords().then(function(keywordsEncontrados) {
                            res.render('ver_solicitud', {
                                solicitud: solicitudEncontrada,
                                keywords: keywordsEncontrados,
                                intervalos: intervalosEncontrados
                            });
                        });
                    });
                });
            })
        }
    });

    app.get('/solicitud/crear_tutoria/:sol_id/', function(req, res) {
        var solicitud_id = parseInt(req.params.sol_id);

        if(solicitud_id) {
            //obtener solicitud con el id especificado
            models.solicitud.find({
                where: {id: solicitud_id}
            }).then(function (solicitudEncontrada) {
                //buscar horario de solicitud encontrada
                solicitudEncontrada.getHorario().then(function(horarioEncontrado) {
                    //buscar intervalos del horario encontrado
                    //cambiar nombre de atributos para ajustar a especificaciones de fullcalendar
                    horarioEncontrado.getIntervalos({
                        attributes: [['hora_inicio','start'],['hora_fin','end']]
                    }).then(function(intervalosEncontrados) {
                        //buscar keywords de la solicitud encontrada
                        solicitudEncontrada.getKeywords().then(function(keywordsEncontrados) {
                            //enviar datos encontrados para ser mostrados en la vista
                            res.render('crear_tutoria', {
                                solicitud: solicitudEncontrada,
                                keywords: keywordsEncontrados,
                                intervalos: intervalosEncontrados
                            });
                        });
                    });
                });
            })
        }
    });

    app.get('/sesion/:ses_id/lanzar_evaluacion/:ev_id/', function(req, res) {
        var sesion_id = parseInt(req.params.ses_id);
        var ev_id = parseInt(req.params.ev_id);

        //enviar mensaje a cada websocket de oyente conectado a sesion_id
        kurento.data.presenters[sesion_id].viewers.forEach(function(viewer) {
            viewer.ws.send(JSON.stringify({
                id: 'incomingQuestion',
                evaluacion: ev_id,
                mensaje: 'lanzamiento de evaluacion fue exitoso'
            }));
        });

        res.send("ya");
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

    app.get('/sesion/:id/', function(req, res) {
        console.log(req.params.id);
        var opciones = {
            todavia: false,
            sesion: 0,
            presentador: false
        };
        models.sesion_tutoria.findAll({
            where:{
                id: parseInt(req.params.id)
            }
        }).then(function (sesiones) {
            if (sesiones.length > 0) {
                var sesion = sesiones[0];
                var usuario = req.session.usuario;

                if (sesion.fecha <= new Date()){
                    opciones.sesion = sesion.id;
                }
                else {
                    opciones.todavia = true;
                }

                if(usuario.tipo === 'tutor'){
                    opciones.presentador = true;
                    //preparar evaluaciones
                    sesion.getEvaluaciones().then(function(evaluacionesEncontradas) {
                        opciones.evaluaciones = evaluacionesEncontradas;
                        res.render('sesion_presentador',opciones);
                    });
                }
                else{
                    res.render('sesion_oyente',opciones);
                }
            }
            else {
                res.redirect(303,'/');
            }
        });
    });

    app.get('/', function(req, res) {
        console.log(req.session);
        res.render('basic');
    });
};


