/**
 * Created by forte on 15/08/16.
 */

var express = require('express');
var router  = express.Router();

module.exports = function (modules) {
    router.get('/post1', function(req, res) {
        res.send('post1');
    });

    return router;
};