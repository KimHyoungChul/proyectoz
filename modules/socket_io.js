/**
 * Created by forte on 14/08/16.
 */

module.exports = {
    init: function (app_server) {
        var io = require('socket.io').listen(app_server);

        io.on('connection', function(socket) {
            socket.on('chat message', function(msg) {
                io.emit('chat message', msg);
            });
        });

        return io;
    }
};