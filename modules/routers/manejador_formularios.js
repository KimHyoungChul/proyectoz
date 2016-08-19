/**
 * Created by forte on 15/08/16.
 */
var Promise = require('bluebird');
var moment  = require('moment');
moment.locale('es');

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;

    app.post('/solicitud/crear/', function(req, res) {
        //crear horario
        models.horario.create({
            fecha_creacion: new Date()
        }).then(function (nuevoHorario) {
            //parsear arreglo de intervalos
            var horario = JSON.parse(req.body.horario);
            //arreglo de intervalos transformados
            var intervalos = [];
            //transformar horas a formato indicado para persistir
            horario.forEach(function(intervalo) {
                var inicio    = moment(intervalo.start);
                var fin       = moment(intervalo.end);
                var dia       = inicio.format('dddd');

                intervalos.push({
                    hora_inicio: inicio.format('LTS'),
                    hora_fin:    fin.format('LTS'),
                    dia:         dia,
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
                    //obtener id de cada correo valido (excluyendo el usuario loqueado si esta seteado)
                    //crear agregar cada integrante a la solicitud
                    res.send('ya');
                });
            });
        });

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
};