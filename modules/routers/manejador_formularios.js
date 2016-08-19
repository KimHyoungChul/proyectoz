/**
 * Created by forte on 15/08/16.
 */
var moment  = require('moment');
moment.locale('es');

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;
    var Sequelize = modules.models.Sequelize;

    app.post('/solicitud/crear/', function(req, res) {
        //crear horario
        models.horario.create({
            fecha_creacion: new Date()
        }).then(function (nuevoHorario) {
            //arreglo de intervalos transformados
            var intervalos = [];
            //transformar horas a formato indicado para persistir
            JSON.parse(req.body.horario).forEach(function(intervalo) {
                var inicio    = moment(intervalo.start);

                intervalos.push({
                    hora_inicio: inicio.format('LTS'),
                    hora_fin:    moment(intervalo.end).format('LTS'),
                    dia:         inicio.format('dddd'),
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
                    estudiante: 1,
                    horario: nuevoHorario.get('id')
                }).then(function(nuevaSolicitud) {
                    //obtener correos
                    var correos = [];
                    JSON.parse(req.body.integrantes).forEach(function(integ) {
                        correos.push(integ.tag);
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
                                res.send('ya');
                            });
                        });
                    });
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
};