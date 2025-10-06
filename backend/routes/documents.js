const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, roleRequired } = require('../auth'); // Import correcto
const { Document } = require('../models'); // Ajusta según tu modelo

// Configuración de multer
const upload = multer({ dest: 'uploads/' });

// Subir archivo (solo profesores)
router.post(
  '/upload',
  authMiddleware,
  roleRequired(['teacher']),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const document = await Document.create({
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      userId: req.user.id
    });

    res.json({ success: true, document });
  }
);

// Listar documentos del usuario autenticado
router.get('/', authMiddleware, async (req, res) => {
  const docs = await Document.findAll({ where: { userId: req.user.id } });
  res.json({ documents: docs });
});

module.exports = router;
