"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var sequelize = new Sequelize('proyectoz', 'postgres', '123batata', {
    host: 'localhost',
    dialect: 'postgres',
    freezeTableName: true,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

var db = {};

fs  .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

db.horario.hasMany(db.intervalo,{as: 'intervalos', foreignKey: 'horario'});
db.horario.hasOne(db.solicitud,{as: 'solictud', foreignKey: 'horario'});
db.solicitud.hasOne(db.sesion_tutoria,{as: 'sesion_tutoria', foreignKey: 'solicitud'});
db.usuario.hasOne(db.tutor, {as: 'tutor', foreignKey: 'usuario'});
db.tutor.hasOne(db.sesion_tutoria, {as: 'sesion_tutoria', foreignKey: 'tutor'});
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;