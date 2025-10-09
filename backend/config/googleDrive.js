const { google } = require('googleapis');
const fs = require('fs');

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

const driveService = google.drive({ version: 'v3', auth });

async function uploadFile(filePath, fileName, mimeType) {
  const fileMetaData = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await driveService.files.create({
    resource: fileMetaData,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  return response.data; // devuelve { id, webViewLink, webContentLink }
}

module.exports = { uploadFile };
