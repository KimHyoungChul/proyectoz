/**
 * Created by forte on 15/08/16.
 */

module.exports = function (modules) {
    var app = modules.express;
    var models = modules.models;


    app.post('/rest/login/', function(req, res) {
        console.log("rest api recibido:" + req.body.email);
        var response = {};
        res.contentType('json');
        models.usuario.findAll({
            where: {
                email: req.body.email
            }
        }).then(function(usuario){
            if(usuario.length > 0 && usuario[0].password === req.body.password){
                response.status = 0;
                res.send(JSON.stringify( response ));
            }
            else {
                response.status = -1;
                res.send(JSON.stringify( response ));
            }
        });


    });

    app.post('/rest/registrar/', function(req, res) {
        var response = {};
        res.contentType('json');
        console.log("Api recibio peticion de registrar");
        console.log(req.body.fecha_nacimiento);
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
                response.status = 0;
                res.send(JSON.stringify( response ));
            });
        });
    });



};