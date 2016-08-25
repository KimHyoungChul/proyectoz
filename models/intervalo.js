"use strict";

module.exports = function(sequelize, DataTypes) {
    var Intervalo = sequelize.define('intervalo',{
        hora_inicio: {
            type: DataTypes.DATE,
            allowNull: false
        },
        hora_fin: {
            type: DataTypes.DATE,
            allowNull: false
        }
    },{
        freezeTableName: true
    });

    return Intervalo;
};