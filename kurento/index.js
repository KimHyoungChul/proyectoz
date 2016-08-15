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
    presenters: {},
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

    function startPresenter(sessionId, ws, sdpOffer, callback) {
        clearCandidatesQueue(sessionId);

        data.presenter = {
            id : sessionId,
            pipeline : null,
            webRtcEndpoint : null
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
                        data.presenters[sessionId] = data.presenter;

                    });
                });
            });
        });
    }

    function startViewer(sessionId, presenter_id, ws, sdpOffer, callback) {
        clearCandidatesQueue(sessionId);

        if (data.presenters === {}) {
            stop(sessionId);
            return callback(data.noPresenterMessage);
        }
        var presenter = data.presenters[presenter_id];
        presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }
            data.viewers[sessionId] = {
                "webRtcEndpoint" : webRtcEndpoint,
                "ws" : ws
            }

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

    function stop(sessionId) {
        if (data.presenter !== null && data.presenter.id == sessionId) {
            for (var i in data.viewers) {
                var viewer = data.viewers[i];
                if (viewer.ws) {
                    viewer.ws.send(JSON.stringify({
                        id : 'stopCommunication'
                    }));
                }
            }
            data.presenter.pipeline.release();
            data.presenter = null;
            data.viewers = [];

        } else if (data.viewers[sessionId]) {
            data.viewers[sessionId].webRtcEndpoint.release();
            delete data.viewers[sessionId];
        }

        clearCandidatesQueue(sessionId);
    }

    function onIceCandidate(sessionId, _candidate) {
        var candidate = kurento.getComplexType('IceCandidate')(_candidate);

        if (data.presenter && data.presenter.id === sessionId && data.presenter.webRtcEndpoint) {
            console.info('Sending presenter candidate');
            data.presenter.webRtcEndpoint.addIceCandidate(candidate);
        }
        else if (data.viewers[sessionId] && data.viewers[sessionId].webRtcEndpoint) {
            console.info('Sending viewer candidate');
            data.viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
        }
        else {
            console.info('Queueing candidate');
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