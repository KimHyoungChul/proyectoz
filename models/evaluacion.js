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
        freezeTableName: true,
        classMethods: {
            associate: function (db) {
                db.evaluacion.belongsTo(db.sesion_tutoria, {as: 'Sesion_tutoria', foreignKey: 'sesion_tutoria'});
                db.evaluacion.hasMany(db.opcion_evaluacion, {as: 'Opciones', foreignKey: 'evaluacion'})
            }
        }
    });

    return Evaluacion;
};