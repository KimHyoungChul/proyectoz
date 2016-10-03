/**
 * Created by manuel on 11/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Tutor = sequelize.define('tutor',{
        ocupacion: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        autorizado:{
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {
        freezeTableName: true,
        classMethods: {
            associate: function(db) {
                db.tutor.belongsTo(db.usuario, {as: 'Usuario', foreignKey: 'usuario'});
                db.tutor.hasMany(db.sesion_tutoria, {as: 'sesion_tutoria', foreignKey: 'tutor'});

                db.tutor.belongsToMany(db.keyword, {as: 'Keywords', through: 'keyword_tutor', foreignKey: 'tutor'});
            }
        }
    });

    return Tutor;
};
