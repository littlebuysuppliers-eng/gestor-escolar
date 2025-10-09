const express = require('express');
const router = express.Router();
const multer = require('multer');
const { User, Document } = require('../models');
const { createFolder, uploadFile, deleteFile } = require('../googleDrive');

// Config multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Subir archivo
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findByPk(userId);
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    // Crear carpeta por profesor si no existe
    let folderId = user.driveFolderId;
    if (!folderId) {
      folderId = await createFolder(user.name);
      user.driveFolderId = folderId;
      await user.save();
    }

    const fileId = await uploadFile(req.file.originalname, folderId, req.file.buffer);
    await Document.create({ userId, title: req.file.originalname, driveFileId: fileId });

    res.json({ message: 'Archivo subido', fileId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

// Listar archivos de un profesor
router.get('/user/:id', async (req, res) => {
  const docs = await Document.findAll({ where: { userId: req.params.id } });
  res.json(docs);
});

// Eliminar archivo
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(400).json({ error: 'Archivo no encontrado' });

    if (doc.driveFileId) await deleteFile(doc.driveFileId);
    await doc.destroy();

    res.json({ message: 'Archivo eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});

module.exports = router;
