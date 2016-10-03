"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var sequelize;

if (process.env.PRODUCTION) {
    //aplicacion ejecutandose en droplet, usar credenciales de instancia RDS de AWS
    sequelize = new Sequelize('proyectoz_relacional', 'postgres', '123batata',{
        host: 'proyectoz-relacional.cvzngndx6hzq.us-east-1.rds.amazonaws.com',
        dialect: 'postgres',
        freezeTableName: true,
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });
}
else {
    //aplicacion ejecutandose localmente
    sequelize = new Sequelize('proyectoz', 'postgres', '123batata',{
        host: 'localhost',
        dialect: 'postgres',
        freezeTableName: true,
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });
}

var db = {};

//cargar modelos
fs  .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

//relacionar modelos
Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

//guardar referencias
db.sequelize = sequelize;
db.Sequelize = Sequelize;

//exportar objeto con referencias a orm y modelos
module.exports = db;