import { google } from 'googleapis';

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });
const MAIN_FOLDER_ID = '13J6veloK9YmCaCFACxCXrrK6ZbDemZdA';

// Crear subcarpeta por usuario y subir archivo
export async function uploadToDrive(userId, file) {
  const folderName = `usuario_${userId}`;
  const folderId = await ensureUserFolder(folderName);

  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [folderId],
    },
    media: {
      mimeType: file.mimetype,
      body: file.buffer,
    },
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

async function ensureUserFolder(folderName) {
  const res = await drive.files.list({
    q: `'${MAIN_FOLDER_ID}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) return res.data.files[0].id;

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
