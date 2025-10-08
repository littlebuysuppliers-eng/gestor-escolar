const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { Document } = require('../models');
const { authMiddleware } = require('../auth');

// === Configurar carpeta de uploads ===
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Configurar Multer ===
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// === Subir archivo (profesor) ===
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const file = await Document.create({
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      userId: req.user.id
    });

    res.json(file);
  } catch (err) {
    console.error('Error al subir archivo:', err);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

// === Obtener archivos del profesor autenticado ===
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const files = await Document.findAll({ where: { userId: req.user.id } });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener archivos' });
  }
});

// === Obtener archivos de un profesor (solo director) ===
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const files = await Document.findAll({ where: { userId: req.params.userId } });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener archivos del profesor' });
  }
});

module.exports = router;
