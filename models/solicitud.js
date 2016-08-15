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
            values: ['pendiente','aceptada'],
            allowNull: false
        },
        fechaRealizacion: {
            type: DataTypes.DATEONLY,
            allowNull: false
        }
    },{
        freezeTableName: true
    });

    return Solicitud;
};