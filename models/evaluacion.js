/**
 * Created by forte on 12/08/16.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Evaluacion = sequelize.define('evaluacion',{
        encabezado: {
            type: DataTypes.STRING(300),
            allowNull: false
        },
        respuesta_correcta: {
            type: DataTypes.INTEGER,
            model: "Opcion_evaluacion",
            key: "id"
        }
    }, {
        freezeTableName: true
    });

    return Evaluacion;
};