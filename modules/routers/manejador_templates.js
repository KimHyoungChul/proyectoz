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

    app.get('/estudiantes/crear/', function(req, res) {
        res.render('crear_estudiante');
    });

    app.get('/tutores/crear/', function(req, res){
       res.render('crear_tutor');
    });

    app.get('/login/', function(req, res) {
        res.render('login');
    });

    app.get('/sesion/:id', function(req, res) {
        console.log(req.params.id);
        var opciones = {
            todavia: false,
            sesion: 0,
            presentador: false
        };
        models.sesion_tutoria.findAll({
            where:{
                id: parseInt(req.params.id)
            }
        }).then(function (sesiones) {
            if (sesiones.length > 0){
                var sesion = sesiones[0];
                var view;
                var usuario = req.session.usuario;
                if(usuario.tipo === 'tutor'){
                    view = 'sesion_presentador';
                    opciones.presentador = true;
                }
                else{
                    view = 'sesion_oyente';
                }
                if (sesion.fecha <= new Date()){

                    opciones.sesion = sesion.id;
                }
                else{
                    opciones.todavia = true;
                }
                res.render(view,opciones);
            }
            else{
                res.render(view,opciones);
            }
        });
    });

    app.get('/', function(req, res) {
        console.log(req.session);
        res.render('basic');
    });
};


