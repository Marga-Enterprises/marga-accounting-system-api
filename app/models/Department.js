module.exports = (sequelize, DataTypes) => {
    const Department = sequelize.define('Department', {
        id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        department_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        department_description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'tbl_departments',
        modelName: 'Department',
        sequelize,
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_department_name',
                fields: ['department_name'],
            },
        ],
    });

    // Associations
    Department.associate = (models) => {
        Department.hasMany(models.User, {
            foreignKey: 'user_department_id',
            as: 'users',
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
    };

    return Department;
};