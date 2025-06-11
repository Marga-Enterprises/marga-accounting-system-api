module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        client_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        client_status: {
            type: DataTypes.ENUM('active', 'inactive', 'pending'),
            allowNull: false,
            defaultValue: 'active',
        }
    }, {
        tableName: 'tbl_clients',
        modelName: 'Client',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_client_name',
                fields: ['client_name'],
            },
        ],
    });

    // Associations
    Client.associate = (models) => {
        Client.hasMany(models.ClientBranch, {
            foreignKey: 'client_branch_client_id',
            as: 'branches',
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
        Client.hasMany(models.ClientDepartment, {
            foreignKey: 'client_department_client_id',
            as: 'departments',
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
    };

    return Client;
};