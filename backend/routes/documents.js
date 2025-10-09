const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');
const router = express.Router();
const { Document } = require('../models');
const { authMiddleware } = require('../auth');

const upload = multer({ storage: multer.memoryStorage() });

// === Configuración Google Drive ===
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  })
});

const FOLDER_ID = process.env.GDRIVE_FOLDER_ID; // agrega en Render el ID de tu carpeta

// === Subir archivo a Google Drive ===
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
    const { newName } = req.body;
    const finalName = newName?.trim() || req.file.originalname;

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const response = await drive.files.create({
      requestBody: {
        name: finalName,
        parents: [FOLDER_ID]
      },
      media: {
        mimeType: req.file.mimetype,
        body: bufferStream
      },
      fields: 'id, webViewLink, webContentLink'
    });

    const { id, webViewLink, webContentLink } = response.data;

    const file = await Document.create({
      name: finalName,
      url: webViewLink,
      userId: req.user.id
    });

    res.json({ ...file.toJSON(), driveId: id, download: webContentLink });
  } catch (err) {
    console.error('Error al subir a Drive:', err);
    res.status(500).json({ error: 'Error al subir archivo a Google Drive' });
  }
});

module.exports = router;
