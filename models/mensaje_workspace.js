/**
 * Created by forte on 12/08/16.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Mensaje_workspace = sequelize.define('mensaje_workspace',{
        hora_fecha: {
            type: DataTypes.DATE,
            allowNull: false
        },
        texto: {
            type: DataTypes.STRING(300),
            allowNull: false
        }
    }, {
        freezeTableName: true,
        classMethods: {
            associate: function (db) {
                db.mensaje_workspace.belongsTo(db.sesion_tutoria, {as: 'Sesion_tutoria', foreignKey: 'sesion_tutoria'});
                db.mensaje_workspace.belongsTo(db.usuario, {as: 'Usuario', foreignKey: 'usuario'});
            }
        }
    });

    return Mensaje_workspace;
};