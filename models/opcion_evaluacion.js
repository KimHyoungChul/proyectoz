/**
 * Created by forte on 12/08/16.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Opcion_evaluacion = sequelize.define('opcion_evaluacion',{
        texto_opcion: {
            type: DataTypes.STRING(140),
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    return Opcion_evaluacion;
};