/**
 * Created by forte on 15/08/16.
 */

var express = require('express');
var router  = express.Router();

module.exports = function (modules) {
    router.get('/solicitud/crear/', function(req, res) {
        res.render('test');
    });

    return router;
};