module.exports = (sequelize, DataTypes) => {
    const ClientBranches = sequelize.define('ClientBranches', {
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
    }, {
        tableName: 'tbl_client_branches',
        modelName: 'ClientBranches',
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

    return ClientBranches;
}