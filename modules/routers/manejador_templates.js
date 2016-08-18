/**
 * Created by forte on 15/08/16.
 */

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;

    app.get('/solicitud/crear/', function(req, res) {
        models.keyword.findAll().then(function (_keywords) {
            res.render('crear_solicitud', {
                keywords: _keywords
            });
        });
    });

    app.get('/keyword/crear/', function(req, res) {
        res.render('crear_keyword');
    });
};