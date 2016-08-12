/**
 * Created by manuel on 11/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Tutor = sequelize.define('tutor',{
        ocupacion: {
            type: DataTypes.STRING(100),
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    return Tutor;
};
