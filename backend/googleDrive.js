import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: SCOPES
});

const drive = google.drive({ version: 'v3', auth });

// Crear carpeta
export async function createFolder(name, parentId) {
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : []
  };
  const res = await drive.files.create({ resource: fileMetadata, fields: 'id' });
  return res.data.id;
}

// Subir archivo
export async function uploadFile(fileName, folderId, fileBuffer) {
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
