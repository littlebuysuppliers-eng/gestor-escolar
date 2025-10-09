import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: SCOPES
});
const drive = google.drive({ version: 'v3', auth });

export const MAIN_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID;

// Crear carpeta si no existe
export async function ensureFolder(name, parentId) {
  // Buscar carpeta existente
  const res = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId || MAIN_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name)'
  });
  if (res.data.files.length > 0) return res.data.files[0].id;

  // Crear carpeta
  const folderMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : [MAIN_FOLDER_ID]
  };
  const folder = await drive.files.create({ resource: folderMetadata, fields: 'id' });
  return folder.data.id;
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

  // Construir link de descarga
  const downloadLink = `https://drive.google.com/uc?id=${res.data.id}&export=download`;
  return { id: res.data.id, downloadLink };
}

// Renombrar archivo
export async function renameFile(fileId, newTitle) {
  await drive.files.update({
    fileId,
    requestBody: { name: newTitle }
  });
}

// Eliminar archivo
export async function deleteFile(fileId) {
  await drive.files.delete({ fileId });
}
