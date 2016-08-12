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
        freezeTableName: true
    });

    return Keyword;
};