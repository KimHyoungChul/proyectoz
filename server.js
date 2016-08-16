//dependencias fuertes
var express = require('express');
var bodyParser = require('body-parser');
var https   = require('https');
var app     = express();
var _models  = require('./models');
var _kurento = require('./modules/kurento.js');
var _io      = require('./modules/socket_io.js');

//utils
var path    = require('path');
var url     = require('url');
var fs      = require('fs');

//inicializando express app
//ubicacion de archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//declarando motor de templates
app.set('view engine', 'ejs');
//ubicacion de vistas
app.set('views', __dirname + '/views');

//direcciones de recursos web
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

//inicializando aplicacion luego que los modelos se 'sincronizan'
_models.sequelize.sync({force: true}).then(function () {

    //inicializando
    var app_server = server.listen(app_url.port, function() {
        console.log('Listening in https://localhost:' + app_url.port + '/');
    });

    //inicializando mensajeria con kurento
    _kurento.init(app_server,direcciones);

    //manejo de mensajeria del chat
    _io.init(server);

    var modules = {
        kurento: _kurento,
        io:      _io,
        models:  _models,
        express: app
    };

    //inicializando rutas
    require('./modules/routers/manejador_templates.js')(modules);
    require('./modules/routers/manejador_formularios.js')(modules);

    _models.usuario.create({
        email: 'usuario1@usuario1.com',
        password: 'usuario1',
        nombre: 'usuario1',
        apellido: 'usuario1',
        genero: 'M',
        fecha_nacimiento: new Date('12-15-1996')
    }).then(function(usuario) {
        var estudiante = _models.estudiante.create({
            institucion: 'IPISA'
        }).then(function(est) {
            usuario.setEstudiante(est);
        });
    });
    _models.usuario.create({
        email: 'usuario2@usuario2.com',
        password: 'usuario2',
        nombre: 'usuario2',
        apellido: 'usuario2',
        genero: 'M',
        fecha_nacimiento: new Date('12-15-1996')
    }).then(function(usuario) {
        var tutor = _models.tutor.create({
            ocupacion: 'Estudiante'
        }).then(function(tut) {
            usuario.setTutor(tut);
        });
    });
});