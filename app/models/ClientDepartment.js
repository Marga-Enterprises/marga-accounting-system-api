module.exports = (sequelize, DataTypes) => {
    const ClientDepartment = sequelize.define('ClientDepartment', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        client_department_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        client_department_client_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
    }, {
        tableName: 'tbl_client_departments',
        modelName: 'ClientDepartment',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_department_name',
                fields: ['department_name'],
            },
            {
                name: 'idx_department_client_id',
                fields: ['department_client_id'],
            },
        ],
    });

    return ClientDepartment;
};