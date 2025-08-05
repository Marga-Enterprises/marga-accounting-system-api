module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        payment_collection_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        payment_invoice_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        payment_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        payment_amount_paid: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        payment_2307_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: true,
        },
        payment_has_2307: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        payment_mode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'cash',
        },
        payment_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        payment_posting_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        payment_collection_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        payment_invoice_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        payment_or_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        payment_remarks: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        payment_is_cancelled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        tableName: 'tbl_payments',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_payment_or_number',
                fields: ['payment_or_number'],
            },
            {
                name: 'idx_payment_invoice_number',
                fields: ['payment_invoice_number'],
            },
        ],
    });

    Payment.associate = (models) => {
        // Main association to collections
        Payment.belongsTo(models.Collection, {
            foreignKey: 'payment_collection_id',
            as: 'collection',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        // Subtype associations
        Payment.hasOne(models.PaymentCheque, {
            foreignKey: 'id',
            as: 'cheque',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        Payment.hasOne(models.PaymentOnlineTransfer, {
            foreignKey: 'id',
            as: 'onlineTransfer',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        Payment.hasOne(models.PaymentPDC, {
            foreignKey: 'id',
            as: 'pdc',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    };

    return Payment;
};
