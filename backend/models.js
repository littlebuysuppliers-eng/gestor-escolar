const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  passwordHash: DataTypes.STRING,
  role: DataTypes.STRING,
  driveFolderId: DataTypes.STRING
});

const Document = sequelize.define('Document', {
  title: DataTypes.STRING,
  driveFileId: DataTypes.STRING
});

User.hasMany(Document);
Document.belongsTo(User);

async function init() {
  await sequelize.sync();
  console.log('DB synced');
}

module.exports = { init, User, Document };
