// backend/utils/googleDrive.js
import { google } from 'googleapis';

let driveService = null;

/**
 * Inicializa el cliente de Google Drive.
 */
function getDriveService() {
  if (!driveService) {
    try {
      const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

      console.log("✅ Service account cargado correctamente:", serviceAccount.client_email || "No email detectado");

      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      driveService = google.drive({ version: 'v3', auth });

      console.log("✅ Cliente de Google Drive inicializado correctamente");

    } catch (error) {
      console.error("❌ Error al inicializar Google Drive:", error.message);
      if (error.stack) console.error(error.stack);
    }
  }
  return driveService;
}

/**
 * Sube un archivo a la carpeta del profesor (por nombre completo).
 */
export async function uploadToDrive(file, professorName) {
  try {
    console.log(`📂 Iniciando subida del archivo: ${file.originalname} por ${professorName}`);

    const drive = getDriveService();
    if (!drive) throw new Error("No se pudo inicializar Google Drive");

    const rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID;
    if (!rootFolderId) throw new Error("Falta la variable DRIVE_ROOT_FOLDER_ID");

    console.log("📁 ID de carpeta raíz:", rootFolderId);

    // Crear o encontrar carpeta del profesor
    const folderId = await getOrCreateFolder(drive, professorName, rootFolderId);
    console.log(`📁 Carpeta del profesor "${professorName}" → ID: ${folderId}`);

    const fileMetadata = {
      name: file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: file.buffer ? BufferToStream(file.buffer) : null,
    };

    console.log(`⬆️ Subiendo archivo "${file.originalname}"...`);

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    console.log("✅ Archivo subido exitosamente:", response.data.webViewLink);
    return response.data;

  } catch (error) {
    console.error("❌ Error al subir archivo a Google Drive:", error.message);
    if (error.response?.data) {
      console.error("Detalles del error:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Elimina un archivo de Drive por ID.
 */
export async function deleteFileFromDrive(fileId) {
  try {
    const drive = getDriveService();
    if (!drive) throw new Error("No se pudo inicializar Google Drive");

    console.log(`🗑️ Eliminando archivo con ID: ${fileId}`);
    await drive.files.delete({ fileId });
    console.log("✅ Archivo eliminado correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error.message);
    throw error;
  }
}

/**
 * Busca o crea carpeta del profesor.
 */
async function getOrCreateFolder(drive, folderName, parentId) {
  try {
    console.log(`🔍 Buscando carpeta "${folderName}"...`);
    const res = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (res.data.files.length > 0) {
      console.log("📁 Carpeta encontrada:", res.data.files[0].id);
      return res.data.files[0].id;
    }

    console.log("📂 Carpeta no encontrada. Creando nueva...");
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };
    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });
    console.log("✅ Carpeta creada:", folder.data.id);
    return folder.data.id;

  } catch (error) {
    console.error("❌ Error al obtener/crear carpeta:", error.message);
    throw error;
  }
}

/**
 * Convierte un buffer a stream.
 */
function BufferToStream(buffer) {
  import { Readable } from 'stream';
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
