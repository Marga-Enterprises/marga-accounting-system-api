module.exports = (sequelize, DataTypes) => {
    const Collection = sequelize.define('Collection', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        collection_billing_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        collection_invoice_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        collection_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        collection_balance: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        collection_status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'pending',
        },
        collection_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        collection_remarks: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    }, {
        tableName: 'tbl_collections',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_collection_billing_id',
                fields: ['collection_billing_id'],
            },
            {
                name: 'idx_collection_invoice_number',
                fields: ['collection_invoice_number'],
            }
        ],
    });

    // associations
    Collection.associate = (models) => {
        Collection.belongsTo(models.Billing, {
            foreignKey: 'collection_billing_id',
            as: 'billing',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        Collection.hasMany(models.Payment, {
            foreignKey: 'payment_collection_id',
            as: 'payments',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    };

    return Collection;
};