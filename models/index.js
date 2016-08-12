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
db.usuario.hasOne(db.estudiante, {as: 'tutor', foreignKey: 'usuario'});

db.evaluacion.belongsTo(db.sesion_tutoria, {as: 'evaluaciones', foreignKey: 'sesion_tutoria'});
db.evaluacion.hasMany(db.opcion_evaluacion, {as: 'opciones', foreignKey: 'evaluacion'});
db.sesion_tutoria.hasMany(db.recurso_workspace, {as: 'recursos', foreignKey: 'sesion_tutoria'});

db.estudiante.belongsToMany(db.opcion_evaluacion, {as: 'respuestas', through: 'respuesta_evaluacion', foreignKey: 'estudiante'});
db.opcion_evaluacion.belongsToMany(db.estudiante, {as: 'estudiantes', through: 'respuesta_evaluacion', foreignKey: 'respuesta'});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;