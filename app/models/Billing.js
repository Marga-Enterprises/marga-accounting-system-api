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
        billing_month: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        billing_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        billing_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        billing_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        billing_is_cancelled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        tableName: 'tbl_billings',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'billing_invoice_number',
                fields: ['billing_invoice_number'],
            },
        ],
    });

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

        Billing.hasMany(models.CancelledInvoice, {
            foreignKey: 'cancelled_invoice_billing_id',
            as: 'cancelled_invoices',
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });

        Billing.hasMany(models.Collection, {
            foreignKey: 'collection_billing_id',
            as: 'collections',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    };

    return Billing;
};
