/**
 * Created by manuel on 11/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
        var Usuario = sequelize.define('usuario', {
        email: {
            type: DataTypes.STRING(50),
            allowNUll: false
        },
        password:{
            type: DataTypes.STRING(50),
            allowNUll: false
        },
        nombre: {
            type: DataTypes.STRING(50),
            allowNUll: false
        },
        apellido: {
            type: DataTypes.STRING(50),
            allowNUll: false
        },
        genero: {
            type: DataTypes.CHAR(1),
            allowNUll: false
        },
        fecha_nacimiento: {
            type: DataTypes.DATEONLY,
            allowNUll: false
        }
    },{freezeTableName: true});

    return Usuario;
};