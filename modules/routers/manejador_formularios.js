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
                    where:{
                        usuario: usuario[0].id
                    }
                }).then(function (tutor) {
                    if(tutor.length > 0){
                        console.log('klk');
                        user.autorizado = tutor[0].autorizado;
                        user.tipo = 'tutor';
                        req.session.usuario = user;
                        response.status = 0;
                        res.send(JSON.stringify(response));
                    }
                });
                models.estudiante.findAll({
                    where:{
                        usuario: usuario[0].id
                    }
                }).then(function (estudiante) {
                    if(estudiante.length > 0){
                        console.log('klk');
                        user.autorizado = false;
                        user.tipo = 'estudiante';
                        req.session.usuario = user;
                        response.status = 0;
                        res.send(JSON.stringify(response));
                    }
                });

            }
            else{
                response.status = -1;
                res.send(JSON.stringify( response ));
            }

        });
        
    });
};