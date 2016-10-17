/**
 * Created by forte on 21/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Respuesta_evaluacion = sequelize.define('respuesta_evaluacion',{
        estudiante: {
            type: DataTypes.INTEGER,
            references: {
                model: "estudiante",
                key: "id"
            }
        },
        respuesta: {
            type: DataTypes.INTEGER,
            references: {
                model: "opcion_evaluacion",
                key: "id"
            }
        }
    },
    {
        freezeTableName: true
    });

    return Respuesta_evaluacion;
};