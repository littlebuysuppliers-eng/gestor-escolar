const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { Document, User } = require('../models');

const router = express.Router();

// =======================
// Middleware de autenticación
// =======================
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token requerido' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// =======================
// Configuración de Multer (subidas)
// =======================
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// =======================
// Subir archivo (profesor)
// =======================
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { user } = req;
    if (!req.file) return res.status(400).json({ error: 'No se envió archivo' });

    const fileUrl = `/uploads/${req.file.filename}`;
    const doc = await Document.create({
      name: req.file.originalname,
      url: fileUrl,
      userId: user.id,
    });

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
});

// =======================
// Archivos del profesor logueado
// =======================
router.get('/me', auth, async (req, res) => {
  try {
    const files = await Document.findAll({ where: { userId: req.user.id } });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener archivos' });
  }
});

// =======================
// Archivos de un profesor (solo director)
// =======================
router.get('/:teacherId', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const requester = await User.findByPk(req.user.id);

    if (requester.role !== 'director') {
      return res.status(403).json({ error: 'Solo el director puede ver archivos de otros usuarios' });
    }

    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    const files = await Document.findAll({ where: { userId: teacherId } });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener archivos del profesor' });
  }
});

module.exports = router;
