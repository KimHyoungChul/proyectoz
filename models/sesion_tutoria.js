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
        freezeTableName: true
    });

    return Sesion_tutoria;
};