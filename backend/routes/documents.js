const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { ensureFolder, uploadFile, renameFile, deleteFile, MAIN_FOLDER_ID } = require('../googleDrive');
const { User, Document } = require('../models');

const upload = multer({ dest: path.join(__dirname, '..', 'tmp') });

// Auth middleware - verify JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    User.findByPk(decoded.id).then(user => {
      if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
      req.user = user;
      next();
    }).catch(err => res.status(500).json({ error: 'DB error' }));
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Archivo requerido' });

    // ensure user folder in Drive (by full name)
    const folderName = `${req.user.firstName}_${req.user.lastP}_${req.user.id}`;
    const parent = MAIN_FOLDER_ID || null;
    const folderId = await ensureFolder(folderName, parent);

    const fullPath = path.join(__dirname, '..', file.path);
    const buffer = fs.readFileSync(fullPath);
    const driveRes = await uploadFile(file.originalname, folderId, buffer);

    // save record
    const doc = await Document.create({
      title: file.originalname,
      driveFileId: driveRes.id,
      driveDownloadLink: driveRes.downloadLink,
      userId: req.user.id
    });

    // remove temp
    try { fs.unlinkSync(fullPath); } catch(e){}

    res.json({ success: true, document: doc });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Error al subir' });
  }
});

// List documents for current user (professor) or grouped for director
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'director') {
      const teachers = await User.findAll({ where: { role: 'teacher' }, include: [{ model: Document, as: 'documents' }] });
      const grouped = {};
      teachers.forEach(t => {
        grouped[t.firstName + ' ' + t.lastP] = t.documents || [];
      });
      return res.json({ byName: grouped });
    } else {
      const docs = await req.user.getDocuments({ order: [['createdAt','DESC']] });
      return res.json({ documents: docs });
    }
  } catch (err) {
    console.error('Get docs error:', err);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// Rename
router.post('/rename', authMiddleware, async (req, res) => {
  try {
    const { documentId, newTitle } = req.body;
    if (!documentId || !newTitle) return res.status(400).json({ error: 'Faltan campos' });

    const doc = await Document.findByPk(documentId);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    if (req.user.role !== 'director' && doc.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await renameFile(doc.driveFileId, newTitle);
    doc.title = newTitle;
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Rename error:', err);
    res.status(500).json({ error: 'Error al renombrar' });
  }
});

// Delete
router.post('/delete', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'Falta id' });

    const doc = await Document.findByPk(documentId);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    if (req.user.role !== 'director' && doc.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await deleteFile(doc.driveFileId);
    await doc.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;
