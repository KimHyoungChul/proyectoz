/**
 * Created by forte on 15/08/16.
 */
var moment  = require('moment');

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
                    estudiante: 1,
                    horario: nuevoHorario.get('id')
                }).then(function(nuevaSolicitud) {
                    //obtener keywords
                    var keyword_ids = req.body.keywords.map(function(keyword) { return parseInt(keyword) });
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
    });
    app.post('/solicitud/crear_tutoria/', function(req, res) {
        console.log(req.body);
        res.send('ya');
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
        var keywords = req.body.keywords.map(function(keyword) { return parseInt(keyword) });
        var tutorId  = parseInt(req.body.tutor);

        models.tutor.find({
            where: { id: tutorId }
        }).then(function(tutorEncontrado) {
            keywords.forEach(function (keyword) {
               tutorEncontrado.addKeyword(keyword);
            });

            res.send('ya');
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
                  id: usuario[0].id
                };
                models.tutor.findAll({
                    where: {
                        usuario: usuario[0].id
                    }
                }).then(function (tutor) {
                    if(tutor.length > 0){
                        console.log('klk');
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
                        console.log('klk');
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
};