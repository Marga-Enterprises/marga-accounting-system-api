module.exports = (sequelize, DataTypes) => {
    const PaymentOnlineTransfer = sequelize.define('PaymentOnlineTransfer', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            allowNull: false,
        },
        payment_online_transfer_reference_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        payment_online_transfer_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    }, {
        tableName: 'tbl_payment_online_transfers',
        timestamps: true,
        underscored: true,
    });

    PaymentOnlineTransfer.associate = (models) => {
        PaymentOnlineTransfer.belongsTo(models.Payment, {
            foreignKey: 'id',
            as: 'onlineTransfer',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };

    return PaymentOnlineTransfer;
};
