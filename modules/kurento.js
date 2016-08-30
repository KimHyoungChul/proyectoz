/**
 * Created by manuel on 11/08/16.
 */
"use strict";

var ws = require('ws');
var kurento = require('kurento-client');

var data = {
    idCounter: 0,
    candidatesQueue: {},
    kurentoClient: null,
    presenters: [],
    viewers: [],
    noPresenterMessage: 'No hay un presentador...'
};

var initializer = function(app_server,direcciones) {

    var websocketServer = new ws.Server({
        server : app_server,
        path : '/ws'
    });

    //manejo de mensajes websocket
    websocketServer.on('connection', function(ws) {

        var sessionId = nextUniqueId();
        var esTutor = false;
        var tutoria;
        console.log('Connection received with sessionId ' + sessionId);

        ws.on('error', function(error) {
            console.log('Connection ' + sessionId + ' error');
            stop(sessionId,esTutor,tutoria);
        });

        ws.on('close', function() {
            console.log('Connection ' + sessionId + ' closed');
            stop(sessionId,esTutor,tutoria);
        });

        ws.on('message', function(_message) {
            var message = JSON.parse(_message);
            //console.log('Connection ' + sessionId + ' received message ', message, message.presenter_id);

            switch (message.id) {
                case 'presenter':
                    console.log("La sesion es: "+ sessionId);
                    startPresenter(sessionId,message.sesion_id, ws, message.sdpOffer, function(error, sdpAnswer) {
                        if (error) {
                            return ws.send(JSON.stringify({
                                id : 'presenterResponse',
                                response : 'rejected',
                                message : error
                            }));
                        }
                        esTutor = true;
                        tutoria = message.sesion_id;
                        if(ws.readyState === 1){
                            ws.send(JSON.stringify({
                                id : 'presenterResponse',
                                response : 'accepted',
                                sdpAnswer : sdpAnswer,
                                presenter_id : sessionId
                            }));
                        }

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

                        esTutor = false;
                        tutoria = presenter_id;

                        ws.send(JSON.stringify({
                            id : 'viewerResponse',
                            response : 'accepted',
                            sdpAnswer : sdpAnswer
                        }));
                    });
                    break;

                case 'stop':
                    stop(sessionId, esTutor, tutoria);
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

    function nextUniqueId() {
        data.idCounter++;
        return data.idCounter.toString();
    }

    function getKurentoClient(callback) {
        if (data.kurentoClient !== null) {
            return callback(null, data.kurentoClient);
        }

        kurento(direcciones.kurento_location, function(error, _kurentoClient) {
            if (error) {
                console.log("Could not find media server at address " + direcciones.kurento_location);
                return callback("Could not find media server at address" + direcciones.kurento_location
                    + ". Exiting with error " + error);
            }

            data.kurentoClient = _kurentoClient;
            callback(null, data.kurentoClient);
        });
    }

    function startPresenter(sessionId,presenterId, ws, sdpOffer, callback) {
        clearCandidatesQueue(sessionId);
        var viewers = [];
        if(data.presenters[presenterId]){
            viewers = data.presenters[presenterId].viewers;
        }
        data.presenter = {
            id : sessionId,
            pipeline : null,
            webRtcEndpoint : null,
            viewers: viewers
        };
        
        getKurentoClient(function(error, kurentoClient) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }

            if (data.presenter === null) {
                stop(sessionId);
                return callback(data.noPresenterMessage);
            }

            kurentoClient.create('MediaPipeline', function(error, pipeline) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }

                if (data.presenter === null) {
                    stop(sessionId);
                    return callback(data.noPresenterMessage);
                }

                data.presenter.pipeline = pipeline;
                pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }

                    if (data.presenter === null) {
                        stop(sessionId);
                        return callback(data.noPresenterMessage);
                    }

                    data.presenter.webRtcEndpoint = webRtcEndpoint;

                    if (data.candidatesQueue[sessionId]) {
                        while(data.candidatesQueue[sessionId].length) {
                            var candidate = data.candidatesQueue[sessionId].shift();
                            webRtcEndpoint.addIceCandidate(candidate);
                        }
                    }

                    webRtcEndpoint.on('OnIceCandidate', function(event) {
                        var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                        if(ws.readyState === 1){
                            ws.send(JSON.stringify({
                                id : 'iceCandidate',
                                candidate : candidate
                            }));
                        }

                    });

                    webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }

                        if (data.presenter === null) {
                            stop(sessionId);
                            return callback(data.noPresenterMessage);
                        }

                        callback(null, sdpAnswer);
                    });

                    webRtcEndpoint.gatherCandidates(function(error) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }
                        data.presenters[presenterId] = data.presenter;
                        data.presenters[presenterId].viewers.forEach(function (viewer) {
                            if (viewer.ws && viewer.ws.readyState === 1) {
                                viewer.ws.send(JSON.stringify({
                                    id : 'resumeSession'
                                }));
                            }
                        });
                        // for (var i in data.presenters[presenterId].viewers) {
                        //     var viewer = data.viewers[i];
                        //    
                        // }
                        console.log('Presentador creado sesion: '+ presenterId);

                    });
                });
            });
        });
    }

    function startViewer(sessionId, presenter_id, ws, sdpOffer, callback) {
        clearCandidatesQueue(sessionId);
        
        if (data.presenters === {}) {
            stop(sessionId);
        }
        console.log('Presentador con sesion: '+ presenter_id);
        var presenter = data.presenters[presenter_id];
        if(!presenter || !presenter.pipeline){
            var viewer = {
                "webRtcEndpoint" : null,
                "ws" : ws,
                "pendiente" : true
                
            };
            if(presenter){
                data.presenters[presenter_id].viewers[sessionId] = viewer;
            }
            else{
                data.presenters[presenter_id] = {
                    viewers: [viewer]
                }
            }

            return callback(data.noPresenterMessage);

        }
        presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }
            var viewer = {
                "webRtcEndpoint" : webRtcEndpoint,
                "ws" : ws
            };
            data.presenters[presenter_id].viewers[sessionId] = viewer;
            data.viewers[sessionId] = viewer;

            if (presenter === null) {
                stop(sessionId);
                return callback(data.noPresenterMessage);
            }

            if (data.candidatesQueue[sessionId]) {
                while(data.candidatesQueue[sessionId].length) {
                    var candidate = data.candidatesQueue[sessionId].shift();
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
                    return callback(data.noPresenterMessage);
                }

                presenter.webRtcEndpoint.connect(webRtcEndpoint, function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                    if (presenter === null) {
                        stop(sessionId);
                        return callback(data.noPresenterMessage);
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
        if (data.candidatesQueue[sessionId]) {
            delete data.candidatesQueue[sessionId];
        }
    }

    function stop(sessionId, esTutor, tutoria, terminar = false) {
        if (esTutor) {
            data.presenters[tutoria].viewers.forEach(function (viewer) {
                if (viewer.ws) {
                    console.log('Enviando mensaje a' + viewer.ws);
                    if(viewer.ws.readyState === 1){
                        viewer.ws.send(JSON.stringify({
                            id : terminar ? 'stopCommunication' : 'halt'
                        }));
                    }

                }
            });
            console.log("Borrando presentador con tutoria: " + tutoria );
            data.presenters[tutoria].webRtcEndpoint.release();
            if(data.presenters[tutoria].pipeline){
                data.presenters[tutoria].pipeline.release();
            }
            data.presenters[tutoria].id = null;
            data.presenters[tutoria].pipeline = null;



        } else if (data.viewers[sessionId]) {
            data.viewers[sessionId].webRtcEndpoint.release();
            delete data.viewers[sessionId];
            console.log('Borrando viewer del presentador: ' + data.presenters[tutoria]);
            delete data.presenters[tutoria].viewers[sessionId];
        }

        clearCandidatesQueue(sessionId);
    }

    function onIceCandidate(sessionId, _candidate) {
        var candidate = kurento.getComplexType('IceCandidate')(_candidate);

        if (data.presenter && data.presenter.id === sessionId && data.presenter.webRtcEndpoint) {
            //console.info('Sending presenter candidate');
            data.presenter.webRtcEndpoint.addIceCandidate(candidate);
        }
        else if (data.viewers[sessionId] && data.viewers[sessionId].webRtcEndpoint) {
           // console.info('Sending viewer candidate');
            data.viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
        }
        else {
            //console.info('Queueing candidate');
            if (!data.candidatesQueue[sessionId]) {
                data.candidatesQueue[sessionId] = [];
            }
            data.candidatesQueue[sessionId].push(candidate);
        }
    }
};

module.exports = {
    data: data,
    init: initializer
};