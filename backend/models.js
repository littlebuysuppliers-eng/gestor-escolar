const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', '..', 'database.sqlite'),
  logging: false
});

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING },
  firstName: { type: DataTypes.STRING },
  lastP: { type: DataTypes.STRING },
  lastM: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  passwordHash: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'teacher' },
  grade: { type: DataTypes.INTEGER },
  groupName: { type: DataTypes.STRING },
  driveFolderId: { type: DataTypes.STRING }
});

const Document = sequelize.define('Document', {
  title: { type: DataTypes.STRING },
  driveFileId: { type: DataTypes.STRING },
  driveDownloadLink: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Pendiente' }
});

User.hasMany(Document, { as: 'documents', foreignKey: 'userId' });
Document.belongsTo(User, { foreignKey: 'userId' });

async function init() {
  await sequelize.sync({ alter: true });
  console.log('DB synced');
}

module.exports = { init, sequelize, User, Document };
