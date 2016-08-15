/**
 * Created by forte on 15/08/16.
 */

var express = require('express');
var router  = express.Router();

module.exports = function (modules) {
    router.get('/get1', function(req, res) {
        res.send('get1');
    });

    return router;
};