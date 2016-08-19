/**
 * Created by forte on 15/08/16.
 */

module.exports = function (modules) {
    var app = modules.express;

    app.get('/solicitud/crear/', function(req, res) {
        res.render('crear_solicitud');
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

    app.get('/login/', function(req, res) {
        res.render('login');
    });

    app.get('/', function(req, res) {
        console.log(req.session);
        res.render('basic');
    });
};