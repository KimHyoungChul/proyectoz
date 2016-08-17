/**
 * Created by forte on 15/08/16.
 */

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;

    app.post('/post1', function(req, res) {
        res.send('post1');
    });

    app.post('/keyword/crear/', function(req, res) {
        var texto_keyword = req.body.texto.toLowerCase();
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
                ocupacion: req.body.ocupacion
            }).then(function(tut) {
                usuario.setTutor(tut);
                res.redirect(303,'/keyword/crear/');
            });
        });

    });
};