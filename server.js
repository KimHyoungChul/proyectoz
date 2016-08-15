//dependencias fuertes
var express = require('express');
var https   = require('https');
var app     = express();
var models  = require('./models');
var kurento = require('./kurento');
var io      = require('./socket_io');

//utils
var path    = require('path');
var url     = require('url');
var fs      = require('fs');

//configurar express app
app.use(express.static(path.join(__dirname, 'public')));
//asignando motor de templates
app.set('view engine', 'ejs');
//ubicacion de vistas
app.set('views', __dirname + '/views');
//rutas
app.get('/', function(req,res) {
    res.render('index');
});

//inicializando servidor
var direcciones = {
    app_location : "https://localhost:8443/",
    kurento_location : "ws://localhost:8888/kurento"
};

//para https
var credenciales = {
    key:  fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt')
};

var server = https.createServer(credenciales,app);

var app_url = url.parse(direcciones.app_location);

//inicializando aplicacion cuando el modelo se haya sincronizado
models.sequelize.sync({force: true}).then(function () {

    //inicializando
    var app_server = server.listen(app_url.port, function() {
        console.log('Escuchando en https://localhost:' + app_url.port + '/');
    });

    //inicializando mensajeria con kurento
    kurento.init(app_server,direcciones);

    //manejo de mensajeria del chat
    io.init(server);
});