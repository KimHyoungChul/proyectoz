"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var sequelize;

if (process.env.PRODUCTION) {
    //aplicacion ejecutandose en droplet, usar credenciales de instancia RDS de AWS
    sequelize = new Sequelize('proyectoz_relacional', 'postgres', '123batata',{
        host: 'proyectoz-relacional.cvzngndx6hzq.us-east-1.rds.amazonaws.com',
        dialect: 'postgres',
        freezeTableName: true,
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });
}
else {
    //aplicacion ejecutandose localmente
    sequelize = new Sequelize('proyectoz', 'postgres', '123batata',{
        host: 'localhost',
        dialect: 'postgres',
        freezeTableName: true,
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });
}

var db = {};

//cargar modelos
fs  .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

//relacionar modelos
db.horario.hasMany(db.intervalo,{as: 'Intervalos', foreignKey: 'horario'});
db.solicitud.belongsTo(db.horario,{as: 'Horario', foreignKey: 'horario'});
db.solicitud.hasOne(db.sesion_tutoria,{as: 'sesion_tutoria', foreignKey: 'solicitud'});
db.usuario.hasOne(db.tutor, {as: 'Tutor', foreignKey: 'usuario'});
db.usuario.hasOne(db.estudiante, {as: 'Estudiante', foreignKey: 'usuario'});
db.tutor.hasOne(db.sesion_tutoria, {as: 'sesion_tutoria', foreignKey: 'tutor'});
db.sesion_tutoria.hasOne(db.mensaje_sesion_tutoria, {as: 'mensaje_sesion_tutoria', foreignKey: 'sesion_tutoria'});
db.sesion_tutoria.hasOne(db.mensaje_workspace, {as: 'mensaje_workspace', foreignKey: 'sesion_tutoria'});
db.estudiante.hasOne(db.solicitud, {as: 'solicitud', foreignKey: 'estudiante'});
db.sesion_tutoria.hasMany(db.evaluacion, {as: 'Evaluaciones', foreignKey: 'sesion_tutoria'});
db.evaluacion.hasMany(db.opcion_evaluacion, {as: 'Opciones', foreignKey: 'evaluacion'});
db.sesion_tutoria.hasMany(db.recurso_workspace, {as: 'recursos', foreignKey: 'sesion_tutoria'});

db.keyword.belongsToMany(db.tutor, {as: 'Tutores', through: 'keyword_tutor', foreignKey: 'keyword'});
db.tutor.belongsToMany(db.keyword, {as: 'Keywords', through: 'keyword_tutor', foreignKey: 'tutor'});
db.keyword.belongsToMany(db.solicitud, {as: 'Solicitudes', through: 'keyword_solicitud', foreignKey: 'keyword'});
db.solicitud.belongsToMany(db.keyword, {as: 'Keywords', through: 'keyword_solicitud', foreignKey: 'solicitud'});
db.solicitud.belongsToMany(db.estudiante, {as: 'estudiantes', through: db.integrante_solicitud, foreignKey: 'solicitud'});
db.estudiante.belongsToMany(db.solicitud, {as: 'solicitudes', through: db.integrante_solicitud, foreignKey: 'estudiante'});
db.estudiante.belongsToMany(db.opcion_evaluacion, {as: 'respuestas', through: 'respuesta_evaluacion', foreignKey: 'estudiante'});
db.opcion_evaluacion.belongsToMany(db.estudiante, {as: 'estudiantes', through: 'respuesta_evaluacion', foreignKey: 'respuesta'});

//guardar referencias
db.sequelize = sequelize;
db.Sequelize = Sequelize;

//exportar objeto con referencias a orm y modelos
module.exports = db;