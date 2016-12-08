/**
 * Created by forte on 12/08/16.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Estudiante = sequelize.define('estudiante',{
        institucion: {
            type: DataTypes.STRING(100),
            allowNull: false
        }
    }, {
        freezeTableName: true,
        classMethods: {
            associate: function (db) {
                db.estudiante.hasMany(db.solicitud, {as: 'Solicitudes', foreignKey: 'estudiante'});
                db.estudiante.belongsTo(db.usuario, {as: 'Usuario', foreignKey: 'usuario'});

                db.estudiante.belongsToMany(db.opcion_evaluacion, {as: 'Respuestas', through: 'respuesta_evaluacion', foreignKey: 'estudiante'});
                db.estudiante.belongsToMany(db.solicitud, {as: 'Invitaciones', through: db.integrante_solicitud, foreignKey: 'estudiante'});
            }
        }
    });

    return Estudiante;
};