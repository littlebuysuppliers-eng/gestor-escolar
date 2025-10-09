const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: SCOPES
});
const drive = google.drive({ version: 'v3', auth });

// Crear carpeta
async function createFolder(name, parentId) {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    },
    fields: 'id'
  });
  return res.data.id;
}

// Subir archivo
async function uploadFile(fileName, folderId, fileBuffer) {
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType: 'application/octet-stream',
      body: Buffer.from(fileBuffer)
    },
    fields: 'id'
  });
  return res.data.id;
}

// Eliminar archivo
async function deleteFile(fileId) {
  await drive.files.delete({ fileId });
}

module.exports = { createFolder, uploadFile, deleteFile };
