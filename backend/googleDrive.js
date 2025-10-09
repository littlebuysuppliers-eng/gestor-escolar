// backend/googleDrive.js
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// Scopes necesarios para subir archivos y crear carpetas
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Autenticación usando la variable de entorno GOOGLE_SERVICE_ACCOUNT
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: SCOPES
});

// Instancia de la API de Drive
const drive = google.drive({ version: 'v3', auth });

/**
 * Crear una carpeta en Google Drive
 * @param {string} name - Nombre de la carpeta
 * @param {string} parentId - ID de la carpeta padre (opcional)
 * @returns {string} ID de la carpeta creada
 */
export async function createFolder(name, parentId) {
  try {
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    };
    const res = await drive.files.create({ resource: fileMetadata, fields: 'id' });
    return res.data.id;
  } catch (err) {
    console.error('Error creando carpeta en Drive:', err);
    throw err;
  }
}

/**
 * Subir un archivo a Google Drive dentro de una carpeta
 * @param {string} fileName - Nombre del archivo
 * @param {string} folderId - ID de la carpeta destino
 * @param {Buffer} fileBuffer - Contenido del archivo en buffer
 * @returns {string} ID del archivo subido
 */
export async function uploadFile(fileName, folderId, fileBuffer) {
  try {
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
  } catch (err) {
    console.error('Error subiendo archivo a Drive:', err);
    throw err;
  }
}

// Alias para mantener compatibilidad con tu import actual
export { uploadFile as uploadToDrive };
