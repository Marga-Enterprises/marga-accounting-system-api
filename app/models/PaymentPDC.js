module.exports = (sequelize, DataTypes) => {
    const PaymentPDC = sequelize.define('PaymentPDC', {
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

    PaymentPDC.associate = (models) => {
        PaymentPDC.belongsTo(models.Payment, {
            foreignKey: 'id',
            as: 'pdc',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };

    return PaymentPDC;
};
