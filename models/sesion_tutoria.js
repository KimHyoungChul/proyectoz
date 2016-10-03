/**
 * Created by manuel on 12/08/16.
 */
module.exports = function(sequelize, DataTypes) {
    var Sesion_tutoria = sequelize.define('sesion_tutoria',{
        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        hora_inicio: {
            type: DataTypes.TIME,
            allowNull: false
        },
        estado: {
            type: DataTypes.STRING(10),
            defaultValue: 'futura',
            values: ['futura', 'en-proceso', 'realizada', 'cancelada'],
            allowNull: false
        }
    }, {
        freezeTableName: true,
        classMethods: {
            associate: function(db) {
                db.sesion_tutoria.belongsTo(db.tutor, {as: 'Tutor', foreignKey: 'tutor'});
                db.sesion_tutoria.hasMany(db.mensaje_workspace, {as: 'Mensajes_workspace', foreignKey: 'sesion_tutoria'});
                db.sesion_tutoria.hasMany(db.recurso_workspace, {as: 'Recursos', foreignKey: 'sesion_tutoria'});
                db.sesion_tutoria.belongsTo(db.solicitud, {as: 'Solicitud', foreignKey: 'solicitud'});
                db.sesion_tutoria.hasMany(db.evaluacion, {as: 'Evaluaciones', foreignKey: 'sesion_tutoria'});
            }
        }
    });

    return Sesion_tutoria;
};