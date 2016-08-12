/**
 * Created by forte on 12/08/16.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Mensaje_sesion_tutoria = sequelize.define('mensaje_sesion_tutoria',{
        hora_fecha: {
            type: DataTypes.DATE,
            allowNull: false
        },
        texto: {
            type: DataTypes.STRING(300),
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    return Mensaje_sesion_tutoria;
};