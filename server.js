//dependencias fuertes
var express = require('express');
var ws      = require('ws');
var kurento = require('kurento-client');
var https   = require('https');
var app     = express();
var models = require('./models');

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

//variables globales
var idCounter = 0;
var candidatesQueue = {};
var kurentoClient = null;
var presenters = {};
var viewers = [];
var noPresenterMessage = 'No hay un presentador...';

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
var io = require('socket.io').listen(server);

var app_url = url.parse(direcciones.app_location);

//inicializando aplicacion cuando el modelo se haya sincronizado
models.sequelize.sync({force: true}).then(function () {

    //inicializando
    var app_server = server.listen(app_url.port, function() {
        console.log('Escuchando en https://localhost:' + app_url.port + '/');
    });

    //inicializando websocket listener
    var websocketServer = new ws.Server({
        server : app_server,
        path : '/ws'
    });

    //manejo de mensajeria del chat
    io.on('connection', function(socket) {
        socket.on('chat message', function(msg) {
            io.emit('chat message', msg);
        });
    });

    //manejo de mensajes websocket
    websocketServer.on('connection', function(ws) {

        var sessionId = nextUniqueId();
        console.log('Connection received with sessionId ' + sessionId);

        ws.on('error', function(error) {
            console.log('Connection ' + sessionId + ' error');
            stop(sessionId);
        });

        ws.on('close', function() {
            console.log('Connection ' + sessionId + ' closed');
            stop(sessionId);
        });

        ws.on('message', function(_message) {
            var message = JSON.parse(_message);
            console.log('Connection ' + sessionId + ' received message ', message);

            switch (message.id) {
                case 'presenter':
                startPresenter(sessionId, ws, message.sdpOffer, function(error, sdpAnswer) {
                    if (error) {
                        return ws.send(JSON.stringify({
                            id : 'presenterResponse',
                            response : 'rejected',
                            message : error
                        }));
                    }
                    ws.send(JSON.stringify({
                        id : 'presenterResponse',
                        response : 'accepted',
                        sdpAnswer : sdpAnswer,
                        presenter_id : sessionId
                    }));
                });
                break;

                case 'viewer':
                var presenter_id = message.presenter_id;
                startViewer(sessionId, presenter_id, ws, message.sdpOffer, function(error, sdpAnswer) {
                    if (error) {
                        return ws.send(JSON.stringify({
                            id : 'viewerResponse',
                            response : 'rejected',
                            message : error
                        }));
                    }

                    ws.send(JSON.stringify({
                        id : 'viewerResponse',
                        response : 'accepted',
                        sdpAnswer : sdpAnswer
                    }));
                });
                break;

                case 'stop':
                stop(sessionId);
                break;

                case 'onIceCandidate':
                onIceCandidate(sessionId, message.candidate);
                break;

                default:
                ws.send(JSON.stringify({
                    id : 'error',
                    message : 'Invalid message ' + message
                }));
                break;
            }
        });
    });
});

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    kurento(direcciones.kurento_location, function(error, _kurentoClient) {
        if (error) {
            console.log("Could not find media server at address " + direcciones.kurento_location);
            return callback("Could not find media server at address" + direcciones.kurento_location
            + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

function startPresenter(sessionId, ws, sdpOffer, callback) {
    clearCandidatesQueue(sessionId);


    presenter = {
        id : sessionId,
        pipeline : null,
        webRtcEndpoint : null
    };
    

        getKurentoClient(function(error, kurentoClient) {
        if (error) {
            stop(sessionId);
            return callback(error);
        }

        if (presenter === null) {
            stop(sessionId);
            return callback(noPresenterMessage);
        }

        kurentoClient.create('MediaPipeline', function(error, pipeline) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }

            if (presenter === null) {
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            presenter.pipeline = pipeline;
            pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }

                if (presenter === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                presenter.webRtcEndpoint = webRtcEndpoint;

                if (candidatesQueue[sessionId]) {
                    while(candidatesQueue[sessionId].length) {
                        var candidate = candidatesQueue[sessionId].shift();
                        webRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                webRtcEndpoint.on('OnIceCandidate', function(event) {
                    var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    ws.send(JSON.stringify({
                        id : 'iceCandidate',
                        candidate : candidate
                    }));
                });

                webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }

                    if (presenter === null) {
                        stop(sessionId);
                        return callback(noPresenterMessage);
                    }

                    callback(null, sdpAnswer);
                });

                webRtcEndpoint.gatherCandidates(function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                    presenters[sessionId] = presenter;
                    
                });
            });
        });
    });
}

function startViewer(sessionId, presenter_id, ws, sdpOffer, callback) {
    clearCandidatesQueue(sessionId);

    if (presenters === {}) {
        stop(sessionId);
        return callback(noPresenterMessage);
    }
    var presenter = presenters[presenter_id];
    presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
        if (error) {
            stop(sessionId);
            return callback(error);
        }
        viewers[sessionId] = {
            "webRtcEndpoint" : webRtcEndpoint,
            "ws" : ws
        }

        if (presenter === null) {
            stop(sessionId);
            return callback(noPresenterMessage);
        }

        if (candidatesQueue[sessionId]) {
            while(candidatesQueue[sessionId].length) {
                var candidate = candidatesQueue[sessionId].shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }

        webRtcEndpoint.on('OnIceCandidate', function(event) {
            var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            ws.send(JSON.stringify({
                id : 'iceCandidate',
                candidate : candidate
            }));
        });

        webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }
            if (presenter === null) {
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            presenter.webRtcEndpoint.connect(webRtcEndpoint, function(error) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }
                if (presenter === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                callback(null, sdpAnswer);
                webRtcEndpoint.gatherCandidates(function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                });
            });
        });
    });
}

function clearCandidatesQueue(sessionId) {
    if (candidatesQueue[sessionId]) {
        delete candidatesQueue[sessionId];
    }
}

function stop(sessionId) {
    if (presenter !== null && presenter.id == sessionId) {
        for (var i in viewers) {
            var viewer = viewers[i];
            if (viewer.ws) {
                viewer.ws.send(JSON.stringify({
                    id : 'stopCommunication'
                }));
            }
        }
        presenter.pipeline.release();
        presenter = null;
        viewers = [];

    } else if (viewers[sessionId]) {
        viewers[sessionId].webRtcEndpoint.release();
        delete viewers[sessionId];
    }

    clearCandidatesQueue(sessionId);
}

function onIceCandidate(sessionId, _candidate) {
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (presenter && presenter.id === sessionId && presenter.webRtcEndpoint) {
        console.info('Sending presenter candidate');
        presenter.webRtcEndpoint.addIceCandidate(candidate);
    }
    else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
        console.info('Sending viewer candidate');
        viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}
