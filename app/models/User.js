module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    user_fname: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    user_lname: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    user_role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    user_username: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    user_department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  }, {
    tableName: 'tbl_users',
    modelName: 'User',
    sequelize,
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_user_fname_lname',
        fields: ['user_fname', 'user_lname'],
      },
      {
        name: 'idx_user_role',
        fields: ['user_role'],
      },
      {
        name: 'idx_user_username',
        fields: ['user_username'],
      },
      {
        name: 'idx_user_department_id',
        fields: ['user_department_id'],
      },
    ]
  });

  // Associations
  User.associate = (models) => {
    User.belongsTo(models.Department, {
      foreignKey: 'user_department_id',
      as: 'department',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  };

  return User;
};
