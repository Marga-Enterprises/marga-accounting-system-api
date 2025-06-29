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
        },
        client_department_client_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        client_department_address: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        client_department_phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        client_department_email: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        client_department_status: {
            type: DataTypes.ENUM('active', 'inactive', 'pending'),
            allowNull: false,
            defaultValue: 'active',
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
                fields: ['client_department_name'],
            },
            {
                name: 'idx_department_client_id',
                fields: ['client_department_client_id'],
            },
            {
                name: 'idx_department_address',
                fields: ['client_department_address'],
            },
        ],
    });

    // Associations
    ClientDepartment.associate = (models) => {
        ClientDepartment.belongsTo(models.Client, {
            foreignKey: 'client_department_client_id',
            as: 'client',
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });
    };

    return ClientDepartment;
};