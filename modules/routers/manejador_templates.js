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
};