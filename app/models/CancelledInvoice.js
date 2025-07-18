module.exports = (sequelize, DataTypes) => {
    const CancelledInvoice = sequelize.define('CancelledInvoice', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        cancelled_invoice_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        cancelled_invoice_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        cancelled_invoice_remarks: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        cancelled_invoice_billing_id: {
            type: DataTypes.INTEGER(11),
            allowNull: true, 
        },
    }, {
        tableName: 'tbl_cancelled_invoices',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_cancelled_invoice_number',
                fields: ['cancelled_invoice_number'],
            },
            {
                name: 'idx_cancelled_invoice_billing_id',
                fields: ['cancelled_invoice_billing_id'],
            },
        ],
    });

    CancelledInvoice.associate = (models) => {
        CancelledInvoice.belongsTo(models.Billing, {
            foreignKey: 'cancelled_invoice_billing_id',
            as: 'billing',
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });
    };

    return CancelledInvoice;
};
