//dependencias fuertes
var express    = require('express');
var session    = require('express-session');
var bodyParser = require('body-parser');
var http       = require('http');
var https      = require('https');
var app        = express();
var _models    = require('./models');
var _kurento   = require('./modules/kurento.js');
var _io        = require('./modules/socket_io.js');
var _async = require('async');

//utils
var path    = require('path');
var url     = require('url');
var fs      = require('fs');

//inicializando express app
// app.use(cookieParser('salabantruska'));
app.use(session({
    secret: 'proyectoz'
    // resave: false,
    // saveUninitialized: true,
    // cookie: { secure: true }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//declarando motor de templates
app.set('view engine', 'ejs');
//ubicacion de vistas
app.set('views', __dirname + '/views');

//direcciones de recursos web
//droplet IP 162.243.125.7
//siempre kurento estara local a la aplicacion (droplet o local)
var direcciones = {
    app_location : "https://localhost:8443/",
    kurento_location : "ws://localhost:8888/kurento"
};
var app_url = url.parse(direcciones.app_location);

//cargar credenciales para https
var credenciales = {
    key:  fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt')
};

//crear instancia de servidor web https
var server = https.createServer(credenciales,app);

//inicializando
var port = process.env.PORT || 8443;
var app_server = server.listen(port, function() {
    console.log('Listening in ' + direcciones.app_location);

    //inicializando aplicacion luego que los modelos se 'sincronizan'
    _models.sequelize.sync({force: true}).then(function () {

        //inicializando mensajeria con kurento
        _kurento.init(app_server,direcciones);

        //manejo de mensajeria del chat
        _io.init(server,_models);

        var modules = {
            kurento: _kurento,
            io:      _io,
            models:  _models,
            express: app,
        	async: _async
        };

        //inicializando rutas
        require('./modules/routers/manejador_templates.js')(modules);
        require('./modules/routers/manejador_formularios.js')(modules);

        //usuarios dummies (dev only)
        _models.usuario.findOrCreate({
            where: {email: 'u1@u1.u1'},
            defaults: {
                email: 'u1@u1.u1',
                password: 'usuario1',
                nombre: 'usuario1',
                apellido: 'usuario1',
                genero: 'M',
                fecha_nacimiento: new Date('12-15-1996')
            }
        }).spread(function(user,created) {
            _models.estudiante.findOrCreate({
                where: {id: 1},
                defaults: {
                    institucion: 'IPISA',
                    usuario: user.get('id')
                }
            });
        });
        _models.usuario.findOrCreate({
            where: {email: 'u3@u3.u3'},
            defaults: {
                email: 'u3@u3.u3',
                password: 'usuario3',
                nombre: 'usuario3',
                apellido: 'usuario3',
                genero: 'F',
                fecha_nacimiento: new Date('11-6-1993')
            }
        }).spread(function(user,created) {
            _models.estudiante.findOrCreate({
                where: {id: 2},
                defaults: {
                    institucion: 'PASPLAND',
                    usuario: user.get('id')
                }
            });
        });
        _models.usuario.findOrCreate({
            where: {email: 'u2@u2.u2'},
            defaults: {
                email: 'u2@u2.u2',
                password: 'usuario2',
                nombre: 'usuario2',
                apellido: 'usuario2',
                genero: 'F',
                fecha_nacimiento: new Date('06-02-1994')
            }
        }).spread(function(user,created) {
            _models.tutor.findOrCreate({
                where: {id: 1},
                defaults: {
                    ocupacion: 'Estudiante',
                    autorizado: false,
                    usuario: user.get('id')
                }
            });
        });
    });
});