import { google } from 'googleapis';

// Lee el JSON desde la variable de entorno
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// ID de la carpeta principal en Drive (creada por ti)
const MAIN_FOLDER_ID = '13J6veloK9YmCaCFACxCXrrK6ZbDemZdA';

/**
 * Sube un archivo a Google Drive dentro de una subcarpeta por usuario
 * @param {string} userId - ID del usuario
 * @param {object} file - archivo cargado (req.file)
 */
export async function uploadToDrive(userId, file) {
  try {
    // Busca o crea la carpeta del usuario
    const folderName = `usuario_${userId}`;
    const folderId = await ensureUserFolder(folderName);

    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: file.buffer ? file.buffer : fs.createReadStream(file.path),
      },
      fields: 'id, name, webViewLink',
    });

    return response.data;
  } catch (error) {
    console.error('Error al subir a Google Drive:', error);
    throw error;
  }
}

/**
 * Asegura que exista una subcarpeta por usuario
 */
async function ensureUserFolder(folderName) {
  const res = await drive.files.list({
    q: `'${MAIN_FOLDER_ID}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [MAIN_FOLDER_ID],
    },
    fields: 'id',
  });

  return folder.data.id;
}
