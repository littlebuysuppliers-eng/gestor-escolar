const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const MAIN_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID || null;

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.warn('WARNING: GOOGLE_SERVICE_ACCOUNT not set. Drive will not work until provided.');
}

const credentials = process.env.GOOGLE_SERVICE_ACCOUNT ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT) : null;
const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
const drive = google.drive({ version: 'v3', auth });

async function findFolderByName(name, parentId) {
  const q = `${parentId ? `'${parentId}' in parents and ` : ''}mimeType='application/vnd.google-apps.folder' and name='${name.replace("'", "\'")}' and trashed=false`;
  const res = await drive.files.list({ q, fields: 'files(id, name)' });
  if (res.data.files && res.data.files.length) return res.data.files[0].id;
  return null;
}

async function createFolder(name, parentId) {
  const metadata = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) metadata.parents = [parentId];
  const res = await drive.files.create({ requestBody: metadata, fields: 'id' });
  return res.data.id;
}

async function ensureFolder(name, parentId) {
  let id = null;
  try { id = await findFolderByName(name, parentId); } catch(e){/*ignore*/ }
  if (id) return id;
  return await createFolder(name, parentId);
}

async function uploadFile(fileName, folderId, buffer, mimeType='application/octet-stream') {
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Buffer.from(buffer) },
    fields: 'id, name'
  });
  const id = res.data.id;
  return { id, name: res.data.name, downloadLink: `https://drive.google.com/uc?export=download&id=${id}` };
}

async function renameFile(fileId, newName) {
  const res = await drive.files.update({ fileId, requestBody: { name: newName }, fields: 'id, name' });
  return res.data;
}

async function deleteFile(fileId) {
  await drive.files.delete({ fileId });
  return true;
}

module.exports = { ensureFolder, uploadFile, renameFile, deleteFile, MAIN_FOLDER_ID };
