module.exports = (sequelize, DataTypes) => {
    const PaymentCheque = sequelize.define('PaymentCheque', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            allowNull: false,
        },
        payment_pdc_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        payment_pdc_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        payment_pdc_deposit_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        payment_pdc_credit_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    }, {
        tableName: 'tbl_payment_pdcs',
        timestamps: true,
        underscored: true,
    });

    PaymentCheque.associate = (models) => {
        PaymentCheque.belongsTo(models.Payment, {
            foreignKey: 'id',
            as: 'payment',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };

    return PaymentCheque;
};
