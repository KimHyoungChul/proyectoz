/**
 * Created by manuel on 11/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Horario = sequelize.define('horario',{
            fecha_creacion: {
                type: DataTypes.DATEONLY,
                allowNull: false
            }
        }, {
            freezeTableName: true
        }
    );

    return Horario;
};