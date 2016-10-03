/**
 * Created by forte on 12/08/16.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Keyword = sequelize.define('keyword',{
        texto: {
            type: DataTypes.STRING(140),
            allowNull: false
        }
    }, {
        freezeTableName: true,
        classMethods: {
            associate: function (db) {
                db.keyword.belongsToMany(db.solicitud, {as: 'Solicitudes', through: 'keyword_solicitud', foreignKey: 'keyword'});
                db.keyword.belongsToMany(db.tutor, {as: 'Tutores', through: 'keyword_tutor', foreignKey: 'keyword'});
            }
        }
    });

    return Keyword;
};