/**
 * Created by forte on 15/08/16.
 */

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;

    app.post('/solicitud/crear/', function(req, res) {
        console.log(req.body);
        res.send('ya');
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
};