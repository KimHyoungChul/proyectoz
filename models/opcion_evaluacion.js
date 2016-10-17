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
        freezeTableName: true,
        classMethods: {
            associate: function (db) {
                // db.opcion_evaluacion.belongsToMany(db.estudiante, {as: 'Estudiantes', through: 'respuesta_evaluacion', foreignKey: 'respuesta'});
                db.opcion_evaluacion.belongsTo(db.evaluacion, {as: 'Evaluacion', foreignKey: 'evaluacion'})
            }
        }
    });

    return Opcion_evaluacion;
};