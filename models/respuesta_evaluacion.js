/**
 * Created by forte on 21/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Respuesta_evaluacion = sequelize.define('respuesta_evaluacion',{
        
    },
    {
        freezeTableName: true
    });

    return Respuesta_evaluacion;
};