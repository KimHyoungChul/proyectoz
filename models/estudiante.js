/**
 * Created by forte on 12/08/16.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Estudiante = sequelize.define('estudiante',{
        institucion: {
            type: DataTypes.STRING(100),
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    return Estudiante;
};