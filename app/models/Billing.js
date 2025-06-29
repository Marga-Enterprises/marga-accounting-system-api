module.exports = (sequelize, DataTypes) => {
    const Billing = sequelize.define('Billing', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        billing_client_id: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
        },
        billing_department_id: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
        },
        billing_branch_id: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
        },
        billing_invoice_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        billing_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        billing_total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        billing_vat_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        billing_discount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        billing_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
    }, {
        tableName: 'tbl_billings',
        modelName: 'Billing',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_billing_invoice_number',
                fields: ['billing_invoice_number'],
            },
        ],
    });

    // Associations
    Billing.associate = (models) => {
        Billing.belongsTo(models.Client, {
            foreignKey: 'billing_client_id',
            as: 'client',
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
        Billing.belongsTo(models.ClientDepartment, {
            foreignKey: 'billing_department_id',
            as: 'department',
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
        Billing.belongsTo(models.ClientBranch, {
            foreignKey: 'billing_branch_id',
            as: 'branch',
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
    };

    return Billing;
};
