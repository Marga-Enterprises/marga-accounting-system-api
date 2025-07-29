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
            unique: true,
        },
        payment_or_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        payment_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        payment_mode: {
            type: DataTypes.STRING(50), // Changed from ENUM to STRING
            allowNull: false,
            defaultValue: 'cash',
        },
        payment_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        payment_remarks: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    }, {
        tableName: 'tbl_payments',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_payment_collection_id',
                fields: ['payment_collection_id'],
            },
            {
                name: 'idx_payment_mode',
                fields: ['payment_mode'],
            }
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
            as: 'chequeDetails',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        Payment.hasOne(models.PaymentOnlineTransfer, {
            foreignKey: 'id',
            as: 'onlineTransferDetails',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    };

    return Payment;
};
