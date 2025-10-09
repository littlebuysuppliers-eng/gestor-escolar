const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];
if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.warn('WARNING: GOOGLE_SERVICE_ACCOUNT not set in environment. Drive functions will fail until provided.');
}
const credentials = process.env.GOOGLE_SERVICE_ACCOUNT ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT) : null;

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES
});

const drive = google.drive({ version: 'v3', auth });

// createFolder and uploadFile (CommonJS exports)
async function createFolder(name, parentId) {
  try {
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    };
    const res = await drive.files.create({ requestBody: fileMetadata, fields: 'id' });
    return res.data.id;
  } catch (err) {
    console.error('Error creating folder:', err);
    throw err;
  }
}

async function uploadFile(fileName, folderId, fileBuffer) {
  try {
    const res = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType: 'application/octet-stream', body: Buffer.from(fileBuffer) },
      fields: 'id, webViewLink'
    });
    const id = res.data.id;
    const downloadLink = `https://drive.google.com/uc?export=download&id=${id}`;
    return { id, downloadLink, name: res.data.name };
  } catch (err) {
    console.error('Error uploading file:', err);
    throw err;
  }
}

module.exports = { createFolder, uploadFile };
