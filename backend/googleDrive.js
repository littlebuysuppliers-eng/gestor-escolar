// backend/googleDrive.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const KEYFILEPATH = path.join(__dirname, "service-account.json"); // <-- coloca aquí tu JSON
const ROOT_FOLDER_ID = "13J6veloK9YmCaCFACxCXrrK6ZbDemZdA"; // carpeta principal (la que compartiste)
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

// Crea una carpeta dentro de parentId con nombre folderName. Devuelve el id.
async function createFolder(folderName, parentId = ROOT_FOLDER_ID) {
  try {
    const res = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id, name",
    });
    return res.data.id;
  } catch (err) {
    console.error("createFolder error:", err);
    throw err;
  }
}

// Busca una carpeta con ese nombre bajo parentId. Devuelve id o null.
async function findFolderId(folderName, parentId = ROOT_FOLDER_ID) {
  try {
    const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace("'", "\\'")}' and trashed = false`;
    const res = await drive.files.list({ q, fields: "files(id, name)" });
    if (res.data.files && res.data.files.length > 0) return res.data.files[0].id;
    return null;
  } catch (err) {
    console.error("findFolderId error:", err);
    throw err;
  }
}

// Devuelve un folderId: si existe lo retorna, si no lo crea.
async function ensureFolder(folderName, parentId = ROOT_FOLDER_ID) {
  const found = await findFolderId(folderName, parentId);
  if (found) return found;
  return await createFolder(folderName, parentId);
}

// Sube archivo físico (filePath) a la carpeta driveFolderId con el nombre fileName.
// Retorna { id, name, downloadLink }
async function uploadFileToFolder(filePath, fileName, driveFolderId) {
  try {
    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [driveFolderId],
      },
      media: {
        mimeType: "application/octet-stream",
        body: fs.createReadStream(filePath),
      },
      fields: "id, name",
    });

    // Eliminar temporal
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    const fileId = res.data.id;
    const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return { id: fileId, name: res.data.name, downloadLink };
  } catch (err) {
    console.error("uploadFileToFolder error:", err);
    throw err;
  }
}

// Renombra un archivo en Drive
async function renameDriveFile(fileId, newName) {
  try {
    const res = await drive.files.update({
      fileId,
      requestBody: { name: newName },
      fields: "id, name",
    });
    return res.data;
  } catch (err) {
    console.error("renameDriveFile error:", err);
    throw err;
  }
}

module.exports = {
  ensureFolder,
  uploadFileToFolder,
  renameDriveFile,
  ROOT_FOLDER_ID,
};
