const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('teacher','director'), allowNull: false }
});

const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  filename: { type: DataTypes.STRING, allowNull: false },
  filepath: { type: DataTypes.STRING, allowNull: false },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: { type: DataTypes.ENUM('pending','reviewed','approved','rejected'), defaultValue: 'pending' }
});

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.TEXT, allowNull: false }
});

User.hasMany(Document, { foreignKey: 'userId' });
Document.belongsTo(User, { foreignKey: 'userId' });

Document.hasMany(Comment, { foreignKey: 'documentId' });
Comment.belongsTo(Document, { foreignKey: 'documentId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

async function init() { await sequelize.sync(); }

module.exports = { sequelize, User, Document, Comment, init };