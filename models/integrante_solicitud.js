/**
 * Created by manuel on 12/08/16.
 */
/**
 * Created by manuel on 11/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Integrante_solicitud = sequelize.define('integrante_solicitud',{
        estado: {
            type: DataTypes.STRING(10),
            defaultValue: 'pendiente',
            values: ['pendiente', 'aceptado', 'rechazado'],
            allowNull: false
        }
    }, {
        freezeTableName: true,
        classMethods: {
            associate: function (db) {
                db.integrante_solicitud.belongsTo(db.solicitud, {as: 'Solicitud', through: 'integrante_solicitud_solicitud', foreignKey: 'solicitud'});
                db.integrante_solicitud.belongsTo(db.estudiante, {as: 'Estudiante', through: 'integrante_solicitud_estudiante', foreignKey: 'estudiante'});
            }
        }
    });

    return Integrante_solicitud;
};