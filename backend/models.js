const { Sequelize, DataTypes } = require('sequelize');

// === Inicializar base de datos SQLite ===
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

// === Modelo Usuario ===
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('teacher','director'), allowNull: false }
});

// === Modelo Documento ===
const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },   // coincide con documents.js
  url: { type: DataTypes.STRING, allowNull: false },    // coincide con documents.js
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: { type: DataTypes.ENUM('pending','reviewed','approved','rejected'), defaultValue: 'pending' }
});

// === Modelo Comentario ===
const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.TEXT, allowNull: false }
});

// === Relaciones ===
User.hasMany(Document, { foreignKey: 'userId' });
Document.belongsTo(User, { foreignKey: 'userId' });

Document.hasMany(Comment, { foreignKey: 'documentId' });
Comment.belongsTo(Document, { foreignKey: 'documentId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// === Inicializar base de datos ===
async function init() {
  await sequelize.sync();
}

module.exports = { sequelize, User, Document, Comment, init };
