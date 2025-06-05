const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('@config/db'); // update path if needed
const db = {};

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file !== 'index.js' &&
      file.endsWith('.js')
    );
  })
  .forEach((file) => {
    const modelDef = require(path.join(__dirname, file));
    const model = modelDef(sequelize, Sequelize.DataTypes);

    if (!model || !model.name) {
      console.warn(`⚠️ Skipping invalid model file: ${file}`);
      return;
    }

    db[model.name] = model;
  });

// Setup associations if any
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
