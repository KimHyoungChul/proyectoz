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
                solicitudEncontrada.getHorario().then(function(horarioEncontrado) {
                    horarioEncontrado.getIntervalos({
                        attributes: [['hora_inicio','start'],['hora_fin','end']]
                    }).then(function(intervalosEncontrados) {
                        solicitudEncontrada.getKeywords().then(function(keywordsEncontrados) {
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

    app.get('/keyword/crear/', function(req, res) {
        res.render('crear_keyword');
    });

    app.get('/estudiantes/crear/', function(req, res) {
        res.render('crear_estudiante');
    });

    app.get('/tutores/crear/', function(req, res){
        res.render('crear_tutor');
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

    app.get('/sesion/:id', function(req, res) {
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
            if (sesiones.length > 0){
                var sesion = sesiones[0];
                var view;
                var usuario = req.session.usuario;
                if(usuario.tipo === 'tutor'){
                    view = 'sesion_presentador';
                    opciones.presentador = true;
                }
                else{
                    view = 'sesion_oyente';
                }
                if (sesion.fecha <= new Date()){
                    opciones.sesion = sesion.id;
                    opciones.nombre = req.session.usuario.nombre;
                    opciones.email = req.session.usuario.email;
                }
                else{
                    opciones.todavia = true;
                }
                res.render(view,opciones);
            }
            else{
                res.render(view,opciones);
            }
        });
    });

    app.get('/', function(req, res) {
        console.log(req.session);
        res.render('basic');
    });

    app.get('/workspace/:id', function (req, res) {
        console.log(req.params.id);
        var opciones = {
            presentador: false
        };
        models.sesion_tutoria.findAll({
            where:{
                id: parseInt(req.params.id)
            }
        }).then(function (sesiones) {
            if (sesiones.length > 0){
                var sesion = sesiones[0];
                if (sesion.estado !== 'futura'){
                    res.redirect(303, '/');
                }
                var usuario = req.session.usuario;
                opciones.presentador = usuario.tipo === 'tutor';

                res.render('sesion_workspace',opciones);
            }
            else{
                res.redirect(303, '/');
            }
        });
    });

    app.get('/sign-s3', function(req, res) {
        aws.config.update({accessKeyId: 'AKIAJS7XTVBBNDSGZXXQ', secretAccessKey: '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'});
        const s3 = new aws.S3();
        const fileName = req.query['file-name'];
        const fileType = req.query['file-type'];
        const s3Params = {
            Bucket: S3_BUCKET,
            Key: fileName,
            Expires: 60,
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
        res.end();
});
});
};


