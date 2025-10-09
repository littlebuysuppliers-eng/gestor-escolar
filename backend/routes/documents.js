const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { Document } = require('../models');
const { authMiddleware } = require('../auth');

// === Carpeta de uploads ===
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Multer ===
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    // Guardamos temporalmente con timestamp
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// === Subir archivo ===
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const { newName } = req.body; // nombre opcional que envía el frontend
    const finalName = newName?.trim() || req.file.originalname;
    
    // Renombrar archivo físicamente
    const finalPath = path.join(uploadDir, Date.now() + '-' + finalName);
    fs.renameSync(req.file.path, finalPath);

    const file = await Document.create({
      name: finalName,
      url: `/uploads/${path.basename(finalPath)}`,
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
    if (req.user.role !== 'director') return res.status(403).json({ error: 'Acceso denegado' });
    const files = await Document.findAll({ where: { userId: req.params.userId } });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener archivos del profesor' });
  }
});

// === Renombrar archivo ===
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await Document.findByPk(req.params.id);
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });
    if (file.userId !== req.user.id && req.user.role !== 'director')
      return res.status(403).json({ error: 'No tienes permiso' });

    const { newName } = req.body;
    if (!newName || !newName.trim()) return res.status(400).json({ error: 'Nombre inválido' });

    // Renombrar físicamente
    const oldPath = path.join(uploadDir, path.basename(file.url));
    const newPath = path.join(uploadDir, Date.now() + '-' + newName.trim());
    fs.renameSync(oldPath, newPath);

    file.name = newName.trim();
    file.url = `/uploads/${path.basename(newPath)}`;
    await file.save();

    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al renombrar archivo' });
  }
});

module.exports = router;
