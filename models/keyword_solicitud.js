/**
 * Created by forte on 21/08/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
    var Keyword_solicitud = sequelize.define('keyword_solicitud',{
        
    },
    {
        freezeTableName: true
    });

    return Keyword_solicitud;
};