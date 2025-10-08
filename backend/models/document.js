// backend/models/documents.js
// Este archivo sirve como helper para queries relacionadas con documents.
const db = require("../models");

async function createDocument({ title, driveFileId, driveDownloadLink, userId, status = "Pendiente" }) {
  const res = await db.run(
    `INSERT INTO documents (title, driveFileId, driveDownloadLink, userId, status) VALUES (?,?,?,?,?)`,
    [title, driveFileId, driveDownloadLink, userId, status]
  );
  return { id: res.lastID, title, driveFileId, driveDownloadLink, userId, status };
}

async function getDocumentsByUser(userId) {
  return await db.all(`SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC`, [userId]);
}

module.exports = { createDocument, getDocumentsByUser };
