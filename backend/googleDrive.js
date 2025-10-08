const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Ruta al JSON de la cuenta de servicio (asegúrate de que el archivo exista)
const KEYFILEPATH = path.join(__dirname, "service-account.json");

// ID de la carpeta en Google Drive
const FOLDER_ID = "13J6veloK9YmCaCFACxCXrrK6ZbDemZdA";

// Autenticación con Google
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const driveService = google.drive({ version: "v3", auth });

// Subida de archivo a Google Drive
async function uploadFileToDrive(filePath, fileName) {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [FOLDER_ID],
    };

    const media = {
      mimeType: "application/octet-stream",
      body: fs.createReadStream(filePath),
    };

    const response = await driveService.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name, webViewLink, webContentLink",
    });

    // Borrar archivo temporal del servidor
    fs.unlinkSync(filePath);

    return {
      id: response.data.id,
      name: response.data.name,
      viewLink: response.data.webViewLink,
      downloadLink: `https://drive.google.com/uc?export=download&id=${response.data.id}`,
    };
  } catch (error) {
    console.error("❌ Error al subir archivo a Drive:", error);
    throw new Error("Error al subir archivo a Google Drive");
  }
}

module.exports = { uploadFileToDrive };
