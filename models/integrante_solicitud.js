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
            values: ['pendiente', 'aceptado', 'rechazado'],
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    return Integrante_solicitud;
};