/**
 * Created by manuel on 11/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Solicitud = sequelize.define('solicitud',{
        titulo: {
            type: DataTypes.STRING(140),
            allowNull: false
        },
        cuerpo: {
            type: DataTypes.STRING(300),
            allowNull: false
        },
        estado: {
            type: DataTypes.STRING(10),
            defaultValue: 'pendiente',
            values: ['pendiente','aceptada'],
            allowNull: false
        },
        fechaRealizacion: {
            type: DataTypes.DATEONLY,
            allowNull: false
        }
    },{
        freezeTableName: true,
        classMethods: {
            associate: function(db) {
                db.solicitud.hasOne(db.sesion_tutoria,{as: 'Sesion_tutoria', foreignKey: 'solicitud'});
                db.solicitud.belongsTo(db.estudiante,{as: 'Estudiante', foreignKey: 'estudiante'});
                db.solicitud.belongsTo(db.horario,{as: 'Horario', foreignKey: 'horario'});

                db.solicitud.belongsToMany(db.keyword, {as: 'Keywords', through: 'keyword_solicitud', foreignKey: 'solicitud'});
                db.solicitud.belongsToMany(db.estudiante, {as: 'Estudiantes', through: db.integrante_solicitud, foreignKey: 'solicitud'});
            }
        }
    });

    return Solicitud;
};