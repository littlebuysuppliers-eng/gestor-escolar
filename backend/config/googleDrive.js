const { google } = require('googleapis');
const fs = require('fs');

// Detecta si la variable existe
const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT || process.env.GOOGLE_CREDENTIALS;

if (!rawCredentials) {
  console.error('❌ ERROR: No se encontró ninguna variable GOOGLE_SERVICE_ACCOUNT ni GOOGLE_CREDENTIALS.');
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(rawCredentials);
} catch (err) {
  console.error('❌ ERROR: La variable de Google Service Account no contiene un JSON válido.');
  console.error('Detalle:', err.message);
  process.exit(1);
}

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

const driveService = google.drive({ version: 'v3', auth });

async function uploadFile(filePath, fileName, mimeType) {
  try {
    const fileMetaData = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await driveService.files.create({
      resource: fileMetaData,
      media,
      fields: 'id, webViewLink, webContentLink',
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error al subir archivo a Google Drive:', error);
    throw error;
  }
}

module.exports = { uploadFile };
