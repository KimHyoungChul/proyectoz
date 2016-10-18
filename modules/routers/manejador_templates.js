/**
 * Created by forte on 15/08/16.
 */

const aws = require('aws-sdk');
const S3_BUCKET = 'pzworkspace';
module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;
    var Sequelize = modules.models.Sequelize;
    var async = modules.async;
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
        if(req.session.usuario) {
            console.log(req.params.id);
            var opciones = {
                todavia: false,
                sesion: 0,
                presentador: false
            };
            models.sesion_tutoria.find({
                where: {
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

                    if (usuario.tipo === 'tutor') {
                        opciones.presentador = true;
                        //preparar evaluaciones
                        sesion.getEvaluaciones().then(function (evaluacionesEncontradas) {
                            opciones.evaluaciones = evaluacionesEncontradas;
                            if (sesion.estado === 'futura') {
                                sesion.estado = 'en-proceso';
                                sesion.save().then(function (sesionActualizada) {
                                    res.render('sesion_presentador', opciones);
                                });
                            }
                            else {
                                res.render('sesion_presentador', opciones);
                            }
                        });
                    }
                    else {
                        res.render('sesion_oyente', opciones);
                    }
                }
                else {
                    res.redirect(303, '/');
                }
            });
        }
        else {
            res.redirect(303,'/');
        }
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
                var cant_eval_enviadas = 0;
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

                        cant_eval_enviadas++;
                    }
                });
                //enviar respuesta
                res.send(JSON.stringify({
                    status: 'ok',
                    message:'pretty neat',
                    cantidad_enviadas: cant_eval_enviadas
                }));
            });
        });
    });

    app.get('/sesion/:ses_id/lanzar_evaluacion/:ev_id/viewer/:viewer_id', function(req, res) {
        var sesion_id = parseInt(req.params.ses_id);
        var eval_id   = parseInt(req.params.ev_id);
        var viewer_id = parseInt(req.params.viewer_id);

        //buscar evaluacion
        models.evaluacion.find({
            where: {
                id: eval_id
            }
        }).then(function(evaluacion) {
            evaluacion.getOpciones().then(function(opcionesEvaluacion) {
                var cant_eval_enviadas = 0;
                //enviar mensaje a websocket de oyente seleccionado
                var viewer = kurento.data.presenters[sesion_id].viewers[viewer_id];
                if(viewer && viewer.ws && viewer.ws.readyState === 1) {
                    viewer.ws.send(JSON.stringify({
                        id: 'incomingQuestion',
                        data: {
                            evaluacion: JSON.stringify(evaluacion),
                            opciones: JSON.stringify(opcionesEvaluacion)
                        },
                        mensaje: 'lanzamiento de evaluacion fue exitoso'
                    }));

                    cant_eval_enviadas++;
                }
                //enviar respuesta
                res.send(JSON.stringify({
                    status: 'ok',
                    message: 'eval: ' + eval_id + ", sesion: " + sesion_id + ", viewer: " + viewer_id,
                    cantidad_enviadas: cant_eval_enviadas
                }));
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

    app.get('/tutores/mis-sesiones', function(req, res){
        var usuario = req.session.usuario;
        models.sesion_tutoria.findAll({
            where:{
                tutor: parseInt(usuario.id),
                estado: 'futura'
            }
        }).then(function (sesiones) {
            var listaSesiones =[];
            async.each(sesiones, function (sesion, callback) {
                models.solicitud.findAll({
                    where: {
                        id: sesion.solicitud
                    }
                }).then(function (solicitudes) {
                    var result = {
                        id: sesion.id,
                        titulo: solicitudes[0].titulo
                    };
                    listaSesiones.push(result);
                    callback()
                });
            }, function () {
                res.render('sesiones_tutores',{
                    sesiones: listaSesiones
                });
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

    app.get('/workspace/', function (req, res) {
        var opciones = {
            presentador: false,
            sesion: parseInt(req.query.sesion),
            nombre: req.session.usuario.nombre,
            email: req.session.usuario.email,
            usuario: req.session.usuario.id,
            tipo_usuario: req.session.usuario.tipo
        };

        models.sesion_tutoria.findAll({
            where:{
                id: opciones.sesion
            }
        }).then(function (sesiones) {
            if (sesiones.length > 0) {
                var sesion = sesiones[0];
                if (sesion.estado !== 'futura'){
                    res.redirect(303, '/');
                }
                var usuario = req.session.usuario;
                opciones.presentador = usuario.tipo === 'tutor';
                var listaRecursos =[];
                models.recurso_workspace.findAll({
                    where: {
                        sesion_tutoria: opciones.sesion,
                        tipo: 'archivo'
                    },
                    order: 'url ASC'
                }).then(function (recursos) {
                    opciones.archivos = recursos;
                    models.recurso_workspace.findAll({
                        where: {
                            sesion_tutoria: opciones.sesion,
                            tipo: 'url'
                        }
                    }).then(function (urls) {
                        models.mensaje_workspace.findAll({
                            where:{
                                sesion_tutoria: opciones.sesion
                            },
                            order: 'id ASC'
                        }).then(function (mensajes) {
                            var listaMensajes = [];
                            async.each(mensajes, function (mensaje, callback) {
                                models.usuario.findAll({
                                    where: {
                                        id: mensaje.usuario
                                    }
                                }).then(function (usuarios) {
                                    var result = {
                                        id: mensaje.id,
                                        nombre_usuario: usuarios[0].nombre + ' ' + usuarios[0].apellido,
                                        mensaje: mensaje.texto
                                    };
                                    listaMensajes.push(result);
                                    callback()
                                });
                            }, function () {
                                listaMensajes.sort(function(a,b) {return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0);} );
                                opciones.urls = urls;
                                opciones.mensajes = listaMensajes;

                                res.render('sesion_workspace', opciones);
                            });


                        });

                    });

                });

            }
            else{
                res.redirect(303, '/');
            }
        });
    });

    app.get('/borrar-archivo/:id/:sesion', function (req,res) {
        var id = req.params.id;
        var sesion = req.params.sesion;

        models.recurso_workspace.findAll({
            where: {
                id: id
            }
        }).then(function(recurso){
            models.recurso_workspace.destroy({
                where: {id: id}
            }).then(function(){
                const s3 = new aws.S3();
                const s3Params = {
                    Bucket: S3_BUCKET,
                    Key: sesion + '/' + recurso[0].url.split('/').pop(),

                };
                s3.deleteObject(s3Params, function(err, data) {
                    if (err) console.log(err, err.stack);  // error
                    else     console.log('deleted: ' + JSON.stringify(data) );                 // deleted
                });
                res.redirect(303,'/workspace?sesion=' + sesion);
            });


        });

    });

    app.get('/borrar-url/:id/:sesion', function (req,res) {
        var id = req.params.id;
        var sesion = req.params.sesion;

        models.recurso_workspace.findAll({
            where: {
                id: id
            }
        }).then(function(recurso){
            models.recurso_workspace.destroy({
                where: {id: id}
            }).then(function(){
                res.redirect(303,'/workspace?sesion=' + sesion);
            });


        });

    });

    app.get('/registrar-archivo', function(req, res) {
        const fileName = req.query['file-name'].replace(' ', '+');
        const fileType = req.query['file-type'];
        const sesion = req.query['sesion'];
        const tipo = req.query['tipo'];
        console.log(fileType + tipo);
        models.recurso_workspace.create({
            url: 'https://s3-us-west-2.amazonaws.com/pzworkspace/' + 1 + '/' + fileName,
            tipo: tipo,
            sesion_tutoria: sesion
        });
        res.redirect(303,'workspace?sesion='+ sesion);

    });

    app.get('/sign-s3', function(req, res) {
        s3 = new aws.S3();
        s3.config.update({
            accessKeyId: process.env.AWS_KEY,
            secretAccessKey: process.env.AWS_SECRET
        });
        const fileName = req.query['file-name'];
        const fileType = req.query['file-type'];
        const sesion = req.query['sesion'];
        console.log(sesion);
        const s3Params = {
            Bucket: S3_BUCKET,
            Key: sesion + '/' + fileName,
            Expires: 60000,
            ContentType: fileType,
            ACL: 'public-read'
        };

        s3.getSignedUrl('putObject', s3Params, function(err, data) {
            if(err){
                console.log(err);
                return res.end();
            }
            const returnData = {
                signedRequest: data,
                url: 'https://'+S3_BUCKET+'.s3.amazonaws.com/'+fileName
            };

            res.write(JSON.stringify(returnData));
            console.log(JSON.stringify(returnData));
            res.end();
         });
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


