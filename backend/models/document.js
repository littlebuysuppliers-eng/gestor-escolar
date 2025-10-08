const { DataTypes } = require("sequelize");
const sequelize = require("./index").sequelize;

const Document = sequelize.define("Document", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filepath: {
    type: DataTypes.STRING, // Guardará el enlace de Google Drive
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "Pendiente",
  },
});

module.exports = Document;
