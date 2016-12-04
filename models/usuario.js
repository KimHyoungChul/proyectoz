/**
 * Created by manuel on 11/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Usuario = sequelize.define('usuario', {
        email: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        password:{
            type: DataTypes.STRING(50),
            allowNull: false
        },
        nombre: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        apellido: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        genero: {
            type: DataTypes.CHAR(1),
            allowNull: false
        },
        fecha_nacimiento: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        firebase_token: {
            type: DataTypes.STRING(256),
            allowNull: true
        }

    },{
        freezeTableName: true,
        classMethods: {
            associate: function (db) {
                db.usuario.hasOne(db.tutor, {as: 'Tutor', foreignKey: 'usuario'});
                db.usuario.hasOne(db.estudiante, {as: 'Estudiante', foreignKey: 'usuario'});
                db.usuario.hasMany(db.mensaje_workspace, {as: 'mensaje_workspace', foreignKey: 'usuario'})
            }
        }
    });

    return Usuario;
};