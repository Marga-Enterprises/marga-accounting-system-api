module.exports = (sequelize, DataTypes) => {
    const ClientBranch = sequelize.define('ClientBranch', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        branch_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        branch_client_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        branch_address: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        branch_phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        branch_email: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        branch_status: {
            type: DataTypes.ENUM('active', 'inactive', 'pending'),
            allowNull: false,
            defaultValue: 'active',
        },
    }, {
        tableName: 'tbl_client_branches',
        modelName: 'ClientBranch',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_branch_name',
                fields: ['branch_name'],
            },
            {
                name: 'idx_branch_client_id',
                fields: ['branch_client_id'],
            },
            {
                name: 'idx_branch_address',
                fields: ['branch_address'],
            },
        ],
    });

    // Associations
    ClientBranch.associate = (models) => {
        ClientBranch.belongsTo(models.Client, {
            foreignKey: 'branch_client_id',
            as: 'client',
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
    };

    return ClientBranch;
}