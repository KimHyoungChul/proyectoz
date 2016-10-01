/**
 * Created by forte on 12/08/16.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Recurso_workspace = sequelize.define('recurso_workspace',{
        url: {
            type: DataTypes.STRING(300),
            allowNull: false
        },
        tipo: {
            type: DataTypes.STRING(15),
            allowNull: false,
            values: ['url', 'archivo']
        }
    },  {
        freezeTableName: true
    });
    return Recurso_workspace;
};