"use strict";

module.exports = function(sequelize, DataTypes) {
    var Intervalo = sequelize.define('intervalo',{
        hora_inicio: {
            type:DataTypes.TIME,
            allowNull: false
        },
        hora_fin: {
            type:DataTypes.TIME,
            allowNull: false
        },
        dia:{
            type:DataTypes.STRING(15),
            allowNull: false
        }
    },{freezeTableName: true});

    return Intervalo;
};