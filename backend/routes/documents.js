const express = require('express');
const multer = require('multer');
const router = express.Router();
const { Document } = require('../models');
const { authMiddleware } = require('../auth');
const fs = require('fs');
const { google } = require('googleapis');

// === Cargar credenciales desde Secret File de Render ===
const credPath = '/etc/secrets/GOOGLE_CREDENTIALS.json';
if (!fs.existsSync(credPath)) {
  console.error('❌ Archivo de credenciales no encontrado en /etc/secrets/GOOGLE_CREDENTIALS.json');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

// === Multer en memoria ===
const storage = multer.memoryStorage();
const upload = multer({ storage });

// === ID de tu Shared Drive ===
const SHARED_DRIVE_ID = process.env.GOOGLE_DRIVE_FOLDER_ID; // <- agregar en Render como variable de entorno

// === Subir archivo a Google Drive (Shared Drive) ===
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const { newName } = req.body;
    const fileName = newName?.trim() || req.file.originalname;

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: req.file.mimetype,
        parents: [SHARED_DRIVE_ID] // <- Shared Drive
      },
      media: {
        mimeType: req.file.mimetype,
        body: Buffer.from(req.file.buffer)
      },
      supportsAllDrives: true // obligatorio para Shared Drives
    });

    // Hacer el archivo público
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
      supportsAllDrives: true
    });

    const fileUrl = `https://drive.google.com/uc?id=${response.data.id}&export=download`;

    const file = await Document.create({
      name: fileName,
      url: fileUrl,
      userId: req.user.id
    });

    res.json(file);
  } catch (err) {
    console.error('Error al subir archivo:', err.response?.data || err);
    res.status(500).json({ error: 'Error al subir archivo', details: err.response?.data });
  }
});

// === Listar archivos del profesor ===
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const files = await Document.findAll({ where: { userId: req.user.id } });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener archivos' });
  }
});

// === Listar archivos de un profesor (solo director) ===
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'director') return res.status(403).json({ error: 'Acceso denegado' });
    const files = await Document.findAll({ where: { userId: req.params.userId } });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener archivos del profesor' });
  }
});

module.exports = router;
