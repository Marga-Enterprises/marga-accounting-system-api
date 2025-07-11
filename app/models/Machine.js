module.exports = (sequelize, DataTypes) => {
    const Machine = sequelize.define('Machine', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        machine_brand: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        machine_model: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        machine_description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        machine_serial_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        machine_status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'On Stock', 
        }
    }, {
        tableName: 'tbl_machines',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_machine_serial_number',
                fields: ['machine_serial_number'],
            },
            {
                name: 'idx_machine_brand_model',
                fields: ['machine_brand', 'machine_model'],
            },
        ],
    });

    return Machine;
};